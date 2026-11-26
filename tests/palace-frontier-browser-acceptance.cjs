const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures=process.env.PALACE_FIXTURES||'/tmp/palace-frontier-fixtures';
const url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/dev.html',shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/frontier');
const output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/frontier-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,consorts:S.consorts,children:S.children,cands:S.cands.map(c=>({...c,clan:c.clan||c.sur+'|'+c.fam.t})),rel:S.rel,treasury:E().treasury,
 selection:S.selection,campaigns:S.flags.frontierCampaigns,houses:S.flags.frontierHouses,dowager:S.flags.dowager,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(page,r,label){const before=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();await page.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(page),before,label);r.reloads.push(label);}
async function shot(page,name){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:88});}
async function layout(page,r){const d=await page.evaluate(()=>{const b=document.querySelector('#modal').open?document.querySelector('#mbox'):document.querySelector('#panel');return {width:innerWidth,document:document.documentElement.scrollWidth,box:b.clientWidth,content:b.scrollWidth};});assert.ok(d.document<=d.width+1&&d.content<=d.box+1,'no horizontal clipping');r.layouts.push(d);}
async function importCase(page,name){await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();await page.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await page.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));await page.waitForFunction(()=>S?.turn>=60);assert.equal((await read(page)).blocked,false);}
async function menu(page,name){await page.locator('#menu').getByRole('button',{name,exact:true}).click();}
async function click(page,label){await page.locator('#modal').getByRole('button',{name:label}).click();}
async function finish(page){assert.ok((await read(page)).result);await page.locator('#modal .mch button').click();}
async function person(page,id){await menu(page,'后宫');await page.locator(`[data-onclick="A.go('consort',${id})"]`).first().click();}
async function history(page,needle){if(await page.locator('.chronicle-filter-fold:not([open]) > summary').count())await page.locator('.chronicle-filter-fold:not([open]) > summary').click();await page.getByRole('textbox',{name:'搜索人物纪事',exact:true}).fill(needle);await page.getByRole('button',{name:'搜索纪事',exact:true}).click();const item=page.locator('#panel li:visible').filter({hasText:needle}).last();await item.scrollIntoViewIfNeeded();assert.ok(await item.isVisible());}
async function run(page,r){
 const name=r.name;await importCase(page,name);await reload(page,r,'imported');
 if(name.startsWith('dowager-')){
  assert.equal((await read(page)).title,name==='dowager-praise'?'慈宁宫':'慈宁宫 · 窗前时令');await shot(page,name+'-'+r.viewport);await page.locator('#modal .mch button').first().click();await reload(page,r,'dowager-answer');await finish(page);
  const topic=JSON.stringify((await read(page)).dowager.conversations);await page.locator('[data-onclick="A.greet()"]').click();assert.equal((await read(page)).title,'慈宁宫 · 静坐');await reload(page,r,'same-month-quiet');await click(page,'陪她坐一会');assert.equal(JSON.stringify((await read(page)).dowager.conversations),topic);
 }else if(name==='arrivals'||name==='expired'){
  await menu(page,'选秀');const data=await read(page),first=data.consorts[0],cohort=first.selectionCohort;
  const panel=await page.locator('#panel').innerText();assert.equal(panel.includes('新妃安顿'),name==='arrivals');await shot(page,name+'-'+r.viewport);
  const entry=page.locator('#panel').getByRole('button',{name:name==='arrivals'?'重新选秀':/^下旨选秀/});await entry.click();await reload(page,r,'reselection-pending');
  await click(page,/暂缓|再等等|作罢|不了/);if((await read(page)).result)await finish(page);assert.equal((await read(page)).treasury,data.treasury);
  await entry.click();await page.locator('#modal .mch button').first().click();if((await read(page)).result)await finish(page);
  await reload(page,r,'new-selection');const after=await read(page);assert.equal(after.treasury,data.treasury-100);assert.ok(after.cands.length);assert.deepEqual(after.consorts.find(x=>x.id===first.id).selectionCohort,cohort);
 }else if(name==='officials'){
  await menu(page,'理政');await page.getByRole('button',{name:/官员表/}).click();await page.locator('.official-filters').getByRole('button',{name:'全部',exact:true}).click();
  assert.deepEqual(await page.locator('.official-table th').allTextContents(),['姓名','年龄','性格','官职','家族 · 宫中','派系','状态','才干/信任/功绩','皇嗣','近期事迹']);
  for(const filter of ['在朝','全部','外任与奉差','故去与获罪']){await page.getByRole('button',{name:filter,exact:true}).click();assert.ok(!(await page.locator('#panel').innerText()).includes('沈闻书'));}
  await page.locator('.official-filters').getByRole('button',{name:'全部',exact:true}).click();assert.ok(await page.getByRole('button',{name:'顾明远',exact:true}).count());
  const styled=await page.locator('.official-table td').first().evaluate(el=>({display:getComputedStyle(el).display,padding:getComputedStyle(el).paddingLeft}));
  assert.equal(styled.display,r.viewport==='mobile'?'grid':'table-cell');if(r.viewport!=='mobile')assert.equal(styled.padding,'10px');
  await layout(page,r);await shot(page,'officials-'+r.viewport);await reload(page,r,'official-table');
 }else if(name==='cleared'){
  const before=await read(page);await click(page,'澄清传闻，安抚母子');await reload(page,r,'cleared-result');const after=await read(page),mother=after.consorts[0];
  assert.equal(mother.xin.k,'委屈');assert.ok(mother.mood<before.consorts[0].mood);assert.equal(after.children[0].parentage.decision,'cleared');await layout(page,r);await shot(page,'parentage-cleared-'+r.viewport);await finish(page);
  await person(page,mother.id);await history(page,'身世昭雪后的委屈');await shot(page,'parentage-chronicle-'+r.viewport);await reload(page,r,'maternal-history');
 }else {
  const data=await read(page),campaign=data.campaigns[0];assert.match(data.result.text,name==='defeat'?/失利/:/王师告捷/);await finish(page);
  if(name==='defeat'){assert.equal((await read(page)).title,null);await menu(page,'理政');assert.equal(await page.getByRole('button',{name:'继续论功行赏',exact:true}).count(),0);await shot(page,'defeat-'+r.viewport);}
  else {
   assert.equal((await read(page)).title,'北境论功行赏');await reload(page,r,'reward-pending');await layout(page,r);await shot(page,'reward-'+name+'-'+r.viewport);
   if(name==='defer'){await click(page,'稍后论赏');await finish(page);await reload(page,r,'reward-deferred');await menu(page,'理政');await page.getByRole('button',{name:'继续论功行赏',exact:true}).click();await click(page,/赐金银绢帛/);}
   else {await click(page,'问卿所欲，听他亲口请赏');await reload(page,r,'request');assert.equal((await read(page)).title,'将军所愿');await shot(page,'request-'+name+'-'+r.viewport);
    if(name==='promotion')await click(page,'准请，晋为骠骑将军');
    else if(name==='silver')await click(page,/赏金银，犒军/);
    else {await click(page,/召见.*先听她的心意/);await reload(page,r,'daughter-audience');assert.equal((await read(page)).title,'功臣荐女');await layout(page,r);await shot(page,'daughter-'+name+'-'+r.viewport);
     if(name==='unwilling'){assert.equal(await page.getByRole('button',{name:'依她心意，纳为常在',exact:true}).count(),0);await click(page,'尊重她的心意，另行赏功');}
     else {await click(page,'依她心意，纳为常在');await reload(page,r,'admitted');await finish(page);assert.ok((await read(page)).consorts.find(c=>c.id===campaign.daughter.id));}
     assert.equal((await read(page)).title,'北境论功行赏');assert.equal((await read(page)).campaigns[0].reward,undefined);await click(page,/赐金银绢帛/);
    }
   }
   await reload(page,r,'reward-settled');await finish(page);const after=await read(page);assert.equal(after.campaigns[0].reward.kind,name==='promotion'?'promotion':'silver');assert.equal(after.treasury,data.treasury-(name==='promotion'?0:30));
   await menu(page,'理政');await page.getByRole('button',{name:'查看将领履历',exact:true}).click();assert.match(await page.locator('#modal').innerText(),/领兵出征北境/);assert.ok((await page.locator('#modal').innerText()).includes(campaign.name));await shot(page,'general-history-'+name+'-'+r.viewport);await click(page,'阅毕');
   if(name==='promotion'||name==='family-daughter'){await person(page,data.consorts[0].id);await history(page,name==='promotion'?'骠骑将军':'北境');await shot(page,'family-memory-'+name+'-'+r.viewport);}
  }
 }
 await layout(page,r);assert.equal((await read(page)).blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}],['tablet',{width:820,height:900}]])for(const name of ['daughter','unwilling','family-daughter','promotion','silver','defer','defeat','cleared','arrivals','expired','officials','dowager-praise','dowager-chat']){
  if(viewport==='tablet'&&name!=='officials')continue;
  if(process.env.PALACE_CASE&&name!==process.env.PALACE_CASE)continue;const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(10000);const r={name,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
  try{await run(page,r);console.log('PASS',viewport,name,r.reloads.length);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+name+'-'+viewport);console.error('FAIL',viewport,name,e.message);}
  await context.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.summary={cases:report.runs.length,passed:report.runs.filter(r=>r.passed).length,reloads:report.runs.reduce((n,x)=>n+x.reloads.length,0)};await fs.writeFile(output,JSON.stringify(report,null,2));}
 if(report.runs.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
