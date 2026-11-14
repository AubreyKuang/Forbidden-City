/* Short, character-led speech. Reading never rolls game RNG or changes a save. */
const CONSORT_VOICES={
  温婉:['茶不急着喝，先坐一坐。陛下今日，可有一件舒心的事？','臣妾这里没有要紧事，只想听陛下说两句家常。','窗边风小些，陛下坐这里。茶淡了可以再续，话不必赶着说。'],
  骄纵:['臣妾可不肯只听一句“都好”。今日这身衣裳，陛下总得认真看一眼。','旁的赏赐先收着，臣妾今日就想请陛下多坐片刻。','臣妾也知道该守规矩。可陛下来了，偏想任性一回。'],
  骄矜:['这花开得好，臣妾偏不肯折。好东西也不必件件占在手里。','陛下若只是顺路，臣妾可要记着；若是特意来的，就请坐。','旁人喜欢怎样，臣妾管不着。这一处窗景，臣妾想依自己的意思留着。'],
  聪慧:['臣妾有个疑问，想听听陛下的解法。先别看书上的答案，可好？','同一句话，换个时候听，意思竟又不同。陛下可也有过？','这一局先不急着落子。臣妾想知道，陛下为何独独留下这一路。'],
  善妒:['臣妾知道不该计较，可有些话，总想亲耳听陛下说。','人人都会道一声万安。臣妾想问的，是陛下今日可曾想起这里。','臣妾也有自己的好处。陛下说的时候，能不能不拿旁人来比？'],
  淡泊:['新茶不浓，留着慢慢喝正好。窗外的风，也不催人。','臣妾没添什么新陈设。花还在，书还在，便很够了。','陛下若乏了，不说话也无妨。臣妾陪着坐一会儿。'],
  活泼:['先别告诉臣妾外头的事，容臣妾猜一猜！猜中了，可许臣妾笑一回。','日日照着花样绣，多没意思。臣妾想给这只鸟添一点自己的脾气。','陛下来得巧，臣妾正缺一个同谋。可别一听就教训人。'],
  城府:['臣妾听来的话，先搁一搁。眼见得明白了，再说也不迟。','花开在明处，根却藏在土里。臣妾看事情，总想多看一层。','陛下问，臣妾便说。只是这话出得此门，恐怕又是另一个意思了。'],
  痴情:['原有许多话想说，听见陛下的脚步，倒一句也想不起了。','臣妾不怕等，只怕等来的时候，自己反而不敢开口。','这盏茶温着，心也跟着定了。今日陛下肯坐多久，臣妾便陪多久。'],
  体弱:['臣妾想把窗开一线，听听外头的鸟。总闷在屋里，人也没精神。','今日先不谈药，好不好？臣妾想听一件有趣的小事。','脚步放慢些，臣妾还能陪陛下走一小段。走到廊下就好。'],
  将门:['弓弦要时常照看，久不张弓，手就生了。陛下何时得闲，一同试试？','臣妾最怕听“女子不必懂”。懂不懂，总得先容人学一学。','输一回不打紧，怕的是自己先认了输。臣妾还想再试一次。'],
  才女:['这半句搁了一会儿，总觉得太满。陛下替臣妾听听，留白是否更好？','好曲子不在繁声。方才那一段，臣妾想弹得再轻些。','若只挑人人称好的句子读，倒容易错过写书人的真心。'],
  贪财:['这珠子的光泽倒好，臣妾却还想问问工匠，孔是怎样钻得这样细的。','喜欢好东西，又不是什么见不得人的事。只是花出去的银子，也该心中有数。','陛下别笑。臣妾收得整齐，哪件是谁送的，可都记得。'],
  沉静:['方才听了一阵风，倒把心静下来了。陛下可愿也坐片刻？','话少，不是没有话。只是有些意思，想等一个肯听的人。','臣妾喜欢这时候的光。落在书页上，连旧字都显得温柔些。'],
  爽直:['臣妾若说得不对，陛下尽管驳。可别嘴上应着，心里另想一套。','这一回若是臣妾错了，臣妾认；下回该说的话，还是要说。','猜来猜去多累。陛下想知道什么，直接问便是。'],
  持重:['事情一多，先分个缓急。眼前能办妥的，便不必留到明日悬着。','臣妾应过的话，都记在心里。做得慢些，也想做周全。','先容臣妾把前后的缘由说清，陛下再断，也不迟。'],
  好客:['一张桌子只坐两个人，也值得好好摆。陛下喜欢靠窗，还是靠灯？','人多有热闹的好，人少也能把话说深些。今日想听陛下慢慢说。','臣妾这里的茶总备着。谁若心中烦闷，来了便有地方坐。'],
  巧手:['这一针歪了，倒生出一点新花样。陛下看，像不像风吹偏的一枝？','花样可以照着描，手上轻重却要自己摸索。臣妾最喜欢这一步。','臣妾想把边上的针脚藏好。看不见的地方，也不愿敷衍。'],
  好学:['臣妾把不懂的记在这里。陛下别嫌问题细，知道了才安心。','一本书读第二遍，才发觉头一遍漏下许多。今日倒像又识了一位故人。','臣妾想先自己试一试。若实在解不开，再向陛下请教。']
};
const HOBBY_VOICES={
  抚琴:['这一弦轻些，余音反倒长。陛下听见了么？','臣妾想试一支慢曲，不必数着拍子，随水声走便好。'],
  读书:['书页边还空着，容臣妾记下今日这点疑问。','陛下读书时，可有舍不得翻过的一页？'],
  刺绣:['这叶子的绿不能一样深，差一线，才像活的。','线团打了结，越急越解不开。人有时也这样。'],
  骑射:['等风停一停再放箭，不必每一回都与它争。','骑马时望远些，眼睛只盯着脚下，反倒不稳。'],
  投壶:['这一支不中也无妨。陛下可别为了哄臣妾，故意投偏。','壶口虽小，手腕放松了，倒比用力更准。'],
  做点心:['这一碟先不加蜜，尝得出米香，才算没白做。','臣妾想试一个新花样。不好吃也请直说，下回才好改。'],
  侍花:['新叶比旧叶浅，别看它小，过几日就认不出了。','枝条伸向哪里，也有自己的意思。臣妾想先由它长一长。'],
  品茶:['第一盏香高，第二盏味柔。臣妾倒更喜欢后头这一盏。','喝茶时不用赶着谈正事。让这一口先暖下来。'],
  对弈:['输赢先不论。臣妾想把方才那一步重摆一回，看看错在哪里。','棋盘上有退路，心里才不慌。陛下说，是不是？']
};
const QUIRK_VOICES={
  嗜甜:'臣妾只多留了一小块甜糕，陛下可别数。',怕雷:'若听见雷声，陛下就同臣妾说句话。说什么都好。',爱猫:'猫儿肯让人靠近，须得它自己愿意。臣妾倒觉得这脾气好。',路痴:'臣妾想认认宫里的路，不能每一回都只跟着人走。',好胜:'陛下不必让着臣妾。凭本事赢一回，才值得高兴。',念旧:'旧物用久了，摸到哪里都是熟的。换新的，反而舍不得。',嘴硬心软:'臣妾可没特意候着。只是茶还热，倒了可惜。',爱哭:'眼泪有时自己落下来，臣妾也未必是伤心。',贪睡:'若能留一个不必赶时辰的早晨，倒比什么赏赐都好。',护短:'自己身边的人，错了可以教，不能由着旁人糟践。',记仇:'好话坏话，臣妾都记得。不是每一句都要当场答。',好读史:'史书上只落几个字，身在其中的人，却是一辈子。',信佛:'臣妾想求的，不过是身边的人少些病痛，多些安稳。',擅厨艺:'火候差一点，滋味便不一样。急着出锅，最是可惜。',直言:'臣妾话说得直，倒省了陛下猜。',擅舞:'袖子落下来时，不必急着收。留半拍，才有余韵。',畏寒:'冷的时候，捧一盏热茶，手心暖了，人才舒展。',擅骑射:'握缰太紧，马也不自在。松紧之间，才见本事。'
};
function voiceHash(text){let n=2166136261;for(const ch of String(text))n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n;}
function voicePick(p,values,key,mode){
  const offset=voiceHash(`${p.seed||p.id}:${key}:${mode}`);
  return values[(offset+S.turn+(p.voiceVisits||0))%values.length];
}
const voiceLine=(key,stage,lines)=>({key,stage,lines:Array.isArray(lines)?lines:[lines]});
/* Intimacy develops through time AND contact; years alone never imply affection. */
const VOICE_YEARS={
 gentle:{
  first:['臣妾初来，尚不知陛下惯用怎样的茶。若有不周之处，还请容臣妾慢慢学。','方才想问一句，又怕冒失。陛下平日忙完，可也会出来走走？','入宫前想过许多应答，如今见了陛下，倒只记得请安了。'],
  settling:['这里的路渐渐认得了，只是见着陛下，话仍要在心里想一遍才敢说。','臣妾今日试着按自己的心意摆了花。陛下若得闲，可愿看一眼？','不知陛下愿不愿听这些小事。臣妾今日过得还算欢喜。'],
  familiar:['从前怕说错话，如今倒盼陛下听见实话。今日有些疲倦，陪臣妾坐一坐罢。','臣妾想留陛下用茶。这回不是客气，是真想多说一会儿。','有句话搁了半日。陛下若肯听，臣妾便不藏着了。'],
  years:['这些年过去，迎驾的话倒说得生疏了。来，坐近些，让臣妾好好看看。','初来时，连留陛下喝盏茶也要斟酌。如今这一点私心，总算敢说出口了。','旧日怕沉默失礼，如今才知，相对坐着不说话，也是难得的安稳。'],
  distant:['相识这些年，臣妾仍不知哪句话可以说，哪句话该咽下去。','茶还是那一盏。只是今日见了陛下，竟要先想想该怎样开口。','陛下若有吩咐，臣妾听着。其余的话……容臣妾再想想。']},
 proud:{
  first:['臣妾也想应答得从容些，偏偏礼数学了一路，此刻倒乱了。','这身衣裳是臣妾自己挑的。不知在宫里，会不会显得太招眼？','臣妾原以为自己胆子不小，见了陛下，才知不是那么回事。'],
  settling:['宫里的规矩，臣妾记着呢。只是偶尔也想问一句：这样便不能改么？','臣妾喜欢的东西，未必人人都爱。陛下若问，臣妾倒愿说个明白。','有个小小的请求，臣妾想了几回，今日总算敢开口。'],
  familiar:['往日不敢留人，今日可要留了。陛下若忙，须亲口同臣妾说。','既肯听臣妾说话，就不许只应一声“好”。臣妾要听陛下自己的意思。','臣妾是有些任性，可也知道分寸。今日这一点私心，愿只说给陛下听。'],
  years:['初来时藏着的那点骄气，陛下如今早看透了。臣妾也不装了，今日就想留你。','这些年，夸臣妾的话听了许多，敷衍的话也听得出来。陛下可别拿好话搪塞。','年轻时怕不够出挑，如今倒觉得，能自在说一句心里话，比什么都难得。'],
  distant:['旧日敢开口讨的，如今倒要掂量了。陛下看，人也是会学乖的。','臣妾不是没有话，只是不愿再拿几句玩笑，装作什么也没有变。','若是宫里的礼数，臣妾自然周全。若问心意，今日还答不上来。']},
 reserved:{
  first:['臣妾言语少些，并非怠慢。初来此处，总想先听明白，再开口。','这几日尚在认人认路。陛下垂问，臣妾不敢以不知作知。','臣妾还未想好怎样回答，可否容臣妾想一想？'],
  settling:['从前凡事只听着，如今也渐渐有了自己的想法，只怕说得不周全。','宫中日日有新消息。臣妾宁愿慢一点，等看清楚了再同陛下说。','有些规矩已经懂了，有些人却还没有懂。人心比规矩难记。'],
  familiar:['这话不便在人前说。陛下若肯听，臣妾便把缘由从头讲明。','从前怕多言，今日怕不说。臣妾有一点不同的看法。','话说得直些，也许不好听。可既然信得过，便不该只挑好听的说。'],
  years:['年轻时总想把话说圆满，如今只愿说得诚实。陛下可愿听？','这些年见过许多变迁，倒越发觉得，肯相互听完一句话，不是小事。','从前一句话要藏三分，如今在陛下面前，愿少藏一分。其余的，容臣妾慢慢说。'],
  distant:['许多话，早年不敢说，后来不愿说。今日还要再想一想。','臣妾可以把事情讲明白。至于心里怎样想，暂且留给自己罢。','相识已久，不等于事事知心。陛下若真想知道，便请慢些问。']},
 bright:{
  first:['臣妾方才险些说错了话。陛下莫笑，臣妾已在心里练了几遍呢。','宫里这样大，臣妾想问的也多，可又怕一下问得太多。','臣妾平日不是这样安静的。只是今日……有一点紧张。'],
  settling:['今日认得一条新路，总算不用回回问人了。陛下要听臣妾怎样认错的么？','原先怕笑得太响，如今觉得，开心的事憋着不说，怪可惜的。','臣妾有个主意，先听完再说好不好？不成也不要紧。'],
  familiar:['这主意旁人都说胡闹，臣妾偏想先说给你听。先别皱眉呀。','陛下一来，臣妾就有话了。今日先说自己的事，正经话待会儿再讲。','从前怕问得多，如今倒要问个明白。你可不许只拿“依你”打发。'],
  years:['刚入宫时装了几日安静，后来到底藏不住。如今陛下可还嫌臣妾话多？','这些年过去，臣妾的主意倒没少。只是如今做事，也肯多想一步了。','今日没有什么新鲜事，可看见你，还是想说些无关紧要的话。'],
  distant:['从前见了陛下，总有说不完的话。今日竟一时寻不出话头。','臣妾也不是时时都能说笑。今日想安静些，陛下莫怪。','想了一个主意，后来又收起来了。也许改日，再说给陛下听。']},
 wistful:{
  first:['臣妾还不敢问陛下喜欢什么，只盼今日没有说错话。','听见传报时，心便乱了。陛下可否容臣妾缓一缓？','进宫前听了许多叮嘱，可此刻想说的，竟一句也不在其中。'],
  settling:['臣妾想问，陛下下回可还愿来？若这话不合礼数，便当臣妾没有问。','有时想留一盏灯，又怕显得太殷勤。陛下会不会笑臣妾？','今日的话是想了许久的，临到跟前，仍怕说得太重。'],
  familiar:['臣妾有时也会不安。如今肯说出来，是盼你听见，不是想与你争。','想念便想念了，这一回不拿旁的话遮着。陛下可愿多留片刻？','有些事明知不该计较，心里仍放不下。与其猜，臣妾想亲口问你。'],
  years:['这些年，渐渐敢问一句：你今日肯来，是想起臣妾了么？','初见时只敢谢恩，如今还想听一句真话。相处久了，心愿反倒简单。','人说旧情无需多言，臣妾却觉得，越是旧人，越不该只凭猜。'],
  distant:['旧日等着见你，如今听见脚步，却先不知该欢喜还是难过。','臣妾没有忘，只是不愿再一遍遍问。若陛下有话，今日便说罢。','窗前的花换过几季了。臣妾有些话，也已错过了最想说的时候。']},
 independent:{
  first:['臣妾还不熟宫里的日子，若举止生疏，还请容我慢慢适应。','若陛下愿听，臣妾也有自己的见解。只是初来，尚不敢贸然开口。','臣妾喜欢的东西，或许与这里不同。往后有机会，再说给陛下听。'],
  settling:['渐渐安顿下来了，臣妾想给自己留一点工夫，做些喜欢的事。','这件事臣妾想自己试试。倘若不成，再来请教也不迟。','从前不敢问，今日想问一句：臣妾可否依自己的意思办？'],
  familiar:['你若问臣妾的意思，臣妾便直说；若只要一句顺从的话，那可说不来。','今日有件事想与你商量。臣妾已想过一遍，也想听听另一种看法。','不必事事替臣妾安排。肯听臣妾自己拿主意，便很好。'],
  years:['这些年相处，想必知道臣妾不善奉承。今日仍说实话，可好？','年轻时只想证明自己，如今更愿把日子过稳。自己的主意，却仍是要留的。','从前请示一句要踌躇许久，如今想同你商量，而不只是等你吩咐。'],
  distant:['陛下肯来，礼数自然不会少。只是臣妾也有自己的日子要过。','这些年教会臣妾的，是有些心事不必逢人便说。','臣妾的想法未变。只是如今，不再急着求陛下认同了。']}
};
function consortVoicePhase(c){
  const months=Math.max(0,S.turn-(c.enteredAt??0)),visits=c.voiceVisits||0;
  if(months<6&&visits<3)return 'first';
  if(months>=24&&(c.aff<35||c.favor<20||['怨恨','惶恐'].includes(xinOf(c))))return 'distant';
  if(months>=120&&c.aff>=55&&(visits>=3||c.nights>=3||c.bond))return 'years';
  if(months>=12&&c.aff>=55&&(visits>=3||c.nights>=3||c.bond))return 'familiar';
  return 'settling';
}
function consortYearsVoice(c){
  const phase=consortVoicePhase(c),group=['骄纵','骄矜','贪财'].includes(c.trait)?'proud':['沉静','城府','持重','聪慧'].includes(c.trait)?'reserved':c.trait==='活泼'||c.trait==='好客'?'bright':['痴情','善妒'].includes(c.trait)?'wistful':['将门','爽直','淡泊','好学'].includes(c.trait)?'independent':'gentle';
  const stage={first:'初见时，她的话里还留着几分拘谨。',settling:'渐渐熟悉宫中日子，她试着多说一点自己的心意。',familiar:'私下相处渐多，她说话也不再句句斟酌。',years:'相伴多年，她省去了几句客套。',distant:'相识虽久，今日的话却隔着一层。'}[phase];
  return voiceLine('years-'+phase,stage,VOICE_YEARS[group][phase]);
}
function consortVoicePool(c){
  const x=xinOf(c),close=c.aff>=55;
  if(c.templeStay)return [voiceLine('temple-retreat','护国寺来信里，她说起清修的日子。',distantChildren(c).length?'晨钟响过，便想起孩子此时也该起了。臣妾在这里平安，还望宫中代问一声，孩子可曾添衣。':c.trait==='好学'?'寺中旧藏颇多，午后可以静坐校书。臣妾抄了几行喜欢的句子，夹在信里。':'晨起听钟，入夜收灯，日子过得慢些。臣妾在这里平安，请陛下放心。')];
  if(c.cold)return [voiceLine('cold','隔着门扉，她只说了几句。',['臣妾知道这里清冷。若还有一句话能递出去，便请陛下认真听完。','门外的声响听得分明，日子却记得模糊了。陛下可还愿听臣妾一言？'])];
  if(['悲恸','心如死灰'].includes(x))return [voiceLine('grief','她停了许久，才抬眼看你。',['有些话臣妾今日还说不出来。陛下坐一会儿就好。','不必劝臣妾快些好起来。今日能把这一盏茶喝完，也算往前走了一点。'])];
  const concern=motherConcernVoice(c);if(concern&&(c.childConcern?.value??35)>=30)return [concern];
  if(['怨恨','惶恐'].includes(x)||(c.aff<20&&consortVoicePhase(c)!=='first'))return [voiceLine('distance','她行过礼，仍立在一步之外。',['臣妾听着。只是有些话，还不知该从哪里说起。','陛下肯来，臣妾领情。只是心里的结，不是一句话就能解开的。'])];
  if(c.hp<40)return [voiceLine('ill','她将话说得很慢。',['今日精神短些，陛下别怪臣妾招呼不周。','臣妾想歇一歇。等好些了，再把没说完的话接上。'])];
  const years=newcomerVoice(c)||consortYearsVoice(c),phase=consortVoicePhase(c);
  if(phase==='distant')return [years];
  const pool=[years];const traveler=timeTravelerVoice(c);if(traveler)pool.push(traveler);const spiritual=daoLifeVoice(c);if(spiritual)pool.push(spiritual);
  if(phase!=='first')pool.push(voiceLine('trait',phase==='years'?'说着说着，她又露出你熟悉的性情。':'她试着把自己的意思说得更明白。',CONSORT_VOICES[c.trait]||CONSORT_VOICES.温婉));
  if(c.preg>=2)pool.push(voiceLine('pregnant','她轻拢衣襟，话里多了一分牵挂。',c.trait==='骄纵'&&c.favor>=65?['如今走得慢，陛下便也慢些。臣妾想要的照应，可不只是送几碟点心。','臣妾知道该惜身，可也不想日日闷着。陛下陪臣妾走到廊下，好不好？']:['小衣裳不用添得太急。臣妾盼的，只是平平安安等到那一日。','近来总会多想些。陛下坐在这里，臣妾便觉得心里稳妥。']));
  if(c.mood<35)pool.push(voiceLine('low','她望了一眼窗外，收回了目光。',['今日没什么精神，倒也不是要紧的事。陛下陪臣妾坐坐便好。','有时想说几句，又怕扫人的兴。陛下今日，可愿耐心听听？']));
  if(c.favor<25&&close)pool.push(voiceLine('miss','听见你的声音，她先是一怔。',['这院子里的花，开过一茬又一茬。臣妾也不催，只想知道陛下过得可好。','原来想说一句不曾想念，可一见陛下，便说不出口了。']));
  const memory=NPCMemory.recall(S,c.id).find(m=>m.subject==='emperor'&&['gift','jewelry-gift'].includes(m.type)&&m.emotion>0&&S.turn-m.time>=0&&S.turn-m.time<=2);
  if(memory)pool.push(voiceLine('gift','她想起近来的赏赐，微微一笑。',['那份赏赐臣妾收好了。可让臣妾高兴的，是陛下记得臣妾喜欢什么。','臣妾还记得收到赏赐时的欢喜。今日想当面再谢陛下一回。']));
  const motherChild=S.children.find(k=>k.alive&&(k.foster||k.mom)===c.id&&!k.pendingName);
  if(motherChild){const a=kidAge(motherChild),name=motherChild.name;
    pool.push(voiceLine('mother','说到孩子，她的语气不自觉地轻下来。',childHasLeftPalace(motherChild)?`${name}有了自己的日子，臣妾替孩子高兴，也难免牵挂。闲时若能带封信回来就好了。`:a<3?`${name}还这么小，日子倒像过得格外快。臣妾想把这一点一滴都记住。`:a<12?`${name}一天比一天有主意。臣妾也学着先听孩子说完，再讲自己的道理。`:`${name}渐渐长大，臣妾也不能事事替孩子拿主意。只盼有难处时，还肯回来同臣妾说。`));
  }
  const lived=c.personalExperiences?.history?.at(-1);if(lived&&S.turn-lived.turn<=6)pool.push(voiceLine('experience','她又说起前些日子那件事。',`「${lived.title}」的事，臣妾还记着。那时候的心情，与今日又不一样了。`));
  // Personal interests supplement, rather than replace, her principal temperament.
  const hobby=consortHobby(c);if(phase!=='first'&&HOBBY_VOICES[hobby])pool.push(voiceLine('hobby','她把手边的东西挪近，让你也看一看。',HOBBY_VOICES[hobby]));
  if(phase!=='first'&&QUIRK_VOICES[c.t2])pool.push(voiceLine('quirk','说着家常，她露出一点平日的小性子。',QUIRK_VOICES[c.t2]));
  if(close&&phase!=='first')pool.push(voiceLine('season','她望向窗边，随口与你说道。',[
    '春天的光来得早。臣妾想留半扇窗，不把这一点暖意都挡在外头。',
    '天热了，茶不必沏得太浓。陛下来了，坐到阴凉处说话。',
    '叶子落下来，倒把远处的天显出来了。臣妾想同陛下多看一会儿。',
    '冬日里人声近些，便觉得暖。陛下若不忙，再坐片刻。'
  ][Math.floor((S.month-1)/3)%4]));
  return pool;
}
function childVoicePool(k){
  const a=kidAge(k),who=k.sex==='f'?'她':'他',self=k.sex==='f'?'女儿':'儿臣';
  if(k.templeStay)return [voiceLine('temple-letter',a<6?'乳母从护国寺寄来起居簿。':'护国寺送来的信笺上，还带着淡淡的檀香。',a<6?'孩子饮食安稳，夜里由乳母轮值照护。请宫中亲人宽心。':`寺里的钟声晨昏都听得见。我把今日的字课夹在信里，也想问问，母亲可安好。`)];
  if(k.removedFromRoyal)return [voiceLine('new-home','府中送来了孩子的近况。',a<6?'孩子由府中乳母照护，已慢慢习惯新的住处。':'在这里也有自己的书案和灯。惦记宫中的母亲，想托人带一声问候。')];
  if(a<3)return [voiceLine('baby',a<1?'孩子在襁褓里轻轻动了动。':'孩子伸出小手，想够你的衣袖。',[])];
  if(k.jailed)return [voiceLine('confined','宗人府递来一张字笺。',`父皇，${self}在这里静思。若肯听一言，盼能容我把心里的话说完。`)];
  const mother=byId(k.foster||k.mom);
  if(mother?.alive&&(mother.cold||mother.gone))return [voiceLine('mother-away',`${who}迟疑片刻，才提起母亲。`,a<8?'父皇，我想娘了。能不能替我问问，她有没有好好吃饭？':`父皇，${self}知道母亲的处境。别的事不敢擅求，只想问一声她可安好。`)];
  if(k.hp<40)return [voiceLine('ill',`${who}说得很轻，仍想把话说完。`,a<8?'父皇，我今天没力气了。等好了再陪我玩，好不好？':`父皇，今日精神尚短，${self}想先养好身子，再来请教。`)];
  if(childHasLeftPalace(k))return [voiceLine('letter','家书里，有一段是专门写给你的。',k.married?[
    `父皇，${self}也渐渐懂得了，过日子有许多细处要学。得空还想同您说说。`,
    `离宫以后，才发觉许多事要自己商量着办。${self}会认真过日子，也盼宫中安好。`
  ]:[`父皇，外头的事与书上所读颇有不同。${self}想把见闻记下来，日后亲口说给您听。`,`宫门虽远，请安的话不敢忘。${self}在此努力，也盼父皇顾惜身子。`])];
  if(a<6)return [voiceLine('little',`${who}仰起脸，话说得很认真。`,['父皇，你蹲下来一点，我有个秘密要说。','这片叶子像小船。我想留着，你别叫人扫走。','我会自己做了。你先看着，等我说帮忙再帮，好不好？'])];
  if(k.love<25)return [voiceLine('distant',`${who}行了礼，仍有些拘谨。`,a<12?'父皇想听功课，还是……我自己的事？':`${self}不知父皇今日想问什么。若肯听，也有几句自己的话想说。`)];
  const stat=k.mar>k.lit&&k.mar>k.vir?'mar':k.lit>=k.vir?'lit':'vir';
  const spiritual=daoLifeVoice(k);if(spiritual)return [spiritual];
  const young={
    mar:['父皇，我想再试一次。这回不比谁赢，只看看自己能不能做得好些。','总叫我坐端正，可我一想到外头的马，脚就想动。'],
    lit:['父皇，书上的人怎么知道自己做的是对的？他们也会拿不定主意吗？','这个字我会写了，可意思还不大懂。你能慢慢说给我听吗？'],
    vir:['我有时也会生气，可说完重话又后悔。父皇遇到这种事怎么办？','要是两个人都觉得自己有理，是不是得一个一个听完？']
  };
  const older={
    mar:[`父皇，${self}想见一见真正的山川。弓马学了这些年，总想知道自己能做到哪一步。`,`输赢之外，${self}也想学着照应同行的人。只顾自己跑得快，算不得本事。`],
    lit:[`书中有一句，${self}近来总想不透。能说出道理，是否就一定做得到？`,`父皇，${self}想留一点自己的见解。即使不尽对，也请容我先讲完。`],
    vir:[`小时候只盼着长大，如今才知道，有些事没人替自己拿主意。${self}还想听听父皇当年怎样过来的。`,`父皇，${self}想把答应过的事做好。别人未必记得，自己却不该忘。`]
  };
  return [voiceLine(`study-${stat}`,`${who}放下手边的事，主动与你攀谈。`,a<12?young[stat]:older[stat])];
}
function characterVoice(person,mode='greeting'){
  if(!person?.alive||person.gone||person.pendingName)return null;
  const pool=person.sex?childVoicePool(person):consortVoicePool(person);
  const preferYears=!person.sex&&pool.some(v=>v.key.startsWith('years-'))&&((person.voiceVisits||0)%2===0||person.voicePhase!==consortVoicePhase(person));
  const candidates=preferYears?pool.filter(v=>v.key.startsWith('years-')):pool;
  const options=candidates.flatMap(item=>item.lines.length?item.lines.map(text=>({item,text})):[{item,text:''}]);
  const fresh=options.filter(v=>!(person.voiceRecent||[]).includes(v.text));
  const {item,text}=voicePick(person,fresh.length?fresh:options,'topic',mode);
  return {key:item.key,stage:item.stage,text,letter:!!(person.sex&&childHasLeftPalace(person))};
}
function characterVoiceHTML(person){
  const v=characterVoice(person);if(!v)return '';
  return `<aside class="character-voice" aria-label="${v.letter?'家书一角':'人物心声'}"><small>${esc(v.stage)}</small>${v.text?`<blockquote>“${esc(v.text)}”</blockquote>`:''}</aside>`;
}
function rememberConversation(person,voice,location){
  person.voiceVisits=(person.voiceVisits||0)+1;
  person.voiceRecent=[...(person.voiceRecent||[]),voice.text].slice(-8);
  if(!person.sex)person.voicePhase=consortVoicePhase(person);
  NPCMemory.record(S,{type:'personal-conversation',time:S.turn,location,participants:[person.id],outcome:voice.text||voice.stage},[
    {person:person.id,subject:'emperor',interpretation:`${voice.letter?'父皇回信':'陛下听我说话'}：${voice.text||voice.stage}`,emotion:.5,impact:40}
  ]);
}
