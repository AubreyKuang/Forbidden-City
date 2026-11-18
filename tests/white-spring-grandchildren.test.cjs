const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');

function whiteSpringWorld(){
  const b=world();b.ctx.assert=assert;
  b.run(`const r=storyCastCreate('ayimu');storyCastAdmit(r.person,r,'入宫');
    var m=byId(r.id),k=makeKid(m,'f','清竹');k.born=S.turn-22*12;
    A.kidMarriage(k.id);choose(curEv.choices.findIndex(o=>o.t.includes('白泉国')));choose(0);drain();
    k.spouse.trust=80;k.spouse.born=k.born;k.foster=a.id;S.turn+=4;
    assert.ok(startHouseholdPregnancy(k,k.spouse));var pregnancy=k.household.pregnancies[0];S.turn+=9;
    var c=deliverHouseholdChild(k,pregnancy);assert.equal(curEv.title,'白泉家书 · 添丁报喜');drain();
    assert.equal(deliverHouseholdChild(k,pregnancy),null);
    for(const person of [m,k,c])assert.equal(person.story.filter(e=>e.t.includes('【白泉报喜】')).length,1);
    assert.ok(!a.story.some(e=>e.t.includes('【白泉报喜】')));`);
  return b;
}
test('White Spring birthday, invitation, reloaded stay and return use all three original diaries',()=>{
  const b=whiteSpringWorld();
  b.run(`S.turn+=12;whiteSpringFamilyTick(k);whiteSpringFamilyTick(k);
    for(const person of [m,k,c])assert.equal(person.story.filter(e=>e.t.includes('【白泉周岁】')).length,1);
    S.turn+=23;A.whiteSpringInvite(k.id,c.id);assert.equal(modalOpen,false);
    S.turn++;whiteSpringFamilyTick(k);assert.equal(curEv.title,'白泉家书 · 接女儿回宫');choose(1);drain();
    assert.match(householdPanel(k),/回宫小住/);A.whiteSpringInvite(k.id,c.id);save('auto');`);
  const next=boot(391,b.storage);next.ctx.assert=assert;
  next.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'白泉家书 · 接女儿回宫');
    var k=S.children.find(k=>k.name==='清竹'),m=byId(k.mom),c=k.household.children[0];
    choose(0);drain();assert.equal(childWhereabouts(k),'白泉国');
    S.turn++;marriedLifeTick();drain();assert.equal(childWhereabouts(k),'宫中小住');
    assert.match(storyCastPanel(m),/正在宫中陪伴阿依慕/);assert.equal(k.estate.location,'白泉国');
    assert.equal(householdCanConceive(k,k.spouse),false);A.princessVisit(k.id);assert.equal(modalOpen,false);
    A.whiteSpringFamilySong(k.id);choose(0);drain();A.whiteSpringFamilySong(k.id);assert.equal(modalOpen,false);
    S.turn++;marriedLifeTick();assert.equal(k.household.whiteSpringVisit.stage,'palace');
    k.spouse.alive=false;S.turn++;marriedLifeTick();marriedLifeTick();
    assert.equal(childWhereabouts(k),'白泉国');assert.equal(k.household.children.length,1);
    for(const person of [m,k,c])for(const title of ['白泉归宁','两处乡音','辞宫返白泉'])assert.equal(person.story.filter(e=>e.t.includes('【'+title+'】')).length,1);
    assert.equal(whiteSpringCanInvite(k,c,m),false);S.turn+=36;assert.equal(whiteSpringCanInvite(k,c,m),true);`);
});
test('older children can visit without invented birth notices, unrelated families and unavailable relatives cannot',()=>{
  const b=whiteSpringWorld();b.run(`delete c.story;S.turn+=80;
    k.spouse.route='frontier';whiteSpringFamilyTick(k);assert.equal(whiteSpringFamilyPanel(k),'');
    k.spouse.route='whiteSpring';c.alive=false;whiteSpringFamilyTick(k);assert.equal(modalOpen,false);c.alive=true;
    m.cold=true;A.whiteSpringInvite(k.id,c.id);assert.equal(modalOpen,false);m.cold=false;
    whiteSpringFamilyTick(k);choose(0);drain();S.turn++;whiteSpringFamilyTick(k);drain();
    assert.deepEqual(Array.from(c.story,e=>e.t.slice(0,6)),['【白泉归宁】']);m.alive=false;
    whiteSpringFamilyTick(k);assert.equal(childWhereabouts(k),'白泉国');assert.match(c.story.at(-1).t,/提前回了白泉/);`);
});
