const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function family(sex='m'){
 const b=world();b.ctx.assert=assert;b.ctx.sex=sex;
 b.run(`var k=makeKid(a,sex,'允昭');k.born=S.turn-5*12;k.pendingName=false;k.hp=95;
    var p=addNatalPerson(a,ah,k.sex==='m'?'f':'m',6,733,false);
    p.parentRelativeId=wife.id;p.born=k.born-12;p.fatherName='顾闻道';p.sur='顾';p.name='顾'+p.given;
    a.house.father.alive=true;E().energy=30;E().treasury=1200;PalaceActions.reset();`);
 b.force(0,.01);
 b.run(`var proposal=royalNatalMarriageProposal();assert.ok(proposal);proposal.onShow();proposal.choices[0].f();
    assert.equal(k.betrothal.personId,p.id);var kid=k.id,host=a.id,relative=p.id;PalaceActions.reset();`);
 return b;
}
function resume(b){
 const c=boot(166,b.storage);c.ctx.assert=assert;
 c.ctx.ids=JSON.parse(b.run('JSON.stringify([kid,host,relative])'));
 c.run('var [kid,host,relative]=ids;');
 return c;
}
const reopen=`A.load('1');assert.equal(PalaceActions.blocked,false);
 var k=kidById(kid),a=byId(host),p=natalEntry(host,relative).p;`;
const ageUp=`S.turn=k.born+16*12;k.immortalTalent=null;k.hp=96;PalaceActions.reset();`;

test('banquet invitation and a family visit give the children different shared scenes',()=>{
 let b=family();
 b.run(`A.openBanquet();A.banquetInviteAll(true);
   assert.match(viewBanquet(),/随长辈赴宴的外家孩子/);
   A.banquetBetrothed(kid);assert.match(viewBanquet(),/已请.*随长辈赴宴/);
   A.holdBanquet();choose(0);assert.equal(curEv.title,'两小无猜 · 谁分点心');save('1');`);
 b=resume(b);
 b.run(`${reopen}assert.equal(curEv.title,'两小无猜 · 谁分点心');
   assert.match(curEv.text,/长辈.*兔子酥/);choose(1);drain();
   assert.equal(k.betrothal.childhood.count,1);assert.deepEqual(Array.from(k.betrothal.childhood.items),['画在包纸上的小兔']);
   assert.ok(k.betrothal&&!k.married);assert.ok(p.betrothal&&!p.married);
   assert.equal(p.visit,undefined);assert.ok(p.story.at(-1).life.title.includes('谁分点心'));
   S.turn+=4;A.natalVisit(host,relative);choose(0);assert.equal(curEv.title,'探亲相见');
   choose(curEv.choices.findIndex(c=>c.t.includes('两个孩子')));
   assert.equal(curEv.title,'两小无猜 · 燕尾朝哪儿');assert.match(curEv.text,/探亲.*小燕子/);
   choose(0);drain();assert.equal(k.betrothal.childhood.count,2);assert.ok(p.visit);
   for(const person of [k,p]){
    var notes=person.story.filter(e=>e.thread?.startsWith('childhood-betrothal:'));
    assert.equal(notes.length,2);assert.notEqual(notes[0].life.title,notes[1].life.title);
   }
   assert.equal(childhoodBetrothalVisit(a,p),null);`);
});

test('an actual attendance link and a live childhood betrothal are required',()=>{
 const b=family('f');
 b.run(`A.openBanquet();A.banquetInviteAll(true);
   assert.equal(betrothedBanquetEvents(UI.banquet,banquetKind('garden'),[k,a]).length,0);
   A.banquetBetrothed(kid);assert.equal(betrothedBanquetEvents(UI.banquet,banquetKind('garden'),[a]).length,0);
   var e=betrothedBanquetEvents(UI.banquet,banquetKind('garden'),[k,a])[0];
   assert.ok(e);p.betrothal.personId=999;
   assert.equal(e.valid(),false);assert.equal(e.choices[0].f(),null);
   p.betrothal.personId=k.id;p.born=S.turn-16*12;
   assert.equal(childhoodBetrothalMeetReady(childhoodBetrothalPair(k)),false);`);
});

for(const sex of ['m','f'])test('a royal '+sex+' can travel with their intended partner, sharing every stop and returning to marry',()=>{
 let b=family(sex);
 b.run(`k.betrothal.childhood={count:2,last:S.turn,items:['折歪尾巴的纸燕']};
   ${ageUp}assert.equal(kidAge(k),16);assert.ok(royalTravelCanLeave(k));assert.match(royalNatalPartnerPanel(k),/商议结伴游历/);
   A.planBetrothedTravel(kid);assert.equal(curEv.title,'皇嗣请行 · 游历山河');
   assert.match(curEv.text,/心意.*长辈回信/);assert.match(curEv.choices[0].t,/准两人结伴/);save('1');`);
 b=resume(b);
 b.run(`${reopen}assert.equal(curEv.title,'皇嗣请行 · 游历山河');
   var cash=E().treasury;choose(0);drain();assert.equal(E().treasury,cash-20);
   assert.equal(p.royalCompanionTrip.royalId,kid);assert.equal(royalTravelCompanion(k),p);
   assert.ok(royalTravelAway(k));assert.equal(natalVisitReady(a,p),false);
   assert.match(natalStatus(p),/结伴游历中/);assert.match(companionTravelPanel(p),/结伴游历/);
   assert.equal(p.story.at(-1).life.title,'旧约同行');assert.match(p.story.at(-1).t,/折歪尾巴的纸燕/);
   var r=k.royalTravel,route=royalItinerary(r);assert.ok(route);
   for(const stop of route.stops){S.turn=r.departed+stop[0];advanceRoyalTravel(k);advanceRoyalTravel(k);}
   for(const person of [k,p])assert.equal(person.story.filter(e=>e.life?.title.startsWith('同行手记')).length,route.stops.length);
   S.turn=Math.max(k.betrothal.due,royalTravelReturnAt(r));royalNatalMarriageTick();
   assert.equal(k.married,false);assert.match(royalNatalPartnerPanel(k),/归来后再依礼成婚/);
   advanceRoyalTravel(k);assert.equal(r.stage,'returned');assert.equal(p.royalCompanionTrip,undefined);
   assert.ok(p.story.some(e=>e.life?.title==='同行归来'));
   royalNatalMarriageTick();assert.equal(k.spouse.personId,p.id);
   assert.equal(p.spouse.royalId,k.id);assert.equal(k.betrothal,undefined);`);
});

test('both must be sixteen and free to travel, and recall, cancellation and a solo trip never strand the partner',()=>{
 const b=family();
 b.run(`S.turn=k.born+15*12;assert.equal(royalTravelCanLeave(k),false);
   ${ageUp}p.exiled=true;assert.equal(royalTravelCanLeave(k),false);p.exiled=false;
   A.planBetrothedTravel(kid);choose(0);drain();assert.ok(p.royalCompanionTrip);
   A.royalTravelRecall(kid);choose(0);drain();
   assert.equal(p.royalCompanionTrip,undefined);assert.equal(k.royalTravel.companion.outcome,'returned');
   assert.equal(p.story.filter(e=>e.life?.title==='同行归来').length,1);`);
 const b2=family();
 b2.run(`${ageUp}A.planBetrothedTravel(kid);choose(0);drain();
   royalNatalCancel(k,p);assert.equal(p.royalCompanionTrip,undefined);assert.equal(k.royalTravel.companion.outcome,'separated');
   assert.equal(royalTravelAway(k),true);advanceRoyalTravel(k);
   assert.equal(p.story.filter(e=>e.life?.title==='同行暂别').length,1);`);
 const b3=family();
 b3.run(`${ageUp}A.planBetrothedTravel(kid);choose(1);drain();
   assert.equal(royalTravelAway(k),true);assert.ok(!p.royalCompanionTrip&&k.betrothal);`);
});

test('a couple already married through their childhood promise can also take the trip',()=>{
 const b=family('f');
 b.run(`k.betrothal.childhood={count:1,last:S.turn,items:['画在包纸上的小兔']};
   S.turn=k.betrothal.due;k.hp=95;royalNatalMarriageTick();
   assert.ok(k.married&&p.married);assert.equal(k.spouse.childhoodBetrothal.childhood.count,1);
   // A completed marriage from before this feature still has its original engagement chronicle.
   delete k.spouse.childhoodBetrothal;
   assert.match(royalNatalPartnerPanel(k),/商议结伴游历/);
   PalaceActions.reset();A.planBetrothedTravel(kid);choose(0);drain();
   assert.equal(royalTravelCompanion(k),p);assert.equal(householdActive(k),false);
   var trust=k.spouse.trust,r=k.royalTravel,route=royalItinerary(r);
   S.turn=r.departed+route.stops[0][0];advanceRoyalTravel(k);assert.ok(k.spouse.trust>=trust);
   S.turn=r.returnAt;advanceRoyalTravel(k);
   assert.ok(k.married&&p.married&&householdActive(k));assert.equal(p.royalCompanionTrip,undefined);
   assert.match(p.story.find(e=>e.life?.title==='同行归来').t,/回京安顿后/);`);
});
