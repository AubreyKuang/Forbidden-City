const test=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./child-consequences-world.cjs');
const {boot}=require('./playtest-harness.cjs');
function setup(){
 const w=world();w.ctx.assert=assert;
 w.run(`var merchant=makeGirl({fam:{t:'皇商',p:30},trait:'好学',age:20});
 merchant.solitary={path:'letters',stage:0,history:[]};
 var ay=storyCastCreate('ayimu').person,princess=ay;var admit=p=>addConsort(p,2,'受册入宫');
 var entries=(p,title)=>p.story.filter(e=>e.t.startsWith('【'+title+'】')).length;
 var merchantId=merchant.id,princessId=ay.id;`);
 return w;
}
for(const first of ['merchant','princess'])test('admission order '+first+' creates one real friendship including for a solitary merchant',()=>{
 const w=setup();w.run(`
 assert.match(consortTraitTags(merchant),/仰慕阿依慕/);assert.doesNotMatch(consortTraitTags(q),/仰慕阿依慕/);
 admit(${first});assert.ok(!merchant.whiteSpringFriend?.princess);admit(${first==='merchant'?'princess':'merchant'});
 assert.equal(merchant.whiteSpringFriend.princess,ay.id);assert.ok(relGet(ay,merchant)>=35);assert.ok(socialPair(ay,merchant));assert.ok(!socialPair(merchant,q));
 assert.match(relLine(merchant),/交好/);meetWhiteSpringMerchants();assert.equal(entries(ay,'白泉铃声'),1);assert.equal(entries(merchant,'仰慕阿依慕'),1);
 assert.match(whiteSpringFriendPanel(ay),/同辨白泉织样/);assert.match(whiteSpringFriendPanel(merchant),/合一回舞铃/);
 A.whiteSpringVisit(merchant.id,'bells');assert.equal(curEv.title,'合一回舞铃');choose(0);drain();
 assert.equal(entries(merchant,'合一回舞铃'),1);assert.equal(entries(ay,'合一回舞铃'),1);
 A.whiteSpringVisit(merchant.id,'cloth');assert.ok(!modalOpen);S.turn++;A.whiteSpringVisit(merchant.id,'cloth');choose(0);drain();
 assert.equal(entries(merchant,'同辨白泉织样'),1);assert.ok(!whiteSpringFriendPanel(ay).includes('A.whiteSpringVisit'));
 relAdd(ay,merchant,-60);var v=relGet(ay,merchant);meetWhiteSpringMerchants();assert.equal(relGet(ay,merchant),v);
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
