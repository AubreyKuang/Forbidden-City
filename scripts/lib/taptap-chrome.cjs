/* Shared by the TapTap screenshot and video scripts: one prepared reign, a static
   server for the built package, and headless Chrome over the DevTools protocol
   (Node 22+ for the global WebSocket). */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {spawn}=require('node:child_process');
const {boot}=require('../../tests/playtest-harness.cjs');

const root=path.resolve(__dirname,'../..'),site=path.join(root,'dist/taptap/chengongji');
const CHROME=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// The month's memorial is fixed when first opened; pin it to the Ministry of Works'
// garden request, whose choices are 准奏 / 不准 with their previewed effects.
const MEMORIAL='修建园林';
// One reign (萧珩 · 弘晏) made with the game's own code, so every shot and clip shows the
// same emperor and era. It has a Jinyiwei office and has met 贺行简.
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
  if(!fs.existsSync(path.join(site,'index.html')))throw Error('Run python3 scripts/build-taptap.py first');
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json'};
  const server=http.createServer((req,res)=>{
    const file=path.join(site,decodeURIComponent(new URL(req.url,'http://x').pathname));
    if(!file.startsWith(site)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server)));
}

async function chrome(){
  if(typeof WebSocket==='undefined')throw Error('Node 22 or newer is required');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'chengongji-chrome-'));
  const proc=spawn(CHROME,['--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
    '--hide-scrollbars','--mute-audio',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((resolve,reject)=>{
    let log='';proc.stderr.on('data',d=>{log+=d;const m=log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)/);if(m)resolve(m[1]);});
    proc.on('exit',()=>reject(Error('Chrome exited:\n'+log)));
  });
  const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const waiting=new Map(),listeners=new Map();
  ws.addEventListener('message',e=>{
    const m=JSON.parse(e.data);
    if(m.method){for(const fn of listeners.get(m.method)||[])fn(m.params);return;}
    if(waiting.has(m.id)){const {resolve,reject}=waiting.get(m.id);waiting.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const on=(method,fn)=>{if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(fn);};
  const close=()=>{ws.close();proc.on('exit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{/* Chrome may still be flushing its profile. */}});proc.kill();};
  const evaluate=async expression=>{
    const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  };
  return {send,on,evaluate,close};
}

// Opens the package with the prepared reign in manual slot 1. Each scene loads it
// afresh, since opening a scene autosaves it.
async function gameSession(viewport){
  const raw=prepareReign(),server=await serve(),url=`http://127.0.0.1:${server.address().port}/index.html`;
  const browser=await chrome();
  const {send,evaluate}=browser;
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',viewport);
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`try{if(!localStorage.getItem('chengongji_v1_1'))localStorage.setItem('chengongji_v1_1',${JSON.stringify(raw)});}catch{}`});
  const open=async()=>{
    await send('Page.navigate',{url});
    for(let i=0;i<100;i++){await sleep(100);if(await evaluate(`return document.readyState==='complete'&&!!document.querySelector('#panel button')`).catch(()=>false))break;}
    await sleep(600);
  };
  const assertClean=async label=>{
    const check=await evaluate(`return {text:document.body.innerText,debug:!!document.querySelector('#dev-panel,.dev-tools,[data-dev]')}`);
    if(/未能存档|存档写入失败|DEV/.test(check.text)||check.debug)throw Error(label+': save warning or debug text on screen');
  };
  const close=()=>{browser.close();server.close();};
  return {...browser,open,assertClean,close};
}

module.exports={root,sleep,MEMORIAL,gameSession};
