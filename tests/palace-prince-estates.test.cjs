const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function princeWorld(age=19){
  const game=world();game.ctx.assert=assert;
  game.run(`var prince=makeKid(a,'m','承安');prince.born=S.turn-${age}*12;prince.pendingName=false;prince.title='睿亲王';prince.sup=61;prince.adult=true;`);
  return game;
}

test('early low-trust couples have an awkward visit and separate chronicles, while a close couple does not',()=>{
 const game=princeWorld(23);
 game.run(`openPrinceEstate(prince);prince.married=true;
   prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn,trust:36};
   var p=prince.spouse,h=ensureMarriedLife(prince);recordHouseholdNews(prince);
   assert.equal(h.pending.id,'newlywed');assert.match(p.story.at(-1).t,/新婚初识.*茶送到两处/);
   A.householdVisit(prince.id);assert.equal(curEv.title,'新婚 · 话到嘴边');choose(0);drain();
   assert.equal(p.trust,40);assert.match(p.story.at(-1).t,/同桌用饭/);
   assert.ok(prince.story.some(x=>x.t.includes('新婚 · 话到嘴边')));
   assert.equal(makeHouseholdScene(prince),null);
   var princess=makeKid(a,'f','昭仪');princess.born=S.turn-21*12;princess.pendingName=false;
   princess.married=true;princess.spouse={...marriageCandidate(princess,'scholar'),marriedAt:S.turn,trust:78};
   ensureMarriedLife(princess);assert.equal(makeHouseholdScene(princess),null);
   princess.spouse.trust=34;recordHouseholdNews(princess);assert.equal(princess.household.pending.id,'newlywed');
   assert.match(householdSceneEvent(princess).text,/昭仪.*对方/);`);
});

test('the Wang residence and the collapsible family roster open the same child portrait and profile',()=>{
 const game=princeWorld(30);
 game.run(`openPrinceEstate(prince);prince.married=true;
  prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-72,trust:70};
  var h=ensureMarriedLife(prince),id='grand-'+prince.id;
  h.children.push({id,name:'景行',sex:'m',born:S.turn-24,alive:true,seed:21,portraitVariant:3,
    motherName:prince.spouse.name,fatherName:prince.name,father:prince.id,mother:prince.spouse.id,lit:41,mar:26,vir:38,hp:91,story:[{d:dateStr(),t:'初学识字。'}]});
  A.go('prince-estate',prince.id);assert.match(viewPrinceEstate(),/household-child/);assert.match(viewPrinceEstate(),/景行/);
  A.go('household-child',id);assert.match(viewHouseholdChild(),/景行/);assert.match(viewHouseholdChild(),/class="por /);
  assert.match(viewHouseholdChild(),/生父.*承安/);assert.match(viewHouseholdChild(),/体魄/);assert.match(viewHouseholdChild(),/初学识字/);
  assert.equal(chroniclePersonTarget(id).person,h.children[0]);assert.match(viewHouseholdChild(),/返回王府/);
  A.backPerson('family');assert.equal(UI.view,'prince-estate');
  assert.match(viewFamily(),/<details class="family-branch"><summary><strong>皇子公主的子女/);
  UI.familyMode='list';assert.match(viewFamily(),/皇子公主的子女/);`);
});

test('a Wang consort can refuse a private visit or agree once without telling the prince',()=>{
 let game=princeWorld(25);
 game.run(`E().age=45;openPrinceEstate(prince);prince.married=true;
  prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-12,trust:31,willing:false};
  ensureMarriedLife(prince);var p=prince.spouse;
  A.princeSpouseVisit(prince.id);assert.equal(curEv.title,'王府 · 私下求见');
  assert.equal(curEv.choices.length,1);choose(0);drain();assert.equal(p.princePrivateVisit.meetings,0);
  A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
  S.turn++;p.willing=true;p.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>mulberry32(voiceHash('prince-spouse-visit:'+seed+':'+(E().seed||S.gen)))()<.62);
  PalaceActions.reset();A.princeSpouseVisit(prince.id);assert.equal(curEv.choices.length,2);save('1');`);
 game=boot(83,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,energy=E().energy;
  choose(0);assert.equal(E().energy,energy-1);drain();assert.equal(p.princePrivateVisit.meetings,1);
  assert.match(p.story.at(-1).t,/亲口应允/);assert.doesNotMatch(prince.story.map(x=>x.t).join(''),/王府私会/);
  assert.ok(!(S.reignAnnals||[]).some(e=>e.title==='王府 · 私下求见'));
  S.turn++;prince.away=true;A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
  prince.away=false;p.born=S.turn-17*12;A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);`);
});

test('a prince moves from a capital residence to a named fief and later returns',()=>{
  const game=princeWorld();game.run(`openPrinceEstate(prince);var id=prince.id;A.go('prince-estate',id);
    assert.match(viewPrinceEstate(),/睿亲王府/);assert.match(viewPrinceEstate(),/到王府探望/);
    A.princeEstateMove(id);choose(0);drain();assert.equal(prince.away,true);assert.equal(prince.sup,41);
    assert.equal(childWhereabouts(prince),'西安');assert.match(viewOut(),/外地藩邸/);assert.doesNotMatch(viewPrinceEstate(),/到王府探望/);
    assert.ok(a.story.some(x=>x.t.includes('赴西安就藩')));assert.ok(S.log.some(x=>x.t.includes('赴西安就藩')));
    A.princeEstateMove(id);assert.equal(modalOpen,false);S.turn+=6;
    A.princeEstateMove(id);choose(0);drain();assert.equal(prince.away,false);assert.equal(prince.princeEstate.location,'京城');
    assert.equal(prince.sup,41);assert.match(viewPrinceEstate(),/到王府探望/);`);
});

test('a legacy fief can be registered and mailed without reapplying the cost of moving',()=>{
  let game=princeWorld();game.run(`prince.away=true;save('auto');`);
  game=boot(824,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');var prince=S.children.find(k=>k.name==='承安'),id=prince.id;A.go('prince-estate',id);
    assert.match(viewPrinceEstate(),/藩地未载/);A.princeRegisterFief(id);choose(1);drain();assert.equal(prince.sup,61);
    assert.equal(princeEstatePlace(prince),'太原');var energy=E().energy;
    A.royalKinContact(id,true);assert.equal(curEv.title,'王府家书');choose(0);drain();assert.equal(E().energy,energy-1);
    assert.equal(prince.royalKinContact.pending.due,S.turn+1);A.princeEstateMove(id);assert.equal(modalOpen,false);
    S.turn++;royalKinContactTick();A.royalKinReply(id,true);assert.equal(curEv.title,'王府回信');save('auto');`);
  game=boot(825,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安');
    assert.equal(curEv.title,'王府回信');choose(0);drain();assert.equal(prince.royalKinContact.reply.unread,false);
    assert.equal(prince.story.filter(x=>x.t.includes('【王府回信】')).length,1);`);
});

test('a prior-reign prince retains the same residence and can be visited there',()=>{
  const game=princeWorld();game.run(`openPrinceEstate(prince);S.children=[];prince.reign=S.gen;prince.kinship='皇弟';S.royalRelatives=[prince];S.gen++;
    assert.equal(princeEstateById(prince.id),prince);A.royalKinContact(prince.id,true);assert.equal(curEv.title,'王府 · 到府探望');
    choose(1);drain();assert.ok(prince.story.some(x=>x.t.includes('到王府看望皇弟承安')));`);
});

test('quarterly reports summarize the fiefs and only include weddings registered recently',()=>{
  const game=princeWorld();game.run(`S.month=3;prince.away=true;
    var other=makeKid(a,'m','承宁');other.born=prince.born;other.pendingName=false;other.away=true;other.adult=true;
    var local=makeKid(a,'m','承宣');local.born=prince.born;local.pendingName=false;local.adult=true;openPrinceEstate(local);
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn};ensureMarriedLife(prince);
    assert.equal(princeQuarterReports(),null);A.endMonth();
    var summary=[curEv,...Q].filter(e=>e?.title==='王府长史 · 季度奏报');assert.equal(summary.length,1);
    assert.match(summary[0].text,/睿亲王府.*禄米、王府修缮、婚礼用度/);
    assert.match(summary[0].text,/承宁王府.*禄米、王府修缮/);assert.doesNotMatch(summary[0].text,/承宣/);
    assert.equal(princeDocketPending(prince).length,3);assert.equal(princeDocketPending(other).length,2);
    assert.equal(princeQuarterReports(),null);drain();`);
});

test('deferred quarterly items survive reload and funding cannot spend twice or overdraw',()=>{
  let game=princeWorld();game.run(`S.month=4;prince.away=true;princeQuarterReports();var id=prince.id;
    A.princeDocket(id,'grain');choose(2);drain();assert.equal(princeDocketPending(prince).length,2);
    E().treasury=5;A.princeDocket(id,'grain');assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[1].cond(),false);choose(2);drain();
    E().treasury=50;A.princeDocket(id,'repair');save('auto');`);
  game=boot(481,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安'),id=prince.id;
    assert.equal(curEv.title,'长史奏报 · 王府修缮');var fund=curEv.choices[0].f;
    choose(0);assert.equal(fund(),null);drain();assert.equal(E().treasury,30);
    assert.ok(prince.story.some(x=>x.t.includes('国库拨银20万两')));assert.equal(S.log.filter(x=>x.t.includes('国库拨银20万两')).length,1);
    S.turn+=3;S.month=7;assert.equal(princeQuarterReports(),null);assert.equal(princeDocketPending(prince).length,1);
    A.princeDocket(id,'grain');choose(1);drain();assert.equal(E().treasury,24);
    S.turn+=3;S.month=10;assert.ok(princeQuarterReports());assert.equal(princeDocketPending(prince)[0].kind,'grain');
  `);
});

test('the original household son succeeds after a death report and keeps the fief and docket on reload',()=>{
  let game=princeWorld(40);game.run(`var id=prince.id;prince.away=true;prince.princeEstate={location:'西安',opened:0};
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};var h=ensureMarriedLife(prince);
    var son={id:'grand-1-'+id+'-1',name:'承礼',sex:'m',born:S.turn-7*12,alive:true,seed:17,mother:prince.spouse.id,father:id,story:[]};h.children.push(son);
    assert.match(princeSuccessionTick().text,/请陛下核定世子/);assert.equal(princeSuccessionTick(),null);
    A.princeReviewSuccession(id);choose(0);drain();assert.equal(princeHeir(prince),son);
    assert.ok(prince.spouse.story.some(x=>x.t.includes('册封世子')));S.month=4;princeQuarterReports();
    prince.born=S.turn-95*12;assert.match(princeSuccessionTick().text,/承礼奉表请袭/);assert.equal(prince.alive,false);
    A.go('prince-estate',id);A.princeReviewSuccession(id);assert.equal(curEv.title,'长史奏报 · 请袭王爵');choose(0);drain();
    assert.equal(royalById(son.id),h.children[0]);assert.equal(princeEstatePlace(son),'西安');assert.equal(son.title,'睿亲王');
    assert.equal(princeDocketPending(son).length,2);assert.equal(princeDocketPending(prince).length,0);
    assert.match(viewPrinceEstate(),/读先王的记事/);assert.match(viewOut(),/grand-1-/);assert.equal(princeSuccessionTick(),null);
    assert.ok(prince.story.some(x=>x.t.includes('袭爵')));assert.ok(S.log.some(x=>x.t.includes('府中庶务由长史暂理')));save('auto');`);
  game=boot(81,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');var p=S.children.find(x=>x.name==='承安'),son=p.household.children[0];
    assert.equal(royalById(son.id),son);assert.equal(son.away,true);assert.equal(royalHouseholds().filter(x=>x.id===son.id).length,1);
    assert.equal(S.children.includes(son),false);assert.ok(son.story.some(x=>x.t.includes('袭爵')));`);
});

test('a predeceased heir is reported once and the throne can designate another son',()=>{
  const game=princeWorld(40);game.run(`openPrinceEstate(prince);prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
    var first={id:'first-son',name:'景和',sex:'m',born:S.turn-10*12,alive:true,hp:0,seed:17,mother:prince.spouse.id,father:prince.id};
    var second={...first,id:'second-son',name:'景宁',born:S.turn-8*12,hp:90};ensureMarriedLife(prince).children.push(first,second);
    prince.princeEstate.succession={heir:first.id,nominated:first.id};var report=princeSuccessionTick();
    assert.match(report.text,/景和先于王爷离世，请旨重新册立世子/);
    assert.equal(first.alive,false);assert.equal(princeSuccessionTick(),null);assert.equal(princeHeir(prince),undefined);
    A.princeReviewSuccession(prince.id);assert.equal(curEv.title,'长史奏报 · 另立世子');choose(0);drain();
    assert.equal(princeHeir(prince),second);assert.ok(prince.story.some(x=>x.t.includes('另立世子')));
    assert.ok(prince.spouse.story.some(x=>x.t.includes('世子讣报')));assert.equal(S.log.filter(x=>x.t.includes('世子讣报')).length,1);`);
});

test('adoption retains the original child and parents through inheritance and a cold reload',()=>{
  let game=princeWorld(40);game.run(`prince.away=true;prince.princeEstate={location:'太原',opened:0};
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};ensureMarriedLife(prince);
    var brother=makeKid(a,'m','承宁');brother.pendingName=false;brother.born=prince.born;openPrinceEstate(brother);
    brother.married=true;brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};var h=ensureMarriedLife(brother);
    var nephew={id:'grand-adoption',name:'景修',sex:'m',born:S.turn-6*12,alive:true,hp:90,seed:31,mother:brother.spouse.id,father:brother.id};h.children.push(nephew);
    assert.match(princeSuccessionTick().text,/议请过继/);A.princeReviewAdoption(prince.id);choose(0);drain();
    assert.equal(princeHeir(prince),nephew);assert.equal(princeSons(brother).length,0);assert.equal(princeSons(prince).length,1);
    for(const p of [nephew,brother,brother.spouse,prince,prince.spouse])assert.ok(p.story.some(x=>x.t.includes('王府过继')));
    assert.equal(S.log.filter(x=>x.t.includes('【王府过继】')).length,1);assert.equal(nephew.father,brother.id);save('auto');`);
  game=boot(82,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');var p=S.children.find(k=>k.name==='承安'),b=S.children.find(k=>k.name==='承宁'),son=b.household.children[0];
    assert.equal(princeHeir(p),son);p.alive=false;princeSuccessionTick();A.princeReviewSuccession(p.id);choose(0);drain();
    assert.equal(royalById(son.id),son);assert.equal(princeEstatePlace(son),'太原');assert.ok(b.spouse.story.some(x=>x.t.includes('亲生儿子')||x.t.includes('惦记孩子在嗣府')));
    S.children=S.children.filter(k=>k!==b);inheritHousehold(b,harem()[0]);assert.equal(royalById(son.id),son);assert.equal(S.children.some(k=>k.name===son.name),false);
    assert.equal(princeBiologicalParents(son).mother.id,b.spouse.id);`);
});

test('a sonless deceased prince can receive a posthumous heir from a brother',()=>{
  const game=princeWorld();game.run(`prince.away=true;prince.princeEstate={location:'开封',opened:0};prince.alive=false;
    var brother=makeKid(a,'m','承宁');brother.pendingName=false;brother.born=prince.born;
    brother.married=true;brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};
    var son={id:'grand-posthumous',name:'景修',sex:'m',born:S.turn-6*12,alive:true,seed:17,mother:brother.spouse.id,father:brother.id};
    ensureMarriedLife(brother).children.push(son);assert.match(princeSuccessionTick().text,/请择嗣承袭/);
    A.princeReviewAdoption(prince.id);assert.match(curEv.choices[0].t,/过继并承袭/);choose(0);drain();
    assert.equal(princeEstatePlace(son),'开封');assert.equal(princeProbate(prince),false);assert.equal(S.log.filter(x=>x.t.includes('【袭爵】')).length,1);`);
});

test('a living prince petitions on his fortieth birthday, including an unanswered nomination from an older save',()=>{
 const game=princeWorld(39);game.run(`prince.born=S.turn-40*12+1;openPrinceEstate(prince);
 prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 var son={id:'forty-son',name:'景宁',sex:'m',born:S.turn-9*12,alive:true,mother:prince.spouse.id,father:prince.id};
 ensureMarriedLife(prince).children.push(son);prince.princeEstate.succession={nominated:son.id};
 assert.match(princeSuccessionPanel(prince),/年满四十/);assert.doesNotMatch(princeSuccessionPanel(prince),/批阅请封世子/);
 A.princeReviewSuccession(prince.id);assert.equal(modalOpen,false);var notes=S.log.length;
 assert.equal(princeSuccessionTick(),null);assert.equal(S.log.length,notes);
 prince.princeEstate.succession.nominated=son.id;S.turn++;
 assert.match(princeSuccessionTick().text,/请封世子/);assert.equal(princeSuccessionTick(),null);assert.match(princeSuccessionPanel(prince),/批阅请封世子/);
 A.princeReviewSuccession(prince.id);choose(0);drain();assert.equal(princeHeir(prince),son);`);
});

test('an old review opened before forty replays and is then withdrawn without appointing an heir',()=>{
 const game=princeWorld(40);game.run(`openPrinceEstate(prince);prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 ensureMarriedLife(prince).children.push({id:'prior-son',name:'景明',sex:'m',alive:true,born:S.turn-9*12,mother:prince.spouse.id,father:prince.id});
 PalaceActions.reset();A.princeReviewSuccession(prince.id);save('1');`);
 const key='chengongji_v1_1',data=JSON.parse(game.storage.get(key)),journal=data.pendingActions;
 journal.version=129;for(const snapshot of [data,journal.base])snapshot.children.find(c=>c.name==='承安').born+=12;
 game.storage.set(key,JSON.stringify(data));const resumed=boot(12,game.storage);resumed.ctx.assert=assert;resumed.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
 assert.equal(modalOpen,false);assert.equal(princeHeir(S.children.find(c=>c.name==='承安')),undefined);`);
});

test('a younger prince keeps a previously confirmed heir and must wait until forty to replace him by adoption',()=>{
 const game=princeWorld(39);game.run(`prince.born=S.turn-40*12+1;openPrinceEstate(prince);prince.married=true;
 prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 var first={id:'earlier-heir',name:'景和',sex:'m',alive:true,born:S.turn-9*12,hp:90,mother:prince.spouse.id,father:prince.id};
 ensureMarriedLife(prince).children.push(first);prince.princeEstate.succession={heir:first.id};
 assert.equal(princeSuccessionTick(),null);assert.equal(princeHeir(prince),first);
 var brother=makeKid(a,'m','承宁');brother.born=S.turn-32*12;brother.pendingName=false;openPrinceEstate(brother);brother.married=true;
 brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};var nephew={...first,id:'nephew',name:'景明',father:brother.id,mother:brother.spouse.id};
 ensureMarriedLife(brother).children.push(nephew);first.hp=0;
 assert.match(princeSuccessionTick().text,/待王爷年满四十/);assert.doesNotMatch(princeSuccessionPanel(prince),/批阅过继/);
 A.princeReviewAdoption(prince.id);assert.equal(modalOpen,false);S.turn++;
 assert.match(princeSuccessionTick().text,/议请过继/);assert.equal(princeSuccessionTick(),null);
 A.princeReviewAdoption(prince.id);choose(0);drain();assert.equal(princeHeir(prince),nephew);`);
});
