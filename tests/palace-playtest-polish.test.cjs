const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const game=(seed=202)=>{const b=boot(seed);b.run('A.start();drain();');return b;};

test('family news is worry, not a grievance; only the emperor refusing leave leaves one',()=>{
  const b=game();
  b.run('var c=byId(2);beginMotherIllness(c)');
  assert.equal(b.run('lifeBoundary(c)'),null,'a mother falling ill is not the emperor\'s doing');
  assert.match(b.run('c.story.at(-1).t'),/【家中病讯】/,'the news itself is still chronicled');
  b.run("homeRecord(c,'母亲病重，未获准离宫，只能等待家中病况。她将家信读了又读。',-.6,null,true)");
  const cause=b.run('lifeBoundary(c).cause');
  assert.equal(cause,'母亲病重，未获准离宫，只能等待家中病况');
  assert.doesNotMatch(b.run('lifeVoice(c).lines[0]'),/【|】/);
});

test('grudges saved from family news by older versions no longer take over conversations',()=>{
  const b=game();
  b.run("var c=byId(2);lifeState(c).boundary={gen:S.gen,cause:'【家中病讯】母亲病重，不能远行。',date:dateStr(),turn:S.turn,acknowledged:false,respect:0}");
  assert.equal(b.run('lifeBoundary(c)'),null);
  assert.doesNotMatch(b.run('JSON.stringify(consortVoicePool(c))'),/家中病讯/);
  assert.ok(b.run('!!c.personalLife.boundary'),'the old record is left in the save untouched');
});

test('the new emperor\'s wife from before the accession is not treated as a stranger',()=>{
  const b=game();
  b.run(`var son=makeKid(harem()[0],'m','承安');son.born=S.turn-192;E().treasury=200;
    A.kidMarriage(son.id);choose(0);choose(0);drain();succeed(son);choose(0);drain();var queen=harem().find(c=>c.rank===8);`);
  assert.ok(b.run("queen.story.some(s=>s.t.includes('潜邸嫡妻'))"));
  assert.equal(b.run('queen.knownBeforeAccession'),true);
  assert.notEqual(b.run('consortVoicePhase(queen)'),'first');
  b.run('delete queen.knownBeforeAccession');
  assert.notEqual(b.run('consortVoicePhase(queen)'),'first','older saves are recognised from the chronicle');
});

test('the flood memorial describes the season it arrives in',()=>{
  const b=game();
  const texts=[1,4,7,10].map(m=>b.run(`S.month=${m};COURT[FLOOD_INDEX]({}).text`));
  assert.match(texts[0],/春汛/);assert.match(texts[1],/入夏/);assert.match(texts[2],/入秋/);assert.match(texts[3],/入冬/);
});

test('the empress only calls someone spoiled when she is actually the favourite',()=>{
  const b=game();
  b.run('var em=empress();em.virtue=30;harem().filter(c=>c!==em).forEach(c=>c.favor=10);var tgt=harem().find(c=>c!==em);tgt.favor=20;em.favor=40');
  const quiet=b.run("HAREM.find(f=>f.name==='empressReport')().text");
  assert.doesNotMatch(quiet,/恃宠/);
  b.run('tgt.favor=90;em.favor=40');
  assert.match(b.run("HAREM.find(f=>f.name==='empressReport')().text"),/恃宠而骄/);
});

test('garden encounters only show a skill she actually has',()=>{
  const b=game();
  for(const hobby of ['做点心','骑射','读书']){
    b.run(`var c=byId(2);c.hobby=${JSON.stringify(hobby)};`);
    for(let i=0;i<12;i++){
      const text=b.run('gardenEncounterText(c)');
      if(hobby!=='抚琴')assert.doesNotMatch(text,/抚琴/,`${hobby}: ${text}`);
    }
  }
});

test('selection replies and newcomer reactions vary with skill and temperament',()=>{
  const b=game();
  const replies=b.run("JSON.stringify(Object.keys(CONSORT_HOBBIES).map(h=>{var c=makeGirl({});c.hobby=h;c.talent=80;c.trait='温婉';return selectionSpeech(c).reply}))");
  assert.equal(new Set(JSON.parse(replies)).size,9);
  const reactions=b.run("JSON.stringify(['温婉','好学','体弱','贪财','才女','痴情'].map(t=>{var c=makeGirl({trait:t});c.scheme=20;return newcomerReaction(c)}))");
  assert.equal(new Set(JSON.parse(reactions)).size,6);
});

test('daughters and sons do not share a character with their father\'s given name',()=>{
  for(const seed of [101,202,303,404,505,606]){
    const b=game(seed);b.run('for(var m=0;m<24&&!S.over;m++){A.endMonth();drain();}');
    const rows=JSON.parse(b.run(`JSON.stringify(S.consorts.filter(c=>c.fam&&houseOf(c)).map(c=>{var h=houseOf(c),g=p=>givenOf({sur:c.sur,name:p});
      return {father:g(h.father.name),children:[c.name,...(h.relatives||[]).map(p=>g(p.name)),...brotherRoles(h).map(r=>g(h[r].name))].filter(Boolean)}}))`));
    for(const {father,children} of rows)for(const child of children)
      assert.ok(![...child].some(ch=>father.includes(ch)),`seed ${seed}: ${father} / ${child}`);
  }
});

test('stale threshold hints, empty diary months and the hours shown offline',()=>{
  const b=game();
  b.run('var c=byId(2);c.aff=70;c.wishKnown=false;c.woundKnown=false');
  const page=b.run('deepLine(c)');
  assert.match(page,/情分已够/);assert.doesNotMatch(page,/情分到 (50|65) 以后/);
  b.run("S.log.push({d:'x',t:'—— 乾佑元年五月 ——'},{d:'x',t:'—— 乾佑元年六月 ——'},{d:'x',t:'六月的一件事'})");
  const diary=b.run('viewLog()');
  assert.doesNotMatch(diary,/乾佑元年五月 ——/);assert.match(diary,/乾佑元年六月 ——/);
  b.run('S.savedAt=Date.now()-6*36e5;offlineMemorials()');
  assert.ok(b.messages.some(m=>m.includes('约3个时辰')),'six hours are three shichen');
});

test('a follow-up the player keeps postponing settles by itself after a year',()=>{
  const b=game();
  b.run(`var state=continuityState(true);var t={id:999,key:'k999',kind:'duty',owner:2,other:harem().find(c=>c.id!==2).id,stage:'working',origin:S.turn,due:S.turn,history:[],cause:'测试'};
    state.threads.push(t);S.turn+=11;continuityTick();`);
  assert.equal(b.run('t.stage'),'working');
  b.run('S.turn+=1;continuityTick()');
  assert.equal(b.run('t.stage'),'ended');assert.ok(b.run('t.history.length>0'));
});

test('a road encounter is journaled and comes back after a refresh with the same words',()=>{
  const b=game();b.run('meetConsort(byId(2))');
  const text=b.run('curEv.text');
  const n=boot(9,b.storage);n.run("A.load('auto')");
  assert.equal(n.run('PalaceActions.blocked'),false);assert.equal(n.run('curEv.title'),'宫道偶遇');assert.equal(n.run('curEv.text'),text);
});

test('a relative arriving revives the rift between the two of them, not a grudge against the emperor',()=>{
  const b=game();
  b.run(`var c=byId(2),g=makeKin(c,'堂');c.trait='善妒';c.favor=90;c.kinRival={};g.kinRival={};relAdd(c,g,10-relGet(c,g));addConsort(g,2,'家中送来');`);
  assert.ok(b.run("c.story.some(s=>s.t.includes('姐妹入宫'))"));
  assert.equal(b.run('lifeBoundary(c)'),null);
  assert.ok(b.run('S.npcMemory?JSON.stringify(S.npcMemory).includes(c.sisterArrival.text):true'));
  b.run("lifeState(c).boundary={gen:S.gen,cause:c.sisterArrival.text,date:dateStr(),turn:S.turn,acknowledged:false,respect:0}");
  assert.equal(b.run('lifeBoundary(c)'),null,'the same grudge in an older save is ignored');
});

test('brothers are never labelled with the sisters\' words, in new games or older saves',()=>{
  const traits=new Set();
  for(let i=0;i<12;i++){
    const b=game(500+i*41);b.run('for(var k=0;k<3;k++){A.endMonth();drain();}');
    for(const t of JSON.parse(b.run("JSON.stringify(S.consorts.filter(c=>c.fam&&houseOf(c)).flatMap(c=>(houseOf(c).relatives||[]).filter(p=>p.sex==='m').map(p=>natalTrait(p))))")))traits.add(t);
  }
  assert.ok(!traits.has('才女')&&!traits.has('温婉'),[...traits].join());
  assert.ok(traits.size>=3,'brothers get a range of temperaments: '+[...traits].join());
  const b=game();
  assert.equal(b.run("natalTrait({sex:'m',trait:'才女'})"),'有文才');assert.equal(b.run("natalTrait({sex:'m',trait:'温婉'})"),'温厚');
  assert.equal(b.run("natalTrait({sex:'f',trait:'才女'})"),'才女');
});

test('the empress\'s and first companion\'s families differ from one playthrough to the next',()=>{
  const layouts=new Set();
  for(let i=0;i<10;i++){
    const b=game(900+i*53);
    layouts.add(b.run("JSON.stringify([1,2].map(id=>{var h=houseOf(byId(id));return h&&h.father?[(h.relatives||[]).map(p=>p.sex+natalTrait(p)).join(),h.father.name.slice(1)]:null}))"));
  }
  assert.ok(layouts.size>=5,`only ${layouts.size} distinct family layouts in 10 games`);
});

test('the palace coup waits three years and happens at most once a reign',()=>{
  const b=game();
  b.run('var coup=palaceCoupEvent;');
  b.force(.99);assert.equal(b.run('coup()'),null,'not in the first years');
  b.run('S.turn=40');b.force(.99);assert.equal(b.run('coup().title'),'宫变');
  b.run('S.turn=200');b.force(.99);assert.equal(b.run('coup()'),null,'not twice in one reign');
  b.run('S.gen++');b.force(.99);assert.equal(b.run('coup().title'),'宫变','a new reign can face its own');
  b.run('S.gen++');b.force(.97);assert.equal(b.run('coup()'),null,'and it stays rare when drawn');
});
