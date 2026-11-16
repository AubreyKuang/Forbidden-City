/* The ships and books produced by royal travel reforms belong to the court across reigns. */
const ROYAL_TRAVEL_VOYAGES={
 survey:{name:'巡海绘图',cost:18,months:3,order:'从明州沿岸北上，重测浅滩和可避风的泊地。',
  report:'舵手带回了新测的三处浅滩和一处避风锚地，愿把图交给各港舟师使用。',
  adopt:'把新图分发沿海各港',result:'沿海各港换用新图，避风锚地也添进候风簿。',effects:{wu:2,people:2}},
 envoy:{name:'出使东洋',cost:45,months:7,order:'载通译出海，重访当年交换船稿的港埠，议定互通风候、救助遇险船只的办法。',
  report:'使船带回对岸港埠的答书。当地愿互换潮表，也愿给误入外港的船提供引航。',
  adopt:'准两港互换潮表与引航名册',result:'两港开始交换潮表，遇雾和大风时各有可联络的引航人。',effects:{prestige:5,wen:2}},
 trade:{name:'往返东洋试办互市',cost:26,months:5,order:'随商舶远航，核记装卸、税银与来往货价。',
  report:'商舶平安返港，税银已交户部。随船账房请求公开两港货价，供后来商人校对。',
  adopt:'准明州与登州照册张榜',result:'两港公布了货价与实收税银，行商可凭榜核账。',effects:{people:3,prestige:1},revenue:48}
};
const ROYAL_TRAVEL_BOOKS={
 remedies:{name:'诸邦药录',intro:'译自西域医书，以对照小注记下药材产地和本朝可辨认的异名。',
  excerpt:'「同名之草，生于盐壤者味咸，生于石罅者味辛。须先详其地，不可见名便认其物。」卷末附上两地的草木图。',
  request:'请太医院校对药名',event:'太医院校录',report:'太医将药图同库中药材比过，找出两组易混的异名，草拟了一份验药小册。',
  adopt:'把验药小册发给官药局',result:'官药局收到验药小册，按图复核新收的草药。',effects:{wen:2,people:3}},
 atlas:{name:'海西道里图志',intro:'舆图旁附原文地名、音译和使者所记水程，方便对照不同商队的记法。',
  excerpt:'「由南港出，岸山并列如屏。向西行一日，水色转浅，舟人乃以长绳量水，不单凭岸影辨路。」',
  request:'请通译与舟师合校地名',event:'异域舆图校勘',report:'通译与舟师合校了三处异译的山口和港名，并出一张能同国内港图对读的校图。',
  adopt:'把校图送给沿海舟师',result:'明州和登州舟师已收到新校图，可比对地名与水程。文渊阁留了副本。',effects:{wen:3,wu:2}},
 calendar:{name:'西域历日推步',intro:'两种域外历书的合校稿，原有的闰法与本朝记时并列。',
  excerpt:'「月所行有迟疾，宜逐夜候之。连阴不能见，则记其阙，毋以臆数填实。」一页上还留着译者的验算墨迹。',
  request:'请钦天监比对候月记录',event:'钦天监对历',report:'钦天监核了两个月的候月记录，找出一处原译把望日与次日混记的问题，另附修订的换算表。',
  adopt:'将修订的换算表收入官历备查',result:'官历底册收入了修订表，译经院也把错处补进了新抄本。',effects:{wen:4,prestige:2}}
};
function travelInstitutionsActive(){return royalTravelActive();}
function royalTravelSponsor(id){return royalById(id)||royalTravelAcceded().find(k=>k.id===id);}
function travelInstitutionTick(){
 if(!travelInstitutionsActive()||S.over)return;
 const people=[...royalHouseholds(),...royalTravelAcceded()];
 for(const k of people){
  for(const key of Object.keys(k.royalTravel?.proposals||{}))noteRoyalTravelProposal(k,key,true);
 }
 const sponsors=people.filter(k=>
  ['east','scriptures'].includes(k.royalTravel?.itinerary)&&k.royalTravel.proposals?.home?.project?.expand?.report);
 if(!sponsors.length&&!S.travelInstitutions)return;
 const state=S.travelInstitutions||={commissions:[],ships:[],books:[]};
 for(const k of sponsors){
  if(state.commissions.includes(k.id))continue;
  state.commissions.push(k.id);
  if(k.royalTravel.itinerary==='east'){
   for(let i=0;i<3;i++){
    const id=state.ships.length+1;
    state.ships.push({id,name:`靖海${cnNum(id)}号`,source:k.id});
   }
  }else for(const key of Object.keys(ROYAL_TRAVEL_BOOKS)){
   const book=state.books.find(b=>b.key===key);
   if(book)book.sources.push(k.id);
   else state.books.push({key,sources:[k.id],catalogued:dateStr()});
  }
 }
 for(const ship of state.ships){
  const voyage=ship.voyage;
  if(!voyage||voyage.returned||S.turn<voyage.due)continue;
  voyage.returned=dateStr();
  const route=ROYAL_TRAVEL_VOYAGES[voyage.key],text=`${ship.name}结束「${route.name}」，平安返港。${route.report}`;
  const sponsor=royalTravelSponsor(ship.source);
  if(sponsor)kstory(sponsor,`【海船归报】${text}`);
  log(text,1);
  if(route.revenue)chg({treasury:route.revenue});
 }
}
function travelFleetPanel(){
 const ships=travelInstitutionsActive()?S.travelInstitutions?.ships:null;
 if(!ships?.length)return '';
 return `<section class="detail-section"><h3>水师船册</h3><ul class="story">${ships.map(ship=>{
  const v=ship.voyage,route=v&&ROYAL_TRAVEL_VOYAGES[v.key];
  const status=v&&!v.returned?`奉命「${route.name}」，距归期还有${royalTravelDuration(Math.max(1,v.due-S.turn))}。`:
   v&&!v.read?`已从「${route.name}」返港，归报待阅。`:v?`上次奉命「${route.name}」，${v.returned}返港，现可派遣。`:'在港待命。';
  return `<li><strong>${esc(ship.name)}</strong> · ${esc(status)}
  ${!v||v.read?`<button class="btn sm" onclick="A.travelShip(${ship.id})" ${S.over?'disabled':''}>派遣</button>`:
   v.returned?`<button class="btn sm" onclick="A.travelShip(${ship.id})" ${S.over?'disabled':''}>查看归报</button>`:''}</li>`;
 }).join('')}</ul></section>`;
}
function travelBookPanel(){
 const books=travelInstitutionsActive()?S.travelInstitutions?.books:null;
 if(!books?.length)return '';
 return `<section class="detail-section"><h3>译经院新藏</h3><ul class="story">${books.map(b=>{
  const d=ROYAL_TRAVEL_BOOKS[b.key],sponsors=b.sources.map(id=>royalTravelSponsor(id)?.name).filter(Boolean);
  const status=b.decision?'校阅已结案。':b.due==null?'':b.due<=S.turn?'校阅已回奏。':'副本已送去校阅。';
  return `<li><strong>《${esc(d.name)}》</strong> · ${esc(b.catalogued)}入藏
  ${sponsors.length?` · ${esc(sponsors.join('、'))}奏办`:''}<p>${esc(d.intro)}${esc(status)}</p>
  <button class="btn sm" onclick="A.travelBook('${b.key}')" ${S.over?'disabled':''}>翻阅</button>
  ${b.due<=S.turn&&!b.decision?`<button class="btn sm" onclick="A.travelBookReport('${b.key}')" ${S.over?'disabled':''}>看校阅回奏</button>`:''}</li>`;
 }).join('')}</ul></section>`;
}
function travelShipReport(ship){
 const voyage=ship.voyage,route=ROYAL_TRAVEL_VOYAGES[voyage.key];
 const valid=()=>!S.over&&ship.voyage===voyage&&!voyage.read;
 const settle=adopt=>{
  if(!valid())return null;
  voyage.read=true;
  if(!adopt)return null;
  const text=`${ship.name}归来后，陛下准议。${route.result}`;
  const sponsor=royalTravelSponsor(ship.source);
  if(sponsor)kstory(sponsor,`【海船余事】${text}`);
  log(text,1);return text+applyRoyalTravelEffects(route.effects);
 };
 return {title:`海船归报 · ${ship.name}`,valid,text:`${ship.name}已平安返港。${route.report}${route.revenue?`国库已收到税银${route.revenue}万两。`:''}`,
  choices:[{t:route.adopt,f:()=>settle(true)},{t:'收存航录，后议',f:()=>settle(false)}]};
}
function travelLibraryReport(book){
 const d=ROYAL_TRAVEL_BOOKS[book.key];
 const valid=()=>!S.over&&book.due<=S.turn&&!book.decision;
 const settle=adopt=>{
  if(!valid())return null;
  book.decision=adopt?'adopted':'archived';
  const text=`《${d.name}》校阅告毕。${adopt?d.result:'修订稿随译本留藏文渊阁。'}`;
  for(const id of book.sources){
   const sponsor=royalTravelSponsor(id);
   if(sponsor)kstory(sponsor,`【译书回报】${text}`);
  }
  log(text,1);return text+(adopt?applyRoyalTravelEffects(d.effects):'');
 };
 return {title:`${d.event} · 《${d.name}》`,valid,text:d.report,
  choices:[{t:d.adopt,f:()=>settle(true)},{t:'修订稿留藏文渊阁',f:()=>settle(false)}]};
}
function pendingTravelInstitutionEvent(){
 if(!travelInstitutionsActive()||S.over||!S.travelInstitutions)return null;
 const ship=S.travelInstitutions.ships.find(s=>s.voyage?.returned&&!s.voyage.read);
 if(ship)return travelShipReport(ship);
 const book=S.travelInstitutions.books.find(b=>b.due<=S.turn&&!b.decision);
 return book?travelLibraryReport(book):null;
}
A.travelShip=function(id){
 const ship=travelInstitutionsActive()?S?.travelInstitutions?.ships.find(s=>s.id===id):null;
 if(modalOpen||!ship||S.over)return;
 if(ship.voyage&&!ship.voyage.read){
  if(ship.voyage.returned)pushEv(travelShipReport(ship));
  return;
 }
 const previous=ship.voyage,valid=()=>!S.over&&ship.voyage===previous;
 pushEv({title:`水师派遣 · ${ship.name}`,valid,text:'请定下这艘船的航程。未返港前，船只不能再领差。',
  choices:[...Object.entries(ROYAL_TRAVEL_VOYAGES).map(([key,route])=>{
   const ready=()=>valid()&&E().treasury>=route.cost&&E().energy>0;
   return {t:`${route.name} · 国库−${route.cost} · 精力−1`,preview:`${route.order}${royalTravelDuration(route.months)}后返港。`,
    cond:ready,why:'国库或精力不足',f:()=>{
     if(!ready()||!useE())return null;
     ship.voyage={key,due:S.turn+route.months};
     const text=`${ship.name}奉命「${route.name}」，预计${royalTravelDuration(route.months)}后返港。`;
     log(text,1);return text+fx(chg({treasury:-route.cost}));
    }};
  }),{t:'维持待命'}]});
};
A.travelBook=function(key){
 const book=travelInstitutionsActive()?S?.travelInstitutions?.books.find(b=>b.key===key):null;
 if(modalOpen||!book||S.over)return;
 const d=ROYAL_TRAVEL_BOOKS[key],canRefer=()=>!S.over&&book.due==null;
 pushEv({title:`翻阅《${d.name}》`,text:`${d.intro}\n${d.excerpt}`,choices:[
  ...(canRefer()?[{t:d.request,preview:'两个月后回奏',f:()=>{
   if(!canRefer())return null;
   book.due=S.turn+2;
   const text=`从文渊阁取出《${d.name}》的抄本。奉旨：${d.request}，两个月后回奏。`;
   log(text,1);return text;
  }}]:[]),{t:'阅毕归架'}]});
};
A.travelBookReport=function(key){
 const book=travelInstitutionsActive()?S?.travelInstitutions?.books.find(b=>b.key===key):null;
 if(!modalOpen&&book&&!S.over&&book.due<=S.turn&&!book.decision)pushEv(travelLibraryReport(book));
};

function noteRoyalTravelProposal(k,key,archived=false){
 if(!travelInstitutionsActive())return;
 const r=k.royalTravel,proposal=r.proposals[key];
 if(proposal.recorded)return;
 proposal.recorded=true;
 const [name,details]=royalItinerary(r)[key];
 const text=`${k.name}${key==='road'?'从旅途中寄来手稿':'归来后呈上手记'}，提出「${name}」。${details}`;
 kstory(k,`【游历献策】${archived?'补录旧议。':''}${text}`);
 recordRoyalTravelKin(k,name,details);
}
function recordRoyalTravelKin(k,name,details,finished=false){
 if(!travelInstitutionsActive())return;
 const event=finished?'游历成事':'游历献策',subject=`${k.name}${finished?'办成了':'提出了'}「${name}」。${details}`;
 const mothers=royalTravelMothers(k);
 const birthMother=familyHostById(k.mom),house=birthMother&&houseOf(birthMother);
 for(const c of mothers){
  const feeling=finished?`她把回报抄了一份，想留下${k.name}独自看过世情、把所见办成实事的这一天。`:
   `她把方案逐页读完，为${k.name}肯把路上亲见的难处想成可行的办法而骄傲。回信里请孩子把最难的一条再讲给她听。`;
  story(c,`【${event}】${subject}${feeling}`);
  if(S.consorts.includes(c))cchg(c,{mood:finished?5:3});
 }
 if(!house)return;
 const people=[];
 for(const role of ['father',...brotherRoles(house)]){
  const p=officialPerson(house,role);if(!officialAlive(p))continue;
  const kin=role==='father'?'外公':'舅舅';
  const reply=finished?(role==='father'?'把实绩记入家簿，给外孙辈写信道贺。':'把回报读给家中晚辈听，提起外甥辈的本领颇为自豪。'):
   (role==='father'?'把手稿细读了两遍，写信赞成先把方案落到实处，说起孩子颇为骄傲。':'读过手稿便写信表示支持，还把自己知道的情形补记在信末，供孩子核对。');
  story(p,`【${event}】${subject}${kin}${p.name}${reply}`);
  people.push(`${kin}${p.name}`);
 }
 const aunts=paternalFamily(birthMother).filter(c=>c.id!==birthMother.id&&c.alive&&familyCourtHosts().includes(c)&&!mothers.includes(c));
 for(const c of aunts)story(c,`【${event}】${subject}姨母读过家书，把这件事记在自己的册子里，为孩子高兴。`);
 const reaction=people.length?`${people.join('、')}${finished?'得知成果，来信道贺。':'来信赞成这个办法，家中也收存了一份手稿。'}`:'外家把这件事记入家簿。';
 (house.travelStory||=[]).push({d:dateStr(),t:subject+reaction});
 if(people.length)kstory(k,`【外家回信】${reaction}`);
}
function royalTravelFamilyPanel(house){
 if(!travelInstitutionsActive()||!house?.travelStory?.length)return '';
 return `<h4>外家游历纪事</h4><ul class="story">${house.travelStory.slice(-4).reverse().map(e=>`<li><time>${esc(e.d)}</time>${esc(e.t)}</li>`).join('')}</ul>`;
}
