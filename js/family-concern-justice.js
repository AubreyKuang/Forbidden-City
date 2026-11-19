/* A family's worry follows the known verdict. Affection is not a claim of innocence. */
const familyJusticeActive=()=>!!S&&journalContentVersion()>=19;
function familyPenaltyContext(c,old){
  const lines=(c.story||[]).slice(old?.story?.length??0).map(s=>s.t);
  const d=c.discipline;
  if(d?.gen===S.gen&&d.turn===S.turn&&d!==old?.discipline&&lines.some(t=>t.includes(d.crime)))return {known:'guilty',crime:d.crime};
  if(lines.some(t=>/因主使换婴被/.test(t)))return {known:'guilty',crime:'主使换婴'};
  if(lines.some(t=>/查明.*(清白|毫不知情)|昭雪|身世疑云已释/.test(t)))return {known:'cleared'};
  return {known:'unresolved'};
}
function familyPenaltyQuote(person,context){
  const t=person.temperament;
  if(context.known==='guilty'){
    if(t==='持正')return `${context.crime}既已查实，臣痛心她害了旁人，也愧于平日未能规劝。臣会写信责她认错自省，不敢求以亲情掩过。`;
    if(t==='谨慎')return `得知${context.crime}的案情，家中惶恐。臣不敢护短，将约束家人言行，劝她守禁思过；只盼依例给她衣药，不敢借此求免其责。`;
    if(t==='进取'||t==='骄矜')return `${context.crime}已然查实，臣又气又痛，也怕家门因此失了颜面。再舍不得，也不能说她无辜；家中会劝她认错守规。`;
    return `她做下${context.crime}这等错事，家里既痛心又担忧。臣不敢替她辩白，只求容家书劝她悔过，衣药照宫规供给便好。`;
  }
  if(context.known==='cleared')return '既已查明她未涉其事，家中才稍稍安心。受过的惊惧恐怕一时难消，只盼她能好好休养。';
  return t==='持正'||t==='谨慎'?'家中已知降罚，尚不敢妄议案情。臣会劝她守规静省，只盼依例照料起居；如需问话，家中自当配合。':'听闻她受了降罚，家中忧心，却不知事情全貌。臣不敢遽称冤枉，也不敢求掩过，只想托家书问一句起居平安，盼她有衣御寒、有药可医。';
}
const justicePunishEvent=punishEv;
punishEv=function(c,victim,crime){
  const ev=justicePunishEvent(c,victim,crime);
  for(const choice of ev.choices){if(!choice.f)continue;const apply=choice.f;choice.f=function(...args){
    if(familyJusticeActive())c.discipline={gen:S.gen,turn:S.turn,crime,verdict:'guilty',penalty:choice.t};
    return apply.apply(this,args);
  };}
  return ev;
};
function repairFamilyConcernWording(){
  if(!familyJusticeActive())return;
  const oldQuote='臣想听听她的近况。她性子里的委屈，可有人肯听？';
  for(const c of S.consorts){
    for(const entry of c.story||[]){
      if(!entry.t.startsWith('【娘家来信】'))continue;
      entry.t=entry.t.replace('得知自己','得知'+fullName(c));
      if(!entry.t.includes(oldQuote))continue;
      const punishment=c.story.find(s=>s.d===entry.d&&/事发，被降为.+，禁足宫中。/.test(s.t));
      const guilty=punishment&&punishment.t.match(/^(.+?)事发，被降为/);
      const context=guilty?{known:'guilty',crime:guilty[1]}:{known:'unresolved'};
      for(const person of careerPeople()){
        if(!entry.t.includes(person.p.name))continue;
        const quote=familyPenaltyQuote(person.p,context);entry.t=entry.t.replace(oldQuote,quote);
        for(const s of person.p.story||[])if(s.d===entry.d&&s.t.includes(fullName(c)))s.t=s.t.replace(oldQuote,quote);
        const n=person.p.palaceConcern;if(n?.c===c.id&&n.quote===oldQuote)n.quote=quote;
        break;
      }
    }
  }
}
const justiceConsortView=viewConsort,justiceOfficialView=viewOfficial,justiceFamilyConversation=officialConversation;
viewConsort=function(){repairFamilyConcernWording();return justiceConsortView();};
viewOfficial=function(){repairFamilyConcernWording();return justiceOfficialView();};
officialConversation=function(e,topic){repairFamilyConcernWording();return justiceFamilyConversation(e,topic);};

function familyPenaltyRole(r){
  return r.label==='父亲'?'father':r.type==='blood'&&/[兄弟]/.test(r.label)?'brother':'kin';
}
function familyPenaltyWriters(kin,key,stamp,lostCrown){
  const entrants=[];
  for(const {person,r} of kin){
    if(person.p.palaceConcerns?.[key]===stamp)continue;
    const role=familyPenaltyRole(r);
    const odds=({father:lostCrown?.85:.65,brother:lostCrown?.6:.4,kin:lostCrown?.28:.12})[role];
    const score=R()/odds;
    if(score<1)entrants.push({person,role,score});
  }
  const writers=new Set(),roles=new Set();
  for(const {person,role} of entrants.sort((a,b)=>a.score-b.score)){
    if(roles.has(role))continue;
    writers.add(person);roles.add(role);
    if(writers.size===(lostCrown?2:1))break;
  }
  return writers;
}
function familyPenaltyVoice(p,r,context,lostCrown,fallback){
  const role=familyPenaltyRole(r),guilty=context.known==='guilty';
  if(!lostCrown&&role==='father')return fallback;
  const kin=r.label==='弟弟'?'姐姐':'妹妹',sober=['谨慎','持正'].includes(p.temperament);
  if(role==='father'){
    const line=sober?'当初送女儿受册，我亲手把告庙的祝文收进匣里。今日听说收了凤印，我又把那篇祝文取出来，坐了半晌。':'她幼时随我写字，第一回家信还把“安”字写歪了。我提笔写了半日，还是只唤她一声女儿。';
    return line+(guilty?'因'+context.crime+'获罪，我会劝她认错；家里谁也不许拿旧日恩典说情。':context.known==='cleared'?'既已查明她未涉此事，但愿她能睡个安稳觉。':'诏书之外的事，我不敢妄议，只想知道她如今住得可好。');
  }
  if(role==='brother')return (lostCrown?'从前门上挤满了来贺中宫的人，今日门前倒清静了。':'家里听见消息，几次催我进宫问个究竟。')+
    (guilty?'既然'+context.crime+'已经查实，我已回绝说情的人，也会写信劝'+kin+'认错。':context.known==='cleared'?'既已查明清白，我想让'+kin+'知道，家里的门始终为她开着。':'我告诉家里，先别信外头的闲话。有难处，让'+kin+'在信里告诉我。');
  return (lostCrown?'从前逢节，家里递往中宫的贺笺都由我过目。如今我嘱咐他们收起旧帖，往后依新礼往来。':'两家虽是亲眷，我知道的也只比外人多一封家信。')+
    (guilty?'听闻'+context.crime+'查实，婚亲各房也该约束子弟，勿借旧亲求情。':context.known==='cleared'?'疑处既已查清，也请亲友止住闲议。':'有人来打听内情，我只让他看宫里明发的诏书。');
}

/* Personal letters and a signed memorial come from the same observed change. */
const palaceKinFlowActive=()=>!!S&&!S.over&&journalContentVersion()>=155;
const PALACE_KIN_NEWS={promoted:'晋封喜信',neglected:'宫中少见',cold:'冷宫问安'};
const PALACE_KIN_WORDS={
 持正:['晋封是你的喜事。我只写这封信道贺，已叫家里照旧待人，莫把你的位分挂在嘴边。','听说近来少有召见。家里有人劝我四下托人，我已经回绝。你想说什么，写给我便好。','我先托人依例照料起居。若你受了委屈，也请把亲历的经过写清，听来的话另放一边。'],
 谨慎:['贺笺已写好，托平日递信的人带进去。家中那席贺酒，我叫他们改在自家用饭便是。','听说你近来清闲些。我没敢问外头那些猜测，只想知道吃得如何，夜里睡不睡得安稳。','我只想问你有衣御寒没有，平日吃的药可曾断过。若有所缺，家里先备着，等宫里准了再送。'],
 进取:['家里本要设席，我最后只让他们点了香告祖。你这些年如何走到今日，倒想听你亲口讲讲。','我想过托人问个明白，写下一串名字，又把纸收了起来。你若另有打算，先说给我听。','一听见冷宫二字，我险些就往宫门去了。站了半晌，先回来写信问你可有衣御寒，药有没有断。'],
 圆融:['来道贺的人在门外站了一阵。我谢了来人，进屋另给你挑一张素笺。家里人说话，只管说家常。','别人传话越传越重，我听两句便岔开了。你若想说些闲话解闷，家里也有新鲜事可写给你。','我托熟识的宫人问候，先问有衣御寒没有、热水几时送到。家里经用的那些东西，还都替你留着。']
};
function palaceKinDirect(c,person,r){
 const e=person.e;
 return !!e&&familyPenaltyRole(r)!=='kin'&&officialPerson(c.house,e.role)?.id===person.p.id;
}
function palaceKinRelation(tie,role,kind){
 if(tie>=25)return role==='father'?' 信尾，他又用起她幼时的乳名。':' 信尾，他提起两人在家时都认得的一件旧物。';
 if(tie<=-15)return ' 他将写得太亲昵的一行划去，仍按从前疏淡的称呼封了信。';
 return kind==='cold'?' 他在纸背记下还需问清的几项起居。':' 末了，他添了一句请她有空报个平安。';
}
function palaceKinWords(p,kind,cause){
 const words=PALACE_KIN_WORDS[p.temperament]||PALACE_KIN_WORDS.谨慎;
 if(kind==='promoted')return words[0];
 if(kind==='neglected')return words[1];
 if(cause.known==='guilty')return familyPenaltyQuote(p,cause);
 return '家中还不知事情全貌。'+words[2];
}
function palaceKinReceiver(c,n){
 const close=n.tie>=25,distant=n.tie<=-15;
 if(distant)return '她认得字迹，读完只将信平平整整地收好，过了片刻才重又展开。';
 if(n.kind==='promoted')return close?'她读到末尾，笑着同随侍说起在家时落笔写信的情景。':'她将贺笺夹进册封那日的旧帖里，另找了张素纸预备报平安。';
 if(n.kind==='neglected')return ['持重','聪慧','城府','才女'].includes(c.trait)?
  '她把信里问吃睡的两句圈出来，想下回只说实在的近况。':'近来来往稀少，她读完这封短信，把原本放凉的茶重新温了。';
 return close?'她摸了摸信纸的折痕，头一回肯把还缺的几样衣药说给值房听。':'听完问候，她把信收在枕边。次日值房问起是否缺物时，她如实说了两件。';
}
function deliverPalaceKinLetter(c,p,n){
 if(n.letter!=='sent')return;
 if(palaceKinResponseActive()&&palaceKinLettersBarred(c)){n.letter='returned';return;}
 if(!c.alive||c.gone||c.familyArchive){
  n.letter='returned';
  if(officialAlive(p))courtFamilyChronicle(p,c,p,n,'returned','寄还的家书','送往内廷的信原封退回，他将信收进家中旧匣。',-.35);
  return;
 }
 if(!p||p.exiled){n.letter='returned';return;}
 n.letter='received';
 const route=c.cold?'值房查验后，将信交进冷宫。':c.templeStay?'值房托人将信送到寺门。':c.homeLeave?'信送到她暂住的府上。':'经内廷准递，她亲手接了来信。';
 const title='娘家来信';
 courtFamilyChronicle(c,c,p,n,'received',title,`${n.kin}${p.name}得知${fullName(c)}${n.fact}，信中说：“${n.quote}” ${route}${palaceKinReceiver(c,n)}`,.4);
 if(officialAlive(p))courtFamilyChronicle(p,c,p,n,'received','家书递达',`${fullName(c)}已收到写给她的家书。问候随信递到，等她有空再报平安。`,.35);
}
function recordPalaceKinNews(c,direct,kind,fact,key,stamp,old){
 const cause=kind==='cold'?familyPenaltyContext(c,old):null,sent=[];
 for(const {person,r} of direct){
  const {p,e}=person;
  if(p.palaceConcerns?.[key]===stamp)continue;
  (p.palaceConcerns||={})[key]=stamp;
  const tie=courtFamilyBond(c,p,e.role),words=palaceKinWords(p,kind,cause);
  const quote=words+(tie>=25?' 我仍惦记你从前那几样小习惯。凡有话，得空就写给家里。':
    tie<=-15?' 家门近况照旧。往后有事，照这样的家书往来便是。':'');
  const seq=S.flags.palaceKinNewsSeq=(S.flags.palaceKinNewsSeq||0)+1;
  const away=p.away||p.commission||p.diplomaticJourney||p.incognitoCase;
  const n={id:`palace-${S.gen}-${seq}`,gen:S.gen,turn:S.turn,kind,task:PALACE_KIN_NEWS[kind],fact,role:e.role,kin:r.label,officialId:p.id,officialName:p.name,quote,tie,
    due:S.turn+Number(!!away),letter:p.exiled?'held':'sent'};
  sent.push({p,n});
  (c.palaceKinNews||=[]).push(n);
  p.palaceConcern={c:c.id,kind,turn:S.turn,quote};
  courtFamilyChronicle(p,c,p,n,'written','宫中牵挂',`得知${fullName(c)}${fact}，他记下：“${quote}”`+
    palaceKinRelation(n.tie,e.role,kind)+(p.exiled?' 流放途中信未能递出。':' 托人照例递信。'),kind==='promoted'?.45:-.4);
  if(n.due===S.turn)deliverPalaceKinLetter(c,p,n);
 }
 if(kind==='cold'&&!c.palaceKinPetitionId){
  const petitioner=sent.filter(({p,n})=>oftenPetitionsForKin(p,n.tie)&&officialServing(p)&&p.age>=18&&officialGrade(p))
    .sort((a,b)=>b.n.tie-a.n.tie)[0];
  if(petitioner){
   const {p,n}=petitioner;
   n.petition={due:S.turn+1,cause};
   c.palaceKinPetitionId=n.id;
   courtFamilyChronicle(p,c,p,n,'petition','起草冷宫陈情',
    cause.known==='guilty'?`知道${fullName(c)}因${cause.crime}获罪，他只请依例问病送衣，将草折署了自己的名。`:
    `他提笔为${fullName(c)}陈情，请先照料起居，再斟酌原处分。对未亲见的案由，他没有作断语。`,-.3);
  }
 }
 if(c.palaceKinNews?.length>12)c.palaceKinNews=c.palaceKinNews.filter((n,i,all)=>n.letter==='sent'||
  n.petition&&!n.petition.decision&&S.turn-n.turn<=6||i>=all.length-12||
  palaceKinResponseActive()&&Object.values(n.responses||{}).some(r=>r.status==='sent'));
}
function oftenPetitionsForKin(p,tie){
 return p.temperament==='进取'&&tie>=25||p.temperament==='圆融'&&tie>=50;
}
function palaceKinMailTick(){
 if(!palaceKinFlowActive())return;
 for(const c of familyCourtHosts()){
  if(palaceKinResponseActive()&&palaceKinLettersBarred(c)){closePalaceKinMail(c);continue;}
  for(const n of c.palaceKinNews||[]){
   if(n.letter==='sent'&&S.turn>=n.due)deliverPalaceKinLetter(c,courtFamilyOfficial(c,n),n);
   if(palaceKinResponseActive())deliverPalaceKinResponses(c,n);
  }
 }
 for(const {c,n,p} of palaceKinPetitionRows()){
  if(n.petition.filed)continue;
  n.petition.filed=true;
  courtFamilyChronicle(p,c,p,n,'filed','递上冷宫陈情',`他在折尾署名，为${fullName(c)}递上陈情折，等候御批。`,-.25);
 }
}
function palaceKinPetitionRows(){
 if(!palaceKinFlowActive()||mourningActive())return [];
 return S.consorts.filter(c=>c.alive&&!c.gone&&c.cold&&(!palaceKinResponseActive()||!palaceKinLettersBarred(c))).flatMap(c=>(c.palaceKinNews||[])
  .filter(n=>n.id===c.palaceKinPetitionId&&!n.petition?.decision&&n.gen===S.gen&&S.turn-n.turn<=6&&S.turn>=n.petition?.due)
  .map(n=>({c,n,p:courtFamilyOfficial(c,n)})).filter(({p})=>officialAlive(p)&&!p.exiled&&!p.dismissed));
}
function palaceKinPetitionEvent(c,n,p){
 const valid=()=>palaceKinPetitionRows().some(row=>row.c===c&&row.n===n&&row.p===p);
 const discipline=c.discipline;
 const crime=discipline?.gen===S.gen&&discipline.turn>=n.turn&&discipline.verdict==='guilty'?discipline.crime:n.petition.cause.crime;
 const finish=choice=>{
  if(!valid())return null;
  n.petition.decision=choice;
  const medical=choice==='care'&&((c.hp??100)<60||consortRecovery(c)||c.illnessRecovery?.until>S.turn);
  if(choice==='care'){
   cchg(c,{mood:5});
   if(medical)consortHealthTreat(c,{immediate:4});
  }
  if(choice==='release'){c.rank=0;A.uncold(c.id);}
  const ruling={
   care:'准值房收取家中送来的衣物。'+(medical?'太医已按症诊看，交值房照方调养。':'值房照例核验了家中问起的药物与用度。')+'仍按原处分居住。',
   release:'准她离开冷宫，按官女子安置。旨意当日交内廷办理。',
   decline:'阅毕存档，处分照旧。值房将答复转告了她。'
  }[choice];
  courtFamilyChronicle(p,c,p,n,'ruling','冷宫陈情批复',`为${fullName(c)}递的陈情折已有批复。${ruling}`,choice==='decline'?-.2:.4);
  courtFamilyChronicle(c,c,p,n,'ruling','冷宫陈情批复',`值房转告她，${n.kin}${p.name}曾为她具名陈情。${ruling}`+
   (choice==='care'?' 她亲手接过衣物，记得是家里递来的。':choice==='decline'?' 她先问了两遍，才相信家中有人记挂。':''),choice==='decline'?.15:.5);
  return ruling;
 };
 return {title:'外家陈情 · '+fullName(c),por:p,cast:[c],sealedAnnals:true,valid,
  text:`${p.name}为${n.role==='father'?'女儿':n.kin==='弟弟'?'姐姐':'妹妹'}${fullName(c)}具名上折。\n“${crime?`听说${crime}经查属实，臣会劝她认错，只求依例送衣并问医。`:'臣只知她如今住在冷宫，事由尚未听全。若蒙恩允，先许家人送些衣物。至于原处分，还望陛下斟酌。'}”`,
  choices:[{t:'准送衣物，按例问医',f:()=>finish('care')},
    ...(!crime?[{t:'准出冷宫，以官女子安置',f:()=>finish('release')}]:[]),
    {t:'阅毕存档，处分照旧',f:()=>finish('decline')},{t:'留待下回再阅'}]};
}
A.palaceKinPetition=function(id){
 if(modalOpen)return;
 const row=palaceKinPetitionRows().find(row=>row.n.id===id);
 if(row)pushEv(palaceKinPetitionEvent(row.c,row.n,row.p));
};
function palaceKinPetitionsPanel(){
 const rows=palaceKinPetitionRows();
 return detailSection('外家陈情',rows.map(({c,n,p})=>`<p>${esc(p.name)}为${esc(fullName(c))}递折
   <button class="btn sm jade" onclick="A.palaceKinPetition('${n.id}')">阅看陈情</button></p>`).join(''));
}
function palaceKinLettersPanel(c){
 if(!palaceKinFlowActive())return '';
 const notes=(c.palaceKinNews||[]).filter(n=>n.gen===S.gen&&n.letter==='received').slice(-4).reverse();
 return detailSection('娘家来信',notes.map(n=>`<p><strong>${esc(n.task)}</strong> · ${esc(n.kin+n.officialName)}<br>${esc(n.quote)}</p>`+
  palaceKinResponseButtons(c,n)).join(''));
}

const PALACE_KIN_RESPONSE_JOURNAL=158;
const palaceKinResponseActive=()=>!!S&&!S.over&&journalContentVersion()>=PALACE_KIN_RESPONSE_JOURNAL;
function palaceKinCommoner(c){
 if(!c?.cold)return false;
 if(c.coldCommoner)return true;
 // Older saves recorded the actual decree only in the woman's chronicle.
 const restored=/^蒙陛下开恩，出冷宫，复为/;
 const swapText=`${fullName(c)}因主使换婴被废为庶人，押入冷宫，案卷记明罪责。`;
 const revoked=text=>text==='被废去后位，打入冷宫。'||text===swapText;
 const status=c.story?.findLast(entry=>restored.test(entry.t)||revoked(entry.t));
 return !!status&&revoked(status.t);
}
function palaceKinLettersBarred(c){
 return c.gone||palaceKinCommoner(c);
}
function closePalaceKinMail(c){
 for(const n of c.palaceKinNews||[]){
  if(n.letter==='sent')n.letter='returned';
  for(const r of Object.values(n.responses||{}))if(r.status==='sent')r.status='returned';
 }
 for(const n of c.courtFamilyNews||[])if(n.status==='sent')n.status='returned';
 delete c.palaceKinPetitionId;
}
function palaceKinResponseReady(c,n,stage){
 if(!palaceKinResponseActive()||!c?.alive||c.maid||palaceKinLettersBarred(c)||!S.consorts.includes(c)||
   !c.palaceKinNews?.includes(n)||n.gen!==S.gen||n.letter!=='received'||n.responses?.[stage])return false;
 const p=courtFamilyOfficial(c,n);
 return officialAlive(p)&&!p.exiled&&(stage==='letter'||stage==='petition'&&!!n.petition?.decision);
}
const PALACE_KIN_REPLY_ACK={
 care:'你托人送来的衣物，我已经收到了。',
 release:'旨意传到值房，我已离开冷宫。',
 decline:'值房传了答复，原处分照旧。我这才知道你替我递了折。'
};
function palaceKinResponseDraft(c,p,n,stage){
 const style=familyBearingStyle(c),tie=courtFamilyBond(c,p,n.role);
 const greeting=tie>=25?(n.role==='father'?'爹，':n.kin+'，'):n.kin+'钧鉴。';
 if(stage==='petition'){
  const grateful=tie>=25&&['bright','gentle','studious'].includes(style);
  const words=grateful?
   (style==='bright'?'听说折尾署的是你的名字，我把话问了两遍，才敢信。知道有人记挂，这几日也好过了些。':'我把这封信写了又拆开，只想亲口谢你一声。你肯惦记我的起居，我心里踏实了许多。'):
   (['proud','bright'].includes(style)?'这份心意我领了。往后有什么可先写信同我说，别再为我站到风口上。':'我领你的情，也怕旁人把我这件事算到你任上。下一回只捎家书便好，莫叫家门再多担一重。');
  return {mode:grateful?'thanks':'caution',text:greeting+PALACE_KIN_REPLY_ACK[n.petition.decision]+words};
 }
 if(n.kind==='promoted'){
  const words=tie<=-15?'贺信已收，宫中诸事依礼办妥。家里一向周全，谨奉回音。':
   style==='studious'?'册上的字我看了许久。想起从前你教我写家书，倒是今日这一封信，最想自己一笔一画写完。':
   style==='bright'?'贺信才展开，我便想起家里那顿饭。等你得空写下一封，告诉我那日都有谁在。':'贺信我收在册封那日的旧帖旁。家中有空照常写信来，我也想知道你近来过得如何。';
  return {mode:'joy',text:greeting+words};
 }
 const candid=tie>=25&&['bright','measured','studious'].includes(style)||tie>=55&&style==='gentle';
 const cold=n.kind==='cold',situation=cold?
  (c.cold?'这里入夜确实凉，家里若方便，按例替我问一句秋衣和药。':'那时夜里常冷，如今已经迁出来，衣药也能照常领了。'):
  '前些日子少有召见，夜里确有几回睡不安稳。';
 const words=candid?situation+(style==='bright'?'这话我一直想写给你，今日总算写了出来。':'有些心事肯说出来，反倒能踏实睡一觉。'):
  ['proud','measured','solitary'].includes(style)?'起居照常，你们且安心。家中各人的日子照旧过，有要紧的事，我自会写来。':
   '衣食都好。我抄了些闲日读到的字句给你看，家里按时吃饭，莫为我熬夜。';
 return {mode:candid?'open':'peace',text:greeting+words};
}
const PALACE_KIN_RESPONSES={
 持正:{joy:'知道礼仪都妥帖，我便安心。家里照旧过日子，你也好好过自己的日子。',peace:'你说平安，我领你的话。家中仍给你留着回信的人，有难处随时写来。',open:'信里那几件事我都记下了。能按例照应的会替你问，其余且由你慢慢说。',thanks:'知道话递到了便好。家人的心意你收着，后头的公事我会照章料理。',caution:'你担忧的分寸，我已听进去了。往后照例递家书，公事各依公事办。'},
 谨慎:{joy:'我把你说的那几句收在匣里。家里只照常吃了一顿饭，你可以放心。',peace:'我把平安二字看了两遍，怕你仍省略了什么。回话只问你夜里可还睡得好。',open:'你说的难处，我逐件记下了。送衣问药先照规矩来，其他的话且留在家书里。',thanks:'听说你收到回音，家里悬着的心才放下一点。你只管慢慢调理。',caution:'我原也想过会不会叫你为难。这封信我亲手收好，往后会先听你的意思。'},
 进取:{joy:'看到你的亲笔信，倒比听满门贺词更高兴。你若得空，再写一件你自己的喜事。',peace:'原先我已备下几个问话的人。读完信先把名单收了，等你愿意再写。',open:'我读到第二遍才留意你说的那处难处。先问清能照应哪一样，再动手办。',thanks:'知道你认得折尾的名字，我在案前坐了一阵。这番心思送到了，家里也就安了些。',caution:'我本打算再递一折，读完这封信，先将底稿收回匣里。你这句话，我得记着。'},
 圆融:{joy:'家里那桌饭还说起你。外头的贺词随它去，你肯写家常，我便愿意读。',peace:'家里有人追问，我只说信到了。等你想说得多一些，家里自然有人听。',open:'你的原话我留在自己这里。家中若要托人问起居，只传问候，不传你信里的心事。',thanks:'听你说心里踏实，我们也颇宽慰。往后要什么寻常东西，尽管照例写来。',caution:'外头来问的人我会挡回去。家书还是照常递，有话可以只说给家里。'}
};
function palaceKinResponseEvent(c,n,stage){
 const valid=()=>palaceKinResponseReady(c,n,stage);
 if(!valid())return null;
 const p=courtFamilyOfficial(c,n),draft=palaceKinResponseDraft(c,p,n,stage);
 const title=stage==='petition'?'回信 · 陈情之后':'回信 · '+n.task;
 const route=c.cold?'值房准她封好家书，查验后交驿使递出。':
  c.homeLeave||c.templeStay?'她请随行掌事托人递送。':'她将信封好，请内廷按常例递送。';
 return {title,por:c,sealedAnnals:true,valid,text:`她给${n.kin}${p.name}写道：“${draft.text}”`,choices:[
  {t:'准按例递出回信',f:()=>{
   if(!valid())return null;
   const away=p.away||p.commission||p.diplomaticJourney||p.incognitoCase;
   (n.responses||={})[stage]={...draft,status:'sent',due:S.turn+(away?2:1)};
   courtFamilyChronicle(c,c,p,n,stage+'-sent','娘家回信',`给${n.kin}${p.name}递信：“${draft.text}” ${route}`,.3);
   return route;
  }},{t:'先把信收好，改日再写'}]};
}
A.palaceKinResponse=function(id,newsId,stage){
 if(modalOpen)return;
 const c=byId(id),n=c?.palaceKinNews?.find(n=>n.id===newsId);
 if(n)pushEv(palaceKinResponseEvent(c,n,stage));
};
function deliverPalaceKinResponses(c,n){
 for(const [stage,r] of Object.entries(n.responses||{})){
  if(r.status!=='sent'||S.turn<r.due)continue;
  const p=courtFamilyOfficial(c,n);
  if(!c.alive||!officialAlive(p)||p.exiled||n.gen!==S.gen){r.status='returned';continue;}
  r.status='delivered';
  const tie=courtFamilyBond(c,p,n.role);
  const words=(PALACE_KIN_RESPONSES[p.temperament]||PALACE_KIN_RESPONSES.谨慎)[r.mode];
  const response=(tie<=-15?'他读完先按礼回了两句，折好信才托人带话。':
   tie>=25?'他又从头读了一遍，捏着信纸，停了半晌才请人捎话。':'他将她的回信收好，托来人带两句话。')+`“${words}”`;
  courtFamilyChronicle(p,c,p,n,stage+'-delivered','收到宫中家书',`读到${fullName(c)}的回信：“${r.text}” ${response}`,.45);
  courtFamilyChronicle(c,c,p,n,stage+'-delivered','娘家回信有音讯',`${n.kin}${p.name}已经读过信。送信人捎来话：“${words}”`,.4);
 }
}
function palaceKinResponseButtons(c,n){
 if(!palaceKinResponseActive()||palaceKinLettersBarred(c)||!c.alive)return '';
 return ['letter','petition'].map(stage=>{
  const r=n.responses?.[stage],label=stage==='letter'?'回这封家书':'回信谈陈情';
  if(r)return `<span class="hint">${label} · ${{sent:'已寄出',delivered:'已收到回音',returned:'信未送达'}[r.status]}</span>`;
  return palaceKinResponseReady(c,n,stage)?`<button class="btn sm jade" onclick="A.palaceKinResponse(${c.id},'${n.id}','${stage}')">${label}</button>`:'';
 }).join(' ');
}
