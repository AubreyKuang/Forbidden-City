/* Birth batches are saved before naming so reloading never loses a sibling or rerolls a result. */
const BIRTH_OMENS={
  red:{name:'赤霞映阙',text:'皇嗣啼哭之际，天边赤霞忽然映红了殿窗，宫人将这一幕记入诞生簿。',stat:'hp',label:'体魄',bonus:6},
  star:{name:'文星流彩',text:'诞生之夜，一道流星划过文渊阁上空，值夜的宫人说像一笔银色的墨痕。',stat:'lit',label:'才学',bonus:6},
  rainbow:{name:'长虹贯庭',text:'雨歇时天边横起一道长虹，第一声啼哭恰在此时传出，庭中宫人纷纷抬头。',stat:'mar',label:'武艺',bonus:6}
};
function rollBirthCount(roll=R()){return roll<.001?3:roll<.021?2:1}
function birthType(sexes){return sexes.length===3?'三胞胎':sexes.length===2?(sexes[0]===sexes[1]?'双胞胎':'龙凤胎'):''}
function applyBirthOmen(k,id){
  if(k.birthOmen||!BIRTH_OMENS[id])return;
  if(journalContentVersion()>=29){k.birthOmen=id;k.birthOmenYear=0;const omen=BIRTH_OMENS[id];kstory(k,`【${omen.name}】${omen.text}自周岁起，${birthOmenEffect(omen)}。`);return;}
  const omen=BIRTH_OMENS[id];k.birthOmen=id;k[omen.stat]=clamp(k[omen.stat]+omen.bonus);
  if(k.birthTraits)k.birthTraits.initial[omen.stat]=k[omen.stat];
  kstory(k,`【${omen.name}】${omen.text}出生时${omen.label}+${omen.bonus}。`);
}
function birthOmenEffect(omen){return `每年${omen.label}${omen.bonus>=0?'+':''}${omen.bonus}`;}
function annualBirthOmenTick(){
  if(journalContentVersion()<29)return;
  for(const k of S.children){
    const omen=BIRTH_OMENS[k.birthOmen],months=S.turn-k.born,age=Math.floor(months/12);
    if(!k.alive||k.pendingName||!omen||!Number.isInteger(months)||months<12||months%12!==0||k.birthOmenYear>=age)continue;
    const before=k[omen.stat];k[omen.stat]=clamp(before+omen.bonus);k.birthOmenYear=age;
    const change=rd(k[omen.stat]-before);
    kstory(k,`【禀赋岁记 · ${omen.name}】${age}岁生辰，${omen.label}${change>=0?'+':''}${change}（${rd(before)}→${rd(k[omen.stat])}）。${change===0?'已达属性边界，本年数值未再改变。':''}`);
  }
}
function birthTags(k){
  const omen=BIRTH_OMENS[k.birthOmen];
  const effect=omen&&(journalContentVersion()>=29?birthOmenEffect(omen):`${omen.label}+${omen.bonus}`);
  return `${immortalTags(k)}${multipleBadge(k)}${omen?`<span class="tag y" title="${journalContentVersion()>=29?'周岁起，每逢生辰结算一次；属性范围0—100。':'出生时'+effect}">${omen.name} · ${effect}</span>`:''}${k.birthTrouble?`<span class="tag">${esc({frail:'初生体弱',quake:'出生时地动',drought:'出生逢旱'}[k.birthTrouble])}</span>`:''}`;
}
function deliveryKids(c){return (c.delivery?.children||[]).map(kidById).filter(Boolean)}
function pendingDelivery(){return S.consorts.find(c=>c.delivery&&!c.delivery.settled&&(c.delivery.lossPending||deliveryKids(c).some(k=>k.pendingName)))}
function gouyiBirthBlessing(c){return journalContentVersion()>=24&&!!c?.gouyi;}
function birthOmenChance(c){return gouyiBirthBlessing(c)?(journalContentVersion()>=25?.8:.6):.03;}
function birthEvent(c){
  if(c.delivery&&!c.delivery.settled)return birthNamingEvent(c);
  if(c.preg<(c.pregnancyCalendar?.term||10))return null;
  if(concealedPregnancy(c))return concealedDeliveryEvent(c);
  const count=rollBirthCount(),sexes=Array.from({length:count},()=>chance(.5)?'m':'f');
  const kind=birthType(sexes),omen=chance(birthOmenChance(c))?pick(Object.keys(BIRTH_OMENS)):null;
  const children=sexes.map(sex=>makeKid(c,sex,suggestName(sex)));
  registerMultipleBirth(children);
  const prayerKey=currentPregnancyPrayer(c)?.key,firstWishKey=careersActive()&&c.firstChildWish?.key===pregnancyPrayerKey(c)?c.firstChildWish.key:null;
  delete c.pregnancyFather;delete c.pregnancyCalendar;
  c.delivery={children:children.map(k=>k.id),kind,omen,date:dateStr(),turn:S.turn,...(prayerKey?{prayerKey}:{}),...(firstWishKey?{firstWishKey}:{}),settled:false,
    difficult:chance(c.trait==='体弱'?.12:.03),originalLoss:count===1&&!!c.swapPlot&&!c.swapPlot.settled&&chance(.02),swap:false,templeAdvice:rollBirthTempleAdvice(children,omen)};
  c.preg=0;c.prot=false;c.swapRisk=false;c.lastBirth=S.turn+1;
  children.forEach((k,i)=>{
    k.pendingName=true;k.birthOrder=i+1;
    if(kind){k.birthType=kind;k.birthGroup=children[0].id;}
    kstory(k,`降生于${c.palace}，生母${k.momName}${kind?`，${multipleIdentity(k).name}，${['先降生','随后降生','最后降生'][i]}`:''}。`);
    if(omen)applyBirthOmen(k,omen);
  });
  settleBirthSwap(c,children[0]);
  if(children[0].birthSwap?.occurred)c.delivery.omen=null;
  if(c.delivery.originalLoss&&!children[0].birthSwap?.occurred){
    const k=children[0];k.alive=false;k.pendingName=false;k.name='未命名';k.deathReason='出生时已无生息';delete k.birthOmen;delete k.birthTrouble;
    c.delivery.lossPending=true;c.delivery.omen=null;c.delivery.templeAdvice=null;
  }
  return birthNamingEvent(c);
}
function birthNamingEvent(c){
  if(c.delivery?.lossPending)return birthLossEvent(c);
  const children=deliveryKids(c),k=children.find(k=>k.pendingName);if(!k)return null;
  const kind=c.delivery.kind,identity=multipleIdentity(k),omen=BIRTH_OMENS[c.delivery.omen];
  const report=kind?`${cName(c)}于${c.palace}诞下${cnNum(children.length)}位皇嗣，${identity?.detail||kind}，宫人贺作“${identity?.name||kind}”。`:
    c.delivery.concealedLoss?`${c.palace}报来喜讯，称${cName(c)}诞下一位小皇子，请陛下赐名。`:`${cName(c)}于${c.palace}临盆，阵痛一日一夜，诞下一位${k.sex==='m'?'小皇子':'小公主'}。`;
  return {title:identity?.name||kind||'弄璋弄瓦',por:c,cast:children,sfx:'joy',
    text:`${report}${omen?`\n${omen.text}\n§${omen.name}：本胎皇嗣${journalContentVersion()>=29?'自周岁起，'+birthOmenEffect(omen):'出生时'+omen.label+'+'+omen.bonus}`:''}\n${kind?`请为${['先降生','随后降生','最后降生'][k.birthOrder-1]||'这位'}的${k.sex==='m'?'小皇子':'小公主'}赐名`:'请陛下赐名'}（不含姓氏）：`,
    input:{def:k.name,max:3},choices:[{t:'赐名',f:value=>{
      if(!k.pendingName)return null;
      const name=(value||k.name).trim().slice(0,3)||k.name;
      if(S.children.some(other=>other!==k&&other.name===name)){
        pushNow(birthNamingEvent(c));return '已有皇嗣使用这个名字，请另赐一名。';
      }
      k.name=name;k.pendingName=false;kstory(k,`陛下赐名“${name}”。`);
      if(children.some(child=>child.pendingName)){
        pushNow(birthNamingEvent(c));save('auto');
        return {text:`${kidName(k)}，${E().sur}${name}。接下来为另一位孩子赐名。`,por:k};
      }
      const result=finishDelivery(c);save('auto');return {text:result,por:children.length===1?k:undefined};
    }}]};
}
function birthLossEvent(c){
  if(!c.delivery?.lossPending||c.delivery.settled)return null;
  const k=deliveryKids(c)[0];return {title:'产房哀讯',por:c,sfx:'sad',valid:()=>!!c.delivery?.lossPending&&!c.delivery.settled,
    text:`医官回报，${fullName(c)}产下的孩子出生时已无生息。${c.delivery.difficult?'产妇又因血崩未能挺过，太医回天乏术。':''}接生与出入记录已经核对，此事并非她的过错。`,choices:[{t:c.delivery.difficult?'按礼安葬母子':'妥善安葬，命太医照看她',f:()=>{
      if(c.delivery.settled)return null;c.delivery.settled=true;c.delivery.lossPending=false;
      const line=c.delivery.difficult?'亲生孩子出生时已无生息，产妇又因血崩薨逝，母子按礼安葬。':'亲生孩子出生时已无生息，按礼安葬，命太医照看产妇。';kstory(k,line);log(`${fullName(c)}产房传来哀讯，孩子未能存活。`,1);
      if(c.delivery.difficult){c.alive=false;c.deathReason='产后血崩';log(`${fullName(c)}因产后血崩薨逝。`,1);}else{setXin(c,'悲恸','初生孩子夭折');cchg(c,{mood:-25});}recordDeliveryOutcome(c,{loss:true});save('auto');return line;
    }}]};
}
function finishDelivery(c){
  const delivery=c.delivery;if(!delivery||delivery.settled)return '';
  const children=deliveryKids(c);if(children.some(k=>k.pendingName))return '';
  delivery.settled=true;deepen(c);
  if(c.wish==='child'&&!c.wishDone){c.wishDone=true;c.wishKnown=true;}
  remember(c,'child',delivery.concealedLoss?'报来的孩子获赐名入册':delivery.kind?`诞下${delivery.kind}`:'生下孩子');
  const names=children.map(k=>kidName(k)).join('、');
  let effect=chg({prestige:children.some(k=>k.sex==='m')?4:2}),text=`${names}，均已赐名。`;
  if(delivery.difficult){
    c.alive=false;c.deathReason='产后血崩';log(`${fullName(c)}诞下${names}后因产后血崩薨逝。`,1);AU.sfx('sad');
    children.forEach(k=>kstory(k,`生母${k.momName}生产后因血崩薨逝。`));text+=`\n然而产后血崩，${fullName(c)}没能挺过那个夜晚。`;
  }else{
    setXin(c,'欢喜',delivery.concealedLoss?'报喜获赐名':'诞下皇嗣');log(`${delivery.concealedLoss?'宫中报称':''}${fullName(c)}诞下${names}${delivery.kind?`（${delivery.kind}）`:''}。`,1);
    effect+='　'+cchg(c,{mood:25,aff:10,favor:8});
  }
  recordDeliveryOutcome(c);
  const follow=[],kinCare=!c.alive?maternalKinCareEvent(c):null;
  if(kinCare)follow.push(kinCare);
  if(delivery.swap)follow.push(swapEvent(c,children[0]));
  const batchCare=children.filter(k=>k.alive).length>1&&!kinCare&&(!c.alive||c.maid||c.rank<=1);
  if(batchCare){delivery.carePlan={created:S.turn,closed:false};follow.push(birthCareEvent(c));}
  for(const k of children){
    if(!k.alive)continue;
    if(!batchCare&&!c.alive&&!kinCare)follow.push(fosterOffer(k,'孩子的生母已经不在了。'));
    else if(!batchCare&&c.alive&&(c.maid||c.rank<=1))follow.push(fosterOffer(k,`${kidName(k)}的生母只是${c.maid?'宫女':RANKS[c.rank]}。`));
    if(k.parentage)follow.push(parentageInquiryEvent(k));
  }
  if(delivery.templeAdvice){const advice=birthTempleAdviceEvent(kidById(delivery.templeAdvice));if(advice)follow.push(advice);}
  text+=pregnancyPrayerBirthEcho(c,children);
  Q.unshift(...follow);return text+(delivery.kind?'\n孩子们的档案中已记下同生手足，可听国师贺生，日后也能看他们一起长大的故事。':'')+fx(effect);
}
/* A historical fact belongs in the mother's own chronicle even after death.
   It must not go through participant-memory helpers, which skip the deceased. */
function recordDeliveryOutcome(c,{loss=false,date,legacy=false}={}){
 const d=c.delivery;if(!d?.settled||d.outcome)return;
 const children=deliveryKids(c),fatal=!!d.difficult&&!c.alive;
 if(!children.length)return;
 const birthDate=date||d.date||dateStr(),names=children.map(k=>({id:k.id,name:k.name,sex:k.sex}));
 const label=children.map(k=>`${k.sex==='m'?'皇子':'公主'}${k.name==='未命名'?'（未及赐名）':k.name}`).join('、');
 const text=`${fullName(c)}${d.concealedLoss?'被宫中报称生产，':'于'+(c.palace||'宫中')+'临盆，'}${loss?'产下的孩子出生时已无生息':`诞下${label}${d.kind?`（${d.kind}）`:''}，${children.length>1?'孩子们分别':'孩子'}获陛下赐名`}。${fatal?'生产后突发血崩，太医救治无效，撒手人寰，因产后血崩薨逝。':loss?'按礼安葬孩子，太医继续照看产妇。':d.concealedLoss?'报喜与赐名已入册，亲缘仍以查证结果为准。':'产后平安，继续调养。'}${gouyiBirthBlessing(c)&&!loss&&BIRTH_OMENS[d.omen]?`诞生时见「${BIRTH_OMENS[d.omen].name}」，与孩子的诞生纪事一同记下。`:''}`;
 d.outcome={date:birthDate,children:names,kind:d.kind||'单胎',loss,fatal,cause:fatal?'产后血崩':null,text};
 if(fatal){c.deathReason='产后血崩';c.deathRecord={date:birthDate,cause:'产后血崩',text,children:names};}
 // An older build may already have the shorter line. Enrich it in place.
 const old=legacy&&(c.story||[]).find(s=>/血崩/.test(s.t)&&/薨|撒手人寰/.test(s.t));
 const entry=old||{d:birthDate,t:text};entry.t=text;entry.birthOutcome=d.outcome;
 if(!old){c.story||=[];if(legacy){const same=c.story.findLastIndex(s=>s.d===birthDate);if(same>=0)c.story.splice(same+1,0,entry);else c.story.push(entry);}else c.story.push(entry);}
}
function repairDeliveryChronicle(c){
 const d=c.delivery;if(c.alive||!d?.settled||!d.difficult||d.outcome||!deliveryKids(c).length)return;
 const own=(c.story||[]).find(s=>/血崩/.test(s.t)&&/薨|撒手人寰/.test(s.t));
 const logged=S.log?.find(s=>s.t.includes(fullName(c))&&/诞下|产后血崩/.test(s.t)&&/薨|撒手人寰/.test(s.t));
 const first=deliveryKids(c)[0],born=first.story?.find(s=>/降生于|产房报称/.test(s.t));
 recordDeliveryOutcome(c,{loss:!!d.originalLoss&&!d.swap,date:own?.d||logged?.d||d.date||born?.d||'旧档 · 日期未详',legacy:true});
}
function deliveryMemorialPanel(c){
 if(c.alive||!c.deathRecord)return '';
 const d=c.deathRecord;
 return detailSection('终事 · 生产与离世',`<p><strong>${esc(d.date)} · ${esc(d.cause)}</strong></p><p>${esc(d.text)}</p><div class="acts">${d.children.filter(p=>kidById(p.id)).map(p=>`<button class="btn sm" onclick="A.go('kid',${p.id})">查看${esc(p.name)}的经历</button>`).join('')}</div>`);
}
function rollBirthTempleAdvice(children,omen){
  if(omen||S.turn-(S.flags.lastBirthTempleAdvice??-99)<36)return null;
  const frail=children.find(k=>k.hp<=60),blessed=children.some(k=>gouyiBirthBlessing(byId(k.mom))),kind=frail&&chance(.3)?'frail':!blessed&&chance(.01)?pick(['quake','drought']):null;
  if(!kind)return null;
  const k=frail&&kind==='frail'?frail:children[0];k.birthTrouble=kind;S.flags.lastBirthTempleAdvice=S.turn;
  const text={frail:'初生体弱，太医叮嘱仔细养护。',quake:'出生当夜京畿地动，宫人议论纷纷。',drought:'出生时京畿久旱，宫中有人将灾异附会于新生儿。'}[kind];
  kstory(k,text);return k.id;
}
function birthTempleAdviceEvent(k){
  if(!k?.alive||!k.birthTrouble||k.templeAdviceHandled)return null;
  const mother=byId(k.mom),valid=()=>k.alive&&!k.templeAdviceHandled;
  const settle=text=>{k.templeAdviceHandled=true;kstory(k,text);if(mother?.alive)story(mother,text);log(text);save('auto');return text;};
  return {title:'国师请祈福',cast:[mother,k],valid,
    text:`${k.birthTrouble==='frail'?`${k.name}初生体弱，太医正在照料。`:`${k.name}出生${k.birthTrouble==='quake'?'当夜京畿地动':'时恰逢京畿久旱'}，国师将灾异与孩子的降生相提并论。`}\n国师请将孩子送到护国寺祈福。太医则说，调养与照护不可中断；灾异之说也不能当作孩子有罪的凭据。\n若送寺，乳母与太医随行，住寺旁客舍，不作剃度。生母会惦念远方的孩子。`,choices:[
      {t:'送护国寺养护半年，乳母与太医同往 · 国库−10',cond:()=>E().treasury>=10&&templeEligible(k),f:()=>{
        if(!valid()||E().treasury<10||!sendChildToTemple(k,{months:6}))return null;chg({treasury:-10});
        return settle(`${k.name}赴护国寺养护半年，乳母与太医随行。生母留宫，心中牵挂。`);
      }},
      {t:'留在母亲身边，另请太医照料 · 国库−10',cond:()=>E().treasury>=10,f:()=>{
        if(!valid()||E().treasury<10)return null;chg({treasury:-10});k.hp=clamp(k.hp+4);if(mother?.alive)cchg(mother,{mood:8});
        return settle(`${k.name}留在宫中，太医增派照护；陛下未因灾异责罚孩子。`);
      }},
      {t:'不以灾异罪婴儿，按原安排照料',f:()=>{
        if(!valid())return null;chg({prestige:1});if(mother?.alive)cchg(mother,{mood:5,aff:3});
        return settle(`陛下驳回灾异之说，${k.name}仍按原安排照料。`);
      }}]};
}
A.resumeBirth=function(id){const c=byId(id);if(c?.delivery&&!c.delivery.settled)pushEv(birthNamingEvent(c));};
function pendingBirthPanel(){
  const c=pendingDelivery();return c?`<p class="hint">${esc(fullName(c))}${c.delivery.lossPending?'的产房消息尚待处理':'新生的皇嗣尚待赐名'}。</p><button class="btn gold" onclick="A.resumeBirth(${c.id})">${c.delivery.lossPending?'处理产房消息':'继续赐名'}</button>`:'';
}
