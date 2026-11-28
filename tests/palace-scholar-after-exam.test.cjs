const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`Q.length=0;modalOpen=false;curEv=null;c.trait='才女';c.aff=80;c.solitary=null;c.arc=makeArc('scholar',0);c.arc.t=S.turn;S.flags.scholarArc=c.id;
  other.arc=makeArc('craft',0);other.arc.t=S.turn-5;other.aff=80;other.trait='才女';S.flags.arcPacing={byType:{}};ministryState().exams=[];`);return b;}

test('the old-flame poem waits until a palace exam has named a top scholar',()=>{
 const b=setup();b.run(`assert.equal(courtOfficesActive(),true);assert.equal(scholarArcOpening(c),true);assert.equal(scholarExamFresh(),false);
  var ev=arcTick();assert.notEqual(ev?.por,c);assert.equal(c.arc.st,0);assert.equal(c.arc.t,S.turn);
  S.flags.arcPacing={byType:{}};ministryState().exams.push({gen:S.gen,year:S.year,turn:S.turn});assert.equal(scholarExamFresh(),false);
  ev=arcTick();assert.notEqual(ev?.por,c);`);
});

test('once the top scholar is named it comes next, ahead of other stories that were due earlier',()=>{
 const b=setup();b.run(`ministryState().exams.push({gen:S.gen,year:S.year,turn:S.turn-1,top:[1,2,3]});assert.equal(scholarExamFresh(),true);
  var ev=arcTick();assert.equal(ev.por,c);assert.equal(ev.title,'故人诗');assert.match(ev.text,/今科状元的殿试文章里，引了一句诗/);`);
 const late=setup();late.run(`ministryState().exams.push({gen:S.gen,year:S.year-2,turn:S.turn-13,top:[1,2,3]});assert.equal(scholarExamFresh(),false);assert.notEqual(arcTick()?.por,c);`);
});

test('later acts and scenes left by an older version do not wait for an exam',()=>{
 const b=setup();b.run(`c.arc.st=1;c.arc.startedAt=S.turn-5;other.arc.done=true;assert.equal(scholarArcOpening(c),false);var ev=arcTick();assert.equal(ev.por,c);assert.match(ev.text,/琼林宴上/);`);
 const old=setup();old.run(`PalaceActions.reset();var real=journalContentVersion;journalContentVersion=()=>172;other.arc.done=true;var ev=arcTick();assert.equal(ev.por,c);assert.match(ev.text,/今科状元/);journalContentVersion=real;`);
});

function withTopScholar(){const b=setup();b.run(`var top=makeScholar();top.name='陆怀瑾';top.sur='陆';top.examRank='状元';top.examYear=S.year;top.office='翰林院修撰';top.post='翰林院修撰';(S.scholars ||= []).push(top);
  ministryState().exams.push({gen:S.gen,year:S.year,turn:S.turn-1,top:[top.id]});other.arc.done=true;
  var act=()=>{S.flags.arcPacing={byType:{}};c.arc.t=S.turn;return arcTick();};`);return b;}

test('the poem names the top scholar the emperor actually chose, through all three acts',()=>{
 const b=withTopScholar();b.run(`var ev=act();assert.match(ev.text,/^今科状元陆怀瑾的殿试文章里，引了一句诗/);assert.equal(c.arc.f.scholarId,top.id);ev.onQueue();ev.choices[1].f();
  ev=act();assert.match(ev.text,/琼林宴上，状元陆怀瑾奉旨献诗/);ev.choices[1].f();ev=act();assert.match(ev.text,/是状元陆怀瑾托人带给/);`);
});

test('letting them go: he resigns, stays greyed at the foot of the roster as a former official, and three letters follow',()=>{
 const b=withTopScholar();b.run(`var ev=act();ev.onQueue();ev.choices[1].f();act().choices[1].f();ev=act();var poem=c.arc.f.poem,wife=fullName(c);
  ev.choices[3].f();assert.equal(c.gone,true);assert.equal(c.arc.end,'成全');
  assert.deepEqual(top.leftOffice,{turn:S.turn,former:'翰林院修撰',wife});assert.equal(top.retired,true);assert.equal(top.married,true);assert.equal(top.spouseName,wife);
  assert.equal(officialServing(top),false);assert.equal(officialStatus(top),'辞官归隐');assert.equal(officialOfficeLabel(top),'曾任翰林院修撰');
  assert.match(top.story.at(-1).t,/^【故人诗·成全】陛下放.*出宫，成全二人。他上表辞去翰林院修撰，与她同归江南。$/);
  UI.officialsFilter='serving';UI.officialsBloc='all';var roster=officialsRoster(),rows=roster.split('<tr').slice(2);
  assert.match(rows.at(-1),/^ class="deceased">[\\s\\S]*陆怀瑾[\\s\\S]*曾任翰林院修撰[\\s\\S]*辞官归隐/);
  var n=top.story.length;scholarCoupleTick();assert.equal(top.story.length,n);
  S.turn+=6;scholarCoupleTick();assert.match(top.story.at(-1).t,/^【江南来信】陆怀瑾与.*开了一间书院，取名“归来堂”/);assert.equal(c.story.at(-1).t,top.story.at(-1).t);assert.equal(S.log.at(-1).t,top.story.at(-1).t);
  scholarCoupleTick();assert.equal(top.story.length,n+1);S.turn+=8;scholarCoupleTick();assert.ok(top.story.at(-1).t.includes(poem));
  S.turn+=12;scholarCoupleTick();assert.match(top.story.at(-1).t,/如愿以偿。$/);S.turn+=40;scholarCoupleTick();assert.equal(top.story.length,n+3);`);
});

test('sending him south is written in his record; an older scene keeps the unnamed scholar and no one resigns',()=>{
 const b=withTopScholar();b.run(`var ev=act();ev.onQueue();ev.choices[1].f();act().choices[1].f();act().choices[2].f();assert.match(top.story.at(-1).t,/【故人诗·诗绝】奉旨外放岭南/);assert.equal(top.leftOffice,undefined);`);
 const old=withTopScholar();old.run(`PalaceActions.reset();var real=journalContentVersion;journalContentVersion=()=>172;var ev=act();assert.match(ev.text,/^今科状元的殿试文章里/);assert.equal(c.arc.f.scholarId,undefined);
  ev.onQueue();ev.choices[1].f();act().choices[1].f();act().choices[3].f();assert.equal(top.leftOffice,undefined);assert.equal(S.flags.scholarCouple,undefined);journalContentVersion=real;`);
});
