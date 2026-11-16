const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(318);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=48;S.year=5;S.month=3;E().energy=20;E().treasury=2000;
 var c=makeGirl({sur:'沈',given:'知微',age:25,trait:'才女',fam:{t:'知府',p:40}});addConsort(c,3,'选秀入宫');c.aff=70;c.hp=90;delete c.solitary;
 var h=houseOf(c),p=h.father,e=officialEntry(c.id+':father'),person=courtPerson(e.key);p.office='江南知府';p.post=p.office;p.ability=80;p.merit=60;p.trust=70;
 var report=(outcome='success')=>{p.report={title:'河工复核',text:outcome==='success'?'十二段河堤全部验收，工簿与实地相合。':'十二段河堤仅修完五段，剩余险段仍漏水。',outcome,turn:S.turn,office:p.office};};PalaceActions.reset();`);return b;}
function reload(b){const r=boot(900,b.storage);r.ctx.assert=assert;r.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);return r;}

test('civil and military titles have separate ranks; degrees and livelihoods are not offices',()=>{const b=world();b.run(`
 for(const [office,rank] of [['内阁大学士',1],['吏部尚书',2],['户部侍郎',3],['江南知府',8],['知县',13],['翰林院修撰',12],['参将',5],['游击将军',6],['北境守备',9],['总兵',3],['太医院院判',11]])assert.equal(officialGrade({office}),rank,office);
 for(const career of ['student','commoner'])assert.equal(officialGrade({career,post:'知县'}),null);
 assert.equal(officialGrade({post:'候补知县',career:'official'}),null);assert.equal(officialGrade({office:'皇商'}),null);
 UI.sel=e.key;assert.match(viewOfficial(),/江南知府 · 从四品/);assert.match(officialsTable(),/江南知府 · 从四品/);
`);});
test('promotion changes actual office and rank, retains the full report, and cannot be spent twice',()=>{const b=world();b.run(`report();var ev=careerReportEvent(person);var choice=ev.choices.find(x=>x.t.startsWith('升职'));assert.ok(choice.cond());choice.f();
 assert.equal(p.office,'道员');assert.equal(p.post,p.office);assert.equal(officialGrade(p),7);assert.equal(p.report,undefined);
 assert.ok(p.story.some(x=>x.t.includes('十二段河堤')&&x.t.includes('御批')));assert.ok(c.story.some(x=>x.t.includes('河工复核')&&x.t.includes('正四品')));
 assert.equal(p.careerHistory.length,1);assert.equal(choice.f(),null);assert.equal(p.reportHistory.length,1);
 report();assert.equal(careerTarget(person,'promote'),null);S.turn+=6;assert.ok(careerTarget(person,'promote'));
`);});
test('a bad report enables demotion, a good report enables promotion, and bounds block impossible changes',()=>{const b=world();b.run(`report('setback');var ev=careerReportEvent(person);assert.ok(!ev.choices.some(x=>x.t.startsWith('升职')));ev.choices.find(x=>x.t.startsWith('降职')).f();assert.equal(p.office,'同知');assert.equal(officialGrade(p),9);assert.ok(c.story.some(x=>x.t.includes('惶恐')));
 S.turn+=6;p.office='内阁大学士';assert.equal(careerTarget(person,'promote'),null);p.office='巡检';assert.equal(careerTarget(person,'demote'),null);
`);});
test('armed officials stay on their own promotion track',()=>{const b=world();b.run(`p.office=p.post='守备';report();careerReportEvent(person).choices.find(x=>x.t.startsWith('升职')).f();assert.equal(p.office,'都司');assert.equal(officialGrade(p),7);`);});
test('changed office, minors, students, retired, deceased, jailed or busy officials cannot get stale promotion',()=>{
 for(const patch of ["p.office='户部侍郎'","p.age=17","p.career='student'","p.retired=true","p.alive=false","p.exiled=true","p.dismissed=true","p.commission={due:999}"]){const b=world();b.run(`report();var ev=careerReportEvent(person),choice=ev.choices.find(x=>x.t.startsWith('升职'));${patch};var old=p.office;assert.equal(choice.cond(),false);assert.equal(choice.f(),null);assert.equal(p.office,old);`);}
});
test('local reports store concrete evidence once, use persistent people and survive reload',()=>{let b=world();b.run(`ensureLocalOfficers();assert.equal(scholarList().filter(p=>p.registrySource==='local').length,3);var count=S.nid;ensureLocalOfficers();assert.equal(S.nid,count);
 var x=careerPeople().find(x=>x.p.registrySource==='local');createLocalReport(x);assert.ok(x.p.report.done<=x.p.report.target);assert.ok(x.p.story.some(s=>s.t.includes('【呈奏】')));var key=x.key,r=JSON.stringify(x.p.report);A.officialReport(key);save('auto');`);
 const before=b.run("JSON.stringify(careerPeople().find(x=>x.p.registrySource==='local').p.report)");b=reload(b);assert.equal(b.run("JSON.stringify(careerPeople().find(x=>x.p.registrySource==='local').p.report)"),before);
 b.run(`choose(2);assert.ok(careerPeople().find(x=>x.p.registrySource==='local').p.reportHistory.length);`);b=reload(b);b.run(`assert.equal(careerPeople().find(x=>x.p.registrySource==='local').p.reportHistory.length,1);`);
});
test('local reports are six months apart across officials and officials still age',()=>{const b=world();b.run(`ensureLocalOfficers();S.flags.lastLocalReport=S.turn;var first=scholarList().find(p=>p.registrySource==='local'),age=first.age;
 for(var elapsed=0;elapsed<6;elapsed++,S.turn++){careerTick();assert.ok(careerPeople().every(x=>!x.p.report));}
 careerTick();var pending=careerPeople().filter(x=>x.p.report);assert.equal(pending.length,1);
 assert.equal(S.flags.lastLocalReport,S.turn);var saved=JSON.stringify(S);careerTick();assert.equal(JSON.stringify(S),saved);
 delete pending[0].p.report;S.turn+=5;careerTick();assert.equal(localReportEligible(pending[0]),false);
 assert.ok(careerPeople().every(x=>!x.p.report));S.turn++;careerTick();
 assert.equal(careerPeople().filter(x=>x.p.report).length,1);assert.equal(S.flags.lastLocalReport,S.turn);
 assert.equal(first.age,age+1);assert.equal(scholarList().filter(p=>p.registrySource==='local').length,3);`);});
test('promoting a minister clears his actual ministry and records the new post',()=>{const b=world();b.run(`var oldHead=ministryHead('personnel');oldHead.p.office=oldHead.p.post='内阁学士';S.ministries.heads.personnel=person.key;p.office=p.post='吏部尚书';assert.equal(ministryHead('personnel').p,p);report();careerReportEvent(person).choices.find(x=>x.t.startsWith('升职')).f();assert.equal(p.office,'内阁大学士');assert.notEqual(ministryHead('personnel')?.p,p);`);});
test('surname alone is not kinship; explicit branch ancestry is shown and reacts',()=>{const b=world();b.run(`var o=makeScholar();o.sur=c.sur;o.name=c.sur+'远山';o.office='知县';o.age=40;S.scholars=[o];var x=courtPerson('scholar:'+o.id);assert.equal(careerKin(x).length,0);o.courtKin=[{fatherId:p.id,type:'branch',detail:'与父亲同族分房多年'}];assert.equal(careerKin(x)[0].type,'branch');careerFamilyEcho(x,'reward','修堤得赏');assert.ok(c.story.some(s=>s.t.includes('远房族')));`);});
test('mother family distress and joy enter both known people and survive pending-scene reload',()=>{let b=world();b.run(`c.rank=3;A.cold(c.id);choose(0);assert.ok(p.story.some(s=>s.t.includes('被迁入冷宫')));assert.ok(c.story.some(s=>s.t.includes('娘家来信')));save('auto');`);
 b=reload(b);b.run(`var c=S.consorts.find(c=>c.given==='知微'),p=houseOf(c).father;assert.equal(p.story.filter(s=>s.t.includes('被迁入冷宫')).length,1);assert.match(officialConversation(officialEntry(c.id+':father'),'family'),/有衣御寒|依例照料起居/);drain();A.uncold(c.id);assert.ok(p.story.some(s=>s.t.includes('获准离开冷宫')));`);
});
test('pregnancy and birth are different news; favor and demotion are not generic congratulations',()=>{const b=world();b.run(`var old=JSON.parse(JSON.stringify(S));c.preg=3;courtFamilyLifeTick(old);assert.equal(p.palaceConcern.kind,'pregnancy');old=JSON.parse(JSON.stringify(S));var k=makeKid(c,'f','清和');courtFamilyLifeTick(old);assert.equal(p.palaceConcern.kind,'birth');old=JSON.parse(JSON.stringify(S));c.rank=2;courtFamilyLifeTick(old);assert.equal(p.palaceConcern.kind,'demoted');old=JSON.parse(JSON.stringify(S));c.favor=80;courtFamilyLifeTick(old);assert.equal(p.palaceConcern.kind,'favored');`);});
test('sisters at home and in the palace keep their own reactions to promotion and cold-palace news',()=>{
 const b=world();
 b.run(`var home=houseOf(c),sister=addNatalPerson(c,home,'f',22,821,false);
   var niece=addNatalPerson(c,home,'f',13,3255,false);niece.parentRelativeId=sister.id;
   var other=makeGirl({sur:c.sur,given:'清婉',age:23,fam:c.fam});other.fatherId=c.fatherId;addConsort(other,2,'入宫');
   c.upbringing={title:'吏部尚书',group:'noble',power:78,means:'ample'};
   relAdd(c,sister,70-relGet(c,sister));relAdd(c,other,-10-relGet(c,other));
   var old=JSON.parse(JSON.stringify(S));c.rank=5;courtFamilyLifeTick(old);courtFamilyLifeTick(old);
   assert.match(p.palaceConcern.quote,/娘家可以依仗/);
   assert.match(sister.palaceConcern.quote,/真替她欢喜/);assert.match(other.palaceConcern.quote,/新位分有新规矩/);
   assert.equal(niece.palaceConcern,undefined);assert.equal(sister.story.filter(e=>e.life?.title==='宫中牵挂').length,1);
   old=JSON.parse(JSON.stringify(S));c.cold=true;courtFamilyLifeTick(old);
   assert.equal(sister.palaceConcern.kind,'cold');assert.match(sisterPalaceConcernPanel(sister),/御寒/);
   assert.equal(sister.story.filter(e=>e.life?.title==='宫中牵挂').length,2);
   old=JSON.parse(JSON.stringify(S));c.cold=false;courtFamilyLifeTick(old);assert.equal(sister.palaceConcern.kind,'released');`);
});
test('brother envy uses a real capable elder brother and never invents a sibling',()=>{const b=world();b.run(`for(const role of brotherRoles(h))delete h[role];h.relatives=[];
 var other=makeGirl({sur:'许',given:'清容',age:25,fam:{t:'吏部尚书',p:70}});addConsort(other,3,'入宫');var oh=houseOf(other);oh.brother={name:'许长风',age:30,post:'知府',career:'official',alive:true,merit:60,ability:80};houseOf(other);
 var ctx=brotherSupportContext(c);assert.equal(ctx.p.name,'许长风');assert.match(brotherSupportLine(c,ctx),/自幼没有兄长/);A.brotherSupport(c.id);choose(0);assert.ok(c.story.some(s=>s.t.includes('杨国忠')));drain();assert.equal(brotherSupportContext(c),null);
 S.turn+=12;oh.brother.alive=false;assert.equal(brotherSupportContext(c),null);`);});
test('first-child wishes cover either gender, exclude deceased predecessors, and remain wishes',()=>{const b=world();b.run(`S.children=[];c.preg=4;c.xin={k:'平和',t:S.turn};var girl=makeKid(harem()[0],'f','长乐');assert.equal(firstChildWishContext(c).sex,'m');var boy=makeKid(harem()[0],'m','承安');boy.alive=false;assert.equal(firstChildWishContext(c),null);S.children=[boy];assert.equal(firstChildWishContext(c).sex,'f');var text=firstChildWishLine(c,firstChildWishContext(c));assert.match(text,/若|能/);A.firstChildWish(c.id);choose(1);assert.ok(c.story.some(s=>s.t.includes('孕中盼望')));assert.equal(firstChildWishContext(c),null);`);});
test('first-child wishes resume and a later pregnancy cannot reuse an old wish',()=>{let b=world();b.run(`S.children=[];c.preg=4;c.xin={k:'平和',t:S.turn};c.pregnancyCalendar={conceived:S.turn-4,term:10,nights:[],medical:[]};A.firstChildWish(c.id);choose(0);save('auto');`);b=reload(b);b.run(`var c=S.consorts.find(c=>c.given==='知微');assert.ok(c.firstChildWish);assert.equal(c.story.filter(s=>s.t.includes('【孕中盼望】')).length,1);drain();var k=makeKid(c,'m','承安');c.delivery={firstWishKey:'different',settled:true};assert.equal(pregnancyPrayerBirthEcho(c,[k]),'');assert.equal(c.firstChildWish.settled,undefined);c.delivery.firstWishKey=c.firstChildWish.key;pregnancyPrayerBirthEcho(c,[k]);assert.equal(c.firstChildWish.settled,true);assert.equal(c.story.filter(s=>s.t.includes('孕愿回音')).length,1);`);});
const legacy={cases:[...require('./fixtures/careers-legacy-v10.json').cases,...require('./fixtures/careers-legacy-v11.json').cases]};
for(const f of legacy.cases)test('v'+f.save.pendingActions.version+' pending scene remains replayable: '+f.name,()=>{const b=boot(711,new Map([['chengongji_v1_auto',JSON.stringify(f.save)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);assert.equal(b.run('curEv.title'),f.save.pendingActions.pending.title);});

for(const f of require('./fixtures/careers-legacy-v14.json').cases)test('real v14 '+f.name+' restores and finishes under the current version',()=>{
 let b=boot(711,new Map([['chengongji_v1_auto',JSON.stringify(f.save)]]));b.ctx.assert=assert;
 b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");assert.equal(b.run('curEv.title'),f.save.pendingActions.pending.title);
 b.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));');b=reload(b);
 b.run('drain();assert.equal(PalaceActions.contentVersion,48);');
});

test('a military household student is not a general; civil appointment determines his actual duties',()=>{const b=world();b.run(`
 h.bloc='army';h.brother={name:'林少卿',age:20,alive:true,career:'student',education:'书生',post:'书生',ability:80,merit:0,story:[]};houseOf(c);var son=officialEntry(c.id+':brother');UI.sel=son.key;
 assert.match(viewOfficial(),/外家子弟 · 家族立场：武将/);assert.match(viewOfficial(),/书生 · 尚未授官/);assert.equal(officialMilitary(son.p,h),false);assert.equal(officialActionReady(son,'commission'),false);assert.equal(canAppointRelative(son),false);
 son.p.education='举人';assert.ok(appointRelative(son));assert.equal(son.p.office,'候补知县');assert.equal(officialMilitary(son.p,h),false);
 son.p.office=son.p.post='清河知县';son.p.ability=80;son.p.merit=50;assert.equal(h.bloc,'army');assert.equal(careerTarget({p:son.p,e:son},'promote')[1],'翰林院修撰');assert.ok(ministryCandidates('personnel').some(x=>x.p===son.p));assert.ok(!ministryCandidates('war').some(x=>x.p===son.p));
 assert.doesNotMatch(officialConversation(son,'service'),/边关不只有捷报/);assert.equal(assignOfficialTask(son,'border'),null);assert.ok(assignOfficialTask(son,'accounts'));delete son.p.commission;
 assert.equal(frontierDispatch(son),null);son.p.office=son.p.post='参将';son.p.lastCommission=-99;assert.equal(officialMilitary(son.p,h),true);assert.equal(assignOfficialTask(son,'accounts'),null);assert.ok(assignOfficialTask(son,'border'));
`);});
test('a frontier military promotion also records a modest family rise without duplicating the reward',()=>{const b=world();b.run(`
 c.fam.t='县令';h.bloc='army';p.office=p.post='参将';var old=p.story.length;var r={id:'rise-border',gen:S.gen,outcome:'victory',commander:frontierRef(e)};
 assert.ok(frontierReward(r,'promotion'));assert.equal(p.office,'副将');assert.equal(p.post,p.office);assert.equal(c.familyRise.personId,p.id);assert.equal(p.careerHistory.length,1);
 var saved=JSON.stringify(S);assert.equal(frontierReward(r,'promotion'),null);assert.equal(JSON.stringify(S),saved);
`);});
