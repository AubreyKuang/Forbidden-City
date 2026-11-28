const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`Q.length=0;modalOpen=false;curEv=null;E().treasury=500;E().energy=5;
  var kid=k,cold=makeGirl({sur:'柳',given:'如烟',age:22,trait:'温婉',fam:{t:'商户',p:30}});addConsort(cold,3,'入宫');cold.cold=true;
  for(var x of [c,other,cold]){ensureConsortHealth(x);x.hp=70;x.healthProfile.usual=70;}kid.hp=50;`);return b;}

test('the blessing costs 100 and gives every consort and child in the palace 3 health',()=>{
 const b=setup();b.run(`assert.match(viewDaoHall(),/为众人祈福<small>国库−100 · 精力−1/);A.daoRite();assert.match(curEv.text,/健康各\\+3[\\s\\S]*国库须有100万两/);
  var out=curEv.choices[0].f();assert.equal(E().treasury,400);assert.equal(c.hp,73);assert.equal(c.healthProfile.usual,73);assert.equal(other.hp,73);assert.equal(kid.hp,53);
  assert.equal(cold.hp,70);assert.match(out,/民心\\+1。\\n§宫中妃嫔2人、皇嗣1人 健康\\+3/);
  assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);assert.equal(E().treasury,400);`);
 const poor=setup();poor.run(`E().treasury=99;A.daoRite();assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);assert.equal(c.hp,70);`);
 const full=setup();full.run(`c.hp=99;c.healthProfile.usual=99;kid.hp=99;A.daoRite();curEv.choices[0].f();assert.equal(c.hp,100);assert.equal(c.healthProfile.usual,100);assert.equal(kid.hp,100);`);
});

test('a scene left by an older version keeps the 20-tael rite with no health change and no lifespan question',()=>{
 const b=setup();b.run(`PalaceActions.reset();var real=journalContentVersion;journalContentVersion=()=>172;
  assert.match(viewDaoHall(),/国库−20 · 精力−1/);assert.doesNotMatch(viewDaoHall(),/问寿/);A.daoRite();assert.match(curEv.text,/国库须有20万两/);assert.doesNotMatch(curEv.text,/健康/);
  assert.equal(curEv.choices[0].f(),'殿中灯火温明，施济名册也已交付。民心+1。');assert.equal(E().treasury,480);assert.equal(c.hp,70);assert.equal(kid.hp,50);
  Q.length=0;modalOpen=false;curEv=null;A.daoLifespan();assert.equal(curEv,null);journalContentVersion=real;`);
});

test('the master reckons the emperor\'s years from his health, age and temperament',()=>{
 const b=setup();b.run(`E().health=17;E().age=30;E().style='勤政';S.month=1;assert.equal(daoEmperorMonthsLeft(),100);
  E().style='风流';assert.equal(daoEmperorMonthsLeft(),78);E().style='勤政';E().age=60;E().health=5;assert.ok(daoEmperorMonthsLeft()<12);
  assert.equal(daoYearsLeft(100),'约还有八年');assert.equal(daoYearsLeft(11),'已不足一年');assert.equal(daoYearsLeft(5000),'约还有九十九年');
  var calls=0,random=PalaceActions.random;PalaceActions.random=()=>{calls++;return random();};daoEmperorMonthsLeft();assert.equal(calls,0);PalaceActions.random=random;`);
});

test('asking costs 200 a person: the rite is shown first, then the reading with the mist illustration',()=>{
 const b=setup();b.run(`E().health=17;E().age=30;E().style='勤政';S.month=1;var d=ensureDowager();d.alive=true;dowagerLifePlan(d).deathTurn=S.turn+30;
  assert.match(viewDaoHall(),/向国师问寿<small>自己与太后还有多少年 · 每问一人国库−200/);A.daoLifespan();assert.equal(curEv.title,'钦安问寿');
  assert.match(curEv.text,/百年龟甲一片、蓍草五十茎[\\s\\S]*每问一人，耗银200万两/);
  assert.equal(curEv.choices[0].t,'问朕自己的寿数（国库-200万两）');assert.match(curEv.choices[1].t,/的寿数（国库-200万两）$/);assert.equal(curEv.choices.at(-1).t,'不问了');
  choose(0);assert.equal(E().treasury,300);assert.match($('#mbox').innerHTML,/灼之[\\s\\S]*十八变而成一卦[\\s\\S]*国库-200万两/);assert.doesNotMatch($('#mbox').innerHTML,/story-dao-lifespan-mist/);
  nextEv();assert.equal(curEv.title,'卦成');assert.match(curEv.text,/陛下的寿数，若一如今日，约还有八年。/);assert.match(curEv.text,/陛下自己改得动/);
  assert.match($('#mbox').innerHTML,/story-dao-lifespan-mist\\.webp[\\s\\S]*云海漫过石阶/);choose(0);
  A.daoLifespan();choose(1);assert.equal(E().treasury,100);nextEv();assert.match(curEv.text,/的寿数，若调养如常，约还有二年。/);assert.doesNotMatch(curEv.text,/多去慈宁宫/);choose(0);
  A.daoLifespan();assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);assert.equal(E().treasury,100);choose(curEv.choices.length-1);
  E().treasury=200;d.lastYears.deathTurn=S.turn+5;A.daoLifespan();choose(1);nextEv();assert.match(curEv.text,/已不足一年。[\\s\\S]*多去慈宁宫坐坐/);`);
 assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname,'../assets/images/story-dao-lifespan-mist.webp')));
 const alone=setup();alone.run(`for(var d of dowagerCourtMembers())d.alive=false;assert.match(viewDaoHall(),/向国师问寿<small>自己还有多少年/);A.daoLifespan();assert.deepEqual(curEv.choices.map(x=>x.t),['问朕自己的寿数（国库-200万两）','不问了']);`);
});
