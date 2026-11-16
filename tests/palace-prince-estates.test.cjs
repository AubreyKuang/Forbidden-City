const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function princeWorld(){
  const game=world();game.ctx.assert=assert;
  game.run(`var prince=makeKid(a,'m','承安');prince.born=S.turn-19*12;prince.pendingName=false;prince.title='睿亲王';prince.sup=61;prince.adult=true;`);
  return game;
}

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
  let game=princeWorld();game.run(`var id=prince.id;prince.away=true;prince.princeEstate={location:'西安',opened:0};
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
