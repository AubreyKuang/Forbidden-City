/* Only verified service and procedurally known charges enter the shared correspondence. */
const courtFamilyRepliesActive=()=>!!S&&!S.over&&journalContentVersion()>=149;
const COURT_FAMILY_NEWS={
 merit:{title:'任上报捷',opening:'',mood:4},
 pending:{title:'被参待查',opening:'案情还有待查证。',mood:-4},
 held:{title:'参奏留中',opening:'这件事尚无定论。',mood:-3},
 rebuked:{title:'参奏受斥',opening:'这件事未交部核查。',mood:-2},
 penalized:{title:'未审先罚',opening:'处分已下，事由仍未查定。',mood:-5},
 proven:{title:'查实受责',opening:'核查已有实据。',mood:-6},
 cleared:{title:'查明清白',opening:'原先的指摘已经核清。',mood:5},
 restored:{title:'误黜复职',opening:'原先的革职旨意已经收回。',mood:1}
};
const COURT_FAMILY_VOICES={
 gentle:['看到回奏里果真有人得了照应，我替他高兴。也想问一句，他总算肯好好吃顿饭了吗？','我惦记他夜里睡不睡得着。事情该查清楚，家常也还有几句可以问。','知道实情，倒比一直猜下去好。做错了的事，盼他能亲手补上。','我这才敢松一口气。往后家书上那句一切都好，他可以安心写了。'],
 proud:['从前有些人只肯称他一声外戚。现在且看功簿上，他自己做成了什么。','才听见一本奏折，就有人等着看我低头。我自己也想听一听，这件事究竟有多少实据。','我也替家门臊得慌。往后若还有人在我面前只说他委屈，我要问他有没有补救。','该把原簿给说过闲话的人也看一眼。只是那些话听过了，我还没这么快忘。'],
 measured:['我把报功的日子记下了。若还有经手的人，也请功册照实写上，免得家里一家领尽。','风闻、证词、原簿，各有各的分量。等核明白了，我才知道该对家里说什么。','我只想问善后落在谁手里、何时做完。既有了实据，家里就该认清这一步。','原来差的是那一页凭据。我想把原奏和回报并着读，再把结果告诉家里。'],
 bright:['我原想见人就说这件喜事。话到了嘴边，还是先留给他，问问这一路最难办的是哪一桩。','这消息传得又快又省话。我急得很，却越听越想找个说得清原委的人。','我原有好几句想替他说的话。看完才明白，有几句话该等他自己说。','方才还打算忍着不问。一听见说查清了，我先把放凉的茶一口喝了。'],
 studious:['我把回报里那几句实绩念了两遍。等写信时，想请他说说奏折上没写过的经过。','听到别人替他下断语，我便把自己听见的写在一页，亲见的凭据另留一页。','看完处分，还想弄明白这桩事从哪里做错。以后家里提起，也总得有个实话。','我记得上回那张纸空着几行。今天可以补上了，先前的疑处仍留着，好记得是怎样查清的。'],
 solitary:['喜信我收在匣里，得空会给他写两句。今日只想自己把这份欢喜坐一会儿。','我想等门外的人散了，再把消息从头理一遍。此刻若开口，恐怕连自己想问什么都说不清。','我给他留一张素笺。责罚的话自有公文，家里有些盼他补过的话，还得由我写。','今晚应当能早睡一些。我会把那封只写了称谓的信接着写完。']
};
function courtFamilyBond(c,p,role){
 const letters=c.fatherLetters?.father===p.id?c.fatherLetters:null;
 if(role==='father'&&Number.isFinite(letters?.closeness))return letters.closeness;
 if(Object.hasOwn(S.rel||{},rk(c,p)))return relGet(c,p);
 if(role==='father')return p.daughterLetterNature==='demanding'||c.fatherHeirPressure?-20:p.daughterLetterNature==='caring'?45:0;
 return p.palaceConcern?.c===c.id&&S.turn-p.palaceConcern.turn<=12?28:0;
}
function courtFamilyBondLine(c,p,role){
 const tie=courtFamilyBond(c,p,role);
 if(tie>=25)return role==='father'?'她读到落款，还是用了小时候唤父亲的称呼。':'她本想依礼称呼，提起笔，还是用了手足间惯叫的小名。';
 if(tie<=-15)return '从前家书里已有些话说不到一处。这回她仍把牵挂留了下来，开头却只写了规规矩矩的称谓。';
 return '她先备了张素笺，斟酌是否该添几句家常。';
}
function courtFamilyPosition(c,kind){
 if(c.cold)return '消息托人从冷宫门边悄悄递进来。想回信，还得等有合规的递信机会。';
 if(c.templeStay)return '消息是家人送到寺门的。晚钟过后，她才有空独自细看。';
 if(c.homeLeave)return '她恰在家中，听递信的人在门房把来由讲了一遍。';
 if(mourningActive()||xinOf(c)==='悲恸')return '她手边还搁着丧中穿用的素服，看完便把纸收好，改日再想如何落笔。';
 if(c.preg>=5||consortRecovery(c)||(c.hp??100)<45)return '她在榻上听人念完，遣宫人先去温药，等有精神了再细想家事。';
 if(c.rank===8)return '中宫仍有宫簿待核。她先将家里的消息单独收起，等各宫回话交齐，才重又展开。';
 if(c.favor<25)return kind==='merit'?'近月少有召见，她把喜信留在自己案上，免得贺喜的话变成借势的议论。':'近月少有召见，宫里已经有风声。她照常过日子，等能私下说话再开口。';
 return '她让来人先回去了，把家书带到日常坐的那张小案边。';
}
function courtFamilyQuote(c,kind){
 const lines=COURT_FAMILY_VOICES[familyBearingStyle(c)];
 const index=kind==='merit'?0:kind==='proven'?2:['cleared','restored'].includes(kind)?3:1;
 return lines[index];
}
function courtFamilyReactionLine(c,p,role,kind){
 return courtFamilyPosition(c,kind)+courtFamilyBondLine(c,p,role)+'她道：“'+courtFamilyQuote(c,kind)+'”';
}
function courtFamilyChronicle(person,c,p,n,stage,title,text,emotion){
 const thread='court-family:'+(n.recovery?.priorId||n.id);
 (person.story||=[]).push({d:dateStr(),t:'【'+title+'】'+text,thread,occasion:'court-family:'+n.id+':'+stage,
  life:{kind:'family',title,turn:S.turn,gen:S.gen,source:n.task,people:[{id:c.id,name:fullName(c)},{id:p.id,name:p.name}]}});
 NPCMemory.record(S,{type:'court-family-news',time:S.turn,participants:[c.id,p.id],object:thread,outcome:text},
  [{person:person.id,subject:person===c?p.id:c.id,interpretation:text,emotion,impact:65}]);
}
function recordCourtFamilyNews(e,{kind,task,fact,caseKey,officialDuty,balancedFor}){
 if(!courtFamilyRepliesActive()||!e||!officialAlive(e.p))return false;
 const {c:host,p,role,h}=e,info=COURT_FAMILY_NEWS[kind];
 if(!(role==='father'||/^brother/.test(role)||role.startsWith('relative')&&!p.parentRelativeId&&!p.motherRelativeId&&!p.natalCollateral))return false;
 const relatives=paternalFamily(host).filter(c=>S.consorts.includes(c)&&c.alive&&!c.gone&&!c.maid&&
  (!palaceKinResponseActive()||!palaceKinLettersBarred(c))&&officialPerson(c.house,role)?.id===p.id);
 if(!relatives.length)return false;
 const key=caseKey?caseKey+':'+kind:p.id+':'+S.turn+':'+kind+':'+task;
 for(const c of relatives){
  const notes=c.courtFamilyNews||=[];
  if(notes.some(n=>n.gen===S.gen&&n.key===key))continue;
  for(const n of notes)if(n.gen===S.gen&&caseKey&&n.caseKey===caseKey&&!n.status)n.status='updated';
  const kin=officialKinLabel(h,role,c),id=(S.flags.courtFamilyNewsSeq||0)+1;
  S.flags.courtFamilyNewsSeq=id;
  const n={id:S.gen+'-'+id,gen:S.gen,turn:S.turn,date:dateStr(),key,caseKey,officialId:p.id,role,kin,kind,task,fact,officialName:p.name};
  n.reaction=courtFamilyReactionLine(c,p,role,kind);
  notes.push(n);
  c.courtFamilyNews=[...notes.filter(n=>n.status==='sent'),...notes.filter(n=>n.status!=='sent').slice(-10)].sort((a,b)=>a.turn-b.turn);
  const tie=courtFamilyBond(c,p,role);
  const mood=info.mood+(tie>=25?Math.sign(info.mood):tie<=-15?-Math.sign(info.mood):0);
  if(c.id!==balancedFor)cchg(c,{mood});
  if(officialDuty)c.familyDuty={relativeId:p.id,role,name:p.name,kin,kind:'success',task,turn:S.turn,text:n.reaction,quote:courtFamilyQuote(c,kind)};
  if(inPalace(c)&&!['悲恸','心如死灰','怨恨'].includes(xinOf(c)))setXin(c,mood>0?'释然':'忧心',kin+p.name+' · '+info.title,null,{record:false});
  const title='前朝家书·'+info.title;
  courtFamilyChronicle(c,c,p,n,'incoming',title,kin+p.name+'，'+fact+' '+n.reaction,mood/10);
  courtFamilyChronicle(p,c,p,n,'incoming',title,fact+' 家人将这道消息转知'+fullName(c)+'，他也惦记宫中可有回音。',mood/12);
 }
 return true;
}
function courtFamilyNewsFor(c,role,kind,task,fact,caseKey,balanced){
 if(!courtFamilyRepliesActive())return false;
 const h=houseOf(c),p=officialPerson(h,role);
 return recordCourtFamilyNews({c,h,p,role},{kind,task,fact,caseKey,balancedFor:balanced?c.id:null});
}
function courtFamilyOfficial(c,n){
 const p=officialPerson(c.house,n.role);
 return p?.id===n.officialId?p:null;
}
function courtFamilyPending(c){
 return courtFamilyRepliesActive()?(c.courtFamilyNews||[]).filter(n=>!n.status&&n.gen===S.gen&&S.turn-n.turn<=12&&officialAlive(courtFamilyOfficial(c,n))).reverse():[];
}
function courtFamilyCanReply(c){
 return inPalace(c)&&!mourningActive()&&(c.hp??100)>=35;
}
function courtFamilyLetter(c,p,n){
 const tie=courtFamilyBond(c,p,n.role),good=['merit','cleared','restored'].includes(n.kind);
 if(tie<=-15)return good?'听说家里得了好消息，特来道一声平安。宫里的用人自有章程，往后家书也盼能多写几句近况。':
  '家中若有难处，请照实写来。臣妾能尽的是问候与照应，不能替家里许下案上的事。';
 if(n.kind==='merit')return tie>=25?'听说那桩差事办妥了，我替你高兴。忙完记得吃饭，下回给我说一件折子上没写的事。':
  '任上办得妥当，我已听说。谨寄问候，余下的功劳等朝廷照例核定。';
 if(n.kind==='proven')return '核查的结果已经知道了。该认的事请自己认下，该补的也请照实补完。家里的平安，仍愿听你亲自说说。';
 if(good)return '听说原来的案子已经查明，家里可以安心些了。若还有想说的，往后的信里慢慢写给我看。';
 return '如今听到的只是案上现有的消息。我惦记你的起居，若有话请照实说，让官府循证去查便是。';
}
function courtFamilyReplyEvent(c,n){
 const valid=()=>courtFamilyCanReply(c)&&courtFamilyPending(c).includes(n);
 if(!valid())return null;
 const p=courtFamilyOfficial(c,n),info=COURT_FAMILY_NEWS[n.kind],letter=courtFamilyLetter(c,p,n);
 const finish=send=>{
  if(!valid()||!useE())return null;
  n.status=send?'sent':'heard';
  const old=continuityThreads(c).find(t=>t.kind==='family'&&t.stage==='invitation'&&t.outcome==='success'&&t.officialId===n.officialId&&t.origin===n.turn&&t.task===n.task);
  if(old){old.stage='ended';old.ended=S.turn;}
  cchg(c,{aff:2,mood:send?2:3});
  if(send){
   n.due=S.turn+(p.away||p.commission||p.diplomaticJourney?2:1);n.letter=letter;
   courtFamilyChronicle(c,c,p,n,'sent','寄往娘家的回信','把信交给递送的人：“'+letter+'”',.3);
   return '她将家书私下封好，托人按往来旧例送回家中。';
  }
  courtFamilyChronicle(c,c,p,n,'heard','只在宫中说一说','陛下私下听她说完'+n.kin+p.name+'的事，她将尚未封口的信收回匣中。',.35);
  return '她将没封口的信放回匣中。今夜先把该说的话说完，家书由她自己再定。';
 };
 return {title:'前朝家书 · '+info.title,por:c,present:[c],sealedAnnals:true,valid,
  text:n.date+' · '+n.kin+p.name+'，'+n.fact+' '+info.opening+'\n'+courtFamilyReactionLine(c,p,n.role,n.kind)+'\n她案上的信写着：“'+letter+'”',
  choices:[{t:'准她寄出这封家书 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>finish(true)},
   {t:'私下听她说，家书留给她 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>finish(false)},{t:'改日再谈'}]};
}
A.courtFamilyReply=function(id,newsId){
 if(modalOpen)return;
 const c=byId(id),n=c&&courtFamilyPending(c).find(n=>n.id===newsId);
 if(n)pushEv(courtFamilyReplyEvent(c,n));
};
function courtFamilyReplyTick(){
 if(!courtFamilyRepliesActive())return;
 for(const c of familyCourtHosts())for(const n of c.courtFamilyNews||[]){
  if(n.status!=='sent'||S.turn<n.due)continue;
  if(palaceKinResponseActive()&&palaceKinLettersBarred(c)){n.status='returned';continue;}
  const p=courtFamilyOfficial(c,n);
  if(!officialAlive(p)){
   n.status='returned';
   if(c.alive&&p)courtFamilyChronicle(c,c,p,n,'returned','未到的家书','写给'+n.kin+p.name+'的信随驿使退回。家中先一步报了讣音。',-.6);
   continue;
  }
  if(p.exiled||p.incognitoCase){
   if(S.turn-n.due<3)continue;
   n.status='returned';
   if(c.alive)courtFamilyChronicle(c,c,p,n,'returned','未到的家书',n.kin+p.name+'眼下未能接信，递送的人将信原封退了回来。',-.3);
   continue;
  }
  n.status='delivered';
  const demanding=n.role==='father'&&p.daughterLetterNature==='demanding';
  const stubborn=p.temperament==='进取'&&n.kind==='proven'||demanding;
  const replies={
   持正:n.kind==='proven'?'处分看过了，该补办的差事也已记下。你尽管安心，家事我自会料理。':'你的信收下了。待我把手头事料理妥帖，再写一封只说家常的。',
   谨慎:'这边起居照旧。写信前把能说清的事都想过一遍，免得你听了半截，反倒多心。',
   进取:stubborn?'信是读过了。手里的路往后还能怎么走，我仍得再想一想。':'你还问起任上的事，我也高兴。等见到实效，再仔细写给你。',
   圆融:'家中都平安。话交给旁人总少几分意思，今日回信，且由我自己写。'
  };
  const quote=demanding?'信收到了。家里仍盼你多想些门路，你信里说的分寸，我也听见了。':replies[p.temperament]||replies.谨慎;
  if(c.alive){
   if(n.role==='father'&&c.fatherLetters?.father===p.id&&Number.isFinite(c.fatherLetters.closeness))
    c.fatherLetters.closeness=clamp(c.fatherLetters.closeness+(stubborn?-2:4),-100,100);
   else relAdd(c,p,courtFamilyBond(c,p,n.role)-relGet(c,p)+(stubborn?-2:4));
   courtFamilyChronicle(c,c,p,n,'reply','前朝家书有回音',n.kin+p.name+'回信：“'+quote+'”'+(stubborn?' 她把信收下，仍想给自己留一点余地。':' 她将来信收在自己那封家书的抄底旁。'),stubborn?-.2:.5);
  }
  courtFamilyChronicle(p,c,p,n,'reply','前朝家书有回音','读过'+fullName(c)+'的家书：“'+n.letter+'”'+(c.alive?' 回她：“'+quote+'”':' 传来她的讣音，他将未寄的回信留在了家里。'),stubborn?-.2:.45);
 }
}
function courtFamilyNewsPanel(c){
 if(!courtFamilyRepliesActive()||!c.courtFamilyNews?.length)return '';
 const current=c.courtFamilyNews.filter(n=>n.gen===S.gen&&S.turn-n.turn<=12&&n.status!=='updated').slice(-4).reverse();
 const pending=courtFamilyPending(c);
 return detailSection('前朝家书',current.map(n=>{
  const available=pending.includes(n)&&courtFamilyCanReply(c);
  const status=n.status==='sent'?'已寄，等候回音':n.status==='delivered'?'家书已有回音':n.status==='heard'?'曾私下谈过':n.status==='returned'?'家书退回':available?'待谈':'眼下未便回信';
  return `<p><strong>${esc(COURT_FAMILY_NEWS[n.kind].title)}</strong> · ${esc(n.kin+n.officialName)} · ${status}</p><p>${esc(n.date)} · ${esc(n.fact)}</p>`+
   (available?`<button class="btn sm jade" data-onclick="A.courtFamilyReply(${c.id},'${n.id}')">听她谈这封家书</button>`:'');
 }).join(''));
}
