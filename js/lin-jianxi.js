/* Lin stays in the wind-and-literature roster. A princess keeps her own answer,
   while one active invitation on his record prevents overlapping proposals. */
const linJianxiReleased=()=>fenghuaReleased('linJianxi');
const linJianxiPerson=()=>S?.fenghua?.people?.find(p=>p.fenghuaKey==='linJianxi');
const linJianxiPrincessPresent=k=>k?.sex==='f'&&k.hp>=45&&
 (childCanVisitCourt(k)||k.estate&&canOpenPrincess(k)&&princessEstateLocal(k));
const linJianxiEligible=(k,p)=>linJianxiReleased()&&!!p?.alive&&!p.married&&
 !!k&&S.children.includes(k)&&k.sex==='f'&&k.alive&&kidAge(k)>=15&&!k.married&&!k.spouse&&!k.betrothal&&
 !k.pendingName&&!k.removedFromRoyal&&E().sur!==p.sur&&!mothersOf(k).some(m=>m.sur===p.sur);
const linJianxiNearby=(k,p)=>linJianxiEligible(k,p)&&fenghuaPresent(p)&&linJianxiPrincessPresent(k)&&!mourningActive();
const linJianxiPair=(k,p)=>!!k?.linJianxi&&p?.fenghua.matchId===k.id&&k.linJianxi.personId===p.id;
const linJianxiMeetingReady=(k,p)=>linJianxiPair(k,p)&&linJianxiNearby(k,p)&&
 ['invited','met','return'].includes(k.linJianxi.phase);
const linJianxiHearReady=(k,p)=>linJianxiNearby(k,p)&&!p.fenghua.matchId&&
 (!k.linJianxi||k.linJianxi.phase==='considering'&&S.turn>=k.linJianxi.after);

function linJianxiReconcile(){
 if(!linJianxiReleased())return;
 const p=linJianxiPerson();
 if(!p?.fenghua.matchId)return;
 const k=royalById(p.fenghua.matchId);
 if(linJianxiEligible(k,p))return;
 delete p.fenghua.matchId;
 if(k?.linJianxi?.personId===p.id&&k.linJianxi.phase!=='married')k.linJianxi.phase='closed';
}

function linJianxiHeartEvent(k,p){
 const prior=k?.linJianxi,valid=()=>linJianxiHearReady(k,p)&&k.linJianxi===prior;
 if(!valid())return null;
 const words=childDisposition(k)==='内敛'?'听说他那把扇子上只有山水。我想看看，也想听他自己说说那是什么地方。':
  '父皇说起竹径拾纸的那个人，儿臣还记得。儿臣在想，若有亲眷同席，要不要见一见林见溪。';
 function answer(phase,line,thought){
  if(!valid())return null;
  k.linJianxi={personId:p.id,phase};
  if(phase==='invited')p.fenghua.matchId=k.id;
  if(phase==='considering')k.linJianxi.after=S.turn+3;
  heartRecord(k,'想见林见溪',line,thought);
  return line;
 }
 return {title:'皇嗣心事 · 想见林见溪',por:k,valid,text:`${kidName(k)}收起手中的书，低声同你提起那位竹林贤客。\n“${words}”\n说完，她又安静了一会儿，自己想要不要请你传话。`,choices:[
  {t:'听她说完，她愿请亲友同席相见',f:()=>answer('invited','她愿在有亲眷在场时见一见林见溪，请你代为相邀。','不过是想见见他。以后的事，可以见过再说。')},
  {t:'由她再想一想',f:()=>answer('considering','她想过些时日再说。你答应先将这些话留在父女之间。','若以后想见，我会自己来问。')},
  {t:'听她说，她眼下无意见面',f:()=>answer('friends','她把书翻回方才那页，说眼下还是各自过日子就好。','父皇肯让我自己想，这就够了。')}
 ]};
}

function linJianxiSharedEvent(k,p,title,text,choices,ready=linJianxiMeetingReady){
 const state=k.linJianxi,phase=state.phase;let done=false;
 const valid=()=>!done&&k.linJianxi===state&&state.phase===phase&&ready(k,p);
 return {title:p.name+' · '+title,cast:[p,k],valid,text,choices:choices.map(({label,apply})=>({
  t:label,f:()=>{
   if(!valid())return null;
   done=true;
   const outcome=apply(state);
   fenghuaRecord(p,title,text,label,outcome,[k]);
   return outcome;
  }
 }))};
}
const LIN_JIANXI_PASTIMES={
 好奇:['岔路两图','她循着图问溪上还有几道岔路。见溪在背面添了方向，也圈出一段自己还未走过的路。她说，等去过再一同补上。'],
 内敛:['看画不催','一时无人开口，他把画转过去，让她慢慢看。她最后指给他看，自己添的其实是一小点月影。'],
 仁厚:['也替他斟一盏','见溪给席上诸人添了茶。轮到自己时壶已空了，她起身续水，把第一盏放回他面前。他怔一怔，这回先坐下喝。'],
 爽直:['当面问一声','她问他是否也有想托人搭把手的时候。他想了想，将画的另一角交给她压住，两人刚好腾得出手把图折齐。'],
 好胜:['两个好主意','两人各执一种渡溪的走法。他没让她赢，只把两条路都画了出来。她先看出自己漏了水涨时的石阶，他也划掉了自己多画的一段。'],
 灵动:['扇面换个看法','她借窗光把手影投到扇上，正像一只落在溪边的鸟。他笑了，顺手将扇挪低一点，好叫她再试一次。'],
 审慎:['说清归时','她问若遇涨水该走哪条路、何时回城。他一一说明，也请她定折返的时辰。两人写下约定，谁都不必只凭猜测等人。'],
 自矜:['这一笔由她说','席间有人道公主落笔自然样样好。见溪却认真问她为何把远山留淡。她说罢，他再看一遍，才说自己明白了。']
};
const LIN_JIANXI_SOLO=[
 ['借的是书','竹窗边晾着几册潮了的书。见溪说，邻里孩子常来借，有人不识字，便等认得字的孩子慢慢念给他听。书角卷了，他把自己的那册挪来垫在上面。',
  ['请他留下互相借阅的法子','他只记哪册书到了谁手上。识字多的、识字少的，都能在簿上画下自己的记号。'],
  ['与你一道晒完这一摞书','两人把书移到廊下避风处。他说等明日还书的人来了，让孩子们自己认那一摞。']],
 ['扇上不题名','有人愿借他的山水扇临一幅画，还想请他添一句称颂的话。见溪把扇拢在手里，声音仍轻：“各有各的景。这面扇上，我只想留山水。”',
  ['听他说这处山水从何而来','他指着扇面一角，说春水最盛时，桥影便到这里。若写得满了，倒会遮住它。'],
  ['问他可愿让人临画','他愿意给人看，也愿让人另外画，仍将自己的原扇带回竹窗边。']],
 ['风里有回声','竹林外一阵细响。见溪不急着分辨，请你先说听见了什么。过一会儿，溪声低下来，另一边叶片轻响，两人听见的原来都在。',
  ['静下来，等他也说一说','他说自己从前总在等旁人开口，今日有话，也想慢慢说完。'],
  ['留他到月上，再听片刻','他添了盏茶。月亮露出来时，你们已能从一阵响动里听出水声和竹声。']]
];
function linJianxiSoloVisit(p){
 const chapter=p.fenghua.soloChapter||0;
 if(chapter>0&&chapter<=LIN_JIANXI_SOLO.length){
  const [title,text,...answers]=LIN_JIANXI_SOLO[chapter-1];
  return fenghuaEvent(p,title,text,answers.map(([t,result])=>({t,trust:2,f:()=>{
   p.fenghua.soloChapter=chapter+1;
   return result;
  }})),{advance:false});
 }
 const advance=()=>{p.fenghua.soloChapter ||= 1;};
 return fenghuaEvent(p,'竹下清坐',
  '林见溪在竹窗下候你，桌上放着一盏仍暖的茶。他把山水扇合起，放到一旁：“风正好。若不想说话，坐一会儿也好。”',[
   {t:'问他扇上的溪水从哪里来',trust:2,f:advance,result:'他说沿溪多走半里便能听见水声，却看不见水从哪里下来。他自己也还想往上找一找。'},
   {t:'共坐片刻，听竹叶里的风',trust:1,f:advance,result:'两个人静坐到茶尽，起身时才约好下回得空再见。'}
  ],{advance:false});
}
function linJianxiVisit(p,k){
 if(!linJianxiMeetingReady(k,p))return null;
 const state=k.linJianxi;
 if(state.phase==='invited'){
  const next=(fan,result)=>s=>{s.fan=fan;s.phase='met';p.fenghua.stage=Math.max(2,p.fenghua.stage);return result;};
  const route={label:'听她问一句，何时能去认这条溪路',apply:next('route','他指了指扇角的小桥：“从这里往上便是。殿下若愿，下回我先把路画清楚。”')};
  const sketch={label:'看她收好扇上的景，回去另画一幅',apply:next('sketch','过后她果真托人送来一小幅溪山图。他收在扇匣里，留待下回请她讲最喜欢哪一笔。')};
  return linJianxiSharedEvent(k,p,'扇上山水',
   '亲眷同席，林见溪放下茶盏，展开那柄没有题字的山水扇。公主问画的是何处。他轻声答：“城外常走的溪路。若由殿下来画，想往哪里添一笔？”',
   childDisposition(k)==='内敛'?[sketch,route]:[route,sketch]);
 }
 if(state.phase==='met'){
  const recalled=state.fan==='route'?'照着上回的话，他带来画清了岔路的小图。公主一眼认出扇角的小桥。':
   '他从扇匣取出那幅小画，指着溪边的一点淡墨，请公主讲讲画的是什么。';
  const next=(reply,result)=>s=>{s.reply=reply;s.phase='return';p.fenghua.stage=3;return result;};
  return linJianxiSharedEvent(k,p,'等她答完',recalled+
   '\n席间有人问公主近来在读什么。她一时没出声，他怕她为难，便轻声把话岔开。散席后，公主叫住了他。',[
    {label:'让她告诉他，方才是想好了再答',apply:next('wait','他停了一停，向她道歉：“原来殿下还有话。我记下了，下回且等你说完。”')},
    {label:'听她说，方才确实想避开话头',apply:next('help','她谢他解围，又说自己有时只是答得慢。两人约好，要他接话时，她会先看他一眼。')}
   ]);
 }
 const recalled=state.reply==='wait'?'席间又有人问起近来所读。他把茶盏轻轻搁下，等到公主自己答完，才问她最喜欢书里哪一段。':
  '席间有人翻开书问公主的看法。他先等了一等，等到她朝这边望过来，才顺着她方才说过的话替她接了一句。';
 const [memory,pastime]=LIN_JIANXI_PASTIMES[childDisposition(k)];
 return linJianxiSharedEvent(k,p,'等她答完 · 回约',recalled+'\n'+pastime+
  '\n人散后，公主说起彼此曾看过的山水，想托人问问他的心意。你可以替她传话。',[
   {label:'依她的心意递话',apply:s=>{
    s.phase='proposal';s.after=S.turn;s.sharedMemory=memory;
    return '林见溪听罢，亲自回话：“我也愿意。若殿下还肯听，我想按礼来求这一门亲。”他的回话留待公主亲自答复。';
   }},
   {label:'听她说，往后仍愿做知交',apply:s=>{
    s.phase='friends';delete p.fenghua.matchId;
    return '她托人说清心意。林见溪把话听完，只道：“哪日想看溪水，仍可来寻我。”';
   }}
  ]);
}

function linJianxiProposalReady(k,p=linJianxiPerson()){
 return linJianxiPair(k,p)&&linJianxiNearby(k,p)&&k.linJianxi.phase==='proposal'&&
 S.turn>=k.linJianxi.after&&marriageReady(k);
}
function linJianxiProposalEvent(k,p=linJianxiPerson()){
 if(!linJianxiProposalReady(k,p))return null;
 return linJianxiSharedEvent(k,p,'山水有约',
  `林见溪把求亲书帖放在案上，留出一段空处给她搁回信。${k.linJianxi.sharedMemory?`帖下还夹着一页小记，题作《${k.linJianxi.sharedMemory}》，写的是两人同席那日的一件小事。`:''}他说得很轻：“从前总约殿下下回来看溪水。若你愿意，往后得闲，我想都来问你一句，要不要一道走。”他停下来，等她答复。`,[
   {label:'公主应允，准两人依礼成婚',apply:s=>{
    const spouse={id:p.id,personId:p.id,name:p.name,sur:p.sur,sex:'m',seed:p.seed,
     fenghuaKey:p.fenghuaKey,portraitOverride:p.portraitOverride,born:p.fenghua.born,alive:true,
     route:'scholar',background:'竹林贤客',marriageNature:{temperament:'温厚',hobby:'books',spending:'节俭',space:'需要独处'}};
    settlePrincessMarriage(k,spouse,'scholar','竹林贤客，两情相悦');
    p.married=true;p.royalSpouseId=k.id;s.phase='married';delete p.fenghua.matchId;
    return '公主亲口应下了。按两人的意思依礼成婚，平日留京。林见溪将她的回笺折好，与旧日的山水扇一处收了。';
   }},
   {label:'由她再想三个月',apply:s=>{
    s.after=S.turn+3;
    return '他把书帖留下，说那便等她愿意回信时再谈。';
   }},
   {label:'公主婉辞求亲，仍以知交相待',apply:s=>{
    s.phase='friends';delete p.fenghua.matchId;
    return '她亲口说了自己的打算。他听完，拱手回了一礼。往后若在溪边遇上，仍可一道坐坐。';
   }}
  ],linJianxiProposalReady);
}

function linJianxiCouplePresent(k,p){
 return linJianxiReleased()&&fenghuaPresent(p)&&!!k&&p.royalSpouseId===k.id&&
 k.spouse?.id===p.id&&k.linJianxi?.phase==='married'&&
 householdActive(k)&&!!k.estate&&linJianxiPrincessPresent(k)&&!mourningActive();
}
function linJianxiWalkReady(k,p){
 return linJianxiCouplePresent(k,p)&&!k.linJianxi.walked&&S.turn-k.spouse.marriedAt>=3;
}
function linJianxiWalkEvent(k,p){
 if(!linJianxiWalkReady(k,p))return null;
 const walk=(place,outcome)=>s=>{s.walked=place;s.lastFamily=S.turn;return outcome;};
 return linJianxiSharedEvent(k,p,'溪桥家常',
  '公主府送来一则家常。林见溪把那柄山水扇带到府门，问她想走到哪一段。晨间下过雨，溪桥还微微湿着。',[
   {label:'公主说，走过小桥，再往上看看',apply:walk('bridge','他在湿石边站定，等她走稳，两个人一道去找扇上画不到的那一段溪水。')},
   {label:'公主说，就在桥这边坐一会儿',apply:walk('bank','他把带来的茶倒进两只小盏，和她坐在竹荫里。待她说要回去，才把扇子收了。')}
  ],linJianxiWalkReady);
}

function linJianxiHomeChapter(k,p){
 if(!linJianxiCouplePresent(k,p))return '';
 const s=k.linJianxi,past=k.spouse.marriedAt;
 if(!s.walked||S.turn-(s.lastFamily??past)<3)return '';
 if(!s.lamp)return 'lamp';
 if(!s.bamboo&&S.turn-past>=12)return 'bamboo';
 if(s.bamboo&&!s.childStory&&S.turn-past>=12&&linJianxiChild(k))return 'child';
 return '';
}
function linJianxiChild(k){
 return k.household?.children?.find(child=>child.alive!==false&&!child.away&&child.mother===k.id&&child.father===k.spouse.id&&child.born<=S.turn-48);
}
function linJianxiHomeEvent(k,p){
 const chapter=linJianxiHomeChapter(k,p);
 if(!chapter)return null;
 const ready=(bride,groom)=>linJianxiHomeChapter(bride,groom)===chapter;
 const decide=(key,value,result)=>s=>{s[key]=value;s.lastFamily=S.turn;return result;};
 if(chapter==='lamp')return linJianxiSharedEvent(k,p,'竹门有灯',
  '公主忙完府里的事，回房已迟。见溪本想问她是不是遇见了麻烦，见她在门边站定，便只把灯挪亮一点：“要坐下来讲给我听，还是先歇一歇？都好。”',[
   {label:'她坐下来，说说今日的难处',apply:decide('lamp','talk','他先听完，才问哪一桩明日可以交给他料理。她说了一件，他便只记那一件。')},
   {label:'她愿意并肩坐一会儿',apply:decide('lamp','quiet','他把未读完的书往案里推了推。两人隔着一盏灯坐了许久，谁也不急着开口。')}
  ],ready);
 if(chapter==='bamboo')return linJianxiSharedEvent(k,p,'竹径归来',
  `两人又到城外。她还记得旧日${k.linJianxi.walked==='bridge'?'携手走过湿桥':'在桥边竹荫下喝茶'}的情形。这回见溪的脚步慢了些。她问起缘由，他才坦白昨日走了远路，今日其实想在近处歇歇。${k.linJianxi.lamp==='quiet'?'她指了指近处的石阶，问是否也能像灯下那样静坐一会儿。':'她把伞斜过来，请他慢慢说这一趟想怎样走。'}`,[
   {label:'由他来选今天的路',apply:decide('bamboo','rest','他选了离水最近的一段石阶。她坐下后，先给他斟茶。日光落满溪面，两人这才说起下回的约。')},
   {label:'商量好折返的时辰，徐徐走一段',apply:decide('bamboo','path','两人约好走过一处竹影就折返。见溪头一回先开口说自己走累了，她便挽住他，也说这一段已足够。')}
  ],ready);
 const child=linJianxiChild(k);
 return linJianxiSharedEvent(k,p,'小儿问水',
  '小儿伏在案边看那柄山水扇，指着溪上淡淡一笔问水从哪里来。见溪先问孩子，自己猜是哪一处，再把同一个问题递给公主。',[
   {label:'让孩子自己沿着扇面找找',apply:decide('childStory',true,'孩子慢慢顺着淡墨找到扇边。见溪笑着说，等天气晴好，就一起去听那里的水声。')},
   {label:'三人各说一个答案',apply:decide('childStory',true,'公主说小桥，孩子说远山，见溪指着画外留白说自己还想找找。后来孩子又问了第二回，三人仍在这盏灯下答他。')}
  ],(bride,groom)=>ready(bride,groom)&&linJianxiChild(bride)===child);
}
function linJianxiFriendReady(k,p){
 const s=k?.linJianxi;
 return s?.phase==='friends'&&s.personId===p?.id&&s.fan&&!s.friendNote&&
  fenghuaPresent(p)&&linJianxiPrincessPresent(k)&&!mourningActive()&&S.turn-p.fenghua.lastVisit>=3;
}
function linJianxiFriendEvent(k,p){
 if(!linJianxiFriendReady(k,p))return null;
 return linJianxiSharedEvent(k,p,'旧图知音',
  '她托人在上回说过的溪山图旁补了一笔，又将画送来给林见溪看。他回了一张小笺，认真说起自己最喜欢那处溪水，也问家中近来可好。',[
   {label:'由她回信说说近来所画',apply:s=>{s.friendNote=true;return '她回了一封简短的家常信。旧画上添的是一树新叶，彼此说起近况也仍像从前那样自在。';}}
  ],linJianxiFriendReady);
}
A.linJianxiHeart=function(id){if(!modalOpen)pushEv(linJianxiHeartEvent(kidById(id),linJianxiPerson()));};
A.linJianxiVisit=id=>openFenghuaVisit(linJianxiPerson(),p=>linJianxiVisit(p,kidById(id)));
A.linJianxiProposal=function(id){if(!modalOpen)pushEv(linJianxiProposalEvent(kidById(id)));};
A.linJianxiFriend=function(id){
 if(!modalOpen)pushEv(linJianxiFriendEvent(kidById(id),linJianxiPerson()));
};
A.linJianxiHome=function(id){
 if(!modalOpen&&linJianxiReleased())pushEv(linJianxiHomeEvent(princessById(id),linJianxiPerson()));
};
A.linJianxiWalk=function(id){
 if(!modalOpen&&linJianxiReleased())pushEv(linJianxiWalkEvent(princessById(id),linJianxiPerson()));
};

function linJianxiHeartPanel(k,p){
 if(!linJianxiReleased()||!k||!p||S.over)return '';
 const id=royalActionArg(k.id);
 if(linJianxiHearReady(k,p))return `<button class="btn jade" onclick="A.linJianxiHeart(${id})">听她说起林见溪</button>`;
 if(linJianxiFriendReady(k,p))return `<button class="btn jade" onclick="A.linJianxiFriend(${id})">读林见溪的画笺</button>`;
 if(!linJianxiPair(k,p))return '';
 if(linJianxiMeetingReady(k,p)){
  const label={invited:'安排亲友同席',met:'安排再见林见溪',return:'依约再见林见溪'}[k.linJianxi.phase];
  return `<button class="btn jade" onclick="A.linJianxiVisit(${id})" ${fenghuaVisitReady(p)?'':'disabled'}>${label} · 精力 −1</button>`;
 }
 if(linJianxiProposalReady(k,p))return `<button class="btn jade" onclick="A.linJianxiProposal(${id})">听林见溪的求亲回话</button>`;
 if(!linJianxiNearby(k,p))return '<p class="hint">待两人方便相见，再续与林见溪的约。</p>';
 return '<p class="hint">求亲书帖已收下，待公主想好了再答。</p>';
}
function linJianxiProfilePanel(p){
 const k=p.royalSpouseId?royalById(p.royalSpouseId):kidById(p.fenghua.matchId);
 if(!k)return '';
 if(p.royalSpouseId)return detailSection('婚配',`<p>与${esc(kidName(k))}成婚。</p>${chroniclePersonLink(k)}`);
 return detailSection('相见与心意',linJianxiHeartPanel(k,p));
}
const linJianxiYouthPanel=youthPanel;
youthPanel=k=>linJianxiYouthPanel(k)+linJianxiHeartPanel(k,linJianxiReleased()?linJianxiPerson():null);
const linJianxiHouseholdPanel=householdPanel;
householdPanel=function(k){
 const html=linJianxiHouseholdPanel(k);
 if(!linJianxiReleased()||UI.view!=='princessEstate')return html;
 const p=linJianxiPerson(),chapter=linJianxiHomeChapter(k,p);
 const title={lamp:'竹门有灯',bamboo:'竹径归来',child:'小儿问水'}[chapter];
 if(title)return html+detailSection('家常',`<button class="btn jade" onclick="A.linJianxiHome(${royalActionArg(k.id)})">听听${title}</button>`);
 if(!linJianxiWalkReady(k,p))return html;
 return html+detailSection('家常',`<button class="btn jade" onclick="A.linJianxiWalk(${royalActionArg(k.id)})">听听溪桥家常</button>`);
};
const linJianxiMarriageChanges=marriageBondConsequences;
marriageBondConsequences=function(previous){
 linJianxiMarriageChanges(previous);
 linJianxiReconcile();
};
