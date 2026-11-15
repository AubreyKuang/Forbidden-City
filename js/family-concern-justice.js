/* A family's worry follows the known verdict. Affection is not a claim of innocence. */
const familyJusticeActive=()=>!!S&&journalContentVersion()>=19;
function familyPenaltyContext(c,old){
  const lines=(c.story||[]).slice(old?.story?.length??0).map(s=>s.t);
  const d=c.discipline;
  if(d?.gen===S.gen&&d.turn===S.turn&&d!==old?.discipline&&lines.some(t=>t.includes(d.crime)))return {known:'guilty',crime:d.crime};
  if(lines.some(t=>/因主使换婴被/.test(t)))return {known:'guilty',crime:'主使换婴'};
  if(lines.some(t=>/查明.*(清白|毫不知情)|昭雪|身世疑云已释/.test(t)))return {known:'cleared'};
  return {known:'unresolved'};
}
function familyPenaltyQuote(person,context){
  const t=person.temperament;
  if(context.known==='guilty'){
    if(t==='持正')return `${context.crime}既已查实，臣痛心她害了旁人，也愧于平日未能规劝。臣会写信责她认错自省，不敢求以亲情掩过。`;
    if(t==='谨慎')return `得知${context.crime}的案情，家中惶恐。臣不敢护短，将约束家人言行，劝她守禁思过；只盼依例给她衣药，不敢借此求免其责。`;
    if(t==='进取'||t==='骄矜')return `${context.crime}已然查实，臣又气又痛，也怕家门因此失了颜面。再舍不得，也不能说她无辜；家中会劝她认错守规。`;
    return `她做下${context.crime}这等错事，家里既痛心又担忧。臣不敢替她辩白，只求容家书劝她悔过，衣药照宫规供给便好。`;
  }
  if(context.known==='cleared')return '既已查明她未涉其事，家中才稍稍安心。受过的惊惧恐怕一时难消，只盼她能好好休养。';
  return t==='持正'||t==='谨慎'?'家中已知降罚，尚不敢妄议案情。臣会劝她守规静省，只盼依例照料起居；如需问话，家中自当配合。':'听闻她受了降罚，家中忧心，却不知事情全貌。臣不敢遽称冤枉，也不敢求掩过，只想托家书问一句起居平安，盼她有衣御寒、有药可医。';
}
const justicePunishEvent=punishEv;
punishEv=function(c,victim,crime){
  const ev=justicePunishEvent(c,victim,crime);
  for(const choice of ev.choices){if(!choice.f)continue;const apply=choice.f;choice.f=function(...args){
    if(familyJusticeActive())c.discipline={gen:S.gen,turn:S.turn,crime,verdict:'guilty',penalty:choice.t};
    return apply.apply(this,args);
  };}
  return ev;
};
function repairFamilyConcernWording(){
  if(!familyJusticeActive())return;
  const oldQuote='臣想听听她的近况。她性子里的委屈，可有人肯听？';
  for(const c of S.consorts){
    for(const entry of c.story||[]){
      if(!entry.t.startsWith('【娘家来信】'))continue;
      entry.t=entry.t.replace('得知自己','得知'+fullName(c));
      if(!entry.t.includes(oldQuote))continue;
      const punishment=c.story.find(s=>s.d===entry.d&&/事发，被降为.+，禁足宫中。/.test(s.t));
      const guilty=punishment&&punishment.t.match(/^(.+?)事发，被降为/);
      const context=guilty?{known:'guilty',crime:guilty[1]}:{known:'unresolved'};
      for(const person of careerPeople()){
        if(!entry.t.includes(person.p.name))continue;
        const quote=familyPenaltyQuote(person.p,context);entry.t=entry.t.replace(oldQuote,quote);
        for(const s of person.p.story||[])if(s.d===entry.d&&s.t.includes(fullName(c)))s.t=s.t.replace(oldQuote,quote);
        const n=person.p.palaceConcern;if(n?.c===c.id&&n.quote===oldQuote)n.quote=quote;
        break;
      }
    }
  }
}
const justiceConsortView=viewConsort,justiceOfficialView=viewOfficial,justiceFamilyConversation=officialConversation;
viewConsort=function(){repairFamilyConcernWording();return justiceConsortView();};
viewOfficial=function(){repairFamilyConcernWording();return justiceOfficialView();};
officialConversation=function(e,topic){repairFamilyConcernWording();return justiceFamilyConversation(e,topic);};
