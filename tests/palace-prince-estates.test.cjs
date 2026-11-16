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
