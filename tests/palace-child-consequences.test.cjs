const {test}=require('node:test'),assert=require('node:assert/strict'),{world:base}=require('./child-consequences-world.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}
function cold(w){w.run(`Math.random=()=>0;A.cold(a.id);choose(0);nextEv();`);}
test('cold palace immediately queues one collective child response with foster siblings and a real friend',()=>{
 const w=world();cold(w);w.run(`assert.equal(curEv.title,'孩子们一同求情');assert.match(curEv.text,/清宁、清和、明仪、玉宁一同/);assert.match(curEv.text,/陪交好的孩子前来/);assert.match(curEv.text,/沈知微.*入冷宫/);assert.doesNotMatch(curEv.text,/object Object|undefined|玉华/);
 for(var k of [elder,little,foster,baby])assert.ok(k.story.some(s=>s.familyIncident?.kind==='cold'));assert.ok(!stranger.story.some(s=>s.familyIncident));assert.match(foster.story.find(s=>s.familyIncident).t,/养母/);assert.match(baby.story.find(s=>s.familyIncident).t,/尚不明白/);
 assert.equal(S.flags.childFamilyIncidents.length,1);choose(0);drain();assert.equal(a.cold,true);assert.ok(friend.story.some(s=>s.t.includes('陪交好的皇嗣')));assert.ok(!friend.story.some(s=>s.t.includes('为母妃')));assert.equal(motherAppealEvent(),null);`);
});
test('visit conversations vary, cost one energy, remain brief and never repeat the petition',()=>{
 const w=world();cold(w);w.run(`choose(0);drain();var spoken=new Set(),start=E().energy;for(var i=0;i<7;i++){A.kidVisit(elder.id);assert.equal(curEv.title,'探望皇嗣');assert.ok(curEv.text.length<200);assert.doesNotMatch(curEv.text,/一同来御前求情|消息传到了/);spoken.add(curEv.text);drain();}assert.equal(spoken.size,7);assert.equal(E().energy,start-7);assert.equal(elder.familyFeeling.visits,7);assert.equal(S.flags.childFamilyIncidents.length,1);`);
});
test('real punishment pending scene, reply and subsequent visits replay exactly once',()=>{
 let w=world();cold(w);const eid=w.run('elder.id'),aid=w.run('a.id');const text=w.run('curEv.text');w=boot(102,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.childFamilyIncidents.length,1);`);assert.equal(w.run('curEv.text'),text);
 w.run(`choose(1);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();A.kidVisit(${eid});save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${eid}).familyFeeling.visits,1);drain();assert.equal(byId(${aid}).cold,true);assert.equal(kidById(${eid}).story.filter(s=>s.familyIncident?.response==='care').length,1);`);
});
test('release does not create a second demotion incident and stops cold-palace talk',()=>{
 const w=world();cold(w);w.run(`choose(2);drain();assert.equal(a.cold,false);assert.equal(a.rank,0);assert.equal(S.flags.childFamilyIncidents.length,1);assert.equal(childConsequenceVoice(elder),null);`);
});
test('a refused probability still records every affected child, without any forced plea',()=>{
 const w=world();w.run(`Math.random=()=>.999;A.cold(a.id);choose(0);nextEv();assert.equal(curEv.title,'母亲遭逢变故');assert.equal(S.flags.childFamilyIncidents[0].pleaders.length,0);assert.equal(a.childDisgrace.checked,true);choose(0);drain();assert.equal(motherAppealEvent(),null);`);
});
test('death records children including a former foster child, but never offers pardon or a plea',()=>{
 const w=world();w.run(`var prev=JSON.parse(JSON.stringify(S));a.alive=false;foster.foster=q.id;childMotherConsequences(prev);assert.equal(curEv.title,'亲人离世之后');assert.equal(S.flags.childFamilyIncidents[0].pleaders.length,0);assert.ok(curEv.choices.every(c=>!/出冷宫|求情|原处分/.test(c.t)));assert.match(foster.story.find(s=>s.familyIncident).t,/养母/);assert.equal(elder.familyFeeling.kind,'death');var n=elder.story.length;childMotherConsequences(prev);assert.equal(elder.story.length,n);drain();A.kidVisit(elder.id);assert.match(curEv.text,/记不清/);`);
});
test('an infant receives care narration and never speaks adult dialogue',()=>{
 const w=world();cold(w);w.run(`drain();A.kidVisit(baby.id);assert.match(curEv.text,/乳母/);assert.doesNotMatch(curEv.text,/“|儿臣|功课|写.*信/);`);
});
test('remote children send letters and cannot join a physical group at court',()=>{
 const w=world();w.run(`for(var k of [elder,little,foster,friend])k.away=true;Math.random=()=>0;A.cold(a.id);choose(0);nextEv();assert.match(curEv.text,/托人递来求情的书信/);assert.doesNotMatch(curEv.text,/一同来御前/);drain();A.kidVisit(elder.id);assert.equal(curEv.title,'皇嗣家书');assert.doesNotMatch(curEv.text,/你坐近|你的衣袖|靠到你身边|向你挪近/);`);
});
test('older settled cold-palace saves get varied visits without replaying a historical punishment',()=>{
 const w=world();w.run(`a.cold=true;syncChildDisgrace();PalaceActions.reset();save('auto');A.load('auto');var k=S.children.find(k=>k.name==='清宁');A.kidVisit(k.id);var first=curEv.text;drain();A.kidVisit(k.id);assert.notEqual(curEv.text,first);assert.equal(S.flags.childFamilyIncidents,undefined);assert.equal(k.familyVisitCount,2);`);
});
test('profile reading is pure and sorrow gradually leaves everyday speech',()=>{
 const w=world();cold(w);w.run(`drain();var before=JSON.stringify(S);childVoicePool(elder);childVoicePool(elder);assert.equal(JSON.stringify(S),before);S.turn+=6;assert.equal(childConsequenceVoice(elder),null);`);
});
test('departure produces immediate concern without asserting an offense',()=>{
 const w=world();w.run(`Math.random=()=>0;A.away(a.id);choose(0);nextEv();assert.match(curEv.text,/离宫/);assert.match(curEv.text,/只求父皇容人传个平安/);assert.doesNotMatch(curEv.text,/没有过错/);`);
});
