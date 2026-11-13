/* Children meet in the school and respond to changes in their mothers' lives. */
const schoolChildren=()=>kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=6&&kidAge(k)<16&&!k.pendingName);
function childLifeTick(){
  for(const c of S.consorts){
    if(c.cold&&c.alive&&!c.gone){
      if(!c.childDisgrace?.active)c.childDisgrace={active:true,turn:S.turn,asked:false};
    }else if(c.childDisgrace)c.childDisgrace.active=false;
  }
  ensureSchoolScene();
}
function motherAppealEvent(){
  if(S.turn-(S.flags.lastChildAppeal??-99)<6)return null;
  for(const mother of S.consorts){
    const episode=mother.childDisgrace;
    if(!episode?.active||episode.asked||!mother.cold||!mother.alive||mother.gone||S.turn-episode.turn>6)continue;
    const children=kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=4&&mothersOf(k).includes(mother)&&childTrust(k,mother)>=45);
    if(!children.length)continue;
    if(episode.child==null){
      if(episode.checked)continue;
      episode.checked=true;
      const child=children.sort((a,b)=>childTrust(b,mother)-childTrust(a,mother)||b.vir-a.vir)[0];
      if(!chance(.25+childTrust(child,mother)/200+(child.vir>=65?.1:0)))continue;
      episode.child=child.id;
    }
    const k=children.find(k=>k.id===episode.child);if(!k)continue;
    const address=mother.id===k.mom?'母妃':'养母';
    const plea=kidAge(k)<8?`攥着一包点心，眼圈通红：“父皇，${address}那里冷。儿臣能把这个送给她吗？”`:
      k.vir>=60?`把功课抄得整整齐齐，跪下说：“${address}若有过错，自当受罚。儿臣只求父皇容她添一床被子，容儿臣见她一面。”`:
      k.amb>=60?`攥着一张写了又改的请罪笺：“父皇，儿臣会用功。往后办好了差事，能不能换${address}出来？”`:
      `在殿外等了很久：“儿臣知道父皇生气，可${address}从前总陪儿臣读书。能不能再给她一次机会？”`;
    const record=(line,love)=>{
      k.love=clamp(k.love+love);kstory(k,`为${fullName(mother)}求情，${line}`);story(mother,`${k.name}为自己求情，${line}`);
      NPCMemory.record(S,{type:'mother-appeal',time:S.turn,location:'乾清宫',participants:[k.id,mother.id],object:line},[
        {person:k.id,subject:mother.id,interpretation:`我为${address}求情，${line}`,emotion:love>=0?.7:-.6,impact:80},
        {person:mother.id,subject:k.id,interpretation:`${k.name}还记得我，来替我求情。${line}`,emotion:.7,impact:80}]);
      return line;
    };
    return {title:'为母求情',cast:[k,mother],text:`${kidName(k)}${plea}`,
      onQueue:()=>{episode.asked=true;S.flags.lastChildAppeal=S.turn;},choices:[
        {t:'准探望，送些衣食，原罚不改',f:()=>{
          mother.mood=clamp(mother.mood+8);relAdd(k,mother,8);
          k.motherBonds ||= {};k.motherBonds[mother.id]={trust:clamp(childTrust(k,mother)+8),turn:S.turn,activity:'冷宫探望',childView:'把点心和棉被送到了母亲身边。',motherView:'孩子来探望，临走还拉着自己的衣袖。'};
          return record('陛下准许这一回探望，并命宫人送去衣食。',8);
        }},
        {t:'念孩子孝心，准出冷宫，降为官女子',f:()=>{mother.rank=0;A.uncold(mother.id);return record('陛下准她出冷宫，以官女子身份安置，并未恢复原位。',12);}},
        {t:'解释缘由，安抚孩子，暂不准见',f:()=>{k.vir=clamp(k.vir+2);return record('陛下耐心说明处罚缘由，许人传报她平安。',2);}},
        {t:'斥退，不许再提',f:()=>record('陛下将孩子斥退，没让话说完。',-12)}]};
  }
  return null;
}
const SCHOOL_TITLES={help:'同窗共读',debate:'课业争论',play:'课间投壶',comfort:'替人解围'};
function ensureSchoolScene(){
  if(S.schoolChecked===S.turn)return;
  S.schoolChecked=S.turn;
  const children=schoolChildren();if(children.length<2)return;
  const recent=S.schoolRecent ||= {};
  if(S.turn-(S.schoolScene?.turn??-99)<2)return;
  const pairs=[];
  for(const a of children)for(const b of children){
    if(a===b)continue;
    const hurt=mothersOf(b).some(m=>m.alive&&m.cold);
    const kind=hurt&&a.vir>=55&&relGet(a,b)>=0?'comfort':
      relGet(a,b)<0||a.amb>=65&&b.amb>=50?'debate':
      a.mar>a.lit+5?'play':a.lit>=b.lit?'help':null;
    if(!kind||S.turn-(recent[kind]??-99)<4||S.turn-(a.lastSchoolScene??-99)<2||S.turn-(b.lastSchoolScene??-99)<2)continue;
    pairs.push({kind,a,b});
  }
  if(!pairs.length)return;
  const {kind,a,b}=pick(pairs);
  const lines={
    help:[`这句先别背，我们用自己的话讲一遍。`,`那我讲给你听，你看看有没有漏掉。`],
    debate:[a.amb>=65?'这回该由我先答，太傅上次已经点过你了。':'同一句书也能有别的解释，你先听我说。','功课不只比谁先答，我也想把话说完。'],
    play:['下课了，拿纸团试投笔筒？离远些才有趣。','投不中也不能笑我，等会儿换你来。'],
    comfort:['别人怎么议论是别人的事。你的功课还在，我陪你写。','他们提起母妃，我就不知道该怎么答了。']
  }[kind];
  S.schoolScene={turn:S.turn,kind,ids:[a.id,b.id],lines};recent[kind]=S.turn;
  a.lastSchoolScene=b.lastSchoolScene=S.turn;
}
function schoolScene(){
  const scene=S.schoolScene;
  if(!scene||scene.turn!==S.turn)return null;
  const cast=scene.ids.map(kidById);
  return cast.every(k=>schoolChildren().includes(k))?{scene,cast}:null;
}
function schoolPanel(){
  const found=schoolScene(),present=schoolChildren();
  if(!present.length)return '<p class="hint">尚无六至十五岁的在宫皇嗣来此读书。</p>';
  const cast=found?.cast||present.slice(0,4),scene=found?.scene;
  return `<section class="school-room" aria-label="上书房课间"><p class="school-caption">窗下读书声 · ${scene?SCHOOL_TITLES[scene.kind]:'各自温书'}</p><div class="school-pupils">${cast.map((k,i)=>`<article><p class="school-speech">${esc(scene?.lines[i]||(k.policy==='习武'?'温完这一页，还想去练一会儿弓。':k.lit>=60?'这段批注与书里说的不同，我再想想。':'这几个字还不太熟，先描一遍。'))}</p><button class="activity-person" onclick="A.go('kid',${k.id})">${porImg(k,96)}<strong>${esc(k.name)}</strong></button><div class="school-desk">${k.policy==='习武'?'书卷 · 小木弓':'笔砚 · 书卷'}</div></article>`).join('')}</div></section>
    ${scene?(scene.result?`<p class="hint" role="status">${esc(scene.result)}</p>`:`<button class="btn jade" onclick="A.joinSchool()">走近听听 →</button>`):'<p class="hint">孩子们正在温书，偶尔低声交换几句话。</p>'}`;
}
A.joinSchool=function(){
  const found=schoolScene();if(!found||found.scene.result||modalOpen)return;
  const {scene,cast:[a,b]}=found;
  const respond=(mode)=>{
    if(scene.result)return null;
    const shared=mode==='together',partial=mode==='favor';
    relAdd(a,b,shared?10:partial?-8:3);
    if(shared){a.vir=clamp(a.vir+2);b[scene.kind==='play'?'mar':'lit']=clamp(b[scene.kind==='play'?'mar':'lit']+2);}
    if(partial){a.amb=clamp(a.amb+3);b.love=clamp(b.love-5);}
    const result=shared?`${a.name}放慢了话，${b.name}也肯接着说。两人把这件事一起做完了。`:
      partial?`${a.name}得了夸奖，${b.name}低头收起书卷，没再争辩。`:`你在旁听了一会儿，没有催促。两个孩子渐渐把话说开了。`;
    scene.result=result;
    for(const k of [a,b])kstory(k,`【${SCHOOL_TITLES[scene.kind]}】${result}`);
    NPCMemory.record(S,{type:'school-life',time:S.turn,location:'上书房',participants:[a.id,b.id],object:SCHOOL_TITLES[scene.kind]},[
      {person:a.id,subject:b.id,interpretation:result,emotion:partial?.4:.65,impact:55},
      {person:b.id,subject:a.id,interpretation:partial?'父皇只听了对方的话，我没能说完。':result,emotion:partial?-.65:.65,impact:55}]);
    save('auto');render();return result;
  };
  pushEv({title:SCHOOL_TITLES[scene.kind],cast:[a,b],text:`${a.name}：“${scene.lines[0]}”\n${b.name}：“${scene.lines[1]}”\n两人见你进来，忙放下手里的东西。`,choices:[
    {t:scene.kind==='play'?'陪他们轮流投，约好输赢不恼':scene.kind==='comfort'?'肯定照应同窗，陪他们把功课写完':'请两人轮流讲，再一起解这道题',f:()=>respond('together')},
    {t:'先不打断，听听他们怎么说',f:()=>respond('listen')},
    ...(scene.kind==='debate'?[{t:`只夸${a.name}，让另一人照着学`,f:()=>respond('favor')}]:[])]});
};
