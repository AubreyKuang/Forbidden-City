const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),url=process.env.PALACE_QA_URL||'http://127.0.0.1:8428/index.html';
const shots=process.env.PALACE_SHOTS||path.join(root,'docs/screenshots/personal-talk'),output=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/personal-talk-browser-results.json');
const report={url,started:new Date().toISOString(),runs:[]};
async function read(p){return p.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,energy:E().energy,consorts:S.consorts,children:S.children,rel:S.rel,arcPacing:S.flags.arcPacing,title:modalOpen?curEv.title:null,text:modalOpen?curEv.text:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(p,r){const before=await read(p);await p.reload({waitUntil:'load'});await p.getByRole('button',{name:/^读取自动存档/}).click();await p.waitForFunction(()=>S?.turn>=60);assert.deepEqual(await read(p),before);r.reloads++;}
async function shot(p,r,suffix=''){await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(shots,r.name+'-'+r.viewport+suffix+'.jpg'),type:'jpeg',quality:85});}
(async()=>{await fs.mkdir(shots,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PALACE_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
 try{for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const name of ['chat','jealous','love']){
  const ctx=await browser.newContext({viewport:size}),p=await ctx.newPage(),r={name,viewport,reloads:0,topics:[],errors:[],passed:false};report.runs.push(r);p.setDefaultTimeout(12000);p.on('dialog',d=>d.accept());p.on('pageerror',e=>r.errors.push(e.message));
  try{
   await p.goto(url);await p.getByRole('button',{name:'新开一局',exact:true}).click();await p.getByRole('button',{name:'登基',exact:true}).click();await p.locator('#modal').getByRole('button',{name:'进入宫城',exact:true}).click();await p.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();await p.locator('#save-file').setInputFiles('/tmp/palace-personal-talk-fixtures/'+name+'.json');await p.waitForFunction(()=>S?.turn>=60);await reload(p,r);const initial=await read(p);assert.equal(initial.blocked,false);await shot(p,r);
   if(name==='chat'){
    const id=initial.consorts.find(c=>c.given==='知微').id;r.topics.push('mood');assert.match(initial.text,/身世已查明/);assert.doesNotMatch(initial.text,/许清容|最喜欢|心愿|孩子还小/);
    for(let i=0;i<9&&!['child','relations','wish'].every(t=>r.topics.includes(t));i++){
     await p.locator('#modal').getByRole('button',{name:'好',exact:true}).click();await p.locator('#menu').getByRole('button',{name:'后宫',exact:true}).click();await p.locator('#panel [data-onclick="A.go(\'consort\','+id+')"]').first().click();await p.locator('#panel').getByRole('button',{name:/^闲话家常/}).click();const state=await read(p),c=state.consorts.find(c=>c.id===id),topic=c.chatThread.lastTopic;
     assert.ok(!r.topics.includes(topic),'nonrepeating subject');r.topics.push(topic);assert.equal(state.energy,initial.energy-i-1);assert.equal(c.xin.k,'委屈');if(['child','relations','wish'].includes(topic))await shot(p,r,'-'+topic);await reload(p,r);
    }
    assert.ok(['child','relations','wish'].every(t=>r.topics.includes(t)));
   }else{
    assert.match(initial.text,name==='jealous'?/惦记沈贵人/:/并蒂花笺/);if(name==='jealous')assert.doesNotMatch(initial.text,/坤宁宫|皇后|近日总往/);
    await p.locator('#modal .mch button').first().click();await reload(p,r);const state=await read(p);
    if(name==='jealous')assert.ok(state.consorts.some(c=>c.story.some(s=>s.t.includes('沈知微')&&s.t.includes('醋意'))));else {const c=state.consorts.find(c=>c.given==='知微');assert.equal(c.arc.done,true);assert.equal(c.bond,true);}
   }
   assert.deepEqual(r.errors,[]);const layout=await p.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(layout.width<=layout.viewport+1);r.passed=true;console.log('PASS',viewport,name,r.topics.join(','));
  }catch(e){r.failure=e.stack;r.visible=await p.locator('body').innerText().catch(()=>null);console.error('FAIL',viewport,name,e.message);await shot(p,r,'-failure');}
  await ctx.close();await fs.writeFile(output,JSON.stringify(report,null,2));
 }}finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.runs.every(r=>r.passed);await fs.writeFile(output,JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
