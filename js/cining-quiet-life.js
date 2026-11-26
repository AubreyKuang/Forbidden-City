/* A real meeting creates a short-lived rumour. Quiet is restored even without player intervention. */
const dowagerRumorActive=d=>!!(d?.alive&&d.household?.rumor&&S.turn>d.household.rumor.turn&&S.turn<=d.household.rumor.until&&!d.household.rumor.closed);
function startDowagerRumor(d,people){
 const h=dowagerLiving(d);if(!d.alive||!people.length||mourningActive()||S.turn<(h.quietUntil??0)||S.turn-(h.rumor?.turn??-99)<12)return;
 const names=people.map(fullName).join('、');h.rumor={turn:S.turn,until:S.turn+3,people:people.map(c=>c.id),visits:0};
 const line=`${names}在慈宁宫请安，恰逢皇帝来访。宫人传起“慈宁宫也能遇上圣驾”的话，请安的帖子渐多。`;
 log('【宫中流言】'+line);dowagerRecord(d,'茶席余声',line);
 for(const c of people)story(c,`【偶遇之后】在慈宁宫遇见陛下，后来听说这场相逢成了宫中的谈资。`);
}
function dowagerCrowdTick(d){
 const h=dowagerLiving(d),r=h.rumor;if(!r||r.closed||S.turn<=r.turn)return;
 if(r.visits>=3||S.turn>=r.until){r.closed=S.turn;h.quietUntil=S.turn+3;
  dowagerRecord(d,'谢客清修','慈宁宫接连收到请安的帖子。太后让掌事姑姑传话：问安存心便好，近来须静养清修，不必日日相扰。');
  log('慈宁宫传话：太后近来清修，非有要事，不必争相请安。');
 }
}
function dowagerCrowdEvent(d){
 const h=dowagerLiving(d),r=h.rumor;if(!r||r.joked||S.turn<=r.turn||S.turn-r.turn>6||!r.visits&&!r.closed)return null;
 let done=false;const valid=()=>!done&&d.alive&&!r.joked;
 const finish=playful=>{if(!valid())return null;done=true;r.joked=S.turn;r.closed||=S.turn;h.quietUntil=Math.max(h.quietUntil||0,S.turn+3);
  const text=playful?'皇帝笑着认下“都是儿臣的过”，答应先递话再来，也不让众人借请安久候。':'皇帝答应替母后留一段清静，命宫人照例传问安，不必争相到殿前等候。';
  dowagerRecord(d,'母子笑谈',text);d.mood=clamp(d.mood+4);return text;};
 return trackDowagerTalk(d,{title:'慈宁宫 · 都是你惹的热闹',por:dowagerPerson(d),present:[],valid,
  text:`太后指着案上的请安帖子，忍不住笑：“自打你上回在这里遇见${r.people.map(byId).filter(Boolean).map(fullName).join('、')||'请安的人'}，哀家这清静地方，倒比御花园还热闹。一个个都说惦记哀家，眼睛却不时往门口看。”\n“都是你来，把这里闹热了。她们想偶遇皇帝，倒让哀家连一卷经也读不完。你且还哀家几日清修。”`,
  choices:[{t:'笑着认错，替母后挡几日热闹',f:()=>finish(true)},{t:'嘱咐众人少来打扰，问安不必争先',f:()=>finish(false)}]},'cining-rumor:'+r.turn,{months:12});
}

const DOWAGER_DAO_TOPICS={
 lifespan:{title:'问寿',question:'人说寿数自有定数。哀家还想看晚辈们长大，国师可看得出，余下还有多少时日？',answer:'若以一句吉凶断人余生，反使今日不得安宁。调养有医，起居有常；贫道愿陪您谈牵挂，不敢替天地写死期。'},
 cycles:{title:'盈虚有数',question:'月有盈虚，人有盛衰。若这一切都有数，欢喜与忧愁，究竟还能握住些什么？',answer:'月圆时不必怕它将缺，月缺时也未必再无清光。人能尽的，是眼前这一分照料；留不住的，容它慢慢过去。'},
 rebirth:{title:'来世与旧人',question:'若人还有来世，还会记得今生的家人么？换过姓名与模样，是否仍能认出来？',answer:'世间有魂梦借影之说，也有人只在旧物中遇见故人。若有再来，仍该珍重那一世的姓名；若不能相认，今生给过的温暖也未白费。'}
};
function dowagerDaoTick(d){
 const h=dowagerLiving(d);if(mourningActive()||h.daoVisit&&!h.daoVisit.answered&&S.turn-h.daoVisit.turn<=6||S.turn-(h.daoVisit?.turn??0)<12||h.company?.people.length||!chance(.08))return;
 const choices=Object.keys(DOWAGER_DAO_TOPICS).filter(k=>k!==h.daoVisit?.topic),topic=d.feeling?.kind==='悲恸'?'rebirth':pick(choices),master=daoMaster();
 h.daoVisit={turn:S.turn,topic,master:{...master},answered:false};
 const text=`到宫内钦安殿向${master.name}国师${DOWAGER_DAO_TOPICS[topic].title}。${d.feeling?.person&&byId(d.feeling.person)?'提起已故晚辈'+fullName(byId(d.feeling.person))+'，仍有未尽的思念。':'问起余生与牵挂，听过答话，仍在松下坐了片刻。'}`;
 dowagerRecord(d,'松下问道',text);(S.daoCourtChronicle||=[]).push({d:dateStr(),t:d.name+text});
}
function dowagerDaoEvent(d=ensureDowager()){
 const q=d?.household?.daoVisit;if(!d?.alive||!q||q.answered||S.turn-q.turn>6)return null;
 const topic=DOWAGER_DAO_TOPICS[q.topic],master=q.master,late=d.feeling?.person&&byId(d.feeling.person);
 let done=false;const valid=()=>!done&&d.alive&&d.household.daoVisit===q&&!q.answered;
 const finish=kind=>{if(!valid()||kind==='rite'&&(E().treasury<20||S.turn-(S.flags.daoRite??-99)<12))return null;done=true;q.answered=true;q.answeredAt=S.turn;
  let text=kind==='home'?'皇帝陪太后回宫，约好一道用膳，把未说尽的话留待日常。':'皇帝陪太后听完国师答话，未催她放下心事。';
  if(kind==='rite'){S.flags.daoRite=S.turn;chg({treasury:-20,people:1});text='依钦安殿旧例，为故人与在世亲人点灯祈安，并记施济名册。';for(const p of daoVisitors()){recordDaoVisit(p);daoRemember(p,'太后与皇帝同在钦安殿寄愿，灯烛与施济一并办妥。');}}
  q.response=text;d.mood=clamp(d.mood+5);dowagerRecord(d,topic.title,text+' 国师说：“'+topic.answer+'”');(S.daoCourtChronicle||=[]).push({d:dateStr(),t:master.name+'国师答太后：'+topic.answer});return text;};
 return trackDowagerTalk(d,{title:'钦安殿 · 太后'+topic.title,cast:[dowagerPerson(d),master],present:[],valid,
  text:`${S.turn===q.turn?'你来到钦安殿，见太后在松影下与国师说话。':'太后提起日前在钦安殿问道的事，命人请来国师续谈。'}\n${late?'她提起'+fullName(late)+'，指尖停在一页旧经上。\n':''}太后问：“${topic.question}”\n${master.name}国师答：“${topic.answer}”`,choices:[
   {t:'陪母后听完，容她慢慢说',f:()=>finish('listen')},
   {t:'依旧例点灯祈安、施济 · 国库−20',cond:()=>E().treasury>=20&&S.turn-(S.flags.daoRite??-99)>=12,why:'祈愿每年一次，需国库20',f:()=>finish('rite')},
   {t:'陪母后回宫，约好一道用膳',f:()=>finish('home')}
  ]},'dowager-dao:'+q.turn,{months:12});
}
A.dowagerDao=function(){if(modalOpen||!dowagerLivingActive())return;const ev=dowagerDaoEvent();if(ev&&useE())pushEv(ev);};
const ciningDaoHall=viewDaoHall;
viewDaoHall=function(){const html=ciningDaoHall();if(!dowagerLivingActive())return html;const d=ensureDowager(),q=d?.household?.daoVisit;
 return html+(d?.alive&&q&&!q.answered&&S.turn-q.turn<=6?detailSection('太后的心事',`<p>${q.turn===S.turn?'太后正向国师问起':'太后近日曾向国师问起'}${DOWAGER_DAO_TOPICS[q.topic].title}。</p><button class="btn jade" data-onclick="A.dowagerDao()">陪她听一听 · 精力−1</button>`):'')+((S.daoCourtChronicle||[]).length?detailSection('松下留笺',`<ul class="story">${S.daoCourtChronicle.slice(-4).reverse().map(s=>`<li><time>${esc(s.d)}</time>${esc(s.t)}</li>`).join('')}</ul>`):'');};
