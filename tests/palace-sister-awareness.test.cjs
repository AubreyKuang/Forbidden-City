const {test}=require('node:test'),assert=require('node:assert/strict');
const {world:base}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const w=base();w.ctx.assert=assert;w.run(`officialMarriageConfirm(ref,br,agree(ref,br));sister.willing=true;sister.trait='活泼';var wifeId=sister.id,hostId=other.id;PalaceActions.reset();`);return w;}
test('awareness has a low per-encounter chance only after repeated consensual meetings',()=>{
 const w=world();w.run(`var a={meetings:1};Math.random=()=>0;discoverSisterAffair(other,sister,a);assert.equal(other.sisterAffairKnowledge,undefined);
 a.meetings=2;Math.random=()=>.08;discoverSisterAffair(other,sister,a);assert.equal(other.sisterAffairKnowledge,undefined);
 Math.random=()=>0;discoverSisterAffair(other,sister,a);assert.equal(other.sisterAffairKnowledge[sister.id].reaction,'afraid');assert.match(other.story.at(-1).t,/心惊胆战/);
 var saved=other.sisterAffairKnowledge[sister.id];Math.random=()=>.99;discoverSisterAffair(other,sister,a);assert.equal(other.sisterAffairKnowledge[sister.id],saved);`);
});
test('each reaction persists and controls later conversation and admission',()=>{
 for(const [roll,reaction,chat,review,entry] of [[0,'afraid','担心','担心','担心'],[.4,'sad','难过','伤心','伤心'],[.9,'hopeful','一处','盼姐妹','欢喜']]){
  let w=world();w.run(`var n=0,oldRandom=Math.random;Math.random=()=>n++===0?0:${roll};discoverSisterAffair(other,sister,{meetings:2});Math.random=oldRandom;assert.equal(other.sisterAffairKnowledge[sister.id].reaction,'${reaction}');
   var t=consortChatTopics(other).find(t=>t.id==='sister-affair-'+sister.id).make();assert.match(t.text,/${chat}/);
   var review=marriedSisterAdmissionReview(other,sister,()=>true);assert.match(review.text,/${review}/);review.onShow();assert.match(other.story.at(-1).t,/${review}/);
   admitMarriedSister(other,sister,true);assert.match(other.story.at(-1).t,/${entry}/);assert.equal(other.sisterAffairKnowledge[sister.id].reaction,'${reaction}');`);
 }
});
test('actual private encounters queue discovery and pending event survives reload',()=>{
 let w=world();w.run(`Math.random=()=>0;A.marriedSisterVisit(hostId,wifeId);Math.random=()=>.99;choose(0);drain();S.turn++;
 sister.natalPregnancy={};PalaceActions.reset();A.marriedSisterVisit(hostId,wifeId);Math.random=()=>0;choose(0);nextEv();assert.equal(curEv.title,'姐妹私事 · 她已知晓');assert.equal(other.sisterAffairKnowledge[sister.id].reaction,'afraid');`);
 const host=w.run('hostId'),wife=w.run('wifeId');w=boot(9,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'姐妹私事 · 她已知晓');assert.equal(byId(${host}).sisterAffairKnowledge[${wife}].reaction,'afraid');`);
});
test('different sisters retain independent reactions for the same consort',()=>{
 const w=world();w.run(`var second=addNatalPerson(other,houseOf(other),'f',21,792,false);var old=Math.random,n=0;
 Math.random=()=>n++===0?0:0;discoverSisterAffair(other,sister,{meetings:2});
 n=0;Math.random=()=>n++===0?0:.99;discoverSisterAffair(other,second,{meetings:2});Math.random=old;
 assert.equal(other.sisterAffairKnowledge[sister.id].reaction,'afraid');assert.equal(other.sisterAffairKnowledge[second.id].reaction,'hopeful');
 assert.ok(consortChatTopics(other).some(t=>t.id==='sister-affair-'+sister.id));assert.ok(consortChatTopics(other).some(t=>t.id==='sister-affair-'+second.id));`);
});
test('each other sister keeps her own recorded reaction when the married sister enters the palace',()=>{
 for(const reaction of ['hopeful','sad','afraid']){const w=world();w.run(`var witness=makeGirl({sur:'魏',given:'明岚',age:26,trait:'温婉'});addConsort(witness,6,'入宫');witness.house=other.house;other.sisterAffairKnowledge={[sister.id]:{reaction:'hopeful',sister:sister.id,name:sister.name}};witness.sisterAffairKnowledge={[sister.id]:{reaction:'${reaction}',sister:sister.id,name:sister.name,turn:S.turn}};
 var before=relGet(witness,sister),result=admitMarriedSister(other,sister,true),g=byId(sister.id),text=witness.story.at(-1).t;
 assert.match(text,/${reaction==='hopeful'?'欢喜':reaction==='sad'?'伤心':'担心'}/);assert.doesNotMatch(text,/对新常在的非议/);assert.match(g.story.at(-1).t,/${reaction==='hopeful'?'照应':reaction==='sad'?'难过':'议论'}/);
 assert.${reaction==='sad'?'match':'doesNotMatch'}(result,/生出嫌隙/);`);}
});
test('older pending admission keeps its original senior consort reaction',()=>{
 const w=world();w.run(`var witness=makeGirl({sur:'魏',given:'明岚',age:26,trait:'温婉'});addConsort(witness,6,'入宫');witness.sisterAffairKnowledge={[sister.id]:{reaction:'hopeful',sister:sister.id,name:sister.name}};
 var original=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>110,configurable:true});admitMarriedSister(other,sister,true);assert.match(witness.story.at(-1).t,/对新常在的非议/);Object.defineProperty(PalaceActions,'contentVersion',original);`);
});

test('知情姐妹的三种反应各有私信与回音，隔月读档也只寄一次',()=>{
 for(const [reaction,phrase,reply] of [['afraid','推了','屋里坐'],['sad','我没出去送','听见我了'],['hopeful','愿意进宫','想留在家里']]){
  const w=world();Object.assign(w.ctx,{reaction,phrase,reply});
  w.run(`other.sisterAffairKnowledge={[wifeId]:{reaction,sister:wifeId,name:sister.name,turn:S.turn}};
   sister.willing=false;relAdd(other,sister,100);
   var origRand=Math.random;Math.random=()=>0;
   sisterAwarenessMailTick();assert.equal(other.sisterAffairKnowledge[wifeId].letter,undefined);
   S.turn+=3;sisterAwarenessMailTick();sisterAwarenessMailTick();Math.random=origRand;
   assert.equal(other.story.filter(e=>e.t.includes('【寄给姐妹的私信】')&&e.t.includes(phrase)).length,1);
   assert.equal(sister.story.filter(e=>e.t.includes('【宫中姐妹来信】')&&e.t.includes(phrase)).length,1);
   PalaceActions.reset();save('auto');A.load('auto');other=byId(hostId);sister=natalEntry(hostId,wifeId).p;
   S.turn++;sisterAwarenessMailTick();sisterAwarenessMailTick();
   assert.equal(other.story.filter(e=>e.t.includes('【收到姐妹回信】')&&e.t.includes(reply)).length,1);
   assert.equal(sister.story.filter(e=>e.t.includes('【寄回姐妹家书】')&&e.t.includes(reply)).length,1);
   assert.ok(consortChatTopics(other).find(t=>t.id==='sister-affair-'+wifeId).make().text.includes(reply));
   assert.ok(sister.married);assert.ok(!sister.consortId);`);
 }
});
test('同住暂缓，已改嫁或入宫即止，选择沉默不会反复掷骰',()=>{
 const w=world();w.run(`var known={reaction:'afraid',sister:wifeId,turn:S.turn-6,name:sister.name,spouseId:sister.spouse.id};
 other.sisterAffairKnowledge={[wifeId]:known};sister.visit={host:hostId,until:S.turn+2};Math.random=()=>0;
 sisterAwarenessMailTick();assert.ok(!known.letter);delete sister.visit;other.cold=true;
 sisterAwarenessMailTick();assert.ok(!known.letter);other.cold=false;Math.random=()=>.99;sisterAwarenessMailTick();
 assert.ok(known.letter.closed);Math.random=()=>0;S.turn++;sisterAwarenessMailTick();assert.ok(!known.letter.sent);
 delete known.letter;sister.spouse.id='different';sisterAwarenessMailTick();assert.ok(known.letter.closed);assert.ok(!known.letter.sent);
 sister.spouse.id=known.spouseId;delete known.letter;sisterAwarenessMailTick();assert.equal(known.letter.sent,S.turn);
 sister.consortId=wifeId;S.turn++;sisterAwarenessMailTick();assert.ok(known.letter.closed);assert.ok(!known.letter.reply);`);
});
test('同一个宫外姐妹收到不同发信人的家书时，分别按各自反应回信',()=>{
 const w=world();w.run(`var witness=makeGirl({sur:'魏',given:'明岚',age:26,trait:'温婉'});addConsort(witness,6,'入宫');witness.house=other.house;
 for(const [who,reaction] of [[other,'afraid'],[witness,'hopeful']])who.sisterAffairKnowledge={[wifeId]:{sister:wifeId,name:sister.name,turn:S.turn-4,reaction}};
 Math.random=()=>0;sisterAwarenessMailTick();sisterAwarenessMailTick();assert.equal(sister.story.filter(e=>e.t.includes('【宫中姐妹来信】')).length,1);
 S.turn++;sisterAwarenessMailTick();S.turn++;sisterAwarenessMailTick();
 assert.match(other.sisterAffairKnowledge[wifeId].letter.reply,/提醒|悬着心/);assert.match(witness.sisterAffairKnowledge[wifeId].letter.reply,/入宫|一处/);
 assert.equal(sister.story.filter(e=>e.t.includes('【寄回姐妹家书】')).length,2);`);
});
