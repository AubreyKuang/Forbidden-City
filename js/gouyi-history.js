/* A historical namesake is not the fate of the woman who lived in this court. */
const gouyiReadingActive=()=>PalaceActions.contentVersion>=18;
function gouyiCourtHistory(){
  let person=S.consorts.find(c=>c.gouyi),gen=S.gen;
  if(!person)for(const court of [...(S.previousCourts||[])].reverse()){
    person=court.consorts.find(c=>c.gouyi);if(person){gen=court.gen;break;}
  }
  if(!person)return S.flags.gouyiSeen?.outcome==='入宫'?{id:S.flags.gouyiSeen.id,gen,key:`${gen}:${S.flags.gouyiSeen.id}`,status:'remembered'}:null;
  const status=gen!==S.gen?'previous':!person.alive?'dead':person.gone?'departed':person.cold?'cold':person.homeLeave||person.templeStay?'away':'palace';
  return {person,id:person.id,gen,key:`${gen}:${person.id}`,status};
}
function gouyiReadingReady(c){
  const h=gouyiCourtHistory();return gouyiReadingActive()&&!S.over&&h&&inPalace(c)&&c.age>=18&&c.hp>=40&&!maternalVoiceUrgent(c)&&!['悲恸','心如死灰'].includes(xinOf(c))&&c.gouyiReading?.key!==h.key;
}
function gouyiReadingEvent(c){
  if(!gouyiReadingReady(c))return null;
  const h=gouyiCourtHistory(),g=h.person,own=g===c;
  const friend=!own&&g&&h.gen===S.gen&&relGet(c,g)>=25;
  const probing=!own&&g&&h.gen===S.gen&&relGet(c,g)<0&&['善妒','城府','骄矜'].includes(c.trait);
  const oldAnswer=c.gouyiAnswer;
  const context={
    palace:own?'她读到“钩弋”二字时停了下来。昔日令人惊叹的称谓，此刻连着书中女子的死讯。':`她的目光停在“钩弋”二字上：“如今宫里也这样称呼赵令仪。她若读到这里，会怎样想？”`,
    away:'“令仪眼下不在宫中，可她回来后，若听到有人这样说……”她没有把后半句说完。',
    cold:'“令仪如今在冷宫。眼下的处置自有缘故，可若再拿这段旧史影射她，便像连往后的命都替她判了。”',
    departed:'“赵令仪已经离宫，宫里却还会提起她的别称。不能因为同叫钩弋，就把书里的下场也算在她头上吧？”',
    dead:'“令仪已经去世。”她将书页压平，“她在宫里走过的日子，自有我们的记载。不能只因一个相同的称谓，就说她也应了这段旧史。”',
    previous:'“先朝曾有一位赵令仪，也被称作钩弋夫人。”她指了指旧记，“本朝记下的那个人，与汉代书中的女子，终究各有一生。”',
    remembered:'“本朝也曾迎赵令仪入宫，称她钩弋夫人。这个称谓如今已有了宫里的旧事，不能只按书里一句话讲了。”'
  }[h.status];
  const question=own?(c.preg?'“臣妾如今有孕，读到这里难免害怕。陛下会不会也觉得，孩子与母亲只能留下一个？”':S.children.some(k=>k.alive&&k.mom===c.id)?'“臣妾想起自己的孩子，便读不下去了。难道做了母亲，便是有一日该被防着的人？”':'“臣妾还没有走过书里那些事，旁人却已有了结局。陛下看见的，到底是令仪，还是又一位钩弋？”'):
    friend?'她将声音放轻：“臣妾同她相处过，知道她也会怕。史书里的议论，若被人拿来吓她，便不只是读史了。”':
    probing?'她抬眼看你，像在等一个分量：“陛下看重那场河间奇遇，也会想到史书里的另一面么？”':
    ['dead','departed','previous','remembered'].includes(h.status)?'“读旧史，是为了明白前人的得失，还是要让后来的人再走一遍？”':'“这件事若只谈权衡，听在宫中女子耳里，又是什么滋味？”';
  const earlier=oldAnswer==='yes'?'\n她记得你从前说过“该杀”，这回没有再把那句话当成随口论史。':oldAnswer==='self'?'\n她还记得你说过“朕不是汉武帝”，却想知道这句话落到眼前的人身上，究竟意味着什么。':oldAnswer==='no'?'\n她记得你从前说不该，如今提起，是想知道这份答复对令仪也一样算数。':'';
  let settled=false;
  const valid=()=>!settled&&gouyiReadingReady(c)&&gouyiCourtHistory()?.key===h.key&&gouyiCourtHistory()?.status===h.status;
  const canTell=()=>valid()&&!own&&h.gen===S.gen&&inPalace(g);
  const finish=kind=>{
    if(!valid()||kind==='tell'&&!canTell())return null;settled=true;
    const merciful=kind==='promise'||kind==='tell';
    c.gouyiAnswer=merciful?'no':kind==='boundary'?'self':'avoid';
    c.gouyiReading={key:h.key,status:h.status,answer:kind,turn:S.turn};
    const decision={promise:(oldAnswer==='yes'?'陛下承认先前把“该杀”说得太轻，收回那句断语。':'')+'陛下答应：立储与辅政须有章法，不会只因母亲年轻、孩子可能继位，便预先罪其母。',
      tell:'陛下说明不会拿“主少母壮”先罪其母，并命人只将这一句答复转告赵令仪。',
      boundary:'陛下止住以旧史影射今人的说法：赵令仪的一生按她实际的行止与经历来记，不以“钩弋”二字预定荣辱生死。',
      avoid:'陛下只说帝王也有难处，未肯正面回答。她收起书，没有把沉默理解成一个保全人的承诺。'}[kind];
    const thought=kind==='avoid'?(own?'他没有说会如何待我，这一页书仍压在心上。':'这回没有问到确切的答复，我自己的不安也没有散去。'):own?'我的名字与眼前的日子，总算没有被那一页书盖过去。':probing?'他没有许我拿旧史压人。这份分寸，我已经听明白。':'今日的答复有了具体的人与事，不能再只算一句空泛的论史。';
    livedRecord([c],'bond','读史照见今人',`gouyi-reading:${h.key}`,`【读史照见今人】${cName(c)}读到汉代钩弋夫人的记载，谈及${h.gen===S.gen?'本朝':'先朝'}赵令仪的际遇。${context}${question}${decision}`,[thought]);
    cchg(c,{aff:kind==='avoid'?-5:merciful?6:2,mood:kind==='avoid'?-8:5});
    if(kind==='avoid'){remember(c,'hurt','读到钩弋旧史后，陛下没有回答自己对命运的忧虑');setXin(c,'惶恐','读史时未得到明确答复，担忧宫中女子的命运');}
    if(kind==='tell'){
      const line='【读史传话】赵令仪收到御前传来的明确答复：不会因“主少母壮”而预先罪其母。传话没有带来另一位妃嫔私下的疑问。';
      livedRecord([g],'bond','收到读史答复',`gouyi-reading:${h.key}`,line,['旁人怎样谈论，我未亲闻；这句话确实传到了我这里，且记着，看日后怎样做。']);
      g.gouyi.readingAssurance={turn:S.turn,reader:c.id};cchg(g,{aff:4,mood:5});
    }
    return decision;
  };
  return chronicleEvent({title:'读史 · 钩弋之名',por:c,present:[c],valid,ref:'《汉书·外戚传》及《史记·外戚世家》褚少孙补记；宫中对话原创',
    text:`${cName(c)}翻读史书，读到汉武帝晚年欲立幼子、钩弋夫人先亡的记载。书中另谈到对幼主生母掌权的忧惧。\n${context}\n${question}${earlier}`,
    choices:[
      {t:oldAnswer==='yes'?'“先前那话不妥。朕不会因母少子幼，预先罪人。”':'“立储自有章法，不能拿母亲的性命换安心。”',f:()=>finish('promise')},
      {t:'“旧史可以读，不许用来替令仪断命。”',f:()=>finish('boundary')},
      {t:'“帝王也有难处，此事先不再问。”',f:()=>finish('avoid')},
      ...(canTell()?[{t:'将不以旧史罪人的答复，也传给令仪',f:()=>finish('tell')}]:[])
    ]});
}
const gouyiOldHistory=QEV['好读史'];
QEV['好读史']=function(c){return gouyiReadingActive()&&gouyiCourtHistory()?gouyiReadingEvent(c):gouyiOldHistory(c);};
const gouyiOldNostalgia=QEV['念旧'];
QEV['念旧']=function(c){if(gouyiReadingActive()&&c.gouyi&&S.turn-(c.enteredAt??S.turn)>=2&&gouyiReadingReady(c)&&chance(.35))return gouyiReadingEvent(c);return gouyiOldNostalgia(c);};
A.gouyiReadHistory=function(id){const c=byId(id);if(!modalOpen&&c?.gouyi&&S.turn-(c.enteredAt??S.turn)>=2)pushEv(gouyiReadingEvent(c));};
const gouyiReadingPanel=gouyiInquiryPanel;
gouyiInquiryPanel=function(c){const html=gouyiReadingPanel(c);return html+(c?.gouyi&&S.turn-(c.enteredAt??S.turn)>=2&&gouyiReadingReady(c)?`<button class="btn" data-onclick="A.gouyiReadHistory(${c.id})">陪令仪读到钩弋旧史</button>`:'');};
const gouyiReadingVoice=consortVoicePool;
consortVoicePool=function(c){const pool=gouyiReadingVoice(c);if(!gouyiReadingActive()||!inPalace(c)||maternalVoiceUrgent(c)||['悲恸','心如死灰'].includes(xinOf(c)))return pool;
  const d=c.gouyiReading,assurance=c.gouyi?.readingAssurance;
  if(d&&S.turn-d.turn<=6)pool.push(voiceLine('gouyi-reading-memory','那页读过的旧史，她仍记着。',d.answer==='avoid'?'那日陛下没有答完的话，臣妾后来还想过。若只说帝王有难处，宫中的人该怎样安心呢？':'那日读史时陛下说过的话，臣妾记下了。愿往后真有人遇事时，这句话也还算数。'));
  else if(assurance&&S.turn-assurance.turn<=6)pool.push(voiceLine('gouyi-reading-assurance','她提起收到的那一句御前答复。','传来的话，臣妾听明白了。不会因为旧书写了什么，就先替令仪定罪。臣妾会记着。'));
  return pool;
};
