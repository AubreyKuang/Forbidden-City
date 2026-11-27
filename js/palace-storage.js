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
  const quota=e=>e?.name==='QuotaExceededError'||e?.name==='NS_ERROR_DOM_QUOTA_REACHED'||e?.code===22||e?.code===1014||/exceed|quota|max ?size|storage.*full/i.test(e?.errMsg||e?.message||'');
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
  function idbBackend(db){
    return {kind:'indexeddb',readAll:()=>readAll(db),
      onversionchange(fail){db.onversionchange=()=>{db.close();fail();};},
      transact:(batch,conflicts)=>new Promise((resolve,reject)=>{
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
      })};
  }
  // Key-value stores for containers whose IndexedDB is missing or refuses writes
  // (some in-app WebViews, including mini-game hosts). One tab at a time is assumed;
  // a save is still reported only after every chunk and its manifest are written.
  // TapTap: 1MB per key, 10MB total. Long reigns are split into chunks; a new
  // revision's chunks land before its manifest, so a torn write keeps the old copy.
  const CHUNK=200000,PREFIX='cgj:';
  function chunkedKV(kind,io){
    const read=key=>{
      const head=io.get(PREFIX+key);if(head===null||head===undefined||head==='')return null;
      const {rev,n}=JSON.parse(head);let raw='';
      for(let i=0;i<n;i++){const part=io.get(PREFIX+key+'#'+rev+':'+i);if(typeof part!=='string')throw Error('存档分块缺失');raw+=part;}
      return raw;
    };
    const drop=(key,head)=>{if(!head)return;const {rev,n}=JSON.parse(head);for(let i=0;i<n;i++)io.remove(PREFIX+key+'#'+rev+':'+i);};
    const put=(key,value)=>{
      const prior=io.get(PREFIX+key)||null;
      if(value===null){io.remove(PREFIX+key);drop(key,prior);return;}
      const rev=Date.now().toString(36)+Math.random().toString(36).slice(2,6),n=Math.max(1,Math.ceil(value.length/CHUNK));
      for(let i=0;i<n;i++)io.set(PREFIX+key+'#'+rev+':'+i,value.slice(i*CHUNK,(i+1)*CHUNK));
      io.set(PREFIX+key,JSON.stringify({rev,n}));
      try{drop(key,prior);}catch{/* Orphaned chunks of an older copy are harmless. */}
    };
    return {kind,
      readAll:async()=>{const values=new Map();for(const key of keys){const raw=read(key);if(raw!==null)values.set(key,raw);}return values;},
      transact:async(batch,conflicts)=>{
        for(const [key,expected] of batch.expected)if(read(key)!==expected){for(const [k] of batch.expected)conflicts.add(k);throw conflict();}
        // Without transactions, a failed batch puts back the copies it started from.
        const prior=batch.writes.map(([key])=>[key,read(key)]);
        try{for(const [key,value] of batch.writes)put(key,value);}
        catch(e){for(const [key,value] of prior){try{if(read(key)!==value)put(key,value);}catch{/* Keep the first error. */}}throw e;}
      }};
  }
  function tapBackend(){
    const tap=globalThis.tap;
    if(typeof tap?.setStorageSync!=='function'||typeof tap.getStorageSync!=='function')return null;
    return chunkedKV('tap',{
      get:key=>{const v=tap.getStorageSync(key);return v===''||v===undefined?null:v;},
      set:(key,value)=>tap.setStorageSync(key,value),
      remove:key=>{typeof tap.removeStorageSync==='function'?tap.removeStorageSync(key):tap.setStorageSync(key,'');}
    });
  }
  // Xiaohongshu mini-tool Storage (client 9.46+): async setStorage/getStorage with JSON
  // string data, 1MB per key and 10MB per tool. Browser storage is never a fallback here:
  // if the SDK, the client version or a call fails, the player is told saving is off.
  const XHS_STORAGE_MIN_CLIENT=9460,XHS_KEY_LIMIT=1024*1024,XHS_CHUNK_BYTES=900*1024,XHS_PREFIX='cgx:';
  const unavailableXhs=reason=>Object.assign(Error('当前无法存档：'+reason),{name:'StorageUnavailableError'});
  const utf8=s=>{let n=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c<0x80)n+=1;else if(c<0x800)n+=2;else if(c>=0xd800&&c<0xdc00&&i+1<s.length){n+=4;i++;}else n+=3;}return n;};
  async function xhsClientVersion(xhs){
    const read=o=>Number(o&&o.miniToolEnv&&o.miniToolEnv.buildVersion)||0;
    let build=read(xhs&&xhs.launchOptions);
    const mt=xhs&&xhs.miniTool;
    if(!build&&mt&&typeof mt.getLaunchOptions==='function'){try{build=read(await mt.getLaunchOptions());}catch(e){build=0;}}
    // The last three digits are a build serial: 9462004 is client 9.46.2, compared as 9462.
    return build?Math.floor(build/1000):0;
  }
  // Long saves are compressed in 1M-character segments (js/save-compress.js), pausing between them,
  // so a monthly autosave does not hold the page for the whole save at once. Each segment
  // becomes one key; compressed text is ASCII, far under the 1MB key limit.
  const XHS_SEGMENT=1048576;
  const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
  async function xhsPack(value){
    if(typeof PalaceCompress==='undefined'||value.length<4096)return {z:0,parts:xhsSplit(value)};
    const parts=[];
    for(let i=0;i<value.length;i+=XHS_SEGMENT){
      const part=PalaceCompress.compress(value.slice(i,i+XHS_SEGMENT));
      if(utf8(JSON.stringify(part))>XHS_CHUNK_BYTES)return {z:0,parts:xhsSplit(value)};
      parts.push(part);
      if(i+XHS_SEGMENT<value.length)await pause();
    }
    return {z:1,parts};
  }
  // Each stored value is itself a JSON string literal, so every key holds valid JSON.
  function xhsSplit(value){
    const parts=[];let i=0;
    while(i<value.length){
      let size=Math.min(value.length-i,300000);
      while(size>1&&utf8(JSON.stringify(value.slice(i,i+size)))>XHS_CHUNK_BYTES)size=Math.floor(size*0.75);
      // Never split a surrogate pair.
      const last=value.charCodeAt(i+size-1);if(size>1&&i+size<value.length&&last>=0xd800&&last<0xdc00)size--;
      parts.push(value.slice(i,i+size));i+=size;
    }
    return parts.length?parts:[''];
  }
  function xhsBackend(xhs){
    const mt=xhs.miniTool,known=new Set(),sizes=new Map();let limit=10*1024*1024,used=0;
    const call=async(name,args)=>{
      const result=await mt[name](args);
      if(result&&typeof result.errMsg==='string'&&!/:ok$/.test(result.errMsg))throw Object.assign(Error(result.errMsg),{errMsg:result.errMsg,errCode:result.errCode});
      return result||{};
    };
    const info=async()=>{
      const r=await call('getStorageInfo',{});
      known.clear();for(const k of Array.isArray(r.keys)?r.keys:[])known.add(k);
      if(Number.isFinite(r.limitBytes)&&r.limitBytes>0)limit=r.limitBytes;
      if(Number.isFinite(r.usedBytes))used=r.usedBytes;
      return r;
    };
    // iOS answers a missing key with data:""; the key list decides what exists.
    const getRaw=async key=>{
      if(!known.has(key))return null;
      const r=await call('getStorage',{key});const data=r.data;
      if(data===null||data===undefined||data==='')return null;
      if(typeof data!=='string')throw Error('存档数据格式不对');
      sizes.set(key,utf8(data));
      return data;
    };
    const setRaw=async(key,data)=>{
      const bytes=utf8(data);
      if(bytes>XHS_KEY_LIMIT)throw Object.assign(Error('存档分块超过单条上限'),{name:'QuotaExceededError'});
      await call('setStorage',{key,data});
      known.add(key);used+=bytes-(sizes.get(key)||0);sizes.set(key,bytes);
      // Read back every write before trusting it.
      const back=await getRaw(key);
      if(back!==data)throw Error('存档写入后读回不一致');
    };
    const removeRaw=async key=>{
      if(!known.has(key))return;
      await call('removeStorage',{key});
      known.delete(key);used-=sizes.get(key)||0;sizes.delete(key);
    };
    const head=async key=>{const raw=await getRaw(XHS_PREFIX+key);if(raw===null)return null;const h=JSON.parse(raw);return h&&typeof h.rev==='string'&&Number.isInteger(h.n)?h:null;};
    const read=async key=>{
      const h=await head(key);if(!h)return null;let out='';
      for(let i=0;i<h.n;i++){const part=await getRaw(XHS_PREFIX+key+'#'+h.rev+':'+i);if(part===null)throw Error('存档分块缺失');const text=JSON.parse(part);out+=h.z?PalaceCompress.decompress(text):text;}
      return out;
    };
    const drop=async(key,h)=>{if(!h)return;for(let i=0;i<h.n;i++)await removeRaw(XHS_PREFIX+key+'#'+h.rev+':'+i);};
    const put=async(key,value)=>{
      const prior=await head(key);
      if(value===null){await removeRaw(XHS_PREFIX+key);await drop(key,prior);return;}
      const packed=await xhsPack(value),parts=packed.parts.map(p=>JSON.stringify(p));
      const rev=Date.now().toString(36)+Math.random().toString(36).slice(2,6),manifest=JSON.stringify({rev,n:parts.length,...(packed.z?{z:1}:{})});
      // Check the quota first: the new copy lands before the old one is released.
      const need=parts.reduce((n,p)=>n+utf8(p),0)+utf8(manifest);
      if(used+need>limit){
        await info();
        if(used+need>limit)throw Object.assign(Error('存档空间不足'),{name:'QuotaExceededError'});
      }
      for(let i=0;i<parts.length;i++)await setRaw(XHS_PREFIX+key+'#'+rev+':'+i,parts[i]);
      await setRaw(XHS_PREFIX+key,manifest);
      try{await drop(key,prior);}catch(e){/* Orphaned chunks of an older copy are harmless. */}
    };
    return {kind:'xhs',
      async readAll(){
        await info();const values=new Map();
        for(const key of keys){const raw=await read(key);if(raw!==null)values.set(key,raw);}
        // Learn the sizes of what is already stored, for the next quota estimate.
        for(const k of known)if(k.startsWith(XHS_PREFIX)&&!sizes.has(k)){const v=await getRaw(k);if(v!==null)sizes.set(k,utf8(v));}
        return values;
      },
      async transact(batch,conflicts){
        for(const [key,expected] of batch.expected)if(await read(key)!==expected){for(const [k] of batch.expected)conflicts.add(k);throw conflict();}
        const prior=[];for(const [key] of batch.writes)prior.push([key,await read(key)]);
        try{for(const [key,value] of batch.writes)await put(key,value);}
        catch(e){for(const [key,value] of prior){try{if(await read(key)!==value)await put(key,value);}catch(x){/* Keep the first error. */}}throw e;}
      },
      get quota(){return {used,limit};}
    };
  }
  async function openXhs(){
    const xhs=globalThis.xhs,mt=xhs&&xhs.miniTool;
    if(!mt)throw unavailableXhs('未检测到小红书容器。');
    for(const name of ['setStorage','getStorage','getStorageInfo','removeStorage'])
      if(typeof mt[name]!=='function')throw unavailableXhs('当前客户端不支持本机存储。');
    const version=await xhsClientVersion(xhs);
    if(!version)throw unavailableXhs('无法确认客户端版本。');
    if(version<XHS_STORAGE_MIN_CLIENT)throw unavailableXhs('请将小红书升级到 9.46 或更高版本后再存档。');
    const backend=xhsBackend(xhs);
    try{
      const value='宸'+Date.now();
      await backend.transact({expected:[],writes:[['chengongji_probe',value]]},new Set());
      await backend.transact({expected:[['chengongji_probe',value]],writes:[['chengongji_probe',null]]},new Set());
    }catch(e){
      if(quota(e))throw unavailableXhs('本机存储空间不足。');
      throw unavailableXhs('本机存储暂时无法写入。');
    }
    return backend;
  }
  // 易次元 (NetEase avg, 万象笺 package upload): saves go to the platform's cloud profiles
  // through AvgAIGameSDK 2.0.x, loaded from the platform CDN before the game. Each storage
  // key owns one profile position (0-49); the body is uploaded to the platform CDN first,
  // then the position is created or replaced. The platform has no delete and no
  // compare-and-swap, so a removed key is replaced by an empty marker and one device at a
  // time is assumed. The profile list call answers [] on any error, so the store is
  // trusted only after a probe write shows up in it, and a known position that later
  // goes missing from the list stops the write instead of creating a duplicate.
  const AVG_PREFIX='chengongji_v1_',AVG_PROBE=49;
  const AVG_SLOTS=['auto','1','2','3','before-import','dev-backup'].flatMap(slot=>[slot,slot+':backup',...(slot==='auto'?[slot+':snapshots']:[])]);
  const avgPosition=key=>key.startsWith(AVG_PREFIX)?AVG_SLOTS.indexOf(key.slice(AVG_PREFIX.length)):-1;
  const avgLabel=key=>{const slot=key.slice(AVG_PREFIX.length),[base,part]=slot.split(':');
    const name=base==='auto'?'自动存档':base==='before-import'?'读入前备份':base==='dev-backup'?'测试备份':'存档'+base;
    return name+(part==='backup'?'·上一份':part==='snapshots'?'·回溯点':'');};
  const unavailableAvg=reason=>Object.assign(Error('当前无法存档：'+reason),{name:'StorageUnavailableError'});
  async function avgPack(value){
    if(typeof PalaceCompress==='undefined'||value.length<4096)return {z:0,parts:[value]};
    const parts=[];
    for(let i=0;i<value.length;i+=XHS_SEGMENT){parts.push(PalaceCompress.compress(value.slice(i,i+XHS_SEGMENT)));if(i+XHS_SEGMENT<value.length)await pause();}
    return {z:1,parts};
  }
  function avgBackend(sdk,gameId){
    const ids=new Map(),mirror=new Map();
    const list=async()=>{const rows=await sdk.getProfileList(gameId);return Array.isArray(rows)?rows:[];};
    const learn=rows=>{for(const row of rows)if(row&&Number.isInteger(row.position)&&row.id!==undefined&&row.id!==null)ids.set(row.position,row.id);};
    const decode=raw=>{
      const body=JSON.parse(raw);
      if(!body||body.app!=='chengongji'||!Array.isArray(body.parts))throw Error('存档数据格式不对');
      if(body.empty)return null;
      return body.z?body.parts.map(p=>PalaceCompress.decompress(p)).join(''):body.parts.join('');
    };
    const upload=async(key,position,value)=>{
      const packed=value===null?{z:0,parts:[]}:await avgPack(value);
      const body=JSON.stringify({app:'chengongji',key,savedAt:Date.now(),z:packed.z,parts:packed.parts,...(value===null?{empty:1}:{})});
      const progress=await sdk.uploadProfile(body);
      const profile={progress,profileName:avgLabel(key),position,isAuto:key===AVG_PREFIX+'auto'};
      if(ids.has(position)){await sdk.replaceProfile(gameId,ids.get(position),profile);return;}
      const rows=await list();learn(rows);
      if(ids.has(position)){await sdk.replaceProfile(gameId,ids.get(position),profile);return;}
      await sdk.createProfile(gameId,profile);
      learn(await list());
    };
    // The probe proves the list call works: a write must come back in the next list.
    const probe=async()=>{
      const progress=await sdk.uploadProfile(JSON.stringify({app:'chengongji',probe:Date.now()}));
      const profile={progress,profileName:'存档检测',position:AVG_PROBE,isAuto:false};
      let rows=await list();learn(rows);
      if(ids.has(AVG_PROBE))await sdk.replaceProfile(gameId,ids.get(AVG_PROBE),profile);
      else await sdk.createProfile(gameId,profile);
      rows=await list();learn(rows);
      const row=rows.find(r=>r&&r.position===AVG_PROBE);
      if(!row||row.progress!==progress)throw Error('存档列表读不回刚写入的内容');
    };
    return {kind:'avg',coalesce:true,
      probe,
      async readAll(){
        const rows=await list();learn(rows);
        const values=new Map();mirror.clear();
        for(const row of rows){
          const key=AVG_SLOTS[row&&row.position];if(!key||!row.progress)continue;
          let raw;
          // One unreadable position must not hide the others.
          try{raw=decode(await sdk.downloadProfile(row.progress));}catch(e){console.warn('Cloud save '+key+':',e);continue;}
          if(raw!==null){values.set(AVG_PREFIX+key,raw);mirror.set(AVG_PREFIX+key,raw);}
        }
        return values;
      },
      // No expected-value check: the platform cannot compare-and-swap, and the game runs
      // in one WebView at a time.
      async transact(batch){
        for(const [key] of batch.writes)if(avgPosition(key)<0)throw Error('这个存档位不能保存到云端');
        const rows=await list();
        // A position this session has seen must still be listed; an empty answer is an error.
        for(const [position] of ids)if(position!==AVG_PROBE&&!rows.some(r=>r&&r.position===position))throw Error('云存档列表暂时读不到，请稍后重试');
        learn(rows);
        for(const [key,value] of batch.writes){
          if(value===null&&!mirror.has(key))continue;
          await upload(key,avgPosition(key),value);
          if(value===null)mirror.delete(key);else mirror.set(key,value);
        }
      }
    };
  }
  async function openAvg(){
    const sdk=globalThis.AvgAIGameSDK;
    if(!sdk||typeof sdk.init!=='function')throw unavailableAvg('没有连上易次元平台，请检查网络后重新打开。');
    for(const name of ['createPlatformContext','getProfileList','createProfile','replaceProfile','uploadProfile','downloadProfile'])
      if(typeof sdk[name]!=='function')throw unavailableAvg('易次元平台接口不完整，请更新 App 后重试。');
    sdk.init({mode:'production'});
    // Not logged in: the SDK sends the player to the login page and rejects; let it.
    const {gameId}=await sdk.createPlatformContext();
    const backend=avgBackend(sdk,gameId);
    try{await backend.probe();}
    catch(e){console.warn('Cloud save probe:',e);throw unavailableAvg('云存档暂时无法写入，请检查网络后重新打开。');}
    return backend;
  }
  const avgEdition=()=>typeof PALACE_EDITION!=='undefined'&&PALACE_EDITION.name==='yiciyuan';
  const xhsEdition=()=>typeof PALACE_EDITION!=='undefined'&&PALACE_EDITION.name==='xhs';
  // The plain localStorage path is SaveManager's own synchronous fallback; it is
  // used only after a value written to it reads back unchanged.
  function localWorks(){
    try{
      const ls=globalThis.localStorage,key='chengongji_probe',value='宸'+Date.now();
      if(!ls||typeof ls.setItem!=='function')return false;
      ls.setItem(key,value);const back=ls.getItem(key);ls.removeItem(key);return back===value;
    }catch{return false;}
  }
  const unavailable=()=>Object.assign(Error('当前环境不允许游戏保存数据'),{name:'StorageUnavailableError'});
  async function migrateInto(backend){
    const legacy=[];
    try{for(const key of keys){const raw=localStorage.getItem(key);if(raw!==null&&raw!==undefined)legacy.push([key,raw]);}}catch{/* Unreadable legacy storage holds nothing to copy. */}
    const present=await backend.readAll(),missing=legacy.filter(([key])=>!present.has(key));
    if(missing.length)await backend.transact({expected:[],writes:missing},new Set());
  }
  function adapter(backend,initial){
    let cache=new Map(initial),durable=new Map(initial),queue=[],running=false,error=null,revision=0;
    const waiters=[],conflicts=new Set();
    const emit=change=>{try{api.onchange?.(change);}catch(e){console.warn('Save status:',e);}};
    const apply=(map,writes)=>{for(const [key,value] of writes){if(value===null)map.delete(key);else map.set(key,value);}};
    const finish=()=>{if(!running&&!queue.length)while(waiters.length)waiters.shift()(!error);};
    const transact=batch=>backend.transact(batch,conflicts);
    async function write(batch){
      try{await transact(batch);return batch.writes;}
      catch(error){
        if(!quota(error)||!batch.reclaim.length)throw error;
        const reclaim=new Map(batch.reclaim);
        // Empty records prevent later startup from remigrating stale legacy copies.
        const writes=[...reclaim,...batch.writes.filter(([key])=>!reclaim.has(key))];
        const expected=new Map([...batch.reclaim.map(([key])=>[key,durable.get(key)??null]),...batch.expected]);
        await transact({writes,expected});
        for(const [key,value] of reclaim){
          const following=queue.slice(1).find(item=>item.expected.some(([name])=>name===key));
          if(following)following.expected=following.expected.map(([name,prior])=>[name,name===key?value:prior]);
        }
        return writes;
      }
    }
    async function pump(){
      if(running)return;running=true;
      while(queue.length){
        // Remote stores send one upload per key for everything queued meanwhile.
        if(backend.coalesce&&queue.length>1){
          const writes=new Map();for(const b of queue)for(const [key,value] of b.writes){writes.delete(key);writes.set(key,value);}
          queue=[{writes:[...writes],reclaim:[],expected:queue[0].expected}];
        }
        const batch=queue[0];
        try{
          const writes=await write(batch);apply(durable,writes);queue.shift();
          if(writes!==batch.writes){
            cache=new Map(durable);
            for(const pending of queue)apply(cache,pending.writes);
          }
          emit({type:'saved',keys:writes.map(([key])=>key)});
        }catch(e){
          error=e;const failed=[...new Set(queue.flatMap(b=>b.writes.map(([key])=>key)))];queue=[];
          cache=new Map(durable);
          emit({type:'failed',error:e,keys:failed});break;
        }
      }
      running=false;finish();emit({type:'idle'});
    }
    const api={
      kind:backend.kind,onchange:null,
      getItem:key=>cache.get(key)??null,
      getConfirmedItem:key=>durable.get(key)??null,
      get pending(){return running||queue.length>0;},
      pendingKey:key=>queue.some(b=>b.writes.some(([k])=>k===key)),
      get error(){return error;},
      hasConflict:key=>conflicts.has(key),
      commit(writes,{reclaim=[]}={}){
        if(writes.some(([key])=>conflicts.has(key)))throw conflict();
        const batch={writes,reclaim,expected:writes.map(([key])=>[key,cache.get(key)??null])};
        revision++;error=null;apply(cache,writes);queue.push(batch);pump();return true;
      },
      setItem(key,value){return api.commit([[key,String(value)]]);},
      removeItem(key){return api.commit([[key,null]]);},
      flush(){return !running&&!queue.length?Promise.resolve(!error):new Promise(resolve=>waiters.push(resolve));},
      async refresh(){
        await api.flush();const start=revision,data=await backend.readAll();
        if(revision!==start)throw Error('读取期间进度有变化，请重试');
        cache=new Map(data);durable=new Map(data);
        conflicts.clear();error=null;
      }
    };
    backend.onversionchange?.(()=>{error=Error('存档数据库已更新，请刷新游戏');emit({type:'failed',error,keys:keys.slice()});});
    globalThis.addEventListener?.('beforeunload',event=>{
      if(!api.pending&&!error)return;event.preventDefault();event.returnValue='';
    });
    return api;
  }
  const blocked=e=>/另一个标签页/.test(e?.message||'');
  async function openIndexedDB(){
    const db=await open();await migrate(db);const backend=idbBackend(db);
    // Some WebViews open the database yet abort every write; find out before play starts.
    await backend.transact({expected:[],writes:[['chengongji_probe','1']]},new Set());
    await backend.transact({expected:[],writes:[['chengongji_probe',null]]},new Set());
    return backend;
  }
  async function openFallback(make){
    const backend=make();if(!backend)return null;
    try{
      // Write, read back (the expected check) and remove a probe before trusting the store.
      const value='宸'+Date.now();
      await backend.transact({expected:[],writes:[['chengongji_probe',value]]},new Set());
      await backend.transact({expected:[['chengongji_probe',value]],writes:[['chengongji_probe',null]]},new Set());
      await migrateInto(backend);return backend;
    }catch(e){console.warn('Save store unavailable:',backend.kind,e);return null;}
  }
  function init(){
    if(globalThis.PALACE_DISPOSABLE_STORAGE)return null;
    if(avgEdition()){
      if(!opening)opening=(async()=>{
        try{const backend=await openAvg();startupError=null;store=adapter(backend,await backend.readAll());return store;}
        catch(e){startupError=e&&e.name==='StorageUnavailableError'?e:unavailableAvg('云存档暂时无法读取，请检查网络后重新打开。');console.warn('Save store unavailable:',e);return null;}
      })();
      return opening;
    }
    if(xhsEdition()){
      if(!opening)opening=(async()=>{
        try{const backend=await openXhs();startupError=null;store=adapter(backend,await backend.readAll());return store;}
        catch(e){startupError=e&&e.name==='StorageUnavailableError'?e:unavailableXhs('本机存储暂时无法读取。');console.warn('Save store unavailable:',e);return null;}
      })();
      return opening;
    }
    if(!globalThis.indexedDB&&!tapBackend()){if(!localWorks())startupError=unavailable();return null;}
    if(!opening)opening=(async()=>{
      let backend=null;
      if(globalThis.indexedDB){
        try{backend=await openIndexedDB();}
        catch(e){
          startupError=e;
          // Another open tab is the player's to close; switching stores would hide their saves.
          if(blocked(e))return null;
        }
      }
      if(!backend)backend=await openFallback(tapBackend);
      if(!backend){startupError=localWorks()?null:startupError||unavailable();return null;}
      startupError=null;
      store=adapter(backend,await backend.readAll());return store;
    })().catch(e=>{startupError=e;return null;});
    return opening;
  }
  return {init,get store(){return store;},get startupError(){return startupError;},get kind(){return store?.kind||null;}};
})();
