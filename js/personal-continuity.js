/* Consequences of witnessed events. Cast, causes and decisions are saved once;
   presentation never draws randomness, substitutes actors or awards progress. */
function continuityState(create=false){
  if(S?.continuity?.gen===S.gen)return S.continuity;
  if(!create||!S)return null;
  return S.continuity={gen:S.gen,next:1,threads:[],lastPopup:-99};
}
function continuityTouch(c){if(c)c.lastPersonalContact={gen:S.gen,turn:S.turn};}
function continuityFocus(c){
  const contact=c?.lastPersonalContact;
  return contact?.gen===S.gen?Math.max(0,12-(S.turn-contact.turn)):0;
}
function continuityThreads(c){return (continuityState()?.threads||[]).filter(t=>!c||t.owner===c.id||t.other===c.id);}
function continuityOpen(t){return t&&t.stage!=='ended';}
function continuityOfficial(t){
  const p=byId(t.owner)?.house?.[t.role];return p?.id===t.officialId?p:null;
}
function continuityCast(t){
  return [byId(t.owner),t.kind==='family'?continuityOfficial(t):t.kind==='child'?kidById(t.other):byId(t.other)].filter(Boolean);
}
function continuityAvailable(t){
  if(!continuityOpen(t)||S.over||!inPalace(byId(t.owner)))return false;
  if(t.kind==='duty')return inPalace(byId(t.other));
  if(t.kind==='child')return familyVisitAllowed(kidById(t.other),byId(t.owner))&&kidAge(kidById(t.other))<18;
  return !!continuityOfficial(t);
}
function continuityStart(kind,c,other,source,data={}){
  if(!inPalace(c)||c.maid||S.over)return null;
  const s=continuityState(true),key=kind+':'+source;
  if(s.threads.some(t=>t.key===key||continuityOpen(t)&&t.kind===kind&&(t.owner===c.id||other!=null&&t.other===other)))return null;
  // An existing promise is never evicted by a new invitation.
  if(s.threads.filter(continuityOpen).length>=8)return null;
  const t={id:s.next++,key,kind,owner:c.id,other:other??null,gen:S.gen,origin:S.turn,date:dateStr(),stage:'invitation',due:S.turn+2,history:[],...data};
  s.threads.push(t);
  if(s.threads.length>64)s.threads=s.threads.filter(x=>continuityOpen(x)||byId(x.owner)?.personalConcerns?.[x.key]||s.threads.indexOf(x)>=s.threads.length-40);
  return t;
}
function continuityRecord(t,text,views){
  const cast=continuityCast(t),note={turn:S.turn,d:dateStr(),text};
  t.history.push(note);t.history=t.history.slice(-8);t.updated=S.turn;
  for(const p of cast){if(!p.story)p.story=[];(p.sex?kstory:story)(p,text);}
  NPCMemory.record(S,{type:'personal-continuity',time:S.turn,participants:cast.map(p=>p.id),object:t.key,outcome:text},
    cast.flatMap((p,i)=>p.alive===false||t.kind==='family'&&i===1&&!t.delivered?[]:
      [{person:p.id,subject:cast[1-i]?.id||'emperor',interpretation:views?.[i]||text,emotion:.35,impact:80}]));
  log(text,1);
}
function startDutyContinuity(work,mode){
  const helper=byId(work.helper),lead=byId(work.helperRole==='gifts'?work.gifts:work.tables);
  const a=canManageFeast(helper)?helper:byId(work.gifts),b=canManageFeast(helper)?lead:byId(work.tables);
  if(!inPalace(a)||!inPalace(b)||a===b)return;
  if(continuityThreads().some(t=>t.kind==='duty'&&[t.owner,t.other].includes(a.id)&&[t.owner,t.other].includes(b.id)&&S.turn-t.origin<24))return;
  const overlooked=!!helper&&work.issue==='漏记帮手'&&mode==='照例办结';
  const t=continuityStart('duty',a,b.id,`${work.year}:${work.tables}:${work.gifts}`,{mode,overlooked,
    cause:`${dateStr()}，${fullName(a)}与${fullName(b)}一起备办端午。${overlooked?'帮手的名字没有写进结案册。':mode==='公开署名'?'各人所做的事都按实署了名。':mode==='私下协调'?'分工在私下说清，双方各自致谢。':'两人按原册办结了宫务。'}`});
  if(t&&overlooked){(a.personalConcerns||={})[t.key]={kind:'credit',text:`与${fullName(b)}同办端午，功劳尚未说清。`,source:t.id};}
}
function startOfficialContinuity(e,outcome,task){
  const {p,role}=e;
  const c=inPalace(e.c)?e.c:paternalFamily(e.c).filter(inPalace).sort((a,b)=>continuityFocus(b)-continuityFocus(a))[0];if(!c)return;
  const active=continuityThreads().find(t=>t.kind==='family'&&t.officialId===p.id&&continuityOpen(t));
  if(active)return;
  if(continuityThreads().some(t=>t.kind==='family'&&t.officialId===p.id&&t.outcome===outcome&&S.turn-t.origin<36))return;
  const cause=`${dateStr()}，${role==='father'?'父亲':'兄长'}${p.name}${outcome==='death'?'去世。'+(p.death?.reason||''): `奉差「${task}」${outcome==='success'?'办结':'未尽如期'}。`}`;
  const t=continuityStart('family',c,null,`${p.id}:${S.turn}:${outcome}`,{officialId:p.id,role,outcome,task,cause});
  if(t&&outcome!=='success')(c.personalConcerns||={})[t.key]={kind:outcome==='death'?'grief':'family',text:outcome==='death'?`仍在整理${p.name}留下的家事。`:`惦记${p.name}差事的善后。`,source:t.id};
}
function startChildContinuity(k,m,activity){
  if(!familyVisitAllowed(k,m)||kidAge(k)<6||kidAge(k)>=16||S.turn-(k.lastPersonalPlan??-99)<18)return;
  const disposition=childDisposition(k),project=['好胜','爽直'].includes(disposition)?'archery':['仁厚','审慎'].includes(disposition)?'reading':'paint';
  const parentProject=m.trait==='将门'||m.t2==='擅骑射'?'archery':m.trait==='巧手'?'paint':'reading';
  const t=continuityStart('child',m,k.id,`${k.id}:${S.turn}`,{activity,project,parentProject,
    cause:`${dateStr()}，${fullName(m)}与${kidName(k)}一起${activity}。孩子想把下一回怎样做说给她听。`});
  if(t)k.lastPersonalPlan=S.turn;
}
function continuityTitle(t){
  return {duty:t.overlooked?'那一页没有写上的名字':'还想和她一起做',family:t.outcome==='death'?'家书留在人间':t.outcome==='setback'?'回奏之后，家中如何':'功劳之外的一封家书',child:'孩子自己的打算'}[t.kind];
}
function continuityDesire(t){
  const c=byId(t.owner),other=t.kind==='child'?kidById(t.other):byId(t.other);
  if(t.kind==='duty')return t.overlooked?`${fullName(c)}想先与${fullName(other)}说清上次的功劳，再决定是否合作。`:`${fullName(c)}想与${fullName(other)}再做一件有始有终的小事。`;
  if(t.kind==='family')return t.outcome==='death'?`${fullName(c)}想把${continuityOfficial(t).name}留下的书信安顿好。`:
    `${fullName(c)}惦记${continuityOfficial(t).name}的回奏，也想让自己的意见被听见。`;
  return `${kidName(other)}想试试${FAMILY_ACTIVITIES[t.project].title}；${fullName(c)}原想安排${FAMILY_ACTIVITIES[t.parentProject].title}。`;
}
function continuityReady(c){
  return continuityThreads(c).filter(t=>continuityAvailable(t)&&t.stage!=='settled'&&S.turn>=t.due&&S.turn>=(t.snooze??0))
    .sort((a,b)=>(b.stage==='working')-(a.stage==='working')||continuityFocus(byId(b.owner))-continuityFocus(byId(a.owner))||a.due-b.due)[0];
}
function continuityBond(c,other,value,source){
  (c.palacePartnerships||={})[other.id]={value,source,turn:S.turn,gen:S.gen};
}
function continuityPartnership(a,b){
  const p=a?.palacePartnerships?.[b?.id];return p?.gen===S.gen?p.value:0;
}
function continuityConcern(c){return Object.values(c?.personalConcerns||{}).find(x=>continuityThreads().some(t=>t.id===x.source));}
function continuityBlocksSoothing(c,x){return !!continuityConcern(c)||['悲恸','心如死灰'].includes(x)&&S.turn-(c.xin?.t??S.turn)<6;}
function continuityResolveConcern(t){const c=byId(t.owner);if(c?.personalConcerns)delete c.personalConcerns[t.key];}
function continuityRepairReady(t){return t?.kind==='duty'&&!!byId(t.owner)?.personalConcerns?.[t.key]&&['settled','ended'].includes(t.stage)&&continuityCast(t).length===2&&continuityCast(t).every(inPalace);}
A.addressPersonalConcern=function(id){
  if(!S||S.over||modalOpen)return;
  const t=continuityThreads().find(t=>t.id===id);if(!continuityRepairReady(t))return;
  const c=byId(t.owner),o=byId(t.other);
  pushEv({title:'把那件事说清 · '+fullName(c),cast:[c,o],personalStory:true,valid:()=>continuityRepairReady(t),
    text:t.cause+'\n'+c.personalConcerns[t.key].text+'\n旧册和当事人都在，可以重新核对。',choices:[
      {t:'按实补记，也让她自己决定今后的合作 · 精力−1',cond:()=>continuityRepairReady(t)&&E().energy>=1,why:'精力不足或当事人不在宫中',f:()=>{
        if(!continuityRepairReady(t)||!useE())return null;
        continuityResolveConcern(t);continuityBond(c,o,0,t.id);continuityBond(o,c,0,t.id);relAdd(c,o,4);continuityTouch(c);
        const text=`${fullName(c)}与${fullName(o)}重新核对了那次宫务。该记的功劳补上，她也得以自己决定下一次与谁合作；往日的疏远没有被抹成从未发生。`;
        continuityRecord(t,text);return text;
      }},{t:'先听到这里'}]});
};

function continuityOptions(t){
  const c=byId(t.owner),o=t.kind==='child'?kidById(t.other):byId(t.other),p=t.kind==='family'?continuityOfficial(t):null;
  if(t.stage==='invitation'){
    if(t.kind==='duty')return [
      {id:'credit',label:t.overlooked?'核对原册，补记她做过的事，再请两人合作':'请两人共同定分工，各自署名',text:`${fullName(c)}与${fullName(o)}当面列清各自做过和准备做的事。${t.overlooked?'旧册按实补记，没有把歉意折成赏银。':'两人商量着再备一套节礼花样。'}`},
      {id:'private',label:'请两人私下说清，再自行决定是否合作',text:`${fullName(c)}与${fullName(o)}关起门谈了一回。${t.overlooked?'她接受了当面的谢意，仍想下次自己主事。':'两人愿意继续来往，决定把下一回的分工先写下来。'}`},
      {id:'solo',label:`让${fullName(c)}独立做一回，由她自己署名`,text:`${fullName(c)}领了一件独立的差事。她开始准备自己的花样册，${fullName(o)}照常料理原来的宫务。`}
    ];
    if(t.kind==='family')return t.outcome==='death'?[
      {id:'letters',label:'陪她整理真实留下的家书',text:`你陪${fullName(c)}整理${p.name}留下的书信。她决定先把家中可以确认的往事记下来，不急着写成一篇漂亮的祭文。`},
      {id:'space',label:'让她与家人自己整理，需要时再来陪伴',text:`${fullName(c)}请家人各自写下与${p.name}相处的一件小事。你留下安静的时间，没有催她收起悲伤。`}
    ]:[
      {id:'facts',label:t.outcome==='setback'?'问清她的看法，公事按事实复核善后':'听她谈实绩，以本人功劳评价父兄',text:`${fullName(c)}谈起${p.name}的「${t.task}」。${t.outcome==='setback'?'疏漏没有因亲眷身份被抹去；她愿意把知道的情况写清。':'她愿意整理家书，也希望朝堂继续看实绩用人。'}`},
      {id:'care',label:'先照应家中近况，公事仍按原有处置',text:`你先问${fullName(c)}家中如何安顿。她修书问候${p.name}，公事的功过仍依原来的回奏处理。`}
    ];
    return [
      {id:'child',label:`让${kidName(o)}先试自己的${FAMILY_ACTIVITIES[t.project].title}`,text:`${kidName(o)}把自己的办法说完，${fullName(c)}答应先看孩子试做，遇到难处再帮忙。`},
      {id:'together',label:'母子各提一个办法，一起商量着完成',text:`${fullName(c)}与${kidName(o)}各自画出想做的部分，约好轮流拿主意。`},
      {id:'parent',label:`先按母亲的安排${FAMILY_ACTIVITIES[t.parentProject].title}，再听孩子复盘`,text:`先依${fullName(c)}的安排练习，${kidName(o)}把自己的想法另记一页，约好做完后再谈。`}
    ];
  }
  if(t.kind==='duty')return [
    {id:'respect',label:t.choice==='solo'||t.choice==='private'&&t.overlooked?'按她的意思署名，让她决定下一次搭档':'按商定的分工记功，让两人自行接续',text:t.choice==='solo'||t.choice==='private'&&t.overlooked?
      `${fullName(c)}的花样册独立署了名。以后是否请${fullName(o)}帮忙，由她自己决定。`:
      `${fullName(c)}与${fullName(o)}把新做好的花样并排收进册中，各自署名；两人约好下次有合适的活计还一起做。`},
    {id:'appoint',label:`仍由${fullName(o)}统筹，明确记下各人的工作`,text:`你仍请${fullName(o)}统筹。${fullName(c)}的工作单独记名，${t.choice==='solo'?'她收下安排，却把自己以后想做的事留在了私册里。':'两人按新的分工交接了册子。'}`}
  ];
  if(t.kind==='family')return [
    {id:'voice',label:'听她亲自说完这封家书',text:t.outcome==='death'?`${fullName(c)}读了一段关于${p.name}的家书。读不下去时，你没有替她说完。她把书信装进了常用的匣子。`:
      `${fullName(c)}把自己的意见写进给${p.name}的家书。她记得这回你愿意先听她说完。`},
    {id:'speak',label:'先替她安排妥当，把书信留给她',text:`你替${fullName(c)}安排好书信与家中的交接。她领了照应，把尚未说完的话留在自己的信里。`}
  ];
  return [
    {id:'listen',label:'让孩子讲哪里顺利、哪里想改变',text:`${kidName(o)}讲了做成与做坏的地方。${fullName(c)}听完才提建议，下一回仍给孩子留了选择的余地。`},
    {id:'guide',label:'由母亲指出不足，再一起练习',text:`${fullName(c)}逐处讲解，${kidName(o)}照着重做了一回。孩子学会了更稳妥的做法，也把自己的另一个想法留待下回。`}
  ];
}
function continuityProgressText(t){
  const c=byId(t.owner),o=t.kind==='child'?kidById(t.other):byId(t.other);
  if(t.kind==='duty')return t.choice==='solo'?`${fullName(c)}带来独立做好的花样册。${fullName(o)}也来问，今后是否还需要她帮忙。`:
    t.choice==='private'&&t.overlooked?`${fullName(c)}接受了${fullName(o)}私下的谢意，这回却带来了自己独立完成的一页。她想先试一次自己拿主意。`:
    `${fullName(c)}与${fullName(o)}带来共同做好的新花样。分工的小字仍夹在册中，署名的地方也留好了。`;
  if(t.kind==='family')return t.outcome==='death'?`${fullName(c)}${t.choice==='space'?'和家人各写了一段旧事':'已把共同整理的家书分好'}。她今天愿意谈起${continuityOfficial(t).name}，仍会在某一句停下来。`:
    `${fullName(c)}带来给${continuityOfficial(t).name}的家书草稿。${t.choice==='facts'?'她分开写了家中牵挂与公事善后，不愿混为一次求情。':'她先写家中的安顿，再问任上的辛苦。'}她想亲口说说自己为何这样写。`;
  return `${kidName(o)}拿来这几个月${FAMILY_ACTIVITIES[t.choice==='parent'?t.parentProject:t.project].title}的成果。${t.choice==='child'?'孩子先讲自己的尝试，母亲在一旁听。':t.choice==='parent'?'功课按母亲的安排做完了，孩子也拿出那页尚未试过的想法。':'母子各指着自己参与的部分，谈起中途改过的办法。'}`;
}
function continuityChoose(t,id){
  if(!continuityAvailable(t)||!['invitation','working'].includes(t.stage)||S.turn<t.due)return null;
  const option=continuityOptions(t).find(x=>x.id===id);if(!option||!useE())return null;
  const c=byId(t.owner),o=t.kind==='child'?kidById(t.other):byId(t.other);
  continuityTouch(c);
  if(t.stage==='invitation'){
    t.choice=id;t.stage='working';t.due=S.turn+2;
    if(t.kind==='duty'){
      if(id==='credit')continuityResolveConcern(t);
      relAdd(c,o,id==='credit'?7:id==='private'?3:0);
    }
    if(t.kind==='family'){
      const p=continuityOfficial(t);
      if(officialAlive(p)&&id==='facts')p.trust=clamp(p.trust+3);
    }
  }else{
    t.followup=id;t.stage='settled';t.due=S.turn+4;
    if(t.kind==='duty'){
      const independent=t.choice==='solo'||t.choice==='private'&&t.overlooked;
      const value=id==='respect'?(independent?0:12):t.choice==='solo'?-12:5;
      continuityBond(c,o,value,t.id);continuityBond(o,c,value,t.id);relAdd(c,o,value/2);
      if(id==='respect'||t.choice==='credit')continuityResolveConcern(t);
      else if(t.choice==='solo')(c.personalConcerns||={})[t.key]={kind:'agency',text:'希望下次独立署名，也能自己选择搭档。',source:t.id};
    }
    if(t.kind==='family'){
      c.familyVoice={officialId:t.officialId,role:t.role,choice:t.choice,heard:id==='voice',delivered:false,turn:S.turn,gen:S.gen};
      continuityResolveConcern(t);
    }
    if(t.kind==='child'){
      const project=t.choice==='parent'?t.parentProject:t.project;
      o.personalPractice={mother:c.id,project,mode:t.choice,heard:id==='listen',turn:S.turn,gen:S.gen,source:t.id};
      skillGain(o,FAMILY_ACTIVITIES[project].stat||'lit',id==='guide'?4:2);
      o.love=clamp(o.love+(id==='listen'?5:2));
      const bond=o.motherBonds?.[c.id];if(bond)bond.trust=clamp(bond.trust+(id==='listen'?6:3));
      relAdd(c,o,id==='listen'?4:2);
    }
    cchg(c,{aff:4,mood:4});
  }
  const views=t.kind==='duty'?[
    `${t.overlooked?'上次漏记的功劳，我没有忘。':'上回同办宫务的情分，我还记着。'}${option.text}`,
    `我与${fullName(c)}从端午的旧事谈起。${id==='solo'?'她想自己做一回，我听到了这个打算。':id==='private'?'当面把分工说清，今后还要看彼此怎样做。':option.text}`
  ]:t.kind==='child'?[
    `与${kidName(o)}一起${t.activity}之后，又听到了孩子的打算。${option.text}`,
    `${fullName(c)}记得我们一起${t.activity}。${id==='child'||id==='listen'?'这回让我先说自己的办法，我还想再试。':option.text}`
  ]:undefined;
  continuityRecord(t,option.text,views);return option.text+'\n过些时日再来，事情会接着往下走。';
}
function continuityEvent(t){
  if(!continuityAvailable(t)||S.turn<t.due||t.stage==='settled')return null;
  const stage=t.stage,valid=()=>continuityAvailable(t)&&t.stage===stage&&S.turn>=t.due;
  const c=byId(t.owner),tone=companionStyle(c);
  const line={proud:'“我在意的事，想当面说清。”',reserved:'“先前的事，我又想了几遍。想听听陛下的意思。”',direct:'“这回我有自己的打算，先让我说完。”',bright:'“又有一点新主意，这回可得认真听。”',maker:'“手里的东西还没收好，有几处想自己改一改。”',gentle:'“有一件事，臣妾一直放在心上。”'}[tone];
  return {title:continuityTitle(t)+' · '+fullName(c),cast:continuityCast(t),personalStory:true,valid,
    text:t.cause+'\n'+(stage==='invitation'?continuityDesire(t)+'\n'+line:continuityProgressText(t)),
    choices:[...continuityOptions(t).map(choice=>({t:choice.label+' · 精力−1',cond:()=>valid()&&E().energy>=1,why:'精力不足或人物处境已变',f:()=>valid()?continuityChoose(t,choice.id):null})),
      {t:'改日再来接着谈',f:()=>{if(valid())t.snooze=S.turn+3;return '这件事仍留在人物近况里，可以到宫中再谈。';}}]};
}
A.continuePersonal=function(id,fromEvent=false){
  if(!S||S.over||modalOpen&&!fromEvent)return;
  const t=continuityThreads().find(t=>t.id===id),ev=continuityEvent(t);
  if(ev)(fromEvent?pushNow:pushEv)(ev);
};
function continuityMonthlyEvent(){
  const state=continuityState();if(!state||S.turn-state.lastPopup<3)return null;
  const t=continuityReady();if(!t||t.stage==='settled')return null;
  const ev=continuityEvent(t);if(ev)ev.onShow=()=>{state.lastPopup=S.turn;t.lastShown=S.turn;};return ev;
}
function continuityTick(){
  const state=continuityState();if(!state)return;
  for(const t of state.threads.filter(continuityOpen)){
    const c=byId(t.owner),other=t.kind==='child'?kidById(t.other):t.kind==='duty'?byId(t.other):continuityOfficial(t);
    if(!c?.alive||c.gone||!other||t.kind!=='family'&&(!other.alive||other.gone)||t.kind==='child'&&(kidAge(other)>=18||!mothersOf(other).includes(c)||other.estate||other.princeEstate||other.removedFromRoyal||other.princessMarriage==='frontier')){
      t.stage='ended';t.ended=S.turn;continuityResolveConcern(t);
      if(c?.alive)continuityRecord(t,`「${continuityTitle(t)}」的当事人际遇已变，原来的相约留在旧事里，没有请旁人接替。`);
      continue;
    }
    if(t.kind==='family'&&!officialAlive(other)&&t.outcome!=='death'){
      t.outcome='death';t.stage='invitation';t.origin=S.turn;t.due=S.turn+1;delete t.choice;delete t.followup;
      t.cause=`${other.death?.d||dateStr()}，${other.name}去世。${other.death?.reason||''}先前有关差事的往来，如今也成了家中的旧事。`;
      (c.personalConcerns||={})[t.key]={kind:'grief',text:`仍在整理${other.name}留下的家事。`,source:t.id};
    }
    if(t.stage==='settled'&&S.turn>=t.due&&continuityAvailable(t)){
      let text;
      if(t.kind==='duty')text=continuityPartnership(c,other)>0?`${fullName(c)}又请${fullName(other)}一起核对花样册。两人沿用上回说好的分工，不必等你重新撮合。`:
        `${fullName(c)}把自己署名的花样册留在案边。${fullName(other)}经过时仍会看看，是否再合作，要由两人慢慢决定。`;
      else if(t.kind==='family'){
        t.delivered=officialAlive(other);if(c.familyVoice?.officialId===other.id)c.familyVoice.delivered=t.delivered;
        text=`${fullName(c)}把关于${other.name}的那封家书妥善收起。${t.delivered?other.name+'已收到寄出的信，也回了平安。':''}${t.followup==='voice'?'她遇到家中有事时，更愿意先把自己的判断说给你听。':'她感念照应，也仍把一些想法写在自己的信里。'}`;
      }
      else text=`${kidName(other)}又来找${fullName(c)}${FAMILY_ACTIVITIES[other.personalPractice?.project||t.project].title}。${t.followup==='listen'?'这次先说了想改的地方，母亲没有急着接过手。':'孩子先照着上次的办法练完，再把自己的新想法拿给母亲看。'}`;
      continuityRecord(t,text);t.stage='ended';t.ended=S.turn;if(t.kind==='family')continuityResolveConcern(t);
    }else if(t.stage==='invitation'&&S.turn-t.origin>=12&&continuityAvailable(t)){
      const text=t.kind==='duty'?`${fullName(c)}没有继续等批复，先整理了自己的花样册；与${fullName(other)}的旧事仍按原来的结案记录。`:
        t.kind==='family'?`${fullName(c)}与家人自行安顿了关于${other.name}的书信，未借此改变朝廷原来的处置。`:
        `${fullName(c)}和${kidName(other)}自行商量了下一次相处，先从各自愿意做的一小段开始。`;
      continuityRecord(t,text);t.stage='ended';t.ended=S.turn;
      if(t.kind==='family')continuityResolveConcern(t);
    }
  }
}
function continuityPanel(c){
  const threads=continuityThreads(c).filter(t=>continuityAvailable(t));
  const last=continuityThreads(c).filter(t=>t.stage==='ended'&&t.history.length).at(-1);
  const repairs=continuityThreads(c).filter(continuityRepairReady);
  if(!threads.length&&!last&&!repairs.length)return '';
  return `<section class="personal-continuity"><h3>近来牵挂的事</h3>${threads.map(t=>`<article><strong>${esc(continuityTitle(t))}</strong><p>${esc(t.cause)}</p><p>${esc(t.history.at(-1)?.text||continuityDesire(t))}</p>${S.turn>=t.due&&t.stage!=='settled'?`<button class="btn jade sm" onclick="A.continuePersonal(${t.id})">接着谈这件事 →</button>`:`<small class="hint">${t.stage==='settled'?'往后的日常会留下回响。':'事情还在继续，过些时日再来看看。'}</small>`}</article>`).join('')}${repairs.map(t=>`<p>${esc(byId(t.owner).personalConcerns[t.key].text)} <button class="btn sm" onclick="A.addressPersonalConcern(${t.id})">把那件事说清</button></p>`).join('')}${last?`<p class="continuity-kept"><span>一起走过</span> ${esc(last.history.at(-1).text)}</p>`:''}</section>`;
}
function continuityLeads(){
  return continuityThreads().filter(t=>continuityAvailable(t)&&t.stage!=='settled'&&S.turn>=t.due).map(t=>({
    person:byId(t.owner),title:continuityTitle(t)+' · '+fullName(byId(t.owner)),text:t.history.at(-1)?.text||t.cause,
    cast:continuityCast(t).filter(p=>p.alive!==false),action:`A.continuePersonal(${t.id})`,continuity:true,priority:t.stage==='working'?30:20,
    button:'接着谈这件事'}));
}
function continuityLeadScore(lead){return (lead.priority||0)+Math.max(0,...(lead.cast||[]).map(continuityFocus))+(lead.expires?15:0);}
function continuityEventScore(ev){return ev?Math.max(0,...(ev.cast||ev.present||[ev.por]).filter(p=>p&&typeof p==='object').map(continuityFocus))/6:0;}
function continuityReview(people){
  const notes=continuityThreads().flatMap(t=>t.history.filter(h=>h.turn===S.turn).map(h=>({id:t.owner,text:h.text,weight:30})));
  const ordered=[...notes,...people.map(p=>({...p,weight:continuityFocus(byId(p.id))}))].sort((a,b)=>b.weight-a.weight);
  return ordered.filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i).slice(0,2).map(({id,text})=>({id,text}));
}
function continuityPractice(k,m){
  const p=k.personalPractice;
  if(p?.gen!==S.gen||p.mother!==m.id||S.turn-p.turn>18)return null;
  const act=FAMILY_ACTIVITIES[p.project];if(!act)return null;
  return {...act,child:p.heard?'这回先把自己想改的地方说出来，她听完才动手。':'照上次练过的办法做完，再把另一个想法拿给她看。',mother:p.heard?'孩子记得上次可以自己拿主意，这回主动说了新的想法。':'孩子把练好的和想试的分开拿来，她逐一看过。'};
}
function routineAffection(c,base){
  const prior=c.routineContact;
  if(!prior||prior.gen!==S.gen||prior.turn!==S.turn)c.routineContact={gen:S.gen,turn:S.turn,count:0};
  const n=c.routineContact.count++,gain=n===0?(c.aff>=85?1:c.aff>=65?Math.max(1,Math.floor(base/2)):base):n===1?1:0;
  continuityTouch(c);return gain;
}
function genuineSocialMemory(c,o){
  const memories=NPCMemory.recall(S,c.id).filter(m=>m.subject===String(o.id)&&typeof m.interpretation==='string');
  const memory=memories[0];
  if(!memory)return '';
  const source=memory.channel==='hearsay'?'提起听来的消息':memory.confidence<.5?'想起一段记不真切的旧事':'想起一段旧事';
  return `她说起${fullName(o)}，${source}：“${memory.interpretation}”`;
}
function generalCaseFacts(c,f){
  if(f.caseFacts)return f.caseFacts;
  const p=houseOf(c).father;
  const grievance=p.trust<35,ambitious=p.temperament==='进取'&&p.merit>=45;
  const guilty=grievance&&ambitious;
  f.caseFacts={officialId:p.id,temperament:p.temperament,trust:p.trust,merit:p.merit,guilty,
    context:guilty?'将军近年功劳累积，却屡次与朝廷失和；军中已有人借机劝他拥兵自立。':'将军先前的履历没有拥兵自立的迹象，军饷与互市的实情仍须查访。'};
  return f.caseFacts;
}
