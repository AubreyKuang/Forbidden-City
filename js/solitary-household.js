/* A need for quiet is a response to the household, not automatic dislike. */
function solitaryHousehold(c){
 if(!isSolitary(c)||!inPalace(c)||!PALACES.includes(c.palace))return null;
 const people=palaceResidents(c.palace),children=nurseryChildren(c.palace),young=children.filter(k=>kidAge(k)<2);
 const crowded=people.length>=3,childNoise=children.length>=2;
 if(!crowded&&!childNoise)return null;
 const own=children.filter(k=>youngChildMother(k)?.id===c.id);
 const reason=childNoise?`同宫有${children.length}个幼儿，${young.length?'夜里婴啼与照护走动时常传来':'廊下嬉闹声与照护走动时常传来'}`:`同宫住着${people.length}位妃嫔，问安、传话与日常走动接连不断`;
 return {palace:c.palace,reason,children:children.map(k=>k.id),own:own.map(k=>k.id),people:people.map(p=>p.id)};
}
function solitaryNoiseActive(c){return !!solitaryHousehold(c)&&!(c.quietHousehold?.palace===c.palace&&c.quietHousehold.quietUntil>S.turn);}
function solitaryHouseholdTick(c){
 if(!c?.alive||c.gone)return;
 const env=solitaryHousehold(c),old=c.quietHousehold;
 if(old?.disturbed&&(!env||old.palace!==c.palace||old.quietUntil>S.turn)){
  old.disturbed=false;
  const text=old.palace!==c.palace?`迁离${old.palace}后，不必再听原来廊下接连的声响。她先把书案安置好，心里松了一些。`:old.quietUntil>S.turn?'同住的人商量好安静时辰，将热闹活动另择时间。孩子仍照常被照顾，她也终于能独坐片刻。':'同宫起居渐静，她又能在窗下读完一页书。先前的烦闷随之缓了些，并未记作谁的过错。';
  story(c,`【居处心绪】${text}`);if(xinOf(c)==='清静被扰')setXin(c,'释然','居处的作息有了调整');
 }
 if(!env||!solitaryNoiseActive(c)||!cohabAvailable(c))return;
 if(old?.palace===c.palace&&old.disturbed&&S.turn-old.last<6)return;
 c.quietHousehold={...old,palace:c.palace,last:S.turn,disturbed:true,reason:env.reason};
 const text=`${env.reason}，她数次掩卷，觉得一整日都没有独处的空隙。${env.own.length?'亲生或养在膝下的孩子唤她时，她仍放轻声音应着；待孩子安顿好，才承认自己也会疲惫。':'她没有责怪孩子或同住的人，只请宫人先替她回绝不必要的闲访。'}守礼并不意味着她不觉烦闷。`;
 story(c,`【居处心绪】${text}`);cchg(c,{mood:-3});setXin(c,'清静被扰',env.reason);
 NPCMemory.record(S,{type:'solitary-household',time:S.turn,location:c.palace,participants:[c.id],outcome:text},[{person:c.id,subject:c.palace,interpretation:text,emotion:-.35,impact:50}]);
}
function solitaryHouseholdVoice(c){
 if(!solitaryNoiseActive(c)||!c.quietHousehold?.disturbed)return null;
 const env=solitaryHousehold(c);
 return voiceLine('solitary-household','廊下又响起脚步，她把读到一半的书合上，等声音过去。',env.own.length?'孩子来找臣妾，臣妾总舍不得推开。可哄睡之后，也想有半晌不必应门的清静。疼孩子与想独处，并不相碍。':env.children.length>=2?'孩子年幼，哭闹自有缘由，臣妾不怪他们。只是日夜听着，心也难静；可否把嬉闹的地方与读书歇息的地方分开些？':'一日接着一日问安传话，臣妾便觉心里拥挤。不是与谁有怨，只是不愿每个空隙都拿来应酬。');
}
function solitaryQuietEvent(c){
 if(!cohabAvailable(c)||!solitaryNoiseActive(c)||S.turn-(c.quietHousehold?.answered??-99)<3)return null;
 const env=solitaryHousehold(c);let done=false;
 const valid=()=>!done&&cohabAvailable(c)&&c.palace===env.palace&&solitaryNoiseActive(c);
 const finish=respect=>{if(!valid()||!useE())return null;done=true;
  c.quietHousehold={...c.quietHousehold,palace:c.palace,answered:S.turn};
  const text=respect?'陛下请同宫各人商量安静时辰，闲访先通传、嬉闹另择地方；孩子哭病时仍先照顾，不以清静为由责罚乳母或孩子。她道：“臣妾求的就是这点余地。”':'陛下劝她习惯热闹。她仍依礼应下，却轻声说明：应付得来，并不意味着心里不累。';
  if(respect){c.quietHousehold.quietUntil=S.turn+3;solitaryHouseholdTick(c);}cchg(c,{aff:respect?4:-2,mood:respect?5:-3});story(c,`【留一段清静】${text}`);save('auto');return text;
 };
 return {title:'留一段清静',randomOriginCast:[c],por:c,present:[c],valid,onQueue:()=>solitaryHouseholdTick(c),text:`${env.reason}。她将书放下：“礼数臣妾都能尽，只是想有一段无人催着开口的时辰。”${env.own.length?'说话间，她仍替自己身边的孩子理好衣领。':''}`,choices:[{t:'协调作息，给她独处的时辰 · 精力−1',cond:()=>E().energy>0,f:()=>finish(true)},{t:'劝她习惯热闹 · 精力−1',cond:()=>E().energy>0,f:()=>finish(false)},{t:'再看看各宫安排',f:()=>{A.openResidence(c.id);return null;}}]};
}
A.quietHousehold=function(id){if(!modalOpen)pushEv(solitaryQuietEvent(byId(id)));};
function travelerQuietPair(person){
 const people=harem().filter(cohabAvailable);
 for(const quiet of people.filter(c=>isSolitary(c)&&(!person||c===person)))for(const traveler of people){
  const identity=timeTravelerIdentity(traveler);
  if(traveler===quiet||!identity||identity.closed||identity.pending||traveler.palace!==quiet.palace||relGet(quiet,traveler)<-20)continue;
  const key=cohabKey(quiet,traveler),old=S.flags.travelerQuiet?.[key];
  if(S.turn-(old?.turn??-99)>=6)return {quiet,traveler,key};
 }return null;
}
function travelerQuietEvent(person){
 const pair=travelerQuietPair(person);if(!pair)return null;
 const {quiet:q,traveler:t,key}=pair;let done=false;
 const valid=()=>!done&&travelerQuietPair(q)?.key===key;
 const line=`${fullName(t)}见${fullName(q)}把座椅移到人少的一侧，压低声音笑道：“${t.timeTraveler.century===22?'我从前读过的旧书里':'我从前听过'}，有人把偏爱独处的人叫作‘i 人’。你倒有几分像。”\n${fullName(q)}抬眼：“爱独坐不假。可喜欢谁、厌烦什么，总得一件件看，莫拿一个字替我全说了。”\n她们说的不是诊病，也不是亲疏的定论。你在廊下恰好听见这几句话。`;
 const finish=kind=>{if(!valid())return null;done=true;(S.flags.travelerQuiet||={})[key]={turn:S.turn,kind};
  const reply=kind==='ask'?`${fullName(t)}解释：“只是旧时一种玩笑说法，说有人独处时更自在，并不是孤僻或不喜欢别人。”${fullName(q)}答：“如此说来，给各人留一段清静便好。”`:kind==='tease'?`陛下拿这个词逗趣，要${fullName(q)}多去凑热闹。她依礼起身：“臣妾并非听不懂玩笑，只是不愿每回独坐都要向人解释。”${fullName(t)}也收住笑，承认自己不该随意给人定名。`:`陛下没有打断，两人说完便各自看书。听懂一个新词，并不使她们立即成为密友。`;
  for(const [c,o] of [[q,t],[t,q]]){const text=`【廊下新词】${line.replaceAll('\n','')}${reply}`;story(c,text);c.neighborWord={turn:S.turn,other:o.id,kind};NPCMemory.record(S,{type:'traveler-quiet',time:S.turn,location:c.palace,participants:[q.id,t.id],outcome:text},[{person:c.id,subject:o.id,interpretation:text,emotion:kind==='tease'?-.25:.25,impact:55}]);}
  cchg(q,{mood:kind==='tease'?-4:2,aff:kind==='tease'?-3:1});save('auto');return reply;
 };
 return {title:'廊下的新词',randomOriginCast:[q,t],cast:[q,t],present:[q,t],valid,text:line,choices:[{t:'问问这个词是什么意思',f:()=>finish('ask')},{t:'听她们说完，不打扰',f:()=>finish('listen')},{t:'拿这个词逗她，劝她多凑热闹',f:()=>finish('tease')}]};
}
A.neighborWord=function(id){if(!modalOpen)pushEv(travelerQuietEvent(byId(id)));};
HAREM.push(function householdQuietEncounter(){
 if(S.turn-(S.flags.lastQuietWord??-99)<6||!chance(.2))return null;
 const ev=travelerQuietEvent();if(ev)ev.onQueue=()=>{S.flags.lastQuietWord=S.turn;};return ev;
});
