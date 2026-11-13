/* 宫城地点指引：只读取现况，悬浮不会抽取或结算事件。 */
const PLACE_GUIDES={
  qq:['皇帝起居与理政之所。',['查看国库与朝堂势力','采纳议政建议','查看本月要事']],
  cj:['百官奏事的朝会正殿。',['临朝听政 · 精力−1']],
  yh:['赏花游园、亲友相聚的地方。',['园中漫步 · 精力−1','小宴与生辰宴','时令活动与人物邀约']],
  ss:['皇子公主读书习艺之处。',['看课业与同窗互动','安排教养、查看皇嗣','传砚与节令活动']],
  wy:['藏书校书之所。',['参与在此发生的人物活动','翻阅起居注','上元寻灯经停此处']],
  js:['掌管侍寝绿头牌。',['翻牌召幸','查看可召见的妃嫔']],
  cn:['太后居所。',['向太后请安 · 精力−1','听母家消息与荐人']],
  sw:['宫城北门，通往宫外。',['微服出宫、南苑围猎','护国寺祈福、温泉休养','探访已开府的公主']],
  wm:['宫城正门，出巡由此前往。',['微服出宫、南苑围猎','护国寺祈福、温泉休养','探访已开府的公主']]
};
function placeGuide(p){
  const base=PLACE_GUIDES[p.id];
  let purpose=base?.[0]||(p.id==='lg'?'受罚者幽居之所。':p.id==='kn'?'皇后居所，主持六宫家事。':PALACE_NOTES[p.p]||'妃嫔日常起居之所。');
  let activities=base?[...base[1]]:p.id==='lg'?['查看被幽禁的人物','进入人物详情处置或赦免']:['探望居住的妃嫔','闲话、赏赐与人物往来'];
  let residents=[],label='此刻在场';
  const leads=mapActivityLeads().filter(l=>l.place===p.id);
  if(p.k==='palace'){
    label=p.id==='lg'?'幽居于此':'居住于此';
    residents=(p.id==='lg'?alive().filter(c=>c.cold):harem().filter(c=>c.palace===p.p)).map(c=>fullName(c));
    if(p.id!=='lg'){
      const children=nurseryChildren(p.p);
      residents.push(...children.map(k=>kidName(k)+'（随母同住）'));
      if(children.length)activities.push('入宫时可能遇见母子日常');
      const scene=palaceLifeScene(p.p);
      if(scene&&!scene.scene.result)activities.push(scene.scene.kind==='nursery'?scene.scene.activity.title:'亲眷入宫 · 少年初识');
    }
    if(p.p==='储秀宫')activities.push(S.cands.length?`选秀候选 ${S.cands.length} 人 · 可留牌、暗访`:'选秀开启时可在此留牌、暗访');
  }else if(p.id==='cn'){
    if(S.flags.dowager?.alive)residents=[S.flags.dowager.name];
    else{purpose='太后旧居，设有追思之所。';activities=['添香追思','陪母族亲眷追忆'];}
  }else{
    const physical=[...NPC].filter(([id,n])=>inPalace(byId(id))&&!n.path.length&&((p.id==='yh'&&n.where==='garden')||(p.id==='wy'&&n.where==='library'))).map(([id])=>byId(id));
    residents=[...new Set([...physical,...(p.id==='ss'?schoolChildren():[]),...leads.flatMap(l=>l.cast||[])].filter(Boolean).map(person=>porName(person)))];
  }
  if(p.id==='yh'&&!banquetReady())activities[1]='小宴尚在间隔期 · 每三个月一次';
  return {purpose,activities,residents,label,live:[...new Set(leads.map(l=>l.title))]};
}
function placeGuideHTML(p){
  const info=placeGuide(p);
  return `<strong class="map-tip-title">${esc(p.n)}</strong><p>${esc(info.purpose)}</p><span class="map-tip-label">可以做什么</span><ul>${info.activities.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
    ${info.live.length?`<p class="map-tip-live">正在发生 · ${esc(info.live.slice(0,3).join('、'))}${info.live.length>3?`等 ${info.live.length} 项`:''}</p>`:''}
    <p class="map-tip-people">${info.label} · ${esc(info.residents.slice(0,3).join('、')||(p.k==='palace'?'暂无人居住':'暂无已知人物'))}${info.residents.length>3?`等 ${info.residents.length} 人`:''}</p>`;
}
let mapGuideTip=null,mapGuideWrap=null,mapGuideFocus=null,mapGuideInspect=false,mapGuidePlace=null;
function hideMapGuide(){
  if(mapGuideTip)mapGuideTip.hidden=true;
  mapGuidePlace=null;hoverP=null;
}
function showMapGuide(p){
  if(!mapGuideTip||!p||UI.view!=='map')return;
  hoverP=p;mapGuidePlace=p;
  mapGuideTip.innerHTML=placeGuideHTML(p)+(mapGuideInspect?`<button class="btn sm jade" onclick="A.visitMapActivity('${p.id}')">前往${esc(p.n)} →</button>`:'<small>点击宫名直达 · Esc 收起提示</small>');
  mapGuideTip.hidden=false;mapGuideTip.setAttribute('role',mapGuideInspect?'region':'tooltip');
  if(mapGuideInspect){mapGuideTip.style.left='';mapGuideTip.style.top='';return;}
  // Clamp all four sides to the map so edge buildings never create horizontal scroll.
  const width=mapGuideWrap.clientWidth||600,height=MAPC.clientHeight||width*MH/MW;
  const tw=mapGuideTip.offsetWidth||260,th=mapGuideTip.offsetHeight||220;
  const x=(p.r[0]+p.r[2]/2)/MW*width,y=(p.r[1]+p.r[3])/MH*height;
  mapGuideTip.style.left=Math.max(4,Math.min(width-tw-4,x-tw/2))+'px';
  mapGuideTip.style.top=Math.max(4,Math.min(height-th-4,y+10+th<=height?y+10:p.r[1]/MH*height-th-10))+'px';
}
function mountMapGuide(w){
  mapGuideWrap=w;mapGuideFocus=null;mapGuideInspect=false;mapGuidePlace=null;hoverP=null;
  mapGuideTip=document.createElement('div');mapGuideTip.id='map-place-tooltip';mapGuideTip.className='map-tooltip';mapGuideTip.hidden=true;mapGuideTip.setAttribute('role','tooltip');w.appendChild(mapGuideTip);
  w.onkeydown=e=>{if(e.key==='Escape'){hideMapGuide();mapGuideFocus=null;}};
}
function mapGuideEnter(p){if(!mapGuideInspect)showMapGuide(p);}
function mapGuideLeave(){if(!mapGuideInspect){if(mapGuideFocus)showMapGuide(mapGuideFocus);else hideMapGuide();}}
function bindMapGuide(b,p){
  b.setAttribute('aria-describedby','map-place-tooltip');
  b.onmouseenter=()=>mapGuideEnter(p);b.onmouseleave=mapGuideLeave;
  b.onfocus=()=>{mapGuideFocus=p;showMapGuide(p)};
  b.onblur=()=>{mapGuideFocus=null;if(!mapGuideInspect)hideMapGuide()};
  b.onclick=()=>{if(mapGuideInspect)showMapGuide(p);else goDirect(p)};
}
A.toggleMapGuide=function(){
  mapGuideInspect=!mapGuideInspect;mapGuideWrap.className=mapGuideInspect?'map-inspecting':'';
  (mapGuideInspect?$('#map-guide-preview'):mapGuideWrap).appendChild(mapGuideTip);
  const button=$('#map-guide-toggle');button.setAttribute('aria-pressed',String(mapGuideInspect));button.textContent=mapGuideInspect?'收起地点指引':'地点用途与玩法';
  if(mapGuideInspect)showMapGuide(mapGuidePlace||PLACES.find(p=>p.id==='yh'));else hideMapGuide();
};
