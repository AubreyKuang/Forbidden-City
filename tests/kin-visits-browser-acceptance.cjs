/* Disposable Chrome contexts, real UI imports/clicks/reloads, read-only assertions. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures=process.env.PALACE_FIXTURES||'/tmp/palace-kin-visits-fixtures';
const url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/dev.html';
const shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/kin-visits');
const reportPath=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/kin-visits-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({
 turn:S.turn,treasury:E().treasury,rel:S.rel,cands:S.cands,consorts:S.consorts,
 title:modalOpen?curEv.title:null,result:modalResult,blocked:PalaceActions.blocked
})));}
async function reload(page,r,label){const a=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();
 await page.waitForFunction(()=>!!S);assert.deepEqual(await read(page),a,label);r.reloads.push(label);}
async function shot(page,name){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:85});}
async function layout(page,r){const size=await page.evaluate(()=>{const b=document.querySelector('#modal').open?document.querySelector('#mbox'):document.querySelector('#panel');return {viewport:innerWidth,document:document.documentElement.scrollWidth,box:b.clientWidth,content:b.scrollWidth};});
 assert.ok(size.document<=size.viewport+1&&size.content<=size.box+1,'no horizontal clipping');r.layouts.push(size);}
async function importCase(page,name){await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();
 await page.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await page.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();
 await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));await page.waitForFunction(()=>S?.turn===60||S?.turn===66);assert.equal((await read(page)).blocked,false);}
async function click(page,label){await page.locator('#modal').getByRole('button',{name:label}).click();}
async function finish(page){if(await page.locator('#modal[open]').count()){const buttons=page.locator('#modal .mch button');assert.equal(await buttons.count(),1);await buttons.click();}}
function named(data,given){return data.consorts.find(c=>c.given===given);}
async function person(page,id){await page.locator('#menu').getByRole('button',{name:'后宫',exact:true}).click();await page.locator(`[onclick="A.go('consort',${id})"]`).first().click();}
async function chronicle(page,needle){await page.getByRole('textbox',{name:'搜索人物纪事',exact:true}).fill(needle);await page.getByRole('button',{name:'搜索纪事',exact:true}).click();
 const item=page.locator('#panel li:visible').filter({hasText:needle}).last();await item.scrollIntoViewIfNeeded();assert.ok((await item.innerText()).includes(needle));}
async function runCase(page,r){
 const fixture=r.name==='decline'?'declines-palace':r.name.startsWith('friend-')?(r.name==='friend-later'?'old-friends-later':'old-friends'):'visiting-sister';
 await importCase(page,fixture);await reload(page,r,'imported');const initial=await read(page),host=named(initial,'知微'),other=named(initial,'明珠');
 const sister=host.house.relatives.find(x=>x.betrothal?.match.name==='顾云深');
 if(!r.name.startsWith('friend-')){
  assert.match(await page.locator('#modal').innerText(),/顾云深/);await layout(page,r);
  if(r.name==='decree'){
   await click(page,'听听她的婚事，商议指婚');await reload(page,r,'petition');await shot(page,'petition-'+r.viewport);
   await click(page,'赐婚成全 · 国库−10');await reload(page,r,'decreed');const d=await read(page),p=named(d,'知微').house.relatives.find(x=>x.id===sister.id);
   assert.equal(d.treasury,initial.treasury-10);assert.equal(p.married,true);assert.equal(p.visit,undefined);assert.equal(p.spouse.name,'顾云深');assert.equal(named(d,'明珠').house.brother.married,true);
  }else{
   await click(page,'一见倾心，询问她是否愿意入宫');await reload(page,r,'courtship');
   if(r.name==='admit'){
    assert.match(await page.locator('#modal').innerText(),/了结原来的亲事/);await shot(page,'courtship-'+r.viewport);await click(page,'了结原议亲，纳为常在');
   }else await click(page,r.name==='defer'?'不急，仍按探亲之约':'尊重她的心意');
   await reload(page,r,'answer');const d=await read(page),p=named(d,'知微').house.relatives.find(x=>x.id===sister.id);
   if(r.name==='admit'){
    const g=d.consorts.find(x=>x.id===sister.id);assert.ok(g);assert.equal(g.artPortrait,sister.artPortrait);assert.equal(p.betrothal,undefined);assert.equal(named(d,'明珠').house.brother.married,false);
    for(const c of [g,named(d,'知微'),named(d,'明珠')])assert.ok(c.story.some(s=>s.t.includes('顾云深')&&s.t.includes('作罢')));
   }else {assert.equal(p.betrothal.match.name,'顾云深');assert.equal(p.consortId,undefined);if(r.name==='decline')assert.equal(p.declined,true);}
  }
  await finish(page);await reload(page,r,'settled');
  if(r.name==='admit'){await person(page,other.id);await chronicle(page,'议亲生变');await shot(page,'changed-marriage-chronicle-'+r.viewport);}
 }else if(r.name==='friend-later'){
  await person(page,host.id);await chronicle(page,'我虽眼热');await layout(page,r);await shot(page,'old-friend-later-'+r.viewport);await reload(page,r,'later-history');
 }else{
  await page.locator('#menu').getByRole('button',{name:'选秀',exact:true}).click();assert.match(await page.locator('#panel').innerText(),/小时候|幼时/);
  assert.match(await page.locator('#panel').innerText(),/发涩/);await layout(page,r);if(r.name==='friend-admit')await shot(page,'old-friend-audience-'+r.viewport);
  await page.getByRole('button',{name:'直接看名册',exact:true}).click();await reload(page,r,'roster');await page.locator('#menu').getByRole('button',{name:'选秀',exact:true}).click();
  const id=initial.cands[0].id;
  if(r.name==='friend-drop'){
   await page.getByRole('button',{name:'撂牌子',exact:true}).click();await reload(page,r,'dismissed');const d=await read(page);assert.equal(d.consorts.some(x=>x.id===id),false);assert.ok(!named(d,'知微').oldCourtFriends);
  }else{
   await page.getByRole('button',{name:'留牌子',exact:true}).click();await reload(page,r,'rank-choice');await click(page,'封为常在');await reload(page,r,'admitted');await finish(page);
   await page.getByRole('button',{name:'确定名单，安排入宫',exact:true}).click();await reload(page,r,'batch-settled');
   const d=await read(page),g=d.consorts.find(x=>x.id===id);assert.ok(named(d,'知微').oldCourtFriends.includes(id));assert.equal(g.oldCourtFriend.id,host.id);
   for(const c of [g,named(d,'知微')])assert.ok(c.story.some(s=>s.life?.title==='宫门旧识'));
   await person(page,host.id);await chronicle(page,'发涩');await shot(page,'old-friend-reunion-'+r.viewport);
  }
 }
 await layout(page,r);const d=await read(page);assert.equal(d.blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['decree','admit','defer','decline','friend-admit','friend-drop','friend-later']){
  if(process.env.PALACE_CASE&&name!==process.env.PALACE_CASE)continue;
  const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(10000);
  const r={name,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
  try{await runCase(page,r);console.log('PASS',viewport,name,r.reloads.length);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+name+'-'+viewport);console.error('FAIL',viewport,name,e.message);}
  await context.close();await fs.writeFile(reportPath,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.summary={cases:report.runs.length,passed:report.runs.filter(x=>x.passed).length,reloads:report.runs.reduce((n,x)=>n+x.reloads.length,0)};await fs.writeFile(reportPath,JSON.stringify(report,null,2));}
 if(report.runs.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
