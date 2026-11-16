/* ============ 六部与科举 ============ */
// 六部各设尚书，由在任且有才干的官员出任；尚书的才干决定本部差事的成败。
// 三年一科：会试后殿试钦点三甲，新科进士授翰林院官职，成为外戚之外有名有姓的朝臣。
// 旧存档里未完的事件按原样重放：事务日志版本 9 之前的步骤不触发这里的抽签或写入。
const COURT_OFFICES_JOURNAL=9;
function courtOfficesActive(){
  if(!S||S.over)return false;
  return journalContentVersion()>=COURT_OFFICES_JOURNAL;
}
function ministryState(){
  const st=S.ministries ||= {};
  st.heads ||= {};st.used ||= {};st.exams ||= [];
  return st;
}
const scholarList=()=>S.scholars||[];
const scholarById=id=>scholarList().find(p=>p.id===id);

/* —— 新科进士：外戚之外的朝臣 —— */
const SCHOLAR_ORIGINS=['寒门','书香门第','耕读之家','盐商之后','军户子弟'];
const SCHOLAR_ESSAYS=['论漕运积弊，主张分段官运','论边储，请以屯田补军饷','论吏治，请严考成、去冗员','论水利，愿亲赴河工','论民本，引孟子“民为贵”','论盐法，请革除私引'];
function makeScholar(rankBoost=0,reserved=[]){
  const sur=pick(courtNamesActive()?COURT_SURNAMES:SUR),given=courtNamesActive()?courtGivenName(sur,ri(0,2e9),{used:new Set([...courtUsedNames(),...reserved.map(p=>p.name)]),reservedGiven:new Set(reserved.map(p=>givenOf(p)))}):pick([...BROTHER_NAMES,...FATHER_NAMES]),seed=ri(1,2e9);
  const civilFaces=[272,274,279,280,281];
  const person={id:`scholar-${S.gen}-${S.turn}-${S.nid++}`,name:sur+given,sur,age:ri(22,36),seed,origin:pick(SCHOLAR_ORIGINS),essay:pick(SCHOLAR_ESSAYS),
    ability:clamp(ri(48,82)+rankBoost,30,95),trust:45,merit:10,temperament:pick(OFFICIAL_TEMPERAMENTS),career:'official',alive:true,story:[],
    official:2,artPortrait:civilFaces[seed%civilFaces.length],scholar:true};
  if(expandedOfficialPortraitsActive()){delete person.artPortrait;assignCourtOfficialPortrait(person,'civil',{peers:reserved});}
  return person;
}
function scholarRecord(p,text,big=true){story(p,text);log(`${p.name}：${text}`,big?1:0);}
// 尚书人选与表格共用的统一条目：外戚出身的用 officialEntry 键，进士出身的用 scholar: 前缀。
function courtPerson(key){
  if(!key)return null;
  if(String(key).startsWith('scholar:')){const p=scholarById(String(key).slice(8));return p?{p,key,scholar:true,bloc:'civil'}:null;}
  const e=officialEntry(key);return e?{p:e.p,key,e,bloc:e.h.bloc}:null;
}
function courtPersonRecord(person,text){
  if(person.scholar)scholarRecord(person.p,text);else officialRecord(person.e.c,person.e.role,text);
}

/* —— 六部 —— */
const MINISTRIES={
  personnel:{name:'吏部',duty:'铨选考课',army:false,action:'京察考课',cost:0,brief:'考核在朝官员，卓异者加信任，不称职者降信任并记入履历。'},
  revenue:{name:'户部',duty:'钱粮户籍',army:false,action:'清查亏空',cost:0,brief:'追缴各省历年亏空。办得好可入库数十万两；追比过严则伤民心。'},
  rites:{name:'礼部',duty:'科举典礼',army:false,action:'开设恩科',cost:30,brief:'下月加开一科殿试，钦点三甲。正科每三年三月举行，两科至少间隔两年。'},
  war:{name:'兵部',duty:'武选边防',army:true,action:'整饬边备',cost:40,brief:'核点兵员、修补器械，提升武备。'},
  justice:{name:'刑部',duty:'刑名复核',army:false,action:'秋审复核',cost:0,brief:'复核在押案卷；若后宫有被诬入冷宫者，可借此平反。'},
  works:{name:'工部',duty:'营缮河工',army:false,action:'督修河工',cost:120,brief:'由部里直接督修黄河险段，修成可抵一次决口的赈济开支。'}
};
const MINISTRY_GAP=12;
function ministryHead(id){
  const title=`${MINISTRIES[id].name}尚书`,holds=x=>x&&officialServing(x.p)&&x.p.office===title;
  // 调任他职即视为卸任本部；未经任命时，家世本就官居此职的父兄即是现任尚书。
  const person=courtPerson(S.ministries?.heads?.[id]);if(holds(person))return person;
  const kin=officialEntries().map(e=>({p:e.p,key:e.key,e,bloc:e.h.bloc})).filter(holds),scholars=scholarList().map(p=>({p,key:'scholar:'+p.id,scholar:true,bloc:'civil'})).filter(holds);
  return [...kin,...scholars].sort((a,b)=>b.p.trust-a.p.trust)[0]||null;
}
function ministryHeldBy(p){return Object.keys(MINISTRIES).find(id=>ministryHead(id)?.p===p)||null;}
function ministryCandidates(id){
  const m=MINISTRIES[id];if(!m)return [];
  const kin=officialEntries().filter(e=>officialServing(e.p)&&e.p.career!=='student'&&e.p.ability>=55&&officialMilitary(e.p,e.h)===m.army).map(e=>({p:e.p,key:e.key,e,bloc:e.h.bloc}));
  // 新科进士须在翰林院历练两年以上，方可出掌一部。
  const scholars=m.army?[]:scholarList().filter(p=>officialServing(p)&&p.ability>=55&&S.turn-(p.appointedTurn??S.turn)>=24).map(p=>({p,key:'scholar:'+p.id,scholar:true,bloc:'civil'}));
  return [...kin,...scholars].filter(x=>!ministryHeldBy(x.p));
}
function ministryOdds(id){const head=ministryHead(id);return head?.4+head.p.ability/200:0;}
function ministryReady(id){
  const m=MINISTRIES[id];if(!m||!S||S.over||!ministryHead(id))return false;
  if(S.turn-(S.ministries?.used?.[id]??-99)<MINISTRY_GAP)return false;
  if(E().energy<1||E().treasury<m.cost)return false;
  if(id==='rites')return !examPending()&&S.turn-lastExamTurn()>=24;
  if(id==='works')return S.flags.floodDikeGen!==S.gen;
  return true;
}
function lastExamTurn(){return S.ministries?.exams?.at(-1)?.turn??-99;}
function examPending(){return Number.isFinite(S.ministries?.examDue)&&S.ministries.examDue>=S.turn;}
function nextExamLabel(){
  if(examPending())return `恩科定于${S.ministries.examDue===S.turn?'本月末':'下月末'}`;
  let y=S.year,m=S.month;for(let i=0;i<40;i++){m++;if(m>12){m=1;y++;}if(m===3&&y>1&&(y-1)%3===0)break;}
  return `下一次正科：${y-S.year?`${y-S.year}年后`:'今年'}三月`;
}
function ministryResult(id,head,success){
  const p=head.p,name=p.name;
  if(id==='personnel'){
    const people=[...officialEntries().filter(e=>officialServing(e.p)&&e.p.career!=='student').map(e=>({p:e.p,e})),...scholarList().filter(officialServing).map(p=>({p,scholar:true}))];
    const grades={卓异:[],称职:[],不称职:[]};
    for(const x of people){
      const lapse=typeof kinCourtLapse==='function'?kinCourtLapse(x.p):null,score=(x.p.merit??30)+(x.p.ability??50)/3-(lapse?.grounded?15:0)+(success?0:ri(-8,8));
      const grade=score>=60?'卓异':score>=35?'称职':'不称职';grades[grade].push(x.p);
      if(grade==='卓异')x.p.trust=clamp(x.p.trust+4);if(grade==='不称职')x.p.trust=clamp(x.p.trust-5);
      story(x.p,`京察考课，评为「${grade}」。`);
    }
    log(`吏部${name}主持京察：卓异${grades.卓异.length}人，称职${grades.称职.length}人，不称职${grades.不称职.length}人。`,1);
    return `京察已毕。卓异：${grades.卓异.map(p=>p.name).join('、')||'无'}；不称职：${grades.不称职.map(p=>p.name).join('、')||'无'}。${success?'':'\n考课时有同僚说情，评语未尽公允。'}${fx(chg({prestige:success?2:0}))}`;
  }
  if(id==='revenue'){
    const amount=success?40+Math.round(p.ability/2):15;
    courtPersonRecord(head,success?`清查各省亏空，追缴入库${amount}万两。`:`清查亏空时追比过严，只追回${amount}万两，地方怨声渐起。`);
    return `${success?'各省亏空清出大半':'追比过急，地方叫苦'}。${fx(chg({treasury:amount,people:success?0:-2}))}`;
  }
  if(id==='rites'){
    S.ministries.examDue=S.turn+1;
    courtPersonRecord(head,'奏准加开恩科，下月举行殿试。');
    return `礼部已张榜，下月末殿试。${fx(chg({treasury:-MINISTRIES.rites.cost,people:1}))}`;
  }
  if(id==='war'){
    E().wu=clamp(E().wu+(success?3:1));
    courtPersonRecord(head,success?'整饬边备，核实兵员，补齐器械。':'整饬边备，因各镇推诿，只补了器械。');
    return `${success?'边镇军备焕然一新':'只修补了器械，兵员缺额未清'}。武略 +${success?3:1}。${fx(chg({treasury:-MINISTRIES.war.cost,prestige:success?1:0}))}`;
  }
  if(id==='justice'){
    const w=S.flags.wronged,v=w&&byId(w.v),a=w&&byId(w.a);
    if(v?.alive&&v.cold&&success){
      A.uncold(v.id);S.flags.wronged=null;story(v,`刑部${name}复核巫蛊旧案，查明她是被人栽赃，奉旨出冷宫。`);
      courtPersonRecord(head,`复核巫蛊旧案，为${fullName(v)}平反。`);
      if(a?.alive&&!a.gone&&!a.cold){a.known=true;pushNow(punishEv(a,v,'栽赃巫蛊'));}
      return `${fullName(v)}的冤案得以平反。${fx(chg({people:2,prestige:2}),cchg(v,{mood:20,aff:10}))}`;
    }
    courtPersonRecord(head,success?'主持秋审，复核在押案卷，开释错押者数人。':'主持秋审，案卷繁多，只复核了一半。');
    return `${success?'秋审复核已毕，数名错押者获释':'秋审只核完一半'}。${fx(chg({people:success?3:1}))}`;
  }
  if(id==='works'){
    if(success)S.flags.floodDikeGen=S.gen;
    courtPersonRecord(head,success?'督修黄河险段完工，工料验讫。':'督修黄河险段，工料账目不清，尚未验收。');
    return `${success?'险段已修固，下次决口可少拨一笔修复银':'工料账目不清，堤工尚未验收'}。${fx(chg({treasury:-MINISTRIES.works.cost}))}`;
  }
  return '';
}
A.ministryAct=function(id){
  if(modalOpen||!ministryReady(id))return;
  const m=MINISTRIES[id],head=ministryHead(id),odds=Math.round(ministryOdds(id)*100);
  pushEv({title:`${m.name} · ${m.action}`,por:head.p,valid:()=>ministryHead(id)?.p===head.p,
    text:`${m.brief}\n主事：${m.name}尚书${head.p.name}（才干${rd(head.p.ability)}），把握约${odds}%。`,choices:[
      {t:`准行 · 精力−1${m.cost?' · 国库−'+m.cost:''}`,cond:()=>ministryReady(id),why:'精力或国库不足，或本部年内已办过',f:()=>{
        if(!ministryReady(id)||!useE())return null;
        ministryState().used[id]=S.turn;const success=chance(ministryOdds(id));
        head.p.merit=clamp(head.p.merit+(success?6:-2));
        const text=ministryResult(id,head,success);save('auto');return {text,por:head.p};
      }},{t:'暂缓'}]});
};
A.ministryAppoint=function(id){
  if(modalOpen||S.over||!MINISTRIES[id])return;
  const m=MINISTRIES[id],list=ministryCandidates(id),current=ministryHead(id);
  pushEv({title:`${m.name}尚书人选`,text:`${m.name}掌${m.duty}。${current?`现任尚书${current.p.name}。`:'尚书一职空缺。'}\n候选须在任、才干55以上，且不兼掌他部；新科进士须在翰林院历练两年。${list.length?'':'\n眼下没有合格人选。'}`,
    choices:[...list.map(x=>({t:`${x.p.name} · ${x.p.office||x.p.post} · 才干${rd(x.p.ability)}${x.scholar?' · 进士出身':' · '+blocName(x.bloc)}`,person:x.p,
      cond:()=>E().energy>=1&&officialServing(x.p)&&!ministryHeldBy(x.p),why:'精力不足或已不在任',f:()=>{
        if(!useE())return null;
        const st=ministryState(),old=ministryHead(id);st.heads[id]=x.key;
        if(old&&old.p!==x.p){if(careersActive())careerSetOffice(old,'内阁学士','卸任尚书，改授新职');else{old.p.office='内阁学士';old.p.post=old.p.office;}courtPersonRecord(old,`卸任${m.name}尚书，改任内阁学士。`);}
        if(careersActive())careerSetOffice(x,`${m.name}尚书`,'奉旨出掌六部');else{x.p.office=`${m.name}尚书`;x.p.post=x.p.office;}x.p.trust=clamp(x.p.trust+3);
        courtPersonRecord(x,`奉旨出任${m.name}尚书。`);
        if(!x.scholar){policyNudge('kin',3);policyNudge('civil',-2);officialFamilyReaction(x.e,'transfer',`出任${m.name}尚书`);}
        else policyNudge('civil',2);
        save('auto');return `${x.p.name}出任${m.name}尚书。`;
      }})),{t:'暂不任命'}]});
};

/* —— 科举：三年一科，三月殿试；礼部可奏开恩科 —— */
function examDueNow(){
  if(!courtOfficesActive())return false;
  const st=S.ministries;
  if(st?.examDue===S.turn)return true;
  return S.month===3&&S.year>1&&(S.year-1)%3===0&&!(st?.exams||[]).some(x=>x.gen===S.gen&&x.year===S.year);
}
function examEvent(){
  const st=ministryState(),head=ministryHead('rites'),boost=head?Math.round((head.p.ability-50)/5):0;
  const candidates=[];for(let i=0;i<3;i++)candidates.push(makeScholar(boost,candidates));
  // 外家子弟中已有举人功名者一同应考，能否得中看学业，不因宫中亲眷照顾。
  const kin=officialEntries().filter(e=>officialAlive(e.p)&&e.p.career==='student'&&e.p.education==='举人'&&e.p.age>=18&&e.p.age<=55&&!e.p.exiled&&!e.p.dismissed)
    .map(e=>({e,passed:chance(.35+((e.p.ability??50)-50)/200)}));
  const record={gen:S.gen,year:S.year,turn:S.turn,enke:st.examDue===S.turn};
  delete st.examDue;st.exams.push(record);if(st.exams.length>20)st.exams.shift();
  let done=false;
  const finish=order=>{
    if(done)return null;done=true;
    const titles=['状元','榜眼','探花'],posts=['翰林院修撰','翰林院编修','翰林院编修'];
    S.scholars ||= [];
    order.forEach((p,i)=>{p.examRank=titles[i];p.examYear=S.year;p.office=posts[i];p.post=posts[i];p.appointedTurn=S.turn;if(i===0)p.trust=55;
      S.scholars.push(p);scholarRecord(p,`${record.enke?'恩科':'正科'}殿试，钦点${titles[i]}，授${posts[i]}。`,i===0);});
    for(const {e,passed} of kin){
      if(passed){e.p.education='进士';e.p.post='进士';e.p.examTurn=S.turn;officialRecord(e.c,e.role,'会试得中，取得进士功名，候选授官。',{emotion:.6});}
      else officialRecord(e.c,e.role,'会试未第，仍以举人身份候选。');
    }
    record.top=order.map(p=>p.id);
    if(careersActive()&&examMarriageCandidates(order[2]).length)pushEv(examMarriageEvent(order[2]));
    return `金榜张挂：状元${order[0].name}、榜眼${order[1].name}、探花${order[2].name}。${kin.filter(x=>x.passed).length?`\n外家子弟${kin.filter(x=>x.passed).map(x=>x.e.p.name).join('、')}亦中进士，候选授官。`:''}${fx(chg({prestige:2,people:1}))}`;
  };
  const byAbility=()=>candidates.slice().sort((a,b)=>b.ability-a.ability);
  const kinLine=kin.length?`\n外家子弟${kin.map(x=>`${x.e.p.name}（${fullName(x.e.c)}的${officialKinLabel(x.e.h,x.e.role,x.e.c)}）`).join('、')}也在会试榜上应考。`:'';
  return {title:record.enke?'恩科殿试 · 钦点三甲':'殿试 · 钦点三甲',por:candidates[0],cast:candidates,
    text:`会试已毕，三名贡士候于殿外。${head?`礼部尚书${head.p.name}主持考务。`:''}\n${candidates.map(p=>`${p.name}，${p.age}岁，${p.origin}出身：${p.essay}。`).join('\n')}${kinLine}`,
    choices:[...candidates.map(p=>({t:`钦点${p.name}为状元`,f:()=>finish([p,...byAbility().filter(x=>x!==p)])})),
      {t:'交礼部按卷定次',f:()=>finish(byAbility())}]};
}
function examTick(){if(examDueNow())pushEv(examEvent());}
const ministriesBaseTick=courtTick;
courtTick=function(...args){const result=ministriesBaseTick.apply(this,args);examTick();return result;};

/* —— 页面 —— */
function viewMinistries(){
  const card=([id,m])=>{
    const head=ministryHead(id),used=S.ministries?.used?.[id],wait=used==null?0:Math.max(0,MINISTRY_GAP-(S.turn-used));
    const why=!head?'尚书空缺':wait?`${wait}个月后可再办`:id==='rites'&&(examPending()||S.turn-lastExamTurn()<24)?'两科之间须隔两年':id==='works'&&S.flags.floodDikeGen===S.gen?'河工已修固':E().energy<1?'精力不足':E().treasury<m.cost?'国库不足':'';
    return `<article class="card ministry-card"><div class="ministry-head">${head?porImg(head.p,56):''}<div><h3>${m.name}<small> · ${m.duty}</small></h3>
      <p>${head?`尚书 ${head.scholar?`<button class="person-link" onclick="A.go('scholar','${head.p.id}')">${esc(head.p.name)}</button>`:officialLink(head.e.c,head.e.role)} · 才干${rd(head.p.ability)}`:'<span class="hint">尚书空缺</span>'}</p></div></div>
      <p class="hint">${m.brief}${id==='rites'?` ${nextExamLabel()}。`:''}</p>
      <div class="acts"><button class="btn sm jade" onclick="A.ministryAct('${id}')" ${ministryReady(id)?'':'disabled'}>${m.action}<small>精力−1${m.cost?' · 国库−'+m.cost:''}${why?' · '+why:''}</small></button>
      <button class="btn sm" onclick="A.ministryAppoint('${id}')">${head?'改任尚书':'任命尚书'}</button></div></article>`;
  };
  const scholars=scholarList().filter(p=>!p.registrySource).slice().reverse();
  return `<button class="btn quiet sm detail-back" onclick="A.go('government')">← 返回治国理政</button><h2>六部</h2><p class="hint">尚书由在任且才干 55 以上的官员出任，一人不兼两部。各部每年可办一件大事，成败看尚书才干。</p>
    <div class="grid ministry-grid">${Object.entries(MINISTRIES).map(card).join('')}</div>
    ${detailSection('新科进士',scholars.length?`<ul class="story">${scholars.map(p=>`<li><button class="person-link" onclick="A.go('scholar','${p.id}')">${esc(p.name)}</button> · ${esc(p.examYear?`${p.examRank}`:'')} · ${esc(officialOfficeLabel(p))} · ${officialStatus(p)} · 才干${rd(p.ability)}</li>`).join('')}</ul>`:`<p class="hint">尚无科举出身的朝臣。${nextExamLabel()}。</p>`)}`;
}
function viewScholar(){
  const p=scholarById(UI.sel);if(!p)return viewMinistries();
  const held=ministryHeldBy(p),ready=officialServing(p)&&S.turn-(p.lastAudience??-99)>=3&&E().energy>=1;
  return `${personBackButton('ministries')}<header class="detail-head">${porImg(p,224)}<div class="grow"><p>${p.registrySource==='local'?(p.away?'地方官':'地方铨选出身'):p.registrySource==='family'?'外朝家族':'科举出身'} · ${esc(p.origin)}</p><h2>${esc(p.name)}</h2><p>${esc(officialOfficeLabel(p))}${held?'':''}</p><p>${p.age}岁 · <strong>${officialStatus(p)}</strong> · ${esc(p.temperament)} · ${esc(p.examYear?`${p.examRank}`:'')}</p></div></header>
    <div class="detail-vitals">${bar('才干',p.ability)}${bar('功绩',p.merit)}${bar('信任',p.trust)}</div>
    <div class="detail-actions"><div class="acts"><button class="btn primary" onclick="A.scholarTalk('${p.id}')" ${ready?'':'disabled'}>召见垂询<small>精力 −1</small></button></div><p class="hint">问候每三个月一次。翰林院历练满两年、才干 55 以上可出任文职各部尚书。</p></div>
    ${p.report?detailSection('待阅回奏',`<p>${esc(p.report.text)}</p><button class="btn jade" onclick="A.officialReport('scholar:${p.id}')">阅看回奏</button>`):''}${officialBrothersPanel({p,key:'scholar:'+p.id,scholar:true})}${officialSpousePanel({p,key:'scholar:'+p.id,scholar:true})}${detailSection('家族亲缘',careerKinHTML({p,key:'scholar:'+p.id,scholar:true}))}${detailSection(p.registrySource==='local'?'任内职责':'殿试策论',`<p>${esc(p.essay)}。</p>`)}${officialMarriagePanel('scholar:'+p.id)}${detailSection('个人履历与纪事',detailStory(p))}`;
}
A.scholarTalk=function(id){
  const p=scholarById(id);if(modalOpen||!p||!officialServing(p)||S.turn-(p.lastAudience??-99)<3||!useE())return;
  p.lastAudience=S.turn;p.trust=clamp(p.trust+3);
  const line={持正:'“臣出身草野，只知照账说话。账若不实，臣不敢替人遮掩。”',谨慎:'“臣初入翰林，所见尚浅。愿先把案卷读熟，再议更张。”',进取:'“臣殿试所论，愿有一日能亲手试行，以实绩请陛下验看。”',圆融:'“翰林院中各有门户，臣只愿不站门户，只站道理。”'}[p.temperament];
  scholarRecord(p,`陛下召见垂询。${line}`,false);save('auto');
  pushEv({title:'召见 · '+p.name,por:p,text:line,choices:[{t:'退下吧'}]});
};
PERSON_DETAIL_VIEWS.push('scholar');
