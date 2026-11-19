/* The same child moves from the estate register to palace care after birth. */
function princeSpousePlacementReady(k,dossier){
  if(!PalaceActions.princeSpousePlacement||S.over||!dossier.imperialFather||dossier.status!=='complete'||
    dossier.placement?.status==='palace')return false;
  return princeSpousePlacementSubject(k,dossier);
}
function princeSpousePlacementSubject(k,dossier){
  const child=k.household.children.find(c=>c.id===dossier.childId);
  return child?child.alive&&kidAge(child)<15&&!child.married&&!child.princeAdoption&&!child.princelySuccession:
    k.household.pregnancies.some(g=>g.princeParentage===dossier.key);
}
function princeSpouseCarers(){
  const dowagers=[['main',S.flags.dowager],['birth',S.flags.birthDowager]].filter(([,d])=>d?.alive).map(([seat,d])=>
    ({seat,id:d.personId??null,gen:S.gen,name:d.name,place:dowagerResidence(d),person:d}));
  return [...dowagers,...harem().filter(c=>inPalace(c)&&c.age>=18&&c.palace).map(c=>
    ({seat:'consort',id:c.id,gen:S.gen,name:cName(c),place:c.palace,person:c}))];
}
function princeSpouseCarer(plan){
  return princeSpouseCarers().find(c=>c.seat===plan.seat&&c.id===plan.id&&c.gen===plan.gen);
}
const PRINCE_PLACEMENT_WORDS={
  好奇:['他问清孩子长大后若问起身世，该由谁来讲。','他问了两次宫里日常用什么名字，最后要来一封可以亲自读的平安信。'],
  好胜:['他亲手定下乳母轮值的日子，把府里该担的事逐条写齐。','他要来接的人把每项照料当面说清，临了仍亲手检查了一遍包袱。'],
  仁厚:['他把备好的小被放回来，说大人的为难可留给大人，孩子往后照常有人疼。','他先去问王妃要不要自己再抱一会儿，又托接养的人往后记得报一声平安。'],
  内敛:['他只说了一声好，夜里却自己去窗下把小摇床挪离了风口。','他未在门前多说话，把一件亲手挑的小衣叠好，放进孩子的包袱。'],
  爽直:['他当面说自己心里还会难受，随后又问府医，照料孩子该先准备些什么。','他当面说送走孩子心里也空，嘱来人把这句留在屋里，回头仍把车帘掩严了。'],
  灵动:['他找来一只布老虎摆在榻头，头一回为它该朝哪头摆这样认真。','他把府里那只布老虎塞给乳母，说路上有它作伴，转头却站在门边没有笑。'],
  审慎:['他合上密卷，另列一张养护单，谁能看望，何时请脉，都同她逐件商量。','他确认车里暖和、随行乳母也熟悉孩子，这才肯让他们动身。'],
  自矜:['他将府中闲人遣开，亲自告诉她孩子留下，答应往后府中照例待孩子。','他在人前照常过问府务，等门一关，才请人将孩子原先的寝屋多留一夜。']
};
const WIFE_PLACEMENT_WORDS={
  温厚:['她悄悄松了口气，问他肯不肯有空也来坐坐，听一听孩子醒时的动静。','她一遍遍嘱咐怎样哄睡，最后塞上一条旧帕，说自己惦念时只求一封平安信。'],
  爽朗:['她笑着说以后府里可要热闹了。等夫君应了，才发现自己捏着帘子的手还在抖。','她强撑着说了句吉利话，待车帘一落，才承认自己连孩子醒来找谁都想过几遍。'],
  矜持:['她起身行过礼，回屋才叫人把预备收起的襁褓一件件取回来。','她把交代的话写得井井有条，到了最后一行，独添一句，盼得空让她看一眼。'],
  好胜:['她当面将乳母、请脉与起居问明，才坐下来，说往后孩子受了委屈她会自己出面。','她一件件问清接养的安排，还要来人答应孩子的近况须有人亲口告诉她。'],
  敏感:['她把原来缝了一半的小被翻出来，摸见针脚，才相信日后能亲自为孩子盖上。','她将那床没舍得裁短的小被交给乳母，怕孩子闻不见熟悉的气味，半夜难安。'],
  沉静:['她听完坐了一晌，把该洗的几件小衣从头理了一遍，这才真正安下心。','她把熨好的里衣放在最上头，送到门边仍平静，回房才翻出剩的一件独自坐着。']
};
const PRINCE_EXPECTING_HANDOFF={
  好奇:'他问起宫中的乳母几时来，想先见一面，把往后的事问明白。',好胜:'他将宫人传过的话又核对一遍，坚持出生后的事须先同府里知会。',
  仁厚:'他见她心神难安，先请府医照常来看，临走说眼下先顾她的身子。',内敛:'他把接养的日子留空，旁边写了句等母子都平安，再填。',
  爽直:'他明说自己舍不得，仍问她愿不愿先把想嘱咐的话写下来。',灵动:'他原想说句宽心话，话到嘴边，只说等孩子出生后再一道送。',
  审慎:'他问明宫里来接的时辰可以缓一缓，才把手中那张拟好的单子收好。',自矜:'他先叫旁人散了，才问她那日想由谁陪着，也好提前留人。'
};
function princeSpousePlacementNotes(k,dossier,title,news,moving){
  const wife=princeSpouseParentageWife(k,dossier),branch=Number(moving);
  const prince=k.alive?PRINCE_PLACEMENT_WORDS[childDisposition(k)][branch]:'';
  const mother=wife?(WIFE_PLACEMENT_WORDS[marriageNature(wife).temperament]||WIFE_PLACEMENT_WORDS.沉静)[branch]:'';
  if(prince)princeSpouseParentageNote(k,dossier,title,news+prince);
  if(mother)princeSpouseParentageNote(wife,dossier,title,news+mother);
  return [news,prince,mother].filter(Boolean).join('\n');
}
function keepPrinceSpouseChild(k,dossier){
  if(!princeSpousePlacementReady(k,dossier)||dossier.placement?.status==='estate')return null;
  dossier.placement={status:'estate',turn:S.turn};
  return princeSpousePlacementNotes(k,dossier,'王府留养','密议让孩子留在王府，交府里照料。',false);
}
function movePrinceSpouseChild(k,dossier,carer,child){
  const plan=dossier.placement;
  if(!princeSpousePlacementReady(k,dossier)||plan?.status!=='waiting'||!princeSpouseCarer(plan)||!child?.alive)return null;
  const formerId=child.id,succession=princeSuccessionState(k),dowager=carer.seat!=='consort';
  if(succession?.heir===formerId)delete succession.heir;
  if(succession?.nominated===formerId)delete succession.nominated;
  if(S.flags.palaceWard?.child===formerId)delete S.flags.palaceWard;
  const storyOrigin={estate:k.id,estateName:princeEstateLabel(k),motherName:dossier.motherName,fatherName:dossier.imperialFather,
    dossier:dossier.key,formerId,gen:dossier.gen,turn:S.turn};
  moveHouseholdChildToPalace(k,child,{mom:null,momName:'密卷所载',foster:dowager?null:carer.id,princeSpouseOrigin:storyOrigin});
  if(dowager){
    child.dowagerUpbringing={gen:S.gen,personId:carer.id,seat:carer.seat,turn:S.turn};
    dowagerRecord(carer.person,'接养宗亲',`${child.name}从王府来到${carer.place}。她让乳母先讲讲孩子平日怎样吃睡，把从府中带来的小被放在床边。`);
  }else{
    child.fosterT=S.turn;
    princeSpouseParentageNote(carer.person,dossier,'接养宗亲',`${child.name}由宫人送到${carer.place}。她让孩子熟悉的乳母留在身边，又亲自来问头一晚的起居。`);
  }
  plan.status='palace';plan.palaceId=child.id;plan.arrived=S.turn;
  princeSpouseParentageNote(child,dossier,'密接入宫',`由${storyOrigin.estateName}接入${carer.place}，交${carer.name}照看。宫中以宗室寄养安顿，身世封入密卷。`);
  const parting=princeSpousePlacementNotes(k,dossier,'王府送别',`${child.name}由可信的宫人接到${carer.place}，交${carer.name}抚养。`,true);
  return parting+'\n府里对外只说送作宗室寄养，亲缘所系封存在密卷里。';
}
function princeSpousePlacementEvent(k,dossier){
  if(!princeSpousePlacementReady(k,dossier))return null;
  const baby=princeSpouseParentageChild(k,dossier),wife=princeSpouseParentageWife(k,dossier);
  const name=baby?.name||'孩子';
  return {title:'王府密议 · 孩子的去处',cast:[k.alive?k:null,wife,baby],sealedAnnals:true,
    valid:()=>princeSpousePlacementReady(k,dossier),
    text:`这份回奏只在密卷中。${baby?`${name}已经出生，可以从府中接养。`:'王妃先留在府中安胎，接养安排等孩子平安出生后办理。'}\n可继续留在王府照料，也可选一位宫中养育人，以宗室寄养的名目入宫。`,
    choices:[...princeSpouseCarers().map(({seat,id,gen,name,place,person})=>({t:`秘密接入宫中，由${name}抚养${seat!=='consort'&&S.flags.birthDowager?' · '+place:''}`,
      person:seat==='consort'?person:dowagerPerson(person),f:()=>{
        const carer=princeSpouseCarer({seat,id,gen});if(!carer||!princeSpousePlacementReady(k,dossier))return null;
        dossier.placement={status:'waiting',seat,id,gen,name,place,turn:S.turn};
        if(baby)return movePrinceSpouseChild(k,dossier,carer,baby);
        const news=`待孩子平安出生，将秘密送到${place}，由${name}照料。`;
        const prince=k.alive?PRINCE_EXPECTING_HANDOFF[childDisposition(k)]:'';
        const mother=wife?`${['好胜','爽朗'].includes(marriageNature(wife).temperament)?'她当面问清了往后该向谁问孩子的平安。':'她把养育人的名字记在枕边，今夜惦记得比往日久。'}`:'';
        if(prince)princeSpouseParentageNote(k,dossier,'王府接养密议',news+prince);
        if(mother)princeSpouseParentageNote(wife,dossier,'王府接养密议',news+mother);
        return [news,prince,mother].filter(Boolean).join('\n');
      }})),...(dossier.placement?.status!=='estate'?[{t:'继续留在王府抚养',f:()=>keepPrinceSpouseChild(k,dossier)}]:[]),{t:'容后再议'}]};
}
function princeSpouseHandoffEvent(k,dossier){
  const plan=dossier.placement,baby=princeSpouseParentageChild(k,dossier);
  const valid=()=>plan?.status==='waiting'&&dossier.placement===plan&&!!baby?.alive&&princeSpousePlacementReady(k,dossier);
  if(!valid())return null;
  const carer=princeSpouseCarer(plan),wife=princeSpouseParentageWife(k,dossier);
  return {title:'王府密信 · 孩子已出生',cast:[baby,k.alive?k:null,wife],valid,sealedAnnals:true,
    text:carer?`${baby.name}出生后，府里只将接养的消息递到御前。乳母收好了衣被，等你准许，再将孩子送到${carer.place}。`:
      `${baby.name}已经出生。原先选定的${plan.name}眼下无法接养，孩子先由王府照看，等候你另作安排。`,
    choices:[...(carer?[{t:`依密议接入宫中，交${carer.name}抚养`,f:()=>movePrinceSpouseChild(k,dossier,carer,baby)}]:[]),
      {t:'重新商议孩子的去处',f:()=>{plan.held=true;pushNow(princeSpousePlacementEvent(k,dossier));return null;}},
      {t:'先在王府再养一阵',f:()=>{plan.held=true;return '王府会接着照料孩子。密卷里可随时重提接养。';}}]};
}
function pendingPrinceSpousePlacements(){
  if(!PalaceActions.princeSpousePlacement||S.over||mourningActive())return [];
  return royalHouseholds().flatMap(k=>princeSpouseParentageCases(k).filter(x=>x.placement?.status==='waiting'&&!x.placement.held&&x.childId)
    .map(x=>princeSpouseHandoffEvent(k,x)).filter(Boolean));
}
A.princeSpousePlacement=function(id,key){
  if(modalOpen||S.over)return;
  const k=royalById(id),dossier=princeSpouseParentageCases(k).find(x=>x.key===key);
  if(!dossier||!princeSpousePlacementReady(k,dossier))return;
  pushEv(princeSpouseHandoffEvent(k,dossier)||princeSpousePlacementEvent(k,dossier));
};
function princeSpouseOriginPanel(k){
  const origin=k.princeSpouseOrigin;
  return origin?detailSection('来处密记',`<p>来自${esc(origin.estateName)} · 生母 ${esc(origin.motherName)} · 生父 ${esc(origin.fatherName)}</p>`):'';
}
