const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/index.html',shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/court-rhythm'),output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/court-rhythm-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(p){return p.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,energy:E().energy,children:S.children,consorts:S.consorts,dowager:S.flags.dowager,cooldown:S.flags.lastResidenceRequest,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(p,r){const before=await read(p);await p.reload({waitUntil:'load'});await p.getByRole('button',{name:/^读取自动存档/}).click();await p.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(p),before);r.reloads++;}
async function shot(p,r,suffix=''){await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(shots,r.name+'-'+r.viewport+suffix+'.jpg'),type:'jpeg',quality:85});}
async function drain(p){for(let i=0;i<70;i++){if(!(await read(p)).title)return;await p.locator('#modal .mch button:not([disabled])').first().click();}throw Error('Modal queue did not settle');}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();try{
 for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['cining','annual','residence']){
  const ctx=await browser.newContext({viewport:size}),p=await ctx.newPage(),r={name,viewport,reloads:0,errors:[],passed:false};report.runs.push(r);p.setDefaultTimeout(12000);p.on('dialog',d=>d.accept());p.on('pageerror',e=>r.errors.push(e.message));
  try{
   await p.goto(url);await p.getByRole('button',{name:'新开一局',exact:true}).click();await p.getByRole('button',{name:'登基',exact:true}).click();await p.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await p.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();await p.locator('#save-file').setInputFiles('/tmp/palace-court-rhythm-fixtures/'+name+'.json');await p.waitForFunction(()=>S?.turn>=60);await reload(p,r);assert.equal((await read(p)).blocked,false);
   if(name==='cining'){
    await p.locator('#menu').getByRole('button',{name:'宫城',exact:true}).click();await p.locator('#mapwrap').getByRole('button',{name:/^慈宁宫/}).click();await p.locator('.cining-heading').waitFor();
    const button=p.locator('.cining-heading button[onclick="A.greet()"]');assert.equal(await button.count(),1);const pos=await button.boundingBox();assert.ok(pos.y>=0&&pos.y+pos.height<size.height);const head=await p.locator('.cining-heading h2').boundingBox();assert.ok(pos.x>head.x+head.width);r.button=pos;await shot(p,r);r.titles=[];r.texts=[];
    for(let i=0;i<4;i++){await button.click();const state=await read(p);assert.doesNotMatch(state.text,/今日已经说过一回话|先前的话已说过/);r.titles.push(state.title);r.texts.push(state.text);if(i>=2)await shot(p,r,'-visit-'+(i+1));await reload(p,r);await drain(p);}
    assert.ok(new Set(r.texts).size>=3);assert.equal((await read(p)).dowager.conversations.visits.count,4);await reload(p,r);
   }else if(name==='annual'){
    let k=(await read(p)).children.find(k=>k.name==='清宁');assert.equal(k.lit,56);assert.equal(k.birthOmenYear,1);await drain(p);await p.locator('#menu').getByRole('button',{name:'皇嗣',exact:true}).click();await p.locator('#panel [onclick="A.go(\'kid\','+k.id+')"]').first().click();assert.match(await p.locator('#panel').innerText(),/文星流彩 · 每年才学\+6/);await shot(p,r);await reload(p,r);k=(await read(p)).children.find(c=>c.id===k.id);assert.equal(k.lit,56);assert.equal(k.story.filter(s=>s.t.includes('禀赋岁记')).length,1);
   }else{
    const id=(await read(p)).consorts.find(c=>c.given==='清容').id;assert.equal((await read(p)).title,'迁宫之请');await shot(p,r);await p.locator('#modal').getByRole('button',{name:'仍按原居处，温言说明',exact:true}).click();await reload(p,r);await drain(p);await p.locator('#menu').getByRole('button',{name:'后宫',exact:true}).click();await p.locator('#panel [onclick="A.go(\'consort\','+id+')"]').first().click();assert.equal(await p.getByRole('button',{name:'听她谈居处',exact:true}).count(),0);assert.match(await p.locator('#panel').innerText(),/安排居所/);await reload(p,r);assert.equal((await read(p)).cooldown,60);
   }
   const dims=await p.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(dims.width<=dims.viewport+1);assert.deepEqual(r.errors,[]);r.passed=true;console.log('PASS',viewport,name);
  }catch(e){r.failure=e.stack;r.visible=await p.locator('body').innerText().catch(()=>null);console.error('FAIL',viewport,name,e.message);await shot(p,r,'-failure');}
  await ctx.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }
 }finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
