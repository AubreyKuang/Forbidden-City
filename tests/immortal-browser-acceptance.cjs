/* Real-browser acceptance. Install Playwright in a separate runner, then set NODE_PATH.
   Uses disposable contexts and UI file import; never connects to a personal profile. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures=process.env.PALACE_FIXTURES||'/tmp/palace-immortal-browser-fixtures';
const url=process.env.PALACE_QA_URL||'https://aubreykuang.github.io/Forbidden-City/dev.html';
const shots=path.join(root,'docs/screenshots/immortal-journeys');
const resultPath=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/immortal-browser-results.json');
const cases=[['master',0],['master',1],['master',2],['first-trial',0],['first-trial',1],['stay-or-return',0],['stay-or-return',1],['sect-leader',0],['sect-leader',1],['next-reign',0],['next-reign',1],['window-chess',0],['window-chess',1]];
const report={targetCommit:'ff478c6',url,started:new Date().toISOString(),browser:null,runs:[]};
async function read(page){return page.evaluate(()=>{
 const k=royalHouseholds().find(k=>k.name==='清和'),m=S.consorts.find(c=>fullName(c)==='沈知微'),f=S.consorts.find(c=>fullName(c)==='许清容');
 const person=p=>p?{id:p.id,name:p.name||fullName(p),trait:p.trait,solitary:p.solitary,story:p.story,journeys:p.journeys,immortal:p.immortal,born:p.born,mom:p.mom,foster:p.foster}:null;
 return JSON.parse(JSON.stringify({turn:S.turn,gen:S.gen,treasury:E().treasury,energy:E().energy,prestige:E().prestige,people:E().people,wen:E().wen,k:person(k),m:person(m),f:person(f),blocked:PalaceActions.blocked,title:modalOpen?curEv.title:null,result:!!modalResult}));
});}
async function stableReload(page,run,label){
 const before=await read(page);await page.reload({waitUntil:'load'});
 await page.getByRole('button',{name:/^读取自动存档/}).click();
 await page.waitForFunction(()=>!!S);
 const after=await read(page);assert.deepEqual(after,before,label+' must restore the same character, choices, money and pending scene');
 run.reloads.push(label);
}
async function layout(page,run,label){
 const data=await page.evaluate(()=>{
  const dialog=document.querySelector('#modal'),panel=document.querySelector('#panel');
  const box=dialog.open?document.querySelector('#mbox'):panel;
  return {viewport:innerWidth,document:document.documentElement.scrollWidth,box:box.clientWidth,content:box.scrollWidth,
   buttons:[...box.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({label:b.textContent.trim(),width:b.clientWidth,content:b.scrollWidth}))};
 });
 assert.ok(data.document<=data.viewport+1,label+' document overflow');
 assert.ok(data.content<=data.box+1,label+' panel/modal overflow');
 assert.ok(data.buttons.every(b=>b.content<=b.width+2),label+' clipped button text');run.layouts.push({label,...data});
}
async function shot(page,name){
 await page.waitForLoadState('networkidle');await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:85,fullPage:false});
}
async function endResult(page){if(await page.locator('#modal[open]').count()){const buttons=page.locator('#modal .mch button');assert.equal(await buttons.count(),1,'only dismiss a resolved or acknowledgement scene');await buttons.click();}}
async function importCase(page,name){
 await page.goto(url,{waitUntil:'load'});
 await page.getByRole('button',{name:'新开一局',exact:true}).click();
 await page.getByRole('button',{name:'登基',exact:true}).click();
 await page.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();
 await page.locator('#menu').getByRole('button',{name:/存档/}).click();
 await page.locator('#save-file').setInputFiles(path.join(fixtures,name+'.json'));
 await page.locator('#modal[open]').waitFor();
 assert.equal((await read(page)).blocked,false,'import must recover the pending scene');
}
async function clickChoice(page,index){await page.locator('#modal .mch button').nth(index).click();}
async function jump(page,months){
 await page.getByRole('button',{name:'DEV · 金手指',exact:true}).click();
 await page.locator('#dev-time-amount').fill(String(months));await page.locator('#dev-time-unit').selectOption('month');
 await page.getByRole('button',{name:'跳过并保存',exact:true}).click();
 await page.locator('#dev-panel').getByRole('button',{name:'收起',exact:true}).click();
}
async function openPerson(page,id,type){
 await page.locator('#menu').getByRole('button',{name:type==='kid'?'皇嗣':type==='relative'?'家族':'后宫',exact:true}).click();
 const selector=`[data-onclick="A.go('${type}',${id})"]`;
  if(type==='kid'&&!await page.locator(selector).count())await page.getByRole('button',{name:/^宫外/}).click();
 await page.locator(selector).first().click();
}
async function check(page,name,choice,run,viewport){
 await importCase(page,name);const before=await read(page);run.initial={title:before.title,turn:before.turn,gen:before.gen,child:before.k?.name};
 if(name==='master'&&process.env.PALACE_CHECK_ACCESSIBLE_NAME==='1')assert.equal(await page.getByRole('img',{name:'照玄道长',exact:true}).count(),1);
 await layout(page,run,'pending');if(choice===0)await shot(page,name+'-'+viewport+'-pending');
 await stableReload(page,run,'pending');
 await clickChoice(page,choice);await layout(page,run,'result');
 await stableReload(page,run,'result');
 const result=await read(page);run.resultText=await page.locator('#modal').innerText();
 if(name==='master'){
  assert.equal(result.treasury,before.treasury-(choice===0?30:0));
  assert.equal(result.k.immortal.stage,['learning','invited','closed'][choice]);
  if(choice===0)for(const p of [result.m,result.f])assert.ok(p.story.some(s=>s.t.includes('辞阙入山')&&s.t.includes('清和')));
 }else if(name==='first-trial'){
  assert.equal(result.k.immortal.stage,'trial');assert.equal(result.k.immortal.due,result.turn+12);assert.equal(result.k.immortal.rank,0);
 }else if(name==='stay-or-return'){
  assert.equal(result.k.immortal.stage,choice===0?'sect':'returned');
 }else if(name==='sect-leader'||name==='next-reign'){
  assert.equal(result.k.immortal.rank,choice===0?(name==='sect-leader'?3:2):before.k.immortal.rank);
  if(choice===1)for(const prop of ['treasury','prestige','people','wen'])assert.equal(result[prop],before[prop]);
  if(name==='next-reign'){assert.equal(result.gen,2);assert.equal(result.k.id,before.k.id);assert.equal(result.k.born,before.k.born);}
 }
 await endResult(page);await stableReload(page,run,'settled');
 if(name==='window-chess'){
  for(let stage=1;stage<3;stage++){
   await openPerson(page,before.m.id,'consort');assert.equal(await page.getByRole('button',{name:'再过3个月',exact:true}).isDisabled(),true);
   await jump(page,3);await page.getByRole('button',{name:'听她说后来的事 →',exact:true}).click();
   await stableReload(page,run,'chapter-'+(stage+1)+'-pending');await clickChoice(page,choice);await stableReload(page,run,'chapter-'+(stage+1)+'-result');await endResult(page);
  }
  const final=await read(page);assert.equal(final.m.journeys.history.filter(h=>h.id==='windowChess').length,3);assert.equal(final.m.journeys.current,undefined);assert.equal(final.m.trait,before.m.trait);assert.deepEqual(final.m.solitary,before.m.solitary);
  assert.equal(final.energy,before.energy-3);assert.equal(final.m.journeys.history.at(-1).outcome,choice===0?'不必相让':'各留一席');
  await stableReload(page,run,'completed-story');await openPerson(page,before.m.id,'consort');
  await page.getByRole('heading',{name:'人生长卷',exact:true}).scrollIntoViewIfNeeded();await layout(page,run,'story-history');if(choice===0)await shot(page,'window-chess-'+viewport+'-history');
 }else if(choice===0){
  await openPerson(page,before.k.id,name==='next-reign'?'relative':'kid');
  await page.getByRole('heading',{name:'仙缘与江湖',exact:true}).scrollIntoViewIfNeeded();await layout(page,run,'character-detail');
  await shot(page,name+'-'+viewport+'-detail');
  if(name==='master'){
   await page.getByRole('button',{name:'寄家书 · 精力−1',exact:true}).click();await stableReload(page,run,'family-letter');await endResult(page);
   await openPerson(page,before.k.id,'kid');assert.equal(await page.getByRole('button',{name:'寄家书 · 精力−1',exact:true}).isDisabled(),true);
   for(const [kind,p] of [['birth-mother',before.m],['foster-mother',before.f]]){
    await openPerson(page,p.id,'consort');if(await page.locator('.chronicle-filter-fold:not([open]) > summary').count())await page.locator('.chronicle-filter-fold:not([open]) > summary').click();await page.getByRole('textbox',{name:'搜索人物纪事',exact:true}).fill('辞阙入山');await page.getByRole('button',{name:'搜索纪事',exact:true}).click();
    const entry=page.locator('#panel li:visible').filter({hasText:'辞阙入山'}).last();
    await entry.scrollIntoViewIfNeeded();assert.ok((await entry.innerText()).includes('清和'));if(viewport==='desktop')await shot(page,'master-'+kind+'-chronicle');
   }
  }
  if(name==='stay-or-return'){
   await page.getByRole('button',{name:'商议归来',exact:true}).click();assert.match(await page.locator('#modal').innerText(),/暂不常归/);
   await clickChoice(page,0);await endResult(page);assert.equal((await read(page)).k.immortal.stage,'sect');
  }
  if(name==='next-reign'){
   await page.getByRole('button',{name:'寄家书 · 精力−1',exact:true}).click();const letter=await page.locator('#modal').innerText();assert.match(letter,/陛下/);assert.doesNotMatch(letter,/父皇/);await stableReload(page,run,'new-reign-letter');if(viewport==='desktop')await shot(page,'next-reign-letter');
  }
 }
 run.final=await read(page);assert.equal(run.final.blocked,false);assert.equal(run.errors.length,0,'browser JavaScript errors');
}
(async()=>{
 await fs.mkdir(shots,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const [name,choice] of cases){
  if(process.env.PALACE_CASE&&name!==process.env.PALACE_CASE)continue;
  if(process.env.PALACE_VIEWPORT&&viewport!==process.env.PALACE_VIEWPORT)continue;
  if(process.env.PALACE_CHOICE!==undefined&&choice!==Number(process.env.PALACE_CHOICE))continue;
  const context=await browser.newContext({viewport:size,deviceScaleFactor:1}),page=await context.newPage();page.setDefaultTimeout(12000);
  const run={name,choice,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(run);
  page.on('dialog',d=>d.accept());page.on('pageerror',e=>run.errors.push(e.message));
  try{await check(page,name,choice,run,viewport);run.passed=true;console.log('PASS',viewport,name,choice,'reloads='+run.reloads.length);}
  catch(e){run.failure=e.stack;run.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+name+'-'+viewport+'-'+choice);console.error('FAIL',viewport,name,choice,e.message);}
  await context.close();await fs.writeFile(resultPath,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();await fs.writeFile(resultPath,JSON.stringify(report,null,2));}
 if(report.runs.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
