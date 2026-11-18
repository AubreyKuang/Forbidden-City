/* 官员并不以有没有后宫姐妹为存在条件。外朝家族也有同胞与同僚关系。 */
function officialBrothers(person){
  if(person.e?.p.parentRelativeId)return [];
  if(person.e)return officialRoles(person.e.h).filter(r=>r!=='father').map(r=>courtPerson(person.e.c.id+':'+r)).filter(x=>x&&x.p!==person.p&&!x.p.parentRelativeId&&person.e.role!=='father');
  return person.p.officialFamilyId?careerPeople().filter(x=>x.p!==person.p&&x.p.officialFamilyId===person.p.officialFamilyId):[];
}
function initializeOutsideBrothers(){
  for(const p of scholarList().slice()){
    if(p.siblingsChecked)continue;p.siblingsChecked=true;
    if(p.registrySource==='family'||!officialAlive(p)||p.age<25||familyHash(p.id+':siblings')%100>=22)continue;
    p.officialFamilyId ||= 'outside-family:'+p.id;
    const b=makeScholar();b.sur=p.sur;b.name=p.sur+courtGivenName(p.sur,b.seed);b.age=Math.max(18,p.age-ri(3,7));b.registrySource='family';b.siblingsChecked=true;b.officialFamilyId=p.officialFamilyId;b.origin='外朝家族';b.ageTrackedAt=S.turn;
    b.career=chance(.5)?'student':'official';b.education=b.career==='student'?'举人':'进士';b.office=b.career==='student'?'举人':'翰林院编修';b.post=b.office;b.merit=b.career==='student'?0:20;b.appointedTurn=S.turn;
    if(expandedOfficialPortraitsActive()){delete b.artPortrait;assignCourtOfficialPortrait(b,'civil');}
    S.scholars.push(b);story(p,`【家中手足】弟弟${b.name}，${b.age}岁，${b.career==='student'?'已有举人功名，尚未授官':'现任翰林院编修'}。`);story(b,`【家中手足】兄长${p.name}在朝任职，自己也有学业与仕途的打算。`);
  }
}
function brotherNomination(person,brother){
  const p=brother.p,elder=person.p;
  if(!careerEligible(elder)||!officialAlive(p)||p.age<18||p.retired||p.dismissed||p.exiled||p.commission||p.incognitoCase||p.report)return null;
  if(S.turn-(p.lastBrotherNomination??-99)<18||S.turn-(elder.lastBrotherNomination??-99)<12)return null;
  if(p.career==='student'&&!['举人','进士'].includes(p.education))return null;
  if(p.career==='commoner')return null;
  return {person,brother};
}
function brotherNominationEvent(person,brother){
  if(!brotherNomination(person,brother))return null;
  const p=brother.p,elder=person.p,valid=()=>!!brotherNomination(person,brother);
  const settle=approved=>{
    if(!valid()||!useE())return null;p.lastBrotherNomination=elder.lastBrotherNomination=S.turn;
    let result;
    if(approved&&p.career==='student'){
      p.career='official';p.office=p.post='候补知县';p.appointedTurn=S.turn;p.merit=0;result='核验科名后授候补知县，仍候实缺，并非直接升为高官';
    }else if(approved){p.trust=clamp(p.trust+2);result='收入吏部考察册，仍须凭新的任内实绩决定升迁';}
    else result='举荐暂未采纳，仍按通常铨选程序候选，不因亲缘直接授职';
    const text=`${elder.name}举荐自己的${p.age>elder.age?'兄长':'弟弟'}${p.name}。陛下${result}。`;recordBrotherExchange(person,brother,text);return text;
  };
  return {title:'兄弟举荐 · '+elder.name,por:elder,cast:[p],valid,text:`${elder.name}呈请考察${p.age>elder.age?'兄长':'弟弟'}${p.name}，并附上${p.career==='student'?p.education+'科名':'现任'+officialOfficeLabel(p)+'的履历'}。\n亲兄弟可以举荐，仍须核验资格；没有新的实绩，不能凭一句家书连跳数级。`,choices:[
    {t:p.career==='student'?'核验科名，授候补缺 · 精力−1':'收录考察，待实绩再议升迁 · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>settle(true)},
    {t:'仍依通常铨选程序 · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>settle(false)}, {t:'暂留中'}]};
}
A.officialBrother=function(key,other){const p=courtPerson(key),b=courtPerson(other);if(!modalOpen&&p&&b&&officialBrothers(p).some(x=>x.p===b.p))pushEv(brotherNominationEvent(p,b));};
function officialBrothersPanel(person){
  const brothers=officialBrothers(person);return brothers.length?detailSection('兄弟与提携',brothers.map(x=>`<p>${x.p.age>person.p.age?'兄长':'弟弟'}：${careerLink(x)} · ${esc(officialOfficeLabel(x.p))} · ${esc(officialStatus(x.p))}</p>${brotherNomination(person,x)?`<button class="btn sm" onclick="A.officialBrother('${person.key}','${x.key}')">听取对${esc(x.p.name)}的举荐</button>`:''}`).join('')):'';
}
function officialFraternityTick(){
  if(!careersActive()||S.flags.fraternityTick===S.turn)return;S.flags.fraternityTick=S.turn;initializeOutsideBrothers();
  if(S.turn-(S.flags.lastFraternity??0)<6||!chance(.25))return;
  const options=careerPeople().filter(x=>careerEligible(x.p)&&S.turn-(x.p.lastBrotherLesson??-99)>=12).flatMap(x=>officialBrothers(x).filter(b=>officialAlive(b.p)&&b.p.age<x.p.age).map(b=>[x,b]));
  if(!options.length)return;const [a,b]=pick(options);S.flags.lastFraternity=S.turn;a.p.lastBrotherLesson=S.turn;
  const text=`${a.p.name}给弟弟${b.p.name}写信，${a.p.temperament==='进取'?'鼓励他把学问用在实事上，先做出能核验的成绩':'叮嘱他认真读书、办事，不拿兄长的名字向人求方便'}。${b.p.career==='student'?'弟弟仍只有科名，未因此取得官职。':'弟弟回信说起任上的疑难，愿再请教。'}`;
  recordBrotherExchange(a,b,text);b.p.ability=clamp(b.p.ability+1);
}
function recordBrotherExchange(a,b,text){
  courtPersonRecord(a,text);
  courtPersonRecord(b,text,{family:journalContentVersion()<33||!a.e||!b.e||a.e.h!==b.e.h});
}
const fraternityCareerTick=careerTick;
careerTick=function(){const result=fraternityCareerTick();officialFraternityTick();return result;};

function queenHeirFeelings(previous){
  if(!careersActive()||!previous||previous.gen!==S.gen)return;
  const q=empress();if(!q||!inPalace(q)||q.age<18)return;
  const first=S.children.filter(k=>k.sex==='m'&&!k.removedFromRoyal).sort((a,b)=>a.born-b.born||a.id-b.id)[0],mother=first&&byId(first.mom);
  if(!first||first.pendingName||!mother||mother===q||!inPalace(mother))return;
  const fresh=!(previous.children||[]).some(k=>k.sex==='m'&&!k.removedFromRoyal&&!k.pendingName);
  const barren=S.turn-(q.enteredAt??0)>=36&&!S.children.some(k=>k.sex==='m'&&k.mom===q.id&&k.alive&&!k.removedFromRoyal);
  const key=`${S.gen}:${q.id}:${first.id}`,old=S.flags.queenHeirFeelings?.[key];
  if(fresh&&journalContentVersion()>=80&&mother.delivery?.children?.includes(first.id)&&!mother.delivery.concealedLoss){
    const batch=deliveryKids(mother);
    if(batch.every(k=>k.alive&&!k.birthSwap?.occurred)&&batch.some(k=>goodBirthSigns(k).length)){
      (S.flags.queenHeirFeelings ||= {})[key]=S.turn;return;
    }
  }
  if(old!=null&&S.turn-old<24||!fresh&&(!barren||previous.turn===S.turn||!chance(.08)))return;
  (S.flags.queenHeirFeelings ||= {})[key]=S.turn;
  const intense=['骄纵','骄矜','善妒','城府'].includes(q.trait),quiet=isSolitary(q)||q.trait==='淡泊',loss=intense?10:quiet?1:4;
  const text=fresh?`${fullName(mother)}诞下皇长子${kidName(first)}。`:`皇长子${kidName(first)}渐渐长大，${fullName(q)}入宫多年仍未有在世的亲生皇子。`;
  const feeling=intense?'她想起嫡长之议，喜讯入耳却先觉刺痛，再见孩子生母时，语气不由冷了下来。':quiet?'她也有一瞬失落，却不愿把孩子变成争衡的筹码，只比往日多留了一分距离。':'她依礼道贺，回宫后仍难免失落，觉得中宫的期待压在自己身上，再与孩子生母相处时便拘谨了些。';
  relAdd(q,mother,-loss);cchg(q,{mood:-loss});story(q,`【中宫子嗣心事】${text}${feeling}`);story(mother,`【中宫的分寸】${text}${fullName(q)}${intense?'言语间显出冷意':'虽依礼相待，相处时却多了一点距离'}，她感到嫡长之议也落在了自己身上。`);
}
