const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(storage){const b=boot(826,storage);b.ctx.assert=assert;if(!storage)b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=20;E().treasury=900;PalaceActions.reset();var p=createFenghuaPerson('xueHongjian');`);return b;}
function reload(b){const x=world(b.storage);x.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var p=fenghuaPerson('xueHongjian');`);return x;}
function admit(){const b=world();b.run(`p.fenghua.stage=3;A.hongjianInvite();choose(0);drain();`);return b;}

test('detailed biographies are read-only and Hongjian is only in the plot-consort catalogue',()=>{
 const b=world();b.run(`var before=JSON.stringify(S);Math.random=()=>{throw Error('read rolled')};var code=storyConsortCodex(),guests=fenghuaCodex();
 assert.match(code,/data-story-consort="hongjian"/);assert.match(code,/赵令仪/);assert.doesNotMatch(guests,/data-fenghua="xueHongjian"/);
 for(var key of Object.keys(FENGHUA_PEOPLE)){var html=fenghuaGuide(key,fenghuaPerson(key));assert.ok(html.length>400);assert.equal((html.match(/<li>/g)||[]).length,3);}
 assert.match(code,/嫔位及以上/);assert.match(code,/14万两/);assert.doesNotMatch(code,/undefined|NaN/);assert.equal(JSON.stringify(S),before);`);
});

for(const stage of [0,1,2])test('asking before outside chapter '+stage+' finishes cannot admit or skip it',()=>{
 let b=world();b.run(`p.fenghua.stage=${stage};A.hongjianInvite();assert.equal(curEv.title,'薛红笺 · 再相识一些');save('auto');`);b=reload(b);
 b.run(`choose(0);save('auto');`);b=reload(b);b.run(`drain();assert.equal(p.fenghua.stage,${stage});assert.equal(p.hongjian,undefined);assert.ok(!S.consorts.includes(p));assert.equal(hongjianCanInvite(p),false);`);
});

test('completed old guest becomes one real consort with the same portrait and all previous choices',()=>{
 let b=world();b.run(`for(var n=0;n<3;n++)fenghuaStoryEvent(p).choices[0].f();S.flags.oldHongjian=p.id;S.flags.oldHongjianStories=p.story.length;var old=p;
 A.hongjianInvite();save('auto');`);b=reload(b);b.run(`choose(0);assert.equal(typeof p.id,'number');assert.equal(portraitCell(p),438);save('auto');`);b=reload(b);
 b.run(`drain();assert.ok(S.consorts.includes(p));assert.ok(!S.fenghua.people.some(x=>x.fenghuaKey==='xueHongjian'));assert.equal(p.hongjian.previousId,S.flags.oldHongjian);
 assert.ok(p.story.length>=S.flags.oldHongjianStories+2);assert.equal(p.fenghua.stage,3);assert.ok(p.fenghua.shopIndependent);assert.equal(p.arc.id,'hongjian');assert.equal(p.hobby,'读书');assert.equal(p.wound,'hongjian');assert.equal(p.trait,'聪慧');
 assert.equal(fenghuaAll().filter(x=>x.fenghuaKey==='xueHongjian').length,1);assert.ok(p.mem);assert.equal(hongjianCanInvite(p),false);
 assert.ok(chroniclePersonLink({id:S.flags.oldHongjian,name:p.name}).includes('xueHongjian'));UI.sel=p.id;assert.doesNotMatch(viewConsort(),/undefined|NaN/);assert.match(viewConsort(),/红笺入宫/);`);
});

test('admission callbacks cannot duplicate a consort, and deferral preserves the outside life',()=>{
 const b=world();b.run(`p.fenghua.stage=3;var ev=hongjianInvitationEvent(p),before=S.consorts.length;ev.choices[1].f();assert.equal(S.consorts.length,before);assert.equal(p.hongjian,undefined);
 var ev=hongjianInvitationEvent(p);ev.choices[0].f();var after=JSON.stringify(S);assert.equal(ev.choices[0].f(),null);assert.equal(JSON.stringify(S),after);assert.equal(S.consorts.length,before+1);`);
});

test('rank-cap fallback, age and real consent conditions are enforced',()=>{
 const b=world();b.run(`p.fenghua.stage=3;RANK_CAP[3]=rankCount(3);assert.equal(hongjianAdmissionRank(),2);var ev=hongjianInvitationEvent(p);ev.choices[0].f();assert.equal(p.rank,2);`);
 for(const change of ['p.alive=false','p.away=true','p.age=17','E().age=17']){const b=world();b.run(`p.fenghua.stage=3;var ev=hongjianInvitationEvent(p),n=S.consorts.length;${change};assert.equal(ev.choices[0].f(),null);assert.equal(S.consorts.length,n);`);}
 const c=world();c.run(`p.fenghua.stage=3;RANK_CAP[3]=rankCount(3);RANK_CAP[2]=rankCount(2);A.hongjianInvite();assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);`);
});

for(const branch of [0,1])test('all six palace chapters and ongoing visits resume before and after choice '+branch,()=>{
 let b=admit();for(let stage=0;stage<7;stage++){
  b.run(`S.turn+=3;E().energy=20;PalaceActions.reset();A.hongjianStory(p.id);assert.ok(modalOpen);save('auto');`);b=reload(b);
  const title=b.run('curEv.title');b.run(`choose(${branch});assert.ok(modalResult);save('auto');`);b=reload(b);assert.equal(b.run('curEv.title'),title);
  b.run(`drain();assert.equal(p.arc.st,${Math.min(stage+1,6)});`);
 }
 b.run(`assert.equal(p.arc.done,true);assert.equal(p.arc.end,'红笺有归处');assert.equal(p.story.filter(s=>s.thread==='hongjian:'+p.id).length,7);assert.match(storyConsortCodex(),/已入宫/);`);
});

test('the existing monthly arc scheduler presents the same guarded palace story',()=>{
 const b=admit();b.run(`S.consorts.filter(c=>c!==p).forEach(c=>c.arc.done=true);S.turn+=3;var ev=arcTick();assert.equal(ev.title,'红笺入宫 · 算盘与宫牌');pushEv(ev);choose(0);drain();assert.equal(p.arc.st,1);assert.equal(p.arc.t,S.turn+3);`);
});

for(const change of ['p.alive=false','p.gone=true','p.cold=true','p.templeStay={}','p.homeLeave={}'])test('palace plot and income both stop for an unavailable consort: '+change,()=>{
 const b=admit();b.run(`p.rank=4;S.turn+=3;var ev=hongjianPalaceEvent(p),n=p.story.length;${change};assert.equal(ev.choices[0].f(),null);assert.equal(p.story.length,n);assert.equal(hongjianMonthlyIncome(p),0);assert.equal(hongjianPalaceEvent(p),null);`);
});

for(const [rank,expected] of [[2,0],[3,0],[4,8],[5,8],[8,8]])test('actual rank '+rank+' determines the monthly income threshold',()=>{
 const b=admit();b.run(`p.rank=${rank};assert.equal(hongjianMonthlyIncome(p),${expected});p.hongjian.procurement='compare';p.hongjian.relief='credit';assert.equal(hongjianMonthlyIncome(p),${expected?14:0});`);
});

test('monthly income is paid once, included in the actual month review and stable through cold reload',()=>{
 let b=admit();b.run(`p.rank=4;p.hongjian.procurement='compare';p.hongjian.relief='credit';S.flags.incomeStart=E().treasury;S.flags.incomeBase=Math.round(45+E().people*1.1+(S.flags.canal?25:0));A.endMonth();save('auto');`);b=reload(b);
 b.run(`assert.equal(p.hongjian.totalIncome,14);assert.equal(p.hongjian.receipts.length,1);assert.equal(S.flags.lastMonthReview.hongjianIncome,14);
 assert.equal(S.flags.lastMonthReview.inc,S.flags.incomeBase+14);assert.match(viewLog(),/薛红笺经营增益 14/);var before=E().treasury;hongjianPanel(p);viewHome();assert.equal(E().treasury,before);drain();save('auto');`);b=reload(b);
 b.run(`assert.equal(p.hongjian.totalIncome,14);assert.equal(p.hongjian.receipts.length,1);`);
});

test('a repeated settlement in the same month cannot create another receipt',()=>{
 const b=admit();b.run(`p.rank=4;assert.equal(settleHongjianIncome(),8);assert.equal(settleHongjianIncome(),0);assert.equal(p.hongjian.totalIncome,8);assert.equal(p.hongjian.receipts.length,1);S.turn++;assert.equal(settleHongjianIncome(),8);p.rank=3;S.turn++;assert.equal(settleHongjianIncome(),0);p.rank=4;assert.equal(settleHongjianIncome(),8);`);
});

test('independent review pauses money, then deliberately restores it without skipping a chapter',()=>{
 const b=admit();b.run(`p.rank=4;p.arc.st=2;hongjianPalaceEvent(p).choices[1].f();assert.equal(p.hongjian.paused,true);assert.equal(hongjianMonthlyIncome(p),0);A.hongjianAccounts(p.id);assert.equal(modalOpen,false);
 S.turn+=3;A.hongjianAccounts(p.id);choose(1);drain();assert.equal(p.hongjian.paused,false);assert.equal(p.arc.st,3);assert.equal(hongjianMonthlyIncome(p),8);`);
});

test('relief money has a balance guard and its choice cannot reward twice',()=>{
 const b=admit();b.run(`p.arc.st=3;E().treasury=14;var ev=hongjianPalaceEvent(p),n=p.story.length;assert.equal(ev.choices[0].cond(),false);assert.equal(ev.choices[0].f(),null);assert.equal(p.story.length,n);E().treasury=100;ev.choices[0].f();assert.equal(E().treasury,85);var state=JSON.stringify(S);assert.equal(ev.choices[0].f(),null);assert.equal(JSON.stringify(S),state);`);
});

test('rumor witnesses and the arithmetic student are the real available people',()=>{
 const b=admit();b.run(`p.arc.st=2;var ev=hongjianPalaceEvent(p),other=ev.cast.find(x=>x!==p);assert.ok(other);var n=other.story.length;ev.choices[0].f();assert.equal(other.story.length,n+1);
 var k=makeKid(p,'f','明珠');k.pendingName=false;k.born=S.turn-14*12;p.arc.st=4;var lit=k.lit;hongjianPalaceEvent(p).choices[0].f();assert.equal(k.lit,Math.min(100,lit+4));assert.ok(k.story.some(s=>s.thread==='hongjian:'+p.id));
 p.arc.st=4;var ev=hongjianPalaceEvent(p),n=k.story.length;k.away=true;assert.equal(ev.choices[0].f(),null);assert.equal(k.story.length,n);S.children=[];hongjianPalaceEvent(p).choices[0].f();assert.equal(S.children.length,0);`);
});

test('old biographies and admission references survive succession without admitting the same woman to her child',()=>{
 const b=admit();b.run(`var id=p.id,old=p.hongjian.previousId,k=makeKid(p,'m','明珩');k.pendingName=false;k.born=S.turn-20*12;inheritDowager(k);S.consorts=[];S.gen++;
 var archived=fenghuaPerson('xueHongjian');assert.equal(archived.id,id);assert.equal(createFenghuaPerson('xueHongjian'),archived);assert.equal(hongjianMonthlyIncome(archived),0);assert.equal(hongjianCanInvite(archived),false);assert.match(storyConsortCodex(),/前朝经历/);UI.sel='xueHongjian';assert.match(viewFenghuaPerson(),/前朝经历/);
 S.previousCourts=[];assert.equal(fenghuaPerson('xueHongjian'),S.retainedFamilies.find(c=>c.id===id));assert.equal(fenghuaEntryReady('xueHongjian'),false);S.retainedFamilies=[];assert.equal(createFenghuaPerson('xueHongjian'),null);assert.match(storyConsortCodex(),/旧事存于起居注/);`);
});

for(const [scene,fixture] of Object.entries(require('./fixtures/hongjian-legacy-v25.json')))test('genuine version 25 '+scene+' finishes unchanged before enabling admission',()=>{
 let b=world(new Map([['chengongji_v1_auto',JSON.stringify(fixture)]]));b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,25);assert.equal(hongjianContent(),false);`);assert.equal(b.run('curEv.title'),fixture.pendingActions.pending.title);
 b.run(`drain();assert.equal(PalaceActions.contentVersion,53);assert.equal(hongjianContent(),true);assert.equal(PalaceActions.blocked,false);`);
});
