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

test('map arrival opens a portrait and dialogue; dossiers and back navigation do not greet again',()=>{
 const {run}=boot();run(`var c=harem()[0];c.palace='坤宁宫';E().energy=0;var aff=c.aff,visits=c.voiceVisits||0;
 A.go('consort',c.id);assert.equal(modalOpen,false);A.go('map');A.visitMapActivity('kn');
 assert.equal(curEv.scene,'palace-arrival');assert.equal(curEv.por,c);assert.match($('#mbox').innerHTML,/宫殿迎驾/);assert.equal(curEv.choices[0].cond(),false);
 assert.equal(E().energy,0);assert.equal(c.aff,aff);assert.equal(c.voiceVisits||0,visits);
 choose(curEv.choices.findIndex(x=>x.t==='查看她的详细信息'));assert.equal(UI.view,'consort');assert.equal(modalOpen,false);
 A.backPerson('harem');assert.equal(UI.view,'palace');assert.equal(modalOpen,false);
 A.go('map');A.visitMapActivity('kn');choose(curEv.choices.findIndex(x=>x.t==='看看宫中近况'));
 assert.equal(c.aff,aff);assert.equal(NPCMemory.recall(S,c.id).filter(m=>m.type==='palace-arrival').length,1);`);
});
test('shared residence lets the emperor greet another resident and talk through the existing action',()=>{
 const {run}=boot();run(`S.turn=30;var [a,b]=harem();a.palace=b.palace='翊坤宫';a.rank=6;b.rank=3;
 for(const c of [a,b]){delete c.entryAdjustment;delete c.kinArrival;delete c.timeTraveler;c.travelerChecked=true;}
 E().energy=3;A.visitMapActivity('p翊坤宫');assert.equal(curEv.por,a);assert.match($('#mbox').innerHTML,/同住此宫/);
 A.greetPalaceResident(b.id);assert.equal(curEv.por,b);choose(0);assert.equal(curEv.title,'闲话家常');assert.equal(E().energy,2);drain();assert.equal(UI.view,'palace');`);
});
test('empty, cold, departed and temple residences never produce a normal welcome',()=>{
 const {run}=boot();run(`for(const c of S.consorts)c.palace='坤宁宫';assert.equal(palaceArrivalEvent('翊坤宫'),null);
 var c=harem()[0];for(const key of ['cold','gone','templeStay']){c[key]=true;assert.ok(!palaceResidents('坤宁宫').includes(c));delete c[key];}
 assert.equal(palaceArrivalEvent('冷宫'),null);c.palace='翊坤宫';var ev=palaceArrivalEvent(c.palace);c.cold=true;assert.equal(eventStillValid(ev),false);`);
});
test('welcome follows pregnancy, grief, time together and strained affection without changing personality',()=>{
 const {run}=boot();run(`S.turn=150;var c=harem()[0];Object.assign(c,{trait:'骄纵',enteredAt:0,aff:90,favor:90,preg:4,voiceVisits:6,xin:{k:'平和',t:S.turn}});
 assert.equal(palaceWelcome(c).key,'pregnant');c.xin.k='悲恸';assert.equal(palaceWelcome(c).key,'grief');
 c.xin.k='平和';c.preg=0;assert.equal(palaceWelcome(c).key,'years-years');c.aff=10;assert.equal(palaceWelcome(c).key,'distance');
 var before=JSON.stringify(c);palaceWelcome(c);assert.equal(JSON.stringify(c),before);assert.equal(c.trait,'骄纵');`);
});
test('the most indiscreet travelers disclose their century during actual selection, just once',()=>{
 for(const century of [21,22]){const {run}=boot();run(`genCands(2);var c=S.cands[0];Object.assign(c,{age:20,trait:'活泼',talent:15,scheme:10});initTimeTraveler(c,true);c.timeTraveler.century=${century};
 var before=JSON.stringify(c);assert.match(selectionSpeech(c).line,/公元${century===21?'二十一':'二十二'}世纪/);assert.equal(JSON.stringify(c),before);
 A.go('xx');assert.ok(c.timeTraveler.selectionBlurted);assert.ok(c.timeTraveler.known);var records=c.timeTraveler.history.length;render();assert.equal(c.timeTraveler.history.length,records);
 var id=c.id;save('1');load('1');c=S.cands.find(p=>p.id===id);assert.ok(c.timeTraveler.selectionBlurted);A.xxTake(id);choose(1);drain();c=byId(id);
 assert.ok(c.timeTraveler.selectionBlurted);assert.match(travelerConfessionText(c),/选秀时那场失言/);`);}
});
test('low literary skill alone does not reveal a careful traveler in selection',()=>{
 const {run}=boot();run(`genCands(1);var c=S.cands[0];Object.assign(c,{age:20,trait:'活泼',talent:10,scheme:80});initTimeTraveler(c,true);
 A.go('xx');assert.equal(travelerSelectionBlurt(c),null);assert.equal(c.timeTraveler.known,false);assert.doesNotMatch(selectionSpeech(c).line,/世纪|人工智能/);
 c.scheme=10;c.trait='持重';assert.equal(travelerSelectionBlurt(c),null);c.trait='活泼';delete c.timeTraveler;assert.equal(travelerSelectionBlurt(c),null);`);
});
test('the selection disclosure threshold is reachable by ordinary generated candidates',()=>{
 const {run}=boot(713);run(`var found=false;for(var i=0;i<5000&&!found;i++){var c=makeGirl();initTimeTraveler(c);found=!!travelerSelectionBlurt(c);}assert.ok(found,'natural generation can produce an indiscreet traveler');`);
});
function swapCase(run,force){
 run(`S.turn=60;E().energy=10;E().treasury=500;var [m,a]=harem();m.preg=8;m.swapAsked=false;planBirthSwap(m,a,false);var k=makeKid(m,'f','明宁');`);
 force(0,0,0,0,0,0,0,0,0,0,0,0);
 run(`settleBirthSwap(m,k);k.birthSwap.originalSafe=false;S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();beginParentageInquiry(k);S.turn++;confirmBirthSwap(k);`);
}
test('child placement leads to separate adult justice and does not close the case',()=>{
 const {run,force}=boot();swapCase(run,force);run(`var f=()=>resolveBirthSwap(k,'family');assert.ok(f());assert.equal(curEv.title,'换婴案 · 问罪主使');
 assert.ok(parentagePanel(k).includes('审理换婴主使'));assert.ok(consortParentagePanel(a).includes('审理换婴主使'));
 assert.equal(f(),null);choose(0);drain();assert.ok(a.cold);assert.equal(a.rank,0);assert.ok(m.alive&&!m.cold);assert.ok(k.alive&&k.removedFromRoyal);
 assert.ok(!k.birthSwap.recovered);assert.ok(parentagePanel(k).includes('核对亲生孩子与寻亲'));assert.equal(resolveBirthSwapJustice(k,'cold'),null);`);
});
test('pending justice survives loading and punishment is applied once even after a duplicate callback',()=>{
 const {run,force}=boot();swapCase(run,force);run(`resolveBirthSwap(k,'keep');var id=k.id;save('1');A.load('1');k=kidById(id);a=byId(k.birthSwap.plotter);
 assert.equal(curEv.title,'换婴案 · 问罪主使');var f=curEv.choices[1].f;f();var rank=a.rank;assert.equal(f(),null);assert.equal(a.rank,rank);drain();assert.equal(pendingBirthSwapJustice(),null);`);
});
test('execution requires a second decision and never kills either child or the innocent mother',()=>{
 const {run,force}=boot();swapCase(run,force);run(`pushEv(birthSwapJusticeEvent(k));assert.equal(resolveBirthSwapJustice(k,'execute'),null);choose(2);
 assert.equal(curEv.title,'换婴案 · 赐死前复核');assert.ok(a.alive);choose(1);assert.ok(a.alive);assert.equal(curEv.title,'换婴案 · 问罪主使');choose(2);choose(0);drain();
 assert.equal(a.alive,false);assert.ok(m.alive&&k.alive);assert.equal(k.birthSwap.justice.decision,'execute');assert.ok(!k.birthSwap.recovered);`);
});
test('search has costs, saved progress and dated reports, and restores the real child only once',()=>{
 const {run,force}=boot();swapCase(run,force);run(`assert.match(birthSwapOriginalText(k),/确曾分娩/);assert.match(birthSwapOriginalText(k),/皇帝亲生/);
 E().energy=0;assert.equal(beginBirthSwapSearch(k),null);E().energy=10;E().treasury=14;assert.equal(beginBirthSwapSearch(k),null);E().treasury=100;
 var originalBorn=k.birthSwap.original.born;assert.ok(beginBirthSwapSearch(k));assert.equal(E().energy,9);assert.equal(E().treasury,85);assert.equal(beginBirthSwapSearch(k),null);
 var search=JSON.stringify(k.birthSwap.search),id=k.id;save('1');load('1');k=kidById(id);assert.equal(JSON.stringify(k.birthSwap.search),search);
 for(var n=0;n<3&&!k.birthSwap.recovered;n++){S.turn=k.birthSwap.search.due;var ev=birthSwapSearchReport();assert.ok(ev);var f=ev.choices[0].f;f();assert.equal(f(),null);if(!k.birthSwap.recovered)assert.ok(beginBirthSwapSearch(k));}
 assert.ok(k.birthSwap.recovered);var child=kidById(k.birthSwap.recovered);assert.equal(child.born,originalBorn);assert.equal(child.mom,m.id);assert.equal(child.birthTraits.father.kind,'emperor');
 var count=S.children.length;recoverOriginalChild(k,'再次核对');assert.equal(S.children.length,count);assert.equal(birthSwapSearchReport(),null);`);
});
test('paternity inquiry preserves a saved non-imperial father instead of inventing imperial blood',()=>{
 const {run,force}=boot();swapCase(run,force);run(`k.birthSwap.original.birthTraits.father={kind:'prince',id:999,name:'萧承钰',wen:80,wu:60};k.birthSwap.original.parentage={father:{kind:'prince',id:999,name:'萧承钰'},status:'hidden'};
 assert.match(birthSwapOriginalText(k),/萧承钰/);assert.doesNotMatch(birthSwapOriginalText(k),/确为皇帝亲生/);var original=recoverOriginalChild(k,'核实后寻回');assert.equal(original.parentage.status,'suspected');assert.equal(original.birthTraits.father.kind,'prince');`);
});
test('old resolved cases can still punish a living culprit or record a deceased culprit without rerolling',()=>{
 const {run,force}=boot();swapCase(run,force);run(`k.parentage.status='resolved';k.parentage.decision='keep';delete k.birthSwap.justice;
 assert.ok(birthSwapJusticeEvent(k));a.alive=false;assert.equal(birthSwapJusticeEvent(k).choices[0].t,'追记罪责，查办经手人');assert.ok(resolveBirthSwapJustice(k,'record'));
 assert.ok(m.alive);assert.ok(beginBirthSwapSearch(k));`);
});

