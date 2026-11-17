const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){
 const b=boot(202);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=120;S.year=11;S.month=4;E().energy=10;E().treasury=2000;S.flags.dowager.alive=false;
  var [a,z]=harem();a.upbringing={group:'merchant',means:'ample'};z.upbringing={group:'scholar',means:'modest'};
  for(const c of [a,z]){c.hp=90;c.preg=0;c.alive=true;c.cold=false;}`);
 return b;
}
test('palace stewards keep their own upbringing details and can revisit the same Duanwu case',()=>{
 const b=world();b.run(`A.assignDuanwu();choose(0);choose(0);drain();
  var thread=a.story.at(-1).thread;
  assert.match(a.story.at(-1).t,/看铺账/);assert.match(z.story.at(-1).t,/礼签.*底稿/);
  assert.equal(z.story.at(-1).thread,thread);
  S.month=5;S.turn++;palaceDutiesTick();A.reviewDuanwu();choose(0);drain();
  var rows=a.story.filter(e=>e.thread===thread);assert.equal(rows.length,2);
  assert.match(rows[1].t,/席图.*谁在何处出了力/);
  assert.ok(rows[0].life.people.some(p=>p.id===z.id));
  assert.match(chronicleReader(a),/回看前因与后续 · 2则/);`);
});
test('schoolwork connects the child’s revision and both mothers after a pending save',()=>{
 let b=world();b.run(`S.children=[];var k=makeKid(a,'f','清和');k.foster=z.id;k.born=S.turn-108;k.lit=80;k.hp=85;k.temperament='审慎';k.pendingName=false;`);
 b.force(0,0);b.run(`var e=kidEvent();assert.equal(e.title,'上书房');e.choices[0].f();
  var thread=k.schoolRevision.thread;assert.match(a.story.at(-1).t,/家中旧账/);assert.match(z.story.at(-1).t,/家中旧书/);
  assert.equal(a.story.at(-1).thread,thread);assert.equal(z.story.at(-1).thread,thread);
  S.turn=k.schoolRevision.due-1;assert.equal(pendingRoyalSchoolRevision(),null);
  A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.includes('再看旧稿')));save('1');`);
 b=boot(717,b.storage);b.ctx.assert=assert;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var k=S.children.find(k=>k.name==='清和'),thread=k.schoolRevision.thread;
  assert.match(pendingRoyalSchoolRevision().text,/逐笔核过日期/);drain();
  assert.equal(k.schoolRevision,undefined);assert.equal(k.story.filter(e=>e.thread===thread).length,2);
  assert.match(k.story.findLast(e=>e.thread===thread).t,/留给同窗参考/);
  for(const c of mothersOf(k))assert.equal(c.story.filter(e=>e.thread===thread).length,2);`);
});
test('local investigation, imperial response and later inspection form a single official case',()=>{
 const b=world();b.run(`var p=houseOf(a).father,person=courtPerson(a.id+':father');
  p.office=p.post='清河知县';p.alive=true;p.age=45;p.ability=85;p.trust=70;delete p.report;delete p.lastLocalReport;delete p.lastCareerChange;`);
 b.force(0,0,.92,0);b.run(`var report=createLocalReport(person),thread=localChronicleThread(report);
  assert.match(p.story.at(-1).t,/家中核收/);
  A.officialReport(person.key);choose(curEv.choices.findIndex(c=>c.t.startsWith('下诏褒奖')));drain();
  assert.equal(p.localChronicleReview.due,S.turn+3);
  S.turn+=2;assert.equal(pendingLocalChronicleReview(),null);S.turn++;
  var ev=pendingLocalChronicleReview();assert.match(ev.text,/逐段记下渗水/);
  ev.choices[0].f();ev.choices[0].f();assert.equal(p.story.filter(e=>e.thread===thread).length,3);
  assert.ok(a.story.some(e=>e.thread===thread&&e.t.includes('外家差务续记')));
  var key=S.gen+':'+p.id;A.chronicleThread(key,p.story.findIndex(e=>e.thread===thread));
  assert.equal(UI.chronicleFilters[key].thread,thread);assert.match(chronicleReader(p),/找到3则/);
  assert.equal(pendingLocalChronicleReview(),null);`);
});
test('military commissions preserve the named officer’s departure and verified return',()=>{
 const b=world();b.run(`a.upbringing={group:'military',means:'comfortable'};var p=houseOf(a).father,e=officialEntry(a.id+':father');
  p.office=p.post='副将';p.age=42;p.alive=true;p.ability=80;p.trust=70;delete p.commission;delete p.report;`);
 b.force(.2);b.run(`assert.ok(assignOfficialTask(e,'escort'));var thread=p.story.at(-1).thread;
  assert.match(p.story.at(-1).t,/家中老将/);S.turn=p.commission.due;officialTaskTick();
  var rows=p.story.filter(e=>e.thread===thread);assert.equal(rows.length,2);
  assert.match(rows[1].t,/点验簿/);assert.equal(a.story.filter(e=>e.thread===thread).length,2);`);
});
