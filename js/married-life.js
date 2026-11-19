/* Persisted personalities and households, shared by princes, princesses and old saves. */
const COUPLE_HOBBIES={books:'读书校书',riding:'骑射出游',kindness:'侍花理家'};
const COUPLE_TEMPERAMENTS=['温厚','爽朗','矜持','好胜','敏感','沉静'];
function marriageNature(p){
  if(p.marriageNature)return p.marriageNature;
  const random=mulberry32(p.seed||String(p.id||p.name).split('').reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0),7));
  const trait=p.appearance?.trait||p.trait;
  let temperament=({温婉:'温厚',将门:'爽朗',骄矜:'好胜',沉静:'沉静',体弱:'敏感',持重:'矜持'})[trait]||COUPLE_TEMPERAMENTS[Math.floor(random()*6)];
  const hobby=p.quality||({scholar:'books',martial:'riding',frontier:'riding',household:'kindness'})[p.route]||p.youthIdeal||
    (Number.isFinite(p.lit)?youthIdeal(p):['books','riding','kindness'][Math.floor(random()*3)]);
  if(princessMarriageVoicesActive()&&p.sex==='f'&&S?.children?.includes(p))
    temperament=({好奇:'爽朗',灵动:'爽朗',爽直:'爽朗',好胜:'好胜',自矜:'好胜',仁厚:'温厚',内敛:'沉静',审慎:'矜持'})[childDisposition(p)];
  return {temperament,hobby,spending:random()<.5?'节俭':'讲究',space:random()<.5?'喜欢相伴':'需要独处'};
}
function marriageFit(k,p){
  const a=marriageNature(k),b=marriageNature(p);
  const common=[],different=[];
  (a.hobby===b.hobby?common:different).push(a.hobby===b.hobby?'兴趣相投':`一个喜欢${COUPLE_HOBBIES[a.hobby]}，一个偏爱${COUPLE_HOBBIES[b.hobby]}`);
  (a.spending===b.spending?common:different).push(a.spending===b.spending?'用度习惯相近':'用度上需商量');
  (a.space===b.space?common:different).push(a.space===b.space?'相处节奏合拍':'独处与相伴的分寸不同');
  return {common,different,score:40+common.length*12};
}
function marriageProfileText(k,p){
  const a=marriageNature(k),b=marriageNature(p),fit=marriageFit(k,p);
  return `${k.name}：${a.temperament}，偏爱${COUPLE_HOBBIES[a.hobby]}，${a.space}。\n${p.name}：${b.temperament}，偏爱${COUPLE_HOBBIES[b.hobby]}，用度${b.spending}，${b.space}。\n${fit.common.length?'相投之处：'+fit.common.join('、')+'。':''}${fit.different.length?'需要磨合：'+fit.different.join('；')+'。':''}${p.marriageTalk?'\n相看时已谈过：'+p.marriageTalk.text:''}`;
}
function marriageMeeting(k,p,back){
  return {title:'相看问心',cast:[k,p],valid:()=>marriageReady(k),
    text:`礼部安排两人在花厅小坐。${p.name}${marriageNature(p).temperament==='好胜'?'谈到所长便眼睛一亮，也坦言不喜欢凡事让步。':'收起名帖，先问起对方平日真正喜欢做的事。'}\n${marriageProfileText(k,p)}`,choices:[
      {t:'让双方自己商量婚后打算',f:()=>{if(!marriageReady(k))return null;p.marriageTalk={turn:S.turn,text:'双方约定保留各自所长，家事一同商量。',trust:8};save('auto');pushNow(back());return null;}},
      {t:'先谈清楚家用与亲族来往',f:()=>{if(!marriageReady(k))return null;p.marriageTalk={turn:S.turn,text:'两人谈清府中用度，也约定亲族请托不能擅作主张。',trust:5};save('auto');pushNow(back());return null;}},
      {t:'还需再想想，先回去',f:()=>{pushNow(back());return null;}}
    ]};
}
const royalHouseholds=()=>{
  const roots=[...new Map([...(S.royalRelatives||[]),...(princeAdoptionActive()?S.princeAdoptionOrigins||[]:[]),...archivedPrincesses(),...S.children].map(k=>[k.id,k])).values()];
  return [...roots,...princelyDescendants(roots)];
};
const royalById=id=>royalHouseholds().find(k=>k.id===id);
const richerPrincessMarriage=k=>k.sex==='f'&&journalContentVersion()>=47;
function ensureMarriedLife(k){
  if(!k?.married||!k.spouse)return null;
  const p=k.spouse;
  // Preserve known spouses; fill absent legacy fields exactly once without replacing their identities.
  const appearance=spouseAppearance(k);
  for(const field of ['sex','seed','born','portraitVariant','courtGuest'])if(p[field]===undefined&&appearance[field]!==undefined)p[field]=appearance[field];
  p.id ??= 'spouse-'+k.id;p.courtGuest=true;
  p.born ??= k.born;p.alive ??= true;p.marriedAt ??= S.turn;p.sur ||= p.name?.slice(0,1)||'沈';
  k.marriageNature ||= marriageNature(k);p.marriageNature ||= marriageNature(p);
  k.story ||= [];
  p.trust ??= clamp(marriageFit(k,p).score+(p.marriageTalk?.trust||0));
  k.household ||= {version:1,started:p.marriedAt,children:[],concubines:[],pregnancies:[],history:[],seen:{},lastTick:S.turn,lastBirth:-99,lastEvent:S.turn,nextNews:S.turn+(richerPrincessMarriage(k)?2:4),lastNewsKind:null};
  k.household.nextNews ??= S.turn+4;
  if(!k.household.lastBirthByMother){
    k.household.lastBirthByMother={};
    for(const baby of k.household.children)if(Number.isFinite(baby.born))k.household.lastBirthByMother[baby.mother]=Math.max(k.household.lastBirthByMother[baby.mother]??-999,baby.born);
  }
  return k.household;
}
function householdMother(k){
  const id=k.foster||k.mom,d=[S.flags.dowager,S.flags.birthDowager].find(d=>d?.personId===id);
  if(d)return {...d.portrait,alive:d.alive};
  return byId(id)||(S.previousCourts||[]).slice().reverse().flatMap(c=>c.consorts).find(c=>c.id===id);
}
function householdLiving(k){return !!(k?.alive&&!k.princeAdoptionOrigin&&!k.removedFromRoyal&&k.married&&k.spouse?.alive!==false&&!k.jailed&&!k.gone&&!S.over);}
function householdActive(k){return householdLiving(k)&&!k.templeStay&&(!betrothalJourneysActive()||!royalTravelAway(k));}
function householdRecord(k,type,text,{chronicle=true}={}){
  const h=ensureMarriedLife(k);if(!h)return;
  h.history.push({d:dateStr(),turn:S.turn,type,t:text});if(h.history.length>60)h.history.shift();
  if(chronicle)princessMemory(k,type,text,k.away||k.princessMarriage==='frontier'?'府中来信':k.sex==='f'?'公主府':'皇子府');
}
function householdPeople(k){return [k.spouse,...(ensureMarriedLife(k)?.concubines||[])].filter(Boolean);}
function householdNewlywed(k,p,h=k.household){
  const since=S.turn-(p?.marriedAt??h?.started??S.turn);
  if(!PalaceActions.earlyMarriedLife||!p||since<0||since>8||(p.trust??50)>=45||p.away||p.jailed||p.gone||p.cold)return false;
  const official=p.scholarId&&scholarById(p.scholarId)||k.officialMarriageId&&officialMarriagePerson(officialMarriageRecord(k.officialMarriageId)?.groom)?.p;
  return !official?.away;
}
function householdNewlywedText(k,p){
  const partner=marriageNature(p).temperament;
  const answer=['沉静','矜持','敏感'].includes(partner)?
    `${p.name}把“随你”说得太快，过了片刻才轻声补一句：“我早上其实喝不惯浓茶。”`:
    `${p.name}原想说一句玩笑，见${k.name}当真听起来，只得重新说明白，自己只是还没摸准对方的脾气。`;
  const start=['审慎','内敛','自矜'].includes(childDisposition(k))?
    `${k.name}等宫人退了，才小心问了一句：“明日你愿在这里用饭么？”话一出口，又怕问得太唐突。`:
    `${k.name}端着茶坐下，想说些白日的新鲜事，话开了头却不知对方爱不爱听。`;
  return `新婚不久，府里还常把两个人的茶送到两处。${start}${answer}`;
}
function householdSummary(k){
  const h=k.household;if(!h||kidAge(k)<18||!k.married)return '';
  const registered=princeResidentChildren(k);
  const children=[...registered,...(k.recognizedChildren||[]).map(kidById).filter(Boolean)].filter(c=>c.alive!==false),sons=children.filter(c=>c.sex==='m').length;
  return `${sons}子${children.length-sons}女${householdKnownPregnancies(h).length?' · 有喜':''}${h.concubines.length?' · 妾室'+h.concubines.length+'人':''}`;
}
function householdChildLink(k,c){
  return `<button class="btn quiet family-person" onclick="A.go('household-child',${royalActionArg(c.id)})">${porImg(c,56)}<span><strong>${esc(c.name)}</strong><small>${c.alive===false?'已故':kidAge(c)+'岁'} · ${c.princeAdoption?.family===k.id?'嗣子':c.sex==='m'?'子':'女'}${c.motherName?' · 生母'+esc(c.motherName):''}</small></span></button>`;
}
function householdChildGroups(){
  const seen=new Set();
  return royalHouseholds().map(k=>({k,children:(k.household?.children||[]).filter(c=>{
    if(seen.has(c.id))return false;
    seen.add(c.id);return true;
  })})).filter(group=>group.children.length);
}
function householdDescendantsPanel(){
  const groups=householdChildGroups();if(!groups.length)return '';
  const count=groups.reduce((sum,group)=>sum+group.children.length,0);
  return `<details class="family-branch"><summary><strong>皇子公主的子女</strong><span class="hint">${count} 人</span></summary>
    ${groups.map(({k,children})=>`<details class="family-branch"><summary>${esc(k.name)} · ${children.length} 人</summary><ul>${children.map(c=>`<li>${householdChildLink(k,c)}</li>`).join('')}</ul></details>`).join('')}</details>`;
}
function householdChildEntry(id){
  for(const group of householdChildGroups()){
    const child=group.children.find(c=>String(c.id)===String(id));
    if(child)return {k:group.k,child};
  }
  return null;
}
function viewHouseholdChild(){
  const entry=householdChildEntry(UI.sel);
  if(!entry)return viewFamily();
  const {k,child:c}=entry,birth=princeBiologicalParents(c);
  const parentage=princeSpouseParentageCases(k).find(x=>x.childId===c.id&&x.status!=='news');
  const parent=(label,p,name)=>`<p>${label} ${p?`<button class="person-link" onclick="A.go('${S.children.includes(p)?'kid':princeEstateEligible(p)?'prince-estate':'relative'}',${royalActionArg(p.id)})">${esc(name||p.name)}</button>`:esc(name||'未载')}</p>`;
  const stats=[['lit','才学','#617991'],['mar','武艺','#92504a'],['vir','德行','#517369'],['hp','体魄','#a87a26']]
    .filter(([key])=>Number.isFinite(c[key])).map(([key,label,color])=>bar(label,c[key],color)).join('');
  const adoptive=c.princeAdoption&&royalById(c.princeAdoption.family);
  return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg(c,224)}<div class="grow">
    <p>${c.alive===false?'已故':kidAge(c)+'岁'} · ${c.sex==='m'?'男':'女'}${c.title?' · '+esc(c.title):''}</p><h2>${esc(c.name)}</h2>
    ${parent(parentage?'宗谱所载父亲':'生父',k.sex==='m'?birth.father||k:null,c.fatherName)}${parent('生母',k.sex==='f'?k:null,birth.mother?.name||c.motherName)}
    ${adoptive?parent('嗣父',adoptive):''}${c.deathReason?`<p>${esc(c.deathReason)}</p>`:''}</div></header>
    ${parentage?princeSpouseParentagePanel(k,[parentage]):''}
    ${stats?detailSection('禀赋与体魄',`<div class="stats">${stats}</div>`):''}
    ${detailSection('人物纪事',detailStory(c))}`;
}
const householdBirthCount=k=>k.household.children.length+(royalAdoptionStoriesActive()?k.palaceAdoptedChildren?.length||0:0);
const householdKnownPregnancies=h=>h.pregnancies.filter(g=>(g.privateUntil??-Infinity)<=S.turn);
function householdCanConceive(k,p,{privateVisit=false}={}){
  const woman=k.sex==='f'?k:p,h=ensureMarriedLife(k);
  return householdActive(k)&&!whiteSpringInPalace(k)&&p?.alive!==false&&kidAge(k)>=18&&kidAge(p)>=18&&belowConceptionAgeLimit(kidAge(woman),46)&&
    !p.away&&!p.jailed&&!p.gone&&!p.cold&&householdBirthCount(k)+h.pregnancies.length<8&&!h.pregnancies.some(g=>g.mother===woman.id)&&
    S.turn-(h.lastBirthByMother[woman.id]??-99)>=18&&S.turn-(p.joinedAt??h.started)>=3&&(privateVisit||(p.trust??k.spouse.trust)>=40);
}
function householdMotherName(k,p){return k.sex==='f'?k.name:(p.id===k.spouse.id?'正妻':'妾室')+p.name;}
function startHouseholdPregnancy(k,p,{privateVisit=false}={}){
  if(!householdCanConceive(k,p,{privateVisit}))return false;
  const h=ensureMarriedLife(k),woman=k.sex==='f'?k:p;
  const together=h.pregnancies.some(g=>g.conceived===S.turn),name=householdMotherName(k,p);
  const pregnancy={mother:woman.id,father:k.sex==='m'?k.id:p.id,partner:p.id,conceived:S.turn,conceivedDate:dateStr(),due:S.turn+9};
  h.pregnancies.push(pregnancy);
  if(privateVisit){
    pregnancy.privateUntil=S.turn+2;
    filePrinceSpouseParentage(k,p,pregnancy,true);
    return true;
  }
  if(PalaceActions.princeSpouseParentage&&k.sex==='m'&&p===k.spouse&&p.princePrivateVisit?.gen===S.gen&&p.princePrivateVisit.lastMeeting===S.turn-1)
    filePrinceSpouseParentage(k,p,pregnancy,false);
  householdRecord(k,'household_pregnancy',`${together?'同月，':''}${name}${together?'亦':''}有喜，已分别安排照护，预期九个月后添丁。${together?'同一月里两处院落都传来喜讯，府中添了几分忙碌。':''}`);
  log(`${kidName(k)}府上报喜：${name}有孕。`,1);return true;
}
function deliverHouseholdChild(k,pregnancy){
  const h=ensureMarriedLife(k),p=householdPeople(k).find(p=>p.id===pregnancy.partner);
  if(!householdLiving(k)||!h.pregnancies.includes(pregnancy)||S.turn<pregnancy.due)return null;
  h.pregnancies=h.pregnancies.filter(x=>x!==pregnancy);
  const woman=k.sex==='f'?k:p;
  if(!woman||woman.alive===false||!p||p.alive===false||kidAge(k)<18||kidAge(p)<18)return null;
  const sex=chance(.5)?'m':'f',sur=k.sex==='m'?E().sur:p.sur;
  const names=sex==='m'?['景和','怀瑾','知远','承礼','允章','明谦','思齐','修宁']:['令仪','清嘉','舒窈','静姝','婉宁','含章','昭华','若兰'];
  const used=new Set(royalHouseholds().flatMap(r=>(r.household?.children||[]).map(c=>c.given)));
  const name=pick(names.filter(n=>!used.has(n)).length?names.filter(n=>!used.has(n)):names)+ (names.every(n=>used.has(n))?pick(sex==='m'?BOYC:GIV):'');
  const baby={id:`grand-${S.gen}-${k.id}-${householdBirthCount(k)+1}`,courtGuest:true,name:sur+name,given:name,sur,sex,
    born:S.turn,alive:true,seed:ri(1,2e9),portraitVariant:ri(0,(journalContentVersion()>=62?portraitVariantCount({sex}):31)-1),
    mother:pregnancy.mother,motherName:woman.name,father:pregnancy.father,fatherName:k.sex==='m'?k.name:p.name,
    lit:clamp(k.lit*.5+(p.appearance?.talent||50)*.35+ri(0,10)),vir:clamp(k.vir*.5+(p.appearance?.virtue||50)*.35+ri(0,10)),mar:clamp(k.mar*.55+ri(4,20)),hp:ri(65,95),amb:ri(15,50)};
  h.children.push(baby);h.lastBirth=S.turn;h.lastBirthByMother[woman.id]=S.turn;
  const parentage=princeSpouseParentageCases(k).find(x=>x.key===pregnancy.princeParentage);
  if(parentage)parentage.childId=baby.id;
  householdRecord(k,'household_birth',`${householdMotherName(k,p)}平安诞下${sex==='m'?'一子':'一女'}，取名${baby.name}。现有${householdSummary(k)}。`);
  log(`${kidName(k)}府中添丁，${baby.name}降生。`,1);whiteSpringBirthLetter(k,baby);return baby;
}
const HOUSEHOLD_SCENES={
  newlywed:{title:'新婚 · 话到嘴边',match:householdNewlywed,text:householdNewlywedText,
    choices:[['先约一顿饭，各说一件自己的习惯',4,3,null,0,'两人先从茶的浓淡说起，约好次日同桌用饭，其他的话以后慢慢说。'],['让他们各自在府里安顿，再随意相见',1,2,null,0,'两人各留了一处独坐的地方，遇见时也可以自在说一会儿话，渐渐少了些客套。']]},
  tea:{title:'赌书分茶',
    match:(k,p)=>marriageNature(k).hobby==='books'||marriageNature(p).hobby==='books',
    text:(k,p)=>`${k.name}与${p.name}把书页夹好，约定猜中典故出处的人先饮茶。${marriageNature(p).temperament==='好胜'?'一人连输三回，索性要把题目换成自己熟悉的。':'一人记错页码，两人笑着翻检，却各有不肯服输的地方。'}`,
    choices:[['送来一部异本，让两人合校',6,3,'lit',3,'两人改为一同校书，各自的批注都留在了页边。'],['只夸答得最多的那一人',-5,-4,'lit',2,'答题的人得了夸奖，另一人却把茶盏放下了。']]},
  accounts:{title:'同看家用簿',match:()=>true,
    text:(k,p)=>`${k.name}想添一件珍玩，${p.name}却拿来这个月的用度簿。${marriageNature(p).spending==='节俭'?'对方在意的是积少成多，并非舍不得这一件东西。':'两人都想把府里布置得体面，却没人先算过今年还余多少。'}`,
    choices:[['帮他们定下共同预算',5,5,'vir',2,'两人议定日常用度各留一份，额外开销先商量。'],['赐银平账 · 国库−15',1,2,null,0,'府里的账暂时平了，往后的开销仍得两人自己商量。',15]]},
  outing:{title:'一封出游帖',match:(k,p)=>marriageNature(k).hobby==='riding'||marriageNature(p).hobby==='riding',
    text:(k,p)=>`${k.name}与${p.name}商量城郊出游。一人想骑马赶早，另一人想沿河慢行。${marriageNature(p).space==='需要独处'?'对方还想独自留半日，不愿时时跟在一处。':'对方盼着两人一起看完沿途的景色。'}`,
    choices:[['各留半日，再约好会合',6,5,'mar',2,'他们各做了喜欢的事，晚间见面时反而多了许多话。'],['按府中旧例安排同行',-2,1,'vir',1,'行程依例办妥，不过其中一人仍觉得没有被听见。']]},
  boundary:{title:'两家的礼单',match:()=>true,
    text:(k,p)=>`${p.name}家送来节礼，又附了一封求官的信。${k.name}把信压在礼单下，不想让一份亲情变成答应不了的人情。`,
    choices:[['收下家书，官职另循公议',5,4,'vir',3,'两人一起回了家书，把亲情与官职分开处理。'],['让其中一人独自回绝',-5,-3,null,0,'回信的人觉得自己独担了恶名，另一人也不知该怎样开口。']]},
  nursery:{title:'小儿初学步',match:k=>princeResidentChildren(k).some(c=>c.alive&&kidAge(c)>=1&&kidAge(c)<=4),
    text:(k,p)=>`${k.name}与${p.name}争着教小儿走路。一个怕摔，一个怕护得太紧。孩子抱住椅脚，回头看看两人，偏不肯先迈步。`,
    choices:[['一起留出安全的空地，让孩子自己试',7,5,'vir',2,'两人一同蹲下等孩子走来，终于不再争谁的办法更好。'],['把教养交给一个人安排',-4,-2,null,0,'府里有了统一规矩，却有一个人被留在了孩子的日常之外。']]},
  repair:{title:'闭门后的回信',match:(k,p)=>(p.trust??60)<45,
    text:(k,p)=>`${k.name}与${p.name}近来只由下人传话。旧事没有说开，礼物送去也原样退回。${marriageNature(p).temperament==='敏感'?'对方记得的，正是上次在人前被轻轻带过的一句话。':'对方要的不是一份赏赐，而是以后遇事时能先听自己说完。'}`,
    choices:[['分别听完，再约一件能做到的小事',10,6,null,0,'两人先约定每天一起用一次饭，尚未尽释前嫌，却开始亲口说话。'],['命他们在人前和睦',-8,-5,null,0,'他们依礼谢恩，回府后仍是各自闭门。']]},
  keepsake:{title:'旧物留香',match:()=>true,
    text:(k,p)=>`${p.name}收起一件旧衣，${k.name}才知道那是离家时带来的。${marriageNature(p).temperament==='矜持'?'对方平时不提想家，这次却把旧物讲得很仔细。':'对方指着修补过的针脚，说起家中人从前的模样。'}`,
    choices:[['请两人各讲一件旧物的来历',6,4,null,0,'他们把两件旧物放在同一只匣子里，记住了彼此从前的生活。'],['赐新的，旧物仍由他们自己留存',3,2,null,0,'新物送到府中，旧衣也照原样留着。']]}
};
function makeHouseholdScene(k){
  const h=ensureMarriedLife(k);if(!householdActive(k)||!h||h.pending)return null;
  const p=k.spouse;
  if(householdNewlywed(k,p,h)&&!Object.hasOwn(h.seen,'newlywed'))return h.pending={id:'newlywed',turn:S.turn};
  if(S.turn-h.lastEvent<6)return null;
  const rules=royalHouseholdLifeActive()?{...HOUSEHOLD_SCENES,...ROYAL_DOMESTIC_SCENES}:HOUSEHOLD_SCENES;
  const candidates=Object.keys(rules).filter(id=>id!=='newlywed'&&S.turn-(h.seen[id]??-99)>=24&&rules[id].match(k,p));
  if(!candidates.length)return null;
  const id=(p.trust<45&&candidates.includes('repair'))?'repair':pick(candidates);
  return h.pending={id,turn:S.turn};
}
function householdSceneEvent(k){
  const h=ensureMarriedLife(k),pending=h?.pending;if(!householdActive(k)||!pending)return null;
  const rule=royalDomesticSceneRule(pending.id);if(!rule||!rule.match(k,k.spouse)){h.pending=null;return null;}
  const valid=()=>householdActive(k)&&h.pending===pending&&rule.match(k,k.spouse);
  return {title:rule.title,cast:[k,k.spouse],valid,ref:rule.ref,text:'小家送来一封家书。\n'+rule.text(k,k.spouse),choices:rule.choices.map(([t,trust,harmony,stat,gain,result,cost=0])=>({t,cond:()=>valid()&&E().energy>0&&E().treasury>=cost,why:'精力或国库不足',f:()=>{
    if(!valid()||E().energy<=0||E().treasury<cost)return null;
    E().energy--;E().treasury-=cost;h.pending=null;h.lastEvent=S.turn;h.seen[pending.id]=S.turn;
    const gainInAffection=changeHouseholdAffection(k,trust),shown=royalHouseholdLifeActive()?gainInAffection:trust;
    h.harmony=clamp((h.harmony??60)+harmony);if(stat)k[stat]=clamp(k[stat]+gain);
    householdRecord(k,'household_scene',rule.title+'：'+result);
    if(royalHouseholdLifeActive())rememberRoyalDomesticPartner(k,rule.title,pending.id==='newlywed'?result:rule.thought);
    h.echo={due:S.turn+2,text:result,trust:trust>0?2:0};save('auto');
    return result+fx(`${householdAffectionLabel()}${shown>=0?'+':''}${shown} · 精力−1${cost?' · 国库−'+cost:''}`);
  }})).concat([{t:'先由两人自己商量',f:()=>{if(!valid())return null;h.pending=null;h.lastEvent=S.turn;h.seen[pending.id]=S.turn;householdRecord(k,'household_scene',rule.title+'：陛下听过双方想法，留给两人自己商量。');save('auto');return '你没有替他们定夺，仍请两人有话当面说。';}}])};
}
function recordHouseholdNews(k){
  const h=ensureMarriedLife(k),p=k.spouse;if(!householdActive(k))return;
  if(householdNewlywed(k,p,h)&&!h.newlywedNews&&!Object.hasOwn(h.seen,'newlywed')){
    h.newlywedNews=true;
    const text=householdNewlywedText(k,p);
    householdRecord(k,'household_daily',text);
    rememberRoyalDomesticPartner(k,'新婚初识',text);
    if(!h.pending)makeHouseholdScene(k);
    return;
  }
  if(betrothalWeddingsActive()&&p.natalHost!=null&&betrothalMarriageNews(k,natalEntry(p.natalHost,p.personId)?.p,h))return;
  const mother=householdMother(k),near=!k.away&&k.princessMarriage!=='frontier';
  const fit=marriageFit(k,p),good=p.trust>=55;
  const choices=[
    {id:'supper',delta:good?3:-2,text:good?`${k.name}与${p.name}约好每日留一顿饭一起用，忙时也提前捎话，近来渐有默契。`:`${k.name}与${p.name}各忙各的，接连几日错过用膳时辰。两人都觉得被冷落，却还没把话说开。`},
    {id:'space',delta:fit.common.includes('相处节奏合拍')?3:1,text:fit.common.includes('相处节奏合拍')?`${k.name}与${p.name}在窗下各做各的事，偶尔说一句，也觉得自在。`:`${k.name}想有人相伴，${p.name}却想留些独处的工夫。两人商量先各留半日，再一起用晚膳。`},
    {id:'habits',delta:2,text:`${p.name}将自己的起居习惯说给${k.name}听，两人改了几处府中安排，少了些无谓的猜测。`}
  ];
  if(fit.common.includes('兴趣相投'))choices.push({id:'shared',delta:4,text:`${k.name}与${p.name}同好${COUPLE_HOBBIES[marriageNature(k).hobby]}，近日腾出一角小室，各把心爱的东西放在一处。`});
  if(p.trust<45)choices.push({id:'silence',delta:-2,text:`${k.name}与${p.name}有了分歧，偏偏都不肯先开口。家书里只写平安，字句间却有些疏远。`});
  if(mother?.alive&&!mother.gone&&!mother.cold)choices.push({id:'mother',delta:2,text:near?`${k.name}与${p.name}请安时陪${cName(mother)}说了家常。母亲问起衣食，两人各答了一半，离去时还带了一包点心。`:`${k.name}与${p.name}一同给${cName(mother)}写了家书，把小家近来的安稳说给母亲听。`});
  if(mother?.alive&&(mother.cold||mother.gone))choices.push({id:'separated-mother',delta:good?2:0,text:`${k.name}挂念处境艰难的母亲，${p.name}${good?'听完牵挂，陪着把问安的信写好，等候许可递送。':royalHouseholdLifeActive()?'一时不知如何安慰，先陪着静坐了一会儿。问安信随后写好，放在案上等许可递送。':'一时不知如何安慰，只陪着静坐了一会儿。'}`});
  if(p.fatherName)choices.push({id:'inlaws',delta:2,text:`${p.fatherName}家来信问安，${p.name}与${k.name}一同回信。两家旧习不同，他们把节礼的轻重提前商量清楚。`});
  const baby=princeResidentChildren(k).find(c=>c.alive!==false);
  if(baby)choices.push({id:'child',delta:3,text:kidAge(baby)<1?`${k.name}与${p.name}轮流照看${baby.name}，才发觉小儿一个笑容也能让两人说上半日。`:`${baby.name}渐渐有了自己的脾气。${k.name}与${p.name}起初各有教法，后来约好先听孩子说完。`});
  if(householdKnownPregnancies(h).length)choices.push({id:'expecting',delta:3,text:`小家近来为将添的孩子收拾起居。${k.name}与${p.name}把旁的安排放慢，先顾好饮食与休息。`});
  const richer=richerPrincessMarriage(k);
  const record=richer&&k.officialMarriageId&&officialMarriageRecord(k.officialMarriageId);
  const groom=richer&&(record?officialMarriagePerson(record.groom)?.p:scholarById(p.scholarId));
  if(groom?.away){
    choices.splice(0,choices.length,
      {id:'routeLetter',delta:2,text:`驸马${p.name}自任所寄来平安信。${k.name}在回信里画了院中开花的树，好让他看看家里的春色。`},
      {id:'budgetLetter',delta:good?3:1,text:`公主与驸马${p.name}隔着两地对府账。她在信尾另写了几行家常，叫他忙完公务再慢慢回。`},
      {id:'parcel',delta:3,text:`驸马${p.name}从任所托人捎来一包当地茶叶。${k.name}留了半包，另半包打算等他回来一起尝。`},
      {id:'missedLetter',delta:1,text:`等了几日才收到驸马${p.name}的来信。${k.name}读出他近来忙碌，便约好以后只要报声平安，长信可以过些时候再写。`},
      {id:'seasonLetter',delta:3,text:`换季前，${k.name}把新做的衣裳和一封家书送往驸马${p.name}的任所，也问他打算何时归家。`});
  }else if(richer){
    choices.push(
      {id:'accounts',delta:good?3:1,text:`公主与驸马${p.name}${good?'合对府中账目，把余下的银钱留作冬衣与药费。':'对着府账各有主意，约好先记下急用的两笔，余下的下次再议。'}`},
      {id:'errands',delta:2,text:`驸马${p.name}外出前问她想捎些什么。她托他带回市上的时令点心，两人把剩下一包留给府里的乳母。`},
      {id:'festival',delta:3,text:`府中备节礼时，${k.name}与驸马${p.name}先各写了一份名单，再并作一份。两家亲眷都收到了他们合写的问候。`},
      {id:'respite',delta:good?4:1,text:`驸马${p.name}近来心事重。${k.name}${good?'留灯等他说完，第二天也替他把几桩琐事接了过去。':'看出他想静一会儿，等饭后才慢慢问起。'}`},
      {id:'repair',delta:2,text:`府中小院雨后漏了檐沟。${k.name}与驸马${p.name}分头寻匠人、理开销，修妥那天一同把旧竹椅搬了回来。`});
    if(p.trust<55)choices.push({id:'amends',delta:3,text:`前几日为登门的客人拌了嘴，${k.name}和驸马${p.name}各说了一遍自己在意的事，约好下次先由两人商量。`});
  }
  if(!groom?.away)choices.push(...royalDomesticNews(k,p));
  const recent=richer?h.recentNews||[]:[h.lastNewsKind];
  const news=pick(choices.filter(n=>n.id!==h.lastNewsKind&&!recent.includes(n.id)));h.lastNewsKind=news.id;
  if(richer)h.recentNews=[...recent.slice(-2),news.id];
  changeHouseholdAffection(k,news.delta);h.harmony=clamp((h.harmony??60)+news.delta);
  householdRecord(k,'household_daily',news.text);
  if(royalHouseholdLifeActive()&&news.thought){
    (h.domesticNewsLast||={})[news.id]=S.turn;
    rememberRoyalDomesticPartner(k,news.title,news.thought);
  }
}
function marriedLifeTick(){
  if(S.over)return;
  royalNatalMarriageTick();
  const people=royalHouseholds();
  for(const k of people){
    if(k.princeAdoptionOrigin)continue;
    whiteSpringFamilyTick(k);
    const h=ensureMarriedLife(k);if(!h||h.lastTick===S.turn)continue;h.lastTick=S.turn;
    if(!householdLiving(k)){h.pending=null;h.pregnancies=[];continue;}
    settleHouseholdAffection(k,h);
    for(const p of [...h.pregnancies])if(S.turn>=p.due)deliverHouseholdChild(k,p);
    if(!householdActive(k)||whiteSpringInPalace(k)){h.pending=null;continue;}
    if(h.echo&&S.turn>=h.echo.due){changeHouseholdAffection(k,h.echo.trust);householdRecord(k,'household_echo','两个月后，府中回信：'+h.echo.text);delete h.echo;}
    if(h.project&&S.turn>=h.project.due){const project=h.project;delete h.project;k[project.stat]=clamp(k[project.stat]+4);changeHouseholdAffection(k,5);householdRecord(k,'household_project',project.title+'办成，两人各自做了擅长的一部分。');}
    if(S.turn>=h.nextNews){recordHouseholdNews(k);h.nextNews=S.turn+(richerPrincessMarriage(k)?ri(2,4):ri(4,7));}
    // Keep the household roll rare; a second eligible partner can conceive in the same month.
    const partners=householdPeople(k).filter(p=>householdCanConceive(k,p));
    if(partners.length&&chance(.045)){
      const first=pick(partners);startHouseholdPregnancy(k,first);
      const others=partners.filter(p=>p!==first&&householdCanConceive(k,p));
      if(others.length&&chance(.15))startHouseholdPregnancy(k,pick(others));
    }
  }
  royalHouseholdConcubineTick(people);
  if(S.turn-(S.flags.lastHouseholdScene??-99)<4)return;
  const options=people.filter(k=>householdActive(k)&&!whiteSpringInPalace(k)&&!ensureMarriedLife(k).pending&&S.turn-k.household.lastEvent>=6);
  if(options.length&&chance(.35)){const k=pick(options);if(makeHouseholdScene(k))S.flags.lastHouseholdScene=S.turn;}
}
function householdConcubineReason(k){
  if(!householdActive(k)||k.sex!=='m')return '当前不能商议纳妾';
  if(kidAge(k)<18||kidAge(k.spouse)<18)return '皇子与正妻均满十八岁后可商议';
  const h=ensureMarriedLife(k);
  if(royalHouseholdLifeActive()&&h.concubineBan)return '奉旨禁止纳妾';
  if(h.concubines.length>=2)return '已有两位妾室';
  const last=h.lastConcubine,remaining=Math.max(0,24-(S.turn-(last??h.started??k.spouse.marriedAt)));
  return remaining?(last==null?'新婚安顿中':'距上次商议未满两年')+' · 还需'+remaining+'个月':'';
}
function householdPanel(k){
  const h=ensureMarriedLife(k);if(!h||kidAge(k)<15)return '';
  const residents=princeResidentChildren(k);
  const p=k.spouse,fit=marriageFit(k,p),adult=kidAge(k)>=18&&kidAge(p)>=18,concubineReason=householdConcubineReason(k);
  const pregnant=adult?householdKnownPregnancies(h).map(g=>{const person=g.mother===k.id?k:householdPeople(k).find(p=>p.id===g.mother);return person?`${esc(k.sex==='f'?k.name:householdMotherName(k,person))}有孕 · ${Math.min(10,S.turn-g.conceived+1)}个月`:'';}).filter(Boolean):[];
  return `<section class="household-panel"><h3>家人与往来</h3><p>${esc(p.name)} · ${esc(marriageNature(p).temperament)} · ${esc(COUPLE_HOBBIES[marriageNature(p).hobby])} · ${esc(marriageNature(p).spending)}</p>
    <p class="hint">${esc(fit.common.join('、')||'各有所长')}；${esc(fit.different.join('；')||'相处习惯较为接近')}。</p>
    ${bar(householdAffectionLabel(),p.trust,'#936375')}${bar('府中和睦',h.harmony??60,'#517369')}
    ${royalHouseholdLifeActive()&&h.affectionLimit===50?'<p class="hint">相敬如宾 · 夫妻感情上限 50</p>':''}
    ${adult?`<p><strong>${esc(householdSummary(k))}</strong> · ${pregnant.length?pregnant.join('；'):'暂无孕信'}</p>`:''}
    ${h.concubines.length?`<p>妾室：${h.concubines.map(p=>esc(p.name)+'（'+esc(marriageNature(p).temperament)+'）').join('、')}</p>`:''}
    ${h.project?`<p class="hint">${esc(h.project.title)} · 预计${Math.max(0,h.project.due-S.turn)}个月后有回音</p>`:''}
    ${h.pending?`<p class="initiative-note">府中近况：${esc(royalDomesticSceneRule(h.pending.id)?.title||'待询问')}</p>`:''}
    ${householdActive(k)&&!whiteSpringInPalace(k)?`<div class="acts"><button class="btn jade" onclick="A.householdVisit(${royalActionArg(k.id)})">${k.away||k.princessMarriage==='frontier'?'读府中来信':'探望小家'} →</button><button class="btn" onclick="A.householdProject(${royalActionArg(k.id)})" ${h.project||S.turn-(h.lastProject??-99)<12?'disabled':''}>帮两人办件事</button>${adult&&k.sex==='m'?`<button class="btn" onclick="A.householdConcubine(${royalActionArg(k.id)})" title="${esc(concubineReason||'先听皇子的想法，再决定是否准许纳妾')}" ${concubineReason?'disabled':''}>询问皇子纳妾意愿${concubineReason?`<small>${esc(concubineReason)}</small>`:''}</button>`:''}${royalHouseholdLifeActive()&&k.sex==='m'?`<button class="btn" onclick="A.householdConcubineBan(${royalActionArg(k.id)},${!h.concubineBan})">${h.concubineBan?'解除纳妾禁令':'禁止皇子纳妾'}</button>`:''}${royalHouseholdLifeActive()&&p.natalHost==null?betrothedTravelButton(k):''}</div>`:''}
    ${residents.length?detailSection('子女',`<div class="household-children">${residents.map(c=>householdChildLink(k,c)).join('')}</div>`):''}
    </section>${whiteSpringFamilyPanel(k)}`;
}
A.householdVisit=function(id){
  const k=royalById(id);if(modalOpen||!householdActive(k)||whiteSpringInPalace(k))return;
  const h=ensureMarriedLife(k);if(!h.pending)makeHouseholdScene(k);
  const ev=householdSceneEvent(k);
  if(ev)pushEv(ev);else pushEv({title:'府中日常',cast:[k,k.spouse],text:`${k.name}与${k.spouse.name}近来平静度日。${h.project?'两人还在筹办'+h.project.title+'。':'府中没有新事请你定夺。'}`,choices:[{t:'让他们安心过日子'}]});save('auto');
};
A.householdProject=function(id){
  const k=royalById(id);if(modalOpen||!householdActive(k)||whiteSpringInPalace(k))return;
  const h=ensureMarriedLife(k),valid=()=>householdActive(k)&&!h.project&&S.turn-(h.lastProject??-99)>=12;
  if(!valid())return;
  pushEv({title:'一同经营的小事',cast:[k,k.spouse],valid,text:marriageProfileText(k,k.spouse)+'\n拨银十万两，两人会用三个月共同完成。',choices:[
    ...[['共校一册家藏书','lit'],['整理骑场与花径','mar'],['合办一场家宴','vir']].map(([title,stat])=>({t:title+' · 国库−10',cond:()=>valid()&&E().treasury>=10,f:()=>{if(!valid()||E().treasury<10)return null;E().treasury-=10;h.project={title,stat,due:S.turn+3};h.lastProject=S.turn;householdRecord(k,'household_project',`两人开始${title}，预期三个月完成。`);save('auto');return '府中已经着手安排，日后会有回信。';}})),{t:'暂不安排'}]});
};
function householdConcubineEvent(k,{initiative=false,sponsor=null}={}){
  if(householdConcubineReason(k))return null;
  const h=ensureMarriedLife(k);
  const valid=()=>!householdConcubineReason(k)&&(!initiative||k.spouse.trust<=50)&&
    (!sponsor||householdConcubineSponsors(k).some(e=>e.p.id===sponsor.p.id));
  if(!sponsor&&!householdConcubineWilling(k))return {title:'府中纳妾之议',cast:[k,k.spouse],text:`${k.name}说，眼下更愿与${k.spouse.name}安稳度日，并无纳妾之意。`,choices:[{t:'尊重他的意思',f:()=>{h.lastConcubine=S.turn;householdRecord(k,'household_concubine','谈起纳妾，自己表示无意，陛下未加催促。');save('auto');}}]};
  if(!h.concubineCandidate||royalHouseholdLifeActive()&&(h.concubineCandidate.sponsor??null)!==(sponsor?.p.id??null)){
    const age=ri(18,24),appearance=makeGirl({age,...(sponsor?{sur:sponsor.c.sur,fam:{...sponsor.c.fam}}:{})});
    h.concubineCandidate={id:'partner-'+k.id+'-'+(h.concubines.length+1),courtGuest:true,sex:'f',name:fullName(appearance),sur:appearance.sur,seed:appearance.seed,born:S.turn-appearance.age*12,alive:true,appearance,trust:55,
      ...(sponsor?{sponsor:sponsor.p.id}:{})};
  }
  const p=h.concubineCandidate,nature=marriageNature(k.spouse),loss=['好胜','敏感'].includes(nature.temperament)?20:10;
  const opening=sponsor?`${sponsor.p.name}与${k.name}近年有往来，托人递来族女${p.name}的名帖，愿她进王府，也盼两家走动更密。礼官已私下问过，她已成年，愿亲自来谈入府后的安排。`:
    initiative?`${k.name}与${k.spouse.name}近来相处疏淡，自己递来一封请示，询问可否让已经成年且愿意入府的${p.name}做妾。`:
    `${k.name}提起${p.name}，对方已成年，自愿入府。`;
  return {title:sponsor?'外家递帖 · 王府纳妾':initiative?'王府自行请议纳妾':'府中纳妾之议',cast:[k,k.spouse,p],valid,
    text:`${opening}\n嫡妻${k.spouse.name}${loss===20?'直言不愿，问旧日约定是否还算数。':'虽愿听完安排，仍盼自己的处境不被轻轻带过。'}\n纳妾需国库二十万两，嫡妻${householdAffectionLabel().slice(2)}将下降${loss}。`,choices:[
      {t:'准其纳妾 · 国库−20',cond:()=>valid()&&E().treasury>=20,f:()=>{
        if(!valid()||E().treasury<20)return null;
        E().treasury-=20;p.joinedAt=S.turn;h.concubines.push(p);delete h.concubineCandidate;h.lastConcubine=S.turn;
        changeHouseholdAffection(k,-loss);h.harmony=clamp((h.harmony??60)-12);
        householdRecord(k,'household_concubine',`${sponsor?sponsor.p.name+'荐送族女，':''}纳${p.name}入府为妾；嫡妻${k.spouse.name}心有不快，${householdAffectionLabel().slice(2)}下降${loss}。`);
        if(sponsor)courtPersonRecord({p:sponsor.p,e:sponsor,key:sponsor.key},`【王府往来】引荐族女${p.name}，奉准入${k.name}府。两家从此多了一重亲眷往来。`);
        save('auto');return '人已入府，夫妻之间的分歧也留了下来。';
      }},
      {t:'暂缓，先由夫妻把话说清楚',f:()=>{
        if(!valid())return null;
        h.lastConcubine=S.turn;changeHouseholdAffection(k,4);
        householdRecord(k,'household_concubine','纳妾之议暂缓，先与嫡妻谈清彼此的想法。');save('auto');return '名帖暂且收起，府中没有添人。';
      }},
      ...(royalHouseholdLifeActive()?[{t:'退回名帖，禁止皇子纳妾',f:()=>{
        if(!valid())return null;
        h.concubineBan=true;delete h.concubineCandidate;h.lastConcubine=S.turn;
        householdRecord(k,'household_concubine',`${sponsor?sponsor.p.name+'所递名帖退回。':''}奉旨禁止此后纳妾，府中照令办事。`);
        return '礼部已将禁令送至王府。';
      }}]:[])
    ]};
}
A.householdConcubine=function(id){
  if(modalOpen)return;
  pushEv(householdConcubineEvent(royalById(id)));
};
