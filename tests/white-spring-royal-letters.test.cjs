const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
function palace(){
  const w=world();w.ctx.assert=assert;
  w.run(`A.storyCastVisit('ayimu');choose(0);drain();var lady=storyCastPerson(storyCastRecord('ayimu')),id=lady.id;
    var notes=()=>lady.story.filter(x=>x.t.startsWith('【白泉家书')),family=whiteSpringFamily(lady);`);
  return w;
}
test('the king and prince write when pregnancy is known and when actual babies are born across month end',()=>{
 const w=palace();
 w.run(`lady.preg=1;PalaceActions.reset();A.endMonth();drain();assert.ok(notes().some(x=>x.t.includes('·有孕】')));assert.equal(family.father.story.length,1);
 lady.preg=9;lady.pregnancyCalendar={term:10,conceived:S.turn-9,nights:[]};PalaceActions.reset();A.endMonth();drain();
 assert.equal(notes().filter(x=>x.t.includes('·诞育】')).length,1);assert.match(notes().find(x=>x.t.includes('·诞育】')).t,/皇子|公主/);
 assert.ok(family.brother.story.some(x=>x.t.includes('毡毯')));assert.ok(!lady.story.some(x=>x.t.includes('【娘家来信】')));
 var n=notes().length;save('auto');A.load('auto');drain();lady=byId(id);assert.equal(notes().length,n);`);
});
test('demotion, favor, simultaneous events and a single reply retain their own facts',()=>{
 const w=palace();w.run(`var old=JSON.parse(JSON.stringify(S));lady.favor=70;lady.rank++;courtFamilyLifeTick(old);courtFamilyLifeTick(old);
 assert.equal(notes().filter(x=>x.t.includes('·得宠】')).length,1);assert.equal(notes().filter(x=>x.t.includes('·晋封】')).length,1);
 A.demote(id);choose(0);drain();assert.match(family.latest.line,/降位.*改封/);
 A.whiteSpringReply(id);save('auto');A.load('auto');lady=byId(id);assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'寄往白泉的回信');
 choose(0);drain();family=lady.whiteSpringFamily;assert.ok(family.latest.answered);A.whiteSpringReply(id);assert.ok(!modalOpen);
 assert.equal(family.brother.story.filter(x=>x.t.includes('【宫中回信】')).length,1);`);
});
test('older domestic family data stops generating relatives or visits, without altering ordinary households',()=>{
 const w=palace();w.run(`delete lady.whiteSpringFamily;lady.house=JSON.parse(JSON.stringify(ah));lady.visitor={name:'旧访客',until:S.turn+2};lady.wish='mother';
 lady.kin={[a.id]:'亲姐'};(a.kin||={})[lady.id]='亲妹';var age=a.age;
 migrate();assert.equal(houseOf(lady),null);assert.ok(lady.formerNatalHouse);assert.equal(lady.visitor,undefined);
 assert.equal(lady.kin[a.id],undefined);assert.equal(a.kin[lady.id],undefined);assert.equal(a.age,age);assert.equal(momVisitButton(lady),'');
 var gold=E().treasury;A.momIn(id);assert.equal(E().treasury,gold);assert.equal(momVisit(lady,2),false);
 assert.equal(registeredSelectionSister(lady),null);assert.ok(!hasClan(lady));assert.ok(momVisitButton(a).includes('接母亲入宫'));
 UI.sel=id;assert.doesNotMatch(viewConsort(),/接母亲入宫|接她母亲入宫|准入宫探亲/);assert.match(familyGraphSVG(),/白泉王室/);
 natalFamilyTick();assert.equal(lady.house,undefined);assert.equal(officialEntries().some(e=>e.c.id===id),false);`);
});
test('Ayimu stays at court while ordinary consorts can visit home; an obsolete leave is cleared on load',()=>{
 const w=palace();w.run(`lady.hp=90;UI.sel=id;assert.doesNotMatch(viewConsort(),/准回家省亲/);
 assert.equal(homeLeaveEligible(lady),false);A.homeLeave(id);assert.equal(modalOpen,false);
 assert.equal(startHomeLeave(lady,2,'探病'),false);assert.equal(sickMotherEvent(lady),null);
 assert.equal(homeLeaveEligible(a),true);assert.ok(startHomeLeave(a,2));
 lady.homeLeave={from:S.turn,due:S.turn+2,reason:'省亲'};var aId=a.id;save('auto');A.load('auto');drain();
 assert.ok(inPalace(byId(id)));assert.equal(byId(id).homeLeave,undefined);
 assert.equal(byId(aId).homeLeave.due,S.turn+2);assert.ok(byId(id).whiteSpringFamily.father.alive);`);
});
