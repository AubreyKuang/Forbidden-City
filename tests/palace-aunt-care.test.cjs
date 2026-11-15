const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(){const b=boot(202);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=36;S.year=4;S.month=6;E().energy=4;
 var m=harem()[0];m.sur='柳';m.given='清和';m.age=23;m.fam={t:'太后母家',p:72};m.clan='柳|太后母家';S.flags.dowager={name:'柳太后',sur:'柳',alive:true,clan:m.clan,fam:{...m.fam}};
 var aunt=makeKin(m,'堂');aunt.age=19;aunt.hp=90;aunt.sur='柳';aunt.given='清音';m.kin[aunt.id]='堂妹';aunt.kin[m.id]='堂姐';addConsort(aunt,3,'太后举荐');
 var k=makeKid(m,'m','承安');k.pendingName=false;m.alive=false;`);return b;}
test('an existing young dowager-family cousin can request her sisters child without kinArrival',()=>{const b=game();b.run(`assert.equal(aunt.kinArrival,undefined);assert.equal(fosterPetitioner(aunt),false);assert.ok(maternalKinMatch(aunt,k));
 var before=JSON.stringify(S),ev=maternalKinCareEvent(m);assert.ok(ev);assert.equal(JSON.stringify(S),before);assert.match(ev.text,/同出太后母家/);assert.match(ev.text,/清和|承安/);
 ev.onShow();assert.ok(aunt.story.some(s=>/主动请求照看承安/.test(s.t)));assert.equal(k.foster,undefined);ev.choices[0].f();assert.equal(k.foster,aunt.id);assert.equal(k.mom,m.id);
 assert.ok(m.story.some(s=>/获准照料/.test(s.t)));assert.equal(m.alive,false);assert.equal(pendingMaternalKinCare(),null);`);});
test('the actual dowager recommendation route produces an aunt who can care after the elder dies',()=>{const b=game();b.run(`S.consorts=[m];S.children=[];m.alive=true;m.lastBirth=-99;m.enteredAt=0;m.preg=0;S.flags.dowager.lastOffer=null;
 var proposal=dowagerProposal(S.flags.dowager);assert.ok(proposal);proposal.choices[0].f();var younger=harem().find(c=>c!==m);assert.ok(younger.kin[m.id]);
 var baby=makeKid(m,'f','明珠');m.alive=false;assert.ok(maternalKinMatch(younger,baby));var ev=maternalKinCareEvent(m);assert.equal(ev.por,younger);assert.match(ev.text,/太后母家/);`);});
test('own children, pregnancy, maternal high rank and heir status do not erase an aunts kinship',()=>{const b=game();b.run(`var own=makeKid(aunt,'f','明月');aunt.preg=4;m.rank=8;S.heir=k.id;
 assert.ok(maternalKinMatch(aunt,k));var ev=maternalKinCareEvent(m);assert.match(ev.text,/已有抚养孩子/);ev.choices[0].f();assert.equal(k.foster,aunt.id);assert.equal(own.mom,aunt.id);`);});
test('same surname or dowager clan alone is not enough to invent a sister',()=>{const b=game();b.run(`delete aunt.kin[m.id];delete m.kin[aunt.id];assert.equal(maternalKinMatch(aunt,k),false);assert.equal(maternalKinCareEvent(m),null);`);});
test('a live mother, existing caregiver, unavailable aunt and settled custody cannot be bypassed',()=>{const b=game();b.run(`m.alive=true;assert.equal(maternalKinCareEvent(m),null);m.alive=false;
 var other=harem().find(c=>c!==aunt);k.foster=other.id;assert.equal(maternalKinMatch(aunt,k),false);delete k.foster;
 for(var field of ['cold','gone','homeLeave','templeStay']){aunt[field]=true;assert.equal(maternalKinMatch(aunt,k),false);delete aunt[field];}
 var ev=maternalKinCareEvent(m);k.foster=other.id;assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.equal(k.foster,other.id);`);});
test('delivery queues one aunt petition for all siblings instead of generic individual foster dialogs',()=>{const b=game();b.run(`m.alive=true;S.children=[];m.preg=10;var count=rollBirthCount;rollBirthCount=()=>3;birthEvent(m);rollBirthCount=count;m.delivery.difficult=true;m.delivery.templeAdvice=null;
 for(var child of deliveryKids(m))child.pendingName=false;finishDelivery(m);assert.equal(Q.filter(e=>e.title==='姐妹留下的孩子').length,1);assert.equal(Q.filter(e=>e.title==='抚养').length,0);
 var ev=Q.find(e=>e.title==='姐妹留下的孩子');ev.onShow();ev.choices[0].f();assert.ok(deliveryKids(m).every(child=>child.foster===aunt.id));var n=k.story.length;assert.equal(ev.choices[0].f(),null);`);});
test('deferral leaves a durable profile entry and no automatic repeated petition',()=>{const b=game();b.run(`var ev=maternalKinCareEvent(m);ev.onShow();ev.choices[1].f();assert.equal(pendingMaternalKinCare(),null);assert.match(fosterWishButton(aunt),/谈谈照看柳清和的孩子/);
 A.maternalKinCare(aunt.id,m.id);assert.equal(curEv.title,'姐妹留下的孩子');choose(0);drain();assert.equal(k.foster,aunt.id);assert.equal(maternalKinCareButton(aunt),'');`);});
test('an old orphaned child surfaces at the next month without a chance roll or an invented new arrival',()=>{const b=game();b.run(`assert.ok(pendingMaternalKinCare());var before=S.consorts.length;A.endMonth();
 assert.ok(curEv?.title==='姐妹留下的孩子'||Q.some(ev=>ev.title==='姐妹留下的孩子'));assert.equal(S.consorts.length,before);drain();assert.equal(k.foster,aunt.id);`);});
test('pending and resolved aunt petitions survive a cold runtime reload without duplicate care',()=>{const b=game();b.run(`A.maternalKinCare(aunt.id,m.id);save('auto');`);
 const n=boot(999,b.storage);n.ctx.assert=assert;n.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'姐妹留下的孩子');var id=curEv.por.id;choose(0);save('auto');`);
 const r=boot(123,n.storage);r.ctx.assert=assert;r.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var k=S.children.find(k=>k.name==='承安');var n=k.story.length;choose(0);assert.equal(k.story.length,n);assert.ok(k.foster);`);});
test('the consort residence button follows moves and spends no action energy',()=>{const b=game();b.run(`var target=consortHomePlace(aunt);assert.ok(target);UI.sel=aunt.id;assert.match(viewConsort(),/A.visitConsortHome/);
 var energy=E().energy;A.visitConsortHome(aunt.id);assert.equal(UI.view,'palace');assert.equal(UI.sel,aunt.palace);assert.equal(E().energy,energy);
 drain();energy=E().energy;aunt.palace='翊坤宫';A.visitConsortHome(aunt.id);assert.equal(UI.sel,'翊坤宫');assert.equal(E().energy,energy);
 drain();aunt.cold=true;assert.equal(consortHomePlace(aunt),null);UI.view='consort';UI.sel=aunt.id;A.visitConsortHome(aunt.id);assert.equal(UI.view,'consort');`);});

test('a changed twin placement invalidates the old combined choice without recording false adoption',()=>{const b=game();b.run(`var twin=makeKid(m,'f','明月'),other=harem().find(c=>c!==aunt);var ev=maternalKinCareEvent(m);ev.onShow();twin.foster=other.id;assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.equal(k.foster,undefined);var revised=maternalKinCareEvent(m,aunt,true);assert.ok(revised);assert.ok(!revised.choices[0].t.includes('明月'));`);});
