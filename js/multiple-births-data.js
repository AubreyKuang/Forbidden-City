/* The source is a prompt for an original family scene, not proof of twin destiny. */
const MULTIPLE_SOURCES={
  auspice:{name:'宫中祥瑞传说 · 原创演绎',note:'国师所说的星影、云气与并蒂花是游戏里的祥瑞传说；贺语寄托心愿，不决定孩子的性情或储位。'},
  xijing:{name:'《西京杂记》卷三·霍妻双生 · 古代笔记',url:'https://zh.wikisource.org/wiki/西京雜記/卷三',note:'典故小笺：《西京杂记》有双生长幼之议，并提及双男、双女与一男一女；此处借题写手足相处，不把笔记记载当作宫中定制。'},
  brothers:{name:'《世说新语·德行》元方季方 · 志人笔记',url:'https://zh.wikisource.org/wiki/世說新語/德行',note:'典故小笺：元方、季方的故事说兄弟各有可称之处。原人物并非据此认定为双胞胎；这里借意写同生孩子如何面对比较。'},
  tree:{name:'《续齐谐记》田氏紫荆树 · 志怪传说',url:'https://zh.wikisource.org/wiki/續齊諧記',note:'典故小笺：田氏三兄弟分树、复合的故事带有志怪色彩，并非三胞胎的史实。这里借同株之意，写三个孩子如何给彼此留地方。'},
  changdi:{name:'《诗经·小雅·常棣》 · 诗意改编',url:'https://zh.wikisource.org/wiki/詩經/常棣',note:'典故小笺：《常棣》写手足相念与相助。游戏借此展开同生手足的日常，不要求亲人永远没有分歧。'},
  original:{name:'同生手足 · 原创对话',note:'这是由同生身份、年龄与性情展开的原创场景。双生不代表容貌、兴趣或命运必然相同。'}
};
const MULTIPLE_MOMENTS=[
  {id:'auspice',title:'国师贺同生',min:0,max:2,mother:true,source:MULTIPLE_SOURCES.auspice,begin:multipleBlessing,choices:[
    {label:'把瑞语各写一笺，分别赠予孩子',cost:3,stats:{love:3},relation:2,
      result:g=>`国师为${g.map(k=>k.name).join('、')}分别题名，没有用一张笺代替所有人。云纹相连，末尾的祝愿却各不相同。母亲将笺收进诞生匣，笑说日后要让他们各自来认。`,memory:(k,i)=>`诞生匣里有一张写着我名字的瑞笺，排在${i===0?'最前':'同生手足的笺旁'}。`},
    {label:'听国师讲完瑞梦，为每个孩子留一盏平安灯',cost:2,stats:{love:2},relation:2,
      result:g=>`${daoMaster().name}讲起云归山、星入水的故事，宫人将${g.length===3?'三':'两'}盏灯安放在孩子够不到的廊外。夜风吹过，灯影忽近忽远；母亲轻声报出每个孩子的名字，愿他们平安长大。`,memory:()=> '出生时，父皇与母亲听国师讲瑞梦，也为我留了一盏平安灯。'}]},
  {id:'names',title:'我们各有名字',min:3,max:5,source:MULTIPLE_SOURCES.original,
    begin:g=>`宫人又只唤“几位同生的小殿下”，把一样的玩具放到面前。\n${multipleSay(g[0],{灵动:'猜猜我要哪一个！不许都给一样的。',好胜:'这一个我先挑！',自矜:'要叫我的名字。',内敛:'这个……我不喜欢。',default:'这是我的，那个才是你的。'})}\n${multipleSay(g[1],{仁厚:'我可以等，可也要问问我呀。',爽直:'我想要的不是这个。',好奇:'同一天生，就要玩一样的吗？',default:'我有自己的名字！'})}${g[2]?'\n'+g[2].name+'把自己的玩具抱紧：“还有我呢。”':''}`,
    choices:[
      {label:'蹲下来，逐个叫名字、问喜欢什么',stats:{love:4},relation:3,result:g=>`${g.map(k=>k.name).join('、')}各自挑好玩具。你把名字和喜好一一念对，有人点头，有人得意地替另一个补上一句。`,memory:(k)=>childDisposition(k)==='内敛'?'我说得很小声，父皇也听见了。':'父皇叫的是我的名字，也问了我喜欢什么。'},
      {label:'请他们互相介绍，轮流说一个小秘密',stats:{love:2,vir:1},relation:6,result:g=>`${g[0].name}先说${g[1].name}藏点心的地方，惹来一句“这个不许说”。你让他们改说对方喜欢的游戏，笑声才重新响起来。`,memory:(k,i,g)=>`我知道${g[(i+1)%g.length].name}喜欢什么，也有不想让人说的小秘密。`}]},
  {id:'eldest',title:'只早了一小会儿',min:6,max:10,source:MULTIPLE_SOURCES.xijing,
    fit:g=>g.every(k=>Number.isInteger(k.birthOrder))&&new Set(g.map(k=>k.birthOrder)).size===g.length,
    begin:g=>`读到古人争论双生长幼，${g[0].name}立刻看了一眼身旁。\n${multipleSay(g[0],{好胜:'我先出生，当然该听我的！',自矜:'长幼总该有个次序。',仁厚:'我大一点，可以照看他们。',default:'就早那一小会儿，也算大的么？'})}\n${multipleSay(g[1],{爽直:'早一会儿，不是每件事都对。',审慎:'那做错的时候，也要听吗？',default:'可我也有自己的主意。'})}`,
    choices:[
      {label:'长幼照实记，日常的事轮流作主',stats:{vir:2,love:2},relation:5,result:g=>`诞生簿仍照原来的先后。今日选书由${g[1].name}先选，下次再换人；${g[0].name}起初想争，听见自己也有一回，才把话收住。`,memory:()=> '先出生的人可以照应手足，也该听见后出生的人。'},
      {label:'请年长者说说，愿意怎样照应手足',stats:{vir:3},relation:4,result:g=>`${g[0].name}说愿意帮着认路，又补一句：“可功课要自己写。”其余人笑着答应，也各说了一件能帮的事。`,memory:(k,i)=>i===0?'做年长的，不是事事替人拿主意。':'有人愿意照应我，也承认我可以帮上忙。'}]},
  {id:'dragon-phoenix',title:'龙凤也有各自的志向',min:6,max:15,source:MULTIPLE_SOURCES.original,fit:g=>g.length===2&&g[0].sex!==g[1].sex,
    begin:g=>{const girl=g.find(k=>k.sex==='f'),boy=g.find(k=>k.sex==='m');return `掌事送来一对龙凤书签，顺口说“皇子习武，公主描花”。\n${multipleSay(girl,{爽直:'谁说我只能描花？',好胜:'骑射课上，我也能赢。',好奇:'我想先看看那张弓是怎么做的。',default:'书签很好，可我要学什么，能先问问我么？'})}\n${multipleSay(boy,{内敛:'我其实也喜欢画。',审慎:'先让我们各自说完罢。',default:'龙凤是成对的，功课却可以各选。'})}`;},
    choices:[
      {label:'让两人分别挑一堂想试的课',stats:{love:4,lit:1},relation:4,result:g=>`${g[0].name}和${g[1].name}各自写下想试的课，掌事照单安排。书签仍是一对，夹住的书却不必一样。`,memory:()=> '同生的贺语很美，我自己的志向也有人愿意听。'},
      {label:'互换一回课业，请对方教自己一件事',stats:{lit:2,vir:1},relation:6,result:g=>`两人把自己拿手的东西摆出来，轮流当了一回小先生。${g[1].name}遇到不会的地方，终于肯认真问${g[0].name}。`,memory:(k,i,g)=>`我与${g[1-i].name}互相教了一回，原来对方会的东西比我想的多。`}]},
  {id:'paired-title',title:'贺词之外的两个名字',min:6,max:15,source:MULTIPLE_SOURCES.original,fit:g=>g.length===2&&g[0].sex===g[1].sex,
    begin:g=>`宫人称赞“${g[0].sex==='m'?'双龙':'双凤'}一般出色”，却把两份功课认反。\n${multipleSay(g[0],{自矜:'这句是我写的，请记清。',好胜:'夸我们一样好，就不用细看了吗？',内敛:'那张……不是我的。',default:'我们是同生，也不是同一个人。'})}\n${multipleSay(g[1],{仁厚:'夸谁都好，可名字还是要放对。',灵动:'要不让他猜？猜错得重新读。',default:'我也想听听，我自己的那一份怎样。'})}`,
    choices:[
      {label:'分别读完，指出各自一处好、一处可改',stats:{lit:2,love:3},relation:4,result:g=>`你分别读了两份功课。${g[0].name}记住一句具体的夸奖，${g[1].name}把要改的地方圈起来。那句漂亮贺词之后，终于接上了两个人的名字。`,memory:()=> '父皇看过的是我自己做的事，夸奖也说得清楚。'},
      {label:'请两人互讲对方最用心的一处',stats:{vir:2},relation:7,result:g=>`${g[0].name}先说“字还可以”，被追问才指出一处巧思。${g[1].name}原想反驳，听清以后，也把对方反复改过的一行指出来。`,memory:(k,i,g)=>`${g[1-i].name}看见了我用心的地方，我也看见了对方的。`}]},
  {id:'three-branches',title:'三枝都要有地方',min:6,max:15,source:MULTIPLE_SOURCES.tree,fit:g=>g.length===3,
    begin:g=>`听过紫荆同株的传说，三个孩子想给园中小树各系一条绦。两条已经挂好，第三条却被挤到背面。\n${multipleSay(g[2],{好胜:'每回都说同生，怎么总是我最后？',自矜:'若只留背面，不如先别挂我的。',内敛:'这里……能不能也留一点？',default:'这回要有我的地方。'})}\n${g[0].name}望了望绦带，${g[1].name}伸手去挪，又怕碰落别人的。`,
    choices:[
      {label:'三人各选一枝，亲自留出彼此的位置',stats:{vir:2,love:2},relation:6,result:g=>`${g[0].name}松开原来的结，${g[1].name}扶住枝条，${g[2].name}选定朝阳的一枝。三条绦各有位置，谁也不必藏在另外两人的背面。`,memory:(k,i)=>['我肯挪开一点，手足也没有因此少看重我。','我把两边的枝扶稳，让最后一个人也能选。','这回我的位置不是别人挑剩下的。'][i]},
      {label:'合画一株树，各自落款，不分谁是主枝',stats:{lit:2},relation:5,result:g=>`画上的树并不齐整：${g[0].name}添叶，${g[1].name}画鸟，${g[2].name}补了树下的石。三个名字都落在纸上，国师看了只笑：“各有生意，才像一株活树。”`,memory:(k,i)=>['我画的叶子，留在三个人合成的树上。','我的鸟停在别人的枝上，我们一起把画完成。','我补的那一角没有被裁掉，名字也好好留下。'][i]}]},
  {id:'comparison',title:'别总拿我们相比',min:8,max:17,source:MULTIPLE_SOURCES.brothers,fit:g=>g.some(k=>['好胜','自矜','内敛'].includes(childDisposition(k))),
    begin:g=>`先生夸过一人的功课，又说同日出生的手足应当赶上。\n${g.map(k=>multipleSay(k,{好胜:'我会再赢回来，可别替我认输。',自矜:'我的长处不在这一处，也不能算没有。',内敛:'我不是没有用功。',仁厚:'别因为夸我，就让别人难过。',default:'我们学的快慢，未必一样。'})).join('\n')}`,
    choices:[
      {label:'分别定一个小目标，下回只与自己相比',stats:{love:3,lit:1},relation:3,result:g=>`${g.map(k=>k.name).join('、')}各写下一件想做好的事。大家仍各有脾气，并未忽然变得一样；这一次，先生把每人的进步单独记了下来。`,memory:()=> '不用变成同生手足的样子，我也可以把自己的事做好。'},
      {label:'合做一份功课，各按长处分工',stats:{lit:2,vir:1},relation:6,result:()=> '有人理清次序，有人找出疏漏，有人把意思讲明白。最后的功课署上所有名字，每人都能指出自己做成的那一部分。',memory:()=> '同生手足做得好的地方，也能成为我愿意请教的地方。'}]},
  {id:'shelter',title:'替你说一句',min:9,max:17,source:MULTIPLE_SOURCES.changdi,
    fit:g=>g.some(k=>['仁厚','爽直','好胜'].includes(childDisposition(k)))&&g.every((k,i)=>g.slice(i+1).every(o=>relGet(k,o)>=15)),
    begin:g=>`一份练字纸被茶水打湿，掌事误以为是${g[1].name}闹着玩。\n${multipleSay(g[0],{仁厚:'先别责备，我看见风把帘子吹过来了。',爽直:'不是这么回事，我在场。',好胜:'平日我们可以争输赢，这回却不能让人冤枉。',default:'请先听我们把经过说完。'})}\n${g[1].name}低头捏着湿纸，终于抬起头，自己补上了后半段。`,
    choices:[
      {label:'听完每人的见闻，查清后道歉',stats:{vir:3,love:2},relation:5,result:()=> '查清是帘角碰倒茶盏，掌事向孩子致歉。手足没有替对方认下没做的事，也没有把所有话抢过去。',memory:(k,i)=>i===1?'有人肯替我开口，也让我自己把话说清。':'我替手足说的是亲眼看见的事，不是替人包揽一切。'},
      {label:'先一起救下纸页，再让受误解者说明',stats:{vir:2},relation:6,result:()=> '孩子们先将纸页分开放好。受到误解的人自己说完经过，手足在旁补充；有人替自己站在身边，也还能自己开口。',memory:()=> '出了小事可以一起收拾，受了误解也可以好好说清。'}]},
  {id:'paths',title:'同生未必要同行',min:12,max:17,source:MULTIPLE_SOURCES.original,
    begin:g=>`新一季课业排下来，掌事想把同生手足一直编在一起。\n${g.map(k=>multipleSay(k,{好奇:'我想换一门没学过的。',好胜:'我想去更难的那一班试试。',仁厚:'分开读书，也还可以一起吃饭罢？',内敛:'有一件想学的事，我还没同他们说。',自矜:'别为了凑在一起，替我选好了前程。',default:'一起长大，也可以各有想去的地方。'})).join('\n')}`,
    choices:[
      {label:'分别听志向，给各自一段试学时间',stats:{love:4,lit:1},relation:3,result:g=>`${g.map(k=>k.name).join('、')}各领一张试学课签。你约定过些日子再听心得，没让其中一人为“同生”二字放下自己的选择。`,memory:()=> '父皇肯分别听我们的打算，手足情分不必靠一直同行证明。'},
      {label:'让他们商量，留下每旬一回的相聚',stats:{vir:2,love:2},relation:6,result:()=> '孩子们约好每旬共读或闲谈一回，其余时间各学所长。有人嘴上嫌麻烦，却先在课签背面写下相聚的日子。',memory:()=> '我们各有自己的路，也可以主动给手足留一个时辰。'}]},
  {id:'letters',title:'同日生辰，两地灯火',min:16,max:80,remote:true,source:MULTIPLE_SOURCES.changdi,
    fit:g=>g.some(childHasLeftPalace)&&g.every(k=>k.birthMonth===S.month),
    begin:g=>`又到同生手足的生辰月。${g.map(k=>`${k.name}如今在${childHasLeftPalace(k)?childWhereabouts(k):'宫中'}`).join('，')}。送来的家书里，有人附了一张旧画，有人问起小时候的口味，仍各有各的说法。你想起那年宫里一同亮起的灯。`,
    choices:[
      {label:'分别回信，把彼此的问候一并转交',stats:{love:3},relation:5,result:g=>`你把${g.map(k=>k.name).join('、')}的名字逐一写在回笺上，转交问候时保留了各人的原话。隔着不同的住处，旧日的一点熟悉仍接得上。`,memory:()=> '生辰这月收到了手足的问候，父皇也记得分别回信。'},
      {label:'请各写一件近况，合存进同生纪念匣',stats:{lit:1,love:2},relation:4,result:()=> '近况没有被改成整齐的颂辞：有琐碎的小事，也有未成的愿望。它们与诞生时的旧物放在一起，仍是几段各不相同的人生。',memory:()=> '我们同日出生，如今各有日子可讲；我的近况也被认真留下。'}]}
];
