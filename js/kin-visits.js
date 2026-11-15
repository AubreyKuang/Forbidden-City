/* Marriage talks, palace visits and old acquaintances share the same named people.
   Version 10 scenes keep their original choices and random draws when replayed. */
const kinVisitsEnabled=()=>journalContentVersion()>=11;
function visitingMarriageReady(c,p){
  return kinVisitsEnabled()&&natalInPalace(c,p)&&!p.parentRelativeId&&p.sex==='f'&&natalAge(p)>=20&&!p.married&&!p.spouse;
}
const kinVisitsRomanceReady=natalRomanceReady;
natalRomanceReady=function(c,p){
  if(!kinVisitsEnabled())return kinVisitsRomanceReady(c,p);
  return !p.parentRelativeId&&natalInPalace(c,p)&&p.sex==='f'&&natalAge(p)>=18&&!p.married&&!p.spouse&&!p.betrothal?.arranged&&!p.declined;
};
const kinVisitsMeeting=natalMeetingEvent;
natalMeetingEvent=function(c,p){
  if(kinVisitsEnabled()&&natalInPalace(c,p)&&p.betrothal&&!matchStillOpen(p.betrothal.match)){
    const m=p.betrothal.match,e=allianceEntry(m),reason=e?.p.alive===false?'已离世':e?.p.married?'已经另结婚姻':'已不适合继续议亲';
    delete p.betrothal;p.marriageChecked=S.turn;
    natalRecord(c,p,`${p.name}探亲时收到家中回信：原议亲对象${m.name}${reason}，原亲事作罢，婚事需另议。`,0);
  }
  const ev=kinVisitsMeeting(c,p);if(!ev||!visitingMarriageReady(c,p))return ev;
  const b=p.betrothal;
  ev.text+=b?`\n临到告退，${p.name}说起自己的婚事：“家中正与${b.match.desc}${b.match.name}议亲，尚未成婚。民女想请陛下听听这门亲事，也请${natalLabel(c,p)==='妹妹'?'姐姐':'妹妹'}替我参详。”`:
    `\n说完家常，${p.name}提起家中还在为她择亲：“此来还有一事，想请陛下为民女的婚事作主。”`;
  ev.choices.splice(ev.choices.length-1,0,{t:'听听她的婚事，商议指婚',f:()=>{
    if(!visitingMarriageReady(c,p))return null;
    if(!p.betrothal){startBetrothal(c,p);p.betrothal.proposedAtVisit=true;}
    pushNow(visitingMarriageEvent(c,p));return null;
  }});
  return ev;
};
function visitingMarriageEvent(c,p){
  const b=p.betrothal,m=b?.match;if(!visitingMarriageReady(c,p)||!m||!matchStillOpen(m))return null;
  const valid=()=>visitingMarriageReady(c,p)&&p.betrothal===b&&matchStillOpen(m);
  return {title:'探亲请婚',por:natalPortrait(p),cast:[c],present:[c],valid,
    text:b.proposedAtVisit?`${p.name}与${fullName(c)}一同请你参详婚事。礼部核对家世年岁后，提到${m.desc}${m.name}。\n她尚未与对方定亲，可以赐婚，也可以让两家先相看。`:
      `${p.name}与${fullName(c)}一同向你说起${m.desc}${m.name}。\n“家中已经相看过，只是婚事尚未落定，民女愿听陛下的意思。”\n她这次是入宫探亲、请议婚事，留在宫中还是归家成婚，都尚有选择。`,choices:[
      {t:'赐婚成全 · 国库−10',cond:()=>E().treasury>=10,why:'国库不足',f:()=>{
        if(!valid()||E().treasury<10)return null;
        chg({treasury:-10});marrySister(c,p,m,{source:'入宫探亲时亲自请婚，奉旨赐婚'});
        delete p.visit;cchg(c,{mood:6,aff:3});
        natalRecord(c,p,`${p.name}领旨辞别${fullName(c)}，归家与${m.name}筹办婚礼，宫中不再留宿。`,.5);
        return `${p.name}与${m.name}获赐婚，领旨归家。${fullName(c)}亲自送她到宫门前。`;
      }},
      {t:'让两家再商量，暂不指婚',f:()=>{
        if(!valid())return null;b.seen=true;
        natalRecord(c,p,`${p.name}入宫请议与${m.name}的婚事，陛下暂不赐婚，让两家继续商议，仍按探亲约定归家。`,.2);
        return '原来的议亲仍在，探亲也仍有归期。';
      }},
      ...(natalRomanceReady(c,p)?[{t:'朕亦有意，问她是否愿意留宫',f:()=>{if(!valid()||!natalRomanceReady(c,p))return null;pushNow(natalCourtshipEvent(c,p));return null;}}]:[])
    ]};
}
const kinVisitsCourtship=natalCourtshipEvent;
natalCourtshipEvent=function(c,p){
  const ev=kinVisitsCourtship(c,p);if(!ev||!kinVisitsEnabled()||!p.betrothal)return ev;
  const m=p.betrothal.match;
  if(p.declined)ev.text+=`\n她与${m.name}的议亲照旧，并未因这次垂问作罢。`;
  else{
    ev.text=`${p.name}听清入宫之意，思量后愿意留下。\n${sisterArrivalFeeling(c,p,true).text}\n她与${m.desc}${m.name}尚在议亲。若最终留宫，须明告两家，了结原来的亲事；暂不册封则一切照旧。`;
    ev.choices[0].t='了结原议亲，纳为常在';
  }
  return ev;
};
const kinVisitsAdmit=admitNatalSister;
admitNatalSister=function(c,p){
  if(!kinVisitsEnabled()||!p.betrothal)return kinVisitsAdmit(c,p);
  if(!natalRomanceReady(c,p)||!p.willing||rankCount(2)>=RANK_CAP[2])return null;
  const m={...p.betrothal.match},other=allianceEntry(m);
  natalRecord(c,p,`${p.name}探亲时蒙陛下有意，本人愿意留宫；宫中明告两家，原与${m.desc}${m.name}所议的婚事作罢。`,.1);
  delete p.betrothal;p.marriageChecked=S.turn;p.previousMarriageTalk={turn:S.turn,match:m,outcome:'留宫'};
  if(other){
    if(other.p.alive!==false)story(other.p,`原与${p.name}议亲，因她探亲后愿意留宫为妃，两家收到告知，亲事作罢，未结为夫妻。`);
    for(const member of paternalFamily(other.o).filter(x=>S.consorts.includes(x)&&x.alive))
      story(member,`【议亲生变】家中${m.name}原与${p.name}议亲，如今她留宫为妃，亲事作罢。未成姻亲，心里仍有失落。`);
    if(inPalace(c)&&inPalace(other.o))relAdd(c,other.o,-6);
  }
  const result=kinVisitsAdmit(c,p),g=byId(p.id);
  if(g){g.previousMarriageTalk=p.previousMarriageTalk;if(other&&inPalace(other.o))relAdd(g,other.o,-8);}
  return result;
};
const kinVisitsBetrothal=betrothalEvent;
betrothalEvent=function(){
  const ev=kinVisitsBetrothal();if(!ev||!kinVisitsEnabled())return ev;
  // The event already chose its named sister. Never roll a second, unrelated guest.
  const entry=natalEntry(ev.por.id,ev.kinMarriagePerson);
  let invited=false;
  if(entry&&natalVisitReady(entry.c,entry.p))ev.choices.push({t:'召她入宫，亲自听听婚事',f:()=>{
    if(invited||!ev.valid()||!natalVisitReady(entry.c,entry.p))return null;
    invited=true;entry.p.betrothal.seen=true;pushNow(natalVisitEvent(entry.c,entry.p));return null;
  }});
  return ev;
};
