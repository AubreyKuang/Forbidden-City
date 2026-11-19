/* The seed fixes what she heard long before selection. Previously recorded admirers keep their history. */
const whiteSpringAdmirationActive=()=>journalContentVersion()>=110;
function admiresWhiteSpring(c){
  if(journalContentVersion()<104||!c||c.maid||c.sex||c.fixedStory==='ayimu'||(c.upbringing?.title||c.fam?.t)!=='皇商')return false;
  return !whiteSpringAdmirationActive()||!!c.whiteSpringFriend||voiceHash((c.seed??c.id)+':white-spring-admirer')%100<80;
}
const WHITE_SPRING_MEMORIES=[
  {
    glimpse:'她跟随娘家人核算货单时，常向跑白泉的老掌柜问一句公主近来如何。',
    words:'那年商队过白泉，臣妾家老掌柜正逢城中设宴。他说阿依慕公主起舞时，先听到鼓，才听到她腕上的银铃。旁人只顾着问带回多少匹布，臣妾缠着他把那一段讲了三遍。',
    record:'入宫前常等娘家商队回来。第一次听老掌柜讲阿依慕踏鼓，追问了三遍鼓点与腕铃的先后。此后凡有白泉来的货，便也向经手人问问公主的消息。',
    joy:'听说获准入宫，她回过神来，才发现自己已笑出了声。回去收拾行李时，连压在匣底那枚旧商铃也翻了出来。'
  },
  {
    glimpse:'她随身带着一片旧白泉织样，记得送织样的人曾讲过阿依慕在雪后的事。',
    words:'家中做冬衣买卖。白泉来的客人带过一块织样，说阿依慕公主见商队里有人手冻得握不住缰绳，先请人喝了热汤，再叫织工教他们怎样让布面挡风。臣妾那时便想，有一天要当面问她是怎么认出那匹料的。',
    record:'尚在娘家时，从带来冬衣织样的白泉客人口中听说，阿依慕曾请商旅喝热汤，又让织工教他们辨认挡风的布面。从那以后，她一直仔细收着那片织样。',
    joy:'谢过恩，她把那片织样捧给贴身丫头看，眼里全是笑意。叮嘱了两遍，入宫的箱笼里要让它放在最上头。'
  },
  {
    glimpse:'她从前替家里抄过白泉商旅的来信，信里提过阿依慕怎样学官话。',
    words:'臣妾替父亲抄过一封白泉来的信。写信的译者说，阿依慕把商旅问路的话抄在小笺上，讲错了便请人明说，再从头念一遍。臣妾往后每抄到白泉的落款，就想她如今又会说哪些话了。',
    record:'在家替父亲抄录往来书信，听译者说起阿依慕怎样学官话。她常把白泉的信留到最后誊清，只盼从里头再读到一点公主的消息。',
    joy:'听到留下的旨意，她应得又脆又快。回去给家里写信，刚落下「已蒙准入宫」几字，便向丫头借了纸，将满页写歪的字重抄一遍。'
  }
];
function whiteSpringMemory(c){
  return WHITE_SPRING_MEMORIES[voiceHash((c.seed??c.id)+':white-spring-memory')%WHITE_SPRING_MEMORIES.length];
}
function whiteSpringSelectionHint(c){
  return whiteSpringAdmirationActive()&&admiresWhiteSpring(c)?whiteSpringMemory(c).glimpse:'';
}
function whiteSpringMemoryRecorded(c){
  return c.story.some(e=>e.t?.startsWith('【仰慕阿依慕】'));
}
function whiteSpringSelectionButton(c){
  if(!whiteSpringSelectionHint(c)||whiteSpringMemoryRecorded(c))return '';
  return '<button class="btn" onclick="A.whiteSpringAudience('+c.id+')">听她讲白泉旧闻</button>';
}
A.whiteSpringAudience=function(id){
  if(modalOpen||!S||S.over||!whiteSpringAdmirationActive())return;
  const c=S.cands.find(p=>p.id===id);
  const valid=()=>!S.over&&S.cands.includes(c)&&admiresWhiteSpring(c)&&!whiteSpringMemoryRecorded(c);
  if(!valid())return;
  const memory=whiteSpringMemory(c);
  pushEv({title:'储秀宫 · 白泉旧闻',por:c,valid,
    text:memory.glimpse+'\n“'+memory.words.replaceAll('臣妾','臣女')+'”',
    choices:[{t:'记下她在娘家听过的事',f:()=>{story(c,'【仰慕阿依慕】'+memory.record);}}]});
};
function whiteSpringResident(people){
  return people.find(c=>c.fixedStory==='ayimu'&&inPalace(c));
}
function whiteSpringFaction(people){
  if(!whiteSpringAdmirationActive())return null;
  const princess=whiteSpringResident(people),followers=princess?people.filter(admiresWhiteSpring):[];
  return followers.length?{princess,followers}:null;
}
function whiteSpringFriends(a,b){
  return journalContentVersion()>=104&&((a?.fixedStory==='ayimu'&&b?.whiteSpringFriend?.princess===a.id)||
    (b?.fixedStory==='ayimu'&&a?.whiteSpringFriend?.princess===b.id));
}
function whiteSpringCanMeet(c){
  return inPalace(c)&&!c.maid&&c.hp!==0&&!(dowagerIll(S.flags.dowager)&&S.flags.dowager.lastYears.caregiver===c.id);
}
function ensureWhiteSpringMemory(c){
  if(c.whiteSpringFriend)return c.whiteSpringFriend;
  const tie=c.whiteSpringFriend={};
  if(whiteSpringAdmirationActive()){
    if(!whiteSpringMemoryRecorded(c))story(c,'【仰慕阿依慕】'+whiteSpringMemory(c).record);
    return tie;
  }
  const memory=(c.seed%2===0)?'娘家商队回来，别人问一路的价钱，她却爱听白泉的故事。掌柜说公主会踏鼓，她一直想问，舞步和腕铃怎么合上同一拍。':'她在娘家的货签上见过“白泉舞铃”四字。老伙计说，得听阿依慕亲手摇一遍，才知道铃也有轻重。她把这句话记了许多年。';
  story(c,'【仰慕阿依慕】'+memory);
  return tie;
}
function whiteSpringAdmission(c){
  if(!whiteSpringAdmirationActive()||!admiresWhiteSpring(c)||!inPalace(c))return;
  const heard=whiteSpringMemoryRecorded(c),tie=ensureWhiteSpringMemory(c);
  if(tie.admission!=null)return;
  tie.admission=S.turn;
  const memory=whiteSpringMemory(c),inCourt=!!whiteSpringResident(S.consorts);
  const hopes=inCourt?'听说阿依慕也住在宫中，她当即打听哪日可以登门请安。':'她问了白泉的消息，想若有一日阿依慕也来宫中，自己便能依礼见上一面。';
  const joy=memory.joy+hopes;
  story(c,'【留宫之喜】'+joy);
  cchg(c,{mood:25});setXin(c,'欢喜','得以留宫，盼有一日与阿依慕亲自相识',null,{record:false});
  // A follow-up scene needs the recorded admission action to survive a reload.
  if(!PalaceActions.busy)return;
  const words=heard?'臣妾原以为那些事只能听旁人讲。如今终于有机会，想问问公主自己是怎么记得的。':memory.words;
  pushEv({title:'初入宫 · 她惦记的白泉旧闻',por:c,present:[c],
    valid:()=>byId(c.id)===c&&!S.over,text:joy+'\n见你肯听，她说：“'+words+'”',choices:[{t:'听她说完'}]});
}
function whiteSpringRecord(people,title,line,source,voices,oldVoices=voices){
  const prefix='【'+title+'】',modern=whiteSpringAdmirationActive();
  lifeRecord(people,'bond',title,prefix+line,source,modern?voices:oldVoices);
  if(!modern)return;
  for(const [i,p] of people.entries()){
    const record=p.story.at(-1);
    record.t=prefix+(voices[i]?.text||voices[i]);
    record.life.summary=line;
  }
}
function whiteSpringPledge(c,princess,tie){
  if(!princess||!inPalace(c)||tie.allegiance===princess.id)return;
  tie.allegiance=princess.id;
  const name=fullName(c);
  whiteSpringRecord([c,princess],'愿追随阿依慕',name+'主动递帖求见阿依慕，愿在宫中与她同进退。她托宫人先问过方便的时辰，等公主得闲，再带一份白泉货簿的抄件登门。','入宫前听过的白泉旧闻',[
    '先请人递帖，求问阿依慕何时得闲。家里带来的白泉货簿一直舍不得散出，今番另抄一份，预备亲手交给她。愿入她的一派，往后逢宫中议事，也肯站在她这边。',
    name+'递了帖子来，说愿与自己同进退。帖末还写着一行工整的白泉旧货号，便想等方便见面时，先问她是从哪里学来的。'
  ]);
}
function meetWhiteSpringMerchants(){
  if(journalContentVersion()<104||!S||S.over||PalaceActions.blocked)return;
  const modern=whiteSpringAdmirationActive(),resident=modern?whiteSpringResident(S.consorts):null;
  const princess=modern?(whiteSpringCanMeet(resident)?resident:null):S.consorts.find(c=>c.fixedStory==='ayimu'&&whiteSpringCanMeet(c));
  for(const c of S.consorts){
    if(!c.alive||c.gone||c.familyArchive||!admiresWhiteSpring(c))continue;
    const tie=ensureWhiteSpringMemory(c);
    if(modern)whiteSpringPledge(c,resident,tie);
    if(!princess||tie.princess!=null||!whiteSpringCanMeet(c))continue;
    const old=friendshipArc(c,princess),strained=friendshipTense(c,princess);
    tie.princess=princess.id;tie.met=S.turn;
    relAdd(c,princess,Math.max(0,55-relGet(c,princess)));
    if(strained){old.stage='renewed';delete old.pending;}
    const arc=old||friendshipTrack(c,princess);
    if(arc&&!old)arc.anchor='阿依慕曾解下腕铃，教她听白泉舞步的轻重拍';
    const name=fullName(c);
    const lead=modern?`${name}循着递帖约定的时辰登门，把抄好的白泉货簿递给公主，随后`:name;
    const line=strained?`${lead}带着一枚旧商铃向阿依慕赔了不是。两人把从前的芥蒂说开，阿依慕握着她的手教她摇响腕铃，又约她明日过来。`:
      `${lead}向阿依慕问起白泉的舞铃。公主解下一串系在她腕上，让她先轻轻转腕，再随鼓点落手。她终于听出了商队说的两种铃声。临走时，阿依慕约她下回带家里的铃来，两人好作个比较。`;
    whiteSpringRecord([c,princess],'白泉铃声',line,'皇商家中的白泉见闻',[
      {text:'从前隔着柜台听人讲，今日是她亲手教我的。',emotion:.5},
      {text:'她真肯坐下来听轻重拍，我愿把家乡的曲子再教她一段。',emotion:.5}
    ]);
  }
}
const WHITE_SPRING_VISITS={
  cloth:{title:'同辨白泉织样',text:'摊开娘家带来的两块织样。阿依慕翻过布角，认出是白泉冬衣的织法。两人拿指尖摸过经纬，把旧货签上的“舞衣”改成了“挡风用”。',
    thoughts:['过去只会照货签认料。摸过这一回才知道，密的那一面是要朝风的。','手指才摸到布背的结，便想起母亲给我缝冬衣时，也是把那一面翻在外头。']},
  bells:{title:'合一回舞铃',text:'依约带来一枚旧商铃。阿依慕说，商铃是让队尾听见前路，舞铃却要等鼓。两人各执一铃试了几回，终于让最后一响落在同一拍上。',
    thoughts:['在家时怕铃摇轻了，队尾听不见。今日倒得把手收住，等那一记鼓下来。','她的商铃比我的沉。末了一遍，两声竟一齐落下，连廊下的乐工也回过了头。']}
};
/* A parcel is a real object in this pair's saved story, not a recurring
   assumption that every merchant household has a living sender. */
const WHITE_SPRING_FAMILY_GIFTS={
  scarf:{name:'白泉织纹暖巾',origin:'白泉织坊',description:'一条织着细密斜纹的暖巾',response:'阿依慕翻过织边，认出熟悉的收线手法。她讲起家乡冬天怎样把布角掖好，又问这条暖巾是谁亲手挑的。',merchant:'她认出织法时，我才知道家人捎来的不只是一件御寒的东西。',princess:'她没有替我说那是乡愁，只等我自己指着织边讲起从前的冬天。'},
  bird:{name:'西域候风小鸟',origin:'西域商路',description:'一只轻轻转动尾翼的小木鸟',response:'阿依慕先试着托稳木鸟，再请她轻轻吹一口气。尾翼颤动起来，两人又将它挪到窗边试风。她笑着说，这让她想起商队在风里等天晴。',merchant:'家里原说这是路上给孩子解闷的玩意，没想到她会认真试风，还说起等天晴的日子。',princess:'她把木鸟转给我看，我们一同在窗边试风。那一刻想起商路，却没有人催我把往事说完。'},
  glass:{name:'西域琉璃花片',origin:'西域商路',description:'一枚可以透光的琉璃花片',response:'阿依慕把花片举到窗前，看日光从蓝绿之间透过去。她说颜色像路过白泉时见过的水，却也问起送来的人怎样认出了这块料。',merchant:'我只看出它透亮，她却看见了水色。她还问我家里怎样挑货，我便从头讲给她听。',princess:'那片琉璃让我想起白泉的水。她愿听我说，也讲起了自己家中挑货的讲究。'}
};
function whiteSpringFamilySenders(c){
  const h=houseOf(c);if(!h)return [];
  return ['father',...brotherRoles(h)].map(role=>({role,p:h[role],h})).filter(({p})=>officialAlive(p)&&!p.exiled&&!p.dismissed&&!p.away&&!p.commission&&!p.diplomaticJourney);
}
function whiteSpringFamilyGiftPause(c,p){
  if(mourningActive())return '宫中正在守丧，等这一段日子过去再约。';
  if([c,p].some(person=>['悲恸','心如死灰'].includes(xinOf(person))))return '她们正有沉重心事，等情绪安稳些再约。';
  return '';
}
function whiteSpringFamilyParcelTick(){
  if(journalContentVersion()<115||!S||S.over)return;
  for(const c of S.consorts){
    const tie=c.whiteSpringFriend,p=byId(tie?.princess);
    if(!admiresWhiteSpring(c)||!p||!whiteSpringFriends(c,p)||!whiteSpringCanMeet(c)||!whiteSpringCanMeet(p)||whiteSpringFamilyGiftPause(c,p)||friendshipTense(c,p)||relGet(c,p)<30||
      tie.familyParcel||S.turn-(tie.met??S.turn)<3||S.turn-(tie.lastFamilyParcel??-99)<18)continue;
    const used=tie.familyGiftHistory||[],available=Object.keys(WHITE_SPRING_FAMILY_GIFTS).filter(key=>!used.includes(key));
    if(!available.length)continue;
    const senders=whiteSpringFamilySenders(c);if(!senders.length||!chance(.08))continue;
    const sender=pick(senders),key=pick(available),gift=WHITE_SPRING_FAMILY_GIFTS[key],label=officialKinLabel(sender.h,sender.role,c);
    const parcel=tie.familyParcel={key,senderId:sender.p.id,sender:sender.p.name,relation:label,turn:S.turn};
    (sender.p.story||=[]).push({d:dateStr(),t:`【给宫中${sender.role==='father'?'女儿':'姐妹'}的家礼】家中商队从${gift.origin}带回${gift.description}，托人随家书送给${fullName(c)}。`});
    story(c,`【娘家捎来的新奇物件】${label}${sender.p.name}随家书送来${gift.description}，说是从${gift.origin}带回。她收好包裹，想起阿依慕与家乡的故事。`);
    log(`${fullName(c)}收到${label}${sender.p.name}随家书送来的${gift.name}。`);
    pushEv({title:'娘家来物 · '+gift.name,por:c,valid:()=>inPalace(c)&&!S.over&&tie.familyParcel===parcel,
      text:`${fullName(c)}的${label}${sender.p.name}随家书捎来${gift.description}，是从${gift.origin}带回的。她小心打开包裹，想起阿依慕说过的家乡，想等两人方便时把它拿给她看。`,choices:[{t:'记下这份家礼'}]});
  }
}
function whiteSpringFamilyGiftReady(c,p,tie){
  return journalContentVersion()>=115&&!!tie?.familyParcel&&!!p&&!S.over&&whiteSpringFriends(c,p)&&whiteSpringCanMeet(c)&&whiteSpringCanMeet(p)&&
    tie.last!==S.turn&&!whiteSpringFamilyGiftPause(c,p)&&!friendshipTense(c,p)&&relGet(c,p)>=30&&!!WHITE_SPRING_FAMILY_GIFTS[tie.familyParcel.key];
}
A.whiteSpringFamilyGift=function(id){
  const c=byId(id),tie=c?.whiteSpringFriend,p=byId(tie?.princess),parcel=tie?.familyParcel;
  if(modalOpen||!whiteSpringFamilyGiftReady(c,p,tie))return;
  const gift=WHITE_SPRING_FAMILY_GIFTS[parcel.key],valid=()=>tie.familyParcel===parcel&&whiteSpringFamilyGiftReady(c,p,tie);
  const name=fullName(c),source=`${parcel.relation}${parcel.sender}此前随家书送来的${gift.name}`;
  pushEv({title:'白泉旧缘 · '+gift.name,cast:[c,p],present:[c,p],valid,
    text:`${name}将${source}仔细包好，想亲手送给阿依慕。她想先遣人问好时辰，等两人都方便时再亲自带过去。`,
    choices:[{t:'让她亲手送给阿依慕',f:()=>{
      if(!valid())return null;
      delete tie.familyParcel;(tie.familyGiftHistory||=[]).push(parcel.key);(tie.familyGiftsGiven||=[]).push({...parcel,given:S.turn});tie.lastFamilyParcel=S.turn;tie.last=S.turn;
      relAdd(c,p,5);cchg(c,{mood:3});cchg(p,{mood:3});
      const line=`${name}将${source}赠给阿依慕。${gift.response}`;
      whiteSpringRecord([c,p],'白泉故乡礼',line,source,[gift.merchant,gift.princess]);
      return `${name}亲手将${gift.name}交给阿依慕。${gift.response}`;
    }},{t:'先将礼物收好'}]});
};
function whiteSpringFriendPanel(person){
  if(journalContentVersion()<104||!inPalace(person))return '';
  const isPrincess=person.fixedStory==='ayimu';
  const girls=isPrincess?S.consorts.filter(c=>whiteSpringFriends(person,c)&&whiteSpringCanMeet(c)):[person];
  const rows=[];
  if(whiteSpringAdmirationActive()&&!isPrincess&&admiresWhiteSpring(person)){
    const ally=whiteSpringResident(harem());
    if(ally)rows.push('<p>身在<button class="person-link" onclick="A.go(\'consort\','+ally.id+')">'+esc(fullName(ally))+'</button>一派，愿与她同进退。</p>');
    else if(!person.whiteSpringFriend?.princess)rows.push('<p class="hint">在娘家便听过白泉公主的旧闻，盼有朝一日当面请安。</p>');
  }
  for(const c of girls){
    const tie=c.whiteSpringFriend,p=byId(tie?.princess);
    if(!p||!whiteSpringFriends(c,p)||!whiteSpringCanMeet(c)||!whiteSpringCanMeet(p))continue;
    const companion=isPrincess?c:p;
    if(journalContentVersion()>=115&&tie.familyParcel){
      const parcel=tie.familyParcel,gift=WHITE_SPRING_FAMILY_GIFTS[parcel.key];
      if(gift){
        const reason=whiteSpringFamilyGiftPause(c,p)||(tie.last===S.turn?'这月已经相聚，下月可再约。':friendshipTense(c,p)||relGet(c,p)<30?'两人近来疏远，待交情转好再约。':'');
        rows.push(`<p>${esc(fullName(c))}收到${esc(parcel.relation+parcel.sender)}此前送来的${esc(gift.name)}，想与阿依慕分享。</p><button class="btn jade sm" onclick="A.whiteSpringFamilyGift(${c.id})" ${whiteSpringFamilyGiftReady(c,p,tie)?'':'disabled'}>带着${esc(gift.name)}去见阿依慕</button>${reason?`<p class="hint">${esc(reason)}</p>`:''}`);
      }
    }
    if(journalContentVersion()>=115&&tie.familyGiftsGiven?.length){
      const given=tie.familyGiftsGiven.map(item=>WHITE_SPRING_FAMILY_GIFTS[item.key]?.name).filter(Boolean);
      if(given.length)rows.push(`<p class="hint">曾亲手送给阿依慕：${given.map(esc).join('、')}。</p>`);
    }
    const actions=Object.entries(WHITE_SPRING_VISITS).filter(([key])=>!tie[key]).map(([key,v])=>
      `<button class="btn jade sm" onclick="A.whiteSpringVisit(${c.id},'${key}')" ${S.over||tie.last===S.turn||friendshipTense(c,p)||relGet(c,p)<30?'disabled':''}>${v.title}</button>`).join('');
    rows.push(`<p>与<button class="person-link" onclick="A.go('consort',${companion.id})">${esc(fullName(companion))}</button>有白泉铃声这段旧缘。</p>`+
      (actions?`<div class="acts">${actions}</div>${tie.last===S.turn?'<p class="hint">这月已经相聚，下月可再约。</p>':friendshipTense(c,p)||relGet(c,p)<30?'<p class="hint">两人近来疏远，待交情转好再约。</p>':''}`:''));
  }
  return rows.length?detailSection('白泉旧缘',rows.join('')):'';
}
A.whiteSpringVisit=function(id,key){
  const c=byId(id),tie=c?.whiteSpringFriend,p=byId(tie?.princess);
  if(!p||!whiteSpringFriends(c,p)||!Object.hasOwn(WHITE_SPRING_VISITS,key)||modalOpen||S.over)return;
  const ready=()=>whiteSpringCanMeet(c)&&whiteSpringCanMeet(p)&&!tie[key]&&tie.last!==S.turn&&!friendshipTense(c,p)&&relGet(c,p)>=30;
  if(!ready())return;
  const visit=WHITE_SPRING_VISITS[key],line=fullName(c)+visit.text;
  pushEv({title:visit.title,cast:[c,p],present:[c,p],text:line,valid:ready,choices:[{t:'记下这次相聚',f:()=>{
    if(!ready())return;
    tie[key]=true;tie.last=S.turn;relAdd(c,p,5);cchg(c,{mood:3});cchg(p,{mood:3});
    whiteSpringRecord([c,p],visit.title,line,'白泉铃声',visit.thoughts,[]);
  }}]});
};
