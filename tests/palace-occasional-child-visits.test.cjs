const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');
test('most visits allow the child to speak alone and leave no imaginary maternal memories',()=>{
 const b=world();b.ctx.assert=assert;b.force(.9);b.run(`var n=other.story.length;A.kidVisit(k.id);assert.equal(curEv.title,'探望皇嗣');assert.equal(curEv.cast.length,0);assert.match(curEv.text,/只听孩子自己说/);choose(0);assert.match(modalResult.text,/你留下来/);assert.equal(other.story.length,n);assert.match(k.story.at(-1).t,/没有旁人替我答话/);`);
});
test('age and recent appearances reduce chance without making maternal company impossible',()=>{
 const b=world();b.ctx.assert=assert;b.run(`k.born=S.turn-2*12;`);b.force(.4);b.run(`assert.equal(childVisitCompany(k).length,1);`);b.force(.4);b.run(`assert.equal(childVisitCompany(k).length,0);k.born=S.turn-8*12;`);b.force(.25);b.run(`assert.equal(childVisitCompany(k).length,1);k.born=S.turn-15*12;delete k.visitCompany;`);b.force(.25);b.run(`assert.equal(childVisitCompany(k).length,0);`);b.force(0);b.run(`assert.equal(childVisitCompany(k).length,1);`);
});
test('caregivers absent, confined, severely ill or forbidden to visit never appear',()=>{
 for(const patch of [`other.homeLeave={due:90}`,`other.cold=true`,`other.templeStay={}`,`other.alive=false`,`other.hp=10`,`k.foster=c.id;k.visitRule='closed';c.homeLeave={due:90}`]){
  const b=world();b.ctx.assert=assert;b.run(patch);b.force(0,0,0);b.run(`A.kidVisit(k.id);assert.equal(curEv.cast.length,0);assert.equal(curEv.title,'探望皇嗣');`);
 }
});
test('infant and independent child scenes use age-appropriate company, with repeatable saved results',()=>{
 for(const age of [0,8,15]){const b=world();b.ctx.assert=assert;b.run(`k.born=S.turn-${age}*12;PalaceActions.reset();`);b.force(.99);b.run(`A.kidVisit(k.id);var text=curEv.text,title=curEv.title,love=k.love;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.text,text);assert.equal(curEv.title,title);assert.equal(kidById(${b.run('k.id')}).love,love);
 choose(0);var result=modalResult.text;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(modalResult.text,result);${age===0?`assert.doesNotMatch(result,/父皇听我|自己说完/);`:''}`);}
});
test('a real v14 visit replays its original frequent companion without changing the saved cast',()=>{
 const data=require('./fixtures/child-visit-legacy-v14.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'探望皇嗣 · 母亲在旁');choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);`);
});
test('a seeded sample contains both quiet visits and occasional company',()=>{
 const b=world();b.ctx.assert=assert;b.run(`var count=0;for(var i=0;i<300;i++){S.turn+=3;if(childVisitCompany(k).length)count++;}assert.ok(count>20&&count<100,'adolescent company count '+count);`);
});
