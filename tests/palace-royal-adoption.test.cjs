const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function familyWorld(){
  const game=world();game.ctx.assert=assert;
  game.run(`var make=(name)=>{var k=makeKid(a,'m',name);k.born=S.turn-40*12;k.pendingName=false;k.adult=true;openPrinceEstate(k);k.married=true;k.spouse={...marriageCandidate(k,'scholar'),marriedAt:0};ensureMarriedLife(k);return k;};
    var birth=make('承宁'),adoptive=make('承安'),son={id:'grand-royal-adoption',name:'沈景修',given:'景修',sex:'m',born:S.turn-7*12,alive:true,hp:90,seed:31,mother:birth.spouse.id,motherName:birth.spouse.name,father:birth.id,lit:40,mar:31,vir:44,amb:35,story:[]};
    birth.household.children.push(son);`);
  return game;
}

test('same city visits and next-month letters record distinct voice in both families',()=>{
  let game=familyWorld();game.run(`A.princeReviewAdoption(adoptive.id);choose(0);drain();
    birth.amb=80;birth.spouse.marriageNature.temperament='沉静';adoptive.amb=30;adoptive.spouse.marriageNature.temperament='敏感';
    A.princeAdoptionContact(adoptive.id,son.id);assert.equal(curEv.title,'嗣子回生家探望');choose(0);drain();
    assert.match(birth.story.at(-1).t,/守住新府的分寸/);assert.match(birth.spouse.story.at(-1).t,/那方砚/);
    assert.match(adoptive.story.at(-1).t,/慢慢说完/);assert.match(adoptive.spouse.story.at(-1).t,/怕孩子心里两难/);
    A.princeAdoptionContact(adoptive.id,son.id);assert.equal(modalOpen,false);S.turn+=4;
    adoptive.away=true;adoptive.princeEstate.location='西安';A.princeAdoptionContact(adoptive.id,son.id);
    assert.equal(curEv.title,'嗣子 · 寄生家书');choose(1);drain();assert.equal(son.princeAdoption.contact.pending.due,S.turn+1);save('auto');`);
  game=boot(92,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');var a=S.children.find(k=>k.name==='承安'),b=S.children.find(k=>k.name==='承宁'),son=b.household.children[0];
    S.turn++;princeAdoptionContactTick();princeAdoptionContactTick();
    assert.equal(son.story.filter(x=>x.t.startsWith('【生家回信】')).length,1);assert.ok(a.spouse.story.at(-1).t.includes('收到生家回信'));
    A.princeAdoptionReply(a.id,son.id);assert.equal(curEv.title,'嗣子 · 生家回信');choose(0);drain();assert.equal(son.princeAdoption.contact.reply.unread,false);`);
});

test('palace adoption preserves the ward and records the biological ties without auto-appointing an heir',()=>{
  const game=familyWorld();game.run(`var realDad=birth,realMom=birth.spouse,queen=empress(),oldId=son.id;
    birth.household.children.push({...son,id:'grand-'+S.gen+'-'+birth.id+'-2',sex:'f',name:'清嘉',given:'清嘉'});
    princePersonNote(son,'在府中读的第一本书。');S.royalRelatives=[birth,adoptive];S.children=[];S.heir=null;
    A.palaceWard();assert.equal(curEv.title,'宗人府 · 议请入继');choose(0);drain();
    assert.equal(S.children[0],son);assert.equal(birth.household.children.length,1);assert.equal(typeof son.id,'number');assert.equal(son.palaceAdoption.originalId,oldId);
    assert.equal(son.palaceAdoption.father,realDad.id);assert.equal(son.palaceAdoption.motherId,realMom.id);assert.equal(son.foster,queen.id);
    assert.ok(son.story.some(x=>x.t==='在府中读的第一本书。'));assert.ok(realMom.story.some(x=>x.t.includes('宗亲入继')));
    assert.equal(S.heir,null);assert.equal(palaceNeedsSon(),false);assert.match(viewKid(),/宗亲出身/);
    var pregnancy={mother:realMom.id,partner:realMom.id,father:birth.id,due:S.turn};birth.household.pregnancies.push(pregnancy);
    assert.match(deliverHouseholdChild(birth,pregnancy).id,/-3$/);A.endMonth();drain();`);
});

test('a real orphan notice survives deferring even when the palace already has sons',()=>{
  const game=familyWorld();game.run(`S.gen=3;birth.alive=false;birth.spouse.alive=false;son.sex='f';
    S.jinyiwei={commander:{id:'ward-commander',name:'程秉直',alive:true,career:'official',official:3,story:[]}};`);game.force(0,0);
  game.run(`var ev=palaceOrphanEvent();assert.equal(ev.title,'宗人府 · 宗亲遗孤');assert.match(ev.text,/无人能接手/);pushEv(ev);
    assert.match($('#mbox').innerHTML,/锦衣卫指挥使程秉直附报/);choose(1);drain();
    assert.ok(palaceWardPending());assert.equal(palaceNeedsSon(),false);assert.equal(palaceOrphanEvent(),null);
    A.palaceWard(true);choose(0);drain();assert.equal(son.palaceAdoption.orphan,true);assert.equal(S.flags.palaceWard,undefined);assert.ok(S.children.includes(son));`);
});
