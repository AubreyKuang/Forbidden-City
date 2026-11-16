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
  if(c.cardWithdrawn)return '绿头牌已撤';
  if(c.preg)return c.maid&&c.preg===1&&journalContentVersion()>=49?'今夜暂不宜留侍':'有孕在身';
  const r=consortRecovery(c);
  if(r)return `${r.kind==='birth'?'产后':'小产后'}调养 · 还需${Math.min(3,r.until-S.turn)}个月`;
  if(consortRecoveryActive()&&c.delivery&&!c.delivery.settled)return '产事尚待安顿';
  if(consortTraitsActive()&&c.hp<35)return '身体虚弱，宜先调养';
  return '';
}
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
