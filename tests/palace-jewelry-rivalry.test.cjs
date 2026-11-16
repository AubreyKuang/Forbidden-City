const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./father-letters-world.cjs'),{boot}=require('./playtest-harness.cjs');

function setup(stock=1){
 const w=world();w.ctx.assert=assert;
 w.run(`var rival=makeGirl({sur:'宋',given:'明珠',age:24,trait:'爽直'});addConsort(rival,3,'选秀入宫');delete rival.solitary;rival.favor=88;rival.scheme=30;relAdd(rival,c,-65-relGet(rival,c));ensureJewelry().stock.jade=${stock};PalaceActions.reset();`);
 return w;
}
function startPetition(w){
 w.run(`A.jewelryGift(c.id,'jade');`);w.force(...Array(12).fill(0));
 w.run(`choose(0);assert.match(modalResult.text,/白玉流苏步摇/);nextEv();assert.equal(curEv.title,'争一件御赐首饰');`);
}

test('the outspoken favorite asks for the original; reloading the choice and outcome preserves exactly one item',()=>{
 let w=setup();startPetition(w);w=boot(118,w.storage);w.ctx.assert=assert;
 w.run(`A.load('auto');var [c,rival]=S.consorts;assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'争一件御赐首饰');assert.equal(curEv.choices[1].cond(),false);choose(0);assert.equal(jewelryOwned(c,'jade'),false);assert.equal(jewelryWorn(c),'');assert.equal(jewelryWorn(rival),'jade');assert.equal(S.jewelry.stock.jade,0);assert.match(c.story.at(-1).t,/改赐/);assert.match(rival.story.at(-1).t,/改赐给她/);`);
 w=boot(248,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.consorts.flatMap(c=>c.jewelry||[]).filter(j=>j.id==='jade').length,1);assert.equal(S.jewelry.stock.jade,0);assert.ok(modalResult);`);
});
test('a same-style gift consumes one spare and keeps the original owner’s item',()=>{
 const w=setup(2);startPetition(w);w.run(`var original=c.jewelry[0];choose(1);assert.equal(c.jewelry[0],original);assert.equal(rival.jewelry.length,1);assert.equal(S.jewelry.stock.jade,0);assert.equal(Q.length,0);assert.match(c.story.at(-1).t,/同款/);assert.match(rival.story.at(-1).t,/同款/);`);
});
test('a less severe rival asks for a matching item, and refusal leaves ownership intact',()=>{
 const w=setup(2);w.run(`relAdd(rival,c,25);A.jewelryGift(c.id,'jade');`);w.force(...Array(12).fill(0));
 w.run(`choose(0);nextEv();assert.equal(curEv.title,'也想要一件同款');assert.ok(curEv.choices.every(x=>!x.t.includes('原件')));choose(1);assert.match(rival.story.at(-1).t,/未获应允/);assert.equal(jewelryOwned(c,'jade'),true);assert.equal(jewelryOwned(rival,'jade'),false);assert.equal(S.jewelry.stock.jade,1);`);
});
test('high scheme prevents a public request but allows private jealousy, while a friend can admire the gift',()=>{
 const w=setup();w.run(`rival.scheme=76;var friend=makeGirl({sur:'陆',given:'静姝',age:25,trait:'温婉'});addConsort(friend,3,'选秀入宫');relAdd(friend,c,55-relGet(friend,c));Math.random=()=>0;A.jewelryGift(c.id,'jade');choose(0);assert.equal(Q.length,0);assert.match(rival.story.at(-1).t,/妒意.*白玉流苏步摇/);assert.match(friend.story.at(-1).t,/羡慕.*白玉流苏步摇/);assert.equal(chronicleTopic(friend.story.at(-1)),'bond');rival.scheme=30;rival.favor=50;assert.equal(jewelryRivalCanAsk(rival,c,'peony'),false);`);
});
