/* Shared snapshot storage. The primary key remains readable by older builds.
   v2: older saves are migrated instead of rejected, and a few dated snapshots are kept for rewinding. */
const SaveManager = (() => {
  const version = 2;
  const SNAPSHOTS = 4;
  const observed = new Map();
  let lastError = null;

  function getStorage() {
    if(typeof PalaceStorage!=='undefined'&&PalaceStorage.store)return PalaceStorage.store;
    if(typeof PalaceStorage!=='undefined'&&PalaceStorage.unsaved)return null;
    try { return globalThis.localStorage; } catch { return null; }
  }

  function versionOf(raw) {
    try { return JSON.parse(raw)?.saveVersion ?? 1; } catch { return 1; }
  }

  function track(storage, key, refresh = false) {
    const raw = storage.getItem(key) ?? null;
    if (refresh || !observed.has(key)) observed.set(key, { raw, content: null, newer: versionOf(raw) > version });
    return { raw, entry: observed.get(key) };
  }

  function status(storage, key) {
    try {
      if(storage?.hasConflict?.(key))return 'conflict';
      const { raw, entry } = track(storage, key);
      if (raw === entry.raw ? entry.newer : versionOf(raw) > version) return 'newer';
      return raw === entry.raw ? 'ready' : 'conflict';
    } catch {
      return 'unavailable';
    }
  }

  function contentOf(data) {
    return JSON.stringify({ ...data, saveVersion: version, savedAt: undefined });
  }
  function decode(raw, valid, migrate) {
    try {
      let data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      const from = data.saveVersion ?? 1;
      if (!Number.isInteger(from) || from < 1 || from > version) return null;
      if (from < version && migrate) data = migrate(data, from);
      if (!data || !valid(data)) return null;
      return data;
    } catch {
      return null;
    }
  }

  function load(storage, key, valid, migrate, refresh = false) {
    try {
      const { raw, entry } = track(storage, key, refresh);
      if (raw === entry.raw ? entry.newer : versionOf(raw) > version) return null;
      return decode(raw, valid, migrate) || decode(storage.getItem(key + ':backup'), valid, migrate);
    } catch {
      return null;
    }
  }

  function save(storage, key, data, valid, { touch = false, alongside = [], backup = true, rewindKey } = {}) {
    const changed = [];
    lastError = null;
    try {
      const { raw: previous, entry } = track(storage, key);
      if (previous !== entry.raw || entry.newer) return false;
      const content = contentOf(data);
      const decoded = entry.content === null ? decode(previous, valid) : null;
      if (decoded) entry.content = contentOf(decoded);
      if (!touch && !alongside.length && content === entry.content) return true;
      const next = Number.isFinite(data.savedAt)
        ? content.slice(0, -1) + ',"savedAt":' + data.savedAt + '}'
        : content;
      if (!decode(next, valid)) return false;
      if (previous === next && !alongside.length) return true;

      const writes = [...alongside];
      if (backup && entry.content !== null && content !== entry.content) writes.push([key + ':backup', previous]);
      if(storage.commit){
        const reclaim=[];
        if(rewindKey&&!alongside.length){
          reclaim.push([rewindKey,'[]']);
          if(entry.content!==null)reclaim.push([key+':backup','']);
        }
        storage.commit([...writes,[key,next]],{reclaim});
        observed.set(key,{raw:next,content,newer:false});
        return true;
      }
      for (const [name, value] of writes) {
        const old = storage.getItem(name) ?? null;
        if (old === value) continue;
        storage.setItem(name, value);
        changed.push([name, old, value]);
      }
      if ((storage.getItem(key) ?? null) !== previous) throw Error('Save changed in another tab');
      storage.setItem(key, next);
      observed.set(key, { raw: next, content, newer: false });
      return true;
    } catch (error) {
      lastError = error;
      for (const [name, old, written] of changed.reverse()) {
        try {
          if (storage.getItem(name) !== written) continue;
          if (old === null) storage.removeItem(name);
          else storage.setItem(name, old);
        } catch { /* The primary save is still unchanged. */ }
      }
      return false;
    }
  }

  function readSnapshots(storage, key) {
    try {
      const list = JSON.parse(storage.getItem(key + ':snapshots') || '[]');
      return Array.isArray(list) ? list.filter(entry => entry && typeof entry.raw === 'string') : [];
    } catch {
      return [];
    }
  }
  // Keep one snapshot per label. Oldest go first when storage is full.
  function snapshot(storage, key, data, valid, meta = {}) {
    if (status(storage, key) !== 'ready') return false;
    const raw = JSON.stringify({ ...data, saveVersion: version });
    if (!decode(raw, valid)) return false;
    let list = readSnapshots(storage, key).filter(entry => entry.label !== meta.label);
    list.push({ ...meta, savedAt: Date.now(), raw });
    list = list.slice(-SNAPSHOTS);
    while (list.length) {
      try {
        storage.setItem(key + ':snapshots', JSON.stringify(list));
        return true;
      } catch {
        list.shift();
      }
    }
    return false;
  }
  // Rewind points are a convenience; they give way when the playable save needs room.
  function dropOldestSnapshot(storage, key) {
    const list = readSnapshots(storage, key);
    if (!list.length) return false;
    list.shift();
    try {
      if (list.length) storage.setItem(key + ':snapshots', JSON.stringify(list));
      else storage.removeItem(key + ':snapshots');
      return true;
    } catch {
      try { storage.removeItem(key + ':snapshots'); return true; } catch { return false; }
    }
  }
  function snapshots(storage, key) {
    return readSnapshots(storage, key).map(({ raw, ...meta }, index) => ({ ...meta, index }));
  }
  function restore(storage, key, index, valid, migrate, expected) {
    const list = readSnapshots(storage, key);
    const entry = expected
      ? list.find(item => item.label === expected.label && item.savedAt === expected.savedAt)
      : list[index];
    return entry ? decode(entry.raw, valid, migrate) : null;
  }

  // Browsers name a full store differently; anything else must not cost the player saved data.
  function storeFull() {
    const e = lastError;
    return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
  }
  return { getStorage, load, save, snapshot, snapshots, dropOldestSnapshot, storeFull, restore, decode, status, version,
    forget(keys){for(const key of keys)observed.delete(key);},get error(){return lastError;} };
})();

/* ============ 存档 ============ */
const SKEY=document.querySelector('meta[name="palace-dev"]')?.content==='true'?'chengongji_dev_v1_':'chengongji_v1_';
const PALACE_BEFORE_IMPORT=SKEY+'before-import';
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const validPalaceSave=s=>record(s.emp)&&record(s.flags)&&
  Array.isArray(s.consorts)&&s.consorts.every(c=>record(c)&&record(c.fam))&&
  Array.isArray(s.children)&&s.children.every(record)&&
  (s.cands===undefined||Array.isArray(s.cands)&&s.cands.every(record))&&
  Array.isArray(s.log)&&Array.isArray(s.history)&&
  Number.isInteger(s.turn)&&s.turn>=0&&Number.isInteger(s.year)&&s.year>=1&&
  Number.isInteger(s.month)&&s.month>=1&&s.month<=12;
// v1 saves are still accepted; migrate() fills in gameplay fields added since then.
const migratePalaceSave=s=>s;
function palaceSaveError(slot){
  const status=SaveManager.status(SaveManager.getStorage(),SKEY+slot);
  if(status==='newer')return '此存档由新版游戏保存，请打开新版继续。';
  if(status==='conflict')return '另一标签页已更新此存档。本页已暂停覆盖，可下载备份文件后重新读取。';
  const storage=SaveManager.getStorage();
  if(!storage)return '当前环境不允许游戏保存数据，本局进度只在本次打开期间有效。请随时用「下载备份」把进度存到手机里。';
  const e=storage.error||SaveManager.error;
  if(e?.name==='SaveConflictError')return '另一标签页已更新存档。本页已暂停覆盖，可下载备份文件后重新读取。';
  if(e?.name==='QuotaExceededError'||e?.name==='NS_ERROR_DOM_QUOTA_REACHED'||e?.code===22||e?.code===1014||/exceed|quota|max ?size|storage.*full/i.test(e?.errMsg||''))return '可用存储空间不足，眼下的进度尚未写入。请先下载备份文件，再释放设备空间后重试。';
  if(e?.name==='SecurityError'||e?.name==='NotAllowedError')return '浏览器禁止了存档写入，眼下的进度尚未写入。请允许本站存储数据，或下载备份文件留存。';
  return '存档写入失败，眼下的进度尚未写入，之前的存档仍保留。请重试保存，或下载备份文件留存。';
}
let lastAutoSaveError='';
let dismissedSaveError='';
let lastAutoSaveInfo=null;
function setAutoSaveError(error){
  if(error!==lastAutoSaveError)dismissedSaveError='';
  lastAutoSaveError=error;
}
A.dismissSaveError=function(){dismissedSaveError=lastAutoSaveError;renderTop();};
function autoSaveStatusText(){
  if(SaveManager.getStorage()?.pendingKey?.(SKEY+'auto'))return '正在写入自动存档…';
  if(lastAutoSaveError)return '自动存档未写入';
  if(!lastAutoSaveInfo)return '尚无自动存档';
  return lastAutoSaveInfo.turn===S?.turn&&lastAutoSaveInfo.gen===S?.gen?'本月已自动保存':'上次保存：'+lastAutoSaveInfo.date;
}
function refreshAutoSaveStatus(){
  const storage=SaveManager.getStorage();
  const data=confirmedPalaceSave(storage,SKEY+'auto');
  lastAutoSaveInfo=data?{turn:data.turn,gen:data.gen,date:dateStr(data),name:data.emp.sur+data.emp.name,count:data.consorts.filter(c=>c.alive&&!c.gone).length,savedAt:data.savedAt}:null;
  const summary=$('#auto-save-summary');if(summary)summary.textContent=lastAutoSaveInfo?`${lastAutoSaveInfo.name}·${lastAutoSaveInfo.date}·后妃${lastAutoSaveInfo.count}`:'空';
  const status=$('#auto-save-status');if(status){status.textContent=autoSaveStatusText();status.title=lastAutoSaveError||'每次转月和剧情选择结束后自动保存；未完事件也会保留。';}
  if(typeof renderTop==='function')renderTop();
}
function confirmedPalaceSave(storage,key){
  if(!storage?.getConfirmedItem)return SaveManager.load(storage,key,validPalaceSave);
  if(SaveManager.status(storage,key)==='newer')return null;
  return SaveManager.decode(storage.getConfirmedItem(key),validPalaceSave)||SaveManager.decode(storage.getConfirmedItem(key+':backup'),validPalaceSave);
}
function connectPalaceStorage(){
  const storage=SaveManager.getStorage();if(!storage?.commit)return;
  storage.onchange=change=>{
    if(change.type==='failed'){
      SaveManager.forget(change.keys);
      // A failed import/manual save also needs a persistent, visible warning.
      setAutoSaveError(palaceSaveError('auto'));
    }else if(change.type==='saved'){
      // A quota retry may intentionally clear an optional backup or rewind entry.
      SaveManager.forget(change.keys.filter(key=>key.endsWith(':backup')||key.endsWith(':snapshots')));
      if(change.keys.includes(SKEY+'auto'))setAutoSaveError('');
    }
    refreshAutoSaveStatus();
    if(change.type==='idle'&&S&&UI.view==='sys')render();
  };
}
function confirmPalaceWrite(ok,message,slot='auto'){
  if(!ok){toast(palaceSaveError(slot));return;}
  const storage=SaveManager.getStorage();
  if(!storage?.flush){toast(message);return;}
  toast('正在写入存档…');
  storage.flush().then(saved=>{toast(saved?message:palaceSaveError(slot));refreshAutoSaveStatus();});
}
// When the browser store is full, rewind points and the previous-copy backup give way
// before the playable save does.
function writePalace(storage,key,data){
  if(SaveManager.save(storage,key,data,validPalaceSave,{rewindKey:SKEY+'auto:snapshots'}))return true;
  if(storage?.commit)return false;
  if(!storage||!SaveManager.storeFull()||SaveManager.status(storage,key)!=='ready')return false;
  while(SaveManager.dropOldestSnapshot(storage,SKEY+'auto')){
    if(SaveManager.save(storage,key,data,validPalaceSave))return true;
    if(!SaveManager.storeFull())return false;
  }
  if(SaveManager.save(storage,key,data,validPalaceSave,{backup:false}))return true;
  if(!SaveManager.storeFull())return false;
  const backupKey=key+':backup';
  let prior;
  try{
    if(!SaveManager.decode(storage.getItem(key),validPalaceSave))return false;
    prior=storage.getItem(backupKey);
    if(prior==null)return false;
    storage.removeItem(backupKey);
  }catch{return false;}
  if(SaveManager.save(storage,key,data,validPalaceSave,{backup:false}))return true;
  try{if(storage.getItem(backupKey)==null)storage.setItem(backupKey,prior);}catch{/* The primary save is still intact. */}
  return false;
}
function save(slot){
  if(!S)return false;
  if(typeof PalaceActions!=='undefined'){if(PalaceActions.blocked){if(slot==='auto'){setAutoSaveError('未完事件尚待处理，自动存档暂未写入。请先处理「未完事件无法续接」提示，或下载现有进度。');refreshAutoSaveStatus();}return false;}if(PalaceActions.busy)return true;}
  const ok=writePalace(SaveManager.getStorage(),SKEY+slot,{...PalaceActions.payload(),savedAt:Date.now()});
  if(slot==='auto'){
    const error=ok?'':palaceSaveError(slot);
    setAutoSaveError(error);
    refreshAutoSaveStatus();
  }
  return ok;
}
function load(slot){
  const data=SaveManager.load(SaveManager.getStorage(),SKEY+slot,validPalaceSave,migratePalaceSave,true);
  if(!data)return false;
  const previous=S;
  S=data;
  try { if(!data.pendingActions)migrate(); }
  catch { S=previous;return false; }
  return true;
}
function slotInfo(slot){
  const key=SKEY+slot;
  if(SaveManager.status(SaveManager.getStorage(),key)==='newer')return '需要新版游戏';
  const storage=SaveManager.getStorage();
  const s=confirmedPalaceSave(storage,key);
  return s?`${s.emp.sur}${s.emp.name}·${dateStr(s)}·后妃${s.consorts.filter(c=>c.alive&&!c.gone).length}`:null;
}
function showRestoredPalace(){
  setAutoSaveError('');refreshAutoSaveStatus();
  Q.length=0;curEv=null;modalOpen=false;modalResult=null;
  modalInvoker=null;
  $('#modal').close?.();
  $('#modal').hidden=true;
  UI.view='map';UI.banquet=null;setScene('court');
  const pending=S.pendingActions;delete S.pendingActions;
  if(PalaceActions.restore(pending)){
    resetMapPosition(S.pos);dismissInvalidStoryOrigin();
    if(!modalResult&&curEv?.princePetition&&!curEv.valid())nextEv();
    render();return;
  }
  render();
  if(!PalaceActions.blocked)A.resumePendingScenes();
  else {setAutoSaveError('未完事件尚待处理，自动存档暂未写入。请先处理「未完事件无法续接」提示，或下载现有进度。');refreshAutoSaveStatus();pushEv(pendingRecoveryEvent());}
}
// Scenes that were queued but never shown should not keep their palace-wide cooldowns.
function releaseUnansweredCooldowns(titles){
  const recent=S.flags.ambientRecent||{},people=S.flags.ambientPeople||{},counts=S.flags.ambientCounts||{};
  for(const title of new Set(titles)){
    if(recent[title]!==S.turn)continue;
    delete recent[title];
    for(const [id,turn] of Object.entries(people[title]||{}))if(turn===S.turn)delete people[title][id];
    if(counts[title])counts[title]--;
  }
}
function pendingRecoveryEvent(){
  return {title:'未完事件无法续接',
    text:'这份存档关闭时，还有一件事没有处理完。当前版本的游戏无法原样重现那一幕。\n人物、国库与此前的选择都已保留。可以放下那一幕，从本月继续；也可以先下载备份文件，留住原样的存档。\n在作出决定之前，这份存档不会被覆盖。',
    choices:[
      {t:'放下那一幕，从本月继续',primary:true,f:()=>{
        const unanswered=PalaceActions.abandon();if(!unanswered)return null;
        releaseUnansweredCooldowns(unanswered);
        log('未能续接的未完事件已放下，从本月继续。');
        toast('已放下未完事件，进度会照常保存。');
        A.resumePendingScenes();return null;}},
      {t:'先下载备份文件',f:()=>{A.downloadSave();pushEv(pendingRecoveryEvent());return null;}},
      {t:'暂不处理，保持存档原样',f:()=>null}]};
}
A.resumePendingScenes=function(){
  const voyage=pendingDaoVoyage();if(voyage)pushEv(voyage);
  const traveler=pendingTravelerEvent();if(traveler)pushEv(traveler);
  const swap=birthSwapSearchReport()||pendingBirthSwapJustice();if(swap)pushEv(swap);
  const official=pendingOfficialReport();if(official)pushEv(official);
  const loss=pendingConcealedLoss();if(loss)pushEv(loss);
};
A.save=function(slot){const ok=save(slot);if(ok)confirmPalaceWrite(true,'已存档',slot);else toast(palaceSaveError(slot));render()};
A.load=function(slot){
  const storage=SaveManager.getStorage();
  if(storage?.refresh){
    const before=S,turn=S?.turn;
    return storage.refresh().then(()=>{
      if(S!==before||S?.turn!==turn){toast('进度已变化，请重新选择读取');return;}
      SaveManager.forget([SKEY+slot]);restorePalaceSlot(slot);
    }).catch(()=>toast('存档暂时无法读取，请重试；当前进度仍在页面中。'));
  }
  restorePalaceSlot(slot);
};

// A report has one acknowledgement choice. Keep that tiny action in this tab
// while IndexedDB commits the usual autosave. Never store the world here.
const JINYIWEI_ACK_KEY=SKEY+'report-acknowledgements';
function readJinyiweiAcknowledgements(){
  try{
    const entries=JSON.parse(sessionStorage.getItem(JINYIWEI_ACK_KEY)||'[]');
    return Array.isArray(entries)?entries:[];
  }catch{return [];}
}
function rememberJinyiweiAcknowledgement(event){
  const storage=SaveManager.getStorage(),key=SKEY+'auto';
  if(!storage?.getConfirmedItem)return;
  try{
    // SaveManager appends savedAt last. Avoid parsing a long save on this click.
    const revision=raw=>Number(/,"savedAt":(\d+)}$/.exec(raw?.slice(-40))?.[1]);
    const revisions=[...new Set([revision(storage.getConfirmedItem(key)),revision(storage.getItem(key))].filter(Number.isFinite))];
    if(!revisions.length)return;
    const recent=readJinyiweiAcknowledgements().filter(entry=>entry?.notice!==event.jinyiweiNoticeKey);
    recent.push({notice:event.jinyiweiNoticeKey,revisions});
    sessionStorage.setItem(JINYIWEI_ACK_KEY,JSON.stringify(recent.slice(-8)));
  }catch{/* Standard autosave still runs if session storage is unavailable. */}
}
function resumeJinyiweiAcknowledgement(){
  if(!curEv?.jinyiweiNoticeKey||PalaceActions.blocked)return;
  if(readJinyiweiAcknowledgements().some(entry=>entry?.notice===curEv.jinyiweiNoticeKey&&
    Array.isArray(entry.revisions)&&entry.revisions.includes(S.savedAt)))choose(0);
}
function restorePalaceSlot(slot){
  if(!load(slot)){
    toast(SaveManager.status(SaveManager.getStorage(),SKEY+slot)==='newer'?palaceSaveError(slot):'此存档为空或无法读取');
    return;
  }
  showRestoredPalace();if(slot==='auto')resumeJinyiweiAcknowledgement();if(!modalOpen)offlineMemorials();
}

function snapshotYear(){if(typeof PalaceActions!=='undefined'){if(PalaceActions.replaying)return;if(PalaceActions.busy){PalaceActions.requestSnapshot();return;}}try{SaveManager.snapshot(SaveManager.getStorage(),SKEY+'auto',PalaceActions.payload(),validPalaceSave,{label:'y-'+S.gen+'-'+S.year,day:S.turn,date:dateStr()})}catch(e){}}
function replacePalace(data, alongside=[]){
  const previous=S;
  S=data;
  try {
    if(!data.pendingActions)migrate(false);
    if(SaveManager.save(SaveManager.getStorage(),SKEY+'auto',{...S,savedAt:Date.now()},validPalaceSave,{touch:true,alongside}))return true;
  } catch {
    S=previous;
    throw Error('存档内容不完整');
  }
  S=previous;
  return false;
}
A.rewind=function(index, savedAt){
  const snap=SaveManager.snapshots(SaveManager.getStorage(),SKEY+'auto').find(s=>
    savedAt===undefined?s.index===index:s.index===index&&s.savedAt===savedAt);
  if(!snap){toast('快照已更新，请重新选择');render();return;}
  if(!confirm(`回到${snap.date}？之后发生的事都会被改写。`))return;
  const data=SaveManager.restore(SaveManager.getStorage(),SKEY+'auto',index,validPalaceSave,migratePalaceSave,snap);
  try{
    if(!data)throw Error();
    if(!replacePalace(data)){toast(palaceSaveError('auto'));return;}
  }catch{toast('这份快照读不出来了');return;}
  resetMapPosition(S.pos);showRestoredPalace();confirmPalaceWrite(true,`已保存，回到了${dateStr()}`);
};
// Backups are downloaded files: never place the world state in the page or clipboard.
const PALACE_FILE_LIMIT=64*1024*1024;
A.downloadSave=function(){
  if(!S)return;
  let url;
  try{
    const blob=new Blob([JSON.stringify({...PalaceActions.payload(),saveVersion:SaveManager.version})],{type:'application/json'});
    url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;
    link.download=`宸宫纪-${S.year}年${S.month}月.json`;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已请求下载存档文件');
  }catch{if(url)URL.revokeObjectURL(url);toast('下载失败，请保留此页面并检查浏览器下载权限');}
};
function importPalaceFileText(raw){
  try{
    if(typeof raw!=='string'||raw.length>PALACE_FILE_LIMIT)throw Error();
    const data=SaveManager.decode(raw,validPalaceSave,migratePalaceSave);
    if(!data)throw Error();
    if(!confirm(`导入 ${data.emp.sur||''}${data.emp.name||''} 的存档文件？当前进度会先备份。`))return false;
    const alongside=S?[[PALACE_BEFORE_IMPORT,JSON.stringify({...PalaceActions.payload(),saveVersion:SaveManager.version})]]:[];
    if(!replacePalace(data,alongside)){toast(palaceSaveError('auto'));return false;}
  }catch{toast('存档文件无效，请选择本游戏下载的 JSON 备份');return false;}
  resetMapPosition(S.pos);showRestoredPalace();confirmPalaceWrite(true,'已导入并保存');return true;
}
let palaceFileReading=false;
A.readSaveFile=async function(input){
  const file=input?.files?.[0];if(!file||palaceFileReading)return;
  if(file.size>PALACE_FILE_LIMIT){input.value='';toast('文件过大，最多支持 64 MB 的游戏存档');return;}
  const previous=S,turn=S?.turn;palaceFileReading=true;
  try{
    const raw=await file.text();
    if(S!==previous||S?.turn!==turn){toast('进度已变化，请重新选择备份文件');return;}
    importPalaceFileText(raw);
  }catch{toast('文件读取失败，请重新选择');}
  finally{input.value='';palaceFileReading=false;}
};
function palaceImportBackup(){
  try{return SaveManager.decode(SaveManager.getStorage().getItem(PALACE_BEFORE_IMPORT),validPalaceSave,migratePalaceSave);}
  catch{return null;}
}
A.undoImport=function(){
  const data=palaceImportBackup();
  if(!data||!confirm('恢复到导入前的进度？'))return;
  try{
    if(!replacePalace(data)){toast(palaceSaveError('auto'));return;}
  }catch{toast('导入前的存档无法读取');return;}
  resetMapPosition(S.pos);showRestoredPalace();confirmPalaceWrite(true,'已保存，恢复到导入前的进度');
};
function migrate(resetPosition=true){if(!S)return;reconcileImmortalDiscovery();for(const c of S.consorts)if(whiteSpringRoyal(c))whiteSpringFamily(c);reconcileConsortDistinctions();reconcileRetainedFamilies();restorePalaceParentageOrigins();reconcileSelection();reconcileSelectionTiming();S.consorts.forEach(repairDeliveryChronicle);royalHouseholds().forEach(ensureMarriedLife);ensureDowager();S.rel=S.rel||{};S.pos=S.pos||{x:100,y:82};reconcileScholarArcs();reconcileRareArcs();[...S.consorts,...(S.cands||[]),...(S.shelteredGuests||[])].forEach(assignConsortPortrait);(S.cands||[]).forEach(deepen);alive().forEach(c=>{if(!c.arc)assignArc(c);deepen(c);clanKey(c)});S.children.forEach(k=>{if(k.sup===undefined)k.sup=0;ensureChildDisposition(k)});
  migrateRetiredBrotherWish();reconcileResidences();S.consorts.forEach(houseOf);S.flags.memorials ??= 0;childLifeTick();migrateMourning();reconcilePalaceRomance();
  S.children.forEach(k=>{if(!Number.isFinite(k.sup))k.sup=0;reconcilePrinceResidence(k);});alive().forEach(reconcileMotherConcern);
  NPCMemory.upgrade(S);
  ensureJewelry();reconcileMultipleBirths();
  settleMarriedPrincessEstates();
  if(resetPosition)resetMapPosition(S.pos)}
