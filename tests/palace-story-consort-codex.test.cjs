const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');
test('the study codex has exactly the real fixed cast, portrait, source and game conditions',()=>{
 const b=world();b.ctx.assert=assert;b.run(`assert.equal(STORY_CONSORT_CODEX.length,2);var entry=STORY_CONSORT_CODEX[0],ev=gouyiEncounter();assert.equal(entry.name,fullName(ev.por));assert.equal(entry.portrait,portraitCell(ev.por));var html=viewHome();for(var term of ['剧情妃图鉴','赵令仪','汉书','80万两','12个月','30位','一成','贵人名额','422'])assert.ok(html.includes(term),term);assert.match(html,/尚未相遇/);`);
});
test('reading the codex never consumes game randomness, creates a candidate or changes collection progress',()=>{
 const b=world();b.ctx.assert=assert;b.run(`var before=JSON.stringify(S);Math.random=()=>{throw Error('reading must not roll')};storyConsortCodex();storyConsortCodex();assert.equal(JSON.stringify(S),before);`);
});
test('codex progress follows actual admission, departure and death without creating another character',()=>{
 const b=world();b.ctx.assert=assert;b.run(`A.out('procession');choose(0);assert.match(storyConsortCodex(),/已相遇 · 尚未入宫/);choose(0);var g=S.consorts.find(c=>c.gouyi);assert.match(storyConsortCodex(),/已入宫/);assert.ok(storyConsortCodex().includes("A.go('consort',"+g.id+")"));g.alive=false;assert.match(storyConsortCodex(),/已入宫 · 已故/);assert.equal(STORY_CONSORT_CODEX.length,2);`);
});
for(const kind of ['night','palace','letter'])test('genuine version 16 pending '+kind+' completes under its original rules',()=>{
 const fixture=require('./fixtures/court-living-'+kind+'-legacy-v16.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(fixture)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(journalContentVersion(),16);assert.equal(storyConsortCodex(),'');${kind==='palace'?"assert.equal(curEv.scene,'palace-arrival');":''}drain();assert.equal(PalaceActions.blocked,false);assert.ok(journalContentVersion()>=17);`);
});

test('all eight catalogue cards share one gold identity badge with the harem, while progress stays plain',()=>{
 const b=world();b.ctx.assert=assert;b.run(String.raw`
  const cards=[...storyConsortCodex().matchAll(/<article class="story-consort-card" data-story-consort="([^"]+)">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length,8);
  for(const [,key,html] of cards){
   const c=key==='gouyi'?{gouyi:{}}:key==='hongjian'?{hongjian:{}}:{fixedStory:key};
   const badge=storyConsortBadge(key);assert.equal(solitaryTag(c),badge);
   assert.equal(html.split(badge).length,2);assert.equal(html.split('<span class="tag y">').length,2);
   assert.ok(html.includes('<small class="hint">经历 · '));
  }`);
});
