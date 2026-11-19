/* Love for a newborn and disappointment about an imagined future can coexist.
   Resolve once after safe delivery; viewing or loading never rolls a new feeling. */
function birthFeelingContext(c,children){
 const prior=S.children.filter(k=>k.mom===c.id&&!children.includes(k));
 const sons=prior.filter(k=>k.alive&&k.sex==='m').length;
 const loss=prior.some(k=>!k.alive||k.lost),missing=prior.some(k=>k.lost);
 const ambitious=['城府','骄纵','骄矜','善妒'].includes(c.trait);
 const quiet=isSolitary(c)||['淡泊','体弱'].includes(c.trait);
 let regret=quiet||loss?0:ambitious?.55:['温婉','痴情','巧手'].includes(c.trait)?.08:.18;
 if(regret&&c.favor<30)regret+=.12;
 if(sons)regret*=.2;
 if(children.some(k=>k.sex==='m'))regret=0;
 return {sons,loss,missing,ambitious,regret};
}
function recordBirthFeeling(c){
 const d=c.delivery,ks=deliveryKids(c);
 if(!d?.settled||d.feeling||!c.alive||d.concealedLoss||!ks.length||ks.some(k=>!k.alive||k.pendingName||k.birthSwap?.occurred))return '';
 const context=birthFeelingContext(c,ks),regret=context.regret>0&&chance(context.regret),names=ks.map(k=>k.name).join('、');
 const plural=ks.length>1,child=plural?'孩子们':'这孩子';
 let line;
 if(context.loss)line=`能听见${names}的哭声，我就安心些。${context.missing?'失散的孩子还没有找到，我仍惦念着':'先前失去的孩子仍记在心里'}，眼前的${child}也要好好照看。`;
 else if(regret){
  const wish=context.sons?'已经有了皇子，原不该还这样盘算；可这回我也曾盼着再添一个。':'原也盼着这一胎能有个皇子，说全不失落，是假的。';
  line=context.ambitious?`${wish}可${names}攥住我的手，我又哪里舍得松开。那些盼望是我的，不能让${plural?'她们':'她'}受委屈。`:
   `${wish}方才抱着${names}，又觉得心里软得很。是公主，也是我盼了许久的${child}。`;
 }else if(c.trait==='体弱')line=`让我歇一歇，再陪${names}一会。能平安相见，已经很好。`;
 else if(isSolitary(c))line=`让屋里静些罢。我想陪着${names}，听听${plural?'他们':'孩子'}的呼吸。`;
 else if(['淡泊','沉静'].includes(c.trait))line=`不忙着替${names}想什么前程。眼下睡得安稳、长得康健，便是我的欢喜。`;
 else if(['活泼','爽直','将门'].includes(c.trait))line=`${names}的手这样小，我竟不敢用力。等${child}长大了，有许多好玩的事要一起试呢。`;
 else if(context.ambitious&&ks.some(k=>k.sex==='m'))line=`听说有了皇子，我确实松了口气。可见到${names}，又只想先把${child}照顾好，往后的事慢慢再想。`;
 else line=`方才${names}握住我的手，我便不舍得放了。只盼${child}平安长大，有自己的欢喜。`;
 const text=`${fullName(c)}产后初见${names}，${maternalStyle(c)[0].replace(/^她/,'')}。\n她轻声说：“${line}”`;
 d.feeling={turn:S.turn,date:dateStr(),children:ks.map(k=>k.id),regret,context,line,text};
 const thread=`birth-feeling:${S.gen}:${c.id}:${d.turn}`;
 story(c,text);Object.assign(c.story.at(-1),{thread,life:{kind:'family',title:'初见孩子的心事',turn:S.turn,gen:S.gen,
  people:[{id:c.id,name:fullName(c)},...ks.map(k=>({id:k.id,name:k.name}))]}});
 NPCMemory.record(S,{type:'birth-feeling',time:S.turn,participants:[c.id,...ks.map(k=>k.id)],object:'初见孩子的心事',outcome:text},
  ks.map(k=>({person:c.id,subject:k.id,interpretation:text,emotion:.5,impact:85,channel:'participant'})));
 // The chronicle can record a baby's care; a newborn cannot remember an adult's private disappointment.
 for(const k of ks){kstory(k,`产后初见，生母${fullName(c)}照看${k.name}，${maternalStyle(c)[0].replace(/^她/,'')}。`);
  Object.assign(k.story.at(-1),{thread,life:{kind:'family',title:'初见孩子的心事',turn:S.turn,gen:S.gen,people:[{id:c.id,name:fullName(c)},{id:k.id,name:k.name}]}});
 }
 return text;
}
// Record the news once, after the whole birth batch has been named and its outcome is known.
function goodBirthSigns(k){
 return (k.birthLabels||[k.birthOmen]).filter(id=>BIRTH_LABELS[id]?.kind==='good');
}
function recordBirthOmenReactions(mother){
 const d=mother.delivery,kids=deliveryKids(mother);
 if(!d.settled||!mother.alive||d.concealedLoss||!kids.length||kids.some(k=>!k.alive||k.pendingName||k.birthSwap?.occurred))return '';
 const marked=kids.filter(k=>goodBirthSigns(k).length),signs=[...new Set(marked.flatMap(goodBirthSigns))].map(id=>BIRTH_LABELS[id].name);
 if(!signs.length)return '';
 const names=marked.map(kidName).join('、'),news=`${fullName(mother)}诞下${names}，诞生簿记着“${signs.join('、')}”`;
 const son=marked.some(k=>k.sex==='m'),responses=[];
 for(const c of harem().filter(c=>c!==mother&&c.rank>=5&&inPalace(c)).sort((a,b)=>b.rank-a.rank)){
   const feeling=palaceSocialFeeling(c,mother),close=feeling==='close',atOdds=feeling==='strained';
   const own=S.children.filter(k=>k.alive&&!k.lost&&!k.removedFromRoyal&&(k.mom===c.id||k.foster===c.id));
   const peer=(son&&own.find(k=>k.id===S.heir))||own.find(k=>kids.some(n=>n.sex===k.sex))||own[0];
   let doubt;
   if(son&&peer&&peer.id===S.heir)doubt=`东宫的师傅明早也会听说。若有人拿天象与太子${peer.name}相比，我该怎么同他说？`;
   else if(peer)doubt=`下回${peer.name}生辰，若听见旁人只问今日的祥瑞，心里会是什么滋味？`;
   else if(c.rank===8)doubt='连该怎样写贺表都有人先去问产房。往后六宫有事，还会先到中宫来么？';
   else doubt='方才来借贺礼样子的宫人，一进门就打听那边的喜好。往后还有谁记得我这里的规矩？';
   let gesture;
   if(close)gesture=son?'她拣了最软的一匹旧绫给孩子做贴身衣裳，捎话说：“听说你们都平安，我今夜能睡个好觉了。”':
     '她翻出亲手绣的小花鞋，笑着叫人送去：“等小公主会走路，我还要再给她做一双。”';
   else if(atOdds)gesture='她听着廊下的人争说吉兆，把贺礼单上另添的一笔轻轻抹去：“照宫例送。孩子的份，一样别少。”';
   else gesture=c.rank===8?'她照例给产房添了赏，听到掌事又提吉兆，才放下笔：“先让她们安安静静歇一晚。”':
     '她吩咐备贺，听见宫人把吉语说了一遍又一遍，手里的茶一直放到凉透。';
   const text=`${news}。${gesture}等报喜的人走远，她心里却还压着一句话：“${doubt}”`;
   const title='听闻皇嗣祥瑞';
   story(c,`【${title}】${text}`);
   Object.assign(c.story.at(-1),{thread:`birth-omen:${S.gen}:${mother.id}:${d.turn}`,
     life:{kind:'family',title,turn:S.turn,gen:S.gen,people:[c,mother].map(p=>({id:p.id,name:fullName(p)})).concat(kids.map(k=>({id:k.id,name:k.name})))}});
   cchg(c,{mood:close?2:atOdds?-5:-2});
   responses.push({close,line:`${cName(c)}听到喜信。${gesture}她私下想：“${doubt}”`});
 }
 if(!responses.length)return '';
 const first=responses[0],other=responses.find(r=>r.close!==first.close);
 return news+'。\n'+[first,other].filter(Boolean).map(r=>r.line).join('\n');
}
const FAMILY_DAUGHTER_WISH_CHANCE=.25;
function familyDaughterBirths(c){
 const sons=[];let daughter=false;
 for(const k of royalHouseholds()){
  if(k.mom!==c.id||k.adoptedRoyal||k.outsideFamilyOrigin||k.pendingName||k.deathReason==='出生时已无生息')continue;
  if(k.birthSwap?.occurred){
   const original=k.birthSwap.original;
   if(original?.sex==='f'&&original.alive!==false)daughter=true;
   continue;
  }
  if(k.sex==='f')daughter=true;
  if(k.sex==='m')sons.push(k);
 }
 return {sons,daughter};
}
function familyDaughterWriters(c){
 if(whiteSpringRoyal(c))return whiteSpringFamily(c);
 const h=houseOf(c);if(!h)return {};
 const canWrite=p=>officialAlive(p)&&!p.exiled&&!p.jailed;
 const motherBorn=h.natal?.memberBorn?.[c.id]??S.turn-c.age*12;
 const brothers=[...brotherRoles(h).map(role=>h[role]).filter(p=>p.age>=c.age),
  ...natalPeople(h).filter(p=>p.sex==='m'&&!p.parentRelativeId&&!p.motherRelativeId&&p.born<motherBorn)];
 return {father:canWrite(h.father)?h.father:null,brother:brothers.find(canWrite)};
}
function familyDaughterLetter(c){
 const delivery=c.delivery,kids=deliveryKids(c);
 if(!c.alive||!delivery.settled||delivery.outcome?.loss||delivery.concealedLoss||delivery.swap||
    !kids.length||kids.some(k=>!k.alive||k.sex!=='m'||k.birthSwap?.occurred))return null;
 const {sons,daughter}=familyDaughterBirths(c);
 if(daughter||sons.length<3||new Set(sons.map(k=>k.born)).size<2)return null;
 const family=familyDaughterWriters(c),whiteSpring=whiteSpringRoyal(c);
 const writers=['father','brother'].filter(role=>officialAlive(family[role])&&c.familyDaughterWishes?.[role]==null&&chance(FAMILY_DAUGHTER_WISH_CHANCE));
 if(!writers.length)return null;
 const lines={
  father:whiteSpring?'得知你和孩子都平安，我便叫人添灯，夜里把信又读了两遍。往后若添一个外孙女，我想亲手给她削一匹小木马。给她哥哥们的也早留着。':
    ['报喜的小厮话还没说完，我已叫厨房给家里添两个菜。听说孩子哭声响亮，甚好。以后家里若添个外孙女，我那匣子旧书也能再教一个孩子读。','你和孩子都安稳，家里才睡得踏实。你小时戴过的那只银铃我还收着，有朝一日若有个外孙女，真想听那铃声再响一回。'],
  brother:whiteSpring?'我已挑了一面小鼓，请使团送给孩子。若哪年有了外甥女，我就把咱们小时候一起学的那支曲子也抄来，叫他们几个轮流敲。':
    ['得信时我正在吃饭，欢喜得连筷子都放错了地方。几个外甥有伴很好。若日后添个外甥女，我早想当一回给她挑花灯的舅舅。','我给新来的小外甥备了木陀螺，哥哥们也各有一只。说件闲话给你听，我还盼哪天有个外甥女来拆我的礼，到时可得先找你问问她爱什么。']
 };
 const letters=writers.map(role=>{
  const p=family[role],variants=lines[role];
  return {role,p,line:Array.isArray(variants)?variants[marriageHash(p.id+':daughter-letter')%variants.length]:variants};
 });
 const title='报喜后的家书',names=kids.map(k=>k.name).join('、');
 const text=`${fullName(c)}诞下${names}的喜信传到家里。接连几回都是皇子，家人先问过母子平安，这才提笔写了几句家常。
`+
  letters.map(({role,p,line})=>`${whiteSpring?(role==='father'?'父王':'王兄'):role==='father'?'父亲':'兄长'}${p.name}在信中写道：“${line}”`).join('\n');
 const people=[{id:c.id,name:fullName(c)},...kids.map(k=>({id:k.id,name:k.name})),...letters.map(({p})=>({id:p.id,name:p.name}))];
 const record=(p,line)=>{
  p.story ||= [];story(p,`【${title}】${line}`);
  p.story.at(-1).life={kind:'family',title,turn:S.turn,gen:S.gen,people,source:'报喜家书',summary:text};
 };
 return {title,por:c,text,choices:[{t:'收好家书',f:()=>`${fullName(c)}把家书收进妆匣，托人把孩子如今能吃能睡的消息带回去。`}],valid:()=>c.alive&&c.delivery===delivery,
  onShow:()=>{
   for(const {p,role,line} of letters){
    (c.familyDaughterWishes||={})[role]=S.turn;
    record(p,`写信贺${fullName(c)}平安生下${names}。信里写道：“${line}”`);
   }
   record(c,`娘家得知她与${names}平安，写信来贺。她读过${letters.map(({p})=>p.name).join('、')}的家书，把孩子眼下的起居也托人捎去。`);
  }};
}
const birthFeelingsFinish=finishDelivery;
finishDelivery=function(c){
 const fresh=c?.delivery&&!c.delivery.settled,result=birthFeelingsFinish(c);
 if(!fresh||journalContentVersion()<12)return result;
 const feeling=recordBirthFeeling(c);
 const reactions=journalContentVersion()>=80?recordBirthOmenReactions(c):'';
 if(journalContentVersion()>=117&&PalaceActions.busy&&c.delivery.settled)pushEv(familyDaughterLetter(c));
 return [result,feeling,reactions].filter(Boolean).join('\n\n');
};
const birthFeelingsVoice=maternalVoice;
maternalVoice=function(c){
 const hurt=c.parentageHurt,child=hurt&&kidById(hurt.child);
 if(hurt&&S.turn-hurt.turn<3&&child?.alive&&inPalace(c)&&xinOf(c)==='委屈'&&!maternalConcern(c))
  return voiceLine('maternal-cleared',`说起${child.name}的身世查证，她仍有些委屈。`,hurt.line);
 const f=c.delivery?.feeling,ks=deliveryKids(c);
 if(f&&S.turn-f.turn<=2&&!maternalConcern(c)&&inPalace(c)&&ks.length&&ks.every(k=>k.alive&&maternalStatus(k,c)==='near'))
  return voiceLine('maternal-newborn',`说起${ks.map(k=>k.name).join('、')}，她还记得初见时的心情。`,f.line);
 return birthFeelingsVoice(c);
};
