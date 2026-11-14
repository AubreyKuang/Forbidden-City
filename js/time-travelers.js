/* Rare fictional origins. A character's claims and beliefs are not world facts. */
const TRAVELER_PASTS=[
  ['末班地铁','我曾在地下等末班车。灯忽然灭了，再睁眼，听见的却是马蹄声。'],
  ['雨夜屏幕','那夜我隔着一块发光的屏幕同母亲说话。窗外白光一闪，余下的话再没有说完。'],
  ['旧城书店','我在书店翻一册旧书，纸页间像起了风。再看时，店门外的高楼都不见了。'],
  ['星港候船','我曾在星港候船。舱门说时序异常，身边的人影便一层层散开。'],
  ['人造春天','我住的城里，花期可以由机器安排。那日系统报了一个错，春天忽然变成这里的深秋。'],
  ['归途断讯','我坐的车不需人驾。半途时间像折了一下，联络家人的讯息从此没有回声。']
];
function initTimeTraveler(c,force=false){
  if(!c||c.maid||c.sex||c.age<16)return null;
  if(c.timeTraveler)return c.timeTraveler;
  if(c.travelerChecked&&!force)return null;
  c.travelerChecked=true;
  const random=mulberry32((c.seed||c.id)^0x5a1739);
  if(!force&&random()>=.04)return null;
  const century=random()<.65?21:22;
  return c.timeTraveler={version:1,century,past:Math.floor(random()*3)+(century===22?3:0),known:false,
    closed:false,spoken:0,lastSpoke:null,pending:null,history:[],peers:[]};
}
function travelerEligible(c){return !!(inPalace(c)&&!c.maid&&c.age>=16&&(c.hp??100)>=40&&!S.over&&c.timeTraveler);}
function travelerRash(c){return !['聪慧','持重','城府'].includes(c.trait)&&(c.talent+c.scheme)/2<45;}
function travelerReady(c){
  if(!travelerEligible(c)||c.timeTraveler.closed)return false;
  const t=c.timeTraveler;if(t.pending)return t.pending==='confession';
  const months=S.turn-(c.enteredAt??0),rash=travelerRash(c);
  return months>=(rash?1:12)&&(rash||c.aff>=75)&&
    (t.lastSpoke==null||S.turn-t.lastSpoke>=(rash?6:12));
}
function travelerRecord(c,line,emotion=.4,subject='emperor'){
  const t=c.timeTraveler;t.history.push({turn:S.turn,d:dateStr(),text:line});if(t.history.length>24)t.history.shift();
  story(c,line);NPCMemory.record(S,{type:'traveler-past',time:S.turn,location:c.palace,participants:[c.id],object:line},
    [{person:c.id,subject,interpretation:line,emotion,impact:75}]);
}
function travelerConfessionText(c){
  const t=c.timeTraveler,rash=travelerRash(c),century=t.century===21?'二十一':'二十二';
  const arrival=TRAVELER_PASTS[t.past]?.[1]||TRAVELER_PASTS[0][1];
  const future=t.century===21?'电灯、地铁，还有能隔着万里听见亲人声音的手机':'星港、无人车，还有能造出整座虚拟城池的机器';
  const lead=t.spoken?(rash?'她又提起那个无人听懂的年代，抓着你的衣袖，将同一件事翻来覆去地解释。':'她等宫人退下，才接着讲上回没说完的旧事。'):
    rash?'她在廊下说得又急又快，方才还说“手机没电”，转眼又追问今日究竟是哪一年。宫人面面相觑，她越想解释，话越乱。':'相伴已有些时日，她仍先掩了门，许久才将藏在袖中的纸展给你看：“这件事，臣妾只敢同您说。”';
  const fragments=[arrival,`我记得${future}。记得的并非样样能做出来，可那些日子，我确实过过。`,
    '我还记得家里窗外的声音。有时怕的不是回不去，是哪一天连母亲的声音也忘了。'];
  const claim=t.spoken===0?`我来自公元${century}世纪。那场变故，我们那里或许会叫它时空乱流。`:rash?`我真的记得公元${century}世纪的日子，不是把听来的故事当作自己。`:'上回还有一些很小的事，臣妾没有来得及说。';
  const theory=t.spoken===0?'我们那个年代，有一种东西叫 AI，也叫人工智能，能够造出很像真的世界。我有时会想，这里会不会也是它造出来的？可这只是我的猜想，我没有证据。':t.spoken%3===0?'我还会想起人工智能造出的世界，可到今日，也不能拿猜想当作证据。':'说起这些，并非样样都要陛下明白。只是有人肯听，就不觉得自己全被过去遗忘了。';
  return `${lead}\n“${claim}”\n“${fragments[t.spoken%fragments.length]}”\n“${theory}”\n${rash?'她忽然对着空处喊了一声“有人在听吗”，又因无人回应而慌了神。':'她将声音压得更低：“您若不信，也请别在旁人面前取笑我。”'}`;
}
function finishTravelerReply(c,kind){
  const t=c?.timeTraveler;if(!travelerEligible(c)||t.pending!=='confession')return null;
  const replies={
    believe:['陛下相信她自述的异世来处，答应替她守住这段过往。',8,10,false],
    listen:['陛下未急着定论，屏退宫人，认真听完她对旧日的回忆。',4,6,false],
    dream:['陛下将异世旧事当作一场梦，劝她不再提起。她从此收起了这些话。',-6,-6,true],
    mock:['她冒险说出异世往事，却被斥为胡言乱语。从此不再向陛下提起自己的来处。',-16,-15,true]
  };
  const answer=replies[kind];if(!answer)return null;
  t.pending=null;t.known=true;t.lastSpoke=S.turn;t.spoken++;t.reaction=kind;t.closed=answer[3];
  cchg(c,{aff:answer[1],mood:answer[2]});travelerRecord(c,answer[0],answer[3]?-.8:.7);save('auto');
  return answer[0]+(t.closed?'\n她垂下眼：“是臣妾失言。以后，不说了。”':'\n她松开一直攥紧的手，终于肯把旧日的细节慢慢说下去。');
}
function travelerConfessionEvent(c){
  if(!travelerReady(c))return null;const t=c.timeTraveler;
  const valid=()=>travelerReady(c);
  return {title:travelerRash(c)?'不属于此世的话':'灯下的来处',por:c,present:[c],valid,cooldown:6,
    onShow:()=>{if(!t.pending){t.pending='confession';t.known=true;S.flags.lastTravelerEvent=S.turn;save('auto');}},
    text:travelerConfessionText(c),choices:[
      {t:'相信她的来处，答应替她保密',f:()=>finishTravelerReply(c,'believe')},
      {t:'暂不下定论，屏退宫人听她说完',f:()=>finishTravelerReply(c,'listen')},
      {t:'只是一场梦，以后不要再说了',f:()=>finishTravelerReply(c,'dream')},
      {t:'斥为胡言，讥其荒唐',f:()=>finishTravelerReply(c,'mock')},
      {t:'命人拿下，押入冷宫',f:()=>{pushNow(travelerCustodyEvent(c));return null;}},
      {t:'送护国寺祈福三个月 · 国库−10',cond:()=>consortTempleEligible(c)&&E().treasury>=10,why:'有孕或国库不足时不能安排',f:()=>{
        if(!valid()||E().treasury<10||!consortTempleEligible(c))return null;
        t.pending=null;t.lastSpoke=S.turn;t.spoken++;t.reaction='temple';t.known=true;
        sendConsortToTemple(c,3);chg({treasury:-10});cchg(c,{aff:-3});travelerRecord(c,'说起异世旧事后，被安排赴护国寺祈福三个月。她仍记得来处，只暂时不再争辩。',-.3);save('auto');return '车驾已备，宫女随行。三个月后回宫；这段记忆不会因祈福而抹去。';}},
      {t:'请国师看看，为她禳解',f:()=>{if(!valid())return null;t.pending='ritual';save('auto');pushNow(travelerRitualEvent(c));return null;}}
    ]};
}
function travelerCustodyEvent(c){
  if(!travelerReady(c))return null;
  return {title:'收押前再问',por:c,present:[c],danger:true,valid:()=>travelerReady(c),text:`只因这段异世之言，将${fullName(c)}押入冷宫？${c.rank===8?'这也意味着废去后位。':''}\n她会记住这次处置，不再向你倾诉这些往事。`,choices:[
    {t:'押入冷宫',f:()=>{if(!travelerReady(c))return null;const t=c.timeTraveler;
      t.pending=null;t.known=true;t.closed=true;t.reaction='custody';t.lastSpoke=S.turn;t.spoken++;
      travelerRecord(c,'异世自述未获相信，被押入冷宫。从此不再向陛下讲述来处。',-1);
      c.oldPalace=c.palace;c.cold=true;c.palace='冷宫';if(c.rank===8)chg({prestige:-10,people:-3});
      cchg(c,{mood:-40,aff:-25,favor:-20});setXin(c,'惶恐','因异世之言被押入冷宫');clanEcho(c,'down');reconcilePalaceRomance();log(`${fullName(c)}因异世之言被押入冷宫。`,1);save('auto');return '宫门落锁。她的过往仍在，只是不再对你开口。';}},
    {t:'收回旨意，让她把话说完',f:()=>{pushNow(travelerConfessionEvent(c));return null;}}
  ]};
}
function travelerRitualEvent(c){
  const t=c?.timeTraveler;if(!travelerEligible(c)||t.pending!=='ritual')return null;
  const valid=()=>travelerEligible(c)&&t.pending==='ritual';
  const finish=ritual=>{if(!valid()||(ritual&&E().treasury<10))return null;
    if(ritual)chg({treasury:-10});t.pending=null;t.lastSpoke=S.turn;t.spoken++;t.reaction=ritual?'ritual':'listen';
    cchg(c,{mood:ritual?5:8,aff:ritual?-2:3});
    const line=ritual?'奉旨由国师行禳解祈安之仪。仪式过后仍记得异世旧事，国师没有据此断言她有邪祟。':'国师听完异世自述，劝陛下先容她安居，不必急于以邪祟定名。';
    travelerRecord(c,line,ritual?-.1:.5);save('auto');return line;};
  return {title:'国师问来处',cast:[daoMaster(),c],present:[c],valid,text:`${daoMaster().name}国师听完，先问她是否睡得安稳，又问她最惦念谁。\n“贫道可以设一场禳解祈安之仪，却不能只凭几句异言，便断她有邪祟。她说的来处，贫道也不曾见过。”\n她低声说：“我怕的不是鬼，是再也见不到家人。”`,choices:[
    {t:'仍请国师行禳解祈安之仪 · 国库−10',cond:()=>E().treasury>=10,why:'国库不足',f:()=>finish(true)},
    {t:'听国师劝解，让她安心住下',f:()=>finish(false)}]};
}
function travelerPairCandidates(){
  const people=harem().filter(c=>travelerEligible(c)&&S.turn-(c.enteredAt??0)>=3),pairs=[];
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const a=people[i],b=people[j],key=[a.id,b.id].sort((x,y)=>x-y).join(':'),state=S.flags.travelerPairs?.[key];
    if(a.timeTraveler.pending||b.timeTraveler.pending||relGet(a,b)<-20)continue;
    if(a.palace!==b.palace&&!sharedConsortHobby(a,b)&&relGet(a,b)<15)continue;
    if(!state||state.pending||S.turn-(state.last??-99)>=(state.stage>=2?12:6))pairs.push({a,b,key,state});
  }
  return pairs;
}
function travelerPairEvent(pair){
  if(!pair)return null;const {a,b,key}=pair,stage=pair.state?.stage||0;
  const valid=()=>travelerPairCandidates().some(p=>p.key===key);
  let state=pair.state;
  const finish=kind=>{if(!valid()||!state?.pending)return null;
    state.pending=false;state.last=S.turn;state.meetings=(state.meetings||0)+1;
    let line;
    if(kind==='apart'){state.last=S.turn+6;line='两人正说到旧日词语，便奉命各自回宫，未能继续核对。';cchg(a,{mood:-3});cchg(b,{mood:-3});}
    else if(kind==='ask'&&[a,b].some(c=>c.timeTraveler.closed||c.aff<75)){
      line='陛下当面问起，两人只说是在谈一个梦，没有交出心里的来处。';
    }else{
      state.stage=Math.min(2,stage+1);relAdd(a,b,stage===0?4:stage===1?14:3);
      line=stage===0?`与${fullName(b)}试探着谈起“手机”和旧日纪年，疑心对方也曾见过另一个时代，尚未贸然相认。`:
        stage===1?`与${fullName(b)}核对旧日生活的细节后，终于彼此认作异世来客。两人的年代未必相同，却能听懂对方的乡愁。`:
        `与${fullName(b)}在灯下谈起远方家人。一个人说到忘了的声音，另一个人安静听完，谁也没有再急着证明什么。`;
      if(state.stage===2){for(const [c,other] of [[a,b],[b,a]]){if(!c.timeTraveler.peers.includes(other.id))c.timeTraveler.peers.push(other.id);cchg(c,{mood:7});}}
    }
    const emotion=kind==='apart'?-.3:kind==='ask'&&[a,b].some(c=>c.timeTraveler.closed||c.aff<75)?-.15:.5;
    travelerRecord(a,line,emotion,b.id);travelerRecord(b,line.replaceAll(fullName(b),fullName(a)),emotion,a.id);
    save('auto');return line.startsWith('与')?fullName(a)+line:line;};
  const second=stage===1?(a.timeTraveler.century===b.timeTraveler.century?'她们从屏幕怎样亮起，谈到家中街道与旧时纪年。许多无人教过的细节，竟能一一接上。':'一个人说地铁票与手机，另一个人说星港与人造城。年代隔得远，记忆并不完全相同；她们反而更谨慎地追问，直到认出共同的旧世概念。'):'';
  return {title:['似曾听过的词','原来你也记得','灯下说故乡'][Math.min(2,stage)],cast:[a,b],present:[a,b],valid,cooldown:6,
    onShow:()=>{if(!state){const records=S.flags.travelerPairs||={};state=records[key]||={stage:0,last:null,pending:false};}state.pending=true;S.flags.lastTravelerEvent=S.turn;save('auto');},
    text:stage===0?`${fullName(a)}随口说出“手机”，${fullName(b)}的茶盏停在半空。\n“你说的，是拿在手中、会亮的那一种么？”\n两人望了望宫人，没有立即承认什么，只约好改日再谈。一个词，也可能只是巧合。`:
      stage===1?`${fullName(a)}与${fullName(b)}又在廊下相遇。${second}\n其中一人忽然问：“你也曾想过，这里会不会是人工智能造的世界？”另一人摇头：“我不知道。可想家，总不是假的。”`:
      `${fullName(a)}与${fullName(b)}对坐，说起旧日家人与回不去的街道。${[a,b].some(c=>c.timeTraveler.closed)?'有些话她们已不肯向皇帝再说，却仍能在彼此面前说完。':'她们也会争论各自记得的时代，意见不尽相同，却不必再从头解释每一个词。'}`,
    choices:[{t:'不打扰，让她们继续说',f:()=>finish('listen')},{t:'当面问起，她们在说什么',f:()=>finish('ask')},{t:'让她们各自回宫',f:()=>finish('apart')}]};
}
function travelerLifeTick(){for(const c of S.consorts)if(c.alive&&!c.gone)initTimeTraveler(c);}
function pendingTravelerEvent(){
  for(const c of S.consorts){if(!travelerEligible(c))continue;
    if(c.timeTraveler.pending==='ritual')return travelerRitualEvent(c);
    if(c.timeTraveler.pending==='confession')return travelerConfessionEvent(c);
  }
  return travelerPairEvent(travelerPairCandidates().find(p=>p.state?.pending));
}
function travelerMonthlyEvent(){
  if(pendingTravelerEvent()||S.turn-(S.flags.lastTravelerEvent??-99)<6||!chance(.2))return null;
  const pairs=travelerPairCandidates(),people=harem().filter(travelerReady);
  if(pairs.length&&(!people.length||chance(.5)))return travelerPairEvent(pick(pairs));
  return people.length?travelerConfessionEvent(pick(people)):null;
}
function timeTravelerVoice(c){
  const t=c.timeTraveler;if(!t)return null;
  if(t.closed)return voiceLine('traveler-silent','她将一张写过字的纸收入匣中，换了话题。',['那一晚的话，陛下就当没有听过吧。臣妾今日只说眼前的事。','有些旧梦，不说也罢。窗下的花开了，陛下可看见了？']);
  if(!t.known)return travelerRash(c)?voiceLine('traveler-slip','她又说了一个宫人不懂的词，急着解释，却越说越乱。',['这地方怎么连一盏电灯也没有……算了，臣妾说不明白。','我明明记得回家的路，可出了这重门，就全不一样了。']):null;
  if(!travelerRash(c)&&c.aff<75)return null;
  return voiceLine('traveler-memory','她谈起只有你听过的另一种生活。',[
    t.century===21?'从前隔着一块小小的屏幕，也能听见家人的声音。如今一张家书，要等那么久。':'从前那座城能造出四季，却造不出真正等我回家的人。臣妾如今才分得清。',
    '即便这里真是人造的世界，眼前的人会难过、会想念，便不能当作一串无关紧要的数。',
    '臣妾记得一些很远的事，却不是什么都会。若只凭记得几个词，就夸口能改天换地，那才是骗您。']);
}
function timeTravelerPanel(c){
  const t=c.timeTraveler;if(!t?.known)return '';
  return `<section class="personal-experience"><h3>异世旧梦</h3><p>她自述来自公元${t.century===21?'二十一':'二十二'}世纪 · ${t.closed?'此后缄口':travelerRash(c)?'急于自证':'谨慎藏言'}</p><p class="hint">${esc(t.history.at(-1)?.text||'她第一次提起了不属于这个时代的往事。')}</p>${travelerReady(c)?`<button class="btn jade" onclick="A.travelerTalk(${c.id})">听她谈旧日<small>精力−1</small></button>`:''}</section>`;
}
A.travelerTalk=function(id){const c=byId(id);if(modalOpen||!travelerReady(c)||!useE())return;pushEv(travelerConfessionEvent(c));};
