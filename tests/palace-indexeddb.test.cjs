const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const {boot}=require('./playtest-harness.cjs');
const KEY='chengongji_v1_auto';
const source=fs.readFileSync(require.resolve('../js/palace-storage.js'),'utf8');
async function storage(factory=new IDBFactory(),legacy=new Map(),extra={}){
 const context=vm.createContext({indexedDB:factory,localStorage:{getItem:key=>legacy.get(key)??null},setTimeout,clearTimeout,console,...extra});
 vm.runInContext(source,context);const store=await vm.runInContext('PalaceStorage.init()',context);return {store,context,factory,legacy};
}
async function world(factory=new IDBFactory(),legacy=new Map()){
 const w=boot(202,legacy);w.ctx.indexedDB=factory;w.ctx.clearTimeout=clearTimeout;w.ctx.setTimeout=setTimeout;
 await w.run('PalaceStorage.init()');w.run('connectPalaceStorage()');return w;
}
test('legacy auto, manual, backups, snapshots, pre-import and dev slots migrate byte for byte without deleting originals',async()=>{
 const legacy=new Map([[KEY,'auto'],[KEY+':backup','backup'],[KEY+':snapshots','snapshots'],['chengongji_v1_1','manual'],['chengongji_v1_before-import','before'],['chengongji_dev_v1_auto','dev'],['chengongji_dev_v1_dev-backup','dev-before'],['other-game','unrelated']]);
 const {store}=await storage(undefined,legacy);
 for(const [key,value] of legacy)assert.equal(store.getConfirmedItem(key),key==='other-game'?null:value);
 assert.equal(legacy.size,8);
});
test('opening again never replaces a newer database save with a stale localStorage copy',async()=>{
 const a=await storage(undefined,new Map([[KEY,'old']]));a.store.setItem(KEY,'new');assert.equal(await a.store.flush(),true);
 const b=await storage(a.factory,a.legacy);assert.equal(b.store.getConfirmedItem(KEY),'new');assert.equal(a.legacy.get(KEY),'old');
});
test('full or denied localStorage does not block a database save larger than its former quota',async()=>{
 const {store,factory}=await storage(undefined,undefined,{localStorage:{getItem(){throw new DOMException('denied','SecurityError');}}});
 const raw='人物纪事'.repeat(1600000);store.setItem(KEY,raw);assert.equal(store.getConfirmedItem(KEY),null);assert.equal(store.pendingKey(KEY),true);assert.equal(await store.flush(),true);
 const next=await storage(factory);assert.equal(next.store.getConfirmedItem(KEY),raw);
});
test('queued writes settle in order; only committed bytes are reported saved',async()=>{
 const {store}=await storage();for(let n=0;n<30;n++)store.setItem(KEY,String(n));
 assert.equal(store.getConfirmedItem(KEY),null);assert.equal(store.getItem(KEY),'29');assert.equal(await store.flush(),true);assert.equal(store.getConfirmedItem(KEY),'29');
});
test('simultaneous tabs cannot overwrite each other; reload explicitly accepts the winner',async()=>{
 const a=await storage(),b=await storage(a.factory);a.store.setItem(KEY,'first');b.store.setItem(KEY,'second');
 assert.deepEqual(await Promise.all([a.store.flush(),b.store.flush()]),[true,false]);assert.equal(b.store.hasConflict(KEY),true);
 assert.equal((await storage(a.factory)).store.getItem(KEY),'first');await b.store.refresh();b.store.setItem(KEY,'accepted after reload');assert.equal(await b.store.flush(),true);
});
test('a synchronous write exception aborts the entire backup/import transaction and all queued successors',async()=>{
 const a=await storage(undefined,new Map([[KEY,'old'],['chengongji_v1_before-import','older']]));
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key===KEY)throw new DOMException('quota','QuotaExceededError');return put.call(this,value,key);};
 try{
  a.store.commit([['chengongji_v1_before-import','replacement'],[KEY,'failed']]);a.store.setItem('chengongji_v1_1','discarded');assert.equal(await a.store.flush(),false);
 }finally{IDBObjectStore.prototype.put=put;}
 const next=await storage(a.factory);assert.equal(next.store.getItem(KEY),'old');assert.equal(next.store.getItem('chengongji_v1_before-import'),'older');assert.equal(next.store.getItem('chengongji_v1_1'),null);
 a.store.setItem(KEY,'retry');assert.equal(await a.store.flush(),true);assert.equal(a.store.getConfirmedItem(KEY),'retry');
});
test('a failed migration retains every legacy slot and reports a startup error',async()=>{
 const legacy=new Map([[KEY,'original']]);const fake={open(){const request={};setTimeout(()=>{request.error=new DOMException('denied','SecurityError');request.onerror();},0);return request;}};
 const result=await storage(fake,legacy);assert.equal(result.store,null);assert.equal(legacy.get(KEY),'original');assert.equal(vm.runInContext('PalaceStorage.startupError.name',result.context),'SecurityError');
});
test('disposable public galleries never open a database or inspect player saves',async()=>{
 let calls=0;const r=await storage({open(){calls++;throw Error('unsafe');}},undefined,{PALACE_DISPOSABLE_STORAGE:true});assert.equal(r.store,null);assert.equal(calls,0);
});
test('real month actions save pending and finished scenes, then reload through IndexedDB',async()=>{
 const factory=new IDBFactory(),w=await world(factory);w.run('A.start();drain();');await w.run('PalaceStorage.store.flush()');
 for(let month=1;month<=3;month++){
  w.run('A.endMonth()');assert.equal(w.run('autoSaveStatusText()'),'正在写入自动存档…');assert.equal(w.run('lastAutoSaveInfo.turn'),month-1);assert.equal(await w.run('PalaceStorage.store.flush()'),true);
  const n=await world(factory);await n.run("A.load('auto')");assert.equal(n.run('S.turn'),month);assert.equal(n.run('PalaceActions.blocked'),false);assert.equal(n.run('curEv?.title'),w.run('curEv?.title'));
  w.run('drain()');assert.equal(await w.run('PalaceStorage.store.flush()'),true);assert.equal(w.run('autoSaveStatusText()'),'本月已自动保存');
 }
});
test('database failure cannot display saved success and retry persists the complete live progress',async()=>{
 const w=await world();w.run('A.start();drain();');await w.run('PalaceStorage.store.flush()');const before=w.run('PalaceStorage.store.getConfirmedItem(SKEY+"auto")');
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError');};
 try{w.run('A.endMonth();drain()');assert.equal(await w.run('PalaceStorage.store.flush()'),false);}finally{IDBObjectStore.prototype.put=put;}
 assert.equal(w.run('PalaceStorage.store.getConfirmedItem(SKEY+"auto")'),before);assert.equal(w.run('autoSaveStatusText()'),'自动存档未写入');assert.match(w.run('lastAutoSaveError'),/空间不足/);assert.equal(w.run('S.turn'),1);
 w.run("A.save('auto')");assert.equal(await w.run('PalaceStorage.store.flush()'),true);assert.equal(w.run('lastAutoSaveInfo.turn'),1);assert.equal(w.run('lastAutoSaveError'),'');
});
test('large file imports preserve the previous world atomically and allow undo',async()=>{
 const w=await world();w.run('A.start();drain()');await w.run('PalaceStorage.store.flush()');const old=w.run('E().name');
 const data=JSON.parse(w.run('JSON.stringify(PalaceActions.payload())'));data.emp.name='新皇';data.flags.testArchive='纪事'.repeat(4500000);w.ctx.imported=JSON.stringify(data);
 assert.equal(w.run('importPalaceFileText(imported)'),true);assert.equal(await w.run('PalaceStorage.store.flush()'),true);assert.equal(w.run('palaceImportBackup().emp.name'),old);assert.equal(w.run('E().name'),'新皇');
 w.run('A.undoImport()');assert.equal(await w.run('PalaceStorage.store.flush()'),true);assert.equal(w.run('E().name'),old);
});
test('quota failure during migration leaves the entire destination untouched and all legacy data recoverable',async()=>{
 const factory=new IDBFactory(),legacy=new Map([[KEY,'auto'],['chengongji_v1_1','manual']]);const put=IDBObjectStore.prototype.put;
 IDBObjectStore.prototype.put=function(value,key){if(key==='chengongji_v1_1')throw new DOMException('full','QuotaExceededError');return put.call(this,value,key);};
 try{const r=await storage(factory,legacy);assert.equal(r.store,null);assert.equal(vm.runInContext('PalaceStorage.startupError.name',r.context),'QuotaExceededError');}finally{IDBObjectStore.prototype.put=put;}
 const r=await storage(factory);assert.equal(r.store.getItem(KEY),null);assert.equal(legacy.get(KEY),'auto');assert.equal(legacy.get('chengongji_v1_1'),'manual');
});
test('a corrupt primary retains a readable backup in title metadata and real restoration',async()=>{
 const base=boot();base.run('A.start();drain()');const raw=base.storage.get(KEY),legacy=new Map([[KEY,'broken'],[KEY+':backup',raw]]);
 const w=await world(undefined,legacy);assert.ok(w.run("slotInfo('auto')"));await w.run("A.load('auto')");assert.equal(w.run('S.turn'),0);assert.ok(w.run('lastAutoSaveInfo'));
});

test('quota retry makes room for auto and empty-slot saves while preserving the old manual slot',async()=>{
 const factory=new IDBFactory(),legacy=new Map();
 const b=boot();b.run('A.start();drain()');const old=b.storage.get(KEY);
 const snapshot=JSON.stringify([{raw:old,label:'qa-year'}]);
 legacy.set(KEY,old);legacy.set(KEY+':snapshots',snapshot);legacy.set('chengongji_v1_1',old);
 const w=await world(factory,legacy),snapKey=KEY+':snapshots',slot3='chengongji_v1_3';
 await w.run("A.load('auto')");
 const put=IDBObjectStore.prototype.put,trimmed=new WeakSet();
 IDBObjectStore.prototype.put=function(value,key){
  if(key===snapKey&&value==='[]')trimmed.add(this.transaction);
  if((key===KEY||key===slot3)&&!trimmed.has(this.transaction))throw new DOMException('full','QuotaExceededError');
  return put.call(this,value,key);
 };
 try{
  w.run("E().name='衍';E().era='嘉泰';A.go('home');");
  assert.equal(await w.run('PalaceStorage.store.flush()'),true);
  assert.equal(JSON.parse(w.run('PalaceStorage.store.getConfirmedItem(SKEY+"auto")')).emp.era,'嘉泰');
  assert.equal(w.run('PalaceStorage.store.getConfirmedItem(SKEY+"auto:snapshots")'),'[]');
  w.run("A.save('3')");
  assert.equal(await w.run('PalaceStorage.store.flush()'),true);
 }finally{IDBObjectStore.prototype.put=put;}
 const next=await world(factory,legacy);
 assert.equal(next.run('PalaceStorage.store.getConfirmedItem(SKEY+"auto:snapshots")'),'[]');
 assert.equal(next.run('PalaceStorage.store.getConfirmedItem(SKEY+"1")'),old);
 await next.run("A.load('3')");
 assert.equal(next.run('E().era'),'嘉泰');assert.equal(next.run('E().name'),'衍');
});
