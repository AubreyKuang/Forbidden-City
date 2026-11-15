/* Named siblings remain people before, during and after a palace visit. */
const natalAge=p=>p.consortId?byId(p.consortId)?.age||p.age:Math.max(0,Math.floor((((p.alive===false?p.death?.turn:S.turn)??S.turn)-p.born)/12));
function natalPeople(h){return (h?.relatives||[]).filter(p=>!p.consortId);}
function initializeNatalFamily(c,h,family){
  const copies=family.map(x=>x.house).filter(x=>x&&x!==h);
  const previous=copies.find(x=>x.natal);if(!h.natal&&previous){h.natal=JSON.parse(JSON.stringify(previous.natal));h.relatives=JSON.parse(JSON.stringify(previous.relatives||[]));}
  if(!h.natal){
    h.natal={version:1,created:S.turn,motherBorn:S.turn-(c.age+20+voiceHash(h.father.id)%5)*12,births:0};h.relatives=[];
    const seed=voiceHash(h.father.id+':other-siblings'),roll=seed%100,count=roll<30?0:roll<70?1:roll<93?2:3;
    for(let i=0;i<count;i++){
      const n=voiceHash(seed+':'+i),sex=n%3===0?'m':'f';
      const age=sex==='m'||h.fiveBrothers?Math.max(1,c.age-2-i*3):Math.max(1,c.age+(n%2?3:-4)-i*2);
      addNatalPerson(c,h,sex,age,n,false);
    }
  }
  h.natal.motherBorn=Math.min(h.natal.motherBorn,S.turn-(Math.max(c.age,...brotherRoles(h).map(r=>h[r].age),...h.relatives.map(p=>natalAge(p)))+18)*12);
  h.relatives ||= [];h.natal.memberBorn ||= {};
  for(const other of copies){
    for(const p of other.relatives||[]){
      const same=h.relatives.find(x=>x.id===p.id);
      if(!same)h.relatives.push(p);
      else{if(p.alive===false){same.alive=false;same.death||=p.death;}same.consortId||=p.consortId;
        same.story=[...(same.story||[]),...(p.story||[])].filter((x,i,a)=>a.findIndex(y=>y.d===x.d&&y.t===x.t)===i);}
    }
  }
  for(const member of family)h.natal.memberBorn[member.id]??=S.turn-member.age*12-(S.month-1);
}
function addNatalPerson(c,h,sex,age,seed,birth=true){
  const names=sex==='f'?GIRLA.flatMap(a=>GIRLB.map(b=>a+b)):BROTHER_NAMES;
  const used=new Set([h.father.name,...brotherRoles(h).map(r=>h[r].name),...(h.relatives||[]).map(p=>p.name),...S.consorts.map(fullName)]);
  let given=names[seed%names.length];for(let i=0;i<names.length&&used.has(c.sur+given);i++)given=names[(seed+i+1)%names.length];
  const existing=new Set([...S.consorts,...(S.cands||[])].flatMap(x=>[x.id,...(x.house?.relatives||[]).map(r=>r.id)]));
  let id=-1-voiceHash(h.father.id+':relative:'+(h.relatives?.length||0));while(existing.has(id))id--;
  const p={id,sur:c.sur,given,name:c.sur+given,sex,age,born:S.turn-age*12-(birth?0:S.month-1),seed,alive:true,
    trait:['温婉','活泼','沉静','才女','爽直','聪慧'][seed%6],married:age>=22&&seed%3===0,willing:seed%4!==0,story:[]};
  if(sex==='m'){p.career='student';p.education=age>=22&&seed%3===0?'举人':'书生';p.post=p.education;}
  p.seed=seed&0x7fffffff;p.rank=0;
  p.artPortrait=CONSORT_PORTRAITS[seed%CONSORT_PORTRAITS.length];
  h.relatives ||= [];h.relatives.push(p);h.father.age=Math.max(h.father.age,age+18);
  // Existing siblings have an established bond, which can also be strained.
  relAdd(c,p,seed%5===0?-35:15+seed%46);
  if(birth){story(p,'在娘家出生，家人向宫中报平安。');natalRecord(c,p,`娘家添了${sex==='m'?'男孩':'女孩'}${p.name}，母子平安。`,.6);}
  return p;
}
function natalLabel(c,p){
  if(p.parentRelativeId){const parent=c.house?.relatives?.find(x=>x.id===p.parentRelativeId);return parent?.sex==='f'?(p.sex==='m'?'外甥':'外甥女'):(p.sex==='m'?'侄子':'侄女');}
  const born=c.house?.natal?.memberBorn?.[c.id]??S.turn-c.age*12;
  return p.sex==='m'?(p.born<born?'兄长':'弟弟'):(p.born<born?'姐姐':'妹妹');
}
function natalPortrait(p){
  const age=natalAge(p);
  return age<18?{...p,courtGuest:true}:p.sex==='m'?{...p,official:2}:{...p,sex:undefined,age,courtGuest:false};
}
function natalStatus(p){return !p.alive?'已故':p.consortId?'已入宫':p.visit?'入宫探亲':natalAge(p)<6?'家中幼儿':natalAge(p)<18?'在家读书':p.married?'已婚':p.betrothal?'议亲中':p.career==='commoner'?p.post:'居于娘家';}
function natalEntry(id,relative){const c=byId(+id),h=c&&houseOf(c),p=h?.relatives?.find(p=>p.id===+relative);return p?{c,h,p}:null;}
function natalRecord(c,p,text,emotion=0){
  story(p,text);
  for(const member of paternalFamily(c).filter(x=>S.consorts.includes(x)&&x.alive)){
    const line=`【娘家手足 · ${p.name}】${text}`;story(member,line);
    NPCMemory.record(S,{type:'natal-family',time:S.turn,participants:[member.id,p.id],outcome:text},[{person:member.id,subject:p.id,interpretation:text,emotion,impact:70}]);
  }
}
function natalFamilyLinks(c){
  const h=c.house;if(!h)return '';
  return natalPeople(h).map(p=>`<div>${natalLabel(c,p)}：<button class="person-link" onclick="A.go('${p.sex==='m'&&natalAge(p)>=18?'official':'natal'}','${c.id}:${p.sex==='m'&&natalAge(p)>=18?'relative'+p.id:p.id}')">${esc(p.name)} ↗</button> <span class="hint">${natalAge(p)}岁 · ${p.sex==='m'?(p.post+' · '):''}${natalStatus(p)}</span></div>`).join('');
}
function natalVisitReady(c,p){return inPalace(c)&&!c.maid&&p.alive&&!p.consortId&&!p.visit&&(p.sex==='f'||natalAge(p)<13)&&
  S.turn-(p.lastVisit??-99)>=12&&!mourningActive()&&!natalPeople(c.house).some(x=>x.visit);}
function natalInPalace(c,p){return !!p.visit&&p.visit.host===c.id&&S.turn<p.visit.until&&p.alive&&inPalace(c)&&!p.consortId;}
function natalRomanceReady(c,p){return !p.parentRelativeId&&natalInPalace(c,p)&&p.sex==='f'&&natalAge(p)>=18&&!p.married&&!p.declined;}
function natalVisitEvent(c,p){
  if(!natalVisitReady(c,p))return null;
  const response=sisterArrivalFeeling(c,p,false);
  return {title:'娘家来访',por:c,present:[c],valid:()=>natalVisitReady(c,p),text:`${cName(c)}的${natalLabel(c,p)}${p.name}想入宫探望，${natalAge(p)<18?'将由家中长辈陪同，':'按亲眷探视的礼数，'}住两个月后回家。\n${response.text}`,choices:[
    {t:'准许探亲',f:()=>{if(!natalVisitReady(c,p))return null;p.visit={host:c.id,from:S.turn,until:S.turn+2};p.lastVisit=S.turn;
      natalSceneRecord(c,p,`${p.name}获准入宫探望${fullName(c)}，约定两个月后归家。${response.text}`,response.delta/20);relAdd(c,p,response.delta);cchg(c,{mood:response.delta});
      pushNow(natalMeetingEvent(c,p));return null;}},
    {t:'暂缓，先让她们通书信',f:()=>{p.lastVisit=S.turn-6;natalSceneRecord(c,p,'这次探亲暂缓，仍可由家中递送书信。');return '家中收到回信，尚未动身。';}}
  ]};
}
function natalMeetingEvent(c,p){
  if(!natalInPalace(c,p))return null;
  const age=natalAge(p),child=age<18;
  const scene=age<3?'由长辈抱着，在帘下听见说话声便转过头来':child?'把家中带来的小物一件件摆好，认真说着读书与起居的小事':
    ({温婉:'把家人的问候慢慢说清，又问她近来睡得可好',活泼:'说起家乡街巷的新鲜事，听见通报便收声行礼',沉静:'在窗边陪她坐着，偶尔补上一句家中的近况',才女:'带来一本旧书，在页边留着两人都认得的批注',爽直:'先问她过得如何，见你到来便大方行礼',聪慧:'将家中近况分说明白，也留意到她欲言又止的神色'}[p.trait]);
  return {title:'探亲相见',por:natalPortrait(p),cast:[c],present:[c],valid:()=>natalInPalace(c,p),text:`你来到${c.palace}，见${fullName(c)}的${natalLabel(c,p)}${p.name}正在探亲。${p.name}${scene}。${child?'随行长辈始终在旁照看。':''}`,choices:[
    {t:age<3?'问起家中的照料':'听她们说家中近况',f:()=>{if(!natalInPalace(c,p))return null;natalSceneRecord(c,p,`探亲时与陛下一同谈起家中近况。${fullName(c)}把这次见面记了下来。`,.4);relAdd(c,p,4);return '你听完家中的近况，将余下的时辰留给亲人相聚。';}},
    ...(natalRomanceReady(c,p)?[{t:'一见倾心，询问她是否愿意入宫',f:()=>{if(!natalRomanceReady(c,p))return null;pushNow(natalCourtshipEvent(c,p));return null;}}]:[]),
    {t:'让亲人自在说话',f:()=>{if(!natalInPalace(c,p))return null;natalSceneRecord(c,p,'陛下留下亲人独处的时辰，没有打断探亲。',.2);return '廊下渐渐静了，亲人可以把尚未说完的话慢慢说完。';}}
  ]};
}
function natalCourtshipEvent(c,p){
  if(!natalRomanceReady(c,p))return null;
  if(!p.willing){p.declined=true;natalSceneRecord(c,p,`${p.name}听到入宫之意，明言更愿过宫外的日子。她的意愿被保留，仍按原约探亲归家。`);
    return {title:'她自己的心意',por:natalPortrait(p),present:[c],text:`${p.name}认真行礼：“承蒙陛下垂问，只是民女更愿过宫外的日子。此来是看望亲人，还请成全。”`,choices:[{t:'尊重她的心意',f:()=>'这次仍只是探亲。'}]};}
  return {title:'留宫之意',por:natalPortrait(p),present:[c],valid:()=>natalRomanceReady(c,p)&&p.willing,
    text:`${p.name}听清入宫意味着什么，思量后愿意留下。\n${sisterArrivalFeeling(c,p,true).text}\n若准入宫，她将以自己的身份生活，家中的亲缘与既有经历继续保留。`,choices:[
      {t:'纳为常在',cond:()=>rankCount(2)<RANK_CAP[2],why:'常在位分已满',f:()=>admitNatalSister(c,p)},
      {t:'不急，仍按探亲之约',f:()=>{natalSceneRecord(c,p,'谈过入宫之意，尚未定下，仍按原约探亲。');return '你没有立刻册封，她仍是来访的亲眷。';}}
    ]};
}
function makeNatalConsort(c,p){
  const g=makeGirl({sur:p.sur,given:p.given,age:natalAge(p),trait:p.trait,fam:{...c.fam}});
  g.id=p.id;g.seed=p.seed;g.artPortrait=p.artPortrait;g.house=c.house;g.fatherId=c.fatherId;g.clan=clanKey(c);g.story=p.story.map(s=>({...s}));g.kin={};g.kinRival={};
  for(const member of paternalFamily(c)){g.kin[member.id]='亲'+(natalLabel(member,p)==='姐姐'?'妹':'姐');member.kin||={};member.kin[g.id]='亲'+(natalLabel(member,p)==='姐姐'?'姐':'妹');
    if(relGet(member,p)<0){g.kinRival[member.id]=1;(member.kinRival||={})[g.id]=1;}}
  g.natalOrigin={host:c.id,relative:p.id};p.consortId=g.id;delete p.visit;
  return g;
}
function admitNatalSister(c,p){
  if(!natalRomanceReady(c,p)||!p.willing||rankCount(2)>=RANK_CAP[2])return null;
  const g=makeNatalConsort(c,p);
  addConsort(g,2,`探亲时与陛下相识，自愿入宫`);
  if(familyScenesEnabled())p.story=g.story.map(e=>({...e}));else story(p,'探亲相识后，自愿留下，册为常在。');
  return `${fullName(g)}受封常在。她与亲人的旧交、各自心思，都随之进入宫中的新生活。`;
}
function viewNatalRelative(){
  const [id,relative]=String(UI.sel).split(':'),e=natalEntry(id,relative);if(!e)return viewFamily();
  const {c,h,p}=e;if(p.consortId){UI.view='consort';UI.sel=p.consortId;return viewConsort();}
  if(p.sex==='m'&&natalAge(p)>=18){UI.view='official';UI.sel=c.id+':relative'+p.id;return viewOfficial();}
  const age=natalAge(p),living=p.alive,visited=natalInPalace(c,p);
  return `${personBackButton('family')}<header class="detail-head">${porImg(natalPortrait(p),224)}<div class="grow"><h2>${esc(p.name)}</h2><p>${esc(fullName(c))}的${natalLabel(c,p)} · ${age}岁 · ${natalStatus(p)}</p><p>${age<6?'尚在幼年':esc(p.trait)}</p></div></header>
    <div class="acts">${living?`<button class="btn" onclick="A.natalLetter(${c.id},${p.id})" ${S.turn-(p.lastLetter??-99)>=3&&E().energy>0?'':'disabled'}>${age<3?'赐衣问安':'赐书问候'}<small>精力−1 · 每三个月一次</small></button>`:''}
    ${natalVisitReady(c,p)?`<button class="btn" onclick="A.natalVisit(${c.id},${p.id})">准入宫探亲</button>`:''}${visited?`<button class="btn primary" onclick="A.natalMeet(${c.id},${p.id})">探亲相见</button><span>约${p.visit.until-S.turn}个月后归家</span>`:''}</div>
    ${detailSection('家族往来',`<p>${p.parentRelativeId?'母亲':'父亲'}：${p.parentRelativeId?`<button class="btn quiet" onclick="A.go('natal','${c.id}:${p.parentRelativeId}')">${esc(h.relatives.find(x=>x.id===p.parentRelativeId)?.name||'家中长辈')}</button>`:officialLink(c,'father')}</p><button class="btn quiet" onclick="A.go('consort',${c.id})">${esc(fullName(c))}</button>`+natalFamilyLinks(c))}
    ${natalLifePanel(c,p)}${detailSection('人物纪事',detailStory(p))}`;
}
A.natalVisit=function(id,relative){if(modalOpen)return;const e=natalEntry(id,relative);if(e)pushEv(natalVisitEvent(e.c,e.p));};
A.natalMeet=function(id,relative){if(modalOpen)return;const e=natalEntry(id,relative);if(e)pushEv(natalMeetingEvent(e.c,e.p));};
A.natalLetter=function(id,relative){if(modalOpen)return;const e=natalEntry(id,relative);if(!e||!e.p.alive||e.p.consortId||S.turn-(e.p.lastLetter??-99)<3||!useE())return;
  e.p.lastLetter=S.turn;const young=natalAge(e.p)<3;const text=young?`赐衣问安，家中代${e.p.name}回报起居平安。`:`陛下赐书问候${e.p.name}，也让${fullName(e.c)}捎去自己的话。`;
  natalRecord(e.c,e.p,text,.4);relAdd(e.c,e.p,3);pushEv({title:'家中回音',por:natalPortrait(e.p),text,choices:[ok1]});};
function natalFamilyTick(){
  const seen=new Set();
  for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h))continue;seen.add(h);
    for(const p of natalPeople(h)){
      if(p.alive)p.age=natalAge(p);
      if(p.visit&&(S.turn>=p.visit.until||!inPalace(byId(p.visit.host)))){const host=byId(p.visit.host)||c;delete p.visit;natalRecord(host,p,`${p.name}探亲结束，平安归家。${fullName(host)}将来访时留下的小物收好。`,.2);}
    }
    const n=h.natal;if(n.lastTick===S.turn)continue;n.lastTick=S.turn;
    if(n.pregnancy&&S.turn>=n.pregnancy.due){addNatalPerson(c,h,n.pregnancy.sex,0,n.pregnancy.seed);n.births++;n.lastBirth=S.turn;delete n.pregnancy;}
    const motherAge=Math.floor((S.turn-n.motherBorn)/12),family=paternalFamily(c);
    if(!n.pregnancy&&n.births<2&&c.alive&&!c.gone&&officialAlive(h.father)&&h.father.age<65&&motherAge>=20&&motherAge<=42&&
      !family.some(x=>x.wound==='mom'||['ill','recovering'].includes(homeMother(x)?.status))&&S.turn-(n.lastBirth??n.created)>=24&&chance(.003)){
      n.pregnancy={due:S.turn+9,sex:chance(.5)?'f':'m',seed:ri(1,2e9)};
      for(const member of family.filter(x=>x.alive&&S.consorts.includes(x)))story(member,'【娘家喜讯】家中来信，母亲有孕，正安心养护；她盼着平安的消息。');
    }
  }
}
function natalVisitRequest(){
  if(mourningActive()||!chance(.08))return null;
  const choices=harem().flatMap(c=>natalPeople(houseOf(c)).filter(p=>natalVisitReady(c,p)).map(p=>[c,p]));
  return choices.length?natalVisitEvent(...pick(choices)):null;
}
