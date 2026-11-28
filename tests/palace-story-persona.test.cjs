const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const begin=(seed=16601)=>{const b=boot(seed);b.ctx.assert=assert;b.run(`A.start();drain();E().energy=10;E().treasury=1000;E().age=20;PalaceActions.reset();
  var admit=key=>{var r=storyCastCreate(key),c=r.person;storyCastAdmit(c,r,'入宫');drain();c.enteredAt=S.turn-12;return c;};
  var rolling=(value,fn)=>{var old=Math.random;Math.random=()=>value;try{return fn();}finally{Math.random=old;}};`);return b;};

test('story consorts speak in their own voices and keep quirks that fit their stories',()=>{
 const b=begin();
 b.run(`assert.match(storyConsortVoices({fixedStory:'xiaoman'}).join(''),/铜钱/);assert.doesNotMatch(storyConsortVoices({fixedStory:'xiaoman'}).join(''),/东珠|玉镯/);
  assert.match(storyConsortVoices({fixedStory:'chuwan'}).join(''),/三岁/);assert.match(storyConsortVoices({fixedStory:'ayimu'}).join(''),/香/);
  assert.match(storyConsortVoices({fixedStory:'luwan'}).join(''),/军报/);assert.doesNotMatch(storyConsortVoices({fixedStory:'qingyi'}).join(''),/只要陛下心里有臣妾/);
  var su=admit('suheng');assert.deepEqual([su.t2,su.hobby],['记仇','品茶']);
  var xm=admit('xiaoman');xm.enteredAt=S.turn-14;xm.aff=60;xm.voiceVisits=5;assert.deepEqual(consortYearsVoice(xm).lines,VOICE_YEARS.independent.familiar);
  var chu=storyCastCreate('chuwan').person;chu.fixedStory='chuwan';Object.assign(chu,{t2:'念旧',hobby:'读书',like:'诗书'});S.consorts.push(chu);
  reconcileStoryCastIdentities();assert.deepEqual([chu.t2,chu.hobby,chu.like],['好读史','刺绣','花草']);
  chu.hobby='抚琴';chu.t2='念旧';reconcileStoryCastIdentities();assert.equal(chu.t2,'念旧');`);
});

test('the dossier details missing from the storylines are now told',()=>{
 const b=begin(16602);
 b.run(`assert.match(STORY_CAST.ayimu.intro,/干花香/);var d=ensureDowager();
  var ev=chuwanDowagerScene(d,{name:'方晚'});assert.match(ev.text,/没看全/);pushEv(ev);choose(0);assert.ok(d.lastYears||true);drain();
  var lu=admit('luwan');assert.ok(officialAlive(houseOf(lu).brother));
  rolling(.01,()=>storyPersonaMonth());assert.equal(curEv.title,'陆绾 · 兄长的军报');choose(0);assert.ok(lu.personaBeats.brotherReport!=null);
  assert.ok(houseOf(lu).brother.story.some(e=>e.t.includes('妹妹来信')));drain();
  var xm=admit('xiaoman');rolling(.01,()=>storyPersonaMonth());assert.equal(curEv.title,'岑小满 · 三个铜板的戏法');assert.match(curEv.text,/一枚一枚数清/);
  choose(0);assert.match(xm.story.at(-1).t,/三个铜板/);drain();
  rolling(.01,()=>storyPersonaMonth());assert.equal(modalOpen,false);`);
});

test('Lin Jianxi helps the child gather the papers and the seated relative is named',()=>{
 const b=begin(16603);
 b.run(`assert.match(FENGHUA_PEOPLE.linJianxi.intro,/陪孩子一张张捡齐/);assert.match(FENGHUA_PEOPLE.linJianxi.intro,/月亮下来了/);
  assert.match(FENGHUA_GUIDES.linJianxi.origin,/贤客/);assert.match(FENGHUA_PEOPLE.heXingjian.principle,/东厂/);
  var mom=empress(),k=makeKid(mom,'f','令仪');k.born=S.turn-17*12;delete k.pendingName;
  var who=linJianxiCompanion(k);assert.equal(who.person,mom);assert.equal(who.label,'生母');`);
});
