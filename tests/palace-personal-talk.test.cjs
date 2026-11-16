const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs'),{world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const w=base();w.ctx.assert=assert;w.run(`
 for(var c of S.consorts){delete c.lastPersonalAttention;delete c.palaceWelcome;c.imperialNights=[];c.arc={id:'love',done:true};}
 q.favor=100;q.lastPersonalAttention=0;a.favor=80;a.lastPersonalAttention=60;
 b.trait='善妒';b.scheme=90;b.favor=10;
 var jealous=()=>HAREM.find(f=>f.name==='jealous')();
 `);return w;}
test('jealousy names the recently favored consort rather than the long-neglected empress',()=>{
 const w=world();w.run(`var ev=jealous();assert.ok(ev.present.includes(a));assert.ok(!ev.present.includes(q));assert.match(ev.text,/沈贵人/);assert.doesNotMatch(ev.text,/坤宁宫|皇后|近日总往/);ev.choices[0].f();assert.ok(ev.por.story.some(s=>s.t.includes('沈知微')));`);
});
test('viewing a profile, old visits and future timestamps do not establish current favor',()=>{
 const w=world();w.run(`a.lastPersonalAttention=57;a.imperialNights=[57,61];A.go('consort',q.id);assert.equal(jealous(),null);a.palaceWelcome={turn:58};assert.ok(jealous().present.includes(a));`);
});
for(const state of ['gone','cold','homeLeave','templeStay'])test('jealousy excludes unavailable favored consorts: '+state,()=>{
 const w=world();w.run(`a.${state}=true;assert.equal(jealous(),null);`);
});
test('an empress who really has received recent attention can still be the favored person',()=>{
 const w=world();w.run(`q.imperialNights=[59,60];assert.ok(jealous().present.includes(q));`);
});
function loveWorld(){const w=world();w.run(`a.arc={id:'love',st:2,t:0,f:{token:'proud',respected:true},done:false};a.aff=85;a.nights=3;a.favor=5;S.flags.arcPacing={byType:{}};`);return w;}
test('love keepsakes require actual past attention, not randomized starting affection or rank',()=>{
 const w=loveWorld();w.run(`a.nights=0;assert.equal(arcTick(),null);assert.equal(a.arc.f.token,'proud');a.nights=3;assert.match(arcTick().text,/并蒂花笺/);`);
});
test('longstanding shared moments also qualify, while an invented token cannot reach the vow',()=>{
 const w=loveWorld();w.run(`a.nights=0;a.sharedMoments={count:2,items:[{turn:40},{turn:50}]};assert.ok(loveArcEligible(a));delete a.arc.f.respected;assert.equal(ARCS.love.stages[2](a,a.arc.f),null);a.arc.f.shared=true;assert.match(ARCS.love.stages[2](a,a.arc.f).text,/一同完成的痕迹/);`);
});
test('love chapters wait six months for the same person and eighteen for another',()=>{
 const w=loveWorld();w.run(`a.arc.st=0;S.flags.arcPacing={byType:{love:{person:a.id,turn:55}}};assert.equal(arcTick(),null);S.turn=61;assert.ok(arcTick());a.arc.t=0;S.flags.arcPacing={byType:{love:{person:b.id,turn:44}}};assert.equal(arcTick(),null);S.turn=62;assert.ok(arcTick());`);
});
test('the old-token vow is limited to once per two years and cannot repeat after completion',()=>{
 const w=loveWorld();w.run(`S.flags.arcPacing={byType:{},loveVow:37};assert.equal(arcTick(),null);S.turn=61;var ev=arcTick();assert.ok(ev);ev.onQueue();assert.equal(S.flags.arcPacing.loveVow,61);ev.choices[0].f();assert.equal(a.arc.done,true);S.turn=100;assert.equal(arcTick(),null);`);
});
function chatWorld(){const w=world();w.run(`
 a.aff=85;a.nights=3;a.wish='travel';if(!WISHES[a.wish])a.wish=Object.keys(WISHES)[0];a.wishKnown=false;a.wishDone=false;a.kl=false;a.woundKnown=false;
 a.personalLife={boundary:{gen:S.gen,cause:'静姝身世已查明，却仍记得母子受疑',turn:S.turn,acknowledged:false,resolved:false}};
 a.xin={k:'委屈',why:'静姝身世已查明，却仍记得母子受疑',t:S.turn};
 var k=makeKid(a,'f','静姝');k.pendingName=false;S.rel[rk(a,b)]=60;S.rel[rk(a,q)]=0;
 Math.random=()=>0;PalaceActions.reset();
 `);return w;}
test('one chat starts with her mood and does not reveal unrelated wishes, likes or past',()=>{
 const w=chatWorld();w.run(`var energy=E().energy;A.chat(a.id);assert.equal(a.chatThread.lastTopic,'mood');assert.match(curEv.text,/身世已查明/);assert.doesNotMatch(curEv.text,/许清容|最喜欢|心愿|孩子还小/);assert.equal(a.wishKnown,false);assert.equal(a.kl,false);assert.equal(a.woundKnown,false);assert.equal(xinOf(a),'委屈');assert.equal(E().energy,energy-1);`);
});
test('later chats unfold children, relationships and wishes in separate scenes',()=>{
 const w=chatWorld();w.run(`A.chat(a.id);drain();A.chat(a.id);assert.equal(a.chatThread.lastTopic,'child');assert.match(curEv.text,/静姝/);assert.doesNotMatch(curEv.text,/许清容|心愿|最喜欢/);drain();A.chat(a.id);assert.equal(a.chatThread.lastTopic,'relations');assert.match(curEv.text,/许清容/);assert.doesNotMatch(curEv.text,/静姝|心愿|最喜欢/);drain();A.chat(a.id);assert.equal(a.chatThread.lastTopic,'wish');assert.equal(a.wishKnown,true);assert.equal(a.kl,false);assert.equal(a.woundKnown,false);assert.equal(xinOf(a),'委屈');`);
});
test('a new month first asks about mood while retaining the unfinished topic progression',()=>{
 const w=chatWorld();w.run(`A.chat(a.id);drain();A.chat(a.id);drain();A.chat(a.id);drain();S.turn++;S.month++;A.chat(a.id);assert.equal(a.chatThread.lastTopic,'mood');drain();A.chat(a.id);assert.equal(a.chatThread.lastTopic,'wish');`);
});
test('a new emotional event interrupts the topic order; a childless consort never invents a child',()=>{
 const w=chatWorld();w.run(`S.children=[];A.chat(a.id);drain();A.chat(a.id);assert.equal(a.chatThread.lastTopic,'relations');drain();a.xin={k:'悲恸',t:S.turn,why:'父亲病逝'};delete a.personalLife.boundary;A.chat(a.id);assert.equal(a.chatThread.lastTopic,'mood');assert.equal(xinOf(a),'悲恸');assert.doesNotMatch(curEv.text,/静姝/);`);
});
test('refresh preserves the active chat and continues with the next subject',()=>{
 let w=chatWorld();w.run(`A.chat(a.id);`);const text=w.run('curEv.text'),id=w.run('a.id');
 w=boot(401,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);assert.equal(w.run('curEv.text'),text);w.run(`drain();Math.random=()=>0;A.chat(${id});assert.equal(byId(${id}).chatThread.lastTopic,'child');`);
});
for(const [name,title] of [['jealous','醋海生波'],['love','相伴有凭'],['chat','闲话家常']])test('genuine v25 '+name+' pending scenes replay unchanged before adopting the new rules',()=>{
 const payload=require('./fixtures/'+name+'-legacy-v25.json'),w=boot(500,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,25);assert.equal(curEv.title,'${title}');drain();assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,41);`);
});
