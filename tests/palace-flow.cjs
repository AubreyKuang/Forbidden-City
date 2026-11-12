const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
// Stub drawing and storage to exercise the complete game script without a browser.
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop=()=>{};
const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})}, {get:(o,k)=>o[k]||noop});
const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,scrollIntoView:noop,remove:noop});
const elements=new Map();
const storage=new Map();
const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key)},createElement:el,addEventListener:noop};
const math=Object.create(Math);
let seed=98123;
let forcedRoll;
math.random=()=>{
  if(forcedRoll!==undefined){const roll=forcedRoll;forcedRoll=undefined;return roll;}
  return ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
};
const ctx=vm.createContext({Math:math,forceRoll:roll=>{forcedRoll=roll;},document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert});
vm.runInContext(src,ctx);
vm.runInContext(`
const drain = () => {
  for(let i=0;modalOpen && i<150;i++){
    if($('#mbox').innerHTML.includes('onclick="nextEv()"')) nextEv();
    else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
  }
  assert.equal(modalOpen,false,'modal queue drained');
};
assert.match($('#panel').innerHTML,/新开一局/);
A.newGame();assert.match($('#panel').innerHTML,/登基大典/);
A.start();assert.match($('#mbox').innerHTML,/登基/);drain();
for(const [key,name] of MENU.filter(([key])=>key!=='court')){A.go(key);assert.ok($('#panel').innerHTML.length,key)}
// A discarded monthly candidate must not block a later garden encounter.
forceRoll(.05);assert.ok(monthlyMaidEvent()?.maidEncounter);
assert.equal(S.flags.lastMaidEncounter,undefined);
forceRoll(.55);A.out('garden');assert.equal(curEv.title,'宫女');choose(2);drain();
const firstEncounter=S.turn;
assert.equal(S.flags.lastMaidEncounter,firstEncounter);
forceRoll(.55);A.out('garden');assert.equal(curEv.title,'御花园');drain();
S.turn+=3;A.save('1');A.load('1');
assert.equal(monthlyMaidEvent(),null);assert.equal(maidEvent('御花园'),null);
S.turn++;
forceRoll(.5);assert.equal(monthlyMaidEvent(),null);
forceRoll(.05);const nextEncounter=monthlyMaidEvent();assert.ok(nextEncounter?.maidEncounter);
pushEv(nextEncounter);choose(curEv.choices.length-1);drain();
assert.equal(S.flags.lastMaidEncounter-firstEncounter,4);
assert.equal(maidEvent('御花园'),null);
const initial=dowagerProposal(ensureDowager());pushEv(initial);assert.match($('#mbox').innerHTML,/太后荐人/);drain();
const elder=byId(initial.por.id);assert.ok(elder);
S.turn+=24;elder.age=25;
const later=dowagerProposal(ensureDowager());assert.ok(later);pushEv(later);
assert.match($('#mbox').innerHTML,/堂妹/);drain();
const younger=byId(later.por.id);assert.equal(elder.sur,younger.sur);assert.equal(elder.kin[younger.id],'堂妹');
const child=makeKid(elder,'m','承安');child.foster=younger.id;
A.go('consort',elder.id);assert.match($('#panel').innerHTML,/亲生皇子/);
A.save('1');const turn=S.turn;S.turn++;A.load('1');assert.equal(S.turn,turn);assert.ok(NPCMemory.recall(S,elder.id).length);
A.go('harem');assert.match($('#panel').innerHTML,/家族关系树/);
A.go('home');assert.match($('#panel').innerHTML,/朝堂势力/);
const beforeCourt=E().energy;A.courtPolicy('civil');assert.equal(E().energy,beforeCourt-1);
A.courtPolicy('army');assert.equal(E().energy,beforeCourt-1);
assert.equal(save('3'),true);S.turn++;assert.equal(save('3'),true);
localStorage.setItem(SKEY+'3','{invalid');A.load('3');assert.equal(S.turn,turn);
assert.equal(S.courtPolicyTurn,turn);assert.equal(S.flags.lastMaidEncounter,firstEncounter+4);
let lastMaid=S.flags.lastMaidEncounter;
const ambientTurns=new Map();
for(let i=0;i<60;i++){
  S.emp.health=100;S.emp.people=100;S.emp.treasury=1000;A.endMonth();drain();
  if(lastMaid!==S.flags.lastMaidEncounter){assert.ok(S.flags.lastMaidEncounter-lastMaid>=4);lastMaid=S.flags.lastMaidEncounter;}
  for(const [title,seenAt] of Object.entries(S.flags.ambientRecent)){
    if(seenAt!==S.turn)continue;
    assert.ok(seenAt-(ambientTurns.get(title)??-Infinity)>=4,title);
    ambientTurns.set(title,seenAt);
  }
}
assert.equal(S.turn,turn+60);
assert.ok(ambientTurns.size>0);
// The same court can play differently when a character's situation or education changes.
const actor=harem()[0]||makeGirl({trait:'温婉'});
S.consorts=[actor];actor.trait='温婉';actor.t2='嗜甜';actor.alive=true;actor.gone=false;actor.cold=false;actor.maid=false;
delete actor.initiative;delete actor.qcd;
S.flags.initiativeTurns={};E().health=70;E().energy=4;
const discardedQuirk=quirkEvent();assert.ok(discardedQuirk);assert.equal(actor.qcd,undefined);
initiativeTick();assert.equal(actor.initiative.id,'broth');assert.equal(E().health,71);
A.go('map');assert.match($('#panel').innerHTML,/送汤/);
A.go('consort',actor.id);assert.match($('#panel').innerHTML,/去向她道谢/);
A.answerInitiative(actor.id,false);assert.equal(E().energy,3);
assert.match($('#panel').innerHTML,/你已回应/);
A.answerInitiative(actor.id,false);assert.equal(E().energy,3);
const savedTurn=S.turn;A.load('auto');assert.equal(S.turn,savedTurn);
const reloaded=byId(actor.id);assert.ok(reloaded.initiative.response);
assert.ok(NPCMemory.recall(S,actor.id).some(m=>String(m.interpretation).includes('送汤')));
S.turn++;initiativeTick();assert.equal(currentInitiative(reloaded),null);
const student=makeKid(reloaded,'m','承学');student.born=S.turn-8*12;student.lit=35;student.policy='均衡';
S.children=[student];initiativeTick();assert.equal(currentInitiative(student),null);
A.kidPolicy(student.id,'读书');initiativeTick();assert.equal(student.initiative.id,'study');assert.equal(student.lit,36);
A.go('kid',student.id);assert.match($('#panel').innerHTML,/主动校书/);
console.log('PASS: ten panels, maid cooldown, dowager events, politics, backup saves, 60 months, character initiatives, education and persisted responses');
`,ctx,{timeout:15000});
