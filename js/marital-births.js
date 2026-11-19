/* 联姻后的亲疏、九月孕程与外家新生儿。孩子有真实父母，不列为皇嗣。 */
const MARITAL_BONDS={affectionate:'两情相悦',respectful:'相敬如宾',distant:'尚有隔阂'};
function ensureMaritalBond(p){
  if(p.maritalBond)return p.maritalBond;
  const seed=marriageHash(`${p.id}:${p.spouse?.personId||p.spouse?.id}:marital-bond`),kind=Object.keys(MARITAL_BONDS)[seed%3];
  return p.maritalBond={kind,wife:kind==='affectionate'?78:kind==='respectful'?52:32,husband:kind==='affectionate'?82:kind==='respectful'?58:24,last:S.turn};
}
function maritalFather(p,preg=p.natalPregnancy){
  const id=preg?.fatherId||p.spouse?.personId;return id?careerPeople().find(x=>x.p.id===id):null;
}
function natalMarriageNotice(c,p,title,text,husbandThought,emotion=.4,preg=p.natalPregnancy){
  natalRecord(c,p,`【${title}】${text}`,emotion);log(`【${title}】${text}`,1);
  const father=maritalFather(p,preg);
  if(father&&officialAlive(father.p)){
    const line=`【${title}】${text} ${husbandThought}`;courtPersonRecord(father,line);
    father.p.householdMood=emotion<0?'悲恸':ensureMaritalBond(p).kind==='distant'?'牵挂中仍有拘谨':'欢喜与牵挂';
    NPCMemory.record(S,{type:'marital-birth',time:S.turn,participants:[p.id,father.p.id],object:text},[{person:father.p.id,subject:p.id,interpretation:husbandThought,emotion,impact:90}]);
  }else if(!father&&p.spouse){(p.spouse.story ||= []).push({d:dateStr(),t:`【${title}】${text} ${husbandThought}`});}
}
function natalPregnancyReady(p){
  if(typeof outerActive==='function'&&outerActive()&&outerBook()?.mothers.some(m=>m.relative===p.id&&(m.preg||m.restUntil>S.turn)))return false;
  if(!careersActive()||!p.alive||!p.married||p.widow||p.consortId||p.natalPregnancy||p.spouse?.alive===false||!p.spouse)return false;
  if(natalAge(p)<20||natalAge(p)>40||(p.lifeCourse?.children||0)>=2||S.turn-(p.lifeCourse?.lastBirth??-99)<24)return false;
  return !p.spouse.personId||officialAlive(maritalFather(p)?.p);
}
function beginNatalPregnancy(c,p,{unconfirmed=false}={}){
  if(!natalPregnancyReady(p))return false;
  const bond=ensureMaritalBond(p),father=maritalFather(p);
  p.natalPregnancy={conceived:S.turn,due:S.turn+9,fatherId:father?.p.id||p.spouse.id,fatherName:father?.p.name||p.spouse.name,fatherSur:p.spouse.sur,
    sex:chance(.5)?'m':'f',seed:ri(1,2e9),difficult:chance(.015)};
  if(unconfirmed){
    p.natalPregnancy.unconfirmed=true;
    if(journalContentVersion()>=102)p.natalPregnancy.reportingHost=c.id;
    if(outsideParentageActive())Object.assign(p.natalPregnancy,{imperialParentage:chance(.55),conceptionGen:S.gen,conceptionEmperor:E().sur+E().name});
    (p.lifeCourse||={}).last=S.turn;return true;
  }
  (p.lifeCourse ||= {}).last=S.turn;p.maritalMood=bond.kind==='affectionate'?'有喜，也盼着他的照料':bond.kind==='respectful'?'欢喜中谨慎将养':'有孕后更盼有人听她说话';
  const thoughts={affectionate:`${p.spouse.name}读信时喜得又看一遍，叮嘱自己再忙也要问她饮食安睡。`,respectful:`${p.spouse.name}依礼备下补养之物，请家中细照料，关切仍说得含蓄。`,distant:`${p.spouse.name}听说要做父亲，心中有喜，也不知该怎样亲近妻子，回信写得拘谨。`};
  natalMarriageNotice(c,p,'外家有喜',`${p.name}诊出有孕，给${fullName(c)}写信报喜，也说起初次等孩子的忐忑。`,thoughts[bond.kind]);return true;
}
function natalPregnancyTick(){
  if(!careersActive())return;
  const seen=new Set();for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);
    for(const p of natalPeople(h).slice()){
      const preg=p.natalPregnancy;if(!preg||!p.alive||p.consortId)continue;
      if(marriedSisterAffairsActive())noteMarriedSisterPregnancy(p,preg);
      if(journalContentVersion()>=89&&preg.unconfirmed&&S.turn-preg.conceived>=1&&!preg.privateNoticeQueued)queueOutsidePregnancyNotice(c,p,preg);
      if(S.turn<preg.due)continue;
      const child=addNatalPerson(c,h,preg.sex,0,preg.seed,false);child.parentRelativeId=p.id;child.fatherId=preg.fatherId;child.fatherName=preg.fatherName;child.sur=preg.fatherSur||c.sur;child.name=child.sur+child.given;child.born=S.turn;child.age=0;
      const life=p.lifeCourse ||= {};life.children=(life.children||0)+1;life.lastBirth=S.turn;life.last=S.turn;
      const bond=ensureMaritalBond(p),father=maritalFather(p,preg),sex=child.sex==='m'?'男孩':'女孩';
      if(preg.difficult){
        p.alive=false;p.age=natalAge(p);p.deathReason='难产去世';p.death={kind:'childbirth',d:dateStr(),turn:S.turn,reason:'生产后失血，医治无效'};delete p.visit;
        p.maritalMood='难产离世';
        const grief=bond.kind==='affectionate'?`${preg.fatherName}握着旧信失声痛哭，孩子的啼哭也换不回她一句回应。`:bond.kind==='respectful'?`${preg.fatherName}按礼料理丧事，在收起她的衣物时终于红了眼眶。`:`${preg.fatherName}默立在门前，想到许多话未曾说过，疏远也没能免去此刻的伤怀。`;
        natalMarriageNotice(c,p,'外家产厄',`${p.name}生下${sex}${child.name}后难产去世，孩子幸而平安。家族名册保留她的姓名、婚姻与死因。`,grief,-.9,preg);
        if(father&&officialAlive(father.p)){father.p.widower={wifeId:p.id,name:p.name,turn:S.turn};father.p.married=false;father.p.householdMood='丧妻悲恸';}
        for(const sister of paternalFamily(c).filter(x=>S.consorts.includes(x)&&x.alive)){cchg(sister,{mood:-15});if(!['心如死灰','怨恨'].includes(xinOf(sister)))setXin(sister,'悲恸',`娘家姐妹${p.name}难产去世`);}
        story(child,`生母${p.name}生产后去世，由家中长辈照料。${preg.unconfirmed?'婚籍所载父亲':'父亲'}${preg.fatherName}。`);
      }else{
        bond.wife=clamp(bond.wife+(bond.kind==='distant'?2:5));bond.husband=clamp(bond.husband+(bond.kind==='distant'?3:6));
        p.maritalMood=bond.kind==='distant'?'添了孩子，也仍在学着相处':'喜得孩子，渐渐安心';p.mood=clamp((p.mood??65)+10);
        const joy=bond.kind==='affectionate'?`${preg.fatherName}既欢喜又心疼，先问妻子是否安稳，再小心去看襁褓。`:bond.kind==='respectful'?`${preg.fatherName}郑重道了一声辛苦，照礼备好报喜与谢医之事。`:`${preg.fatherName}见了襁褓才有为父的真切，向妻子道谢时仍显得生涩。`;
        natalMarriageNotice(c,p,'外家添丁',`${p.name}平安生下${sex}${child.name}，将母子平安的家书寄给${fullName(c)}。${father&&!officialAlive(father.p)?'这是亡夫留下的遗腹子，欢喜里也有缺席的悲伤。':''}`,joy,.6,preg);
        story(child,preg.unconfirmed?`由${p.name}在宫外生下，按外家子女入册。`:`生于${p.name}与${preg.fatherName}之家，是外家子女，不列皇嗣。`);
      }
      if(preg.unconfirmed){noteMarriedSisterChild(p,child);if(outsideParentageActive())initializeOutsideParentage(child,preg);if(journalContentVersion()>=89)queueOutsideBirthNotice(c,child);}
      (p.pregnancyHistory ||= []).push({...preg,childId:child.id,born:S.turn,outcome:preg.difficult?'maternal-death':'safe'});delete p.natalPregnancy;
    }
  }
}
const birthsNatalLifeTick=natalLifeTick;
natalLifeTick=function(){natalPregnancyTick();return birthsNatalLifeTick();};
const birthsMarriage=marrySister;
marrySister=function(c,p,match,options){const result=birthsMarriage(c,p,match,options);if(careersActive()&&result!==false){delete p.maritalBond;const bond=ensureMaritalBond(p);natalRecord(c,p,`【婚后初见】与${match.name}成婚后，两人的相处是「${MARITAL_BONDS[bond.kind]}」。${bond.kind==='affectionate'?'言谈投契，连家书也常凑在一处写。':bond.kind==='respectful'?'彼此守礼，体贴藏在日常照料里。':'成婚是两家的安排，彼此仍需慢慢熟悉。'}`,.2);}return result;};
const birthsNatalStatus=natalStatus;
natalStatus=function(p){return !p.alive&&p.deathReason?'已故 · '+p.deathReason:p.natalPregnancy?`${birthsNatalStatus(p)} · 有孕${Math.min(9,Math.max(1,S.turn-p.natalPregnancy.conceived+1))}月`:birthsNatalStatus(p);};
const birthsVisitReady=natalVisitReady;
natalVisitReady=function(c,p){return (!careersActive()||!p.natalPregnancy||S.turn-p.natalPregnancy.conceived<6)&&birthsVisitReady(c,p);};
const birthsMeeting=natalMeetingEvent;
natalMeetingEvent=function(c,p){const ev=birthsMeeting(c,p);if(!ev||!careersActive()||!p.natalPregnancy)return ev;
  ev.text=`${p.name}有孕后入宫小住，向${fullName(c)}说起夜里的不安：“看见姐姐妹妹，总觉得有些话敢说出口了。”她希望听些将养的经验，也盼有人安静陪一会儿。`;
  ev.choices.unshift({t:'让姐妹相伴，安排太医问安',f:()=>{if(!natalInPalace(c,p)||!p.natalPregnancy)return null;const text=`${p.name}有孕入宫，与${fullName(c)}说起待产的担忧。姐妹相伴、太医问安，她觉得自己不必独自硬撑。`;natalRecord(c,p,text,.5);p.mood=clamp((p.mood??65)+8);relAdd(c,p,5);return text;}});return ev;
};
const birthsLifePanel=natalLifePanel;
natalLifePanel=function(c,p){const bond=p.maritalBond;return birthsLifePanel(c,p)+(bond||p.natalPregnancy?detailSection('夫妻相处与孕程',`${bond?`<p>${MARITAL_BONDS[bond.kind]} · 她的亲近 ${bond.wife} / 对方的亲近 ${bond.husband}</p>`:''}${p.natalPregnancy?`<p>有孕${Math.min(9,Math.max(1,S.turn-p.natalPregnancy.conceived+1))}月 · 约${Math.max(0,p.natalPregnancy.due-S.turn)}个月后分娩。${S.turn-p.natalPregnancy.conceived>=6?'临近产期，留在家中将养，暂不入宫远行。':''}</p>`:''}`):'');};
const birthsSpousePanel=officialSpousePanel;
officialSpousePanel=function(person){
  const children=[],seen=new Set();for(const c of S.consorts)for(const p of natalPeople(houseOf(c)))if(p.fatherId===person.p.id&&!seen.has(p.id)){children.push({c,p});seen.add(p.id);}
  const widow=person.p.widower,host=widow&&S.consorts.find(c=>natalPeople(houseOf(c)).some(p=>p.id===widow.wifeId));
  const recognized=outsideParentageActive()?S.children.filter(k=>k.outsideFamilyOrigin?.fatherId===person.p.id):[];
  return birthsSpousePanel(person)+(widow?detailSection('亡妻',`<p>${host?`<button class="person-link" onclick="A.go('natal','${host.id}:${widow.wifeId}')">${esc(widow.name)} ↗</button>`:esc(widow.name)} · 难产去世。${esc(person.p.householdMood||'')}</p>`):'')+(children.length?detailSection('家中子女',children.map(({c,p})=>`<button class="person-link" onclick="A.go('natal','${c.id}:${p.id}')">${esc(p.name)} · ${natalAge(p)}岁 · ${p.sex==='m'?'儿子':'女儿'}</button>`).join(' ')):'')+
    detailSection('曾在家中照料的孩子',recognized.map(k=>`<p><button class="person-link" onclick="A.go('kid',${k.id})">${esc(k.outsideFamilyOrigin.name)} ↗</button> · 已认回宫中</p>`).join(''));
};
function natalFatherPanel(p){
  if(p.unconfirmedParentage){const result=p.outsideParentage?.privateInquiry;
    return detailSection('身世未明',result?.status==='complete'?`<p>生父：${result.imperial?'皇帝（'+esc(result.fatherName)+'）':esc(result.fatherName)} · 锦衣卫已核实。</p><p>身份仍为身世未明，婚籍所载亲缘与原家的照料不变。</p>`:'<p>关于生父的疑问尚无定论。原有亲缘依家籍保留。</p>');}
  if(['proved','stayed'].includes(p.outsideParentage?.status))return '';
  if(!p.fatherId)return '';const father=careerPeople().find(x=>x.p.id===p.fatherId);
  return detailSection('父系亲缘',`<p>父亲：${father?careerLink(father):esc(p.fatherName||'家中未详录')}${father?' · '+esc(officialStatus(father.p)):''}</p>`);
}
