/* ============ 锦衣卫 ============ */
// 锦衣卫只查确有其事的案子：每宗案卷在立案时已记下真正的主使（后宫疑案）或事实真伪（风闻参本），
// 密查只决定能否查到，不会临时改写真相。搜宫只能搜出确有案底的人；搜不出东西，被搜的妃嫔会记恨。
const JINYIWEI_RETRY=6, JINYIWEI_SEARCH_GAP=12;
const PALACE_CASE_EVENTS={
  '香囊疑案':{crime:'香囊藏麝',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '石阶惊变':{crime:'石阶泼油',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '巫蛊之祸':{crime:'栽赃巫蛊',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '东宫惊魂':{crime:'谋害储君',culprit:ev=>ev.present?.[1],victim:ev=>ev.present?.[2]||null}
};
const jinyiwei=()=>S.jinyiwei?.commander?S.jinyiwei:null;
const palaceCases=()=>S.palaceCases||[];
const caseOpen=x=>x.status==='cold'||x.status==='investigating';
function jinyiweiCommanderReady(){const j=jinyiwei();return !!j&&officialServing(j.commander);}
function openPalaceCase(data){
  const list=S.palaceCases ||= [];
  const same=list.find(x=>caseOpen(x)&&x.kind===data.kind&&x.crime===data.crime&&x.culprit===data.culprit&&x.victim===data.victim&&x.target===data.target);
  if(same)return same;
  const item={id:`case-${S.gen}-${S.turn}-${list.length+1}`,opened:S.turn,d:dateStr(),status:'cold',tries:0,...data};
  list.push(item);if(list.length>40)list.splice(0,list.findIndex(x=>!caseOpen(x))+1||0);
  return item;
}
function caseVictimName(x){const v=x.victim!=null&&byId(x.victim);return v?fullName(v):x.victimName||'—';}

/* —— 后宫疑案：未能查明的，记入案卷；设立锦衣卫后可直接交其密查 —— */
function palaceCaseWrap(ev){
  const spec=ev&&PALACE_CASE_EVENTS[ev.title];
  if(!spec||!courtOfficesActive())return ev;
  const a=spec.culprit(ev),b=spec.victim(ev);if(!a||!S.consorts.includes(a))return ev;
  const data={kind:'harem',title:ev.title,crime:spec.crime,culprit:a.id,victim:b&&S.consorts.includes(b)?b.id:null,victimName:b?fullName(b):null};
  ev.choices=ev.choices.map(choice=>!choice.f?choice:{...choice,f:function(...args){
    const result=choice.f.apply(this,args);
    const exposed=Q.some(e=>e.title==='真相大白'&&e.cast?.[0]===a)||(journalContentVersion()>=43&&curEv?.title==='真相大白'&&curEv.cast?.[0]===a);
    if(!exposed&&result!==null)openPalaceCase({...data,note:choice.t});
    return result;
  }});
  if(jinyiwei())ev.choices.push({t:'交锦衣卫密查 · 国库−15',cond:()=>jinyiweiCommanderReady()&&E().treasury>=15,why:'锦衣卫指挥使不在任或国库不足',f:()=>{
    const item=openPalaceCase({...data,note:'交锦衣卫密查'});dispatchCase(item,15);
    if(b?.alive)story(b,`${ev.title}一案，陛下交锦衣卫密查。`);
    return `锦衣卫${jinyiwei().commander.name}领了案卷，下月回报。${fx(chg({treasury:-15}))}`;
  }});
  return ev;
}
for(let i=0;i<HAREM.length;i++){
  const create=HAREM[i],wrapped=(...args)=>palaceCaseWrap(create(...args));
  Object.defineProperty(wrapped,'name',{value:create.name});HAREM[i]=wrapped;
}

/* —— 设立与差遣 —— */
A.establishJinyiwei=function(){
  if(modalOpen||S.over||jinyiwei())return;
  pushEv({title:'设立锦衣卫',text:'锦衣卫掌侍卫、缉捕与诏狱，可替陛下密查宫闱疑案、核实风闻奏事，也能搜查宫室。\n文官们担心“厂卫横行”，设立之后每次搜宫或密查都会让朝野多一分侧目。',choices:[
    {t:'设立锦衣卫，择人出任指挥使 · 精力−1 · 国库−50',cond:()=>E().energy>=1&&E().treasury>=50,why:'精力或国库不足',f:()=>{
      if(jinyiwei()||!useE())return null;chg({treasury:-50});
      const sur=pick(courtNamesActive()?COURT_SURNAMES:SUR),given=courtNamesActive()?courtGivenName(sur,ri(0,2e9)):pick(BROTHER_NAMES),seed=ri(1,2e9),faces=[273,285,286,287];
      const commander={id:`jyw-${S.gen}-${S.turn}`,name:sur+given,sur,age:ri(30,46),seed,ability:ri(55,82),trust:50,merit:20,temperament:pick(['持正','谨慎','进取']),
        office:'锦衣卫指挥使',post:'锦衣卫指挥使',career:'official',alive:true,story:[],official:3,artPortrait:faces[seed%faces.length],jinyiwei:true};
      if(expandedOfficialPortraitsActive()){delete commander.artPortrait;assignCourtOfficialPortrait(commander,'army');}
      S.jinyiwei={established:S.turn,commander,searched:{}};story(commander,'奉旨出任锦衣卫指挥使。');
      policyNudge('civil',-3);log(`设立锦衣卫，以${commander.name}为指挥使。`,1);save('auto');
      return {text:`${commander.name}领了绣春刀与飞鱼服，叩首谢恩。${fx(chg({prestige:1}))}`,por:commander};
    }},{t:'暂不设立'}]});
};
function caseReady(x){return !!x&&x.status==='cold'&&S.turn-(x.lastTry??-99)>=JINYIWEI_RETRY;}
const INTELLIGENCE_SOURCES={
 eunuch:{name:'内侍',specialty:'宫中人员动向',kind:'harem'},
 maid:{name:'宫女',specialty:'妃嫔日常与私下谈话',kind:'harem'},
 guard:{name:'锦衣卫',specialty:'案件与证据',kind:'harem'},
 court:{name:'外朝密探',specialty:'官员与外戚往来',kind:'rumor'}
};
const intelligenceEnabled=()=>journalContentVersion()>=85;
const intelligenceState=()=>S.intelligence?.gen===S.gen?S.intelligence:null;
function intelligenceAgent(id){
  const group=INTELLIGENCE_SOURCES[id],state=intelligenceState();
  const agent=group&&state?.agents?.[id];
  const person=agent?.personId!=null?byId(agent.personId):null;
  if(dynastyFollowupActive()&&agent?.personId!=null&&(!person?.maid||!inPalace(person)))return;
  return agent;
}
function intelligenceSponsors(){
  return officialEntries().filter(e=>S.consorts.includes(e.c)&&officialServing(e.p)&&!e.p.away&&
    (e.c.fam.p>=55||(e.p.trust??0)>=65||officialGrade(e.p)&&officialGrade(e.p)<=3))
    .sort((a,b)=>b.c.fam.p-a.c.fam.p||(b.p.trust??0)-(a.p.trust??0)||a.key.localeCompare(b.key));
}
function recruitIntelligenceAgent(id,personId){
  if(!intelligenceEnabled()||!jinyiweiCommanderReady()||!INTELLIGENCE_SOURCES[id]||modalOpen||S.over||E().energy<1||E().treasury<10)return;
  const person=dynastyFollowupActive()&&personId!=null?byId(personId):null;
  if(dynastyFollowupActive()&&personId!=null&&(id!=='maid'||!person?.maid||!person.near||!inPalace(person)))return;
  const network=S.intelligence?.gen===S.gen?S.intelligence:(S.intelligence={gen:S.gen,agents:{},reports:[],nextId:1});
  if(intelligenceAgent(id))return;
  if(!useE())return;
  chg({treasury:-10});
  const seed=ri(1,2e9),sur=pick(SUR),given=pick(BROTHER_NAMES);
  const agent=network.agents[id]={id,name:sur+given,seed,ability:ri(40,75),loyalty:ri(45,85),compromised:chance(.15),recruited:S.turn};
  if(person){
    Object.assign(agent,{personId:person.id,name:fullName(person),ability:rd((person.talent+person.scheme)/2),loyalty:rd(person.aff)});
    agent.compromised=false;
    story(person,'【宫廷情报】在御前领了密差，平日仍照旧当值。');
  }else if(dynastyFollowupActive()&&agent.compromised){
    const sponsor=intelligenceSponsors()[0];
    if(sponsor)agent.infiltration={kind:'plant',name:sponsor.p.name,id:sponsor.p.id,turn:S.turn};
  }
  log(`【宫廷情报】${agent.name}开始担任${INTELLIGENCE_SOURCES[id].name}。`);
  render();
}
function appointIntelligenceSteward(){
  const agent=intelligenceAgent('eunuch');
  if(!dynastyFollowupActive()||!agent||agent.steward||agent.ability<55||agent.loyalty<55||modalOpen||!useE())return;
  agent.steward=true;
  log(`【宫廷情报】任命${agent.name}为宫中总管，统筹内侍与宫女的查访。`,1);render();
}
A.appointIntelligenceSteward=appointIntelligenceSteward;
function intelligenceCounterTick(){
  const state=intelligenceState();
  if(!dynastyFollowupActive()||!state||S.over||S.turn-(state.lastApproach??0)<12)return;
  const candidates=Object.keys(state.agents).map(intelligenceAgent).filter(a=>a&&!a.compromised&&S.turn-a.recruited>=3&&!(a.review?.due>S.turn));
  const sponsor=candidates.length&&intelligenceSponsors()[0];
  if(!sponsor)return;
  state.lastApproach=S.turn;
  const agent=pick(candidates);
  const pressure=clamp(.48+sponsor.c.fam.p/300-agent.loyalty/160,.05,.7);
  const accepted=chance(pressure);
  const person=agent.personId!=null?byId(agent.personId):null;
  agent.approach={turn:S.turn,d:dateStr(),accepted};
  delete agent.review;
  if(accepted){
    agent.compromised=true;
    agent.infiltration={kind:'bribe',name:sponsor.p.name,id:sponsor.p.id,turn:S.turn};
    if(person)story(person,'【宫廷情报】宫门外有人借家信递来一封另有夹层的信，她把它藏了起来。');
    log('【宫廷情报】值房查见有人递私封进宫。收信人尚未核清，可复核情报人员的往来。');
  }else{
    agent.loyalty=clamp(agent.loyalty+3);
    if(person)story(person,'【宫廷情报】有人许以银钱请她传话，她原封退回，悄悄向御前禀报。');
    log(`【宫廷情报】${agent.name}退还试图收买自己的私封，已将此事上报。`);
  }
}
function trainIntelligenceAgent(id){
  const agent=intelligenceAgent(id);
  if(!intelligenceEnabled()||!agent||S.over||modalOpen||agent.trainingTurn===S.turn||E().energy<1||E().treasury<5)return;
  if(!useE())return;
  chg({treasury:-5});agent.ability=clamp(agent.ability+5);agent.loyalty=clamp(agent.loyalty+3);agent.trainingTurn=S.turn;
  if(agent.personId!=null)story(byId(agent.personId),'【宫廷情报】练习核对值簿与转述口供。');
  log(`【宫廷情报】${agent.name}接受查访训练。`);render();
}
function assignIntelligencePalace(id,palace){
 const agent=intelligenceAgent(id);if(!intelligenceEnabled()||!agent||!['eunuch','maid'].includes(id)||!['坤宁宫',...PALACES].includes(palace)||S.over||modalOpen||E().energy<1||agent.palaceTurn===S.turn||agent.palace===palace)return;
 if(!useE())return;agent.palace=palace;agent.palaceTurn=S.turn;log(`【宫廷情报】${agent.name}奉命留意${palace}的动向。`);render();
}
function intelligenceDispatch(id,caseId,suspectId){
  const agent=intelligenceAgent(id),network=intelligenceState(),file=palaceCases().find(c=>c.id===caseId);
  const source=INTELLIGENCE_SOURCES[id],suspect=file?.kind==='harem'?byId(suspectId):null;
  if(!intelligenceEnabled()||!agent||!file||!caseOpen(file)||file.kind!==source.kind||S.over||modalOpen||E().energy<1||E().treasury<15)return;
  if(file.kind==='harem'&&!inPalace(suspect))return;
  if(network.reports.some(r=>r.agent===id&&r.due>S.turn))return;
  if(!useE())return;
  chg({treasury:-15});
  const truth=file.kind==='harem'?file.culprit===suspect.id:file.truth===true;
  const steward=dynastyFollowupActive()&&intelligenceAgent('eunuch');
  const coordination=steward?.steward&&source.kind==='harem'&&id!=='guard'?.05:0;
  const accuracy=clamp(.3+agent.ability/200+agent.loyalty/500+(agent.palace&&agent.palace===suspect?.palace ? .08 : 0)+coordination,.25,.9);
  const accurate=chance(accuracy);
  const manipulated=agent.infiltration?file.kind==='rumor'&&file.targetId===agent.infiltration.id?false:!truth:true;
  const report={id:network.nextId++,agent:id,agentName:agent.name,caseId:file.id,title:file.title,
    kind:file.kind,suspect:suspect?.id??null,suspectName:suspect?fullName(suspect):officialEntry(file.target)?.p.name||'被参官员',
    conclusion:id==='guard'&&agent.protection?.stage>=2&&agent.protection.consort===suspect?.id?false:agent.compromised?manipulated:accurate?truth:!truth,accuracy:Math.round(accuracy*100),due:S.turn+2,status:'pending'};
  network.reports.push(report);
  log(`【宫廷情报】${agent.name}受命查访「${file.title}」，约两个月后回报。`);
  render();
}
function trustIntelligenceReport(id){
  const report=intelligenceState()?.reports.find(row=>row.id===id),file=report&&palaceCases().find(row=>row.id===report.caseId);
  if(!intelligenceEnabled()||!report||!file||report.accepted!=null||S.turn<report.due||S.over||modalOpen)return;
  report.accepted=S.turn;
  if(report.conclusion&&report.kind==='harem'){
    const person=byId(report.suspect);
    if(person?.alive){cchg(person,{aff:-3,mood:-6});story(person,'陛下听信一份尚待核实的密报，待她疏远了些。');}
  }else if(report.conclusion&&report.kind==='rumor'){
    const person=officialEntry(file.target)?.p;
    if(person?.id===file.targetId)person.trust=clamp((person.trust??50)-5);
  }
  log(`【宫廷情报】采信${report.agentName}关于「${report.title}」的线索，留待核实。`);
  render();
}
function investigateIntelligenceAgent(id){
  const agent=intelligenceAgent(id);
  if(!intelligenceEnabled()||!agent||agent.review||S.over||modalOpen||E().energy<1||E().treasury<15)return;
  if(!useE())return;
  chg({treasury:-15});agent.review={due:S.turn+2,compromised:agent.compromised};
  if(dynastyFollowupActive()&&agent.infiltration)agent.review.infiltration={...agent.infiltration};
  log(`【宫廷情报】着人复核${agent.name}的来往与经手账册，约两个月后回报。`);
  render();
}
function dismissIntelligenceAgent(id,fromReview=false){
  const agent=intelligenceAgent(id),review=agent?.review;
  if(!intelligenceEnabled()||!review||S.turn<review.due||!review.compromised||S.over||modalOpen&&!fromReview)return;
  delete intelligenceState().agents[id];
  log(`【宫廷情报】复核查出${agent.name}暗中受人收买，已撤去差事。`);
  const person=agent.personId!=null?byId(agent.personId):null;
  if(person)story(person,'【宫廷情报】暗中收受私封一事被查出，御前撤去密差。');
  if(!fromReview)render();
}
function counterIntelligenceEvent(id){
  const agent=intelligenceAgent(id),review=agent?.review;
  if(!dynastyFollowupActive()||!review?.infiltration||review.read||S.turn<review.due||S.over)return null;
  const {kind,name}=review.infiltration;
  const valid=()=>intelligenceAgent(id)===agent&&agent.review===review&&!review.read&&!S.over;
  return {title:'宫廷情报 · 密查复奏',por:jinyiwei()?.commander,valid,
    text:`值簿和经手的私封对上了。${kind==='plant'?`${agent.name}入值前就受${name}指使，是安插进来的人。`:`${name}借私封送银给${agent.name}，要此人改写查访回报。`}这段时日呈上的密报宜另行核实。`,
    choices:[{t:'撤去密差，记录证人',f:()=>{dismissIntelligenceAgent(id,true);return '值房收回令牌，将私封归入案卷。';}},
      {t:'留任观察，封存证据',f:()=>{review.read=true;log(`【宫廷情报】封存${name}与${agent.name}私下往来的证据，暂留其差事。`,1);return '指挥使收好案卷，继续复核此人往后的密报。';}}]};
}
function pendingCounterIntelligenceEvent(){
  for(const id of Object.keys(intelligenceState()?.agents||{})){
    const event=counterIntelligenceEvent(id);if(event)return event;
  }
  return null;
}
A.reviewCounterIntelligence=function(id){if(!modalOpen)pushEv(counterIntelligenceEvent(id));};
A.recruitIntelligenceAgent=recruitIntelligenceAgent;
A.releaseIntelligenceMaid=function(){
 const a=intelligenceAgent('maid');
 if(!dynastyFollowupActive()||!a||S.over||modalOpen)return;
 delete intelligenceState().agents.maid;
 if(a.personId!=null)story(byId(a.personId),'【宫廷情报】卸下密差，回去料理原有差事。');
 log(`【宫廷情报】${a.name}卸下查访差事。`);render();
};
A.trainIntelligenceAgent=trainIntelligenceAgent;
A.assignIntelligencePalace=assignIntelligencePalace;
A.intelligenceDispatch=intelligenceDispatch;
A.trustIntelligenceReport=trustIntelligenceReport;
A.investigateIntelligenceAgent=investigateIntelligenceAgent;
A.dismissIntelligenceAgent=dismissIntelligenceAgent;
function assignPersonalGuard(id){
 const guard=intelligenceAgent('guard'),c=byId(id);
 if(!intelligenceEnabled()||!guard||(guard.protection&&!guard.protection.ended)||!inPalace(c)||c.maid||c.age<18||S.over||modalOpen||E().energy<1)return;
 if(!useE())return;
 guard.protection={consort:c.id,started:S.turn,last:S.turn,months:0,stage:0,secrecy:80,discovered:false};
 story(c,`${guard.name}奉命守护她的宫室。`);log(`【宫廷情报】${guard.name}奉命守护${fullName(c)}。`);render();
}
A.assignPersonalGuard=assignPersonalGuard;
function guardProtectionTick(){
 const guard=intelligenceAgent('guard'),bond=guard?.protection,c=bond&&byId(bond.consort);
 if(!intelligenceEnabled()||!bond||bond.ended||bond.last===S.turn)return;
 if(!inPalace(c)||c.age<18){bond.ended='处境改变，护卫差事结束。';return;}
 bond.last=S.turn;bond.months++;
 if(bond.stage===2&&!randomPalaceAffairsAllowed(c))bond.stage=1;
 if(bond.months===6){bond.stage=1;story(c,`【守宫旧事】${guard.name}守了许久，记得她出门的习惯与院中的灯何时熄。`);}
 const laterMeeting=bond.months>18&&bond.stage===1&&journalContentVersion()>=118&&restlessDisposition(c);
 if((bond.months===18||laterMeeting)&&randomPalaceAffairsAllowed(c)&&c.aff<70&&!c.bond){
   const base=laterMeeting ? .03 : clamp(.25+guard.loyalty/400-c.aff/400,.1,.5);
   if(chance(base+restlessTrystBonus(c))){
     bond.stage=2;
     if(journalContentVersion()>=118)bond.closeSince=bond.months;
     story(c,`【守宫旧事】${guard.name}为她挡过一场雨，两人的心意渐渐有了变化。`);
   }
 }
 if(bond.months===(bond.closeSince??18)+12&&bond.stage===2){bond.stage=3;story(c,`【守宫旧事】她与${guard.name}私下相见，彼此都明白事情不能轻易让人知道。`);}
 if(bond.stage>=2){
   guard.loyalty=clamp(guard.loyalty+(c.mood>=65?.2:c.mood<35?-.3:0));
   c.mood=clamp(c.mood+(guard.loyalty>=65?.2:guard.loyalty<35?-.3:0));
 }
 if(bond.stage===3&&!bond.discovered){bond.secrecy=clamp(bond.secrecy-3);if(journalContentVersion()>=101||chance((100-bond.secrecy)/250))bond.discovered=true;}
}
function guardAffairEvent(){
 const guard=intelligenceAgent('guard'),bond=guard?.protection,c=bond&&byId(bond.consort);
 if(!intelligenceEnabled()||!bond?.discovered||bond.ended||!inPalace(c)||S.over)return null;
 const valid=()=>intelligenceAgent('guard')===guard&&guard.protection===bond&&!bond.ended&&inPalace(c)&&!S.over;
 const resolve=mode=>{
   if(!valid())return null;
   const innocent=harem().find(person=>person!==c&&person.rank<8);
   if(mode==='frame'&&!innocent)return null;
   let result;
   if(mode==='protect'){bond.ended='被发现后，陛下压下消息，保全二人。';guard.loyalty=clamp(guard.loyalty+8);cchg(c,{aff:3,mood:5});result='你没有追究二人，将消息压下。护卫差事结束，他们仍记得这份宽容。';}
   else if(mode==='transfer'){bond.ended='被发现后，侍卫调离宫室。';guard.loyalty=clamp(guard.loyalty-8);cchg(c,{aff:-4,mood:-8});result='你让他另领差事，不再守她的宫室。她没有争辩，只把没有说完的话收回去。';}
   else if(mode==='frame'){bond.ended='被发现后，旁人被诬作递消息之人。';guard.loyalty=clamp(guard.loyalty-5);cchg(c,{mood:-5});cchg(innocent,{aff:-8,mood:-12});
     innocent.fam={...innocent.fam,p:clamp(innocent.fam.p-5)};story(innocent,`被诬作${guard.name}私通消息的经手人，蒙受不白之冤。`);result=`你将消息推到${fullName(innocent)}身上。她受了委屈，娘家声势也受牵连。`;}
   else if(mode==='demote'&&journalContentVersion()>=85&&c.rank>0&&c.rank<8){
     const oldRank=c.rank;bond.ended='私情查实后，侍卫调离，当事人受降位处置。';guard.loyalty=clamp(guard.loyalty-12);
     c.rank--;cchg(c,{mood:-18,aff:-12,favor:-8});c.fam={...c.fam,p:clamp(c.fam.p-5)};
     for(const k of kidsAlive().filter(child=>child.sex==='m'&&child.mom===c.id)){k.sup=clamp((k.sup||0)-3);kstory(k,`生母因宫中私情被降位，母族支持受到牵连。`);}
     reconcileResidences();result=`${fullName(c)}由${RANKS[oldRank]}降为${RANKS[c.rank]}，侍卫调离；她的母族声势及其子支持受到牵连。`;
   }else return null;
   story(c,`【守宫旧事】私下来往被发现。${result}`);log(`【守宫旧事】${fullName(c)}与${guard.name}的往来被发现。${result}`,1);save('auto');return result;
 };
 const autoReport=journalContentVersion()>=101;
 const reportText=`守门人与换班侍卫分别回话：${guard.name}卸值后，又折回去私会${fullName(c)}。值房已核过交班时辰，两人也承认了私下的情意。请陛下裁处。`;
 return {title:autoReport?affairReportTitle()+' · 守宫旧事':'守宫旧事 · 密报',por:autoReport?affairDutyOfficer():c,cast:autoReport?[c]:undefined,present:[c],valid,
  onShow:autoReport?()=>fileAffairReport(bond,'guard-affair:'+S.gen+':'+c.id+':'+bond.started,reportText,c):undefined,
  text:autoReport?reportText:`守宫的${guard.name}与${cName(c)}往来日久，从彼此照应到暗生情意，如今有人发现了两人的私下相见。消息尚未传开。\n保密值 ${rd(bond.secrecy)}/100；数值越低，越容易被人发现。${guard.name}仍是你的情报人员，曾受命查访宫中案件。`,choices:[
  {t:'压下消息，保全二人',f:()=>resolve('protect')},
  {t:'调离侍卫，各自安置',f:()=>resolve('transfer')},
  {t:'嫁祸旁人',cond:()=>harem().some(p=>p!==c&&p.rank<8),why:'宫中没有可被牵连的人',f:()=>resolve('frame')},
  ...(journalContentVersion()>=85?[{t:'查实后降位，调离侍卫',cond:()=>c.rank>0&&c.rank<8,why:'皇后与最低位分不能按此降位',f:()=>resolve('demote')}]:[])
 ]};
}
A.reviewGuardAffair=function(){if(!modalOpen)pushEv(guardAffairEvent());};
function intelligencePanel(){
  if(!intelligenceEnabled())return '';
  const state=intelligenceState(),agents=state?.agents||{};
  const personnel=Object.entries(INTELLIGENCE_SOURCES).map(([id,source])=>{
    const a=intelligenceAgent(id);
    const maids=dynastyFollowupActive()&&id==='maid'?maidsInIntelligenceReach():[];
    const review=a?.review,reviewText=review?(S.turn<review.due?`复核中 · 还需 ${review.due-S.turn} 个月`:
      review.compromised?(review.infiltration&&!review.read?`复核查出暗中受人收买。<button class="btn sm" data-onclick="A.reviewCounterIntelligence('${id}')">阅览复奏</button>`:`复核查出暗中受人收买。<button class="btn sm" data-onclick="A.dismissIntelligenceAgent('${id}')">撤去差事</button>`):'复核未查出受人收买。'):'';
    return `<li><strong>${esc(source.name)}</strong> · ${esc(source.specialty)} · ${a?`${esc(a.name)} · 才干 ${a.ability} · 忠诚 ${a.loyalty}${a.palace?' · 驻守'+esc(a.palace):''}
      <button class="btn sm" data-onclick="A.trainIntelligenceAgent('${id}')" ${S.over||a.trainingTurn===S.turn||E().energy<1||E().treasury<5?'disabled':''}>训练 · 精力−1 · 国库−5</button>
      ${review?reviewText:`<button class="btn sm" data-onclick="A.investigateIntelligenceAgent('${id}')" ${S.over||E().energy<1||E().treasury<15?'disabled':''}>复核此人 · 精力−1 · 国库−15</button>`}
      ${dynastyFollowupActive()&&id==='maid'?'<button class="btn quiet sm" data-onclick="A.releaseIntelligenceMaid()">卸下密差</button>':''}
      ${dynastyFollowupActive()&&id==='eunuch'?(a.steward?' · 宫中总管 · 宫闱查访可信度估计 +5':`<button class="btn sm" data-onclick="A.appointIntelligenceSteward()" ${a.ability<55||a.loyalty<55||S.over||E().energy<1?'disabled':''}>任命宫中总管 · 才干及忠诚须满55 · 精力−1</button>`):''}
      ${['eunuch','maid'].includes(id)?`<details><summary>安排驻守宫室</summary><div class="acts">${['坤宁宫',...PALACES].map(p=>`<button class="btn sm" data-onclick="A.assignIntelligencePalace('${id}','${esc(p)}')" ${a.palace===p||a.palaceTurn===S.turn||E().energy<1?'disabled':''}>${esc(p)}</button>`).join('')}</div><p class="hint">查访驻守宫室时，线索准确率有所提高；每月可调整一次。</p></details>`:''}`:
      `<button class="btn sm" data-onclick="A.recruitIntelligenceAgent('${id}')" ${intelligenceRecruitmentLocked()?'disabled':''}>招募 · 精力−1 · 国库−10</button>
      ${maids.map(person=>`<button class="btn sm" data-onclick="A.recruitIntelligenceAgent('maid',${person.id})" ${intelligenceRecruitmentLocked()?'disabled':''}>培养${esc(fullName(person))}为心腹 · 精力−1 · 国库−10</button>`).join('')}`}</li>`;
  }).join('');
  const cases=palaceCases().filter(x=>caseOpen(x)&&['harem','rumor'].includes(x.kind));
  const missions=cases.map(file=>{
    const choices=Object.entries(agents).filter(([id])=>intelligenceAgent(id)&&INTELLIGENCE_SOURCES[id]?.kind===file.kind).flatMap(([id,a])=>{
      if(file.kind==='rumor')return [`<button class="btn sm" data-onclick="A.intelligenceDispatch('${id}','${esc(file.id)}',null)">${esc(a.name)}查访 · 精力−1 · 国库−15</button>`];
      return harem().filter(c=>c.id!==file.victim).map(c=>`<button class="btn sm" data-onclick="A.intelligenceDispatch('${id}','${esc(file.id)}',${c.id})">${esc(a.name)}查访${esc(cName(c))} · 精力−1 · 国库−15</button>`);
    });
    return `<li><b>${esc(file.title)}</b><div class="acts">${choices.join('')||'尚无擅长此类查访的人手。'}</div></li>`;
  }).join('');
  const reports=(state?.reports||[]).slice().reverse().map(report=>{
    const ready=S.turn>=report.due;
    const file=palaceCases().find(item=>item.id===report.caseId),verified=file?.status==='solved';
    const truth=report.kind==='harem'?file?.culprit===report.suspect:file?.truth===true;
    const result=verified?` · 案卷查实后，此前线索${truth===report.conclusion?'相符':'有误'}`:'';
    const action=ready&&report.accepted==null&&file?`<button class="btn sm" data-onclick="A.trustIntelligenceReport(${report.id})" ${S.over?'disabled':''}>采信线索</button>`:report.accepted!=null?' · 已采信':'';
    return `<li><b>${esc(report.title)}</b> · 来源 ${esc(report.agentName)} · ${ready?`可靠度估计 ${report.accuracy}% · ${esc(report.suspectName)}${report.conclusion?'有涉案嫌疑':'暂未发现涉案线索'}。此为线索，须核实。${result}${action}`:`查访中 · 还需 ${report.due-S.turn} 个月`}</li>`;
  }).join('');
  const guard=agents.guard,protection=guard?.protection,guarded=protection&&byId(protection.consort);
  const protectionPanel=guard?`<h4>宫室护卫</h4>${protection&&!protection.ended?`<p>${esc(guard.name)}正在守护${esc(guarded?fullName(guarded):'旧人')}。</p>${protection.discovered?`<p>往来已被发现 · 保密值 ${rd(protection.secrecy)}/100</p><button class="btn sm" data-onclick="A.reviewGuardAffair()">处理密报</button>`:''}`:
    `${protection?`<p>${esc(protection.ended)}</p>`:'<p class="hint">可请这名情报人员兼任宫室护卫。</p>'}<div class="acts">${harem().filter(c=>c.age>=18&&!c.maid&&c.id!==protection?.consort).map(c=>`<button class="btn sm" data-onclick="A.assignPersonalGuard(${c.id})" ${E().energy<1?'disabled':''}>守护${esc(cName(c))} · 精力−1</button>`).join('')}</div>`}`:'';
  return detailSection('宫廷情报',`<p class="hint">查访需两个月，回报可能有误。锦衣卫案卷仍可另行调查。</p><ul class="story">${personnel}</ul>${protectionPanel}
    <h4>查访案卷</h4><ul class="story">${missions||'<li>暂无可查访的宫闱疑案或风闻案卷。</li>'}</ul>
    <h4>情报回报</h4><ul class="story">${reports||'<li>暂无回报。</li>'}</ul>`);
}
const maidsInIntelligenceReach=()=>S.consorts.filter(person=>person.maid&&person.near&&inPalace(person));
const intelligenceRecruitmentLocked=()=>!jinyiweiCommanderReady()||S.over||E().energy<1||E().treasury<10;
function dispatchCase(x,cost){x.status='investigating';x.due=S.turn+1;x.tries++;x.lastTry=S.turn;x.cost=cost;policyNudge('civil',-1);}
function jinyiweiInvestigationEvent(x,docket){
  if(!caseReady(x)||!jinyiweiCommanderReady())return null;
  return {title:'锦衣卫密查 · '+x.title,por:jinyiwei().commander,text:`案卷：${x.title}（${x.d}立案）。${x.kind==='harem'?`受害：${caseVictimName(x)}。`:''}${x.tries?`此前已查过${x.tries}次未果。`:''}\n指挥使${jinyiwei().commander.name}才干${rd(jinyiwei().commander.ability)}，下月回报。`,choices:[
    {t:'派人密查 · 精力−1 · 国库−15',cond:()=>caseReady(x)&&E().energy>=1&&E().treasury>=15,why:'精力或国库不足',f:()=>{
      if(!caseReady(x)||!useE())return null;chg({treasury:-15});dispatchCase(x,15);
      const commander=jinyiwei().commander;
      if(beginMinistryFollowup(docket,'case',{name:commander.name,commanderId:commander.id,caseId:x.id,due:x.due}))x.ministryDocket=docket.id;
      story(jinyiwei().commander,`奉旨密查「${x.title}」旧案。`);save('auto');return '缇骑已经出发，下月回报。';
    }},{t:'暂缓'}]};
}
A.jinyiweiInvestigate=function(id){
  if(!modalOpen)pushEv(jinyiweiInvestigationEvent(palaceCases().find(c=>c.id===id)));
};
// 回报：成败看指挥使才干、案子新旧与此前查过几次；真相在立案时已定。
function caseOdds(x){const j=jinyiwei();return clamp(.3+j.commander.ability/200+Math.min(.15,(x.tries-1)*.05)-(S.turn-x.opened>36?.1:0),.1,.85);}
function caseReport(x){
  const j=jinyiwei(),found=chance(caseOdds(x));
  x.status=found?'solved':'cold';delete x.due;
  if(x.kind==='rumor')return rumorReport(x,found);
  const a=byId(x.culprit),v=x.victim!=null?byId(x.victim):null;
  if(!found){
    story(j.commander,`密查「${x.title}」，线索中断。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：「${x.title}」一案，经手的宫人或死或散，线索暂断。案卷仍留，半年后可再查。`,choices:[{t:'知道了'}]};
  }
  j.commander.merit=clamp(j.commander.merit+8);story(j.commander,`密查「${x.title}」，查得主使。`);x.solvedTurn=S.turn;
  const reachable=a&&a.alive&&!a.gone;
  if(!reachable){
    if(v?.alive)story(v,`锦衣卫查明，${x.crime}一事的主使是${a?fullName(a):'已不在宫中之人'}。此人已不在人世或早已出宫，无从问罪。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：「${x.title}」的主使是${a?fullName(a):'旧人'}，但此人已不在宫中，无从问罪。真相已记入案卷。`,choices:[{t:'记入案卷'}]};
  }
  const wronged=x.crime==='栽赃巫蛊'&&v?.alive&&v.cold;
  return {title:'锦衣卫密报',por:j.commander,cast:[j.commander,a],text:`${j.commander.name}回奏：「${x.title}」一案查得人证物证，主使是${cName(a)}。${wronged?`\n${fullName(v)}至今仍在冷宫喊冤。`:''}`,choices:[
    {t:wronged?`为${fullName(v)}平反，传${cName(a)}问话`:`传${cName(a)}问话`,f:()=>{
      if(wronged){A.uncold(v.id);if(S.flags.wronged?.v===v.id)S.flags.wronged=null;story(v,'锦衣卫查明她是被人栽赃，奉旨出冷宫。');cchg(v,{mood:20,aff:10});}
      a.known=true;pushNow(punishEv(a,v&&inPalace(v)?v:null,x.crime));return '侍卫往她宫中去了。';
    }},
    {t:'记下真相，暂不声张',f:()=>{a.known=true;story(a,`锦衣卫查得${x.crime}一事是她所为，陛下暂未声张。`);x.withheld=true;
      if(v?.alive&&!wronged)story(v,`${x.crime}一事已有了结论，陛下却没有声张。`);return `案卷封存。${cName(a)}还不知道你已经知道了。`;}}]};
}
function rumorReport(x,found){
  const j=jinyiwei(),actor=officialEntry(x.accuserKey),target=officialEntry(x.target);
  if(!actor||!target||actor.p.id!==x.accuser||target.p.id!==x.targetId){x.status='closed';return null;}
  if(!found){x.status='cold';story(j.commander,`密查${target.p.name}被参一事，未得实据。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：${target.p.name}被参「${x.charge}」一事，暂未查得实据，也未能证其清白。`,choices:[{t:'知道了'}]};}
  const delta=x.friendsBefore?-12:-8;
  if(x.truth){target.p.trust=clamp(target.p.trust-5);target.p.merit=clamp(target.p.merit-6);actor.p.trust=clamp(actor.p.trust+2);
    if(journalContentVersion()>=85&&!x.familyConsequences&&/收受|贪墨/.test(x.charge)){
      x.familyConsequences=true;
      const relatives=paternalFamily(target.c).filter(c=>S.consorts.includes(c));
      for(const c of relatives){c.fam={...c.fam,p:clamp(c.fam.p-8)};story(c,`外家${target.p.name}被查实${x.charge}，家族声势受损。`);}
      const mothers=new Set(relatives.map(c=>c.id));
      for(const k of kidsAlive().filter(k=>k.sex==='m'&&mothers.has(k.mom))){k.sup=clamp((k.sup||0)-5);kstory(k,`母族${target.p.name}被查实${x.charge}，其朝中支持受到牵连。`);}
    }
    officialRecord(target.c,target.role,`锦衣卫查实其「${x.charge}」，罚俸半年。`,{emotion:-.5});officialRecord(actor.c,actor.role,`参劾${target.p.name}，经锦衣卫查实。`);}
  else{actor.p.trust=clamp(actor.p.trust-6);
    officialRecord(target.c,target.role,`被参「${x.charge}」，锦衣卫查明并无其事，得还清白。`,{emotion:.3});officialRecord(actor.c,actor.role,`参劾${target.p.name}，锦衣卫查无其事。`,{emotion:-.4});}
  recordCourtFamilyNews(target,{kind:x.truth?'proven':'cleared',task:'锦衣卫复核参本',caseKey:x.id,
    fact:x.truth?`所参「${x.charge}」经锦衣卫查实，罚俸半年。`:`所参「${x.charge}」经锦衣卫查明并无其事，得还清白。`});
  if(inPalace(actor.c)&&inPalace(target.c))relAdd(actor.c,target.c,delta);
  story(j.commander,`密查${target.p.name}被参一事，${x.truth?'查实':'查明不实'}。`);
  return {title:'锦衣卫密报',por:j.commander,cast:[j.commander,target.p,actor.p],text:`${j.commander.name}回奏：${target.p.name}被参「${x.charge}」一事，${x.truth?'确有其事，已取得驿递簿与证人口供':'查无其事，系同僚以讹传讹'}。`,choices:[{t:'依例处置'}]};
}
// 同朝参本中的风闻之事，可改交锦衣卫核实；真伪在交办时即已定下。
function jinyiweiRumorChoice(pair,cast,charge){
  if(!jinyiwei()||cast.lapse?.grounded)return null;
  return {t:'交锦衣卫核实 · 国库−15',cond:()=>jinyiweiCommanderReady()&&E().treasury>=15,why:'锦衣卫指挥使不在任或国库不足',f:()=>{
    const item=openPalaceCase({kind:'rumor',title:`${cast.y.p.name}被参`,crime:'风闻奏事',charge,accuser:cast.x.p.id,accuserKey:cast.x.key,targetId:cast.y.p.id,target:cast.y.key,truth:chance(.3),friendsBefore:pair.rel>=KIN_COURT_FRIEND});
    chg({treasury:-15});dispatchCase(item,15);
    officialRecord(cast.y.c,cast.y.role,`被${cast.x.p.name}参劾，奉旨交锦衣卫核实。`,{emotion:-.2});
    recordCourtFamilyNews(cast.y,{kind:'pending',task:'锦衣卫复核参本',caseKey:item.id,
      fact:`被参「${charge}」，已奉旨核实。家中只收到交查的消息。`});
    officialRecord(cast.x.c,cast.x.role,`参劾${cast.y.p.name}，奉旨交锦衣卫核实。`);
    return '缇骑已出京查访，下月回报。';
  }};
}

/* —— 搜宫：只能搜出确有案底的人 —— */
function searchReady(c){const j=jinyiwei();return !!j&&jinyiweiCommanderReady()&&harem().includes(c)&&S.turn-(j.searched?.[c.id]??-99)>=JINYIWEI_SEARCH_GAP&&E().energy>=1;}
A.jinyiweiSearch=function(id){
  const c=byId(id);if(modalOpen||!searchReady(c))return;
  pushEv({title:'搜宫 · '+cName(c),por:c,present:[c],text:`命锦衣卫搜查${c.palace||'她的居处'}。${c.rank===8?'\n搜查中宫，朝野必然震动。':''}\n若查不出东西，她会记恨，六宫也会人人自危。`,choices:[
    {t:'搜 · 精力−1',cond:()=>searchReady(c),why:'精力不足，或一年内已搜查过',f:()=>{
      if(!searchReady(c)||!useE())return null;const j=jinyiwei();j.searched[c.id]=S.turn;policyNudge('civil',-1);
      const x=palaceCases().find(k=>k.kind==='harem'&&caseOpen(k)&&k.culprit===c.id);
      if(x){x.status='solved';x.solvedTurn=S.turn;delete x.due;const v=x.victim!=null?byId(x.victim):null;
        story(j.commander,`搜查${fullName(c)}居处，搜出「${x.title}」一案的物证。`);
        const wronged=x.crime==='栽赃巫蛊'&&v?.alive&&v.cold;if(wronged){A.uncold(v.id);if(S.flags.wronged?.v===v.id)S.flags.wronged=null;story(v,'锦衣卫搜出栽赃的物证，她奉旨出冷宫。');}
        c.known=true;pushNow(punishEv(c,v&&inPalace(v)?v:null,x.crime));
        return `锦衣卫在${c.palace}的暗格里搜出了与「${x.title}」相关的物证。`;}
      story(c,`锦衣卫奉旨搜查她的居处，一无所获。她当着六宫的面受了这番羞辱。`);setXin(c,'委屈','居处被锦衣卫搜查');
      for(const o of harem())if(o!==c)cchg(o,{mood:-2});
      return `翻遍了箱笼妆奁，什么也没搜出来。${fx(chg({prestige:c.rank===8?-4:-1}),cchg(c,{aff:-10,mood:-15}))}`;
    }},{t:'作罢'}]});
};

/* —— 每月：回报到期的案子 —— */
function jinyiweiTick(){
  if(!courtOfficesActive()||!jinyiwei())return;
  for(const x of palaceCases().filter(k=>k.status==='investigating'&&k.due<=S.turn)){
    if(!jinyiweiCommanderReady()){
      x.status='cold';finishMinistryFollowup(x.ministryDocket,'interrupted',`「${x.title}」到期时指挥使无法主事，密查停办，原案仍留卷。`);continue;
    }
    const ev=caseReport(x);
    finishMinistryFollowup(x.ministryDocket,x.status==='solved'?'success':'setback',
      x.status==='solved'?`「${x.title}」已查得人证物证。处置详情仍依原案。`:`「${x.title}」线索暂断，原卷留待复查。`);
    if(ev)pushEv(ev);
  }
}
const jinyiweiBaseTick=courtTick;
courtTick=function(...args){const result=jinyiweiBaseTick.apply(this,args);jinyiweiTick();return result;};

/* —— 页面 —— */
function viewJinyiwei(){
  const back=`<button class="btn quiet sm detail-back" data-onclick="A.go('government')">← 返回治国理政</button>`,j=jinyiwei();
  if(!j)return `${back}<h2>锦衣卫</h2><p>锦衣卫可密查宫闱疑案、核实风闻奏事、搜查宫室。尚未设立。</p><div class="acts"><button class="btn jade" data-onclick="A.establishJinyiwei()">设立锦衣卫<small>精力−1 · 国库−50</small></button></div>${casesSection()}`;
  const c=j.commander;
  return `${back}<header class="detail-head person-detail-head">${porImg(c,160)}<div class="grow"><p>锦衣卫</p><h2>${esc(c.name)}</h2><p>指挥使 · ${c.age}岁 · ${officialStatus(c)} · ${esc(c.temperament)}</p></div></header>
    <p class="hint">宫中一旦查实妃嫔与皇子或守宫侍卫私会，值房会主动密奏。</p>
    <div class="detail-vitals">${bar('才干',c.ability)}${bar('功绩',c.merit)}${bar('信任',c.trust)}</div>
    ${detailSection('指挥使纪事',detailStory(c))}
    ${casesSection()}${jinyiweiPrinceSpouseParentagePanel()}${intelligencePanel()}
    ${detailSection('搜查宫室',`<p class="hint">只有确有案底的人才可能被搜出物证；搜不出东西，被搜者记恨、六宫不安。同一人一年内只搜一次。</p><div class="acts">${harem().map(x=>`<button class="btn sm" data-onclick="A.jinyiweiSearch(${x.id})" ${searchReady(x)?'':'disabled'}>${esc(cName(x))}<small>${esc(x.palace||'')}</small></button>`).join('')}</div>`)}
    `;
}
function casesSection(){
  const list=palaceCases().slice().reverse(),label={cold:'未破',investigating:'密查中',solved:'已破',closed:'已结'};
  const row=x=>`<li><time>${esc(x.d)}</time><b>${esc(x.title)}</b> · ${label[x.status]||x.status}${x.kind==='harem'?` · 受害：${esc(caseVictimName(x))}`:` · ${esc(x.charge||'')}`}${x.tries?` · 已查${x.tries}次`:''}
    ${jinyiwei()&&x.status==='cold'?`<button class="btn sm" data-onclick="A.jinyiweiInvestigate('${x.id}')" ${caseReady(x)&&jinyiweiCommanderReady()?'':'disabled'}>派人密查${caseReady(x)?'':' · 半年内已查'}</button>`:''}</li>`;
  return detailSection('案卷',list.length?`<ul class="story">${list.map(row).join('')}</ul>`:'<p class="hint">尚无未破的案子。后宫疑案未能查明时，会记入这里。</p>');
}
