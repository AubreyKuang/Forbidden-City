/* Older palace children test boundaries in ways that reflect a stable temperament. */
function royalOutingEligible(k){return palacePrayersActive()&&S.children.includes(k)&&childCanVisitCourt(k)&&childInPalace(k)&&kidAge(k)>=12&&kidAge(k)<21&&!k.married&&!k.spouse&&!k.betrothal&&!k.pendingName&&k.hp>=55;}
const ROYAL_OUTING_STYLES={
 灵动:{chance:.4,sneak:true,place:'灯市',line:'只想看看宫外的花灯究竟是什么模样，没想到一看就忘了时辰。'},
 好奇:{chance:.32,sneak:true,place:'书肆与匠人铺子',line:'书里说的做法总看不明白，想亲眼看匠人怎么做。可没先说一声，让大家担心了。'},
 爽直:{chance:.18,place:'街市',line:'整日在宫里听别人讲，心里实在憋得慌。我想亲眼看看，也愿把规矩先说清。'},
 好胜:{chance:.14,place:'京中校场',line:'想看看外头的人怎样练骑射。不必说我的身份，凭本事较量才算数。'},
 仁厚:{chance:.12,place:'施粥处',line:'听说外头在施粥，想去看看有什么能帮的。请先让管事的人说说真正缺什么。'},
 内敛:{chance:.08,place:'旧书铺',line:'我把想去的地方写在这张纸上了。若可以，不必许多人陪着，留两位随侍便好。'},
 审慎:{chance:.12,place:'城南书市',line:'往返的路、随侍的人和归来的时辰，都已经拟好了。先请父皇准许，再去安排。'},
 自矜:{chance:.1,place:'京中诗会',line:'想听听旁人怎样评诗。暂不报封号，也不让人因为出身便说我的句子好。'}
};
function royalOutingTick(){
 if(!palacePrayersActive()||mourningActive())return;
 const h=S.royalOutings||={last:-99};if(h.lastTick===S.turn)return;h.lastTick=S.turn;
 if(h.pending&&royalOutingEligible(kidById(h.pending.child)))return;delete h.pending;
 if(S.turn-h.last<6)return;
 const pool=S.children.filter(k=>royalOutingEligible(k)&&S.turn-(k.lastOuting??-99)>=12);if(!pool.length)return;
 const k=pick(pool),style=ROYAL_OUTING_STYLES[childDisposition(k)];if(!chance(style.chance))return;
 h.last=S.turn;k.lastOuting=S.turn;h.pending={child:k.id,turn:S.turn,trait:childDisposition(k),place:style.place,sneak:!!style.sneak,line:style.line};
 if(style.sneak)heartRecord(k,'宫门外一程',`瞒着宫中长辈溜去${style.place}，随侍察觉后跟上，侍卫在回程时将自己接回宫中，平安归来。`,'外头果然新鲜，可回来才知道，许多人一直在找自己。',-.2);
}
function royalOutingEvent(){
 const n=S.royalOutings?.pending,k=n&&kidById(n.child);if(!n||!royalOutingEligible(k))return null;
 let done=false;const valid=()=>!done&&S.royalOutings?.pending===n&&royalOutingEligible(k);
 const finish=mode=>{if(!valid())return null;done=true;delete S.royalOutings.pending;
  const text=mode==='guided'?`父皇听完，约定今后先请准、由随侍护送；随后安排去${n.place}走一程，按时归宫。`:mode==='listen'?n.sneak?'父皇先问平安，再听宫外见闻，约定今后不再瞒着出宫。':'父皇听完出宫的打算，暂未允准，答应择日再议。':n.sneak?'父皇严肃责问擅自出宫，让自己抄记宫门规矩、暂停这次出游打算。':'父皇没有准许此次出宫，让自己先安心读书。';
  k.love=clamp(k.love+(mode==='forbid'?-3:4));if(mode==='guided')k.lit=clamp(k.lit+2);
  const thought=mode==='forbid'?['灵动','爽直'].includes(n.trait)?'心里还想出去，却也知道这一回让人担心，嘴上倔着，仍记下了归时。':'这回没有获准，先把想看的地方记在纸上。':n.trait==='审慎'?'先把安排说清，想去远处，也可以守住约定。':n.trait==='灵动'?'下回还想看新鲜事，但会记得先说一声，再热闹也要按时回来。':'见闻可以慢慢添，牵挂自己的人也该有个交代。';
  heartRecord(k,n.sneak?'回宫问话':'宫外之约',text,thought,mode==='forbid'?-.3:.5);
  for(const m of mothersOf(k).filter(inPalace))story(m,`【孩子的消息】宫人转告：${kidName(k)}${n.sneak?'曾擅自去'+n.place+'，已平安回宫，陛下问过缘由。':'请去'+n.place+'，'+(mode==='guided'?'获准由随侍护送，按约归来。':'尚未成行。')}`);
  return text;};
 return {title:n.sneak?'宫门之外 · 悄悄溜出去':'宫外之约 · 先来请准',por:k,present:[k],valid,text:`${kidName(k)}，${kidAge(k)}岁，性情${n.trait}。\n${n.sneak?'侍卫来报：孩子悄悄去了'+n.place+'，已平安接回。你让旁人退开，问起缘由。':'孩子带着去'+n.place+'的打算来请准。'}\n“${n.line}”`,choices:[
  {t:n.sneak?'先问平安，听完见闻再讲规矩':'听听打算，择日再议',f:()=>finish('listen')},
  {t:'约定先请准与归时，安排随侍同往',f:()=>finish('guided')},
  {t:n.sneak?'严肃责问，教清宫门规矩':'暂不准行，先安心读书',f:()=>finish('forbid')}
 ]};
}
A.royalOuting=function(id){if(modalOpen||!palacePrayersActive()||S.royalOutings?.pending?.child!==id)return;const ev=royalOutingEvent();if(ev)pushEv(ev);};
const outingLifeTick=childLifeTick;
childLifeTick=function(monthly=false){const result=outingLifeTick(monthly);if(monthly)royalOutingTick();return result;};
const outingYouthEvent=youthEvent;
youthEvent=function(){return palacePrayersActive()&&royalOutingEvent()||outingYouthEvent();};
const outingYouthPanel=youthPanel;
youthPanel=function(k){return outingYouthPanel(k)+(palacePrayersActive()&&S.royalOutings?.pending?.child===k.id&&royalOutingEligible(k)?`<p><button class="btn jade" data-onclick="A.royalOuting(${k.id})">${S.royalOutings.pending.sneak?'问问偷偷出宫的事':'听听出宫的打算'}</button></p>`:'');};
