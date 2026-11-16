const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
const KEY='chengongji_v1_auto';
function start(){const b=boot(202);b.run('A.start();drain();');return b;}
test('normal play reaches the first regular examination exactly three years after the March accession',()=>{
 const b=start();b.run(`var shown=[];var finishMonthScenes=()=>{for(var i=0;modalOpen&&i<200;i++){if(!modalResult&&/殿试.*钦点三甲/.test(curEv.title))shown.push({turn:S.turn,year:S.year,month:S.month});if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}if(modalOpen)throw Error('stuck');};`);
 for(let month=0;month<36;month++)b.run('A.endMonth();finishMonthScenes()');
 assert.deepEqual(JSON.parse(b.run('JSON.stringify(shown)')),[{turn:36,year:4,month:3}]);assert.equal(b.run('scholarList().filter(x=>x.examRank).length'),3);
 assert.match(b.run('examSchedulePanel()'),/七年三月/);assert.match(b.run('examSchedulePanel()'),/最近一科：四年正科，状元/);
});
for(const interval of [1,3,5,10])test(`real monthly advancement automatically queues the ${interval}-year exam and pending reload keeps its three candidates`,()=>{
 let b=start();b.run(`S.year=${interval+1};S.month=2;S.turn=${interval*12-1};ministryState().examInterval=${interval};S.ministries.heads={};for(const c of S.consorts){c.fam={t:'寒门',p:10};delete c.house;}PalaceActions.reset();A.endMonth();`);
 assert.equal(b.run('S.ministries.exams.at(-1).year'),interval+1);const stored=b.storage.get(KEY);assert.ok(JSON.parse(stored).pendingActions);
 b=boot(919,b.storage);b.run(`A.load('auto');var reachExam=()=>{for(var i=0;modalOpen&&!/殿试.*钦点三甲/.test(curEv.title)&&i<100;i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};reachExam();`);
 assert.equal(b.run('PalaceActions.blocked'),false);assert.equal(b.run('curEv.title'),'殿试 · 钦点三甲');const candidates=b.run('JSON.stringify(curEv.cast.map(x=>x.id))');b.run("save('auto');A.load('auto')");assert.equal(b.run('JSON.stringify(curEv.cast.map(x=>x.id))'),candidates);b.run('choose(3);drain()');assert.equal(b.run('scholarList().filter(x=>x.examRank).length'),3);assert.equal(b.run('S.ministries.exams.length'),1);
});
test('government exposes the schedule directly without mutating its data or requiring a minister',()=>{
 const b=start();const before=b.run('JSON.stringify(S)');assert.match(b.run('examSchedulePanel()'),/调整科举周期/);assert.equal(b.run('JSON.stringify(S)'),before);assert.match(b.run('viewGovernment()'),/aria-label="科举日程"/);const ministries=b.run('viewMinistries()');assert.ok(ministries.indexOf('aria-label="科举日程"')<ministries.indexOf('class="grid ministry-grid"'));assert.match(ministries,/调整科举周期/);b.run('A.examSchedule();choose(2);drain();');assert.equal(b.run('regularExamInterval()'),5);assert.match(b.run('examSchedulePanel()'),/每五年一科/);assert.match(b.run('examSchedulePanel()'),/六年三月/);
 b.run("A.load('auto')");assert.match(b.run('examSchedulePanel()'),/六年三月/);
});

test('the examination panel stays visible while rendering an old pending scene',()=>{const b=start();b.run("Object.defineProperty(PalaceActions,'contentVersion',{get:()=>32,configurable:true})");assert.match(b.run('viewMinistries()'),/调整科举周期/);assert.match(b.run('examSchedulePanel()'),/四年三月/);});
