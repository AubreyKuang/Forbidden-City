// Xiaohongshu mini-tool build: saves go only through window.xhs.miniTool Storage
// (async, JSON-string data, 1MB per key, 10MB per tool). Browser storage is never used,
// even when the container store is missing, too old, failing or full.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const editionSource=read('js/edition.js'),storageSource=read('js/palace-storage.js'),compressSource=read('js/save-compress.js');
const KEY='chengongji_v1_auto';
const bytes=v=>Buffer.byteLength(String(v));

function fakeMiniTool({perKey=1024*1024,total=10*1024*1024,ios=false,buildVersion=9532004,missing=[],failOn=null,corruptReads=false,launchAsync=false}={}){
  const data=new Map(),calls=[];
  const used=()=>{let n=0;for(const [k,v] of data)n+=bytes(v);return n;};
  const ok=(api,extra={})=>Promise.resolve({errMsg:api+':ok',...extra});
  const fail=(api,msg,code)=>Promise.reject(Object.assign(Error(api+':fail '+msg),{errMsg:api+':fail '+msg,errCode:code}));
  const mt={
    setStorage({key,data:value}){
      calls.push(['set',key]);
      if(failOn==='set')return fail('setStorage','internal error',2999);
      if(typeof value!=='string')return fail('setStorage','data must be string');
      JSON.parse(value); // the container only accepts JSON strings
      if(bytes(value)>perKey)return fail('setStorage','exceed max size');
      const old=data.has(key)?bytes(data.get(key)):0;
      if(used()-old+bytes(value)>total)return fail('setStorage','storage full');
      data.set(key,value);return ok('setStorage');
    },
    getStorage({key}){
      calls.push(['get',key]);
      if(failOn==='get')return fail('getStorage','internal error',2999);
      if(!data.has(key))return ios?ok('getStorage',{data:''}):fail('getStorage','data not found');
      const v=data.get(key);return ok('getStorage',{data:corruptReads?v.slice(0,-1)+' ':v});
    },
    getStorageInfo(){calls.push(['info']);if(failOn==='info')return fail('getStorageInfo','internal error');return ok('getStorageInfo',{keys:[...data.keys()],usedBytes:used(),limitBytes:total});},
    removeStorage({key}){calls.push(['remove',key]);data.delete(key);return ok('removeStorage');},
    clearStorage(){data.clear();return ok('clearStorage');}
  };
  for(const name of missing)delete mt[name];
  const xhs={miniTool:mt};
  if(launchAsync)mt.getLaunchOptions=()=>Promise.resolve({miniToolEnv:{buildVersion}});
  else if(buildVersion!==null)xhs.launchOptions={miniToolEnv:{buildVersion}};
  return {xhs,data,calls,used};
}
// Browser stores that fail the test if touched at all.
const forbidden=name=>new Proxy({},{get(){throw Error(name+' must not be used in the xhs build');}});
async function open(xhs,{edition='xhs'}={}){
  const context=vm.createContext({setTimeout,clearTimeout,console:{...console,warn(){}},
    PALACE_EDITION_CONFIG:{edition,features:{browserStorage:false,saveExport:false}},
    localStorage:forbidden('localStorage'),sessionStorage:forbidden('sessionStorage'),indexedDB:forbidden('indexedDB'),xhs});
  vm.runInContext(editionSource,context);vm.runInContext(compressSource,context);vm.runInContext(storageSource,context);
  const store=await vm.runInContext('PalaceStorage.init()',context);
  return {store,error:vm.runInContext('PalaceStorage.startupError',context),context};
}

test('a save is written to container Storage, read back, and survives reopening',async()=>{
  const host=fakeMiniTool();
  const {store,error}=await open(host.xhs);
  assert.equal(error,null);assert.equal(store.kind,'xhs');
  store.setItem(KEY,'{"turn":3}');assert.equal(await store.flush(),true);
  assert.ok([...host.data.keys()].every(k=>k.startsWith('cgx:')),'only the game prefix is written');
  for(const v of host.data.values())JSON.parse(v);
  // Every set is followed by a read of the same key (read-back verification).
  const sets=host.calls.map((c,i)=>[c,i]).filter(([c])=>c[0]==='set');
  for(const [[,key],i] of sets)assert.ok(host.calls.slice(i+1).some(c=>c[0]==='get'&&c[1]===key),'read back '+key);
  const again=await open(host.xhs);
  assert.equal(again.store.getConfirmedItem(KEY),'{"turn":3}');
});

test('a reign larger than one key is split under 1MB per key and restored byte for byte',async()=>{
  const host=fakeMiniTool(),raw=JSON.stringify({log:'人物纪事·"引号"\\n'.repeat(140000)});
  assert.ok(bytes(raw)>2*1024*1024);
  const {store}=await open(host.xhs);
  store.setItem(KEY,raw);assert.equal(await store.flush(),true);
  const chunks=[...host.data.keys()].filter(k=>k.startsWith('cgx:'+KEY+'#'));
  assert.ok(chunks.length>=1);
  for(const v of host.data.values())assert.ok(bytes(v)<=1024*1024);
  assert.equal((await open(host.xhs)).store.getConfirmedItem(KEY),raw);
  // Long saves are stored compressed: far fewer bytes than the raw JSON.
  assert.equal(JSON.parse(host.data.get('cgx:'+KEY)).z,1);
  assert.ok(host.used()<bytes(raw)/4,'compressed '+host.used()+' of '+bytes(raw));
  store.setItem(KEY,'short');assert.equal(await store.flush(),true);
  assert.equal([...host.data.keys()].filter(k=>k.startsWith('cgx:'+KEY+'#')).length,1,'old chunks are released');
});

test('text that does not compress is split raw across several keys under 1MB each',async()=>{
  const host=fakeMiniTool();
  let seed=3;const noise=n=>{let s='';for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;s+=String.fromCharCode(0x4e00+seed%20000);}return s;};
  const raw=JSON.stringify({a:noise(700000)});
  const {store}=await open(host.xhs);
  store.setItem(KEY,raw);assert.equal(await store.flush(),true);
  assert.ok([...host.data.keys()].filter(k=>k.startsWith('cgx:'+KEY+'#')).length>2,'several chunks');
  for(const v of host.data.values())assert.ok(bytes(v)<=1024*1024);
  assert.equal((await open(host.xhs)).store.getConfirmedItem(KEY),raw);
});

test('iOS answers a missing key with data:"" and that reads as no save',async()=>{
  const host=fakeMiniTool({ios:true});
  const {store,error}=await open(host.xhs);
  assert.equal(error,null);assert.equal(store.getConfirmedItem(KEY),null);
  store.setItem(KEY,'{"a":1}');assert.equal(await store.flush(),true);
  assert.equal((await open(host.xhs)).store.getConfirmedItem(KEY),'{"a":1}');
});

test('version is read from getLaunchOptions when launchOptions is not injected',async()=>{
  const host=fakeMiniTool({launchAsync:true});
  const {store,error}=await open(host.xhs);
  assert.equal(error,null);assert.equal(store.kind,'xhs');
});

for(const [name,options,pattern] of [
  ['no xhs container',null,/未检测到小红书容器/],
  ['Storage methods missing',{missing:['getStorageInfo']},/不支持本机存储/],
  ['unknown client version',{buildVersion:null},/无法确认客户端版本/],
  ['client older than 9.46',{buildVersion:9452001},/9\.46/],
  ['writes failing',{failOn:'set'},/暂时无法写入/],
  ['reads returning other bytes',{corruptReads:true},/暂时无法写入/],
  ['a full store',{total:40},/空间不足/]
])test(`${name}: saving is switched off with a message, never moved to browser storage`,async()=>{
  const host=options&&fakeMiniTool(options);
  const {store,error}=await open(host?host.xhs:undefined);
  assert.equal(store,null);
  assert.equal(error.name,'StorageUnavailableError');
  assert.match(error.message,/^当前无法存档/);assert.match(error.message,pattern);
});

test('when the store fills during play the previous save is kept and the error is a quota error',async()=>{
  const host=fakeMiniTool({total:1200*1024});
  const {store}=await open(host.xhs);
  // Pseudo-random text barely compresses, so it really fills the store.
  let seed=7;const noise=n=>{let s='';for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;s+=String.fromCharCode(0x4e00+seed%20000);}return s;};
  store.setItem(KEY,JSON.stringify({a:noise(60000)}));assert.equal(await store.flush(),true);
  const before=store.getConfirmedItem(KEY);
  store.setItem(KEY,JSON.stringify({a:noise(400000)}));assert.equal(await store.flush(),false);
  assert.equal(store.error.name,'QuotaExceededError');
  assert.equal(store.getConfirmedItem(KEY),before);
  assert.equal((await open(host.xhs)).store.getConfirmedItem(KEY),before);
});

test('the web and TapTap builds never select the xhs store',async()=>{
  // Without an xhs edition the container object is ignored (here no other store exists).
  const host=fakeMiniTool();
  const context=vm.createContext({setTimeout,clearTimeout,console:{...console,warn(){}},xhs:host.xhs});
  vm.runInContext(editionSource,context);vm.runInContext(storageSource,context);
  assert.equal(vm.runInContext('PalaceStorage.init()',context),null);
  assert.equal(host.calls.length,0);
});

test('game code in the xhs edition reaches no browser storage while saving is off',()=>{
  const {boot}=require('./playtest-harness.cjs');
  const touched=[];
  const trap=name=>new Proxy({},{get(_,k){touched.push(name+'.'+String(k));return ()=>null;}});
  const b=boot(77,new Map(),{PALACE_EDITION_CONFIG:{edition:'xhs',features:{browserStorage:false,saveExport:false}},localStorage:trap('localStorage'),sessionStorage:trap('sessionStorage')});
  b.run(`A.start();drain();for(let i=0;i<6;i++){A.endMonth();drain();}save('auto');save('1');A.downloadSave();`);
  assert.equal(b.run(`SaveManager.getStorage()`),null);
  assert.match(b.run(`palaceSaveError('auto')`),/当前无法存档/);
  assert.doesNotMatch(b.run(`viewSys()`),/下载备份|downloadSave|readSaveFile|type="file"/);
  assert.deepEqual(touched,[]);
});

test('when space runs out the rewind point gives way to the playable save',async()=>{
  const host=fakeMiniTool({total:1300*1024});
  let seed=11;const noise=n=>{let s='';for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;s+=String.fromCharCode(0x4e00+seed%20000);}return s;};
  const {store}=await open(host.xhs);
  const snapKey=KEY+':snapshots';
  store.setItem(snapKey,JSON.stringify([{raw:noise(150000)}]));assert.equal(await store.flush(),true);
  store.setItem(KEY,JSON.stringify({a:noise(100000)}));assert.equal(await store.flush(),true);
  const next=JSON.stringify({a:noise(230000)});
  store.commit([[KEY,next]],{reclaim:[[snapKey,'[]']]});
  assert.equal(await store.flush(),true);
  assert.equal(store.getConfirmedItem(KEY),next);
  assert.equal(store.getConfirmedItem(snapKey),'[]');
  assert.equal((await open(host.xhs)).store.getConfirmedItem(KEY),next);
});
