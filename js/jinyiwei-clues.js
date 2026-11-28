/* 定期线索来自既有案卷与实际回奏；风闻不是罪证。密查中的消息不凭空进入当事人的内心。 */
function jinyiweiClueSources(){
  const j=jinyiwei();if(!j)return [];
  return [
    ...palaceCases().filter(x=>x.kind!=='audit'&&caseReady(x)).map(x=>({key:'case:'+x.id,caseId:x.id,title:x.title,text:`旧卷「${x.title}」尚未查清。缇骑访得当年经手簿册的去处，可沿原案再核对证人与时日。去处是线索，尚不能据此指认主使。`})),
    ...careerPeople().filter(x=>careerEligible(x.p)&&x.p.report&&x.p.report.outcome==='setback').map(x=>({key:`report:${x.p.id}:${x.p.report.turn}:${x.p.report.title}`,target:x.key,targetId:x.p.id,targetName:x.p.name,office:x.p.office||x.p.post,report:{...x.p.report},title:x.p.name+'任内回奏',text:`${x.p.name}呈报「${x.p.report.title}」：${x.p.report.text} 缇骑建议调取原簿复核。办事不力、簿册有误与故意侵吞须分别查证，不能混作一案。`}))
  ].filter(x=>!(j.clues||[]).some(y=>y.key===x.key&&S.turn-y.turn<12));
}
function createJinyiweiClue(source){
  const j=jinyiwei();if(!j||!source)return null;
  const clue={...source,id:`clue-${S.gen}-${S.turn}-${(j.clueSerial=(j.clueSerial||0)+1)}`,turn:S.turn,d:dateStr(),status:'new'};
  (j.clues ||= []).push(clue);if(j.clues.length>24){const i=j.clues.findIndex(x=>x.status!=='new');if(i>=0)j.clues.splice(i,1);}
  story(j.commander,`【巡访线索】${clue.text} 已密呈御前，尚未定案。`);return clue;
}
function jinyiweiClueReady(clue){
  if(!clue||clue.status!=='new'||!jinyiweiCommanderReady())return false;
  if(clue.caseId)return caseReady(palaceCases().find(x=>x.id===clue.caseId));
  const p=courtPerson(clue.target)?.p;return p?.id===clue.targetId&&careerEligible(p)&&(p.office||p.post)===clue.office;
}
function jinyiweiClueEvent(clue){
  if(!clue||clue.status!=='new')return null;const j=jinyiwei(),valid=()=>clue.status==='new'&&jinyiweiCommanderReady();
  return {title:'锦衣卫巡访 · 新线索',por:j.commander,valid,text:`${j.commander.name}呈上密札：\n${clue.text}\n请旨后才会正式追查；线索不足时仍可能无功而返。`,choices:[
    {t:'循线查证 · 精力−1 · 国库−15',cond:()=>jinyiweiClueReady(clue)&&E().energy>0&&E().treasury>=15,why:'人事已变、原案暂不可查，或精力国库不足',f:()=>{
      if(!valid()||!jinyiweiClueReady(clue)||E().treasury<15||!useE())return null;
      chg({treasury:-15});clue.status='assigned';
      const x=clue.caseId?palaceCases().find(x=>x.id===clue.caseId):openPalaceCase({kind:'audit',title:clue.title,crime:'核对任内簿册',target:clue.target,targetId:clue.targetId,targetName:clue.targetName,office:clue.office,report:{...clue.report},clueId:clue.id});
      dispatchCase(x,15);clue.caseId=x.id;save('auto');return '已交办核验，下一月回报。线索尚未作为定罪依据。';
    }},
    {t:'继续留意，暂不立案',f:()=>{if(!valid())return null;clue.status='watching';story(j.commander,`【线索留察】${clue.title}奉旨继续留意，尚无新增证据，不据传言问罪。`);return '线索留在密札中，未因此处罚任何人。';}},
    {t:'证据不足，暂且封存',f:()=>{if(!valid())return null;clue.status='shelved';story(j.commander,`【线索封存】${clue.title}尚无足够证据，奉旨封存此次线索。原有案卷仍在。`);return '此次线索封存，原有案卷和人物履历均保留。';}}
  ]};
}
A.jinyiweiClue=function(id){const clue=jinyiwei()?.clues?.find(x=>x.id===id);if(!modalOpen&&clue)pushEv(jinyiweiClueEvent(clue));};
const clueDispatchCase=dispatchCase;
dispatchCase=function(x,cost){const result=clueDispatchCase(x,cost);if(careersActive()){
  x.investigatorId=jinyiwei()?.commander.id;(x.progress ||= []).push({turn:S.turn,text:`第${x.tries}次领案，约次月回报。`});
  if(jinyiwei())story(jinyiwei().commander,`【领案出查】奉旨核查「${x.title}」，先对簿册和证人口供，不以风闻作结论。`);
}return result;};
const clueCaseReport=caseReport;
caseReport=function(x){
  if(!careersActive())return clueCaseReport(x);
  if(x.kind!=='audit'){
    const ev=clueCaseReport(x),text=x.status==='solved'?'已有结论，原案所记的真相未因查访改写。':x.status==='closed'?'当事身份已变，案卷留存。':'尚未查清，半年后可循新线索再查。';
    (x.progress ||= []).push({turn:S.turn,text});story(jinyiwei().commander,`【结案回奏】「${x.title}」：${text}`);return ev;
  }
  const j=jinyiwei(),target=courtPerson(x.target),valid=target?.p.id===x.targetId&&officialAlive(target.p)&&(target.p.office||target.p.post)===x.office;
  delete x.due;
  if(!valid){x.status='closed';story(j.commander,`【查访中止】「${x.title}」所涉官员已离任或去世，不沿旧身份继续处置。`);return {title:'锦衣卫复核回报',por:j.commander,text:`「${x.title}」所涉官员的处境已有变化。旧簿留档，未据旧线索追授处罚。`,choices:[{t:'记入案卷'}]};}
  const found=chance(caseOdds(x));x.status=found?'solved':'cold';if(found)x.solvedTurn=S.turn;
  const line=found?`【簿册复核】${target.p.name}任内「${x.report.title}」：${x.report.text} 原报告中的疏漏已有簿册印证；仍未查得故意侵吞的证据，不能据此添定贪墨之罪。`:`【查访未果】${target.p.name}任内「${x.report.title}」的原簿暂未齐备，尚不足另下结论。`;
  (x.progress ||= []).push({turn:S.turn,text:line});story(j.commander,line);
  if(found){courtPersonRecord(target,line);careerFamilyEcho(target,'report',line);j.commander.merit=clamp(j.commander.merit+4);}
  return {title:'锦衣卫复核回报',por:j.commander,cast:[target.p],text:line,choices:[{t:'照实记档，任内升黜另依回奏',f:()=>{story(j.commander,`【御批】「${x.title}」照实记档，未额外定罪。`);return '复核结论入档；原有回奏仍按实绩审阅，不重复处罚。';}}]};
};
const clueJinyiweiTick=jinyiweiTick;
jinyiweiTick=function(){
  clueJinyiweiTick();if(!careersActive()||!jinyiweiCommanderReady())return;const j=jinyiwei();
  if(j.clueTick===S.turn)return;j.clueTick=S.turn;
  const p=j.commander;p.ageTrackedAt??=j.established;const years=Math.floor((S.turn-p.ageTrackedAt)/12);if(years>0){p.age+=years;p.ageTrackedAt+=years*12;}
  if(S.turn-(j.lastClue??j.established)<4||j.clues?.some(x=>x.status==='new')||palaceCases().some(x=>x.status==='investigating')||!chance(eventOdds('intel',.35)))return;
  const sources=jinyiweiClueSources();if(!sources.length)return;
  const clue=createJinyiweiClue(pick(sources));j.lastClue=S.turn;pushEv(jinyiweiClueEvent(clue));
};
const clueCasesSection=casesSection;
casesSection=function(){const base=clueCasesSection();if(!careersActive()||!jinyiwei())return base;
  const rows=(jinyiwei().clues||[]).slice().reverse(),labels={new:'待御览',assigned:'已循线查证',watching:'继续留意',shelved:'此次封存'};
  return detailSection('巡访密札',rows.length?`<ul class="story">${rows.map(x=>`<li><time>${esc(x.d)}</time><b>${esc(x.title)}</b> · ${labels[x.status]}<p>${esc(x.text)}</p>${x.status==='new'?`<button class="btn sm" data-onclick="A.jinyiweiClue('${x.id}')">阅看线索</button>`:''}</li>`).join('')}</ul>`:'<p class="hint">缇骑会间隔数月从未破旧案、任内回奏中带回线索。有线索才呈报，传闻须再查证。</p>')+base;
};

const JINYIWEI_RARE_NOTICES={
  '香囊疑案':'可封存香囊和香药领用簿，先核对经手人；物件出自何处尚待查证。',
  '石阶惊变':'值守人可先封住石阶，留存现场痕迹，分别核问当值人员。',
  '巫蛊之祸':'先封存搜得的物件并抄录搜检时辰；物件落在何处与谁亲手放置，要分别查明。',
  '东宫惊魂':'可核对东宫值宿簿和事发前后的入内记录，并先加强守卫。',
  '狸猫':'禁门须核对当夜进出人口与随身包裹，眼下先查孩子的去向。',
  '起居簿外的疑问':'起居、请脉和宫门簿可分别核对。时日有疑处也不足以推断亲缘。',
  '襁褓上的旧结':'将涂改的产房簿页、包被和经手证词分别留存，再逐一核对。',
  '迟来的脉案':'请先由医官封存脉案和领药簿，核对原始记录。病况与是否有人冒报须分别查证。',
  '夹在书中的笺子':'可核对递送书卷的经手人和当值簿；私笺的来路仍须问清。',
  '回廊相依':'可分别问当值侍从各自看见了什么，过后转述的话要另记一栏。',
  '宫外家书 · 身世起疑':'家信中的疑问可对照婚籍与接生簿，亲缘在查明前依旧记载。',
  '皇子结党':'可核对府门来客和留宿登记。交游本身尚不足以坐实结党。',
  '兄弟阋墙':'宫人所述可与来往簿核对，听见的原话与转述须分开记。',
  '储位之争':'早朝发言可按朝班与奏本核明，也可留意散朝后的来往。',
  '逼宫':'禁门急报已有府兵集结，守门记录和令牌可用于核实带兵人。',
  '遇刺':'扈从可封住巷口，留下目击者姓名，刺客的来路仍待查问。',
  '出生时地动 · 不罪婴儿':'地方急报与驿传时刻可以核对；产房照护和地方灾情各有专人负责。',
  '出生逢旱 · 久旱中的啼声':'可按州县呈报核看旱情。各地旱情已有时日，应与宫中诞育分开记。',
  '钩弋之遇 · 掌心初开':'随驾名册可核当日引见的过程。望气者的说法只随行录存。',
  '宗人府 · 宗亲遗孤':'可将驿递的讣文与宗人府府册对照，再问府中现由谁照料孩子。',
  '仙师来访 · 山门之约':'宫门可查来访名帖和引见人，至于国师所论灵根，缇骑只记其言。',
  '江湖闻名 · 故人仙踪':'可经沿途驿站核对信牒来处与印记；江湖盛传的话须另记作风闻。'
};
const JINYIWEI_URGENT_EVENTS=new Set([
  '香囊疑案','石阶惊变','巫蛊之祸','东宫惊魂','狸猫','襁褓上的旧结','迟来的脉案',
  '宫外家书 · 身世起疑','皇子结党','兄弟阋墙','储位之争','逼宫','遇刺'
]);
const JINYIWEI_RECURRING_WARNINGS=new Set(['兄弟阋墙','储位之争']);
function jinyiweiRareNote(ev,people){
  const ids=people.map(p=>String(p.id??p.name)).sort().join(',');
  const repeatable=['香囊疑案','石阶惊变','巫蛊之祸','东宫惊魂','逼宫','遇刺','储位之争','兄弟阋墙'].includes(ev.title);
  const key=`${S.gen}:${ev.title}:${ids}${repeatable?':'+S.turn:''}`;
  return {key,title:ev.title,text:JINYIWEI_RARE_NOTICES[ev.title],date:dateStr()};
}
function recordJinyiweiNotice(note){
  const j=jinyiwei(),notes=j.rareNotices||=[];
  if(notes.some(n=>n.key===note.key))return false;
  notes.push(note);
  const line=`【锦衣卫提示 · ${note.title}】${note.text}`;
  j.commander.story||=[];story(j.commander,line);log(line);
  return true;
}
function jinyiweiRareNotice(ev,people){
  const version=journalContentVersion();
  if(version>=101&&ev.title==='回廊相依'&&S.palaceRomance?.pairs?.[ev.cast?.map(p=>p.id).join('-')]?.affairReported)return '';
  if(version<56||version>=65&&JINYIWEI_URGENT_EVENTS.has(ev.title)||!Object.hasOwn(JINYIWEI_RARE_NOTICES,ev.title)||!jinyiweiCommanderReady())return '';
  const note=jinyiweiRareNote(ev,people);
  recordJinyiweiNotice(note);
  return `锦衣卫指挥使${jinyiwei().commander.name}附报：${note.text}`;
}
function jinyiweiRareAlert(ev){
  if(journalContentVersion()>=89&&jinyiweiCommanderReady()&&['喜脉','尚衣局来报 · 喜脉'].includes(ev?.title)&&ev.por?.maid){
    const maid=ev.por,conceived=maid.pregnancyCalendar?.conceived??maid.pregnancyFather?.conceived??S.turn-1;
    const note={key:`maid-pregnancy:${S.gen}:${maid.id}:${conceived}`,title:'宫女有孕',date:dateStr(),turn:S.turn,urgent:true,
      text:`宫女${fullName(maid)}经太医诊出身孕，敬事房已核对侍寝记录。原有请安与安置事项随后呈阅。`};
    if(recordJinyiweiNotice(note))return {title:'锦衣卫急报 · 宫女有孕',por:jinyiwei().commander,jinyiweiNoticeKey:note.key,text:note.text,choices:[{t:'阅毕，查看喜脉与安置'}]};
  }
  if(journalContentVersion()<65||!JINYIWEI_URGENT_EVENTS.has(ev.title)||!jinyiweiCommanderReady())return null;
  const people=eventPortraits(ev),note=jinyiweiRareNote(ev,people);
  const subject=note.key.slice(0,note.key.lastIndexOf(':'));
  const repeated=JINYIWEI_RECURRING_WARNINGS.has(ev.title)&&jinyiwei().rareNotices?.some(entry=>
    entry.urgent&&entry.subject===subject&&S.turn-entry.turn<6);
  Object.assign(note,{subject,turn:S.turn,urgent:!repeated});
  if(!recordJinyiweiNotice(note)||repeated)return null;
  const commander=jinyiwei().commander;
  return {title:`锦衣卫急报 · ${note.title}`,por:commander,jinyiweiNoticeKey:note.key,
    text:`${commander.name}递来密札：\n${note.text}\n密札已存。请陛下接阅原事，再决定如何处置。`,
    choices:[{t:'阅毕，查看原事'}]};
}

// Confirmed relationships are reported independently of patrol rolls and ambient event quotas.
function affairDutyOfficer(){return jinyiweiCommanderReady()?jinyiwei().commander:null;}
function affairReportTitle(){return jinyiwei()?'锦衣卫密报':'宫门值房密报';}
function fileAffairReport(subject,key,text,c){
  if(subject.affairReported)return;
  subject.affairReported=true;
  if(c)restlessAffairCaught(c);
  if(affairDutyOfficer()){
    recordJinyiweiNotice({key,title:'宫闱私情',text,date:dateStr(),turn:S.turn,urgent:true});
  }else log(`【${affairReportTitle()}】${text}`,1);
}
function princeAffairReports(){
  if(S.palaceRomance?.gen!==S.gen)return [];
  const reports=[];
  for(const pair of Object.values(S.palaceRomance.pairs)){
    if(pair.affairReported||pair.status!=='active'||(pair.stage<3&&pair.conceivedAt==null))continue;
    const {prince,consort}=romancePeople(pair);if(!prince||!consort)continue;
    const names=fullName(consort)+'与'+kidName(prince);
    const text=pair.stage>=3?`回廊当值的随侍亲见${names}牵手相拥。值房已将目击者所述与当夜值簿核过，具名密呈御前。`:
      `值房分别问过守门人与当夜随侍，两份口供对得上：${names}曾避开众人，私下幽会。两人的往来已经核实。`;
    const canReview=pair.stage===3&&romancePending(pair);
    reports.push({title:affairReportTitle()+' · 皇子与宫眷',por:affairDutyOfficer(),cast:[consort,prince],text,
      onShow:()=>fileAffairReport(pair,'affair:'+S.gen+':'+pair.key,text,consort),
      choices:canReview?[{t:'传问两人，御前处置',f:()=>{pushNow(palaceRomanceEvent(pair));return null;}},{t:'收下密报，稍后过问'}]:[{t:'收下密报'}]});
  }
  return reports;
}

function jinyiweiFeudAlert(previous){
  if(journalContentVersion()<65||!S||S.over||previous?.gen!==S.gen||!previous.jinyiwei?.commander||!jinyiweiCommanderReady())return;
  const notes=jinyiwei().rareNotices||[],pairs=[];
  const collect=(people,oldPeople,consorts)=>{
    const oldById=new Map(oldPeople.map(p=>[p.id,p]));
    for(let i=0;i<people.length;i++)for(let n=i+1;n<people.length;n++){
      const a=people[i],b=people[n],oldA=oldById.get(a.id),oldB=oldById.get(b.id);
      const kinRivals=consorts&&(isRival(a,b)||isRival(b,a));
      const knewRivals=oldA&&oldB&&(isRival(oldA,oldB)||isRival(oldB,oldA));
      const key=`${S.gen}:${rk(a,b)}`;
      const crossed=oldA&&oldB&&(previous.rel?.[rk(a,b)]??0)>-40&&relGet(a,b)<=-40;
      if(!(crossed||kinRivals&&!knewRivals)||notes.some(note=>note.feudPairs?.includes(key)&&S.turn-note.turn<6))continue;
      const label=consorts?fullName:kidName;
      pairs.push({key,text:`${label(a)}与${label(b)}近来怨隙已深。${consorts?'值守宫人传话时可分别核对，以免转述添深误会。':'可留意府门往来和当面争执，旁人转述先作记录。'}`});
    }
  };
  collect(harem(),previous.consorts,true);
  collect(kidsAlive().filter(k=>kidAge(k)>=15&&childCanVisitCourt(k)),previous.children,false);
  if(!pairs.length)return;
  const title='新怨密报',text=pairs.map(pair=>pair.text).join('\n')+'\n目前掌握的是两边的嫌隙，尚无凭据指认谁有加害之举。';
  const feudPairs=pairs.map(pair=>pair.key).sort();
  const urgent=!notes.some(note=>note.urgent&&note.feudPairs&&note.turn===S.turn);
  const note={key:`feud:${S.turn}:${feudPairs.join(',')}`,title,text,date:dateStr(),turn:S.turn,feudPairs,urgent};
  if(recordJinyiweiNotice(note)&&urgent)pushEv({title:'锦衣卫 · '+title,por:jinyiwei().commander,text,jinyiweiNoticeKey:note.key,
    choices:[{t:'记下嫌隙，继续留意'}]});
}
const rareCasesSection=casesSection;
casesSection=function(){
  const base=rareCasesSection(),notes=jinyiwei()?.rareNotices;
  const title=journalContentVersion()>=65?'稀有事件速报与新怨密报':'稀有事件速报';
  return notes?.length?detailSection(title,`<ul class="story">${notes.slice(-20).reverse().map(n=>`<li><time>${esc(n.date)}</time><b>${esc(n.title)}</b><p>${esc(n.text)}</p></li>`).join('')}</ul>`)+base:base;
};
