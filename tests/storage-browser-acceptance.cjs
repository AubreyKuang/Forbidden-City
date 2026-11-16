/* Real UI in isolated browser contexts. Storage fault injection happens before
   launch or at the database boundary; gameplay is driven only by buttons/files. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/index.html',shots=process.env.PALACE_SHOTS||'/tmp/palace-storage-shots',output=process.env.PALACE_BROWSER_RESULTS||'/tmp/palace-storage-browser.json';
const KEY='chengongji_v1_auto',fixture=JSON.parse(require('node:fs').readFileSync('/tmp/palace-family-garden-fixtures/autosave.json','utf8'));
const report={url,started:new Date().toISOString(),runs:[]};
async function ready(p){await p.waitForFunction(()=>!!PalaceStorage.store&&!PalaceStorage.store.pending);}
async function state(p){return p.evaluate(()=>({turn:S.turn,energy:E().energy,title:modalOpen?curEv.title:null,result:modalResult,blocked:PalaceActions.blocked,people:S.consorts.map(c=>({id:c.id,story:c.story})),archive:S.flags.storageQaArchive?.length}));}
async function restore(p,r){await ready(p);const before=await state(p);await p.reload();await p.getByRole('button',{name:/^读取自动存档/}).click();await p.waitForFunction(()=>!!S);assert.deepEqual(await state(p),before);r.reloads++;}
async function drain(p){for(let n=0;n<120;n++){if(!await p.locator('#modal').isVisible())return;await p.locator('#modal .mch button:not([disabled])').first().click();}throw Error('Pending scenes did not finish');}
async function savePage(p){await p.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();await ready(p);}
async function endMonth(p){const turn=(await state(p)).turn;await p.getByRole('button',{name:'结束本月 ▸',exact:true}).click();for(let n=0;n<25&&(await state(p)).turn===turn;n++)await p.locator('#modal .mch button:not([disabled])').last().click();assert.equal((await state(p)).turn,turn+1);await ready(p);}
async function shot(p,r,suffix=''){await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(shots,r.name+'-'+r.viewport+suffix+'.jpg'),type:'jpeg',quality:85});}
async function seed(ctx,full=false){await ctx.addInitScript(({data,key,full})=>{
 if(localStorage.getItem('qa-seeded'))return;
 const raw=JSON.stringify(data);localStorage.setItem(key,raw);localStorage.setItem('chengongji_v1_1',raw);localStorage.setItem(key+':backup',raw);localStorage.setItem('chengongji_v1_before-import',raw);localStorage.setItem('chengongji_dev_v1_auto',raw);localStorage.setItem(key+':snapshots',JSON.stringify([{label:'qa-year',savedAt:1,day:data.turn,date:'旧年岁首',raw}]));localStorage.setItem('qa-seeded','1');
 if(full){let value='';for(const size of [65536,1024,1])for(let n=0;n<6000;n++){try{const next=value+'x'.repeat(size);localStorage.setItem('qa-other-game-data',next);value=next;}catch{break;}}}
 },{data:fixture,key:KEY,full});}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['full-legacy','large-file','write-failure','two-tabs','dev-isolation','gallery-isolation']){
 const ctx=await browser.newContext({viewport:size,acceptDownloads:true}),p=await ctx.newPage(),r={name,viewport,reloads:0,errors:[],passed:false};report.runs.push(r);p.setDefaultTimeout(20000);p.on('dialog',d=>d.accept());p.on('pageerror',e=>r.errors.push(e.message));
 try{
  await seed(ctx,name==='full-legacy');await p.goto(url);await p.getByRole('button',{name:/^读取自动存档/}).click();await p.waitForFunction(()=>!!S);assert.equal((await state(p)).blocked,false);await savePage(p);
  const legacy=await p.evaluate(()=>localStorage.getItem('chengongji_v1_auto'));
  if(name==='full-legacy'){
   const capacity=await p.evaluate(()=>{try{localStorage.setItem('qa-over-capacity','x');return false;}catch(e){return e.name;}});assert.equal(capacity,'QuotaExceededError');r.legacyQuotaExceeded=true;
   for(const slot of [1,2,3]){await p.locator('.save-slot').filter({has:p.getByText('存档'+slot,{exact:true})}).getByRole('button',{name:'保存',exact:true}).click();await ready(p);}
   r.months=[];for(let n=0;n<3;n++){await endMonth(p);await restore(p,r);await drain(p);await ready(p);r.months.push((await state(p)).turn);}
   await savePage(p);assert.equal(await p.locator('#auto-save-status').innerText(),'本月已自动保存');assert.equal(await p.evaluate(()=>localStorage.getItem('chengongji_v1_auto')),legacy);r.legacyRetained=true;await shot(p,r);await p.locator('#auto-save-status').scrollIntoViewIfNeeded();await shot(p,r,'-saved');
  }else if(name==='large-file'){
   const data=structuredClone(fixture);data.emp.name='长年存档';data.flags.storageQaArchive='十二年宫中日常纪事。'.repeat(400000);const buffer=Buffer.from(JSON.stringify(data));r.fileBytes=buffer.length;assert.ok(buffer.length>8*1024*1024);
   await p.locator('#save-file').setInputFiles({name:'large-palace.json',mimeType:'application/json',buffer});await p.waitForFunction(()=>S?.emp.name==='长年存档');await ready(p);assert.equal((await state(p)).archive,data.flags.storageQaArchive.length);await restore(p,r);await savePage(p);
   await p.locator('.save-slot').filter({has:p.getByText('存档2',{exact:true})}).getByRole('button',{name:'保存',exact:true}).click();await ready(p);
   const downloadEvent=p.waitForEvent('download');await p.getByRole('button',{name:'下载备份文件',exact:true}).click();const dl=await downloadEvent;const file=await dl.path(),exported=JSON.parse(await fs.readFile(file,'utf8'));assert.equal(exported.flags.storageQaArchive,data.flags.storageQaArchive);r.exportBytes=(await fs.stat(file)).size;await shot(p,r);
   await p.getByRole('button',{name:'恢复导入前的进度',exact:true}).click();await p.waitForFunction(()=>S?.emp.name!=='长年存档');await ready(p);await restore(p,r);await savePage(p);
   await p.locator('.save-slot').filter({has:p.getByText('存档2',{exact:true})}).getByRole('button',{name:'读取',exact:true}).click();await p.waitForFunction(()=>S?.emp.name==='长年存档');assert.equal((await state(p)).archive,data.flags.storageQaArchive.length);
  }else if(name==='write-failure'){
   const prior=await p.evaluate(()=>PalaceStorage.store.getConfirmedItem(SKEY+'auto'));
   await p.evaluate(()=>{window.qaPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Injected database quota failure','QuotaExceededError');};});await endMonth(p);await drain(p);await ready(p);assert.equal(await p.evaluate(()=>PalaceStorage.store.getConfirmedItem(SKEY+'auto')),prior);assert.match(await p.locator('#top').innerText(),/未能存档/);await savePage(p);assert.equal(await p.locator('#auto-save-status').innerText(),'自动存档未写入');await shot(p,r,'-refused');
   await p.evaluate(()=>{IDBObjectStore.prototype.put=window.qaPut;});await p.getByRole('button',{name:'立即保存',exact:true}).click();await ready(p);assert.equal(await p.locator('#auto-save-status').innerText(),'本月已自动保存');await restore(p,r);r.retryPreservedProgress=true;
  }else if(name==='two-tabs'){
   const q=await ctx.newPage();q.on('dialog',d=>d.accept());await q.goto(url);await q.getByRole('button',{name:/^读取自动存档/}).click();await q.waitForFunction(()=>!!S);await endMonth(p);await drain(p);await ready(p);const winner=await p.evaluate(()=>PalaceStorage.store.getConfirmedItem(SKEY+'auto'));
   await endMonth(q);await ready(q);assert.match(await q.evaluate(()=>lastAutoSaveError),/另一标签页/);const third=await ctx.newPage();await third.goto(url);await ready(third);assert.equal(await third.evaluate(()=>PalaceStorage.store.getConfirmedItem(SKEY+'auto')),winner);r.otherTabProtected=true;await shot(q,r);
  }else if(name==='dev-isolation'){
   const q=await ctx.newPage();q.on('dialog',d=>d.accept());await q.goto(new URL('dev.html',url).href);await q.getByRole('button',{name:/^读取自动存档/}).click();await q.waitForFunction(()=>!!S);await endMonth(q);await drain(q);await ready(q);await restore(q,r);assert.equal(await q.evaluate(()=>PalaceStorage.store.getConfirmedItem('chengongji_v1_auto')),await p.evaluate(()=>PalaceStorage.store.getConfirmedItem('chengongji_v1_auto')));r.devTurn=(await state(q)).turn;assert.notEqual(r.devTurn,(await state(p)).turn);
  }else{
   const q=await ctx.newPage();await q.goto(new URL('docs/qa/friendship-arcs-gallery/favor.html',url).href);await q.waitForFunction(()=>typeof PalaceStorage!=='undefined');assert.equal(await q.evaluate(()=>PalaceStorage.store),null);r.disposable=true;
  }
  assert.deepEqual(r.errors,[]);r.passed=true;console.log('PASS',viewport,name);
 }catch(e){r.failure=e.stack;console.error('FAIL',viewport,name,e.message);await shot(p,r,'-failure').catch(()=>{});}
 await ctx.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
