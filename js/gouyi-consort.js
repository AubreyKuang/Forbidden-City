/* 化用《汉书·外戚传》的河间奇女、帝前展掌。赵令仪之名及后续均为架空创作。 */
function gouyiEncounter(){
  if(!careersActive()||S.flags.gouyiSeen)return null;
  const g=makeGirl({sur:'赵',given:'令仪',age:22,trait:'沉静',fam:{t:'良家子',p:12}});
  g.artPortrait=STORY_CONSORT_PORTRAITS.gouyi;g.portraitOverride=422;
  delete g.solitary;delete g.timeTraveler;g.t2='念旧';g.like='字画';g.hate='兵器';g.aff=40;g.hp=82;g.willing=true;
  g.gouyi={met:S.turn,opened:false,epithet:'钩弋夫人'};
  if(gouyiLifeActive())fixGouyiIdentity(g);
  const valid=()=>!S.flags.gouyiSeen;
  return {title:'浩荡巡狩 · 河间奇女',por:g,valid,ref:'化用《汉书·外戚传》；人物姓名与后续为架空创作。',text:'车驾巡至河间，旌旗沿河岸铺开。随行望气者说，此间有一位异于常人的女子。\n被引来的赵令仪已经二十二岁，两手自幼蜷握，旁人从未见她展掌。她不肯让人再试着掰开，只低声说：“民女不是供人取笑的奇物。”\n她抬眼看向御座，紧握的指节却轻轻动了一下。',choices:[
    {t:'屏退围观者，亲自问她是否愿意近前',f:()=>{if(!valid())return null;
      S.flags.gouyiSeen={id:g.id,turn:S.turn,outcome:'相见'};g.gouyi.opened=true;
      story(g,'【河间展掌】浩荡巡狩中蒙召相见。旁人面前始终蜷握的双手，唯在御前缓缓展开。她先惊后喜，也怕从此只被人当作祥瑞看待。');
      log('巡狩河间，赵令仪唯在帝前展掌，随行人称为“钩弋之遇”。',1);pushNow(gouyiAdmission(g));return null;
    }},
    {t:'赏赐医资，让她安静归家 · 国库−10',cond:()=>E().treasury>=10,f:()=>{if(!valid()||E().treasury<10)return null;chg({treasury:-10});S.flags.gouyiSeen={id:g.id,turn:S.turn,outcome:'归家'};log('河间女子赵令仪获赐医资归家，未被迫当众展掌，亦未入宫。',1);return '她将双手收进袖中，谢过之后归家。';}}
  ]};
}
function gouyiAdmission(g){
  const valid=()=>S.flags.gouyiSeen?.id===g.id&&S.flags.gouyiSeen.outcome==='相见';
  const fallback=()=>journalContentVersion()>=22&&rankCount(3)>=RANK_CAP[3];
  const canAdmit=()=>fallback()?rankCount(2)<RANK_CAP[2]:rankCount(3)<RANK_CAP[3];
  return {title:'钩弋之遇 · 掌心初开',por:g,valid,text:'你让她坐稳，等她自己将手伸出。她只在你的注视与轻扶之下，缓缓舒开双掌，指尖像初展的叶。帘外的人屏住呼吸，随行望气者将这桩奇遇称作“钩弋”。\n她没有立刻谢恩，只望着自己的掌心许久：“原来我也能这样拿住一盏茶。”\n问及去留，她愿随驾入宫，但想先说明：自己有名字，也会害怕，并不懂如何当一个祥瑞。',choices:[
    {t:fallback()?'应她所愿，接入宫中册为瑞常在':'应她所愿，接入宫中册为贵人',cond:canAdmit,why:journalContentVersion()>=22?'贵人与常在名额均已满':'贵人名额已满',f:()=>{
      if(!valid()||!canAdmit())return null;const rank=fallback()?2:3;if(rank===2)grantConsortTitle(g,'瑞');S.flags.gouyiSeen.outcome='入宫';if(gouyiLifeActive())g.arc=makeArc('gouyi',6);addConsort(g,rank,rank===2?'巡狩河间，帝前展掌后自愿随驾入宫；贵人位满，赐号瑞':'巡狩河间，帝前展掌后自愿随驾入宫');if(!gouyiLifeActive())g.arc=makeArc('gouyi',6);
      story(g,`【钩弋入宫】自愿随驾入宫，${rank===2?'贵人名额已满，册为瑞常在':'依本朝位分册为贵人'}；“钩弋夫人”只是这段奇遇的别称。她感激帝王相知，也愿往后被记住的是赵令仪。`);
      return '她随驾入宫，宫室按现有规制分配。“钩弋夫人”的传说开始流传，她自己的故事也从此续写。';
    }},
    {t:'赠她行资，尊重归家的另一条路 · 国库−10',cond:()=>E().treasury>=10,f:()=>{if(!valid()||E().treasury<10)return null;chg({treasury:-10});S.flags.gouyiSeen.outcome='归家';log('钩弋奇女赵令仪获赠行资归家，帝前展掌之事留在巡狩记中。',1);return '她珍重地接过行资，向车驾作别。奇遇未必以入宫作结。';}}
  ]};
}
ARCS.gouyi={name:'钩弋掌心',fit:c=>!!c.gouyi,stages:[
  c=>({text:'宫人常唤她“钩弋夫人”，又悄悄盯着她的手。她在你面前展掌，将一张练字纸压平：“臣妾学写自己的名字，倒比学当祥瑞容易些。”',choices:[
    {t:'记住她的名字，陪她写完',f:()=>{story(c,'【钩弋掌心】陛下陪她写下赵令仪三个字。她第一次觉得，那双手除了传说，也能留下自己的笔迹。');aNext(c,1,4,6);return fx(cchg(c,{aff:8,mood:8}));}},
    {t:'止住宫人窥看，让她自行习字',f:()=>{story(c,'【钩弋掌心】陛下止住宫人窥看，留她安静习字。她依然寡言，却不必日日把掌心展示给旁人。');aNext(c,1,4,6);return fx(cchg(c,{aff:3,mood:6}));}}
  ]}),
  c=>({text:'国师听闻河间旧事，来问她可曾记得展掌时的感觉。她说：“只觉得终于有人等我自己伸出手。”国师沉吟，说或是缘分，也不可拿一桩奇遇断人的一生。她转头问你：“若有一天不再被称作祥瑞，陛下还肯听我说话么？”',choices:[
    {t:'你是令仪，去留荣辱不由一句谶言决定',f:()=>{c.arc.f.seen=true;story(c,'【钩弋问缘】国师以缘分谈展掌之遇，陛下答应仍以她本人相待，不以祥瑞之名预定她与孩子的命运。');aNext(c,2,4,6);return fx(cchg(c,{aff:10,mood:8}));}},
    {t:'将传说留在旧记里，不再以此议论她',f:()=>{story(c,'【钩弋问缘】陛下命人将展掌之说留于旧记，不再拿来评断她日后的吉凶。她松了口气，也留了一分未说尽的忐忑。');aNext(c,2,4,6);return fx(cchg(c,{aff:4,mood:5}));}}
  ]}),
  c=>{const child=S.children.find(k=>k.alive&&k.mom===c.id&&!k.pendingName&&kidAge(k)<8&&familyVisitAllowed(k,c));return {text:child?`她在你身旁展掌，让${kidName(child)}的小手轻轻握住。孩子问起“祥瑞”，她却只问他今日吃得好不好。她抬头说：“愿这双手记住的是抱过他，不是旁人替他算过什么命。”`:'她在御前展开手掌，这回托着一枚磨得温润的棋子。“从前人人问我的手为何握着，”她说，“如今我倒想问，这一局该怎样落子。”',choices:[
    {t:child?'陪她与孩子坐一会儿':'陪她下完这一局',f:()=>{const text=child?`与陛下一同陪伴${kidName(child)}。她将御前展掌的奇迹变作托住孩子的温柔，不愿让谶言压在孩子身上。`:'与陛下对弈，掌心托起的只是一枚棋子。奇遇成了旧事，她终于能谈起自己眼下的日子。';if(child?.alive)kstory(child,`与生母${fullName(c)}和父皇相伴，她温柔地握住自己的手，说不必替旁人做祥瑞。`);aEnd(c,'掌心有温',text);return fx(cchg(c,{aff:10,mood:10}));}},
    {t:'听她说完，也给她自己的清静',f:()=>{aEnd(c,'旧谶归尘','她保留河间相遇的记忆，也有了不必向旁人解释的生活。陛下肯听，她便不再急着证明自己是个祥瑞。');return fx(cchg(c,{aff:4,mood:6}));}}
  ]};}
]};
ARCS.gouyi.stages=ARCS.gouyi.stages.map(create=>(c,f)=>maternalVoiceUrgent(c)?null:create(c,f));
const gouyiOut=A.out;
A.out=function(kind){
  if(kind!=='procession')return gouyiOut(kind);
  if(modalOpen||!careersActive()||E().treasury<80||S.turn-(S.flags.lastProcession??-99)<12||!useE())return;
  chg({treasury:-80});S.flags.lastProcession=S.turn;setScene('garden');log('帝整备仪仗浩荡巡狩，令沿途毋扰农桑。',1);
  const ev=!S.flags.gouyiSeen&&newConsortEventAllowed()?gouyiEncounter():null;
  pushEv(ev||{title:'浩荡巡狩',text:'车驾行过河岸，沿途查问农桑与水利。仪仗不入田垄，百姓照常往来，随行官员将见闻记入巡狩册。',choices:[{t:'巡毕回宫'}]});save('auto');
};
const gouyiViewOut=viewOut;
viewOut=function(){return gouyiViewOut()+(careersActive()?`<section class="detail-section"><h3>仪仗巡狩</h3><button class="btn gold" onclick="A.out('procession')" ${E().energy>0&&E().treasury>=80&&S.turn-(S.flags.lastProcession??-99)>=12?'':'disabled'}>浩荡巡狩<small>精力−1 · 国库−80 · 每年一次</small></button><p class="hint">沿途问农桑、阅河工，也许会遇见载入旧传的奇人异事。</p></section>`:'');};
const gouyiSolitaryTag=solitaryTag;
solitaryTag=function(c){return gouyiSolitaryTag(c)+(c?.gouyi?'<span class="tag y">钩弋之遇 · 帝前展掌</span>':'');};
const gouyiVoicePool=consortVoicePool;
consortVoicePool=function(c){const pool=gouyiVoicePool(c);if(c.gouyi&&inPalace(c)&&!maternalVoiceUrgent(c))pool.push(voiceLine('gouyi','她在你面前慢慢展掌，指尖停着一片落花。',c.aff>=60?'从前他们只想看我的手。如今我愿意把这片花也给您看看，您肯听我说它是从哪棵树上落下的。':'臣妾记得河间那日。只是有时也怕，人们记得钩弋，却忘了令仪。'));return pool;};
