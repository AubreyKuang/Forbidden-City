const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function palace(storage,seed=32088){
  const game=boot(seed,storage);game.ctx.assert=assert;
  return game;
}

test('a chosen predecessor brings renown, teaching and an inherited trait to a fresh game and survives pending coronation replay',()=>{
  let game=palace();
  game.run(`A.start();drain();E().style='尚武';E().prestige=90;E().dynastyTrait='家学仁厚';A.save('1');`);
  game=palace(game.storage,32089);
  game.run(`A.newGame();
    assert.match(viewNew(),/前局传承/);
    const sources=dynastyLegacySources(),index=sources.findIndex(row=>row.slot==='1');
    const source=sources[index];assert.ok(source);
    $('#f-dynasty-legacies').value=JSON.stringify(sources);
    $('#f-dynasty-legacy').value=String(index);
    A.start();
    assert.equal(E().dynastyLegacy.predecessor,source.predecessor);
    assert.equal(E().dynastyLegacy.trait,'家学仁厚');
    assert.equal(E().prestige,62);assert.equal(E().wu,53);assert.equal(E().people,67);
    assert.equal(curEv.title,'登基');`);
  game=palace(game.storage,32090);
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'登基');
    drain();assert.equal(E().dynastyLegacy.renown,4);
    A.go('home');assert.match($('#panel').innerHTML,/前局传承.*家学仁厚/s);`);
});

test('the annals separate rulers with a reused era and read old and new entries in chronological order',()=>{
  const game=palace();
  game.run(`A.start();drain();
    const era=E().era;
    S.log.unshift({d:era+'元年正月',t:'旧档留存奏记。',b:1});
    log('首朝议事。',1);
    pushEv({title:'首朝阅折',text:'殿上议事',choices:[{t:'准奏',f:()=> '首朝批答。'}]});drain();
    const heir=makeKid(empress(),'m','承明');heir.born=S.turn-240;
    pushEv(deathEvent('驾崩'));choose(0);choose(0,era);drain();
    log('次朝议事。',1);A.go('regnal',1);
    const first=$('#panel').innerHTML;
    assert.match(first,/首朝阅折.*准奏.*首朝批答/s);assert.doesNotMatch(first,/次朝议事/);
    assert.ok(first.indexOf('旧档留存奏记')<first.indexOf('首朝议事'));
    A.go('regnal',2);assert.match($('#panel').innerHTML,/次朝议事/);
    assert.doesNotMatch($('#panel').innerHTML,/首朝批答/);
    assert.match($('#panel').innerHTML,/王朝图鉴/);`);
});

test('a named attendant can train under the palace steward, be suborned in play, and leave service after a verified case',()=>{
  let game=palace();
  game.run(`A.start();drain();E().energy=20;A.establishJinyiwei();choose(0);drain();
    const maid=makeGirl({age:23});maid.maid=true;maid.near=true;maid.palace='乾清宫';maid.aff=48;S.consorts.push(maid);
    A.go('jinyiwei');assert.match($('#panel').innerHTML,/培养.+为心腹/);
    A.recruitIntelligenceAgent('maid',maid.id);assert.equal(intelligenceAgent('maid').name,fullName(maid));
    A.trainIntelligenceAgent('maid');assert.ok(maid.story.some(row=>row.t.includes('核对值簿')));
    const patron=officialEntries().find(e=>S.consorts.includes(e.c)&&officialServing(e.p));
    patron.c.fam={...patron.c.fam,p:90};patron.p.trust=90;
    S.turn+=12;`);
  game.force(.05,.01);
  game.run(`intelligenceCounterTick();
    const agent=intelligenceAgent('maid');assert.equal(agent.infiltration.kind,'bribe');
    A.investigateIntelligenceAgent('maid');S.turn+=2;
    A.reviewCounterIntelligence('maid');assert.match(curEv.text,/借私封送银/);`);
  game=palace(game.storage,32091);
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'宫廷情报 · 密查复奏');
    const id=intelligenceAgent('maid').personId;
    choose(0);drain();assert.equal(intelligenceAgent('maid'),undefined);assert.ok(byId(id).maid);
    E().energy=10;A.recruitIntelligenceAgent('eunuch');
    const steward=intelligenceAgent('eunuch');steward.ability=65;steward.loyalty=70;
    A.appointIntelligenceSteward();assert.ok(steward.steward);
    assert.match(intelligencePanel(),/宫中总管/);`);
});

test('an implanted recruit has a named sponsor and is only exposed after due verification',()=>{
  const game=palace();
  game.run(`A.start();drain();E().energy=20;A.establishJinyiwei();choose(0);drain();
    const sponsor=officialEntries().find(e=>S.consorts.includes(e.c)&&officialServing(e.p));
    sponsor.c.fam={...sponsor.c.fam,p:100};sponsor.p.trust=100;`);
  game.force(.1,.1,.1,.1,.1,.01);
  game.run(`A.recruitIntelligenceAgent('eunuch');
    const agent=intelligenceAgent('eunuch');assert.equal(agent.infiltration.kind,'plant');
    assert.equal(agent.infiltration.name,sponsor.p.name);
    A.investigateIntelligenceAgent('eunuch');assert.equal(counterIntelligenceEvent('eunuch'),null);
    S.turn+=2;A.reviewCounterIntelligence('eunuch');assert.match(curEv.text,/安插进来的人/);
    choose(1);drain();assert.equal(counterIntelligenceEvent('eunuch'),null);
    assert.ok(agent.compromised&&agent.review.read);`);
});

test('education produces an autonomous career and an adult prince can build connections and petition for a real fief',()=>{
  let game=palace();
  game.run(`A.start();drain();S.turn=240;E().energy=10;
    const son=makeKid(empress(),'m','承钧'),peer=makeKid(empress(),'m','承澄');
    son.born=S.turn-15*12;peer.born=S.turn-16*12;son.temperament='好胜';
    son.mar=74;son.lit=48;son.vir=50;son.policy='习武';growKid(son);
    assert.equal(son.princeEducation.military,1);
    const officer=officialEntries().find(e=>officialServing(e.p));officer.h.bloc='army';
    S.turn+=12;princeCareerTick(son);
    assert.equal(son.princeCareer.path,'military');assert.ok(son.princeCareer.selfChosen);
    assert.ok(son.princeCircle.friends.some(row=>row.id===peer.id));
    assert.ok(son.princeCircle.officials.some(row=>row.id===officer.p.id));
    openPrinceEstate(son);A.princeCareer(son.id,'clan');S.turn+=24;princeFiefRequestTick();
    A.go('kid',son.id);assert.match($('#panel').innerHTML,/批阅请藩表/);
    A.princeReviewFiefRequest(son.id);choose(2);drain();`);
  game=palace(game.storage,32092);
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    const son=S.children.find(p=>p.name==='承钧'),place=son.fiefRequest.place;
    assert.equal(son.fiefRequest.status,'pending');assert.equal(pendingPrinceFiefRequest(),null);
    A.princeReviewFiefRequest(son.id);choose(0);drain();
    assert.equal(son.fiefRequest.status,'accepted');assert.equal(son.away,true);
    assert.equal(princeFief(son),place);assert.equal(princeFiefRequestEvent(son),null);`);
});

test('an envoy prince earns a persistent country trait and a returning student remembers both kinds of reception',()=>{
  let game=palace();
  game.run(`A.start();drain();E().energy=20;
    const son=makeKid(empress(),'m','承允');son.born=S.turn-240;`);
  game.force(.02,.98);
  game.run(`A.sendDiplomaticPrince('west',S.children[0].id);
    S.turn+=6;diplomacyTick();
    assert.deepEqual(Array.from(son.diplomaticTraits),['west']);
    A.go('kid',son.id);assert.match($('#panel').innerHTML,/谙习异邦礼制/);
    diplomacyCountry('north',true).relation=65;diplomacyCountry('sea',true).relation=65;
    A.inviteForeignStudent('north');A.inviteForeignStudent('sea');
    A.visitForeignStudent('north');A.visitForeignStudent('sea','cold');S.turn+=6;A.visitForeignStudent('north');
    for(const id of ['north','sea'])diplomacyCountry(id).student.months=23;
    S.turn++;diplomacyTick();S.turn+=35;diplomacyTick();
    assert.ok(!pendingForeignStudentReturn());
    S.turn++;const money=E().treasury;diplomacyTick();diplomacyTick();
    assert.equal(E().treasury,money+45);assert.equal(diplomacyCountry('sea').tension,15);
    assert.equal(diplomacyCountry('north').student.homecoming.outcome,'gratitude');
    assert.equal(diplomacyCountry('sea').student.homecoming.outcome,'reprisal');
    A.reviewForeignStudentReturn('sea');choose(0);drain();`);
  game=palace(game.storage,32093);
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(S.children[0].diplomaticTraits[0],'west');
    assert.equal(diplomacyCountry('sea').student.homecoming.read,true);
    assert.match(pendingForeignStudentReturn().text,/谢礼/);`);
});
