/* Friends have their own conversations; favor changes the subject, not their whole personality. */
function friendFavorState(a,b){
 if(a.favor>=60&&b.favor>=60)return 'both-favored';
 if(a.favor<30&&b.favor<30)return 'both-overlooked';
 if(Math.max(a.favor,b.favor)>=60&&Math.min(a.favor,b.favor)<30)return 'unequal';
 return null;
}
function friendFavorReady(a,b){
 const available=c=>inPalace(c)&&!c.maid&&!(c.hp<40)&&!(c.delivery&&!c.delivery.settled)&&!['悲恸','心如死灰','惶恐','怨恨'].includes(xinOf(c));
 return !!(!S.over&&!mourningActive()&&a!==b&&available(a)&&available(b)&&socialPair(a,b)&&relGet(a,b)>=35&&!isRival(a,b)&&!isRival(b,a)&&
  friendFavorState(a,b)&&S.turn-(S.friendFavorTalks?.[rk(a,b)]?.turn??-99)>=6&&S.turn-(S.flags.lastFriendFavorTalk??-99)>=3);
}
function friendFavorWords(a,b,state){
 const style=companionStyle(a),other=companionStyle(b);
 if(state==='both-favored')return [
  style==='proud'?'你今日气色好，我也替你高兴。旁人爱拿咱们比，我偏不肯为这个冷落你。':style==='direct'?'你得了好消息，我高兴；我有了好事，也头一个想告诉你。何必总论谁多谁少。':style==='maker'?'你上回说的那本书，我终于找到了。近来都有好消息，也别把原先约好的事忘了。':style==='reserved'?'近来各自都好，自然可喜。只是你来坐一会儿，不必每次先问陛下在哪里。':'看你如今过得好，我心里也欢喜。咱们还像从前一样，得空就坐在一处。',
  other==='proud'?'旁人说什么随他们。你记得来，我这里便给你留着位置。':other==='bright'?'那就约好了，下回有趣的事也要先讲给我听，可别只报喜不说笑话。':'好。今日先喝茶，说说咱们自己的事。'
 ];
 if(state==='unequal')return [
  a.trait==='善妒'?'说不酸是假话，我也会嫉妒。可我知道，你没有负我；我得慢慢理清，不该把这份委屈撒到你身上。':style==='proud'?'我也是眼热的，没必要装作不在意。可你是我的朋友，我不愿因为这些，就盼着你也不好。':style==='direct'?'我虽眼热，却并不嫉妒你。我也想被惦记，可你的好，不是我的错处。':a.trait==='淡泊'?'我不大惯那些热闹，你喜欢便好。只是答应一同喝的茶，仍要算数。':style==='reserved'?'我也有失落的时候，但不是你的过错。你仍肯来看我，这份交情，我分得清。':style==='maker'?'我也羡慕你，只是不愿把这份羡慕变成怨。先前答应一起做完的事，我还记着。':'我虽眼热，却并不嫉妒。盼你过得好是真的，盼你得空仍来看看我，也是真的。',
  other==='proud'?'你不必在我面前强作大度。今日我来，是想见你，也不是要你夸我。':other==='direct'?'你心里不舒坦就直说。陛下的心意我替不了，可我答应来陪你，总还能做到。':other==='reserved'?'不必为了让我安心，把自己的失落都收起来。你愿说，我便听。':'我来陪你，不是来让你羡慕的。你的话，我听见了；往后也不会只在得意时才记得你。'
 ];
 return [
  a.trait==='淡泊'?'这里清静些，也有清静的好。你若心里难受，别一个人硬熬，来我这里坐坐。':style==='proud'?'我仍会不甘心，可也不肯让你一个人受着。别怕，我还陪着你。':style==='direct'?'别怕，我还陪着你。今日先把饭吃好，往后的事，咱们慢慢想。':style==='maker'?'那页没做完的活，咱们明日接着做。别怕，我还陪着你，日子不只剩下等人来。':style==='reserved'?'不必勉强说自己不难过。你想安静，我便坐着；想说话，我也在。':'别怕，我还陪着你。灯还亮着，今日不必一个人等到深夜。',
  other==='proud'?'我不会就这样认输。只是今晚，有你在，我确实好受些。':other==='bright'?'那我明日带点心来。即使没人传好消息，也总能给你讲件好笑的事。':other==='reserved'?'好。也不必替我许什么，只这样坐一会儿就够了。':'好。你难过的时候，也别把我留在门外。'
 ];
}
function friendFavorEvent(only=null,partner=null){
 const people=harem(),pairs=[];
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=people[i],b=people[j];if(only&&a!==only&&b!==only||partner&&a!==partner&&b!==partner||!friendFavorReady(a,b))continue;
  pairs.push([a,b]);
 }
 if(!pairs.length||!only&&!chance(.3))return null;
 pairs.sort((x,y)=>relGet(...y)-relGet(...x)||x[0].id-y[0].id);
 let [a,b]=pairs[0];const state=friendFavorState(a,b);if(state==='unequal'&&a.favor>b.favor)[a,b]=[b,a];
 const key=rk(a,b),lines=friendFavorWords(a,b,state),previous=S.friendFavorTalks?.[key],title={'both-favored':'两人都有好消息',unequal:'眼热与交情','both-overlooked':'别怕，我还陪着你'}[state];let shown=false,done=false;
 const valid=()=>!done&&(shown?inPalace(a)&&inPalace(b)&&relGet(a,b)>=35&&!isRival(a,b)&&!isRival(b,a):friendFavorReady(a,b))&&friendFavorState(a,b)===state;
 const dialogue=`${fullName(a)}：“${lines[0]}”\n${fullName(b)}：“${lines[1]}”`;
 const callback=previous&&previous.state!==state?`两人还记得${previous.date}说过的话。如今恩宠境遇变了，她们又在同一盏茶前坐下。\n`:'';
 const finish=join=>{if(!valid())return null;done=true;const text=join?'你坐下听完，没有让她们比较谁更得宠。她们也没有因此许下替对方争宠的承诺。':'你放轻脚步，把余下的时辰留给她们。两人继续说自己的日子。';
  palaceSupportMemory(a,b,'friend-favor',a.palace,text,`与${fullName(b)}谈过恩宠与交情。${text}`,`与${fullName(a)}谈过恩宠与交情。${text}`,.4,.4);save('auto');return text;};
 return {title,por:a,cast:[b],present:[a,b],valid,text:`你经过${a.palace}，听见两位交好的妃嫔低声说话。\n${callback}${dialogue}`,onShow:()=>{
  if(shown)return;shown=true;S.flags.lastFriendFavorTalk=S.turn;(S.friendFavorTalks||={})[key]={turn:S.turn,date:dateStr(),state,people:[a.id,b.id]};relAdd(a,b,3);
  for(const [person,other,said,heard] of [[a,b,lines[0],lines[1]],[b,a,lines[1],lines[0]]])person.friendFavorMoment={turn:S.turn,other:other.id,state,said,heard};
  palaceSupportMemory(a,b,'friend-favor',a.palace,dialogue,`【与${fullName(b)}谈心】我说：“${lines[0]}”她答：“${lines[1]}”`,`【与${fullName(a)}谈心】她说：“${lines[0]}”我答：“${lines[1]}”`,.65,.65);cchg(a,{mood:3});cchg(b,{mood:3});
 },choices:[{t:'把说话的时辰留给她们',f:()=>finish(false)},{t:'坐下听她们说说',f:()=>finish(true)}]};
}
A.friendFavorTalk=function(id,other){if(modalOpen)return;const c=byId(id),friend=byId(other);if(!c||!friend)return;const ev=friendFavorEvent(c,friend);if(ev)pushEv(ev);};
function friendFavorPanel(c){
 const note=c.friendFavorMoment,other=note&&byId(note.other);
 const last=note&&other&&S.turn-note.turn<12?`<p class="hint">与${parentLink(other.id)}说过的话：“${esc(note.said)}”<br>她答：“${esc(note.heard)}”</p>`:'';
 const friend=harem().filter(o=>o!==c&&friendFavorReady(c,o)).sort((a,b)=>relGet(c,b)-relGet(c,a))[0];
 return last+(friend?`<button class="btn sm" onclick="A.friendFavorTalk(${c.id},${friend.id})">听她与${esc(fullName(friend))}谈心</button>`:'');
}
