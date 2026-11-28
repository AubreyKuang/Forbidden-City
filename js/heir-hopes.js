/* Issue 42: the queen and other senior consorts hope for sons of their own.
   A forceful queen may ask to raise the eldest prince and feels relieved once he is hers to bring up;
   senior consorts without children worry, and another consort's pregnancy news weighs on them. */
const heirHopesActive=()=>!!S&&journalContentVersion()>=168;
const HEIR_HOPES_SENIOR_RANK=5;
function forcefulQueen(q){return !!q&&(['骄纵','骄矜','善妒','城府'].includes(q.trait)||q.scheme>=65)&&!isSolitary(q)&&q.trait!=='淡泊';}
function eldestPrince(){
  return S.children.filter(k=>k.sex==='m'&&!k.removedFromRoyal).sort((a,b)=>a.born-b.born||a.id-b.id)[0]||null;
}
const livingOwnSon=c=>S.children.some(k=>k.sex==='m'&&k.mom===c.id&&k.alive&&!k.removedFromRoyal);
const livingOwnChild=c=>S.children.some(k=>k.mom===c.id&&k.alive&&!k.removedFromRoyal);
const raisingChild=c=>S.children.some(k=>k.alive&&!k.removedFromRoyal&&(k.foster===c.id||k.mom===c.id&&!k.foster));

// The queen raises the eldest prince herself: there is nothing left to sting about the first son's birth.
const earlierQueenHeirFeelings=queenHeirFeelings;
queenHeirFeelings=function(previous){
  if(heirHopesActive()){
    const q=empress(),first=eldestPrince();
    if(q&&first&&first.foster===q.id)return;
  }
  earlierQueenHeirFeelings(previous);
  if(heirHopesActive()&&previous&&previous.turn!==S.turn)queenEldestRequestMonth();
};

function queenEldestRequestReady(q,first,mother){
  return !!(q&&first&&mother&&inPalace(q)&&q.age>=18&&mother!==q&&first.alive&&!first.pendingName&&first.mom===mother.id&&
    inPalace(mother)&&childInPalace(first)&&!first.foster&&!first.dowagerUpbringing&&kidAge(first)<7&&!livingOwnSon(q)&&!S.over);
}
function queenEldestRequestMonth(){
  const q=empress(),first=eldestPrince(),mother=first&&byId(first.mom);
  if(!forcefulQueen(q)||!queenEldestRequestReady(q,first,mother)||mourningActive())return;
  const key=`${S.gen}:${q.id}:${first.id}`,state=S.flags.queenEldestRequest;
  const same=state?.key===key?state:null;
  if(same?.status==='pending'||same?.status==='granted'||same?.asks>=2)return;
  if(same&&S.turn-same.turn<24)return;
  if(S.turn-first.born<2)return;
  if(!chance(same?.asks?.08:.3))return;
  S.flags.queenEldestRequest={key,status:'pending',turn:S.turn,asks:(same?.asks||0)+1};
  pushEv(queenEldestRequestEvent(q,first,mother,key));
}
function queenEldestRequestEvent(q,first,mother,key){
  const gen=S.gen,state=()=>S.flags.queenEldestRequest;
  const valid=()=>S.gen===gen&&state()?.key===key&&state().status==='pending'&&queenEldestRequestReady(q,first,mother);
  const again=state()?.asks>1;
  const lowly=mother.rank<5?`${cName(mother)}位分尚浅，`:'';
  const text=`${fullName(q)}${again?'又一次':''}来到乾清宫，开门见山：“${again?'臣妾上回提过的事，想了这些日子，仍觉得该再说一次。':''}皇长子${kidName(first)}是陛下的长子，${lowly}依祖宗规矩，交由中宫教养，名分最正。臣妾必当视如己出，不叫陛下操心。”\n她说得笃定，帕子却在指间绞了又绞。中宫膝下没有皇子，这几年的嫡长之议，压在她身上比旁人以为的重。`;
  const finish=status=>{const s=state();if(s)Object.assign(s,{status,turn:S.turn});};
  return {title:'中宫请养 · 皇长子',por:q,present:[q,mother,first],valid,text,choices:[
    {t:`准皇后抚养${first.name}`,f:()=>{
      if(!valid())return null;finish('granted');
      story(mother,`【中宫请养】皇后求养皇长子${kidName(first)}，陛下准了。`);
      return doFoster(first,q);
    }},
    {t:'皇长子仍由生母抚养',f:()=>{
      if(!valid())return null;finish('declined');
      relAdd(q,mother,-8);
      setXin(q,['善妒','骄矜'].includes(q.trait)?'嫉恨':'委屈',`求养皇长子${first.name}未准`,mother.id);
      setXin(mother,'感激',`皇长子${first.name}仍留在身边`);
      story(q,`【中宫请养】求养皇长子${kidName(first)}，陛下没有答应。她面上不显，回宫后把备好的小衣裳收进了箱底。`);
      story(mother,`【中宫请养】皇后求养皇长子${kidName(first)}，陛下仍让孩子留在她身边。她松了口气，也知道往后在坤宁宫请安更要谨慎。`);
      return `皇后行礼告退，没有再争。${fx(cchg(q,{mood:-8,aff:-3}),cchg(mother,{mood:6,aff:3}))}`;
    }},
    {t:'孩子尚小，过两年再议',f:()=>{
      if(!valid())return null;finish('deferred');
      story(q,`【中宫请养】求养皇长子${kidName(first)}，陛下说孩子尚小，过两年再议。`);
      return `“臣妾等得起。”皇后这样说，语气却比来时淡了。${fx(cchg(q,{mood:-3}))}`;
    }}]};
}

// Taking in the eldest prince is relief rather than plain joy for a queen without a son.
const earlierHeirHopesFoster=doFoster;
doFoster=function(k,c,options={}){
  const q=heirHopesActive()?empress():null,first=q&&eldestPrince();
  const relief=!!(q&&c===q&&first&&k===first&&!livingOwnSon(q)&&k.foster!==q.id);
  const result=earlierHeirHopesFoster(k,c,options);
  if(!relief||result===null||k.foster!==q.id)return result;
  setXin(q,'释然',`皇长子${k.name}交由中宫教养，压在心上的嫡长之议终于放下`);
  story(q,`【中宫释怀】皇长子${kidName(k)}交由她教养。这些年压在心上的嫡长之议，像是一下子卸了下来；她抱着孩子坐了许久，才发觉自己一直攥着的手松开了。`);
  const ease=cchg(q,{mood:8});
  log(`皇后${fullName(q)}得以教养皇长子${kidName(k)}，如释重负。`,1);
  return `${result}\n皇后长长舒了一口气，像是放下了压了多年的担子。${ease?fx(ease):''}`;
};

// Senior consorts who have had no children, and above all a queen without a son, grow anxious.
function childlessAnxious(c){
  if(!inPalace(c)||c.maid||c.preg||c.age<18||c.rank<HEIR_HOPES_SENIOR_RANK)return false;
  if(c.rank===8)return !livingOwnSon(c)&&S.turn-(c.enteredAt??0)>=24;
  return !livingOwnChild(c)&&S.turn-(c.enteredAt??0)>=24;
}
function childlessAnxietyLine(c){
  const queen=c.rank===8,raising=raisingChild(c);
  if(queen&&raising)return '她把养在身边的孩子照料得无微不至，夜深时却仍会想：若是自己亲生的皇子，宫里那些目光会不会少些？';
  if(queen)return '入主中宫已有几年，膝下仍没有皇子。每逢请安，命妇们提起嫡子的话，她都笑着接过去，回宫后却对着灯坐到很晚。';
  if(isSolitary(c)||c.trait==='淡泊')return '她原以为自己不在意子嗣，可听见别宫传来孩子的笑声，手里的书半晌没有翻页。';
  if(['善妒','骄矜','骄纵','城府'].includes(c.trait))return `位至${RANKS[c.rank]}，却至今没有一儿半女。她数着宫里各人的孩子，越数越不甘心。`;
  return `位至${RANKS[c.rank]}，入宫多年仍无子嗣。她悄悄让宫女去护国寺添了一回香油，又怕旁人知道。`;
}
function childlessAnxietyMonth(){
  const flags=S.flags.childlessAnxiety||={};
  for(const c of harem()){
    if(!childlessAnxious(c)||S.turn-(flags[c.id]??-99)<12)continue;
    if(!chance(c.rank===8?.12:.06))continue;
    flags[c.id]=S.turn;
    if(!['悲恸','心如死灰','怨恨'].includes(xinOf(c)))setXin(c,'忧心',c.rank===8?'中宫膝下仍无皇子':'入宫多年，膝下犹虚');
    story(c,`【子嗣心事】${childlessAnxietyLine(c)}`);
    cchg(c,{mood:-4});
  }
}
// Another consort's pregnancy news weighs on those still waiting.
function pregnancyEnvy(mother){
  if(!heirHopesActive()||!mother)return '';
  const flags=S.flags.pregnancyEnvy||={};
  const people=harem().filter(c=>c!==mother&&childlessAnxious(c)&&flags[`${c.id}:${mother.id}:${mother.pregnancyCalendar?.conceived??S.turn}`]==null)
    .sort((a,b)=>b.rank-a.rank||a.id-b.id).slice(0,2);
  const lines=[];
  for(const c of people){
    flags[`${c.id}:${mother.id}:${mother.pregnancyCalendar?.conceived??S.turn}`]=S.turn;
    const jealous=!!TRAITS[c.trait]?.jealous||c.trait==='城府';
    const sister=sameFather(c,mother);
    const text=c.rank===8?`听说${fullName(mother)}有孕，她依礼赏下安胎的补品，回宫后却独自坐了很久。中宫至今没有皇子，旁人的喜讯听在耳里，像是又被提醒了一回。`:
      sister?`听说姐妹${fullName(mother)}有孕，她替姐妹欢喜，也忍不住想起自己入宫多年仍无消息，夜里翻来覆去睡不着。`:
      jealous?`听说${fullName(mother)}有孕，她当着人笑着道喜，回宫就摔了一只茶盏。`:
      `听说${fullName(mother)}有孕，她道了喜，回宫后却没什么胃口，宫女劝了两回才用了半碗粥。`;
    story(c,`【闻喜心事】${text}`);
    if(!['悲恸','心如死灰','怨恨'].includes(xinOf(c)))setXin(c,jealous&&!sister?'嫉恨':'忧心',`听闻${fullName(mother)}有孕`,jealous&&!sister?mother.id:null);
    const delta=cchg(c,{mood:jealous?-8:-5});
    if(jealous&&!sister)relAdd(c,mother,-4);
    lines.push(`${cName(c)}闻讯心绪低落${delta?'（'+delta.split('：')[1]+'）':''}`);
  }
  return lines.length?`\n§${lines.join('；')}`:'';
}
const earlierHeirHopesPregEvent=pregEvent;
pregEvent=function(c){
  const ev=earlierHeirHopesPregEvent(c);
  if(!ev||!heirHopesActive()||c.maid)return ev;
  ev.choices=ev.choices.map(choice=>choice.f?{...choice,f:(...args)=>{
    const result=choice.f(...args);
    if(result===null)return result;
    const envy=pregnancyEnvy(c);
    return typeof result==='string'?result+envy:result;
  }}:choice);
  return ev;
};
function heirHopesMonth(){
  if(!heirHopesActive()||S.over||mourningActive())return;
  childlessAnxietyMonth();
}
