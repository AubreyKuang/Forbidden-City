#!/usr/bin/env node
/* Headless Chrome checks for the CSP-safe handlers and the Xiaohongshu package.
   Node 22+, Google Chrome (set CHROME to override the path).

   node scripts/xhs-browser-check.cjs equivalence <old-site-dir>
       Plays one fixed, seeded click script on <old-site-dir> (a checkout from before the
       change, inline onclick="" handlers, no CSP) and on this checkout's source (data-on*
       handlers under a strict CSP: script-src 'self'). Every click is a real DOM click.
       The two runs must reach the same game state.
   node scripts/xhs-browser-check.cjs xhs [dist/xhs/package] [--shots DIR]
       Serves the built package under the strict CSP with a simulated window.xhs.miniTool
       (Storage with 1MB keys, getWindowInfo with a capsule, saveImageToPhotosAlbum) and
       browser storage trapped. Plays the script, reloads to check the save, and fails on
       any script error, CSP violation, missing file, browser-storage access or eval.
   node scripts/xhs-browser-check.cjs yiciyuan [dist/yiciyuan/package] [--shots DIR]
       Serves the 易次元 package with the platform SDK URL answered by a simulated
       AvgAIGameSDK (login, cloud profiles, play-time log) and browser storage trapped.
       Plays the script, reloads to check the cloud save, and checks the exit-button
       clearance, that every character is open and that cards open for long-press saving.
   node scripts/xhs-browser-check.cjs nojs [dist/xhs/package] --shots DIR
       Screenshot of index.html with JavaScript disabled (the static first screen). */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const CHROME=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SDK_HOST='https://s9.music.126.net';
const CSP_YC=`default-src 'self'; script-src 'self' ${SDK_HOST}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'`;
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'";

function serve(dir,{csp=true,only=null,policy=CSP}={}){
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
  const misses=[];
  const server=http.createServer((req,res)=>{
    const rel=decodeURIComponent(new URL(req.url,'http://x').pathname);
    const file=path.join(dir,rel);
    if(!file.startsWith(dir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()||(only&&!only(rel))){if(rel!=='/favicon.ico')misses.push(rel);res.writeHead(404);res.end();return;}
    const headers={'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'};
    if(csp)headers['content-security-policy']=policy;
    res.writeHead(200,headers);fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,misses,url:`http://127.0.0.1:${server.address().port}`})));
}

async function chrome(){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'chengongji-xhs-'));
  const proc=spawn(CHROME,['--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check','--hide-scrollbars','--mute-audio',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((resolve,reject)=>{let log='';proc.stderr.on('data',d=>{log+=d;const m=log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)/);if(m)resolve(m[1]);});proc.on('exit',()=>reject(Error('Chrome exited:\n'+log)));});
  const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const waiting=new Map(),listeners=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method){for(const fn of listeners.get(m.method)||[])fn(m.params);return;}
    if(waiting.has(m.id)){const {resolve,reject}=waiting.get(m.id);waiting.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const on=(method,fn)=>{if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(fn);};
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const close=()=>{ws.close();proc.kill();setTimeout(()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{}},500);};
  return {send,on,evaluate,close};
}

// Seeded randomness and a fixed clock, so two builds given the same clicks can be compared.
const DETERMINISM=`(()=>{let s=20261125;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
  const base=1764000000000;let tick=0;const D=Date;Date.now=()=>base+(tick++)*1000;})();`;
// Animation frames draw with Math.random at wall-clock pace; the comparison run stops them
// so both builds consume the seeded sequence only through game actions.
const NO_FRAMES=`window.requestAnimationFrame=()=>0;window.setInterval=()=>0;`;

// The fixed click script. Runs inside the page through DevTools (not subject to CSP); every
// action is element.click() / a dispatched event, so the page's own handlers do the work.
const SCRIPT=String.raw`
const sel=expr=>document.querySelector('[data-onclick="'+expr+'"]')||document.querySelector('[onclick="'+expr+'"]');
const handler=el=>el&&(el.getAttribute('data-onclick')||el.getAttribute('onclick'));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const trace=[];const note=label=>trace.push([label,typeof UI!=='undefined'?UI.view:null,typeof modalOpen!=='undefined'?modalOpen:null,typeof curEv!=='undefined'&&curEv?curEv.title:null]);
async function click(el,label){if(!el)throw Error('missing control: '+label);el.click();await wait(30);note(label);}
async function drain(limit=60){
  for(let i=0;i<limit;i++){
    if(typeof modalOpen==='undefined'||!modalOpen)return;
    const buttons=[...document.querySelectorAll('#mbox .mch button:not(:disabled)')];
    const pick=buttons.find(b=>!/重新开局|新开一局|处死|赐死|废为|留在本月|稍后/.test(b.textContent))||buttons[0];
    if(!pick)throw Error('modal without enabled choice: '+(curEv&&curEv.title));
    const input=document.querySelector('#minput');if(input&&!input.value)input.value='安';
    await click(pick,'modal:'+pick.textContent.trim().slice(0,12));
  }
}
await click(sel("A.newGame()"),'new game');
const form=document.querySelector('.coronation-form');
await click(form.querySelector('button[type=submit]')||form.querySelector('button.gold'),'coronation submit');
await drain();
for(let i=0;i<3;i++){const take=[...document.querySelectorAll('[data-onclick^="A.xxTake("],[onclick^="A.xxTake("]')][0];if(take)await click(take,'take '+handler(take));await drain();}
const end=sel("A.xxEnd()");if(end){await click(end,'selection end');await drain();}
for(let month=0;month<6;month++){
  for(const b of [...document.querySelectorAll('#menu button')]){const h=handler(b);await click(document.querySelector('#menu [data-onclick="'+h+'"],#menu [onclick="'+h+'"]'),'menu '+h);await drain();}
  await click(document.querySelector('#menu [data-onclick="A.go(\'harem\')"],#menu [onclick="A.go(\'harem\')"]'),'harem');
  const link=[...document.querySelectorAll('#panel [data-onclick^="A.go(\'consort\'"],#panel [onclick^="A.go(\'consort\'"]')][month%3];
  if(link){await click(link,'consort '+handler(link));
    for(const prefix of ['A.chat(','A.night(','A.gift(']){const b=[...document.querySelectorAll('#panel button:not(:disabled)')].find(x=>(handler(x)||'').startsWith(prefix));if(b){await click(b,prefix);await drain();break;}}}
  await click(document.querySelector('#menu [data-onclick="A.go(\'log\')"],#menu [onclick="A.go(\'log\')"]'),'log');
  const filter=sel("UI.logF='big';render()");if(filter)await click(filter,'log filter');
  const select=document.querySelector('select[data-onchange],select[onchange]');
  if(select&&select.options.length>1){select.selectedIndex=select.options.length-1;select.dispatchEvent(new Event('change',{bubbles:true}));await wait(30);note('change '+(select.getAttribute('data-onchange')||select.getAttribute('onchange')));}
  await click(document.querySelector('#menu [data-onclick="A.go(\'map\')"],#menu [onclick="A.go(\'map\')"]'),'map');
  const details=document.querySelector('details[data-ontoggle],details[ontoggle]');
  if(details){details.open=!details.open;await wait(60);note('toggle '+(typeof UI!=='undefined'?UI.mapBriefOpen:''));}
  const filterInput=document.querySelector('input[data-oninput],input[oninput]');
  if(filterInput){filterInput.value='承';filterInput.dispatchEvent(new Event('input',{bubbles:true}));await wait(30);note('input');}
  const endMonth=sel('A.finishMonth()');if(endMonth){await click(endMonth,'end month');await drain();}
}
const state=JSON.parse(JSON.stringify(S,(k,v)=>k==='savedAt'||k==='updatedAt'?undefined:v));
return {trace,state:JSON.stringify(state),view:UI.view};`;

async function run(site,{csp,inject='',frames=true,viewport={width:390,height:844,deviceScaleFactor:3,mobile:true},shots=null,label='run',reload=false,target='xhs',intercept=null}){
  const {server,misses,url}=await serve(site,{csp,policy:target==='yiciyuan'?CSP_YC:CSP});
  const browser=await chrome();const {send,on,evaluate}=browser;
  const problems=[];
  on('Runtime.exceptionThrown',p=>problems.push('exception: '+(p.exceptionDetails.exception?.description||p.exceptionDetails.text).split('\n')[0]));
  on('Runtime.consoleAPICalled',p=>{if(p.type==='error')problems.push('console.error: '+p.args.map(a=>a.value??a.description).join(' ').slice(0,200));});
  on('Log.entryAdded',p=>{if(p.entry.level==='error'&&!/favicon/.test(p.entry.url||''))problems.push('log: '+p.entry.text.slice(0,200));});
  on('Network.loadingFailed',p=>{if(!p.canceled)problems.push('request failed: '+p.errorText);});
  on('Network.responseReceived',p=>{if(p.response.status>=400&&!/favicon/.test(p.response.url))problems.push('HTTP '+p.response.status+' '+p.response.url.replace(url,''));});
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
  if(intercept){
    // Answer the external SDK script locally; any other outside request fails the run.
    on('Fetch.requestPaused',p=>{
      const body=p.request.url.startsWith(intercept.url)?intercept.body:null;
      if(body===null){problems.push('outside request: '+p.request.url);send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return;}
      send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/javascript; charset=utf-8'}],body:Buffer.from(body).toString('base64')});
    });
    await send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
  }
  await send('Emulation.setDeviceMetricsOverride',viewport);
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:DETERMINISM+(frames?'':NO_FRAMES)+`document.addEventListener('securitypolicyviolation',e=>console.error('CSP violation',e.violatedDirective,e.blockedURI,e.sourceFile+':'+e.lineNumber));`+inject});
  const open=async()=>{await send('Page.navigate',{url:url+'/index.html'});
    for(let i=0;i<150;i++){await sleep(100);if(await evaluate(`return document.readyState==='complete'&&!!document.querySelector('#panel button')&&!document.getElementById('xhs-boot')&&!document.getElementById('yc-boot')`).catch(()=>false))break;}
    await sleep(500);};
  const shot=async name=>{if(!shots)return;fs.mkdirSync(shots,{recursive:true});const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(shots,name+'.png'),Buffer.from(r.data,'base64'));};
  try{
  await open();await shot(label+'-01-title');
  if(process.env.PROBE){await sleep(2000);console.log(JSON.stringify({problems,misses,panel:await evaluate('return document.body.innerText.slice(0,300)')},null,1));return {trace:[],state:'',problems,misses,extra:{}};}
  const result=await evaluate(SCRIPT);
  await shot(label+'-02-after-script');
  const extra={};
  if(reload&&target==='yiciyuan'){
    extra.page=await evaluate(`
      const out={};
      out.topPadLeft=parseFloat(getComputedStyle(document.querySelector('#top')).paddingLeft);
      out.kind=SaveManager.getStorage()&&SaveManager.getStorage().kind;out.hud=document.querySelector('#top').innerText.slice(0,80);
      A.go('home');await new Promise(r=>setTimeout(r,80));
      out.lockedCards=document.querySelectorAll('.edition-locked').length;
      return out;`);
    extra.saveImage=await evaluate(`A.go('log');await new Promise(r=>setTimeout(r,50));const b=document.querySelector('[data-onclick="A.logCard()"]');if(b)b.click();await new Promise(r=>setTimeout(r,400));const box=document.getElementById('yiciyuan-picture');const ok=!!(box&&box.querySelector('img')&&box.querySelector('img').src.startsWith('data:image/png'));if(box)box.querySelector('button').click();return ok&&!document.getElementById('yiciyuan-picture');`);
    await shot(label+'-03-log');
    // Shop: buy silver and the painter through the confirm step, repaint a consort.
    extra.shop=await evaluate(`
      const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
      out.menu=[...document.querySelectorAll('#menu [data-onclick]')].map(b=>b.getAttribute('data-onclick')).includes("A.go('shop')");
      A.go('shop');await wait(300);
      out.items=[...document.querySelectorAll('.shop-item b')].map(b=>b.textContent);
      out.lockedBefore=PalaceShop.cellOpen(316);
      const before=E().treasury;
      document.querySelector('[data-onclick="A.shopConfirm(\\'silverSmall\\')"]').click();await wait(80);
      document.querySelector('[data-onclick="A.shopBuy(\\'silverSmall\\')"]').click();await wait(600);
      out.silver=E().treasury-before;
      document.querySelector('[data-onclick="A.shopConfirm(\\'painter\\')"]').click();await wait(80);
      document.querySelector('[data-onclick="A.shopBuy(\\'painter\\')"]').click();await wait(600);
      document.querySelector('[data-onclick="A.shopConfirm(\\'legendsPack\\')"]').click();await wait(80);
      document.querySelector('[data-onclick="A.shopBuy(\\'legendsPack\\')"]').click();await wait(600);
      out.owned=['painter','legendsPack'].filter(k=>PalaceShop.owns(k));out.packs=S.flags.portraitPacks;out.lockedAfter=PalaceShop.cellOpen(316);
      const c=S.consorts.find(x=>PalaceShop.repaintable(x));out.consort=!!c;
      if(c){A.go('consort',c.id);await wait(200);const b=document.querySelector('[data-onclick="A.repaint('+c.id+')"]');out.repaintButton=!!b;b.click();await wait(300);
        out.galleryCells=document.querySelectorAll('.shop-cell').length;const pick=[...document.querySelectorAll('.shop-cell')].find(x=>!x.classList.contains('on'));pick.click();await wait(300);out.repainted=c.portraitOverride;out.repaintedId=c.id;}
      return out;`);
    await shot(label+'-03b-repainted');
    if(shots){
      await evaluate(`A.go('shop');await new Promise(r=>setTimeout(r,300));return true;`);await shot(label+'-03c-shop');
      await evaluate(`A.repaint(${JSON.stringify(extra.shop.repaintedId||0)});await new Promise(r=>setTimeout(r,400));return true;`);await shot(label+'-03d-gallery');
      await evaluate(`A.repaintDone();return true;`);
    }
    // 金手指包: buy it, summon a guest whose usual entry condition is unmet (高怀璧 needs
    // a recent victory), and leave the meeting open across the reload below.
    extra.gold=await evaluate(`
      const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
      A.go('shop');await wait(300);
      document.querySelector('[data-onclick="A.shopConfirm(\\'goldFinger\\')"]').click();await wait(80);
      document.querySelector('[data-onclick="A.shopBuy(\\'goldFinger\\')"]').click();await wait(600);
      out.flag=S.flags.goldFinger;out.targets=PalaceShop.summonTargets().map(t=>t.id);
      out.meritReady=fenghuaEntryReady('gaoHuaibi');
      const id=out.targets.includes('fenghua:gaoHuaibi')?'fenghua:gaoHuaibi':out.targets[0];out.summoned=id;
      const b=document.querySelector('[data-onclick="A.goldSummon(\\''+id+'\\')"]');out.button=!!b;b.click();await wait(400);
      out.title=curEv&&curEv.title;out.modal=modalOpen;out.pending=!!S.pendingActions||!!PalaceActions.payload().pendingActions;
      return out;`);
    if(shots)await shot(label+'-03e-summon');
    await evaluate(`await SaveManager.getStorage().flush();return true;`);
    const turn=await evaluate(`return S.turn+':'+S.gen;`);
    const before=await evaluate(`return window.__avg.calls.filter(c=>c[0]==='upload').length;`);
    await open();
    extra.titleSlots=await evaluate(`return [...document.querySelectorAll('[data-onclick^="A.load("]')].map(b=>b.textContent);`);
    await evaluate(`document.querySelector('[data-onclick="A.load(\\'auto\\')"]').click();await new Promise(r=>setTimeout(r,800));return true;`);
    extra.reloaded=await evaluate(`return S&&(S.turn+':'+S.gen);`);
    extra.beforeReload=turn;
    await sleep(800);
    extra.goldAfter=await evaluate(`
      const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={title:curEv&&curEv.title,modal:modalOpen};
      for(let i=0;i<8&&modalOpen;i++){const b=document.querySelector('#modal [data-onclick="choose(0)"]')||document.querySelector('#modal button');if(!b)break;b.click();await wait(300);}
      out.metAfter=!PalaceShop.summonTargets().map(t=>t.id).includes(${JSON.stringify((extra.gold&&extra.gold.summoned)||'')});
      return out;`);
    extra.afterReload=await evaluate(`return {repainted:(S.consorts.find(c=>c.id===${JSON.stringify(extra.shop&&extra.shop.repaintedId)})||{}).portraitOverride,owned:['painter','legendsPack','goldFinger'].filter(k=>PalaceShop.owns(k)),silverDone:window.__avg.values.paid_silverSmall};`);
    await shot(label+'-04-reloaded');
    // 翻牌子 is out of the bottom bar; 后宫 opens it as a pop-up that closes on a choice.
    extra.cards=await evaluate(`
      const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
      out.dock=[...document.querySelectorAll('#menu [data-onclick]')].map(b=>b.getAttribute('data-onclick')).filter(x=>x.includes("'cards'")).length;
      A.go('harem');await wait(200);
      const b=document.querySelector('[data-onclick="A.cardsSheet()"]');out.button=!!b;if(b)b.click();await wait(200);
      const d=document.getElementById('cards-sheet');out.open=!!(d&&d.open);out.pais=d?d.querySelectorAll('.pai').length:0;
      return out;`);
    if(shots)await shot(label+'-05-cards');
    extra.cardsAfter=await evaluate(`
      const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={nights:E().nightsMonth||0};
      const pai=[...document.querySelectorAll('#cards-sheet .pai')].find(x=>!x.disabled);out.enabled=!!pai;
      if(pai){pai.click();await wait(500);}else{document.querySelector('[data-cards-close]').click();await wait(100);}
      out.closed=!document.getElementById('cards-sheet');out.after=modalOpen||(E().nightsMonth||0)>out.nights;
      return out;`);
    if(shots)await shot(label+'-05b-night');
    extra.storage=await evaluate(`const a=window.__avg;return {profiles:a.profiles.map(p=>[p.position,p.profileName,p.isAuto]),uploads:a.calls.filter(c=>c[0]==='upload').length,largestBody:Math.max(...[...a.cdn.values()].map(v=>new Blob([v]).size)),plays:a.calls.filter(c=>c[0]==='logGamePlay').length,inits:a.calls.filter(c=>c[0]==='init').map(c=>c[1]),trapped:window.__trapped};`);
    extra.uploadsBeforeReload=before;
  }else if(reload){
    extra.page=await evaluate(`
      const out={};
      const cs=getComputedStyle(document.querySelector('#top'));out.topPadding=parseFloat(cs.paddingTop);
      out.inset=getComputedStyle(document.documentElement).getPropertyValue('--xhs-top-inset').trim();
      out.kind=SaveManager.getStorage()&&SaveManager.getStorage().kind;out.hud=document.querySelector('#top').innerText.slice(0,80);
      A.go('home');await new Promise(r=>setTimeout(r,80));
      out.lockedCards=document.querySelectorAll('.edition-locked').length;out.openStory=!!document.querySelector('[data-story-consort="ayimu"]');
      const tab=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.trim()==='王朝典藏');if(tab){tab.click();await new Promise(r=>setTimeout(r,80));}
      const chapter=[...document.querySelectorAll('#panel button,#panel a')].find(b=>/剧情妃/.test(b.textContent));if(chapter){chapter.click();await new Promise(r=>setTimeout(r,80));}
      (document.querySelector('.edition-locked')||document.body).scrollIntoView({block:'center'});
      out.visibleLocked=document.querySelectorAll('.edition-locked').length;
      return out;`);
    await shot(label+'-03-codex');
    extra.saveImage=await evaluate(`A.go('log');await new Promise(r=>setTimeout(r,50));const b=document.querySelector('[data-onclick="A.logCard()"]');if(b)b.click();await new Promise(r=>setTimeout(r,400));return window.__xhsCalls.filter(c=>c[0]==='saveImageToPhotosAlbum').length;`);
    await evaluate(`await SaveManager.getStorage().flush();return true;`);
    const turn=await evaluate(`return S.turn+':'+S.gen;`);
    await open();
    extra.titleSlots=await evaluate(`return [...document.querySelectorAll('[data-onclick^="A.load("]')].map(b=>b.textContent);`);
    await evaluate(`document.querySelector('[data-onclick="A.load(\\'auto\\')"]').click();await new Promise(r=>setTimeout(r,800));return true;`);
    extra.reloaded=await evaluate(`return S&&(S.turn+':'+S.gen);`);
    extra.beforeReload=turn;
    await shot(label+'-04-reloaded');
    extra.storage=await evaluate(`return {keys:[...window.__xhsStore.keys()].length,bytes:[...window.__xhsStore.values()].reduce((n,v)=>n+new Blob([v]).size,0),max:Math.max(...[...window.__xhsStore.values()].map(v=>new Blob([v]).size)),trapped:window.__trapped};`);
  }
  return {...result,problems:[...new Set(problems)],misses,extra};
  }catch(error){error.message+='\n'+JSON.stringify({problems:[...new Set(problems)],misses});throw error;}
  finally{browser.close();server.close();}
}

// A simulated Xiaohongshu container: Storage (JSON strings, 1MB per key, 10MB total, iOS
// style data:"" for missing keys), window info with a capsule, album saving.
const XHS_MOCK=`(()=>{
  const store=new Map(),calls=[];window.__xhsStore=store;window.__xhsCalls=calls;window.__trapped=[];
  const bytes=s=>new Blob([s]).size,used=()=>{let n=0;for(const v of store.values())n+=bytes(v);return n;};
  const ok=(api,x={})=>Promise.resolve(Object.assign({errMsg:api+':ok'},x));
  const fail=(api,m)=>Promise.reject({errMsg:api+':fail '+m});
  const miniTool={
    getLaunchOptions:()=>ok('getLaunchOptions',{miniToolEnv:{buildVersion:9553004}}),
    setStorage({key,data}){calls.push(['setStorage',key]);if(typeof data!=='string')return fail('setStorage','data must be string');try{JSON.parse(data);}catch(e){return fail('setStorage','data must be JSON');}
      if(bytes(data)>1024*1024)return fail('setStorage','exceed max size');const old=store.has(key)?bytes(store.get(key)):0;if(used()-old+bytes(data)>10*1024*1024)return fail('setStorage','storage full');store.set(key,data);return ok('setStorage');},
    getStorage({key}){calls.push(['getStorage',key]);return ok('getStorage',{data:store.has(key)?store.get(key):''});},
    getStorageInfo(){calls.push(['getStorageInfo']);return ok('getStorageInfo',{keys:[...store.keys()],usedBytes:used(),limitBytes:10*1024*1024});},
    removeStorage({key}){calls.push(['removeStorage',key]);store.delete(key);return ok('removeStorage');},
    clearStorage(){store.clear();return ok('clearStorage');},
    getWindowInfo(){calls.push(['getWindowInfo']);return ok('getWindowInfo',{pixelRatio:3,screenWidth:390,screenHeight:844,windowWidth:390,windowHeight:844,statusBarHeight:47,screenTop:0,
      safeArea:{left:0,top:47,right:390,bottom:810,width:390,height:763},gestureArea:{left:0,top:0,right:0,bottom:0,width:0,height:0},
      menuButtons:{back:null,me:null,share:null,capsule:{left:296,top:51,right:383,bottom:83,width:87,height:32}}});},
    writeTempFile({data}){calls.push(['writeTempFile',data.slice(0,22)]);return ok('writeTempFile',{filePath:'xhsfile://temp/card.png'});},
    saveImageToPhotosAlbum({filePath}){calls.push(['saveImageToPhotosAlbum',filePath]);return ok('saveImageToPhotosAlbum');}
  };
  window.xhs={miniTool,launchOptions:{miniToolEnv:{buildVersion:9553004}}};
  // Persist the simulated store across reloads of this tab.
  try{const saved=window.name&&JSON.parse(window.name);if(saved&&saved.xhs)for(const [k,v] of saved.xhs)store.set(k,v);}catch(e){}
  addEventListener('pagehide',()=>{window.name=JSON.stringify({xhs:[...store]});});
  const keep=()=>{window.name=JSON.stringify({xhs:[...store]});};setInterval(keep,200);
  for(const name of ['localStorage','sessionStorage','indexedDB','caches']){
    try{Object.defineProperty(window,name,{configurable:true,get(){window.__trapped.push(name);console.error('browser storage touched: '+name);return undefined;}});}catch(e){window.__trapped.push('trap-failed:'+name);}
  }
  try{Object.defineProperty(document,'cookie',{configurable:true,get(){window.__trapped.push('cookie');return '';},set(){window.__trapped.push('cookie');}});}catch(e){}
  const origEval=window.eval;window.eval=function(){window.__trapped.push('eval');return origEval.apply(this,arguments);};
})();`;

// A simulated 易次元 SDK (AvgAIGameSDK 2.0.x surface the game uses): a logged-in player,
// a CDN that keeps uploaded bodies, and 50 profile positions. getProfileList answers []
// on errors, as the real SDK does. State survives reloads of this tab.
const AVG_SDK_MOCK=`(()=>{
  const prior=(()=>{try{const s=window.name&&JSON.parse(window.name);return s&&s.avg||null;}catch(e){return null;}})();
  const cdn=new Map(prior?prior.cdn:[]),profiles=prior?prior.profiles:[],calls=[],paid=prior?prior.paid:{},values=prior?prior.values:{};let nextId=prior?prior.nextId:1,n=cdn.size;
  window.__avg={cdn,profiles,calls,paid,values};
  const keep=()=>{window.name=JSON.stringify({avg:{cdn:[...cdn],profiles,nextId,paid,values}});};setInterval(keep,200);addEventListener('pagehide',keep);
  const later=v=>new Promise(r=>setTimeout(()=>r(v),15));
  window.AvgAIGameSDK={
    init(o){calls.push(['init',o&&o.mode]);},
    async createPlatformContext(){calls.push(['context']);return later({user:{id:'u1',displayName:'测试玩家',nickname:'测试玩家'},gameId:'100001',env:'platform'});},
    async uploadProfile(content){if(typeof content!=='string')throw Error('content must be a string');calls.push(['upload',new Blob([content]).size]);const url='https://file.example/p/'+(++n);cdn.set(url,content);return later(url);},
    async downloadProfile(url){calls.push(['download']);if(!cdn.has(url))throw Error('404');return later(cdn.get(url));},
    async getProfileList(gameId){calls.push(['list']);return later(profiles.map(p=>Object.assign({},p)));},
    async createProfile(gameId,p){calls.push(['create',p.position]);if(!(p.position>=0&&p.position<=49))throw Error('position');if(profiles.some(x=>x.position===p.position))throw Error('position taken');
      profiles.push({id:nextId++,position:p.position,progress:p.progress,screenshot:p.screenshot||'Not Supported',profileName:p.profileName,isAuto:p.isAuto?1:0});return later({});},
    async replaceProfile(gameId,id,p){calls.push(['replace',p.position]);const row=profiles.find(x=>x.id===id);if(!row)throw Error('no profile '+id);Object.assign(row,{position:p.position,progress:p.progress,profileName:p.profileName,isAuto:p.isAuto?1:0});return later({});},
    async logGamePlay(){calls.push(['logGamePlay']);},
    async fetchPaidCount({productId}){calls.push(['paidCount',productId]);return later({count:paid[productId]||0});},
    async purchaseGood({productId,price,count}){calls.push(['purchase',productId,price,count]);paid[productId]=(paid[productId]||0)+1;return later({count:1,cost:{totalCost:price}});},
    async getUserValue(name){return later(values[name]??null);},
    async setUserValue(name,val){calls.push(['setUserValue',name,String(val)]);values[name]=String(val);return later({});},
    openWallet(){calls.push(['openWallet']);}
  };
})();`;

async function main(){
  const [mode,arg1,...rest]=process.argv.slice(2);
  const shots=rest.includes('--shots')?path.resolve(rest[rest.indexOf('--shots')+1]):null;
  if(mode==='equivalence'){
    const old=path.resolve(arg1);
    const a=await run(old,{csp:false,label:'old',shots,frames:false});
    const b=await run(root,{csp:true,label:'new',shots,frames:false});
    const a2=await run(old,{csp:false,label:'old2',frames:false});
    console.log('old run repeated gives the same state:',a.state===a2.state);
    const same=a.state===b.state;
    if(process.env.DUMP){fs.writeFileSync(process.env.DUMP+'.old.json',a.state);fs.writeFileSync(process.env.DUMP+'.new.json',b.state);}
    console.log(JSON.stringify({clicks:a.trace.length,sameTrace:JSON.stringify(a.trace)===JSON.stringify(b.trace),sameState:same,stateBytes:a.state.length,
      oldProblems:a.problems,newProblems:b.problems,steps:process.env.TRACE?b.trace.map(t=>t.join(" | ")):b.trace.slice(-3)},null,1));
    if(!same||JSON.stringify(a.trace)!==JSON.stringify(b.trace)){
      const i=a.trace.findIndex((t,k)=>JSON.stringify(t)!==JSON.stringify(b.trace[k]));console.log('first difference at',i,a.trace[i],b.trace[i]);process.exitCode=1;}
    if(b.problems.length)process.exitCode=1;
    return;
  }
  if(mode==='xhs'){
    const site=path.resolve(arg1||path.join(root,'dist/xhs/package'));
    const r=await run(site,{csp:true,inject:XHS_MOCK,label:'xhs',shots,reload:true});
    console.log(JSON.stringify({clicks:r.trace.length,problems:r.problems,misses:r.misses,extra:r.extra,lastSteps:r.trace.slice(-3)},null,1));
    const e=r.extra;
    if(r.problems.length||r.misses.length||e.storage.trapped.length||e.reloaded!==e.beforeReload||e.page.kind!=='xhs'||!(e.page.topPadding>=83)||!e.saveImage)process.exitCode=1;
    return;
  }
  if(mode==='yiciyuan'){
    const site=path.resolve(arg1||path.join(root,'dist/yiciyuan/package'));
    const trap=XHS_MOCK.slice(XHS_MOCK.indexOf("  for(const name of ['localStorage'"),XHS_MOCK.lastIndexOf('})();'));
    // VIEWPORT=WxH checks another screen, e.g. 1227x899 for the 易次元 web page.
    const vp=/^(\d+)x(\d+)$/.exec(process.env.VIEWPORT||'');
    const r=await run(site,{csp:true,target:'yiciyuan',label:'yiciyuan',shots,reload:true,...(vp?{viewport:{width:+vp[1],height:+vp[2],deviceScaleFactor:1,mobile:false}}:{}),
      inject:`window.__trapped=[];(()=>{${trap}})();`,intercept:{url:SDK_HOST+'/musicst/npm/@avgjs/ai-game-sdk/',body:AVG_SDK_MOCK}});
    console.log(JSON.stringify({clicks:r.trace.length,problems:r.problems,misses:r.misses,extra:r.extra,lastSteps:r.trace.slice(-3)},null,1));
    const e=r.extra;
    const sh=e.shop||{},ar=e.afterReload||{};
    const SILVER_SMALL=JSON.parse(fs.readFileSync(path.join(root,'scripts/yiciyuan-edition.json'),'utf8')).shop.products.find(p=>p.key==='silverSmall').amount;
    const g=e.gold||{},ga=e.goldAfter||{};
    const goldOk=g.flag===true&&g.button&&g.modal&&!!g.title&&(g.summoned!=='fenghua:gaoHuaibi'||g.meritReady===false)&&ga.title===g.title&&ga.metAfter===true;
    if(!goldOk)console.log('gold finger check failed');
    const c=e.cards||{},ca=e.cardsAfter||{};
    const cardsOk=c.dock===0&&c.button&&c.open&&c.pais>0&&ca.closed&&(!ca.enabled||ca.after);
    if(!cardsOk)console.log('cards sheet check failed');
    const shopOk=goldOk&&cardsOk&&sh.menu&&sh.items.length===5&&sh.lockedBefore===false&&sh.silver===SILVER_SMALL&&sh.owned.length===2&&sh.lockedAfter===true&&sh.repaintButton&&sh.galleryCells>0&&Number.isInteger(sh.repainted)&&ar.repainted===sh.repainted&&ar.owned.length===3&&ar.silverDone==='1';
    if(!shopOk)console.log('shop check failed');
    if(!shopOk||r.problems.length||r.misses.length||e.storage.trapped.length||e.reloaded!==e.beforeReload||e.page.kind!=='avg'||!(e.page.topPadLeft>=52)||e.page.lockedCards||!e.saveImage||!e.storage.plays||e.storage.inits.join()!=='production')process.exitCode=1;
    return;
  }
  if(mode==='nojs'){
    const site=path.resolve(arg1||path.join(root,'dist/xhs/package'));
    const {server,url}=await serve(site,{csp:true});const browser=await chrome();
    await browser.send('Page.enable');await browser.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
    await browser.send('Emulation.setScriptExecutionDisabled',{value:true});
    await browser.send('Page.navigate',{url:url+'/index.html'});await sleep(1500);
    const r=await browser.send('Page.captureScreenshot',{format:'png'});fs.mkdirSync(shots,{recursive:true});fs.writeFileSync(path.join(shots,'nojs-first-screen.png'),Buffer.from(r.data,'base64'));
    const text=(await browser.send('Runtime.evaluate',{expression:'document.body.innerText',returnByValue:true})).result.value;
    console.log(JSON.stringify({firstScreen:text.slice(0,120)}));
    browser.close();server.close();
    if(!/宸宫纪/.test(text)||!/正在准备/.test(text))process.exitCode=1;
    return;
  }
  console.error('usage: equivalence <old-site> | xhs [package] | yiciyuan [package] | nojs [package] --shots DIR');process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
