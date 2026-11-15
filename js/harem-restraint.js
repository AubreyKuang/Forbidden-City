/* A soft population limit for new introductions, never for existing people. */
const HAREM_SOFT_LIMIT=30, HAREM_INTAKE_RATE=.1, HAREM_ADVICE_INTERVAL=6;
function haremRestraintEnabled(){return typeof PalaceActions==='undefined'||PalaceActions.contentVersion>=6;}
function livingConsortCount(){return S.consorts.filter(c=>c.alive&&!c.gone&&!c.maid&&!c.rescuedGuest).length;}
function haremRestraintState(create=false){
  if(S.flags.haremRestraint?.gen===S.gen)return S.flags.haremRestraint;
  if(!create)return null;
  return S.flags.haremRestraint={gen:S.gen,months:[],lastAdvice:null,pauseUntil:null,history:[]};
}
function newConsortEventAllowed(){
  if(!haremRestraintEnabled())return true;
  if((haremRestraintState()?.pauseUntil??-1)>S.turn)return false;
  return livingConsortCount()<=HAREM_SOFT_LIMIT||chance(HAREM_INTAKE_RATE);
}
function recordHaremCourtMonth(){
  if(!haremRestraintEnabled())return;
  const state=haremRestraintState(true),brief=S.flags.monthlyCourt;
  if(state.months.some(m=>m.turn===S.turn))return;
  state.months.push({turn:S.turn,nights:E().nightsMonth||0,court:!!(brief?.gen===S.gen&&brief.turn===S.turn&&brief.done)});
  state.months=state.months.slice(-3);
}
function haremRestraintPanel(){
  if(!haremRestraintEnabled())return '';
  const count=livingConsortCount(),pause=(haremRestraintState()?.pauseUntil??-1)-S.turn;
  if(count<=HAREM_SOFT_LIMIT&&pause<=0)return '';
  return `<p class="hint">内廷现有在世妃嫔 ${count} 位（含皇后）。${pause>0?`奉旨暂缓主动荐选，尚余 ${pause} 个月。`: '已逾三十，礼部与各家从缓荐选。'}仍可自行下旨选秀；已在宫中的亲缘往来照旧。</p>`;
}
function haremAdviceOfficialReady(e){
  return !!(e&&e.h.bloc!=='army'&&officialServing(e.p)&&!e.p.away&&!e.p.report&&e.p.age>=18);
}
function haremRemonstranceEvent(){
  if(!haremRestraintEnabled()||S.over||mourningActive()||livingConsortCount()<=HAREM_SOFT_LIMIT)return null;
  const state=haremRestraintState(),last=state?.lastAdvice;
  if(last!==null&&last!==undefined&&S.turn-last<HAREM_ADVICE_INTERVAL)return null;
  const count=livingConsortCount(),gen=S.gen,turn=S.turn;
  const months=(state?.months||[]).filter(m=>m.turn>=S.turn-3&&m.turn<S.turn);
  const neglected=months.length===3&&months.filter(m=>!m.court).length>=2;
  const nights=months.at(-1)?.nights||0,weak=E().health<60;
  const official=officialEntries().filter(haremAdviceOfficialReady)
    .sort((a,b)=>(b.p.temperament==='持正')-(a.p.temperament==='持正')||b.p.ability-a.p.ability)[0];
  const speaker=official?`${official.p.office||official.p.post} ${official.p.name}`:'一位谏官';
  let text=`${speaker}呈上奏疏，先列内廷名册：皇后与仍在世的妃嫔共 ${count} 位，已逾三十。冷宫及暂时省亲、寺居者仍在册，宫女不列其中。\n`;
  text+=neglected?'“近三个月中，至少两个月的月度奏折未获批复。臣恐陛下顾此失彼，耽于声色而误国，终贻昏君之讥。请以政事为先，慎增内廷。”':
    months.length===3&&months.every(m=>m.court)?'“陛下近来按月批复奏折，臣不敢以人数论贤愚。只是内廷人众，供养与照拂皆须用心，请慎增新人，勿使声色渐夺治事之暇。”':
    '“内廷人众，供养与照拂皆须用心。臣愿陛下慎增新人，勤于政事，莫因一时逸乐而负天下之望。”';
  if(weak)text+='\n奏疏又提到陛下近来龙体欠安：“宗社所系，首在圣躬。请节制夜间召幸，留时静养，不可再添劳倦。”';
  else if(nights>=4)text+=`\n“上月敬事簿记有召幸 ${nights} 次。龙体虽尚康健，也宜留时安寝，莫待劳倦成疾才思节制。”`;
  else text+='\n疏末仍劝珍重龙体，起居有节，不必为了充实后宫而劳神。';
  let settled=false;
  const valid=()=>!settled&&S.gen===gen&&S.turn===turn&&livingConsortCount()>HAREM_SOFT_LIMIT&&(!official||haremAdviceOfficialReady(official));
  const record=(title,outcome,rejected=false)=>{
    const entry=`【${title}】${outcome}`;
    if(!official){log(entry,1);return;}
    officialRecord(official.c,official.role,entry,{family:false});
    for(const c of paternalFamily(official.c).filter(inPalace)){
      const kin=officialKinLabel(official.h,official.role,c);
      const feeling=rejected?'她听闻家人因直言遭斥，心里不安，盼事情不再牵连。':
        isSolitary(c)||['持重','爽直','将门','好学'].includes(c.trait)?'她认得家人的坚持，只愿朝事依理而论，不因自己的宫中身份而改口。':'她担心家人说得太直，得知陛下肯听，才稍稍放下心。';
      livedRecord([c],'court',title,`harem-advice:${gen}:${turn}`,`${kin}${official.p.name}上疏劝慎增内廷、珍重龙体。${outcome}`,[feeling]);
    }
  };
  const finish=mode=>{
    if(!valid())return null;settled=true;
    const s=haremRestraintState(true);
    const outcome=mode==='pause'?'陛下纳谏，命礼部与各家半年内暂缓主动荐选，现有妃嫔照常供养，已开始的来往不废。':
      mode==='balance'?'陛下答复将自择进退、节制起居，保留现行荐选安排；没有下达暂停纳人的诏令。':
      '陛下斥退奏疏，责其多言。谏官仍回原职，朝中对这次拒谏有所议论。';
    if(mode==='pause')s.pauseUntil=S.turn+6;
    s.history.push({turn:S.turn,date:dateStr(),count,mode,text:outcome});s.history=s.history.slice(-12);
    record('慎增内廷 · 批复',outcome,mode==='reject');
    return outcome+fx(chg(mode==='pause'?{prestige:2}:mode==='reject'?{prestige:-3,people:-2}:{}));
  };
  return {title:'朝臣上疏 · 慎增内廷',por:official?.p,valid,text,
    onQueue:()=>{haremRestraintState(true).lastAdvice=S.turn;},
    onShow:()=>{log(`${speaker}上疏：内廷在世妃嫔 ${count} 位，请慎增新人、勤政节欲、珍重龙体。`,1);},
    choices:[{t:'纳谏，半年内暂缓荐选',f:()=>finish('pause')},{t:'朕会节制，仍自行择人',f:()=>finish('balance')},{t:'斥退奏疏，不许妄议',f:()=>finish('reject')}]};
}
