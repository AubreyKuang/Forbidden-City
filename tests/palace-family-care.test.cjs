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

test('mother invitation is visible at every rank, with explicit cooldown and visitor states',()=>{
  const {run}=boot();run(`var c=harem()[1];UI.sel=c.id;S.turn=30;
    for(var rank=0;rank<=8;rank++){c.rank=rank;delete c.lastVisit;delete c.visitor;assert.equal(momVisitState(c).ready,true);assert.match(viewConsort(),/接母亲入宫/);}
    c.rank=5;c.lastVisit=20;assert.equal(momVisitState(c).ready,false);assert.match(viewConsort(),/还需14个月/);
    S.turn=43;assert.equal(momVisitState(c).ready,false);S.turn=44;assert.equal(momVisitState(c).ready,true);
    var money=E().treasury;A.momIn(c.id);assert.equal(E().treasury,money-15);assert.ok(c.visitor);drain();
    assert.match(viewConsort(),/母亲在宫/);A.momIn(c.id);assert.equal(E().treasury,money-15);
    save('1');assert.ok(load('1'));c=byId(c.id);assert.ok(c.visitor);assert.equal(momVisitState(c).ready,false);`);
});
test('mother invitation rejects cold, departed, deceased, maid, missing and unaffordable targets without mutation',()=>{
  const {run}=boot();run(`var c=harem()[1];for(var patch of [{cold:true},{gone:true},{alive:false},{maid:true}]){
    var before={...c};Object.assign(c,patch);var money=E().treasury;A.momIn(c.id);assert.equal(E().treasury,money);assert.equal(c.visitor,undefined);Object.assign(c,before);delete c.maid;}
    A.momIn(-999);E().treasury=14;A.momIn(c.id);assert.equal(c.visitor,undefined);assert.match(momVisitButton(c),/国库不足/);
    E().treasury=15;c.lastVisit=null;assert.ok(momVisitState(c).ready);delete c.lastVisit;assert.ok(momVisitState(c).ready);`);
});
test('temple journeys work for sons and daughters of all ages and survive reload with automatic return',()=>{
  for(const sex of ['m','f'])for(const age of [0,8,20]){
    const {run}=boot();run(`var c=harem()[0],k=makeKid(c,'${sex}','安宁');k.born=S.turn-${age}*12;
      if(k.sex==='m'&&kidAge(k)>=18)openPrinceEstate(k,false);
      assert.ok(sendChildToTemple(k,{months:6}));assert.equal(childInPalace(k),false);assert.ok(childHasLeftPalace(k));
      assert.equal(templeEligible(k),false);assert.equal(youngChildMother(k),null);assert.equal(marriageEligible(k),false);assert.equal(schoolChildren().includes(k),false);
      assert.match(childTemplePanel(k),/护国寺/);assert.match(motherConcernPanel(c),/牵挂/);assert.ok(c.childConcern);
      var before=c.childConcern.value;S.turn++;childTempleTick();assert.ok(c.childConcern.value>before);var once=c.childConcern.value;childTempleTick();assert.equal(c.childConcern.value,once);
      save('1');load('1');k=kidById(k.id);c=byId(c.id);assert.ok(k.templeStay);
      S.turn=k.templeStay.due;childTempleTick();assert.equal(k.templeStay,undefined);
      assert.equal(childHasLeftPalace(k),k.sex==='m'&&kidAge(k)>=18);assert.ok(k.story.some(s=>/结束护国寺/.test(s.t)));`);
  }
});
test('peace letters soothe both mother and foster mother, are rate limited and cannot reach a dead child',()=>{
  const {run}=boot();run(`var [c,f]=harem(),k=makeKid(c,'f','昭宁');k.foster=f.id;sendChildToTemple(k,{months:12});
    assert.ok(c.childConcern);assert.ok(f.childConcern);var concern=c.childConcern.value,energy=E().energy;A.childPeaceLetter(c.id);
    assert.equal(E().energy,energy-1);assert.ok(c.childConcern.value<concern);assert.match(curEv.text,/乳母代报平安/);drain();
    A.childPeaceLetter(c.id);assert.equal(E().energy,energy-1);assert.ok(returnChildFromTemple(k));assert.equal(c.childConcern,undefined);assert.equal(f.childConcern,undefined);
    k.alive=false;assert.equal(sendChildToTemple(k),false);`);
});
test('adult princes in the capital are outside the palace after opening and legacy migration',()=>{
  const {run}=boot();run(`var c=harem()[0],son=makeKid(c,'m','承安'),baby=makeKid(c,'m','承宁'),girl=makeKid(c,'f','清嘉');
    son.born=S.turn-240;son.adult=true;girl.born=S.turn-240;migrate();
    assert.equal(childHasLeftPalace(son),true);assert.equal(childWhereabouts(son),'京中皇子府');assert.ok(childCanVisitCourt(son));
    assert.equal(childHasLeftPalace(baby),false);assert.equal(childHasLeftPalace(girl),false);
    UI.kidsResidence='out';assert.match(viewKids(),/承安/);assert.doesNotMatch(viewKids(),/承宁/);
    UI.kidsResidence='palace';assert.doesNotMatch(viewKids(),/承安/);assert.match(viewKids(),/承宁/);
    sendChildToTemple(son,{months:6});assert.equal(childCanVisitCourt(son),false);returnChildFromTemple(son);assert.equal(childWhereabouts(son),'京中皇子府');`);
});
test('secret conception is rare, once per month and only for eligible adults continuing a relationship',()=>{
  const {run,force}=boot();run(secretFamily);force(0,0);run(`palaceParentageTick();assert.equal(lady.preg,1);assert.equal(lady.pregnancyFather.id,prince.id);assert.equal(lady.pregnancyFather.princeAge,22);
    var saved=JSON.stringify(lady.pregnancyFather);palaceParentageTick();assert.equal(JSON.stringify(lady.pregnancyFather),saved);save('1');load('1');lady=byId(lady.id);assert.equal(JSON.stringify(lady.pregnancyFather),saved);`);
  for(const change of ["prince.born=S.turn-17*12;lady.age=18;lady.enteredAt=S.turn",'lady.cold=true','prince.templeStay={from:S.turn}','pair.status="ended"','lady.preg=3','lady.age=46']){
    const x=boot();x.run(secretFamily);x.run(change);x.force(0,0);x.run(`palaceParentageTick();assert.equal(lady.pregnancyFather,undefined);`);
  }
});
test('birth preserves the real father for every sibling and never reveals it before investigation',()=>{
  const {run,force}=boot();run(secretFamily);force(0,0);run(`palaceParentageTick();lady.preg=10;`);force(.01,.2,.8,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9,.9);
  run(`var event=birthEvent(lady),babies=deliveryKids(lady);assert.equal(babies.length,2);
    for(var k of babies){assert.equal(k.birthTraits.father.id,prince.id);assert.equal(k.birthTraits.father.wen,80);assert.equal(k.parentage.status,'suspected');assert.equal(childFatherHTML(k),'待查证');}
    assert.equal(lady.pregnancyFather,undefined);assert.equal(lady.preg,0);var ids=babies.map(k=>k.id);save('1');load('1');
    for(var id of ids)assert.equal(kidById(id).birthTraits.father.id,prince.id);`);
});
test('investigation requires records, waits a month and reveals a stable father with no reroll',()=>{
  const {run}=boot();run(secretFamily);run(secretBaby);run(`A.parentageInquiry(baby.id);assert.equal(curEv.title,'身世疑云');choose(1);assert.equal(curEv.title,'滴血验亲之议');assert.match(curEv.text,/不能据此断定骨肉/);
    choose(0);drain();assert.equal(baby.parentage.status,'investigating');assert.equal(parentageInquiryEvent(baby),null);
    var id=baby.id,father=JSON.stringify(baby.birthTraits.father);save('1');load('1');baby=kidById(id);S.turn++;A.parentageInquiry(id);
    assert.equal(curEv.title,'身世查证');assert.equal(baby.parentage.status,'confirmed');assert.match(childFatherHTML(baby),/赵承安/);assert.equal(JSON.stringify(baby.birthTraits.father),father);choose(4);drain();
    A.parentageInquiry(id);assert.equal(curEv.title,'身世查证');assert.equal(JSON.stringify(baby.birthTraits.father),father);`);
});
test('keeping, transferring and temple placement save distinct identities, memories and eligibility',()=>{
  for(const mode of ['keep','household','temple']){
    const {run}=boot();run(secretFamily);run(secretBaby);run(`baby.parentage.status='confirmed';baby.sex='m';baby.born=S.turn-84;S.heir=baby.id;
      assert.ok(resolveParentage(baby,'${mode}'));assert.equal(resolveParentage(baby,'${mode}'),null);
      assert.equal(baby.alive,true);assert.equal(lady.alive,true);assert.equal(baby.parentage.decision,'${mode}');
      if('${mode}'==='keep'){assert.equal(baby.removedFromRoyal,undefined);assert.equal(S.heir,baby.id);}
      else{assert.equal(S.heir,null);assert.equal(baby.removedFromRoyal,true);assert.equal(kidsAlive().includes(baby),false);assert.equal(marriageEligible(baby),false);assert.ok(lady.childConcern);A.kidHeir(baby.id);assert.equal(S.heir,null);}
      if('${mode}'==='household'){assert.ok(prince.recognizedChildren.includes(baby.id));assert.equal(childWhereabouts(baby),'生父皇子府');}
      if('${mode}'==='temple'){assert.ok(baby.templeStay);assert.equal(baby.templeStay.due,null);assert.equal(returnChildFromTemple(baby),false);}
      var id=baby.id;save('1');load('1');assert.equal(kidById(id).parentage.decision,'${mode}');`);
  }
});
test('execution needs its separate confirmation and clears heir and in-palace eligibility',()=>{
  const {run}=boot();run(secretFamily);run(secretBaby);run(`baby.parentage.status='confirmed';S.heir=baby.id;
    assert.equal(resolveParentage(baby,'execute'),null);assert.ok(baby.alive&&lady.alive);
    pushEv(parentageVerdictEvent(baby));choose(3);assert.equal(curEv.title,'赐死前复核');assert.ok(baby.alive&&lady.alive);choose(1);assert.equal(curEv.title,'身世查证');assert.ok(baby.alive&&lady.alive);
    choose(3);choose(0);assert.equal(baby.alive,false);assert.equal(lady.alive,false);assert.equal(S.heir,null);assert.equal(childInPalace(baby),false);assert.equal(baby.deathReason,'奉旨赐死');drain();
    UI.sel=baby.id;assert.match(viewKid(),/奉旨赐死/);assert.doesNotMatch(viewKid(),/已夭折/);`);
});
test('birth advice is one-time, does not overwrite good omens and does not blame an infant for disaster',()=>{
  const {run,force}=boot();run(`var c=harem()[0],k=makeKid(c,'f','明宁');k.hp=52;`);force(0);run(`assert.equal(rollBirthTempleAdvice([k],null),k.id);assert.equal(k.birthTrouble,'frail');assert.equal(rollBirthTempleAdvice([k],null),null);
    pushEv(birthTempleAdviceEvent(k));assert.match(curEv.text,/不作剃度/);choose(2);drain();assert.equal(k.templeStay,undefined);assert.ok(k.templeAdviceHandled);assert.equal(birthTempleAdviceEvent(k),null);
    S.turn+=40;assert.equal(rollBirthTempleAdvice([k],'red'),null);`);
  for(const kind of ['quake','drought']){const x=boot();x.run(`var c=harem()[0],k=makeKid(c,'m','承宁');k.birthTrouble='${kind}';pushEv(birthTempleAdviceEvent(k));choose(0);drain();assert.ok(k.templeStay);assert.ok(c.childConcern);assert.ok(k.templeAdviceHandled);`);}
});
test('wife and concubine can conceive in the same dated month and deliver independently',()=>{
  const {run}=boot();run(secretFamily);run(`prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-24};var h=ensureMarriedLife(prince);prince.spouse.trust=80;
    var concubine={...marriageCandidate(prince,'household'),id:'concubine-test',joinedAt:S.turn-6,alive:true,trust:80};h.concubines.push(concubine);S.turn+=3;
    assert.ok(startHouseholdPregnancy(prince,prince.spouse));assert.ok(startHouseholdPregnancy(prince,concubine));assert.equal(h.pregnancies.length,2);
    assert.equal(startHouseholdPregnancy(prince,prince.spouse),false);assert.equal(startHouseholdPregnancy(prince,concubine),false);
    assert.ok(h.history.some(e=>/同月.*妾室.*亦有喜/.test(e.t)));assert.ok(h.history.every(e=>e.d===dateStr()));assert.match(householdPanel(prince),/正妻.*有孕/);assert.match(householdPanel(prince),/妾室.*有孕/);
    var id=prince.id;save('1');load('1');prince=kidById(id);h=prince.household;assert.equal(h.pregnancies.length,2);
    sendChildToTemple(prince,{months:12});S.turn+=9;marriedLifeTick();assert.equal(h.children.length,2);assert.equal(h.pregnancies.length,0);
    assert.equal(h.children[0].father,prince.id);assert.notEqual(h.children[0].mother,h.children[1].mother);assert.equal(startHouseholdPregnancy(prince,prince.spouse),false);
    returnChildFromTemple(prince);assert.equal(startHouseholdPregnancy(prince,prince.spouse),false);`);
});
test('ordinary details have no send-to-temple action; visiting the temple offers both rosters',()=>{
  const {run}=boot();run(`var lady=harem()[1],child=makeKid(lady,'f','明宁');child.born=S.turn-96;UI.sel=child.id;
    assert.equal(childTemplePanel(child),'');assert.doesNotMatch(viewKid(),/送往护国寺|onclick="A.kidTemple/);
    A.out('temple');assert.equal(curEv.title,'护国寺祈福');assert.ok(curEv.choices.some(c=>c.t==='安排妃嫔来祈福或清修'));choose(0);
    assert.equal(curEv.title,'护国寺 · 皇嗣祈福');choose(curEv.choices.findIndex(c=>c.person?.id===child.id));assert.equal(curEv.title,'护国寺祈福');choose(0);drain();
    assert.ok(child.templeStay);assert.match(childTemplePanel(child),/接回宫中/);assert.ok(lady.childConcern);`);
});
test('consort temple residence preserves rank and palace, excludes palace encounters and can end early or on time',()=>{
  const {run}=boot();run(`var queen=empress(),rank=queen.rank,palace=queen.palace,child=makeKid(queen,'m','承宁');
    assert.ok(sendConsortToTemple(queen,3));assert.equal(inPalace(queen),false);assert.equal(harem().includes(queen),false);assert.equal(empress(),queen);assert.equal(rankCount(8),1);
    assert.equal(banquetKind('empress'),null);assert.doesNotMatch(consortCard(queen),new RegExp(palace));assert.match(consortCard(queen),/护国寺/);
    assert.equal(queen.rank,rank);assert.equal(queen.palace,palace);assert.equal(youngChildMother(child),null);assert.ok(queen.childConcern);
    var energy=E().energy;A.night(queen.id);A.chat(queen.id);assert.equal(E().energy,energy);assert.ok(queen.alive);
    UI.sel=queen.id;assert.match(viewConsort(),/寺中清修/);assert.doesNotMatch(viewConsort(),/召幸侍寝|接母亲入宫/);assert.match(viewHarem(),/寺中修行/);
    save('1');load('1');queen=byId(queen.id);assert.ok(queen.templeStay);S.turn=queen.templeStay.due;childTempleTick();assert.ok(inPalace(queen));assert.equal(queen.templeStay,undefined);
    assert.ok(banquetKind('empress'));assert.ok(sendConsortToTemple(queen,null));
    child=kidById(child.id);var mood=queen.mood;assert.ok(sendChildToTemple(child,{months:6}));assert.ok(queen.mood>=mood);assert.equal(queen.childConcern,undefined);
    assert.ok(returnConsortFromTemple(queen));assert.equal(queen.templeStay,undefined);assert.ok(queen.childConcern);
    queen.preg=2;assert.equal(sendConsortToTemple(queen,3),false);queen.preg=0;queen.cold=true;assert.equal(sendConsortToTemple(queen,3),false);`);
});
