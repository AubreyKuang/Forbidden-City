/* Royal residences use the same child and household records across reigns. */
const PRINCE_FIEFS=['西安','太原','开封'];
const princeEstateLabel=k=>k.title?`${k.title}府`:`${k.name}王府`;
const princeFief=k=>PRINCE_FIEFS.includes(k.princeEstate?.location)?k.princeEstate.location:'';
const princeEstatePlace=k=>k.away?princeFief(k)||'外地封地':'京城';
const princeEstateEligible=k=>!!k?.alive&&k.sex==='m'&&!!(k.princeEstate||k.away)&&!k.removedFromRoyal&&!k.pendingName&&S.heir!==k.id;
const princeEstateById=id=>{const k=royalById(id);return princeEstateEligible(k)?k:null;};
const princeEstateAvailable=k=>princeEstateEligible(k)&&!k.jailed&&!k.templeStay&&!immortalAway(k)&&!k.gone;
function princeEstateLink(k){
  return princeEstateEligible(k)?`<button class="btn sm jade" onclick="A.go('prince-estate',${k.id})">查看王府</button>`:'';
}
function princeEstatesPanel(){
  const princes=royalHouseholds().filter(princeEstateAvailable).sort(royalBirthOrder);
  const group=(title,people)=>people.length?detailSection(title,`<div class="grid">${people.map(k=>
    `<button class="card" onclick="A.go('prince-estate',${k.id})">${porImg(k,44)}<span class="grow"><b>${esc(princeEstateLabel(k))}</b><small>${esc(k.reign?`${royalKinship(k)} ${k.name}`:k.name)} · ${esc(princeEstatePlace(k))}${k.royalKinContact?.reply?.unread?' · 有回信':''}</small></span></button>`).join('')}</div>`):'';
  return princes.length?`<section class="palace-activity"><h3>王府</h3>${group('京中王府',princes.filter(k=>!k.away))}${group('外地藩邸',princes.filter(k=>k.away))}</section>`:'';
}
const princeMoveWait=k=>Math.max(0,(k.princeEstate?.lastMove??-99)+6-S.turn);
const princeMoveReady=k=>!S.over&&princeEstateAvailable(k)&&kidAge(k)>=16&&!princeMoveWait(k)&&!k.royalKinContact?.pending;
function viewPrinceEstate(){
  const k=princeEstateById(UI.sel);if(!k)return viewOut();
  const local=!k.away, mother=k.reign&&familyHostById(k.mom);
  const motherLink=mother?.familyArchive?`<button class="person-link" onclick="A.go('consort',${mother.id})">${esc(k.momName||fullName(mother))}</button>`:outsideMotherLink(k);
  const caption=local?'京中开府':princeFief(k)?`就藩 · ${princeFief(k)}`:'已就藩 · 藩地未载';
  const wait=princeMoveWait(k);
  const res=princeEstateAvailable(k)?`<div class="acts"><button class="btn jade" onclick="A.princeEstateMove(${k.id})" ${princeMoveReady(k)?'':'disabled'}>${local?'商议就藩':'奉诏回京'}${wait?`<small>还需 ${wait} 个月</small>`:''}</button>
    ${!local&&!princeFief(k)&&princeMoveReady(k)?`<button class="btn" onclick="A.princeRegisterFief(${k.id})">补录藩地</button>`:''}</div>`:'';
  const state=!princeEstateAvailable(k)?`${childWhereabouts(k)} · 暂停王府往来`:k.royalKinContact?.pending?'家书已经寄出，等收到回信后再议行止。':!local&&wait?`回京还需等 ${wait} 个月。`:local?'在京居住，可到府探望，也可另议出京就藩。':'藩邸由王府料理，地方政务仍归有司。';
  return `<button class="btn quiet sm" onclick="A.go('out')">← 返回出巡</button>
    <header class="detail-head">${porImg(k,112)}<div class="grow"><p>${esc(caption)} · ${kidAge(k)}岁</p><h2>${esc(princeEstateLabel(k))}</h2><p>${esc(k.reign?`${royalKinship(k)} ${k.name}`:k.name)} · 生母 ${motherLink}</p></div></header>
    ${pageChapters('prince-estate',[
      ['residence','居处与藩务',detailSection('居处',`<p>${esc(state)}</p>${res}`)],
      ['family','家人与往来',royalKinContactButtons(k,true)+marriagePanel(k)+householdPanel(k)],
      ['history','王府记事',detailStory(k)]
    ])}`;
}
function princeEstateRecord(k,line){
  if(k.reign){kstory(k,line);const mother=familyHostById(k.mom);if(mother?.alive)story(mother,line);}
  else childSeparationMemory(k,line,k.away?-.25:.35);
  log(line,1);
}
function princeFiefChoices(k,register=false){
  const valid=()=>princeEstateById(k.id)===k&&princeMoveReady(k)&&(register?k.away&&!princeFief(k):!k.away);
  const chooseFief=location=>()=>{
    if(!valid())return null;
    k.princeEstate={...k.princeEstate,opened:k.princeEstate?.opened??S.turn,location,...(register?{}:{lastMove:S.turn})};
    if(!register){k.away=true;k.sup=clamp((k.sup||0)-20);}
    const line=register?`宗人府补录${k.name}的藩邸在${location}。`:`${k.name}奉诏离京，赴${location}就藩，由长史料理府务，地方政务仍归有司。`;
    princeEstateRecord(k,line);return line;
  };
  return {title:register?'王府 · 补录藩地':'王府 · 商议就藩',por:k,valid,
    text:register?'旧册只记了他已就藩。请选择要补录的藩邸。':`${k.name}入殿听旨。请择一处藩邸，他将离京赴任，在京的储位支持会下降。`,
    choices:[...PRINCE_FIEFS.map(place=>({t:register?`录入${place}`:`命他赴${place}就藩`,f:chooseFief(place)})),{t:'暂缓'}]};
}
A.princeRegisterFief=function(id){
  const k=princeEstateById(id);if(!modalOpen&&k?.away&&!princeFief(k)&&princeMoveReady(k))pushEv(princeFiefChoices(k,true));
};
A.princeEstateMove=function(id){
  const k=princeEstateById(id);if(modalOpen||!princeMoveReady(k))return;
  if(!k.away){pushEv(princeFiefChoices(k));return;}
  const valid=()=>princeEstateById(id)===k&&k.away&&princeMoveReady(k);
  pushEv({title:'王府 · 奉诏回京',por:k,valid,text:`${k.name}在${princeEstatePlace(k)}居住。若奉诏回京，改住京中王府，今后可当面见他。`,choices:[
    {t:'下诏召他回京',f:()=>{if(!valid())return null;
      k.away=false;k.princeEstate={...k.princeEstate,opened:k.princeEstate?.opened??S.turn,location:'京城',lastMove:S.turn};
      const line=`${k.name}奉诏回京，迁入京中王府。`;princeEstateRecord(k,line);return line;
    }},{t:'暂缓'}]});
};
