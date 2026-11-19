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
  if(visit?.gen===S.gen&&(visit.discovery||visit.paternityConfirmed))return '<p class="muted">事已在府中说开，私下往来已止。</p>';
  return `<div class="acts"><button class="btn quiet" onclick="A.princeSpouseVisit(${royalActionArg(k.id)})" ${already?'disabled':''}>私下求见王妃<small>${already?'本月已问过她的意思':'先问她是否愿意见面'}</small></button></div>`;
}
A.princeSpouseVisit=function(id){
  const k=princeEstateById(id);
  if(modalOpen||!princeSpouseVisitReady(k))return;
  const p=k.spouse,gen=S.gen,turn=S.turn;
  const previous=p.princePrivateVisit?.gen===gen?p.princePrivateVisit:null;
  if(previous?.discovery||previous?.paternityConfirmed||previous?.last===turn)return;
  const trust=p.trust??50,nature=marriageNature(p).temperament;
  const parentageActive=PalaceActions.princeSpouseParentage;
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
      if(PalaceActions.princeSpouseDiscovery)visit.noticedAt=turn;
      kstory(k,'【王府闲话】听内侍说偏厅近来曾单独待客，问了来人是谁，仍没人能给个准话。他把这件事记在心里。');
    }
    if(parentageActive)notePrinceSpouseMeeting(k,p,visit);
    const after=parentageActive?'她亲自掩了帘，问过彼此的意思，两人才相携往里间去。待夜色下来，你仍从原路告辞。':
      '你依她的意思在偏厅坐下。说罢话，从原路告辞，仍让她按自己的意思料理府里的往来。';
    return after+fx('精力−1');
  };
  pushEv({title:'王府 · 私下求见',por:p,valid,sealedAnnals:true,text:`${princeEstateLabel(k)}的偏厅还温着茶。\n${opening}\n${reply}`,
    choices:[...(willing?[{t:'应她的意思，留在偏厅相会 · 精力−1',cond:()=>E().energy>0,f:()=>settle(true)}]:[]),
      {t:willing?'今日只作寻常问候':'尊重她的意思，告辞',f:()=>settle(false)}]});
};
const PRINCE_DISCOVERY_REACTIONS={
  好奇:['他问了两次是哪一日，听她说到自己恰在宫里当值，便没有再问下去。','一度想把每一次见面的情形都问清，后来才知道自己最在意的是她为什么一直瞒着。'],
  好胜:['他追问是谁起的头。听清之后，手已经按在桌沿上，还是让她把话说完了。','起先只想问出个是非。听到实话时，他才发觉问赢了也不能让那几日重来。'],
  仁厚:['他先遣走侍立的人，叮嘱谁也不许拿这事去责问偏厅当差的宫人。','嘱咐府里照常待值夜的人，自己回书房坐到灯尽，才承认这件事确实伤了他。'],
  内敛:['他听完许久没作声，只把那盏凉茶往桌里推了推，直到屋里只剩他们才开口。','在人前照常说话，入夜才把白日没说完的那句写下来。'],
  爽直:['他将心里的疑问一口气说了出来，问她若自己没开这个口，她还打算瞒多久。','把心里的话都说在了当面，散后嗓子发紧，仍记得她逐句回答过。'],
  灵动:['他下意识想用一句玩笑把话揭过去，开口时却一点笑意也没有。','从前两人有些话用玩笑就能带过，那天他第一次把玩笑收了回去。'],
  审慎:['他只核对她亲口认下的日子，另将几句未证实的传言划掉。','没有再追查旁人的猜测，只把她认下的几日和自己该如何待她一并想了许久。'],
  自矜:['他把门掩好，才转过身问她，往后府里还有什么事需要由旁人来告诉他。','府里照旧守着礼数。他宁可自己多等几日，也不愿再从旁人口中听到家里的事。']
};
const CONSORT_DISCOVERY_REACTIONS={
  温厚:['她替他添了温茶，见他没碰，便坐下来把话说完。','她想替他做些寻常小事，又怕此时殷勤是在催他原谅。'],
  爽朗:['她本想像往常一样叫他的名字，唤到一半，才觉出屋里静得很。','她把一向爱凑在饭桌上说的话留到了两人独处时。'],
  矜持:['她等门掩好才起身说话，说罢也没有请下人来替自己解释。','她曾想写一份周全的说明，改了几回，最后只留下他当面问过的几句。'],
  好胜:['她听他问完才答，声音虽有些发颤，仍亲口交代了是哪几回。','她头几日仍想把每句话辩到底，后来才想明白，他心里的委屈讲道理也消不去。'],
  敏感:['她听出他语气里的生分，拢紧了袖口，还是把自己记得的事一件件说清。','她起初怕他日后只剩礼数，试着问过一次他想怎样相处，便安心等他答。'],
  沉静:['她把手里的账册阖上，照直说了，随后留他慢慢想。','她将该说的话想了几遍，最后留到对方肯听的时候才说。']
};
function princeSpouseDiscoveryEvent(k){
  const p=k.spouse,visit=p?.princePrivateVisit;
  if(visit?.gen!==S.gen||!visit.noticed||visit.meetings<2||visit.paternityConfirmed&&!visit.discovery)return null;
  const available=()=>k.spouse===p&&p.princePrivateVisit===visit&&visit.gen===S.gen&&princeSpouseVisitReady(k)&&householdCoupleInTown(k,p);
  if(!available())return null;
  const [princeAction,princeMemory]=PRINCE_DISCOVERY_REACTIONS[childDisposition(k)];
  const [consortAction,consortMemory]=CONSORT_DISCOVERY_REACTIONS[marriageNature(p).temperament]||CONSORT_DISCOVERY_REACTIONS.沉静;
  const cast=[k,p],discovery=visit.discovery;
  if(discovery){
    if(discovery.followed||S.turn<discovery.due)return null;
    const closer=discovery.before>=65&&discovery.spoke;
    const princeAfter=closer?'他重新请她同桌用饭，席间说起当日心里最难受的那句话。':
      discovery.before<45?'他同她把府里的事务逐桩分好。见客的安排先互相知会，余下的时日各自过。':
        '他仍照常与她商量府务，只请她给自己再留些时间。';
    const consortAfter=closer?'她听完才答，也问他下回愿不愿意再说一会儿。':
      discovery.before<45?'她应下新定的章程，托他有话还像今天这样亲自来说。':
        '她照他的意思把晚膳另摆，留了一盏廊灯，等他哪天想说话时再来。';
    return {title:'王府 · 风波之后',cast,sealedAnnals:true,
      valid:()=>available()&&visit.discovery===discovery&&!discovery.followed,
      text:`过了一阵，${princeEstateLabel(k)}的门房照旧递着拜帖。只有夫妻两个知道，这一阵屋里的日子是怎么过的。\n${princeAfter}\n${consortAfter}`,
      choices:[{t:'将府里的事交还给他们',f:()=>{
        discovery.followed=true;
        princePersonNote(k,`【王府风波之后】${princeAfter}${princeMemory}`);
        princePersonNote(p,`【王府风波之后】${consortAfter}${consortMemory}`);
        const gain=closer?changeHouseholdAffection(k,2):0;
        return '你没再问起偏厅，只让日常的问候照礼来往。'+(gain?fx(`夫妻感情+${gain}`):'');
      }}]};
  }
  if(S.turn<=(visit.noticedAt??visit.last??S.turn))return null;
  const before=p.trust??50,close=before>=65,distant=before<45;
  const address=S.children.includes(k)?'父皇':'陛下';
  const princeWords=close?'从前有什么事，我总是先听你亲口说。如今我连该信哪一句，都要想一想。':
    distant?'我们原先就少问彼此的心事。往后府里怎样过日子，也该把话讲明白了。':
      '我想听实话。往后再有这样的事，我当从你口中先听见。';
  const consortWords=close?'那时只想着把自己的心事说出去，回房见你还替我留着灯，我就该开口的。':
    distant?'我们同桌时常只说府务，有些话我搁了很久。瞒下这一桩，是我自己做的决定。':
      '我原想着见过之后，日子还可以照旧过。你问到我这里，我才知道你已经想了多久。';
  const settle=spoke=>()=>{
    visit.discovery={before,spoke,due:S.turn+2};
    const loss=-changeHouseholdAffection(k,-((close?12:distant?5:9)+(spoke?0:3)));
    const princeEnd=spoke?'他听见你亲口认下往来、答应止住，仍请留几日，让他自己想想。':'他谢过准他缓几日，回身请人把自己的晚膳摆在书房。';
    const consortEnd=spoke?'她回房让人撤了偏厅的茶席，想等王爷肯听时，再同他说说那几日是怎么过的。':'她让人撤去偏厅的茶席，也给他留出了几日独处的工夫。';
    princePersonNote(k,`【王府私约说开】从王妃口中问明了她与${address}私下相见的事。${princeAction}他说：“${princeWords}”${princeEnd}`);
    princePersonNote(p,`【王府私约说开】她亲口将偏厅里同陛下相见的事告诉了${k.name}。${consortAction}她说：“${consortWords}”${consortEnd}`);
    return `${princeEnd}\n${consortEnd}`+(loss?fx(`夫妻感情−${loss}`):'');
  };
  return {title:'王府 · 私约说开',cast,sealedAnnals:true,valid:()=>available()&&!visit.discovery,
    text:`${k.name}想起偏厅的传言，待旁人退下，亲自问了王妃。\n${consortAction}“是陛下。那几次我都应了，来往是我亲口答允的。”\n${princeAction}“${princeWords}”\n她答道：“${consortWords}”\n后来他私下求见你：“${address}，府里的事我已经问明白了。以后这道门该怎么开，我想听您一句准话。”`,
    choices:[{t:'亲口认下往来，答应止住私约',f:settle(true)},{t:'止住私约，先留几日让他们缓一缓',f:settle(false)}]};
}
function pendingPrinceSpouseDiscoveries(){
  if(!PalaceActions.princeSpouseDiscovery||mourningActive())return [];
  return royalHouseholds().map(princeSpouseDiscoveryEvent).filter(Boolean);
}
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
      ['family','家人与往来',princeAdoptionContactPanel(k)+royalKinContactButtons(k,true)+marriagePanel(k)+princeSpouseVisitPanel(k)+princeSpouseParentagePanel(k)+householdPanel(k)+princeCirclePanel(k)]
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
    if(!register)packChildKeepsake(k);
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
