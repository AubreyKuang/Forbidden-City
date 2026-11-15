/* All mutations happen in actions or the monthly tick; proposals and views are pure. */
function lifeState(c){return c.personalLife||(c.personalLife={works:[],links:{}});}
// Older saves recorded family news and a relative's arrival as grievances; neither involved the emperor.
const LIFE_FAMILY_NEWS=/^【(家中病讯|病况回音|家书报安|归家闲话)】/;
function lifeBoundary(c){const b=c?.personalLife?.boundary;if(b&&!b.acknowledged&&(LIFE_FAMILY_NEWS.test(b.cause||'')||b.cause===c.sisterArrival?.text))return null;return b?.gen===S.gen&&!b.resolved?b:null;}
// Name the grievance briefly, as she would bring it up, without the chronicle's heading.
function lifeCause(text){const t=String(text||'').replace(/^【[^】]*】/,'').split(/[。！？]/)[0].trim();return t.length>24?t.slice(0,24)+'…':t;}
function lifeRecord(people,kind,title,text,source='',thoughts=[]){
 const cast=[...new Set(people.filter(p=>p&&p.alive!==false))];
 const names=cast.map(p=>({id:p.id,name:p.sex?p.name:fullName(p)}));
 for(const p of cast){
  (p.sex?kstory:story)(p,text);
  p.story.at(-1).life={kind,title,turn:S.turn,gen:S.gen,people:names,source};
 }
 NPCMemory.record(S,{type:'personal-life',time:S.turn,participants:cast.map(p=>p.id),object:title,outcome:text},
  cast.map((p,i)=>({person:p.id,subject:cast.find(o=>o!==p)?.id||'emperor',interpretation:typeof thoughts[i]==='string'?thoughts[i]:thoughts[i]?.text||text,
   emotion:thoughts[i]?.emotion??.45,impact:75,channel:'participant'})));
}
function lifeHurt(c,text){
 const l=lifeState(c);l.boundary={gen:S.gen,cause:lifeCause(text),date:dateStr(),turn:S.turn,acknowledged:false,respect:0};
}
function lifeRespect(c){
 const b=lifeBoundary(c);if(!b?.acknowledged||b.lastRespect===S.turn)return;
 b.lastRespect=S.turn;b.respect++;
 if(b.respect>=2){b.resolved=true;lifeRecord([c],'bond','慢慢重建的信任',`${fullName(c)}谈起「${b.cause}」：道歉之后，陛下在不同月份两次依照她说出的意愿办事，她才肯重新谈及私事。`,b.cause,
  ['我记得那件事，也看见后来两次答应的事确实做到了。可以试着再信一次。']);}
}
function lifeFriendScore(c,o){const l=c?.personalLife?.links?.[o?.id];return l?l.trust:0;}
function lifePartners(c){return harem().filter(o=>o!==c&&socialPair(c,o)&&relGet(c,o)>=15&&lifeFriendScore(c,o)>-5)
 .sort((a,b)=>lifeFriendScore(c,b)-lifeFriendScore(c,a)+relGet(c,b)-relGet(c,a));}
function lifePreference(c,kind){
 if(kind==='family'||lifeBoundary(c)||isSolitary(c)||['淡泊','沉静','体弱','痴情'].includes(c.trait))return 'private';
 if(continuityConcern(c)||['骄矜','骄纵','张扬','好胜','才女'].includes(c.trait))return 'public';
 return ['好客','温婉','活泼'].includes(c.trait)&&lifePartners(c).length?'shared':'private';
}
function lifeProposal(c){
 if(!inPalace(c)||c.maid||c.personalLife?.project||S.turn-(c.personalLife?.finished??-99)<12)return null;
 const hobby=consortHobby(c),craft=LIFE_CRAFTS[hobby];
 const separated=S.children.find(k=>k.mom===c.id&&k.foster&&byId(k.foster)?.alive&&k.foster!==c.id&&kidAge(k)<14&&familyVisitAllowed(k,c));
 const old=(c.personalLife?.works||[]).at(-1);
 if(separated&&c.personalLife?.familyChild!==separated.id){
  return {kind:'family',hobby,title:'把相见的日子留下',child:separated.id,
   cause:`${separated.name}如今由${fullName(byId(separated.foster))}抚养。${c.preg?'再次有孕，让她又想到与这个孩子相处的安排。':'她想把获准相见的日子过得更踏实。'}`,
   wish:'不必大张旗鼓。想和孩子做些小事，把相处记成一本亲子手记。',preferred:'private'};
 }
 const preferred=lifePreference(c,'craft');
 return {kind:'craft',hobby,title:old?`${craft.title} · 续编`:craft.title,
  cause:old?`已经完成《${old.title}》，她想把这些年新增的心得另编一卷。`:`平日喜欢${hobby}，她想把散在手边的心得留成一册。`,
  wish:preferred==='public'?'想让大家知道这份心力出自谁，也愿让别人拿去用。':preferred==='shared'?'想约一位相处得来的姐妹各写所长，留下一本两个人的书。':'想慢慢做成自己的东西，先留在身边，不急着送到众人面前。',preferred};
}
function lifeProjectReady(c,p=c?.personalLife?.project){
 if(!p||p.gen!==S.gen||!inPalace(c))return false;
 if(p.child&&!familyVisitAllowed(kidById(p.child),c))return false;
 if(p.partner&&(!inPalace(byId(p.partner))||p.dispute||lifeCooperationBroken(c,byId(p.partner))))return false;
 return true;
}
function lifeCooperationBroken(c,o){return !o||relGet(c,o)<0||isRival(c,o)||isRival(o,c)||lifeFriendScore(c,o)<0;}
function lifeProposalMatches(c,proposal){
 const current=lifeProposal(c);
 return byId(c.id)===c&&!!current&&['title','kind','child','hobby','cause','preferred'].every(key=>current[key]===proposal[key]);
}
function lifeLink(a,b,title,delta){
 for(const [c,o] of [[a,b],[b,a]]){const links=lifeState(c).links,old=links[o.id];
  links[o.id]={name:fullName(o),trust:Math.max(-30,Math.min(30,(old?.trust||0)+delta)),source:title,turn:S.turn,lastHelp:old?.lastHelp??S.turn,helps:old?.helps||0};}
}
function lifeStart(c,proposal,mode,partner){
 if(!lifeProposalMatches(c,proposal)||!['private','public','shared'].includes(mode))return null;
 if(mode==='public'&&(proposal.kind==='family'||lifeBoundary(c)))return null;
 if(mode==='shared'&&(proposal.kind==='family'||!partner||!lifePartners(c).includes(partner)))return null;
 if(!useE())return null;
 const l=lifeState(c),p=l.project={...proposal,gen:S.gen,started:S.turn,progress:0,lastTick:S.turn,mode,partner:mode==='shared'?partner.id:null,partnerName:mode==='shared'?fullName(partner):''};
 if(mode===proposal.preferred)lifeRespect(c);
 const text=`${fullName(c)}提出「${p.title}」。缘起：${p.cause} 她的打算：${p.wish} 最后商定${mode==='public'?'完成后署名传阅':mode==='shared'?`与${fullName(partner)}共同编写，各留署名，先不公开`:'先留在身边，按自己的步调慢慢做'}。`;
 lifeRecord([c,mode==='shared'?partner:null],'craft',p.title,text,p.cause,[mode===p.preferred?'这回商量的办法，正合我的心意。':'我接受了这个安排，但原先想要的事还没有忘记。']);
 return text;
}
function lifeFinish(c,p,mode){
 if(c.personalLife?.project!==p||p.progress<3||!lifeProjectReady(c,p))return null;
 if(mode==='public'&&(p.kind==='family'||lifeBoundary(c)))return null;
 if(!['private','public','shared'].includes(mode)||mode==='shared'&&!p.partner)return null;
 const partner=byId(p.partner),l=lifeState(c),authors=[c,...(partner?[partner]:[])];
 const title=p.kind==='family'?`与${kidById(p.child).name}的亲子手记`:p.title;
 const work={id:`${S.gen}:${c.id}:${S.turn}:${l.works.length}`,title,hobby:p.hobby,kind:p.kind,gen:S.gen,date:dateStr(),turn:S.turn,
  authors:authors.map(a=>({id:a.id,name:fullName(a)})),mode,source:p.cause};
 l.works.push(work);l.finished=S.turn;if(p.child)l.familyChild=p.child;delete l.project;
 const exposed=!!partner&&mode==='public'&&p.mode==='shared';
 if(partner){lifeState(partner).works.push({...work});lifeLink(c,partner,title,exposed?-8:12);relAdd(c,partner,exposed?-4:4);
  if(exposed)lifeHurt(partner,`合编《${title}》时说好先不公开，陛下却未再征询便令各宫传阅。`);}
 if(mode===p.preferred)lifeRespect(c);
 cchg(c,{mood:mode===p.preferred?5:1,aff:mode==='private'?2:0});
 if(mode==='public')chg({prestige:1});
 const outcome=mode==='public'?'以两人各自署名传阅':'各自留好一份，不作公开传阅';
 const text=`《${title}》完成，${partner?`${fullName(c)}与${fullName(partner)}${outcome}`:`${fullName(c)}${mode==='public'?'署名传阅':'留在身边，暂不传阅'}`}。${mode!==p.mode?'商议时改变了原先的安排。':''}${partner&&mode==='public'&&p.mode==='shared'?'合作者虽接受了传阅，对今后是否再拿出私稿仍有保留。':''}`;
 lifeRecord([...authors,p.child?kidById(p.child):null],p.child?'family':'craft',title,text,p.cause,authors.map(a=>exposed&&a===partner?
  {text:`《${title}》虽然留了我的名字，却把说好先留在我们手里的稿子传了出去。以后拿出私稿前，我还想先谈清边界。`,emotion:-.6}:
  `${a.id===c.id?'我':'我们'}终于把《${title}》做成了。${mode==='public'?'名字写在册上，心力有了着落。':'留下这一本，日后可以再翻。'}`));
 log(text);return text;
}
function lifeProjectEvent(c){
 const p=c.personalLife?.project,proposal=p||lifeProposal(c);if(p?.partner&&(p.dispute||lifeCooperationBroken(c,byId(p.partner))))return lifeDisputeEvent(c,p);
 if(!proposal||p&&!lifeProjectReady(c,p))return null;
 let done=false;const choice=(t,fn,cond)=>({t,cond,f:()=>{if(done||!inPalace(c)||cond&&!cond())return null;const r=fn();if(r)done=true;return r;}});
 if(!p){const partner=lifePartners(c)[0];return {title:'她想留下的东西',por:c,text:`${proposal.cause}\n“${proposal.wish}”\n打算做：${proposal.title}。约三个月得闲整理，不占每月精力；相处或合编需要相关人物在场。`,present:[c],valid:()=>lifeProposalMatches(c,proposal),choices:[
  choice('留在身边，按她的步调做 · 精力1',()=>lifeStart(c,proposal,'private'),()=>!!lifeProposal(c)),
  ...(proposal.kind!=='family'?[choice('完成后署名传阅 · 精力1',()=>lifeStart(c,proposal,'public'),()=>!!lifeProposal(c)&&!lifeBoundary(c))]:[]),
  ...(partner&&proposal.kind!=='family'?[choice(`请${fullName(partner)}一起合编 · 精力1`,()=>lifeStart(c,proposal,'shared',partner),()=>lifePartners(c).includes(partner)&&!!lifeProposal(c))]:[]),
  {t:'先听她说说，改日再商议',f:()=> '话留在这里，等彼此有闲再谈。'}]};}
 if(p.progress<3)return {title:p.title,por:c,text:`${p.cause}\n已整理${p.progress}个月。${p.partner?`合作者：${fullName(byId(p.partner))}。`:''}她还想再细看一些，等做成后再来商量。`,choices:[{t:'慢慢来',f:()=> '不催她赶工。'}]};
 return {title:'一册做成之后',por:c,cast:p.partner?[byId(p.partner)]:[],present:[c,...(p.partner?[byId(p.partner)]:[])],valid:()=>c.personalLife?.project===p&&lifeProjectReady(c,p),text:`「${p.title}」已整理完成。\n她当初说：“${p.wish}”\n原先商定${p.mode==='public'?'署名传阅':p.mode==='shared'?'两人合编，各留署名，先不公开':'先留在身边'}。${p.partner?`\n${p.partnerName}说：“我的几页先留在咱们手里。若要传阅，日后先问过我。”`:''}\n这回如何安置？`,choices:[
  choice('照原先商量的安排',()=>lifeFinish(c,p,p.mode),()=>p.mode!=='public'||!lifeBoundary(c)),
  ...(p.mode==='public'?[choice('先留在身边，暂不传阅',()=>lifeFinish(c,p,'private'))]:[]),
  ...(p.mode!=='public'&&p.kind!=='family'?[choice(p.partner?'两人都署名，也请各宫传阅':'署上她的名字，请各宫传阅',()=>lifeFinish(c,p,'public'),()=>!lifeBoundary(c))]:[]),
  {t:'等她想好再说',f:()=> '稿子收在她那里，先不动。'}]};
}
A.lifePlan=function(id){const c=byId(id);if(modalOpen||!inPalace(c))return;const ev=lifeProjectEvent(c);if(ev)pushEv(ev);};
A.lifeReconcile=function(id){const c=byId(id),b=lifeBoundary(c);if(modalOpen||!inPalace(c)||!b||b.acknowledged)return;
 pushEv({title:'把心结说清',por:c,present:[c],valid:()=>lifeBoundary(c)===b&&!b.acknowledged,text:`她记得的是：${b.cause}\n“赏赐我领情。只是以后涉及我的东西，能不能先问过我？”`,choices:[
  {t:'听完缘由，承诺先商量 · 精力1',f:()=>{if(lifeBoundary(c)!==b||b.acknowledged||!inPalace(c)||!useE())return null;b.acknowledged=true;
   const t=`${fullName(c)}与陛下谈清「${b.cause}」。陛下答应先听她的意愿；她接受道歉，仍要看今后的行动。`;lifeRecord([c],'bond','心结与边界',t,b.cause,['话已经说清，但我还想看以后会怎么做。']);return t;}},
  {t:'容她暂时保留这点距离',f:()=> '这件事还没有解决，先不勉强她。'}]});};
A.lifeCoauthor=function(id,other){const c=byId(id),o=byId(other),l=c?.personalLife?.links?.[other];
 if(modalOpen||!inPalace(c)||!inPalace(o)||!l||l.trust>=0||!socialPair(c,o))return;let done=false;
 pushEv({title:'再谈合编的分寸',por:c,cast:[o],present:[c,o],text:`说起《${l.source}》的传阅，${fullName(c)}与${fullName(o)}都还记得当初的安排。她们愿意再谈一次：合编可以，往后谁的稿子要给别人看，便先由谁点头。`,choices:[
  {t:'让她们按各自意愿留稿 · 精力1',f:()=>{if(done||!inPalace(c)||!inPalace(o)||l.trust>=0||!useE())return null;done=true;lifeLink(c,o,l.source,-l.trust);
   const t=`${fullName(c)}与${fullName(o)}谈清《${l.source}》留下的分歧，约定各自保留稿件，传阅前征求本人意见。她们愿从小事重新合作，旧事仍留在纪事里。`;lifeRecord([c,o],'bond','合编的边界',t,l.source);return t;}},
  {t:'暂不安排她们合编',f:()=> '留些距离，先各做各的事。'}]});};
function lifeGiftReady(c,k,w){return !!k&&!!w&&c?.personalLife?.works.includes(w)&&!w.given&&w.kind!=='family'&&!k.keepsakes?.some(o=>o.id===w.id)&&kidAge(k)>=6&&!k.pendingName&&familyVisitAllowed(k,c);}
A.lifePass=function(id,kid,workId){const c=byId(id),k=kidById(kid),w=c?.personalLife?.works.find(w=>w.id===workId);
 if(modalOpen||!lifeGiftReady(c,k,w)||!useE())return;
 w.given=k.id;const gift={...JSON.parse(JSON.stringify(w)),from:c.id,fromName:fullName(c),received:S.turn,receivedAge:kidAge(k)};
 (k.keepsakes||=[]).push(gift);
 lifeRecord([c,k],'family',w.title,`${fullName(c)}把亲手整理的《${w.title}》交给${k.name}，陪孩子翻读一页。册上仍留着${w.authors.map(a=>a.name).join('、')}的署名。`,w.source,
  ['不必事事照着我做，只盼这本东西能陪孩子走一段。',`这是${fullName(c)}交到我手里的，不只是宫里新赏的一本书。`]);render();};
function lifeRitualReady(c){const r=c?.personalLife?.ritual;return inPalace(c)&&r?.gen===S.gen&&r.month===S.month&&r.lastYear!==S.year;}
A.lifeRitual=function(id){const c=byId(id);if(modalOpen||!inPalace(c)||lifeBoundary(c))return;const l=c.personalLife,r=l?.ritual;
 if(r?.gen===S.gen){if(!lifeRitualReady(c)||!useE())return;r.lastYear=S.year;lifeRespect(c);
  lifeRecord([c],'bond','一年又一年',`${fullName(c)}与陛下依照${r.date}定下的旧约，${r.title}。谈起这些年的变化，也容彼此安静一会儿。`,`${r.date}，相约${r.title}。`);cchg(c,{mood:5,aff:2});render();return;}
 if(!l?.works.length||c.aff<40)return;let done=false;
 pushEv({title:'留一个得闲的日子',por:c,present:[c],text:`《${l.works.at(-1).title}》收好了。她说，若明年这个月彼此得闲，也想再${LIFE_CRAFTS[consortHobby(c)].ritual}。\n不必备礼，不必补赴；忙过了便等下回。`,choices:[
  {t:'就这样相约 · 精力1',f:()=>{if(done||!inPalace(c)||lifeBoundary(c)||!useE())return null;done=true;
   const r=lifeState(c).ritual={gen:S.gen,month:S.month,date:dateStr(),title:LIFE_CRAFTS[consortHobby(c)].ritual,lastYear:S.year};lifeRespect(c);
   const t=`${fullName(c)}与陛下${r.title}，相约今后此月得闲时再聚，不以错过为过失。`;lifeRecord([c],'bond','相约来年',t);return t;}},
  {t:'随缘相见也很好',f:()=> '不必定下日子，眼前这一回也值得记住。'}]});};
function personalLifeTick(){
 S.consorts.forEach(repairDeliveryChronicle);
 for(const c of S.consorts){const p=c.personalLife?.project;if(!p||p.gen!==S.gen)continue;
  const other=p.partner?byId(p.partner):p.child?kidById(p.child):null;
  if(!c.alive||c.gone||(p.partner||p.child)&&!other||other&&(!other.alive||other.gone||p.child&&childHasLeftPalace(other)&&!other.templeStay)){
   const reason=!c.alive||other&&!other.alive?'参与者离世':'参与者离宫';
   lifeRecord([c,other].filter(p=>p?.alive&&!p.gone),'craft',p.title,`「${p.title}」因${reason}停在未完成处，原稿收好，没有让旁人接替。`,p.cause);delete c.personalLife.project;c.personalLife.finished=S.turn;continue;
  }
  if(p.partner&&!p.dispute&&lifeCooperationBroken(c,other)){
   p.dispute={turn:S.turn};lifeRecord([c,other],'craft',p.title,`${fullName(c)}与${fullName(other)}因近来的嫌隙暂停合编《${p.title}》，各自收好原稿。已经写下的名字不改，也没有另找人顶替。`,p.cause);
  }
  if(p.lastTick===S.turn||p.progress>=3||!lifeProjectReady(c,p)||c.hp<40||other?.hp<40)continue;
  p.lastTick=S.turn;p.progress++;
  if(p.child){const k=kidById(p.child),small=kidAge(k)<3;recordFamilyTime(k,c,'记亲子手记',small?`听见${fullName(c)}熟悉的声音，在她身边慢慢安静下来。`:`和${fullName(c)}一起挑了一件小事写进手记。`,`与${k.name}把相见的一天记下来。`);lifeRecord([c,k],'family','亲子手记',`${fullName(c)}在获准与${k.name}相见的日子记下手记的第${p.progress}页，${small?'把孩子新添的小动作细细写下来':'孩子也挑了一件想留下的小事'}。`,p.cause);}
  if(p.progress===3){const text=`${fullName(c)}${p.partner?`与${fullName(other)}`:''}整理好「${p.title}」的初稿，等得闲时再商量如何留存。`;
   lifeRecord([c,p.partner?other:null],'craft',p.title,text,p.cause);log(text);}
 }
 // At most one quiet exchange per month, including repeated calls after load.
 if(S.flags.lifeQuietTurn!==S.turn){
  for(const c of harem()){
   const entry=Object.entries(c.personalLife?.links||{}).find(([id,l])=>{const o=byId(+id);return l.trust>=8&&S.turn-l.lastHelp>=8&&inPalace(o)&&socialPair(c,o)&&!lifeCooperationBroken(c,o);});
   if(!entry)continue;const [id,l]=entry,o=byId(+id),reverse=o.personalLife?.links?.[c.id];
   // Alternate who offers help; actual cooperation matters more than a high friendship number.
   const giver=l.helps%2?o:c,receiver=giver===c?o:c;if(giver.hp<40)continue;
   const text=`从前合编《${l.source}》的${fullName(giver)}${receiver.hp<50?'送来清粥，替':'带着整理好的散页来，帮'}${fullName(receiver)}${receiver.hp<50?'照看手边未完的小事':'把手边的札记按次序收好'}。这回无需另请御前安排。`;
   l.lastHelp=S.turn;l.helps++;if(reverse){reverse.lastHelp=S.turn;reverse.helps=l.helps;}
   relAdd(c,o,2);cchg(receiver,{mood:3});lifeRecord([giver,receiver],'bond','合编后的往来',text,l.source,
    [`从《${l.source}》一起做起，有事便知道可以找她。`,'这回的相助我记下了，下次她忙时，我也愿搭把手。']);log(text);S.flags.lifeQuietTurn=S.turn;break;
  }
 }
 // Public copies can actually be used by a third person; private drafts cannot.
 if(S.flags.lifeQuietTurn!==S.turn){
  for(const c of harem()){
   const w=c.personalLife?.works.find(w=>w.mode==='public'&&!w.readBy&&S.turn-w.turn>=2);
   if(!w||w.incomplete)continue;const reader=harem().find(o=>!w.authors.some(a=>a.id===o.id)&&consortHobby(o)===w.hobby&&socialPair(c,o)&&!lifeCooperationBroken(c,o));if(!reader)continue;
   for(const author of w.authors){const copy=byId(author.id)?.personalLife?.works.find(x=>x.id===w.id);if(copy)copy.readBy=reader.id;}
   const text=`${fullName(reader)}读到${w.authors.map(a=>a.name).join('、')}署名传阅的《${w.title}》，拿其中一页来与${fullName(c)}核对心得。两人因这本册子多了一次实际来往。`;
   lifeRecord([c,reader],'craft',w.title,text,w.source,['原来她也用得上这一本。',`读过《${w.title}》，才知道她在这些小处花过心思。`]);relAdd(c,reader,4);log(text);S.flags.lifeQuietTurn=S.turn;break;
  }
 }
 for(const k of S.children.filter(k=>k.alive&&!k.jailed&&!k.removedFromRoyal&&!k.templeStay))for(const w of k.keepsakes||[]){
  if(w.echo||kidAge(k)<16||S.turn-w.received<12)continue;
  w.echo=S.turn;const c=byId(w.from),canTell=c&&familyVisitAllowed(k,c),act=LIFE_CRAFTS[w.hobby].echo;
  const t=`${k.name}${act}。这本《${w.title}》是${w.date}由${w.authors.map(a=>a.name).join('、')}整理、后来由${w.fromName}交到手里的。${canTell?`又把自己的新心得当面说给${fullName(c)}听。`:c?.alive?'写下新的心得，收在册页里。':'如今翻起，仍认得当年的笔迹。'}`;
  lifeRecord([k,canTell?c:null],'family',w.title,t,w.source,[`小时候收下的《${w.title}》，如今自己用起来，才添了新的体会。`,`${k.name}用自己的办法续写这一本，原来也已长大了。`]);log(t);
 }
}
function lifeVoice(c){
 const b=lifeBoundary(c);if(b)return voiceLine('life-boundary','她肯说话，也仍保留着自己的边界。',b.acknowledged?'那回的话，臣妾听见了。只是下一次，还是想先把自己的意思说完。':`「${b.cause}」这件事，臣妾还想与陛下说清。`);
 const p=c.personalLife?.project;if(p&&p.gen===S.gen)return voiceLine('life-work','她提起近来亲手在做的事。',`「${p.title}」${p.progress>=3?'初稿已经收好，想同陛下商量如何留下来。':!lifeProjectReady(c,p)?'先收在手边，等能相见再续。':p.partner?`还在和${p.partnerName}慢慢整理，各人有各人的想法。`:'还在慢慢整理。'}${p.wish}`);
 return null;
}
function lifeLeads(){return harem().flatMap(c=>{
 const p=c.personalLife?.project,r=lifeRitualReady(c);
 if(r&&!lifeBoundary(c))return [{person:c,title:'得闲赴旧约 · '+fullName(c),text:c.personalLife.ritual.title,cast:[c],action:`A.lifeRitual(${c.id})`,priority:18,button:'赴约'}];
 if(p?.progress>=3&&lifeProjectReady(c,p))return [{person:c,title:'初稿收好了 · '+fullName(c),text:p.cause,cast:[c],action:`A.lifePlan(${c.id})`,priority:22,button:'看看她做成的东西'}];
 return [];
});}
function inheritLifeKeepsakes(h){E().keepsakes=JSON.parse(JSON.stringify(h.keepsakes||[]));}
