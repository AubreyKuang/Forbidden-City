/* Fixed cast data is a catalogue, not a newly generated candidate. */
const STORY_CONSORT_CODEX=Object.freeze([Object.freeze({
  key:'gouyi',name:'赵令仪',epithet:'钩弋夫人',portrait:STORY_CONSORT_PORTRAITS.gouyi,
  source:'化用《汉书·外戚传》中河间奇女、帝前展掌的故事。赵令仪之名及入宫后的经历为游戏原创。',
  introduction:'两手自幼蜷握，唯在御前缓缓展掌。她愿被记住的是自己的名字，而不只是“祥瑞”。',
  route:'出巡 → 仪仗巡狩 → 浩荡巡狩',
  conditions:'每次花费1点精力、80万两，间隔12个月。本朝尚未遇见她，且未暂停荐选时，巡狩可开启相遇；在世妃嫔超过30位时，新人相遇按一成概率放行。',
  admission:'选择屏退围观者、亲自问她，再应她所愿接入宫中。有贵人名额则册为贵人；贵人位满时册为瑞常在。也可赠资让她归家。相遇作出选择后，本朝不再重复。',
  sequel:'钩弋掌心三幕，以及钦安殿四次问因；交好的姐妹与有嫌隙的人各有反应。读到钩弋旧事时，也会记起本朝赵令仪的真实经历。她的亲生皇子被立为太子后，另有东宫母子的专属事件。'
}),Object.freeze({key:'hongjian',name:'薛红笺',epithet:'笺铺知己',portrait:438})]);
function storyConsortBadge(key){
  const tag=key==='gouyi'?'钩弋之遇 · 帝前展掌':key==='hongjian'?'笺铺知己 · 染笺题诗':STORY_CAST_TAGS[key];
  return tag?'<span class="tag y">'+esc(tag)+'</span>':'';
}
function storyResidentHistoryButton(resident){
 const id=resident?.person?.id;
 return id!=null&&familyHostById(id)?`<button class="btn" data-onclick="A.go('consort',${Number(id)})">查看人物纪事</button>`:'';
}
function storyConsortProgress(status){return '<small class="hint">经历 · '+esc(status)+'</small>';}
function storyConsortCodex(){
  if(!S||journalContentVersion()<19)return '';
  return `<div class="story-consort-codex"><p class="hint">剧情妃有固定姓名、专属立绘与相遇故事。图鉴可随时翻阅，不会改变剧情进度。</p>${STORY_CONSORT_CODEX.filter(d=>d.key!=='hongjian'||typeof hongjianContent==='function'&&hongjianContent()).map(d=>{
    if(d.key==='hongjian')return hongjianCodexCard();
    if(!editionAllows('story',d.key))return editionLockedCard('story',d.key,d.epithet+' · '+d.name);
    const resident=livingStoryConsort('gouyi'),seen=S.flags.gouyiSeen,p=S.consorts.find(c=>c.gouyi),status=p?(!p.alive?'已入宫 · 已故':p.gone?'已入宫 · 已离宫':'已入宫'):seen?.outcome==='归家'?'已相遇 · 归家':seen?'已相遇 · 尚未入宫':'尚未相遇';
    const preview={id:'codex-'+d.key,sur:'赵',given:'令仪',age:22,trait:'沉静',rank:3,alive:true,seed:422,artPortrait:d.portrait,portraitOverride:d.portrait};
    return `<article class="story-consort-card" data-story-consort="${d.key}"><div class="story-consort-picture">${porImg(preview,200)}${storyConsortProgress(resident?.status||status)}</div><div class="story-consort-copy"><h3>${d.epithet} · ${d.name}</h3>${storyConsortBadge(d.key)}<p>${d.introduction}</p><dl><dt>典故</dt><dd>${d.source}</dd><dt>触发方法</dt><dd>${d.route}<br>${d.conditions}</dd><dt>相遇与去留</dt><dd>${d.admission}</dd><dt>入宫后续</dt><dd>${d.sequel}</dd></dl><div class="acts">${p?`<button class="btn jade" data-onclick="A.go('consort',${p.id})">查看赵令仪的经历</button>`:resident?storyResidentHistoryButton(resident):!seen?'<button class="btn jade" data-onclick="A.go(\'out\')">前往出巡</button>':''}</div></div></article>`;
  }).join('')}${storyCastCodexCards()}</div>`;
}
