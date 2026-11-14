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

const household=`S.turn=48;S.year=5;S.month=3;E().energy=4;E().treasury=500;
 var c=harem()[0];c.fam={t:'镇国大将军',p:65};c.trait='将门';delete c.house;
 var h=houseOf(c),sister=makeKin(c,'亲');addConsort(sister,3,'姐妹入宫');
 var key=c.id+':brother',p=h.brother;`;

test('father and brother are shared people across sisters, with navigable family and consort profiles',()=>{
 const {run}=boot();run(household);run(`assert.equal(houseOf(sister),h);assert.equal(officialEntries().filter(x=>x.p.id===p.id).length,1);
 A.go('family');A.go('official',key);assert.match(viewOfficial(),/召见议事/);assert.match(viewOfficial(),/返回家族/);
 A.go('consort',c.id);A.backPerson('harem');assert.equal(UI.view,'official');A.backPerson('officials');assert.equal(UI.view,'family');
 assert.ok(houseLine(c).includes("A.go('official'"));assert.match(familyGraphSVG(),/查看/);
 officialRecord(c,'brother','巡视边防，查清一处粮仓。');assert.equal(p.story.length,1);
 assert.ok(c.story.some(x=>x.t.includes('巡视边防')));assert.ok(sister.story.some(x=>x.t.includes('巡视边防')));
 var id=p.id;save('1');load('1');c=byId(c.id);sister=byId(sister.id);h=houseOf(c);assert.equal(h,houseOf(sister));assert.equal(h.brother.id,id);assert.equal(h.brother.story.length,1);`);
});
test('actual northern battle defeat kills the named relative, records a date and prevents future service',()=>{
 const {run,force}=boot();run(household);force(.99);run(`var ev=COURT[1]({person:c.id});var option=ev.choices.find(x=>x.t.includes(p.name));assert.ok(option);option.f();
 assert.equal(p.alive,false);assert.equal(p.death.kind,'battle');assert.equal(p.death.d,dateStr());assert.match(familyGraphSVG(),/阵亡/);
 assert.ok(c.story.some(x=>x.t.includes(p.name)&&x.t.includes('战死')));assert.ok(sister.story.some(x=>x.t.includes(p.name)&&x.t.includes('战死')));
 assert.equal(militaryMeritEvent(c,'雁门关','brother'),null);assert.equal(householdGuest(c,{born:S.turn-15*12}),null);
 var mood=c.mood,records=p.story.length;assert.equal(officialDeath(c,'brother','又一次阵亡','battle'),false);assert.equal(c.mood,mood);assert.equal(p.story.length,records);
 assert.ok(!COURT[1]({person:c.id}).choices.some(x=>x.t.includes(p.name)));`);
});
test('legacy written battle deaths migrate without resurrection, fabricated dates or repeated grief',()=>{
 const {run}=boot();run(household);run(`delete p.legacyLifeChecked;story(c,'父兄出征失利，兄长战死沙场。她哭了整整三日。');var oldDate=c.story.at(-1).d;
 sister.house=JSON.parse(JSON.stringify(h));delete sister.house.brother.legacyLifeChecked;var mood=c.mood;
 migrate();h=houseOf(c);p=h.brother;assert.equal(p.alive,false);assert.equal(p.death.d,oldDate);assert.equal(houseOf(sister).brother,p);assert.equal(c.mood,mood);
 var snapshot=JSON.stringify(h);migrate();assert.equal(JSON.stringify(h),snapshot);
 save('1');load('1');assert.equal(houseOf(byId(c.id)).brother.alive,false);`);
});
test('a deceased copy of a shared father wins over a stale living copy after loading',()=>{
 const {run}=boot();run(household);run(`sister.house=JSON.parse(JSON.stringify(h));sister.house.father.alive=false;sister.house.father.death={kind:'battle',d:'永宁二年五月',reason:'边关阵亡'};
 houseOf(c);assert.equal(h.father.alive,false);assert.equal(h.father.death.reason,'边关阵亡');assert.equal(houseOf(sister).father,h.father);`);
});
test('audiences cost energy only on reply, honor the shared cooldown, and reflect family circumstances',()=>{
 const {run}=boot();run(household);run(`var energy=E().energy,trust=p.trust;A.officialAct(key,'talk');assert.equal(E().energy,energy);choose(3);assert.equal(p.trust,trust);
 A.officialAct(key,'talk');choose(1);drain();assert.equal(E().energy,energy-1);assert.equal(p.trust,trust+4);
 A.officialAct(sister.id+':brother','talk');assert.equal(modalOpen,false);assert.equal(p.trust,trust+4);
 c.cold=true;assert.match(officialConversation(officialEntry(key),'family'),/冷宫/);c.alive=false;assert.match(officialConversation(officialEntry(key),'family'),/书信/);
 S.turn+=3;p.away=true;A.officialAct(key,'talk');assert.match(curEv.title,/赐书/);choose(3);
 E().energy=0;A.officialAct(key,'talk');assert.equal(curEv.choices[0].cond(),false);choose(0);assert.equal(p.trust,trust+4);`);
});
test('a commission pins its result, resumes after save, pays once and writes both sisters histories',()=>{
 const {run,force}=boot();run(household);force(.3);run(`var entry=officialEntry(key),treasury=E().treasury;
 assert.ok(assignOfficialTask(entry,'border'));assert.equal(E().energy,3);assert.equal(E().treasury,treasury-30);
 assert.equal(assignOfficialTask(entry,'border'),null);assert.equal(E().treasury,treasury-30);assert.equal(p.commission.outcome,'success');
 var task=JSON.stringify(p.commission);save('1');load('1');c=byId(c.id);p=houseOf(c).brother;assert.equal(JSON.stringify(p.commission),task);
 S.turn=p.commission.due;var merit=p.merit;officialTaskTick();assert.equal(p.merit,merit+12);assert.equal(p.commission,undefined);
 var records=p.story.length;officialTaskTick();assert.equal(p.story.length,records);assert.ok(p.report);assert.ok(byId(sister.id).story.some(x=>x.t.includes('核验相符')));
 save('1');A.load('1');c=byId(c.id);p=houseOf(c).brother;assert.match(curEv.title,/外臣回奏/);
 var finish=curEv.choices[0].f,before=E().treasury;assert.ok(finish());assert.equal(finish(),null);assert.equal(E().treasury,before-15);drain();assert.equal(p.report,undefined);`);
});
test('commission death remains in the family tree and condolence cannot pay twice',()=>{
 const {run,force}=boot();run(household);force(.001);run(`assignOfficialTask(officialEntry(key),'border');S.turn=p.commission.due;officialTaskTick();
 assert.equal(p.alive,false);assert.equal(p.report.outcome,'death');assert.equal(p.death.turn,S.turn);assert.match(familyGraphSVG(),/阵亡/);
 var ev=officialReportEvent(officialEntry(key));pushEv(ev);choose(0);drain();assert.ok(p.memorialHonor);assert.equal(officialActionReady(officialEntry(key),'honor'),false);
 for(const action of ['talk','reward','commission','retire','recall'])assert.equal(officialActionReady(officialEntry(key),action),false);
 var merit=p.merit;courtTick();assert.equal(p.merit,merit);`);
});
test('civil officials cannot receive military commissions; treasury and unfinished reports gate new work',()=>{
 const {run}=boot();run(household);run(`h.bloc='civil';var e=officialEntry(key);assert.equal(assignOfficialTask(e,'border'),null);assert.equal(E().energy,4);
 E().treasury=14;assert.equal(assignOfficialTask(e,'accounts'),null);assert.equal(E().energy,4);E().treasury=100;
 p.report={text:'待阅'};assert.equal(assignOfficialTask(e,'accounts'),null);delete p.report;p.retired=true;assert.equal(assignOfficialTask(e,'accounts'),null);
 p.retired=false;p.reliefResumeTurn=S.turn+3;assert.equal(assignOfficialTask(e,'accounts'),null);`);
});
test('retirement changes service eligibility, later recall and merit rewards have persistent gates',()=>{
 const {run}=boot();run(household);run(`p.age=60;A.officialAct(key,'retire');choose(0);drain();assert.ok(p.retired);assert.equal(officialServing(p),false);
 assert.equal(officialActionReady(officialEntry(key),'recall'),false);S.turn+=12;A.officialAct(key,'recall');choose(0);drain();assert.equal(p.retired,false);
 p.merit=60;A.officialAct(key,'reward');choose(0);drain();assert.equal(p.rewardedMerit,60);S.turn+=12;assert.equal(officialActionReady(officialEntry(key),'reward'),false);
 p.merit=70;assert.equal(officialActionReady(officialEntry(key),'reward'),true);`);
});
test('queued battle and guest scenes become invalid when a relative dies, and absent brothers render safely',()=>{
 const {run}=boot();run(household);run(`var ev=militaryMeritEvent(c,'雁门关','father');officialDeath(c,'father','年老病故');assert.equal(eventStillValid(ev),false);
 h.brother=null;assert.doesNotThrow(()=>houseLine(c));assert.doesNotThrow(()=>familyGraphSVG());assert.doesNotThrow(()=>courtTick());
 assert.equal(householdGuest(c,{born:S.turn-15*12}),null);assert.equal(officialEntry(key),null);`);
});
test('personal story endings update father death or brother exile and stop incompatible later scenes',()=>{
 const {run}=boot();run(household);run(`c.arc={id:'general',st:3,f:{},done:false,t:S.turn};aEnd(c,'孤女','叛乱平定，父亲伏诛。');
 assert.equal(h.father.alive,false);assert.equal(h.father.death.kind,'execution');assert.equal(officialArcEligible(c),false);
 c.arc={id:'greed',st:1,f:{},done:false,t:S.turn};aEnd(c,'抄家','兄长被流放。');assert.ok(p.exiled);assert.equal(officialServing(p),false);
 assert.equal(officialActionReady(officialEntry(key),'talk'),false);assert.equal(officialArcEligible(c),false);assert.match(officialStatus(p),/流放/);
 assert.equal(householdGuest(c,{born:S.turn-15*12}),null);`);
});
test('a profile award cannot duplicate a pending report award, including condolences in either order',()=>{
 const {run,force}=boot();run(household);force(.001);run(`assignOfficialTask(officialEntry(key),'border');S.turn=p.commission.due;officialTaskTick();
 A.officialAct(key,'honor');choose(0);drain();assert.ok(p.report);assert.ok(p.memorialHonor);
 var ev=officialReportEvent(officialEntry(key)),money=E().treasury;assert.equal(ev.choices[0].cond(),false);assert.equal(ev.choices[0].f(),null);assert.equal(E().treasury,money);
 ev.choices[1].f();assert.equal(p.report,undefined);
 var father=officialEntry(c.id+':father');father.p.merit=80;father.p.report={outcome:'success',text:'办妥'};assert.equal(officialActionReady(father,'reward'),false);`);
});
test('pending official conversations and commission choices restore through the shared action journal',()=>{
 for(const action of ['talk','commission']){const {run}=boot();run(household);run(`A.go('official',key);A.officialAct(key,'${action}');
 var title=curEv.title,money=E().treasury,energy=E().energy;save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);
 assert.equal(E().treasury,money);assert.equal(E().energy,energy);choose(0);var text=$('#mbox').innerHTML;save('1');A.load('1');
 assert.equal(PalaceActions.blocked,false);assert.equal($('#mbox').innerHTML,text);assert.equal(E().energy,energy-1);drain();
 assert.equal(E().treasury,money-${action==='commission'?30:0});`);}
});

