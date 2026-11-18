/* Family news belongs to the event itself, not to the next paid visit. */
function childConsequencesActive(){return !!S&&!PalaceActions.blocked&&journalContentVersion()>=30;}
function childMotherClose(k,m){
  return k.mom===m.id||k.foster===m.id||
    (k.motherBonds?.[m.id]?.trust>=55||relGet(k,m)>=40||k.careVisitors?.[m.id]&&childTrust(k,m)>=45);
}
function childMotherAddress(k,m){
  if(k.mom===m.id)return '母妃';
  if(k.foster===m.id||k.careVisitors?.[m.id])return childCareAddress(k,m);
  return cName(m);
}
function childIncidentReaction(k,m,kind,address=childMotherAddress(k,m)){
  const age=kidAge(k),close=childTrust(k,m)>=45,nature=childDisposition(k);
  if(age<3)return kind==='death'?'还不懂离别，只因熟悉的照料忽然缺席而哭闹，乳母将这段幼时经历代记下来。':'尚不明白大人的处置，起居有了变化，睡梦中也比平日容易惊醒。';
  if(kind==='death'){
    if(!close)return `听闻${address}离世，记得的相处不多，仍向随侍问了许久她从前的事。`;
    if(age<6)return `还未真正懂得永别，反复问${address}什么时候回来，说着说着便哭了。`;
    if(['内敛','审慎','自矜'].includes(nature))return '在人前强忍着没有哭，回到住处才把旧物抱在怀里，久久不肯放下。';
    if(nature==='仁厚')return '一边落泪，一边还惦记着安慰更小的孩子，直到随侍劝了才肯歇下。';
    return `听见噩耗便红了眼圈，想起${address}旧日的声音，连平日喜欢的事也暂时放下了。`;
  }
  if(!close)return `与${address}相处不多，听闻变故仍有些不安，先向随侍问清如今的安排。`;
  if(age<6)return `攥着衣袖问${address}住在哪里，只惦记她有没有吃饭，还分不清处置的是非。`;
  if(['内敛','审慎'].includes(nature))return '把想问的话写了又改，怕开口失了分寸，也放不下对她起居的担忧。';
  if(['好胜','爽直'].includes(nature))return '急着想问个明白，随侍提醒先听清缘由；心里有气，却仍想先听清事情的是非。';
  if(nature==='仁厚')return '惦记她是否有人照料，又担心自己的求情会让父皇为难，心里反复踌躇。';
  return '平日的笑闹少了，听到宫人谈起她便停下来，既害怕又惦念。';
}
function childIncidentPlea(m,n,children){
  if(n.kind==='death'||!m.alive)return [];
  const eligible=children.filter(k=>kidAge(k)>=4&&!k.pendingName&&!k.jailed&&!k.removedFromRoyal&&childTrust(k,m)>=45)
    .sort((a,b)=>Number(childCanVisitCourt(b))-Number(childCanVisitCourt(a))||childTrust(b,m)-childTrust(a,m)||kidAge(b)-kidAge(a));
  if(!eligible.length)return [];
  const lead=eligible[0];if(!chance(Math.min(.85,.3+childTrust(lead,m)/220+(n.kind==='cold'?.15:0))))return [];
  const group=[lead];
  if(childCanVisitCourt(lead)&&chance(.7))group.push(...eligible.filter(k=>k!==lead&&childCanVisitCourt(k)).slice(0,2));
  // A close companion may speak alongside them, without becoming her child.
  if(childCanVisitCourt(lead)){
    const friend=S.children.filter(k=>k.alive&&!k.pendingName&&kidAge(k)>=6&&childCanVisitCourt(k)&&!group.includes(k)&&
      (childMotherClose(k,m)&&childTrust(k,m)>=55||group.some(o=>relGet(k,o)>=40))).sort((a,b)=>relGet(b,lead)-relGet(a,lead))[0];
    if(friend&&chance(.55))group.push(friend);
  }
  return group.map(k=>k.id);
}
function childMotherConsequences(previous){
  if(!childConsequencesActive()||!previous||previous.gen!==S.gen)return;
  const oldPeople=new Map((previous.consorts||[]).map(c=>[c.id,c])),oldChildren=new Map((previous.children||[]).map(k=>[k.id,k]));
  for(const m of S.consorts){
    const old=oldPeople.get(m.id);if(!old?.alive)continue;
    const notes=(m.story||[]).slice(old.story?.length||0),punished=notes.find(s=>/禁足|罚俸/.test(s.t)&&!/(父亲|兄长|姐妹|孩子).{0,12}(禁足|罚俸)/.test(s.t));
    const kind=!m.alive?'death':!old.cold&&m.cold?'cold':!old.gone&&m.gone?'departure':m.rank<old.rank&&!(old.cold&&!m.cold)?'demotion':punished?'punishment':null;
    if(!kind)continue;
    const children=S.children.filter(k=>k.alive&&(childMotherClose(k,m)||oldChildren.has(k.id)&&childMotherClose(oldChildren.get(k.id),m)));if(!children.length)continue;
    const history=S.flags.childFamilyIncidents??=[],id=`${S.gen}:${m.id}:${kind}:${S.turn}:${old.rank}:${m.rank}`;
    if(history.some(n=>n.id===id))continue;
    const n={id,mother:m.id,kind,turn:S.turn,children:children.map(k=>k.id),addresses:Object.fromEntries(children.map(k=>[k.id,childMotherAddress(oldChildren.get(k.id)||k,m)])),pleaders:[],resolved:false};
    history.push(n);if(history.length>80)history.splice(0,history.length-80);
    const fact={death:'离世',cold:'被送入冷宫',departure:'离宫',demotion:`被降为${RANKS[m.rank]}`,punishment:'受到宫规处分'}[kind];
    for(const k of children){
      const text=`【家中变故】${n.addresses[k.id]}${fullName(m)}${fact}。${childIncidentReaction(k,m,kind,n.addresses[k.id])}`;
      kstory(k,text);k.story.at(-1).familyIncident={id,mother:m.id,kind,turn:S.turn};
      if(kind==='death'||k.familyFeeling?.kind!=='death'||S.turn-k.familyFeeling.turn>=6)
        k.familyFeeling={source:id,mother:m.id,address:n.addresses[k.id],kind,turn:S.turn,visits:0,heard:false};
      NPCMemory.record(S,{type:'family-change',time:S.turn,location:childWhereabouts(k),participants:[k.id,m.id],outcome:text},
        [{person:k.id,subject:m.id,interpretation:kidAge(k)<3?'乳母代记幼时家中变故，照护与起居有了变化。':text,emotion:kind==='death'?-.8:-.5,impact:90}]);
    }
    n.pleaders=childIncidentPlea(m,n,children);
    if(kind==='cold'&&m.childDisgrace){m.childDisgrace.checked=true;if(n.pleaders.length)m.childDisgrace.asked=true;}
    pushEv(childMotherConsequenceEvent(n));
  }
}
function childMotherConsequenceEvent(n){
  const mother=byId(n.mother),children=n.children.map(kidById).filter(k=>k?.alive),group=n.pleaders.map(kidById).filter(k=>k?.alive);
  if(!mother||!children.length||n.resolved)return null;
  const label=k=>k.pendingName?`尚未赐名的小${k.sex==='m'?'皇子':'公主'}`:k.name;
  const valid=()=>!n.resolved&&children.some(k=>k.alive),people=[...new Set([...children,...group])];
  const finish=(mode,placement)=>{
    if(!valid())return null;n.resolved=true;n.response=mode;
    const text=mode==='foster'?placement:mode==='release'?`${fullName(mother)}获准出冷宫，以官女子身份安置，未恢复旧位。`:
      mode==='care'?`陛下准向${fullName(mother)}送去衣食与平安口信，原来的处分仍保留。`:
      mode==='wait'?'陛下先命随侍妥善照料孩子，未改变原来的安排。':n.kind==='death'?'陛下听孩子们说完，安排熟悉的随侍照料，没有催他们马上止住悲伤。':'陛下听完孩子们的心事，解释处置须论是非，也让他们知道照护不会被遗忘。';
    if(mode==='release'){mother.rank=0;A.uncold(mother.id);}
    if(group.length)story(mother,`${group.map(k=>k.name).join('、')}为自己求情。${text}`);
    if(mode==='care'){mother.childCarePermission={turn:S.turn,children:group.map(k=>k.id)};mother.mood=clamp(mother.mood+5);}
    for(const k of people){
      if(k.familyFeeling?.source===n.id)k.familyFeeling.heard=true;
      k.love=clamp(k.love+(mode==='wait'?-2:5));
      const role=group.includes(k)?childMotherClose(k,mother)?`为${childMotherAddress(k,mother)}${fullName(mother)}求情。`:`陪交好的皇嗣为${fullName(mother)}求情。`:'';
      kstory(k,role+text);k.story.at(-1).familyIncident={id:n.id,response:mode};
    }
    return text;
  };
  const needsCarer=k=>childInPalace(k)&&kidAge(k)<14&&(k.foster||k.mom)===mother.id;
  const dependents=journalContentVersion()>=89?children.filter(needsCarer):[];
  function arrangeCare(index,placed){
    while(index<dependents.length){
      const k=dependents[index++],candidates=fosterCandidates(k);
      if(!needsCarer(k)||!candidates.length)continue;
      pushNow({title:'为'+label(k)+'择养母',por:k,valid,
        text:kidName(k)+'今后的日常起居，由哪位妃嫔照料？',
        choices:[...candidates.map(c=>fosterCandidateChoice(c,carer=>{
          if(needsCarer(k)&&fosterCandidates(k).includes(carer)&&doFoster(k,carer))
            placed.push(label(k)+'交由'+fullName(carer)+'抚养');
          return arrangeCare(index,placed);
        })),{t:'这个孩子仍按原安排照料',f:()=>arrangeCare(index,placed)}]});
      return;
    }
    if(placed.length)return finish('foster','陛下定下照料人选：'+placed.join('；')+'。');
    pushNow(childMotherConsequenceEvent(n));
  }
  const body=()=>{
    if(journalContentVersion()>=32){
      const fact=`${fullName(mother)}${{death:'离世',cold:'入冷宫',departure:'离宫',demotion:'降位',punishment:'受罚'}[n.kind]}`,lines=[];
      if(group.length){
        lines.push(`${fact}后，${group.map(label).join('、')}${group.every(childCanVisitCourt)?group.length>1?'一同来御前求情。':'来御前求情。':'托人递来求情的书信。'}`);
        const lead=group[0],address=n.addresses?.[lead.id]||childMotherAddress(lead,mother);
        lines.push(kidAge(lead)<6?`“父皇，能替我问问${address}吃饭了吗？我还想给她带些点心。”`:n.kind==='departure'?`“儿臣惦记${address}，只求父皇容人传个平安的消息。”`:`“儿臣不敢说${address}没有过错，只求父皇顾念，别让她无人照料。”`);
        const friends=group.filter(k=>!childMotherClose(k,mother));if(friends.length)lines.push(`${friends.map(label).join('、')}是陪交好的孩子前来，想把他们的担忧说给你听。`);
      }else lines.push(`${fact}，孩子们各有牵挂。`);
      const reactions=new Map();
      for(const k of children.filter(k=>!group.includes(k))){
        const raw=childIncidentReaction(k,mother,n.kind,n.addresses?.[k.id]);
        const brief=kidAge(k)<3?raw:childTrust(k,mother)<45?(n.kind==='death'?'听闻噩耗，向随侍问起她从前的事。':'听闻变故有些不安，向随侍问起如今的安排。'):n.kind==='death'?'惦念旧日相处，仍需熟悉的人陪伴。':'惦记她的起居，暂由随侍安抚。';
        const place=childCanVisitCourt(k)||kidAge(k)<3&&childInPalace(k)?'':`（${childWhereabouts(k)}传来的消息）`;
        const key=place+'：'+brief;reactions.set(key,[...(reactions.get(key)||[]),label(k)]);
      }
      if(reactions.size)lines.push([...reactions].map(([line,names])=>names.join('、')+line).join('\n'));
      return lines.join('\n\n');
    }
    const lines=children.map(k=>`${label(k)}${childCanVisitCourt(k)||kidAge(k)<3&&childInPalace(k)?'':'（'+childWhereabouts(k)+'传来的消息）'}：${childIncidentReaction(k,mother,n.kind,n.addresses?.[k.id])}`);
    if(group.length){
      lines.push(`${group.map(label).join('、')}${group.every(childCanVisitCourt)?group.length>1?'一同来御前求情。':'来御前求情。':'托人递来求情的书信。'}`);
      const lead=group[0],address=n.addresses?.[lead.id]||childMotherAddress(lead,mother);lines.push(kidAge(lead)<6?`“父皇，能替我问问${address}吃饭了吗？我还想给她带些点心。”`:n.kind==='departure'?`“儿臣惦记${address}，只求父皇容人传个平安的消息。”`:`“儿臣不敢说${address}没有过错，只求父皇顾念，别让她无人照料。”`);
      for(const k of group.filter(k=>!childMotherClose(k,mother)))lines.push(`${label(k)}是陪交好的孩子前来，想把他们近来的担忧说给你听。`);
    }
    return `${fullName(mother)}${{death:'离世',cold:'入冷宫',departure:'离宫',demotion:'降位',punishment:'受罚'}[n.kind]}的消息传到了孩子们那里。\n`+lines.join('\n');
  };
  const title=n.kind==='death'?'亲人离世之后':group.length>1?'孩子们一同求情':group.length?'孩子的求情':'母亲遭逢变故';
  const focus=journalContentVersion()>=32&&group.length?group:people;
  const ev={title,por:focus.find(k=>!k.pendingName)||children[0],cast:focus.filter(k=>!k.pendingName).slice(0,4),present:[],valid,text:'',onShow:()=>{ev.text=body();},choices:[
    {t:group.length?'听完求情，说明缘由并安抚':'陪孩子说一会儿，安排照料',f:()=>finish('comfort')},
    ...(group.length&&mother.alive?[{t:'准送衣食与口信，原处分保留',f:()=>finish('care')},...(mother.cold?[{t:'念其孝心，准出冷宫，降为官女子',cond:()=>mother.alive&&mother.cold,f:()=>finish('release')}]:[])]:[]),
    {t:'先由随侍照料，稍后再陪伴',f:()=>finish('wait')},
    // Existing pending incidents replay choices by index. Keep the earlier responses in order.
    ...(dependents.length?[{t:'把孩子交给其他妃嫔抚养',cond:()=>dependents.some(k=>needsCarer(k)&&fosterCandidates(k).length),
      why:'眼下没有合适的养母人选',f:()=>arrangeCare(0,[])}]:[])
  ]};ev.text=body();return ev;
}
function childConsequenceFeeling(k){
  if(!childConsequencesActive())return null;
  const f=k.familyFeeling,m=f&&byId(f.mother);
  if(f&&(S.turn-f.turn<(f.kind==='death'?12:6)||f.kind==='cold'&&m?.cold||f.kind==='departure'&&m?.gone)&&!(f.kind==='cold'&&!m?.cold)&&!(f.kind==='departure'&&!m?.gone))return f;
  const care=byId(k.foster||k.mom);
  if(f)return null;
  return care?.alive&&(care.cold||care.gone)?{mother:care.id,kind:care.cold?'cold':'departure',turn:S.turn,visits:k.familyVisitCount||0,heard:true}:null;
}
function childConsequenceVoice(k){
  if(k.jailed)return null;
  const f=childConsequenceFeeling(k);if(!f)return null;
  const m=byId(f.mother);if(!m)return null;
  const age=kidAge(k),nature=childDisposition(k),address=f.address||childMotherAddress(k,m),loss=f.kind==='death',away=childHasLeftPalace(k),count=f.visits||0;
  if(age<3){
    const scenes=['孩子在乳母怀里抽噎，攥住熟悉的衣角才稍稍安稳。','乳母说孩子睡得浅，方才又醒了一回。','孩子抱着旧日常用的小毯，慢慢止住了哭声。','孩子比平日黏人，随侍轻声哄着，没有催着离开。'];
    return voiceLine('family-after',(away?'随侍的起居信中写道：':'')+scenes[count%scenes.length],[]);
  }
  const young=age<6,quiet=['内敛','审慎','自矜'].includes(nature),warm=nature==='仁厚',bright=['活泼','爽直','好胜'].includes(nature);
  let lines=loss?(young?[
    `我把点心留了一块。${address}以后真的不回来吃了吗？`,
    `昨晚梦见${address}了。醒来想找她，乳母就抱着我。`,
    `这件小衣裳我还想留着，上面有${address}缝的花。`,
    `父皇，你能讲一件${address}从前的事吗？`,
    '今天我没有一直哭。可是想起来的时候，还是会难过。'
  ]:[
    `这件旧物还留着。我怕以后连${address}说话的声音都记不清了。`,
    `昨夜梦见${address}，有许多话没来得及说，醒了就再睡不着。`,
    `旁人劝我振作，我知道是好意。只是今日还想安静一会儿。`,
    `我把记得的往事写了下来。父皇若也记得${address}的事，能再讲一件吗？`,
    '今日课业做完了。看着窗外，还是有一阵忽然很想她。',
    '有时候也会被逗笑，笑完又觉得难过。原来惦记一个人，会这样反复。'
  ]):(young?[
    `${address}那里有热饭吗？我吃过了，也想知道她吃没吃。`,
    `我画了一朵花，能请人带给${address}看看吗？`,
    `刚才想起${address}，就有一点想哭。父皇能陪我坐一会儿吗？`,
    `这条小帕子是${address}的，我收好了，等见面时还给她。`,
    `我今天学会一个字，想让${address}也知道。`
  ]:[
    `我挑了件厚些的衣裳，想托人问问能不能送去。只盼${address}起居安稳。`,
    `昨晚写了一封信，改了好几遍。只写了近况，没有替${address}辩解。`,
    `宫人说起${address}时，我还是忍不住停下来听。父皇，她近来可好？`,
    `功课没有落下。只是做完以后，常想起从前和${address}说话的时候。`,
    '父皇肯来，我心里安稳了些。今日不想再求什么，只想和您坐一会儿。',
    `我知道要听清是非，也知道不能一味护短。可心里惦记${address}，一时还放不下。`
  ]);
  if(!young)lines.push(quiet?'有些话一开口就怕落泪，所以写下来了。父皇不必催，我会慢慢说。':warm?'我也惦记着比我小的孩子，想陪他们待一会儿，免得各自难过。':bright?'原想出去跑一跑，心里也许就松快些。回来才发觉，还是想有人听我说话。':'平日爱做的事，今天也提不起精神。再过些时候，我想慢慢拾起来。');
  if(!loss&&S.turn-f.turn>=6)lines=young?[
    `今日学的新字，我想也写给${address}看看。`,
    `我玩了一会儿，已经没有总哭了。还是想知道${address}好不好。`,
    `父皇，我把自己的东西收好了。能请人告诉${address}吗？`
  ]:[`课业和日常都已慢慢习惯。若有${address}的平安消息，还是请人告诉我。`,
    `今日读到一句话，想起${address}从前也说过，便抄在了信里。`,
    '刚才和同窗说了件趣事，心里松快了些。日子还是要认真过。',
    `给${address}的信已经写好，只报了近况，也问了她的起居。`,
    '父皇肯来，我很高兴。今日先说说新学的功课，好不好？'];
  if(away)lines=lines.map(t=>t.replaceAll('父皇肯来','收到父皇的信').replaceAll('和您坐一会儿','在信里和您说几句话').replaceAll('父皇能陪我坐一会儿吗','父皇能再写一封信给我吗'));
  const distant=childTrust(k,m)<45;
  if(distant)lines=[`我与${address}相处得不多，听到这件事还是有些不安。如今的安排能再告诉我吗？`,`听人说起${address}从前的事，我才知道，有些事自己一直不清楚。`,'今日功课如常。只是听到宫人议论，心里还会想一想。'];
  const stage=away?`${childWhereabouts(k)}送来一封信，孩子只写了近来的心事。`:!loss&&S.turn-f.turn>=6?'孩子已恢复日常起居，谈话间仍有一份牵挂。':count%3===0?'孩子眼圈有些红，慢慢说起心里的牵挂。':count%3===1?'孩子把手里的东西收好，向你挪近了一点。':'孩子今日安静了些，愿意和你说几句近况。';
  return voiceLine('family-after',stage,lines[count%lines.length]);
}
function visitChildAfterConsequence(k){
  const f=childConsequenceFeeling(k),voice=childConsequenceVoice(k);if(!f||!voice)return false;
  const text=voice.lines[0]||voice.stage;if(k.familyFeeling===f)f.visits=(f.visits||0)+1;else k.familyVisitCount=(k.familyVisitCount||0)+1;
  k.love=clamp(k.love+10);const stat=pick(['lit','mar','vir']);k[stat]=clamp(k[stat]+2);
  kstory(k,`${childHasLeftPalace(k)?'父皇收到近况并回信':'父皇探望'}。${text}`);
  rememberConversation(k,{key:voice.key,stage:voice.stage,text,letter:childHasLeftPalace(k)},childWhereabouts(k));
  setScene('harem');pushEv({title:childHasLeftPalace(k)?'皇嗣家书':'探望皇嗣',por:k,cast:[],text:voice.stage+(voice.lines.length?'\n“'+text+'”':'')+(childHasLeftPalace(k)?'\n你在回信中回应了孩子的牵挂，嘱咐随侍妥善照料。':'')+fx(`父爱+10　${{lit:'才学',mar:'武艺',vir:'品德'}[stat]}+2`),choices:[{t:childHasLeftPalace(k)?'回信安慰，嘱咐好好照料':'轻声安慰，陪孩子坐一会儿'}]});return true;
}
