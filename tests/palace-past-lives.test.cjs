const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(328);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=24;var old=S.consorts[1];old.sur='沈';old.given='清蘅';old.age=24;old.aff=80;story(old,'曾与陛下在雨后廊下听琴，约好来年再看海棠。');old.alive=false;archivePastLives();S.turn++;var c=makeGirl({sur:'陆',given:'知微',age:19,trait:'才女'});deepen(c);c.travelerChecked=true;S.cands=[c];PalaceActions.reset();`);return b;}
function assign(b){b.force(0,0,0);b.run(`assignPastLifeCandidates();assert.ok(c.pastLife);`);}
function admit(b){assign(b);b.run(`addConsort(c,3,'选秀入宫');c.aff=80;S.turn+=3;E().energy=10;PalaceActions.reset();`);}
test('only deceased adult consorts with real affinity become sources; an observed death must precede selection',()=>{
 const b=boot();b.run(`assert.equal(S.pastLives.sources.length,1);assert.equal(pastLifeCandidates()[0].name,'沈清蘅');assert.match(pastLifeCandidates()[0].pages.at(-1).t,/雨后廊下听琴/);S.turn--;assert.equal(pastLifeCandidates().length,0);for(var o of [{alive:true},{alive:false,aff:10},{alive:false,maid:true},{alive:false,gone:true},{alive:false,age:17},{alive:false,pastLife:{}}]){var x={...old,id:S.nid++,...o};S.consorts.push(x);}archivePastLives();assert.equal(S.pastLives.sources.length,1);`);
});
test('rare selection preserves current family, personality, age and portrait; rendering never rerolls',()=>{
 const b=boot();b.run(`var identity=JSON.stringify([c.age,c.sur,c.given,c.fam,c.trait,c.seed,c.portraitVariant]);`);assign(b);
 b.run(`assert.equal(JSON.stringify([c.age,c.sur,c.given,c.fam,c.trait,c.seed,c.portraitVariant]),identity);assert.equal(initTimeTraveler(c,true),null);S.selection={phase:'audience',current:c.id};var hint=pastLifeSelectionHint(c);assert.match(viewSelectionAudience(),/仿佛有故人之姿/);for(var i=0;i<20;i++)assert.equal(pastLifeSelectionHint(c),hint);S.selection.phase='roster';assert.match(viewXX(),/仿佛有故人之姿/);assert.ok(!hint.includes(old.given));`);
});
test('failed rarity rolls, minors, relatives and time travelers do not receive this origin',()=>{
 const b=boot();b.force(.99);b.run(`assignPastLifeCandidates();assert.equal(c.pastLife,undefined);`);
 for(const setup of ['c.age=17','c.age=19;c.kin={1:"亲"}','delete c.kin;c.timeTraveler={known:true}']){b.run(setup);b.force(0);b.run(`assignPastLifeCandidates();assert.equal(c.pastLife,undefined);`);}
});
test('unselected candidates do not reserve the source, while one admission consumes it and the reign slot',()=>{
 const b=boot();assign(b);b.run(`var unused=c;A.xxDrop(c.id);assert.equal(S.pastLives.claimed[unused.pastLife.source.key],undefined);c=makeGirl({age:19});deepen(c);c.travelerChecked=true;S.cands=[c];`);assign(b);
 b.run(`addConsort(c,3,'入宫');assert.equal(S.pastLives.claimed[c.pastLife.source.key],c.id);assert.equal(pastLifeCandidates().length,0);var other=makeGirl({age:19});other.pastLife=JSON.parse(JSON.stringify(c.pastLife));addConsort(other,2,'入宫');assert.equal(other.pastLife,undefined);c.alive=false;archivePastLives();assert.equal(S.pastLives.sources.length,1);`);
});
test('successor sources survive court archival, excluding the new emperor mother and dowager',()=>{
 const b=boot();b.run(`var queen=empress(),h=makeKid(old,'m','承明');inheritDowager(h);assert.ok(S.pastLives.excluded.includes(old.id));assert.ok(S.pastLives.excluded.includes(queen.id));assert.equal(pastLifeCandidates().length,0);var saved=JSON.stringify(S.pastLives);S.previousCourts=[];S.consorts=[];S.gen++;assert.equal(JSON.stringify(S.pastLives),saved);`);
});
test('an unrelated prior-reign source speaks of the late emperor, not a new emperor own memories',()=>{
 const b=boot();b.run(`var h=makeKid(empress(),'m','承明');inheritDowager(h);S.consorts=[];S.gen=2;S.emp.name='承明';`);admit(b);
 b.run(`assert.match(pastLifeSelectionHint(c),/老宫人/);assert.match(pastLifeText(c),/并不是一张面容/);c.pastLife.stage=1;assert.match(pastLifeText(c),/并非新帝亲历/);assert.match(pastLifeText(c),/沈清蘅/);c.pastLife.stage=2;assert.match(pastLifeText(c),/不拿先帝的情分/);`);
});
test('older successor saves exclude recorded birth mothers and prior empresses on first migration',()=>{
 const b=boot();b.run(`var queen=empress();queen.alive=false;queen.aff=80;S.previousCourts=[{gen:1,emperor:{...E()},consorts:S.consorts}];S.consorts=[];S.gen=2;delete S.pastLives;S.flags.birthDowager={personId:old.id,alive:false};archivePastLives();S.turn++;assert.equal(pastLifeCandidates().length,0);`);
});
test('three separated conversations unlock actual archived history, ending and continuing everyday voice',()=>{
 const b=boot();admit(b);b.run(`assert.ok(pastLifeReady(c));var ev=pastLifeEvent(c);assert.match(ev.text,/回廊/);ev.choices[0].f();assert.equal(c.pastLife.stage,1);assert.equal(E().energy,9);assert.equal(ev.choices[0].f(),null);assert.equal(pastLifeEvent(c),null);S.turn+=6;assert.match(pastLifeEvent(c).text,/雨后廊下听琴/);pastLifeEvent(c).choices[0].f();assert.match(pastLifePanel(c),/翻阅故人的纪事/);S.turn+=6;pastLifeEvent(c).choices[0].f();assert.equal(c.pastLife.ending,'再续前缘');assert.equal(pastLifeEvent(c),null);assert.equal(E().energy,7);assert.equal(c.pastLife.history.length,3);assert.match(pastLifeVoice(c).lines.join(''),/重演从前/);assert.ok(NPCMemory.recall(S,c.id).some(m=>m.type==='past-life'));assert.ok(!NPCMemory.recall(S,c.id).some(m=>m.type==='palace-arrival'));`);
});
test('present-life ending and closing are respected without repeated prompts or copied old bonds',()=>{
 const b=boot();admit(b);b.run(`c.pastLife.stage=2;pastLifeEvent(c).choices[1].f();assert.equal(c.pastLife.ending,'珍重今生');assert.match(pastLifeVoice(c).lines.join(''),/一页一页/);c.pastLife.stage=0;c.pastLife.last=null;pastLifeEvent(c).choices[1].f();assert.ok(c.pastLife.closed);assert.equal(pastLifeVoice(c),null);assert.equal(pastLifeEvent(c),null);assert.ok(!pastLifePanel(c).includes('onclick="A.pastLifeTalk'));assert.ok(!c.story.some(s=>s.t===old.story.at(-1).t));`);
});
test('health, grief, affinity, residency, age and stale event checks guard actions and cost',()=>{
 const b=boot();admit(b);b.run(`var ev=pastLifeEvent(c);E().energy=0;assert.equal(ev.choices[0].f(),null);E().energy=10;for(var field of ['cold','gone','templeStay','maid']){c[field]=true;assert.equal(pastLifeEvent(c),null);assert.equal(ev.choices[0].f(),null);delete c[field];}c.alive=false;assert.equal(pastLifeEvent(c),null);c.alive=true;c.age=17;assert.equal(pastLifeEvent(c),null);c.age=19;c.aff=34;assert.equal(pastLifeEvent(c),null);c.aff=80;c.hp=20;assert.equal(pastLifeEvent(c),null);c.hp=100;setXin(c,'悲恸','家人去世');assert.equal(pastLifeEvent(c),null);assert.equal(E().energy,10);assert.equal(c.pastLife.stage,0);`);
});
test('pending conversations and completed choices survive replay without duplicate costs',()=>{
 const b=boot();admit(b);b.run(`A.pastLifeTalk(c.id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'梦里回廊');choose(0);save('2');A.load('2');assert.equal(PalaceActions.blocked,false);drain();c=byId(c.id);assert.equal(E().energy,9);assert.equal(c.pastLife.stage,1);assert.equal(c.pastLife.history.length,1);S.turn+=6;PalaceActions.reset();A.chat(c.id);assert.equal(curEv.title,'前尘有名');`);
});
test('monthly invitations reserve cooldown only when queued and declining leaves the stage intact',()=>{
 const b=boot();admit(b);b.force(0,0);b.run(`var ev=pastLifeMonthlyEvent();assert.ok(ev);assert.equal(S.flags.lastPastLifeEvent,undefined);ev.onQueue();assert.equal(pastLifeMonthlyEvent(),null);assert.equal(c.pastLife.stage,0);assert.equal(E().energy,10);`);
});
test('priest conversation is once per life, respects late pregnancy, and leaves facts unchanged',()=>{
 const b=boot();admit(b);b.run(`c.pastLife.stage=1;c.preg=8;var facts=JSON.stringify([c.age,c.fam,c.trait,c.preg,c.aff]);PalaceActions.reset();A.pastLifePriest(c.id);assert.match(curEv.text,/本宫静养/);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);choose(0);drain();c=byId(c.id);assert.ok(c.pastLife.priest);assert.equal(E().energy,9);assert.equal(JSON.stringify([c.age,c.fam,c.trait,c.preg,c.aff]),facts);A.pastLifePriest(c.id);assert.equal(modalOpen,false);`);
});
