/* Both sides use the same wedding register and keep their own chronicle. */
const betrothalJourneysActive=()=>royalNatalMatchActive()&&PalaceActions.betrothalJourneys;

function childhoodBetrothalPair(k){
 if(!betrothalJourneysActive()||!k?.alive||k.married||k.spouse||k.pendingName||k.removedFromRoyal||!royalNatalEngaged(k))return null;
 const b=k.betrothal,e=natalEntry(b.host,b.personId),p=e?.p;
 if(!p?.alive||p.married||p.spouse||p.consortId||!royalNatalEngaged(p)||p.betrothal.personId!==k.id||p.betrothal.turn!==b.turn||
    !royalNatalParentageEligible(p)||(b.turn-k.born)/12>=12||(b.turn-p.born)/12>=15)return null;
 return {k,b,p,host:e.c};
}

function betrothalPairRecord(pair,title,text,royalThought,relativeThought){
 const {k,p,b}=pair;
 if(b.marriedOnly)p.story ||= [];
 livedRecord([k,p],'family',title,`${b.marriedOnly?'married-travel':'childhood-betrothal'}:${k.id}:${p.id}:${b.turn}`,text,
  [royalThought,relativeThought].filter((_,i)=>i===0?k.alive!==false:p.alive!==false));
}

function childhoodBetrothalMeetReady(pair){
 if(!pair||S.over||mourningActive())return false;
 const {k,p,b}=pair,age=kidAge(k),otherAge=natalAge(p),notes=b.childhood;
 return childInPalace(k)&&!k.lost&&!b.bond?.petition&&!p.jailed&&!p.exiled&&!p.away&&!p.royalCompanionTrip&&
  age>=4&&age<16&&otherAge>=4&&otherAge<16&&(notes?.count??0)<3&&S.turn-(notes?.last??-99)>=4;
}

const CHILDHOOD_BETROTHAL_SCENES=[
 {title:'两小无猜 · 谁分点心',item:'画在包纸上的小兔',
  young:'桌上只剩一块兔子酥。两个孩子都看见了，又同时转开脸，装作正忙着数碟边的花。',
  older:'案上有一碟兔子酥。两人说起小时候大人总问他们将来住哪儿，笑说今日倒该先把最后一块酥分明白。',
  curious:'“大人倒记得我们同岁不同月，可有人问过你爱吃哪一种？”',
  careful:'“我先掰，你先挑。大小若还不一样，就把碎屑留给我。”',
  reply:'“那下回你挑形状，我来挑馅。谁也别只顾着让谁。”',
  quiet:'“其实我就喜欢裂开的那块。你瞧，这边能看见里面的馅。”',
  ending:'两人一人掰半块，还用包纸画了一只少只耳朵的小兔，笑了好一阵。'},
 {title:'两小无猜 · 燕尾朝哪儿',item:'折歪尾巴的纸燕',
  young:'窗纸透着风。一只刚折的小燕子落在门槛上，两个孩子都想把翘起来的尾巴按平。',
  older:'廊下有一阵穿堂风。孩子们拿纸燕试风，一只刚越过门槛，另一只已经钻到了矮凳下。',
  curious:'“折得正的飞不远。要不故意折歪一边，看看它往哪儿去？”',
  careful:'“先在砖缝这儿起飞，两只用一样大的纸，这才算数。”',
  reply:'“尾巴归你试，翅膀归我折。输了也要一起把纸燕捡回来。”',
  quiet:'“你试的时候我替你挡一下风。若还掉下来，再想别的法子。”',
  ending:'一只纸燕飞过两块方砖。两人蹲在地上记下飞得最远的折法，给那只歪尾巴的燕子留了名字。'},
 {title:'两小无猜 · 两笔画一程',item:'两人合画的小舆图',
  young:'大人说话还未说完，两个孩子已把桌角画成一条小河，谁也猜不出哪一笔是对方添的。',
  older:'两人摊开半张旧舆图，各在想去的地方点了一点。一人点在山脚，一人点在渡口，连起来竟正好顺路。',
  curious:'“要是走到图上没有画的地方，我们就自己补一笔吧？”',
  careful:'“先把可以歇脚的地方画下来。若天晚了，我们也知道在哪儿等。”',
  reply:'“我要在水边添一间卖汤饼的铺子，等真去时，看我画得准不准。”',
  quiet:'“这张给我描一份吧。往后见到你想看的地方，我也还记得。”',
  ending:'他们各抄了一张小舆图，把对方添的那一笔特意留在原处。'}
];

function childhoodBetrothalEvent(pair,venue,available){
 if(!childhoodBetrothalMeetReady(pair)||!available())return null;
 const {k,p,b}=pair,row=CHILDHOOD_BETROTHAL_SCENES[b.childhood?.count??0],first=!b.childhood?.count;
 const age=Math.min(kidAge(k),natalAge(p)),calm=['仁厚','审慎','内敛','自矜'].includes(childDisposition(k));
 const quiet=['沉静','温婉','温厚','才女','有文才'].includes(natalTrait(p));
 const royal=calm?row.careful:row.curious,relative=quiet?row.quiet:row.reply;
 const greeting=first?(age<9?`两人听大人说过彼此的名字，见了面才知，平日想问的原来都是些很小的事。`:
  '两人依着长辈教的礼数互相问了好，一说起眼前的小事，又渐渐忘了照着先前背过的话说。'):'这回见面，已能认出对方一有主意就忍不住的那点神情。';
 const valid=()=>childhoodBetrothalPair(k)?.p===p&&k.betrothal===b&&childhoodBetrothalMeetReady(pair)&&available();
 const settle=keep=>{
  if(!valid())return null;
  const notes=b.childhood||={count:0,items:[]};
  notes.last=S.turn;notes.count++;
  if(keep)notes.items.push(row.item);
  strengthenChildhoodBond(pair,keep?7:5);
  const shared=`${k.name}与${p.name}在${venue}相见，长辈就在近旁。${row.ending}${keep?`临走把${row.item}留作纪念。`:''}`;
  betrothalPairRecord(pair,row.title,shared,calm?'原来可以和对方商量着来，连不大好意思说的话也能开口。':'下回若再见，想看看对方会先想到什么主意。',
   quiet?'说的时候心里还打鼓。见对方真的肯等我说完，便也笑了。':'大人说起婚帖总那么郑重。到头来，倒是眼前这一件小事最有意思。');
  return shared;
 };
 return {title:row.title,cast:[k,natalPortrait(p)],present:[k],valid,
  text:`${venue}，随行长辈让两个孩子坐在自己看得见的地方。${greeting}${age<10?row.young:row.older}\n${k.name}问：“${royal.slice(1,-1)}”\n${p.name}说：“${relative.slice(1,-1)}”`,
  choices:[{t:'让他们自己商量，再玩一会儿',f:()=>settle(false)},{t:'把两人做的小东西留作纪念',f:()=>settle(true)},{t:'先陪长辈回席，改日再见'}]};
}

function betrothedYouthVisitReady(p){
 const pair=royalNatalEngaged(p)&&childhoodBetrothalPair(kidById(p.betrothal.personId));
 return pair?.p===p&&childhoodBetrothalMeetReady(pair);
}

function childhoodBetrothalVisit(c,p){
 const k=royalNatalEngaged(p)&&kidById(p.betrothal.personId),pair=childhoodBetrothalPair(k);
 return pair?.p===p?childhoodBetrothalEvent(pair,c.palace+'探亲时',()=>natalInPalace(c,p)):null;
}

function betrothedBanquetPairs(people){
 return people.filter(k=>k.sex&&S.children.includes(k)).map(childhoodBetrothalPair)
  .filter(pair=>childhoodBetrothalMeetReady(pair));
}

function betrothedBanquetGuests(draft,people){
 return detailSection('随长辈赴宴的外家孩子',betrothedBanquetPairs(people).map(({k,p})=>{
  const on=(draft.betrothedGuests||[]).includes(k.id);
  return `<button class="btn sm ${on?'on':''}" aria-pressed="${on}" data-onclick="A.banquetBetrothed(${k.id})">${on?'已请':'请'}${esc(p.name)}随长辈赴宴</button>`;
 }).join(' '));
}

A.banquetBetrothed=function(id){
 const draft=banquetDraft(),feast=draft&&banquetKind(draft.kind);
 if(modalOpen||!feast||!betrothedBanquetPairs(banquetAttendees(draft,feast)).some(({k})=>k.id===id))return;
 const guests=draft.betrothedGuests||=[];
 draft.betrothedGuests=guests.includes(id)?guests.filter(k=>k!==id):[...guests,id];
 render();
};

function betrothedBanquetEvents(draft,feast,people){
 return betrothedBanquetPairs(people).flatMap(pair=>{
  const {k,p}=pair;
  const invited=(draft.betrothedGuests||[]).includes(k.id),visiting=p.visit&&byId(p.visit.host);
  const available=()=>invited||!!visiting&&natalInPalace(visiting,p);
  const ev=childhoodBetrothalEvent(pair,feast.title+'散席前',available);
  return ev?[ev]:[];
 });
}

function marriedChildhoodPair(k){
 const s=k?.spouse;
 if(!betrothalJourneysActive()||!k?.alive||!k.married||s?.alive===false||s?.natalHost==null)return null;
 const e=natalEntry(s.natalHost,s.personId),p=e?.p;
 if(!p?.alive||!p.married||p.consortId||p.spouse?.royalId!==k.id)return null;
 const old=k.story?.find(e=>e.life?.title==='外家定亲'&&e.life.people?.some(person=>person.id===p.id));
 const b=s.childhoodBetrothal||(old&&{turn:old.life.turn});
 return b?{k,p,host:e.c,b}:null;
}

function childhoodJourneyPair(k){
 const pair=childhoodBetrothalPair(k)||marriedChildhoodPair(k);
 if(pair||!royalHouseholdLifeActive()||!k?.alive||!k.married||!k.spouse||k.spouse.alive===false||k.spouse.trust<58)return pair;
 const p=k.spouse;
 const official=p.personId!=null?careerPeople().find(e=>e.p.id===p.personId)?.p:null;
 if(official&&(official.alive===false||official.away||official.commission||official.diplomaticJourney||official.incognitoCase))return null;
 return {k,p,host:null,b:{turn:p.marriedAt,marriedOnly:true}};
}

function strengthenChildhoodBond({k,p,b},amount){
 relAdd(k,p,amount);
 if(k.married){
  if(Number.isFinite(k.spouse.trust))changeHouseholdAffection(k,amount);
 }else if(royalNatalCourtshipActive()){
  const bond=b.bond||=royalNatalInitialBond(k,p);
  bond.royal=clamp(bond.royal+amount);bond.relative=clamp(bond.relative+amount);
 }
}

function betrothedTravelPair(k){
 const pair=childhoodJourneyPair(k);
 if(!pair)return null;
 const {p,b}=pair;
 if(b.bond?.petition||b.bond?.royal<=36||b.bond?.relative<=36||k.household?.pregnancies?.length)return null;
 const age=b.marriedOnly?18:royalNatalAge('journey');
 if(royalNatalEarlierAges()&&kidAge(k)<age)return null;
 return natalAge(p)>=age&&(p.hp??100)>=50&&!p.visit&&!p.away&&!p.jailed&&!p.exiled&&!p.royalCompanionTrip&&
  !p.natalPregnancy&&!p.commission&&!p.diplomaticJourney&&!p.incognitoCase&&!p.yiAudit?pair:null;
}

function betrothedTravelButton(k){
 return !k.royalTravel&&royalTravelCanLeave(k)&&betrothedTravelPair(k)?
  `<button class="btn jade" data-onclick="A.planBetrothedTravel(${royalActionArg(k.id)})">${royalHouseholdLifeActive()&&k.married&&!marriedChildhoodPair(k)?'商议夫妻同游':'商议结伴游历'}</button>`:'';
}

A.planBetrothedTravel=function(id){
 const k=royalById(id);
 if(modalOpen||mourningActive()||!k||k.royalTravel||!royalTravelCanLeave(k)||!betrothedTravelPair(k))return;
 requestRoyalTravel(k);
 pushEv(royalTravelEvent(k));
};

function betrothedTravelReply({k,p,b}){
 if(b.marriedOnly)return `\n${k.name}与${p.name}一同署了请出京游历的折子。两人各画了一处想去的地方，也已约好沿途写信报平安。`;
 const line=['沉静','温婉','温厚','才女','有文才'].includes(natalTrait(p))?
  '我愿意一道走。我也会带一本手记，想按自己的见闻慢慢写。':
  '这一路我也想去。到了地方，让我自己向当地人问路，可别把话都替我说完了。';
 return `\n${k.name}问过${p.name}的心意。家中长辈回信，愿意随行照应。${p.name}在信末亲笔写道：“${line}”`;
}

function startBetrothedTravel(pair){
 const {k,p,b,host}=pair,r=k.royalTravel;
 r.companion={host:host?.id??null,personId:p.id,name:p.name,departed:S.turn,betrothalTurn:b.turn,stops:[],
  ...(b.marriedOnly?{marriedOnly:true}:{})};
 p.royalCompanionTrip={royalId:k.id,departed:S.turn};
 const item=b.childhood?.items?.at(-1);
 const plan=k.married?'沿途同看山河，也各写一本手记。':'按两家商定的行程分宿。';
 const text=`${k.name}与${p.name}商定结伴走这程路，随行长辈与侍从都已到齐。${plan}每到驿站报平安。${item?`行囊里还带着幼时留下的${item}。`:''}`;
 betrothalPairRecord(pair,b.marriedOnly?'夫妻同游':'旧约同行',text,
  b.marriedOnly?'两人在府里常说些走一步便要做的事，出来之后，终于可以听听各自想走的是哪一条路。':'小时候总在问对方喜欢什么。今日终于可以听听同一段路在对方眼里是什么模样。',
  '这趟路是自己点头要走的。希望回家时，也有一册按自己眼光记下的见闻。');
 return text;
}

function royalTravelCompanion(k){
 const r=k?.royalTravel,t=r?.companion;
 if(!t||t.ended!=null)return null;
 const p=t.marriedOnly&&k.spouse?.id===t.personId?k.spouse:natalEntry(t.host,t.personId)?.p;
 return p?.royalCompanionTrip?.royalId===k.id&&p.royalCompanionTrip.departed===t.departed?p:null;
}

function companionTravelPanel(p){
 const trip=p.royalCompanionTrip,k=trip&&royalById(trip.royalId);
 if(!k||!royalTravelAway(k)||royalTravelCompanion(k)!==p)return '';
 return `<p>正在${esc(royalTravelPlace(k))}与${royalNatalPersonLink(S.children.includes(k)?'kid':'relative',k.id,k.name)}结伴游历</p>`;
}

function recordCompanionTravelStop(k,danger){
 const r=k.royalTravel,t=r.companion,p=royalTravelCompanion(k);
 if(!p?.alive||r.nextStop<=r.stop||t.stops.includes(r.stop))return '';
 t.stops.push(r.stop);
 const pair=childhoodJourneyPair(k);
 if(pair?.p===p)strengthenChildhoodBond(pair,danger?5:3);
 const place=royalTravelPlace(k),trait=childDisposition(k),quiet=['沉静','温婉','温厚','才女','有文才'].includes(natalTrait(p));
 const exchange=danger?`${k.name}依向导的话先领人退到安全处，${p.name}核对随行名册，又帮着把沾水的手记摊开，等众人都齐了才写信。`:
  r.stop===0?`${k.name}${['好奇','灵动','爽直'].includes(trait)?'跟着本地人问了一路规矩':'沿途把路标抄在纸上'}，${p.name}${quiet?'在页边补上没问完的那句':'反问刚才听到的两种说法为何不同'}。晚上两人把各自记的对了一遍。`:
  r.stop===1?`歇脚时${p.name}${quiet?'向店家借来一盏灯，按灯下看见的样子补画了一页':'和几个本地人聊熟了，记下他们怎么过日子'}。${k.name}原还想先写山水，翻到这一页，便请${p.name}先讲这一日。`:
  `最后一站，两人交换手记，各给对方挑出一个会记得很久的细节。临走约好，到京后要把自己那本从头讲一遍。`;
 const text=`两人行到${place}。${exchange}`;
 betrothalPairRecord({k,p,b:{turn:t.betrothalTurn,marriedOnly:t.marriedOnly}},'同行手记 · '+place,text,
  danger?'两个人一起确认同行的人都平安，才敢真正松口气。':'同一处地方，我留心的事和对方看见的果然不同。',
  danger?'原以为回信最难写，真提起笔时，倒只想先写一句都平安。':'正好有人一起走，才会回头去问那些原本要忘掉的小事。');
 return text;
}

function finishBetrothedTravel(k,outcome){
 const t=k.royalTravel?.companion;
 if(!t||t.ended!=null)return '';
 const p=royalTravelCompanion(k);
 t.ended=S.turn;t.outcome=outcome;
 if(!p)return '';
 delete p.royalCompanionTrip;
 const line=outcome==='returned'?`${k.name}与${p.name}走完同一程路。${k.married?'回京安顿后，两人就把各自的行记摊开，对看一路漏记了什么。':'进京后各归原住处，约好将两册行记再对读一遍。'}`:
  !k.alive?`归途改了。${p.name}由长辈陪同回原家，收着与${k.name}沿途合记的那几页。`:
  !p.alive?`${k.name}的同行人${p.name}已经离世。这一程剩下的路改由原随侍照应，两人的旧记仍然收好。`:
  `${k.name}与${p.name}因处境有变结束同行，随后由各自的长辈或随侍照应。先前的见闻已分别记下。`;
 betrothalPairRecord({k,p,b:{turn:t.betrothalTurn,marriedOnly:t.marriedOnly}},outcome==='returned'?'同行归来':'同行暂别',line,
  outcome==='returned'?'回京后还想约一次。也许这回只在廊下坐着，把路上漏说的事讲完。':'记得路上各自写过的话，哪怕眼下不能再一道走。',
  outcome==='returned'?'把自己的那册放在案上，最想留住的是一路上互相听见的那些话。':'手记还会留着。走过的那段路，自有走过时的样子。');
 return line;
}

function reconcileBetrothedTravel(k){
 if(!k.royalTravel?.companion||k.royalTravel.companion.ended!=null)return;
 const p=royalTravelCompanion(k),pair=childhoodJourneyPair(k);
 if(!royalTravelAway(k)||!k.alive||k.lost||k.jailed||!p||pair?.p!==p||p.jailed||p.exiled||p.away)
  finishBetrothedTravel(k,'separated');
}
