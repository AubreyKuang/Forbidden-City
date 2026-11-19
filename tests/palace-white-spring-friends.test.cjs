const test=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./child-consequences-world.cjs');
const {boot}=require('./playtest-harness.cjs');
function setup(){
 const w=world();w.ctx.assert=assert;
 w.run(`var merchant=makeGirl({fam:{t:'皇商',p:30},trait:'好学',age:20});
 var admirationSeed=(bucket)=>Array.from({length:2000},(_,i)=>i).find(i=>voiceHash(i+':white-spring-admirer')%100===bucket);
 merchant.seed=admirationSeed(79);
 merchant.solitary={path:'letters',stage:0,history:[]};
 var ay=storyCastCreate('ayimu').person,princess=ay;var admit=p=>p===ay?storyCastAdmit(p,storyCastRecord('ayimu'),'准白泉公主留宫'):addConsort(p,2,'受册入宫');
 var entries=(p,title)=>p.story.filter(e=>e.t.startsWith('【'+title+'】')).length;
 var merchantId=merchant.id,princessId=ay.id;`);
 return w;
}
for(const first of ['merchant','princess'])test('admission order '+first+' creates one real friendship including for a solitary merchant',()=>{
 const w=setup();w.run(`
 assert.match(consortTraitTags(merchant),/仰慕阿依慕/);assert.doesNotMatch(consortTraitTags(q),/仰慕阿依慕/);
 admit(${first});assert.ok(!merchant.whiteSpringFriend?.princess);drain();
 admit(${first==='merchant'?'princess':'merchant'});drain();
 assert.equal(merchant.whiteSpringFriend.princess,ay.id);assert.ok(relGet(ay,merchant)>=35);assert.ok(socialPair(ay,merchant));assert.ok(!socialPair(merchant,q));
 ay.rank=2;ay.favor=1;merchant.favor=95;S.rel[rk(merchant,q)]=100;
 assert.equal(facOf(merchant),ay);assert.equal(facOf(ay),ay);
 assert.match(relLine(merchant),/阿依慕一派.*交好/);assert.match(facHTML(),/阿依慕一派/);meetWhiteSpringMerchants();assert.equal(entries(ay,'白泉铃声'),1);assert.equal(entries(merchant,'仰慕阿依慕'),1);
 assert.match(whiteSpringFriendPanel(ay),/同辨白泉织样/);assert.match(whiteSpringFriendPanel(merchant),/合一回舞铃/);
 A.whiteSpringVisit(merchant.id,'bells');assert.equal(curEv.title,'合一回舞铃');choose(0);drain();
 assert.equal(entries(merchant,'合一回舞铃'),1);assert.equal(entries(ay,'合一回舞铃'),1);
 A.whiteSpringVisit(merchant.id,'cloth');assert.ok(!modalOpen);S.turn++;A.whiteSpringVisit(merchant.id,'cloth');choose(0);drain();
 assert.equal(entries(merchant,'同辨白泉织样'),1);assert.ok(!whiteSpringFriendPanel(ay).includes('A.whiteSpringVisit'));
 relAdd(ay,merchant,-60);var v=relGet(ay,merchant);meetWhiteSpringMerchants();assert.equal(relGet(ay,merchant),v);
 assert.equal(facOf(merchant),ay);assert.equal(entries(merchant,'愿追随阿依慕'),1);
 `);
});
test('an old save waits for an absent merchant and persists each visit and its two records through reload',()=>{
 let w=setup();w.run(`merchant.homeLeave={};admit(merchant);admit(ay);delete merchant.whiteSpringFriend;
 merchant.fam={t:'知府',p:38};assert.match(consortTraitTags(merchant),/仰慕阿依慕/);
 meetWhiteSpringMerchants();assert.ok(!merchant.whiteSpringFriend.princess);delete merchant.homeLeave;
 meetWhiteSpringMerchants();A.whiteSpringVisit(merchant.id,'cloth');save('auto');`);const id=w.run('merchant.id');
 w=boot(88,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'同辨白泉织样');
 choose(0);drain();var m=byId(${id}),p=byId(m.whiteSpringFriend.princess);assert.ok(m.whiteSpringFriend.cloth);
 for(const c of [m,p])assert.equal(c.story.filter(e=>e.life?.title==='同辨白泉织样').length,1);`);
});

test('the 80% cutoff is fixed and an unmarked merchant gets no story, mood boost or reserved faction',()=>{
 const w=setup();
 w.run(`var dry=makeGirl({fam:{t:'皇商',p:30},trait:'好学',age:20});
 dry.seed=admirationSeed(80);dry.mood=65;
 assert.match(consortTraitTags(merchant),/仰慕阿依慕/);assert.doesNotMatch(consortTraitTags(dry),/仰慕阿依慕/);
 var before=JSON.stringify([merchant,dry]);for(var i=0;i<5;i++)consortTraitTags(dry);
 assert.equal(JSON.stringify([merchant,dry]),before);
 S.cands=[merchant,dry];S.selection={phase:'audience',current:dry.id};
 assert.doesNotMatch(viewSelectionAudience(),/听她讲白泉旧闻/);A.whiteSpringAudience(dry.id);assert.ok(!modalOpen);
 admit(ay);admit(dry);assert.ok(!modalOpen);assert.equal(dry.whiteSpringFriend,undefined);
 assert.equal(dry.mood,65);assert.notEqual(facOf(dry),ay);assert.equal(entries(dry,'仰慕阿依慕'),0);
 assert.equal(admiresWhiteSpring({...dry,whiteSpringFriend:{princess:ay.id}}),true,'a previously recorded admirer keeps her old history');`);
});

test('she tells a pre-palace memory during audience, and retention resumes its distinct celebration from a save',()=>{
 let w=setup();
 w.run(`admit(ay);S.cands=[merchant];S.selection={phase:'audience',current:merchant.id};
 UI.view='xx';merchant.mood=62;
 assert.match(viewSelectionAudience(),/听她讲白泉旧闻/);
 A.whiteSpringAudience(merchant.id);assert.equal(curEv.title,'储秀宫 · 白泉旧闻');
 assert.match(curEv.text,/臣女/);choose(0);drain();assert.equal(entries(merchant,'仰慕阿依慕'),1);
 assert.doesNotMatch(viewSelectionAudience(),/听她讲白泉旧闻/);
 A.xxRoster();A.xxTake(merchant.id);choose(1);nextEv();
 assert.equal(curEv.title,'初入宫 · 她惦记的白泉旧闻');assert.match(curEv.text,/原以为那些事只能听旁人讲/);
 assert.equal(merchant.mood,87);assert.equal(xinOf(merchant),'欢喜');assert.equal(facOf(merchant),ay);
 assert.equal(entries(merchant,'留宫之喜'),1);assert.equal(entries(merchant,'愿追随阿依慕'),1);
 var personal=merchant.story.find(e=>e.life?.title==='愿追随阿依慕'),princessNote=ay.story.find(e=>e.life?.title==='愿追随阿依慕');
 assert.notEqual(personal.t,princessNote.t);assert.equal(personal.life.summary,princessNote.life.summary);save('auto');`);
 const ids=w.run('[merchant.id,ay.id]');
 w=boot(37,w.storage);w.ctx.assert=assert;w.ctx.ids=ids;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
 var [merchant,ay]=ids.map(byId);assert.equal(curEv.title,'初入宫 · 她惦记的白泉旧闻');
 choose(0);drain();A.xxEnd();drain();
 assert.equal(merchant.story.filter(e=>e.t.startsWith('【仰慕阿依慕】')).length,1);
 assert.equal(facOf(merchant),ay);assert.match(viewSelectionArrivals(),/忍不住想笑/);`);
});

test('retention from the roster tells the full memory even when Ayimu has yet to be admitted',()=>{
 const w=setup();
 w.run(`S.cands=[merchant];S.selection={phase:'roster'};UI.view='xx';
 A.xxTake(merchant.id);choose(0);nextEv();
 assert.equal(curEv.title,'初入宫 · 她惦记的白泉旧闻');
 assert.ok(curEv.text.includes(whiteSpringMemory(merchant).words));assert.match(curEv.text,/若有一日阿依慕也来宫中/);
 choose(0);drain();assert.equal(merchant.whiteSpringFriend.allegiance,undefined);
 admit(ay);assert.equal(merchant.whiteSpringFriend.allegiance,ay.id);assert.equal(facOf(merchant),ay);`);
});
