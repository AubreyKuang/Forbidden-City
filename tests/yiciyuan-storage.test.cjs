// 易次元 build: saves go to the platform's cloud profiles through AvgAIGameSDK (upload
// the body to the CDN, then create or replace the key's profile position). Browser
// storage is never used, and a store whose profile list cannot be trusted is switched off.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const editionSource=read('js/edition.js'),storageSource=read('js/palace-storage.js'),compressSource=read('js/save-compress.js');
const KEY='chengongji_v1_auto',SLOT1='chengongji_v1_1';

function fakeSdk({loggedIn=true,listFails=false,uploadFails=false,missing=[]}={}){
  const cdn=new Map(),profiles=[],calls=[];let id=1,n=0;
  const sdk={
    init(o){calls.push(['init',o.mode]);},
    async createPlatformContext(){calls.push(['context']);if(!loggedIn)throw Error('not logged in');return {user:{id:'u'},gameId:'42',env:'platform'};},
    async uploadProfile(content){calls.push(['upload',content.length]);if(uploadFails)throw Error('network');assert.equal(typeof content,'string');const url='cdn/'+(++n);cdn.set(url,content);return url;},
    async downloadProfile(url){calls.push(['download',url]);if(!cdn.has(url))throw Error('404');return cdn.get(url);},
    // The real SDK answers [] when the request fails.
    async getProfileList(gameId){calls.push(['list']);assert.equal(gameId,'42');return listFails?[]:profiles.map(p=>({...p}));},
    async createProfile(gameId,p){calls.push(['create',p.position]);assert.ok(!profiles.some(x=>x.position===p.position),'position '+p.position+' created twice');profiles.push({id:id++,...p,isAuto:p.isAuto?1:0});return {};},
    async replaceProfile(gameId,pid,p){calls.push(['replace',p.position]);const row=profiles.find(x=>x.id===pid);assert.ok(row,'replace an existing profile');Object.assign(row,p,{isAuto:p.isAuto?1:0});return {};},
    logGamePlay(){calls.push(['play']);}
  };
  for(const name of missing)delete sdk[name];
  return {sdk,cdn,profiles,calls,set listFails(v){listFails=v;}};
}
const forbidden=name=>new Proxy({},{get(){throw Error(name+' must not be used in the yiciyuan build');}});
async function open(sdk){
  const context=vm.createContext({setTimeout,clearTimeout,console:{...console,warn(){}},
    PALACE_EDITION_CONFIG:{edition:'yiciyuan',features:{browserStorage:false,saveExport:false,saveBackups:false},saveSnapshots:1},
    localStorage:forbidden('localStorage'),sessionStorage:forbidden('sessionStorage'),indexedDB:forbidden('indexedDB'),AvgAIGameSDK:sdk});
  vm.runInContext(editionSource,context);vm.runInContext(compressSource,context);vm.runInContext(storageSource,context);
  const store=await vm.runInContext('PalaceStorage.init()',context);
  return {store,error:vm.runInContext('PalaceStorage.startupError',context)};
}
const body=(host,position)=>JSON.parse(host.cdn.get(host.profiles.find(p=>p.position===position).progress));

test('a save is uploaded to its profile position and read back after reopening',async()=>{
  const host=fakeSdk();
  const {store,error}=await open(host.sdk);
  assert.equal(error,null);assert.equal(store.kind,'avg');
  assert.deepEqual(host.calls.find(c=>c[0]==='init'),['init','production']);
  store.setItem(KEY,'{"turn":3}');assert.equal(await store.flush(),true);
  const auto=host.profiles.find(p=>p.position===0);
  assert.equal(auto.profileName,'自动存档');assert.equal(auto.isAuto,1);
  store.setItem(SLOT1,'{"turn":4}');assert.equal(await store.flush(),true);
  assert.equal(host.profiles.find(p=>p.position===3).profileName,'存档1');
  const again=await open(host.sdk);
  assert.equal(again.store.getConfirmedItem(KEY),'{"turn":3}');
  assert.equal(again.store.getConfirmedItem(SLOT1),'{"turn":4}');
  // A second save of the same key replaces its profile instead of creating another.
  again.store.setItem(KEY,'{"turn":5}');assert.equal(await again.store.flush(),true);
  assert.equal(host.profiles.filter(p=>p.position===0).length,1);
  assert.equal((await open(host.sdk)).store.getConfirmedItem(KEY),'{"turn":5}');
});

test('long saves are compressed and restored byte for byte',async()=>{
  const host=fakeSdk(),raw=JSON.stringify({log:'人物纪事·"引号"\\n'.repeat(140000)});
  const {store}=await open(host.sdk);
  store.setItem(KEY,raw);assert.equal(await store.flush(),true);
  const stored=body(host,0);
  assert.equal(stored.z,1);assert.ok(host.cdn.get(host.profiles.find(p=>p.position===0).progress).length<raw.length/4);
  assert.equal((await open(host.sdk)).store.getConfirmedItem(KEY),raw);
});

test('saves queued during an upload go up together, once per key',async()=>{
  const host=fakeSdk();
  const {store}=await open(host.sdk);
  const before=host.calls.filter(c=>c[0]==='upload').length;
  for(let i=0;i<6;i++)store.setItem(KEY,`{"turn":${i}}`);
  assert.equal(await store.flush(),true);
  const uploads=host.calls.filter(c=>c[0]==='upload').length-before;
  assert.ok(uploads<=2,'uploads: '+uploads);
  assert.equal((await open(host.sdk)).store.getConfirmedItem(KEY),'{"turn":5}');
});

test('a removed key is replaced by an empty marker and reads as no save',async()=>{
  const host=fakeSdk();
  const {store}=await open(host.sdk);
  store.setItem(SLOT1,'{"a":1}');assert.equal(await store.flush(),true);
  store.removeItem(SLOT1);assert.equal(await store.flush(),true);
  assert.equal(body(host,3).empty,1);
  assert.equal((await open(host.sdk)).store.getConfirmedItem(SLOT1),null);
});

test('an unreadable position is skipped; the others still load',async()=>{
  const host=fakeSdk();
  const {store}=await open(host.sdk);
  store.setItem(KEY,'{"a":1}');store.setItem(SLOT1,'{"b":2}');assert.equal(await store.flush(),true);
  host.cdn.set(host.profiles.find(p=>p.position===3).progress,'not json');
  const again=await open(host.sdk);
  assert.equal(again.error,null);
  assert.equal(again.store.getConfirmedItem(KEY),'{"a":1}');assert.equal(again.store.getConfirmedItem(SLOT1),null);
});

test('an empty profile list after saves stops the write instead of creating duplicates',async()=>{
  const host=fakeSdk();
  const {store}=await open(host.sdk);
  store.setItem(KEY,'{"a":1}');assert.equal(await store.flush(),true);
  host.listFails=true;
  store.setItem(KEY,'{"a":2}');assert.equal(await store.flush(),false);
  assert.equal(host.profiles.filter(p=>p.position===0).length,1);
  host.listFails=false;
  store.setItem(KEY,'{"a":3}');assert.equal(await store.flush(),true);
  assert.equal((await open(host.sdk)).store.getConfirmedItem(KEY),'{"a":3}');
});

for(const [name,options,pattern] of [
  ['no SDK on the page',null,/没有连上易次元平台/],
  ['SDK without profile calls',{missing:['replaceProfile']},/接口不完整/],
  ['a list that cannot be read',{listFails:true},/云存档暂时无法写入/],
  ['uploads failing',{uploadFails:true},/云存档暂时无法写入/],
  ['player not logged in',{loggedIn:false},/云存档暂时无法读取/]
])test(`${name}: saving is switched off with a message, never moved to browser storage`,async()=>{
  const host=options&&fakeSdk(options);
  const {store,error}=await open(host?host.sdk:undefined);
  assert.equal(store,null);
  assert.equal(error.name,'StorageUnavailableError');
  assert.match(error.message,pattern);
});
