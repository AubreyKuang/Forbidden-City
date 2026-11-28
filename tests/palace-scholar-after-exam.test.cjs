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
