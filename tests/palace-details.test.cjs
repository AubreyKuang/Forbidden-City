const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./child-consequences-world.cjs');
function game(){const b=world();b.ctx.assert=assert;b.run('E().energy=12;E().treasury=500;drain();');return b;}
test('心愿尊重存下的小性子、健康、国库、节令及父亲生死',()=>{
 const b=game();b.run(`a.t2='怕雷';a.wish='ride';a.wishDone=false;a.preg=1;A.wish(a.id);assert.ok(!a.wishDone);a.preg=0;a.hp=95;A.wish(a.id);drain();
 assert.equal(a.t2,'怕雷');assert.ok(consortHasQuirk(a,'擅骑射'));a.wish='cat';a.wishDone=false;A.wish(a.id);drain();assert.ok(consortHasQuirk(a,'爱猫'));assert.equal(a.t2,'怕雷');
 a.wish='fire';a.wishDone=false;S.month=6;var balance=E().treasury;A.wish(a.id);assert.equal(E().treasury,balance);assert.ok(!a.wishDone);
 S.month=1;E().treasury=3;A.wish(a.id);assert.ok(!a.wishDone);E().treasury=80;A.wish(a.id);assert.equal(E().treasury,40);drain();
 var father=houseOf(a).father;officialDeath(a,'father','病故。');drain();a.fam.p=22;a.wish='father';a.wishDone=false;A.wish(a.id);
 assert.match(curEv.text,/抄本/);assert.ok(!curEv.text.includes('跪'));assert.equal(father.alive,false);`);
});
test('御赐旧物记好恶，私下解释不传给旁人；重开不会重复给情分',()=>{
 const b=game();b.run(`a.hate='珠翠';a.like='琴谱';giveGift(a,'珠翠');drain();S.turn++;A.go('consort',a.id);assert.match(viewConsort(),/再谈一匣东珠/);
 A.hearRemembrance(a.id,'gift',false);assert.match(curEv.text,/用不惯/);assert.equal(curEv.choices.length,2);choose(0);drain();var aff=a.aff;
 A.hearRemembrance(a.id,'gift',false);assert.equal(a.aff,aff);assert.ok(!modalOpen);`);
});
test('八位剧情妃分别有可制作、相赠的专属手稿，十九种性情都有自己的回应',()=>{
 const b=game();b.run(`assert.deepEqual(Object.keys(LADY_GIFT_VOICES).sort(),Object.keys(TRAITS).sort());assert.equal(new Set(Object.values(LADY_GIFT_VOICES)).size,19);
 assert.deepEqual(Object.keys(SCHOOL_BAG_VOICES).sort(),Object.keys(CHILD_DISPOSITIONS).sort());
 for(const key of [...Object.keys(STORY_CAST),'gouyi','hongjian']){
  a.fixedStory=STORY_CAST[key]?key:null;a.gouyi=key==='gouyi';a.hongjian=key==='hongjian'?{gen:S.gen,admitted:S.turn,receipts:[],lastDaily:-99,accounts:'separate',shop:'阿绫掌柜'}:null;if(a.hongjian)a.arc=makeArc('hongjian',2);delete a.personalLife;delete a.palaceRemembrances;elder.keepsakes=[];E().energy=12;
  A.arrivePlace('wardrobe');A.orderConsortWardrobe(a.id);S.turn++;A.deliverWardrobe();drain();S.turn++;A.go('consort',a.id);
  A.hearRemembrance(a.id,'wardrobe',false);assert.equal(curEv.text,SACHET_STORIES[key]);var i=curEv.choices.findIndex(c=>c.t.includes(SACHET_PATTERNS[key][0]));assert.ok(i>=0);choose(i);drain();
  var w=a.personalLife.works[0];assert.equal(w.title,SACHET_PATTERNS[key][0]);A.lifePass(a.id,elder.id,w.id);drain();assert.equal(elder.keepsakes[0].title,w.title);
 }
 elder.age=17;packChildKeepsake(elder);packChildKeepsake(elder);assert.equal(elder.story.filter(s=>s.t.includes('【开府行箧】')).length,1);`);
});
test('上书房用已御批的原数，补报不重复晋升，异地调任不会冒领',()=>{
 const b=game();b.run(`var f=houseOf(a).father,official=courtPerson(a.id+':father');f.office=f.post='清河知县';f.age=48;f.alive=true;f.retired=false;f.career='official';f.temperament='进取';f.ability=82;f.merit=60;
 var r=f.report={id:'local-fixture',edition:24,kind:'local',taskId:'water',department:'工部',office:f.office,turn:S.turn,title:'清河修堤',done:7,target:12,unit:'段险堤',text:'仅七段核验完毕。',outcome:'setback',rating:'setback',verified:true};
 var ev=careerReportEvent(official);ev.choices.find(c=>c.t.includes('责令')).f();assert.match(f.reportHistory.at(-1).decision,/限两个月/);S.turn++;localRectificationTick();assert.ok(!f.report);
 A.arrivePlace('ss');assert.match(viewPlace(),/读这份抄件/);var lit=elder.lit;A.readSchoolDocket(elder.id);assert.match(curEv.text,/7段险堤/);choose(0);drain();assert.equal(elder.lit,clamp(lit+3));assert.ok(!schoolCaseAvailable());S.turn++;`);
 b.force(0);b.run(`localRectificationTick();assert.equal(f.report.kind,'rectification');assert.ok(f.report.text.includes('共12/12'));var follow=careerReportEvent(official),merit=f.merit;follow.choices[0].f();follow.choices[0].f();assert.equal(f.merit,merit+3);
 assert.equal(f.reportHistory.at(-1).done,7);
 f.report={...r,id:'another',office:f.office};careerReportEvent(official).choices.find(c=>c.t.includes('责令')).f();f.office=f.post='户部郎中';S.turn+=2;localRectificationTick();
 assert.ok(!f.report);assert.match(f.reportHistory.at(-1).rectification,/移交/);`);
});
test('姐妹退席托抄祭文，下月兑现；旧友真的邻座才谈宫外旧事',()=>{
 const b=game();b.run(`a.oldCourtFriend={id:b.id,memory:'一起藏过花签'};a.kinRival={};b.kinRival={};S.rel[rk(a,b)]=55;
 assert.equal(rememberBanquetFriends([[a],[b]],'投壶'),'');assert.match(rememberBanquetFriends([[a,b]],'投壶'),/藏过花签/);assert.equal(rememberBanquetFriends([[a,b]],'投壶'),'');
 S.rel[rk(a,q)]=-20;S.rel[rk(b,q)]=20;q.kinRival={};var dad=houseOf(a).father;dad.death={turn:S.turn-1};`);
 b.force(.1,.9);b.run(`holdGroupSisterVigil(dad,[a,b,q]);drain();assert.equal(S.flags.vigilCopies[0].writer,b.id);S.turn++;deliverVigilCopies();deliverVigilCopies();
 assert.equal(a.story.filter(e=>e.life?.title==='补送一页祭文').length,1);assert.equal(b.story.filter(e=>e.life?.title==='补送一页祭文').length,1);
 a.fatherLetters={father:dad.id,latest:{title:'未能送到的银封',text:'银封退回'},lastReply:{kind:'money'}};assert.match(mourningDaughterMemory(a,dad).words,/封口/);`);
});
test('同月同名的两次相遇可各自对读，查看不改存档',()=>{
 const b=game();b.run(`livedRecord([a,elder],'family','赠笺','test','第一回',['我留着第一张。','第一张夹进书里。']);
 var first=a.story.length-1;livedRecord([a,elder],'family','赠笺','test','第二回',['今天换了色。','第二张贴在窗前。']);
 var output={},saved=JSON.stringify(S),details={open:true,dataset:{owner:String(a.id),index:first},querySelector:()=>output};
 compareChronicleOccasion(details);assert.match(output.innerHTML,/第一张夹进书里/);assert.doesNotMatch(output.innerHTML,/第二张/);assert.equal(JSON.stringify(S),saved);
 details.dataset.index++;compareChronicleOccasion(details);assert.match(output.innerHTML,/第二张贴在窗前/);`);
});
