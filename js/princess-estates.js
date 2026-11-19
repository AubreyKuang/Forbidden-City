/* 公主开府、议婚、府中事务与还宫 */
const PRINCESS_PURSUITS = {
  books: {title:'整理一部书', wish:'我想把宫里旧书校清楚，抄一部留给弟妹。', result:'校成的书已经装订好，她在第一页写上了帮忙校对的人。', stat:'lit',
    next:{title:'设书案供人借阅',wish:'校完的书若全锁在柜里，未免可惜。我想腾出两间屋子，把可借的抄本登记下来，供附近读书人借阅。',result:'书案开张后，第一册借出去的是一本旧游记。还书的人夹回一张纸，补上了书里漏写的一个地名。她把纸留下，夹进了底本。'}},
  archery: {title:'办一场女骑赛', wish:'我想请城中善骑的女子来比试，也给初学的人留一场。', result:'女骑赛已办完。她将第一支彩箭带回，说要留给当初教她骑马的人。', stat:'mar',
    next:{title:'开设女骑习场',wish:'上回看赛的人里，有几个说自己连缰绳都不会拿。我想请教习每旬带一场，从牵马和上鞍开始教。',result:'习场办了起来。头一批学员里有个姑娘先前连马都不敢牵，如今已能独自绕场一圈。她请教习把这个名字记在第一册。'}},
  near: {title:'安一座近宫的府', wish:'我想住得离宫门近些，时常能回来看看母亲，也请弟妹到府里坐坐。', result:'府里的小厅已经布置好，她在窗前留了一张母亲从前喜欢的椅子。', stat:'vir',
    next:{title:'编一册亲眷手记',wish:'我想请各房亲眷寄来自己记得的小事，连同旧菜谱、旧书签一道抄下来。等他们来府上，就放在小厅慢慢翻。',result:'手记整订好了。一页写着家宴上做过的点心，另一页夹着旧书签的摹本。各房都收到一册，府里还留着一册，可以随时添写。'}}
};
const PRINCESS_MATCHES = {
  whiteSpring:{name:'白泉国来使为本国望族求亲',note:'来使带来母族故地的婚书和商路图，盼两边约定家书的驿期。'},
  official:{name:'重臣之子', note:'他的家人能在朝中照应她，她担心婚后很难拒绝娘家的请托。'},
  frontier:{name:'北境来使为本部求亲', note:'她问，远行之后可否继续给母亲写信，又能否保留自己的府中人手。'},
  scholar:{name:'她愿意交往的进士', note:'两人谈过她想做的事。对方愿先来见她，等她自己作答。'}
};

const archivedPrincesses=()=>S.princessRelatives||[];
const estatePrincesses=()=>[...kidsAlive().filter(k=>k.estate),...archivedPrincesses()].filter(k=>k.alive&&k.estate&&!royalJourneyAway(k));
const princessById=id=>{const k=kidById(id)||archivedPrincesses().find(k=>k.id===id);return royalJourneyAway(k)?undefined:k;};
const canOpenPrincess=k=>k?.alive&&!royalJourneyAway(k)&&!k.templeStay&&!k.removedFromRoyal&&k.sex==='f'&&kidAge(k)>=15&&!k.jailed;
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

function createPrincessEstate(k,pursuit){
  return {pursuit,opened:S.turn,stage:'proposal',nextVisit:S.turn+2,route:k.princessMarriage||(k.married?'married':'independent')};
}
function openMaritalEstate(k){
  if(k.sex!=='f'||!k.married||k.estate||!PalaceActions.maritalEstates||!canOpenPrincess(k)||k.away||k.pendingName||
    k.parentage?.decision==='household'||k.birthSwap?.occurred&&k.parentage?.decision==='family')return '';
  const estate=k.estate=createPrincessEstate(k,princessPursuit(k));
  const frontier=estate.route==='frontier';
  estate.location=frontier?princessMarriageLand(k):'京城';
  const line=frontier?`婚后在${estate.location}立下公主府，与宫中仍以家书往来。`:'婚后迁入京中公主府。随行的宫人把最后一箱书送进新居，她提笔给宫里报了平安。';
  princessMemory(k,'princess_estate',line,frontier?estate.location:'公主府');
  log(kidName(k)+line,1);
  return kidName(k)+line;
}
function settleMarriedPrincessEstates(){
  if(S&&PalaceActions.maritalEstates)S.children.forEach(openMaritalEstate);
}

function princessOpening(k){
  const pursuit=princessPursuit(k);
  return {title:'公主开府来信',por:k,valid:()=>canOpenPrincess(k)&&!k.estate,text:`${kidName(k)}亲手递来一封信。\n「${PRINCESS_PURSUITS[pursuit].wish}」\n她已相中一处府邸，请你准她自理府中事务。`,choices:[
    {t:'准她开府，由她自理',f:()=>{
      if(!canOpenPrincess(k)||k.estate)return null;
      k.estate=createPrincessEstate(k,pursuit);
      princessMemory(k,'princess_estate','获准开府，可以自行安排府中事务。');
      log(`${kidName(k)}开府，设于京城。`,1);
      save('auto');
      return '她谢了恩，请你得空去府里看一看。';
    }},
    {t:'三个月后再议',f:()=>{if(!canOpenPrincess(k)||k.estate)return null;k.estateDeferred=S.turn+3;save('auto');return '她把府邸的图样留在御案上，等日后再谈。';}}
  ]};
}

const princessMarriageLand=k=>k.spouse?.route==='whiteSpring'?'白泉国':'北境';
const whiteSpringMatchReady=k=>storyCastCivicActive()&&whiteSpringChild(k)&&k.sex==='f'&&marriageReady(k);
function whiteSpringMatchReview(k){
  if(!whiteSpringMatchReady(k))return null;
  const p=marriageCandidate(k,'whiteSpring');
  const wish=k.whiteSpringStudy?'她自己用白泉话问了归程和驿期，当面听完了答复。':'她请通译把婚书再念了一遍，先问成亲后家书要从哪一站递。';
  const valid=()=>whiteSpringMatchReady(k);
  return {title:'白泉婚书 · 母亲的故乡',cast:[k,p],valid,text:p.name+'出自白泉国的商驿世家，与公主外祖家并无亲缘。'+wish+'\n'+k.name+'说：“我愿意随他去白泉。我想看看母亲小时候走过的街，也想让您收到我的第一封信。”',
    choices:[{t:'准她和亲白泉，留驿路通家书',cond:valid,f:()=>{
      if(!valid())return null;
      const gains=settlePrincessMarriage(k,p,'frontier','白泉国商驿世家');
      k.estate||={pursuit:princessPursuit(k),opened:S.turn,stage:'proposal',route:'frontier'};
      k.estate.location='白泉国';k.estate.nextVisit=S.turn+2;
      const mother=byId(k.mom);
      if(mother?.alive){story(mother,'女儿'+k.name+'自愿和亲白泉，临行托她捎一句故乡平安。');cchg(mother,{mood:3});}
      save('auto');return '公主收好婚书，命随行人记下第一处可寄家信的驿站。'+fx(gains);
    }},{t:'先让两人谈谈日常',f:()=>{pushNow(marriageMeeting(k,p,()=>whiteSpringMatchReview(k)));return null;}},
      {t:'再看别的人选',f:()=>{pushNow(princessMarriage(k));return null;}},{t:'暂缓半年',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '公主收好路图，婚书留待日后再议。';}}]};
}
function princessMarriage(k){
  const preference=k.estate?.pursuit||princessPursuit(k);
  const order=preference==='books'?['scholar','official','frontier']:preference==='archery'?['frontier','scholar','official']:['official','scholar','frontier'];
  const voice=princessMarriageVoicesActive()?princessMarriageVoice(k):null;
  return {title:'公主婚事',por:k,valid:()=>marriageReady(k),...(voice?{onShow:()=>rememberPrincessMarriageVoice(k,voice)}:{}),text:voice?.text||`${kidName(k)}请你先看她写的笺子：「${PRINCESS_PURSUITS[preference].wish}」\n她愿意与你逐一谈谈求亲的人。`,choices:[
    ...(typeof linJianxiProposalReady==='function'&&linJianxiProposalReady(k)?[{t:'听林见溪的求亲回话',f:()=>{pushNow(linJianxiProposalEvent(k));return null;}}]:[]),
    ...(rememberedMatch(k)?[{t:'谈谈少年时相识的'+rememberedMatch(k).name,f:()=>{pushNow(rememberedMatchEvent(k));return null;}}]:[]),
    ...(whiteSpringMatchReady(k)?[{t:'听她谈白泉国的和亲婚书',f:()=>{pushNow(whiteSpringMatchReview(k));return null;}}]:[]),
    ...order.map(id=>({t:`听她谈谈${PRINCESS_MATCHES[id].name}`,f:()=>{pushNow(princessMatchReview(k,id));return null;}})),
    {t:'由她安排，半年后再谈',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '她收起名帖，说等有了主意会来找你。';}}
  ]};
}
function settlePrincessMarriage(k,person,id,description=PRINCESS_MATCHES[id].name){
  k.married=true;k.spouse={...person,marriedAt:S.turn};
  if(k.estate)k.estate.route=id;
  k.princessMarriage=id;
  if(person.route==='whiteSpring'){
    princessMemory(k,'princess_marriage','循母亲当年的来路远嫁白泉国，与'+person.name+'安家，约好循驿路给宫中寄信。','白泉国');
    log(kidName(k)+'和亲白泉国，与'+person.name+'在白泉定居。',1);
  }else{
    princessMemory(k,'princess_marriage',`婚事议定：${person.name}（${description}）。`);
    log(`${kidName(k)}与${person.name}议定婚事。`,1);
  }
  const mother=byId(k.mom);
  if(id==='frontier'&&person.route!=='whiteSpring'&&mother?.alive)cchg(mother,{mood:-18,aff:-5});
  if(id==='scholar')k.love=clamp(k.love+15);
  const gains=id==='frontier'?chg({prestige:3,people:6}):id==='official'?chg({prestige:4,treasury:-50}):'父爱+15';
  ensureMarriedLife(k);return gains;
}
function princessMatchReview(k,id){
  const match=PRINCESS_MATCHES[id],person=marriageCandidate(k,id);save('auto');
  return {title:'灯下谈婚事',cast:[k,person],valid:()=>marriageReady(k),text:`${person.name} · ${kidAge(person)}岁 · ${match.name}\n${princessMarriageVoicesActive()?princessMatchVoice(k,id):match.note}\n${marriageProfileText(k,person)}${id==='official'?'\n婚仪需国库五十万两。':''}\n她把名帖推过来，等你回答。`,choices:[
    {t:id==='scholar'?'准她自择驸马':id==='frontier'?'允准和亲':'允准这门亲事',cond:()=>marriageReady(k)&&(id!=='official'||E().treasury>=50),f:()=>{
      if(!marriageReady(k)||(id==='official'&&E().treasury<50))return null;
      const gains=settlePrincessMarriage(k,person,id),move=openMaritalEstate(k);save('auto');return move+fx(gains);
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
const princessFollowupDue=e=>!!e.followup&&e.followup.finished===undefined&&S.turn>=e.followup.due;
function princessMapNotice(){
  const k=estatePrincesses().find(({estate:e})=>e.stage==='proposal'||e.stage==='working'&&S.turn>=e.due||princessFollowupDue(e));
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
  if(princessFollowupDue(estate))return '续办的事已有回音';
  if(estate.followup&&estate.followup.finished===undefined)return '续办的事正在筹备';
  return S.turn>=estate.nextVisit?(estate.route==='frontier'?'可读远方家书':'可邀她回宫'):'府中日常';
}
function princessFollowupPanel(k,project){
  const e=k.estate,f=e.followup;
  if(e.stage!=='done')return '';
  const due=princessFollowupDue(e),finished=f?.finished!==undefined;
  const status=finished?project.result:!f?project.wish:due?'府里送来了办成这件事的回信。':`${f.mode} · 约 ${f.due-S.turn} 个月后有回音`;
  return detailSection(project.title,`<p>${esc(status)}</p>${!finished&&(!f||due)?`<button class="btn ${due?'gold':'jade'}" onclick="A.princessFollowup(${k.id})">${due?'读续办回信':'商议这件事'}</button>`:''}`);
}
const princessEstateLocal=k=>!k.away&&k.estate.route!=='frontier'&&k.princessMarriage!=='frontier'&&(!k.estate.location||k.estate.location==='京城');
const princessEstateVisitReady=k=>!S.over&&!!k?.alive&&!!k.estate&&princessEstateLocal(k)&&!k.jailed&&!k.templeStay&&!k.removedFromRoyal&&S.turn>=(k.estate.nextCall??0);
// A visit carries the original household child's id. The marriage and the family's home stay in White Spring.
function whiteSpringGrandmother(k){
  if(journalContentVersion()<78||k?.sex!=='f'||k.spouse?.route!=='whiteSpring'||!whiteSpringChild(k))return null;
  const mother=familyHostById(k.mom);
  return mother?.fixedStory==='ayimu'?mother:null;
}
function whiteSpringHostReady(m){
  if(!m?.alive)return false;
  if(!m.familyArchive)return inPalace(m);
  return [S.flags.dowager,S.flags.birthDowager].some(d=>d?.personId===m.id&&d.alive);
}
function whiteSpringGrandchildren(k){
  return princeResidentChildren(k).filter(c=>c.mother===k.id&&c.alive!==false);
}
const whiteSpringKinTerm=c=>c.sex==='f'?'外孙女':'外孙';
const whiteSpringInPalace=k=>k?.household?.whiteSpringVisit?.stage==='palace';
function whiteSpringFamilyMemory(k,m,c,title,daughter,grandmother,child,place){
  princessMemory(k,'white_spring_family','【'+title+'】'+daughter,place);
  if(m?.alive&&grandmother){
    story(m,'【'+title+'】'+grandmother);
    const d=[S.flags.dowager,S.flags.birthDowager].find(d=>d?.personId===m.id&&d.alive);
    if(d)dowagerRecord(d,title,grandmother);
  }
  c.story ||= [];kstory(c,'【'+title+'】'+child);
}
function whiteSpringBirthLetter(k,c){
  const m=whiteSpringGrandmother(k);if(!m?.alive)return;
  const term=whiteSpringKinTerm(c);
  const letter='母亲亲启：孩子取名'+c.name+'。我把您从前哄我睡的歌轻轻唱了一遍，还没唱到末一句，孩子就睡着了。女儿平安，您也好好吃饭。';
  whiteSpringFamilyMemory(k,m,c,'白泉报喜', '产后亲笔给母亲报平安，写下了'+c.name+'的名字。',
    '收到女儿'+k.name+'的报喜信，把'+term+c.name+'的名字轻声念了几遍，又托回程的使者带去一顶软帽。',
    '降生在白泉。母亲写信告诉外祖母我的名字，外祖母从宫里寄来一顶软帽。','白泉国');
  log(k.name+'自白泉寄来家书，向阿依慕报了'+c.name+'的喜讯。',1);
  pushEv({title:'白泉家书 · 添丁报喜',cast:[k,m,c],text:letter+'\n阿依慕读完，又把落款看了一遍：“她小时候也爱听这支曲子。”',choices:[{t:'把回信和软帽交给白泉来使'}]});
}
function whiteSpringCanInvite(k,c,m){
  const h=k?.household;
  return !!(h&&c&&k.alive&&!S.over&&!k.jailed&&!k.gone&&!k.templeStay&&!royalJourneyAway(k)&&whiteSpringHostReady(m)&&
    !h.whiteSpringVisit&&S.turn>=(h.whiteSpringNextVisit??0)&&kidAge(c)>=3&&whiteSpringGrandchildren(k).includes(c));
}
function whiteSpringInvitation(k,c,m){
  const valid=()=>whiteSpringCanInvite(k,c,m);
  return {title:'白泉家书 · 接女儿回宫',cast:[m,k,c],valid,text:'阿依慕摊开女儿的信。'+k.name+'写道：“'+c.name+'听说我小时候也在宫里住过，追着问我：外祖母窗外的树，如今有多高了？”\n白泉的使团正要返程，可以托使者带去家信。公主和孩子下月抵京，住两个月。',
    choices:[{t:'请公主带'+c.name+'回宫小住',f:()=>{if(!valid())return null;
      k.household.whiteSpringOffered=true;
      k.household.whiteSpringVisit={child:c.id,stage:'invited',due:S.turn+1};
      log('遣使赴白泉，请'+k.name+'带'+c.name+'回宫探望阿依慕。');save('auto');
      return '阿依慕在信尾添了一行：“屋里有被褥，路上少带些东西。”';
    }},{t:'容她们另择归期'}]};
}
A.whiteSpringInvite=function(id,childId){
  const k=royalById(id),m=whiteSpringGrandmother(k),c=k&&whiteSpringGrandchildren(k).find(c=>c.id===childId);
  if(!modalOpen&&whiteSpringCanInvite(k,c,m))pushEv(whiteSpringInvitation(k,c,m));
};
function whiteSpringFamilyTick(k){
  const m=whiteSpringGrandmother(k),h=k.household,v=h?.whiteSpringVisit;
  if(!h||(!m&&!v))return;
  const children=whiteSpringGrandchildren(k);
  if(v){
    const c=children.find(c=>c.id===v.child);
    if(!k.alive||k.gone||k.jailed||k.templeStay||royalJourneyAway(k)||!c||!whiteSpringHostReady(m)){
      if(k.alive&&c)whiteSpringFamilyMemory(k,m,c,'探亲改期',v.stage==='palace'?'因宫中情势有变，带'+c.name+'提前归家。':'收到改期的消息，带'+c.name+'留在白泉。',
        null,v.stage==='palace'?'随母亲提前回了白泉。':'随母亲在白泉等下一封家书。','白泉国');
      delete h.whiteSpringVisit;return;
    }
    if(S.turn<v.due)return;
    if(v.stage==='invited'){
      v.stage='palace';v.due=S.turn+2;
      whiteSpringFamilyMemory(k,m,c,'白泉归宁','牵着'+c.name+'走进母亲屋里，认出窗边还是自己从前坐的小凳。',
        '接到女儿'+k.name+'和'+whiteSpringKinTerm(c)+c.name+'。特意把小凳摆回窗下，让孩子自己挑地方坐。',
        '跟母亲进宫看望外祖母阿依慕。她替我留了一张靠窗的小凳。','宫中');
      log(k.name+'携'+c.name+'抵京，在宫中与阿依慕小住两个月。',1);
      pushEv({title:'白泉归宁 · 窗边的小凳',cast:[k,m,c],text:k.name+'才跨过门槛，'+c.name+'就仰起脸去看窗外的树。阿依慕把小凳搬近一些。公主笑了：“母亲，我当年也是站在这里量个头的。”',choices:[{t:'留她们一家慢慢叙话'}]});
    }else{
      delete h.whiteSpringVisit;h.whiteSpringNextVisit=S.turn+36;
      whiteSpringFamilyMemory(k,m,c,'辞宫返白泉','小住期满，带'+c.name+'向母亲辞行，约定到了白泉便捎信。',
        '送女儿'+k.name+'和'+whiteSpringKinTerm(c)+c.name+'到宫门，等车过了转角才回去。',
        '随母亲回白泉，把外祖母送的小布袋系在了行囊上。','白泉国');
      log(k.name+'携'+c.name+'辞别阿依慕，启程返回白泉。',1);
    }
    return;
  }
  if(!k.alive||!whiteSpringHostReady(m))return;
  for(const c of children){
    if(S.turn-c.born===12&&!c.whiteSpringBirthday){
      c.whiteSpringBirthday=true;
      whiteSpringFamilyMemory(k,m,c,'白泉周岁','收到母亲为'+c.name+'量鞋样的细绳，把孩子的脚长比好，随信寄回。',
        '惦记'+whiteSpringKinTerm(c)+c.name+'周岁，托女儿量量脚长，好裁一双软底鞋。','周岁时，母亲替我量了脚长。外祖母要照着绳上的结给我做鞋。','白泉国');
    }
  }
  const first=children.find(c=>whiteSpringCanInvite(k,c,m));
  if(first&&!h.whiteSpringOffered){h.whiteSpringOffered=true;pushEv(whiteSpringInvitation(k,first,m));}
}
A.whiteSpringFamilySong=function(id){
  const k=royalById(id),m=whiteSpringGrandmother(k),v=k?.household?.whiteSpringVisit;
  const c=v&&whiteSpringGrandchildren(k).find(c=>c.id===v.child);
  const valid=()=>!!(c&&whiteSpringHostReady(m)&&k.alive&&k.household.whiteSpringVisit===v&&v.stage==='palace'&&!v.sang&&!S.over);
  if(modalOpen||!valid())return;
  pushEv({title:'归宁小坐 · 两处乡音',cast:[m,k,c],valid,text:'阿依慕用指节在桌边轻轻叩了三下。'+c.name+'接着把后半句唱完，她反倒愣住了：“咦，我小时候唱的，末一句不是这样。”'+k.name+'笑着让母亲也唱一遍。',
    choices:[{t:'坐下听她们把两种唱法都唱完',f:()=>{if(!valid())return null;v.sang=true;
      whiteSpringFamilyMemory(k,m,c,'两处乡音','听母亲和'+c.name+'各唱一遍白泉旧曲，自己在一旁打拍子。',
        '原以为'+whiteSpringKinTerm(c)+c.name+'忘了末一句，听女儿唱过才明白，故乡如今有了新的唱法。',
        '我把白泉的歌唱给外祖母听。她也教了我一句，是她离乡时的唱法。','宫中');
      k.love=clamp(k.love+3);save('auto');return '唱到末尾，三个人各唱各的尾音，却一齐收了拍。';
    }},{t:'让她们先歇歇'}]});
};
function whiteSpringFamilyPanel(k){
  const m=whiteSpringGrandmother(k);if(!m)return '';
  const h=k.household,children=whiteSpringGrandchildren(k);if(!children.length)return '';
  const v=h.whiteSpringVisit,guest=children.find(c=>c.id===v?.child);
  const status=guest?(v.stage==='invited'?'已捎信相邀，约下月抵京。':'正在宫中陪伴阿依慕，还有 '+Math.max(0,v.due-S.turn)+' 个月启程回白泉。'):
    !whiteSpringHostReady(m)?'眼下宫里无法接待探亲。':S.turn<h.whiteSpringNextVisit?'上次归宁后，再过 '+(h.whiteSpringNextVisit-S.turn)+' 个月可重邀。':'孩子满三岁后，可请公主带回宫中小住。';
  const song=guest&&v.stage==='palace'&&!v.sang&&whiteSpringHostReady(m)?'<button class="btn jade" onclick="A.whiteSpringFamilySong('+royalActionArg(k.id)+')">陪三代人唱一支白泉旧曲</button>':'';
  return detailSection('白泉外家', '<p>'+esc(guest?k.name+'与'+guest.name+' · '+status:status)+'</p>'+song+children.map(c=>
    (whiteSpringCanInvite(k,c,m)?'<button class="btn jade" onclick="A.whiteSpringInvite('+royalActionArg(k.id)+','+royalActionArg(c.id)+')">请公主带'+esc(c.name)+'回宫小住</button>':'')+
    '<details><summary>'+esc(c.name)+' · '+kidAge(c)+'岁 · '+whiteSpringKinTerm(c)+'的记事</summary>'+((c.story||[]).map(e=>'<p>'+esc(e.d)+'　'+esc(e.t)+'</p>').join('')||'<p>尚无记事。</p>')+'</details>').join(''));
}

function princessEstateFamilyPanel(k){
  const e=k.estate,local=princessEstateLocal(k),wait=Math.max(0,(e.nextVisit??0)-S.turn);
  const callWait=Math.max(0,(e.nextCall??0)-S.turn);
  const frontier=(k.princessMarriage||e.route)==='frontier';
  return detailSection('探望与家书',`<div class="acts">${local?`<button class="btn jade" onclick="A.princessEstateCall(${k.id})" ${princessEstateVisitReady(k)&&E().energy>0?'':'disabled'}>到公主府探望<small>${callWait?`还需 ${callWait} 个月`:'精力 −1'}</small></button>`:''}
    ${(local||frontier)&&!whiteSpringInPalace(k)?`<button class="btn" onclick="A.princessVisit(${k.id})" ${wait?'disabled':''}>${local?'请她回宫探亲':'读'+princessMarriageLand(k)+'家书'}${wait?`<small>还需 ${wait} 个月</small>`:''}</button>`:''}</div>`);
}
function viewPrincessEstate(){
  const k=princessById(UI.sel),e=k?.estate;
  if(!k?.alive||!e)return viewOut();
  const plan=PRINCESS_PURSUITS[e.pursuit];
  const ready=e.stage==='working'&&S.turn>=e.due;
  const message=e.stage==='proposal'?plan.wish:ready||e.stage==='done'?plan.result:`${e.mode||'府中正在筹办'} · 约 ${e.due-S.turn} 个月后有回音`;
  const local=princessEstateLocal(k);
  const mother=k.reign&&familyHostById(k.mom);
  const motherLink=mother?.familyArchive?`<button class="person-link" onclick="A.go('consort',${mother.id})">${esc(k.momName||fullName(mother))}</button>`:outsideMotherLink(k);
  return `<button class="btn quiet sm" onclick="A.go('out')">← 返回出巡</button>
    <header class="detail-head person-detail-head">${porImg(k,112)}<div class="grow"><p>${k.reign?princessKinship(k)+' · ':''}${kidAge(k)}岁 · ${local?'京城府邸':esc(royalKinContactPlace(k,'letter'))}</p><h2>${esc(kidName(k))} · 公主府</h2><p>生母 ${motherLink}</p></div></header>
    ${pageChapters('princess-estate',[
      ['projects','府务',detailSection(plan.title,`<p>${esc(message)}</p>${e.stage==='proposal'||ready?`<button class="btn gold" onclick="A.princessLetter(${k.id})">${ready?'读她的回信':'读府中来信'}</button>`:''}`)+princessFollowupPanel(k,plan.next)],
      ['chronicle','府中记事',detailStory(k)],
      ['family','亲眷与婚配',princessEstateFamilyPanel(k)+(xieCapitalEstate(k)?detailSection('婚事与心意',youthPanel(k)):'')+marriagePanel(k)+householdPanel(k)]
    ])}`;
}
A.princessFollowup=function(id){
  const k=princessById(id),e=k?.estate,plan=PRINCESS_PURSUITS[e?.pursuit],f=e?.followup;
  const valid=()=>!S.over&&princessById(id)===k&&k.alive&&k.estate===e&&e.stage==='done'&&e.followup===f;
  if(modalOpen||!plan||!valid()||f&&!princessFollowupDue(e))return;
  const {title,wish,result}=plan.next;
  if(f){
    const ready=()=>valid()&&princessFollowupDue(e);
    pushEv({title:`公主府回信 · ${title}`,por:k,text:result,valid:ready,choices:[{t:'记入起居注',f:()=>{
      if(!ready())return null;
      f.finished=S.turn;k[plan.stat]=clamp(k[plan.stat]+3);
      princessMemory(k,'princess_result',`【${title}】${result}`);
      log(`${kidName(k)}办成了「${title}」。`,1);return result;
    }},{t:'稍后再读'}]});
    return;
  }
  const support=(mode,months,cost)=>()=>{
    if(!valid()||E().treasury<cost)return null;
    if(cost)chg({treasury:-cost});
    e.followup={mode,due:S.turn+months};
    const line=`为${kidName(k)}商定「${title}」：${mode}，约 ${months} 个月后有回音。`;
    princessMemory(k,'princess_project',line);log(line);return line;
  };
  pushEv({title:`公主府来信 · ${title}`,por:k,text:`「${wish}」`,valid,choices:[
    {t:'拨十万两相助',cond:()=>E().treasury>=10,why:'国库不足',f:support('拨银相助',2,10)},
    {t:'交给她自己筹办',f:support('自行筹办',4,0)},{t:'改日再商量'}]});
};
A.princessEstateCall=function(id){
  const k=princessById(id);
  const valid=()=>princessById(id)===k&&princessEstateVisitReady(k)&&E().energy>0;
  if(modalOpen||!valid())return;
  const finish=topic=>()=>{
    if(!valid()||!useE())return null;
    const e=k.estate,plan=PRINCESS_PURSUITS[e.pursuit];
    e.nextCall=S.turn+4;k.love=clamp(k.love+4);
    const mother=k.reign?null:byId(k.mom);
    const line=topic==='home'?`两人在府中叙家常。${royalKinWords(k,'home')}${inPalace(mother)?`她又问起${cName(mother)}的近况，托你捎一声问候。`:''}`:
      `她取来府中的簿册，谈起「${e.followup?plan.next.title:plan.title}」。${e.followup?.finished!==undefined||e.stage==='done'&&!e.followup?'她翻给你看当时留下的几页记录，说起其中一处改过几次的安排。':'她指给你看已经办妥的事，又在还待张罗的几处画了圈。'}`;
    if(topic==='home'&&inPalace(mother))story(mother,`【公主府问安】${kidName(k)}托陛下捎来一句问候。她听完，随后也让宫人替自己问问女儿近来可好。`);
    princessMemory(k,'princess_estate_call',`【府中相见】${line}`);log(`赴${kidName(k)}府中探望。${line}`);return line;
  };
  pushEv({title:'公主府 · 到府探望',por:k,text:`${kidName(k)}亲自迎你进府，吩咐人换了新茶。`,valid,choices:[
    {t:'问问府里的事 · 精力−1',f:finish('project')},{t:'坐下说说家常 · 精力−1',f:finish('home')},{t:'改日再来'}]});
};
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
  if(S.over||modalOpen||!k?.alive||!e||whiteSpringInPalace(k)||S.turn<e.nextVisit)return;
  const mother=!k.reign&&byId(k.mom);
  const parent=k.reign?`新君与${princessKinship(k)}在宫里叙了旧。`:mother?.alive&&!mother.gone&&!mother.cold?`她与${cName(mother)}在廊下坐了半日，说起开府后的日子。`:'她在宫里走了走，在从前住的地方停了一会儿。';
  const far=(k.princessMarriage||e.route)==='frontier';
  const text=far?`她托来京的使者带回一封家书：「${e.stage==='done'?'府中的事已经办妥，愿宫中安好。':'等府中事务安顿，我再寻机会回来。'}」`:parent;
  pushEv({title:far?princessMarriageLand(k)+'家书':'回宫探亲',por:k,text,choices:[{t:far?'回信问安':'留她用膳',f:()=>{
    if(S.turn<e.nextVisit)return null;
    e.nextVisit=S.turn+4;k.love=clamp(k.love+5);
    if(!far&&mother?.alive&&!mother.gone&&!mother.cold){cchg(mother,{mood:6});story(mother,`${k.name}回宫探亲，母女叙话。`);}
    if(far&&k.spouse?.route==='whiteSpring'&&mother?.alive)story(mother,'女儿'+k.name+'从白泉寄回近况，来使还捎来故乡开市的日子。');
    princessMemory(k,'princess_visit',text,far?'公主府':'宫中');
    log(`${kidName(k)}${far?'从'+princessMarriageLand(k)+'寄回家书':'回宫探亲'}。`);save('auto');return null;
  }},{t:'改日再说'}]});
};
