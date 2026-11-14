/* Shared snapshot storage. The primary key remains readable by older builds.
   v2: older saves are migrated instead of rejected, and a few dated snapshots are kept for rewinding. */
const SaveManager = (() => {
  const version = 2;
  const SNAPSHOTS = 4;
  const observed = new Map();

  function getStorage() {
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

  function save(storage, key, data, valid, { touch = false, alongside = [] } = {}) {
    const changed = [];
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
      if (entry.content !== null && content !== entry.content) writes.push([key + ':backup', previous]);
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
    } catch {
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

  return { getStorage, load, save, snapshot, snapshots, restore, decode, status, version };
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
  return '无法写入存档，请检查浏览器存储或下载备份文件。';
}
let lastAutoSaveError='';
function save(slot){
  if(!S)return false;
  const ok=SaveManager.save(SaveManager.getStorage(),SKEY+slot,{...S,savedAt:Date.now()},validPalaceSave);
  if(slot==='auto'){
    const error=ok?'':palaceSaveError(slot);
    if(error&&error!==lastAutoSaveError)toast(error);
    lastAutoSaveError=error;
  }
  return ok;
}
function load(slot){
  const data=SaveManager.load(SaveManager.getStorage(),SKEY+slot,validPalaceSave,migratePalaceSave,true);
  if(!data)return false;
  const previous=S;
  S=data;
  try { migrate(); }
  catch { S=previous;return false; }
  return true;
}
function slotInfo(slot){
  const key=SKEY+slot;
  if(SaveManager.status(SaveManager.getStorage(),key)==='newer')return '需要新版游戏';
  const s=SaveManager.load(SaveManager.getStorage(),key,validPalaceSave);
  return s?`${s.emp.sur}${s.emp.name}·${dateStr(s)}·后妃${s.consorts.filter(c=>c.alive&&!c.gone).length}`:null;
}
function showRestoredPalace(){
  Q.length=0;curEv=null;modalOpen=false;
  modalInvoker=null;
  $('#modal').close?.();
  $('#modal').hidden=true;
  UI.view='map';UI.banquet=null;setScene('court');render();
  const voyage=pendingDaoVoyage();if(voyage)pushEv(voyage);
  const traveler=pendingTravelerEvent();if(traveler)pushEv(traveler);
}
A.save=function(slot){if(save(slot)){toast('已存档');AU.sfx('chime')}else toast(palaceSaveError(slot));render()};
A.load=function(slot){
  if(!load(slot)){
    toast(SaveManager.status(SaveManager.getStorage(),SKEY+slot)==='newer'?palaceSaveError(slot):'此存档为空或无法读取');
    return;
  }
  offlineMemorials();showRestoredPalace();
};

function snapshotYear(){try{SaveManager.snapshot(SaveManager.getStorage(),SKEY+'auto',S,validPalaceSave,{label:'y-'+S.gen+'-'+S.year,day:S.turn,date:dateStr()})}catch(e){}}
function replacePalace(data, alongside=[]){
  const previous=S;
  S=data;
  try {
    migrate(false);
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
  resetMapPosition(S.pos);showRestoredPalace();toast(`回到了${dateStr()}`);
};
// Backups are downloaded files: never place the world state in the page or clipboard.
const PALACE_FILE_LIMIT=8*1024*1024;
A.downloadSave=function(){
  if(!S)return;
  let url;
  try{
    const blob=new Blob([JSON.stringify({...S,saveVersion:SaveManager.version})],{type:'application/json'});
    if(blob.size>PALACE_FILE_LIMIT){toast('备份超过八 MB，请先减少测试版中的额外数据');return;}
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
    const alongside=S?[[PALACE_BEFORE_IMPORT,JSON.stringify({...S,saveVersion:SaveManager.version})]]:[];
    if(!replacePalace(data,alongside)){toast(palaceSaveError('auto'));return false;}
  }catch{toast('存档文件无效，请选择本游戏下载的 JSON 备份');return false;}
  resetMapPosition(S.pos);showRestoredPalace();toast('已导入并保存');return true;
}
let palaceFileReading=false;
A.readSaveFile=async function(input){
  const file=input?.files?.[0];if(!file||palaceFileReading)return;
  if(file.size>PALACE_FILE_LIMIT){input.value='';toast('文件过大，最多支持八 MB 的游戏存档');return;}
  const previous=S,turn=S?.turn;palaceFileReading=true;
  try{
    const raw=await file.text();
    if(S!==previous||S?.turn!==turn){toast('进度已变化，请重新选择备份文件');return;}
    importPalaceFileText(raw);
  }catch{toast('文件读取失败，请重新选择');}
  finally{input.value='';palaceFileReading=false;}
};
function palaceImportBackup(){
  try{return SaveManager.decode(localStorage.getItem(PALACE_BEFORE_IMPORT),validPalaceSave,migratePalaceSave);}
  catch{return null;}
}
A.undoImport=function(){
  const data=palaceImportBackup();
  if(!data||!confirm('恢复到导入前的进度？'))return;
  try{
    if(!replacePalace(data)){toast(palaceSaveError('auto'));return;}
  }catch{toast('导入前的存档无法读取');return;}
  resetMapPosition(S.pos);showRestoredPalace();toast('已恢复导入前的进度');
};
function migrate(resetPosition=true){if(!S)return;royalHouseholds().forEach(ensureMarriedLife);ensureDowager();S.rel=S.rel||{};S.pos=S.pos||{x:100,y:82};reconcileScholarArcs();reconcileRareArcs();[...S.consorts,...(S.cands||[])].forEach(assignConsortPortrait);(S.cands||[]).forEach(deepen);alive().forEach(c=>{if(!c.arc)assignArc(c);deepen(c);clanKey(c)});S.children.forEach(k=>{if(k.sup===undefined)k.sup=0;ensureChildDisposition(k)});
  alive().forEach(houseOf);S.flags.memorials ??= 0;childLifeTick();migrateMourning();reconcilePalaceRomance();
  S.children.forEach(k=>{if(!Number.isFinite(k.sup))k.sup=0;reconcilePrinceResidence(k);});alive().forEach(reconcileMotherConcern);
  NPCMemory.upgrade(S);
  ensureJewelry();
  if(resetPosition)resetMapPosition(S.pos)}
