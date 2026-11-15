/* The dowager remembers actual births, losses, visits and publicly established facts. */
const dowagerLivingActive=()=>!!S&&journalContentVersion()>=21;
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
 const descriptions=people.map(c=>{
  const bond=dowagerBond(c,d),visits=d.household.bonds[c.id]?.visits||0,work=c.rank===8&&dowagerQueenWork(c);
  if(c.rank===8){
   if(bond>=65&&work)return `太后看着${fullName(c)}说：“皇后近来${work.includes('新人')||work.includes('认路')?'照料新人、核对用度':'料理宫中事务'}，这些操劳哀家看见了。你也别只顾公务，得空来坐坐。”`;
   if(bond<=40)return `皇后${fullName(c)}依礼问安。太后与她说话仍有些生分：${work?'“这件宫务办得妥，照章料理便好。”':'“中宫自有职责，今日既来了，坐下喝杯茶罢。”'}皇后应了一声，接过宫人递来的温茶。`;
   return `皇后${fullName(c)}陪太后说起宫中起居。太后说：“你肯来听哀家说几句，便很好。六宫的事慢慢说，先让茶温一温。”`;
  }
  return `太后提起${fullName(c)}：“${c.clan===d.clan?'这是哀家母家的孩子，':bond>=65?'这孩子与哀家投缘，':'平日来往不算多，'}${visits>=3?'平日这里清静，多亏她常来陪哀家说话。':'今日肯来陪哀家坐坐，屋里也热闹些。'}${bond<=40?'性子虽未必事事合拍，肯坐下来好好说话，总比疏远了强。':'家常慢慢说，茶还温着。'}”`;
 });
 let done=false;const valid=()=>!done&&d.alive&&people.every(dowagerVisitReady);
 return trackDowagerTalk(d,{title:'慈宁宫 · 茶席有伴',por:dowagerPerson(d),cast:people,present:people,valid,
  text:`你到慈宁宫时，${people.map(fullName).join('、')}也在。宫人添上一盏茶。\n${descriptions.join('\n')}`,
  onShow:()=>{noteDowagerCompany(d,people);startDowagerRumor(d,people);},choices:[
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
