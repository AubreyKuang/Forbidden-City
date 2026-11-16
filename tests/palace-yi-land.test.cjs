const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function world(related=false){
 const b=boot(118);b.ctx.assert=assert;b.ctx.related=related;
 b.run(`A.start();drain();S.turn=120;S.year=11;S.month=9;S.flags.dowager.alive=false;E().treasury=2000;E().energy=10;
  var c=harem()[0];c.trait='持重';var h=houseOf(c),manager=h.father;
  manager.alive=true;manager.retired=false;manager.dismissed=false;manager.exiled=false;manager.age=50;manager.trust=65;
  var k=makeKid(c,'f','清宁');k.born=S.turn-156;k.pendingName=false;
  var auditor=makeScholar();auditor.name='沈谦';auditor.ability=95;auditor.career='official';auditor.office=auditor.post='户部主事';(S.scholars||=[]).push(auditor);
  var accomplice=h.brother||{name:'陈谦',age:39};h.brother=accomplice;houseOf(c);
  accomplice.ability=100;accomplice.career='official';accomplice.office=accomplice.post='户部主事';accomplice.alive=true;
  var project=(S.yiLands||={})[S.gen]={gen:S.gen,stage:'closed',title:'清河 · 赈济有方',key:c.id+':father',
   ...(related?{kin:c.id}:{}),thread:'local-duty:test-yi-land',stored:true};
  yiLandTick();var estate=project.estate;assert.equal(estate.units,0);assert.equal(estate.nextHarvest,S.turn+1);`);
 return b;
}

test('the earlier single harvest upgrades to a repeating asset and actually funds later locust and flood pleas',()=>{
 const b=world();
 b.run(`S.flags.grainReserveGen=S.gen;S.flags.grainReserveHalf=true;A.endMonth();drain();
  assert.equal(estate.units,1);assert.equal(halfGrainReserve(),true);
  var choice=monthlyGrainEvent(LOCUST_INDEX).choices.find(o=>o.t.startsWith('调义田半批租粮赈蝗灾'));
  assert.ok(choice.delegated);assert.ok(choice.f());assert.equal(choice.f(),null);assert.equal(estate.units,0);assert.ok(halfGrainReserve());
  assert.ok(!monthlyGrainEvent(LOCUST_INDEX).choices.some(o=>o.t.startsWith('调义田')));
  S.turn=estate.nextHarvest;yiLandTick();yiLandTick();assert.equal(estate.units,1);
  var flood=monthlyFloodEvent({floodNeed:'grain'}).choices.find(o=>o.t.startsWith('调义田半批租粮赈水灾'));
  assert.ok(flood.f());assert.equal(estate.units,0);assert.ok(halfGrainReserve());
  S.turn=estate.nextHarvest;yiLandTick();assert.equal(estate.units,1);
  assert.match(yiLandLedger().text,/义仓实存半批/);`);
});

test('a named independent auditor finds diversion after reload and the ruling reaches the real mother and child',()=>{
 let b=world(true);
 b.force(0,0);b.run(`S.turn=estate.nextHarvest;yiLandTick();assert.equal(estate.units,0);
  A.grainReserve();choose(curEv.choices.findIndex(o=>o.t==='查阅义田簿'));choose(0);
  assert.match(curEv.text,/尚未核实/);assert.ok(!curEv.choices.some(o=>o.person?.id===manager.id||o.person?.id===accomplice.id));
  choose(curEv.choices.findIndex(o=>o.t.includes('沈谦')));drain();
  var file=estate.case;assert.equal(auditor.yiAudit,file.id);assert.equal(officialServing(auditor),false);
  S.turn=file.due-1;A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.startsWith('义田复核')));save('1');`);
 b=boot(441,b.storage);b.ctx.assert=assert;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var estate=S.yiLands[S.gen].estate,file=estate.case,k=S.children.find(k=>k.name==='清宁'),c=byId(k.mom);
  var auditor=scholarList().find(p=>p.name==='沈谦');assert.match(pendingYiLandEvent().text,/转进了管账人的私仓/);
  for(var i=0;i<40&&modalOpen&&!curEv.title.startsWith('义田复核');i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(o=>!o.cond||o.cond()));}
  assert.match(curEv.title,/义田复核/);var mood=c.mood;choose(0);assert.ok(c.mood<mood);
  assert.equal(estate.units,1);assert.equal(estate.manager,null);assert.equal(auditor.yiAudit,undefined);
  assert.match(estate.lastRuling,/查实克扣.*追缴.*公管/);
  assert.ok(c.story.some(e=>e.thread===S.yiLands[S.gen].thread&&e.t.includes('娘家的过失')));
  assert.ok(k.story.some(e=>e.thread===S.yiLands[S.gen].thread&&e.t.includes('自家人')));
  assert.ok(auditor.story.some(e=>e.t.includes('查实克扣')));drain();
  S.turn=estate.nextHarvest;yiLandTick();assert.equal(estate.units,2);assert.equal(pendingYiLandEvent(),null);`);
});

for(const [roll,kind] of [[.4,'favor'],[.99,'clerical']])test('the estate distinguishes '+kind+' from the original suspicion',()=>{
 const b=world(true);
 b.force(0,roll);b.run(`S.turn=estate.nextHarvest;yiLandTick();
  var f=estate.case;assert.equal(f.kind,'${kind}');var warning=pendingYiLandEvent();warning.choices.at(-1).f();
  assert.equal(pendingYiLandEvent(),null);assert.ok(yiLandLedger().choices.some(o=>o.t.includes('账案')));
  yiLandAuditEvent(project).choices.find(o=>o.person?.name==='沈谦').f();
  S.turn=f.due;var report=pendingYiLandEvent(),before=estate.units,trust=manager.trust;
  assert.match(report.text,/${kind==='favor'?'先发给了管账人的亲族':'实物俱在'}/);
  report.choices[${kind==='favor'?1:0}].f();report.choices[0].f();
  assert.equal(estate.units,before+${kind==='favor'?1:0});assert.equal(manager.trust,trust-${kind==='favor'?4:0});
  assert.equal(estate.oversight,${kind==='favor'?'true':'undefined'});assert.ok(estate.manager);assert.equal(auditor.yiAudit,undefined);`);
});

test('a verified local relief memorial opens the estate through the normal commendation choice',()=>{
 const b=world(true);
 b.run(`delete S.yiLands;var officer=courtPerson(c.id+':father'),p=officer.p;
  p.office=p.post='清河知县';p.ability=85;p.trust=70;
  p.report={id:'formation-check',edition:24,kind:'local',taskId:'grain',title:'清河 · 赈济有方',office:p.office,outcome:'success',verified:true,text:'逐户核验赈粮已发。'};
  A.officialReport(officer.key);choose(curEv.choices.findIndex(o=>o.t.includes('留任推行善政')));drain();
  var plot=S.yiLands[S.gen];assert.equal(plot.stage,'offer');assert.equal(plot.kin,c.id);assert.equal(pendingYiLandEvent(),null);
  S.turn=plot.due;var cash=E().treasury;pendingYiLandEvent().choices[0].f();
  assert.equal(E().treasury,cash-35);assert.equal(plot.stage,'collecting');assert.equal(plot.estate,undefined);
  clearGrainReserve();S.turn=plot.due;pendingYiLandEvent().choices[0].f();
  assert.equal(halfGrainReserve(),true);assert.equal(plot.estate.units,0);
  assert.equal(plot.estate.manager.id,p.id);assert.ok(p.story.some(e=>e.thread===plot.thread&&e.t.includes('义田首收')));
  var key=S.gen+':'+p.id;A.chronicleThread(key,p.story.findIndex(e=>e.thread===plot.thread));
  assert.equal(UI.chronicleFilters[key].thread,plot.thread);`);
});
