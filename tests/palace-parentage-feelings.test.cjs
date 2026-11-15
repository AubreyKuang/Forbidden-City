const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(trait='温婉',clue='whisper'){const b=boot(821);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=10;S.children=[];
 var c=harem()[0];c.trait='${trait}';c.solitary=null;c.mood=70;c.aff=70;c.xin={k:'平和',t:S.turn};
 var k=makeKid(c,'f','清宁');k.parentage={father:{...k.birthTraits.father},status:'investigating',due:60,clue:{kind:'${clue}'}};
 var cid=c.id,kid=k.id;PalaceActions.reset();`);return b;}
for(const trait of ['温婉','爽直','沉静','善妒'])test('cleared mother retains named hurt, mood change and personality '+trait,()=>{
 const b=world(trait);b.run(`A.parentageInquiry(kid);assert.equal(curEv.title,'疑云已释');choose(0);assert.equal(k.parentage.decision,'cleared');assert.equal(xinOf(c),'委屈');assert.ok(c.mood<70);assert.ok(c.aff<70);
 assert.equal(c.story.filter(s=>s.life?.title==='身世昭雪后的委屈').length,1);assert.ok(c.story.some(s=>s.t.includes('清宁')&&s.t.includes('皇帝亲生')&&s.t.includes('委屈')));
 assert.ok(k.story.some(s=>s.life?.title==='身世疑云澄清'));assert.ok(NPCMemory.recall(S,cid).some(m=>String(m.subject)===String(kid)&&m.interpretation.includes('委屈')));
 assert.equal(maternalVoice(c).key,'maternal-cleared');assert.ok(k.alive&&c.alive);assert.equal(k.removedFromRoyal,undefined);`);
});
test('cleared result survives reload and repeated viewing without duplicate hurt or memory',()=>{
 const b=world();b.run(`A.parentageInquiry(kid);choose(0);var feeling=JSON.stringify(c.parentageHurt),n=c.story.length,mood=c.mood;save('auto');A.load('auto');c=byId(cid);k=kidById(kid);
 assert.equal(PalaceActions.blocked,false);assert.equal(c.story.length,n);assert.equal(c.mood,mood);assert.equal(JSON.stringify(c.parentageHurt),feeling);drain();
 var before=JSON.stringify(S);parentageClearEvent(k).choices[0].f();maternalVoice(c);assert.equal(JSON.stringify(S),before);`);
});
test('false rumors do not automatically punish or identify an intentional slanderer',()=>{
 const b=world('善妒','informant');b.run(`var rival=harem()[1];k.parentage.clue.informant=rival.id;var relation=relGet(c,rival),storyBefore=rival.story.length;A.parentageInquiry(kid);choose(0);
 assert.equal(relGet(c,rival),relation);assert.equal(rival.story.length,storyBefore);assert.ok(rival.alive&&!rival.cold);assert.match(modalResult.text,/不因未查实便自动认定/);`);
});
test('strong grief is preserved, and departed or dead mothers do not produce present-palace dialogue',()=>{
 const b=world();b.run(`c.xin={k:'心如死灰',t:S.turn};A.parentageInquiry(kid);choose(0);assert.equal(xinOf(c),'心如死灰');assert.equal(c.parentageHurt.child,kid);assert.notEqual(maternalVoice(c)?.key,'maternal-cleared');`);
 for(const patch of ['c.gone=true','c.cold=true','c.alive=false']){const b=world();b.run(`${patch};A.parentageInquiry(kid);choose(0);assert.notEqual(maternalVoice(c)?.key,'maternal-cleared');if(!c.alive)assert.equal(c.parentageHurt,undefined);`);}
});
test('temporary hurt dialogue yields to later child loss, recovery and time',()=>{
 const b=world();b.run(`A.parentageInquiry(kid);choose(0);drain();c.xin={k:'释然',t:S.turn};assert.notEqual(maternalVoice(c)?.key,'maternal-cleared');c.xin={k:'委屈',t:S.turn};S.turn+=3;assert.notEqual(maternalVoice(c)?.key,'maternal-cleared');S.turn-=3;k.alive=false;assert.notEqual(maternalVoice(c)?.key,'maternal-cleared');`);
});
test('actual non-imperial parentage does not incorrectly receive exoneration or maternal hurt',()=>{
 const b=world();b.run(`k.parentage.father={kind:'prince',id:-9,name:'赵承安'};assert.equal(parentageClearEvent(k),null);assert.equal(parentageVerdictEvent(k).title,'身世查证');assert.equal(c.parentageHurt,undefined);`);
});
test('v12 cleared result loads without replaying new mood changes',()=>{
 const data=require('./fixtures/parentage-clear-legacy-v12.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'疑云已释');assert.ok(modalResult);assert.equal(S.consorts[0].parentageHurt,undefined);drain();`);
});
