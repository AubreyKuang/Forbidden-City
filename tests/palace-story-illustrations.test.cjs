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
    game.run('S.flags.marketRescueSeen=true');
    game.force(.1,roll);
    game.run("A.out('city')");
    assert.equal(game.run('curEv.title'),'微服 · '+title);
    assert.equal(game.run("$('#mbox').innerHTML.includes('story-school-window.webp')"),illustrated);
    game.run('choose(0)');
    assert.match(game.run('curEv.title'),/^民情交办/);
    assert.doesNotMatch(game.run("$('#mbox').innerHTML"),/event-illustration/);
  }
});
