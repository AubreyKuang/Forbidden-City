/* Residence rules are a playable abstraction, not a reconstruction of one dynasty. */
const PALACE_SIDE_ROOMS=3;
const PALACE_WAITING='掖庭待安置';
const residenceMember=c=>!!(c?.alive&&!c.gone&&!c.cold&&!c.maid);
const residencePeople=name=>S.consorts.filter(c=>residenceMember(c)&&c.palace===name);
const palaceHost=name=>residencePeople(name).find(c=>c.residenceRoom==='main'&&c.rank>=4);
const palaceSides=name=>residencePeople(name).filter(c=>c.residenceRoom!=='main');
function palacePosition(name){
  const i=PALACES.indexOf(name)%6;
  return i<2?'近御花园':i<4?'宫苑中段':'南隅清静';
}
function residenceLabel(c){return c.palace===PALACE_WAITING?'掖庭暂居 · 待分配':c.palace==='坤宁宫'?'坤宁宫 · 中宫独居':PALACES.includes(c.palace)?`${c.palace} · ${c.residenceRoom==='main'?'一宫主位':'侧殿'}`:c.palace;}
function residenceSlot(c,name,room,exclude=[]){
  if(!residenceMember(c)||!['main','side'].includes(room))return false;
  if(c.rank===8)return name==='坤宁宫'&&room==='main'&&!residencePeople(name).some(x=>x!==c&&!exclude.includes(x));
  if(!PALACES.includes(name))return false;
  const others=residencePeople(name).filter(x=>x!==c&&!exclude.includes(x));
  return room==='main'?c.rank>=4&&!others.some(x=>x.residenceRoom==='main'):others.filter(x=>x.residenceRoom!=='main').length<PALACE_SIDE_ROOMS;
}
function autoResidence(c,keep=true){
  if(!residenceMember(c))return;
  if(c.rank===8){c.palace='坤宁宫';c.residenceRoom='main';return;}
  if(keep&&residenceSlot(c,c.palace,c.residenceRoom))return;
  // New small-rank residents prefer an established household and compatible company.
  const room=c.rank>=4?'main':'side';
  const score=name=>{const others=residencePeople(name).filter(x=>x!==c),host=palaceHost(name);
    return (room==='side'&&host?30:0)+others.reduce((n,x)=>n+relGet(c,x)/10,0)-others.length*3;};
  let available=PALACES.filter(name=>residenceSlot(c,name,room));
  let chosenRoom=room;
  if(!available.length&&room==='main'){available=PALACES.filter(name=>residenceSlot(c,name,'side'));chosenRoom='side';}
  available.sort((a,b)=>score(b)-score(a)||PALACES.indexOf(a)-PALACES.indexOf(b));
  c.palace=available[0]||PALACE_WAITING;c.residenceRoom=available.length?chosenRoom:'waiting';
}
function reconcileResidences(){
  if(!S)return;
  const people=S.consorts.filter(residenceMember).sort((a,b)=>b.rank-a.rank||a.id-b.id),pending=[];
  const queen=people.find(c=>c.rank===8);
  for(const c of people){
    if(c===queen){c.palace='坤宁宫';c.residenceRoom='main';continue;}
    // Do not quietly crown a second queen in a malformed save.
    if(c.rank===8)continue;
    if(!PALACES.includes(c.palace)){pending.push(c);continue;}
    if(c.residenceRoom===undefined)c.residenceRoom=c.rank>=4&&!people.some(x=>x!==c&&x.palace===c.palace&&x.residenceRoom==='main')?'main':'side';
    if(c.residenceRoom==='main'&&c.rank<4)c.residenceRoom='side';
  }
  for(const name of PALACES){
    const here=people.filter(c=>c.palace===name),heads=here.filter(c=>c.residenceRoom==='main');
    heads.slice(1).forEach(c=>c.residenceRoom='side');
    here.filter(c=>c.residenceRoom!=='main').slice(PALACE_SIDE_ROOMS).forEach(c=>pending.push(c));
  }
  const unique=[...new Set(pending)];
  const old=new Map(unique.map(c=>[c.id,c.palace]));
  unique.forEach(c=>{c.palace=PALACE_WAITING;c.residenceRoom='waiting';});
  for(const c of unique){
    autoResidence(c,false);
    if(old.get(c.id)==='坤宁宫')story(c,`内务府校正居册：坤宁宫为中宫独居，改居${residenceLabel(c)}。`);
  }
}
function residenceMovePlan(c,name,room){
  if(!inPalace(c)||c.rank===8||!residenceMember(c)||!PALACES.includes(name)||!['main','side'].includes(room))return null;
  if(c.palace===name&&c.residenceRoom===room)return null;
  const host=room==='main'?palaceHost(name):null;
  const swap=host&&host!==c?host:null;
  if(swap&&(!inPalace(swap)||c.residenceRoom!=='main'||!PALACES.includes(c.palace)||!residenceSlot(swap,c.palace,'main',[c])))return null;
  if(!residenceSlot(c,name,room,swap?[swap]:[]))return null;
  return {from:c.palace,fromRoom:c.residenceRoom,to:name,room,swap:swap?.id||null};
}
function settleResidenceMove(c,plan,why='奉旨调整居所'){
  if(!plan||JSON.stringify(residenceMovePlan(c,plan.to,plan.room))!==JSON.stringify(plan)||!useE())return null;
  const swap=plan.swap&&byId(plan.swap),oldPeers=residencePeople(plan.from).filter(x=>x!==c&&x!==swap);
  c.palace=plan.to;c.residenceRoom=plan.room;delete c.initiative;
  if(swap){swap.palace=plan.from;swap.residenceRoom='main';delete swap.initiative;}
  const line=`${why}：${fullName(c)}由${plan.from}${plan.fromRoom==='main'?'正殿':'侧殿'}迁至${residenceLabel(c)}${swap?`；${fullName(swap)}换居${plan.from}正殿`:''}。`;
  const moved=[c,...(swap?[swap]:[])];
  for(const person of moved){
    story(person,line);remember(person,'move',line);person.lastResidenceMove=S.turn;
    for(const k of nurseryChildren(person.palace).filter(k=>youngChildMother(k)?.id===person.id))kstory(k,`随${k.foster?'养母':'生母'}${fullName(person)}迁居${person.palace}。`);
  }
  cchg(c,{mood:6});if(swap){const upset=['骄纵','骄矜','善妒'].includes(swap.trait);cchg(swap,{mood:upset?-10:-3});if(upset)relAdd(swap,c,-8);}
  for(const peer of oldPeers){if(relGet(c,peer)>=30){story(peer,`${fullName(c)}奉旨迁往${c.palace}，同宫相伴的日子暂告一段落。`);cchg(peer,{mood:-3});}}
  for(const peer of residencePeople(c.palace).filter(x=>x!==c)){
    const liking=relGet(c,peer);story(peer,`${fullName(c)}迁入${c.palace}${c.residenceRoom==='main'?'，出任主位':'侧殿'}，与自己同住。`);
    if(liking>=30){cchg(peer,{mood:4});relAdd(c,peer,3);}else if(liking<=-25)cchg(peer,{mood:-5});
  }
  resetMapPosition(S.pos);log(line);save('auto');return line+'随母居住的幼儿一同迁居；其他同宫妃嫔保留原来的住处。';
}
function residenceMoveEvent(c,name,room){
  const plan=residenceMovePlan(c,name,room);if(!plan)return null;
  const other=plan.swap&&byId(plan.swap),host=palaceHost(name);
  return {title:other?'两宫换居':'安排居所',cast:[c,other||host].filter(Boolean),valid:()=>JSON.stringify(residenceMovePlan(c,name,room))===JSON.stringify(plan),
    text:`${fullName(c)}现居${residenceLabel(c)}。\n拟安排：${name}${room==='main'?'正殿，任一宫主位':`侧殿${host?'，与主位'+fullName(host)+'同住':'，此宫暂缺主位'}`}。${other?`\n${fullName(other)}将换至${c.palace}正殿；其他同宫人不随主位迁移。`:''}\n${palacePosition(name)}。随母幼儿一同迁居。此事需精力1。`,choices:[
      {t:other?'下旨互换两宫':'按此安排',cond:()=>E().energy>0,f:()=>settleResidenceMove(c,plan)},
      {t:'暂不调整'}]};
}
function residenceSummary(name){
  if(name==='坤宁宫')return '<p class="hint">中宫独居，不安排其他妃嫔同住；随皇后养育的幼儿不受此限。</p>';
  if(!PALACES.includes(name))return '';
  const host=palaceHost(name);
  return `<p class="hint">${palacePosition(name)} · 主位 ${host?`<button class="person-link" onclick="A.go('consort',${host.id})">${esc(fullName(host))}</button>${host.templeStay?'（寺中暂修，保留居所）':''}`:'空缺（嫔位及以上可任）'} · 侧殿 ${palaceSides(name).length}/${PALACE_SIDE_ROOMS}</p>`;
}
function viewResidences(){
  const c=byId(UI.sel),selected=inPalace(c)&&c.rank!==8?c:null;
  return `<h2>宫室分配${backBtn}</h2><p class="hint">坤宁宫为皇后独居。十二宫各设一名主位（嫔位及以上）和三处侧殿。晋位不等于另获一宫，主位满额时可暂居侧殿。迁居需精力1。</p>
    <div class="residence-picker" aria-label="选择安排住处的妃嫔">${harem().filter(x=>x.rank!==8).map(x=>`<button class="btn ${x===selected?'primary':''}" aria-pressed="${x===selected}" onclick="A.openResidence(${x.id})">${esc(fullName(x))} · ${esc(cName(x))}</button>`).join('')}</div>
    ${selected?`<header class="residence-selected">${porImg(selected,96)}<div><h3>为${esc(fullName(selected))}安排住处</h3><p>${esc(residenceLabel(selected))}</p><button class="btn quiet" onclick="A.go('consort',${selected.id})">查看人物 →</button></div></header>`:'<p>先选择要安排住处的人，再选择正殿或侧殿。</p>'}
    <section class="residence-palace"><h3>坤宁宫 · 皇后专居</h3>${residenceSummary('坤宁宫')}<p>${empress()?esc(fullName(empress())):'中宫暂缺，保留宫室'}</p></section>
    <div class="residence-grid">${PALACES.map(name=>{
      const host=palaceHost(name),sides=palaceSides(name),head=selected&&residenceMovePlan(selected,name,'main'),side=selected&&residenceMovePlan(selected,name,'side');
      return `<section class="residence-palace"><h3>${name}</h3>${residenceSummary(name)}<p>${esc(PALACE_NOTES[name])}</p><div class="residence-occupants">${[host,...sides].filter(Boolean).map(x=>`<button class="residence-person" onclick="A.go('consort',${x.id})">${porImg(x,52)}<span>${esc(fullName(x))}<small>${x===host?'主位':'侧殿'} · ${esc(cName(x))}${x.templeStay?' · 暂在寺中':''}</small></span></button>`).join('')||'<p class="hint">暂时无人居住</p>'}</div>
        ${selected?`<div class="acts"><button class="btn" onclick="A.moveResidence(${selected.id},'${name}','main')" ${head?'':'disabled'}>${selected.rank<4?'嫔位起可任主位':host===selected?'现任主位':host?'与'+esc(fullName(host))+'换宫':'安排为主位'}</button><button class="btn" onclick="A.moveResidence(${selected.id},'${name}','side')" ${side?'':'disabled'}>${selected.palace===name&&selected.residenceRoom==='side'?'现居侧殿':sides.length>=PALACE_SIDE_ROOMS?'侧殿已满':'安排侧殿'+(host?'同住':'')}</button></div>`:''}</section>`;
    }).join('')}</div>`;
}
function residencePetitionFor(c){
  if(!inPalace(c)||c.rank===8||S.turn-(c.lastResidenceRequest??-99)<36||S.turn-(c.lastResidenceMove??-99)<6)return null;
  const choices=[];
  const friend=harem().filter(x=>x!==c&&x.rank!==8&&x.palace!==c.palace&&relGet(c,x)>=35).sort((a,b)=>relGet(c,b)-relGet(c,a))[0];
  if(friend){const plan=residenceMovePlan(c,friend.palace,'side');if(plan)choices.push({plan,peer:friend,reason:`“${fullName(friend)}与臣妾一向说得来。若能同住，闲时也好相伴。”`});}
  const proud=['骄纵','骄矜','善妒'].includes(c.trait)&&c.favor>=65&&(c.rank>=4||c.preg>0);
  const quiet=['淡泊','沉静','体弱'].includes(c.trait);
  const garden=proud||c.trait==='活泼'||c.hobby==='侍花';
  const room=c.residenceRoom==='main'?'main':'side';
  if(quiet||garden){
    const area=quiet?'南隅清静':'近御花园';
    if(palacePosition(c.palace)!==area)for(const name of PALACES.filter(n=>palacePosition(n)===area)){
      const plan=residenceMovePlan(c,name,room);if(!plan)continue;
      choices.push({plan,peer:plan.swap&&byId(plan.swap),reason:quiet?'“臣妾想择一处清静院落，窗下读书养神，不必日日听人来往。”':proud?`“臣妾想住得离御花园近些。${c.preg?'如今有了身子，晴日散步也方便。':'若正殿已有主人，请陛下替臣妾议一议。'}”`:'“花开时总想早些去看。若能住得近些，便不必绕那么长的宫道了。”'});
    }
  }
  return choices[0]||null;
}
function residencePetitionEvent(){
  if(S.turn-(S.flags.lastResidenceRequest??-99)<12||!chance(.12))return null;
  const candidates=harem().map(c=>({c,request:residencePetitionFor(c)})).filter(x=>x.request);if(!candidates.length)return null;
  const {c,request}=pick(candidates),{plan,reason,peer}=request;
  let resolved=false;
  const valid=()=>!resolved&&inPalace(c)&&JSON.stringify(residenceMovePlan(c,plan.to,plan.room))===JSON.stringify(plan);
  return {title:'迁宫之请',cast:[c,peer].filter(Boolean),present:[c],valid,
    onQueue:()=>{S.flags.lastResidenceRequest=S.turn;c.lastResidenceRequest=S.turn;},
    text:`${cName(c)}提起居处，先看了看你的神色。\n${reason}\n她想迁往${plan.to}${plan.room==='main'?'正殿':'侧殿'}。${plan.swap?`这会让${fullName(byId(plan.swap))}换往${plan.from}正殿。`:''}`,choices:[
      {t:'准她所请 · 精力−1',cond:()=>E().energy>0,f:()=>settleResidenceMove(c,plan,'准其迁宫之请')},
      {t:'仍按原居处，温言说明',f:()=>{if(!valid())return null;resolved=true;const text=`请求迁往${plan.to}，陛下以宫室已有安排为由未允。`;story(c,text);cchg(c,{mood:['骄纵','骄矜'].includes(c.trait)?-5:-1});save('auto');return text;}},
      {t:'另看各宫安排',f:()=>{A.openResidence(c.id);return null;}}]};
}
A.openResidence=function(id){reconcileResidences();A.go('residences',id||null);};
A.moveResidence=function(id,name,room){if(!modalOpen)pushEv(residenceMoveEvent(byId(id),name,room));};
