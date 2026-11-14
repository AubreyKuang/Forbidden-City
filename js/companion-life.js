/* Personality stays visible under strain; ordinary time also leaves shared memories. */
function companionStyle(c){
  if(['骄纵','骄矜','善妒'].includes(c.trait))return 'proud';
  if(['城府','聪慧','持重'].includes(c.trait))return 'reserved';
  if(['将门','爽直'].includes(c.trait))return 'direct';
  if(['活泼','好客'].includes(c.trait))return 'bright';
  if(['才女','好学','巧手','贪财'].includes(c.trait))return 'maker';
  return 'gentle';
}
const EMOTIONAL_VOICES={
  proud:{grief:'臣妾今日不想见旁人，也不想装作无事。陛下肯留下，就不要催臣妾笑。',fear:'臣妾平日敢争，今日却是真的怕。不要笑我，先把事情说清楚。',anger:'赏赐收回去。臣妾要的是把那件事说清楚，不是一句好听的。',ill:'今日这病容不好看，臣妾知道。陛下若是特意来的，便别急着走。'},
  reserved:{grief:'该安排的都已安排了。只是门关起来，臣妾还不知该怎样过这一夜。',fear:'臣妾把前后的话理了几遍，仍有一处对不上。陛下能否说一句准话？',anger:'事情的前后，臣妾都记得。今日可以谈，却不能当作没有发生过。',ill:'事情已交代给掌事姑姑。余下的，等臣妾精神好些再议。'},
  direct:{grief:'臣妾知道人得往前走，可今日走不动。让我歇一歇，不必劝。',fear:'臣妾不愿猜。若要问罪，请说缘由；若是误会，也请当面讲明。',anger:'臣妾心里有气，便直说有气。要和解，先把是非分清。',ill:'这回是身子不争气，认了。先把病养好，再去做该做的事。'},
  bright:{grief:'方才想讲件趣事，话到了嘴边，却忽然不想说了。陛下陪臣妾安静一会儿吧。',fear:'臣妾方才笑，是不知该怎么办。其实一直在怕，陛下听出来了吗？',anger:'今日别拿玩笑岔过去。臣妾平日爱笑，也不是件件事都能笑着算了。',ill:'脑子里还有好些主意，身子却不肯动。先记着，等好了再同陛下试。'},
  maker:{grief:'手里的活停了几日。臣妾想慢慢拾起来，不为赶成，只想有一处安放心事。',fear:'这一行看了许多遍，还是没记住。臣妾心里不安，今日做不好。',anger:'这些日子做过的事，都有痕迹。陛下若肯看，就会明白臣妾为何介意。',ill:'今日先做这一小段，余下留到明日。臣妾也在学着不逞强。'},
  gentle:{grief:'不必劝臣妾快些好起来。今日能把这一盏茶喝完，也算往前走了一点。',fear:'臣妾想问，又怕问错。陛下能不能先让左右退一退？',anger:'臣妾可以轻声说话，却还不能说已经原谅了。那件事，心里仍疼着。',ill:'今日精神短些。陛下坐近一点，臣妾便不必费力说话。'}
};
function consortEmotionalVoice(c,x){
  const key=['悲恸','心如死灰'].includes(x)?'grief':x==='怨恨'?'anger':x==='惶恐'?'fear':'ill';
  return voiceLine(key==='anger'||key==='fear'?'distance':key,key==='ill'?'她说几句便停下来歇息。':key==='grief'?'她没有掩饰今日的低落。':'她仍保持着自己的说话方式，语气却与往日不同。',EMOTIONAL_VOICES[companionStyle(c)][key]);
}
function oldKeepsakeEvent(c){
  const entered=Number.isInteger(c.enteredAt)?c.enteredAt:0;
  const month=c.enteredMonth||((S.month-1-(S.turn-entered)%12+12)%12+1);
  const anniversary=S.turn-entered>=12&&S.month===month;
  return {title:'旧物',por:c,text:anniversary?
    `又到了${cName(c)}入宫的月份。她翻出当年带来的旧匣，指尖在匣沿停了片刻。`:
    `${cName(c)}整理旧匣，翻出一件用旧的小物。她没有急着收回去，只说：“有些东西，留着便觉日子没有白过。”`,choices:[
    {t:'陪她说说旧事',f:()=>{remember(c,'care',anniversary?'陪她回忆入宫的旧事':'陪她整理旧物，听她讲过去');return `你坐下来，听她把旧事从头说完。${fx(cchg(c,{aff:8,mood:10}))}`}},
    {t:'让她慢慢收拾',f:()=> '她将旧物重新安放好。那些日子，她自己也记得。'}]};
}
const SHARED_MOMENTS={
  proud:['她把两只茶盏换了位置，说今日要你坐在离她近的一边。','她认真挑了两枝花，要你选一枝。另一枝，她自己留下了。','你听她把一件不服气的小事讲完，没有急着劝她大度。','她说想留一段不谈礼数的工夫。你们把窗边的棋局摆了出来。'],
  reserved:['你们将一条传闻的来龙去脉理清，约定未查明前不传出去。','她把犹豫已久的一个判断说了出来，你先听完了理由。','一局棋停在难处，你们各说了一种解法，留待下回来试。','她少说了一句客套，多问了一句你的真心。你认真答了。'],
  direct:['你们在廊下辨认弓上的旧痕，她说起第一次学射时的笨拙。','你们为一件小事争了几句，最后各认了自己说得过头的地方。','她教你怎样把松了的结系牢，打好后又让你自己试了一回。','你们谈起输过的一场较量，都没有把失手藏起来。'],
  bright:['她把一段见闻演给你看，学到一半自己先笑了。','你们给窗前常来的小鸟取了个名字，谁都没惊动它。','她想了一个猜谜的新玩法，最后倒被自己的题目难住了。','你们把一张没画完的小图接着画完，留下几笔有意不改的歪线。'],
  maker:['她指给你看一处重新做过的细节，你认真问了其中的分别。','你们把一件旧物的来历记在纸上，又补上经手匠人的名字。','她让你先试手边那一步。做得不齐，却没有替你遮掩过去。','你们为一个不起眼的难题想了两种办法，准备下次各试一种。'],
  gentle:['你们在窗下分了一盏淡茶，听完庭中一阵细小的响动。','她把今日一件舒心的小事说给你听，又认真问了你的那一件。','你们一起整理几页旧笺，留下一页还没有写完的话。','话说尽了，你们仍并坐片刻，没有急着找新的话题。']
};
function recordSharedMoment(c,previousMood){
  if(c.aff<55||consortVoicePhase(c)==='first'||NEGX.includes(previousMood)||c.hp<40)return '';
  const h=c.sharedMoments||{last:-99,items:[]};
  if(S.turn-h.last<6)return '';
  const lines=SHARED_MOMENTS[companionStyle(c)],text=lines[(h.count||h.items.length)%lines.length];
  c.sharedMoments=h;h.count=(h.count||h.items.length)+1;h.last=S.turn;h.items.push({turn:S.turn,d:dateStr(),text});if(h.items.length>12)h.items.shift();
  remember(c,'shared-moment',text);return text;
}
function sharedMomentVoice(c){
  const moment=c.sharedMoments?.items.at(-1);if(!moment||S.turn-moment.turn<1)return null;
  return voiceLine('shared-moment',`她又提起${moment.d}相处时的一件小事。`,`那一日的事，臣妾记得。${moment.text.replaceAll('你们','我们').replaceAll('你','陛下').replaceAll('她','臣妾')}`);
}
const LOVE_TOKENS={
  proud:{name:'并蒂花笺',begin:'她挑了几回纸色，终于写好一张花笺，搁在手边等你问。',show:'“既然看了，便不许随手搁下。”她把花笺推到你面前。',care:'她亲自挑出清淡的粥菜，催你歇下，却也肯听御医安排。'},
  reserved:{name:'对弈手记',begin:'她把你们下过的一局棋记在小册上，在一着旁边留了空白。',show:'“这一着当时为何这样走？臣妾想记下陛下自己的解释。”',care:'她把要紧与可缓的事务分开，替你空出一段真正能休息的时辰。'},
  direct:{name:'同心绳结',begin:'她正在试一个结的松紧，见你进来，干脆将另一端递给你。',show:'“一起系好，才知道牢不牢。”她看着你试，错了便直说。',care:'她直言劳累不能靠硬撑，守着你用过药，才肯去歇息。'},
  bright:{name:'合画小扇',begin:'她在一柄小扇上画了半只鸟，把笔递来，非要你续上另一半。',show:'“不许叫画师代笔，画得不像也算数。”她忍着笑，把扇子铺平。',care:'她想了些轻巧的见闻让你宽心，说到你困了，便主动收声。'},
  maker:{name:'批注小册',begin:'她把近来做过的小物与读过的句子记在一册里，留了一页请你添笔。',show:'“写自己的话就好。”她摊开空白的一页，认真等你落笔。',care:'她把你没看完的书夹好书签，问过御医，才将温好的汤送来。'},
  gentle:{name:'鸳鸯帕',begin:'她低头理着一方新绣的帕子，见你进来，手指停在最后一针。',show:'“还不很齐整。”她将帕子展开，愿意让你看见尚未收好的线头。',care:'她记着你用药的时辰，替你换过温茶，也让轮值的宫人各自歇息。'}
};
function loveToken(c,f){
  if(!f.token)f.token=c.arc.st>0?'gentle':companionStyle(c); // Earlier saves already established a handkerchief.
  return LOVE_TOKENS[f.token]||LOVE_TOKENS.gentle;
}
ARCS.love.name='相伴有凭';
ARCS.love.stages=[
  (c,f)=>{if(c.aff<40)return null;const token=loveToken(c,f);return {text:`你来到${c.palace}，${token.begin}`,choices:[
    {t:'等她愿意时再看',f:()=>{f.respected=true;aNext(c,1,2,5);story(c,`做了一件${token.name}，陛下愿等她慢慢完成。`);return '她没有被催促，反倒愿意多说几句自己的打算。';}},
    {t:'问她能否一同完成',f:()=>{f.shared=true;aNext(c,1,2,5);story(c,`与陛下一同留下${token.name}。`);return token.show+fx(cchg(c,{aff:6,mood:8}));}}
  ]};},
  (c,f)=>{if(c.aff<55)return null;const token=loveToken(c,f);return {text:`近来你操劳，御医嘱咐静养。${token.care}\n案边放着先前的${token.name}。`,choices:[
    {t:'谢过她，也让她好好休息',f:()=>{f.care=true;aNext(c,2,3,6);story(c,'陛下领了她的照应，也记着让她休息。');return fx(cchg(c,{aff:10,favor:6}));}},
    {t:'赏赐致谢（国库−20万两）',f:()=>{aNext(c,2,3,6);return fx(chg({treasury:-20}),cchg(c,{aff:4,mood:8}));}}
  ]};},
  (c,f)=>{const token=loveToken(c,f);if(c.aff<70){if(!f.wait){f.wait=1;c.arc.t=S.turn+6;return null;}aEnd(c,'相敬如宾',`那件${token.name}被妥善收起，彼此仍守着礼数，各有自己的日子。`);return {text:`${cName(c)}将${token.name}收回旧匣。她没有改掉自己的性情，只是不再把每一日都等成你的归期。`,choices:[ok1]};}
    return {text:`收拾旧物时，${cName(c)}又翻出${token.name}。${f.shared?'上面还留着你们一同完成的痕迹。':'她记得当时你没有催她。'}\n她问：往后的日子里，是否还能留下一点只属于彼此的工夫？`,choices:[
      {t:'约定常来，也听她自己的打算',f:()=>{c.bond=true;aEnd(c,'同心',`以${token.name}记下相伴的约定。不是一次冒险，而是愿意在平常日子里彼此照应。`);remember(c,'shared-moment',`一同保管${token.name}，约定把彼此的打算认真听完。`);return `她把${token.name}重新放到常用的匣子里。${fx(cchg(c,{aff:15,favor:10}))}\n§她的恩宠从此不再衰减`; }},
      {t:'坦言此时还无法许下约定',f:()=>{aEnd(c,'相敬如宾',`保留了${token.name}，也听到了陛下未能许诺的实话。`);return '她听完，收起旧物。往后的日子怎样过，她也会自己拿主意。';}}
    ]};}
];
