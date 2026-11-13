const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, scripts } = require('./game-scripts.cjs');
const memorySource = read('js/npc-memory.js');
function runtime(extra = {}) {
  const context = vm.createContext(extra);
  vm.runInContext(memorySource, context);
  context.memory = vm.runInContext('NPCMemory', context);
  return context;
}
function emit(ctx, world, options = {}) {
  return ctx.memory.record(world, {type:'gift', time:12}, [
    {person:'alice',subject:'bob',interpretation:'Bob helped me',emotion:.4,impact:50,...options}
  ]);
}
function loadFunction(ctx, source, name, next) {
  const start = source.lastIndexOf('function ' + name + '(');
  const finish = source.indexOf(next, start + 1);
  assert.ok(start >= 0 && finish > start, 'function extraction boundary');
  vm.runInContext(source.slice(start, finish), ctx);
}
test('all entry-point scripts parse', () => {
  assert.ok(scripts.length > 0);
});
test('independent perspectives, unknown observers, duplicate event and sequence gap', () => {
  const ctx=runtime(), world={};
  const event=ctx.memory.record(world,{type:'argue',time:1},[
    {person:'alice',subject:'bob',interpretation:'I confronted Bob',emotion:-1,impact:100},
    {person:'bob',subject:'alice',interpretation:'Alice confronted me',emotion:-.6,impact:90}
  ]);
  assert.notEqual(ctx.memory.recall(world,'alice')[0].interpretation,ctx.memory.recall(world,'bob')[0].interpretation);
  assert.equal(ctx.memory.recall(world,'diana').length,0);
  const before=JSON.stringify(world);
  assert.equal(ctx.memory.record(world,event,[]),null);
  assert.equal(JSON.stringify(world),before);
  assert.throws(()=>ctx.memory.record(world,{sequence:3},[]),/sequence gap/);
  assert.equal(JSON.stringify(world),before);
});
test('structured interpretations survive consolidation', () => {
  const ctx=runtime(), world={};
  for(let i=0;i<3;i++) emit(ctx,world,{interpretation:{type:'gift',object:'cookie'}});
  const entry=world.npcMemory.people.alice.long[0];
  assert.ok(entry);
  assert.equal(typeof entry.interpretation,'object');
  assert.equal(entry.interpretation.object,'cookie');
  assert.equal(entry.sources.length,3);
});
test('capacity, retained sources, confidence and twenty save/load cycles', () => {
  const ctx=runtime(); let world={};
  emit(ctx,world,{emotion:-1,impact:100});
  for(let i=0;i<200;i++) emit(ctx,world,{subject:'person-'+i});
  assert.equal(world.npcMemory.people.alice.short.length,96);
  assert.ok(ctx.memory.recall(world,'alice').some(entry=>entry.sources.includes('event-1')));
  for(const entry of ctx.memory.recall(world,'alice')) for(const id of entry.sources) assert.ok(world.npcMemory.events[id]);
  const before=JSON.stringify(world), influence=ctx.memory.influence(world,'alice','bob');
  for(let i=0;i<20;i++) world=JSON.parse(JSON.stringify(world));
  assert.equal(JSON.stringify(world),before);
  assert.equal(ctx.memory.influence(world,'alice','bob'),influence);
  const uncertain={}; emit(ctx,uncertain,{emotion:-1,confidence:0,impact:100});
  assert.equal(ctx.memory.influence(uncertain,'alice','bob'),0);
  assert.equal(ctx.memory.influence({},'alice','bob'),0);
});

test('different details and ways of learning remain distinct instead of being overwritten', () => {
  const ctx=runtime(), world={};
  for(const detail of ['病中送药','雪夜送炭','替孩子解围']) emit(ctx,world,{interpretation:detail});
  assert.equal(ctx.memory.recall(world,'alice').length,3);
  for(let i=0;i<4;i++) emit(ctx,world,{interpretation:'听说他替我说情',channel:'hearsay',confidence:.3});
  for(let i=0;i<4;i++) emit(ctx,world,{interpretation:'听说他替我说情',channel:'participant',confidence:1});
  const memories=ctx.memory.recall(world,'alice');
  assert.ok(memories.some(m=>m.interpretation==='病中送药'));
  assert.equal(memories.find(m=>m.channel==='hearsay').confidence,.3);
  assert.equal(memories.find(m=>m.channel==='participant'&&m.occurrences===4).confidence,1);
});

test('ten thousand identical routines keep a bounded trace, accurate counts and first/last dates', () => {
  const ctx=runtime(), world={};
  for(let i=1;i<=10000;i++)ctx.memory.record(world,{type:'gift',time:i},[
    {person:'alice',subject:'bob',interpretation:'他又送来了同样的茶',emotion:.4,impact:50}
  ]);
  const memories=ctx.memory.recall(world,'alice');
  assert.equal(memories.length,1);
  const memory=memories[0];
  assert.equal(memory.occurrences,10000);
  assert.equal(memory.firstTime,1);
  assert.equal(memory.time,10000);
  assert.equal(memory.sources.length,6);
  assert.ok(memory.sources.includes('event-1')&&memory.sources.includes('event-10000'));
  assert.ok(Object.keys(world.npcMemory.events).length<140);
  assert.ok(JSON.stringify(world).length<50000);
  for(const id of memory.sources)assert.ok(world.npcMemory.events[id]);
});

test('expanded long-term capacity preserves landmarks amid repeated routine events', () => {
  const ctx=runtime(),world={};
  ctx.memory.record(world,{type:'child-journey',time:1},[
    {person:'alice',subject:'child',interpretation:'孩子第一次远行，我送到宫门外',emotion:-.4,impact:75}
  ]);
  for(let i=0;i<320;i++)emit(ctx,world,{interpretation:'普通赏赐'+i,emotion:.85,impact:85});
  const memory=world.npcMemory.people.alice;
  assert.equal(memory.long.length,160);
  assert.equal(memory.life.length,24);
  assert.ok(memory.long.some(m=>m.type==='child-journey'));
  assert.ok(ctx.memory.recall(world,'alice').some(m=>m.archived));
  for(const entry of ctx.memory.recall(world,'alice'))for(const id of entry.sources)assert.ok(world.npcMemory.events[id]);
});

test('archived old impressions remain retrievable and influential after twenty reloads', () => {
  const ctx=runtime();let world={};
  for(let i=0;i<180;i++)emit(ctx,world,{subject:'person-'+i,interpretation:'记得'+i,emotion:-1,impact:100});
  const old=ctx.memory.recall(world,'alice',{subject:'person-0'});
  assert.equal(old.length,1);assert.equal(old[0].archived,true);
  const impact=ctx.memory.influence(world,'alice','person-0');assert.ok(impact<0);
  const before=JSON.stringify(world);
  assert.equal(ctx.memory.recall(world,'alice',{type:'gift',limit:5}).length,5);
  assert.equal(JSON.stringify(world),before,'reading memory must not mutate saves');
  for(let i=0;i<20;i++)world=JSON.parse(JSON.stringify(world));
  assert.equal(ctx.memory.influence(world,'alice','person-0'),impact);
  assert.equal(ctx.memory.recall(world,'alice',{subject:'person-0'})[0].interpretation,'记得0');
});

test('v1 migration keeps memories and sequence, removes duplicate summaries and invalidates the index', () => {
  const ctx=runtime(),world={};emit(ctx,world,{emotion:-1,impact:100});
  world.npcMemory.version=1;
  const entry=world.npcMemory.people.alice.long[0];
  world.npcMemory.people.alice.life=[{sources:entry.sources.slice(),interpretation:entry.interpretation}];
  const influence=ctx.memory.influence(world,'alice','bob');
  ctx.memory.upgrade(world);
  assert.equal(world.npcMemory.version,2);
  assert.equal(world.npcMemory.sequence,1);
  assert.equal(ctx.memory.recall(world,'alice').length,1);
  assert.equal(ctx.memory.influence(world,'alice','bob'),influence);
  assert.equal(world.npcMemory.people.alice.life.length,0);
  const before=JSON.stringify(world);ctx.memory.upgrade(world);assert.equal(JSON.stringify(world),before);
  const event=emit(ctx,world);assert.equal(event.sequence,2);
});
test('actual quarrel and legacy remember entry points produce distinct memories', () => {
  const S={turn:5},ctx=runtime({S,fullName:c=>c.name});
  loadFunction(ctx,read('js/personality.js'),'remember','function deepLine(');
  const a={id:1,name:'Alice'},b={id:2,name:'Bob'};
  ctx.rememberQuarrel(a,b,a.id);
  assert.match(ctx.memory.recall(S,1)[0].interpretation,/判给了我/);
  assert.match(ctx.memory.recall(S,2)[0].interpretation,/判给了她/);
  assert.equal(ctx.memory.recall(S,3).length,0);
  ctx.remember(a,'hurt','被降位');
  assert.ok(ctx.memory.influence(S,1,'emperor')<0);
  assert.ok(S.npcMemory.events['event-1'].participants.includes(2));
});
