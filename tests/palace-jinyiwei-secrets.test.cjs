const {test}=require('node:test'),assert=require('node:assert/strict'),{secretWorld}=require('./palace-secret-world.cjs');
function setup(kind){const b=secretWorld(kind);b.ctx.assert=assert;return b;}
test('patrol can discover an existing secret without announcing guilt or informing its subjects',()=>{
 const b=setup('parentage');b.run(`var truth=JSON.stringify(k.parentage.father),stories=c.story.length;A.jinyiweiPatrol();choose(0);assert.match(curEv.title,/新疑点/);assert.equal(currentCase().status,'cold');assert.equal(k.parentage.status,'hidden');assert.equal(c.story.length,stories);assert.equal(JSON.stringify(k.parentage.father),truth);assert.ok(!curEv.text.includes(k.parentage.father.name));choose(1);assert.equal(E().energy,9);assert.equal(E().treasury,895);A.jinyiweiPatrol();assert.equal(modalOpen,false);`);
});
test('an unsuccessful patrol does not fabricate an affair, child or culpable consort',()=>{
 const b=setup('clear');b.run(`Math.random=()=>.99;var children=S.children.length;A.jinyiweiPatrol();choose(0);assert.match(modalResult.text,/未发现/);assert.equal(palaceCases().length,0);assert.equal(S.children.length,children);assert.equal(k.parentage.status,'suspected');`);
});
test('a proven imperial child is cleared using the existing hurt and memories, with one payment and one award',()=>{
 const b=setup('clear');b.run(`A.secretInquiry('parentage',kid);choose(0);var x=currentCase(),merit=guard.merit;assert.equal(x.status,'investigating');assert.equal(E().treasury,885);assert.equal(E().energy,9);drain();assert.equal(beginParentageInquiry(k),null);assert.equal(parentageInquiryEvent(k).title,'锦衣卫查证中');S.turn++;jinyiweiTick();assert.equal(curEv.title,'疑云已释');choose(0);assert.equal(k.parentage.decision,'cleared');assert.ok(other.parentageHurt);assert.equal(guard.merit,merit+6);assert.equal(caseReport(x),null);assert.equal(guard.merit,merit+6);drain();A.reviewSecretCase(x.id);assert.match(curEv.text,/清宁|亲生/);assert.equal(E().treasury,885);`);
});
test('failure leaves actual truth and current care unchanged, then retries only after six months',()=>{
 const b=setup('parentage');b.run(`A.secretInquiry('parentage',kid);choose(0);drain();Math.random=()=>.99;var father=JSON.stringify(k.parentage.father),mom=k.mom;S.turn++;jinyiweiTick();assert.equal(currentCase().status,'cold');assert.equal(JSON.stringify(k.parentage.father),father);assert.equal(k.mom,mom);assert.equal(k.parentage.decision,undefined);assert.equal(caseReady(currentCase()),false);drain();S.turn+=5;assert.equal(caseReady(currentCase()),true);`);
});
for(const kind of ['swap','no-swap'])test('saved birth-switch outcome is preserved: '+kind,()=>{
 const b=setup(kind);b.run(`var occurred=k.birthSwap.occurred;assert.equal(occurred,${kind==='swap'});A.secretInquiry('parentage',kid);choose(0);drain();S.turn++;jinyiweiTick();assert.equal(k.birthSwap.occurred,occurred);assert.equal(k.birthSwap.confirmed,true);assert.match(curEv.title,/换婴|疑云/);assert.equal(k.parentage.status,'confirmed');
 if(occurred){assert.equal(k.birthTraits.father.kind,'outsider');assert.ok(casesSection().includes('审理换婴主使'));}else assert.ok(!k.removedFromRoyal);`);
});
test('a false pregnancy can be stopped before the reported due date with no imaginary baby',()=>{
 const b=setup('loss');b.run(`var count=S.children.length,lossTurn=c.concealedLoss.turn;A.secretInquiry('loss',cid);choose(0);drain();S.turn++;jinyiweiTick();assert.equal(curEv.title,'脉案查实');choose(0);assert.equal(c.preg,0);assert.equal(c.concealedLoss.revealed,true);assert.equal(S.children.length,count);assert.equal(c.recovery.turn,lossTurn);assert.ok(c.story.some(s=>s.t.includes('锦衣卫')&&s.t.includes('小产')));`);
});
test('delivery during an inquiry follows the same smuggled baby into the birth-switch plot',()=>{
 const b=setup('loss');b.run(`A.secretInquiry('loss',cid);choose(0);drain();c.preg=10;pushEv(birthEvent(c));drain();var baby=deliveryKids(c)[0];S.turn++;jinyiweiTick();assert.match(curEv.title,/换婴/);assert.equal(baby.birthSwap.motive,'conceal-miscarriage');assert.equal(baby.birthSwap.original,null);assert.equal(baby.birthSwap.confirmed,true);assert.match(curEv.text,/没有另一个足月出生的亲生孩子/);`);
});
test('romance evidence resumes the existing pair and stage; it does not invent a more serious act',()=>{
 const b=setup('romance');b.run(`var pair=Object.values(S.palaceRomance.pairs)[0];pair.stage=2;pair.status='active';A.secretInquiry('romance',pair.key);choose(0);drain();S.turn++;jinyiweiTick();assert.match(curEv.text,/没有据此补定更进一步/);choose(0);assert.equal(curEv.title,'夹在书中的笺子');choose(1);drain();assert.equal(pair.status,'ended');assert.equal(pair.stage,2);A.reviewSecretCase(currentCase().id);assert.match(curEv.title,/案卷|原案记录/);`);
});
test('resolved cases and dead subjects cannot be repeatedly commissioned',()=>{
 const b=setup('clear');b.run(`var x=fileSecretCase(secretSource('parentage',k));k.alive=false;assert.equal(caseReady(x),false);A.jinyiweiInvestigate(x.id);assert.equal(modalOpen,false);assert.equal(E().treasury,900);`);
});
test('mourning defers romance questioning while retaining evidence and permits the same case afterward',()=>{
 const b=setup('romance');b.run(`var pair=Object.values(S.palaceRomance.pairs)[0];A.secretInquiry('romance',pair.key);choose(0);drain();S.turn++;S.flags.dowager.mourning={turn:S.turn,handled:true};jinyiweiTick();assert.equal(curEv.title,'宫墙私笺 · 查证回奏');assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);assert.equal(pair.status,'concealed');var id=currentCase().id,merit=guard.merit;choose(1);drain();S.turn++;A.reviewSecretCase(id);assert.equal(curEv.choices[0].cond(),true);choose(0);assert.equal(curEv.title,'回廊相依');assert.equal(guard.merit,merit);choose(1);drain();assert.equal(pair.status,'ended');`);
});
test('commander absence defers rather than fabricates a result',()=>{
 const b=setup('clear');b.run(`A.secretInquiry('parentage',kid);choose(0);drain();guard.alive=false;S.turn++;jinyiweiTick();assert.equal(currentCase().status,'cold');assert.equal(k.parentage.decision,undefined);assert.equal(k.parentage.status,'suspected');assert.equal(modalOpen,false);`);
});
test('all three clue scenes expose the same case handoff, with no duplicate case on repeated views',()=>{
 const b=setup('clear');b.run(`assert.ok(parentageInquiryEvent(k).choices.some(x=>x.t.includes('锦衣卫')));A.secretInquiry('parentage',kid);choose(1);A.secretInquiry('parentage',kid);choose(1);assert.equal(palaceCases().length,1);`);
 const loss=setup('loss');loss.run(`S.turn++;assert.ok(concealedLossClueEvent(c).choices.some(x=>x.t.includes('锦衣卫')));`);
 const swap=setup('swap');swap.run(`S.turn=k.birthSwap.clueDue;assert.ok(birthSwapClueEvent().choices.some(x=>x.t.includes('锦衣卫')));`);
});
test('commission confirmation and discovery preserve exact pending scenes through save replay',()=>{
 for(const kind of ['clear','loss','romance']){const b=setup(kind);b.run(`var id=${kind==='clear'?'kid':kind==='loss'?'cid':'Object.values(S.palaceRomance.pairs)[0].key'};A.secretInquiry('${kind==='clear'?'parentage':kind}',id);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);choose(0);var title=curEv.title;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);assert.equal(E().treasury,885);assert.equal(palaceCases().length,1);`);}
});
test('actual monthly progress queues one verdict and the regular parentage report cannot duplicate it',()=>{
 for(const kind of ['clear','swap','parentage']){const b=setup(kind);b.run(`A.secretInquiry('parentage',kid);choose(0);drain();A.endMonth();var titles=[curEv,...Q].map(e=>e.title),wanted='${kind}'==='clear'?'疑云已释':'${kind}'==='swap'?'换婴案 · 真相':'身世查证';assert.equal(titles.filter(t=>t===wanted).length,1);assert.equal(parentageReportEvent(),null);`);}
});
