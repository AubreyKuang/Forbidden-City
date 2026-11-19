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
test('a real family parcel may arrive and can be gifted exactly once with individual memories',()=>{
 const w=setup();w.run(`admit(ay);admit(merchant);drain();var house=houseOf(merchant),father=house.father;S.turn+=3;var before=father.story?.length||0;Math.random=()=>0;whiteSpringFamilyParcelTick();
 assert.match(curEv.title,/娘家来物/);var parcel=merchant.whiteSpringFriend.familyParcel;assert.equal(parcel.senderId,father.id);assert.equal(parcel.relation,'父亲');assert.equal(father.story.length,before+1);assert.match(father.story.at(-1).t,/家礼/);assert.ok(merchant.story.some(e=>/娘家捎来/.test(e.t)));
 whiteSpringFamilyParcelTick();assert.equal(father.story.length,before+1);choose(0);drain();assert.match(whiteSpringFriendPanel(merchant),/带着白泉织纹暖巾去见阿依慕/);assert.match(whiteSpringFriendPanel(ay),/带着白泉织纹暖巾去见阿依慕/);
 A.whiteSpringFamilyGift(merchant.id);assert.match(curEv.title,/白泉旧缘/);assert.doesNotMatch(curEv.text,/认出熟悉的收线手法/);choose(1);drain();assert.ok(merchant.whiteSpringFriend.familyParcel);assert.equal(entries(merchant,'白泉故乡礼'),0);
 A.whiteSpringFamilyGift(merchant.id);choose(0);assert.match(modalResult.text,/认出熟悉的收线手法/);assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);assert.deepEqual(Array.from(merchant.whiteSpringFriend.familyGiftHistory),['scarf']);assert.equal(merchant.whiteSpringFriend.familyGiftsGiven[0].senderId,father.id);assert.match(whiteSpringFriendPanel(ay),/曾亲手送给阿依慕：白泉织纹暖巾/);assert.equal(entries(merchant,'白泉故乡礼'),1);assert.equal(entries(ay,'白泉故乡礼'),1);assert.notEqual(merchant.story.find(e=>e.life?.title==='白泉故乡礼').t,ay.story.find(e=>e.life?.title==='白泉故乡礼').t);drain();whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);`);
});
test('parcels require a real available family sender, an established friendship and both people in the palace',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;var house=houseOf(merchant);house.father.alive=false;for(const role of brotherRoles(house))house[role].alive=false;Math.random=()=>0;whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);
 house.brother={id:'sender-brother',name:'商家兄长',age:27,alive:true,story:[]};house.brother.away=true;whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);house.brother.away=false;
 ay.homeLeave={};whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);delete ay.homeLeave;relAdd(merchant,ay,-80);whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);
 relAdd(merchant,ay,100);whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel.senderId,'sender-brother');assert.match(merchant.whiteSpringFriend.familyParcel.relation,/兄/);assert.equal(house.brother.story.length,1);assert.match(house.brother.story[0].t,/给宫中姐妹的家礼/);assert.doesNotMatch(house.brother.story[0].t,/女儿/);`);
});
test('a parcel remains hers when the recipient is absent or a proposed gift is deferred',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;Math.random=()=>0;whiteSpringFamilyParcelTick();choose(0);drain();A.whiteSpringFamilyGift(merchant.id);var ev=curEv;ay.cold=true;assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.ok(merchant.whiteSpringFriend.familyParcel);assert.equal(entries(ay,'白泉故乡礼'),0);`);
});
test('a v114 pending action cannot create a new family parcel',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;var prior=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>114,configurable:true});Math.random=()=>0;whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);Object.defineProperty(PalaceActions,'contentVersion',prior);`);
});
test('a real month-end parcel and the proposed gift survive refresh without duplicating family records',()=>{
 let w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;E().health=100;E().people=90;E().treasury=5000;var oldRandom=Math.random,seed=5;Math.random=()=>new Error().stack.includes('whiteSpringFamilyParcelTick')?0:((seed=seed*16807%2147483647)/2147483647);PalaceActions.reset();A.endMonth();
 for(var i=0;i<100&&!curEv?.title?.startsWith('娘家来物');i++){if(modalResult)nextEv();else if(modalOpen){var j=curEv.choices.findIndex(c=>!c.cond||c.cond());assert.ok(j>=0);choose(j);}else break;}assert.match(curEv?.title,/娘家来物/);`);
 const id=w.run('merchant.id');w=boot(170,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/娘家来物/);var m=byId(${id}),father=houseOf(m).father;assert.equal(father.story.filter(e=>e.t.startsWith('【给宫中女儿的家礼】')).length,1);choose(0);drain();A.whiteSpringFamilyGift(m.id);assert.match(curEv.title,/白泉旧缘/);`);
 w=boot(171,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/白泉旧缘/);var m=byId(${id}),princess=byId(m.whiteSpringFriend.princess);choose(0);assert.equal(m.whiteSpringFriend.familyParcel,undefined);assert.equal(m.story.filter(e=>e.life?.title==='白泉故乡礼').length,1);assert.equal(princess.story.filter(e=>e.life?.title==='白泉故乡礼').length,1);`);
});
test('family gifts have a cooldown and never repeat the same object',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;Math.random=()=>0;
 for(const expected of ['scarf','bird','glass']){whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel.key,expected);choose(0);drain();A.whiteSpringFamilyGift(merchant.id);choose(0);drain();S.turn+=18;}
 assert.deepEqual(Array.from(merchant.whiteSpringFriend.familyGiftHistory),['scarf','bird','glass']);whiteSpringFamilyParcelTick();assert.equal(merchant.whiteSpringFriend.familyParcel,undefined);assert.equal(entries(merchant,'白泉故乡礼'),3);assert.equal(entries(ay,'白泉故乡礼'),3);`);
});
test('an already received parcel remains real even if its sender later dies',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;var father=houseOf(merchant).father;Math.random=()=>0;whiteSpringFamilyParcelTick();choose(0);drain();father.alive=false;
 A.whiteSpringFamilyGift(merchant.id);assert.match(curEv.text,/此前随家书送来/);choose(0);drain();assert.equal(merchant.whiteSpringFriend.familyGiftsGiven[0].senderId,father.id);assert.equal(entries(merchant,'白泉故乡礼'),1);assert.equal(entries(ay,'白泉故乡礼'),1);`);
});
test('deep grief defers a cheerful reunion without deleting the gift or inventing a meeting',()=>{
 const w=setup();w.run(`admit(merchant);admit(ay);drain();S.turn+=3;Math.random=()=>0;whiteSpringFamilyParcelTick();choose(0);drain();var p=merchant.whiteSpringFriend.familyParcel;ay.xin={k:'悲恸'};
 assert.equal(whiteSpringFamilyGiftReady(merchant,ay,merchant.whiteSpringFriend),false);assert.match(whiteSpringFriendPanel(merchant),/沉重心事/);A.whiteSpringFamilyGift(merchant.id);assert.equal(modalOpen,false);assert.equal(merchant.whiteSpringFriend.familyParcel,p);assert.equal(entries(ay,'白泉故乡礼'),0);
 ay.xin={k:'平和'};A.whiteSpringFamilyGift(merchant.id);assert.match(curEv.title,/白泉旧缘/);choose(0);drain();assert.equal(entries(ay,'白泉故乡礼'),1);`);
});
