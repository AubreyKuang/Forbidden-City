/* Real UI imports, decisions, profile navigation and reloads. Page evaluation is read-only. */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures='/tmp/palace-court-family-fixtures',url=process.env.PALACE_QA_URL||'http://127.0.0.1:8767/dev.html';
const shots=path.join(root,'docs/screenshots/court-family'),reportPath=process.env.PALACE_BROWSER_RESULTS||path.join(root,'docs/qa/court-family-browser-results.json');
const report={url,started:new Date().toISOString(),revision:process.env.GITHUB_SHA||null,runs:[]};
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify({turn:S.turn,treasury:E().treasury,energy:E().energy,consorts:S.consorts,children:S.children,scholars:S.scholars,rel:S.rel,jinyiwei:S.jinyiwei,cases:S.palaceCases,gouyi:S.flags.gouyiSeen,title:modalOpen?curEv.title:null,result:modalResult,blocked:PalaceActions.blocked})));}
async function reload(page,r,label){const before=await read(page);await page.reload({waitUntil:'load'});await page.getByRole('button',{name:/^读取自动存档/}).click();await page.waitForFunction(()=>!!S);assert.deepEqual(await read(page),before,label);r.reloads.push(label);}
async function layout(page,r){const d=await page.evaluate(()=>{const p=document.querySelector('#modal').open?document.querySelector('#mbox'):document.querySelector('#panel');return {viewport:innerWidth,document:document.documentElement.scrollWidth,box:p.clientWidth,content:p.scrollWidth};});assert.ok(d.document<=d.viewport+1&&d.content<=d.box+1,JSON.stringify(d));r.layouts.push(d);}
async function shot(page,name){await page.waitForLoadState('networkidle');await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:82});}
async function click(page,name){await page.locator('#modal').getByRole('button',{name}).click();}
async function finish(page){if(await page.locator('#modal[open]').count()){const b=page.locator('#modal .mch button');assert.equal(await b.count(),1);await b.click();}}
async function profile(page,id){await page.locator('#menu').getByRole('button',{name:'后宫',exact:true}).click();await page.locator(`[onclick="A.go('consort',${id})"]`).first().click();}
async function run(page,r){
 await page.goto(url);await page.getByRole('button',{name:'新开一局',exact:true}).click();await page.getByRole('button',{name:'登基',exact:true}).click();await click(page,'进入宫城');await page.locator('#menu').getByRole('button',{name:'存档',exact:true}).click();
 await page.locator('#save-file').setInputFiles(path.join(fixtures,r.fixture+'.json'));await page.waitForFunction(()=>S?.turn>=60&&S?.turn<=80);await reload(page,r,'导入');await layout(page,r);
 const initial=await read(page),host=initial.consorts.find(c=>c.given==='知微'),other=initial.consorts.find(c=>c.given==='清容'),wife=host.house.relatives.find(p=>p.name==='沈清月');
 if(r.fixture.startsWith('report-')){
  const label=r.mode==='promote'?/^升职/:r.mode==='demote'?/^降职/:r.mode==='reward'?/^嘉奖/:r.mode==='rebuke'?/^申斥/:/^阅毕/;
  await shot(page,r.fixture+'-'+r.viewport);await click(page,label);await reload(page,r,'批奏');const d=await read(page),p=d.consorts.find(c=>c.id===other.id).house.brother;
  assert.ok(p.reportHistory.length===1);if(r.mode==='promote')assert.equal(p.office,'道员');if(r.mode==='demote')assert.equal(p.office,'同知');
  assert.ok(d.consorts.find(c=>c.id===host.id).house.relatives.find(p=>p.id===wife.id).story.some(s=>s.t.includes('河堤')));
  await finish(page);await profile(page,host.id);await page.locator(`[onclick="A.go('natal','${host.id}:${wife.id}')"]`).first().click();assert.match(await page.locator('#panel').innerText(),/婚后心绪/);await shot(page,'wife-'+r.mode+'-'+r.viewport);
 }else if(r.fixture==='widow-permission'){
  await click(page,r.mode==='allow'?'准其依本人意愿重新议亲':'尊重她眼下的步调，先不议亲');await reload(page,r,'再嫁意愿');const d=await read(page),p=d.consorts.find(c=>c.id===host.id).house.relatives.find(p=>p.id===wife.id);assert.equal(p.widow.authorized,r.mode==='allow');assert.ok(!p.betrothal);
 }else if(r.fixture==='widow-visit'||r.fixture==='sister-pregnancy'){
  await click(page,r.fixture==='sister-pregnancy'?'让姐妹相伴，安排太医问安':r.mode==='gift'?/^赐银照顾/:'让姐妹慢慢说，暂不催她振作');await reload(page,r,'探亲宽慰');await finish(page);await profile(page,host.id);assert.match(await page.locator('#panel').innerText(),/正在宫中小住/);await shot(page,r.fixture+'-'+r.mode+'-'+r.viewport);
 }else if(r.fixture==='sister-birth'||r.fixture==='sister-death'){
  await profile(page,host.id);await page.locator(`[onclick="A.go('natal','${host.id}:${wife.id}')"]`).first().click();assert.match(await page.locator('#panel').innerText(),r.fixture==='sister-death'?/难产去世/:/平安生下/);await shot(page,r.fixture+'-'+r.viewport);await reload(page,r,'婚育纪事');
 }else if(r.fixture==='exam-roster'){
  assert.match(await page.locator('#modal').innerText(),/钦点三甲/);await shot(page,'exam-roster-'+r.viewport);await click(page,'交礼部按卷定次');await reload(page,r,'三甲已定');const d=await read(page);assert.equal(new Set(d.scholars.filter(p=>p.examRank).map(p=>p.name)).size,3);await finish(page);assert.match(await page.locator('#modal').innerText(),/探花议婚/);await reload(page,r,'殿试续议婚');
 }else if(r.fixture.startsWith('exam-')){
  const princess=initial.children.find(k=>k.name==='昭宁'),name=r.mode==='sister'?new RegExp('沈清月'):new RegExp('昭宁');await click(page,name);await reload(page,r,'问双方心意');
  if(r.fixture==='exam-refusal'){assert.ok(await page.getByRole('button',{name:/双方愿意，赐婚成全/}).isDisabled());await click(page,'尊重心意，暂不定亲');}
  else{await shot(page,'tanhua-'+r.mode+'-'+r.viewport);await click(page,/双方愿意，赐婚成全/);}
  await reload(page,r,'指婚结果');const d=await read(page),g=d.scholars[0];assert.equal(!!g.married,r.fixture!=='exam-refusal');
  if(g.married){assert.equal(r.mode==='sister'?d.consorts.find(c=>c.id===host.id).house.relatives.find(p=>p.id===wife.id).spouse.personId:d.children.find(k=>k.id===princess.id).spouse.personId,g.id);}
 }else if(r.fixture==='jinyiwei-clue'){
  await shot(page,'jinyiwei-clue-'+r.viewport);await click(page,r.mode==='trace'?/^循线查证/:r.mode==='watch'?'继续留意，暂不立案':'证据不足，暂且封存');await reload(page,r,'线索批复');const d=await read(page);assert.equal(d.jinyiwei.clues[0].status,{trace:'assigned',watch:'watching',seal:'shelved'}[r.mode]);assert.equal(d.consorts.find(c=>c.id===other.id).house.brother.office,'江南知府');
 }else if(r.fixture.startsWith('gouyi-inquiry-')){
  const g=initial.consorts.find(c=>c.gouyi),stage=Number(r.fixture.at(-1));assert.match(initial.title,/钦安殿/);await shot(page,r.fixture+'-'+r.viewport);
  const index=r.mode==='second'?1:r.mode==='later'?2:0;await page.locator('#modal .mch button').nth(index).click();await reload(page,r,'问缘选择');
  const d=await read(page),now=d.consorts.find(c=>c.id===g.id);assert.equal(now.gouyi.inquiry.stage,index===2?stage-1:stage);assert.equal(d.energy,initial.energy-(index===2?0:1));
  await finish(page);await profile(page,g.id);assert.match(await page.locator('#panel').innerText(),/令仪问缘/);await shot(page,r.fixture+'-profile-'+r.viewport);
  if(index===2){await page.getByRole('button',{name:/同赴钦安殿/}).click();assert.match((await read(page)).title,/钦安殿/);await reload(page,r,'暂缓后再赴殿');}
 }else if(r.fixture.startsWith('gouyi-reaction-')){
  const g=initial.consorts.find(c=>c.gouyi),other=g.gouyi.court.pending.other;await shot(page,r.fixture+'-'+r.viewport);
  await click(page,r.mode==='protect'?'制止以奇闻讥人，不要求她展示':/让赵令仪自己回答|听她们把话说完/);await reload(page,r,'宫人反响');
  const d=await read(page),now=d.consorts.find(c=>c.id===g.id),peer=d.consorts.find(c=>c.id===other);assert.ok(!now.gouyi.court.pending);assert.ok(peer.gouyiImpression);assert.ok(now.story.some(s=>s.thread?.includes('gouyi-court:')));assert.ok(peer.story.some(s=>s.thread?.includes('gouyi-court:')));
  await finish(page);await profile(page,peer.id);assert.match(await page.locator('#panel').innerText(),/人物纪事/);await shot(page,r.fixture+'-peer-'+r.viewport);
 }else if(r.fixture==='gouyi'){
  if(r.mode==='leave'){await click(page,/赏赐医资/);await reload(page,r,'归家');assert.equal((await read(page)).consorts.some(c=>c.gouyi),false);}
  else {await shot(page,'gouyi-meeting-'+r.viewport);await click(page,'屏退围观者，亲自问她是否愿意近前');await reload(page,r,'帝前展掌');await shot(page,'gouyi-palm-'+r.viewport);await click(page,'应她所愿，接入宫中册为贵人');await reload(page,r,'钩弋入宫');await finish(page);const g=(await read(page)).consorts.find(c=>c.gouyi);assert.equal(g.rank,3);assert.equal(g.arc.id,'gouyi');await profile(page,g.id);assert.match(await page.locator('#panel').innerText(),/钩弋之遇/);await shot(page,'gouyi-profile-'+r.viewport);}
 }
 await layout(page,r);assert.equal((await read(page)).blocked,false);assert.deepEqual(r.errors,[]);r.passed=true;
}
const cases=[['report-good','promote'],['report-good','reward'],['report-good','archive'],['report-bad','demote'],['report-bad','rebuke'],['report-bad','archive'],['widow-permission','allow'],['widow-permission','wait'],['widow-visit','comfort'],['widow-visit','gift'],['sister-pregnancy','comfort'],['sister-birth','profile'],['sister-death','profile'],['exam-marriage','princess'],['exam-marriage','sister'],['exam-refusal','princess'],['exam-roster','ranking'],['jinyiwei-clue','trace'],['jinyiwei-clue','watch'],['jinyiwei-clue','seal'],['gouyi','admit'],['gouyi','leave']];
for(let stage=1;stage<=4;stage++)for(const mode of ['first','second','later'])cases.push(['gouyi-inquiry-'+stage,mode]);
for(const kind of ['curious','doubt','rival','kind','reserved','etiquette']){cases.push(['gouyi-reaction-'+kind,'listen']);if(['doubt','rival'].includes(kind))cases.push(['gouyi-reaction-'+kind,'protect']);}
(async()=>{await fs.mkdir(shots,{recursive:true});const engine=process.env.PALACE_BROWSER==='firefox'?firefox:chromium;report.engine=engine.name();const browser=await engine.launch({headless:true,...(process.env.PALACE_CHROME_PATH?{executablePath:process.env.PALACE_CHROME_PATH}:{})});report.browser=browser.version();try{
 casesLoop: for(const [viewport,size] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const [fixture,mode] of cases){if(process.env.PALACE_CASE&&!fixture.includes(process.env.PALACE_CASE))continue;const context=await browser.newContext({viewport:size}),page=await context.newPage();page.setDefaultTimeout(9000);const r={fixture,mode,viewport,reloads:[],layouts:[],errors:[],passed:false};report.runs.push(r);page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));try{await run(page,r);console.log('PASS',viewport,fixture,mode);}catch(e){r.failure=e.stack;r.visible=await page.locator('body').innerText().catch(()=>null);await shot(page,'failure-'+fixture+'-'+mode+'-'+viewport);console.error('FAIL',viewport,fixture,mode,e.message);}await context.close();await fs.writeFile(reportPath,JSON.stringify(report,null,2));if(!r.passed&&process.env.PALACE_FAIL_FAST)break casesLoop;}
 }finally{await browser.close();report.finished=new Date().toISOString();report.summary={cases:report.runs.length,passed:report.runs.filter(r=>r.passed).length,reloads:report.runs.reduce((n,r)=>n+r.reloads.length,0)};await fs.writeFile(reportPath,JSON.stringify(report,null,2));}if(report.runs.some(r=>!r.passed))process.exitCode=1;
})().catch(async e=>{report.status='failed';report.failure=e.stack;await fs.writeFile(reportPath,JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
