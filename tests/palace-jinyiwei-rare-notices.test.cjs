const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

test('opening a supported event adds a specific, replayable notice and does not create a case',()=>{
  let game=world();game.ctx.assert=assert;
  game.run(`S.jinyiwei={commander:{id:'rare-commander',name:'程秉直',alive:true,career:'official',official:3,story:[]}};
    S.flags.marketRescueSeen=true;S.flags.xieCityAttempt=S.turn;fenghuaState().lastCity=S.turn;`);
  game.force(.95,.7);
  game.run(`A.out('city');assert.equal(curEv.title,'遇刺');assert.match($('#mbox').innerHTML,/锦衣卫指挥使程秉直附报/);
    assert.match($('#mbox').innerHTML,/刺客的来路仍待查问/);assert.equal(jinyiwei().rareNotices.length,1);
    assert.equal(palaceCases().length,0);save('auto');`);
  game=boot(89,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'遇刺');assert.equal(jinyiwei().rareNotices.length,1);assert.match(casesSection(),/稀有事件速报/);
    assert.equal(S.log.filter(x=>x.t.includes('锦衣卫提示 · 遇刺')).length,1);`);
});

test('an unshown scene or a scene unrelated to the guards does not create a notice',()=>{
  const game=world();game.ctx.assert=assert;game.run(`S.jinyiwei={commander:{id:'rare-commander',name:'指挥使',alive:true,career:'official',official:3,story:[]}};
    pushEv({title:'茶馆闲谈',text:'茶才倒好。',choices:[{t:'饮茶'}]});
    pushEv({title:'回廊相依',valid:()=>false,text:'失效的旧事。',choices:[{t:'知道了'}]});
    drain();assert.equal(jinyiwei().rareNotices,undefined);`);
});
