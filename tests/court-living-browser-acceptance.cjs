const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/dev.html',fixtures='/tmp/palace-court-living-fixtures';
const shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/court-living'),output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/court-living-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,treasury:E().treasury,energy:E().energy,consorts:S.consorts,children:S.children,cases:S.palaceCases,jinyiwei:S.jinyiwei,romance:S.palaceRomance,gouyi:S.flags.gouyiSeen,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(page,r,label){const before=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();await page.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(page),before,label);r.reloads.push(label);}
async function shot(page,r,suffix=''){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(shots,r.name+'-'+r.viewport+suffix+'.jpg'),type:'jpeg',quality:88});}
async function click(page,name){await page.locator('#modal').getByRole('button',{name}).click();}
async function menu(page,name){await page.locator('#menu').getByRole('button',{name,exact:true}).click();}
async function importCase(page,name){await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();await click(page,'进入宫城');await menu(page,'存档');await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));await page.waitForFunction(()=>S?.turn>=60);assert.equal((await read(page)).blocked,false);}
async function consort(page,id){await menu(page,'后宫');await page.locator(`#panel [onclick="A.go('consort',${id})"]`).first().click();}
async function officer(page){await menu(page,'理政');await page.getByRole('button',{name:/官员表/}).click();await page.getByRole('button',{name:'沈明远',exact:true}).first().click();}
async function guard(page){await menu(page,'理政');await page.getByRole('button',{name:/锦衣卫/}).first().click();}
async function run(page,r){
 await importCase(page,r.name);await reload(page,r,'导入与刷新');const initial=await read(page),name=r.name,c=initial.consorts[0],k=initial.children[0];
 if(name.startsWith('report-')){
  assert.equal(initial.cases.filter(x=>x.kind==='palace-secret').length,1);assert.match(initial.text,/锦衣卫|核验|原始脉案/);await shot(page,r);
  if(name==='report-clear')await click(page,'澄清传闻，安抚母子');
  else if(name==='report-swap')await click(page,'仍留宫抚养，不罪无辜孩子');
  else if(name==='report-no-swap')await click(page,'安抚母子，澄清流言');
  else if(name==='report-parentage')await click(page,'压下身世，仍作皇嗣抚养');
  else if(name==='report-loss')await click(page,'揭明实情，停止冒报并安排调养');
  else{await click(page,'传两人问清，按原事处置');assert.equal((await read(page)).title,'回廊相依');await reload(page,r,'接回原私情剧情');await click(page,'分别问清，令二人断了私下来往');}
  await reload(page,r,'处置结果');const after=await read(page);assert.equal(after.treasury,initial.treasury);assert.equal(after.jinyiwei.commander.merit,initial.jinyiwei.commander.merit);
  if(name==='report-clear'){assert.equal(after.children[0].parentage.decision,'cleared');assert.ok(after.consorts[1].parentageHurt);}
  if(name==='report-no-swap')assert.equal(after.children[0].parentage.decision,'cleared');
  if(name==='report-swap'){assert.ok(after.children[0].adoptedRoyal);assert.ok(after.children[0].birthSwap.justice.pending);}
  if(name==='report-loss'){assert.ok(after.consorts[0].concealedLoss.revealed);assert.equal(after.children.length,initial.children.length);}
  if(name==='report-romance')assert.equal(Object.values(after.romance.pairs)[0].status,'ended');
  await shot(page,r,'-result');
 }else if(name==='patrol-found'){
  assert.equal(initial.children[0].parentage.status,'hidden');await shot(page,r);await click(page,'循线彻查，先看交办安排');await reload(page,r,'交办前');await click(page,/封存证据，派人彻查/);await reload(page,r,'交办后');const after=await read(page);assert.equal(after.treasury,initial.treasury-15);assert.equal(after.energy,initial.energy-1);assert.equal(after.cases[0].status,'investigating');assert.equal(after.children[0].parentage.status,'suspected');await shot(page,r,'-commission');
 }else if(name==='patrol-empty'){
  await guard(page);await page.getByRole('button',{name:/^巡察宫闱/}).click();await click(page,/按簿巡察/);assert.match((await read(page)).result.text,/未发现/);await reload(page,r,'无收获回报');await shot(page,r);
 }else if(name.startsWith('recovery-')){
  await consort(page,c.id);const button=page.locator(`[onclick="A.night(${c.id})"]`);assert.ok(await button.isDisabled());assert.match(await button.innerText(),/调养.*3个月/);await shot(page,r);await menu(page,'翻牌子');assert.ok(await page.locator(`[onclick="A.night(${c.id})"]`).isDisabled());assert.equal((await read(page)).energy,initial.energy);await reload(page,r,'查看翻牌后');
 }else if(name==='family-tree'){
  await menu(page,'家族');await page.getByRole('button',{name:'展开沈明远的子女',exact:true}).click();const nodes=page.locator('[data-family-child-id]');assert.equal(await nodes.count(),1);const childId=await nodes.first().getAttribute('data-family-child-id');await shot(page,r);
  const box=page.locator('.graph-house').filter({has:page.getByRole('button',{name:'查看沈明远',exact:true})});const dimensions=await box.evaluate(e=>({client:e.clientHeight,content:e.scrollHeight}));assert.ok(dimensions.content<=dimensions.client+2,'expanded tree stays within its card');
  await nodes.first().getByRole('button').click();assert.match(await page.locator('#panel').innerText(),/父亲：沈明远/);assert.match(await page.locator('#panel').innerText(),/母亲：魏婉华/);await shot(page,r,'-child');await reload(page,r,'子女档案');assert.equal((await read(page)).consorts.flatMap(c=>c.house?.relatives||[]).filter(p=>String(p.id)===childId).length,1);
  await menu(page,'家族');await page.getByRole('button',{name:'收起沈明远的子女',exact:true}).click().catch(async()=>{await page.getByRole('button',{name:'展开沈明远的子女',exact:true}).click();await page.getByRole('button',{name:'收起沈明远的子女',exact:true}).click();});assert.equal(await page.locator('[data-family-child-id]').count(),0);
  await page.getByRole('button',{name:'家族列表',exact:true}).click();await page.locator('details.family-branch').filter({has:page.locator('[aria-label="查看沈明远"]')}).locator('summary').first().click();await page.getByRole('button',{name:'展开沈明远的子女',exact:true}).click();assert.equal(await page.locator('[data-family-child-id]').count(),1);await page.getByRole('button',{name:'查看沈明远',exact:true}).scrollIntoViewIfNeeded();await shot(page,r,'-list');
 }else if(name==='story'||name==='story-multiple'){
  await page.getByRole('button',{name:/^景仁宫，.*雪梅辨色/}).click();if(name==='story-multiple'){assert.match((await read(page)).title,/正在发生/);await shot(page,r);await click(page,/沈知微.*雪梅辨色/);}
  assert.equal((await read(page)).title,'雪梅辨色');await reload(page,r,'宫殿直达剧情');assert.equal((await read(page)).energy,initial.energy);await shot(page,r,'-scene');await click(page,/让她细看枝影/);await reload(page,r,'剧情选择');assert.equal((await read(page)).energy,initial.energy-1);
 }else if(name==='promotion'||name==='demotion'){
  await officer(page);assert.match(await page.locator('#panel').innerText(),name==='promotion'?/欣慰又谨慎/:/惶恐/);await page.getByRole('heading',{name:'家书与心境',exact:true}).scrollIntoViewIfNeeded();await shot(page,r);assert.match(await page.locator('#panel').innerText(),/家书之后的小事/);await reload(page,r,'家书与小事');
 }else if(name==='justice-letter'){
  await consort(page,c.id);await page.getByRole('textbox',{name:'搜索人物纪事'}).fill('娘家来信');await page.getByRole('button',{name:'搜索纪事',exact:true}).click();await page.getByRole('textbox',{name:'搜索人物纪事'}).scrollIntoViewIfNeeded();const text=await page.locator('#panel').innerText();assert.match(text,/石阶泼油已然查实/);assert.ok(!text.includes('性子里的委屈'));assert.ok(!text.includes('得知自己由'));await shot(page,r);await reload(page,r,'娘家来信');
 }else if(name==='exam-sister'){
  assert.equal(initial.title,'探花指婚 · 先问心意');assert.match(initial.text,/她是赵令仪的姐姐/);const captions=await page.locator('#modal figcaption').allTextContents();assert.ok(captions.includes('赵令珠'));assert.ok(captions.includes('姚允执'));assert.ok(!captions.some(t=>/公主|undefined/.test(t)));await shot(page,r);await click(page,/双方愿意，赐婚成全/);await reload(page,r,'姐妹指婚结果');assert.match((await read(page)).result.text,/赵令珠与姚允执奉旨成婚/);const wife=(await read(page)).consorts.flatMap(c=>c.house?.relatives||[]).find(p=>p.name==='赵令珠');assert.ok(wife.married);assert.ok(!wife.story.some(s=>/公主/.test(s.t)));
 }else if(name==='codex'){
  await menu(page,'御书房');await page.locator('a[href="#home-story-consorts"]').click();const card=page.locator('[data-story-consort="gouyi"]');assert.match(await card.innerText(),/赵令仪/);assert.equal(await card.locator('[data-portrait-cell="422"]').count(),1);assert.match(await card.innerText(),/汉书.*外戚传/);await shot(page,r);if(r.viewport==='mobile'){await card.getByRole('heading',{name:'钩弋夫人 · 赵令仪',exact:true}).scrollIntoViewIfNeeded();await shot(page,r,'-details');}await card.getByRole('button',{name:'前往出巡',exact:true}).click();await page.getByRole('button',{name:/^浩荡巡狩/}).click();await reload(page,r,'图鉴入口进入相遇');assert.equal((await read(page)).title,'浩荡巡狩 · 河间奇女');await click(page,'屏退围观者，亲自问她是否愿意近前');await click(page,'应她所愿，接入宫中册为贵人');await reload(page,r,'固定剧情妃入宫');assert.equal((await read(page)).consorts.filter(c=>c.gouyi).length,1);await shot(page,r,'-admission');
 }
 const d=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert.ok(d.width<=d.viewport+1,'no page overflow');r.layout=d;assert.equal((await read(page)).blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{const names=['report-clear','report-swap','report-no-swap','report-loss','report-romance','report-parentage','patrol-found','patrol-empty','recovery-birth','recovery-loss','family-tree','story','story-multiple','promotion','demotion','justice-letter','codex','exam-sister'];
 for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of names){
  if(process.env.PALACE_CASES&&!process.env.PALACE_CASES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(9000);const r={name,viewport,reloads:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
  try{await run(page,r);console.log('PASS',viewport,name,r.reloads.length);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,r,'-failure');console.error('FAIL',viewport,name,e.message);}await context.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
