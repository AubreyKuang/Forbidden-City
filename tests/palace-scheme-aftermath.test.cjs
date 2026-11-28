const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(aff){const b=world();b.ctx.assert=assert;b.run(`c.aff=${aff};c.scheme=50;c.xin=null;other.xin=null;var fine=()=>{var ev=punishEv(c,other,'香囊藏麝');return ev.choices[2].f()};`);return b;}

test('a fond consort fined lightly feels ashamed and schemes less, and can later apologise',()=>{
 const b=setup(70);b.run(`var out=fine();assert.equal(xinOf(c),'愧疚');assert.equal(c.scheme,49);assert.match(out,/几夜没睡好/);assert.match(c.story.at(-1).t,/【宫斗余波】/);
  var ev=XEV['愧疚'](c,c.xin);assert.equal(ev.title,'赔罪');assert.deepEqual(ev.choices.map(x=>x.t),['准她去','朕替你把话带到','“罚过了，不必再提。”']);`);
});
test('a cold consort fined lightly only feels lucky and keeps an eye on the victim',()=>{
 const b=setup(20);b.run(`fine();assert.equal(xinOf(c),'侥幸');assert.equal(c.xin.who,other.id);assert.equal(c.scheme,57);var ev=XEV['侥幸'](c,c.xin);assert.equal(ev.title,'旧态');`);
});
test('three light verdicts in a row make her fearless, embolden schemers, and the court can see the history',()=>{
 const b=setup(70);b.run(`var third=makeGirl({sur:'柳',given:'如烟',age:22,trait:'温婉',fam:{t:'商户',p:30}});addConsort(third,3,'入宫');third.solitary=null;third.scheme=65;
  fine();fine();var ev=punishEv(c,other,'香囊藏麝');assert.match(ev.text,/第3回事发。前2回都只罚了俸/);assert.match(ev.choices[2].t,/已连着2回从轻/);
  var before=c.scheme;ev.choices[2].f();assert.equal(xinOf(c),'有恃无恐');assert.equal(c.schemeRecord.lenient,3);assert.equal(c.scheme,Math.min(100,before+11));assert.equal(third.scheme,67);
  var boldEv=XEV['有恃无恐'](c,c.xin);assert.equal(boldEv.title,'气焰');boldEv.choices[0].f();assert.equal(c.schemeRecord.lenient,0);assert.equal(xinOf(c),'惶恐');`);
});
test('demotion breaks the lenient streak: fear for a fond consort, a grudge against the victim for a cold one',()=>{
 const b=setup(70);b.run(`fine();var ev=punishEv(c,other,'石阶泼油');assert.match(ev.text,/上回只罚了俸/);ev.choices[1].f();assert.equal(c.schemeRecord.lenient,0);assert.equal(xinOf(c),'余悸');assert.equal(XEV['余悸'](c,c.xin).title,'惊梦');`);
 const g=setup(10);g.run(`var rel=relGet(c,other);punishEv(c,other,'石阶泼油').choices[1].f();assert.equal(xinOf(c),'怨恨');assert.equal(c.xin.who,other.id);assert.ok(relGet(c,other)<=rel-55);`);
});
test('older journals keep the old verdict wording and no aftermath',()=>{
 const b=setup(70);b.run(`PalaceActions.reset();var real=journalContentVersion;journalContentVersion=()=>166;var ev=punishEv(c,other,'香囊藏麝');assert.equal(ev.choices[2].t,'念其初犯，罚俸了事');ev.choices[2].f();assert.equal(c.schemeRecord,undefined);assert.equal(xinOf(c),'平和');assert.equal(c.scheme,55);journalContentVersion=real;`);
});
