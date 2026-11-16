/* The heir is the original household child, even after taking up the title. */
const princeSuccessionActive=()=>journalContentVersion()>=56;
const princeAdoptionActive=()=>journalContentVersion()>=57;
const royalActionArg=id=>esc(JSON.stringify(id));
const princeSuccessionState=k=>k.princeEstate?.succession;
function princelyDescendants(roots){
  if(!princeSuccessionActive())return [];
  const holders=[];
  const add=owner=>{
    for(const child of owner.household?.children||[]){
      if(child.princelySuccession){holders.push(child);add(child);}
    }
  };
  roots.forEach(add);
  return holders;
}
const princeProbate=k=>princeSuccessionActive()&&princeEstateHolder(k)&&!k.alive&&princeSuccessionState(k)?.death!==undefined&&!princeSuccessionState(k).successor;
function princeFamilyChildren(k){
  const biological=k.household?.children||[], adopted=princeAdoptionActive()?princeSuccessionState(k)?.adoptions:undefined;
  if(!adopted?.length)return biological;
  return [...biological,...adopted.map(({id,from})=>royalById(from)?.household?.children?.find(c=>c.id===id)).filter(Boolean)];
}
const princeResidentChildren=k=>princeFamilyChildren(k).filter(c=>!princeAdoptionActive()||!c.princeAdoption||c.princeAdoption.family===k.id);
const princeSons=k=>princeResidentChildren(k).filter(c=>c.sex==='m'&&c.alive!==false&&!c.princelySuccession)
  .sort((a,b)=>Number(b.mother===k.spouse?.id)-Number(a.mother===k.spouse?.id)||a.born-b.born);
const princeHeir=k=>princeSons(k).find(c=>c.id===princeSuccessionState(k)?.heir);
const princeSonMother=(k,son)=>[k.spouse,...k.household?.concubines||[]].find(p=>p?.id===son.mother);
function princeBiologicalParents(son){
  const father=son.princeAdoption&&royalById(son.princeAdoption.from);
  return {father,mother:father&&princeSonMother(father,son)};
}
function princeAdoptionCandidates(k){
  if(!princeAdoptionActive()||princeSons(k).length)return [];
  return royalHouseholds().filter(b=>b!==k&&b.sex==='m'&&!b.princeAdoptionOrigin&&!b.removedFromRoyal&&!b.lost&&
    (k.princelySuccession||b.princelySuccession?b.father!=null&&b.father===k.father:k.reign!=null?b.reign===k.reign:S.children.includes(k)&&S.children.includes(b)))
    .flatMap(b=>(b.household?.children||[]).filter(c=>c.sex==='m'&&c.alive!==false&&!c.princelySuccession&&!c.princeAdoption&&princeSuccessionState(b)?.heir!==c.id)
      .map(son=>({brother:b,son})));
}
function princePersonNote(p,line){
  if(p){p.story||=[];kstory(p,line);}
}
function princeSeal(k,son,inherit){
  const state=princeSuccessionState(k);
  const place=princeEstatePlace(k),label=princeEstateLabel(k),mother=princeSonMother(k,son);
  let line;
  if(inherit){
    const {succession,...estate}=k.princeEstate;
    son.title=k.title||'亲王';son.away=!!k.away;son.alive??=true;son.love??=50;
    son.princelySuccession={father:k.id,at:S.turn};
    son.princeEstate={...estate,inheritedAt:S.turn};
    delete k.princeEstate.docket;
    state.successor=son.id;
    line=`【袭爵】长史呈报${k.name}薨逝。陛下准${son.name}承袭${son.title}，仍居${place}的原王府。`;
    if(kidAge(son)<15)line+='新王尚幼，府中庶务由长史暂理。';
    UI.sel=son.id;
  }else{
    state.heir=son.id;
    line=`【${princeAdoptionActive()&&state.vacancy?'另立世子':'册封世子'}】${label}长史呈表，陛下准封${son.name}为世子。`;
  }
  princePersonNote(k,line);princePersonNote(son,line);
  if(k.spouse&&k.spouse!==mother&&k.spouse.alive!==false)princePersonNote(k.spouse,`${line}${inherit?'她出席丧仪，请长史照看府里余下的人。':'她同长史核对了新写的府册。'}`);
  if(mother?.alive!==false)princePersonNote(mother,`${line}${inherit?'她念及旧事，也盼孩子安稳接下府中事务。':'她闻讯后叮嘱孩子守礼读书。'}`);
  if(inherit&&princeAdoptionActive()&&son.princeAdoption){
    const birth=princeBiologicalParents(son);
    if(birth.father?.alive)princePersonNote(birth.father,`${line}他听闻亲生儿子袭爵，嘱咐常通家书。`);
    if(birth.mother&&birth.mother.alive!==false)princePersonNote(birth.mother,`${line}她收下喜信，仍惦记孩子在嗣府的起居。`);
  }
  if(princeAdoptionActive())delete state.vacancy;
  log(line,1);return line;
}
const princeLifespan=k=>70+Math.floor(mulberry32(k.seed||7)()*20);
function princeHeirVacancy(k){
  const state=princeSuccessionState(k);
  if(!princeAdoptionActive()||state?.heir===undefined||state.successor)return '';
  const heir=princeFamilyChildren(k).find(c=>c.id===state.heir);
  if(!heir)return '';
  if(heir.alive!==false&&(kidAge(heir)>=princeLifespan(heir)||Number.isFinite(heir.hp)&&heir.hp<=0)){
    heir.alive=false;heir.deathReason=kidAge(heir)>=princeLifespan(heir)?'寿终':'病故';
  }
  if(heir.alive!==false)return '';
  delete state.heir;
  state.vacancy={id:heir.id,name:heir.name,at:S.turn};
  const next=princeSons(k)[0],adoption=princeAdoptionCandidates(k)[0];
  state.nominated=next?.id??null;
  state.adoptionOffered=adoption?.son.id??null;
  const request=next?(k.alive?'请旨重新册立世子':'请旨另议袭爵人选'):adoption?'请旨从兄弟家议立嗣子':'府中无在世子嗣，等候朝廷议定';
  const line=`【世子讣报】${princeEstateLabel(k)}长史奏报世子${heir.name}${k.alive?'先于王爷离世':'尚未袭爵便已离世'}，${request}。`;
  princePersonNote(k,line);princePersonNote(heir,line);
  const birth=heir.princeAdoption?princeBiologicalParents(heir):{mother:princeSonMother(k,heir)};
  if(birth.mother&&birth.mother.alive!==false)princePersonNote(birth.mother,`${line}她收起孩子用过的旧物。`);
  if(birth.father?.alive)princePersonNote(birth.father,`${line}他将讣信留在书案上，许久未动。`);
  if(k.spouse&&k.spouse!==birth.mother&&k.spouse.alive!==false)princePersonNote(k.spouse,`${line}她同长史安排丧仪。`);
  log(line,1);return line;
}
function princeSuccessionTick(){
  if(!princeSuccessionActive())return null;
  const memorials=[];
  for(const k of royalHouseholds().filter(princeEstateHolder)){
    const vacancy=princeHeirVacancy(k);
    if(vacancy)memorials.push({k,text:vacancy});
    if(k.alive&&!immortalAway(k)&&kidAge(k)>=princeLifespan(k)){
      k.alive=false;k.deathReason='寿终';
    }
    const sons=princeSons(k),estate=k.princeEstate||{},adoption=princeAdoptionCandidates(k)[0];
    if(k.alive&&(!princeEstateAvailable(k)||!sons.length&&!adoption||princeHeir(k)))continue;
    if(estate.succession?.successor)continue;
    k.princeEstate||={opened:S.turn};
    const state=k.princeEstate.succession||={};
    const heir=princeHeir(k);
    if(!k.alive&&state.death===undefined){
      state.death=S.turn;
      const line=`【王府讣报】长史奏报${k.name}薨逝，${heir?`世子${heir.name}奉表请袭`:adoption?'府中无在世儿子，长史请择嗣承袭':'王爵暂候朝廷议定'}。`;
      if(adoption)state.adoptionOffered=adoption.son.id;
      princePersonNote(k,line);if(k.spouse?.alive!==false)princePersonNote(k.spouse,`${line}府中开始治丧。`);
      if(heir)princePersonNote(heir,`${line}他在灵前守丧，等候朝廷回旨。`);
      log(line,1);memorials.push({k,text:line});
    }else if(adoption&&state.adoptionOffered!==adoption.son.id){
      state.adoptionOffered=adoption.son.id;
      const line=`【议请过继】${princeEstateLabel(k)}无在世儿子，长史呈上兄弟各房宗谱，请旨择立嗣子。`;
      princePersonNote(k,line);log(line);
      memorials.push({k,text:line});
    }else if(k.alive&&sons.length&&state.nominated!==sons[0].id){
      state.nominated=sons[0].id;
      const line=`【请封世子】${princeEstateLabel(k)}长史奉表，请陛下核定世子。`;
      princePersonNote(k,line);princePersonNote(sons[0],`${line}府里已经核对他的生辰和宗谱。`);log(line);
      memorials.push({k,text:line});
    }
  }
  if(!memorials.length)return null;
  const single=memorials.length===1;
  return {title:'王府长史 · 请封与承袭',text:memorials.map(m=>m.text).join('\n'),choices:[
    {t:single?'前往王府批阅':'查看各府奏报',f:()=>{A.go(single?'prince-estate':'out',single?memorials[0].k.id:null);return null;}},{t:'稍后批阅'}]};
}
function princeSuccessionPanel(k){
  if(!princeSuccessionActive())return '';
  const heir=princeHeir(k),sons=princeSons(k),id=royalActionArg(k.id);
  const vacancy=princeAdoptionActive()?princeSuccessionState(k)?.vacancy:null,adoption=princeAdoptionCandidates(k).length;
  const pendingLoss=princeAdoptionActive()&&princeSuccessionState(k)?.heir!==undefined&&!heir;
  const text=k.alive?(heir?`世子 ${heir.name}`:pendingLoss?'世子已故，等长史递报。':vacancy?`原世子${vacancy.name}已故，世子位空缺。`:sons.length?'长史可呈表请封世子。':'王府目前无可请封的儿子。'):
    heir?`世子 ${heir.name} 等候袭爵。`:sons.length?'王爷生前未留下在世世子，长史请朝廷另议。':'暂无在世儿子可承袭。';
  const canReview=!pendingLoss&&(k.alive?!heir&&princeEstateAvailable(k):princeProbate(k));
  const children=princeFamilyChildren(k),family=children.map(c=>{
    const adopted=princeAdoptionActive()&&c.princeAdoption;
    const birth=adopted&&adopted.family===k.id?princeBiologicalParents(c):null;
    const parents=birth?[['生父',birth.father],['生母',birth.mother]].map(([label,p])=>p?`<button class="person-link" onclick="A.princeFamilyMemo(${id},${royalActionArg(p.id)})">${label} ${esc(p.name)}</button>`:'').filter(Boolean).join(' · '):'';
    return `<p>${esc(c.name)}${adopted?(adopted.family===k.id?' · 嗣子':' · 已过继'):''}${c.princelySuccession?' · 已袭爵':heir===c?' · 世子':''}${c.alive===false?' · 已故':''} <button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(c.id)})">读${esc(c.name)}的记事</button>${parents?`<br>${parents}`:''}</p>`;
  }).join('');
  const partners=[k.spouse,...k.household?.concubines||[]].filter(p=>p&&(p.story?.length||children.some(c=>c.mother===p.id)));
  return `<p>${esc(text)}</p>${canReview&&sons.length?`<button class="btn jade" onclick="A.princeReviewSuccession(${id})">${k.alive?vacancy?'批阅另立世子':'批阅请封世子':'批阅请袭王爵'}</button>`:''}
    ${canReview&&adoption?`<button class="btn jade" onclick="A.princeReviewAdoption(${id})">批阅过继</button>`:''}
    ${k.princelySuccession?`<p><button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(k.princelySuccession.father)})">读先王的记事</button></p>`:''}${family}${partners.map(p=>`<p><button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(p.id)})">读${esc(p.name)}的记事</button></p>`).join('')}`;
}
A.princeReviewSuccession=function(id){
  const k=princeEstateById(id);if(!princeSuccessionActive()||modalOpen||S.over||!k)return;
  const inherit=!k.alive,heir=princeHeir(k);
  const valid=()=>!S.over&&princeEstateById(id)===k&&(!princeAdoptionActive()||princeSuccessionState(k)?.heir===undefined||!!princeHeir(k))&&(inherit?princeProbate(k):princeEstateAvailable(k)&&!princeHeir(k));
  const candidates=inherit&&heir?[heir]:princeSons(k);
  if(!valid()||!candidates.length)return;
  const replacement=princeAdoptionActive()&&!!princeSuccessionState(k)?.vacancy;
  pushEv({title:inherit?'长史奏报 · 请袭王爵':replacement?'长史奏报 · 另立世子':'长史奏报 · 请封世子',por:k,valid,
    text:inherit?`长史奏请承袭${princeEstateLabel(k)}。爵位获准后，继承人在${princeEstatePlace(k)}原府居住。`:`${princeEstateLabel(k)}长史递上宗谱和生辰册，按王妃所生之子、年长者优先列名，请陛下示下。`,
    choices:[...candidates.map(son=>({t:`${inherit?'准':'封'}${son.name}${inherit?'承袭':'为世子'}`,person:son,f:()=>{
      if(!valid()||!princeSons(k).includes(son)||inherit&&princeHeir(k)&&princeHeir(k)!==son)return null;
      k.princeEstate||={opened:S.turn};k.princeEstate.succession||={};
      return princeSeal(k,son,inherit);
    }})),{t:'留中待议'}]});
};
A.princeReviewAdoption=function(id){
  const k=princeEstateById(id);
  if(!princeAdoptionActive()||modalOpen||S.over||!k)return;
  const inherit=!k.alive;
  const valid=()=>!S.over&&princeEstateById(id)===k&&princeSuccessionState(k)?.heir===undefined&&!princeSons(k).length&&(inherit?princeProbate(k):princeEstateAvailable(k));
  const candidates=princeAdoptionCandidates(k);
  if(!valid()||!candidates.length)return;
  pushEv({title:'长史奏报 · 议请过继',por:k,valid,
    text:`${princeEstateLabel(k)}无在世儿子。长史已核过宗谱，请从兄弟之家议立嗣子。受继者的生父母仍载在原有宗谱中。`,
    choices:[...candidates.map(({brother,son})=>({t:`准${brother.name}之子${son.name}过继${inherit?'并承袭':'为世子'}`,person:son,f:()=>{
      if(!valid()||!princeAdoptionCandidates(k).some(c=>c.brother===brother&&c.son===son))return null;
      k.princeEstate||={opened:S.turn};
      const state=k.princeEstate.succession||={};
      (state.adoptions||=[]).push({id:son.id,from:brother.id});
      son.princeAdoption={family:k.id,from:brother.id,at:S.turn};
      const line=`【王府过继】长史奉旨将${brother.name}之子${son.name}录为${k.name}的嗣子。`;
      princePersonNote(k,line);princePersonNote(son,`${line}两府亲缘都记入宗谱，往后仍可向生父母问安。`);
      if(brother.alive)princePersonNote(brother,`${line}他亲自送孩子出门，嘱咐常通家书。`);
      const mother=princeSonMother(brother,son);
      if(mother&&mother.alive!==false)princePersonNote(mother,`${line}她替孩子理好随身衣箱，惦记他能否住得惯。`);
      if(k.spouse&&k.spouse.alive!==false)princePersonNote(k.spouse,`${line}她令人收拾住处，也请长史把孩子旧日的起居习惯记下。`);
      log(line,1);return `${line}\n${princeSeal(k,son,inherit)}`;
    }})),{t:'留中待议'}]});
};
A.princeFamilyMemo=function(id,personId){
  const k=royalById(id);if(!princeSuccessionActive()||modalOpen||!k)return;
  const father=k.princelySuccession&&royalById(k.princelySuccession.father);
  const birth=princeAdoptionActive()&&k.princeAdoption?princeBiologicalParents(k):null;
  const children=princeFamilyChildren(k);
  const originalParents=princeAdoptionActive()?children.filter(c=>c.princeAdoption?.family===k.id).flatMap(c=>Object.values(princeBiologicalParents(c))):[];
  const family=[...children,k.spouse,...k.household?.concubines||[],father&&princeSonMother(father,k),birth?.father,birth?.mother,...originalParents];
  const person=personId===father?.id?father:family.find(p=>p?.id===personId);
  if(person)pushEv({title:`${person.name}的记事`,por:person,text:person.story?.map(e=>`${e.d}　${e.t}`).join('\n')||'暂无记事。',choices:[{t:'合上册页'}]});
};
