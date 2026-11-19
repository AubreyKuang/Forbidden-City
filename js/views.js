/* ============ 渲染 ============ */
function bar(l,v,c){v=rd(v);return `<div class="bar"><span>${l}</span><i><b style="width:${clamp(v)}%;${c?`background:${c}`:''}"></b></i><em>${v}</em></div>`}
function renderTop(){
  const t=$('#top');
  const devLaunch=typeof DEV==='undefined'?'':'<button id="dev-launch" type="button" aria-controls="dev-panel" onclick="DEV.open()">DEV · 金手指</button>';
  const sound=`<span class="music-controls"><button id="snd" class="btn sm${AU.on?' on':''}" aria-pressed="${AU.on}" aria-labelledby="snd-label" onclick="AU.toggle()"><span aria-hidden="true">♪</span> <span id="snd-label">${AU.on?'声音：开':'开启声音'}</span></button>
    <select id="music-track" aria-label="背景配乐" onchange="AU.selectTrack(this.value)">${Object.entries(PALACE_MUSIC).map(([id,track])=>
      `<option value="${id}"${AU.track===id?' selected':''}>${track.name}</option>`).join('')}</select></span>`;
  if(!S){t.innerHTML=`<span class="brand">宸宫纪</span><span class="sp"></span>${sound}${devLaunch}`;return}
  const e=E(),mx=maxEnergy();let pips='';for(let i=0;i<mx;i++)pips+=`<span class="pip${i<e.energy?'':' off'}"></span>`;
  const hd=e.health>=80?'康健':e.health>=55?'安好':e.health>=30?'欠安':'病笃';
  t.innerHTML=`<div class="hud-identity">${porImg('emp',38)}<div class="hud-name"><span class="date">${esc(dateStr())}</span><span class="hud-person">${esc(e.sur+e.name)} · ${e.age}岁</span></div></div>
   <div class="hud-stats"><span class="st" title="${hd}">龙体 <b>${rd(e.health)}</b></span><span class="st">威望 <b>${rd(e.prestige)}</b></span><span class="st" title="民心范围 0–100">民心 <b>${rd(e.people)}</b>${e.people>=100?'<small>（上限）</small>':''}</span>
   <span class="st">国库 <b>${e.treasury}</b>万两</span><span class="st">精力 <b>${e.energy}／${mx}</b><span aria-hidden="true">${pips}</span></span></div>
   <div class="hud-controls">${sound}${devLaunch}<button id="finish-month" class="btn gold sm hud-next" onclick="A.finishMonth()" ${S.over?'disabled':''}>结束本月 ▸</button></div>
   ${lastAutoSaveError&&lastAutoSaveError!==dismissedSaveError?`<div class="hud-save-warning"><span role="status"><strong>未能存档</strong> · ${esc(lastAutoSaveError)}</span><button class="btn sm" onclick="A.save('auto')">重试</button><button class="btn sm" onclick="A.downloadSave()">下载备份</button><button class="btn sm" aria-label="关闭存档提示" onclick="A.dismissSaveError()">关闭</button></div>`:''}`;
}
const MENU=[['map','宫城'],['home','御书房'],['court','理政'],['harem','后宫'],['cards','翻牌子'],['xx','选秀'],['kids','皇嗣'],['family','家族'],['out','出巡'],['log','起居注'],['sys','存档']];
// One restrained gold-line family, with distinct silhouettes at mobile sizes.
const DOCK_ART={
  map:'M3 20h26M5 18h22M7 18v-6m6 6v-6m6 6v-6m6 6v-6M3 11h26L25 8H7zM8 7h16l-3-3H11zM16 2v2M12 24h8v-4',
  home:'M16 7C12 4 7 4 3 5v19c5-1 9 0 13 3 4-3 8-4 13-3V5c-4-1-9-1-13 2v20M7 10h5m-5 4h5m8-4h5m-5 4h5',
  court:'M7 4h18v23H7M4 4h6M4 27h6M22 4h6m-6 23h6M12 10h8m-8 5h8m-8 5h5',
  harem:'M16 25C6 24 3 18 3 13c5 0 9 3 13 12 4-9 8-12 13-12 0 5-3 11-13 12zM16 22C9 17 10 9 16 4c6 5 7 13 0 18zM7 9c-1 6 1 10 5 13M25 9c1 6-1 10-5 13M6 28h20',
  cards:'M12 6V3h8v3M10 6h12l2 4v18H8V10zM16 11v10m-3-7h6m-6 4h6M14 24h4',
  xx:'M16 21c-7-1-11-5-9-9 3-1 6 1 9 5-2-6-2-10 1-13 4 2 5 6 3 11 4-3 7-4 10-2 0 5-5 8-11 9M16 21v8m0-3-6-3m6 2 6-2M4 8l2-2',
  kids:'M5 10l5 5 6-9 6 9 5-5-3 14H8zM8 27h16M11 20h10M16 3v1M3 7l1 1m24 0 1-1',
  family:'M16 28V16M16 21l-8-5m8 5 8-5M16 15C7 16 3 12 5 7c4-2 8 0 11 5 3-5 7-7 11-5 2 5-2 9-11 8zM16 12V3M12 28h8',
  out:'M5 13h22l-2 13H7zM2 12l6-7h16l6 7M10 5v8m12-8v8M12 18h8v8M3 28h26M16 2v3',
  log:'M4 5h10l2 3 2-3h10v22H18l-2 2-2-2H4zM16 8v21M8 11h4m-4 5h4m-4 5h4m8-10h4m-4 5h4m-4 5h4',
  sys:'M6 4h17l4 4v20H5V4zM11 4v8h10V4M10 28V18h12v10M18 7v2'
};
function dockIcon(key){return `<svg class="dock-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${DOCK_ART[key]}"></path></svg>`;}
function renderMenu(){const m=$('#menu');if(!S){m.innerHTML='';m.hidden=true;return}m.hidden=false;
  const current={government:'court',ministries:'court',scholar:'court',fenghua:'home',jinyiwei:'court',residences:'harem',officials:'home',official:'home',jewelry:'home',natal:'family','white-spring-kin':'family',relative:'family',palace:'map',place:'map',banquet:'map',consort:'harem',kid:'kids',princess:'out',regnal:'log'}[UI.view]||UI.view;
  m.innerHTML=MENU.map(([k,l])=>`<button class="btn${current===k?' on':''}" ${current===k?'aria-current="page"':''} onclick="${k==='court'?"A.go('government')":`A.go('${k}')`}">${dockIcon(k)}<span>${l}</span></button>`).join('');
}
let panelRoute;
let personBackStack=[];
const PERSON_DETAIL_VIEWS=['consort','kid','relative','official','natal','white-spring-kin','household-child'];
function rememberPersonRoute(view,id){
  if(!PERSON_DETAIL_VIEWS.includes(view)){personBackStack=[];return;}
  if(!PERSON_DETAIL_VIEWS.includes(UI.view)||personBackStack.at(-1)?.state!==S)personBackStack=[];
  if(view===UI.view&&id===UI.sel)return;
  const panel=$('#panel'),graph=panel.querySelector?.('.graph-wrap');
  personBackStack.push({state:S,view:UI.view,id:UI.sel,scroll:panel.scrollTop,
    graphX:graph?.scrollLeft,graphY:graph?.scrollTop,
    branches:[...(panel.querySelectorAll?.('.family-branch')||[])].map(branch=>branch.open)});
}
function personBackButton(fallback){
  const source=personBackStack.at(-1);
  const view=source?.state===S?source.view:fallback;
  const label={residences:'宫室分配',officials:'官员表',official:'父兄详情',ministries:'六部',scholar:'朝臣详情',consort:'妃嫔详情',kid:'皇嗣详情',princess:'公主府','prince-estate':'王府',palace:'宫殿',place:'上一地点'}[view]||
    MENU.find(([id])=>id===view)?.[1]||'上一页';
  return `<button class="btn quiet sm detail-back" onclick="A.backPerson('${fallback}')">← 返回${esc(label)}</button>`;
}
// List pages reached from several places return to the page that opened them.
const PAGE_ORIGIN_VIEWS=['officials','residences'];
const PAGE_BACK_LABEL={home:'御书房',government:'治国理政',map:'宫城',harem:'后宫',family:'家族',kids:'皇嗣'};
function pageBackButton(page,fallback){
  const from=UI.pageFrom?.[page],target=PAGE_BACK_LABEL[from]?from:fallback;
  return `<button class="btn quiet sm detail-back" onclick="A.go('${target}')">← 返回${PAGE_BACK_LABEL[target]}</button>`;
}
A.backPerson=function(fallback){
  const source=personBackStack.pop();
  if(!source||source.state!==S){A.go(fallback);return;}
  UI.view=source.view;UI.sel=source.id;AU.sfx('click');render();
  const panel=$('#panel'),graph=panel.querySelector?.('.graph-wrap');
  panel.querySelectorAll?.('.family-branch').forEach((branch,i)=>{branch.open=!!source.branches[i];});
  if(graph){graph.scrollLeft=source.graphX||0;graph.scrollTop=source.graphY||0;}
  panel.scrollTop=source.scroll||0;
};
function renderPanel(){
  const p=$('#panel'),v=UI.view;
  const route=JSON.stringify([v,UI.sel]);
  if(!S)p.innerHTML=v==='new'?viewNew():viewTitle();
  else if(v==='regnal'&&regnalChronicleActive())p.innerHTML=viewRegnalChronicle();
  else p.innerHTML=({government:viewGovernment,residences:viewResidences,officials:officialsRoster,official:viewOfficial,ministries:typeof viewMinistries==='function'?viewMinistries:viewGovernment,scholar:typeof viewScholar==='function'?viewScholar:viewGovernment,jinyiwei:typeof viewJinyiwei==='function'?viewJinyiwei:viewGovernment,jewelry:viewJewelryVault,natal:viewNatalRelative,'white-spring-kin':viewWhiteSpringKin,relative:viewRoyalRelative,family:viewFamily,map:viewMap,palace:viewPalace,place:viewPlace,banquet:viewBanquet,home:viewHome,fenghua:typeof viewFenghuaPerson==='function'?viewFenghuaPerson:viewHome,harem:viewHarem,consort:viewConsort,cards:viewCards,xx:viewXX,outer:typeof outerRegisterView==="function"?outerRegisterView:viewKids,kids:viewKids,kid:viewKid,princess:viewPrincessEstate,'prince-estate':viewPrinceEstate,'household-child':viewHouseholdChild,out:viewOut,log:viewLog,sys:viewSys}[v]||viewHome)();
  if(S&&v==='xx')rememberSelectionBlurt(selectionCurrent());
  if(route!==panelRoute){p.scrollTop=0;panelRoute=route;}
}
function render(){
  if(exhaustedMonthNotice&&!exhaustedMonthReady())clearExhaustedMonthNotice();
  const app=$('#app');
  app.setAttribute('data-layout',S?'game':UI.view==='new'?'setup':'landing');
  app.setAttribute('data-view',UI.view);
  drawScene();
  renderTop();renderMenu();renderPanel();if(S&&UI.view==='map')mountMap();
}
function viewTitle(){
  const slots=['auto','1','2','3'].map(s=>({s,i:slotInfo(s)})).filter(x=>x.i);
  return `<div class="title-wrap"><div class="eyebrow">FORBIDDEN CITY · v${PalaceActions.releaseVersion}</div><h1>宸宫纪</h1>
   <p class="intro">在宫城里处理朝政、走访后宫，写下属于你的一朝本纪。</p>
   <button class="btn gold" onclick="A.newGame()">新开一局</button>
   ${slots.length?`<div class="save-list">${slots.map(x=>`<button class="btn sm" onclick="A.load('${x.s}')">读取${x.s==='auto'?'自动存档':'存档'+x.s}：${esc(x.i)}</button>`).join('')}</div>`:''}</div>`}
function viewNew(){
  const profile=journalContentVersion()>=85?dynastyProfile():[];
  const legacies=dynastyFollowupActive()?dynastyLegacySources():[];
  return `<section class="story-scene coronation-scene" aria-labelledby="coronation-title">
    <header><p>宸极殿</p><h2 id="coronation-title">登基大典</h2></header>
  </section>
  <form class="coronation-form" onsubmit="event.preventDefault();A.start()">
    <input type="hidden" id="f-dynasty-meta" value="${esc(JSON.stringify(profile))}">
    <div class="coronation-names">
      <label>国姓<input id="f-sur" class="inp" maxlength="2" value="萧"></label>
      <label>名讳<input id="f-name" class="inp" maxlength="2" value="${pick(['彻','珩','翊','昭','衍','恪'])}"></label>
      <label>年号<input id="f-era" class="inp" maxlength="2" value="${pick(ERAS)}"></label>
    </div>
    <fieldset class="coronation-styles"><legend>帝王性情</legend>
      <div>${Object.entries(STYLES).map(([k,d],i)=>`<label class="opt"><input type="radio" name="f-style" value="${k}" ${i===0?'checked':''}><span><b>${k}</b><span class="hint">${d}</span></span><span class="opt-check" aria-hidden="true">✓ 已选</span></label>`).join('')}</div>
    </fieldset>
    ${profile.includes('grown')?`<fieldset class="coronation-styles"><legend>成就解锁 · 选择帝王画像</legend><div>${[['default','随性情选择'],['0','文雅画像'],['1','英武画像']].map(([id,label],i)=>`<label class="opt"><input type="radio" name="f-dynasty-portrait" value="${id}" ${i===0?'checked':''}><span><b>${label}</b></span><span class="opt-check" aria-hidden="true">✓ 已选</span></label>`).join('')}</div></fieldset>`:''}
    <fieldset class="coronation-styles"><legend>开局剧本</legend>
      <div>${Object.entries(DYNASTY_SCENARIOS).filter(([,scenario])=>!scenario.unlock||profile.includes(scenario.unlock)).map(([id,scenario],i)=>`<label class="opt"><input type="radio" name="f-scenario" value="${id}" ${i===0?'checked':''}><span><b>${esc(scenario.name)}</b><span class="hint">${esc(scenario.description)}</span></span><span class="opt-check" aria-hidden="true">✓ 已选</span></label>`).join('')}</div>
    </fieldset>
    ${profile.length?`<p class="hint">已继承成就奖励：${profile.includes('reigns')?'承祧之君剧本 ':''}${profile.includes('children')?'家学仁厚（开局民心+3） ':''}${profile.includes('companionship')?'皇后礼冠 ':''}${profile.includes('grown')?'选择帝王画像 ':''}</p>`:''}
    ${legacies.length?`<fieldset class="coronation-styles"><legend>前局传承</legend>
      <input type="hidden" id="f-dynasty-legacies" value="${esc(JSON.stringify(legacies))}">
      <label>先朝<select id="f-dynasty-legacy"><option value="">从本朝开始</option>
        ${legacies.map((r,i)=>`<option value="${i}">${esc(r.predecessor)} · ${esc(r.era)} · 声望 ${r.prestige} · ${esc(r.trait)} · ${r.slot==='auto'?'自动存档':`存档${r.slot}`}</option>`).join('')}
      </select></label><p class="hint">选定一位旧档君主，将他的声望、家训和一项特质传给新君。</p></fieldset>`:''}
    <div class="coronation-actions"><button type="button" class="btn quiet sm" onclick="A.go('title')">返回</button><button type="submit" class="btn primary">登基</button></div>
  </form>`}
function consortCard(c){
  const tags=[xinTag(c),c.visitor?'<span class="tag y">母亲在宫</span>':'',c.preg>=2?'<span class="tag r">有孕</span>':'',c.cold?'<span class="tag k">冷宫</span>':'',c.rank===8?'<span class="tag y">中宫</span>':''].join('');
  return `<button class="card portrait-card" onclick="A.go('consort',${c.id})">${porImg(c,84)}<div class="grow"><div class="nm">${esc(cName(c))}</div><div>${esc(fullName(c))} · ${c.age}岁 · ${c.homeLeave?homeLeaveStatus(c):c.templeStay?'护国寺':esc(c.palace)}</div><div>${tags}<span class="tag">${c.trait}</span>${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}</div>${bar('恩宠',c.favor)}${bar('心情',c.mood,'#4f9078')}</div></button>`}

function dowagerFamilyPanel(){
  const d=ensureDowager();
  if(!d)return '';
  const name=d.name==='太后'?d.sur+'太后':d.name;
  const portrait=dowagerPerson(d);
  const kin=S.consorts.filter(c=>!c.maid&&clanKey(c)===d.clan);
  return `<section class="dowager-family" aria-label="太后与母家亲族">
    <div class="dowager-line"><div class="dowager-person">${porImg({...portrait,alive:d.alive},64)}<span><strong>${esc(name)}</strong><small>${d.alive?'慈宁宫':'已故'}</small></span></div>
      <span class="family-link">${esc(d.relation||'母子')} →</span><button class="btn quiet dowager-person" onclick="A.go('home')">${porImg('emp',52)}<span><strong>${esc(E().sur+E().name)}</strong><small>皇帝</small></span></button></div>
    ${S.flags.birthDowager?`<div class="dowager-line">${porImg(dowagerPerson(S.flags.birthDowager),64)}<span><strong>${esc(S.flags.birthDowager.name)}</strong><small>生母 · ${esc(S.flags.birthDowager.fullName)}${S.flags.birthDowager.alive?'':' · 已故'}</small></span></div>`:''}
    <div class="dowager-clan"><span class="family-link">母家同族 ↳</span><div><strong>${esc(clanName(d.clan))}</strong>
      <p class="hint">${kin.length?kin.map(c=>esc(fullName(c))).join('、'):'尚无母家族女入宫'}</p><small>下方按父亲分支，同父姐妹共用一个父亲节点。</small></div></div></section>`;
}

/* ---- 系谱：同族 → 父亲 → 女儿 → 皇嗣；父亲身份唯一 ---- */
function familyGraphSVG(){
  const kids=new Map();
  for(const k of kidsAlive()){
    if(!kids.has(k.mom))kids.set(k.mom,[]);
    kids.get(k.mom).push(k);
  }
  S.consorts.forEach(houseOf);
  const maternal=S.flags.dowager?.clan;
  const people=S.consorts.filter(c=>(c.alive&&!c.gone&&!c.maid)||kids.has(c.id));
  if(journalContentVersion()>=33&&layeredFamilyActive()){
    const represented=new Set(people.map(c=>c.house?.father.id));
    for(const {father} of familyTreeRegistry().nodes){
      if(!father||represented.has(father.h.father.id)||!S.consorts.includes(father.c))continue;
      people.push(father.c);represented.add(father.h.father.id);
    }
  }
  people.sort((a,b)=>Number(clanKey(b)===maternal)-Number(clanKey(a)===maternal)||
    clanKey(a).localeCompare(clanKey(b),'zh-CN')||(a.fatherId-b.fatherId)||b.rank-a.rank);
  if(!people.length)return '<p class="hint">目前没有入宫的妃嫔。</p>';
  const groups=new Map();
  people.forEach((c,index)=>{
    const key=familyGroupKey(c);
    if(!groups.has(key))groups.set(key,{key,label:whiteSpringRoyal(c)?'白泉王室':hasClan(c)?clanName(key):c.sur+'家',fathers:new Map(),indices:[]});
    const group=groups.get(key),father=houseOf(c)?.father;
    group.indices.push(index);
    const id=father?.id||'unlisted-'+c.id;
    if(!group.fathers.has(id))group.fathers.set(id,{father,person:c,indices:[]});
    group.fathers.get(id).indices.push(index);
  });
  const positions=new Map();let columns=0;
  for(const group of groups.values()){
    group.hidden=familyGroupHidden(group.key);group.start=columns;
    if(group.hidden)columns++;else for(const index of group.indices)positions.set(index,columns++);
    group.end=columns-1;
  }
  const shown=people.filter((c,i)=>positions.has(i));
  const col=layeredFamilyActive()?286:190,cardWidth=layeredFamilyActive()?264:168,W=columns*col+24;
  const clanY=12,clanHeight=familyVisibilityActive()?64:54,houseY=98,houseHeight=layeredFamilyActive()?Math.max(68,...shown.map(familyHouseHeight)):56+44*Math.max(1,...shown.map(c=>brotherRoles(houseOf(c)).length+natalPeople(c.house).length)),consortY=houseY+houseHeight+38,consortHeight=82;
  const childY=consortY+128,childHeight=66,childStep=childHeight+12;
  const H=shown.length?childY+Math.max(0,...shown.map(c=>kids.get(c.id)?.length||0))*childStep+12:clanY+clanHeight+12;
  const x=i=>12+col*(positions.get(i)+.5),blood='#996a48',consortBottom=consortY+consortHeight;
  const line=(x1,y1,x2,y2,color)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.8"/>`;
  const at=(cx,y,height)=>`--graph-x:${cx}px;--graph-y:${y}px;--graph-card-height:${height}px`;
  const label=(name,role,p)=>`<span class="graph-person"><span class="family-name-row"><strong>${esc(name)}</strong>${p?familyAgeNote(p):''}</span><small>${esc(role)}</small></span>`;
  let backgrounds='',wires='',cards='';
  for(const group of groups.values()){
    const left=12+col*(group.start+.5),right=12+col*(group.end+.5),center=(left+right)/2;
    backgrounds+=`<rect x="${left-col/2+3}" y="4" width="${right-left+col-6}" height="${group.hidden?clanY+clanHeight+4:H-8}" rx="9" fill="#fffaec" fill-opacity=".48" stroke="#cbb594"/>`;
    cards+=`<div class="graph-card graph-clan${group.key===maternal?' maternal-clan':''}" data-clan="${esc(group.key)}" style="${at(center,clanY,clanHeight)};width:${Math.min(320,right-left+cardWidth)}px">
      ${label(group.label,(cousinFamiliesActive()?'在宫妃嫔 '+(hasClan(people[group.indices[0]])?clanPalaceCount(group.key):group.indices.filter(i=>people[i].alive&&!people[i].gone&&!people[i].maid).length)+' 人 · ':'')+(group.key===maternal?'太后母家 · 同族系谱':group.fathers.size>1?'同族 · 按父亲分房':'父系家谱'))}${familyVisibilityButton(group.key,group.label)}</div>`;
    if(group.hidden)continue;
    const branches=[...group.fathers.values()];
    const fatherX=branch=>(x(branch.indices[0])+x(branch.indices.at(-1)))/2;
    wires+=`<path d="M${center} ${clanY+clanHeight} V80 M${fatherX(branches[0])} 80 H${fatherX(branches.at(-1))}" fill="none" stroke="#a68b68" stroke-dasharray="4 3"/>`;
    for(const branch of branches){
      const {person:c,father,indices}=branch,cx=fatherX(branch),h=houseOf(c),stance=stanceOf(c),color=BLOC_COLOR[stance]||'#8a8277';
      wires+=`<path d="M${cx} 80 V${houseY}" stroke="#a68b68" stroke-dasharray="4 3"/>`;
      if(whiteSpringRoyal(c)){
        cards+=`<div class="graph-card graph-house" style="${at(cx,houseY,houseHeight)}">${whiteSpringKinLinks(c)||'<strong>白泉王室</strong><div>父王 · 王兄</div>'}</div>`;
        wires+=line(cx,houseY+houseHeight,cx,consortY,blood);
      }else if(h){
        const military=stance==='army'?1:0;
        const kin=(person,role,office)=>person?`<button class="graph-kin-person${!person.alive?' deceased':''}" onclick="A.go('official','${c.id}:${role}')" aria-label="查看${esc(person.name)}">${porImg(person,34)}${label(person.name,`${role==='father'?(indices.length>1?'父亲 · 亲姐妹同父':'父亲'):officialKinLabel(h,role)} · ${officialStatus(person)} · ${office}`)}</button>`:'';
        cards+=`<div class="graph-card graph-house" data-father-id="${c.fatherId}" data-person-id="${esc(father.id)}" style="${at(cx,houseY,houseHeight)};--house-color:${color}">
          ${layeredFamilyActive()?familyHouseTree(c):`${kin(father,'father',father.office)}${brotherRoles(h).map(role=>kin(h[role],role,h[role].post)).join('')}${natalPeople(h).map(p=>`<button class="graph-kin-person${p.alive?'':' deceased'}" onclick="A.go('natal','${c.id}:${p.id}')" aria-label="查看${esc(p.name)}">${porImg(natalPortrait(p),34)}${label(p.name,natalLabel(c,p)+' · '+natalAge(p)+'岁 · '+natalStatus(p))}</button>`).join('')}`}</div>`;
        // One shared trunk and sibling rail; every daughter connects directly below her father.
        wires+=`<g class="paternal-links" data-parent-id="${esc(father.id)}">${line(cx,houseY+houseHeight,cx,consortY-19,blood)}${line(x(indices[0]),consortY-19,x(indices.at(-1)),consortY-19,blood)}
          ${indices.map(index=>`<path data-child-id="${people[index].id}" d="M${x(index)} ${consortY-19} V${consortY}" stroke="${blood}" stroke-width="1.8"><title>${esc(father.name)}之女 ${esc(fullName(people[index]))}</title></path>`).join('')}</g>`;
      }
    }
  }
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    if(!positions.has(i)||!positions.has(j))continue;
    const a=people[i],b=people[j],v=relGet(a,b);
    if(Math.abs(v)<30)continue;
    const x1=x(i),x2=x(j),lift=consortBottom+21+Math.min(34,(x2-x1)/12);
    wires+=`<path d="M${x1} ${consortBottom} Q${(x1+x2)/2} ${lift} ${x2} ${consortBottom}" fill="none" stroke="${v>0?'#4f9078':'#b8473c'}" stroke-width="${1+Math.abs(v)/40}" ${v>0?'':'stroke-dasharray="4 3"'}><title>${esc(fullName(a))} 与 ${esc(fullName(b))}：${v>0?(socialPair(a,b)?'亲近':'敬重'):'不和'}</title></path>`;
  }
  people.forEach((c,i)=>{
    if(!positions.has(i))return;
    const cx=x(i),children=kids.get(c.id)||[],rail=cx-col/2+8;
    cards+=`<button class="graph-card graph-consort${c.rank===8?' graph-crown':''}" style="${at(cx,consortY,consortHeight)}" onclick="A.go('consort',${c.id})">${porImg(c,52)}${label(fullName(c),!c.alive?'已故':c.gone?'已出宫':cName(c),c)}</button>`;
    if(children.length){
      const last=childY+(children.length-1)*childStep+childHeight/2;
      wires+=`<path d="M${cx} ${consortBottom} v12 H${rail} V${last}" fill="none" stroke="${blood}" stroke-width="1.8"/>`;
    }
    children.forEach((k,j)=>{
      const y=childY+j*childStep,foster=k.foster!==k.mom&&fosterOf(k),role=S.heir===k.id?'皇太子':k.sex==='m'?'皇子':'公主';
      wires+=line(rail,y+childHeight/2,cx-cardWidth/2,y+childHeight/2,blood);
      cards+=`<button class="graph-card graph-child${S.heir===k.id?' graph-crown':''}" style="${at(cx,y,childHeight)}" onclick="A.go('kid',${k.id})">${porImg(k,44)}${label(k.name,role+(foster?' · 由'+fullName(foster)+'抚养':''),k)}</button>`;
    });
  });
  const legend=COURT_BLOCS.map(b=>`<span class="tag" style="border-color:${BLOC_COLOR[b.id]};color:${BLOC_COLOR[b.id]}">${b.name}</span>`).join('');
  return `<div class="graph-legend">${legend}<span class="hint">棕实线：父女与母子　浅虚线：同族　绿线：亲近　红虚线：不和。皇嗣按生母分支。</span></div>
    <div class="graph-wrap" tabindex="0" aria-label="家族关系，可横向滚动"><div class="graph-sheet" style="width:${W}px;height:${H}px;--graph-card-width:${cardWidth}px">
      <svg class="family-graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${backgrounds}${wires}</svg><div class="graph-people">${cards}</div>
    </div></div>`;
}
A.familyMode=function(mode){UI.familyMode=mode;render()};
/* ---- 起居注纪念卡 ---- */
A.logCard=function(){
  const marks=S.log.map((l,i)=>l.t.startsWith('——')?i:-1).filter(i=>i>=0);
  const from=marks.length>=2?marks[marks.length-2]+1:0,to=marks.length?marks[marks.length-1]:S.log.length;
  const lines=S.log.slice(from,to).filter(l=>!l.t.startsWith('——')).slice(-12);
  const W=360,H=540,c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.scale(2,2);
  g.fillStyle='#5a2e28';g.fillRect(0,0,W,H);g.fillStyle='#f6ead2';g.fillRect(12,12,W-24,H-24);
  g.fillStyle='#a87a26';for(let i=12;i<W-12;i+=8){g.fillRect(i,12,4,4);g.fillRect(i+4,H-16,4,4)}for(let i=12;i<H-12;i+=8){g.fillRect(12,i+4,4,4);g.fillRect(W-16,i,4,4)}
  const font='"Songti SC","STSong","Noto Serif CJK SC",serif';
  g.textAlign='center';g.fillStyle='#5a2e28';g.font=`700 28px ${font}`;g.fillText('起居注',W/2,62);
  g.font=`14px ${font}`;g.fillStyle='#7a5a4a';g.fillText(`${E().sur}${E().name} · ${lines[0]?.d||dateStr()}`,W/2,86);
  g.fillStyle='#5a2e28';g.fillRect(36,98,W-72,2);g.textAlign='left';g.font=`13px ${font}`;let y=126;
  for(const l of lines){if(y>H-60)break;g.fillStyle=l.b?'#9a3b33':'#3a2a22';let row='';
    for(const ch of '· '+l.t){if(g.measureText(row+ch).width>W-80){g.fillText(row,40,y);y+=19;row='  '+ch;if(y>H-60)break}else row+=ch}
    if(row&&y<=H-60){g.fillText(row,40,y);y+=24}}
  g.textAlign='center';g.fillStyle='#a08870';g.font=`11px ${font}`;g.fillText('宸宫纪 · 像素后宫',W/2,H-30);
  if(!c.toBlob){toast('当前环境不能导出图片');return}
  c.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`起居注-${dateStr()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},'image/png');
};

function viewFamily(){
  if((UI.familyMode||'graph')==='graph')return `${pageHeading('家族关系树')}<div class="acts view-switch" role="group" aria-label="家族查看方式"><button class="btn sm on">关系图</button><button class="btn sm" onclick="A.familyMode('list')">家族列表</button></div>${dowagerFamilyPanel()}${familyGraphSVG()}${outsideBirthFamilyPanel()}${royalRelativesPanel()}${householdDescendantsPanel()}`;
  const byClan=new Map(),kidsByMother=new Map();
  for(const k of S.children){
    if(!kidsByMother.has(k.mom))kidsByMother.set(k.mom,[]);
    kidsByMother.get(k.mom).push(k);
  }
  for(const c of S.consorts){
    if(c.maid&&!kidsByMother.has(c.id))continue;
    if(familyVisibilityActive())houseOf(c);
    const key=familyVisibilityActive()?familyGroupKey(c):hasClan(c)?clanKey(c):null;
    if(!byClan.has(key))byClan.set(key,[]);
    byClan.get(key).push(c);
  }
  const childLine=k=>{
    const foster=k.foster!==k.mom&&fosterOf(k);
    return `<li><button class="btn quiet family-person" onclick="A.go('kid',${k.id})">${porImg(k,52)}
      <span><span class="family-name-row"><strong>${esc(kidName(k))}</strong>${familyAgeNote(k)}</span>${foster?`<small class="hint">由${esc(fullName(foster))}抚养</small>`:''}${multipleIdentity(k)?`<small class="hint">${esc(multipleIdentity(k).name)}</small>`:''}</span></button></li>`;
  };
  const member=c=>`<li><button class="btn quiet family-person" onclick="A.go('consort',${c.id})">${porImg(c,60)}
    <span><span class="family-name-row"><strong>${esc(fullName(c))}</strong>${familyAgeNote(c)}</span><small class="hint">${esc(!c.alive?'已故':c.gone?'已出宫':cName(c))}</small></span></button>
    ${kidsByMother.has(c.id)?`<ul>${kidsByMother.get(c.id).map(childLine).join('')}</ul>`:''}</li>`;
  const branch=(label,people,force='',key='')=>{
    const childCount=people.reduce((sum,c)=>sum+(kidsByMother.get(c.id)?.length||0),0),fathers=new Map();
    for(const c of people){const house=houseOf(c);const key=house?.father.id??c.id;if(!fathers.has(key))fathers.set(key,[]);fathers.get(key).push(c);}
    return `<details class="family-branch${familyGroupHidden(key)?' family-hidden':''}" data-family-key="${esc(key)}"><summary><strong>${esc(label)}</strong><span class="hint">${people.length} 人 · ${childCount} 位皇嗣${force}</span>${familyVisibilityButton(key,label)}</summary>
      ${familyGroupHidden(key)?'':[...fathers.values()].map(sisters=>{const father=houseOf(sisters[0])?.father;
        return `<section class="paternal-branch">${father?(layeredFamilyActive()?familyHouseTree(sisters[0],true):officialFamilyLine(sisters[0]))+(sisters.length>1?'<p class="hint">亲姐妹同父，共用父兄履历。</p>':''):whiteSpringKinLinks(sisters[0])}<ul>${sisters.map(member).join('')}</ul></section>`;
      }).join('')}</details>`;
  };
  const branches=[...byClan].sort(([a],[b])=>Number(a==null)-Number(b==null)).map(([key,people])=>
    branch(whiteSpringRoyal(people[0])?'白泉王室 · 父王与王兄':familyVisibilityActive()?(hasClan(people[0])?clanName(key):people[0].sur+'家'):key?clanName(key):'未列家族',people,hasClan(people[0])?` · 势力 ${Math.max(...people.map(c=>rd(c.fam.p)))}`:'',key||'')).join('');
  const unlisted=S.children.filter(k=>!byId(k.mom)&&!k.birthSwap?.confirmed);
  return `${pageHeading('家族关系树')}<div class="acts view-switch" role="group" aria-label="家族查看方式"><button class="btn sm" onclick="A.familyMode('graph')">关系图</button><button class="btn sm on">家族列表</button></div><p class="hint">皇嗣列在生母名下，另标养母。点名字可查看人物。</p>
    ${dowagerFamilyPanel()}${branches||'<p class="hint">目前没有入宫的妃嫔。</p>'}${outsideBirthFamilyPanel()}${royalRelativesPanel()}${householdDescendantsPanel()}
    ${unlisted.length?`<details class="family-branch"><summary>生母未载</summary><ul>${unlisted.map(childLine).join('')}</ul></details>`:''}`;
}
function dynastyLegacyPanel(legacy){
 const stats={people:'民心',wu:'武略',wen:'文才',health:'龙体'};
 return `<p>先朝君主 ${esc(legacy.predecessor)} · ${esc(legacy.era)}朝 · 声望 ${rd(legacy.prestige)}</p>
   <p>家训「${esc(legacy.lesson)}」 · 威望 +${legacy.renown} · ${stats[legacy.stat]} +${legacy.bonus}</p>
   ${legacy.trait?`<p>承袭特质「${esc(legacy.trait)}」 · ${stats[legacy.traitStat]} +${legacy.traitBonus}</p>`:''}`;
}
function viewHome(){
  const e=E(),h=harem(),k=kidsAlive(),heir=S.heir&&kidById(S.heir);
  const recent=S.log.filter(l=>!l.t.startsWith('——')).slice(-8).reverse();
  return `${pageHeading('御书房')}<div class="row home-overview">${porImg('emp',96)}<div class="grow">
   <div><b style="font-size:17px">${esc(e.sur+e.name)}</b>　年号${esc(e.era)}　${S.gen>1?`第${cnNum(S.gen)}代　`:''}${e.style}之君${e.dynastyTrait?` · ${esc(e.dynastyTrait)}`:''}</div>
   <div class="stats" style="margin-top:6px">${bar('龙体',e.health,'#4f9078')}${bar('威望',e.prestige,'#a87a26')}${bar('民心',e.people,'#3b5fa8')}${bar('文才',e.wen)}${bar('武略',e.wu)}</div>
   <div style="margin-top:6px">后宫 ${h.length} 人${alive().some(c=>c.cold)?`（冷宫 ${alive().filter(c=>c.cold).length}）`:''}　皇嗣 ${k.length} 位　储君：${heir?esc(heir.name):'未立'}　${S.flags.dowager&&S.flags.dowager.alive?esc(S.flags.dowager.name)+'健在':''}
     ${outerIntegration()?`<small class="hint" title="宫外子女的身世走漏会降低稳定。距上次风波满两个月后，每月恢复 2 点；恢复前低于 80 时，在宫妃嫔当月心情减 1。">后宫稳定 ${esc(haremStability())}/100</small>`:''}</div>
   </div></div>

   <div class="acts"><button class="btn primary" onclick="A.go('government')">治国理政<small>岁入 · 官员调度 · 民情回访</small></button><button class="btn jade" onclick="A.go('jewelry')">内库珍藏<small>查看珍饰 · 选人赏赐</small></button></div>
   ${birthdayBanquetButtons()}${proudDemandNotice()}
   ${pageChapters('home',[
     ['recent','近事',`<ul class="story">${recent.map(l=>`<li class="${l.b?'big':''}"><time>${esc(l.d)}</time>${esc(l.t)}</li>`).join('')||'<li>尚无记载</li>'}</ul>`],
     ['royal-kin','皇亲列表',palaceAdoptionPanel()+royalKinRosterPanel()],
     ['fertility','太医院会诊',imperialFertilityPanel()],
     ['goals','王朝目标',dynastyGoalsPanel()],
     ...(journalContentVersion()>=85?[['collection','王朝图鉴',dynastyCodexPanel()]]:[]),
     ...(e.dynastyLegacy?[["legacy",e.dynastyLegacy.crossGame?'前局传承':'先帝传承',dynastyLegacyPanel(e.dynastyLegacy)]]:[]),
     ...(dynastyFollowupActive()&&e.diplomaticTraits?.length?[['foreign-traits','先前出使',diplomaticTraitsPanel(e)]]:[]),
     ['court','朝堂与外家',courtBlocHTML()],
     ['stewardship','协理六宫',typeof haremStewardPanel==='function'?haremStewardPanel():''],
     ['story-consorts','剧情妃图鉴',storyConsortCodex()],
     ...(typeof fenghuaReadable==='function'&&fenghuaReadable()? [[journalContentVersion()>=24?'notable-people':'fenghua',journalContentVersion()>=24?'风华人物志':'风华人物',fenghuaCodex()]]:[]),
     ['keepsakes','家书与手稿',detailSection('从旧朝带来的家书与手稿',lifeWorksPanel(e))],
     ['guide','起居与用度',`<p class="hint">每月有${maxEnergy()}点精力。每月最多批阅三份奏折，可先免费查看；亲自批复通常花 1 点；召幸、闲谈、探望皇嗣、出巡也要花精力。赏赐、晋封、选秀不花精力。精力用完后，处理完当前事件及后续便会自动转月；也可提前点「结束本月」。侍寝后若怀上龙胎，要到下个月末太医才诊得出喜脉。每位妃嫔都有一段专属故事，情分越深越容易推进。</p>`]
   ])}`}

function viewHarem(){
  const all=alive().filter(c=>!c.maid);const g=r=>all.filter(c=>!c.cold&&!c.templeStay&&!c.homeLeave&&r(c)).sort((a,b)=>b.rank-a.rank||b.favor-a.favor);
  const sec=(t,arr)=>arr.length?`<h3>${t}（${arr.length}）</h3><div class="grid portrait-grid">${arr.map(consortCard).join('')}</div>`:'';
  const dead=S.consorts.filter(c=>!c.alive||c.gone);
  return `${pageHeading('后宫','点击妃嫔查看详情、互动与她的故事。各位分名额：嫔6、妃4、贵妃2、皇贵妃1、皇后1。','<button class="btn jade" onclick="A.openResidence()">宫室分配 · 主位与同住</button>')}${haremRestraintPanel()}
   ${sec('中宫',g(c=>c.rank===8))}${sec('妃位',g(c=>c.rank>=5&&c.rank<8))}${sec('嫔位',g(c=>c.rank===4))}${sec('小主',g(c=>c.rank<4))}${sec('暂离宫中',all.filter(c=>c.homeLeave&&!c.cold))}${sec('寺中修行',all.filter(c=>c.templeStay&&!c.cold))}${sec('冷宫',all.filter(c=>c.cold))}${sec('贴身宫女',maids().filter(m=>m.near))}
   ${facHTML()}${dead.length?`<h3>故人</h3><div class="hint">${dead.map(c=>`<button class="btn sm" onclick="A.go('consort',${c.id})">${esc(fullName(c))}${c.gone?'（出宫）':'（已故）'}</button>`).join(' ')}</div>`:''}`}
function detailSection(title,content){
  return content?`<section class="detail-section"><h3>${title}</h3><div class="detail-content">${content}</div></section>`:'';
}
const HISTORICAL_RECORD_REFS={辞辇:'班婕妤辞辇（西汉）',荔枝:'杨贵妃与荔枝（唐）',烽火:'周幽王烽火戏诸侯（西周）',金屋:'汉武帝金屋藏娇（西汉）',感业寺:'武则天感业寺为尼（唐）',平阳府:'卫子夫平阳公主府献歌（西汉）',画师:'毛延寿误画王昭君（西汉）',陈州少年:'狸猫换太子·认母（民间传说）',梃击案:'梃击案（明）',七步诗:'曹植七步诗（三国）',让梨:'孔融让梨（东汉）',砸缸:'司马光砸缸（北宋）'};
function recordedHistoricalCodex(){
 const current=(S.historicalCodex||[]).map(x=>({...x}));if(journalContentVersion()<85)return current.reverse();
 const people=[...S.consorts,...S.children,...(S.retainedFamilies||[]),...(S.royalRelatives||[]),...(S.previousCourts||[]).flatMap(c=>c.consorts||[])];
 const keys=new Set(current.map(x=>JSON.stringify([x.d,x.title,x.choice])));
 for(const person of people)for(const entry of person.story||[]){
  const ev=entry.event,ref=ev&&HISTORICAL_RECORD_REFS[ev.title];if(!ref||!ev.choice)continue;
  const key=JSON.stringify([entry.d,ev.title,ev.choice]);if(keys.has(key))continue;keys.add(key);
  current.push({d:entry.d,title:ev.title,ref,choice:ev.choice,outcome:ev.outcome||'',reconstructed:true});
 }
 const dateOrder=new Map();for(const entry of S.log||[])if(!dateOrder.has(entry.d))dateOrder.set(entry.d,dateOrder.size);
 return current.map((entry,index)=>({entry,index})).sort((a,b)=>(dateOrder.get(b.entry.d)??-1)-(dateOrder.get(a.entry.d)??-1)||b.index-a.index).map(x=>x.entry);
}
function dynastyCodexPanel(){
 const consorts=S.consorts.filter(c=>!c.maid),children=royalHouseholds().filter(k=>k.sex==='m'||k.sex==='f');
 const jewelry=Object.entries(S.jewelry?.received||{}).filter(([id,n])=>JEWELRY[id]&&n>0);
 const historical=recordedHistoricalCodex();
 const emperor=[...S.history.map(h=>`${h.miao} ${h.sur}${h.name} · ${h.era} · 在位${h.yrs}年`),`${E().sur}${E().name} · ${E().era} · 在位中`];
 const persons=people=>people.map(p=>chroniclePersonLink({id:p.id,name:p.sex?kidName(p):fullName(p)})).join(' ');
 return `<p class="hint">图鉴根据本存档实际留下的记录整理；旧存档中未记录的典故不会凭空补写。</p>
 <details><summary>妃嫔图鉴 · ${consorts.length}</summary><div class="acts">${persons(consorts)||'尚无记录'}</div></details>
 <details><summary>历史典故 · ${historical.length}</summary><ul class="story">${historical.map(x=>`<li><time>${esc(x.d)}</time>${esc(x.title)} · ${esc(x.ref)} · ${esc(x.choice)}${x.reconstructed?' · 据人物纪事整理':''}</li>`).join('')||'<li>尚无记录。</li>'}</ul></details>
 <details><summary>皇帝本纪 · ${emperor.length}</summary><ul class="story">${emperor.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${regnalChronicleActive()?'<button class="btn sm" onclick="A.go(\'regnal\')">翻阅皇帝本纪</button>':'<button class="btn sm" onclick="A.go(\'log\')">查看按时间记载的起居注</button>'}</details>
 <details><summary>服饰珍宝 · ${jewelry.length}</summary><p>${jewelry.map(([id])=>esc(JEWELRY[id].name)).join('、')||'尚无记录'}</p><button class="btn sm" onclick="A.go('jewelry')">查看内库</button></details>
 <details><summary>皇嗣成长 · ${children.length}</summary><div class="acts">${persons(children)||'尚无记录'}</div></details>
 <details><summary>宫廷建筑 · ${PLACES.length}</summary><p>${PLACES.map(p=>esc(p.n)).join('、')}</p><button class="btn sm" onclick="A.go('map')">查看宫城</button></details>`;
}

function dynastyGoalsPanel(){
  const scenario=S.scenario,definition=DYNASTY_SCENARIOS[scenario?.id];
  const hiddenDescriptions={
    founder:'五年后民心达到85',regent:'将权臣掌控度降至0',
    succession:'让宗亲皇嗣入继宫中',prosperous:'五年后国库达到2500万两',
    crisis:'在期限内将民心提升至85',restoration:'五年后民心达到90'
  };
  const chapter=scenario&&definition?`<h3>${esc(definition.name)}</h3><p>${esc(definition.description)}
    ${scenario.status==='won'?' · 已完成':scenario.status==='lost'?` · ${esc(scenario.failure||'期限已过')}`:scenario.deadline!=null?` · 剩余 ${Math.max(0,scenario.deadline-S.turn)} 个月`:''}</p>
    ${scenario.id==='regent'?`<p>权臣掌控度 ${scenario.control}/100</p>${scenario.control>0&&scenario.gen===S.gen?`<button class="btn sm" onclick="A.lowerRegentControl()" ${scenario.lastReform===S.turn||E().energy<1?'disabled':''}>核对朝政 · 精力−1</button>`:''}`:''}
    ${scenario.id==='founder'&&scenario.foundations?`<p class="hint">新朝须逐步立制、设仓、议政；每月最多筹办一项。设议政前不能采纳派系建议。</p><div class="acts">${Object.entries(DYNASTY_FOUNDATIONS).map(([id,item])=>`<button class="btn sm" onclick="A.establishDynastyFoundation('${id}')" ${scenario.foundations[id]||scenario.status!=='active'||scenario.lastFoundation===S.turn||E().energy<1||E().treasury<item.cost?'disabled':''}>${item.name} · 银${item.cost} · 精力−1${scenario.foundations[id]?' · 已完成':''}</button>`).join('')}</div>`:''}
    <ul class="story">${dynastyScenarioGoals().map(([name,value,target])=>`<li>${esc(name)} · ${Math.min(value,target)}/${target}</li>`).join('')}
    <li>隐藏目标 · ${scenario.hidden?esc(hiddenDescriptions[scenario.id])+' · 已达成':'???'}</li></ul>`:'';
  return `<section class="detail-section"><h3>王朝目标</h3>
    ${chapter}
    <p class="hint">皇嗣目标按本朝记录计算，达成后保存在当前王朝存档，换代后仍可领取。</p>
    <ul class="story">${DYNASTY_GOALS.map(goal=>{
      const entry=S.dynastyGoals?.[goal.id],progress=entry?.completed?goal.target:Math.min(goal.progress(),goal.target);
      return `<li><strong>${esc(goal.name)}</strong> · ${esc(goal.description)} · ${progress}/${goal.target}
        ${entry?.claimed?' · 已领取':entry?.completed?`<button class="btn sm gold" onclick="A.claimDynastyGoal('${goal.id}')" ${S.over?'disabled':''}>领取 ${goal.reward} 万两</button>`:` · 赏银 ${goal.reward} 万两`}</li>`;
    }).join('')}</ul>
    <h3>隐藏成就</h3><ul class="story">${DYNASTY_HIDDEN_GOALS.map(goal=>{const entry=S.dynastyGoals?.[goal.id];return entry?.completed?`<li><strong>${esc(goal.name)}</strong> · ${esc(goal.description)} ${entry.claimed?'· 已领取':`<button class="btn sm gold" onclick="A.claimDynastyGoal('${goal.id}')" ${S.over?'disabled':''}>领取 ${goal.reward} 万两</button>`}</li>`:'<li>???</li>';}).join('')}</ul>
  </section>`;
}
function detailFold(title,content){
  return content?`<details class="detail-fold"><summary>${title}</summary><div class="detail-content">${content}</div></details>`:'';
}
function detailStory(person){return chronicleReader(person,{compact:true});}

// Layout helpers only: every section stays expanded and keeps its original controls.
function pageHeading(title,description='',actions=''){
  return `<header class="page-heading"><div><h2>${esc(title)}</h2>${description?`<p class="hint">${description}</p>`:''}</div>${actions?`<div class="page-tools">${actions}</div>`:''}</header>`;
}
function actionGroup(title,content){
  return content?.trim()?`<div class="action-group" role="group" aria-label="${esc(title)}"><p class="action-group-label">${esc(title)}</p><div class="acts">${content}</div></div>`:'';
}
function pageChapters(prefix,chapters,compact=false){
  const visible=chapters.filter(([, ,content])=>content?.trim());
  if(!visible.length)return '';
  return `<nav class="section-jumps${compact?' section-jumps-compact':''}" aria-label="本页内容">${visible.map(([key,title,,shortTitle])=>`<a href="#${prefix}-${key}" onclick="event.preventDefault();jumpToPageSection('${prefix}-${key}')">${esc(compact&&shortTitle?shortTitle:title)}</a>`).join('')}</nav>
    <div class="page-chapters">${visible.map(([key,title,content])=>`<section class="page-chapter" aria-labelledby="${prefix}-${key}"><h3 id="${prefix}-${key}" tabindex="-1" class="chapter-title">${esc(title)}</h3><div class="chapter-body">${content.replace(/<(\/?)h3(?=[\s>])/g,'<$1h4')}</div></section>`).join('')}</div>`;
}
function jumpToPageSection(id){
  // A read-only jump must not enter the gameplay action journal or change a save.
  const heading=document.getElementById(id);
  if(!heading||!$('#panel').contains(heading))return;
  heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'auto'});
}

function viewConsort(){
  const c=byId(UI.sel);if(!c)return viewHarem();
  const act=c.alive&&!c.gone;
  const kids=S.children.filter(k=>k.mom===c.id);
  const st=(l,v,hid)=>hid?`<div class="bar"><span>${l}</span><i></i><em>??</em></div>`:bar(l,v,'#8e6f57');
  let acts='', management='', quickManagement='', familyActions='', conversations='', cardAction='', penalties='';
  if(act&&c.maid){
    acts+=`<button class="btn" onclick="A.night(${c.id})" ${consortNightReason(c)?'disabled':''}>召幸<small>${consortNightReason(c)||'精力-1'}</small></button>`;
    acts+=`<button class="btn primary" onclick="A.chat(${c.id})">闲话家常<small>精力-1</small></button>`;
    acts+=`<button class="btn jade" onclick="A.gift(${c.id})">赏赐<small>国库-20</small></button>`;
    management+=`<button class="btn" onclick="A.raiseMaid(${c.id},1)">册封为答应</button><button class="btn" onclick="A.raiseMaid(${c.id},0)">册封为官女子</button><button class="btn" onclick="A.maidNear(${c.id})">${c.near?'遣回尚衣局':'调到身边'}</button>`;
    penalties+=`<button class="btn danger" onclick="A.maidOut(${c.id})">放出宫</button>`;
  } else if(act&&(c.templeStay||c.homeLeave)){
    // Temple status and return actions have their own section below.
  } else if(act&&!c.cold){
    acts+=`<button class="btn" onclick="A.night(${c.id})" ${consortNightReason(c)?'disabled':''}>召幸侍寝<small>${consortNightReason(c)||'精力-1'}</small></button>`;
    if(journalContentVersion()>=91&&c===empress()&&c.illnessRecovery?.until>S.turn)management+=`<button class="btn jade" onclick="A.queenCare()">安排或更换侍疾妃嫔</button>`;
    acts+=`<button class="btn primary" onclick="A.chat(${c.id})">闲话家常<small>精力-1</small></button>`;
    acts+=`<button class="btn jade" onclick="A.gift(${c.id})">赏赐<small>礼物 · 内库珍饰</small></button>`;
    familyActions+=momVisitButton(c);
    if(domesticHomeLeaveAllowed(c))familyActions+=`<button class="btn" onclick="A.homeLeave(${c.id})" ${homeLeaveEligible(c)?'':'disabled'}>准回家省亲</button>`;
    if(residencePetitionFor(c))conversations+=`<button class="btn" onclick="A.residencePetition(${c.id})">听她谈居处</button>`;
    if(solitaryQuietEvent(c))conversations+=`<button class="btn" onclick="A.quietHousehold(${c.id})">听她谈清静</button>`;
    if(travelerQuietPair(c))conversations+=`<button class="btn" onclick="A.neighborWord(${c.id})">听听廊下的新词</button>`;
    if(resemblanceEvent(c))conversations+=`<button class="btn" onclick="A.resemblanceTalk(${c.id})">听听肖似之议</button>`;
    if(brotherSupportContext(c))conversations+=`<button class="btn" onclick="A.brotherSupport(${c.id})">听她谈兄长与家书</button>`;
    if(firstChildWishContext(c))conversations+=`<button class="btn" onclick="A.firstChildWish(${c.id})">听她说这一胎的盼望</button>`;
    if(c.rescue?.familyContact==='confirmed')familyActions+=`<button class="btn" onclick="A.rescuedReturn(${c.id})">商议归乡</button>`;
    if(c.rank!==8)quickManagement+=`<button class="btn" onclick="A.openResidence(${c.id})">安排居所<small>主位 · 同住 · 换宫</small></button>`;
    if(c.rank<7)quickManagement+=`<button class="btn" onclick="A.promote(${c.id})">晋封<small>→${RANKS[c.rank+1]}</small></button>`;
    if(c.rank>0&&c.rank<8)penalties+=`<button class="btn danger" onclick="A.demote(${c.id})">降位</button>`;
    if(c.rank>=4)management+=`<button class="btn" onclick="A.rename(${c.id})">改封号</button>`;
    if(c.rank>=5&&c.rank<8&&!empress()&&!c.outerHouseholdId)management+=`<button class="btn" onclick="A.crown(${c.id})">册立皇后</button>`;
    penalties+=`<button class="btn danger" onclick="A.cold(${c.id})">${c.rank===8?'废后':'打入冷宫'}</button><button class="btn danger" onclick="A.away(${c.id})">遣出宫</button>`;
  } else if(act&&c.cold){
    acts+=`<button class="btn primary" onclick="A.uncold(${c.id})">放出冷宫</button>`;
    penalties+=`<button class="btn danger" onclick="A.away(${c.id})">遣出宫</button>`;
  }
  if(act&&!c.maid){cardAction=`<button class="btn quiet" onclick="A.toggleGreenCard(${c.id})">${c.cardWithdrawn?'恢复绿头牌':'撤下绿头牌'}</button>`;}
  if(act&&awaitingNoticeReason(c))conversations+=`<button class="btn" onclick="A.awaitingNotice(${c.id})">听她说久候的心事</button>`;
  const family=(act?fosterLine(c)+clanLine(c)+conKidLine(c)+relLine(c):'')+houseLine(c)+fiveBrotherPanel(c);
  return `${personBackButton('harem')}
   <header class="detail-head consort-detail-head">${porImg(c,224)}<div class="grow">
    <p>${esc(fullName(c))} · ${c.age}岁 · ${c.alive?c.gone?'已出宫':c.homeLeave?homeLeaveStatus(c):c.templeStay?'护国寺':esc(residenceLabel(c)):esc([c.passingDate,consortPassingReason(c)||'已故'].filter(Boolean).join(' · '))}</p>
    <h2>${esc(cName(c))}</h2>${consortHomePlace(c)?`<button class="btn sm jade" onclick="A.visitConsortHome(${c.id})">去宫里看看 →</button>`:''}
    <p>${esc(c.fam.t)} · ${esc(c.trait)} ${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}${c.preg>=2?` <span class="tag r">有孕${c.preg}月</span>`:''}</p>
   </div></header>
   ${!act?deliveryMemorialPanel(c):''}
   ${acts?`<div class="detail-actions consort-detail-actions" role="group" aria-label="人物操作"><span class="detail-action-label" aria-hidden="true">人物操作</span><div class="acts">${acts}</div></div>`:''}
   ${quickManagement||cardAction?`<div class="consort-quick-management" role="group" aria-label="位分与居所">${quickManagement}${cardAction}</div>`:''}
   <div class="detail-vitals">${bar('恩宠',c.favor)}${bar('心情',c.mood,'#517369')}${bar('情分',c.aff,'#936375')}</div>
   ${pageChapters('consort',[
    ['history','人物纪事',chronicleReader(c,{compact:true}),'纪事'],
    ['now','近况与心事',
      `${dowagerCareActive()&&c.dowagerKin?.gen===S.gen?`<p class="hint">太后母家侄女 · 陛下的母族表亲；潜邸时奉先帝之命成婚。</p>`:c.imperialKin?`<p class="hint">入宫亲缘 · ${esc(c.imperialKin.relation)}，经${esc(c.imperialKin.via)}引见。</p>`:''}
    ${PORTRAIT_CLOTHES[portraitCell(c)]?`<p>衣着 · ${PORTRAIT_CLOTHES[portraitCell(c)]}</p>`:''}
    ${characterVoiceHTML(c)}${daoPracticePanel(c)}`+(act?arcLine(c):'')+
      consortTraitPanel(c)+consortHealthPanel(c)+birthCarePanel(c)+(act?deliveryMemorialPanel(c):'')+(typeof haremStewardPersonPanel==='function'?haremStewardPersonPanel(c):'')+(typeof hongjianPanel==='function'?hongjianPanel(c):'')+
      actionGroup('听她说说',conversations)+
      detailSection('近况与性情',`<p class="hint">${esc(TRAITS[c.trait]?.d||'性情沿用旧日记载。')} · 侍寝 ${c.nights||0} 次</p>${act?xinDetail(c)+deepLine(c):''}<div class="stats">${st('容貌',c.looks)}${st('才情',c.talent)}${st('德行',c.virtue)}${st('心机',c.scheme,!c.known)}</div>`)+
      continuityPanel(c)+personalLifePanel(c)+detailSection('人和事的后续',cohortLifePanel(c)+parentEpisodePanel(c))+
      detailSection('孕中祈愿',pregnancyPrayerPanel(c))+detailSection('寺中清修',consortTemplePanel(c))+
      (act&&!c.cold?initiativeHTML(c):''),'近况'],
    ['family','家人与孩子',
      actionGroup('探亲与省亲',familyActions)+
      detailSection('白泉王室亲眷',whiteSpringKinLinks(c))+natalVisitorsPanel(c)+
      whiteSpringFriendPanel(c)+sisterPalaceConcernPanel(c)+
      detailSection('家族与人际',`${kids.length?`<div>子女：${kids.map(k=>`<button class="btn quiet sm" onclick="A.go('kid',${k.id})">${esc(k.name)}</button>`).join(' ')}</div>`:''}${family}`)+
      marriedSisterChildrenPanel(c)+
      (act?detailSection('与孩子的日常',consortFamilyPanel(c)):'')+
      (act?detailSection('牵挂远方的孩子',motherConcernPanel(c)):'')+
      detailSection('孩子的身世',consortParentagePanel(c))+
      personalWardrobePanel(c,false)+fosterWishButton(c)+palaceSpeechPanel(c)+homeLeavePanel(c)+homeFamilyPanel(c)+maternalPanel(c),'家人'],
    ['affairs','册封与宫务',
      actionGroup('位分与宫务',management)+
      detailSection('御赐珍饰',jewelryPanel(c))+(act&&c.rank===8?birthdayBanquetButtons():''),'宫务'],
    ['past','往事与经历',
      storyCastPanel(c)+detailSection('宫墙往事',palaceRomancePanel(c))+journeyPanel(c)+solitaryPanel(c)+pastLifePanel(c)+
      timeTravelerPanel(c)+personalExperiencePanel(c)+historyPanel(c)+lifeBiography(c),'往事'],
    ['decisions','处置',detailFold('处置',penalties?`<div class="acts">${penalties}</div>`:''),'处置']
   ],true)}`;
}
function viewCards(){
  const cards=harem().concat(alive().filter(c=>c.homeLeave&&!c.maid&&!c.cold&&!c.templeStay));
  const h=cards.filter(c=>!c.cardWithdrawn).sort((a,b)=>b.rank-a.rank||b.favor-a.favor).concat(maids().filter(m=>m.near&&!m.cardWithdrawn));
  return `<h2>敬事房 · 翻牌子</h2>${mourningNightPause()?`<p class="hint" role="status">${mourningNightMessage()}；已有身孕者仍照常安胎、诊治和生产。</p>`:''}<p class="hint">敬事房呈上绿头牌。翻谁的牌子，今夜便召谁侍寝（精力-1）。本月已侍寝 ${E().nightsMonth||0} 次，一月超过三次有损龙体。</p>
   ${h.length?`<div class="pais">${h.map(c=>`<button class="pai" ${consortNightReason(c)?'disabled':''} onclick="A.night(${c.id})"><strong>${esc(cName(c))}</strong><small>${consortNightReason(c)||'恩宠 '+rd(c.favor)}</small></button>`).join('')}</div>`:'<p class="hint">暂无可翻的绿头牌。可在妃嫔详情中恢复绿头牌。</p>'}${maidAudiencePanel()}`;
}
function viewXX(){
  const last=selectionLastHeldTurn(),since=S.turn-last;
  if(selectionArrivalsRecent())return viewSelectionArrivals();
  if(!S.cands.length&&(!S.selection||S.selection.phase==='arrivals')) return `<h2>选秀</h2><p>距上次选秀：${last<0?'从未':`${Math.floor(since/12)}年${since%12}月`}。三年一度大选可在二月自动举行；${selectionSkipTimingActive()&&selectionFreeReady()?'目前可依例下旨开选，无须承担提前选秀的国库与民心代价。':'也可随时下旨，但未满三年会耗费国库、有损民心。'}</p>
    <div class="acts"><button class="btn gold" onclick="A.xxDecree()">下旨选秀</button></div>`;
  if(selectionCurrent())return viewSelectionAudience();
  return `${selectionDiscussionPanel()}<section class="story-scene selection-scene" aria-labelledby="selection-title">
    <header><p>储秀宫</p><h2 id="selection-title">选秀</h2></header>
    <button class="btn gold" onclick="A.xxEnd()">确定名单，安排入宫</button>
   </section>
   <p>已留选 ${(S.selection?.accepted||[]).length} 人${(S.selection?.accepted||[]).length?' · '+S.selection.accepted.map(id=>parentLink(id)).join('、'):''}。${S.cands.length?'名单确定后，再看她们入宫时的反应。':'候选已全部处理，请确认本批名单。'}</p>
   <p class="hint">容貌、才情一望便知；德行、心机需要暗访（剩余 ${S.flags.peek} 次）。本月结束时未选的秀女会遣返回家。</p>
   <div class="grid portrait-grid">${S.cands.map(c=>`<div class="card portrait-card" style="cursor:default;flex-direction:column">
     <div class="row" style="gap:8px">${porImg(c,76)}<div class="grow"><div class="nm">${esc(fullName(c))}</div><div>${c.age}岁 · ${esc(c.fam.t)}之女</div>${c.kinNote?`<div><span class="tag y">${esc(c.kinNote)}</span></div>`:''}<div><span class="tag">${c.trait}</span>${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)} <span class="tag">${esc(consortHobby(c))}</span></div></div></div>
     ${portraitResemblanceHint(c)?`<p class="hint">${esc(portraitResemblanceHint(c))}</p>`:''}${c.pastLife?`<p class="hint">${esc(pastLifeSelectionHint(c))}</p>`:''}${bar('容貌',c.looks,'#8e6f57')}${bar('才情',c.talent,'#8e6f57')}${c.known?bar('德行',c.virtue,'#8e6f57')+bar('心机',c.scheme,'#8e6f57'):'<div class="bar"><span>德行</span><i></i><em>??</em></div><div class="bar"><span>心机</span><i></i><em>??</em></div>'}
     <div class="acts" style="margin:4px 0 0"><button class="btn sm" onclick="A.xxMeet(${c.id})">再见一面</button><button class="btn sm gold" onclick="A.xxTake(${c.id})">留牌子</button><button class="btn sm" onclick="A.xxDrop(${c.id})">撂牌子</button>${c.known?'':`<button class="btn sm jade" onclick="A.xxPeek(${c.id})">暗访</button>`}</div></div>`).join('')}</div>`}
function parentLink(id,name){
  const c=byId(id);return c?`<button class="person-link" onclick="A.go('consort',${c.id})">${esc(name||fullName(c))}</button>`:esc(name||'未记载');
}
function childListCard(k){
  return `<article class="card portrait-card child-card"><button class="child-portrait" aria-label="查看${esc(kidName(k))}" onclick="A.go('kid',${k.id})">${porImg(k,72)}</button><div class="grow"><button class="person-link nm" onclick="A.go('kid',${k.id})">${esc(kidName(k))}</button><div>${k.alive?kidAge(k)+'岁':k.lost?'下落不明':'已故'} · 生母 ${outsideMotherLink(k)}${fosterOf(k)?` · 养母 ${parentLink(k.foster)}`:''}</div>${birthTags(k)}${outsideChildBadge(k)}${royalHouseholdLifeActive()&&k.alive&&k.household?.pregnancies?.length?
    `<span class="tag y">${k.sex==='f'?'公主有喜':'王府有喜'}</span>`:''}${bar('才学',k.lit,'#3b5fa8')}${bar('武艺',k.mar,'#a3262a')}${bar('品德',k.vir,'#4f9078')}</div></article>`;
}
A.kidsResidence=function(group){
  if(!['palace','out'].includes(group))return;
  UI.kidsResidence=group;AU.sfx('click');render();
};
const KIDS_KIND_FILTERS=[['all','全部'],['m','皇子'],['f','公主']];
A.kidsKind=function(kind){
  if(!KIDS_KIND_FILTERS.some(([id])=>id===kind))return;
  UI.kidsKind=kind;AU.sfx('click');render();
};
function viewKids(){
  const living=S.children.filter(k=>k.alive);
  const groups={palace:living.filter(k=>!childHasLeftPalace(k)),out:living.filter(childHasLeftPalace)};
  const selected=UI.kidsResidence==='out'?'out':'palace';
  const [kind,kindLabel]=KIDS_KIND_FILTERS.find(([id])=>id===UI.kidsKind)||KIDS_KIND_FILTERS[0];
  const matches=k=>kind==='all'||k.sex===kind;
  const visible=groups[selected].filter(matches),past=S.children.filter(k=>!k.alive&&matches(k));
  const residenceLabel=selected==='palace'?'宫中':'宫外';
  const grid=ks=>`<div class="grid portrait-grid">${ks.map(childListCard).join('')}</div>`;
  const rates=harem().filter(c=>!consortNightReason(c)).map(consortConceptionChance).filter(p=>p>0);
  const chanceHint=rates.length?`按本月可召幸妃嫔的体质估算，单次基础机会约 ${[...new Set([Math.min(...rates),Math.max(...rates)].map(p=>(100*p).toFixed(1)+'%'))].join('–')}。陛下的子嗣状况也会影响结果。`:'眼下暂无适宜受孕的人选，可以等身体恢复、产后静养期满或新的妃嫔入宫。';
  const guide=`<details class="detail-section" ${living.length?'':'open'}><summary>求嗣、会诊与立储</summary>
    <p>${chanceHint} 出巡时去护国寺祈福，可提高当月机会。</p>
    <p>若陛下有子嗣方面的难处，连续十二个月各有一次可受孕的召幸且始终未有孕讯，太医院才会提出会诊。接到结论后，可在御书房寻访医者，或按宗人府礼例议请入继。</p>
    <p>符合条件的皇子满五岁后，可在其人物页选择「立为太子」。</p>
    <div class="acts"><button class="btn sm" onclick="A.go('cards')">去翻牌子</button><button class="btn sm" onclick="A.go('out')">出巡与祈福</button></div></details>`;
  return `${pageHeading('皇嗣','',`<button class="btn jade" onclick="A.visitMapActivity('ss')">去上书房看看 →</button>`)}${pendingBirthPanel()}${guide}${S.children.length?`
    <div class="residence-tabs" role="group" aria-label="皇嗣居处">${[['palace','宫中'],['out','宫外']].map(([id,label])=>`<button class="btn ${selected===id?'primary on':''}" aria-pressed="${selected===id}" onclick="A.kidsResidence('${id}')">${label}<span>${groups[id].length}</span></button>`).join('')}</div>
    <div class="acts official-filters" role="group" aria-label="皇嗣类别">${KIDS_KIND_FILTERS.map(([id,label])=>`<button class="btn sm ${kind===id?'on':''}" aria-pressed="${kind===id}" onclick="A.kidsKind('${id}')">${label}</button>`).join('')}</div>
    <section aria-label="${residenceLabel}皇嗣">${visible.length?grid(visible):`<p class="hint">${residenceLabel}暂无${kind==='all'?'皇嗣':kindLabel}。</p>`}</section>
    ${past.length?`<details class="past-children"><summary>已故与失踪 · ${past.length}</summary>${grid(past)}</details>`:''}`:'<p class="hint">膝下尚无子嗣。</p>'}`;
}
function viewKid(){
  const k=kidById(UI.sel);if(!k)return viewKids();const a=kidAge(k);
  const pol=['均衡','读书','习武','修德','放养',...(dynastyFollowupActive()&&a<16?['游学']:[])];
  const foster=fosterOf(k),mom=byId(k.mom);
  const status=[k.alive?`${a}岁`:k.lost?'下落不明':k.deathReason||'已故',k.married?'已婚嫁':royalNatalEngaged(k)?'已定亲':'',k.estate||k.princeEstate?'已开府':'',k.away?'已就藩':'',k.jailed?'圈禁于宗人府':'',k.removedFromRoyal?'不列皇嗣':''].filter(Boolean).join(' · ');
  const care=childInPalace(k)?`<div class="hint">当前方针：${esc(k.policy)} · 三岁起生效</div><div class="acts">
    ${pol.map(p=>`<button class="btn sm ${k.policy===p?'on':''}" aria-pressed="${k.policy===p}" onclick="A.kidPolicy(${k.id},'${p}')">${p}</button>`).join('')}</div>
    <div class="acts">${a>=6?`<button class="btn ${k.tutor?'on':''}" onclick="A.kidTutor(${k.id})">${k.tutor?'已延请太傅':'延请太傅'}<small>每月5万两</small></button>`:''}
    ${a<14?`<button class="btn" onclick="A.foster(${k.id})">${foster?'换一位养母':'交给妃嫔抚养'}</button>`:''}
    ${foster&&mom?.alive?`<button class="btn" onclick="A.unfoster(${k.id})">抱回生母身边</button>`:''}</div>`:'';
  const titles=k.alive&&!k.removedFromRoyal&&!k.templeStay&&!royalJourneyAway(k)?`${k.sex==='m'&&a>=5&&S.heir!==k.id&&!storyCastHeirBar(k)?`<button class="btn" onclick="A.kidHeir(${k.id})">立为太子</button>`:''}
    ${(journalContentVersion()>=40?royalChildTitleReady(k):a>=12)?`<button class="btn" onclick="A.kidTitle(${k.id})">赐封号</button>`:''}`.trim():'';
  const household=householdPanel(k);
  const familyChapter=['family','亲缘与婚配',palaceAdoptionOriginPanel(k)+princessActions(k)+princeEstateLink(k)+multipleBirthPanel(k)+
      detailSection('身世与安置',parentagePanel(k))+outsideParentagePanel(null,k)+detailSection('府中认回的孩子',recognizedChildrenPanel(k))+
      (k.alive?detailSection('与母亲的日常',kidFamilyPanel(k)):'')+detailSection('宫中关系',k.alive?kidRelLine(k):'')];
  const vitals=`<div class="detail-vitals">${bar('才学',k.lit,'#617991')}${bar('武艺',k.mar,'#92504a')}${bar('品德',k.vir,'#517369')}</div>`;
  return `${personBackButton('kids')}
   <header class="detail-head person-detail-head">${porImg(k,224)}<div class="grow"><p>${status}</p><h2>${esc(kidName(k))}</h2>
    <p>生母 ${outsideMotherLink(k)}${foster?` · 养母 ${parentLink(k.foster)}`:''}</p>${childResidence(k)?`<p class="hint">${esc(childResidence(k))}</p>${youngChildMother(k)?`<button class="btn sm jade" onclick="A.visitChildHome(${k.id})">去宫里看看 →</button>`:''}`:''}${birthTags(k)}${outsideChildBadge(k)}${childHasLeftPalace(k)?`<p class="hint">居处 · ${esc(childWhereabouts(k))}</p>`:''}</div></header>
   ${k.pendingName?pendingBirthPanel():''}
   ${k.alive&&!k.removedFromRoyal&&!k.estate&&!k.jailed&&!k.pendingName?`<div class="detail-actions" role="group" aria-label="人物操作"><span class="detail-action-label" aria-hidden="true">人物操作</span><div class="acts"><button class="btn primary" onclick="A.kidVisit(${k.id})">${childHasLeftPalace(k)?'写家书':'探望'}<small>精力-1</small></button>${princeEstateOpenReady(k)?`<button class="btn jade" onclick="A.princeOpenEstate(${k.id})">安排出宫开府</button>`:''}</div></div>`:''}
   ${xiePrincessRefusalPanel(k)}
   ${marriagePanel(k)}
   ${household}
   ${k.married?'':vitals}
   ${pageChapters('child',[
    ...(k.married?[familyChapter]:[]),
    ['history','人物纪事',detailStory(k),'纪事'],
    ['now','近况与心事',characterVoiceHTML(k)+daoPracticePanel(k)+storyCastChildPanel(k)+childDispositionPanel(k)+(k.foreignLanguages?.length?detailSection('出使见闻',`<p>所学外语：${k.foreignLanguages.map(esc).join('、')}。</p>`+diplomaticTraitsPanel(k)):'')+immortalPanel(k)+royalTravelPanel(k)+continuityPanel(k)+
      (k.alive?initiativeHTML(k):'')+detailSection(a>=20?'婚事与心意':'少年心事',youthPanel(k))+
      detailSection('护国寺祈福',childTemplePanel(k))],
    ['care','教养与封号',(k.married?vitals:'')+personalWardrobePanel(k,true)+detailSection('教养与抚养',care)+detailSection('师承',childMentorPanel(k))+detailSection('成年志向与差务',princeCareerPanel(k)+princeFiefRequestPanel(k))+princeCirclePanel(k)+
      detailSection('封号与储位',titles?`<div class="acts">${titles}</div>`:'')+
      detailSection('其他属性',`<div class="stats">${bar('体魄',k.hp,'#a87a26')}${bar('野心',k.amb,'#6b4a33')}${bar('父爱',k.love,'#936375')}${k.sex==='m'&&a>=10?bar('支持',k.sup||0,'#617991'):''}</div>`)+
      detailSection('出生禀赋',childBirthPanel(k))],
    ...(k.married?[]:[familyChapter]),
    ['past','往事与经历',historyPanel(k)+detailSection('宫墙往事',palaceRomancePanel(k))+
      detailSection('随身旧物',lifeWorksPanel(k))+lifeBiography(k)]
   ])}`;
}
function viewOut(){
  const o=[['garden','御花园','偶遇妃嫔、宫女，或独自散心'],['city','微服出宫','体察民情，也许会遇见有缘人'],['hunt','南苑围猎','武略越高越易成功，有受伤风险'],['temple','护国寺祈福','民心、龙体小增，本月更易得子'],['spa','温泉行宫',`休养龙体（国库-${SPA_COST}万两）`]];
  return `${pageHeading('出巡','每次出巡花费1点精力。')}<div class="grid destination-grid">${o.map(([k,n,d])=>`<button class="card" onclick="A.out('${k}')"><div class="grow"><div class="nm">${n}</div><div>${d}</div></div></button>`).join('')}</div>${rescuedGuestsPanel()}${princessEstatePanel()}${princeEstatesPanel()}${incognitoLedger()}${storyCastOutPanel()}`}
function viewLog(){
  // A month divider with nothing recorded after it is noise; keep only dividers that head real entries.
  const divider=l=>/^—— .+ ——$/.test(l?.t||'');
  const L=selectionChronicle(S.log).filter(l=>UI.logF==='all'||l.b).filter((l,i,all)=>!divider(l)||(all[i+1]&&!divider(all[i+1]))).reverse();
  const month=S.flags.lastMonthReview;
  const link=(id,child=false)=>{
    const person=child?kidById(id):byId(id);
    return person?`<button class="btn sm" onclick="A.go('${child?'kid':'consort'}',${person.id})">查看${esc(child?kidName(person):fullName(person))}</button>`:'';
  };
  return `${pageHeading('起居注')}<div class="log-filter" role="group" aria-label="纪事筛选与留存"><button class="btn sm ${UI.logF==='all'?'on':''}" onclick="UI.logF='all';render()">全部</button><button class="btn sm ${UI.logF==='big'?'on':''}" onclick="UI.logF='big';render()">只看大事</button><button class="btn sm" onclick="A.logCard()">保存上月纪念卡</button>${journalContentVersion()>=85?'<button class="btn sm" onclick="A.go(\'home\');jumpToPageSection(\'home-collection\')">查看王朝图鉴</button>':''}${dynastyFollowupActive()?'<button class="btn sm" onclick="A.go(\'regnal\')">皇帝本纪</button>':''}</div>
   ${month?`<section class="month-record"><h3>${esc(month.date)}回顾</h3>
    <p>月入 ${esc(month.inc)} 万两 · 支出 ${esc(month.exp)} 万两</p>
    ${month.finance&&[month.finance.opening,month.finance.closing,month.finance.other].every(Number.isFinite)?`<p>换月前国库 ${month.finance.opening} 万两 · 换月后 ${month.finance.closing} 万两${month.finance.other?` · 其他换月收支 ${month.finance.other>0?'+':''}${month.finance.other} 万两`:''}</p>`:''}
    ${month.health&&[month.health.opening,month.health.closing,month.health.nightFatigue].every(Number.isFinite)?`<p>月底龙体 ${month.health.opening.toFixed(2)} → ${month.health.closing.toFixed(2)}${month.health.nightFatigue?`，其中召幸过频损耗 ${month.health.nightFatigue.toFixed(1)}`:''}。</p>`:''}
    ${month.hongjianIncome?`<p>月入含薛红笺经营增益 ${month.hongjianIncome} 万两。</p>`:''}
    ${month.stewardship?`<p>协理六宫：${esc(month.stewardship.name)}，本月额外恩宠 +${month.stewardship.gain}${month.stewardship.gain<10?'（上限100）':''}。</p>`:''}
    ${month.localGrainPayment?`<p>支出含赈粮尾款 ${esc(month.localGrainPayment)} 万两。</p>`:''}
    ${(month.courts||(month.court?[month.court]:[])).map(court=>`<p><strong>${esc(court.title)}</strong> · ${esc(court.choice)}</p>${fmt(court.text)}${court.child?link(court.child,true):link(court.person)}`).join('')}
    ${month.people.map(person=>`<p>${esc(person.text)} ${link(person.id)}</p>`).join('')}
   </section>`:''}
   ${S.history.length?`<p class="hint">历代：${S.history.map(h=>esc(`${h.shi?h.miao+h.shi+'皇帝':h.miao} ${h.sur}${h.name}（${h.era}，在位${h.yrs}年）`)).join('；')}</p>`:''}
   <ul class="story" style="max-height:560px">${L.map(l=>`<li class="${l.b?'big':''}"><time>${esc(l.d)}</time>${esc(l.t)}</li>`).join('')}</ul>`}
function viewSys(){
  return `${pageHeading('存档','存档保存在本浏览器中；每月结束时会自动存档。剧情选择后也会保存，未完事件可继续。')}
   <p class="hint">游戏版本 v${PalaceActions.releaseVersion}</p>
   ${lastAutoSaveError?`<p role="status">${esc(lastAutoSaveError)}</p>`:''}
   <p class="hint">${SaveManager.getStorage()?.kind==='indexeddb'?'已启用大容量本机存档；旧存档自动接续，人物纪事完整保留。':'当前浏览器使用兼容存档，请定期下载备份文件。'} 请等「正在写入」结束后再关闭页面。</p>
   <section class="save-section" aria-label="浏览器存档"><div class="save-slots">
   ${['1','2','3'].map(s=>`<article class="save-slot"><div class="save-slot-info"><b>存档${s}</b><span class="hint">${esc(slotInfo(s)||'空')}</span></div><div class="save-slot-actions"><button class="btn sm gold" onclick="A.save('${s}')">保存</button><button class="btn sm" onclick="A.load('${s}')">读取</button></div></article>`).join('')}
   <article class="save-slot"><div class="save-slot-info"><b>自动存档</b><span id="auto-save-summary" class="hint">${esc(slotInfo('auto')||'空')}</span><small id="auto-save-status" role="status" title="${esc(lastAutoSaveError)}">${esc(autoSaveStatusText())}</small></div><div class="save-slot-actions"><button class="btn sm" onclick="A.load('auto')">读取</button><button class="btn sm" onclick="A.save('auto')">立即保存</button></div></article>
   </div></section>
   <section class="save-section"><h3>文件备份</h3><p class="hint">下载一个 JSON 文件留存；换浏览器时选择此文件恢复。备份不会复制到剪贴板。</p><div class="acts"><button class="btn sm gold" onclick="A.downloadSave()">下载备份文件</button><button class="btn sm" onclick="document.getElementById('save-file').click()">选择备份文件导入</button><input id="save-file" type="file" accept=".json,application/json" hidden onchange="A.readSaveFile(this)">${palaceImportBackup()?'<button class="btn sm" onclick="A.undoImport()">恢复导入前的进度</button>':''}</div></section>
   ${rewindHTML()}
   <section class="save-section"><h3>其他</h3><div class="acts"><button class="btn sm" onclick="S=null;UI.view='title';render()">返回标题</button></div></section>`}

function rewindHTML(){
  const snaps=SaveManager.snapshots(SaveManager.getStorage(),SKEY+'auto').sort((a,b)=>b.day-a.day);
  if(!snaps.length)return '';
  return `<section class="save-section"><h3>岁首快照</h3><p class="hint">每年正月自动留一份，最多四份。回到那年岁首，之后的事会重新发生。</p>${snaps.map(s=>`<div class="save-slot"><span class="save-slot-info">${esc(s.date||'')}</span><button class="btn sm" onclick="A.rewind(${s.index},${Number(s.savedAt)||0})">回到这里</button></div>`).join('')}</section>`;
}
