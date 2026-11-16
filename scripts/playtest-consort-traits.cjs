/* Three ten-year courts, real monthly decisions, with a mid-run fresh-context load. */
const {boot}=require('../tests/playtest-harness.cjs'),assert=require('node:assert/strict');
const runs=[];
for(const seed of [23001,23002,23003]){
 let b=boot(seed);b.ctx.assert=assert;b.run(`A.start();drain();for(var i=0;i<18;i++)addConsort(makeGirl(),2,'选秀入宫');for(var c of S.consorts){c.known=true;c.kl=true;}reconcileConsortDistinctions();`);
 const sample=()=>JSON.parse(b.run(`JSON.stringify((()=>{var people=harem(),known=people.map(c=>consortTraitLabels(c,{reveal:true}));return {turn:S.turn,people:people.length,tagged:known.filter(a=>a.length).length,frail:known.filter(a=>a.some(r=>r.id==='frail')).length,visibleTagged:people.filter(c=>consortTraitLabels(c).length).length,maxCompact:Math.max(0,...people.map(c=>(consortTraitTags(c).match(/consort-trait-tag/g)||[]).length)),minHealth:Math.min(...people.map(c=>c.hp)),maxHealth:Math.max(...people.map(c=>c.hp))};})())`));
 const checkpoints=[sample()];
 for(let month=0;month<120;month++){
  b.run(`E().health=100;E().treasury=Math.max(3000,E().treasury);A.endMonth();drain();assert.ok(S.consorts.every(c=>Number.isFinite(c.hp)&&c.hp>=0&&c.hp<=100));assert.equal(PalaceActions.blocked,false);`);
  if((month+1)%12===0)checkpoints.push(sample());
  if(month===59){b.run(`save('auto');`);b=boot(seed+10000,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();`);}
 }
 for(const p of checkpoints){assert.ok(p.maxCompact<=2);assert.ok(p.tagged<p.people,'no court has everyone tagged');}
 runs.push({seed,checkpoints});process.stderr.write(`Completed seed ${seed}: ${JSON.stringify(checkpoints.at(-1))}\n`);
}
console.log(JSON.stringify({method:'20 initial consorts per court; all initial hidden attributes revealed for the conservative count; first available answers to real monthly events; no forced stat growth or new admissions; emperor health/treasury sustained; fresh-context load after 60 steps. Additional women may join through genuine events.',runs},null,2));
