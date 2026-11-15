/* 升迁与晋位都有实际记录，才会生出门户之讥；人物的酸话不等于朝廷的事实判定。 */
const familyRiseSetOffice=careerSetOffice;
careerSetOffice=function(person,title,reason){
  const before=officialGrade(person.p),from=officialOfficeLabel(person.p),result=familyRiseSetOffice(person,title,reason),after=officialGrade(person.p);
  if(careersActive()&&person.e&&before&&after&&after<before){
    for(const c of paternalFamily(person.e.c).filter(inPalace)){
      if(!/^(县令|知县|寒门|农家|良家子|书香门第)$/.test(c.fam?.t||''))continue;
      c.familyRise={key:person.key,personId:person.p.id,name:person.p.name,kin:officialKinLabel(person.e.h,person.e.role,c),from,to:officialOfficeLabel(person.p),turn:S.turn};
      c.familyRiseRanks ||= [];
    }
  }
  return result;
};
function familyRiseSpeaker(c){
  return harem().filter(o=>o!==c&&o.age>=18&&cohabAvailable(o)&&!isSolitary(o)&&['骄纵','骄矜','善妒','城府'].includes(o.trait)&&relGet(o,c)<25&&!sameFather(c,o))
    .sort((a,b)=>relGet(a,c)-relGet(b,c)||b.rank-a.rank)[0]||null;
}
function familyRiseLine(speaker,c){
  const rise=c.familyRise,own=houseOf(speaker),elder=brotherRoles(own).map(r=>own[r]).filter(p=>p.age>speaker.age);
  const base=`${c.sur}家的门楣真是一日高过一日：${rise.kin}${rise.name}才由${rise.from}升为${rise.to}，宫里又连着晋位。`;
  const brother=rise.kin.includes('兄');
  if(brother&&!elder.length)return base+'偏我自幼没有兄长，身后少个得力的人。旁人倒连杨家贵妃有族兄杨国忠的旧话都说起来了。';
  if(brother&&elder.every(p=>officialAlive(p)&&(!officialGrade(p)||officialGrade(p)>8)))return base+'我家兄长各有自己的难处，哪里比得上这般得力。旁人提杨国忠作比，也不知是羡还是讥。';
  return base+(speaker.trait==='城府'?'“不重生男重生女”，如今倒又有人念起这句诗了。哪一头沾哪一头的光，外头看得明白么？':'从前那点门户，如今也摆起排场来。旁人说是一人得意，鸡犬升天——可真叫人眼热。');
}
function familyRiseEvent(c,speaker){
  const r=c.familyRise;if(!r)return null;const kin=courtPerson(r.key);
  const valid=()=>cohabAvailable(c)&&cohabAvailable(speaker)&&c.familyRise===r&&kin?.p.id===r.personId&&officialAlive(kin.p);
  const remark=familyRiseLine(speaker,c),publicly=speaker.rank>=c.rank;
  const finish=mode=>{
    if(!valid()||r.discussed)return null;r.discussed=S.turn;
    const context=`${r.kin}${r.name}获升任、本人接连晋位后，${fullName(speaker)}${publicly?'在请安散席时':'私下向陛下'}议论${fullName(c)}：“${remark}”`;
    story(speaker,`【门第酸语】${context}这番话出自自己的眼热，并非查实的任人唯亲。`);
    if(publicly)story(c,`【门第之讥】听见${fullName(speaker)}将自己的晋位与${r.kin}的升迁连在一起讥笑。${['骄纵','骄矜','善妒'].includes(c.trait)?'她忍不住恼火，觉得旁人仍只看从前的门户。':'她既委屈又警醒，怕家人的实绩也被一句闲话抹去。'}`);
    if(mode==='fair'){
      story(speaker,'陛下说明官员考课与后宫晋位各有记录，不许以门第轻慢人，也不许把诗句当成定罪的凭据。');
      if(publicly){story(c,'陛下当面制止以门第取笑，她稍觉宽慰，也知道自己日后仍须守好分寸。');cchg(c,{mood:5,aff:3});relAdd(c,speaker,-3);}
    }else if(mode==='why')story(speaker,'陛下问起酸语背后的心事，她终于承认是在意自己的冷落与家中缺少助力，并没有拿出对方任人唯亲的证据。');
    else {story(speaker,'陛下未立即接话，她将酸语收住，心里的不平并未尽消。');if(publicly){cchg(c,{mood:-5});relAdd(c,speaker,-6);}}
    log(`宫中因${fullName(c)}与家门近日的升迁晋位生出议论。`,1);return mode==='fair'?'已制止以门第相讥，原有功过与晋位记录仍依实情保留。':mode==='why'?'听见了她的不平，并没有因此更改另一人的位分或其家人的官职。':'此番议论记在实际知情者的纪事中。';
  };
  return {title:'门第酸语 · 光彩生门户',por:speaker,cast:publicly?[speaker,c]:[speaker],present:publicly?[speaker,c]:[speaker],valid,text:`${publicly?'请安散席时':'私下说话时'}，${fullName(speaker)}提起${fullName(c)}，语气带酸：\n“${remark}”\n这是嫉羡与门第偏见，并没有查出徇私的证据。`,choices:[
    {t:'论功看实绩，不许以门第相讥',f:()=>finish('fair')},
    {t:'问她为何如此在意，听听自己的心事',f:()=>finish('why')},
    {t:'暂不接话，让她收住议论',f:()=>finish('quiet')}
  ]};
}
function familyRiseTick(previous){
  if(!careersActive()||!previous||previous.gen!==S.gen)return;
  for(const c of harem()){
    const old=previous.consorts?.find(p=>p.id===c.id),r=c.familyRise;
    if(!old||!r||c.rank<=old.rank||c.rank<3||S.turn-r.turn>24||!cohabAvailable(c))continue;
    c.familyRiseRanks=(c.familyRiseRanks||[]).filter(x=>S.turn-x.turn<=24);c.familyRiseRanks.push({turn:S.turn,from:old.rank,to:c.rank});
    if(c.familyRiseRanks.length<2||r.discussed||r.queued||S.turn-(S.flags.lastFamilyRiseGossip??-99)<6)continue;
    const speaker=familyRiseSpeaker(c);if(!speaker)continue;
    r.queued=S.turn;S.flags.lastFamilyRiseGossip=S.turn;pushEv(familyRiseEvent(c,speaker));return;
  }
}
