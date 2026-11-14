/* A fictional court Daoist office inspired by Qin'an Hall. Buddhism remains separate. */
const DAO_MASTERS=[
  {name:'玄微',gender:'男',cell:0,temper:'清疏',line:'风自有来处，人也各有心事。陛下今日，是来问天下，还是问自己？'},
  {name:'照尘',gender:'女',cell:1,temper:'通达',line:'山川不言，却不曾藏起答案。愿听人说完，再翻书求证。'},
  {name:'观澜',gender:'男',cell:2,temper:'博闻',line:'仰观星辰，也要俯察人间。星图可记四时，不可替人判善恶。'},
  {name:'素问',gender:'女',cell:3,temper:'恬淡',line:'求静，不必先把世间都舍去。能安顿眼前一念，已是一程。'}
];
function daoMaster(){
  const cell=S.flags.daoMaster??((S.consorts[0]?.seed||0)%4);
  return {...DAO_MASTERS[cell%4],daoMaster:true,alive:true};
}
function daoEligible(p){
  const localChild=p?.alive&&!p.jailed&&!p.away&&!p.templeStay&&!p.removedFromRoyal&&p.princessMarriage!=='frontier';
  return !S.over&&!!p&&(p.sex?localChild&&kidAge(p)>=12&&!p.pendingName:inPalace(p)&&!p.maid&&p.preg<2)&&(p.hp??100)>=40;
}
function daoInterest(p){
  if(p.t2==='信佛'||p.like==='佛经')return 0;
  if(p.daoPractice?.path==='dao')return 3;
  return p.sex?(p.amb<=30?2:p.lit>=70?1:0):['淡泊','沉静'].includes(p.trait)?2:['好学','聪慧'].includes(p.trait)||p.mood<35?1:0;
}
function daoVisitors(){
  return [...S.consorts,...S.children].filter(daoEligible).filter(p=>{
    const interest=daoInterest(p),roll=mulberry32((p.seed||p.id)^Math.imul(S.turn+1,7823))();
    return interest>0&&roll<(interest===3?.65:interest===2?.4:.18);
  }).sort((a,b)=>mulberry32(a.id+S.turn*43)()-mulberry32(b.id+S.turn*43)()).slice(0,4);
}
function recordDaoVisit(p){
  p.daoPractice||={path:'dao',visits:0};const d=p.daoPractice;
  if(d.lastVisit===S.turn)return;
  d.lastVisit=S.turn;d.visits++;d.path='dao';
  if(d.visits===1||d.visits%6===0)(p.sex?kstory:story)(p,`来到钦安殿听讲、读书，${d.visits===1?'初识清修日常':'已有自己的问道心得'}。`);
}
function daoLifeTick(){
  if(S.flags.daoLifeTurn===S.turn)return;S.flags.daoLifeTurn=S.turn;
  S.flags.daoMaster??=daoMaster().cell;
  daoVisitors().forEach(recordDaoVisit);
}
const DAO_READINGS=[
  {title:'鲲鹏之问',source:'《庄子·逍遥游》',quote:'北冥有鱼，其名为鲲。',line:p=>p.sex?`${p.sex==='f'?'女儿':'儿臣'}想，若能像大鹏那样乘风，宫墙之外的山川，该是什么颜色？`:'从前只觉大鹏飞得高，如今倒想问，那风若不来，人可还守得住自己的心？'},
  {title:'濠上观鱼',source:'《庄子·秋水》',quote:'子非鱼，安知鱼之乐？',line:()=> '池里的鱼不争岸上的位置。可我们说它自在，会不会也只是自己的心愿？'},
  {title:'梦蝶',source:'《庄子·齐物论》',quote:'不知周之梦为胡蝶与，胡蝶之梦为周与？',line:()=> '昨夜梦里走过一片花林，竟忘了宫中称谓。醒来还想留住那一刻，却又觉得，梦不必留。'},
  {title:'海客谈瀛洲',source:'李白《梦游天姥吟留别》',quote:'海客谈瀛洲，烟涛微茫信难求。',line:p=>p.sex?`父皇，诗里说仙山难求，却又不说一定没有。您能带${p.sex==='f'?'女儿':'儿臣'}去东海看看么？只看一回真正的海，也好。`:'臣妾不求长生，只想亲眼见一回海上明月。那些仙人的故事，会不会也是人望得太远，生出的念想？'},
  {title:'树下清风',source:'《庄子·逍遥游》',quote:'逍遥乎寝卧其下。',line:()=> '那棵不合木匠心意的树，反倒留下了一片阴凉。人是不是也不必每一样，都长成旁人要的样子？'},
  {title:'清心不忘人间',source:'宫中原创对话',quote:'山静不妨人有念，云闲也记旧时春。',line:p=>p.sex?'儿臣喜欢这里清静，可并非不惦记母亲。读完这一卷，还想回去陪她坐坐。':'臣妾来这里，不是把旧事全忘了。只是想学着不让一件伤心事，占满往后的日子。'}
];
function daoReading(p){return DAO_READINGS[((p.daoPractice?.talks||0)+(p.seed||p.id))%DAO_READINGS.length];}
function daoPracticePanel(p){
  const d=p.daoPractice;if(!d)return '';
  return `<p><span class="tag">${d.visits>=6?'潜心问道':'向道初识'}</span> 曾到钦安殿 ${d.visits} 次${p.sex&&p.amb<=30?' · 性情淡泊':''}</p>${d.lastLine?`<p class="hint">${esc(d.lastLine)}</p>`:''}`;
}
function daoRemember(p,line){
  (p.sex?kstory:story)(p,line);p.daoPractice||={path:'dao',visits:0};p.daoPractice.lastLine=line;
  NPCMemory.record(S,{type:'dao-conversation',time:S.turn,location:'钦安殿',participants:[p.id],object:line},[{person:p.id,subject:'emperor',interpretation:line,emotion:.6,impact:60}]);
}
function daoConversation(p){
  if(!daoEligible(p)||!daoVisitors().includes(p))return null;
  const topic=daoReading(p),d=p.daoPractice,ready=S.turn-(d?.lastTalk??-99)>=3;
  const valid=()=>daoEligible(p)&&daoVisitors().includes(p)&&S.turn-(p.daoPractice?.lastTalk??-99)>=3;
  const settle=(kind)=>{
    if(!valid()||!useE())return null;recordDaoVisit(p);p.daoPractice.lastTalk=S.turn;p.daoPractice.talks=(p.daoPractice.talks||0)+1;
    if(p.sex){p.lit=clamp(p.lit+2);p.love=clamp(p.love+4);if(kind==='quiet')p.amb=clamp(p.amb-2);}
    else cchg(p,{mood:6,aff:4});
    const line=kind==='quiet'?`在钦安殿谈起「${topic.title}」，陛下愿留一隅清静，不强劝自己争胜。`:`在钦安殿谈起「${topic.title}」，陛下陪自己读完一页，许心中有不同的答案。`;
    if(kind==='sea')p.daoPractice.seaWish={status:'promised',turn:S.turn};
    daoRemember(p,line+(kind==='sea'?'又答应日后同游东海。':''));save('auto');
    return kind==='sea'?'这句话被认真记下了。钦安殿会保留这份出游之约，待精力与国库宽裕时可启程。':`${line}${p.sex?'才学+2，亲近+4。':'心情+6，情分+4。'}`;
  };
  return {title:topic.title,por:p,valid:()=>daoEligible(p)&&daoVisitors().includes(p),text:`${porName(p)}在廊下展开书页，指给你看：\n“${topic.quote}”\n——${topic.source}\n“${topic.line(p)}”${ready?'':'\n前次的话还在心头，过些日子再续谈。'}`,choices:[
    {t:'陪着读下去 · 精力−1',cond:()=>ready&&E().energy>0,f:()=>settle('read')},
    {t:'许留一隅清静，不强求争胜 · 精力−1',cond:()=>ready&&E().energy>0,f:()=>settle('quiet')},
    ...(topic===DAO_READINGS[3]&&p.sex?[{t:'答应日后一起去东海 · 精力−1',cond:()=>ready&&E().energy>0,f:()=>settle('sea')}]:[]),{t:'让其安心读书'}]};
}
A.daoTalk=function(id){if(modalOpen)return;const p=byId(id)||kidById(id);pushEv(daoConversation(p));};
function viewDaoHall(){
  const master=daoMaster(),visitors=daoVisitors(),promises=S.children.filter(k=>daoEligible(k)&&k.daoPractice?.seaWish?.status==='promised');
  return `<section class="dao-hall"><header><p>文渊阁南 · 松风入殿</p><h2>钦安殿${backBtn}</h2></header><div class="dao-master">${porImg(master,190)}<div><span class="tag">${master.gender}国师 · ${master.temper}</span><h3>${master.name}国师</h3><blockquote>“${master.line}”</blockquote><p class="hint">讲读道经、静坐问道与宫中祈福之所。</p><div class="acts"><button class="btn gold" onclick="A.daoTeach()">请国师讲道<small>精力−1</small></button><button class="btn" onclick="A.daoRite()">为众人祈福<small>国库−20 · 精力−1</small></button></div></div></div></section>
    ${promises.map(k=>`<div class="card"><div class="grow"><strong>与${esc(k.name)}的东海之约</strong><p>已经答应带孩子去看海，可沿岸观潮、访舟人。</p><button class="btn jade" onclick="A.daoSea(${k.id})">相携赴东海<small>国库−50 · 精力−2 · 每年一次</small></button></div></div>`).join('')}
    ${pregnancyPrayerHall()}
    <h3>此刻在殿中</h3>${visitors.length?`<div class="grid">${visitors.map(p=>`<button class="card portrait-card" onclick="A.daoTalk(${p.id})">${porImg(p,92)}<div class="grow"><strong>${esc(porName(p))}</strong><p>${esc(daoReading(p).title)} · ${p.daoPractice?.visits>=6?'常来听讲':'临窗读书'}</p><span class="person-link">听听心中所想 →</span></div></button>`).join('')}</div>`:'<p class="hint">此刻只有国师在整理经卷。不同性情的人会在往后的日子来访。</p>'}`;
}
A.daoTeach=function(){
  if(modalOpen||S.over)return;const ready=S.turn-(S.flags.daoTeaching??-99)>=3;
  const sayings=['读《逍遥游》，有人只见九万里，有人看见那一阵托起鹏翼的风。人有所待，未必可耻；知道自己倚仗什么，才不轻慢旁人。','殿中有清静，宫外也有生计。陛下若问如何祈国泰，贫道愿先问一句：今年水利与仓廪，可有人照料？','求仙之说可以听，济世之事不可误。星辰的运行与人的身世，不该混作同一本账。','斋醮是寄愿，不是向天地讨一纸保证。心中有愿，也当在人间尽力。'];
  const guest={name:['云游文士','访道女史','校书文士','采芝女客'][(S.flags.daoLessons||0)%4],courtCraneCell:(S.flags.daoLessons||0)%4};
  pushEv({title:'松下问道',cast:[daoMaster(),guest],text:guest.name+'也在席间，向国师问起读书与修心。\n'+sayings[(S.flags.daoLessons||0)%sayings.length]+(ready?'':'\n国师笑道：“前番所论，不妨先在日常里想一想。”'),choices:[
    {t:'静听一席 · 精力−1',cond:()=>ready&&E().energy>0,f:()=>{if(S.turn-(S.flags.daoTeaching??-99)<3||!useE())return null;S.flags.daoTeaching=S.turn;S.flags.daoLessons=(S.flags.daoLessons||0)+1;chg({wen:1});log('帝至钦安殿，与国师谈论逍遥与济世。');save('auto');return '松影移过书案，你记下了今日一问。文才+1。';}},{t:'改日再来'}]});
};
A.daoRite=function(){
  if(modalOpen||S.over)return;const ready=()=>S.turn-(S.flags.daoRite??-99)>=12&&E().treasury>=20&&E().energy>0;
  pushEv({title:'钦安祈愿',por:daoMaster(),text:'国师拟在殿中行一场简朴斋醮，为宫中人与百姓祈安。费用用于灯烛供物与施济，不炼丹、不许诺长生。\n每年可主持一次；国库须有20万两，精力须有1点。',choices:[
    {t:'准行祈愿，另记施济名册',cond:ready,f:()=>{if(!ready()||!useE())return null;S.flags.daoRite=S.turn;chg({treasury:-20,people:1});daoVisitors().forEach(p=>{recordDaoVisit(p);daoRemember(p,'在钦安殿为亲人与百姓祈安，陛下命将施济之事一并办妥。');});save('auto');return '殿中灯火温明，施济名册也已交付。民心+1。';}},{t:'暂缓'}]});
};
A.daoSea=function(id){
  const k=kidById(id);if(modalOpen||!daoEligible(k)||k.daoPractice?.seaWish?.status!=='promised')return;
  const ready=()=>daoEligible(k)&&k.daoPractice?.seaWish?.status==='promised'&&S.turn-(S.flags.daoSeaTurn??-99)>=12&&E().energy>=2&&E().treasury>=50;
  pushEv({title:'东海之约',cast:['emp',k],valid:()=>daoEligible(k)&&k.daoPractice?.seaWish?.status==='promised',text:`${k.name}早将海图摊开：“父皇还记得那句诗么？不必真找到仙人，只要您肯同去。”\n安排近岸巡游，侍卫、医官与舟师同行，避开风浪，不作远洋求仙。`,choices:[
    {t:'启程，带孩子亲眼看海 · 国库−50 · 精力−2',cond:ready,f:()=>{if(!ready())return null;E().energy-=2;chg({treasury:-50});S.flags.daoSeaTurn=S.turn;k.daoPractice.seaWish.status='travelling';save('auto');pushNow(daoCoastEvent(k));return null;}},{t:'先把约定记着'}]});
};
function daoCoastEvent(k){
  const valid=()=>k?.alive&&k.daoPractice?.seaWish?.status==='travelling';
  const end=(kind)=>{if(!valid())return null;const line={tide:'父皇陪自己看了一日海潮。未见仙山，却听见舟人讲星路与潮汐，才知书外天地辽阔。',boat:'父皇请老舟人讲海上的传闻。远处雾影散后只是岛山，仙人未得见，心中仍留一片远方。',shore:'父皇陪自己沿岸访人家，将余下物资赠给风灾后的村落。原想寻仙，却先看见了人间。'}[kind];k.daoPractice.seaWish={status:'fulfilled',turn:S.turn,ending:kind};k.lit=clamp(k.lit+3);k.love=clamp(k.love+8);if(kind==='shore')k.vir=clamp(k.vir+3);daoRemember(k,line);log(`${kidName(k)}随帝游东海，${line}`,1);save('auto');return `${line}\n才学+3，亲近+8${kind==='shore'?'，品德+3':''}。`;};
  return {title:'烟涛微茫',scene:'dao-coast',por:k,valid,text:`海天相接，潮声一阵阵卷过礁石。${k.name}扶着栏杆，许久没有说话。\n“在宫里读诗时，以为瀛洲只隔着几页纸。原来真正的海，这样远。”\n老舟人指向烟霭中的岛影，笑说海客的故事多，能证实的却少。`,choices:[
    {t:'一起观潮，听舟人讲星路',f:()=>end('tide')},{t:'问问那些仙人的传说',f:()=>end('boat')},{t:'往沿海村落走一走',f:()=>end('shore')}]};
}
function pendingDaoVoyage(){const k=S.children.find(k=>k.alive&&k.daoPractice?.seaWish?.status==='travelling');return k?daoCoastEvent(k):null;}
function daoLifeVoice(p){
  if(!p.daoPractice)return null;const sea=p.daoPractice.seaWish;
  if(sea?.status==='fulfilled')return voiceLine('sea-memory','说起那次东海之行，眼里又有了光。','那日没有寻到仙人，可潮声到今日还记得。若问什么最难得，我想，是有人肯陪着去看。');
  if(sea?.status==='promised')return voiceLine('sea-promise','书页里夹着一张小小的海图。','东海的约定，还记得么？我把诗又读了一遍，仍想亲眼看看。');
  if(p.daoPractice.visits<3)return null;
  return voiceLine('dao-life','案上多了一卷从钦安殿借来的书。',p.sex?['儿臣又去听国师讲书了。以前只盼事事赶在旁人前头，如今也想知道，自己究竟喜欢什么。','殿前松风很轻，书里的天地很远。读完回来，却觉得宫里的灯也很好。']:['今日在钦安殿静坐，倒没有刻意想什么。出来时看见枝头一片新叶，心里忽然松了些。','书中说逍遥，臣妾却还惦记故人。想来问道，也不必把心变成石头。']);
}
