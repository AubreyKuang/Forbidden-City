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
 w.run(`lady.preg=1;PalaceActions.reset();A.endMonth();drain();assert.ok(notes().some(x=>x.t.includes('·有孕】')));assert.equal(family.father.story.filter(e=>e.t.startsWith('【有孕】')).length,1);
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
test('both royal profiles open from admission and preserve their separate histories across old saves',()=>{
 const w=palace();w.run(`var king=family.father,prince=family.brother;
 assert.equal(king.name,'阿尔斯兰');assert.equal(prince.name,'伊利亚尔');
 for(const size of [34,144]){
   assert.match(porImg(king,size),/white-spring-king\\.webp/);
   assert.match(porImg(prince,size),/white-spring-prince\\.webp/);
 }
 for(const person of [ah.father,ah.brother,a,q,lady,'emp'].filter(Boolean)){
   assert.doesNotMatch(porImg(person,144),/white-spring-(king|prince)\\.webp/);
 }
 for(const p of [king,prince]){
   assert.doesNotMatch(porImg({...p,id:'ordinary-figure'},34),/white-spring-(king|prince)\\.webp/);
 }
 var admission=lady.story.find(e=>e.t.includes('，赐居'));
 assert.ok(king.story.some(e=>e.d===admission.d&&e.t.startsWith('【公主入宫】')));
 assert.ok(prince.story.some(e=>e.d===admission.d&&e.t.startsWith('【公主入宫】')));
 for(const p of [king,prince]){
   assert.ok(familyGraphSVG().includes(p.id));UI.familyMode='list';assert.ok(viewFamily().includes(p.id));
   UI.sel=id;assert.ok(viewConsort().includes(p.id));UI.sel=p.id;
   var html=viewWhiteSpringKin();assert.ok(html.includes(p.story[0].t));assert.ok(html.indexOf('person-detail-head')<html.indexOf('chronicle-filter-fold'));assert.ok(html.includes('按时间倒序'));assert.equal(chroniclePersonTarget(p.id).person,p);
 }
 whiteSpringLetter(lady,'有孕','有了身孕',['问起居','寄曲谱'],['回信','报平安'],'legacy');
 family.latest.answered=true;king.name='父王';prince.name='王兄';
 delete king.admissionRecorded;delete prince.admissionRecorded;
 king.story.shift();prince.story.shift();king.alive=false;
 save('auto');A.load('auto');drain();lady=byId(id);family=whiteSpringFamily(lady);
 assert.equal(family.latest.answered,true);assert.equal(family.stamps['有孕'],'legacy');
 assert.equal(family.father.alive,false);assert.equal(family.father.story.length,1);
 assert.ok(family.father.story[0].t.includes('问起居'));
 assert.ok(!family.brother.story.some(e=>e.t.includes('问起居')));
 assert.equal(family.brother.story.filter(e=>e.t.startsWith('【公主入宫】')).length,1);
 whiteSpringFamily(lady);assert.equal(family.brother.story.length,2);`);
});
test('the king and prince have distinct searchable premarriage memories without inventing reign dates',()=>{
 const w=palace();w.run(`const before=JSON.stringify(family);
 UI.sel=family.father.id;let html=viewWhiteSpringKin();
 assert.match(html,/公主入宫前/);assert.match(html,/旱年的水签/);assert.doesNotMatch(html,/三国行记/);
 UI.sel=family.brother.id;html=viewWhiteSpringKin();
 assert.match(html,/春会夺彩/);assert.match(html,/三国行记/);assert.doesNotMatch(html,/旱年的水签/);
 assert.equal(JSON.stringify(family),before);`);
});
test('home news arrives in two spaced chapters, keeps pending personal mail and respects deaths',()=>{
 const w=palace();w.run(`whiteSpringLetter(lady,'有孕','有了身孕',['问起居','寄曲谱'],['回信','报平安'],'still-open');
 const letter=family.latest,old={...lady};lady.enteredAt=S.turn-5;
 const nextMonth=()=>whiteSpringFamilyChanges(lady,old,{turn:S.turn-1,children:[]});
 nextMonth();assert.ok(!family.deeds?.saddle);
 S.turn++;nextMonth();nextMonth();assert.equal(family.brother.story.filter(e=>e.t.includes('【一副旧鞍】')).length,1);
 assert.equal(lady.story.filter(e=>e.t.includes('【白泉家音】')).length,1);assert.equal(family.latest,letter);
 S.turn+=11;nextMonth();assert.ok(!family.deeds.interpreters);
 family.father.alive=false;save('auto');A.load('auto');drain();lady=byId(id);family=whiteSpringFamily(lady);
 S.turn++;nextMonth();nextMonth();assert.equal(family.brother.story.filter(e=>e.t.includes('【市口的小译席】')).length,1);
 assert.ok(!family.father.story.some(e=>e.t.includes('【市口的小译席】')));
 assert.equal(lady.story.filter(e=>e.t.includes('【白泉家音】')).length,2);
 assert.equal(family.latest.stamp,'still-open');assert.equal(family.latest.answered,false);`);
});
