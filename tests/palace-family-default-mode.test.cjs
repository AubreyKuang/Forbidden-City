const test=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
test('family view starts with the relationship graph in every reign and can switch to the list',()=>{
 const b=boot();b.ctx.assert=assert;b.run(`A.start();drain();for(const gen of [1,2]){S.gen=gen;delete UI.familyMode;var html=viewFamily();
 assert.ok(html.indexOf('关系图')<html.indexOf('家族列表'));assert.ok(html.includes('aria-pressed="true"'));assert.match(html,/class="graph-wrap"/);
 UI.familyMode='list';html=viewFamily();assert.ok(html.includes('aria-pressed="true"'));assert.doesNotMatch(html,/class="graph-wrap"/);
 UI.familyMode='graph';assert.match(viewFamily(),/class="graph-wrap"/);}`);
});
