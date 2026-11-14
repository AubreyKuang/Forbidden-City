/* Parentage is fixed at conception. Investigations reveal saved facts, never reroll them. */
function conceptionFather(c){
  const f=c.pregnancyFather;
  return f&&['prince','emperor'].includes(f.kind)&&f.gen===S.gen&&f.mother===c.id?{...f}:
    {kind:'emperor',gen:S.gen,name:E().sur+E().name,wen:E().wen,wu:E().wu};
}
function attachChildParentage(k,father){
  captureBirthCalendar(k);
  if(father.kind!=='prince')return;
  k.parentage={father:{...father},status:father.hidden?'hidden':'suspected',claimedFather:E().sur+E().name,conceived:father.conceived};
  if(!father.hidden)kstory(k,'出生前后，宫中曾有关于生母私下来往的疑问，身世尚待查证。');
}
function palaceParentageTick(){
  // Only a continuing adult relationship can lead to a pregnancy; one roll per palace per month.
  if(S.flags.parentageChecked===S.turn||S.over||mourningActive())return;
  S.flags.parentageChecked=S.turn;
  for(const c of S.consorts)if(!c.preg)delete c.pregnancyFather;
  if(S.turn-(S.flags.lastSecretConception??-99)<24)return;
  const pairs=Object.values(S.palaceRomance?.gen===S.gen?S.palaceRomance.pairs:{}).filter(p=>{
    const {prince:k,consort:c}=romancePeople(p);
    return ((p.status==='concealed'&&p.stage===3)||(p.status==='active'&&p.stage>=2&&p.stage<=3))&&p.conceivedAt==null&&!p.pending&&S.turn-(p.endedAt??p.started??S.turn)>=6&&
      romanceEligible(k,c)&&romanceAdults(k,c)&&c.age<=45&&!c.preg&&(!c.delivery||c.delivery.settled)&&
      S.turn-c.lastBirth>=18&&c.aff<65&&!c.bond&&relGet(k,c)>=20;
  });
  if(!pairs.length||!chance(.025))return;
  const pair=pick(pairs),{prince:k,consort:c}=romancePeople(pair);
  c.preg=1;c.pregnancyFather={kind:'prince',id:k.id,gen:S.gen,name:E().sur+k.name,wen:k.lit,wu:k.mar,mother:c.id,
    conceived:S.turn,princeAge:kidAge(k),motherAge:c.age,pair:pair.key,hidden:pair.status==='active'};
  beginPregnancyCalendar(c);
  pair.conceivedAt=S.turn;S.flags.lastSecretConception=S.turn;
}
function parentageReady(k){
  return !!(k?.alive&&!k.pendingName&&k.parentage&&k.parentage.status!=='hidden'&&!k.parentage.decision&&!S.over);
}
function knownBiologicalFather(k){return !!(k.parentage&&['confirmed','resolved'].includes(k.parentage.status));}
function childFatherHTML(k){
  const f=k.birthTraits?.father;if(!f)return '未记载';
  if(!k.parentage||k.parentage.decision==='cleared')return esc(f.name);
  if(k.parentage.status==='hidden')return esc(k.parentage.claimedFather||E().sur+E().name);
  if(!knownBiologicalFather(k))return '待查证';
  const father=kidById(k.parentage.father.id);
  return father?`<button class="person-link" onclick="A.go('kid',${father.id})">${esc(k.parentage.father.name)}</button>`:esc(k.parentage.father.name);
}
function parentagePanel(k){
  if(!k.parentage||k.parentage.status==='hidden')return '';
  const p=k.parentage,label=p.decision==='cleared'?'疑云已释':{suspected:'身世存疑',investigating:'正在查证',confirmed:'身世已查明',resolved:'已有处置'}[p.status]||'身世存疑';
  const wait=p.status==='investigating'&&S.turn<p.due;
  return `<p><strong>${label}</strong>${knownBiologicalFather(k)?` · 生父 ${childFatherHTML(k)}`:''}</p>
    <p class="hint">${esc(p.result||(wait?`正在核对起居记录与证词，${p.due-S.turn}个月后回奏。`:'身世不会因反复查验而改变；调查前不会仅凭流言定罪。'))}</p>
    ${parentageReady(k)?`<button class="btn jade" onclick="A.parentageInquiry(${k.id})" ${wait?'disabled':''}>${p.status==='suspected'?'查验身世':p.status==='investigating'?'听取查证回奏':'决定如何安置'}</button>`:''}${birthSwapCasePanel(k)}`;
}
function consortParentagePanel(c){
  const children=S.children.filter(k=>(k.mom===c.id||k.foster===c.id||k.birthSwap?.claimedMother===c.id||k.birthSwap?.confirmed&&k.birthSwap?.plotter===c.id)&&k.parentage&&k.parentage.status!=='hidden');
  return children.map(k=>`<div><button class="person-link" onclick="A.go('kid',${k.id})">${esc(k.name)}</button>${parentagePanel(k)}</div>`).join('');
}
function beginParentageInquiry(k){
  if(!parentageReady(k)||k.parentage.status!=='suspected'||!useE())return null;
  k.parentage.status='investigating';k.parentage.due=S.turn+1;
  kstory(k,'奉旨核查身世，调阅起居记录并分别问询随侍。');save('auto');
  return k.birthSwap?'接生与产房记录、起居簿、宫门值簿及稳婆证词分别封存。将核实产妇是否实际分娩、原来孩子的生父和去向，以及谁主使、谁知情；次月回奏。':'起居簿、宫门值簿与随侍证词分别封存，次月回奏。调查期间不改孩子身份，也可先安排去护国寺静养。';
}
function bloodRitualEvent(k){
  return {title:'滴血验亲之议',por:k,valid:()=>parentageReady(k)&&k.parentage.status==='suspected',
    text:'宫人提出依旧说滴血验亲。太医上前拦道：“水中血滴融与不融，不能据此断定骨肉。人命与宗谱，都不可只凭这一碗水。”\n要查明身世，仍须核对起居记录、来往书笺与当事人的证词。',choices:[
      {t:'听太医之言，调卷查证 · 精力−1',cond:()=>E().energy>0,f:()=>beginParentageInquiry(k)},{t:'暂不查问'}]};
}
function parentageInquiryEvent(k){
  if(!parentageReady(k))return null;
  const p=k.parentage,m=byId(k.mom);
  if(p.status==='suspected')return {title:'身世疑云',cast:[m,k],valid:()=>parentageReady(k)&&p.status==='suspected',
    text:`${p.clue?.text||`${k.name}出生前后，宫中有人翻出${m?fullName(m):k.momName}曾与皇子私下往来的旧笺。`}\n流言尚不能定案。你可以命人查证，也可以先将孩子送往护国寺养护。`,choices:[
      {t:'调阅起居簿，分别问询 · 精力−1',cond:()=>E().energy>0,f:()=>beginParentageInquiry(k)},
      {t:'问起滴血验亲的旧说',f:()=>{pushNow(bloodRitualEvent(k));return null;}},
      ...(templeEligible(k)?[{t:'先送护国寺养护，暂不定罪',f:()=>{if(!parentageReady(k)||!sendChildToTemple(k,{months:6,reason:'parentage'}))return null;save('auto');return '孩子先到寺旁客舍养护，身世仍待查证，生母留在宫中。';}}]:[]),{t:'暂且搁置'}]};
  if(p.status==='investigating'&&S.turn<p.due)return null;
  return parentageVerdictEvent(k);
}
function parentageVerdictEvent(k){
  if(!parentageReady(k)||!['investigating','confirmed'].includes(k.parentage.status)||S.turn<(k.parentage.due??0))return null;
  if(k.birthSwap)return birthSwapVerdictEvent(k);
  const p=k.parentage,m=byId(k.mom),father=kidById(p.father.id);
  if(p.father.kind==='emperor')return parentageClearEvent(k);
  return {title:'身世查证',cast:[m,father,k],valid:()=>parentageReady(k)&&!p.decision,
    onShow:()=>{if(p.status!=='confirmed'){p.status='confirmed';kstory(k,`经起居簿、书笺与当事人证词核对，查明生父为${p.father.name}。`);save('auto');}},
    text:`起居记录与往来书笺的时日相合，随侍与当事人的证词也已核实。\n${k.name}的生母是${m?fullName(m):k.momName}，生父是${p.father.name}。\n如何处置，会改变孩子的身份与居处，也会影响生母的心境及皇子家中的关系。`,choices:[
      {t:'压下身世，仍作皇嗣抚养',f:()=>resolveParentage(k,'keep')},
      {t:'送回生父皇子府，改入其家谱',cond:()=>!!father?.alive&&!father.jailed,why:'生父已故或被圈禁',f:()=>resolveParentage(k,'household')},
      {t:'孩子送护国寺养护，生母留宫',cond:()=>!k.jailed,why:'孩子尚在圈禁，须先解除圈禁',f:()=>resolveParentage(k,'temple')},
      {t:'赐死生母与孩子……',cond:()=>!!m?.alive,why:'生母已故',f:()=>{pushNow(parentageExecutionEvent(k));return null;}},
      {t:'留待再议'}]};
}
function removeImperialStatus(k){
  k.removedFromRoyal=true;k.title='';k.sup=0;k.tutor=false;
  if(S.heir===k.id)S.heir=null;
}
function resolveParentage(k,decision,confirmedExecution=false){
  if(!parentageReady(k)||k.parentage.father.kind!=='prince'||k.parentage.status!=='confirmed'||!['keep','household','temple','execute'].includes(decision))return null;
  const p=k.parentage,m=byId(k.mom),father=kidById(p.father.id);
  if(decision==='household'&&(!father?.alive||father.jailed))return null;
  if(decision==='execute'&&(!confirmedExecution||!m?.alive))return null;
  if(decision==='temple'&&k.jailed)return null;
  let result;
  if(decision==='keep'){
    result=`${k.name}仍留作皇嗣抚养，身世封存。`;k.love=clamp(k.love+5);
    if(m?.alive)cchg(m,{aff:8,mood:10});
    if(k.templeStay?.reason==='parentage'){k.templeStay.reason='prayer';k.templeStay.due=S.turn+6;}
  }else if(decision==='household'){
    delete k.templeStay;removeImperialStatus(k);
    result=`${k.name}不再列作皇帝子女，送入${p.father.name}府中，由生父安排抚养。`;
    father.recognizedChildren ||= [];if(!father.recognizedChildren.includes(k.id))father.recognizedChildren.push(k.id);
    kstory(father,`接回亲生的${k.name}，改入府中家谱，承担照护。`);
    if(father.spouse){father.spouse.trust=clamp((father.spouse.trust??60)-20);father.spouse.story ||= [];father.spouse.story.push({d:dateStr(),t:`得知丈夫与宫中妃嫔的往事，${k.name}被接回府中，夫妻信任受到影响。`});}
    if(m?.alive)cchg(m,{mood:-20,aff:-8});
  }else if(decision==='temple'){
    if(k.templeStay){k.templeStay.reason='parentage';k.templeStay.due=null;}
    else if(!sendChildToTemple(k,{months:null,reason:'parentage'}))return null;
    removeImperialStatus(k);result=`${k.name}暂不列入皇嗣，送往护国寺养护，未定归期。${m?.alive?'生母留在宫中。':''}`;
    if(m?.alive)cchg(m,{mood:-18,aff:-8});
  }else{
    removeImperialStatus(k);k.alive=false;k.deathReason='奉旨赐死';delete k.templeStay;
    m.alive=false;m.preg=0;delete m.pregnancyFather;delete m.visitor;
    result=`诏令下达，${fullName(m)}与${k.name}被赐死。`;story(m,result);chg({prestige:-8,people:-4});
    if(father?.alive){father.love=clamp(father.love-30);kstory(father,`得知${fullName(m)}与亲生的${k.name}被赐死。`);}
  }
  p.decision=decision;p.status='resolved';p.resolvedAt=S.turn;p.result=result;
  childSeparationMemory(k,result,decision==='keep'?.6:-.6);
  if(m?.alive){reconcileMotherConcern(m);if(decision==='household'||decision==='temple')setXin(m,'思念',`牵挂远方的${k.name}`);}
  const pair=S.palaceRomance?.pairs[p.father.pair];if(pair){pair.status='ended';pair.pending=false;pair.result=result;pair.endedAt=S.turn;}
  log(`【身世处置】${result}`,1);save('auto');return result;
}
function parentageExecutionEvent(k){
  const m=byId(k.mom);
  return {title:'赐死前复核',danger:true,cast:[m,k],valid:()=>parentageReady(k)&&k.parentage.father.kind==='prince'&&k.parentage.status==='confirmed'&&!!m?.alive,
    text:`将${m?fullName(m):k.momName}与${k.name}一并赐死？二人会从在世名册中移除，亲人记忆、起居注与皇帝威望也会改变。\n这一步尚未执行，仍可改作抚养或安置。`,choices:[
      {t:'下诏赐死二人',f:()=>resolveParentage(k,'execute',true)},
      {t:'收回旨意，另议安置',f:()=>{pushNow(parentageVerdictEvent(k));return null;}}]};
}
A.parentageInquiry=function(id){const k=kidById(id);if(modalOpen||!parentageReady(k))return;pushEv(parentageInquiryEvent(k));};
function parentageReportEvent(){
  const k=S.children.find(k=>parentageReady(k)&&k.parentage.status==='investigating'&&S.turn>=k.parentage.due);
  return k?parentageVerdictEvent(k):null;
}
function recognizedChildrenPanel(k){
  const children=(k.recognizedChildren||[]).map(kidById).filter(Boolean);if(!children.length)return '';
  return `<p>已接回府中：${children.map(child=>`<button class="person-link" onclick="A.go('kid',${child.id})">${esc(child.name)}</button> · ${child.alive?kidAge(child)+'岁':'已故'}`).join('；')}</p>`;
}

/* Keep a bounded factual night register. Legacy pregnancies have no invented chronology. */
function recordImperialNight(c){
  c.imperialNights=[...(c.imperialNights||[]).filter(t=>S.turn-t<=36),S.turn].filter((t,i,a)=>a.indexOf(t)===i).slice(-36);
}
function beginPregnancyCalendar(c){
  const r=R();c.pregnancyCalendar={conceived:S.turn,term:r<.02?9:r<.03?11:10,nights:[...(c.imperialNights||[]).filter(t=>Math.abs(S.turn-t)<=1)]};
}
function captureBirthCalendar(k){
  const c=byId(k.mom),calendar=c?.pregnancyCalendar;if(!calendar)return;
  k.birthCalendar={...calendar,nights:[...calendar.nights],born:S.turn,term:c.preg};
}
function parentageClueCandidates(){
  return S.children.filter(k=>k.alive&&!k.birthSwap&&!k.pendingName&&kidAge(k)<6&&!k.removedFromRoyal&&!k.jailed&&!k.parentageClueSeen&&
    (!k.parentage||k.parentage.status==='hidden')&&k.birthTraits?.father&&inPalace(byId(k.mom)));
}
function parentageClueEvent(){
  if(S.over||mourningActive()||S.turn-(S.flags.lastParentageClue??-99)<36)return null;
  const cases=parentageClueCandidates().flatMap(k=>{
    const m=byId(k.mom),cal=k.birthCalendar,options=[];
    if(cal&&(cal.term!==10||!cal.nights.length))options.push({k,kind:'calendar',text:`${k.name}的诞生簿记着${cal.term<10?'提前临盆':cal.term>10?'比原估晚些临盆':'孕期起算存疑'}。内侍按常例倒推月份，与现存的起居簿未能完全对上。太医提醒：孕程并非人人相同，仅凭时日不能定案。`});
    if(k.parentage?.status==='hidden'||m.favor<30)options.push({k,kind:'whisper',text:`宫人窃语，拿${k.name}出生前后的几件琐事猜测身世。传言虽已入耳，却没有完整证词，不能据此责罚母子。`});
    const rival=harem().find(c=>c.id!==m.id&&c.scheme>=60&&relGet(c,m)<=-30);
    if(rival)options.push({k,kind:'informant',informant:rival.id,text:`${cName(rival)}私下递话，称${fullName(m)}有孕前后的来往值得查问。两人素有嫌隙，这份告密仍须另取证据核实。`});
    return options;
  });
  if(!cases.length||!chance(.035))return null;
  const clue=pick(cases),k=clue.k,m=byId(k.mom);let shown=false;
  const reveal=()=>{
    if(shown)return;shown=true;k.parentageClueSeen=true;S.flags.lastParentageClue=S.turn;
    k.parentage ||= {father:{...k.birthTraits.father},claimedFather:k.birthTraits.father.name};
    k.parentage.status='suspected';k.parentage.clue={kind:clue.kind,text:clue.text,informant:clue.informant,turn:S.turn};
    kstory(k,`身世传闻待查：${clue.text}`);save('auto');
  };
  return {title:'起居簿外的疑问',por:m,cast:[k],cooldown:36,
    valid:()=>!S.over&&inPalace(m)&&(!clue.informant||inPalace(byId(clue.informant)))&&(shown?parentageReady(k):parentageClueCandidates().includes(k)),onQueue:reveal,onShow:reveal,text:clue.text,
    choices:[{t:'调卷问询，不凭传言定罪',f:()=>{pushNow(parentageInquiryEvent(k));return null;}},
      {t:'暂不追究，维持原来的照护',f:()=>{save('auto');return '未改母子身份，也未作有罪处置。若日后要查，可从孩子详情调阅此事。';}}]};
}
function parentageClearEvent(k){
  const p=k.parentage,m=byId(k.mom);
  if(p.father.kind!=='emperor')return null;
  const reason=p.clue?.kind==='calendar'?'核对接生记录与当时起居，发现按常例倒推孕期并不适用于这一胎，未发现私下往来的证据。':p.clue?.kind==='informant'?'告密者所指的时日与核实后的记录不符，证词也无法相互印证，未查得私情。':'逐一问询后，几处传闻来自转述与猜测，无法成立；起居与接生记录没有支持私情的证据。';
  return {title:'疑云已释',por:m,cast:[k],valid:()=>parentageReady(k)&&['investigating','confirmed'].includes(p.status)&&S.turn>=(p.due??0),
    text:`${reason}\n${k.name}仍是帝王亲生骨肉。不能因为一场猜疑，便令母子背上罪名。`,choices:[
      {t:'澄清传闻，安抚母子',f:()=>{
        if(!parentageReady(k)||p.father.kind!=='emperor')return null;
        p.status='resolved';p.decision='cleared';p.resolvedAt=S.turn;p.result='核实后疑云已释，亲生关系与原有身份不变。';
        kstory(k,p.result);if(m?.alive){cchg(m,{mood:10,aff:4});story(m,`关于${k.name}的身世疑云得以澄清。`);remember(m,'saved','身世流言经核查澄清，未凭猜测定罪。');}
        if(k.templeStay?.reason==='parentage'){k.templeStay.reason='prayer';k.templeStay.due=S.turn+1;}
        log(`【身世查证】${k.name}疑云已释。`,1);save('auto');return '澄清的回奏已记入起居注。告密与传闻不等于事实，也不因未查实便自动认定告密者蓄意诬陷。';
      }}]};
}
