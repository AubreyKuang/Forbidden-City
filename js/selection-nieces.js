const selectionNiecesActive=()=>journalContentVersion()>=135;
const NIECE_SELECTION_VOICES={
  warm:{
    entered:[
      '候着点名时会站很久。早上务必吃点热的，若怯场，就等自己喘匀了再开口。',
      '进殿前别空着肚子。礼数有人教，不明白便问一声，别拘着。',
      '旧日的话以后再说。今日我托人捎一包点心，你若饿了就吃。'
    ],
    kept:[
      '我听到你的名字，手里的针竟扎偏了。今晚若睡不惯，叫人把灯留一盏。等你想说话时，我有空。',
      '给你备了些常用的药膏和针线。往后各宫请安照礼数办，闲时若有难处，可以捎信给我。',
      '按礼该向你道喜。我叫人送了一盏新灯。至于从前不愉快的事，等你我都愿意谈时再谈。'
    ],
    lost:[
      '回去先吃碗热面。若问的人太多，就说姨母交代了，等你缓过这一日再开口。',
      '出门时我托人给你留了一件夹衣。到家报个平安，其余的事，想说了再说。',
      '车我请人看过，稳当。回家以后，若有人拿今日的事刺你，不必替谁硬撑。'
    ]
  },
  candid:{
    entered:[
      '把背挺直些，话说完再垂眼。谁也不能替你答那几句话，我在外头等你的信。',
      '先记清自己该从哪扇门进去。有人催，你也别抢在问话前把话都说了。',
      '有话就自己答。咱们从前拌嘴归拌嘴，你上殿时，我不会给你添乱。'
    ],
    kept:[
      '听见了！我把你住处的路问了两遍。头一遭请安照宫规走，走岔了也别慌，问清再回头。',
      '你的住处我已经问清。日后碰见，你叫我一声便好，有事直说。',
      '道喜的话我说在前头。往后撞见了，咱们把礼数尽了。真有不痛快，你我当面说。'
    ],
    lost:[
      '车到家门口，把累了一日的鞋先脱了。谁问你殿上答错哪句，就叫他自己来站上半日试试。',
      '上车吧。一路别颠着，回去有什么打算，你自己拿定了再同家里讲。',
      '谁敢当着你面说风凉话，就问他可曾上过殿。你我那点旧账，也不用这张榜来算。'
    ]
  },
  quiet:{
    entered:[
      '等候时若嫌人声太密，就看一会窗纸上的影子。名字叫到了，再慢慢起身。',
      '题名帖的墨已晾干。收在袖里，进门前再摸一摸，别拿错了。',
      '我把旧信收到匣底。今日只说眼前的事，你带着自己的名帖进去便是。'
    ],
    kept:[
      '听说你留下了，我把茶温了两次。等院里人散些，若还睡不着，可以托人来取一卷书。',
      '书匣里那卷游记给你。我住处清静，哪天想坐一会，先递个信来。',
      '我把贺笺折好，封上便罢。往后各自有门可关、有灯可点，偶尔见面，依礼问安。'
    ],
    lost:[
      '回去的路上若睡不着，就把帘子掀一点，看天色怎么变。今日留不住的话，改日再写给我。',
      '替你把等候时看的那卷书收进箱里了。剩下的几页，到家慢慢看。',
      '送你的车马按时出门。你若想安静些，家里也不必逼你回信，我知道你到了就好。'
    ]
  },
  steady:{
    entered:[
      '把姓名、籍贯和所学想一遍就够了。真问到没学过的，据实说，莫怕一时答不上。',
      '我抄了一份候见的次序。照着做，到你自己的时候，旁人怎样答不必学。',
      '宫里会按册点名。你尽可照自己所学应答，我不会替你改名帖，也不会遣人议论。'
    ],
    kept:[
      '我把去请安的路、领用物件的时辰写在同一页。等这阵忙完，你也写一封只说自己欢喜什么的信给家里。',
      '封位已定。先把交接的宫人和各处规矩认清楚，记不得的地方，去问掌事姑姑。',
      '贺礼依你如今的位分送，单子也备着。公事按册办，平日往来由你我各自拿主意。'
    ],
    lost:[
      '我把归程和交箱笼的人名抄给你了。到了家，若还想做从前说过的那件事，便慢慢接着做。',
      '落选的回帖已收齐，路上的事也问过了。回家照常过日子，没人要你逐句讲殿里说了什么。',
      '我叫人把你的户帖和行李一并归还。回去后各家的问话，由各家自己应付，无须叫你挨个解释。'
    ]
  },
  proud:{
    entered:[
      '家里一早遣人问我几遍，我把人都打发了。你上殿只报自己的姓名，先想清你自己愿过什么日子。',
      '我知道家里想听好消息，入殿时你且收起那些请托。你的一句话，比家里的十封信要紧。',
      '家里打听我会不会去说情。我把帖子退回去了。今日你凭自己的才情答，我也守我的分寸。'
    ],
    kept:[
      '贺礼我挑了三样，末了只留一件你用得着的。家里若来攀你的新位分，先把信给我瞧瞧。',
      '该贺的我已经贺了。宫里各人有各人的座次，别让家里把你我说成一处的人。',
      '我听见别人拿你的封位同我比，的确不自在。可这是你殿前得来的，我会依礼道喜。'
    ],
    lost:[
      '家里若敢说你走这一趟丢了脸，就让他们来同我说。你回去把想做的事拾起来，我替你挡这一回。',
      '回信我只写你平安。旁人兴许还想问个高低，你没有欠他们一番解释。',
      '听说你要归家，我的确松了口气。旧怨是我们两人的，家里若拿落选为难你，我自会叫他们住口。'
    ]
  }
};
const NIECE_SELECTION_TITLES={entered:'姨甥应选 · 储秀宫来信',kept:'姨甥定榜 · 留牌入宫',lost:'姨甥定榜 · 宫门辞归'};
function selectionNieceVoice(a){
  if(isSolitary(a)||['淡泊','沉静','清冷','才女','巧手'].includes(a.trait))return 'quiet';
  if(['活泼','爽直','将门','好客','张扬'].includes(a.trait))return 'candid';
  if(['持重','好学','聪慧'].includes(a.trait))return 'steady';
  if(['骄矜','骄纵','好胜','善妒','城府','贪财'].includes(a.trait))return 'proud';
  return 'warm';
}
function selectionNieceAunts(people,mother,relative,preferredId){
  return [...new Set(people)].filter(a=>a&&a.id!==mother.id&&a.id!==mother.consortId&&a.id!==relative.id&&
    a.alive&&!a.gone&&!a.maid&&!a.familyArchive&&!a.cold).map(a=>{
    const score=relGet(a,relative),bond=score<=-20||isRival(a,relative)||isRival(relative,a)?2:score>=35?0:1;
    return {a,score,bond};
  }).sort((x,y)=>Number(y.a.id===preferredId)-Number(x.a.id===preferredId)||y.score-x.score||x.a.id-y.a.id);
}
function selectionNieceFamily(g,admitted=false){
  if(!selectionNiecesActive())return null;
  const origin=g.familyBranchOrigin;
  if(origin){
    const e=natalEntry(origin.host,origin.relative),mother=e&&natalSisterMother(e.c,e.p);
    if(!mother||!e.p.alive)return null;
    return {relative:e.p,mother,aunts:selectionNieceAunts(paternalFamily(e.c),mother,e.p,g.selectionNatalHost)};
  }
  const child=nieceSelectionEntryActive()&&g.outerHouseholdId!=null?outerChild(g.outerHouseholdId):null;
  if(!child||child.familySelection!=='listed'&&!(admitted&&byId(g.id)===g))return null;
  const m=outerMother(child.mother);
  if(m?.relative==null)return null;
  const relative={id:child.id,name:child.alias};
  const host=familyHostById(m.owner??m.host),mother=outerSister(m)||{id:m.relative};
  const people=[...(host?paternalFamily(host):[]),familyHostById(m.host)];
  return {relative,mother:outerSister(m),aunts:selectionNieceAunts(people,mother,relative,m.host),outer:{m,child}};
}
function selectionNieceThought(p,outcome,bond){
  if(outcome==='entered')return [
    '在等候时听见她的话，才敢把一直握紧的手松开。殿上怎么答，还是想自己拿主意。',
    '她肯捎话来，已尽了亲人的礼数。我把能用的记下，余下的自己应对。',
    '原以为她不会理会我的名帖，听完倒记住了两句话。旧事仍在，眼下只把这一场走完。'
  ][bond];
  if(outcome==='kept')return [
    p.willing===false?'原先总想着回家，如今已经留牌，姨母留的话多少安了些心。我还要慢慢想清怎样过自己的日子。':'她贺我时，也记得我初来会怕。以后我会去问候她，也想凭自己的本事把日子过稳。',
    '她的话有分寸，我也把它当这一程的照应。亲缘可以认，宫里的日子仍要自己学。',
    '听得出她的心思有几层。谢她这番话，也记住往后相见各守各的分寸。'
  ][bond];
  if(p.willing===false)return [
    '本来就一心想归家，得了她的话，终于能把这一点欢喜写在回信里。',
    '收好她捎来的几句话。回去便可把手边搁了几日的活计重新拾起。',
    '她的话我听进去了几句。能回家已是心愿，往后若要再写信，也等自己想写的时候。'
  ][bond];
  return [
    '本盼名字能留下，转身时还是有些难过。听姨母喊我先歇一日，方知不必一路强作笑脸。',
    '没能留下，自然有不甘。上车前把她捎来的话又想了一遍，决定先好好回家。',
    '我知道她未必为我惋惜，好在她没有拿结果刺我。出了这扇门，日子仍是我自己的。'
  ][bond];
}
const NIECE_CONFIDENCE_WORDS={
  afraid:{
    words:'往后若有人拿你娘年轻时的事打听，尽可说那是长辈的事。有人再难为你，来找我，我陪你回话。',
    aunt:'最怕两家的闲话追进宫来。见她捏着袖口，便先教了她一句能脱身的答话。',
    mother:'在给女儿的回信里只叮嘱了一件事：有人盘问就去找姨母，不必独自应付。',
    niece:'把姨母教的那句话默念了一遍。原来碰到不愿答的话，也可以把话推回去。'
  },
  hopeful:{
    words:'从前我常想，你娘要是也住得近些，我们就能常吃一顿热饭。今日来的是你。想吃什么、想过什么日子，姨母听你自己说。',
    aunt:'曾盼姐妹能在宫里相伴。给外甥女添茶时，特意问了她自己的口味。',
    mother:'回信问女儿头一餐吃得可口，又嘱她有不惯的地方尽管告诉姨母。',
    niece:'姨母问起最喜欢的菜，我才发现她一直等着我自己开口，便说想吃娘常做的那碗面。'
  },
  sad:{
    words:'我跟你娘有些话，到今天也没说顺。你不必替她解释，更不用替我捎话。来，先坐，赶了这一天的礼数，脚疼不疼？',
    aunt:'想起姐妹间的伤心事，起先没能迎上前。见孩子站着不敢坐，便亲手把脚凳挪了过去。',
    mother:'把写给姐妹又没寄出去的几句话留在自己手里，只问女儿脚上的鞋合不合适。',
    niece:'原怕姨母要我替娘回话。她只问鞋磨不磨脚，我便敢把磨红的脚跟给她看了。'
  }
};
function nieceConfidenceNote(p,title,thread,text){
  p.story||=[];story(p,`【${title}】${text}`);
  Object.assign(p.story.at(-1),{thread,life:{kind:'family',title,turn:S.turn,gen:S.gen}});
}
function welcomeNieceInPrivate(g,f,a,known,byLetter=false){
  const voice=NIECE_CONFIDENCE_WORDS[known.reaction],mother=f.mother;
  const mom=byId(mother.consortId)||mother,an=fullName(a),gn=fullName(g),mn=mother.name||fullName(mom);
  const title=byLetter?'姨甥私语 · 生母手书':'姨甥私语 · 初见';
  const thread=`niece-confidence:${a.id}:${g.id}`;
  const written=known.letter?.sent!=null;
  const memory=byLetter?'拆开'+mn+'的亲笔信，才知道姐妹当年曾与陛下私下相见。':
    known.source==='handwritten'?'想起'+mn+'早先亲笔告诉她的往事。':
    written?({afraid:'想起当年亲笔劝'+mn+'避嫌的信。',hopeful:'想起当年写信问'+mn+'愿不愿入宫相伴。',sad:'想起写给'+mn+'的那封信，信里曾说自己为什么没去送她。'}[known.reaction]):'想起当年察觉'+mn+'私事时的心情。';
  const spoken=byLetter&&known.reaction==='sad'?'我今天心里有点乱，不是你的缘故。来，把脚歇一歇。大人的事，没人该来问你。':byLetter&&known.reaction==='hopeful'?'看你娘的信，我也想她了。你们娘俩口味像不像？今儿你自己点菜，回头好写信告诉她。':voice.words;
  const auntThought=byLetter&&known.reaction==='hopeful'?'读罢才生出姐妹若能常在一处该多好的念头，先给孩子添了茶。':voice.aunt;
  nieceConfidenceNote(a,title,thread,memory+auntThought+`同${gn}独处时说：“${spoken}”`);
  nieceConfidenceNote(g,title,thread,`姨母${an}单独同我说：“${spoken}”`+voice.niece);
  if(f.relative!==g&&!f.outer)f.relative.story.push({...g.story.at(-1)});
  if(mom.alive!==false){
    const line=byLetter?`得知女儿${gn}留在宫里，亲笔写信给${an}：“我有件旧事没同你说过。当年我与陛下私下见过。倘若有人拿那些年月问孩子，求你照看她，别让她替大人回话。”`:
      `接到女儿${gn}留牌的消息，想到女儿如今能同姨母${an}见面。`+voice.mother;
    nieceConfidenceNote(mom,title,thread,line);
    if(mom!==mother)mother.story.push({...mom.story.at(-1)});
  }
  const intro=byLetter?`${mn}寄来亲笔信，把当年的私下往来告诉了${an}，托她照看女儿。
`:'';
  return intro+`姨母${an}私下同${gn}说：“${spoken}”`;
}
function nieceHandwrittenMailTick(){
  if(journalContentVersion()<162||S.over)return;
  for(const g of S.consorts){
    if(!g.alive||g.gone||!inPalace(g)||!g.familyBranchOrigin&&g.outerHouseholdId==null)continue;
    let mail=g.nieceConfidenceMail,f;
    if(!mail){
      // An older save may already have a retained niece. Only revisit an actual selection recorded for her aunt.
      if(!palaceUnclearOrigin(g)||!g.story.some(e=>e.life?.title===NIECE_SELECTION_TITLES.kept))continue;
      f=selectionNieceFamily(g,true);if(!f?.mother)continue;
      const waiting=f.aunts.filter(({a})=>g.story.some(e=>e.life?.title===NIECE_SELECTION_TITLES.kept&&e.thread?.endsWith(':'+a.id+':'+g.id)));
      mail=g.nieceConfidenceMail={due:S.turn,waiting:waiting.map(({a})=>a.id)};
    }
    if(!mail.waiting.length||S.turn<mail.due)continue;
    f||=selectionNieceFamily(g,true);if(!f?.mother)continue;
    const mother=f.mother,mom=byId(mother.consortId)||mother,notice=[];
    mail.waiting=mail.waiting.filter(id=>{
      const a=byId(id);if(!a?.alive||a.gone)return false;
      if(!inPalace(a))return true;
      let known=sisterAffairKnowledge(a,mother);
      const byLetter=!known;
      if(byLetter){
        if(mom.alive===false||mom.gone)return false;
        if(mom.cold||mom.templeStay)return true;
        const voice=selectionNieceVoice(a),relation=relGet(a,mother);
        const reaction=relation<0||a.trait==='善妒'?'sad':relation>=30||voice==='warm'?'hopeful':'afraid';
        known=(a.sisterAffairKnowledge||={})[mother.id]={sister:mother.id,name:mother.name,reaction,turn:S.turn,source:'handwritten'};
      }
      if(NIECE_CONFIDENCE_WORDS[known.reaction])notice.push(welcomeNieceInPrivate(g,f,a,known,byLetter));
      return false;
    });
    if(notice.length)pushEv({title:'姨甥私语 · 入宫以后',por:g,text:notice.join('\n'),choices:[{t:'记下这次相见'}]});
  }
}

function recordSelectionNiece(g,outcome,s=S.selection,family=selectionNieceFamily(g)){
  if(!s?.batch||!family)return '';
  const {relative:p,aunts,outer}=family,title=NIECE_SELECTION_TITLES[outcome],subject=outcome==='kept'||outer?g:p;
  const fact={entered:`${p.name}列入本届秀女名册，按礼入储秀宫候选。`,
    kept:`${p.name}殿前留牌，初封${RANKS[g.rank]}。`,lost:`${p.name}此次未留牌，将随家人归去。`}[outcome];
  let reply='',privateReply='';
  const privateWelcome=journalContentVersion()>=162&&outcome==='kept'&&family.mother&&palaceUnclearOrigin(g);
  if(privateWelcome)g.nieceConfidenceMail||={due:S.turn+1,waiting:[]};
  for(const {a,bond} of aunts){
    const thread=`selection-niece:${s.batch}:${a.id}:${p.id}`;
    if(subject.story.some(e=>e.thread===thread&&e.life?.title===title))continue;
    const line=NIECE_SELECTION_VOICES[selectionNieceVoice(a)][outcome][bond];
    const message=`姨母${fullName(a)}${inPalace(a)?'听到消息，托宫人传来话':'在宫外得了家信，托人带来一页回札'}：“${line}”`;
    const thought=selectionNieceThought(p,outcome,bond);
    livedRecord([a,subject],'family',title,thread,`【${title}】${fact}${message}`,['',thought]);
    const entry=subject.story.at(-1);
    entry.life.reply=message;
    if(outer)outerNote(outer.m,outer.child,title,NIECE_SELECTION_TITLES[outcome],fact+message,`“${thought}”`);
    else{
      const copy=subject===p?g:p;
      if(copy!==subject)copy.story.push({...entry});
    }
    if(privateWelcome&&byId(a.id)===a){
      const known=sisterAffairKnowledge(a,family.mother);
      if(known&&NIECE_CONFIDENCE_WORDS[known.reaction]&&inPalace(a)){
        const spoken=welcomeNieceInPrivate(g,family,a,known);
        privateReply||=spoken;
      }else g.nieceConfidenceMail.waiting.push(a.id);
    }
    reply||=message;
  }
  return privateReply||reply;
}
function selectionNieceArrivalNote(c){
  const prefix=`selection-niece:${S.selection?.batch}:`;
  const entry=(c.familyBranchOrigin||nieceSelectionEntryActive()&&c.outerHouseholdId!=null)&&
    c.story.find(e=>e.life?.title===NIECE_SELECTION_TITLES.entered&&e.thread?.startsWith(prefix));
  return (entry?.life?.reply?`<p class="hint">${esc(entry.life.reply)}</p>`:'')+selectionSisterArrivalNote(c);
}
/* A consort hears that her own sister is on the new roster. Journal content 175. */
const selectionSistersActive=()=>journalContentVersion()>=175;
const SISTER_SELECTION_TITLE='姐妹应选 · 储秀宫名册';
// [words, her own thought]; {s} is how she calls the candidate.
const SISTER_SELECTION_VOICES={
  glad:{
    warm:['{s}要进宫候选了？我给你备了一双软底鞋，候着点名时站得久，别叫脚疼。','想到宫里往后能多一个说家乡话的人，夜里多点了一盏灯。'],
    candid:['名册上看见你的名字，我差点叫出声来！殿上谁问你话，你只管照实答，有我在，没人敢欺负你。','已经把储秀宫的管事姑姑问了一遍，谁要给{s}脸色看，我头一个不答应。'],
    quiet:['听说你的名帖也递上来了。等候时人多，若嫌吵，就想想家里后院那棵槐树。','把给{s}抄的一卷书又校了一遍。话不必多，只盼她在殿上不慌。'],
    steady:['我把殿选的次序和礼部常问的几样写在这页纸上。照着准备，答不上的据实说，不丢人。','{s}进宫候选，是喜事，也是要紧事。我得先替她把规矩理清。'],
    proud:['咱们家的女儿上殿，不必看谁脸色。你只管拿出自己的本事，旁人若嚼舌根，我替你挡着。','{s}若能留下，宫里便多一个自家人。我总得护着她。']
  },
  mixed:{
    warm:['听说你也要来候选。宫里的日子不比家里，你想清楚了便好。我这里有暖手炉，冷了就叫人来取。','既盼着{s}能留下作伴，又怕她进来以后，才知道这里的日子没有家信里写的那样好。'],
    candid:['你的名字在册上了。我不说吉利话哄你：宫里的路不好走，你若真愿意，就挺直腰杆走进来。','话说得硬了些。可{s}的事，我宁愿她听实话。'],
    quiet:['名册我看到了。你若愿意来，就来；若不愿意，也别为了家里勉强。','在窗下坐了半日，不知该盼{s}留下，还是盼她回家。'],
    steady:['家里既把你的名帖递上来，你便好好准备。留与不留，都是你自己的造化，我不替你求情，也不拦你。','亲姐妹同在宫中，往后有照应，也有牵扯。这一层我得先想明白。'],
    proud:['家里倒是心急，又把你送来了。你来便来，只记得宫里人人看着，别叫人笑话咱们家。','说不上欢喜，也说不上不欢喜。只怕家里从此把指望分成两份。']
  },
  wary:{
    warm:['你要来候选，我自然替你高兴……只是往后陛下若多看你一眼，你别怪我心里难受。','{s}是亲人，可宫里的眷顾就那么一点。夜里想起这件事，翻来覆去睡不着。'],
    candid:['家里又送人来了？行，你来吧。丑话说在前头，宫里的事各凭本事，我不会让着你。','嘴上说得硬，其实是怕。怕{s}一来，陛下就不记得我了。'],
    quiet:['你要来便来。我这里清静惯了，往后各过各的日子罢。','原想守着自己的一方清静。{s}一来，只怕连这点清静也要分出去。'],
    steady:['家中的意思我明白。你若留下，我们各守位分，别让旁人看我们姐妹争一份恩宠的笑话。','账算得清楚，心里却算不清。只盼{s}来了以后，我们还能像在家时那样说话。'],
    proud:['家里真当我在宫里站不住了，才又送你进来？你来便来，只别指望我替你铺路。','这份恩宠是我一步步挣来的。{s}若要来分，我面上依礼，心里不能不防。']
  },
  resent:{
    warm:['殿上好好答就是了。别的，我同她之间不必再说。','原以为过了这些年能放下。看到{s}的名字，才知道旧事还梗在心口。'],
    candid:['她也要进宫？好啊。从前在家里处处压我一头，到了这里，就各凭本事。','她要来，我不拦。可当年那些事，我一件也没忘。'],
    quiet:['知道了。名册放下吧，不必再提。','把名册合上，在窗前坐到天黑。有些人，见与不见都一样难受。'],
    steady:['各人有各人的路。她若留下，依礼相待便是，私下不必往来。','我不会害她，也不想再同她亲近。照礼数办，便是我能给的全部。'],
    proud:['家里竟又把她送来了。也好，叫她亲眼看看，这宫里如今是谁站稳了脚。','旧账还没有算清，{s}倒要来同我争了。']
  }
};
const SISTER_SELECTION_REPLIES={
  glad:'{s}托人捎来话，我把那页纸折好收进袖里。原来进宫这条路上，有人在前头等我。',
  mixed:'{s}的话里有暖也有冷。我知道她是替我担心，也知道往后的路得自己走。',
  wary:'{s}的话听着不是滋味。我还没进宫门，倒先成了她心里的一根刺。',
  resent:'等了几日，{s}那边没有一句话。早知道旧事没过去，只是没想到会这样冷。'
};
const fullSisterKin=(a,b)=>/^亲[姐妹]$/.test(a.kin?.[b.id]||b.kin?.[a.id]||'');
// A relative from the household register is a sister only when she is the host's own 姐姐 or 妹妹.
function selectionSisterRegister(g){
  const host=g.selectionNatalHost==null?null:familyHostById(g.selectionNatalHost);
  const p=host?.house?.relatives?.find(x=>x.id===g.id);
  if(!p||p.parentRelativeId!=null||p.motherRelativeId!=null||p.natalCollateral)return null;
  const label=natalLabel(host,p);
  return ['姐姐','妹妹'].includes(label)?{host,p,label}:null;
}
function selectionSisterLabel(c,g,register){
  if(c===register?.host)return register.label;
  const own=c.kin?.[g.id],theirs=g.kin?.[c.id];
  if(/^亲[姐妹]$/.test(own||''))return KIN_TXT[own].replace(/^亲/,'');
  if(/^亲[姐妹]$/.test(theirs||''))return theirs==='亲姐'?'妹妹':'姐姐';
  return g.age>c.age?'姐姐':g.age<c.age?'妹妹':register?.label||'妹妹';
}
function selectionSisters(g){
  if(!selectionSistersActive()||g.familyBranchOrigin||g.outerHouseholdId!=null)return [];
  const register=selectionSisterRegister(g);
  if(g.selectionNatalHost!=null&&!register)return [];
  const anchors=S.consorts.filter(c=>c.id!==g.id&&(register?c===register.host:fullSisterKin(c,g)));
  const seen=new Set(),found=[];
  for(const a of anchors)for(const c of [a,...S.consorts.filter(o=>o!==a&&o.id!==g.id&&fullSisterKin(a,o))]){
    if(seen.has(c))continue;seen.add(c);
    if(!c.alive||c.gone||c.maid||c.familyArchive||c.cold)continue;
    found.push({c,label:selectionSisterLabel(c,g,register),register});
  }
  return found;
}
function selectionSisterKind(c,g){
  // Before admission a generated sister has no stored score; addConsort would give her 45, or -30 for a rival.
  const rival=isRival(c,g)||isRival(g,c),score=S.rel&&rk(c,g) in S.rel?relGet(c,g):rival?-30:45;
  const voice=selectionNieceVoice(c),jealous=['善妒','骄纵','骄矜','痴情','好胜'].includes(c.trait);
  if(rival||score<=-20)return 'resent';
  if(voice!=='quiet'&&score<55&&(jealous||c.favor<25||voice==='proud'&&c.favor>=65))return 'wary';
  return score>=35?'glad':'mixed';
}
const SISTER_SELECTION_MOOD={glad:6,mixed:1,wary:-6,resent:-10};
function recordSelectionSisters(g,s=S.selection){
  if(!s?.batch)return '';
  let reply='';
  for(const {c,label,register} of selectionSisters(g)){
    const thread=`selection-sister:${s.batch}:${c.id}:${g.id}`;
    if(c.story.some(e=>e.thread===thread))continue;
    const kind=selectionSisterKind(c,g),voice=selectionNieceVoice(c),back=label==='姐姐'?'妹妹':'姐姐';
    const [words,thought]=SISTER_SELECTION_VOICES[kind][voice].map(t=>t.replace(/\{s\}/g,label));
    const cn=fullName(c),gn=fullName(g),fact=`${label}${gn}列入本届秀女名册，按礼入储秀宫候选。`;
    const away=!inPalace(c),resent=kind==='resent';
    const message=resent?`${cn}${away?'从家信得知消息':'听到消息'}，没有给${label}捎话，只对身边人说：“${words}”`:
      `${cn}${away?'在宫外得了家信，托人给'+label+'带去一页回札':'听到消息，托宫人给'+label+'传话'}：“${words}”`;
    livedRecord([c],'family',SISTER_SELECTION_TITLE,thread,`【${SISTER_SELECTION_TITLE}】${fact}${message}`,[thought]);
    const heard=resent?`${back}${cn}那边没有捎来一句话。`:message;
    livedRecord([g],'family',SISTER_SELECTION_TITLE,thread,`【${SISTER_SELECTION_TITLE}】${gn}列入本届秀女名册。${heard}`,[SISTER_SELECTION_REPLIES[kind].replace(/\{s\}/g,back)]);
    const entry=g.story.at(-1);entry.life.reply=heard;entry.life.sister=c.id;
    if(register&&register.p!==g)(register.p.story||=[]).push({...entry,life:{...entry.life}});
    cchg(c,{mood:SISTER_SELECTION_MOOD[kind]});
    if(!['悲恸','心如死灰'].includes(xinOf(c))){
      const why={glad:`听说${label}${gn}入选秀名册`,mixed:`${label}${gn}入宫候选，放心不下`,
        wary:`${label}${gn}也来候选，怕往后要分一份眷顾`,resent:`与${label}${gn}旧怨未消，她却也来候选`}[kind];
      setXin(c,kind==='glad'?'欢喜':kind==='resent'?(voice==='proud'||voice==='candid'?'嫉恨':'委屈'):'忧心',why,g.id,{record:false});
    }
    c.selectionSisterNews={batch:s.batch,sister:g.id,kind,turn:S.turn};
    reply||=heard;
  }
  return reply;
}
function selectionSisterArrivalNote(g){
  if(!selectionSistersActive())return '';
  const prefix=`selection-sister:${S.selection?.batch}:`;
  return g.story.filter(e=>e.life?.title===SISTER_SELECTION_TITLE&&e.thread?.startsWith(prefix)&&e.life.reply)
    .map(e=>`<p class="hint">${esc(e.life.reply)}</p>`).join('');
}
