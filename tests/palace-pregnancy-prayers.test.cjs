const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(1729);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=60;S.consorts=[];S.children=[];var c=makeGirl({sur:'沈',given:'若棠',age:24,trait:'活泼'});addConsort(c,4,'入宫');c.aff=65;c.preg=4;c.pregnancyFather={kind:'emperor',gen:S.gen,mother:c.id,conceived:57};c.pregnancyCalendar={conceived:57,term:10,nights:[57]};E().energy=8;E().treasury=100;delete c.entryAdjustment;PalaceActions.reset();`);return b;}
test('only known adult in-palace pregnancies qualify, with rest at home for late or frail pregnancies',()=>{
 const {run}=boot();run(`assert.ok(pregnancyPrayerEligible(c));for(var field of ['cold','gone','templeStay','maid']){c[field]=true;assert.equal(pregnancyPrayerEligible(c),false);delete c[field];}c.alive=false;assert.equal(pregnancyPrayerEligible(c),false);c.alive=true;c.age=15;assert.equal(pregnancyPrayerEligible(c),false);c.age=24;
 for(var month of [0,1,10]){c.preg=month;assert.equal(pregnancyPrayerEligible(c),false);}c.preg=4;assert.equal(pregnancyPrayerHome(c),false);c.preg=8;assert.ok(pregnancyPrayerHome(c));assert.match(pregnancyPrayerEvent(c).text,/廊下/);assert.ok(!pregnancyPrayerVisitors().includes(c));c.preg=4;c.trait='体弱';assert.ok(pregnancyPrayerHome(c));c.trait='活泼';c.hp=30;assert.ok(pregnancyPrayerHome(c));`);
});
test('one gestation has a stable lot across reopening, month advances and save reload',()=>{
 const {run}=boot();run(`var key=pregnancyPrayerKey(c),lot=pregnancyPrayerLot(c).id;for(var i=0;i<10;i++)assert.equal(pregnancyPrayerLot(c).id,lot);S.turn++;c.preg++;assert.equal(pregnancyPrayerKey(c),key);assert.equal(pregnancyPrayerLot(c).id,lot);save('1');load('1');c=byId(c.id);assert.equal(pregnancyPrayerLot(c).id,lot);delete c.pregnancyCalendar;delete c.pregnancyFather;var legacy=pregnancyPrayerKey(c);S.turn++;c.preg++;assert.equal(pregnancyPrayerKey(c),legacy);`);
});
test('questions reflect personality, existing children and a known loss without exposing a hidden miscarriage',()=>{
 const {run}=boot();run(`assert.match(pregnancyPrayerWish(c),/小木马/);c.trait='才女';assert.match(pregnancyPrayerWish(c),/斯干/);c.trait='城府';assert.match(pregnancyPrayerWish(c),/六宫的口舌/);c.trait='骄矜';assert.match(pregnancyPrayerWish(c),/像是位皇子/);
 var k=makeKid(c,'m','景和');k.born=S.turn-48;assert.match(pregnancyPrayerWish(c),/已有皇子/);assert.match(pregnancyPrayerWish(c),/景和已经问过/);k.alive=false;assert.match(pregnancyPrayerWish(c),/又等不到/);S.children=[];c.concealedLoss={revealed:false,settled:false};assert.ok(!pregnancyPrayerWish(c).includes('又等不到'));c.concealedLoss.revealed=true;assert.match(pregnancyPrayerWish(c),/又等不到/);`);
});
test('hall and consort profile expose the interaction and regular Daoist study remains separate',()=>{
 const {run}=boot();run(`assert.match(viewDaoHall(),/孕中祈愿/);assert.match(viewDaoHall(),/A.pregnancyPrayer/);A.go('consort',c.id);assert.match(viewConsort(),/同赴钦安殿问男女/);assert.equal(daoEligible(c),false);c.t2='信佛';assert.equal(pregnancyPrayerVisitors().includes(c),false);pregnancyPrayerEvent(c).choices[0].f();assert.equal(c.daoPractice,undefined);`);
});
test('a prayer charges once, records memory and never alters pregnancy facts or protection',()=>{
 const {run}=boot();run(`var facts=JSON.stringify([c.preg,c.pregnancyFather,c.pregnancyCalendar,c.prot,c.swapPlot,S.children]);var ev=pregnancyPrayerEvent(c);ev.choices[2].f();assert.equal(E().energy,7);assert.equal(E().treasury,95);assert.equal(ev.choices[2].f(),null);assert.equal(E().energy,7);assert.equal(JSON.stringify([c.preg,c.pregnancyFather,c.pregnancyCalendar,c.prot,c.swapPlot,S.children]),facts);assert.ok(NPCMemory.recall(S,c.id).some(m=>m.type==='pregnancy-prayer'));assert.ok(c.story.some(s=>s.t.includes('国师')));assert.ok(S.log.some(s=>s.t.includes('钦安殿')));`);
});
test('insufficient resources and stale events cannot charge or create prayer records',()=>{
 const {run}=boot();run(`var ev=pregnancyPrayerEvent(c);E().energy=0;assert.equal(ev.choices[0].f(),null);assert.equal(c.pregnancyPrayer,undefined);E().energy=8;E().treasury=4;assert.equal(ev.choices[2].f(),null);assert.equal(E().energy,8);c.pregnancyCalendar.conceived=58;assert.equal(ev.choices[0].f(),null);assert.equal(E().energy,8);c.alive=false;assert.equal(pregnancyPrayerEvent(c),null);`);
});
test('pending and completed prayers replay after reload without double charging',()=>{
 const {run}=boot();run(`A.pregnancyPrayer(c.id);var title=curEv.title;save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);choose(1);save('2');A.load('2');assert.equal(PalaceActions.blocked,false);assert.equal(E().energy,7);drain();c=byId(c.id);var n=c.story.length;A.pregnancyPrayer(c.id);assert.equal(curEv.title,'重读孕中祈愿');drain();assert.equal(E().energy,7);assert.equal(c.story.length,n);`);
});
test('a later pregnancy receives its own prayer while the earlier scene remains in history',()=>{
 const {run}=boot();run(`pregnancyPrayerEvent(c).choices[0].f();var old=c.pregnancyPrayer.key,n=c.story.length;S.turn+=24;c.pregnancyCalendar={conceived:S.turn-3,term:10};assert.equal(currentPregnancyPrayer(c),null);assert.ok(pregnancyPrayerEvent(c).choices.length>1);pregnancyPrayerEvent(c).choices[1].f();assert.notEqual(c.pregnancyPrayer.key,old);assert.equal(c.story.length,n+1);`);
});
test('natural visits and monthly scenes are stable, bounded and linked to map routines',()=>{
 const {run,force}=boot();run(`c.t2='直言';c.like='诗书';for(var i=1;i<200&&!pregnancyPrayerVisitors().includes(c);i++)c.seed=i;assert.ok(pregnancyPrayerVisitors().includes(c));var people=pregnancyPrayerVisitors().map(x=>x.id);assert.deepEqual(pregnancyPrayerVisitors().map(x=>x.id),people);assert.equal(npcRoutine(c,.9).where,'dao-pregnancy');assert.match(npcRoutineText(c,{where:'dao-pregnancy',path:[]}),/男女/);`);
 force(0);run(`var ev=pregnancyPrayerMonthlyEvent();assert.ok(ev);ev.onQueue();assert.equal(pregnancyPrayerMonthlyEvent(),null);assert.equal(c.pregnancyPrayer,undefined);`);
});
test('birth echoes compare an old wish with the real child, including mismatch and multiples',()=>{
 const {run}=boot();run(`pregnancyPrayerEvent(c).choices[0].f();var p=c.pregnancyPrayer;p.lot='bear';var k=makeKid(c,'f','明珠');c.delivery={prayerKey:p.key};var line=pregnancyPrayerBirthEcho(c,[k]);assert.match(line,/不同/);assert.match(line,/明珠/);assert.equal(pregnancyPrayerBirthEcho(c,[k]),'');assert.equal(k.sex,'f');
 p.answered=false;p.lot='serpent';assert.match(pregnancyPrayerBirthEcho(c,[k]),/相合/);p.answered=false;var other=makeKid(c,'m','景明');assert.match(pregnancyPrayerBirthEcho(c,[k,other]),/几声啼哭/);`);
});
test('birth integration preserves prayer identity, and an earlier gestation cannot echo into a later one',()=>{
 const {run,force}=boot();run(`pregnancyPrayerEvent(c).choices[0].f();var key=c.pregnancyPrayer.key;c.preg=10;`);force(.8,.9,.9,.9,.9,.9,.9,.9,.9);run(`birthEvent(c);assert.equal(c.delivery.prayerKey,key);c.delivery.difficult=false;for(var k of deliveryKids(c))k.pendingName=false;finishDelivery(c);assert.ok(c.pregnancyPrayer.answered);assert.ok(c.story.some(s=>s.t.includes('孕中')&&s.t.includes('旧笺')));
 c.pregnancyPrayer.answered=false;c.preg=4;c.pregnancyCalendar={conceived:S.turn+20,term:10};assert.equal(currentPregnancyPrayer(c),null);c.delivery={prayerKey:pregnancyPrayerKey(c)};assert.equal(pregnancyPrayerBirthEcho(c,deliveryKids(c)), '');`);
});
test('divination neither reveals nor cures concealed pregnancies, and tragic births never produce joyful echoes',()=>{
 const {run}=boot();run(`c.concealedLoss={revealed:false,settled:false,turn:S.turn-1};var ev=pregnancyPrayerEvent(c);assert.ok(ev);assert.ok(!ev.text.includes('隐瞒'));ev.choices[1].f();assert.equal(c.concealedLoss.revealed,false);assert.equal(c.prot,false);var p=c.pregnancyPrayer,k=makeKid(c,'m','景明');c.delivery={prayerKey:p.key};k.birthSwap={occurred:true};assert.equal(pregnancyPrayerBirthEcho(c,[k]),'');p.answered=false;delete k.birthSwap;c.alive=false;assert.equal(pregnancyPrayerBirthEcho(c,[k]),'');p.answered=false;c.alive=true;k.alive=false;assert.equal(pregnancyPrayerBirthEcho(c,[k]),'');`);
});
