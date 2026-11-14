/* Saved journeys, care arrangements and mothers' concern for children living away. */
function childWhereabouts(k){
  if(k.templeStay)return '护国寺';
  if(k.birthSwap?.occurred&&k.parentage?.decision==='family')return '宫外亲生父母家';
  if(k.parentage?.decision==='household')return '生父皇子府';
  if(k.jailed)return '宗人府';
  if(k.princessMarriage==='frontier')return '北境';
  if(k.away)return '封地';
  if(k.estate)return k.sex==='f'?'公主府':'皇子府';
  if(k.princeEstate)return '京中皇子府';
  return '宫中';
}
function openPrinceEstate(k,record=true){
  if(k.sex!=='m'||!k.alive||k.pendingName||k.removedFromRoyal||S.heir===k.id||kidAge(k)<16||k.princeEstate)return false;
  k.princeEstate={opened:S.turn,location:'京城'};
  if(record){childSeparationMemory(k,`${k.name}在京开府，迁出宫中，自此居于皇子府。`,.1);log(`${k.name}在京开府，迁居皇子府。`);}
  return true;
}
function reconcilePrinceResidence(k){
  if(k.sex==='m'&&(kidAge(k)>=18||(k.adult&&kidAge(k)>=16)))openPrinceEstate(k,false);
}
function distantChildren(c){
  return S.children.filter(k=>k.alive&&!k.pendingName&&(k.mom===c.id||k.foster===c.id)&&
    (c.templeStay?!k.templeStay:childHasLeftPalace(k)));
}
function reconcileMotherConcern(c){
  const children=distantChildren(c);
  if(!children.length){delete c.childConcern;return null;}
  c.childConcern ||= {value:35,since:S.turn,lastTick:S.turn};
  c.childConcern.children=children.map(k=>k.id);
  return c.childConcern;
}
function childSeparationMemory(k,text,emotion=-.4){
  kstory(k,text);
  const mothers=mothersOf(k).filter(c=>c.alive);
  for(const c of mothers){
    story(c,text);reconcileMotherConcern(c);
    NPCMemory.record(S,{type:'child-journey',time:S.turn,location:childWhereabouts(k),participants:[c.id,k.id],object:k.name},[
      {person:c.id,subject:k.id,interpretation:text,emotion,impact:75},
      {person:k.id,subject:c.id,interpretation:text,emotion:emotion*.5,impact:65}
    ]);
  }
}
function templeEligible(k){return !!(k?.alive&&!k.jailed&&!k.pendingName&&!k.templeStay&&!S.over);}
function sendChildToTemple(k,{months=6,reason='prayer'}={}){
  if(!templeEligible(k))return false;
  k.templeStay={from:S.turn,due:months==null?null:S.turn+months,reason};
  const care=kidAge(k)<6?'乳母与随侍一同前往，安置在寺旁客舍照护。':'随侍陪同，课业与起居仍有人照料。';
  childSeparationMemory(k,`${k.name}奉旨赴护国寺${reason==='parentage'?'暂居养护':'祈福'}。${care}`);
  for(const c of mothersOf(k).filter(c=>c.alive)){
    if(c.templeStay){cchg(c,{mood:6});continue;}
    cchg(c,{mood:-8});setXin(c,'思念',`${k.name}远在护国寺`);
  }
  log(`${k.name}赴护国寺，已安排随行照护。`,1);
  return true;
}
function returnChildFromTemple(k){
  if(!k?.alive||!k.templeStay||k.removedFromRoyal)return false;
  delete k.templeStay;
  const destination=childWhereabouts(k);
  childSeparationMemory(k,`${k.name}结束护国寺的居留，返回${destination}。`,.7);
  for(const c of mothersOf(k).filter(c=>c.alive)){
    cchg(c,{mood:10});const concern=reconcileMotherConcern(c);if(concern)concern.value=clamp(concern.value-15);
    if(!concern&&xinOf(c)==='思念')setXin(c,'释然',`${k.name}已平安回来`);
  }
  log(`${k.name}结束祈福，返回${destination}。`);return true;
}
function childTempleTick(){
  S.children.forEach(reconcilePrinceResidence);
  for(const k of S.children)if(k.alive&&k.templeStay?.due!=null&&S.turn>=k.templeStay.due&&!k.removedFromRoyal)returnChildFromTemple(k);
  for(const c of S.consorts)if(c.templeStay){
    if(!c.alive||c.gone||c.cold)delete c.templeStay;
    else if(c.templeStay.due!=null&&S.turn>=c.templeStay.due)returnConsortFromTemple(c);
  }
  for(const c of alive()){
    const concern=reconcileMotherConcern(c);if(!concern||concern.lastTick===S.turn)continue;
    concern.lastTick=S.turn;concern.value=clamp(concern.value+(['温婉','体弱','痴情'].includes(c.trait)?4:2));
    if((S.turn-concern.since)%3===0)cchg(c,{mood:-2});
  }
}
function childTemplePanel(k){
  if(!k.alive||k.pendingName)return '';
  const stay=k.templeStay;
  if(stay)return `<p><strong>护国寺${stay.reason==='parentage'?' · 暂居养护':' · 祈福'}</strong> · ${stay.due==null?'未定归期':`还有${Math.max(0,stay.due-S.turn)}个月`}</p>
    <p class="hint">${kidAge(k)<6?'乳母随行照护，不作剃度。':'随侍照料，课业照常。'}寺中居留时不参加宫内活动。</p>
    ${!k.removedFromRoyal?`<button class="btn jade" onclick="A.recallTemple(${k.id})">${k.away||k.estate||k.princeEstate?'结束祈福，返回原居处':'接回宫中'}</button>`:''}`;
  return '';
}
function motherConcernPanel(c){
  const children=distantChildren(c);if(!children.length)return '';
  return `${bar('牵挂',c.childConcern?.value??35,'#936375')}<p>${children.map(k=>`<button class="person-link" onclick="A.go('kid',${k.id})">${esc(k.name)}</button> · ${esc(childWhereabouts(k))}`).join('；')}</p>
    <p class="hint">离别会加深牵挂，每隔数月影响心情；${c.templeStay?'结束清修、与孩子团聚':'递送平安信或让孩子回来'}，可稍解相思。</p>
    ${inPalace(c)?`<button class="btn jade" onclick="A.childPeaceLetter(${c.id})" ${S.turn-(c.childConcern?.lastLetter??-99)<3?'disabled':''}>递一封孩子的平安信<small>${S.turn-(c.childConcern?.lastLetter??-99)<3?'三个月可再递信':'精力-1'}</small></button>`:''}`;
}
function motherConcernVoice(c){
  const k=distantChildren(c)[0];if(!k)return null;
  const place=childWhereabouts(k),young=kidAge(k)<6;
  const line=['持重','淡泊'].includes(c.trait)?`${k.name}在${place}，臣妾知道有人照看。只是天凉了，还想问一声，冬衣可添得及时。`:
    c.trait==='将门'?`${k.name}去了${place}，臣妾嘴上说不必挂心，夜里却总想，孩子可曾睡得安稳。`:
    `${k.name}远在${place}。${young?'孩子夜里认人，醒了若找不到臣妾，不知会不会哭。':'臣妾把想说的话写了又删，只怕一封信太长，倒叫孩子担心。'}`;
  return voiceLine('distant-child','她望向宫门的方向，提起远方的孩子。',line);
}
function kidTemplePlanEvent(k){
  if(!templeEligible(k))return null;
  return {title:'护国寺祈福',por:k,valid:()=>templeEligible(k),text:`安排${k.name}到护国寺住一段日子。${kidAge(k)<6?'乳母与随侍同往，住寺旁客舍，不作剃度。':'随侍照料，读书习字照常。'}\n生母与养母会惦念远行的孩子，可送平安信，也可提前接回。\n${k.parentage&&!k.parentage.decision?'身世仍待查证，暂居护国寺不等于认定有罪。':''}`,choices:[
    ...[6,12].map(months=>({t:`祈福${months===6?'半年':'一年'} · 国库−10万两`,cond:()=>E().treasury>=10,why:'国库不足',f:()=>{
      if(!templeEligible(k)||E().treasury<10)return null;
      if(sendChildToTemple(k,{months})){chg({treasury:-10});save('auto');return `${k.name}已启程。祈福届期会返回${k.away||k.estate||k.princeEstate?'原居处':'宫中'}，详情中可提前接回。`;}
      return null;
    }})),{t:'暂且留在身边'}]};
}
A.kidTemple=function(id){
  if(modalOpen)return;pushEv(kidTemplePlanEvent(kidById(id)));
};
A.recallTemple=function(id){
  const k=kidById(id);if(S.over||modalOpen||!k?.alive||!k.templeStay||k.removedFromRoyal)return;
  pushEv({title:'迎归',por:k,valid:()=>!!(k.alive&&k.templeStay&&!k.removedFromRoyal),text:`结束${k.name}在护国寺的居留，安排车驾接回原居处？`,choices:[
    {t:'遣人迎回',f:()=>{if(!returnChildFromTemple(k))return null;save('auto');return `${k.name}平安归来，亲人终于放下心。`;}},{t:'再留一阵'}]});
};
A.childPeaceLetter=function(id){
  const c=byId(id);if(S.over||modalOpen||!inPalace(c)||!distantChildren(c).length)return;
  const concern=reconcileMotherConcern(c);if(S.turn-(concern.lastLetter??-99)<3||!useE())return;
  concern.lastLetter=S.turn;concern.value=clamp(concern.value-18);cchg(c,{mood:8,aff:3});
  const children=distantChildren(c),text=children.map(k=>`${k.name}在${childWhereabouts(k)}起居安稳，${kidAge(k)<6?'乳母代报平安':'随信带来了近来的字课与问候'}。`).join('\n');
  story(c,'读到远方孩子的平安信，稍解牵挂。');remember(c,'care','陛下递来远方孩子的平安信');
  pushEv({title:'一纸平安',por:c,cast:children,text:text+'\n她将信仔细折好，收进贴身的匣子。',choices:[ok1]});save('auto');
};

function consortTempleEligible(c){return !!(inPalace(c)&&!c.maid&&!c.preg&&!S.over);}
function sendConsortToTemple(c,months){
  if(!consortTempleEligible(c))return false;
  if(c.visitor){story(c,'赴寺前，母亲先行返家。');delete c.visitor;}
  c.templeStay={from:S.turn,due:months==null?null:S.turn+months,reason:'retreat'};
  delete c.initiative;reconcilePalaceRomance();reconcileMotherConcern(c);
  const text=`奉旨赴护国寺${months===3?'祈福三个月':months===6?'清修半年':'清修，未定归期'}，宫女随行，暂不参与宫内活动。`;
  story(c,text);remember(c,'temple-retreat',text);log(`${fullName(c)}${text}`,1);
  return true;
}
function returnConsortFromTemple(c){
  if(!c?.alive||c.cold||c.gone||!c.templeStay)return false;
  delete c.templeStay;reconcileMotherConcern(c);cchg(c,{mood:6});
  story(c,`结束护国寺的居留，返回${c.palace}。`);log(`${fullName(c)}从护国寺回宫。`);return true;
}
function consortTemplePanel(c){
  if(!c.alive||!c.templeStay)return '';
  return `<p>护国寺清修 · ${c.templeStay.due==null?'未定归期':`还有${Math.max(0,c.templeStay.due-S.turn)}个月`}</p><p class="hint">宫女随行，原宫室与位分保留。寺居期间不参与宫内活动、宴请或召幸。</p><button class="btn jade" onclick="A.recallConsortTemple(${c.id})">迎她回宫</button>`;
}
function consortTemplePlanEvent(c){
  if(!consortTempleEligible(c))return null;
  return {title:'护国寺清修',por:c,valid:()=>consortTempleEligible(c),text:`安排${fullName(c)}到护国寺祈福或清修。宫女随行，原宫室与位分保留；寺居期间不参与宫内宴请、召幸与日常活动。${S.children.some(k=>k.alive&&(k.mom===c.id||k.foster===c.id))?'\n孩子仍按原安排由乳母与宫人照护，母子分居会留下牵挂。':''}\n可约定归期，也可日后迎回。`,choices:[
    ...[[3,'祈福三个月'],[6,'清修半年'],[null,'留寺清修，暂不定归期']].map(([months,label])=>({t:label+' · 国库−10万两',cond:()=>E().treasury>=10,f:()=>{
      if(E().treasury<10||!sendConsortToTemple(c,months))return null;chg({treasury:-10});save('auto');return `${fullName(c)}已赴护国寺，随行与居留事宜均已安排。`;
    }})),{t:'暂不安排'}]};
}
function templeRosterEvent(kind,page=0){
  const people=kind==='kids'?S.children.filter(templeEligible):alive().filter(consortTempleEligible),size=6;
  const pages=Math.max(1,Math.ceil(people.length/size));page=Math.max(0,Math.min(page,pages-1));
  return {title:kind==='kids'?'护国寺 · 皇嗣祈福':'护国寺 · 妃嫔清修',text:people.length?'选定一人，再安排居留时间与照护。':'眼下没有适合安排的人。已有孕、被圈禁或正在寺中居留者不在本次名单中。',choices:[
    ...people.slice(page*size,(page+1)*size).map(p=>({t:kind==='kids'?`${kidName(p)} · ${kidAge(p)}岁`:`${cName(p)} · ${fullName(p)}`,person:p,f:()=>{pushNow(kind==='kids'?kidTemplePlanEvent(p):consortTemplePlanEvent(p));return null;}})),
    ...(page>0?[{t:'上一页',f:()=>{pushNow(templeRosterEvent(kind,page-1));return null;}}]:[]),
    ...(page+1<pages?[{t:'下一页',f:()=>{pushNow(templeRosterEvent(kind,page+1));return null;}}]:[]),{t:'暂不安排'}]};
}
A.recallConsortTemple=function(id){
  const c=byId(id);if(S.over||modalOpen||!c?.alive||!c.templeStay||c.cold||c.gone)return;
  pushEv({title:'迎妃回宫',por:c,valid:()=>!!(c.alive&&c.templeStay&&!c.cold&&!c.gone),text:`迎${fullName(c)}回${c.palace}，结束此次寺居？`,choices:[
    {t:'遣车驾迎回',f:()=>{if(!returnConsortFromTemple(c))return null;save('auto');return `${fullName(c)}已返回${c.palace}。`;}},{t:'再留一阵'}]});
};
