// Natural-play evidence: observers are display participants, never all people
// mentioned by a narrator. Gaps are review candidates, not automatic failures.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {boot}=require('./palace-random-play.cjs');
const out=process.env.PALACE_AUDIT_DIR||'/tmp/palace-personality-memory';
const modes=(process.env.PALACE_MODES||'balanced,affection,explorer,skip,random,relationships').split(',');
const seeds=(process.env.PALACE_SEEDS||'101,202,303,404').split(',').map(Number);
const months=Number(process.env.PALACE_MONTHS)||120;
fs.mkdirSync(path.join(out,'runs'),{recursive:true});
const summaries=[];
for(const mode of modes)for(const seed of seeds){
 const ctx=boot(seed,mode);
 vm.runInContext(`
 var auditChoices=[],auditOriginalChoose=choose;
 choose=function(...args){
  if(!PalaceActions.busy)return auditOriginalChoose(...args);
  const ev=curEv,choice=ev?.choices[args[0]];
  if(!ev||modalResult||!eventStillValid(ev)||!choice||choice.cond&&!choice.cond())return auditOriginalChoose(...args);
  const people=[...S.consorts,...S.children],before=new Map(people.map(p=>[p.id,{stories:p.story?.length||0,mem:NPCMemory.recall(S,p.id).length,trait:p.trait,t2:p.t2}]));
  const cast=eventPortraits(ev).filter(p=>p&&typeof p==='object'&&people.includes(p));
  const item={turn:S.turn,date:dateStr(),title:ev.title,choice:choice.t,hasEffect:!!choice.f,text:ev.text,actors:cast.map(p=>({id:p.id,name:p.sex?p.name:fullName(p),trait:p.trait,t2:p.t2,age:p.sex?kidAge(p):p.age,xin:p.sex?null:xinOf(p),alive:p.alive,cold:!!p.cold,gone:!!p.gone,temple:!!p.templeStay,homeLeave:!!p.homeLeave})),records:[]};
  const ret=auditOriginalChoose(...args);
  item.result=modalResult?.text||null;
  item.records=people.flatMap(p=>{const prior=before.get(p.id),entries=(p.story||[]).slice(prior.stories);return entries.length?[{id:p.id,name:p.sex?p.name:fullName(p),entries}]:[];});
  item.unrecorded=choice.f?cast.filter(p=>!(p.story||[]).slice(before.get(p.id).stories).some(e=>!e.t.startsWith('【心境'))).map(p=>p.id):[];
  item.personalityChanges=people.flatMap(p=>{const prior=before.get(p.id);return p.trait!==prior.trait||p.t2!==prior.t2?[{id:p.id,before:[prior.trait,prior.t2],after:[p.trait,p.t2]}]:[];});
  auditChoices.push(item);return ret;
 };`,ctx);
 const run=vm.runInContext(`play(${months})`,ctx,{timeout:240000});
 const evidence=vm.runInContext(`({choices:auditChoices,people:[...S.consorts,...S.children].map(p=>({id:p.id,name:p.sex?p.name:fullName(p),trait:p.trait,t2:p.t2,alive:p.alive,personalLife:p.personalLife,keepsakes:p.keepsakes,story:p.story,memories:NPCMemory.recall(S,p.id)}))})`,ctx);
 const summary={mode,seed,months:run.months.length,over:run.over||false,errors:run.errors,choices:evidence.choices.length,decisions:evidence.choices.filter(e=>e.hasEffect).length,eventTitles:[...new Set(evidence.choices.map(e=>e.title))],withActors:evidence.choices.filter(e=>e.actors.length).length,gapCandidates:evidence.choices.filter(e=>e.unrecorded.length).length,personalityChanges:evidence.choices.flatMap(e=>e.personalityChanges.map(p=>({title:e.title,...p}))),stateBytes:Buffer.byteLength(vm.runInContext('JSON.stringify(S)',ctx)),monthlyEvents:run.months.reduce((n,m)=>n+m.events,0),monthsWithoutEvents:run.months.filter(m=>!m.events).length};
 fs.writeFileSync(path.join(out,'runs',`${mode}-${seed}.json`),JSON.stringify({summary,...evidence},null,2));summaries.push(summary);
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summaries,null,2));console.log(JSON.stringify({mode,seed,months:summary.months,errors:summary.errors,choices:summary.choices,gapCandidates:summary.gapCandidates}));
}
