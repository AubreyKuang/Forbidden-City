const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(591);b.ctx.assert=assert;b.run(`A.start();drain();E().treasury=2000;E().people=60;`);return b;}
test('skipping an automatic selection preserves the actual date and allows an ordinary later decree',()=>{
 const b=world();b.run(`A.xxDecree();A.xxEnd();drain();assert.equal(S.flags.lastXX,0);S.turn=35;S.year=4;S.month=2;
 var funds=E().treasury,e=scheduledSelectionEvent();assert.ok(e);e.choices[1].f();
 assert.equal(S.flags.lastXX,0);assert.equal(S.flags.lastXXSkipped,35);assert.equal(E().people,62);
 assert.equal(e.choices[1].f(),null);assert.equal(scheduledSelectionEvent(),null);assert.equal(E().people,62);
 assert.match(viewXX(),/目前可依例下旨开选/);
 A.xxDecree();assert.equal(S.cands.length,6);assert.equal(E().treasury,funds);assert.equal(E().people,62);
 assert.equal(S.flags.lastXX,35);assert.equal(selectionFreeReady(),false);assert.ok(S.log.some(e=>e.t.includes('今年停办选秀')));`);
});
test('skipping before ever holding a selection does not invent a previous selection',()=>{
 const b=world();b.run(`S.turn=11;S.year=2;S.month=2;scheduledSelectionEvent().choices[1].f();
 assert.equal(S.flags.lastXX,-99);assert.match(viewXX(),/从未/);assert.equal(S.cands.length,0);`);
});
test('next year can offer again, with no repeated request in the skipped year',()=>{
 const b=world();b.run(`S.turn=11;S.year=2;S.month=2;scheduledSelectionEvent().choices[1].f();
 assert.equal(scheduledSelectionEvent(),null);S.turn+=11;S.year=3;S.month=1;assert.equal(scheduledSelectionEvent(),null);
 S.turn++;S.month=2;assert.ok(scheduledSelectionEvent());`);
});
test('actually held selections still cost money when reopened early, even if nobody is admitted',()=>{
 const b=world();b.run(`A.xxDecree();A.xxEnd();drain();var cash=E().treasury,people=E().people,held=S.flags.lastXX;
 A.xxDecree();assert.equal(curEv.title,'下旨选秀');choose(1);drain();assert.equal(E().treasury,cash);assert.equal(S.flags.lastXX,held);
 A.xxDecree();choose(0);drain();assert.equal(E().treasury,cash-100);assert.equal(E().people,people-4);`);
});
test('automatic offer and skipped result survive full-context reload without changing the next price',()=>{
 let b=world();b.run(`A.xxDecree();A.xxEnd();drain();S.turn=34;S.year=4;S.month=1;A.endMonth();
 for(var i=0;modalOpen&&curEv.title!=='三年大选'&&i<100;i++){if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));}
 assert.equal(curEv.title,'三年大选');save('auto');`);
 b=boot(2,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'三年大选');choose(1);save('auto');`);
 b=boot(3,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.lastXX,0);drain();var money=E().treasury;A.xxDecree();assert.equal(E().treasury,money);assert.equal(S.cands.length,6);`);
});
test('old skipped clocks repair from the actual start log while genuinely held February selections stay intact',()=>{
 const b=world();b.run(`A.xxDecree();A.xxEnd();drain();S.turn=35;S.year=4;S.month=2;
 S.flags.lastXX=35;delete S.flags.selectionClockGen;var before=JSON.stringify(S);
 assert.equal(selectionLastHeldTurn(),0);viewXX();assert.equal(JSON.stringify(S),before);
 reconcileSelectionTiming();assert.equal(S.flags.lastXX,0);assert.equal(S.flags.lastXXSkipped,35);
 genCands();finishSelection();delete S.flags.selectionClockGen;
 assert.equal(selectionLastHeldTurn(),35);reconcileSelectionTiming();assert.equal(S.flags.lastXX,35);`);
});
test('insufficient old history does not erase an unknown real selection or use another reign’s records',()=>{
 const b=world();b.run(`S.turn=35;S.year=4;S.month=2;S.flags.lastXX=35;delete S.flags.selectionClockGen;
 S.log=[{d:'旧朝元年三月',t:'旧朝元年三月，开选秀，各地秀女入宫待选。'}];
 assert.equal(selectionLastHeldTurn(),35);reconcileSelectionTiming();assert.equal(S.flags.lastXX,35);`);
});
const legacy=require('./fixtures/selection-and-dao-legacy-v52.json');
for(const version of [52,53])for(const name of ['offer','skipped'])test('real v'+version+' '+name+' replays before repairing its old refusal clock',()=>{
 const fixture=require('./fixtures/selection-and-dao-legacy-v'+version+'.json');
 const b=boot(591,new Map([['chengongji_v1_auto',JSON.stringify(fixture[name])]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});
 if(!modalResult)choose(1);drain();assert.equal(PalaceActions.contentVersion,61);
 var money=E().treasury;A.xxDecree();assert.equal(S.cands.length,6);assert.equal(E().treasury,money);`);
});
test('a settled old skip is repaired on load without needing a new game',()=>{
 const b=boot(591,new Map([['chengongji_v1_auto',JSON.stringify(legacy.afterSkip)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.lastXX,0);assert.equal(S.flags.lastXXSkipped,35);
 var money=E().treasury;A.xxDecree();assert.equal(E().treasury,money);`);
});
test('unrecoverable pending scenes retain their save and recovery prompt without timing migration',()=>{
 const payload=JSON.parse(JSON.stringify(legacy.offer));payload.pendingActions.version=999;
 const storage=new Map([['chengongji_v1_auto',JSON.stringify(payload)]]),before=storage.get('chengongji_v1_auto');
 const b=boot(591,storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,true);assert.equal(curEv.title,'未完事件无法续接');assert.equal(S.flags.selectionClockGen,undefined);`);
 assert.equal(storage.get('chengongji_v1_auto'),before);
});
