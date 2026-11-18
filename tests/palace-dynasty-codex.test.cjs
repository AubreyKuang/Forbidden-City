const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
test('a historical event and its decision enter the codex and survive reload',()=>{
 let b=boot(77001);b.ctx.assert=assert;
 b.run(`A.start();drain();empress().virtue=85;pushEv(HIST[0]());assert.equal(curEv.title,'辞辇');choose(0);drain();
  assert.equal(S.historicalCodex.length,1);assert.match(dynastyCodexPanel(),/班婕妤辞辇/);assert.match(dynastyCodexPanel(),/皇帝本纪/);save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(dynastyCodexPanel(),/班婕妤辞辇/);
  assert.match(viewLog(),/查看王朝图鉴/);`);
});
