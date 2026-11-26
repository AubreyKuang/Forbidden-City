/* 白泉王室有自己的家籍。往来的是亲书和国书，父兄不列本朝官员。 */
function whiteSpringRoyal(c){return c?.fixedStory==='ayimu'&&journalContentVersion()>=87;}
function whiteSpringFamily(c){
  if(c.homeLeave&&!domesticHomeLeaveAllowed(c))delete c.homeLeave;
  if(c.whiteSpringFamily)return whiteSpringProfiles(c,c.whiteSpringFamily);
  const former=c.house;
  const family=c.whiteSpringFamily={
    father:{id:'white-spring-king-'+c.id,name:'父王',alive:former?.father?.alive!==false,story:[]},
    brother:{id:'white-spring-prince-'+c.id,name:'王兄',alive:former?.brother?.alive!==false,story:[]},stamps:{}
  };
  if(former){
    // Keep historical records; other people's marriages and completed stories remain intact.
    c.formerNatalHouse=former;delete c.house;delete c.fatherId;
    for(const other of [...S.consorts,...S.cands]){
      if(other===c)continue;
      if(other.kin)delete other.kin[c.id];
      if(other.kinRival)delete other.kinRival[c.id];
    }
    c.kin={};c.kinRival={};
  }
  delete c.visitor;
  if(c.wish==='mother'||c.wish==='father'){c.wish='poem';c.wishKnown=false;c.wishDone=false;}
  return whiteSpringProfiles(c,family);
}
const WHITE_SPRING_KIN={
  father:{name:'阿尔斯兰',relation:'父王',title:'白泉国王',portrait:314,
    bio:'白泉是泉渠绕城的商路小国，本地出好马和毡，遇上旱年要向邻国换粮。阿尔斯兰熟悉渠上每一道水闸。给朝廷的国书上用王印，给女儿写信却只署“父亲”。',
    admission:'女儿留在京中。临别嘱她，往后白泉使者进京，哪怕只回一句平安，父亲也等着读。'},
  brother:{name:'伊利亚尔',relation:'王兄',title:'白泉王子',portrait:416,
    bio:'阿依慕唯一的兄长。伊利亚尔身量高挑，肩背舒展，笑起来和妹妹有几分相像。白泉人认得这位春会上的好骑手，走商的人却更喜欢请他当通译。',
    admission:'听闻妹妹留在京中，把她最熟悉的那支鼓曲抄了一份，留待下趟使团捎去。'}
};
// These are undated memories from before the marriage, shared by new and existing saves.
const WHITE_SPRING_PAST={
  father:[
    '【旱年的水签】做国王的第三年，城南的泉水只够轮灌。阿尔斯兰先从木牌上摘下王家马苑的水签，挂到最末。入秋时马瘦了一圈，城外的青稞却收成了。此后每逢分水，他都要亲眼看过渠尾那块田。',
    '【两把木斗】边市上，两国商人都说对方少给了粮。阿尔斯兰把两家的木斗借来，装同一袋青稞，当众量了两遍。原来两边都叫一斗，大小却有差。次月开市，门房多了两只并排悬着的样斗。',
    '【临行的针脚】赴京前，他陪女儿收拾行囊。礼单上列了六匹好马，阿依慕却在找母亲缝的旧香囊。他蹲下来替她从箱底摸出香囊，又把国书往旁边挪了挪，腾出一个她伸手就够得到的位置。'
  ],
  brother:[
    '【春会夺彩】春会比骑，少年伊利亚尔在最后一圈俯身摘下彩环，先了半个马头过线。下马时银色束发带歪到了耳后，满场的人还在喊他的名字。他把赢来的青绸系在阿依慕的小鼓上，由她敲响散场的三拍。',
    '【三国行记】第一次随商队出关，他在青石国住过马栈，在蒲海国跟摆渡人学算船钱，又到赤谷国听乐师排过一场春舞。回到白泉，给父王的是一本写着水站、渡钱和市日的路簿，给妹妹的是三支会唱却还不会记谱的曲子。',
    '【送行前一夜】妹妹问，到了京城，若通译把她的话听岔了怎么办？伊利亚尔陪她把“我还没说完”这句官话练了几遍。他也许下心愿，要让两地懂彼此语言的人多起来，让妹妹想念家里时随时有话可捎。'
  ]
};
const WHITE_SPRING_DEEDS={
  post:{title:'两封回单',
    father:'收到两边议定的驿期，特意问迟到的商旅还能不能递信。得知可以顺延，才把日期抄给王后，让她往后等女儿的信也有个准数。',
    brother:'把京城送来的驿名与旧路簿逐站对过，发现一个水站在两国语中名字相差甚远。他把两个写法并在回单上，请驿人以后见到两种都收。'},
  calendar:{title:'一张双历',
    father:'照核准的日子，在市口贴出两种文字的市期，叫放牧人回山前也能抄上一份。开市还有些时日，毋须早早赶着马群来等。',
    brother:'照妹妹和通译核定的市期，把白泉与京城的日期写在同一张纸上。他留出一行空白，请回程商人添上实际到关的日子。'},
  market:{title:'开市那天',
    father:'互市议成，叫人在市口支起旧时那两把样斗。第一车青稞称完，他才取下王印，给当日的交割簿盖印。',
    brother:'开市的消息传来，带着初到的客商走了一遍市集。散市时他给妹妹留了句话：“往后谁提起白泉，愿他们也记得这里有人同他们做过一桩公道买卖。”'},
  review:{title:'暂缓盖印',
    father:'两边还要复议，便把空着的市期留在簿上，嘱人及早告知商队，免得大家白白在关口多等。',
    brother:'把有歧义的写法抄作两栏，托使者带去请关内的通译也写一份。他在页边留了话：“让商人等准信。这件事该由我们问明白，别劳妹妹在宫里替人赔情。”'},
  saddle:{title:'一副旧鞍',
    father:'巡看驿马时，听驿人说有一副鞍垫总磨马背，便让他当面拆给自己看。这才知道几处马栈用的尺寸不同，记下了该添哪两种垫子。',
    brother:'随送毡的商队试过一程驿马，自己垫上旧鞍才觉出驿人说的毛病。回程时给妹妹捎去一小角新毡：“你从前总嫌鼓槌硌手，拿这个把柄缠一圈。”',
    news:'拆开兄长随商队捎来的软毡，照信上的样子缠好鼓槌。拿起来试了两拍，果然比从前趁手。'},
  interpreters:{title:'市口的小译席',
    father:'准许本国商旅在白泉市口借间空屋教两地商话。来请示的人问该收多少束脩，他想了想，只叫学成的人往后陪新来的客商走一回集。',
    brother:'领着学商话的年轻人坐了一上午集市，叫他们把买卖双方的话各说给对方听。他给妹妹写道：“等他们再走熟几回，两边遇事便能坐下来讲清楚，也用不着事事托你去开口了。”',
    news:'读到兄长教年轻人当通译的消息，又把他信里抄来的第一道习题念了一遍。她在纸边添上京里更常说的那个词，留着下回捎回白泉。'}
};
function whiteSpringDeed(c,key){
  if(journalContentVersion()<116||!whiteSpringRoyal(c))return;
  const f=whiteSpringFamily(c),deed=WHITE_SPRING_DEEDS[key];
  const done=f.deeds||={};
  if(done[key]||(!f.father.alive&&!f.brother.alive))return;
  done[key]=true;
  for(const role of ['father','brother']){
    if(f[role].alive)story(f[role],'【'+deed.title+'】'+deed[role]);
  }
  if(deed.news&&f.brother.alive&&c.alive&&!c.gone)story(c,'【白泉家音】'+deed.news);
}
function whiteSpringHomeNews(c){
  const f=whiteSpringFamily(c);
  if(!f.father.alive&&!f.brother.alive)return;
  const start=c.enteredAt??(f.newsStart??=S.turn);
  if(!f.deeds?.saddle&&S.turn-start>=6){
    whiteSpringDeed(c,'saddle');f.nextHomeNews=S.turn+12;
  }else if(f.deeds?.saddle&&!f.deeds.interpreters&&S.turn>=f.nextHomeNews){
    whiteSpringDeed(c,'interpreters');
  }
}
function whiteSpringProfiles(c,family){
  if(journalContentVersion()<108)return family;
  for(const [role,data] of Object.entries(WHITE_SPRING_KIN)){
    const p=family[role];
    p.name=data.name;p.portraitOverride=data.portrait;
    if(!p.admissionRecorded){
      const entry=c.story?.find(e=>e.t.includes('，赐居'));
      if(entry&&p.alive){
        p.story.unshift({d:entry.d,t:'【公主入宫】'+data.admission});
        p.admissionRecorded=true;
      }
    }
  }
  return family;
}
function whiteSpringKinTarget(id){
  const match=/^white-spring-(king|prince)-(\d+)$/.exec(id);
  if(!match||journalContentVersion()<108)return null;
  const c=familyHostById(Number(match[2]));
  if(!whiteSpringRoyal(c))return null;
  const role=match[1]==='king'?'father':'brother';
  return {c,role,person:whiteSpringFamily(c)[role],view:'white-spring-kin',id};
}
function whiteSpringKinLinks(c){
  if(!whiteSpringRoyal(c)||journalContentVersion()<108)return '';
  const f=whiteSpringFamily(c);
  return Object.entries(WHITE_SPRING_KIN).map(([role,data])=>{
    const p=f[role];
    return `<button class="graph-kin-person${p.alive?'':' deceased'}" data-onclick="A.go('white-spring-kin','${p.id}')" aria-label="查看${data.relation}${p.name}">${porImg(p,34)}<span class="graph-person"><strong>${p.name}</strong><small>${data.relation} · ${data.title}${p.alive?'':' · 已故'}</small></span></button>`;
  }).join('');
}
function viewWhiteSpringKin(){
  const target=whiteSpringKinTarget(UI.sel);
  if(!target)return personBackButton('family');
  const {c,role,person:p}=target,data=WHITE_SPRING_KIN[role];
  const past=WHITE_SPRING_PAST[role].map(t=>({d:'公主入宫前',t}));
  const chronicle={...p,story:[...past,...p.story]};
  return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg(p,144)}<div class="grow"><p>白泉王室 · ${data.title}${p.alive?'':' · 已故'}</p><h2>${p.name}</h2><p>${data.bio}</p>
    <button class="btn quiet sm" data-onclick="A.go('consort',${c.id})">${role==='father'?'女儿':'妹妹'} · 阿依慕 ↗</button></div></header>${detailSection('人物纪事',detailStory(chronicle))}`;
}
function whiteSpringLetter(c,kind,fact,voices,replies,stamp){
  const family=whiteSpringFamily(c);
  if(family.stamps[kind]===stamp)return;
  family.stamps[kind]=stamp;
  const passages=[];
  for(const [role,quote] of [['father',voices[0]],['brother',voices[1]]]){
    const writer=family[role];if(!writer.alive)continue;
    story(writer,`【${kind}】得知阿依慕${fact}，在白泉写道：“${quote}”`);
    passages.push((journalContentVersion()>=108?WHITE_SPRING_KIN[role].relation+writer.name:writer.name)+'写道：“'+quote+'”');
  }
  if(!passages.length)return;
  const record=storyCastRecord('ayimu');
  const route=record?.whiteSpringPost||record?.life?.post?'白泉家书按两边约定的驿期送抵。':'白泉使团捎来了家书。';
  const line='【白泉家书·'+kind+'】'+route+'信中提起阿依慕'+fact+'的消息。'+passages.join(' ');
  if(c.alive&&!c.gone)story(c,line);
  family.latest={kind,fact,line,replies,turn:S.turn,date:dateStr(),stamp,answered:false};
}
function whiteSpringFamilyChanges(c,old,previous){
  const send=(kind,fact,father,brother,replies,detail='')=>whiteSpringLetter(c,kind,fact,[father,brother],replies,S.turn+':'+detail);
  const peace=['亲笔写几句起居','把衣食睡眠逐样写清，托回白泉的使者交给家人。'];
  if(!c.alive){
    if(old.alive)send('丧讯','离世','你临行时答应给家里写信。最后那张信纸我一直收着。','那几面舞鼓我亲手收回库里了。下回开市，再也等不到妹妹的信了。',[]);
    return;
  }
  if(c.gone)return;
  if(journalContentVersion()>=116&&S.turn>previous.turn&&!c.cold)whiteSpringHomeNews(c);
  if(old.preg<2&&c.preg>=2)send('有孕','有了身孕','报喜的国书我已看过两遍。我另写这封，只问女儿近日吃得下什么，夜里睡得好不好。','你小时候嫌我把摇篮曲唱走了调。我把曲子请人谱下了，等你想听时唱给小家伙。',['用白泉话回报孕中起居','在信末添了几句小时候的摇篮曲，告诉家人自己近来的胃口。']);
  const newborn=S.children.filter(k=>k.mom===c.id&&c.delivery?.children.includes(k.id)&&k.alive&&!previous.children?.some(o=>o.id===k.id));
  if(newborn.length){
    const names=newborn.map(k=>k.pendingName?(k.sex==='m'?'一位皇子':'一位公主'):kidName(k)).join('、');
    const all=newborn.length>1?'孩子们':'孩子',kin=newborn.length>1?'外甥们':newborn[0].sex==='m'?'小外甥':'小外甥女';
    send('诞育',`生下${names}`,`听说你生下${names}。报信的人只顾着道喜，我把他留下来，又问了一遍你的身子可好。`,
      `给${kin}的小毡毯已经织好，边角都包了软布。等${all}大些，我想听一声白泉话的“舅舅”。`,
      ['回报产后起居，收下毡毯',`告诉家人自己如何休养，也说起${all}睡醒时的小模样。`],newborn.map(k=>k.id).join(','));
  }
  if(c.rank!==old.rank){
    const fact='由'+RANKS[old.rank]+'改封'+RANKS[c.rank];
    if(c.rank>old.rank)send('晋封',fact,'听见册封使念出你的新位分，我很高兴。席上再有人问起白泉，你可以亲自讲讲故乡的规矩。','我把你的新位分写给通译了，免得下回递国书还用旧称。妹妹，你真给家乡长脸。',peace,c.rank);
    else{
      const cause=familyPenaltyContext(c,old);
      send('降位',fact,cause.known==='guilty'?`来使已经说清${cause.crime}一事。你该担的过，要认；在父亲跟前，也不必藏起难处。`:
        '国书上只写了你的新位分。你若愿意说原委，就用家里的话写给我；若不愿说，报个平安也好。',
        '我把回函另封，没有当着商队的人拆读。妹妹若缺衣物，只管把单子夹进家信。',['另封一信说明降位缘由','另用白泉文字写了一封私信，交使者亲手递给家人。'],c.rank);
    }
  }
  if(c.cold!==old.cold){
    if(c.cold)send('冷宫','被迁入冷宫','礼官说你迁了居处。我托使者依宫规递信，只盼天冷时，你手边还有一领厚衣。','我把要说的话尽量写短，让递交的人好查验。得空回一个字，家里就知道你收到了。',peace);
    else send('复出','获准离开冷宫','读到你迁出冷宫的消息，我才松了口气。先安顿住处，等歇好了再写长信。','这些日子给你存了几支故乡的新曲，等下趟商队启程，我一张张抄给你。',peace);
  }
  if(!c.cold&&old.favor<70&&c.favor>=70)
    send('得宠','近来深受眷顾','使者说，席上有人愿意听你讲白泉的事了。我为女儿高兴。若有机会，就教他们念一念故乡的名字。',c.gardenDrummers?.length?'听说你教会了宫里的人打收袖那两拍。妹妹，故乡的曲子有了新鼓手，做哥哥的也跟着骄傲。':'我把信带给了送你出关的老乐工。他问下回入京能不能听你再跳一支，我说这话要让妹妹自己答。',['捎回一张白泉舞谱','把在宫里跳过的那一段鼓点抄下，托使者交回故乡。']);
  if(!c.cold&&old.favor>=25&&c.favor<25){
    const daughter=S.children.find(k=>k.alive&&k.mom===c.id&&k.spouse?.route==='whiteSpring'&&!k.household?.whiteSpringVisit);
    send('少见','近来少有召见','上一封信只写了问安的套语。你是我女儿，在家信里用不着只报喜。',daughter?`上回见到${daughter.name}，她还问起母亲。这封信给你留了半页，想说给她的话，我替你送去。`:'你从前不痛快，总要到鼓边坐坐。我在信尾画了一面小鼓，你看见就当哥哥陪你坐了一会儿。',peace);
  }
}
function whiteSpringMailPanel(c){
  if(!whiteSpringRoyal(c))return '';
  const f=whiteSpringFamily(c),m=f.latest;
  const notes=journalContentVersion()>=108?whiteSpringKinLinks(c):[f.father,f.brother].map(p=>p.story.length?`<details><summary>${p.name}的纪事</summary>${detailStory(p)}</details>`:'').join('');
  const reply=m?.replies.length&&!m.answered&&c.alive&&!c.gone&&!S.over?`<button class="btn jade" data-onclick="A.whiteSpringReply(${c.id})">随使团回信</button>`:'';
  return detailSection('白泉王室家书',`<p>父王 · 王兄 · 来信随白泉使团递送</p>${m?`<p>${esc(m.date)} · ${esc(m.line)}</p>`:''}${reply}${notes}`);
}
A.whiteSpringReply=function(id){
  const c=byId(id),m=c?.whiteSpringFamily?.latest;
  const valid=()=>whiteSpringRoyal(c)&&c.alive&&!c.gone&&!S.over&&m&&m===c.whiteSpringFamily.latest&&!m.answered&&m.replies.length;
  if(modalOpen||!valid())return;
  const send=text=>{if(!valid())return null;m.answered=true;story(c,'【寄往白泉】'+text);
    for(const role of Object.keys(WHITE_SPRING_KIN)){
      const p=c.whiteSpringFamily[role];
      if(p.alive)story(p,'【宫中回信】'+text+(journalContentVersion()<108?'':role==='father'?' 读罢女儿的亲笔，把信折好，收进自己的信匣。':' 认出妹妹的字迹，把最后几行又读了一遍。'));
    }
    return text;};
  pushEv({title:'寄往白泉的回信',por:c,text:m.line,choices:[{t:m.replies[0],f:()=>send('阿依慕'+m.replies[1])},
    {t:'只附亲笔平安笺',f:()=>send('阿依慕用白泉话写了一张短笺，署了小时候在家用的小名。')},{t:'留待下次使团'}]});
};
