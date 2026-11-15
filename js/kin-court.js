/* ============ 妃嫔家族与前朝 ============ */
// 宫中交好或交恶的妃嫔，她们的父兄在朝中也会互相举荐、附议、驳议或参本；
// 父兄在朝堂上的扶持与攻讦，反过来又让宫里的两人更亲近或生出嫌隙。
// 规则：只有在世、在任、确有职守的父兄才会出面；被举荐者须能领差；
// 参本须有起因（宫中嫌隙或派系相争），凭实据的才算“参本”，否则只能“风闻奏事”交部核查。
// 每个结果都同时写进双方父兄、她们在宫中的女儿/姐妹的纪事。
// 旧存档里未完的事件按原样重放：事务日志版本 6 之前的步骤不触发这里的抽签或写入。
const KIN_COURT_JOURNAL=6;
const KIN_COURT_FRIEND=35, KIN_COURT_FOE=-35;
const KIN_COURT_EVENT_GAP=8, KIN_COURT_TICK_GAP=4, KIN_COURT_PAIR_GAP=12, KIN_COURT_PERSON_GAP=8;
const KIN_COURT_TASKS={army:['border','drills','escort'],civil:['dikes','granaries','accounts','schools','water']};
// 部议时可附议的具体事务，按其所在派系的职守取材。
const KIN_COURT_TOPICS={civil:['清丈田亩','漕运章程','科场条例','赈济章程','州县考成'],army:['边镇换防','军屯章程','马政','烽燧修缮'],kin:['织造贡额','盐引新规','内库采办'],dowager:['宗室赡养','太医院药材采办'],none:['州县考成','赈济章程']};
const KIN_COURT_LAPSE=/未尽如期|疏漏|兵败|失察|不力|未能理清|罚俸|问责|空名|有缺|未能核清|未议定/;

// The version of the transcript being played or replayed; scenes from older versions keep older rules.
function journalContentVersion(){return typeof PalaceActions==='undefined'?Infinity:PalaceActions.contentVersion??Infinity;}
function kinCourtActive(){
  if(!S||S.over)return false;
  return journalContentVersion()>=KIN_COURT_JOURNAL;
}
function kinCourtState(){
  const st=S.flags.kinCourt ||= {};
  st.pairs ||= {};st.log ||= [];
  return st;
}
// 在任、可上疏议事的父兄（含已出仕的娘家男丁）
function kinCourtSides(c){
  const h=houseOf(c);if(!h)return [];
  return officialRoles(h).map(role=>({c,h,role,p:officialPerson(h,role),key:c.id+':'+role})).filter(e=>officialServing(e.p));
}
function kinCourtFree(p){
  return officialServing(p)&&!p.report&&!p.postReview&&!reliefSuspended(p)&&p.age<70&&S.turn-(p.lastCommission??-99)>=6;
}
// 只认已经写在履历里的疏失；功绩偏低只能算“才具平平”的评语，不算罪证。
function kinCourtLapse(p){
  if(p.report?.outcome==='setback')return {text:`${p.report.title}未尽如期`,grounded:true};
  const record=(p.story||[]).slice(-6).reverse().find(x=>KIN_COURT_LAPSE.test(x.t));
  if(record)return {text:`${record.d}${record.t.replace(/[。；]+$/,'').slice(0,28)}`,grounded:true};
  if((p.merit??50)<30)return {text:'任上功绩平平',grounded:false};
  return null;
}
const kinCourtRival=(x,y)=>!!(x&&y&&(BLOC_RIVAL[x]===y||BLOC_RIVAL[y]===x));
function kinCourtKin(e,member=e.c){return officialKinLabel(e.h,e.role,member);}
function kinCourtWho(e){return `${fullName(e.c)}的${kinCourtKin(e)}${e.p.name}`;}
// 两位妃嫔须出自不同的家，且都还在宫中与人往来。
function kinCourtPairs(){
  const consorts=harem().filter(c=>!c.maid&&!isSolitary(c)&&houseOf(c));
  const pairs=[];
  for(let i=0;i<consorts.length;i++)for(let j=i+1;j<consorts.length;j++){
    const a=consorts[i],b=consorts[j],ha=houseOf(a),hb=houseOf(b);
    if(ha===hb||sameFather(a,b)||paternalFamily(a).includes(b))continue;
    const sa=kinCourtSides(a),sb=kinCourtSides(b);if(!sa.length||!sb.length)continue;
    const rel=relGet(a,b),sameBloc=!!ha.bloc&&ha.bloc===hb.bloc,rival=kinCourtRival(ha.bloc,hb.bloc);
    let cause=null;
    if(rel>=KIN_COURT_FRIEND)cause='palace-friend';
    else if(rel<=KIN_COURT_FOE)cause='palace-foe';
    else if(sameBloc)cause='court-ally';
    else if(rival)cause='court-rival';
    if(cause)pairs.push({a,b,sa,sb,rel,cause,key:rk(a,b)});
  }
  return pairs;
}
const kinCourtFriendly=pair=>pair.cause==='palace-friend'||pair.cause==='court-ally';
// 一方出面（actor），另一方承受（target）。宫中嫌隙由心中更不平的一方家里先发难。
// 同一位官员不会接连卷入：每人在一段时间内只出现在一件同朝往来里。
function kinCourtRecent(p,months=KIN_COURT_PERSON_GAP){return (S.flags.kinCourt?.log||[]).some(x=>(x.from===p.id||x.to===p.id)&&S.turn-x.turn<months);}
function kinCourtCast(pair,{needFree=false,needLapse=false,rest=0}={}){
  const options=[];
  for(const [from,to] of [[pair.sa,pair.sb],[pair.sb,pair.sa]])for(const x of from)for(const y of to){
    if(x.p===y.p||x.p.id===y.p.id)continue;
    if(rest&&(kinCourtRecent(x.p,rest)||kinCourtRecent(y.p,rest)))continue;
    if(needFree&&!kinCourtFree(y.p))continue;
    const lapse=kinCourtLapse(y.p);
    if(needLapse&&!lapse?.grounded&&pair.cause!=='palace-foe')continue;
    options.push({x,y,lapse,w:needLapse&&lapse?.grounded?3:1});
  }
  return options.length?pickW(options):null;
}
function kinCourtNote(pair,cast,kind,text,delta){
  const st=kinCourtState();
  st.log.push({turn:S.turn,d:dateStr(),kind,cause:pair.cause,from:cast.x.p.id,to:cast.y.p.id,fromKey:cast.x.key,toKey:cast.y.key,a:cast.x.c.id,b:cast.y.c.id,delta,text});
  if(st.log.length>60)st.log.splice(0,st.log.length-60);
  st.pairs[pair.key]=S.turn;
}
// 宫中两人如何看待这件前朝事；关系变动后写入各自纪事与记忆。
function kinCourtPalaceEcho(cast,delta,{actorLine,targetLine}){
  const a=cast.x.c,b=cast.y.c,before=relGet(a,b);
  relAdd(a,b,delta);
  const after=relGet(a,b),turned=before>=KIN_COURT_FRIEND&&after<KIN_COURT_FRIEND&&delta<0?'从前的交情，自此隔了一层。':before<=KIN_COURT_FOE&&after>KIN_COURT_FOE&&delta>0?'旧日的芥蒂，也淡了几分。':'';
  for(const [person,other,line] of [[a,b,actorLine],[b,a,targetLine]]){
    if(!line||!person.alive)continue;
    story(person,`【前朝牵动·${fullName(other)}】${line}${turned}`);
    NPCMemory.record(S,{type:'kin-court',time:S.turn,participants:[person.id,other.id,cast.x.p.id,cast.y.p.id],object:line},
      [{person:person.id,subject:other.id,interpretation:line,emotion:delta>0?.5:-.5,impact:60}]);
  }
  return after;
}

/* —— 月度纪事：不需批复的同朝往来 —— */
function kinCourtTick(){
  if(!kinCourtActive())return null;
  const st=kinCourtState();
  if(S.turn-(st.lastTick??-99)<KIN_COURT_TICK_GAP)return null;
  const pairs=kinCourtPairs().filter(pair=>S.turn-(st.pairs[pair.key]??-99)>=KIN_COURT_PAIR_GAP&&(kinCourtFriendly(pair)||pair.cause==='palace-foe'||pair.sb.some(y=>kinCourtLapse(y.p)?.grounded)||pair.sa.some(y=>kinCourtLapse(y.p)?.grounded)));
  if(!pairs.length||!chance(.35))return null;
  const pair=pickW(pairs.map(p=>({...p,w:p.cause.startsWith('palace')?2:1})));
  const friendly=kinCourtFriendly(pair),cast=kinCourtCast(pair,{needLapse:pair.cause==='court-rival',rest:KIN_COURT_PERSON_GAP});
  if(!cast)return null;
  st.lastTick=S.turn;
  const {x,y}=cast,matter=pick(KIN_COURT_TOPICS[y.h.bloc]||KIN_COURT_TOPICS.none);
  let kind,actorText,targetText,delta,actorLine,targetLine;
  if(friendly){
    kind=chance(.5)?'second':'visit';
    if(kind==='second'){
      actorText=`部议时附议${y.p.name}关于「${matter}」的条陈，称其所奏切实可行。`;
      targetText=`所上「${matter}」条陈，得${x.p.name}在部议时附议。`;
      y.p.merit=clamp(y.p.merit+2);
    }else{
      actorText=`与${y.p.name}在京中往来，互赠书札，商议公务之余也问起宫中亲眷。`;
      targetText=`与${x.p.name}在京中往来，互赠书札。`;
    }
    delta=pair.cause==='court-ally'?4:3;
    actorLine=`听说${kinCourtKin(x)}${x.p.name}与${kinCourtWho(y)}在朝中互相照应，她见了${cName(y.c)}也多说了几句话。`;
    targetLine=`听说${kinCourtKin(y)}${y.p.name}在朝中得了${fullName(x.c)}家的照应，她记着这份情。`;
  }else{
    const lapse=cast.lapse;
    kind=lapse?.grounded?'criticize':'belittle';
    if(kind==='criticize'){
      actorText=`朝议时指摘${y.p.name}「${lapse.text}」，请部里记明。`;
      targetText=`朝议时被${x.p.name}指摘「${lapse.text}」，当廷陈明缘由。`;
      y.p.trust=clamp(y.p.trust-1);
    }else{
      actorText=`朝议时语带讥讽，说${y.p.name}${lapse?lapse.text:'资历尚浅、才具未见'}。有同僚以为失了大臣体面。`;
      targetText=`朝议时遭${x.p.name}当众讥讽，未与之争辩。`;
      x.p.trust=clamp(x.p.trust-1);
    }
    delta=pair.cause==='palace-foe'?-3:-4;
    actorLine=`${kinCourtKin(x)}${x.p.name}在朝中与${kinCourtWho(y)}起了口角，她在宫里遇见${cName(y.c)}，两人都没先开口。`;
    targetLine=`听说${kinCourtKin(y)}${y.p.name}在朝中受了${fullName(x.c)}家的气，她对${cName(x.c)}更冷淡了。`;
  }
  officialRecord(x.c,x.role,actorText,{emotion:friendly?.3:-.2});
  officialRecord(y.c,y.role,targetText,{emotion:friendly?.4:-.4});
  kinCourtPalaceEcho(cast,delta,{actorLine,targetLine});
  kinCourtNote(pair,cast,kind,actorText,delta);
  return {pair,cast,kind,delta};
}

/* —— 朝堂事件：举荐领差 / 参本 —— */
function kinCourtTask(y){
  const ids=KIN_COURT_TASKS[y.h.bloc==='army'?'army':'civil'].filter(id=>OFFICIAL_TASKS[id]);
  return ids.length?pick(ids):null;
}
function kinCourtCommission(y,id,x){
  const task=OFFICIAL_TASKS[id],p=y.p;if(!task||!kinCourtFree(p)||E().treasury<task.cost)return false;
  chg({treasury:-task.cost});p.lastCommission=S.turn;
  const roll=R(),success=.35+p.ability/200+p.trust/500;
  p.commission={id,title:task.title,due:S.turn+task.months,started:S.turn,contact:y.c.id,wasAway:!!p.away,recommendedBy:x.p.id,
    outcome:roll<task.risk?'death':roll<success?'success':'setback'};
  return true;
}
function kinCourtStillValid(pair,cast,needFree){
  const {x,y}=cast;
  return kinCourtActive()&&[x.c,y.c].every(c=>harem().includes(c))&&officialServing(x.p)&&officialServing(y.p)&&
    officialPerson(houseOf(x.c),x.role)===x.p&&officialPerson(houseOf(y.c),y.role)===y.p&&(!needFree||kinCourtFree(y.p));
}
function kinCourtRecommendEvent(pair,cast){
  const {x,y}=cast,id=kinCourtTask(y),task=OFFICIAL_TASKS[id];if(!task)return null;
  const army=y.h.bloc==='army',deed=army?`领兵${task.title}`:`承办「${task.title}」`;
  const why=pair.cause==='palace-friend'?`${cName(x.c)}与${cName(y.c)}在宫中素来交好，朝中有人说两家“内里通了气”；也有人说${y.p.name}确是合适人选。`
    :`两家同属${blocName(x.h.bloc)}一脉，${cName(x.c)}与${cName(y.c)}在宫中却往来不多。`;
  const fit=y.p.ability>=60?'吏部存档里，他的才干颇受称道。':y.p.ability>=45?'吏部存档里，他的才干中规中矩。':'吏部存档里，他的才干并不出众。';
  const valid=()=>kinCourtStillValid(pair,cast,true);
  let done=false;
  const once=f=>(...args)=>{if(done||!valid())return null;done=true;return f(...args);};
  const ev={title:'同朝举荐',kinCourt:'recommend',por:x.p,cast:[x.p,y.p,x.c,y.c],cooldown:KIN_COURT_EVENT_GAP,valid,
    text:`${kinCourtWho(x)}上疏，举荐${kinCourtWho(y)}${deed}（约${task.months}个月，需拨银${task.cost}万两）。\n${why}${fit}`,
    onQueue:()=>{kinCourtState().lastEvent=S.turn;},choices:[
      {t:`准奏，命${y.p.name}领差 · 国库−${task.cost}`,cond:()=>E().treasury>=task.cost,why:'国库银两不足',f:once(()=>{
        if(!kinCourtCommission(y,id,x))return '眼下已不合领差条件，举荐暂且搁置。';
        x.p.trust=clamp(x.p.trust+2);
        officialRecord(x.c,x.role,`上疏举荐${y.p.name}${deed}，获准。`,{emotion:.4});
        officialRecord(y.c,y.role,`经${x.p.name}举荐，奉旨${task.title}，约${task.months}个月后回奏。`,{emotion:.5});
        const delta=pair.cause==='court-ally'?10:8;
        kinCourtPalaceEcho(cast,delta,{actorLine:`${kinCourtKin(x)}${x.p.name}举荐了${kinCourtWho(y)}，获准。她与${cName(y.c)}往来更勤了。`,
          targetLine:`${kinCourtKin(y)}${y.p.name}得${fullName(x.c)}家举荐领差。她记下这份人情，与${cName(x.c)}更亲近了些。`});
        kinCourtNote(pair,cast,'recommend',`举荐${y.p.name}${deed}，获准。`,delta);
        return `${y.p.name}领命${task.title}，回奏会写入履历。${fx(cchg(x.c,{mood:4}),cchg(y.c,{mood:6,aff:2}))}`;
      })},
      {t:'留中，另择人选',f:once(()=>{
        officialRecord(x.c,x.role,`举荐${y.p.name}${deed}的奏疏留中未发。`);
        officialRecord(y.c,y.role,`${x.p.name}举荐其${deed}，奏疏留中，未获采纳。`);
        kinCourtPalaceEcho(cast,2,{actorLine:`${kinCourtKin(x)}${x.p.name}替${fullName(y.c)}的${kinCourtKin(y)}说了话，虽未成事，两家的情分倒是记下了。`,
          targetLine:`听说${fullName(x.c)}家曾举荐${kinCourtKin(y)}${y.p.name}，事虽未成，她心里领情。`});
        kinCourtNote(pair,cast,'recommend-held',`举荐${y.p.name}${deed}，留中。`,2);
        return '奏疏留中，差事另行择人。';
      })},
      {t:'申饬：“用人是朝廷的事，不是两家的事。”',f:once(()=>{
        x.p.trust=clamp(x.p.trust-4);y.p.trust=clamp(y.p.trust-2);
        officialRecord(x.c,x.role,`举荐${y.p.name}，被申饬“用人是朝廷的事”。`,{emotion:-.3});
        officialRecord(y.c,y.role,`${x.p.name}举荐其${deed}，陛下申饬两家勿相援引。`,{emotion:-.3});
        story(x.c,`【前朝牵动·${fullName(y.c)}】${kinCourtKin(x)}举荐${fullName(y.c)}家的人受了申饬。她这几日不大出门。`);
        story(y.c,`【前朝牵动·${fullName(x.c)}】${kinCourtKin(y)}被举荐一事受了申饬。她怕人议论两家结党，见了${cName(x.c)}也只点头。`);
        kinCourtNote(pair,cast,'recommend-rebuked',`举荐${y.p.name}，受申饬。`,0);
        policyNudge('civil',2);
        return `两家都收敛了些。${fx(chg({prestige:1}),cchg(x.c,{mood:-4}),cchg(y.c,{mood:-4}))}`;
      })}]};
  return ev;
}
function kinCourtImpeachEvent(pair,cast){
  const {x,y,lapse}=cast,grounded=!!lapse?.grounded;
  const charge=grounded?`「${lapse.text}」，请交部议处`:`风闻其${pick(['门下收受地方馈赠','擅用驿马私递家书','荐人失察'])}，请旨核查`;
  const why=pair.cause==='palace-foe'?`宫里都知道，${cName(x.c)}与${cName(y.c)}素有嫌隙。`
    :pair.rel>=KIN_COURT_FRIEND?`${cName(x.c)}与${cName(y.c)}在宫中本来交好，这道折子让两人都不好开口。`
    :`两家分属${blocName(x.h.bloc)}与${blocName(y.h.bloc)}，在朝中早有龃龉。`;
  const friendsBefore=pair.rel>=KIN_COURT_FRIEND;
  const valid=()=>kinCourtStillValid(pair,cast,false);
  let done=false;
  const once=f=>(...args)=>{if(done||!valid())return null;done=true;return f(...args);};
  const targetHurt=friendsBefore?`${kinCourtKin(y)}${y.p.name}被${fullName(x.c)}家参了一本。她没想到会是${cName(x.c)}的家里人。`:`${kinCourtKin(y)}${y.p.name}被${fullName(x.c)}家参了一本，她对${cName(x.c)}更添了戒心。`;
  return {title:'同朝参本',kinCourt:'impeach',por:x.p,cast:[x.p,y.p,x.c,y.c],cooldown:KIN_COURT_EVENT_GAP,valid,
    text:`${kinCourtWho(x)}上本参劾${kinCourtWho(y)}：${charge}。\n${why}${grounded?'所参之事，履历中确有记载。':'所参之事尚无实据。'}`,
    onQueue:()=>{kinCourtState().lastEvent=S.turn;},choices:[
      {t:'交部核查，据实处置',f:once(()=>{
        const proven=chance(grounded?.75:.3);
        if(proven){
          y.p.trust=clamp(y.p.trust-5);y.p.merit=clamp(y.p.merit-6);x.p.trust=clamp(x.p.trust+2);
          officialRecord(x.c,x.role,`参劾${y.p.name}，经部核查属实。`,{emotion:.2});
          officialRecord(y.c,y.role,`遭${x.p.name}参劾，经部核查属实，罚俸半年。`,{emotion:-.5});
        }else{
          x.p.trust=clamp(x.p.trust-6);
          officialRecord(x.c,x.role,`参劾${y.p.name}，查无实据，落了个“挟私攻讦”的名声。`,{emotion:-.4});
          officialRecord(y.c,y.role,`遭${x.p.name}参劾，经部核查查无实据，得还清白。`,{emotion:.3});
        }
        const delta=friendsBefore?-12:-8;
        kinCourtPalaceEcho(cast,delta,{actorLine:proven?`${kinCourtKin(x)}${x.p.name}参劾${fullName(y.c)}家属实。她在宫中见了${cName(y.c)}，只觉对方眼神冷了。`:`${kinCourtKin(x)}${x.p.name}参劾${fullName(y.c)}家查无实据，她在宫里抬不起头，也怨对方家里不肯罢休。`,
          targetLine:proven?targetHurt:`${kinCourtKin(y)}${y.p.name}被${fullName(x.c)}家参劾，查明清白。她松了口气，却记下了这一本。`});
        kinCourtNote(pair,cast,proven?'impeach-proven':'impeach-cleared',`参劾${y.p.name}，${proven?'属实':'查无实据'}。`,delta);
        return proven?`所参属实，${y.p.name}罚俸半年。${fx(chg({people:1}),cchg(y.c,{mood:-8}))}`:`查无实据，${y.p.name}得还清白。${fx(cchg(x.c,{mood:-6}),cchg(y.c,{mood:3}))}`;
      })},
      ...(typeof jinyiweiRumorChoice==='function'&&courtOfficesActive()?[jinyiweiRumorChoice(pair,cast,charge.replace(/^风闻其|，请旨核查$/g,''))].filter(Boolean).map(c=>({...c,f:once(c.f)})):[]),
      {t:'留中不发',f:once(()=>{
        officialRecord(x.c,x.role,`参劾${y.p.name}的奏本留中不发。`);
        officialRecord(y.c,y.role,`被${x.p.name}参了一本，奏本留中不发。`,{emotion:-.2});
        const delta=friendsBefore?-6:-4;
        kinCourtPalaceEcho(cast,delta,{actorLine:`${kinCourtKin(x)}${x.p.name}参${fullName(y.c)}家的折子被压下了。她知道这事瞒不住宫里。`,targetLine:targetHurt});
        kinCourtNote(pair,cast,'impeach-held',`参劾${y.p.name}，留中。`,delta);
        return '奏本压在案头，没有发下去。';
      })},
      {t:'斥其挟私攻讦',f:once(()=>{
        x.p.trust=clamp(x.p.trust-5);y.p.trust=clamp(y.p.trust+1);
        officialRecord(x.c,x.role,`参劾${y.p.name}，被斥“挟私攻讦”。`,{emotion:-.4});
        officialRecord(y.c,y.role,`遭${x.p.name}参劾，陛下斥参本者挟私攻讦。`,{emotion:.3});
        const delta=friendsBefore?-8:-6;
        kinCourtPalaceEcho(cast,delta,{actorLine:`${kinCourtKin(x)}${x.p.name}因参劾${fullName(y.c)}家受了斥责。她觉得陛下偏了心，对${cName(y.c)}更不服气。`,
          targetLine:`陛下替${kinCourtKin(y)}${y.p.name}说了话。她心中感念，对${fullName(x.c)}家却再难亲近。`});
        kinCourtNote(pair,cast,'impeach-rebuked',`参劾${y.p.name}，被斥挟私。`,delta);
        policyNudge(x.h.bloc||'kin',-2);
        return `朝中攻讦之风稍敛。${fx(chg({prestige:1}),cchg(x.c,{mood:-6}),cchg(y.c,{mood:4,aff:3}))}`;
      })}]};
}
function kinCourtEvent(){
  if(!kinCourtActive())return null;
  const st=kinCourtState();
  if(S.turn-(st.lastEvent??-99)<KIN_COURT_EVENT_GAP)return null;
  const pairs=kinCourtPairs().filter(pair=>S.turn-(st.pairs[pair.key]??-99)>=6);
  if(!pairs.length||!chance(.45))return null;
  const options=[];
  for(const pair of pairs){
    if(kinCourtFriendly(pair)){const cast=kinCourtCast(pair,{needFree:true,rest:6});if(cast)options.push({pair,cast,kind:'recommend',w:pair.cause==='palace-friend'?2:1});}
    else{const cast=kinCourtCast(pair,{needLapse:true,rest:6});if(cast)options.push({pair,cast,kind:'impeach',w:pair.cause==='palace-foe'?2:1});}
    // 本来交好的两家，若分属相争的两派且对方确有疏失，也可能起冲突。
    if(pair.cause==='palace-friend'&&kinCourtRival(houseOf(pair.a).bloc,houseOf(pair.b).bloc)){
      const cast=kinCourtCast(pair,{needLapse:true,rest:6});if(cast?.lapse?.grounded)options.push({pair,cast,kind:'impeach',w:.5});
    }
  }
  if(!options.length)return null;
  const chosen=pickW(options);
  return chosen.kind==='recommend'?kinCourtRecommendEvent(chosen.pair,chosen.cast):kinCourtImpeachEvent(chosen.pair,chosen.cast);
}
// 月末朝局结算后接着写同朝往来。
const kinCourtBaseTick=courtTick;
courtTick=function(...args){const result=kinCourtBaseTick.apply(this,args);kinCourtTick();return result;};

/* —— 官员表 —— */
function kinCourtTies(p){return (S.flags.kinCourt?.log||[]).filter(x=>x.from===p.id||x.to===p.id);}
const KIN_COURT_KIND={second:'附议',visit:'往来',criticize:'指摘',belittle:'讥讽',recommend:'举荐','recommend-held':'举荐留中','recommend-rebuked':'举荐受斥','impeach-proven':'参本属实','impeach-cleared':'参本不实','impeach-held':'参本留中','impeach-rebuked':'参本受斥'};
function kinCourtPanel(e){
  const ties=kinCourtTies(e.p).slice(-8).reverse();if(!ties.length)return '';
  const link=(key,id)=>{const other=officialEntry(key);return other&&other.p.id===id?officialLink(other.c,other.role):'';};
  return detailSection('同朝往来',`<ul class="story">${ties.map(t=>{const mine=t.from===e.p.id,otherKey=mine?t.toKey:t.fromKey,otherId=mine?t.to:t.from;
    return `<li class="${t.delta<0?'tie-foe':'tie-friend'}"><time>${esc(t.d)}</time><b>${esc(KIN_COURT_KIND[t.kind]||t.kind)}</b> · ${mine?'对':'来自'} ${link(otherKey,otherId)||'同僚'}：${esc(t.text)}</li>`;}).join('')}</ul>`);
}
function officialRowFamily(c){
  const members=paternalFamily(c).filter(x=>S.consorts.includes(x)&&!x.maid);
  const ids=new Set(members.map(x=>x.id));
  const kids=S.children.filter(k=>ids.has(k.mom)&&!k.removedFromRoyal).sort((a,b)=>a.born-b.born);
  return {members,kids};
}
function consortStatusTag(x){return !x.alive?'已故':x.gone?'出宫':x.cold?'冷宫':x.templeStay?'寺中':x.homeLeave?'省亲':'';}
const OFFICIAL_FILTERS=[['serving','在朝'],['all','全部'],['away','外任与奉差'],['gone','故去与获罪']];
function officialFilterMatch(p,filter){
  if(filter==='all')return true;
  if(filter==='gone')return !officialAlive(p)||p.exiled||p.dismissed;
  if(filter==='away')return officialAlive(p)&&!p.exiled&&!p.dismissed&&(p.away||p.commission||p.incognitoCase);
  return officialAlive(p)&&!p.exiled&&!p.dismissed&&!p.retired&&p.career!=='student';
}
function officialsTable(){
  const filter=OFFICIAL_FILTERS.some(([id])=>id===UI.officialsFilter)?UI.officialsFilter:'serving';
  const bloc=UI.officialsBloc||'all';
  const entries=officialEntries(),scholars=typeof scholarList==='function'?scholarList():[],blocs=[...new Set([...entries.map(e=>e.h.bloc||'none'),...(scholars.length?['civil']:[])])];
  const rows=entries.filter(e=>officialFilterMatch(e.p,filter)&&(bloc==='all'||(e.h.bloc||'none')===bloc))
    .sort((a,b)=>(officialAlive(b.p)-officialAlive(a.p))||((b.role==='father')-(a.role==='father'))||(b.p.merit-a.p.merit));
  const row=e=>{
    const {c,h,p,role,key}=e,{members,kids}=officialRowFamily(c),last=(p.story||[]).at(-1);
    const consorts=members.map(x=>{const tag=consortStatusTag(x);return `<button class="person-link" onclick="A.go('consort',${x.id})">${esc(cName(x))}的${esc(officialKinLabel(h,role,x))}${tag?'（'+tag+'）':''}</button>`;}).join('');
    const heirs=kids.map(k=>`<button class="person-link" onclick="A.go('kid',${k.id})">${esc(kidName(k))}${k.alive?'':'（已故）'}</button>`).join('')||'<span class="hint">—</span>';
    const deed=last?`${last.d} · ${last.t}`:'尚无记载';
    const cell=(label,html,cls='')=>`<td data-label="${label}"${cls?` class="${cls}"`:''}><div>${html}</div></td>`;
    return `<tr class="${officialAlive(p)?'':'deceased'}">${[
      cell('姓名',`<button class="person-link official-name" onclick="A.go('official','${key}')">${porImg(p,36)}<span>${esc(p.name)}</span></button><small>${p.age}岁 · ${esc(p.temperament||'')}</small>`),
      cell('官职',`${esc(p.office||p.post||'')}${p.honor?`<small>${esc(p.honor)}</small>`:''}`),
      cell('家族 · 宫中',`${esc(c.sur)}氏 · ${role==='father'?'家主':esc(officialKinLabel(h,role))}<div class="official-kin">${consorts||'<span class="hint">宫中无人</span>'}</div>`),
      cell('派系',`<span class="tag" style="border-color:${BLOC_COLOR[h.bloc]||'#999'}">${esc(blocName(h.bloc))}</span>`),
      cell('状态',officialStatus(p)),
      cell('才干/信任/功绩',`${rd(p.ability??0)} / ${rd(p.trust??0)} / ${rd(p.merit??0)}`,'official-nums'),
      cell('皇嗣',`<div class="official-kin">${heirs}</div>`),
      cell('近期事迹',`${esc(String(deed).slice(0,64))}${String(deed).length>64?'…':''}`,'official-deed')].join('')}</tr>`;
  };
  const chip=(id,label,current,action)=>`<button class="btn sm${current===id?' on':''}" aria-pressed="${current===id}" onclick="A.${action}('${id}')">${label}</button>`;
  // 科举出身的朝臣没有宫中亲眷，同表另列。
  const scholarRow=p=>{const cell=(label,html,cls='')=>`<td data-label="${label}"${cls?` class="${cls}"`:''}><div>${html}</div></td>`,last=(p.story||[]).at(-1),deed=last?`${last.d} · ${last.t}`:'尚无记载';
    return `<tr class="${officialAlive(p)?'':'deceased'}">${[cell('姓名',`<button class="person-link official-name" onclick="A.go('scholar','${p.id}')">${porImg(p,36)}<span>${esc(p.name)}</span></button><small>${p.age}岁 · ${esc(p.temperament||'')}</small>`),
      cell('官职',esc(p.office||'')),cell('家族 · 宫中',`${esc(p.origin||'')} · ${esc(p.examRank||'进士')}出身<div class="official-kin"><span class="hint">宫中无亲眷</span></div>`),
      cell('派系',`<span class="tag" style="border-color:${BLOC_COLOR.civil}">${blocName('civil')}</span>`),cell('状态',officialStatus(p)),
      cell('才干/信任/功绩',`${rd(p.ability??0)} / ${rd(p.trust??0)} / ${rd(p.merit??0)}`,'official-nums'),cell('皇嗣','<span class="hint">—</span>'),
      cell('近期事迹',`${esc(deed.slice(0,64))}${deed.length>64?'…':''}`,'official-deed')].join('')}</tr>`;};
  const scholarRows=scholars.filter(p=>officialFilterMatch(p,filter)&&(bloc==='all'||bloc==='civil'));
  const counts={serving:entries.filter(e=>officialFilterMatch(e.p,'serving')).length+scholars.filter(p=>officialFilterMatch(p,'serving')).length,gone:entries.filter(e=>officialFilterMatch(e.p,'gone')).length+scholars.filter(p=>officialFilterMatch(p,'gone')).length};
  return `${pageBackButton('officials','home')}<h2>官员表</h2><p class="hint">在朝官员出自妃嫔娘家或科举。同父姐妹共用父兄履历。点姓名看履历，点妃嫔或皇嗣可直接跳转。在朝 ${counts.serving} 人，故去与获罪 ${counts.gone} 人。</p>
    <div class="acts official-filters">${OFFICIAL_FILTERS.map(([id,l])=>chip(id,l,filter,'officialsFilter')).join('')}</div>
    <div class="acts official-filters">${chip('all','全部派系',bloc,'officialsBloc')}${blocs.map(id=>chip(id,id==='none'?'无所依附':blocName(id),bloc,'officialsBloc')).join('')}</div>
    ${rows.length+scholarRows.length?`<div class="official-table-wrap"><table class="official-table"><thead><tr><th>姓名</th><th>官职</th><th>家族 · 宫中</th><th>派系</th><th>状态</th><th>才干/信任/功绩</th><th>皇嗣</th><th>近期事迹</th></tr></thead><tbody>${rows.map(row).join('')}${scholarRows.map(scholarRow).join('')}</tbody></table></div>`:'<p class="hint">没有符合条件的官员。</p>'}`;
}
A.officialsFilter=function(id){if(!OFFICIAL_FILTERS.some(([x])=>x===id))return;UI.officialsFilter=id;render();};
A.officialsBloc=function(id){UI.officialsBloc=String(id||'all');render();};
