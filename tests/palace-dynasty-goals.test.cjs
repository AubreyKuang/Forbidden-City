const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

test('milestone reward is paid once and stays claimed after reload',()=>{
 let b=boot();b.ctx.assert=assert;
 b.run(`A.start();drain();S.gen=3;A.go('home');assert.ok(S.dynastyGoals.reigns.completed);
  const before=E().treasury;A.claimDynastyGoal('reigns');assert.equal(E().treasury,before+150);
  A.claimDynastyGoal('reigns');assert.equal(E().treasury,before+150);save('auto');`);
 b=boot(1,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.dynastyGoals.reigns.claimed,true);
  const before=E().treasury;A.claimDynastyGoal('reigns');assert.equal(E().treasury,before);`);
});

test('v74 pending result replays before goal reconciliation',()=>{
 const save=require('./fixtures/dynasty-goals-legacy-v74.json');
 const b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,74);
  assert.equal(curEv.title,'黄河决堤');assert.ok(modalResult);drain();A.go('home');
  assert.equal(PalaceActions.contentVersion,75);assert.ok(S.dynastyGoals);`);
});
