/* An adult married relative can answer a private audience in her own way. */
const marriedSisterAffairsActive=()=>journalContentVersion()>=34;

function marriedSisterAvailable(c,p){
  return marriedSisterAffairsActive()&&!S.over&&!mourningActive()&&inPalace(c)&&p?.sex==='f'&&p.alive&&!p.consortId&&
    !p.parentRelativeId&&!p.motherRelativeId&&p.married&&p.spouse?.alive!==false&&(!!p.spouse||journalContentVersion()>=40)&&!p.widow&&natalAge(p)>=18&&
    (!p.spouse?.personId||officialAlive(maritalFather(p,null)?.p));
}

function marriedSisterVisitButton(c,p){
  const affair=p.marriedSisterAffair;
  if(!marriedSisterAvailable(c,p))return '';
  if(affair?.coerced)return '<p class="hint">她请家人谢绝私下求见。</p>';
  const exhausted=affair?.lastMeeting===S.turn;
  return `<button class="btn primary" onclick="A.marriedSisterVisit(${c.id},${p.id})" ${exhausted?'disabled':''}>${natalInPalace(c,p)?'在宫中私下求见':'到她的住所求见'}${exhausted?'<small>本月已经见过</small>':''}</button>${journalContentVersion()>=49?'<p class="hint">求见只会先问她的心意。</p>':''}`;
}

function sisterPrivateChance(p){
  const forward=['活泼','爽直'].includes(p.trait);
  if(journalContentVersion()<84)return p.willing!==false&&chance(forward?.48:.32);
  return chance(Math.min(.96,(p.willing===false?.80:forward?.90:.86)+(restlessDisposition(p)?.08:0)));
}
function sisterPrivateWords(c,p,meetings){
  const kin=natalLabel(c,p)==='姐姐'?'妹妹':'姐姐',relation=relGet(c,p);
  const first=meetings===0;
  if(relation<=-25)return first
    ?`她吃了一惊，随即抬眼看你：“从小大家都先问我${kin}怎么想。她能得你喜欢，难道我就不能？今日你是来见我的，可别又只问起她。”`
    :`“上回你记住了我爱喝的茶。”她把另一盏推过来，“我倒有些后悔，总拿自己和${kin}比。”`;
  if(relation>=30&&p.willing!==false&&(c.favor<35||['温婉','聪慧'].includes(p.trait)))return first
    ?`她吃了一惊，把替${kin}缝好的护腕放到一旁：“她信里什么都说好。我有时想，若能在宫里陪她，总能看出她哪天是真的高兴。”她顿了顿，“可今日留你，是我自己的意思。”`
    :`“若有一日我也入宫，你可许我们姐妹关起门说句家常？”她把新收到的信折好，留出你身旁的座位。`;
  if(!first&&meetings>1)return '她把上回没下完的棋重新摆好：“这一步我等了好些日子。这回你多坐一会儿，好不好？”';
  const reply={活泼:'她把身边的椅子拉近：“我猜了半日你会不会来，赌的是我自己。看来我赢了。”',
    爽直:'她迎着你的目光笑起来：“陛下若是真心喜欢我，就当面说。我听了高兴，也愿意你留下。”',
    聪慧:'她让人添了一盏热茶：“上次随口说的事，你竟还记得。今日我想听你把话说完。”',
    才女:'她翻开一本词集，把夹在里头的小笺递给你：“那日送别后填的。最后一句，想亲自念给你听。”',
    沉静:'她没有立刻答话，只把窗下那张空凳搬到自己身旁：“原以为只有我惦记那一面。”',
    温婉:'她亲手添了一盏茶，笑道：“你记得我说过的话，又特意来看我，我心里自然欢喜。”'};
  return (first?'她吃了一惊，听清来意才慢慢笑了。':'她认得你的脚步声。')+(reply[p.trait]||reply.沉静);
}
function sisterMarriageReflection(p,meetings){
  const husband=p.spouse?.name||'丈夫',bond=ensureMaritalBond(p).kind;
  if(bond==='affectionate')return meetings===1?`回家时，${husband}还给她留着一盏灯。她想起方才的私约，道谢时竟不敢看他。`:
    `见${husband}把她喜欢的菜移到面前，她几乎想坦白，又怕一句话伤了他的心，终究没说。`;
  if(bond==='distant')return meetings===1?`她将见面的事瞒下。${husband}只问她路上冷不冷，听她答了便各自歇下。`:
    `她把来信和家用账册分开收好，没有告诉${husband}近来惦记的是谁。`;
  return meetings===1?`她与${husband}照常用了晚饭，说起白日的琐事，唯独略过与你相见的那一段。`:
    `听${husband}说起下个月的家事，她应了一声。心里有话压着，却始终没能开口。`;
}
// Knowledge belongs to a particular consort and sister, and survives changes of marriage.
function sisterAffairKnowledge(c,p){
  return journalContentVersion()>=102?c.sisterAffairKnowledge?.[p.id]:null;
}
function discoverSisterAffair(c,p,affair){
  if(journalContentVersion()<102||affair.meetings<2)return;
  for(const witness of paternalFamily(c).filter(person=>person.id!==p.id&&S.consorts.includes(person)&&inPalace(person))){
    if(sisterAffairKnowledge(witness,p)||!chance(.08))continue;
    const relation=relGet(witness,p);
    const reaction=pickW([{v:'afraid',w:3},{v:'sad',w:relation<0?4:3},{v:'hopeful',w:relation>=30?4:2}]).v;
    const record=(witness.sisterAffairKnowledge||={})[p.id]={reaction,sister:p.id,name:p.name,turn:S.turn};
    const words={afraid:`她察觉你常去见已出嫁的${p.name}，心惊胆战，只怕消息传开，姐妹与两家都不得安宁。`,
      sad:`她察觉你常去见已出嫁的${p.name}，独自伤心落泪，既难过又不知如何面对姐妹。`,
      hopeful:`她察觉你常去见已出嫁的${p.name}，心里隐隐欢喜，盼着若姐妹自己愿意，有朝一日能入宫相伴。`};
    story(witness,`【察觉姐妹私事】${words[reaction]}`);
    pushEv({title:'姐妹私事 · 她已知晓',por:witness,valid:()=>inPalace(witness)&&sisterAffairKnowledge(witness,p)===record,
      text:`${fullName(witness)}知道了你与她已出嫁的${natalLabel(witness,p)}${p.name}屡次私会。${words[reaction]}`,
      choices:[{t:'听她说完'}]});
  }
}

function marriedSisterEncounter(c,p){
  if(!marriedSisterAvailable(c,p)||p.marriedSisterAffair?.coerced||p.marriedSisterAffair?.lastMeeting===S.turn)return null;
  p.spouse ||= initialNatalSpouse(p,natalAge(p));
  const direct=journalContentVersion()>=49;
  const gen=S.gen,turn=S.turn,spouse=p.spouse,inPalaceNow=natalInPalace(c,p);
  const affair=p.marriedSisterAffair?.spouseId===spouse.id?p.marriedSisterAffair:(p.marriedSisterAffair={
    ...(journalContentVersion()>=84?{host:c.id}:{}),spouseId:spouse.id,receptive:sisterPrivateChance(p),meetings:0
  });
  const valid=()=>S.gen===gen&&S.turn===turn&&p.spouse===spouse&&marriedSisterAvailable(c,p)&&!affair.coerced&&
    affair.lastMeeting!==S.turn&&inPalaceNow===natalInPalace(c,p);
  const opening=inPalaceNow?`趁${p.name}来${c.palace}探亲，你请她到偏厅说话。`:`你到${p.name}平日所住的地方，问她愿不愿意单独见一面。`;
  const answer=affair.receptive&&journalContentVersion()>=84?sisterPrivateWords(c,p,affair.meetings):affair.receptive?[
    '她吃了一惊，认出是你，随即亲自引你坐下：“我也曾想过，若能入宫与你相见，该是什么样。没想到你会先来找我。”',
    '她亲自来开门，先问上次那句迟迟没说完的话，你还记不记得。',
    '她望着窗外想了半晌：“总有片刻想见你。可一想到明日，我还有自己的家要回去。”'
  ][Math.min(affair.meetings,2)]:'她听懂了你的来意，退开一步道：“请陛下回去。妾身不愿单独留下。”';
  const consent=direct&&affair.receptive?'\n她遣开随侍，道：“妾身愿留在这里承宠。若陛下也愿意，今夜请留下。”':'';
  const settle=coerced=>{
    if(!valid()||!useE())return null;
    affair.lastMeeting=S.turn;
    if(coerced){
      affair.coerced=true;p.mood=clamp((p.mood??65)-28);
      chg({prestige:-8,people:-3});
      story(p,'【不愿再见】她已明言拒绝，皇帝仍强令她留下。此后她托家人谢绝皇帝私下求见。');
    }else{
      affair.meetings++;
      story(p,direct?`【私下承宠】她愿意与你私下相会，在${inPalaceNow?c.palace+'偏厅':'自己的住处'}承宠。${journalContentVersion()>=84?sisterMarriageReflection(p,affair.meetings):'离开后，她将这件事藏在心里。'}`:
        `【私下相会】她自己答应在${inPalaceNow?c.palace:'住处'}与你见面。${answer}`);
    }
    if(natalPregnancyReady(p)&&chance(.28))beginNatalPregnancy(c,p,{unconfirmed:true});
    if(!coerced)discoverSisterAffair(c,p,affair);
    if(!coerced&&affair.meetings>=3&&!p.natalPregnancy&&S.turn-(affair.lastRequest??-99)>=12)pushEv(marriedSisterAdmissionRequest(c,p,affair));
    return coerced?'她的拒绝没有得到尊重。离开后，她请家人此后替她挡下私召。\n§精力−1 · 威望−8 · 民心−3':
      direct?`今夜，${p.name}自愿在${inPalaceNow?c.palace+'偏厅':'住处'}承宠。${inPalaceNow?'过后她理好衣裳，回到姐妹处，仍按原定日子归家。':'天明前她亲自送你出门，转身回到原来的家中。'}\n§精力−1`:
      '这次相会过去后，她仍照自己的安排回去，临别说想再见你一面。\n§精力−1';
  };
  return {title:'私下求见 · '+p.name,por:natalPortrait(p),valid,text:`${opening}\n${answer}${consent}`,choices:[
    ...(affair.receptive?[{t:direct?'她愿意，私下承宠 · 精力−1':'依她心意留下相会 · 精力−1',cond:()=>E().energy>0,f:()=>settle(false)}]:[
      {t:'违她意愿，强令留下',cond:()=>E().energy>0,f:()=>{
        if(valid())pushNow({title:'她已拒绝',por:natalPortrait(p),valid,danger:true,
          text:'她已经当面拒绝。强留会使她受到伤害，也会损及朝廷声望。',choices:[
            {t:'到此为止，离开'},{t:'仍然强留 · 精力−1',cond:()=>E().energy>0,f:()=>settle(true)}]});
        return null;
      }}]),
    {t:affair.receptive?'今日只说几句话':'尊重她的拒绝，离开'}]};
}

A.marriedSisterVisit=function(id,relative){
  if(modalOpen||!marriedSisterAffairsActive())return;
  const entry=natalEntry(id,relative);
  const event=entry&&marriedSisterEncounter(entry.c,entry.p);
  if(event)pushEv(event);
};

const marriedSisterBaseMeeting=natalMeetingEvent;
natalMeetingEvent=function(c,p){
  const event=marriedSisterBaseMeeting(c,p);
  if(event&&marriedSisterAvailable(c,p)&&!p.marriedSisterAffair?.coerced&&p.marriedSisterAffair?.lastMeeting!==S.turn){
    event.choices.splice(-1,0,{t:'请她到偏厅单独说话',f:()=>{
      if(!natalInPalace(c,p))return null;
      const encounter=marriedSisterEncounter(c,p);if(encounter)pushNow(encounter);
      return null;
    }});
  }
  return event;
};

function noteMarriedSisterPregnancy(p,preg){
  if(!preg.unconfirmed||preg.noted||S.turn-preg.conceived<2)return;
  preg.noted=true;
  story(p,'【胎中疑事】有孕的日子与那次私见相近，她自己也说不准孩子的亲缘。她照常留在家中将养，把那段往来藏在心里，只盼孩子平安。');
  if(!chance(.14))return;
  const husband=maritalFather(p,preg)?.p||p.spouse;
  if(!officialAlive(husband))return;
  preg.husbandSuspects=true;
  (husband.story||=[]).push({d:dateStr(),t:`【家中疑心】${p.name}近来神色不宁，提到某些日子便换了话头。他察觉异样，心里有了疑惑。`});
  story(p,'【胎中疑事】丈夫问她近来何以心事重重。她只说夜里睡得浅，自己却又坐到灯冷。');
}

function noteMarriedSisterChild(p,child){
  child.unconfirmedParentage=true;
  story(child,'【身世未明】宫外出生，随母家亲缘载入家谱。有关生父的疑问暂无定论。');
  if(p.alive)story(p,`【护着孩子】${child.name}出生后，她把来往的旧信收好，亲自过问乳母与日常用度，只愿孩子平安长大。`);
}

function unconfirmedParentageTag(p){
  return p.unconfirmedParentage?'<span class="tag y">身世未明</span>':'';
}

function marriedSisterAdmissionRequest(c,p,affair){
  const gen=S.gen,turn=S.turn,spouse=p.spouse;
  let shown=false;
  const valid=()=>S.gen===gen&&S.turn===turn&&p.spouse===spouse&&marriedSisterAvailable(c,p)&&!p.natalPregnancy&&
    p.marriedSisterAffair===affair&&affair.receptive&&!affair.coerced;
  const decline=()=>{
    if(!valid())return null;
    affair.lastRequest=S.turn;p.mood=clamp((p.mood??65)-12);
    story(p,'【求入宫未允】她问能否入宫，你没有应允。她沉默了许久，后来才请人来收好茶盏。');
    return '她低声应了一句，良久才起身告退。';
  };
  return {title:'她问能否留下',por:natalPortrait(p),valid,
    onShow:()=>{if(shown)return;shown=true;affair.lastRequest=S.turn;story(p,'【求入宫】相见几次以后，她终于开口问能否入宫。');},
    text:`${p.name}与你几番相见后，终于问道：“若我愿意离开现在的家，陛下也肯接我入宫么？我知道${fullName(c)}听见一定会惊讶。”`,choices:[
      {t:'答应她，传话议入宫',f:()=>{if(valid())pushNow(marriedSisterAdmissionReview(c,p,valid));return null;}},
      {t:'不答应她入宫',f:decline}]};
}

function marriedSisterAdmissionReview(c,p,valid){
  const d=S.flags.dowager,queen=empress();
  let shown=false;
  const royalWarning=d?.alive?dowagerPerson(d):queen;
  const voice=d?.alive?'太后':'皇后';
  const rumorCost=maritalFather(p,null)?4:2;
  const known=sisterAffairKnowledge(c,p);
  const reactionText=known?.reaction==='hopeful'?`她早已知道此事，曾盼姐妹能在一处，却仍要问清${p.name}是否真心愿意。`:known?.reaction==='sad'?`她早已知道此事，仍为姐妹与皇帝的往来伤心，如今听说入宫，更是低头落泪。`:known?.reaction==='afraid'?`她早已知道此事，听说要接姐妹入宫，更担心消息传开后两家如何自处。`:null;
  const objection=royalWarning?`${voice}听见要接臣民之妻入宫，亲自来劝你收回成命。`:'礼部请你收回成命，朝中已有议论。';
  return {title:d?.alive?'慈宁宫劝止':'请收回成命',por:royalWarning||natalPortrait(p),cast:[c,natalPortrait(p)].filter(person=>person!==royalWarning),valid,danger:true,
    onShow:()=>{if(shown)return;shown=true;chg({prestige:-rumorCost});story(c,reactionText?`【姐妹求入宫】${reactionText}`:`【惊闻姐妹求入宫】她听见${p.name}竟有意入宫，惊讶之后再三问这话究竟有没有说错。`);if(d?.alive)dowagerRecord(d,'劝止召纳',`得知皇帝有意接已出嫁的${p.name}入宫，出言劝止。`);},
    text:`${objection}\n${reactionText?`${fullName(c)}听到消息。${reactionText}`:`${fullName(c)}听到消息，讶然道：“她的婚事已有归处，怎会突然走到这一步？”`}\n若执意册封，将解除原有婚姻，朝中与后宫还会有更大的反响。\n§消息传开 · 威望−${rumorCost}`,choices:[
      {t:'听劝，收回成命',f:()=>{if(!valid())return null;p.mood=clamp((p.mood??65)-10);story(p,'【入宫之议作罢】劝谏之后，先前的口头承诺收回。她回到家中，许久未再提起这件事。');return '你收回了先前的口头应允。她回到家里，姐妹间却多了一重难以开口的话。';}},
      {t:'执意解除旧婚，册为常在',cond:()=>valid()&&rankCount(2)<RANK_CAP[2],why:'常在位分已满',f:()=>{
        if(!valid()||rankCount(2)>=RANK_CAP[2])return null;
        return admitMarriedSister(c,p,d?.alive);
      }}]};
}

function admitMarriedSister(c,p,dowagerOpposed){
  const spouse=p.spouse,husband=maritalFather(p,null)?.p,marriage=officialMarriageRecord(p.officialMarriageId);
  (p.formerSpouses||=[]).push({...spouse,ended:S.turn,reason:'奉旨解除婚姻'});
  if(marriage)marriage.ended={turn:S.turn,reason:'奉旨解除婚姻'};
  delete p.spouse;delete p.officialMarriageId;p.married=false;
  const husbandStory=`【婚姻被解除】诏令解除他与${p.name}的旧婚，接她入宫。原有子女和往日的家书仍在。`;
  const husbandRecord=husband||p.formerSpouses.at(-1);
  (husbandRecord.story||=[]).push({d:dateStr(),t:husbandStory});
  if(husband){
    husband.trust=clamp((husband.trust??40)-30);
    if(husband.spouseRelative?.relativeId===p.id||husband.spouse?.id===p.id||husband.spouseName===p.name){
      husband.married=false;delete husband.spouseRelative;delete husband.spouseName;delete husband.spouse;delete husband.officialMarriageId;
    }
  }
  const g=makeNatalConsort(c,p);
  addConsort(g,2,'奉旨解除原婚后入宫');p.story=g.story.map(entry=>({...entry}));
  const known=sisterAffairKnowledge(c,p);
  if(known?.reaction==='hopeful'){cchg(c,{mood:5,aff:2});relAdd(c,g,4);story(c,`【姐妹入宫】${p.name}终于入宫，她为姐妹能相伴而欢喜，也牵挂她离开旧家的处境。`);}
  else if(known?.reaction==='sad'){cchg(c,{mood:-12,aff:-6});relAdd(c,g,-26);story(c,`【姐妹入宫】${p.name}入宫，她想起早已知道的往事，仍觉伤心，一时不知如何面对姐妹。`);}
  else if(known?.reaction==='afraid'){cchg(c,{mood:-12,aff:-6});relAdd(c,g,-10);story(c,`【姐妹入宫】${p.name}入宫，她更担心外界议论，只盼姐妹与两家平安。`);}
  else {cchg(c,{mood:-12,aff:-6});relAdd(c,g,-26);story(c,`【姐妹入宫】你执意册封${p.name}，她震惊之余，也忧虑两家如何相见。`);}
  // Other sisters may also have learned of this particular relationship.
  // Their saved reactions apply even when another sister received the request.
  const aware=journalContentVersion()>=111?harem().filter(o=>o!==g&&o!==c&&sisterAffairKnowledge(o,p)):[];
  for(const relative of aware){
    const reaction=sisterAffairKnowledge(relative,p).reaction;
    if(reaction==='hopeful'){
      relAdd(relative,g,4);story(relative,`【姐妹入宫】她早知${p.name}与皇帝的往来，如今姐妹能在宫中相伴，她欢喜之余也惦记着对方离开旧家的处境。`);
      story(g,`【初入宫门】${cName(relative)}见到她，悄悄问起往后的起居，愿与她互相照应。`);
    }else if(reaction==='sad'){
      relAdd(relative,g,-18);story(relative,`【姐妹入宫】她早已为${p.name}与皇帝的往来伤心，如今见姐妹入宫，仍不知该怎样相处。`);
      story(g,`【初入宫门】${cName(relative)}见她时沉默了许久，她知道姐妹心里还有难过。`);
    }else{
      relAdd(relative,g,-8);story(relative,`【姐妹入宫】她早已知道${p.name}与皇帝的往来，如今更担心宫外议论，盼两家平安。`);
      story(g,`【初入宫门】${cName(relative)}悄声提醒她留意宫外议论，又问她住得安不安稳。`);
    }
  }
  const rivals=harem().filter(o=>o!==g&&o!==c&&!aware.includes(o)&&o.rank>=6);
  for(const rival of rivals){
    relAdd(rival,g,rival.rank===8?-52:-38);
    story(rival,`【对新常在的非议】她得知${p.name}原有婚姻，尤其不满皇帝在劝阻后仍强行册封。`);
    story(g,`【初入宫门】${cName(rival)}在请安时态度冷淡，她听出对方仍在议论自己的来处。`);
  }
  const prestige=16+(husband?5:0)+(dowagerOpposed?6:0),people=dowagerOpposed?8:5;
  chg({prestige:-prestige,people:-people});
  log(`${p.name}的旧婚奉旨解除，她随后册为常在。朝中与后宫均有议论。`,1);
  return `${p.name}已册为常在。旧婚及宫外子女载在原有档案里，${journalContentVersion()>=111&&known?.reaction!=='sad'&&!!known&&!rivals.length&&!aware.some(o=>sisterAffairKnowledge(o,p).reaction==='sad')?'宫中众人各有心思':'宫里也有人因此与她生出嫌隙'}。\n§威望−${prestige} · 民心−${people}`;
}

function marriedSisterChildrenPanel(c){
  if(!marriedSisterAffairsActive()||!c.natalOrigin)return '';
  const children=natalChildrenOf(c,c.natalOrigin.relative);
  const mother=c.house?.relatives?.find(p=>p.id===c.natalOrigin.relative);
  return detailSection('原家子女',children.map(p=>`<p><button class="person-link" onclick="A.go('natal','${c.id}:${p.id}')">${esc(p.outsideFamilyOrigin?.name||p.name)} ↗</button> ${outsideChildBadge(p)}</p>`).join(''))+
    (mother?outsideHouseholdHusbandPanel(mother):'');
}

const marriedSisterOfficialView=viewOfficial;
viewOfficial=function(){
  const html=marriedSisterOfficialView();
  return marriedSisterAffairsActive()&&officialEntry(UI.sel)?.p.unconfirmedParentage
    ?html+detailSection('身世未明','<p>其生父尚无定论，婚籍所载亲缘仍可查阅。</p>'):html;
};
