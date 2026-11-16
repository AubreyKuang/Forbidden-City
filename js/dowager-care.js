/* Private dates make the last years a continuous story; dialogue never predicts a death date. */
const dowagerCareActive=()=>!!S&&journalContentVersion()>=40;
const OPENING_QUEEN_KIN_CHANCE=.25;
function initializeDowagerOpening(){
 if(!dowagerCareActive()||S.flags.openingQueenKinChecked)return;
 S.flags.openingQueenKinChecked=true;
 const d=ensureDowager(),q=empress();if(!d?.alive||!q||!chance(OPENING_QUEEN_KIN_CHANCE))return;
 d.sur=q.sur;d.clan=clanKey(q);d.fam={...q.fam};d.relation ||= '生母';d.natalBrotherId=houseOf(q).father.id;
 q.dowagerKin={gen:S.gen,relation:'侄女'};
 q.imperialKin={gen:S.gen,relation:'母族表妹',via:d.fullName||d.name,blood:true};q.kinNote='太后母家侄女 · 陛下的母族表妹';
 const text=`皇后${fullName(q)}出自太后母家，是太后的侄女；其父${q.house.father.name}与太后为同胞手足。潜邸婚姻之外，也有这层母族亲缘。`;
 story(q,'【母家亲缘】'+text);story(q.house.father,'【母家亲缘】'+text);dowagerRecord(d,'母家晚辈',text);log(text);
}
function dowagerLifePlan(d=ensureDowager()){
 if(!dowagerCareActive()||!d?.alive)return null;
 if(!d.lastYears){
  const wait=Math.floor(Math.log(1-R())/Math.log(1-.006))+1,deathTurn=S.turn+36+wait;
  d.lastYears={deathTurn,askTurn:deathTurn-ri(12,36),asked:false,warned:false,caregiver:null,lastCare:-1,history:[]};
 }
 return d.lastYears;
}
const dowagerIll=d=>!!(dowagerCareActive()&&d?.alive&&d.lastYears&&S.turn>=d.lastYears.deathTurn-6&&S.turn<d.lastYears.deathTurn);
const dowagerCareCandidates=()=>harem().filter(c=>c.age>=18&&dowagerVisitReady(c));
function defaultDowagerCaregiver(d){return dowagerCareCandidates().filter(c=>c.clan===d.clan).sort((a,b)=>dowagerBond(b,d)-dowagerBond(a,d)||b.rank-a.rank||a.id-b.id)[0]||null;}
function appointDowagerCaregiver(d,c,reason='奉旨'){ 
 const p=d?.lastYears;if(!dowagerIll(d)||c&&!dowagerCareCandidates().includes(c))return false;
 if(p.careAssigned&&p.caregiver===(c?.id??null))return false;
 const previous=byId(p.caregiver);if(previous)story(previous,`【慈宁宫侍疾】${reason}更换侍疾安排，交清太后的饮食与服药时辰后，结束这一段侍奉。`);
 p.careAssigned=true;p.caregiver=c?.id??null;p.history.push({turn:S.turn,person:p.caregiver,reason});
 const text=c?`${fullName(c)}${reason}赴慈宁宫侍疾，照看汤药、饮食与夜间起居；太医负责诊治，宫人轮值，不独令她熬夜。`:`${reason}由太医院与慈宁宫宫人轮值照护，暂不另派妃嫔侍疾。`;
 dowagerRecord(d,'侍疾安排',text);if(c)story(c,'【慈宁宫侍疾】'+text);log(text);return true;
}
function dowagerCareSelection(d=ensureDowager()){
 if(!dowagerIll(d))return null;
 const valid=()=>dowagerIll(d),candidates=dowagerCareCandidates();
 return {title:'慈宁宫 · 安排侍疾',por:dowagerPerson(d),valid,text:'太后近来精神不济，太医院请安排熟悉的人照料起居。病中、孕晚期、产后或小产恢复中的妃嫔先安心休养。',choices:[
  ...candidates.map(c=>({t:`请${fullName(c)}侍疾${c.clan===d.clan?' · 太后族亲':''}${d.lastYears.caregiver===c.id?' · 现任':''}`,person:c,cond:()=>dowagerCareCandidates().includes(c),f:()=>{if(!valid()||!dowagerCareCandidates().includes(c))return null;appointDowagerCaregiver(d,c);return `${fullName(c)}接下侍疾安排，宫人与太医仍轮值照料。`;}})),
  {t:'由太医与宫人轮值，暂不派妃嫔',f:()=>{if(!valid())return null;appointDowagerCaregiver(d,null);return '太医与宫人照常轮值，有变化立即来报。';}},
  {t:'保留现有安排'}]};
}
A.dowagerCare=function(){if(!modalOpen){const ev=dowagerCareSelection();if(ev)pushEv(ev);}};
function dowagerLastYearsQuestion(d,p){
 const master=daoMaster(),topic=DOWAGER_DAO_TOPICS.lifespan;
 return {title:'钦安殿 · 太后问寿',cast:[dowagerPerson(d),master],valid:()=>d.alive&&d.lastYears===p&&!p.answer,
  text:`太后由宫人陪同，到宫内钦安殿找${master.name}国师问寿。\n“${topic.question}”\n国师答：“${topic.answer}”\n她想起宫里的晚辈，说自己还有许多小事舍不得。`,onQueue:()=>{p.asked=true;p.askedAt=S.turn;dowagerRecord(d,'问寿',`赴宫内钦安殿向${master.name}国师问起寿数与晚辈，国师劝她珍重眼前，不以断言寿限惊扰余生。`);},
  choices:[{t:'陪母后坐一坐，听她说牵挂',f:()=>finish('陪她在松下坐了一会儿，听她逐一说起牵挂的家人')},{t:'陪母后回宫，约好常来用膳',f:()=>finish('陪她回慈宁宫，约好得空一同用膳')} ]};
 function finish(text){if(!d.alive||p.answer)return null;p.answer=text;d.mood=clamp((d.mood??65)+5);dowagerRecord(d,'问寿之后','皇帝'+text+'。');(S.daoCourtChronicle ||= []).push({d:dateStr(),t:`太后向${master.name}国师问寿，皇帝${text}。`});return '你没有急着劝她不必多想，只把今日的陪伴留了下来。';}
}
function dowagerIllnessNotice(d,p){
 const c=byId(p.caregiver);
 return {title:'慈宁宫 · 太后欠安',cast:[dowagerPerson(d),...(c?[c]:[])],valid:()=>dowagerIll(d)&&!p.warningAnswered,
  text:`慈宁宫来报：太后近来食少易倦，夜间也睡不安稳。太医请减少迎送，静养调护。${c?`\n已按母家亲缘，由${fullName(c)}先行侍疾，太医与宫人协助轮值。`:'\n眼下由太医与宫人轮值照护，可另择身体安好的妃嫔侍疾。'}\n太后说：“也不必人人都来，留个说得上话的，陪哀家坐一会儿就好。”`,
  onQueue:()=>{p.warned=true;p.warnedAt=S.turn;dowagerRecord(d,'身体转衰','近来食少易倦、睡眠不安，太医请静养调护，慈宁宫已将病况禀告皇帝。');},choices:[
   {t:c?`由${fullName(c)}继续侍疾`:'嘱太医院与宫人细心照护',f:()=>{if(!dowagerIll(d)||p.warningAnswered)return null;p.warningAnswered=true;return '你问清了服药与轮值安排，嘱咐有变化随时报来。';}},
   {t:'另选妃嫔侍疾',f:()=>{if(!dowagerIll(d)||p.warningAnswered)return null;p.warningAnswered=true;pushNow(dowagerCareSelection(d));return null;}}]};
}
function dowagerCareTick(){
 const d=ensureDowager(),p=dowagerLifePlan(d);if(!p)return;
 if(S.turn>=p.askTurn&&S.turn<p.deathTurn&&!p.asked)pushEv(dowagerLastYearsQuestion(d,p));
 if(!dowagerIll(d))return;
 const previous=byId(p.caregiver);
 if(!p.careAssigned||p.caregiver&&!dowagerCareCandidates().includes(previous))appointDowagerCaregiver(d,defaultDowagerCaregiver(d),p.careAssigned?'因原侍疾者须离任，改由':'依母家亲缘先行');
 if(!p.warned)pushEv(dowagerIllnessNotice(d,p));
 const c=byId(p.caregiver);if(!c||p.lastCare===S.turn)return;p.lastCare=S.turn;
 const lines=['记住太医交代的服药时辰，待药温合宜才奉到榻前','将晚膳分作几小碟，陪太后慢慢用了几口','听太后说起母家旧事，替她把散开的旧信收好','在窗边轻声读书，见太后倦了便放下书卷','陪太后望了一会儿庭中的树影，叫宫人添好软枕','夜间听见咳嗽，先唤来值守太医，再温好清水'];
 const action=lines[Math.max(0,S.turn-(p.deathTurn-6))%lines.length],words=isSolitary(c)||['淡泊','沉静'].includes(c.trait)?'她话不多，把该做的事一件件照应妥帖。':['骄矜','城府','善妒'].includes(c.trait)?'她暂把宫中的得失放下，照着医嘱细细安排。':'她轻声应着太后的话，盼老人这一夜睡得安稳。';
 const text=`${fullName(c)}在慈宁宫${action}。${words}`;story(c,'【侍疾日常】'+text);dowagerRecord(d,'病榻相伴',text);changeDowagerBond(c,2,d);
}
const careDowagerTick=dowagerTick;
dowagerTick=function(){careDowagerTick();if(dowagerCareActive())dowagerCareTick();};
const careDowagerPassing=dowagerPassingEvent;
dowagerPassingEvent=function(){if(!dowagerCareActive())return careDowagerPassing();const d=ensureDowager();if(!d?.alive)return careDowagerPassing();const p=dowagerLifePlan(d);return S.turn>=p.deathTurn?dowagerFuneralEvent(d):null;};
const careDowagerDaoTick=dowagerDaoTick;
dowagerDaoTick=function(d){if(dowagerCareActive()&&d.lastYears&&S.turn>=d.lastYears.askTurn)return;return careDowagerDaoTick(d);};
const careDowagerCompany=prepareDowagerCompany;
prepareDowagerCompany=function(d){if(!dowagerIll(d))return careDowagerCompany(d);const c=byId(d.lastYears.caregiver);return dowagerLiving(d).company={turn:S.turn,people:c&&dowagerVisitReady(c)?[c.id]:[]};};
const careDowagerEvent=dowagerEvent;
dowagerEvent=function(){const d=ensureDowager();if(!dowagerIll(d))return careDowagerEvent();const c=byId(d.lastYears.caregiver),valid=()=>dowagerIll(d);return {title:'慈宁宫 · 病榻问安',cast:[dowagerPerson(d),...(c&&dowagerVisitReady(c)?[c]:[])],valid,text:`太后倚在软枕上，精神比从前短了。${c&&dowagerVisitReady(c)?fullName(c)+'把药盏交给宫人，轻声说今日已用了些粥。':'值守宫人轻声禀报今日饮食。'}\n“皇帝来了。坐一会儿吧，听你说几句，哀家心里也踏实。”`,choices:[{t:'坐在榻边陪母后说话',f:()=>{if(!valid())return null;dowagerRecord(d,'病中问安','皇帝来榻前陪坐，说起宫中家常，没有勉强她久谈。');return '你陪她坐到倦意渐起，才替她掖好被角，轻声告退。';}},{t:'问问侍疾安排',f:()=>{pushNow(dowagerCareSelection(d));return null;}}]};};
const careBeginMourning=beginDowagerMourning;
beginDowagerMourning=function(d){const fresh=d.alive,c=dowagerCareActive()?byId(d.lastYears?.caregiver):null;careBeginMourning(d);if(!fresh||!dowagerCareActive())return;dowagerRecord(d,'慈宁宫送别',(d.lastYears?.warned?'病中由太医与宫人照护，终在慈宁宫离世。':'于慈宁宫离世，宫中举哀。')+(c?fullName(c)+'曾在榻前侍疾，留下最后一段相伴的纪事。':''));if(c){story(c,'【侍疾送别】太后离世，自己仍记得这些日子递过的药盏、听过的旧事。'+mourningReaction(c));if(c.clan!==d.clan){cchg(c,{mood:-12});setXin(c,'悲恸','曾在榻前侍疾的太后离世');}}};
const careDowagerPanel=dowagerCourtPanel;
dowagerCourtPanel=function(){const html=careDowagerPanel(),d=ensureDowager();if(!dowagerIll(d))return html;const c=byId(d.lastYears.caregiver);return html+detailSection('静养与侍疾',`<p>太后身体欠安，现由${c?parentLink(c.id):'太医院与宫人'}照护起居。</p><button class="btn jade" onclick="A.dowagerCare()">安排或更换侍疾妃嫔</button>`);};
