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
