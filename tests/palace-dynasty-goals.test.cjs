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
  assert.equal(PalaceActions.contentVersion,76);assert.ok(S.dynastyGoals);`);
});

for(const [scenario,expected] of [['founder',350],['regent',500],['succession',800],['prosperous',1800],['crisis',100]]){
 test(scenario+' opening survives a reload and keeps its objectives',()=>{
  let b=boot(17001);b.ctx.assert=assert;
  b.run(`document.querySelector('input[name=f-scenario]:checked').value='${scenario}';A.start();
    assert.equal(S.scenario.id,'${scenario}');assert.equal(E().treasury,${expected});
    assert.equal(dynastyScenarioGoals().length,3);save('auto');`);
  b=boot(5,b.storage);b.ctx.assert=assert;
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.scenario.id,'${scenario}');
    assert.equal(E().treasury,${expected});drain();assert.match(dynastyGoalsPanel(),/${scenario==='crisis'?'剩余 36 个月':scenario==='regent'?'权臣掌控度':'开局剧本|国库|在世皇嗣'}/);`);
 });
}

test('regent authority costs energy once per month and crisis deadline survives reload',()=>{
 const b=boot();b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='regent';A.start();drain();
  var energy=E().energy;A.lowerRegentControl();assert.equal(S.scenario.control,60);assert.equal(E().energy,energy-1);
  A.lowerRegentControl();assert.equal(S.scenario.control,60);assert.equal(E().energy,energy-1);`);
});

test('regent hidden goal remains reachable after the three visible goals complete',()=>{
 const b=boot();b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='regent';A.start();drain();
  E().people=70;E().prestige=70;
  for(let turn=1;turn<=7;turn++){S.turn=turn;E().energy=4;A.lowerRegentControl();}
  assert.equal(S.scenario.status,'won');assert.equal(S.scenario.control,0);assert.ok(S.scenario.hidden);
  assert.match(dynastyGoalsPanel(),/将权臣掌控度降至0/);`);
});

test('crisis deadline and victory remain stable across saves',()=>{
 let b=boot();b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='crisis';A.start();drain();
  S.turn=35;reconcileDynastyScenario();assert.equal(S.scenario.status,'active');save('auto');`);
 b=boot(2,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(S.scenario.deadline,36);S.turn=36;reconcileDynastyScenario();
  assert.equal(S.scenario.status,'lost');E().people=90;E().prestige=90;E().treasury=1000;
  reconcileDynastyScenario();assert.equal(S.scenario.status,'lost');`);
});
