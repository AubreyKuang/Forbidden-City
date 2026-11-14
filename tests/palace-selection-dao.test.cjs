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
test('selection audiences precede roster; performances, dismissal, rank and welcome persist',()=>{
 const {run}=boot();run(`genCands(3);var ids=S.cands.map(c=>c.id);assert.match(viewXX(),/秀女觐见/);A.xxPerform(ids[0]);var before=JSON.stringify(S);assert.match(viewXX(),/已看过才艺/);assert.equal(JSON.stringify(S),before);A.xxNext(ids[0]);assert.equal(selectionCurrent().id,ids[1]);A.xxNext(ids[1]);A.xxNext(ids[2]);assert.equal(selectionCurrent(),null);assert.match(viewXX(),/留牌子/);A.xxMeet(ids[0]);assert.match(viewXX(),/已看过才艺/);A.xxRoster();A.xxDrop(ids[2]);A.xxTake(ids[0]);var take=curEv.choices[1].f;take();assert.equal(S.consorts.filter(c=>c.id===ids[0]).length,1);assert.equal(take(),null);Q.length=0;modalOpen=false;var c=byId(ids[0]);assert.ok(!c.entryAdjustment.settled);save('1');assert.ok(load('1'));c=byId(ids[0]);var ev=newcomerWelcomeEvent(c);ev.choices[0].f();assert.equal(c.entryAdjustment.answer,'reassured');assert.equal(ev.choices[0].f(),null);assert.equal(newcomerWelcomeEvent(c),null);assert.ok(newcomerVoice(c));S.turn+=6;assert.equal(newcomerVoice(c),null);`);
});
test('discretion governs bold traits and new entrants never fabricate a favored cold consort',()=>{
 const {run}=boot();run(`var c=makeGirl({trait:'骄纵'});c.scheme=80;assert.equal(entryManner(c),'careful');c.scheme=10;assert.equal(entryManner(c),'bold');c.trait='温婉';c.talent=10;assert.equal(entryManner(c),'nervous');addConsort(c,2,'入宫');c.entryAdjustment={turn:S.turn,manner:'bold'};harem().filter(o=>o!==c).forEach(o=>{o.cold=true;o.favor=100;});assert.match(newcomerWelcomeEvent(c).text,/不好妄议圣意/);c.cold=true;assert.equal(newcomerWelcomeEvent(c),null);`);
});
test('selection and hall read paths neither mutate the save nor consume random rolls',()=>{
 const {run,force}=boot();run(`genCands(3);var before=JSON.stringify(S);for(let i=0;i<5;i++){viewXX();viewDaoHall();daoMaster();daoVisitors();}assert.equal(JSON.stringify(S),before);`);force(.3123);run(`viewXX();viewDaoHall();assert.equal(R(),.3123);`);
});
test('old selection saves and candidate removal remain navigable without a session',()=>{
 const {run}=boot();run(`genCands(2);delete S.selection;assert.ok(selectionCurrent());var id=selectionCurrent().id;A.xxNext(id);A.xxDrop(selectionCurrent().id);assert.ok(selectionCurrent());A.xxEnd();assert.equal(S.cands.length,0);assert.equal(S.selection,undefined);assert.match(viewXX(),/下旨选秀/);`);
});
test('Qinan Hall is a real hit target with guide, walk route and fixed male or female portrait',()=>{
 const {run}=boot();run(`var p=PLACES.find(p=>p.id==='qa');assert.equal(PLACES.find(x=>100>=x.r[0]&&100<=x.r[0]+x.r[2]&&18>=x.r[1]&&18<=x.r[1]+x.r[3]),p);assert.match(placeGuideHTML(p),/拜见国师/);for(let i=0;i<4;i++){S.flags.daoMaster=i;assert.equal(daoMaster().gender,i%2?'女':'男');assert.match(porImg(daoMaster(),190),/palace-daoist-portraits/);}save('1');load('1');assert.equal(daoMaster().cell,3);`);
});
test('visitors respect age, religion, confinement, absence, illness and pregnancy',()=>{
 const {run}=boot();run(`var c=harem()[0];c.trait='淡泊';c.t2='信佛';assert.equal(daoInterest(c),0);c.t2='直言';c.like='诗书';assert.equal(daoInterest(c),2);for(const field of ['cold','gone','templeStay']){c[field]=true;assert.equal(daoEligible(c),false);delete c[field];}c.preg=2;assert.equal(daoEligible(c),false);c.preg=0;c.hp=39;assert.equal(daoEligible(c),false);c.hp=70;var k=makeKid(c,'f','清和');k.born=S.turn-132;assert.equal(daoEligible(k),false);k.born=S.turn-156;assert.equal(daoEligible(k),true);k.princeEstate=true;assert.equal(daoEligible(k),true);delete k.princeEstate;for(const field of ['jailed','away','templeStay']){k[field]=true;assert.equal(daoEligible(k),false);delete k[field];}`);
});
test('visits are remembered once each month and regulars change speech without rewriting their personality',()=>{
 const {run}=boot();run(`var c=harem()[0];c.trait='淡泊';var original=c.trait;recordDaoVisit(c);recordDaoVisit(c);assert.equal(c.daoPractice.visits,1);S.turn++;recordDaoVisit(c);S.turn++;recordDaoVisit(c);assert.equal(c.daoPractice.visits,3);assert.ok(daoLifeVoice(c));assert.equal(c.trait,original);save('1');load('1');assert.equal(byId(c.id).daoPractice.visits,3);`);
});
test('a palace child asks about Yingzhou, remembers a promise, and completes only one coastal journey',()=>{
 const {run}=boot();run(`S.turn=240;var k=makeKid(harem()[0],'f','昭宁');k.born=S.turn-168;k.amb=10;for(let n=1;n<1000;n++){k.seed=n;k.daoPractice={path:'dao',visits:3,talks:(3-n%6+6)%6};if(daoVisitors().includes(k))break;}assert.equal(daoReading(k).title,'海客谈瀛洲');E().energy=5;E().treasury=500;var ev=daoConversation(k);assert.ok(ev);assert.match(ev.text,/烟涛微茫/);ev.choices[2].f();assert.equal(k.daoPractice.seaWish.status,'promised');var energy=E().energy;assert.equal(ev.choices[2].f(),null);assert.equal(E().energy,energy);A.daoSea(k.id);choose(0);assert.equal(curEv.title,'烟涛微茫');assert.equal(E().treasury,450);var id=k.id;save('1');A.load('1');k=kidById(id);assert.equal(curEv.title,'烟涛微茫');var finish=curEv.choices[0].f;finish();var lit=k.lit;assert.equal(finish(),null);assert.equal(k.lit,lit);assert.equal(k.daoPractice.seaWish.status,'fulfilled');assert.match(daoLifeVoice(k).lines[0],/潮声/);assert.equal(pendingDaoVoyage(),null);`);
});
test('teaching and rites recheck costs and palace-wide cooldowns, including duplicate callbacks',()=>{
 const {run}=boot();run(`E().energy=5;E().treasury=100;A.daoTeach();var f=curEv.choices[0].f;f();var e=E().energy;assert.equal(f(),null);assert.equal(E().energy,e);Q.length=0;modalOpen=false;A.daoRite();f=curEv.choices[0].f;f();assert.equal(E().treasury,80);assert.equal(f(),null);assert.equal(E().treasury,80);`);
});
function swapSetup(run){run(`S.turn=60;var m=harem()[0],a=harem()[1]||makeGirl();if(!S.consorts.includes(a))addConsort(a,2,'入宫');m.preg=8;m.swapAsked=false;planBirthSwap(m,a,false);var k=makeKid(m,'m','承宁');`);}
test('successful birth switch fixes outside parents and investigation never rerolls or punishes the victim',()=>{
 const {run,force}=boot();swapSetup(run);force(0,0,0,0,0,0,0,0,0,0,0);run(`settleBirthSwap(m,k);assert.ok(k.birthSwap.occurred);var actual=JSON.stringify(k.birthSwap);assert.equal(settleBirthSwap(m,k),false);assert.equal(JSON.stringify(k.birthSwap),actual);assert.equal(k.mom,m.id);assert.match(childFatherHTML(k),new RegExp(E().name));S.turn=k.birthSwap.clueDue;pushEv(birthSwapClueEvent());assert.equal(curEv.title,'襁褓上的旧结');assert.equal(k.parentage.status,'suspected');Q.length=0;modalOpen=false;E().energy=5;beginParentageInquiry(k);S.turn++;var ev=parentageVerdictEvent(k);assert.equal(ev.title,'换婴案 · 真相');ev.onShow();assert.ok(k.birthSwap.recovered);assert.equal(k.mom,k.birthSwap.externalMother.id);assert.equal(k.foster,m.id);assert.equal(k.birthTraits.father.kind,'outsider');assert.ok(!ev.choices.some(c=>c.t.includes('赐死生母')));assert.equal(resolveParentage(k,'execute',true),null);var count=S.children.length;confirmBirthSwap(k);assert.equal(S.children.length,count);assert.ok(m.alive);assert.ok(kidById(k.birthSwap.recovered).mom===m.id);for(const mode of ['graph','list']){UI.familyMode=mode;assert.match(viewFamily(),/宫外亲缘与收养/);assert.ok(viewFamily().includes(k.momName));}save('1');load('1');assert.equal(kidById(k.id).birthSwap.externalFather.name,k.birthSwap.externalFather.name);`);
});
test('failed attempt and added guards preserve both biological parents and clear the allegation',()=>{
 for(const guarded of [false,true]){const {run,force}=boot();swapSetup(run);run(`m.swapPlot.guarded=${guarded};var father=JSON.stringify(k.birthTraits.father);`);force(.99);run(`settleBirthSwap(m,k);assert.equal(k.birthSwap.occurred,false);S.turn=k.birthSwap.clueDue;var clue=birthSwapClueEvent();clue.onQueue();E().energy=3;beginParentageInquiry(k);S.turn++;var ev=parentageVerdictEvent(k);ev.onShow();ev.choices[0].f();assert.equal(k.parentage.decision,'cleared');assert.equal(k.mom,m.id);assert.equal(JSON.stringify(k.birthTraits.father),father);assert.match(childFatherHTML(k),new RegExp(E().name));assert.equal(k.removedFromRoyal,undefined);`);}
});
test('swapped child placement preserves the innocence of the claimed mother and authentic parents',()=>{
 for(const mode of ['keep','family','temple']){const {run,force}=boot();swapSetup(run);force(0,0,0,0,0,0,0,0,0,0,0);run(`settleBirthSwap(m,k);S.turn=k.birthSwap.clueDue;birthSwapClueEvent().onQueue();E().energy=3;beginParentageInquiry(k);S.turn++;parentageVerdictEvent(k).onShow();E().treasury=100;var result=resolveBirthSwap(k,'${mode}');assert.ok(result);assert.ok(m.alive&&!m.cold);assert.equal(resolveBirthSwap(k,'${mode}'),null);assert.equal(k.parentage.father.kind,'outsider');if('${mode}'==='keep')assert.ok(k.adoptedRoyal);else assert.ok(k.removedFromRoyal);if('${mode}'==='temple')assert.ok(k.templeStay);if('${mode}'==='family'){assert.equal(E().treasury,80);assert.equal(childWhereabouts(k),'宫外亲生父母家');}`);}
});
test('a pregnant mother resolved delivery records a switch once and reload cannot reroll it',()=>{
 const {run}=boot(811);swapSetup(run);run(`S.children=[];m.preg=10;birthEvent(m);var result=JSON.stringify(m.delivery);var id=m.id;var children=S.children.length;birthEvent(m);assert.equal(S.children.length,children);assert.equal(JSON.stringify(m.delivery),result);assert.ok(deliveryKids(m)[0].birthSwap);save('1');load('1');m=byId(id);assert.equal(JSON.stringify(m.delivery),result);assert.equal(parentageClueCandidates().includes(deliveryKids(m)[0]),false);`);
});

const secretFamily=`S.turn=300;S.year=26;S.month=3;S.consorts=[];S.children=[];
  E().sur='赵';E().energy=4;E().treasury=800;
  var mother=makeGirl({sur:'顾',given:'清徽',age:45,trait:'持重'});addConsort(mother,8,'册立');
  var lady=makeGirl({sur:'沈',given:'清和',age:24,trait:'好学'});addConsort(lady,5,'入宫');
  Object.assign(lady,{enteredAt:240,favor:10,aff:15,virtue:45,hobby:'读书',lastBirth:-99});
  var prince=makeKid(mother,'m','承安');Object.assign(prince,{born:36,lit:80,mar:60,vir:45});
  relAdd(prince,lady,35-relGet(prince,lady));openPrinceEstate(prince,false);
  var pair={key:prince.id+'-'+lady.id,prince:prince.id,consort:lady.id,stage:3,status:'concealed',known:true,pending:false,endedAt:294,place:'yh'};
  S.palaceRomance={gen:S.gen,pairs:{[pair.key]:pair},lastStart:250,lastScene:294};`;
const secretBaby=`lady.preg=1;lady.pregnancyFather={kind:'prince',id:prince.id,gen:S.gen,name:E().sur+prince.name,wen:80,wu:60,mother:lady.id,conceived:S.turn-9,pair:pair.key,princeAge:22,motherAge:24};
  var baby=makeKid(lady,'f','清嘉');lady.preg=0;delete lady.pregnancyFather;`;

// These tests exercise gameplay boundaries and durable outcomes, not just generated text.
