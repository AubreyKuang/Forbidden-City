/* 官员议婚：名帖指向真人，问意与诏书分开，婚后继续沿用原有家族与公主府。 */
const officialMarriageActive=()=>!!S&&!S.over&&journalContentVersion()>=19;
const officialMarriageState=()=>S.officialMarriages ||= {guests:[],couples:[]};
const officialMarriageAge=p=>Number.isFinite(p.born)?natalAge(p):p.age||0;
function officialMarriageRef(person){return {key:person.key,id:person.p.id,gen:S.gen};}
function officialMarriagePerson(ref){
  if(!ref)return null;
  const current=(ref.gen===S.gen||retainedFamiliesActive()&&!!familyHostById(String(ref.key).split(':')[0])||String(ref.key).startsWith('scholar:'))&&courtPerson(ref.key);
  if(current?.p?.id===ref.id)return current;
  const [cid,role]=String(ref.key).split(':'),court=(S.previousCourts||[]).find(c=>c.gen===ref.gen);
  const c=court?.consorts.find(c=>String(c.id)===cid),p=c?.house&&officialPerson(c.house,role);
  return p?.id===ref.id?{p,key:ref.key,archived:true}:null;
}
function officialMarriageWomen(){
  const out=[],seen=new Set();
  for(const c of S.consorts){const h=houseOf(c);if(!h)continue;
    for(const p of natalPeople(h)){if(p.sex!=='f'||seen.has(p.id))continue;seen.add(p.id);out.push({kind:'family',id:p.id,host:c.id,gen:S.gen,p,c,h});}
  }
  return out;
}
function officialMarriageBride(ref){
  if(ref.kind==='princess'){const p=royalById(ref.id);return p?{...ref,p}:null;}
  if(ref.kind==='guest'){const p=S.officialMarriages?.guests.find(p=>p.id===ref.id);return p?{...ref,p}:null;}
  if(ref.gen===S.gen||retainedFamiliesActive()&&familyHostById(ref.host)){const e=natalEntry(ref.host,ref.id);if(e)return {...ref,...e};}
  const c=(S.previousCourts||[]).find(c=>c.gen===ref.gen)?.consorts.find(c=>c.id===ref.host),p=c?.house?.relatives?.find(p=>p.id===ref.id);
  return p?{...ref,p,c,h:c.house,archived:true}:null;
}
function officialMarriageReserved(person){
  return officialMarriageWomen().filter(b=>!b.p.married&&b.p.alive!==false&&b.p.betrothal?.match?.kind==='alliance'&&allianceEntry(b.p.betrothal.match)?.p.id===person.p.id);
}
function officialMarriageReason(person){
  if(!person||person.archived)return '不在本朝任上';
  const p=person.p;
  if(p.alive===false)return '已故，保留原有婚事记录';
  if(p.married||p.spouse||p.spouseName||p.spouseRelative||p.royalSpouseId||person.e?.role==='father')return '已有家室，不再另配婚事';
  if(!officialServing(p)||p.report)return '待任职或差事回奏后再议';
  if(officialMarriageAge(p)<18)return '尚未成年，暂不议婚';
  return '';
}
function officialMarriageOpen(person,b){
  if(!officialMarriageActive()||officialMarriageReason(person)||!b||b.archived)return false;
  const p=b.p,age=officialMarriageAge(p);
  if(p.alive===false||p.married||p.spouse||p.consortId||p.gone||p.widow&&!p.widow.authorized)return false;
  if(b.kind==='princess'?!marriageReady(p)||p.sex!=='f':age<18)return false;
  return true;
}
function officialMarriageChanges(person,b){
  const changes=officialMarriageReserved(person).filter(x=>x.id!==b.id).map(x=>({kind:'otherBride',b:x,text:`${person.p.name}原与${x.p.name}议亲`}));
  if(b.p.betrothal&&!(b.p.betrothal.match?.kind==='alliance'&&allianceEntry(b.p.betrothal.match)?.p.id===person.p.id))changes.push({kind:'bride',text:`${b.p.name}原与${b.p.betrothal.match?.name||'另一家'}议亲`});
  if(person.p.betrothal)changes.push({kind:'groom',text:`${person.p.name}另有一门家中议亲`});
  return changes;
}
function officialMarriageRelease(person,b,changes){
  for(const change of changes){
    const text=`${change.text}；奉旨改议${person.p.name}与${b.p.name}的婚事，礼部先向原议亲之家说明，原来的议亲就此止议。`;
    if(change.kind==='otherBride'){natalRecord(change.b.c,change.b.p,text,-.3);delete change.b.p.betrothal;change.b.p.marriageChecked=S.turn;}
    if(change.kind==='bride'){
      const match=b.p.betrothal.match,old=match?.kind==='alliance'&&allianceEntry(match);
      if(old)officialRecord(old.o,match.role,text,{emotion:-.3});
      if(b.kind==='family')natalRecord(b.c,b.p,text,-.3);else story(b.p,text);delete b.p.betrothal;
    }
    courtPersonRecord(person,text);
  }
  delete person.p.betrothal;
}
function officialMarriageGuest(person,index,round){
  const st=officialMarriageState(),sur=pick(SUR);
  const family=index?'将门人家':'书香人家',g=makeGirl({sur,age:Math.max(18,Math.min(32,officialMarriageAge(person.p)-2+index)),trait:index?'将门':'好学',fam:{t:index?'参将':'书香门第',p:index?42:30}});
  g.name=fullName(g);g.born=S.turn-g.age*12;g.background=family;g.married=false;g.story=[];g.guestFor=person.p.id;g.round=round;
  st.guests.push(g);return {kind:'guest',id:g.id,gen:S.gen};
}
function officialMarriageOffers(person,renew=false){
  let offers=person.p.officialCourtship;
  if(offers?.gen===S.gen&&(!renew||S.turn-offers.turn<6)){
    // Real families can change while the two visiting cards remain the same.
    const known=new Set(offers.candidates.map(officialBrideToken));
    for(const b of [...S.children.filter(p=>p.sex==='f').map(p=>({kind:'princess',id:p.id,gen:S.gen,p})),...officialMarriageWomen()])
      if(!known.has(officialBrideToken(b))&&officialMarriageOpen(person,b))offers.candidates.push({kind:b.kind,id:b.id,host:b.host,gen:b.gen});
    return offers;
  }
  const round=(offers?.round||0)+1;
  // Unselected old visiting cards can be discarded; actual spouses stay canonical.
  const st=officialMarriageState();st.guests=st.guests.filter(p=>p.guestFor!==person.p.id||p.married);
  const candidates=[...S.children.filter(p=>p.sex==='f').map(p=>({kind:'princess',id:p.id,gen:S.gen,p})),...officialMarriageWomen()]
    .filter(b=>officialMarriageOpen(person,b)).map(({kind,id,host,gen})=>({kind,id,host,gen}));
  for(let i=0;i<2;i++)candidates.push(officialMarriageGuest(person,i,round));
  return person.p.officialCourtship={gen:S.gen,turn:S.turn,round,candidates,answers:{}};
}
const officialBrideToken=b=>b.kind+':'+b.id;
const officialBridePortrait=b=>b.kind==='family'?natalPortrait(b.p):b.kind==='guest'?{...b.p,age:officialMarriageAge(b.p)}:b.p;
const officialBrideLabel=b=>b.kind==='princess'?kidName(b.p):b.kind==='family'?`${fullName(b.c)}的${natalLabel(b.c,b.p)} · ${b.p.name}`:`${b.p.name} · ${b.p.background}`;
function officialMarriageMenu(ref){
  const person=officialMarriagePerson(ref);if(officialMarriageReason(person))return null;
  const offers=officialMarriageOffers(person),available=offers.candidates.map(officialMarriageBride).filter(b=>officialMarriageOpen(person,b));
  return {title:'官员议婚 · '+person.p.name,por:person.p,valid:()=>!officialMarriageReason(officialMarriagePerson(ref)),
    text:`礼部核对家世与婚籍，为${person.p.name}备下名帖。\n已有家族的女子、十五岁起的适婚公主，以及礼部访得的两位女子，皆须分别问过心意。世家同族也可联姻，已有家室者不再列入。\n${officialMarriageReserved(person).length?'他已有一门正在商议的亲事；若另议新配，须先向原议亲之家说明。':'礼部访得的名帖保留半年，不因反复查看而更换。'}\n赐婚耗精力一；普通婚仪国库二十万两，公主婚仪五十万两。`,choices:[
      ...[['princess','适婚公主'],['family','已有家族'],['guest','礼部访婚']].map(([kind,label])=>({t:`${label} · ${available.filter(b=>b.kind===kind).length}位`,cond:()=>available.some(b=>b.kind===kind),f:()=>{pushNow(officialMarriageList(ref,kind));return null;}})),
      ...(S.turn-offers.turn>=6?[{t:'请礼部重新访婚',f:()=>{const p=officialMarriagePerson(ref);if(officialMarriageReason(p))return null;officialMarriageOffers(p,true);pushNow(officialMarriageMenu(ref));return null;}}]:[]),
      {t:'暂且收起名帖'}]};
}
function officialMarriageList(ref,kind,page=0){
  const person=officialMarriagePerson(ref);if(officialMarriageReason(person))return null;
  const list=officialMarriageOffers(person).candidates.filter(b=>b.kind===kind).map(officialMarriageBride).filter(b=>officialMarriageOpen(person,b));
  return {title:'礼部名帖',por:person.p,valid:()=>!officialMarriageReason(officialMarriagePerson(ref)),text:`为${person.p.name}议婚。先看家世、年岁与性情，再决定是否请礼部问意。`,choices:[
    ...list.slice(page*6,page*6+6).map(b=>({t:`${officialBrideLabel(b)} · ${officialMarriageAge(b.p)}岁`,person:officialBridePortrait(b),f:()=>{pushNow(officialMarriageReview(ref,{kind:b.kind,id:b.id,host:b.host,gen:b.gen}));return null;}})),
    ...(page?[{t:'上一页名帖',f:()=>{pushNow(officialMarriageList(ref,kind,page-1));return null;}}]:[]),
    ...(list.length>(page+1)*6?[{t:'下一页名帖',f:()=>{pushNow(officialMarriageList(ref,kind,page+1));return null;}}]:[]),
    {t:'返回议婚名册',f:()=>{pushNow(officialMarriageMenu(ref));return null;}}]};
}
function officialMarriageAnswer(person,b){
  const fit=marriageFit(person.p,b.p),nature=marriageNature(b.p),remembered=b.kind==='princess'&&rememberedMatch(b.p);
  const groom=person.p.marriageWilling!==false,bride=b.p.marriageWilling!==false&&(!remembered||remembered.id===person.p.id)&&!(nature.temperament==='好胜'&&fit.common.length===0);
  const line={持正:'家事可共商，亲族的请托却须守住公私之界。',谨慎:'臣愿认真经营家室，先把两家的日常安排说清。',进取:'臣虽有仕途上的志向，也愿留出时间照顾家人。',圆融:'两家往来贵在体谅，大小事情愿与她有商有量。'}[person.p.temperament]||'婚后愿与她相互体谅，一同商量日常。';
  const words={温厚:'愿两个人把家过得安稳，也盼他肯听我的想法。',爽朗:'婚后我也想骑马出游，可不能只许他一个人走远。',矜持:'家用与亲族往来先说清楚，日后才好相互信任。',好胜:'我有自己的所长，婚后也想继续做喜欢的事。',敏感:'有了难处，希望他肯先听我说完。',沉静:'我喜欢清静，愿他给我留一间可以读书的屋子。'}[nature.temperament];
  return {turn:S.turn,groom,bride,text:`${person.p.name}：${groom?'“'+line+'”':'“臣眼下无意成家，还请暂缓。”'}\n${b.p.name}：${bride?'“'+words+'”':remembered?'“我心里还记着旧日相识的人，不愿仓促另定婚事。”':'“我还未拿定主意，这门亲事请先放一放。”'}`};
}
function officialMarriageReview(ref,brideRef){
  const person=officialMarriagePerson(ref),b=officialMarriageBride(brideRef);
  if(!officialMarriageOpen(person,b))return null;
  const offers=officialMarriageOffers(person),token=officialBrideToken(b),answer=offers.answers[token],cost=b.kind==='princess'?50:20,changes=officialMarriageChanges(person,b);
  return {title:answer?'问意回笺':'赐婚前看名帖',cast:[person.p,officialBridePortrait(b)],valid:()=>officialMarriageOpen(officialMarriagePerson(ref),officialMarriageBride(brideRef)),
    text:`${person.p.name} · ${officialMarriageAge(person.p)}岁 · ${person.p.office||person.p.post}\n${officialBrideLabel(b)} · ${officialMarriageAge(b.p)}岁\n${marriageProfileText(person.p,b.p)}\n${answer?answer.text:'礼部尚未问过双方，名帖也不算婚约。'}${answer&&!answer.groom||answer&&!answer.bride?'\n有一方尚不愿意，这门亲事暂不下诏。':''}${changes.length?'\n原议亲：'+changes.map(x=>x.text).join('；')+'。下诏前须另行确认改议。':''}`,choices:[
      ...(!answer?[{t:person.p.away?'修书分别问过双方心意':'请礼部分别问过双方心意',f:()=>{
        const p=officialMarriagePerson(ref),bride=officialMarriageBride(brideRef);if(!officialMarriageOpen(p,bride))return null;
        const offer=officialMarriageOffers(p);offer.answers[token] ||= officialMarriageAnswer(p,bride);pushNow(officialMarriageReview(ref,brideRef));return null;
      }}]:answer.groom&&answer.bride?[{t:`${changes.length?'先说明旧约，再议赐婚':'下诏赐婚'} · 精力−1 · 国库−${cost}万两`,primary:true,cond:()=>E().energy>=1&&E().treasury>=cost&&officialMarriageOpen(officialMarriagePerson(ref),officialMarriageBride(brideRef)),f:()=>{
        if(changes.length){pushNow({title:'议亲改议',cast:[person.p,officialBridePortrait(b)],valid:()=>officialMarriageOpen(officialMarriagePerson(ref),officialMarriageBride(brideRef)),text:changes.map(x=>x.text).join('；')+'。若确认改议，礼部会先告知原议亲之家，再为两人办理赐婚；原来的经过仍留在有关人物纪事中。',choices:[{t:'妥善告知两家，再下诏',cond:()=>E().energy>=1&&E().treasury>=cost,f:()=>officialMarriageConfirm(ref,brideRef,offers.round,true)},{t:'保留原议亲，暂不改议'}]});return null;}
        return officialMarriageConfirm(ref,brideRef,offers.round);
      }}]:[]),
      {t:'再看别的人选',f:()=>{pushNow(officialMarriageList(ref,b.kind));return null;}},{t:'先不定亲'}]};
}
function officialMarriageConfirm(ref,brideRef,round,changeAccepted=false){
  const person=officialMarriagePerson(ref),b=officialMarriageBride(brideRef);if(!officialMarriageOpen(person,b))return null;
  const offers=person.p.officialCourtship,answer=offers?.answers[officialBrideToken(b)],cost=b.kind==='princess'?50:20,changes=officialMarriageChanges(person,b);
  if(changes.length&&!changeAccepted)return null;
  if(offers?.round!==round||!offers.candidates.some(x=>officialBrideToken(x)===officialBrideToken(b))||!answer?.groom||!answer.bride||person.p.marriageWilling===false||b.p.marriageWilling===false||E().treasury<cost||!useE())return null;
  const p=person.p,bride=b.p,id=`official-wedding-${S.gen}-${p.id}-${bride.id}`;
  officialMarriageRelease(person,b,changes);
  const record={id,gen:S.gen,turn:S.turn,date:dateStr(),groom:{...ref},bride:{...brideRef},groomName:p.name,brideName:bride.name,lastTalk:S.turn};
  officialMarriageState().couples.push(record);E().treasury-=cost;
  const snapshot={id:p.id,personId:p.id,name:p.name,sur:p.sur||person.e?.c.sur,seed:p.seed,official:p.official??2,artPortrait:p.artPortrait,born:S.turn-officialMarriageAge(p)*12,age:officialMarriageAge(p),alive:true,officialMarriageId:id,office:p.office||p.post,background:p.office||p.post,marriedAt:S.turn};
  if(b.kind==='family'){
    const match=person.e?{kind:'alliance',name:p.name,sur:snapshot.sur,desc:`${fullName(person.e.c)}的${officialKinLabel(person.e.h,person.e.role,person.e.c)}`,consortId:person.e.c.id,personId:p.id,role:person.e.role}:{kind:'official',name:p.name,sur:snapshot.sur,desc:(p.office||'朝臣')+' '};
    marrySister(b.c,bride,match,{source:'分别问过双方心意后，奉旨赐婚'});
    Object.assign(bride.spouse,snapshot);
    p.spouseRelative={consortId:b.c.id,relativeId:bride.id};delete bride.visit;delete bride.maritalBond;ensureMaritalBond(bride);
  }else{
    bride.married=true;bride.spouse=snapshot;
    if(b.kind==='princess'){
      p.royalSpouseId=bride.id;bride.princessMarriage='official';if(bride.estate)bride.estate.route='official';bride.love=clamp(bride.love+8);ensureMarriedLife(bride);
      householdRecord(bride,'princess_marriage',`经礼部分别问意，奉旨与${p.office||p.post}${p.name}成婚；驸马仍任原职，两人开始经营自己的家。`);
    }else story(bride,`经礼部分别问意，奉旨与${p.name}成婚。${answer.text}`);
  }
  p.married=true;p.spouseName=bride.name;p.spouse={id:bride.id,name:bride.name,alive:true,kind:b.kind,officialMarriageId:id};
  p.officialMarriageId=id;bride.officialMarriageId=id;delete p.betrothal;
  courtPersonRecord(person,`【奉旨成婚】经双方答应，与${officialBrideLabel(b)}成婚。${b.kind==='princess'?'受赐为驸马，仍任原职。':''}${answer.text}`);
  if(b.kind==='princess')for(const mother of mothersOf(bride))if(mother.alive){story(mother,`女儿${bride.name}与${p.name}奉旨成婚。她盼两人相敬，也叮嘱女儿，遇到难处仍可回家来说。`);cchg(mother,{mood:5});}
  NPCMemory.record(S,{type:'official-marriage',time:S.turn,participants:[p.id,bride.id],outcome:`${p.name}与${bride.name}奉旨成婚。`},[
    {person:p.id,subject:bride.id,interpretation:`与${bride.name}分别问过心意后成婚。`,emotion:.7,impact:85},
    {person:bride.id,subject:p.id,interpretation:`与${p.name}分别问过心意后成婚。`,emotion:.7,impact:85}]);
  log(`${p.name}与${bride.name}奉旨成婚。`,1);save('auto');
  return `${p.name}与${bride.name}的婚事已记入双方纪事。${b.kind==='princess'?'婚后的家书、夫妻相处与公主府生活继续展开；驸马的任职与履历仍在原来的官员档案中。':'两家依礼筹办婚仪；半年后可再问他们的婚后近况。'}\n精力−1 · 国库−${cost}万两。`;
}
function officialMarriageRecord(id){return S.officialMarriages?.couples.find(r=>r.id===id);}
function syncOfficialMarriages(){
  if(!officialMarriageActive())return;
  for(const r of S.officialMarriages?.couples||[]){
    const person=officialMarriagePerson(r.groom),b=officialMarriageBride(r.bride);if(!person||!b)continue;
    const p=person.p,bride=b.p;
    if(bride.spouse?.officialMarriageId===r.id){
      Object.assign(bride.spouse,{alive:p.alive!==false,office:p.office||p.post,background:p.office||p.post,artPortrait:p.artPortrait,official:p.official??2});
      if(p.alive===false&&!r.groomDeath){r.groomDeath={turn:S.turn};const text=`丈夫${p.name}${p.death?.reason?'：'+p.death.reason:'去世'}。她将这封讣告留在旧日家书旁，婚事的记忆仍在。`;
        if(b.kind==='princess')householdRecord(bride,'spouse_death',text);else if(!b.archived&&b.kind==='family')natalRecord(b.c,bride,text,-.8);else story(bride,text);
      }
    }
    if(p.spouse?.officialMarriageId===r.id){p.spouse.alive=bride.alive!==false;
      if(bride.alive===false&&!r.brideDeath){r.brideDeath={turn:S.turn};const text=`妻子${bride.name}去世。旧日婚事与家书仍留在履历中。`;if(person.archived)story(p,text);else courtPersonRecord(person,text);}
    }
  }
}
function officialMarriagePanel(key){
  if(!officialMarriageActive())return '';
  const person=courtPerson(key);if(!person)return '';
  const p=person.p,r=officialMarriageRecord(p.officialMarriageId),b=r&&officialMarriageBride(r.bride),reason=officialMarriageReason(person);
  const status=r?`${r.date}奉旨成婚 · ${r.brideName}${b?.p.alive===false?'（已故）':''}`:p.spouseName||p.spouse?.name?`配偶：${p.spouseName||p.spouse.name}`:reason||'尚未婚配';
  return detailSection('婚事与家室',`<p>${esc(status)}</p>${b?.kind==='princess'?`<button class="btn jade" onclick="A.go('${journalContentVersion()>=47&&!S.children.includes(b.p)?'relative':'kid'}',${b.id})">看看${esc(b.p.name)}的近况</button>`:b?.kind==='family'&&!b.archived?`<button class="btn jade" onclick="A.go('natal','${b.host}:${b.id}')">查看${esc(b.p.name)}的纪事</button>`:''}
    ${r?`<button class="btn quiet" onclick="A.officialMarriageHistory('${key}')">查看婚事纪事</button><button class="btn quiet" onclick="A.officialMarriageTalk('${key}')" ${p.alive!==false&&b&&b.p.alive!==false&&S.turn-r.lastTalk>=6?'':'disabled'}>问问婚后近况<small>每半年一次 · 精力−1</small></button>`:`<button class="btn gold" onclick="A.officialMarriage('${key}')" ${reason?'disabled':''}>议婚 / 赐婚</button>`}<p class="hint">${r?'婚姻不改变官员的原职与任用；双方纪事保留同一门婚事。':'先阅名帖、问双方心意，再确认赐婚。公主满十五岁可议；其他女子须满十八岁。'}</p>`);
}
A.officialMarriageHistory=function(key){
  const person=courtPerson(key),r=officialMarriageRecord(person?.p.officialMarriageId),b=r&&officialMarriageBride(r.bride);
  if(modalOpen||!r||!b)return;
  pushEv({title:'婚事纪事',cast:[person.p,officialBridePortrait(b)],text:`${r.date} · ${r.groomName}与${r.brideName}奉旨成婚。\n${b.p.name}的记忆：\n${(b.p.story||[]).slice(-12).map(s=>`${s.d} · ${s.t}`).join('\n')}`,choices:[{t:'收起家书'}]});
};
A.officialMarriage=function(key){
  const person=courtPerson(key);if(modalOpen||!officialMarriageActive()||officialMarriageReason(person))return;
  pushEv(officialMarriageMenu(officialMarriageRef(person)));save('auto');
};
A.officialMarriageTalk=function(key){
  const person=courtPerson(key),r=officialMarriageRecord(person?.p.officialMarriageId),b=r&&officialMarriageBride(r.bride);
  if(modalOpen||!officialMarriageActive()||!r||!person||person.p.alive===false||!b||b.p.alive===false||S.turn-r.lastTalk<6||!useE())return;
  r.lastTalk=S.turn;const nature=marriageNature(b.p),who=b.p.name;
  const text=`${person.p.away?'回信中，':'谈起家中，'}${person.p.name}说：“${who}${nature.hobby==='books'?'近来整理旧书，特意给我留下了几页批注':nature.hobby==='riding'?'想趁天晴出门走走，我答应得空陪她一道去':'把家中的日常打理妥当，也提醒我别忘了歇息'}。${person.p.temperament==='谨慎'?'先前有些小事没说透，如今都肯坐下来慢慢商量了。':'两个人过日子，才知道体谅要落在小事上。'}”`;
  courtPersonRecord(person,'【婚后家书】'+text);
  if(b.kind==='princess')householdRecord(b.p,'official_married_life',text);else if(b.kind==='family'&&!b.archived)natalRecord(b.c,b.p,'【婚后家书】'+text,.4);else story(b.p,text);
  pushEv({title:'婚后家书',cast:[person.p,officialBridePortrait(b)],text,choices:[{t:'愿卿家中安好'}]});save('auto');
};
function princessOfficialList(k,page=0){
  if(!marriageReady(k))return null;
  const b={kind:'princess',id:k.id,gen:S.gen,p:k},people=[...officialEntries().map(e=>courtPerson(e.key)),...scholarList().map(p=>courtPerson('scholar:'+p.id))].filter(p=>officialMarriageOpen(p,b));
  return {title:'为公主择配朝臣',por:k,text:people.length?`礼部核对在任官员的婚籍。${k.name}可以先看名帖，再请双方分别回话。`:'暂没有适婚的未婚在任官员，可以保留原有求亲路线，或日后再看。',valid:()=>marriageReady(k),choices:[
    ...people.slice(page*6,page*6+6).map(person=>({t:`${person.p.name} · ${officialMarriageAge(person.p)}岁 · ${person.p.office||person.p.post}`,person:person.p,f:()=>{
      const offers=officialMarriageOffers(person),ref={kind:b.kind,id:b.id,gen:b.gen};if(!offers.candidates.some(x=>officialBrideToken(x)===officialBrideToken(b)))offers.candidates.push(ref);
      pushNow(officialMarriageReview(officialMarriageRef(person),ref));return null;
    }})),
    ...(page?[{t:'上一页官员',f:()=>{pushNow(princessOfficialList(k,page-1));return null;}}]:[]),
    ...(people.length>(page+1)*6?[{t:'下一页官员',f:()=>{pushNow(princessOfficialList(k,page+1));return null;}}]:[]),
    {t:'返回公主婚事',f:()=>{pushNow(princessMarriage(k));return null;}}]};
}
const officialMarriageBasePrincess=princessMarriage;
princessMarriage=function(k){const event=officialMarriageBasePrincess(k);if(officialMarriageActive())event.choices.push({t:'从在任官员中择配',f:()=>{pushNow(princessOfficialList(k));return null;}});return event;};
const officialMarriageBasePanel=marriagePanel;
marriagePanel=function(k){const html=officialMarriageBasePanel(k),r=officialMarriageRecord(k.officialMarriageId),person=r&&officialMarriagePerson(r.groom);return html+(person&&!person.archived?`<button class="btn jade" onclick="A.go('${person.scholar?'scholar':'official'}','${person.scholar?person.p.id:person.key}')">查看驸马${esc(person.p.name)}的履历</button>`:'');};
const officialMarriageBaseTick=marriedLifeTick;
marriedLifeTick=function(){syncOfficialMarriages();return officialMarriageBaseTick();};
const officialMarriageBaseDeath=officialDeath;
officialDeath=function(...args){const result=officialMarriageBaseDeath(...args);syncOfficialMarriages();return result;};
const officialMarriageBaseLiving=householdLiving;
householdLiving=function(k){const r=officialMarriageRecord(k?.officialMarriageId),person=r&&officialMarriagePerson(r.groom);return officialMarriageBaseLiving(k)&&(!r||person?.p.alive!==false);};
const officialMarriageBaseHouseholdRecord=householdRecord;
householdRecord=function(k,type,text){
  const result=officialMarriageBaseHouseholdRecord(k,type,text),r=officialMarriageRecord(k?.officialMarriageId),person=r&&officialMarriagePerson(r.groom);
  if(officialMarriageActive()&&person?.p.alive!==false&&person&&!['official_married_life','spouse_death','spouse_court_news'].includes(type)){
    const line=`【${k.name}与我的家书】${text}`;if(person.archived)story(person.p,line);else courtPersonRecord(person,line);
  }
  return result;
};
