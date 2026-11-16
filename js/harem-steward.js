/* One current appointment; honor is settled once at the end of an actual month. */
const haremStewardEnabled=()=>!!S&&journalContentVersion()>=27;
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
function appointHaremSteward(c,source='御书房任命'){
 if(!haremStewardEligible(c)||haremStewardPerson()===c)return null;
 const former=haremStewardPerson();if(former)endHaremSteward(`奉旨将协理之责交给${fullName(c)}`);
 const term={gen:S.gen,since:S.turn,date:dateStr(),source};
 (c.stewardship ||= {terms:[],receipts:[]}).terms.push(term);
 S.flags.haremSteward={gen:S.gen,id:c.id,since:S.turn,source};
 if(c.hongjian)c.hongjian.stewardDecision='accepted';
 const queen=empress(),text=`奉旨协理六宫，核对各宫用度、宫人轮值与新人的安顿${inPalace(queen)?`，向皇后${fullName(queen)}与御前回报`:'，向御前回报'}。不改变位分与住处；每月结算额外恩宠10点。`;
 haremStewardNote(c,'领协理之责',text);
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
function pendingHaremStewardEvent(){
 if(!haremStewardActive()||mourningActive())return null;
 return haremStewardReport()||hongjianStewardProposal(S.consorts.find(c=>c.hongjian));
}
