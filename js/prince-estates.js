/* Royal residences use the same child and household records across reigns. */
const PRINCE_FIEFS=['西安','太原','开封'];
const princeEstateLabel=k=>k.title?`${k.title}府`:`${k.name}王府`;
const princeFief=k=>PRINCE_FIEFS.includes(k.princeEstate?.location)?k.princeEstate.location:'';
const princeEstatePlace=k=>k.away?princeFief(k)||'外地封地':'京城';
const princeEstateHolder=k=>k?.sex==='m'&&!!(k.princeEstate||k.away)&&!k.removedFromRoyal&&!k.pendingName&&S.heir!==k.id;
const princeEstateEligible=k=>!!k?.alive&&princeEstateHolder(k);
const princeEstateById=id=>{const k=royalById(id);return princeEstateEligible(k)||princeProbate(k)?k:null;};
const princeEstateAvailable=k=>princeEstateEligible(k)&&!k.jailed&&!k.templeStay&&!immortalAway(k)&&!k.gone;
function princeEstateLink(k){
  return princeEstateEligible(k)||princeProbate(k)?`<button class="btn sm jade" onclick="A.go('prince-estate',${royalActionArg(k.id)})">查看王府</button>`:'';
}
function princeEstatesPanel(){
  const princes=royalHouseholds().filter(k=>princeEstateAvailable(k)||princeProbate(k)).sort(royalBirthOrder);
  const group=(title,people)=>people.length?detailSection(title,`<div class="grid">${people.map(k=>
    `<button class="card" onclick="A.go('prince-estate',${royalActionArg(k.id)})">${porImg(k,44)}<span class="grow"><b>${esc(princeEstateLabel(k))}</b><small>${esc(k.reign?`${royalKinship(k)} ${k.name}`:k.name)} · ${esc(princeEstatePlace(k))}${!k.alive?' · 待议袭爵':''}${k.royalKinContact?.reply?.unread?' · 有回信':''}${princeDocketPending(k).length?' · 长史奏报待批':''}</small></span></button>`).join('')}</div>`):'';
  return princes.length?`<section class="palace-activity"><h3>王府</h3>${group('京中王府',princes.filter(k=>!k.away))}${group('外地藩邸',princes.filter(k=>k.away))}</section>`:'';
}
const princeMoveWait=k=>Math.max(0,(k.princeEstate?.lastMove??-99)+6-S.turn);
const princeMoveReady=k=>!S.over&&princeEstateAvailable(k)&&kidAge(k)>=16&&!princeMoveWait(k)&&!k.royalKinContact?.pending;
function viewPrinceEstate(){
  const k=princeEstateById(UI.sel);if(!k)return viewOut();
  const id=royalActionArg(k.id);
  const local=!k.away, mother=k.reign&&familyHostById(k.mom);
  const father=k.princelySuccession&&royalById(k.princelySuccession.father),birth=princeAdoptionActive()&&k.princeAdoption?princeBiologicalParents(k):null;
  const estateMother=birth?.mother||(father&&princeSonMother(father,k));
  const motherLink=estateMother?`<button class="person-link" onclick="A.princeFamilyMemo(${id},${royalActionArg(estateMother.id)})">${esc(estateMother.name)}</button>`:mother?.familyArchive?`<button class="person-link" onclick="A.go('consort',${mother.id})">${esc(k.momName||fullName(mother))}</button>`:outsideMotherLink(k);
  const caption=local?'京中开府':princeFief(k)?`就藩 · ${princeFief(k)}`:'已就藩 · 藩地未载';
  const wait=princeMoveWait(k);
  const res=princeEstateAvailable(k)?`<div class="acts"><button class="btn jade" onclick="A.princeEstateMove(${id})" ${princeMoveReady(k)?'':'disabled'}>${local?'商议就藩':'奉诏回京'}${wait?`<small>还需 ${wait} 个月</small>`:''}</button>
    ${!local&&!princeFief(k)&&princeMoveReady(k)?`<button class="btn" onclick="A.princeRegisterFief(${id})">补录藩地</button>`:''}</div>`:'';
  const state=!k.alive?'王爷薨逝，府中治丧，暂由长史理事。':!princeEstateAvailable(k)?`${childWhereabouts(k)} · 暂停王府往来`:k.royalKinContact?.pending?'家书已经寄出，等收到回信后再议行止。':!local&&wait?`回京还需等 ${wait} 个月。`:local?'在京居住，可到府探望，也可另议出京就藩。':'藩邸由王府料理，地方政务仍归有司。';
  return `<button class="btn quiet sm" onclick="A.go('out')">← 返回出巡</button>
    <header class="detail-head">${porImg(k,112)}<div class="grow"><p>${esc(caption)} · ${k.alive?kidAge(k)+'岁':'已薨'}</p><h2>${esc(princeEstateLabel(k))}</h2><p>${esc(k.reign?`${royalKinship(k)} ${k.name}`:k.name)}${birth?.father?` · 生父 <button class="person-link" onclick="A.princeFamilyMemo(${id},${royalActionArg(birth.father.id)})">${esc(birth.father.name)}</button>`:''} · 生母 ${motherLink}</p></div></header>
    ${pageChapters('prince-estate',[
      ['residence','居处与藩务',detailSection('居处',`<p>${esc(state)}</p>${res}`)],
      ['dockets','长史奏报',princeDocketPanel(k)],
      ['succession','世子与袭爵',princeSuccessionPanel(k)],
      ['family','家人与往来',princeAdoptionContactPanel(k)+royalKinContactButtons(k,true)+marriagePanel(k)+householdPanel(k)],
      ['history','王府记事',detailStory(k)]
    ])}`;
}
function princeEstateRecord(k,line){
  if(k.reign){kstory(k,line);const mother=familyHostById(k.mom);if(mother?.alive)story(mother,line);}
  else childSeparationMemory(k,line,k.away?-.25:.35);
  log(line,1);
}
function princeFiefChoices(k,register=false){
  const valid=()=>princeEstateById(k.id)===k&&princeMoveReady(k)&&(register?k.away&&!princeFief(k):!k.away);
  const chooseFief=location=>()=>{
    if(!valid())return null;
    k.princeEstate={...k.princeEstate,opened:k.princeEstate?.opened??S.turn,location,...(register?{}:{lastMove:S.turn})};
    if(!register){k.away=true;k.sup=clamp((k.sup||0)-20);}
    const line=register?`宗人府补录${k.name}的藩邸在${location}。`:`${k.name}奉诏离京，赴${location}就藩，由长史料理府务，地方政务仍归有司。`;
    princeEstateRecord(k,line);return line;
  };
  return {title:register?'王府 · 补录藩地':'王府 · 商议就藩',por:k,valid,
    text:register?'旧册只记了他已就藩。请选择要补录的藩邸。':`${k.name}入殿听旨。请择一处藩邸，他将离京赴任，在京的储位支持会下降。`,
    choices:[...PRINCE_FIEFS.map(place=>({t:register?`录入${place}`:`命他赴${place}就藩`,f:chooseFief(place)})),{t:'暂缓'}]};
}
A.princeRegisterFief=function(id){
  const k=princeEstateById(id);if(!modalOpen&&k?.away&&!princeFief(k)&&princeMoveReady(k))pushEv(princeFiefChoices(k,true));
};
A.princeEstateMove=function(id){
  const k=princeEstateById(id);if(modalOpen||!princeMoveReady(k))return;
  if(!k.away){pushEv(princeFiefChoices(k));return;}
  const valid=()=>princeEstateById(id)===k&&k.away&&princeMoveReady(k);
  pushEv({title:'王府 · 奉诏回京',por:k,valid,text:`${k.name}在${princeEstatePlace(k)}居住。若奉诏回京，改住京中王府，今后可当面见他。`,choices:[
    {t:'下诏召他回京',f:()=>{if(!valid())return null;
      k.away=false;k.princeEstate={...k.princeEstate,opened:k.princeEstate?.opened??S.turn,location:'京城',lastMove:S.turn};
      const line=`${k.name}奉诏回京，迁入京中王府。`;princeEstateRecord(k,line);return line;
    }},{t:'暂缓'}]});
};

const PRINCE_DOCKET_ITEMS={
  grain:{title:'禄米',text:()=> '长史呈上本季禄米用度，请照例从官仓支给，由国库补足采办与转运。',
    choices:[['照例支给 · 国库−12万两',12,'准依例支给本季禄米'],['减半支给 · 国库−6万两',6,'准先支一半，其余由王府存粮周转']]},
  repair:{title:'王府修缮',text:r=>`长史查验，${r.work}。拟按原有规制修补，请朝廷核准。`,
    choices:[['准修并拨款 · 国库−20万两',20,'准按原制修缮，由朝廷拨付'],['准修，由王府自筹',0,'准按原制修缮，由王府自筹']]},
  wedding:{title:'婚礼用度',text:r=>`礼部已登记王爷与${r.spouse}的婚事。长史呈上婚礼礼目与支用清册，请核准婚仪费用。`,
    choices:[['准奏并赐婚仪银 · 国库−15万两',15,'核准婚仪，并赐婚仪银'],['准照礼办理，由王府自付',0,'核准婚仪，礼费由王府自付']]}
};
const princeDocketsActive=()=>journalContentVersion()>=55;
const princeDocketPending=k=>princeDocketsActive()?k.princeEstate?.docket?.pending||[]:[];
function princeQuarterReports(){
  if(!princeDocketsActive()||(S.month-1)%3!==0)return null;
  const filed=[];
  for(const k of royalHouseholds().filter(k=>k.away&&princeEstateAvailable(k)).sort(royalBirthOrder)){
    const estate=k.princeEstate||={opened:S.turn};
    const docket=estate.docket||={pending:[],decisions:{}};
    if(docket.lastQuarter===S.turn)continue;
    docket.lastQuarter=S.turn;
    const newItems=[];
    const add=(kind,details)=>{
      if(docket.pending.some(r=>r.kind===kind))return;
      const report={kind,at:S.turn,date:dateStr(),place:princeEstatePlace(k),...details};
      docket.pending.push(report);newItems.push(PRINCE_DOCKET_ITEMS[kind].title);
    };
    add('grain');
    if(S.turn-(docket.decisions.repair?.at??-99)>=12)add('repair',{work:S.year%2?'王府前厅屋面漏雨，库房门窗也须补修':'王府外墙有裂缝，廊下排水沟亦有淤塞'});
    const spouse=k.married&&k.spouse,age=spouse?S.turn-spouse.marriedAt:Infinity;
    if(age>=0&&age<=3&&docket.wedding!==spouse.marriedAt&&!docket.pending.some(r=>r.kind==='wedding')){
      add('wedding',{spouse:spouse.name});docket.wedding=spouse.marriedAt;
    }
    if(newItems.length)filed.push({k,summary:newItems.join('、')});
  }
  if(!filed.length)return null;
  const single=filed.length===1;
  return {title:'王府长史 · 季度奏报',text:`各藩邸长史呈上本季府务。\n${filed.map(({k,summary})=>`${princeEstateLabel(k)} · ${princeEstatePlace(k)}：${summary}`).join('\n')}`,
    choices:[{t:single?'前往王府批阅':'查看各府奏报',f:()=>{A.go(single?'prince-estate':'out',single?filed[0].k.id:null);return null;}},{t:'稍后批阅'}]};
}
function princeDocketPanel(k){
  if(!princeDocketsActive()||!k.away&&!k.princeEstate?.docket)return '';
  const pending=princeDocketPending(k),decisions=Object.values(k.princeEstate?.docket?.decisions||{}).sort((a,b)=>b.at-a.at);
  const reports=pending.map(r=>`<p>${esc(r.date)} · ${esc(PRINCE_DOCKET_ITEMS[r.kind].title)}
    <button class="btn sm jade" onclick="A.princeDocket(${royalActionArg(k.id)},'${r.kind}')" ${princeEstateAvailable(k)&&!S.over?'':'disabled'}>批阅${esc(PRINCE_DOCKET_ITEMS[r.kind].title)}</button></p>`).join('');
  const previous=decisions.map(d=>`<p class="hint">${esc(d.date)} · ${esc(d.text)}</p>`).join('');
  return (reports||`<p>${k.away?'暂无待批事项。长史在正月、四月、七月和十月呈报。':'目前没有待批的藩邸奏报。'}</p>`)+previous;
}
A.princeDocket=function(id,kind){
  const k=princeEstateById(id);
  if(modalOpen||!princeDocketsActive()||!princeEstateAvailable(k)||S.over)return;
  const item=PRINCE_DOCKET_ITEMS[kind],report=princeDocketPending(k).find(r=>r.kind===kind);
  if(!item||!report)return;
  const valid=()=>!S.over&&princeEstateById(id)===k&&princeEstateAvailable(k)&&princeDocketPending(k).includes(report);
  const resolve=(cost,decision)=>()=>{
    if(!valid()||cost&&E().treasury<cost)return null;
    if(cost)chg({treasury:-cost});
    const docket=k.princeEstate.docket;
    docket.pending=docket.pending.filter(r=>r!==report);
    const line=`【长史奏报 · ${item.title}】${princeEstateLabel(k)}（${report.place}，${report.date}呈）${decision}${cost?`，国库拨银${cost}万两`:''}。`;
    docket.decisions[kind]={at:S.turn,date:dateStr(),text:line};
    kstory(k,line);log(line,1);return line;
  };
  pushEv({title:`长史奏报 · ${item.title}`,por:k,valid,text:`${princeEstateLabel(k)} · ${report.place} · ${report.date}\n${item.text(report)}`,
    choices:[...item.choices.map(([t,cost,decision])=>({t,cond:()=>!cost||E().treasury>=cost,why:'国库不足',f:resolve(cost,decision)})),
      {t:'稍后再批'}]});
};
