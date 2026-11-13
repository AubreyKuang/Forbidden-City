// Deterministic NPC memory. Store the ledger with the game's save data.
const NPCMemory = (() => {
  const SHORT_LIMIT = 96;
  const LONG_LIMIT = 160;
  const LIFE_LIMIT = 24;
  const SOURCE_LIMIT = 6;
  const LANDMARKS = new Set(['first', 'wish', 'hurt', 'child-journey', 'mother-appeal', 'palace-romance', 'temple-retreat']);
  const WEIGHTS = { emotion: .35, relationship: .2, impact: .25, novelty: .1, goal: .1 };
  const ledgers = new WeakMap();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const empty = () => ({ short: [], long: [], life: [] });

  function ledger(world) {
    const data = world.npcMemory ||= { version: 2, sequence: 0, events: {}, people: {} };
    upgrade(world);
    return data;
  }

  const entries = memory => [...memory.short, ...memory.long,
    ...memory.life.filter(entry => entry.archived)];
  const priority = entry => entry.importance + (entry.landmark ? 30 : 0);
  const ranked = (a, b) => priority(b) - priority(a) || b.sequence - a.sequence;
  const sameMeaning = (a, b) => a.subject === b.subject && a.type === b.type &&
    Math.sign(a.emotion) === Math.sign(b.emotion) && a.channel === b.channel &&
    JSON.stringify(a.interpretation) === JSON.stringify(b.interpretation);

  function merge(a, b) {
    const first = (a.firstSequence ?? a.sequence) <= (b.firstSequence ?? b.sequence) ? a : b;
    const last = a.sequence > b.sequence ? a : b;
    const na = a.occurrences || 1, nb = b.occurrences || 1;
    const sources = [...new Set([...a.sources, ...b.sources])]
      .sort((x, y) => Number(x.slice(6)) - Number(y.slice(6)));
    return { ...last, sources: sources.length <= SOURCE_LIMIT ? sources : [...sources.slice(0, 2), ...sources.slice(-4)],
      firstTime: first.firstTime ?? first.time, firstSequence: first.firstSequence ?? first.sequence,
      occurrences: na + nb, emotion: (a.emotion * na + b.emotion * nb) / (na + nb),
      importance: Math.max(a.importance, b.importance), confidence: Math.min(a.confidence, b.confidence),
      ...(a.landmark || b.landmark ? { landmark: true } : {}) };
  }

  function archive(memory, entry) {
    const previous = memory.life.find(item => sameMeaning(item, entry));
    memory.life = memory.life.filter(item => item !== previous);
    memory.life.push({ ...(previous ? merge(previous, entry) : entry), archived: true });
    memory.life.sort(ranked);
    memory.life.length = Math.min(LIFE_LIMIT, memory.life.length);
  }

  function upgrade(world) {
    const data = world.npcMemory;
    if (!data || data.version >= 2) return;
    for (const memory of Object.values(data.people)) {
      // v1 life entries copied live long-term memories. Do not count them twice.
      const retained = new Set([...memory.short, ...memory.long].flatMap(entry => entry.sources));
      const legacy = memory.life.filter(entry => !entry.sources.every(id => retained.has(id)));
      memory.life = [];
      for (const entry of [...memory.short, ...memory.long]) {
        if (LANDMARKS.has(entry.type)) entry.landmark = true;
      }
      for (const entry of legacy) {
        const source = data.events[entry.sources.at(-1)];
        archive(memory, { ...entry, type: source?.type || 'legacy-summary', subject: 'unknown',
          sequence: source?.sequence || 0, time: source?.time || 0,
          emotion: 0, confidence: 0, importance: 60, channel: 'legacy' });
      }
    }
    data.version = 2;
    ledgers.delete(data);
  }

  function index(data, person) {
    if (!ledgers.has(data)) ledgers.set(data, new Map());
    const people = ledgers.get(data);
    if (!people.has(person)) {
      const bySubject = new Map();
      const memory = Object.hasOwn(data.people, person) ? data.people[person] : empty();
      for (const entry of entries(memory)) {
        if (!bySubject.has(entry.subject)) bySubject.set(entry.subject, []);
        bySubject.get(entry.subject).push(entry);
      }
      people.set(person, bySubject);
    }
    return people.get(person);
  }

  function promote(memory, entry) {
    const previous = [...memory.long, ...memory.life].find(item => sameMeaning(item, entry));
    if (previous) {
      entry = merge(previous, entry);
      memory.long = memory.long.filter(item => item !== previous);
      memory.life = memory.life.filter(item => item !== previous);
    }
    delete entry.archived;
    memory.long.push(entry);
    memory.long.sort(ranked);
    while (memory.long.length > LONG_LIMIT) archive(memory, memory.long.pop());
  }

  function remember(data, event, view) {
    const person = String(view.person);
    if (!Object.hasOwn(data.people, person)) {
      Object.defineProperty(data.people, person, { value: empty(), enumerable: true });
    }
    const memory = data.people[person];
    const subject = String(view.subject);
    const related = index(data, person).get(subject) || [];
    const confidence = clamp(view.confidence ?? 1, 0, 1);
    const signals = {
      emotion: Math.abs(view.emotion ?? 0) * 100,
      relationship: view.relationship ?? 50,
      impact: view.impact ?? 50,
      novelty: related.some(entry => entry.type === event.type) ? 15 : 90,
      goal: view.goal ?? 50
    };
    const importance = Math.round(Object.entries(WEIGHTS).reduce(
      (total, [key, weight]) => total + clamp(signals[key], 0, 100) * weight, 0));
    if (importance < 25) return;
    const entry = {
      sources: [event.id], sequence: event.sequence, time: event.time,
      type: event.type, subject, interpretation: view.interpretation,
      emotion: view.emotion ?? 0, confidence, importance, channel: view.channel || 'participant',
      ...(view.landmark || factsLandmark(event, signals, view) ? { landmark: true } : {})
    };
    if (importance >= 72 || entry.landmark || [...memory.long, ...memory.life].some(item => sameMeaning(item, entry))) {
      promote(memory, entry);
    } else {
      memory.short.push(entry);
      const similar = memory.short.filter(item => sameMeaning(item, entry));
      if (similar.length >= 3) {
        const merged = {
          ...similar.reduce(merge), importance: Math.max(60, ...similar.map(item => item.importance))
        };
        memory.short = memory.short.filter(item => !similar.includes(item));
        promote(memory, merged);
      }
      while (memory.short.length > SHORT_LIMIT) {
        memory.short.sort((a, b) => priority(a) - priority(b) || a.sequence - b.sequence);
        const oldest = memory.short.shift();
        if (oldest.importance >= 62) promote(memory, oldest);
        else archive(memory, oldest);
      }
    }
    ledgers.get(data).delete(person);
  }

  function factsLandmark(event, signals, view) {
    return event.landmark || LANDMARKS.has(event.type) || (signals.impact >= 90 && Math.abs(view.emotion ?? 0) >= .8);
  }

  function record(world, facts, views) {
    const data = ledger(world);
    const sequence = facts.sequence ?? data.sequence + 1;
    // Events arrive in order. The watermark also rejects duplicates after compaction.
    if (sequence <= data.sequence) return null;
    if (sequence !== data.sequence + 1) throw new Error('NPC memory event sequence gap');
    const event = { ...facts, id: `event-${sequence}`, sequence };
    data.sequence = sequence;
    data.events[event.id] = event;
    const observers = new Set();
    for (const view of views) {
      const person = String(view.person);
      if (observers.has(person)) continue;
      observers.add(person);
      remember(data, event, view);
    }
    // Keep all retained memory sources and the most recent objective events.
    if (sequence % 64 === 0) {
      const retained = new Set(Object.values(data.people).flatMap(memory =>
        entries(memory).flatMap(entry => entry.sources)));
      for (const [id, source] of Object.entries(data.events)) {
        if (source.sequence <= sequence - 64 && !retained.has(id)) delete data.events[id];
      }
    }
    return event;
  }

  function influence(world, person, subject) {
    if (!world.npcMemory) return 0;
    const entries = index(world.npcMemory, String(person)).get(String(subject)) || [];
    return clamp(entries.reduce((total, entry) =>
      total + entry.emotion * entry.confidence * entry.importance / 100 *
        (entry.importance >= 60 ? 2 : 1), 0), -4, 4);
  }

  function recall(world, person, { subject, type, limit = Infinity } = {}) {
    const memory = world.npcMemory?.people[String(person)];
    return memory ? entries(memory)
      .filter(entry => (subject == null || entry.subject === String(subject)) && (type == null || entry.type === type))
      .sort((a, b) => b.sequence - a.sequence).slice(0, Math.max(0, limit)) : [];
  }

  return { record, influence, recall, upgrade,
    limits: Object.freeze({ short: SHORT_LIMIT, long: LONG_LIMIT, life: LIFE_LIMIT, sources: SOURCE_LIMIT }) };
})();


'use strict';
