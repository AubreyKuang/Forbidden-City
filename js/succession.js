/* Keep identities, families and portraits when the point of view changes reign. */
const ROYAL_KIN_PER_REIGN=10;
function dowagerPerson(d){
  // Rendering must never overwrite a predecessor's saved appearance or roll RNG.
  let portrait=d?.portrait;
  if(!portrait&&d?.personId!=null){
    const previous=(S?.retainedFamilies||[]).find(c=>c.id===d.personId)||
      [...(S?.previousCourts||[])].reverse().flatMap(court=>court.consorts||[]).find(c=>c.id===d.personId)||
      (S?.consorts||[]).find(c=>c.id===d.personId);
    if(previous)portrait={...previous,portraitOverride:portraitCell(previous),rank:8};
  }
  if(!portrait){
    const seed=Number.isFinite(d?.seed)?d.seed:Number.isFinite(S?.emp?.seed)?S.emp.seed:91;
    const explicit=d?.portraitOverride??d?.artPortrait;
    const inherited=d?.personId!=null||(S?.gen||1)>1;
    portrait={isMom:true,seed,portraitOverride:Number.isInteger(explicit)&&explicit>=0&&explicit<PORTRAIT_COUNT?explicit:
      inherited?9:DOWAGER_PORTRAITS[(seed>>>0)%DOWAGER_PORTRAITS.length]};
  }
  return {...portrait,dowagerName:d?.name||'太后',alive:!!d?.alive};
}
function makeDowager(c,relation){
  return {name:c?`${c.sur}太后`:'太后',fullName:c?fullName(c):'',personId:c?.id,relation,
    age:c?.age,atTurn:S.turn,portrait:c?{...JSON.parse(JSON.stringify(c)),portraitOverride:portraitCell(c),rank:8}:undefined,
    sur:c?.sur,fam:c?{...c.fam}:undefined,clan:c?clanKey(c):undefined,lastOffer:null,cooldown:24,
    alive:!!(c?.alive&&!c.gone&&!c.cold)};
}
function inheritDowager(h){
  retainAccessionFamilies(h);
  const past=archivePastLives();
  for(const id of [h.mom,empress()?.id])if(id!=null&&!past.excluded.includes(id))past.excluded.push(id);
  const mother=byId(h.mom),queen=empress();
  const main=queen||mother;
  S.flags.dowager=makeDowager(main,main?.id===h.mom?'生母 · 先帝皇后':queen?'嫡母 · 先帝皇后':'生母');
  if(!queen&&main)S.flags.dowager.relation='生母';
  S.flags.birthDowager=mother&&mother.id!==main?.id?makeDowager(mother,'生母 · 尊为皇太后'):null;
  S.previousCourts ||= [];
  S.previousCourts.push({gen:S.gen,turn:S.turn,emperor:{...E()},consorts:JSON.parse(JSON.stringify(S.consorts))});
  if(S.previousCourts.length>5)S.previousCourts.shift();
  const rosterEnabled=journalContentVersion()>=45;
  const relatives=S.children.filter(k=>k.id!==h.id).map(k=>{
    const elder=rosterEnabled?royalBirthOrder(k,h)<0:k.born<=h.born;
    return {...k,reign:S.gen,kinship:k.sex==='m'?(elder?'皇兄':'皇弟'):(elder?'皇姐':'皇妹')};
  });
  S.royalRelatives=[...new Map([...(S.royalRelatives||[]),...relatives].map(k=>[k.id,k])).values()];
  if(rosterEnabled)(S.royalKinRoster||={})[S.gen]=royalKinCandidates(relatives).slice(0,ROYAL_KIN_PER_REIGN).map(k=>k.id);
}
function inheritHousehold(h,queen){
  const household=h.household;if(!household||!queen)return;
  const adopted=princeAdoptionActive()?household.children.filter(c=>c.princeAdoption):[];
  if(adopted.length)(S.princeAdoptionOrigins||=[]).push({...h,away:false,princeEstate:undefined,princeAdoptionOrigin:true,household:{...household,children:adopted}});
  const mothers=new Map([[h.spouse.id,queen]]);
  for(const partner of household.concubines||[]){
    if(partner.alive===false||!partner.appearance)continue;
    const c=JSON.parse(JSON.stringify(partner.appearance));c.age=kidAge(partner);c.alive=true;
    addConsort(c,3,'潜邸旧人，随新帝入宫');if(journalContentVersion()>=76)c.accessionArrival={gen:S.gen,started:S.turn};mothers.set(partner.id,c);
  }
  for(const child of household.children||[]){
    if(princeAdoptionActive()&&child.princeAdoption)continue;
    const mother=mothers.get(child.mother)||queen;
    const k=makeKid(mother,child.sex,child.given||child.name);
    for(const field of ['born','seed','portraitVariant','lit','mar','vir','hp','amb','alive'])if(child[field]!==undefined)k[field]=child[field];
    k.story=[{d:dateStr(),t:`原在潜邸长成，随父皇登基入宫。生母${fullName(mother)}。`}];
  }
  for(const pregnancy of household.pregnancies||[]){
    const mother=mothers.get(pregnancy.mother);if(mother?.alive)mother.preg=Math.max(1,Math.min(9,S.turn-pregnancy.conceived+1));
  }
  S.ys={c:0,b:0,n:0};
}
function dowagerCourtPanel(){
  return [S.flags.dowager,S.flags.birthDowager].filter(Boolean).map(d=>`<section class="detail-head dowager-court">${porImg(dowagerPerson(d),160)}<div class="grow"><h3>${esc(d.name)}</h3><p>${esc(d.fullName||'')}${d.relation?' · '+esc(d.relation):''}</p>${d.age?`<p>${d.age+Math.floor((S.turn-(d.atTurn||0))/12)}岁 · ${d.alive?'慈宁宫':'已故'}</p>`:''}${d.portrait?.trait?`<p>${esc(d.portrait.trait)} · ${esc(TRAITS[d.portrait.trait]?.d||'')}</p>`:''}${d.portrait?.story?.length?`<p class="hint">往事：${esc(d.portrait.story.at(-1).t)}</p>`:''}</div></section>`).join('');
}

function royalBirthOrder(a,b){return a.born-b.born||a.id-b.id;}
function royalKinCandidates(relatives){return relatives.filter(k=>k.alive&&!k.removedFromRoyal).sort(royalBirthOrder);}
function royalKinship(k){
  if(k.reign===S.gen-1)return k.kinship||'宗亲';
  if(k.reign===S.gen-2){
    if(k.sex==='f')return '皇姑';
    return k.kinship==='皇兄'?'皇伯父':k.kinship==='皇弟'?'皇叔父':'宗亲';
  }
  return '宗亲';
}
function listedRoyalKin(){
  const cohorts=new Map(),current=new Set(S.children.map(k=>k.id));
  for(const k of royalHouseholds()){
    if(current.has(k.id)||k.princelySuccession||k.princeAdoptionOrigin||k.royalRegisterBranch)continue;
    if(!cohorts.has(k.reign))cohorts.set(k.reign,[]);
    cohorts.get(k.reign).push(k);
  }
  return [...cohorts].flatMap(([reign,relatives])=>{
    const eligible=royalKinCandidates(relatives),ids=S.royalKinRoster?.[reign];
    return Array.isArray(ids)?eligible.filter(k=>ids.includes(k.id)):eligible.slice(0,ROYAL_KIN_PER_REIGN);
  });
}
function royalKinContactMode(k,estateContact=false){
  if(estateContact)return princeEstateAvailable(k)?k.away?'letter':'visit':'';
  if(!k?.alive||!k.reign||k.removedFromRoyal||k.pendingName||k.jailed||k.gone)return '';
  const estate=k.princeEstate||k.estate;
  return k.away||k.princessMarriage==='frontier'||estate?.route==='frontier'||royalJourneyAway(k)||k.templeStay||
    (estate?.location&&estate.location!=='京城')?'letter':'visit';
}
function royalKinContactPlace(k,mode){
  if(k.princessMarriage==='frontier'||k.estate?.route==='frontier')return '北境';
  if(k.away&&princeFief(k)&&!royalJourneyAway(k)&&!k.templeStay)return princeFief(k);
  return k.away||royalJourneyAway(k)||k.templeStay?childWhereabouts(k):k.princeEstate?.location||k.estate?.location||
    (mode==='visit'?'京城':'外地');
}
function royalKinContactReady(k){
  const contact=k.royalKinContact;
  return !S.over&&S.turn-(contact?.last??-99)>=2&&!contact?.pending&&!contact?.reply?.unread;
}
function royalKinContactButtons(k,estateContact=false){
  const mode=royalKinContactMode(k,estateContact);
  if(!mode||journalContentVersion()<47||S.over)return '';
  const pending=k.royalKinContact?.pending,unread=k.royalKinContact?.reply?.unread;
  const id=royalActionArg(k.id),args=estateContact?`${id},true`:id;
  const button=unread?`<button class="btn sm jade" onclick="A.royalKinReply(${args})">读回信</button>`:
    `<button class="btn sm jade" onclick="A.royalKinContact(${args})" ${royalKinContactReady(k)?'':'disabled'}>${mode==='visit'?(estateContact?'到王府探望':'召见'):'寄家书'}<small>${pending?'等候回信':!royalKinContactReady(k)?'近期已经问候':'精力−1'}</small></button>`;
  return `<div class="acts"><span class="hint">${esc(royalKinContactPlace(k,mode))}</span>${button}</div>`;
}
function royalKinWords(k,topic){
  const age=kidAge(k),child=princeResidentChildren(k).find(c=>c.alive!==false);
  if(age<3)return topic==='home'?'乳母说，孩子每天醒后都要寻那只熟悉的布虎。':'乳母说，孩子近来吃得好，夜里也睡得安稳。';
  if(topic==='home'&&child)return `“${child.given||child.name}近来有了新本事，一回家就拉着我看。我也想让陛下听听这些小事。”`;
  if(topic==='home'&&k.spouse?.alive!==false&&k.spouse)return `“我同${k.spouse.name}约好，再忙也留一顿饭一起用。府里近来总算有些闲话可说。”`;
  if(topic==='home')return age<10?'“我还留着从前的毽子，等下回见面，想再踢给您看。”':'“我近日翻到旧册，里头还有家里一起题的几行字。看着看着，便想起了从前。”';
  return age<10?'“这些日子我学着自己理书匣，想让您知道我也能管好自己的东西了。”':
    childDisposition(k)==='内敛'?'“起居都好。近来读得几页闲书，原想找个时候与陛下说说。”':'“近来出门走了走，起居都好。也惦记陛下案牍繁重，可还有工夫歇一歇？”';
}
function recordRoyalKinContact(k,title,text,location='御书房'){
  princessMemory(k,'royal-kin-contact',`【${title}】${text}`,location);
  log(`【${title}】${text}`);
}
A.royalKinContact=function(id,estateContact=false){
  if(modalOpen||journalContentVersion()<47)return;
  const k=estateContact?princeEstateById(id):listedRoyalKin().find(k=>k.id===id),mode=royalKinContactMode(k,estateContact);
  if(!mode||!royalKinContactReady(k))return;
  const relation=estateContact&&!k.reign?'':royalKinship(k),where=estateContact?princeEstatePlace(k):royalKinContactPlace(k,mode),visit=mode==='visit';
  const valid=()=>royalKinContactMode(k,estateContact)===mode&&royalKinContactReady(k);
  const finish=topic=>{
    if(!valid()||!useE())return null;
    const contact=k.royalKinContact||={};
    contact.last=S.turn;
    if(visit){
      const lead=estateContact?`陛下到王府看望${relation}${k.name}`:`陛下在御书房召见${relation}${k.name}`;
      const line=`${lead}，${topic==='home'?'谈起家常':'问了近况'}。${royalKinWords(k,topic)}`;
      recordRoyalKinContact(k,estateContact?'王府探望':'皇亲召见',line,estateContact?'王府':'御书房');return line;
    }
    const sender=E().sur+E().name;
    contact.pending={due:S.turn+1,sender,topic};
    if(estateContact)contact.pending.estate=true;
    const line=`${sender}遣人往${where}给${relation}${k.name}寄家书，${topic==='home'?'问候家中起居':'问候近来的平安'}。`;
    recordRoyalKinContact(k,estateContact?'寄王府家书':'寄皇亲家书',line,estateContact?where:'御书房');return '家书已寄出，预计下月有回音。';
  };
  pushEv({title:estateContact?(visit?'王府 · 到府探望':'王府家书'):visit?'御书房 · 召见皇亲':'皇亲家书',por:k,valid,
    text:visit?(estateContact?`${relation}${k.name}在厅中迎你，请你坐下用茶。`:`你打算召${relation}${k.name}来御书房，想同${k.sex==='m'?'他':'她'}说些什么？`):`${relation}${k.name}如今在${where}，你提笔写信问候。`,
    choices:[
      {t:visit?'问问近况':'写信问安',cond:()=>E().energy>0,why:'精力不足',f:()=>finish('well')},
      {t:visit?'说说家常':'写信问问家中',cond:()=>E().energy>0,why:'精力不足',f:()=>finish('home')},
      {t:'改日再说'}
    ]});
};
function royalKinContactTick(){
  if(!S||S.over||journalContentVersion()<47)return;
  for(const k of royalHouseholds()){
    const contact=k.royalKinContact,letter=contact?.pending;
    if(!letter||S.turn<letter.due)continue;
    delete contact.pending;
    const mode=royalKinContactMode(k,!!letter.estate);
    if(!mode)continue;
    const relation=letter.estate&&!k.reign?'':royalKinship(k);
    const text=`${relation}${k.name}回复${letter.sender}所寄的家书：${royalKinWords(k,letter.topic)}`;
    contact.reply={text,unread:true};
    recordRoyalKinContact(k,letter.estate?'王府回信':'皇亲回信',text,letter.estate?princeEstatePlace(k):'御书房');
  }
}
A.royalKinReply=function(id,estateContact=false){
  if(modalOpen||S.over||journalContentVersion()<47)return;
  const k=estateContact?princeEstateById(id):listedRoyalKin().find(k=>k.id===id),reply=k?.royalKinContact?.reply;
  if(!reply?.unread||!royalKinContactMode(k,estateContact))return;
  pushEv({title:estateContact?'王府回信':'皇亲回信',por:k,text:reply.text,choices:[{t:'收好回信',f:()=>{reply.unread=false;return null;}}]});
};
function royalRelativeCards(relatives){
  if(!relatives.length)return '';
  const cards=relatives.map(k=>{
    const household=householdSummary(k);
    return `<article class="card portrait-card"><button class="child-portrait" aria-label="查看${esc(k.name)}" onclick="A.go('relative',${k.id})">${porImg(k,84)}</button>
      <div class="grow"><button class="person-link nm" onclick="A.go('relative',${k.id})">${esc(k.name)}</button>
      <div><small>${esc(royalKinship(k))} · ${kidAge(k)}岁${k.title?' · '+esc(k.title):''}${k.spouse?' · '+esc(k.spouse.name):''}</small></div>
      ${household?`<span>${esc(household)}</span>`:''}${royalKinContactButtons(k)}</div></article>`;
  });
  return `<div class="grid portrait-grid">${cards.join('')}</div>`;
}
function royalRelativesPanel(){
  return detailSection('先朝亲族',royalRelativeCards(listedRoyalKin()));
}
function royalKinRosterPanel(){
  const relatives=listedRoyalKin();
  const siblings=royalRelativeCards(relatives.filter(k=>k.reign===S.gen-1));
  const elders=royalRelativeCards(relatives.filter(k=>k.reign===S.gen-2));
  return detailSection('兄弟姐妹',siblings)+detailSection('伯叔与姑姑',elders)||
    '<p class="hint">目前没有在册的兄弟姐妹、伯叔或姑姑。</p>';
}
function viewRoyalRelative(){
  const k=royalById(UI.sel);if(!k)return viewFamily();
  return `${personBackButton('family')}<header class="detail-head">${porImg(k,224)}<div class="grow"><h2>${esc(k.name)}</h2><p>${esc(royalKinship(k))} · ${kidAge(k)}岁</p><p>生母 ${esc(k.momName||'未记载')}</p>${princeEstateLink(k)}</div></header>${listedRoyalKin().includes(k)?royalKinContactButtons(k):''}${immortalPanel(k)}${royalTravelPanel(k)}${marriagePanel(k)}${householdPanel(k)}${detailSection('亲族纪事',detailStory(k))}`;
}
