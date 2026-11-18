/* Recovery is dated by the real pregnancy outcome, never by a later inquiry or reload. */
const consortRecoveryActive=()=>!!S&&journalContentVersion()>=19;
function beginConsortRecovery(c,kind,turn=S.turn,hidden=false){
  if(!consortRecoveryActive()||!c)return;
  const old=c.recovery;
  if(old&&old.kind===kind&&old.turn===turn)return;
  c.recovery={kind,turn,until:turn+3};
  consortHealthHurt(c,kind,turn);
  if(!hidden)story(c,`${kind==='birth'?'生产后':'小产后'}由医官安排静养，三个月内暂停侍寝，日常探望与照料仍照常。`);
}
function recentRecoveryStory(c,re,months){
  // Older saves have dated chronicles but no recovery object. Match only concrete outcomes.
  for(let ago=0;ago<months;ago++){
    const absolute=(S.year-1)*12+S.month-1-ago;if(absolute<0)continue;
    const date=dateStr({...S,year:Math.floor(absolute/12)+1,month:absolute%12+1});
    if((c.story||[]).some(s=>s.d===date&&re.test(s.t)))return S.turn-ago;
  }
  return null;
}
function consortRecovery(c){
  if(!consortRecoveryActive()||!c)return null;
  const periods=[];
  if(c.recovery&&Number.isFinite(c.recovery.turn))periods.push(c.recovery);
  if(Number.isFinite(c.concealedLoss?.turn))periods.push({kind:'loss',turn:c.concealedLoss.turn,until:c.concealedLoss.turn+3});
  if(!c.delivery?.concealedLoss&&!c.concealedLoss?.settled&&Number.isFinite(c.lastBirth)&&c.lastBirth>=0)
    periods.push({kind:'birth',turn:c.lastBirth,until:c.lastBirth+3});
  if(!periods.some(p=>p.kind==='loss')){
    const turn=recentRecoveryStory(c,/在御花园失足滑倒，腹中骨肉没能保住。/,3);
    if(turn!==null)periods.push({kind:'loss',turn,until:turn+3});
  }
  return periods.filter(p=>S.turn<p.until).sort((a,b)=>b.until-a.until)[0]||null;
}
function consortNightReason(c){
  if(!c)return '眼下不宜召见';
  if(c.homeLeave&&journalContentVersion()>=88)return c.homeLeave.field?'外出 · 赴北境军驿':'外出省亲';
  if(journalContentVersion()>=91){
    const d=S.flags.dowager;
    if(dowagerIll(d)&&d.lastYears.caregiver===c.id)return '正在为太后侍疾';
    if(queenCaregiver()===c)return '正在为皇后侍疾';
  }
  if(c.outerHouseholdId)return '分院安置，不入轮值';
  if(c.cardWithdrawn)return '绿头牌已撤';
  if(c.preg)return c.maid&&c.preg===1&&journalContentVersion()>=49?'今夜暂不宜留侍':'有孕在身';
  const r=consortRecovery(c);
  if(r)return `${r.kind==='birth'?'产后':'小产后'}调养 · 还需${Math.min(3,r.until-S.turn)}个月`;
  if(consortRecoveryActive()&&c.delivery&&!c.delivery.settled)return '产事尚待安顿';
  if(consortTraitsActive()&&c.hp<35)return '身体虚弱，宜先调养';
  return '';
}
function queenCaregiver(){
  if(!S||journalContentVersion()<91)return null;
  const q=empress(),care=q?.queenIllnessCare,ill=q?.illnessRecovery;
  if(!q||!inPalace(q)||!care||!ill||ill.turn!==care.illnessTurn||S.turn>=Math.min(care.until,ill.until))return null;
  const c=byId(care.caregiver);return c&&dowagerVisitReady(c)?c:null;
}
function queenCareSelection(q){
  const valid=()=>journalContentVersion()>=91&&q===empress()&&inPalace(q)&&q.illnessRecovery?.until>S.turn;
  if(!valid())return null;
  const candidates=()=>harem().filter(c=>c!==q&&c.age>=18&&dowagerVisitReady(c)&&!(dowagerIll(S.flags.dowager)&&S.flags.dowager.lastYears.caregiver===c.id));
  return {title:'中宫 · 安排侍疾',por:q,valid,text:'皇后病中可请一位身体安好的妃嫔照应起居，太医和宫人仍负责诊治与轮值。侍疾期间暂不召她侍寝，病程结束后恢复。',choices:[
    ...candidates().map(c=>({t:`请${fullName(c)}侍疾`,person:c,cond:()=>valid()&&candidates().includes(c),why:'眼下不宜侍疾',f:()=>{
      if(!valid()||!candidates().includes(c))return null;
      q.queenIllnessCare={caregiver:c.id,illnessTurn:q.illnessRecovery.turn,until:q.illnessRecovery.until};
      story(c,'【中宫侍疾】奉旨照看皇后病中起居，太医与宫人协助轮值。');story(q,`【中宫侍疾】${fullName(c)}奉旨照应病中起居。`);
      log(`${fullName(c)}奉旨为皇后侍疾，病中暂不召幸。`);return `${fullName(c)}接下侍疾安排，待皇后病程结束后恢复召幸。`;
    }})),{t:'由太医与宫人照护',f:()=>{if(!valid())return null;delete q.queenIllnessCare;return '由太医与宫人轮值照护，不再另派妃嫔。';}}]};
}
A.queenCare=function(){if(!modalOpen){const q=empress(),ev=q&&queenCareSelection(q);if(ev)pushEv(ev);}};
function bearGuardEligible(c){
  if(!consortRecoveryActive())return true;
  if(!inPalace(c)||c.preg||c.hp<65||consortRecovery(c)||c.delivery&&!c.delivery.settled)return false;
  if(c.illnessRecovery&&S.turn<c.illnessRecovery.until)return false;
  return recentRecoveryStory(c,/^(染了风寒，太医悉心诊治|卧病在床，陛下亲自来看她|病了半月，陛下未曾过问)/,2)===null;
}
const recoveryBirthEvent=birthEvent;
birthEvent=function(c){
  const previous=c.delivery,result=recoveryBirthEvent(c);
  if(c.delivery!==previous&&!c.delivery?.concealedLoss&&c.delivery)
    beginConsortRecovery(c,'birth',c.lastBirth);
  return result;
};
const recoveryConcealedLoss=beginConcealedLoss;
beginConcealedLoss=function(c){
  const result=recoveryConcealedLoss(c);
  if(result)beginConsortRecovery(c,'loss',c.concealedLoss.turn,true);
  return result;
};
