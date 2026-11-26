/* 探花就是榜上的那个人：指婚后仍能从夫妻双方进入同一份人物档案。 */
const examGroomReady=p=>careersActive()&&p?.examRank==='探花'&&officialServing(p)&&p.age>=18&&!p.married&&!p.spouse&&!p.spouseRelative&&!p.royalSpouseId&&!p.betrothal;
function examMarriageCandidates(p){
  if(!examGroomReady(p))return [];
  const out=S.children.filter(k=>k.sex==='f'&&kidAge(k)>=(journalContentVersion()>=19?15:18)&&(journalContentVersion()>=19||Math.abs(kidAge(k)-p.age)<=15)&&marriageReady(k)&&!k.betrothal).map(k=>({p:k,kind:'princess',key:'princess:'+k.id})),seen=new Set();
  for(const c of harem())for(const sister of natalPeople(houseOf(c))){
    if(seen.has(sister.id))continue;seen.add(sister.id);
    if(sister.sex!=='f'||!sister.alive||sister.parentRelativeId||sister.consortId||natalAge(sister)<18||Math.abs(natalAge(sister)-p.age)>15||sister.married||sister.spouse||sister.betrothal||sister.widow||sister.natalPregnancy)continue;
    if(journalContentVersion()<19&&p.courtKin?.some(edge=>edge.fatherId===houseOf(c).father.id))continue;
    out.push({p:sister,c,kind:'sister',key:'sister:'+sister.id});
  }
  return out;
}
function examMarriageEvent(p){
  if(!examGroomReady(p))return null;const options=examMarriageCandidates(p);
  return {title:'金榜之后 · 探花议婚',por:p,valid:()=>examGroomReady(p),text:`新科探花${p.name}，${p.age}岁，${p.origin}出身，现授${officialOfficeLabel(p)}。礼部核过婚籍，他尚未婚配。\n若有合适的人选，可以分别问过双方心意，再定婚事。已有婚约的人不列入名册。`,choices:[
    ...options.map(x=>({t:x.kind==='princess'?`问问${kidName(x.p)}的心意`:`问问${fullName(x.c)}的${natalLabel(x.c,x.p)}${x.p.name}`,person:x.kind==='sister'?natalPortrait(x.p):x.p,f:()=>{if(!examMarriageCandidates(p).some(o=>o.key===x.key))return null;pushNow(examMarriageReview(p,x.key));return null;}})),
    {t:'金榜是喜事，婚事留待日后',f:()=>{scholarRecord(p,'殿试后礼部提及婚事，陛下暂未指婚，仍由本人日后再议。');return '未定婚约，日后仍可从探花的档案里商议。';}}
  ]};
}
function examMarriageReview(groom,key){
  const x=examMarriageCandidates(groom).find(x=>x.key===key);if(!x)return null;
  const bride=x.p,willing=bride.willing!==false&&groom.willing!==false,cost=x.kind==='princess'?50:10;
  const valid=()=>examMarriageCandidates(groom).some(o=>o.key===key),name=x.kind==='princess'?kidName(bride):bride.name;
  return {title:'探花指婚 · 先问心意',por:x.kind==='sister'?natalPortrait(bride):bride,cast:[groom],valid,text:`${name}，${x.kind==='princess'?kidAge(bride):natalAge(bride)}岁。${x.kind==='sister'?`她是${fullName(x.c)}的${natalLabel(x.c,bride)}。`:''}礼部让二人分别谈了家世与日后的打算。\n${willing?`${groom.name}愿意议亲；${name}也愿意与他相知，说金榜固然可喜，更想看婚后的相处。`:`${bride.willing===false?name:groom.name}表示眼下无意这门婚事，不能将不情愿写成谢恩。`}\n${x.kind==='sister'?`${fullName(x.c)}会收到亲事的消息，家族名册和双方纪事都会保留这门姻亲。`:'成婚后探花保留原有官职与履历，另记驸马身份，不因成亲凭空升官。'}`,choices:[
    {t:`双方愿意，赐婚成全 · 国库−${cost}`,cond:()=>willing&&valid()&&E().treasury>=cost,why:willing?'国库不足或人选处境已变':'本人尚无此意',f:()=>{
      if(!valid()||!willing||E().treasury<cost)return null;
      if(x.kind==='sister'){
        marrySister(x.c,bride,{kind:'scholar',name:groom.name,sur:groom.sur,personId:groom.id,desc:`新科探花、${groom.office}`},{source:'殿试后分别问过双方心意，奉旨赐婚'});delete bride.visit;
      }else{
        bride.married=true;bride.spouse={id:groom.id,personId:groom.id,scholarId:groom.id,name:groom.name,sur:groom.sur,sex:'m',seed:groom.seed,official:groom.official,artPortrait:groom.artPortrait,born:S.turn-groom.age*12,background:`探花 · ${groom.office}`,marriedAt:S.turn};
        groom.married=true;groom.royalSpouseId=bride.id;groom.spouseName=bride.name;
        princessMemory(bride,'child_marriage',`殿试后经问双方心意，奉旨与探花${groom.name}成婚。`,'礼部');ensureMarriedLife(bride);
        const mother=byId(bride.mom);if(mother?.alive)story(mother,`【公主指婚】女儿${kidName(bride)}愿与新科探花${groom.name}结亲，陛下赐婚。她替女儿欢喜，也惦记婚后能否被好好珍重。`);
        scholarRecord(groom,`经问双方心意，奉旨与${kidName(bride)}成婚，另记驸马身份，仍任${groom.office}。`);
      }
      chg({treasury:-cost});save('auto');return `${name}与${groom.name}奉旨成婚，双方人物纪事及亲缘均已记下。`;
    }},
    {t:'尊重心意，暂不定亲',f:()=>{if(!valid())return null;const line=`与${groom.name}议婚时，陛下先听本人心意，暂不指婚。`;if(x.kind==='princess')princessMemory(bride,'marriage_talk',line,'礼部');else natalRecord(x.c,bride,line,.1);scholarRecord(groom,`与${name}的婚事暂缓，未结婚约。`);return '未定亲，双方仍可自行考虑。';}}
  ]};
}
A.examMarriage=function(id){const p=scholarById(id);if(!modalOpen&&examGroomReady(p))pushEv(examMarriageEvent(p));};
const examMatchOpen=matchStillOpen;
matchStillOpen=function(m){return m?.kind==='scholar'?examGroomReady(scholarById(m.personId)):examMatchOpen(m);};
const examSisterMarriage=marrySister;
marrySister=function(c,p,match,options){
  if(match.kind!=='scholar')return examSisterMarriage(c,p,match,options);
  const groom=scholarById(match.personId);if(!examGroomReady(groom)||p.willing===false||groom.willing===false)return false;
  const result=examSisterMarriage(c,p,match,options);if(result===false)return false;
  p.spouse.personId=groom.id;p.spouse.born=S.turn-groom.age*12;groom.married=true;groom.spouseName=p.name;groom.spouseRelative={consortId:c.id,relativeId:p.id};
  delete p.maritalBond;ensureMaritalBond(p);p.maritalMood='新婚中的期待';
  scholarRecord(groom,`【金榜姻缘】与${fullName(c)}的${natalLabel(c,p)}${p.name}经问心意，奉旨成婚。`);
  story(houseOf(c).father,`【金榜姻缘】家中${p.name}与新科探花${groom.name}奉旨成婚，两家结为姻亲。`);return result;
};
const examScholarView=viewScholar;
viewScholar=function(){const html=examScholarView(),p=scholarById(UI.sel);return html+(examGroomReady(p)&&examMarriageCandidates(p).length?`<section class="detail-section"><h3>金榜姻缘</h3><button class="btn gold" data-onclick="A.examMarriage('${p.id}')">为探花商议婚事</button></section>`:'');};
const examSpousePanel=officialSpousePanel;
officialSpousePanel=function(person){const k=journalContentVersion()>=47?royalById(person.p.royalSpouseId):S.children.find(k=>k.id===person.p.royalSpouseId);return examSpousePanel(person)+(k?detailSection('尚主姻缘',`<p>妻子：<button class="person-link" data-onclick="A.go('${S.children.includes(k)?'kid':'relative'}',${k.id})">${esc(kidName(k))} ↗</button>${k.alive?'':' · 已故'}</p>`):'');};
const examMarriagePanel=marriagePanel;
marriagePanel=function(k){const p=k.spouse?.scholarId&&scholarById(k.spouse.scholarId);return examMarriagePanel(k)+(p?`<p>驸马履历：${careerLink(courtPerson('scholar:'+p.id))} · ${esc(officialOfficeLabel(p))} · ${officialStatus(p)}</p>`:'');};

function princessGroomNews(p,text){
  if(journalContentVersion()<47||p?.royalSpouseId==null||/^【(?:[^】]+与我的家书|婚后家书|奉旨成婚)】/.test(text))return;
  const k=royalById(p.royalSpouseId),spouse=k?.spouse;
  if(!k?.alive||k.sex!=='f'||!k.married||spouse?.personId!==p.id)return;
  const dead=!officialAlive(p);
  if(dead&&(spouse.officialMarriageId||spouse.alive===false))return;
  const subject=dead?p.death?.reason||text:text;
  if(!dead&&!/御批|改任|升任|降职|回奏|奉差|奉命|赴任|任命|授职|调任|擢升|卸任|出任|考课|嘉奖|致仕|复出|革职|战功|领差|赐赏/.test(subject))return;
  if(spouse.lastCourtNews?.turn===S.turn&&spouse.lastCourtNews.source===subject)return;
  const worried=/降职|失职|疏漏|责令|申斥|革职|未竟|受伤/.test(subject);
  const reaction=dead?'她接到讣告，将从前的家书与讣告一一收好。':worried?'她惦记眼前的难处，想先问清原委，再同他商量往后怎么办。':p.away?'她记下他的任所，回信叮嘱他报个平安，也把府里的近况一并写去。':'她记下了这件事，待他归家，想听他亲口说说经过。';
  const line=`【驸马${dead?'讣报':'近况'}】${p.name}：${subject} ${reaction}`;
  if(dead)spouse.alive=false;
  spouse.lastCourtNews={turn:S.turn,source:subject,text:line};
  householdRecord(k,'spouse_court_news',line);
}

const examScholarRecord=scholarRecord;
scholarRecord=function(p,text,big){
  const result=examScholarRecord(p,text,big);
  if(journalContentVersion()>=47){princessGroomNews(p,text);return result;}
  const k=S.children.find(k=>k.id===p.royalSpouseId);
  if(careersActive()&&k?.alive&&k.spouse?.personId===p.id&&/御批|改任|升任|降职|回奏|奉差|去世|阵亡/.test(text)){
    const sad=!officialAlive(p)||/降职|失职|疏漏/.test(text),line=`【驸马家书】${p.name}：${text} ${sad?'她读完家书，心中担忧，想知道往后能怎样相扶。':'她替丈夫欣慰，也盼公务之外仍能相伴说说家常。'}`;
    kstory(k,line);k.spouse.lastCourtNews={turn:S.turn,text:line};
  }
  return result;
};
