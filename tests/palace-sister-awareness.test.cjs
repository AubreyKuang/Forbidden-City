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
