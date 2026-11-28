const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
// c: 吏部尚书之女 (显赫). poor: 寒门之女. other: 知府之女, too close to poor to be envied.
function setup(trait='温婉'){const b=world();b.ctx.assert=assert;b.run(`Q.length=0;modalOpen=false;curEv=null;E().treasury=500;E().energy=5;
  var poor=makeGirl({sur:'柳',given:'如烟',age:22,trait:'${trait}',fam:{t:'寒门',p:5}});addConsort(poor,3,'入宫');poor.solitary=null;poor.t2=null;poor.mood=70;poor.xin=null;
  c.fam={t:'吏部尚书',p:78};c.xin=null;other.fam={t:'知府',p:38};other.xin=null;`);return b;}

test('a consort from a humble house envies the one whose family is grand, and it is written into her record',()=>{
 const b=setup('活泼');b.run(`assert.equal(familyHumble(poor),true);assert.equal(familyHumble(c),false);assert.equal(familyEnvyKind(poor),'plain');assert.equal(familyEnvyTarget(poor),c);assert.equal(familyEnvyTarget(c),null);
  assert.equal(familyEnvyEligible(poor),true);assert.equal(familyEnvyEligible(c),false);
  familyEnvyBegin(poor,c);assert.equal(xinOf(poor),'艳羡');assert.equal(poor.xin.who,c.id);assert.match(poor.story.at(-1).t,/^【心境·艳羡】见沈知微.*想起自家/);
  assert.doesNotMatch(poor.story.at(-1).t,/门衰祚薄/);assert.match(xinDetail(poor),/艳羡/);assert.ok(NEGX.includes('艳羡'));
  assert.equal(familyEnvyEligible(poor),false);`);
});

test('an inward-turning consort says her own house is 门衰祚薄; a detached one is not moved at all',()=>{
 const b=setup('痴情');b.run(`assert.equal(familyEnvyKind(poor),'inward');familyEnvyBegin(poor,c);assert.equal(xinOf(poor),'自伤');assert.match(poor.story.at(-1).t,/^【心境·自伤】.*自叹门衰祚薄/);
  var ev=XEV['自伤'](poor,poor.xin);assert.equal(ev.title,'门衰祚薄');assert.match(ev.text,/门衰祚薄，连个替臣妾递句话的人都没有/);
  assert.deepEqual(proseEpigraph(ev),{line:'既无伯叔，终鲜兄弟，门衰祚薄，晚有儿息。',source:'李密《陈情表》'});
  var aff=poor.aff;ev.choices[0].f();assert.equal(xinOf(poor),'感激');assert.ok(poor.aff>aff);assert.ok(poor.story.some(s=>/【门第之叹】.*你还有朕/.test(s.t)));`);
 const tears=setup('温婉');tears.run(`poor.t2='爱哭';assert.equal(familyEnvyKind(poor),'inward');`);
 const calm=setup('淡泊');calm.run(`assert.equal(familyEnvyKind(poor),null);assert.equal(familyEnvyEligible(poor),false);`);
});

test('the envy scene can be answered with company or a gift to her family; a sour consort left alone holds it against the other',()=>{
 const b=setup('善妒');b.run(`assert.equal(familyEnvyKind(poor),'sour');var scheme=poor.scheme;familyEnvyBegin(poor,c);assert.equal(poor.scheme,Math.min(100,scheme+1));
  var ev=XEV['艳羡'](poor,poor.xin);assert.equal(ev.title,'别家的热闹');assert.match(ev.text,/不过是会投胎/);
  var rel=relGet(poor,c);ev.choices[2].f();assert.equal(relGet(poor,c),rel-5);assert.match(poor.story.at(-1).t,/【门第之叹】/);`);
 const gift=setup('活泼');gift.run(`familyEnvyBegin(poor,c);var ev=XEV['艳羡'](poor,poor.xin);assert.match(ev.text,/过年也只摆两副碗筷/);
  var out=ev.choices[1].f();assert.equal(E().treasury,480);assert.equal(xinOf(poor),'释然');assert.match(out,/国库-20万两/);
  E().treasury=10;assert.equal(XEV['艳羡'](poor,{who:c.id}).choices[1].cond(),false);`);
 const meal=setup('活泼');meal.run(`familyEnvyBegin(poor,c);var e=E().energy;XEV['艳羡'](poor,poor.xin).choices[0].f();assert.equal(E().energy,e-1);assert.equal(xinOf(poor),'欢喜');`);
});

test('the monthly tick starts at most one, only for the eligible, and not at all for scenes left by an older version',()=>{
 const b=setup('活泼');b.run(`var random=PalaceActions.random;PalaceActions.random=()=>0;S.month=1;familyEnvyTick();assert.equal(xinOf(poor),'艳羡');
  poor.xin=null;familyEnvyTick();assert.equal(xinOf(poor),'平和');
  poor.familyEnvy=null;PalaceActions.random=()=>.99;familyEnvyTick();assert.equal(xinOf(poor),'平和');
  PalaceActions.random=()=>0;var real=journalContentVersion;journalContentVersion=()=>172;PalaceActions.reset();familyEnvyTick();assert.equal(xinOf(poor),'平和');journalContentVersion=real;PalaceActions.random=random;`);
 const none=setup('活泼');none.run(`c.fam={t:'知府',p:38};other.fam={t:'知府',p:38};var calls=0,random=PalaceActions.random;PalaceActions.random=()=>{calls++;return 0;};
  if(!familyEnvyTarget(poor)){familyEnvyTick();assert.equal(calls,0);assert.equal(xinOf(poor),'平和');}PalaceActions.random=random;`);
});
