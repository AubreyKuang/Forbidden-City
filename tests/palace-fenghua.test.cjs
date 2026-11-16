const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const keys=['shangguanLantai','gaoHuaibi','jiShuye','xueHongjian','sunYunxiu','liuZhaoshuang'];
function game(storage){const b=boot(432,storage);b.ctx.assert=assert;if(!storage)b.run(`A.start();drain();E().energy=10;E().treasury=900;S.turn=60;S.year=6;S.month=1;PalaceActions.reset();`);return b;}
function reload(b){const c=game(b.storage);c.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);return c;}

test('five fixed guests are separate from Hongjian and other plot consorts and viewing does not create people or roll',()=>{
 const b=game();b.run(`var before=JSON.stringify(S);Math.random=()=>{throw Error('view rolled')};
 var html=fenghuaCodex();assert.equal((html.match(/data-fenghua=/g)||[]).length,6);assert.match(html,/不入后宫/);assert.doesNotMatch(html,/undefined|NaN/);
 assert.match(storyConsortCodex(),/赵令仪/);assert.doesNotMatch(storyConsortCodex(),/上官兰台/);assert.match(storyConsortCodex(),/薛红笺/);assert.doesNotMatch(html,/data-fenghua="xueHongjian"/);
 assert.equal(JSON.stringify(S),before);assert.equal(fenghuaAll().length,0);
 for(var d of Object.values(FENGHUA_PEOPLE))for(var pool of [ALL_CONSORT_PORTRAITS,ALL_OFFICIAL_PORTRAITS,EMPEROR_PORTRAITS,BROTHER_PORTRAITS])assert.ok(!pool.includes(d.portrait));`);
});

test('recruitment and military audience use real entry requirements, costs and refusal cooldowns',()=>{
 const b=game();b.run(`var e=E().energy,t=E().treasury;A.fenghuaMeet('gaoHuaibi');assert.equal(E().energy,e);assert.equal(modalOpen,false);
 E().treasury=9;A.fenghuaMeet('shangguanLantai');assert.equal(modalOpen,false);E().treasury=t;
 A.fenghuaMeet('shangguanLantai');assert.equal(E().energy,e-1);assert.equal(E().treasury,t-10);choose(1);drain();
 assert.equal(fenghuaPerson('shangguanLantai'),undefined);assert.equal(fenghuaEntryReady('shangguanLantai'),false);
 S.turn+=6;A.fenghuaMeet('shangguanLantai');choose(0);drain();assert.equal(fenghuaPerson('shangguanLantai').name,'上官兰台');
 S.flags.lastMilitaryMerit=S.turn-25;assert.equal(fenghuaEntryReady('gaoHuaibi'),false);S.flags.lastMilitaryMerit=S.turn;
 A.fenghuaMeet('gaoHuaibi');choose(0);drain();assert.equal(fenghuaPerson('gaoHuaibi').name,'高怀璧');assert.equal(fenghuaEntryReady('gaoHuaibi'),false);`);
});

for(const key of keys)test(key+' keeps a unique identity, exclusive portrait, disposition and role after reload',()=>{
 let b=game();b.run(`var p=createFenghuaPerson('${key}');assert.equal(createFenghuaPerson('${key}'),p);assert.equal(p.sex,undefined);
 assert.equal(portraitCell(p),FENGHUA_PEOPLE['${key}'].portrait);assignCourtOfficialPortrait(p,'army');assert.equal(portraitCell(p),FENGHUA_PEOPLE['${key}'].portrait);
 assert.ok(!S.consorts.includes(p)&&!S.children.includes(p));assert.equal(fenghuaAll().filter(x=>x.fenghuaKey==='${key}').length,1);
 UI.sel='${key}';assert.doesNotMatch(viewFenghuaPerson(),/undefined|NaN/);assert.match(viewFenghuaPerson(),/palace-fenghua-people.webp/);save('auto');`);
 b=reload(b);b.run(`var p=fenghuaPerson('${key}');assert.equal(p.name,FENGHUA_PEOPLE['${key}'].name);assert.equal(p.temperament,FENGHUA_PEOPLE['${key}'].temperament);p.alive=false;assert.equal(createFenghuaPerson('${key}'),p);assert.equal(fenghuaAll().length,1);`);
});

for(const key of keys)for(const branch of [0,1])test(key+' branch '+branch+' resumes every chapter before and after its decision',()=>{
 let b=game();b.run(`createFenghuaPerson('${key}');`);
 for(let stage=0;stage<4;stage++){
  b.run(`S.turn+=3;E().energy=10;PalaceActions.reset();A.fenghuaVisit('${key}');assert.equal(modalOpen,true);assert.ok(curEv.title.includes(FENGHUA_PEOPLE['${key}'].name));save('auto');`);
  const snapshot=b.run('JSON.stringify(S)'),title=b.run('curEv.title');
  b=reload(b);assert.equal(b.run('curEv.title'),title);assert.equal(b.run('JSON.stringify({...S,savedAt:undefined,saveVersion:undefined})'),JSON.stringify({...JSON.parse(snapshot),savedAt:undefined,saveVersion:undefined}));
  b.run(`choose(${key==='liuZhaoshuang'&&stage===0&&branch===1?2:branch});assert.ok(modalResult);save('auto');`);
  b=reload(b);b.run(`assert.ok(modalResult);drain();assert.equal(fenghuaPerson('${key}').fenghua.stage,${Math.min(stage+1,3)});`);
 }
 b.run(`var p=fenghuaPerson('${key}');assert.equal(p.story.length,5);assert.equal(p.story.filter(s=>s.thread==='fenghua:'+p.id).length,5);`);
});

for(const key of ['jiShuye','xueHongjian','sunYunxiu','liuZhaoshuang'])test(key+' city encounter and refusal replay without a duplicate or an extra draw',()=>{
 let b=game();b.run(`fenghuaState();for(var key of Object.keys(FENGHUA_PEOPLE))if(key!=='${key}')S.fenghua.attempts[key]=S.turn;PalaceActions.reset();`);b.force(0,0);
 b.run(`A.out('city');assert.equal(curEv.title,FENGHUA_PEOPLE['${key}'].name+' · 初识');save('auto');`);b=reload(b);
 b.run(`choose(0);save('auto');`);b=reload(b);b.run(`drain();assert.equal(fenghuaAll().length,1);assert.equal(fenghuaPerson('${key}').name,FENGHUA_PEOPLE['${key}'].name);`);
});

for(const change of ['p.alive=false','p.away=true','p.exiled=true','p.dismissed=true','p.commission={}','p.fenghua.awayUntil=S.turn+2'])test('unavailable guest cannot be summoned or finish a stale scene: '+change,()=>{
 const b=game();b.run(`var p=createFenghuaPerson('gaoHuaibi'),ev=fenghuaStoryEvent(p),n=p.story.length,energy=E().energy;${change};
 assert.equal(ev.choices[0].f(),null);A.fenghuaVisit('gaoHuaibi');assert.equal(E().energy,energy);assert.equal(p.story.length,n);assert.equal(modalOpen,false);`);
});

for(const [key,stage] of [['gaoHuaibi',0],['jiShuye',2],['xueHongjian',1],['sunYunxiu',1]])test(key+' paid choice cannot overspend or reward twice',()=>{
 const b=game();b.run(`var p=createFenghuaPerson('${key}');p.fenghua.stage=${stage};E().treasury=0;var ev=fenghuaStoryEvent(p),n=p.story.length;
 assert.equal(ev.choices[0].cond(),false);assert.equal(ev.choices[0].f(),null);assert.equal(p.story.length,n);E().treasury=100;
 ev.choices[0].f();var after=JSON.stringify(S);assert.equal(ev.choices[0].f(),null);assert.equal(JSON.stringify(S),after);assert.ok(E().treasury>=0&&E().treasury<100);`);
});

test('teaching applies to an eligible actual child; daily invitees do not hear unchosen scenes',()=>{
 const b=game();b.run(`var mother=harem()[0],k=makeKid(mother,'f','昭宁');k.pendingName=false;k.born=S.turn-15*12;k.away=false;
 var p=createFenghuaPerson('jiShuye');p.fenghua.stage=3;var ev=fenghuaDailyEvent(p),n=k.story.length,lit=k.lit;
 ev.choices[0].f();assert.equal(k.story.length,n);assert.equal(k.lit,lit);
 var ev=fenghuaDailyEvent(p);ev.choices.find(x=>x.t.includes('来听讲')).f();assert.equal(k.lit,Math.min(100,lit+2));assert.ok(k.story.some(x=>x.thread==='fenghua:'+p.id));
 var ev=fenghuaDailyEvent(p),n=k.story.length;k.away=true;assert.equal(ev.choices.find(x=>x.t.includes('来听讲')).f(),null);assert.equal(k.story.length,n);`);
});

test('private stationery conversation does not reach the consort when no letter is sent',()=>{
 const b=game();b.run(`var c=fenghuaLady(),p=createFenghuaPerson('xueHongjian');p.fenghua.stage=2;var n=c.story.length;fenghuaStoryEvent(p).choices[1].f();assert.equal(c.story.length,n);
 p.fenghua.stage=3;var n=c.story.length;fenghuaDailyEvent(p).choices.find(x=>x.t.includes('素笺')).f();assert.equal(c.story.length,n);`);
});

test('the military hero uses one real officer and the existing military appointment and marriage systems',()=>{
 const b=game();b.run(`var p=createFenghuaPerson('gaoHuaibi'),key='scholar:'+p.id;assert.equal(S.scholars.filter(x=>x===p).length,1);assert.ok(!S.fenghua?.people.includes(p));
 assert.equal(courtPerson(key).bloc,'army');assert.equal(careerPeople().find(x=>x.p===p).bloc,'army');assert.ok(officialMilitary(p));assert.equal(p.education,null);
 assert.equal(careerKin(courtPerson(key)).length,0);assert.ok(!viewMinistries().includes('高怀璧'));UI.sel=p.id;assert.doesNotMatch(viewScholar(),/科举出身|殿试策论/);
 assert.ok(!ministryCandidates('war').some(x=>x.p===p));S.turn+=24;p.merit=50;
 assert.ok(ministryCandidates('war').some(x=>x.p===p));for(var id of ['rites','revenue','works','justice','personnel'])assert.ok(!ministryCandidates(id).some(x=>x.p===p));
 assert.equal(officialMarriageRef(courtPerson(key)).id,p.id);A.scholarTalk(p.id);assert.ok(curEv.title.includes('高怀璧'));assert.doesNotMatch(curEv.text,/undefined|科举/);`);
});

test('the physician schedules one follow-up and preserves postpartum rest and conception gates',()=>{
 let b=game();b.run(`var c=harem()[0];beginConsortRecovery(c,'birth');c.mood=30;var p=createFenghuaPerson('sunYunxiu');p.fenghua.stage=2;
 fenghuaStoryEvent(p).choices[0].f();assert.equal(p.fenghua.followup.patient,c.id);S.flags.testPatient=c.id;S.flags.restUntil=c.recovery.until;save('auto');`);
 b=reload(b);b.run(`var p=fenghuaPerson('sunYunxiu'),c=byId(S.flags.testPatient),n=p.story.length,mood=c.mood;S.turn++;fenghuaLifeTick();assert.equal(c.mood,mood);
 S.turn++;fenghuaLifeTick();assert.equal(c.mood,mood+5);assert.equal(c.recovery.until,S.flags.restUntil);assert.ok(consortNightReason(c));assert.equal(p.story.length,n+1);
 fenghuaLifeTick();assert.equal(p.story.length,n+1);assert.equal(c.mood,mood+5);`);
});

test('deceased or departed patients and a succeeding emperor receive no scheduled healing',()=>{
 for(const change of ['c.alive=false','c.cold=true','c.gone=true']){const b=game();b.run(`var c=harem()[0];beginConsortRecovery(c,'birth');var p=createFenghuaPerson('sunYunxiu');p.fenghua.stage=2;fenghuaStoryEvent(p).choices[0].f();${change};var mood=c.mood;S.turn+=2;fenghuaLifeTick();assert.equal(c.mood,mood);`);}
 const b=game();b.run(`var p=createFenghuaPerson('sunYunxiu');p.fenghua.followup={patient:'emp',gen:S.gen,due:S.turn+2};S.gen++;S.turn+=2;E().health=40;fenghuaLifeTick();assert.equal(E().health,40);`);
});

test('departure has a real return date and personal chronicle threads work with string identities',()=>{
 const b=game();b.run(`var p=createFenghuaPerson('jiShuye');p.fenghua.stage=2;fenghuaStoryEvent(p).choices[0].f();assert.equal(fenghuaPresent(p),false);S.turn+=2;assert.equal(fenghuaPresent(p),false);S.turn++;assert.equal(fenghuaPresent(p),true);
 UI.view='fenghua';UI.sel='jiShuye';A.chronicleThread(S.gen+':'+p.id,1);assert.equal(UI.chronicleFilters[S.gen+':'+p.id].thread,'fenghua:'+p.id);
 assert.ok(chroniclePersonLink({id:p.id,name:p.name}).includes("A.go('fenghua','jiShuye')"));assert.match(viewFenghuaPerson(),/回看前因与后续/);`);
});

test('a genuine version 21 pending scene resumes its old world before enabling version 22',()=>{
 const fixture=require('./fixtures/fenghua-legacy-v21.json'),b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture)]]));
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,21);assert.equal(fenghuaActive(),false);assert.equal(S.fenghua,undefined);drain();assert.equal(PalaceActions.contentVersion,32);assert.equal(fenghuaActive(),true);`);
});

for(const key of ['shangguanLantai','gaoHuaibi'])test(key+' first audience reloads before and after admission',()=>{
 let b=game();b.run(`S.flags.lastMilitaryMerit=S.turn;A.fenghuaMeet('${key}');save('auto');`);b=reload(b);b.run(`choose(0);save('auto');`);b=reload(b);b.run(`drain();assert.equal(fenghuaAll().filter(p=>p.fenghuaKey==='${key}').length,1);`);
});

test('military roster filters and origin labels retain the real officer rather than a civil scholar',()=>{
 const b=game();b.run(`var p=createFenghuaPerson('gaoHuaibi');UI.officialsBloc='army';assert.match(officialsTable(),/高怀璧/);assert.match(officialsTable(),/军功入仕/);UI.officialsBloc='civil';assert.doesNotMatch(officialsTable(),/高怀璧/);
 assert.equal(portraitCell({personId:p.id,official:3,artPortrait:436}),436);`);
});

test('ended reigns retain the codex and existing chronicles without allowing a new audience',()=>{
 const b=game();b.run(`var p=createFenghuaPerson('shangguanLantai');S.over=true;assert.equal(fenghuaVisitReady(p),false);assert.match(fenghuaCodex(),/上官兰台/);assert.match(viewHome(),/风华人物/);`);
});

test('letter recipients remember the received letter without learning its private drafting conversation',()=>{
 const b=game();b.run(`var c=fenghuaLady(),p=createFenghuaPerson('xueHongjian');p.fenghua.stage=2;var n=c.story.length;fenghuaStoryEvent(p).choices[0].f();var added=c.story.slice(n);assert.equal(added.length,1);assert.match(added[0].t,/收到陛下/);assert.doesNotMatch(JSON.stringify(added),/迟迟不肯下笔|换个名字/);`);
});

test('shared scenes need the actual known guest; teaching does not manufacture a child',()=>{
 const b=game();b.run(`S.children=[];var p=createFenghuaPerson('shangguanLantai');p.fenghua.stage=1;fenghuaStoryEvent(p).choices[0].f();assert.equal(S.children.length,0);assert.match(p.story.at(-1).t,/教材/);
 var x=createXieAn(),ev=fenghuaStoryEvent(p),n=x.story.length;x.away=true;assert.equal(ev.choices[0].f(),null);assert.equal(x.story.length,n);x.away=false;fenghuaStoryEvent(p).choices[0].f();assert.equal(x.story.length,n+1);assert.ok(p.fenghua.friends.includes(x.id));`);
});

test('Jinyiwei receives a pending clue only while a serving commander exists',()=>{
 let b=game();b.run(`A.establishJinyiwei();choose(0);drain();var p=createFenghuaPerson('liuZhaoshuang');A.fenghuaVisit('liuZhaoshuang');choose(1);save('auto');`);b=reload(b);
 b.run(`assert.match(S.jinyiwei.commander.story.at(-1).t,/可核实线索/);assert.ok(!(S.palaceCases||[]).some(x=>x.culprit==='liuZhaoshuang'));drain();var p=fenghuaPerson('liuZhaoshuang');p.fenghua.stage=0;S.jinyiwei.commander.dismissed=true;assert.equal(fenghuaStoryEvent(p).choices[1].cond(),false);`);
});

for(const [scene,fixture] of Object.entries(require('./fixtures/fenghua-legacy-v22.json')))test('published version 22 '+scene+' resumes without adding a guest or changing its draws',()=>{
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(fixture)]]));b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,22);assert.equal(fenghuaActive(),false);assert.equal(S.fenghua,undefined);`);
 assert.equal(b.run('curEv.title'),fixture.pendingActions.pending.title);
 b.run(`drain();assert.equal(PalaceActions.contentVersion,32);assert.equal(fenghuaActive(),true);assert.equal(PalaceActions.blocked,false);`);
});
