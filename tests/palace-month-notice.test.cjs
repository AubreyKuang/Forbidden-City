const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
function game(storage){const b=withClock(boot(311,storage));b.ctx.assert=assert;if(!storage)b.run('A.start();drain();');return b;}

test('notice blocks stray commands, waits 1500 ms and enters exactly one month',()=>{
 const b=game();b.run(`E().energy=1;A.taxPlan('light');
 assert.equal(S.turn,0);assert.equal($('#month-notice').hidden,false);assert.equal($('#app').inert,true);
 assert.match($('#month-notice-date').textContent,/四月/);
 A.endMonth();A.finishMonth();A.go('out');assert.equal(S.turn,0);
 tick(1499);assert.equal(S.turn,0);tick(1);assert.equal(S.turn,1);
 assert.equal($('#month-notice').hidden,true);assert.equal($('#app').inert,false);
 tick(10000);assert.equal(S.turn,1);`);
});
test('loading the saved zero-energy pause restarts the notice without losing the last action',()=>{
 let b=game();b.run("E().energy=1;A.taxPlan('light');tick(500);assert.equal(S.turn,0);");
 b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.turn,0);
 assert.equal(governance().tax,'light');assert.equal($('#month-notice').hidden,false);
 tick(1500);assert.equal(S.turn,1);`);
});
test('loading a different save cancels the old timer and releases the interface',()=>{
 const b=game();b.run(`save('1');E().energy=1;A.taxPlan('light');
 A.load('1');assert.equal($('#month-notice').hidden,true);assert.equal($('#app').inert,false);
 tick(10000);assert.equal(S.turn,0);assert.ok(E().energy>0);`);
});
test('December names the new reign year and January before advancing',()=>{
 const b=game();b.run(`S.month=12;S.year=9;E().era='永宁';E().energy=1;A.taxPlan('light');
 assert.equal($('#month-notice-date').textContent,'即将进入永宁十年正月');
 assert.equal(S.year,9);tick(1500);assert.equal(S.year,10);assert.equal(S.month,1);`);
});
test('an unsettled choice and its result remain readable without a running countdown',()=>{
 const b=game();b.run(`E().energy=1;A.court();tick(10000);assert.equal(S.turn,0);assert.equal($('#month-notice').hidden,true);
 choose(0);assert.ok(modalResult);tick(10000);assert.equal(S.turn,0);
 nextEv();assert.equal($('#month-notice').hidden,false);tick(1500);assert.equal(S.turn,1);`);
});
test('failed month autosave rolls back once and does not loop a hidden transition',()=>{
 const b=game();b.run(`E().energy=1;A.taxPlan('light');var persist=localStorage.setItem;
 localStorage.setItem=()=>{throw Error('quota')};tick(1500);
 assert.equal(S.turn,0);assert.equal(E().energy,0);assert.equal($('#month-notice').hidden,true);
 assert.equal($('#app').inert,false);tick(10000);assert.equal(S.turn,0);
 localStorage.setItem=persist;A.go('home');tick(1500);assert.equal(S.turn,1);`);
});
test('a completed month with pending scenes restores the version 4 transcript',()=>{
 let b=game();b.run("E().energy=1;A.taxPlan('light');tick(1500);assert.ok(modalOpen);assert.equal(S.turn,1);");
 b=game(b.storage);b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.turn,1);drain();tick(1500);assert.equal(S.turn,1);");
});
const fixtures=require('./fixtures/court-art-legacy-v3.json');
for(const fixture of fixtures.cases)test('version 3 pending scene remains replayable: '+fixture.name,()=>{
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
 b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
 assert.equal(b.run('S.turn'),fixture.save.turn);
 assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
 b.run("if(modalResult)nextEv();else choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);");
});

test('finishing an old version 3 last-energy scene also receives the new notice',()=>{
 const fixture=fixtures.cases.find(c=>c.name==='spa');
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
 b.run("A.load('auto');choose(0);assert.equal(S.turn,0);assert.equal($('#month-notice').hidden,false);tick(1500);assert.equal(S.turn,1);");
});
