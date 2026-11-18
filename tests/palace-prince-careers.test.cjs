const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');

test('adult career progresses only once per active month and survives reload',()=>{
 let b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var k=makeKid(empress(),'m','承安');k.born=S.turn-240;E().energy=5;
  A.princeCareer(k.id,'military');assert.equal(k.princeCareer.path,'military');assert.equal(E().energy,4);
  for(let i=0;i<6;i++){S.turn++;princeCareerTick(k);princeCareerTick(k);}assert.equal(k.princeCareer.months,6);
  k.away=true;S.turn++;princeCareerTick(k);assert.equal(k.princeCareer.months,6);k.away=false;save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var k=S.children.find(x=>x.name==='承安'),sup=k.sup||0;
  for(let i=0;i<6;i++){S.turn++;princeCareerTick(k);}assert.equal(k.princeCareer.completed,1);
  assert.equal(k.princeCareer.months,0);assert.equal(k.sup,sup+3);assert.ok(k.story.some(s=>s.t.includes('武略差务')));`);
});

test('invalid or underage assignments do not cost energy, and changing direction has a cooldown',()=>{
 const b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var k=makeKid(empress(),'m','承安');E().energy=5;
  A.princeCareer(k.id,'military');assert.equal(E().energy,5);k.born=S.turn-240;
  A.princeCareer(k.id,'invalid');assert.equal(E().energy,5);A.princeCareer(k.id,'civil');assert.equal(E().energy,4);
  A.princeCareer(k.id,'trade');assert.equal(k.princeCareer.path,'civil');S.turn+=12;A.princeCareer(k.id,'trade');
  assert.equal(k.princeCareer.path,'trade');assert.equal(E().energy,3);`);
});

test('recognition in a rivalry changes visible momentum and imposes a cooldown',()=>{
 const b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var first=makeKid(empress(),'m','承安'),second=makeKid(empress(),'m','承平');
  first.born=second.born=S.turn-240;E().energy=5;A.princeCareer(first.id,'civil');A.princeCareer(second.id,'military');
  var rivalry=princeCareerRivalryEvent();assert.ok(rivalry);pushEv(rivalry);choose(0);drain();
  assert.equal(first.princeCareer.momentum,2);assert.equal(second.princeCareer.momentum,0);
  assert.match(princeCareerPanel(first),/势 2/);assert.equal(princeCareerRivalryEvent(),null);
  assert.ok(first.story.some(s=>s.t.includes('皇子竞争')));`);
});

test('court policy can align with or conflict with an adult prince’s political path',()=>{
 const b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var k=makeKid(empress(),'m','承安');k.born=S.turn-240;E().energy=10;E().treasury=1000;
  A.princeCareer(k.id,'military');var love=k.love;A.courtPolicy('civil');assert.equal(k.love,love-1);
  assert.ok(k.story.some(e=>e.t.includes('有分歧')));S.turn++;E().energy=10;A.courtPolicy('army');assert.equal(k.princeCareer.momentum,1);
  assert.match(princeCareerPanel(k),/重视武备与边防/);`);
});

test('rivalry rotates among recognition, maternal resources, military merit and court support',()=>{
 const b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var a=makeKid(empress(),'m','承安'),z=makeKid(harem()[1],'m','承平');a.born=z.born=S.turn-240;E().energy=10;
  A.princeCareer(a.id,'civil');A.princeCareer(z.id,'military');var mother=byId(a.mom),power=mother.fam.p;
  for(let round=0;round<4;round++){var competitionScene=princeCareerRivalryEvent();assert.ok(competitionScene);pushEv(competitionScene);choose(0);drain();S.turn+=36;}
  assert.deepEqual(Array.from(S.flags.princeRivalryHistory,x=>x.axis),['recognition','maternal','military','official']);
  assert.equal(mother.fam.p,Math.min(100,power+2));assert.equal(a.princeCareer.momentum,8);
  assert.ok(a.story.some(s=>s.t.includes('军务功绩')));`);
});

test('an expanded rivalry survives a refresh without advancing the round twice',()=>{
 let b=boot(44001);b.ctx.assert=assert;
 b.run(`A.start();drain();var a=makeKid(empress(),'m','承安'),z=makeKid(harem()[1],'m','承平');a.born=z.born=S.turn-240;E().energy=10;
  A.princeCareer(a.id,'civil');A.princeCareer(z.id,'military');A.endMonth();
  for(let i=0;modalOpen&&curEv.title!=='皇子竞争 · 各有所长'&&i<100;i++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'皇子竞争 · 各有所长');assert.equal(S.flags.princeRivalryRound,1);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'皇子竞争 · 各有所长');
  choose(0);drain();assert.equal(S.flags.princeRivalryRound,1);assert.equal(S.flags.princeRivalryHistory.length,1);`);
});
