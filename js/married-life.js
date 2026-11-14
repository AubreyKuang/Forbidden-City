/* Persisted personalities and households, shared by princes, princesses and old saves. */
const COUPLE_HOBBIES={books:'读书校书',riding:'骑射出游',kindness:'侍花理家'};
const COUPLE_TEMPERAMENTS=['温厚','爽朗','矜持','好胜','敏感','沉静'];
function marriageNature(p){
  if(p.marriageNature)return p.marriageNature;
  const random=mulberry32(p.seed||String(p.id||p.name).split('').reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0),7));
  const trait=p.appearance?.trait||p.trait;
  const temperament=({温婉:'温厚',将门:'爽朗',骄矜:'好胜',沉静:'沉静',体弱:'敏感',持重:'矜持'})[trait]||COUPLE_TEMPERAMENTS[Math.floor(random()*6)];
  const hobby=p.quality||({scholar:'books',martial:'riding',frontier:'riding',household:'kindness'})[p.route]||p.youthIdeal||
    (Number.isFinite(p.lit)?youthIdeal(p):['books','riding','kindness'][Math.floor(random()*3)]);
  return {temperament,hobby,spending:random()<.5?'节俭':'讲究',space:random()<.5?'喜欢相伴':'需要独处'};
}
function marriageFit(k,p){
  const a=marriageNature(k),b=marriageNature(p);
  const common=[],different=[];
  (a.hobby===b.hobby?common:different).push(a.hobby===b.hobby?'兴趣相投':`一个喜欢${COUPLE_HOBBIES[a.hobby]}，一个偏爱${COUPLE_HOBBIES[b.hobby]}`);
  (a.spending===b.spending?common:different).push(a.spending===b.spending?'用度习惯相近':'用度上需商量');
  (a.space===b.space?common:different).push(a.space===b.space?'相处节奏合拍':'独处与相伴的分寸不同');
  return {common,different,score:40+common.length*12};
}
function marriageProfileText(k,p){
  const a=marriageNature(k),b=marriageNature(p),fit=marriageFit(k,p);
  return `${k.name}：${a.temperament}，偏爱${COUPLE_HOBBIES[a.hobby]}，${a.space}。\n${p.name}：${b.temperament}，偏爱${COUPLE_HOBBIES[b.hobby]}，用度${b.spending}，${b.space}。\n${fit.common.length?'相投之处：'+fit.common.join('、')+'。':''}${fit.different.length?'需要磨合：'+fit.different.join('；')+'。':''}${p.marriageTalk?'\n相看时已谈过：'+p.marriageTalk.text:''}`;
}
function marriageMeeting(k,p,back){
  return {title:'相看问心',cast:[k,p],valid:()=>marriageReady(k),
    text:`礼部安排两人在花厅小坐。${p.name}${marriageNature(p).temperament==='好胜'?'谈到所长便眼睛一亮，也坦言不喜欢凡事让步。':'收起名帖，先问起对方平日真正喜欢做的事。'}\n${marriageProfileText(k,p)}`,choices:[
      {t:'让双方自己商量婚后打算',f:()=>{if(!marriageReady(k))return null;p.marriageTalk={turn:S.turn,text:'双方约定保留各自所长，家事一同商量。',trust:8};save('auto');pushNow(back());return null;}},
      {t:'先谈清楚家用与亲族来往',f:()=>{if(!marriageReady(k))return null;p.marriageTalk={turn:S.turn,text:'两人谈清府中用度，也约定亲族请托不能擅作主张。',trust:5};save('auto');pushNow(back());return null;}},
      {t:'还需再想想，先回去',f:()=>{pushNow(back());return null;}}
    ]};
}
const royalHouseholds=()=>[...new Map([...(S.royalRelatives||[]),...archivedPrincesses(),...S.children].map(k=>[k.id,k])).values()];
const royalById=id=>royalHouseholds().find(k=>k.id===id);
function ensureMarriedLife(k){
  if(!k?.married||!k.spouse)return null;
  const p=k.spouse;
  // Preserve known spouses; fill absent legacy fields exactly once without replacing their identities.
  const appearance=spouseAppearance(k);
  for(const field of ['sex','seed','born','portraitVariant','courtGuest'])if(p[field]===undefined&&appearance[field]!==undefined)p[field]=appearance[field];
  p.id ??= 'spouse-'+k.id;p.courtGuest=true;
  p.born ??= k.born;p.alive ??= true;p.marriedAt ??= S.turn;p.sur ||= p.name?.slice(0,1)||'沈';
  k.marriageNature ||= marriageNature(k);p.marriageNature ||= marriageNature(p);
  k.story ||= [];
  p.trust ??= clamp(marriageFit(k,p).score+(p.marriageTalk?.trust||0));
  k.household ||= {version:1,started:p.marriedAt,children:[],concubines:[],pregnancies:[],history:[],seen:{},lastTick:S.turn,lastBirth:-99,lastEvent:S.turn,nextNews:S.turn+4,lastNewsKind:null};
  k.household.nextNews ??= S.turn+4;
  if(!k.household.lastBirthByMother){
    k.household.lastBirthByMother={};
    for(const baby of k.household.children)if(Number.isFinite(baby.born))k.household.lastBirthByMother[baby.mother]=Math.max(k.household.lastBirthByMother[baby.mother]??-999,baby.born);
  }
  return k.household;
}
function householdMother(k){
  const id=k.foster||k.mom,d=[S.flags.dowager,S.flags.birthDowager].find(d=>d?.personId===id);
  if(d)return {...d.portrait,alive:d.alive};
  return byId(id)||(S.previousCourts||[]).slice().reverse().flatMap(c=>c.consorts).find(c=>c.id===id);
}
function householdLiving(k){return !!(k?.alive&&!k.removedFromRoyal&&k.married&&k.spouse?.alive!==false&&!k.jailed&&!k.gone&&!S.over);}
function householdActive(k){return householdLiving(k)&&!k.templeStay;}
function householdRecord(k,type,text){
  const h=ensureMarriedLife(k);if(!h)return;
  h.history.push({d:dateStr(),turn:S.turn,type,t:text});if(h.history.length>60)h.history.shift();
  princessMemory(k,type,text,k.away||k.princessMarriage==='frontier'?'府中来信':k.sex==='f'?'公主府':'皇子府');
}
function householdPeople(k){return [k.spouse,...(ensureMarriedLife(k)?.concubines||[])].filter(Boolean);}
function householdSummary(k){
  const h=k.household;if(!h||kidAge(k)<18||!k.married)return '';
  const children=[...h.children,...(k.recognizedChildren||[]).map(kidById).filter(Boolean)].filter(c=>c.alive!==false),sons=children.filter(c=>c.sex==='m').length;
  return `${sons}子${children.length-sons}女${h.pregnancies.length?' · 有喜':''}${h.concubines.length?' · 妾室'+h.concubines.length+'人':''}`;
}
function householdCanConceive(k,p){
  const woman=k.sex==='f'?k:p,h=ensureMarriedLife(k);
  return householdActive(k)&&p?.alive!==false&&kidAge(k)>=18&&kidAge(p)>=18&&kidAge(woman)<=45&&
    !p.away&&!p.jailed&&!p.gone&&!p.cold&&h.children.length+h.pregnancies.length<8&&!h.pregnancies.some(g=>g.mother===woman.id)&&
    S.turn-(h.lastBirthByMother[woman.id]??-99)>=18&&S.turn-(p.joinedAt??h.started)>=3&&(p.trust??k.spouse.trust)>=40;
}
function householdMotherName(k,p){return k.sex==='f'?k.name:(p.id===k.spouse.id?'正妻':'妾室')+p.name;}
function startHouseholdPregnancy(k,p){
  if(!householdCanConceive(k,p))return false;
  const h=ensureMarriedLife(k),woman=k.sex==='f'?k:p;
  const together=h.pregnancies.some(g=>g.conceived===S.turn),name=householdMotherName(k,p);
  h.pregnancies.push({mother:woman.id,father:k.sex==='m'?k.id:p.id,partner:p.id,conceived:S.turn,conceivedDate:dateStr(),due:S.turn+9});
  householdRecord(k,'household_pregnancy',`${together?'同月，':''}${name}${together?'亦':''}有喜，已分别安排照护，预期九个月后添丁。${together?'同一月里两处院落都传来喜讯，府中添了几分忙碌。':''}`);
  log(`${kidName(k)}府上报喜：${name}有孕。`,1);return true;
}
function deliverHouseholdChild(k,pregnancy){
  const h=ensureMarriedLife(k),p=householdPeople(k).find(p=>p.id===pregnancy.partner);
  if(!householdLiving(k)||!h.pregnancies.includes(pregnancy)||S.turn<pregnancy.due)return null;
  h.pregnancies=h.pregnancies.filter(x=>x!==pregnancy);
  const woman=k.sex==='f'?k:p;
  if(!woman||woman.alive===false||!p||p.alive===false||kidAge(k)<18||kidAge(p)<18)return null;
  const sex=chance(.5)?'m':'f',sur=k.sex==='m'?E().sur:p.sur;
  const names=sex==='m'?['景和','怀瑾','知远','承礼','允章','明谦','思齐','修宁']:['令仪','清嘉','舒窈','静姝','婉宁','含章','昭华','若兰'];
  const used=new Set(royalHouseholds().flatMap(r=>(r.household?.children||[]).map(c=>c.given)));
  const name=pick(names.filter(n=>!used.has(n)).length?names.filter(n=>!used.has(n)):names)+ (names.every(n=>used.has(n))?pick(sex==='m'?BOYC:GIV):'');
  const baby={id:`grand-${S.gen}-${k.id}-${h.children.length+1}`,courtGuest:true,name:sur+name,given:name,sur,sex,
    born:S.turn,alive:true,seed:ri(1,2e9),portraitVariant:ri(0,DESCENDANT_VARIANTS-1),
    mother:pregnancy.mother,motherName:woman.name,father:pregnancy.father,fatherName:k.sex==='m'?k.name:p.name,
    lit:clamp(k.lit*.5+(p.appearance?.talent||50)*.35+ri(0,10)),vir:clamp(k.vir*.5+(p.appearance?.virtue||50)*.35+ri(0,10)),mar:clamp(k.mar*.55+ri(4,20)),hp:ri(65,95),amb:ri(15,50)};
  h.children.push(baby);h.lastBirth=S.turn;h.lastBirthByMother[woman.id]=S.turn;
  householdRecord(k,'household_birth',`${householdMotherName(k,p)}平安诞下${sex==='m'?'一子':'一女'}，取名${baby.name}。现有${householdSummary(k)}。`);
  log(`${kidName(k)}府中添丁，${baby.name}降生。`,1);return baby;
}
const HOUSEHOLD_SCENES={
  tea:{title:'赌书分茶',
    match:(k,p)=>marriageNature(k).hobby==='books'||marriageNature(p).hobby==='books',
    text:(k,p)=>`${k.name}与${p.name}把书页夹好，约定猜中典故出处的人先饮茶。${marriageNature(p).temperament==='好胜'?'一人连输三回，索性要把题目换成自己熟悉的。':'一人记错页码，两人笑着翻检，却各有不肯服输的地方。'}`,
    choices:[['送来一部异本，让两人合校',6,3,'lit',3,'两人改为一同校书，各自的批注都留在了页边。'],['只夸答得最多的那一人',-5,-4,'lit',2,'答题的人得了夸奖，另一人却把茶盏放下了。']]},
  accounts:{title:'同看家用簿',match:()=>true,
    text:(k,p)=>`${k.name}想添一件珍玩，${p.name}却拿来这个月的用度簿。${marriageNature(p).spending==='节俭'?'对方在意的是积少成多，并非舍不得这一件东西。':'两人都想把府里布置得体面，却没人先算过今年还余多少。'}`,
    choices:[['帮他们定下共同预算',5,5,'vir',2,'两人议定日常用度各留一份，额外开销先商量。'],['赐银平账 · 国库−15',1,2,null,0,'府里的账暂时平了，往后的开销仍得两人自己商量。',15]]},
  outing:{title:'一封出游帖',match:(k,p)=>marriageNature(k).hobby==='riding'||marriageNature(p).hobby==='riding',
    text:(k,p)=>`${k.name}与${p.name}商量城郊出游。一人想骑马赶早，另一人想沿河慢行。${marriageNature(p).space==='需要独处'?'对方还想独自留半日，不愿时时跟在一处。':'对方盼着两人一起看完沿途的景色。'}`,
    choices:[['各留半日，再约好会合',6,5,'mar',2,'他们各做了喜欢的事，晚间见面时反而多了许多话。'],['按府中旧例安排同行',-2,1,'vir',1,'行程依例办妥，不过其中一人仍觉得没有被听见。']]},
  boundary:{title:'两家的礼单',match:()=>true,
    text:(k,p)=>`${p.name}家送来节礼，又附了一封求官的信。${k.name}把信压在礼单下，不想让一份亲情变成答应不了的人情。`,
    choices:[['收下家书，官职另循公议',5,4,'vir',3,'两人一起回了家书，把亲情与官职分开处理。'],['让其中一人独自回绝',-5,-3,null,0,'回信的人觉得自己独担了恶名，另一人也不知该怎样开口。']]},
  nursery:{title:'小儿初学步',match:k=>k.household.children.some(c=>c.alive&&kidAge(c)>=1&&kidAge(c)<=4),
    text:(k,p)=>`${k.name}与${p.name}争着教小儿走路。一个怕摔，一个怕护得太紧。孩子抱住椅脚，回头看看两人，偏不肯先迈步。`,
    choices:[['一起留出安全的空地，让孩子自己试',7,5,'vir',2,'两人一同蹲下等孩子走来，终于不再争谁的办法更好。'],['把教养交给一个人安排',-4,-2,null,0,'府里有了统一规矩，却有一个人被留在了孩子的日常之外。']]},
  repair:{title:'闭门后的回信',match:(k,p)=>(p.trust??60)<45,
    text:(k,p)=>`${k.name}与${p.name}近来只由下人传话。旧事没有说开，礼物送去也原样退回。${marriageNature(p).temperament==='敏感'?'对方记得的，正是上次在人前被轻轻带过的一句话。':'对方要的不是一份赏赐，而是以后遇事时能先听自己说完。'}`,
    choices:[['分别听完，再约一件能做到的小事',10,6,null,0,'两人先约定每天一起用一次饭，尚未尽释前嫌，却开始亲口说话。'],['命他们在人前和睦',-8,-5,null,0,'他们依礼谢恩，回府后仍是各自闭门。']]},
  keepsake:{title:'旧物留香',match:()=>true,
    text:(k,p)=>`${p.name}收起一件旧衣，${k.name}才知道那是离家时带来的。${marriageNature(p).temperament==='矜持'?'对方平时不提想家，这次却把旧物讲得很仔细。':'对方指着修补过的针脚，说起家中人从前的模样。'}`,
    choices:[['请两人各讲一件旧物的来历',6,4,null,0,'他们把两件旧物放在同一只匣子里，记住了彼此从前的生活。'],['赐新的，旧物仍由他们自己留存',3,2,null,0,'新物送到府中，旧衣也照原样留着。']]}
};
function makeHouseholdScene(k){
  const h=ensureMarriedLife(k);if(!householdActive(k)||!h||h.pending||S.turn-h.lastEvent<6)return null;
  const p=k.spouse;
  const candidates=Object.keys(HOUSEHOLD_SCENES).filter(id=>S.turn-(h.seen[id]??-99)>=24&&HOUSEHOLD_SCENES[id].match(k,p));
  if(!candidates.length)return null;
  const id=(p.trust<45&&candidates.includes('repair'))?'repair':pick(candidates);
  return h.pending={id,turn:S.turn};
}
function householdSceneEvent(k){
  const h=ensureMarriedLife(k),pending=h?.pending;if(!householdActive(k)||!pending)return null;
  const rule=HOUSEHOLD_SCENES[pending.id];if(!rule||!rule.match(k,k.spouse)){h.pending=null;return null;}
  const valid=()=>householdActive(k)&&h.pending===pending&&rule.match(k,k.spouse);
  return {title:rule.title,cast:[k,k.spouse],valid,ref:rule.ref,text:'小家送来一封家书。\n'+rule.text(k,k.spouse),choices:rule.choices.map(([t,trust,harmony,stat,gain,result,cost=0])=>({t,cond:()=>valid()&&E().energy>0&&E().treasury>=cost,why:'精力或国库不足',f:()=>{
    if(!valid()||E().energy<=0||E().treasury<cost)return null;
    E().energy--;E().treasury-=cost;h.pending=null;h.lastEvent=S.turn;h.seen[pending.id]=S.turn;
    k.spouse.trust=clamp(k.spouse.trust+trust);h.harmony=clamp((h.harmony??60)+harmony);if(stat)k[stat]=clamp(k[stat]+gain);
    householdRecord(k,'household_scene',rule.title+'：'+result);h.echo={due:S.turn+2,text:result,trust:trust>0?2:0};save('auto');
    return result+fx(`夫妻信任${trust>=0?'+':''}${trust} · 精力−1${cost?' · 国库−'+cost:''}`);
  }})).concat([{t:'先由两人自己商量',f:()=>{if(!valid())return null;h.pending=null;h.lastEvent=S.turn;h.seen[pending.id]=S.turn;householdRecord(k,'household_scene',rule.title+'：陛下听过双方想法，留给两人自己商量。');save('auto');return '你没有替他们定夺，仍请两人有话当面说。';}}])};
}
function recordHouseholdNews(k){
  const h=ensureMarriedLife(k),p=k.spouse;if(!householdActive(k))return;
  const mother=householdMother(k),near=!k.away&&k.princessMarriage!=='frontier';
  const fit=marriageFit(k,p),good=p.trust>=55;
  const choices=[
    {id:'supper',delta:good?3:-2,text:good?`${k.name}与${p.name}约好每日留一顿饭一起用，忙时也提前捎话，近来渐有默契。`:`${k.name}与${p.name}各忙各的，接连几日错过用膳时辰。两人都觉得被冷落，却还没把话说开。`},
    {id:'space',delta:fit.common.includes('相处节奏合拍')?3:1,text:fit.common.includes('相处节奏合拍')?`${k.name}与${p.name}在窗下各做各的事，偶尔说一句，也觉得自在。`:`${k.name}想有人相伴，${p.name}却想留些独处的工夫。两人商量先各留半日，再一起用晚膳。`},
    {id:'habits',delta:2,text:`${p.name}将自己的起居习惯说给${k.name}听，两人改了几处府中安排，少了些无谓的猜测。`}
  ];
  if(fit.common.includes('兴趣相投'))choices.push({id:'shared',delta:4,text:`${k.name}与${p.name}同好${COUPLE_HOBBIES[marriageNature(k).hobby]}，近日腾出一角小室，各把心爱的东西放在一处。`});
  if(p.trust<45)choices.push({id:'silence',delta:-2,text:`${k.name}与${p.name}有了分歧，偏偏都不肯先开口。家书里只写平安，字句间却有些疏远。`});
  if(mother?.alive&&!mother.gone&&!mother.cold)choices.push({id:'mother',delta:2,text:near?`${k.name}与${p.name}请安时陪${cName(mother)}说了家常。母亲问起衣食，两人各答了一半，离去时还带了一包点心。`:`${k.name}与${p.name}一同给${cName(mother)}写了家书，把小家近来的安稳说给母亲听。`});
  if(mother?.alive&&(mother.cold||mother.gone))choices.push({id:'separated-mother',delta:good?2:0,text:`${k.name}挂念处境艰难的母亲，${p.name}${good?'听完牵挂，陪着把问安的信写好，等候许可递送。':'一时不知如何安慰，只陪着静坐了一会儿。'}`});
  if(p.fatherName)choices.push({id:'inlaws',delta:2,text:`${p.fatherName}家来信问安，${p.name}与${k.name}一同回信。两家旧习不同，他们把节礼的轻重提前商量清楚。`});
  if(h.children.length){const baby=h.children.find(c=>c.alive!==false);if(baby)choices.push({id:'child',delta:3,text:kidAge(baby)<1?`${k.name}与${p.name}轮流照看${baby.name}，才发觉小儿一个笑容也能让两人说上半日。`:`${baby.name}渐渐有了自己的脾气。${k.name}与${p.name}起初各有教法，后来约好先听孩子说完。`});}
  if(h.pregnancies.length)choices.push({id:'expecting',delta:3,text:`小家近来为将添的孩子收拾起居。${k.name}与${p.name}把旁的安排放慢，先顾好饮食与休息。`});
  const news=pick(choices.filter(n=>n.id!==h.lastNewsKind));h.lastNewsKind=news.id;
  p.trust=clamp(p.trust+news.delta);h.harmony=clamp((h.harmony??60)+news.delta);
  householdRecord(k,'household_daily',news.text);
}
function marriedLifeTick(){
  if(S.over)return;
  for(const k of royalHouseholds()){
    const h=ensureMarriedLife(k);if(!h||h.lastTick===S.turn)continue;h.lastTick=S.turn;
    if(!householdLiving(k)){h.pending=null;h.pregnancies=[];continue;}
    for(const p of [...h.pregnancies])if(S.turn>=p.due)deliverHouseholdChild(k,p);
    if(!householdActive(k)){h.pending=null;continue;}
    if(h.echo&&S.turn>=h.echo.due){k.spouse.trust=clamp(k.spouse.trust+h.echo.trust);householdRecord(k,'household_echo','两个月后，府中回信：'+h.echo.text);delete h.echo;}
    if(h.project&&S.turn>=h.project.due){const project=h.project;delete h.project;k[project.stat]=clamp(k[project.stat]+4);k.spouse.trust=clamp(k.spouse.trust+5);householdRecord(k,'household_project',project.title+'办成，两人各自做了擅长的一部分。');}
    if(S.turn>=h.nextNews){recordHouseholdNews(k);h.nextNews=S.turn+ri(4,7);}
    // Keep the household roll rare; a second eligible partner can conceive in the same month.
    const partners=householdPeople(k).filter(p=>householdCanConceive(k,p));
    if(partners.length&&chance(.045)){
      const first=pick(partners);startHouseholdPregnancy(k,first);
      const others=partners.filter(p=>p!==first&&householdCanConceive(k,p));
      if(others.length&&chance(.15))startHouseholdPregnancy(k,pick(others));
    }
  }
  if(S.turn-(S.flags.lastHouseholdScene??-99)<4)return;
  const options=royalHouseholds().filter(k=>householdActive(k)&&!ensureMarriedLife(k).pending&&S.turn-k.household.lastEvent>=6);
  if(options.length&&chance(.35)){const k=pick(options);if(makeHouseholdScene(k))S.flags.lastHouseholdScene=S.turn;}
}
function householdConcubineReason(k){
  if(!householdActive(k)||k.sex!=='m')return '当前不能商议纳妾';
  if(kidAge(k)<18||kidAge(k.spouse)<18)return '皇子与正妻均满十八岁后可商议';
  const h=ensureMarriedLife(k);
  if(h.concubines.length>=2)return '已有两位妾室';
  const last=h.lastConcubine,remaining=Math.max(0,24-(S.turn-(last??h.started??k.spouse.marriedAt)));
  return remaining?(last==null?'新婚安顿中':'距上次商议未满两年')+' · 还需'+remaining+'个月':'';
}
function householdPanel(k){
  const h=ensureMarriedLife(k);if(!h||kidAge(k)<15)return '';
  const p=k.spouse,fit=marriageFit(k,p),adult=kidAge(k)>=18&&kidAge(p)>=18,concubineReason=householdConcubineReason(k);
  const pregnant=adult?h.pregnancies.map(g=>{const person=g.mother===k.id?k:householdPeople(k).find(p=>p.id===g.mother);return person?`${esc(k.sex==='f'?k.name:householdMotherName(k,person))}有孕 · ${Math.min(10,S.turn-g.conceived+1)}个月`:'';}).filter(Boolean):[];
  return `<section class="household-panel"><h3>婚后家事</h3><p>${esc(p.name)} · ${esc(marriageNature(p).temperament)} · ${esc(COUPLE_HOBBIES[marriageNature(p).hobby])} · ${esc(marriageNature(p).spending)}</p>
    <p class="hint">${esc(fit.common.join('、')||'各有所长')}；${esc(fit.different.join('；')||'相处习惯较为接近')}。</p>
    ${bar('夫妻信任',p.trust,'#936375')}${bar('府中和睦',h.harmony??60,'#517369')}
    ${adult?`<p><strong>${esc(householdSummary(k))}</strong> · ${pregnant.length?pregnant.join('；'):'暂无孕信'}</p>`:''}
    ${h.concubines.length?`<p>妾室：${h.concubines.map(p=>esc(p.name)+'（'+esc(marriageNature(p).temperament)+'）').join('、')}</p>`:''}
    ${h.project?`<p class="hint">${esc(h.project.title)} · 预计${Math.max(0,h.project.due-S.turn)}个月后有回音</p>`:''}
    ${h.pending?`<p class="initiative-note">府中近况：${esc(HOUSEHOLD_SCENES[h.pending.id]?.title||'待询问')}</p>`:''}
    ${householdActive(k)?`<div class="acts"><button class="btn jade" onclick="A.householdVisit(${k.id})">${k.away||k.princessMarriage==='frontier'?'读府中来信':'探望小家'} →</button><button class="btn" onclick="A.householdProject(${k.id})" ${h.project||S.turn-(h.lastProject??-99)<12?'disabled':''}>帮两人办件事</button>${adult&&k.sex==='m'?`<button class="btn" onclick="A.householdConcubine(${k.id})" title="${esc(concubineReason||'先听皇子的想法，再决定是否准许纳妾')}" ${concubineReason?'disabled':''}>询问皇子纳妾意愿${concubineReason?`<small>${esc(concubineReason)}</small>`:''}</button>`:''}</div>`:''}
    ${adult&&h.children.length?`<div class="household-children">${h.children.map(c=>`<article>${porImg(c,56)}<div><strong>${esc(c.name)}</strong><small>${kidAge(c)}岁 · ${c.sex==='m'?'子':'女'} · 生母${esc(c.motherName)}</small></div></article>`).join('')}</div>`:''}
    ${h.history.length?`<ul class="story">${h.history.slice(-5).reverse().map(e=>`<li><time>${esc(e.d)}</time>${esc(e.t)}</li>`).join('')}</ul>`:''}</section>`;
}
A.householdVisit=function(id){
  const k=royalById(id);if(modalOpen||!householdActive(k))return;
  const h=ensureMarriedLife(k);if(!h.pending)makeHouseholdScene(k);
  const ev=householdSceneEvent(k);
  if(ev)pushEv(ev);else pushEv({title:'府中日常',cast:[k,k.spouse],text:`${k.name}与${k.spouse.name}近来平静度日。${h.project?'两人还在筹办'+h.project.title+'。':'府中没有新事请你定夺。'}`,choices:[{t:'让他们安心过日子'}]});save('auto');
};
A.householdProject=function(id){
  const k=royalById(id);if(modalOpen||!householdActive(k))return;
  const h=ensureMarriedLife(k),valid=()=>householdActive(k)&&!h.project&&S.turn-(h.lastProject??-99)>=12;
  if(!valid())return;
  pushEv({title:'一同经营的小事',cast:[k,k.spouse],valid,text:marriageProfileText(k,k.spouse)+'\n拨银十万两，两人会用三个月共同完成。',choices:[
    ...[['共校一册家藏书','lit'],['整理骑场与花径','mar'],['合办一场家宴','vir']].map(([title,stat])=>({t:title+' · 国库−10',cond:()=>valid()&&E().treasury>=10,f:()=>{if(!valid()||E().treasury<10)return null;E().treasury-=10;h.project={title,stat,due:S.turn+3};h.lastProject=S.turn;householdRecord(k,'household_project',`两人开始${title}，预期三个月完成。`);save('auto');return '府中已经着手安排，日后会有回信。';}})),{t:'暂不安排'}]});
};
A.householdConcubine=function(id){
  const k=royalById(id),h=ensureMarriedLife(k);
  const valid=()=>!householdConcubineReason(k);
  if(modalOpen||!h||!valid())return;
  const wishes=marriageNature(k),will=k.amb>=55||wishes.temperament==='好胜'||wishes.temperament==='爽朗';
  if(!will){pushEv({title:'府中纳妾之议',cast:[k,k.spouse],text:`${k.name}说，眼下更愿与${k.spouse.name}安稳度日，并无纳妾之意。`,choices:[{t:'尊重他的意思',f:()=>{h.lastConcubine=S.turn;householdRecord(k,'household_concubine','谈起纳妾，自己表示无意，陛下未加催促。');save('auto');}}]});return;}
  if(!h.concubineCandidate){
    const appearance=makeGirl({age:ri(18,24)});h.concubineCandidate={id:'partner-'+k.id+'-'+(h.concubines.length+1),courtGuest:true,sex:'f',name:fullName(appearance),sur:appearance.sur,seed:appearance.seed,born:S.turn-appearance.age*12,alive:true,appearance,trust:55};
  }
  const p=h.concubineCandidate,nature=marriageNature(k.spouse),loss=['好胜','敏感'].includes(nature.temperament)?20:10;
  pushEv({title:'府中纳妾之议',cast:[k,k.spouse,p],valid,text:`${k.name}提起${p.name}，对方已成年，自愿入府。\n嫡妻${k.spouse.name}${loss===20?'直言不愿，问旧日约定是否还算数。':'虽愿听完安排，仍盼自己的处境不被轻轻带过。'}\n纳妾需国库二十万两，嫡妻信任将下降${loss}。`,choices:[
    {t:'准其纳妾 · 国库−20',cond:()=>valid()&&E().treasury>=20,f:()=>{if(!valid()||E().treasury<20)return null;E().treasury-=20;p.joinedAt=S.turn;h.concubines.push(p);delete h.concubineCandidate;h.lastConcubine=S.turn;k.spouse.trust=clamp(k.spouse.trust-loss);h.harmony=clamp((h.harmony??60)-12);householdRecord(k,'household_concubine',`纳${p.name}入府为妾；嫡妻${k.spouse.name}心有不快，信任下降${loss}。`);save('auto');return '人已入府，夫妻之间的分歧也留了下来。';}},
    {t:'暂缓，先由夫妻把话说清楚',f:()=>{if(!valid())return null;h.lastConcubine=S.turn;k.spouse.trust=clamp(k.spouse.trust+4);householdRecord(k,'household_concubine','纳妾之议暂缓，先与嫡妻谈清彼此的想法。');save('auto');return '名帖暂且收起，府中没有添人。';}}
  ]});
};
