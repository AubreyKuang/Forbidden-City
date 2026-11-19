const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cases,renderCase,signature}=require('./ui-layout-cases.cjs');
const baseline=require('./fixtures/ui-before-organization.json');
const {boot}=require('./playtest-harness.cjs');
const childTextChanges=new Map([['宫内','宫中'],['已出宫','宫外'],['尚无皇子公主出宫。','宫外暂无皇嗣。']]);

for(const c of cases)test(`layout preserves information and action availability: ${c[0]}`,()=>{
 const before=baseline.pages.find(p=>p.name===c[0]);
 const {html}=renderCase(c),after=signature(html);
 const remaining=after.controls.map(x=>JSON.stringify(x));
 for(const original of before.controls){
  const control={...original};
  // The chronicle now submits one native form from either Enter or the search button.
  if(control.id?.startsWith('chronicle-search-'))delete control.onkeydown;
  if(control.onclick?.startsWith('A.chronicleSearch(')){
   const form=html.match(/<form\b[^>]*class="chronicle-search"[^>]*>[\s\S]*?<\/form>/)?.[0]||'';
   assert.ok(form.includes(`onsubmit="event.preventDefault();${control.onclick}"`));
   assert.ok(form.includes('<button type="submit"'));
   continue;
  }
  const key=JSON.stringify(control),i=remaining.indexOf(key);
  assert.notEqual(i,-1,`Lost or changed control: ${key}`);
  remaining.splice(i,1);
 }
 // Match longest fragments first so a short name cannot consume a longer phrase.
 let text=after.text.join(' ').replace(/ · 家族立场：/g,' · ').replace(/ · (?:原任)?[正从][一二三四五六七八九]品/g,'').replace(/ · (?:尚未授官|无官品|未定品)/g,'').replace('妃嫔娘家、地方铨选或科举','妃嫔娘家或科举').replace('妃嫔娘家、地方铨选、科举或军功','妃嫔娘家或科举');
 // The family list intentionally replaces flat kin labels with a paternal hierarchy.
 // Its original person controls remain checked above; parent/child identity and both
 // family views have dedicated end-to-end assertions in palace-layered-family.
 const expected=c[0]==='family-list'?[]:[...before.text];
 const fragments=['children','children-out'].includes(c[0])?expected.map(text=>childTextChanges.get(text)??text):expected;
 for(const legacyFragment of fragments.sort((a,b)=>b.length-a.length)){
  const fragment=legacyFragment.replace('筛选不会删去原始记载。','');
  // The guide now describes the three-reply quota; its other instructions remain.
  const updated=c[0]==='home'?fragment.replace('上朝可先免费查看本月奏折，亲自批复通常花 1 点','每月最多批阅三份奏折，可先免费查看；亲自批复通常花 1 点'):fragment;
  assert.ok(text.includes(updated),`Missing text: ${updated}`);
  text=text.replace(updated,'');
 }
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'Duplicate DOM IDs');
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),`Broken section link: ${id}`);
});

test('section jumps focus only the current page and do not change the world or save',()=>{
 const b=boot(6701);b.run('A.start();drain()');
 const before=b.run('JSON.stringify(S)'),stored=[...b.storage];
 let focused=0,scrolled=0;
 const heading={focus:options=>{assert.deepEqual({...options},{preventScroll:true});focused++;},scrollIntoView:options=>{assert.equal(options.block,'start');scrolled++;}};
 b.ctx.document.getElementById=id=>id==='consort-history'?heading:null;
 const panel=b.ctx.document.querySelector('#panel');panel.contains=node=>node===heading;
 b.run("jumpToPageSection('consort-history');jumpToPageSection('missing')");
 assert.equal(focused,1);assert.equal(scrolled,1);
 panel.contains=()=>false;b.run("jumpToPageSection('consort-history')");
 assert.equal(focused,1);assert.equal(scrolled,1);
 assert.equal(b.run('JSON.stringify(S)'),before);assert.deepEqual([...b.storage],stored);
});

test('consort page puts newest chronicle first and groups the three management actions',()=>{
 const {html}=renderCase(['timeline','viewConsort()',`UI.sel=c.id;for(let i=0;i<8;i++){S.turn++;story(c,'时间测试'+i)}`]);
 const row=html.match(/<div class="consort-quick-management"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
 assert.match(row,/安排居所[\s\S]*晋封[\s\S]*撤下绿头牌/);
 assert.ok(html.indexOf('consort-detail-head')<html.indexOf('consort-detail-actions'));
 assert.ok(html.indexOf('consort-detail-actions')<html.indexOf('id="consort-history"'));
 assert.ok(html.indexOf('consort-quick-management')<html.indexOf('id="consort-history"'));
 assert.ok(html.indexOf('id="consort-history"')<html.indexOf('id="consort-now"'));
 const timeline=html.slice(html.indexOf('id="consort-history"'),html.indexOf('id="consort-now"'));
 assert.match(timeline,/按时间倒序，最近记载在前/);
 assert.ok(timeline.indexOf('时间测试7')<timeline.indexOf('时间测试6'));
 assert.ok(timeline.indexOf('时间测试2')<timeline.indexOf('翻阅更早的纪事'));
 assert.ok(timeline.indexOf('翻阅更早的纪事')<timeline.indexOf('时间测试1'));
 assert.match(timeline,/<details class="chronicle-filter-fold"/);
});
