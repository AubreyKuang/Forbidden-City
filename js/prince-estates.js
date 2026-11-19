/* Royal residences use the same child and household records across reigns. */
const PRINCE_FIEFS=['西安','太原','开封'];
const princeEstateLabel=k=>k.title?`${k.title}府`:`${k.name}王府`;
const princeFief=k=>PRINCE_FIEFS.includes(k.princeEstate?.location)?k.princeEstate.location:'';
const princeEstatePlace=k=>k.away?princeFief(k)||'外地封地':'京城';
const princeEstateHolder=k=>k?.sex==='m'&&!!(k.princeEstate||k.away)&&!k.removedFromRoyal&&!k.pendingName&&S.heir!==k.id;
const princeEstateEligible=k=>!!k?.alive&&princeEstateHolder(k);
const princeEstateById=id=>{const k=royalById(id);return princeEstateEligible(k)||princeProbate(k)?k:null;};
const princeEstateAvailable=k=>princeEstateEligible(k)&&!k.jailed&&!k.templeStay&&!royalJourneyAway(k)&&!k.gone;
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
function princeFiefRequestReady(k){
  return dynastyFollowupActive()&&!!k&&S.children.includes(k)&&princeMoveReady(k)&&!k.away&&kidAge(k)>=18&&k.royalTravel?.stage!=='request';
}
function princeFiefRequestTick(){
  if(S.turn-(S.flags.lastPrinceFiefRequest??0)<18||S.children.some(k=>k.fiefRequest?.status==='pending'&&princeFiefRequestReady(k)))return;
  const candidate=S.children.filter(k=>princeFiefRequestReady(k)&&S.turn-k.princeEstate.opened>=24&&
    S.turn-(k.fiefRequest?.turn??-99)>=48&&k.princeCareer&&
    (['clan','travel'].includes(k.princeCareer.path)||S.turn-(k.princeCareer.lastDisagreement??-99)<=12))
    .sort((a,b)=>a.princeEstate.opened-b.princeEstate.opened||royalBirthOrder(a,b))[0];
  if(!candidate)return;
  const {path,lastDisagreement}=candidate.princeCareer;
  const reason=S.turn-(lastDisagreement??-99)<=12?'近来的朝议与儿臣所想不同。儿臣想离京领藩，先把自己的差事办妥。':
    path==='clan'?'儿臣想替宗室守一处藩邸，照看当地的亲眷。':'儿臣想长住一处封地，好亲眼看看地方是怎样过日子的。';
  const place=PRINCE_FIEFS[voiceHash(`prince-fief:${candidate.seed}:${S.turn}`)%PRINCE_FIEFS.length];
  candidate.fiefRequest={turn:S.turn,place,reason,status:'pending'};
  S.flags.lastPrinceFiefRequest=S.turn;
  kstory(candidate,`【王府请藩】呈表请求离京就藩${place}。`);
  log(`【王府请藩】${kidName(candidate)}呈上请藩表。`,1);
}
function princeFiefRequestEvent(k){
  const request=k?.fiefRequest;
  const valid=()=>princeFiefRequestReady(k)&&k.fiefRequest===request&&request?.status==='pending';
  if(!valid())return null;
  return {title:'王府请藩 · '+k.name,por:k,valid,text:`${kidName(k)}亲自递来请藩表：“${request.reason}若父皇允准，儿臣愿赴${request.place}。”`,choices:[
    {t:`准赴${request.place}就藩`,f:()=>{
      const line=settlePrinceFief(k,request.place);
      request.status='accepted';return line;
    }},
    {t:'眼下仍需你留京',f:()=>{
      request.status='declined';k.love=clamp(k.love-2);
      kstory(k,'【王府请藩】父皇暂不准离京，自己收回请藩表。');
      return '他领了旨，将请藩表收回，仍在京中当差。';
    }},
    {t:'留表稍后再议',f:()=>{request.reviewed=S.turn;return '内侍将请藩表留在王府记档，可另行批阅。';}}
  ]};
}
function pendingPrinceFiefRequest(){
  const k=S.children.find(person=>person.fiefRequest?.reviewed==null&&person.fiefRequest?.status==='pending'&&princeFiefRequestReady(person));
  return princeFiefRequestEvent(k);
}
A.princeReviewFiefRequest=function(id){if(!modalOpen)pushEv(princeFiefRequestEvent(kidById(id)));};
function princeFiefRequestPanel(k){
  return princeFiefRequestEvent(k)?`<div class="acts"><button class="btn sm jade" onclick="A.princeReviewFiefRequest(${royalActionArg(k.id)})">批阅请藩表</button></div>`:'';
}
function princeSpouseVisitReady(k){
  const p=k?.spouse;
  return !S.over&&!mourningActive()&&E().age>=18&&princeEstateAvailable(k)&&!k.away&&kidAge(k)>=18&&k.married&&
    p?.alive!==false&&Number.isFinite(p?.born)&&kidAge(p)>=18&&!p.away&&!p.jailed&&!p.gone&&!p.cold;
}
function princeSpouseVisitPanel(k){
  if(!princeSpouseVisitReady(k))return '';
  const visit=k.spouse.princePrivateVisit,already=visit?.gen===S.gen&&visit.last===S.turn;
  return `<div class="acts"><button class="btn quiet" onclick="A.princeSpouseVisit(${royalActionArg(k.id)})" ${already?'disabled':''}>私下求见王妃<small>${already?'本月已问过她的意思':'先问她是否愿意见面'}</small></button></div>`;
}
A.princeSpouseVisit=function(id){
  const k=princeEstateById(id);
  if(modalOpen||!princeSpouseVisitReady(k))return;
  const p=k.spouse,gen=S.gen,turn=S.turn;
  if(p.princePrivateVisit?.gen===gen&&p.princePrivateVisit.last===turn)return;
  const previous=p.princePrivateVisit?.gen===gen?p.princePrivateVisit:null;
  const trust=p.trust??50,nature=marriageNature(p).temperament;
  const odds=(trust>=70?.10:trust<45?.62:.37)+(['爽朗','好胜'].includes(nature)?.12:0);
  const willing=p.willing!==false&&mulberry32(voiceHash(`prince-spouse-visit:${p.seed||p.id}:${E().seed||gen}`))()<odds;
  let done=false;
  const valid=()=>!done&&S.gen===gen&&S.turn===turn&&k.spouse===p&&princeSpouseVisitReady(k);
  const opening=previous?.meetings?'她听见你的脚步声，手里的杯子停了一下。':'听明白你想私下见她，王妃将门口的宫人留在原地，自己先答了话。';
  const reply=!willing?'“谢过陛下。可我不愿私下相见，府里寻常的问候仍可照礼办。”':
    trust>=70?'“我愿留这一会儿，可回到屋里以后，该怎么面对他，还得我自己想清楚。”':
    ['沉静','矜持','敏感'].includes(nature)?'“我愿和陛下单独说几句话。这件事请只留在我们之间。”':
      '“既然特地来问了，我便照实答。我愿留下，陛下也可以留下。”';
  const settle=meet=>{
    if(!valid()||meet&&(!willing||!useE()))return null;
    done=true;
    const visit=p.princePrivateVisit=previous||{gen,meetings:0};
    visit.last=turn;
    if(!meet){
      princePersonNote(p,'【王府求见】'+(willing?'陛下问过自己的意思，今日只照常问候便告辞。':'她明言不愿私见，陛下听后告辞，未再相劝。'));
      return willing?'你问过府里近况便起身告辞，留她照自己的安排过这一天。':'你听完便告辞。她回到原先坐的地方，接着料理手头的事。';
    }
    visit.meetings++;
    const feeling=trust>=70?`后来${k.name}替她留了盏灯。她照常道谢，目光却停在灯芯上，没提今日见过谁。`:
      `回去后，${k.name}同她照常说了几句府里的家常，她把方才相见的事留在了心里。`;
    princePersonNote(p,'【王府私会】她亲口应允，在偏厅与你单独相会。'+feeling);
    if(visit.meetings>=2&&!visit.noticed&&chance(.10)){
      visit.noticed=true;
      kstory(k,'【王府闲话】听内侍说偏厅近来曾单独待客，问了来人是谁，仍没人能给个准话。他把这件事记在心里。');
    }
    return '你依她的意思在偏厅坐下。说罢话，从原路告辞，仍让她按自己的意思料理府里的往来。'+fx('精力−1');
  };
  pushEv({title:'王府 · 私下求见',por:p,valid,sealedAnnals:true,text:`${princeEstateLabel(k)}的偏厅还温着茶。\n${opening}\n${reply}`,
    choices:[...(willing?[{t:'应她的意思，留在偏厅相会 · 精力−1',cond:()=>E().energy>0,f:()=>settle(true)}]:[]),
      {t:willing?'今日只作寻常问候':'尊重她的意思，告辞',f:()=>settle(false)}]});
};
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
    <header class="detail-head person-detail-head">${porImg(k,112)}<div class="grow"><p>${esc(caption)} · ${k.alive?kidAge(k)+'岁':'已薨'}</p><h2>${esc(princeEstateLabel(k))}</h2><p>${esc(k.reign?`${royalKinship(k)} ${k.name}`:k.name)}${birth?.father?` · 生父 <button class="person-link" onclick="A.princeFamilyMemo(${id},${royalActionArg(birth.father.id)})">${esc(birth.father.name)}</button>`:''} · 生母 ${motherLink}</p></div></header>
    ${pageChapters('prince-estate',[
      ['residence','居处与藩务',detailSection('居处',`<p>${esc(state)}</p>${res}${princeFiefRequestPanel(k)}`)],
      ['history','王府记事',detailStory(k)],
      ['dockets','长史奏报',princeDocketPanel(k)],
      ['succession','世子与袭爵',princeSuccessionPanel(k)],
      ['family','家人与往来',princeAdoptionContactPanel(k)+royalKinContactButtons(k,true)+marriagePanel(k)+princeSpouseVisitPanel(k)+householdPanel(k)+princeCirclePanel(k)]
    ])}`;
}
function princeEstateRecord(k,line){
  if(k.reign){kstory(k,line);const mother=familyHostById(k.mom);if(mother?.alive)story(mother,line);}
  else childSeparationMemory(k,line,k.away?-.25:.35);
  log(line,1);
}
function settlePrinceFief(k,location,register=false){
    k.princeEstate={...k.princeEstate,opened:k.princeEstate?.opened??S.turn,location,...(register?{}:{lastMove:S.turn})};
    if(!register){k.away=true;k.sup=clamp((k.sup||0)-20);}
    const line=register?`宗人府补录${k.name}的藩邸在${location}。`:`${k.name}奉诏离京，赴${location}就藩，由长史料理府务，地方政务仍归有司。`;
    princeEstateRecord(k,line);return line;
}
function princeFiefChoices(k,register=false){
  const valid=()=>princeEstateById(k.id)===k&&princeMoveReady(k)&&(register?k.away&&!princeFief(k):!k.away);
  const chooseFief=location=>()=>{
    if(!valid())return null;
    if(!register&&dynastyFollowupActive()&&k.fiefRequest?.status==='pending')k.fiefRequest.status='superseded';
    return settlePrinceFief(k,location,register);
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
