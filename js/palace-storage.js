/* The world and its replay transcript can exceed localStorage's small quota.
   IndexedDB owns durable saves; the synchronous cache only stages game actions.
   A save is announced as complete only after its atomic transaction commits. */
const PalaceStorage=(()=>{
  const name='chengongji-saves', table='records';
  const keys=['auto','1','2','3','before-import','dev-backup'].flatMap(slot=>
    ['chengongji_v1_','chengongji_dev_v1_'].flatMap(prefix=>
      [prefix+slot,prefix+slot+':backup',...(slot==='auto'?[prefix+slot+':snapshots']:[])]));
  let store=null, opening=null, startupError=null;
  const conflict=()=>Object.assign(new Error('另一标签页已更新存档'),{name:'SaveConflictError'});
  function readAll(db){return new Promise((resolve,reject)=>{
    const values=new Map(),tx=db.transaction(table,'readonly'),request=tx.objectStore(table).openCursor();
    request.onsuccess=()=>{const c=request.result;if(c){values.set(c.key,c.value);c.continue();}};
    tx.oncomplete=()=>resolve(values);tx.onabort=()=>reject(tx.error||Error('存档读取失败'));
  });}
  function open(){return new Promise((resolve,reject)=>{
    let settled=false;const request=indexedDB.open(name,1);
    const timer=setTimeout(()=>{settled=true;reject(Error('存档数据库未能及时打开，请关闭其他游戏标签页后重试'));},10000);
    const fail=error=>{clearTimeout(timer);if(!settled){settled=true;reject(error);}};
    request.onupgradeneeded=()=>request.result.createObjectStore(table);
    request.onerror=()=>fail(request.error);
    request.onblocked=()=>fail(Error('另一个标签页正在使用旧版存档数据库，请关闭后重试'));
    request.onsuccess=()=>{clearTimeout(timer);if(settled)request.result.close();else{settled=true;resolve(request.result);}};
  });}
  // Copy missing legacy slots in one transaction. Keep the original bytes intact:
  // failed migration, older builds and downloadable recovery never lose their source.
  function migrate(db){
    const legacy=[];
    try{for(const key of keys){const raw=localStorage.getItem(key);if(raw!==null&&raw!==undefined)legacy.push([key,raw]);}}catch{/* Local storage may be denied while IndexedDB remains usable. */}
    if(!legacy.length)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let reason=null;const tx=db.transaction(table,'readwrite'),records=tx.objectStore(table);
      tx.oncomplete=resolve;tx.onabort=()=>reject(reason||tx.error||Error('旧存档迁移未完成'));
      for(const [key,raw] of legacy){const request=records.get(key);request.onsuccess=()=>{
        try{if(request.result===undefined)records.put(raw,key);}catch(e){reason=e;tx.abort();}
      };}
    });
  }
  function adapter(db,initial){
    let cache=new Map(initial),durable=new Map(initial),queue=[],running=false,error=null,revision=0;
    const waiters=[],conflicts=new Set();
    const emit=change=>{try{api.onchange?.(change);}catch(e){console.warn('Save status:',e);}};
    const apply=(map,writes)=>{for(const [key,value] of writes){if(value===null)map.delete(key);else map.set(key,value);}};
    const finish=()=>{if(!running&&!queue.length)while(waiters.length)waiters.shift()(!error);};
    const transact=batch=>new Promise((resolve,reject)=>{
      let reason=null;const tx=db.transaction(table,'readwrite'),records=tx.objectStore(table);
      tx.oncomplete=resolve;tx.onabort=()=>reject(reason||tx.error||Error('存档写入失败'));
      // Every checked read and write shares the same transaction: two tabs cannot
      // both pass a stale read and then overwrite one another's progress.
      try{
        for(const [key,expected] of batch.expected){
          const req=records.get(key);req.onsuccess=()=>{
            if((req.result??null)!==expected){reason=conflict();for(const [k] of batch.expected)conflicts.add(k);tx.abort();}
          };
        }
        for(const [key,value] of batch.writes){if(value===null)records.delete(key);else records.put(value,key);}
      }catch(e){reason=e;tx.abort();}
    });
    async function pump(){
      if(running)return;running=true;
      while(queue.length){
        const batch=queue[0];
        try{
          await transact(batch);apply(durable,batch.writes);queue.shift();
          emit({type:'saved',keys:batch.writes.map(([key])=>key)});
        }catch(e){
          error=e;const failed=[...new Set(queue.flatMap(b=>b.writes.map(([key])=>key)))];queue=[];
          cache=new Map(durable);
          emit({type:'failed',error:e,keys:failed});break;
        }
      }
      running=false;finish();emit({type:'idle'});
    }
    const api={
      kind:'indexeddb',onchange:null,
      getItem:key=>cache.get(key)??null,
      getConfirmedItem:key=>durable.get(key)??null,
      get pending(){return running||queue.length>0;},
      pendingKey:key=>queue.some(b=>b.writes.some(([k])=>k===key)),
      get error(){return error;},
      hasConflict:key=>conflicts.has(key),
      commit(writes){
        if(writes.some(([key])=>conflicts.has(key)))throw conflict();
        const batch={writes,expected:writes.map(([key])=>[key,cache.get(key)??null])};
        revision++;error=null;apply(cache,writes);queue.push(batch);pump();return true;
      },
      setItem(key,value){return api.commit([[key,String(value)]]);},
      removeItem(key){return api.commit([[key,null]]);},
      flush(){return !running&&!queue.length?Promise.resolve(!error):new Promise(resolve=>waiters.push(resolve));},
      async refresh(){
        await api.flush();const start=revision,data=await readAll(db);
        if(revision!==start)throw Error('读取期间进度有变化，请重试');
        cache=new Map(data);durable=new Map(data);
        conflicts.clear();error=null;
      }
    };
    db.onversionchange=()=>{db.close();error=Error('存档数据库已更新，请刷新游戏');emit({type:'failed',error,keys:keys.slice()});};
    globalThis.addEventListener?.('beforeunload',event=>{
      if(!api.pending&&!error)return;event.preventDefault();event.returnValue='';
    });
    return api;
  }
  function init(){
    if(globalThis.PALACE_DISPOSABLE_STORAGE||!globalThis.indexedDB)return null;
    if(!opening)opening=(async()=>{
      try{const db=await open();await migrate(db);store=adapter(db,await readAll(db));return store;}
      catch(e){startupError=e;return null;}
    })();
    return opening;
  }
  return {init,get store(){return store;},get startupError(){return startupError;}};
})();
