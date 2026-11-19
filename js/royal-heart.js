/* Private hopes belong to a person and a season of life, not to every unmarried girl alike. */
const royalHeartActive=()=>!!S&&!S.over&&journalContentVersion()>=20;
const xieStoryUpdated=()=>journalContentVersion()>=58;
const heartStage=k=>kidAge(k)<16?'early':kidAge(k)<20?'young':'adult';
const heartSingleChild=k=>royalHeartActive()&&S.children.includes(k)&&kidAge(k)>=(k.outerRegisterId?18:12)&&!k.pendingName&&!k.married&&!k.spouse&&!k.betrothal&&k.hp>=45;
const heartReady=k=>heartSingleChild(k)&&childCanVisitCourt(k);
const xieCapitalEstate=k=>journalContentVersion()>=53&&!!k?.estate&&k.sex==='f'&&k.estate.route!=='frontier'&&k.princessMarriage!=='frontier';
const xieCanMeetPrincess=k=>childCanVisitCourt(k)||(xieCapitalEstate(k)&&canOpenPrincess(k)&&!k.away);
const xieHeartReady=k=>heartSingleChild(k)&&k.sex==='f'&&xieCanMeetPrincess(k);
const HEART_WORDS={
 好奇:{early:['书里只写他们相逢，却没写后来怎样过日子。喜欢一个人，是不是也会有许多不知道的事？','若两个人总有不同的想法，还能成为最亲近的人吗？'],young:['若有一天喜欢了谁，我想先听听那个人怎样看世界，不只看别人夸了些什么。','诗里的相逢总像命中注定。可真正相处，是不是还要一件一件地认识？'],adult:['从前总想知道谁会来，如今更想知道，两个人能否容得下彼此改变。','婚事可以慢一点。我还想看看天下，也想知道自己究竟适合怎样的日子。']},
 好胜:{early:['若有个人骑射胜过我，我大概会不服气……可也会想再见一回，再比一场。','我想以后有人夸我，是因为我做得好，不是因为不得不夸。'],young:['我盼那个人能与我并肩，而不是事事让着我。可若总在较劲，会不会把人推远？','有时见别人被人放在心上，我也会羡慕。只是这件事，似乎不能靠赢一场来得到。'],adult:['我不想把成婚的早晚也当成输赢。能一道做事、也容得下我失败的人，才值得等。','本领和体面我自己挣。婚事若只为了让旁人说一句般配，未免太累。']},
 仁厚:{early:['故事里那个人先替陌生人遮了雨，我就觉得很好。待旁人温柔的人，会不会也肯听我说话？','若我喜欢的人不喜欢我，是不是也不该叫那个人为难？'],young:['我想与一个肯体谅旁人的人相处，也怕只顾照顾别人，忘了自己会难过。','喜欢一个人，若只盼他过得好，又舍不得不见他，该怎么办呢？'],adult:['我愿意照顾伴侣，可也盼自己的辛苦有人看见。只说贤惠懂事，还不够过一生。','若那个人无意，我愿放手。只是别劝我立刻高兴，难过也需要些日子。']},
 内敛:{early:['我把书里的那一页折起来了……也没有什么，只是觉得有人能懂那些没说出口的话，很好。','是不是不爱说话的人，也会被人认真记住？'],young:['我写了半张笺，最后还是收起来。若将来有个人肯等我把话说完，大概就很好。','我怕被笑话，更怕心里的那个人只存在于自己的想象。父皇会替我守着这几句话吗？'],adult:['这些年不是没有动过心，只是有些话错过了时候。如今我愿慢慢说，也愿别人慢慢听。','催婚时我不作声，并不是随谁都好。我想要的是安静相伴，不是被替我作答。']},
 爽直:{early:['若我欣赏谁，直说会不会不好？明明只是觉得那个人好，为什么人人都要笑？','我不喜欢故事里总叫人猜心思。想见就说想见，不愿意也该说清楚。'],young:['我愿自己说喜欢，也能听一句不愿意。只求不要拿身份逼人点头。','若将来有争执，我宁可好好吵明白，也不愿两个人各自猜上一年。'],adult:['没有成婚，不等于我过得不好。若遇见合适的人，我自会认真；眼下不想将就。','我也会寂寞，只是不愿因为怕寂寞，便许给一个不相知的人。']},
 灵动:{early:['若以后有个知己，能一起看灯、猜谜，连下雨也有新玩法，那就好了。','话本里每次都在花灯下相逢。倘若撞见时我正一身泥，那个人还会想认识我吗？'],young:['我想一起去看很多地方。可也想知道，热闹散了以后，两个人还能说些什么。','大家都爱听风流才子的故事。我也觉得好听，可故事里的人真会和传闻一样吗？'],adult:['从前以为相爱就是天天新鲜，如今觉得，平常的一天也愿一起过，才难得。','我还爱热闹，也学会自己出门看灯。有人同行很好，没有也不必把日子搁下。']},
 审慎:{early:['若以后要与一个人相处很久，是不是该先知道那个人会不会守约？','故事里的誓言说得那么快，真的都记得住吗？'],young:['我想先看那个人怎样待家人、怎样处理小事。只听一首诗，似乎还看不清。','我怕想得太多错过，也怕只凭一时欢喜便答应。能不能容我多认识一些？'],adult:['我不是把婚事当账本，只是家用、住处、彼此的志向，都该在定下之前谈清楚。','这些年见过几门亲事，我更知道自己不能接受什么。慎重不等于拒绝所有人。']},
 自矜:{early:['我希望有人喜欢的是我写的字、说的话，不是我的封号。可是怎样才分得清呢？','若有个知己，能指出我的诗哪里不好，又记得我改过的地方，就很好。'],young:['我也想被人珍重，却不肯拿身份换一句喜欢。那样得来的赞美，听着太空。','若那个人不愿意，我会难堪。可难堪归难堪，也不能逼出真心来。'],adult:['我不肯因年岁渐长便轻看自己，也不愿以出身压人。相知若来，彼此都该站得直。','曾经以为被拒绝便是失了体面。如今知道，能把那份心意收好，也是一种体面。']}
};
function heartState(){return S.royalHeart?.gen===S.gen?S.royalHeart:null;}
function heartTopic(k){
 const stage=heartStage(k),key=childDisposition(k),seen=k.heartHopes?.seen||[];
 const options=HEART_WORDS[key][stage].map((quote,i)=>({key:`${stage}:${key}:${i}`,quote,stage})).filter(x=>!seen.includes(x.key));
 return options.length?pick(options):null;
}
function heartRecord(k,title,text,thought,emotion=.4){
 kstory(k,`【${title}】${text} 心中所想：${thought}`);
 NPCMemory.record(S,{type:'royal-heart',time:S.turn,location:xieCapitalEstate(k)?'公主府':'宫中',participants:[k.id],object:title},[{person:k.id,subject:E().id,interpretation:thought,emotion,impact:65}]);
}
function heartPendingValid(d=heartState()?.pending){
 const k=d&&kidById(d.child);return !!(d&&(d.kind==='xiean'?xieAdmirerReady(k):heartReady(k))&&heartStage(k)===d.stage);
}
function heartEvent(k,d=heartState()?.pending){
 if(!d||d.child!==k?.id||!heartPendingValid(d))return null;
 if(d.kind==='xiean')return xieAdmirationEvent(k,d);
 let done=false;const valid=()=>!done&&heartState()?.pending===d&&heartPendingValid(d);
 const grown=d.stage==='adult',title=grown?'未定的归处':d.stage==='early'?'书页间的憧憬':'渐明的心事';
 const note=grown?(kidAge(k)>=30?'年岁渐长，旁人的催促更直白了。':'过了二十，婚事的议论渐多，自己的想法却未必与少年时相同。'):'这不是一门待定的亲事，只是孩子愿意说出的心事。';
 const past=grown&&k.xieAdmiration?`\n${k.xieAdmiration.outcome==='forced'?'':k.xieAdmiration.outcome==='declined'?'提起谢安时，仍有一瞬失落，却不再把他的诗当成对自己的许诺。':'旧日读过谢安的诗，如今回想，也想分清欣赏与相知。'}`:'';
 const settle=mode=>{
  if(!valid())return null;done=true;delete heartState().pending;
  const response={listen:'父皇听完，答应婚事会听本人的想法，不急着替这份心事下结论。',discern:'父皇陪着分辨欣赏与相处，提醒不要只凭门第、容貌或一时声名判断一个人。',dismiss:'父皇打断话头，说这些事不必再提。'}[mode];
  const thought=mode==='dismiss'?'原来这些话不能在这里说，下一回还是先收在心里。':mode==='listen'?'自己的心事被认真听见了，尚未决定，也可以慢慢想。':'一时心动不必羞耻，真正相处却还要了解一个人。';
  k.heartHopes ||= {seen:[]};k.heartHopes.seen.push(d.topic.key);k.heartHopes.last={turn:S.turn,stage:d.stage,quote:d.topic.quote,mode,thought};k.lastHeart=S.turn;k.love=clamp(k.love+(mode==='dismiss'?-5:4));
  heartRecord(k,title,`${kidName(k)}说：“${d.topic.quote}”${response}`,thought,mode==='dismiss'?-.6:.5);return response;
 };
 return chronicleEvent({title,por:k,present:[k],valid,text:`${kidName(k)}，${kidAge(k)}岁，性情${childDisposition(k)}。${note}\n“${d.topic.quote}”${past}`,choices:[
  {t:'听完心事，让婚事慢慢想',f:()=>settle('listen')},{t:'陪着谈谈心动与相处的分别',f:()=>settle('discern')},{t:'打断，不许再谈',f:()=>settle('dismiss')} ]});
}
function royalHeartTick(){
 if(!royalHeartActive())return;
 if(!heartState())S.royalHeart={gen:S.gen,lastTick:-1,lastEvent:-99};
 const state=heartState();if(state.lastTick===S.turn)return;state.lastTick=S.turn;
 if(state.pending&&!heartPendingValid())delete state.pending;
 xieLifeTick();
 if(state.pending||mourningActive()||S.turn-state.lastEvent<4)return;
 const people=S.children.filter(k=>S.turn-(k.lastHeart??-99)>=10&&(heartReady(k)||!k.xieAdmiration&&xieAdmirerReady(k)));
 if(journalContentVersion()>=130){
  const princess=people.find(k=>!k.xieAdmiration&&xieAdmirerReady(k)&&xieCanPursue(k));
  if(princess&&chance(.09)){
   state.pending={kind:'xiean',child:princess.id,stage:heartStage(princess),topic:null,turn:S.turn};
   state.lastEvent=S.turn;return;
  }
 }
 if(!people.length||!chance(.28))return;
 const k=pick(people),xie=xieAdmirerReady(k)&&!k.xieAdmiration&&chance({好奇:.55,好胜:.25,仁厚:.35,内敛:.5,爽直:.35,灵动:.65,审慎:.18,自矜:.4}[childDisposition(k)]);
 const topic=xie||!heartReady(k)?null:heartTopic(k);if(!xie&&!topic)return;
 state.pending={kind:xie?'xiean':'hope',child:k.id,stage:heartStage(k),topic,turn:S.turn};state.lastEvent=S.turn;
}
function duePrincessHeartEvent(){
 if(journalContentVersion()<130||mourningActive())return null;
 const d=heartState()?.pending;
 if(!d)return null;
 // A long-waiting ordinary conversation occupies the same slot as the first poetry scene.
 if(d.kind!=='xiean'&&(S.turn-d.turn<6||!S.children.some(k=>!k.xieAdmiration&&xieAdmirerReady(k)&&xieCanPursue(k))))return null;
 return heartEvent(kidById(d.child),d);
}
const heartChildTick=childLifeTick;
childLifeTick=function(){heartChildTick();royalHeartTick();};
const heartYouthEvent=youthEvent;
youthEvent=function(){if(royalHeartActive()&&heartPendingValid())return heartEvent(kidById(heartState().pending.child));return heartYouthEvent();};
// Old pending transcripts keep their exact candidates and random draws.
const heartGuestReady=youngGuestEligible;
youngGuestEligible=function(k,g){return (!royalHeartActive()||!k?.betrothal&&!k?.spouse)&&heartGuestReady(k,g);};
A.royalHeart=function(id){const k=kidById(id);if(!modalOpen)pushEv(heartEvent(k));};
const heartYouthPanel=youthPanel;
youthPanel=function(k){
 const html=heartYouthPanel(k);if(!royalHeartActive())return html;
 const pending=heartPendingValid()&&heartState().pending.child===k.id&&(!xieSharedCourtshipActive()||heartState().pending.kind!=='xiean');
 const last=k.heartHopes?.last,x=k.xieAdmiration;
 return html+(pending?`<p>有几句关于将来的心事，还想与你说。</p><button class="btn jade" onclick="A.royalHeart(${k.id})">听听${kidAge(k)<20?'年少心事':'如今的婚事想法'}</button>`:'')+
  (last?`<p class="hint">曾谈起：“${esc(last.quote)}”</p>`:'')+(x?`<p>曾读谢安的诗 · ${esc({admired:'尚未议婚',declined:'心意未成',forced:'后来奉旨成婚',mutual:'后来两心相许'}[x.outcome]||'少年时的欣赏')}</p>`:'');
};
const heartVoicePool=childVoicePool;
childVoicePool=function(k){
 const pool=heartVoicePool(k);if(!heartReady(k)||k.love<25||mothersOf(k).some(m=>!m.alive||m.cold||m.gone))return pool;
 const last=k.heartHopes?.last;
 if(last&&last.stage===heartStage(k)&&S.turn-last.turn<=8)pool.push(voiceLine('royal-heart-memory','想起上回说到的心事。',last.thought));
 return pool;
};

/* 谢安是架空剧情人物；同名与东山高卧的文学意象，不等于复刻东晋生平。 */
const XIE_DEBUT_AGE=21;
function xieAwaitsFirstReading(p){
 const life=p.xiean;
 if(life.readingStarted!==undefined)return !life.readingStarted;
 // Earlier saves only recorded the daughter's reading and the subsequent relationship.
 return !(p.married||p.spouse||p.betrothal||life.pursuerId!=null||life.path||life.engagement||life.marriage||life.widowed||
  royalHouseholds().some(k=>k.xieAdmiration?.personId===p.id));
}
function startXieReadingAge(p){
 if((PalaceActions.xiePoetryAge||PalaceActions.xiePoetryAnswer)&&xieAwaitsFirstReading(p)){
  p.age=XIE_DEBUT_AGE;p.ageTrackedAt=S.turn;p.xiean.readingStarted=true;
 }
}
const xieAn=()=>scholarList().find(p=>p.storyPerson==='xiean');
const xiePresent=p=>royalHeartActive()&&!!p&&officialAlive(p)&&!p.exiled&&!p.dismissed&&!p.commission&&!p.incognitoCase&&!p.away;
function createXieAn(){
 if(!royalHeartActive())return null;if(xieAn())return xieAn();
 const roots=officialEntries().filter(e=>e.role==='father'&&officialAlive(e.p)&&e.p.age>=50&&familyIsNoble(e.c)),root=roots.length&&chance(.35)?pick(roots):null;
 const house={id:root?'capital-'+root.p.id:`capital-xie-${S.gen}-${S.nid}`,name:root?`${root.c.sur}氏${root.h.title||'世家'}`:pick(['乌衣谢氏','临川谢氏','会稽谢氏']),seat:'上京',
  relation:root?(root.c.sur==='谢'?'谱载同宗旁支':'谱载母族外亲'):'本家子弟',rootKey:root?.key,rootId:root?.p.id};
 (S.capitalHouses ||= []).push(house);
 const age=journalContentVersion()>=53?XIE_DEBUT_AGE:22;
 const p=makeScholar();Object.assign(p,{name:'谢安',sur:'谢',age,ageTrackedAt:S.turn,origin:house.name,registrySource:'story',storyPerson:'xiean',siblingsChecked:true,
  temperament:'疏朗自持',ability:92,merit:0,trust:40,career:'commoner',office:'布衣诗客',post:'布衣诗客',essay:'以诗名动上京，不应仕进',education:null,artPortrait:433,
  xiean:{...(PalaceActions.xiePoetryAge?{readingStarted:false}:{}),houseId:house.id,met:S.turn,lastNews:S.turn,newsIndex:0,noConcubines:true,noRemarriage:true},willing:false});
 (S.scholars ||= []).push(p);
 scholarRecord(p,`【京华初闻】${house.name}的${house.relation}谢安，${PalaceActions.xiePoetryAge?'年少时便以诗名动上京':(age===21?'二十一':'二十二')+'岁，以诗名动上京'}。${root?`家谱与${root.p.name}一房已有记载，非凭同姓攀附。`:'这一房独立登记，并非哪位妃嫔的父兄。'}他不愿以诗名求官，尚未婚配。`);
 return p;
}
const xieHouse=p=>(S.capitalHouses||[]).find(h=>h.id===p?.xiean?.houseId);
function xieHouseHTML(p){
 const h=xieHouse(p),root=h?.rootKey&&courtPerson(h.rootKey);
 return `<p>${esc(h?.name||p.origin)} · ${esc(h?.relation||'')} · 上京</p>${root?`<p>谱系所系：${careerLink(root)}${officialAlive(root.p)?'':' · 已故'}。${esc(h.relation)}，不是亲兄弟。</p>`:'<p class="hint">独立登记的京中世家，宫中不必有该房妃嫔。</p>'}`;
}
function xieRumorEvent(p){
 if(!xiePresent(p))return null;
 const married=p.married,news=p.xiean.engagement?'书肆里已传开他与公主订婚的消息。婚期尚未到，二人仍各居原处；他照旧写诗，也认真守着婚约的分寸。':p.xiean.widowed?'有人提议替丧妻的他再说一门亲事。他温和谢绝，仍将亡妻留下的书笺收在身边。':married?'近来诗会上少见他久坐，有人听见他辞席时说家中还有人等。':pick([
  '书肆掌柜说，他在曲水诗会上写了一首春江诗，满座停杯。几位姑娘借买诗笺又问一遍作者是谁。',
  '茶客说有人愿替他引荐官职，他却笑称自己不过“酒囊饭袋”，只肯拿新诗换一壶酒。',
  '有人说曾见他与佩剑的江湖客同舟，也有人反驳不过是旧友。说话的人都拿不出实据。']);
 scholarRecord(p,`【市井声名】${news}`,false);
 return {title:'上京风流 · 谢安',por:p,valid:()=>xiePresent(p),text:`你微服来到书肆，听见人们提起${xieHouse(p)?.name||p.origin}的谢安。\n${news}\n声名是真的传开了，流言却还不能当作他的身世实据。`,choices:[
  {t:'记下名字，回宫后单独召见',f:()=>{if(!xiePresent(p))return null;pushNow(xieAudienceEvent(p,false));return null;}},
  {t:'留一卷诗，继续听市井议论',f:()=>{if(!xiePresent(p))return null;log('微服听见谢安诗名与江湖传言，未凭传言定论。');return '你收下公开刊行的诗集，没有把酒楼中的话写成查实的案情。';}}]};
}
const heartOut=A.out;
A.out=function(kind){
 if(kind==='city'&&royalHeartActive()&&!modalOpen&&E().energy>0&&!mourningActive()&&S.turn-(S.flags.xieCityAttempt??-99)>=4){
  S.flags.xieCityAttempt=S.turn;const p=xieAn();
  if((!p||xiePresent(p))&&chance(p?.28:.12)){if(!useE())return;setScene('city');pushEv(xieRumorEvent(p||createXieAn()));return;}
 }
 return heartOut(kind);
};
function xieAudienceEvent(p,charge=true){
 if(!xiePresent(p)||S.turn-(p.lastAudience??-99)<3)return null;
 let done=false;const valid=()=>!done&&xiePresent(p),finish=(mode)=>{
  if(!valid()||charge&&!useE())return null;done=true;p.lastAudience=S.turn;
  const text={poem:'谢安谈到新作，将诗里一个过于工巧的字划掉：“诗若只为博人一声惊叹，便少了自己的心。”谈到寻常渔火，他反倒说得认真。',
   office:`陛下拟授翰林院编修，谢安敛袖辞谢：“${xieStoryUpdated()?'陛下抬举。谢安写得几首诗，却':'草民不过酒囊饭袋，'}承不起公牍里的民生。诗名不该冒领官声。”他没有受职，官籍仍记布衣。`,
   insist:'陛下再以翰林院编修相授。谢安郑重辞谢，不肯因帝王青眼便把不愿承担的职事接下。诏拟未成，仍未实授。',
   river:'谢安承认结识几位行路与习剑的朋友，也常听他们谈渡口、人情和远山：“朋友不必都在朱门里。”他未承认任何门派身份，传闻仍无定论。'}[mode];
  if(mode==='office'||mode==='insist')p.xiean.refusedOffice={turn:S.turn,title:'翰林院编修'};
  scholarRecord(p,`【单独召见】${text}`);return text;
 };
 const greeting=xieStoryUpdated()?'“陛下过誉，谢安愧不敢当。若只问诗，愿知无不言。仕进一事，还请陛下见谅。”':'“草民不敢当惊才绝艳四字。若只问诗，愿知无不言；仕进之事，还请容草民辞谢。”';
 return chronicleEvent({title:'召见 · 谢安',por:p,present:[p],valid,text:`${p.name}入殿，行礼周全，却不以见到帝王为可夸耀的事。\n${p.married?'谈到家中，他会认真答复；官位的邀请仍无意接受。':greeting}`,choices:[
  {t:'与他论诗'+(charge?' · 精力−1':''),f:()=>finish('poem')},{t:'拟授翰林院编修，听其答复'+(charge?' · 精力−1':''),f:()=>finish('office')},
  ...(p.xiean.refusedOffice?[{t:'再劝他受职'+(charge?' · 精力−1':''),f:()=>finish('insist')}]:[]),
  {t:'问起江湖来往'+(charge?' · 精力−1':''),f:()=>finish('river')},{t:'改日再谈'}]});
}
A.xieAudience=function(){if(!modalOpen)pushEv(xieAudienceEvent(xieAn()));};
function xieAdmirerReady(k){
 const p=xieAn(),h=xieHouse(p);return heartReady(k)&&k.sex==='f'&&kidAge(k)<20&&xiePresent(p)&&!p.married&&!p.spouse&&!p.royalSpouseId&&!p.betrothal&&!p.xiean.widowed&&p.age<=35&&Math.abs(p.age-kidAge(k))<=8&&
  !mothersOf(k).some(m=>houseOf(m)?.father.id===h?.rootId)&&E().sur!=='谢';
}
function xieAdmirationEvent(k,d){
 const p=xieAn();if(!xieAdmirerReady(k)||heartState()?.pending!==d)return null;
 const adult=kidAge(k)>=(xieRomanceActive()?15:18),discuss=xieRomanceActive()||adult,style=childDisposition(k),lines={
  好奇:'他诗里写的山河，真是亲眼见过的吗？我想知道传闻之外，他究竟是怎样的人。',好胜:'人人都夸他的诗。我先是不服，读了又读，倒想听他看看我的文章。',仁厚:'我喜欢的倒不只那首诗。听说他会替落魄的书生留一碗热饭，不知是不是真的。',
  内敛:'这首诗我已读过许多遍……我没有见过他，只是读到那一句，觉得心里有人轻轻应了一声。',爽直:'他的诗我喜欢，人还没有见过。若真有机会，我想当面听听，别总靠旁人猜。',灵动:'若能听他讲一次江上的故事，一定很有趣！我连该问什么都想好了。',审慎:'大家都说他好，可我不愿只凭传闻动心。能不能先知道他怎样待人？',自矜:'我原不爱凑诗坛的热闹。这首却留在案上许多天，想放下，又总去翻。'};
 let done=false;const valid=()=>!done&&heartState()?.pending===d&&xieAdmirerReady(k);
 const settle=mode=>{
  if(!valid()||mode==='ask'&&xieRomanceActive()&&!xieCanPursue(k,p))return null;startXieReadingAge(p);done=true;delete heartState().pending;k.lastHeart=S.turn;k.xieAdmiration={personId:p.id,turn:S.turn,outcome:mode==='release'?'declined':'admired'};
  const text=mode==='release'?'父皇笑说这份心意也许错付，劝她把传闻与眼前的人分开，暂不议婚。':mode==='ask'?'父皇答应先听谢安本人的意思，尚未定亲，也未许诺一定成全。':'父皇陪她读诗，答应不拿这份欣赏取笑她，也不急着拿去议婚。';
  heartRecord(k,adult?'诗名与心意':'读诗怀想',`她说：“${lines[style]}”${text}`,mode==='release'?'原来诗中人未必会成为同行人。难过仍在，也想保留一点自己的体面。':'这份欣赏终于说出口了，往后怎样，还不能只靠想象。');
  if(mode==='ask')pushNow(xieMarriageRefusal(k,p));return text;
 };
 const estate=xieCapitalEstate(k),opening=estate?'请你到府中一叙，案上摊着一卷谢安的诗。':'案头多了一卷谢安的诗。';
 return chronicleEvent({title:adult?'诗名与心意':'读诗怀想',por:k,present:estate?[]:[k],valid,
  onShow:()=>{if(PalaceActions.xiePoetryAge)startXieReadingAge(p);},
  displayTitle:(adult?'诗名与心意':'读诗怀想')+' · 谢安名动京城',
  poemPrelude:{poet:p,title:'夜过芦汀',verse:['桨歇不惊眠鹭梦，','一船明月过芦花。'],
   account:(xieAwaitsFirstReading(p)||p.age===XIE_DEBUT_AGE?'谢安年少便有诗名，今年二十一岁。':'')+'曲水诗会上，谢安吟罢，席间静了片刻。一位素来挑剔的老翰林先开了口：“好一个‘一船’！我写了半辈子月亮，竟没想过它也能载上船。”他向谢安讨了原稿，亲笔在卷尾题了“惊才绝艳”四字。三日后，京城渡口有人念起上句，邻舟一个撑篙的孩子脆生生地接了下句。'},
  text:`${kidName(k)}${opening}她${style==='内敛'?'收了又展开，终于低声说':style==='灵动'?'眼睛发亮地说':'翻到留了书签的那一页'}：“${lines[style]}”\n${adult?'她愿意让你问问他的心意，还没有婚约。':xieRomanceActive()?'她尚未满十五岁；即使议定亲事，也只订婚，待成年后再成婚。':'她尚在长成，这次只是读诗与欣赏，不安排与成年人的婚事。'}`,choices:[
  {t:'陪她读诗，认真听完',f:()=>settle('listen')},...(discuss&&(!xieRomanceActive()||xieCanPursue(k,p))?[{t:'召谢安，先问他是否愿意议婚',f:()=>settle('ask')}]:[]),{t:'一笑了之，劝女儿别把诗名当知己',f:()=>settle('release')}]});
}
function xieMarriageReady(k,p=xieAn()){
 return xieAdmirerReady(k)&&kidAge(k)>=18&&k.xieAdmiration?.personId===p?.id&&k.xieAdmiration.outcome==='admired'&&S.turn>=(k.marriageAfter??0);
}
function xieMarriageRefusal(k,p){
 if(!xieMarriageReady(k,p))return null;let done=false;const gen=S.gen,valid=()=>!done&&S.gen===gen&&xieMarriageReady(k,p);
 const refusal=xieStoryUpdated()?'公主厚意，谢安心领。只是无意尚主，若因敬畏陛下便应下，反倒辜负公主。还请陛下收回成命。':'公主厚意，草民不敢轻慢。但草民无意尚主，不能因怕得罪陛下便说愿意。请陛下收回成命。';
 return chronicleEvent({title:'谢安辞婚',por:p,present:[p],valid,text:`你单独召见谢安，提起${kidName(k)}的心意。\n他郑重行礼：“${refusal}”\n公主不在这场召见里。你若仍赐婚，便是越过了他明确的拒绝。`,choices:[
  {t:'强制赐婚：“可惜爱女心有所属，还望体谅朕的爱女之心。” · 国库−50',cond:()=>valid()&&E().treasury>=50,why:'须双方仍未定亲，公主成年且国库足够',f:()=>{
   if(!valid()||E().treasury<50)return null;done=true;chg({treasury:-50});
   k.married=true;k.princessMarriage='xiean';k.xieAdmiration.outcome='forced';p.married=true;p.royalSpouseId=k.id;p.spouseName=k.name;
   if(xieCapitalEstate(k))k.estate.route='xiean';
   k.spouse={id:p.id,personId:p.id,scholarId:p.id,name:p.name,sur:p.sur,sex:'m',seed:p.seed,official:p.official,artPortrait:p.artPortrait,born:S.turn-p.age*12,alive:true,background:'京中诗客 · 奉旨尚主',marriedAt:S.turn,trust:38,marriageNature:{temperament:'温厚',hobby:'books',spending:'节俭',space:'需要独处'}};
   p.xiean.marriage={childId:k.id,at:S.turn,last:S.turn,news:0,affection:18,separateUntil:S.turn+12,joinedAt:null};ensureMarriedLife(k);openMaritalEstate(k);
   const text=`谢安辞婚未获准，陛下以爱女之心坚持赐婚。礼成后他对${kidName(k)}说：“此事非你之过。我虽未有相同心意，却不会让你在这里受委屈。”`+
    (xieSharedCourtshipActive()?'两人说好先好好安顿，给彼此留些相知的时日。':'两人约定先分房一年，他不纳妾，也不让她为帝命赔罪。');
   scholarRecord(p,'【奉旨尚主】'+text);heartRecord(k,'奉旨成婚',text,'终于与他成婚，却知道他的温柔还不是爱。愿往后的相知，不只靠这一道旨意。');
   const m=byId(k.mom);if(m?.alive)story(m,`【女儿成婚】${kidName(k)}奉旨嫁与谢安。听闻他曾辞婚，她既盼女儿有人照顾，也忧心帝命不能代替真心。`);return text;
  }},
  {t:xieStoryUpdated()?'准他辞婚，将答复如实转告公主':'一笑了之：“原是女儿春心错付，婚事作罢。”',f:()=>{
   if(!valid())return null;done=true;k.xieAdmiration.outcome='declined';
   scholarRecord(p,`【辞婚获准】单独召见时拒绝与${kidName(k)}的婚议，陛下收回提议，未结婚约。`);
   heartRecord(k,'心意未成','父皇转告谢安无意尚主，收回婚议，并未隐瞒他的拒绝。','有些失落，却宁愿知道实话。自己的喜欢，不该成为另一个人不得不答应的理由。',-.3);return '婚事作罢。谢安行礼谢恩，公主得到真实的答复；这份失落需要时间安放。';
  }},{t:'暂缓决定',f:()=>{if(!valid())return null;done=true;scholarRecord(p,`【婚议暂缓】明确辞谢与${kidName(k)}的婚议，陛下尚未决定，未结婚约。`);return '未定亲，日后仍可再听双方心意。';}}]});
}
A.xieMarriage=function(id){const k=kidById(id);if(!modalOpen)pushEv(xieMarriageRefusal(k,xieAn()));};
const xieYouthPanel=youthPanel;
youthPanel=function(k){return xieYouthPanel(k)+(!xieSharedCourtshipActive()&&xieMarriageReady(k)?`<button class="btn" onclick="A.xieMarriage(${k.id})">再问谢安的婚事</button>`:'');};

function xieCouple(){const p=xieAn(),k=p?.royalSpouseId&&royalById(p.royalSpouseId);return p&&k?.spouse?.personId===p.id?{p,k,m:p.xiean.marriage}:null;}
function xieCoupleRecord(p,k,title,text,his,hers){
 scholarRecord(p,`【${title}】${text} 心中所想：${his}`);heartRecord(k,title,text,hers);
}
function xieTemperamentGroup(k){
 const style=childDisposition(k);
 if(['灵动','爽直','好奇','好胜'].includes(style))return 'lively';
 return ['仁厚','审慎'].includes(style)?'gentle':'quiet';
}
const XIE_COUPLE_WORDS={
 lively:[['晨光入书房','她带来一枝开得歪斜的花，说像他不肯循规的诗。他先笑了，又挪开案上的旧卷，给她留下一块地方。','这间书房从前只听雨，如今听她说起琐事，也并不嫌吵。','他今天笑得早了一些，也不再只等我先开口。'],['同赴春游','她想赶早市看灯样，他记下时辰，亲自备好披风。人群拥挤时，他始终放慢脚步，等她看完每一家。','答应陪她，便该认真陪着；渐渐也想知道她下一回会看见什么。','原来他不是不爱热闹，只是不愿把相伴当成敷衍。']],
 gentle:[['灯下温茶','她没有打断他改诗，只把温茶放在伸手可及的地方。他读完便合卷，问她今日过得怎样，没让她一直独坐。','她照顾我的习惯，我也该记得她这一日的喜怒。','他虽仍守着分寸，却不曾把我的体贴当作理所当然。'],['回信中的名字','家书要写到深夜，她劝他歇一歇。他接过琐事，替她校好另一封信，落款时把两人的名字并列。','夫妻不必时时说情话，愿意替她分担的事，总有许多。','相敬如宾不是冷落。许多小事，他确实放在了心上。']],
 quiet:[['各读一卷','两人各自读书，许久无话。她指出他诗里一个太满的字，他认真改了，转过来请她再看一遍。','她不因我是谢安便说句句都好。这样的直言，值得珍重。','不必时时找话，也能安稳地坐在同一盏灯下。'],['雨声与旧谱','雨夜误了赴宴，两人索性留在廊下理旧谱。他先问她想读哪一册，没有替她挑好所有事情。','相处可以留白。她肯说想法的时候，我愿认真听。','他给我留了说话的位置，也给我留了不说话的自在。']]
};
const XIE_MARRIED_CHRONICLES={
 lively:[
  ['城南问路','出门前，谢安把城南的路线画在纸上。她看完却折起地图，说先去吃热饼。他跟着她走过几条陌生的巷子，回来在那张纸背面补了一句：“热饼铺前左转，可见最好的晚霞。”','原来与她出门，迷路也可以记下来。','他原先样样都安排好了，还肯跟我拐进那条巷子。'],
  ['一局未完','一局棋下到半途，她点了点棋盘：“你刚才让了三手。”谢安一怔，把棋子拨回原位。重下时他果然赢了，她大方认输，约好改日再战。他过去只记得胜负，今日在棋谱旁端端正正写了“下回”。','认真与她较量，比让她赢更让她高兴。','这一局输了，下一局他可别想赢得这么容易。'],
  ['桥上听潮','她听说桥下涨水时能听见不同的声响，拉着谢安去了。桥上风太大，他的第一句话被吹散了。她问说了什么，他便凑近些重说一遍：“过两天水退了，还想和你来听听。”','从前来了便走，如今连下一次都想约好。','我记得他说那句话时，手还牢牢扶着桥栏。']
 ],
 gentle:[
  ['请帖上的空白','两份宴帖撞在同一日。她习惯先挪自己的日程，谢安却把两张请帖并排放好，问她真正想去赴哪一席。商量过后，他们各去自己想去的地方。晚饭时，她先讲起在席上见到的趣事。','先问清她想怎样，胜过替她把一切安排妥当。','原来各有一日的见闻，回来也有许多话可说。'],
  ['账簿上一行字','家人来支银修漏雨的书屋。谢安先写下一个数，她翻出旧账，问负责守夜的人是否也该换床干被褥。两人把账重算了一遍。月底她再翻那册账，看见末页添了一行：“先看守夜人的屋顶。”','我只顾着惜书，她记得先看看人。','他听进去之后，会自己记在下一回。'],
  ['一篮晚梨','熟识的果农送来一篮梨，她挑出两个碰伤的，打算煮来吃。谢安原想先拿好梨送客，听她说完便留下帮忙削皮。梨水煮好，他照着她的意思，先盛一碗给淋雨归来的门房。','她随口说的一件小事，跟着做了一回，就记住了。','他没问这样做体面不体面，挽起袖子便去取碗。']
 ],
 quiet:[
  ['借卷有约','谢安取走她案上一本游记，读到一半才发现夹着她的短札。他原样合上书送还，问那几页可不可以借来读。次日她把书递过去，另夹了一张：“短札收走了，书借你三日。”','她肯借给我的东西，理当由她亲手递来。','他拿回来问了我一声。三日之后，我倒想听听他读见了什么。'],
  ['窗格半开','她校书时惯把窗关着，谢安却喜欢听雨。两人各说了缘故，最后在窗格下垫一枚木楔。风进来时纸页没有翻，雨声也还在。后来木楔掉过一回，他又削了一枚，照着原来的厚薄。','这点小事，也有值得两个人商量的地方。','从前我嫌解释费事，这次说了，往后许多场雨都听得安稳。'],
  ['诗集上的删字','誊清诗稿时，他在序里写她「从不与人争」。她读罢提笔圈住四个字：“这些年，我同你争过好几回。”谢安想起那些改了又改的诗，笑着把序留给她重题。','她看见了我没写出来的人，也肯指出来。','这本诗集印出去以后，旁人会认得一点真正的我。']
 ]
};
function nextXieMarriageChronicle(m,kind){
 const original=XIE_COUPLE_WORDS[kind];
 if(!xieStoryUpdated())return original[m.news++%original.length];
 const added=XIE_MARRIED_CHRONICLES[kind];
 const index=m.news++%(original.length+added.length);
 if(xieStoryUpdated()){
  // A save already past the second entry finishes its current cycle in the old order.
  if(index<2)m.interleaveChronicles=true;
  if(m.interleaveChronicles){
   if(index===1)return added[0];
   if(index===2)return original[1];
  }
 }
 return index<original.length?original[index]:added[index-original.length];
}
function xieLifeTick(){
 let p=xieAn();
 if(!p){
  if(S.turn<6||mourningActive())return;
  const young=S.children.filter(k=>(heartReady(k)||xieHeartReady(k))&&kidAge(k)<(xieRomanceActive()?26:20));
  const hasPrincess=journalContentVersion()>=130&&E().sur!=='谢'&&young.some(xieHeartReady);
  if(young.length&&chance(hasPrincess ? .09 : .045))createXieAn();
  return;
 }
 if(!officialAlive(p))return;
 const pair=xieCouple();
 if(pair){
  const {k,m}=pair;if(!k.alive){if(!p.xiean.widowed){p.xiean.widowed={turn:S.turn,name:k.name};scholarRecord(p,`【长留旧人】妻子${k.name}去世。他收好她的旧物，仍亲自料理身后与家中事务。面对再娶的劝说，只道：“此生已有过一位妻子。”此后不再娶妻，也不纳妾。`);}return;}
  if(!m||!householdActive(k)||!xiePresent(p)||k.away||k.hp<45||k.templeStay)return;
  if(m.joinedAt==null&&S.turn>=m.separateUntil){m.joinedAt=S.turn;m.affection=clamp(m.affection+8);k.spouse.trust=Math.max(45,k.spouse.trust);
   xieCoupleRecord(p,k,'一年相知',xieSharedCourtshipActive()?'一年过去，熟悉了彼此的习惯，两人商量好，今后多留些日常相伴的时辰。':'分房满一年，两人认真商量过后，愿意搬到同一处起居。谢安仍待她温柔，未把夫妻之礼当成催生的承诺。','这一年照应与交谈是真实的，往后仍该慢慢珍重。',m.origin==='proposal'?'当初答应了他的提亲，如今也愿与他共度每一个寻常清晨。':'不只是当年那道旨意了，这一次我们都说了愿意。');}
  const elapsed=S.turn-m.last;
  if(elapsed<3||mourningActive())return;
  const late=xieRomanceActive()&&xieLateReady(pair);
  const earlyChronicleDue=xieStoryUpdated()&&!late&&m.news<2&&elapsed>=4;
  if(!chance(.42)&&!earlyChronicleDue)return;
  m.last=S.turn;
  if(late){xieRememberLate(pair);return;}
  const kind=xieTemperamentGroup(k);
  const row=nextXieMarriageChronicle(m,kind);m.affection=clamp(m.affection+(kind==='lively'?9:6));k.spouse.trust=clamp(k.spouse.trust+5);
  xieCoupleRecord(p,k,row[0],`${k.name}与谢安：${row[1]}`,row[2],row[3]);
  if(m.affection>=60&&!m.loveRemembered){m.loveRemembered=S.turn;
   const words=kind==='lively'?'那日她晚回来片刻，他才发现自己一直在听门外的脚步声。她笑问等了多久，他不再拿诗句搪塞，只答想早些见她。':kind==='gentle'?'她照常留了灯，他在门边站了一会儿，主动说起今日最想告诉她的一件小事。平常的问候里，终于有了藏不住的依恋。':'两人读到同一处，几乎同时抬眼。他忽然明白，自己眷恋的不只是安静，而是与她共享这份安静。';
   xieCoupleRecord(p,k,'始知相思',words,m.startedWithLove?'成婚前已盼与她相伴，如今才知日常的牵挂，还能一日深过一日。':m.origin==='proposal'?'提亲时已盼与她相伴，如今才知日常的牵挂，还能一日深过一日。':'成婚时说过并无此意，并非假话；如今渐生牵挂，也不是帝命能赐来的。',m.startedWithLove||m.origin==='proposal'?'曾经的辞婚已是旧事，如今的相伴，也日日有新的欢喜。':'从前担心只得礼数，原来这些日子的相伴，也慢慢成了他的心事。');
  }return;
 }
 if(p.married||p.xiean.widowed||xieRomanceActive()&&p.betrothal||!xiePresent(p)||mourningActive()||S.turn-p.xiean.lastNews<6||!chance(.25))return;
 p.xiean.lastNews=S.turn;const news=[
  '曲水诗会上，他没有接众人拟好的颂辞题，改写江边等船的小贩。满座初静，继而争相传抄；他将润笔留给了抄书的寒士。',
  '一位贵女托人请他题诗。他认真题了一首山水诗，也明言并非情笺，不愿让礼貌成为无意的许诺。',
  '酒楼传言他与江湖剑客夜谈。他只承认旧友来访，旁人猜测的门派与势力，仍无人查实。',
  '世家长辈劝他以声名求仕。他笑称酒囊饭袋，回去却把朋友新作上的错字逐一改好；避的是官场，并非不肯认真待人。'];
 const free=xieRomanceActive()&&p.xiean.path?.kind==='free';
 const pool=free?(xieStoryUpdated()?XIE_FREE_WORDS.concat(XIE_FREE_CHRONICLES):XIE_FREE_WORDS):news;
 scholarRecord(p,'【京华诗事】'+pool[p.xiean.newsIndex++%pool.length]);
}
const xieConceive=householdCanConceive;
householdCanConceive=function(k,partner){
 if(royalHeartActive()&&xieAn()&&partner?.personId===xieAn().id){const pair=xieCouple();if(!pair||pair.k!==k||!officialAlive(pair.p)||pair.p.xiean.widowed||pair.m?.joinedAt==null)return false;}
 return xieConceive(k,partner);
};
function xieEncourageReady(pair=xieCouple()){
 return royalHeartActive()&&pair&&pair.k.alive&&householdActive(pair.k)&&xiePresent(pair.p)&&!pair.k.away&&kidAge(pair.k)>=(xieRomanceActive()?15:18)&&pair.m?.joinedAt==null&&S.turn-pair.m.at>=3&&S.turn-(pair.m.lastEncourage??-99)>=3;
}
A.xieEncourage=function(){
 const pair=xieCouple();if(modalOpen||!xieEncourageReady(pair))return;const {p,k,m}=pair,parent=S.children.includes(k)?'父皇':'陛下';let done=false;
 const valid=()=>!done&&xieEncourageReady(pair)&&xieCouple()?.m===m;
 const shared=xieSharedCourtshipActive();
 pushEv({title:'相伴不催 · 谢安与公主',cast:[k,p],present:xieCapitalEstate(k)?[p]:[k,p],valid,
  text:shared?'谢安每天留些工夫和公主说话，两人还在熟悉彼此的习惯。你可以为他们腾出一点同行、共读的空闲。':
   `两人仍分房起居。谢安按时问安、分担家事，并未因此冷落公主。\n你可以劝他们腾出工夫同行、谈心，但不替他们决定何时亲近。`,choices:[
  {t:'劝两人多相伴，也给彼此留余地 · 精力−1',cond:()=>valid()&&E().energy>0,why:'精力不足或处境已变',f:()=>{
   if(!valid()||!useE())return null;done=true;m.lastEncourage=S.turn;m.affection=clamp(m.affection+12);k.spouse.trust=clamp(k.spouse.trust+8);
   const close=m.affection>=38&&k.spouse.trust>=45;
   if(close)m.joinedAt=S.turn;
   const text=parent+(shared?(close?'给两人留了相伴的时辰。他们把心里的话慢慢说开，都愿意以后多留几个只属于两人的早晨。':
    '给两人留了一段空闲。谢安安排了同游与共读，公主挑了路，两人都想再去一回。'):
    (close?'劝两人多相伴。此后夫妻私下谈清心意，都愿意提前结束分房，开始共同起居。此事并不等于一定会有孕。':'劝两人多相伴。谢安认真安排了同游与共读，两人渐渐亲近，仍决定暂且分房，未因长辈一句话勉强彼此。'));
   xieCoupleRecord(p,k,close?'同心移灯':'相伴渐近',text,close?'我愿意走近她，是日常相知的结果，不是再一道旨意。':'她愿说、我愿听，感情可以慢慢养，不必交差。',close?'这一回他也说愿意，心里终于有了踏实的欢喜。':'被珍重并不只有一种方式，我愿再认识他一些。');return text;
  }},{t:'不催，按两人的节奏相处',f:()=>{if(!valid())return null;done=true;m.lastEncourage=S.turn;
   xieCoupleRecord(p,k,'留白的分寸',parent+(shared?'将往后的日子交由两人慢慢商量，只嘱咐他们平日互相照应。':'没有催促结束分房，嘱咐两人互相照应。'),'我们的分寸被尊重了，也更该认真照顾她。','不必向任何人证明亲密，可以慢慢相知。');
   return shared?'他们照自己的步调过日子。':'分房约定保留，未改变受孕条件。';}}]});
};
const xieHouseholdNews=recordHouseholdNews;
recordHouseholdNews=function(k){if(royalHeartActive()&&xieAn()&&k.spouse?.personId===xieAn().id)return;return xieHouseholdNews(k);};
const xieHouseholdScene=makeHouseholdScene;
makeHouseholdScene=function(k){if(royalHeartActive()&&xieAn()&&k.spouse?.personId===xieAn().id)return null;return xieHouseholdScene(k);};
const xieHouseholdRecord=householdRecord;
householdRecord=function(k,type,text){const result=xieHouseholdRecord(k,type,text),p=xieAn();if(royalHeartActive()&&p&&k.spouse?.personId===p.id&&officialAlive(p))scholarRecord(p,`【夫妻家事】${text}`,false);return result;};
const xieHouseholdPanel=householdPanel;
householdPanel=function(k){
 const html=xieHouseholdPanel(k),pair=xieCouple();if(!royalHeartActive()||pair?.k!==k)return html;
 const {p,m}=pair;if(!m)return html;
 if(xieSharedCourtshipActive())return detailSection('谢安与公主',`<p>${!k.alive?'妻子已故，旧物与往事长留。':!officialAlive(p)?'谢安已故，往事保留。':'谢安把两人的起居与家事放在心上。'} 谢安此生只守这一门婚事。</p>`)+html;
 return detailSection('谢安与公主',`<p>谢安始终不纳妾；若妻子先逝，也不再娶。</p><p>${!k.alive?'妻子已故，旧物与往事长留。':!officialAlive(p)?'谢安已故，往事保留。':m.joinedAt==null?'分房相处中 · '+Math.max(0,m.separateUntil-S.turn)+'个月后届满一年。尚未共同起居，不会有孕。':'已由双方商量共同起居，是否有孕仍依实际条件。'}</p>${bar('渐生情意',m.affection,'#936375')}${xieEncourageReady(pair)?'<button class="btn jade" onclick="A.xieEncourage()">劝两人多相伴</button>':''}`)+html;
};
const xieScholarView=viewScholar;
function xieRelationshipLabel(p){
 if(p.xiean.widowed)return '丧妻后不再娶';
 if(p.betrothal?.kind==='xiean')return '已订婚，尚未成婚';
 if(!p.married)return '未婚';
 const marriage=p.xiean.marriage;
 if(marriage?.origin==='proposal')return '两心相许';
 return marriage?.startedWithLove?'奉旨尚主 · 婚前已相知':'奉旨尚主';
}
viewScholar=function(){
 const p=scholarById(UI.sel);if(!royalHeartActive()||p?.storyPerson!=='xiean')return xieScholarView();
 const pair=xieCouple();return `${personBackButton('officials')}<header class="detail-head person-detail-head">${porImg(p,224)}<div class="grow"><p>京华诗客 · 固定人物</p><h2>谢安</h2><p>${p.age}岁 · ${esc(p.temperament)} · ${officialAlive(p)?xieRelationshipLabel(p):'已故'}</p><p>布衣诗客 · 未受官职</p></div></header>
  ${detailSection('世家与来处',xieHouseHTML(p))}${detailSection('诗名与风骨','<p>惊才绝艳，不愿以声名求官。江湖往来仍只有传言。他温柔待人，却不轻许仕途与婚事。</p>')}
  ${xiePresent(p)?`<button class="btn primary" onclick="A.xieAudience()" ${S.turn-(p.lastAudience??-99)<3||E().energy<1?'disabled':''}>单独召见 · 精力−1</button>`:''}
  ${detailSection('人物纪事',detailStory(p))}
  ${pair?detailSection('夫妻与家事',`<p>妻子：<button class="person-link" onclick="A.go('${S.children.includes(pair.k)?'kid':'relative'}',${pair.k.id})">${esc(pair.k.name)}${pair.k.alive?'':' · 已故'}</button></p><p>不纳妾，妻亡不再娶。${!xieSharedCourtshipActive()&&pair.m?.joinedAt==null&&pair.k.alive?'婚初分房，情分由日常相处慢慢积累。':''}</p>`):''}
  `;
};
const xieOfficials=officialsTable;
officialsTable=function(){const html=xieOfficials(),p=xieAn();return html+(royalHeartActive()&&p?detailSection('京中名士',`<p>${careerLink({p,scholar:true,key:'scholar:'+p.id})} · ${esc(p.origin)} · ${p.age}岁 · ${p.married||p.betrothal?.kind==='xiean'?xieRelationshipLabel(p):'以诗名世'}${officialAlive(p)?'':' · 已故'}</p><p class="hint">未受官职，另列名士；可进人物页召见问诗、提出任用。</p>`):'');};
