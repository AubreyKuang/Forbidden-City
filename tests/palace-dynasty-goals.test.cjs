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

test('published v75 pending result resumes before enabling the new scenario system',()=>{
 const save=require('./fixtures/dynasty-goals-legacy-v75.json');
 const b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,75);
   assert.equal(dynastyScenarioActive(),false);assert.ok(modalResult);drain();A.go('home');
   assert.equal(PalaceActions.contentVersion,76);assert.equal(dynastyScenarioActive(),true);`);
});

test('monthly goals count consecutive months once and reset after interruptions',()=>{
 const b=boot();b.ctx.assert=assert;
 b.run(`A.start();drain();var queen=empress(),other=harem().find(c=>c!==queen);
  appointHaremSteward(other);queen.aff=85;queen.mood=80;other.mood=80;E().people=85;
  for(let month=0;month<60;month++){S.turn=month;settleDynastyGoalMonth();settleDynastyGoalMonth();}
  assert.equal(S.dynastyGoalProgress.prosperity.months,60);
  assert.ok(S.dynastyGoals.empress.completed);assert.ok(S.dynastyGoals.companionship.completed);
  E().people=79;S.turn=60;settleDynastyGoalMonth();assert.equal(S.dynastyGoalProgress.prosperity.months,0);
  E().people=85;for(let month=61;month<181;month++){S.turn=month;settleDynastyGoalMonth();}
  assert.ok(S.dynastyGoals.prosperity.completed);assert.equal(S.dynastyGoalProgress.prosperity.months,120);`);
});

test('succession passes the prior ruler’s renown and teaching to the new ruler and preserves them after reload',()=>{
 let b=boot(19001);b.ctx.assert=assert;
 b.run(`A.start();drain();E().style='文雅';E().prestige=90;var previous=E().sur+E().name;
   var heir=makeKid(empress(),'m','承安');heir.born=S.turn-20*12;heir.lit=60;heir.vir=60;
   succeed(heir);choose(0,'承平');drain();
   assert.equal(E().prestige,59);assert.equal(E().wen,63);assert.equal(E().dynastyLegacy.predecessor,previous);
   assert.equal(E().dynastyLegacy.renown,4);assert.match(viewHome(),/崇文重学/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(E().dynastyLegacy.stat,'wen');
  assert.equal(E().dynastyLegacy.bonus,3);assert.match(viewHome(),/先帝传承/);`);
});

test('hidden three-generation clan achievement reveals itself only after consecutive reigns and pays once',()=>{
 let b=boot(19200);b.ctx.assert=assert;
 b.run(`A.start();drain();empress().clan='shared-family';reconcileDynastyGoals();
  assert.doesNotMatch(dynastyGoalsPanel(),/三世姻亲/);var heir=makeKid(empress(),'m','承安');heir.born=S.turn-240;
  succeed(heir);choose(0,'承平');drain();empress().clan='shared-family';reconcileDynastyGoals();
  assert.equal(S.dynastyGoals.threeClans,undefined);var next=makeKid(empress(),'m','续安');next.born=S.turn-240;
  succeed(next);choose(0,'永安');drain();empress().clan='shared-family';reconcileDynastyGoals();
  assert.ok(S.dynastyGoals.threeClans.completed);assert.match(dynastyGoalsPanel(),/三世姻亲/);
  var money=E().treasury;A.claimDynastyGoal('threeClans');A.claimDynastyGoal('threeClans');assert.equal(E().treasury,money+150);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(S.dynastyGoals.threeClans.claimed,true);assert.match(dynastyGoalsPanel(),/三世姻亲/);`);
});
