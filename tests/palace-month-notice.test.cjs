const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
function game(storage){const b=withClock(boot(311,storage));b.ctx.assert=assert;if(!storage)b.run('A.start();drain();');return b;}

test('zero energy leaves the current month and navigation available after reload',()=>{
 let b=game();b.run(`E().energy=1;A.taxPlan('light');tick(1500);assert.equal(S.turn,0);
 assert.ok($('#month-notice').hidden);assert.equal($('#app').inert,false);A.go('out');assert.equal(UI.view,'out');`);
 b=game(b.storage);b.run(`A.load('auto');assert.equal(E().energy,0);assert.equal(governance().tax,'light');tick(1500);
 assert.equal(S.turn,0);A.endMonth();assert.equal(S.turn,1);assert.ok(E().energy>0);`);
});
test('a failed explicit month autosave keeps the transition and saves when storage returns',()=>{
 const b=game();b.run(`E().energy=1;A.taxPlan('light');var persist=localStorage.setItem;
 localStorage.setItem=()=>{throw Error('quota')};A.endMonth();drain();
 assert.equal(S.turn,1);assert.ok(lastAutoSaveError);assert.ok($('#month-notice').hidden);
 tick(10000);assert.equal(S.turn,1);
 localStorage.setItem=persist;A.go('home');assert.equal(lastAutoSaveError,'');assert.equal(JSON.parse(localStorage.getItem(SKEY+'auto')).turn,1);`);
});
const fixtures=require('./fixtures/court-art-legacy-v3.json');
for(const fixture of fixtures.cases)test('version 3 pending scene remains replayable: '+fixture.name,()=>{
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
 b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
 assert.equal(b.run('S.turn'),fixture.save.turn);
 assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
 b.run("if(modalResult)nextEv();else choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);");
});

test('finishing an old version 3 last-energy scene keeps the month open for the new build',()=>{
 const fixture=fixtures.cases.find(c=>c.name==='spa');
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
 b.run("A.load('auto');choose(0);assert.equal(S.turn,0);assert.equal($('#month-notice').hidden,true);tick(1500);assert.equal(S.turn,0);A.endMonth();assert.equal(S.turn,1);");
});
