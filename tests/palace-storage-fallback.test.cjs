// In-app WebViews (TapTap H5 among them) may lack IndexedDB or abort its writes.
// Saves then move to the host's key-value storage, or localStorage, after a probe.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const {boot}=require('./playtest-harness.cjs');
const KEY='chengongji_v1_auto';
const source=fs.readFileSync(require.resolve('../js/palace-storage.js'),'utf8');

// TapTap documents 1MB per key and 10MB in total for tap.setStorageSync.
function fakeTap({perKey=1024*1024,total=10*1024*1024}={}){
  const data=new Map(),bytes=v=>Buffer.byteLength(String(v));
  const used=()=>{let n=0;for(const [k,v] of data)n+=bytes(k)+bytes(v);return n;};
  return {data,
    getStorageSync:key=>data.has(key)?data.get(key):'',
    setStorageSync(key,value){
      if(bytes(value)>perKey)throw Object.assign(Error('setStorageSync:fail exceed max size'),{errMsg:'setStorageSync:fail exceed max size'});
      const old=data.has(key)?bytes(key)+bytes(data.get(key)):0;
      if(used()-old+bytes(key)+bytes(value)>total)throw Object.assign(Error('setStorageSync:fail storage full'),{errMsg:'setStorageSync:fail storage full'});
      data.set(key,value);
    },
    removeStorageSync:key=>{data.delete(key);}};
}
function memoryLocal(initial=[]){
  const data=new Map(initial);
  return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{data.set(k,String(v));},removeItem:k=>{data.delete(k);}};
}
async function storage(globals){
  const context=vm.createContext({setTimeout,clearTimeout,console:{...console,warn(){}},...globals});
  vm.runInContext(source,context);
  const store=await vm.runInContext('PalaceStorage.init()',context);
  return {store,context,error:vm.runInContext('PalaceStorage.startupError',context)};
}
async function withAbortingWrites(fn){
  const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(){throw new DOMException('write refused','UnknownError');};
  try{return await fn();}finally{IDBObjectStore.prototype.put=put;}
}

test('an IndexedDB that opens but refuses writes hands saves to TapTap storage before play starts',async()=>{
  const tap=fakeTap();
  const {store,error}=await withAbortingWrites(()=>storage({indexedDB:new IDBFactory(),tap,localStorage:memoryLocal()}));
  assert.equal(store.kind,'tap');assert.equal(error,null);
  store.setItem(KEY,'first reign');assert.equal(await store.flush(),true);
  const again=await storage({tap,localStorage:memoryLocal()});
  assert.equal(again.store.getConfirmedItem(KEY),'first reign');
});

test('a long reign larger than one TapTap key is chunked and read back byte for byte',async()=>{
  const tap=fakeTap(),raw='人物纪事·'.repeat(250000);
  const {store}=await storage({tap});
  store.setItem(KEY,raw);assert.equal(await store.flush(),true);
  assert.ok([...tap.data.keys()].filter(k=>k.startsWith('cgj:'+KEY+'#')).length>1,'the save should span several keys');
  for(const v of tap.data.values())assert.ok(Buffer.byteLength(v)<=1024*1024);
  store.setItem(KEY,'shorter');assert.equal(await store.flush(),true);
  assert.equal([...tap.data.keys()].filter(k=>k.startsWith('cgj:'+KEY+'#')).length,1,'chunks of the replaced copy are released');
  assert.equal((await storage({tap})).store.getConfirmedItem(KEY),'shorter');
});

test('a full TapTap store keeps the previous save and reports quota',async()=>{
  const tap=fakeTap({total:900000});
  const {store}=await storage({tap});
  store.setItem(KEY,'kept');assert.equal(await store.flush(),true);
  store.commit([['chengongji_v1_before-import','x'.repeat(200000)],[KEY,'y'.repeat(800000)]]);
  assert.equal(await store.flush(),false);
  assert.match(store.error.errMsg,/storage full/);
  const again=(await storage({tap})).store;
  assert.equal(again.getConfirmedItem(KEY),'kept');assert.equal(again.getConfirmedItem('chengongji_v1_before-import'),null);
});

test('an IndexedDB that refuses writes falls back to a localStorage that reads back',async()=>{
  const local=memoryLocal([[KEY,'legacy reign']]);
  const {store,error}=await withAbortingWrites(()=>storage({indexedDB:new IDBFactory(),localStorage:local}));
  assert.equal(store,null,'SaveManager uses localStorage directly');assert.equal(error,null);
  assert.deepEqual([...local.data.keys()],[KEY],'the probe leaves nothing behind');
});

test('a localStorage that writes but cannot read back is not trusted',async()=>{
  const local=memoryLocal();local.getItem=()=>null;
  const {store,error}=await storage({localStorage:local});
  assert.equal(store,null);assert.equal(error.name,'StorageUnavailableError');
  const broken=await withAbortingWrites(()=>storage({indexedDB:new IDBFactory(),localStorage:local}));
  assert.equal(broken.store,null);assert.equal(broken.error.name,'UnknownError');
});

test('legacy localStorage slots carry over into TapTap storage without being removed',async()=>{
  const tap=fakeTap(),local=memoryLocal([[KEY,'legacy reign'],['chengongji_v1_2','manual']]);
  const {store}=await storage({tap,localStorage:local});
  assert.equal(store.getConfirmedItem(KEY),'legacy reign');assert.equal(store.getConfirmedItem('chengongji_v1_2'),'manual');
  assert.equal(local.data.get(KEY),'legacy reign');
});

test('another tab blocking the database is reported instead of silently switching stores',async()=>{
  const tap=fakeTap();
  const blocked={open(){const request={};setTimeout(()=>request.onblocked(),0);return request;}};
  const {store,error}=await storage({indexedDB:blocked,tap});
  assert.equal(store,null);assert.match(error.message,/另一个标签页/);assert.equal(tap.data.size,0);
});

test('a reign started inside the TapTap host autosaves without a warning and loads again',async()=>{
  const tap=fakeTap();
  const w=boot(202,new Map());Object.assign(w.ctx,{indexedDB:undefined,tap,setTimeout,clearTimeout});
  await w.run('PalaceStorage.init()');w.run('connectPalaceStorage()');
  assert.equal(w.run('PalaceStorage.store.kind'),'tap');
  w.run('A.start();drain();');assert.equal(await w.run('PalaceStorage.store.flush()'),true);
  assert.equal(w.run('lastAutoSaveError'),'');
  w.run('A.endMonth();drain()');assert.equal(await w.run('PalaceStorage.store.flush()'),true);
  const turn=w.run('S.turn'),name=w.run('E().name');
  const n=boot(7,new Map());Object.assign(n.ctx,{indexedDB:undefined,tap,setTimeout,clearTimeout});
  await n.run('PalaceStorage.init()');
  assert.equal(n.run("load('auto')"),true);assert.equal(n.run('S.turn'),turn);assert.equal(n.run('E().name'),name);
});
