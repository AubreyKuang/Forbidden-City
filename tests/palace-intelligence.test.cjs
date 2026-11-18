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

test('verified family corruption affects the maternal house and prince support once; an untrue report does not',()=>{
 const b=start();b.ctx.assert=assert;
 b.run(`var entries=officialEntries().filter(e=>S.consorts.includes(e.c)&&officialServing(e.p));
  var target=entries[0],actor=entries.find(e=>e.p.id!==target.p.id&&e.c.id!==target.c.id);assert.ok(actor);
  var son=makeKid(target.c,'m','承安');son.born=S.turn-240;son.sup=50;var power=target.c.fam.p;
  var claim={kind:'rumor',target:target.key,targetId:target.p.id,accuserKey:actor.key,accuser:actor.p.id,charge:'门下收受地方馈赠',truth:false,status:'solved'};
  rumorReport(claim,true);assert.equal(target.c.fam.p,power);assert.equal(son.sup,50);
  claim.truth=true;rumorReport(claim,true);assert.equal(target.c.fam.p,Math.max(0,power-8));assert.equal(son.sup,45);
  rumorReport(claim,true);assert.equal(target.c.fam.p,Math.max(0,power-8));assert.equal(son.sup,45);
  assert.ok(son.story.some(s=>s.t.includes('朝中支持受到牵连')));`);
});

test('a maid posted to the target palace gains accuracy and the assignment survives reload',()=>{
 let b=start();b.run(`A.recruitIntelligenceAgent('maid');var agent=intelligenceAgent('maid');agent.ability=50;agent.loyalty=50;
  A.assignIntelligencePalace('maid',a.palace);assert.equal(agent.palace,a.palace);A.intelligenceDispatch('maid',file.id,a.id);
  assert.equal(intelligenceState().reports[0].accuracy,73);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
  assert.equal(intelligenceAgent('maid').palace,byId(intelligenceState().reports[0].suspect).palace);`);
});
