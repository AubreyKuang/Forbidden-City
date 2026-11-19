/* ============ 六部与科举 ============ */
// 六部各设尚书，由在任且有才干的官员出任；尚书的才干决定本部差事的成败。
// 三年一科：会试后殿试钦点三甲，新科进士授翰林院官职，成为外戚之外有名有姓的朝臣。
// 旧存档里未完的事件按原样重放：事务日志版本 9 之前的步骤不触发这里的抽签或写入。
const COURT_OFFICES_JOURNAL=9;
function courtOfficesActive(){
  if(!S||S.over)return false;
  return journalContentVersion()>=COURT_OFFICES_JOURNAL;
}
function ministryState(){
  const st=S.ministries ||= {};
  st.heads ||= {};st.used ||= {};st.exams ||= [];
  return st;
}
const scholarList=()=>S.scholars||[];
const scholarById=id=>scholarList().find(p=>p.id===id);
function scholarCourtBloc(p){
  if(outerHouseholdUpdates()&&p.outerChildId&&p.bloc)return p.bloc;
  return p.outerChildId&&p.bloc==='army'?'army':'civil';
}

/* —— 新科进士：外戚之外的朝臣 —— */
const SCHOLAR_ORIGINS=['寒门','书香门第','耕读之家','盐商之后','军户子弟'];
const SCHOLAR_ESSAYS=['论漕运积弊，主张分段官运','论边储，请以屯田补军饷','论吏治，请严考成、去冗员','论水利，愿亲赴河工','论民本，引孟子“民为贵”','论盐法，请革除私引'];
function makeScholar(rankBoost=0,reserved=[]){
  const sur=pick(courtNamesActive()?COURT_SURNAMES:SUR),given=courtNamesActive()?courtGivenName(sur,ri(0,2e9),{used:new Set([...courtUsedNames(),...reserved.map(p=>p.name)]),reservedGiven:new Set(reserved.map(p=>givenOf(p)))}):pick([...BROTHER_NAMES,...FATHER_NAMES]),seed=ri(1,2e9);
  const civilFaces=[272,274,279,280,281];
  const person={id:`scholar-${S.gen}-${S.turn}-${S.nid++}`,name:sur+given,sur,age:ri(22,36),seed,origin:pick(SCHOLAR_ORIGINS),essay:pick(SCHOLAR_ESSAYS),
    ability:clamp(ri(48,82)+rankBoost,30,95),trust:45,merit:10,temperament:pick(OFFICIAL_TEMPERAMENTS),career:'official',alive:true,story:[],
    official:2,artPortrait:civilFaces[seed%civilFaces.length],scholar:true};
  if(expandedOfficialPortraitsActive()){delete person.artPortrait;assignCourtOfficialPortrait(person,'civil',{peers:reserved});}
  return person;
}
function scholarRecord(p,text,big=true){story(p,text);log(`${p.name}：${text}`,big?1:0);}
// 尚书人选与表格共用的统一条目：外戚出身的用 officialEntry 键，进士出身的用 scholar: 前缀。
function courtPerson(key){
  if(!key)return null;
  if(String(key).startsWith('scholar:')){const p=scholarById(String(key).slice(8));return p?{p,key,scholar:true,bloc:scholarCourtBloc(p)}:null;}
  const e=officialEntry(key);return e?{p:e.p,key,e,bloc:e.h.bloc}:null;
}
function courtPersonRecord(person,text,options){
  if(person.scholar)scholarRecord(person.p,text);else officialRecord(person.e.c,person.e.role,text,options);
}

/* —— 六部 —— */
const MINISTRIES={
  personnel:{name:'吏部',duty:'铨选考课',army:false,action:'京察考课',cost:0,brief:'考核在朝官员，卓异者加信任，不称职者降信任并记入履历。'},
  revenue:{name:'户部',duty:'钱粮户籍',army:false,action:'清查亏空',cost:0,brief:'追缴各省历年亏空。办得好可入库数十万两；追比过严则伤民心。'},
  rites:{name:'礼部',duty:'科举典礼',army:false,action:'开设恩科',cost:30,brief:'下月加开一科殿试，钦点三甲。正科每三年三月举行，两科至少间隔两年。'},
  war:{name:'兵部',duty:'武选边防',army:true,action:'整饬边备',cost:40,brief:'核点兵员、修补器械，提升武备。'},
  justice:{name:'刑部',duty:'刑名复核',army:false,action:'秋审复核',cost:0,brief:'复核在押案卷；若后宫有被诬入冷宫者，可借此平反。'},
  works:{name:'工部',duty:'营缮河工',army:false,action:'督修河工',cost:120,brief:'由部里直接督修黄河险段，修成可抵一次决口的赈济开支。'}
};
const MINISTRY_GAP=12;
const MINISTRY_REVIEWS={
  personnel:'京察复勘',revenue:'追库与秋税',rites:'恩科录用',war:'边镇补报',justice:'秋审余卷',works:'河工验收'
};
const MINISTRY_FOLLOWUPS={
  tax:['秋税张榜','张榜那天，一名老农把去年的税票也带来了。里正拿两张票对给他看，把今年蠲掉的数当面划去。老农将新票折好，问那一栏来年还作不作数。','州县初拟的减免榜撤下了。里正逐户重核时，有人拿着原先抄下的数来问，县里按最终税额重开了票。'],
  accounts:['对得上的两本账','县库交来的不是新誊的清册，是两本纸边发黑的旧账。一笔往年欠款在收票和库册上都找到了，书吏当场销号。','库册多出一笔银，收票上却查不出是谁交的。承办官把两页一起封起，等原经手人来认笔迹。'],
  schools:['一册旧课簿','学官把一本旧课簿送进京。最末一页新添了几个名字，都是农忙后才回来读书的孩子。他请朝廷留着旧簿，明年还能一页页对看。','点名册上学生并不少，问到近来读过哪一篇，学官却答不上来。承办官留下了学生原卷，请地方补送这几月实授的课目。'],
  escort:['粮车到关','边仓的收票上多了一行小字，车队行经水洼时换了两根车轴。守仓吏赶在闭关前收齐粮袋，在票尾写了实到时辰。','粮车过渡误了时辰。边仓把先到、后到的车分列两栏，关门前实收多少，回奏便写多少。'],
  border:['烽下夜簿','戍卒夜里换防，巡边官在烽台跟着点了一回名。原册把轮休的人也列作当值，他请守军把两栏分开，重新签押。','巡至一处烽台，簿上有名的人还在前一寨等换防。承办官在缺员处画了空格，将未交接的日子留在卷中。'],
  water:['第一畦引水','开闸那天，上游先放了一夜的水。守在末渠的人挽着裤脚站了半晌，直到第一畦也见了水，才在验单上画押。','水到了上游，末渠却只湿了一截。验单留着最后一栏空白，承办官请下游人家亲自来验下一次放水。'],
  dikes:['堤脚留下的水线','验堤时，老河工领人看去年高水在墙脚留下的印子。新夯的土已过那道印，工部把此处写在下次巡堤的头一站。','河工帐上写着已夯到旧水印，去看时仍差一截。承办官在堤脚立了木桩，料银仍按未完一段单列。'],
  case:['秋审归卷','刑部收到密查的复卷，先核纸页的封号，再将人证与物证分袋登记。值房只抄了查证日期，封内姓名仍依原案处置。','旧卷退回时，值房把已经核过的日子划明。尚缺哪一页、哪一份证词，都另系一条纸签，留待有新线索时再翻。']
};
function beginMinistryFollowup(docket,type,details={}){
  if(journalContentVersion()<68||!docket||docket.followup)return false;
  docket.followup={type,...details};
  if(journalContentVersion()>=147&&type!=='tax'){
    const label=type==='case'?ministryCaseReferralLabel(palaceCases().find(x=>x.id===details.caseId)):ministryTaskReferralLabel(type);
    settleMinistryDocket(docket,label);
  }
  return true;
}
function finishMinistryFollowup(id,outcome,result){
  if(journalContentVersion()<68||!id)return;
  const followup=ministryDockets().find(d=>d.id===id)?.followup;
  if(followup&&!followup.date)Object.assign(followup,{outcome,result,date:dateStr()});
}
function settleMinistryTax(receipt){
  if(journalContentVersion()<68)return;
  const docket=ministryDockets().find(d=>d.followup?.type==='tax'&&d.followup.year===receipt.year);
  finishMinistryFollowup(docket?.id,receipt.policy==='light'?'success':'setback',
    `户部实收秋税 ${receipt.amount} 万两，按「${TAX_PLANS[receipt.policy].name}」结算。`);
}
function settleInterruptedMinistryFollowups(){
  if(journalContentVersion()<68)return;
  for(const docket of ministryDockets()){
    const f=docket.followup;
    if(!f||f.date||!Number.isFinite(f.due)||S.turn<f.due)continue;
    if(f.type==='case'){
      const item=palaceCases().find(x=>x.id===f.caseId);
      if(item?.status==='investigating'&&item.ministryDocket===docket.id)continue;
      if(item?.status==='solved'){
        finishMinistryFollowup(docket.id,'success',`「${item.title}」另循现有案卷查得证据。处置详情仍依原案。`);continue;
      }
    }else if(officialEntry(f.person)?.p.commission?.ministryDocket===docket.id)continue;
    finishMinistryFollowup(docket.id,'interrupted','此项差事已中止，未收到原定回奏。');
  }
}
function ministryAftermathReady(docket){return !S.over&&docket.followup?.date&&!docket.followup.read;}
function ministryFollowupStatus(f){
  if(f.read)return `${f.read} · ${f.decision}`;
  if(f.date)return `${f.date} · 纪事待阅`;
  if(f.type==='tax')return '待本年十月秋税结算';
  return S.turn<f.due?`预计 ${f.due-S.turn} 个月后回报`:'等候实报';
}
A.ministryAftermath=function(id){
  const docket=ministryDockets().find(d=>d.id===id);
  if(modalOpen||!docket||!ministryAftermathReady(docket))return;
  const f=docket.followup,[title,good,bad]=MINISTRY_FOLLOWUPS[f.type];
  const person=f.person&&officialEntry(f.person);
  const witness=person&&person.p.id===f.personId?person.p:null;
  const head=courtPerson(docket.headKey),minister=head?.p.id===docket.headId?head.p:null;
  const guard=jinyiwei()?.commander;
  const reader=f.type==='case'&&guard?.id===f.commanderId?guard:witness||minister;
  const detail=f.outcome==='death'?'讣报与原折一并送回。承办人途中身亡，余下的差事须另作安排。':
    f.outcome==='interrupted'?'原折后面只夹着停办签。交接未能完成，余下的事仍须另议。':f.outcome==='success'?good:bad;
  const valid=()=>ministryAftermathReady(docket);
  const finish=copy=>{
    if(!valid())return null;
    f.read=dateStr();f.decision=copy?'另抄一份留作复核':'随原折归档';
    const line=`【${MINISTRIES[docket.ministry].name}纪事 · ${title}】${f.result}${detail}${f.decision}。`;
    log(line,1);
    if(copy&&reader)story(reader,line);
    return copy?'已将纪事另录一份，附在承办履历中。':'原折与后续纪事一并归档。';
  };
  pushEv({title:`${MINISTRIES[docket.ministry].name}纪事 · ${title}`,por:reader||undefined,valid,
    text:`${f.date}${f.name?' · '+f.name:''}\n${f.result}\n${detail}`,choices:[
      {t:'随原折归档',f:()=>finish(false)},
      ...(reader?[{t:'另录一份，附在承办履历中',f:()=>finish(true)}]:[]),
      {t:'留待下回再阅'}]});
};
function ministryDockets(){
  return journalContentVersion()>=65?(S?.ministries?.dockets||[]).filter(d=>d.gen===S.gen):[];
}
function ministryDocketReady(d){return !S.over&&!d.closed&&Number.isFinite(d.due)&&S.turn>=d.due;}
function openMinistryDocket(id,head,success,text){
  const dockets=ministryState().dockets||=[];
  dockets.push({id:`review-${S.gen}-${S.turn}-${id}`,ministry:id,gen:S.gen,turn:S.turn,date:dateStr(),
    due:id==='rites'?null:S.turn+2,success,headKey:head.key,headId:head.p.id,headName:head.p.name,summary:text});
  if(dockets.length>30){const index=dockets.findIndex(d=>d.gen!==S.gen||d.closed&&(!d.followup||d.followup.read));if(index>=0)dockets.splice(index,1);}
  return id==='rites'?'放榜后，礼部会把恩科录用簿送来。':'两个月后可在六部阅看复议。';
}
function settleMinistryDocket(docket,decision){
  docket.closed=dateStr();docket.decision=decision;
  const title=MINISTRY_REVIEWS[docket.ministry],line=`【六部纪事 · ${title}】${decision}。`;
  const person=courtPerson(docket.headKey);
  if(person?.p.id===docket.headId&&officialServing(person.p))story(person.p,line);
  const successor=ministryDocketSuccessor(docket);
  if(successor){
    docket.reviewedBy=successor.p.name;
    story(successor.p,`${line}接手${docket.headName}任内旧折，${ministryHandoverLine(successor.p)}`);
  }
  log(line+(successor?`现任尚书${successor.p.name}接续署理，原折保留${docket.headName}具名。`:''),1);
}
function ministryDocketSuccessor(docket){
  if(journalContentVersion()<147)return null;
  const head=ministryHead(docket.ministry);
  return head&&head.p.id!==docket.headId&&(journalContentVersion()>=148||officialServing(head.p))?head:null;
}
function ministryHandoverLine(p){
  return ({
    持正:'将原办与续办分别署名，日后可各按原卷查考。',
    谨慎:'逐页核过原批与附件，把还缺凭据的地方标了出来。',
    进取:'另列一纸限期，把本任要接着办的事逐件记清。',
    圆融:'先问原来的经手人，把口头交代逐件添在卷后。'
  })[p.temperament]||'核对原折与续办事项，另署接手日期。';
}
const ministryTaskReferralLabel=id=>`择官办理${OFFICIAL_TASKS[id].title}`;
const ministryCaseReferralLabel=item=>`调卷复核「${item.title}」`;
function ministryDocketEvent(docket){
  const id=docket.ministry,title=MINISTRY_REVIEWS[id],valid=()=>ministryDockets().includes(docket)&&ministryDocketReady(docket);
  const successor=ministryDocketSuccessor(docket);
  const choices=[];
  const redirect=(label,view,personId)=>choices.push({t:label,f:()=>{
    if(!valid())return null;
    settleMinistryDocket(docket,label);
    if(personId!=null)A.go(view,personId);else A.go(view);
    return '复议已经记入六部案簿。';
  }});
  const forward=(label,factory,referral=false)=>choices.push({t:label,chronicle:!referral||journalContentVersion()<148,f:()=>{
    if(!valid())return null;
    const event=factory();if(!event)return '相关回奏或案卷已有变化，仍可把本折归档。';
    if(referral&&journalContentVersion()>=147){
      const check=event.valid;
      event.valid=()=>valid()&&(!check||check());
      if(journalContentVersion()>=148)event.choices=event.choices.map(choice=>choice.f?choice:{...choice,chronicle:false});
    }else settleMinistryDocket(docket,label);
    pushNow(event);return null;
  }});
  const task=id=>forward(ministryTaskReferralLabel(id),()=>governmentTaskEvent(id,docket),true);
  let follow='';
  if(id==='personnel'){
    const pending=careerPeople().find(person=>careerEligible(person.p)&&person.p.report?.outcome==='setback');
    follow=pending?`吏部另附${pending.p.name}仍待御批的「${pending.p.report.title}」。京察评语可与任上实绩对看，原回奏仍由陛下亲批。`:'本次京察评语已入各人履历。日后调任时，可与官员任内实绩一并核对。';
    if(pending)forward('对照地方回奏，请陛下亲批',()=>pending.p.report?careerReportEvent(pending):null);
    else redirect('翻阅官员表与履历','officials');
  }
  if(id==='revenue'){
    const receipt=treasuryReceipt('tax');
    follow=receipt?`本年秋税已经入库 ${receipt.amount} 万两，请与追回的亏空分别记账。`:`本年秋税仍按「${TAX_PLANS[governance().tax].name}」预备，估收 ${taxEstimate()} 万两。清查追亏与常年征税分开处理。`;
    if(!receipt&&governance().tax!=='light')choices.push({t:'按现行制度减免三成秋税 · 精力−1',cond:()=>valid()&&!treasuryReceipt('tax')&&governance().tax!=='light'&&E().energy>0,why:'秋税已结算、已经减免或精力不足',f:()=>{
      if(!valid()||!applyTaxPlan('light'))return null;
      beginMinistryFollowup(docket,'tax',{year:S.year});
      settleMinistryDocket(docket,'按章改定减免三成秋税');return '户部已改定本年秋税办法，入库时按现行税制结算。';
    }});
    task('accounts');
  }
  if(id==='rites'){
    const winner=scholarById(docket.winner);
    follow=winner?`恩科已放榜，${winner.name}中状元。他在殿试的策论写的是「${winner.essay}」。礼部请另择实务查验，任命仍依原有铨选办法。`:'恩科录用簿已归礼部，可在科举日程查到此科记录。';
    if(winner)redirect('阅看状元的档案与策论','scholar',winner.id);
    task('schools');
  }
  if(id==='war'){
    follow=docket.success?'兵员与器械已对过簿册。兵部请接着护送边粮，查粮道能否按期通行。':'上次器械已补，尚有数镇的兵册不齐。兵部请择武职实地巡边，回奏时再核对缺额。';
    task(docket.success?'escort':'border');
  }
  if(id==='justice'){
    const cold=palaceCases().find(item=>item.kind==='harem'&&caseReady(item));
    follow=cold?`秋审已过，「${cold.title}」一卷仍有未查清的线索。刑部请调原卷复核，照旧凭证据行事。`:'本批秋审回奏已复点。卷外传言另作记录，现有未结案仍可在案簿查看。';
    if(cold&&jinyiweiCommanderReady())forward(ministryCaseReferralLabel(cold),()=>jinyiweiInvestigationEvent(cold,docket),true);
    else redirect('查看锦衣卫旧案与线索','jinyiwei');
  }
  if(id==='works'){
    const ready=floodDikeReady();
    follow=ready?'险段现有一笔修堤减免可用。工部另列了疏通农渠的差事，可视农时安排。':docket.success?'此次督修曾经验收。如今河工簿上已无待用的赈济减免，可另择官岁修。':'上次督修未验收，工部请由承办官重核险段和料银，再呈工簿。';
    task(ready?'water':'dikes');
  }
  const handover=successor?`\n现由${successor.p.name}接续署理。已将原折和附件留存，待御批后续办署名。`:'';
  return {title:`${MINISTRIES[id].name}回奏 · ${title}`,valid,text:`${docket.date}由${docket.headName}主办「${MINISTRIES[id].action}」。${handover}\n原折：${docket.summary}\n${follow}`,choices:[
    ...choices,{t:'看过回奏，照实归档',f:()=>{if(!valid())return null;settleMinistryDocket(docket,'回奏已阅，照实归档');return '原折和本次复议均已存入六部案簿。';}},
    {t:'留中，下次再议'}
  ]};
}
A.ministryDocket=function(id){
  const docket=ministryDockets().find(d=>d.id===id);
  if(!modalOpen&&docket&&ministryDocketReady(docket))pushEv(ministryDocketEvent(docket));
};
function ministryDocketSection(){
  if(journalContentVersion()<65)return '';
  const all=ministryDockets().slice().reverse(),active=d=>!d.closed||d.followup&&!d.followup.read;
  const rows=[...all.filter(active),...all.filter(d=>!active(d)).slice(0,6)];
  return detailSection('六部回奏与纪事',rows.length?`<ul class="story">${rows.map(d=>
    `<li><time>${esc(d.date)}</time><b>${esc(MINISTRIES[d.ministry].name+' · '+MINISTRY_REVIEWS[d.ministry])}</b> · ${esc(d.headName)}${d.reviewedBy?' · 接办 '+esc(d.reviewedBy):''}
      <p>${esc(d.closed?`${d.closed} · ${d.decision}`:d.due==null?'待恩科放榜':ministryDocketReady(d)?'回奏已至':`${Math.max(0,d.due-S.turn)}个月后回奏`)}</p>
      ${d.followup?`<p>${esc(MINISTRY_FOLLOWUPS[d.followup.type][0])} · ${esc(ministryFollowupStatus(d.followup))}</p>`:''}
      ${ministryAftermathReady(d)?`<button class="btn sm jade" onclick="A.ministryAftermath('${d.id}')">阅看后续纪事</button>`:''}
      ${ministryDocketReady(d)?`<button class="btn sm jade" onclick="A.ministryDocket('${d.id}')">阅看${MINISTRIES[d.ministry].name}回奏</button>`:''}</li>`).join('')}</ul>`:'<p class="hint">六部奉准办差后，后续回奏会呈送到这里。</p>');
}
function initializeMinistryRoster(){
  if(journalContentVersion()<43||S.ministries?.foundingRoster)return;
  const st=ministryState();st.foundingRoster=true;S.scholars ||= [];
  for(const [id,m] of Object.entries(MINISTRIES)){
    const incumbent=ministryHead(id);
    if(incumbent){st.heads[id]=incumbent.key;continue;}
    const p=makeScholar(0,scholarList());p.registrySource='founding';p.origin=m.army?'熟习边务的先朝旧臣':'先朝旧臣';p.age=ri(38,62);p.ability=ri(60,88);p.trust=ri(45,75);p.merit=ri(35,65);
    p.office=p.post=m.name+'尚书';p.appointedTurn=S.turn-ri(24,120);p.ageTrackedAt=S.turn;p.ministryExperience=id;p.away=false;
    p.essay=`历掌${m.duty}，新帝登基后继续掌${m.name}事务`;S.scholars.push(p);st.heads[id]='scholar:'+p.id;
    story(p,`先朝历任部务，新帝登基时仍任${p.office}，掌${m.duty}。`);
  }
}
const EXAM_INTERVALS=[1,3,5,10];
const regularExamInterval=()=>EXAM_INTERVALS.includes(S.ministries?.examInterval)?S.ministries.examInterval:3;
const examIntervalLabel=years=>years===1?'每年一科':`每${cnNum(years)}年一科`;
function ministryHead(id){
  const title=`${MINISTRIES[id].name}尚书`;
  const holds=x=>x&&x.p.office===title&&(journalContentVersion()>=147?
    officialAlive(x.p)&&!x.p.retired&&!x.p.exiled&&!x.p.dismissed&&!['student','commoner'].includes(x.p.career):officialServing(x.p));
  // 调任他职即视为卸任本部；未经任命时，家世本就官居此职的父兄即是现任尚书。
  const person=courtPerson(S.ministries?.heads?.[id]);if(holds(person))return person;
  const kin=officialEntries().map(e=>({p:e.p,key:e.key,e,bloc:e.h.bloc})).filter(holds),scholars=scholarList().map(p=>({p,key:'scholar:'+p.id,scholar:true,bloc:p.outerChildId&&p.bloc==='army'?'army':'civil'})).filter(holds);
  return [...kin,...scholars].sort((a,b)=>b.p.trust-a.p.trust)[0]||null;
}
function ministryHeldBy(p){return Object.keys(MINISTRIES).find(id=>ministryHead(id)?.p===p)||null;}
function ministryCandidates(id){
  const m=MINISTRIES[id];if(!m)return [];
  const kin=officialEntries().filter(e=>officialServing(e.p)&&e.p.career!=='student'&&e.p.ability>=55&&officialMilitary(e.p,e.h)===m.army).map(e=>({p:e.p,key:e.key,e,bloc:e.h.bloc}));
  // 新科进士须在翰林院历练两年以上，方可出掌一部。
  const scholars=scholarList().filter(p=>officialServing(p)&&p.ability>=55&&S.turn-(p.appointedTurn??S.turn)>=24&&(p.ministryExperience==='war')===m.army).map(p=>({p,key:'scholar:'+p.id,scholar:true,bloc:p.outerChildId&&p.bloc==='army'?'army':'civil'}));
  return [...kin,...scholars].filter(x=>!ministryHeldBy(x.p));
}
function ministryOdds(id){const head=ministryHead(id);return head?.4+head.p.ability/200:0;}
function ministryReady(id){
  const m=MINISTRIES[id];if(!m||!S||S.over||!officialServing(ministryHead(id)?.p))return false;
  if(S.turn-(S.ministries?.used?.[id]??-99)<MINISTRY_GAP)return false;
  if(E().energy<1||E().treasury<m.cost)return false;
  if(id==='rites')return !examPending()&&S.turn-lastExamTurn()>=24;
  if(id==='works')return S.flags.floodDikeGen!==S.gen;
  return true;
}
function lastExamTurn(){return S.ministries?.exams?.at(-1)?.turn??-99;}
function examPending(){return Number.isFinite(S.ministries?.examDue)&&S.ministries.examDue>=S.turn;}
function regularExamYear(year,interval=regularExamInterval()){
  return year>1&&(year-1)%interval===0;
}
function examHeldThisReign(year){return (S.ministries?.exams||[]).some(x=>x.gen===S.gen&&x.year===year);}
function nextRegularExamDate(interval=regularExamInterval()){
  const firstYear=Math.max(2,S.year+(S.month>=3?1:0));
  let year=1+Math.ceil((firstYear-1)/interval)*interval;
  const due=examPending()?S.ministries.examDue:null;
  const enkeYear=due===null?null:S.year+Math.floor((S.month-1+due-S.turn)/12);
  const enkeMonth=due===null?null:(S.month-1+due-S.turn)%12+1;
  while(examHeldThisReign(year)||(year===enkeYear&&enkeMonth<=3))year+=interval;
  return dateStr({...S,year,month:3});
}
function nextExamLabel(){
  const regular=`下一次正科：${nextRegularExamDate()}`;
  return examPending()?`恩科定于${S.ministries.examDue===S.turn?'本月末':'下月末'}。${regular}`:regular;
}
A.examSchedule=function(){
  if(journalContentVersion()<33||!S||S.over||modalOpen)return;
  const gen=S.gen,turn=S.turn;
  pushEv({title:'礼部 · 科举日程',text:`现行正科${examIntervalLabel(regularExamInterval())}。${nextExamLabel()}。\n正科按本朝年次排定，逢期在三月举行殿试。恩科仍可单独奏开。`,
    valid:()=>!S.over&&S.gen===gen&&S.turn===turn,choices:[
      ...EXAM_INTERVALS.map(years=>({t:examIntervalLabel(years),
        cond:()=>years!==regularExamInterval(),why:'现行周期',preview:`下次正科 ${nextRegularExamDate(years)}`,
        f:()=>{
          if(S.gen!==gen||S.turn!==turn||S.over||years===regularExamInterval())return null;
          ministryState().examInterval=years;
          const notice=`礼部奉旨改定正科为${examIntervalLabel(years)}。${nextExamLabel()}。`;
          log(notice,1);return notice;
        }})),{t:'沿用现行周期'}]});
};
function ministryResult(id,head,success){
  const p=head.p,name=p.name;
  if(id==='personnel'){
    const people=[...officialEntries().filter(e=>officialServing(e.p)&&e.p.career!=='student').map(e=>({p:e.p,e})),...scholarList().filter(officialServing).map(p=>({p,scholar:true}))];
    const grades={卓异:[],称职:[],不称职:[]};
    for(const x of people){
      const lapse=typeof kinCourtLapse==='function'?kinCourtLapse(x.p):null,score=(x.p.merit??30)+(x.p.ability??50)/3-(lapse?.grounded?15:0)+(success?0:ri(-8,8));
      const grade=score>=60?'卓异':score>=35?'称职':'不称职';grades[grade].push(x.p);
      if(grade==='卓异')x.p.trust=clamp(x.p.trust+4);if(grade==='不称职')x.p.trust=clamp(x.p.trust-5);
      story(x.p,`京察考课，评为「${grade}」。`);
    }
    log(`吏部${name}主持京察：卓异${grades.卓异.length}人，称职${grades.称职.length}人，不称职${grades.不称职.length}人。`,1);
    return `京察已毕。卓异：${grades.卓异.map(p=>p.name).join('、')||'无'}；不称职：${grades.不称职.map(p=>p.name).join('、')||'无'}。${success?'':'\n考课时有同僚说情，评语未尽公允。'}${fx(chg({prestige:success?2:0}))}`;
  }
  if(id==='revenue'){
    const amount=success?40+Math.round(p.ability/2):15;
    courtPersonRecord(head,success?`清查各省亏空，追缴入库${amount}万两。`:`清查亏空时追比过严，只追回${amount}万两，地方怨声渐起。`);
    return `${success?'各省亏空清出大半':'追比过急，地方叫苦'}。${fx(chg({treasury:amount,people:success?0:-2}))}`;
  }
  if(id==='rites'){
    S.ministries.examDue=S.turn+1;
    courtPersonRecord(head,'奏准加开恩科，下月举行殿试。');
    return `礼部已张榜，下月末殿试。${fx(chg({treasury:-MINISTRIES.rites.cost,people:1}))}`;
  }
  if(id==='war'){
    E().wu=clamp(E().wu+(success?3:1));
    courtPersonRecord(head,success?'整饬边备，核实兵员，补齐器械。':'整饬边备，因各镇推诿，只补了器械。');
    return `${success?'边镇军备焕然一新':'只修补了器械，兵员缺额未清'}。武略 +${success?3:1}。${fx(chg({treasury:-MINISTRIES.war.cost,prestige:success?1:0}))}`;
  }
  if(id==='justice'){
    const w=S.flags.wronged,v=w&&byId(w.v),a=w&&byId(w.a);
    if(v?.alive&&v.cold&&success){
      A.uncold(v.id);S.flags.wronged=null;story(v,`刑部${name}复核巫蛊旧案，查明她是被人栽赃，奉旨出冷宫。`);
      courtPersonRecord(head,`复核巫蛊旧案，为${fullName(v)}平反。`);
      if(a?.alive&&!a.gone&&!a.cold){a.known=true;pushNow(punishEv(a,v,'栽赃巫蛊'));}
      return `${fullName(v)}的冤案得以平反。${fx(chg({people:2,prestige:2}),cchg(v,{mood:20,aff:10}))}`;
    }
    courtPersonRecord(head,success?'主持秋审，复核在押案卷，开释错押者数人。':'主持秋审，案卷繁多，只复核了一半。');
    return `${success?'秋审复核已毕，数名错押者获释':'秋审只核完一半'}。${fx(chg({people:success?3:1}))}`;
  }
  if(id==='works'){
    if(success)S.flags.floodDikeGen=S.gen;
    courtPersonRecord(head,success?'督修黄河险段完工，工料验讫。':'督修黄河险段，工料账目不清，尚未验收。');
    return `${success?'险段已修固，下次决口可少拨一笔修复银':'工料账目不清，堤工尚未验收'}。${fx(chg({treasury:-MINISTRIES.works.cost}))}`;
  }
  return '';
}
A.ministryAct=function(id){
  if(modalOpen||!ministryReady(id))return;
  const m=MINISTRIES[id],head=ministryHead(id),odds=Math.round(ministryOdds(id)*100);
  const brief=id==='rites'&&journalContentVersion()>=33?`下月加开一科殿试，钦点三甲。奏开恩科须距上一科至少两年。现行正科${examIntervalLabel(regularExamInterval())}。`:m.brief;
  pushEv({title:`${m.name} · ${m.action}`,por:head.p,valid:()=>ministryHead(id)?.p===head.p,
    text:`${brief}\n主事：${m.name}尚书${head.p.name}（才干${rd(head.p.ability)}），把握约${odds}%。`,choices:[
      {t:`准行 · 精力−1${m.cost?' · 国库−'+m.cost:''}`,cond:()=>ministryReady(id),why:'精力或国库不足，或本部年内已办过',f:()=>{
        if(!ministryReady(id)||!useE())return null;
        ministryState().used[id]=S.turn;const success=chance(ministryOdds(id));
        head.p.merit=clamp(head.p.merit+(success?6:-2));
        let text=ministryResult(id,head,success);
        if(journalContentVersion()>=65)text+='\n'+openMinistryDocket(id,head,success,text);
        save('auto');return {text,por:head.p};
      }},{t:'暂缓'}]});
};
A.ministryAppoint=function(id){
  if(modalOpen||S.over||!MINISTRIES[id])return;
  const m=MINISTRIES[id],current=ministryHead(id);
  const canReplace=()=>journalContentVersion()<147||ministryHead(id)?.p===current?.p&&(!current||officialServing(current.p));
  if(!canReplace())return;
  const list=ministryCandidates(id);
  pushEv({title:`${m.name}尚书人选`,text:`${m.name}掌${m.duty}。${current?`现任尚书${current.p.name}。`:'尚书一职空缺。'}\n候选须在任、才干55以上，且不兼掌他部；新科进士须在翰林院历练两年。${list.length?'':'\n眼下没有合格人选。'}`,
    choices:[...list.map(x=>({t:`${x.p.name} · ${x.p.office||x.p.post} · 才干${rd(x.p.ability)}${x.scholar?(x.p.registrySource==='founding'?' · 先朝旧臣':x.p.entryRoute?' · '+x.p.entryRoute+'出身':' · 进士出身'):' · '+blocName(x.bloc)}`,person:x.p,
      cond:()=>canReplace()&&E().energy>=1&&officialServing(x.p)&&!ministryHeldBy(x.p),why:'精力不足或已不在任',f:()=>{
        if(!canReplace()||!useE())return null;
        const st=ministryState(),old=ministryHead(id);st.heads[id]=x.key;
        if(old&&old.p!==x.p){if(careersActive())careerSetOffice(old,'内阁学士','卸任尚书，改授新职');else{old.p.office='内阁学士';old.p.post=old.p.office;}courtPersonRecord(old,`卸任${m.name}尚书，改任内阁学士。`);}
        if(careersActive())careerSetOffice(x,`${m.name}尚书`,'奉旨出掌六部');else{x.p.office=`${m.name}尚书`;x.p.post=x.p.office;}x.p.trust=clamp(x.p.trust+3);
        courtPersonRecord(x,`奉旨出任${m.name}尚书。`);
        if(!x.scholar){policyNudge('kin',3);policyNudge('civil',-2);officialFamilyReaction(x.e,'transfer',`出任${m.name}尚书`);}
        else policyNudge('civil',2);
        save('auto');return `${x.p.name}出任${m.name}尚书。`;
      }})),{t:'暂不任命'}]});
};

/* —— 正科三月殿试；礼部可奏开恩科 —— */
function examDueNow(){
  if(!courtOfficesActive())return false;
  const st=S.ministries;
  if(st?.examDue===S.turn)return true;
  const interval=journalContentVersion()>=33?regularExamInterval():3;
  return S.month===3&&regularExamYear(S.year,interval)&&!examHeldThisReign(S.year);
}
function examEvent(){
  const st=ministryState(),head=ministryHead('rites'),boost=head?Math.round((head.p.ability-50)/5):0;
  const candidates=[];for(let i=0;i<3;i++)candidates.push(makeScholar(boost,candidates));
  // 外家子弟中已有举人功名者一同应考，能否得中看学业，不因宫中亲眷照顾。
  const kin=officialEntries().filter(e=>officialAlive(e.p)&&e.p.career==='student'&&e.p.education==='举人'&&e.p.age>=18&&e.p.age<=55&&!e.p.exiled&&!e.p.dismissed)
    .map(e=>({e,passed:chance(.35+((e.p.ability??50)-50)/200)}));
  const record={gen:S.gen,year:S.year,turn:S.turn,enke:st.examDue===S.turn};
  delete st.examDue;st.exams.push(record);if(st.exams.length>20)st.exams.shift();
  let done=false;
  const finish=order=>{
    if(done)return null;done=true;
    if(regnalChronicleActive())openRegnalChronicle();
    const titles=['状元','榜眼','探花'],posts=['翰林院修撰','翰林院编修','翰林院编修'];
    S.scholars ||= [];
    order.forEach((p,i)=>{p.examRank=titles[i];p.examYear=S.year;p.office=posts[i];p.post=posts[i];p.appointedTurn=S.turn;if(i===0)p.trust=55;
      S.scholars.push(p);scholarRecord(p,`${record.enke?'恩科':'正科'}殿试，钦点${titles[i]}，授${posts[i]}。`,i===0);});
    for(const {e,passed} of kin){
      if(passed){e.p.education='进士';e.p.post='进士';e.p.examTurn=S.turn;officialRecord(e.c,e.role,'会试得中，取得进士功名，候选授官。',{emotion:.6});}
      else officialRecord(e.c,e.role,'会试未第，仍以举人身份候选。');
    }
    record.top=order.map(p=>p.id);
    if(regnalChronicleActive())recordRegnalEntry('科举',`${record.enke?'恩科':'正科'}殿试，${order.map((p,i)=>titles[i]+p.name).join('、')}。`);
    if(typeof outerExamResults==="function")outerExamResults();
    if(journalContentVersion()>=65&&record.enke){
      const docket=ministryDockets().find(d=>d.ministry==='rites'&&d.due==null&&d.turn+1===record.turn);
      if(docket){docket.due=S.turn+1;docket.winner=order[0].id;}
    }
    if(careersActive()&&examMarriageCandidates(order[2]).length)pushEv(examMarriageEvent(order[2]));
    return `金榜张挂：状元${order[0].name}、榜眼${order[1].name}、探花${order[2].name}。${kin.filter(x=>x.passed).length?`\n外家子弟${kin.filter(x=>x.passed).map(x=>x.e.p.name).join('、')}亦中进士，候选授官。`:''}${fx(chg({prestige:2,people:1}))}`;
  };
  const byAbility=()=>candidates.slice().sort((a,b)=>b.ability-a.ability);
  const kinLine=kin.length?`\n外家子弟${kin.map(x=>`${x.e.p.name}（${fullName(x.e.c)}的${officialKinLabel(x.e.h,x.e.role,x.e.c)}）`).join('、')}也在会试榜上应考。`:'';
  return {title:record.enke?'恩科殿试 · 钦点三甲':'殿试 · 钦点三甲',por:candidates[0],cast:candidates,
    text:`会试已毕，三名贡士候于殿外。${head?`礼部尚书${head.p.name}主持考务。`:''}\n${candidates.map(p=>`${p.name}，${p.age}岁，${p.origin}出身：${p.essay}。`).join('\n')}${kinLine}`,
    choices:[...candidates.map(p=>({t:`钦点${p.name}为状元`,f:()=>finish([p,...byAbility().filter(x=>x!==p)])})),
      {t:'交礼部按卷定次',f:()=>finish(byAbility())}]};
}
function examTick(){if(examDueNow())pushEv(examEvent());}
const ministriesBaseTick=courtTick;
courtTick=function(...args){const result=ministriesBaseTick.apply(this,args);examTick();settleInterruptedMinistryFollowups();return result;};

/* —— 页面 —— */
function examSchedulePanel(showMinistries=true){
  if(!S)return '';
  const last=(S.ministries?.exams||[]).findLast(x=>x.gen===S.gen&&x.top?.length);
  const winner=last?scholarById(last.top[0]):null;
  return `<section class="detail-section exam-schedule" aria-label="科举日程"><h3>科举日程</h3>
    <p>正科 · <strong>${esc(examIntervalLabel(regularExamInterval()))}</strong></p>
    <p>${esc(nextExamLabel())}。</p>
    <p class="hint">到期转入三月时自动呈上殿试，无须先任命礼部尚书。${winner?`最近一科：${esc(cnNum(last.year))}年${last.enke?'恩科':'正科'}，状元${esc(winner.name)}。`:''}</p>
    <div class="acts"><button class="btn sm gold" onclick="A.examSchedule()" ${S.over?'disabled':''}>调整科举周期</button>${showMinistries?`<button class="btn sm" onclick="A.go('ministries')">礼部与新科进士</button>`:''}</div></section>`;
}
function viewMinistries(){
  const card=([id,m])=>{
    const head=ministryHead(id),used=S.ministries?.used?.[id],wait=used==null?0:Math.max(0,MINISTRY_GAP-(S.turn-used));
    const schedules=id==='rites'&&journalContentVersion()>=33;
    const onAssignment=head&&!officialServing(head.p);
    const why=!head?'尚书空缺':onAssignment?'尚书有差在身':wait?`${wait}个月后可再办`:id==='rites'&&(examPending()||S.turn-lastExamTurn()<24)?'两科之间须隔两年':id==='works'&&S.flags.floodDikeGen===S.gen?'河工已修固':E().energy<1?'精力不足':E().treasury<m.cost?'国库不足':'';
    return `<article class="card ministry-card"><div class="ministry-head">${head?porImg(head.p,56):''}<div><h3>${m.name}<small> · ${m.duty}</small></h3>
      <p>${head?`尚书 ${head.scholar?`<button class="person-link" onclick="A.go('scholar','${head.p.id}')">${esc(head.p.name)}</button>`:officialLink(head.e.c,head.e.role)} · 才干${rd(head.p.ability)}`:'<span class="hint">尚书空缺</span>'}</p></div></div>
      <p class="hint">${schedules?`正科${examIntervalLabel(regularExamInterval())}，三月殿试。${nextExamLabel()}。可另奏开恩科。`:m.brief+(id==='rites'?` ${nextExamLabel()}。`:'')}</p>
      <div class="acts"><button class="btn sm jade" onclick="A.ministryAct('${id}')" ${ministryReady(id)?'':'disabled'}>${m.action}<small>精力−1${m.cost?' · 国库−'+m.cost:''}${why?' · '+why:''}</small></button>
      <button class="btn sm" onclick="A.ministryAppoint('${id}')" ${onAssignment?'disabled':''}>${head?'改任尚书':'任命尚书'}</button>${schedules?`<button class="btn sm" onclick="A.examSchedule()" ${S.over?'disabled':''}>调整正科周期</button>`:''}</div></article>`;
  };
  const scholars=scholarList().filter(p=>!p.registrySource).slice().reverse();
  return `<button class="btn quiet sm detail-back" onclick="A.go('government')">← 返回治国理政</button><h2>六部</h2>${examSchedulePanel(false)}<p class="hint">尚书由在任且才干 55 以上的官员出任，一人不兼两部。各部每年可办一件大事，成败看尚书才干。</p>
    ${ministryDocketSection()}
    <div class="grid ministry-grid">${Object.entries(MINISTRIES).map(card).join('')}</div>${travelFleetPanel()}
    ${detailSection('新科进士',scholars.length?`<ul class="story">${scholars.map(p=>`<li><button class="person-link" onclick="A.go('scholar','${p.id}')">${esc(p.name)}</button> · ${esc(p.examYear?`${p.examRank}`:'')} · ${esc(officialOfficeLabel(p))} · ${officialStatus(p)} · 才干${rd(p.ability)}</li>`).join('')}</ul>`:`<p class="hint">尚无科举出身的朝臣。${nextExamLabel()}。</p>`)}`;
}
function viewScholar(){
  const p=scholarById(UI.sel);if(!p)return viewMinistries();
  const held=ministryHeldBy(p),ready=officialServing(p)&&S.turn-(p.lastAudience??-99)>=3&&E().energy>=1;
  return `${personBackButton('ministries')}<header class="detail-head person-detail-head">${porImg(p,224)}<div class="grow"><p>${p.entryRoute?esc(p.entryRoute)+'出身':p.registrySource==='founding'?'登基时在任':p.registrySource==='local'?(p.away?'地方官':'地方铨选出身'):p.registrySource==='family'?'外朝家族':'科举出身'} · ${esc(p.origin)}</p><h2>${esc(p.name)}</h2><p>${esc(officialOfficeLabel(p))}${held?'':''}</p><p>${p.age}岁 · <strong>${officialStatus(p)}</strong> · ${esc(p.temperament)} · ${esc(p.examYear?`${p.examRank}`:'')}</p></div></header>
    <div class="detail-vitals">${bar('才干',p.ability)}${bar('功绩',p.merit)}${bar('信任',p.trust)}</div>
    <div class="detail-actions"><div class="acts"><button class="btn primary" onclick="A.scholarTalk('${p.id}')" ${ready?'':'disabled'}>召见垂询<small>精力 −1</small></button></div><p class="hint">问候每三个月一次。${p.registrySource==='founding'?'可在官员表中考课、调任，履历与任职一同保留。':'翰林院历练满两年、才干 55 以上可出任文职各部尚书。'}</p></div>
    ${detailSection('个人履历与纪事',detailStory(p))}
    ${p.report?detailSection('待阅回奏',`<p>${esc(p.report.text)}</p><button class="btn jade" onclick="A.officialReport('scholar:${p.id}')">阅看回奏</button>`):''}${officialBrothersPanel({p,key:'scholar:'+p.id,scholar:true})}${officialSpousePanel({p,key:'scholar:'+p.id,scholar:true})}${detailSection('家族亲缘',careerKinHTML({p,key:'scholar:'+p.id,scholar:true}))}${detailSection(['local','founding'].includes(p.registrySource)?'任内职责':'殿试策论',`<p>${esc(p.essay)}。</p>`)}${officialMarriagePanel('scholar:'+p.id)}`;
}
A.scholarTalk=function(id){
  const p=scholarById(id);if(modalOpen||!p||!officialServing(p)||S.turn-(p.lastAudience??-99)<3||!useE())return;
  p.lastAudience=S.turn;p.trust=clamp(p.trust+3);
  const line=p.entryRoute==='武选'?'“臣带来了营中的操练簿，有两匹马病了，请先看这一页。”':p.entryRoute==='荫补'?'“家中曾替臣递过荐书，这一回臣想用自己核过的账来答。”':(p.registrySource==='founding'?{持正:'“臣历任部务，只知照账说话。账若不实，臣不敢替人遮掩。”',谨慎:'“旧章有可循之处，也有积弊。臣愿先把轻重缓急查明，再请陛下裁定。”',进取:'“臣愿把积下的难事逐件办妥，以实绩请陛下验看。”',圆融:'“朝中各有所长。臣愿协调诸司，把陛下交付的差事办妥。”'}:{持正:'“臣出身草野，只知照账说话。账若不实，臣不敢替人遮掩。”',谨慎:'“臣初入翰林，所见尚浅。愿先把案卷读熟，再议更张。”',进取:'“臣殿试所论，愿有一日能亲手试行，以实绩请陛下验看。”',圆融:'“翰林院中各有门户，臣只愿不站门户，只站道理。”'})[p.temperament];
  scholarRecord(p,`陛下召见垂询。${line}`,false);save('auto');
  pushEv({title:'召见 · '+p.name,por:p,text:line,choices:[{t:'退下吧'}]});
};
PERSON_DETAIL_VIEWS.push('scholar');

function ritesHeirEligible(k){
  return k.alive&&k.sex==='m'&&!k.princeSpouseOrigin&&!k.removedFromRoyal&&!k.jailed&&!k.templeStay&&!royalJourneyAway(k)&&kidAge(k)>=5&&!storyCastHeirBar(k);
}
function observeRitesVacancies(){
  let state=S.flags.ritesVacancies;
  if(state?.gen!==S.gen)state=S.flags.ritesVacancies={gen:S.gen};
  const observe=(seat,vacant,delay)=>{
    if(!vacant)delete state[seat];
    else state[seat]||={since:S.turn,next:S.turn+delay};
  };
  observe('queen',!empress(),3);
  observe('heir',!S.heir&&S.children.some(ritesHeirEligible),6);
  return state;
}
function ritesVacancyPetitions(){
  const state=observeRitesVacancies(),events=[];
  for(const seat of ['queen','heir']){
    const wait=state[seat];if(!wait||S.turn<wait.next)continue;
    const queen=seat==='queen',months=S.turn-wait.since,first=queen&&months<6;
    wait.next=first?wait.since+6:S.turn+6;
    if(!chance(first?.55:.8))continue;
    const head=ministryHead('rites'),byline=head?'礼部尚书'+head.p.name:'礼部代署官',topic=queen?'册立皇后':'册立太子';
    const queenEligible=c=>!c.outerHouseholdId&&c.rank>=5&&c.rank<8;
    const candidates=queen?harem().filter(queenEligible).sort((a,b)=>b.rank-a.rank):S.children.filter(ritesHeirEligible).sort((a,b)=>a.born-b.born);
    const preface=queen?(first?'中宫已虚三月，臣请陛下早定人选，好让奉册、告庙诸礼有所预备。':'凤位久虚。来日宗庙行礼，内廷命妇由谁领班，还请陛下定夺。'):
      '宗人府呈来的玉牒上，已有年满五岁的皇子。臣请陛下早定储嗣，东宫讲读也好有所安排。';
    const record=line=>{log(byline+line);if(head)courtPersonRecord(head,line);};
    const valid=()=>S.gen===state.gen&&!S.over&&!mourningActive()&&(queen?!empress():!S.heir&&S.children.some(ritesHeirEligible));
    events.push({title:queen?'礼部请立中宫':'礼部请立储君',valid,por:head?.p,
      text:byline+'上疏：“'+preface+'”'+(queen&&!candidates.length?'\n眼下宫中无人居妃位及以上，礼部请先斟酌晋封人选。':''),
      onQueue:()=>record('上疏，请'+topic+'。'),
      choices:[{t:'留中，容后再议',f:()=>{record('所奏'+topic+'一事，奉旨缓议。');return '奏疏留中，礼部照旧例行事。';}},
        ...candidates.map(p=>({t:(queen?'拟立':'拟册')+(queen?cName(p):kidName(p))+' · '+(queen?fullName(p):kidAge(p)+'岁'),
          cond:()=>valid()&&(queen?harem().includes(p)&&queenEligible(p):ritesHeirEligible(p)),
          f:()=>{if(queen)A.crown(p.id);else A.kidHeir(p.id,true);}}))]});
  }
  return events;
}
