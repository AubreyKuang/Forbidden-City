// Consort page: 赐/改封号 and 降位 · 打入冷宫 · 遣出宫 sit beside 探亲与省亲; there is no 处置 chapter.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

test('title and penalty buttons sit beside the family visits, with no 处置 chapter',()=>{
  const b=boot(521);b.run(`A.start();drain();for(const id of S.cands.slice(0,2).map(c=>c.id)){A.xxTake(id);drain();}A.xxEnd();drain();`);
  const page=b.run(`(()=>{const g=makeGirl({sur:'试',given:'嫔',age:18,trait:'沉静',fam:{t:'良家子',p:5}});addConsort(g,4,'测试');g.title='';
    A.go('consort',g.id);const plain=$('#panel').innerHTML;grantConsortTitle(g,'淑');A.go('consort',g.id);const titled=$('#panel').innerHTML;return {plain,titled};})()`);
  const row=html=>(html.match(/<div class="consort-action-row">[^]*?<\/div><\/div><\/div>/)||[''])[0];
  assert.match(row(page.plain),/探亲与省亲[^]*封号与处置[^]*赐封号[^]*降位[^]*打入冷宫[^]*遣出宫/);
  assert.match(row(page.titled),/改封号/);
  assert.doesNotMatch(page.plain,/'decisions'|data-chapter="decisions"|>处置</);
});
