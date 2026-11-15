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
  if(!inPalace(c)||c.maid||c.age<20||c.preg||(c.delivery&&!c.delivery.settled)||c.hp<40||
    S.children.some(k=>k.alive&&(k.mom===c.id||k.foster===c.id)))return null;
  const years=Number.isFinite(c.enteredAt)?S.turn-c.enteredAt:0;
  if(c.rank>=3&&c.favor>=70&&years>=24&&(c.nights||0)>=8&&c.lastBirth<0&&!S.children.some(k=>k.mom===c.id))return 'long-wait';
  if(c.age>=30&&c.rank>=4&&c.favor>=45&&(c.fam.p>=25||c.favor>=70))return 'empty-household';
  return null;
}
function fosterPetitioner(c){return !!fosterPetitionReason(c);}
function fosterPetitionMatch(c,k){
  const reason=fosterPetitionReason(c),m=byId(k?.mom),f=k&&fosterOf(k);
  if(!reason||!m||m===c||!childInPalace(k)||k.pendingName||kidAge(k)>=6||k.id===S.heir||
    motherOriginalRank(k)>=5||c.rank<=motherOriginalRank(k)||(f?.alive&&!f.cold&&!f.gone))return false;
  return childNeedsMother(k)||(reason==='long-wait'&&inPalace(m));
}
function fosterWishWords(c,k){
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
  const opening=reason==='long-wait'?`${cName(c)}入宫已${Math.floor((S.turn-c.enteredAt)/12)}年，常获召见，却一直未曾生育。她今日提起的，是${k.name}。`:
    `${cName(c)}已${c.age}岁，${past?'如今膝下无人相伴':'膝下无子'}，今日私下求见。`;
  const care=childNeedsMother(k)?`她知道孩子有乳母照料，只是${!m.alive?'生母已不在了':'生母眼下不能亲自照看'}，希望自己承担长久照护。`:
    `${fullName(m)}仍在亲自抚养孩子。她提出的是请养之愿，并非孩子无人照顾；若更换养母，生母与孩子的感受也须听见。`;
  return `${opening}\n“${fosterWishWords(c,k)}”\n${relGet(c,k)>=25?`她也记得与${k.name}已有的来往，并非随意指一个孩子。\n`:''}${care}`;
}
function maternalKinMatch(c,k){
  const m=byId(k.mom);
  return inPalace(c)&&!c.maid&&childNeedsMother(k)&&m&&c.kinArrival?.mother===m.id&&
    !!c.kin?.[m.id]&&c.clan===m.clan;
}
function petitionFoster(k,c,kin=false,consensual=false){
  if(S.over||!(kin?maternalKinMatch(c,k):fosterPetitionMatch(c,k)))return null;
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
  return {title:'愿留一盏灯',por:c,cast:[k],present:[c],cooldown:24,valid:()=>fosterPetitionMatch(c,k),
    onQueue:()=>{S.flags.lastFosterPetition=c.lastFosterPetition=k.lastFosterPetition=S.turn;story(c,`【请养之愿】${fosterPetitionText(c,k)}`);},
    text:fosterPetitionText(c,k),choices:[
      childNeedsMother(k)?{t:`准她抚养${k.name}`,f:()=>petitionFoster(k,c)}:{t:'先听生母的意思，再定抚养',f:()=>{if(fosterPetitionMatch(c,k)){const ev=fosterMotherDiscussion(c,k);if(ev.valid()){ev.onQueue();pushNow(ev);}}return null;}},
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
A.fosterWish=function(id){if(modalOpen)return;const c=byId(id),ev=c&&fosterPetitionEvent(c);if(ev)pushEv(ev);};
function fosterWishButton(c){return fosterPetitionPairs(c).length?`<button class="btn sm" onclick="A.fosterWish(${c.id})">听她谈抚养孩子</button>`:'';}
function kinSuccessionSource(c){
  return c&&!c.maid&&c.rank>=5&&c.age>=20&&hasClan(c)&&(!c.alive||c.cold||c.gone)&&!c.kinSuccessor;
}
function kinArrivalGreeting(c){
  const a=c?.kinArrival,m=byId(a?.mother);if(!a?.pending||!inPalace(c)||!m)return null;
  const children=S.children.filter(k=>k.mom===m.id&&maternalKinMatch(c,k));
  const all=S.children.filter(k=>k.mom===m.id&&k.alive&&!k.pendingName);
  const kin=c.kin?.[m.id]?.startsWith('亲')?'姐姐':'堂姐';
  const finish=()=>{a.pending=false;save('auto');};
  return {title:'初入宫 · 姐妹旧缘',por:c,cast:children, present:[c],valid:()=>a.pending&&inPalace(c),
    text:`${fullName(c)}初次在宫中向你问安，没有先提自己的封赏。\n“臣妾今日能来，是家中仍念着${kin}${fullName(m)}的旧缘。${!m.alive?'她已不在，臣妾不敢说能替代她。':'她如今不能在御前说话，臣妾也不敢替她辩解。'}”\n${children.length?`她又轻声道：“${children.map(k=>k.name).join('、')}还小，臣妾想先求一道恩典，照看${kin}的孩子。宗谱上的生母不改，只求让孩子有个亲人在身边。”`:all.length?'她又问起姐姐的孩子。得知已有安顿，便道：“已有养母照看或已长大的，臣妾不敢另求更改，只愿日后多些往来。”':'她顿了一顿：“臣妾愿慢慢学宫里的日子，也盼这份家门旧缘还能续下去。”'}`,choices:[
      ...(children.length?[{t:`准她照料${children.map(k=>k.name).join('、')}`,f:()=>{
        if(!a.pending||!inPalace(c))return null;
        const results=children.map(k=>petitionFoster(k,c,true)).filter(Boolean);finish();
        return results.length?results.join('\n'):'孩子的照护安排已有变化，此时不再另换养母。';}}]:[]),
      {t:children.length?'先安顿下来，抚养之事暂缓':'让她安心住下',f:()=>{if(!a.pending)return null;story(c,'初见时提起姐姐的旧缘，陛下让她先安心住下。');finish();return '你让她先安顿宫中日常。孩子原有的抚养安排没有改变。';}}]};
}
function pendingKinGreeting(){return S.consorts.map(kinArrivalGreeting).find(Boolean)||null;}
function kinSuccessionEvent(){
  if(S.over||mourningActive()||S.turn-(S.flags.lastKinSuccession??-99)<36)return null;
  const sources=S.consorts.filter(c=>kinSuccessionSource(c)&&S.turn-(c.lastKinSuccession??-99)>=48&&
    !harem().some(o=>o.id!==c.id&&o.clan===c.clan&&S.turn-o.enteredAt<24));
  if(!sources.length||!chance(.06))return null;
  const c=pick(sources),children=S.children.filter(k=>k.mom===c.id&&childNeedsMother(k));
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
