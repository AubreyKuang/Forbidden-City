/* A degree is a qualification, not an office. Every request names a real person. */
const STUDENT_POSTS=['书生','秀才','举人','国子监生'];
const officialPerson=(h,role)=>role?.startsWith('relative')?h?.relatives?.find(p=>p.id===Number(role.slice(8))):h?.[role];
function initializeRelativeCareer(p,role){
  if(role==='father')return;
  if(!p.career)p.career=STUDENT_POSTS.includes(p.post)?'student':'official';
  if(p.career==='student'){p.education||=STUDENT_POSTS.includes(p.post)?p.post:'书生';p.post=p.education;p.merit=0;}
}
function canAppointRelative(e){return !!e&&officialAlive(e.p)&&e.p.career==='student'&&e.p.age>=18&&['举人','进士'].includes(e.p.education)&&!e.p.exiled&&!e.p.dismissed;}
function appointRelative(e){
  if(!canAppointRelative(e)||!useE())return null;
  const {c,p,role}=e;p.career='official';p.post='候补知县';p.appointedAt=S.turn;p.merit=0;
  officialRecord(c,role,'经核验科名，奉旨授候补知县，自此开始任官。',{emotion:.6});
  officialFamilyReaction(e,'assigned','候补知县');return `${p.name}奉旨授候补知县。此前只有${p.education}功名，并无官职。`;
}
function relativeAppointmentEvent(e){
  if(!canAppointRelative(e))return null;
  const {c,p,h,role}=e;
  return {title:'外戚请托',por:c,present:[c],valid:()=>inPalace(c)&&canAppointRelative(e),
    text:`${cName(c)}谈起${officialKinLabel(h,role)}${p.name}：“他${Number.isFinite(p.examTurn)&&S.turn-p.examTurn<12?'今年中了举':'已有举人功名'}，眼下还没有官职。能否先核验学业与科名，再酌情用人？”`,choices:[
      {t:'核验科名，授候补知县 · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>appointRelative(e)},
      {t:'仍依选官程序候选',f:()=>{officialRecord(c,role,'家中请求授官，陛下让其仍依选官程序候选，未授官职。');return '他仍保留举人身份，继续候选。';}}
    ]};
}
A.appointRelative=function(key){if(modalOpen)return;const ev=relativeAppointmentEvent(officialEntry(key));if(ev)pushEv(ev);};
function relativeStudyTick(){
  if(S.month!==9||S.year%3!==0)return;
  for(const e of officialEntries()){
    const {p,c,role}=e;if(!officialAlive(p)||p.career!=='student'||p.age<18||p.age>55||p.education==='举人'||p.lastExamYear===S.year)continue;
    p.lastExamYear=S.year;
    if(chance(.3)){p.education=p.education==='秀才'?'举人':'秀才';p.post=p.education;p.examTurn=S.turn;
      officialRecord(c,role,`应试得中，取得${p.education}功名，尚未任官。`,{emotion:.6});}
    else officialRecord(c,role,'此番应试未第，仍留家读书，未曾授官。');
  }
}
