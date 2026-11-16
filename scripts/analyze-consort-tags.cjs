/* Uses production rules and the real selection generator, including kin candidates.
   Percentages describe people, not an extra monthly random chance. */
const {boot}=require('../tests/playtest-harness.cjs');
const samples=[];let rules;
for(let seed=1;seed<=30;seed++){
 const b=boot(17000+seed);b.run('A.start();drain();');
 rules||=JSON.parse(b.run('JSON.stringify(CONSORT_DISTINCTIONS.map(r=>({id:r.id,name:r.name,condition:r.why})))'));
 for(let batch=0;batch<100;batch++){
  b.run('genCands();');
  samples.push(...JSON.parse(b.run(`JSON.stringify(S.cands.map(c=>({looks:c.looks,talent:c.talent,virtue:c.virtue,scheme:c.scheme,hp:c.hp,trait:c.trait,
   raw:consortTraitMatches(c,{reveal:true}).map(r=>r.id),labels:consortTraitLabels(c,{reveal:true}).map(r=>r.id),visible:consortTraitLabels(c).slice(0,2).map(r=>r.id)})))`)));
 }
}
const pct=n=>Number((100*n/samples.length).toFixed(2)),distribution={};
for(const key of ['looks','talent','virtue','scheme','hp']){
 const values=samples.map(c=>c[key]).filter(Number.isFinite).sort((a,b)=>a-b);
 distribution[key]={present:values.length,missing:samples.length-values.length};
 if(values.length)Object.assign(distribution[key],{min:values[0],median:values[Math.floor(values.length*.5)],p90:values[Math.floor(values.length*.9)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)});
}
const medium=['pretty','quick','gentle','careful'];
console.log(JSON.stringify({samples:samples.length,seeds:30,batchesPerSeed:100,source:'Real genCands() with two opening consorts, no admissions, ageing or stat growth; seeds 17001–17030. Special story consorts excluded.',distribution,
 rules:rules.map(r=>({...r,rawPercent:pct(samples.filter(c=>c.raw.includes(r.id)).length),percent:pct(samples.filter(c=>c.labels.includes(r.id)).length)})),
 any:pct(samples.filter(c=>c.labels.length).length),visibleBeforeInquiry:pct(samples.filter(c=>c.visible.length).length),multiple:pct(samples.filter(c=>c.labels.length>1).length),maximum:Math.max(...samples.map(c=>c.labels.length)),
 rareOnly:pct(samples.filter(c=>c.raw.some(id=>!medium.includes(id)&&id!=='frail')).length)},null,2));
