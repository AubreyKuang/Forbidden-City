/* Literary and historical plots grow out of decisions already made at court. */
const CLASSIC_STORY_SOURCES={
 poetry:{ref:'《红楼梦》第三十七回、第四十五回',refURL:'https://zh.wikisource.org/wiki/紅樓夢/第037回'},
 relief:{ref:'钱公辅《义田记》',refURL:'https://zh.wikisource.org/zh-hans/義田記'},
 print:{ref:'沈括《梦溪笔谈·活板》',refURL:'https://coldlibrary.com/open-stacks/shen-kuo-movable-type'}
};
const classicStoriesActive=()=>royalTravelActive();
const classicStoryState=()=>S.classicStories||={circles:{},relief:{},works:{}};
const classicCircle=()=>S.classicStories?.circles[S.gen];
const CLASSIC_CIRCLE_VOICES={
 scholar:['她找出家中读过的诗选，让孩子在题签背面留出一行写出处。','隔窗新雨歇，翻卷见春山。'],
 merchant:['她从家里带来的空账页背面裁出诗笺，约好轮流东道，用过的纸也能写草稿。','市桥人散后，灯影落归船。'],
 farm:['她记得家里看树影辨时辰，提议先写各人见过的天光与时令。','墙低留夕照，隔叶听归禽。'],
 military:['她带来家人旧时寄来的关山尺牍，叫孩子把想象的远山与亲见的庭树分开写。','远信停灯读，阶前一叶秋。'],
 humble:['她拿自己从前裁剩的小笺试笔，提议各自从眼前一件小事起句。','竹帘疏过月，一页尚余香。']
};
function seedClassicCircle(k,revision){
 if(!classicStoriesActive()||kidAge(k)<8)return;
 const previous=classicCircle();
 if(previous){
  const author=kidById(previous.owner),host=byId(previous.lead);
  if(previous.stage!=='offer'||author?.alive&&!author.removedFromRoyal&&host?.alive&&!host.gone)return;
 }
 const eligible=c=>inPalace(c)&&!c.maid&&(['才女','好学','聪慧'].includes(c.trait)||c.talent>=65);
 const lead=mothersOf(k).find(eligible)||harem().find(eligible);
 if(!lead)return;
 const work=duanwuWork(),other=work?.stage==='finished'&&[work.tables,work.gifts].includes(lead.id)?
  byId(work.tables===lead.id?work.gifts:work.tables):null;
 const helper=inPalace(other)&&!other.maid?other:null;
 const [voice,verse]=CLASSIC_CIRCLE_VOICES[familyUpbringing(lead).group]||CLASSIC_CIRCLE_VOICES.humble;
 classicStoryState().circles[S.gen]={stage:'offer',due:S.turn+1,owner:k.id,lead:lead.id,helper:helper?.id,thread:revision.thread,title:revision.title,voice,verse};
}
function classicCircleEvent(){
 const circle=classicCircle();
 if(!circle||!['offer','writing'].includes(circle.stage)||circle.due>S.turn)return null;
 const k=kidById(circle.owner),lead=byId(circle.lead),helper=byId(circle.helper);
 const canMeet=()=>childInPalace(k)&&!k.jailed&&inPalace(lead);
 if(!canMeet())return null;
 const members=[lead,k,...(inPalace(helper)?[helper]:[])];
 const opening=circle.stage==='offer',stage=circle.stage,cost=12;
 const valid=()=>!S.over&&classicCircle()===circle&&circle.stage===stage&&canMeet();
 const finish=keep=>{
  if(!valid()||opening&&keep&&E().treasury<cost)return null;
  let text;
  if(opening){
   circle.stage=keep?'writing':'closed';
   circle.due=S.turn+2;
   text=keep?`${fullName(lead)}领了纸墨，在御花园开诗社。${circle.voice}${members.length>2?`${fullName(helper)}沿用同办端午时的分工，先替众人排好轮值。`:''}`:
    '诗笺各携归处。妃嫔和孩子若有兴致，仍可私下换几句诗。';
  }else{
   circle.stage='closed';
   const title='小园诗草';
   text=keep?`《${title}》已经誊清，收入文渊阁。稿末写明谁拟题，谁抄录，也留了一页写改过的句子。`:
    '各人的诗稿交还本人。末席散时，大家另抄了一阕留作私下的旧念。';
   if(keep)classicStoryState().works['circle-'+S.gen]={kind:'circle',thread:circle.thread,title,excerpt:`「${circle.verse}」\n卷中收短章数首，附手写题签，题签还留着改句的笔迹。`,people:members.map(p=>p.id)};
  }
  for(const p of members)characterChapter(p,circle.thread,'craft','小园诗社',members,p===k?`从上书房传阅的课业续来。${text}`:text);
  log(text,1);
  return text+(opening&&keep?fx(chg({treasury:-cost})):'');
 };
 return {title:opening?'御花园 · 花笺相邀':'御花园 · 诗稿初成',cast:members,valid,...CLASSIC_STORY_SOURCES.poetry,
  text:opening?`${fullName(lead)}读过${k.name}留在上书房的改稿「${circle.title}」，送来花笺，想在园中借一处小亭，让肯来的人轮流拟题、校读。${circle.voice}`:
   `两次社集过去，${k.name}把一页新诗递过来。\n「${circle.verse}」\n${fullName(lead)}问，肯不肯把大家愿意传阅的几篇合为一卷？`,
  choices:opening?[{t:'准开诗社，拨纸墨钱 · 国库−12',cond:()=>E().treasury>=cost,why:'国库不足',f:()=>finish(true)},
   {t:'留作私下唱和',f:()=>finish(false)}]:[{t:'将诗册收入文渊阁',f:()=>finish(true)},{t:'各自收回自己的诗稿',f:()=>finish(false)}]};
}
function classicWorks(){
 const data=S.classicStories,works={...data?.works};
 for(const project of yiLandProjects()){
  const [id,role]=String(project.key).split(':');
  const p=id==='scholar'?scholarById(role):officialPerson(familyHostById(id)?.house,role);
  const kin=familyHostById(project.kin);
  works['relief-'+project.gen]||={kind:'relief',thread:project.thread,title:'义仓领粮则例',people:[p?.id,kin?.id].filter(id=>id!=null),
   excerpt:'粮入仓，田契、租簿、签领册三相核。偏远不能到者，由里正代报、乡人具结，另记送达日期。'};
 }
 for(const book of S.travelInstitutions?.books||[]){
  if(book.decision!=='adopted')continue;
  const source=ROYAL_TRAVEL_BOOKS[book.key];
  works['translation-'+book.key]||={kind:'translation',thread:`translation:${book.key}`,title:source.name,
   excerpt:source.excerpt,people:book.sources};
 }
 return works;
}
function classicWorkPeople(work){return work.people.map(id=>chroniclePersonTarget(id)?.person).filter(Boolean);}
function classicPressNotice(work){
 const press=work.press;
 if(!press)return '可以付梓。';
 if(press.destination)return `已有${cnNum(press.copies)}册送到${press.destination}。`;
 return S.turn<press.due?'正在校样，待完工回报。':'已完工，可分拨印本。';
}
A.classicReadWork=function(key){
 if(!classicStoriesActive()||!S||S.over||modalOpen)return;
 const work=classicWorks()[key];if(!work)return;
 pushEv({title:`翻阅《${work.title}》`,text:work.excerpt,choices:[ok1]});
};
A.classicPress=function(key){
 if(!classicStoriesActive()||!S||S.over||modalOpen)return;
 const source=classicWorks()[key];if(!source)return;
 if(source.press){
  if(!source.press.destination&&S.turn>=source.press.due)pushEv(classicPressReport(source));
  return;
 }
 const methods=[['抄校三册',10,1,3],['活字印二十册',24,2,20]],valid=()=>!S.over&&!classicWorks()[key]?.press;
 const chooseMethod=([label,cost,months,copies])=>{
  const allowed=()=>valid()&&E().treasury>=cost;
  return {t:`${label} · 国库−${cost}`,preview:`${royalTravelDuration(months)}后交样`,cond:allowed,why:'国库不足或已付梓',f:()=>{
   if(!allowed())return null;
   const work=classicStoryState().works[key]={...source,press:{due:S.turn+months,copies}};
   const people=classicWorkPeople(work),text=`《${work.title}》准予${label}。书样先交文渊阁核勘。`;
   for(const p of people)characterChapter(p,work.thread,'craft','文渊阁付梓',people,text);
   log(text,1);return text+fx(chg({treasury:-cost}));
  }};
 };
 pushEv({title:`文渊阁 · 付梓《${source.title}》`,valid,...CLASSIC_STORY_SOURCES.print,
  text:'掌书请示印数。少量仍可逐卷抄校，需多册分送时，字模可以拆开重排。头一批书样都要逐页对过原稿。',
  choices:[...methods.map(chooseMethod),{t:'暂留原本'}]});
};
function classicPressReport(work){
 const p=work.press,people=classicWorkPeople(work),relief=work.kind==='relief';
 const valid=()=>!S.over&&!p.destination&&p.due<=S.turn;
 const send=destination=>()=>{
  if(!valid())return null;
  p.destination=destination;
  if(destination==='上书房')p.schoolDue=S.turn+2;
  const text=`《${work.title}》校过书样。${cnNum(p.copies)}册已分送${destination}。${relief&&destination==='地方粮仓'?'县丞将领粮条目张贴在仓门，代报或亲领都可当场查照。':''}`;
  for(const person of people)characterChapter(person,work.thread,'craft','文渊阁付梓',people,text);
  log(text,1);return text;
 };
 return {title:`文渊阁 · 印本交样 · 《${work.title}》`,valid,...CLASSIC_STORY_SOURCES.print,
  text:`《${work.title}》的${cnNum(p.copies)}册都已经校过。请定下书由哪里接收。`,
  choices:[{t:relief?'分送地方粮仓':'送交上书房课读',f:send(relief?'地方粮仓':'上书房')},
   {t:'留存文渊阁',f:send('文渊阁')}]};
}
function classicSchoolReading(work){
 const pupils=S.children.filter(k=>childInPalace(k)&&!k.jailed&&kidAge(k)>=8);
 const k=pupils.find(k=>!work.people.includes(k.id))||pupils[0];
 if(!k)return null;
 const p=work.press,mothers=mothersOf(k).filter(c=>c.alive&&!c.gone),people=[k,...mothers];
 const observation=work.kind==='circle'?'把诗册上删去的半句也读了一遍。太傅问为何要留旧字，孩子说，看得出人是怎样想过又改过的。':
  '把译本的夹注与原句并抄，问太傅同一物若有两个名字，该根据什么来辨认。';
 const valid=()=>!S.over&&!p.schoolRead&&childInPalace(k)&&!k.jailed;
 return {title:`上书房 · 新书到案 · 《${work.title}》`,por:k,valid,text:`${k.name}翻开新送到的《${work.title}》阅读，${observation}`,
  choices:[{t:'让孩子把这一页讲给同窗',f:()=>{
   if(!valid())return null;
   p.schoolRead=true;
   characterChapter(k,work.thread,'craft','上书房新读',[...people,...classicWorkPeople(work)],`读了《${work.title}》。${observation}`);
   for(const c of mothers)characterChapter(c,work.thread,'family','上书房新读',people,`${k.name}带着《${work.title}》的抄页来找她，说起上书房的新见解。她把孩子标过的那句又读了一遍。`);
   return null;
  }}]};
}
function pendingClassicStory(){
 if(!classicStoriesActive()||S.over)return null;
 const event=classicCircleEvent();if(event)return event;
 for(const work of Object.values(S.classicStories?.works||{})){
  const p=work.press;
  if(!p)continue;
  if(!p.destination&&S.turn>=p.due)return classicPressReport(work);
  if(!p.schoolRead&&p.schoolDue<=S.turn){const reading=classicSchoolReading(work);if(reading)return reading;}
 }
 return null;
}
A.classicGarden=function(){
 if(classicStoriesActive()&&S&&!S.over&&!modalOpen)pushEv(classicCircleEvent());
};
function classicStoryPanel(place){
 if(!classicStoriesActive())return '';
 if(place==='garden'){
  const circle=classicCircle(),copy=S.classicStories?.works['circle-'+S.gen];
  if(!circle||circle.stage==='closed'&&!copy)return '';
  const pending=classicCircleEvent();
  const action=copy?`<button class="btn sm" onclick="A.go('place','wy')">去文渊阁</button>`:
   pending?`<button class="btn sm" onclick="A.classicGarden()">${circle.stage==='offer'?'听诗社的打算':'看新诗稿'}</button>`:'';
  return `<section class="detail-section"><h3>小园诗社</h3><p>${copy?'诗稿已收入文渊阁，可去翻阅。':circle.stage==='offer'?'园中有人递了花笺，愿同读诗。':'社中正在传阅诗稿，等两次社集后再议合卷。'}</p>${action}</section>`;
 }
 const school=place==='school';
 const entries=Object.entries(classicWorks());
 const works=entries.filter(([,w])=>school?w.press?.destination==='上书房':w.kind!=='translation'||w.press);
 const translations=school?[]:entries.filter(([,w])=>w.kind==='translation'&&!w.press);
 if(!works.length&&!translations.length)return '';
 return `<section class="detail-section"><h3>${school?'新到课本':'文渊阁抄本与印本'}</h3>
  ${works.map(([key,w])=>`<div class="acts"><button class="btn sm" onclick="A.classicReadWork('${key}')">翻阅《${esc(w.title)}》</button>
    <span class="hint">${esc(classicPressNotice(w))}</span>${!school&&(!w.press||!w.press.destination&&S.turn>=w.press.due)?
    `<button class="btn sm" onclick="A.classicPress('${key}')">${w.press?'查看书样':'议付梓'}</button>`:''}</div>`).join('')}
  ${translations.map(([key,w])=>`<button class="btn sm" onclick="A.classicPress('${key}')">付梓《${esc(w.title)}》</button>`).join('')}</section>`;
}
