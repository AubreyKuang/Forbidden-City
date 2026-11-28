/* ============ 冷宫岁月 · 失宠之问 · 时日无多 ============
   Three slow threads in a consort's life, each visible in her 纪事 and on her page.
   - 冷宫岁月: a consort in the cold palace no longer turns 心如死灰 after three months
     whatever happened. She regrets, hopes, resents or goes numb according to why she
     is there, how she feels about the emperor, and whether anyone still visits.
   - 失宠之问: a consort who used to be favoured and has been left alone asks why. The
     answer gives her something to work on for the following months.
   - 时日无多: consorts have a lifespan. A year before the end the physicians say so;
     the emperor can keep her company, her children come by, and she has a last wish.
   Journal content 171+; older scenes replay without any of it. */
const PALACE_LIFE_VERSION=171;
function palaceLifeActive(){return journalContentVersion()>=PALACE_LIFE_VERSION;}

Object.assign(XIN,{
 '懊悔':{c:'y',d:999,expr:'sad',mood:-1,scheme:-1,lines:['她把从前的事一件一件说给看守的老宫女听，说完总要加一句：是我糊涂。','冷宫的墙上有她用簪子划的道道，一道是一天，旁边刻着一个“悔”字。']},
 '盼望':{c:'y',d:999,expr:'worry',mood:0,lines:['每逢有脚步声经过冷宫门口，她都要到门边站一会儿。','她还留着进冷宫那天穿的衣裳，洗得发白，叠得整整齐齐。']},
 '麻木':{c:'k',d:999,expr:'blank',mood:-1,lines:['她不再问今天是什么日子，饭送来了就吃，天黑了就睡。','看守说，她常对着墙坐一整天，叫她也不应。']},
});
NEGX.push('懊悔','盼望','麻木');

/* ---------- 冷宫岁月 ---------- */
function coldLife(c){return c.coldLife ||= {visits:0};}
function coldMonths(c){return c.cold&&c.coldT!==undefined?S.turn-c.coldT:0;}
function coldWronged(c){return S.flags.wronged?.v===c.id;}
function coldGuilty(c){return !coldWronged(c)&&(c.schemeRecord?.last==='cold'||(c.story||[]).some(s=>/事发，被打入冷宫/.test(s.t)));}
function coldMotherOf(c){return S.children.filter(k=>k.mom===c.id&&k.alive&&!k.lost);}
// Returns [心境, 缘由, who] or null to leave her as she is.
function coldPalaceThought(c){
  const months=coldMonths(c),k=xinOf(c),since=S.turn-Math.max(c.coldLife?.lastVisit??-999,c.coldT);
  if(k==='心如死灰'||months<2)return null;
  if(since>=12)return ['心如死灰','冷宫的日子一天比一天长，再没有人来过'];
  if(c.coldLife?.brokenPromise)return ['怨恨','陛下说过会再来冷宫，没有来','emp'];
  if(since>=6&&months>=6)return ['麻木','在冷宫里住久了，不再数日子'];
  if(coldWronged(c))return ['盼望','盼着有人替她查清冤屈'];
  if(coldGuilty(c)&&c.aff>=35)return ['懊悔','在冷宫里想起从前做下的事'];
  if(c.aff>=45)return ['盼望',coldMotherOf(c).length?'惦记着宫里的孩子，盼着还能出去':'盼着陛下还记得她'];
  return ['怨恨','在冷宫里越想越不甘','emp'];
}
function coldPalaceLifeTick(c){
  const life=coldLife(c);
  if(life.promise!=null&&S.turn-life.promise>=6&&(life.lastVisit??-99)<=life.promise){life.brokenPromise=true;delete life.promise;}
  const next=coldPalaceThought(c);if(!next||next[0]===xinOf(c))return;
  const [k,why,who]=next;
  c.xin={k,t:S.turn,why,who:who||null};c.xinLog=k+why;
  story(c,`【冷宫岁月】入冷宫第${coldMonths(c)}个月，${why}。`);
}
function coldVisitEvent(c){
  const k=xinOf(c),kids=coldMotherOf(c),kid=kids[0],name=fullName(c);
  const release={t:'放她出冷宫',f:()=>{A.uncold(c.id);return `${name}出了冷宫，在门槛上站了很久才迈出步子。`}};
  const leave={t:'看过了，回去',f:()=>{story(c,'【冷宫岁月】陛下到冷宫来过，站了一会儿就走了。');return fx(cchg(c,{mood:2}))}};
  const base={por:c,present:[],valid:()=>c.alive&&!c.gone&&c.cold};
  if(k==='懊悔')return {...base,title:'冷宫 · 悔',text:`${name}跪在冷宫门内，没有抬头：“臣妾做错了事，不敢求陛下宽恕。只求陛下知道，臣妾是真的悔了。”`,choices:[
    {t:'“朕听见了。”',f:()=>{story(c,'【冷宫岁月】陛下到冷宫来，听她认了错。');remember(c,'care','陛下到冷宫来，听她认了错');return fx(cchg(c,{aff:5,mood:10}))}},
    {t:'命人添炭火被褥（国库-5万两）',f:()=>{story(c,'【冷宫岁月】陛下来过之后，冷宫里添了炭火和被褥。');c.hp=clamp((c.hp??60)+5);return fx(chg({treasury:-5}),cchg(c,{aff:4,mood:12}))}},
    release,leave]};
  if(k==='盼望')return {...base,title:'冷宫 · 盼',text:kid?`${name}隔着门先问：“${kid.name}还好吗？长高了没有？”问完才想起行礼。`:`${name}听见脚步声，早早等在门边：“外头的海棠，今年开了没有？”`,choices:[
    {t:kid?`把${kid.name}的近况讲给她听`:'把外头的事讲给她听',f:()=>{story(c,kid?`【冷宫岁月】陛下到冷宫来，讲了${kid.name}的近况。她听了两遍。`:'【冷宫岁月】陛下到冷宫来，讲了外头的事。');if(kid)kstory(kid,'父皇去冷宫看过母亲，回来说母亲问起自己长高了没有。');remember(c,'care','陛下到冷宫来，同她说了很久的话');return fx(cchg(c,{aff:5,mood:12}))}},
    {t:'“再等等，朕会再来。”',f:()=>{coldLife(c).promise=S.turn;story(c,'【冷宫岁月】陛下说会再来。她记下了这句话。');return fx(cchg(c,{aff:6,mood:8}))}},
    release,leave]};
  if(k==='怨恨')return {...base,title:'冷宫 · 怨',text:`${name}没有行礼，靠着门框看你：“陛下是来看臣妾落到什么地步的？”`,choices:[
    {t:'听她把话说完',f:()=>{if(chance(.4+c.aff/200)){c.xin={k:'盼望',t:S.turn,why:'陛下肯听她把话说完',who:null};delete coldLife(c).brokenPromise;story(c,'【冷宫岁月】她当着陛下的面把怨气说尽了，说到后来哭了。');return `她说了很久，越说声音越低，最后只剩下哭。${fx(cchg(c,{aff:6,mood:10}))}`}story(c,'【冷宫岁月】陛下到冷宫来，她说完便背过身去。');return `她说完，背过身去，再不开口。${fx(cchg(c,{aff:1}))}`}},
    {t:'斥责她不知悔改',f:()=>{story(c,'【冷宫岁月】陛下到冷宫来，斥责了她。');return fx(cchg(c,{aff:-5,mood:-8}))}},
    leave]};
  if(k==='麻木')return {...base,title:'冷宫 · 木',text:`${name}坐在窗下，你走到跟前，她过了很久才认出来，动了动嘴唇，没有出声。`,choices:[
    {t:'坐下陪她一会儿',f:()=>{c.xin={k:'盼望',t:S.turn,why:'陛下到冷宫来坐了一会儿',who:null};story(c,'【冷宫岁月】陛下在冷宫陪她坐了一会儿。她夜里问看守，今天是几月了。');remember(c,'care','陛下到冷宫来陪她坐了一会儿');return fx(cchg(c,{aff:5,mood:10}))}},
    {t:'命人添炭火被褥（国库-5万两）',f:()=>{story(c,'【冷宫岁月】冷宫里添了炭火和被褥。');c.hp=clamp((c.hp??60)+5);return fx(chg({treasury:-5}),cchg(c,{mood:6}))}},
    release,leave]};
  if(k==='心如死灰')return {...base,title:'冷宫 · 灰',text:`${name}始终没有抬头。桌上的饭菜已经凉透，没有动过。`,choices:[
    {t:'留下陪她（精力再-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();if(chance(.35+c.aff/250)){c.xin={k:'麻木',t:S.turn,why:'陛下在冷宫守了她半日',who:null};story(c,'【冷宫岁月】陛下在冷宫守了她半日。她终于抬头看了一眼。');return `天快黑时，她抬头看了你一眼。${fx(cchg(c,{aff:4,mood:8}))}`}story(c,'【冷宫岁月】陛下在冷宫守了她半日，她没有抬头。');return '直到你走，她也没有抬头。'}},
    release,leave]};
  return {...base,title:'冷宫',text:`${name}还穿着进来那天的衣裳，见了你，怔了一下才跪下：“陛下……是来放${c.coldCommoner?'民妇':'臣妾'}出去的吗？”`,choices:[
    {t:'“朕只是来看看。”',f:()=>{story(c,'【冷宫岁月】陛下到冷宫来看过她。');return fx(cchg(c,{aff:3,mood:4}))}},
    release,leave]};
}
A.coldVisit=function(id){
  const c=byId(id);if(!palaceLifeActive()||!c||!c.alive||c.gone||!c.cold||modalOpen)return;
  if(E().energy<=0){toast('本月精力已尽');return}
  const life=coldLife(c);if(life.lastVisit===S.turn){toast('这个月已经去过了');return}
  E().energy--;renderTop();life.lastVisit=S.turn;life.visits++;
  if(life.visits>=3)life.visited3=true;
  pushEv(coldVisitEvent(c));
};

/* ---------- 失宠之问 ---------- */
const FAVOR_RESOLVES={
  '改性子':{months:6,line:'收敛性子'},'学艺':{months:6,line:'读书学艺'},'顾孩子':{months:12,line:'把心思放在孩子身上'},'心冷':{months:6,line:'心冷了'}};
function favorLastSeen(c){return Math.max(c.enteredAt??0,c.lastPersonalAttention??-99,...(c.imperialNights||[]).filter(Number.isFinite));}
function favorInquiryCandidate(c){
  return inPalace(c)&&!c.maid&&!c.preg&&!c.twilight&&(c.nights||0)>=3&&c.aff>=50&&c.favor<35&&S.turn-favorLastSeen(c)>=6&&
    S.turn-(c.favorInquiry?.t??-99)>=36&&!isSolitary(c)&&c.trait!=='淡泊'&&!['悲恸','心如死灰','怨恨','有恃无恐'].includes(xinOf(c));
}
function favorInquiryEvent(only){
  if(!palaceLifeActive()||mourningActive())return null;
  const list=harem().filter(c=>(!only||c===only)&&favorInquiryCandidate(c));
  if(!list.length||!chance(.3*eventFrequency('heart')))return null;
  const c=pick(list),months=S.turn-favorLastSeen(c),top=recentFavoredConsort(harem().filter(o=>o!==c));
  const proud=['骄纵','骄矜'].includes(c.trait)||TRAITS[c.trait]?.jealous||c.scheme>=60,kid=S.children.find(k=>k.mom===c.id&&k.alive&&!k.adult&&!k.lost);
  const settle=(k,line)=>{c.favorInquiry={t:S.turn,k};if(FAVOR_RESOLVES[k])c.resolve={k,t:S.turn,until:S.turn+FAVOR_RESOLVES[k].months};story(c,`【失宠之问】${line}`);};
  return {title:'失宠之问',por:c,present:[c],valid:()=>inPalace(c),onQueue:()=>{c.favorInquiry={t:S.turn,k:'asked'};},
    text:`${cName(c)}屏退宫人，斟了一盏茶，迟疑许久才开口：“陛下已有${months}个月没来了。臣妾想了很久，是不是哪里做得不好？若是，求陛下明示，臣妾改。”${top?`\n她始终没有提${cName(top)}的名字。`:''}`,choices:[
    {t:'“是朕疏忽，不是你的错。”',f:()=>{settle('reassured','她问陛下自己哪里做得不好。陛下说是他疏忽，不是她的错。');setXin(c,'释然','陛下说失宠不是她的错');c.lastPersonalAttention=S.turn;return fx(cchg(c,{aff:6,mood:12,favor:8}))}},
    {t:'“你的性子，该收一收。”',f:()=>{
      if(proud){settle('改性子','陛下说她的性子该收一收。她记下了，回去把屋里最张扬的几件摆设收了起来。');setXin(c,'惶恐','陛下说她性子该收一收');return `她怔了怔，低头应了一声“是”。${fx(cchg(c,{mood:-6}))}`}
      settle('hurt','陛下说她的性子该收一收。她想了一夜，没想出是哪一处。');setXin(c,'委屈','陛下说她性子不好，她想不出是哪一处');return `她张了张口，终究没有问是哪一处。${fx(cchg(c,{aff:-4,mood:-10}))}`}},
    {t:'“多读些书，学些新东西。”',f:()=>{settle('学艺','陛下让她多读书、学些新东西。她第二天就向文渊阁借了书。');return fx(cchg(c,{mood:3}))}},
    {t:'“后宫人多，朕顾不过来。”',f:()=>{
      if(kid){settle('顾孩子',`陛下说后宫人多，顾不过来。她不再问了，把心思都放在${kid.name}身上。`);return `她点点头，转而说起${kid.name}近来的功课。${fx(cchg(c,{aff:-3,mood:-4}))}`}
      settle('心冷','陛下说后宫人多，顾不过来。她把从前绣给陛下的香囊收进了箱底。');setXin(c,'委屈','陛下说后宫人多，顾不过来');return `她笑了一下，替你把茶续满，没有再说话。${fx(cchg(c,{aff:-8,mood:-12}))}`}}]};
}
function favorResolveTick(c){
  const r=c.resolve;if(!r||!c.alive||c.gone)return;
  const kid=S.children.find(k=>k.mom===c.id&&k.alive&&!k.adult&&!k.lost);
  if(r.k==='改性子'){c.virtue=clamp(c.virtue+1.5);c.scheme=clamp(c.scheme-1.5);}
  else if(r.k==='学艺')c.talent=clamp(c.talent+1.5);
  else if(r.k==='顾孩子'&&kid){kid.lit=clamp(kid.lit+.6);kid.vir=clamp(kid.vir+.6);kid.love=clamp((kid.love??50)+.5);}
  else if(r.k==='心冷')c.aff=clamp(c.aff-1);
  if(S.turn<r.until)return;
  const done={'改性子':'半年过去，她说话做事都稳了许多（德行长了，心机淡了）。','学艺':'半年过去，她的才情长进了不少。','顾孩子':kid?`这一年她日日陪着${kid.name}读书习字，孩子的功课和品行都见了长进。`:'这一年她过得很安静。','心冷':'半年过去，她不再打听陛下去了哪宫。'}[r.k];
  story(c,`【失宠之后】${done}`);delete c.resolve;
}

/* ---------- 时日无多 ---------- */
function consortLifespan(c){const s=Math.abs(Math.trunc(c.seed||c.id*7919))%1000;return 50+s%29-(c.trait==='体弱'?8:0);}
function twilightMonthsLeft(c){return c.twilight?Math.max(0,12-(S.turn-c.twilight.since)):null;}
function twilightStartEvent(c){
  return {title:'太医密奏 · '+fullName(c),por:c,present:[],valid:()=>c.alive&&!c.gone,text:c.cold?`冷宫看守来报：${fullName(c)}入冬后一直咳，太医隔着门诊了脉，说怕是只有一年光景了。`:`太医院院判屏退左右，低声回奏：“${cName(c)}的脉象一日弱过一日，药石只能拖着。依臣看，怕是只有一年光景了。”`,
    choices:[{t:'知道了',f:()=>c.cold?null:'你让太医照常请脉，不必把话说给她听。'}]};
}
function twilightWishEvent(c){
  const kids=S.children.filter(k=>k.mom===c.id&&k.alive&&!k.lost),done=line=>{c.twilight.wish=true;story(c,`【时日无多】${line}`);};
  const base={por:c,present:[c],valid:()=>c.alive&&!c.gone&&inPalace(c)&&!!c.twilight};
  if(kids.length)return {...base,title:'最后的心愿',text:`${cName(c)}靠在榻上，说话很慢：“臣妾想看孩子们坐在一处，吃一顿饭。就在这屋里，不必铺张。”`,choices:[
    {t:'准，朕也来（国库-10万两）',f:()=>{done(`陛下准了她的心愿。${kids.map(k=>k.name).join('、')}围坐一桌，她吃得很少，一直在看。`);kids.forEach(k=>kstory(k,'陪母亲吃了一顿饭。母亲吃得很少，一直在看着大家。'));c.twilight.visits++;return fx(chg({treasury:-10}),cchg(c,{aff:8,mood:20}))}},
    {t:'让孩子们去陪她',f:()=>{done(`${kids.map(k=>k.name).join('、')}陪她吃了一顿饭。陛下没有来。`);kids.forEach(k=>kstory(k,'陪母亲吃了一顿饭。母亲问了一次父皇来不来。'));return fx(cchg(c,{mood:10}))}},
    {t:'她该静养',f:()=>{done('她想看孩子们一处吃顿饭，陛下说她该静养。');return fx(cchg(c,{mood:-10}))}}]};
  return {...base,title:'最后的心愿',text:`${cName(c)}望着窗外：“臣妾想去御花园再看一回海棠。陛下若是得空……”她没有把话说完。`,choices:[
    {t:'陪她去（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();done('陛下陪她去御花园看了海棠。她走得很慢，在树下站了很久。');c.twilight.visits++;return fx(cchg(c,{aff:8,mood:20}))}},
    {t:'命人折几枝送去',f:()=>{done('她想去御花园看海棠。陛下命人折了几枝送到她屋里。');return fx(cchg(c,{mood:6}))}},
    {t:'她该静养',f:()=>{done('她想去御花园看海棠，陛下说她该静养。');return fx(cchg(c,{mood:-10}))}}]};
}
function twilightPassingEvent(c){
  const near=(c.twilight?.visits||0)>=3,kids=S.children.filter(k=>k.mom===c.id&&k.alive&&!k.lost);
  c.alive=false;c.deathReason='寿终正寝';
  story(c,near?'【时日无多】最后这一年陛下常来。她走在一个清晨，很安详。':'【时日无多】她走在夜里，身边只有守夜的宫女。');
  recordConsortPassing(c);
  kids.forEach(k=>kstory(k,`母亲${fullName(c)}寿终正寝，享年${c.age}岁。`));
  harem().forEach(o=>{if(relGet(o,c)>=40){setXin(o,'悲恸',`${fullName(c)}去了`);story(o,`${fullName(c)}寿终，她哭了一场。`);}});
  if(near)completeHiddenGoal('lastCompany');
  log(`${fullName(c)}寿终正寝，享年${c.age}岁。`,1);
  const next=c.rank<7?RANKS[c.rank+1]:null;
  return {title:'后宫丧讯 · '+fullName(c),por:c,present:[],sfx:'sad',deathNotice:c.id,
    text:`${c.passingDate}，${fullName(c)}寿终正寝，享年${c.age}岁。\n${near?'最后这一年你常去看她。宫女说，她走得很安详，枕边放着你上回带去的东西。':'守夜的宫女说，她夜里问过一次，陛下今日来不来。'}`,
    choices:[...(next&&!c.maid&&!c.cold?[{t:`追封为${next}，厚葬（国库-30万两）`,f:()=>{c.posthumous=next;story(c,`陛下追封她为${next}，以${next}之礼安葬。`);log(`追封${fullName(c)}为${next}。`,1);kids.forEach(k=>{k.love=clamp((k.love??50)+5);kstory(k,`父皇追封母亲为${next}。`)});return fx(chg({treasury:-30,prestige:1}))}}]:[]),
      {t:'依礼安葬',f:()=>{story(c,'依礼安葬。');return null}}]};
}
function twilightTick(){
  for(const c of S.consorts){
    if(!c.alive||c.gone||c.maid||!Number.isFinite(c.age))continue;
    if(!c.twilight){
      if(c.age<consortLifespan(c)-1)continue;
      c.twilight={since:S.turn,visits:0};story(c,'【时日无多】太医说，她怕是只有一年光景了。');
      pushEv(twilightStartEvent(c));continue;
    }
    const months=S.turn-c.twilight.since;
    if(months>=12){pushEv(twilightPassingEvent(c));continue;}
    if(c.healthProfile)c.healthProfile.usual=Math.max(20,c.healthProfile.usual-3);
    if(Number.isFinite(c.hp))c.hp=Math.max(15,c.hp-3);
    if(!inPalace(c))continue;
    const kids=S.children.filter(k=>k.mom===c.id&&k.alive&&!k.lost&&S.turn-k.born>=48);
    if(kids.length&&chance(.25)){const k=pick(kids);kstory(k,`听说母亲身子不好，去${c.palace||'宫里'}陪了半日。`);story(c,`【时日无多】${k.name}来陪了她半日。`);c.mood=clamp(c.mood+4);}
    if(months>=6&&!c.twilight.wish&&!c.twilight.wishAsked){c.twilight.wishAsked=true;pushEv(twilightWishEvent(c));}
  }
}
function twilightVisitEvent(c){
  const first=(c.story||[]).find(s=>/入宫|册封|封为/.test(s.t)),kids=S.children.filter(k=>k.mom===c.id&&k.alive&&!k.lost);
  const memory=first?`她说起${first.d}的事：“那时候臣妾什么都不懂。如今想起来，像是上辈子的事了。”`:kids.length?`她说起${kids[0].name}小时候的事，说着说着笑了。`:'她说起从前宫里的旧人，一个一个数过去。';
  return {title:'陪伴',por:c,present:[c],valid:()=>c.alive&&!c.gone&&!!c.twilight,text:`${cName(c)}今日精神好些，让宫女扶着坐了起来。\n${memory}`,choices:[
    {t:'陪她说一下午的话',f:()=>{story(c,'【时日无多】陛下来陪她说了一下午的话。');remember(c,'care','时日无多时，陛下常来陪她说话');return fx(cchg(c,{aff:5,mood:12}))}},
    {t:'看着她把药喝完再走',f:()=>{story(c,'【时日无多】陛下看着她把药喝完才走。');if(Number.isFinite(c.hp))c.hp=clamp(c.hp+4);return fx(cchg(c,{aff:4,mood:8}))}}]};
}
A.twilightVisit=function(id){
  const c=byId(id);if(!palaceLifeActive()||!c||!c.alive||c.gone||!c.twilight||!inPalace(c)||modalOpen)return;
  if(E().energy<=0){toast('本月精力已尽');return}
  if(c.twilight.lastVisit===S.turn){toast('这个月已经陪过她了');return}
  E().energy--;renderTop();c.twilight.lastVisit=S.turn;c.twilight.visits++;c.lastPersonalAttention=S.turn;
  pushEv(twilightVisitEvent(c));
};

/* ---------- shared hooks ---------- */
function palaceLifeTick(){
  if(!palaceLifeActive())return;
  for(const c of S.consorts)favorResolveTick(c);
  twilightTick();
  palaceLifeGoals();
}
function palaceLifeActions(c){
  if(!palaceLifeActive()||!c.alive||c.gone)return '';
  if(c.cold)return `<button class="btn" data-onclick="A.coldVisit(${c.id})" ${coldLife(c).lastVisit===S.turn?'disabled':''}>去冷宫探望<small>${coldLife(c).lastVisit===S.turn?'本月已去过':'精力-1'}</small></button>`;
  if(c.twilight&&inPalace(c))return `<button class="btn jade" data-onclick="A.twilightVisit(${c.id})" ${c.twilight.lastVisit===S.turn?'disabled':''}>陪她坐坐<small>${c.twilight.lastVisit===S.turn?'本月已陪过':'精力-1'}</small></button>`;
  return '';
}
function consortSeasonsPanel(c){
  if(!c.alive||c.gone)return '';
  const lines=[];
  if(c.twilight)lines.push(`时日无多 · 太医说还有约 ${twilightMonthsLeft(c)} 个月 · 已陪伴 ${c.twilight.visits} 次`);
  if(c.cold&&c.coldT!==undefined){const life=c.coldLife;lines.push(`冷宫岁月 · 已 ${coldMonths(c)} 个月 · ${life?.visits?`探望 ${life.visits} 次，上次在 ${S.turn-life.lastVisit} 个月前`:'还没有人来看过'}${life?.promise!=null?' · 你说过会再来':''}`);}
  if(c.resolve)lines.push(`失宠之后 · 她正${FAVOR_RESOLVES[c.resolve.k].line}，还有 ${Math.max(0,c.resolve.until-S.turn)} 个月见分晓`);
  return lines.map(l=>`<div class="hint" style="margin-top:4px">${esc(l)}</div>`).join('');
}
function palaceLifeTag(c){return c.alive&&!c.gone&&c.twilight?'<span class="tag k">时日无多</span>':'';}

/* ---------- 隐藏成就 ---------- */
DYNASTY_HIDDEN_GOALS[0].hint='同一家的女儿，祖孙三代都进过宫。';
DYNASTY_HIDDEN_GOALS.push(
  {id:'fairJudge',name:'明镜高悬',description:'查实三起宫斗，没有一回只罚俸了事',hint:'害人的事查实了，每一回都没有轻轻放过。',target:1,reward:60},
  {id:'coldReturn',name:'冷宫回春',description:'到冷宫探望同一个人三次以上，又亲手放她出来',hint:'冷宫的门，你去敲过不止一回，最后把人带了出来。',target:1,reward:60},
  {id:'lastCompany',name:'送君一程',description:'一位妃嫔时日无多的那一年里，陪过她三次以上',hint:'有人只剩一年光景，那一年你常去她屋里坐。',target:1,reward:60});
function completeHiddenGoal(id){
  if(!palaceLifeActive())return;
  const goals=S.dynastyGoals ||= {},goal=DYNASTY_HIDDEN_GOALS.find(g=>g.id===id);
  if(!goal||goals[id]?.completed)return;
  goals[id]={completed:true,claimed:false,date:dateStr(),gen:S.gen};
  log(`【隐藏成就】${goal.name}达成，可在御书房领取赏银。`);
}
function palaceLifeGoals(){
  const verdicts=S.consorts.reduce((n,c)=>n+(c.schemeRecord?.n||0),0),fines=S.consorts.some(c=>c.schemeRecord?.everFined);
  if(verdicts>=3&&!fines)completeHiddenGoal('fairJudge');
  if(S.consorts.some(c=>c.alive&&!c.gone&&!c.cold&&c.coldLife?.visited3))completeHiddenGoal('coldReturn');
}
