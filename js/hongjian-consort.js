/* Hongjian keeps one identity when her city story becomes a palace story. */
const HONGJIAN_VERSION=28;
const hongjianContent=()=>!!S&&journalContentVersion()>=HONGJIAN_VERSION;
const hongjianActive=()=>hongjianContent()&&!S.over;
const hongjianAdmitted=c=>!!c?.hongjian;
const hongjianCurrent=c=>hongjianActive()&&hongjianAdmitted(c)&&S.consorts.includes(c)&&c.hongjian.gen===S.gen;
const hongjianAvailable=c=>hongjianCurrent(c)&&inPalace(c)&&!maternalVoiceUrgent(c)&&!mourningActive();
function hongjianCanInvite(p){return hongjianActive()&&!livingStoryConsort('hongjian')&&!!p&&!p.hongjian&&fenghuaPresent(p)&&!mourningActive()&&p.age>=18&&E().age>=18&&S.turn-(p.fenghua.lastInvitation??-99)>=3;}
function hongjianAdmissionRank(){return rankCount(3)<RANK_CAP[3]?3:rankCount(2)<RANK_CAP[2]?2:null;}
Object.defineProperty(WOUNDS,'hongjian',{value:'她曾看见自己的诗被署成别人的名字，也曾因一纸宫中订单险些失去小铺。相识之后，陛下肯核对她的原稿、听她算清工钱，才慢慢有了入宫的心意。'});
function admitHongjian(p){
 if(!hongjianActive()||livingStoryConsort('hongjian')||!p||p.hongjian||p.fenghua.stage<3||!fenghuaPresent(p)||p.age<18||E().age<18)return null;
 const rank=hongjianAdmissionRank();if(rank===null)return null;
 const oldId=p.id,history=p.story,identity={sur:p.sur,given:p.given,name:p.name,age:p.age,seed:p.seed,fenghua:p.fenghua,fenghuaKey:p.fenghuaKey,temperament:p.temperament};
 const c=makeGirl({sur:p.sur,given:p.given,age:p.age,trait:'聪慧',fam:{t:'花笺商户',p:18}});
 Object.assign(p,c,identity,{story:history,portraitOverride:438,artPortrait:438,looks:91,talent:88,virtue:73,scheme:48,hp:85,aff:65,favor:40,mood:80,
  t2:'念旧',hobby:'读书',like:'诗书',hate:'兵器',wish:'poem',wound:'hongjian',travelerChecked:true,willing:true,mem:p.mem||[],wishKnown:false,wishDone:false,woundKnown:false,kl:false,
  hongjian:{gen:S.gen,admitted:S.turn,previousId:oldId,receipts:[],lastDaily:-99,accounts:'separate',shop:'阿绫掌柜'},arc:makeArc('hongjian',2)});
 delete p.solitary;delete p.timeTraveler;delete p.registrySource;
 const state=fenghuaState();state.people=state.people.filter(x=>x!==p);(state.admitted ||= {}).xueHongjian={id:p.id,previousId:oldId,gen:S.gen,name:p.name};
 addConsort(p,rank,'相知之后，薛红笺亲口愿意入宫');
 // Family initialization may add ordinary life details; this biography stays authored.
 p.wound='hongjian';p.hobby='读书';p.wish='poem';p.arc=makeArc('hongjian',2);
 story(p,'【红笺入宫】她将铺中日常托付给学徒阿绫，保留原稿、商契和私账。入宫是愿意与你相伴，不是献出整间铺子；御用采买、铺中盈利和国库往后分别记账。');
 return p;
}
function hongjianInvitationEvent(p){
 if(!hongjianCanInvite(p))return null;const stage=p.fenghua.stage,ready=stage>=3;let done=false;
 const valid=()=>!done&&hongjianActive()&&!livingStoryConsort('hongjian')&&!p.hongjian&&fenghuaPresent(p)&&!mourningActive()&&p.age>=18&&E().age>=18;
 return {title:ready?'薛红笺 · 愿与你入宫':'薛红笺 · 再相识一些',por:p,valid,text:ready?
  '花笺铺打烊后，你问她是否愿意入宫。薛红笺没有马上答，只将三样东西放在桌上：更正过署名的诗稿、按市价订立的契约，还有那张没有替你代笔的素笺。\n“起先我怕，进了宫，我写的东西便不再署自己的名，铺里的人也只剩下替贵人办差。后来你肯听我讲清这些。”\n她说已经教阿绫独立记账，店里的工钱也安排妥当。“我愿意。但不是把这间铺子送给陛下。是我这个人，想同你往后过日子。宫里的账，我可以帮着看；我的诗，也还要慢慢写。”':
  '你问她是否愿意入宫。薛红笺把手上的染纸架放好，认真想了一会儿。\n“如今说愿意，太像是看中了宫里的富贵；说不愿意，又像是没把陛下这些日子的相待放在心上。我想先把几件事做完，也让我们多认得彼此一点。”\n她还惦记自己的诗、铺中伙计的生计，以及一封能说真话的信。她没有把门关上，只请你别用一纸册封代替往后的相识。',choices:ready?[
   {t:'应她所愿，接入宫中 · 贵人，额满则常在',cond:()=>valid()&&hongjianAdmissionRank()!==null,why:'贵人与常在均无名额',f:()=>{if(!valid()||hongjianAdmissionRank()===null)return null;const c=admitHongjian(p);if(!c)return null;done=true;return `薛红笺自愿入宫，册为${RANKS[c.rank]}，居${c.palace}。原有相识与选择全部留在她的纪事里。晋至嫔位后，可参与宫中采买与货运经营，每月为国库增收。`; }},
   {t:'先保持来往，等彼此准备好了再迎她',f:()=>{if(!valid())return null;done=true;fenghuaRecord(p,'入宫之问','你问起她往后的打算。','暂缓入宫','她愿意入宫的心意已说清，今日仍先回铺中照看生意。');return '她笑着把未写完的笺递来：“那就再来。知道是你想来，我便高兴。”三个月后仍可再谈。';}}
  ]:[{t:'依她的意思，先把这几件事走完',f:()=>{if(!valid())return null;done=true;fenghuaRecord(p,'入宫之问','你问起她是否愿意入宫。','尊重她继续相识的意思','她尚未答应，愿先经历诗稿、订单与亲笔信三段故事。');return '先从「相见 · 续说近事」继续三段宫外故事。完成后，她会亲口回应入宫之问。';}}]};
}
A.hongjianInvite=function(){const p=fenghuaPerson('xueHongjian');if(modalOpen||!hongjianCanInvite(p)||E().energy<1)return;const ev=hongjianInvitationEvent(p);if(!ev||!useE())return;p.fenghua.lastInvitation=S.turn;pushEv(ev);};
function hongjianMonthlyIncome(c){
 if(!hongjianCurrent(c)||!inPalace(c)||c.rank<4||c.hongjian.paused)return 0;
 return 8+(c.hongjian.procurement==='compare'?4:c.hongjian.procurement==='audit'?2:0)+(c.hongjian.relief==='credit'?2:c.hongjian.relief==='split'?1:0);
}
function settleHongjianIncome(){
 if(!hongjianActive())return 0;const c=S.consorts.find(x=>x.hongjian);if(!c)return 0;
 const amount=hongjianMonthlyIncome(c),d=c.hongjian;if(!amount||d.lastIncome===S.turn)return 0;
 d.lastIncome=S.turn;d.totalIncome=(d.totalIncome||0)+amount;
 d.receipts.push({turn:S.turn,gen:S.gen,date:dateStr(),amount,reason:'采买节余与货运商契收益'});if(d.receipts.length>24)d.receipts.shift();
 log(`薛红笺核清宫中采买与货运商契，本月为国库增收 ${amount} 万两；私铺账目另列。`);
 if(d.receipts.length===1||S.turn%3===0)story(c,`【红笺经营】本月核定国库增益 ${amount} 万两，累计 ${d.totalIncome} 万两。保留报价、契约与入库凭据，私铺账目另列。`);
 return amount;
}
function hongjianIncomeReason(c){
 if(!S.consorts.includes(c)||c.hongjian.gen!==S.gen)return '前朝经历留存，当前不再为新帝经营。';
 if(!c.alive||c.gone)return '已停止经营，旧账仍可翻阅。';
 if(c.cold||c.templeStay||c.homeLeave)return '暂离宫中或处于冷宫，经营增益暂停。';
 if(c.rank<4)return '须晋至嫔位及以上，才有资格主持相关采买；目前不计经营增益。';
 if(c.hongjian.paused)return '依此前选择暂停经营，先陪她理清旧账。';
 return `下次月末可增加国库 ${hongjianMonthlyIncome(c)} 万两，已计入当月总收入，不另重复领取。`;
}
function hongjianPanel(c){
 if(!hongjianContent()||!c?.hongjian)return '';
 const stage=c.arc?.id==='hongjian'?c.arc.st:0,done=!!c.arc?.done,ready=hongjianAvailable(c)&&(done?S.turn-c.hongjian.lastDaily>=3:S.turn>=c.arc.t),title=HONGJIAN_CHAPTERS[stage]?.title;
 return `<section class="detail-section" id="hongjian-story"><h3>红笺入宫 · 相伴与经营</h3><p>她曾在市井亲自染笺、写诗、核账。入宫后既有经营本事，也有自己的委屈、牵挂与愿望。</p><p>${esc(hongjianIncomeReason(c))}</p><p>累计增收 ${c.hongjian.totalIncome||0} 万两 · ${done?'六段主线已完成，仍可日常相处':`已完成 ${stage}/6 段${title?'，下一段「'+esc(title)+'」':''}`}</p><div class="acts"><button class="btn jade" onclick="A.hongjianStory(${c.id})" ${ready&&E().energy>0?'':'disabled'}>${done?'陪她谈近况':'续说宫中近事'} · 精力1</button>${c.hongjian.paused?`<button class="btn" onclick="A.hongjianAccounts(${c.id})" ${hongjianAvailable(c)&&S.turn-c.hongjian.pausedAt>=3&&E().energy>0?'':'disabled'}>核对暂停的经营账 · 精力1</button>`:''}</div>${!ready&&!done&&hongjianAvailable(c)?`<p class="hint">再过${Math.max(0,c.arc.t-S.turn)}个月续谈；月末也可能自然遇见这一幕。</p>`:''}<ol>${HONGJIAN_CHAPTERS.map((x,i)=>`<li><strong>${esc(x.title)}</strong>${done||i<stage?' · 已记入纪事':''}<p>${esc(x.summary)}</p></li>`).join('')}</ol>${typeof hongjianStewardPanel==='function'?hongjianStewardPanel(c):''}${c.hongjian.receipts.length?detailFold('查看最近经营入账',`<ul class="story">${c.hongjian.receipts.slice(-6).reverse().map(r=>`<li><time>${esc(r.date)}</time>${esc(r.reason)} · 国库 +${r.amount} 万两</li>`).join('')}</ul>`):''}</section>`;
}
function hongjianCodexCard(){
 if(!hongjianContent())return '';const p=fenghuaPerson('xueHongjian'),admitted=!!p?.hongjian,archive=admitted&&!S.consorts.includes(p),closed=S.fenghua?.admitted?.xueHongjian;
 const resident=livingStoryConsort('hongjian');
 const status=archive?'前朝经历':admitted?(!p.alive?'已入宫 · 已故':p.gone?'已入宫 · 已离宫':'已入宫'):p?`已相识 · 宫外故事 ${Math.min(3,p.fenghua.stage)}/3`:closed?'前朝人物 · 旧事存于起居注':'尚未相遇';
 return `<article class="story-consort-card" data-story-consort="hongjian"><div class="story-consort-picture">${porImg(p||fenghuaPreview('xueHongjian'),200)}${storyConsortProgress(resident?.status||status)}</div><div class="story-consort-copy"><h3>薛红笺 · 笺铺知己</h3>${storyConsortBadge('hongjian')}<p><strong>明快通透</strong> · 会写诗，也会算工钱；愿意相爱，却不愿让自己的名字与手艺被买走。</p><dl><dt>来处与相遇</dt><dd>她在上京经营花笺铺，亲自染纸、接单、教徒。微服私访时在书肆或花笺铺偶遇，沿用固定立绘 438。</dd><dt>入宫心意</dt><dd>相识后可以询问她是否愿意入宫。先完成诗稿署名、宫中订单与亲笔信三段故事，她才会亲口答应。需双方成年；可暂缓，三个月后再谈。自愿入宫册为贵人，贵人额满则常在。</dd><dt>经营本事</dt><dd>嫔位及以上、在宫且未暂停经营时，月末为国库增加8万两；比较报价、稳定供货后可提升至每月14万两。降位至嫔以下、冷宫或离宫则暂停。每笔收入可在人物页和月度收支中核对。</dd><dt>协理六宫</dt><dd>熟悉宫中账务后，她会主动请领宫务；你也可从御书房直接任命她或其他妃嫔。任职者月末额外恩宠+10，上限100，同一时间一人。任职三个月后有宫务回奏，改任、卸任与任内经历均留册。</dd><dt>后宫故事</dt><dd>初来时如何安放算盘与诗稿；采购是否只信她一家；被议论以商邀宠时怎样避嫌；赈济中如何兼顾周转与工钱；把本事教给皇嗣；以及一盏灯下，不谈银钱的相伴。</dd></dl>${typeof fenghuaGuide==='function'?fenghuaGuide('xueHongjian',p):''}<div class="acts">${!p&&closed?'<button class="btn" onclick="A.go(\'log\')">旧事存于起居注</button>':resident&&!admitted?storyResidentHistoryButton(resident):p?`<button class="btn jade" onclick="A.go('${admitted&&!archive?'consort':'fenghua'}',${admitted&&!archive?p.id:"'xueHongjian'"})">${archive?'查看薛红笺的前朝经历':admitted?'查看薛红笺与后宫纪事':'相见与询问入宫'}</button>`:closed||resident?'':'<button class="btn jade" onclick="A.go(\'out\')">去书肆与花笺铺寻访</button>'}</div></div></article>`;
}
function hongjianGuestPanel(p){
 const wait=Math.max(0,3-(S.turn-(p.fenghua.lastInvitation??-99)));
 return `<section class="detail-section"><h3>入宫之问</h3><p>${p.fenghua.stage>=3?'三段宫外故事已完成。她将铺中日常托付妥当，愿认真回答是否与你入宫。':'她愿先走完诗稿、订单与亲笔信三段故事，再决定是否入宫。此时也可以先问她的想法。'}</p><button class="btn jade" onclick="A.hongjianInvite()" ${hongjianCanInvite(p)&&E().energy>0?'':'disabled'}>询问是否愿意入宫 · 精力1</button>${wait?`<p class="hint">再过${wait}个月可重谈此事。</p>`:''}</section>`;
}
function hongjianProfile(c){
 if(S.consorts.includes(c)){const sel=UI.sel;UI.sel=c.id;try{return viewConsort();}finally{UI.sel=sel;}}
 return `${personBackButton('home')}<header class="detail-head person-detail-head">${porImg(c,224)}<div><h2>薛红笺 · 前朝经历</h2><p>入宫、相伴与经营往事保留在旧朝，当前不可再次纳入。</p></div></header>${detailSection('人物纪事',detailStory(c))}${hongjianPanel(c)}`;
}
const hongjianVisit=A.fenghuaVisit;
A.fenghuaVisit=function(key){const p=fenghuaPerson(key);if(hongjianContent()&&p?.hongjian)return A.hongjianStory(p.id);return hongjianVisit(key);};
const hongjianVoice=consortVoicePool;
consortVoicePool=function(c){const pool=hongjianVoice(c);if(!hongjianAvailable(c))return pool;
 pool.push(voiceLine('hongjian-shop','她将铺中来信夹进诗集。','阿绫这一回账算得分毫不差，倒把给我的问候写在账尾。她怕我只看生意，不看她。臣妾读了两遍。'));
 if(c.hongjian.totalIncome)pool.push(voiceLine('hongjian-person','她把账册合起来，给你留了一张素笺。','今日不必再问赚了多少。陛下若愿意，只告诉臣妾，路过时有没有想来坐一会儿。'));
 return pool;
};
