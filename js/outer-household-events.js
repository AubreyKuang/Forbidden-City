// Petitions contain persistent keys; their buttons are rebuilt from the current register.
function outerAnnual(k,m,age){
  const official=k.officialId&&scholarById(k.officialId);
  if(!k.motherReturn&&m.closed!=='已故'&&!m.palaceWork&&age>=20&&(official||k.palaceRank)&&['女医','绣娘','寡妇'].includes(m.trade)){
    k.motherReturn=true;outerQueue(k,'motherReturn');
  }
  if(official&&officialServing(official)){
    const sibling=outerBook().children.find(other=>other!==k&&other.officialId&&other.knowledge==='不知'&&officialServing(scholarById(other.officialId)));
    if(!k.dispute&&k.knowledge==='不知'&&(sibling||kidById(S.heir))&&age>=22){
      k.dispute=sibling?{sibling:sibling.id}:{heir:S.heir};outerQueue(k,'dispute');
    }
    const gain=k.patron==='提携'?4:2;official.merit=clamp(official.merit+gain);
    const rival=kidById(S.heir);
    outerNote(m,k,'岁考',k.patron||'凭实绩',rival?`${official.name}呈上的粮册与东宫旧议相左。有人劝他借此投靠一党，他把算过的底稿留给了${rival.name}。`:
      '属吏把本年办结的案牍捆好送验。他另附一页，列出尚欠百姓的几件事。','“旁人问我靠谁，我希望这几页纸替我答。”');
  }else if(k.path==='候武选'||k.path==='候荫补')outerAttemptOffice(k,m,k.path);
  else if(!k.searchDone&&!k.inquiry&&age>=20){outerQueue(k,'search');}
  else outerNote(m,k,'岁信','收家书',k.trade>=55?'今年铺里收了第一个徒弟。随家书寄来的账单上，东家签的是孩子自己的名字。':'生母寄来一张重修门户的收条，背面另有孩子的手书，说今年家中一切安好。','“旧事我记着，我也有自己的日子。”');
  if(!k.searchDone&&!k.inquiry&&k.knowledge!=='不知'&&age>=20)outerQueue(k,'search');
}
function outerFileCover(k,m,route){
  if(!outerIntegration()||k.register==='化名')return;
  const surnames=SUR.filter(s=>s!==m.sur&&s!==k.foster&&s!==E().sur);
  if(!surnames.includes(k.coverSur))k.coverSur=pick(surnames);
  k.alias=k.coverSur+k.given;
  k.register='化名';
  outerNote(m,k,'化名投牒',route,'他以另立的姓名递交户帖，原籍封在御前密匣。','“旁人只认户帖上那个名字。”');
}
function outerAttemptOffice(k,m,route){
  if(k.officialId||k.pedigree==='认领'||kidAge(k)<18||k.lastTrial===S.turn)return;
  k.lastTrial=S.turn;
  outerFileCover(k,m,route);
  const score=route==='候武选'?k.mar:route==='候荫补'?(k.vir+(m.host||k.foster?22:0)):k.lit;
  if(score+ri(0,25)<62){
    outerQueue(k,'retry');outerNote(m,k,'落选',route,'榜尾也没有自己的名字。回去的船上，孩子把卷子重新摊开。','“再给我一点时间。”');return;
  }
  const p=makeScholar();Object.assign(p,{name:k.alias,sur:k.alias.slice(0,-k.given.length),age:kidAge(k),seed:k.seed,
    ability:clamp(score),origin:k.foster?'寄养人家':m.trade+'之家',office:route==='候武选'?'边营把总':route==='候荫补'?'州府主簿':'县丞',
    appointedTurn:S.turn,outerChildId:k.id,outerGen:S.gen,bloc:route==='候武选'?'army':'civil'});
  if(route==='候武选')p.ministryExperience='war';
  p.post=p.office;p.entryRoute=route==='候会试'?'科举':route==='候武选'?'武选':'荫补';
  if(route==='候会试'){p.examRank='进士';p.examYear=S.year;}
  else{p.registrySource='local';p.away=true;p.essay=route==='候武选'?'点验营中弓马，按季呈交操练实录':'校核乡籍，按季勘验田粮文书';}
  if(m.host){
    const aunt=familyHostById(m.host),owner=m.owner==null?aunt:familyHostById(m.owner),house=owner&&houseOf(owner);
    if(house&&k.register==='本姓')p.courtKin=[{fatherId:house.father.id,type:'maternalNephew',detail:m.kin==='堂姐妹'?'生母与宫中姨母分属堂房，以生母本房入籍':'母亲与宫中姨母出于同一家籍'}];
    if(outerIntegration()&&house?.bloc&&house.bloc!=='none'&&route!=='候武选')p.bloc=house.bloc;
  }
  p.siblingsChecked=true;p.ageTrackedAt=S.turn;
  (S.scholars||=[]).push(p);k.officialId=p.id;k.path='入朝任职';k.secret=clamp(k.secret-5);
  scholarRecord(p,`以${route==='候会试'?'会试中式':route==='候武选'?'武选中格':'荫补核验中格'}授${p.office}。`,false);
  outerNote(m,k,'入朝',route,`榜上写的是${k.alias}。他穿着生母改过的旧袍去领${p.office}的文书。`,'“我总算凭自己的名字走到了这里。”');
  if(!k.exposed&&k.secret>=40)outerAward('暗度陈仓');outerQueue(k,'career');
}
function outerExamResults(){
  if(!outerActive())return;
  for(const k of outerBook()?.children||[])if(k.path==='候会试'&&!k.sealed)outerAttemptOffice(k,outerMother(k.mother),k.path);
}
function outerNieceNominationReason(k){
  if(k.pedigree==='认领'||kidById(k.id))return '已列皇嗣';
  if(k.palaceRank||byId(k.id))return '已入宫';
  if(k.sealed)return '档案已封存';
  if(k.claim)return '正在办理归宗';
  if(k.married||k.spouse||k.widow)return '已有婚事';
  if(k.betrothal)return '已定亲';
  if(k.placement==='待安置')return '尚待安置';
  return '';
}
function outerNieceCanNominate(k){
  return nieceSelectionEntryActive()&&outerIntegration()&&k?.sex==='f'&&outerMother(k.mother)?.relative!=null&&
    !outerNieceNominationReason(k);
}
function outerSelectionCall(){
  if(!outerActive())return;
  for(const k of outerBook()?.children||[]){
    if(nieceSelectionEntryActive()&&k.familySelection==='pending'){
      if(!outerNieceCanNominate(k)||kidAge(k)<15)continue;
      k.familySelection='listed';k.path='待殿选';
      k.pending=k.pending.filter(key=>!['roster','audience'].includes(key));
      if(!S.cands.some(c=>c.id===k.id))S.cands.push(outerSelectionPerson(k));
      outerNote(outerMother(k.mother),k,'选秀入册','依现有户籍应选','礼部照交来的名帖列名，随本届秀女一同应选。');
    }else if(k.path==='候选秀'&&kidAge(k)>=18&&!k.sealed&&!k.claim&&k.pedigree!=='认领'){
      outerQueue(k,'roster');const ev=outerPendingEvent(k,'roster');if(ev)pushEv(ev);
    }
  }
}
function outerSelectionPerson(k){
  const sur=k.alias.slice(0,-k.given.length),trait={沉静:'沉静',直率:'爽直',坚韧:'持重'}[k.temper]||'温婉';
  const c=makeGirl({sur,given:k.given,age:kidAge(k),trait,fam:{...FAMS.find(f=>f.t==='寒门')}});
  Object.assign(c,{id:k.id,outerHouseholdId:k.id,birthMonth:birthMonth(k),looks:k.looks,talent:k.lit,virtue:k.vir,scheme:k.amb,
    portraitOverride:portraitCell({...k,courtGuest:true}),seed:k.seed,kinNote:k.mark+'，随身带着'+k.token});
  deepen(c);
  return c;
}
function outerSelectionEligible(k){
  if(nieceSelectionEntryActive()&&k?.familySelection==='listed')return outerNieceCanNominate(k)&&kidAge(k)>=15&&k.path==='待殿选';
  return k?.sex==='f'&&kidAge(k)>=18&&!k.sealed&&!k.claim&&k.pedigree!=='认领'&&k.path==='待殿选';
}
function outerSelectionAdmitted(k,c){
  if(nieceSelectionEntryActive()&&k.familySelection==='listed'){
    delete k.familySelection;
    k.pending=k.pending.filter(key=>!['adult','school'].includes(key));
  }
  k.path='宫中留名';
  k.palaceRank=RANKS[c.rank];
  k.secret=clamp(k.secret-12);
  if(!k.exposed&&k.secret>=40)outerAward('暗度陈仓');
  return outerNote(outerMother(k.mother),k,'殿选留牌',k.palaceRank,`女史领她入住${c.palace}，衣箱入册时，那枚旧信物也被人看见了。`,'“从这里，还看得见进城的那条路。”');
}
function outerSelectionDismissed(c){
  if(!outerIntegration()||!c.outerHouseholdId)return;
  const k=outerChild(c.outerHouseholdId);
  if(k?.path!=='待殿选')return;
  if(nieceSelectionEntryActive())delete k.familySelection;
  k.path='自立门户';
  outerNote(outerMother(k.mother),k,'殿选出宫','送还原籍','她拿回原籍文书，在城门口买了两包母亲爱吃的糖。','“总算可以回去问她了。”');
}
function outerReleaseResidence(k,reason,recognizing=false){
  const c=byId(k.id);
  if(c?.outerHouseholdId!==k.id)return;
  story(c,reason);
  if(recognizing)S.consorts=S.consorts.filter(p=>p!==c);
  else c.gone=true;
  reconcileResidences();
  return c;
}
function outerReconcileResident(k,m){
  const c=byId(k.id);
  if(k.sex!=='f'||k.sealed||k.pedigree==='认领'||kidAge(k)<18&&!(nieceSelectionEntryActive()&&c?.outerHouseholdId===k.id))return;
  if(!c){
    const resident=outerSelectionPerson(k);
    addConsort(resident,Math.max(0,RANKS.indexOf(k.palaceRank)),'依旧册归入内廷',{recordAdmission:false});
    return;
  }
  if(c.outerHouseholdId!==k.id)return;
  if(!c.alive||c.gone){
    delete k.palaceRank;
    k.path=c.alive?'出宫归家':'宫中身故';
    if(!c.alive){k.sealed=true;delete k.claim;}
    k.pending=k.pending.filter(key=>c.alive&&key!=='recognizedFace');
    outerNote(m,k,'内廷来报',k.path,c.alive?'女史把她送至宫门外，旧户帖一并交还。':'内廷递来讣信，原来的信物随遗物送还。');
  }else k.palaceRank=RANKS[c.rank];
}
function outerRoyalEntry(k,m){
  const given=m.name.slice(m.sur.length),mother={id:m.relative??m.id,sur:m.sur,given,rank:0,talent:55,virtue:60,scheme:35,trait:m.trait};
  const official=k.officialId&&scholarById(k.officialId);
  let formerResident;
  if(outerIntegration()){
    if(nieceSelectionEntryActive())delete k.familySelection;
    S.cands=S.cands.filter(c=>c.outerHouseholdId!==k.id);
    formerResident=outerReleaseResidence(k,'奉旨交还宫牌，改列宗室玉牒。',true);
    k.recognizedTurn=S.turn;
  }
  if(official?.married){k.married=true;if(official.spouse)k.spouse={...official.spouse};}
  const royal=makeKid(mother,k.sex,k.given,{outsideChild:k,origin:null,foster:kidAge(k)<14?empress():null});
  if(formerResident)royal.story.unshift(...formerResident.story);
  for(const stat of ['lit','mar','vir','amb','looks'])royal[stat]=k[stat];
  S.children.filter(c=>c.sex===k.sex).sort(royalBirthOrder).forEach((c,index)=>{c.ord=index+1;});
  royal.birthTraits.initial={...royal.birthTraits.initial,lit:k.lit,mar:k.mar,vir:k.vir,amb:k.amb};
  royal.love=k.trust;royal.outerRegisterId=k.id;royal.momName=m.name;royal.portraitVariant=k.portraitVariant;
  royal.parentage={father:royal.birthTraits.father,status:'resolved',result:'宗人府据家书、接生簿和证词核实。'};
  delete k.palaceRank;k.pedigree='认领';k.recognizedAt=dateStr();k.path='入玉牒';delete k.claim;k.pending=[];k.fee=0;
  kstory(royal,`奉旨入玉牒。原用名${k.alias}，生母${m.name}，生于${k.birthDate}。`);
  outerAward('认祖归宗');if(k.alerts.includes(20))outerAward('满城风雨');
  if(k.officialId){const p=scholarById(k.officialId);if(p){p.retired=true;story(p,'奉旨交卸旧职，归宗入玉牒。');}}
  const heir=kidById(S.heir);if(heir&&k.sex==='m'){heir.sup=clamp(heir.sup-3);kstory(heir,'宗人府重录同辈排行，东宫收到了一份新玉牒。');}
  const feeling=royalRecognitionFeeling(royal,k);
  return outerNote(m,k,'认祖归宗','核定玉牒',`宗人府把${k.royalName}的名字写入玉牒，另在原户帖上注明归宗年月。`,feeling||(kidAge(k)>=10?'“请把养我的人的名字，也留在我这一页上。”':'孩子带着家里用惯的那床小被进了宫。'));
}
function outerDiscoverers(m){
  const people=[{role:'旧宫女',name:'当年替内廷传过家书的老宫女'}],q=empress(),d=S.flags.dowager,aunt=byId(m.host);
  if(inPalace(q))people.push({role:'皇后',name:fullName(q),id:q.id});
  if(d?.alive)people.push({role:'太后',name:d.fullName||d.name||'太后'});
  if(jinyiweiCommanderReady())people.push({role:'锦衣卫',name:jinyiwei().commander.name});
  if(inPalace(aunt))people.push({role:'姨母',name:fullName(aunt),id:aunt.id});
  return people;
}
function outerQuestion(k,m,who){
  const text={
    皇后:'她拿来两份相隔多年的衣料簿，指着相同的落款：“这孩子同当年的收信人，是什么关系？”',
    太后:'她将旧信推过桌面：“哀家记得你那年去了哪里。如今孩子就在跟前，往后的日子，你问过孩子想怎么过么？”',
    锦衣卫:'他将旧户帖与入宫时的名册并排放好：“日期相合，若再含糊作答，下一份折子就要送到都察院了。”',
    姨母:'她把信物翻到背面：“这针脚是她亲手教我的。陛下，我家里还有多少事，是您知道、我却不知道的？”',
    旧宫女:'她认得襁褓里那枚信物，握住孩子的手好一会儿，才小声问：“你娘一直把它留给你么？”'
  };
  return {title:who.role+'问起旧籍',sealedAnnals:true,text:who.name+'从案头取出'+k.token+'。'+text[who.role],choices:[
    {t:'据实说明，护住生母与孩子',f:()=>{k.secret=clamp(k.secret-3);k.trust=clamp(k.trust+5);return outerNote(m,k,'当面回话',who.role+' · 据实说明',who.name+'听完原委，收起旧帖，嘱咐照常照看家人。','“这一次，他肯当面把话说清。”');}},
    {t:'只认原籍，请孩子照常生活',f:()=>{chg({prestige:-3});k.trust=clamp(k.trust-5);const q=byId(who.id);if(q)cchg(q,{mood:-4});
      return outerNote(m,k,'当面回话',who.role+' · 援引原籍',who.name+'把答话写在旧帖旁，对那段空白的年月仍有疑虑。','“纸上那一栏，又空着了。”');}}
  ]};
}
function outerLateReply(k,m,ask){
  k.lateAsked=true;const p=k.officialId&&scholarById(k.officialId);
  const household=k.married||p?.spouse||p?.married||k.path==='自愿远嫁';
  let line,voice;
  if(!ask){k.lateReply='留下未寄的家书';line='你将写好的信压在抽屉底层，仍让孩子照原来的姓名过日子。';voice='“我家今日也在等一封寻常的平安信。”';}
  else if(!outerCanClaim(k)){k.lateReply='通家书，仍守原籍';line='你在信中问起近况，末尾没有再提改姓。原先的决定仍记在密匣里。';voice='“这声问候我收下，原来的名字也请给我留着。”';}
  else if(k.trust<35||household&&k.trust<65||p&&k.dispute&&k.trust<65){
    k.refused=true;k.lateReply=household?'为自家人留下':p&&k.dispute?'守住朝中立场':'谢绝迟来的名分';
    line=household?'家书寄回时多了配偶的署名。他们已用旧姓立户，不愿让全家的日子因一道诏书重新开始。':p&&k.dispute?'孩子把从前同东宫相左的奏议也寄了回来，恳请保留独立署名进言的余地。':'孩子把认亲帖退了回来，只留下那封没有用玺的问候。';
    voice='“陛下想补的是当年的事，我要守的是现在的日子。”';
  }else{k.lateReply='愿议归宗';outerBeginClaim(k);line='回信先问原家能否照常往来，随后附了亲笔呈词，愿向宗人府作证。';voice='“我愿来，但请也记下当年养我的人。”';}
  return outerNote(m,k,'暮年家书',k.lateReply,line,voice);
}
function outerPendingEvent(k,requested){
  if(!outerActive()||!k||!outerBook()?.children.includes(k)||S.over||k.sealed||!k.pending.length)return null;
  const pending=outerFamilyStories()&&!outerCanClaim(k)?k.pending.filter(p=>p!=='claim'&&p!=='council'):k.pending;
  const priority=outerIntegration()?['birth','claim','leak20','roster','father']:['birth','claim','leak20','roster'];
  const key=requested||(priority.find(p=>pending.includes(p))||pending[0]);
  if(!pending.includes(key))return null;
  if(outerFamilyStories()&&key==='council'&&(!k.claim||!outerCanClaim(k)))return null;
  const m=outerMother(k.mother),choices=[],valid=()=>outerChild(k.id)===k&&!S.over&&!k.sealed&&k.pending.includes(key);
  let title,text;
  function option(label,act,cost=0){
    const choice=outerCostChoice(label,cost,()=>{k.pending=k.pending.filter(p=>p!==key);return act();});choices.push(choice);
  }
  const note=(event,choice,line,voice)=>outerNote(m,k,event,choice,line,voice);
  const claim=()=>{if(!outerCanClaim(k))return note('保留原籍','尊重旧议','宗人府照旧封存家籍。');if(!k.claim&&!outerRequestPapers(k))return note('问本人意愿','先寄私信','宗人府先将空白呈词寄回原家，等候孩子亲笔回话。');return note('请核身世','呈送旧牍','太后案上多了一封家书，宗人府等候问话。');};
  if(key==='birth'){
    title='一封报生书';text=`${m.name}生下一个${k.sex==='f'?'女':'男'}孩，乳名${k.given}。稳婆画下${k.mark}，请你定下孩子今后住在哪里。`;
    option('接进宫，向太后说明',()=>outerPlace(k,m,'宫中'));
    option('置外宅，延请奶妈 · 月支4万两',()=>outerPlace(k,m,'外宅','',4),18);
    option('付路费，就此断联',()=>outerPlace(k,m,'断联'),4);
    for(const [family,cost,fee] of [['许',12,2],['顾',30,6]])option(`托${family}家寄养 · 月支${fee}万两`,()=>{
      const result=outerPlace(k,m,'寄养',family,fee);k.witnesses.at(-1).discretion=fee===6?94:40;return result;
    },cost);
    option('暂随生母，靠家中营生抚养',()=>outerPlace(k,m,'随母'));
  }else if(key==='late'){
    title='暮年 · 一封迟到的家书';text=`你命人找出${k.alias}出生时的报生书。夹在匣底的旧纸已经发脆，孩子也已成年。你想亲自写信，可这一次，该由收信的人决定如何回答。`;
    option(outerCanClaim(k)?'亲笔问孩子是否愿归宗':'只问近况，照旧保留原籍',()=>outerLateReply(k,m,true));
    option('把信留下，不扰现有生活',()=>outerLateReply(k,m,false));
  }else if(key==='visitResemblance'){
    title='外家探亲 · 廊下一张熟面孔';text=`${m.name}探亲时把${k.alias}也带到宫门外，${m.aunt}隔着车帘认出孩子${k.mark}。`;
    option('听她把家里的话说完',()=>{k.secret=clamp(k.secret-5);const aunt=byId(m.host),p=outerSister(m);
      const help=aunt&&p&&relGet(aunt,p)+aunt.aff>=65;
      if(aunt&&!k.witnesses.some(w=>w.name===fullName(aunt)))k.witnesses.push(outerWitness('知情的姨母',fullName(aunt)));
      if(!help)k.clues=(k.clues||0)+1;
      return note('姨母见甥',help?'替家人守密':'留下见证',text+(help?'她替孩子放下车帘，只叮嘱一路平安。':'她将相见的日子写进家书，准备向中宫说明。'),'“她为什么知道我娘小时候的乳名？”');});
  }else if(key==='school'){
    const age=kidAge(k);
    if(outerIntegration()&&(age<6||age>=18||k.schoolAge===age))return null;
    title=!outerIntegration()||age===6?'六岁的书箱':'年度教养 · '+k.alias;
    text=!outerIntegration()||age===6?'塾师、武师和账房都肯收徒。生母只问，孩子明早该往哪条街走？':
      `孩子今年${age}岁，眼下${k.lesson}。生母来信问，今年是接着学，还是换个方向？`;
    for(const lesson of Object.keys(outerLessons))option(lesson,()=>outerEducate(k,lesson));
  }else if(key==='father'){
    title='“我的爹是谁？”';text='孩子摊开那张写着生辰的纸。一栏字迹磨得看不清，偏偏只指着那里问。';
    option('告诉孩子来历',()=>{k.knowledge='知道';k.trust=clamp(k.trust+12);return note('十岁问父','坦白身世','你把出生那一日从头讲起，等孩子把问题一个个问完。','“原来大人一直知道。让我想一会儿。”');});
    option('先交给孩子信物',()=>{k.knowledge='怀疑';return note('十岁问父','留下信物',`你将${k.token}交到孩子手里，说等愿意知道时再来问。`,'“那我自己收着，别再替我藏起来。”');});
    option('不肯作答',()=>{k.trust=clamp(k.trust-14);return note('十岁问父','避而不答','你把纸折起。孩子接过去，把生父那一栏铺得很平。','“我会自己找的。”');});
  }else if(key==='retry'){
    title='落榜之后';text='名册收了，孩子把余下几年的盘算写给了你。';
    for(const next of ['候会试','候武选',...(k.foster||m.host?['候荫补']:[]),'自立门户'])option(next,()=>{
      if(next!=='自立门户')outerFileCover(k,m,next);
      k.path=next;return note('另择前程',next,'孩子收好上一次落榜的文书，给来年留了另一条路。','“落一次榜，还能自己选。”');});
  }else if(key==='adult'){
    title='成人礼后的第一封信';text=`${k.alias}满了十八岁，来信署的是户籍上的名。${k.sex==='f'?'生母带来礼部候选的消息，孩子也想知道宫门里是什么样子。':'案头摊着会试程文、武选章程和荐书。'}`;
    const paths=k.sex==='f'?['候选秀','自立门户']:['候会试','候武选',...(k.foster||m.host?['候荫补']:[]),'自立门户'];
    for(const path of paths)option(path,()=>{
      if(k.sex==='m'&&path!=='自立门户')outerFileCover(k,m,path);
      k.path=path;return note('成年去向',path,path==='候选秀'?'养家交了户帖。礼部下次开选时，会把名册送来核对。':path==='候会试'?'孩子封好考篮，等礼部开正科或恩科。':path==='自立门户'?'孩子在街口租了一间小屋，头一次自己落了房契。':'孩子先从乡试弓马、验籍起步，来年见分晓。','“这条路，我想亲自试一试。”');});
  }else if(key==='roster'){
    title='选秀名册上的旧姓';text=`礼部送来户帖：${k.alias}，生于${k.birthDate}。候选人抬手行礼，${k.mark}。${m.aunt?m.aunt+(outerFamilyStories()?'认出了娘家旧日的针法。':'认出了妹妹用过的针法。'):'老宫女在帘下多看了一眼。'}她随身带着${k.token}。`;
    option('划去名字，另给出路',()=>{k.path='自立门户';k.trust=clamp(k.trust-5);return note('应选被拦','划名','她领回折皱的户帖，追问是谁替她作了决定。','“我只想听一句实话。”');},12);
    if(outerCanClaim(k))option('停止应选，请核皇女身份',()=>{k.path='停选待核';return claim();});
    option('照常送殿核选',()=>{
      k.path='待殿选';
      if(outerIntegration()&&S.selection&&S.selection.phase!=='arrivals'){
        if(!S.cands.some(c=>c.id===k.id))S.cands.push(outerSelectionPerson(k));
      }else{
        outerQueue(k,'audience');pushNow(outerPendingEvent(k,'audience'));
      }
      return note('选前预警','照常递帖','名册送进殿去。她把信物贴身收好，跟着女史过了门槛。','“殿里有人见过我母亲么？”');
    });
  }else if(key==='audience'){
    title='殿选 · '+k.alias;text=`女史唱名。${k.alias}答了两句家乡的收成，又说起${m.name}在家如何教她做人。她的神情像极了生母。\n才学 ${rd(k.lit)} · 容貌 ${rd(k.looks)}`;
    if(outerFamilyStories())text+=`\n她${k.likeness||'眉眼像极了生母'}。${k.temper==='直率'?'问起户籍时她抬起眼，把养家人的名字一字一字念清。':k.temper==='坚韧'?'提起求学的路，她说自己在渡口背过三年书。':'她把手收在袖里，想了一会儿才答。'}`;
    option('留牌，记名答应，另院居住',()=>{
      if(outerIntegration()){
        const c=outerSelectionPerson(k);
        addConsort(c,1,`${dateStr()}选秀入宫`);
        return outerSelectionAdmitted(k,c);
      }
      k.path='宫中留名';k.palaceRank='答应';log(`选秀留牌，${k.alias}记名答应，居别院。`);k.secret=clamp(k.secret-12);if(!k.exposed&&k.secret>=40)outerAward('暗度陈仓');return note('殿选留牌','记名答应','女史领她往别院去，衣箱入册时，那枚旧信物也被人看见了。','“从这里，还看得见进城的那条路。”');
    });
    option('撂牌，送还原籍',()=>{k.path='自立门户';return note('殿选出宫','送还原籍','她拿回原籍文书，在城门口买了两包母亲爱吃的糖。','“总算可以回去问她了。”');});
  }else if(key==='recognizedFace'){
    title='别院里认出了故人';text=`${m.aunt||'太后身边的旧宫女'}认出${k.token}，又说起${k.mark}。${k.alias}把门关上，问你这两件事为何旁人都知道。`;
    const available=outerFamilyStories()?outerDiscoverers(m):[];
    const who=available.find(p=>p.role===k.discoverer?.role&&p.name===k.discoverer.name)||available[0];
    if(who)text=`${who.name}认出了${k.token}，又问起${k.mark}。${k.alias}头一次将生母的名字与当年的旧信对上。她把宫牌搁在桌上，等你听过她的意思再定去留。`;
    const protect=outerIntegration()?'护她留宫':'护她另居';
    for(const label of [protect,'调离别院','为她议远嫁','听她自己选'])option(label,()=>{
      k.knowledge=outerKnown(k);k.secret=clamp(k.secret-10);
      delete k.palaceRank;k.path=label==='听她自己选'?(k.trust<35?'出家清修':k.amb>55?'留任女史':'出宫归家'):label===protect?'别院独居':label==='为她议远嫁'?(k.trust>=55?'自愿远嫁':'婉谢婚事，归家'):'出宫归家';
      if(outerIntegration()){
        const c=byId(k.id);
        if((label===protect||k.path==='留任女史')&&c?.alive&&!c.gone&&c.outerHouseholdId===k.id){
          k.palaceRank=RANKS[c.rank];k.path='留宫自处';c.outerPrivateResidence=true;
          story(c,'她请留在原居，往后只由女史通传家书。');
        }else outerReleaseResidence(k,'依本人答复交还宫牌，另定去处。');
      }
      if(who){
        k.recognizedBy=who.role;pushNow(outerQuestion(k,m,who));
        if(label==='听她自己选'&&k.trust<20&&k.secret<20){k.path='离宫养病';k.illUntil=S.turn+3;}
      }
      return note('认出身世',label,(k.illUntil?'她已病了多时，亲自选了回家静养。':'')+`她亲自收好户帖和信物，在去向一栏写下“${k.path}”。`,'“我的后半生，请让我自己署名。”');
    });
  }else if(key==='career'){
    title='新官的第一封公牍';text='新任官员递上的奏牍与旁人的一样薄。吏部另夹一张空白考语，等你落笔。';
    for(const label of ['暗中提携','保持距离',...(outerCanClaim(k)?['请核身世']:[]),'永不相认'])option(label,()=>{
      if(label==='请核身世')return claim();
      k.patron=label==='暗中提携'?'提携':'自立';
      if(label==='暗中提携'){k.secret=clamp(k.secret-10);const p=scholarById(k.officialId);if(p){p.merit=clamp(p.merit+10);careerSetOffice(courtPerson('scholar:'+p.id),(outerIntegration()?p.entryRoute==='武选':p.bloc==='army')?'边营千总':'州府通判','考课后奉调');}}
      if(label==='永不相认'){outerDeclineClaim(k);k.trust=clamp(k.trust-18);}
      return note('仕途',label,label==='暗中提携'?'吏部留意到新官的调令来得特别快。':label==='永不相认'?'你封还了私信，只收下署着官名的公文。':'你将空白考语退回，请吏部照实考课。','“我的名字，写在考册第几页？”');
    });
  }else if(key==='motherReturn'){
    title='宫门里一针旧线';text=`${m.name}凭${m.trade==='女医'?'医术':'手艺'}得人举荐，来宫中应差。在宫门两队人错身的时候，她一眼认出了自己养大的孩子，嘴唇动了动，却只问了一句：“这件衣裳还合身么？”`;
    for(const keep of [true,false])option(keep?'准她留下当差':'准予告归',()=>{
      if(keep){m.palaceWork=m.trade==='女医'?'医女':'掌衣嬷嬷';k.secret=clamp(k.secret-6);}
      return note('生母重见',keep?'留用':'告归',keep?'她领了腰牌，把孩子衣袖上脱的一针补好，才随众人离开。':'她临行只问能否再见一面，孩子亲自送她到门外。','“隔着这么多人，我还是认得她的手。”');});
  }else if(key==='leverage'){
    title='一页旧籍的价钱';const broker=courtPerson(k.broker);
    text=`${broker?.p.name||'权臣的门客'}把旧户帖的摹本夹在荐书里，求你调走与他意见相左的官员。那笔字出自知情人之手。`;
    if(outerFamilyStories()&&k.officialId&&kidById(S.heir))text+=' 又附了一份请这名官员出面指摘东宫的奏稿，等御前示下。';
    if(outerFamilyStories()&&k.officialId&&kidById(S.heir))option('取回奏稿，让本人决定是否署名',()=>{
      const heir=kidById(S.heir),willing=k.knowledge==='怨恨'||k.amb>=65;
      if(willing){heir.sup=clamp(heir.sup-4);k.secret=clamp(k.secret-6);k.dispute||={heir:heir.id};}
      return note('权臣借势',willing?'署名直陈':'拒绝附署',willing?'他删去奏稿里的身世影射，却保留了对东宫军功的异议。':'他将末尾空白的署名处折好，退还门客。',willing?'“这话我自己担得起。”':'“有谁握着我的旧籍，也不能代我说话。”');});
    option('封还荐书，护住证人',()=>{k.secret=clamp(k.secret-5);k.trust=clamp(k.trust+8);return note('拒受要挟','护住证人','你命人将证词封存，两份文书分开办理。孩子留在家中的旧物先一步送到了安全的地方。');});
    option('敲打递信人',()=>{if(broker)broker.p.trust=clamp(broker.p.trust-12);k.clues=(k.clues||0)+1;return note('权臣试探','退回摹本','荐书当面退还。来人不再开口，回府后却又命人抄了一份。');});
  }else if(key==='dispute'){
    const opponent=k.dispute.sibling?outerChild(k.dispute.sibling):kidById(k.dispute.heir);
    const name=opponent?.alias||opponent?.name||'旧议的署名人';
    title='两封相左的奏议';text=`${k.alias}请免河工沿岸民夫的秋役，${name}却怕误了修堤。两封折子摊在御案上，谁也不知道另一个署名和自己有什么关系。`;
    for(const side of ['准免秋役','照旧修堤','命二人合勘'])option(side,()=>{
      const p=scholarById(k.officialId);if(p)p.merit=clamp(p.merit+(side==='照旧修堤'?-2:3));
      const heir=k.dispute.heir&&kidById(k.dispute.heir);if(heir)heir.sup=clamp(heir.sup+(side==='准免秋役'?-3:2));
      k.secret=clamp(k.secret-3);return note('廷议相左',side,side==='命二人合勘'?'两人同去堤上，在一张舆图的两头分别按下指印。':'批红送回各衙，有朝臣将两人的来历也抄在了奏议旁。','“我想让陛下看到的是河上的人。”');});
  }else if(key==='search'){
    title='宫门前的一封旧信';text=`${jinyiweiCommanderReady()?'锦衣卫指挥使在宫门前拦下了来访者，先来问应不应放行。':'门吏从宫门前传进一封求见书。'}${k.alias}找到${k.token}，想亲自问生母一句话。`;
    for(const label of ['准回乡核对','请内侍代转','封还来信'])option(label,()=>{
      if(label==='封还来信'){k.searchDone=true;k.trust=clamp(k.trust-12);k.knowledge='怀疑';return note('自查身世',label,'来信仍带着原封退回。孩子把信塞回行囊，记下了守门人的名字。','“今天问不到，我还记得回家的路。”');}
      k.inquiry={due:S.turn+1,personal:label==='准回乡核对'};return note('循信问母',label,'赶路的人带走了旧信的摹本。生母要先看清印记，约定次月回话。');});
  }else if(key==='proof'){
    const told=outerFamilyStories()?(m.trust+m.aff>=85||m.trait==='倔强'):m.trust>=45||m.trait==='倔强';
    title='生母的回话';text=told?`${m.name}找出当年压在箱底的信封，把缺去的一角与旧信合在一处。“你那天问我，你爹是谁。今天娘亲口告诉你。”`:
      `${m.name}认得${k.token}，却迟迟没有点头。“我知道一张户帖能改一个人的日子，你真的想改么？”`;
    if(m.closed==='已故')text='生母已经不在人世。留下的箱底压着一封信，笔迹与多年前的家书相同。';
    if(outerFamilyStories()&&k.denied&&told&&k.trust<35)text+=' 孩子展开当年被封还的呈词：“原来您明知我是您的孩子。”从此只肯以原姓进言。';
    option('让孩子自己听完',()=>{k.searchDone=true;delete k.inquiry;k.knowledge=told?outerKnown(k):'怀疑';
      return note('自查身世','听生母回话',text,told?(k.trust<35?'“我明白了，可我不愿换姓。”':'“我终于知道，我的名字是从哪里来的。”'):'“不急，东西我自己留着。”');});
    if(outerFamilyStories())option('将信物留给孩子，请本人决定信不信',()=>{
      k.searchDone=true;delete k.inquiry;const believe=told&&(k.trust>=45||k.clues>0||k.temper==='坚韧');
      k.knowledge=believe?outerKnown(k):'怀疑';return note('信物在手',believe?'愿信这桩旧事':'保留疑问',k.alias+'将'+k.token+'同接生簿并在一起，自己收起了两样东西。',believe?'“这是我的身世，让我自己说出口。”':'“我还想问问当年送信的人。”');});
  }else if(key==='claim'){
    const stage=k.claim?.step;if(!stage||!outerCanClaim(k))return null;title='归宗 · '+stage;text=`${k.alias}的户帖、接生簿与${k.token}同置案头。`;
    if(stage==='太后问话')text+=ensureDowager()?.alive?'太后问：“这些年是谁养的？孩子自己愿不愿回来？”':'太后已故，宗室长辈代为会问。';
    if(outerFamilyStories()&&stage==='太后问话'&&outerOldTie(m))text+=' 她翻出旧日的家书。'+outerOldTie(m).proof;
    if(stage==='宗人府核查')text+='宗人府逐一勘合接生人的口供、原籍与当年的私信。';
    if(stage==='改录玉牒')text+='核证俱齐，玉牒空着最后一行，等候用印。';
    option(stage==='改录玉牒'?'用印入玉牒':'呈递证词，听取回话',()=>{
      if(kidAge(k)>=18&&k.trust<30){delete k.claim;k.refused=true;return note('谢绝归宗','听本人回话','孩子婉拒了改姓，将原籍文书收回袖中。','“养我长大的那个家，我认。”');}
      if(!k.claim.supplement&&(stage==='太后问话'&&m.host||stage==='宗人府核查'&&(k.register!=='本姓'||k.clues))){
        k.claim.supplement=true;k.claim.due=S.turn+2;return note('归宗补证',stage,'家籍上有待说清的地方。宗人府另取一份旁证，两个月后再议。');}
      if(outerFamilyStories()&&stage==='改录玉牒'&&k.sex==='m'&&kidAge(k)>=18&&!k.heardCouncil){
        outerQueue(k,'council');return note('玉牒待议','听取宗亲与朝臣意见','御史问旧籍是否确实，中宫外家也上了帖子。礼官将用印一事留待当面议明。');
      }
      if(stage==='改录玉牒'){const line=outerRoyalEntry(k,m);outerQueue(k,'history');return line;}
      k.claim={step:stage==='太后问话'?'宗人府核查':'改录玉牒',due:S.turn+1};return note('归宗查证',stage,'证词由两人分别画押，封送下一处查验。');
    });
    option('暂缓归宗',()=>{delete k.claim;return note('暂缓归宗',stage,'家籍暂存封匣，孩子的衣食照原有安排。');});
  }else if(key==='council'){
    title='玉牒用印前 · 廷议';text=empress()?'皇后把东宫的名册摊开：“孩子可以认，但旧日的抚养、今日的排行，都该有个交代。”中宫外家递上异议，御史请核血统与口供。':'宗亲与御史请再审旧帖，尤其问到正式皇嗣的排行。印还在匣里。';
    option('呈明原籍与证词，依序重排行次',()=>{k.heardCouncil=true;chg({prestige:-3});const q=empress();if(q)cchg(q,{mood:-3});k.claim.due=S.turn+1;
      return note('归宗廷议','呈证候印','御史收下原件，宗亲在排行旁加注生年。宗人府下月再请用印。','“旧名字与旧家人，请都写明。”');});
    option('收回呈请，保留原籍',()=>{delete k.claim;return note('归宗廷议','暂不改籍','外家与御史的意见存案，皇帝撤下了这一次的用印呈请。');});
  }else if(key==='history'){
    title='史官候笔';text=`${k.recognizedAt}，${k.royalName}入玉牒。史官请示本纪如何落笔。`;
    for(const publish of [true,false])option(publish?'记入本纪':'永远封存',()=>{k.history=publish?'入本纪':'永封';
      const line=`${k.recognizedAt}，帝认皇${k.sex==='f'?'女':'子'}${k.royalName}，入玉牒。`;
      if(publish){
        log(line,1);S.log.at(-1).d=k.recognizedAt;
        if(outerIntegration())recordRegnalEntry('归宗',line,k.recognizedAt,k.recognizedTurn??S.turn);
      }
      return note('本纪定笔',k.history,publish?line:'史官收回空白的纸页，家书仍归密匣。');});
  }else if(key.startsWith('leak')){
    const level=Number(key.slice(4)),relative=m.host&&byId(m.host);
    title={60:'街口的流言',40:'御史核查外籍',20:'隐情已达御前'}[level];
    text=level===60?'送信人在茶摊说漏了一个乳名。次日，同一句话已从另一条街传回来。':level===40?'御史带来两份户帖，问同一笔银子为何年年付给同一家人。':'知情人的说法已经对上了。太后、皇后和朝臣都在等一句明白的答复。';
    const tie=outerOldTie(m);if(tie)text+='\n'+tie.proof;
    if(outerFamilyStories()&&level===60)text='街口有人打听当年的事，消息从茶摊传到家门口。';
    if(k.reports?.[level])text+='\n'+k.reports[level];
    const sisterBond=relative&&outerSister(m)?relGet(relative,outerSister(m)):0;
    if(relative)text+=relative.aff+sisterBond>=65?'宫里的姊妹愿替家人作证，也劝你护住孩子。':'宫里的姊妹认出了笔迹，要求在太后面前说清楚。';
    const consequence=()=>{
      const stability=outerIntegration()?outerHaremFall(level,m):0;
      if(level===40&&!k.broker&&k.witnesses.some(w=>w.active&&w.loyal<55)){
        const broker=careerPeople().filter(x=>x.p.id!==k.officialId&&officialServing(x.p)&&x.p.ability>=70).sort((a,b)=>b.p.ability-a.p.ability)[0];
        if(broker){k.broker=broker.key;outerQueue(k,'leverage');}
      }
      chg(level===60?{prestige:-1}:{prestige:-(level===20?8:3)-(m.host?2:0),people:level===20?-5:-1});if(relative){
      cchg(relative,{mood:-4});
      if(level===20&&relative.rank>1&&relative.rank<8&&relative.aff<45){relative.rank--;story(relative,'外家旧事经查，受牵连降一位。');}
    }
    const queen=empress();if(queen)cchg(queen,{mood:level===20?-8:-3});
    if(outerFamilyStories()&&level<=40){
      const people=outerDiscoverers(m).filter(p=>['太后','皇后'].includes(p.role));
      if(level===40&&people.length)pushNow(outerQuestion(k,m,people[0]));
      if(level===20){m.trust=clamp(m.trust-(relative?12:6));outerNote(m,k,'生母家门受问','留存家书',m.name+'的家人被请到县衙核实户籍，回家之后仍得应付邻里的打听。');
        if(relative&&people.length)for(const who of people.slice().reverse())pushNow(outerQuestion(k,m,who));}
    }
    return stability?fx('后宫稳定−'+stability):'';
    };
    if(level===20){
      option(outerCanClaim(k)?'公开护住孩子，呈请归宗':'公开护住家人，尊重原籍',()=>{const impact=consequence();k.exposed=true;outerAward('满城风雨');return claim()+impact;});
      option('不认血缘，保留原籍',()=>{const impact=consequence();k.exposed=true;outerDeclineClaim(k);k.trust=clamp(k.trust-20);k.knowledge=outerKnown(k);return note('公开风波','不认血缘','原籍保住了，门前围观的人却过了许久才散。','“你既说出口，我也记住了。”')+impact;});
    }else option('听取来报，护送家人回去',()=>{const impact=consequence();return note(title,'护送家人',text)+impact;});
  }else return null;
  return {title,text,sealedAnnals:true,por:{...k,courtGuest:true,name:k.alias},valid,choices};
}
function outerEducate(k,lesson){
  k.lesson=lesson;k.schoolAge=kidAge(k);
  return outerNote(outerMother(k.mother),k,'年度教养',lesson,{读书:'塾师教孩子在书皮写下姓名，说这是自己的第一册书。',习武:'师傅先教孩子站稳，说把力气收住和使出去一样难。',经商:'生母把零钱放在桌角，让孩子自己做今天第一笔账。',随其性情:'家里留出半日空闲，由孩子选一件真想学的事。'}[lesson],'“明年再来看，我能自己做给你看。”');
}
