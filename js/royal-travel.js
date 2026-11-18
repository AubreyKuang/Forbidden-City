/* Secular royal travel. Older published journals have no secular journey actions. */
const TRAVEL_RELEASE_JOURNAL=63;
const royalTravelActive=()=>journalContentVersion()>=TRAVEL_RELEASE_JOURNAL;
const royalTravelAway=k=>royalTravelActive()&&k?.royalTravel?.stage==='traveling';
const royalDiplomaticAway=k=>journalContentVersion()>=84&&['traveling','detained'].includes(k?.diplomaticJourney?.status);
const royalJourneyAway=k=>immortalAway(k)||royalTravelAway(k)||royalDiplomaticAway(k);
function royalTravelMothers(k){
 const mothers=immortalMothers(k);
 for(const id of [k.mom,k.foster]){
  const c=id&&familyHostById(id);
  if(c?.alive&&!mothers.some(p=>p.id===c.id))mothers.push(c);
 }
 return mothers;
}
function recordRoyalJourney(k,r,title,text,kind,{reaction,location,memoryType,departureReason}){
 const entry=`【${title}】${text}`;
 r.history.push({turn:S.turn,d:dateStr(),title,text});if(r.history.length>36)r.history.shift();
 kstory(k,entry);log(`${k.name}：${entry}`,1);
 const mothers=royalTravelMothers(k);
 for(const c of mothers){
  const feeling=reaction(c,k,kind);story(c,entry+' '+feeling);
  if(S.consorts.includes(c)){
   cchg(c,{mood:kind==='departure'?-8:kind==='return'?10:kind==='danger'?-5:3});reconcileMotherConcern(c);
   if(kind==='departure')setXin(c,'思念',departureReason);
  }
  NPCMemory.record(S,{type:memoryType,time:S.turn,location,participants:[k.id,c.id],outcome:text},[
   {person:k.id,subject:c.id,interpretation:text,emotion:.4,impact:75},
   {person:c.id,subject:k.id,interpretation:feeling,emotion:['departure','danger'].includes(kind)?-.5:.6,impact:80}]);
 }
}
function comfortJourneyMothers(k){
 for(const c of royalTravelMothers(k))if(S.consorts.includes(c)){const worry=reconcileMotherConcern(c);if(worry)worry.value=clamp(worry.value-15);}
}
const ROYAL_TRAVEL_ROUTES=[
 [{place:'淮扬',sight:'沿运河看漕船过闸，才知道涨水时一日能耽搁多少船。'},{place:'江南',sight:'村里的织户愿意让我在机旁坐一日，听他们算一匹布的用料和工钱。'}],
 [{place:'关中',sight:'走过旧驿路，驿卒指给我看哪些水井入秋后还能取水。'},{place:'陇右',sight:'赶集时听牧人和农户商量换粮，书上轻轻写过的一笔，原来要谈上半日。'}],
 [{place:'荆楚',sight:'船家告诉我，江面看着平静时，反倒最该记住暗礁所在。'},{place:'西南',sight:'在山间借住几日，跟乡民走过雨后便要重修的一段栈道。'}]
];
const ROYAL_TRAVEL_ITINERARIES={
 qi:{name:'齐地观潮',months:6,w:5,stops:[
  [2,'齐地临淄','市上的人各从一处来，盐、布和谷子换手几回，问过才知道价钱如何定下来。'],
  [4,'登州海滨','跟渔家上了堤，学着看哪一处礁石露头才可出船。','春潮漫过低堤，向导先带我们退到坡上。后来潮退，大家才从原路回来。']],
  home:['请在沿海设潮汛木牌','渔村各凭老人记潮，外乡商船不熟水情。请让港吏把涨落时刻和避风处写在渡口的木牌上。',20,{people:3},
   [3,'同渔户逐日核对潮时，把容易误入的浅滩添到牌上','登州两处渡口都立了潮汛牌。船家说，看着潮牌的外地客船少有再搁在沙嘴。','只有内港的潮牌核准了。外港风急，潮时须分晴日和大风另记，港吏收回旧牌重校。']]},
 lu:{name:'鲁地访学',months:6,w:5,stops:[
  [2,'鲁地曲阜','书院里有从十几里外背书来的孩子，放课以后还留下替先生抄书。'],
  [4,'泰山麓','山脚的抄书铺借一册收一册，借不到的人就围在门外听别人念。']],
  home:['准县学设借书簿','各县可先拨几部常用书，准学生借归，也让镇上的寒门子弟循簿借阅。',25,{wen:3,people:1},
   [4,'挨户问学生常借哪几部书，又同县学订下归还的日子','两处县学都开了借书簿。首月借出去三十二册，邻近村里的孩子也能凭保结借归。','第一处县学已能借书，另一处抄本太少，只好先辟一室供学生共读。']]},
 yu:{name:'豫地看河',months:6,w:5,stops:[
  [2,'豫地开封','河夫领我看去年汛水留下的水线，一处处都是他们亲手刻上去的。'],
  [4,'洛阳津口','渡船临水排了长队，赶集人把最早一班留给挑菜和赶牲口的人。','上游一场骤雨冲坏了渡板，驿丁让我们在高处住了一夜，第二日才绕行。']],
  home:['按旧水痕补设水尺','先在两处渡口试设水尺，让河夫记下水位，雨季每日把数字送到县里。',25,{people:3,prestige:1},
   [4,'重看津口水痕，同河夫一道定下报汛的刻度','两处水尺都已立好。一次上游涨水时，津吏凭消息提前停渡，把候船人劝回了岸上。','一处水尺读数已有用处；另一处河床淤高，旧水痕失了准头，已择地重新立尺。']]},
 canal:{name:'淮扬江南',months:12,w:4,stops:[
  [3,'淮扬','沿运河看漕船过闸，才知道涨水时一日能耽搁多少船。'],
  [8,'江南','村里的织户让我在机旁坐了一日，听他们算一匹布的用料和工钱。']],
  home:['请漕闸公开船次','先在两处闸口挂出船次和候闸时辰，免得小船反复找人打听。',20,{people:3},
   [3,'在闸口问候船人等了多久，帮闸吏重排小船的船次','两处闸口都照新榜放船。小船知道何时来，岸边的拥堵已轻了许多。','一处闸口按榜放船已见成效；另一处逢漕船齐到，原定船次只能作废，仍需为小船留出专门时段。']]},
 rivers:{name:'荆楚入潇湘',months:24,w:4,stops:[
  [5,'荆楚','船家说江面看着越平静，越要记住哪里藏着暗礁。'],
  [11,'洞庭','离船前，有个往秦地的同路人念起「君向潇湘我向秦」。我沿湖再往南，他却要渡江北去。','湖上忽起大风，船家掉头进了芦苇湾。装行李的木箱淋湿了，人都安好。'],
  [19,'潇湘','村中渡口夜里留三盏灯，一盏照石阶，一盏指浅滩，一盏留给最后一条回来的船。']],
  road:['为险渡试设灯标','可让渡夫自己指认暗礁，让县里供灯油、修几处夜间路标。',20,{people:2},
   [3,'标出手记中的险滩，逐处问渡户夜里远望能不能看清灯光','两处险渡的灯标都已点起，近月入夜遇雾，船夫借高处的灯平安靠岸。','一处渡口已点灯，低处的灯却常被风浪打灭。渡户试把灯迁上石台，等下回涨水再看。']],
  home:['把沿江汛期编成渡口册','叫河夫和船户一道核对汛期与避风处，再分给沿江各县。',30,{wen:2,people:3},
   [5,'同船户核对各县水情，把可泊船的芦湾补进册中','渡口册已分送沿江四县。两县照册相约，遇急汛便互通上游水情。','上游几处已照册通报，湖口的水势却时常倒灌，所列避风处须等过一季再定。']]},
 qin:{name:'秦地与陇右',months:24,w:4,stops:[
  [5,'秦地关中','官道旁还留着旧驿井，驿卒能说出哪几口到了秋天也有水。'],
  [12,'陇右','赶集时听牧人同农户商量换粮，账上轻轻写过的一笔，原来要谈上半日。','驿路遇到崩坡，一行人折返借宿，等向导摸清了便道才继续走。'],
  [20,'陇山驿道','回程遇见修驿路的匠人，才晓得山道上哪一截最费石料，也最要有人常看。']],
  road:['请重抄秦陇驿路图','请当地驿卒把井泉、宿处和雨季可走的路各画一张，送给往来官差和商旅。',20,{wen:2,people:1},
   [4,'拿旅途手记同驿卒校图，为常被抄错的井泉添注','秦陇两路驿图已经挂到三处驿亭，中途可宿可汲一眼便知，驿卒也不用反复指路。','关中驿图已挂出，陇右有两处井泉入秋便枯。旧图已改，来年还得复勘。']],
  home:['准沿途驿站按季检修','先试行巡检两段旧驿道，坏处在雨季前修完，工料照实入簿。',35,{people:4},
   [5,'沿旧道踏勘积水和崩土，催驿丞把工料实数一笔笔写进簿子','两段驿路都修了排水沟，连日雨后仍可通车。入秋前，驿丞会照新簿再巡一次。','一段驿路已经通车，另一段雨后又见落石，眼下先改作骡马绕行，等山土干透再动工。']]},
 desert:{name:'河西与西域',months:36,w:2,stops:[
  [6,'河西凉州','边市有人替几国商人称货，一天里要在几个不同的斤两之间换算。'],
  [15,'吐鲁番绿洲','村民轮流引水，渠口一块木牌上写着各家的时辰。','穿戈壁时风沙盖住路标，向导当即折回井旁歇了一夜。第二日跟着驼队到了绿洲，同行的人都平安。'],
  [28,'龟兹','抄录了几段当地的乐谱，乐师坚持要听我先唱一遍，才肯在纸上添注。']],
  road:['边市试立双文度量簿','请通译和行商共校一份度量簿，在关口公开换算办法，减少称货争讼。',30,{people:3,prestige:1},
   [4,'找通译和商户一起核过各地用的砝码，给账簿补上两种写法','边市三处秤台已按双文簿换算。最近一桩盐货争讼，两家对过账便各自签了字。','粮货的斤两已经校准，但换算贵重药材仍有出入，通译和行商把这一页暂时撤下。']],
  home:['引绿洲水册试办轮灌','选两处缺水的村镇，先让乡人自议轮灌时辰，再由县里立册。',40,{people:5},
   [5,'听上下游各家说枯水时怎么分，把夜间换水也列进册子','两村都按水册轮灌，下游田户也赶上了这轮春灌，渠首的争执少了。','上游一村已照日轮水，下游水量比旧册记的少。各家先减半轮灌，等商定旱时的水额。']]},
 scriptures:{name:'西域取经',months:60,w:1,stops:[
  [8,'河西敦煌','借宿寺中，看到僧人对着两种文字逐句校勘。同一个词，他们能争一整晚。'],
  [21,'西域疏勒','沿山口向南，换了新的向导。寺里的抄经人赠我几页用异文写成的注疏。','翻山遇见骤雪，一行人退回山下驿站等了数日。人马都平安，天气转好才再上路。'],
  [38,'天竺北境','几名僧人和通译愿意与我一道抄经。厚厚一卷要常年有人校字，才认得出传抄间的错处。'],
  [53,'河西归途','把经卷逐册用布裹好，又另抄了沿途各地书院和寺院的名字，回京后可循名访译者。']],
  road:['请召通译与抄手预备校经','归来的经卷有数种文字。可先请懂几种语言的人旁听、试译，把疑字逐条记入校勘簿。',45,{wen:4,prestige:2},
   [4,'把旅途中记下的疑字逐项注上出处，供通译试读','礼部已请到六名通译、抄手，试校过两页异文，遇到一词多义之处都写进了并读簿。','抄手已经齐备，能通西域异文的通译却只寻到两人。先试校最熟的一卷，经义有歧说的仍留在簿上。']],
  home:['设译经院，兼校诸国典籍','请通译、僧人和翰林同桌复核带回的经卷。译成后给书院留副本，也可用这套办法校译历法和舆地书。',85,{wen:7,people:4,prestige:3},
   [6,'同翰林、僧人和通译逐卷对读，把难解的异文留在两栏供复核','译经院交出了首批三卷校本，已送两家书院抄藏。另有一册异域历法完成对译，可交钦天监校算。','译经院先校出一卷，另外两卷因译词有歧义暂缓刊抄。原文与两种译稿都留在院中，历法也暂只供试算。']]},
 east:{name:'东洋远航',months:60,w:1,stops:[
  [7,'明州海港','船匠领我看新下水的海船。各处木料受力不同，掌墨的人一截一截指给我看。'],
  [20,'东洋外海','管舵的人每晚对照星位，再同白日记下的风向相核。','风急起来时一根帆索断了，船工收帆转入避风港。等把索具换好才行，船上诸人都平安。'],
  [37,'东洋港埠','港埠把船期、潮表、货价分开张贴。来得晚的客商也能看明白，不必四处求人。'],
  [52,'东海归途','归航又试过一条较稳的航线，带回几份潮表和船匠交换的造船手记。']],
  road:['请海口试贴潮表与船期','明州可先请老船工共核潮表，把避风处和启航日期贴在码头，错处每旬更正。',40,{people:4,wen:2},
   [4,'拿随船所记的潮时请老舵手复核，把停泊处也圈在图上','明州两处码头都贴出了潮表与船期。客商按榜候风，港吏每旬抄换一次。','潮表已经挂牌，船期仍被风向打乱。港吏先把候风和确可开船分成两栏，再试一旬。']],
  home:['开海船试造与航海讲习','让本地船匠和归航舵手查验带回的手记，先试造两条船，再教水师量潮、辨风和记录航线。',90,{wu:7,wen:3,prestige:3},
   [6,'到船坞与船匠核对图样，同归航舵手编好辨风、测深的课目','工部奏报，两艘试造海船均通过近海试航，能按新表避浅滩。首批水师已习过量潮、辨风，试航日志收入讲习所。','工部奏报，头一艘海船已下水，第二艘因船缝渗水留坞复检。讲习已开了测潮、辨风两课，远航一节仍待复试。']]},
 island:{name:'海东访港',months:24,w:2,stops:[
  [5,'登州水口','和掌舵人学认潮线，出港前把几处浅滩画进了小册。'],
  [12,'海东港埠','商人把候风与卸货的规矩写在码头，我抄了一份，想给家里看看。','海雾封了港口，一行人在岸上等到雾散。迟了两日，众人都安好。'],
  [20,'辽东归途','回来时跟着商队走了一段陆路，两边说起同一场风，记下的却是不同的日子。']],
  home:['请港吏记风候与来船','可先设一册风候簿，准来往船主查阅，也请他们补记各自的见闻。',30,{wu:3,people:2},
   [3,'把两地舟师的记法写在同一页，请港吏照表登记','港吏送来首季风候簿，船主可以查到三处避风泊位，已有几名外地船主自愿来补记水情。','风候簿已开，起初只有港吏一人记，漏了不少夜船。几名常来的船主答应轮流补写。']]}
};
// Each follow-up names the work to fund and the result to report when it is finished.
const ROYAL_TRAVEL_FOLLOWUPS={
 qi:{home:{
  repair:[12,2,'分列晴日与大风的潮时，再请渔户连记一旬，核准后把牌挂回外港。','外港潮牌已重新挂出。牌上分列两种潮时，也添了大风不得靠岸的记号。'],
  expand:[35,4,'请把登州潮牌的做法推广到邻近三处鱼港，由熟悉当地潮汛的渔户核定各港时刻。','三处鱼港挂起各自的潮牌，外来渔船入港前也能在驿亭查到避风处。',{people:3}]}},
 lu:{home:{
  repair:[15,3,'请第一处县学借出底本，由抄手补齐第二处欠缺的蒙学书，再开外借簿。','第二处县学补足了蒙学抄本，附近村童已能登记借归。'],
  expand:[42,5,'把学舍借书簿推行到邻近两县，另设抄书钱，让捐来的书也能登记流转。','两县新开借书架，捐书与外借各有一册，四个村塾已经轮借了首批书。',{wen:3,people:2}]}},
 yu:{home:{
  repair:[14,3,'请河夫在洛阳津口择一处不易淤积的石岸，先用新旧两尺同测数日，再废旧尺。','洛阳津口的新水尺已同测十日，误差核清后，水尺与报汛簿一同换新。'],
  expand:[45,5,'再给上下游三处渡口立尺，让驿卒把各处水势抄进同一张汛报。','三处渡口已经接入报汛。上游雨急时，下游津吏能够提早半日知会渡夫。',{people:4,prestige:1}]}},
 canal:{home:{
  repair:[12,2,'把小船的时段另列一栏，每次漕船齐到也留一刻给小船过闸。','第二处漕闸重排了榜，赶集的小船已有专放的时段。'],
  expand:[34,4,'把公开船次的办法推到沿线三闸，约定同一套候闸和变更船次的记号。','沿线新开三处船榜，船户从上游来，也能看懂下游临时改次的记号。',{people:4}]}},
 rivers:{
  road:{
   repair:[12,2,'把低灯移上石台，添挡风罩，再请渡夫从对岸验一回能不能看见。','石台上的灯已过一次大风，渡夫从对岸仍看得见。'],
   expand:[35,4,'请邻县也访问渡夫，在三处险滩设灯标，逐处订下添油和值守的时辰。','邻县三处灯标今已点起，值守名簿贴在渡口，各处交接有据。',{people:3}]},
  home:{
   repair:[20,3,'在湖口添记倒灌的水向，为晴日、涨水各列可避风的芦湾。','沿江诸县换用修订后的渡口册。湖口倒灌那几日该到哪里系船，册中已有图可照。'],
   expand:[52,5,'把汛报和渡口册送到荆楚更多县份，约定上游报水、下游回执的次序。','又有四县照册互通汛报，下游渡口收到急汛时会回执，失递也查得到。',{wen:2,people:4}]}},
 qin:{
  road:{
   repair:[12,3,'请陇右驿卒标明枯井的季节，再添两处秋后可汲的水源。','陇右驿图已换版，秋后可汲的两口井另用朱笔标出。'],
   expand:[36,4,'把驿图续绘到陇山外三亭，雨路和旱路分画，留一份给商旅翻看。','陇山外三亭各收到了新图。驿卒把易落石的雨路用墨点标出。',{wen:3,people:2}]},
  home:{
   repair:[23,4,'先在落石处清沟、码好护坡石，等一场大雨验过，再恢复通车。','险段雨后复验完毕，护坡和排水沟都经住了。骡马绕行的木牌已经拆下。'],
   expand:[56,6,'把按季巡检推广到四段驿道，请驿丞用同式工料簿报修，并留下雨季绕路图。','四段驿道添了巡检簿和雨路图，入汛前已据簿抢修了一处缺口。',{people:5}]}},
 desert:{
  road:{
   repair:[18,3,'请药商带常用砝码来，药材另立小秤，逐项核过再补回双文簿。','药材小秤已经校准，撤下的一页按新秤重编，关口和铺户各执一册。'],
   expand:[45,5,'把双文簿送到邻近两处边市，请当地商人补齐各自常用的度量，再一同颁用。','两处新边市已经用上双文簿，盐、布和药材各列一页，买卖双方可共同查验。',{people:4,prestige:2}]},
  home:{
   repair:[22,4,'依枯水实测重分下游的水额，把夜汲与白昼分记，由上下游各派一人验册。','下游诸户定下枯水轮次，新册已经试转两轮，上下游都派人签认。'],
   expand:[62,6,'请两村的管渠人教邻近三村量渠分水，各村按自家水量立册。','邻近三村各定了轮灌册，第一轮春灌已有水到末梢的田里。',{people:6}]}},
 scriptures:{
  road:{
   repair:[25,3,'请熟悉疏勒语的行商来荐通译，让新来的通译与原来的两人交叉校读。','礼部另请到三位通译。同一页异文已有两人分别译注，可供经卷入京时比勘。'],
   expand:[65,5,'把试译的通译名册和并读法交礼部，在两处边市常设试译，兼收别国文牒和舆图。','两处边市设了试译案。新收的西域文牒和舆图已有首批译注送到京中。',{wen:5,prestige:2}]},
  home:{
   repair:[35,4,'把有歧义的译词逐条并录，另请熟悉原文的通译复核。经卷先试抄两份，历法另请钦天监验算。','续拨后，两卷疑义已由通译逐条复核，异译随正文一并刊记。钦天监也完成了历法试算。'],
   expand:[135,8,'请译经院设旁译之席，续译诸国的医书、历书和舆地图志。每种书先校一卷，再送书院与钦天监试用。','译经院交来了旁译首批书目。一部西域医书和一卷异国舆地图志已给书院留抄本，另有两种历书交钦天监对校。',{wen:8,people:3,prestige:4}]}},
 east:{
  road:{
   repair:[19,3,'把潮表和船期分开。船期另列候风、可发两栏，请舵手验明风势才移牌。','明州两处码头已换新榜。靠港的客商凭发船牌候船，候风的日子另写在一栏。'],
   expand:[58,5,'请邻近三港各抄一式候风榜，按本港水情核各自的潮时，每旬互通改期。','三处新港开始互通风候和船次。赶不上明州船期的客商可改从邻港搭船。',{wen:2,people:5}]},
  home:{
   repair:[45,4,'请工匠拆查第二艘船渗水处，换密缝料，先在静水验缝，再按原航线满载复试。两船的验船簿一并留作讲习。','第二艘海船重新密缝，先后通过静水与满载试航。修前修后的验船簿都交了讲习所，水师也补完了远航一课。'],
   expand:[155,8,'请工部按验收图样增造三艘海船，分批下水。后两艘有前一艘的试航记录才许交付，并让两港各设一处航海讲习。','三艘新造海船已经分批通过试航，交水师轮用。明州和登州两处讲习所开始用新编的验船簿教船工与舵手。',{wu:9,wen:2,prestige:4}]}},
 island:{home:{
  repair:[13,2,'把夜船交给各班船主轮填，次日一早由港吏重核，再抄入总簿。','夜船也有了轮记，新簿已连续记齐半月来船。'],
  expand:[40,4,'把风候簿推广到邻近两个海口，让船主携副页互相核对避风处。','两港已开始记风候和泊位，船主可以带着对照的副页出港。',{wu:4,people:2}]}}
};
const royalItinerary=r=>ROYAL_TRAVEL_ITINERARIES[r.itinerary];
const royalTravelDuration=months=>months===6?'半年':months===24?'两年':months%12===0?`${cnNum(months/12)}年`:`${cnNum(months)}个月`;
function royalTravelPlace(k){
 const r=k.royalTravel;
 return royalItinerary(r)?.stops[r.stop]?.[1]??ROYAL_TRAVEL_ROUTES[r.route][r.stop].place;
}
function royalTravelCanLeave(k){
 return immortalCanLeave(k)&&!k.lost&&!k.betrothal&&!['noticed','invited'].includes(k.immortal?.stage);
}
function royalTravelMotherFeeling(c,k,kind){
 if(kind==='departure'){
  if(isSolitary(c))return `她亲手把回信的地址抄给${k.name}，只说：“路上若有趣事，也写给我。”送行时却一直站到车马看不见。`;
  if(['将门','持重','审慎'].includes(c.trait))return '她先核对沿途驿站和随行的人，临别才低声嘱咐，改道了一定要写信。';
  if(['才女','好学'].includes(c.trait))return '她送了孩子一本空白手记，想听孩子亲眼见到的山河，也盼每到一地都能报个平安。';
  return '她替孩子查了两遍行囊，还塞进一包路上爱吃的点心。她舍不得，却也想听孩子说说宫墙外是什么模样。';
 }
 if(kind==='letter')return '她先找信里报平安的那一行，才从头慢慢读沿途见闻。读罢把来信仔细收好，等着提笔回信。';
 if(kind==='danger'){
  if(['将门','持重','审慎'].includes(c.trait))return '她看完报平安的几句，立刻铺开驿图核对险处，回信只嘱沿路从容些，勿为赶路冒险。待人散了，她才觉手心全是汗。';
  if(isSolitary(c))return '她把报平安的那一页看了许多遍。夜里灯还亮着，想提笔问细些，又怕孩子见了这封信反而担心她。';
  return '读到路上遇险，她的心一下悬了起来。明知孩子在信末说了平安，还是反复看那两行字，直到灯下才定下心来回信。';
 }
 if(kind==='return')return `她先问${k.name}路上吃得好不好。听孩子说起沿途人情，她又添了半盏茶，愿听这一路慢慢讲完。`;
 return '她记下孩子下一程的去处，托人把回信和用得着的衣物一并送去。';
}
function recordRoyalTravel(k,title,text,kind){
 recordRoyalJourney(k,k.royalTravel,title,text,kind,{reaction:royalTravelMotherFeeling,location:royalTravelAway(k)?royalTravelPlace(k):childWhereabouts(k),
  memoryType:'royal-travel',departureReason:`${k.name}离宫游历`});
}
function royalTravelTick(){
 if(!royalTravelActive()||S.over||S.flags.royalTravelChecked===S.turn)return;
 const current=journalContentVersion()>=46;
 if(!current&&mourningActive())return;
 S.flags.royalTravelChecked=S.turn;
 if(current){
  const relatives=royalHouseholds();
  for(const k of relatives)advanceRoyalTravel(k);
  if(journalContentVersion()>=47)for(const k of [...relatives,...royalTravelAcceded()])advanceRoyalTravelProjects(k);
 }
 if(mourningActive())return;
 if(S.turn-(S.flags.lastRoyalTravelRequest??-99)<18||S.children.some(k=>k.royalTravel?.stage==='request'&&royalTravelCanLeave(k)))return;
 const candidates=S.children.filter(k=>!k.royalTravel&&royalTravelCanLeave(k));
 if(!candidates.length||!chance(.02))return;
 const k=pick(candidates);
 k.royalTravel=current?{stage:'request',itinerary:pickW(Object.entries(ROYAL_TRAVEL_ITINERARIES).map(([id,r])=>({id,w:r.w}))).id,due:S.turn,history:[]}:
  {stage:'request',route:ri(0,ROYAL_TRAVEL_ROUTES.length-1),due:S.turn,history:[]};
 S.flags.lastRoyalTravelRequest=S.turn;
}
function royalTravelVoice(k){
 if(!royalTravelAway(k))return null;
 const r=k.royalTravel,stop=royalItinerary(r)?.stops[r.stop];
 const {place,sight}=stop?{place:stop[1],sight:stop[2]}:ROYAL_TRAVEL_ROUTES[r.route][r.stop];
 const address=S.children.includes(k)?'父皇':'陛下';
 return voiceLine('travel-letter',`从${place}送来的信，背面还夹着一小幅沿途画的舆图。`,
  `${address}，我在${place}一切平安。${sight}${royalTravelMothers(k).length?'也请转告母亲，按说好的日子，我还会再写信来。':''}`);
}
function receiveRoyalTravelLetter(k,danger=''){
 k.royalTravel.lastLetter=S.turn;
 const text=royalTravelVoice(k).lines.join('')+danger;
 recordRoyalTravel(k,'旅途家书',`收到${k.name}从${royalTravelPlace(k)}寄来的家书。${text}`,danger?'danger':'letter');
 if(danger){
  for(const c of royalTravelMothers(k))if(S.consorts.includes(c)){const worry=reconcileMotherConcern(c);if(worry)worry.value=clamp(worry.value+12);}
 }else comfortJourneyMothers(k);
 return text;
}
function returnRoyalTraveler(k){
 const r=k.royalTravel;
 r.stage='returned';r.returnPlace=S.children.includes(k)?null:'京中宗亲居所';delete r.due;
 const text=`${k.name}结束游历，平安回到${childWhereabouts(k)}，带回沿途写成的手记。`;
 recordRoyalTravel(k,'游历归来',text,'return');
 if(journalContentVersion()>=46){
  r.returnNotice=text;
  if(royalItinerary(r)?.home){
   (r.proposals||={}).home={received:S.turn};
   noteRoyalTravelProposal(k,'home');
  }
 }
 return text;
}
function royalTravelReturnAt(r){return r.returnAt??(r.extended?r.due:r.departed+12);}
function advanceRoyalTravel(k){
 if(!k.alive||!royalTravelAway(k))return;
 const r=k.royalTravel,route=royalItinerary(r);
 if(S.turn>=royalTravelReturnAt(r)){returnRoyalTraveler(k);return;}
 if(!route)return;
 while(r.nextStop<route.stops.length&&S.turn>=r.departed+route.stops[r.nextStop][0]){
  r.stop=r.nextStop++;
  const danger=route.stops[r.stop][3];
  receiveRoyalTravelLetter(k,danger&&chance(.3)?danger:'');
  if(r.stop===1&&route.road){
   (r.proposals||={}).road={received:S.turn};
   noteRoyalTravelProposal(k,'road');
  }
 }
}
function applyRoyalTravelEffects({wen=0,wu=0,...courtEffects}){
 E().wen=clamp(E().wen+wen);E().wu=clamp(E().wu+wu);
 return fx(chg(courtEffects),wen&&`文才+${wen}`,wu&&`武略+${wu}`);
}
function royalTravelProjectRole(k){
 if(!k.alive||k.jailed||k.removedFromRoyal||k.lost||immortalAway(k)||k.templeStay||k.princessMarriage==='frontier')return null;
 return royalTravelAway(k)||k.away?'letter':'onsite';
}
function royalTravelAcceded(){
 return [E(),...(S.previousCourts||[]).map(c=>c.emperor)].map(e=>e.travelProposer).filter(Boolean);
}
function keepAccededTravelProjects(k){
 if(!royalTravelActive())return;
 const current=journalContentVersion()>=48;
 const open=Object.values(k.royalTravel?.proposals||{}).some(({decision,project})=>decision==='adopted'&&
  (!project?.read||current&&!project.repair?.declined&&!project.expand?.declined&&!project.expand?.read));
 if(open)E().travelProposer=k;
}
const royalTravelFollowupLabel=kind=>kind==='repair'?'改进':'推广';
function recordRoyalTravelProject(k,title,text){
 kstory(k,`【${title}】${text}`);
 log(`【${title}】${text}`,1);
}
function advanceRoyalTravelFollowup(k,key,project){
 const kind=project.expand?'expand':'repair';
 const followup=project[kind];
 if(!followup||followup.declined||followup.report||S.turn<followup.due)return;
 const r=k.royalTravel;
 const [name,,,trialEffects]=royalItinerary(r)[key];
 const [,,,result,expansionEffects]=ROYAL_TRAVEL_FOLLOWUPS[r.itinerary][key][kind];
 const text=`「${name}」${royalTravelFollowupLabel(kind)}完成。${result}`;
 const access=travelInstitutionsActive()&&kind==='expand'&&key==='home'?
  ({east:'可到六部的「水师船册」派遣海船。',scriptures:'译本可到文渊阁的「译经院新藏」翻阅。'})[r.itinerary]:'';
 const gains=kind==='expand'?expansionEffects:project.legacy?{}:
  Object.fromEntries(Object.entries(trialEffects).map(([stat,amount])=>[stat,Math.ceil(amount/2)]));
 followup.report=text+(access?'\n'+access:'')+(Object.values(gains).some(Boolean)?applyRoyalTravelEffects(gains):'');
 recordRoyalTravelProject(k,`游历${royalTravelFollowupLabel(kind)}回报`,text);
 recordRoyalTravelKin(k,name,result,true);
}
function advanceRoyalTravelProjects(k){
 const r=k.royalTravel,route=r&&royalItinerary(r);
 if(!route)return;
 for(const [key,proposal] of Object.entries(r.proposals||{})){
  if(proposal.decision!=='adopted')continue;
  const [name,,,effects,[months,work,finished,partial]]=route[key];
  // Earlier saves already received the bonuses when the money was allocated.
  const project=proposal.project||={due:proposal.decided+months,legacy:true};
  if(project.report){
   if(journalContentVersion()>=48)advanceRoyalTravelFollowup(k,key,project);
   continue;
  }
  if(S.turn<project.due)continue;
  const role=project.participate&&royalTravelProjectRole(k);
  const complete=chance(role ? .85 : .7);
  const contribution=role==='letter'?`${k.name}从外地寄回手稿协助试办，请承办官员${work}。`:
   role==='onsite'?`${k.name}亲自参与试办，${work}。`:
   project.participate?`承办官员依照${k.name}留下的手记接着经办。`:
   `承办官员按${k.name}的原议呈上簿册。`;
  const text=`「${name}」试办期满。${complete?finished:partial}\n${contribution}`;
  const gains=complete?effects:Object.fromEntries(Object.entries(effects).map(([stat,amount])=>[stat,Math.floor(amount/2)]));
  if(journalContentVersion()>=48)project.outcome=complete?'complete':'partial';
  project.report=text;
  if(!project.legacy&&Object.values(gains).some(Boolean))project.report+=applyRoyalTravelEffects(gains);
  recordRoyalTravelProject(k,'游历奏议回报',text.replace('\n',''));
 }
}
function royalTravelFollowupEvent(k,key,project){
 if(!project?.report)return null;
 const r=k.royalTravel,[name,,,,trial]=royalItinerary(r)[key];
 // Version 47 stored the written result. Preserve the outcome already shown in those saves.
 const outcome=project.outcome??(project.report.includes(trial[2])?'complete':project.report.includes(trial[3])?'partial':null);
 const next=project.expand||project.repair?.declined?null:project.repair?
  (project.repair.report?'expand':null):({complete:'expand',partial:'repair'})[outcome];
 const reportKind=['expand','repair'].find(kind=>project[kind]?.report&&!project[kind].read);
 const report=reportKind?project[reportKind]:!project.read?project:null;
 if(!next&&!report)return null;
 const title=reportKind?`游历${royalTravelFollowupLabel(reportKind)}回报`:(report?'游历奏议回报':'游历奏议续议');
 const valid=()=>!S.over&&k.royalTravel===r&&(next?!project[next]:!report.read);
 const event={title:`${title} · ${k.name}`,por:k,valid,travelProjectReport:true,
  text:report?.report??`翻阅「${name}」的试办旧档。\n${outcome==='complete'?trial[2]:trial[3]}`,choices:[]};
 if(!next){
  event.choices.push({t:'阅毕，归入奏议档',f:()=>{if(valid())report.read=true;return null;}});
  return event;
 }
 const [cost,months,plan]=ROYAL_TRAVEL_FOLLOWUPS[r.itinerary][key][next];
 const label=royalTravelFollowupLabel(next),role=royalTravelProjectRole(k);
 const introduce=role==='letter'?`${k.name}在来信里提议`:role==='onsite'?`${k.name}翻着簿册提议`:`承办官员依${k.name}留下的手记拟议`;
 const settle=approve=>{
  if(!valid()||approve&&E().treasury<cost)return null;
  if(report)report.read=true;
  project[next]=approve?{due:S.turn+months}:{declined:true};
  const text=approve?`${introduce}：“${plan}”陛下拨银${label}「${name}」，${royalTravelDuration(months)}后回报。`:
   `陛下暂不${label}「${name}」，已办成的部分照旧施行，后续方案归档。`;
  recordRoyalTravelProject(k,`游历${label}议`,!approve&&travelInstitutionsActive()?`${introduce}：“${plan}”${text}`:text);
  recordRoyalTravelKin(k,`${name}·${label}`,plan);
  const result=text+(approve?fx(chg({treasury:-cost})):'');
  save('auto');return result;
 };
 const planText=`${introduce}：“${plan}”`;
 // Keep the proposal with the report's narrative, before the effect summary.
 const summary=event.text.indexOf('\n§');
 event.text=summary<0?`${event.text}\n${planText}`:`${event.text.slice(0,summary)}\n${planText}${event.text.slice(summary)}`;
 event.choices.push({t:`准奏，拨银${label} · 国库−${cost}`,preview:`${royalTravelDuration(months)}后回报`,
  cond:()=>E().treasury>=cost,why:'国库不足',f:()=>settle(true)},
 {t:'维持现状，后续归档',f:()=>settle(false)});
 return event;
}
function royalTravelProjectReport(k){
 const r=k.royalTravel;
 if(journalContentVersion()>=48){
  for(const [key,p] of Object.entries(r?.proposals||{})){
   const event=royalTravelFollowupEvent(k,key,p.project);if(event)return event;
  }
  return null;
 }
 const project=Object.values(r?.proposals||{}).map(p=>p.project).find(p=>p?.report&&!p.read);
 if(!project)return null;
 const valid=()=>!S.over&&k.royalTravel===r&&!project.read;
 return {title:`游历奏议回报 · ${k.name}`,por:k,valid,text:project.report,choices:[
  {t:'阅毕，归入奏议档',f:()=>{if(valid())project.read=true;return null;}}]};
}
function royalTravelProposalEvent(k){
 const r=k.royalTravel,source=royalItinerary(r);
 const key=['home','road'].find(key=>r.proposals?.[key]&&!r.proposals[key].decision);
 const proposal=r.proposals?.[key],notice=r.returnNotice;
 if(!proposal&&!notice)return null;
 const valid=()=>!S.over&&k.alive&&k.royalTravel===r&&(proposal?!proposal.decision:r.returnNotice===notice);
 const title=notice?'游历归来 · '+k.name:'旅途奏议 · '+k.name;
 if(!proposal)return {title,por:k,valid,text:notice,choices:[{t:'听孩子说说一路见闻',f:()=>{if(valid())delete r.returnNotice;return null;}}]};
 const [name,details,cost,effects,[months]]=source[key];
 const current=journalContentVersion()>=47,role=royalTravelProjectRole(k);
 const stats={wen:'文才',wu:'武略',people:'民心',prestige:'威望'};
 const preview=Object.entries(effects).map(([stat,amount])=>`${stats[stat]}+${amount}`).join(' · ');
 const settle=(adopt,participate=false)=>{
  if(!valid()||adopt&&E().treasury<cost)return null;
  noteRoyalTravelProposal(k,key);
  proposal.decision=adopt?'adopted':'declined';proposal.decided=S.turn;
  if(notice)delete r.returnNotice;
  const sourceText=key==='road'?'游历途中来信':'游历归来后奏请';
  let text=`${k.name}${sourceText}，提出「${name}」。${adopt?'陛下准议，拨银试办。':'陛下将这份建议留档，暂缓施行。'}`;
  if(adopt&&current){
   proposal.project={due:S.turn+months,participate};
   const assignment=participate?(role==='letter'?`请${k.name}沿途以书信协助。`:`请${k.name}亲自参与。`):'交承办官员经手。';
   text+=`${assignment}${royalTravelDuration(months)}后回报试办情形。`;
  }
  kstory(k,`【游历奏议】${text}`);log(text,1);
  let result=text;
  if(adopt)result+=current?fx(chg({treasury:-cost})):applyRoyalTravelEffects({treasury:-cost,...effects});
  save('auto');return result;
 };
 const opening=notice||(key==='road'?`${k.name}在旅途中随家书附了一纸手稿。`:`${k.name}把沿途的手记翻到夹着纸笺的一页。`);
 const adoptChoice=(label,participate=false)=>({t:`${label} · 国库−${cost}`,
  preview:current?`${royalTravelDuration(months)}后听取试办回报`:preview,cond:()=>E().treasury>=cost,why:'国库不足',f:()=>settle(true,participate)});
 return {title,por:k,valid,text:`${opening}\n「${name}」\n${details}`,choices:[
  ...(current&&role?[adoptChoice(role==='letter'?'采纳，请孩子以书信协助':'采纳，请孩子参与试办',true)]:[]),
  adoptChoice(current?'采纳，交承办官员试办':'采纳，拨银试办'),
  {t:'把建议留档，暂不施行',f:()=>settle(false)}]};
}
function royalTravelEvent(k){
 const r=k?.royalTravel;
 if(!royalTravelActive()||S.over||mourningActive()||!r)return null;
 const report=journalContentVersion()>=47&&royalTravelProjectReport(k);
 if(report)return report;
 if(!k.alive||k.lost||k.jailed||k.removedFromRoyal)return null;
 const current=journalContentVersion()>=46,requesting=r.stage==='request',firstStop=r.stop===0,route=royalItinerary(r);
 if(current&&!requesting){
  const news=royalTravelProposalEvent(k);
  if(news||route||!firstStop)return news;
 }
 if(!(S.turn>=r.due))return null;
 let resolved=false;
 const valid=()=>!resolved&&k.royalTravel===r&&!S.over&&!mourningActive()&&k.alive&&!k.lost&&!k.jailed&&!k.removedFromRoyal&&S.turn>=r.due&&
  (requesting?r.stage==='request'&&royalTravelCanLeave(k):royalTravelAway(k)&&firstStop===(r.stop===0));
 const finish=f=>()=>{if(!valid())return null;resolved=true;const result=f();save('auto');return result;};
 if(requesting&&valid())return {title:'皇嗣请行 · 游历山河',por:k,valid,
  text:`${kidName(k)}带着一张自己标过的舆图来见你：“父皇，我想出去看看。书里说江河有汛、山路难行，可我还没见过那些靠着河和山过日子的人。”\n${route?`拟走「${route.name}」，经${route.stops.map(stop=>stop[1]).join('、')}，约定${royalTravelDuration(route.months)}后归来，沿途会寄家书。`:`第一程拟往${ROYAL_TRAVEL_ROUTES[r.route][0].place}，约一年归来，沿途会托驿站寄信。`}`,choices:[
   {t:'准其启程，置办行装 · 国库−20',cond:()=>E().treasury>=20,why:'国库不足',f:()=>{
    if(E().treasury<20)return null;
    return finish(()=>{chg({treasury:-20});Object.assign(r,{stage:'traveling',stop:0,departed:S.turn,due:S.turn+6,lastLetter:-99});
     if(route){r.returnAt=S.turn+route.months;r.nextStop=0;delete r.due;}
     delete k.initiative;k.tutor=false;
     const text=`${k.name}辞别亲人，带着行囊和驿路图启程，先往${royalTravelPlace(k)}。${route?`约定${royalTravelDuration(route.months)}后归来。`:''}`;
     recordRoyalTravel(k,'离宫游历',text,'departure');return text;})();
   }},
   {t:'先备好行程，半年后再议',f:finish(()=>{r.due=S.turn+6;return '行期暂缓，孩子暂留京中。';})},
   {t:'这趟先作罢',f:finish(()=>{r.stage='closed';delete r.due;kstory(k,'此次请行未获准，先把自己标过的舆图收好。');return '孩子暂留京中。';})}]};
 if(!royalTravelAway(k)||!valid())return null;
 if(firstStop)return {title:'旅途家书 · 半年见闻',por:k,valid,text:royalTravelVoice(k).lines.join(''),choices:[
  {t:'回信，请把山川和驿路记下来',f:finish(()=>{receiveRoyalTravelLetter(k);k.lit=clamp(k.lit+3);r.stop=1;r.due=r.departed+12;return `回信已送出，${k.name}接下来往${royalTravelPlace(k)}。`;})},
  {t:'回信，请多听听百姓的日子',f:finish(()=>{receiveRoyalTravelLetter(k);k.vir=clamp(k.vir+3);r.stop=1;r.due=r.departed+12;return `回信已送出，${k.name}接下来往${royalTravelPlace(k)}。`;})}]};
 return {title:'游历归期 · '+k.name,por:k,valid,text:`${k.name}从${royalTravelPlace(k)}来信，说行囊里已多了好几册手记。${r.extended?'展期已满，车马也已备好。':'原定归期已到，若宫中愿意，也想再留半年走完附近的乡镇。'}`,choices:[
  {t:'按约归来，听孩子说说一路见闻',f:finish(()=>{receiveRoyalTravelLetter(k);return returnRoyalTraveler(k);})},
  ...(!r.extended?[{t:'准再游历半年',f:finish(()=>{receiveRoyalTravelLetter(k);r.extended=true;r.due=S.turn+6;return '回信准许展期半年，沿途仍按约寄信。';})}]:[])]};
}
function pendingRoyalTravelEvent(){
 if(!royalTravelActive())return null;
 const relatives=royalHouseholds();
 if(journalContentVersion()>=47&&!S.over&&!mourningActive()){
  for(const k of [...relatives,...royalTravelAcceded()]){
   const event=royalTravelProjectReport(k);if(event)return event;
  }
 }
 for(const k of relatives){
  const event=royalTravelEvent(k);if(event)return event;
 }
 return null;
}
function royalTravelPanel(k){
 if(!royalTravelActive()||!k.royalTravel)return '';
 const r=k.royalTravel,away=royalTravelAway(k),event=royalTravelEvent(k);
 const remaining=away&&journalContentVersion()>=46?Math.max(0,royalTravelReturnAt(r)-S.turn):null;
 const text=away?`正在${royalTravelPlace(k)}游历。${remaining===null?'':remaining?`距约定归期还有${royalTravelDuration(remaining)}。`:'今日归期已到。'}`:({request:'等候商议游历行程。',returned:'游历已毕，带回了沿途手记。',closed:'这次没有启程。'})[r.stage];
 const projects=Object.entries(r.proposals||{}).flatMap(([key,{project}])=>{
  if(!project)return [];
  const [kind,phase]=project.expand?['推广',project.expand]:project.repair?['改进',project.repair]:['试办',project];
  if(phase.declined)return [];
  if(phase.report&&kind==='试办')return [];
  const progress=phase.report?`已完成${kind}。`:`正在${kind}，${royalTravelDuration(Math.max(1,phase.due-S.turn))}后回报。`;
  return `<p class="hint">「${esc(royalItinerary(r)[key][0])}」${esc(progress)}</p>`;
 }).join('');
 return `<section class="personal-experience"><h3>山河行记</h3><p>${esc(text)}</p>${projects}<div class="acts">
 ${event?`<button class="btn jade" onclick="A.royalTravelTalk(${k.id})">${event.title.startsWith('游历奏议回报')?'看试办回报':event.travelProjectReport?'看回报与续议':r.stage==='returned'?'听归来奏议':away?'看旅途消息':'商议游历'}</button>`:''}
 ${away?`<button class="btn" onclick="A.royalTravelLetter(${k.id})" ${S.turn-r.lastLetter<6?'disabled':''}>寄家书 · 精力−1</button><button class="btn quiet" onclick="A.royalTravelRecall(${k.id})">商议提前归来</button>`:''}</div>
 ${r.history.slice(-2).reverse().map(e=>`<p class="hint">${esc(e.d)} · ${esc(e.title)}<br>${esc(e.text)}</p>`).join('')}</section>`;
}
A.royalTravelTalk=function(id){if(!modalOpen)pushEv(royalTravelEvent(royalById(id)));};
A.royalTravelLetter=function(id){
 const k=royalById(id);
 if(modalOpen||S.over||!k?.alive||!royalTravelAway(k)||k.jailed||k.removedFromRoyal||S.turn-k.royalTravel.lastLetter<6||!useE())return;
 k.love=clamp(k.love+4);
 pushEv({title:'旅途家书',por:k,text:receiveRoyalTravelLetter(k),choices:[ok1]});save('auto');
};
A.royalTravelRecall=function(id){
 const k=royalById(id),valid=()=>!S.over&&k?.alive&&royalTravelAway(k)&&!k.jailed&&!k.removedFromRoyal;
 if(modalOpen||!valid())return;
 pushEv({title:'商议游历归期',por:k,valid,text:`${k.name}尚在${royalTravelPlace(k)}。可写信请孩子结束这一程，或依原约继续游历。`,choices:[
  {t:'修书商定提前归来',f:()=>{if(!valid())return null;const text=returnRoyalTraveler(k);save('auto');return text;}},{t:'照原来的安排'}]});
};
