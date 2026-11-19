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
    bio:'亲自带阿依慕赴京求亲。国书上用王印，问女儿冷暖的私信却只署“父亲”。',
    admission:'女儿留在京中。临别嘱她，往后白泉使者进京，哪怕只回一句平安，父亲也等着读。'},
  brother:{name:'伊利亚尔',relation:'王兄',title:'白泉王子',portrait:416,
    bio:'阿依慕唯一的兄长。兄妹自小熟悉同一套鼓曲，妹妹远嫁后，他常把新曲和家里的消息一道寄去。',
    admission:'听闻妹妹留在京中，把她最熟悉的那支鼓曲抄了一份，留待下趟使团捎去。'}
};
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
    return `<button class="graph-kin-person${p.alive?'':' deceased'}" onclick="A.go('white-spring-kin','${p.id}')" aria-label="查看${data.relation}${p.name}">${porImg(p,34)}<span class="graph-person"><strong>${p.name}</strong><small>${data.relation} · ${data.title}${p.alive?'':' · 已故'}</small></span></button>`;
  }).join('');
}
function viewWhiteSpringKin(){
  const target=whiteSpringKinTarget(UI.sel);
  if(!target)return personBackButton('family');
  const {c,role,person:p}=target,data=WHITE_SPRING_KIN[role];
  return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg(p,144)}<div class="grow"><p>白泉王室 · ${data.title}${p.alive?'':' · 已故'}</p><h2>${p.name}</h2><p>${data.bio}</p>
    <button class="btn quiet sm" onclick="A.go('consort',${c.id})">${role==='father'?'女儿':'妹妹'} · 阿依慕 ↗</button></div></header>${detailSection('人物纪事',detailStory(p))}`;
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
  const reply=m?.replies.length&&!m.answered&&c.alive&&!c.gone&&!S.over?`<button class="btn jade" onclick="A.whiteSpringReply(${c.id})">随使团回信</button>`:'';
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
