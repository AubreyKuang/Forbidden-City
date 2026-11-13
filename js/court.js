/* ============ 朝堂事件 ============ */
const FLOOD_DIRECT_COST=300, FLOOD_DIKE_COST=90, FLOOD_DIKE_SAVING=140;
const RELIEF_SUSPENSION_MONTHS=3;
const FLOOD_AUDIT_COST=30, FLOOD_AUDITED_ODDS=70;
const reliefSuspended=father=>father?.reliefResumeTurn>S.turn;
const officialC=(p=50)=>{const a=harem().filter(c=>c.fam.p>=p&&!reliefSuspended(houseOf(c)?.father));return a.length?pick(a):null};
const COURT=[
 brief=>{const off=brief?harem().find(c=>c.id===brief.person):officialC(50);const ch=[
   {t:'拨银三百万两赈灾',f:()=>{log('黄河决堤，帝拨银三百万两赈灾。',1);return `赈灾粮银连夜出京，灾民感念皇恩。${fx(chg({treasury:-FLOOD_DIRECT_COST,people:10,prestige:3}))}`}},
   {t:'令地方官府自行筹措',f:()=>{log('黄河决堤，帝令地方自筹，民怨沸腾。');return `地方层层摊派，民间怨声四起。${fx(chg({people:-8}))}`}}];
  if(off)ch.push({t:`命${cName(off)}之父（${off.fam.t}）督办`,f:()=>{if(chance(.6)){story(off,'其父奉旨督办黄河赈灾，颇有成效，她在宫中亦觉面上有光。');return `差事办得漂亮。${fx(chg({treasury:-150,people:6,prestige:2}),cchg(off,{aff:8,mood:10}))}`}
    story(off,'其父督办赈灾不力，遭御史弹劾，她日夜忧惧。');return `赈灾银两被层层克扣，灾情反而加重。${fx(chg({treasury:-200,people:-5}),cchg(off,{mood:-12}))}`}});
  return {title:'黄河决堤',person:off?.id,text:'工部急奏：入夏以来暴雨连绵，黄河于开封段决口，良田万顷尽成泽国，灾民流离失所。',choices:ch}},
 brief=>{const e=E();const gen=harem().find(c=>brief?c.id===brief.person:c.trait==='将门');const ch=[
   {t:'遣大将出征',f:()=>{if(chance(S.flags.wolf?.35:.6)){log('北狄犯边，王师击退之。');return `王师告捷。${fx(chg({treasury:-300,prestige:5}))}`}return `前线失利，丢了两座城池。${fx(chg({treasury:-300,prestige:-5,people:-5}))}`}},
   {t:'御驾亲征',f:()=>{const p=.35+e.wu/180;if(chance(p)){log('北狄犯边，帝御驾亲征，大破敌军。',1);return `你身先士卒，三战三捷，狄戎远遁漠北。${fx(chg({prestige:12,people:5,treasury:-300}))}`}
     log('帝亲征北狄失利，负伤而还。',1);return `大军中伏，你虽突围而出，却身负箭伤。${fx(chg({prestige:-10,health:-10,treasury:-400}))}`}},
   {t:'遣使议和，岁赐金帛',f:()=>{log('与北狄议和，岁赐金帛。');return `边境暂安，朝中却有人暗讽软弱。${fx(chg({treasury:-150,prestige:-6}))}`}}];
  if(gen)ch.push({t:`命${cName(gen)}的父兄领兵`,f:()=>{if(chance(.75)){story(gen,'父兄领兵出征北境，大胜而归。');log(`${fullName(gen)}之父兄领兵击退北狄。`,1);return `将门虎子，果然不凡。${fx(chg({treasury:-250,prestige:8}),cchg(gen,{aff:12,mood:15}))}`}
    story(gen,'父兄出征失利，兄长战死沙场。她哭了整整三日。');return `兵败。她的兄长战死沙场。${fx(chg({treasury:-300,prestige:-6}),cchg(gen,{mood:-30}))}`}});
  return {title:'北境告急',person:gen?.id,sfx:'gong',text:'八百里加急：北狄铁骑南下，连破两道关隘，边民死伤无数。'+(S.flags.wolf?'\n各路诸侯想起骊山那场烽火，援军来得很慢。':''),choices:ch}},
 ()=>({title:'殿试',text:'三年一度的殿试之期已到，三百贡士候于殿外。',choices:[
   {t:'亲自出题考校',f:()=>{E().wen=clamp(E().wen+2);log('帝亲临殿试，钦点状元。');return `你出了一道“论民本”的策问，钦点一位寒门士子为状元，天下读书人称颂。${fx(chg({prestige:4,people:2}))}`}},
   {t:'交由礼部操办',delegated:true,f:()=>`殿试循例而行。${fx(chg({prestige:1}))}`}]}),
 impeachmentEvent,
 ()=>({title:'祥瑞',text:'礼部奏报：终南山猎户献上一头白鹿，称是天降祥瑞，颂陛下圣德。',choices:[
   {t:'大赦庆贺',f:()=>{log('终南山献白鹿，帝大赦天下。');return `举国同庆。${fx(chg({prestige:5,people:3,treasury:-80}))}`}},
   {t:'斥其谄媚，放鹿归山',f:()=>`你命人将白鹿放归山林。朝臣暗暗称是。${fx(chg({people:4,prestige:2}))}`}]}),
 ()=>({title:'蝗灾',text:'河南、山东飞蝗蔽日，禾稼尽毁。',choices:[
   {t:'开仓放粮（国库-200万两）',f:()=>{log('蝗灾，帝开仓放粮。');return `${fx(chg({treasury:-200,people:8}))}`}},
   {t:'设坛祭天',f:()=>chance(.4)?`祭天三日，忽降大雨，蝗群散去。${fx(chg({prestige:4}))}`:`蝗灾未止，百姓流亡。${fx(chg({people:-7}))}`},
   {t:'悬赏捕蝗，以蝗换粟',f:()=>`百姓争相捕蝗，灾情渐缓。${fx(chg({treasury:-80,people:4}))}`}]}),
 ()=>({title:'盐政',text:'户部尚书奏请整顿盐政：废除盐引世袭，可增岁入，但必触怒盐商与其背后的勋贵。',choices:[
   {t:'准奏，雷厉风行',f:()=>{log('帝整顿盐政。',1);return `盐税大增，勋贵怨声载道。${fx(chg({treasury:250,prestige:2,people:-3}))}`}},
   {t:'维持旧制',f:()=>`一切照旧。${fx(chg({prestige:-1}))}`}]}),
 ()=>({title:'江南贡品',text:'江南织造进贡云锦百匹、东珠十斛。',choices:[
   {t:'分赏六宫',f:()=>{harem().forEach(c=>{c.mood=clamp(c.mood+8)});return '六宫欢喜，争相裁制新衣。\n§后宫众人心情+8'}},
   {t:'变卖充入国库',f:()=>`${fx(chg({treasury:120}))}`},
   {t:'下旨减免织造之役',f:()=>`江南织工感激涕零。${fx(chg({people:5}))}`}]}),
 brief=>{const g=brief?.guest||makeGirl({fam:{t:'西域贡女',p:10},trait:pick(['活泼','骄矜','聪慧','痴情'])});if(!brief?.guest){g.looks=clamp(g.looks+12);g.sur='阿';g.given=pick(['依娜','古丽','月儿','米娅']);}
  return {title:'西域使臣',por:g,text:`西域诸国遣使朝贡，献上美人${fullName(g)}，碧眼雪肤，能歌善舞。`,choices:[
   {t:'纳入后宫，封为常在',f:()=>{addConsort(g,2,'西域进献');return `她用生涩的汉话向你行礼。${fx(chg({prestige:2}))}`}},
   {t:'婉拒，厚赐使臣',f:()=>`使臣叹服天朝气度。${fx(chg({prestige:3,people:2,treasury:-30}))}`}]}},
 brief=>{const sons=kidsAlive().filter(k=>k.sex==='m'&&kidAge(k)>=6&&(!brief||brief.sons?.includes(k.id))).slice(0,4);if(!sons.length||S.heir)return null;
  return {title:'请立储君',sons:sons.map(k=>k.id),text:`以内阁首辅为首，群臣联名上书：“国本未定，人心不安，伏请陛下早立储君。”`,choices:[
   ...sons.map(k=>({t:`立${kidName(k)}（${kidAge(k)}岁）`,preview:'册立储君 · 威望 +6 · 生母心情 +25',f:()=>{S.heir=k.id;kstory(k,'群臣请立储君，被册为皇太子。');log(`立${k.name}为皇太子。`,1);const m=byId(k.mom);if(m)cchg(m,{mood:25});return `${fx(chg({prestige:6}))}`}})),
   {t:'朕春秋正盛，此事容后再议',preview:'威望 −3',f:()=>`${fx(chg({prestige:-3}))}`}]}},
 ()=>({title:'京畿疫病',text:'京畿一带爆发时疫，染病者日增。',choices:[
   {t:'命太医院全力救治（国库-150万两）',f:()=>{log('京畿时疫，太医院救治有方。');return `${fx(chg({treasury:-150,people:6}))}`}},
   {t:'封锁疫区',f:()=>`疫情被控制住了，但疫区百姓死伤惨重。${fx(chg({people:-6,prestige:1}))}`}]}),
 ()=>({title:'五谷丰登',text:'今年风调雨顺，各省奏报丰收。',choices:[
   {t:'减免三成赋税',f:()=>{log('岁丰，帝减免赋税。');return `${fx(chg({treasury:-100,people:9}))}`}},
   {t:'照常征收，充实国库',f:()=>`${fx(chg({treasury:180}))}`}]}),
 ()=>({title:'修建园林',text:'工部奏请于西郊修建避暑园林，以供圣驾消夏。',choices:[
   {t:'准奏（国库-300万两）',f:()=>{harem().forEach(c=>c.mood=clamp(c.mood+10));log('帝修西郊园林。');return `${fx(chg({treasury:-300,people:-4}))}\n§后宫众人心情+10`}},
   {t:'不准，崇尚节俭',f:()=>`${fx(chg({people:3,prestige:2}))}`}]}),
 ()=>({title:'文武之争',text:'内阁首辅与镇国大将军在朝堂上争执不下：一要削减军费兴修水利，一要扩军备边。',choices:[
   {t:'偏向文臣，兴修水利',f:()=>{harem().filter(c=>c.trait==='将门').forEach(c=>cchg(c,{mood:-10}));return `${fx(chg({treasury:-100,people:6,prestige:-1}))}`}},
   {t:'偏向武将，扩军备边',f:()=>`${fx(chg({treasury:-150,prestige:5,people:-2}))}`},
   {t:'各打五十大板',f:()=>`两人都讨了没趣。${fx(chg({prestige:2}))}`}]}),
 ()=>({title:'地龙翻身',sfx:'gong',text:'钦天监奏报：陇西地震，屋舍倾颓，死伤者众。朝野议论，皆言上天示警。',choices:[
   {t:'下罪己诏',f:()=>{log('陇西地震，帝下罪己诏。',1);return `${fx(chg({prestige:-3,people:8}))}`}},
   {t:'拨银赈灾（国库-200万两）',f:()=>`${fx(chg({treasury:-200,people:5}))}`}]}),
 ()=>({title:'老臣乞骸骨',text:'三朝元老、太傅陈公年过七旬，上表请求告老还乡。',choices:[
   {t:'厚赐金帛，亲送出城',f:()=>`老臣涕泪纵横。百官感念陛下仁厚。${fx(chg({treasury:-30,prestige:3}))}`},
   {t:'挽留：“朝廷离不开您老。”',f:()=>`老臣又留任一年，朝政井井有条。${fx(chg({prestige:1,people:2}))}`}]}),
];
const SPONT=[0,1,5,10,11,14];
const FLOOD_INDEX=0;
const LOCUST_INDEX=5, HARVEST_INDEX=11;
const GRAIN_SALE_REVENUE=100, HALF_GRAIN_SALE_REVENUE=45;
const GRAIN_TRANSPORT_COST=70;
const LOCUST_LOCAL_PURCHASE_COST=125, LOCUST_LOCAL_PURCHASE_PEOPLE=6;
const LOCUST_LOCAL_DEPOSIT=60, LOCUST_LOCAL_BALANCE=80;
const LOCUST_HALF_RESERVE_PEOPLE=3;
const LOCUST_FOLLOWUP_COST=35, LOCUST_FOLLOWUP_PEOPLE=5;
const LOCUST_UNFUNDED={people:-4};
const LOCUST_UNFUNDED_TEXT='远村没等到承诺的粮食，民心 −4。';
const HALF_GRAIN_TOP_UP_REVENUE=120;
const AUTUMN_GRAIN_PRICE=75, REGULAR_GRAIN_PRICE=110;
const AUTUMN_GRAIN_DEPOSIT=20, AUTUMN_GRAIN_BALANCE=40;
const AUTUMN_GRAIN_DELAY_FEE=10, AUTUMN_GRAIN_REFUND=10;
const AUTUMN_GRAIN_DELIVERY=25, AUTUMN_GRAIN_RELIEF_PEOPLE=4;
const GRAIN_RELIEF_THRESHOLD=45, GRAIN_RELIEF_PEOPLE=2;
const grainHarvestSeason=()=>S.month>=8&&S.month<=10;
function grainReserveReady(){return S.flags.grainReserveGen===S.gen;}
function halfGrainReserve(){return grainReserveReady()&&S.flags.grainReserveHalf===true;}
function grainReserveLabel(){return halfGrainReserve()?'半批':'一批';}
function clearGrainReserve(){
  delete S.flags.grainReserveGen;
  delete S.flags.grainReserveHalf;
}
function localGrainPaymentDue(){
  return Number.isInteger(S.flags.localGrainPaymentTurn)&&S.flags.localGrainPaymentTurn<=S.turn;
}
function saveGrainAction(settle,spendEnergy=true){
  const e=E(),before={energy:e.energy,treasury:e.treasury,people:e.people,prestige:e.prestige};
  const previousFlags={...S.flags},previousLog=S.log.slice();
  if(spendEnergy&&!useE())return;
  const result=settle();
  if(save('auto'))return result;
  Object.assign(e,before);
  S.flags=previousFlags;
  S.log=previousLog;
  return '存档未写入，常平仓的账目已恢复。';
}
function sellGrainChoice(t,revenue,keepHalf=false){
  return {t,preview:`国库 +${revenue} 万两 · 精力 −1 · ${keepHalf?'留半批备荒粮':'用完余粮'}`,
    cond:()=>grainReserveReady()&&(!keepHalf||!halfGrainReserve())&&E().energy>0,why:'需要储粮和 1 点精力',
    f:()=>{
      if(!useE())return;
      if(keepHalf)S.flags.grainReserveHalf=true;
      else clearGrainReserve();
      const result=chg({treasury:revenue});
      log(`户部售出常平仓储粮，得银 ${revenue} 万两。`);
      save('auto');
      return `${keepHalf?'售粮所得已入国库，仓中还留有半批备荒粮。':'售粮所得已入国库，常平仓可在下次丰收时补粮。'}${fx(result)}`;
    }};
}
function grainStorageHasRoom(){return !grainReserveReady()||halfGrainReserve();}
function storePurchasedGrain(){
  const half=halfGrainReserve();
  S.flags.grainReserveGen=S.gen;
  if(half)delete S.flags.grainReserveHalf;
  else S.flags.grainReserveHalf=true;
  S.flags.grainPurchaseTurn=S.turn;
}
function buyGrainChoice(half,cost){
  return {t:half?'买半批粮，补满常平仓':'买半批粮，存入常平仓',
    preview:`国库 −${cost} 万两 · 精力 −1 · ${half?'补为一批':'储粮增至半批'}`,
    cond:()=>E().energy>0&&E().treasury>=cost&&S.flags.grainPurchaseTurn!==S.turn&&
      (half?halfGrainReserve():!grainReserveReady()),
    why:S.flags.grainPurchaseTurn===S.turn?'本月已买过粮，下月可再购':`须有 ${cost} 万两和 1 点精力`,
    f:()=>saveGrainAction(()=>{
      storePurchasedGrain();
      const result=chg({treasury:-cost});
      log(`户部向粮商购入半批备荒粮，花银 ${cost} 万两。`);
      return `粮商已交付半批粮，常平仓现有${grainReserveLabel()}备荒粮。${fx(result)}`;
    })};
}
function autumnGrainOrderStatus(){
  const order=S.flags.autumnGrainOrder;
  if(!order||order.gen!==S.gen)return '';
  if(S.month===7&&order.turn===S.turn+1)return 'pending';
  if(S.month===8&&order.delayed===true&&order.turn===S.turn+1)return 'delayed';
  if(S.month===(order.delayed===true?9:8)&&order.turn===S.turn)return 'due';
  return '';
}
function reserveAutumnGrainChoice(){
  return {t:'预订半批秋粮',
    preview:`订金 ${AUTUMN_GRAIN_DEPOSIT} 万两 · 精力 −1 · 八月付尾款 ${AUTUMN_GRAIN_BALANCE} 万两领粮 · 可改期或退订 · 逾期不退订金`,
    cond:()=>S.month===7&&!autumnGrainOrderStatus()&&grainStorageHasRoom()&&
      E().treasury>=AUTUMN_GRAIN_DEPOSIT&&E().energy>0,
    why:`须有 ${AUTUMN_GRAIN_DEPOSIT} 万两和 1 点精力`,
    f:()=>saveGrainAction(()=>{
      S.flags.autumnGrainOrder={gen:S.gen,turn:S.turn+1};
      const result=chg({treasury:-AUTUMN_GRAIN_DEPOSIT});
      log(`户部付订金 ${AUTUMN_GRAIN_DEPOSIT} 万两，约定八月交付半批秋粮。`);
      return `已预订半批秋粮。八月可入仓、直送救急、改期或退订。${fx(result)}`;
    })};
}
function delayAutumnGrainChoice(){
  return {t:'改到九月领秋粮',
    preview:`今月不付银 · 免耗精力 · 九月尾款增至 ${AUTUMN_GRAIN_BALANCE+AUTUMN_GRAIN_DELAY_FEE} 万两 · 改期后不能退订`,
    cond:()=>S.month===8&&autumnGrainOrderStatus()==='due',
    f:()=>saveGrainAction(()=>{
      S.flags.autumnGrainOrder={...S.flags.autumnGrainOrder,turn:S.turn+1,delayed:true};
      log(`户部将预订的秋粮改到九月交付，改期费 ${AUTUMN_GRAIN_DELAY_FEE} 万两随尾款一并结清。`);
      return '粮商会把半批秋粮留到九月。届时仍可入仓或直送救急，逾期不退订金。';
    },false)};
}
function cancelAutumnGrainChoice(){
  return {t:'退订秋粮，收回部分订金',
    preview:`国库 +${AUTUMN_GRAIN_REFUND} 万两 · 免耗精力 · 放弃本次领粮`,
    cond:()=>S.month===8&&autumnGrainOrderStatus()==='due',
    f:()=>saveGrainAction(()=>{
      delete S.flags.autumnGrainOrder;
      const result=chg({treasury:AUTUMN_GRAIN_REFUND});
      log(`户部退订半批秋粮，收回订金 ${AUTUMN_GRAIN_REFUND} 万两。`);
      return `粮商已收回预留的半批粮，退还 ${AUTUMN_GRAIN_REFUND} 万两。余下订金由粮商留存。${fx(result)}`;
    },false)};
}
function autumnGrainBalance(){
  return AUTUMN_GRAIN_BALANCE+(S.flags.autumnGrainOrder?.delayed===true?AUTUMN_GRAIN_DELAY_FEE:0);
}
function settleAutumnGrainRelief(cost,people,prestige=0){
  delete S.flags.autumnGrainOrder;
  S.flags.grainPurchaseTurn=S.turn;
  S.flags.grainReliefTurn=S.turn;
  log(`户部付尾款和运费共 ${cost} 万两，将预订的半批秋粮直接送往缺粮村落。`);
  return `粮商已将预订的半批秋粮送到村里，百姓当天就领到了口粮。${fx(chg({treasury:-cost,people,...(prestige?{prestige}:{})}))}`;
}
function autumnGrainReliefBlock(cost){
  if(autumnGrainOrderStatus()!=='due')return '须到约定月份方可领取秋粮';
  if(S.flags.grainPurchaseTurn===S.turn)return '本月已购粮，无法再领取';
  if(S.flags.grainReliefTurn===S.turn)return '本月已发过救急粮';
  if(E().treasury<cost)return `须有 ${cost} 万两支付尾款和运费`;
  return '';
}
function collectAutumnGrainChoice(direct=false){
  const balance=autumnGrainBalance();
  const cost=balance+(direct?AUTUMN_GRAIN_DELIVERY:0);
  const month=S.month===9?'九月':'八月';
  const blocked=()=>{
    if(direct)return autumnGrainReliefBlock(cost)||(E().people>GRAIN_RELIEF_THRESHOLD?`须民心不高于 ${GRAIN_RELIEF_THRESHOLD}`:'');
    if(autumnGrainOrderStatus()!=='due')return '须到约定月份方可领取秋粮';
    if(!grainStorageHasRoom())return '常平仓已满，须先腾出半批仓位';
    if(S.flags.grainPurchaseTurn===S.turn)return '本月已购粮，无法再领取';
    if(E().treasury<cost)return `须有 ${cost} 万两尾款`;
    return '';
  };
  return {t:direct?'付尾款和运费，直送秋粮救急':'付尾款，领取半批秋粮',
    preview:direct?`国库 −${cost} 万两（含运费 ${AUTUMN_GRAIN_DELIVERY}） · 民心 +${AUTUMN_GRAIN_RELIEF_PEOPLE} · 免耗精力 · 用掉${month}购粮和救急粮名额`
      :`国库 −${cost} 万两 · 免耗精力 · 用掉${month}购粮名额`,
    cond:()=>!blocked(),why:blocked(),
    f:()=>saveGrainAction(()=>{
      if(direct)return settleAutumnGrainRelief(cost,AUTUMN_GRAIN_RELIEF_PEOPLE);
      delete S.flags.autumnGrainOrder;
      storePurchasedGrain();
      const result=chg({treasury:-cost});
      log(`户部付清 ${cost} 万两尾款，收到半批秋粮。`);
      return `预订的秋粮已入仓。常平仓现有${grainReserveLabel()}备荒粮。${fx(result)}`;
    },false)};
}
function earlyGrainReliefChoice(half){
  const done=()=>S.flags.grainReliefTurn===S.turn;
  return {t:'先发半批粮，接济百姓',
    preview:`民心 +${GRAIN_RELIEF_PEOPLE} · 精力 −1 · ${half?'用完余粮':'留半批备荒粮'}`,
    cond:()=>grainReserveReady()&&halfGrainReserve()===half&&E().people<=GRAIN_RELIEF_THRESHOLD&&E().energy>0&&!done(),
    why:done()?'本月已发过救急粮':`须民心不高于 ${GRAIN_RELIEF_THRESHOLD}，且有 1 点精力`,
    f:()=>saveGrainAction(()=>{
      if(half)clearGrainReserve();else S.flags.grainReserveHalf=true;
      S.flags.grainReliefTurn=S.turn;
      log('户部先发半批常平仓粮接济百姓。');
      return `常平仓先发了半批救急粮。${half?'仓中余粮已经用完。':'还留有半批备荒粮。'}${fx(chg({people:GRAIN_RELIEF_PEOPLE}))}`;
    })};
}
A.grainReserve=function(){
  if(!S||S.over||modalOpen)return;
  const stocked=grainReserveReady(),half=halfGrainReserve();
  const autumn=grainHarvestSeason(),cost=autumn?AUTUMN_GRAIN_PRICE:REGULAR_GRAIN_PRICE;
  const order=autumnGrainOrderStatus();
  const choices=[];
  if(order==='due')choices.push(collectAutumnGrainChoice(),collectAutumnGrainChoice(true));
  if(order==='due'&&S.month===8)choices.push(delayAutumnGrainChoice(),cancelAutumnGrainChoice());
  if(stocked){
    choices.push(sellGrainChoice('售粮充库',half?HALF_GRAIN_SALE_REVENUE:GRAIN_SALE_REVENUE));
    if(!half)choices.push(sellGrainChoice('售半批，留半批备荒',HALF_GRAIN_SALE_REVENUE,true));
    choices.push(earlyGrainReliefChoice(half));
  }
  if(!stocked||half)choices.push(buyGrainChoice(half,cost));
  if(!order&&S.month===7&&grainStorageHasRoom())choices.push(reserveAutumnGrainChoice());
  choices.push(stocked?{t:'留粮备荒',preview:`遇蝗灾月奏可发粮 · 国库无支出 · 免耗精力 · 民心 +${half?3:6}`}:{t:'暂不购粮'});
  pushEv({title:'常平仓',text:`${stocked?'现有'+grainReserveLabel()+'备荒粮':'仓中暂无备荒粮'}，国库有 ${E().treasury} 万两。`+
    (stocked||order==='due'?`当前民心 ${E().people}。`:'')+
    (order==='pending'?'\n已预订半批秋粮。八月可留出半批仓位领粮，民心低时也可加付运费直送救急。逾期不退订金。':'')+
    (order==='delayed'?'\n预订已改到九月，届时可领粮，逾期不退订金。':'')+
    (order==='due'?`\n预订的半批秋粮已到。可领粮入仓，民心低时也可直送缺粮村落。${S.month===8?'若本月不领，可改到九月或退订。':'九月是最后的领取期限。'}逾期不退订金。`:'')+
    (!stocked||half?`\n${autumn?'秋粮上市，现为低价':'八月至十月是低价期'}。每月最多购半批。`:''),choices});
};
function monthlyGrainEvent(index,brief={}){
  const event=COURT[index]();
  if(index===HARVEST_INDEX){
    if(halfGrainReserve()){
      event.text+='\n常平仓还剩半批备荒粮。可拿一部分秋粮补满，也可照常征税或减免。';
      event.choices.push({t:'留半批秋粮，补满常平仓',
        preview:`国库 +${HALF_GRAIN_TOP_UP_REVENUE} 万两 · 民心 +1 · 储粮从半批补为一批`,
        cond:()=>halfGrainReserve(),why:'常平仓须有半批余粮',
        f:()=>{
          delete S.flags.grainReserveHalf;
          log('户部用半批秋粮补满常平仓。');
          return `户部将半批秋粮入仓，原来的余粮已补成一整批。${fx(chg({treasury:HALF_GRAIN_TOP_UP_REVENUE,people:1}))}`;
        }});
    }else if(grainReserveReady())event.text+='\n常平仓已有一批备荒粮，等用过再补。';
    else event.choices.push({t:'留粮入常平仓，以备蝗灾',
      preview:'国库 +60 万两 · 民心 +2 · 储粮可在日后一次蝗灾中免耗精力赈济',
      f:()=>{
        S.flags.grainReserveGen=S.gen;
        delete S.flags.grainReserveHalf;
        return `户部将部分秋粮存入常平仓，留待蝗灾时赈济。${fx(chg({treasury:60,people:2}))}`;
      }});
  }else if(grainReserveReady()){
    const half=halfGrainReserve(), localPeople=half?3:6, remotePeople=half?5:10;
    event.text+=`\n常平仓尚有${grainReserveLabel()}备荒粮。可就近发放，也可另拨运费，送到离粮仓较远的村落。`;
    event.choices.push({t:'发放常平仓储粮',preview:`国库无支出 · 民心 +${localPeople} · 用完余粮`,delegated:true,
      f:()=>{
        clearGrainReserve();
        return `户部从常平仓调粮，灾民领到了救急口粮。${fx(chg({people:localPeople}))}`;
      }});
    if(!half)event.choices.push({t:'就近发半批，留半批备荒',
      preview:`国库无支出 · 民心 +${LOCUST_HALF_RESERVE_PEOPLE} · 留半批备荒粮`,delegated:true,
      cond:()=>grainReserveReady()&&!halfGrainReserve(),why:'须有一整批储粮',
      f:()=>{
        S.flags.grainReserveHalf=true;
        log('蝗灾，户部就近发放半批常平仓粮，余粮留仓。');
        return `粮仓周边的灾民领到了口粮，余下半批仍在仓中。${fx(chg({people:LOCUST_HALF_RESERVE_PEOPLE}))}`;
      }});
    event.choices.push({t:'调储粮，拨银运送',
      preview:`国库 −${GRAIN_TRANSPORT_COST} 万两 · 民心 +${remotePeople} · 用完余粮`,
      cond:()=>E().treasury>=GRAIN_TRANSPORT_COST,why:`须有 ${GRAIN_TRANSPORT_COST} 万两和 1 点精力`,
      f:()=>{
        clearGrainReserve();
        return `运粮车把常平仓的粮送进了偏远村落，乡民也领到了口粮。${fx(chg({treasury:-GRAIN_TRANSPORT_COST,people:remotePeople}))}`;
      }});
  }
  if(index===LOCUST_INDEX&&(!grainReserveReady()||halfGrainReserve())){
    event.text+='\n灾区附近还有粮商可供购粮，可就地买来发放，把仓中余粮留作备用。';
    event.choices.push({t:'在灾区就地买粮发放',
      preview:`国库 −${LOCUST_LOCAL_PURCHASE_COST} 万两 · 民心 +${LOCUST_LOCAL_PURCHASE_PEOPLE} · 保留仓中余粮`,
      cond:()=>E().treasury>=LOCUST_LOCAL_PURCHASE_COST,
      why:`须有 ${LOCUST_LOCAL_PURCHASE_COST} 万两和 1 点精力`,
      f:()=>{
        log('蝗灾，户部从灾区附近购粮，当场发给灾民。');
        return `粮商把粮直接送到赈济点，灾民当天就领到了口粮。${fx(chg({treasury:-LOCUST_LOCAL_PURCHASE_COST,people:LOCUST_LOCAL_PURCHASE_PEOPLE}))}`;
      }});
    if(S.flags.localGrainPaymentTurn===undefined)event.choices.push({t:'就地赊购赈粮',grainTransaction:true,
      preview:`本月国库 −${LOCUST_LOCAL_DEPOSIT} 万两 · 下月底扣 ${LOCUST_LOCAL_BALANCE} 万两 · 民心 +${LOCUST_LOCAL_PURCHASE_PEOPLE} · 保留仓粮`,
      cond:()=>E().treasury>=LOCUST_LOCAL_DEPOSIT&&S.flags.localGrainPaymentTurn===undefined,
      why:`须有 ${LOCUST_LOCAL_DEPOSIT} 万两和 1 点精力，且无未结赊账`,
      f:()=>{
        S.flags.localGrainPaymentTurn=S.turn+1;
        log(`蝗灾，户部就地赊购赈粮，下月底结清 ${LOCUST_LOCAL_BALANCE} 万两。`);
        return `粮商已经发粮。尾款会在下月底从国库扣除。${fx(chg({treasury:-LOCUST_LOCAL_DEPOSIT,people:LOCUST_LOCAL_PURCHASE_PEOPLE}))}`;
      }});
  }
  if(index===LOCUST_INDEX&&autumnGrainOrderStatus()==='due'){
    const cost=autumnGrainBalance()+AUTUMN_GRAIN_DELIVERY;
    const people=LOCUST_LOCAL_PURCHASE_PEOPLE;
    event.text+='\n预订的半批秋粮已经到货。户部可令粮商直接送去缺粮村落。';
    event.choices.push({t:'用预订秋粮赈济蝗灾',grainTransaction:true,
      preview:`国库 −${cost} 万两 · 民心 +${people} · 保留仓粮 · 用掉当月购粮和救急粮名额`,
      cond:()=>!autumnGrainReliefBlock(cost),why:autumnGrainReliefBlock(cost),
      f:()=>settleAutumnGrainRelief(cost,people)});
    if(grainReserveReady()){
      const half=halfGrainReserve(),total=people+LOCUST_HALF_RESERVE_PEOPLE;
      const nearUrgent=brief.locustNeed==='near';
      const uncertain=Boolean(brief.locustAuditNeed&&!brief.locustAudited);
      const village=nearUrgent?'近村':'远村';
      event.text+=uncertain?`\n两村的急报说法不一。户部暂估${village}先断粮。按估报分路或集中发粮，若估错会少得 4 点民心。也可先核实。`
        :nearUrgent
        ?'\n近村已经断粮，粮商比常平仓的车队更快到近村。远村尚能撑到下月，届时粮道修通，仓车运费可减半。'
        :'\n远村已经断粮，粮商能赶在常平仓的车队前送到远村。近村尚有余粮。';
      if(uncertain)event.choices.push({t:'先核实两村粮情',inspectLocust:true,
        preview:'核实哪一村先断粮 · 正式发粮仍须另花精力'});
      if(nearUrgent&&!uncertain)event.choices.push({t:'订粮先救近村，下月再补远村',grainTransaction:true,
        preview:`国库 −${cost} 万两 · 民心 +${people} · 暂留仓粮 · 占本月购粮和救急粮名额 · 下月须出半批仓粮、${LOCUST_FOLLOWUP_COST} 万两和 1 点精力 · 失约民心 −${-LOCUST_UNFUNDED.people}`,
        cond:()=>grainReserveReady()&&!autumnGrainReliefBlock(cost),why:autumnGrainReliefBlock(cost),
        f:()=>{
          S.flags.locustRelief={turn:S.turn+1,gen:S.gen};
          return '粮商先往近村发粮。远村尚能支应到下月，户部可等粮道修通后再派仓车。'+settleAutumnGrainRelief(cost,people);
        }});
      const routes=[
        {title:'仓粮就近发放，订粮直送远村',cost,people:nearUrgent?total-2:total,
          result:'仓粮已在附近发放，远村由粮商送粮。'},
      ];
      if(nearUrgent)routes.push({title:'订粮先救近村，仓粮运往远村',cost:cost+GRAIN_TRANSPORT_COST,people:total+3,
        result:'粮商先往近村发粮，常平仓另派车把半批粮运到远村。'});
      const urgent=nearUrgent?'近村':'远村', waiting=nearUrgent?'远村':'近村';
      routes.push({title:`集中订粮和仓粮救${urgent}`,cost:cost+(nearUrgent?0:GRAIN_TRANSPORT_COST),
        people:nearUrgent?total+2:total+4,prestige:-2,
        result:`两份半批粮都拨给了${urgent}。${waiting}没领到这批赈粮，地方官对此颇有怨言。`});
      for(const route of routes){
        const blocked=()=>!grainReserveReady()?'常平仓须有半批储粮':autumnGrainReliefBlock(route.cost);
        event.choices.push({t:route.title,grainTransaction:true,
          preview:`国库 −${route.cost} 万两 · ${uncertain?'估计':''}民心 +${route.people}`+
            (route.prestige?` · 威望 −${-route.prestige} · ${waiting}未获粮`:'')+
            ` · ${half?'用完仓粮':'留半批仓粮'} · 用掉当月购粮和救急粮名额`,
          cond:()=>!blocked(),why:blocked(),
          f:()=>{
            if(halfGrainReserve())clearGrainReserve();
            else S.flags.grainReserveHalf=true;
            log(`蝗灾，户部调粮赈济：${route.title}。`);
            const wrong=uncertain&&brief.locustAuditNeed!==brief.locustNeed;
            return route.result+(wrong?'急报有误，实际先断粮的村落没能及时得到足够口粮。':'')+
              settleAutumnGrainRelief(route.cost,route.people-(wrong?4:0),route.prestige);
          }});
      }
    }
  }
  return event;
}
function locustReliefDue(){
  const relief=S.flags.locustRelief;
  return relief?.turn===S.turn&&relief.gen===S.gen;
}
function locustReliefEvent(){
  return {title:'蝗灾 · 远村补粮回奏',
    text:`远村的粮道已经修通。拨半批仓粮和 ${LOCUST_FOLLOWUP_COST} 万两即可补齐。若本月失约，${LOCUST_UNFUNDED_TEXT}`,
    choices:[
      {t:'按约运半批仓粮到远村',grainTransaction:true,
        preview:`国库 −${LOCUST_FOLLOWUP_COST} 万两 · 民心 +${LOCUST_FOLLOWUP_PEOPLE} · 发半批仓粮`,
        cond:()=>locustReliefDue()&&grainReserveReady()&&E().treasury>=LOCUST_FOLLOWUP_COST,
        why:`须有半批仓粮、${LOCUST_FOLLOWUP_COST} 万两和 1 点精力`,
        f:()=>{
          if(halfGrainReserve())clearGrainReserve();
          else S.flags.grainReserveHalf=true;
          delete S.flags.locustRelief;
          return `仓车沿修通的粮道进了远村，补齐了上月许下的口粮。${fx(chg({treasury:-LOCUST_FOLLOWUP_COST,people:LOCUST_FOLLOWUP_PEOPLE}))}`;
        }},
      {t:'取消远村补粮',grainTransaction:true,delegated:true,
        cond:locustReliefDue,preview:`保留仓粮 · 民心 −${-LOCUST_UNFUNDED.people}`,
        f:()=>{
          delete S.flags.locustRelief;
          return `户部撤回了原先的运粮安排。${fx(chg(LOCUST_UNFUNDED))}`;
        }},
    ]};
}
function floodDikeReady(){return S.flags.floodDikeGen===S.gen;}
const FLOOD_SUPERVISION={
  grain:{label:'调运赈粮',need:'粮道被冲断，灾区眼下最缺粮。',offices:['内阁首辅','吏部尚书','户部侍郎','皇商','知府','县令'],cost:150,people:6},
  shelter:{label:'安置灾民',need:'粮仓尚可支应，急需人手安置离家百姓。',offices:['镇国大将军','两江总督'],cost:215,people:9},
};
function monthlyFloodEvent(brief){
  const event=COURT[FLOOD_INDEX]({});
  const need=brief.floodNeed;
  event.text+='\n'+FLOOD_SUPERVISION[need].need;
  if(floodDikeReady()){
    const cost=FLOOD_DIRECT_COST-FLOOD_DIKE_SAVING;
    event.text+='\n先前加固的河堤护住了粮道旁的几处村落，工部核减了本次直接赈济的所需银两。';
    event.choices[0]={t:`拨银 ${cost} 万两赈灾`,
      preview:`国库 −${cost} 万两 · 民心 +10 · 威望 +3 · 结清此段河堤的赈务账`,
      f:()=>{
        delete S.flags.floodDikeGen;
        log(`黄河赈务结清，先前修堤省下 ${FLOOD_DIKE_SAVING} 万两。`,1);
        return `工部按修堤后的灾情发放粮银，此段河堤的赈务账已结清。${fx(chg({treasury:-cost,people:10,prestige:3}))}`;
      }};
  }
  event.cast=[];
  const suspended=new Set();
  for(const [specialty,terms] of Object.entries(FLOOD_SUPERVISION)){
    let supervised=null;
    const available=harem().find(c=>{
      if(!hasClan(c)||c.fam.t.includes('（获罪）'))return false;
      const father=houseOf(c).father;
      if(!father.alive||!terms.offices.includes(father.office)||
        paternalFamily(c).some(relative=>relative.fam.t.includes('（获罪）')))return false;
      if(!reliefSuspended(father))return true;
      suspended.add(father.name);
      if(specialty===need)supervised ||= c;
      return false;
    });
    const consort=available||supervised;
    if(!consort)continue;
    const audited=!available;
    const father=houseOf(consort).father;
    event.cast.push(consort);
    const odds=audited?FLOOD_AUDITED_ODDS:specialty===need?80:55;
    const cost=terms.cost+(audited?FLOOD_AUDIT_COST:0);
    const failureCost=cost+50;
    if(audited)event.text+=`\n本次暂无可直接督办的对口官员。可由户部监办，准${father.name}只办此案，原停办期限照旧。`;
    event.choices.push({
      t:audited?`户部监办，准${father.name}协办 · ${terms.label}`:`命${father.name}督办 · ${terms.label}`,person:consort.id,
      preview:`成功率 ${odds}% · 成功花 ${cost} 万两，民心 +${terms.people}，威望 +2，家族势力 +5，家眷情分 +8、心情 +10 · 失利花 ${failureCost} 万两，民心 −5，家眷心情 −12`+
        (audited?` · 两种结果均含 ${FLOOD_AUDIT_COST} 万两核账费，原停办期限照旧`:''),
      cond:()=>E().treasury>=failureCost,why:`须有 ${failureCost} 万两备款`,
      f:()=>{
        if(audited)log(`户部监办黄河赈务，准${father.name}协办本案，原停办期限照旧。`,1);
        if(chance(odds/100)){
          for(const member of clanMembers(clanKey(consort)))member.fam.p=clamp(member.fam.p+5,0,95);
          story(consort,`其父${father.name}奉旨${terms.label}，办妥赈务，家族在朝中更受倚重。`);
          return `${audited?'户部核对了粮银账目。':''}${father.name}办妥了赈务，其家族势力上升。${fx(chg({treasury:-cost,people:terms.people,prestige:2}),cchg(consort,{aff:8,mood:10}))}`;
        }
        story(consort,`其父${father.name}督办赈灾失利，遭御史问责。`);
        return `${father.name}调度失当，赈济延误，只得另拨银两善后。${fx(chg({treasury:-failureCost,people:-5}),cchg(consort,{mood:-12}))}`;
      }
    });
  }
  if(suspended.size)event.text+='\n仍在停办赈务期间：'+[...suspended].join('、')+'。';
  if(!floodDikeReady()){
    const cost=FLOOD_DIRECT_COST+FLOOD_DIKE_COST;
    event.choices.push({t:'拨足赈款，并修复险堤',
      preview:`国库 −${cost} 万两 · 民心 +10 · 威望 +3 · 日后一次直接赈济少花 ${FLOOD_DIKE_SAVING} 万两`,
      cond:()=>E().treasury>=cost,why:`国库至少需 ${cost} 万两`,
      f:()=>{
        S.flags.floodDikeGen=S.gen;
        log('赈粮已拨，工部另领修堤银，加固黄河险段。',1);
        return `赈粮送抵灾区，工部随后加固险堤。日后一次黄河赈灾，直接拨款可少花 ${FLOOD_DIKE_SAVING} 万两。${fx(chg({treasury:-cost,people:10,prestige:3}))}`;
      }});
  }
  return event;
}
const IMPEACHMENT_INDEX=3;
const FIRST_IMPEACHMENT_TURN=3;
function impeachmentSubject(id){
  return harem().find(c=>c.id===id&&houseOf(c)?.father.alive&&!c.fam.t.includes('（获罪）'));
}
function pinImpeachment(person){
  const matching=chance(.5);
  return {person,matching,guilty:chance(matching ? .85 : .45)};
}
function newImpeachment(){
  const eligible=harem().filter(c=>c.fam.p>=35&&houseOf(c)?.father.alive&&!c.fam.t.includes('（获罪）'));
  return eligible.length?pinImpeachment(pick(eligible).id):null;
}
function impeachmentEvent(brief){
  const file=brief?.impeachment;
  if(!file)return null;
  const consort=impeachmentSubject(file.person);
  if(!consort)return null;
  const review=brief.review===true;
  const father=houseOf(consort).father.name;
  const report=`御史弹劾${father}截留赈银八十万两，呈上的抄账记着只入库二十万两。库房摘要记着入库${file.matching?'二十':'一百'}万两。`;
  const evidence=file.matching?'两份账目相符。原始签押尚未调来。':'两份账目不合。若即日下旨，只能先采信御史的抄账。';
  const finding=file.guilty?'查得原始签押，一百万两赈银中仅二十万两入库，余款流入私账。':'查得原始签押，赈银已全数入库。御史所呈抄账有误。';
  const verdict={t:review?(file.guilty?'革职，追回赈银':'公布原簿，还其清白'):'按御史所奏，即日革职',
      preview:review?(file.guilty?'国库 +80 万两 · 民心 +6 · 威望 +4 · 她的情分 −12、心情 −30':'威望 +1 · 她的情分 +6'):undefined,
      f:()=>{
        if(file.guilty){
          consort.fam={t:consort.fam.t+'（获罪）',p:Math.max(0,consort.fam.p-30)};
          story(consort,'其父贪墨案发，被革职查办。她在宫中脱簪待罪。');
          log(`${father}贪墨案发，革职查办。`,1);
          return `查实赈银遭截留，追回八十万两。${fx(chg({people:6,prestige:4,treasury:80}),cchg(consort,{mood:-30,aff:-12}))}`;
        }
        if(!review){
          story(consort,'其父被误革，原始账目呈上后才复职。她仍记得那道急旨。');
          return `革职的旨意已经下达，原簿随后证实赈银全数入库。你只得收回成命。${fx(chg({prestige:-5}),cchg(consort,{mood:-12,aff:-8}))}`;
        }
        story(consort,'其父遭弹劾，查无实据，得还清白。');
        return `赈银已全数入库，${father}得还清白。${fx(chg({prestige:1}),cchg(consort,{aff:6}))}`;
      }};
  let choices=[verdict,
    {t:'留中不发',f:()=>{
      story(consort,'其父遭弹劾，陛下将奏折压下。她心中感念。');
      return `你把奏折压下了。${fx(chg({people:-5}),cchg(consort,{aff:10}))}`;
    }},
    {t:'罚俸一年，以儆效尤',f:()=>`${fx(chg({people:2}),cchg(consort,{mood:-8}))}`},
  ];
  if(review){
    const alternative=file.guilty
      ? {t:'责令退银，留任察看',preview:'国库 +80 万两 · 民心 +2 · 威望 −2 · 她的心情 −8',
        f:()=>{
          story(consort,'其父退清截留的赈银，仍留任察看。她松了口气。');
          return `${father}如数退还八十万两，暂留原任。朝中仍有人质疑量罚过轻。${fx(chg({treasury:80,people:2,prestige:-2}),cchg(consort,{mood:-8}))}`;
        }}
      : {t:'私下告知查实结果，撤销弹劾',preview:'她的情分 +10、心情 +6',
        f:()=>{
          story(consort,'陛下查清父亲的案子，私下让她知道父亲已无事。');
          return `刑部撤销弹劾，将查实结果告知${father}一家。${fx(cchg(consort,{aff:10,mood:6}))}`;
        }};
    choices=[verdict,alternative];
    if(file.guilty)choices.push({
      t:'退银直拨灾区，留任',
      preview:`国库 +30 万两 · 民心 +5 · 威望 +1 · 她的心情 −12 · 停止独立督办赈务 ${RELIEF_SUSPENSION_MONTHS} 个月`,
      f:()=>{
        houseOf(consort).father.reliefResumeTurn=S.turn+RELIEF_SUSPENSION_MONTHS+1;
        story(consort,'其父退清赈银，留任但停办赈务三个月。户部将其中五十万两直接拨往灾区。');
        log(`${father}退清截留的赈银，户部直拨五十万两赈灾，涉案官员停办赈务三个月。`,1);
        return `${father}退还八十万两，保留原任，停办赈务三个月。户部直拨五十万两救急，余款入库。${fx(chg({treasury:30,people:5,prestige:1}),cchg(consort,{mood:-12}))}`;
      }});
  }else choices.push({t:'封存账册，下月复审',preview:'下月的奏折改为查账回奏 · 届时仍须批复',
    f:()=>{
      S.flags.impeachmentReview={gen:S.gen,turn:S.turn+1,file};
      return '账册已封存。下月可在月度奏折查看查账回奏。';
    }});
  return {title:review?'御史弹劾 · 查账回奏':'御史弹劾',person:consort.id,por:consort,
    valid:()=>!!impeachmentSubject(file.person),text:report+'\n'+(review?finding:evidence),choices};
}

const COURT_PREVIEWS=[
  ['国库 −300 万两 · 民心 +10 · 威望 +3','国库无支出 · 民心 −8','国库 −150 至 −200 万两 · 办妥可得民心与威望，办砸会失民心'],
  ['国库 −300 万两 · 战果影响威望，失利伤民心','国库 −300 至 −400 万两 · 战果影响威望，败阵会受伤','国库 −150 万两 · 威望 −6','国库 −250 至 −300 万两 · 战果影响威望和家眷'],
  ['文略 +2 · 威望 +4 · 民心 +2','威望 +1'],
  ['指控属实可追缴 80 万两 · 误革会失威望并伤及家眷','民心 −5 · 她对你的情分 +10','民心 +2 · 她的心情 −8'],
  ['国库 −80 万两 · 威望 +5 · 民心 +3','民心 +4 · 威望 +2'],
  ['国库 −200 万两 · 民心 +8','若降雨可得威望，灾情持续则失民心','国库 −80 万两 · 民心 +4'],
  ['国库 +250 万两 · 威望 +2 · 民心 −3','威望 −1'],
  ['后宫众人心情 +8','国库 +120 万两','民心 +5'],
  ['册封常在 · 威望 +2','国库 −30 万两 · 威望 +3 · 民心 +2'],
  [],
  ['国库 −150 万两 · 民心 +6','民心 −6 · 威望 +1'],
  ['国库 −100 万两 · 民心 +9','国库 +180 万两'],
  ['国库 −300 万两 · 民心 −4 · 后宫众人心情 +10','民心 +3 · 威望 +2'],
  ['国库 −100 万两 · 民心 +6 · 威望 −1 · 将门妃嫔心情 −10','国库 −150 万两 · 威望 +5 · 民心 −2','威望 +2'],
  ['威望 −3 · 民心 +8','国库 −200 万两 · 民心 +5'],
  ['国库 −30 万两 · 威望 +3','民心 +2 · 威望 +1'],
];
const COURT_RELIEF={
  0:{office:'工部',cost:340,people:6},
  5:{office:'户部',cost:230,people:5},
  10:{office:'太医院',cost:180,people:4},
};
function reliefDelegation(index){
  const relief=COURT_RELIEF[index];
  if(!relief)return null;
  const {office,cost,people}=relief;
  return {t:`由${office}全权办理`,preview:`国库 −${cost} 万两 · 民心 +${people}`,
    delegated:true,cond:()=>E().treasury>=cost,why:'国库银两不足',
    f:()=>`${office}按例调派人手，报来办理结果。${fx(chg({treasury:-cost,people}))}`};
}
const FLOOD_INSTALLMENT=150;
const FLOOD_GRAIN_FREIGHT=50;
const FLOOD_FREIGHT_DEPOSIT=25, FLOOD_FREIGHT_BALANCE=10;
const FLOOD_ARMY_SHELTER_COST=80;
const FLOOD_BRIDGE_COST=35;
const FLOOD_UNFUNDED={people:-3};
function floodReliefDue(){
  const flood=S.flags.floodRelief,brief=S.flags.monthlyCourt;
  return (flood?.turn===S.turn&&flood.gen===S.gen)||
    !!(brief?.turn===S.turn&&brief.gen===S.gen&&brief.floodFollowup&&!brief.done);
}
function stagedFloodRelief(brief,freightBooked=false){
  const cost=FLOOD_INSTALLMENT+(freightBooked?FLOOD_FREIGHT_DEPOSIT:0);
  return {t:freightBooked?'先拨急赈，并预订运粮车':'先拨急赈，留待下月续拨',
    preview:`国库 −${cost} 万两 · 民心 +4 · 下月奏折改为赈灾回奏`+
      (freightBooked?` · 含订车费 ${FLOOD_FREIGHT_DEPOSIT} 万两 · 次月调粮只需再付 ${FLOOD_FREIGHT_BALANCE} 万两 · 逾期或改用他法，订金不退`:''),
    cond:()=>E().treasury>=cost&&(!freightBooked||grainReserveReady()),why:freightBooked?'国库银两不足，或无可调储粮':'国库银两不足',
    f:()=>{
      S.flags.floodRelief={turn:S.turn+1,gen:S.gen,floodNeed:brief.floodNeed,...(freightBooked?{freightBooked:true}:{})};
      const next=freightBooked?`运粮车已订好。下月仓中仍有粮时，再付 ${FLOOD_FREIGHT_BALANCE} 万两即可运送。`:'下月还需拨一百五十万两收尾。';
      return `第一批粮银已经发往灾区，先供灾民安置。${next}${fx(chg({treasury:-cost,people:4}))}`;
    }};
}
function floodReliefEvent(brief){
  const shelter=brief.floodNeed==='shelter';
  const event={title:'黄河决堤 · 赈灾回奏',
    text:(brief.extended?'上月拨的周转银已用完，工部再请续拨一百五十万两收尾。'
      :shelter?'首批粮银已供灾民暂住。工部请续拨一百五十万两雇工搭建住所。'
      :'首批粮银已用于安置灾民。工部请续拨一百五十万两供赈粮发放。')+'若本月不再拨款，赈济中断，民心 −3。',
    choices:[
      {t:'拨清余款，完成赈济',preview:'国库 −150 万两 · 民心 +5 · 威望 +2',
        cond:()=>E().treasury>=FLOOD_INSTALLMENT,why:'国库银两不足',
        f:()=>`余下粮银按期送达，灾民得到后续赈济。${fx(chg({treasury:-FLOOD_INSTALLMENT,people:5,prestige:2}))}`},
      {t:'停止续拨',preview:'国库无支出 · 民心 −3',delegated:true,
        f:()=>`${shelter?'赈款未能接续，临时安置无法维持。':'赈款未能接续，灾区粮食供给中断。'}${fx(chg(FLOOD_UNFUNDED))}`},
    ]};
  if(shelter){
    event.text+='\n临时安置仍缺人手。附近驻军可以搭棚，但军方也会因此在朝中更有分量。';
    event.choices.splice(1,0,{
      t:'借驻军搭建临时住所',
      preview:`国库 −${FLOOD_ARMY_SHELTER_COST} 万两 · 民心 +5 · 武将影响修正 +8（上限 30）`,
      cond:()=>E().treasury>=FLOOD_ARMY_SHELTER_COST,why:`须有 ${FLOOD_ARMY_SHELTER_COST} 万两和 1 点精力`,
      f:()=>{
        policyNudge('army',8);
        log('驻军奉旨安置灾民，武将在朝中更有分量。');
        return `驻军搭好了棚屋，灾民有了落脚处。此番赈务办成，朝中也多了几分倚重武将的声音。${fx(chg({treasury:-FLOOD_ARMY_SHELTER_COST,people:5}))}`;
      }});
  }
  if(brief.floodNeed==='grain'){
    event.text+='\n灾区安置已稳，粮道仍未通。常平仓若有存粮，可以另拨运费调粮。';
    const freight=brief.freightBooked?FLOOD_FREIGHT_BALANCE:FLOOD_GRAIN_FREIGHT;
    const people=halfGrainReserve()?2:4;
    if(brief.freightBooked)event.text+='\n运粮车只保留到本月，逾期或改用他法，订金不退。';
    if(grainReserveReady())event.choices.splice(1,0,{
      t:brief.freightBooked?'调常平仓粮，用已订运粮车收尾':'调常平仓粮，拨运费收尾',
      preview:`国库 −${freight} 万两 · 民心 +${people} · 用完余粮`,
      cond:()=>grainReserveReady()&&E().treasury>=freight,why:`须有储粮、${freight} 万两和 1 点精力`,
      f:()=>{
        clearGrainReserve();
        return `户部绕开受损粮道，把常平仓的存粮送到了灾区。${fx(chg({treasury:-freight,people}))}`;
      }});
  }
  if(!brief.extended)event.choices.push({
    t:'拨周转银，延一月收尾',
    preview:`国库 −${FLOOD_BRIDGE_COST} 万两 · 民心 −1 · 下月再呈赈灾回奏 · 仅可延期一次`+
      (brief.freightBooked?' · 本月订车失效':''),
    delegated:true,cond:()=>E().treasury>=FLOOD_BRIDGE_COST,why:`国库至少需 ${FLOOD_BRIDGE_COST} 万两`,
    f:()=>{
      S.flags.floodRelief={turn:S.turn+1,gen:S.gen,floodNeed:brief.floodNeed,extended:true};
      return `户部先拨周转银维持赈济。灾民还要再等一个月，下月须批复收尾。${fx(chg({treasury:-FLOOD_BRIDGE_COST,people:-1}))}`;
    }});
  return event;
}
function courtEvent(){
  const ev=COURT[pick(SPONT)]();
  ev.onQueue=()=>{S.flags.lastCourt=ev.title;};
  return ev;
}

function monthlyCourtEvent(){
  const brief=S.flags.monthlyCourt;
  if(brief?.turn===S.turn&&brief.gen===S.gen){
    if(brief.done)return null;
    if(brief.locustFollowup)return locustReliefDue()?locustReliefEvent():null;
    if(brief.floodFollowup)return floodReliefEvent(brief);
    if(brief.index===LOCUST_INDEX||brief.index===HARVEST_INDEX){
      markGrainMemorialSeen(brief.index);
      return monthlyGrainEvent(brief.index,brief);
    }
    if(brief.index===FLOOD_INDEX){
      if(!Object.hasOwn(FLOOD_SUPERVISION,brief.floodNeed)){
        brief.floodNeed='grain';
        save('auto');
      }
      return monthlyFloodEvent(brief);
    }
    if(brief.index!==IMPEACHMENT_INDEX)return COURT[brief.index]?.(brief);
    // Old saves kept the subject but didn't pin the case or evidence.
    if(!brief.impeachment&&impeachmentSubject(brief.person)){
      brief.impeachment=pinImpeachment(brief.person);
      S.flags.impeachmentSeen=true;
      save('auto');
    }
    const event=impeachmentEvent(brief);
    if(event)return event;
    if(brief.review)log('涉案人已不符呈阅条件，查账回奏已归档。');
    delete S.flags.monthlyCourt;
  }
  if(locustReliefDue()){
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX,locustFollowup:true};
    save('auto');
    return locustReliefEvent();
  }
  const pending=S.flags.impeachmentReview;
  if(pending&&pending.turn<=S.turn){
    delete S.flags.impeachmentReview;
    if(pending.gen===S.gen&&pending.turn===S.turn&&impeachmentSubject(pending.file?.person)){
      const review={turn:S.turn,gen:S.gen,index:IMPEACHMENT_INDEX,person:pending.file.person,
        impeachment:pending.file,review:true};
      S.flags.monthlyCourt=review;
      save('auto');
      return impeachmentEvent(review);
    }
    if(pending.gen===S.gen)log('弹劾案未再呈阅，已归档。');
  }
  const flood=S.flags.floodRelief;
  if(flood?.turn===S.turn&&flood.gen===S.gen){
    delete S.flags.floodRelief;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodFollowup:true,floodNeed:flood.floodNeed,
      ...(flood.extended===true?{extended:true}:flood.freightBooked===true?{freightBooked:true}:{})};
    save('auto');
    return floodReliefEvent(S.flags.monthlyCourt);
  }
  const firstCaseDue=S.turn>=FIRST_IMPEACHMENT_TURN&&!S.flags.impeachmentSeen&&!brief?.impeachment;
  const candidates=S.turn===0&&S.flags.openingCourt?[0]:shuffle(COURT.map((_,i)=>i));
  const firstHarvest=grainHarvestSeason()&&S.flags.harvestSeenGen!==S.gen;
  const firstLocust=S.year>=2&&S.month>=3&&S.month<=5&&S.flags.harvestSeenGen===S.gen&&S.flags.locustSeenGen!==S.gen;
  if(firstHarvest||firstLocust){
    const index=firstHarvest?HARVEST_INDEX:LOCUST_INDEX;
    candidates.splice(candidates.indexOf(index),1);
    candidates.unshift(index);
  }
  if(firstCaseDue) {
    candidates.splice(candidates.indexOf(IMPEACHMENT_INDEX),1);
    candidates.unshift(IMPEACHMENT_INDEX);
  }
  for(const index of candidates){
    const impeachment=index===IMPEACHMENT_INDEX?newImpeachment():null;
    const floodNeed=index===FLOOD_INDEX?(S.turn===0||chance(.5)?'grain':'shelter'):null;
    const locustRoll=index===LOCUST_INDEX?R():null;
    const locustNeed=locustRoll===null?null:locustRoll<.5?'near':'far';
    const locustAuditNeed=locustRoll!==null&&locustRoll>=.35&&locustRoll<.65?(chance(.5)?'near':'far'):null;
    const ev=floodNeed?monthlyFloodEvent({floodNeed}):index===LOCUST_INDEX||index===HARVEST_INDEX
      ?monthlyGrainEvent(index,{locustNeed,locustAuditNeed}):COURT[index](index===IMPEACHMENT_INDEX?{impeachment}:undefined);
    if(!ev)continue;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index,person:ev.person,sons:ev.sons,
      ...(impeachment?{impeachment}:{}),
      ...(floodNeed?{floodNeed}:{}),
      ...(locustNeed?{locustNeed}:{}),
      ...(locustAuditNeed?{locustAuditNeed}:{}),
      guest:ev.title==='西域使臣'?ev.por:undefined};
    if(impeachment)S.flags.impeachmentSeen=true;
    markGrainMemorialSeen(index);
    save('auto');
    return ev;
  }
}
function markGrainMemorialSeen(index){
  if(index===HARVEST_INDEX)S.flags.harvestSeenGen=S.gen;
  if(index===LOCUST_INDEX&&S.flags.harvestSeenGen===S.gen)S.flags.locustSeenGen=S.gen;
}

const COURT_BLOCS=[
  {id:'kin',name:'外戚',interest:'家族地位与官职',metric:()=>Math.max(0,...harem().map(c=>c.fam.p)),cost:{treasury:-12},gain:{prestige:3}},
  {id:'civil',name:'文官',interest:'科举、财政与民政',metric:()=>E().people,cost:{treasury:-10},gain:{people:5,wen:2}},
  {id:'army',name:'武将',interest:'军功与边防',metric:()=>E().wu,cost:{treasury:-16},gain:{wu:4,prestige:2}},
  {id:'dowager',name:'太后',interest:'宗室血脉与宫廷稳定',metric:()=>S.flags.dowager?.alive?65:0,cost:{treasury:-8},gain:{prestige:4}},
  {id:'princes',name:'皇子',interest:'储位与继承',metric:()=>Math.max(0,...kidsAlive().filter(k=>k.sex==='m').map(k=>k.sup||0)),cost:{treasury:-12},gain:{prestige:3,people:2}}
];
function courtStanding(bloc){return clamp(Math.round(bloc.metric()+(S.courtPolicy?.[bloc.id]||0)))}
A.courtPolicy=function(id){
  const bloc=COURT_BLOCS.find(group=>group.id===id);
  if(!bloc||S.courtPolicyTurn===S.turn||E().energy<=0||E().treasury< -bloc.cost.treasury)return;
  if(id==='dowager'&&!S.flags.dowager?.alive)return;
  S.courtPolicy ||= {};
  E().energy--;
  S.courtPolicyTurn=S.turn;
  chg({...bloc.cost,...bloc.gain});
  for(const group of COURT_BLOCS){
    const previous=S.courtPolicy[group.id]||0;
    S.courtPolicy[group.id]=Math.max(-30,Math.min(30,previous+(group===bloc?10:-2)));
  }
  log(`御书房议政，优先采纳${bloc.name}建议。`,1);
  courtEcho(id);
  save('auto');render();
};
function courtBlocHTML(){
  return `<h3>朝堂势力</h3><div class="grid">${COURT_BLOCS.map(bloc=>{
    const unavailable=S.courtPolicyTurn===S.turn||E().energy<=0||E().treasury< -bloc.cost.treasury||(bloc.id==='dowager'&&!S.flags.dowager?.alive);
    return `<article class="card" style="display:block;cursor:default"><b>${bloc.name}</b><div>${bloc.interest}</div>${bar('影响力',courtStanding(bloc))}<button class="btn sm" onclick="A.courtPolicy('${bloc.id}')" ${unavailable?'disabled':''}>采纳建议 · 国库 ${bloc.cost.treasury}</button></article>`;
  }).join('')}</div>`;
}
/* ============ 父兄、立场与朝局 ============ */
// 每位妃嫔的父亲和兄长都是有名有姓的人，分属五大集团之一。朝堂上的事会落到具体的人和妃嫔身上。
const OFFICE_BLOC={'内阁首辅':'civil','吏部尚书':'civil','户部侍郎':'civil','翰林学士':'civil','知府':'civil','县令':'civil','书香门第':'civil',
  '镇国大将军':'army','两江总督':'army','皇商':'kin','太医院院判':'dowager','寒门':null};
const FATHER_NAMES=['敬之','文远','守义','承业','怀瑾','思齐','伯庸','仲谋','子衡','季安','修远','明德','元朗','景行','致远','叔夜','延年','鸿儒'];
const BROTHER_NAMES=['子昂','云深','少卿','长风','清和','怀远','叔宝','仲安','伯言','子期','砚秋','望舒','承泽','慕白'];
const BROTHER_POSTS={civil:['翰林院编修','户部主事','监察御史','知县'],army:['游击将军','守备','参将','骁骑校尉'],kin:['盐运使','苏州织造','内务府员外郎'],dowager:['太医院吏目','宗人府主事'],none:['举人','国子监生']};
const FRONTIERS=['雁门关','玉门关','居庸关','嘉峪关','山海关'];
const blocName=id=>COURT_BLOCS.find(b=>b.id===id)?.name||'无所依附';
const BLOC_COLOR={kin:'#b8742c',civil:'#3b5fa8',army:'#9a3b33',dowager:'#7a5a99',princes:'#2f7d62'};
function sameFather(a,b){
  const left=a.house?.father,right=b.house?.father;
  if(left?.id!=null&&right?.id!=null&&left.id===right.id)return true;
  if(a.fatherId!=null&&a.fatherId===b.fatherId)return true;
  const kin=[a.kin?.[b.id],b.kin?.[a.id]].filter(Boolean);
  if(kin.some(k=>/^亲[姐妹]$/.test(k)))return true;
  if(kin.some(k=>/^堂[姐妹]$/.test(k)))return false;
  // Before fathers had an identity, the same father was copied into each daughter.
  // Only reconcile within a clan; explicit cousins and two identified fathers stay separate.
  return !!(left&&right&&(!left.id||!right.id)&&clanKey(a)===clanKey(b)&&
    left.name===right.name&&left.office===right.office);
}
function paternalFamily(c){
  const people=[...new Set([...(S?.consorts||[]),...(S?.cands||[]),c])].filter(p=>p&&!p.maid);
  const relatives=new Set([c]);
  let changed=true;
  while(changed){
    changed=false;
    for(const person of people){
      if(relatives.has(person))continue;
      if([...relatives].some(other=>sameFather(person,other))){
        relatives.add(person);changed=true;
      }
    }
  }
  return [...relatives].sort((a,b)=>a.id-b.id);
}
function identifyFather(family,house){
  const root=family[0],father=house.father;
  father.id ||= 'father-'+S.gen+'-'+root.id;
  // Generated cousins may have picked the same short name. Distinguish those people.
  const taken=new Set([...(S.consorts||[]),...(S.cands||[])].filter(p=>
    !family.includes(p)&&clanKey(p)===clanKey(root)&&p.house?.father.id&&p.house.father.id!==father.id)
    .map(p=>p.house.father.name));
  if(taken.has(father.name)){
    const available=FATHER_NAMES.map(name=>root.sur+name);
    let suffix=1;
    father.name=available.find(name=>!taken.has(name))||root.sur+'承'+suffix;
    while(taken.has(father.name))father.name=root.sur+'承'+(++suffix);
  }
  family.forEach(p=>{p.house=house;p.fatherId=root.id;});
  for(const person of family)for(const sister of family){
    if(person===sister)continue;
    person.kin ||= {};
    if(!person.kin[sister.id]||person.kin[sister.id].startsWith('堂'))
      person.kin[sister.id]='亲'+(sister.age>person.age||(sister.age===person.age&&sister.id<person.id)?'姐':'妹');
  }
  return house;
}
function houseOf(c){
  if(!c||c.maid)return null;
  const family=paternalFamily(c),root=family[0];
  const existing=family.find(p=>p.house)?.house;
  if(existing)return identifyFather(family,existing);
  const seed=(root.seed||root.id*7919)>>>0,bloc=Object.hasOwn(OFFICE_BLOC,root.fam?.t)?OFFICE_BLOC[root.fam.t]:null;
  const posts=BROTHER_POSTS[bloc||'none'];
  root.house={bloc,
    father:{name:root.sur+FATHER_NAMES[seed%FATHER_NAMES.length],office:root.fam?.t||'寒门',age:42+seed%17,alive:true},
    brother:{name:root.sur+BROTHER_NAMES[(seed>>>5)%BROTHER_NAMES.length],post:posts[(seed>>>9)%posts.length],merit:20+(seed>>>3)%30,away:false}};
  return identifyFather(family,root.house);
}
// 立场：父兄所在的集团；娘家势力大的妃嫔也会被看作外戚一派
function stanceOf(c){const h=houseOf(c);if(!h)return null;return h.bloc||(c.fam?.p>=55?'kin':null)}
function houseLine(c){
  const h=houseOf(c);if(!h)return '';
  const st=stanceOf(c);
  const suspension=h.father.alive&&reliefSuspended(h.father)?' · 停办赈务中':'';
  return `<div>父亲：${esc(h.father.name)}（${esc(h.father.office)}${h.father.honor?' · '+esc(h.father.honor):''}${suspension}${h.father.alive?'':'，已故'}）　兄长：${esc(h.brother.name)}（${esc(h.brother.post)}${h.brother.away?'，外放':''}）　立场：<span class="tag" style="border-color:${BLOC_COLOR[st]||'#999'}">${esc(blocName(st))}</span></div>`;
}
const policyNudge=(id,v)=>{S.courtPolicy ||= {};S.courtPolicy[id]=Math.max(-30,Math.min(30,(S.courtPolicy[id]||0)+v))};
// 采纳某一派的建议：同派妃嫔高兴，与之相争的一派妃嫔不痛快
const BLOC_RIVAL={kin:'civil',civil:'kin',army:'civil',dowager:'princes',princes:'dowager'};
function courtEcho(id){
  const glad=[],sour=[];
  for(const c of harem()){
    const st=stanceOf(c);
    if(st===id){cchg(c,{mood:4});glad.push(c);}
    else if(st&&st===BLOC_RIVAL[id]){cchg(c,{mood:-3});sour.push(c);}
  }
  if(glad.length)log(`${glad.map(cName).join('、')}的娘家在朝中得了脸面。`);
  if(sour.length)story(sour[0],`陛下采纳了${blocName(id)}的建议，她父亲${houseOf(sour[0]).father.name}在朝上碰了钉子。`);
}
// 每月：兄长攒军功或政绩，父亲渐老，偶有致仕或病故
function courtTick(){
  const seen=new Set();
  for(const c of harem()){
    const h=houseOf(c);if(!h)continue;
    if(seen.has(h))continue;
    seen.add(h);
    h.brother.merit=clamp(h.brother.merit+(h.bloc==='army'?(E().wu-50)/40:.3)+R()*.6);
    if(S.month===1&&h.father.alive){h.father.age++;
      if(h.father.age>=66&&chance(.12)){
        h.father.alive=false;
        for(const daughter of paternalFamily(c).filter(inPalace)){
          cchg(daughter,{mood:-15});setXin(daughter,'悲恸',`父亲${h.father.name}病故`);
          story(daughter,`父亲${h.father.name}在家中病故。`);daughter.fam.p=Math.max(5,daughter.fam.p-10);
        }
        log(`${cName(c)}之父${h.father.name}病故。`,1);
      }}
  }
}
// Wins and defeats share a court-wide interval; sisters share their household's interval.
function frontierReportReady(c){
  return S.turn-(S.flags.lastFrontierReport??S.flags.lastMilitaryMerit??-99)>=12&&
    S.turn-(houseOf(c)?.lastFrontierReport??-99)>=24;
}
function frontierReport(c,officer,event){
  let queued=false;
  return {...event,present:[c],
    valid:()=>officer.alive!==false&&(queued||frontierReportReady(c)),
    onQueue:()=>{queued=true;S.flags.lastFrontierReport=S.turn;houseOf(c).lastFrontierReport=S.turn;
      if(event.title==='边关捷报')S.flags.lastMilitaryMerit=S.turn;}};
}
function militaryMeritEvent(c,place,relative='brother'){
  const h=houseOf(c),officer=h[relative],kin=relative==='father'?'父亲':'兄长';
  const mark=()=>{officer.merit=clamp((officer.merit||0)+15);policyNudge('army',5);};
  const next=c.rank+1,promotable=()=>c.alive&&!c.cold&&!c.gone&&next<8&&c.rank+1===next&&rankCount(next)<RANK_CAP[next];
  return frontierReport(c,officer,{title:'边关捷报',por:c,
    text:`传旨公公捧着${place}八百里捷报进殿：${officer.name}率部夜袭敌营，斩获颇丰。${relative==='father'?`其子${h.brother.name}也随军效力。`:''}\n${cName(c)}听见${kin}的名字，忙起身听旨，眼中难掩喜色。`,choices:[
      {t:`厚赏，加封其${relative==='father'?'父':'兄'}（国库-20）`,cond:()=>E().treasury>=20,why:'国库银两不足',f:()=>{
        mark();if(relative==='brother')h.brother.post='总兵';else h.father.honor='护国功臣';
        story(c,`${kin}${officer.name}在${place}立功受封。`);log(`${officer.name}在${place}立功，朝廷加封厚赏。`,1);
        return fx(cchg(c,{mood:10,aff:3}),chg({treasury:-20,prestige:3}));
      }},
      {t:next<8?`以军功加恩，晋${cName(c)}为${RANKS[next]}`:'位分已不能再晋，改行赏赐',person:c,cond:promotable,
        why:next>=8?'中宫需另行册立，不能因军功直接升后':'该位分名额已满或人物已不在宫',f:()=>{
          if(!promotable())return '眼下不合晋封条件，仍请按原位分论赏。';
          mark();c.rank=next;if(next>=4&&!c.title)c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)))||'昭';assignPalace(c);
          story(c,`${kin}${officer.name}在${place}立功，陛下当场加恩，晋为${cName(c)}。`);remember(c,'promo',`因${kin}军功晋封`);setXin(c,'欢喜','父兄立功，当场获晋封');clanEcho(c,'up');
          log(`以${officer.name}军功，加恩晋${fullName(c)}为${cName(c)}。`,1);return fx(cchg(c,{mood:20,aff:8,favor:5}),chg({prestige:2}));
        }},
      {t:`赏${cName(c)}锦缎珠玉（国库-15）`,person:c,cond:()=>E().treasury>=15,why:'国库银两不足',f:()=>{
        mark();remember(c,'gift','父兄立功，陛下当场赏赐锦缎珠玉');story(c,`${kin}${officer.name}立功，自己获赏锦缎珠玉。`);setXin(c,'欢喜','父兄立功，获赏锦缎珠玉');log(`因${officer.name}军功，赏${fullName(c)}锦缎珠玉。`,1);
        return fx(chg({treasury:-15,prestige:1}),cchg(c,{mood:15,aff:6,favor:3}));
      }},
      {t:'记功，暂不封赏',f:()=>{officer.merit=clamp((officer.merit||0)+8);story(c,`${kin}${officer.name}在${place}立功，已记入功册，暂未封赏。`);return fx(cchg(c,{mood:-4}));}}
    ]});
}
// An audience with two mothers requires two distinct households able to attend.
// A mother's confinement does not remove her child's independent succession rights.
function successionRivalryEvent(){
  if(S.heir)return null;
  const sons=shuffle(kidsAlive().filter(k=>k.sex==='m'&&kidAge(k)>=6&&
    familyVisitAllowed(k,byId(k.mom))&&!byId(k.mom).maid));
  const a=sons[0],b=a&&sons.find(k=>k.mom!==a.mom);if(!b)return null;
  const ma=byId(a.mom),mb=byId(b.mom),fa=houseOf(ma)?.father,fb=houseOf(mb)?.father;
  return {title:'国本之争',ref:'明·万历国本之争',cast:[ma,a,mb,b],present:[ma,a,mb,b],valid:()=>!S.heir&&familyVisitAllowed(a,ma)&&familyVisitAllowed(b,mb),text:`${fa?.alive?fa.name:fullName(ma)+'母家的支持者'}领着一班人上疏，请早立${kidName(a)}为储；${fb?.alive?fb.name:fullName(mb)+'母家的支持者'}的人则推${kidName(b)}。两位皇子的生母在御花园碰见，谁也没有先开口。`,choices:[
      {t:`暗示倾向${kidName(a)}`,person:a,f:()=>{a.sup=clamp((a.sup||0)+10);policyNudge('princes',3);setXin(mb,'嫉恨','陛下倾向别家皇子',ma.id);relAdd(ma,mb,-12);return fx(cchg(ma,{mood:8}),cchg(mb,{mood:-8}))}},
      {t:`暗示倾向${kidName(b)}`,person:b,f:()=>{b.sup=clamp((b.sup||0)+10);policyNudge('princes',3);setXin(ma,'嫉恨','陛下倾向别家皇子',mb.id);relAdd(ma,mb,-12);return fx(cchg(mb,{mood:8}),cchg(ma,{mood:-8}))}},
      {t:'“储位之事，谁再提，罚俸。”',f:()=>{policyNudge('princes',-5);return fx(chg({prestige:2,people:-1}))}}]};
}
// 朝堂派系事件：都落在具体的父兄、妃嫔和皇子身上
function factionEvent(){
  const pool=[];
  const withHouse=harem().filter(c=>houseOf(c)&&c.house.father.alive);
  const kin=withHouse.filter(c=>stanceOf(c)==='kin'&&c.favor>=45);
  if(kin.length){const c=pick(kin),h=houseOf(c);pool.push({title:'外戚请封',por:c,text:`${h.father.name}递了折子，请擢其子${h.brother.name}为京官。朝中都知道，这是${cName(c)}的娘家。文官们已经在私下议论“恩出于内”。`,choices:[
    {t:'准了',f:()=>{h.brother.post='通政司参议';h.brother.merit+=8;c.fam.p=Math.min(95,c.fam.p+6);policyNudge('kin',5);policyNudge('civil',-4);story(c,`陛下准了兄长${h.brother.name}入京为官。`);return fx(cchg(c,{mood:8,aff:3}),chg({prestige:-2}))}},
    {t:'驳回：“官职是朝廷的，不是谁家的。”',f:()=>{policyNudge('civil',3);setXin(c,'委屈','娘家请封被驳');return fx(cchg(c,{mood:-8}),chg({prestige:2}))}},
    {t:'外放历练，三年后再议',f:()=>{h.brother.away=true;h.brother.post='外放'+pick(['知州','同知','通判']);h.brother.merit+=4;policyNudge('civil',1);return fx(cchg(c,{mood:-2}))+`\n§${h.brother.name}出京赴任`}}]});}
  const civil=withHouse.filter(c=>stanceOf(c)==='civil');
  if(civil.length){const c=pick(civil),h=houseOf(c);pool.push({title:'科场案',ref:'科场舞弊（明·弘治己未科场案）',por:c,text:`今科会试有舞弊传闻，御史顺藤摸瓜，查到${h.father.name}的门生头上。${cName(c)}一早就跪在殿外，说父亲为官清白。`,choices:[
    {t:'严查到底',f:()=>{c.fam.p=Math.max(5,c.fam.p-12);policyNudge('civil',4);setXin(c,'惶恐','父亲牵涉科场案');story(c,`父亲${h.father.name}因科场案受审。`);return fx(cchg(c,{mood:-10}),chg({people:4,prestige:2}))}},
    {t:`看在${cName(c)}面上，从轻发落`,f:()=>{policyNudge('civil',-5);return fx(cchg(c,{mood:6,aff:4}),chg({people:-3,prestige:-2}))}},
    {t:'交三司会审，查清再说',f:()=>{if(chance(.55)){story(c,`三司会审还了父亲${h.father.name}清白。`);policyNudge('civil',2);return '三司会审，门生确有舞弊，却与'+h.father.name+'无关。'+fx(cchg(c,{mood:8}),chg({people:2}))}
      c.fam.p=Math.max(5,c.fam.p-8);setXin(c,'惶恐','父亲被查出失察之责');return h.father.name+'失察，罚俸一年。'+fx(cchg(c,{mood:-6}),chg({people:2}))}}]});}
  const army=withHouse.filter(c=>stanceOf(c)==='army'&&frontierReportReady(c));
  if(army.length&&chance(.35)){const c=pick(army),h=houseOf(c),place=pick(FRONTIERS),win=chance(.35+E().wu/200+h.brother.merit/300);
    pool.push(win?militaryMeritEvent(c,place,chance(.35)?'father':'brother')
    :frontierReport(c,h.brother,{title:'边关失利',por:c,text:`${place}急报：${h.brother.name}中了埋伏，折损了三百骑。武将们说胜败乃兵家常事，御史却要问罪。${cName(c)}已经两天没吃下饭。`,choices:[
      {t:'依律问责',f:()=>{h.brother.merit=Math.max(0,h.brother.merit-15);policyNudge('army',-2);policyNudge('civil',2);setXin(c,'惶恐','兄长兵败受责');return fx(cchg(c,{mood:-12}),chg({people:1}))}},
      {t:'宽宥，许他戴罪立功',f:()=>{policyNudge('army',4);return fx(cchg(c,{mood:6,aff:5}),chg({prestige:-1}))}}]}));}
  const dw=S.flags.dowager;
  if(dw?.alive){const pref=harem().filter(c=>c.rank<8&&(stanceOf(c)==='dowager'||c.virtue>=70)).sort((a,b)=>b.virtue-a.virtue)[0];
    if(pref)pool.push({title:'慈宁宫',por:pref,text:`${dw.name}召陛下用膳，席间夸${cName(pref)}温良贤淑，又叹皇家子嗣单薄，“哀家看着她就喜欢”。话没说透，意思谁都明白。`,choices:[
      {t:'遵太后之意，多去她宫里',f:()=>{policyNudge('dowager',5);const em=empress();if(em&&em!==pref)cchg(em,{mood:-3});return fx(cchg(pref,{favor:8,mood:8}),chg({prestige:1}))}},
      {t:'“儿臣心里有数。”',f:()=>{policyNudge('dowager',-4);return fx(chg({prestige:1}))}}]});}
  const rivalry=successionRivalryEvent();if(rivalry)pool.push(rivalry);
  const ev=pool.length?pick(pool):null;
  return ev?{...ev,present:ev.present||eventPortraits(ev)}:null;
}
// 离开太久，御案上会积下奏折；下个月末一并呈上
function offlineMemorials(){
  if(!S||!S.savedAt)return;
  const hours=(Date.now()-S.savedAt)/36e5;
  if(hours<1)return;
  const n=Math.min(3,Math.floor(hours/2)+1);
  S.flags.memorials=Math.min(3,(S.flags.memorials||0)+n);
  toast(`陛下离宫约${Math.round(hours)}个时辰，御案上积了${S.flags.memorials}份奏折，月末呈上`);
}
