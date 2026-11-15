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
const birthFeelingsFinish=finishDelivery;
finishDelivery=function(c){
 const fresh=c?.delivery&&!c.delivery.settled,result=birthFeelingsFinish(c);
 if(!fresh||journalContentVersion()<12)return result;
 const feeling=recordBirthFeeling(c);return result+(feeling?'\n\n'+feeling:'');
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
