/* Design audit only: candidate labels are not installed in the game.
   Uses the real selection generator, including kin candidates and trait balancing. */
const {boot}=require('../tests/playtest-harness.cjs');
const rules=[
 ['沉鱼落雁','容貌 >90',c=>c.looks>90],
 ['咏絮之才','才情 ≥95',c=>c.talent>=95],
 ['才貌双绝','容貌 ≥85、才情 ≥90',c=>c.looks>=85&&c.talent>=90],
 ['蕙质兰心','德行 ≥90',c=>c.virtue>=90],
 ['深藏不露','心机 ≥90',c=>c.scheme>=90],
 ['赤子之心','心机 ≤10、德行 ≥75',c=>c.scheme<=10&&c.virtue>=75],
 ['书卷清芬','爱好读书、才情 ≥90',c=>c.hobby==='读书'&&c.talent>=90],
 ['琴心雅韵','爱好抚琴、才情 ≥90',c=>c.hobby==='抚琴'&&c.talent>=90],
 ['绣心巧手','巧手性格、爱好刺绣、才情 ≥85',c=>c.trait==='巧手'&&c.hobby==='刺绣'&&c.talent>=85],
 ['丹青妙笔','喜爱字画、才情 ≥90',c=>c.like==='字画'&&c.talent>=90],
 ['弓马娴熟','将门性格，且擅骑射或喜爱弓马',c=>c.trait==='将门'&&(c.t2==='擅骑射'||c.like==='弓马')],
 ['寒门明珠','明确出身寒门、才情 ≥90',c=>c.fam.t==='寒门'&&c.talent>=90],
 ['人淡如菊','淡泊性格、心机 ≤10、德行 ≥80',c=>c.trait==='淡泊'&&c.scheme<=10&&c.virtue>=80],
 ['玲珑心窍','才情 ≥90、心机 ≥70',c=>c.talent>=90&&c.scheme>=70]
];
const samples=[];
for(let seed=1;seed<=30;seed++){
 const b=boot(17000+seed);b.run('A.start();drain();');
 for(let batch=0;batch<100;batch++){
  b.run('genCands();');
  const candidates=b.run('JSON.stringify(S.cands)');
  samples.push(...JSON.parse(candidates));
 }
}
const pct=n=>Number((100*n/samples.length).toFixed(2));
const distribution={};
for(const key of ['looks','talent','virtue','scheme','hp']){
 const values=samples.map(c=>c[key]).filter(Number.isFinite).sort((a,b)=>a-b);
 distribution[key]={present:values.length,missing:samples.length-values.length};
 if(values.length)Object.assign(distribution[key],{min:values[0],median:values[Math.floor(values.length*.5)],p90:values[Math.floor(values.length*.9)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)});
}
const hits=samples.map(c=>rules.filter(([, ,test])=>test(c)).map(([name])=>name));
const baseline={looksOver85:pct(samples.filter(c=>c.looks>85).length),talentOver80:pct(samples.filter(c=>c.talent>80).length),virtueOver80:pct(samples.filter(c=>c.virtue>80).length),weakPersonality:pct(samples.filter(c=>c.trait==='体弱').length)};
console.log(JSON.stringify({samples:samples.length,seeds:30,batchesPerSeed:100,source:'Real genCands() with the two opening consorts, no admissions, ageing or stat growth; seeds 17001–17030. Special story consorts excluded.',distribution,baseline,rules:rules.map(([name,condition])=>({name,condition,count:hits.filter(tags=>tags.includes(name)).length,percent:pct(hits.filter(tags=>tags.includes(name)).length)})),any:pct(hits.filter(a=>a.length).length),multiple:pct(hits.filter(a=>a.length>1).length),maximum:Math.max(...hits.map(a=>a.length))},null,2));
