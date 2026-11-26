/* Treasury receipts, named appointments and the life of a working court. */
function legacyPendingAction(){return typeof PalaceActions!=='undefined'&&PalaceActions.legacy;}
let exhaustedMonthNotice=null;
const EXHAUSTED_MONTH_DELAY=1500;
function exhaustedMonthReady(){
  if(!S||S.over||E().energy>0||modalOpen||Q.length)return false;
  if(!playtestFeedbackActive())return S.flags.exhaustedTurn===S.turn;
  return journalContentVersion()>=80&&typeof DEV!=='undefined'&&DEV.autoMonth&&$('#dev-panel')?.hidden===true;
}
function clearExhaustedMonthNotice(){
  if(exhaustedMonthNotice&&typeof clearTimeout==='function')clearTimeout(exhaustedMonthNotice.timer);
  exhaustedMonthNotice=null;
  const notice=$('#month-notice');if(notice)notice.hidden=true;
  const app=$('#app');if(app)app.inert=false;
}
// Start the visual pause only after the action and its pending scene are saved.
// The timer is UI state, never part of a save or its deterministic replay.
function syncExhaustedMonthNotice(){
  if(!exhaustedMonthReady()||PalaceActions.replaying||PalaceActions.blocked){clearExhaustedMonthNotice();return;}
  if(exhaustedMonthNotice?.state===S&&exhaustedMonthNotice.turn===S.turn)return;
  clearExhaustedMonthNotice();
  const next={...S,month:S.month%12+1,year:S.year+(S.month===12?1:0)};
  const notice=$('#month-notice');
  if(notice){
    $('#month-notice-date').textContent='即将进入'+(S.month===12?dateStr(next):MONTHS[next.month-1]);
    notice.hidden=false;
  }
  const app=$('#app');if(app)app.inert=true;
  const pending={state:S,turn:S.turn,gen:S.gen};
  exhaustedMonthNotice=pending;
  pending.timer=setTimeout(()=>{
    if(exhaustedMonthNotice!==pending)return;
    clearExhaustedMonthNotice();
    if(S!==pending.state||S.gen!==pending.gen||S.turn!==pending.turn||PalaceActions.blocked||!exhaustedMonthReady())return;
    // Record an ordinary month-end action, so loading it never depends on this browser's switch.
    if(playtestFeedbackActive())A.endMonth();else A.completeExhaustedMonth(pending.gen,pending.turn);
  },EXHAUSTED_MONTH_DELAY);
}
A.completeExhaustedMonth=function(gen,turn){
  if(!exhaustedMonthReady()||S.gen!==gen||S.turn!==turn)return;
  A.endMonth();
  if(S.turn!==turn)delete S.flags.exhaustedTurn;
};
function settleExhaustedMonth(previous){
  if(!S||S.over)return;
  if(playtestFeedbackActive()){delete S.flags.exhaustedTurn;return;}
  if(previous?.gen===S.gen&&previous.turn===S.turn&&previous.emp.energy>0&&E().energy<=0)S.flags.exhaustedTurn=S.turn;
  if(E().energy>0){delete S.flags.exhaustedTurn;return;}
  if(S.flags.exhaustedTurn!==S.turn||modalOpen||Q.length)return;
  // Old transcripts include the month inside the original action. Keep that
  // behavior until their pending scene ends so existing saves still replay.
  if(PalaceActions.immediateMonth){
    const turn=S.turn;A.endMonth();
    if(S.turn!==turn)delete S.flags.exhaustedTurn;
  }else if(pendingDelivery())A.resumeBirth(pendingDelivery().id);
}
function governance(){
  S.governance||={receipts:[],visits:[],seenVisits:[]};
  const g=S.governance;
  if(g.gen!==S.gen){g.gen=S.gen;g.tax='regular';g.posts={};g.visits=[];g.seenVisits=[];}
  return g;
}
const TAX_PLANS={regular:{name:'依定额征收',rate:1,people:0},light:{name:'减免三成秋税',rate:.7,people:5}};
function taxEstimate(){return Math.round((380+E().people*3)*TAX_PLANS[governance().tax].rate);}
function treasuryReceipt(type){return governance().receipts.find(r=>r.gen===S.gen&&r.year===S.year&&r.type===type);}
function annualRevenueTick(){
  const type=S.month===10?'tax':S.month===1?'tribute':null;if(!type||treasuryReceipt(type))return null;
  const g=governance(),amount=type==='tax'?taxEstimate():120;
  const row={gen:S.gen,year:S.year,turn:S.turn,date:dateStr(),type,amount,policy:g.tax};
  g.receipts.push(row);E().treasury+=amount;
  let text;
  if(type==='tax'){
    chg({people:TAX_PLANS[g.tax].people});
    text=`户部核销各地秋粮与田赋，按「${TAX_PLANS[g.tax].name}」实收入库 ${amount} 万两。${g.tax==='light'?'蠲免的三成不再向百姓追征，州县已张榜晓谕。':'此为年度田赋结算，月常入另记，不向百姓另加摊派。'}`;
    settleMinistryTax(row);
  }else{
    const v=ensureJewelry(),ids=Object.keys(JEWELRY),least=Math.min(...ids.map(id=>v.received[id]||0));
    const id=pick(ids.filter(id=>(v.received[id]||0)===least));row.jewelry=id;
    v.stock[id]=(v.stock[id]||0)+1;v.received[id]=(v.received[id]||0)+1;v.lastTribute=S.turn;
    jewelryRecord(`岁贡：${JEWELRY[id].name}一件收入内库。`);
    text=`各地岁贡抵京：折色银 ${amount} 万两收入国库，${JEWELRY[id].name}一件交内库收存。进献按定额办理，不额外索取。`;
  }
  row.text=text;log(text,1);
  return {title:type==='tax'?'户部 · 秋税入库':'岁首 · 各地进献',jewelry:row.jewelry,text:text+'\n可在「治国理政」查阅收支簿。',choices:[{t:'知道了'}]};
}
function applyTaxPlan(id){
  if(S.over||!TAX_PLANS[id]||treasuryReceipt('tax')||governance().tax===id||!useE())return false;
  governance().tax=id;log(`谕户部：今年秋税${TAX_PLANS[id].name}。`,1);
  return true;
}
A.taxPlan=function(id){
  if(!modalOpen&&applyTaxPlan(id))render();
};
const GOVERNMENT_POSTS={
  jiangnan:{name:'江南知府',army:false,min:45,away:true,detail:'查验田亩、安顿流民，离京赴任。'},
  river:{name:'河道总督',army:false,min:65,away:true,detail:'统筹河工与漕粮，需熟练调度。'},
  revenue:{name:'户部侍郎',army:false,min:60,away:false,detail:'入京掌钱粮核销，担负岁入审核。'},
  frontier:{name:'北境守备',army:true,min:50,away:true,detail:'驻守边关，照料军粮与军户。'},
  guard:{name:'京营统领',army:true,min:65,away:false,detail:'回京整训禁军，不再兼领边镇。'}
};
function postHolder(id){
  const post=GOVERNMENT_POSTS[id];if(!post)return null;
  const holds=e=>e&&officialAlive(e.p)&&!e.p.retired&&!e.p.dismissed&&!e.p.exiled&&e.p.office===post.name;
  const key=governance().posts[id],e=key&&officialEntry(key);
  return holds(e)?e:officialEntries().find(holds)||null;
}
function canTransfer(e,id){const t=GOVERNMENT_POSTS[id];return !!(t&&e&&officialServing(e.p)&&!e.p.report&&!reliefSuspended(e.p)&&e.p.age<70&&e.p.ability>=t.min&&t.army===(e.h.bloc==='army')&&!postHolder(id)&&e.p.office!==t.name&&S.turn-(e.p.lastTransfer??-99)>=6);}
function transferOfficial(e,id){
  if(!canTransfer(e,id)||E().treasury<20||!useE())return null;
  const t=GOVERNMENT_POSTS[id],p=e.p,old=p.office||p.post;
  if(careersActive())careerSetOffice({p,e,key:e.key},t.name,'吏部调任');else{p.office=t.name;p.post=t.name;}p.away=t.away;p.lastTransfer=S.turn;governance().posts[id]=e.key;chg({treasury:-20});
  const task=`由${old}调任${t.name}${t.away?'，离京赴任':'，在京供职'}`;
  officialRecord(e.c,e.role,task+'，限半年内呈报任上实绩。');officialFamilyReaction(e,'transfer',task);
  p.postReview={due:S.turn+6,office:t.name,from:old,contact:e.c.id};
  return `${p.name}${task}。吏部已发任牒，沿途交接费用支出 20 万两。`;
}
function postingTick(){
  for(const e of officialEntries()){
    const r=e.p.postReview;if(!r||S.turn<r.due)continue;delete e.p.postReview;
    if(!officialAlive(e.p)||e.p.retired||e.p.dismissed||e.p.exiled||e.p.office!==r.office)continue;
    if(e.p.report||e.p.commission||e.p.incognitoCase){r.due=S.turn+1;e.p.postReview=r;continue;}
    const good=chance(.3+e.p.ability/160),task=`${r.office}半年考课`;
    const text=good?`${e.p.name}到任后核清积案，任内办事期限与账目相合，吏部考课为良。`:`${e.p.name}到任后未能理清积案，吏部要求列出限期补办清单，不能只报喜讯。`;
    e.p.merit=clamp(e.p.merit+(good?10:-5));chg({people:good?3:-2});
    officialRecord(e.c,e.role,text,{emotion:good?.5:-.4});officialFamilyReaction(e,good?'success':'setback',task,good?'到任后的半年考课已出。积案已核清，期限与账目相符，考评为良。':undefined);
    e.p.report={title:task,text,outcome:good?'success':'setback',turn:S.turn};
  }
}
A.postCandidates=function(id){
  if(modalOpen||S.over||!GOVERNMENT_POSTS[id])return;
  const t=GOVERNMENT_POSTS[id],candidates=officialEntries().filter(e=>canTransfer(e,id));
  pushEv({title:'吏部调任 · '+t.name,text:t.detail+`\n需才干至少 ${t.min}，在任且无未结差事；调任后半年考课。`+(candidates.length?'':'\n暂无符合条件的官员。'),choices:[
    ...candidates.map(e=>({t:`${e.p.name} · ${e.p.office||e.p.post} · 才干 ${e.p.ability}`,person:e.p,cond:()=>canTransfer(e,id)&&E().energy>0&&E().treasury>=20,why:'需精力 1、国库 20，且职位空缺',f:()=>transferOfficial(e,id)})),{t:'暂不调任'}]});
};
function governmentTaskEvent(id,docket){
  if(S.over||!OFFICIAL_TASKS[id])return null;
  const t=OFFICIAL_TASKS[id],entries=officialEntries().filter(e=>officialActionReady(e,'commission')&&
    t.army===(journalContentVersion()>=147?officialMilitary(e.p,e.h):e.h.bloc==='army'));
  return {title:t.title,text:`需 ${t.months} 个月，拨款 ${t.cost} 万两。${t.brief||'择人领差，办结后据实回奏。'}\n${entries.length?'请选承办官员。':'暂无可领此差的官员，可等在外官员回奏后再安排。'}`,choices:[
    ...entries.map(e=>({t:`${e.p.name} · ${e.p.office||e.p.post} · 才干 ${e.p.ability}`,person:e.p,cond:()=>officialActionReady(e,'commission')&&E().energy>0&&E().treasury>=t.cost,why:'精力或国库不足，或已有未结差事',f:()=>assignOfficialTask(e,id,docket)})),{t:'暂缓'}]};
}
A.governmentTask=function(id){
  if(!modalOpen)pushEv(governmentTaskEvent(id));
};
function viewGovernment(){
  const g=governance(),receipt=treasuryReceipt('tax');
  const ready=ministryDockets().filter(d=>ministryDocketReady(d)||ministryAftermathReady(d)).length;
  return `${pageHeading('治国理政','用人、钱粮、民间见闻，都须有去处，也有回音。')}<div class="acts page-actions">${monthlyCourtButton()}<button class="btn" data-onclick="A.go('officials')">官员表</button><button class="btn" data-onclick="A.go('ministries')">六部${ready?`<small>${ready} 份回奏待阅</small>`:''}</button><button class="btn" data-onclick="A.go('jinyiwei')">锦衣卫</button><button class="btn" data-onclick="A.go('out')">微服问民情</button></div>
  ${typeof examSchedulePanel==='function'?examSchedulePanel():''}
  ${palaceKinPetitionsPanel()}${careerReportsHTML()}
  ${pageChapters('government',[
    ['tax','户部岁入',`<section class="detail-section"><p>每年十月结算秋税，正月收取岁贡银 120 万两与珍饰一件。月常入与俸禄仍逐月结算。</p><p>${receipt?`本年秋税已实收 ${receipt.amount} 万两。`:`今年采用「${TAX_PLANS[g.tax].name}」，按当前民心估计秋税 ${taxEstimate()} 万两。`}</p><div class="acts">${Object.entries(TAX_PLANS).map(([id,p])=>`<button class="btn sm" data-onclick="A.taxPlan('${id}')" ${receipt||g.tax===id||E().energy<1?'disabled':''}>${p.name} · 精力−1${id==='light'?' · 秋税入库时民心+5':''}</button>`).join('')}</div><ul class="story">${g.receipts.slice(-8).reverse().map(r=>`<li><time>${esc(r.date)}</time>${esc(r.text)}</li>`).join('')||'<li>尚未到年度入库时节。</li>'}</ul></section>`],
    ['posts','吏部调度',`<section class="detail-section"><p class="hint">调任需精力 1、交接银 20 万两。同一官员半年内不再调任，在途差务、致仕或获罪期间不可调动。</p><div class="grid">${Object.entries(GOVERNMENT_POSTS).map(([id,p])=>{const e=postHolder(id);return `<article class="card government-post"><h3>${p.name}</h3><p>${p.detail}</p>${e?`<p>${officialLink(e.c,e.role)} · ${officialStatus(e.p)}</p>`:`<button class="btn sm jade" data-onclick="A.postCandidates('${id}')">择人调任</button>`}</article>`;}).join('')}</div></section>`],
    ['tasks','治事与回奏',`<section class="detail-section"><div class="grid government-tasks">${Object.entries(OFFICIAL_TASKS).map(([id,t])=>`<button class="card" data-onclick="A.governmentTask('${id}')"><div><b>${t.title}</b><p>${t.brief||'择人领差，期满回奏。'}</p><small>${t.months}个月 · 国库 ${t.cost} · ${t.army?'武职':'文职'}</small></div></button>`).join('')}</div></section>`],
    ['people','民情回访',incognitoLedger()],
    ['foreign','邦交与使节',diplomacyPanel()]
  ])}`;
}

/* 邻国及使节：任务与真实在任官员关联，回国后保留外交记录。 */
const DIPLOMACY_COUNTRIES={
 north:{name:'朔庭',envoy:'阿鲁',student:'图尔',character:'重武备与边界',favors:'border',relation:35},
 sea:{name:'海岚',envoy:'海宁',student:'兰舟',character:'重商贸与航路',favors:'trade',relation:45},
 west:{name:'西昭',envoy:'安弥',student:'明沙',character:'重礼仪与往来',favors:'visit',relation:50}
};
const DIPLOMACY_MISSIONS={
 visit:{name:'修好通使',cost:20,months:3},trade:{name:'商议通商',cost:30,months:3},
 border:{name:'商议边界',cost:25,months:3},tribute:{name:'议定朝贡',cost:40,months:3},treaty:{name:'商订和约',cost:35,months:3}
};
const DIPLOMATIC_TRAITS={north:'通晓边务',sea:'熟悉远洋商路',west:'谙习异邦礼制'};
function diplomaticTraitsPanel(person){
 const traits=(person.diplomaticTraits||[]).map(id=>DIPLOMATIC_TRAITS[id]).filter(Boolean);
 return dynastyFollowupActive()&&traits.length?`<p>出使特质：${traits.map(esc).join('、')}。对相应邦国的出使有利。</p>`:'';
}
const diplomacyEnabled=()=>journalContentVersion()>=85;
function diplomacyState(create=false){
 if(!S||!diplomacyEnabled())return null;
 if(!S.diplomacy&&create)S.diplomacy={countries:{},missions:[],lastTick:-1};
 return S.diplomacy||null;
}
function diplomacyCountry(id,create=false){
 const definition=DIPLOMACY_COUNTRIES[id],state=diplomacyState(create);if(!definition)return null;
 if(!state)return null;
 if(!state.countries[id]&&create)state.countries[id]={relation:definition.relation,trade:false,memory:[],envoy:{name:definition.envoy,attitude:50,memory:[]}};
 return state.countries[id]||null;
}
function diplomacyPanel(){
 if(!diplomacyEnabled())return '';
 const state=diplomacyState(),envoys=officialEntries().filter(e=>officialServing(e.p)&&!e.p.away).sort((a,b)=>b.p.ability-a.p.ability).slice(0,8);
 const princes=kidsAlive().filter(k=>k.sex==='m'&&kidAge(k)>=16&&childCanVisitCourt(k)&&S.heir!==k.id).slice(0,6);
 return `<p class="hint">使臣须为在京任职的朝臣，三个月后回奏。邦交、通商与往来记录随王朝存档保留。</p><div class="grid">${Object.entries(DIPLOMACY_COUNTRIES).map(([id,d])=>{
  const c=state?.countries[id],mission=state?.missions.find(m=>m.country===id&&m.status==='traveling');
  return `<article class="card"><h3>${d.name}</h3><p>${d.character}${dynastyFollowupActive()&&id==='west'?'，重王室婚好':''} · 邦交 ${rd(c?.relation??d.relation)} · ${c?.trade?'通商中':'未通商'} · 边境紧张 ${rd(c?.tension??0)}</p><p>${c?.treatyUntil>S.turn?`和约尚余 ${c.treatyUntil-S.turn} 个月`:'尚无生效和约'}${c?.tribute?' · 已议定朝贡':''}</p><p>对方使臣 ${esc(d.envoy)} · 对本朝的态度 ${rd(c?.envoy?.attitude??50)}</p>
  ${c?.succession?.status==='pending'?`<p>${d.name}王室正争议继承，长嗣与幼嗣各有支持者。</p><div class="acts"><button class="btn sm" data-onclick="A.foreignSuccession('${id}','elder')" ${E().energy<1||E().treasury<40?'disabled':''}>支持长嗣 · 银40 · 精力−1</button><button class="btn sm" data-onclick="A.foreignSuccession('${id}','younger')" ${E().energy<1||E().treasury<40?'disabled':''}>支持幼嗣 · 银40 · 精力−1</button><button class="btn sm" data-onclick="A.foreignSuccession('${id}','neutral')" ${E().energy<1?'disabled':''}>保持中立 · 精力−1</button></div>`:''}
  <div class="acts"><button class="btn sm" data-onclick="A.receiveForeignEnvoy('${id}','gift')" ${S.turn-(c?.lastAudience??-99)<6||E().energy<1||E().treasury<20?'disabled':''}>礼待使臣 · 银20 · 精力−1</button><button class="btn sm" data-onclick="A.receiveForeignEnvoy('${id}','slight')" ${S.turn-(c?.lastAudience??-99)<6||E().energy<1?'disabled':''}>冷落使臣 · 精力−1</button></div>
  ${c?.student?foreignStudentPanel(id,c.student):`<button class="btn sm" data-onclick="A.inviteForeignStudent('${id}')" ${(c?.relation??d.relation)<60||E().treasury<30||E().energy<1?'disabled':''}>邀请王子来学 · 邦交60 · 银30 · 精力−1</button>`}
  ${state?.missions.filter(m=>m.country===id&&m.type==='prince'&&m.status==='detained').map(m=>`<p>${esc(m.envoyName)}被留在${d.name}。</p><button class="btn sm" data-onclick="A.ransomDiplomaticPrince('${esc(m.id)}')" ${E().treasury<80||E().energy<1?'disabled':''}>议赎归国 · 银80 · 精力−1</button>`).join('')||''}
  ${state?.missions.filter(m=>m.country===id&&m.marriageOffer?.status==='pending'&&marriageReady(royalById(m.envoyId))).map(m=>`<p>${esc(m.envoyName)}与${esc(m.marriageOffer.person.name)}有意议婚。</p><button class="btn sm" data-onclick="A.foreignMarriage('${esc(m.id)}')">听取双方心意</button>`).join('')||''}
  ${(state?.reports||[]).filter(r=>r.country===id).slice(-3).reverse().map(r=>`<p>密报来源 ${esc(r.source)} · 可靠度估计 ${r.accuracy}%：${r.alarm?'边境可能有异动':'暂未见边境异动'}。${r.verifyDue!=null&&S.turn>=r.verifyDue?`复核结果：${r.truth?'当时确有异动':'当时未发现异动'}。`:r.verifyDue!=null?`复核中，还需 ${r.verifyDue-S.turn} 个月。`:''}</p><div class="acts">${r.accepted==null?`<button class="btn sm" data-onclick="A.trustForeignReport('${esc(r.id)}')">采信密报</button>`:'已采信'}${r.verifyDue==null?`<button class="btn sm" data-onclick="A.verifyForeignReport('${esc(r.id)}')">复核 · 银10 · 精力−1</button>`:''}</div>`).join('')}
  ${mission?`<p>${esc(mission.envoyName)}出使中 · 还需 ${Math.max(0,mission.due-S.turn)} 个月</p>`:`<div class="acts">${envoys.map(e=>Object.entries(DIPLOMACY_MISSIONS).filter(([kind])=>kind!=='trade'||!c?.trade).map(([kind,m])=>`<button class="btn sm" data-onclick="A.sendDiplomaticEnvoy('${id}','${kind}','${encodeURIComponent(e.key)}')" ${E().energy<1||E().treasury<m.cost?'disabled':''}>${esc(e.p.name)} · ${m.name} · 银${m.cost}</button>`).join('')).join('')||'<span class="hint">暂无可派遣的在京官员。</span>'}</div>`}
  ${!mission?`<div class="acts">${princes.map(k=>`<button class="btn sm" data-onclick="A.sendDiplomaticPrince('${id}',${k.id})" ${E().energy<1||E().treasury<50?'disabled':''}>派${esc(k.name)}出使 · 银50 · 精力−1</button>`).join('')}</div>`:''}
  <ul class="story">${(c?.memory||[]).slice(-4).reverse().map(item=>`<li><time>${esc(item.d)}</time>${esc(item.text)}</li>`).join('')||'<li>尚无交往记录。</li>'}</ul></article>`;
 }).join('')}</div>`;
}
function sendDiplomaticEnvoy(country,kind,encoded){
 const d=DIPLOMACY_COUNTRIES[country],mission=DIPLOMACY_MISSIONS[kind];
 if(!diplomacyEnabled()||!d||!mission||S.over||modalOpen||E().energy<1||E().treasury<mission.cost)return;
 let entry;try{entry=officialEntry(decodeURIComponent(encoded));}catch{return;}
 if(!entry||!officialServing(entry.p)||entry.p.away)return;
 const state=diplomacyState(true),c=diplomacyCountry(country,true);
 if(state.missions.some(m=>m.country===country&&m.status==='traveling')||kind==='trade'&&c.trade)return;
 if(!useE())return;chg({treasury:-mission.cost});
 const familiar=dynastyFollowupActive()&&E().diplomaticTraits?.includes(country);
 const odds=clamp(.35+entry.p.ability/250+c.relation/500+(d.favors===kind?.15:0)+((c.envoy?.attitude??50)-50)/500+(familiar?.06:0),.2,.9);
 const item={id:`${S.gen}:${S.turn}:${country}`,country,kind,envoyKey:entry.key,envoyId:entry.p.id,envoyName:entry.p.name,due:S.turn+mission.months,status:'traveling',success:chance(odds)};
 if(journalContentVersion()>=85){const accuracy=clamp(.25+entry.p.ability/250+(entry.p.trust??50)/400,.25,.9),truth=(c.tension||0)>=40;
  item.intelligence={truth,accuracy:Math.round(accuracy*100),alarm:chance(accuracy)?truth:!truth};}
 state.missions.push(item);entry.p.diplomaticJourney={id:item.id,country,due:item.due};
 story(entry.p,`奉命出使${d.name}，${mission.name}。`);log(`【邦交】${entry.p.name}奉命出使${d.name}，${mission.name}。`);render();
}
A.sendDiplomaticEnvoy=sendDiplomaticEnvoy;
function trustForeignReport(id){
 const r=diplomacyState()?.reports?.find(item=>item.id===id);if(!r||r.accepted!=null||S.over||modalOpen||E().energy<1||r.alarm&&E().treasury<20)return;
 if(!useE())return;if(r.alarm)chg({treasury:-20,people:-1});
 else if(r.truth){chg({people:-2,prestige:-1});const country=diplomacyCountry(r.country);country.tension=clamp((country.tension||0)+5);}
 r.accepted=S.turn;
 log(`【外交密报】采信${r.source}的${DIPLOMACY_COUNTRIES[r.country].name}边境线索。${r.alarm?'加派巡防，国库与民心受到影响。':r.truth?'边防松懈后，民间与朝廷声望受到影响。':''}`);render();
}
A.trustForeignReport=trustForeignReport;
function verifyForeignReport(id){
 const r=diplomacyState()?.reports?.find(item=>item.id===id);if(!r||r.verifyDue!=null||S.over||modalOpen||E().energy<1||E().treasury<10)return;
 if(!useE())return;chg({treasury:-10});r.verifyDue=S.turn+2;log(`【外交密报】命人复核${r.source}的边境线索，两个月后回奏。`);render();
}
A.verifyForeignReport=verifyForeignReport;
function sendDiplomaticPrince(id,kidId){
 const def=DIPLOMACY_COUNTRIES[id],k=kidById(kidId);
 if(!diplomacyEnabled()||!def||!k||k.sex!=='m'||kidAge(k)<16||S.heir===k.id||!childCanVisitCourt(k)||S.over||modalOpen||E().energy<1||E().treasury<50)return;
 const state=diplomacyState(true),country=diplomacyCountry(id,true);if(state.missions.some(m=>m.country===id&&m.status==='traveling'))return;
 if(!useE())return;chg({treasury:-50});const roll=R();
 const familiar=dynastyFollowupActive()&&k.diplomaticTraits?.includes(id);
 const outcome=roll<clamp(.45+k.lit/400+country.relation/500+(familiar?.06:0),.25,.85)?'success':roll>.92?'detained':'setback';
 const marriageChance=dynastyFollowupActive()&&id==='west'?.4:.25;
 const m={id:`${S.gen}:${S.turn}:${id}:prince:${k.id}`,type:'prince',country:id,envoyId:k.id,envoyName:k.name,due:S.turn+6,status:'traveling',outcome,possibleMarriage:!k.married&&chance(marriageChance)};
 state.missions.push(m);k.diplomaticJourney={id:m.id,country:id,status:'traveling'};kstory(k,`奉命出使${def.name}，辞京启程。`);log(`【邦交】${kidName(k)}奉命出使${def.name}。`,1);render();
}
A.sendDiplomaticPrince=sendDiplomaticPrince;
function ransomDiplomaticPrince(id){
 const m=diplomacyState()?.missions.find(x=>x.id===id&&x.type==='prince'&&x.status==='detained'),k=m&&royalById(m.envoyId);
 if(!m||!k?.alive||k.diplomaticJourney?.id!==m.id||S.over||modalOpen||E().energy<1||E().treasury<80)return;
 if(!useE())return;chg({treasury:-80});m.status='ransomed';k.diplomaticJourney.status='returned';
 const text=`${k.name}经交涉获释，平安从${DIPLOMACY_COUNTRIES[m.country].name}归来。`;kstory(k,`【出使】${text}`);diplomacyCountry(m.country).memory.push({d:dateStr(),turn:S.turn,text});log(`【邦交】${text}`,1);render();
}
A.ransomDiplomaticPrince=ransomDiplomaticPrince;
function foreignMarriage(id){
 const m=diplomacyState()?.missions.find(x=>x.id===id&&x.marriageOffer?.status==='pending'),k=m&&royalById(m.envoyId),offer=m?.marriageOffer;
 if(modalOpen||S.over||!k?.alive||!marriageReady(k)||!offer)return;
 const valid=()=>!S.over&&k.alive&&marriageReady(k)&&offer.status==='pending';
 pushEv({title:'异国议婚',por:k,valid,text:`${k.name}出使时结识${DIPLOMACY_COUNTRIES[m.country].name}的${offer.person.name}。礼部问过双方，二人都愿进一步议婚。她也盼婚后能继续与家乡通信。`,choices:[
  {t:'准予成婚 · 银50',cond:()=>E().treasury>=50&&valid(),why:'国库不足或婚事已变',f:()=>{
    if(!valid()||E().treasury<50)return null;chg({treasury:-50});k.married=true;k.spouse={...offer.person,marriedAt:S.turn};offer.status='accepted';
    ensureMarriedLife(k);diplomacyCountry(m.country).relation=clamp(diplomacyCountry(m.country).relation+8);
    kstory(k,`【异国议婚】经双方同意，与${offer.person.name}成婚。`);log(`【异国议婚】${kidName(k)}与${offer.person.name}成婚。`,1);save('auto');return '礼部按双方心意筹办婚礼，也为她安排与家乡通信。';
  }},{t:'暂不议婚',f:()=>{offer.status='declined';kstory(k,'【异国议婚】这门婚事暂未议成。');return '礼部将结果告知双方。';}}]});
}
A.foreignMarriage=foreignMarriage;
function receiveForeignEnvoy(id,mode){
 const def=DIPLOMACY_COUNTRIES[id];if(!diplomacyEnabled()||!def||!['gift','slight'].includes(mode)||S.over||modalOpen||E().energy<1||mode==='gift'&&E().treasury<20)return;
 const country=diplomacyCountry(id,true);if(S.turn-(country.lastAudience??-99)<6)return;
 if(!useE())return;if(mode==='gift')chg({treasury:-20});country.lastAudience=S.turn;
 country.envoy||={name:def.envoy,attitude:50,memory:[]};const change=mode==='gift'?8:-12;
 country.envoy.attitude=clamp(country.envoy.attitude+change);country.relation=clamp(country.relation+(mode==='gift'?4:-6));
 const text=mode==='gift'?`礼待${def.name}使臣${def.envoy}，他记下这份尊重。`:`冷落${def.name}使臣${def.envoy}，他将此事记在心里。`;
 country.memory.push({d:dateStr(),turn:S.turn,text});if(country.memory.length>30)country.memory.shift();
 country.envoy.memory.push({d:dateStr(),turn:S.turn,kind:mode});if(country.envoy.memory.length>30)country.envoy.memory.shift();
 if(journalContentVersion()>=85){country.envoy.followups=(country.envoy.followups||[]).filter(x=>!x.done);country.envoy.followups.push({due:S.turn+36,kind:mode,done:false});}
 log(`【邦交 · ${def.name}】${text}`,1);render();
}
A.receiveForeignEnvoy=receiveForeignEnvoy;
function inviteForeignStudent(id){
 const def=DIPLOMACY_COUNTRIES[id],existing=diplomacyCountry(id);
 if(!diplomacyEnabled()||!def||S.over||modalOpen||E().energy<1||E().treasury<30||(existing?.relation??def.relation)<60||existing?.student)return;
 if(!useE())return;chg({treasury:-30});const country=diplomacyCountry(id,true);
 country.student={name:def.student,status:'studying',arrived:S.turn,months:0,friendship:50,memory:[]};
 const text=`${def.name}王子${def.student}受邀来京求学，暂定两年。`;country.memory.push({d:dateStr(),turn:S.turn,text});log(`【邦交 · ${def.name}】${text}`,1);render();
}
A.inviteForeignStudent=inviteForeignStudent;
function foreignStudentPanel(id,student){
 const def=DIPLOMACY_COUNTRIES[id];
 if(student.status!=='studying'){
   const appeared=student.homecoming?.outcome&&student.homecoming.outcome!=='neutral';
   return `<p>${def.name}王子${esc(student.name)}已结束求学归国。${appeared?'曾回京重访。':''}</p>
     ${dynastyFollowupActive()&&appeared&&!student.homecoming.read?`<button class="btn sm" data-onclick="A.reviewForeignStudentReturn('${id}')">阅览来访记录</button>`:''}`;
 }
 const disabled=E().energy<1||S.turn-(student.lastVisit??-99)<6?'disabled':'';
 return `<p>${def.name}王子${esc(student.name)}在京求学 · 已学习 ${student.months} 个月 · 情谊 ${student.friendship}</p>
   <button class="btn sm" data-onclick="A.visitForeignStudent('${id}')" ${disabled}>问候王子 · 精力−1</button>
   ${dynastyFollowupActive()?`<button class="btn sm" data-onclick="A.visitForeignStudent('${id}','cold')" ${disabled}>冷言训斥 · 精力−1</button>`:''}`;
}
function visitForeignStudent(id,mode='welcome'){
 const country=diplomacyCountry(id),def=DIPLOMACY_COUNTRIES[id],student=country?.student;
 if(!def||student?.status!=='studying'||S.over||modalOpen||E().energy<1||S.turn-(student.lastVisit??-99)<6)return;
 const cold=dynastyFollowupActive()&&mode==='cold';
 if(!useE())return;student.lastVisit=S.turn;student.friendship=clamp(student.friendship+(cold?-12:5));
 const text=cold?`你当着馆师的面斥责${student.name}不懂本朝的礼数。他收起原准备请教的课业，记住了这场冷遇。`:
   `你问${student.name}在京读书与生活是否适应，也听他讲起${def.name}的风俗。`;
 student.memory.push({d:dateStr(),turn:S.turn,text});if(student.memory.length>20)student.memory.shift();log(`【邦交 · 求学】${text}`);render();
}
A.visitForeignStudent=visitForeignStudent;
function settleForeignStudentReturn(id,country){
 const student=country.student;
 if(!student||student.status!=='returned'||!Number.isInteger(student.returned))return;
 const visit=student.homecoming||={due:student.returned+36};
 if(visit.outcome||S.turn<visit.due)return;
 visit.outcome=student.friendship>=60?'gratitude':student.friendship<45?'reprisal':'neutral';
 if(visit.outcome==='neutral')return;
 const def=DIPLOMACY_COUNTRIES[id],kind=visit.outcome==='gratitude';
 country.relation=clamp(country.relation+(kind?8:-7));
 if(kind)chg({treasury:45});else country.tension=clamp((country.tension||0)+15);
 visit.text=kind?`${def.name}王子${student.name}再访京师。他记得你当年肯听他说话，亲自送来归国后编成的学册和谢礼四十五万两。`:
   `${def.name}王子${student.name}随使团再次入京。他提起求学时当众受训的旧事，拒绝旧日边市约定，边境因此更紧张。`;
 const memory={d:dateStr(),turn:S.turn,text:visit.text};
 student.memory.push(memory);if(student.memory.length>20)student.memory.shift();
 country.memory.push(memory);if(country.memory.length>30)country.memory.shift();
 log(`【邦交 · 求学旧事】${visit.text}`,1);
}
function foreignStudentReturnEvent(id){
 const student=diplomacyCountry(id)?.student,visit=student?.homecoming;
 if(!dynastyFollowupActive()||!visit?.text||visit.read||S.over)return null;
 return {title:'邦交 · 求学旧事',valid:()=>!S.over&&student.homecoming===visit&&!visit.read,text:visit.text,
   choices:[{t:'阅毕，记入邦交册',f:()=>{visit.read=true;}}]};
}
function pendingForeignStudentReturn(){
 for(const id of Object.keys(diplomacyState()?.countries||{})){
   const event=foreignStudentReturnEvent(id);if(event)return event;
 }
 return null;
}
A.reviewForeignStudentReturn=function(id){if(!modalOpen)pushEv(foreignStudentReturnEvent(id));};
function foreignSuccession(id,choice){
 const def=DIPLOMACY_COUNTRIES[id],country=diplomacyCountry(id),crisis=country?.succession;
 if(!def||!crisis||crisis.status!=='pending'||!['elder','younger','neutral'].includes(choice)||S.over||modalOpen||E().energy<1||choice!=='neutral'&&E().treasury<40)return;
 if(!useE())return;if(choice!=='neutral')chg({treasury:-40});
 const won=choice===crisis.winner,change=choice==='neutral'?0:won?8:-8;
 country.relation=clamp(country.relation+change);country.envoy||={name:def.envoy,attitude:50,memory:[]};country.envoy.attitude=clamp(country.envoy.attitude+(choice==='neutral'?0:won?6:-6));
 crisis.status='resolved';crisis.choice=choice;crisis.resolved=S.turn;
 const label=choice==='neutral'?'保持中立':choice==='elder'?'支持长嗣':'支持幼嗣';
 const text=`${def.name}继承争议中，本朝${label}。最终${crisis.winner==='elder'?'长嗣':'幼嗣'}继位；${choice==='neutral'?'两国关系未因此改变':won?'新君记得本朝支持':'新君记得本朝曾支持另一方'}。`;
 country.memory.push({d:dateStr(),turn:S.turn,text});if(country.memory.length>30)country.memory.shift();country.envoy.memory.push({d:dateStr(),turn:S.turn,kind:'succession',choice,winner:crisis.winner});if(country.envoy.memory.length>30)country.envoy.memory.shift();
 log(`【邦交 · ${def.name}】${text}`,1);render();
}
A.foreignSuccession=foreignSuccession;
function diplomacyTick(){
 const state=diplomacyState();if(!state||state.lastTick===S.turn)return;state.lastTick=S.turn;
 for(const [id,c] of Object.entries(state.countries)){
  if(journalContentVersion()>=85)for(const response of c.envoy?.followups||[]){
    if(response.done||S.turn<response.due)continue;response.done=true;const friendly=response.kind==='gift';
    c.relation=clamp(c.relation+(friendly?5:-5));chg({treasury:friendly?30:-30});
    const text=friendly?`${DIPLOMACY_COUNTRIES[id].envoy}记得当年的礼遇，托商队送来谢礼。`:`${DIPLOMACY_COUNTRIES[id].envoy}记得昔日受冷落，回国后促成商路加征费用。`;
    c.memory.push({d:dateStr(),turn:S.turn,text});if(c.memory.length>30)c.memory.shift();log(`【邦交 · 旧事回音】${text}`,1);
  }
  if(c.trade)chg({treasury:6});
  if(c.tribute&&S.month===1)chg({treasury:60});
  if(c.student?.status==='studying'&&++c.student.months>=24){
    c.student.status='returned';c.student.returned=S.turn;
    c.relation=clamp(c.relation+(c.student.friendship>=60?8:dynastyFollowupActive()&&c.student.friendship<45?-4:4));
    const text=`${DIPLOMACY_COUNTRIES[id].name}王子${c.student.name}完成两年求学，带着在京的见闻归国。`;
    c.student.memory.push({d:dateStr(),turn:S.turn,text});c.memory.push({d:dateStr(),turn:S.turn,text});log(`【邦交 · 求学】${text}`,1);
  }
  if(dynastyFollowupActive())settleForeignStudentReturn(id,c);
  if(S.turn>0&&S.turn%24===0&&chance(c.treatyUntil>S.turn?.02:.15)){
    c.tension=clamp((c.tension||0)+20);c.relation=clamp(c.relation-3);
    const text='边境出现争端，双方关系受损；可派使臣商议边界。';c.memory.push({d:dateStr(),turn:S.turn,text});if(c.memory.length>30)c.memory.shift();
    log(`【邦交 · ${DIPLOMACY_COUNTRIES[id].name}】${text}`,1);
  }
  if(S.turn>0&&S.turn%36===0&&S.turn-(c.lastSuccession??-99)>=120&&c.succession?.status!=='pending'&&chance(.12)){
    c.lastSuccession=S.turn;c.succession={status:'pending',started:S.turn,winner:chance(.5)?'elder':'younger'};
    const text='王室发生继承争议，双方正寻求外援。';c.memory.push({d:dateStr(),turn:S.turn,text});if(c.memory.length>30)c.memory.shift();log(`【邦交 · ${DIPLOMACY_COUNTRIES[id].name}】${text}`,1);
  }
 }
 for(const m of state.missions){if(m.status!=='traveling'||S.turn<m.due)continue;
  if(m.type==='prince'){
    const k=royalById(m.envoyId),country=diplomacyCountry(m.country,true),def=DIPLOMACY_COUNTRIES[m.country];
    if(!k?.alive||k.diplomaticJourney?.id!==m.id){m.status='interrupted';continue;}
    m.status=m.outcome;k.diplomaticJourney.status=m.outcome==='detained'?'detained':'returned';
    let text;
    if(m.outcome==='success'){
      k.foreignLanguages||=[];if(!k.foreignLanguages.includes(def.name))k.foreignLanguages.push(def.name);k.lit=clamp(k.lit+2);country.relation=clamp(country.relation+6);
      if(m.possibleMarriage&&marriageReady(k)){
        const appearance=makeGirl({age:Math.max(18,kidAge(k)),fam:{t:def.name+'王室',p:55}}),person={id:`foreign-match-${m.id}`,sex:'f',name:fullName(appearance),sur:appearance.sur,born:S.turn-appearance.age*12,seed:appearance.seed,alive:true,background:def.name+'王室',appearance};
        m.marriageOffer={status:'pending',person};
      }
      text=`${k.name}出使${def.name}归来，学会当地语言，才学与两国关系有所增长。`;
      if(dynastyFollowupActive()){
        const traits=k.diplomaticTraits||=[];
        if(!traits.includes(m.country)){traits.push(m.country);text+=`另习得「${DIPLOMATIC_TRAITS[m.country]}」。`;}
      }
    }else if(m.outcome==='detained')text=`${k.name}出使途中遭${def.name}扣留，须议赎才能归来。`;
    else text=`${k.name}出使${def.name}未能谈妥，但已平安归来。`;
    kstory(k,`【出使】${text}`);country.memory.push({d:dateStr(),turn:S.turn,text});if(country.memory.length>30)country.memory.shift();log(`【邦交 · ${def.name}】${text}`,1);continue;
  }
  const country=diplomacyCountry(m.country,true),def=DIPLOMACY_COUNTRIES[m.country],entry=officialEntry(m.envoyKey);
  country.envoy||={name:def.envoy,attitude:50,memory:[]};
  const returned=entry&&entry.p.id===m.envoyId&&officialAlive(entry.p)&&!entry.p.exiled&&!entry.p.dismissed;
  if(entry?.p.id===m.envoyId&&entry.p.diplomaticJourney?.id===m.id)delete entry.p.diplomaticJourney;
  if(returned&&m.intelligence){(state.reports||=[]).push({id:m.id,country:m.country,source:m.envoyName,...m.intelligence,received:S.turn});}
  m.status=returned?(m.success?'success':'setback'):'interrupted';
  let text;
  if(!returned)text=`${m.envoyName}未能完成此行，${DIPLOMACY_MISSIONS[m.kind].name}未成。`;
  else if(m.success){const gain=def.favors===m.kind?10:6;country.relation=clamp(country.relation+gain);
    if(m.kind==='trade')country.trade=true;
    if(m.kind==='treaty')country.treatyUntil=S.turn+60;
    if(m.kind==='tribute')country.tribute=true;
    if(m.kind==='border')country.tension=clamp((country.tension||0)-20);
    text=`${m.envoyName}归来，${DIPLOMACY_MISSIONS[m.kind].name}有成，两国邦交增进${gain}。${m.kind==='trade'?'两国开始通商，每月商税六万两。':m.kind==='treaty'?'和约有效五年，可减少边境争端。':m.kind==='tribute'?'议定朝贡，每年正月贡银六十万两。':m.kind==='border'?'边境紧张有所缓和。':''}`;
  }else{country.relation=clamp(country.relation-3);text=`${m.envoyName}归来，${DIPLOMACY_MISSIONS[m.kind].name}未谈妥，两国邦交下降3。`;}
  country.memory.push({d:dateStr(),turn:S.turn,text});if(country.memory.length>30)country.memory.shift();
  if(returned){country.envoy.attitude=clamp(country.envoy.attitude+(m.success?4:-3));country.envoy.memory.push({d:dateStr(),turn:S.turn,kind:m.kind,success:m.success,envoy:m.envoyName});if(country.envoy.memory.length>30)country.envoy.memory.shift();}
  if(returned)story(entry.p,`【出使${def.name}】${text}`);log(`【邦交 · ${def.name}】${text}`,1);
 }
}
