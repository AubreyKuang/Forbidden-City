/* Shared age and temperament make meetings likelier; they never erase rivalry. */
const childCompanionEligible=k=>palacePrayersActive()&&S.children.includes(k)&&childCanVisitCourt(k)&&childInPalace(k)&&kidAge(k)>=3&&kidAge(k)<21&&!k.married&&!k.spouse&&!k.pendingName&&k.hp>=50;
function childCompanionFit(a,b){
 const gap=Math.abs(kidAge(a)-kidAge(b)),x=childDisposition(a),y=childDisposition(b),pair=[x,y].sort().join('|');
 const compatible=[['灵动','好奇'],['仁厚','内敛'],['审慎','内敛'],['仁厚','审慎'],['好胜','爽直']].some(p=>p.sort().join('|')===pair);
 return Math.max(0,4-gap)+(x===y?3:compatible?2:0)+(a.lit>=60&&b.lit>=60?1:0)+(a.mar>=60&&b.mar>=60?1:0);
}
function childCompanionPair(a,b){return childCompanionEligible(a)&&childCompanionEligible(b)&&a!==b&&Math.abs(kidAge(a)-kidAge(b))<=4&&relGet(a,b)>-20;}
function childCompanionActivity(a,b){
 const small=Math.min(kidAge(a),kidAge(b))<6,x=childDisposition(a),y=childDisposition(b);
 if(small)return {title:'廊下搭木城',text:'把小木块搭成一座城，一人添城门，一人摆桥，倒了又一起扶起来。',key:'toys'};
 if(x==='好胜'&&y==='好胜')return {title:'同练也较劲',text:'约着练投壶，起初彼此提醒姿势，后来却为了谁先投中争了几句。两人都肯用功，也都不愿轻易服输。',key:'rivalry'};
 if(['灵动','好奇'].includes(x)&&['灵动','好奇'].includes(y))return {title:'风里的纸鸢',text:'约在御花园试纸鸢，一人改尾翼，一人试风向，把点子写在同一张纸上。',key:'kite'};
 if(['内敛','审慎','仁厚'].includes(x)&&['内敛','审慎','仁厚'].includes(y))return {title:'窗下同一卷书',text:'在窗边各自读书，遇到喜欢的句子才递给对方看。话不多，却不必担心冷场。',key:'books'};
 return {title:'同窗有约',text:'散课后约着猜谜、说见闻，发现彼此记得的趣事各不相同，便轮流讲给对方听。',key:'riddles'};
}
function childCompanionTick(){
 if(!palacePrayersActive()||mourningActive())return;const h=S.childCompanions||={last:-99};if(h.checked===S.turn)return;h.checked=S.turn;
 const people=S.children.filter(childCompanionEligible),pairs=[];
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){const a=people[i],b=people[j];if(!childCompanionPair(a,b))continue;
  const fit=childCompanionFit(a,b);relAdd(a,b,Math.min(.45,fit*.045));
  if(S.turn-(a.peerVisitAt??-99)>=6&&S.turn-(b.peerVisitAt??-99)>=6)pairs.push({a,b,weight:Math.max(1,fit+Math.max(0,relGet(a,b))/12)});
 }
 if(h.pending&&childCompanionEvent())return;
 if(!pairs.length||S.turn-h.last<3||!chance(.3))return;
 let roll=R()*pairs.reduce((n,p)=>n+p.weight,0),pair=pairs.at(-1);for(const p of pairs){roll-=p.weight;if(roll<0){pair=p;break;}}
 const {a,b}=pair,activity=childCompanionActivity(a,b);h.last=S.turn;a.peerVisitAt=b.peerVisitAt=S.turn;
 h.pending={turn:S.turn,a:a.id,b:b.id,activity};
 const text=`${kidName(a)}与${kidName(b)}${activity.text}`,thought=activity.key==='rivalry'?'他人的本事看得见，自己的胜负心也还放不下。':'原来有些话，和这个人说起来格外容易。';
 recordYouthTalk(a,b,'【童伴日常】'+text+' '+thought,'【童伴日常】'+text+' '+thought,activity.key==='rivalry'?[.1,.1]:[.5,.5]);
 relAdd(a,b,activity.key==='rivalry'?-1:3);
 for(const [p,o] of [[a,b],[b,a]]){(p.peerVisits||={})[o.id]=(p.peerVisits?.[o.id]||0)+1;p.peerMemory={person:o.id,turn:S.turn,title:activity.title,text:activity.text};}
}
function childCompanionEvent(){
 const n=S.childCompanions?.pending,a=n&&kidById(n.a),b=n&&kidById(n.b);if(!n||S.turn-n.turn>3||!childCompanionPair(a,b))return null;
 let done=false;const valid=()=>!done&&S.childCompanions?.pending===n&&childCompanionPair(a,b);
 const finish=kind=>{if(!valid())return null;done=true;delete S.childCompanions.pending;const rivalry=n.activity.key==='rivalry',text=kind==='listen'?rivalry?'父皇听双方各说经过，约好轮流计数，不拿输赢贬低对方。':'父皇听两人讲完，留他们继续相伴，也让各自的主意都有回应。':'父皇没有打断，只嘱咐散了之后记得收拾妥当。';
  if(kind==='listen')relAdd(a,b,rivalry?4:2);recordYouthTalk(a,b,`【与${b.name}同坐】${text}`,`【与${a.name}同坐】${text}`);return text;};
 return {title:'皇嗣相伴 · '+n.activity.title,cast:[a,b],present:[a,b],valid,text:`${kidName(a)}，${kidAge(a)}岁，性情${childDisposition(a)}；${kidName(b)}，${kidAge(b)}岁，性情${childDisposition(b)}。\n两人说起近日的相处：${n.activity.text}`,choices:[{t:'听听两人各自怎么说',f:()=>finish('listen')},{t:'让他们自己相处，记得收好东西',f:()=>finish('space')}]};
}
A.childCompanion=function(id){if(modalOpen||!palacePrayersActive())return;const n=S.childCompanions?.pending;if(!n||![n.a,n.b].includes(id))return;const ev=childCompanionEvent();if(ev)pushEv(ev);};
const companionRelTick=kidRelTick;
kidRelTick=function(){const result=companionRelTick();childCompanionTick();return result;};
const companionRelEvent=relEvent;
relEvent=function(){return palacePrayersActive()&&childCompanionEvent()||companionRelEvent();};
const companionPanel=youthPanel;
youthPanel=function(k){const html=companionPanel(k),m=k.peerMemory,n=S.childCompanions?.pending;if(!palacePrayersActive()||!m)return html;const friend=kidById(m.person);
 return html+detailSection((k.peerVisits?.[m.person]||0)>=3?'常伴的人':'结伴与近事',`<p>${friend?esc(friend.name):'旧日同伴'} · ${esc(m.title)}</p><p>${esc(m.text)}</p>${n&&[n.a,n.b].includes(k.id)&&childCompanionEvent()?`<button class="btn jade" onclick="A.childCompanion(${k.id})">听听两人相处的近事</button>`:''}`);};
const companionVoice=childVoicePool;
childVoicePool=function(k){const pool=companionVoice(k),m=k.peerMemory,friend=m&&kidById(m.person);if(!palacePrayersActive()||!childCompanionEligible(k)||!friend?.alive||S.turn-m.turn>12)return pool;
 return [...pool,voiceLine('named-companion','说到那位熟悉的同伴，语气自然起来。',`上回和${friend.name}一起${m.title}，到现在还记得。下回有了新主意，也想先说给${friend.name}听。`)];};
