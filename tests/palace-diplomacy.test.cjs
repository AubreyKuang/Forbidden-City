const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function start(){const b=boot(66001);b.ctx.assert=assert;b.run(`A.start();drain();E().energy=10;E().treasury=1000;var envoy=officialEntries().find(e=>officialServing(e.p)&&!e.p.away);assert.ok(envoy);`);return b;}
test('an envoy, their duty, and the predetermined outcome survive a reload and settle once',()=>{
 let b=start();b.force(.001);b.run(`var before=E().treasury;A.sendDiplomaticEnvoy('sea','trade',encodeURIComponent(envoy.key));
  var mission=diplomacyState().missions[0];assert.equal(E().treasury,before-30);assert.equal(officialServing(envoy.p),false);
  assert.equal(officialStatus(envoy.p),'奉使在外');assert.equal(mission.due,S.turn+3);save('auto');`);
 b=boot(2,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var mission=diplomacyState().missions[0],envoy=officialEntry(mission.envoyKey);
  S.turn=mission.due;diplomacyTick();assert.equal(mission.status,'success');assert.equal(diplomacyCountry('sea').trade,true);assert.equal(diplomacyCountry('sea').envoy.attitude,54);assert.equal(diplomacyCountry('sea').envoy.memory.length,1);
  assert.equal(officialServing(envoy.p),true);var amount=E().treasury;diplomacyTick();assert.equal(E().treasury,amount);
  S.turn++;diplomacyTick();assert.equal(E().treasury,amount+6);assert.match(diplomacyPanel(),/通商中/);`);
});
test('a deceased envoy cannot complete a mission and a second mission is blocked',()=>{
 const b=start();b.run(`A.sendDiplomaticEnvoy('north','border',encodeURIComponent(envoy.key));var mission=diplomacyState().missions[0];
  var other=officialEntries().find(e=>officialServing(e.p)&&!e.p.away);var amount=E().treasury;
  A.sendDiplomaticEnvoy('north','visit',encodeURIComponent(other.key));assert.equal(E().treasury,amount);
  envoy.p.alive=false;S.turn=mission.due;diplomacyTick();assert.equal(mission.status,'interrupted');
  assert.equal(diplomacyCountry('north').relation,35);assert.match(diplomacyPanel(),/未能完成此行/);`);
});
test('opening the diplomacy panel does not mutate state',()=>{
 const b=start();b.run(`var snapshot=JSON.stringify(S);assert.match(diplomacyPanel(),/朔庭/);assert.equal(JSON.stringify(S),snapshot);`);
});
test('foreign envoys remember how they were received across saves and cannot be greeted twice per half year',()=>{
 let b=start();b.run(`var before=E().treasury;A.receiveForeignEnvoy('west','gift');
  assert.equal(E().treasury,before-20);assert.equal(diplomacyCountry('west').envoy.attitude,58);
  A.receiveForeignEnvoy('west','slight');assert.equal(diplomacyCountry('west').envoy.attitude,58);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var c=diplomacyCountry('west');assert.equal(c.envoy.memory[0].kind,'gift');
  S.turn+=6;A.receiveForeignEnvoy('west','slight');assert.equal(c.envoy.attitude,46);assert.equal(c.envoy.memory[1].kind,'slight');`);
});
test('treaty, tribute and a border negotiation have persistent effects',()=>{
 const b=start();b.force(.001,.001,.001);
 b.run(`A.sendDiplomaticEnvoy('north','treaty',encodeURIComponent(envoy.key));var m=diplomacyState().missions[0];
  S.turn=m.due;diplomacyTick();var country=diplomacyCountry('north');assert.equal(country.treatyUntil,S.turn+60);
  A.sendDiplomaticEnvoy('north','tribute',encodeURIComponent(envoy.key));m=diplomacyState().missions[1];S.turn=m.due;diplomacyTick();assert.equal(country.tribute,true);
  var amount=E().treasury;S.month=1;S.turn++;diplomacyTick();assert.equal(E().treasury,amount+60);
  country.tension=35;S.month=2;A.sendDiplomaticEnvoy('north','border',encodeURIComponent(envoy.key));m=diplomacyState().missions[2];S.turn=m.due;diplomacyTick();assert.equal(country.tension,15);`);
});
test('a foreign succession crisis records a choice and changes relations only once',()=>{
 let b=start();b.run(`A.receiveForeignEnvoy('west','gift');var country=diplomacyCountry('west');country.succession={status:'pending',winner:'elder'};
  var money=E().treasury,relation=country.relation;A.foreignSuccession('west','elder');assert.equal(E().treasury,money-40);
  assert.equal(country.relation,relation+8);A.foreignSuccession('west','elder');assert.equal(E().treasury,money-40);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var country=diplomacyCountry('west');assert.equal(country.succession.status,'resolved');
  assert.equal(country.succession.choice,'elder');assert.ok(country.envoy.memory.some(e=>e.kind==='succession'));`);
});
test('a foreign prince studies, remembers a visit, and returns after two years',()=>{
 let b=start();b.run(`A.receiveForeignEnvoy('west','gift');var country=diplomacyCountry('west');country.relation=65;
  A.inviteForeignStudent('west');assert.equal(country.student.status,'studying');A.visitForeignStudent('west');assert.equal(country.student.friendship,55);
  for(let i=0;i<12;i++){S.turn++;diplomacyTick();}assert.equal(country.student.months,12);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var country=diplomacyCountry('west');assert.equal(country.student.status,'studying');
  assert.equal(country.student.memory.length,1);for(let i=0;i<12;i++){S.turn++;diplomacyTick();}assert.equal(country.student.status,'returned');
  assert.ok(country.memory.some(e=>e.text.includes('完成两年求学')));`);
});
test('a prince travels abroad, returns with language knowledge and is unavailable in the palace meanwhile',()=>{
 let b=start();b.run(`var prince=makeKid(empress(),'m','承安');prince.born=S.turn-240;`);b.force(.001);b.run(`A.sendDiplomaticPrince('west',prince.id);assert.equal(royalJourneyAway(prince),true);assert.match(childWhereabouts(prince),/西昭/);
  var mission=diplomacyState().missions.find(m=>m.type==='prince');assert.equal(mission.outcome,'success');save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var mission=diplomacyState().missions.find(m=>m.type==='prince'),prince=kidById(mission.envoyId);
  assert.equal(royalJourneyAway(prince),true);S.turn=mission.due;diplomacyTick();assert.equal(royalJourneyAway(prince),false);
  assert.ok(prince.foreignLanguages.includes('西昭'));assert.ok(prince.story.some(s=>s.t.includes('学会当地语言')));`);
});
test('a detained prince remains abroad until ransomed once',()=>{
 let b=start();b.run(`var prince=makeKid(empress(),'m','承安');prince.born=S.turn-240;`);b.force(.999);b.run(`A.sendDiplomaticPrince('north',prince.id);var mission=diplomacyState().missions.find(m=>m.type==='prince');assert.equal(mission.outcome,'detained');
  S.turn=mission.due;diplomacyTick();assert.equal(royalDiplomaticAway(prince),true);assert.match(childWhereabouts(prince),/受留/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var mission=diplomacyState().missions.find(m=>m.type==='prince'),prince=kidById(mission.envoyId);
  var money=E().treasury;A.ransomDiplomaticPrince(mission.id);A.ransomDiplomaticPrince(mission.id);assert.equal(E().treasury,money-80);assert.equal(royalJourneyAway(prince),false);
  assert.equal(mission.status,'ransomed');`);
});
test('a prince abroad remains traceable after another heir succeeds',()=>{
 const b=start();b.ctx.assert=assert;
 b.run(`var prince=makeKid(empress(),'m','承安'),heir=makeKid(empress(),'m','承平');prince.born=heir.born=S.turn-240;`);b.force(.001);
 b.run(`A.sendDiplomaticPrince('west',prince.id);var mission=diplomacyState().missions.find(m=>m.type==='prince');
  succeed(heir);choose(0,'承平');drain();var retained=royalById(mission.envoyId);assert.ok(retained);assert.equal(royalDiplomaticAway(retained),true);
  S.turn=mission.due;diplomacyTick();assert.equal(retained.diplomaticJourney.status,'returned');assert.ok(retained.foreignLanguages.includes('西昭'));`);
});
test('a prince may marry a foreign partner after both agree, with the household preserved',()=>{
 let b=start();b.run(`var prince=makeKid(empress(),'m','承安');prince.born=S.turn-240;`);b.force(.001,.001);
 b.run(`A.sendDiplomaticPrince('west',prince.id);var mission=diplomacyState().missions.find(m=>m.type==='prince');
  S.turn=mission.due;diplomacyTick();assert.equal(mission.marriageOffer.status,'pending');var person=mission.marriageOffer.person;
  A.foreignMarriage(mission.id);assert.equal(curEv.title,'异国议婚');choose(0);drain();assert.equal(prince.married,true);
  assert.equal(prince.spouse.id,person.id);assert.ok(prince.household);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var prince=S.children.find(k=>k.name==='承安');assert.equal(prince.married,true);
  assert.match(prince.spouse.background,/西昭王室/);assert.ok(prince.household);`);
});
test('an unanswered foreign marriage proposal resumes safely after reload',()=>{
 let b=start();b.run(`var prince=makeKid(empress(),'m','承安');prince.born=S.turn-240;`);b.force(.001,.001);
 b.run(`A.sendDiplomaticPrince('west',prince.id);var mission=diplomacyState().missions.find(m=>m.type==='prince');S.turn=mission.due;diplomacyTick();
  A.foreignMarriage(mission.id);assert.equal(curEv.title,'异国议婚');save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'异国议婚');
  choose(1);drain();var mission=diplomacyState().missions.find(m=>m.type==='prince');assert.equal(mission.marriageOffer.status,'declined');`);
});
test('an envoy can return a false report, with a cost for trusting it and delayed verification',()=>{
 let b=start();b.force(.001,.999);b.run(`A.sendDiplomaticEnvoy('north','visit',encodeURIComponent(envoy.key));var mission=diplomacyState().missions[0];
  S.turn=mission.due;diplomacyTick();var report=diplomacyState().reports[0];assert.equal(report.truth,false);assert.equal(report.alarm,true);
  var amount=E().treasury;A.trustForeignReport(report.id);A.trustForeignReport(report.id);assert.equal(E().treasury,amount-20);
  A.verifyForeignReport(report.id);assert.equal(report.verifyDue,S.turn+2);assert.doesNotMatch(diplomacyPanel(),/复核结果/);save('auto');`);
 b=boot(3,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var report=diplomacyState().reports[0];S.turn=report.verifyDue;
  assert.match(diplomacyPanel(),/当时未发现异动/);`);
});
test('a foreign envoy remembers a reception and returns the favor or retaliates after three years',()=>{
 const b=start();b.run(`A.receiveForeignEnvoy('west','gift');var c=diplomacyCountry('west'),relation=c.relation,amount=E().treasury;
  S.turn+=36;diplomacyTick();assert.equal(c.relation,relation+5);assert.equal(E().treasury,amount+30);
  diplomacyTick();assert.equal(E().treasury,amount+30);assert.ok(c.memory.some(x=>x.text.includes('谢礼')));`);
});
