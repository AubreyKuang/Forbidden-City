/* Shared snapshot storage. The primary key remains readable by older builds.
   v2: older saves are migrated instead of rejected, and a few dated snapshots are kept for rewinding. */
const SaveManager = (() => {
  const version = 2;
  const SNAPSHOTS = 4;
  function decode(raw, valid, migrate) {
    try {
      let data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      const from = data.saveVersion ?? 1;
      if (from > version) return null;
      if (from < version && migrate) data = migrate(data, from);
      if (!data || !valid(data)) return null;
      return data;
    } catch {
      return null;
    }
  }

  function load(storage, key, valid, migrate) {
    try {
      return decode(storage.getItem(key), valid, migrate) || decode(storage.getItem(key + ':backup'), valid, migrate);
    } catch {
      return null;
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
  function snapshot(storage, key, data, valid, meta = {}) {
    const raw = JSON.stringify({ ...data, saveVersion: version });
    if (!decode(raw, valid)) return false;
    let list = readSnapshots(storage, key).filter(entry => entry.label !== meta.label);
    list.push({ ...meta, savedAt: Date.now(), raw });
    list = list.slice(-SNAPSHOTS);
    while (list.length) {
      try { storage.setItem(key + ':snapshots', JSON.stringify(list)); return true; } catch { list.shift(); }
    }
    return false;
  }
  function snapshots(storage, key) {
    return readSnapshots(storage, key).map(({ raw, ...meta }, index) => ({ ...meta, index }));
  }
  function restore(storage, key, index, valid, migrate) {
    const entry = readSnapshots(storage, key)[index];
    return entry ? decode(entry.raw, valid, migrate) : null;
  }

  function save(storage, key, data, valid) {
    try {
      const next = JSON.stringify({ ...data, saveVersion: version });
      if (!decode(next, valid)) return false;
      const previous = storage.getItem(key);
      if (previous === next) return true;
      if (decode(previous, valid)) storage.setItem(key + ':backup', previous);
      storage.setItem(key, next);
      return true;
    } catch {
      return false;
    }
  }

  return { load, save, snapshot, snapshots, restore, version };
})();

/* ============ 存档 ============ */
const SKEY='chengongji_v1_';
const validPalaceSave=s=>!!s.emp&&Array.isArray(s.consorts)&&Array.isArray(s.children)&&Number.isFinite(s.turn);
function save(slot){if(S)S.savedAt=Date.now();return S&&SaveManager.save(localStorage,SKEY+slot,S,validPalaceSave)}
// v1 存档照常读取；缺的父兄、立场等字段由 migrate() 在读档后补上
const migratePalaceSave=(s,from)=>s;
function load(slot){const data=SaveManager.load(localStorage,SKEY+slot,validPalaceSave,migratePalaceSave);if(!data)return false;S=data;return true}
function slotInfo(slot){const s=SaveManager.load(localStorage,SKEY+slot,validPalaceSave);return s?`${s.emp.sur}${s.emp.name}·${dateStr(s)}·后妃${s.consorts.filter(c=>c.alive&&!c.gone).length}`:null}
A.save=function(slot){if(save(slot)){toast('已存档');AU.sfx('chime')}else toast('存档失败：浏览器禁用了本地存储');render()};
A.load=function(slot){if(load(slot)){Q.length=0;migrate();offlineMemorials();UI.view='map';toast('已读档');setScene('court');UI.banquet=null;render()}else toast('该存档为空')};

/* ---- 岁首快照：每年正月留一份，最多四份 ---- */
function snapshotYear(){try{SaveManager.snapshot(localStorage,SKEY+'auto',S,validPalaceSave,{label:'y-'+S.gen+'-'+S.year,day:S.turn,date:dateStr()})}catch(e){}}
A.rewind=function(index){
  const snap=SaveManager.snapshots(localStorage,SKEY+'auto').find(s=>s.index===index);
  if(!snap||!confirm(`回到${snap.date}？之后发生的事都会被改写。`))return;
  const data=SaveManager.restore(localStorage,SKEY+'auto',index,validPalaceSave,(s)=>s);
  if(!data){toast('这份快照读不出来了');return}
  S=data;Q.length=0;migrate();UI.view='map';setScene('court');toast(`回到了${dateStr()}`);save('auto');render();
};

A.exportSave=function(){try{const t=btoa(unescape(encodeURIComponent(JSON.stringify(S))));const ta=$('#savecode');ta.value=t;ta.focus();ta.select();
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('存档码已复制'),()=>toast('已选中，请手动复制'));else toast('已选中，请手动复制')}catch(e){toast('导出失败')}};
A.importSave=function(){try{const t=$('#savecode').value.trim();const s=JSON.parse(decodeURIComponent(escape(atob(t))));if(!s.emp)throw 0;S=s;Q.length=0;migrate();UI.view='map';toast('已导入存档');render()}catch(e){toast('存档码无效，请检查是否复制完整')}};
function migrate(){if(!S)return;ensureDowager();S.rel=S.rel||{};S.pos=S.pos||{x:100,y:82};reconcileScholarArcs();reconcileRareArcs();[...S.consorts,...(S.cands||[])].forEach(assignConsortPortrait);(S.cands||[]).forEach(deepen);alive().forEach(c=>{if(!c.arc)assignArc(c);deepen(c);clanKey(c)});S.children.forEach(k=>{if(k.sup===undefined)k.sup=0});
  alive().forEach(houseOf);S.flags.memorials ??= 0;childLifeTick();migrateMourning();
  resetMapPosition(S.pos)}
