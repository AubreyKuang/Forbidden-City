const {test}=require('node:test'),assert=require('node:assert/strict');
const {secretWorld}=require('./palace-secret-world.cjs');
const {boot}=require('./playtest-harness.cjs');
function setup(){
 const game=secretWorld('romance');game.ctx.assert=assert;
 game.run(`var pair=Object.values(S.palaceRomance.pairs)[0];
   pair.status='active';pair.pending=true;var seedWatch=33;Math.random=()=>((seedWatch=(Math.imul(seedWatch,1664525)+1013904223)>>>0)/4294967296);PalaceActions.reset();`);
 return game;
}
test('confirmed palace affair gets a compulsory named monthly report, survives reload, and can be dealt with immediately',()=>{
 let g=setup();
 g.run(`A.endMonth();for(let i=0;modalOpen&&!curEv.title.includes('密报 · 皇子与宫眷')&&i<120;i++){if(modalResult)nextEv();else choose(0);}
 assert.equal(curEv.title,'锦衣卫密报 · 皇子与宫眷');assert.ok(curEv.text.includes(fullName(c)));assert.match(curEv.text,/承安/);
 assert.equal(jinyiwei().rareNotices.filter(n=>n.title==='宫闱私情').length,1);save('auto');`);
 g=boot(11,g.storage);g.ctx.assert=assert;
 g.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫密报 · 皇子与宫眷');
 choose(0);assert.equal(curEv.title,'回廊相依');choose(0);drain();assert.equal(Object.values(S.palaceRomance.pairs)[0].status,'ended');assert.equal(princeAffairReports().length,0);
 assert.equal(jinyiwei().rareNotices.filter(n=>n.title==='宫闱私情').length,1);`);
});
test('ordinary letters and suspicions stay out of the report, a true concealed meeting does not disclose paternity',()=>{
 const g=setup();g.run(`pair.stage=2;assert.equal(princeAffairReports().length,0);pair.conceivedAt=S.turn;S.jinyiwei=null;
 pushEv(princeAffairReports()[0]);assert.match(curEv.title,/值房密报/);assert.doesNotMatch(curEv.text,/有孕|身世|生父/);
 choose(0);drain();pair.stage=3;assert.equal(princeAffairReports().length,0);assert.equal(S.log.filter(e=>e.t.includes('宫门值房密报')).length,1);`);
});
test('a confirmed guard relationship is discovered even when a random discovery would fail',()=>{
 const g=setup();g.run(`A.recruitIntelligenceAgent('guard');var man=intelligenceAgent('guard');c.age=24;A.assignPersonalGuard(c.id);
 var bond=man.protection;bond.months=29;bond.stage=2;bond.secrecy=100;S.turn++;Math.random=()=>.999;
 guardProtectionTick();assert.equal(bond.discovered,true);pushEv(guardAffairEvent());assert.match(curEv.title,/锦衣卫密报/);
 assert.ok(curEv.text.includes(man.name)&&curEv.text.includes(fullName(c)));choose(1);drain();assert.equal(guardAffairEvent(),null);`);
});
