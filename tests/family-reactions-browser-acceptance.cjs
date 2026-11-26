const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/index.html',shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/family-reactions'),output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/family-reactions-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(p){return p.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,energy:E().energy,children:S.children,consorts:S.consorts,incidents:S.flags.childFamilyIncidents,bonds:S.flags.marriageBonds,maid:S.flags.maidAudience,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(p,r){const before=await read(p);await p.reload({waitUntil:'load'});await p.getByRole('button',{name:/^读取自动存档/}).click();await p.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(p),before);r.reloads++;}
async function shot(p,r,suffix=''){await p.evaluate(()=>document.fonts.ready);await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));await p.screenshot({path:path.join(shots,r.name+'-'+r.viewport+suffix+'.jpg'),type:'jpeg',quality:85});}
async function drain(p){for(let i=0;i<70;i++){if(!(await read(p)).title)return;await p.locator('#modal .mch button:not([disabled])').first().click();}throw Error('Modal queue did not settle');}
async function menu(p,name){await p.locator('#menu').getByRole('button',{name,exact:true}).click();}
async function visit(p,id){await menu(p,'皇嗣');await p.locator('#panel [data-onclick="A.go(\'kid\','+id+')"]').first().click();await p.locator('#panel').getByRole('button',{name:/^探望/}).click();}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();try{
 for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['cold','old-cold','marriage','maid','factions']){
  const ctx=await browser.newContext({viewport:size}),p=await ctx.newPage(),r={name,viewport,reloads:0,errors:[],passed:false};report.runs.push(r);p.setDefaultTimeout(12000);p.on('dialog',d=>d.accept());p.on('pageerror',e=>r.errors.push(e.message));
  try{
   await p.goto(url);await p.getByRole('button',{name:'新开一局',exact:true}).click();await p.getByRole('button',{name:'登基',exact:true}).click();await p.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await menu(p,'存档');await p.locator('#save-file').setInputFiles('/tmp/palace-family-reactions-fixtures/'+name+'.json');await p.waitForFunction(()=>S?.turn>=60);await reload(p,r);assert.equal((await read(p)).blocked,false);
   if(name==='cold'||name==='old-cold'){
    if(name==='cold'){await p.locator('#modal .mch button').first().click();assert.equal((await read(p)).title,'孩子们一同求情');assert.match((await read(p)).text,/玉宁.*陪交好的孩子/);await shot(p,r,'-petition');await reload(p,r);await p.getByRole('button',{name:'准送衣食与口信，原处分保留',exact:true}).click();await reload(p,r);await drain(p);}
    const id=(await read(p)).children.find(k=>k.name==='清宁').id;r.visits=[];
    for(let i=0;i<3;i++){await visit(p,id);const state=await read(p);assert.equal(state.title,'探望皇嗣');assert.ok(state.text.length<200);assert.doesNotMatch(state.text,/一同来御前|消息传到了/);r.visits.push(state.text);await shot(p,r,'-visit-'+(i+1));await reload(p,r);await drain(p);}
    assert.equal(new Set(r.visits).size,3);assert.equal((await read(p)).consorts.find(c=>c.given==='知微').cold,true);if(name==='old-cold')assert.equal((await read(p)).incidents,undefined);
   }else if(name==='marriage'){
    await p.locator('#modal .mch button').first().click();assert.equal((await read(p)).title,'姻亲道喜');await shot(p,r);await reload(p,r);await p.getByRole('button',{name:'听她们聊聊家事',exact:true}).click();await reload(p,r);await drain(p);assert.equal(Object.values((await read(p)).bonds)[0].lastTalk,60);
   }else if(name==='maid'){
    await menu(p,'翻牌子');await p.getByRole('button',{name:'召见宫女',exact:true}).scrollIntoViewIfNeeded();await shot(p,r,'-entry');await p.getByRole('button',{name:'召见宫女',exact:true}).click();await p.getByRole('button',{name:'召见一位当值宫女',exact:true}).click();const before=await read(p),id=before.maid.person.id;assert.ok(before.maid.person.age>=18);await shot(p,r);await reload(p,r);await p.getByRole('button',{name:'今夜留侍 · 精力−1',exact:true}).click();assert.equal((await read(p)).energy,before.energy-1);await reload(p,r);await drain(p);assert.equal((await read(p)).consorts.filter(g=>g.id===id).length,1);await reload(p,r);
   }else{
    await menu(p,'后宫');const counts=await p.evaluate(()=>factions().L.map(l=>({name:fullName(l),members:factions().map[l.id].map(fullName)})));assert.equal(counts.length,3);r.factions=counts;await p.getByRole('heading',{name:/派系/}).scrollIntoViewIfNeeded();await shot(p,r);await reload(p,r);
   }
   const dims=await p.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(dims.width<=dims.viewport+1);assert.deepEqual(r.errors,[]);r.passed=true;console.log('PASS',viewport,name);
  }catch(e){r.failure=e.stack;r.visible=await p.locator('body').innerText().catch(()=>null);console.error('FAIL',viewport,name,e.message);await shot(p,r,'-failure');}
  await ctx.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }
 }finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
