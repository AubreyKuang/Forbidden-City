/* Keep the courtship that actually happened, including older diary entries and the two viewpoints. */
const betrothalWeddingsActive=()=>journalContentVersion()>=123;
function betrothalMemories(k,p,turn){
  const thread=`childhood-betrothal:${k.id}:${p.id}:${turn}`;
  const wedding=(k.story||[]).findIndex(e=>e.life?.title==='依约成婚'&&e.life.people?.some(x=>x.id===p.id));
  return (wedding<0?k.story||[]:k.story.slice(0,wedding)).flatMap(entry=>{
    const life=entry.life;
    if(!life||life.turn<turn||!life.people?.some(x=>x.id===p.id))return [];
    let kind;
    if(life.source==='婚约往来'){
      if(life.title==='正月互送岁礼')kind='gift';
      else if(life.title===ROYAL_NATAL_CONTACTS.letter.title)kind='letter';
      else if(life.title===ROYAL_NATAL_CONTACTS.visit.title)kind='visit';
    }else if(entry.thread===thread){
      if(life.title?.startsWith('两小无猜'))kind='childhood';
      else if(life.title?.startsWith('同行手记')||life.title==='同行归来')kind='journey';
    }
    return kind?[{kind,turn:life.turn,date:entry.d,text:life.summary||entry.t,affection:life.affection}]:[];
  });
}
function betrothalWeddingHistory(k,p,b){
  const entries=betrothalMemories(k,p,b.turn);
  const moments=['childhood','journey','letter','visit','gift'].flatMap(kind=>{
    const moment=entries.findLast(e=>e.kind===kind);
    return moment?[moment]:[];
  });
  const trust=k.spouse?.trust??50,scores=b.bond||{royal:trust,relative:trust};
  return {royal:scores.royal,relative:scores.relative,moments,chapter:0,
    item:b.childhood?.items?.at(-1)||null,plan:b.bond?.weddingInquiry?.plan||null};
}
function betrothalWeddingInquiry(k,p,host,b,weddingReady){
  if(!betrothalWeddingsActive()||!PalaceActions.busy)return false;
  const bond=b.bond;
  if(!bond||bond.weddingInquiry?.plan)return false;
  if(!bond.weddingInquiry){
    if(mourningActive()||k.jailed||k.templeStay||p.jailed||p.exiled||
       Math.min(kidAge(k),natalAge(p))<royalNatalAge('inquiry')||Math.min(bond.royal,bond.relative)<72)return false;
    const memories=betrothalMemories(k,p,b.turn);
    const turns=[...new Set(memories.map(m=>m.turn))].sort((a,b)=>a-b);
    const recentRift=memories.some(m=>m.turn>S.turn-6&&m.affection&&Math.min(...m.affection)<60);
    if(turns.length<3||turns.at(-1)-turns[0]<12||recentRift||!weddingReady&&!chance(.20))return false;
    bond.weddingInquiry={turn:S.turn};
  }
  if(!mourningActive())pushEv(betrothalWeddingInquiryEvent(k,p,host,b,bond.weddingInquiry));
  return true;
}
function betrothalWeddingInquiryEvent(k,p,host,b,inquiry){
  const item=b.childhood?.items?.at(-1),last=betrothalMemories(k,p,b.turn).at(-1);
  const afar=k.away||royalJourneyAway(k)||p.away||p.commission||p.diplomaticJourney||p.royalCompanionTrip;
  const opening=(afar?'礼部收到一封署着两人名字的信。':'两人一道来见礼官。')+
    (item?`他们提起幼时留下的${item}。`:last?`他们说起一段旧事。${last.text}`:'他们提起幼时交换的婚帖。');
  const when=S.turn<royalNatalWeddingDue(k,p,b)?`礼部算过日子，等两个人都满${cnNum(royalNatalAge('marriage'))}岁便可依约成婚。`:
    royalNatalWeddingReady(k,p,b)?'礼部已可以择日行礼。':'两个人年岁已足，礼部待两人可以行礼时再办。';
  const valid=()=>k.betrothal===b&&p.betrothal?.personId===k.id&&k.alive&&p.alive&&
    b.bond.weddingInquiry===inquiry&&!inquiry.plan&&!b.bond.petition;
  function answer(plan){
    if(!valid())return null;
    inquiry.plan=plan;
    const arrangement=plan==='quiet'?'婚仪从简，两人各择一件珍重的物什带进新居。':'请两家长辈到场见证，两人一同给家中报喜。';
    const text=`${k.name}与${p.name}一道来问婚期。陛下准他们依婚帖备礼。${arrangement}`;
    const mother=maternalWeddingsActive()?maternalWeddingMother(k):familyHostById(b.motherId);
    royalNatalStory(k,p,mother,'两心问婚期',text,
      `主动问起婚期，最想听的是${k.name}也亲口说愿早些把日子定下。`,
      mother&&maternalWeddingsActive()?`听说${k.name}与${p.name}一道问起婚期。${maternalWeddingVoice(mother).news}`:
        '听说两个人一道问起婚期，家中这才把幼时写过的生辰纸取出来。',
      {royalText:`和${p.name}一起定了婚礼的安排，回去便想亲手把这个消息写进家书。`});
    if(royalNatalWeddingReady(k,p,b))royalNatalPrepareWedding(k,p,host,b);
    return arrangement;
  }
  return {title:'两心问婚期',cast:[k,natalPortrait(p)],valid,
    text:`${opening}\n${k.name}问：“幼时的婚帖写了生辰，何时成礼，我们能不能一道听礼官说？”\n${p.name}也开了口：“我想和你一起把那一日记下来。”\n${when}`,
    choices:[{t:'准他们依约备礼，婚仪从简',f:()=>answer('quiet')},{t:'准他们依约备礼，请两家长辈见证',f:()=>answer('family')}]};
}
const weddingAffectionTone=h=>Math.min(h.royal,h.relative)>=72?'close':
  Math.abs(h.royal-h.relative)>=18?'uneven':Math.min(h.royal,h.relative)<42?'careful':'steady';

function betrothalWeddingRecord(k,p,c,name,history){
  const tone=weddingAffectionTone(history),memory=history.moments[0];
  const reminder=history.item?`席间，两人认出了幼时留下的${history.item}。家人把它连同婚帖一道送进新居。`:
    memory?`礼毕，二人谈起${memory.date}的旧事。${memory.text}`:'成礼后，两人将幼时的婚帖放进新居的匣子。';
  const plans={quiet:'婚仪依二人所请从简。他们各自带来一件旧物。',family:'两家长辈依二人所请到场见证。礼毕，两人一道向家中报喜。'};
  const scene={
    close:'礼官唱到他们的名字，两人抬头相视，笑意都落在案前的红绸上。',
    uneven:'行礼时，一人几次回头想说话，另一人先把手里的礼单叠齐。直到宾客散去，两人才坐下来，慢慢说起自己想要怎样的日子。',
    careful:'堂上礼数一一行过。到了新居，两人先各安置了自己的箱笼，随后坐下来商量明早何时一同用饭。',
    steady:'礼官唱过最后一声，两人请送客的人先去歇息，留下来商量旧帖收在哪只匣子里，来日想找也方便。'
  };
  const text=`${name}与${p.name}依幼时的婚约行礼成婚。${plans[history.plan]||''}${scene[tone]}\n${reminder}`;
  const reflection=score=>score>=72?'最欢喜的那一刻，是听见对方寻常的声音，和以往每回相见时一样。':
    score<42?'礼成时也还有犹疑。想把往后要紧的事，一件件当面说清楚。':'婚帖终于写进了今日的日子。往后想留些时间，慢慢知道对方爱过怎样的日子。';
  const note=history.item||({childhood:'小时候相见的光景',journey:'同行时记下的手记',letter:'从前互寄的旧信',visit:'前几回见面说过的话',gift:'往年各自送的岁礼'})[memory?.kind];
  royalNatalStory(k,p,c,'依约成婚',text,
    `新居里先认出了幼时的婚帖。${note?`收妥婚帖，又想起${note}。`:''}${reflection(history.relative)}`,
    '家中将幼时备下的婚帖副本另存一匣，在旁补记两人礼成的日子。',
    {royalText:`礼毕亲自将今日的日子写入家书。${note?`信里也记了一笔${note}。`:''}${reflection(history.royal)}`});
  return text;
}

const BETROTHAL_MARRIED_CHAPTERS={
  childhood:{title:'新居里的旧玩意',scene:'收拾新居时，两人把小时候珍重的东西摆在案边。',
    royal:'把它移到顺手能摸到的地方，想起小时候总替对方留着半边桌子。',
    relative:'替它拂了灰，给案边腾出一角，也留了一处放自己如今喜欢的东西。'},
  journey:{title:'再读同行手记',scene:'两人翻出旧日同行的记录，把漏记的见闻补在页边。',
    royal:'读到旧驿站那一页，提笔补下当时匆忙漏记的一句话。',
    relative:'挑了一段自己看见的山水，请对方照着手记从头讲一遍。'},
  letter:{title:'把信里的话接下去',scene:'两人从旧信里翻到一个当年只说了半截的话题，趁闲把话接了下去。',
    royal:'照旧将来信折角留作记号。今日开口，又听见许多纸上还没写完的话。',
    relative:'翻到那封等了许久的旧信，把当年想问的一句当面提了出来。'},
  visit:{title:'为相见留一张桌',scene:'新居里安了一处可对坐的地方。两人商量各从原住处带一样日常用物来。',
    royal:'把常用的物件搁到桌上，约好隔几日就留一点一道坐坐的工夫。',
    relative:'亲自挑了坐处，想起旧日常要等长辈领出门，便约好有空就来这里说话。'},
  gift:{title:'拆开旧岁礼',scene:'整理两家的旧礼单时，夫妻说起从前每到正月各自挑礼的光景。',
    royal:'还记得那年托人捎礼前盼回信的心情。找来旧礼单，又添了一笔今日想送的东西。',
    relative:'在礼单背面写了两人都想记住的一句家常话，随后把纸折回原样。'},
  start:{title:'新居的头一桩家常',scene:'两人将婚帖收妥，开始商量同住后的第一桩家常。',
    royal:'把自己惯常的起居时辰写在纸上，也留半张空白给对方慢慢添。',
    relative:'说清自己想保留的一段时辰，再约定哪一顿饭两个人愿一道用。'}
};

function betrothalMarriageNews(k,p,h=null){
  if(!betrothalWeddingsActive()||!p?.alive||!p.married||p.spouse?.royalId!==k.id)return false;
  const spouse=k.spouse;
  if(!spouse.betrothalHistory){
    const old=k.story?.find(e=>e.life?.title==='外家定亲'&&e.life.people?.some(x=>x.id===p.id));
    if(!old)return false;
    const found=betrothalWeddingHistory(k,p,spouse.childhoodBetrothal||{turn:old.life.turn});
    if(!found.moments.length)return false;
    spouse.betrothalHistory=found;
  }
  const past=spouse.betrothalHistory,partner=p.consortId!=null?byId(p.consortId):p;
  const chapters=past.moments.length?past.moments:[{kind:'start'}];
  const memory=chapters[past.chapter];
  if(!memory||!partner?.alive||p.away||p.commission||p.diplomaticJourney||p.incognitoCase)return false;
  if(!h&&S.turn<(past.palaceNext??spouse.marriedAt+3))return false;
  const row=BETROTHAL_MARRIED_CHAPTERS[memory.kind],tone=weddingAffectionTone(past);
  const current=spouse.trust??50;
  const fit=tone==='close'?'两人早熟悉彼此的口气，忙中也会替对方留出说话的时辰。':
    tone==='uneven'&&current<60?'一个急着把旧事聊下去，一个先说自己今日想静一会儿。两人定了下回说话的时辰。':
    tone==='careful'&&current<55?'说到各自的习惯，两人各有坚持，先各写下一件最希望对方知道的事。':'他们把说好的安排过了两遍，也给各人留下一点独处的工夫。';
  const summary=`${k.name}与${p.name}婚后相处。${row.scene}${fit}${memory.text?`\n旧记 · ${memory.date}：${memory.text}`:''}`;
  const thoughts=(score,line)=>score<42?`${line}仍有些话说来费力，今日先说一件。`:
    score>=72?`${line}把下回想与对方说的事也一并记下。`:line;
  const delta=tone==='close'?4:tone==='uneven'&&current<60?1:2;
  if(h)changeHouseholdAffection(k,delta);else spouse.trust=clamp(current+delta);
  if(h){
    h.harmony=clamp((h.harmony??60)+delta);
    householdRecord(k,'household_betrothal',summary,{chronicle:false});
  }else past.palaceNext=S.turn+4;
  past.chapter++;
  royalNatalStory(k,partner,null,row.title,summary,thoughts(past.relative,row.relative),undefined,
    {publicRecord:false,source:'婚后旧约',royalText:thoughts(past.royal,row.royal)});
  return true;
}
