/* Actual Chrome UI imports, choices, portrait fitting and refresh/load checks. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures=process.env.PALACE_FIXTURES||'/tmp/palace-relationships-fixtures';
const url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/dev.html';
const shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/relationships');
const output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/relationships-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,consorts:S.consorts,children:S.children,cands:S.cands,rel:S.rel,
 selection:S.selection,marriageBonds:S.flags.marriageBonds,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})))}
async function reload(page,r,label){const before=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();await page.waitForFunction(()=>S?.turn>=60);
 assert.deepEqual(await read(page),before,label);r.reloads.push(label);}
async function shot(page,name){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:88});}
async function layout(page,r){const d=await page.evaluate(()=>{const b=document.querySelector('#modal').open?document.querySelector('#mbox'):document.querySelector('#panel');return {width:innerWidth,document:document.documentElement.scrollWidth,box:b.clientWidth,content:b.scrollWidth};});assert.ok(d.document<=d.width+1&&d.content<=d.box+1,'no horizontal clipping');r.layouts.push(d);}
async function importCase(page,name){await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();
 await page.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await page.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();
 await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));await page.waitForFunction(()=>S?.turn===60);assert.equal((await read(page)).blocked,false);}
async function menu(page,name){await page.locator('#menu').getByRole('button',{name,exact:true}).click();}
async function click(page,label){await page.locator('#modal').getByRole('button',{name:label}).click();}
async function finish(page){if(await page.locator('#modal[open]').count()){assert.ok((await read(page)).result);await page.locator('#modal .mch button').click();}}
async function person(page,id){await menu(page,'后宫');await page.locator(`[onclick="A.go('consort',${id})"]`).first().click();}
async function history(page,needle){if(await page.locator('.chronicle-filter-fold:not([open]) > summary').count())await page.locator('.chronicle-filter-fold:not([open]) > summary').click();await page.getByRole('textbox',{name:'搜索人物纪事',exact:true}).fill(needle);await page.getByRole('button',{name:'搜索纪事',exact:true}).click();const item=page.locator('#panel li:visible').filter({hasText:needle}).last();await item.scrollIntoViewIfNeeded();assert.ok(await item.isVisible());}
async function portrait(page,cell){const d=await page.locator('.detail-head [data-headpiece]').evaluate(el=>{const image=el.closest('svg.portrait')||el.ownerSVGElement;return {cell:el.dataset.headpiece,x:+el.getAttribute('x'),y:+el.getAttribute('y'),width:+el.getAttribute('width'),height:+el.getAttribute('height'),badge:!!image.querySelector('circle')};});
 assert.equal(d.cell,String(cell));assert.ok(d.y<42&&d.x<65);assert.equal(d.badge,false);return d;}
async function run(page,r){
 const name=r.name,fixture=name.startsWith('selection-')?(name==='selection-rival'?'rival':'friends'):name;
 await importCase(page,fixture);await reload(page,r,'imported');
 if(name.startsWith('selection-')){
  const initial=await read(page),a=initial.cands[0],b=initial.cands[1],both=name==='selection-both'||name==='selection-rival';
  const decisions=name==='selection-neither'?[[a,false],[b,false]]:name==='selection-second'?[[a,false],[b,true]]:[[a,true],[b,both]];
  for(const [p,keep] of decisions){await menu(page,'选秀');await page.locator(`[onclick="A.${keep?'xxTake':'xxDrop'}(${p.id})"]`).click();
   if(keep){await click(page,'封为常在');await finish(page);}await reload(page,r,'candidate-'+p.id);}
  await menu(page,'选秀');await page.getByRole('button',{name:'确定名单，安排入宫',exact:true}).click();
  if(name==='selection-neither'||name==='selection-rival'){assert.equal((await read(page)).title,null);assert.ok((await read(page)).consorts.every(p=>!p.selectionBonds));}
  else {assert.equal((await read(page)).title,both?'留选后的悄悄话':'宫门前的私语');assert.match(await page.locator('#modal').innerText(),/沈清微/);assert.match(await page.locator('#modal').innerText(),/顾兰音/);
   await reload(page,r,'conversation-pending');await layout(page,r);await shot(page,name+'-'+r.viewport);await click(page,'让她们把话说完');await reload(page,r,'conversation-recorded');await finish(page);
   const kept=(await read(page)).consorts.find(p=>p.id===(name==='selection-second'?b.id:a.id));assert.equal(kept.selectionBonds.length,1);assert.equal(kept.selectionBonds[0].otherKept,both);
   await person(page,kept.id);await history(page,'两人先前');}
  await reload(page,r,'batch-complete');
 }else if(name==='sister'||name==='married-sister'){
  const data=await read(page),host=data.consorts.find(p=>p.given==='知微'),sister=data.consorts.find(p=>p.given==='知柔'),guest=host.house.relatives.find(p=>p.visit);
  await person(page,sister.id);await page.locator(`[onclick="A.go('natal','${sister.id}:${guest.id}')"]`).first().click();
  assert.match(await page.locator('#panel').innerText(),/询问留宫意愿/);await page.getByRole('button',{name:/询问留宫意愿/}).scrollIntoViewIfNeeded();await shot(page,name+'-'+r.viewport);
  if(name==='married-sister'){assert.equal(await page.getByRole('button',{name:/询问留宫意愿/}).isDisabled(),true);assert.match(await page.locator('#panel').innerText(),/已婚/);}
  else {await page.getByRole('button',{name:/询问留宫意愿/}).click();await reload(page,r,'courtship');assert.equal((await read(page)).title,'留宫之意');await click(page,'纳为常在');await reload(page,r,'admission');await finish(page);const admitted=(await read(page)).consorts.find(p=>p.id===guest.id);assert.ok(admitted);assert.equal(admitted.natalOrigin.host,host.id);}
 }else if(name==='marriage'||name==='marriage-legacy'){
  if(name==='marriage'){await click(page,'听听她的婚事，商议指婚');await reload(page,r,'marriage-petition');await click(page,'赐婚成全');await reload(page,r,'wedding');await finish(page);}
  const d=await read(page),queen=d.consorts.find(p=>p.rank===8),other=d.consorts.find(p=>p.given==='明珠');assert.equal(Object.keys(d.marriageBonds).length,1);
  assert.ok(d.rel[[queen.id,other.id].sort((a,b)=>a-b).join('_')]>=30);
  await person(page,queen.id);await page.getByRole('button',{name:'听她们谈姻亲家事',exact:true}).click();await reload(page,r,'family-dialogue');assert.match(await page.locator('#modal').innerText(),/顾云深/);assert.match(await page.locator('#modal').innerText(),/眼热/);
  await shot(page,name+'-'+r.viewport);await click(page,'听她们聊聊家事');await reload(page,r,'family-memories');await finish(page);
  for(const id of [queen.id,other.id]){await person(page,id);await history(page,'两人谈起这门亲事');}await shot(page,name+'-chronicle-'+r.viewport);
 }else if(name==='crowns'){
  const queen=(await read(page)).consorts.find(p=>p.rank===8);await person(page,queen.id);r.headpieces=[await portrait(page,0)];await shot(page,'empress-default-'+r.viewport);
  for(const [id,cell] of [['goldphoenix',2],['peony',3]]){
   await page.locator(`[onclick="A.jewelryWear(${queen.id},'${id}')"]`).click();await reload(page,r,'wear-'+id);await person(page,queen.id);r.headpieces.push(await portrait(page,cell));await shot(page,'empress-'+id+'-'+r.viewport);
  }
  await page.getByRole('button',{name:'收起珍饰，恢复原装扮',exact:true}).click();await reload(page,r,'restore-default');await person(page,queen.id);await portrait(page,0);
  await menu(page,'后宫');assert.ok(await page.locator('[data-headpiece="0"]').count());await shot(page,'empress-roster-'+r.viewport);
 }else {
  while((await read(page)).title==='弄璋弄瓦'||['双凤齐鸣','双胞胎'].includes((await read(page)).title)){
   if((await read(page)).result)break;await click(page,'赐名');await reload(page,r,'naming-'+r.reloads.length);if((await read(page)).consorts.find(p=>p.rank===8).delivery.settled)break;await finish(page);
  }
  const queen=(await read(page)).consorts.find(p=>p.rank===8),feeling=queen.delivery.feeling;assert.ok(feeling);assert.equal(feeling.regret,name==='daughter');
  assert.deepEqual(feeling.children,queen.delivery.children);
  await layout(page,r);await shot(page,'birth-'+name+'-'+r.viewport);await finish(page);await person(page,queen.id);await history(page,'产后初见');await shot(page,'birth-'+name+'-chronicle-'+r.viewport);await reload(page,r,'maternal-history');
  for(const k of (await read(page)).children)assert.ok(k.story.some(s=>s.life?.title==='初见孩子的心事'));
 }
 await layout(page,r);assert.equal((await read(page)).blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['selection-both','selection-first','selection-second','selection-neither','selection-rival','sister','married-sister','crowns','daughter','son','twins','marriage','marriage-legacy']){
  if(process.env.PALACE_CASE&&name!==process.env.PALACE_CASE)continue;const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(10000);
  const r={name,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
  try{await run(page,r);console.log('PASS',viewport,name,r.reloads.length);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+name+'-'+viewport);console.error('FAIL',viewport,name,e.message);}
  await context.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.summary={cases:report.runs.length,passed:report.runs.filter(x=>x.passed).length,reloads:report.runs.reduce((n,x)=>n+x.reloads.length,0)};await fs.writeFile(output,JSON.stringify(report,null,2));}
 if(report.runs.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
