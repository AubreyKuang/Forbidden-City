/* The dowager remembers actual births, losses, visits and publicly established facts. */
const dowagerLivingActive=()=>!!S&&!PalaceActions.blocked&&journalContentVersion()>=24;
function dowagerLiving(d=ensureDowager()){
 if(!d)return null;
 if(!d.household||d.household.gen!==S.gen)d.household={gen:S.gen,seen:{},news:[],bonds:{},publicCases:{},lastTick:-1};
 d.story ||= [];d.mood ??= 65;return d.household;
}
function dowagerBond(c,d=ensureDowager()){
 if(!c||!d)return 0;
 const saved=d.household?.bonds?.[c.id];if(saved)return saved.score;
 return clamp(48+(c.clan===d.clan?22:0)+(stanceOf(c)==='dowager'?10:0)+(['温婉','持重','沉静'].includes(c.trait)?12:0)-(['骄纵','善妒','城府'].includes(c.trait)?18:0));
}
function changeDowagerBond(c,delta,d=ensureDowager()){
 const h=dowagerLiving(d),b=h.bonds[c.id]||={score:dowagerBond(c,d),visits:0};b.score=clamp(b.score+delta);return b;
}
const dowagerBondLabel=(c,d)=>dowagerBond(c,d)>=65?'亲近':dowagerBond(c,d)<=40?'有些疏隔':'守礼往来';
function dowagerRecord(d,title,text){
 d.story ||= [];story(d,`【${title}】${text}`);
 const id=d.personId||`dowager-${S.gen}`;
 NPCMemory.record(S,{type:'dowager-family',time:S.turn,participants:[id],outcome:text},[{person:id,subject:id,interpretation:text,emotion:d.mood<40?-.5:.3,impact:65}]);
}
function dowagerNews(d,news){
 const h=dowagerLiving(d);if(h.seen[news.key])return;
 h.seen[news.key]=true;h.news.push({...news,turn:S.turn});
}
function dowagerFamilyChanges(previous){
 if(!dowagerLivingActive())return;
 const d=ensureDowager();if(!d?.alive)return;const h=dowagerLiving(d);
 for(const c of S.consorts){
  const before=previous?.consorts?.find(x=>x.id===c.id);
  if(c.alive!==false||c.clan!==d.clan||h.seen['death:'+c.id])continue;
  const recent=recentRecoveryStory(c,/薨逝|血崩|香消|病逝|身亡|被赐死|去世/,6);
  if(!before?.alive&&recent===null)continue;
  dowagerNews(d,{key:'death:'+c.id,kind:'death',person:c.id,reason:c.deathReason||c.deathRecord?.cause||'离世'});
  d.mood=clamp(d.mood-25);d.feeling={kind:'悲恸',person:c.id,turn:S.turn};
  dowagerRecord(d,'母家失亲',`得知母家晚辈${fullName(c)}${c.deathReason?'因'+c.deathReason+'离世':'去世'}，她沉默良久，收起给晚辈留着的点心，想起往日相见。`);
  story(c,`【身后家人】太后得知她离世，悲恸不已，慈宁宫留着她曾用过的茶盏。`);
 }
 const groups=new Map();
 for(const k of S.children){if(!k.alive||k.pendingName||k.removedFromRoyal||k.lost||S.turn-k.born<0||S.turn-k.born>3)continue;
  const key=`birth:${k.mom}:${k.born}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(k);
 }
 for(const [key,kids] of groups){const m=byId(kids[0].mom);if(!m||!m.alive)continue;
  dowagerNews(d,{key,kind:'birth',person:m.id,children:kids.map(k=>k.id)});
 }
 // Public findings may arrive months after the loss; grief and the later report are separate memories.
 for(const x of palaceCases()){
  const c=byId(x.victim),fact=h.publicCases[x.id];
  if(!c||c.alive||c.clan!==d.clan||!fact||x.withheld||x.status!=='solved')continue;
  if(!(x.fatal||c.deathRecord?.caseId===x.id))continue;
  dowagerNews(d,{key:'justice:'+x.id,kind:'justice',person:c.id,caseId:x.id});
 }
}
function dowagerVisitReady(c){return inPalace(c)&&!c.maid&&(c.hp??100)>=55&&c.preg<7&&!consortRecovery(c)&&!(c.illnessRecovery&&S.turn<c.illnessRecovery.until);}
function prepareDowagerCompany(d){
 const h=dowagerLiving(d);if(!d.alive)return {turn:S.turn,people:[]};if(h.company?.turn===S.turn)return h.company;
 h.company={turn:S.turn,people:[]};const busy=dowagerRumorActive(d);
 if(mourningActive()||S.turn<(h.quietUntil??0)||!chance(busy?.85:.38))return h.company;
 const people=harem().filter(c=>dowagerVisitReady(c)&&(c.rank===8||c.clan===d.clan||dowagerBond(c,d)>=65||busy&&(!['淡泊','沉静'].includes(c.trait)||chance(.2))));
 if(!people.length)return h.company;
 h.company.people=[pick(people).id];
 if(people.length>1&&chance(busy?.8:.22))h.company.people.push(pick(people.filter(c=>c.id!==h.company.people[0])).id);
 if(busy){h.rumor.visits+=h.company.people.length;h.rumor.crowdedAt=S.turn;}
 noteDowagerCompany(d,h.company.people.map(byId));return h.company;
}
function dowagerCompanyPeople(d){return (d.household?.company?.turn===S.turn?d.household.company.people:[]).map(byId).filter(dowagerVisitReady);}
function noteDowagerCompany(d,people){
 for(const c of people){if(d.household.bonds[c.id]?.lastVisit===S.turn)continue;const b=changeDowagerBond(c,2,d);b.lastVisit=S.turn;b.visits++;
  const line=`${fullName(c)}到慈宁宫${c.rank===8?'问安，谈起宫中起居':'陪太后坐坐，说起日常琐事'}。${dowagerRumorActive(d)?['骄纵','善妒','城府'].includes(c.trait)?'听说此处曾偶遇圣驾，她也多留意了一眼殿门。':'宫中传言此处常遇圣驾，她听过，却仍先向太后问安。':''}`;
  story(c,'【慈宁宫往来】'+line);dowagerRecord(d,'有人相伴',line);
 }
}
function dowagerQueenWork(q){
 return (q.story||[]).slice(-35).findLast(s=>/安排掌事女官|核对.*用度|主持.*宫务|核对功劳|查验筹备|料理.*六宫/.test(s.t)&&
  recentRecoveryStory({story:[s]},/./,6)!==null)?.t||null;
}
function dowagerCompanyEvent(d,people){
 const personalLines=new Map();
 const descriptions=people.map(c=>{
  const bond=dowagerBond(c,d),visits=d.household.bonds[c.id]?.visits||0,work=c.rank===8&&dowagerQueenWork(c);
  if(c.rank===8){
   const personal=storyQueenDowagerDialogue(c,d,bond);if(personal){personalLines.set(c.id,personal);return personal;}
   if(bond>=65&&work)return `太后看着${fullName(c)}说：“皇后近来${work.includes('新人')||work.includes('认路')?'照料新人、核对用度':'料理宫中事务'}，这些操劳哀家看见了。你也别只顾公务，得空来坐坐。”`;
   if(bond<=40)return `皇后${fullName(c)}依礼问安。太后与她说话仍有些生分：${work?'“这件宫务办得妥，照章料理便好。”':'“中宫自有职责，今日既来了，坐下喝杯茶罢。”'}皇后应了一声，接过宫人递来的温茶。`;
   return `皇后${fullName(c)}陪太后说起宫中起居。太后说：“你肯来听哀家说几句，便很好。六宫的事慢慢说，先让茶温一温。”`;
  }
  return `太后提起${fullName(c)}：“${c.clan===d.clan?'这是哀家母家的孩子，':bond>=65?'这孩子与哀家投缘，':'平日来往不算多，'}${visits>=3?'平日这里清静，多亏她常来陪哀家说话。':'今日肯来陪哀家坐坐，屋里也热闹些。'}${bond<=40?'性子虽未必事事合拍，肯坐下来好好说话，总比疏远了强。':'家常慢慢说，茶还温着。'}”`;
 });
 let done=false;const valid=()=>!done&&d.alive&&people.every(dowagerVisitReady);
 return trackDowagerTalk(d,{title:'慈宁宫 · 茶席有伴',por:dowagerPerson(d),cast:people,present:people,valid,
  text:`你到慈宁宫时，${people.map(fullName).join('、')}也在。宫人添上一盏茶。\n${descriptions.join('\n')}`,
  onShow:()=>{noteDowagerCompany(d,people);startDowagerRumor(d,people);if(journalContentVersion()>=100){for(const c of people){const line=personalLines.get(c.id);if(line){story(c,'【慈宁宫相谈】'+line);dowagerRecord(d,'与皇后相谈',line);}}}},choices:[
   {t:'坐下一同说说话',f:()=>{if(!valid())return null;done=true;d.mood=clamp(d.mood+5);for(const c of people){changeDowagerBond(c,3,d);story(c,`【慈宁宫同坐】与陛下、太后一同喝茶，太后谈起${c.rank===8?'中宫往来与起居':'自己陪伴她的情分'}。`);cchg(c,{mood:4});}const text='你坐下来听她们说话，茶添了两回，窗下的笑声才渐渐歇下。';dowagerRecord(d,'茶席同坐',people.map(fullName).join('、')+'与皇帝留下相伴。');return text;}},
   {t:'让她们继续陪母后，先告退',f:()=>{if(!valid())return null;done=true;dowagerRecord(d,'茶席相伴',`皇帝问安后告退，${people.map(fullName).join('、')}仍留下说话。`);return '你问候过众人，留她们自在说话。';}}
  ]},'company',{months:2});
}
function dowagerNewsEvent(d,n){
 const h=dowagerLiving(d),c=byId(n.person);if(!c||n.discussed)return null;
 const kids=(n.children||[]).map(kidById).filter(k=>k?.alive&&!k.pendingName),x=n.caseId&&palaceCases().find(x=>x.id===n.caseId),fact=x&&h.publicCases[x.id],a=x&&byId(x.culprit);
 if(n.kind==='birth'&&(!c.alive||!kids.length))return null;
 if(n.kind==='justice'&&(!fact||x.withheld||x.status!=='solved'))return null;
 const kin=c.clan===d.clan,names=kids.map(kidName).join('、');
 let title,text;
 if(n.kind==='birth'){title='新添的孩子';text=`太后说：“${fullName(c)}近来添了${names}，哀家听了欢喜。${kin?'她也是母家的孩子，哀家既惦记小的，也惦记她。':''}别只顾看孩子，也问问她产后歇得好不好。${kids.length>1?'几个孩子一起照应，乳母与宫人的人手更要安排妥当。':''}男孩女孩都是家里的孩子，平安长大便好。”`;}
 else if(n.kind==='justice'){title='旧案与母家';text=`太后屏退旁人，提起${fullName(c)}，眼眶仍红着：“${x.crime}已查明是${a?fullName(a):'案中主使'}所为。${a?'她害了人，怎还能只拿争宠两字轻轻带过？':''}哀家失了一个晚辈，不是为了家族颜面才来多嘴。”\n${fact.penalty?`先前已有处置：${fact.penalty}。太后仍难平复，重提此事不另加一遍刑罚。`:'她请你依原案问责，不愿只听一句不了了之。'}`;}
 else{title='母家旧人';const children=S.children.filter(k=>k.alive&&k.mom===c.id&&!k.pendingName&&!k.removedFromRoyal);text=`太后提起${fullName(c)}，话说到一半便停了：“她${n.reason==='离世'?'已经不在了':'因'+n.reason.replace(/^因/,'')+'去了'}。那孩子进宫时的模样，哀家还记得。${children.length?'留下的'+children.map(kidName).join('、')+'，往后更要有人仔细照看。':'给她留的那只茶盏，哀家还没舍得收。'}”\n她低头摩挲杯沿，许久没有再开口。`;}
 let done=false;const valid=()=>!done&&d.alive&&!n.discussed&&(n.kind!=='birth'||c.alive&&kids.every(k=>k.alive));
 const finish=mode=>{if(!valid())return null;done=true;n.discussed=true;n.discussedAt=S.turn;
  const outcome=mode==='birth'?`皇帝听太后惦记${names}与生母${fullName(c)}，派人传达问候，照例安排产后照料。`:mode==='justice'?`皇帝听太后重提${fullName(c)}的已公开案情，答应依原案处理。`:`皇帝陪太后悼念${fullName(c)}，让她慢慢讲起旧事。`;
  dowagerRecord(d,title,outcome);d.mood=clamp(d.mood+(mode==='birth'?6:3));
  if(mode==='birth'){story(c,`【太后问候】太后向陛下问起${names}与自己的产后起居，陛下遣人传达问候。`);for(const k of kids)kstory(k,'太后在慈宁宫惦念初生的自己，也叮嘱照顾生母。');cchg(c,{mood:5});}
  return outcome;
 };
 const choices=[{t:n.kind==='birth'?'代母后传个问候，照料母亲与孩子':n.kind==='justice'?'听她说完，依原案处置':'陪母后悼念，听她说说旧事',f:()=>finish(n.kind)}];
 if(n.kind==='justice'&&!fact.penalty&&a?.alive&&!a.gone)choices.push({t:'依已查明的原案传她问话',f:()=>{if(!valid())return null;finish('justice');pushNow(punishEv(a,c,x.crime));return null;}});
 if(n.kind==='death'){const unresolved=palaceCases().find(k=>k.victim===c.id&&caseReady(k)&&(k.fatal||c.deathRecord?.caseId===k.id));
  if(unresolved&&jinyiweiCommanderReady())choices.push({t:'将她身后的疑案交锦衣卫继续查证 · 精力−1 · 国库−15',cond:()=>caseReady(unresolved)&&E().energy>=1&&E().treasury>=15,why:'需有可查的旧案、在任指挥使与足够精力国库',f:()=>{if(!valid()||!caseReady(unresolved)||!jinyiweiCommanderReady()||E().treasury<15||!useE())return null;finish('death');chg({treasury:-15});dispatchCase(unresolved,15);dowagerRecord(d,'请查旧案','请皇帝查清'+fullName(c)+'身后的疑案，尚未指认主使。');return '缇骑循原案查访，尚未查实前不凭私怨指认凶手。';}});
 }
 return trackDowagerTalk(d,{title:'慈宁宫 · '+title,por:dowagerPerson(d),present:[],valid,text,choices},n.key,{months:9999});
}
function dowagerFavoriteComment(d){
 const c=harem().filter(c=>c.age>=18&&c.favor>=45).sort((a,b)=>b.favor-a.favor)[0];if(!c)return null;
 const bond=dowagerBond(c,d),liked=bond>=65,disliked=bond<=40;
 const line=liked?`她确有让人喜欢的地方，${['温婉','持重','沉静'].includes(c.trait)?'待人周全，肯听旁人说话':'与哀家相处时也肯用心'}。你喜欢她，哀家明白。只是她自己的日子，也不必时时围着恩宠转。`:disliked?`${['骄纵','善妒'].includes(c.trait)?'她性子急，遇事还容易使性子':'哀家与她相处还不投契，有些处事也未必看得惯'}。你莫一味纵着，多给她些历练，也少些独宠，别叫她只听得进好话。`:'她眼下得宠，哀家也留意着。尚未十分相熟，不急着说好坏；你多看她怎样待人，也别忘了宫中旁人的日子。';
 let done=false;const valid=()=>!done&&d.alive&&inPalace(c);
 return trackDowagerTalk(d,{title:'慈宁宫 · 说起得宠的人',por:dowagerPerson(d),present:[],valid,text:`太后私下提起近来得宠的${fullName(c)}：“${line}”`,choices:[
  {t:liked?'谢母后体谅，自己也留意分寸':'听取提醒，也会亲自了解她',f:()=>{if(!valid())return null;done=true;dowagerRecord(d,'谈及恩宠',`向皇帝谈及${fullName(c)}：${line} 皇帝听取意见，没有把私人好恶直接作罪名。`);return '你记下她的看法，仍保留自己了解当事人的余地。';}},
  {t:'说明她的长处，盼母后多相处再看',f:()=>{if(!valid())return null;done=true;changeDowagerBond(c,2,d);dowagerRecord(d,'留待相知',`皇帝为${fullName(c)}说起长处，她愿意多相处再判断，却未因一次劝说立刻改观。`);return '太后听完，答应不凭一时印象断人，彼此的疏近仍须实际相处。';}}
 ]},'favorite-comment:'+c.id,{months:8});
}
const livingDowagerEvent=dowagerEvent;
dowagerEvent=function(){
 if(!dowagerLivingActive())return livingDowagerEvent();
 const d=ensureDowager();if(!d?.alive)return null;dowagerFamilyChanges();const h=dowagerLiving(d);
 const loss=h.news.find(n=>!n.discussed&&(n.kind==='death'||n.kind==='justice'));
 if(loss){const ev=dowagerNewsEvent(d,loss);if(ev)return ev;}
 if(d.conversations?.lastTurn===S.turn||S.month===9)return livingDowagerEvent();
 const crowd=dowagerCrowdEvent(d);if(crowd)return crowd;
 const question=dowagerDaoEvent(d);if(question)return question;
 const births=h.news.filter(n=>n.kind==='birth'&&!n.discussed&&S.turn-n.turn<=4);
 if(births.length&&chance(.65)){for(const n of births){const ev=dowagerNewsEvent(d,n);if(ev)return ev;}}
 prepareDowagerCompany(d);const people=dowagerCompanyPeople(d);
 if(people.length){const ev=dowagerCompanyEvent(d,people);if(ev)return ev;}
 if(chance(.3)){const ev=dowagerFavoriteComment(d);if(ev)return ev;}
 return livingDowagerEvent();
};
const livingDowagerTick=dowagerTick;
dowagerTick=function(){livingDowagerTick();if(!dowagerLivingActive())return;const d=ensureDowager();if(!d?.alive)return;const h=dowagerLiving(d);if(h.lastTick===S.turn)return;h.lastTick=S.turn;
 if(d.feeling?.kind==='悲恸'&&S.turn-d.feeling.turn>12)d.feeling.kind='思念';
 prepareDowagerCompany(d);dowagerCrowdTick(d);dowagerDaoTick(d);
 if(journalContentVersion()>=124)ciningAuntVisitTick(d,h);
 if(journalContentVersion()>=127){
   for(const k of S.children.filter(ciningOutsideChild))offerCiningMotherVisit(k);
 }
};
const livingPunishEvent=punishEv;
punishEv=function(a,v,crime){
 const ev=livingPunishEvent(a,v,crime);if(!dowagerLivingActive()||!v)return ev;
 const previous=ev.onShow;ev.onShow=()=>{previous?.();const d=ensureDowager();if(!d?.alive)return;
  const x=palaceCases().findLast(x=>x.kind==='harem'&&x.culprit===a.id&&x.victim===v.id&&x.crime===crime)||openPalaceCase({kind:'harem',title:crime,crime,culprit:a.id,victim:v.id});
  x.status='solved';x.solvedTurn=S.turn;x.withheld=false;
  const h=dowagerLiving(d);if(!h.publicCases[x.id]){h.publicCases[x.id]={turn:S.turn,culprit:a.id,victim:v.id,crime};changeDowagerBond(a,-35,d);}
 };
 for(const choice of ev.choices){if(!choice.f)continue;const f=choice.f;choice.f=function(...args){const result=f.apply(this,args),d=ensureDowager();if(d?.alive){const x=palaceCases().findLast(x=>x.kind==='harem'&&x.culprit===a.id&&x.victim===v.id&&x.crime===crime),fact=x&&dowagerLiving(d).publicCases[x.id];if(fact)fact.penalty=choice.t;}return result;};}
 return ev;
};
// A fatal outcome belongs to the actual selected incident, not any old dispute with the same victim.
for(let i=0;i<HAREM.length;i++){const create=HAREM[i];const wrapped=(...args)=>{const ev=create(...args);if(!ev||!dowagerLivingActive())return ev;const spec=PALACE_CASE_EVENTS[ev.title],v=spec?.victim(ev);if(!v)return ev;
 for(const choice of ev.choices){if(!choice.f)continue;const f=choice.f;choice.f=function(...args){const alive=v.alive,result=f.apply(this,args);if(alive&&!v.alive){const a=spec.culprit(ev),x=palaceCases().findLast(x=>x.kind==='harem'&&x.culprit===a.id&&x.victim===v.id&&x.crime===spec.crime)||openPalaceCase({kind:'harem',title:ev.title,crime:spec.crime,culprit:a.id,victim:v.id});x.fatal=true;v.deathRecord={...(v.deathRecord||{}),caseId:x.id};}return result;};}return ev;};Object.defineProperty(wrapped,'name',{value:create.name});HAREM[i]=wrapped;}
const livingDowagerPanel=dowagerCourtPanel;
dowagerCourtPanel=function(){const html=livingDowagerPanel();if(!dowagerLivingActive())return html;const d=ensureDowager();if(!d)return html;
 const company=d.alive?dowagerCompanyPeople(d):[],recent=(d.story||[]).slice(-6).reverse();
 return html+(d.feeling?`<p>心境：${esc(d.feeling.kind)} · 念及${esc(fullName(byId(d.feeling.person)||{sur:'',given:'旧人'}))}</p>`:'')+(company.length?`<p>本月慈宁宫来往：${company.map(c=>`<button class="person-link" onclick="A.go('consort',${c.id})">${esc(fullName(c))}</button>（${dowagerBondLabel(c,d)}）`).join('、')}</p>`:'')+(recent.length?detailSection('慈宁宫纪事',`<ul class="story">${recent.map(s=>`<li><time>${esc(s.d)}</time>${esc(s.t)}</li>`).join('')}</ul>`):'');
};

// A stop in the children's rooms follows the audience, including any business the dowager raised.
function ciningOutsideChild(k){
  return !S.over&&raisedByDowager(k)&&k.outsideFamilyOrigin&&S.heir!==k.id&&
    !k.pendingName;
}
function canVisitCiningChild(k){
  return ciningOutsideChild(k)&&k.dowagerUpbringing.lastVisit!==S.turn;
}
function ciningChildKin(k){
  const origin=k.outsideFamilyOrigin,host=familyHostById(origin.host);
  const relative=host&&natalEntry(host.id,origin.motherId)?.p;
  const mother=byId(relative?.consortId)||byId(origin.motherId)||relative;
  const aunt=familyHostById(origin.auntId)||outsideChildAunt(host,relative,k.id);
  return {mother,aunt:aunt!==mother&&inPalace(aunt)?aunt:null};
}
function ciningLongingMonths(k){
  const care=k.dowagerUpbringing;
  if(care.longingMonths)return care.longingMonths;
  // Published chronicles already tell us which visits involved missing home.
  const months=[];
  const known=/^【(慈宁宫探望|姨母探望)】.*(旧日的摇篮调|娘也知道我住在这里吗|给娘捎个信|哼起娘亲常唱的小调|娘想我的时候|那年她教我打的结)/;
  const dates=new Set(k.story.filter(e=>known.test(e.t)).map(e=>e.d));
  for(let ago=11;dates.size&&ago>=0;ago--){
    const abs=(S.year-1)*12+S.month-1-ago;
    if(abs>=0&&dates.has(dateStr({...S,year:Math.floor(abs/12)+1,month:abs%12+1})))months.push(S.turn-ago);
  }
  return care.longingMonths=months.slice(-2);
}
function noteCiningLonging(k){
  const months=ciningLongingMonths(k);
  if(months.at(-1)!==S.turn)months.push(S.turn);
  k.dowagerUpbringing.longingMonths=months.slice(-2);
}
// The memory belongs to this child's latest actual farewell.
function ciningLongingChance(k,base){
  const farewell=k.dowagerUpbringing?.farewell;
  if(journalContentVersion()<128||!farewell)return base;
  const elapsed=S.turn-farewell.turn;
  if(elapsed<0||elapsed>6)return base;
  const shift=elapsed<=3?.20:.10;
  return base+(farewell.clung?shift:-shift);
}
function ciningMotherFarewell(k,aunt,mother,d,title,sight){
  const age=kidAge(k),temper=childDisposition(k);
  const sensitivity={内敛:.18,审慎:.12,仁厚:.10,爽直:.02,自矜:0,好胜:-.08,好奇:-.10,灵动:-.14};
  const clung=chance((age<2?.65:age<7?.48:.30)+sensitivity[temper]);
  const quiet=['内敛','审慎','自矜'].includes(temper);
  let parting;
  if(age<2){
    parting=clung?'生母刚把孩子交到姨母怀里，孩子便攥紧她的袖边。她蹲下来又哼了一遍小调，那只小手才慢慢松开。':'生母轻拍了几下，孩子在她肩头睡熟。换到姨母怀里，小手仍舒展着，一直睡到掌灯。';
  }else if(age<7){
    if(clung)parting=quiet?'听见要走了，孩子没出声，只紧紧攥住娘的衣角。娘低头等了好久，孩子才肯把手交给姨母。':'生母才站起来，孩子便扑过去抱住她的腿：“娘，再坐一小会儿。”两人又挨着坐了一阵，才在门前道别。';
    else parting=quiet?'孩子把娘带来的帕子折好收在枕边，轻轻道了声再见。这晚没再起来望门。':'孩子挑了一块桂花糕给娘带回家，跑去门口挥了挥手，回头又叫姨母来看碟里剩下的半块。';
  }else if(clung){
    parting=quiet?'孩子照礼送到廊下，手却还捏着娘的袖口。等旁人走远才轻声说：“我原以为，见过就不会这样想您了。”':'到了廊下，孩子又追上去牵住娘的手：“我还想跟您走几步。”直到姨母来送，才肯慢慢松手。';
  }else if(temper==='仁厚'){
    parting='孩子问清家里人都好，替娘理了理披风：“回去路上小心。我在祖母这里也好。”说完当真放下了心。';
  }else{
    parting=quiet?'孩子同娘约好下一封家书往哪里递，亲手替她挑起帘子。等她走远，才回案边把搁下的那页书读完。':'孩子送娘走到阶前，还笑着叮嘱她留心收信。回去便铺开纸，想把今天见面时来不及说的趣事画给她看。';
  }
  k.dowagerUpbringing.farewell={turn:S.turn,clung};
  k.mood=clamp((k.mood??65)+(clung?2:8));
  const heading='【'+title+'】',mom=mother.name,a=fullName(aunt);
  story(aunt,heading+`领姐妹${mom}进慈宁宫见${k.name}。`+(clung?'临别见孩子舍不得，她请引路的宫人稍候，自己留在门边，等孩子把手伸过来。':'临别见孩子安稳，她陪姐妹慢慢往宫门走，把方才没来得及说的起居琐事讲给她听。'));
  kstory(k,heading+sight+parting);
  story(mother,heading+`随姐妹${a}到慈宁宫见了${k.name}。`+(clung?'临别时终究舍不得催孩子放手。回家解下外衣，想起方才的依恋，便坐下来给孩子写了几句话。':'临别见孩子安心，自己也松了口气。归家后，终于能把亲眼看见的笑模样说给家人听。'));
  const after=age<2?(clung?'送走生母后，让乳母接着哼方才的调子，直到孩子松开攥紧的小手。':'听见孩子呼吸匀净，嘱人轻些落帘，别为行礼把孩子弄醒。'):clung?'临别见孩子难舍，嘱宫人让母亲慢慢告别。用晚膳时特意挪了把椅子，把孩子留在自己身旁。':'临别见孩子已经放下心，便照常摆晚饭，把白日见娘的事留给孩子自己慢慢说。';
  dowagerRecord(d,title,`让${mom}在慈宁宫陪了${k.name}一晌。`+after);
  return `${mom}随${a}进了慈宁宫。${sight}
暮鼓前，${parting}`;
}
function offerCiningMotherVisit(k){
  const care=k.dowagerUpbringing;
  const ready=()=>{
    if(!ciningOutsideChild(k)||k.dowagerUpbringing!==care)return false;
    const months=ciningLongingMonths(k);
    return months.length>=2&&S.turn-months[0]<12&&S.turn-(care.motherVisitRuling??-Infinity)>=6;
  };
  if(!ready())return;
  const {aunt,mother}=ciningChildKin(k),d=S.flags.dowager;
  if(!aunt||!mother)return;
  const valid=()=>ready()&&dowagerVisitReady(aunt)&&mother.alive&&!S.consorts.includes(mother)&&!mother.consortId&&
    !(mother.visit&&S.turn<mother.visit.until)&&!mother.royalCompanionTrip&&!mourningActive();
  if(!valid())return;
  const kin=k.sex==='m'?'外甥':'外甥女',name=k.name,auntName=fullName(aunt),momName=mother.name;
  const young=kidAge(k)<2;
  const settle=allow=>{
    if(!valid())return null;
    care.longingMonths=[];care.motherVisitRuling=S.turn;
    const title=allow?(k.sex==='m'?'慈宁宫母子相见':'慈宁宫母女相见'):'慈宁宫探亲未准';
    const sight=young?'生母才哼出头一句，孩子就循声扭过脸，伏在她肩上安静下来。':kidAge(k)<7?'孩子先躲在帘后看了一眼，认清是娘，连鞋都跑掉了一只。':'孩子原想规规矩矩地行礼，听见娘唤自己的小名，一肚子背好的话全忘了。';
    if(allow&&journalContentVersion()>=128)return ciningMotherFarewell(k,aunt,mother,d,title,sight);
    const childLine=allow?sight:young?'傍晚又有些不安，姨母抱着走了一圈，听着熟悉的曲子才慢慢睡着。':'等到姨母回来，才知道这回见不到娘。坐了一会儿，托姨母回家信时添一句：“我还惦记她。”';
    story(aunt,'【'+title+'】'+(allow?`替${kin}${name}求得恩典，亲自领姐妹${momName}进慈宁宫。见两人依偎在一处，悄悄退到门边，替她们看着时辰。`:`替${kin}${name}求见生母未获准，将御前的答复捎给姐妹，亲口说给孩子听，又到慈宁宫多陪了一阵。`));
    kstory(k,'【'+title+'】'+childLine);
    story(mother,'【'+title+'】'+(allow?`由姐妹${auntName}领进慈宁宫，终于亲眼见到${name}。${sight}临别替孩子掖好衣领，当日随宫人出宫。`:`等来姐妹${auntName}的口信，才知这回不能入宫看${name}。把原准备当面说的家常写成短信，请她替自己念给孩子听。`));
    dowagerRecord(d,title,allow?`替${auntName}转奏得准，命人在慈宁宫里间留座，让${momName}和${name}好好坐了一晌。送走生母后，仍照常留孩子在身边。`:`听过${auntName}所求，转奏未准。见${name}惦念生母，嘱咐姨母照旧替两边递家音。`);
    k.mood=clamp((k.mood??65)+(allow?8:-3));
    return allow?`${momName}随${auntName}进了慈宁宫。${sight}暮鼓前，姨母送她出宫，太后留下陪孩子用饭。`:`太后让${auntName}坐下：“你先替哀家给你姐妹带句话，孩子的家书，这里随时肯收。”这次探亲暂缓。`;
  };
  pushEv({title:'慈宁宫 · 姨母求恩',por:aunt,cast:[dowagerPerson(d),k],valid,
    text:`${auntName}向太后禀道：“${name}已经几次想娘。臣妾往返捎话，总有说不尽的地方。求您许我姐妹${momName}来一趟，看看孩子，当日便送她回去。”
太后请你定夺：“孩子仍由我照看。让他们在我这里见上一面，皇帝意下如何？”`,
    choices:[{t:'准生母入慈宁宫探望',f:()=>settle(true)},{t:'暂不准入宫，仍许通家信',f:()=>settle(false)}]});
}
function ciningAuntVisitTick(d,household){
  if(S.turn-(household.lastAuntVisit??-Infinity)<3)return;
  const visits=[];
  for(const k of S.children){
    if(!ciningOutsideChild(k)||S.turn<=k.dowagerUpbringing.turn)continue;
    const {aunt,mother}=ciningChildKin(k);
    if(!aunt||!dowagerVisitReady(aunt)||!mother)continue;
    // This correspondence belongs to the family outside the palace.
    const visitingHost=mother.visit&&byId(mother.visit.host);
    if(S.consorts.includes(mother)||(visitingHost&&natalInPalace(visitingHost,mother)))continue;
    visits.push({k,aunt,mother});
  }
  if(!visits.length||!chance(.25))return;
  const {k,aunt,mother}=pick(visits),age=kidAge(k),kin=k.sex==='m'?'外甥':'外甥女';
  const auntName=fullName(aunt),motherName=mother.name||k.momName;
  household.lastAuntVisit=S.turn;
  const missing=chance(ciningLongingChance(k,.4));
  if(journalContentVersion()>=127&&missing&&mother.alive)noteCiningLonging(k);
  let scene,news,answer;
  if(missing&&age<2){
    scene='正哭得打嗝，听姨母哼起娘亲常唱的小调，慢慢松开了攥着的拳头。';
    news='孩子还认得你唱过的小调，听到第二句就安静了。';
    answer='她把最后两句的唱词也托人带回，怕姐妹记不齐。';
  }else if(missing&&age<7){
    scene=mother.alive?'挨到姨母膝边，小声问：“娘想我的时候，也有人陪她坐坐吗？”':'挨到姨母膝边，央她再讲一件娘小时候的事。';
    news='孩子问，你想念孩子的时候，可有人陪你坐坐？';
    answer='她听罢眼眶一热，托来人答：“娘有人陪。下回见姨母，也抱抱她，算娘抱你的。”';
  }else if(missing){
    scene=mother.alive?'送姨母到门边才开口：“烦您同娘说，那年她教我打的结，我到现在都没忘。”':'解下自己打的络子给姨母看，还记得生母当年怎样一点点教自己收紧。';
    news='孩子托我告诉你，当年你教的那个结，如今还会打。';
    answer='她从针线篮里翻出旧络子，托人回话：“娘也一直收着你打的头一个。”';
  }else{
    [scene,news,answer]=age<2?
      ['一把握住姨母伸来的手指，醒了好一会儿才肯松开。','今日精神好，握着我的手好一阵子。','她也记得那只小手的力气，听完才笑着放人回去。']:
      age<7?['拉姨母去看窗边刚种下的豆子，约她下回来看芽。','孩子种了一颗豆子，日日记得去看。','她叫人在自家窗台也种下一颗，等下回比比哪边长得快。']:
      ['同姨母下了一局棋，临别把未走完的几步摆在原处，等她下回来续。','今日我去陪孩子下棋，倒是我先想不出下一步了。','她听得笑了，叮嘱姐妹下次好好应战，别故意让棋。'];
  }
  const relay=mother.alive? `临走托人给姐妹${motherName}捎话：“${news}”`:'临走将姐妹小时候的乳名告诉太后，好让孩子日后问起时还有人记得。';
  story(aunt,`【姨母探望】惦记${kin}${k.name}，特地去了趟慈宁宫。${k.name}${scene}${relay}`);
  kstory(k,`【姨母探望】姨母${auntName}来看自己。${scene}`+(missing&&mother.alive&&age>=2?'姨母答应把这句话带给娘。':''));
  if(mother.alive)story(mother,`【姨母探望】姐妹${auntName}去慈宁宫看过${k.name}，捎来口信：“${news}”${answer}`);
  dowagerRecord(d,'姨母探望',`${auntName}来慈宁宫看${k.name}。看到孩子${missing?'依恋姨母的样子，便让她再坐一会儿，晚些时候再传饭。':'喜欢有人作伴，便叮嘱宫人下回她来时直接领到孩子跟前。'}`);
}
const CINING_CHILD_DAYS=[
  [
    ['前晚让风声惊醒了一回。乳母把旧日的小被放在手边，昨晚睡得沉些了。','睡醒后攥着被角，安安稳稳地听了一会儿人声。'],
    ['乳母轻轻敲一敲摇篮沿，便听得出声音从哪边来。今早自己伸出手，也照样拍了两下。','听父皇学着拍了两下摇篮沿，朝声音那边伸出了手。'],
    ['早上听见廊下的雀叫，就朝亮处转脸。咱们把摇篮挪到窗边，让孩子看了一会儿树影。','躺在摇篮里，眼睛跟着窗纸上的树影慢慢转。']
  ],[
    ['前两日吃粥，总要看一眼旁人的碗才肯动勺。今日自己挑了只青碗，把粥喝完了。','把用过的小青碗指给父皇看，碗沿还有一粒没擦净的米。'],
    ['宫人收帕子的时候，也凑过来帮忙。最小那条叠了三回，虽歪一些，倒舍不得叫人拆了。','给父皇看自己叠的小帕子，又从头叠了一遍。'],
    ['昨日蹲在阶边看蚂蚁搬糕屑，问它们冷了住哪儿。今日一早，又来找那条小路。','拉着父皇到阶边，找了半晌，总算又看见一只蚂蚁。']
  ],[
    ['这两日自己收拾了书案。哪一格放纸、哪一格收旧物，都有自己的主意，宫人也得先问一声。','领父皇看自己的书案，把常用的几样东西一件件指给他看。'],
    ['和宫人下棋，昨日输了还留着棋局。今早吃饭前，又去看那枚棋子该放哪一格。','请父皇坐在棋盘另一边，试了试昨晚没想通的那一步。'],
    ['这几天在描窗外的树。起先每片叶子都要画，昨晚忽然懂得给风留点地方了。','展开一张画到一半的树影，请父皇猜哪一枝是风吹动的。']
  ]
];
function ciningChildVisit(k){
  if(!canVisitCiningChild(k))return null;
  const d=S.flags.dowager,{mother,aunt}=ciningChildKin(k),age=kidAge(k),band=age<2?0:age<7?1:2;
  const care=k.dowagerUpbringing,name=k.name,momName=mother?.name||k.momName;
  const visits=care.visits||0,days=CINING_CHILD_DAYS[band];
  const day=k.hp<35?['身子有些乏，我叫人把帘子放下了。今日在床边陪陪就好。','在枕边听见父皇来看望，很快又安静地歇下了。']:days[visits%days.length];
  const missing=!!mother&&chance(ciningLongingChance(k,.35));
  const memory=['听见旧日的摇篮调，手指抓住了从原家带来的被角。','轻轻问了一句：“娘也知道我住在这里吗？”',mother?.alive===false?'在窗纸上比画出原家门前的路，记起生母当年牵着自己走过。':'在窗纸上比画出原家门前的路，小声问可不可以给娘捎个信。'][band];
  const response=mother?.alive===false?['大家收好小被，让熟悉的曲子唱完。','太后陪孩子说起生母，答应把记得的事慢慢讲给孩子听。','你陪孩子把思念写在纸上，收在自己的书匣里。'][band]:
    '太后说：“惦记娘亲是应当的。在祖母这里，都可以说。”';
  const text=`请安过后，你到慈宁宫看${name}。太后说：“${day[0]}”`+(missing?'\n'+name+memory+response:'');
  return {title:'慈宁宫 · 探望'+name,por:dowagerPerson(d),cast:[dowagerPerson(d),k],text,valid:()=>canVisitCiningChild(k),choices:[{
    t:mother?.alive?(missing?'陪一会儿，给生母捎句话':'陪孩子坐坐，给生母报平安'):'陪孩子坐一会儿',
    f:()=>{
      if(!canVisitCiningChild(k))return null;
      care.lastVisit=S.turn;care.visits=visits+1;
      const childLine=day[1]+(missing?memory:'');
      kstory(k,'【慈宁宫探望】'+childLine);
      dowagerRecord(d,'说起孩子的近况',`皇帝请安后来看${name}。说给他听：“${day[0]}”`+(missing?'又陪孩子想了一会儿生母。':''));
      if(mother?.alive){
        const courier=aunt?`姐妹${fullName(aunt)}托人带来口信`:'慈宁宫托人带来口信';
        const reaction=missing?(band===0?'听说孩子听旧曲仍会抓住被角，便把从前哄睡时唱的末两句也写了回去。':'知道孩子还念着自己，回话说家中都好，想娘的时候随时都可以再捎话。'):'听到这些日常琐事，终于知道孩子在慈宁宫过着怎样的日子。她在回话里问了孩子明天的起居。';
        story(mother,`【慈宁宫家音】${courier}，说陛下去看了${name}。${day[1]}${reaction}`);
      }
      if(aunt){
        const kin=k.sex==='m'?'外甥':'外甥女';
        const reply=mother?.alive?(missing?`听说孩子想念${momName}，她替母亲和孩子捎了口信，两边都有了回音。`:`她记下这件小事，特地给姐妹${momName}报了平安。`):
          '她将自己记得的姐妹旧事说给慈宁宫的宫人听，好让孩子日后问起时有人能答。';
        story(aunt,`【姨母牵挂】太后捎话来，说起${kin}${name}今日见父皇的情形。${reply}`);
      }
      if(journalContentVersion()>=127&&missing&&mother?.alive){noteCiningLonging(k);offerCiningMotherVisit(k);}
      log(`请安后在慈宁宫探望${name}，听太后说起孩子近况。`);
      return mother?.alive?'你陪孩子坐了一会儿，又将孩子的近况捎给生母。':'你陪孩子坐了一会儿，临走替太后掩好窗扇。';
    }
  }]};
}
function offerCiningChildVisit(){
  const children=S.children.filter(canVisitCiningChild);
  if(!children.length)return;
  pushEv({title:'慈宁宫 · 请安之后',por:dowagerPerson(S.flags.dowager),
    text:'请安的事说完，宫人来问，陛下可要顺路去看看太后跟前的孩子？',
    valid:()=>children.some(canVisitCiningChild),
    choices:[...children.map(k=>({t:'顺便看看'+k.name,person:k,cond:()=>canVisitCiningChild(k),f:()=>{
      const ev=ciningChildVisit(k);if(ev)pushNow(ev);return null;
    }})),{t:'今日先回去'}]});
}
