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

// These tests exercise gameplay boundaries and durable outcomes, not just generated text.
test('all six ornaments transfer exactly once, preserve original art IDs and survive saves',()=>{
 const {run}=boot();run(`var c=harem()[1],v=ensureJewelry(),art=c.artPortrait;for(var id of Object.keys(JEWELRY)){v.stock[id]=2;assert.ok(grantJewelry(c,id));assert.equal(v.stock[id],1);assert.equal(grantJewelry(c,id),false);assert.equal(v.stock[id],1);assert.equal(c.artPortrait,art);assert.match(porImg(c),new RegExp('data-portrait-jewelry="'+id+'"'));}
  var person=c.id;save('1');load('1');c=byId(person);assert.equal(c.jewelry.length,6);assert.equal(jewelryWorn(c),'jade');A.jewelryWear(c.id,'');assert.equal(jewelryWorn(c),'');assert.equal(c.artPortrait,art);assert.ok(portraitJewelry(8,'').name.includes('凤'));`);
});
test('gifts reject empty stock, invalid items and people who cannot receive them',()=>{
 const {run}=boot();run(`var c=harem()[1],v=ensureJewelry();assert.equal(grantJewelry(c,'none'),false);assert.equal(grantJewelry(c,'phoenix'),false);for(var key of ['cold','gone','maid']){c[key]=true;assert.equal(grantJewelry(c,'peony'),false);delete c[key];}c.alive=false;assert.equal(grantJewelry(c,'peony'),false);assert.equal(v.stock.peony,1);`);
});
test('tribute receives stock once and requests honor palace and person intervals',()=>{
 const {run,force}=boot();run(`S.turn=24;S.month=1;ensureJewelry().lastTribute=0;`);force(0,0);run(`var ev=jewelryTributeEvent();assert.ok(ev);ev.onQueue();var before=Object.values(ensureJewelry().stock).reduce((s,n)=>s+n,0);ev.choices[0].f();ev.choices[0].f();assert.equal(Object.values(ensureJewelry().stock).reduce((s,n)=>s+n,0),before+1);assert.equal(jewelryTributeEvent(),null);
 var c=harem()[1];Object.assign(c,{trait:'骄纵',mood:80,favor:80});`);force(0,0,0);run(`ev=jewelryRequestEvent();assert.ok(ev);ev.onQueue();assert.equal(jewelryRequestEvent(),null);ev.choices[0].f();assert.equal(c.jewelry.length,1);S.turn+=12;assert.equal(jewelryRequestEvent(),null);`);
});
test('speech changes with acquaintance and years, without treating age as trust',()=>{
 const {run,force}=boot();run(`var c=harem()[1];Object.assign(c,{enteredAt:0,aff:70,favor:70,voiceVisits:0,xin:{k:'平和'}});S.turn=0;var first=characterVoice(c);assert.equal(first.key,'years-first');S.turn=12;assert.equal(consortVoicePhase(c),'settling');c.voiceVisits=4;assert.equal(consortVoicePhase(c),'familiar');var close=characterVoice(c);assert.equal(close.key,'years-familiar');assert.notEqual(close.text,first.text);S.turn=120;assert.equal(characterVoice(c).key,'years-years');c.aff=25;assert.equal(consortVoicePhase(c),'distant');assert.equal(characterVoice(c).key,'years-distant');c.aff=75;c.favor=10;assert.equal(consortVoicePhase(c),'distant');
 var snapshot=JSON.stringify(S),speech=characterVoiceHTML(c);for(var i=0;i<10;i++)assert.equal(characterVoiceHTML(c),speech);assert.equal(JSON.stringify(S),snapshot);`);force(.314);run(`characterVoice(c);assert.equal(R(),.314);`);
});
test('conversation history prevents immediate repeated opening lines and remains after reload',()=>{
 const {run}=boot();run(`var c=harem()[1];Object.assign(c,{enteredAt:0,aff:70,favor:70,voiceVisits:0,xin:{k:'平和'}});S.turn=0;var heard=[];for(var i=0;i<3;i++){var v=characterVoice(c,'talk');heard.push(v.text);rememberConversation(c,v,c.palace);}assert.equal(new Set(heard).size,3);save('1');load('1');c=byId(c.id);assert.deepEqual(c.voiceRecent,heard);assert.equal(c.voiceVisits,3);`);
});
test('newcomers do not disclose deep wounds and wishes even with high initial affection',()=>{
 const {run,force}=boot();run(`var c=harem()[1];Object.assign(c,{aff:90,voiceVisits:0,enteredAt:S.turn,wishKnown:false,woundKnown:false,xin:{k:'平和'}});E().energy=4;`);force(...Array(30).fill(0));run(`A.chat(c.id);assert.equal(c.wishKnown,false);assert.equal(c.woundKnown,false);assert.match(curEv.text,/初见/);`);
});
test('life stage never overrides acute grief, cold confinement or a temple stay',()=>{
 const {run}=boot();run(`var c=harem()[1];S.turn=180;c.enteredAt=0;c.aff=80;c.favor=80;c.xin={k:'悲恸'};assert.equal(characterVoice(c).key,'grief');c.cold=true;assert.equal(characterVoice(c).key,'cold');c.cold=false;c.templeStay={due:200};assert.equal(characterVoice(c).key,'temple-retreat');`);
});
const careSetup=`S.turn=60;S.consorts=[];S.children=[];var mother=makeGirl({age:25,fam:{t:'知县',p:30}});addConsort(mother,2,'入宫');var c=makeGirl({age:38,fam:{t:'翰林学士',p:45}});addConsort(c,5,'入宫');Object.assign(c,{favor:70,preg:0});var k=makeKid(mother,'f','明月');mother.alive=false;`;
test('ordinary foster petition requires an older childless favored capable woman and an unprotected young child',()=>{
 const {run}=boot();run(careSetup);run(`assert.ok(fosterPetitionMatch(c,k));for(var patch of [{age:25},{rank:3},{favor:20},{cold:true},{gone:true},{preg:2},{fam:{t:'寒门',p:5},favor:50}]){var original={...c};Object.assign(c,patch);assert.equal(fosterPetitionMatch(c,k),false);Object.assign(c,original);delete c.cold;delete c.gone;}
 mother.rank=8;assert.equal(fosterPetitionMatch(c,k),false);mother.rank=2;k.birthTraits.mother.rank=6;assert.equal(fosterPetitionMatch(c,k),false);k.birthTraits.mother.rank=2;
 mother.alive=true;assert.equal(fosterPetitionMatch(c,k),false);mother.cold=true;assert.ok(fosterPetitionMatch(c,k));mother.cold=false;mother.templeStay={due:80};assert.equal(fosterPetitionMatch(c,k),false);delete mother.templeStay;mother.alive=false;
 k.born=S.turn-72;assert.equal(fosterPetitionMatch(c,k),false);k.born=S.turn;sendChildToTemple(k,{months:6});assert.equal(fosterPetitionMatch(c,k),false);delete k.templeStay;
 var f=makeGirl({age:35});addConsort(f,4,'入宫');k.foster=f.id;assert.equal(fosterPetitionMatch(c,k),false);f.templeStay={due:80};assert.equal(fosterPetitionMatch(c,k),false);`);
});
test('foster petitions assign on consent only and persist biological and foster bonds with separate memories',()=>{
 const {run,force}=boot();run(careSetup);force(0,0);run(`var ev=fosterPetitionEvent();assert.ok(ev);assert.equal(k.foster,undefined);ev.onQueue();assert.equal(fosterPetitionEvent(),null);assert.ok(ev.choices[0].f());assert.equal(k.mom,mother.id);assert.equal(k.foster,c.id);assert.equal(petitionFoster(k,c),null);assert.ok(NPCMemory.recall(S,c.id).some(m=>m.type==='family-care'));assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='family-care'));save('1');load('1');assert.equal(kidById(k.id).foster,c.id);`);
});
test('unselected kin invitation creates no phantom relatives and acceptance shares the father',()=>{
 const {run,force}=boot();run(careSetup);run(`mother.rank=6;mother.age=30;S.consorts=[mother];var before=JSON.stringify(S);`);force(0,0);run(`var ev=kinSuccessionEvent();assert.ok(ev);assert.equal(JSON.stringify(S),before);ev.onQueue();`);force(0);run(`ev.choices[0].f();var sister=byId(mother.kinSuccessor);assert.ok(sister);assert.equal(sister.age>=18,true);assert.equal(houseOf(sister),houseOf(mother));assert.equal(sister.fatherId,mother.fatherId);assert.equal(curEv.title,'初入宫 · 姐妹旧缘');assert.match(curEv.text,/明月/);assert.equal(k.foster,undefined);choose(0);drain();assert.equal(k.foster,sister.id);assert.equal(k.mom,mother.id);assert.equal(kinSuccessionSource(mother),false);`);
});
test('kin greeting survives reload, protects existing foster placement and only admits its own sister children',()=>{
 const {run}=boot();run(careSetup);run(`mother.rank=8;var sister=makeKin(mother,'亲');addConsort(sister,3,'续缘');sister.kinArrival={mother:mother.id,pending:true};assert.ok(maternalKinMatch(sister,k));assert.equal(fosterPetitionMatch(sister,k),false);save('1');load('1');sister=byId(sister.id);k=kidById(k.id);mother=byId(mother.id);c=byId(c.id);assert.ok(pendingKinGreeting());k.foster=c.id;assert.equal(maternalKinMatch(sister,k),false);var ev=kinArrivalGreeting(sister);assert.equal(ev.choices.length,1);assert.match(ev.text,/已有安顿/);ev.choices[0].f();assert.equal(k.foster,c.id);assert.equal(pendingKinGreeting(),null);`);
});
test('a cold biological mother can be comforted by sister foster care without changing her child identity',()=>{
 const {run}=boot();run(careSetup);run(`mother.alive=true;mother.cold=true;mother.rank=6;var sister=makeKin(mother,'亲');addConsort(sister,3,'续缘');sister.kinArrival={mother:mother.id,pending:true};assert.ok(petitionFoster(k,sister,true));assert.equal(xinOf(mother),'释然');assert.equal(k.mom,mother.id);assert.equal(k.foster,sister.id);`);
});
test('new early and late birth calendars are fixed once and do not invent facts for legacy births',()=>{
 const {run,force}=boot();run(`var c=harem()[1];recordImperialNight(c);`);force(.01);run(`beginPregnancyCalendar(c);assert.equal(c.pregnancyCalendar.term,9);c.preg=8;assert.equal(birthEvent(c),null);c.preg=9;var ev=birthEvent(c);assert.ok(ev);var k=deliveryKids(c)[0];assert.equal(k.birthCalendar.term,9);assert.deepEqual(k.birthCalendar.nights,[S.turn]);assert.equal(c.pregnancyCalendar,undefined);assert.equal(k.birthTraits.father.kind,'emperor');
 var other=makeGirl({age:22});addConsort(other,3,'入宫');var legacy=makeKid(other,'f','清音');assert.equal(legacy.birthCalendar,undefined);`);
});
test('calendar suspicion can clear an imperial child, never offering guilty dispositions',()=>{
 const {run,force}=boot();run(`S.turn=60;var c=harem()[1];c.favor=80;c.xin={k:'平和'};S.children=[];var k=makeKid(c,'f','清音');k.birthCalendar={term:9,nights:[51],born:60,conceived:51};var father=JSON.stringify(k.birthTraits.father);`);force(0,0);run(`var ev=parentageClueEvent();assert.ok(ev);assert.equal(k.parentage,undefined);ev.onQueue();assert.equal(k.parentage.status,'suspected');assert.equal(parentageClueEvent(),null);E().energy=4;beginParentageInquiry(k);S.turn++;var report=parentageVerdictEvent(k);assert.equal(report.title,'疑云已释');assert.equal(report.choices.length,1);assert.equal(resolveParentage(k,'execute',true),null);report.choices[0].f();assert.equal(k.parentage.decision,'cleared');assert.ok(k.alive&&c.alive);assert.equal(JSON.stringify(k.birthTraits.father),father);assert.equal(k.removedFromRoyal,undefined);save('1');load('1');assert.equal(kidById(k.id).parentage.decision,'cleared');`);
});
test('concealed facts stay hidden before a clue and investigation never rerolls the biological father',()=>{
 const {run,force}=boot();run(secretFamily);run(`lady.pregnancyFather={kind:'prince',id:prince.id,gen:S.gen,name:'赵承安',wen:80,wu:60,mother:lady.id,hidden:true};var k=makeKid(lady,'m','承熙');assert.equal(k.parentage.status,'hidden');assert.equal(parentageReady(k),false);assert.equal(parentagePanel(k),'');assert.equal(consortParentagePanel(lady),'');assert.notEqual(childFatherHTML(k),'待查证');var father=JSON.stringify(k.birthTraits.father);`);force(0,0);run(`var ev=parentageClueEvent();assert.ok(ev);ev.onQueue();assert.equal(k.parentage.status,'suspected');beginParentageInquiry(k);S.turn++;assert.equal(parentageVerdictEvent(k).title,'身世查证');assert.equal(JSON.stringify(k.birthTraits.father),father);`);
});
test('informants must be active rivals and old saves do not manufacture timing mismatches',()=>{
 const {run}=boot();run(`S.turn=60;var c=harem()[1],rival=makeGirl({age:22});addConsort(rival,3,'入宫');c.favor=80;S.children=[];var k=makeKid(c,'f','清音');for(var p of harem())p.scheme=0;rival.scheme=90;relAdd(c,rival,-80-relGet(c,rival));rival.cold=true;assert.equal(parentageClueEvent(),null);c.cold=true;assert.equal(parentageClueCandidates().length,0);c.cold=false;assert.equal(k.birthCalendar,undefined);`);
});
test('rare event producers do not mutate the world when their rolls fail',()=>{
 const {run,force}=boot();run(careSetup);run(`mother.rank=6;var snapshot=JSON.stringify(S);`);force(.99);run(`assert.equal(kinSuccessionEvent(),null);assert.equal(JSON.stringify(S),snapshot);mother.rank=2;snapshot=JSON.stringify(S);`);force(.99);run(`assert.equal(fosterPetitionEvent(),null);assert.equal(JSON.stringify(S),snapshot);`);
});
test('an ongoing adult private correspondence can conceive before being caught, but not a minor relationship',()=>{
 const {run,force}=boot();run(secretFamily);run(`pair.status='active';pair.stage=2;pair.started=S.turn-12;pair.due=S.turn+4;`);force(0,0,.5);run(`palaceParentageTick();assert.equal(lady.preg,1);assert.equal(lady.pregnancyFather.hidden,true);assert.equal(lady.pregnancyFather.id,prince.id);`);
 const other=boot();other.run(secretFamily);other.run(`pair.status='active';pair.stage=2;pair.started=S.turn-12;prince.born=S.turn-17*12;lady.enteredAt=S.turn-12;lady.age=20;`);other.force(0,0);other.run(`palaceParentageTick();assert.equal(lady.preg,0);`);
});
test('late pregnancy waits for its saved term and preserves the emperor snapshot',()=>{
 const {run,force}=boot();run(`var c=harem()[1];c.pregnancyFather={kind:'emperor',gen:S.gen,mother:c.id,name:'旧名',wen:82,wu:64};recordImperialNight(c);`);force(.025);run(`beginPregnancyCalendar(c);assert.equal(c.pregnancyCalendar.term,11);save('1');load('1');c=byId(c.id);c.preg=10;assert.equal(birthEvent(c),null);c.preg=11;assert.ok(birthEvent(c));var k=deliveryKids(c)[0];assert.equal(k.birthTraits.father.wen,82);assert.equal(k.birthCalendar.term,11);`);
});
test('resuming a newcomer conversation delivers the unfinished family greeting before ordinary chat',()=>{
 const {run}=boot();run(careSetup);run(`mother.rank=6;var sister=makeKin(mother,'亲');addConsort(sister,3,'续缘');sister.kinArrival={mother:mother.id,pending:true};save('1');load('1');E().energy=4;A.chat(sister.id);assert.equal(curEv.title,'初入宫 · 姐妹旧缘');assert.equal(E().energy,4);`);
});
test('a decade without contact is not automatically a decade of intimacy',()=>{
 const {run}=boot();run(`var c=harem()[1];Object.assign(c,{enteredAt:0,aff:80,favor:80,voiceVisits:0,nights:0,bond:false,xin:{k:'平和'}});S.turn=120;assert.equal(consortVoicePhase(c),'settling');`);
});
