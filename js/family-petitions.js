/* Voluntary foster petitions and maternal relatives' arrival. No child is reassigned by a roll. */
function childNeedsMother(k){
  if(!childInPalace(k)||k.pendingName||kidAge(k)>=6||k.id===S.heir)return false;
  const m=byId(k.mom),f=fosterOf(k);
  // A temporary temple visit is not abandonment by either mother.
  if(!m||(m.alive&&!m.cold&&!m.gone))return false;
  return !f||!f.alive||f.cold||f.gone;
}
function motherOriginalRank(k){const m=byId(k.mom);return Math.max(m?.rank??0,k.birthTraits?.mother?.rank??0);}
function fosterPetitionReason(c){
  if(familyScenesEnabled()&&(!c||c.rank<3))return null;
  if(!inPalace(c)||c.maid||c.age<20||c.preg||(c.delivery&&!c.delivery.settled)||c.hp<20||
    S.children.some(k=>k.alive&&(k.mom===c.id||k.foster===c.id)))return null;
  const years=Number.isFinite(c.enteredAt)?S.turn-c.enteredAt:0;
  if(c.trait==='体弱'&&c.hp<65&&c.rank>=3&&c.favor>=35&&years>=24&&c.lastBirth<0&&!S.children.some(k=>k.mom===c.id))return 'frail-wish';
  if(c.hp<40)return null;
  if(c.rank>=3&&c.favor>=70&&years>=24&&(c.nights||0)>=8&&c.lastBirth<0&&!S.children.some(k=>k.mom===c.id))return 'long-wait';
  if(c.age>=30&&c.rank>=4&&c.favor>=45&&(c.fam.p>=25||c.favor>=70))return 'empty-household';
  return null;
}
function fosterPetitioner(c){return !!fosterPetitionReason(c);}
function fosterPetitionMatch(c,k){
  const reason=fosterPetitionReason(c),m=byId(k?.mom),f=k&&fosterOf(k);
  if(journalContentVersion()>=44&&f?.alive&&f.cold)return false;
  if(!reason||!m||m===c||!childInPalace(k)||k.pendingName||kidAge(k)>=6||k.id===S.heir||
    motherOriginalRank(k)>=5||c.rank<=motherOriginalRank(k)||(f?.alive&&!f.cold&&!f.gone))return false;
  return childNeedsMother(k)||(['long-wait','frail-wish'].includes(reason)&&inPalace(m));
}
function fosterWishWords(c,k){
  if(fosterPetitionReason(c)==='frail-wish')return `臣妾身子弱，入宫这些年一直未能有孕。病榻边总太静，若能照看${k.name}，也想慢慢学着做母亲。可臣妾知道，不能为了自己的心愿让孩子受累；乳母、医者和生母的意思，都该先安排妥当。`;
  if(isSolitary(c))return `臣妾不惯与人热闹，却愿给${k.name}留一处灯下的位置。喜欢独坐，也并非不想有人亲近。`;
  if(['骄纵','骄矜','善妒'].includes(c.trait))return `宫里总拿有无孩子说事，臣妾也有不甘。可${k.name}若来了，总要一日一日好好养，不能只在人前争这一口气。`;
  if(c.trait==='城府')return `臣妾知道养育也牵着将来的倚仗，但不敢只求一个名分。${k.name}的起居与教养，臣妾愿实实在在担起来。`;
  if(['才女','聪慧','好学'].includes(c.trait))return `想教${k.name}识字，也想听孩子问些书上没有的问题。臣妾愿慢慢学着照料，不敢说有几本书便会做母亲。`;
  if(['将门','爽直'].includes(c.trait))return `臣妾想照看${k.name}，不绕弯子。孩子原来的亲缘不能抹去，该担的照护，臣妾也不会只说不做。`;
  if(c.trait==='痴情')return `臣妾曾盼着与陛下有自己的孩子。如今念着${k.name}，也愿把这份心意放进每日照料里，不是拿孩子去换恩宠。`;
  if(c.trait==='体弱')return `臣妾身子弱些，若照料${k.name}，会先把乳母、起居安排妥当，不肯为了自己的心愿逞强。`;
  return `臣妾想在${k.name}睡前留一盏灯，病了有人守着，长大时有人听他说话。孩子若不习惯，也愿慢慢等。`;
}
function fosterPetitionText(c,k){
  const m=byId(k.mom),reason=fosterPetitionReason(c),past=S.children.some(x=>x.mom===c.id);
  const opening=reason==='frail-wish'?`${cName(c)}缠绵病榻，入宫已有${Math.floor((S.turn-c.enteredAt)/12)}年，未曾生育。今日握着你的手，提起想要一个孩子，也想请养${k.name}。${c.hp<40?'医者认为她眼下尚不能承担日常照料，应先调养，再议请养。':''}`:reason==='long-wait'?`${cName(c)}入宫已${Math.floor((S.turn-c.enteredAt)/12)}年，常获召见，却一直未曾生育。她今日提起的，是${k.name}。`:
    `${cName(c)}已${c.age}岁，${past?'如今膝下无人相伴':'膝下无子'}，今日私下求见。`;
  const care=childNeedsMother(k)?`她知道孩子有乳母照料，只是${!m.alive?'生母已不在了':'生母眼下不能亲自照看'}，希望自己承担长久照护。`:
    `${fullName(m)}仍在亲自抚养孩子。她提出的是请养之愿，并非孩子无人照顾；若更换养母，生母与孩子的感受也须听见。`;
  return `${opening}\n“${fosterWishWords(c,k)}”\n${relGet(c,k)>=25?`她也记得与${k.name}已有的来往，并非随意指一个孩子。\n`:''}${care}`;
}
function maternalKinMatch(c,k){
  // Direct adoption still requires an empty place; discussing care does not.
  return maternalKinCanAsk(c,k)&&!maternalCaregiver(k);
}
function maternalKinCareEvent(m,only=null,manual=false){
 if(!maternalAbsent(m)||S.over)return null;
 const candidates=harem().filter(c=>(!only||c===only)&&!c.kinArrival?.pending&&S.children.some(k=>k.mom===m.id&&maternalKinCanAsk(c,k))&&
   (!c.maternalKinRequests?.[m.id]||manual&&['deferred','pending'].includes(c.maternalKinRequests[m.id].status)))
   .sort((a,b)=>Number(b.kin?.[m.id]?.startsWith('亲'))-Number(a.kin?.[m.id]?.startsWith('亲'))||relGet(b,m)-relGet(a,m)||a.id-b.id);
 const c=candidates[0];if(!c)return null;
 const children=S.children.filter(k=>k.mom===m.id&&maternalKinCanAsk(c,k)),names=children.map(k=>k.name).join('、');let done=false;
 const placement=maternalCareSnapshot(children),cared=children.some(maternalCaregiver);
 const valid=()=>!done&&maternalAbsent(m)&&maternalCareUnchanged(c,children,placement);
 const record=text=>maternalCareRecord(c,m,children,text);
 const setStatus=status=>{(c.maternalKinRequests||={})[m.id]={status,turn:S.turn,children:children.map(k=>k.id)};};
 return {title:'姐妹留下的孩子',por:c,cast:children,present:[c],valid,
  onShow:()=>{if(c.maternalKinRequests?.[m.id]?.status==='pending')return;setStatus('pending');children.forEach(k=>{k.maternalKinAsked=true;});record(`${fullName(c)}听闻姐妹${fullName(m)}${maternalAbsenceText(m)}，主动请求照看${names}，保留孩子的生母身份与原有亲缘。`);},
  text:`${fullName(m)}${maternalAbsenceText(m)}后，${fullName(c)}特地来谈${names}的安置。\n${c.clan===S.flags.dowager?.clan?'她们同出太后母家，这份姐妹亲缘并没有因入宫而断。\n':''}“${isRival(c,m)?'我与她从前有过不和，但孩子不该独自受这些事。':''}她留下的孩子，臣妾想亲自照看。乳母与太医仍照常留着；臣妾${raisesKid(c)?'已有抚养孩子的日子，也会把他们的起居一同安排妥当':'愿从每日的起居慢慢学起'}。宗谱上仍记她是生母。”${cared?'\n'+maternalPlacementText(children)+'\n“已有养母尽心照顾，臣妾记得这份情。愿先听她的意思，再谈如何陪伴孩子。”':''}`,
  choices:[{t:cared?'请养母一同商议照料':`准她照料${names}`,cond:()=>!cared||maternalCaregiversPresent(children),why:'请等原养母回宫后再一同商议',f:()=>{if(!valid())return null;
   if(cared){if(maternalCaregiversPresent(children))pushNow(maternalCareDiscussion(c,m,children));return null;}
   const results=children.map(k=>petitionFoster(k,c,true)).filter(Boolean);if(!results.length)return null;done=true;setStatus('accepted');
   const t=`${fullName(c)}获准照料${fullName(m)}留下的${names}；生母身份保留，乳母与太医协助起居。`;record(t);save('auto');return t+'\n'+results.join('\n');}},
  {t:cared?'维持原安排，改日再谈':'暂由乳母照看，改日再谈',f:()=>{if(!valid())return null;done=true;setStatus('deferred');const t=`${fullName(c)}请求照看${names}，陛下暂缓定夺；${cared?'孩子仍按原有安排照料':'孩子仍由乳母照料'}，可到她的档案继续商议。`;record(t);save('auto');return t;}},
  {t:cared?'维持原安排，不另定照料':'另择抚养人选',f:()=>{if(!valid())return null;done=true;setStatus('declined');const t=`陛下听取${fullName(c)}照看${names}的请求，决定${cared?'维持原有安排':'另择抚养人'}；此时尚未更换养母。`;record(t);save('auto');if(!cared)pushNow(fosterOffer(children.find(k=>maternalKinMatch(c,k)),t));return cared?t:null;}}]};
}
function pendingMaternalKinCare(){
 return S.consorts.filter(maternalAbsent).map(m=>maternalKinCareEvent(m)).find(Boolean)||null;
}
A.maternalKinCare=function(id,mother){if(modalOpen)return;const c=byId(id),m=byId(mother);if(!c||!m)return;const ev=maternalKinCareEvent(m,c,true);if(ev)pushEv(ev);};
function maternalKinCareButton(c){
 return S.consorts.filter(m=>!m.alive&&maternalKinCareEvent(m,c,true)).map(m=>`<button class="btn sm jade" onclick="A.maternalKinCare(${c.id},${m.id})">谈谈照看${esc(fullName(m))}的孩子</button>`).join('');
}
function petitionFoster(k,c,kin=false,consensual=false){
  if(S.over||c.hp<40||!(kin?maternalKinMatch(c,k):fosterPetitionMatch(c,k)))return null;
  const m=byId(k.mom);
  if(consensual&&!motherAcceptsFoster(c,k))return null;
  const text=doFoster(k,c,{maternalKin:kin,consensual});
  if(consensual){k.visitRule='open';kstory(k,`生母与${fullName(c)}商议后安排抚养，准生母照常探望，宗谱仍保留生母。`);}
  NPCMemory.record(S,{type:'family-care',time:S.turn,participants:[c.id,k.id,...(m?.alive?[m.id]:[])],outcome:`${fullName(c)}获准抚养${k.name}。`},[
    {person:c.id,subject:k.id,interpretation:kin?'我请求照顾姐妹留下的孩子，陛下准了。':'膝下无子的我请求照顾这个孩子，陛下准了。',emotion:.85,impact:90},
    {person:k.id,subject:c.id,interpretation:`由${fullName(c)}承担日常抚养，生母仍是${k.momName}。`,emotion:.5,impact:90},
    ...(m?.alive?[{person:m.id,subject:c.id,interpretation:kin?'我的姐妹获准照看孩子，虽不能亲自养育，心中略有安慰。':consensual?'我与她商议了抚养安排，仍能照常探望孩子。':inPalace(m)?'我仍想亲自照看孩子，却奉旨将孩子交给另一位妃嫔。':'我不能亲自照看孩子，孩子被交给别的妃嫔抚养。',emotion:kin||consensual?.4:-.6,impact:90}]:[])
  ]);save('auto');return text;
}
function fosterPetitionPairs(only=null){
  if(S.over||mourningActive()||S.turn-(S.flags.lastFosterPetition??-99)<24)return [];
  return harem().filter(c=>(!only||c===only)&&S.turn-(c.lastFosterPetition??-99)>=36).flatMap(c=>S.children.filter(k=>fosterPetitionMatch(c,k)&&S.turn-(k.lastFosterPetition??-99)>=24).map(k=>({c,k})));
}
function fosterPetitionEvent(only=null){
  const pairs=fosterPetitionPairs(only);
  if(!pairs.length||(!only&&!chance(.08)))return null;
  const {c,k}=pick(pairs),m=byId(k.mom);
  return {title:fosterPetitionReason(c)==='frail-wish'?'病榻心愿':'愿留一盏灯',por:c,cast:[k],present:[c],cooldown:24,valid:()=>fosterPetitionMatch(c,k),
    onQueue:()=>{S.flags.lastFosterPetition=c.lastFosterPetition=k.lastFosterPetition=S.turn;story(c,`【请养之愿】${fosterPetitionText(c,k)}`);},
    text:fosterPetitionText(c,k),choices:[
      c.hp<40?{t:'先调养身体，保留请养心愿',f:()=>{story(c,`病中请求抚养${k.name}，陛下先安排调养，孩子暂不迁居，待身体允许再议。`);return '乳母仍照原有安排照看孩子；她的愿望被认真听见，也没有匆忙更换养育。';}}:childNeedsMother(k)?{t:`准她抚养${k.name}`,f:()=>petitionFoster(k,c)}:{t:'先听生母的意思，再定抚养',f:()=>{if(fosterPetitionMatch(c,k)){const ev=fosterMotherDiscussion(c,k);if(ev.valid()){ev.onQueue();pushNow(ev);}}return null;}},
      {t:childNeedsMother(k)?'暂由乳母照看，此事缓议':'维持原有抚养，此事缓议',f:()=>{story(c,`请求抚养${k.name}，陛下暂缓定夺。`);save('auto');return childNeedsMother(k)?'孩子仍由原处的乳母照护，没有更换养母。':`孩子仍随生母${fullName(m)}生活，由乳母协助照护，没有更换养母。`;}},
      {t:'婉言不允',f:()=>{story(c,`请求抚养${k.name}，未获允准。`);remember(c,'family-care','请养孩子未获准，心中失落。');save('auto');return fx(cchg(c,{mood:-5}));}}]};
}
function motherAcceptsFoster(c,k){
  const m=byId(k.mom);
  return inPalace(m)&&relGet(m,c)>=55&&(m.hp<55||S.children.filter(x=>x.alive&&(x.foster||x.mom)===m.id&&kidAge(x)<6).length>=3);
}
function fosterMotherDiscussion(c,k){
  const m=byId(k.mom),agrees=motherAcceptsFoster(c,k);
  const voice=agrees?`“臣妾眼下确实有些照顾不周，与${fullName(c)}也信得过。若让我照常看望，孩子慢慢适应，臣妾愿商量。”`:
    isSolitary(m)?`“臣妾与旁人疏淡，却不舍${k.name}。这孩子在臣妾膝前时，是不一样的。请让我们仍在一处。”`:
    `“臣妾知道她盼孩子，可${k.name}也是臣妾放不下的人。臣妾仍想亲自养着，请陛下成全。”`;
  const valid=()=>fosterPetitionMatch(c,k)&&inPalace(m);
  return {title:'生母的心意',por:m,cast:[c,k],present:[m,c],valid,
    onQueue:()=>{story(m,`【请养之议】${fullName(c)}请求抚养${k.name}。${voice}`);story(c,`【生母回应】${fullName(m)}谈到${k.name}：${voice}`);},
    text:`你请${fullName(m)}说出自己的意思，并未因请养者得宠就立刻抱走孩子。\n${voice}\n孩子的生母身份始终保留。`,choices:[
      {t:agrees?'按所议安排抚养，准生母探望':'仍旨令交予她抚养',f:()=>valid()?petitionFoster(k,c,false,agrees):null},
      {t:'留在生母身边，日后慢慢往来',f:()=>{if(!valid())return null;const text=`${k.name}仍随生母${fullName(m)}生活；陛下没有因请养者得宠而立即改变抚养。日后往来仍由双方商量。`;story(c,text);story(m,text);kstory(k,text);remember(c,'family-care',text);save('auto');return text;}},
      {t:'暂缓定夺',f:()=>{if(!valid())return null;story(c,`听取${fullName(m)}的意思后，抚养${k.name}之议暂缓。`);save('auto');return '原有照护安排不变。';}}]};
}
function coldPetitionEpisode(m,months){
  const episode=m?.childDisgrace;
  return m?.alive&&!m.gone&&m.cold&&episode?.active&&S.turn-episode.turn>=months?episode:null;
}
function coldFosterPetitioner(c,k){
  return inPalace(c)&&!c.maid&&c.rank>=2&&c.hp>=40&&c.id!==k.mom&&
    !S.children.some(other=>other.alive&&(other.mom===c.id||other.foster===c.id));
}
function coldFosterPetitionEvent(){
  if(journalContentVersion()<44||S.over||mourningActive())return null;
  const offers=[];
  for(const k of S.children){
    if(!k.foster||!childInPalace(k)||k.pendingName||kidAge(k)>=14)continue;
    const old=fosterOf(k),episode=coldPetitionEpisode(old,2);
    if(!episode||episode.fosterPetitions?.[k.id])continue;
    const c=harem().filter(c=>coldFosterPetitioner(c,k)).sort((a,b)=>relGet(b,k)-relGet(a,k))[0];
    if(c)offers.push({k,c,old,episode});
  }
  if(!offers.length||!chance(.22))return null;
  const {k,c,old,episode}=pick(offers);
  let done=false;
  const valid=()=>!done&&!S.over&&!mourningActive()&&coldPetitionEpisode(old,2)===episode&&
    k.foster===old.id&&childInPalace(k)&&!k.pendingName&&kidAge(k)<14&&coldFosterPetitioner(c,k);
  const title='请养 · 冷宫之后';
  return {title,por:c,cast:[k,old],present:[c],valid,
    onShow:()=>{(episode.fosterPetitions||={})[k.id]=true;story(c,`【${title}】她得知${fullName(old)}入冷宫已过两个月，请求亲自照看${k.name}。`);},
    text:`${fullName(old)}入冷宫已满两个月，${k.name}的起居暂由宫人照料。${fullName(c)}膝下没有孩子，这日道：“臣妾愿接手照料。乳母和孩子熟悉的物件仍可留着，等孩子慢慢住惯。”`,
    choices:[
      {t:`准她接手抚养${k.name}`,f:()=>{if(!valid())return null;done=true;return doFoster(k,c);}},
      {t:'仍由乳母和随侍照料',f:()=>{if(!valid())return null;done=true;story(c,`【${title}】她的请养未获允准，孩子仍按眼下的安排照料。`);return `乳母和随侍继续照看${k.name}，抚养关系照旧。`;}}
    ]};
}
function coldFriendPetitionEvent(){
  if(journalContentVersion()<44||S.over||mourningActive())return null;
  const offers=[];
  for(const fallen of S.consorts){
    const episode=coldPetitionEpisode(fallen,1);
    if(!episode||episode.friendPetition)continue;
    const c=harem().filter(c=>!c.maid&&inPalace(c)&&c.hp>=40&&relGet(c,fallen)>=40&&!isRival(c,fallen))
      .sort((a,b)=>relGet(b,fallen)-relGet(a,fallen))[0];
    if(c)offers.push({fallen,c,episode});
  }
  if(!offers.length||!chance(.07))return null;
  const {fallen,c,episode}=pick(offers);
  const title='为冷宫旧友求情';
  let done=false;
  const valid=()=>!done&&!S.over&&!mourningActive()&&coldPetitionEpisode(fallen,1)===episode&&
    inPalace(c)&&c.hp>=40&&relGet(c,fallen)>=40&&!isRival(c,fallen);
  const finish=mode=>{
    if(!valid())return null;
    done=true;
    const text=mode==='release'?`${fullName(c)}为${fullName(fallen)}陈情。陛下准她出冷宫，以官女子身份安置。`:
      mode==='supplies'?`陛下准${fullName(c)}托宫人送衣食给${fullName(fallen)}，原处分照旧。`:
        `${fullName(c)}为${fullName(fallen)}陈情，陛下听完后维持原处分。`;
    if(mode==='release'){fallen.rank=0;A.uncold(fallen.id);}
    if(mode==='supplies'){fallen.mood=clamp(fallen.mood+5);relAdd(c,fallen,4);}
    livedRecord(mode==='decline'?[c]:[c,fallen],'bond',title,`cold-friend:${S.gen}:${fallen.id}:${episode.turn}`,`【${title}】${text}`);
    return text;
  };
  const guilty=fallen.discipline?.gen===S.gen&&fallen.discipline.turn===episode.turn&&fallen.discipline.verdict==='guilty';
  return {title,por:c,cast:[fallen],present:[c],valid,onShow:()=>{episode.friendPetition=true;},
    text:`${fullName(c)}求见时带着一包新做的冬衣，提起在冷宫的${fullName(fallen)}。\n“${guilty?'她的过错既已查实，臣妾也盼她认错。':'臣妾未亲见当日的事，只记得从前与她交好。'}可否准人送些衣食？若陛下愿听她陈情，也盼给她一个说话的机会。”`,
    choices:[
      {t:'准人送衣食，原处分照旧',f:()=>finish('supplies')},
      {t:'准她出冷宫，降为官女子',f:()=>finish('release')},
      {t:'听完她的话，维持原处分',f:()=>finish('decline')}
    ]};
}
A.fosterWish=function(id){if(modalOpen)return;const c=byId(id),ev=c&&fosterPetitionEvent(c);if(ev)pushEv(ev);};
function fosterWishButton(c){return maternalSisterArrivalButton(c)+maternalKinCareButton(c)+(fosterPetitionPairs(c).length?`<button class="btn sm" onclick="A.fosterWish(${c.id})">听她谈抚养孩子</button>`:'');}
function kinSuccessionSource(c){
  return c&&!c.familyBranchOrigin&&!c.maid&&c.rank>=5&&c.age>=20&&hasClan(c)&&(!c.alive||c.cold||c.gone)&&!c.kinSuccessor&&!c.maternalArrival;
}
function kinArrivalGreeting(c){
  const a=c?.kinArrival,m=byId(a?.mother);if(!a?.pending||!inPalace(c)||!m)return null;
  const children=S.children.filter(k=>k.mom===m.id&&maternalKinCanAsk(c,k));
  const all=S.children.filter(k=>k.mom===m.id&&k.alive&&!k.pendingName);
  const kin=KIN_TXT[c.kin?.[m.id]]||'姐妹',cared=children.some(maternalCaregiver),placement=maternalCareSnapshot(children);
  const finish=()=>{a.pending=false;save('auto');};
  return {title:'初入宫 · 姐妹旧缘',por:c,cast:children, present:[c],valid:()=>a.pending&&inPalace(c),
    onShow:()=>{if(a.greeted)return;a.greeted=true;maternalCareRecord(c,m,children,`${fullName(c)}初次问安提起${kin}${fullName(m)}${children.length?'，请求照看'+children.map(k=>k.name).join('、'):''}；此时尚未更换抚养安排。`);},
    text:`${fullName(c)}初次在宫中向你问安，没有先提自己的封赏。\n“臣妾今日能来，是家中仍念着${kin}${fullName(m)}的旧缘。${!m.alive?'她已不在，臣妾不敢说能替代她。':'她如今不能在御前说话，臣妾也不敢替她辩解。'}”\n${children.length?`她又轻声道：“${children.map(k=>k.name).join('、')}还小，臣妾想先求一道恩典，照看${kin}的孩子。宗谱上的生母不改，只求让孩子有个亲人在身边。”${cared?'\n'+maternalPlacementText(children)+'\n她知道养母已在照料，仍希望商议共同照看，而不是因此断了来往。':''}`:all.length?'她又问起姐妹的孩子，愿日后保持亲族往来。':'她顿了一顿：“臣妾愿慢慢学宫里的日子，也盼这份家门旧缘还能续下去。”'}`,choices:[
      ...(children.length?[{t:cared?'请养母一同商议照料':`准她照料${children.map(k=>k.name).join('、')}`,cond:()=>!cared||maternalCaregiversPresent(children),why:'请等原养母回宫后再一同商议',f:()=>{
        if(!a.pending||!maternalCareUnchanged(c,children,placement))return null;
        if(cared){if(!maternalCaregiversPresent(children))return null;finish();pushNow(maternalCareDiscussion(c,m,children));return null;}
        const results=children.map(k=>petitionFoster(k,c,true)).filter(Boolean);maternalCareStatus(c,m,children,'accepted');finish();
        return results.length?results.join('\n'):'孩子的照护安排已有变化，此时不再另换养母。';}}]:[]),
      {t:children.length?'先安顿下来，抚养之事暂缓':'让她安心住下',f:()=>{if(!a.pending)return null;story(c,`初见时提起${kin}${fullName(m)}与孩子的旧缘，陛下让她先安心住下。`);if(children.length)maternalCareStatus(c,m,children,'deferred');finish();return '你让她先安顿宫中日常。孩子原有的抚养安排没有改变。';}}]};
}
function pendingKinGreeting(){return S.consorts.map(kinArrivalGreeting).find(Boolean)||null;}
function kinSuccessionEvent(){
  if(S.over||mourningActive()||S.turn-(S.flags.lastKinSuccession??-99)<36)return null;
  const sources=S.consorts.filter(c=>kinSuccessionSource(c)&&!(maternalAbsent(c)&&kinCareChildren(c).length&&maternalSisterCandidates(c).length)&&S.turn-(c.lastKinSuccession??-99)>=48&&
    !harem().some(o=>o.id!==c.id&&o.clan===c.clan&&S.turn-o.enteredAt<24));
  if(!sources.length||!chance(.06)||!newConsortEventAllowed())return null;
  const c=pick(sources),children=kinCareChildren(c);
  return {title:'家门旧缘',por:c,cooldown:36,valid:()=>kinSuccessionSource(c),
    onQueue:()=>{S.flags.lastKinSuccession=c.lastKinSuccession=S.turn;},
    text:`${fullName(c)}${!c.alive?'去世':'离开原来的宫中生活'}之后，娘家递来一封家书，问能否让家中未婚的妹妹或堂妹入宫。\n家中既念旧情，也希望延续宫中的倚仗。${children.length?`信末另提起${children.map(k=>k.name).join('、')}，说孩子年幼，若准亲人入宫，也愿承担照护。`:'至于宫中的孩子与旧有安排，并不因此自动变更。'}\n是否接纳，仍由你决定。`,choices:[
      {t:'准一位成年姐妹入宫，封为贵人',cond:()=>rankCount(3)<RANK_CAP[3],why:'贵人位分已满',f:()=>{
        if(!kinSuccessionSource(c)||rankCount(3)>=RANK_CAP[3])return null;
        const type=chance(.7)?'亲':'堂',g=makeKin(c,type);
        g.age=ri(18,Math.min(26,c.age-1));c.kin[g.id]=type+'妹';g.kin[c.id]=type+'姐';
        delete c.kinRival[g.id];delete g.kinRival[c.id];g.kinNote=`${fullName(c)}的${KIN_TXT[type+'妹']}`;
        g.kinArrival={mother:c.id,pending:true,turn:S.turn};c.kinSuccessor=g.id;
        addConsort(g,3,`因${fullName(c)}的家门旧缘入宫`);
        story(g,`入宫先问起${fullName(c)}及其子女的近况。`);save('auto');pushNow(kinArrivalGreeting(g));return null;
      }},
      {t:'婉拒入宫，由内廷照常安顿孩子',f:()=>{story(c,'娘家请求姐妹入宫续缘，陛下未允。');save('auto');return '家书回覆，眼下不再添新人；孩子原有的乳母与养母仍照常照护。';}}]};
}

function frailFosterVoice(c){return fosterPetitionReason(c)==='frail-wish'?voiceLine('frail-foster','她在病榻上停了片刻，说起一直放在心里的愿望。','臣妾一直未能有孕，也想要一个孩子。若有合适的孩子可请养，愿先安排好照护、听过生母的意思；不是有了名分便能算尽责。'):null;}
