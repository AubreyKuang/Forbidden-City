const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(extra=''){const b=world();b.ctx.assert=assert;b.run(`c.xin=null;other.xin=null;c.story=[];var month=n=>{for(var i=0;i<n;i++){S.turn++;xinTick(c);}};var enterCold=(aff,guilty)=>{c.aff=aff;c.cold=true;c.palace='冷宫';if(guilty)story(c,'香囊藏麝事发，被打入冷宫。');xinTick(c);};${extra}`);return b;}

test('cold palace: a guilty consort who still cares regrets, goes numb when nobody comes, and only despairs after a year',()=>{
 const b=setup();b.run(`enterCold(60,true);month(1);assert.equal(xinOf(c),'平和');month(1);assert.equal(xinOf(c),'懊悔');assert.match(c.story.at(-1).t,/【冷宫岁月】入冷宫第2个月/);
  month(3);assert.equal(xinOf(c),'懊悔');month(1);assert.equal(xinOf(c),'麻木');month(5);assert.equal(xinOf(c),'麻木');month(1);assert.equal(xinOf(c),'心如死灰');`);
});
test('cold palace: who she is decides the thought',()=>{
 const hope=setup();hope.run(`enterCold(60,false);month(2);assert.equal(xinOf(c),'盼望');`);
 const bitter=setup();bitter.run(`enterCold(20,false);month(2);assert.equal(xinOf(c),'怨恨');assert.equal(c.xin.who,'emp');`);
 const wronged=setup();wronged.run(`S.flags.wronged={v:c.id,a:other.id};enterCold(20,false);month(2);assert.equal(xinOf(c),'盼望');assert.match(c.xin.why,/冤屈/);`);
});
test('cold palace: a visit costs energy, is once a month, resets the clock and is recorded',()=>{
 const b=setup();b.run(`enterCold(60,false);month(7);assert.equal(xinOf(c),'麻木');var e=E().energy;A.coldVisit(cid=c.id);assert.equal(E().energy,e-1);assert.equal(curEv.title,'冷宫 · 木');
  choose(0);drain();assert.equal(xinOf(c),'盼望');assert.match(c.story.at(-1).t,/陪她坐了一会儿/);A.coldVisit(c.id);assert.equal(E().energy,e-1);
  month(5);assert.equal(xinOf(c),'盼望');assert.match(consortSeasonsPanel(c),/冷宫岁月 · 已 12 个月 · 探望 1 次/);assert.match(palaceLifeActions(c),/去冷宫探望/);`);
});
test('cold palace: a promise to come back that is not kept turns hope into resentment',()=>{
 const b=setup();b.run(`enterCold(60,false);month(2);A.coldVisit(c.id);assert.equal(curEv.title,'冷宫 · 盼');choose(1);drain();assert.equal(c.coldLife.promise,S.turn);month(6);assert.equal(xinOf(c),'怨恨');assert.match(c.xin.why,/没有来/);`);
});
test('cold palace: older journals keep the three-month rule',()=>{
 const b=setup();b.run(`var real=journalContentVersion;journalContentVersion=()=>170;enterCold(60,true);month(3);assert.equal(xinOf(c),'心如死灰');assert.equal(palaceLifeActions(c),'');journalContentVersion=real;`);
});
test('fallen favour: she asks why, and the answer sets what she works on',()=>{
 const b=setup();b.run(`c.nights=5;c.aff=70;c.favor=10;c.enteredAt=0;c.lastPersonalAttention=S.turn-8;c.imperialNights=[S.turn-9];c.trait='骄纵';c.virtue=40;c.scheme=50;
  assert.ok(favorInquiryCandidate(c));var ev;for(var i=0;i<60&&!ev;i++)ev=favorInquiryEvent(c);assert.equal(ev.title,'失宠之问');assert.match(ev.text,/已有8个月没来了/);
  ev.onQueue();ev.choices[1].f();assert.equal(c.resolve.k,'改性子');assert.ok(c.story.some(s=>/【失宠之问】/.test(s.t)));assert.ok(!favorInquiryCandidate(c));
  for(var i=0;i<6;i++){S.turn++;favorResolveTick(c);}assert.equal(c.virtue,49);assert.equal(c.scheme,41);assert.equal(c.resolve,undefined);assert.match(c.story.at(-1).t,/【失宠之后】/);`);
 const kid=setup();kid.run(`var k=makeKid(c,'m','承安');k.born=S.turn-60;k.lit=40;var ev;c.nights=5;c.aff=70;c.favor=10;c.enteredAt=0;c.lastPersonalAttention=S.turn-8;for(var i=0;i<60&&!ev;i++)ev=favorInquiryEvent(c);ev.choices[3].f();assert.equal(c.resolve.k,'顾孩子');S.turn++;favorResolveTick(c);assert.ok(k.lit>40);assert.match(consortSeasonsPanel(c),/把心思放在孩子身上/);`);
});
test('fallen favour: a consort never summoned, or recently seen, does not ask',()=>{
 const b=setup();b.run(`c.nights=0;c.aff=70;c.favor=10;c.lastPersonalAttention=S.turn-8;assert.ok(!favorInquiryCandidate(c));c.nights=5;c.lastPersonalAttention=S.turn-2;assert.ok(!favorInquiryCandidate(c));`);
});
test('last year: physicians give a year, visits are recorded, and she passes with a notice',()=>{
 const b=setup();b.run(`drain();c.seed=1000;c.trait='温婉';assert.equal(consortLifespan(c),50);c.age=48;twilightTick();assert.equal(c.twilight,undefined);c.age=49;twilightTick();assert.equal(c.twilight.since,S.turn);
  assert.equal(curEv.title,'太医密奏 · '+fullName(c));choose(0);drain();assert.match(palaceLifeTag(c),/时日无多/);
  for(var i=0;i<3;i++){S.turn++;E().energy=5;A.twilightVisit(c.id);assert.equal(curEv.title,'陪伴');choose(0);drain();A.twilightVisit(c.id);assert.equal(curEv,null);}
  assert.equal(c.twilight.visits,3);assert.match(consortSeasonsPanel(c),/已陪伴 3 次/);
  S.turn=c.twilight.since+12;twilightTick();assert.equal(c.alive,false);assert.equal(c.deathReason,'寿终正寝');assert.match(curEv.title,/后宫丧讯/);assert.match(curEv.text,/走得很安详/);assert.ok(c.passingDate);
  assert.equal(S.dynastyGoals.lastCompany.completed,true);choose(0);assert.match(c.story.at(-1).t,/追封/);`);
});
test('last year: her children hear of it and the wish is asked once after six months',()=>{
 const b=setup();b.run(`drain();var k=makeKid(c,'f','清和');k.born=S.turn-100;c.seed=1000;c.age=49;twilightTick();choose(0);drain();S.turn+=6;twilightTick();assert.equal(curEv.title,'最后的心愿');assert.match(curEv.text,/孩子们坐在一处/);
  choose(0);drain();assert.match(k.story.at(-1).t,/陪母亲吃了一顿饭/);assert.equal(c.twilight.wish,true);S.turn++;twilightTick();assert.equal(curEv,null);`);
});
test('hidden achievements show a hint until they are done, and the new ones complete',()=>{
 const b=setup();b.run(`assert.match(dynastyGoalsPanel(),/线索：同一家的女儿/);c.schemeRecord={n:3,lenient:0,last:'demote'};palaceLifeGoals();assert.equal(S.dynastyGoals.fairJudge.completed,true);
  c.schemeRecord.everFined=true;delete S.dynastyGoals.fairJudge;palaceLifeGoals();assert.equal(S.dynastyGoals.fairJudge,undefined);
  c.coldLife={visits:3,visited3:true};palaceLifeGoals();assert.equal(S.dynastyGoals.coldReturn.completed,true);`);
});

test('event frequency: only owners can set it, the setting lives in the save, and normal changes nothing',()=>{
 const b=setup();b.run(`assert.equal(eventFrequency('affair'),1);A.setEventFreq('affair','off');assert.equal(S.flags.eventFreq,undefined);
  S.flags.goldFinger=true;A.setEventFreq('affair','off');assert.equal(S.flags.eventFreq.affair,'off');assert.equal(eventFrequency('affair'),0);assert.equal(eventOdds('affair',.5),0);
  A.setEventFreq('scheme','high');assert.equal(eventOdds('scheme',.75),1);assert.equal(eventPriority('scheme'),2.5);A.setEventFreq('nope','high');A.setEventFreq('scheme','wild');assert.equal(S.flags.eventFreq.scheme,'high');
  A.setEventFreq('scheme','normal');assert.equal(S.flags.eventFreq.scheme,undefined);assert.match(eventFreqView(),/妃嫔私情/);assert.match(eventFreqView(),/aria-pressed="true" >不触发/);
  save('auto');A.load('auto');assert.equal(S.flags.eventFreq.affair,'off');A.resetEventFreq();assert.equal(S.flags.eventFreq,undefined);`);
});
test('event frequency: older journals ignore the setting',()=>{
 const b=setup();b.run(`S.flags.eventFreq={scheme:'off'};var real=journalContentVersion;journalContentVersion=()=>170;assert.equal(eventFrequency('scheme'),1);assert.equal(haremEventOdds(),.75);journalContentVersion=real;assert.equal(haremEventOdds(),.75);S.flags.eventFreq.harem='off';assert.equal(haremEventOdds(),.75);S.flags.eventFreq.affair='off';assert.equal(haremEventOdds(),0);`);
});
test('event frequency: scheming off removes every scheme from the harem pool, often puts them first',()=>{
 const b=setup();b.run(`S.flags.goldFinger=true;S.flags.eventFreq={scheme:'off'};for(var i=0;i<30;i++)assert.ok(haremEventOrder().every(f=>!HAREM_SCHEMES.has(f.name)));
  S.flags.eventFreq={scheme:'high'};var order=haremEventOrder();assert.equal(order.length,HAREM.length);var first=order.slice(0,HAREM_SCHEMES.size).map(f=>f.name).sort();assert.deepEqual(first,[...HAREM_SCHEMES].sort());
  S.flags.eventFreq={harem:'off'};assert.ok(haremEventOrder().every(f=>HAREM_SCHEMES.has(f.name)));delete S.flags.eventFreq;assert.equal(haremEventOrder().length,HAREM.length);`);
});
test('event frequency: time travellers and disasters follow their settings',()=>{
 const b=setup();b.run(`S.flags.goldFinger=true;var count=()=>{var n=0;for(var i=1;i<=400;i++){var g={id:9000+i,seed:i*7919+13,alive:true,age:18,story:[],fam:{t:'x',p:1}};if(initTimeTraveler(g))n++;}return n;};
  var usual=count();S.flags.eventFreq={traveler:'off'};assert.equal(count(),0);S.flags.eventFreq={traveler:'high'};assert.ok(count()>usual);
  S.flags.eventFreq={disaster:'off'};for(var i=0;i<40;i++){var ev=courtEvent();assert.ok(!/决堤|蝗|地龙/.test(ev.title),ev.title);}`);
});
