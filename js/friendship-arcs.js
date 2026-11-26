/* Remember a real friendship before narrating its loss. Views never create a past. */
const FRIENDSHIP_STAGES={close:'曾经交好',strained:'有了嫌隙',distant:'渐渐疏远',broken:'旧交决裂',mending:'试着修复',renewed:'重拾交情',bereaved:'旧交成追忆'};
function friendshipArcsActive(){return journalContentVersion()>=31;}
function friendshipKey(a,b){return `${S.gen}:${rk(a,b)}`;}
function friendshipArc(a,b){return friendshipArcsActive()&&a&&b?S.friendshipArcs?.[friendshipKey(a,b)]:null;}
function friendshipTense(a,b){return ['strained','distant','broken','mending'].includes(friendshipArc(a,b)?.stage);}
function friendshipAvailable(c){return !!(c&&inPalace(c)&&!c.maid&&c.hp>=40&&!homeWorryActive(c)&&!maternalUnsettled(c)&&!lifeBoundary(c)&&!continuityConcern(c)&&!['悲恸','心如死灰','惶恐','怨恨','忧心'].includes(xinOf(c)));}
function friendshipTrack(a,b){
 if(!friendshipArcsActive()||!friendshipAvailable(a)||!friendshipAvailable(b)||!socialPair(a,b)||relGet(a,b)<35)return null;
 const old=friendshipArc(a,b);if(old)return old;
 let anchor='往日相处投契，曾经交好';
 const social=[a,b].find(c=>c.lastSocial?.other===(c===a?b:a).id);
 const cohab=[a,b].find(c=>c.lastCohab?.other===(c===a?b:a).id&&['food','needle','reading'].includes(c.lastCohab.kind));
 if(social)anchor=`曾在${social.lastSocial.place}${social.lastSocial.activity}`;
 else if(cohab)anchor=`曾在${cohab.lastCohab.palace}一起经历「${cohab.lastCohab.title}」`;
 else if(a.oldCourtFriends?.includes(b.id)||b.oldCourtFriends?.includes(a.id))anchor='入宫后重逢的旧相识，重新走近过';
 else if(sameSelectionCohort(a,b))anchor='同批入宫，后来慢慢交好';
 return (S.friendshipArcs||={})[friendshipKey(a,b)]={gen:S.gen,people:[a.id,b.id],since:S.turn,anchor,peak:relGet(a,b),stage:'close',incidents:0,revision:0,history:[],causes:{}};
}
function friendshipRecord(arc,a,b,title,text,thoughts,emotion=-.4){
 const note={turn:S.turn,date:dateStr(),title,text,stage:arc.stage,thoughts};
 arc.last=note;arc.revision++;arc.history.push(note);if(arc.history.length>12)arc.history.shift();
 lifeRecord([a,b],'bond',title,`【交情流转·${title}】${text}`,arc.anchor,thoughts.map(text=>({text,emotion})));
 for(const [c,o,i] of [[a,b,0],[b,a,1]]){
  const own={gen:S.gen,other:o.id,name:fullName(o),anchor:arc.anchor,...note,thought:thoughts[i]};
  (c.friendshipNotes||={})[o.id]=own;
  const entry=c.story.at(-1);entry.thread=`friendship:${arc.gen}:${rk(a,b)}`;entry.t+=` ${fullName(c)}记下：${thoughts[i]}`;
 }
 return note;
}
function friendshipRisk(c){return ['善妒','骄矜','骄纵','好胜','多情'].includes(c.trait)?2:['沉静','城府','痴情'].includes(c.trait)?1.5:.65;}
function friendshipCauses(a,b,arc=friendshipArc(a,b)){
 if(!arc||!friendshipAvailable(a)||!friendshipAvailable(b)||!socialPair(a,b))return [];
 const causes=[],add=(kind,hurt,other,evidence,weight)=>{if(S.turn-(arc.causes[kind]??-99)>=12)causes.push({kind,hurt,other,evidence,weight});};
 if(friendFavorState(a,b)==='unequal'){const hurt=a.favor<b.favor?a:b;add('favor',hurt,hurt===a?b:a,null,friendshipRisk(hurt));}
 const rich=[a,b].find(c=>familyUpbringing(c).means==='ample'),poor=[a,b].find(c=>familyBearingContext(c).constrained);
 if(rich&&poor&&rich!==poor)add('gift',poor,rich,null,(friendshipRisk(poor)+friendshipRisk(rich))/3);
 for(const [c,o] of [[a,b],[b,a]]){
  const s=o.lastSocial,third=s&&byId(s.other);
  if(s&&s.turn>=arc.since&&S.turn-s.turn<=3&&third&&third!==c&&inPalace(third))add('third',c,o,{...s,name:fullName(third)},friendshipRisk(c)*.7);
 }
 const argument=[a,b].map(c=>c.lastCohab).find(s=>s&&[a.id,b.id].includes(s.other)&&s.kind==='argument'&&S.turn-s.turn<=6&&s.turn>=arc.since);
 if(argument)add('argument',a,b,argument,2);
 return causes;
}
// Compare only people who actually attended this feast. A previously bereaved or fostering mother isn't described as childless.
function banquetFriendshipIncident(people,title,host){
 if(journalContentVersion()<81||S.turn-(S.flags.lastFriendshipIncident??-99)<3)return null;
 const women=people.filter(c=>!c.sex&&friendshipAvailable(c)),candidates=[];
 for(const mother of women){
  const child=people.find(k=>k.sex&&!k.pendingName&&mothersOf(k).includes(mother));
  if(!child&&mother!==host)continue;
  for(const friend of women){
   if(mother===friend)continue;
   const arc=friendshipArc(mother,friend)||friendshipTrack(mother,friend);
   if(!arc||arc.pending||!socialPair(mother,friend)||['broken','bereaved'].includes(arc.stage)||S.turn<(arc.spaceUntil??-1)||S.turn-(arc.lastIncident??-99)<6)continue;
   let kind;
   if(child&&!friend.preg&&(friend.lastBirth??-99)<0&&S.turn-(friend.enteredAt??S.turn)>=24&&!S.children.some(k=>k.mom===friend.id||k.foster===friend.id))kind='childToast';
   else if(mother===host&&friendFavorState(mother,friend)==='unequal'&&mother.favor>friend.favor)kind='birthdayToast';
   if(kind&&S.turn-(arc.causes[kind]??-99)>=12)candidates.push({kind,hurt:friend,other:mother,evidence:{title,child:child?.name,young:child&&kidAge(child)<5},w:friendshipRisk(friend)});
  }
 }
 if(!candidates.length||!chance(.30))return null;
 const cause=pickW(candidates);
 const note=friendshipIncident(cause.hurt,cause.other,cause.kind,cause);
 return note&&{...note,cast:[cause.hurt,cause.other]};
}
function friendshipIncidentWords(cause){
 const {hurt:a,other:b,kind,evidence}=cause,A=fullName(a),B=fullName(b),style=companionStyle(a);
 if(kind==='childToast')return {title:'一杯没喝完的贺酒',text:`${evidence.title}上，${evidence.young?`乳母抱来${evidence.child}，请${B}接孩子入席。${A}替她拉开椅子，旁人却笑着问，她何时也能抱上自己的孩子。${B}忙着接过孩子`:`${evidence.child}给${B}敬茶。${A}腾出地方让孩子走过去，旁人却笑着问她何时也能喝上这一盏。${B}忙着接茶`}，等回过神，好友已托人把贺酒送来了。`,thoughts:[
  `我是真喜欢${evidence.child}，也愿意看她们亲热。只是我进宫这些年，连敬朋友一杯酒，都有人替我数膝下有几个人。`,
  `我看见${A}特意替我们让开地方了。那句话出口时，我该先替她解围。等我追到廊下，她已经走了。`]};
 if(kind==='birthdayToast')return {title:'寿席上空着的位置',text:`${evidence.title}上，${A}端着寿面来贺${B}。掌事见众人都抢着向寿星敬酒，请她往旁边让一让。她放下碗便回了原席。等${B}想起要留她说句话，面已经凉了。`,thoughts:[
  '这碗面是我亲手盛的。原想同她说句家常，到了跟前，却连个站脚的地方也没有。','我一眼就认出了她用的碗，却只顾着回旁人的礼。她今晚大概一直在等我叫住她。']};
 if(kind==='favor')return {title:'一句恭喜之后',text:`${A}与${B}小坐，宫人来问后者近来的赏赐。话题一再绕回恩宠，${A}原本想说的家常没能说完。临别仍道了恭喜，这一回却没有约下次。`,thoughts:[
 a.trait==='善妒'?`我确实嫉妒${B}，连一句恭喜都要在心里练过。她未必有心冷落，可我已经怕再坐在那里听人夸她。`:style==='proud'?`我也有自己的体面。与${B}相见，不该总像在旁边衬她风光。`:style==='direct'?`我想和${B}说话，不想只听人问她得了什么。下回还是等我能坦然些再去。`:`替${B}欢喜是真的，觉得自己被落下也是真的。我不想怪她，却已经不像从前那样自在。`,
 b.trait==='骄纵'||b.trait==='骄矜'?`${A}今日冷了些脸，我也有些恼。可细想起来，她几次欲言又止，我竟没问她想说什么。`:`${A}今日走得早。我忙着答旁人的话，后来才想起，竟没听完她原先要说的事。`]};
 if(kind==='gift')return {title:'一份好意的轻重',text:`${B}取出私用的一束绣线，想分给${A}，随口说「这点东西，不必放在心上」。${A}为回礼盘算了几日，听见这句话，手里的小荷包便没有递出去。两人都察觉席间静了，却没有当场问明白。`,thoughts:[
 style==='proud'?`我不是拿不出心意。${B}说不值什么，我却觉得自己一针一线的认真也被说轻了。`:style==='direct'?`我知道${B}未必轻看我，可我费心准备的东西，在她眼里会不会也只是「这点东西」？`:`${B}的好意我记得。我只是怕，她习以为常的东西，正是我努力也赶不上的；连回礼都怕惹她笑。`,
 b.trait==='骄纵'?`我本想让${A}不必费心回礼，怎么反倒更拘束了？她不肯说，我也猜得有些烦。`:`我说不用放在心上，是怕${A}为回礼为难。如今想来，也许正是这句话，没顾到她认真待我的心。`]};
 if(kind==='third')return {title:'没能接上的话',text:`${A}来坐时，${B}谈起日前与${evidence.name}在${evidence.place}${evidence.activity}。那段共同见闻，${A}并不在场。她几次想接话，又怕显得自己多心，最后只笑着听。`,thoughts:[
 style==='direct'?`${B}当然可以有别的朋友，可今日的那些话，我一句也接不上，心里还是空了一下。`:style==='proud'?`我不会拦着${B}交朋友，也不愿追着问自己是不是还算亲近。只是以后，也不必次次先去找她。`:`从前什么小事都想先告诉${B}。如今她和旁人有了新的话题，我才发觉，原来有些位置不会一直留着。`,
 `我与${evidence.name}的来往，并不是要把${A}排在外头。可今日只顾自己说得高兴，没有留意她一直在陪笑。`]};
 return {title:'小事留下的旧结',text:`${A}与${B}想起前些日子「${evidence.title}」的争执。眼前的作息虽已各自安排，再见面却都先避开那个话题。一件日常小事没有说开，旧交也多了一层客气。`,thoughts:[
 style==='direct'?`那日与${B}争的事，我仍觉得有道理。可我不只想争个对错，也想知道她还愿不愿意听我说。`:`我记得${B}从前体谅我的时候，正因为记得，如今那几句硬话才格外难忘。`,
 `我并非处处要与${A}作对，也不愿替那日所有的争执认错。可一直不提，竟像连旧交也一并放下了。`]};
}
function friendshipIncident(a,b,kind,ceremony=null){
 const arc=friendshipArc(a,b);if(!arc||S.over||mourningActive()||arc.pending||S.turn<(arc.spaceUntil??-1)||S.turn-(arc.lastIncident??-99)<6||S.turn-(S.flags.lastFriendshipIncident??-99)<3||['broken','bereaved'].includes(arc.stage))return null;
 const cause=ceremony||friendshipCauses(a,b,arc).find(c=>c.kind===kind);if(!cause)return null;
 const scene=friendshipIncidentWords(cause),hurt=cause.hurt,other=cause.other;
 arc.incidents++;arc.lastIncident=S.turn;arc.causes[kind]=S.turn;S.flags.lastFriendshipIncident=S.turn;
 relAdd(a,b,-(arc.incidents===1?8:arc.incidents===2?12:18));
 arc.stage=relGet(a,b)<=-25&&arc.incidents>=3?'broken':relGet(a,b)<30&&arc.incidents>=2?'distant':'strained';
 const ending=arc.stage==='broken'?'此后两人收回了私下来往的邀约，只在必要的宫礼上相见。':arc.stage==='distant'?'后来互相送话、主动来坐的次数渐渐少了。':'旧日情分仍在，只是又多了一件没说开的小事。';
 const thoughts=a===hurt?scene.thoughts:[...scene.thoughts].reverse();
 friendshipRecord(arc,a,b,scene.title,scene.text+ending,thoughts);for(const c of [a,b])cchg(c,{mood:-2});
 log(`交情流转 · ${fullName(hurt)}与${fullName(other)}${FRIENDSHIP_STAGES[arc.stage]}。`);return arc.last;
}
function friendshipFollowup(arc,a,b){
 if(!arc.pending||S.turn<arc.pending.due||!friendshipAvailable(a)||!friendshipAvailable(b))return false;
 delete arc.pending;
 const willing=relGet(a,b)>-25&&!isRival(a,b)&&!isRival(b,a)&&socialPair(a,b);
 if(willing){
  relAdd(a,b,12);arc.stage=relGet(a,b)>=35?'renewed':'mending';
  friendshipRecord(arc,a,b,'再坐一回',`${fullName(a)}与${fullName(b)}依先前的约定再坐一回，这回先让彼此把话说完。${arc.stage==='renewed'?'她们终于愿意重新约下次相见；从前受过的委屈并没有被当作不存在。':'两人仍有些拘谨，却能听完对方的解释；这一步还不足以恢复从前的亲密。'}`,[`我听见${fullName(b)}也有自己的难处。往后能不能亲近，要看怎样相处。`,`与${fullName(a)}把话说开一点，比假装什么都没发生更踏实。`],.35);
 }else{arc.stage=relGet(a,b)<=-25?'broken':'distant';friendshipRecord(arc,a,b,'暂不赴约',`${fullName(a)}与${fullName(b)}没有依约聚坐。旧结尚在，两人各自遣人致意，暂且守礼相处。`,['这次我还不想勉强赴约，等心里的结松一些再说。','她也没有来。我未必不遗憾，只是还没准备好把旧事翻开。']);}
 return true;
}
function friendshipArcTick(){
 if(!friendshipArcsActive()||S.over||mourningActive())return;
 const people=harem().filter(friendshipAvailable);
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++)friendshipTrack(people[i],people[j]);
 const arcs=Object.values(S.friendshipArcs||{}).filter(arc=>arc.gen===S.gen);
 for(const arc of arcs){
  const [a,b]=arc.people.map(byId);if(!a||!b)continue;
  if(!a.alive||!b.alive){if(arc.stage!=='bereaved'){
   arc.stage='bereaved';delete arc.pending;arc.revision++;
   const survivor=a.alive?a:b.alive?b:null,departed=survivor===a?b:a;
   if(survivor&&arc.last){const thought=`与${fullName(departed)}${arc.anchor}。那些没说完的话，如今只能留在旧日里。`;lifeRecord([survivor],'loss','未说尽的旧话',thought,arc.anchor,[thought]);(survivor.friendshipNotes||={})[departed.id]={...survivor.friendshipNotes?.[departed.id],gen:S.gen,other:departed.id,name:fullName(departed),anchor:arc.anchor,turn:S.turn,stage:'bereaved',thought,title:'未说尽的旧话'};}
  }continue;}
  if(friendshipFollowup(arc,a,b))return;
 }
 if(S.turn-(S.flags.lastFriendshipIncident??-99)<3||!chance(.2))return;
 const pairs=arcs.flatMap(arc=>{
  const [a,b]=arc.people.map(byId);if(!a||!b||arc.pending||S.turn<(arc.spaceUntil??-1)||S.turn-(arc.lastIncident??-99)<6||['broken','bereaved'].includes(arc.stage))return [];
  return friendshipCauses(a,b,arc).map(cause=>({a,b,cause,w:cause.weight}));
 });
 if(pairs.length){const p=pickW(pairs);friendshipIncident(p.a,p.b,p.cause.kind);}
}
function friendshipNote(c){return friendshipArcsActive()?Object.values(c.friendshipNotes||{}).filter(n=>n.gen===S.gen).sort((a,b)=>b.turn-a.turn)[0]:null;}
function friendshipTalkEvent(c,o){
 const arc=friendshipArc(c,o);if(!arc?.last||!friendshipAvailable(c)||!o?.alive||!friendshipTense(c,o))return null;
 const gen=S.gen,revision=arc.revision,turn=S.turn;let done=false;
 const valid=()=>!done&&S.gen===gen&&S.turn===turn&&byId(c.id)===c&&byId(o.id)===o&&o.alive&&friendshipArc(c,o)===arc&&arc.revision===revision&&friendshipAvailable(c);
 const ready=()=>valid()&&friendshipAvailable(o)&&S.turn-(arc.lastIntervention??-99)>=6&&!arc.pending;
 const act=kind=>{
  if(!ready()||!useE())return null;done=true;arc.lastIntervention=S.turn;
  let text,thoughts;
  if(kind==='space'){
   arc.spaceUntil=S.turn+12;text=`陛下分别听过${fullName(c)}与${fullName(o)}的心事，让两人先各自静一静，不催着恢复往来。她们只需依礼相处，暂不相约私下聚坐。`;
   thoughts=[`与${fullName(o)}那段好，我没有忘记。眼下想先把自己的心绪理顺。`,`暂时不必与${fullName(c)}强作亲近，心里轻松些，也仍有遗憾。`];
  }else if(relGet(c,o)<=-25||isRival(c,o)||isRival(o,c)){
   text=`陛下分别问过两人是否愿意重谈旧事。${fullName(c)}与${fullName(o)}仍有积怨，暂时没有答应共坐；这次询问没有变成强令和好。`;
   thoughts=[`我还不能当作与${fullName(o)}之间无事发生。`,`有些话想对${fullName(c)}说，却还没能越过心里的结。`];
  }else{
   delete arc.spaceUntil;arc.stage='mending';arc.pending={due:S.turn+3};relAdd(c,o,4);
   text=`陛下分别听完${fullName(c)}与${fullName(o)}的说法，才问她们是否愿意再谈。两人答应过些时日私下坐坐，先把没说清的事说清，不急着恢复旧日称呼。`;
   thoughts=[`我愿再听听${fullName(o)}怎么想，但这回也会把自己的委屈说出来。`,`原来${fullName(c)}记住的是那样的话。我愿认真听一回，不能只盼她忘了。`];
  }
  // Keep the stored order independent of which woman the player visited.
  friendshipRecord(arc,...arc.people.map(byId),kind==='space'?'各自静一静':'问过彼此的心意',text,arc.people[0]===c.id?thoughts:[...thoughts].reverse(),.1);return text;
 };
 return {title:'说起渐远的旧交',por:c,valid,text:`她说起${fullName(o)}。两人${arc.anchor}。\n「${c.friendshipNotes?.[o.id]?.thought||arc.last.text}」\n如今：${FRIENDSHIP_STAGES[arc.stage]}。${arc.pending?'她们已约好，等过些时日再谈。':''}`,choices:[
  {t:'分别听过，再问她们是否愿意谈谈 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('talk')},
  {t:'先让她们各自静一静 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('space')},
  {t:'听她说完，暂不干预'}]};
}
A.friendshipTalk=function(id,other){if(modalOpen)return;const event=friendshipTalkEvent(byId(id),byId(other));if(event)pushEv(event);};
function friendshipPanel(c){
 if(!friendshipArcsActive())return '';
 const notes=Object.values(c.friendshipNotes||{}).filter(n=>n.gen===S.gen).sort((a,b)=>b.turn-a.turn).slice(0,3);
 if(!notes.length)return '';
 return `<div class="friendship-history"><h4>交情流转</h4>${notes.map(n=>{const o=byId(n.other),label=o?.alive?FRIENDSHIP_STAGES[n.stage]:'旧交成追忆';return `<p>${parentLink(n.other)} · <strong>${esc(label)}</strong><br><span class="hint">${esc(n.anchor)}；后来「${esc(n.title)}」。</span><br>她记得：${esc(n.thought)}${o&&friendshipAvailable(c)&&o.alive&&friendshipTense(c,o)?`<br><button class="btn sm" data-onclick="A.friendshipTalk(${c.id},${o.id})">听她谈与${esc(fullName(o))}的旧交</button>`:''}</p>`;}).join('')}</div>`;
}
const friendshipLivedTick=livedRelationshipsTick;
livedRelationshipsTick=function(){friendshipLivedTick();friendshipArcTick();};
const friendshipTopics=consortChatTopics;
consortChatTopics=function(c){
 const topics=friendshipTopics(c),note=friendshipNote(c);
 if(note&&friendshipAvailable(c)){
  const topic={id:'relations',make:()=>({key:'friendship-'+note.stage,stage:`她说起与${note.name}的交情。`,text:note.thought})};
  const at=topics.findIndex(t=>t.id==='relations');if(at<0)topics.push(topic);else topics[at]=topic;
 }return topics;
};
const friendshipCohabScene=cohabScene;
cohabScene=function(name,host,force=false){
 const scene=friendshipCohabScene(name,host,force);
 if(scene&&friendshipTense(scene.a,scene.b)&&['food','needle','reading','courtesy'].includes(scene.kind))return {...scene,kind:'boundaries',title:'旧交仍守礼',text:`${fullName(scene.a)}与${fullName(scene.b)}在廊下相见，依礼问候后各自回房。住得近，却不代表从前的隔阂已经消失；她们仍给彼此留着分寸。`};
 return scene;
};
// A childhood friendship and a shared corridor do not erase later hurt.
const friendshipOldThought=oldFriendLaterThought;
oldFriendLaterThought=function(c,o){return friendshipTense(c,o)?c.friendshipNotes?.[o.id]?.thought||friendshipOldThought(c,o):friendshipOldThought(c,o);};
const friendshipCohabVoice=cohabVoice;
cohabVoice=function(c){
 const note=c.lastCohab,o=note&&byId(note.other);
 if(friendshipArcsActive()&&note?.title==='旧交仍守礼'&&o&&S.turn-note.turn<=3&&inPalace(c))return voiceLine('cohab-distance',`她想起在廊下遇见${fullName(o)}。`,`与${fullName(o)}仍住得近，见面也会问候。只是从前没说清的那些事，还横在心里。`);
 return friendshipCohabVoice(c);
};
