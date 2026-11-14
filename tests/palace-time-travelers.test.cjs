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

const travelerFixture=`S.turn=120;var lady=harem()[1]||harem()[0];lady.enteredAt=0;lady.age=25;lady.talent=80;lady.scheme=80;lady.aff=80;lady.hp=80;lady.preg=0;initTimeTraveler(lady,true);delete lady.entryAdjustment;delete lady.kinArrival;`;
test('rare origins are seeded once, preserve personality and never roll during rendering',()=>{
 const {run,force}=boot();run(travelerFixture);run(`var trait=lady.trait,t=JSON.stringify(lady.timeTraveler);initTimeTraveler(lady);assert.equal(JSON.stringify(lady.timeTraveler),t);assert.equal(lady.trait,trait);var before=JSON.stringify(S);timeTravelerPanel(lady);timeTravelerVoice(lady);travelerPairCandidates();assert.equal(JSON.stringify(S),before);var count=0;for(let seed=1;seed<=1000;seed++){var c={id:seed,seed,age:20};if(initTimeTraveler(c))count++;}assert.ok(count>15&&count<65,count);var c={id:3,seed:1,age:20,travelerChecked:true};assert.equal(initTimeTraveler(c),null);assert.equal(initTimeTraveler({id:1,age:18,maid:true},true),null);`);force(.312);run(`timeTravelerPanel(lady);travelerConfessionEvent(lady);assert.equal(R(),.312);`);
});
test('careful women require a year and trust while rash women speak sooner without equating low literary skill to rashness',()=>{
 const {run}=boot();run(travelerFixture);run(`lady.aff=74;assert.equal(travelerReady(lady),false);assert.equal(timeTravelerVoice(lady),null);lady.aff=80;lady.enteredAt=S.turn-11;assert.equal(travelerReady(lady),false);lady.enteredAt--;assert.equal(travelerReady(lady),true);lady.trait='骄纵';lady.talent=20;lady.scheme=20;lady.aff=10;lady.enteredAt=S.turn-1;assert.equal(travelerReady(lady),true);assert.match(travelerConfessionText(lady),/越说越乱|话越乱/);lady.scheme=90;assert.equal(travelerRash(lady),false);assert.equal(travelerReady(lady),false);`);
});
test('direct conversation, pending save, belief and later memories form an idempotent sequence',()=>{
 const {run}=boot();run(travelerFixture);run(`E().energy=4;A.chat(lady.id);assert.equal(curEv.title,'灯下的来处');assert.equal(E().energy,3);assert.match(curEv.text,/AI|人工智能/);assert.match(curEv.text,/时空乱流/);var id=lady.id;save('1');A.load('1');lady=byId(id);assert.equal(curEv.title,'灯下的来处');var f=curEv.choices[0].f;assert.ok(f());var aff=lady.aff;assert.equal(f(),null);assert.equal(lady.aff,aff);drain();assert.equal(lady.timeTraveler.pending,null);assert.equal(lady.timeTraveler.spoken,1);assert.ok(NPCMemory.recall(S,lady.id).some(m=>m.type==='traveler-past'));assert.equal(travelerReady(lady),false);S.turn+=12;assert.equal(travelerReady(lady),true);assert.doesNotMatch(travelerConfessionText(lady),/我来自公元/);`);
});
test('disbelief and mockery permanently close disclosure despite later affection and save reloads',()=>{
 for(const mode of ['dream','mock']){const {run}=boot();run(travelerFixture);run(`pushEv(travelerConfessionEvent(lady));finishTravelerReply(lady,'${mode}');drain();var id=lady.id;save('1');load('1');lady=byId(id);S.turn+=120;lady.aff=100;assert.ok(lady.timeTraveler.closed);assert.equal(travelerReady(lady),false);assert.equal(travelerConfessionEvent(lady),null);assert.doesNotMatch(timeTravelerVoice(lady).lines.join(''),/世纪|人工智能|时空乱流/);assert.match(timeTravelerPanel(lady),/此后缄口/);`);}
});
test('custody requires another decision, excludes later meetings and remembers the injury after release',()=>{
 const {run}=boot();run(travelerFixture);run(`pushEv(travelerConfessionEvent(lady));choose(4);assert.equal(curEv.title,'收押前再问');assert.equal(lady.cold,false);choose(1);assert.equal(curEv.title,'灯下的来处');choose(4);choose(0);drain();assert.ok(lady.alive&&lady.cold&&lady.timeTraveler.closed);assert.equal(inPalace(lady),false);assert.equal(travelerPairCandidates().length,0);A.uncold(lady.id);lady.aff=100;S.turn+=120;assert.equal(travelerReady(lady),false);`);
});
test('temple prayer preserves origin, follows pregnancy and cost gates, and returns on schedule',()=>{
 const {run}=boot();run(travelerFixture);run(`lady.preg=2;pushEv(travelerConfessionEvent(lady));assert.equal(curEv.choices[5].cond(),false);lady.preg=0;E().treasury=9;assert.equal(curEv.choices[5].cond(),false);E().treasury=100;var t=lady.timeTraveler;choose(5);drain();assert.equal(E().treasury,90);assert.ok(lady.templeStay);assert.equal(lady.timeTraveler,t);assert.equal(travelerReady(lady),false);S.turn+=3;childTempleTick();assert.equal(lady.templeStay,undefined);assert.equal(lady.timeTraveler.century,t.century);assert.equal(travelerReady(lady),false);S.turn+=9;assert.equal(travelerReady(lady),true);`);
});
test('Daoist response resumes after reload and does not erase memories or assert possession',()=>{
 const {run}=boot();run(travelerFixture);run(`E().treasury=100;pushEv(travelerConfessionEvent(lady));choose(6);assert.equal(curEv.title,'国师问来处');assert.match(curEv.text,/不能只凭/);var id=lady.id;save('1');A.load('1');lady=byId(id);assert.equal(curEv.title,'国师问来处');var f=curEv.choices[0].f;assert.match(f(),/仍记得异世旧事/);assert.equal(E().treasury,90);assert.equal(f(),null);assert.equal(E().treasury,90);assert.equal(lady.timeTraveler.closed,false);drain();assert.equal(pendingTravelerEvent(),null);`);
});
const pairFixture=travelerFixture+`var other=harem().find(c=>c!==lady);initTimeTraveler(other,true);other.age=26;other.enteredAt=0;other.hp=90;other.preg=0;other.rank=4;other.palace=lady.palace;other.aff=80;other.timeTraveler.century=22;lady.timeTraveler.century=21;relAdd(lady,other,-relGet(lady,other));`;
test('recognition takes two spaced meetings, survives reload and accepts different centuries',()=>{
 const {run}=boot();run(pairFixture);run(`var pair=travelerPairCandidates()[0];assert.ok(pair);pushEv(travelerPairEvent(pair));assert.equal(curEv.title,'似曾听过的词');var key=pair.key;save('1');A.load('1');lady=byId(lady.id);other=byId(other.id);assert.equal(curEv.title,'似曾听过的词');choose(0);drain();assert.equal(S.flags.travelerPairs[key].stage,1);assert.equal(lady.timeTraveler.peers.length,0);assert.equal(travelerPairCandidates().length,0);S.turn+=6;pushEv(travelerPairEvent(travelerPairCandidates()[0]));assert.equal(curEv.title,'原来你也记得');assert.match(curEv.text,/年代隔得远/);var f=curEv.choices[0].f;assert.ok(f());assert.equal(f(),null);drain();assert.ok(lady.timeTraveler.peers.includes(other.id));assert.ok(other.timeTraveler.peers.includes(lady.id));assert.equal(relGet(lady,other),18);assert.ok(NPCMemory.recall(S,lady.id).some(m=>m.subject===String(other.id)));S.turn+=12;assert.equal(travelerPairEvent(travelerPairCandidates()[0]).title,'灯下说故乡');`);
});
test('women who stopped telling the emperor can still speak privately but do not reveal secrets when questioned',()=>{
 const {run}=boot();run(pairFixture);run(`lady.timeTraveler.closed=true;pushEv(travelerPairEvent(travelerPairCandidates()[0]));choose(1);drain();assert.equal(Object.values(S.flags.travelerPairs)[0].stage,0);assert.ok(lady.timeTraveler.closed);S.turn+=6;pushEv(travelerPairEvent(travelerPairCandidates()[0]));choose(0);drain();assert.equal(Object.values(S.flags.travelerPairs)[0].stage,1);assert.equal(travelerReady(lady),false);`);
});
test('separation, illness, hostility and stale callbacks cannot create an impossible meeting',()=>{
 const {run}=boot();run(pairFixture);run(`for(const key of ['cold','gone','templeStay']){other[key]=true;assert.equal(travelerPairCandidates().length,0);delete other[key];}other.hp=39;assert.equal(travelerPairCandidates().length,0);other.hp=90;relAdd(lady,other,-50);assert.equal(travelerPairCandidates().length,0);relAdd(lady,other,50);pushEv(travelerPairEvent(travelerPairCandidates()[0]));var f=curEv.choices[0].f;other.cold=true;assert.equal(f(),null);assert.equal(Object.values(S.flags.travelerPairs)[0].stage,0);Q.length=0;modalOpen=false;lady.alive=false;assert.equal(travelerConfessionEvent(lady),null);assert.equal(pendingTravelerEvent(),null);`);
});
test('palace-wide pacing and pending decisions prevent repeated monthly offers',()=>{
 const {run,force}=boot();run(travelerFixture);force(0,0);run(`var ev=travelerMonthlyEvent();assert.ok(ev);pushEv(ev);assert.equal(travelerMonthlyEvent(),null);choose(0);drain();S.turn+=5;assert.equal(travelerMonthlyEvent(),null);var t=JSON.stringify(lady.timeTraveler);travelerLifeTick();travelerLifeTick();assert.equal(JSON.stringify(lady.timeTraveler),t);`);
});
