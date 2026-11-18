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
  assert.equal(PalaceActions.contentVersion,85);assert.ok(S.dynastyGoals);`);
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
   assert.equal(PalaceActions.contentVersion,85);assert.equal(dynastyScenarioActive(),true);`);
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

test('claimed achievements unlock a new start, inherited trait and headpiece across games',()=>{
 let b=boot(19001);b.ctx.assert=assert;
 b.run(`A.start();drain();S.dynastyGoals={reigns:{completed:true,claimed:false},children:{completed:true,claimed:false},companionship:{completed:true,claimed:false},grown:{completed:true,claimed:false}};
  A.claimDynastyGoal('reigns');A.claimDynastyGoal('children');A.claimDynastyGoal('companionship');A.claimDynastyGoal('grown');save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`var profile=dynastyProfile();assert.ok(profile.includes('reigns'));assert.ok(profile.includes('children'));assert.ok(profile.includes('companionship'));
  document.querySelector('#f-dynasty-meta').value=JSON.stringify(profile);
  document.querySelector('input[name=f-scenario]:checked').value='restoration';document.querySelector('input[name=f-dynasty-portrait]:checked').value='1';A.start();
  assert.equal(S.scenario.id,'restoration');assert.equal(E().imperialPortrait,1);assert.equal(E().dynastyTrait,'家学仁厚');assert.equal(E().people,58);
  assert.ok(empress().jewelry.some(item=>item.id==='phoenix'));save('auto');`);
 b=boot(6,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.scenario.id,'restoration');
  assert.ok(S.dynastyMeta.includes('companionship'));assert.ok(empress().jewelry.some(item=>item.id==='phoenix'));`);
});

test('a genuine published v80 pending coronation resumes before adopting cross-game rewards',()=>{
 const save=require('./fixtures/dynasty-goals-legacy-v80.json');
 const b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,80);
  assert.equal(curEv.title,'登基');assert.equal(S.dynastyMeta,undefined);drain();A.go('home');assert.equal(PalaceActions.contentVersion,85);`);
});

test('the inherited scenario cannot start before its achievement is unlocked',()=>{
 const b=boot(19002);b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='restoration';A.start();assert.equal(S.scenario,undefined);`);
});

test('an unfinished scenario records defeat if the ruler dies before its goals are met',()=>{
 const b=boot(19002);b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='founder';A.start();drain();
  deathEvent('驾崩');assert.equal(S.scenario.status,'lost');assert.equal(S.scenario.failure,'君主驾崩前未完成目标');
  assert.match(dynastyGoalsPanel(),/君主驾崩前未完成目标/);`);
});

test('published v80 pending consort chat resumes before new accession dialogue rules',()=>{
 const save=require('./fixtures/dynasty-goals-v80-pending-chat.json');
 const b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,80);
  assert.equal(curEv.title,'闲话家常');assert.equal(S.dynastyGoals,undefined);drain();A.go('home');assert.equal(PalaceActions.contentVersion,85);`);
});

test('founder actually establishes institutions over separate months and unlocks council policy',()=>{
 let b=boot(19001);b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='founder';A.start();drain();E().energy=10;
  var oldMoney=E().treasury;A.courtPolicy('civil');assert.equal(S.courtPolicyTurn,undefined);
  A.establishDynastyFoundation('charter');A.establishDynastyFoundation('granary');assert.equal(S.scenario.foundations.granary,false);
  assert.equal(E().treasury,oldMoney-30);S.turn++;A.establishDynastyFoundation('granary');assert.equal(S.flags.founderGranary,true);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.scenario.foundations.granary,true);S.turn++;E().energy=10;
  A.establishDynastyFoundation('council');assert.equal(S.scenario.status,'won');assert.equal(founderCouncilReady(),true);
  A.courtPolicy('civil');assert.equal(S.courtPolicyTurn,S.turn);`);
});

test('published v83 pending conversation resumes before the new rules',()=>{
 const save=require('./fixtures/dynasty-goals-v83-pending-chat.json'),b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,83);assert.equal(curEv.title,'闲话家常');
  drain();A.go('home');assert.equal(PalaceActions.contentVersion,85);`);
});

test('the founded granary adds two to actual monthly income',()=>{
 const b=boot(19001);b.ctx.assert=assert;
 b.run(`document.querySelector('input[name=f-scenario]:checked').value='founder';A.start();drain();E().energy=10;
  A.establishDynastyFoundation('granary');var baseline=Math.round(45+E().people*1.1+(S.flags.canal?25:0));
  A.endMonth();assert.equal(S.flags.lastMonthReview.inc,baseline+2+(S.flags.lastMonthReview.hongjianIncome||0));`);
});

test('published v84 family dialogue resumes with its original choices before new systems activate',()=>{
 const save=require('./fixtures/dynasty-goals-v84-pending-family.json'),b=boot(1,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;b.ctx.expectedTitle=save.pendingActions.pending.title;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,84);assert.equal(curEv.title,expectedTitle);
  drain();A.go('home');assert.equal(PalaceActions.contentVersion,85);`);
});

test('prosperous opening changes its own families without modifying shared generation templates',()=>{
 const b=boot(19003);b.ctx.assert=assert;b.run(`var original=JSON.stringify(FAMS);document.querySelector('input[name=f-scenario]:checked').value='prosperous';
  A.start();assert.equal(JSON.stringify(FAMS),original);assert.ok(S.consorts.every(c=>c.fam.p>=65));`);
});
