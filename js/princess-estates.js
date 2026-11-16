/* 公主开府、议婚、府中事务与还宫 */
const PRINCESS_PURSUITS = {
  books: {title:'整理一部书', wish:'我想把宫里旧书校清楚，抄一部留给弟妹。', result:'校成的书已经装订好，她在第一页写上了帮忙校对的人。', stat:'lit'},
  archery: {title:'办一场女骑赛', wish:'我想请城中善骑的女子来比试，也给初学的人留一场。', result:'女骑赛已办完。她将第一支彩箭带回，说要留给当初教她骑马的人。', stat:'mar'},
  near: {title:'安一座近宫的府', wish:'我想住得离宫门近些，时常能回来看看母亲，也请弟妹到府里坐坐。', result:'府里的小厅已经布置好，她在窗前留了一张母亲从前喜欢的椅子。', stat:'vir'}
};
const PRINCESS_MATCHES = {
  official:{name:'重臣之子', note:'他的家人能在朝中照应她，她担心婚后很难拒绝娘家的请托。'},
  frontier:{name:'北境来使为本部求亲', note:'她问，远行之后可否继续给母亲写信，又能否保留自己的府中人手。'},
  scholar:{name:'她愿意交往的进士', note:'两人谈过她想做的事。对方愿先来见她，等她自己作答。'}
};

const archivedPrincesses=()=>S.princessRelatives||[];
const estatePrincesses=()=>[...kidsAlive().filter(k=>k.estate),...archivedPrincesses()].filter(k=>!immortalAway(k));
const princessById=id=>{const k=kidById(id)||archivedPrincesses().find(k=>k.id===id);return immortalAway(k)?undefined:k;};
const canOpenPrincess=k=>k?.alive&&!immortalAway(k)&&!k.templeStay&&!k.removedFromRoyal&&k.sex==='f'&&kidAge(k)>=15&&!k.jailed;
const princessPursuit=k=>k.lit>=Math.max(45,k.mar+7)?'books':k.mar>=45?'archery':'near';

// Marriage hopes belong to the person, not to the estate's current project.
const princessMarriageVoicesActive=()=>journalContentVersion()>=48;
const PRINCESS_MARRIAGE_VOICES={
  灵动:{stage:'把名帖摊在案上，忍不住先说了自己的主意',lines:[
    '我想找个肯接我的话、也会逗我笑的人。总是我说十句，他只答一句，日子多闷呀。',
    '礼部写的都是家世，我倒想知道他平日怎么过。能不能先让我们聊一会儿？',
    '我想同他过节猜灯谜，也想听他讲自己的趣事。不能成了亲，就只剩下行礼问安。',
    '若我临时起了个新点子，他会陪着想办法，还是立刻说不合规矩？这件事我想先问。']},
  好奇:{stage:'翻看名帖，圈出了几处想问清的地方',lines:[
    '人人都说他好，我想听听缘由。他遇见不懂的事，会认真去查，还是装作早就知道？',
    '我想与他各说一件最近才学会的事。若能一路问下去，才知道有没有话可谈。',
    '他去过哪些地方，见过什么人？我想听他亲口讲，名帖上的几行字实在不够。',
    '我有时爱追问，也会改主意。他若肯同我一道弄明白，总比句句附和有趣。']},
  好胜:{stage:'看过名帖上的才名，没有立刻点头',lines:[
    '我敬佩有真本事的人。可若他样样都故意输给我，我反倒瞧不起他。',
    '我也有想做成的事。将来谁先有了长进，都该替对方高兴，不能只许一个人出头。',
    '输赢我会在意，但不想把夫妻也过成对手。有分歧时，他肯不肯把道理讲明白？',
    '不要只说他家显贵。我想知道这些年，他自己凭本事做成过什么。']},
  仁厚:{stage:'没有急着看门第，先问起对方平日待人如何',lines:[
    '他待我自然会周到。我更想知道，他怎样待身边没有身份、也帮不上他的人。',
    '我盼他心地温和，也能担事。家里遇上难处，不能只留一句好听的话就走开。',
    '若府里有人做错了小事，我愿先问缘由。他能不能也留些耐心，不轻易伤人？',
    '我想过安稳日子，也愿替人着想。不过有了委屈，我也希望他肯听我说。']},
  内敛:{stage:'等身边人退远些，才慢慢说起心意',lines:[
    '我说话慢些，也不擅在人多时争辩。盼他肯等我说完，别把沉默当作答应。',
    '若能安安静静坐在一处，各做各的事，也不觉得生分，我便觉得很好。',
    '名帖上的话我都看了。只是想先单独相谈，不要有许多人在旁边等我点头。',
    '我有时想独自待一会儿，并不是恼了谁。若他懂得这点，我们应当能少些误会。']},
  爽直:{stage:'将名帖放下，直截了当地说起自己的要求',lines:[
    '喜欢便说喜欢，不愿便说不愿。我最怕嘴上答应，背地里又是另一番意思。',
    '我若说错了，他可以当面告诉我。他有错时，也不能拿一句家中规矩堵我的嘴。',
    '先把婚后的打算说清。不能求亲时样样都好，成了亲却说从未答应过。',
    '门第可以慢慢议，待人是否坦荡却要先看。我不想天天猜他话里藏着什么。']},
  审慎:{stage:'把想问的事情列在笺上，逐条请你过目',lines:[
    '住在哪里、家用怎样安排、两家如何往来，我都想先谈清楚。不是挑剔，是怕日后为难。',
    '先别急着定日子。名帖可以写得周全，许下的事还得看他能不能做到。',
    '若彼此习惯不同，可以慢慢商量。但不能一方已经作了决定，才来知会另一方。',
    '我想多见他几回。寻常日子怎样相处，比一回相看时说得好不好更要紧。']},
  自矜:{stage:'把名帖整齐放好，谈起婚事时仍认真守着自己的分寸',lines:[
    '我盼他敬重我的见识，不只是敬重公主的封号。若句句都是奉承，我会听得出来。',
    '我自有珍惜的名声和心血。婚后可以彼此指正，却不该在人前拿对方取笑。',
    '我不想只做一门体面的亲事。旁人看着般配，还得我们自己愿意相处。',
    '请先听他怎样谈自己的志向。我也会认真回答，不必因为我的身份处处退让。']}
};
const PRINCESS_MARRIAGE_INTERESTS={
  books:['她还想保留自己的书案，有所得时能与对方谈，有不同见解也能各自留下。','说起读书，她更在意能否相互启发，不要求对方连喜欢的篇章也一样。','她希望婚后仍有工夫读自己喜欢的书，不必事事都围着婚仪与应酬转。'],
  riding:['她问婚后还能否练骑射，不愿将弓马一并收进嫁妆箱。','她希望能在护卫随行时出门走走，也愿听对方说自己想去的地方。','谈到骑射，她想先约一回校场相看；肯认真相处，比刻意让她赢更好。'],
  kindness:['她想在府里养些花木，闲时亲手照料，不把日子全交给管事安排。','她惦记的是一日三餐、冷暖起居，盼婚后这些小事也有人一起商量。','她想把新家安顿得舒适些，亲人来坐坐时，不必始终拘着礼数。']
};
const PRINCESS_MARRIAGE_CONCERNS={
  灵动:'近来没什么心思说笑。若要相看，能否先容我缓一缓，不必催着我作答？',
  好奇:'从前只想问他见过什么，如今更想知道，遇上难处时他会怎样面对。',
  好胜:'我会把自己的日子撑起来，却不想在心绪未定时，匆匆作一辈子的决定。',
  仁厚:'家里的牵挂还放不下。我盼将来身边的人肯体谅，也愿听听他的难处。',
  内敛:'有些心事我一时说不清。请先不要替我作答，等我慢慢想明白。',
  爽直:'我如今心里难受，就不装作欢喜。婚事可以谈，但请别催我立刻点头。',
  审慎:'近来事情多，我想先把家里的安排问清，再认真考虑自己的婚事。',
  自矜:'我会守好该守的礼数。只是心里还没有平复，不愿匆忙答应，让彼此为难。'
};
const PRINCESS_MATCH_QUESTIONS={
  official:{灵动:'家里规矩多不多？我能不能按自己的意思安排一场小宴？',好奇:'先别只说他父亲的官职，他自己这些年做过什么？',好胜:'我想听他的本事，不想只听他能靠谁。',仁厚:'家里若有人仗势欺人，他会不会劝阻？',内敛:'婚后要常去各家应酬吗？有些时候，我想留在自己府里。',爽直:'娘家若托他办不合规矩的事，他敢不敢说不？',审慎:'两家的请托、府中账目和人手归谁管，先说明白吧。',自矜:'这门亲事之外，他愿意怎样认识我这个人？'},
  frontier:{灵动:'北境的节庆是什么模样？我想听实话，也要知道怎样给宫里寄信。',好奇:'路上要走多久，那里的风俗又怎样？别只说山川壮阔。',好胜:'我会骑射，却没去过边地。他可别因为这点本领，就说我什么都适应。',仁厚:'若远行，随我去的人怎样安顿？我不愿他们的难处没人问。',内敛:'人生地疏，能否留下熟悉的随侍，让我慢慢适应？',爽直:'来往的路和日后的安排说清楚，我再回答愿不愿意。',审慎:'路程、气候、府中人手和家书往来，都要有确切安排。',自矜:'我愿先听他的想法，但不能只把我当作盟约上的一个名字。'},
  scholar:{灵动:'他会不会只肯谈文章？我还想听听他平日觉得有趣的事。',好奇:'我若问到他不懂的地方，他肯不肯坦然说不知道？',好胜:'文名固然好，我想听他怎样看待旁人的长处。',仁厚:'金榜题名之后，他对从前相识的人还好吗？',内敛:'若两人意见不同，他能不能先听我慢慢说完？',爽直:'读书明理，也得肯认错。不能把什么都辩成自己的道理。',审慎:'将来的差事、用度和住处，他有没有认真想过？',自矜:'我愿与他谈诗文，但不想只听他恭维我的句子。'}
};
function princessMarriageLine(k,pool,salt){
  const offset=voiceHash(`princess-marriage:${k.seed||k.id}:${k.id}:${salt}`);
  return pool[(offset+Math.floor(S.turn/6))%pool.length];
}
function princessMarriageFamilyConcern(k){
  const feeling=k.familyFeeling,m=feeling&&byId(feeling.mother);
  if(m&&S.turn-feeling.turn<=12&&S.turn>=feeling.turn&&(
    feeling.kind==='death'&&!m.alive||feeling.kind==='cold'&&m.alive&&m.cold||feeling.kind==='departure'&&m.alive&&m.gone))
    return {mother:m,kind:feeling.kind};
  return null;
}
function princessMarriageContext(k){
  const concern=princessMarriageFamilyConcern(k);
  if(concern){
    const name=fullName(concern.mother);
    if(concern.kind==='death')return `提到已故的${name}，她的声音低了些：“若她还在，也想听听她的意见。”`;
    if(concern.kind==='cold')return `她仍牵挂冷宫中的${name}，问日后是否还能按宫规传信、送些衣物。`;
    return `她惦记离宫的${name}，希望婚后仍能依规问安，知道彼此的近况。`;
  }
  const guest=rememberedMatch(k);
  if(guest)return `她又提起少年时相识的${guest.name}，想先听听他如今的心意，并没有把旧日相识当作已经定下的亲事。`;
  const plan=PRINCESS_PURSUITS[k.estate?.pursuit];
  if(plan&&k.estate.stage==='done')return `她说起自己办成的“${plan.title}”，盼婚后仍能保有做事的余地。`;
  if(plan&&k.estate.stage==='working')return `府里的“${plan.title}”还在筹办，她希望先把手头的事情安排妥当。`;
  if(YOUTH_IDEALS[k.youthIdeal])return `她记得少年时说过，希望遇见${YOUTH_IDEALS[k.youthIdeal]}如今仍想认真看一看。`;
  const peer=k.peerMemory&&kidById(k.peerMemory.person);
  if(peer?.alive&&relGet(k,peer)>=30&&S.turn-k.peerMemory.turn<=24)
    return `她说与${kidName(peer)}相处时，意见不同也能说开；将来与驸马相处，她也盼有这样的自在。`;
  const hobby=marriageNature(k).hobby;
  return princessMarriageLine(k,PRINCESS_MARRIAGE_INTERESTS[hobby]||PRINCESS_MARRIAGE_INTERESTS.kindness,'interest');
}
function princessMarriageVoice(k){
  const trait=childDisposition(k),rule=PRINCESS_MARRIAGE_VOICES[trait],concern=princessMarriageFamilyConcern(k);
  const quote=concern?PRINCESS_MARRIAGE_CONCERNS[trait]:princessMarriageLine(k,rule.lines,'wish'),context=princessMarriageContext(k);
  return {quote,context,emotion:concern?-.3:.3,text:`${kidName(k)}${concern?'谈起婚事，仍有放不下的心事':rule.stage}。\n“${quote}”\n${context}`};
}
function rememberPrincessMarriageVoice(k,voice){
  if(!marriageReady(k))return;
  const key=voice.quote+'|'+voice.context,previous=k.marriageVoiceMemory;
  if(previous?.key===key&&S.turn-previous.turn<6)return;
  k.marriageVoiceMemory={key,turn:S.turn};
  princessMemory(k,'princess_marriage_wish',`【议亲心意】向父皇说起：“${voice.quote}”${voice.context}`,'宫中',voice.emotion);
}
function princessMatchVoice(k,id){
  const question=PRINCESS_MATCH_QUESTIONS[id]?.[childDisposition(k)];
  return question?`${k.name}问：“${question}”`:PRINCESS_MATCHES[id].note;
}

function princessMemory(k,type,text,location='公主府',emotion=.7){
  kstory(k,text);
  NPCMemory.record(S,{type,time:S.turn,location,participants:[k.id],outcome:text},[
    {person:k.id,subject:'emperor',interpretation:text,emotion,impact:70}
  ]);
}

function princessOpening(k){
  const pursuit=princessPursuit(k);
  return {title:'公主开府来信',por:k,valid:()=>canOpenPrincess(k)&&!k.estate,text:`${kidName(k)}亲手递来一封信。\n「${PRINCESS_PURSUITS[pursuit].wish}」\n她已相中一处府邸，请你准她自理府中事务。`,choices:[
    {t:'准她开府，由她自理',f:()=>{
      if(!canOpenPrincess(k)||k.estate)return null;
      k.estate={pursuit,opened:S.turn,stage:'proposal',nextVisit:S.turn+2,route:k.princessMarriage||(k.married?'married':'independent')};
      princessMemory(k,'princess_estate','获准开府，可以自行安排府中事务。');
      log(`${kidName(k)}开府，设于京城。`,1);
      save('auto');
      return '她谢了恩，请你得空去府里看一看。';
    }},
    {t:'三个月后再议',f:()=>{if(!canOpenPrincess(k)||k.estate)return null;k.estateDeferred=S.turn+3;save('auto');return '她把府邸的图样留在御案上，等日后再谈。';}}
  ]};
}

function princessMarriage(k){
  const preference=k.estate?.pursuit||princessPursuit(k);
  const order=preference==='books'?['scholar','official','frontier']:preference==='archery'?['frontier','scholar','official']:['official','scholar','frontier'];
  const voice=princessMarriageVoicesActive()?princessMarriageVoice(k):null;
  return {title:'公主婚事',por:k,valid:()=>marriageReady(k),...(voice?{onShow:()=>rememberPrincessMarriageVoice(k,voice)}:{}),text:voice?.text||`${kidName(k)}请你先看她写的笺子：「${PRINCESS_PURSUITS[preference].wish}」\n她愿意与你逐一谈谈求亲的人。`,choices:[
    ...(rememberedMatch(k)?[{t:'谈谈少年时相识的'+rememberedMatch(k).name,f:()=>{pushNow(rememberedMatchEvent(k));return null;}}]:[]),
    ...order.map(id=>({t:`听她谈谈${PRINCESS_MATCHES[id].name}`,f:()=>{pushNow(princessMatchReview(k,id));return null;}})),
    {t:'由她安排，半年后再谈',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '她收起名帖，说等有了主意会来找你。';}}
  ]};
}
function princessMatchReview(k,id){
  const match=PRINCESS_MATCHES[id],person=marriageCandidate(k,id);save('auto');
  return {title:'灯下谈婚事',cast:[k,person],valid:()=>marriageReady(k),text:`${person.name} · ${kidAge(person)}岁 · ${match.name}\n${princessMarriageVoicesActive()?princessMatchVoice(k,id):match.note}\n${marriageProfileText(k,person)}${id==='official'?'\n婚仪需国库五十万两。':''}\n她把名帖推过来，等你回答。`,choices:[
    {t:id==='scholar'?'准她自择驸马':id==='frontier'?'允准和亲':'允准这门亲事',cond:()=>marriageReady(k)&&(id!=='official'||E().treasury>=50),f:()=>{
      if(!marriageReady(k)||(id==='official'&&E().treasury<50))return null;
      k.married=true;k.spouse={...person,marriedAt:S.turn};
      if(k.estate)k.estate.route=id;
      k.princessMarriage=id;
      princessMemory(k,'princess_marriage',`婚事议定：${person.name}（${match.name}）。`);
      log(`${kidName(k)}与${person.name}议定婚事。`,1);
      const mother=byId(k.mom);
      if(id==='frontier'&&mother?.alive)cchg(mother,{mood:-18,aff:-5});
      if(id==='scholar')k.love=clamp(k.love+15);
      const gains=id==='frontier'?chg({prestige:3,people:6}):id==='official'?chg({prestige:4,treasury:-50}):'父爱+15';
      ensureMarriedLife(k);save('auto');return fx(gains);
    }},
    {t:'先让两人谈谈日常',f:()=>{pushNow(marriageMeeting(k,person,()=>princessMatchReview(k,id)));return null;}},
    {t:'再看别的人选',f:()=>{pushNow(princessMarriage(k));return null;}},
    {t:'先不定亲',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '她把名帖收回，婚事暂且搁下。';}}
  ]};
}
function princessMilestone(k){
  if(!canOpenPrincess(k))return null;
  if(!k.estate){
    if(journalContentVersion()<53){if(S.turn>=(k.estateDeferred??0))return princessOpening(k);}
    else if(k.estateDeferred===undefined){
      if(k.estateInvitationChecked)return null;
      k.estateInvitationChecked=true;
      return chance(.30)?princessOpening(k):null;
    }
  }
  if(journalContentVersion()>=53&&!marriageReady(k))return null;
  if(!k.married&&(!k.asked||k.marriageAfter!==undefined)&&S.turn>=(k.marriageAfter??0)){
    const event=princessMarriage(k);
    return {...event,onShow:()=>{event.onShow?.();k.asked=true;delete k.marriageAfter;}};
  }
  return null;
}
A.openPrincess=function(id){
  const k=kidById(id);
  if(!S.over&&canOpenPrincess(k)&&!k.estate&&!modalOpen&&S.turn>=(k.estateDeferred??0))pushEv(princessOpening(k));
};
A.princessMarriage=function(id){
  const k=kidById(id);
  if(canOpenPrincess(k)&&marriageReady(k)&&!modalOpen){
    const event=princessMarriage(k);
    pushEv({...event,onShow:()=>{event.onShow?.();k.asked=true;delete k.marriageAfter;}});
  }
};
function princessActions(k,showEstate=true){
  if(!canOpenPrincess(k))return '';
  const canRead=S.turn>=(k.estateDeferred??0);
  return `<div class="acts">${k.estate?(showEstate?`<button class="btn jade" onclick="A.go('princess',${k.id})">公主府</button>`:''):
    `<button class="btn jade" onclick="A.openPrincess(${k.id})" ${canRead?'':'disabled'}>${journalContentVersion()>=53?'商议开府':'开府来信'}${canRead?'':'<small>她暂且搁下了此事</small>'}</button>`}
    ${showEstate?'':marriageButton(k)}</div>`;
}

function archivePrincessEstates(heir){
  const estates=kidsAlive().filter(k=>k.estate);
  if(!estates.length)return;
  S.princessRelatives=[...archivedPrincesses(),...estates.map(k=>({...k,estate:{...k.estate},reign:S.gen,kinship:(journalContentVersion()>=45?royalBirthOrder(k,heir)<0:k.born<=heir.born)?'皇姐':'皇妹'}))];
}
const princessKinship=k=>journalContentVersion()>=45?royalKinship(k):k.reign===S.gen-1?k.kinship||'先帝之女':'宗亲';
function princessMapNotice(){
  const k=estatePrincesses().find(p=>p.estate.stage==='proposal'||(p.estate.stage==='working'&&S.turn>=p.estate.due));
  return k?`<div class="season-map-leads">${esc(k.name)}的府上送了信。 <button class="btn sm" onclick="A.go('princess',${k.id})">去公主府读信</button></div>`:'';
}
function princessEstatePanel(){
  const estates=estatePrincesses();
  if(!estates.length)return '';
  return `<section class="palace-activity"><h3>公主府</h3><div class="grid">${estates.map(k=>`<button class="card" onclick="A.go('princess',${k.id})">${porImg(k,44)}
    <span class="grow"><b>${esc(kidName(k))}</b><small>${k.reign?princessKinship(k)+' · ':''}${princessLetterLabel(k.estate)}</small></span></button>`).join('')}</div></section>`;
}
function princessLetterLabel(estate){
  if(estate.stage==='proposal')return '府中有一封新信';
  if(estate.stage==='working')return S.turn>=estate.due?'送来了办成的消息':'府中正在筹办';
  return S.turn>=estate.nextVisit?'可邀她回宫':'府中日常';
}
function viewPrincessEstate(){
  const k=princessById(UI.sel),e=k?.estate;
  if(!k?.alive||!e)return viewOut();
  const plan=PRINCESS_PURSUITS[e.pursuit];
  const ready=e.stage==='working'&&S.turn>=e.due;
  const message=e.stage==='proposal'?plan.wish:ready?plan.result:e.stage==='working'?`府上说还需 ${e.due-S.turn} 个月。`:'她已办成这件事，近来常把府中的消息寄到宫里。';
  const local=(e.route||k.princessMarriage)!=='frontier';
  const mother=k.reign&&familyHostById(k.mom);
  const motherLink=mother?.familyArchive?`<button class="person-link" onclick="A.go('consort',${mother.id})">${esc(k.momName||fullName(mother))}</button>`:outsideMotherLink(k);
  return `<button class="btn quiet sm" onclick="A.go('out')">← 返回出巡</button>
    <header class="detail-head">${porImg(k,112)}<div class="grow"><p>${k.reign?princessKinship(k)+' · ':''}${local?'京城府邸':'北境来信'}</p><h2>${esc(kidName(k))} · 公主府</h2><p>生母 ${motherLink}</p></div></header>
    <section class="palace-activity"><h3>${plan.title}</h3><p>${esc(message)}</p><div class="acts">
    ${e.stage==='proposal'||ready?`<button class="btn gold" onclick="A.princessLetter(${k.id})">${ready?'读她的回信':'读府中来信'}</button>`:''}
    ${S.turn>=e.nextVisit?`<button class="btn jade" onclick="A.princessVisit(${k.id})">${local?'请她回宫探亲':'写信邀她还宫'}</button>`:''}</div></section>
    ${xieCapitalEstate(k)?detailSection('婚事与心意',youthPanel(k)):''}
    ${marriagePanel(k)}
    ${householdPanel(k)}
    ${detailSection('府中记事',detailStory(k))}`;
}
A.princessLetter=function(id){
  const k=princessById(id),e=k?.estate;
  if(S.over||modalOpen||!k?.alive||!e)return;
  const plan=PRINCESS_PURSUITS[e.pursuit];
  if(e.stage==='proposal'){
    const start=(mode,months,cost)=>()=>{
      if(e.stage!=='proposal'||E().treasury<cost)return null;
      if(cost)chg({treasury:-cost});
      Object.assign(e,{stage:'working',mode,due:S.turn+months});
      princessMemory(k,'princess_project',`${plan.title}：${mode}。`);
      save('auto');return `她写信道谢，预计 ${months} 个月后有回音。`;
    };
    pushEv({title:`公主来信 · ${plan.title}`,por:k,text:plan.wish,choices:[
      {t:'拨银二十万两',cond:()=>E().treasury>=20,why:'国库不足',f:start('拨银相助',2,20)},
      {t:'替她引荐合适的人',f:start('引荐人手',3,0)},
      {t:'让她用府中人手慢慢办',f:start('自行筹办',4,0)}
    ]});
  }else if(e.stage==='working'&&S.turn>=e.due){
    pushEv({title:'府中回信',por:k,text:plan.result,choices:[{t:'记入起居注',f:()=>{
      if(e.stage!=='working')return null;
      e.stage='done';k[plan.stat]=clamp(k[plan.stat]+5);
      princessMemory(k,'princess_result',plan.result);
      log(`${kidName(k)}：${plan.title}已办成。`,1);save('auto');return null;
    }},{t:'稍后再读'}]});
  }
};
A.princessVisit=function(id){
  const k=princessById(id),e=k?.estate;
  if(S.over||modalOpen||!k?.alive||!e||S.turn<e.nextVisit)return;
  const mother=!k.reign&&byId(k.mom);
  const parent=k.reign?`新君与${princessKinship(k)}在宫里叙了旧。`:mother?.alive&&!mother.gone&&!mother.cold?`她与${cName(mother)}在廊下坐了半日，说起开府后的日子。`:'她在宫里走了走，在从前住的地方停了一会儿。';
  const far=(k.princessMarriage||e.route)==='frontier';
  const text=far?`她托来京的使者带回一封家书：「${e.stage==='done'?'府中的事已经办妥，愿宫中安好。':'等府中事务安顿，我再寻机会回来。'}」`:parent;
  pushEv({title:far?'北境家书':'回宫探亲',por:k,text,choices:[{t:far?'回信问安':'留她用膳',f:()=>{
    if(S.turn<e.nextVisit)return null;
    e.nextVisit=S.turn+4;k.love=clamp(k.love+5);
    if(!far&&mother?.alive&&!mother.gone&&!mother.cold){cchg(mother,{mood:6});story(mother,`${k.name}回宫探亲，母女叙话。`);}
    princessMemory(k,'princess_visit',text,far?'公主府':'宫中');
    log(`${kidName(k)}${far?'从北境寄回家书':'回宫探亲'}。`);save('auto');return null;
  }},{t:'改日再说'}]});
};
