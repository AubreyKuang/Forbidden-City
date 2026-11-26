/* The East Factory investigator has one fixed identity. Cases keep the facts
   they were opened with, regardless of who is given the assignment. */
const heXingjianPerson=()=>S?.fenghua?.people?.find(person=>person.fenghuaKey==='heXingjian');
const heXingjianAvailable=person=>fenghuaReleased('heXingjian')&&fenghuaPresent(person)&&
 !person.fenghua.assignment&&!mourningActive();
const heXingjianContactReady=()=>fenghuaEntryReady('heXingjian')&&jinyiweiCommanderReady();
const HE_XINGJIAN_CONTACT={
 patrol:'宫闱巡察时，值房送来一份东厂勘单。旁的卷上写着「已经拿获」，这一张却写着「所扣并非原案经手」。',
 case:'旧卷夹着一份东厂勘单。有人已经在封面写了主使，勘单却把当日的两份原记录分别列出，另指了一人。',
 memorial:'本月奏折里附了一份东厂勘单。正文说案已办结，附札却另写一行：传来的那个人与原卷记载不合。'
};

function heXingjianLeadChoice(source){
 if(!heXingjianContactReady())return null;
 return {t:'阅东厂附札 · 见首捕',preview:'另阅附札，免耗精力',cond:heXingjianContactReady,f:()=>{
  if(!heXingjianContactReady())return null;
  const person=FENGHUA_PEOPLE.heXingjian;
  pushNow({title:'东厂附札 · 贺行简',por:fenghuaPreview('heXingjian'),valid:heXingjianContactReady,
   text:HE_XINGJIAN_CONTACT[source]+'\n'+person.intro,choices:[
    {t:'收下原卷，准他听候差遣',f:()=>{
     if(!heXingjianContactReady())return null;
     const p=createFenghuaPerson('heXingjian');
     p.fenghua.contact=source;
     return '贺行简收刀退到案旁。你已可到「锦衣卫」交办专案，在「风华人物」也能再见他。';
    }},
    {t:'先存附札，改日再召',f:()=>{
     if(!heXingjianContactReady())return null;
     fenghuaState().attempts.heXingjian=S.turn;
     return '附札入卷，半年后仍可另行召见。原案各项照旧。';
    }}
   ]});
  return null;
 }};
}

function heXingjianCaseFacts(x){
 if(!caseReady(x))return false;
 if(x.kind==='harem')return x.culprit!=null;
 if(x.kind==='palace-secret'){
  const subject=secretCaseSubject(x);
  return !!subject&&!subject.k?.pendingName;
 }
 if(x.kind==='rumor'){
  return officialEntry(x.accuserKey)?.p.id===x.accuser&&x.accuser!=null&&
   officialEntry(x.target)?.p.id===x.targetId&&x.targetId!=null&&typeof x.truth==='boolean';
 }
 if(x.kind==='audit'){
  const person=courtPerson(x.target)?.p;
  return !!person&&person.id===x.targetId&&officialAlive(person)&&(person.office||person.post)===x.office;
 }
 return false;
}
function heXingjianCaseReady(x,person){
 return heXingjianAvailable(person)&&jinyiweiCommanderReady()&&heXingjianCaseFacts(x)&&E().energy>=1&&E().treasury>=15;
}
const heXingjianOrdinaryOdds=caseOdds;
caseOdds=function(x){
 const person=heXingjianPerson();
 return fenghuaReleased('heXingjian')&&!!person&&x.eastInvestigator===person.id?1:heXingjianOrdinaryOdds(x);
};

function heXingjianCaseChoice(x,docket){
 const person=heXingjianPerson();
 if(!person||!fenghuaReleased('heXingjian')||!heXingjianCaseFacts(x))return null;
 return {t:'交贺行简核查 · 精力−1 · 国库−15',cond:()=>heXingjianCaseReady(x,person),
  why:'首捕另有差事，或原案、指挥使及钱粮条件已变',f:()=>{
   if(!heXingjianCaseReady(x,person)||!useE())return null;
   chg({treasury:-15});
   dispatchCase(x,15);
   x.eastInvestigator=person.id;x.investigatorId=person.id;x.due=S.turn;
   x.progress[x.progress.length-1].text='贺行简以双倍进度核对本案，当月回奏。';
   if(x.kind==='palace-secret')beginSecretEvidence(x,secretCaseSubject(x));
   if(beginMinistryFollowup(docket,'case',{name:person.name,commanderId:jinyiwei().commander.id,caseId:x.id,due:x.due}))x.ministryDocket=docket.id;
   const report=caseReport(x);
   if(report){
    const text='“办好了。”他将核实的原卷递上。\n'+report.text;
    fenghuaRecord(person,'办好了',`奉旨核查「${x.title}」。`,'照实回奏',report.text);
    finishMinistryFollowup(x.ministryDocket,x.status==='solved'?'success':'interrupted',report.text);
    pushNow({...report,title:'贺行简 · 复命',por:person,text});
   }
   return null;
  }};
}
function heXingjianAddChoices(event,lead,assignment){
 if(event)event.choices.push(...[lead,assignment].filter(Boolean));
 return event;
}
const heXingjianNormalInquiry=jinyiweiInvestigationEvent;
jinyiweiInvestigationEvent=function(x,docket){
 const event=heXingjianNormalInquiry(x,docket);
 return event?heXingjianAddChoices(event,heXingjianLeadChoice('case'),heXingjianCaseChoice(x,docket)):null;
};
const heXingjianPrivateInquiry=secretInquiryEvent;
secretInquiryEvent=function(x){
 const event=heXingjianPrivateInquiry(x);
 return event?heXingjianAddChoices(event,heXingjianLeadChoice('case'),heXingjianCaseChoice(x)):null;
};

const HE_XINGJIAN_MISSIONS=[
 {title:'借牌的人',months:2,brief:'巡夜的小校被指冒领一车灯油。府库声称看见他的名字，交领簿却有两份相抵的记录。',
  finding:'“办好了。”小校当夜奉命押送另一批货，领油簿上的名字是后添的。贺行简将原簿与押送记录摆在一起，指向亲自领油的库房管事。',
  decisions:[['为小校销去原嫌，再移送有司','小校的名字从待查名单中删去。原簿与证言仍随案移交，依其上所记问责。'],
   ['按案卷一并请刑部复核','两份原簿与经手人证言一并转交。贺行简请人先知会小校，他可以回去当值了。']]},
 {title:'封底的签名',months:4,brief:'前案的管事交出一本旧簿。里面几份差票都挂在已亡的书吏名下，近来却还在支银。',
  finding:'“办好了。”他翻到封底，指出多年用旧名支银的是自己的旧上司。另一页是他从前署了名的回报，也随卷呈上：“那一回，臣看漏了这一页。”',
  decisions:[['原卷附上旧回报，两件事都如实记明','贺行简先在更正簿上署名。旧上司支银的凭据与他当年看漏的差错都交有司，各由各人承担。'],
   ['先查还死者家人名声，原卷照送','已故书吏洗清嫌名。贺行简将自己的旧回报放在同一封卷内，亲手交还。']]}
];
function heXingjianMission(person){
 return HE_XINGJIAN_MISSIONS[person?.fenghua.casesDone??0];
}
function heXingjianMissionEvent(person){
 const index=person?.fenghua.casesDone??0,mission=heXingjianMission(person);
 const valid=()=>heXingjianAvailable(person)&&mission===heXingjianMission(person);
 if(!mission||!valid())return null;
 const months=mission.months/2;
 return {title:mission.title,por:person,valid,text:`${mission.brief}\n通常需${mission.months}个月。交由贺行简，${months}个月回奏。`,choices:[
  {t:'差遣贺行简 · 精力−1',cond:()=>E().energy>0,f:()=>{
   if(!valid()||!useE())return null;
   person.fenghua.assignment={index,due:S.turn+months};
   fenghuaRecord(person,mission.title,mission.brief,'奉旨领差',`按双倍进度办理，${months}个月后回奏。`);
   return '他接过原卷，只回了一句：“领命。”';
  }},{t:'暂缓'}]};
}
function heXingjianMissionReport(person){
 const assignment=person?.fenghua.assignment,mission=HE_XINGJIAN_MISSIONS[assignment?.index];
 const valid=()=>fenghuaReleased('heXingjian')&&fenghuaPresent(person)&&
  person.fenghua.assignment===assignment&&S.turn>=assignment.due;
 if(!mission||!valid())return null;
 return {title:`贺行简 · ${mission.title}`,por:person,valid,text:mission.finding,choices:mission.decisions.map(([t,result])=>({t,f:()=>{
  if(!valid())return null;
  delete person.fenghua.assignment;person.fenghua.casesDone=assignment.index+1;
  fenghuaRecord(person,mission.title,mission.finding,t,result);
  return result;
 }}))};
}
A.heXingjianMission=function(){if(!modalOpen)pushEv(heXingjianMissionEvent(heXingjianPerson()));};
A.heXingjianReport=function(){if(!modalOpen)pushEv(heXingjianMissionReport(heXingjianPerson()));};

function heXingjianPanel(){
 const person=heXingjianPerson();
 if(!person||!fenghuaReleased('heXingjian'))return '';
 const assignment=person.fenghua.assignment,mission=heXingjianMission(person),months=assignment&&assignment.due-S.turn;
 if(assignment&&months<=0)return detailSection('东厂专案','<button class="btn jade" data-onclick="A.heXingjianReport()">阅贺行简回奏</button>');
 if(assignment)return detailSection('东厂专案',`<p>「${esc(mission.title)}」办理中，${months}个月后回奏。</p>`);
 if(!mission)return detailSection('东厂专案','<p>专案已结。旧案仍可从锦衣卫案卷交办。</p>');
 return detailSection('东厂专案',`<p>${esc(mission.brief)}</p><button class="btn jade" data-onclick="A.heXingjianMission()" ${heXingjianAvailable(person)&&E().energy>0?'':'disabled'}>差遣贺行简 · ${esc(mission.title)}</button>`);
}
const heXingjianNormalCases=casesSection;
casesSection=function(){return heXingjianPanel()+heXingjianNormalCases();};

function heXingjianVisit(person){
 const stage=person.fenghua.stage;
 const scenes=[
  ['公文背面的名字','值房书吏想替他誊一份更好看的回报，把有错的那页另收起来。他将那页拿回来：“写错的是臣。丢了它，谁知道后来为何要改？”',
   '他在错处旁写下更正日期。两页叠起来，最上面的人名是他自己。'],
  ['冷茶一盏','回奏毕，他端起茶便喝。近侍忙说茶已经凉了。他看了看杯底：“难怪这回奉茶，没人催臣趁热。”近侍忍住没笑，他把茶喝完才起身。',
   '换了热茶，他把杯盏往近侍那边推一点：“你也站了半日，歇会儿。”'],
  ['袖口的线','飞鱼服的袖口有一处脱线。小吏怕耽搁点卯，没敢说是自己收衣时勾到的。贺行简抽了线头放回他手里：“去补。点卯我去说。”',
   '小吏补完才来回话。他低头检查一眼，只道：“办好了。”这次说的是小吏。']
 ];
 const scene=scenes[stage]||['灯下核卷','案房收了旧卷。贺行简走前替值夜人留了一盏灯，问你还想看看哪一页。','两人对完卷宗。他将原簿封回，照例在末页署名。'];
 const [title,text,result]=scene;
 return fenghuaEvent(person,title,text,[{t:'听他说完',result}],{advance:stage<scenes.length});
}
