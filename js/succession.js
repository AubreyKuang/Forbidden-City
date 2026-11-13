/* Keep identities, families and portraits when the point of view changes reign. */
function dowagerPerson(d){return {...(d?.portrait||{isMom:true,seed:91}),alive:!!d?.alive};}
function makeDowager(c,relation){
  return {name:c?`${c.sur}太后`:'太后',fullName:c?fullName(c):'',personId:c?.id,relation,
    age:c?.age,atTurn:S.turn,portrait:c?{...JSON.parse(JSON.stringify(c)),portraitOverride:portraitCell(c),rank:8}:undefined,
    sur:c?.sur,fam:c?{...c.fam}:undefined,clan:c?clanKey(c):undefined,lastOffer:null,cooldown:24,
    alive:!!(c?.alive&&!c.gone&&!c.cold)};
}
function inheritDowager(h){
  const mother=byId(h.mom),queen=empress();
  const main=queen||mother;
  S.flags.dowager=makeDowager(main,main?.id===h.mom?'生母 · 先帝皇后':queen?'嫡母 · 先帝皇后':'生母');
  if(!queen&&main)S.flags.dowager.relation='生母';
  S.flags.birthDowager=mother&&mother.id!==main?.id?makeDowager(mother,'生母 · 尊为皇太后'):null;
  S.previousCourts ||= [];
  S.previousCourts.push({gen:S.gen,turn:S.turn,emperor:{...E()},consorts:JSON.parse(JSON.stringify(S.consorts))});
  if(S.previousCourts.length>5)S.previousCourts.shift();
  const relatives=S.children.filter(k=>k.id!==h.id).map(k=>({...k,reign:S.gen,kinship:k.born<=h.born?(k.sex==='m'?'皇兄':'皇姐'):(k.sex==='m'?'皇弟':'皇妹')}));
  S.royalRelatives=[...new Map([...(S.royalRelatives||[]),...relatives].map(k=>[k.id,k])).values()];
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

function royalRelativesPanel(){
  const relatives=royalHouseholds().filter(k=>!S.children.includes(k)&&k.alive);
  if(!relatives.length)return '';
  return `<section class="detail-section"><h3>先朝亲族</h3><div class="grid portrait-grid">${relatives.map(k=>`<button class="card portrait-card" onclick="A.go('relative',${k.id})">${porImg(k,84)}<span class="grow"><strong>${esc(k.name)}</strong><small>${esc(k.kinship||'宗亲')} · ${kidAge(k)}岁${k.spouse?' · '+esc(k.spouse.name):''}</small><span>${esc(householdSummary(k))}</span></span></button>`).join('')}</div></section>`;
}
function viewRoyalRelative(){
  const k=royalById(UI.sel);if(!k)return viewFamily();
  return `${personBackButton('family')}<header class="detail-head">${porImg(k,224)}<div class="grow"><h2>${esc(k.name)}</h2><p>${esc(k.kinship||'宗亲')} · ${kidAge(k)}岁</p><p>生母 ${esc(k.momName||'未记载')}</p></div></header>${marriagePanel(k)}${householdPanel(k)}${detailSection('亲族纪事',detailStory(k))}`;
}
