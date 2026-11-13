/* ============ 古代历史典故事件 ============ */
COURT.push(
 ()=>({title:'立木为信',ref:'商鞅立木为信（战国·秦）',text:'新颁的田亩新法推行半年，百姓只当是官府又一套说辞，没人当真。户部尚书献计：在南门立一根三丈木头，谁能搬到北门，赏五十金。',choices:[
   {t:'照办，当众兑现赏金',f:()=>{log('帝于南门立木，徙者赏五十金，新法始行。',1);return `一个挑夫半信半疑地把木头扛到了北门，当场领到了五十金。第二天，新法的告示前挤满了人。${fx(chg({people:5,prestige:4,treasury:-5}))}`}},
   {t:'哗众取宠，不必',f:()=>`新法依旧推不动。${fx(chg({people:-2}))}`}]}),
 ()=>({title:'治安疏',ref:'海瑞《治安疏》（明·嘉靖）',text:'户部一个六品主事上疏，痛骂陛下“修宫室、宠后宫、二十年不视朝”，说天下人早就不满陛下了。\n听说他上疏前已经买好了棺材，遣散了家仆。',choices:[
   {t:'“拿下，廷杖！”',f:()=>{log('户部主事上疏直谏，被廷杖下狱。',1);return `他被打得血肉模糊，一声没吭。朝野噤声。${fx(chg({people:-8,prestige:-3}))}`}},
   {t:'下狱，但不杀',f:()=>`他在狱中住了十个月，出狱那天，京城百姓沿街相送。${fx(chg({people:2}))}`},
   {t:'把奏疏读三遍，召他来问话',f:()=>{log('帝召直谏之臣问对，纳其言。',1);return `他跪在殿上，说了半个时辰，句句扎心。你听完了，让他回去当差。${fx(chg({prestige:6,people:6}))}`}}]}),
 ()=>({title:'杯酒释兵权',ref:'宋太祖杯酒释兵权（北宋）',text:'几位随先帝打天下的老将，如今各掌禁军一部。夜里你梦见黄袍加身的不是自己。',choices:[
   {t:'设宴，劝他们交权回乡享福',f:()=>{log('帝宴请开国宿将，诸将交出兵权，归乡养老。',1);return `酒过三巡，你说“人生如白驹过隙”。第二天，几位老将都上表称病，交出了兵权。${fx(chg({prestige:6,treasury:-80}))}`}},
   {t:'一切照旧，信任功臣',f:()=>chance(.75)?`老将们依旧忠心耿耿。${fx(chg({prestige:1}))}`:`其中一位老将的部下在营中哗变，虽很快平定，朝中却人心惶惶。${fx(chg({prestige:-6,people:-3}))}`}]}),
 ()=>(E().age>24&&S.gen===1)?null:{title:'权臣',ref:'康熙擒鳌拜（清）',text:'先帝遗命的辅政大臣把持朝政，在殿上与你争执，竟当众挽起袖子，声色俱厉。退朝后，御前侍卫说：“陛下，宫里那些练布库的少年，都是可靠的。”',choices:[
   {t:'召他入宫议事，布库少年一拥而上',f:()=>{const p=.45+E().wu/200;if(chance(p)){log('帝以布库少年擒拿跋扈权臣。',1);return `权臣被按倒在地，你亲自宣读了他的三十条大罪。${fx(chg({prestige:12,people:4}))}`}return `权臣力大，打伤了几个少年后被擒，你也挨了一拳。${fx(chg({prestige:8,health:-6}))}`}},
   {t:'暂且隐忍',f:()=>`他越发骄横，连你批过的折子都敢改。${fx(chg({prestige:-6}))}`}]},
 ()=>S.flags.canal?null:{title:'开凿运河',ref:'隋炀帝开大运河（隋）',text:'工部献上一幅舆图：若从京城到江南开一条运河，漕粮可省三成运费。可要征发民夫百万。',choices:[
   {t:'开（国库-500万两，民心-10）',f:()=>{S.flags.canal=S.turn;log('帝下诏开凿南北运河，征发民夫百万。',1);return `河工连绵数千里，累死者不计其数。但从此以后，每年漕运能多出一笔进项。${fx(chg({treasury:-500,people:-10,prestige:3}))}\n§此后每月国库额外+25万两`}},
   {t:'劳民伤财，不开',f:()=>fx(chg({people:3}))}]},
 ()=>({title:'宝船',ref:'郑和下西洋（明·永乐）',text:'兵部献议：造六十艘宝船，载二万七千人，出海宣扬国威，联络南洋诸国。',choices:[
   {t:'造船出海（国库-400万两）',f:()=>{log('帝遣宝船下西洋。',1);return `船队走了两年，带回了长颈鹿、象牙和十几国的使臣。${fx(chg({treasury:-400,prestige:10,people:-2}))}`}},
   {t:'海禁为上',f:()=>fx(chg({treasury:30}))}]}),
 ()=>({title:'青苗法',ref:'王安石变法·青苗法（北宋）',text:'新任参知政事上了一道万言书：春荒时官府借钱给农户，秋收后收二分利。既救了百姓，国库也有进项。',choices:[
   {t:'推行新法',f:()=>chance(.5)?`各地推行得当，百姓称便。${fx(chg({treasury:150,people:4}))}`:`地方官强行摊派，借不借都要还利，民怨沸腾。${fx(chg({treasury:180,people:-8}))}`},
   {t:'祖宗之法不可变',f:()=>fx(chg({prestige:-1}))}]}),
 ()=>({title:'文字狱',ref:'“清风不识字，何故乱翻书”（清）',text:'有人告发：翰林院某编修诗中有一句“清风不识字，何故乱翻书”，说是暗讽朝廷。',choices:[
   {t:'严办，以儆效尤',f:()=>{log('翰林编修因诗获罪。',1);return `编修被抄家问斩，从此读书人写诗都要先找人看三遍。${fx(chg({prestige:2,people:-7}))}`}},
   {t:'“一句诗罢了。”告发者反坐',f:()=>`告发的人被打了板子。读书人私下都说陛下宽厚。${fx(chg({people:5}))}`}]}),
 ()=>S.flags.dan?null:{title:'金丹',ref:'历代帝王服丹求仙；明·红丸案',text:'一个自称活了三百岁的方士入宫献丹，说服下可延年益寿、百病不侵。你最近确实觉得乏力。',choices:[
   {t:'服下',f:()=>{S.flags.dan=S.turn;return `丹药入口，浑身燥热，精神竟真的好了许多。${fx(chg({health:8}))}`}},
   {t:'把方士赶出宫去',f:()=>fx(chg({prestige:2}))}]},
 ()=>({title:'十渐疏',ref:'魏征《十渐不克终疏》（唐）',text:'一位老臣上疏，列了十条陛下“渐不如初”之处：渐好奢靡、渐疏贤臣、渐怠朝政……末尾说：“愿陛下慎终如始。”',choices:[
   {t:'把奏疏抄在屏风上，朝夕自省',f:()=>{log('老臣上《十渐疏》，帝录于屏风，朝夕自省。',1);return fx(chg({prestige:5,people:3}))}},
   {t:'“朕知道了。”',f:()=>fx(chg({prestige:-1}))}]}),
 ()=>{const p=kidsAlive().find(k=>k.sex==='f'&&k.married&&!k.meiAsked);if(!p)return null;return {title:'秦香莲',ref:'包公铡美案（宋·民间戏曲）',text:`开封府递上一桩案子：一个乡下妇人带着两个孩子拦轿喊冤，状告驸马——${kidName(p)}的夫婿——入京赶考前已有妻室，中举后杀妻灭口未遂。`,choices:[
   {t:'依律问斩，公主另择佳婿',f:()=>{p.meiAsked=true;p.love=clamp(p.love-10);kstory(p,'驸马被揭发停妻再娶，依律问斩。她哭了很久，后来说：“女儿不怨父皇。”');log(`驸马欺君杀妻，依律问斩。`,1);return fx(chg({people:10,prestige:4}))}},
   {t:'为了公主颜面，赏那妇人银两了事',f:()=>{p.meiAsked=true;kstory(p,'驸马停妻再娶之事被压下。');return fx(chg({people:-8,treasury:-5}))}}]}},
 ()=>({title:'和亲',ref:'昭君出塞（西汉）',text:'北狄单于遣使求亲，请娶一位宗室公主。礼部正为难，掖庭一个叫王嫱的宫女自请出塞：“与其老死宫中，不如去看看草原。”',choices:[
   {t:'封她为公主，风光出塞',f:()=>{log('宫女王嫱自请和亲，封公主出塞。',1);return `她辞行那天，你才第一次见到她——竟是满宫都没见过的绝色。听说宫廷画师给她的画像上，点了一颗丧夫落泪痣。${fx(chg({prestige:6,people:5}))}`}},
   {t:'不和亲',f:()=>fx(chg({prestige:-2}))}]}),
);
const HIST=[
 ()=>{const c=harem().find(c=>c.virtue>=65&&c.rank>=3);if(!c)return null;return {title:'辞辇',ref:'班婕妤辞辇（西汉·汉成帝）',por:c,text:`你要去上林苑，让${cName(c)}与你同坐御辇。她却跪下推辞：“臣妾看古时的画像，贤君身边都是名臣，只有末代之君身边才坐着宠妃。”`,choices:[
   {t:'“得此贤妃，朕之幸也。”',f:()=>{story(c,'辞辇不坐，陛下赞她贤德。');log(`${fullName(c)}辞辇。`,1);return fx(cchg(c,{aff:8}),chg({prestige:3}))}},{t:'“扫兴。”',f:()=>fx(cchg(c,{mood:-8}))}]}},
 ()=>{const c=harem().filter(c=>c.favor>=65).sort((a,b)=>b.favor-a.favor)[0];if(!c||season()!==1)return null;return {title:'荔枝',ref:'“一骑红尘妃子笑，无人知是荔枝来”（唐·杨贵妃）',por:c,text:`${cName(c)}说想吃岭南的鲜荔枝。荔枝离枝一日色变，三日味变，岭南到京城快马也要七天。`,choices:[
   {t:'沿途驿站换马，八百里加急',f:()=>{story(c,'陛下命人从岭南快马送来鲜荔枝。');log('帝为宠妃驰驿进荔枝，沿途驿马累死数十匹。',1);harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous)o.mood=clamp(o.mood-6)});return fx(chg({treasury:-60,people:-6}),cchg(c,{mood:30,favor:5}))}},
   {t:'“等明年去岭南吃个够。”',f:()=>fx(cchg(c,{mood:-5,aff:2}))}]}},
 ()=>{const c=harem().find(c=>c.favor>=70&&c.mood<45);if(!c)return null;return {title:'烽火',ref:'周幽王烽火戏诸侯（西周）',por:c,text:`${cName(c)}已经很久没笑过了。一个近臣献计：“骊山的烽火台若点起来，诸侯兵马齐至，那场面，娘娘看了必笑。”`,choices:[
   {t:'点烽火',f:()=>{S.flags.wolf=S.turn;story(c,'陛下为博她一笑，点燃了骊山烽火。她笑了。');log('帝为博宠妃一笑，举烽火戏诸侯。',1);return `诸侯们披甲带兵赶来，却发现什么也没有。她终于笑了。诸侯们没有笑。${fx(cchg(c,{mood:40}),chg({prestige:-15}))}`}},
   {t:'把那近臣赶出去',f:()=>fx(chg({prestige:2}))}]}},
 ()=>{const c=alive().find(c=>c.cold);if(!c)return null;return {title:'长门赋',present:[],valid:()=>c.alive&&!c.gone&&c.cold,ref:'陈皇后千金买《长门赋》（西汉·汉武帝）',por:c,text:`冷宫里的${fullName(c)}拿出最后一点体己，托人求当世第一才子写了一篇赋，辗转送到你案头。\n“夫何一佳人兮，步逍遥以自虞……”`,choices:[
   {t:'读完，去冷宫看她',f:()=>{A.uncold(c.id);story(c,'一篇赋，换回了陛下的一次探望。');return '你去了冷宫。她瘦得几乎认不出来。'}},
   {t:'赋是好赋',f:()=>fx(cchg(c,{mood:-10}))}]}},
 ()=>{const c=harem().filter(c=>c.aff>=40).sort((a,b)=>b.aff-a.aff)[0];if(!c)return null;return {title:'当熊',ref:'冯媛挡熊（西汉·汉元帝）',por:c,text:`南苑观兽，一头黑熊忽然冲出栅栏，直扑御座。左右嫔妃尖叫四散，只有${cName(c)}一步挡在你身前。`,choices:[
   {t:'“你不怕么？”',f:()=>{c.bond=true;remember(c,'care','挡熊护驾');story(c,'南苑观兽，黑熊出槛，她挡在陛下身前。她说：“熊得一人便会停下，臣妾怕它伤了陛下。”');log(`南苑熊出槛，${fullName(c)}挺身护驾。`,1);return `侍卫一拥而上，制住了熊。她这才腿一软：“熊抓到一个人就会停下，臣妾怕它伤了陛下。”${fx(cchg(c,{aff:20,favor:15}))}\n§她的恩宠从此不再衰减`}}]}},
 ()=>{const c=harem().find(c=>c.rank===8)||harem().find(c=>c.story.some(s=>s.t.includes('潜邸')));if(!c||c.goldAsked)return null;return {title:'金屋',ref:'汉武帝“金屋藏娇”（西汉）',por:c,text:`${cName(c)}翻出一张发黄的纸，上面是你小时候歪歪扭扭的字：“若得阿娇作妇，当作金屋贮之。”\n“陛下还记得吗？”`,choices:[
   {t:'“记得。”',f:()=>{c.goldAsked=true;remember(c,'care','金屋之约');return fx(cchg(c,{aff:12,mood:15}))}},
   {t:'真给她修一座金屋（国库-200万两）',f:()=>{c.goldAsked=true;log('帝为皇后修金屋。',1);return fx(chg({treasury:-200,people:-4}),cchg(c,{aff:20,mood:30}))}},
   {t:'“小孩子的话，哪能当真。”',f:()=>{c.goldAsked=true;remember(c,'hurt','金屋之约不作数');return fx(cchg(c,{mood:-15,aff:-6}))}}]}},
 ()=>{const em=empress();if(!em)return null;const c=harem().filter(c=>c!==em&&c.favor>em.favor+20).sort((a,b)=>b.favor-a.favor)[0];if(!c)return null;return {title:'却坐',present:[em,c],ref:'袁盎却坐（西汉·汉文帝与慎夫人）',por:c,text:`御花园设宴，内侍照例把${cName(c)}的席位与皇后并排摆着。一位老臣上前，把她的席子往下挪了一格：“尊卑有序。陛下宠她，才更不能害她——陛下没听说过‘人彘’吗？”`,choices:[
   {t:'“爱卿说得对。”',f:()=>{relAdd(c,em,-6);return fx(cchg(em,{aff:8}),cchg(c,{mood:-12}),chg({prestige:3}))}},
   {t:'“朕的家事。”把席子挪回去',f:()=>{relAdd(c,em,-10);return fx(cchg(c,{mood:10}),cchg(em,{mood:-15,aff:-5}),chg({prestige:-3}))}}]}},
 ()=>{if(!S.flags.bless||S.turn-S.flags.bless>1||S.flags.ganye)return null;const g=makeGirl({fam:{t:'先帝才人',p:20},trait:'城府',age:ri(22,25)});g.scheme=88;g.looks=clamp(g.looks+10);g.talent=clamp(g.talent+10);
   return {title:'感业寺',ref:'武则天感业寺为尼（唐）',por:g,text:`护国寺后院，一个削发的女子正在扫落叶。方丈说，她是先帝的才人${fullName(g)}，先帝驾崩后依例出家。她抬头看你，眼神不像个出家人。`,choices:[
   {t:'接她回宫，封为昭仪……不，封为贵人',f:()=>{S.flags.ganye=1;addConsort(g,3,'先帝才人，于护国寺被陛下接回宫');log('帝接先帝才人回宫，朝野哗然。',1);return fx(chg({prestige:-8}))}},
   {t:'转身离开',f:()=>{S.flags.ganye=1;return '你走出很远，回头时，她还站在那里。'}}]}},
 ()=>{if(S.flags.zifu)return null;const g=makeGirl({fam:{t:'歌女',p:2},trait:pick(['温婉','痴情','活泼'])});g.looks=clamp(g.looks+8);
   return {title:'平阳府',ref:'卫子夫平阳公主府献歌（西汉·汉武帝）',por:g,text:`你去长公主府上赴宴。席间一个歌女唱了一曲《清平调》，满座寂然。长公主笑着说：“陛下若喜欢，就带回去。”`,choices:[
   {t:'带回宫',f:()=>{S.flags.zifu=1;addConsort(g,1,'原是长公主府上的歌女，被陛下带回宫');g.aff=35;g.favor=40;return fx(chg({prestige:-2}))}},
   {t:'谢过长公主，独自回宫',f:()=>{S.flags.zifu=1;return '那歌声在你耳边绕了好几天。'}}]}},
 ()=>{if(!S.cands.length||S.flags.painter===S.flags.lastXX)return null;S.flags.painter=S.flags.lastXX;const g=makeGirl();g.looks=clamp(95);g.fam={t:'良家子',p:12};
   return {title:'画师',ref:'毛延寿索贿，误画王昭君（西汉·汉元帝）',por:g,text:`选秀的画像呈上来，你翻到一张平平无奇的脸。一个老嬷嬷忍不住说：“陛下，这位姑娘本人，比画上好看十倍——她不肯给画师送银子。”`,choices:[
   {t:'召来一看，画师下狱',f:()=>{S.cands.push(g);log('宫廷画师索贿篡改秀女画像，下狱问罪。',1);return `她走进殿来，满殿生光。${fx(chg({people:2}))}\n§她已加入本次选秀`}},
   {t:'“画像就是画像。”',f:()=>'你翻过了那一页。'}]}},
 ()=>{const c=harem().find(c=>c.preg>=8&&!c.prot&&!c.swapAsked);if(!c)return null;const a=harem().find(x=>x!==c&&x.scheme>=70);if(!a)return null;
   return {title:'产房',present:[c,a],ref:'狸猫换太子（宋·民间传说）',por:c,text:`${cName(c)}临盆在即。一个小宫女半夜偷偷来报：她看见${cName(a)}宫里的掌事太监和稳婆说了很久的话，还塞了一包东西。`,choices:[
   {t:'换上心腹稳婆，加派人手守产房',f:()=>{c.swapAsked=true;c.prot=true;return '产房外多了八个带刀的侍卫。'}},
   {t:'小宫女胡言乱语',f:()=>{c.swapAsked=true;c.swapRisk=true;return '你没放在心上。'}}]}},
 ()=>{const lost=S.children.find(k=>k.lost&&S.turn-k.born>=60);if(!lost||!chance(.25))return null;return {title:'陈州少年',ref:'狸猫换太子·认母（宋·民间传说）',text:`开封府送来一个少年，说他是当年产房里被宫女寇珠藏在妆盒里、偷偷送出宫的那个孩子，在陈州一户人家长大。他手里有一块刻着生辰的玉锁。`,choices:[
   {t:'认回皇子',f:()=>{lost.lost=false;lost.alive=true;kstory(lost,'流落民间多年，终于被认回宫中。');log(`流落民间的${kidName(lost)}被认回宫中。`,1);const m=byId(lost.mom);if(m&&m.alive){if(m.cold){m.cold=false;assignPalace(m)}cchg(m,{mood:50,aff:20});story(m,'失散多年的孩子回来了。她抱着孩子，哭得说不出话。')}AU.sfx('joy');return fx(chg({people:5}))}},
   {t:'恐是冒认，赏他银两打发走',f:()=>{lost.lost=false;return '少年走了。后来再也没有人提起他。'}}]}},
 ()=>{if(chance(.85))return null;const previous=byId(S.flags.lastNight),last=inPalace(previous)?previous:null;return {title:'宫变',ref:'壬寅宫变（明·嘉靖）',sfx:'gong',text:`深夜，十几个宫女趁你熟睡，用黄绫勒住了你的脖子。绳结打成了死扣，没能勒紧。一个胆小的宫女跑去坤宁宫报了信。${last&&last.alive?`\n那夜，你宿在${cName(last)}宫里。`:''}`,choices:[
   {t:'彻查主谋',f:()=>{log('宫女十余人夜谋弑君，事败伏诛。',1);return `她们说，是受不了宫里动辄打死人的日子。${fx(chg({health:-12,prestige:-4}))}\n§你下令宫中不得再虐打宫人`}},
   ...(last&&last.alive&&!last.cold?[{t:`迁怒${cName(last)}：她宫里出的事`,f:()=>{last.alive=false;story(last,'宫变那夜陛下宿在她宫中，事后被以“知情不报”赐死。她至死喊冤。');log(`${fullName(last)}因宫变牵连被赐死。`,1);AU.sfx('sad');return `后来查明，她毫不知情。${fx(chg({health:-12,people:-6}))}`}}]:[])]}},
 ()=>{const h=S.heir&&kidById(S.heir);if(!childInPalace(h)||kidAge(h)<8||S.flags.ting)return null;S.flags.ting=1;const rv=kidsAlive().find(k=>k.sex==='m'&&k!==h&&(k.sup||0)>20);const m=rv&&byId(rv.mom);
   return {title:'梃击案',ref:'梃击案（明·万历）',por:h,sfx:'gong',text:`一个手持枣木棍的汉子闯进东宫，打伤了守门太监，被侍卫拿下。他一口咬定是有人许他“打进去，有吃有穿”。${m&&m.alive?`\n有人说，他进宫前去过${cName(m)}娘家的庄子。`:''}`,choices:[
   ...(m&&m.alive?[{t:`顺藤摸瓜，查到${cName(m)}`,f:()=>{relAdd(m,byId(h.mom),-30);pushNow(punishEv(m,byId(h.mom),'谋害储君'));return '口供一层层往上，查到了一个你不想查到的地方……'}}]:[]),
   {t:'以“疯癫”结案',f:()=>`那汉子被斩了。朝中议论了很久。${fx(chg({prestige:-2}))}`}]}},
 ()=>{const ks=kidsAlive().filter(k=>childInPalace(k)&&k.sex==='m'&&kidAge(k)>=10&&kidAge(k)<=20);if(ks.length<2||S.flags.qibu)return null;S.flags.qibu=1;const [a,b]=ks;
   return {title:'七步诗',present:[a,b],ref:'曹植七步诗（三国·魏）',por:b,text:`${kidName(a)}与${kidName(b)}在家宴上争执起来。${a.name}冷笑：“你不是自诩才子么？七步之内作一首诗，作不出来，就别在父皇面前显摆。”`,choices:[
   {t:`让${b.name}作诗`,f:()=>{b.lit=clamp(b.lit+5);a.vir=clamp(a.vir-3);kstory(b,'家宴上七步成诗：“本是同根生，相煎何太急。”');return `${b.name}走了七步，开口道：“煮豆燃豆萁，豆在釜中泣。本是同根生，相煎何太急。”满座无声。${a.name}的脸一阵红一阵白。`}},
   {t:'“兄弟之间，作什么诗。”',f:()=>{a.vir=clamp(a.vir+3);b.vir=clamp(b.vir+3);return '两人低下了头。'}}]}},
 ()=>{const ks=kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=4&&kidAge(k)<=8);if(!ks.length||S.flags.lizi)return null;S.flags.lizi=1;const k=pick(ks);
   return {title:'让梨',present:[k],ref:'孔融让梨（东汉）',por:k,text:`中秋家宴，宫人端上一盘梨。${kidName(k)}挑了一个最小的。你问为什么，孩子说：“我小，应该吃小的。”`,choices:[
   {t:'当众夸奖',f:()=>{k.vir=clamp(k.vir+6);k.love=clamp(k.love+6);kstory(k,`${kidAge(k)}岁时家宴让梨，父皇当众夸奖。`);return '§品德+6　父爱+6'}}]}},
 ()=>{const ks=kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=6&&kidAge(k)<=10);if(ks.length<2||S.flags.gang)return null;S.flags.gang=1;const [a,b]=shuffle(ks);
   return {title:'砸缸',present:[a,b],ref:'司马光砸缸（北宋）',por:a,text:`御花园里，${b.name}爬上太平缸玩耍，一失足掉进了缸里。旁的孩子都吓跑了，${kidName(a)}搬起一块石头，把缸砸破了。`,choices:[
   {t:'重赏',f:()=>{a.lit=clamp(a.lit+5);a.vir=clamp(a.vir+3);kstory(a,`${kidAge(a)}岁时砸缸救了${b.name}。`);kstory(b,`${kidAge(b)}岁时掉进太平缸，被${a.name}砸缸救起。`);return '§才学+5　品德+3'}}]}},
];
function histEvent(){if(S.flags.dan&&S.turn-S.flags.dan>=8&&!S.flags.danBad){S.flags.danBad=1;return {title:'丹毒',ref:'历代帝王服丹中毒',sfx:'gong',text:'你近来口渴心燥，夜不能寐，背上生了毒疮。太医战战兢兢地说，是丹药里的铅汞积在了体内。',choices:[{t:'把方士抓来',f:()=>{log('帝服丹中毒，诛方士。',1);return fx(chg({health:-20}))}}]}}
  S.flags.hcd=S.flags.hcd||{};for(const i of shuffle(HIST.map((_,i)=>i))){if(S.turn-(S.flags.hcd[i]===undefined?-999:S.flags.hcd[i])<48)continue;const ev=HIST[i]();if(ev){S.flags.hcd[i]=S.turn;return {...ev,present:ev.present||eventPortraits(ev)}}}return null}
