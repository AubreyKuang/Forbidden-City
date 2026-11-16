const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function start(){
  const game=boot();
  game.run('A.start();drain();S.month=1;');
  return game;
}

test('a spring garden illustration survives reopening an unfinished encounter',()=>{
  const game=start();
  game.force(.1,0,.1);
  game.run("A.out('garden')");
  assert.equal(game.run('curEv.title'),'御花园偶遇');
  assert.match(game.run("$('#mbox').innerHTML"),/story-spring-garden\.webp.*<figcaption>几瓣海棠/);

  const resumed=boot(42,game.storage);
  resumed.run("A.load('auto')");
  assert.match(resumed.run("$('#mbox').innerHTML"),/story-spring-garden\.webp/);
  resumed.run("choose(1);pushEv({title:'后续',text:'新消息',choices:[ok1]})");
  assert.doesNotMatch(resumed.run("$('#mbox').innerHTML"),/event-illustration/);
});

test('the spring illustration follows the weather and season',()=>{
  for(const [month,encounterRoll] of [[1,.99],[7,.1]]){
    const game=start();
    game.force(.1,0,encounterRoll);
    game.run(`S.month=${month};A.out('garden')`);
    assert.equal(game.run('curEv.title'),'御花园偶遇');
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
  }
});

test('the city lanterns appear only after taking her out of the palace',()=>{
  for(const choice of [0,1,2]){
    const game=start();
    game.run(`const c=empress();c.aff=50;c.arc={id:'kite',st:1,t:S.turn,f:{}};
      const ev=ARCS.kite.stages[1](c,c.arc.f);
      pushEv({...ev,title:ARCS.kite.name,por:c});`);
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
    game.run(`choose(${choice})`);
    const result=game.run("$('#mbox').innerHTML");
    if(choice===0){
      assert.match(result,/story-lantern-street\.webp/);
      assert.match(result,/这一回，换臣妾牵着您/);
      assert.equal(game.run('c.arc.f.out'),1);
      assert.equal(game.run('c.aff'),65);
    }else{
      assert.doesNotMatch(result,/event-illustration/);
      assert.equal(game.run('c.arc.f.out'),undefined);
    }
    assert.equal(game.run('c.arc.st'),2);
  }
});

test('the eastern sea illustration appears on arrival and survives an autosave reload',()=>{
  const game=start();
  const id=game.run(`S.turn=240;const child=makeKid(empress(),'f','昭宁');child.born=S.turn-168;
    child.daoPractice={path:'dao',visits:3,seaWish:{status:'promised'}};child.id`);
  game.run(`A.daoSea(${id})`);
  assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
  game.run('choose(0)');
  assert.equal(game.run('curEv.title'),'烟涛微茫');
  assert.match(game.run("$('#mbox').innerHTML"),/story-east-sea\.webp/);

  const resumed=boot(42,game.storage);
  resumed.run("A.load('auto')");
  assert.match(resumed.run("$('#mbox').innerHTML"),/story-east-sea\.webp/);
  resumed.run('choose(0);drain()');
  assert.equal(resumed.run(`kidById(${id}).daoPractice.seaWish.status`),'fulfilled');
});

test('a city visit shows the old school only for the school encounter',()=>{
  for(const [roll,title,illustrated] of [[.16,'私塾门前的旧书',true],[.33,'药铺的半张方子',false]]){
    const game=start();
    game.run('S.flags.marketRescueSeen=true;S.flags.xieCityAttempt=S.turn;fenghuaState().lastCity=S.turn');
    game.force(.1,roll);
    game.run("A.out('city')");
    assert.equal(game.run('curEv.title'),'微服 · '+title);
    assert.equal(game.run("$('#mbox').innerHTML.includes('story-school-window.webp')"),illustrated);
    game.run('choose(0)');
    assert.match(game.run('curEv.title'),/^民情交办/);
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
  }
});

test('the broken bridge appears at the ferry before choosing a case officer',()=>{
  const game=start();
  game.run('S.flags.marketRescueSeen=true;S.flags.xieCityAttempt=S.turn;fenghuaState().lastCity=S.turn');
  game.force(.1,.01);
  game.run("A.out('city')");
  assert.equal(game.run('curEv.title'),'微服 · 断桥旁的渡钱');
  assert.match(game.run("$('#mbox').innerHTML"),/story-liuxi-broken-bridge\.webp/);
  game.run('choose(0)');
  assert.equal(game.run('curEv.title'),'民情交办 · 柳溪渡口');
  assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
});

test('West Lake appears only in the result of accompanying her south',()=>{
  for(const choice of [0,1]){
    const game=start();
    game.run(`const c=empress();c.trait='体弱';c.aff=50;c.arc={id:'ill',st:1,t:S.turn,f:{tell:1}};
      E().treasury=500;E().health=80;pushEv(arcTick());`);
    assert.equal(game.run('curEv.title'),'续命汤');
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
    game.run(`choose(${choice})`);
    assert.equal(game.run('c.arc.st'),2);
    if(choice===0){
      assert.match(game.run("$('#mbox').innerHTML"),/烟雨西湖.*story-west-lake-rain\.webp/);
      assert.equal(game.run('c.arc.f.trip'),1);
      assert.equal(game.run('E().treasury'),350);
      assert.equal(game.run('E().health'),77);
    }else{
      assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
      assert.equal(game.run('c.arc.f.trip'),undefined);
    }
  }
});

test('the umbrella belongs to the first chapter, including after reloading it',()=>{
  const game=start();
  game.run(`S.turn=300;const c=empress();c.trait='温婉';c.age=28;c.aff=60;c.hp=90;c.enteredAt=100;
    A.journeyBegin(c.id,'rainUmbrella');save('1');`);
  assert.equal(game.run('curEv.title'),'雨廊一伞 · 伞下半步');
  assert.match(game.run("$('#mbox').innerHTML"),/story-rain-corridor-umbrella\.webp/);

  const resumed=boot(42,game.storage);
  resumed.run("A.load('1')");
  assert.match(resumed.run("$('#mbox').innerHTML"),/story-rain-corridor-umbrella\.webp/);
  resumed.run(`choose(0);nextEv();const c=empress();S.turn=c.journeys.current.due;A.journeyTalk(c.id);`);
  assert.equal(resumed.run('curEv.title'),'雨廊一伞 · 还伞的人');
  assert.doesNotMatch(resumed.run("$('#mbox').innerHTML"),/event-illustration/);
});

test('the fish basin follows the feeding dialogue and restores from the same saved encounter',()=>{
  const game=start();
  game.force(.1,0,.6);
  game.run("A.out('garden')");
  assert.match(game.run('curEv.text'),/喂鱼/);
  assert.match(game.run("$('#mbox').innerHTML"),/story-garden-fish\.webp/);

  const resumed=boot(42,game.storage);
  resumed.run("A.load('auto')");
  assert.match(resumed.run("$('#mbox').innerHTML"),/story-garden-fish\.webp/);
  assert.equal(resumed.run('PalaceActions.blocked'),false);
});

test('the lotus illustration follows the result where she hears the rain',()=>{
  for(const [roll,illustrated] of [[0,true],[.99,false]]){
    const game=start();
    game.run(`const person=empress();person.trait='沉静';
      const episode=PERSONAL_EPISODES.find(e=>e.title==='残荷听雨');
      offerPersonalExperience(person,episode);
      A.personalExperience(person.id);choose(0);nextEv();
      S.turn=person.personalExperiences.current.due;A.personalExperience(person.id);`);
    assert.equal(game.run('curEv.title'),'残荷听雨 · 后话');
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
    game.force(roll);
    game.run('choose(0)');
    assert.equal(game.run("$('#mbox').innerHTML.includes('story-rain-lotus.webp')"),illustrated);
  }
});

test('the overturned cup belongs to the banquet, not the other scholar stages',()=>{
  const game=start();
  game.run(`const c=empress();c.trait='才女';c.aff=70;
    c.arc={id:'scholar',st:1,t:S.turn,f:{}};pushEv(arcTick());`);
  assert.match(game.run('curEv.text'),/翻了酒盏/);
  assert.match(game.run("$('#mbox').innerHTML"),/story-qionglin-spilled-cup\.webp/);
  game.run('choose(1);nextEv()');
  assert.equal(game.run('c.arc.st'),2);
  game.run("pushEv({...ARCS.scholar.stages[2](c,c.arc.f),title:'故人诗',por:c})");
  assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
});

test('the tilted wooden boat is shown on the first attempt only',()=>{
  const game=start();
  game.run(`S.turn=120;E().energy=4;const k=makeKid(empress(),'f','昭宁');
    Object.assign(k,{born:S.turn-8*12,lit:70,hp:90,pendingName:false,temperament:'好奇'});
    offerHistory(k,LIVING_STORIES.find(rule=>rule.id==='boat-weight'));A.historyScene(k.id,true);`);
  assert.equal(game.run('curEv.title'),'木舟上的刻线');
  assert.match(game.run("$('#mbox').innerHTML"),/story-child-wooden-boat\.webp/);
  game.run('choose(0);nextEv();S.turn=k.livingHistory.current.due;A.historyScene(k.id,true)');
  assert.equal(game.run('curEv.title'),'木舟上的刻线 · 后来');
  assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
});

test('the Huashan steps appear only when a Huashan apprentice departs',()=>{
  for(const [route,choice,illustrated] of [['sword',0,true],['sword',1,false],['cloud',0,false]]){
    const game=start();
    game.run(`S.turn=300;E().treasury=500;const k=makeKid(empress(),'f','昭宁');
      Object.assign(k,{born:S.turn-18*12,hp:90,pendingName:false,lit:70,mar:30,
        temperament:'内敛',immortalTalent:'水灵根',daoPractice:{path:'dao',visits:6}});
      immortalDiscover(k);k.immortal.route='${route}';A.immortalTalk(k.id);`);
    assert.equal(game.run('curEv.title'),'仙师来访 · 山门之约');
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
    game.run(`choose(${choice})`);
    assert.equal(game.run("$('#mbox').innerHTML.includes('story-huashan-stone-steps.webp')"),illustrated);
    assert.equal(game.run('k.immortal.stage'),choice===0?'learning':'invited');
    assert.equal(game.run('E().treasury'),choice===0?470:500);
  }
});

test('accepting a Huashan appeal shows the same departure image once',()=>{
  const game=start();
  game.run(`S.turn=300;E().treasury=500;const k=makeKid(empress(),'m','承安');
    Object.assign(k,{born:S.turn-18*12,hp:90,pendingName:false,lit:70,mar:85,
      temperament:'好胜',immortalTalent:'金灵根',daoPractice:{path:'dao',visits:6}});
    immortalDiscover(k);k.immortal.stage='closed';immortalTravelRefused(k);
    S.turn=k.immortal.travelAppeal.due;A.immortalTalk(k.id);`);
  assert.equal(game.run('curEv.title'),'皇子远行 · 再请圣裁');
  game.run('choose(0);choose(0)');
  assert.match(game.run("$('#mbox').innerHTML"),/辞阙入山 · 华山.*story-huashan-stone-steps\.webp/);
  assert.equal(game.run('k.immortal.stage'),'learning');
  assert.equal(game.run('E().treasury'),470);
});

test('the adult follow-up shows the Huashan steps when the old promise leads to departure',()=>{
  const game=start();
  game.run(`S.turn=300;E().treasury=500;const k=makeKid(empress(),'f','昭宁');
    Object.assign(k,{born:S.turn-15*12,hp:90,pendingName:false,lit:70,mar:85,
      temperament:'好胜',immortalTalent:'金灵根',daoPractice:{path:'dao',visits:6}});
    immortalDiscover(k);A.immortalTalk(k.id);choose(1);nextEv();
    S.turn+=12;A.immortalTalk(k.id);`);
  assert.equal(game.run('curEv.title'),'山门再约 · 成年问志');
  assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
  game.run('choose(0)');
  assert.match(game.run("$('#mbox').innerHTML"),/story-huashan-stone-steps\.webp/);
  assert.equal(game.run('k.immortal.stage'),'learning');
  assert.equal(game.run('E().treasury'),470);
});
