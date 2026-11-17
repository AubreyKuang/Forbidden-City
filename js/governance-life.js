/* Treasury receipts, named appointments and the life of a working court. */
function legacyPendingAction(){return typeof PalaceActions!=='undefined'&&PalaceActions.legacy;}
let exhaustedMonthNotice=null;
const EXHAUSTED_MONTH_DELAY=1500;
function exhaustedMonthReady(){
  return !!(S&&!S.over&&E().energy<=0&&S.flags.exhaustedTurn===S.turn&&!modalOpen&&!Q.length);
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
    if(S===pending.state)A.completeExhaustedMonth(pending.gen,pending.turn);
  },EXHAUSTED_MONTH_DELAY);
}
A.completeExhaustedMonth=function(gen,turn){
  if(!exhaustedMonthReady()||S.gen!==gen||S.turn!==turn)return;
  A.endMonth();
  if(S.turn!==turn)delete S.flags.exhaustedTurn;
};
function settleExhaustedMonth(previous){
  if(!S||S.over)return;
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
    officialRecord(e.c,e.role,text,{emotion:good?.5:-.4});officialFamilyReaction(e,good?'success':'setback',task);
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
  const t=OFFICIAL_TASKS[id],entries=officialEntries().filter(e=>officialActionReady(e,'commission')&&t.army===(e.h.bloc==='army'));
  return {title:t.title,text:`需 ${t.months} 个月，拨款 ${t.cost} 万两。${t.brief||'择人领差，办结后据实回奏。'}\n${entries.length?'请选承办官员。':'暂无可领此差的官员，可等在外官员回奏后再安排。'}`,choices:[
    ...entries.map(e=>({t:`${e.p.name} · ${e.p.office||e.p.post} · 才干 ${e.p.ability}`,person:e.p,cond:()=>officialActionReady(e,'commission')&&E().energy>0&&E().treasury>=t.cost,why:'精力或国库不足，或已有未结差事',f:()=>assignOfficialTask(e,id,docket)})),{t:'暂缓'}]};
}
A.governmentTask=function(id){
  if(!modalOpen)pushEv(governmentTaskEvent(id));
};
function viewGovernment(){
  const g=governance(),receipt=treasuryReceipt('tax');
  const ready=ministryDockets().filter(d=>ministryDocketReady(d)||ministryAftermathReady(d)).length;
  return `${pageHeading('治国理政','用人、钱粮、民间见闻，都须有去处，也有回音。')}<div class="acts page-actions">${monthlyCourtButton()}<button class="btn" onclick="A.go('officials')">官员表</button><button class="btn" onclick="A.go('ministries')">六部${ready?`<small>${ready} 份回奏待阅</small>`:''}</button><button class="btn" onclick="A.go('jinyiwei')">锦衣卫</button><button class="btn" onclick="A.go('out')">微服问民情</button></div>
  ${typeof examSchedulePanel==='function'?examSchedulePanel():''}
  ${careerReportsHTML()}
  ${pageChapters('government',[
    ['tax','户部岁入',`<section class="detail-section"><p>每年十月结算秋税，正月收取岁贡银 120 万两与珍饰一件。月常入与俸禄仍逐月结算。</p><p>${receipt?`本年秋税已实收 ${receipt.amount} 万两。`:`今年采用「${TAX_PLANS[g.tax].name}」，按当前民心估计秋税 ${taxEstimate()} 万两。`}</p><div class="acts">${Object.entries(TAX_PLANS).map(([id,p])=>`<button class="btn sm" onclick="A.taxPlan('${id}')" ${receipt||g.tax===id||E().energy<1?'disabled':''}>${p.name} · 精力−1${id==='light'?' · 秋税入库时民心+5':''}</button>`).join('')}</div><ul class="story">${g.receipts.slice(-8).reverse().map(r=>`<li><time>${esc(r.date)}</time>${esc(r.text)}</li>`).join('')||'<li>尚未到年度入库时节。</li>'}</ul></section>`],
    ['posts','吏部调度',`<section class="detail-section"><p class="hint">调任需精力 1、交接银 20 万两。同一官员半年内不再调任，在途差务、致仕或获罪期间不可调动。</p><div class="grid">${Object.entries(GOVERNMENT_POSTS).map(([id,p])=>{const e=postHolder(id);return `<article class="card government-post"><h3>${p.name}</h3><p>${p.detail}</p>${e?`<p>${officialLink(e.c,e.role)} · ${officialStatus(e.p)}</p>`:`<button class="btn sm jade" onclick="A.postCandidates('${id}')">择人调任</button>`}</article>`;}).join('')}</div></section>`],
    ['tasks','治事与回奏',`<section class="detail-section"><div class="grid government-tasks">${Object.entries(OFFICIAL_TASKS).map(([id,t])=>`<button class="card" onclick="A.governmentTask('${id}')"><div><b>${t.title}</b><p>${t.brief||'择人领差，期满回奏。'}</p><small>${t.months}个月 · 国库 ${t.cost} · ${t.army?'武职':'文职'}</small></div></button>`).join('')}</div></section>`],
    ['people','民情回访',incognitoLedger()]
  ])}`;
}
