/* Cining Palace has its own daily life. Praise is occasional and remembers whom it concerns. */
const dowagerTalksEnabled=()=>journalContentVersion()>=13;
const dowagerTopicReady=(d,key,months=6)=>S.turn-(d.conversations?.topics?.[key]??-Infinity)>=months;
function trackDowagerTalk(d,ev,key,{months=6,praise=null}={}){
 if(!ev)return null;let shown=false,answered=false;
 const valid=ev.valid,onShow=ev.onShow;
 const ready=()=>dowagerTopicReady(d,key,months)&&(!praise||dowagerTopicReady(d,'praise',6)&&dowagerTopicReady(d,'praise:'+praise.id,12));
 if(!ready())return null;
 return {...ev,dowagerTopic:key,valid:()=>d.alive&&(!valid||valid())&&(shown||ready()),onShow:()=>{
  if(shown)return;shown=true;onShow?.();const h=d.conversations||={topics:{},recent:[]};h.topics||={};h.topics[key]=S.turn;
  if(praise){h.topics.praise=S.turn;h.topics['praise:'+praise.id]=S.turn;}
  h.lastTurn=S.turn;h.recent=[...(h.recent||[]),key].slice(-4);
  if(journalContentVersion()>=29)h.visits={turn:S.turn,count:h.visits?.turn===S.turn?h.visits.count+1:1};
 },choices:ev.choices.map(choice=>({...choice,f:()=>{if(answered||!d.alive)return null;answered=true;return choice.f?.();}}))};
}
const dowagerEarlierFavor=dowagerFavorEvent;
dowagerFavorEvent=function(){
 if(!dowagerTalksEnabled())return dowagerEarlierFavor();
 const d=ensureDowager(),c=dowagerFavorite(d);if(!c)return null;
 return trackDowagerTalk(d,dowagerEarlierFavor(),'praise',{praise:c});
};
const dowagerEarlierPartiality=dowagerPartialityEvent;
dowagerPartialityEvent=function(d=ensureDowager()){
 const ev=dowagerEarlierPartiality(d);return !dowagerTalksEnabled()?ev:ev&&trackDowagerTalk(d,ev,'partiality',{months:12,praise:dowagerFavorite(d)});
};
function dowagerConversationTopics(d){
 const seasonLine=['春日风软，哀家让人把廊下的花搬出来了。你总在案前，也该看看枝头新叶。','天气热，午后便少点几盏灯，凉茶备着就是。宫人轮值，也容他们歇口气。','秋风起了，哀家把旧披帛翻出来晾晒。东西用了许多年，仍记得当初的颜色。','天冷得早，炭盆要留通气的地方。你夜里看折子，莫只添炭、不添衣。'][season()];
 const pool=[
  {key:'seasons',title:'窗前时令',line:seasonLine,answer:'陪母后看看窗外',result:'你陪她在窗边坐了片刻，听她说起宫中草木。'},
  {key:'rest',title:'起居叮咛',line:E().health<55?'看你的气色，近来又没歇好。江山的事做不完，身子却只有这一副。太医的话，你也听一听。':'哀家今日睡得早，醒来却惦记你是否还在看折子。事有轻重，别把歇息总排在最后。',answer:'陪母后喝盏温茶',result:'温茶续了两回，你们暂且不谈急事。'},
  {key:'old-palace',title:'宫中旧事',line:'哀家初住宫中时，也常把曲折的宫道记混。后来闭着眼都认得了，却又想起初来时的心情。住得久，并不是什么都不在意了。',answer:'听母后慢慢讲',result:'她说起初住宫城时的生疏，也说起后来如何把日子安顿下来。'},
  {key:'letters',title:'家书与旧物',line:'有时想给母家写封信，提笔又尽是起居平安。哀家留着从前的针线样子，看见它们，便想起还未入宫的日子。',answer:'陪她翻看旧物',result:'你听她讲旧物的来历，没有把话头转到举荐谁入宫。'},
  {key:'meals',title:'一碗家常',line:'这碗羹照旧法做，滋味不算稀罕。哀家如今吃得少，倒愿有人坐下，一起吃顿不赶时辰的饭。',answer:'留下陪母后用膳',result:'宫人添上一副碗筷。你陪太后用了家常饭，席间没有论谁得宠。'},
  {key:'governance',title:'听取直言',line:E().people<40?'奏折上说百姓安居，未必家家都好。你多听一句不中听的话，也许便少一户人家受苦。':E().treasury<150?'国库的银子有去处，百姓的辛苦也该有回音。慈宁宫这里从简便好，不必为了哀家添排场。':'哀家不替你断朝政，只劝一句：肯把难处当面说清的人，未必是不敬你。用人也要容人说话。',answer:'记下母后的劝诫',result:'你记下她的劝诫，具体政务仍待御前逐件处置。'},
  {key:'palace-life',title:'宫人的日子',line:'来请安的人只怕礼数有错，连捧茶的手都绷着。规矩要有，也要让人能喘口气。哀家这里，茶凉些不妨事。',answer:'听她说起日常琐事',result:'她说起值夜、换季与添衣的小事，叮嘱宫里照例妥善安排。'}
 ];
 if(journalContentVersion()>=29)pool.push(
  {key:'tea-taste',title:'茶里的滋味',line:'你尝尝这盏茶，先别听宫人说它名贵不名贵。合自己的口味，才算喝得舒坦。哀家如今也懒得样样都随别人。',answer:'同母后细尝这一盏茶',result:'你们说起浓淡与回甘，各自说了喜欢的滋味。'},
  {key:'old-recipes',title:'旧日食谱',line:'翻到一页旧食谱，字都淡了，还写着少放些糖。人到后来，记得的常是这些小事。你有什么滋味，一想起便觉得亲切？',answer:'和母后说说熟悉的滋味',result:'你同太后说起熟悉的饭食，宫人把旧食谱重新收好。'},
  {key:'half-read-book',title:'书里的人情',line:'哀家昨日翻书，见书里的人一句话不肯说开，倒生出许多误会。活了一把年纪，还是觉得，亲近的人也该把话好好说。',answer:'听她说说书中的人情',result:'你们从书中的误会说到相处，约定有心事便慢慢讲。'},
  {key:'quiet-crafts',title:'手边针线',line:'这几针哀家自己慢慢缝，不为省宫人的工夫。心里杂乱时，做完一件小事，反倒踏实。你也不必时时都想着做大事。',answer:'陪她收好针线',result:'你陪太后收好针线，暂且放下御前的忙碌。'}
 );
 const child=kidsAlive().filter(k=>!k.removedFromRoyal&&!k.lost&&!k.pendingName).sort((a,b)=>b.born-a.born)[0];
 if(child)pool.push({key:'grandchild',title:'惦念晚辈',child:child.id,line:`说起${child.name}，${childInPalace(child)?kidAge(child)<3?'还小，吃睡安稳就好，不必急着拿聪明不聪明来比。':'也别只问功课。孩子心里喜欢什么、怕什么，你偶尔也听听。':'虽不住在宫里，也该问问近况。见不了面，有封平安信也是好的。'}`,answer:'和母后谈谈'+child.name,result:`你同太后谈起${child.name}的近况，她叮嘱照料要顾着孩子自己的日子。`});
 const cleared=S.children.find(k=>k.alive&&k.parentage?.decision==='cleared'&&S.turn-k.parentage.resolvedAt<=6&&inPalace(byId(k.mom)));
 if(cleared)pool.push({key:'cleared',title:'疑云之后',child:cleared.id,mother:cleared.mom,line:`${cleared.name}的身世既已查明，就莫让旧话再压着母子。${fullName(byId(cleared.mom))}受过委屈，一道澄清的旨意之外，也要留些日子让她缓过来。`,answer:'记下母子受冤的委屈',result:'你应下不再凭旧日流言相疑。太后并未催她立刻释怀。'});
 const victory=(S.flags.frontierCampaigns||[]).findLast(r=>r.gen===S.gen&&r.outcome==='victory'&&S.turn-r.turn<=6);
 if(victory)pool.push({key:'frontier',title:'捷报之后',line:`${victory.name}此番在北境立功，是好事。赏功要分明，受伤的将士与家眷也莫落下。哀家盼的是边民能过安稳日子。`,answer:'同母后谈边关近况',result:`太后谈起${victory.name}的捷报，你记下她对将士与边民的牵挂，赏功仍从军功册办理。`});
 if(S.turn-(S.flags.lastXX??-99)<3)pool.push({key:'selection',title:'新人的日子',line:'选秀名单既定，新人还要认宫门、学规矩。你看的是一份名单，她们过的却是往后的日子。莫急着比谁更伶俐，也顾着宫中旧人的心情。',answer:'听母后谈新旧相处',result:'你们谈起新人安顿和旧人心绪，太后没有指定要偏爱谁。'});
 return pool;
}
function dowagerEverydayEvent(d){
 const recent=d.conversations?.recent||[],topics=dowagerConversationTopics(d);
 let ready=topics.filter(t=>dowagerTopicReady(d,t.key)&&!recent.includes(t.key));
 if(!ready.length)ready=topics.filter(t=>dowagerTopicReady(d,t.key));
 if(journalContentVersion()>=29){const unheard=ready.filter(t=>d.conversations?.topics?.[t.key]===undefined);if(unheard.length)ready=unheard;if(!ready.length)return dowagerCompanionEvent(d,true);}
 if(!ready.length)return {title:'慈宁宫 · 静坐',por:dowagerPerson(d),valid:()=>d.alive,text:'先前的话已说过，太后这回只留你坐坐。窗外风过，宫人轻轻续上茶水。',choices:[{t:'陪她静坐片刻'}]};
 const topic=pick(ready),k=topic.child&&kidById(topic.child),m=topic.mother&&byId(topic.mother);let answered=false;
 const record=()=>{if(answered)return null;answered=true;log(`${d.name}与帝闲谈「${topic.title}」：${topic.result}`);
  d.conversations.notes=[...(d.conversations.notes||[]),{d:dateStr(),turn:S.turn,topic:topic.key,text:topic.result}].slice(-24);
  if(k)kstory(k,`太后在慈宁宫向陛下问起：${topic.result}`);
  if(m)story(m,`太后在慈宁宫劝陛下记得${k.name}身世昭雪后，母子仍需时间平复受冤的委屈。`);
  return topic.result;
 };
 return trackDowagerTalk(d,{title:'慈宁宫 · '+topic.title,por:dowagerPerson(d),valid:()=>d.alive&&(!k||k.alive)&&(!m||inPalace(m)),text:`${d.name}说：“${topic.line}”`,choices:[{t:topic.answer,f:record},{t:'记下母后的话，先告退',f:record}]},topic.key);
}
function dowagerCompanionEvent(d,fallback=false){
 const visits=d.conversations?.visits?.turn===S.turn?d.conversations.visits.count:0;
 if(!fallback&&visits<2)return null;
 const grieving=d.feeling?.kind==='悲恸';
 const pool=grieving?[
  ['quiet-company','有人相陪','你肯多坐一会儿，哀家心里便好受些。不必找话来劝，也不必急着让哀家笑。','你没有催太后释怀，只陪她安静坐了一会儿。'],
  ['quiet-window','窗下相伴','方才又走了神。你若不赶着回去，就陪哀家看看窗外吧，什么也不说也好。','你陪太后坐在窗下，让她慢慢收拾心绪。'],
  ['quiet-tea','再留一盏茶','茶还温着。哀家今日说不出多少话，可有人坐在身边，总与独自坐着不同。','你为太后续了温茶，没有拿热闹岔开她的悲伤。']
 ]:[
  ['lingering','怎么还舍不得走','今日怎么在哀家这里坐了这么久，还舍不得走？是不是想起小时候的事了？若愿意，就讲给哀家听听。','太后笑问你为何迟迟不走，你便陪她说了些闲话。'],
  ['childhood','小时候的心愿','既然不急着走，哀家倒想问问：小时候总盼着快些长大，如今可还有什么小小的念想，一直舍不得放下？','你们说起小时候的盼望，太后认真听完，没有拿帝王的身份来打趣。'],
  ['more-tea','还要续茶么','还要再续一盏茶么？旁人见你坐得这样久，怕以为哀家藏了什么好点心。其实不过是有人肯陪着说说话。','太后笑着让人续茶，你又陪她坐了一会儿。'],
  ['ordinary-time','寻常母子','在外头，人人都等着陛下拿主意。到了这里，不必每句话都想得周全。今日就做一会儿寻常人家的孩子吧。','你在太后身边暂且放下御前的身份，只说家常。'],
  ['small-question','也问问你的日子','哀家方才说了许多自己的事，也该问问你。近来可有什么让你舒心的小事？不必是朝中的大事。','太后问起你自己的日子，你们没有把话题转成朝政。'],
  ['unfinished-game','摆一局闲棋','既然还得闲，陪哀家摆几步棋？不必让，也不必急着赢，慢慢想，才有坐在一处的趣味。','你陪太后摆了几步闲棋，没有急着论输赢。']
 ];
 let available=pool.filter(t=>dowagerTopicReady(d,'company:'+t[0],1));
 const fresh=available.length>0;
 if(!fresh){if(!fallback)return null;available=pool.filter(t=>'company:'+t[0]!==d.conversations?.recent?.at(-1));}
 const [key,title,line,result]=pick(available);let answered=false;
 return trackDowagerTalk(d,{title:'慈宁宫 · '+title,por:dowagerPerson(d),text:`${d.name}${grieving?'轻声道':'看着你，说'}：“${line}”`,choices:[{t:grieving?'再陪母后坐一会儿':'陪母后接着说家常',f:()=>{
  if(answered)return null;answered=true;dowagerRecord(d,title,result);const h=d.conversations;h.notes=[...(h.notes||[]),{d:dateStr(),turn:S.turn,topic:'company:'+key,text:result}].slice(-24);return result;
 }}]},'company:'+key,{months:fresh?1:0});
}
const dowagerEarlierEvent=dowagerEvent;
dowagerEvent=function(){
 if(!dowagerTalksEnabled())return dowagerEarlierEvent();
 const d=ensureDowager();if(!d?.alive)return null;
 if(journalContentVersion()>=29&&d.feeling?.kind==='悲恸')return dowagerCompanionEvent(d,true);
 if(journalContentVersion()<29&&d.conversations?.lastTurn===S.turn)return {title:'慈宁宫 · 静坐',por:dowagerPerson(d),valid:()=>d.alive,text:'今日已经说过一回话，太后这次没有再提先前的事，只叫宫人续茶，留你静坐片刻。',choices:[{t:'陪她坐一会'}]};
 if(journalContentVersion()>=29&&d.conversations?.visits?.turn===S.turn&&d.conversations.visits.count>=2&&chance(.7)){const company=dowagerCompanionEvent(d);if(company)return company;}
 if(S.month===9&&dowagerTopicReady(d,'birthday',12))return trackDowagerTalk(d,{title:'太后千秋',por:dowagerPerson(d),text:`今日是${d.name}千秋节。她说：“年年添一岁，只盼一家人各自安好。你肯来坐坐，哀家便欢喜。”`,choices:[{t:'大办寿宴（国库-60万两）',f:()=>fx(chg({treasury:-60,prestige:3,people:1}))},{t:'一切从简',f:()=>fx(chg({people:2}))}]},'birthday',{months:12});
 const r=R();
 if(r<.1){const favor=dowagerFavorEvent();if(favor)return favor;}
 else if(r<.18){const advice=dowagerPartialityEvent(d);if(advice)return advice;}
 else if(r<.24&&dowagerTopicReady(d,'children',12)&&kidsAlive().length<3&&S.turn>=12)return trackDowagerTalk(d,{title:'慈宁宫 · 开枝散叶',por:dowagerPerson(d),text:`${d.name}盼着子孙相伴，也叮嘱：“子嗣随缘，妃嫔的身子要先照料好。${harem().some(c=>c.preg)?'既已有孕，更不要催她们冒险。':'得空多相处，也别把盼望变成催逼。'}”`,choices:[{t:'先顾好她们的身体',f:()=>{log('帝听太后谈子嗣，先顾妃嫔身体，不以催逼求孕。');return '你记下嘱咐，子嗣仍看身体与缘分。';}}]},'children',{months:12});
 else if(r<.28){const proposal=dowagerProposal(d);if(proposal)return trackDowagerTalk(d,proposal,'proposal',{months:12});}
 return dowagerEverydayEvent(d);
};
