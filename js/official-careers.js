/* 官品、具名回奏与内外家书。旧事务按原版本重放，不补抽签、不改变旧批复。 */
const CAREER_JOURNAL=15;
const careersActive=()=>!!S&&!S.over&&journalContentVersion()>=CAREER_JOURNAL;
const GRADE_NAMES=['正一品','从一品','正二品','从二品','正三品','从三品','正四品','从四品','正五品','从五品','正六品','从六品','正七品','从七品','正八品','从八品','正九品','从九品'];
// 官名沿用游戏的架空朝制；品序以清制为参照。爵位、科名与营生不充作官品。
const CIVIL_CAREERS=[[1,'内阁大学士'],[2,'协办大学士'],[3,'户部侍郎'],[4,'内阁学士'],[5,'大理寺卿'],[6,'光禄寺卿'],[7,'道员'],[8,'知府'],[9,'同知'],[10,'知州'],[11,'通判'],[12,'翰林院修撰'],[13,'知县'],[14,'州同'],[15,'县丞'],[17,'主簿'],[18,'巡检']];
const ARMY_CAREERS=[[1,'镇国大将军'],[2,'提督'],[3,'总兵'],[4,'副将'],[5,'参将'],[6,'游击'],[7,'都司'],[9,'守备'],[10,'守御所千总'],[11,'千总'],[13,'把总'],[14,'外委千总'],[15,'外委把总']];
const OFFICE_GRADES={...Object.fromEntries([...CIVIL_CAREERS,...ARMY_CAREERS].map(([g,n])=>[n,g])),内阁首辅:1,河道总督:2,太医院院判:11,锦衣卫指挥使:5,骠骑将军:2,通政司参议:9,京营统领:3,县令:13,翰林院编修:13,翰林学士:4,两江总督:2,监察御史:14,盐运使:6,苏州织造:9,太医院吏目:18,游击将军:6,骁骑校尉:11};
function officialGrade(p){
  if(!p||['student','commoner'].includes(p.career))return null;
  const title=p.office||p.post||'';
  if(title.startsWith('候补'))return null;
  if(OFFICE_GRADES[title])return OFFICE_GRADES[title];
  if(/尚书$/.test(title))return 2;if(/侍郎$/.test(title))return 3;
  if(/员外郎$/.test(title))return 10;if(/郎中$/.test(title))return 9;if(/主事$/.test(title))return 11;
  for(const [grade,name] of [...CIVIL_CAREERS,...ARMY_CAREERS].sort((a,b)=>b[1].length-a[1].length))if(title.endsWith(name))return grade;
  return null;
}
function officialGradeLabel(p){const g=officialGrade(p);return g?GRADE_NAMES[g-1]:p?.career==='student'?'尚未授官':p?.career==='commoner'?'无官品':(p?.office||p?.post||'').startsWith('候补')?'候补 · 未实授':'未定品';}
function officialOfficeLabel(p){return `${p.office||p.post||'未任职'} · ${!officialAlive(p)||p.retired||p.dismissed||p.exiled?'原任':''}${officialGradeLabel(p)}`;}
// Family allegiance can remain military while a son studies or holds a civil office.
function officialMilitary(p,h){
  if(!careersActive())return h?.bloc==='army';
  if(!p||['student','commoner'].includes(p.career))return false;
  const title=p.office||p.post||'';
  if(/总兵|提督|将军|参将|副将|游击|都司|守备|千总|把总|校尉|统领|指挥使/.test(title))return true;
  if(officialGrade(p)||/^候补/.test(title))return false;
  return h?.bloc==='army';
}
function careerPeople(){return [...officialEntries().map(e=>({p:e.p,key:e.key,e,bloc:e.h.bloc})),...scholarList().map(p=>({p,key:'scholar:'+p.id,scholar:true,bloc:scholarCourtBloc(p)}))];}
function careerLink(person){return `<button class="person-link" onclick="A.go('${person.scholar?'scholar':'official'}','${person.scholar?person.p.id:person.key}')">${esc(person.p.name)} ↗</button>`;}
function careerEligible(p){return officialServing(p)&&p.age>=18&&!reliefSuspended(p)&&!!officialGrade(p);}
function careerTarget(person,direction){
  if(!person||!careerEligible(person.p)||S.turn-(person.p.lastCareerChange??-99)<6)return null;
  const p=person.p,g=officialGrade(p),army=ARMY_CAREERS.some(([,n])=>(p.office||p.post||'').endsWith(n))||/京营统领/.test(p.office||p.post||'');
  const track=army?ARMY_CAREERS:CIVIL_CAREERS;
  const options=track.filter(([n])=>direction==='promote'?n<g:n>g).sort((a,b)=>direction==='promote'?b[0]-a[0]:a[0]-b[0]);
  if(direction==='promote'&&(p.ability<50||p.merit<30))return null;
  return options[0]||null;
}
function careerSetOffice(person,title,reason){
  const p=person.p,from=officialOfficeLabel(p);p.office=title;p.post=title;p.career='official';p.lastCareerChange=S.turn;
  p.away=/知府|知州|知县|同知|通判|道员|总督|守备|总兵|提督|副将|参将|游击|都司|千总|把总/.test(title);
  delete p.postReview;
  const text=`${reason}：由${from}改任${officialOfficeLabel(p)}。`;
  (p.careerHistory ||= []).push({turn:S.turn,d:dateStr(),from,to:officialOfficeLabel(p),reason});
  courtPersonRecord(person,text);return text;
}

/* 亲缘有来由：同父、实际婚配的双向标识、生成时明确记下的远房谱系。绝不凭姓氏猜亲属。 */
function careerKin(person){
  if(!person)return [];
  const found=new Map(),add=(c,type,label,detail)=>{if(!found.has(c.id))found.set(c.id,{c,type,label,detail});};
  if(person.e)for(const c of paternalFamily(person.e.c).filter(c=>S.consorts.includes(c)))add(c,'blood',officialKinLabel(person.e.h,person.e.role,c),'同父家系');
  for(const edge of person.p.courtKin||[])for(const c of S.consorts){
    const h=houseOf(c);if(h?.father.id===edge.fatherId)add(c,edge.type==='maternalNephew'?'blood':'branch',edge.type==='maternalNephew'?'外甥':person.p.age>=h.father.age?'远房族伯':'远房族叔',edge.detail);
  }
  const houses=new Map();for(const c of S.consorts){const h=houseOf(c);if(h&&!houses.has(h.father.id))houses.set(h.father.id,{c,h});}
  for(const {c,h} of houses.values())for(const sister of h.relatives||[]){
    const sp=sister.spouse;if(!sister.married||sister.alive===false||sp?.alive===false&&!sister.widow||!sp?.personId)continue;
    const husband=careerPeopleForMarriage(sp.personId);if(!husband)continue;
    const inGroom=person.p.id===husband.p.id||!!(person.e&&husband.h&&person.e.h.father.id===husband.h.father.id),inBride=!!(husband.c&&person.e?.h.father.id===h.father.id);
    if(!inGroom&&!inBride)continue;
    const other=inGroom?c:husband.c;
    for(const member of paternalFamily(other).filter(x=>S.consorts.includes(x)))add(member,'marriage','姻亲',`${sister.name}与${husband.p.name}成婚，两家结亲`);
  }
  return [...found.values()];
}
function careerPeopleForMarriage(id){return officialEntries().find(e=>e.p.id===id)||(scholarById(id)?{p:scholarById(id),key:'scholar:'+id,scholar:true}:null);}
function careerKinText(person){return careerKin(person).map(r=>`${fullName(r.c)}的${r.label}（${r.detail}）`).join('；')||'未登记宫中亲缘';}
function careerKinHTML(person){return careerKin(person).map(r=>`<p><button class="person-link" onclick="A.go('consort',${r.c.id})">${esc(fullName(r.c))}${r.c.alive?'':'（已故）'}</button> · ${esc(r.label)}<small>${esc(r.detail)}</small></p>`).join('')||'<p class="hint">未登记宫中亲缘。同姓不等于同族。</p>';}
function careerFamilyEcho(person,kind,text,report){
  for(const r of careerKin(person).filter(r=>r.c.alive&&!r.c.gone)){
    const c=r.c,formal=isSolitary(c)||['持重','淡泊','聪慧','才女','好学','刚烈'].includes(c.trait),proud=['骄纵','骄矜','城府','善妒'].includes(c.trait);
    const quotes=kind==='promote'||kind==='reward'?[formal?'他能凭实绩立身，臣妾替他高兴。更盼他记得，升了一阶，也多担了一分责。':proud?'这回总算有人看见他的本事了。臣妾也想把这份好消息告诉家里。':'多谢陛下记得他的辛苦。家书送到，家里该能安心些了。',3]:kind==='demote'||kind==='accountable'?[formal?'臣妾心里自然不好受。可任上有疏漏，总该把该补的事补好。':proud?'这折子只写了他的过失么？臣妾想再看看原委……若真是他的错，也不敢瞒。':'臣妾怕家里撑不住，也怕他从此一蹶不振。只盼还有补过的机会。',-4]:['臣妾已听说这份回奏。任上好坏，还请陛下照实情裁断。',0];
    if(kind==='central'){quotes[0]=formal?'他在地方做成了实事，如今调入中央，臣妾替他欣慰。也愿他仍记着百姓的日子，担好新的差事。':proud?'他做成的事总算让朝中看见了！想到往后能在京中任职，臣妾心里自然欢喜。':'听说他因任上的功劳调回京中，臣妾很高兴。只盼新差事虽重，他也能好好照顾自己。';quotes[1]=4;}
    const relation=r.type==='blood'?'':`（${r.label}，${r.detail}）`,line=`【前朝家书】${person.p.name}${relation}：${text} 她道：“${quotes[0]}”`;
    story(c,line);
    if(characterRecordsActive()&&report?.kind==='local'&&report.id)characterChapter(c,localChronicleThread(report),'family','外家差务',[person.p],'',{append:true});
    cchg(c,{mood:quotes[1]*(r.type==='blood'?1:.5)});
    c.careerNews={personId:person.p.id,key:person.key,turn:S.turn,quote:quotes[0],kind};
    NPCMemory.record(S,{type:'career-family',time:S.turn,participants:[c.id,person.p.id],object:text},[{person:c.id,subject:person.p.id,interpretation:line,emotion:quotes[1]/10,impact:r.type==='blood'?75:45}]);
  }
}
function careerFamilyVoice(c){
  const n=c.careerNews;if(!n||S.turn-n.turn>6)return null;const person=courtPerson(n.key);
  return person&&officialAlive(person.p)&&careerKin(person).some(r=>r.c.id===c.id)?voiceLine('career-news',`她提起${person.p.name}近来的回奏。`,n.quote):null;
}

/* 月末新建、固定保存的地方报告；三个州县常备官员，已有地方官也参加轮转。 */
const LOCAL_REPORTS=[
  {id:'water',title:'河堤修缮',unit:'段堤岸',target:12,good:'验堤册与民夫工簿相符，险段已加固。',bad:'复勘发现数段仍漏水，工料账上却已销账。'},
  {id:'grain',title:'赈粮发放',unit:'户灾民',target:600,good:'赈册与乡老具结相符，粮食已送到受灾人家。',bad:'仓册已记发足，逐户核验却仍有灾民未领到口粮。'},
  {id:'justice',title:'积案清理',unit:'件积案',target:30,good:'复核案卷后结案，当事人的供词与结案簿相合。',bad:'催结过急，退回重审的案卷尚未补齐证词。'},
  {id:'school',title:'乡学修复',unit:'间学舍',target:10,good:'学舍已验收，塾师与里正联名回报孩童复学。',bad:'账上报成，实地勘验仍有教室漏雨，迟迟不能开课。'}
];
function ensureLocalOfficers(){
  if(!careersActive()||S.flags.localOfficers)return;
  S.flags.localOfficers=true;S.scholars ||= [];
  for(const [i,region] of ['临安','清河','永宁'].entries()){
    const p=makeScholar();p.registrySource='local';p.region=region;p.office=region+'知县';p.post=p.office;p.away=true;p.age=ri(30,48);p.merit=ri(25,45);p.appointedTurn=S.turn-24;p.ageTrackedAt=S.turn;
    p.origin='地方铨选';p.essay='按季呈报任内实绩，候吏部考核';
    if(i===0&&chance(.35)){
      const roots=officialEntries().filter(e=>e.role==='father'&&officialAlive(e.p)&&familyIsNoble(e.c));
      if(roots.length){const root=pick(roots);p.sur=root.c.sur;p.name=p.sur+courtGivenName(p.sur,p.seed);p.age=Math.max(30,Math.min(65,root.p.age+ri(-8,8)));p.courtKin=[{fatherId:root.p.id,type:'branch',detail:`谱牒记载：与${root.p.name}出自同族旁支，分房多年，非亲兄弟`}];}
    }
    if(expandedOfficialPortraitsActive()){delete p.artPortrait;assignCourtOfficialPortrait(p,'civil');}
    S.scholars.push(p);scholarRecord(p,`吏部核录：现任${officialOfficeLabel(p)}，在${region}办差。${careerKinText({p,scholar:true,key:'scholar:'+p.id})}。`,false);
  }
}
function localReportEligible(person){const p=person.p;return careerEligible(p)&&!p.rectification&&!p.report&&!p.postReview&&S.turn-(p.lastLocalReport??p.appointedTurn??-99)>=6&&/知县|县令|知府|知州|同知|通判|道员|总督/.test(p.office||p.post||'');}
function createLocalReport(person){
  const p=person.p,task=pick(LOCAL_REPORTS),good=chance(clamp(p.ability*.65+p.trust*.2,20,90)/100),done=good?task.target:Math.floor(task.target*ri(35,68)/100);
  const outcome=good?'success':'setback',region=p.region||(p.office||p.post).replace(/知县|县令|知府|知州|同知|通判|道员|总督/g,'')||'任所';
  p.lastLocalReport=S.turn;p.report={id:`local-${p.id}-${S.turn}`,kind:'local',title:`${region} · ${task.title}`,office:p.office||p.post,turn:S.turn,outcome,region,target:task.target,done,unit:task.unit,
    text:`${p.name}呈报${task.title}：定额${task.target}${task.unit}，核实完成${done}${task.unit}。${good?task.good:task.bad}`,verified:true};
  p.merit=clamp(p.merit+(good?8:-5));
  courtPersonRecord(person,`【呈奏】${p.report.title}。${p.report.text} 待御批。`);careerFamilyEcho(person,'submitted',p.report.text);
  return p.report;
}
function careerTick(){
  if(!careersActive()||S.flags.careerTick===S.turn)return;S.flags.careerTick=S.turn;
  ensureLocalOfficers();
  for(const p of scholarList()){
    if(!officialAlive(p))continue;
    if(p.storyPerson==='xiean'&&PalaceActions.xiePoetryAge){
      if(p.xiean.readingStarted===undefined)p.xiean.readingStarted=!xieAwaitsFirstReading(p);
      if(!p.xiean.readingStarted){p.age=XIE_DEBUT_AGE;p.ageTrackedAt=S.turn;continue;}
    }
    p.ageTrackedAt ??= S.turn;
    const years=Math.max(0,Math.floor((S.turn-p.ageTrackedAt)/12));p.age+=years;p.ageTrackedAt+=years*12;
    if(p.age>=70&&!p.retired&&!p.commission&&!p.report){p.retired=true;scholarRecord(p,'年逾七十，依例致仕归乡。');}
  }
  if(palaceDetailsActive())localRectificationTick();
  const localReportInterval=journalContentVersion()>=42?6:3;
  if(S.turn-(S.flags.lastLocalReport??0)<localReportInterval)return;
  const pool=careerPeople().filter(localReportEligible).sort((a,b)=>(a.p.lastLocalReport??-99)-(b.p.lastLocalReport??-99));
  if(pool.length){createLocalReport(pool[0]);S.flags.lastLocalReport=S.turn;}
}
const careersBaseTick=courtTick;
courtTick=function(...args){const result=careersBaseTick.apply(this,args);careerTick();return result;};

function careerReportEvent(person){
  const p=person?.p,r=p?.report;if(!r)return null;
  if(r.kind==='rectification')return rectificationReport(person,r);
  const valid=()=>!S.over&&p.report===r;
  const sameOffice=()=>!r.office||r.office===(p.office||p.post);
  const ready=()=>valid()&&careerEligible(p)&&sameOffice();
  const target=direction=>ready()?careerTarget(person,direction):null;
  const finish=kind=>{
    if(!valid()||!officialAlive(p)&&kind!=='record')return null;
    if(['promote','demote'].includes(kind)&&!target(kind))return null;
    if(kind==='reward'&&(!ready()||E().treasury<15))return null;
    if(kind==='accountable'&&!ready())return null;
    if(kind==='central'&&(!ready()||!localCentralTarget(person)))return null;
    if(kind==='commend'&&(!ready()||!localMeritReport(r)||r.outcome!=='success'))return null;
    const appointment=kind==='central'?localCentralTarget(person):['promote','demote'].includes(kind)?target(kind):null;
    const labels={promote:'实绩卓著，准予升任',central:'地方殊绩，破格擢入中央',commend:'下诏褒奖，留任推行善政',demote:'实绩不称，降职任用',reward:'嘉奖实绩，赏银十五万两',accountable:'申斥疏漏，责令补报善后',record:'阅毕，存档备考'};
    let decision=labels[kind];delete p.report;
    if(palaceDetailsActive()&&kind==='accountable'&&localMeritReport(r)&&r.done<r.target){
      p.rectification={id:r.id,due:S.turn+2};
      (S.flags.localRectifications||=[]).push({key:person.key,id:p.id});
      decision+='。限两个月后将补办数与原折同呈。'+p.name+'答：“'+(RECTIFICATION_PLANS[p.temperament]||RECTIFICATION_PLANS.谨慎)+'”';
    }
    if(appointment)decision=careerSetOffice(person,appointment[1],decision);
    if(kind==='reward'){chg({treasury:-15});p.trust=clamp(p.trust+5);p.lastReward=S.turn;p.rewardedMerit=p.merit;}
    if(kind==='commend')p.trust=clamp(p.trust+3);
    if(kind==='accountable'||kind==='demote')p.trust=clamp(p.trust-5);
    const text=`【御批】${r.title}：${r.text} 批复：${decision}${decision.endsWith('。')?'':'。'}`;
    (p.reportHistory ||= []).push({turn:S.turn,d:dateStr(),...r,decision});
    if(palaceDetailsActive()&&localMeritReport(r)){
      const old=S.flags.schoolDocket;
      if(!old||old.gen!==S.gen||old.student||S.turn>=old.ready+6)
        S.flags.schoolDocket={gen:S.gen,ready:S.turn+1,id:r.id,name:p.name,key:person.key,author:p.id,title:r.title,done:r.done,target:r.target,unit:r.unit};
    }
    courtPersonRecord(person,text);if(kind==='commend')proposeYiLand(person,r);noteLocalChronicle(person,r,kind);careerFamilyEcho(person,kind==='commend'?'reward':kind,`${r.title}：${r.text} 批复：${decision}`,r);
    if(person.e&&['reward','accountable','promote','demote','central','commend'].includes(kind))officialFamilyReaction(person.e,['promote','central','commend'].includes(kind)?'reward':kind==='demote'?'accountable':kind,r.title+'；'+decision);save('auto');return text;
  };
  const choice=(direction,label)=>{const to=target(direction);return {t:to?`${label} → ${to[1]} · ${GRADE_NAMES[to[0]-1]}`:`${label}（暂不符合条件）`,cond:()=>!!target(direction),why:'须在任、未转任他职，升任需才干50、功绩30，升贬间隔半年且未到品序边界',f:()=>finish(direction)};};
  return {title:(r.kind==='local'?'地方实绩 · ':'外臣回奏 · ')+r.title,por:p,valid,text:`${p.name} · ${officialOfficeLabel(p)}\n${r.text}\n亲缘：${careerKinText(person)}\n${sameOffice()?'据实绩批复；亲缘不替代考课。':'此折出自原任，现职已变，只存录原任表现。'}`,choices:[
    ...(r.outcome==='success'?[{t:'嘉奖实绩 · 国库−15',cond:()=>ready()&&E().treasury>=15,why:'须在任且国库充足',f:()=>finish('reward')},choice('promote','升职')]:[ {t:'申斥，责令补报善后',cond:ready,why:'须在任且未转任',f:()=>finish('accountable')},choice('demote','降职')]),
    ...(localMeritReport(r)&&r.outcome==='success'?[{t:'下诏褒奖，留任推行善政',cond:ready,why:'须在原任且可办差',f:()=>finish('commend')},...(r.rating==='exceptional'?[{t:`破格擢入中央 → ${localCentralOffice(p,r.department)} · ${officialGradeLabel({office:localCentralOffice(p,r.department)})}`,cond:()=>ready()&&!!localCentralTarget(person),why:'须仍在原任，才干75、功绩65，距上次调任至少半年',f:()=>finish('central')}]:[])]:[]),
    {t:'阅毕，存档备考',f:()=>finish('record')} ]};
}
const careersBaseReport=officialReportEvent;
officialReportEvent=function(e){return careersActive()&&e?.p.report?.outcome!=='death'&&officialAlive(e?.p)?careerReportEvent({p:e.p,key:e.key,e,bloc:e.h.bloc}):careersBaseReport(e);};
const careersBasePending=pendingOfficialReport;
pendingOfficialReport=function(){return careersBasePending()||(careersActive()?careerReportEvent(careerPeople().find(x=>x.scholar&&x.p.report)):null);};
const careersBaseRead=A.officialReport;
A.officialReport=function(key){if(!careersActive()||!String(key).startsWith('scholar:'))return careersBaseRead(key);if(!modalOpen)pushEv(careerReportEvent(courtPerson(key)));};
function careerReportsHTML(){
  const pending=careerPeople().filter(x=>x.p.report);return detailSection('具名回奏',`<p class="hint">地方实绩每半年至多由一名符合条件的地方官呈报。回奏保留实绩、御批与亲眷反应。</p>${pending.map(x=>`<article class="card" style="display:block;cursor:default"><p>${careerLink(x)} · ${esc(officialOfficeLabel(x.p))}</p><p>${esc(x.p.report.text)}</p><button class="btn jade" onclick="A.officialReport('${x.key}')">批阅 · ${esc(x.p.report.title)}</button></article>`).join('')||'<p class="hint">暂无待批的具名回奏。</p>'}`);
}

/* 身在前朝，也记挂宫里的女儿与姐妹。比较实际变化，绝不把读档当作新事件。 */
function courtFamilyLifeTick(previous){
  repairFamilyConcernWording();
  if(!careersActive()||!previous||previous.gen!==S.gen)return;
  const expanded=journalContentVersion()>=40;
  const before=new Map((previous.consorts||[]).map(c=>[c.id,c]));
  for(const c of S.consorts){
    const old=before.get(c.id);if(!old)continue;
    if(palaceKinFlowActive()&&old.cold&&!c.cold)delete c.palaceKinPetitionId;
    if(palaceKinResponseActive()&&c.alive&&palaceKinLettersBarred(c)){closePalaceKinMail(c);continue;}
    if(whiteSpringRoyal(c)){whiteSpringFamilyChanges(c,old,previous);continue;}
    const newborn=S.children.filter(k=>k.mom===c.id&&!(previous.children||[]).some(o=>o.id===k.id));
    const kind=old.alive&&!c.alive?'death':!old.cold&&c.cold?'cold':expanded&&old.cold&&!c.cold?'released':c.rank<old.rank?'demoted':
      newborn.length?'birth':old.preg<2&&c.preg>=2?'pregnancy':expanded&&c.rank>old.rank?'promoted':
      old.favor<70&&c.favor>=70?'favored':old.favor>=25&&c.favor<25?'neglected':old.cold&&!c.cold?'released':null;
    if(!kind)continue;
    const key=`${c.id}:${kind}`,stamp=`${S.turn}:${newborn.map(k=>k.id).join(',')}${kind==='promoted'?':'+c.rank:''}`;
    const fact={death:'去世',cold:'被迁入冷宫',demoted:`由${RANKS[old.rank]}降为${RANKS[c.rank]}`,promoted:`由${RANKS[old.rank]}晋为${RANKS[c.rank]}`,birth:`诞育${newborn.map(k=>kidName(k)).join('、')}`,pregnancy:'有孕的消息传到家中',favored:'近来颇得圣眷',neglected:'近来少有召见',released:'获准离开冷宫'}[kind];
    if(expanded)recordSisterPalaceConcerns(c,old,kind,fact,key,stamp);
    const penalty=journalContentVersion()>=88&&['cold','demoted'].includes(kind);
    const lostCrown=penalty&&old.rank===8;
    let kin=careerPeople().filter(x=>officialAlive(x.p)).map(person=>({person,r:careerKin(person).find(r=>r.c.id===c.id)})).filter(x=>x.r);
    if(palaceKinFlowActive()&&c.alive&&!c.gone&&PALACE_KIN_NEWS[kind]&&(kind!=='neglected'||!c.cold)){
      const direct=kin.filter(({person,r})=>palaceKinDirect(c,person,r));
      if(direct.length)recordPalaceKinNews(c,direct,kind,fact,key,stamp,old);
      kin=kin.filter(item=>!direct.includes(item));
    }
    const writers=penalty?familyPenaltyWriters(kin,key,stamp,lostCrown):null;
    for(const {person,r} of kin){
      if(r.type!=='blood'&&!['cold','demoted','birth','death'].includes(kind))continue;
      if(person.p.palaceConcerns?.[key]===stamp)continue;
      (person.p.palaceConcerns ||= {})[key]=stamp;
      const sober=['持正','谨慎'].includes(person.p.temperament);
      let quote={death:'旧信还收在匣中，今后却再也等不到她的回信了。',cold:'臣不敢以家事乱国法，只求她有衣御寒、有药可医。',demoted:sober?'臣会写信劝她自省。只是做家人的，到底免不了担心。':'臣想听听她的近况。她性子里的委屈，可有人肯听？',birth:'母子可都平安？家中已备下小衣裳，只盼她好好将养。',pregnancy:'她打小就不肯轻易说难受。还望御医多问一句，别让她独自硬撑。',favored:sober?'家中自是欢喜，也会劝她慎言守礼，不可仗着圣眷失了分寸。':'听说她过得顺遂，家中悬着的心才放下。',neglected:'家书只说一切都好。臣却怕她报喜不报忧，把失落都藏着。',released:'知道她离了冷宫，臣一夜未眠，总算能往家里报个平安。'}[kind];
      if(familyJusticeActive()&&['cold','demoted','death'].includes(kind)){
        const context=familyPenaltyContext(c,old);
        if(kind!=='death'||context.known==='guilty')quote=familyPenaltyQuote(person.p,context);
      }
      if(penalty)quote=familyPenaltyVoice(person.p,r,familyPenaltyContext(c,old),lostCrown,quote);
      if(kind==='promoted')quote=familyPromotionThought(c,r.label);
      const text=`【宫中牵挂】得知${fullName(c)}${fact}，${person.p.name}道：“${quote}”`;
      story(person.p,text);if(!writers||writers.has(person))log(text);person.p.palaceConcern={c:c.id,kind,turn:S.turn,quote};
      if(c.alive&&!c.gone&&(!writers||writers.has(person))){const line=`【娘家来信】${r.label}${person.p.name}得知${familyJusticeActive()?fullName(c):'自己'}${fact}，托人传话：“${quote}”`;story(c,line);NPCMemory.record(S,{type:'family-concern',time:S.turn,participants:[c.id,person.p.id],object:fact},[{person:c.id,subject:person.p.id,interpretation:line,emotion:['favored','birth','promoted'].includes(kind)?.4:-.4,impact:75}]);}
    }
  }
}
function familyPromotionThought(c,role){
  const roots=familyUpbringing(c),kin=role==='父亲'?'女儿':role==='弟弟'?'姐姐':'妹妹';
  if(roots.means==='ample'||roots.power>=55)return role==='父亲'?
    '听说女儿晋位，我替她高兴。家里的事也要料理稳妥，她受了委屈时，还有娘家可以依仗。':
    `我为${kin}高兴，也想把手上的事办得再稳些。她往后若有难处，可以先同自家人说几句心里话。`;
  if(['humble','farm'].includes(roots.group)||roots.means==='modest')return role==='父亲'?
    '得知女儿晋位，我心里欢喜。家里的生计还得自己撑起，才好叫她在宫里少一重牵挂。':
    `知道${kin}得了喜信，我也想发奋学些本事，替家里多分担一点，让她少为我挂心。`;
  return `我把${kin}晋位的家书留好。托人道贺时，也想问她近日过得如何。`;
}
function recordSisterPalaceConcerns(c,old,kind,fact,key,stamp){
  const h=houseOf(c);if(!h)return;
  const sisters=[...natalPeople(h).filter(p=>p.sex==='f'&&!p.natalCollateral&&!p.parentRelativeId&&!p.motherRelativeId&&natalAge(p)>=6),
    ...paternalFamily(c).filter(p=>p!==c&&S.consorts.includes(p)&&!p.gone)];
  const cause=['cold','demoted'].includes(kind)?familyPenaltyContext(c,old):null;
  for(const p of sisters){
    if(!p.alive||p.palaceConcerns?.[key]===stamp)continue;
    const close=relGet(c,p)>=25,name=p.name||fullName(p);
    let quote={
      promoted:close?'她这些年在宫里也有辛苦。听见晋位，我是真替她欢喜，也盼她得空说说近况。':'新位分有新规矩，也有更多人看着她。道贺的话要说，也想问她近日可还安稳。',
      cold:cause?.known==='guilty'?`既然${cause.crime}已查实，只盼她知错守规。我想问问能否依例送衣药去。`:'消息只说她去了冷宫，缘由我还没听全。先托人问一句，她身边可有御寒的衣裳？',
      demoted:cause?.known==='guilty'?`听说${cause.crime}已经查实，我心里很不好受。盼她把该认的错认下，也保重身子。`:'听说她受了降罚，我想等家书说清原委，再问问她缺些什么。',
      released:'听说她已离了冷宫，才敢松一口气。先让她歇几日，想说话时再听她慢慢说。',
      neglected:'听说近日少有召见，也不知她愿不愿提这些事。我还是想问问她过得好不好。',
      favored:'知道她近来得眷，我替她高兴。下回写信，想听听她近来喜欢做什么。',
      pregnancy:'宫里有了喜信，我先想着她近来吃睡如何，也想知道可有人好好照料她。',
      birth:'听说家里添了孩子，我替她高兴，也盼她这些日子能安心将养。',
      death:'家里报了死讯。我又翻了一遍她早些年写的信，想起那时还说来日再见。'
    }[kind];
    if(cause&&old.rank===8&&journalContentVersion()>=88)quote=(close?'她收起凤冠那晚，身边可有个能说话的人？':'从前给家中回信，她总在末尾嘱咐我们守礼。往后再写信，家里也该改称呼了。')+(cause.known==='guilty'?'听说'+cause.crime+'已查实，我也盼她肯认错。':'');
    (p.palaceConcerns ||= {})[key]=stamp;
    p.palaceConcern={c:c.id,kind,turn:S.turn,date:dateStr(),quote,sister:true};
    story(p,`【宫中牵挂】${name}听说${fullName(c)}${fact}，记下：“${quote}”`);
    Object.assign(p.story.at(-1),{thread:`sister-palace:${S.gen}:${c.id}:${p.id}:${kind}:${stamp}`,
      life:{kind:'family',title:'宫中牵挂',turn:S.turn,gen:S.gen,people:[{id:p.id,name},{id:c.id,name:fullName(c)}],source:'姐妹间的消息'}});
  }
}
function sisterPalaceConcernPanel(p){
  const note=p.palaceConcern,c=note?.sister&&byId(note.c);
  return c?detailSection('宫中牵挂',`<p>${esc(note.date)} · <button class="person-link" onclick="A.go('consort',${c.id})">${esc(fullName(c))} ↗</button></p><p>${esc(note.quote)}</p>`):'';
}
const careersBaseConversation=officialConversation;
officialConversation=function(e,topic){const n=e.p.palaceConcern,c=n&&byId(n.c);return topic==='family'&&n&&c&&S.turn-n.turn<=12?`“${fullName(c)}的事，臣仍记挂着。${n.quote}”`:careersBaseConversation(e,topic);};

/* 羡人有兄：必须确有受议论的、在任有功的兄长。原创对白，不冒充剧中台词。 */
function brotherSupportContext(c){
  if(!careersActive()||!inPalace(c)||c.maid||c.age<18||c.aff<35||S.turn-(c.brotherSupportAt??-99)<12)return null;
  const own=houseOf(c);if(!own)return null;
  const elders=officialRoles(own).filter(r=>r!=='father').map(r=>({p:officialPerson(own,r),role:r})).filter(x=>officialKinLabel(own,x.role,c).includes('兄'));
  if(elders.some(x=>!officialAlive(x.p)||officialServing(x.p)&&officialGrade(x.p)&&officialGrade(x.p)<=8&&x.p.merit>=40))return null;
  for(const other of harem().filter(x=>x!==c&&inPalace(x)&&houseOf(x)?.father.id!==own.father.id)){
    const h=houseOf(other);if(!h)continue;
    for(const role of officialRoles(h)){if(role==='father'||!officialKinLabel(h,role,other).includes('兄'))continue;
      const p=officialPerson(h,role);if(officialServing(p)&&officialGrade(p)&&officialGrade(p)<=8&&p.merit>=40)return {other,p,elders};
    }
  }
  return null;
}
function brotherSupportLine(c,ctx){
  const opening=ctx.elders.length?'臣妾家里也有兄长，只是各有自己的日子，不能替臣妾处处周全。':'臣妾自幼没有兄长。有时见旁人家书里兄妹相护，也会多看一眼。';
  if(isSolitary(c))return opening+' 倒不是想借谁的势，只是偶尔也会想，若有人记得自己幼时的模样，会是什么滋味。';
  if(['才女','好学','聪慧','持重','淡泊'].includes(c.trait))return opening+' 书中杨贵妃有族兄杨国忠，可亲缘成了权势，未必是福。臣妾羡慕的，是有人关心，并非有人揽权。';
  if(['骄纵','骄矜','善妒','城府'].includes(c.trait))return opening+` ${fullName(ctx.other)}有${ctx.p.name}这样的兄长，旁人说话都多留三分。臣妾心里怎么会全不在意？`;
  return opening+' 若受了委屈，能有人先问一句疼不疼，想来也是好的。';
}
A.brotherSupport=function(id){
  const c=byId(id),ctx=c&&brotherSupportContext(c);if(modalOpen||!ctx)return;
  pushEv({title:'家书之间 · 羡人有兄',por:c,present:[c],valid:()=>!!brotherSupportContext(c),text:`听说${fullName(ctx.other)}的兄长${ctx.p.name}任${officialOfficeLabel(ctx.p)}，${fullName(c)}垂眼整理着家书。\n“${brotherSupportLine(c,ctx)}”`,choices:[
    ...[['安心说你的委屈',4,'陛下听她说完，告诉她不必把心事都藏进家书。'],['用人看实绩，亲情另当珍重',2,'陛下说明用人仍依实绩，也愿认真听她说家中的牵挂。']].map(([t,mood,result])=>({t:t+' · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>{if(!brotherSupportContext(c)||!useE())return null;c.brotherSupportAt=S.turn;cchg(c,{mood,aff:2});story(c,`【羡人有兄】听说${ctx.p.name}任${officialOfficeLabel(ctx.p)}，她道：“${brotherSupportLine(c,ctx)}” ${result}`);save('auto');return result;}})),{t:'改日再听'}]});
};

function firstChildWishContext(c){
  if(!careersActive()||!pregnancyPrayerEligible(c)||c.age<18||['悲恸','心如死灰','怨恨'].includes(xinOf(c)))return null;
  const key=pregnancyPrayerKey(c);if(c.firstChildWish?.key===key)return null;
  // 去世的孩子仍然算曾经出生；不能把失而复得的盼望说成皇长子、第一位公主。
  const sexes=['m','f'].filter(sex=>!S.children.some(k=>k.sex===sex&&!k.removedFromRoyal));
  if(!sexes.length)return null;
  const sex=sexes.length===1?sexes[0]:(c.trait==='活泼'||c.trait==='温婉'||isSolitary(c)?'f':'m');
  return {key,sex,title:sex==='m'?'皇长子':'第一位公主'};
}
function firstChildWishLine(c,ctx){
  const title=ctx.title;
  if(c.trait==='体弱')return `若这一胎是${title}，臣妾自然欢喜。只是近日总觉乏力……比起旁人的夸赞，臣妾更盼能平安把孩子抱在怀里。`;
  if(isSolitary(c))return `宫里还没有${ctx.sex==='m'?'皇子':'公主'}。若这一胎是${title}，臣妾想亲手替孩子缝一件小衣。男孩女孩都好，别让旁人的盼望压着孩子。`;
  if(['骄纵','骄矜','城府','善妒'].includes(c.trait))return `若臣妾这一胎能为陛下诞下${title}，陛下可要记得今日的话。${ctx.sex==='m'?'臣妾还盼着往后再添麟儿呢。':'往后宫里也多一位可以捧在掌心的小姑娘。'}`;
  if(['持重','聪慧','才女','好学','淡泊'].includes(c.trait))return `臣妾也想过，若能诞下${title}，想来宫里宫外都要欢喜。可这一胎尚未落地，只愿孩子安稳长大，莫先替孩子定了一生。`;
  return `宫里还没有${ctx.sex==='m'?'皇子':'公主'}呢。若臣妾这一胎是${title}，陛下会不会特别高兴？臣妾也知道不能说准，只是夜里想起，便忍不住盼一盼。`;
}
function firstChildWishVoice(c){const ctx=firstChildWishContext(c);return ctx?voiceLine('first-child-wish','她抚着小腹，说起宫中尚未有过的那一份欢喜。',firstChildWishLine(c,ctx)):null;}
A.firstChildWish=function(id){
  const c=byId(id),ctx=c&&firstChildWishContext(c);if(modalOpen||!ctx)return;
  pushEv({title:'孕中盼望 · '+ctx.title,por:c,present:[c],valid:()=>!!firstChildWishContext(c),text:`“${firstChildWishLine(c,ctx)}”`,choices:[
    ...[['陪她一起盼着',5,'陛下陪她说起新生儿的小名与襁褓，愿这份盼望平安落地。'],['男孩女孩都珍重，平安最要紧',7,'陛下说男孩女孩都珍重，先顾好母子平安。她松了口气，把心里的压力慢慢说了出来。']].map(([t,mood,response])=>({t:t+' · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>{
      if(!firstChildWishContext(c)||!useE())return null;
      c.firstChildWish={key:ctx.key,sex:ctx.sex,title:ctx.title,turn:S.turn};
      story(c,`【孕中盼望】她道：“${firstChildWishLine(c,ctx)}” ${response}`);cchg(c,{mood,aff:2});remember(c,'pregnancy-wish',response);save('auto');return response;
    }})),{t:'先陪她歇息'}]});
};
const careerPrayerBirthEcho=pregnancyPrayerBirthEcho;
pregnancyPrayerBirthEcho=function(c,children){
  const base=careerPrayerBirthEcho(c,children);
  const wish=c.firstChildWish;if(!careersActive()||!wish||wish.settled||!children.length||c.delivery?.firstWishKey!==wish.key)return base;
  wish.settled=true;
  if(c.delivery?.concealedLoss||children.some(k=>k.birthSwap?.occurred))return base;
  const alive=children.filter(k=>k.alive),matched=alive.some(k=>k.sex===wish.sex);
  story(c,`【孕愿回音】曾盼着${wish.title}。${!c.alive?'她未能熬过生产，旧日盼望留在了家人记忆里。':!alive.length?'如今只余未穿过的小衣，旧日的盼望更添伤怀。':matched?'这一胎果然迎来了所盼的孩子，她把旧日的话轻轻说给孩子听。':'孩子的性别与当初所盼不同，她仍伸手碰了碰孩子的小脸。比起愿望是否成真，平安相见更可珍重。'}`);
  return base;
};
