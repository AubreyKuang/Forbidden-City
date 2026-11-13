/* Voluntary foster petitions and maternal relatives' arrival. No child is reassigned by a roll. */
function childNeedsMother(k){
  if(!childInPalace(k)||k.pendingName||kidAge(k)>=6||k.id===S.heir)return false;
  const m=byId(k.mom),f=fosterOf(k);
  // A temporary temple visit is not abandonment by either mother.
  if(!m||(m.alive&&!m.cold&&!m.gone))return false;
  return !f||!f.alive||f.cold||f.gone;
}
function motherOriginalRank(k){const m=byId(k.mom);return Math.max(m?.rank??0,k.birthTraits?.mother?.rank??0);}
function fosterPetitioner(c){
  return inPalace(c)&&!c.maid&&c.age>=30&&c.rank>=4&&c.favor>=45&&!c.preg&&
    (c.fam.p>=25||c.favor>=70)&&!S.children.some(k=>k.alive&&(k.mom===c.id||k.foster===c.id));
}
function fosterPetitionMatch(c,k){return fosterPetitioner(c)&&childNeedsMother(k)&&motherOriginalRank(k)<5&&c.rank>motherOriginalRank(k);}
function maternalKinMatch(c,k){
  const m=byId(k.mom);
  return inPalace(c)&&!c.maid&&childNeedsMother(k)&&m&&c.kinArrival?.mother===m.id&&
    !!c.kin?.[m.id]&&c.clan===m.clan;
}
function petitionFoster(k,c,kin=false){
  if(S.over||!(kin?maternalKinMatch(c,k):fosterPetitionMatch(c,k)))return null;
  const m=byId(k.mom),text=doFoster(k,c,{maternalKin:kin});
  NPCMemory.record(S,{type:'family-care',time:S.turn,participants:[c.id,k.id,...(m?.alive?[m.id]:[])],outcome:`${fullName(c)}获准抚养${k.name}。`},[
    {person:c.id,subject:k.id,interpretation:kin?'我请求照顾姐妹留下的孩子，陛下准了。':'膝下无子的我请求照顾这个孩子，陛下准了。',emotion:.85,impact:90},
    {person:k.id,subject:c.id,interpretation:`由${fullName(c)}承担日常抚养，生母仍是${k.momName}。`,emotion:.5,impact:90},
    ...(m?.alive?[{person:m.id,subject:c.id,interpretation:kin?'我的姐妹获准照看孩子，虽不能亲自养育，心中略有安慰。':'我不能亲自照看孩子，孩子被交给别的妃嫔抚养。',emotion:kin?.4:-.6,impact:90}]:[])
  ]);save('auto');return text;
}
function fosterPetitionEvent(){
  if(S.over||mourningActive()||S.turn-(S.flags.lastFosterPetition??-99)<24)return null;
  const pairs=harem().filter(c=>S.turn-(c.lastFosterPetition??-99)>=36).flatMap(c=>S.children.filter(k=>fosterPetitionMatch(c,k)&&S.turn-(k.lastFosterPetition??-99)>=24).map(k=>({c,k})));
  if(!pairs.length||!chance(.08))return null;
  const {c,k}=pick(pairs),m=byId(k.mom);
  return {title:'愿留一盏灯',por:c,cast:[k],present:[c],cooldown:24,valid:()=>fosterPetitionMatch(c,k),
    onQueue:()=>{S.flags.lastFosterPetition=c.lastFosterPetition=k.lastFosterPetition=S.turn;},
    text:`${cName(c)}膝下无子，已${c.age}岁，今日私下求见。\n“臣妾知道${k.name}有乳母照料，只是${!m.alive?'生母已不在了':'生母眼下不能亲自照看'}，终究少一个长久惦记的人。臣妾的位分与宫中用度尚能照应，想请陛下将孩子交给臣妾抚养。”\n她问的是${k.name}，并未借此讨取旁人的尊位。`,choices:[
      {t:`准她抚养${k.name}`,f:()=>petitionFoster(k,c)},
      {t:'暂由乳母照看，此事缓议',f:()=>{story(c,`请求抚养${k.name}，陛下暂缓定夺。`);save('auto');return '孩子仍由原处的乳母照护，没有更换养母。';}},
      {t:'婉言不允',f:()=>{story(c,`请求抚养${k.name}，未获允准。`);remember(c,'family-care','请养孩子未获准，心中失落。');save('auto');return fx(cchg(c,{mood:-5}));}}]};
}
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
