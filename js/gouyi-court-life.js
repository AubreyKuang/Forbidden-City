/* Fixed fictional identity; encounters and the answers people believe remain variable.
   Version gating keeps already-open version 16 scenes replayable. */
const GOUYI_IDENTITY=Object.freeze({sur:'赵',given:'令仪',trait:'沉静',t2:'念旧',hobby:'品茶',like:'字画',hate:'兵器'});
const gouyiLifeActive=()=>typeof PalaceActions==='undefined'||PalaceActions.contentVersion>=17;
// This history belongs only to her, never to the random background pool.
Object.defineProperty(WOUNDS,'gouyi',{value:'自幼双手蜷握，旁人常围着追问。河间相见时，陛下先屏退众人，等她自己伸手，她才第一次在御前舒开双掌。她记得那份惊喜，也一直想弄清缘由。'});
function fixGouyiIdentity(c){
  Object.assign(c,GOUYI_IDENTITY,{travelerChecked:true,wish:'poem',wishKnown:false,wishDone:false,wound:'gouyi',woundKnown:false,kl:false,mem:c.mem||[]});
  delete c.solitary;delete c.timeTraveler;
  c.gouyi.gen=S.gen;
}
function gouyiLifeEligible(c){return gouyiLifeActive()&&!S.over&&!!c?.gouyi&&(c.gouyi.gen??S.gen)===S.gen&&c.age>=18&&!c.maid&&cohabAvailable(c)&&!maternalVoiceUrgent(c);}
function gouyiInquiryEligible(c){return gouyiLifeEligible(c)&&daoEligible(c);}
function gouyiInquiryState(c){return c.gouyi.inquiry||(c.gouyi.inquiry={stage:0,last:c.enteredAt??S.turn,history:[]});}
const GOUYI_INQUIRIES=[
  {title:'掌心问因',wish:'她把河间旧事从头想了一遍，想去钦安殿问国师：为何别人面前伸不开，到了御前却能舒展？',
    text:(c,d,m)=>`钦安殿松影照着门槛，赵令仪先把双手收在袖中，向${m.name}国师问：“臣妾到底是怎么回事？幼时请人看过，谁也说不明白。为何只在陛下面前，这双手就能松开？”\n国师并不索看她的手，只在纸上画了一个未合的环：“旧说以结喻缘。或是此时此人恰解一结，也或有身心相应之处，贫道还没有证据。”\n她追问：“若只说有缘，岂不是任何事都能解释？臣妾想知道的，是那一刻究竟发生了什么。”`,
    choices:[
      {label:'请太医与国师分别记下所知，慢慢查证',key:'observe',reply:'国师另留问缘笺，太医则受请记下她自述的旧症与展掌时的感受，不强行试掰。她愿意一点点回忆，也不再急着把两份记载合成一个答案。',thought:'若真有缘分，我想知道；若尚无答案，也请先把我说的话记全。',mood:5},
      {label:'陪她听完解结之说，再由她自己想',key:'wonder',reply:'国师讲起风过空铃、缘到结解的旧喻，只作一种猜想。她收下那张未合的环，仍在背面添了一句：“若缘可解，何以偏是此人？”',thought:'我愿意听玄妙的故事，却还不愿把疑问就此收起。',mood:4}
    ]},
  {title:'灯下验影',wish:'她近来留意手指的细微变化，想带着自己的记录再去钦安殿，不愿只听别人替她讲述。',
    text:(c,d,m)=>`赵令仪把一页口述的小记放在钦安殿案上。${d.path==='observe'?'上回分别留下的医案与问缘笺也在，太医没有给出确论。':'那张画着未合之环的笺夹在纸间，背面的疑问还没有划掉。'}\n${m.name}国师拨亮一盏灯。你坐近时，她的手指慢慢舒开；掌影在案上像一枚松开的钩，灯焰忽然泛青，转瞬又复如常。\n她先惊了一下，随后问：“方才是灯，还是我的手？”国师换了灯芯：“我也未辨明。既要看，就把没有异样的时候一同记下。”\n她不肯让宫人来围观，只向你摊开那页小记：“这回，先听臣妾说。”`,
    choices:[
      {label:'听她逐条讲述，一并记下平常的时刻',key:'notes',reply:'两人听她讲完，在钦安殿小记中同时留下灯影有异与平常无事的时刻。青焰没有重现，展掌的缘由也未就此确定。',thought:'有人肯听我说“这回什么也没有”，这页小记才真像我的。',mood:6},
      {label:'她已疲倦，先收灯，留下未解的一页',key:'rest',reply:'她说手指已有些倦，陛下便陪她收起灯盏。国师将未解的一页原样留存，没有为了一个吉兆催她再试。',thought:'原来还可以说今日到这里，不必一直试到旁人满意。',mood:7}
    ]},
  {title:'旧谶辨字',wish:'她见到一页把河间奇遇写成贵命的抄本，想请国师查清来处，免得往后人人拿它替自己定命。',
    text:(c,d,m)=>`钦安殿书案上多了一页抄本，写着“握玉而生，展掌而贵”。赵令仪将纸推给${m.name}国师：“这话写的是我么？我掌中从未握过玉。别人添上一笔，倒比我自己说的更像真的。”\n国师翻检纸墨与题记，只能确认这是近来的转抄，未见可核的旧本。所谓玉钩，是抄书人添上的传闻。\n${c.preg>=1?'她将另一手轻放在腹前：“我腹中这个孩子，也要由旁人续写么？”':'她低声问：“若连没发生过的事都能写进来，往后的日子又会被写成什么？”'}\n国师答：“异事可以存疑，贵贱吉凶却不可凭这一页替人作主。”`,
    choices:[
      {label:'附上她的自述，把传闻与亲见分开',key:'annotate',reply:'抄本旁添上赵令仪自己的口述：掌中无玉，展掌有其事，成因未明。国师另注抄本来历待考，未把奇闻当作她或孩子的命数。',thought:'只要能留下我的话，后来的人就不必只听那一页传闻。',mood:7},
      {label:'收存抄本，停下以她为题的求谶',key:'seal',reply:'国师把抄本收进待考匣，不再用它起占。赵令仪保留自己的问缘笺，却不必再为旁人的贵命之说应答。',thought:'我还想问自己，却不想再被旁人当成一道签。',mood:8}
    ]},
  {title:'归还一问',wish:'她又想起国师留下的空环，想把近来的所得带回钦安殿。这回，除了求解，也想说一说自己的答案。',
    text:(c,d,m)=>`赵令仪带着数次问答的旧笺再到钦安殿。${m.name}国师问：“今日仍问展掌么？”她点点头，又摇头：“仍想知道。只是从前觉得，若问不明白，臣妾便只能一辈子做那个奇人。”\n你坐在她身旁，她将那张画着空环的笺慢慢抚平。${d.reading==='annotate'?'她在自述旁补了一行，写自己如何记下每次疑问。':'她不再去翻那页贵命抄本，只把自己留下的话排好。'}\n国师说：“贫道没有替你解尽这一问。你倒已添了许多自己的话。”\n她看向你：“若有一日寻得答案，臣妾还要讲给陛下听。今日没有答案，也想照样喝完这盏茶。”`,
    choices:[
      {label:'将问答收作她的私笺，陪她品茶',key:'private',reply:'几次钦安殿问答由赵令仪自己收存。她仍记着未解之处，也愿意把茶香、松影和有人听她说话的日子一起记下。',thought:'没有人替我下最后的断语。疑问还在，日子也可以往前过。',mood:9},
      {label:'依她的口述留一份记，不添神迹与断语',key:'account',reply:'赵令仪同意留存自己的问答，国师逐条标明亲见、传闻与未解之处，没有添写玉钩，也不预言她日后的荣辱。',thought:'若有人还想知道钩弋的故事，也能读到赵令仪自己说过的话。',mood:8}
    ]}
];
function queueGouyiInquiry(c){
  if(!gouyiInquiryEligible(c))return false;
  const d=gouyiInquiryState(c),chapter=GOUYI_INQUIRIES[d.stage];
  if(!chapter||d.pending||S.turn-d.last<(d.stage?4:2))return false;
  d.pending={stage:d.stage,turn:S.turn,gen:S.gen};
  livedRecord([c],'self','钩弋求问',`gouyi-inquiry:${S.gen}:${c.id}`,`【钩弋求问】${chapter.wish}`,['我也想知道自己是怎么回事，不只想听一句天生贵命。']);
  log(`赵令仪想赴钦安殿请教国师，心中惦念着「${chapter.title}」。`);
  return true;
}
function gouyiInquiryEvent(c){
  const d=c?.gouyi?.inquiry,p=d?.pending,chapter=GOUYI_INQUIRIES[p?.stage],m=daoMaster();
  const valid=()=>gouyiInquiryEligible(c)&&d.pending===p&&p?.gen===S.gen&&d.stage===p.stage;
  if(!chapter||!valid())return null;
  return {title:'钦安殿 · '+chapter.title,por:c,cast:[c,m],present:[c],valid,text:chapter.text(c,d,m),choices:[
    ...chapter.choices.map(option=>({t:option.label+' · 精力−1',cond:()=>valid()&&E().energy>0,why:'需有精力，且她能前往钦安殿',f:()=>{
      if(!valid()||!useE())return null;
      recordDaoVisit(c);delete d.pending;d.stage++;d.last=S.turn;
      if(p.stage===0)d.path=option.key;if(p.stage===2)d.reading=option.key;
      const text=`【${chapter.title}】赵令仪与陛下同赴钦安殿，向${m.name}国师请教展掌之事。${option.reply}`;
      d.history.push({stage:p.stage,choice:option.key,master:m.name,turn:S.turn,date:dateStr(),text,thought:option.thought});
      livedRecord([c],'self',chapter.title,`gouyi-inquiry:${S.gen}:${c.id}`,text,[option.thought]);
      cchg(c,{aff:4,mood:option.mood});if(p.stage===3)setXin(c,'释然','几次求问后，仍保留自己的疑问，也愿意安顿眼前的日子');
      log(`赵令仪同帝至钦安殿，与${m.name}国师谈「${chapter.title}」。`);
      return option.reply;
    }})),{t:'留待她方便时再来',f:()=>null}
  ]};
}
A.gouyiInquiry=function(id){if(modalOpen)return;const c=byId(id),ev=gouyiInquiryEvent(c);if(ev)pushEv(ev);};

function gouyiReactionKind(o,c){
  if(o.rank===8)return 'etiquette';
  if(isSolitary(o)||['淡泊','沉静','持重'].includes(o.trait))return 'reserved';
  if(['善妒','骄矜','城府'].includes(o.trait)&&(c.rank>=o.rank||c.favor>=o.favor+10))return 'rival';
  if(relGet(o,c)<-15||['骄纵','城府','聪慧'].includes(o.trait))return 'doubt';
  if(['活泼','爽直','好客','将门'].includes(o.trait))return 'curious';
  return 'kind';
}
const GOUYI_REACTIONS={
  curious:{title:'新奇一问',line:'“真是只有陛下在时才肯展掌么？我从未听过这样的事。”她说得快，察觉自己盯得太久，才赶忙移开目光。',answer:'“我也还不知道缘由。”赵令仪轻声答，“若以后弄明白了，愿讲给你听。眼下倒想先听听，你平日喜欢什么。”',thought:'原来她自己也在求解，先认得她这个人，再问奇闻也不迟。',delta:4},
  doubt:{title:'奇闻与疑心',line:'“旁人都瞧不见，偏陛下来了便见效，倒真是一桩会挑时候的奇事。”她带着笑，话却留了刺，疑心这传说是邀宠的做派。',answer:'赵令仪把手留在袖里：“你可以不信传闻。我若知道缘由，自会说；不知道的，也不会编来取悦谁。”',thought:'她没有当场证给我看，也没有接下我的话。这疑心还不能作实据。',delta:-3},
  rival:{title:'掌心之外的争宠',line:'“入宫这些时日，人人看她都先问钩弋。”她掸了掸衣袖，“往后陛下想起的，怕也先是这一桩奇遇。”她在意的已不只是真假，而是眼前这个有了独特缘分的人。',answer:'赵令仪停了一会儿：“河间相见，我记得。可往后的日子，也不能全靠那一日。”她不肯拿展掌同旁人比输赢。',thought:'奇遇不能替她过完日子，可我仍不愿在陛下心里被她越过去。',delta:-4},
  kind:{title:'先问一盏茶',line:'“旁人尽问你的手，我倒想问，你喝浓茶还是淡茶？”她把新茶往赵令仪面前移了移，说往后来坐，不必每回都讲河间的旧事。',answer:'赵令仪先是一怔，随后认真说起自己偏爱的茶味。那一句邀约，她记得比旁人惊叹的声音还清楚。',thought:'她不必时时作祥瑞。我愿意先同她喝一盏茶，交情往后慢慢处。',delta:6},
  reserved:{title:'各留清静',line:'她依位分相见，只问新居可还安稳，目光并不往赵令仪袖间落：“宫里人多，若不愿说，不必逐个答。”说罢便留出一步距离。',answer:'赵令仪也不强留她谈笑，只郑重谢过。两人各自收袖行礼，仍是淡淡来往，却少了一分被打量的不自在。',thought:'守礼便好，各有清静。没有因一桩奇遇就须结交的道理。',delta:1},
  etiquette:{title:'中宫问新',line:'皇后听过展掌之说，先问的是宫人可有围看：“奇遇自会有人议论，入宫之后仍按位分过日子。不得为看稀奇，误了日常的规矩。”她也在留意，赵令仪是否借此另求殊例。',answer:'赵令仪依礼答话：“臣妾并不求众人来验看，也愿按宫规安居。”她谢过约束围看的安排，没有请中宫替传说作证。',thought:'先看她往后如何行事。宫人围观须管束，也不能因奇闻便越了位分。',delta:1}
};
function gouyiCourtState(c){return c.gouyi.court||(c.gouyi.court={last:c.enteredAt??S.turn,heard:{}});}
function gouyiCourtPair(c,o){return gouyiLifeEligible(c)&&!!o&&o!==c&&o.age>=18&&!o.maid&&cohabAvailable(o)&&!maternalVoiceUrgent(o);}
function queueGouyiReaction(c,o){
  if(!gouyiCourtPair(c,o))return false;const d=gouyiCourtState(c);
  if(d.pending||d.heard[o.id]||S.turn-d.last<3)return false;
  d.pending={other:o.id,kind:gouyiReactionKind(o,c),gen:S.gen,turn:S.turn};return true;
}
function gouyiReactionEvent(c){
  const d=c?.gouyi?.court,p=d?.pending,o=byId(p?.other),r=GOUYI_REACTIONS[p?.kind];
  const valid=()=>!!p&&d.pending===p&&p.gen===S.gen&&gouyiCourtPair(c,o)&&gouyiReactionKind(o,c)===p.kind;
  if(!r||!valid())return null;
  const negative=['doubt','rival'].includes(p.kind);
  const finish=protect=>{
    if(!valid())return null;
    delete d.pending;d.last=S.turn;d.heard[o.id]={kind:p.kind,turn:S.turn};
    const result=protect?'陛下止住以奇闻讥人的话，赵令仪向陛下谢过，也没有被要求当众展掌。':r.answer;
    const text=`【${r.title}】${cName(o)}在请安散后的廊下与赵令仪说起河间奇遇。${r.line}${result}`;
    relAdd(c,o,negative?(protect?-1:r.delta):r.delta);cchg(c,{aff:protect?4:1,mood:negative?(protect?3:-2):4});
    livedRecord([c,o],'bond',r.title,`gouyi-court:${S.gen}:${c.id}:${o.id}`,text,[negative?(protect?'有人止住那句话，我松了口气，却也知道疑心未必就此消失。':'我能回答的便回答，不知的不会编。那份不信任，仍记在心里。'):p.kind==='reserved'?'她不围看，也不勉强亲近，这样的距离让我自在。':'她同我说的话，我记下了。往后再见，也许能不只谈那双手。',r.thought]);
    c.gouyi.lastSocial={other:o.id,name:fullName(o),kind:p.kind,turn:S.turn};
    o.gouyiImpression={id:c.id,kind:p.kind,turn:S.turn};
    return result;
  };
  return {title:'钩弋入宫 · '+r.title,por:c,cast:[c,o],present:[c,o],valid,text:`请安散后，你经过廊下，恰听见${cName(o)}同赵令仪说话。\n${r.line}\n${negative?'赵令仪听清了那句话，并未急着伸手辩白。':'赵令仪侧过身，认真听完。'}`,choices:[
    {t:negative?'让赵令仪自己回答':'听她们把话说完',f:()=>finish(false)},
    ...(negative?[{t:'制止以奇闻讥人，不要求她展示',f:()=>finish(true)}]:[])
  ]};
}
A.gouyiReaction=function(id){if(modalOpen)return;pushEv(gouyiReactionEvent(byId(id)));};
function gouyiLifeTick(){
  if(!gouyiLifeActive()||S.over||S.flags.gouyiLifeTurn===S.turn)return;
  S.flags.gouyiLifeTurn=S.turn;
  for(const c of S.consorts.filter(gouyiLifeEligible)){
    const d=gouyiInquiryState(c),social=gouyiCourtState(c);
    if(gouyiInquiryEligible(c)&&!d.pending&&d.stage<GOUYI_INQUIRIES.length&&S.turn-d.last>=(d.stage?4:2)&&chance(.35))queueGouyiInquiry(c);
    if(social.pending&&!gouyiReactionEvent(c))delete social.pending;
    if(social.pending||S.turn-social.last<3||!chance(.35))continue;
    const others=S.consorts.filter(o=>gouyiCourtPair(c,o)&&!social.heard[o.id]);
    if(others.length&&queueGouyiReaction(c,pick(others)))pushEv(gouyiReactionEvent(c));
  }
}
const gouyiLivedTick=livedRelationshipsTick;
livedRelationshipsTick=function(...args){const result=gouyiLivedTick.apply(this,args);gouyiLifeTick();return result;};
function gouyiInquiryPanel(c){
  if(!gouyiLifeActive()||!c?.gouyi)return '';
  const d=c.gouyi.inquiry,chapter=GOUYI_INQUIRIES[d?.pending?.stage],last=d?.history?.at(-1),ready=gouyiInquiryEligible(c),reaction=gouyiReactionEvent(c);
  return `<section class="detail-section"><h3>令仪问缘</h3><p>河间旧事仍有未解之处，她也有自己的疑问。</p>${chapter?`<p>${esc(chapter.wish)}</p><button class="btn jade" onclick="A.gouyiInquiry(${c.id})" ${ready?'':'disabled'}>同赴钦安殿 · ${esc(chapter.title)}<small>相谈精力−1</small></button>${ready?'':'<p class="hint">待她回宫、身心安稳且便于出行时，再续这一问。</p>'}`:d?.stage===4?'<p>四次问答已收存；疑问仍在，往后由她慢慢求索。</p>':'<p class="hint">相处一些时日，她或许会主动提出前往钦安殿。</p>'}${last?`<p class="hint">${esc(last.date)} · ${esc(last.thought)}</p>`:''}${reaction?`<button class="btn" onclick="A.gouyiReaction(${c.id})">听听廊下的议论</button>`:''}</section>`;
}
const gouyiPracticePanel=daoPracticePanel;
daoPracticePanel=function(c){return gouyiPracticePanel(c)+gouyiInquiryPanel(c);};
const gouyiHall=viewDaoHall;
viewDaoHall=function(){return gouyiHall()+(gouyiLifeActive()?S.consorts.filter(c=>gouyiInquiryEligible(c)&&c.gouyi.inquiry?.pending).map(gouyiInquiryPanel).join(''):'');};
const gouyiDaoConversation=daoConversation;
daoConversation=function(c){return gouyiLifeActive()&&c?.gouyi&&daoVisitors().includes(c)&&c.gouyi.inquiry?.pending?gouyiInquiryEvent(c):gouyiDaoConversation(c);};
const gouyiLifeVoice=consortVoicePool;
consortVoicePool=function(c){
  const pool=gouyiLifeVoice(c);if(!gouyiLifeActive()||!cohabAvailable(c)||maternalVoiceUrgent(c))return pool;
  const d=c.gouyi?.inquiry,last=d?.history?.at(-1);
  if(d?.pending)pool.push(voiceLine('gouyi-question','她把写着疑问的小笺收进袖中。','臣妾想去钦安殿再问一问。别人说臣妾是祥瑞，可臣妾自己还不知道，那一刻为何会这样。'));
  else if(last)pool.push(voiceLine('gouyi-answer','她又读了一遍钦安殿带回的问答笺。',last.thought));
  const encounter=c.gouyi?.lastSocial,other=byId(encounter?.other);
  if(encounter&&inPalace(other)&&S.turn-encounter.turn<=6){
    const line=['doubt','rival'].includes(encounter.kind)?`那日${encounter.name}的话，臣妾听见了。原来不展掌也有人疑，展了又怕被人围着看。臣妾只想如实答话。`:relGet(c,other)<0?`那日也曾同${encounter.name}好好说话。后来有了嫌隙，那一回的照应却还记得。`:encounter.kind==='reserved'?`${encounter.name}没有追问，也没有勉强留臣妾说话。那样依礼相见，臣妾倒觉得自在。`:`那日${encounter.name}肯听臣妾说完，臣妾记着。往后若能再坐一会儿，也想聊聊河间之外的事。`;
    pool.push(voiceLine('gouyi-court-memory','她记起请安散后的一次相见。',line));
  }
  const impression=c.gouyiImpression,g=byId(impression?.id);
  if(gouyiLifeEligible(g)&&impression&&S.turn-impression.turn<=6){
    const line={curious:'令仪也在问自己的手是怎么回事。下回再见，我想先问她喜欢哪一味茶。',doubt:'臣妾仍不大信那桩展掌之说，可没见明白的事，也不能就当她有心作假。',rival:'那一场河间奇遇，臣妾是没有的。有时听人提起，心里还是不免在意。',kind:'上回同令仪说起茶，她一下便认真起来。臣妾想再邀她坐坐，先不问那些传闻。',reserved:'令仪的旧事，臣妾未曾追问。依礼相见，各留些清静，也很好。',etiquette:'令仪入宫之后，宫人围看之事该管。至于她本人如何，还是看日后的行止。'}[impression.kind];
    const changed=relGet(c,g)<-15&&!['doubt','rival'].includes(impression.kind);
    pool.push(voiceLine('gouyi-impression','说起近来廊下的那次相见，她仍记得。',changed?'那日与令仪也曾平和说话，只是如今另有嫌隙，不能当作没有发生。':line));
  }
  return pool;
};

/* Original memories, separate from the encounter arc and the four temple inquiries. */
const GOUYI_PAST_CHAPTERS=[
  {title:'宽袖藏春',text:'赵令仪整理衣袖时，忽然提起河间的旧衣。\n“小时候，家里把袖口改得宽些，免得勒疼手腕。后来我却总往下拉，连春日出门也不肯露出来。”她望着袖缘，静了片刻，“有人只是好奇，多问两句，并无恶意。可一条街走下来，竟没有人问我看见什么花。”\n她轻轻笑了一下：“那年河边的杏花开得很好，我到如今还记得。”',
    choices:[
      {t:'问她河间的杏花是什么样',reply:'她说花开在低低的土墙外，风来时，白瓣会落在浅水里。说到这里，她忘了往下拽袖口，只顾比量那一树花的高低。',thought:'原来这一段旧事里，也可以先记得杏花。'},
      {t:'告诉她，不想答的话便不必答',reply:'她垂眼理平袖口：“臣妾知道陛下肯听。若哪日不想说，也想这样安静坐一会儿。”她把未说完的话留住，没有再勉强自己。',thought:'我愿亲近，也仍能留下一点自己的清静。'}]},
  {title:'窗下候茶',text:'案上的茶香散开，赵令仪想起从前窗下的一张小几。\n“旁人说起我，总觉得那些年月只剩一桩怪事。其实也有寻常日子。茶盏放稳了，我便坐在窗边，听水滚过几回，看日影移到哪一块砖上。”\n她低头嗅了嗅杯沿：“我那时就喜欢闻茶香。雨天尤其好，街上少有人经过，坐一下午，也没有谁来催着看我的手。”',
    choices:[
      {t:'陪她慢慢喝完这一盏',reply:'你没有唤人换更名贵的茶，只陪她等热气渐渐淡下去。她说起河间春雨落在檐上的声音，语气比平日舒展。',thought:'宫中的茶也可以喝得这样慢，像窗下的那个下午。'},
      {t:'问她如今想怎样布置窗前',reply:'她想了想，只要一张稳当的小几，添一枝应时的花。“不必让人站着伺候，”她补了一句，“臣妾想自己待一会儿，再讲给您听。”',thought:'想留下的并非旧屋，而是可以自在度过的时辰。'}]},
  {title:'车驾之后',text:'说起入宫那日，赵令仪先想起的却不是仪仗。\n“河间相见后，臣妾坐了许久，怕一动，刚才那一刻便像梦一样散了。后来听见车外有人唤我的名字，才觉得自己真的还在这里。”\n她将手轻轻放在你身旁：“他们一路都在说钩弋。臣妾既欢喜，又有些怕——怕陛下记得奇遇，却觉得奇遇过去，便再没有什么可听。”\n“如今能把这些小事说出来，臣妾才觉得，那日不是故事的结尾。”',
    choices:[
      {t:'告诉令仪，往后的寻常日子也愿意听',reply:'你唤她的名字，问她明日想做什么。她没有再谈祥瑞，只说想将今日这盏茶的滋味记下来，等你有空时再温一回。',thought:'相遇之外，原来还有许多值得被记得的日子。'},
      {t:'陪她把河间旧事按自己的意思记下',reply:'她一边回想，一边让人依她的话录下，不添玉钩，也不添贵命。说到车外那一声名字时，她特地让人留了一行。',thought:'这回写下的是我记得的往事，不是旁人替我续的传说。'}]}
];
function gouyiPastReady(c){
  const d=c?.gouyi?.past;
  return personalContextActive()&&gouyiLifeEligible(c)&&c.aff>=65&&(d?.stage||0)<GOUYI_PAST_CHAPTERS.length&&S.turn-(d?.last??-99)>=3;
}
function gouyiPastPanel(c){
  if(!personalContextActive()||!c?.gouyi)return '';
  const d=c.gouyi.past,done=(d?.stage||0)>=GOUYI_PAST_CHAPTERS.length;
  if(done)return `<button class="btn sm" onclick="A.gouyiPast(${c.id})">重读河间旧事</button>`;
  if(!inPalace(c))return '';
  const ready=gouyiPastReady(c),hint=c.aff<65?'情分到65后，她愿慢慢说起':d&&S.turn-d.last<3?'上回的旧事刚说过，过些日子再听':'听她说起入宫前后的寻常日子 · 精力−1';
  return `<button class="btn sm" onclick="A.gouyiPast(${c.id})" ${ready?'':'disabled'}>听令仪讲河间旧事<small>${esc(hint)}</small></button>`;
}
function gouyiPastEvent(c){
  if(!personalContextActive()||!c?.gouyi)return null;
  const d=c.gouyi.past,stage=d?.stage||0;
  if(stage>=GOUYI_PAST_CHAPTERS.length)return {title:'重读河间旧事',por:c,text:(d.history||[]).map(h=>`${h.date} · ${h.title}\n${h.text}`).join('\n\n'),choices:[{t:'收好旧记'}]};
  if(!gouyiPastReady(c))return null;
  const chapter=GOUYI_PAST_CHAPTERS[stage],gen=S.gen;
  const valid=()=>gen===S.gen&&gouyiPastReady(c)&&(c.gouyi.past?.stage||0)===stage;
  return {title:'河间旧事 · '+chapter.title,por:c,valid,text:chapter.text,choices:[...chapter.choices.map((option,choice)=>({t:option.t+' · 精力−1',cond:()=>valid()&&E().energy>0,f:()=>{
    if(!valid()||!useE())return null;
    const past=c.gouyi.past||=( {stage:0,history:[]} );
    const text=`【河间旧事·${chapter.title}】${chapter.text}\n${option.reply}`;
    past.stage++;past.last=S.turn;past.history.push({title:chapter.title,turn:S.turn,date:dateStr(),choice,text});
    c.wound='gouyi';c.woundKnown=true;
    livedRecord([c],'self',chapter.title,`gouyi-past:${S.gen}:${c.id}`,text,[option.thought]);
    cchg(c,{aff:4,mood:5});log(`赵令仪与帝谈起河间旧事「${chapter.title}」。`);
    return option.reply;
  }})),{t:'留待她下回愿意时再说'}]};
}
A.gouyiPast=function(id){if(!modalOpen)pushEv(gouyiPastEvent(byId(id)));};
const gouyiPastVoicePool=consortVoicePool;
consortVoicePool=function(c){
  const pool=gouyiPastVoicePool(c),d=c?.gouyi?.past;
  if(personalContextActive()&&d?.stage&&gouyiLifeEligible(c))pool.push(voiceLine('gouyi-past','她望了一眼窗前，又将茶盏向你推近些。',d.stage===1?'陛下还记得臣妾说的河间杏花么？从前总想将袖子拉低，那日讲着花，倒忘了。':d.stage===2?'这几日听雨，臣妾又想起窗下候茶的旧日。如今也有人肯陪着，慢慢喝完一盏。':'从前以为河间那一次便用尽了奇遇。如今才知道，一起喝茶、说说旧事，也会叫人盼着明日。'));
  return pool;
};

const gouyiCrownActive=()=>journalContentVersion()>=38;
const GOUYI_CROWN_SCENES=[
  (k,m,arc)=>{
    const together=inPalace(m);
    const opening=arc.late?'这日你到东宫，案上搁着太子刚领到的一册礼仪。':'册命已下，东宫送来新的礼服和仪注。';
    return {
      title:'东宫 · 从前的名字',motherHere:together,
      text:opening+(together
        ? `赵令仪来替${k.name}看衣袖的长短。左右都改口称殿下，她一时仍喊了他的名字。母子相视，谁也没有立刻改口。\n她问你：“往后人前自然要守礼。只在咱们几个面前，还能照从前唤他么？”`
        : `${k.name}从旧物中取出一枚生母收存的书签。左右都称殿下，夹在书页里的小笺却还写着他的名字。\n他问你：“这点旧物，我还可以留在东宫么？”`),
      choices:[
        {label:together?'私下仍照从前唤他':'准他把生母的旧物留下',keep:true,
          outcome:together?'赵令仪替他理平了袖口，又唤了一遍从前的名字。他答应得和往常一样。':'书签仍夹在他常翻的那一册里。往后来人称他殿下，他听见自己的名字也还会回头。',
          child:'人前行太子的礼，家里也还有人记得我的名字。',mother:'平日还可以好好唤他一声。',reward:['love',3,'父爱']},
        {label:'一同读一遍东宫的新礼',keep:false,
          outcome:'你将新仪注摊在案上，随他逐条读了，遇到生硬处便停下来解释。那本册子由他自己收好。',
          child:'东宫礼数多，有些还可以慢慢问明白。',mother:'知道他读得明白，我也安心些。',reward:['vir',2,'品德']}
      ]
    };
  },
  (k,m,arc)=>({
    title:'东宫 · 太傅第一问',
    text:`${arc.keep?'东宫案边，还收着那日留下的旧物。':'东宫的仪注已翻过几遍，案角一页起了毛边。'}太傅说，${k.name}近日晨昏按时读书，碰见疑难却常停笔。\n你问起缘故。他说：“${kidAge(k)<12?'从前答错，先生还肯教我。现在他们都说殿下答得好，我反倒不知道哪里不会。':'近日问同一件事，左右答得越来越齐。儿臣想听实话，却不知道谁还肯直说。'}”`,
    choices:[
      {label:'准他每日留一段自行温书的时辰',outcome:'太子可自行挑一页未读明白的书，次日再带给太傅。头一日他留下了两处疑问。',
        child:'有几页书，可以依自己的步子慢慢读熟。',reward:['love',3,'父爱']},
      {label:'命太傅照常批错，准师生当面说理',outcome:'次日送来的课卷果然有两处墨批。太子翻出旧卷，两人当面讲明了第一处。',
        child:'先生肯指出错处，我才知道哪里真正学会了。',reward:['lit',3,'才学']}
    ]
  }),
  (k,m)=>{
    const together=inPalace(m);
    return {
      title:'东宫 · 河间旧闻入册',motherHere:together,
      text:`修册的礼官送来一份底稿。有人提议把赵令仪在河间展掌一事写在${k.name}的册礼卷首，誉为天命早现。另有人说，卷首写的是本朝如何择储，此事宜另载旧闻。\n底稿传至东宫，${k.name}在“天命早现”四字旁留了空白，等你定夺。`+
        (together?'\n赵令仪细看那一页：“河间那一刻，臣妾自己也惊讶。若要留下，能不能也把这句实话记进去？”':''),
      choices:[
        {label:'册书写册礼，另录见闻与传言的来处',outcome:'礼官分卷誊写。册书依实录册礼，河间记另注亲见与传闻，备后人查考。',
          child:'将来翻到册书，我还可以读到今日该做好的事。',mother:'我还记得自己的惊讶，如今也有人肯把它照实写下。'},
        {label:'册书只载册礼，河间旧闻留存内档',outcome:'底稿中的河间一段归入内档。东宫收到的册书只写册礼，旧闻留待愿意查考时再读。',
          child:'母亲的往事有了存放的地方，我也能安心翻开自己的册书。',mother:'听说旧事已经收好。往后见他，我还可以只问他近日书读得怎样。'}
      ]
    };
  }
];
function gouyiCrownEvent(k,m){
  const arc=k.gouyiCrown,stage=arc.stage,create=GOUYI_CROWN_SCENES[stage];
  if(!create||S.turn<arc.due||k.pendingName||!childInPalace(k)||mourningActive())return null;
  const scene=create(k,m,arc);
  const valid=()=>!S.over&&S.gen===arc.gen&&S.heir===k.id&&k.mom===m.id&&k.gouyiCrown===arc&&arc.stage===stage&&childInPalace(k)&&!mourningActive()&&(!scene.motherHere||inPalace(m));
  const people=scene.motherHere?[k,m]:[k];
  return {title:scene.title,por:k,cast:people,present:people,valid,text:scene.text,choices:scene.choices.map(option=>({t:option.label,f:()=>{
    if(!valid())return null;
    arc.stage++;arc.due=S.turn+(stage===0?1:2);
    if(stage===0)arc.keep=option.keep;
    const thread=`gouyi-crown:${S.gen}:${k.id}`;
    livedRecord(people,'family',scene.title,thread,`【${scene.title}】${option.outcome}`,[option.child,option.mother]);
    log(`【${scene.title}】${option.outcome}`,1);
    if(!option.reward)return option.outcome;
    const [stat,value,label]=option.reward;
    k[stat]=clamp(k[stat]+value);
    return `${option.outcome}\n§${label}+${value}`;
  }}))};
}
function gouyiCrownSettled(previous){
  if(!gouyiCrownActive()||!previous||S.over||previous.gen!==S.gen)return;
  const appointed=previous.heir!==S.heir;
  if(!appointed&&previous.turn===S.turn)return;
  const k=kidById(S.heir),m=k&&byId(k.mom);
  if(!k?.alive||k.sex!=='m'||k.removedFromRoyal||!m?.gouyi||(m.gouyi.gen??S.gen)!==S.gen)return;
  if(k.gouyiCrown?.gen!==S.gen)k.gouyiCrown={gen:S.gen,stage:0,due:S.turn,late:!appointed};
  const event=gouyiCrownEvent(k,m);
  if(event)(appointed?pushNow:pushEv)(event);
}
