/* 认养后的日子按实际同住月数计算。家乡与相貌的纪事只看生母。 */
function beginFosterAdjustment(k,carer,previous){
  k.fosterAdjustment={carer:carer.id,months:0,stage:0,last:S.turn};
  if(previous&&kidAge(k)>=3){
    k.fosterAdjustment.previous=fullName(previous);
    k.fosterAdjustment.previousTrust=childTrust(k,previous);
  }
}
function fosterAdjustmentMonth(k){
  const m=fosterOf(k);
  if(!m||!inPalace(m)||!childInPalace(k)||kidAge(k)>=14||k.pendingName)return;
  let a=k.fosterAdjustment;
  if(a?.carer!==m.id){
    // For an existing placement with no date, start with an established household.
    const elapsed=Number.isFinite(k.fosterT)?Math.max(0,S.turn-k.fosterT):10;
    a=k.fosterAdjustment={carer:m.id,months:elapsed,stage:0,last:S.turn-1};
    if(!elapsed){a.last=S.turn;return;}
    a.months--;
  }
  if(a.stage===3||a.last===S.turn)return;
  a.last=S.turn;a.months++;
  const stage=a.months>=10?3:a.months>=4?2:1;
  if(stage<=a.stage)return;
  a.stage=stage;
  const small=kidAge(k)<3,quiet=['内敛','审慎'].includes(childDisposition(k));
  const bond=k.motherBonds?.[m.id],trust=childTrust(k,m);
  const recent=!!bond?.activity&&S.turn-bond.turn<=4;
  const distant=trust<32||relGet(k,m)<25||(!recent&&trust<55&&m.mood<35);
  const warm=recent||trust>=58||(!distant&&m.virtue>=65);
  const who=childCareAddress(k,m)+fullName(m);
  let line;
  if(stage===1){
    if(small)line=warm?'乳母记下，在新屋睡的头几晚总容易醒。她把小床挪到榻边，听见动静便伸手轻轻拍背，孩子才又合上眼。':'乳母记下，换了床帐，孩子夜里一醒就找惯用的小被。抱到窗边，也还要哄上一会儿。';
    else line=quiet?'初到这边，夜里想喝水却没好意思喊人。第二天才知道，床头的小银壶就是给自己留的。':'头一回在这里用晚膳，拿着筷子等了半晌，原来这里不用等人催才动筷。连这些小事都要重新学。';
  }else if(distant){
    line=small?(stage===2?'乳母记下，孩子伸手要抱，她只匆匆应了一声便走开。那晚孩子一直攥着乳母的袖子。':'乳母记下，一连几晚都是自己守着。养母今日过来伸手，孩子认得她，却还是往乳母怀里缩。'):
      (stage===2?'拿着画去找她，她正忙，只说晚些再看。等到灭灯也没等来，孩子把画折好收回匣底，心里有些委屈。':'起先受了委屈还盼她来问，如今只把要说的话记在纸上。孩子觉得，自己在这里很少被听见。');
  }else if(warm){
    line=small?(stage===2?'乳母记下，只要她轻声哼起熟悉的小调，孩子就肯松开攥着的手，在她臂弯里睡熟。':'乳母记下，听见她进屋的脚步，孩子便探身朝她伸手。如今她也辨得出哪一声哭是在找她。'):
      (stage===2?'席上少了一味自己咽不下的菜，才知道她记得上回那句话。孩子头一次主动把凳子拉到她身边。':'今日遇上难事，才走到廊下就想起先去找她。她腾出半边榻让孩子坐下，听到最后才开口。');
  }else{
    line=small?(stage===2?'乳母记下，午睡渐渐安稳，醒来时仍会先摸一摸随身的小被。':'乳母记下，如今已认熟这间屋子，听见门响就会抬头看是谁回来了。'):
      (stage===2?'已记得哪扇窗前读书最亮，夜里偶尔还是想念原来的住处。':'已经知道她爱安静，也敢在晚膳后留一会儿，把自己这一天的事说给她听。');
  }
  if(!small&&stage>1&&a.previous&&warm&&trust>=a.previousTrust+10)line+='想起从前跟着'+a.previous+'时总把话憋回去，眼下有人肯听，心里踏实多了。';
  const title='在养母身边';
  lifeRecord([k,m],'family',title,'【'+title+'】'+k.name+'由'+who+'照料。'+line,'养母与孩子的日常',[{text:line,emotion:distant?-.45:.45}]);
}
function consortHomeland(c){
  if(c?.fixedStory==='ayimu')return '白泉';
  if(!c?.fam||!outsiderConsort(c))return '';
  return FOREIGN_CONSORT_ORIGINS.find(o=>o.fam===c.fam.t)?.region||'西域';
}
const homelandTongue=c=>c.fixedStory==='ayimu'?'白泉话':'家乡话';
function palaceSpeechMonths(c){
  return Math.max(0,S.turn-(c.enteredAt??c.rescue?.at??0))+(c.palaceSpeech?.practice||0);
}
function palaceSpeechStage(c){
  const months=palaceSpeechMonths(c);return months>=15?3:months>=6?2:months>=1?1:0;
}
function palaceSpeechProgress(c){
  const stage=palaceSpeechStage(c);
  if(!stage||stage<=(c.palaceSpeech?.stage||0))return;
  const state=c.palaceSpeech||={};state.stage=stage;
  const home=consortHomeland(c);
  const first=c.rescue?'她画下记忆里河湾旁的织坊，请译者把「织坊」两个字写在旁边。再有人问起故乡，她想亲口说给对方听。':{
    白泉:'排舞时，译者正要上前，她先用中原话说了声「等鼓响再起」。乐工应声落槌，她听着那一拍，忍不住笑了。',
    西域:'茶房送来几种果脯，她先用家乡话念了一遍，又跟着女官学会说「我喜欢带酸的」。第二回果然送对了。',
    东瀛:'她拿着一张花笺，请女官教她怎样用中原话道谢。来送回信的人还没转身，就听见她亲口说了出来。',
    海西:'她想讲起故乡的港口，却一时想不起「潮」字。女官倒了半盆水比画，两个人一个用乡音、一个用中原话，终于说到了同一件事。'
  }[home];
  const line=stage===1?first:
    stage===2?'宫人换了值，她自己把缺的针线逐样说清。碰到不熟的字眼，她仍肯请人再讲一遍。':
    '今日有人把一句客套话译得生硬，她听出两边意思有差别，便用中原话重新讲了一遍。说起'+home+'的童谣，她仍喜欢原来的腔调。';
  story(c,'【学中原话】'+line);
}
function palaceSpeechPanel(c){
  if(journalContentVersion()<96||!consortHomeland(c))return '';
  const stage=palaceSpeechStage(c),ready=inPalace(c)&&!S.over&&stage<3;
  const detail=['正跟女官熟悉宫中称呼','已能用中原话问候、点茶','已能自己说明日常事务','能在中原话与'+homelandTongue(c)+'之间传意'][stage];
  return detailSection('乡音与中原话','<p>'+esc(consortHomeland(c))+' · '+esc(detail)+'</p>'+(ready?'<button class="btn" data-onclick="A.practicePalaceSpeech('+c.id+')" '+(S.turn-(c.palaceSpeech?.last??-99)<3||E().energy<1?'disabled':'')+'>陪她练中原话<small>精力−1 · 每三个月一次</small></button>':''));
}
A.practicePalaceSpeech=function(id){
  const c=byId(id);if(modalOpen||S.over||journalContentVersion()<96||!inPalace(c)||!consortHomeland(c)||palaceSpeechStage(c)>=3||S.turn-(c.palaceSpeech?.last??-99)<3||!useE())return;
  const state=c.palaceSpeech||={};state.last=S.turn;state.practice=(state.practice||0)+2;
  const line=palaceSpeechStage(c)<2?'她先用'+homelandTongue(c)+'说出最爱吃的点心，再听陛下讲中原的叫法。说到第三回，她已能自己向茶房要一碟。':'她试着用中原话讲一则故乡的笑话。陛下听得笑出来，她才放心，原来那句俏皮话也能讲得通。';
  story(c,'【同习中原话】'+line);cchg(c,{aff:2});palaceSpeechProgress(c);
  pushEv({title:'同习中原话',por:c,text:line,choices:[{t:'记下今日学的话'}]});
};
function homelandChildMonth(k,m,home){
  const age=kidAge(k);
  if(!childInPalace(k)||k.pendingName||k.palaceAdoption||k.outsideFamilyOrigin||k.birthSwap?.occurred&&!k.birthSwap.confirmed||age<3||age>=15)return;
  const stage=age>=11?3:age>=6?2:1;
  const prior=k.homelandMemories;
  if(prior?.stage>=stage||S.turn-(prior?.turn??-99)<12)return;
  const together=familyVisitAllowed(k,m),shy=['内敛','审慎','自矜'].includes(childDisposition(k));
  const bond=k.motherBonds?.[m.id],supported=together&&bond?.activity&&childTrust(k,m)>=65;
  const hurt=stage>1&&!supported&&(shy||childTrust(k,m)<30);
  const tongue=homelandTongue(m);
  let line;
  if(stage===1)line=together?'听母亲用'+tongue+'叫自己的小名，旁人却没听懂。孩子又叫了一遍，抬头等她应声，一来一回答得很开心。':
    '听乳母说，母亲家里问早的声音和宫里不同。孩子试着学了两遍，请乳母记下来，等以后再问。';
  else if(stage===2)line=hurt?'有人盯着孩子的眉眼，问是不是更像母亲，又央着听一句'+tongue+'。孩子本来愿意讲，围过来的人多了，却觉得自己好像成了给人看的稀奇事。':
    '对着铜镜，孩子发现自己挑眉的时候很像母亲。听见有人说宫里少见这样的眉眼，反倒笑着把眉梢又扬了扬：“我们家就是这样笑的。”';
  else if(hurt)line='同伴又用「像不像中原人」来猜孩子的来处。孩子这回说：“想知道我母亲家里的事，可以问我。别只看我的脸。”说完仍有几分委屈，却也松了口气。';
  else if(prior?.hurt&&supported)line='从前被人围住追问，孩子总把脸转开。这回自己挑了个安静的午后，把母亲说过的乡音写给相熟的同伴看：“这句我愿意教你。”';
  else line='有人问起母亲故乡的称呼，孩子特地把听过的词记成一小页，还在旁边画了自己笑起来的模样。孩子觉得，像母亲是一件值得留在册子里的事。';
  const answer=together&&stage>1?(hurt?'母亲听完，只说：“你想说的时候再说。旁人好奇，你也可以不答。”':'母亲听完笑起来，把自己幼时的小名也讲给孩子听。'):'';
  k.homelandMemories={stage,turn:S.turn,hurt};
  const text='【母亲的故乡】'+k.name+'的生母'+fullName(m)+'来自'+home+'。'+line+answer;
  lifeRecord(together?[k,m]:[k],'family','母亲的故乡',text,'皇嗣成长',[{text:line,emotion:hurt?-.4:.65}]);
}
function childUpbringingMonth(){
  for(const c of harem())if(consortHomeland(c))palaceSpeechProgress(c);
  for(const k of kidsAlive()){
    fosterAdjustmentMonth(k);
    const m=byId(k.mom),home=consortHomeland(m);
    if(home)homelandChildMonth(k,m,home);
  }
}
