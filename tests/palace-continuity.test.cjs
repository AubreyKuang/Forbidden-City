const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(){const b=boot(202);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=36;S.year=4;S.month=5;E().energy=4;E().treasury=800;
 var a=harem()[0],b=harem()[1],helper=makeGirl({sur:'沈',given:'知微',trait:'巧手'});addConsort(helper,3,'入宫');
 for(var p of [a,b,helper]){p.preg=0;p.cold=false;p.gone=false;p.hp=90;}
 var work={year:S.year,gen:S.gen,stage:'review',tables:a.id,gifts:b.id,helper:helper.id,helperRole:'tables',issue:'漏记帮手'};`);return b;}
const startDuty=`finishDuanwu(work,'照例办结');var t=continuityThreads()[0];S.turn=t.due;`;
const startFamily=`a.fam={t:'镇国大将军',p:65};delete a.house;var h=houseOf(a),p=h.father,entry={c:a,p,role:'father'};
 startOfficialContinuity(entry,'setback','巡边整饬军备');var t=continuityThreads()[0];S.turn=t.due;`;
const startChild=`var k=makeKid(a,'m','承安');k.born=S.turn-8*12;k.temperament='好奇';a.trait='将门';
 recordFamilyTime(k,a,'练习投壶','和母亲练习投壶。','和孩子练习投壶。');var t=continuityThreads()[0];S.turn=t.due;`;
function restore(b){const n=boot(999,b.storage);n.ctx.assert=assert;n.run("A.load('auto')");assert.equal(n.run('PalaceActions.blocked'),false);return n;}
const savedScene=b=>b.run('JSON.stringify({threads:S.continuity,energy:E().energy,title:curEv?.title,text:curEv?.text,choices:curEv?.choices.map(c=>c.t),result:modalResult})');

test('a real Duanwu settlement binds its actual helper and lead, with no duplicate invitation',()=>{
 const b=game();b.run(startDuty+`assert.equal(t.owner,helper.id);assert.equal(t.other,a.id);assert.ok(t.overlooked);assert.match(t.cause,/没有写进/);
 assert.ok(continuityConcern(helper));finishDuanwu(work,'照例办结');assert.equal(continuityThreads().length,1);
 var old=t.other;a.rank=4;S.consorts.reverse();assert.equal(t.other,old);assert.ok(continuityEvent(t).text.includes(fullName(a)));`);
});
test('public credit and private thanks produce different later requests and shared memories',()=>{
 for(const choice of ['credit','private']){const b=game();b.run(startDuty+`continuityChoose(t,'${choice}');assert.equal(t.stage,'working');S.turn=t.due;
 var text=continuityEvent(t).text;
 ${choice==='credit'?`assert.match(text,/共同做好的/);assert.equal(continuityConcern(helper),undefined);`:`assert.match(text,/自己独立完成/);assert.ok(continuityConcern(helper));`}
 var memories=[helper,a].map(p=>NPCMemory.recall(S,p.id,{type:'personal-continuity'})[0].interpretation);assert.notEqual(memories[0],memories[1]);`);}
});
test('respecting independent work and overriding it affect future helper selection',()=>{
 const b=game();b.run(startDuty+`continuityChoose(t,'solo');S.turn=t.due;continuityChoose(t,'appoint');
 assert.equal(continuityPartnership(helper,a),-12);relAdd(helper,a,100);assert.notEqual(duanwuHelper(a,b),helper);
 S.turn=t.due;continuityTick();assert.equal(t.stage,'ended');assert.ok(continuityConcern(helper));
 E().energy=4;A.addressPersonalConcern(t.id);choose(0);drain();assert.equal(continuityConcern(helper),undefined);assert.equal(continuityPartnership(helper,a),0);
 assert.ok(continuityRepairReady(t)===false);var energy=E().energy;A.addressPersonalConcern(t.id);assert.equal(E().energy,energy);`);
});
test('cooperation is followed by an autonomous reunion and changes future ally scoring',()=>{
 const b=game();b.run(startDuty+`continuityChoose(t,'credit');S.turn=t.due;continuityChoose(t,'respect');
 assert.equal(continuityPartnership(helper,a),12);var events=t.history.length;S.turn=t.due;continuityTick();
 assert.equal(t.stage,'ended');assert.equal(t.history.length,events+1);assert.match(t.history.at(-1).text,/沿用上回说好的分工/);
 continuityTick();assert.equal(t.history.length,events+1);`);
});
test('concrete hurt survives ordinary chat, liked gifts and the end of an unanswered invitation',()=>{
 const b=game();b.run(startDuty+`helper.aff=100;setXin(helper,'怨恨','功劳被漏记');A.chat(helper.id);drain();
 assert.ok(continuityConcern(helper));assert.equal(xinOf(helper),'怨恨');giveGift(helper,helper.like);assert.equal(xinOf(helper),'怨恨');
 S.turn=t.origin+12;continuityTick();assert.equal(t.stage,'ended');assert.ok(continuityRepairReady(t));assert.match(continuityPanel(helper),/把那件事说清/);`);
});
test('a family story uses the named official and a failed task remains a failure after family care',()=>{
 const b=game();b.run(startFamily+`p.report={outcome:'setback',title:'巡边整饬军备'};var before=p.trust;
 continuityChoose(t,'care');assert.equal(p.trust,before);assert.equal(p.report.outcome,'setback');S.turn=t.due;continuityChoose(t,'voice');
 assert.ok(a.familyVoice.heard);assert.equal(a.familyVoice.delivered,false);
 assert.doesNotMatch(officialConversation({c:a,p,role:'father',h},'family'),/信里把自己的判断/);
 S.turn=t.due;continuityTick();assert.ok(a.familyVoice.delivered);assert.match(officialConversation({c:a,p,role:'father',h},'family'),/信里把自己的判断/);`);
});
test('a real official task starts a family continuation after its saved result arrives',()=>{
 const b=game();b.run(`a.fam={t:'镇国大将军',p:65};delete a.house;var h=houseOf(a),p=h.father;
 p.commission={title:'巡边整饬军备',due:S.turn,outcome:'success',wasAway:false};officialTaskTick();
 var t=continuityThreads()[0];assert.equal(t.officialId,p.id);assert.equal(t.outcome,'success');assert.ok(t.cause.includes(p.name));assert.match(t.cause,/办结/);`);
});
test('an official death changes the same family story without replacing its subject or inventing new memories for the dead',()=>{
 const b=game();b.run(startFamily+`continuityChoose(t,'facts');var id=t.id;officialDeath(a,'father','巡视途中病故。');continuityTick();
 assert.equal(continuityThreads().length,1);assert.equal(t.id,id);assert.equal(t.outcome,'death');assert.equal(t.officialId,p.id);
 S.turn=t.due;var before=NPCMemory.recall(S,p.id).length;continuityChoose(t,'letters');assert.equal(NPCMemory.recall(S,p.id).length,before);
 assert.match(continuityProgressText(t),/停下来/);assert.ok(!officialActionReady({c:a,p,role:'father'},'commission'));`);
});
test('the three parenting choices preserve the actual child and lead to different later routines',()=>{
 for(const mode of ['child','parent','together']){const b=game();b.run(startChild+`assert.equal(t.owner,a.id);assert.equal(t.other,k.id);assert.equal(t.project,'paint');assert.equal(t.parentProject,'archery');
 continuityChoose(t,'${mode}');S.turn=t.due;continuityChoose(t,'listen');
 assert.equal(k.personalPractice.mode,'${mode}');assert.equal(familyActivity(k,a,false).title,'${mode==='parent'?'练习投壶':'一同描画'}');
 assert.match(familyActivity(k,a,false).child,/自己想改/);assert.ok(k.motherBonds[a.id].trust>50);
 S.turn=t.due;continuityTick();assert.match(t.history.at(-1).text,/又来找/);`);}
});
test('changing the child temperament changes the proposed activity, and toddlers do not receive school plans',()=>{
 const b=game();b.run(`var k=makeKid(a,'f','昭宁');k.born=S.turn-2*12;recordFamilyTime(k,a,'做点心','做了点心。','陪孩子做点心。');assert.equal(continuityThreads().length,0);
 k.born=S.turn-8*12;k.temperament='爽直';recordFamilyTime(k,a,'并肩散步','一起走了走。','听孩子说话。');assert.equal(continuityThreads()[0].project,'archery');`);
});
test('temporary absence pauses an accepted plan; adulthood closes it without recasting',()=>{
 const b=game();b.run(startChild+`continuityChoose(t,'child');k.templeStay={from:S.turn,due:S.turn+3};S.turn=t.due;
 continuityTick();assert.equal(t.stage,'working');assert.equal(continuityEvent(t),null);delete k.templeStay;
 assert.ok(continuityEvent(t));k.born=S.turn-18*12;continuityTick();assert.equal(t.stage,'ended');assert.match(t.history.at(-1).text,/没有请旁人接替/);`);
});
test('closed birth-mother visitation cannot be bypassed by continuing a plan',()=>{
 const b=game();b.run(startChild+`continuityChoose(t,'child');k.foster=b.id;k.visitRule='closed';S.turn=t.due;
 var energy=E().energy;assert.equal(continuityEvent(t),null);A.continuePersonal(t.id);assert.equal(E().energy,energy);`);
});
test('death and departure close a collaboration instead of borrowing another eligible actor',()=>{
 for(const field of ['alive','gone']){const b=game();b.run(startDuty+`a.${field}=${field==='alive'?'false':'true'};continuityTick();assert.equal(t.stage,'ended');assert.equal(t.other,a.id);
 assert.equal(continuityEvent(t),null);assert.equal(continuityLeads().length,0);`);}
});
test('profiles, map leads and repeated inspection never consume randomness or advance the story',()=>{
 const b=game();b.run(startDuty+`var before=JSON.stringify(S),oldR=Math.random;Math.random=()=>{throw Error('read drew randomness')};
 for(var i=0;i<5;i++){continuityPanel(helper);continuityLeads();continuityEvent(t);continuityDesire(t);}
 Math.random=oldR;assert.equal(JSON.stringify(S),before);`);
});
test('monthly continuation shares the event budget and has a three-month reminder cooldown',()=>{
 const b=game();b.run(startDuty+`var ev=continuityMonthlyEvent();assert.ok(ev);ev.onShow();assert.equal(continuityMonthlyEvent(),null);
 S.turn+=2;assert.equal(continuityMonthlyEvent(),null);S.turn++;assert.ok(continuityMonthlyEvent());
 assert.equal(mapLeadAction(continuityLeads()[0]),'A.continuePersonal('+t.id+')');`);
});
test('month review selects a meaningful continuation rather than the last roster entry',()=>{
 const b=game();b.run(startDuty+`continuityChoose(t,'credit');var r=continuityReview([{id:b.id,text:'闲聊。'},{id:a.id,text:'普通事。'}]);
 assert.equal(r[0].id,helper.id);assert.match(r[0].text,/旧册按实补记/);`);
});
test('repeated chat, gifts and nights share diminishing affection without erasing distinct milestones',()=>{
 const b=game();b.run(`a.aff=70;assert.deepEqual([routineAffection(a,8),routineAffection(a,8),routineAffection(a,8)],[4,1,0]);
 S.turn++;a.aff=90;assert.equal(routineAffection(a,8),1);S.gen++;assert.equal(routineAffection(a,8),1);`);
});
test('social recollection uses the newest real relationship memory and never invents a past event',()=>{
 const b=game();b.run(`assert.equal(genuineSocialMemory(helper,a),'');
 palaceSupportMemory(helper,a,'duanwu_work','御花园','署名','她替我记下了名字。','我补记了她的名字。',.5,.5);
 palaceSupportMemory(helper,a,'palace_support','宫中','探望','她今日来问我花样的进展。','我问了她的花样。',.5,.5);
 assert.match(genuineSocialMemory(helper,a),/今日来问我花样/);assert.doesNotMatch(genuineSocialMemory(helper,a),/替我记下了名字/);
 NPCMemory.record(S,{type:'palace_support',time:S.turn},[{person:helper.id,subject:a.id,interpretation:'听说她替我说情。',channel:'hearsay',confidence:.3}]);
 assert.match(genuineSocialMemory(helper,a),/听来的消息/);assert.doesNotMatch(genuineSocialMemory(helper,a),/亲历/);`);
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../js/personality.js'),'utf8');
 assert.ok(!source.includes('她病的那几天，是我守着的'));assert.ok(!source.includes('前儿请安，她当着众人的面给臣妾难堪'));
});
test('general investigation truth follows a saved biography and does not reroll on later trust changes',()=>{
 const b=game();b.run(`a.fam={t:'镇国大将军',p:65};a.trait='将门';delete a.house;var p=houseOf(a).father;
 p.temperament='持正';p.trust=20;p.merit=80;var f={};assert.equal(generalCaseFacts(a,f).guilty,false);
 p.temperament='进取';assert.equal(generalCaseFacts(a,f).guilty,false);var second={};assert.equal(generalCaseFacts(a,second).guilty,true);
 p.trust=90;assert.equal(generalCaseFacts(a,second).guilty,true);
 f.act='spy';a.arc={id:'general',st:2,f};assert.match(ARCS.general.stages[2](a,f).text,/清白/);
 second.act='spy';a.arc.f=second;assert.match(ARCS.general.stages[2](a,second).text,/确有不臣之心/);`);
});
test('new reigns do not inherit unfinished conversations with a previous emperor',()=>{
 const b=game();b.run(startDuty+`S.gen++;assert.equal(continuityThreads().length,0);assert.equal(continuityConcern(helper),undefined);
 continuityState(true);assert.equal(continuityState().threads.length,0);`);
});
test('invitation, accepted decision and result page resume in a fresh runtime exactly once',()=>{
 let b=game();b.run(startDuty+'A.continuePersonal(t.id)');let scene=savedScene(b);b=restore(b);assert.equal(savedScene(b),scene);
 b.run('choose(0)');scene=savedScene(b);b=restore(b);assert.equal(savedScene(b),scene);
 const energy=b.run('E().energy');b.run('choose(0)');assert.equal(b.run('E().energy'),energy);b.run('drain()');
 b.run('var t=continuityThreads()[0];S.turn=t.due;E().energy=4;A.continuePersonal(t.id)');scene=savedScene(b);b=restore(b);assert.equal(savedScene(b),scene);
 b.run('choose(0)');scene=savedScene(b);b=restore(b);assert.equal(savedScene(b),scene);b.run('drain()');assert.equal(b.run('continuityThreads()[0].stage'),'settled');
});
test('zero energy, premature and finished scenes cannot award choices twice',()=>{
 const b=game();b.run(startDuty+`E().energy=0;assert.equal(continuityChoose(t,'credit'),null);assert.equal(t.stage,'invitation');
 E().energy=4;continuityChoose(t,'credit');var energy=E().energy;assert.equal(continuityChoose(t,'respect'),null);assert.equal(E().energy,energy);
 S.turn=t.due;continuityChoose(t,'respect');S.turn=t.due;assert.equal(continuityChoose(t,'respect'),null);`);
});
test('ordinary old saves remain valid without fabricating historical threads',()=>{
 let b=game();b.run("delete S.continuity;save('1');A.load('1');assert.equal(continuityThreads().length,0);");
 assert.equal(b.run('PalaceActions.blocked'),false);
});

test('the sister who commissioned a shared father remains the contact for the family story',()=>{
 const b=game();b.run(`a.fam={t:'镇国大将军',p:65};delete a.house;var h=houseOf(a),sister=makeKin(a,'亲');addConsort(sister,3,'姐妹入宫');
 var entry=officialEntry(sister.id+':father');assignOfficialTask(entry,'border');assert.equal(h.father.commission.contact,sister.id);
 h.father.commission.outcome='success';S.turn=h.father.commission.due;officialTaskTick();assert.equal(continuityThreads()[0].owner,sister.id);`);
});
test('repeated task outcomes and annual preparations leave room for other people and subjects',()=>{
 const b=game();b.run(startFamily+`t.stage='ended';S.turn+=8;startOfficialContinuity(entry,'setback','巡边整饬军备');assert.equal(continuityThreads().length,1);
 startOfficialContinuity(entry,'success','巡边整饬军备');assert.equal(continuityThreads().length,2);
 S.continuity.threads=[];finishDuanwu(work,'公开署名');var t=continuityThreads()[0];t.stage='ended';S.turn+=12;work.year++;work.stage='review';finishDuanwu(work,'公开署名');assert.equal(continuityThreads().length,1);`);
});
test('permanent residence elsewhere closes a childhood plan while keeping its named participants',()=>{
 const b=game();b.run(startChild+`continuityChoose(t,'child');k.estate={};S.turn=t.due;continuityTick();assert.equal(t.stage,'ended');assert.equal(t.other,k.id);`);
});
