/* 巡察发现保存世界中的隐情，查访只决定证据能否查齐，不抽签改写身世。 */
const secretCasesActive=()=>!!S&&!S.over&&journalContentVersion()>=19;
function secretCaseKey(kind,id){return `${S.gen}:${kind}:${id}`;}
function secretCaseExisting(kind,id){return palaceCases().find(x=>x.kind==='palace-secret'&&x.secretKey===secretCaseKey(kind,id));}
function secretCaseSubject(x){
  if(!x||x.gen!==S.gen)return null;
  if(x.secretKind==='parentage'){const k=kidById(x.childId);return k?.alive&&!k.parentage?.decision&&(k.parentage||k.birthSwap&&!k.birthSwap.confirmed)?{k}:null;}
  if(x.secretKind==='loss'){
    const c=byId(x.consortId),loss=c?.concealedLoss;if(!c?.alive||!loss||loss.turn!==x.lossTurn||loss.revealed)return null;
    const k=S.children.find(k=>k.alive&&k.birthSwap?.claimedMother===c.id&&k.birthSwap.motive==='conceal-miscarriage'&&k.birthSwap.loss?.turn===loss.turn);
    return k?{k,c}:!loss.settled||loss.pendingReport?{c,loss}:null;
  }
  const pair=S.palaceRomance?.gen===S.gen&&S.palaceRomance.pairs[x.pairKey],people=pair&&romancePeople(pair);
  return pair&&['active','concealed'].includes(pair.status)&&pair.stage>=2&&inPalace(people.consort)&&people.prince?.alive&&romanceEligible(people.prince,people.consort)&&romanceAdults(people.prince,people.consort)?{pair,...people}:null;
}
function secretSource(kind,person){
  if(kind==='parentage')return {kind,id:person.id,childId:person.id,title:person.name+'身世疑云',text:person.birthSwap?'产房出入簿与旧包被的记载有出入，需查接生、移送和稳婆证词；尚不能据此认定换婴。':'起居簿、宫门值簿与转述的话有出入，需逐一核对；尚不能据此改变孩子身份。'};
  if(kind==='loss')return {kind,id:person.id,consortId:person.id,lossTurn:person.concealedLoss.turn,title:fullName(person)+'的脉案疑点',text:'药簿与上报孕月对不上，另有人打听宫外临盆人家。需请医官核验原始脉案，不能凭一句传闻定罪。'};
  return {kind,id:person.key,pairKey:person.key,title:'宫墙私笺',text:'宫门值簿与递送书册的记录出现几处未说明的往来，缇骑建议核对原笺和经手人的口供。尚未证实私情。'};
}
function secretPatrolSources(){
  if(!secretCasesActive())return [];
  const sources=[];
  for(const k of S.children)if(k.alive&&!k.pendingName&&!k.parentage?.decision&&!secretCaseExisting('parentage',k.id)&&
    (k.birthSwap&&!k.birthSwap.confirmed||k.parentage?.status==='hidden'||k.parentage?.status==='suspected'))sources.push(secretSource('parentage',k));
  for(const c of S.consorts)if(inPalace(c)&&concealedPregnancy(c)&&!secretCaseExisting('loss',c.id))sources.push(secretSource('loss',c));
  for(const pair of Object.values(S.palaceRomance?.gen===S.gen?S.palaceRomance.pairs:{})){
    if(secretCaseExisting('romance',pair.key))continue;
    const x={gen:S.gen,secretKind:'romance',pairKey:pair.key};if(secretCaseSubject(x))sources.push(secretSource('romance',pair));
  }
  return sources;
}
function fileSecretCase(source){
  if(!secretCasesActive()||!source)return null;
  const old=secretCaseExisting(source.kind,source.id);if(old)return old;
  const x=openPalaceCase({kind:'palace-secret',gen:S.gen,secretKind:source.kind,secretKey:secretCaseKey(source.kind,source.id),target:secretCaseKey(source.kind,source.id),title:source.title,crime:'宫闱待核',clueText:source.text,childId:source.childId,consortId:source.consortId,lossTurn:source.lossTurn,pairKey:source.pairKey});
  if(jinyiwei())story(jinyiwei().commander,`【宫闱线索】${source.title}：${source.text}`);
  return x;
}
function revealSecretParentage(k,text){
  if(k.birthSwap&&!k.birthSwap.confirmed){k.birthSwap.clueShown=true;k.parentage ||= {father:{kind:'birth-swap'},claimedFather:E().sur+E().name};}
  k.parentage ||= {father:{...k.birthTraits.father},claimedFather:E().sur+E().name};
  if(!['investigating','confirmed'].includes(k.parentage.status)){k.parentage.status='suspected';k.parentage.clue ||= {kind:k.birthSwap?'birth-swap':'register',text,turn:S.turn};}
}
function beginSecretEvidence(x,subject){
  if(!subject.k)return;
  revealSecretParentage(subject.k,x.clueText);
  kstory(subject.k,'奉旨交锦衣卫核对身世记录，尚未定案，原有身份与照护不变。');
  const mother=byId(subject.k.birthSwap?.claimedMother??subject.k.mom);
  if(mother?.alive)story(mother,`${subject.k.name}的身世疑点交锦衣卫查证，尚未凭流言定罪。`);
}
function secretInquiryEvent(x){
  if(!x||!secretCaseSubject(x)||!caseReady(x)||!jinyiweiCommanderReady())return null;
  return {title:'锦衣卫彻查 · '+x.title,por:jinyiwei().commander,valid:()=>!!secretCaseSubject(x)&&caseReady(x)&&jinyiweiCommanderReady(),text:`${x.clueText}\n分别封存簿册、问询经手人，并请医官核对产房与脉案。次月回奏；线索不全时仍可能无果，原有身份与照护不会因立案改变。`,choices:[
    {t:'封存证据，派人彻查 · 精力−1 · 国库−15',cond:()=>E().energy>=1&&E().treasury>=15,f:()=>{
      const subject=secretCaseSubject(x);if(!subject||!caseReady(x)||!jinyiweiCommanderReady()||E().treasury<15||!useE())return null;
      chg({treasury:-15});dispatchCase(x,15);
      beginSecretEvidence(x,subject);
      save('auto');return '锦衣卫已领案，次月回奏。查齐证据之前，不改宗谱，不预定罪名。';
    }},{t:'暂存案卷，日后再查'}]};
}
A.secretInquiry=function(kind,id){
  if(modalOpen||!secretCasesActive()||!jinyiweiCommanderReady())return;
  const p=kind==='parentage'?kidById(id):kind==='loss'?byId(id):S.palaceRomance?.pairs[id];if(!p)return;
  if(kind==='loss'&&!p.concealedLoss)return;
  const source=secretSource(kind,p),probe={gen:S.gen,secretKind:kind,...source};
  if(!secretCaseSubject(probe))return;const x=fileSecretCase(source);pushEv(secretInquiryEvent(x));save('auto');
};
function secretInquiryChoice(kind,person){
  if(!secretCasesActive()||!jinyiweiCommanderReady())return null;
  const source=secretSource(kind,person),existing=secretCaseExisting(kind,source.id);
  if(!secretCaseSubject({gen:S.gen,secretKind:kind,...source}))return null;
  if(existing&&!caseReady(existing))return null;
  return {t:'交锦衣卫彻查，先核证据',f:()=>{const x=fileSecretCase(source);pushNow(secretInquiryEvent(x));return null;}};
}
function secretCaseWaiting(k){return palaceCases().some(x=>x.kind==='palace-secret'&&x.status==='investigating'&&secretCaseSubject(x)?.k===k);}
const secretsCaseReady=caseReady;
caseReady=function(x){return secretsCaseReady(x)&&(!secretCasesActive()||x.kind!=='palace-secret'||!!secretCaseSubject(x));};
const secretsBeginParentage=beginParentageInquiry;
beginParentageInquiry=function(k){return secretCasesActive()&&secretCaseWaiting(k)?null:secretsBeginParentage(k);};
const secretsParentageReport=parentageReportEvent;
parentageReportEvent=function(){
  if(!secretCasesActive())return secretsParentageReport();
  const k=S.children.find(k=>parentageReady(k)&&k.parentage.status==='investigating'&&S.turn>=k.parentage.due&&
    !palaceCases().some(x=>x.kind==='palace-secret'&&x.status==='solved'&&secretCaseSubject(x)?.k===k));
  return k?parentageVerdictEvent(k):null;
};
const secretsParentageInquiry=parentageInquiryEvent;
parentageInquiryEvent=function(k){
  if(secretCasesActive()&&secretCaseWaiting(k))return {title:'锦衣卫查证中',por:jinyiwei()?.commander,text:'缇骑正在核对簿册与证词，待回奏后再定。孩子的照护和身份仍依原来的安排。',choices:[{t:'等候回奏'}]};
  const ev=secretsParentageInquiry(k),choice=ev&&k.parentage.status==='suspected'&&secretInquiryChoice('parentage',k);if(choice)ev.choices.push(choice);return ev;
};
const secretsSwapClue=birthSwapClueEvent;
birthSwapClueEvent=function(){const ev=secretsSwapClue();if(ev&&secretCasesActive()){const k=ev.cast.find(p=>p?.birthSwap),choice=k&&secretInquiryChoice('parentage',k);if(choice)ev.choices.push(choice);}return ev;};
const secretsLossClue=concealedLossClueEvent;
concealedLossClueEvent=function(c){const ev=secretsLossClue(c),choice=ev&&secretInquiryChoice('loss',c);if(choice)ev.choices.push(choice);return ev;};
const secretsRomanceEvent=palaceRomanceEvent;
palaceRomanceEvent=function(pair){const ev=secretsRomanceEvent(pair);if(!ev||!secretCasesActive())return ev;pair ||= Object.values(S.palaceRomance?.pairs||{}).find(romancePending);if(pair?.stage>=2){const choice=secretInquiryChoice('romance',pair);if(choice)ev.choices.push(choice);}return ev;};
const secretsInvestigate=A.jinyiweiInvestigate;
A.jinyiweiInvestigate=function(id){const x=palaceCases().find(x=>x.id===id);if(secretCasesActive()&&x?.kind==='palace-secret'){if(!modalOpen)pushEv(secretInquiryEvent(x));return;}return secretsInvestigate(id);};
function secretCaseResultEvent(x){
  const subject=secretCaseSubject(x),j=jinyiwei();
  if(x.status!=='solved'||!subject)return {title:'宫闱案卷 · '+x.title,por:j?.commander,text:kidById(x.childId)?.parentage?.result||x.conclusion||'调查所涉事实与人物已有后续，原案记录保留。',choices:[{t:'合上案卷'}]};
  if(subject.k){
    const k=subject.k;if(k.pendingName)return null;
    revealSecretParentage(k,x.clueText);if(k.parentage.status!=='confirmed'){k.parentage.status='investigating';k.parentage.due=S.turn;}
    const ev=parentageVerdictEvent(k);if(!ev)return null;
    ev.text=`锦衣卫会同医官核对了原簿和证词。\n${ev.text}`;ev.por=j?.commander;x.conclusion=ev.text;return ev;
  }
  if(subject.loss)return {title:'脉案查实',por:j?.commander,cast:[subject.c],valid:()=>!!secretCaseSubject(x),text:'原始脉案、药簿及经手宫人的证词已经互相印证：确曾小产，其后仍虚报孕月，并安排从宫外抱入男婴。小产本身不作罪责，隐瞒与冒报须分别记载。',choices:[
    {t:'揭明实情，停止冒报并安排调养',f:()=>{const now=secretCaseSubject(x);if(!now?.loss)return null;const result=revealConcealedLoss(now.c,'锦衣卫会同医官核实原始脉案，宫外抱婴的安排被中止。');x.conclusion=result;x.disposed=true;story(j.commander,'【核验结论】'+result);save('auto');return result;}}]};
  const {pair,prince,consort}=subject;
  if(x.romanceReviewed&&!romancePending(pair))return {title:'宫墙私笺 · 原案记录',por:j?.commander,text:x.conclusion+'\n'+(pair.result||'处置已经记入人物经历。'),choices:[{t:'合上案卷'}]};
  x.conclusion=`核验原笺与经手人口供，${prince.name}与${fullName(consort)}${pair.stage===2?'确曾私下递笺传情；没有据此补定更进一步的行为':'确有私下相依的往来，须分别问清并决定如何处置'}。`;
  return {title:'宫墙私笺 · 查证回奏',por:j?.commander,cast:[prince,consort],text:x.conclusion,choices:[
    {t:'传两人问清，按原事处置',cond:()=>!mourningActive(),why:'丧仪期间暂缓传问，结论留在案卷中',f:()=>{const current=secretCaseSubject(x);if(!current?.pair||mourningActive())return null;const p=current.pair;x.romanceReviewed=true;p.status='active';p.pending=true;pushNow(palaceRomanceEvent(p));save('auto');return null;}},
    {t:'结论入卷，稍后再议'}]};
}
const secretsCaseReport=caseReport;
caseReport=function(x){
  if(!secretCasesActive()||x.kind!=='palace-secret')return secretsCaseReport(x);
  if(x.status!=='investigating'||S.turn<x.due)return null;
  const subject=secretCaseSubject(x),j=jinyiwei();delete x.due;
  if(!subject){x.status='closed';x.conclusion='原疑点已由既有剧情查明或当事处境改变，案卷留存，不重复定罪。';return {title:'锦衣卫续报',por:j.commander,text:x.conclusion,choices:[{t:'记入案卷'}]};}
  if(subject.k?.pendingName){x.due=S.turn+1;return null;}
  const found=chance(caseOdds(x));x.status=found?'solved':'cold';x.conclusion=found?'证词与原簿已经核验，待御前审阅。':'原簿或证词未齐，尚无足够证据定案。半年后可再循线调查。';
  (x.progress ||= []).push({turn:S.turn,text:x.conclusion});story(j.commander,`【宫闱回奏】${x.title}：${x.conclusion}`);
  if(!found)return {title:'锦衣卫查访未果',por:j.commander,text:x.conclusion+'\n未因此改变孩子的身份，也未惩处有关人物。',choices:[{t:'保留案卷，等待新线索'}]};
  x.solvedTurn=S.turn;j.commander.merit=clamp(j.commander.merit+6);return secretCaseResultEvent(x);
};
A.reviewSecretCase=function(id){const x=palaceCases().find(x=>x.id===id);if(!modalOpen&&secretCasesActive()&&x?.kind==='palace-secret'&&['solved','closed'].includes(x.status))pushEv(secretCaseResultEvent(x));};
A.jinyiweiPatrol=function(){
  const j=jinyiwei();if(modalOpen||!secretCasesActive()||!jinyiweiCommanderReady()||j.lastPalacePatrol===S.turn)return;
  const annex=typeof heXingjianLeadChoice==='function'&&heXingjianLeadChoice('patrol');
  pushEv({title:'巡察宫闱',por:j.commander,text:'令缇骑核查宫门值簿、产房移送与药簿，访谈经手人。有疑点才呈报，寻常往来不当作私情，体貌与流言也不能作为身世结论。每月可安排一次，未必有收获。',choices:[
    {t:'按簿巡察 · 精力−1 · 国库−5',cond:()=>E().energy>=1&&E().treasury>=5,f:()=>{
      if(!jinyiweiCommanderReady()||j.lastPalacePatrol===S.turn||E().treasury<5||!useE())return null;
      j.lastPalacePatrol=S.turn;chg({treasury:-5});const sources=secretPatrolSources(),found=sources.length&&chance(Math.min(.5,.2+j.commander.ability/300));
      if(!found){const text='本次巡察未发现足以立案的新疑点。没有凭此断言宫中无人有隐情，也没有据猜测处罚任何人。';story(j.commander,text);save('auto');return text;}
      const source=pick(sources),x=fileSecretCase(source);j.lastPatrolCase=x.id;
      pushNow({title:'巡察所得 · 新疑点',por:j.commander,text:`${source.title}\n${source.text}\n线索已入案卷，可以继续彻查，也可以暂缓。`,choices:[{t:'循线彻查，先看交办安排',f:()=>{pushNow(secretInquiryEvent(x));return null;}},{t:'先存案卷，不惊动有关人物'}]});save('auto');return null;
    }},...(annex?[annex]:[]),{t:'暂不安排'}]});
};
const secretsCasesSection=casesSection;
casesSection=function(){
  const base=secretsCasesSection();if(!secretCasesActive()||!jinyiwei())return base;
  const known=S.children.filter(k=>parentageReady(k)&&k.parentage.status==='suspected'&&!secretCaseExisting('parentage',k.id));
  const cases=palaceCases().filter(x=>x.kind==='palace-secret'),j=jinyiwei();
  const followup=cases.filter(x=>['solved','closed'].includes(x.status)).map(x=>`<p>${esc(x.title)} <button class="btn sm" onclick="A.reviewSecretCase('${x.id}')">查看结论与后续</button></p>`).join('');
  const swaps=S.children.filter(k=>birthSwapCase(k));
  return detailSection('宫闱巡察与剧情疑案',`<p class="hint">从宫门、药簿和产房记录循线查证。有线索才立案，查明后回到原剧情安置孩子、问罪或寻亲。</p><button class="btn jade" onclick="A.jinyiweiPatrol()" ${jinyiweiCommanderReady()&&j.lastPalacePatrol!==S.turn?'':'disabled'}>巡察宫闱<small>每月一次 · 精力−1 · 国库−5</small></button>${known.map(k=>`<p>${esc(k.name)} · 身世存疑 <button class="btn sm" onclick="A.secretInquiry('parentage',${k.id})" ${jinyiweiCommanderReady()?'':'disabled'}>交锦衣卫查证身世</button></p>`).join('')}${followup}${swaps.map(k=>`<p>${esc(k.name)} · 换婴案后续 <button class="btn sm" onclick="A.swapOriginal(${k.id})">核对亲生孩子与寻亲</button>${!k.birthSwap.justice?.decision?`<button class="btn sm" onclick="A.swapJustice(${k.id})">审理换婴主使</button>`:''}</p>`).join('')}`)+base;
};
