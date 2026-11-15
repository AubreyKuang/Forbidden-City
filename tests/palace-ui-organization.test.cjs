const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cases,renderCase,signature}=require('./ui-layout-cases.cjs');
const baseline=require('./fixtures/ui-before-organization.json');
const {boot}=require('./playtest-harness.cjs');

for(const c of cases)test(`layout preserves information and action availability: ${c[0]}`,()=>{
 const before=baseline.pages.find(p=>p.name===c[0]);
 const {html}=renderCase(c),after=signature(html);
 const remaining=after.controls.map(x=>JSON.stringify(x));
 for(const control of before.controls){
  const key=JSON.stringify(control),i=remaining.indexOf(key);
  assert.notEqual(i,-1,`Lost or changed control: ${key}`);
  remaining.splice(i,1);
 }
 // Match longest fragments first so a short name cannot consume a longer phrase.
 let text=after.text.join(' ').replace(/ · (?:原任)?[正从][一二三四五六七八九]品/g,'').replace(/ · (?:尚未授官|无官品|未定品)/g,'').replace('妃嫔娘家、地方铨选或科举','妃嫔娘家或科举');
 for(const fragment of [...before.text].sort((a,b)=>b.length-a.length)){
  assert.ok(text.includes(fragment),`Missing text: ${fragment}`);
  text=text.replace(fragment,'');
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
