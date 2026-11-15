const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(){const b=boot(202);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=36;S.year=4;S.month=5;E().energy=6;
 var a=harem()[0],b=harem()[1];a.sur='沈';a.given='知微';a.trait='才女';a.hobby='读书';b.sur='柳';b.given='音';b.trait='温婉';b.hobby='读书';
 for(var p of [a,b]){p.hp=90;p.aff=60;p.preg=0;p.isSolitary=false;delete p.solitary;p.arc.t=10000;}
 relAdd(a,b,80);var advance=()=>{S.turn++;S.month=S.month%12+1;if(S.month===1)S.year++;personalLifeTick();};
 var begin=mode=>{var proposal=lifeProposal(a);assert.ok(lifeStart(a,proposal,mode,b));};
 var finish=mode=>{advance();advance();advance();var p=a.personalLife.project;assert.ok(lifeFinish(a,p,mode));};`);return b;}
function restore(b){const n=boot(999,b.storage);n.ctx.assert=assert;n.run("A.load('auto')");assert.equal(n.run('PalaceActions.blocked'),false);return n;}
test('life plans follow temperament and a real foster child rather than fabricated history',()=>{const b=game();b.run(`
 assert.equal(lifeProposal(a).preferred,'public');a.trait='淡泊';assert.equal(lifeProposal(a).preferred,'private');
 var k=makeKid(a,'f','昭宁');k.born=S.turn-8*12;k.foster=b.id;k.visitRule='open';a.preg=3;
 var p=lifeProposal(a);assert.equal(p.child,k.id);assert.match(p.cause,/再次有孕/);assert.match(p.cause,/柳音/);assert.equal(p.preferred,'private');
 k.visitRule='closed';assert.notEqual(lifeProposal(a).kind,'family');assert.equal(a.trait,'淡泊');`);});
test('all nine hobbies produce appropriate durable work without rerolling character traits',()=>{const b=game();b.run(`
 for(const hobby of Object.keys(LIFE_CRAFTS)){a.hobby=hobby;E().energy=6;delete a.personalLife;begin('private');finish('private');assert.equal(a.personalLife.works[0].hobby,hobby);assert.equal(a.trait,'才女');}
 `);});
test('completed work changes the later proposal to a sequel with factual provenance',()=>{const b=game();b.run(`begin('public');finish('public');assert.equal(lifeProposal(a),null);
 S.turn+=12;var p=lifeProposal(a);assert.match(p.title,/续编/);assert.match(p.cause,/已经完成《窗下诗笺》/);`);});
test('family manuscript advances only with lawful visits and records both perspectives',()=>{const b=game();b.run(`
 var k=makeKid(a,'m','承安');k.born=S.turn-7*12;k.foster=b.id;k.visitRule='open';begin('private');advance();
 assert.equal(a.personalLife.project.progress,1);assert.ok(k.story.some(s=>s.t.includes('手记')));k.visitRule='closed';advance();assert.equal(a.personalLife.project.progress,1);
 k.visitRule='open';advance();advance();lifeFinish(a,a.personalLife.project,'private');assert.match(a.personalLife.works[0].title,/承安/);
 S.turn+=12;assert.notEqual(lifeProposal(a).kind,'family');`);});
test('repeated monthly ticks do not duplicate progress, and illness or absence pauses the named collaborator',()=>{const b=game();b.run(`begin('shared');advance();var p=a.personalLife.project;personalLifeTick();assert.equal(p.progress,1);
 b.homeLeave={};advance();assert.equal(p.progress,1);assert.equal(lifeProjectEvent(a),null);delete b.homeLeave;b.hp=20;advance();assert.equal(p.progress,1);
 b.hp=90;advance();assert.equal(p.progress,2);b.alive=false;advance();assert.equal(a.personalLife.project,undefined);assert.match(a.story.at(-1).t,/没有让旁人接替/);`);});
test('finished collaborative work changes later ally selection and alternating autonomous help',()=>{const b=game();b.run(`begin('shared');finish('shared');assert.equal(lifeFriendScore(a,b),12);
 var stranger=makeGirl({trait:'温婉'});addConsort(stranger,3,'入宫');stranger.hobby='读书';relAdd(a,stranger,80);assert.equal(initiativeAlly(a),b);
 S.turn+=8;personalLifeTick();var count=a.story.length;assert.match(a.story.at(-1).t,/柳音/);assert.match(a.story.at(-1).t,/无需另请御前/);assert.equal(modalOpen,false);
 personalLifeTick();assert.equal(a.story.length,count);S.turn+=8;personalLifeTick();assert.match(a.story.at(-1).t,/柳音带着/);`);});
test('changing private collaboration to public leaves a specific reservation despite friendship',()=>{const b=game();b.run(`begin('shared');finish('public');assert.equal(lifeFriendScore(a,b),-8);assert.ok(!lifePartners(a).includes(b));
 assert.match(personalLifePanel(a),/私稿暂不轻托/);assert.ok(relGet(a,b)>50);`);});
test('public copies create a real reader while private manuscripts stay private',()=>{for(const mode of ['private','public']){const b=game();b.run(`begin('${mode}');finish('${mode}');S.turn+=2;personalLifeTick();
 assert.equal(!!a.personalLife.works[0].readBy,${mode==='public'});${mode==='public'?`assert.match(b.story.at(-1).t,/署名传阅/);assert.equal(a.personalLife.works[0].readBy,b.id);`:''}`);}});
test('gifts cannot erase a hurt; acknowledgement and respected choices in two months can rebuild trust',()=>{const b=game();b.run(`
 remember(a,'hurt','未经商量将私稿示人。');var boundary=lifeBoundary(a);giveGift(a,a.like);assert.equal(lifeBoundary(a),boundary);
 assert.equal(lifeProposal(a).preferred,'private');assert.equal(lifeStart(a,lifeProposal(a),'public'),null);A.lifeReconcile(a.id);choose(0);drain();assert.ok(boundary.acknowledged);
 begin('private');assert.equal(boundary.respect,1);lifeRespect(a);assert.equal(boundary.respect,1);finish('private');assert.equal(lifeBoundary(a),null);
 assert.match(a.story.find(s=>s.life?.title==='慢慢重建的信任').t,/不同月份/);`);});
test('an acknowledged boundary blocks publication of a draft promised before the hurt',()=>{const b=game();b.run(`begin('public');advance();advance();advance();remember(a,'hurt','私话传出。');
 var ev=lifeProjectEvent(a);assert.equal(ev.choices[0].cond(),false);assert.equal(lifeFinish(a,a.personalLife.project,'public'),null);
 assert.ok(lifeFinish(a,a.personalLife.project,'private'));`);});
test('new hurt does not inherit a resolved apology or old reign promise',()=>{const b=game();b.run(`remember(a,'hurt','甲事');var old=lifeBoundary(a);old.acknowledged=true;lifeRespect(a);S.turn++;lifeRespect(a);assert.equal(lifeBoundary(a),null);
 remember(a,'hurt','乙事');assert.equal(lifeBoundary(a).acknowledged,false);S.gen++;assert.equal(lifeBoundary(a),null);`);});
test('zero energy and stale invitation cannot accept or duplicate a plan',()=>{const b=game();b.run(`var ev=lifeProjectEvent(a);E().energy=0;assert.equal(ev.choices[0].f(),null);assert.equal(a.personalLife,undefined);
 E().energy=4;assert.ok(ev.choices[0].f());var e=E().energy;assert.equal(ev.choices[1].f(),null);assert.equal(E().energy,e);
 var state=JSON.stringify(S);lifeStart(a,{...lifeProposal(a),title:'changed'},'private');assert.equal(JSON.stringify(S),state);`);});
test('ending a project cannot pay out twice, nor with a dead author',()=>{const b=game();b.run(`begin('private');advance();advance();advance();var p=a.personalLife.project;var ev=lifeProjectEvent(a);assert.ok(ev.choices[0].f());
 var before=JSON.stringify(S);ev.choices[0].f();lifeFinish(a,p,'public');assert.equal(JSON.stringify(S),before);
 S.turn+=12;begin('private');advance();advance();advance();a.alive=false;assert.equal(lifeFinish(a,a.personalLife.project,'private'),null);`);});
test('a keepsake is handed to a real eligible child once and retains author and source',()=>{const b=game();b.run(`begin('private');finish('private');var w=a.personalLife.works[0],k=makeKid(a,'m','承安');k.born=S.turn-8*12;
 E().energy=4;A.lifePass(a.id,k.id,w.id);assert.equal(k.keepsakes.length,1);assert.equal(k.keepsakes[0].fromName,'沈知微');assert.equal(k.keepsakes[0].source,w.source);
 var e=E().energy;A.lifePass(a.id,k.id,w.id);assert.equal(E().energy,e);assert.equal(k.keepsakes.length,1);assert.match(lifeWorksPanel(k),/沈知微亲手相赠/);`);});
test('closed visitation and missing or too-young children cannot receive a keepsake',()=>{const b=game();b.run(`begin('private');finish('private');var w=a.personalLife.works[0],k=makeKid(a,'f','昭宁');
 assert.equal(lifeGiftReady(a,k,w),false);k.born=S.turn-8*12;k.foster=b.id;k.visitRule='closed';assert.equal(lifeGiftReady(a,k,w),false);A.lifePass(a.id,k.id,w.id);assert.equal(k.keepsakes,undefined);
 assert.doesNotThrow(()=>A.lifePass(a.id,99999,w.id));`);});
test('a grown child uses the specific keepsake and does not manufacture a conversation with the dead',()=>{const b=game();b.run(`begin('private');finish('private');var k=makeKid(a,'f','昭宁');k.born=S.turn-8*12;A.lifePass(a.id,k.id,a.personalLife.works[0].id);
 a.alive=false;var old=a.story.length;k.born=S.turn-16*12;S.turn+=12;personalLifeTick();assert.ok(k.keepsakes[0].echo);assert.match(k.story.at(-1).t,/仍认得当年的笔迹/);assert.equal(a.story.length,old);
 var entries=k.story.length;personalLifeTick();assert.equal(k.story.length,entries);`);});
test('a living mother hears the adult callback only when they can actually meet',()=>{for(const away of [false,true]){const b=game();b.run(`begin('private');finish('private');var k=makeKid(a,'m','承安');k.born=S.turn-8*12;A.lifePass(a.id,k.id,a.personalLife.works[0].id);
 var old=a.story.length;k.born=S.turn-16*12;k.away=${away};S.turn+=12;personalLifeTick();assert.equal(a.story.length>old,${!away});
 assert.match(k.story.at(-1).t,/${away?'收在册页里':'当面说给'}/);`);}});
test('annual meetings are optional, once per year, and never invent the emperors presence',()=>{const b=game();b.run(`begin('private');finish('private');A.lifeRitual(a.id);choose(0);drain();var r=a.personalLife.ritual;assert.ok(r);
 var e=E().energy,old=a.story.length;A.lifeRitual(a.id);assert.equal(a.story.length,old);assert.equal(E().energy,e);
 S.turn+=12;S.year++;personalLifeTick();assert.equal(a.story.length,old);assert.ok(lifeRitualReady(a));assert.ok(lifeLeads().some(l=>/旧约/.test(l.title)));
 A.lifeRitual(a.id);assert.equal(a.story.length,old+1);S.gen++;assert.equal(lifeRitualReady(a),false);assert.match(personalLifePanel(a),/先朝陛下/);`);});
test('heir keepsakes survive actual succession and are displayed with the original author',()=>{const b=game();b.run(`begin('private');finish('private');var k=makeKid(a,'m','承安');k.born=S.turn-18*12;A.lifePass(a.id,k.id,a.personalLife.works[0].id);
 assert.equal(k.keepsakes.length,1);succeed(k);choose(0);drain();assert.equal(S.gen,2);assert.equal(E().keepsakes[0].fromName,'沈知微');assert.match(viewHome(),/窗下诗笺/);assert.match(viewHome(),/沈知微/);`);});
test('biography is factual, links original participants, escapes text, and never mutates state',()=>{const b=game();b.run(`begin('shared');finish('shared');a.story.push({d:'旧日',t:'<script>not executed</script>亲子记录。'});
 var before=JSON.stringify(S),oldR=Math.random;Math.random=()=>{throw Error('random on read')};
 for(var i=0;i<4;i++){personalLifePanel(a);lifeProposal(b);lifeBiography(a);lifeWorksPanel(a);lifeLeads();lifeVoice(a);}
 assert.equal(JSON.stringify(S),before);Math.random=oldR;
 var html=lifeBiography(a);assert.match(html,/翻阅这一篇的原始纪事/);assert.match(html,/柳音/);assert.match(html,/A.go/);assert.ok(!html.includes('<script>'));assert.match(html,/心中所记/);`);});
test('pending invitations and results replay identically through a new runtime',()=>{
 const b=game();b.run('A.lifePlan(a.id);save("auto");');const before=b.run('JSON.stringify({text:curEv.text,state:S.personalLife,energy:E().energy})');
 const n=restore(b);assert.equal(n.run('JSON.stringify({text:curEv.text,state:S.personalLife,energy:E().energy})'),before);
 n.run('choose(0);save("auto");');const after=n.run('JSON.stringify({result:modalResult,life:S.consorts[0].personalLife,energy:E().energy})');
 const r=restore(n);assert.equal(r.run('JSON.stringify({result:modalResult,life:S.consorts[0].personalLife,energy:E().energy})'),after);
});
test('exposing a coauthors private pages creates her own reservation and a distinct negative memory',()=>{const b=game();b.run(`begin('shared');finish('public');assert.match(lifeBoundary(b).cause,/未再征询/);
 assert.ok(NPCMemory.recall(S,b.id).some(m=>m.type==='personal-life'&&m.emotion<0&&m.interpretation.includes('稿子传了出去')));
 E().energy=4;A.lifeCoauthor(a.id,b.id);choose(0);drain();assert.equal(lifeFriendScore(a,b),0);assert.ok(lifePartners(a).includes(b));assert.ok(lifeBoundary(b));`);});
test('changed family circumstances invalidate a displayed goal instead of charging for a different child',()=>{const b=game();b.run(`var first=makeKid(a,'m','承安'),second=makeKid(a,'f','昭宁');first.foster=b.id;second.foster=b.id;
 var proposal=lifeProposal(a);first.visitRule='closed';var energy=E().energy;assert.equal(lifeStart(a,proposal,'private'),null);assert.equal(E().energy,energy);assert.equal(a.personalLife,undefined);`);});

test('infant journals describe maternal observations rather than a baby choosing or writing stories',()=>{const b=game();b.run(`var k=makeKid(a,'f','明月');k.foster=b.id;begin('private');advance();assert.match(k.story.at(-1).t,/小动作/);assert.doesNotMatch(k.story.at(-1).t,/孩子也挑/);`);});
