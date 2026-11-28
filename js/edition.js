/* Edition gate. The web and TapTap builds define no edition config, so every character is
   open. A build may define globalThis.PALACE_EDITION_CONFIG before this file, e.g.
   {edition:'xhs',allow:{story:['ayimu'],fenghua:['shangguanLantai']}}; a roster with an
   allow-list then only offers the listed people. Locked people are never introduced or
   created, and codex cards show them as "敬请期待". */
const PALACE_EDITION=(()=>{
  const config=(typeof globalThis!=='undefined'&&globalThis.PALACE_EDITION_CONFIG)||null;
  const name=config&&typeof config.edition==='string'?config.edition:'web';
  const allow=config&&config.allow&&typeof config.allow==='object'?config.allow:{};
  function allows(kind,key){const list=allow[kind];return !Array.isArray(list)||list.includes(key);}
  function locked(kind,key){return !allows(kind,key);}
  // Small hosts keep fewer copies: config.saveSnapshots (rewind points, default 4) and
  // features.saveBackups (the previous copy kept beside each slot, default on).
  const saveSnapshots=config&&Number.isInteger(config.saveSnapshots)&&config.saveSnapshots>=0?config.saveSnapshots:4;
  const maxGenerations=config&&Number.isInteger(config.maxGenerations)&&config.maxGenerations>0?config.maxGenerations:null;
  // Features default to on; a host build can switch off what its container forbids,
  // e.g. {saveExport:false (no file download/import), browserStorage:false,
  // cardsDock:false (翻牌子 leaves the bottom bar and opens from 后宫, js/cards-sheet.js)}.
  const features=config&&config.features&&typeof config.features==='object'?config.features:{};
  const feature=key=>features[key]===undefined?true:features[key];
  // A host build may sell products (config.shop, see js/palace-shop.js); others have none.
  const shop=config&&config.shop&&typeof config.shop==='object'?config.shop:null;
  // A host build may run a tighter treasury (config.economy, read through economyRule in
  // js/game.js); others keep the original numbers.
  const economy=config&&config.economy&&typeof config.economy==='object'?config.economy:null;
  return Object.freeze({name,shop,economy,allows,locked,maxGenerations,saveSnapshots,feature,limited:kind=>Array.isArray(allow[kind]),list:kind=>Array.isArray(allow[kind])?allow[kind].slice():null});
})();
function editionAllows(kind,key){return PALACE_EDITION.allows(kind,key);}
// A codex card for a character this edition does not open yet: no portrait, no route.
function editionLockedCard(kind,key,title){
  const safe=String(title).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  return `<article class="story-consort-card edition-locked" data-edition-locked="${kind}:${key}"><div class="story-consort-picture"><div class="edition-locked-portrait" aria-hidden="true">未解锁</div><small class="hint">经历 · 未解锁</small></div><div class="story-consort-copy"><h3>${safe}</h3><p>敬请期待</p></div></article>`;
}

// An edition may stop the reign line after a few emperors (config.maxGenerations; S.gen
// starts at 1). When the last allowed emperor's reign ends, the throne is not handed on:
// the player sees a summary of the reigns so far and can start a new game.
function editionReignLimitReached(){
  const max=PALACE_EDITION.maxGenerations;
  return max!==null&&typeof S!=='undefined'&&!!S&&S.gen>=max;
}
function editionTrialEndEvent(){
  const reigns=(S.history||[]).slice(0,PALACE_EDITION.maxGenerations||undefined);
  const lines=reigns.map((h,i)=>`第${typeof cnNum==='function'?cnNum(i+1):i+1}代 · ${h.miao||''} ${h.sur}${h.name}${h.era?' · '+h.era:''}${h.yrs?' · 在位'+h.yrs+'年':''}${h.shi?' · 谥「'+h.shi+'皇帝」':''}`);
  const kin=S.children?S.children.length:0;
  S.over=true;S.flags=S.flags||{};S.flags.editionTrialEnd={gen:S.gen,turn:S.turn};
  return {title:'试玩到此为止',por:'emp',scene:'edition-trial-end',
    text:`${reigns.length}朝本纪至此合卷。\n${lines.join('\n')}${kin?`\n末代宫中留下皇嗣${kin}人，他们的故事暂且停在这里。`:''}\n完整版敬请期待。你可以翻阅本纪，或新开一局。`,
    choices:[{t:'翻阅三朝本纪',f:()=>{UI.view='regnal';UI.sel=undefined;return null;}},{t:'新开一局',f:()=>{S=null;UI.view='title';return null;}}]};
}
function editionTrialEndChoice(){return {t:'试玩到此为止 · 查看三朝本纪',f:()=>{pushNow(editionTrialEndEvent());return null;}};}
