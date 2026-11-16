/* One stock unit is half a batch. Estate grain and the imperial reserve have separate ledgers. */
const yiLandActive=()=>journalContentVersion()>=61;
const YI_LAND_CAPACITY=4;
const yiLandRegistry=()=>({...S.classicStories?.relief,...S.yiLands});
const yiLandProjects=()=>Object.values(yiLandRegistry()).filter(project=>project.estate);
const yiGrainLabel=units=>units%2?(units===1?'半批':`${cnNum(Math.floor(units/2))}批半`):`${cnNum(units/2)}批`;
const YI_CASES={
 skim:{clue:'租簿记作足额，仓吏交来的入仓票却少了半批。乡老请朝廷核对两本原簿。',
  report:'查官逐笔核对田契、交租票和过秤簿，又访了运粮人。应入仓的半批谷被另开一张票，转进了管账人的私仓。',
  verdict:'查实克扣半批租粮'},
 favor:{clue:'仓簿有半批救济粮已经签领，几个登记在册的村户却说从未收到。乡老请朝廷复核领粮名单。',
  report:'查官拿签领簿逐户问讯，与仓门留底比勘，查明半批粮绕过原定名册，先发给了管账人的亲族，几户本应先领的人没有领到。',
  verdict:'查实偏给自家亲族'},
 clerical:{clue:'一笔半批租粮在两册上的日期对不上，乡老担心有短缺，请查仓底。',
  report:'查官亲去验仓，又对过两张过秤票。半批租粮实物俱在，管账人把晚到的一车记进了前日账页，遂与签押日期不符。',
  verdict:'账期误记，粮食齐全'}
};
function yiLandFamily(project){
 const origin=familyHostById(project.kin);
 const women=origin?paternalFamily(origin).filter(c=>c.alive&&!c.gone&&familyCourtHosts().includes(c)):[];
 const ids=new Set(women.map(c=>c.id));
 const children=royalHouseholds().filter(k=>k.alive&&!k.lost&&kidAge(k)>=6&&(ids.has(k.mom)||ids.has(k.foster)));
 return {origin,women,children};
}
function yiLandAccountant(entry){
 const p=entry?.p;
 return officialAlive(p)&&(p.age??18)>=18&&!p.dismissed&&!p.exiled;
}
function startYiLand(project){
 if(!yiLandActive()||project.estate||project.stored==null)return;
 const origin=familyHostById(project.kin),house=origin?.house;
 const manager=house&&['father',...brotherRoles(house)].map(role=>officialEntry(origin.id+':'+role)).find(yiLandAccountant);
 const wait=(10-S.month+12)%12||12;
 project.estate={units:0,nextHarvest:S.turn+wait,manager:manager?{key:manager.key,id:manager.p.id,name:manager.p.name,houseId:house.father.id}:null};
}
function yiLandChronicle(project,title,text,actors=[],familyMode=null){
 const family=yiLandFamily(project);
 const sponsor=courtPerson(project.key)?.p;
 const people=[...new Set([...(officialAlive(sponsor)?[sponsor]:[]),...actors.filter(Boolean)])];
 const cast=[...people,...family.women,...family.children];
 for(const p of people)yiLandStory(p,project.thread,'days',title,cast,text);
 for(const c of family.women){
  let feelings='';
  if(familyMode==='clear')feelings='她看过验仓凭票，才放心给娘家回信，请把错页和勘验簿一起留存。';
  if(familyMode==='guilty'){
   feelings=['持重','将门','才女','刚烈','聪慧'].includes(c.trait)?
    '她为娘家的过失难过，也写信说，名册既定，族亲与旁人都该照同一条规矩领粮。':
    '她看到娘家名字出现在核查簿里，又羞又难过。回信只问受亏的几户如今可领到了粮。';
  }
  yiLandStory(c,project.thread,'family',title,cast,text+feelings);
  if(feelings&&S.consorts.includes(c))cchg(c,{mood:familyMode==='clear'?4:-5});
 }
 for(const k of family.children){
  if(!familyMode)continue;
  const older=kidAge(k)>=12;
  const feelings=familyMode==='clear'?(older?'孩子读过粮票，后来提起此事时，会先问有没有实据。':'孩子听说粮都在，才敢问原先为什么让母亲担心。'):
   (older?'孩子将领粮名册同家书放在一起，说即使是自家人，也应以灾情轻重定先后。':'孩子问，原先没领到粮的人后来怎么办。母亲把查过的经过慢慢讲给孩子听。');
  yiLandStory(k,project.thread,'family',title,cast,text+feelings);
 }
 log(text,1);
}
function yiLandTick(){
 if(!yiLandActive()||S.over)return;
 for(const project of Object.values(yiLandRegistry())){
  startYiLand(project);
  const estate=project.estate;
  if(!estate)continue;
  const current=estate.case;
  if(current?.stage==='investigating'){
   const official=courtPerson(current.auditor)?.p;
   if(!officialAlive(official)||official.dismissed||official.retired||official.exiled){
    if(official?.yiAudit===current.id)delete official.yiAudit;
    current.stage='suspected';delete current.auditor;
    yiLandChronicle(project,'义田待复查','原查官已不能承差，核账线索仍封存，须另择人接办。');
   }
  }
  if(S.turn<estate.nextHarvest)continue;
  estate.nextHarvest+=12;
  const manager=estate.manager&&officialEntry(estate.manager.key);
  if(estate.manager&&!yiLandAccountant(manager)){
   estate.manager=null;
   yiLandChronicle(project,'义田交账','原管账人已不能经手，租簿与仓粮交县署公管。');
  }
  const printed=S.classicStories?.works?.['relief-'+project.gen]?.press?.destination==='地方粮仓';
  if(estate.manager&&(!estate.case||estate.case.stage==='closed'&&S.turn-estate.case.closed>=24)&&chance(printed||estate.oversight ? .14 : .27)){
   const kind=pick(['skim','favor','clerical']);
   estate.case={id:`yi-land:${project.gen}:${S.turn}`,stage:'suspected',kind,manager:{...estate.manager}};
   if(kind==='clerical')estate.units=Math.min(YI_LAND_CAPACITY,estate.units+1);
   yiLandChronicle(project,'义田账疑',`秋收对簿，${YI_CASES[kind].clue}`,[manager.p]);
  }else{
   const added=estate.units<YI_LAND_CAPACITY;
   if(added)estate.units++;
   yiLandChronicle(project,'义田秋收',added?`本岁田租验收，半批入义仓，现有${yiGrainLabel(estate.units)}可供赈济。`:
    `本岁田租验收，义仓已满${yiGrainLabel(YI_LAND_CAPACITY)}。以新谷轮换同量陈粮，备荒数照旧。`,[manager?.p]);
  }
 }
}
function yiIndependentOfficial(person,caseFile){
 const p=person.p;
 return officialServing(p)&&(p.ability??0)>=40&&p.id!==caseFile.manager.id&&
  person.e?.h.father.id!==caseFile.manager.houseId&&
  !careerKin(person).some(relation=>relation.c.house?.father.id===caseFile.manager.houseId);
}
function yiLandAuditEvent(project){
 const estate=project.estate,file=estate.case;
 if(!file||file.stage==='closed'||file.stage==='investigating'&&file.due>S.turn)return null;
 const entry=officialEntry(file.manager.key),manager=entry?.p;
 if(file.stage==='suspected'){
  const valid=()=>!S.over&&estate.case===file&&file.stage==='suspected';
  const candidates=careerPeople().filter(person=>yiIndependentOfficial(person,file)).sort((a,b)=>b.p.ability-a.p.ability).slice(0,6);
  return {title:`义田账疑 · ${file.manager.name}`,valid,por:manager,...YI_LAND_SOURCE,
   text:`${YI_CASES[file.kind].clue}\n管账人为${file.manager.name}。各方说法尚未核实，可另派无亲缘牵连的大臣查原簿、验仓、访灾户。${candidates.length?'':'眼下没有可领差的合适官员，稍后可从常平仓再派。'}`,
   choices:[...candidates.map(person=>({t:`命${person.p.name}核查 · 两个月回奏`,person:person.p,
    cond:()=>valid()&&yiIndependentOfficial(person,file),why:'已领差或与管账者有亲缘',
    f:()=>{
     if(!valid()||!yiIndependentOfficial(person,file))return null;
     Object.assign(file,{stage:'investigating',auditor:person.key,due:S.turn+2});person.p.yiAudit=file.id;
     const text=`${person.p.name}奉旨独立核查义田，封取原簿，并查仓票及领粮户。`;
     yiLandChronicle(project,'义田核账',text,[person.p,manager]);return text;
    }})),{t:'先封账留查，稍后再派',f:()=>{if(valid())file.snoozed=S.turn;return null;}}]};
 }
 const auditor=courtPerson(file.auditor)?.p,caseData=YI_CASES[file.kind];
 const valid=()=>!S.over&&estate.case===file&&file.stage==='investigating'&&file.due<=S.turn&&
  officialAlive(auditor)&&!auditor.exiled&&!auditor.dismissed&&!auditor.retired;
 const settle=decision=>()=>{
  if(!valid())return null;
  const guilty=file.kind!=='clerical',repay=decision==='replace'||decision==='supervise';
  const text=decision==='clear'?'令县署改正日期，当堂对清账目，撤去疑名。':
   decision==='replace'?'追缴所欠，撤换原管账人，义田改由县署公管。':
   decision==='supervise'?'责令补回半批，由县署与原管账人共同签押，逐户按灾情轻重发粮。':
   '核查原案照实存档，暂不追缴，受亏村户的缺额仍记在册。';
  if(auditor?.yiAudit===file.id)delete auditor.yiAudit;
  if(decision==='replace'&&estate.manager?.key===file.manager.key)estate.manager=null;
  if(decision==='supervise')estate.oversight=true;
  const sendDirect=repay&&estate.units>=YI_LAND_CAPACITY;
  if(repay){
   if(!sendDirect)estate.units++;
   if(manager)manager.trust=clamp((manager.trust??0)-(decision==='replace'?8:4));
  }
  file.stage='closed';file.closed=S.turn;
  const repayment=repay?(sendDirect?'义仓已满，补谷照欠册直接拨给受亏村户。':'补谷已验收入仓。'):'';
  const result=`${caseData.verdict}。${text}${repayment}`;
  estate.lastRuling=result;
  yiLandChronicle(project,'义田处置',result,[manager,auditor],guilty?'guilty':'clear');
  return result+(sendDirect?fx(chg({people:2})):guilty&&decision==='archive'?fx(chg({people:-2})):'');
 };
 return {title:`义田复核 · ${file.manager.name}`,valid,por:auditor,...YI_LAND_SOURCE,
  text:`${auditor?.name||'查官'}呈上核账结果。\n${caseData.report}`,choices:file.kind==='clerical'?
   [{t:'改账销案，为管账人释疑',f:settle('clear')}]:
   [{t:'追缴补粮，撤换管账人',f:settle('replace')},{t:'责令退赔，县署会签留任',f:settle('supervise')},{t:'记下实情，暂不追缴',f:settle('archive')}]};
}
function pendingYiLandEvent(){
 if(!yiLandActive()||S.over)return null;
 for(const project of yiLandProjects()){
  const file=project.estate.case;
  if(file?.stage==='suspected'&&S.turn-(file.snoozed??-99)<3)continue;
  const event=yiLandAuditEvent(project);if(event)return event;
 }
 return yiLandOpeningEvent();
}
function appendYiDisasterRelief(event,disaster,people){
 if(!yiLandActive())return event;
 const projects=yiLandProjects().filter(r=>r.estate.units>0);
 if(!projects.length)return event;
 event.text+='\n义仓有已验入仓的租粮，可以另调半批赈济。';
 let issued=false;
 for(const project of projects){
  const estate=project.estate;
  const valid=()=>!issued&&!S.over&&estate.units>0;
  event.choices.push({t:`调义田半批租粮赈${disaster}${projects.length>1?` · 第${cnNum(project.gen)}朝所置`:''}`,
   delegated:true,cond:valid,why:'义仓须有半批实存',preview:`用半批义田租粮 · 民心 +${people} · 常平仓存粮照旧`,f:()=>{
    if(!valid())return null;
    issued=true;estate.units--;
    const text=`调义田半批租粮赈${disaster}，县署按急户簿验发。义仓余粮${yiGrainLabel(estate.units)}，来年仍照例收租。`;
    yiLandChronicle(project,'义田赈济',text,[estate.manager&&officialEntry(estate.manager.key)?.p]);
    return text+fx(chg({people}));
   }});
 }
 return event;
}
function yiLandLedger(){
 const projects=yiLandProjects();
 if(!projects.length||S.over)return null;
 const lines=projects.map(project=>{
  const estate=project.estate,file=estate.case;
  const stage=file?.stage==='suspected'?' · 有疑账待查':file?.stage==='investigating'?
   (file.due<=S.turn?' · 查官已回奏':` · 距核查回奏${yiLandMonths(file.due-S.turn)}`):'';
  return `第${cnNum(project.gen)}朝所置 · 义仓实存${yiGrainLabel(estate.units)} · ${estate.manager?`由${estate.manager.name}管账`:'县署公管'}${stage}。下次秋收入簿尚有${yiLandMonths(Math.max(1,estate.nextHarvest-S.turn))}。${estate.lastRuling?'\n上案处置：'+estate.lastRuling:''}`;
 });
 const choices=projects.flatMap(project=>{
  const event=yiLandAuditEvent(project);
  return event?[{t:`查看第${cnNum(project.gen)}朝所置义田的账案`,f:()=>{pushNow(event);return null;}}]:[];
 });
 return {title:'常平仓 · 义田簿',text:lines.join('\n'),choices:[...choices,{t:'合上义田簿'}]};
}

const YI_LAND_SOURCE={ref:'钱公辅《义田记》',refURL:'https://zh.wikisource.org/zh-hans/義田記'};
const yiLandMonths=months=>months===6?'半年':months===12?'一年':`${cnNum(months)}个月`;
function yiLandStory(person,thread,kind,title,cast,text){
 const people=[...new Map(cast.filter(p=>p?.id!=null).map(p=>[p.id,{id:p.id,name:p.fam?fullName(p):p.name}])).values()];
 story(person,`【${title}】${text}`);
 Object.assign(person.story.at(-1),{thread,life:{kind,title,people,gen:S.gen}});
}
function proposeYiLand(person,report){
 if(!yiLandActive()||yiLandRegistry()[S.gen]||!['grain','granary','reclamation'].includes(report.taskId))return;
 const kin=careerKin(person).find(r=>r.type==='blood'&&r.c.alive&&!r.c.gone)?.c;
 const project={gen:S.gen,key:person.key,kin:kin?.id,due:S.turn+3,stage:'offer',office:report.office,
  title:report.title,thread:`yi-land:${S.gen}:${report.id}`};
 (S.yiLands||={})[S.gen]=project;
 const entry=person.p.story.findLast(e=>e.t.startsWith('【御批】'));
 if(entry)entry.thread=project.thread;
}
function yiLandOpeningEvent(){
 const project=Object.values(yiLandRegistry()).find(r=>r.due<=S.turn&&
  (r.stage==='collecting'||r.gen===S.gen&&r.stage==='offer'));
 if(!project)return null;
 const p=courtPerson(project.key)?.p,stage=project.stage,opening=stage==='offer';
 const available=()=>officialAlive(p)&&!p.retired&&!p.dismissed&&!p.exiled&&(!project.office||(p.office||p.post)===project.office);
 if(opening&&!available())return null;
 const valid=()=>!S.over&&yiLandRegistry()[project.gen]===project&&project.stage===stage&&(!opening||available());
 const ready=()=>opening?E().treasury>=35:grainStorageHasRoom();
 const settle=approve=>{
  if(!valid()||approve&&!ready())return null;
  let text;
  if(opening){
   project.stage=approve?'collecting':'closed';
   project.due=S.turn+3;
   text=approve?'准设义田，拨银备田契、修仓门。乡绅自愿留田，租谷专作备荒，里正与县丞照册查验。':
    '义田折留中，原先的赈务照常办理。';
  }else{
   project.stage='closed';project.stored=approve;
   if(approve)storeHalfGrainReserve();
   startYiLand(project);
   text=`义田首收查验完毕，共得半批租谷。${approve?'粮已送进常平仓。':'粮已直接送给候赈村户。'}以后每年十月照例收租，余粮记入义仓账。${project.estate.manager?`此后由${project.estate.manager.name}经管租簿。`:'此后由县署公管。'}`;
  }
  yiLandChronicle(project,'义田与仓粮',`${project.title}。${text}`);
  return text+(opening&&approve?fx(chg({treasury:-35})):!opening&&!approve?fx(chg({people:4})):'');
 };
 const family=familyHostById(project.kin);
 const words=family?.alive&&!family.gone?(familyUpbringing(family).group==='merchant'?'家书里还提到，租谷与各家所捐的修仓钱该分开记账。':
  familyUpbringing(family).group==='farm'?'家书里还提醒，偏村里没有车可借，告急时应准里正代报。':'家书里还提到，领粮应先核灾情，不能只凭捐粮人家的面子。'):'';
 return {title:opening?'户部 · 置田济乡':'常平仓 · 义田首收',por:p,valid,...YI_LAND_SOURCE,
  text:opening?`${p.name}复查了「${project.title}」，又呈一折。乡里愿留田租备荒，拟请朝廷出一笔起办银，另立账册。${words}`:
   '首批半批租谷已经验明。可先送常平仓，也可以径发候赈村户。往后秋租另入义仓。',
  choices:opening?[{t:'同意试办义田 · 国库−35',cond:ready,why:'国库不足',f:()=>settle(true)},
   {t:'维持原议，义田折留中',f:()=>settle(false)}]:
  [{t:'半批租粮存入常平仓',cond:ready,why:'常平仓已满',f:()=>settle(true)},{t:'将租粮径发候赈村户',f:()=>settle(false)}]};
}
