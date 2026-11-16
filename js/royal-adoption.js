const royalAdoptionStoriesActive=()=>journalContentVersion()>=60;
const adoptionLiving=p=>!!p&&p.alive!==false&&!p.gone;
function adoptedPrinceChildren(){
  return royalHouseholds().flatMap(k=>k.household?.children||[]).filter(c=>c.princeAdoption);
}
function princeAdoptionFamily(son){
  const adoptive=royalById(son.princeAdoption.family),birth=princeBiologicalParents(son);
  return {adoptive,birthFather:birth.father,birthMother:birth.mother};
}
function princeAdoptionContactMode(son,family){
  const {adoptive,birthFather,birthMother}=family;
  if(!adoptionLiving(son)||!adoptive||son.jailed||son.templeStay||immortalAway(son)||(!adoptionLiving(birthFather)&&!adoptionLiving(birthMother)))return '';
  const resident=son.princelySuccession?son:adoptive;
  const knownPlace=k=>k.away?princeFief(k):k.templeStay||immortalAway(k)?'':'京城';
  const same=birthFather&&knownPlace(resident)&&knownPlace(resident)===knownPlace(birthFather);
  return same&&!birthFather.jailed&&(adoptionLiving(birthFather)||adoptionLiving(birthMother)&&!birthMother.away)?'visit':'letter';
}
function princeAdoptionContactPanel(k){
  if(!royalAdoptionStoriesActive())return '';
  const children=k.princeAdoption?[k]:princeFamilyChildren(k).filter(c=>c.princeAdoption?.family===k.id);
  const rows=children.filter(adoptionLiving).map(son=>{
    const family=princeAdoptionFamily(son),mode=princeAdoptionContactMode(son,family),contact=son.princeAdoption.contact;
    const args=`${royalActionArg(k.id)},${royalActionArg(son.id)}`,months=Math.max(0,(contact?.last??-99)+4-S.turn);
    if(contact?.reply?.unread)return `<p>${esc(son.name)}的家书已有回音。 <button class="btn sm jade" onclick="A.princeAdoptionReply(${args})">读生家回信</button></p>`;
    if(contact?.pending)return `<p>${esc(son.name)}的家书已送出，等候回信。</p>`;
    if(!mode)return '';
    return `<p>${esc(son.name)} <button class="btn sm jade" onclick="A.princeAdoptionContact(${args})" ${months||S.over?'disabled':''}>${mode==='visit'?'回生家探望':'给生父母寄家书'}${months?`<small>还需 ${months} 个月</small>`:''}</button></p>`;
  }).join('');
  return detailSection('与生家往来',rows);
}
function linkedAdoptedPrince(ownerId,sonId){
  const owner=princeEstateById(ownerId);
  if(!owner)return null;
  if(owner.id===sonId&&owner.princeAdoption)return owner;
  return princeFamilyChildren(owner).find(c=>c.id===sonId&&c.princeAdoption?.family===ownerId);
}
function princeAdoptionContactRecord(son,family,mode,topic){
  const {adoptive,birthFather,birthMother}=family;
  const visit=mode==='visit',title=visit?'回生家探望':'生家回信';
  const young=kidAge(son)<6;
  const news=young?'随侍说起他如今的饮食和睡觉习惯。':topic==='home'?'他谈起熟悉的旧院和从小听惯的话。':'他提起在嗣府的读书和起居，托两边都安心。';
  const father=adoptionLiving(birthFather),mother=adoptionLiving(birthMother)&&(!visit||!birthMother.away);
  const fatherWords=father?(birthFather.amb>=65?'他听孩子说完，提醒他守住新府的分寸，得空仍可回来。':'他先问孩子近来过得可好，再说两个家里都惦记他。'):'';
  const motherWords=mother?(birthMother.marriageNature?.temperament==='沉静'?'她没有多问，只说小时候惯用的那方砚还替他留着。':'她一连问了几件衣食小事，最后嘱咐他别把自己累着。'):'';
  const lead=visit?`${son.name}在随侍陪同下回生家问安。`:`${son.name}读到生家寄回的家书。`;
  const text=`${lead}${father||mother?news+[fatherWords,motherWords].filter(Boolean).join(''):'两位亲人近来都已无法收信，使者将原信带了回来。'}`;
  princePersonNote(son,`【${title}】${text}`);
  if(father)princePersonNote(birthFather,`【嗣子问安】${visit?'见到':'读到来信，知道'}${son.name}在嗣府的近况。${fatherWords}`);
  if(mother)princePersonNote(birthMother,`【亲儿问安】${son.name}${visit?'回来看望':'寄信来了'}。${motherWords}`);
  if(adoptionLiving(adoptive)){
    princePersonNote(adoptive,`【嗣子与生家往来】${son.name}${visit?'探亲归来':'收到生家回信'}。${adoptive.amb>=65?'他愿孩子问安，也叮嘱往来记在府册里，遇到要紧府务先回报。':'他请孩子慢慢说完，还让长史记下下次捎问候的日子。'}`);
  }
  if(adoptionLiving(adoptive?.spouse)){
    princePersonNote(adoptive.spouse,`【嗣子与生家往来】${son.name}${visit?'从生家回来':'收到生家回信'}。${adoptive.spouse.marriageNature?.temperament==='敏感'?'她起先怕孩子心里两难，听他说起也挂念嗣府，便替他将旧信一并收好。':'她替孩子把两家问候记在一张笺上，下回得便可一同捎去。'}`);
  }
  log(`【${title}】${lead}`);return text;
}
A.princeAdoptionContact=function(ownerId,sonId){
  if(!royalAdoptionStoriesActive()||modalOpen||S.over)return;
  const son=linkedAdoptedPrince(ownerId,sonId);if(!son)return;
  const family=princeAdoptionFamily(son),mode=princeAdoptionContactMode(son,family);
  const valid=()=>{
    const c=son.princeAdoption.contact;
    return !S.over&&linkedAdoptedPrince(ownerId,sonId)===son&&princeAdoptionContactMode(son,family)===mode&&S.turn-(c?.last??-99)>=4&&!c?.pending&&!c?.reply?.unread;
  };
  if(!mode||!valid())return;
  const visit=mode==='visit',finish=topic=>()=>{
    if(!valid())return null;
    const contact=son.princeAdoption.contact||={};contact.last=S.turn;
    if(visit)return princeAdoptionContactRecord(son,family,mode,topic);
    contact.pending={due:S.turn+1,topic};
    const line=kidAge(son)<6?`长史代${son.name}写下给生家的问安信，由使者送出，约下月有回音。`:`${son.name}把给生家的家书交给使者，约下月有回音。`;
    princePersonNote(son,`【寄生家书】${line}`);log(`【寄生家书】${line}`);return line;
  };
  pushEv({title:visit?'嗣子回生家探望':'嗣子 · 寄生家书',por:son,valid,
    text:visit?`${son.name}想亲自回去问候生家。两府在同一处，可以由随侍陪同。`:`${son.name}与生家相隔两地，想把近况写成家书。`,
    choices:[{t:visit?'准回生家叙旧':'写信问候生家',f:finish('home')},{t:visit?'准探望并说说嗣府近况':'写信说说嗣府近况',f:finish('well')},{t:'改日再议'}]});
};
A.princeAdoptionReply=function(ownerId,sonId){
  if(!royalAdoptionStoriesActive()||modalOpen||S.over)return;
  const son=linkedAdoptedPrince(ownerId,sonId),reply=son?.princeAdoption.contact?.reply;
  if(reply?.unread)pushEv({title:'嗣子 · 生家回信',por:son,text:reply.text,choices:[{t:'收好回信',f:()=>{reply.unread=false;return null;}}]});
};
function princeAdoptionContactTick(){
  if(!royalAdoptionStoriesActive())return;
  for(const son of adoptedPrinceChildren()){
    const contact=son.princeAdoption.contact,pending=contact?.pending;
    if(!pending||S.turn<pending.due)continue;
    delete contact.pending;
    if(!adoptionLiving(son))continue;
    contact.reply={unread:true,text:princeAdoptionContactRecord(son,princeAdoptionFamily(son),'letter',pending.topic)};
  }
}

const palaceNeedsSon=()=>!S.children.some(k=>k.sex==='m'&&k.alive&&!k.lost&&!k.removedFromRoyal);
function availableRoyalWards(){
  return royalHouseholds().filter(k=>!k.princeAdoptionOrigin&&!k.removedFromRoyal).flatMap(father=>
    (father.household?.children||[]).filter(child=>adoptionLiving(child)&&kidAge(child)>=0&&kidAge(child)<15&&
      !child.princeAdoption&&!child.princelySuccession&&princeSuccessionState(father)?.heir!==child.id)
      .map(child=>({father,child,mother:princeSonMother(father,child)})));
}
const royalWardGuardian=({father,mother})=>[mother,father.spouse,...father.household?.concubines||[]].find(adoptionLiving);
const royalWardNeedsCare=({father})=>!father.alive&&!princeResidentChildren(father).some(c=>adoptionLiving(c)&&kidAge(c)>=15);
function palaceWardPending(){
  const pending=S.flags.palaceWard;
  return pending&&availableRoyalWards().find(r=>r.father.id===pending.father&&r.child.id===pending.child&&royalWardNeedsCare(r));
}
function takeRoyalWard({father,child,mother},petition){
  const original=child.name,originalId=child.id,queen=empress(),care=inPalace(queen)?queen:null;
  const orphan=petition&&!royalWardGuardian({father,mother});
  father.household.children=father.household.children.filter(c=>c!==child);
  Object.assign(child,{id:S.nid++,name:child.given||child.name,mom:null,momName:mother?.name||child.motherName||'未记载',foster:care?.id||null,
    ord:S.children.filter(k=>k.sex===child.sex).length+1,birthMonth:((S.month-1-(S.turn-child.born)%12+12)%12)+1,
    policy:'均衡',love:50,sup:0,adult:false,tutor:false,pendingName:false,title:'',palaceAdoption:{father:father.id,fatherName:father.name,motherId:mother?.id,motherName:mother?.name||child.motherName,original,originalId,at:S.turn,orphan}});
  delete child.courtGuest;
  S.children.push(child);ensureChildDisposition(child);initKidRel(child);
  (father.palaceAdoptedChildren||=[]).push(child.id);
  if(S.flags.palaceWard?.child===originalId)delete S.flags.palaceWard;
  const line=`【宗亲入继】${original}${orphan?'失怙且府中无人能照料，奉旨':'奉旨'}接入宫中，列入皇嗣。${care?`交${cName(care)}抚养。`:'由宫中乳母与随侍照护。'}`;
  princePersonNote(child,`${line}原有的生父母与在府中的往事继续留在纪事里。`);
  princePersonNote(father,father.alive?`${line}他送别孩子，仍盼日后有机会问安。`:line);
  if(adoptionLiving(mother))princePersonNote(mother,`${line}她仔细交代孩子的起居，也将临别的话留在家书里。`);
  if(care)princePersonNote(care,`${line}她先问孩子习惯怎样睡、喜欢吃什么，告诉他日后想念家里可以说出来。`);
  log(line,1);UI.view='kid';UI.sel=child.id;return line;
}
function palaceWardEvent(candidates,orphan=false){
  const valid=()=>!S.over&&(orphan||palaceNeedsSon())&&availableRoyalWards().some(r=>candidates.some(c=>c.child===r.child)&&(!orphan||royalWardNeedsCare(r)));
  if(!valid())return null;
  const ward=candidates[0],guardian=orphan&&royalWardGuardian(ward);
  return {title:orphan?'宗人府 · 宗亲遗孤':'宗人府 · 议请入继',valid,cast:orphan?[candidates[0].child]:[],
    text:orphan?`宗人府递来讣册。${ward.father.name}已故。${guardian?`${guardian.name}来信说，府中没有成年的同辈能帮衬，想请宫中接${ward.child.name}去抚养。`:`府中无人能接手照料${ward.child.name}，宗人府请旨接进宫中照看。`}`:'宫中没有在世皇子，宗人府呈上宗亲府中尚未成年、没有承袭安排的男孩名册。',
    choices:[...candidates.map(r=>({t:`接${r.child.name}入宫${orphan?'抚养并入继':'并入继'}`,person:r.child,f:()=>{
      if(!valid()||!availableRoyalWards().some(x=>x.child===r.child&&x.father===r.father)||orphan&&!royalWardNeedsCare(r))return null;
      return takeRoyalWard(r,orphan);
    }})),{t:orphan?'先由宗人府留意，改日再议':'暂缓，孩子先留在原家'}]};
}
A.palaceWard=function(orphan=false){
  if(!royalAdoptionStoriesActive()||modalOpen||S.over)return;
  const pending=orphan&&palaceWardPending();
  if(orphan&&!pending)return;
  pushEv(palaceWardEvent(orphan?[pending]:availableRoyalWards().filter(r=>r.child.sex==='m'),orphan));
};
function palaceOrphanEvent(){
  if(!royalAdoptionStoriesActive()||S.over||palaceWardPending()||S.turn-(S.flags.lastPalaceWard??-99)<12)return null;
  const possibilities=availableRoyalWards().filter(royalWardNeedsCare);
  if(!possibilities.length||!chance(S.gen>=3?.08:.025))return null;
  const unattended=possibilities.filter(r=>!royalWardGuardian(r));
  const ward=pick(unattended.length?unattended:possibilities),ev=palaceWardEvent([ward],true);
  if(ev)ev.onQueue=()=>{
    S.flags.lastPalaceWard=S.turn;S.flags.palaceWard={father:ward.father.id,child:ward.child.id};
    log(`宗人府奏报${ward.father.name}府中遗孤${ward.child.name}需要安顿。`);
  };
  return ev;
}
function palaceAdoptionPanel(){
  if(!royalAdoptionStoriesActive()||S.over)return '';
  const options=palaceNeedsSon()&&availableRoyalWards().some(r=>r.child.sex==='m');
  const pending=palaceWardPending();
  return detailSection('宗亲入继',`${options?'<button class="btn jade" onclick="A.palaceWard()">议请过继皇子</button>':''}${pending?'<button class="btn gold" onclick="A.palaceWard(true)">查看宗亲遗孤奏报</button>':''}`);
}
function palaceAdoptionOriginPanel(k){
  const from=k.palaceAdoption;if(!from||!royalAdoptionStoriesActive())return '';
  return detailSection('宗亲出身',`<p>原名 ${esc(from.original)} · 生父 ${esc(from.fatherName)} · 生母 ${esc(from.motherName||'未记载')}</p><p>由宗亲府邸入继宫中${from.orphan?'，宗人府曾呈报无人照料':''}。</p>`);
}
function palaceAdoptionFamilyLinks(k){
  if(!royalAdoptionStoriesActive())return '';
  return (k.palaceAdoptedChildren||[]).map(royalById).filter(Boolean).map(c=>
    `<p><button class="person-link" onclick="A.go('${S.children.includes(c)?'kid':'relative'}',${royalActionArg(c.id)})">${esc(c.name)}</button> · 已入继宫中</p>`).join('');
}
