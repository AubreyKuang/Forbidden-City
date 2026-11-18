/* One current appointment; honor is settled once at the end of an actual month. */
const haremStewardEnabled=()=>!!S&&journalContentVersion()>=28;
const haremStewardActive=()=>haremStewardEnabled()&&!S.over;
const haremStewardRecord=()=>S&&S.flags?.haremSteward?.gen===S.gen?S.flags.haremSteward:null;
const haremStewardPerson=()=>{const a=haremStewardRecord();return a?byId(a.id):null;};
const haremStewardEligible=c=>haremStewardActive()&&!!c&&S.consorts.includes(c)&&inPalace(c)&&!c.maid&&c.rank<8;
function haremStewardReason(c){
 if(!c||!c.alive)return '已经离世';if(c.gone)return '已经离宫';if(c.cold)return '已入冷宫';if(c.rank===8)return '已册立为皇后，改由中宫主理';
 if(c.templeStay||c.homeLeave)return '暂离宫中，差事保留，恩宠增益暂停';return '每月结算额外恩宠 +10，仍受恩宠上限100限制';
}
function haremStewardNote(c,title,text){story(c,`【协理六宫·${title}】${text}`);log(`${fullName(c)} · ${title}：${text}`);}
function endHaremSteward(reason){
 const a=haremStewardRecord(),c=haremStewardPerson();if(!a)return;
 if(c){const term=c.stewardship?.terms?.at(-1);if(term&&!term.ended){term.ended={turn:S.turn,date:dateStr(),reason};}haremStewardNote(c,'交还宫务',reason+'。任内经历与所得恩宠保留。');}
 delete S.flags.haremSteward;
}
function haremStewardChanges(){
 if(!haremStewardEnabled()||!S.flags.haremSteward)return;
 if(S.flags.haremSteward.gen!==S.gen){delete S.flags.haremSteward;return;}
 const c=haremStewardPerson();if(!c||!c.alive||c.gone||c.cold||c.maid||c.rank>=8)endHaremSteward(haremStewardReason(c));
}
function palaceSocialFeeling(a,b){
 if(friendshipTense(a,b)||isRival(a,b)||isRival(b,a)||relGet(a,b)<0)return 'strained';
 return selectionFriendsClose(a,b)?'close':'neutral';
}
function stewardAppointmentFeelings(c,former){
 const queen=empress(),name=fullName(c);
 const joy=former?'听见交接的旨意，她原本绷着的脸一下有了笑意。她把上一任留下的待办逐件问清，回去还给第一页簿子包了个新书角。':'她接过宫务簿，忍不住先翻开看了一眼。回宫后亲手磨墨，把第一笔轮值写得端端正正，写完才发觉自己一直在笑。';
 story(c,'【初领宫务】'+joy);cchg(c,{mood:8});setXin(c,'欢喜','奉旨协理六宫，以掌事人的身份签了宫务簿',null,{record:false});
 for(const o of harem().filter(o=>o!==c&&inPalace(o))){
  const feeling=palaceSocialFeeling(o,c),close=feeling==='close',strained=feeling==='strained';
  let reaction;
  if(o===queen){
   reaction=close?'她把自己那本圈得密密的旧簿也送了去：“有几处最容易算重，我吃过亏，给你留个记号。”今后案前总算有个人能同她商量。':
    strained?'她在交给对方的簿尾添了一行“逐月送中宫复核”。笔下的字一如往常，心里却惦记着，从此有些事要经那双手了。':
    '她将急着要办的三件事另抄一纸，又把原要点灯核对的账放回匣里。有人分劳，她松了口气，只盼初次交接少出岔子。';
  }else if(o===former){
   reaction=close?'她把最难催的一笔灯油圈给旧友看。亲手交出掌了许久的簿子，难免怅然，所幸接过去的人懂她的字。':
    strained?'她当面数清簿册，请女官逐本签收。交给素有嫌隙的人，她连最后一笔也舍不得含糊。':
    '她交出了用惯的钥匙。晚间还习惯性地问了一句谁值夜，问完才记起，这件事已归旁人管了。';
  }else if(o.rank>=5){
   reaction=(queen?'':'中宫虚位，众人都在看谁先道贺。')+(close?'她赶在各宫礼单送到前亲自来了一趟，只问旧友头一晚忙不忙：“若忙，我陪你把轮值簿理清。”':
    strained?'她依礼送上贺笺，回头却叫人把本宫的旧账再核一遍。打过交道的人如今掌了簿，她心里实在不痛快。':
    '她看内侍把轮值簿送去了别宫，才察觉自己原也盼过这份差事。她静坐片刻，仍提笔写了贺笺。');
  }else{
   reaction=close?'她先跑来道喜，见案上堆满簿册，又悄悄退出去。晚上送来一碟热糕，纸上只写着：“你忙你的，我替你记着吃饭。”':
    strained?'她想起上回两人话不投机，把本宫的领用票一张张理齐。往后要向那个人递帖子，她心里还有个结。':
    '她打听清楚往后该把用度单送到哪里，随即把搁了几日的修窗纸也添了上去。新掌事的人肯不肯听小事，她想先试一试。';
  }
  story(o,`【闻协理任命】${name}奉旨协理六宫。${reaction}`);
  if(close||strained)cchg(o,{mood:close?3:-3});
 }
 return joy;
}
function appointHaremSteward(c,source='御书房任命'){
 if(!haremStewardEligible(c)||haremStewardPerson()===c)return null;
 const former=haremStewardPerson();if(former)endHaremSteward(`奉旨将协理之责交给${fullName(c)}`);
 const term={gen:S.gen,since:S.turn,date:dateStr(),source};
 (c.stewardship ||= {terms:[],receipts:[]}).terms.push(term);
 S.flags.haremSteward={gen:S.gen,id:c.id,since:S.turn,source};
 if(c.hongjian)c.hongjian.stewardDecision='accepted';
 const queen=empress(),text=`奉旨协理六宫，核对各宫用度、宫人轮值与新人的安顿${inPalace(queen)?`，向皇后${fullName(queen)}与御前回报`:'，向御前回报'}。不改变位分与住处；每月结算额外恩宠10点。`;
 haremStewardNote(c,'领协理之责',text);
 if(journalContentVersion()>=80)return text+'\n'+stewardAppointmentFeelings(c,former);
 return `${fullName(c)}领了宫务簿，先问清现有规例与未办完的事。${text}`;
}
function settleHaremStewardReward(){
 if(!haremStewardActive())return null;haremStewardChanges();const c=haremStewardPerson();if(!haremStewardEligible(c))return null;
 const paid=S.flags.haremStewardPaid;if(paid?.gen===S.gen&&paid.turn===S.turn)return null;
 const before=c.favor;cchg(c,{favor:10});
 const receipt={gen:S.gen,turn:S.turn,date:dateStr(),id:c.id,name:fullName(c),amount:10,gain:c.favor-before};
 S.flags.haremStewardPaid=receipt;(c.stewardship.receipts ||= []).push(receipt);if(c.stewardship.receipts.length>24)c.stewardship.receipts.shift();
 haremStewardNote(c,'月度宫务',`本月协理宫务，额外恩宠 +${receipt.gain}${receipt.gain<10?'（本项应加10，已达恩宠上限100）':''}。`);return receipt;
}
function haremStewardAppointmentEvent(c){
 const old=haremStewardPerson(),oldId=old?.id??null;let done=false;
 const valid=()=>!done&&haremStewardEligible(c)&&haremStewardPerson()!==c&&(haremStewardPerson()?.id??null)===oldId;
 return {title:'御书房 · 协理六宫',por:c,valid,text:`拟命${cName(c)}（${fullName(c)}）协理六宫。${old?`现由${fullName(old)}任此差事；旨意下达后，由她交接宫务簿，不再领取这项月度增益。`:'眼下尚未另设协理人选。'}\n差事涉及各宫用度、宫人轮值与新人安顿，重大赏罚仍须奏明。任命不改变位分和住处，不花精力，也不在任命时立即加恩宠。每月结算额外增加恩宠10点，最高100。\n省亲或寺居期间暂停增益；入冷宫、离宫、去世或晋为皇后时结束差事。`,choices:[
  {t:old?'准予改任，交接宫务簿':'命她协理六宫',cond:valid,why:'人选或当前任命已有变化',f:()=>{if(!valid())return null;done=true;return appointHaremSteward(c);}},
  {t:'暂不下旨'}]};
}
function haremStewardRosterEvent(page=0){
 const current=haremStewardPerson(),women=S.consorts.filter(haremStewardEligible).filter(c=>c!==current).sort((a,b)=>b.rank-a.rank||b.talent-a.talent);
 return {title:'御书房 · 协理六宫人选',text:`${current?`现任：${fullName(current)}。${haremStewardReason(current)}。`:'当前尚未任命。'}\n同一时间由一位妃嫔协理，皇后仍主理六宫。可选宫中任一未任此职的妃嫔，不限是否为剧情妃。`,choices:[
  ...women.slice(page*8,(page+1)*8).map(c=>({t:`${cName(c)} · ${fullName(c)}${c.hongjian?' · 善理账务':''}`,person:c,cond:()=>haremStewardEligible(c)&&haremStewardPerson()!==c,why:'目前不在宫中或不可任职',f:()=>{if(haremStewardEligible(c)&&haremStewardPerson()!==c)pushNow(haremStewardAppointmentEvent(c));return null;}})),
  ...(current?[{t:'撤去现任协理之责',f:()=>{let done=false;const valid=()=>!done&&haremStewardActive()&&haremStewardPerson()===current;pushNow({title:'协理六宫 · 交还宫务簿',por:current,valid,text:`撤去${fullName(current)}的协理之责？位分与住处不变，已有恩宠保留，此后不再增加每月10点协理恩宠。`,choices:[{t:'准予交接，暂不另任',f:()=>{if(!valid())return null;done=true;endHaremSteward('奉旨卸下协理之责');return '宫务簿交回掌事女官，既往经历仍可在人物纪事中查阅。';}},{t:'仍由她协理'}]});return null;}}]:[]),
  ...(page>0?[{t:'上一页',f:()=>{pushNow(haremStewardRosterEvent(page-1));return null;}}]:[]),
  ...((page+1)*8<women.length?[{t:'下一页',f:()=>{pushNow(haremStewardRosterEvent(page+1));return null;}}]:[]),
  {t:'稍后再议'}]};
}
A.openHaremSteward=function(){if(haremStewardActive()&&!modalOpen)pushEv(haremStewardRosterEvent());};
function haremStewardPanel(){
 if(!haremStewardEnabled())return '';const c=haremStewardPerson();
 return `<section class="detail-section"><h3>协理六宫</h3><p>${c?`现任：${parentLink(c.id)} · ${esc(haremStewardReason(c))}`:'当前未任命。可选一位妃嫔协助处理各宫用度、宫人轮值与新人安顿。'}</p><p class="hint">每回合（月末）额外恩宠 +10，上限100。任命不改位分、不花精力；同一时间一人，随时可以改任或撤任。</p><button class="btn jade" onclick="A.openHaremSteward()" ${S.over?'disabled':''}>${c?'调整协理六宫人选':'任命协理六宫'}</button></section>`;
}
function haremStewardPersonPanel(c){
 if(!haremStewardEnabled()||!c.stewardship)return '';
 return `<section class="detail-section"><h3>宫务任职</h3><p>${haremStewardPerson()===c?`现任协理六宫 · ${esc(haremStewardReason(c))}`:'曾协理六宫，任职与交接保留于人物纪事。'}</p><button class="btn quiet sm" onclick="A.go('home')">去御书房安排宫务</button></section>`;
}
function hongjianStewardProposalReady(c){return hongjianAvailable(c)&&c.arc?.st>=2&&haremStewardEligible(c)&&haremStewardPerson()!==c&&!['accepted','declined'].includes(c.hongjian.stewardDecision)&&S.turn-(c.hongjian.lastStewardProposal??-99)>=12;}
function hongjianStewardProposal(c){
 if(!hongjianStewardProposalReady(c))return null;const old=haremStewardPerson(),oldId=old?.id??null;let done=false;
 const valid=()=>!done&&hongjianAvailable(c)&&haremStewardEligible(c)&&haremStewardPerson()!==c&&(haremStewardPerson()?.id??null)===oldId;
 const finish=(decision)=>{if(!valid())return false;done=true;c.hongjian.stewardDecision=decision;c.hongjian.lastStewardProposal=S.turn;return true;};
 return {title:'红笺入宫 · 请分六宫之劳',por:c,valid,onShow:()=>{c.hongjian.lastStewardProposal=S.turn;},text:`薛红笺带来的不是赢利账，而是各宫领用笺纸与灯油的簿子。几笔领用重复签过，另有一笔本该发给值夜宫人的灯油，仍压在库里。\n“铺子里欠一笔工钱，总有人要饿着等；宫里拖一笔小用度，也不是账上划掉就没事了。”她把名字遮住，先请你看流程，不愿未查清就指责哪个宫。\n她说自己会核账，也愿学宫规：“陛下若信得过，臣妾想试着协理六宫。只是先定清分内之事，重大赏罚还要奏请，不拿差事替自家铺子揽单。”\n${old?`眼下${fullName(old)}已在协理，她又补了一句：“现任若办得妥当，臣妾也可以只把这份核对交给她。”`:'她想承担的不只是赚钱，还有每一笔用度背后等着的人。'}`,choices:[
  {t:old?'改由红笺协理，先与现任交接':'准她协理六宫，依规分掌宫务',f:()=>{if(!finish('accepted'))return null;const result=appointHaremSteward(c,'红笺主动请缨');haremStewardNote(c,'主动请缨','她提出核对宫务并自愿担责，陛下允准；私铺生意与宫中差事仍分别核验。');return result;}},
  {t:'先听完她的办法，留待以后再议',f:()=>{if(!finish('deferred'))return null;haremStewardNote(c,'请缨暂缓','陛下听完她的办法，暂未任命；十二个月后可再谈，也可随时从御书房安排。');return '她将流程核对留下，没有就此领职。你仍可随时在御书房任命她；暂缓本身不增加恩宠。';}},
  {t:'暂只料理账务，宫务另作安排',f:()=>{if(!finish('declined'))return null;haremStewardNote(c,'另有分工','陛下决定不另授协理之责，她仍保留经营、诗稿与相伴的日子。');return '她收回请领差事的折子，不再重复请缨。经营与后宫主线照常；日后改主意仍可从御书房任命。';}}]};
}
A.hongjianSteward=function(id){if(modalOpen)return;const ev=hongjianStewardProposal(byId(id));if(ev)pushEv(ev);};
function hongjianStewardPanel(c){
 const current=haremStewardPerson()===c,ready=hongjianStewardProposalReady(c);
 return `<h4>请分六宫之劳</h4><p>她在核账时发现重复领用与迟发用度，希望协理六宫，把每笔钱背后的人也照看好。完成前两段宫中故事后，可听她请缨；也可随时从御书房安排。任职三个月后，她会递上第一本宫务簿，和你商量如何如实回奏、合理分工。</p><p>${current?'已奉旨协理六宫，每月额外恩宠 +10，上限100。':c.hongjian.stewardDecision==='declined'?'她已听取另作安排的意思，不再重复请缨；日后仍可由御书房任命。':c.hongjian.stewardDecision==='deferred'?'此事暂缓，十二个月后可再谈；随时可由御书房直接任命。':'尚未任此差事。'}</p>${ready?`<button class="btn jade" onclick="A.hongjianSteward(${c.id})">听她谈协理六宫</button>`:''}`;
}
function haremStewardReport(){
 const c=haremStewardPerson(),a=haremStewardRecord(),term=c?.stewardship?.terms?.at(-1);
 if(!haremStewardEligible(c)||mourningActive()||maternalVoiceUrgent(c)||!term||term.reportDone||S.turn-a.since<3)return null;let done=false;
 const valid=()=>!done&&haremStewardEligible(c)&&haremStewardPerson()===c&&haremStewardRecord()===a&&!term.reportDone&&!mourningActive()&&!maternalVoiceUrgent(c);
 return {title:'协理六宫 · 第一本宫务簿',por:c,valid,text:`领职三个月后，${fullName(c)}将第一本宫务簿送来。${c.hongjian?'她沿用铺中逐笔对账的办法，却在册首写下“宫务并非生意”，将省银与是否及时发放分列。':'她把各宫用度、轮值和新人安顿逐项列出，已办妥与仍待核验的各占一页。'}\n有人领用迟了，有人担心她管得太细。她问：“陛下是希望册子看起来没有差错，还是许臣妾把未办好的也写在这里？”\n她并没有请求你替她压下异议，只想确认遇上难办的事，仍能照实回禀。`,choices:[
  {t:'把未办好的也记下，听各宫说明后逐项补齐',f:()=>{if(!valid())return null;done=true;term.reportDone=true;haremStewardNote(c,'宫务回奏','奉旨保留未结事项，听取各宫的说明，再逐项补齐。差事重在照实回奏，不以隐瞒换好看。');return '她把留白的一栏写上“待核”，明白自己不必装作事事无误。'+fx(cchg(c,{aff:5,mood:6}));}},
  {t:'先缩减分工，由掌事女官分担轮值与安顿',f:()=>{if(!valid())return null;done=true;term.reportDone=true;haremStewardNote(c,'宫务分工','奉旨先专理用度，轮值与新人安顿交掌事女官分担。仍保留协理名分与每月恩宠。');return '宫务重新分工，她仍协理六宫，不必独自揽下所有差事。'+fx(cchg(c,{aff:3,mood:8}));}}]};
}
function queenHouseholdRecommendation(){
 if(journalContentVersion()<80||mourningActive())return null;
 const q=empress(),gen=S.gen;
 if(!inPalace(q)||q.declinedHouseholdGen===gen)return null;
 const prior=S.flags.queenRecommendations;
 if(prior?.gen===gen&&(S.turn-prior.turn<6||prior.year===S.year&&prior.count>=2))return null;
 const friends=harem().filter(c=>haremStewardEligible(c)&&palaceSocialFeeling(q,c)==='close')
  .sort((a,b)=>relGet(q,b)-relGet(q,a)||b.talent-a.talent);
 const promotable=c=>c.rank<7&&rankCount(c.rank+1)<RANK_CAP[c.rank+1];
 const steward=!haremStewardPerson()&&friends.find(c=>c.rank>=5);
 const c=steward||friends.find(promotable);
 if(!c||!chance(.2))return null;
 const rank=c.rank,name=fullName(c),office=steward?'协理六宫':`晋为${RANKS[rank+1]}`;
 let shown=false,done=false;
 const valid=()=>!done&&S.gen===gen&&empress()===q&&inPalace(q)&&q.declinedHouseholdGen!==gen&&
  haremStewardEligible(c)&&palaceSocialFeeling(q,c)==='close'&&c.rank===rank&&(steward?!haremStewardPerson():promotable(c));
 return {title:steward?'中宫荐举 · 分掌宫务':'中宫请封 · 请晋一级',cast:[q,c],present:[q],valid,
  text:steward?`皇后把两份轮值簿摊在案上：“陛下看，两处都排了同一个人值夜。是${name}先瞧出来的。臣妾同她相熟，知道她肯管这些琐碎事。想请她协理六宫，往后也好有人同臣妾仔细核一遍。”`:
   `皇后将请封笺亲手递来：“${name}如今是${RANKS[rank]}。平日一同料理宫事，她用的心，臣妾看得见。想替她讨一级位分，晋作${RANKS[rank+1]}。这句话是臣妾自己要说的，没先许过她。”`,
  onShow:()=>{if(shown)return;shown=true;S.flags.queenRecommendations={gen,turn:S.turn,year:S.year,count:(prior?.gen===gen&&prior.year===S.year?prior.count:0)+1};},
  choices:[{t:steward?'准她协理六宫':`准晋一级，封为${RANKS[rank+1]}`,f:()=>{
   if(!valid())return null;done=true;story(q,`【中宫荐举】奏请${name}${office}，得陛下允准。她将请笺收好，才叫人去报喜。`);
   if(steward)return appointHaremSteward(c,'皇后'+fullName(q)+'荐举');
   story(c,`【中宫请封】皇后${fullName(q)}为她请晋一级，陛下准礼官办理。`);return A.promote(c.id,true);
  }},{t:'驳回，今后不必再荐',f:()=>{
   if(!valid())return null;done=true;q.declinedHouseholdGen=gen;
   story(q,`【中宫荐举】为${name}请${office}未获准。她记住御前的意思，本朝不再主动荐人协理，也不再替人请封。`);
   return '皇后收起请笺：“臣妾记下了。”这位皇后本朝不再主动荐举协理或晋位人选。';
  }}]};
}
function pendingHaremStewardEvent(){
 if(!haremStewardActive()||mourningActive())return null;
 return haremStewardReport()||hongjianStewardProposal(S.consorts.find(c=>c.hongjian))||queenHouseholdRecommendation();
}
