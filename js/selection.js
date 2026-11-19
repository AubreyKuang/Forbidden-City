/* Selection audiences and the first months at court. Rendering never rolls a new personality. */
function selectionSkipTimingActive(){return journalContentVersion()>=54;}
function selectionLogTurn(date){
 if(typeof date!=='string'||!date.startsWith(E().era))return null;
 const suffix=date.slice(E().era.length),split=suffix.indexOf('年'),month=MONTHS.indexOf(suffix.slice(split+1))+1;
 if(split<0||!month)return null;
 for(let year=1;year<=S.year;year++)if(suffix.slice(0,split)===(year===1?'元':cnNum(year)))return S.turn-(S.year-year)*12-S.month+month;
 return null;
}
function selectionLastHeldTurn(){
 const last=S.flags.lastXX??-99;
 if(!selectionSkipTimingActive()||last<0||S.flags.selectionClockGen===S.gen)return last;
 // Old builds wrote the same clock for a real selection and February's refusal.
 // Repair only when the retained chronological log proves what actually ran.
 if(((S.month-1-(S.turn-last))%12+12)%12!==1)return last;
 const held=S.log.filter(e=>e.t.endsWith('，开选秀，各地秀女入宫待选。')).map(e=>selectionLogTurn(e.d)).filter(t=>t!==null&&t<=S.turn);
 if(held.length){const latest=Math.max(...held);return latest<last?latest:last;}
 const complete=S.log.some(e=>e.d.startsWith(E().era+'元年')&&/新帝.*登基/.test(e.t));
 return complete?-99:last;
}
function reconcileSelectionTiming(){
 if(!S||!selectionSkipTimingActive()||PalaceActions.blocked||S.flags.selectionClockGen===S.gen)return;
 const previous=S.flags.lastXX,last=selectionLastHeldTurn();
 if(previous>=0&&last!==previous)S.flags.lastXXSkipped=previous;
 S.flags.lastXX=last;S.flags.selectionClockGen=S.gen;
}
function selectionFreeReady(){
 const last=selectionLastHeldTurn(),skipped=last!==S.flags.lastXX?S.flags.lastXX:S.flags.lastXXSkipped;
 return S.turn-last>=36||selectionSkipTimingActive()&&Number.isFinite(skipped)&&skipped>last&&skipped<=S.turn;
}
function scheduledSelectionEvent(){
 if(!selectionSkipTimingActive())return null;
 if(S.month!==2||S.turn-selectionLastHeldTurn()<34||S.turn-(S.flags.lastXXSkipped??-99)<12||!newConsortEventAllowed())return null;
 const turn=S.turn,gen=S.gen;let done=false;
 const valid=()=>!done&&!S.over&&S.gen===gen&&S.turn===turn&&S.turn-selectionLastHeldTurn()>=34&&S.turn-(S.flags.lastXXSkipped??-99)>=12&&!S.cands.length;
 return {title:'三年大选',sfx:'chime',valid,text:'礼部奏请举行大选，可传各地秀女入宫候选。若今年停办，不计作已经选秀，日后仍可自行下旨。',choices:[
  {t:'前去看看',f:()=>{if(!valid())return null;done=true;genCands();UI.view='xx';return null;}},
  {t:'今年免了',f:()=>{if(!valid())return null;done=true;reconcileSelectionTiming();S.flags.lastXXSkipped=S.turn;log('今年停办选秀，未开选、未计入上次选秀日期。');return '礼部奉旨停办本年的大选，未重置选秀间隔。'+fx(chg({people:2}));}}
 ]};
}
function entryManner(c){
  if(isSolitary(c))return 'solitary';
  if(c.scheme>=60||['聪慧','持重','城府'].includes(c.trait))return 'careful';
  if(['骄纵','活泼','爽直','将门'].includes(c.trait)&&c.scheme<45)return 'bold';
  if(['淡泊','沉静'].includes(c.trait))return 'quiet';
  return 'nervous';
}
// Keep the gesture and answer together when revisiting an audience.
const SELECTION_GREETINGS={
  温婉:[
    ['帘角勾住了引路宫人的袖子。她托起帘子，等人抽回手才进殿。','方才那位姑姑一路走得慢，臣女才有工夫把气喘匀。多谢她了。'],
    ['她行了礼，见引路的小宫人还绷着肩，便朝她轻轻点了点头。','在外头等的时候，臣女也怕背错。如今见陛下肯等臣女把话说完，心里就安了。']],
  骄纵:[
    ['她行完礼还站在原处，见引礼人要退，赶紧又往前挪了半步。','陛下这就看完了么？臣女还留着一样拿手的呢。'],
    ['她把发间那朵绢花转了个方向，让颜色最亮的一瓣朝前。','为了挑这一朵，臣女今早险些误了时辰。陛下也瞧一眼，好不好？']],
  骄矜:[
    ['她报过姓名，把最后一个字念得很清楚，等执笔的人记下才敛袖。','陛下若问臣女有何长处，请容臣女亲自献上一样。旁人替臣女说好，终究轻了。'],
    ['她把袖缘理平，只戴一支簪子，行礼时簪尾纹丝未动。','这支素簪是臣女自己挑的。今日殿里好颜色多，臣女这样也可以见人。']],
  聪慧:[
    ['她留意到引礼人每次都先望一眼御案，待笔声停下，恰好报上姓名。','起初臣女以为该听脚步，后来才听明白，执笔的人记完了，才轮到臣女答。'],
    ['她应声上前。方才还须嬷嬷示意的两处停步，这回她自己走对了。','嬷嬷领臣女走了一遍。记住转身时朝着哪扇窗，脚下两步也就记住了。']],
  善妒:[
    ['名册上挨挨挤挤写着字。她瞥了一眼，报名字时尾音扬得分外清楚。','臣女一眼便认出了自己的名字。陛下往后翻开这本册子，还会认得是哪一个么？'],
    ['她行过礼，见御案上还摊着名册，目光在纸角停了一瞬。','执笔的姑姑说，入了册子就都一样了。可隔着一层纸，陛下怎么听得出是谁在说话呢？']],
  淡泊:[
    ['她等檐下一阵鸟鸣过去，才在引礼人的示意下往前走。','臣女在廊下听那鸟叫了半日，认出了三种调子。今日倒也没白等。'],
    ['她鬓边只簪了一朵小花，行礼时落下一瓣，便顺手拈在掌心。','开到今日，恰巧赶上臣女戴它来。过了今日，就让它好好谢罢。']],
  活泼:[
    ['她进门先往梁上看了一眼，随即收回目光，眼角的笑还没藏好。','这梁上原来画着燕子！臣女在外头只望见个尾巴，猜了一早上。'],
    ['她听见自己请安的声音在殿里轻轻一响，忍不住抿嘴笑了。','臣女练问安的时候可没这一声回音。方才差点回头，看看谁跟臣女学。']],
  城府:[
    ['她听引礼人把家世一项项念完，只在念到自己名字时抬了眼。','名册上已有的，臣女就省下了。陛下还想知道哪一件？'],
    ['她行礼起身，手指一直松松搭在袖口，听清问话才抬头。','方才在外头，人人都猜陛下会问什么。臣女想着，还是等听见了再答得好。']],
  痴情:[
    ['引礼人报了她的名字，她答过一声，仍望着御座，像在等另一个人开口。','臣女还有个小小的心愿，想亲耳听陛下唤一声臣女的名字。'],
    ['她进殿时步子很稳，听到御座上传来一句问候，反倒低下了头。','来时想了许多话。陛下开口问的这一句，臣女倒想带回去，慢慢再想。']],
  体弱:[
    ['她在殿门口略停了半步，把呼吸调匀，亲自行完了礼。','方才那几级台阶，臣女得走慢些。如今气息匀了，陛下请问。'],
    ['宫人伸手来扶，她借了半步力，站稳便轻声道谢。','臣女若说得慢，还请陛下多等一息。要说的话，臣女自己说得完。']],
  将门:[
    ['她立定时两脚落得极稳，抱拳的手抬到一半，才改作宫礼。','平日在校场见礼见惯了，一时顺了手。容臣女把这道礼重新行过。'],
    ['她走过石阶，在殿前稳稳收住步子，裙摆晃了两下才停。','这段路走得比骑马还费心。马背上只管看前头，今日还得记着裙角。']],
  才女:[
    ['她立在匾额下，轻轻念了一个字，行礼时才把后半句收住。','臣女方才在想，匾上这个字若入了诗，该搁在句尾。念到那里停一停，才有余味。'],
    ['她行完礼，听檐铃一长一短地响，指尖在袖中按了两拍。','进门时恰好听见这么两声。倘若谱成曲，臣女想从后一声起。']],
  贪财:[
    ['她的目光随引礼人袖上的金线走了一寸，被瞧见了，也大方认了。','臣女爱看金线绣的花。这样细的一缕，能把一整片衣袖都映亮。'],
    ['她拨正鬓边的银簪，簪头磨得光亮，式样却不新了。','挑簪子时臣女总先掂分量。这支足银的，戴了这些年，眼下还是最舍不得换。']],
  沉静:[
    ['她行完礼，没有急着填补殿里的静默。御案上的笔搁下，她才开口。','方才有一笔迟迟没落下，臣女怕开口扰了陛下的思路。'],
    ['殿门半开着，风吹得帘影一动一动。她候在那里，唤到名字才上前。','等得不久。那扇窗正对着一竿竹，臣女看着竹影，倒没留心过了多久。']],
  爽直:[
    ['她挺直背行了礼，话到了嘴边，索性笑着说了出来。','要说不紧张，是哄陛下的。臣女手心全是汗，可也当真想来见陛下。'],
    ['她听见引礼人夸她样样都好，摇了摇头，随即上前请安。','嬷嬷疼臣女，把话说满了。臣女也有拿不出手的，只敢献一样练过的。']],
  持重:[
    ['她先看清砖缝间标出的站位，再收步行礼，一步也没抢。','来时嬷嬷嘱咐，拿不准就在原处等一等。臣女记下了，免得自己一步走急，后面的人都乱了。'],
    ['她把请安的话说得很清楚，到该停的地方便停下，等候问话。','陛下若考臣女，请容臣女想一想再答。仓促应了，回头改口，倒耽搁得更久。']],
  好客:[
    ['她把帘子交回宫人手里，回头向廊下一直没开口的小宫人笑了笑。','那位小姑姑在风口站了许久。臣女带着一壶热茶，待会儿路过，想分她一盏。'],
    ['她进殿时还带着笑意，方才候见的地方也传来一声低笑。','等着也是等着，臣女就同身旁的人通了姓名。这回出门见了面，总算叫得出人了。']],
  巧手:[
    ['她袖边的盘扣松了，指尖一送一绕，没等宫人上前便扣齐了。','这扣眼大了一线。眼下先这样绕住，回去补两针，便能扣得牢了。'],
    ['她将自己的衣带收短了一指，把多出的一截藏进结里。','这结看着紧，牵这头就能松开。陛下若想看，臣女可以慢些再结一回。']],
  好学:[
    ['她行过礼，又看了一眼嬷嬷收手的姿势，照着在袖中比了一回。','嬷嬷方才教臣女，退步以前先收袖。臣女试过了，果然不会绊着。还想问一句，这礼是怎么来的？'],
    ['她手里攥着一张折小的纸，临进殿才收回袖中。','路上听见几个生字，怕混了，先记个音。等回去请教清楚了，才敢把字填上。']]
};
// A guarded candidate can still sound proud, jealous, or lively without speaking out of turn.
const GUARDED_GREETINGS={
  骄纵:['她等引礼人退到一旁，才将发间的绢花轻轻扶正。','陛下若还有片刻闲暇，臣女也备了一样东西。等陛下看过，再评它好不好。'],
  活泼:['她瞥见帘角绣着一只倒挂的蝙蝠，忍住笑，等问完了安才抬头。','方才差点把那只蝙蝠认成了真的。臣女还在想，它倒比臣女自在，进来就寻着地方歇了。'],
  爽直:['她把到了嘴边的话停了一停，待御座上问起，才直视前方。','陛下既问臣女怕不怕，臣女就照实说，怕。可若今日没来，回去一定更懊恼。'],
  将门:['唱礼声刚落，她才从砖缝前迈出半步，站得笔挺。','骑马要听号，殿前要听礼。臣女初来，先把这一声听真切了。'],
  善妒:['她没朝名册多看，只在御案边的笔重新蘸墨时，轻轻抬起眼来。','陛下若有想问的，臣女愿当面答。只看册子上那一行，怕臣女和旁人都差不多。']
};
const SOLITARY_GREETINGS={
  letters:['她把夹着纸签的小册收好，独自上前行礼。','方才等候时，臣女给一首旧诗换了个字。且留着，夜深独自念一遍，才知道好不好。'],
  dao:['她在帘外静立片刻，待呼吸平定，才从容行礼。','清早独坐的时候，臣女听得见自己的呼吸。方才人声再杂，记起那一刻，心里也就定了。'],
  both:['她合上袖中那页诗稿，待人声渐静，才抬头应话。','臣女独坐时也写诗。有时静了半日，只肯写下一句，自己读着倒很快活。']
};
// Each row follows what the player just saw: a second attempt, a practiced skill, or mastery.
const SELECTION_PERFORMANCES={
  读书:[
    ['她背到半句忽然停住，翻开书核了一眼，把前后两句重新念了一遍。','臣女方才把两句接反了。把上句还给上句，后头那层意思才说得通。'],
    ['她翻出折了角的一页，念完一段，手指还停在其中一句上。','这一页臣女折过角。头一遍读觉得有理，隔日再读，倒多了个疑问。'],
    ['她把同一段文章念了两遍，第二遍多念了一句，前头那句竟听出了另一层意思。','若只念到这里，倒像是在责人。请陛下再听下一句，写书的人也把自己算进去了。']],
  抚琴:[
    ['她弹到换指处，弦音猝然断了。她没从头再来，只把那几拍接了起来。','方才散了一声，是臣女的指头松早了。请听这一句，到这里才该放。'],
    ['她试过弦，弹了一支短曲。最熟的那几拍，已用不着低头去看。','曲子只这一小段弹得熟。弹到末了，臣女还舍不得把手收回去。'],
    ['最后一个音落下，她的手已离弦，殿里却还听得到极轻的一点回响。','末尾这根弦，臣女留着没按。等它自己静下来，这支曲子才算完。']],
  刺绣:[
    ['她展开绣面，一截线头绊在了小指上。她将绣绷侧过来，找到了漏下的那一针。','这瓣花翻过来便露了线头。容臣女把针从这儿收进去。'],
    ['她把小屏转了半圈。同一丛叶子，两面照到光时深浅便有了区别。','这一角的叶子用的同一色线，只换了个走针的方向。陛下侧着看，便分得出来。'],
    ['她把绣屏举到窗前。日光一过，水面上竟像浮起几道细细的波纹。','这片水面没用白线。针脚往旁边让一丝，绢底自己便透出光来。']],
  侍花:[
    ['她拈起一枝花，一片嫩叶被压弯了。她松开指尖，换了个地方托住枝条。','臣女方才捏得紧了。托着枝条的下端，才不会碰伤那颗新芽。'],
    ['她将两片小叶轻轻分开，好让人看清枝上可以移栽的位置。','这枝还没到剪的时候。等下面那对小叶长开，再移也不迟。'],
    ['她托起花盆，拨开几片老叶。最不起眼的地方，果然藏着一粒新绿。','要看它活没活稳，别只数花苞。瞧这儿，新芽已经从老枝底下冒出来了。']],
  做点心:[
    ['她揭开糕模，一瓣花黏在模底。她将余下的糕搁了搁，再磕出来便齐整了。','这一块揭得早了些，花瓣缺了个角。等它凉一凉，再从边上轻轻敲。'],
    ['她把花糕从中切开，两半摊在碟上，中间露出薄薄的一层馅。','臣女喜欢把中间的馅做薄些。第一口就能尝见花香。'],
    ['糕才掰开，一缕热气就从断口散了出来，外层成了形，内里仍松软。','陛下可以掰开看，里头还润着。若等糕面全干了才撤火，这一口便迟了。']],
  投壶:[
    ['箭磕在铜沿上，落在壶旁。她把箭拾起，在原来的位置又试了一投。','方才松手迟了，箭擦着壶沿。臣女这回把手放低些。'],
    ['她站定片刻才出手，箭打着壶口转了半圈，落了进去。','臣女只盯着壶口。去想旁人看不看，箭便要偏了。'],
    ['箭落进壶腹，只有轻轻的一声。她将第二支也投进去，两回声响几乎一样。','箭离手就知道偏不偏了。陛下瞧，落得正的时候，壶沿是没有响声的。']],
  骑射:[
    ['她接过未上弦的弓，一抬臂，脚下先晃了晃。她退回原处，重新立定。','方才两脚站得近，一抬弓身子便晃了。容臣女重站一步。'],
    ['她把未上弦的弓横过来，侧身立好，示意众人看肩与臂的位置。','这张弓虽没上弦，也看得出站得稳不稳。陛下请看臣女的左肩。'],
    ['她持着未上弦的弓缓缓转身。脚下换了方向，弓梢始终稳在同一高度。','执弓的手若攥得发白，反倒不稳。臣女给陛下慢慢做一回，手松，弓身也能正。']],
  对弈:[
    ['她往盘上摆了几步，指尖忽然悬住，又把最近的一颗子拾了起来。','臣女漏看了这颗子。容臣女把方才那步收回来，再往下摆。'],
    ['她摆出一盘残棋，将棋盘轻轻转了半圈，把另一边的棋形让给人看。','臣女起先只顾着救这一块。换到对面坐了一回，才瞧见这条路。'],
    ['她落下一颗看似无援的子，便把棋盒推了过来，请人替对面应手。','这一子看着白送了。陛下若肯收，再走两步，右边那片就出不去了。']],
  品茶:[
    ['她斟满第一盏，才发觉第二盏的颜色重了些。她另取两盏，重新分茶。','方才斟得急了，两盏一深一浅。容臣女重新分过。'],
    ['她将茶盏放稳，把杯盖稍稍错开一线，清香这才慢慢散出来。','陛下先闻闻杯盖。臣女喜欢的那点清香，入口倒比闻着还淡。'],
    ['她连分两盏，一盏先奉到御前，一盏稍留片刻，让人尝同一泡茶的两种滋味。','这一盏请陛下稍候再饮。热时只有茶香，温下来，舌根才尝得出甜。']]
};
function selectionSpeech(c){
  const manner=entryManner(c),hobby=consortHobby(c);
  const voices=SELECTION_GREETINGS[c.trait]||SELECTION_GREETINGS.持重;
  const special=manner==='solitary'?SOLITARY_GREETINGS[c.solitary.path]:manner==='careful'&&GUARDED_GREETINGS[c.trait];
  const [stage,line]=special||voices[voiceHash(`audience:${c.seed}:${c.id}`)%voices.length];
  const tier=c.talent<40?0:c.talent>=70?2:1;
  const [talent,reply]=(SELECTION_PERFORMANCES[hobby]||SELECTION_PERFORMANCES.读书)[tier];
  const blurt=travelerSelectionBlurt(c);
  return {manner,stage:blurt?.stage||stage,line:blurt?.line||line,talent,reply};
}
function selectionCurrent(){
  const session=S.selection;
  if(!S.cands.length||session?.phase==='roster')return null;
  return S.cands.find(c=>c.id===session?.current)||S.cands[0];
}
// A selection has one durable cohort, even if the last candidate has been dismissed.
function selectionBatch(){
  S.selection||={phase:'roster',performed:[]};
  const s=S.selection;
  if(!s.batch){S.flags.selectionSerial=(S.flags.selectionSerial||0)+1;s.batch=`${S.gen}:${S.turn}:${S.flags.selectionSerial}`;s.date=dateStr();}
  s.accepted||=[];
  return s;
}
function reconcileSelection(){
 const s=S.selection;if(!s)return;
 const gen=Number(s.batch?.split(':')[0]);
 if(Number.isFinite(gen)&&gen!==S.gen){delete S.selection;S.cands=[];}
}
function sameSelectionCohort(a,b){return !!(a!==b&&a?.selectionCohort?.id&&a.selectionCohort.id===b?.selectionCohort?.id);}
function cohortAffinity(a,b){
  return sameSelectionCohort(a,b)&&socialPair(a,b)&&!isRival(a,b)&&!isRival(b,a)&&relGet(a,b)>=0&&consortCompatibility(a,b)>=0;
}
// Many temperaments arrive nervous; each still shows it in her own way.
const NERVOUS_REACTIONS={
  温婉:'她谢过恩，先回身扶起跪得久了的同伴，才随宫人出殿。一路上低声向引路的姑姑道谢。',
  好学:'她把位分与宫规一条条默记在心，出殿时还向嬷嬷问清了几处不认得的宫名。',
  体弱:'她跪得久了，起身时晃了一下，被宫人扶住。她轻声道了谢，仍把脊背挺得笔直。',
  贪财:'她听清了位分，又悄悄打听每月的份例几何，心里算清楚了，才松下一口气。',
  才女:'出殿时她回望了一眼殿中悬着的匾额，默念了两遍上头的字，才跟上引路的宫人。',
  痴情:'名字留下的那一刻，她抬眼望了御座一眼，又慌忙垂下，耳根红了一路。',
  巧手:'她把方才紧张时揉皱的帕子悄悄抚平叠好，出了殿门才长长舒了一口气。',
  善妒:'她向同来的几人一一道喜，笑意只到嘴角，出殿前又回头看了一眼名册上各人的位分。',
  好客:'一出殿门，她便拉着同来的几人互道住处，约好得空时彼此走动。',
  骄矜:'她谢恩时仪态一丝不乱，出了殿门才悄悄问身边宫人，自己的位分在同批中排第几。'
};
function newcomerReaction(c){
  if(whiteSpringAdmirationActive()&&c.whiteSpringFriend?.admission!=null){
    return '她收拾好了箱笼，仍忍不住想笑。'+(whiteSpringResident(S.consorts)?'进了宫，终于可以等一个合礼的日子、当面向阿依慕问安。':'从前只听娘家人讲白泉的事，如今真留了下来，她盼以后有机会当面见见阿依慕。');
  }
  return {
    solitary:'她向同来的几人依礼道别，将书匣交给宫人，独自认了回宫的路。有人邀她晚间闲坐，她温言辞谢，并无怠慢之意。',
    careful:'她将名册上的位分与各宫住处听得仔细，先请教了明日请安的次序，才松开一直捏着的袖边。',
    bold:'她听清封位便抬起眼，谢恩的声音清亮。转身时又回望了一眼殿门，盼着往后还能常被记起。',
    quiet:'她随宫人走过长廊，瞧见窗外的一枝新绿，脚步便慢下来。行李里那卷旧书，终于有地方安放了。',
    nervous:NERVOUS_REACTIONS[c.trait]||'直到名册合上，她才确信自己的名字留了下来。走出殿门时眼眶微红，悄悄向同来的几人点了点头。'
  }[c.entryAdjustment?.manner||entryManner(c)];
}
function selectionSummary(admissions,total=admissions.length){
  return `选秀定榜，共留选${total}人入宫。${admissions.map(({name,rank})=>`${name}封${rank}`).join('、')}。`;
}
function selectionInitialRank(c){
  const admission=/选秀入宫，封为([^，。]+)，赐居/;
  return c.story.find(entry=>admission.test(entry.t))?.t.match(admission)?.[1]??RANKS[c.rank];
}
function selectionChronicle(entries){
  let admissions=[];
  return entries.flatMap(entry=>{
    if(entry.t.endsWith('，开选秀，各地秀女入宫待选。')){
      admissions=[];
      return [{...entry,b:0}];
    }
    const admission=entry.t.match(/^(.+?)（.*之女）.*选秀入宫，封([^。]+)。$/);
    if(admission){
      admissions.push({name:admission[1],rank:admission[2]});
      return [];
    }
    if(entry.t.startsWith('选秀定榜，')||entry.t==='选秀礼毕，本次未留新人。')admissions=[];
    const total=entry.t.match(/^选秀礼毕，留选(\d+)人。可到储秀宫查看新妃安顿。$/);
    if(total){
      const roster=admissions;
      admissions=[];
      if(roster.length)return [{...entry,t:selectionSummary(roster,+total[1]),b:1}];
    }
    return [entry];
  });
}
function rememberDroppedKin(s,c){
 if(!s||journalContentVersion()<81||!(c.fatherId||c.house?.father||Object.keys(c.kin||{}).length))return;
 const departed=s.departedKin||=[];
 if(!departed.some(p=>p.id===c.id))departed.push({id:c.id,sur:c.sur,given:c.given,age:c.age,fatherId:c.fatherId??c.house?.father?.id,
   kin:{...c.kin},kinRival:{...c.kinRival},willing:c.willing});
}
function rosterSister(c,p){
 const direct=c.kin?.[p.id],reverse=p.kin?.[c.id];
 if(KIN_TXT[direct])return KIN_TXT[direct];
 if(KIN_TXT[reverse])return KIN_TXT[reverse[0]+(reverse[1]==='姐'?'妹':'姐')];
 const id=p.fatherId??p.house?.father?.id;
 const same=id!=null&&(c.fatherId===id||c.house?.father?.id===id);
 if(!same&&!c.house?.father?.siblingFatherIds?.includes(id))return '';
 return KIN_TXT[(same?'亲':'堂')+(p.age>c.age||p.age===c.age&&p.id<c.id?'姐':'妹')];
}
function selectionKinNews(s,members,remaining){
 if(journalContentVersion()<81)return;
 const kept=new Set(members.map(c=>c.id)),roster=new Map([...(s?.peerDeparted||[]),...(s?.departedKin||[]),...remaining,...members].map(c=>[c.id,c]));
 for(const c of S.consorts.filter(c=>c.alive&&!c.gone&&!c.maid)){
  const news=[];
  for(const p of roster.values()){
   if(p.id===c.id||kept.has(p.id)&&p.sisterArrivalRecorded&&c.kin?.[p.id])continue;
   const kin=rosterSister(c,p);if(!kin)continue;
   const retained=kept.has(p.id),name=kin+fullName(p),rival=isRival(c,p)||isRival(p,c)||relGet(c,p)<=-25;
   let mood,feeling,line;
   if(retained&&rival){mood=-5;feeling='忧心';line='礼数上该道喜，可往后抬头不见低头见，我担心家中那些旧话又被人提起。';}
   else if(retained){mood=6;feeling='欢喜';line='从前隔着宫门惦记，如今总算能见面了。我还记得自己头一次请安时走错了门，想先把这事告诉她。';}
   else if(rival){mood=2;feeling='释然';line='听到她回家的消息，我松了口气。托人回家只说她一路平安，别在她面前再议这张榜。';}
   else if(p.willing===false){mood=3;feeling='释然';line='她本就不愿留宫。虽舍不得，也替她高兴，盼她回家过自己想过的日子。';}
   else{mood=-4;feeling='思念';line='原想若能留下，往后便有人一起说家常。如今只盼家里别拿这次落选说她，等她到家报声平安。';}
   const fact=name+(retained?'留选，初封'+selectionInitialRank(p):'此次未留选，归家');
   news.push({fact,mood,feeling,id:p.id});
   story(c,'【选秀 · 姐妹定榜】'+fact+'。'+line);
  }
  if(!news.length)continue;
  const delta=news.reduce((v,n)=>v+n.mood,0);cchg(c,{mood:delta});
  const main=news.reduce((a,b)=>Math.abs(a.mood)>=Math.abs(b.mood)?a:b);
  if(!['悲恸','心如死灰'].includes(xinOf(c)))setXin(c,main.feeling,news.map(n=>n.fact).join('；'),main.id,{record:false});
 }
}
function finishSelection(){
  const s=S.selection;
  if(s?.phase==='arrivals'||(!s&&!S.cands.length))return false;
  const members=(s?.accepted||[]).map(byId).filter(Boolean);
  if(journalContentVersion()>=81)for(const c of members)familyAdmissionReactions(c,true);
  selectionKinNews(s,members,S.cands);
  if(selectionNiecesActive())for(const c of S.cands)recordSelectionNiece(c,'lost',s);
  if(s)delete s.departedKin;
  if(outerIntegration())for(const c of S.cands)outerSelectionDismissed(c);
  S.cands=[];
  if(!members.length){finishSelectionCourt(s,[]);delete S.selection;log('选秀礼毕，本次未留新人。');return true;}
  s.phase='arrivals';s.finishedAt=S.turn;
  for(const c of members){
    c.selectionCohort={id:s.batch,date:s.date,turn:S.turn};
    if(c.entryAdjustment)c.entryAdjustment.pendingBatch=false;
    if(!inPalace(c))continue;
    c.entryAdjustment.reaction=newcomerReaction(c);
    story(c,`【选秀礼毕】同批留选共${members.length}人。${c.entryAdjustment.reaction}`);
  }
  // At most two new acquaintances each; ceremony attendance never erases a feud.
  const pairs=[],counts={};
  for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
    const a=members[i],b=members[j];
    if(inPalace(a)&&inPalace(b)&&cohortAffinity(a,b))pairs.push({a,b,order:R()});
  }
  pairs.sort((a,b)=>a.order-b.order);
  for(const {a,b} of pairs){
    if((counts[a.id]||0)>=2||(counts[b.id]||0)>=2)continue;
    const shared=sharedConsortHobby(a,b),p=Math.min(.8,.4+consortCompatibility(a,b)*.025+(Math.abs(a.age-b.age)<=4?.1:0));
    if(!chance(p))continue;
    relAdd(a,b,10);counts[a.id]=(counts[a.id]||0)+1;counts[b.id]=(counts[b.id]||0)+1;
    const activity=shared?`说起彼此都喜欢${shared}，约好安顿后再叙`:'一同记下请安的时辰与宫门的方向，约好日后照应';
    for(const [c,o] of [[a,b],[b,a]]){
      const line=`【同批入宫】与${fullName(o)}一同留选，${activity}，陌生的宫里多了一个相识的人。`;
      c.entryAdjustment.acquaintances||=[];c.entryAdjustment.acquaintances.push(o.id);story(c,line);
    }
    NPCMemory.record(S,{type:'selection_cohort',time:S.turn,location:'储秀宫',participants:[a.id,b.id],outcome:activity},
      [[a,b],[b,a]].map(([c,o])=>({person:c.id,subject:o.id,emotion:.55,impact:55,interpretation:`与${fullName(o)}同批入宫，${activity}。`})));
  }
  finishSelectionCourt(s,members);
  if(journalContentVersion()>=41)log(selectionSummary(members.map(c=>({name:fullName(c),rank:selectionInitialRank(c)}))),1);
  else log(`选秀礼毕，留选${members.length}人。可到储秀宫查看新妃安顿。`);
  return true;
}
function selectionCohortHTML(c){
  if(!c.selectionCohort)return '';
  const peers=S.consorts.filter(o=>sameSelectionCohort(c,o));
  return `<div>入宫同批 · ${esc(c.selectionCohort.date)}${peers.length?' · '+peers.map(o=>`${parentLink(o.id)}${!o.alive?'（已故）':''}`).join('、'):' · 本批仅她一人留选'}</div>`;
}
function selectionArrivalsRecent(){
  const s=S.selection;if(s?.phase!=='arrivals')return false;
  const started=Number.isFinite(s.finishedAt)?s.finishedAt:(s.accepted||[]).map(byId).find(c=>Number.isFinite(c?.selectionCohort?.turn))?.selectionCohort.turn;
  return Number.isFinite(started)&&S.turn>=started&&S.turn-started<2;
}
function viewSelectionArrivals(){
  const members=(S.selection?.accepted||[]).map(byId).filter(Boolean);
  return `${selectionDiscussionPanel()}<section class="story-scene selection-scene"><header><p>储秀宫 · ${esc(S.selection.date||'选秀礼毕')}</p><h2>新妃安顿</h2></header><div class="acts"><button class="btn" onclick="A.go('harem')">回后宫</button><button class="btn gold" onclick="A.xxDecree()">重新选秀</button></div></section>
    <p class="hint">本批名单已定，共留选 ${members.length} 人。安顿页保留本月和下月；此后仍可在人物纪事中回看入宫经历。也可随时重新选秀，未满三年仍有国库与民心代价。</p>
    <div class="grid portrait-grid">${members.map(c=>`<article class="card" style="display:block"><div class="row">${porImg(c,76)}<div><h3>${esc(fullName(c))}</h3><p>${esc(c.palace)} · ${esc(c.trait)} ${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}</p></div></div>
    <p>${esc(c.entryAdjustment?.reaction||'她的留选记在这一批名册中。')}</p>
    ${(c.entryAdjustment?.acquaintances||[]).length?`<p class="hint">一同入宫时相识：${c.entryAdjustment.acquaintances.map(id=>parentLink(id)).join('、')}。</p>`:''}
    <div class="acts">${!inPalace(c)?'<span class="hint">目前不在宫中</span>':c.entryAdjustment?.settled?'<span class="tag g">已问候</span>':S.turn-c.entryAdjustment?.turn>=6?'<span class="hint">已渐渐住惯</span>':`<button class="btn gold sm" onclick="A.xxWelcome(${c.id})">去问候她</button>`}<button class="btn sm" onclick="A.go('consort',${c.id})">人物纪事与近况</button></div></article>`).join('')}</div>
`;
}
A.xxWelcome=function(id){if(modalOpen)return;const c=byId(id);if(c)pushEv(newcomerWelcomeEvent(c));};
function viewSelectionAudience(){
  const c=selectionCurrent();if(!c)return '';
  const speech=selectionSpeech(c),shown=S.selection?.performed?.includes(c.id),whiteSpring=whiteSpringSelectionHint(c);
  return `<section class="selection-audience selection-scene" aria-label="秀女觐见"><header><div><p>储秀宫 · 依次觐见</p><h2>${esc(fullName(c))}</h2><p>${c.age}岁 · ${esc(c.fam.t)}之女</p>${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}</div><button class="btn sm" onclick="A.xxRoster()">直接看名册</button></header>
    <div class="audience-body"><div class="audience-portrait">${porImg(c,210)}</div><div class="audience-dialogue"><p>${esc(shown?speech.talent:speech.stage)}</p><blockquote>“${esc(shown?speech.reply:speech.line)}”</blockquote>${whiteSpring?`<p>${esc(whiteSpring)}</p>`:''}<p class="hint">${esc(pastLifeSelectionHint(c))}</p>${portraitResemblanceHint(c)?`<p class="hint">${esc(portraitResemblanceHint(c))}</p>`:''}<p class="hint">${esc(c.kinNote||'')} ${shown?'已看过才艺，可继续觐见或回名册留选。':'可听她展示所长，再统一决定留谁。'}</p>${selectionNieceArrivalNote(c)}</div></div>
    <footer><span>${S.cands.indexOf(c)+1} / ${S.cands.length} 位候选</span><div class="acts">${whiteSpringSelectionButton(c)}<button class="btn" onclick="A.xxPerform(${c.id})" ${shown?'disabled':''}>展示才艺 · ${esc(consortHobby(c))}</button><button class="btn gold" onclick="A.xxNext(${c.id})">${S.cands.indexOf(c)===S.cands.length-1?'看完，回名册留选':'请下一位'}</button></div></footer></section>${selectionDiscussionPanel()}`;
}
A.xxRoster=function(){if(modalOpen)return;S.selection={...(S.selection||{}),phase:'roster'};save('auto');render();};
A.xxMeet=function(id){if(modalOpen||!S.cands.some(c=>c.id===id))return;S.selection={...(S.selection||{}),phase:'audience',current:id};save('auto');render();};
A.xxPerform=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;S.selection||={};S.selection.performed||=[];if(!S.selection.performed.includes(id))S.selection.performed.push(id);save('auto');render();};
A.xxNext=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;const i=S.cands.findIndex(c=>c.id===id);S.selection||={};S.selection.current=S.cands[i+1]?.id;S.selection.phase=i+1<S.cands.length?'audience':'roster';save('auto');render();};
function newcomerWelcomeEvent(c){
  const arrival=c.entryAdjustment;
  if(!arrival||arrival.settled||arrival.pendingBatch||S.turn-arrival.turn>=6||!inPalace(c)||c.outerPrivateResidence)return null;
  const valid=()=>inPalace(c)&&!arrival.settled&&!arrival.pendingBatch&&S.turn-arrival.turn<6&&!c.outerPrivateResidence;
  const favored=harem().filter(o=>o.id!==c.id&&o.favor>=40).sort((a,b)=>b.favor-a.favor||a.id-b.id)[0];
  const news=favored?`宫人答说，近来${cName(favored)}常蒙召见。`:'宫人只说，各宫各有起居，不好妄议圣意。';
  const text={solitary:'她问清请安的时辰，便将自己的书与茶具放好。“分内的礼数，臣妾不会怠慢。至于闲时，可否容臣妾独自过？并非与谁不睦，只是不惯结伴。”',careful:`她先请教请安的次序，又不动声色地问了各宫近来的赏赐。${news}\n见你进来，她收住话：“臣妾只怕不懂规矩，给人添了麻烦。”`,
    bold:`行李还没收好，她便拉住领路宫人：“宫里如今谁最得宠？陛下平日爱往哪一宫去？”${news}\n见你来了，她仍忍不住问：“臣妾若做得好，陛下也会常来么？”`,
    quiet:'她把带来的旧书放在窗下，先问院里可否种一丛兰。见你来了，她微微一笑：“地方还生疏，不过有这一窗日色，臣妾便能慢慢住惯。”',
    nervous:'她望着陌生的宫门，几次想问话，又将话咽回去。见你来了才轻声道：“臣妾怕行错礼，也怕说错话。今夜的灯，可否留得晚些？”'}[arrival.manner];
  const settle=(answer,changes,line)=>{
    if(!valid())return null;arrival.settled=true;arrival.answer=answer;arrival.favored=favored?.id;arrival.answeredAt=S.turn;
    cchg(c,changes);story(c,`初入宫时，${line}`);remember(c,'care',line);save('auto');return line;
  };
  return {title:'初入宫门',por:c,valid,text:`${fullName(c)}${S.turn===arrival.turn?'刚住进':'入宫不久，住在'}${c.palace}。\n${text}`,choices:[
    {t:'先安心住下，有不懂的慢慢问',f:()=>settle('reassured',{aff:6,mood:8},'陛下许她慢慢熟悉宫中生活，不必事事惶恐。')},
    {t:'请掌事姑姑教她宫中礼数',f:()=>settle('guided',{aff:2,mood:4},'陛下安排掌事姑姑陪她认路、习礼，也教她分辨传言。')},
    {t:'各人有各人的日子，不必急着比较',f:()=>settle('boundaries',{mood:2},'陛下劝她先过好自己的日子，不必急着争高下。')}]};
}
function newcomerVoice(c){
  const a=c.entryAdjustment;if(!a?.settled||S.turn-a.turn>=6)return null;
  const lines={solitary:['请安的路已经记熟，借来的书也照期归还了。臣妾仍喜欢独处，倒不觉得这里的日子难捱。','旁人的邀约，臣妾会认真回话；去不去，却想自己作主。如此也好，彼此都不必猜。'],careful:['请安的路臣妾已经认得了。宫人说的话，臣妾也只听一半，剩下的，总要自己看过才算。','刚来时怕失了分寸，如今才懂，话不必句句都接。陛下若愿听，臣妾也有自己的想法。'],bold:['那日问谁得宠，原是臣妾心急了。只是盼陛下下回来时，不必再让人通报名姓。','宫里的日子，比臣妾在家想的难猜。可臣妾还是想把自己喜欢的，认认真真做给陛下看。'],quiet:['窗下那一点新绿，今早又长了。宫里虽大，也渐渐有了臣妾认得的地方。','昨日走过长廊，竟没有走错。原来熟悉一个地方，也可以这样慢慢来。'],nervous:['昨夜终于睡安稳了。醒来时还以为在家，听见廊下请安的声音，才想起已经进宫。','臣妾把各宫的名字写在纸上，认得一个，便划去一个。如今不大怕独自走过长廊了。']};
  return voiceLine('newcomer','她说起这些日子，语气比初见时松了一些。',lines[a.manner]||lines.nervous);
}
