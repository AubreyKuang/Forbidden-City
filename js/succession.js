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
  const mothers=new Map([[h.spouse.id,queen]]);
  for(const partner of household.concubines||[]){
    if(partner.alive===false||!partner.appearance)continue;
    const c=JSON.parse(JSON.stringify(partner.appearance));c.age=kidAge(partner);c.alive=true;
    addConsort(c,3,'潜邸旧人，随新帝入宫');mothers.set(partner.id,c);
  }
  for(const child of household.children||[]){
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
    if(current.has(k.id))continue;
    if(!cohorts.has(k.reign))cohorts.set(k.reign,[]);
    cohorts.get(k.reign).push(k);
  }
  return [...cohorts].flatMap(([reign,relatives])=>{
    const eligible=royalKinCandidates(relatives),ids=S.royalKinRoster?.[reign];
    return Array.isArray(ids)?eligible.filter(k=>ids.includes(k.id)):eligible.slice(0,ROYAL_KIN_PER_REIGN);
  });
}
function royalRelativeCards(relatives){
  return relatives.length?`<div class="grid portrait-grid">${relatives.map(k=>`<button class="card portrait-card" onclick="A.go('relative',${k.id})">${porImg(k,84)}<span class="grow"><strong>${esc(k.name)}</strong><small>${esc(royalKinship(k))} · ${kidAge(k)}岁${k.title?' · '+esc(k.title):''}${k.spouse?' · '+esc(k.spouse.name):''}</small><span>${esc(householdSummary(k))}</span></span></button>`).join('')}</div>`:'';
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
  return `${personBackButton('family')}<header class="detail-head">${porImg(k,224)}<div class="grow"><h2>${esc(k.name)}</h2><p>${esc(royalKinship(k))} · ${kidAge(k)}岁</p><p>生母 ${esc(k.momName||'未记载')}</p></div></header>${immortalPanel(k)}${marriagePanel(k)}${householdPanel(k)}${detailSection('亲族纪事',detailStory(k))}`;
}
