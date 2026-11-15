/* ============ 娘家姐妹的议亲与婚嫁 ============ */
// 世家之女多由两家议亲，交好的家族之间常结姻亲；小门小户、农家、太医之家的女儿嫁的是普通人家，
// 兄长也多是平民营生。二十岁以上的姐妹或已出嫁、或正在议亲；三十岁以上都已出嫁。
// 平民父兄不是官员：不上朝、不领差、不被举荐或参劾（新开局起生效）。
// 旧存档里未完的事件按原样重放：事务日志版本 10 之前的步骤不触发这里的抽签或写入。
const KIN_MARRIAGE_JOURNAL=10;
function kinMarriageActive(){
  if(!S||S.over)return false;
  return journalContentVersion()>=KIN_MARRIAGE_JOURNAL;
}
// Ids repeat between playthroughs; #25's familyHash mixes in this reign's seed for new games and is plain voiceHash for older ones.
const marriageHash=key=>typeof familyHash==='function'?familyHash(key):voiceHash(key);
// Humble households are listed; every other background (great ministers, the dowager's kin,
// restored loyal families, foreign nobility…) counts as a noble house.
const HUMBLE_FAMS=['寒门','农家','良家子','宫女','歌女','书香门第','县令','太医院院判','西域流寓'];
const familyTitle=c=>String(paternalFamily(c)[0]?.fam?.t||c?.fam?.t||'').replace(/（获罪）/g,'');
const familyIsNoble=c=>!HUMBLE_FAMS.includes(familyTitle(c));
function humbleKind(c){
  const t=familyTitle(c);
  return t==='太医院院判'?'physician':t==='县令'?'magistrate':t==='书香门第'?'scholar':['寒门','农家','良家子'].includes(t)?'farm':'commoner';
}
const COMMONER_WORK={
  physician:{son:['坐堂郎中','药铺掌柜','医馆学徒'],spouse:['坐堂郎中','药铺掌柜','医馆的郎中']},
  magistrate:{son:['县学生员','县衙书吏','乡塾先生'],spouse:['县学生员','乡绅之子','县衙书吏']},
  scholar:{son:['乡塾先生','书坊掌柜','县学生员'],spouse:['乡塾先生','书坊掌柜','邻县秀才']},
  farm:{son:['务农','货郎','木匠'],spouse:['务农的邻村人家','木匠','货郎','佃户']},
  commoner:{son:['小本营生','脚夫','务农'],spouse:['小本营生的人家','手艺人','务农的人家']}
};
const COMMONER_FATHER={farm:'务农',scholar:'设馆授徒',commoner:'小本营生'};
const NOBLE_SPOUSE_HOUSES=['礼部侍郎','大理寺卿','通政使','光禄寺卿','苏州知府','杭州织造','镇远侯','靖安伯'];

/* —— 新开局：小门小户的父兄是平民 —— */
let kinMarriageStarting=false;
const commonerRules=()=>kinMarriageStarting||!!S?.flags?.commonerKin;
function applyCommonerHouse(h,c){
  if(h.commonerChecked)return;h.commonerChecked=true;
  if(familyIsNoble(c))return;
  const kind=humbleKind(c),work=COMMONER_WORK[kind];
  if(COMMONER_FATHER[kind]&&h.father.alive!==false){h.father.career='commoner';h.father.office=COMMONER_FATHER[kind];}
  for(const role of brotherRoles(h))commonerSon(h[role],work);
  commonerRelatives(h,c);
}
function commonerSon(p,work){
  if(!p||p.career==='commoner'||p.career==='official'&&p.appointedAt!=null)return;
  p.career='commoner';p.post=work.son[marriageHash(String(p.id||p.name))%work.son.length];delete p.education;p.merit=0;
}
function commonerRelatives(h,c){
  if(!h.commonerChecked||familyIsNoble(c))return;
  const work=COMMONER_WORK[humbleKind(c)];
  for(const p of natalPeople(h))if(p.sex==='m'&&natalAge(p)>=16&&p.career==='student')commonerSon(p,work);
}
const kinMarriageBaseHouse=houseOf;
houseOf=function(c){const h=kinMarriageBaseHouse(c);if(h&&commonerRules())applyCommonerHouse(h,c);return h;};
const kinMarriageBaseStart=A.start;
A.start=function(...args){kinMarriageStarting=true;try{return kinMarriageBaseStart.apply(this,args);}finally{kinMarriageStarting=false;if(S)S.flags.commonerKin=1;}};

/* —— 配偶人选 —— */
function sisterHouseFor(p){return S.consorts.find(c=>houseOf(c)?.relatives?.includes(p));}
function sisterOf(p){const c=sisterHouseFor(p);return c?paternalFamily(c).find(x=>S.consorts.includes(x)&&x.alive&&!x.gone)||c:null;}
function marriageable(p,minAge,maxAge){return p&&p.alive!==false&&!p.consortId&&!p.married&&!p.spouse&&!p.betrothal&&p.sex!=='f'&&natalAgeOf(p)>=minAge&&natalAgeOf(p)<=maxAge;}
function natalAgeOf(p){return Number.isFinite(p.born)?natalAge(p):p.age??0;}
// 交好的世家之间优先结亲；不与交恶之家议亲，也不与本家议亲。
function allianceCandidates(c,sister){
  const age=natalAge(sister),own=houseOf(c),out=[];
  const seen=new Set([own]);
  for(const o of S.consorts){
    if(!o.alive||o.gone||!familyIsNoble(o))continue;const h=houseOf(o);if(!h||seen.has(h))continue;seen.add(h);
    const rel=relGet(c,o);if(rel<=-20)continue;
    const men=[...brotherRoles(h).map(role=>({p:h[role],role})),...natalPeople(h).filter(x=>x.sex==='m'&&!x.parentRelativeId).map(x=>({p:x,role:'relative'+x.id}))];
    for(const {p,role} of men)if(marriageable(p,Math.max(18,age-3),age+10))out.push({consort:o,h,p,role,key:o.id+':'+role,w:rel>=35?3:1});
  }
  return out;
}
function spouseFor(c,sister,{alliance=true}={}){
  if(familyIsNoble(c)){
    const options=alliance?allianceCandidates(c,sister):[];
    if(options.length){const x=pickW(options);return {kind:'alliance',name:x.p.name,sur:x.p.sur||x.consort.sur,desc:`${fullName(x.consort)}的${officialKinLabel(x.h,x.role,x.consort)}`,consortId:x.consort.id,personId:x.p.id??null,role:x.role};}
    const n=marriageHash(sister.id+':noble-spouse'),sur=SUR[n%SUR.length];
    return {kind:'noble',name:sur+BROTHER_NAMES[(n>>>4)%BROTHER_NAMES.length],sur,desc:`${NOBLE_SPOUSE_HOUSES[(n>>>8)%NOBLE_SPOUSE_HOUSES.length]}之子`};
  }
  const work=COMMONER_WORK[humbleKind(c)],n=marriageHash(sister.id+':spouse'),sur=SUR[n%SUR.length];
  return {kind:'commoner',name:sur+BROTHER_NAMES[(n>>>4)%BROTHER_NAMES.length],sur,desc:work.spouse[(n>>>8)%work.spouse.length]};
}
function allianceEntry(match){
  const o=byId(match?.consortId),h=o&&houseOf(o),p=h&&officialPerson(h,match.role);
  return p&&p.name===match.name?{o,h,p}:null;
}
function matchStillOpen(match){
  if(match.kind!=='alliance')return true;
  const e=allianceEntry(match);return !!e&&e.p.alive!==false&&!e.p.married&&!e.p.consortId;
}

/* —— 成婚 —— */
function marrySister(c,p,match,{quiet=false,source='两家议定'}={}){
  p.married=true;p.spouse={id:`spouse:${p.id}`,sur:match.sur,name:match.name,desc:match.desc,kind:match.kind,born:S.turn-(natalAge(p)+1+marriageHash(p.id+':gap')%4)*12,alive:true};
  delete p.betrothal;(p.lifeCourse ||= {}).last=S.turn;
  const where=match.kind==='commoner'?`嫁与${match.desc}${match.name}`:`嫁与${match.desc}${match.name}`;
  if(quiet){story(p,`家书补记：早年已${where}。`);return;}
  if(match.kind==='alliance'){
    const e=allianceEntry(match);
    if(e){e.p.married=true;e.p.spouseName=p.name;story(e.p,`与${fullName(c)}的${natalLabel(c,p)}${p.name}成婚，两家结为姻亲。`);
      for(const member of paternalFamily(e.o).filter(x=>S.consorts.includes(x)&&x.alive))story(member,`【两家姻亲】${officialKinLabel(e.h,match.role,member)}${e.p.name}娶了${fullName(c)}的${natalLabel(c,p)}${p.name}。`);
      if(inPalace(c)&&inPalace(e.o)&&socialPair(c,e.o))relAdd(c,e.o,6);}
  }
  natalRecord(c,p,`${source}，${where}${match.kind==='alliance'?'，两家结为姻亲':''}。`,.6);
}

/* —— 每月：状态结算 —— */
function kinMarriageTick(){
  if(!kinMarriageActive())return;
  const seen=new Set();
  for(const c of S.consorts){
    const h=houseOf(c);if(!h||seen.has(h)||!c.alive||c.gone)continue;seen.add(h);
    if(h.commonerChecked)commonerRelatives(h,c);
    for(const p of natalPeople(h)){
      if(p.sex!=='f'||p.alive===false||p.visit)continue;
      const age=natalAge(p);
      if(p.married&&p.spouse&&!p.spouse.desc)p.spouse.desc=spouseFor(c,p,{alliance:false}).desc;
      if(age<20||p.married)continue;
      if(age>=30){marrySister(c,p,p.betrothal&&matchStillOpen(p.betrothal.match)?p.betrothal.match:spouseFor(c,p,{alliance:false}),{quiet:!p.betrothal});continue;}
      // 头一回清点：家中早有安排的，照实补记；不靠抽签。
      if(!p.marriageChecked){
        p.marriageChecked=S.turn;const n=marriageHash(p.id+':match')%100;
        if(n<40){marrySister(c,p,spouseFor(c,p,{alliance:false}),{quiet:true});continue;}
        if(n<75)startBetrothal(c,p);
        continue;
      }
      if(p.betrothal){
        if(!matchStillOpen(p.betrothal.match)){story(p,`与${p.betrothal.match.name}的亲事作罢。`);delete p.betrothal;continue;}
        if(S.turn>=p.betrothal.due)marrySister(c,p,p.betrothal.match,{source:p.betrothal.arranged?'奉旨赐婚':'两家议定'});
        continue;
      }
      if(S.month===2&&S.turn-(p.marriageChecked??-99)>=12&&chance(.25))startBetrothal(c,p);
    }
  }
}
function startBetrothal(c,p){
  const match=spouseFor(c,p);
  p.betrothal={turn:S.turn,due:S.turn+6+marriageHash(p.id+':due:'+S.turn)%12,match,seen:false};
  story(p,`家中为她与${match.desc}${match.name}议亲。`);
  return p.betrothal;
}
const kinMarriageBaseTick=courtTick;
courtTick=function(...args){const result=kinMarriageBaseTick.apply(this,args);kinMarriageTick();return result;};

/* —— 议亲事件：可以亲自安排，也会撞见两家相看 —— */
function betrothalCandidates(){
  const out=[];
  for(const c of harem()){const h=houseOf(c);if(!h)continue;
    for(const p of natalPeople(h))if(p.sex==='f'&&p.alive!==false&&p.betrothal&&!p.betrothal.seen&&!p.married&&matchStillOpen(p.betrothal.match))out.push({c,h,p});}
  return out;
}
function betrothalEvent(){
  if(!kinMarriageActive())return null;
  const options=betrothalCandidates();if(!options.length)return null;
  const {c,p}=pick(options),b=p.betrothal,m=b.match,kin=natalLabel(c,p),discovered=chance(.5),alliance=m.kind==='alliance';
  const e=alliance?allianceEntry(m):null;
  const place=pick(['护国寺上香','城外桃林赏花','花朝会','两家长辈的寿宴']);
  const opening=discovered?`宫人回报：${fullName(c)}的${kin}${p.name}，与${m.desc}${m.name}在${place}时相看过，两家长辈都在场。`
    :`${cName(c)}提起家中来信：${kin}${p.name}今年${natalAge(p)}岁，家里正为她与${m.desc}${m.name}议亲。`;
  const note=alliance?`\n${fullName(c)}与${fullName(e.o)}${relGet(c,e.o)>=35?'在宫中素来交好，两家若成姻亲，往来更密':'在宫中往来不多'}。朝中也有人提醒“外戚互结姻亲，须防结党”。`
    :familyIsNoble(c)?'\n对方也是官宦人家。':`\n对方是${m.desc}，寻常人家，日子踏实。`;
  const valid=()=>kinMarriageActive()&&p.betrothal===b&&!p.married&&matchStillOpen(m)&&inPalace(c);
  let done=false;const once=f=>()=>{if(done||!valid())return null;done=true;return f();};
  const choices=alliance||familyIsNoble(c)?[
    {t:'赐婚成全 · 国库−10',cond:()=>E().treasury>=10,why:'国库不足',f:once(()=>{
      chg({treasury:-10});b.arranged=true;marrySister(c,p,m,{source:'奉旨赐婚'});
      return `${p.name}与${m.name}奉旨成婚。${fx(cchg(c,{mood:8,aff:5}),...(e&&inPalace(e.o)?[cchg(e.o,{mood:5,aff:3})]:[]))}`;})},
    {t:'由两家自行商议',f:once(()=>{b.seen=true;natalRecord(c,p,`与${m.name}议亲一事，陛下未加干预，由两家自行商议。`,.2);return '两家仍在商议，婚期由家中定。';})},
    {t:alliance?'不准两家结亲，以防结党':'这门亲事不妥，让家里另议',f:once(()=>{
      delete p.betrothal;p.marriageChecked=S.turn;natalRecord(c,p,`与${m.name}的亲事奉旨作罢。`,-.3);
      if(e&&inPalace(e.o)&&socialPair(c,e.o))relAdd(c,e.o,-3);if(alliance)policyNudge('civil',1);
      return `亲事作罢。${fx(cchg(c,{mood:-6}))}`;})}]
  :[
    {t:'赏一份嫁妆 · 国库−5',cond:()=>E().treasury>=5,why:'国库不足',f:once(()=>{
      chg({treasury:-5});b.seen=true;b.dowry=true;natalRecord(c,p,`将与${m.name}成亲，宫中赏了一份嫁妆，${fullName(c)}托人一并捎去。`,.5);
      return `嫁妆随家书送去了。${fx(cchg(c,{mood:6,aff:4}))}`;})},
    {t:'由她家里做主',f:once(()=>{b.seen=true;natalRecord(c,p,`与${m.name}议亲一事，由家里做主。`,.2);return '这是她家里的事，由家里做主。';})}];
  return {title:discovered?'相看':'议亲',kinMarriage:true,kinMarriagePerson:p.id,por:c,present:[c],cooldown:10,valid,text:opening+note,choices};
}

/* —— 显示 —— */
function natalMarriageLine(p){
  if(p.betrothal&&!p.married)return `<p>议亲：${esc(p.betrothal.match.desc)}${esc(p.betrothal.match.name)}</p>`;
  return '';
}
