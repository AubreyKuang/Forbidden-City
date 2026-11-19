const GARDEN_FAMILY_SPOT = [117,35];
const GARDEN_ACTIVITIES = {
  toss: { label:'投壶', prompt:'花亭前摆好了远近两只铜壶。头一轮由你定玩法。', moves:[
    { label:'近壶试投 · 先让孩子和新手试手', bonus:14, skill:'mar' },
    { label:'两人接力 · 同席的人轮流投', bonus:5, skill:'mar', cooperate:true },
    { label:'挑战远壶 · 请擅射的人领投', bonus:-8, skill:'mar', showcase:true }
  ] },
  paint: { label:'共绘花枝', prompt:'案上铺着长幅花笺，石绿、胭脂和墨都已研好。你想怎么起笔？', moves:[
    { label:'先勾花枝 · 给初学的人留个样子', bonus:14, skill:'lit' },
    { label:'轮流添花 · 每人接着上一笔画', bonus:5, skill:'lit', cooperate:true },
    { label:'即兴设色 · 请擅画的人领笔', bonus:-8, skill:'lit', showcase:true }
  ] }
};
const gardenPlace = () => PLACES.find(p => p.id === 'yh');
const birthMonth = person => person.birthMonth ?? (Math.abs(person.seed || 0)%12+1);

const seasonalCourtFeasts = {
  newYear:{title:'新年宫宴',month:1},
  midAutumn:{title:'中秋宫宴',month:8}
};
const envoyFeastsActive=()=>journalContentVersion()>=79;
const hostsEnvoys=kind=>envoyFeastsActive()&&['newYear','midAutumn','emperor'].includes(kind);
const whiteSpringAudienceReady=()=>storyCastMeetReady('ayimu');
function envoyInvitationLabel(){
  if(!whiteSpringAudienceReady())return '请礼部邀在京使臣赴宴';
  return storyCastRecord('ayimu')?.stage?'请白泉国王与公主入席回话':'请白泉国王携阿依慕赴宴';
}
function envoySeatsPanel(draft){
  if(!hostsEnvoys(draft.kind))return '';
  return '<h3>外宾席</h3><div class="acts"><button class="btn sm '+(draft.envoys?'on':'')+'" aria-pressed="'+!!draft.envoys+'" onclick="A.banquetEnvoys()">'+envoyInvitationLabel()+'</button></div><p class="hint">'+
    (draft.envoys?'礼部已拟好请帖，开宴时为来使留席。再点可撤回。':'即使未发请帖，来使也可能在开宴时递上贺表。')+'</p>';
}
A.banquetEnvoys=function(){
  const draft=banquetDraft();
  if(modalOpen||!draft||!hostsEnvoys(draft.kind)||!banquetKind(draft.kind)?.ready)return;
  draft.envoys=!draft.envoys;render();
};
function receiveBanquetEnvoys(kind,title,invited){
  if(!hostsEnvoys(kind)||S.over||mourningActive()||(!invited&&!chance(.35)))return;
  const greeting={newYear:'奉上贺正国书',midAutumn:'携节礼前来拜节',emperor:'呈上祝寿国书'}[kind];
  if(journalContentVersion()>=84){
    if(S.flags.courtEnvoyTurn===S.turn&&!invited)return;
    S.flags.courtEnvoyTurn=S.turn;
  }
  pushNow(courtEnvoyEvent(title,greeting));
}
function courtEnvoyEvent(title,greeting){
  if(whiteSpringAudienceReady()){
    const r=storyCastRecord('ayimu');
    return {title:title+' · 白泉来使',text:'礼部通传，白泉国王携女儿'+greeting+'。'+
      (r?.stage?'公主在馆中住了些日子，今日愿将先前的婚议亲口答复。':'随行乐工把三面扁鼓抬到廊下，等候传召。'),
      choices:[{t:r?.stage?'请父女入席，听公主回话':'请父女入席，观白泉鼓舞',f:()=>{
        if(!whiteSpringAudienceReady())return null;
        const guest=storyCastRecord('ayimu')||storyCastCreate('ayimu');
        storyCastRecordLine(guest.person,'随父王赴'+title+'，以白泉国宾之礼入席。');
        pushNow(storyCastMeetEvent('ayimu',guest,title));return null;
      }},{t:'请礼部代收贺表，今日只设家席',f:()=>{log(title+'由礼部代受白泉贺表。');return '礼部将回帖送到馆中，国王领女儿谢过。';}}]};
  }
  const [region,gift]=pick([['西域','彩纹织毯'],['东瀛','描金漆匣'],['海西','琉璃杯']]);
  return {title:title+' · '+region+'使臣',text:region+'使臣'+greeting+'，并以一件'+gift+'为贺。通译捧着礼单候在阶下。',
    choices:[{t:'赐席，听使臣说说故乡的节俗',f:()=>{log(title+'赐席'+region+'使臣，听其讲述乡俗。');return '使臣谢过赐席，说起家乡筵席上主人怎样向远客致意。'+fx(chg({prestige:1}));}},
      {t:'请礼部答礼',f:()=>{log(title+'命礼部答谢'+region+'使臣。');return '礼官收下贺表，送使臣回馆。';}}]};
}
// The tribute itself keeps its ordinary inventory, costs and award choices.
function tributeEnvoyEvent(tribute){
  if(journalContentVersion()<84||S.over||mourningActive()||S.flags.courtEnvoyTurn===S.turn)return tribute;
  const occasion=S.month===1?'岁首朝贺':S.month===8?'中秋节礼':birthMonth(E())===S.month?'万寿朝贺':null;
  if((!tribute&&!occasion)||!chance(.35))return tribute;
  const visit=courtEnvoyEvent(occasion||'御前受贡',occasion==='万寿朝贺'?'呈上祝寿国书':'随贡使呈上国书');
  const mark=()=>{S.flags.courtEnvoyTurn=S.turn;};
  if(!tribute)return {...visit,onQueue:mark};
  const queue=tribute.onQueue,accept=tribute.choices[0].f;
  return {...tribute,text:tribute.text+'\n'+visit.text,onQueue:()=>{queue?.();mark();},
    choices:[...tribute.choices,{...visit.choices[0],f:()=>{accept?.();return visit.choices[0].f();}}]};
}

function midAutumnFamilyGifts(){
  harem().forEach(c=>c.mood=clamp(c.mood+6));
  kidsAlive().forEach(k=>k.love=clamp(k.love+5));
}
function midAutumnCourtEvent(){
  if(!banquetKind('midAutumn')?.ready)return null;
  const hold=invited=>{
    if(!banquetKind('midAutumn')?.ready||E().treasury<30)return null;
    (S.flags.seasonalFeasts||={}).midAutumn=S.year;
    midAutumnFamilyGifts();log('中秋家宴，六宫同乐。');
    const gains=chg({treasury:-30});receiveBanquetEnvoys('midAutumn','中秋宫宴',invited);
    return fx(gains)+'\n§后宫心情+6　皇嗣父爱+5';
  };
  return {title:'中秋家宴',text:'八月十五，月饼和桂花酒已经摆上长案。礼部来问，今年是否给外宾也留一席。',valid:()=>banquetKind('midAutumn')?.ready,
    choices:[{t:'设中秋家宴，六宫同乐（国库-30万两）',cond:()=>E().treasury>=30,f:()=>hold(false)},
      {t:'设宴，并'+envoyInvitationLabel()+'（国库-30万两）',cond:()=>E().treasury>=30,f:()=>hold(true)},
      {t:'简单赏月',f:()=>'你独自登上角楼赏月。'}]};
}

function capitalBanquetOfficial(p){
 return !!(p&&officialServing(p)&&officialGrade(p)&&!p.away&&!p.jailed&&!reliefSuspended(p)&&!/(知府|知州|知县|县令|总督|巡抚|道员|通判|县丞)/.test(p.office||p.post||''));
}
function birthdayKin(c){
 const h=c?.house;if(!h)return null;
 for(const role of ['father',...brotherRoles(h),...natalPeople(h).filter(p=>p.sex==='m'&&natalAge(p)>=18).map(p=>'relative'+p.id)]){
  const p=officialPerson(h,role);if(capitalBanquetOfficial(p))return {p,c,role};
 }
 return null;
}
function familyBirthdayEligible(c){
 return !!(storyIntroductionsActive()&&!S.over&&!mourningActive()&&inPalace(c)&&!c.maid&&c.rank>=5&&c.rank<8&&c.favor>=65&&birthMonth(c)===S.month&&c.birthFeastYear!==S.year&&birthdayKin(c));
}
function banquetPatron(kind,feast){
 if(!storyIntroductionsActive()||!(hostsEnvoys(kind)||kind==='empress'||feast.sponsor))return null;
 if(feast.sponsor)return feast.sponsor;
 if(kind==='empress'){const kin=birthdayKin(feast.host);if(kin)return kin;}
 // Use the registered office and its current holder, including officials unrelated to the birthday guest.
 const pool=[...scholarList().map(p=>({p})),...S.consorts.filter(c=>c.house).map(birthdayKin).filter(Boolean)].filter(s=>capitalBanquetOfficial(s.p));
 return pool.sort((a,b)=>Number(!/礼部|光禄寺/.test(a.p.office||a.p.post))-Number(!/礼部|光禄寺/.test(b.p.office||b.p.post))||officialGrade(a.p)-officialGrade(b.p))[0];
}
const FEAST_ARTISTS={xiaoman:'岑小满与搭档的铜钱戏法',suheng:'苏蘅当席辨香',hongjian:'薛红笺染笺题席签'};
function feastArtistReady(key){
 if(key==='hongjian')return hongjianContent()&&fenghuaEntryReady('xueHongjian');
 return Object.hasOwn(FEAST_ARTISTS,key)&&storyCastMeetReady(key)&&!storyCastRecord(key)?.stage;
}
function patronProgramPanel(draft,feast){
 const sponsor=banquetPatron(draft.kind,feast);if(!sponsor)return '';
 const buttons=Object.keys(FEAST_ARTISTS).filter(feastArtistReady).map(key=>
  `<button class="btn sm ${draft.artist===key?'on':''}" aria-pressed="${draft.artist===key}" onclick="A.banquetArtist('${key}')">${FEAST_ARTISTS[key]}</button>`).join('');
 return buttons?'<h3>大臣荐艺</h3><p>'+esc((sponsor.p.office||sponsor.p.post)+sponsor.p.name)+'呈上节目单，请陛下择一入席。</p><div class="acts">'+buttons+'</div>':'';
}
A.banquetArtist=function(key){
 const draft=banquetDraft();if(modalOpen||!draft||!banquetKind(draft.kind)?.ready||!Object.hasOwn(FEAST_ARTISTS,key)||!feastArtistReady(key)||!banquetPatron(draft.kind,banquetKind(draft.kind)))return;
 draft.artist=draft.artist===key?null:key;render();
};
function banquetArtistEvent(draft,feast){
 const sponsor=banquetPatron(draft.kind,feast);if(!sponsor)return null;
 const available=Object.keys(FEAST_ARTISTS).filter(feastArtistReady);
 const key=draft.artist||(available.length&&chance(.35)?pick(available):null);
 if(!available.includes(key))return null;
 const guestName=key==='hongjian'?'薛红笺':storyCastName(key),official=sponsor.p.name,occasion=feast.title;
 const proposal=key==='xiaoman'?'戏班摆下两只空碗，小满却先把搭档叫到身边：“我们俩合演。赏单上写几个人？”':
  key==='suheng'?'苏蘅随姑苏商队到京交货，带了两包都盖着苏家字号的香。她请席上先别点炉：“这一包是我们铺子的，另一包不是，得让送货的人也闻闻。”':
  '笺铺主人捧来两沓新染的席签，请宾客在灯下看两种纸色：“席签我写得。若要用我的诗，请把我的名字也落在上面。”';
 return {title:occasion+' · '+FEAST_ARTISTS[key],text:official+'具名引荐，礼官将人引到席前。'+proposal,valid:()=>feastArtistReady(key)&&capitalBanquetOfficial(sponsor.p)&&!S.over&&!mourningActive(),choices:[
  {t:key==='xiaoman'?'写上两个人的名字，请二人登席演出':key==='suheng'?'请她当席辨香，让掌事核清货单':'请她署名题诗，再听她谈笺铺',f:()=>{
   if(!feastArtistReady(key))return null;
   const line=occasion+'上，'+official+'引荐'+guestName+'，'+(key==='xiaoman'?'小满与搭档演完铜钱戏法，散席后将按两人的名册结工钱。':key==='suheng'?'苏蘅验明两包香的来路，替小铺保住了货款。':'薛红笺在席签上署了自己的名字。');
   if(sponsor.c)officialRecord(sponsor.c,sponsor.role,line,{family:false});else{story(sponsor.p,line);log(line);}
   if(feast.host&&feast.host!==E())story(feast.host,line);
   if(key==='hongjian'){createFenghuaPerson('xueHongjian',line);return line;}
   const r=storyCastRecord(key)||storyCastCreate(key);r.introduction='banquet';
   if(key==='xiaoman')r.performed=S.turn+1;
   return storyCastAdvance(r,r.person,line);
  }},{t:'今日照原席单，不添这一场'}]};
}

function banquetKind(kind) {
  if(storyIntroductionsActive()&&typeof kind==='string'&&kind.startsWith('family-')){
    const host=byId(Number(kind.slice(7)));if(!host)return null;
    return {host,sponsor:birthdayKin(host),title:fullName(host)+'生辰家宴',cost:0,ready:familyBirthdayEligible(host)};
  }
  const seasonal=Object.hasOwn(seasonalCourtFeasts,kind)&&seasonalCourtFeasts[kind];
  if(seasonal&&envoyFeastsActive())return {title:seasonal.title,cost:30,ready:!S.over&&!mourningActive()&&S.month===seasonal.month&&S.flags.seasonalFeasts?.[kind]!==S.year};
  if (kind === 'garden') return { title:'御花园小宴', cost:15,
    ready:!S.over && !mourningActive() && S.turn-(S.lastGardenBanquet ?? -3)>=3 };
  if (kind === 'duanwu') {
    const work=duanwuWork();
    return {title:'端午宴',cost:0,ready:!S.over&&!mourningActive()&&S.month===5&&work?.year===S.year&&work.stage==='finished'&&!work.held};
  }
  if (!['emperor','empress'].includes(kind)) return null;
  const host = kind === 'emperor' ? E() : empress();
  if (!host || (kind === 'empress' && !inPalace(host))) return null;
  const title = kind === 'emperor' ? '皇帝万寿宴' : '皇后千秋宴';
  return { title, host, cost:30, ready:!S.over && !mourningActive() && birthMonth(host)===S.month && host.birthFeastYear!==S.year };
}

function birthdayBanquetButtons() {
  const feasts = ['emperor','empress'].map(kind=>[kind,banquetKind(kind)]).filter(([,feast])=>feast);
  const seasonal=Object.keys(seasonalCourtFeasts).filter(kind=>banquetKind(kind)?.ready).map(kind=>
    `<button class="btn gold" onclick="A.openBanquet('${kind}')">筹办${seasonalCourtFeasts[kind].title}</button>`).join('');
  const family=storyIntroductionsActive()?harem().filter(familyBirthdayEligible).map(c=>
    `<button class="btn gold" onclick="A.openBanquet('family-${c.id}')">娘家请贺 · ${esc(fullName(c))}生辰</button>`).join(''):'';
  return `<div class="acts">${family}${seasonal}${feasts.map(([kind,feast])=>feast.ready
    ? `<button class="btn gold" onclick="A.openBanquet('${kind}')">筹办${feast.title}</button>`
    : `<span class="hint">${feast.title} · ${MONTHS[birthMonth(feast.host)-1]}${feast.host.birthFeastYear===S.year?'（本年已办）':''}</span>`).join('')}</div>`;
}

const banquetGuests = all => [...alive().filter(inPalace),
  ...kidsAlive().filter(k=>childInPalace(k)&&(all||kidAge(k)>=5))];
const banquetReady = () => banquetKind('garden').ready;
const banquetDraft = () => UI.view==='banquet' ? UI.banquet : null;

A.openBanquet = function(kind='garden') {
  if(modalOpen){toast('请先处理眼前的事件。');return;}
  if(mourningActive()){toast('太后新丧，本月宫中暂缓宴饮。');return;}
  const feast=banquetKind(kind);
  if(!feast?.ready){toast(feast?.host?`${feast.title}在${MONTHS[birthMonth(feast.host)-1]}举办${feast.host.birthFeastYear===S.year?'，本年已办过':''}。`:'眼下还不能筹办这场宴会。');return;}
  UI.banquet = { kind, activity:'toss', all:kind!=='garden', seats:[] };
  setScene('garden');
  A.go('banquet');
};

A.banquetActivity = function(activity) {
  const draft = banquetDraft();
  if (!draft || !Object.hasOwn(GARDEN_ACTIVITIES,activity)) return;
  draft.activity=activity;
  render();
};

function whiteSpringDancer(draft){
  if(draft?.kind!=='garden')return null;
  const dancer=byId(storyCastRecord('ayimu')?.id);
  return inPalace(dancer)&&!dancer.maid?dancer:null;
}
function seatedForDance(draft,c){return draft.all||draft.seats.includes(c.id);}
function danceFriend(dancer,c){
  return relGet(dancer,c)>=30&&!isRival(dancer,c)&&!isRival(c,dancer)&&!friendshipTense(dancer,c);
}
function gardenDrummers(draft,dancer){
  return (dancer.gardenDrummers||[]).map(byId).filter(c=>inPalace(c)&&!c.maid&&seatedForDance(draft,c)&&danceFriend(dancer,c));
}
function gardenDancePanel(draft){
  const dancer=whiteSpringDancer(draft);
  if(!dancer)return '';
  const seated=seatedForDance(draft,dancer);
  const options=[['solo','请阿依慕独舞'],...gardenDrummers(draft,dancer).map(c=>[c.id,'请'+fullName(c)+'伴鼓'])];
  return `<h3>白泉舞</h3>${seated?'':'<p class="hint">将阿依慕列入席单，便可请她献舞。</p>'}<div class="acts">${options.map(([key,label])=>
    `<button class="btn sm ${draft.dance===key?'on':''}" aria-pressed="${draft.dance===key}" ${seated?'':'disabled'} onclick="A.banquetDance('${key}')">${esc(label)}</button>`).join('')}${draft.dance?`<button class="btn sm quiet" onclick="A.banquetDance('')">撤下舞曲</button>`:''}</div>`;
}
A.banquetDance=function(key){
  const draft=banquetDraft(),dancer=whiteSpringDancer(draft);
  if(modalOpen||!dancer||!seatedForDance(draft,dancer))return;
  if(key==='')delete draft.dance;
  else if(key==='solo')draft.dance='solo';
  else{
    const partner=gardenDrummers(draft,dancer).find(c=>String(c.id)===key);
    if(!partner)return;
    draft.dance=partner.id;
  }
  render();
};
function checkDanceSeats(draft){
  if(!draft.dance)return;
  const dancer=whiteSpringDancer(draft);
  if(!dancer||!seatedForDance(draft,dancer)||(draft.dance!=='solo'&&!gardenDrummers(draft,dancer).some(c=>c.id===draft.dance)))delete draft.dance;
}

A.banquetInviteAll = function(all) {
  const draft = banquetDraft();
  if (!draft) return;
  if(draft.ranked){delete draft.ranked;draft.seats=[];}
  draft.all=all;
  checkDanceSeats(draft);
  render();
};

A.banquetRankSeats=function(){
  const draft=banquetDraft();if(!draft||modalOpen||!storyIntroductionsActive())return;
  const feast=banquetKind(draft.kind);if(!feast?.ready)return;
  // Respect a hand-picked guest list. An empty first draft starts with everyone.
  const people=draft.all||(!draft.ranked&&!draft.seats.length)?banquetGuests(true):banquetAttendees(draft,feast);
  const precedence=p=>p.sex?-2:p.maid?-1:p.rank;
  people.sort((a,b)=>precedence(b)-precedence(a)||(a.sex&&b.sex?a.born-b.born:b.favor-a.favor));
  draft.all=false;draft.ranked=true;draft.seats=people.map(p=>p.id);
  checkDanceSeats(draft);render();
};
A.banquetFirst=function(id){
  const draft=banquetDraft();if(!draft||modalOpen||draft.all)return;
  const i=draft.seats.indexOf(id);if(i<=0)return;
  draft.seats.splice(i,1);draft.seats.unshift(id);render();
};
function arrangedBanquetTables(draft,people){
  if(!draft.ranked)return draft.all?banquetTables(people):[people];
  const tables=[];for(let i=0;i<people.length;i+=4)tables.push(people.slice(i,i+4));
  return tables;
}
A.banquetGuest = function(id) {
  const draft = banquetDraft();
  if (!draft || draft.all || !banquetGuests(!!draft.ranked).some(p=>p.id===id)) return;
  const index=draft.seats.indexOf(id);
  if(index>=0&&draft.ranked&&banquetKind(draft.kind)?.host?.id===id)return;
  if (index>=0) draft.seats.splice(index,1);
  else if (draft.ranked||draft.seats.length<4) draft.seats.push(id);
  checkDanceSeats(draft);
  render();
};

A.banquetMove = function(index,direction) {
  const draft = banquetDraft();
  if (!draft || draft.all || ![-1,1].includes(direction)) return;
  const {seats}=draft, other=index+direction;
  if (!Number.isInteger(index)||index<0||index>=seats.length||other<0||other>=seats.length) return;
  [seats[index],seats[other]]=[seats[other],seats[index]];
  render();
};

function banquetAttendees(draft, feast) {
  const available = banquetGuests(draft.all||draft.ranked);
  const people = draft.all ? available : available.filter(p=>draft.seats.includes(p.id))
    .sort((a,b)=>draft.seats.indexOf(a.id)-draft.seats.indexOf(b.id));
  if ((draft.kind==='empress'||feast.sponsor) && !people.includes(feast.host)) people.unshift(feast.host);
  return people;
}

function banquetProblem(draft, feast, people) {
  if(mourningActive())return '太后新丧，本月宫中暂缓宴饮。';
  if (!feast?.ready) return '这场宴会目前不能举办。';
  if (people.length<(feast.host||Object.hasOwn(seasonalCourtFeasts,draft.kind)?1:2)||people.every(p=>p.sex)) return '还需选足宾客，并至少有一位妃嫔或宫人在席。';
  if (E().energy<=0) return '本月精力已尽。';
  if (feast.cost>0&&E().treasury<feast.cost) return '国库银两不足。';
  return '';
}

function banquetChildCount(children) {
  const sons=children.filter(k=>k.sex==='m').length;
  return `皇子 ${sons} 位 · 公主 ${children.length-sons} 位`;
}

function banquetGuestFamily(p,children) {
  if (p.sex) {
    const foster=fosterOf(p);
    return `${kidAge(p)}岁 · 生母 ${p.momName}${foster?` · 养母 ${fullName(foster)}`:''}`;
  }
  const own=children.filter(k=>k.mom===p.id);
  const raising=children.filter(k=>k.foster===p.id && k.mom!==p.id);
  return `亲生${banquetChildCount(own)}${raising.length?`　养育${banquetChildCount(raising)}`:''}`;
}

function viewBanquet() {
  const draft=banquetDraft(), feast=draft&&banquetKind(draft.kind);
  if (!feast) return viewMap();
  const people=banquetAttendees(draft,feast);
  const children=kidsAlive();
  const problem=banquetProblem(draft,feast,people);
  const guestCards = draft.all?'':banquetGuests(!!draft.ranked).filter(p=>!people.includes(p)).map(p=>
    `<button class="card" ${!draft.ranked&&draft.seats.length>=4?'disabled':''} onclick="A.banquetGuest(${p.id})">${porImg(p,40)}
      <span class="grow"><strong>${esc(familyName(p))}</strong>
      ${p.sex?'':`<small>${esc(p.trait)} · ${esc(p.t2)}</small>`}
      <small>${esc(banquetGuestFamily(p,children))}</small></span></button>`).join('');
  return `<h2>${feast.title} <button class="btn sm" onclick="arrive(gardenPlace())">返回御花园</button></h2>
    <p class="hint">在世皇嗣 · ${banquetChildCount(children)}</p>
    ${draft.kind==='empress'?`<p class="hint">寿星皇后 · ${esc(banquetGuestFamily(feast.host,children))}</p>`:''}
    <div class="acts"><button class="btn ${draft.all?'on':''}" aria-pressed="${draft.all}" onclick="A.banquetInviteAll(true)">全员宴请</button>
    <button class="btn ${!draft.all&&!draft.ranked?'on':''}" aria-pressed="${!draft.all&&!draft.ranked}" onclick="A.banquetInviteAll(false)">自选宾客</button>
    ${storyIntroductionsActive()?`<button class="btn ${draft.ranked?'on':''}" aria-pressed="${!!draft.ranked}" onclick="A.banquetRankSeats()">按位分一键排座</button>`:''}</div>
    ${(draft.ranked||draft.kind==='garden')&&people.length?banquetSeating(arrangedBanquetTables(draft,people)):''}
    ${draft.all
      ? `<p class="hint">全邀在宫的妃嫔、宫人与皇嗣，共 ${people.length} 位，其中${banquetChildCount(people.filter(p=>p.sex))}。按家人分桌，幼童可观礼。</p>`
      : `<h3>座次</h3><p class="hint">${draft.ranked?'每桌四人，同位分先按恩宠排列，皇嗣按长幼入席。可移到首席或逐席微调。':'自选至多四位宾客。相邻两人同玩一轮。'}${draft.kind==='empress'?'皇后为寿星，自动入席。':''}</p>
        <ol class="banquet-seats">${draft.seats.map((id,i)=>{
          const p=people.find(person=>person.id===id);
          return p?`<li><strong>${esc(familyName(p))}</strong><div class="acts">
            ${storyIntroductionsActive()?`<button class="btn quiet sm" aria-label="将${esc(familyName(p))}移到首席" ${i===0?'disabled':''} onclick="A.banquetFirst(${id})">移到首席</button>`:''}
            <button class="btn quiet sm" aria-label="${esc(familyName(p))}前移" ${i===0?'disabled':''} onclick="A.banquetMove(${i},-1)">前移</button>
            <button class="btn quiet sm" aria-label="${esc(familyName(p))}后移" ${i===draft.seats.length-1?'disabled':''} onclick="A.banquetMove(${i},1)">后移</button>
            <button class="btn quiet sm" aria-label="撤下${esc(familyName(p))}" ${draft.ranked&&p===feast.host?'disabled':''} onclick="A.banquetGuest(${id})">撤下</button></div>
            <div class="hint">${esc(banquetGuestFamily(p,children))}</div></li>`:'';
        }).join('')}</ol><div class="grid">${guestCards}</div>`}
    <p class="banquet-selection" role="status">已选：${draft.ranked?'按位分排座':draft.all?'全员宴请':'自选宾客'} · ${GARDEN_ACTIVITIES[draft.activity].label} · ${people.length} 位宾客</p><h3>席间活动</h3><div class="acts">${Object.entries(GARDEN_ACTIVITIES).map(([key,act])=>
      `<button class="btn sm ${draft.activity===key?'on':''}" aria-pressed="${draft.activity===key}" onclick="A.banquetActivity('${key}')">${act.label}</button>`).join('')}</div>
    ${patronProgramPanel(draft,feast)}${envoySeatsPanel(draft)}${gardenDancePanel(draft)}${workshopBanquetPanel(draft,people)}
    <div class="acts"><button class="btn gold" ${problem?'disabled':''} onclick="A.holdBanquet()">开宴<small>精力-1 · ${feast.cost?`国库-${feast.cost}万两`:feast.sponsor?'娘家出资':'筹备时已拨款'}</small></button></div>
    ${problem?`<p class="hint">${problem}</p>`:''}`;
}

function banquetTables(people) {
  const remaining=new Set(people), tables=[];
  const seat=(p,table)=>{if (remaining.delete(p)) table.push(p)};
  for (const k of people.filter(p=>p.sex && kidAge(p)>=5)) {
    if (!remaining.has(k)) continue;
    const family=mothersOf(k).filter(m=>remaining.has(m));
    if (!family.length) continue;
    const table=[];
    seat(family[0],table);
    seat(k,table);
    if (family[1]) seat(family[1],table);
    tables.push(table);
  }
  for (const p of remaining) {
    const parent=p.sex ? tables.find(t=>t.length<4 && mothersOf(p).some(m=>t.includes(m))) : null;
    let table=parent || tables.find(t=>t.length<4);
    if (!table) tables.push(table=[]);
    seat(p,table);
  }
  return tables;
}

function banquetSeating(tables) {
  return `<div class="garden-table-layout" aria-label="宴席座次">${tables.map((people,index)=>`
    <section class="garden-table" aria-label="第 ${index+1} 桌">
      <div class="garden-table-heading">${tables.length>1?`<strong>第 ${index+1} 桌</strong>`:''}
        ${index===0?`<div class="garden-table-host">${porImg('emp',42)}<span>主位 · 陛下</span></div>`:''}</div>
      <div class="garden-table-top" aria-hidden="true"><span></span><span></span><span></span></div>
      <ol class="garden-table-seats" role="list" aria-label="宾客席次">${people.map((p,i)=>
        `<li class="garden-table-seat" data-seat-person="${p.id}">
          ${porImg(p,48)}<span><small>第 ${i+1} 席</small><strong>${esc(familyName(p))}</strong></span>
        </li>`).join('')}</ol>
    </section>`).join('')}</div>`;
}

function banquetTalent(p, toss) {
  if (p.sex) return toss ? p.mar : p.lit;
  if (toss) return p.trait === '将门' || p.t2 === '擅骑射' ? 80 : 35;
  return p.talent + (p.like === '字画' ? 15 : 0);
}

A.holdBanquet = function() {
  const draft=banquetDraft(), feast=draft&&banquetKind(draft.kind);
  if (modalOpen || !feast || !Object.hasOwn(GARDEN_ACTIVITIES,draft.activity)) return;
  const people=banquetAttendees(draft,feast);
  const problem=banquetProblem(draft,feast,people);
  if (problem) {toast(problem);return}
  const activity=GARDEN_ACTIVITIES[draft.activity];
  const tables=arrangedBanquetTables(draft,people);
  pushEv({ title:`${feast.title} · ${activity.label}`, cast:people.slice(0,4), gardenTables:draft.ranked||draft.kind==='garden'?tables:null,
    text:`${people.length} 位宾客入席，分 ${tables.length} 桌。\n${activity.prompt}`,
    choices:[...activity.moves.map((move,i)=>({t:move.label, primary:i===0, f:()=>{
      playBanquet(draft,feast,people,tables,move);
      return null;
    }})), {t:'再看看席单'}] });
};

function performWhiteSpringDance(draft,people){
  if(!draft.dance)return null;
  const dancer=whiteSpringDancer(draft);
  if(!dancer||!people.includes(dancer))return null;
  const partner=people.find(c=>c.id===draft.dance);
  if(draft.dance!=='solo'&&!gardenDrummers(draft,dancer).includes(partner))return null;
  const guests=people.filter(c=>!c.sex&&!c.maid&&c!==dancer&&c!==partner);
  const learned=dancer.gardenDrummers||[];
  const pupil=guests.filter(c=>!learned.includes(c.id)&&danceFriend(dancer,c)).sort((a,b)=>relGet(dancer,b)-relGet(dancer,a))[0];
  const glimpses=new Map();
  for(const c of guests){
    const bond=relGet(dancer,c);
    let tone,line;
    if(c===pupil){
      tone='学鼓';line='听阿依慕又打了一遍收袖前的两记轻拍，接过小鼓试到合拍，约好下回为她伴奏。';
      (dancer.gardenDrummers||=[]).push(c.id);relAdd(c,dancer,3);
    }else if(danceFriend(dancer,c)){
      tone='欣赏';line=pick(['认出阿依慕收步前总要轻侧一下腕子，赶在银铃响起前便先叫了好。','见阿依慕一舞方歇，替她拢起垂到鼓边的长纱，问她故乡人怎样谢舞。']);relAdd(c,dancer,2);
    }else if(bond<=-25||isRival(dancer,c)||isRival(c,dancer)||(bond<15&&TRAITS[c.trait]?.jealous&&dancer.favor>=c.favor)){
      tone='吃醋';line=c.scheme>=60?'见陛下目光随阿依慕的舞袖转了一圈，也随众人拍了几下手。等乐工收鼓，才低声同贴身人说：“这一曲可真长。”':'原也跟着鼓声轻拍，见陛下一直望着阿依慕，便放下手里的拍板，低头拨弄杯盖。';cchg(c,{mood:-2});relAdd(c,dancer,-1);
    }else if(consortHobby(c)==='抚琴'){
      tone='听曲';line='听出阿依慕落脚总比银铃声早半拍，拿筷子在掌心试了两次，才摸清这支白泉舞的拍子。';relAdd(c,dancer,1);
    }else{
      tone='观礼';line=pick(['起初担心鼓面太窄，看到阿依慕稳稳收住脚尖，才放心随众人拍手。','留意到阿依慕足下的鼓声音色各异，散席后还记得最清亮的那一响。']);
    }
    story(c,'御花园小宴观白泉舞。'+line);
    if(!glimpses.has(tone))glimpses.set(tone,fullName(c)+line);
  }
  const song=partner?'《归泉》':'《泉上铃》';
  const line=partner?'随'+fullName(partner)+'的手鼓跳了'+song+'，听见熟悉的两记轻拍便收袖，两个人一同向上席行礼。':'应邀在御花园跳了家乡的'+song+'，收住脚步时，腕上的小银铃还在颤。';
  story(dancer,line+(pupil?' 歇曲时教'+fullName(pupil)+'学会了收拍。':''));cchg(dancer,{mood:4});
  if(partner){story(partner,'在御花园小宴为阿依慕伴鼓，照上回学的拍子送她收袖，一同谢席。');relAdd(dancer,partner,4);}
  log('御花园小宴，请阿依慕再跳白泉舞'+song+'。'+(partner?fullName(partner)+'为她伴鼓。':''));
  return {title:'御花园小宴 · '+song,por:dancer,portraitArt:WHITE_SPRING_DANCE_ART,
    text:'阿依慕'+line+'\n'+['学鼓','吃醋','欣赏','听曲','观礼'].map(t=>glimpses.get(t)).filter(Boolean).slice(0,3).join('\n'),choices:[{t:'接着用宴'}]};
}

function playBanquet(draft,feast,people,tables,move) {
  if (!useE()) return;
  E().treasury-=feast.cost;
  if (feast.host) feast.host.birthFeastYear=S.year;
  else if (draft.kind==='duanwu') duanwuWork().held=true;
  else if(Object.hasOwn(seasonalCourtFeasts,draft.kind)){
    (S.flags.seasonalFeasts||={})[draft.kind]=S.year;
    if(draft.kind==='midAutumn')midAutumnFamilyGifts();
  }else S.lastGardenBanquet=S.turn;
  const label=GARDEN_ACTIVITIES[draft.activity].label, toss=draft.activity==='toss';
  const dance=performWhiteSpringDance(draft,people);
  const lines=[];
  let entries=0, successes=0;
  for (const table of tables) {
    const players=table.filter(p=>!p.sex||kidAge(p)>=5);
    if (!players.length) continue;
    const skilled=players.reduce((best,p)=>banquetTalent(p,toss)>banquetTalent(best,toss)?p:best);
    for (const p of players) {
      const talent=banquetTalent(p,toss);
      const score=talent+move.bonus+(move.showcase && p!==skilled?Math.max(0,(banquetTalent(skilled,toss)-talent)*.4):0);
      if (score>=48) {
        successes++;
        if (p.sex) skillGain(p,move.skill,1);
        else cchg(p,{mood:move.showcase && p===skilled?5:3});
      }
      entries++;
    }
    for (let i=1;i<table.length;i++) {
      const a=table[i-1], b=table[i];
      if ((a.sex && kidAge(a)<5)||(b.sex && kidAge(b)<5)) continue;
      lines.push(banquetPair(a,b,label,toss,move));
    }
    for (let i=1;i<table.length-1;i++) {
      const k=table[i], left=table[i-1], right=table[i+1];
      if (!k.sex || kidAge(k)<5 || !k.foster || ![left.id,right.id].includes(k.mom) || ![left.id,right.id].includes(k.foster)) continue;
      if (relGet(left,right)>=-15) {
        relAdd(left,right,5);
        lines.push(`${k.name}请两位母亲也${toss?'各投一支':'各添一朵花'}。散席时，她们还在商量孩子下回想玩什么。`);
      } else {
        lines.push(`${k.name}来回给两位母亲看自己的${toss?'投壶成绩':'花笺'}。两人各夸了一句，仍有些拘束。`);
      }
    }
  }
  if (feast.host) {
    if(feast.sponsor){
      cchg(feast.host,{mood:10,aff:4});
      const line=feast.sponsor.p.name+'为'+fullName(feast.host)+'具帖贺寿，家中出了寿席的用度。';
      story(feast.host,line);officialRecord(feast.host,feast.sponsor.role,line,{family:false});lines.unshift(line);
    }else if (draft.kind==='empress') {
      const queen=feast.host;
      cchg(queen,{mood:16,aff:8});
      remember(queen,'bday','陛下在我生辰亲自主持千秋宴。');
      story(queen,'生辰设千秋宴，众人来贺。');
      lines.unshift('皇后受了众人的寿礼，请掌事姑姑把寿面先分给孩子们。');
    } else {
      chg({prestige:Math.min(5,2+successes)});
      for (const k of people.filter(p=>p.sex)) skillGain(k,'love',3);
      lines.unshift('众人向陛下贺寿，年幼的皇嗣跟着母亲行礼。');
    }
  }
  const follow=S.gardenPlans?.find(plan=>plan.turn===S.turn+2);
  const promise=follow? `\n§${familyName(kidById(follow.child)||byId(follow.guest))}约好两个月后再来御花园。`:'';
  const result=toss?`${successes} 人投中，共 ${entries} 人试投`:`${successes} 人完成画作，共 ${entries} 人执笔`;
  log(`${feast.title}，${people.length} 位宾客同席${label}。 ${result}。`);
  if(draft.kind==='duanwu')save('auto');
  UI.banquet=null;
  arrive(gardenPlace());
  const performance=storyCastBanquetPerformance()||storyCastLifeBanquet();if(performance)lines.unshift(performance);
  const program=performWorkshopProgram(draft,people);if(program)lines.unshift(program);
  const demand=proudBanquetGuest(people);
  if (demand) pushNow(proudDemandEvent(demand,people));
  pushNow({title:`${feast.title} · ${label}`, cast:people.slice(0,4), gardenTables:draft.ranked||draft.kind==='garden'?tables:null,
    text:`§${result}${promise}\n${lines.slice(0,6).join('\n')}`, choices:[ok1]});
  const incident=banquetFriendshipIncident(people,feast.title,feast.host);
  if(incident)pushNow({title:incident.title,cast:incident.cast,text:incident.text,choices:[{t:'记下席间这件事'}]});
  const guest=banquetArtistEvent(draft,feast);if(guest)pushNow(guest);
  if(dance)pushNow(dance);
  receiveBanquetEnvoys(draft.kind,feast.title,draft.envoys);
}

function banquetPair(a,b,label,toss,move) {
  const k=a.sex?a:b.sex?b:null;
  const mother=k && (!a.sex?a:!b.sex?b:null);
  if (mother && mothersOf(k).includes(mother)) {
    const trust=childTrust(k,mother), skill=banquetTalent(mother,toss);
    const opensUp=skill>=60 || trust>=48 || mother.t2==='护短' || mother.trait==='温婉' || move.cooperate;
    const action=toss
      ? skill>=60?`帮${k.name}扶稳手肘，下一支箭果然投中了`:`蹲下来陪${k.name}数投中的箭，没投中的也捡回来再试`
      : skill>=60?`在${k.name}画歪的花枝旁添了几笔，两人的画接在了一起`:`请${k.name}选花的颜色，两人一笔一笔填满了花笺`;
    const child=opensUp?`${cName(mother)}${action}。`:
      `${cName(mother)}递来${toss?'一支箭':'一支笔'}，两人先各自试了一回，后来才说上话。`;
    const adult=opensUp?`见${k.name}愿意让她帮忙，想以后再陪孩子${toss?'练一回':'画一幅'}。`:
      `见${k.name}还拘谨，便让孩子按自己的步调来。`;
    recordFamilyTime(k,mother,label,child,adult,{place:'御花园',gain:opensUp?11:5,stat:move.skill});
    if (opensUp && familyVisitAllowed(k,mother)) planGardenReunion({child:k.id,mother:mother.id,activity:label});
    return child;
  }
  if(storyIntroductionsActive()&&!a.sex&&!b.sex&&['broken','distant'].includes(friendshipArc(a,b)?.stage))
    return fullName(a)+'与'+fullName(b)+'照席次行过礼，各自用膳，没有再约散席后小坐。';
  const friendly=relGet(a,b)>=-25;
  const competitive=[a,b].find(p=>p.t2==='好胜'||(p.sex&&p.amb>=75));
  const lead=competitive || (banquetTalent(a,toss)>=banquetTalent(b,toss)?a:b);
  const peer=lead===a?b:a;
  const action=friendly
    ? competitive?'兴致正高，又邀身旁的人来一轮':toss?'示范如何瞄准壶口':'给身旁的人留了半张纸'
    : '行了礼，各做各的，席上没怎么搭话';
  relAdd(a,b,friendly?(move.cooperate?8:competitive?3:6):1);
  NPCMemory.record(S,{type:'garden-banquet',time:S.turn,location:'御花园',participants:[a.id,b.id],object:label},[
    {person:lead.id,subject:peer.id,interpretation:`与${familyName(peer)}同席${label}，${action}。`,emotion:friendly?.65:.12,impact:65},
    {person:peer.id,subject:lead.id,interpretation:friendly?`与${familyName(lead)}同席${label}，愿意下次再试。`:`小宴上与${familyName(lead)}同席，仍然生分。`,emotion:friendly?.55:.05,impact:64}
  ]);
  if (friendly && !a.sex && !b.sex) planGardenReunion({guest:lead.id,partner:peer.id,activity:label});
  return `${familyName(lead)}和${familyName(peer)}相邻。席间，${familyName(lead)}${action}。`;
}

function planGardenReunion(plan) {
  const plans=S.gardenPlans ||= [], turn=S.turn+2;
  const existing=plans.findIndex(item=>item.turn===turn);
  if (existing<0) plans.push({...plan,turn});
  else if (plan.child && !plans[existing].child) plans[existing]={...plan,turn};
}

function proudBanquetGuest(people) {
  if (S.over || S.turn-(S.flags.lastProudDemand ?? -4)<4) return null;
  return people.filter(c=>!c.sex && inPalace(c) && !c.maid && c.rank<8 && c.trait==='骄纵' &&
      c.favor>=(c.preg>=2?56:70)-4*(c.palacePrivilege||0))
    .sort((a,b)=>(b.favor+(b.preg>=2?16:0))-(a.favor+(a.preg>=2?16:0)))[0];
}

function proudDemandNotice() {
  const c=proudBanquetGuest(harem());
  return c?`<div class="acts"><button class="btn sm jade" onclick="A.hearProudDemand()">${esc(cName(c))} · ${c.preg>=2?'有孕请旨':'宫中起争执'}</button></div>`:'';
}

A.hearProudDemand = function() {
  if (modalOpen) return;
  const c=proudBanquetGuest(harem());
  if (c) pushEv(proudDemandEvent(c));
};

function proudDemandEvent(c,guests) {
  const atBanquet=!!guests, queen=empress();
  const present=guests||harem();
  const other=present.filter(p=>!p.sex&&p!==c&&p!==queen).sort((a,b)=>relGet(c,a)-relGet(c,b))[0];
  const witness=present.includes(queen)?queen:other;
  const name=cName(c), pregnancy=c.preg>=2, repeated=(c.palacePrivilege||0)>0;
  let text=atBanquet
    ? `正席上菜前，${name}看了眼席签：“${pregnancy?'臣妾近来有孕，坐远了怕照应不及':'陛下平日最懂臣妾的心'}，今日就让我坐在御座旁吧。”`
    : `${name}${pregnancy?'以有孕为由，叫御膳房先把别宫的燕窝送到自己宫里':'把内务府送往别宫的新缎截下，说自己要先挑'}。`;
  if (repeated) text+='她又道：“上回陛下也准了，怎么这回就不行？”';
  if (witness) text+=`\n${cName(witness)}${witness===queen?'放下茶盏：“有孕该照顾。各宫的分例和席次，也得有个准绳。”':'听见这话，默默把原本准备好的贺礼收回袖里。'}`;
  const settle=(decision)=>{
    S.flags.lastProudDemand=S.turn;
    let result;
    if (decision==='yield') {
      c.palacePrivilege=Math.min(3,(c.palacePrivilege||0)+1);
      cchg(c,{mood:12,favor:5,aff:4});
      if(witness){relAdd(c,witness,-14);cchg(witness,{mood:-9});}
      result=atBanquet?'你让人照她的意思改了座次。她笑着坐下，旁人少了几分谈兴。':'内务府照她的吩咐改了分例。下回她会记得，向你开口就能破例。';
    } else if (decision==='care') {
      cchg(c,{mood:5,aff:3});
      if(witness)relAdd(c,witness,3);
      result=pregnancy?'你请太医按她的需要开调养单，额外从御前支取。各宫原有的份例照发。':'你问她究竟缺什么，准她从御前另领一份。其他人的份例照旧。';
    } else {
      c.palacePrivilege=Math.max(0,(c.palacePrivilege||0)-1);
      cchg(c,{mood:-12,favor:-8,aff:-3});
      setXin(c,'委屈','越过宫规，当众被劝回');
      if(witness)cchg(witness,{mood:6,aff:3});
      result=atBanquet?'你示意她照原定座次入席。她没有再争，却比旁人早一步离席。':'你命内务府照例发放。她收下原有的份例，几日没再来御前。';
    }
    story(c,result);remember(c,decision==='rules'?'hurt':'care',result);
    if(witness)remember(witness,decision==='yield'?'hurt':'care',
      decision==='yield'?`陛下为${name}破例，我的话没有被听进去。`:
        decision==='care'?`陛下准许照顾${name}，各宫的份例照旧。`:`陛下听了宫中各人的话，仍按原来的规矩办。`);
    log(`${name}因${atBanquet?'席次':'分例'}请旨。 ${result}`);
    return result;
  };
  return {title:atBanquet?'席间争座':pregnancy?'恃宠争例':'内务府争执',cast:[c,witness],text,choices:[
    {t:'这回依她',f:()=>settle('yield')},
    {t:pregnancy?'照顾身孕，席次和分例照旧':'另给她一份，其他人照旧',f:()=>settle('care')},
    {t:'按宫规办',f:()=>settle('rules')}
  ]};
}

function showGardenReunion() {
  const reunion=S.banquetReunion;
  if (!reunion || reunion.turn!==S.turn || reunion.joined) return null;
  const first=kidById(reunion.child)||byId(reunion.guest);
  const second=byId(reunion.mother||reunion.partner);
  if(storyIntroductionsActive()&&!first?.sex&&first&&second&&friendshipTense(first,second))return null;
  if (!(first?.sex ? familyVisitAllowed(first,second) : inPalace(first)&&inPalace(second))) return null;
  return {reunion,first,second};
}

A.joinGardenReunion = function() {
  const meeting=showGardenReunion();
  if (!meeting || modalOpen) return;
  const {reunion,first,second}=meeting;
  setScene('garden');
  pushEv({title:'御花园赴约',cast:[first,second],text:reunion.text,choices:[
    {t:'陪他们再玩一轮',f:()=>{
      reunion.joined=true;
      if (first.sex) skillGain(first,reunion.activity==='投壶'?'mar':'lit',2);
      else cchg(first,{aff:3,mood:4});
      cchg(second,{aff:3,mood:4});
      return `${familyName(first)}见你来了，把身旁的位置让给你。`;
    }}, {t:'让他们自己玩'}]});
};

function gardenFamilyMoment() {
  const moment = currentFamilyMoment();
  return moment?.place === '御花园' ? moment : null;
}

function gardenFamilyNotice() {
  const meeting=showGardenReunion();
  if(meeting)return `<section class="initiative-note">${activityPortraits(meeting.first,meeting.second)}<p>${esc(meeting.reunion.text)}</p><button class="btn sm jade" onclick="A.joinGardenReunion()">去御花园赴约</button></section>`;
  const moment=gardenFamilyMoment();
  return moment?`<section class="initiative-note">${activityPortraits(kidById(moment.child),byId(moment.mother))}<p>${esc(moment.text)}</p><button class="btn sm quiet" onclick="A.go('kid',${moment.child})">看看孩子</button></section>`:'';
}
