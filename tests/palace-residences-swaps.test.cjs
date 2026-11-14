const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(842);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=60;E().energy=10;E().treasury=500;`);return b;}
const household=`var q=empress(),a=harem().find(c=>c!==q);Object.assign(a,{rank:5,palace:'景仁宫',residenceRoom:'main',trait:'温婉'});
 var b=makeGirl({given:'清棠',trait:'骄纵'});addConsort(b,5,'入宫');b.palace='咸福宫';b.residenceRoom='main';
 var c=makeGirl({given:'明玉',trait:'活泼'});addConsort(c,2,'入宫');c.palace='景仁宫';c.residenceRoom='side';
 var d=makeGirl({given:'云舒'});addConsort(d,2,'入宫');d.palace='咸福宫';d.residenceRoom='side';`;
test('migration keeps Kunning exclusive, repairs duplicate heads and is idempotent across saves',()=>{
 const {run}=boot();run(household+`a.palace='坤宁宫';delete a.residenceRoom;d.rank=5;d.residenceRoom='main';
 reconcileResidences();assert.deepEqual(residencePeople('坤宁宫').map(c=>c.id),[q.id]);assert.notEqual(a.palace,'坤宁宫');
 assert.equal(residencePeople('咸福宫').filter(c=>c.residenceRoom==='main').length,1);
 var before=JSON.stringify(S);reconcileResidences();assert.equal(JSON.stringify(S),before);var id=a.id;save('1');load('1');
 assert.notEqual(byId(id).palace,'坤宁宫');assert.equal(byId(id).story.filter(s=>s.t.includes('校正居册')).length,1);
 assert.equal(residenceMovePlan(byId(id),'坤宁宫','side'),null);assert.equal(residenceMovePlan(empress(),'景仁宫','main'),null);`);
});
test('palace heads and side rooms have finite capacity; overflow waits without evicting residents',()=>{
 const {run}=boot();run(`for(var n=0;n<55;n++){var c=makeGirl();addConsort(c,n<15?4:2,'测试入宫');}
 assert.equal(PALACES.filter(p=>palaceHost(p)).length,12);
 for(const name of PALACES){assert.ok(palaceSides(name).length<=3);assert.equal(residencePeople(name).filter(c=>c.residenceRoom==='main').length,1);}
 assert.ok(residencePeople(PALACE_WAITING).length>0);assert.equal(residencePeople('坤宁宫').length,1);
 var c=residencePeople(PALACE_WAITING)[0],head=palaceHost('景仁宫');head.cold=true;head.palace='冷宫';c.rank=4;reconcileResidences();
 assert.ok(palaceHost('景仁宫'));assert.equal(head.cold,true);assert.ok(residencePeople('景仁宫').length<=4);`);
});
test('temporary temple stays reserve rooms and cannot be evicted by a palace swap',()=>{
 const {run}=boot();run(household+`b.templeStay={due:S.turn+6};assert.equal(palaceHost('咸福宫'),b);assert.equal(residenceMovePlan(a,'咸福宫','main'),null);
 for(var n=0;n<2;n++){var x=makeGirl();addConsort(x,2,'入宫');x.palace='咸福宫';x.residenceRoom='side';}
 d.templeStay={due:S.turn+6};assert.equal(residenceMovePlan(c,'咸福宫','side'),null);assert.match(viewResidences(),/寺中暂修/);`);
});
test('manual cohabitation moves mother and young children, records the household and costs once',()=>{
 const {run}=boot();run(household+`var k=makeKid(c,'f','宁月');k.born=S.turn-36;var count=E().energy;
 A.openResidence(c.id);assert.match(viewResidences(),/与.*换宫|安排侧殿同住/);A.moveResidence(c.id,'咸福宫','side');
 assert.equal(E().energy,count);assert.match(curEv.text,new RegExp(fullName(b)));var f=curEv.choices[0].f;
 assert.ok(f());assert.equal(E().energy,count-1);assert.equal(f(),null);assert.equal(c.palace,'咸福宫');assert.equal(d.palace,'咸福宫');
 assert.match(childResidence(k),/咸福宫/);assert.ok(k.story.some(s=>s.t.includes('迁居咸福宫')));assert.ok(b.story.some(s=>s.t.includes(fullName(c))));
 Q.length=0;modalOpen=false;curEv=null;A.go('consort',c.id);A.backPerson('harem');assert.equal(UI.view,'residences');`);
});
test('two heads exchange palaces atomically while other residents stay and jealous displacement is remembered',()=>{
 const {run}=boot();run(household+`var before=relGet(a,b),mood=b.mood;var plan=residenceMovePlan(a,'咸福宫','main');assert.equal(plan.swap,b.id);
 assert.ok(settleResidenceMove(a,plan));assert.equal(a.palace,'咸福宫');assert.equal(b.palace,'景仁宫');assert.equal(c.palace,'景仁宫');assert.equal(d.palace,'咸福宫');
 assert.ok(b.mood<mood);assert.ok(relGet(a,b)<before);assert.equal(settleResidenceMove(a,plan),null);
 assert.ok(a.story.at(-1).t.includes(fullName(b)));assert.ok(b.story.at(-1).t.includes(fullName(a)));`);
});
test('stale placement and zero energy cannot overfill a palace or charge resources',()=>{
 const {run}=boot();run(household+`var plan=residenceMovePlan(c,'咸福宫','side');E().energy=0;assert.equal(settleResidenceMove(c,plan),null);
 E().energy=4;for(var n=0;n<2;n++){var x=makeGirl();addConsort(x,2,'入宫');x.palace='咸福宫';x.residenceRoom='side';}
 assert.equal(settleResidenceMove(c,plan),null);assert.equal(E().energy,4);assert.equal(c.palace,'景仁宫');
 c.cold=true;assert.equal(residenceMovePlan(c,'景阳宫','side'),null);assert.equal(residenceSlot(c,'景阳宫','side'),false);`);
});
test('requests use friendship, personality and actual map position, and only queueing starts cooldowns',()=>{
 const {run,force}=boot();run(household+`b.favor=90;b.lastResidenceMove=-99;b.lastResidenceRequest=-99;relAdd(c,d,60);c.lastResidenceMove=-99;
 var r=residencePetitionFor(b);assert.ok(r);assert.equal(palacePosition(r.plan.to),'近御花园');assert.equal(r.plan.swap,a.id);
 assert.equal(residencePetitionFor(c).plan.to,d.palace);b.trait='淡泊';b.palace='景仁宫';a.palace='承乾宫';
 assert.equal(palacePosition(residencePetitionFor(b).plan.to),'南隅清静');b.cold=true;assert.equal(residencePetitionFor(b),null);b.cold=false;
 var before=JSON.stringify(S);`);force(0,0);run(`var ev=residencePetitionEvent();assert.ok(ev);assert.equal(JSON.stringify(S),before);
 pushEv(ev);assert.equal(S.flags.lastResidenceRequest,S.turn);assert.equal(residencePetitionEvent(),null);choose(1);drain();`);
});
test('pending palace exchange and its completed result survive reload without double charging',()=>{
 const {run}=boot();run(household+`var aid=a.id,bid=b.id;A.openResidence(aid);A.moveResidence(aid,'咸福宫','main');save('1');A.load('1');
 assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'两宫换居');assert.equal(E().energy,10);choose(0);assert.equal(E().energy,9);
 save('2');A.load('2');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);assert.equal(E().energy,9);drain();
 assert.equal(byId(aid).palace,'咸福宫');assert.equal(byId(bid).palace,'景仁宫');`);
});
const setupSwap=`var m=harem()[1];m.preg=8;m.swapAsked=false;planBirthSwap(m,m,false);`;
test('healthy boys are never swapped and multiple births do not create contradictory swap stories',()=>{
 const {run,force}=boot();run(setupSwap+`var k=makeKid(m,'m','承安');`);force(0);run(`settleBirthSwap(m,k);assert.equal(k.birthSwap.occurred,false);assert.equal(k.birthSwap.motive,'none');assert.equal(k.sex,'m');
 m.swapAsked=false;planBirthSwap(m,m,false);var girl=makeKid(m,'f','昭宁');m.delivery={children:[girl.id,k.id]};settleBirthSwap(m,girl);assert.equal(girl.birthSwap.occurred,false);`);
});
test('daughter-for-son plot keeps original daughter biology and exposes motivation only after inquiry',()=>{
 const {run,force}=boot();run(setupSwap+`var k=makeKid(m,'f','昭宁'),born=k.born,traits=JSON.stringify(k.birthTraits);`);force(...Array(25).fill(0));run(`settleBirthSwap(m,k);assert.ok(k.birthSwap.occurred);
 assert.equal(k.sex,'m');assert.equal(k.birthSwap.original.sex,'f');assert.equal(JSON.stringify(k.birthSwap.original.birthTraits),traits);assert.equal(k.birthSwap.motive,'son-for-daughter');
 var fixed=JSON.stringify(k.birthSwap),id=k.id;save('1');load('1');k=kidById(id);m=byId(m.id);assert.equal(JSON.stringify(k.birthSwap),fixed);
 S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();beginParentageInquiry(k);S.turn++;var ev=birthSwapVerdictEvent(k);assert.match(ev.text,/原是女婴.*冒报皇子/);
 ev.onShow();var daughter=kidById(k.birthSwap.recovered);assert.equal(daughter.sex,'f');assert.equal(daughter.mom,m.id);assert.equal(daughter.born,born);
 assert.equal(k.mom,k.birthSwap.externalMother.id);assert.equal(k.foster,undefined);assert.match(birthSwapJusticeEvent(k).text,/产妇本人参与/);`);
});
test('concealed stillbirth is a deceased family record and can never become a recovered living child',()=>{
 const {run,force}=boot();run(setupSwap+`var k=makeKid(m,'m','承安');m.delivery={children:[k.id],originalLoss:true};`);force(...Array(25).fill(0));run(`settleBirthSwap(m,k);assert.ok(k.birthSwap.occurred);assert.equal(k.birthSwap.original.alive,false);
 S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();beginParentageInquiry(k);S.turn++;birthSwapVerdictEvent(k).onShow();
 assert.equal(kidById(k.birthSwap.memorialChild).alive,false);assert.match(birthSwapOriginalText(k),/出生时已无生息/);
 assert.equal(beginBirthSwapSearch(k),null);assert.equal(recoverOriginalChild(k,'寻回'),undefined);assert.equal(recoveredSwapEvent(),null);
 assert.ok(!birthSwapOriginalEvent(k).choices.some(c=>c.t.includes('另派人手')));var count=S.children.length;recordSwapStillbirth(k);confirmBirthSwap(k);assert.equal(S.children.length,count);
 assert.match(birthSwapCasePanel(k),/夭折已核实/);assert.doesNotMatch(birthSwapCasePanel(k),/尚未寻到/);`);
});
test('guarding prevents an exchange without changing a daughter or converting a loss to a living birth',()=>{
 const {run,force}=boot();run(setupSwap+`m.swapPlot.guarded=true;var k=makeKid(m,'f','昭宁');`);force(0);run(`settleBirthSwap(m,k);assert.equal(k.sex,'f');assert.equal(k.birthSwap.occurred,false);`);
});
test('actual delivery surfaces an unswapped stillbirth, saves the pending decision and settles once',()=>{
 const {run}=boot();run(setupSwap+`m.swapPlot.guarded=true;m.preg=10;var rollCount=rollBirthCount,rollRandom=Math.random;rollBirthCount=()=>1;Math.random=()=>.001;
 var ev=birthEvent(m);rollBirthCount=rollCount;Math.random=rollRandom;assert.equal(ev.title,'产房哀讯');assert.equal(pendingDelivery(),m);
 var id=m.id,k=deliveryKids(m)[0];assert.equal(k.alive,false);assert.equal(k.pendingName,false);assert.equal(k.birthSwap.occurred,false);
 save('1');load('1');m=byId(id);A.resumeBirth(id);assert.equal(curEv.title,'产房哀讯');choose(0);drain();assert.equal(pendingDelivery(),undefined);
 assert.equal(m.delivery.settled,true);assert.ok(m.story.some(s=>s.t.includes('无生息')));assert.equal(birthLossEvent(m),null);`);
});
const conceal=`var m=harem()[1];Object.assign(m,{preg:5,scheme:85,virtue:20,favor:70,swapAsked:false});m.pregnancyCalendar={term:10,conceived:S.turn-5,nights:[]};`;
test('hidden miscarriage requires a plausible motive and free movement, with palace-wide rarity and saved truth',()=>{
 const {run,force}=boot();run(conceal+`m.virtue=80;assert.equal(beginConcealedLoss(m),false);m.virtue=20;
 for(const flag of ['cold','gone','templeStay']){m[flag]=true;assert.equal(beginConcealedLoss(m),false);delete m[flag];}
 var boy=makeKid(m,'m','承玉');assert.equal(beginConcealedLoss(m),false);boy.alive=false;
 var before=S.children.length;`);force(.1);run(`assert.ok(beginConcealedLoss(m));assert.equal(m.preg,5);assert.equal(S.children.length,before);assert.ok(m.concealedLoss.smuggleSucceeds);
 assert.equal(beginConcealedLoss(m),false);var truth=JSON.stringify(m.concealedLoss),id=m.id;save('1');load('1');m=byId(id);assert.equal(JSON.stringify(m.concealedLoss),truth);
 assert.ok(!m.story.some(s=>s.t.includes('隐瞒小产')));assert.equal(concealedLossEligible(empress()),false);`);
});
test('early medical-record inquiry ends false pregnancy without creating a child or punishing the loss itself',()=>{
 const {run,force}=boot();run(conceal);force(.1);run(`beginConcealedLoss(m);S.turn=m.concealedLoss.clueDue;var ev=pendingConcealedLoss(),n=S.children.length;
 pushEv(ev);assert.equal(curEv.title,'迟来的脉案');E().energy=0;assert.equal(curEv.choices[0].cond(),false);E().energy=3;var f=curEv.choices[0].f;
 assert.match(f(),/小产本身不作罪责/);assert.equal(E().energy,2);assert.equal(f(),null);assert.equal(m.preg,0);assert.equal(concealedPregnancy(m),false);
 assert.equal(S.children.length,n);assert.equal(concealedDeliveryEvent(m),null);assert.ok(m.alive&&!m.cold);assert.equal(pendingConcealedLoss(),null);`);
});
test('concealed miscarriage imports one boy, keeps actual loss date, and never invents a recoverable child',()=>{
 const {run,force}=boot();run(conceal);force(.1);run(`beginConcealedLoss(m);var lossDate=m.concealedLoss.date,n=S.children.length;
 S.turn++;pushEv(pendingConcealedLoss());choose(1);drain();assert.ok(m.concealedLoss.watched);S.turn+=4;m.preg=10;
 pushEv(birthEvent(m));assert.equal(curEv.title,'弄璋弄瓦');assert.match(curEv.text,/报来喜讯/);assert.equal(S.children.length,n+1);
 var k=deliveryKids(m)[0];assert.equal(k.sex,'m');assert.equal(k.birthSwap.motive,'conceal-miscarriage');assert.equal(k.birthSwap.original,null);
 assert.equal(k.birthSwap.loss.date,lossDate);choose(0);drain();assert.equal(birthEvent(m),null);
 S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();beginParentageInquiry(k);S.turn++;var ev=birthSwapVerdictEvent(k);
 assert.match(ev.text,/已经小产/);assert.match(ev.text,/当月并未真正分娩/);ev.onShow();assert.equal(S.children.length,n+1);
 assert.equal(beginBirthSwapSearch(k),null);assert.equal(recoverOriginalChild(k,'追访'),undefined);assert.equal(recoveredSwapEvent(),null);
 assert.match(birthSwapOriginalText(k),/没有另一个足月出生/);assert.equal(k.birthTraits.father.kind,'outsider');assert.equal(k.mom,k.birthSwap.externalMother.id);
 assert.ok(birthSwapJusticeEvent(k));assert.ok(resolveBirthSwapJustice(k,'cold'));assert.equal(m.cold,true);assert.equal(k.alive,true);`);
});
test('a revealed miscarriage never produces a later random reunion, including after reload',()=>{
 const {run,force}=boot();run(conceal);force(.1);run(`beginConcealedLoss(m);m.preg=10;pushEv(birthEvent(m));choose(0);drain();
 var k=deliveryKids(m)[0];S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();beginParentageInquiry(k);S.turn++;birthSwapVerdictEvent(k).onShow();
 S.turn=k.birthSwap.turn+24;save('1');load('1');var n=S.children.length;`);force(0);run(`assert.equal(recoveredSwapEvent(),null);assert.equal(S.children.length,n);`);
});
test('failed smuggling and confinement cannot fabricate a baby; failure reports survive load and settle once',()=>{
 for(const confined of [false,true]){const {run,force}=boot();run(conceal);force(confined?.1:.9);run(`beginConcealedLoss(m);var n=S.children.length,id=m.id;m.preg=10;${confined?"m.cold=true;m.palace='冷宫';":''}
 var ev=birthEvent(m);assert.equal(ev.title,'空下来的襁褓');assert.equal(S.children.length,n);save('1');A.load('1');
 m=byId(id);assert.equal(curEv.title,'空下来的襁褓');var f=curEv.choices[0].f;assert.ok(f());assert.equal(f(),null);drain();
 assert.equal(m.preg,0);assert.equal(m.concealedLoss.pendingReport,false);assert.equal(S.children.length,n);`);}
});
test('hidden loss cannot trigger a second miscarriage scene or a biological pregnancy symptom scene',()=>{
 const {run,force}=boot();run(conceal);force(.1);run(`beginConcealedLoss(m);assert.equal(HAREM.find(f=>f.name==='slip')(),null);assert.equal(HAREM.find(f=>f.name==='crave')(),null);`);
});
test('medical clue pending choice and result replay without extra energy or a new loss roll',()=>{
 const {run,force}=boot();run(conceal);force(.1);run(`beginConcealedLoss(m);S.turn++;A.resumePendingScenes();assert.equal(curEv.title,'迟来的脉案');
 var id=m.id;save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'迟来的脉案');var energy=E().energy;
 choose(0);save('2');A.load('2');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);assert.equal(E().energy,energy-1);assert.equal(byId(id).preg,0);drain();`);
});
