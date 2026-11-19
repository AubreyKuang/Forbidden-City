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
function selectionNieceFamily(g){
  if(!selectionNiecesActive())return null;
  const origin=g.familyBranchOrigin;
  if(origin){
    const e=natalEntry(origin.host,origin.relative),mother=e&&natalSisterMother(e.c,e.p);
    if(!mother||!e.p.alive)return null;
    return {relative:e.p,aunts:selectionNieceAunts(paternalFamily(e.c),mother,e.p,g.selectionNatalHost)};
  }
  const child=nieceSelectionEntryActive()&&g.outerHouseholdId!=null?outerChild(g.outerHouseholdId):null;
  if(child?.familySelection!=='listed')return null;
  const m=outerMother(child.mother);
  if(m?.relative==null)return null;
  const relative={id:child.id,name:child.alias};
  const host=familyHostById(m.owner??m.host),mother=outerSister(m)||{id:m.relative};
  const people=[...(host?paternalFamily(host):[]),familyHostById(m.host)];
  return {relative,aunts:selectionNieceAunts(people,mother,relative,m.host),outer:{m,child}};
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
function recordSelectionNiece(g,outcome,s=S.selection,family=selectionNieceFamily(g)){
  if(!s?.batch||!family)return '';
  const {relative:p,aunts,outer}=family,title=NIECE_SELECTION_TITLES[outcome],subject=outcome==='kept'||outer?g:p;
  const fact={entered:`${p.name}列入本届秀女名册，按礼入储秀宫候选。`,
    kept:`${p.name}殿前留牌，初封${RANKS[g.rank]}。`,lost:`${p.name}此次未留牌，将随家人归去。`}[outcome];
  let reply='';
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
    reply||=message;
  }
  return reply;
}
function selectionNieceArrivalNote(c){
  const prefix=`selection-niece:${S.selection?.batch}:`;
  const entry=(c.familyBranchOrigin||nieceSelectionEntryActive()&&c.outerHouseholdId!=null)&&
    c.story.find(e=>e.life?.title===NIECE_SELECTION_TITLES.entered&&e.thread?.startsWith(prefix));
  return entry?.life?.reply?`<p class="hint">${esc(entry.life.reply)}</p>`:'';
}
