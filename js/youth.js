/* Adolescent friendships, ideals and named acquaintances remembered until marriage. */
const teenageChildren=()=>kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=13&&kidAge(k)<16);
const youthIdeal=k=>k.mar>k.lit+8?'riding':k.lit>=55?'books':'kindness';
const YOUTH_IDEALS={
  riding:'肯陪我骑马、也尊重我自己拿主意的人。',
  books:'有话可谈，愿意认真听我说完一本书的人。',
  kindness:'待身边人温和，遇事也肯担当的人。'
};
function recordYouthTalk(a,b,first,second,emotions=[.6,.6]){
  kstory(a,first);kstory(b,second);
  NPCMemory.record(S,{type:'youth-talk',time:S.turn,location:'上书房',participants:[a.id,b.id],object:'少年同窗'},[
    {person:a.id,subject:b.id,interpretation:first,emotion:emotions[0],impact:65},
    {person:b.id,subject:a.id,interpretation:second,emotion:emotions[1],impact:65}
  ]);
}
function youthEvent(){
  if(S.turn-(S.flags.lastYouthEvent??-99)<4)return null;
  const teens=teenageChildren().filter(k=>S.turn-(k.lastYouthEvent??-99)>=8);
  if(!teens.length)return null;
  const girl=teens.find(k=>k.sex==='f'&&!k.youthIdeal);
  let ev,cast;
  if(girl){
    cast=[girl];const ideal=youthIdeal(girl);
    ev={title:'少女心事',por:girl,text:`${kidName(girl)}翻到书中一段婚嫁故事，忽然问：“父皇，若是以后选驸马，能不能先听听女儿的意思？我想要${YOUTH_IDEALS[ideal]}”\n说完，她又有些不好意思，把书往前推了推。`,choices:[
      {t:'认真听她说，往后的事不急着定',f:()=>{girl.youthIdeal=ideal;girl.love=clamp(girl.love+5);princessMemory(girl,'youth_ideal',`少年时向父皇说起心中所想：${YOUTH_IDEALS[ideal]}父皇认真听了，没有急着定亲。`,'宫中');return '她松了口气，又说起自己将来还想做的事。'}},
      {t:'告诉她也要看品行，慢慢相识',f:()=>{girl.youthIdeal=ideal;girl.vir=clamp(girl.vir+2);princessMemory(girl,'youth_ideal',`父皇听了她的心意，也提醒她相处久了才看得清品行。`,'宫中');return '她点点头，说自己会记得。'}},
      {t:'不许再谈这些',f:()=>{girl.youthIdeal=ideal;girl.love=clamp(girl.love-5);princessMemory(girl,'youth_ideal',`谈起将来的心意时被父皇打断，往后不大敢主动提起。`,'宫中',-.6);return '她把书合上，不再往下说了。'}}]};
  }else{
    if(teens.length<2)return null;const [a,b]=shuffle(teens);cast=[a,b];
    const quarrel=relGet(a,b)<10||a.amb>=60||b.amb>=60;
    ev={title:quarrel?'少年意气':'同窗论志',cast,
      text:quarrel?`上书房散课，${a.name}嫌${b.name}当着同窗纠正自己的话：“你每回都要压我一头？”\n${b.name}不肯让：“我说的是道理，不是谁该让着谁。”两人连借过的书都要当场还清。`:
        `${a.name}说，将来想${a.mar>a.lit?'亲自看看边关，不只听军报上怎么写':'把书里读到的道理试着做成实事'}。${b.name}接话，自己却想${b.mar>b.lit?'学好骑射，去更远的地方走走':'先去听听百姓怎样过日子'}。两人越说越认真，连下课都忘了。`,choices:[
        {t:quarrel?'让两人各自讲清，约好别在人前挖苦':'听他们各自说完，再互相提一个问题',f:()=>{relAdd(a,b,10);a.vir=clamp(a.vir+2);b.vir=clamp(b.vir+2);recordYouthTalk(a,b,`与${b.name}谈起想法，父皇让两人把话说完，也听对方。`,`与${a.name}看法不同，但对方肯听我说完了。`);return '两人仍有不同的主意，却肯坐下来继续谈了。'}},
        {t:`只夸${a.name}，让${b.name}学着些`,person:a,f:()=>{relAdd(a,b,-10);b.love=clamp(b.love-4);recordYouthTalk(a,b,`父皇肯定了我，${b.name}却不再肯接话。`,`与${a.name}争论时，父皇只听了对方。`,[.3,-.6]);return `${b.name}收起书，不再接话。这次争执被记在了心里。`}},
        {t:'留给他们自己商量',f:()=>{relAdd(a,b,quarrel?-2:4);recordYouthTalk(a,b,`与${b.name}${quarrel?'话不投机，各自走开。':'在廊下谈了许久。'}`,`与${a.name}${quarrel?'争执未解，仍没有消气。':'谈起自己的打算。'}`,quarrel?[-.2,-.2]:[.4,.4]);return quarrel?'他们各自走开，还没有消气。':'他们在廊下又说了好一会儿。'}}]};
  }
  return {...ev,present:cast,valid:()=>cast.every(k=>teenageChildren().includes(k)),onQueue:()=>{S.flags.lastYouthEvent=S.turn;cast.forEach(k=>k.lastYouthEvent=S.turn);}};
}
function youngGuestEligible(k,g){
  if(!k?.alive||k.sex!=='f'||k.married||k.jailed||!g?.alive||g.married||g.sur===E().sur)return false;
  return !mothersOf(k).some(m=>clanKey(m)===g.clan||houseOf(m)?.father.id===g.houseId);
}
function householdGuest(host,princess){
  const h=houseOf(host);if(!h||!officialAlive(h.brother)||h.brother.commission||h.brother.away||h.brother.exiled||h.brother.dismissed)return null;
  const guests=S.youngGuests ||= {},key=h.father.id;
  if(!guests[key]){
    const seed=ri(1,2e9),given=pick(['清衍','景初','明珩','知衡','怀瑾','长宁','允和','景川']);
    guests[key]={id:'guest-'+key,courtGuest:true,sex:'m',name:host.sur+given,sur:host.sur,clan:clanKey(host),houseId:key,
      fatherName:h.brother.name,host:host.id,born:S.turn-(kidAge(princess)+ri(0,1))*12,seed,alive:true,
      quality:pick(h.bloc==='army'?['riding','kindness']:['books','kindness'])};
  }
  return guests[key];
}
function youngGuestVisit(name){
  if(S.turn-(S.flags.lastYoungGuest??-99)<6)return null;
  const girls=teenageChildren().filter(k=>k.sex==='f'&&!k.youngAdmiration&&S.turn-(k.lastYoungGuest??-99)>=12&&inPalace(byId(k.foster||k.mom)));
  if(!girls.length)return null;
  const options=[];
  for(const host of harem().filter(c=>c.palace===name&&hasClan(c)&&c.sur!==E().sur))for(const k of girls){
    const h=houseOf(host),identity={alive:true,sur:host.sur,clan:clanKey(host),houseId:h.father.id};
    if(youngGuestEligible(k,identity))options.push({host,k});
  }
  if(!options.length||!chance(.3))return null;
  const {host,k}=pick(options),guest=householdGuest(host,k);
  if(!youngGuestEligible(k,guest)||kidAge(guest)<13||kidAge(guest)>17||Math.abs(kidAge(guest)-kidAge(k))>3)return null;
  S.flags.lastYoungGuest=S.turn;k.lastYoungGuest=S.turn;
  return {kind:'guest',child:k.id,mother:(k.foster||k.mom),host:host.id,guestKey:guest.houseId};
}
function youngGuestScene(scene,name){
  const child=kidById(scene.child),host=byId(scene.host),mother=byId(scene.mother),guest=S.youngGuests?.[scene.guestKey];
  return teenageChildren().includes(child)&&inPalace(host)&&host.palace===name&&officialAlive(houseOf(host)?.brother)&&!houseOf(host).brother.commission&&!houseOf(host).brother.away&&!houseOf(host).brother.exiled&&!houseOf(host).brother.dismissed&&inPalace(mother)&&
    mother.id===(child.foster||child.mom)&&youngGuestEligible(child,guest)?{scene,child,host,mother,guest}:null;
}
function youngGuestPanel({scene,child:k,host,mother,guest},name){
  const line={books:'他拾起滑落的书签，问起书中一处批注，两人竟各有不同的解法。',riding:'他谈起学骑射时跌下马的糗事，没夸自己本事多大，倒把公主逗笑了。',kindness:'宫人失手碰翻茶盏，他先扶稳托盘，再轻声说不必慌张。'}[guest.quality];
  return `<p class="hint">${esc(guest.fatherName)}奉召入宫，带${esc(guest.name)}来向姑母${esc(cName(host))}请安。${esc(k.name)}随${esc(cName(mother))}来小坐，恰好遇见。</p>`+
    palaceConversation('廊下初识','书签 · 茶盏',[{person:k,line:`她留意到：${line}`,action:`A.go('kid',${k.id})`},{person:guest,line:`${kidAge(guest)}岁 · ${guest.fatherName}之子。行过礼，他仍规规矩矩地站在姑母身旁。`}])+
    (scene.result?`<p class="initiative-note" role="status">${esc(scene.result)}</p>`:`<div class="acts"><button class="btn jade" onclick="A.answerYoungGuest('listen')">私下听听公主的心意</button><button class="btn" onclick="A.answerYoungGuest('wait')">让他们先以书友相处</button></div>`);
}
A.answerYoungGuest=function(mode){
  if(S.over||modalOpen||UI.view!=='palace'||!['listen','wait'].includes(mode))return;
  const found=palaceLifeScene(UI.sel);if(!found||found.scene.kind!=='guest'||found.scene.result)return;
  const {scene,child:k,guest}=found;
  k.youngAdmiration={guestKey:guest.houseId,met:S.turn,place:UI.sel,approach:mode};
  k.youthIdeal ||= youthIdeal(k);k.love=clamp(k.love+3);
  scene.result=mode==='listen'?`${k.name}小声说起${guest.name}：“若是以后……女儿想再认识他一些。”你答应记住这个名字，往后的婚事不急着定。`:
    `你让他们先以书友相处。${k.name}记住了${guest.name}，也明白一次相见还不够了解一个人。`;
  princessMemory(k,'youth_acquaintance',scene.result,UI.sel);save('auto');render();
};
function youthPanel(k){
  const guest=S.youngGuests?.[k.youngAdmiration?.guestKey];
  if(!k.youthIdeal&&!guest)return '';
  return `<p>${k.youthIdeal?'她曾说，希望将来遇见'+esc(YOUTH_IDEALS[k.youthIdeal]):''}</p>${guest?`<p>少年时相识：${esc(guest.name)} · ${esc(guest.fatherName)}之子。</p><p class="hint">${youngGuestEligible(k,guest)?'这段相识会留到日后议婚时再谈，尚未定亲。':k.spouse?.id===guest.id?'后来两人的婚事已经议定。':'如今处境已变，不再作为可议人选。'}</p>`:''}`;
}
function rememberedMatch(k){
  const guest=S.youngGuests?.[k.youngAdmiration?.guestKey];
  return kidAge(k)>=16&&kidAge(guest||{born:S.turn})>=16&&youngGuestEligible(k,guest)?guest:null;
}
function rememberedMatchEvent(k){
  const guest=rememberedMatch(k);if(!guest)return null;
  return {title:'再谈旧日相识',cast:[k,guest],valid:()=>!!rememberedMatch(k),text:`${k.name}仍记得${guest.name}。如今两人都已长成，礼部将${guest.fatherName}家的名帖送来。\n她问：“父皇当年说会记得，今日可否再认真问问他的意思，也听听我的？”`,choices:[
    {t:'双方愿意，再议定亲事',f:()=>{if(!rememberedMatch(k))return null;k.married=true;guest.married=k.id;k.spouse={...guest,marriedAt:S.turn};k.princessMarriage='acquaintance';if(k.estate)k.estate.route='acquaintance';k.love=clamp(k.love+12);princessMemory(k,'princess_marriage',`与少年时相识的${guest.name}互问心意后，婚事议定。`);log(`${kidName(k)}与${guest.name}议定婚事。`,1);ensureMarriedLife(k);save('auto');return '双方答应后，礼部才开始筹办。她说，多谢父皇记得，也肯等她自己拿定主意。'}},
    {t:'先不定亲，再相处一段时间',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '名帖暂且收起，双方都还有时间再想一想。'}}]};
}
