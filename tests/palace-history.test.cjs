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
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,force:(...values)=>rolls.push(...values),run:code=>vm.runInContext(code,ctx)};
}

// Concrete casts, including real mothers, friends, rivals, gifts and sick children.
const fixture=`function historyFixture(id){
 S.turn=240;S.year=21;S.month=6;S.children=[];S.consorts=[];S.rel={};
 E().energy=8;E().treasury=300;S.flags.livingHistoryPace=null;
 var c=makeGirl({age:40,trait:'持重'});addConsort(c,8,'册立');
 var o=makeGirl({age:30,trait:'温婉'});addConsort(o,4,'入宫');
 for(var q of [c,o])Object.assign(q,{hp:80,aff:70,favor:70,mood:80,talent:70,preg:0,xin:{k:'平和'}});
 c.fam.p=80;
 var k=makeKid(c,'f','清宁'),s=makeKid(o,'m','承远');
 for(var q of [k,s])Object.assign(q,{born:S.turn-12*12,hp:80,lit:60,mar:60,vir:60,amb:45,love:60,temperament:'好奇'});
 s.mar=65;
 var rule=LIVING_STORIES.find(r=>r.id===id),p=rule.kind==='child'?k:c,other=rule.other?(rule.other.kind==='child'?(rule.kind==='child'?s:k):o):null;
 var traits={'ma-cloth':'淡泊','bian-choice':'贪财','ban-catalog':'好学','xu-building':'爽直','gu-meal':'好客','snow-friend':'沉静','old-gift':'痴情','movable-type':'巧手','ma-family':'城府','source-margins':'城府','charcoal-ledger':'贪财','rival-flowers':'善妒'};
 c.trait=traits[id]||'持重';
 var kids={'bitter-plum':[8,'好奇'],'boat-weight':[8,'好奇'],'saddle-mercy':[12,'仁厚'],'yuanfang-promise':[8,'爽直'],'mat-friends':[12,'自矜'],'archery-loss':[12,'好胜'],'teacher-seat':[7,'审慎'],'princess-campaign':[14,'爽直'],'compass-doubt':[13,'好奇'],'friend-sick':[11,'仁厚'],'small-promise':[4,'内敛'],'repair-toy':[8,'灵动'],'shared-credit':[12,'自矜']};
 if(kids[id]){k.born=S.turn-kids[id][0]*12;k.temperament=kids[id][1];s.born=k.born;}
 if(rule.months)S.month=rule.months[0];
 if(id==='snow-friend')relAdd(c,o,30-relGet(c,o));
 if(id==='rival-flowers')relAdd(c,o,-20-relGet(c,o));
 if(id==='old-gift'){S.turn-=24;remember(c,'gift','字画');S.turn+=24;}
 if(id==='mat-friends')relAdd(k,s,-relGet(k,s));
 if(id==='friend-sick'){s.hp=35;relAdd(k,s,30-relGet(k,s));}
 if(id==='shared-credit')relAdd(k,s,10-relGet(k,s));
 assert.ok(historyEligible(p,rule),id+' concrete cast must match');
 return {p,other,rule,k,s,c,o};
}`;

const ids=boot().run('LIVING_STORIES.map(r=>r.id)');
for(const id of ids)for(const choice of [0,1])test(`${id}: choice ${choice+1} survives reload, pays once and keeps its own aftermath`,()=>{
 const {run}=boot();run(fixture);run(`var f=historyFixture(${JSON.stringify(id)}),p=f.p,o=f.other,r=f.rule;
  assert.ok(offerHistory(p,r,o));var ev=historyEvent(p),oldEnergy=E().energy,oldMoney=E().treasury;
  assert.ok(ev.valid());assert.ok(ev.choices[${choice}].cond());
  assert.equal(ev.refURL,LIVING_SOURCES[r.source].url);assert.ok(!/undefined|NaN/.test(ev.text));
  var html=historyPanel(p);assert.match(html,/走近听听/);assert.ok(historyAt(r.place).includes(r.title));assert.ok(historyLeads().some(x=>x.person===p));
  var before=JSON.stringify(S);historyPanel(p);historyAt(r.place);historyLeads();historyEvent(p);assert.equal(JSON.stringify(S),before);
  var result=ev.choices[${choice}].f();assert.ok(result);assert.ok(!/undefined|NaN/.test(result));
  assert.equal(E().energy,oldEnergy-1);assert.equal(ev.valid(),false);var once=JSON.stringify(S);
  assert.equal(ev.choices[${choice}].f(),null);assert.equal(JSON.stringify(S),once);assert.equal(ev.choices.at(-1).f(),null);
  assert.equal(E().treasury,oldMoney-(r.choices[${choice}].cost||0)+(r.choices[${choice}].court?.treasury||0));
  assert.ok(historyScene(p),'changing relations or skills must not cancel later story');assert.equal(historyEvent(p),null);
  var pid=p.id,oid=o?.id;save('1');assert.ok(load('1'));p=historyPerson(pid);o=historyPerson(oid);
  assert.equal(p.livingHistory.current.choice,${choice});assert.equal(historyEvent(p),null);S.turn=p.livingHistory.current.due;
  var after=historyEvent(p);assert.ok(after);assert.match(after.title,/后来/);assert.equal(after.text,historyText(r.choices[${choice}].later,p,o));
  var energy=E().energy;assert.ok(after.choices[0].f());assert.equal(after.choices[0].f(),null);assert.equal(E().energy,energy);
  assert.equal(p.livingHistory.current,undefined);assert.equal(p.livingHistory.history.length,1);assert.ok(NPCMemory.recall(S,p.id).some(m=>m.type==='living-history'));
  if(o)assert.ok(NPCMemory.recall(S,o.id).some(m=>m.type==='living-history'));
  assert.equal(historyVoice(p).lines[0],historyText(r.choices[${choice}].memory,p,o));assert.equal(offerHistory(p,r,o),false);
  save('1');load('1');p=historyPerson(pid);assert.equal(p.livingHistory.history.length,1);assert.equal(p.livingHistory.current,undefined);`);
});

test('dispositions remain fixed across education, legacy migration and repeated rendering',()=>{
 const {run,force}=boot();run(fixture);run(`var {k}=historyFixture('boat-weight');delete k.temperament;var key=childDisposition(k),snapshot=JSON.stringify(S);
  for(var i=0;i<8;i++){childDispositionPanel(k);childDispositionVoice(k);characterVoice(k);assert.equal(childDisposition(k),key);}
  assert.equal(JSON.stringify(S),snapshot);k.policy='武艺';k.lit=100;k.mar=0;ensureChildDisposition(k);assert.equal(k.temperament,key);
  var pid=k.id;save('1');load('1');k=kidById(pid);assert.equal(k.temperament,key);
  var lines=new Set();for(var t of Object.keys(CHILD_DISPOSITIONS)){k.temperament=t;for(var a of [4,8,15]){k.born=S.turn-a*12;lines.add(childDispositionVoice(k).lines[0]);}}
  assert.equal(lines.size,24);k.born=S.turn;assert.equal(characterVoice(k).key,'baby');k.born=S.turn-96;k.hp=20;assert.equal(characterVoice(k).key,'ill');`);
 force(.314);run(`childDisposition(k);historyLeads();assert.equal(R(),.314);`);
});
test('age, gender, role, family access and actual memories constrain invitations',()=>{
 const {run}=boot();run(fixture);run(`var f=historyFixture('princess-campaign');f.p.sex='m';assert.equal(historyEligible(f.p,f.rule),false);f.p.sex='f';f.p.born=S.turn-11*12;assert.equal(historyEligible(f.p,f.rule),false);
  f=historyFixture('silk-lesson');f.c.rank=7;assert.equal(historyEligible(f.c,f.rule),false);f.c.rank=8;f.k.mom=f.o.id;assert.equal(historyEligible(f.c,f.rule),false);f.k.foster=f.c.id;assert.ok(historyEligible(f.c,f.rule));
  f=historyFixture('old-gift');S.npcMemory={version:2,sequence:0,events:{},people:{}};assert.equal(historyEligible(f.p,f.rule),false);
  f=historyFixture('boat-weight');for(var field of ['away','estate','jailed','removedFromRoyal','pendingName']){f.k[field]=true;assert.equal(historyEligible(f.k,f.rule),false);delete f.k[field];}
  f.k.hp=20;assert.equal(historyEligible(f.k,f.rule),false);`);
});
test('a recovering friend is referenced without being required at the school gathering',()=>{
 const {run}=boot();run(fixture);run(`var f=historyFixture('friend-sick');assert.equal(f.other.hp,35);offerHistory(f.p,f.rule,f.other);var ev=historyEvent(f.p);assert.equal(ev.present.length,1);assert.equal(ev.present[0],f.p);assert.equal(ev.cast.length,2);`);
});
test('stale invitations cannot charge or act on an absent or substituted person',()=>{
 const {run}=boot();run(fixture);run(`var f=historyFixture('mat-friends');offerHistory(f.p,f.rule,f.other);var ev=historyEvent(f.p),before=E().energy;
  f.other.templeStay={due:S.turn+3};assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.equal(E().energy,before);
  delete f.other.templeStay;assert.ok(ev.valid());f.other.alive=false;assert.equal(historyScene(f.p),null);historyTick();assert.equal(f.p.livingHistory.current,undefined);
  f=historyFixture('mat-friends');offerHistory(f.p,f.rule,f.other);chooseHistory(f.p,1);f.other.templeStay={due:S.turn+6};S.turn+=2;assert.equal(historyEvent(f.p),null);
  save('1');load('1');var p=historyPerson(f.p.id),o=historyPerson(f.other.id);delete o.templeStay;assert.ok(historyEvent(p));`);
});
test('decline, wait, insufficient funds and expiry cause no accidental rewards',()=>{
 const {run}=boot();run(fixture);run(`var f=historyFixture('princess-campaign');offerHistory(f.p,f.rule);var ev=historyEvent(f.p),before=JSON.stringify(S);assert.equal(ev.choices[2].f,undefined);assert.equal(JSON.stringify(S),before);
  E().energy=0;assert.equal(ev.choices[0].cond(),false);assert.equal(chooseHistory(f.p,0),null);E().energy=4;E().treasury=0;assert.equal(chooseHistory(f.p,0),null);
  var love=f.p.love;ev.choices[3].f();assert.equal(f.p.love,love);assert.equal(historyVoice(f.p),null);
  f=historyFixture('boat-weight');offerHistory(f.p,f.rule);var current=f.p.livingHistory.current;S.turn+=6;historyTick();assert.notEqual(f.p.livingHistory.current,current);assert.equal(f.p.livingHistory.seen['boat-weight'],S.turn);
  f=historyFixture('mat-friends');offerHistory(f.p,f.rule,f.other);f.other.temperament='好奇';assert.equal(offerHistory(f.other,LIVING_STORIES.find(r=>r.id==='boat-weight')),false);`);
});
test('school event prose fits young pupils and quiet children do not become generic troublemakers',()=>{
 const {run,force}=boot();run(fixture);run(`var f=historyFixture('boat-weight');S.children=[f.k];f.k.born=S.turn-6*12;f.k.sick=S.turn;f.k.temperament='内敛';f.k.lit=60;`);
 force(...Array(15).fill(0));run(`var ev=kidEvent();assert.equal(ev.title,'上书房');assert.ok(!/策论|汉纪一卷|一年/.test(ev.text));`);
 run(`f.k.lit=10;`);force(...Array(15).fill(0));run(`assert.equal(kidEvent(),null);`);
});

test('monthly discovery is paced, optional, and shared participants never get double-booked',()=>{
 const {run,force}=boot();run(fixture);force(.314);run(`historyFixture('boat-weight');`);force(.2718);run(`var beforeQueue=Q.length;historyTick();assert.equal(R(),.2718);
  assert.equal(historyPeople().filter(p=>p.livingHistory?.current).length,1);assert.equal(Q.length,beforeQueue);
  assert.equal(S.flags.livingHistoryPace.last,S.turn);var first=JSON.stringify(S.flags.livingHistoryPace);historyTick();assert.equal(JSON.stringify(S.flags.livingHistoryPace),first);
  S.turn+=2;historyTick();assert.equal(historyPeople().filter(p=>p.livingHistory?.current).length,1);
  S.turn+=1;historyTick();assert.ok(historyPeople().filter(p=>p.livingHistory?.current).length<=2);
  var booked=historyPeople().flatMap(p=>p.livingHistory?.current?[p.id,p.livingHistory.current.other].filter(x=>x!=null):[]);assert.equal(new Set(booked).size,booked.length);
  var f=historyFixture('silk-lesson');offerHistory(f.p,f.rule,f.other);chooseHistory(f.p,0);S.turn+=2;f.p.rank=4;assert.equal(historyEvent(f.p),null);f.p.rank=8;assert.ok(historyEvent(f.p));
  f.other.foster=f.o.id;f.other.visitRule='closed';assert.equal(historyEvent(f.p),null);`);
});

