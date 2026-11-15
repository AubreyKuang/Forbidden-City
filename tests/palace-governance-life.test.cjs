const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
function world(seed=311){const b=withClock(boot(seed));b.ctx.assert=assert;b.run('A.start();drain();');return b;}
function reload(b){const c=withClock(boot(901,b.storage));c.ctx.assert=assert;c.run("A.load('auto');assert.equal(PalaceActions.blocked,false)");return c;}

test('last energy waits for the current result, resumes across reload, then advances once',()=>{
 let b=world();b.run("E().energy=1;A.out('spa');assert.equal(E().energy,0);assert.equal(S.turn,0);assert.equal(curEv.title,'温泉行宫');");
 b=reload(b);b.run('assert.equal(S.turn,0);choose(0);assert.equal(S.turn,0);tick(1499);assert.equal(S.turn,0);tick(1);assert.equal(S.turn,1);assert.ok(E().energy>0);');
 b=reload(b);b.run('assert.equal(S.turn,1);while(modalOpen)nextEv();assert.equal(S.turn,1);');
});
test('last court action keeps its decision and only advances after the result is read',()=>{
 let b=world();b.run("E().energy=1;A.court();choose(0);assert.equal(S.turn,0);assert.ok(modalResult);assert.equal(S.flags.monthlyCourt.done,true);");
 b=reload(b);b.run("nextEv();assert.equal(S.turn,0);tick(1500);assert.equal(S.turn,1);assert.equal(S.flags.lastMonthReview.court.title,'黄河决堤');");
});
test('a non-dialog action also advances; rejected actions and reading do not consume a month',()=>{
 const b=world();b.run("E().energy=1;A.taxPlan('light');assert.equal(S.turn,0);tick(1500);assert.equal(S.turn,1);while(modalOpen)nextEv();E().energy=0;delete S.flags.exhaustedTurn;A.taxPlan('regular');A.go('government');assert.equal(S.turn,1);assert.equal(governance().tax,'light');");
});
test('a failed write keeps the last energy spent and saves it when storage returns',()=>{
 const b=world();b.run("E().energy=1;var coins=E().treasury,write=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};A.out('spa');assert.equal(E().treasury,coins-60);assert.equal(E().energy,0);assert.ok(lastAutoSaveError);");
 b.run("localStorage.setItem=write;assert.equal(save('auto'),true);var saved=JSON.parse(localStorage.getItem(SKEY+'auto'));assert.equal(saved.emp.treasury,coins-60);assert.equal(saved.emp.energy,0);");
});
test('unsettled birth is handled before an exhausted month can advance',()=>{
 const b=world();b.run(`var c=harem()[1];c.preg=10;birthEvent(c);E().energy=0;S.flags.exhaustedTurn=S.turn;A.resumeBirth(c.id);
  var turn=S.turn;assert.equal(modalOpen,true);settleExhaustedMonth(null);assert.equal(S.turn,turn);
  for(var i=0;modalOpen&&S.turn===turn&&i<100;i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(x=>!x.cond||x.cond()));}
  tick(1500);assert.equal(S.turn,turn+1);assert.equal(pendingDelivery(),undefined);assert.ok(S.children.every(k=>!k.pendingName));`);
});
test('tax and annual tribute each post exactly once, survive reload and recur next year',()=>{
 let b=world();b.run(`S.month=10;var before=E().treasury;var tax=annualRevenueTick();assert.equal(E().treasury-before,575);assert.match(tax.text,/575/);assert.equal(annualRevenueTick(),null);
  S.month=1;S.year=2;var prior=E().treasury;annualRevenueTick();assert.equal(E().treasury-prior,120);var gifts=Object.values(ensureJewelry().stock).reduce((a,b)=>a+b,0);assert.equal(gifts,3);assert.equal(annualRevenueTick(),null);save('auto');`);
 b=reload(b);b.run(`assert.equal(annualRevenueTick(),null);S.month=10;annualRevenueTick();assert.equal(governance().receipts.length,3);A.go('government');A.go('government');assert.equal(governance().receipts.length,3);`);
});
test('tax remission lowers the actual receipt, improves public feeling and locks after settlement',()=>{
 const b=world();b.run(`A.taxPlan('light');var people=E().people;S.month=10;annualRevenueTick();assert.equal(treasuryReceipt('tax').amount,403);assert.equal(E().people,people+5);A.taxPlan('regular');assert.equal(governance().tax,'light');`);
});
test('court portraits identify officers; numeric choice IDs resolve to their real person',()=>{
 const b=world();b.run(`var c=harem()[0],h=houseOf(c);h.father.office='户部侍郎';h.father.alive=true;h.father.career='official';delete h.father.commission;
  var ev=monthlyFloodEvent({floodNeed:'grain'});assert.ok(ev.cast.includes(h.father));assert.ok(!ev.cast.includes(c));
  var choice=ev.choices.find(x=>x.person===c.id);assert.equal(choice.portrait,h.father);
  var im=impeachmentEvent({impeachment:{person:c.id,matching:true,guilty:true}});assert.equal(im.por,h.father);im.choices[0].f();assert.ok(c.story.some(s=>s.event?.title==='御史弹劾'));assert.ok(h.father.story.some(s=>s.event?.title==='御史弹劾'));
  openModal({title:'两人',text:'',choices:harem().map(x=>({person:x.id,t:fullName(x)}))});for(var p of harem())assert.ok(document.querySelector('#mbox').innerHTML.includes('data-portrait-cell="'+portraitCell(p)+'"'));`);
});
test('crown is shifted upward equally for canvas and file rendering without replacing the face',()=>{
 const b=world();b.run(`var queen=empress(),cell=portraitCell(queen);for(var bust of [true,false]){var view=portraitView(cell,bust),fit=fittedPortraitJewelry(cell,8,'',view.head),svg=localPortrait(cell,8,'','',bust);if(fit){assert.ok(fit.box[2]<80);assert.ok(fit.box[1]+fit.box[2]*.42<view.head[1]);}assert.ok(svg.includes(view.sheet.src));assert.equal(portraitCell(queen),cell);}`);
});
test('six months of absence summon the keeper, respects mourning, cards and cooldown',()=>{
 const b=world();b.run(`S.turn=6;S.flags.haremAttendance={gen:S.gen,turn:0};S.flags.dowager.mourning={turn:S.turn};assert.equal(jingtishiEvent(),null);delete S.flags.dowager.mourning;var ev=jingtishiEvent();assert.ok(ev);assert.equal(ev.por,undefined);ev.onShow();assert.equal(jingtishiEvent(),null);S.turn=10;
  for(var c of harem())c.cardWithdrawn=true;assert.equal(jingtishiEvent(),null);for(var c of harem())c.cardWithdrawn=false;
  ev=jingtishiEvent();assert.ok(ev);A.go('consort',harem()[0].id);assert.equal(jingtishiEvent(),null);assert.equal(haremAbsence(),0);`);
});
test('keeper follows the real card selection through a save and never puts pregnant women on cards',()=>{
 let b=world();b.run(`S.turn=8;S.flags.haremAttendance={gen:S.gen,turn:0};harem()[0].preg=2;A.endMonth();`);
 b.run(`for(var i=0;modalOpen&&curEv.title!=='敬事房 · 捧牌候旨'&&i<100;i++)nextEv();assert.equal(curEv.title,'敬事房 · 捧牌候旨');choose(0);assert.ok(curEv.choices.filter(x=>x.person).every(x=>!x.person.preg));`);
 b=reload(b);b.run(`assert.equal(curEv.title,'敬事房 · 今夜召谁');choose(0);assert.equal(haremAbsence(),0);assert.equal(curEv.title,'春宵');`);
});
for(const trait of ['温婉','持重','善妒','骄矜','淡泊','痴情'])test(`selection keeps ${trait} queen's personality and remembers the specific new woman`,()=>{
 const b=world();b.run(`var q=empress();q.trait='${trait}';q.virtue=85;delete q.solitary;genCands(1);var newcomer=S.cands[0];A.xxTake(newcomer.id);choose(1);drain();A.xxEnd();assert.equal(modalOpen,false);
  assert.ok(q.story.some(s=>s.t.includes(fullName(newcomer))&&s.t.includes('六宫议论')));var before=newcomer.mood;A.selectionCouncil();assert.ok(modalOpen);choose(0);assert.ok(q.story.some(s=>s.t.includes('选秀后与陛下相谈')));
  ${['善妒','骄矜'].includes(trait)?`assert.equal(q.selectionConcern.mode,'jealous');assert.match(q.selectionConcern.quote,/难受/);assert.equal(newcomer.mood,before);`:`assert.equal(q.selectionConcern.mode,'helpful');assert.equal(newcomer.mood,before+6);assert.ok(newcomer.story.some(s=>s.t.includes('中宫照料')));`}
  drain();var n=q.story.length;A.selectionCouncil();assert.equal(q.story.length,n);assert.equal(modalOpen,false);`);
});
test('dowager explains actual maternal versus adoptive-family cousin status before admission',()=>{
 for(const relation of ['生母','嫡母 · 先帝皇后']){const b=world();b.run(`var d=ensureDowager();d.lastOffer=null;d.relation='${relation}';S.consorts=S.consorts.filter(c=>c.clan!==d.clan);var ev=dowagerProposal(d);assert.ok(ev);assert.match(ev.text,/表[姐妹]/);assert.match(ev.text,/尚未见过你/);ev.onShow();ev.choices[0].f();var c=S.consorts.at(-1);assert.equal(c.imperialKin.blood,${relation==='生母'});assert.ok(c.story.some(s=>/表[姐妹]/.test(s.t)));`);}
});
test('appointment changes one real officer, blocks conflicting duties and recalls his family at review',()=>{
 let b=world();b.run(`var e=officialEntries().find(e=>e.h.bloc!=='army');e.p.ability=90;e.p.age=40;e.p.career='official';e.p.office='县令';e.p.retired=false;delete e.p.report;delete e.p.commission;
  var key=e.key;A.postCandidates('jiangnan');choose(curEv.choices.findIndex(x=>x.person===e.p));assert.equal(e.p.office,'江南知府');assert.ok(e.p.away);assert.ok(e.c.story.some(s=>s.t.includes(e.p.name)&&s.t.includes('调任江南知府')));assert.equal(canTransfer(e,'revenue'),false);`);
 const key=b.run('key');b=reload(b);b.run(`while(modalOpen)nextEv();var e=officialEntry('${key}');assert.equal(e.p.office,'江南知府');S.turn+=6;postingTick();assert.match(e.p.report.title,/半年考课/);assert.ok(e.c.familyDuty.task.includes('半年考课'));`);
});
for(const id of ['dikes','granaries','schools','water','pay','drills'])test(`government mission ${id} has its own result, family recollection and durable effects`,()=>{
 const b=world();b.run(`var id='${id}',t=OFFICIAL_TASKS[id],e=officialEntries()[0];e.h.bloc=t.army?'army':'civil';e.p.office=e.p.post=t.army?'参将':'知府';e.p.career='official';e.p.age=40;e.p.retired=false;e.p.ability=95;delete e.p.report;delete e.p.commission;E().treasury=1000;
  assignOfficialTask(e,id);assert.equal(e.p.commission.id,id);e.p.commission.outcome='success';S.turn=e.p.commission.due;officialTaskTick();assert.match(e.p.report.text,new RegExp(t.success));assert.ok(e.c.story.some(s=>s.t.includes(t.title)&&s.t.includes(e.p.name)));var n=e.p.merit;officialTaskTick();assert.equal(e.p.merit,n);
  if(id==='dikes')assert.equal(floodDikeReady(),true);if(id==='granaries')assert.equal(grainReserveReady(),true);`);
});
for(const id of ['bridge','school','clinic','wages','veterans','granary','well','theatre'])test(`incognito ${id} has a funded investigation, one follow-up and a documented remedy`,()=>{
 const b=world();b.run(`var id='${id}',s=INCOGNITO_SCENES[id],coins=E().treasury;beginIncognitoCase(id,null);var f=governance().visits.at(-1);assert.equal(E().treasury,coins-s.cost);assert.equal(beginIncognitoCase(id,null),null);
  f.outcome='setback';S.turn=f.due;incognitoTick();assert.equal(f.status,'setback');assert.equal(f.note,s.failure);var ev=pendingIncognitoReport();ev.choices[0].f();assert.equal(f.status,'pending');S.turn=f.due;incognitoTick();assert.equal(f.status,'success');assert.equal(f.note,s.success);var money=E().treasury;pendingIncognitoReport().choices[0].f();incognitoTick();assert.equal(pendingIncognitoReport(),null);assert.equal(E().treasury,money);assert.ok(incognitoLedger().includes(s.place));`);
});
test('an officer occupied by a street inquiry cannot take another job; his death is not a successful report',()=>{
 const b=world();b.run(`var e=officialEntries()[0];e.p.career='official';e.p.retired=false;e.p.age=40;delete e.p.commission;delete e.p.report;beginIncognitoCase('bridge',e);assert.equal(officialServing(e.p),false);assert.equal(officialActionReady(e,'retire'),false);assert.equal(canTransfer(e,'revenue'),false);
  e.p.alive=false;var f=governance().visits.at(-1);S.turn=f.due;incognitoTick();assert.equal(f.status,'pending');assert.equal(f.officerId,null);assert.match(f.note,/接手/);assert.equal(e.p.incognitoCase,undefined);`);
});
test('new private visits avoid recent repeats and cold-reload through the actual city action',()=>{
 let b=world();b.run("S.flags.marketRescueSeen=true;S.flags.xieCityAttempt=S.turn;");b.force(.1,.1);b.run("A.out('city');assert.match(curEv.title,/微服 ·/);choose(0);assert.match(curEv.title,/民情交办/);");
 b=reload(b);b.run("choose(curEv.choices.length-2);assert.equal(governance().visits.at(-1).status,'pending');");b=reload(b);b.run("assert.equal(governance().visits.length,1);while(modalOpen)nextEv();var a=incognitoEvent();a.onShow();var last=governance().seenVisits.at(-1);for(var i=0;i<3;i++){var ev=incognitoEvent();ev.onShow();assert.notEqual(governance().seenVisits.at(-1),last);}");
});

test('an empty selection relieves jealousy instead of inventing new rivals',()=>{const b=world();b.run(`var q=empress();q.trait='善妒';delete q.solitary;genCands(1);A.xxDrop(S.cands[0].id);A.xxEnd();assert.match(q.selectionConcern.text,/松了口气/);assert.doesNotMatch(q.selectionConcern.quote,/名单添了人/);`);});
test('existing serving officers occupy their posts even before any player appointment',()=>{const b=world();b.run(`var e=officialEntries()[0];e.p.office='江南知府';e.p.alive=true;e.p.retired=false;delete e.p.dismissed;delete e.p.exiled;assert.equal(postHolder('jiangnan').p.id,e.p.id);e.p.retired=true;assert.equal(postHolder('jiangnan'),null);`);});
test('palace duties remember the named assignment before the later review',()=>{const b=world();b.run(`S.month=4;var [a,z]=harem();A.assignDuanwu();choose(0);assert.ok(!a.story.some(e=>e.t.includes('约定五月查验')));choose(0);for(var c of [a,z])assert.ok(c.story.some(e=>e.t.includes('约定五月查验')&&e.t.includes(fullName(c===a?z:a))));`);});

// These saves were created by the unmodified source commit recorded in the fixture,
// including its actual random transcript, choice indices and pre-upgrade state.
const legacyFixtures=require('./fixtures/court-life-legacy-v2.json');
for(const fixture of legacyFixtures.cases)test(`pre-upgrade ${fixture.name} continues, reloads and enables new rules after its old scene ends`,()=>{
 const storage=new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]);
 let b=boot(901,storage);b.ctx.assert=assert;
 b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.legacy,true)");
 assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
 b.run("if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()))");
 b=reload(b);b.run('drain();assert.equal(PalaceActions.legacy,false);');
 assert.equal(b.run('S.turn'),fixture.save.turn,'finishing a version 2 scene retains the original month');
 b.run("E().energy=1;A.out('spa');assert.equal(PalaceActions.payload().pendingActions.version,19)");
 b=reload(b);b.run('var previousTurn=S.turn;choose(0);tick(1500);assert.equal(S.turn,previousTurn+1);');
});
test('the old commission cancellation index still cancels instead of assigning a new mission',()=>{
 const fixture=legacyFixtures.cases.find(f=>f.name==='official');
 const b=boot(901,new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));b.ctx.assert=assert;
 b.run("A.load('auto');assert.equal(curEv.choices.length,3);assert.equal(curEv.choices[2].t,'暂不委派');choose(2);assert.equal(modalOpen,false);assert.ok(officialEntries().every(e=>!e.p.commission))");
});
