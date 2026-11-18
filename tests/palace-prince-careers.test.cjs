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
