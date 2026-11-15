/* Some candidates have a life shared with a resident before either entered court.
   The introduction is rolled once with the roster, never by a view or a reload. */
function oldFriendEligible(g,c){
  return inPalace(c)&&!c.maid&&c.age>=18&&g.age>=18&&!g.kin?.[c.id]&&!c.kin?.[g.id]&&clanKey(g)!==clanKey(c)&&
    !g.timeTraveler&&!c.timeTraveler&&!g.rescue&&!c.rescue&&Math.abs(g.fam.p-c.fam.p)<=40&&
    !/西域|东瀛|海西/.test(g.fam.t+c.fam.t)&&(c.oldCourtFriends||[]).length<3;
}
function makeOldFriendTie(g,c){
  if(!oldFriendEligible(g,c))return null;
  const away=Math.max(0,Math.floor((S.turn-(c.enteredAt??S.turn))/12));
  const ago=Math.max(away+1,c.age-14,g.age-14),childhood=Math.min(c.age,g.age)-ago>=5;
  const memories=childhood?['小时候在两家花宴上一起藏过花签','幼时同在家塾听过课，替彼此拾过掉下的书页','小时候在长辈寿宴上分过一碟桂花糕']:
    ['两家长辈常有往来，年节时彼此都见过家书里的名字','两家多年互通节礼，家中长辈曾托她捎过问候'];
  const tie={id:c.id,kind:childhood?'childhood':'households',memory:pick(memories),created:S.turn,gen:S.gen};
  if(childhood)tie.metTurn=S.turn-ago*12;
  g.oldCourtFriend=tie;
  g.kinNote=[g.kinNote,childhood?`与${fullName(c)}自幼相识，两家交好`:`与${fullName(c)}两家素有往来`].filter(Boolean).join('；');
  story(g,`【宫门前的旧缘】${fullName(c)}与她${tie.memory}。此次候选时又听见了熟悉的名字。`);
  return tie;
}
function assignSelectionOldFriends(){
  if(!kinVisitsEnabled())return;
  let count=0;const used=new Set();
  for(const g of S.cands){
    if(count>=2)break;if(g.oldCourtFriend){used.add(g.oldCourtFriend.id);count++;continue;}
    const options=harem().filter(c=>!used.has(c.id)&&oldFriendEligible(g,c));
    if(!options.length||!chance(.35))continue;
    const c=pick(options);makeOldFriendTie(g,c);used.add(c.id);count++;
  }
}
const oldFriendGenCands=genCands;
genCands=function(...args){const result=oldFriendGenCands.apply(this,args);assignSelectionOldFriends();return result;};
function oldFriendFeeling(c,g){
  if(relGet(c,g)<0||isRival(c,g)||isRival(g,c))return {kind:'guarded',delta:0,text:'往日认识不等于今日没有隔阂，眼下只按礼相见。'};
  if(isSolitary(c)||['淡泊','沉静'].includes(c.trait))return {kind:'quiet',delta:0,text:'还记得宫外那些事。宫里规矩可以问我，闲时各自清静便好。'};
  if(TRAITS[c.trait]?.jealous||c.trait==='痴情')return {kind:'mixed',delta:-8,text:'认出旧人，自然欢喜；可想到往后也要分这份恩宠，心里仍有些发涩。旧情还在，忐忑也是真的。'};
  return {kind:'welcome',delta:4,text:'原来是你。往后不认识路就来问我，也终于有人听得懂那些家里的旧事了。'};
}
function recordOldFriendAdmission(g){
  const tie=g.oldCourtFriend,c=byId(tie?.id);
  if(!kinVisitsEnabled()||!tie||tie.admittedAt!=null||!inPalace(c)||!inPalace(g)||tie.gen!==S.gen)return;
  tie.admittedAt=S.turn;
  // A newly generated random relationship is replaced by their established past;
  // an explicit rivalry remains a rivalry.
  if(!isRival(c,g)&&!isRival(g,c))S.rel[rk(c,g)]=tie.kind==='childhood'?42:32;
  const feeling=oldFriendFeeling(c,g);relAdd(c,g,feeling.delta);cchg(c,{mood:feeling.kind==='mixed'?-3:3});
  c.oldCourtFriends||=[];if(!c.oldCourtFriends.includes(g.id))c.oldCourtFriends.push(g.id);
  const text=`${fullName(g)}选秀留宫，与${fullName(c)}重逢。两人${tie.memory}，如今又有了同在宫中的身份。`;
  const reply=isSolitary(g)?'她记得从前的我，已很难得。我仍想保留自己的清静，不必日日相伴。':feeling.kind==='mixed'?'她肯认我，也有自己的难处；旧交不能让我把她的照应当成理所当然。':'有人认得宫门外的我，心里安稳些。往后也要学着照应她。';
  livedRecord([c,g],'bond','宫门旧识',`old-friend:${S.gen}:${c.id}:${g.id}`,text,[feeling.text,reply]);
}
const oldFriendAddConsort=addConsort;
addConsort=function(...args){const result=oldFriendAddConsort.apply(this,args);recordOldFriendAdmission(args[0]);return result;};
function selectionOldFriendHint(g){
  const tie=g.oldCourtFriend,c=byId(tie?.id);if(!tie||!c)return '';
  return `旧缘：${fullName(c)}与她${tie.memory}。${inPalace(c)?`她听到名字时说：“${oldFriendFeeling(c,g).text}”`:'故人眼下不在宫中，不能前来相迎。'}`;
}
const oldFriendSpeech=selectionSpeech;
selectionSpeech=function(c){const speech=oldFriendSpeech(c),hint=selectionOldFriendHint(c);if(hint)speech.stage+='\n'+hint;return speech;};
const oldFriendCohortHTML=selectionCohortHTML;
selectionCohortHTML=function(c){
  const people=[...(c.oldCourtFriends||[]),...(c.oldCourtFriend?[c.oldCourtFriend.id]:[])];
  return oldFriendCohortHTML(c)+(people.length?`<div>宫门旧识 · ${[...new Set(people)].map(id=>parentLink(id)).join('、')}</div>`:'');
};
function oldFriendLaterThought(c,o){
  if(relGet(c,o)<0||isRival(c,o)||isRival(o,c))return '从前相识是真的，后来有了隔阂也是真的，不能一句旧情便当作无事发生。';
  if(isSolitary(c)||['淡泊','沉静'].includes(c.trait))return '亲疏不必靠日日相聚证明。若想说家里的事，清静时来坐一会便好。';
  if(c.favor<35&&o.favor>=55)return TRAITS[c.trait]?.jealous?'看她得宠，心里难免发涩。记得她的旧情，却也需要些时候安放自己的失落。':'我虽眼热，却不愿把你的好日子看成我的委屈；从前的情分还在。';
  if(c.favor<35&&o.favor<35)return '别怕，我还陪着你。今夜一起坐坐，说些宫外的旧事也好。';
  if(c.favor>=55&&o.favor>=55)return '你我近来都忙，仍想留一盏茶的时辰；从前说到一半的旧事，还没讲完。';
  if(c.favor>=55&&o.favor<35)return '我如今蒙些眷顾，也还记得从前。你若愿意，今夜把那碟家乡点心分着吃。';
  return '入宫后各有各的日子，仍能坐下来把家里的旧事说完，已很难得。';
}
function oldFriendLifeTick(){
  if(!kinVisitsEnabled())return;
  for(const g of S.consorts){
    const tie=g.oldCourtFriend,c=byId(tie?.id);
    if(!tie||tie.gen!==S.gen||tie.admittedAt==null||tie.followed||S.turn-tie.admittedAt<6||!inPalace(c)||!inPalace(g))continue;
    tie.followed=S.turn;
    const text=`${fullName(c)}与${fullName(g)}重逢已过半年。说起${tie.memory}的旧事，如今${c.favor>=55&&g.favor>=55?'两人都常蒙召见':c.favor<35&&g.favor<35?'两人近来都少蒙召见':Math.abs(c.favor-g.favor)>=20?'两人的受眷已有不同':'各自渐渐住惯'}。${relGet(c,g)<0?'她们按礼寒暄后各自离开。':'她们各说了几句近况，没有替对方决定往后的日子。'}`;
    livedRecord([c,g],'bond','旧识各有际遇',`old-friend:${S.gen}:${c.id}:${g.id}`,text,[oldFriendLaterThought(c,g),oldFriendLaterThought(g,c)]);
  }
}
const oldFriendLivedTick=livedRelationshipsTick;
livedRelationshipsTick=function(...args){const result=oldFriendLivedTick.apply(this,args);oldFriendLifeTick();return result;};
