/* An apparent pregnancy can conceal a saved loss. It never creates a second biological baby. */
function concealedPregnancy(c){return !!(c?.concealedLoss&&!c.concealedLoss.revealed&&!c.concealedLoss.settled);}
function concealedLossEligible(c){
  return inPalace(c)&&!c.maid&&c.preg>=3&&c.preg<=7&&!c.prot&&!c.swapAsked&&!c.concealedLoss&&
    c.scheme>=70&&c.virtue<=40&&(c.favor>=45||c.rank>=4)&&
    !S.children.some(k=>k.alive&&k.mom===c.id&&k.sex==='m'&&!k.removedFromRoyal)&&
    S.turn-(S.flags.lastConcealedLoss??-99)>=36;
}
function beginConcealedLoss(c){
  if(!concealedLossEligible(c))return false;
  const loss={turn:S.turn,date:dateStr(),month:c.preg,term:c.pregnancyCalendar?.term||10,
    father:JSON.parse(JSON.stringify(conceptionFather(c))),clueDue:S.turn+1,clueShown:false,
    smuggleSucceeds:chance(.55),settled:false,revealed:false};
  c.concealedLoss=loss;c.swapAsked=true;S.flags.lastConcealedLoss=S.turn;
  // preg remains the month in the public register until an inquiry reveals the loss.
  // The sealed loss record is authoritative for delivery, so no live royal fetus is generated.
  c.mood=clamp(c.mood-8);return true;
}
function concealedLossTick(c){if(concealedLossEligible(c)&&chance(.006))beginConcealedLoss(c);}
function revealConcealedLoss(c,reason){
  const loss=c?.concealedLoss;if(!loss||loss.revealed)return null;
  loss.revealed=true;loss.settled=true;loss.pendingReport=false;c.preg=0;c.prot=false;c.swapRisk=false;
  delete c.pregnancyFather;delete c.pregnancyCalendar;
  if(c.swapPlot&&!c.swapPlot.settled)c.swapPlot.settled=true;
  const line=`核实${fullName(c)}于${loss.date}、孕${loss.month}月时小产，此后隐瞒消息，仍按原产期准备冒报男婴。${reason}小产本身不作罪责，隐瞒与冒报之谋另记案卷。`;
  story(c,line);remember(c,'hurt','隐瞒小产与冒报皇子的打算被查明');setXin(c,'惶恐','隐瞒小产的事情被查明');log(line,1);save('auto');return line;
}
function concealedLossClueEvent(c){
  const loss=c?.concealedLoss;if(!concealedPregnancy(c)||!inPalace(c)||loss.clueShown||S.turn<loss.clueDue)return null;
  let queued=false;
  return {title:'迟来的脉案',por:c,valid:()=>concealedPregnancy(c)&&inPalace(c)&&(!loss.clueShown||queued),
    onQueue:()=>{queued=true;loss.clueShown=true;},
    text:`太医院复核药簿时，发现${fullName(c)}宫中前些日子领过一份调养方，抄入脉案的日期却前后不一。她仍照旧报着孕月，近来又总避着原先的医官。\n一名宫人还听见掌事嬷嬷托人打听宫外即将临盆的人家。几处疑点尚须查证，不能只凭流言定罪。`,choices:[
      {t:'核验原始脉案，另派医官问诊 · 精力−1',cond:()=>E().energy>0,f:()=>{
        if(!concealedPregnancy(c)||!inPalace(c)||!useE())return null;
        return revealConcealedLoss(c,'医官与当值宫人的证词相合，接替照护后，宫外抱婴的安排未能实施。');
      }},
      {t:'暂记疑点，不惊动她',f:()=>{if(!concealedPregnancy(c))return null;loss.watched=true;save('auto');return '旧脉案与宫人的话已封存。未核清之前，宫中仍按原报孕月安排照护。';}}]};
}
function concealedLossFailureEvent(c){
  const loss=c?.concealedLoss;if(!loss?.pendingReport||loss.revealed||!c.alive)return null;
  return {title:'空下来的襁褓',por:c,valid:()=>!!loss.pendingReport&&!loss.revealed&&c.alive,
    text:`到了原报的产期，${fullName(c)}宫中始终不肯让医官入内。内务府核查后发现，当月并没有真实分娩。\n宫外抱婴的安排未能得手。旧脉案与当值宫人证词记着，她早在${loss.date}、孕${loss.month}月时便已小产，却一直隐瞒消息。`,choices:[
      {t:'揭明实情，停止虚报孕月并安排调养',f:()=>revealConcealedLoss(c,'宫外婴儿未能送入，没有虚报的皇嗣入册。')}]};
}
function concealedDeliveryEvent(c){
  const loss=c.concealedLoss;if(!concealedPregnancy(c)||c.preg<loss.term)return null;
  loss.settled=true;c.preg=0;c.prot=false;c.swapRisk=false;c.lastBirth=S.turn+1;
  if(!inPalace(c)||!loss.smuggleSucceeds){
    loss.pendingReport=true;delete c.pregnancyFather;delete c.pregnancyCalendar;
    return concealedLossFailureEvent(c);
  }
  const k=makeKid(c,'m',suggestName('m'));
  delete c.pregnancyFather;delete c.pregnancyCalendar;
  k.pendingName=true;k.birthOrder=1;
  k.birthSwap={version:3,occurred:true,plotter:c.id,claimedMother:c.id,claimedMotherName:fullName(c),turn:S.turn,
    motive:'conceal-miscarriage',originalStatus:'miscarried',original:null,loss:JSON.parse(JSON.stringify(loss)),
    guarded:false,originalSafe:false,clueDue:S.turn+ri(2,5),clueShown:false,confirmed:false};
  applySwapOutsideParents(k,k.birthSwap);
  c.delivery={children:[k.id],kind:'',omen:null,difficult:false,swap:false,settled:false,concealedLoss:true};
  return birthNamingEvent(c);
}
function pendingConcealedLoss(){
  for(const c of S.consorts){const ev=concealedLossFailureEvent(c)||concealedLossClueEvent(c);if(ev)return ev;}
  return null;
}
function miscarriageCaseText(s){
  const loss=s.loss;
  return `原始脉案与当值宫人证词相合：她在${loss?.date||'原报产期之前'}${loss?.month?'、孕'+loss.month+'月时':''}已经小产。此后佯作仍有身孕，等到原报产期抱入宫外男婴冒报皇子，当月并未真正分娩。`;
}
