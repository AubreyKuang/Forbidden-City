const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
test('a historical event and its decision enter the codex and survive reload',()=>{
 let b=boot(77001);b.ctx.assert=assert;
 b.run(`A.start();drain();empress().virtue=85;pushEv(HIST[0]());assert.equal(curEv.title,'辞辇');choose(0);drain();
  assert.equal(S.historicalCodex.length,1);assert.match(dynastyCodexPanel(),/班婕妤辞辇/);assert.match(dynastyCodexPanel(),/皇帝本纪/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(dynastyCodexPanel(),/班婕妤辞辇/);
  assert.match(viewLog(),/查看王朝图鉴/);`);
});
test('older explicit character event records are reconstructed without inventing or duplicating events',()=>{
 const b=boot(77001);b.ctx.assert=assert;
 b.run(`A.start();drain();var p=empress(),other=harem()[1];var old={d:'旧朝一年',t:'往事',event:{title:'辞辇',choice:'赞她贤德',outcome:'称赞'}};
  p.story.push(old);other.story.push(JSON.parse(JSON.stringify(old)));p.story.push({d:'旧朝一年',t:'没有事件凭据',event:{title:'虚构典故',choice:'知道了'}});
  var list=recordedHistoricalCodex();assert.equal(list.filter(x=>x.title==='辞辇').length,1);assert.equal(list[0].reconstructed,true);
  assert.ok(!list.some(x=>x.title==='虚构典故'));assert.match(dynastyCodexPanel(),/据人物纪事整理/);`);
});
