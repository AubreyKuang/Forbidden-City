const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

test('an assassination forces a replayable alert before the untouched scene',()=>{
  let game=world();game.ctx.assert=assert;
  game.run(`S.jinyiwei={commander:{id:'rare-commander',name:'程秉直',alive:true,career:'official',official:3,story:[]}};
    S.flags.marketRescueSeen=true;S.flags.xieCityAttempt=S.turn;fenghuaState().lastCity=S.turn;`);
  game.force(.95,.7);
  game.run(`A.out('city');assert.equal(curEv.title,'锦衣卫急报 · 遇刺');assert.equal(Q[0].title,'遇刺');
    assert.match($('#mbox').innerHTML,/刺客的来路仍待查问/);assert.equal(jinyiwei().rareNotices.length,1);
    assert.equal(palaceCases().length,0);save('auto');`);
  game=boot(89,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'锦衣卫急报 · 遇刺');assert.equal(jinyiwei().rareNotices.length,1);assert.match(casesSection(),/稀有事件速报/);
    choose(0);assert.equal(curEv.title,'遇刺');assert.equal(jinyiwei().rareNotices.length,1);assert.equal(palaceCases().length,0);
    assert.equal(S.log.filter(x=>x.t.includes('锦衣卫提示 · 遇刺')).length,1);`);
});

test('an unshown scene or a scene unrelated to the guards does not create a notice',()=>{
  const game=world();game.ctx.assert=assert;game.run(`S.jinyiwei={commander:{id:'rare-commander',name:'指挥使',alive:true,career:'official',official:3,story:[]}};
    pushEv({title:'茶馆闲谈',text:'茶才倒好。',choices:[{t:'饮茶'}]});
    pushEv({title:'回廊相依',valid:()=>false,text:'失效的旧事。',choices:[{t:'知道了'}]});
    drain();assert.equal(jinyiwei().rareNotices,undefined);`);
});

test('ordinary rare scenes get an inline notice and a vacant guard never interrupts',()=>{
  const game=world();game.ctx.assert=assert;game.run(`setupJyw();
    pushEv({title:'仙师来访 · 山门之约',text:'有来客。',choices:[{t:'知道了'}]});
    assert.equal(curEv.title,'仙师来访 · 山门之约');assert.match($('#mbox').innerHTML,/锦衣卫指挥使程秉直附报/);
    drain();jinyiwei().commander.alive=false;
    pushEv({title:'东宫惊魂',text:'东宫传讯。',choices:[{t:'知道了'}]});
    assert.equal(curEv.title,'东宫惊魂');assert.equal(jinyiwei().rareNotices.length,1);`);
});

test('repeated succession conflicts go to the archive during a six month cooldown',()=>{
  const game=world();game.ctx.assert=assert;game.run(`setupJyw();
    var faction=()=>pushEv({title:'储位之争',por:a,text:'群臣起争执。',choices:[{t:'知道了'}]});
    faction();assert.equal(curEv.title,'锦衣卫急报 · 储位之争');drain();S.turn++;
    faction();assert.equal(curEv.title,'储位之争');assert.equal(jinyiwei().rareNotices.at(-1).urgent,false);drain();
    S.turn+=5;faction();assert.equal(curEv.title,'锦衣卫急报 · 储位之争');`);
});

test('a real action raises only the first severe feud popup of the month and replays it exactly once',()=>{
  let game=world();game.ctx.assert=assert;game.run(`setupJyw();q.trait='善妒';
    S.rel[rk(q,a)]=-27;S.rel[rk(q,b)]=-38;
    A.night(a.id);drain();assert.equal(jinyiwei().rareNotices,undefined);
    A.night(b.id);assert.equal(curEv.title,'春宵');choose(1);
    assert.equal(curEv.title,'锦衣卫 · 新怨密报');assert.match(curEv.text,/许清容/);
    assert.equal(jinyiwei().rareNotices.length,1);save('auto');`);
  game=boot(89,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'锦衣卫 · 新怨密报');assert.equal(jinyiwei().rareNotices.length,1);drain();
    var q=S.consorts.find(c=>c.given==='明华'),a=S.consorts.find(c=>c.given==='知微');
    S.rel[rk(q,a)]=-38;delete a.preg;A.night(a.id);choose(1);
    assert.equal(modalOpen,false);assert.equal(jinyiwei().rareNotices.length,2);
    assert.equal(jinyiwei().rareNotices.at(-1).urgent,false);assert.match(casesSection(),/沈知微/);
    assert.equal(palaceCases().length,0);`);
});
