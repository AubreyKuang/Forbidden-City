const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

test('a later son prompts family memories and an age-gated petition, followed by ordinary confirmation',()=>{
  const b=world();b.ctx.assert=assert;
  b.run(`var q=empress(),dad=makeKid(a,'m','承宁');dad.born=S.turn-42*12;dad.pendingName=false;
    dad.married=true;dad.spouse={...marriageCandidate(dad,'scholar'),marriedAt:0};ensureMarriedLife(dad);
    var first=makeKid(a,'m','景修');first.born=S.turn-9*12;first.mom=null;first.foster=q.id;first.pendingName=false;
    first.palaceAdoption={father:dad.id,motherId:dad.spouse.id,at:S.turn-3};
    A.kidHeir(first.id);choose(0);nextEv();assert.equal(curEv.title,'东宫新册 · 宗亲入继');drain();
    assert.ok(dad.spouse.story.some(x=>x.t.includes('入继皇子立储')));
    var infant=makeKid(q,'m','景安');infant.pendingName=true;
    q.delivery={children:[infant.id],settled:false,date:dateStr()};pushEv(birthNamingEvent(q));choose(0,'景安');nextEv();
    assert.equal(curEv.title,'新皇子降生 · 两房牵挂');drain();
    assert.match(infant.story.find(x=>x.t.includes('两房牵挂')).t,/随乳母起居/);
    assert.ok(q.story.some(x=>x.t.includes('两边都养在心上')));assert.ok(dad.story.some(x=>x.t.includes('两房牵挂')));
    assert.equal(S.heir,first.id);S.turn+=4;`);
  b.force(0);
  b.run(`imperialHeirStories({...S,turn:S.turn-1});assert.equal(curEv.title,'储位再议 · 东宫与新皇子');
    assert.match(curEv.choices[1].t,/五岁/);choose(1);drain();assert.equal(S.heir,first.id);
    S.turn+=60;imperialHeirStories({...S,turn:S.turn-1});assert.equal(curEv.title,'储位再议 · 东宫与新皇子');
    choose(1);nextEv();assert.equal(curEv.title,'册立太子');assert.equal(S.heir,first.id);
    choose(0);drain();assert.equal(S.heir,infant.id);
    for(const p of [first,infant,q,dad,dad.spouse])assert.ok(p.story.some(x=>x.t.includes('改立后续')));
    assert.equal(S.log.filter(x=>x.t.includes('【改立后续】')).length,1);`);
});

test('an emperor with zero conception chance can be diagnosed after twelve eligible months and use the clan register',()=>{
  let b=world();b.ctx.assert=assert;
  b.run(`for(var n=1;n<10000;n++){E().seed=n;if(imperialFertilityProfile()==='none')break;}
    assert.equal(imperialFertilityMultiplier(),0);a.hp=95;a.lastBirth=-100;a.preg=0;E().health=95;
    for(var i=0;i<12;i++){E().energy=8;nightWith(a);drain();assert.equal(a.preg,0);if(i<11){assert.equal(imperialFertilityEvent(),null);S.turn++;}}
    var review=imperialFertilityEvent();assert.equal(review.title,'太医院合议 · 一年未有孕讯');assert.match(review.text,/无法使人有孕/);
    S.jinyiwei={commander:{id:'doctor-clue',name:'程秉直',alive:true,career:'official',official:3,story:[]},established:S.turn};
    A.imperialFertilityKin();assert.equal(curEv.title,'锦衣卫 · 宗亲名册');choose(0);drain();assert.equal(availableRoyalWards().length,1);
    A.palaceWard();choose(0);drain();assert.ok(S.children[0].palaceAdoption);assert.equal(S.heir,null);
    var funds=E().treasury;A.seekImperialPhysician();choose(0);drain();assert.equal(E().treasury,funds-15);save('auto');`);
  b=boot(902,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(imperialFertilityMultiplier(),0);S.turn+=2;`);
  b.force(.005);b.run(`assert.match(imperialFertilityEvent().text,/转机/);assert.equal(imperialFertilityMultiplier(),.14);
    assert.equal(imperialFertilityEvent(),null);assert.ok(E().fertilityReview.searched);`);
});

test('missing a month or establishing a pregnancy ends the continuous attempt count',()=>{
  const b=world();b.ctx.assert=assert;b.run(`E().fertilityReview={profile:'low',months:11,last:S.turn-2};
    noteImperialFertilityAttempt(.2,false);assert.equal(E().fertilityReview.months,1);
    noteImperialFertilityAttempt(.2,false);assert.equal(E().fertilityReview.months,1);
    noteImperialFertilityAttempt(.2,true);assert.equal(E().fertilityReview.months,0);assert.equal(imperialFertilityEvent(),null);`);
});
