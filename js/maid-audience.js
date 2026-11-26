/* Deliberate audiences are independent of the ambient encounter lottery. */
function maidAudienceActive(){return !!S&&!S.over&&journalContentVersion()>=30;}
function maidAudienceRoster(){return maids().filter(g=>inPalace(g)&&g.age>=18).sort((a,b)=>Number(b.near)-Number(a.near)||b.favor-a.favor);}
function maidAudiencePanel(){
 if(!maidAudienceActive())return '';
 return `<section class="detail-section"><h3>宫女留侍</h3><p class="hint">可召见当值宫女，也可再见承恩后回去当差的旧识。召见不耗精力，决定留侍时耗精力一。</p><button class="btn jade" data-onclick="A.maidAudience()" ${mourningNightPause()?'disabled':''}>召见宫女</button>${mourningNightPause()?`<p class="hint">${mourningNightMessage()}。</p>`:''}</section>`;
}
function maidAudienceMenu(){
 const list=maidAudienceRoster(),randomOld=journalContentVersion()>=33;
 const oldChoices=randomOld?(list.length?[{t:'召见一位旧识宫女',f:()=>{
  const available=maidAudienceRoster();if(maidAudienceActive()&&available.length)pushNow(maidAudienceMeeting(pick(available)));
  return null;
 }}]:[]):list.map(g=>({t:`${fullName(g)} · ${g.near?'御前当差':'尚衣局旧识'}${consortNightReason(g)?' · '+consortNightReason(g):''}`,f:()=>{if(inPalace(g)&&g.maid)pushNow(maidAudienceMeeting(g));return null;}}));
 return {title:'敬事房 · 宫女留侍',text:randomOld?'可以召见一位当值宫女，也可以让敬事房请一位旧识过来，见面后再决定今夜是否留侍。':'敬事房另呈当值名册。你可以先见一面、听她说话，再决定今夜是否留侍。已有的宫女仍保留原来的经历与姓名。',choices:[
  ...oldChoices,
  {t:'召见一位当值宫女',cond:()=>E().energy>0,why:'本月精力已尽',f:()=>{if(!maidAudienceActive()||E().energy<=0)return null;
   let slot=S.flags.maidAudience;
   if(slot?.gen!==S.gen||slot.turn!==S.turn){slot=S.flags.maidAudience={gen:S.gen,turn:S.turn,person:makeGirl({fam:{t:'宫女',p:3},age:ri(18,24)})};}
   const g=byId(slot.person.id)||slot.person;
   if(S.consorts.includes(g)&&(!g.maid||!inPalace(g))){return '本月名册上的这位已另作安置。若要再见，可从她的人物档案进入；新的当值名册下月呈上。';}
   pushNow(maidAudienceMeeting(g));return null;
  }},
  {t:'今日先不召见'}
 ]};
}
function maidAudienceMeeting(g){
 const fresh=!S.consorts.some(c=>c.id===g.id);let done=false;
 const valid=()=>!done&&maidAudienceActive()&&g.age>=18&&(fresh?!byId(g.id):inPalace(g)&&g.maid);
 const intro=fresh?`${fullName(g)}，${g.age}岁，原在尚衣局当差。敬事房先告知召见之意，她愿意前来，行过礼后等你问话。`:`${fullName(g)}${g.near?'从御前值房过来':'仍在尚衣局当差，听见传召便收好手头的活计'}。${g.nights?'你还认得这位旧识，她也记得从前的相处。':'她行过礼，等你开口。'}`;
 const words=['活泼','爽直','好客'].includes(g.trait)?'当值时也有有趣的小事。陛下若愿听，奴婢想慢慢说。':['沉静','淡泊','持重'].includes(g.trait)?'奴婢话不多，陛下若问起，会认真答。':'忽然被召来，心里还有些紧张。能先说说话，便安心些。';
 return {title:'召见宫女 · '+fullName(g),por:g,valid,text:intro+`\n“${words}”`,choices:[
  {t:'今夜留侍 · 精力−1',cond:()=>valid()&&E().energy>0&&!consortNightReason(g),why:consortNightReason(g)||'精力不足',f:()=>{
   if(!valid()||E().energy<=0||consortNightReason(g))return null;done=true;
   if(fresh){g.maid=true;g.near=false;g.palace='尚衣局';g.favor=20;g.aff=25;S.consorts.push(g);deepen(g);story(g,'原在尚衣局当差，经敬事房召见，自愿留侍。');S.flags.lastMaidEncounter=S.turn;}
   maidNight(g);return null;
  }},
  {t:'先说些家常，今日仍回去当差',f:()=>{if(!valid())return null;done=true;if(!fresh){story(g,'奉召到御前说了些当值的家常，陛下听完，仍让她按原例回去歇息。');cchg(g,{mood:3});}return '你听她慢慢说完。临走时，她比来时自在了一些；今日仍照原来的安排当差。';}},
  {t:'今日先到这里'}
 ]};
}
A.maidAudience=function(){if(mourningNightPause()){toast(mourningNightMessage());return;}if(maidAudienceActive()&&!modalOpen)pushEv(maidAudienceMenu());};

const MAID_FAVOR_DISPUTE_TITLE='承恩之后 · 廊下生波';
const maidFavorDisputeAvailable=p=>inPalace(p)&&!p.outerHouseholdId;
function maidFavorDispute(){
 if(!PalaceActions.maidFavorDisputes||S.over||mourningActive()||S.turn-(S.flags.lastMaidFavorDispute??-Infinity)<12)return null;
 const favored=maids().filter(g=>maidFavorDisputeAvailable(g)&&g.nights>0&&g.favor>=25)
  .map(g=>({g,months:(g.imperialNights||[]).filter(t=>t<S.turn&&S.turn-t<=3).length}))
  .filter(x=>x.months>0).sort((a,b)=>b.g.favor-a.g.favor||b.months-a.months||a.g.id-b.g.id);
 if(!favored.length)return null;
 const rivals=harem().filter(c=>c.rank<8&&maidFavorDisputeAvailable(c)&&
  (TRAITS[c.trait]?.jealous||c.trait==='城府'||c.scheme>=65||xinOf(c)==='嫉恨'||c.trait==='痴情'&&c.aff>=55));
 for(const {g,months} of favored){
  const resentment=c=>g.favor-c.favor-relGet(c,g)+(TRAITS[c.trait]?.jealous?12:0)+(xinOf(c)==='嫉恨'?16:0);
  const rival=rivals.filter(c=>!isSolitary(c)&&(g.favor-c.favor>=8||relGet(c,g)<=-15||xinOf(c)==='嫉恨'))
   .sort((a,b)=>resentment(b)-resentment(a)||a.id-b.id)[0];
  if(!rival)continue;
  const odds=.025+(favored.length>1 ? .025 : 0)+(months>=2||g.favor>=55 ? .02 : 0);
  if(!chance(odds))return null;
  const q=empress();
  return maidFavorDisputeEvent(g,rival,maidFavorDisputeAvailable(q)?q:null,favored.length>1);
 }
 return null;
}

function maidFavorDisputeProud(g){
 if(g.favor<35||g.mood<35||['悲恸','心如死灰','惶恐'].includes(xinOf(g)))return false;
 const odds=['骄纵','骄矜','善妒','城府'].includes(g.trait)? .28 : .035;
 return mulberry32(voiceHash('maid-favor-pride:'+String(g.seed||g.id)))()<odds;
}

function maidFavorQueenResponse(q){
 if(TRAITS[q.trait]?.jealous)return {
  voice:'“臣妾也听见那些话了。一个宫女近来总得召见，宫中怎么会没人议论？她的差事照原样做，擅改差事的人也该领训。”',
  action:'皇后撤回了多加的差事，也敲打宫女以后谨慎行事。那位妃嫔领了训，心里仍不大服气。',
  note:'承认自己介意宫女近来得宠，仍撤了擅加的差事，也当面嘱咐宫女谨慎。',mood:-3
 };
 if(q.trait==='城府')return {
  voice:'“若把人叫到殿前对质，明日人人都知道陛下为谁发了话。臣妾想先把差事恢复原样，再私下问那位娘娘。”',
  action:'皇后让掌事私下恢复原来的差事，又单独召那位妃嫔说话。值房少了议论，宫女也得以安静回去当值。',
  note:'担心公开对质会坐实流言，先恢复差事，再私下向那位妃嫔问明缘由。',mood:3
 };
 if(['温婉','好客','巧手','体弱'].includes(q.trait))return {
  voice:'“她才进门就等着挨骂。先叫她坐一坐，把话从头说完。宫里谁受了委屈，都该有说话的地方。”',
  action:'皇后先让宫女坐下说完经过，再把多派的差事退了回去。临走时还叮嘱掌事，让她照旧休息。',
  note:'先听宫女把话说完，撤回了额外的差事，也吩咐掌事别让她为这场风波误了休息。',mood:7
 };
 return {
  voice:'“差事原是谁派的，几时交的，都查得出来。先问当值的宫人，再谈该不该训人。”',
  action:'皇后问过当值宫人，按原登记恢复了差事，并当面告诫那位妃嫔，不得因听见传言便越过掌事发话。',
  note:'对过当值宫人的说法，照原登记恢复差事，并申明后宫妃嫔不可私改别处的安排。',mood:4
 };
}

function maidFavorDisputeEvent(g,rival,q,multiple){
 const proud=maidFavorDisputeProud(g),queen=q&&maidFavorQueenResponse(q),place=g.near?'御前值房':'尚衣局';
 const subtle=rival.trait==='城府'||!TRAITS[rival.trait]?.jealous&&rival.scheme>=65;
 const incident=subtle?
  `交接簿原已盖过押，${cName(rival)}却说字迹看不清，绕过掌事命${g.given}把去月的旧页从头重抄。`:
  `${cName(rival)}在廊下拦住${g.given}，挑她行礼不周，说：「近来常听御前传你，难道连给本宫行礼都忘了？」说罢又让她替自己宫里清点衣料。`;
 const reaction=proud?
  `${g.given}低头应了，等那位娘娘走远，才对熟识的宫人抿嘴一笑：「若真瞧不上我，何苦连哪日传过我都记得这样清楚？」`:
  `${g.given}问掌事自己原先究竟错在何处，问到一半便红了眼：“奴婢只照原来的差事做，怎么见过陛下几回，转眼就什么都做错了？”`;
 let done=false;
 const valid=()=>!done&&!S.over&&g.maid&&maidFavorDisputeAvailable(g)&&!rival.maid&&rival.rank<8&&
  maidFavorDisputeAvailable(rival)&&(!q||empress()===q&&maidFavorDisputeAvailable(q));
 const choice=(label,mode,body,mood)=>({t:label,f:()=>{
  if(!valid())return null;
  done=true;
  const resolved=mode!=='dismiss';
  const feeling=proud?'听见有人嫉妒她近来承恩，心里反倒有几分得意':resolved&&mood>0?'因承恩被人挑错，话说开后总算松了口气':'因承恩被人借差事挑错，觉得受了委屈';
  setXin(g,proud?'欢喜':resolved&&mood>0?'释然':'委屈',feeling,rival.id,{record:false});
  relAdd(rival,g,resolved?-8:-13);
  if(mode==='palace')cchg(rival,{mood:-5});
  story(g,`【${MAID_FAVOR_DISPUTE_TITLE}】在${place}因近来受召，被${fullName(rival)}加派了差事。${feeling}。${body}`);
  const resentment=rival.trait==='痴情'?'见御前近日召了别人，越发觉得自己被冷落，拿宫女的差事出了气。':
   subtle?'听见关于御前传召的闲话，把妒意藏在差事和账簿后头。':'听说御前近来传召宫女，心下不平，便在众人面前发落了她。';
  story(rival,`【${MAID_FAVOR_DISPUTE_TITLE}】${resentment}${body}`);
  if(q)story(q,`【${MAID_FAVOR_DISPUTE_TITLE}】听说${fullName(rival)}为难宫女${fullName(g)}，她道：${queen.voice}${mode==='queen'?queen.note:body}`);
  return body+fx(cchg(g,{mood,aff:mode==='palace'?4:0}));
 }});
 const rumor=multiple?'近来不止一位宫女奉过召，值房里有人把几个人的名字私下数了一遍。':'近来她奉过御前传召，消息在几处值房传开了。';
 return chronicleEvent({title:MAID_FAVOR_DISPUTE_TITLE,por:g,cast:[rival,q],present:[g,rival,...(q?[q]:[])],valid,
  onQueue:()=>{S.flags.lastMaidFavorDispute=S.turn;},
  text:[`${place}的宫女${fullName(g)}原是照例领差。`,rumor,incident,reaction,q?`皇后听见掌事来禀，回了一句：${queen.voice}`:''].filter(Boolean).join('\n'),
  choices:[
   choice('亲自问清经过，命妃嫔撤回加派的差事','palace','你问过当值的宫人，命那位妃嫔撤回加派的差事。往后谁要借用别处的人手，须先问掌事。',proud?6:9),
   ...(q?[choice('交由皇后料理','queen',queen.action,queen.mood)]:[]),
   choice('让她回去当差，此事暂不追问','dismiss','你只叫掌事带她回去当值。那位妃嫔听说没有追问，过了几日仍把此事当作闲话说起。',proud?1:-7)
  ]});
}
