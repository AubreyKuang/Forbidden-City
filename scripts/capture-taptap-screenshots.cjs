#!/usr/bin/env node
/* Phone-portrait store screenshots of the built TapTap package, driven through the
   real game in headless Chrome (DevTools protocol; Node 22+ for the global WebSocket).

     python3 scripts/build-taptap.py
     node scripts/capture-taptap-screenshots.cjs      # docs/taptap/raw/*.png
     python3 scripts/build-taptap-store-art.py        # captions, icon

   One reign (萧珩 · 弘晏) is prepared with the game's own code, so every shot shows the
   same emperor and era. The package's index.html is served unchanged: no debug panel. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {spawn}=require('node:child_process');
const {boot}=require('../tests/playtest-harness.cjs');

const root=path.resolve(__dirname,'..'),site=path.join(root,'dist/taptap/chengongji'),out=path.join(root,'docs/taptap/raw'),store=path.join(root,'docs/taptap/screenshots');
const CHROME=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// 400×600 CSS px at 2.7× → 1080×1620, the gameplay area under a 300px caption band.
const VIEWPORT={width:400,height:600,deviceScaleFactor:2.7,mobile:true};
if(!fs.existsSync(path.join(site,'index.html')))throw Error('Run python3 scripts/build-taptap.py first');
if(typeof WebSocket==='undefined')throw Error('Node 22 or newer is required');

// The month's memorial is fixed when first opened; pin it to the Ministry of Works'
// garden request, whose choices are 准奏 / 不准 with their previewed effects.
const MEMORIAL='修建园林';
function prepareReign(){
  const probe=boot(830);probe.run('A.start();drain();S.turn=60;S.year=6;S.month=3;');
  const memorial=probe.run(`COURT.findIndex(f=>{try{return f()?.title===${JSON.stringify(MEMORIAL)}}catch{return false}})`);
  if(memorial<0)throw Error('memorial '+MEMORIAL+' not found');
  const b=boot(830);
  for(const [field,value] of [['#f-sur','萧'],['#f-name','珩'],['#f-era','弘晏']])b.ctx.document.querySelector(field).value=value;
  b.run(`A.start();drain();S.turn=60;S.year=6;S.month=3;E().energy=12;E().treasury=900;
    A.establishJinyiwei();choose(0);drain();E().energy=10;PalaceActions.reset();
    createFenghuaPerson('heXingjian');S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:${memorial}};
    PalaceActions.reset();save('auto');`);
  const raw=b.storage.get('chengongji_v1_auto');
  const data=JSON.parse(raw);
  if(data.emp.sur+data.emp.name!=='萧珩'||data.emp.era!=='弘晏')throw Error('reign was not named');
  return raw;
}

function serve(){
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json'};
  const server=http.createServer((req,res)=>{
    const file=path.join(site,decodeURIComponent(new URL(req.url,'http://x').pathname));
    if(!file.startsWith(site)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server)));
}

async function chrome(){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'chengongji-shots-'));
  const proc=spawn(CHROME,['--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
    '--hide-scrollbars','--mute-audio',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((resolve,reject)=>{
    let log='';proc.stderr.on('data',d=>{log+=d;const m=log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)/);if(m)resolve(m[1]);});
    proc.on('exit',()=>reject(Error('Chrome exited:\n'+log)));
  });
  const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const waiting=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(waiting.has(m.id)){const {resolve,reject}=waiting.get(m.id);waiting.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const close=()=>{ws.close();proc.on('exit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{/* Chrome may still be flushing its profile. */}});proc.kill();};
  return {send,close};
}

// Captions from issue #37. The store accepts portrait shots from 720×1280 up to a 5:8
// ratio; 1080×1920 keeps the real game on 84% of the image.
const CAPTIONS={'01-title':'一朝为帝，宫阙深深。','02-memorial':'每一封奏折，都是一次抉择。',
  '03-story-consort':'六位剧情妃，各有一段前尘。','04-jinyiwei-case':'宫里没有秘密，只有还没查到的案子。'};
const captionPage=(png,text)=>`<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#2a0f0c}
  header{height:300px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:28px;
    background:linear-gradient(180deg,#8f1d18,#5e1210);border-bottom:6px solid #d9a441}
  i{width:18px;height:18px;transform:rotate(45deg);background:#e9bf5a;flex:none}
  h1{margin:0;color:#ffe7a3;font:900 ${Math.min(64,Math.floor(860/[...text].length)-4)}px/1.25 "Songti SC","STSong","Noto Serif SC",serif;letter-spacing:3px;white-space:nowrap;
    text-shadow:0 3px 0 #3a0906,0 0 18px #00000055;max-width:900px;text-align:center}
  img{display:block;width:1080px;height:1620px}
</style><header><i></i><h1>${text}</h1><i></i></header><img src="data:image/png;base64,${png}">`;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
  const raw=prepareReign(),server=await serve(),url=`http://127.0.0.1:${server.address().port}/index.html`;
  const {send,close}=await chrome();
  const evaluate=async expression=>{
    const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  };
  const open=async()=>{
    await send('Page.navigate',{url});
    for(let i=0;i<100;i++){await sleep(100);if(await evaluate(`return document.readyState==='complete'&&!!document.querySelector('#panel button')`).catch(()=>false))break;}
    await sleep(600);
  };
  const shot=async name=>{
    await sleep(900);
    const check=await evaluate(`return {text:document.body.innerText,debug:!!document.querySelector('#dev-panel,.dev-tools,[data-dev]')}`);
    if(/未能存档|存档写入失败|DEV/.test(check.text)||check.debug)throw Error(name+': save warning or debug text on screen');
    const {data}=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data,'base64'));console.log('captured',name);
  };
  try{
    fs.mkdirSync(out,{recursive:true});
    await send('Page.enable');await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride',VIEWPORT);
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`try{if(!localStorage.getItem('chengongji_v1_1'))localStorage.setItem('chengongji_v1_1',${JSON.stringify(raw)});}catch{}`});

    // 1. Title: the saved reign is offered on the landing page.
    await open();
    if(!(await evaluate(`return document.body.innerText`)).includes('萧珩'))throw Error('title does not list the prepared reign');
    await shot('01-title');

    // 2. A memorial with approve / reject choices and their previewed effects.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));A.court();await new Promise(r=>setTimeout(r,300));
      if(curEv?.title!==${JSON.stringify(MEMORIAL)})throw Error('memorial did not open: '+curEv?.title);`);
    await shot('02-memorial');

    // 3. Story consort codex, opened at 陆绾.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));openHomeBook('archive');await new Promise(r=>setTimeout(r,300));jumpToPageSection('home-story-consorts');await new Promise(r=>setTimeout(r,400));
      const card=document.querySelector('[data-story-consort="luwan"]');
      if(!card)throw Error('陆绾 card missing');card.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));
      // Sit the card just below the sticky chapter tabs.
      const covering=[...document.querySelectorAll('#panel *')].filter(e=>getComputedStyle(e).position==='sticky').map(e=>e.getBoundingClientRect().bottom);
      const top=card.getBoundingClientRect().top,clear=Math.max(0,...covering.filter(b=>b<innerHeight/2))+6;
      (document.scrollingElement||document.documentElement).scrollBy(0,top-clear);`);
    await shot('03-story-consort');

    // 4. Jinyiwei: 贺行简's first assignment, 「借牌的人」.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));A.go('jinyiwei');await new Promise(r=>setTimeout(r,300));
      A.heXingjianMission();await new Promise(r=>setTimeout(r,300));if(curEv?.title!=='借牌的人')throw Error('case did not open: '+JSON.stringify({modalOpen,title:curEv?.title,view:UI.view,queue:Q.map(e=>e.title)}));`);
    await shot('04-jinyiwei-case');

    // Captioned store copies.
    fs.mkdirSync(store,{recursive:true});
    await send('Emulation.setDeviceMetricsOverride',{width:1080,height:1920,deviceScaleFactor:1,mobile:false});
    const {frameTree}=await send('Page.getFrameTree');
    for(const [name,text] of Object.entries(CAPTIONS)){
      const png=fs.readFileSync(path.join(out,name+'.png')).toString('base64');
      await send('Page.navigate',{url:'about:blank'});await sleep(200);
      await send('Page.setDocumentContent',{frameId:frameTree.frame.id,html:captionPage(png,text)});await sleep(500);
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(store,name+'.png'),Buffer.from(data,'base64'));console.log('captioned',name);
    }
  }finally{close();server.close();}
}
main().catch(e=>{console.error(e.message);process.exit(1);});
