const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./playtest-harness.cjs');
function world(n=31){
 const b=boot(917);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=60;S.year=6;S.month=6;E().energy=4;S.consorts=[];S.children=[];S.rel={};
 for(var i=0;i<${n};i++){var c=makeGirl({age:24,trait:'持重'});addConsort(c,3,'入宫');c.hp=90;c.preg=0;c.solitary=null;}
 delete S.flags.haremRestraint;PalaceActions.reset();`);return b;
}
test('threshold is strictly above thirty and non-consorts do not inflate it',()=>{
 const b=world(30);b.force(.99);b.run(`assert.equal(livingConsortCount(),30);assert.equal(newConsortEventAllowed(),true);assert.equal(R(),.99);
 S.consorts[0].cold=true;S.consorts[1].homeLeave={due:99};S.consorts[2].templeStay={due:99};assert.equal(livingConsortCount(),30);
 var g=makeGirl();g.maid=true;S.consorts.push(g);assert.equal(livingConsortCount(),30);g.maid=false;assert.equal(livingConsortCount(),31);
 g.gone=true;assert.equal(livingConsortCount(),30);g.gone=false;g.alive=false;assert.equal(livingConsortCount(),30);`);
});
test('crowded introductions pass only a tenth of their original opportunities',()=>{
 const b=world();let passed=0;
 for(let i=0;i<100;i++){b.force((i+.5)/100);if(b.run('newConsortEventAllowed()'))passed++;}
 assert.equal(passed,10);
 b.run(`var before=JSON.stringify(S);haremRestraintPanel();haremRestraintPanel();assert.equal(JSON.stringify(S),before);`);
});
test('suppressed foreign introductions do not create people or invalidate an existing audience',()=>{
 const b=world();b.force(.9);b.run(`var before=S.nid;assert.equal(COURT[8](),null);assert.equal(S.nid,before);var guest=makeForeignConsort();`);
 b.force(.9);b.run(`var ev=COURT[8]({guest});assert.equal(ev.por,guest);ev.choices[0].f();assert.equal(livingConsortCount(),32);`);
});
test('new maid offers are reduced while known maid relationships remain available',()=>{
 const b=world();b.force(.9);b.run(`var before=S.nid;assert.equal(maidEvent('御花园'),null);assert.equal(S.nid,before);`);
 b.force(.9);b.run(`assert.equal(teaMaid(),null);assert.equal(S.nid,before);
 var m=makeGirl();m.maid=true;m.near=false;m.nights=1;m.preg=0;S.consorts.push(m);`);
 b.force(0);b.run(`assert.ok(maidEvent('御花园'));m.near=true;assert.ok(nearMaidEvent());`);
});
test('dowager suppression does not spend her recommendation or manufacture a cousin',()=>{
 const b=world();b.run(`var d=ensureDowager();d.lastOffer=null;d.clan='new-maternal-clan';var before=S.nid;`);b.force(.9);
 b.run(`assert.equal(dowagerProposal(d),null);assert.equal(d.lastOffer,null);assert.equal(S.nid,before);`);
});
test('unsolicited aunt arrival is reduced but a pending letter and manual follow-up remain',()=>{
 const b=world(32);b.run(`var m=S.consorts[0],h=houseOf(m);h.relatives=[];var p=addNatalPerson(m,h,'f',25,123,false);p.willing=true;p.married=false;
 var k=makeKid(m,'f','明月');k.born=S.turn-36;k.pendingName=false;m.alive=false;assert.equal(livingConsortCount(),31);`);
 b.force(.9);b.run(`assert.equal(maternalSisterArrival(m),null);assert.equal(m.maternalArrival,undefined);
 var manual=maternalSisterArrival(m,true);assert.ok(manual);manual.onShow();assert.equal(m.maternalArrival.status,'pending');`);
 b.force(.9);b.run(`assert.ok(maternalSisterArrival(m));`);
});
test('manual selection can still admit a chosen consort beyond thirty',()=>{
 const b=world();b.run(`haremRestraintState(true).pauseUntil=S.turn+6;S.flags.lastXX=S.turn-36;A.xxDecree();assert.equal(S.cands.length,6);
 var id=S.cands[0].id;A.xxTake(id);choose(2);assert.ok(byId(id));assert.equal(livingConsortCount(),32);`);
});
test('many bereaved families share one unsolicited arrival opportunity and pending letters take precedence',()=>{
 const b=world(34);b.run(`var mothers=S.consorts.slice(0,3);
 for(var m of mothers){var h=houseOf(m);h.relatives=[];var p=addNatalPerson(m,h,'f',25,123,false);p.willing=true;p.married=false;
 var k=makeKid(m,'f','明月');k.born=S.turn-36;k.pendingName=false;m.alive=false;}
 assert.equal(livingConsortCount(),31);`);
 b.force(.9,0);b.run(`assert.equal(pendingMaternalSisterArrival(),null);assert.equal(R(),0);
 var manual=maternalSisterArrival(mothers[2],true);manual.onShow();`);
 b.force(.9);b.run(`var ev=pendingMaternalSisterArrival();assert.ok(ev);assert.equal(ev.por.id,mothers[2].maternalArrival.relative);`);
});
test('healthy diligent ruler gets restrained advice, not invented neglect or illness',()=>{
 const b=world();b.run(`haremRestraintState(true).months=[57,58,59].map(turn=>({turn,court:true,nights:1}));E().health=90;
 var ev=haremRemonstranceEvent();assert.match(ev.text,/近来按月批复/);assert.doesNotMatch(ev.text,/昏君|龙体欠安|未获批复/);assert.equal(haremRestraintState().lastAdvice,null);
 pushEv(ev);assert.equal(haremRestraintState().lastAdvice,S.turn);choose(1);assert.equal(haremRestraintState().pauseUntil,null);`);
});
test('warnings use three actual monthly records, recent summons and actual health',()=>{
 const b=world();b.run(`var s=haremRestraintState(true);s.months=[{turn:57,court:false,nights:1},{turn:58,court:false,nights:2},{turn:59,court:true,nights:5}];
 var ev=haremRemonstranceEvent();assert.match(ev.text,/昏君之讥/);assert.match(ev.text,/召幸 5 次/);assert.doesNotMatch(ev.text,/龙体欠安/);
 E().health=45;assert.match(haremRemonstranceEvent().text,/龙体欠安/);s.months=[];assert.doesNotMatch(haremRemonstranceEvent().text,/未获批复|昏君/);`);
});
test('accepting advice pauses unsolicited proposals for six months, survives saves and cannot double reward',()=>{
 const b=world();b.run(`pushEv(haremRemonstranceEvent());var prestige=E().prestige;choose(0);var until=haremRestraintState().pauseUntil;
 assert.equal(until,66);assert.equal(E().prestige,prestige+2);choose(0);assert.equal(E().prestige,prestige+2);assert.equal(haremRestraintState().history.length,1);
 drain();save('1');load('1');assert.equal(haremRestraintState().pauseUntil,until);assert.equal(newConsortEventAllowed(),false);
 S.turn=65;assert.equal(haremRemonstranceEvent(),null);S.turn=66;assert.ok(haremRemonstranceEvent());`);
 b.force(0);b.run(`assert.equal(newConsortEventAllowed(),true);`);
});
test('declining advice has recorded consequences and does not fabricate a dismissal',()=>{
 const b=world();b.run(`var ev=haremRemonstranceEvent(),p=ev.por,before=E().prestige;assert.ok(p);pushEv(ev);choose(2);
 assert.equal(E().prestige,before-3);assert.equal(p.dismissed,undefined);assert.ok(p.story.some(x=>x.t.includes('斥退奏疏')));
 assert.ok(S.consorts.some(c=>c.story.some(x=>x.t.includes('慎增内廷')&&x.t.includes('不安'))));assert.equal(haremRemonstranceEvent(),null);`);
});
test('unavailable officials never present the memorial and stale choices cannot grant rewards',()=>{
 const b=world();b.run(`for(var e of officialEntries())e.p.retired=true;var ev=haremRemonstranceEvent();assert.equal(ev.por,undefined);assert.match(ev.text,/一位谏官/);
 S.consorts[0].alive=false;var before=E().prestige;assert.equal(ev.choices[0].f(),null);assert.equal(E().prestige,before);assert.equal(haremRemonstranceEvent(),null);`);
});
test('month records capture summons before reset and warnings occur automatically with replay',()=>{
 const b=world();b.run(`E().nightsMonth=5;S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:11,done:true};A.endMonth();
 assert.equal(haremRestraintState().months.at(-1).nights,5);assert.equal(haremRestraintState().months.at(-1).court,true);
 assert.ok([curEv,...Q].some(e=>e?.title==='朝臣上疏 · 慎增内廷'));save('1');`);
 const copy=boot(99,b.storage);copy.ctx.assert=assert;copy.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
 assert.ok([curEv,...Q].some(e=>e?.title==='朝臣上疏 · 慎增内廷'));drain();assert.equal(haremRestraintState().history.length,1);`);
});
test('generation change forgets prior reign warnings, pauses and neglect',()=>{
 const b=world();b.run(`var s=haremRestraintState(true);s.pauseUntil=99;s.lastAdvice=60;s.months=[{turn:59,court:false}];S.gen++;
 assert.equal(haremRestraintState(),null);assert.equal(haremRestraintState(true).months.length,0);assert.equal(haremRestraintState().pauseUntil,null);`);
});
for(const fixture of JSON.parse(fs.readFileSync(__dirname+'/fixtures/harem-restraint-v5.json','utf8')))test('real v5 '+fixture.mode+' pending save retains old behavior until finished',()=>{
 const b=boot();b.ctx.assert=assert;b.ctx.fixture=fixture.save;b.run(`S=fixture;assert.equal(PalaceActions.restore(S.pendingActions),true);
 assert.equal(PalaceActions.contentVersion,5);assert.equal(haremRestraintEnabled(),false);drain();assert.equal(haremRestraintEnabled(),true);`);
});
