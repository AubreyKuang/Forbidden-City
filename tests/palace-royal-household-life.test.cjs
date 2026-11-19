const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function married(sex='m'){
  const b=world();b.ctx.assert=assert;
  b.run(`var k=makeKid(a,'${sex}','允昭');k.born=S.turn-22*12;k.hp=95;k.adult=true;
    k.married=true;k.spouse={...marriageCandidate(k,'scholar'),marriedAt:S.turn-30,trust:76};
    var h=ensureMarriedLife(k);h.lastTick=S.turn;h.nextNews=S.turn+100;
    E().treasury=1200;PalaceActions.reset();`);
  return b;
}

test('the full household card follows the spouse portrait and a first pregnancy is visible in the roster',()=>{
  const b=married('f');
  b.run(`UI.sel=k.id;var html=viewKid(),portrait=html.indexOf('spouse-portrait'),panel=html.indexOf('household-panel');
    assert.ok(portrait>=0&&portrait<panel&&panel<html.indexOf('section-jumps'));
    assert.equal((html.match(/class="household-panel"/g)||[]).length,1);
    assert.match(html,/夫妻感情/);assert.doesNotMatch(html,/夫妻信任|禁止皇子纳妾/);
    assert.ok(startHouseholdPregnancy(k,k.spouse));assert.match(childListCard(k),/公主有喜/);
    assert.match(viewKid(),/允昭有孕/);
    S.turn+=9;var baby=deliverHouseholdChild(k,h.pregnancies[0]);assert.ok(baby);
    assert.match(viewKid(),new RegExp(baby.name));assert.match(viewKid(),/生母允昭/);`);
});

for(const sex of ['m','f'])test('eligible monthly conception keeps the existing 4.5% roll for a royal '+sex,()=>{
  const b=married(sex);
  b.run('S.turn+=1;S.flags.lastHouseholdScene=S.turn+100;');
  b.force(.0451);
  b.run('marriedLifeTick();assert.equal(h.pregnancies.length,0);S.turn+=1;');
  b.force(.0449,.1);
  b.run(`marriedLifeTick();assert.equal(h.pregnancies.length,1);
    assert.equal(h.pregnancies[0].mother,k.sex==='f'?k.id:k.spouse.id);`);
});

test('some poorly matched marriages persist at fifty, with their own respectful chronicle',()=>{
  const b=married();
  b.run(`k.spouse.trust=48;k.marriageNature={temperament:'自持',hobby:'books',spending:'节俭',space:'需要独处'};
    k.spouse.marriageNature={temperament:'爽朗',hobby:'riding',spending:'讲究',space:'喜欢相伴'};
    for(let i=0;i<100;i++){k.spouse.id='fixture-wife-'+i;if(marriageHash(k.id+':'+k.spouse.id+':household-affection')%100<30)break;}
    settleHouseholdAffection(k,h);assert.equal(h.affectionLimit,50);assert.equal(changeHouseholdAffection(k,18),2);
    assert.equal(k.spouse.trust,50);assert.equal(changeHouseholdAffection(k,8),0);
    assert.match(householdPanel(k),/相敬如宾.*上限 50/);assert.ok(marriagePanel(k).includes('夫妻感情 50 / 50'));
    h.pending={id:'cordial',turn:S.turn};var ev=householdSceneEvent(k);assert.match(ev.text,/两人各说一件府里待办的事/);
    pushEv(ev);choose(0);drain();
    assert.equal(k.spouse.trust,50);assert.match(k.spouse.story.at(-1).t,/两盏茶/);
    save('1');`);
  const next=boot(22,b.storage);next.ctx.assert=assert;
  next.run(`A.load('1');var k=S.children[0];assert.equal(k.household.affectionLimit,50);assert.equal(changeHouseholdAffection(k,7),0);`);
});

test('couple scenes reflect reading, quiet time, lively streets and the actual lantern season',()=>{
  const b=married();
  b.run(`k.marriageNature={temperament:'爽朗',hobby:'books',spending:'节俭',space:'需要独处'};
    S.month=1;var scenes=royalDomesticNews(k,k.spouse);
    for(const name of ['赌书泼茶','偷得浮生半日闲','花街同游','上元灯下','集市的一篮果子'])
      assert.ok(scenes.some(row=>row.title===name));
    assert.match(royalDomesticSceneRule('bookTea').ref,/赌书消得泼茶香，当时只道是寻常/);
    S.month=2;assert.ok(!royalDomesticNews(k,k.spouse).some(row=>row.title==='上元灯下'));
    k.away=true;assert.ok(!royalDomesticNews(k,k.spouse).some(row=>row.title==='花街同游'));`);
});

for(const [sex,name] of [['m','乔妤黛'],['f','乔明达']])test('a married royal can tour with their named spouse: '+sex,()=>{
  const b=married(sex);
  b.run(`var spouse=k.spouse;
    assert.match(householdPanel(k),/商议夫妻同游/);
    k.spouse.name='${name}';k.spouse.sur='乔';delete k.spouse.given;
    A.planBetrothedTravel(k.id);assert.equal(porName(curEv.cast[0]),'${name}');assert.ok(curEv.text.includes('${name}'));assert.match(curEv.text,/一同署了请出京游历的折子/);
    assert.match(curEv.choices[0].t,/准两人结伴/);
    choose(0);drain();
    assert.equal(royalTravelCompanion(k),spouse);assert.equal(householdActive(k),false);
    var route=k.royalTravel;S.turn=route.returnAt;advanceRoyalTravel(k);drain();
    assert.ok(householdActive(k));assert.equal(spouse.royalCompanionTrip,undefined);
    assert.ok(k.story.some(e=>e.life?.title==='夫妻同游'));
    assert.ok(spouse.story.some(e=>e.life?.title==='同行归来'));`);
});

test('a named official can recommend a consenting adult while the prince is distant from his wife',()=>{
  const b=married();b.run(`var sponsor=officialEntry(b.id+':brother');
    k.princeCircle={friends:[],officials:[{id:sponsor.p.id,name:sponsor.p.name,score:48}]};k.spouse.trust=42;
    assert.deepEqual(householdConcubineSponsors(k).map(e=>e.p.id),[sponsor.p.id]);
    var ev=householdConcubineEvent(k,{initiative:true,sponsor});assert.match(ev.title,/外家递帖/);
    assert.match(ev.text,new RegExp(sponsor.p.name));assert.match(ev.text,/已成年，愿亲自/);
    k.spouse.trust=75;assert.equal(ev.valid(),false);k.spouse.trust=42;
    pushEv(ev);choose(0);drain();
    assert.equal(h.concubines.length,1);assert.equal(h.concubines[0].sponsor,sponsor.p.id);
    assert.ok(sponsor.p.story.some(e=>e.t.includes(h.concubines[0].name)));
    S.turn+=3;assert.ok(startHouseholdPregnancy(k,h.concubines[0]));S.turn+=9;
    var baby=deliverHouseholdChild(k,h.pregnancies[0]);assert.equal(baby.motherName,h.concubines[0].name);`);
});

test('the player can forbid or restore concubinage, while a princess household has no concubine route',()=>{
  const b=married();b.run(`k.amb=80;k.spouse.trust=43;
    pushEv(householdConcubineEvent(k,{initiative:true}));assert.match(curEv.title,/自行请议/);
    choose(2);drain();assert.equal(h.concubineBan,true);assert.equal(h.concubines.length,0);
    assert.match(householdPanel(k),/奉旨禁止纳妾|解除纳妾禁令/);
    S.turn+=25;A.householdConcubine(k.id);assert.equal(modalOpen,false);
    A.householdConcubineBan(k.id,false);A.householdConcubine(k.id);assert.match(curEv.title,/纳妾之议/);drain();`);
  const f=married('f');f.run(`A.householdConcubineBan(k.id,true);assert.equal(h.concubineBan,undefined);
    assert.equal(householdConcubineEvent(k,{initiative:true}),null);assert.equal(h.concubines.length,0);`);
});
