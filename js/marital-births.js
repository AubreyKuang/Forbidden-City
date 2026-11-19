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
  if(!careersActive()||!p.alive||!p.married||p.widow||p.consortId||p.natalPregnancy||p.spouse?.alive===false||!p.spouse||p.spouse.royalId!=null)return false;
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
      queenKinCareMonth(c,h,p);
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

// These children keep their original names and family records, including after palace adoption.
function queenWardResident(p){
  const care=p?.kinCare;
  return care?.decision==='adopt'&&!care.returned&&p.alive&&natalAge(p)<18&&inPalace(byId(care.queen));
}
function queenWardChildPanel(c,p){
  const care=p.kinCare;
  if(!['adopt','aid'].includes(care?.decision))return '';
  const status=queenWardResident(p)?'现随养母住在'+byId(care.queen).palace:care.decision==='aid'?'留在原家，由宫中照拂':'曾入宫受养';
  return detailSection('外家安置',`<p>${esc(status)}。生母${esc(care.motherName)} · ${care.decision==='adopt'?'养母':'请旨照料'}${esc(care.queenName)}。</p>`);
}
function queenWardFamilyPanel(q){
  const entries=(q.kinWards||[]).map(ref=>natalEntry(ref.host,ref.child)).filter(Boolean);
  if(!entries.length)return '';
  return detailSection('抚养的外家孩子',entries.map(({c,p})=>
    `<button class="person-link" onclick="A.go('natal','${c.id}:${p.id}')">${p.sex==='m'?'养子':'养女'} ${esc(p.name)} ↗</button> · ${natalAge(p)}岁 · ${queenWardResident(p)?'同住宫中':esc(natalStatus(p))}`).join('<br>'));
}
function kinCareRecord(people,line){
  for(const p of new Set(people.filter(Boolean))){p.story||=[];story(p,'【外家安置】'+line);}
}
function queenKinCareMonth(c,h,child){
  if(journalContentVersion()<159||!child.alive)return;
  const care=child.kinCare;
  if(care?.decision==='adopt'&&!care.returned&&!queenWardResident(child)){
    care.returned=true;
    kinCareRecord([child,byId(care.queen)],natalAge(child)>=18?`${child.name}已经成人，辞别宫中住处，在外安家，仍以${child.sex==='m'?'养子':'养女'}之礼问候养母。`:`养母已不能在宫中照料${child.name}，由原家接回抚养。`);
  }
  if(care?.decision==='aid'&&!care.receipt&&S.turn>=care.turn+3){
    care.receipt=true;
    kinCareRecord([child,byId(care.aunt),byId(care.queen)],`家里为${child.name}送来回信：先前宫中送去的银钱已支给乳母，孩子的襁褓也换大了一号。`);
  }
  // A save without the original modal may still carry its unanswered petition.
  if(care?.decision==='pending'){
    if(care.turn>=S.turn||S.turn-child.born>6||care.queen!==empress()?.id)return;
  }else if(care)return;
  if(child.consortId||child.exiled||child.unconfirmedParentage||child.outsideFamilyOrigin||!child.parentRelativeId||
    S.turn<=child.born||S.turn-child.born>6)return;
  const m=h.relatives.find(p=>p.id===child.parentRelativeId);
  if(!m||m.alive||m.death?.kind!=='childbirth'||m.death.turn!==child.born||m.parentRelativeId||m.motherRelativeId||m.natalCollateral)return;
  const q=empress();if(!inPalace(q))return;
  const sisters=paternalFamily(c).filter(s=>S.consorts.includes(s)&&inPalace(s)&&['姐姐','妹妹'].includes(natalLabel(s,m)));
  const aunt=sisters.includes(q)?q:sisters.sort((a,b)=>relGet(q,b)-relGet(q,a)||a.id-b.id)[0];
  if(!aunt)return;
  const roll=marriageHash('kin-care:'+child.id+':'+q.id)%100;
  if(aunt!==q&&roll>=(relGet(q,aunt)<0?30:65)){child.kinCare={decision:'quiet'};return;}
  const father=maritalFather(m,{fatherId:child.fatherId})?.p||m.spouse;
  const fatherAlive=!!father&&father.alive!==false&&!m.widow;
  const consent=!fatherAlive||marriageHash('kin-care-consent:'+child.id)%100<65;
  const guardian=fatherAlive?father.name:'家中长辈',ward=child.sex==='m'?'养子':'养女';
  const letter=consent?`${guardian}托人来问，若宫里肯接去照看，能否留着孩子原来的名字，往后也让两家常通音信。`:
    `${guardian}把孩子的小衣一件件理好，回信说：“想把孩子留在家里。若宫中肯替我家寻个可靠的乳母，我就能腾出手料理她的后事了。”`;
  const plea=aunt===q?`“${m.name}是臣妾的${natalLabel(q,m)}。上封家书还在同我商量孩子的小名，如今信上写的是${child.name}的生辰，旁边就是她的忌日。”`:
    `${cName(q)}将${cName(aunt)}的家书递给你：“她的${natalLabel(aunt,m)}${m.name}没能熬过生产。信里记下了孩子的名字，${child.name}。臣妾读到这里，想为这孩子求个恩典。”`;
  const valid=()=>byId(q.id)===q&&inPalace(q)&&q===empress()&&inPalace(aunt)&&child.alive&&!child.consortId&&child.kinCare?.decision==='pending'&&child.kinCare.queen===q.id;
  child.kinCare={decision:'pending',queen:q.id,queenName:fullName(q),aunt:aunt.id,motherName:m.name,turn:S.turn};
  function decide(decision){
    if(!valid()||decision==='adopt'&&!consent||decision==='aid'&&E().treasury<5)return null;
    const record=child.kinCare;record.decision=decision;record.turn=S.turn;
    let line;
    if(decision==='adopt'){
      (q.kinWards||=[]).push({host:c.id,child:child.id});delete child.visit;
      if(S.flags.familyNominees)S.flags.familyNominees=S.flags.familyNominees.filter(n=>n.relative!==child.id);
      line=`依家中所愿，${child.name}入${q.palace}，成为${cName(q)}的${ward}。皇后收下襁褓，也收好了写着生母${m.name}姓名的生辰帖，约定家里仍可来信问候。`;
    }else if(decision==='aid'){
      chg({treasury:-5});line=`${child.name}留在原家。陛下拨了五万两作抚育之资，命内务府访得可靠乳母，由家中择用。皇后嘱家里过三个月捎一句平安。`;
    }else line=`陛下让${guardian}照旧抚养${child.name}。${cName(q)}收起生辰帖，亲自写了一封慰问信送还家中。`;
    kinCareRecord([child,aunt,q,fatherAlive?father:null],line);log(line,1);return line;
  }
  pushEv({title:'皇后请旨 · 襁褓何依',por:q,valid, text:plea+'\n'+letter+'\n'+(consent?`皇后道：“臣妾愿收${child.name}做${ward}。若让孩子留在家里，也求陛下照拂一程。”`:'皇后道：“家里舍不得分开，便让他们守在一起。陛下能不能帮他们过了这一阵？”'),
    choices:[...(consent?[{t:`准皇后收为${ward}，接入宫中`,f:()=>decide('adopt')}]:[]),
      {t:'留在原家，拨五万两照拂',cond:()=>E().treasury>=5,why:'国库不足五万两',f:()=>decide('aid')},
      {t:'由原家照料，准皇后写信慰问',f:()=>decide('family')}]});
}

A.visitQueenWard=function(host,id){
  if(!S||S.over||modalOpen)return;
  const e=natalEntry(host,id),p=e?.p;if(!p||!queenWardResident(p))return;
  const q=byId(p.kinCare.queen),age=natalAge(p),name=p.name;
  const text=age<2?`${fullName(q)}把你引到摇篮边。乳母刚哄睡${name}，小手还攥着被角。她放轻了声音：“今日吃得好，睡得也安稳。下回给家里写信，我就这样告诉他们。”`:
    age<7?`${name}听见养母唤自己的名字，从小案旁跑过来，把刚叠好的纸船递到你面前：“这是要给家里看的。”`:
    `${name}在${q.palace}读外家来信，见你来了便合上信纸问安。养母已替孩子备好纸墨，让回信里的话自己写。`;
  pushEv({title:'探望养子女',por:natalPortrait(p),cast:[q],valid:()=>queenWardResident(p),text,choices:[ok1]});
};
