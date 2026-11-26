const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/dev.html',fixtures='/tmp/palace-wedding-fixtures';
const shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/official-marriages'),output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/official-marriage-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,treasury:E().treasury,energy:E().energy,consorts:S.consorts,children:S.children,scholars:S.scholars,weddings:S.officialMarriages,guard:S.jinyiwei?.commander,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(page,r,label){const before=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();await page.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(page),before,label);r.reloads.push(label);}
async function shot(page,name){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:88});}
async function layout(page,r){const d=await page.evaluate(()=>{const el=document.querySelector('#modal').open?document.querySelector('#mbox'):document.querySelector('#panel');return {width:innerWidth,document:document.documentElement.scrollWidth,box:el.clientWidth,content:el.scrollWidth};});assert.ok(d.document<=d.width+1&&d.content<=d.box+1,'no horizontal clipping');r.layouts.push(d);}
async function click(page,name){await page.locator('#modal').getByRole('button',{name}).click();}
async function finish(page){assert.ok((await read(page)).result);await page.locator('#modal .mch button').click();}
async function importCase(page,name){await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();await click(page,'进入宫城');await page.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));await page.waitForFunction(()=>S?.turn>=60);assert.equal((await read(page)).blocked,false);}
async function navigate(page,name){
 if(name==='princess-entry'){await page.locator('#menu').getByRole('button',{name:'皇嗣',exact:true}).click();const id=(await read(page)).children[0].id;await page.locator(`[data-onclick="A.go('kid',${id})"]`).first().click();return;}
 await page.locator('#menu').getByRole('button',{name:'理政',exact:true}).click();
 if(name==='guard'){await page.getByRole('button',{name:/锦衣卫/}).first().click();return;}
 await page.getByRole('button',{name:/官员表/}).click();await page.getByRole('button',{name:name==='guest'?'陆怀瑾':'沈明远',exact:true}).first().click();
}
async function run(page,r){await importCase(page,r.name);await reload(page,r,'导入后');const initial=await read(page),name=r.name;
 if(!initial.title)await navigate(page,name);
 if(name.startsWith('child-')||name==='infant-alone'){
  assert.equal(initial.title,name==='child-company'?'探望皇嗣 · 母亲在旁':'探望皇嗣');await shot(page,name+'-'+r.viewport);await layout(page,r);
  const motherCount=initial.consorts[1].story.length;await page.locator('#modal .mch button').first().click();await reload(page,r,'探望答复');const after=await read(page);
  if(name!=='child-company')assert.equal(after.consorts[1].story.length,motherCount);if(name==='child-alone')assert.match(after.result.text,/你留下来/);
  await finish(page);await reload(page,r,'探望结束');
 }else if(name==='married'){
  assert.ok(await page.locator('#panel').getByRole('button',{name:'议婚 / 赐婚',exact:true}).isDisabled());await shot(page,'married-'+r.viewport);
 }else if(name==='guard'){
  const cell=await page.evaluate(()=>portraitCell(S.jinyiwei.commander));assert.ok(cell>=423&&cell<=428);await shot(page,'jinyiwei-'+r.viewport);await layout(page,r);
 }else if(name==='letter'){
  await page.getByRole('button',{name:/问问婚后近况/}).click();assert.equal((await read(page)).title,'婚后家书');await reload(page,r,'家书待阅');await shot(page,'family-letter-'+r.viewport);await click(page,'愿卿家中安好');
  await page.getByRole('button',{name:'查看婚事纪事',exact:true}).click();assert.match((await read(page)).text,/婚后家书/);await shot(page,'marriage-history-'+r.viewport);await reload(page,r,'婚事纪事');await click(page,'收起家书');
 }else{
  await page.locator('#panel').getByRole('button',{name:/^议婚 \/ 赐婚/}).first().click();await reload(page,r,'议婚入口');
  if(name==='princess-entry'){await click(page,'从在任官员中择配');await click(page,/沈明远/);}
  else{await shot(page,'sources-'+name+'-'+r.viewport);await click(page,name==='guest'?/礼部访婚/:['family','refusal','betrothal'].includes(name)?/已有家族/:/适婚公主/);
   if(name==='guest')await page.locator('#modal .mch button').first().click();else await click(page,['family','refusal','betrothal'].includes(name)?/魏婉华/:/清宁/);}
  await reload(page,r,'人选名帖');await shot(page,'candidate-'+name+'-'+r.viewport);await layout(page,r);
  if(['princess','princess-entry','same-family'].includes(name))assert.match((await read(page)).text,/15岁/);
  await click(page,/分别问过双方心意/);await reload(page,r,'双方回笺');await shot(page,'consent-'+name+'-'+r.viewport);
  if(name==='refusal'){
   assert.equal(await page.locator('#modal').getByRole('button',{name:/下诏赐婚/}).count(),0);await click(page,'先不定亲');assert.equal((await read(page)).treasury,initial.treasury);
  }else{
   if(name==='betrothal'){await click(page,/先说明旧约/);await reload(page,r,'旧约改议');await shot(page,'betrothal-'+r.viewport);await click(page,'妥善告知两家，再下诏');}
   else await click(page,/下诏赐婚/);
   await reload(page,r,'婚仪结果');await shot(page,'married-'+name+'-'+r.viewport);await finish(page);await reload(page,r,'成婚后');
   await navigate(page,name==='guest'?'guest':name==='princess-entry'?'princess-entry':'princess');const after=await read(page),wedding=after.weddings.couples[0];assert.equal(after.weddings.couples.length,1);assert.equal(after.energy,initial.energy-1);assert.equal(after.treasury,initial.treasury-(wedding.bride.kind==='princess'?50:20));
   if(wedding.bride.kind==='princess'){
    const princess=after.children.find(k=>k.id===wedding.bride.id);assert.equal(princess.spouse.id,wedding.groom.id);assert.ok(princess.household);
    if(name!=='princess-entry')await page.getByRole('button',{name:'看看清宁的近况',exact:true}).click();
    await page.getByRole('button',{name:'查看驸马沈明远的履历',exact:true}).click();assert.equal(await page.evaluate(()=>UI.view),'official');await shot(page,'linked-official-'+name+'-'+r.viewport);
   }else if(wedding.bride.kind==='family'){
    await page.getByRole('button',{name:'查看魏婉华的纪事',exact:true}).click();assert.equal(await page.evaluate(()=>UI.view),'natal');assert.match(await page.locator('#panel').innerText(),/沈明远/);await shot(page,'linked-wife-'+name+'-'+r.viewport);
   }else{await page.getByRole('button',{name:'查看婚事纪事',exact:true}).click();assert.match((await read(page)).text,/陆怀瑾/);await shot(page,'guest-history-'+r.viewport);await click(page,'收起家书');}
  }
 }
 await layout(page,r);assert.equal((await read(page)).blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['princess','princess-entry','family','guest','refusal','betrothal','same-family','married','letter','child-alone','child-company','infant-alone','guard']){
   if(process.env.PALACE_CASES&&!process.env.PALACE_CASES.split(',').includes(name))continue;const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(10000);const r={name,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
   try{await run(page,r);console.log('PASS',viewport,name,r.reloads.length);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+name+'-'+viewport);console.error('FAIL',viewport,name,e.message);}await context.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
