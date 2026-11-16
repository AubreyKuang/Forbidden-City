const HONGJIAN_CHAPTERS=[
 {title:'算盘与宫牌',summary:'入宫的行李里，一边是册封衣冠，一边是磨旧的算盘。她要安顿铺中伙计，也想确认自己仍能写诗、经营；你的答复决定私账与宫中采买怎样分开。'},
 {title:'三份报价',summary:'同样的纸料，进宫的报价却贵了许多。她发现省银不只靠砍价，更在于验货、按期付款与不拖欠工钱。比较报价和逐单核验会带来不同的长期收益。'},
 {title:'风声不作证',summary:'有人把她的经营本事说成以商邀宠。若有实际相处的妃嫔提出疑问，两人会当面谈清；你可以公开账目，也可暂缓经营，不能凭传闻定罪。'},
 {title:'一纸欠款',summary:'雨损货船，供货工坊急需周转。她希望为赈济采买稳住货源，又不愿把风险都压给工人。垫付病粮工钱、拆分订单与暂不接单各有后果。'},
 {title:'留给谁的本事',summary:'她愿教皇嗣看懂一张粮价单，分清账上盈利与百姓是否吃得起饭。没有合适皇嗣在场时，就编成算例留在书房，不虚构孩子。'},
 {title:'千金不抵一夜灯',summary:'生意有了章法，她却不想每次相见都在报账。灯下那首没有写完的诗，是她对相伴的期待；你如何回应，会留在此后的闲谈里。'}
];
function hongjianRecord(c,title,text,choice,outcome,peers=[]){
 const people=[c,...peers].filter((x,i,a)=>x&&a.indexOf(x)===i&&x.alive!==false),event={title,participants:people.map(x=>({id:x.id,name:x.sex?kidName(x):fullName(x)})),situation:text,choice,outcome};
 for(const p of people)(p.story ||= []).push({d:dateStr(),thread:`hongjian:${c.id}`,t:`【红笺入宫·${title}】${text}\n回应：${choice}。${outcome}`,event,life:{source:'红笺入宫',people:event.participants}});
 log(`薛红笺 · ${title}：${outcome}`);
}
function hongjianScene(c,title,text,options,peers=[],advance=true){
 const stage=c.arc.st;let done=false;
 const valid=()=>!done&&hongjianAvailable(c)&&c.arc.st===stage&&peers.every(x=>S.children.includes(x)?childCanVisitCourt(x):inPalace(x));
 return {title:'红笺入宫 · '+title,por:c,cast:[c,...peers],present:[c],valid,text,choices:options.map(o=>({t:o.t,cond:()=>valid()&&(!o.cond||o.cond()),why:o.why||'眼下条件不符',f:()=>{
  if(!valid()||o.cond&&!o.cond())return null;done=true;const result=o.f();
  if(advance){c.arc.st++;c.arc.t=S.turn+3;if(c.arc.st>=HONGJIAN_CHAPTERS.length){c.arc.done=true;c.arc.end='红笺有归处';c.arc.t=1e9;c.hongjian.lastDaily=S.turn;}}
  else c.hongjian.lastDaily=S.turn;
  (c.hongjian.choices ||= {})[title]=o.t;
  hongjianRecord(c,title,text,o.t,result,peers);return result;
 }}))};
}
function hongjianPalaceEvent(c){
 if(!hongjianAvailable(c)||c.arc?.id!=='hongjian')return null;
 if(c.arc.done)return hongjianDailyEvent(c);
 const stage=c.arc.st;
 if(stage===0)return hongjianScene(c,HONGJIAN_CHAPTERS[0].title,
  '册封衣冠送到了，薛红笺却先把行李里的一架旧算盘摆在窗下。算盘脚缺了一角，她垫上一片旧笺，放得很稳。\n掌柜阿绫从铺中来信，问往后新契该盖店印，还是该写娘娘的封号。她读到这里，笑意收了一点：“若写上封号，谁还敢同我们议价？那不是生意，是让人怕我。”\n她另拿出一本薄薄的诗稿：“这两本都想留下。一本记银钱，一本记我自己。陛下肯不肯让我分开放？”',[
   {t:'私账归私账，宫中订单照价照章',f:()=>{c.hongjian.accounts='separate';return '店印仍作店印，宫中采买另立契约、另有核验。她把诗稿推近，说今晚想先念其中一首。'+fx(cchg(c,{aff:8,mood:8}));}},
   {t:'请独立账房审账，她保留经营与写诗的决定',f:()=>{c.hongjian.accounts='review';return '账房只查收支，不替她决定写什么、教谁或如何接单。她虽要多留凭据，却也觉得自己的手艺有了可以讲明白的边界。'+fx(cchg(c,{aff:5,mood:6}));}}
  ]);
 if(stage===1)return hongjianScene(c,HONGJIAN_CHAPTERS[1].title,
  '御用笺纸的报价送来，薛红笺把它同旧铺的账一比，发现同样的纸料竟贵了近半。值事的人说，这是供奉宫中的体面价。她却先请来样纸，又问车脚钱与工钱何时付。\n“这家贵在层层转手；那家便宜，却把工钱拖了三个月。只挑最低的一张，省下的钱也可能是从别人饭碗里拿来的。”\n她列出三份报价，连退货、付款和验收都写在旁边。你第一次看清，她口中的精明不是一味压价。',[
   {t:'比较三家实价，按期付款并验收',f:()=>{c.hongjian.procurement='compare';return '三份报价与验收记录一并留档，不指定她的私铺承包。达到嫔位后，月度经营增益在基础8万两上增加4万两。'+fx(cchg(c,{aff:6,talent:2}));}},
   {t:'先逐单复核，小额试行再扩大',f:()=>{c.hongjian.procurement='audit';return '先从小批采买试行，保留逐单复核，扩张慢些，周转也更稳。达到嫔位后，基础月度增益增加2万两。'+fx(cchg(c,{aff:4,mood:4}));}}
  ]);
 if(stage===2){
  const other=harem().filter(o=>o!==c&&inPalace(o)&&!maternalVoiceUrgent(o)).sort((a,b)=>relGet(c,a)-relGet(c,b))[0];
  const suspicious=other&&(['善妒','骄矜','城府'].includes(other.trait)||relGet(c,other)<-10);
  return hongjianScene(c,HONGJIAN_CHAPTERS[2].title,
   `${other?`${cName(other)}在廊下提起采买账，${suspicious?'话中带了几分尖意：“如今连纸料都经她的手，得宠倒真是样样方便。”':'问得很直接：“你的铺子也做笺纸，怎样让旁人相信宫里的钱没有偏向自家？”'}`:'宫中开始有人议论，贵人既有私铺，又过问采买，账面再清也难免惹疑。'}\n薛红笺没有把算盘往前一推、要人立即服气。她先说：“这个问题应该问。我愿把有关的账拿出来，但不能因为我是做生意的，便先认定我在偷拿银子。”\n她望向你，等的不是偏袒，而是这一次能不能把话说到凭据上。`,[
    {t:'公开相关收支与报价，不许借出身讥人',f:()=>{c.hongjian.openBooks=true;c.hongjian.paused=false;if(other)relAdd(c,other,suspicious?2:6);return '只公开与宫中采买有关的账，私生活不拿来供人围看。有疑问逐笔核对，没有凭据不以出身定罪。'+fx(cchg(c,{aff:7,mood:6}));}},
    {t:'暂缓经营，独立复核后再由她决定继续',f:()=>{c.hongjian.openBooks=false;c.hongjian.paused=true;c.hongjian.pausedAt=S.turn;if(other)relAdd(c,other,1);return '经营增益暂时停止，旧账仍可核验。主线继续；三个月后可单独核对暂停的经营账，确认无误再恢复。她记住你肯留给她选择，也难免有些失落。'+fx(cchg(c,{aff:2,mood:-3}));}}
   ],other?[other]:[]);
 }
 if(stage===3)return hongjianScene(c,HONGJIAN_CHAPTERS[3].title,
  '一场急雨损了运纸的货船，给宫中供货的小工坊写来求缓交货的信。工坊还接着义仓所需纸袋与记粮簿，若一下追清欠款，工人下月的口粮也要断。\n薛红笺没有把信藏起来，连自己当初判断失准的地方也圈出：“是我把交期算紧了。可以从别处接急单补钱，可若拿还没到手的银子许工钱，只是把窟窿往后推。”\n她摆出两份能执行的办法：拨一笔周转银稳住供货，或拆分订单，先做确实付得起的部分。',[
   {t:'拨15万两周转，工钱与赈济用料优先',cond:()=>E().treasury>=15,why:'国库不足15万两',f:()=>{c.hongjian.relief='credit';return '周转银按工钱与用料分账发放，赈济相关订单优先，账上不把尚未收到的货算作已交。此后稳定供货使月度经营增益再加2万两。'+fx(chg({treasury:-15,people:3}),cchg(c,{aff:7,mood:5}));}},
   {t:'拆分订单，按已验收的部分付款',f:()=>{c.hongjian.relief='split';return '一部分转给别家，原工坊先完成能承担的数量。少赚些，却不再靠拖欠工钱周转；此后月度经营增益再加1万两。'+fx(chg({people:1}),cchg(c,{aff:4}));}},
   {t:'暂停新增订单，先偿清已有工钱',f:()=>{c.hongjian.relief='stop';return '这一轮不扩张订单，先把已有承诺做完。没有新增长期收益，但她不必为了证明能赚钱而把风险推给伙计。'+fx(cchg(c,{aff:3,mood:4}));}}
  ]);
 if(stage===4){const k=fenghuaChild();return hongjianScene(c,HONGJIAN_CHAPTERS[4].title,
  `${k?`${kidName(k)}来问怎样才算会做生意。她没有先给一道乘除题，而是铺开一张米价单。`:'尚无合适的皇嗣在宫中听课，她便把常见的粮价、脚钱与损耗写成一册算例，想留给将来的学生。'}\n“这一批粮，账上赚了十两。可若三户人家因此买不起米，是不是还该只说赚了？”\n她让人把不同答案都留下，再讲仓储、损耗、工钱与市价。讲到最后，她摸了摸算盘的缺角：“我年轻时也只盯着最后一行。后来才知道，前面每一笔都有人。”`,[
   {t:k?'让皇嗣亲自核算，也听她讲钱粮之外的事':'留存算例，注明她的署名',f:()=>{c.hongjian.teaching=true;const result=k?fenghuaTeach(k,'lit',4,'薛红笺教自己核算粮价、工钱与损耗，也问账上盈利之外百姓能否买得起粮。'):'算例以薛红笺署名留在书房，今后有合适学生再学。';return result+fx(cchg(c,{aff:6,talent:2}));}},
   {t:'先留作书房读本，保留不同的答案',f:()=>{c.hongjian.teaching='book';return '读本不只收一个标准答案，连容易算漏的工钱也单列出来。她把序言写得很短：“学算账，也学看人。”'+fx(cchg(c,{aff:4,mood:4}));}}
  ],k?[k]:[]);}
 if(stage===5)return hongjianScene(c,HONGJIAN_CHAPTERS[5].title,
  `夜里她带来一张新笺，你以为又是账目，问了一句今日入账多少。她停了片刻，把纸反过来，背面只有两句没写完的诗。\n“陛下记得我会赚钱，我是高兴的。可有时也想，若哪一年生意不好，来这里坐一会儿的人，会不会就少了。”\n窗外灯影轻动，她没有索要位分，也没有把旧日相待折成价钱。${c.aff>=55?'她只是将另一只茶杯推近，愿意把没有写好的句子给你看。':'这些日子有过疏远，她仍愿把这点忐忑说出来，却不急着索求一句保证。'}`, [
   {t:'合上账本，陪她把诗写完',f:()=>{c.hongjian.lamplight='poem';return '你先听她念那两句，问她为什么改了最后一个字。今夜没有补报收益，她记下的却是你肯多坐的这段时间。'+fx(cchg(c,{aff:12,mood:10}));}},
   {t:'问她想念铺中的什么，认真听完',f:()=>{c.hongjian.lamplight='home';return '她说起新纸晾干的气味、伙计报错一个数时的笑声，还有忙完一天关门的安静。你听她说完，约好往后来信时，也一同听听这些小事。'+fx(cchg(c,{aff:10,mood:9}));}}
  ]);
 return null;
}
function hongjianDailyEvent(c){
 if(!hongjianAvailable(c)||S.turn-c.hongjian.lastDaily<3)return null;
 return hongjianScene(c,'铺中来信','阿绫的来信带着一角新染的纸样。薛红笺已经看过账，却仍想同你说说店里的小事；窗下的旧算盘与诗稿，照旧分开放着。',[
  {t:'陪她读铺中来信，不只问盈亏',f:()=>`她念完信，又挑出一件有趣的小事与你笑谈。${fx(cchg(c,{aff:4,mood:5}))}`},
  {t:'一起核对公开账目',f:()=>{const paused=c.hongjian.paused;c.hongjian.paused=false;return (paused?'待核账目已核清，她同意恢复经营；达到嫔位并在宫时，下月重新计入增益。':'账目与入库凭据相合，月末按既定规则结算，今日不另领取。')+fx(cchg(c,{aff:2,mood:3}));}}
 ],[],false);
}
ARCS.hongjian={name:'红笺入宫',fit:c=>!!c.hongjian,stages:HONGJIAN_CHAPTERS.map(()=>c=>hongjianPalaceEvent(c))};
A.hongjianStory=function(id){
 const c=byId(id);if(modalOpen||!hongjianAvailable(c)||E().energy<1||c.arc?.id!=='hongjian'||(!c.arc.done&&S.turn<c.arc.t))return;
 const ev=hongjianPalaceEvent(c);if(!ev||!useE())return;pushEv(ev);
};
A.hongjianAccounts=function(id){const c=byId(id);if(modalOpen||!hongjianAvailable(c)||!c.hongjian.paused||S.turn-c.hongjian.pausedAt<3||E().energy<1)return;const ev=hongjianDailyEvent(c);if(!ev||!useE())return;pushEv(ev);};
