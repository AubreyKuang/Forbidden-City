const imperialHeirStoriesActive=()=>journalContentVersion()>=64;
const eligiblePalaceSon=k=>!!k?.alive&&k.sex==='m'&&!k.pendingName&&!k.removedFromRoyal&&!k.lost;
function laterImperialSon(k,adopted){
  if(!eligiblePalaceSon(k)||k.palaceAdoption||k.birthSwap?.confirmed&&k.birthSwap.occurred)return false;
  if(knownBiologicalFather(k)&&k.parentage.father.kind!=='emperor')return false;
  const delivery=byId(k.mom)?.delivery;
  if(delivery&&!delivery.settled&&(delivery.children||[]).some(id=>id===k.id))return false;
  const at=adopted.palaceAdoption.at;
  return k.born>at||k.born===at&&k.id>adopted.id;
}
function imperialHeirNotes(adopted,brother,kind,line){
  const q=empress(),mother=brother&&byId(brother.mom),from=adopted.palaceAdoption,father=royalById(from.father);
  const origin=father&&princeSonMother(father,{mother:from.motherId});
  const restless=['好胜','审慎','内敛','自矜'].includes(childDisposition(adopted));
  const elder=kind==='立储'?(restless?'入东宫后，他先问太傅礼节要从何学起。府里来信，他读了两遍才收起来。':'他先问可否向从前照料自己的人报平安，次日照旧到太傅处读书。'):
    kind==='改立'?'他收拾东宫书案，把从前答应讲给弟弟听的书另放在一边。':kind==='守储'||kind==='缓议'?'他听完御批，回东宫照常进讲，也托人问候弟弟。':
      kidAge(adopted)<5?'他听见宫人唤新来的孩子弟弟，让人把一只布虎送去。':restless?'他也想去看看弟弟，却怕宫人已开始拿两人相比，托太傅替自己把话说清。':'他托人给弟弟送去一件小礼，仍盼以后能一道读书。';
  princePersonNote(adopted,`${line}${elder}`);
  if(brother){
    const response=kidAge(brother)<3?'这一日，他仍随乳母起居。大人说的话，等他长大才会明白。':
      kidAge(brother)<5?'他只记得长兄答应过来教自己描红。':'他问太傅，这些议论会不会让长兄疏远自己。';
    princePersonNote(brother,`${line}${response}`);
  }
  if(q){
    const feeling=q===mother?(adopted.foster===q.id?'她两边都养在心上，叫乳母照应弟弟，也让人问长兄今夜可好。':q.scheme>=60?'她关心亲儿的处境，私下多问了几句礼部的风向。':'她惦记亲儿平安，也叫宫里照旧敬重兄长。'):
      adopted.foster===q.id?'她熟知养子的脾气，特意请他来用膳，听他说完再劝他安心。':q.scheme>=60?'她依礼向两边传话，回到中宫后又细想谁会借此起议。':'她让两边按原礼照料孩子，叮嘱宫人莫拿派系话逗他们。';
    princePersonNote(q,`${line}${feeling}`);
  }
  if(mother?.alive&&mother!==q)princePersonNote(mother,`${line}她只希望朝廷议事时顾着孩子的平安，又托乳母告诉长兄，弟弟今日安好。`);
  if(father?.alive&&!father.princeAdoptionOrigin)princePersonNote(father,`${line}${father.amb>=65?'他嘱府里依礼送书问候，早些收住关于储位的议论。':'他惦记孩子心里有没有不安，只托人带一句问安。'}`);
  if(adoptionLiving(origin))princePersonNote(origin,`${line}${origin.marriageNature?.temperament==='沉静'?'她把消息夹在旧家书里，几日后才托人写回复。':'她想知道孩子如今睡得好不好，又怕自己的关切给孩子添压力。'}`);
  log(line,1);
}
function imperialHeirNotice(adopted,brother,installed){
  const title=installed?'东宫新册 · 宗亲入继':kidAge(brother)<1?'新皇子降生 · 两房牵挂':'宗谱并列 · 两房牵挂';
  const line=installed?`【入继皇子立储】${adopted.name}获册为皇太子。`:
    `【两房牵挂】宗亲入继的${adopted.name}已有一位后来出生的弟弟${brother.name}。`;
  imperialHeirNotes(adopted,brother,installed?'立储':'诞育',line);
  return {title,por:adopted,cast:brother?[adopted,brother]:[adopted],text:line+(installed?'中宫和生家各送来一句问候。他把两处的话都听完，明日还要照常进讲。':
    S.heir===adopted.id?'东宫仍按旧例进讲，宫中也照常教养弟弟。亲近的人已经在想，往后该怎样让两个孩子相处。':'弟弟也在宗谱中，宫中仍依照各人的年龄照料。'),choices:[{t:brother?'让两个孩子照旧安心长大':'让太子照旧进讲'}]};
}
function imperialHeirProposal(adopted,brother,state){
  const q=empress(),key=`${adopted.id}:${brother.id}`,old=state.proposals[key],ofAge=kidAge(brother)>=5;
  if(old?.status==='closed'||old?.status==='wait'&&!ofAge||S.turn-(state.lastPetition??-99)<4)return;
  const queenAsks=q&&brother.mom===q.id&&!isSolitary(q)&&q.scheme>=55;
  if(!old&&!chance(queenAsks?.22:.08))return;
  const valid=()=>!S.over&&S.heir===adopted.id&&eligiblePalaceSon(adopted)&&laterImperialSon(brother,adopted)&&!brother.jailed&&!brother.templeStay&&!immortalAway(brother);
  const resolve=(mode)=>()=>{
    if(!valid())return null;
    state.proposals[key]={status:mode==='defer'?'wait':'closed'};
    const line=mode==='keep'?`【储位御批】${adopted.name}仍居东宫，${brother.name}照常教养。`:mode==='defer'?`【储位御批】两位皇子照常教养；如有再议，待${brother.name}年满五岁。`:`【储位御批】陛下命礼部呈办重议，请先阅册立诏书。`;
    if(mode==='reconsider'){log(line,1);A.kidHeir(brother.id);}
    else imperialHeirNotes(adopted,brother,mode==='keep'?'守储':'缓议',line);
    return line;
  };
  const lead=queenAsks?`${fullName(q)}递上亲笔，说${brother.name}是自己所出，想请陛下重议储位。`:`有朝臣在礼部议事时提起${brother.name}，奏请重议储位。`;
  const ev={title:'储位再议 · 东宫与新皇子',por:queenAsks?q:adopted,cast:[adopted,brother],valid,
    text:`${lead}\n${adopted.name}已有册命。${ofAge?`${brother.name}已到可议立储的年龄。若要改立，还须御前另下诏书。`:`${brother.name}未满五岁。眼下可申明储位，也可留待日后再议。`}`,
    onQueue:()=>{state.lastPetition=S.turn;state.proposals[key]={status:'seen'};imperialHeirNotes(adopted,brother,'议储',`【储位再议】${lead}`);},
    choices:[{t:`维持${adopted.name}的太子册命`,f:resolve('keep')},ofAge?{t:'重议储位，调阅册立诏书',f:resolve('reconsider')}:{t:'待幼子年满五岁再议',f:resolve('defer')}]};
  if(valid())pushEv(ev);
}
function imperialHeirStories(previous){
  if(!imperialHeirStoriesActive()||!previous||previous.gen!==S.gen||S.over)return;
  const adopted=S.children.filter(k=>eligiblePalaceSon(k)&&k.palaceAdoption).sort(royalBirthOrder);
  if(!adopted.length)return;
  const current=kidById(S.heir),changed=previous.heir!==S.heir,month=previous.turn!==S.turn;
  const heir=adopted.includes(current)?current:null;
  const focus=heir||adopted[0],brother=S.children.filter(k=>laterImperialSon(k,focus)).sort(royalBirthOrder)[0];
  if(!heir&&!brother&&!changed)return;
  if(S.flags.imperialHeirStories?.gen!==S.gen)S.flags.imperialHeirStories={gen:S.gen,crowned:{},births:{},proposals:{}};
  const state=S.flags.imperialHeirStories;
  if(heir&&!state.crowned[heir.id]&&(changed||month)){
    state.crowned[heir.id]=S.turn;pushEv(imperialHeirNotice(heir,brother,true));
  }
  if(brother&&state.births[focus.id]===undefined&&(month||previous.children.some(k=>k.id===brother.id&&k.pendingName))){
    state.births[focus.id]=S.turn;pushEv(imperialHeirNotice(focus,brother,false));
  }
  const former=changed&&adopted.find(k=>k.id===previous.heir);
  if(former&&current&&laterImperialSon(current,former))imperialHeirNotes(former,current,'改立',`【改立后续】${former.name}离开东宫，${current.name}奉诏为太子。`);
  if(month&&heir&&brother&&state.births[heir.id]!==undefined&&S.turn-state.births[heir.id]>=4)imperialHeirProposal(heir,brother,state);
}
