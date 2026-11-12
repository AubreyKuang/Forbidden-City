/* ============ 妃嫔主线 ============ */
function aNext(c,st,a,b){c.arc.st=st;c.arc.t=S.turn+ri(a,b)}
function aEnd(c,title,text){c.arc.done=true;c.arc.end=title;c.arc.t=1e9;if(ARCX[title])setXin(c,ARCX[title],`「${ARCS[c.arc.id].name}」${title}`,ARCX[title]==='怨恨'?'emp':null);story(c,`【${ARCS[c.arc.id].name}·${title}】${text}`);log(`${fullName(c)}「${ARCS[c.arc.id].name}」——${title}。`,1)}
const ok1={t:'好'};
const ARCS={
 general:{name:'边关烽火',fit:c=>c.trait==='将门',stages:[
  (c,f)=>c.aff<25?null:{text:`${cName(c)}收到一封家书，读完后脸色有些发白。\n“家父在北境屡立战功，麾下十万儿郎只认帅旗、不认虎符……臣妾怕，怕有人在陛下面前说三道四。”`,choices:[
    {t:'“朕信得过将军。”',f:()=>{f.trust=1;aNext(c,1,3,5);story(c,'为父亲的兵权忧心，陛下说信得过将军。');return fx(cchg(c,{aff:8,mood:10}))}},
    {t:'“兵权过重，终非长久之计。”',f:()=>{aNext(c,1,3,5);story(c,'为父亲的兵权忧心，陛下却说兵权过重。她一夜未眠。');return fx(cchg(c,{aff:-3,mood:-8}))}},
    {t:'让她修书，劝父亲上表交权',f:()=>{f.letter=1;aNext(c,1,3,5);story(c,'奉陛下之意，修书劝父亲交出兵权。');return `她咬着唇，提笔写了很久。${fx(cchg(c,{aff:3}))}`}}]},
  (c,f)=>{if(f.letter&&chance(.6))return {text:`北境送来一道奏表：${cName(c)}之父自陈年迈，愿交出半数兵权，只求留在边关终老。`,choices:[
      {t:'准其所请，加封一等公',f:()=>{aEnd(c,'将相和','父亲自请交权，受封一等公。她在宫中再无后顾之忧。');return fx(chg({prestige:5,treasury:-40}),cchg(c,{aff:20,mood:20}))}},
      {t:'准其交权，不必封赏',f:()=>{aEnd(c,'解甲','父亲交出兵权，朝廷却未有封赏。她什么也没说。');return fx(chg({prestige:3}),cchg(c,{aff:-5}))}}]};
    return {text:`兵部密报：${cName(c)}之父私扩军饷，还与北狄互市，边关只知有将军、不知有朝廷。${f.trust?'\n你想起曾对她说过“信得过将军”。':''}`,choices:[
      {t:'召将军回京述职',f:()=>{f.act='recall';aNext(c,2,1,3);return '圣旨已经出京。'}},
      {t:'派监军暗中查访',f:()=>{f.act='spy';aNext(c,2,2,4);return '一位不起眼的户部主事随粮草北上了。'}},
      {t:'压下密报，不予理会',f:()=>{f.act='ignore';aNext(c,2,3,6);return '你把密报锁进了匣子。'}}]}},
  (c,f)=>{if(f.act==='recall')return {text:`将军接旨后迟迟不动身，只上折称旧伤复发。朝中议论纷纷：将军这是不敢回京。\n${cName(c)}跪在乾清宫外，求你再给父亲一次机会。`,choices:[
      {t:'亲赴居庸关相迎，以示信任',f:()=>{if(chance(.45+c.aff/250+E().prestige/400)){aEnd(c,'君臣相得','陛下亲赴关外相迎，将军当场交出兵符，痛哭流涕。');return fx(chg({prestige:8,people:3}),cchg(c,{aff:25,mood:20}))}aNext(c,3,0,1);return '将军没有来。来的是一封战书。'}},
      {t:'下旨削爵，夺其兵权',f:()=>{aEnd(c,'削爵','父亲被夺去兵权、削去爵位，回京后郁郁而终。');return fx(chg({prestige:4}),cchg(c,{mood:-40,aff:-25}))}}]};
    if(f.act==='spy'){if(chance(.55))return {text:'监军回报：将军扩饷，是因朝廷拖欠边军粮饷已有两年；与北狄互市，换的是过冬的棉衣。将军是清白的。',choices:[
        {t:'补发欠饷，嘉奖将军',f:()=>{aEnd(c,'清白','监军查明父亲清白，陛下补发边军欠饷。她跪谢天恩。');return fx(chg({treasury:-120,prestige:4}),cchg(c,{aff:18,mood:15}))}}]};
      return {text:'监军回报：将军确有不臣之心，已暗中联络北狄，约定秋后起事。',choices:[{t:'先下手为强，调兵北上',f:()=>{aNext(c,3,0,0);return '大军北上。'}}]}}
    if(chance(.5)){aEnd(c,'相安','此后数年，北境平静无事，父亲再未让她忧心。');return {text:'北境这几年出奇地安静。',choices:[ok1]}}
    return {text:`北境急报：${cName(c)}之父以“清君侧”为名起兵南下！`,choices:[{t:'调兵平叛',f:()=>{aNext(c,3,0,0);return fx(chg({prestige:-6,people:-4}))}}]}},
  (c,f)=>({text:`叛军已至宣府。${cName(c)}脱簪跪在雪地里：“家父罪该万死。臣妾愿替父受死，只求陛下饶过我母亲和幼弟。”`,choices:[
    {t:'让她修书劝降',cond:()=>c.aff>=55,why:'情分不足（需55）',f:()=>{aEnd(c,'大义','她写了一封血书。三日后，父亲单骑入营请罪，叛乱不战而平。');c.mood=clamp(c.mood-20);return fx(chg({prestige:8,people:4}),cchg(c,{aff:15}))}},
    {t:'平叛，只罪其父，不株连她',f:()=>{aEnd(c,'孤女','叛乱平定，父亲伏诛。她保住了位分，却再也没有笑过。');return fx(chg({prestige:4,treasury:-200}),cchg(c,{mood:-50,aff:5}))}},
    {t:'平叛，将她废入冷宫',f:()=>{c.cold=true;c.palace='冷宫';aEnd(c,'连坐','叛乱平定，她以罪臣之女的身份被打入冷宫。');return fx(chg({prestige:5,treasury:-200}),cchg(c,{mood:-60,aff:-30}))}}]})]},
 scholar:{name:'故人诗',fit:c=>c.trait==='才女',stages:[
  (c,f)=>c.aff<45?null:{text:`今科状元的殿试文章里，引了一句诗：“${f.poem=pick(POEMS)}”\n你记得，这句诗曾写在${cName(c)}送你的花笺上。`,choices:[
    {t:'召她来问个明白',f:()=>{f.asked=1;aNext(c,1,4,7);story(c,'陛下问起她与新科状元的旧事。她坦白入宫前曾与他有过诗书往来。');return `她跪下，坦白入宫前曾与他在诗社相识，有过几回诗书往来。“发乎情，止乎礼，此后再无联系。”${fx(cchg(c,{aff:3}))}`}},
    {t:'不动声色',f:()=>{aNext(c,1,4,7);return '你把那篇文章放在了一边。'}}]},
  (c,f)=>({text:`琼林宴上，状元奉旨献诗。他念到一半，${cName(c)}失手打翻了酒盏，满座寂然。`,choices:[
    {t:'笑说“诗好，连娘娘都听醉了”',f:()=>{aNext(c,2,4,7);return fx(cchg(c,{aff:6}))}},
    {t:'冷眼看着',f:()=>{aNext(c,2,4,7);return fx(cchg(c,{mood:-10}))}},
    {t:'当晚召她侍寝',cond:()=>E().energy>0&&!c.preg,why:'精力不足',f:()=>{aNext(c,2,4,7);nightWith(c);return null}}]}),
  (c,f)=>({text:`宫门侍卫截下一封信，是状元托人带给${cName(c)}的。信上只有两个字：“珍重”。`,choices:[
    {t:'烧了信，什么也不说',f:()=>{c.talent=clamp(c.talent+5);aEnd(c,'知音','陛下烧了那封信，从未提起。后来她知道了，从此为陛下写的诗比从前多了许多。');return fx(cchg(c,{aff:22,mood:10}))}},
    {t:'召她对质',f:()=>{if(f.asked||c.aff>=60){aEnd(c,'此心已许','她看完信，当着陛下的面把它投进炭盆：“臣妾此生，只是陛下的人。”');return fx(cchg(c,{aff:15}))}aEnd(c,'心结','对质之后，两人之间多了一道看不见的墙。');return fx(cchg(c,{aff:-20,mood:-15}))}},
    {t:'将状元外放岭南',f:()=>{c.talent=clamp(c.talent-10);aEnd(c,'诗绝','状元被外放岭南。她从此搁笔，再没写过一首诗。');return fx(cchg(c,{mood:-25,aff:-10}),chg({people:-2}))}},
    {t:'成全他们，放她出宫',f:()=>{c.gone=true;aEnd(c,'成全','陛下下旨放她出宫。听说后来她与状元在江南开了一间书院。');return `她在殿前叩了三个头，泪流满面。${fx(chg({people:4,prestige:-3}))}`}}]})]},
 craft:{name:'宫中手艺',fit:c=>c.trait==='才女'||c.talent>=80,stages:[
  (c,f)=>{
    if(c.aff<35)return null;
    const craft=consortCraft(c);
    return {title:craft.title,text:`${cName(c)}${craft.begin}`,choices:[
      {t:craft.share,f:()=>{f.shared=true;aNext(c,1,4,6);return '她收好了东西，准备改日教给愿意学的人。';}},
      {t:'准她留着，照自己的心意做',f:()=>{aNext(c,1,4,6);return fx(cchg(c,{mood:8,aff:4}));}}
    ]};
  },
  (c,f)=>{
    const craft=consortCraft(c);
    const outcome=f.shared?craft.follow:craft.private;
    aEnd(c,f.shared?'传给旁人':'独自研习',outcome);
    return {title:craft.title,text:outcome+fx(cchg(c,{mood:10,aff:5})),choices:[ok1]};
  }
 ]},
 secret:{name:'旧案',fit:c=>c.fam.t==='宫女'||(c.fam.t==='寒门'&&c.scheme>=50),stages:[
  (c,f)=>c.aff<25?null:{text:`你半夜醒来，发现${cName(c)}不在身边。她披着外衣坐在灯下，正借着烛光偷看一卷发黄的旧档。`,choices:[
    {t:'装睡，看她做什么',f:()=>{f.watch=1;aNext(c,1,1,3);return '她看了很久，最后把那卷档案藏进了妆奁的夹层里。'}},
    {t:'开口问她',f:()=>{aNext(c,1,1,3);return `她吓了一跳，随即笑道：“臣妾睡不着，翻翻闲书罢了。”她在撒谎。${fx(cchg(c,{mood:-5}))}`}},
    {t:'命暗卫查她的底细',f:()=>{aNext(c,1,1,2);return '暗卫领命而去。'}}]},
  (c,f)=>({text:`暗卫回报：${fullName(c)}本不姓${c.sur}。她是十二年前“江南盐案”中被抄家问斩的户部侍郎之女，全家只逃出她一个。\n她入宫，是为了查当年的卷宗。`,choices:[
    {t:'当面问她',f:()=>{aNext(c,2,0,1);return '你去了她宫里。'}},
    {t:'先下手为强，将她拿下',f:()=>{c.cold=true;c.palace='冷宫';aEnd(c,'囚鸟','身世败露，以欺君之罪被打入冷宫。她始终没有说出入宫的目的。');return fx(cchg(c,{mood:-50,aff:-30}))}},
    {t:'佯装不知，看她下一步',f:()=>{f.wait=1;aNext(c,2,2,4);return '你决定再等等。'}}]}),
  (c,f)=>({text:`${f.wait?'她终于找到了当年的判词。那夜她':'她'}跪在你面前，额头抵着冰冷的地砖：\n“家父蒙冤而死，臣妾隐姓埋名入宫，只为替他翻案。可如今……臣妾对陛下，是真的动了心。”`,choices:[
    {t:'下旨重审江南盐案',f:()=>{aNext(c,3,2,3);return `她怔住了，泪如雨下。${fx(cchg(c,{aff:15}))}`}},
    {t:'“念你孝心，朕不追究。此事到此为止。”',f:()=>{aEnd(c,'尘封','陛下赦了她的欺君之罪，旧案却从此尘封。她心中感激，也有遗憾。');return fx(cchg(c,{aff:10,mood:-10}))}},
    {t:'“欺君之罪，不可饶恕。”',f:()=>{c.cold=true;c.palace='冷宫';aEnd(c,'冷月','她被打入冷宫，那卷旧档被当众烧毁。');return fx(cchg(c,{mood:-60,aff:-40}))}}]}),
  (c,f)=>({text:'大理寺重审盐案，结果令人心惊：当年主审此案、构陷侍郎的，正是如今权倾朝野的内阁首辅。',choices:[
    {t:'依法严办首辅',f:()=>{c.fam={t:'平反忠臣之后',p:45};harem().filter(x=>x.fam.t==='内阁首辅').forEach(x=>{cchg(x,{mood:-30,aff:-15});relAdd(x,c,-40)});aEnd(c,'昭雪','首辅下狱，父亲沉冤得雪。她在宫中设了灵位，第二天红着眼眶对陛下笑了。');return fx(chg({people:10,prestige:-4}),cchg(c,{aff:30,mood:25}))}},
    {t:'为她父亲平反，但不动首辅',f:()=>{c.fam={t:'平反忠臣之后',p:30};aEnd(c,'半昭雪','父亲得以平反，元凶却依旧位极人臣。她说，这样已经很好了。');return fx(chg({people:3}),cchg(c,{aff:10,mood:5}))}}]})]},
 ill:{name:'续命汤',fit:c=>c.trait==='体弱',stages:[
  (c,f)=>({text:`太医院院判私下禀报：${cName(c)}的病是胎里带来的心疾，以眼下的脉象，恐怕熬不过三年。`,choices:[
    {t:'遍寻天下名医（国库-50万两）',f:()=>{f.seek=1;aNext(c,1,2,4);return fx(chg({treasury:-50}))}},
    {t:'告诉她实情',f:()=>{f.tell=1;aNext(c,1,1,3);story(c,'得知自己的病情，她沉默良久，只说想再看一眼江南的春天。');return `她沉默了很久，最后笑了：“臣妾小时候在江南住过，想再看一次那里的春天。”${fx(cchg(c,{aff:8}))}`}},
    {t:'瞒着她',f:()=>{aNext(c,1,3,5);return '你嘱咐太医院，一个字也不许透露。'}}]}),
  (c,f)=>{if(f.seek)return {text:'一位云游郎中揭了皇榜，说有一方可治心疾，药引是昆仑山上的雪灵芝，十年一开。',choices:[
      {t:'派人去昆仑取药（国库-120万两）',f:()=>{f.herb=1;aNext(c,2,4,7);return fx(chg({treasury:-120}))}},
      {t:'恐是江湖骗子，作罢',f:()=>{aNext(c,2,6,10);return '你命人把郎中送出了城。'}}]};
    if(f.tell)return {text:`${cName(c)}靠在窗边，望着南方：“陛下，臣妾想去江南。”`,choices:[
      {t:'陪她南巡（国库-150万两，龙体-3）',f:()=>{f.trip=1;story(c,'陛下陪她南下。烟雨西湖，她靠在陛下肩头，说这是她这辈子最好的日子。');aNext(c,2,3,6);return fx(chg({treasury:-150,health:-3,people:3}),cchg(c,{aff:30,mood:40}))}},
      {t:'宫规森严，不能出京',f:()=>{aNext(c,2,4,8);return fx(cchg(c,{mood:-15}))}}]};
    aNext(c,2,4,8);return {text:`${cName(c)}从宫人的窃窃私语里知道了自己的病情。她没有哭闹，只是把你送她的东西一件件收进了箱子里。`,choices:[{t:'去看她',f:()=>fx(cchg(c,{mood:-10,aff:-5}))}]}},
  (c,f)=>{if(f.herb&&chance(.7)){c.trait='温婉';aEnd(c,'回春','雪灵芝入药，她的心疾竟慢慢好了。她开始学骑马，虽然总是摔下来。');return {text:'昆仑雪灵芝送到了。三个月后，太医惊喜地禀报：她的脉象平稳了。',choices:[{t:'太好了',f:()=>fx(cchg(c,{aff:20,mood:30}))}]}}
    if(f.trip&&chance(.4)){aEnd(c,'江南春','从江南回来后，她的病竟一日好过一日。太医说，心病还须心药医。');return {text:'从江南回来后，她的气色一日好过一日。',choices:[{t:'太好了',f:()=>fx(cchg(c,{mood:20}))}]}}
    c.alive=false;aEnd(c,f.trip?'烟雨':'香消',f.trip?'她走在一个春天的清晨，枕边放着从西湖带回的一枝柳。':'一个雪夜，她安静地走了。');AU.sfx('sad');
    return {text:`${fullName(c)}薨了。${f.trip?'宫人说，她走之前一直在笑。':''}`,choices:[{t:'追封，厚葬',f:()=>{c.rank=Math.min(7,c.rank+1);return fx(chg({treasury:-30}))}},{t:'……'}]}}]},
 envoy:{name:'驼铃',fit:c=>c.fam.t==='西域贡女',stages:[
  (c,f)=>({text:`西域使团再次入京。使臣请求私下拜见${cName(c)}，说是带来了她母亲的口信。`,choices:[
    {t:'准',f:()=>{f.v='allow';aNext(c,1,2,4);return '使臣在她宫里待了一个时辰。'}},
    {t:'准，但派人在屏风后听着',f:()=>{f.v='listen';aNext(c,1,0,1);return '你安排了一个懂西域话的小太监。'}},
    {t:'不准',f:()=>{f.v='deny';aNext(c,1,2,4);return fx(cchg(c,{mood:-12}))}}]}),
  (c,f)=>{if(f.v==='listen')return {text:'小太监回报：使臣要她打探京城九门布防，以她母亲的性命相要挟。她当场拒绝了，哭着说“陛下待我很好”。',choices:[
      {t:'出兵西域，救出她的母亲（国库-300万两）',f:()=>{aEnd(c,'驼铃归','王师西出阳关，接回了她的母亲。她说，从此这里就是她的家。');return fx(chg({treasury:-300,prestige:8}),cchg(c,{aff:40,mood:40}))}},
      {t:'驱逐使臣，厚赏她的忠贞',f:()=>{aEnd(c,'忠贞','她拒绝了母国的要挟。陛下厚赏了她，却救不回她的母亲。');return fx(chg({prestige:3}),cchg(c,{aff:15,mood:-15}))}}]};
    if(f.v==='allow')return {text:'兵部急报：九门布防图失窃。线索指向了西域使团，以及见过使臣的人。',choices:[
      {t:'审问她',f:()=>{aNext(c,2,0,1);return '她被带到了慎刑司。'}},
      {t:'不必审了，将她遣返西域',f:()=>{c.gone=true;aEnd(c,'遣返','她被遣返西域，临走时一直回头。');return fx(chg({prestige:-2}))}}]};
    aEnd(c,'思乡','她再也没见到母国来的人。每到月圆，她都会对着西边唱一支听不懂的歌。');return {text:`${cName(c)}郁郁寡欢了很久。`,choices:[{t:'……',f:()=>fx(cchg(c,{mood:-10}))}]}},
  (c,f)=>({text:'慎刑司审了三天。她承认布防图是她画的——使臣扣着她的母亲，她别无选择。\n“臣妾死不足惜，只求陛下……别杀我娘。”',choices:[
    {t:'饶恕她，出兵救其母（国库-300万两）',f:()=>{aEnd(c,'赎罪','陛下饶恕了她，还派兵救回了她的母亲。她从此死心塌地。');return fx(chg({treasury:-300,prestige:4}),cchg(c,{aff:45,mood:30}))}},
    {t:'打入冷宫',f:()=>{c.cold=true;c.palace='冷宫';aEnd(c,'沙尽','她被打入冷宫。听说她的母亲死在了那年冬天。');return fx(chg({prestige:3}),cchg(c,{mood:-60,aff:-30}))}}]})]},
 ambition:{name:'凤位',fit:c=>c.rank!==8&&(c.trait==='城府'||c.scheme>=78),stages:[
  (c,f)=>c.rank===8?(aEnd(c,'凤仪','她已登上后位，母仪天下。'),{text:`${cName(c)}如今已是中宫。`,choices:[ok1]}):c.rank<3?null:{text:`你注意到，内务府总管与坤宁宫的掌事姑姑近来常常出入${c.palace}。`,choices:[
    {t:'敲打她几句',f:()=>{f.w=1;c.scheme=clamp(c.scheme-8);aNext(c,1,4,8);return fx(cchg(c,{mood:-10}))}},
    {t:'静观其变',f:()=>{aNext(c,1,3,6);return '你什么也没说。'}},
    {t:'暗中扶持她',f:()=>{f.back=1;aNext(c,1,3,6);return '你让内务府给她宫里多拨了些人手。'}}]},
  (c,f)=>{const em=empress();if(c.rank===8){aEnd(c,'凤仪','她已登上后位。');return {text:`${cName(c)}如今已是中宫。`,choices:[ok1]}}
    if(!em)return {text:`${cName(c)}替你研墨，状似无意地说：“中宫之位空悬已久，六宫无主，终归不成体统。”`,choices:[
      {t:'“你想做皇后？”',f:()=>{aNext(c,2,0,1);return '她垂下眼睛，笑而不语。'}},
      {t:'装作没听懂',f:()=>{aEnd(c,'心冷','她再也没提过后位，只是看陛下的眼神冷了几分。');return fx(cchg(c,{aff:-10}))}}]};
    return {text:`坤宁宫传出消息：皇后夜夜惊梦，太医查出皇后常用的安神香里掺了曼陀罗。所有线索都指向一个早已投井的宫女。${f.back?'\n你想起自己曾暗中扶持过谁。':''}`,choices:[
      {t:'彻查到底',f:()=>{if(chance(.4+E().prestige/250+(f.w?.1:0)+allyBonus(em))){c.known=true;aEnd(c,'败露','谋害中宫之事败露。');pushNow(punishEv(c,em,'谋害中宫'));return '顺着曼陀罗的来处，查到了一个你没想到的地方……'}aNext(c,2,3,6);return '查无实据。'}},
      {t:'借机废后',f:()=>{em.rank=6;assignPalace(em);story(em,'以“失德”之名被废，降为贵妃。');log(`废皇后${fullName(em)}。`,1);aNext(c,2,0,1);return fx(chg({prestige:-8}),cchg(em,{mood:-40,aff:-20}))}},
      {t:'安抚皇后，加强守卫',f:()=>{aNext(c,2,4,8);return fx(cchg(em,{aff:6}))}}]}},
  (c,f)=>{if(empress()&&empress()!==c){aEnd(c,'蛰伏','她没能更进一步，却也没有露出破绽，依旧温婉得体地站在众人之中。');return {text:`${cName(c)}近来安静了许多。`,choices:[ok1]}}
    if(c.rank===8){aEnd(c,'凤仪','步步为营，终登后位。');return {text:`${cName(c)}如今已是中宫。`,choices:[ok1]}}
    return {text:`中宫空悬。${cName(c)}一身素服跪在乾清宫外：“臣妾愿为陛下打理六宫。”`,choices:[
      {t:'立她为后',cond:()=>c.rank>=5,why:'位分不足（需妃位以上）',f:()=>{c.rank=8;c.palace='坤宁宫';aEnd(c,'凤仪','步步为营，终登后位。');log(`册${fullName(c)}为皇后。`,1);return fx(chg({prestige:2}),cchg(c,{aff:15,mood:30}))}},
      {t:'晋她为皇贵妃，代掌凤印',cond:()=>rankCount(7)<1&&c.rank<7,why:'皇贵妃位已满',f:()=>{c.rank=7;if(!c.title)c.title=pick(TITLES);aEnd(c,'摄六宫','以皇贵妃之尊代掌凤印，离后位只差一步。');return fx(cchg(c,{aff:8,mood:15}))}},
      {t:'拒绝',f:()=>{c.scheme=clamp(c.scheme+10);aEnd(c,'怨怼','求后位不得，她心中的怨恨越积越深。');return fx(cchg(c,{aff:-15,mood:-20}))}}]}}]},
 greed:{name:'金玉其外',fit:c=>c.trait==='贪财',stages:[
  (c,f)=>({text:`京城里有传言：${cName(c)}的兄长打着“国舅爷”的旗号，在外收受贿赂、包揽词讼。`,choices:[
    {t:'让她自己去管教兄长',f:()=>{f.v='self';aNext(c,1,2,4);return '她连声保证，会写信骂醒兄长。'}},
    {t:'派人去查',f:()=>{aNext(c,1,1,3);return '都察院领了旨。'}},
    {t:'小事，不必理会',f:()=>{aNext(c,1,3,5);return fx(chg({people:-2}))}}]}),
  (c,f)=>{if(f.v==='self'&&chance(.5+c.aff/200)){c.trait='温婉';aEnd(c,'回头','兄长收了手，她也把攒下的私房钱捐了一半给善堂。');return {text:`${cName(c)}拿出一半的私房钱捐给了京城的善堂。“臣妾不想让陛下为难。”`,choices:[{t:'好',f:()=>fx(chg({people:4}),cchg(c,{aff:12}))}]}}
    return {text:`都察院查实：${cName(c)}的兄长贪墨受贿，数额高达二百万两，其中不少进了她宫里的库房。`,choices:[
      {t:'抄没充公，流放其兄',f:()=>{aEnd(c,'抄家','兄长被流放，她宫里的珠宝被抄没了一大半。');return fx(chg({treasury:200,people:6}),cchg(c,{mood:-35,aff:-15}))}},
      {t:'令其退赃，不再追究',f:()=>{aEnd(c,'退赃','兄长退还了赃款，此事不了了之。');return fx(chg({treasury:100,people:-2}),cchg(c,{mood:-10,aff:5}))}},
      {t:'压下此案',f:()=>{c.fam.p=Math.min(95,c.fam.p+15);aEnd(c,'外戚','此案被压下，她的娘家越发骄横。');return fx(chg({people:-8,prestige:-3}),cchg(c,{aff:15,mood:10}))}}]}}]},
 kite:{name:'纸鸢',fit:c=>['活泼','骄矜','淡泊','善妒'].includes(c.trait),stages:[
  (c,f)=>c.aff<30?null:{text:`御花园里，${cName(c)}放的纸鸢断了线，晃晃悠悠落在了乾清宫的屋脊上。她站在宫墙下，急得直跺脚。`,choices:[
    {t:'命小太监爬上去取',f:()=>{aNext(c,1,2,5);return fx(cchg(c,{mood:8}))}},
    {t:'亲自搭梯子去取',f:()=>{aNext(c,1,2,5);story(c,'纸鸢落在乾清宫屋脊上，陛下亲自搭梯子替她取了下来。');return `御前的太监吓得跪了一地。你把纸鸢递给她时，她笑得比春光还亮。${fx(cchg(c,{aff:10,mood:15}),chg({prestige:-1}))}`}},
    {t:'“一只纸鸢而已，再做一只便是。”',f:()=>{aNext(c,1,3,6);return fx(cchg(c,{mood:-5}))}}]},
  (c,f)=>c.aff<45?null:{text:`上元将近。${cName(c)}扯着你的袖子：“听说宫外的灯会有一条街那么长……臣妾长这么大，还没逛过呢。”`,choices:[
    {t:'微服带她出宫（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();f.out=1;aNext(c,2,3,6);story(c,'上元夜，陛下微服带她出宫看灯。她买了一盏兔子灯，一路舍不得放下。');return `你们在人潮里走散了一回，找到她时，她正举着一盏兔子灯站在桥头四处张望。${fx(cchg(c,{aff:15,mood:20}))}`}},
    {t:'在宫里为她办一场灯会（国库-40万两）',f:()=>{aNext(c,2,3,6);harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-6);relAdd(o,c,-8)}});return fx(chg({treasury:-40}),cchg(c,{aff:8,mood:15}))}},
    {t:'宫规不许',f:()=>{aNext(c,2,4,8);return fx(cchg(c,{mood:-10}))}}]},
  (c,f)=>{if(c.aff>=65){c.bond=true;aEnd(c,'知己',f.out?'那盏兔子灯一直挂在她的床头。她说，陛下是这宫里唯一懂她的人。':'她说，陛下是这宫里唯一懂她的人。');return {text:`${cName(c)}亲手扎了一只新纸鸢送你，上面画着两个牵手的小人。${'\n'}§她的恩宠从此不再衰减`,choices:[ok1]}}
    aEnd(c,'少年游','那些放纸鸢的春天，渐渐成了她回忆里最轻快的日子。');return {text:`${cName(c)}把旧纸鸢收进了箱底。她长大了些，也安静了些。`,choices:[ok1]}}]},
 love:{name:'鸳鸯帕',fit:()=>true,stages:[
  (c,f)=>c.aff<40?null:{text:`你去${c.palace}时没让人通报。${cName(c)}正低头绣一方帕子，见你进来，慌忙往身后藏。`,choices:[
    {t:'假装没看见',f:()=>{aNext(c,1,2,5);return '她松了一口气，脸却还是红的。'}},
    {t:'一把抢过来看',f:()=>{aNext(c,1,2,5);story(c,'绣了一方鸳鸯帕，被陛下抢去看了，羞得三天不敢抬头。');return `是一对鸳鸯，绣得歪歪扭扭的。${fx(cchg(c,{aff:6,mood:10}))}`}}]},
  (c,f)=>c.aff<55?null:{text:`你染了风寒，高烧三日。${cName(c)}衣不解带地守在榻前，药都是她亲口试过温才喂你。`,choices:[
    {t:'醒来时握住她的手',f:()=>{aNext(c,2,3,6);story(c,'陛下染病，她守了三天三夜。陛下醒来时握住了她的手。');return fx(cchg(c,{aff:12,favor:8}))}},
    {t:'厚赏她',f:()=>{aNext(c,2,3,6);return fx(chg({treasury:-20}),cchg(c,{mood:10,aff:4}))}}]},
  (c,f)=>{if(c.aff<70){if(!f.wait){f.wait=1;c.arc.t=S.turn+6;return null}aEnd(c,'相敬如宾','岁月流转，两人之间少了些心动，多了些安稳。');return {text:`${cName(c)}依旧温和，只是不再像从前那样盼着你来。`,choices:[{t:'……'}]}}
    const sc=c.id%3;f.sc=sc;
    return {text:sc===0?`那夜宫中走水，火从${c.palace}的偏殿烧起来。你赶到时，${cName(c)}正从火里往外跑，怀里紧紧抱着那方鸳鸯帕——她是回去拿它的。`:sc===1?`太液池上泛舟，船身忽然一歪，${cName(c)}落进了水里。她被捞上来时冻得发抖，手里还攥着那方鸳鸯帕。`:`围猎时一头受惊的野猪冲向御帐，${cName(c)}想也没想，扑过来挡在了你身前。她袖中掉出那方鸳鸯帕。`,choices:[
      {t:sc===0?'冲进去把她拉出来':sc===1?'亲手为她裹上大氅，守她一夜':'抱起她，亲自送回营帐',f:()=>{const s=chg({health:-1});c.bond=true;aEnd(c,'同心',['那夜陛下冲进火场把她拉了出来。','太液池落水，陛下守了她一夜。','围猎遇险，她以身护驾。'][sc]+'从此她的恩宠再不会淡去。');return `${['你们都被烟熏得满脸乌黑，她却笑出了眼泪。','她烧了一夜，醒来第一句话是问你有没有着凉。','她只擦破了手臂，却被你抱了一路，羞得把脸埋进你怀里。'][sc]}${fx(s,cchg(c,{aff:25,favor:20}))}\n§她的恩宠从此不再衰减`}},
      {t:'命人好生照料她',f:()=>{c.bond=true;aEnd(c,'同心','危急之时，她心里想的是那方鸳鸯帕，和绣它时想着的人。');return fx(cchg(c,{aff:15}))+'\n§她的恩宠从此不再衰减'}}]}}]}
};
const CONSORT_CRAFTS=[
  {title:'校补旧卷',begin:'在文渊阁借到半卷残书，想请掌事姑姑找出其余的散页。',share:'准她召几个识字的宫人一起校书',
    follow:'散页接回了原来的位置，她把校过的字一一指给宫人看。几个从前不识字的人，现在也能帮她核对卷名。',
    private:'她亲手给残卷换了新封皮，在卷末记下每一页是谁送来的。'},
  {title:'听琴辨音',begin:'拆开祖母留下的旧琴，发现第三根弦一向装得比旁的松。她想试一试祖母当年的弹法。',share:'准她在水榭教一段琴曲',
    follow:'后来水榭多了两位来习琴的人。第一回只听见错音，第三回已能从头弹完一段。',
    private:'她终于找回记忆里那段曲子的声音。闲来仍会弹给来探望她的人听。'},
  {title:'四时花谱',begin:'把御花园新开的花画成一张小谱，却在一朵看似相同的花前迟迟没下笔。',share:'请她带孩子辨一辨园里的花',
    follow:'她把花谱挂在园里，让孩子们照着找花。有个孩子指着没入册的野花问，她便特意补画了一页。',
    private:'她从春画到秋，把同一棵树的花、叶和果都留在了册页里。'}
];

function consortCraft(c){
  const craft=c.arc.f.craft;
  if(craft!==undefined)return CONSORT_CRAFTS[craft];
  const field=c.like==='琴谱'?1:c.like==='花草'||c.like==='字画'?2:c.t2==='好读史'?0:Math.abs(c.seed||c.id)%CONSORT_CRAFTS.length;
  c.arc.f.craft=field;
  return CONSORT_CRAFTS[field];
}

function makeArc(id,delay){
  return {id,st:0,t:S.turn+delay,done:false,end:null,f:{}};
}

function reconcileScholarArcs(){
  const scholars=S.consorts.filter(c=>c.arc?.id==='scholar');
  if(!scholars.length)return;
  const progressed=scholars.filter(c=>!c.arc.done&&c.alive&&!c.gone&&(c.arc.st>0||c.arc.f?.poem));
  progressed.sort((a,b)=>b.arc.st-a.arc.st||a.arc.t-b.arc.t);
  const owner=progressed[0]||scholars.find(c=>c.id===S.flags.scholarArc)||
    scholars.find(c=>c.arc.done)||scholars.find(c=>c.trait==='才女');
  if(owner)S.flags.scholarArc=owner.id;
  for(const c of scholars){
    if(!c.arc.done&&c!==owner)c.arc=makeArc('craft',5+c.id%6);
  }
}

function assignArc(c){
  if(c.arc)return;
  for(const id of ['secret','envoy','general','ill','scholar','greed','ambition','craft','kite','love']){
    if(!ARCS[id].fit(c)||id==='scholar'&&S.flags.scholarArc!=null)continue;
    c.arc=makeArc(id,id==='scholar'?ri(8,12):ri(2,5));
    if(id==='scholar')S.flags.scholarArc=c.id;
    return;
  }
}

function arcTick(){const due=alive().filter(c=>c.arc&&!c.arc.done&&!c.cold&&S.turn>=c.arc.t).sort((a,b)=>a.arc.t-b.arc.t);
  for(const c of due){const st=ARCS[c.arc.id].stages[c.arc.st];if(!st){c.arc.done=true;continue}
    const ev=st(c,c.arc.f);if(ev){if(!c.arc.done&&c.arc.t<=S.turn)c.arc.t=S.turn+99;ev.title=ev.title||ARCS[c.arc.id].name;ev.por=ev.por||c;return ev}
    if(c.arc.t<=S.turn)c.arc.t=S.turn+1}
  return null}
function arcLine(c){if(!c.arc)return '';const a=ARCS[c.arc.id],name=c.arc.id==='craft'&&c.arc.f.craft!==undefined?consortCraft(c).title:a.name;
  return `<div style="margin-top:4px">主线「${name}」：${c.arc.done?`<span class="tag y">结局·${esc(c.arc.end)}</span>`:`第${cnNum(c.arc.st+1)}幕<span class="hint">（情分越高越容易推进）</span>`}</div>`}
