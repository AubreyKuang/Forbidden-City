const outsideParentageActive=()=>journalContentVersion()>=35;
const outsideMotherId=p=>p.motherRelativeId??p.parentRelativeId;

function initializeOutsideParentage(child,preg,gen=S.gen){
  return child.outsideParentage||={gen:preg?.conceptionGen??gen,status:'quiet',ready:child.born+3,suspected:!!preg?.husbandSuspects,
    imperial:preg?.imperialParentage??(familyHash(`${child.id}:${preg?.seed??child.seed}:outside-parentage`)%100<55),
    emperor:preg?.conceptionEmperor??(E().sur+E().name)};
}

// A private finding identifies the biological father without changing the family register.
function queueOutsidePregnancyNotice(c,mother,preg){
  if(journalContentVersion()<89||!preg?.unconfirmed||preg.privateNoticeQueued)return;
  preg.privateNoticeQueued=true;
  const commander=jinyiweiCommanderReady()?jinyiwei().commander:null;
  const title=commander?'锦衣卫密报 · 宫外孕讯':'宫外来信 · 有孕';
  const text=`${mother.name}已有身孕。她此前曾与你私下相见，受孕时日仍需核对，不能仅凭这封消息断定孩子的生父。她暂在原家养护。`;
  log(`【宫外孕讯】${text}`,1);
  if(commander)story(commander,`【宫外孕讯】${text}`);
  pushEv({title,por:commander||natalPortrait(mother),text,choices:[{t:'记下消息，先让她安心养护'}]});
}
function queueOutsideBirthNotice(c,child){
  if(journalContentVersion()<89||child.privateBirthNoticeQueued)return;
  const f=outsideParentageFamily(c,child);if(!f)return;
  child.privateBirthNoticeQueued=true;
  const commander=jinyiweiCommanderReady()?jinyiwei().commander:null;
  const text=`${f.mother.name}在宫外生下${child.sex==='m'?'男孩':'女孩'}${child.name}。孩子仍在原家照料，身世尚未查明。可交锦衣卫核对生父；查证不会自动认亲或更改孩子的身份。`;
  log(`【宫外添丁】${text}`,1);if(commander)story(commander,`【宫外添丁】${text}`);
  pushEv({title:commander?'锦衣卫密报 · 宫外添丁':'宫外来信 · 添丁',por:commander||natalPortrait(child),text,choices:[
    ...(commander?[{t:'交锦衣卫彻查生父 · 精力−1 · 国库−15',cond:()=>outsidePaternityReady(f)&&E().energy>0&&E().treasury>=15,why:'锦衣卫不可用、精力或国库不足，或案子已办理',f:()=>beginOutsidePaternityInquiry(f)}]:[]),
    {t:'先记下，日后再议'}]});
}
function outsidePaternityReady(f){
  return journalContentVersion()>=89&&!!f?.child?.unconfirmedParentage&&f.household.relatives.includes(f.child)&&!f.child.outsideParentage?.privateInquiry&&f.child.outsideParentage?.status!=='investigating'&&jinyiweiCommanderReady()&&!S.over;
}
function beginOutsidePaternityInquiry(f){
  if(!outsidePaternityReady(f)||E().treasury<15||!useE())return null;
  const {child,mother}=f,history=mother.pregnancyHistory||[];
  const data=initializeOutsideParentage(child,history.find(p=>p.childId===child.id),f.c.familyArchive?.gen);
  const commander=jinyiwei().commander;chg({treasury:-15});
  data.privateInquiry={status:'investigating',started:S.turn,due:S.turn+3,investigatorId:commander.id,investigatorName:commander.name,
    imperial:!!data.imperial,fatherName:data.imperial?data.emperor:(child.fatherName||f.husband?.name||'原家所载父亲')};
  story(commander,`【宫外身世彻查】奉旨核对${child.name}的接生记录和知情人证词，三个月后回奏。`);
  log(`【锦衣卫彻查】${child.name}的生父待核，三个月后回奏；孩子继续留在原家。`,1);save('auto');
  return '锦衣卫已领案，三个月后回奏。孩子的身世标签、家籍与照料暂不改变。';
}
function outsidePaternityResult(f){
  const child=f?.child,data=child?.outsideParentage,investigation=data?.privateInquiry;
  if(!investigation||investigation.status!=='investigating'||S.turn<investigation.due)return null;
  const father=investigation.imperial?`皇帝（${investigation.fatherName}）`:investigation.fatherName;
  return {title:'锦衣卫回奏 · 宫外生父',por:jinyiweiCommanderReady()?jinyiwei().commander:natalPortrait(child),
    valid:()=>investigation.status==='investigating'&&S.turn>=investigation.due,
    text:`锦衣卫核对接生簿、行程与经手人证词，查明${child.name}的生父为${father}。\n这只是秘密查证结果：孩子仍显示「身世未明」，原家身份、姓名和照料不变；是否认亲另行决定。`,choices:[{t:'记下生父，不改变孩子身份',f:()=>{
      if(investigation.status!=='investigating'||S.turn<investigation.due)return null;
      investigation.status='complete';investigation.completed=S.turn;
      child.story||=[];story(child,`【秘密查证】锦衣卫核明生父为${father}；未改家籍与原有照料。`);
      log(`【锦衣卫回奏】${child.name}生父为${father}；仍按原有身份照料。`,1);save('auto');
      return '查证结果已写明；孩子仍留在原家，身世未明标签不变。';
    }}]};
}
function outsidePaternityTick(){
  if(!S||S.over||journalContentVersion()<89)return;
  const seen=new Set();for(const c of familyCourtHosts()){
    const house=houseOf(c);if(!house||seen.has(house.father.id))continue;seen.add(house.father.id);
    for(const child of house.relatives||[]){
      const investigation=child.outsideParentage?.privateInquiry;
      if(!investigation||investigation.status!=='investigating'||S.turn<investigation.due||investigation.queuedTurn===S.turn)continue;
      const f=outsideParentageFamily(c,child),ev=f&&outsidePaternityResult(f);if(!ev)continue;
      investigation.queuedTurn=S.turn;pushEv(ev);
    }
  }
}
A.outsidePaternityInquiry=function(host,id){
  if(modalOpen||S.over)return;const e=natalEntry(host,id),c=e&&(e.originHost?familyHostById(e.originHost):e.c),f=c&&outsideParentageFamily(c,e.p);
  if(!outsidePaternityReady(f))return;
  pushEv({title:'锦衣卫彻查 · 宫外生父',por:jinyiwei().commander,text:`核对${f.child.name}的接生簿、旧信与证词，三个月后回奏。结果只写明生父，不改变孩子的「身世未明」标签、家籍与照料。`,choices:[
    {t:'交办彻查 · 精力−1 · 国库−15',cond:()=>outsidePaternityReady(f)&&E().energy>0&&E().treasury>=15,f:()=>beginOutsidePaternityInquiry(f)},
    {t:'暂不查验'}]});
};
A.outsidePaternityReport=function(host,id){
  if(modalOpen||S.over)return;const e=natalEntry(host,id),c=e&&(e.originHost?familyHostById(e.originHost):e.c),f=c&&outsideParentageFamily(c,e.p),ev=f&&outsidePaternityResult(f);if(ev)pushEv(ev);
};

function outsideParentageFamily(c,child){
  const household=houseOf(c),mother=household?.relatives?.find(p=>p.id===outsideMotherId(child));
  if(!mother||!household.relatives.includes(child))return null;
  const husband=careerPeople().find(entry=>entry.p.id===child.fatherId)?.p||[mother.spouse,...(mother.formerSpouses||[])]
    .find(p=>p&&(p.id===child.fatherId||p.personId===child.fatherId));
  return {c,household,child,mother:byId(mother.id)||mother,husband};
}

function outsideParentageChronicle(family,title,lines){
  const {c,child,mother,husband}=family;
  const people=[{id:child.id,name:child.outsideFamilyOrigin?.name||child.name},{id:mother.id,name:mother.name||fullName(mother)},
    ...(husband?.id!=null?[{id:husband.id,name:husband.name}]:[]),{id:'emperor',name:E().sur+E().name}];
  const thread=`outside-parentage:${child.id}`;
  for(const [person,line] of [[child,lines.child],[mother,lines.mother],[husband,lines.husband],[c,lines.aunt],[E(),lines.emperor]]){
    if(!person||person.alive===false||!line)continue;
    person.story||=[];story(person,`【${title}】${line}`);
    Object.assign(person.story.at(-1),{thread,life:{kind:'family',title,turn:S.turn,gen:S.gen,people,source:'宫外家籍与接生记录'}});
  }
  if(lines.emperor)log(`【${title}】${lines.emperor}`,1);
}

function outsideChildBadge(k,outerSister=false){
  const data=k.outsideParentage;
  let label=k.unconfirmedParentage?'身世未明':'';
  if(journalContentVersion()>=84){
    if(k.outsideFamilyOrigin||k.outerRegisterId&&outerMother(outerChild(k.outerRegisterId)?.mother)?.relative!=null)label='宫外归宗';
    else if(data?.status==='stayed'||data?.status==='proved')label='宫外皇嗣';
    else if(outerSister)label=k.pedigree==='认领'?'宫外归宗':'宫外血脉';
  }
  return label?`<span class="tag y">${label}</span>`:'';
}
function outsideChildGrowing(child,mother,aunt,status){
  if(!child||child.alive===false||status==='cleared')return;
  const age=kidAge(child),milestone=[12,7,3].find(a=>age===a);
  if(!milestone||(child.outsideGrowthAge||0)>=milestone)return;
  child.outsideGrowthAge=milestone;
  const name=child.alias||child.name,son=child.sex==='m',publicKin=status==='recognized';
  const scene=milestone===3?['学会自己系披风，系歪了也抬着下巴让人看','一笑便微微挑起的眉梢']:
    milestone===7?['写完一页大字，特意把最端正的那个圈了出来','提笔前先把袖口折两道的习惯']:
    ['替家里写了第一封问安信，落款时认认真真写了自己的名字','落笔前偏头想一想的神气'];
  child.story||=[];story(child,`【成长家书】${name}${scene[0]}。`);
  const motherLine=milestone===3?'她解开那根歪带子，握着孩子的小手教了一遍。':milestone===7?'她把这一页字收好，想等孩子长大后拿出来给孩子看。':'她把信读了两遍。那个从前要她代笔的孩子，已有了自己的口气。';
  if(mother&&mother.alive!==false){mother.story||=[];story(mother,`【孩子长大】${name}${scene[0]}。${motherLine}`);}
  if(aunt?.alive&&!aunt.gone){
    const worry=publicKin?'如今孩子已认回，她盼旁人也听听孩子自己想说什么。':
      son?'她担心旁人也看出来，一个男孩若被人拿去议论储位，往后还能不能安稳读书？回信只问他近来喜欢什么。':
      '她怕旁人追问孩子的来历，把那句“真像”留在心底，只在回信里夸了孩子两句。';
    story(aunt,`【姨母读家书】听说${name}${scene[0]}。她想起陛下${scene[1]}，越想越觉得像。${worry}`);
  }
}
function outsideParentageTick(){
  if(!outsideParentageActive()||S.over||mourningActive())return;
  const seen=new Set(),cases=[];
  for(const c of familyCourtHosts()){
    const h=houseOf(c);if(!h||seen.has(h))continue;seen.add(h);
    if(journalContentVersion()>=84)for(const child of h.relatives){
      if(!child.outsideParentage||child.outsideParentage.gen!==S.gen)continue;
      const p=h.relatives.find(p=>p.id===outsideMotherId(child));
      const aunt=familyHostById(p?.marriedSisterAffair?.host)||c;
      outsideChildGrowing(child,byId(p?.id)||p,aunt,child.outsideParentage.status);
    }
    for(const child of h.relatives.filter(p=>p.alive&&p.unconfirmedParentage)){
      const f=outsideParentageFamily(c,child);if(!f)continue;
      const history=h.relatives.find(p=>p.id===outsideMotherId(child))?.pregnancyHistory;
      const data=initializeOutsideParentage(child,history?.find(p=>p.childId===child.id),c.familyArchive?.gen);
      if(data.gen!==S.gen)continue;
      if(data.status==='quiet'&&S.turn>=data.ready&&officialAlive(f.husband)){
        if(!data.suspected&&S.turn>=child.born+6&&!data.checked){data.checked=true;data.suspected=chance(.08);}
        if(data.suspected){
          data.status='reported';
          outsideParentageChronicle(f,'丈夫起疑',{
            husband:`他把${child.name}出生前后的几封旧信翻出来，决定请人核对日子。${natalAge(child)>=3?'孩子叫他父亲已久':'孩子一日日在他眼前长大'}，他只怕问出的话再也收不回。`,
            mother:`丈夫问起${child.name}的出生年月，她把手中针线搁下，只请他和大人说话时避开孩子。`,
            child:'家中有人问起出生时的旧事，大人舍不得惊扰孩子的起居。',
            emperor:`${f.husband.name}私下递来一封家信，求核实${child.name}的身世。`});
        }
      }
      if(data.status==='investigating'&&S.turn>=data.due&&!data.reportQueued)cases.unshift(f);
      if(data.status==='reported'&&!data.noticeQueued)cases.push(f);
    }
  }
  if(journalContentVersion()>=84)for(const k of S.children){
    const o=k.outsideFamilyOrigin;
    if(!o||k.outsideParentage?.gen!==S.gen)continue;
    const aunt=familyHostById(o.host),mother=byId(o.motherId)||aunt?.house?.relatives?.find(p=>p.id===o.motherId);
    outsideChildGrowing(k,mother,aunt,'recognized');
  }
  const first=cases[0];if(!first)return;
  const event=outsideParentageEvent(first);if(!event)return;
  const data=first.child.outsideParentage;
  if(data.status==='reported')data.noticeQueued=true;else data.reportQueued=true;
  pushEv(event);
}

function outsideParentageEvent(f){
  if(!f?.child.alive||!outsideParentageActive()||S.over||mourningActive())return null;
  const {child,mother,husband}=f,data=child.outsideParentage;
  if(!data||data.gen!==S.gen)return null;
  const name=child.name,her=mother.name||fullName(mother),his=husband?.name||child.fatherName||'养育他的家人';
  const valid=status=>!S.over&&child.alive&&f.household.relatives.includes(child)&&data.gen===S.gen&&data.status===status;
  const por=natalPortrait(child);
  if(data.status==='reported'||data.status==='suppressed'){
    const status=data.status;
    return {title:status==='reported'?'宫外家书 · 身世起疑':'重阅旧案',por,valid:()=>valid(status),
      text:`${his}曾请宫中查看${name}出生前后的旧信。他只求明白实情，也担心这些议论终会落到孩子身上。\n${her}说：“孩子跟着我们过了这么些日子。陛下若要查，请先准他照常过日子。”`,choices:[
      {t:'调阅家书与接生簿 · 精力−1',cond:()=>valid(status)&&E().energy>0&&!(journalContentVersion()>=89&&data.privateInquiry?.status==='investigating'),why:'精力不足或锦衣卫正在核查',f:()=>{
        if(!valid(status)||(journalContentVersion()>=89&&data.privateInquiry?.status==='investigating')||!useE())return null;
        data.status='investigating';data.due=S.turn+1;
        outsideParentageChronicle(f,'查证身世',{
          husband:'他交出留下的书信与行程，答应等查证的人回话。',mother:'她把自己记得的日子写了下来，仍亲自照看孩子。',
          child:'家中照料如常。负责查证的人只向知情的长辈问话。',emperor:`你下令核对${name}的接生簿、旧信和证词。次月呈报。`});
        return '礼部收取旧信，另向接生人和经手人分别问询。次月回奏。';
      }},
      ...(status==='reported'?[{t:'暂且压下，仍按原家照料',f:()=>{
        if(!valid(status))return null;
        data.status='suppressed';
        outsideParentageChronicle(f,'将疑问暂压',{
          husband:'他收回了交出的旧信。心里的疑问还在，却仍照旧陪孩子用饭。',
          mother:'她缓了口气，替孩子缝完一件搁了几日的里衣。',child:'没有搬家。陪伴、饭食和功课都照原来的安排。',
          emperor:`你将${name}的家书封回，照旧留在原家。来日仍可调阅。`});
        return '疑问暂且压下。孩子仍随原家生活，你可日后从人物档案重阅旧案。';
      }}]:[{t:'继续封存'}])]};
  }
  if(data.status==='investigating'&&S.turn>=data.due){
    const evidence=data.imperial?'接生簿记明孕期。家书与驿程相互印证，那段日子丈夫远在别处，随侍和经手人的供词也核实了皇帝与她相见的日期。':
      '接生簿与接生人证词核对一致，将有孕的日子推到了传闻所指的私见之前。旧家书也载明夫妇当时都在家中，所疑的日子并不相符。';
    const result=data.imperial?`${name}确系皇帝亲生。`:`原籍所载亲缘确实，${his}为生父。`;
    return {title:'宫外身世回奏',por,valid:()=>valid('investigating'),text:`${evidence}\n${result}`,choices:[
      {t:'阅定回奏',f:()=>{
        if(!valid('investigating'))return null;
        data.status=data.imperial?'proved':'cleared';data.resolvedAt=S.turn;delete child.unconfirmedParentage;
        outsideParentageChronicle(f,'身世查明',data.imperial?{
          husband:natalAge(child)>=3?'答案与他的猜测相同。他先把写到一半的家书收起，想到孩子这些年喊过多少次父亲。':'他听完回奏久久不语，想起自己夜夜起身看孩子安睡的日子。',
          mother:'她听完回奏，把孩子的手拉得更紧。她怕亲缘一朝查明，日子也跟着变了。',
          child:'大人核明了出生的旧事，安置另议。在决定之前，仍按原来的日子生活。',
          emperor:`回奏查实${name}是你的亲生骨肉。你须再定孩子的归处。`
        }:{husband:'他终于知道孩子确是亲生。看到原先交出去的信，他想起自己起疑时说过的话，心里有些惭愧。',
          mother:'她将回奏听完，先问孩子有没有听见闲话，才说自己总算可以睡一个安稳觉。',
          child:'疑问已经查清，原籍和家中的照料照旧。',emperor:`核对旧事后，你确认${name}原籍所载的亲缘，封结此案。`});
        if(data.imperial){pushNow(outsideParentageEvent(f));return null;}
        return '疑云已释。原来的家籍与照料安排照旧。';
      }}]};
  }
  if(data.status!=='proved')return null;
  return {title:'骨肉归处',por,valid:()=>valid('proved'),text:`回奏已查明，${name}是你的亲生孩子。\n${her}舍不得孩子离开熟悉的家，${his}也惦记自己照料过的这些日子。你可以公开认回宫中，或依这家人原来的安排继续照料。`,choices:[
    {t:'认回宫中，列入皇室宗谱',f:()=>valid('proved')?recognizeOutsideChild(f):null},
    {t:'留在原家，仍由家人照料',f:()=>{
      if(!valid('proved'))return null;
      data.status='stayed';
      outsideParentageChronicle(f,'留在原家',{
        husband:'知道孩子的生父是谁之后，他仍愿给孩子留着原来的房间，照料如常。',
        mother:'她回家时把孩子的手握在掌心，心里终于有了些安稳。',
        child:'仍住在熟悉的家里，照料自己的人也天天能见到。',
        aunt:`她听说${name}可以留在原家，便托人捎去一封平安信。`,
        emperor:`你知晓${name}是亲生骨肉，决定让孩子留在原家，照料照旧。`});
      return '孩子继续按原家身份生活。查证结果与安置写入各自的纪事。';
    }},
    {t:'容后再议'}]};
}

function recognizeOutsideChild(f){
  const {c,household,child,mother,husband}=f;
  const data=child.outsideParentage,oldName=child.name;
  const formerHome=husband?.name||child.fatherName||'原来的家人';
  const royalMother=byId(mother.id);
  const age=natalAge(child);
  const foster=inPalace(royalMother)||age>=14?null:inPalace(c)?c:empress();
  const attributes={...mother,rank:mother.rank??0,talent:mother.talent??50,virtue:mother.virtue??50,scheme:mother.scheme??35,pregnancyFather:null};
  const origin={host:c.id,house:household.father.id,motherId:mother.id,fatherId:child.fatherId,fatherName:child.fatherName,name:oldName};
  const k=makeKid(attributes,child.sex,child.given||oldName,{outsideChild:child,origin,foster});
  household.relatives.splice(household.relatives.indexOf(child),1);
  data.status='recognized';
  outsideParentageChronicle({...f,child:k},'认回宫中',{
    husband:'他送到门前，替孩子理了理衣襟，才转身回屋。孩子随身用过的东西，他仍收着。',
    mother:foster?`她把孩子用惯的${age<3?'被褥':'衣物与旧书'}交给${fullName(foster)}，一件件说清孩子的习惯。`:'她陪孩子收好旧物，重又说起从前在家里的那些日子。',
    child:`原先由${formerHome}照料，今日认回宫中。原家的姓名、来路与旧日纪事一同留下。`,
    aunt:`她听说${oldName}认回宫中，想起原家照料这些年的情分，盼孩子往后仍有机会问候故人。`,
    emperor:`你认回${oldName}，以原有名字列入皇室宗谱。${foster?`由${fullName(foster)}协助照料。`:'宫中按例安顿。'}`});
  return `${kidName(k)}已列入皇室宗谱。孩子照原有年龄和名字入宫，昔日在原家的纪事也随身保留。`;
}

function outsideMotherLink(k){
  const origin=k.outsideFamilyOrigin;
  return origin&&!byId(k.mom)?`<button class="person-link" onclick="A.go('natal','${origin.host}:${k.mom}')">${esc(k.momName)}</button>`:parentLink(k.mom,k.momName);
}

function natalChildrenOf(c,id){
  const h=houseOf(c),children=h.relatives.filter(p=>(outsideParentageActive()?outsideMotherId(p):p.parentRelativeId)===id);
  if(outsideParentageActive())children.push(...S.children.filter(k=>k.outsideFamilyOrigin?.house===h.father.id&&k.mom===id));
  return children;
}

A.outsideParentage=function(id,relative){
  if(modalOpen||!outsideParentageActive())return;
  const e=natalEntry(id,relative),c=e&&(e.originHost?familyHostById(e.originHost):e.c);
  const event=c&&outsideParentageEvent(outsideParentageFamily(c,e.p));
  if(event)pushEv(event);
};

function outsideParentagePanel(c,p){
  const data=p.outsideParentage;
  if(!outsideParentageActive()||!data)return '';
  const labels={reported:'丈夫已经递来家信，希望核实身世。',suppressed:'疑问已暂且压下，孩子仍在原家。',
    investigating:`正在核对接生簿和家书。${S.turn<data.due?'下月回奏。':'回奏已到。'}`,
    proved:`已查实生父为${data.emperor}，尚待决定归处。`,stayed:`查明生父为${data.emperor}，仍留在原家照料。`,
    recognized:`已认回宫中。原家所用姓名为${p.outsideFamilyOrigin?.name||p.name}。`,cleared:'原籍所载亲缘已经核实。'};
  const status=data.status,label=labels[status];
  const action={reported:'阅丈夫的家信',suppressed:'重阅身世旧案',investigating:S.turn>=data.due?'听取身世回奏':'',proved:'决定孩子归处'}[status];
  const q=data.privateInquiry;
  const privatePart=journalContentVersion()>=89&&p.unconfirmedParentage&&c?`<p>${q?.status==='complete'?`秘密查证已完成，生父已写明；孩子仍保留「身世未明」标签。`:q?.status==='investigating'?`锦衣卫核查中，${S.turn>=q.due?'回奏已到':`还需 ${q.due-S.turn} 个月`}。`:'可请锦衣卫只核查生父，不改变孩子身份。'}</p>${!q&&jinyiweiCommanderReady()&&!S.over?`<button class="btn jade" onclick="A.outsidePaternityInquiry(${c.id},${p.id})">请锦衣卫彻查生父</button>`:q?.status==='investigating'&&S.turn>=q.due&&!S.over?`<button class="btn jade" onclick="A.outsidePaternityReport(${c.id},${p.id})">听取锦衣卫回奏</button>`:''}`:'';
  return label||privatePart?detailSection('宫外身世',`${label?`<p>${esc(label)}</p>`:''}${action&&p.alive&&c&&data.gen===S.gen&&!S.over?`<button class="btn jade" onclick="A.outsideParentage(${c.id},${p.id})">${action}</button>`:''}${privatePart}`):'';
}

function outsideHouseholdHusbandPanel(mother){
  if(!outsideParentageActive())return '';
  const husbands=[mother.spouse,...(mother.formerSpouses||[])].filter(p=>p&&!p.personId);
  return husbands.map(p=>detailFold(`${esc(p.name)}的身世纪事`,(p.story||[]).filter(e=>e.thread?.startsWith('outside-parentage:'))
    .map(e=>`<p>${esc(e.d)} · ${esc(e.t)}</p>`).join(''))).join('');
}

const earlierOutsideParentageTick=natalLifeTick;
natalLifeTick=function(){earlierOutsideParentageTick();outsideParentageTick();outsidePaternityTick();};

const earlierOutsideCasesSection=casesSection;
casesSection=function(){
  const base=earlierOutsideCasesSection();if(journalContentVersion()<89||!jinyiwei())return base;
  const rows=[],seen=new Set();for(const c of familyCourtHosts()){
    const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);
    for(const child of h.relatives||[]){if(!child.unconfirmedParentage||!child.outsideParentage)continue;
      const q=child.outsideParentage.privateInquiry,label=q?.status==='complete'?'已核明生父':q?.status==='investigating'?S.turn>=q.due?'回奏已到':`查证中 · 还需 ${q.due-S.turn} 个月`:'可交办核查';
      rows.push(`<li>${esc(child.name)} · 身世未明 · ${label} <button class="btn sm" onclick="A.go('natal','${c.id}:${child.id}')">查看孩子档案</button></li>`);
    }
  }
  return base+detailSection('宫外子女生父查证',rows.length?`<ul class="story">${rows.join('')}</ul>`:'<p class="hint">暂无待查宫外子女。</p>');
};

const earlierOutsideOfficialView=viewOfficial;
viewOfficial=function(){
  const html=earlierOutsideOfficialView();if(!outsideParentageActive())return html;
  const e=officialEntry(UI.sel);
  return html+(e?outsideParentagePanel(e.c,e.p):'');
};
