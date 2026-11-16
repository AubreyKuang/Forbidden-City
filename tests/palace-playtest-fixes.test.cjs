const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const start=b=>b.run('A.start();drain();');
const snapshot=b=>b.run('JSON.stringify({world:{...S,savedAt:undefined,saveVersion:undefined},title:curEv?.title,text:curEv?.text,choices:curEv?.choices.map(c=>c.t),queue:Q.map(e=>e.title),result:modalResult})');
function reload(b){
 const next=boot(999999,b.storage);next.run("A.load('auto')");
 assert.ok(!next.messages.some(s=>s.includes('无法在当前版本续接')),'pending scene replay failed');
 const expectedSnapshot=snapshot(b),actualSnapshot=snapshot(next);
 if(actualSnapshot===expectedSnapshot)return next;
 // Legacy migration may fill absent metadata after the final modal closes.
 const expected=JSON.parse(expectedSnapshot),actual=JSON.parse(actualSnapshot);
 const project=(a,e)=>e&&typeof e==='object'?Object.fromEntries(Object.entries(e).map(([k,v])=>[k,project(a?.[k],v)])):a;
 assert.deepEqual(project(actual,expected),project(expected,expected));return next;
}

test('fresh runtime restores the exact first-month queue, result and choice effects once',()=>{
 let b=boot();start(b);b.run('A.endMonth()');assert.ok(b.run('modalOpen'));b=reload(b);
 for(let n=0;b.run('modalOpen')&&n<100;n++){
   b.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()))');
   b=reload(b);
   if(b.run('!!modalResult')){const before=snapshot(b);b.run('choose(0)');assert.equal(snapshot(b),before);}
 }
 assert.equal(b.run('modalOpen'),false);
});
test('ordinary conversations autosave before dismissal and survive a new runtime',()=>{
 let b=boot();start(b);b.run('A.chat(2)');assert.equal(b.run('E().energy'),3);b=reload(b);b.run('drain()');b=reload(b);
 assert.equal(b.run('byId(2).voiceVisits'),1);assert.equal(b.run('E().energy'),3);
});
test('coronation fields and selection input resume without regenerating people',()=>{
 let b=boot();b.run("$('#f-name').value='明';$('#f-era').value='长安';A.start()");b=reload(b);b.run('choose(1)');b=reload(b);assert.equal(b.run('S.cands.length'),7);assert.equal(b.run('E().era'),'长安');
 b.run('A.xxTake(S.cands[0].id)');b=reload(b);b.run('choose(1)');b=reload(b);
});
test('an unfinished birth-name draft survives closing the browser before confirmation',()=>{
 let b=boot();start(b);b.run('byId(2).preg=9;byId(2).swapRisk=false;A.endMonth()');assert.ok(b.run('!!curEv.input'));
 b.run("PalaceActions.keepInput('和宁')");b=reload(b);assert.equal(b.run("$('#minput').value"),'和宁');b.run('choose(0)');b=reload(b);assert.ok(b.run("S.children.some(k=>k.name.includes('和宁'))"));
});
for(const seed of [101,202,303,404])test(`seed ${seed}: 36 months with a cold reload at every event boundary`,()=>{
 let b=boot(seed);start(b);
 for(let m=0;m<36&&!b.run('S.over');m++){
   b.run('A.endMonth()');b=reload(b);
   for(let n=0;b.run('modalOpen')&&n<100;n++){
     b.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()))');b=reload(b);
   }
   assert.equal(b.run('modalOpen'),false);
 }
});
test('manual saves retain pending scenes; unavailable storage leaves the game playable',()=>{
 const b=boot();start(b);b.run("A.out('spa');A.save('1')");const before=snapshot(b);b.run("choose(0);A.load('1')");assert.equal(snapshot(b),before);
 b.run("localStorage.setItem=()=>{throw Error('quota')};drain()");const energy=b.run('E().energy');
 b.run("A.chat(2);drain()");assert.ok(b.messages.some(s=>s.includes('尚未写入')));
 assert.equal(b.run('E().energy'),energy-1);assert.equal(b.run('byId(2).voiceVisits'),1);assert.match(b.run("renderTop();$('#top').innerHTML"),/未能存档 · 下载备份/);
});
test('pending save data cannot replay storage actions',()=>{
 const b=boot();start(b);b.run('A.endMonth()');assert.equal(b.run("PalaceActions.valid({...PalaceActions.payload().pendingActions,steps:[{name:'undoImport',args:[],rolls:[],answers:[],saves:[],ui:{}}]})"),false);
});
test('a failed write keeps the paid choice once and saves it when storage returns',()=>{
 const b=boot();start(b);b.run('A.gift(2)');const before=b.run('E().treasury');
 b.run("var write=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};choose(0)");
 assert.equal(b.run('E().treasury'),before-20);assert.ok(b.run('!!modalResult'));b.run('choose(0)');assert.equal(b.run('E().treasury'),before-20);
 b.run('localStorage.setItem=write;nextEv()');assert.equal(b.run('lastAutoSaveError'),'');reload(b);
});
test('a save edited in another tab still rolls back instead of being overwritten',()=>{
 const b=boot();start(b);b.run('A.gift(2)');const before=b.run('E().treasury'),key='chengongji_v1_auto';
 const other=JSON.parse(b.storage.get(key));other.emp.treasury=1;b.storage.set(key,JSON.stringify(other));const raw=b.storage.get(key);
 b.run('choose(0)');assert.equal(b.run('E().treasury'),before);assert.equal(b.run('curEv.title'),'赏赐');assert.equal(b.storage.get(key),raw);
 assert.ok(b.messages.some(s=>s.includes('另一标签页')));
});
test('year snapshots include pending scenes and direct map arrival resumes in a new runtime',()=>{
 let b=boot();start(b);b.run("arrive(PLACES.find(p=>p.id==='kn'))");b=reload(b);assert.equal(b.run('curEv.scene'),'palace-arrival');b.run('choose(1);drain();S.month=12;A.endMonth()');
 assert.ok(b.run("JSON.parse(localStorage.getItem(SKEY+'auto:snapshots'))[0].raw.includes('pendingActions')"));
 const state=b.run("SaveManager.restore(localStorage,SKEY+'auto',0,validPalaceSave,migratePalaceSave)");
 const n=boot(88);n.storage.set('chengongji_v1_auto',JSON.stringify(state));n.run("A.load('auto')");assert.equal(n.run('curEv.title'),'岁首');assert.ok(!n.messages.some(m=>m.includes('无法在当前版本续接')));
});
test('an incompatible pending transcript is retained and cannot be overwritten by autosave',()=>{
 const b=boot();start(b);b.run('A.endMonth()');const key='chengongji_v1_auto',data=JSON.parse(b.storage.get(key));data.pendingActions.version=999;b.storage.set(key,JSON.stringify(data));
 const n=boot(1,b.storage);n.run("A.load('auto')");assert.equal(n.run('PalaceActions.blocked'),true);const raw=n.storage.get(key);
 n.run("A.go('sys');save('auto')");assert.equal(n.storage.get(key),raw);assert.equal(n.run('PalaceActions.payload().pendingActions.version'),999);
});
test('spa pricing and all four garden descriptions agree with actual effects',()=>{
 for(let month=1;month<=12;month+=3){const b=boot();start(b);b.run(`S.month=${month};S.consorts=[]`);b.force(.95);b.run("A.out('garden')");assert.match(b.run('curEv.text'),/^(春日融融，百花争艳。|荷风送香，蝉鸣阵阵。|丹桂飘香，层林尽染。|红梅映雪，暗香浮动。)你独自/);}
 const b=boot();start(b);const money=b.run('E().treasury');b.run("A.out('spa')");assert.equal(money-b.run('E().treasury'),60);assert.match(b.run('viewOut()'),/国库-60万两/);
});
test('old companions stay familiar; new arrivals and anniversaries respect actual time',()=>{
 const b=boot();start(b);assert.equal(b.run('consortVoicePhase(byId(2))'),'familiar');
 assert.equal(b.run("delete byId(2).knownBeforeAccession;consortVoicePhase(byId(2))"),'familiar');
 assert.equal(b.run("var newcomer=makeGirl();addConsort(newcomer,1,'入宫');consortVoicePhase(newcomer)"),'first');
 b.run('newcomer.enteredAt=0;newcomer.enteredMonth=3;S.turn=12;S.month=3');assert.match(b.run('oldKeepsakeEvent(newcomer).text'),/入宫的月份/);
 b.run('S.turn=13;S.month=4');assert.doesNotMatch(b.run('oldKeepsakeEvent(newcomer).text'),/入宫的月份|第一次见面/);
});
test('emotions preserve six distinct voices; shared moments respect grief and monthly pacing',()=>{
 const b=boot();start(b);for(const mood of ['悲恸','惶恐','怨恨'])assert.equal(b.run(`new Set(['骄纵','城府','将门','活泼','好学','温婉'].map(trait=>{var c=byId(2);c.trait=trait;return consortEmotionalVoice(c,'${mood}').lines[0]})).size`),6);
 assert.equal(b.run("recordSharedMoment(byId(2),'悲恸')"),'');assert.ok(b.run("recordSharedMoment(byId(2),'平和')"));assert.equal(b.run("recordSharedMoment(byId(2),'平和')"),'');
 b.run("S.turn+=6;recordSharedMoment(byId(2),'平和')");assert.equal(b.run('byId(2).sharedMoments.items.length'),2);
});
test('unanswered personal invitations resolve naturally while accepted promises stay',()=>{
 const b=boot();start(b);b.run("var c=byId(2);c.personalExperiences={seen:{},history:[],current:{id:'life01',stage:'offered',offered:0}};S.turn=12;personalExperienceTick()");assert.equal(b.run('c.personalExperiences.current'),undefined);assert.equal(b.run('c.personalExperiences.history[0].outcome'),'自行完成');
 b.run("c.personalExperiences.current={id:'life02',stage:'working',offered:0,due:3};S.turn=100;personalExperienceTick()");assert.equal(b.run('c.personalExperiences.current.stage'),'working');
});
test('love keepsakes follow personality and legacy chapters retain their established token',()=>{
 const b=boot();start(b);assert.equal(b.run("new Set(['骄纵','城府','将门','活泼','好学','温婉'].map(trait=>{var c=byId(2);c.trait=trait;c.arc={id:'love',st:0,f:{}};return loveToken(c,c.arc.f).name})).size"),6);
 assert.equal(b.run("var c=byId(2);c.trait='将门';c.arc={id:'love',st:1,f:{}};loveToken(c,c.arc.f).name"),'鸳鸯帕');
 b.run("c.arc={id:'love',st:2,f:{token:'direct',wait:1,shared:true}};c.nights=3;c.aff=20");assert.doesNotMatch(b.run('ARCS.love.stages[2](c,c.arc.f).text'),/温和/);
});
