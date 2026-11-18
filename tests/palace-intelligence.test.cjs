const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function start(){
 const b=boot(12001);b.ctx.assert=assert;
 b.run(`A.start();drain();E().energy=10;E().treasury=1000;A.establishJinyiwei();choose(0);drain();
  var a=harem()[0],other=harem()[1];
  var file=openPalaceCase({kind:'harem',title:'香囊疑案',crime:'香囊藏麝',culprit:a.id,victim:null});`);
 return b;
}
test('agents recruit and train once per month, and report a pinned case after two months',()=>{
 let b=start();
 b.run(`var money=E().treasury;A.recruitIntelligenceAgent('maid');assert.equal(E().treasury,money-10);
  var agent=intelligenceAgent('maid'),ability=agent.ability;
  A.trainIntelligenceAgent('maid');assert.equal(agent.ability,Math.min(100,ability+5));
  A.trainIntelligenceAgent('maid');assert.equal(agent.ability,Math.min(100,ability+5));
  A.intelligenceDispatch('maid',file.id,a.id);assert.equal(S.intelligence.reports.length,1);
  var report=S.intelligence.reports[0],energy=E().energy;A.intelligenceDispatch('maid',file.id,a.id);
  assert.equal(E().energy,energy);assert.equal(S.intelligence.reports.length,1);
  assert.doesNotMatch(intelligencePanel(),/可靠度估计/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);S.turn+=2;
  assert.match(intelligencePanel(),/可靠度估计/);assert.equal(S.intelligence.reports.length,1);
  var prior=JSON.stringify(S);intelligencePanel();assert.equal(JSON.stringify(S),prior);`);
});
test('each false report can disagree with the already recorded case truth',()=>{
 const b=start();
 b.run(`A.recruitIntelligenceAgent('eunuch');intelligenceAgent('eunuch').compromised=false;`);
 b.force(.999);
 b.run(`A.intelligenceDispatch('eunuch',file.id,a.id);assert.equal(file.culprit,a.id);
  assert.equal(S.intelligence.reports[0].conclusion,false);assert.equal(file.status,'cold');`);
});

test('trusting a false accusation affects the accused once, then verification identifies the error',()=>{
 let b=start();b.run(`A.recruitIntelligenceAgent('maid');intelligenceAgent('maid').compromised=false;`);b.force(.999);
 b.run(`A.intelligenceDispatch('maid',file.id,other.id);S.turn+=2;
  var report=S.intelligence.reports[0];assert.equal(report.conclusion,true);
  var mood=other.mood,aff=other.aff;A.trustIntelligenceReport(report.id);
  assert.equal(other.mood,mood-6);assert.equal(other.aff,aff-3);
  A.trustIntelligenceReport(report.id);assert.equal(other.mood,mood-6);
  file.status='solved';assert.match(intelligencePanel(),/此前线索有误/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
  assert.match(intelligencePanel(),/此前线索有误/);assert.equal(S.intelligence.reports[0].accepted,S.turn);`);
});

test('a compromised agent can be investigated and removed after the result is due',()=>{
 let b=start();
 b.run(`A.recruitIntelligenceAgent('maid');var agent=intelligenceAgent('maid');agent.compromised=true;
  A.investigateIntelligenceAgent('maid');assert.equal(agent.review.due,S.turn+2);
  assert.doesNotMatch(intelligencePanel(),/复核查出暗中受人收买/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);S.turn+=2;
  assert.match(intelligencePanel(),/复核查出暗中受人收买/);
  A.dismissIntelligenceAgent('maid');assert.equal(intelligenceAgent('maid'),undefined);
  assert.ok(S.log.some(entry=>entry.t.includes('撤去差事')));`);
});
