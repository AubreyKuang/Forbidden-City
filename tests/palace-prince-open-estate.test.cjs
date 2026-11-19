const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(412);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=240;S.year=21;S.month=1;E().energy=10;var mother=harem()[0],son=makeKid(mother,'m','承宁');son.born=S.turn-16*12;son.adult=true;var sonId=son.id,motherId=mother.id;PalaceActions.reset();`);return b;}
test('adult non-heir may be granted a capital residence from his own page',()=>{
 const b=world();b.run(`UI.sel=son.id;assert.match(viewKid(),/安排出宫开府/);assert.match(childResidence(son),/尚未开府/);var children=S.children.length;
 A.princeOpenEstate(son.id);assert.equal(curEv.title,'皇子 · 出宫开府');assert.equal(childInPalace(son),true);choose(0);assert.equal(childInPalace(son),false);assert.equal(childWhereabouts(son),'京中皇子府');assert.equal(S.children.length,children);assert.ok(son.story.some(x=>x.t.includes('在京开府')));assert.ok(mother.story.some(x=>x.t.includes('在京开府')));assert.equal(princeEstateOpenReady(son),false);assert.doesNotMatch(viewKid(),/安排出宫开府/);`);
});
test('declining does not move the prince, and the decision can be revisited',()=>{
 const b=world();b.run(`A.princeOpenEstate(son.id);choose(1);drain();assert.equal(son.princeEstate,undefined);assert.equal(childInPalace(son),true);S.turn+=5;reconcilePrinceResidence(son);assert.equal(son.princeEstate,undefined);A.princeOpenEstate(son.id);assert.equal(curEv.title,'皇子 · 出宫开府');`);
});
test('automatic reconciliation may resume after the six-month deferral',()=>{
 const b=world();b.run(`A.princeOpenEstate(son.id);choose(1);drain();S.turn+=6;reconcilePrinceResidence(son);assert.ok(son.princeEstate);assert.equal(son.princeEstateDeferredUntil,undefined);`);
});
test('the heir lives in the Eastern Palace, never receives the opening option, and a former heir becomes eligible',()=>{
 const b=world();b.run(`var next=makeKid(mother,'m','承安');next.born=S.turn-16*12;next.adult=true;A.kidHeir(son.id);choose(0);drain();assert.equal(S.heir,son.id);assert.equal(childWhereabouts(son),'东宫');son.royalTravel={stage:'returned',returnPlace:'旧游历地'};assert.equal(childWhereabouts(son),'东宫');delete son.royalTravel;assert.match(childResidence(son),/东宫/);UI.sel=son.id;assert.doesNotMatch(viewKid(),/安排出宫开府/);A.princeOpenEstate(son.id);assert.equal(modalOpen,false);
 A.kidHeir(next.id);choose(0);drain();assert.equal(S.heir,next.id);assert.equal(childWhereabouts(next),'东宫');assert.equal(childWhereabouts(son),'宫中');assert.equal(princeEstateOpenReady(son),true);A.princeOpenEstate(son.id);assert.equal(curEv.title,'皇子 · 出宫开府');`);
});
test('an opened prince moves to the Eastern Palace on appointment and a young heir no longer lives in his mother’s palace',()=>{
 const b=world();b.run(`openPrinceEstate(son);assert.equal(childHasLeftPalace(son),true);A.kidHeir(son.id);choose(0);drain();assert.equal(S.heir,son.id);assert.equal(son.princeEstate,undefined);assert.equal(childInPalace(son),true);assert.equal(childWhereabouts(son),'东宫');
 var child=makeKid(mother,'m','承安');child.born=S.turn-5*12;A.kidHeir(child.id);choose(0);drain();assert.equal(childResidence(child),'东宫 · 皇太子居处');assert.equal(youngChildMother(child),null);assert.ok(!nurseryChildren(mother.palace).includes(child));`);
});
test('minors, heirs, away, jailed, deceased, removed and already housed princes cannot open an estate',()=>{
 const b=world();b.run(`for(const patch of [{born:S.turn-15*12},{jailed:true},{templeStay:{}},{away:true},{alive:false},{removedFromRoyal:true},{pendingName:true},{princeEstate:{opened:S.turn}}]){var original={...son};Object.assign(son,patch);assert.equal(princeEstateOpenReady(son),false);A.princeOpenEstate(son.id);assert.equal(modalOpen,false);Object.keys(son).forEach(k=>delete son[k]);Object.assign(son,original);}S.heir=son.id;assert.equal(princeEstateOpenReady(son),false);assert.equal(openPrinceEstate(son),false);`);
});
test('jailed or temple-staying princes are not silently given an estate, and a jailed prince cannot be appointed heir',()=>{
 const b=world();b.run(`son.jailed=true;reconcilePrinceResidence(son);assert.equal(son.princeEstate,undefined);A.kidHeir(son.id);assert.equal(modalOpen,false);delete son.jailed;son.templeStay={};reconcilePrinceResidence(son);assert.equal(son.princeEstate,undefined);`);
});
test('pending opening and completed residence survive reload without duplicated records',()=>{
 let b=world();b.run(`A.princeOpenEstate(son.id);assert.equal(curEv.title,'皇子 · 出宫开府');`);const id=b.run('sonId');b=boot(413,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'皇子 · 出宫开府');choose(0);assert.equal(kidById(${id}).story.filter(x=>x.t.includes('在京开府')).length,1);`);
 b=boot(414,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(childWhereabouts(kidById(${id})),'京中皇子府');assert.equal(kidById(${id}).story.filter(x=>x.t.includes('在京开府')).length,1);`);
});
test('older pending actions do not gain the new residence displays or opening control',()=>{
 const b=world();b.run(`var old=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>118,configurable:true});S.heir=son.id;assert.equal(childWhereabouts(son),'宫中');assert.equal(childResidence(son),'');assert.equal(princeEstateOpenReady(son),false);Object.defineProperty(PalaceActions,'contentVersion',old);`);
});
test('a six-year-old heir does not ask to move from his mother to the ordinary princes’ quarters',()=>{
 const b=world();b.run(`son.born=S.turn-6*12;son.temperament='内敛';son.seed=Array.from({length:1000},(_,i)=>i).find(i=>voiceHash('mother-residence:'+son.id+':'+i)%100<18);S.heir=son.id;assert.equal(childResidence(son),'东宫 · 皇太子居处');assert.ok(!childMotherResidenceRequests().some(ev=>ev.por===son));`);
});
test('deferral survives reload and can be ended early by an explicit decision',()=>{
 let b=world();b.run(`A.princeOpenEstate(son.id);choose(1);drain();assert.equal(son.princeEstateDeferredUntil,S.turn+6);`);const id=b.run('sonId');b=boot(415,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var son=kidById(${id});assert.equal(son.princeEstateDeferredUntil,S.turn+6);reconcilePrinceResidence(son);assert.equal(son.princeEstate,undefined);A.princeOpenEstate(son.id);choose(0);assert.ok(son.princeEstate);assert.equal(son.princeEstateDeferredUntil,undefined);`);
});
test('a genuine v118 pending appointment resumes before displaying the Eastern Palace',()=>{
 const data=require('./fixtures/prince-heir-pending-v118.json'),b=boot(416,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,118);assert.equal(curEv.title,'册立太子');choose(0);drain();assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(childWhereabouts(kidById(S.heir)),'东宫');`);
});
