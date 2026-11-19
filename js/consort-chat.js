/* One conversation, one subject. The cursor is saved; a new month or a new
   feeling first returns to her mood without losing the unfinished topics. */
function chatMoodVoice(c){
  if(lifeBoundary(c))return chatVoiceFrom(c,lifeVoice(c));
  const x=xinOf(c),concern=continuityConcern(c);
  if(concern)return {key:'mood-concern',stage:'这件事仍压在她心上。',text:concern.text,narrative:true};
  if(['悲恸','心如死灰','怨恨','惶恐'].includes(x)||c.hp<40)return chatVoiceFrom(c,consortEmotionalVoice(c,x));
  const words={
    '委屈':'事情虽过去了，臣妾心里却还不好受。今日可否先听臣妾说完？',
    '忧心':'臣妾心里还有牵挂，今日总有些不安。陛下肯听，臣妾便慢慢说。',
    '思念':'这几日想同陛下说说话。见着了，倒想先一起坐一会儿。',
    '嫉恨':'臣妾知道不该事事计较，可心里那一点不甘，眼下还放不下。',
    '清静被扰':'今日只想清清静静坐一会儿。陛下若愿，就陪臣妾喝完这盏茶吧。',
    '欢喜':'今日心里欢喜，连寻常日子也觉得有滋味。正想说给陛下听。',
    '感激':'那份照应，臣妾一直记着。今日见到陛下，想亲口道一声谢。',
    '释然':'先前压在心里的事，如今总算能放下些了。这样坐着说话，也觉轻快。',
    '野心':'臣妾近来多了些打算，也想听听陛下的意思。'
  };
  const calm={proud:'今日心里还算舒坦。陛下既来了，便坐近些，好好说几句话。',reserved:'今日没有什么烦心事。陛下若得闲，便坐下喝盏茶吧。',direct:'今日倒过得痛快。陛下想说什么，臣妾都肯听。',bright:'今日心里轻快，正想找人说说话。陛下来得巧。',maker:'今日手边的事做得顺，心里也安稳。歇一歇，陪陛下说话。',gentle:'今日一切安好。能这样安静坐一会儿，臣妾便很知足。'};
  return {key:'mood-'+x,stage:x!=='平和'&&c.xin?.why?`她仍记着：${c.xin.why}。`:consortVoicePhase(c)==='first'?'初见时，她仍有几分拘谨。':'',text:words[x]||(c.mood<35?'今日有些提不起精神。陛下陪臣妾静静坐一会儿便好。':calm[companionStyle(c)])};
}
function chatVoiceFrom(c,v){
  const fresh=v.lines.filter(t=>!(c.voiceRecent||[]).includes(t));
  return {key:v.key,stage:v.stage,text:pick(fresh.length?fresh:v.lines)};
}
function consortChatTopics(c){
  const topics=[],add=(id,make)=>topics.push({id,make});
  const children=S.children.filter(k=>k.alive&&!k.pendingName&&(k.mom===c.id||k.foster===c.id));
  if(children.length)add('child',()=>{
    const k=pick(children),age=kidAge(k),bond=k.motherBonds?.[c.id];
    if(bond?.motherView&&S.turn-bond.turn>=0&&S.turn-bond.turn<=6)return {key:'child',stage:`她说起${k.name}近来的一件事。`,text:bond.motherView,narrative:true};
    return {key:'child',stage:`话题慢慢转到了${k.name}身上。`,text:childHasLeftPalace(k)?`${k.name}如今有了自己的日子，臣妾替孩子高兴，也牵挂着。得闲有封信来便好了。`:age<3?`${k.name}还小，臣妾想把这些日子好好记住。`:age<10?`${k.name}一天比一天有主意了，臣妾也想多听听孩子自己的话。`:`${k.name}长大了，有些心事不肯全说。臣妾只盼有难处时，孩子还肯来找我。`};
  });
  for(const k of children){
    const home=currentMotherResidenceConversation(k);if(!home||home.mother!==c)continue;
    add('mother-residence-'+k.id,()=>({key:'mother-residence-'+k.id,stage:`她说起${k.name}近来的居处。`,text:home.stay
      ?isSolitary(c)?`${k.name}留在身边，臣妾心里安稳。平日各自读书，晚间再说几句话，就很好。`:`${k.name}能继续住在身边，臣妾很宽慰。课业也没有落下，请陛下放心。`
      :isSolitary(c)?`${k.name}搬过去后，屋里安静了许多。臣妾已约好去看孩子，也盼${k.sex==='f'?'她':'他'}慢慢住惯。`:`${k.name}刚搬过去，臣妾有些牵挂。会常去看孩子，也想等${k.sex==='f'?'她':'他'}慢慢熟悉新住处。`}));
  }
  const people=harem().filter(o=>o!==c&&((relGet(c,o)>=30&&socialPair(c,o))||relGet(c,o)<=-30));
  if(people.length||fiveBrotherReady(c)||sisterTalkPartner(c))add('relations',()=>{
    const family=fiveBrotherChat(c)||sisterChatLine(c);
    if(family)return {key:'relations',stage:'',text:family,narrative:true};
    if(!people.length)return chatVoiceFrom(c,consortYearsVoice(c));
    const o=pick(people),memory=genuineSocialMemory(c,o),hobby=sharedConsortHobby(c,o);
    if(memory)return {key:'relations',stage:'',text:memory,narrative:true};
    return {key:'relations',stage:`她说起${fullName(o)}。`,text:relGet(c,o)<0?'我与她还不投契，有些事想法不同。':hobby?`下回得了闲，臣妾想约她${CONSORT_HOBBIES[hobby].activity}。`:'与她说话，臣妾觉得自在。'};
  });
  if(journalContentVersion()>=102)for(const known of Object.values(c.sisterAffairKnowledge||{})){
    const relative=c.house?.relatives?.find(p=>p.id===known.sister);
    const admitted=!!relative?.consortId;
    const words={afraid:`那件事臣妾一直担心，只怕外头议论，牵连${known.name}与家里。`,
      sad:`想到陛下与${known.name}的事，臣妾心里仍难过，也不知道该怎样面对她。`,
      hopeful:admitted?`${known.name}如今能在宫中相伴，臣妾心里欢喜，也盼她过得安稳。`:`臣妾盼${known.name}过得好；若她自己愿意，将来姐妹能在一处便好了。`};
    if(journalContentVersion()>=157&&!admitted&&relative?.alive&&known.letter?.sent!=null){
      if(known.letter.reply)words[known.reaction]+=' 她回信说：“'+known.letter.reply+'”';
      else if(!known.letter.closed)words[known.reaction]+=' 臣妾已经给她写过信了，还在等她的回音。';
    }
    if(words[known.reaction])add('sister-affair-'+known.sister,()=>({key:'sister-affair-'+known.sister,stage:`她又提起${known.name}。`,text:words[known.reaction]}));
  }
  const opening=consortVoicePhase(c)==='first',wish=WISHES[c.wish];
  if(!opening&&c.aff>=50&&wish&&!c.wishDone)add('wish',()=>{
    const known=c.wishKnown;c.wishKnown=true;
    if(!known)story(c,`对陛下说出心愿：${wish.t}。`);
    return {key:'wish',stage:known?'她又提起自己的心愿。':'她犹豫片刻，说出了自己的心愿。',text:wish.t+'。'};
  });
  if(!c.kl)add('likes',()=>{c.kl=true;return {key:'likes',stage:'她说起自己的喜好。',text:`臣妾最喜欢${c.like}，不大喜欢${c.hate}。`};});
  if(!opening&&c.aff>=65&&!c.woundKnown&&(WOUNDS[c.wound]||personalContextActive()&&c.gouyi))add('past',()=>{c.woundKnown=true;story(c,'第一次对陛下说起入宫前的往事。');return {key:'past',stage:'她第一次慢慢说起从前的事。',text:consortPastText(c),narrative:true};});
  if(personalContextActive()&&c.gouyi?.past?.stage&&gouyiLifeEligible(c))add('gouyi-past',()=>chatVoiceFrom(c,consortVoicePool(c).find(v=>v.key==='gouyi-past')));
  const ongoing=continuityThreads(c).filter(continuityOpen).at(-1);
  if(ongoing&&continuityAvailable(ongoing))add('ongoing',()=>({key:'ongoing',stage:'她接着谈起近来牵挂的事。',text:ongoing.history.at(-1)?.text||continuityDesire(ongoing),narrative:true}));
  const schemers=harem().filter(o=>o!==c&&o.scheme>=65&&!o.known);
  if(!opening&&c.aff>=50&&schemers.length)add('warning',()=>{const o=pick(schemers);o.known=true;return {key:'warning',stage:'她压低了声音。',text:`${cName(o)}那边，陛下还是留个心眼好。`,narrative:false};});
  const memories=NPCMemory.recall(S,c.id).map(m=>({k:m.type,t:m.interpretation,channel:m.channel})).concat(c.mem||[]).filter(m=>m.t&&(MEMT[m.k]||m.k==='hurt'));
  if(!opening&&memories.length)add('memory',()=>{const m=pick(memories);return {key:'memory',stage:m.channel==='hearsay'?'她说起听来的消息，还不敢当作定论。':'她想起一段往事。',text:m.t,narrative:true};});
  if(!opening&&S.flags.lastCourt&&['好读史','直言'].includes(c.t2))add('court',()=>({key:'court',stage:`她听说了「${S.flags.lastCourt}」的事。`,text:HISTC[S.flags.lastCourt]||'她说：“朝中的事，臣妾也想多听明白些。”',narrative:true}));
  if(!opening&&c.aff>=55&&!NEGX.includes(xinOf(c))&&!lifeBoundary(c)&&c.hp>=40&&S.turn-(c.sharedMoments?.last??-99)>=6)add('shared',()=>({key:'shared',stage:'',text:recordSharedMoment(c,xinOf(c)),narrative:true}));
  return topics;
}
function layeredConsortChat(c){
  const x=xinOf(c),moodKey=JSON.stringify([x,c.xin?.why,lifeBoundary(c)?.cause,continuityConcern(c)?.text]);
  const previous=c.chatThread,first=!previous||previous.turn!==S.turn||previous.moodKey!==moodKey;
  const thread=c.chatThread={turn:S.turn,moodKey,seen:[...(previous?.seen||[])]};
  let voice,topic;
  if(first){topic='mood';voice=chatMoodVoice(c);}
  else{
    const all=consortChatTopics(c),available=all.filter(t=>!thread.seen.includes(t.id));
    if(available.length){const next=available.length===1||chance(.75)?available[0]:pick(available);topic=next.id;voice=next.make();thread.seen.push(topic);}
    else {topic='quiet';voice=chatVoiceFrom(c,consortYearsVoice(c));}
  }
  let feeling='';
  if(topic==='mood'&&NEGX.includes(x)&&!lifeBoundary(c)&&!continuityBlocksSoothing(c,x)){
    const probability=({'思念':.8,'委屈':.6,'惶恐':.55,'嫉恨':.25,'悲恸':.3,'怨恨':.12,'心如死灰':.1,'忧心':.2}[x]||0)+c.aff/400;
    if(chance(probability))setXin(c,x==='思念'?'欢喜':'释然','陛下听她说完此刻的心事');
    feeling=xinOf(c)!==x?`\n§心境：${x} → ${xinOf(c)}`:`\n§她的心境仍是「${x}」`;
  }
  thread.moodKey=JSON.stringify([xinOf(c),c.xin?.why,lifeBoundary(c)?.cause,continuityConcern(c)?.text]);
  thread.lastTopic=topic;
  // Exhausted subjects become available in a later month, not on the next click.
  if(first&&previous?.turn!==S.turn){const all=consortChatTopics(c);if(all.every(t=>thread.seen.includes(t.id)))thread.seen=[];}
  const effect=cchg(c,{aff:routineAffection(c,c.trait==='痴情'?8:5),mood:8,favor:2});
  c.lastPersonalAttention=S.turn;
  story(c,`陛下驾临闲话。${voice.text}`);rememberConversation(c,voice,c.palace);setScene('harem');
  const text=[voice.stage,voice.narrative?voice.text:`“${voice.text}”`].filter(Boolean).join('\n');
  pushEv({title:'闲话家常',por:c,text:text+feeling+fx(effect),choices:[ok1]});
}
