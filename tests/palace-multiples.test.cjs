const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const {runGameScripts}=require('./game-scripts.cjs');

// Same harness as palace-flow: run the whole game script with drawing and storage stubbed.
function boot(seedValue=4242){
  const noop=()=>{};
  const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(o,k)=>o[k]||noop});
  const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,scrollIntoView:noop,remove:noop});
  const elements=new Map(),storage=new Map();
  const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key)},createElement:el,addEventListener:noop};
  const math=Object.create(Math);let seed=seedValue;const rolls=[];
  math.random=()=>rolls.length?rolls.shift():((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,btoa,atob,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,force:(...values)=>rolls.push(...values),run:code=>vm.runInContext(code,ctx)};
}

const fixture=`function multipleFixture(topic,sexes){
 S.turn=240;S.year=21;S.month=6;S.children=[];S.consorts=[];S.rel={};S.flags.multipleBirthMoments={};
 var m=makeGirl({age:40,trait:'好学'});addConsort(m,8,'册立');Object.assign(m,{hp:90,preg:0,mood:80,aff:70,favor:70});
 var rule=MULTIPLE_MOMENTS.find(r=>r.id===topic);
 var composition=sexes||(topic==='three-branches'?'mff':topic==='paired-title'?'ff':'mf');
 var group=[...composition].map((sex,i)=>makeKid(m,sex,['承宁','清和','明昭'][i]));registerMultipleBirth(group);
 group.forEach((k,i)=>Object.assign(k,{born:S.turn-(rule?.min||0)*12,birthMonth:S.month,hp:85,lit:50,mar:45,vir:55,love:50,temperament:['好胜','内敛','仁厚'][i]}));
 if(topic==='letters')group[1].away=true;
 E().energy=8;E().treasury=100;return {m,group,k:group[0],rule};
}`;

for(const id of boot().run('MULTIPLE_MOMENTS.map(r=>r.id)'))for(const choice of [0,1])test(`${id} response ${choice}: whole cohort, memory, reload and once-only effects`,()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture(${JSON.stringify(id)}),k=f.k,group=f.group,rule=f.rule;
 assert.ok(multipleAvailable(k,rule));var before=JSON.stringify(S);var ev=multipleMomentEvent(k,rule.id);
 multipleBirthPanel(k);multipleLeads();multipleAt('ss');multipleVoice(k);assert.equal(JSON.stringify(S),before);
 assert.equal(ev.cast.filter(p=>p.sex).length,group.length);assert.ok(!/undefined|NaN/.test(ev.text));
 assert.ok(ev.choices[${choice}].cond());var energy=E().energy,treasury=E().treasury,relation=relGet(group[0],group[1]);
 var result=ev.choices[${choice}].f();assert.ok(result);assert.ok(!/undefined|NaN/.test(result));
 assert.equal(E().energy,energy-1);assert.equal(E().treasury,treasury-(rule.choices[${choice}].cost||0));
 assert.equal(relGet(group[0],group[1]),relation+rule.choices[${choice}].relation);
 assert.equal(ev.valid(),false);var after=JSON.stringify(S);assert.equal(ev.choices[${choice}].f(),null);assert.equal(JSON.stringify(S),after);
 for(var child of group){assert.ok(child.multipleMemory.text);assert.ok(child.story.at(-1).t.includes(rule.title));assert.ok(NPCMemory.recall(S,child.id).some(e=>e.type==='multiple-birth'));}
 var ids=group.map(p=>p.id);save('1');load('1');k=kidById(ids[0]);assert.equal(multipleState(k).seen[rule.id],S.turn);assert.equal(multipleState(k).history.length,1);
 for(var childId of ids)assert.ok(kidById(childId).multipleMemory.text);assert.equal(multipleMomentEvent(k,rule.id),null);
 S.turn+=6;assert.equal(multipleMomentEvent(k,rule.id),null);`);
});

test('seven specific composition tags keep birth order separate and consume no RNG',()=>{
 const {run,force}=boot();run(fixture);run(`for(var sexes of ['mm','ff','mf','mmm','fff','mmf','mff']){var f=multipleFixture('names',sexes),before=JSON.stringify(S);
  for(var k of f.group){assert.ok(multipleIdentity(k).name);assert.match(birthTags(k),new RegExp(multipleIdentity(k).name));assert.doesNotMatch(birthTags(k),/第.*出生|双胞胎/);}
  assert.equal(JSON.stringify(S),before);assert.equal(multipleMembers(f.k).length,sexes.length);}
 var f=multipleFixture('eldest','fm');assert.equal(multipleRelation(f.group[1],f.group[0]),'同生姐姐');assert.equal(multipleRelation(f.group[0],f.group[1]),'同生弟弟');`);
 force(.314159);run(`multipleBirthPanel(f.k);multipleVoice(f.k);multipleLeads();assert.equal(R(),.314159);`);
});
test('legacy cohorts migrate without inventing twins from matching birthdays',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('three-branches','mmf');f.group.forEach(k=>delete k.birthComposition);
 reconcileMultipleBirths();assert.ok(f.group.every(k=>k.birthComposition==='fmm'));var once=JSON.stringify(S);reconcileMultipleBirths();assert.equal(JSON.stringify(S),once);
 f.group[2].alive=false;assert.equal(multipleIdentity(f.k).name,'双龙伴凤');assert.match(multipleBirthPanel(f.k),/已故/);assert.equal(multipleAvailable(f.k,f.rule),false);
 S.children.splice(2,1);assert.equal(multipleIdentity(f.k).name,'双龙伴凤');assert.equal(multipleAvailable(f.k,f.rule),false);
 var lone=makeKid(f.m,'m','另外');lone.born=f.k.born;assert.equal(multipleIdentity(lone),null);
 f=multipleFixture('three-branches','mmf');S.children.splice(2,1);f.group.forEach(k=>delete k.birthComposition);reconcileMultipleBirths();assert.equal(multipleIdentity(f.k).name,'三曜同辉');`);
});
test('sex, cohort size, age and personality gates match dialogue',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('dragon-phoenix','ff');assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('paired-title','mf');assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('three-branches','ff');assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('comparison');f.group.forEach(k=>k.temperament='好奇');assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('names');f.group[1].born=S.turn;assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('eldest');delete f.group[1].birthOrder;assert.equal(multipleAvailable(f.k,f.rule),false);
 f=multipleFixture('paired-title','ff');f.k.temperament='自矜';assert.match(multipleMomentEvent(f.k,f.rule.id).text,/这句是我写的/);f.k.temperament='内敛';assert.match(multipleMomentEvent(f.k,f.rule.id).text,/那张……不是我的/);
 assert.equal(multipleMomentEvent(null,'names'),null);assert.equal(multipleMomentEvent(f.k,'bad-topic'),null);`);
});
test('stale cast, illness, exile, death and era changes cannot charge or reward',()=>{
 const {run}=boot();run(fixture);run(`for(var field of ['away','jailed','templeStay','removedFromRoyal','gone','pendingName']){var f=multipleFixture('paths'),ev=multipleMomentEvent(f.k,'paths');f.group[1][field]=true;var before=JSON.stringify(S);assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.equal(JSON.stringify(S),before);}
 var f=multipleFixture('paths'),ev=multipleMomentEvent(f.k,'paths');f.group[1].hp=20;assert.equal(ev.choices[0].f(),null);f.group[1].hp=85;assert.ok(ev.valid());f.group[1].alive=false;assert.equal(ev.valid(),false);
 f=multipleFixture('paths');ev=multipleMomentEvent(f.k,'paths');S.gen++;assert.equal(ev.valid(),false);
 f=multipleFixture('paths');ev=multipleMomentEvent(f.k,'paths');S.children=S.children.map(k=>({...k}));assert.equal(ev.valid(),false);
 f=multipleFixture('three-branches');ev=multipleMomentEvent(f.k,'three-branches');f.group[2].away=true;assert.equal(ev.valid(),false);`);
});
test('mother access, female Daoist and treasury apply to newborn blessing',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('auspice');S.flags.daoMaster=1;var ev=multipleMomentEvent(f.k,'auspice');assert.match(ev.text,/照尘/);assert.doesNotMatch(ev.text,/undefined/);
 E().treasury=0;assert.equal(ev.choices[0].f(),null);assert.equal(E().energy,8);E().treasury=100;
 f.m.cold=true;assert.equal(ev.valid(),false);f.m.cold=false;var foster=makeGirl();addConsort(foster,4,'入宫');f.group[1].foster=foster.id;f.group[1].visitRule='closed';assert.equal(ev.valid(),false);
 f=multipleFixture('auspice');ev=multipleMomentEvent(f.k,'auspice');assert.equal(childVoicePool(f.k)[0].key,'baby');ev.choices[0].f();assert.equal(childVoicePool(f.k)[0].key,'baby');`);
});
test('shared cooldown cannot be bypassed through sibling; deferral and low energy are free',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('comparison','ff'),ev=multipleMomentEvent(f.k,'comparison'),before=JSON.stringify(S);
 assert.equal(ev.choices.at(-1).f,undefined);assert.equal(JSON.stringify(S),before);E().energy=0;assert.equal(ev.choices[0].f(),null);E().energy=8;
 ev.choices[0].f();assert.equal(multipleMomentEvent(f.group[1],'paired-title'),null);S.turn+=6;assert.ok(multipleMomentEvent(f.group[1],'paired-title'));`);
});
test('birthday letters use correspondence and never require absent children to attend',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('letters');var ev=multipleMomentEvent(f.k,'letters');assert.equal(ev.present.length,0);assert.equal(ev.cast.length,2);assert.match(ev.text,/家书/);
 S.month=7;assert.equal(ev.valid(),false);S.month=6;f.group[1].jailed=true;assert.equal(ev.valid(),false);`);
});
test('revealed foundling loses claimed identity and recovered original reclaims cohort',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('paths'),k=f.k,sibling=f.group[1];
 var original=JSON.parse(JSON.stringify(k));k.birthSwap={occurred:true,confirmed:true,claimedMother:f.m.id,original};
 assert.equal(multipleIdentity(k),null);assert.equal(multipleMembers(sibling).length,1);assert.equal(multipleMomentEvent(sibling,'paths'),null);
 var found=recoverOriginalChild(k,'验明寻回');assert.ok(found.id!==k.id);assert.equal(multipleIdentity(found).name,'龙凤呈祥');assert.equal(multipleMembers(sibling).length,2);assert.ok(multipleMembers(sibling).includes(found));assert.ok(!multipleMembers(sibling).includes(k));
 assert.ok(multipleMomentEvent(found,'paths'));assert.ok(multipleLeads().some(l=>l.cast.includes(found)));assert.equal(recoverOriginalChild(k,'再查').id,found.id);`);
});
test('open sibling dialogue and completed result survive action-journal reload',()=>{
 const {run}=boot();run(fixture);run(`var f=multipleFixture('three-branches'),id=f.k.id;A.multipleTalk(id,'three-branches');assert.equal(curEv.title,'三枝都要有地方');
 A.save('1');A.load('1');assert.ok(!PalaceActions.blocked);assert.equal(curEv.title,'三枝都要有地方');assert.equal(curEv.cast.length,3);
 choose(0);var energy=E().energy;A.save('2');A.load('2');assert.ok(!PalaceActions.blocked);assert.equal(E().energy,energy);assert.equal(multipleState(kidById(id)).history.length,1);drain();`);
});

