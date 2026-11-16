/* The heir is the original household child, even after taking up the title. */
const princeSuccessionActive=()=>journalContentVersion()>=56;
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
const princeSons=k=>(k.household?.children||[]).filter(c=>c.sex==='m'&&c.alive!==false&&!c.princelySuccession)
  .sort((a,b)=>Number(b.mother===k.spouse?.id)-Number(a.mother===k.spouse?.id)||a.born-b.born);
const princeHeir=k=>princeSons(k).find(c=>c.id===princeSuccessionState(k)?.heir);
const princeSonMother=(k,son)=>[k.spouse,...k.household?.concubines||[]].find(p=>p?.id===son.mother);
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
    line=`【册封世子】${label}长史呈表，陛下准封${son.name}为世子。`;
  }
  princePersonNote(k,line);princePersonNote(son,line);
  if(k.spouse&&k.spouse!==mother&&k.spouse.alive!==false)princePersonNote(k.spouse,`${line}${inherit?'她出席丧仪，请长史照看府里余下的人。':'她同长史核对了新写的府册。'}`);
  if(mother?.alive!==false)princePersonNote(mother,`${line}${inherit?'她念及旧事，也盼孩子安稳接下府中事务。':'她闻讯后叮嘱孩子守礼读书。'}`);
  log(line,1);return line;
}
function princeSuccessionTick(){
  if(!princeSuccessionActive())return null;
  const memorials=[];
  for(const k of royalHouseholds().filter(princeEstateHolder)){
    if(k.alive&&!immortalAway(k)&&kidAge(k)>=70+Math.floor(mulberry32(k.seed||7)()*20)){
      k.alive=false;k.deathReason='寿终';
    }
    const sons=princeSons(k),estate=k.princeEstate||{};
    if(k.alive&&(!princeEstateAvailable(k)||!sons.length||princeHeir(k)))continue;
    if(estate.succession?.successor||!k.alive&&estate.succession?.death!==undefined)continue;
    k.princeEstate||={opened:S.turn};
    const state=k.princeEstate.succession||={};
    const heir=princeHeir(k);
    if(!k.alive){
      state.death=S.turn;
      const line=`【王府讣报】长史奏报${k.name}薨逝，${heir?`世子${heir.name}奉表请袭`:'王爵暂候朝廷议定'}。`;
      princePersonNote(k,line);if(k.spouse?.alive!==false)princePersonNote(k.spouse,`${line}府中开始治丧。`);
      if(heir)princePersonNote(heir,`${line}他在灵前守丧，等候朝廷回旨。`);
      log(line,1);memorials.push({k,text:line});
    }else if(state.nominated!==sons[0].id){
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
  const text=k.alive?(heir?`世子 ${heir.name}`:sons.length?'长史可呈表请封世子。':'王府目前无可请封的儿子。'):
    heir?`世子 ${heir.name} 等候袭爵。`:sons.length?'王爷生前未留下在世世子，长史请朝廷另议。':'暂无在世儿子可承袭。';
  const canReview=sons.length&&(k.alive?!heir&&princeEstateAvailable(k):princeProbate(k));
  const children=k.household?.children||[],family=children.map(c=>`<p>${esc(c.name)}${c.princelySuccession?' · 已袭爵':heir===c?' · 世子':''}${c.alive===false?' · 已故':''} <button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(c.id)})">读${esc(c.name)}的记事</button></p>`).join('');
  const partners=[k.spouse,...k.household?.concubines||[]].filter(p=>p&&(p.story?.length||children.some(c=>c.mother===p.id)));
  return `<p>${esc(text)}</p>${canReview?`<button class="btn jade" onclick="A.princeReviewSuccession(${id})">${k.alive?'批阅请封世子':'批阅请袭王爵'}</button>`:''}${k.princelySuccession?`<p><button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(k.princelySuccession.father)})">读先王的记事</button></p>`:''}${family}${partners.map(p=>`<p><button class="btn sm" onclick="A.princeFamilyMemo(${id},${royalActionArg(p.id)})">读${esc(p.name)}的记事</button></p>`).join('')}`;
}
A.princeReviewSuccession=function(id){
  const k=princeEstateById(id);if(!princeSuccessionActive()||modalOpen||S.over||!k)return;
  const inherit=!k.alive,heir=princeHeir(k);
  const valid=()=>!S.over&&princeEstateById(id)===k&&(inherit?princeProbate(k):princeEstateAvailable(k)&&!princeHeir(k));
  const candidates=inherit&&heir?[heir]:princeSons(k);
  if(!valid()||!candidates.length)return;
  pushEv({title:inherit?'长史奏报 · 请袭王爵':'长史奏报 · 请封世子',por:k,valid,
    text:inherit?`长史奏请承袭${princeEstateLabel(k)}。爵位获准后，继承人在${princeEstatePlace(k)}原府居住。`:`${princeEstateLabel(k)}长史递上宗谱和生辰册，按王妃所生之子、年长者优先列名，请陛下示下。`,
    choices:[...candidates.map(son=>({t:`${inherit?'准':'封'}${son.name}${inherit?'承袭':'为世子'}`,person:son,f:()=>{
      if(!valid()||!princeSons(k).includes(son)||inherit&&princeHeir(k)&&princeHeir(k)!==son)return null;
      k.princeEstate||={opened:S.turn};k.princeEstate.succession||={};
      return princeSeal(k,son,inherit);
    }})),{t:'留中待议'}]});
};
A.princeFamilyMemo=function(id,personId){
  const k=royalById(id);if(!princeSuccessionActive()||modalOpen||!k)return;
  const father=k.princelySuccession&&royalById(k.princelySuccession.father);
  const person=personId===father?.id?father:[...(k.household?.children||[]),k.spouse,...k.household?.concubines||[],father&&princeSonMother(father,k)].find(p=>p?.id===personId);
  if(person)pushEv({title:`${person.name}的记事`,por:person,text:person.story?.map(e=>`${e.d}　${e.t}`).join('\n')||'暂无记事。',choices:[{t:'合上册页'}]});
};
