const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cases,renderCase,signature}=require('./ui-layout-cases.cjs');
const baseline=require('./fixtures/ui-before-organization.json');
const {boot}=require('./playtest-harness.cjs');
const childTextChanges=new Map([['宫内','宫中'],['已出宫','宫外'],['尚无皇子公主出宫。','宫外暂无皇嗣。']]);

for(const c of cases)test(`layout preserves information and action availability: ${c[0]}`,()=>{
 const before=baseline.pages.find(p=>p.name===c[0]);
 const {html}=renderCase(c),after=signature(html);
 const remaining=after.controls.map(x=>{
  const control={...x};
  // The title button's assignment moved into a named function so it runs without inline script.
  if(control.onclick==='returnToTitle()')control.onclick="S=null;UI.view='title';render()";
  if(control.onclick?.startsWith('A.familyMode(')||control.onclick?.startsWith('UI.logF='))delete control['aria-pressed'];
  return JSON.stringify(control);
 });
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
 if(c[0]==='home'){
  // These three indicators are already readable in the HUD. The study displays
  // the family register and uses the destination names as its shortcut labels.
  fragments.splice(2,12,'永宁朝 · 第一代','勤政之君','文才 50 武略 50','储君 未立','皇嗣 2 位','太后','纪太后','后宫 2 人');
  for(const text of ['岁入 · 官员调度 · 民情回访','查看珍饰 · 选人赏赐'])fragments.splice(fragments.indexOf(text),1);
  const {html:hud}=renderCase(['hud',"(renderTop(),$('#top').innerHTML)"]);
  for(const label of ['龙体','威望','民心'])assert.ok(hud.includes(label));
 }
 for(const legacyFragment of fragments.sort((a,b)=>b.length-a.length)){
  const fragment=legacyFragment.replace('筛选不会删去原始记载。','')
    .replace('楚庶人',c[0]==='cold'?'楚妃':'楚庶人');
  // The guide now describes the three-reply quota; its other instructions remain.
  const updated=c[0]==='home'?fragment.replace('上朝可先免费查看本月奏折，亲自批复通常花 1 点','每月最多批阅三份奏折，可先免费查看；亲自批复通常花 1 点'):fragment;
  assert.ok(text.includes(updated),`Missing text: ${updated}`);
  text=text.replace(updated,'');
 }
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'Duplicate DOM IDs');
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),`Broken section link: ${id}`);
});

test('the cold-palace profile distinguishes confinement from formal demotion to commoner',()=>{
 const {html}=renderCase(['commoner','viewConsort()','c.cold=true;c.coldCommoner=true;c.palace="冷宫";UI.sel=c.id']);
 const text=signature(html).text;
 assert.ok(text.includes('楚庶人'));
 assert.ok(text.includes('楚怜 · 18岁 · 冷宫'));
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

test('the study and activity log open on the new reign while older entries with a reused era stay selectable',()=>{
 const b=boot(6701);b.ctx.assert=assert;
 b.run(`A.start();drain();S.gen=3;E().era='永宁';
  S.history=[{era:'永宁',sur:'萧',name:'彻'},{era:'景祐',sur:'萧',name:'承安'}];
  S.log=[{d:'永宁二年一月',t:'第一朝记录',b:1},
    {d:'景祐元年一月',t:'━━ 第二代 ━━ 景祐元年',b:1},{d:'景祐元年二月',t:'第二朝记录',b:1},
    {d:'永宁元年一月',t:'━━ 第三代 ━━ 永宁元年',b:1},{d:'永宁元年二月',t:'本朝记录',b:0}];
  UI.homeBook='archive';UI.homeBookGen=2;UI.logReign=2;UI.logReignGen=2;
  var before=JSON.stringify(S),home=()=>viewHome();
  assert.match(home(),/data-home-book="current" aria-label="本朝事务">/);
  assert.match(home(),/本朝记录/);assert.doesNotMatch(home(),/第一朝记录|第二朝记录/);
  assert.match(viewLog(),/本朝记录/);assert.doesNotMatch(viewLog(),/第一朝记录|第二朝记录/);
  UI.logReignGen=S.gen;UI.logReign=1;assert.match(viewLog(),/第一朝记录/);assert.doesNotMatch(viewLog(),/本朝记录|第二朝记录/);
  UI.logReign='all';assert.match(viewLog(),/本朝记录.*第二朝记录.*第一朝记录/);
  assert.equal(JSON.stringify(S),before);`);
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

test('children and officials show their chronicles after the person and actions but before detailed chapters',()=>{
 const child=renderCase(['child','viewKid()',`UI.sel=k.id;story(k,'最新纪事核对')`]).html;
 assert.ok(child.indexOf('detail-head')<child.indexOf('detail-actions'));
 assert.ok(child.indexOf('detail-actions')<child.indexOf('id="child-history"'));
 assert.ok(child.indexOf('id="child-history"')<child.indexOf('id="child-now"'));
 assert.ok(child.indexOf('最新纪事核对')<child.indexOf('id="child-now"'));
 const official=renderCase(['official','viewOfficial()',`UI.sel=c.id+':father';var p=houseOf(c).father;p.story||=[];p.story.push({d:dateStr(),t:'官员最新纪事'});`]).html;
 assert.ok(official.indexOf('detail-head')<official.indexOf('detail-actions'));
 assert.ok(official.indexOf('detail-actions')<official.indexOf('官员最新纪事'));
 assert.ok(official.indexOf('官员最新纪事')<official.indexOf('家族往来'));
});

test('married children show family first and the chronicle second in both navigation and content',()=>{
 for(const [who,partner] of [['k','沈明月'],['sister','林知远']]){
  const {html}=renderCase(['married-child','viewKid()',`var person=${who};person.born=S.turn-240;person.married=true;person.spouse={name:'${partner}'};UI.sel=person.id;`]);
  const chapters=Array.from(html.matchAll(/class="page-chapter" aria-labelledby="child-([^"]+)"/g),m=>m[1]);
  assert.deepEqual(chapters.slice(0,2),['family','history']);
  assert.equal(new Set(chapters).size,chapters.length);
  assert.deepEqual(Array.from(html.matchAll(/href="#child-([^"]+)"/g),m=>m[1]),chapters);
  assert.ok(html.includes('spouse-portrait')&&html.indexOf(partner)<html.indexOf('id="child-family"'));
 }
});
