/* One saved identity per authored guest; views never create people or draw lots. */
const FENGHUA_VERSION=23;
const FENGHUA_PEOPLE=Object.freeze({
 shangguanLantai:{name:'上官兰台',sur:'上官',given:'兰台',gender:'f',age:25,portrait:435,role:'掌书女官',temperament:'明敏自持',principle:'愿凭文章受信任，也愿为自己的判断负责。',entry:'recruit',route:'御书房 → 风华人物 → 举行女官选拔',intro:'女史选拔的卷子送到御前。她没有抢着呈上华丽辞句，却圈出诏稿中一处会让灾县多缴钱粮的误字：“这一个字，落到百姓头上便不是文章了。”',summary:'从一次校书，到署名与担责，再到皇嗣的第一篇文章。'},
 gaoHuaibi:{name:'高怀璧',sur:'高',given:'怀璧',gender:'m',age:26,portrait:436,role:'边关功臣',temperament:'温厚而有锋芒',principle:'容貌留给旁人议论，功劳必须还给真正流血的人。',entry:'merit',route:'近两年收到边关捷报后 → 御书房 → 风华人物 → 召见有功将士',intro:'随得胜军队回京的有功将士中，有一位年轻游击。高怀璧卸下护面，殿中短暂一静。他却先递上一册阵亡者名簿：“臣的名字可以后写，他们的不能漏。”',summary:'请功册上的无名者、伤后的选择，以及面对盛名时如何安身。'},
 jiShuye:{name:'嵇叔夜',sur:'嵇',given:'叔夜',gender:'m',age:29,portrait:437,role:'琴师名士',temperament:'疏放守真',principle:'琴可以奏给知己听，心意不能写成奉承的话。',entry:'city',route:'出巡 → 微服私访，偶遇城郊入城的琴客',intro:'书肆后院有人抚琴，弦声忽然停了。他俯身把爬到琴边的小虫挪到叶上，才问来人想听什么。“若只想听吉祥话，隔壁唱得更好。”',summary:'一首不肯献媚的曲、一位愿意静听的学生，以及去留之间的友谊。'},
 xueHongjian:{name:'薛红笺',sur:'薛',given:'红笺',gender:'f',age:27,portrait:438,role:'诗人与笺铺主人',temperament:'明快通透',principle:'诗可以赠人，名字与手艺不能被别人买走。',entry:'city',route:'出巡 → 微服私访，留意书肆与花笺铺',intro:'花笺铺里，两位客人正争论墙上的诗出自哪位名士。掌柜把新染的红笺铺平，笑道：“若是女子写的，这首诗就忽然不值钱了么？”她便是薛红笺。',summary:'诗稿遭冒名、宫中订单的代价，以及一封真正写给人的信。'},
 sunYunxiu:{name:'孙云岫',sur:'孙',given:'云岫',gender:'m',age:37,portrait:439,role:'游方医者',temperament:'温厚执拗',principle:'先看病人，再看身份；该休养的日子，谁也省不得。',entry:'city',route:'出巡 → 微服私访，药铺或义诊处偶遇；宫中有调养需要时更易听见其名',intro:'药铺前的队伍已经排到街角。孙云岫收下一个孩子递来的两枚铜钱，又把足量药材放进纸包。随从要替你清出位置，他抬起头：“急症先看，贵人也一样。”',summary:'宫门内外的一张药方、没有写进账簿的病人，以及敢不敢说实话。'},
 liuZhaoshuang:{name:'柳照霜',sur:'柳',given:'照霜',gender:'f',age:24,portrait:440,role:'江湖剑客',temperament:'爽利重诺',principle:'答应送到的人要送到，传言里没查清的事不急着定罪。',entry:'city',route:'出巡 → 微服私访，遇见护送行旅的江湖女子',intro:'桥头几人拦住一辆车，指着押车女子说她来路不明。柳照霜没有拔剑，只取出一路盖印的凭据：“若疑我是贼，先问问车上的人愿不愿跟我走。”',summary:'护送的真相、江湖旧友与宫中流言，以及一柄剑应该交给谁。'},
 linJianxi:{name:'林见溪',sur:'林',given:'见溪',gender:'m',age:23,portrait:STORY_NPC_PORTRAITS.linJianxi,role:'竹林贤客',temperament:'清风朗月',principle:'白衣玉冠，执一柄无字山水扇。皎皎如天上月，说话轻，照顾人像照顾自家孩子，总肯等别人说完。',entry:'city',route:'出巡 → 微服私访，留意城外竹径',intro:'城外竹径，风从林梢下来，吹散了小童手里的习字纸。白衣人合扇压住纸角，蹲下身陪孩子一张张捡齐，沾了泥的那张还拿袖口擦了擦。路边卖笋的老妇看呆了，小声说：“像是月亮下来了。”错落的几笔他也看见了，只低声问：“哪一张是你最想留的？”孩子挑了半天，他也就安静地等了半天。',summary:'竹径拾纸、扇上山水、等她答完。既可与他交游，也可由公主自己决定是否相知。'},
 heXingjian:{name:'贺行简',sur:'贺',given:'行简',gender:'m',age:31,portrait:STORY_NPC_PORTRAITS.heXingjian,role:'东厂首捕',temperament:'冷面持正',principle:'玄色飞鱼服，绣春刀入鞘，腰牌上刻着「东厂」二字。人称陛下手里最锋利的一把刀。他认规矩：奉谁的令、查到谁，都如实回报；谢安讲情面，他只认凭据。办过的差事都肯署名，动过的手也自己认。',entry:'east-factory',route:'设立锦衣卫后，在宫闱巡察、旧案密查或御前奏折中查阅东厂附札',intro:'黑色飞鱼服上绣着暗金纹样，腰牌上刻着「东厂」两个字。他把绣春刀放在手边，两份勘单并排放下，只说了一句：“人扣错了。”末页落款是他自己的名字。',summary:'御前初见、两件东厂专案与三段人物小事。奉差双倍进度，依原案证据查明。'}
});
const fenghuaReadable=()=>!!S&&journalContentVersion()>=FENGHUA_VERSION;
const fenghuaActive=()=>fenghuaReadable()&&!S.over;
function fenghuaReleased(key){
 if(key==='linJianxi')return journalContentVersion()>=71&&typeof linJianxiPerson==='function';
 if(key==='heXingjian')return journalContentVersion()>=73&&typeof heXingjianPerson==='function';
 return true;
}
const fenghuaAll=()=>[...(S?.fenghua?.people||[]),...(S?.scholars||[]).filter(p=>p.fenghuaKey),...(S?.consorts||[]).filter(p=>p.hongjian),...(S?.retainedFamilies||[]).filter(p=>p.hongjian),...(S?.previousCourts||[]).flatMap(court=>court.consorts||[]).filter(p=>p.hongjian)].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i);
const fenghuaPerson=key=>fenghuaAll().find(p=>p.fenghuaKey===key);
function fenghuaState(){const s=S.fenghua ||= {lastCity:-99};s.people ||= [];s.attempts ||= {};return s;}
const fenghuaPresent=p=>fenghuaActive()&&!!p&&!p.hongjian&&p.alive!==false&&!p.exiled&&!p.dismissed&&!p.commission&&!p.incognitoCase&&!p.away&&S.turn>=(p.fenghua?.awayUntil??-1);
function fenghuaEntryReady(key){
 const d=FENGHUA_PEOPLE[key];return fenghuaActive()&&!!d&&fenghuaReleased(key)&&!(key==='xueHongjian'&&livingStoryConsort('hongjian'))&&!fenghuaPerson(key)&&!S.fenghua?.admitted?.[key]&&!mourningActive()&&S.turn-(S.fenghua?.attempts?.[key]??-99)>=6&&
  (d.entry!=='merit'||Number.isFinite(S.flags.lastMilitaryMerit)&&S.turn-S.flags.lastMilitaryMerit<=24);
}
function fenghuaPreview(key){const d=FENGHUA_PEOPLE[key];return {id:'fenghua-preview-'+key,name:d.name,sur:d.sur,given:d.given,age:d.age,seed:d.portrait,portraitOverride:d.portrait,alive:true};}
function createFenghuaPerson(key,meeting){
 if(!fenghuaActive()||!FENGHUA_PEOPLE[key]||!fenghuaReleased(key))return null;const old=fenghuaPerson(key);if(old)return old;if(S.fenghua?.admitted?.[key])return null;
 const d=FENGHUA_PEOPLE[key],p=key==='gaoHuaibi'?makeScholar():{id:'fenghua-'+S.gen+'-'+key,story:[]};
 Object.assign(p,{name:d.name,sur:d.sur,given:d.given,gender:d.gender,age:d.age,seed:d.portrait,temperament:d.temperament,alive:true,
  fenghuaKey:key,portraitOverride:d.portrait,artPortrait:d.portrait,origin:key==='gaoHuaibi'?'边关战功起家':'上京访客',registrySource:'story',
  fenghua:{stage:0,trust:40,met:S.turn,born:S.turn-d.age*12,lastVisit:-99,choices:{},friends:[],role:d.role}});
 if(key==='gaoHuaibi'){Object.assign(p,{official:3,career:'official',office:'游击',post:'游击',ability:88,merit:35,trust:55,education:null,appointedTurn:S.turn,ageTrackedAt:S.turn,siblingsChecked:true,essay:'以护军与战功受召，未以科名入仕'});(S.scholars ||= []).push(p);}
 else fenghuaState().people.push(p);
 if(key==='linJianxi')p.fenghua.stage=1;
 fenghuaRecord(p,key==='linJianxi'?'竹径拾纸':'初识',meeting||d.intro,'愿意相识',`${d.name}以${d.role}的身份留下姓名。`);return p;
}
function fenghuaWitness(x){return !!x&&x.alive!==false&&(S.consorts.includes(x)?inPalace(x):x.fenghuaKey?fenghuaPresent(x):S.children.includes(x)?childCanVisitCourt(x):x.storyPerson==='xiean'?xiePresent(x):true);}
function fenghuaRecord(p,title,situation,choice,outcome,peers=[]){
 const present=[p,...peers.filter(x=>fenghuaWitness(x)||p.fenghuaKey==='linJianxi'&&linJianxiPrincessPresent(x))].filter((x,i,a)=>x&&x.alive!==false&&a.indexOf(x)===i),event={title,participants:present.map(x=>({id:x.id,name:x.name||fullName(x)})),situation,choice,outcome};
 for(const x of present){(x.story ||= []).push({d:dateStr(),thread:'fenghua:'+p.id,t:`【${title}】${situation}\n回应：${choice}。${outcome}`,event,life:{source:'风华人物',people:event.participants}});}
 log(`${p.name} · ${title}：${outcome}`);
}
function fenghuaMeetEvent(key){
 const d=FENGHUA_PEOPLE[key];if(!fenghuaEntryReady(key))return null;let done=false;
 const valid=()=>!done&&fenghuaActive()&&!(key==='xueHongjian'&&livingStoryConsort('hongjian'))&&!fenghuaPerson(key)&&!S.fenghua?.admitted?.[key]&&!mourningActive();
 return {title:d.name+(key==='linJianxi'?' · 竹径拾纸':' · 初识'),por:fenghuaPreview(key),valid,text:d.intro,choices:[
  {t:key==='shangguanLantai'?'依才录用，任掌书女官':key==='gaoHuaibi'?'按功册召见，让他把话说完':'听她说完，记下姓名'.replace('她',d.gender==='m'?'他':'她'),f:()=>{if(!valid())return null;done=true;const p=createFenghuaPerson(key);return `${p.name}已记入御书房「${key==='xueHongjian'&&typeof hongjianContent==='function'&&hongjianContent()?'剧情妃图鉴':'风华人物'}」，之后可以单独相见。${key==='gaoHuaibi'?'以游击之职列入官员名册，军功与原报捷者分别记载。':''}`;}},
  {t:'此次不相邀，留待以后',f:()=>{if(!valid())return null;done=true;log(`听闻${d.name}，此次未相邀。`);return '各自作别。过些时日，仍可能再有相识的机会。';}}
 ]};
}
A.fenghuaMeet=function(key){
 const d=FENGHUA_PEOPLE[key];if(modalOpen||!d||!['recruit','merit'].includes(d.entry)||!fenghuaEntryReady(key)||E().treasury<(d.entry==='recruit'?10:0))return;
 const ev=fenghuaMeetEvent(key);if(!ev||!useE())return;fenghuaState().attempts[key]=S.turn;
 if(d.entry==='recruit')chg({treasury:-10});pushEv(ev);
};
const fenghuaOut=A.out;
A.out=function(kind){
 if(kind==='city'&&fenghuaActive()&&!modalOpen&&E().energy>0&&!mourningActive()&&S.turn-(S.fenghua?.lastCity??-99)>=2){
  const possible=Object.keys(FENGHUA_PEOPLE).filter(key=>FENGHUA_PEOPLE[key].entry==='city'&&fenghuaEntryReady(key));
  if(possible.length&&chance(.28)){
   const needDoctor=E().health<65||harem().some(c=>consortRecovery(c)),key=pickW(possible.map(key=>({key,w:key==='sunYunxiu'&&needDoctor?3:1}))).key,ev=fenghuaMeetEvent(key);
   if(ev&&useE()){const state=fenghuaState();state.lastCity=S.turn;state.attempts[key]=S.turn;setScene('city');pushEv(ev);return;}
  }
 }
 return fenghuaOut(kind);
};
function fenghuaVisitReady(p){return fenghuaPresent(p)&&!mourningActive()&&S.turn-(p.fenghua.lastVisit??-99)>=3&&E().energy>0;}
function openFenghuaVisit(p,build){
 if(modalOpen||!fenghuaVisitReady(p))return;
 const ev=build(p);if(!ev||!useE())return;p.fenghua.lastVisit=S.turn;pushEv(ev);
}
A.fenghuaVisit=key=>openFenghuaVisit(fenghuaPerson(key),fenghuaStoryEvent);
function fenghuaEvent(p,title,text,options,{peers=[],advance=true}={}){
 const phase=p.fenghua.stage;let done=false;const valid=()=>!done&&fenghuaPresent(p)&&p.fenghua.stage===phase&&peers.every(fenghuaWitness);
 return {title:p.name+' · '+title,por:p,cast:[p,...peers],valid,text,choices:options.map(o=>({t:o.t,cond:()=>valid()&&(!o.cond||o.cond()),why:o.why||'眼下条件不符',f:()=>{
  if(!valid()||o.cond&&!o.cond())return null;done=true;const outcome=o.f?.()||o.result||'此事已记下。';
  if(advance)p.fenghua.stage++;p.fenghua.trust=clamp(p.fenghua.trust+(o.trust||0));p.fenghua.choices[title]=o.key||o.t;
  fenghuaRecord(p,title,text,o.t,outcome,o.peers||peers);return outcome;
 }}))};
}
function fenghuaCodex(){
 if(!fenghuaReadable())return '';
 const x=(S.scholars||[]).find(p=>p.storyPerson==='xiean'),xie={name:'谢安',portrait:433,temperament:'疏朗自持',principle:'以诗名世，拒绝以诗名冒领官声。',route:'微服私访或皇嗣少年心事中听闻',summary:'召见、辞官、尚主与婚后相知。'};
 const cards=[{key:'xiean',d:xie,p:x},...Object.entries(FENGHUA_PEOPLE).filter(([key])=>fenghuaReleased(key)&&(key!=='xueHongjian'||typeof hongjianContent!=='function'||!hongjianContent())).map(([key,d])=>({key,d,p:fenghuaPerson(key)}))];
 return `<div class="story-consort-codex"><p class="hint">这里收录不入后宫的独立人物：名士、功臣、女官与宫外友人。可纳为妃并有后宫故事的人物另见「剧情妃图鉴」。点进已相识者可查看近况、相见与连续纪事。</p>${cards.map(({key,d,p})=>{
  if(key==='xiean'&&journalContentVersion()>=24)return notablePeopleCodex().replace('data-notable="xiean"','data-notable="xiean" data-fenghua="xiean"');
  const preview=p||(key==='xiean' ?{name:d.name,sur:'谢',given:'安',portraitOverride:d.portrait,alive:true}:fenghuaPreview(key)),status=!p?'尚未相识':p.alive===false?'已故':p.exiled?'流放在外':p.away||p.commission||p.incognitoCase||S.turn<(p.fenghua?.awayUntil??-1)?'暂在外':p.dismissed?'已被罢免':key==='xiean'?'已相识':p.fenghua.role;
  return `<article class="story-consort-card" data-fenghua="${key}"><div class="story-consort-picture">${porImg(preview,200)}<span class="tag y">${esc(status)}</span></div><div class="story-consort-copy"><h3>${d.name}</h3><p><strong>${d.temperament}</strong> · ${d.principle}</p><dl><dt>相遇方式</dt><dd>${d.route}</dd><dt>人物故事</dt><dd>${d.summary}</dd></dl>${typeof fenghuaGuide==='function'?fenghuaGuide(key,p):''}<div class="acts">${p?`<button class="btn jade" onclick="A.go('${key==='xiean'?'scholar':'fenghua'}','${key==='xiean'?p.id:key}')">查看人物与纪事</button>`:key==='shangguanLantai'||key==='gaoHuaibi'?`<button class="btn jade" onclick="A.fenghuaMeet('${key}')" ${fenghuaEntryReady(key)&&E().energy>0&&(key!=='shangguanLantai'||E().treasury>=10)?'':'disabled'}>${key==='shangguanLantai'?'举行女官选拔 · 精力1、国库10':'召见有功将士 · 精力1'}</button>`:d.entry==='east-factory'?'<button class="btn" onclick="A.go(\'jinyiwei\')">前往锦衣卫</button>':'<button class="btn" onclick="A.go(\'out\')">前往探访</button>'}</div></div></article>`;
 }).join('')}</div>`;
}
function viewFenghuaPerson(){
 const p=fenghuaPerson(UI.sel);if(!p)return viewHome();if(p.hongjian&&typeof hongjianProfile==='function')return hongjianProfile(p);const d=FENGHUA_PEOPLE[p.fenghuaKey],ready=fenghuaVisitReady(p),remaining=Math.max(0,3-(S.turn-p.fenghua.lastVisit));
 const friends=[...fenghuaAll(),...(S.scholars||[])].filter((x,i,a)=>(p.fenghua.friends.includes(x.id)||p.fenghua.friends.includes(x.hongjian?.previousId))&&a.indexOf(x)===i);
 const official=p.fenghuaKey==='gaoHuaibi',near=fenghuaPresent(p),reason=p.alive===false?'故人纪事仍在。':!near?'暂不能相见。':remaining?`再过${remaining}个月可相见。`:mourningActive()?'国丧期间暂缓雅集。':'相见消耗1点精力，每三个月一次。';
 return `${personBackButton('home')}<header class="detail-head person-detail-head">${porImg(p,224)}<div class="grow"><p>${esc(official?officialOfficeLabel(p):p.fenghua.role)}</p><h2>${esc(p.name)}</h2><p>${p.age}岁 · ${d.temperament}</p><p>${d.principle}</p></div></header>${bar('相知',p.fenghua.trust)}
  <div class="acts"><button class="btn primary" onclick="A.fenghuaVisit('${p.fenghuaKey}')" ${ready?'':'disabled'}>${p.fenghuaKey==='linJianxi'?'相见 · 竹下交游':p.fenghua.stage<3?'相见 · 续说近事':'相见 · 日常交游'}</button>${official?'<button class="btn" onclick="A.go(\'government\')">前往军政任用</button>':''}</div><p class="hint">${reason}</p>
  ${detailSection('经历与选择',detailStory(p))}
  <p class="hint">${d.summary} · 已记主线 ${Math.min(3,p.fenghua.stage)}/3 段${p.fenghua.stage>=3?'，仍可日常交游':''}。</p>
  ${official?`<div class="detail-vitals">${bar('才干',p.ability)}${bar('功绩',p.merit)}${bar('信任',p.trust)}</div><p>${esc(officialStatus(p))} · 以军功入仕</p>${p.report?detailSection('待阅回奏',`<p>${esc(p.report.text)}</p><button class="btn jade" onclick="A.officialReport('scholar:${p.id}')">阅看回奏</button>`):''}${p.commission?detailSection('当前差事',`<p>${esc(p.commission.title)} · ${Math.max(0,p.commission.due-S.turn)}个月后回奏</p>`):''}${officialSpousePanel({p,key:'scholar:'+p.id,scholar:true})}${officialMarriagePanel('scholar:'+p.id)}`:''}${friends.length?detailSection('交游',friends.map(x=>`<p>${x.fenghuaKey?chroniclePersonLink(x):careerLink({p:x,scholar:true,key:'scholar:'+x.id})}${x.alive===false?' · 已故':''}</p>`).join('')):''}${p.fenghuaKey==='linJianxi'?linJianxiProfilePanel(p):''}${p.fenghuaKey==='heXingjian'?heXingjianPanel():''}${typeof fenghuaGuide==='function'?fenghuaGuide(p.fenghuaKey,p):''}${p.fenghuaKey==='xueHongjian'&&typeof hongjianContent==='function'&&hongjianContent()?hongjianGuestPanel(p):''}`;
}
PERSON_DETAIL_VIEWS.push('fenghua');
const fenghuaScholarView=viewScholar;
viewScholar=function(){const p=scholarById(UI.sel);if(p?.fenghuaKey){const prior=UI.sel;UI.sel=p.fenghuaKey;try{return viewFenghuaPerson();}finally{UI.sel=prior;}}return fenghuaScholarView();};
const fenghuaScholarTalk=A.scholarTalk;
A.scholarTalk=function(id){const p=scholarById(id);return p?.fenghuaKey?A.fenghuaVisit(p.fenghuaKey):fenghuaScholarTalk(id);};
const fenghuaChronicleLink=chroniclePersonLink;
chroniclePersonLink=function(ref){const p=fenghuaAll().find(x=>x.id===ref.id||x.hongjian?.previousId===ref.id);return p?`<button class="btn quiet sm" onclick="A.go('fenghua','${p.fenghuaKey}')">${esc(p.name)}</button>`:fenghuaChronicleLink(ref);};
const fenghuaChronicleThread=A.chronicleThread;
A.chronicleThread=function(key,index){
 const id=String(key).slice(String(key).indexOf(':')+1),p=fenghuaAll().find(x=>String(x.id)===id||String(x.hongjian?.previousId)===id);
 if(!p)return fenghuaChronicleThread(key,index);const thread=chronicleThread(p.story?.[index]||{});
 if(thread){(UI.chronicleFilters||={})[key]={thread};render();}
};
const fenghuaCareerPeople=careerPeople;
careerPeople=function(){return fenghuaCareerPeople().map(x=>x.p.fenghuaKey==='gaoHuaibi'?{...x,bloc:'army'}:x);};
const fenghuaCourtPerson=courtPerson;
courtPerson=function(key){const x=fenghuaCourtPerson(key);return x?.p.fenghuaKey==='gaoHuaibi'?{...x,bloc:'army'}:x;};
const fenghuaMinistryCandidates=ministryCandidates;
ministryCandidates=function(id){
 const list=fenghuaMinistryCandidates(id).filter(x=>x.p.fenghuaKey!=='gaoHuaibi'),p=fenghuaPerson('gaoHuaibi');
 if(id==='war'&&p&&officialServing(p)&&officialMilitary(p)&&p.ability>=55&&p.merit>=45&&S.turn-p.appointedTurn>=24&&!ministryHeldBy(p))list.push({p,key:'scholar:'+p.id,scholar:true,bloc:'army'});
 return list;
};
const fenghuaChildTick=childLifeTick;
function fenghuaLifeTick(){if(!fenghuaActive())return;for(const p of fenghuaAll()){
 if(p.alive===false||p.hongjian)continue;if(!p.scholar)p.age=Math.floor((S.turn-p.fenghua.born)/12);
 if(fenghuaPresent(p)&&p.fenghua.followup&&S.turn>=p.fenghua.followup.due){const f=p.fenghua.followup;delete p.fenghua.followup;const c=f.patient==='emp'?null:byId(f.patient);
  if(f.patient==='emp'&&f.gen===S.gen){const result=chg({health:3});fenghuaRecord(p,'复诊回信','依约复诊，仍嘱按时休息。','继续调养','龙体略有起色。'+result);}
  else if(c&&inPalace(c)){const result=cchg(c,{mood:5});fenghuaRecord(p,'复诊回信',`${fullName(c)}依约复诊，原定静养安排继续。`,'如实复诊','安心调养，不催促恢复。'+result,[c]);}
 }
}}
childLifeTick=function(){fenghuaChildTick();fenghuaLifeTick();};
