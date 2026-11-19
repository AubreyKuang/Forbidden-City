/* Domestic stories, respectful marriages and petitions from a royal household. */
const royalHouseholdLifeActive=()=>journalContentVersion()>=131;
const householdAffectionLabel=()=>royalHouseholdLifeActive()?'夫妻感情':'夫妻信任';

function settleHouseholdAffection(k,h){
  if(!royalHouseholdLifeActive()||h.affectionLimit!=null)return;
  const p=k.spouse,fit=marriageFit(k,p);
  const scripted=p.personId!=null&&p.personId===xieAn()?.id;
  h.affectionLimit=!scripted&&p.trust<=58&&fit.common.length<=1&&
    marriageHash(`${k.id}:${p.id}:household-affection`)%100<30?50:100;
  p.trust=Math.min(p.trust,h.affectionLimit);
}
function changeHouseholdAffection(k,delta){
  if(royalHouseholdLifeActive())settleHouseholdAffection(k,ensureMarriedLife(k));
  const p=k.spouse,before=p.trust;
  p.trust=clamp(before+delta,0,royalHouseholdLifeActive()?(k.household.affectionLimit??100):100);
  return p.trust-before;
}
const householdLively=p=>['爽朗','好胜'].includes(marriageNature(p).temperament)||
  ['活泼','好客','爽直','骄纵'].includes(p.appearance?.trait||p.trait)||['灵动','爽直'].includes(p.temperament);
const householdCoupleInTown=(k,p)=>!k.away&&k.princessMarriage!=='frontier'&&!p.away&&!p.commission&&!p.diplomaticJourney&&
  !(p.personId!=null&&careerPeople().some(e=>e.p.id===p.personId&&(e.p.away||e.p.commission||e.p.diplomaticJourney)));

const ROYAL_DOMESTIC_SCENES={
  bookTea:{title:'赌书泼茶',ref:'赌书消得泼茶香，当时只道是寻常',
    match:(k,p)=>p.trust>=68&&[k,p].some(x=>marriageNature(x).hobby==='books'),
    text:(k,p)=>`${k.name}把书翻到半页，问旧句究竟在哪一卷。${p.name}说中了，抢着去取茶，反倒把两人的袖口都泼湿了。晾书时一人扶一角，谁也还忍不住笑。`,
    thought:'那页晾干以后微微卷了起来，翻到就记得当时笑成了什么样。',gain:4,
    choices:[['给他们留一卷可合读的旧书',5,3,null,0,'两人在空白处各抄了半首诗，把有茶痕的一页原样收好。']]},
  halfDay:{title:'偷得浮生半日闲',ref:'偷得浮生半日闲',
    match:(k,p)=>p.trust>=62&&[k,p].some(x=>marriageNature(x).space==='需要独处'||marriageNature(x).temperament==='沉静'),
    text:(k,p)=>`${k.name}把半日杂务往后挪了挪，与${p.name}坐在廊下。一个翻书，一个听竹叶上的雨。壶里水添过一回。雨停时，两人还想多坐片刻。`,
    thought:'一向喜欢独自歇一会儿，今日听见身旁翻页，也觉得安心。',gain:3,
    choices:[['把这半日留给他们',4,4,null,0,'府里往后每半月留半日清闲，等两个人有空便一道坐坐。']]},
  flowerMarket:{title:'花街同游',
    match:(k,p)=>p.trust>=62&&householdCoupleInTown(k,p)&&[k,p].some(householdLively),
    text:(k,p)=>`${householdLively(k)?k.name:p.name}说要领对方去认一认京中最好吃的胡饼。两人穿过花街，看了说书人的一场，又各挑一枝花，回府才分辨谁给谁挑了哪一枝。`,
    thought:'路过说书摊后还想掉头回去，幸好有人同自己一样舍不得走。',gain:4,
    choices:[['让两人自己挑下一回逛哪儿',4,3,null,0,'两人拿炭笔画了张小图，各在想回去的摊子旁点了个记号。']]},
  lanternWalk:{title:'上元灯下',match:(k,p)=>S.month===1&&p.trust>=60&&householdCoupleInTown(k,p)&&[k,p].some(householdLively),
    text:(k,p)=>`灯市渐密，${p.name}相中一盏歪头的兔灯。${k.name}走出去几步才发现身边空了，折回去时，对方已提着灯站在约好的桥边等。回府路上，他们一路猜着灯谜的下半句。`,
    thought:'最喜欢的那盏灯既不齐整，也没叫人看够；打算明年还走这条路。',gain:4,
    choices:[['将去年的灯架留下，明年再糊',5,2,null,0,'夫妻把灯架收进柜里，约好明年各画一面灯纸。']]},
  marketBasket:{title:'集市的一篮果子',match:(k,p)=>p.trust>=58&&householdCoupleInTown(k,p)&&[k,p].some(householdLively),
    text:(k,p)=>`${k.name}和${p.name}起早逛市，一人会还价，一人偏挑摊上卖相不好的果子。买到末了，两人都忘了原本要买的那一味调料，索性将晚饭改作果羹。`,
    thought:'对方一本正经挑果子的样子，比买到了什么还叫人记得。',gain:3,
    choices:[['让他们把集市的小事说完',4,3,null,0,'二人都想起摊主留下的那句话，说着说着又约了一回早市。']]},
  cordial:{title:'两盏茶，各有时辰',match:(k,p)=>k.household.affectionLimit===50||p.trust<48,
    text:(k,p)=>`${k.name}午后照旧去看自己的东西，${p.name}也留了半日做喜欢的事。及至晚饭，两人各说一件府里待办的事，逐条写妥。离席前，一人顺手替另一人掩了窗。`,
    thought:'各人的心事尽可自己留着。说好要帮忙的那件事，记得明日办完。',gain:1,
    choices:[['由他们自定各自的起居',2,4,null,0,'两人将要一同商量的事写在一处，各人的时辰由各人做主。']]}
};
function royalDomesticSceneRule(id){
  return HOUSEHOLD_SCENES[id]||(royalHouseholdLifeActive()?ROYAL_DOMESTIC_SCENES[id]:undefined);
}
function royalDomesticNews(k,p){
  if(!royalHouseholdLifeActive())return [];
  return Object.entries(ROYAL_DOMESTIC_SCENES).filter(([id,row])=>row.match(k,p)&&
    S.turn-(k.household.domesticNewsLast?.[id]??-99)>=18).map(([id,row])=>
    ({id,delta:row.gain,text:`【${row.title}】${row.text(k,p)}`,thought:row.thought,title:row.title}));
}
function rememberRoyalDomesticPartner(k,title,thought){
  const s=k.spouse;
  if(!thought||!s)return;
  const p=s.natalHost!=null?natalEntry(s.natalHost,s.personId)?.p:null;
  const person=p?.consortId!=null?byId(p.consortId)||p:p||s;
  if(person.alive===false)return;
  person.story ||= [];
  story(person,`【${title}】${thought}`);
  person.story.at(-1).life={kind:'family',title,turn:S.turn,gen:S.gen,source:'夫妻日常',
    people:[{id:k.id,name:k.name},{id:person.id,name:s.name}]};
}
function householdConcubineWilling(k){
  const nature=marriageNature(k);
  return k.amb>=55||nature.temperament==='好胜'||nature.temperament==='爽朗';
}
function householdConcubineSponsors(k){
  const ties=k.princeCircle?.officials||[];
  if(!ties.some(t=>t.score>=40))return [];
  const mother=familyHostById(k.mom),house=mother?.house;
  return officialEntries().filter(e=>officialServing(e.p)&&!e.p.away&&
    e.h.father.id!==house?.father.id&&(!mother?.clan||mother.clan!==e.c.clan)&&ties.some(t=>t.id===e.p.id&&t.score>=40));
}
function royalHouseholdConcubineTick(people){
  if(!royalHouseholdLifeActive()||!PalaceActions.busy||mourningActive()||
     S.turn-(S.flags.lastRoyalConcubinePetition??-12)<12)return;
  const candidates=people.filter(k=>k.sex==='m'&&k.spouse?.trust<=50&&!householdConcubineReason(k))
    .map(k=>({k,sponsors:householdConcubineSponsors(k)}))
    .filter(({k,sponsors})=>sponsors.length||householdConcubineWilling(k));
  if(!candidates.length||!chance(.035))return;
  const {k,sponsors}=pick(candidates),sponsor=sponsors.length?pick(sponsors):null;
  const event=householdConcubineEvent(k,{initiative:true,sponsor});
  if(event)pushEv({...event,onQueue:()=>{S.flags.lastRoyalConcubinePetition=S.turn;}});
}
A.householdConcubineBan=function(id,banned){
  if(!S||!royalHouseholdLifeActive()||modalOpen||S.over||typeof banned!=='boolean')return;
  const k=royalById(id);
  if(k?.sex!=='m'||!householdLiving(k)||!!k.household?.concubineBan===banned)return;
  const h=ensureMarriedLife(k);
  if(banned)delete h.concubineCandidate;
  h.concubineBan=banned;
  householdRecord(k,'household_concubine',banned?'奉旨禁止此后纳妾，府中照令办事。':'奉旨解除纳妾禁令，若有新议仍须请准。');
  render();
};
