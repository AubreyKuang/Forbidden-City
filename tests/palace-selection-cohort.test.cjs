const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
function setup(n=3){
  const h=boot(821);h.ctx.assert=assert;
  h.run(`A.newGame();A.start();drain();genCands(${n});A.xxRoster();
    var ids=S.cands.map(c=>c.id);
    S.cands.forEach(c=>{c.kin={};c.kinRival={};c.solitary=null;c.trait='温婉';c.scheme=20;c.hobby='读书';});
    var take=id=>{A.xxTake(id);choose(1);drain();};`);
  return h;
}
test('retaining people never interrupts the roster; last candidate still requires batch confirmation',()=>{
  const {run}=setup();
  run(`take(ids[0]);assert.equal(modalOpen,false);assert.equal(S.selection.accepted.length,1);
    assert.equal(newcomerWelcomeEvent(byId(ids[0])),null);
    assert.match(viewXX(),/已留选 1 人/);assert.doesNotMatch(viewXX(),/新妃安顿/);
    take(ids[1]);A.xxDrop(ids[2]);assert.equal(S.cands.length,0);
    assert.match(viewXX(),/确定名单，安排入宫/);assert.doesNotMatch(viewXX(),/下旨选秀/);
    A.xxEnd();assert.equal(modalOpen,false);assert.match(viewXX(),/新妃安顿/);
    assert.equal(S.selection.accepted.length,2);assert.equal(byId(ids[2]),undefined);
    assert.ok(newcomerWelcomeEvent(byId(ids[0])));`);
});
test('unfinished selection survives saving and loading, and optional greetings settle only once',()=>{
  const {run}=setup(2);
  run(`take(ids[0]);save('1');load('1');assert.equal(S.selection.accepted[0],ids[0]);
    assert.equal(newcomerWelcomeEvent(byId(ids[0])),null);take(ids[1]);A.xxEnd();
    A.xxWelcome(ids[0]);assert.equal(curEv.title,'初入宫门');choose(0);drain();
    var c=byId(ids[0]),aff=c.aff;A.xxWelcome(c.id);assert.equal(modalOpen,false);assert.equal(c.aff,aff);
    assert.equal(byId(ids[1]).entryAdjustment.settled,false);
    save('1');load('1');assert.equal(byId(ids[0]).entryAdjustment.answer,'reassured');
    assert.match(viewSelectionArrivals(),/已问候/);`);
});
test('the major chronicle waits for a single finalized roster with the original admission ranks',()=>{
 const {run}=setup();
 run(`var [accepted,dropped,later]=S.cands.map(fullName);UI.logF='big';
   A.xxTake(ids[0]);choose(curEv.choices.length-1);drain();assert.ok(!viewLog().includes(accepted));
   take(ids[0]);A.xxDrop(ids[1]);save('auto');A.load('auto');
   assert.ok(!viewLog().includes(accepted));
   assert.ok(!S.log.some(e=>e.t.includes('选秀入宫，封')));
   byId(ids[0]).rank=3;A.xxTake(ids[2]);choose(2);drain();
   A.xxEnd();A.xxEnd();save('auto');A.load('auto');
   var rosters=S.log.filter(e=>e.t.startsWith('选秀定榜'));
   assert.equal(rosters.length,1);assert.equal(rosters[0].b,1);
   assert.ok(rosters[0].t.includes(accepted+'封答应')&&rosters[0].t.includes(later+'封常在'));
   assert.ok(!viewLog().includes(dropped));assert.ok(viewLog().includes(rosters[0].t));`);
});
test('older admission rows are grouped by their actual closing record, even in the same month',()=>{
 const {run}=setup();
 run(`var start='元年正月，开选秀，各地秀女入宫待选。',end='选秀礼毕，留选1人。可到储秀宫查看新妃安顿。';
   S.log=[];log(start,1);log('李春和（寒门之女）元年正月选秀入宫，封答应。',1);log(end);
   log(start,1);log('顾秋娘（世家之女）元年正月选秀入宫，封贵人。');log(end);
   log(start,1);log('沈采薇（农家之女）元年正月选秀入宫，封常在。',1);
   var saved=JSON.stringify(S.log),rows=selectionChronicle(S.log).filter(e=>e.b);
   assert.equal(rows.length,2);assert.match(rows[0].t,/李春和封答应/);assert.match(rows[1].t,/顾秋娘封贵人/);
   assert.ok(!selectionChronicle(S.log).some(e=>e.t.includes('沈采薇')));
   assert.equal(JSON.stringify(S.log),saved);`);
});
test('cohort acquaintance is reciprocal, recorded, bounded, and not rerolled by render or reload',()=>{
  const {run,force}=setup(5);
  run(`ids.forEach(take);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)S.rel[rk(byId(ids[i]),byId(ids[j]))]=5;`);
  force(...Array(40).fill(0));
  run(`A.xxEnd();var peers=ids.map(byId);assert.ok(peers.some(c=>c.entryAdjustment.acquaintances?.length));
    for(const c of peers){assert.ok((c.entryAdjustment.acquaintances||[]).length<=2);
      assert.ok(c.story.some(s=>s.t.includes('【选秀礼毕】')));
      for(const id of c.entryAdjustment.acquaintances||[]){var o=byId(id);
        assert.ok(o.entryAdjustment.acquaintances.includes(c.id));assert.equal(relGet(c,o),15);
        assert.ok(c.story.some(s=>s.t.includes('【同批入宫】')&&s.t.includes(fullName(o))));}}
    var before=JSON.stringify(S);viewXX();viewXX();finishSelection();assert.equal(JSON.stringify(S),before);
    var relationships=JSON.stringify(S.rel);save('1');load('1');finishSelection();assert.equal(JSON.stringify(S.rel),relationships);
    assert.match(selectionCohortHTML(byId(ids[0])),/入宫同批/);`);
});
test('solitary, hostile and rival pairs do not gain cohort affection; absent entrants do not appear in scenes',()=>{
  const {run,force}=setup(4);
  run(`S.cands[0].solitary={path:'letters'};ids.forEach(take);var [a,b,c,d]=ids.map(byId);
    b.kinRival={[c.id]:true};S.rel[rk(b,c)]=5;S.rel[rk(b,d)]=-40;d.cold=true;
    var old=JSON.stringify(S.rel);`);
  force(...Array(20).fill(0));
  run(`A.xxEnd();assert.equal(JSON.stringify(S.rel),old);assert.ok(!a.entryAdjustment.acquaintances);
    assert.equal(cohortAffinity(b,c),false);assert.equal(cohortAffinity(b,d),false);
    assert.equal(newcomerWelcomeEvent(d),null);assert.match(viewXX(),/目前不在宫中/);
    assert.match(a.entryAdjustment.reaction,/温言辞谢/);`);
});
test('month ending finalizes the batch even with no remaining candidates and leaves reactions accessible',()=>{
  const {run}=setup(1);
  run(`take(ids[0]);assert.equal(S.cands.length,0);A.endMonth();drain();
    assert.equal(S.selection.phase,'arrivals');assert.equal(byId(ids[0]).entryAdjustment.pendingBatch,false);
    var rosters=S.log.filter(e=>e.t.startsWith('选秀定榜'));
    assert.equal(rosters.length,1);assert.ok(rosters[0].t.includes(fullName(byId(ids[0]))+'封答应'));
    assert.match(viewXX(),/新妃安顿/);assert.ok(byId(ids[0]).story.some(s=>s.t.includes('【选秀礼毕】')));`);
});
test('separate batches in the same month stay distinct and rejected-only selections close cleanly',()=>{
  const {run}=setup(1);
  run(`take(ids[0]);A.xxEnd();var c=byId(ids[0]),first=c.selectionCohort.id;
    genCands(1);var second=S.cands[0].id;take(second);A.xxEnd();
    assert.notEqual(byId(second).selectionCohort.id,first);assert.equal(sameSelectionCohort(c,byId(second)),false);
    genCands(1);A.xxDrop(S.cands[0].id);A.xxEnd();assert.equal(S.selection,undefined);assert.match(viewXX(),/下旨选秀/);`);
});
test('cohort familiarity opens later low-compatibility social opportunities without forgiving hostility',()=>{
  const {run,force}=setup(2);
  run(`ids.forEach(take);A.xxEnd();var [a,b]=ids.map(byId);
    S.consorts.filter(c=>c!==a&&c!==b).forEach(c=>c.cold=true);
    a.hobby='骑射';b.hobby='品茶';a.t2='念旧';b.t2='信佛';a.like='字画';b.like='诗书';a.hate='香料';b.hate='珠翠';
    a.mood=b.mood=80;S.rel[rk(a,b)]=5;assert.equal(consortCompatibility(a,b),0);
    assert.ok(cohortAffinity(a,b));`);
  force(0,0);
  run(`consortSocialTick();assert.equal(relGet(a,b),10);assert.ok(a.story.some(s=>s.t.includes('与同批入宫的')));
    assert.ok(b.story.some(s=>s.t.includes(fullName(a))&&s.t.includes('与同批入宫的')));
    S.turn+=4;S.rel[rk(a,b)]=-40;assert.equal(cohortAffinity(a,b),false);consortSocialTick();assert.equal(relGet(a,b),-40);`);
});
test('a much-delayed visit does not repeat a first-night conversation',()=>{
  const {run}=setup(1);
  run(`take(ids[0]);A.xxEnd();S.turn+=6;assert.equal(newcomerWelcomeEvent(byId(ids[0])),null);
    assert.match(viewXX(),/下旨选秀/);assert.doesNotMatch(viewXX(),/新妃安顿|去问候她/);`);
});
test('arrival cards last only the completion month and next month, while history remains intact',()=>{
 const {run}=setup(1);run(`take(ids[0]);A.xxEnd();var turn=S.turn,c=byId(ids[0]),history=JSON.stringify(c.story),cohort=JSON.stringify(c.selectionCohort);
 for(var offset of [0,1,2,24]){S.turn=turn+offset;var before=JSON.stringify(S),html=viewXX();assert.equal(JSON.stringify(S),before);
 if(offset<2){assert.match(html,/新妃安顿/);assert.match(html,/重新选秀/);}else{assert.doesNotMatch(html,/新妃安顿|去问候她/);assert.match(html,/下旨选秀/);}
 assert.equal(JSON.stringify(c.story),history);assert.equal(JSON.stringify(c.selectionCohort),cohort);}
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.doesNotMatch(viewXX(),/新妃安顿/);`);
});
test('reopening selection respects the existing early-selection price and preserves the previous cohort',()=>{
 const {run}=setup(1);run(`take(ids[0]);A.xxEnd();var c=byId(ids[0]),cohort=JSON.stringify(c.selectionCohort),funds=E().treasury,people=E().people;
 A.xxDecree();assert.equal(curEv.title,'下旨选秀');choose(1);drain();assert.equal(E().treasury,funds);assert.match(viewXX(),/新妃安顿/);
 A.xxDecree();choose(0);drain();assert.equal(E().treasury,funds-100);assert.equal(E().people,Math.max(0,people-4));
 assert.ok(S.cands.length);assert.equal(S.selection.phase,'audience');assert.equal(JSON.stringify(c.selectionCohort),cohort);assert.ok(c.story.some(s=>s.t.includes('【选秀礼毕】')));`);
});
test('legacy arrival pages infer time only from the stored cohort and never keep undated cards forever',()=>{
 const {run}=setup(1);run(`take(ids[0]);A.xxEnd();delete S.selection.finishedAt;assert.equal(selectionArrivalsRecent(),true);
 S.turn+=2;assert.equal(selectionArrivalsRecent(),false);delete byId(ids[0]).selectionCohort;assert.equal(selectionArrivalsRecent(),false);assert.match(viewXX(),/下旨选秀/);`);
});
