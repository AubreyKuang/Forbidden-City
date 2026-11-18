/* Selection audiences and the first months at court. Rendering never rolls a new personality. */
function selectionSkipTimingActive(){return journalContentVersion()>=54;}
function selectionLogTurn(date){
 if(typeof date!=='string'||!date.startsWith(E().era))return null;
 const suffix=date.slice(E().era.length),split=suffix.indexOf('年'),month=MONTHS.indexOf(suffix.slice(split+1))+1;
 if(split<0||!month)return null;
 for(let year=1;year<=S.year;year++)if(suffix.slice(0,split)===(year===1?'元':cnNum(year)))return S.turn-(S.year-year)*12-S.month+month;
 return null;
}
function selectionLastHeldTurn(){
 const last=S.flags.lastXX??-99;
 if(!selectionSkipTimingActive()||last<0||S.flags.selectionClockGen===S.gen)return last;
 // Old builds wrote the same clock for a real selection and February's refusal.
 // Repair only when the retained chronological log proves what actually ran.
 if(((S.month-1-(S.turn-last))%12+12)%12!==1)return last;
 const held=S.log.filter(e=>e.t.endsWith('，开选秀，各地秀女入宫待选。')).map(e=>selectionLogTurn(e.d)).filter(t=>t!==null&&t<=S.turn);
 if(held.length){const latest=Math.max(...held);return latest<last?latest:last;}
 const complete=S.log.some(e=>e.d.startsWith(E().era+'元年')&&/新帝.*登基/.test(e.t));
 return complete?-99:last;
}
function reconcileSelectionTiming(){
 if(!S||!selectionSkipTimingActive()||PalaceActions.blocked||S.flags.selectionClockGen===S.gen)return;
 const previous=S.flags.lastXX,last=selectionLastHeldTurn();
 if(previous>=0&&last!==previous)S.flags.lastXXSkipped=previous;
 S.flags.lastXX=last;S.flags.selectionClockGen=S.gen;
}
function selectionFreeReady(){
 const last=selectionLastHeldTurn(),skipped=last!==S.flags.lastXX?S.flags.lastXX:S.flags.lastXXSkipped;
 return S.turn-last>=36||selectionSkipTimingActive()&&Number.isFinite(skipped)&&skipped>last&&skipped<=S.turn;
}
function scheduledSelectionEvent(){
 if(!selectionSkipTimingActive())return null;
 if(S.month!==2||S.turn-selectionLastHeldTurn()<34||S.turn-(S.flags.lastXXSkipped??-99)<12||!newConsortEventAllowed())return null;
 const turn=S.turn,gen=S.gen;let done=false;
 const valid=()=>!done&&!S.over&&S.gen===gen&&S.turn===turn&&S.turn-selectionLastHeldTurn()>=34&&S.turn-(S.flags.lastXXSkipped??-99)>=12&&!S.cands.length;
 return {title:'三年大选',sfx:'chime',valid,text:'礼部奏请举行大选，可传各地秀女入宫候选。若今年停办，不计作已经选秀，日后仍可自行下旨。',choices:[
  {t:'前去看看',f:()=>{if(!valid())return null;done=true;genCands();UI.view='xx';return null;}},
  {t:'今年免了',f:()=>{if(!valid())return null;done=true;reconcileSelectionTiming();S.flags.lastXXSkipped=S.turn;log('今年停办选秀，未开选、未计入上次选秀日期。');return '礼部奉旨停办本年的大选，未重置选秀间隔。'+fx(chg({people:2}));}}
 ]};
}
function entryManner(c){
  if(isSolitary(c))return 'solitary';
  if(c.scheme>=60||['聪慧','持重','城府'].includes(c.trait))return 'careful';
  if(['骄纵','活泼','爽直','将门'].includes(c.trait)&&c.scheme<45)return 'bold';
  if(['淡泊','沉静'].includes(c.trait))return 'quiet';
  return 'nervous';
}
// What she says after showing her skill depends on the skill, and on how well it went.
const SELECTION_REPLIES={
  读书:['书里那一句，臣女想了许久，才敢这样解。','臣女读得还浅，只是喜欢一句一句慢慢想。'],
  抚琴:['这支曲子在家弹过许多遍，今日弦音倒比平日还稳。','指法还生，只是这支曲子，臣女是真心喜欢。'],
  刺绣:['这一处配色改过三回，才觉得像了。','针脚还不够匀，臣女回去再细细练。'],
  侍花:['花和人一样，急不得。臣女只是肯等。','臣女只懂些粗浅的养法，多半是跟家里老花匠学的。'],
  做点心:['火候差一分便不是这个味道，臣女守着灶看了许多回。','样子不算精巧，味道倒是家里人都夸过的。'],
  投壶:['手稳了，壶口反倒显得宽了。','十投能中五六，臣女还想再练。'],
  骑射:['家中兄长教的站法，臣女一日也没敢落下。','臣女力气还小，弓只拉得开大半。'],
  对弈:['这局残棋，臣女解了三个晚上。','臣女棋力平平，只是不肯轻易认输。'],
  品茶:['水要将沸未沸时才好，臣女守了一盏茶的工夫。','臣女也说不清好在哪里，只觉得这一盏清些。']
};
function selectionSpeech(c){
  const manner=entryManner(c),hobby=consortHobby(c);
  const lines={
    solitary:['她依礼见过，不急着接席间的赞语，待人声静下才答话。','臣女不善热闹，倒爱独自读书想事。各人所好不同，无须勉强同声。'],
    careful:['她走到席前才抬眼，袖边虽捏得微紧，行礼却丝毫不乱。','臣女初入禁庭，许多礼数尚不熟悉。愿先把分内之事学好，再慢慢请教。'],
    bold:['她扶正鬓边花钗，声音比引见的嬷嬷还清亮，说完才想起垂眼。','臣女在家时，也常与姐妹争个高下。今日既来了，便想让陛下记得臣女。'],
    quiet:['她停在帘外听完一声檐铃，才从容走进来，将衣袖拢好。','臣女平日最爱一窗清影。有书可读、有花可看，便不觉得日子长。'],
    nervous:['她照着嬷嬷教的步子上前，开口时微微一顿，耳尖先红了。','臣女……给陛下请安。来时在心里练了许多遍，真到了这里，倒忘了该怎样说。']
  };
  const acts={读书:'她翻开随身小册，讲起自己对书中一段话的理解。',抚琴:'她试过琴弦，才缓缓弹出一段小曲。',刺绣:'她展开自己绣的小屏，细说针脚与配色。',侍花:'她拈起一枝花，说起怎样养护才不伤根。',做点心:'她呈上家中学做的花糕，讲起火候。',投壶:'她拣起一支箭，向铜壶试投。',骑射:'她取来未上弦的弓，示范执弓与站姿。',对弈:'她在棋盘上摆出一局残棋，说起自己的解法。',品茶:'她温杯分茶，先将一盏清茶奉到案前。'};
  const skill=c.talent>=70?'举止渐渐舒展，讲到熟悉之处，眼中有了光。':c.talent<40?'中途出了个小差错，她停下来重新试过，没有勉强夸口。':'虽不算出众，倒看得出平日用过心。';
  const blurt=travelerSelectionBlurt(c);
  return {manner,stage:blurt?.stage||lines[manner][0],line:blurt?.line||lines[manner][1],talent:(acts[hobby]||acts.读书)+skill,
    reply:c.talent<40?'臣女还没学得很好。若有机会，想把这一处再练明白。':manner==='bold'?'这才是臣女平日最拿手的。陛下可愿再看一回？':(SELECTION_REPLIES[hobby]||SELECTION_REPLIES.读书)[c.talent>=70?0:1]};
}
function selectionCurrent(){
  const session=S.selection;
  if(!S.cands.length||session?.phase==='roster')return null;
  return S.cands.find(c=>c.id===session?.current)||S.cands[0];
}
// A selection has one durable cohort, even if the last candidate has been dismissed.
function selectionBatch(){
  S.selection||={phase:'roster',performed:[]};
  const s=S.selection;
  if(!s.batch){S.flags.selectionSerial=(S.flags.selectionSerial||0)+1;s.batch=`${S.gen}:${S.turn}:${S.flags.selectionSerial}`;s.date=dateStr();}
  s.accepted||=[];
  return s;
}
function reconcileSelection(){
 const s=S.selection;if(!s)return;
 const gen=Number(s.batch?.split(':')[0]);
 if(Number.isFinite(gen)&&gen!==S.gen){delete S.selection;S.cands=[];}
}
function sameSelectionCohort(a,b){return !!(a!==b&&a?.selectionCohort?.id&&a.selectionCohort.id===b?.selectionCohort?.id);}
function cohortAffinity(a,b){
  return sameSelectionCohort(a,b)&&socialPair(a,b)&&!isRival(a,b)&&!isRival(b,a)&&relGet(a,b)>=0&&consortCompatibility(a,b)>=0;
}
// Many temperaments arrive nervous; each still shows it in her own way.
const NERVOUS_REACTIONS={
  温婉:'她谢过恩，先回身扶起跪得久了的同伴，才随宫人出殿。一路上低声向引路的姑姑道谢。',
  好学:'她把位分与宫规一条条默记在心，出殿时还向嬷嬷问清了几处不认得的宫名。',
  体弱:'她跪得久了，起身时晃了一下，被宫人扶住。她轻声道了谢，仍把脊背挺得笔直。',
  贪财:'她听清了位分，又悄悄打听每月的份例几何，心里算清楚了，才松下一口气。',
  才女:'出殿时她回望了一眼殿中悬着的匾额，默念了两遍上头的字，才跟上引路的宫人。',
  痴情:'名字留下的那一刻，她抬眼望了御座一眼，又慌忙垂下，耳根红了一路。',
  巧手:'她把方才紧张时揉皱的帕子悄悄抚平叠好，出了殿门才长长舒了一口气。',
  善妒:'她向同来的几人一一道喜，笑意只到嘴角，出殿前又回头看了一眼名册上各人的位分。',
  好客:'一出殿门，她便拉着同来的几人互道住处，约好得空时彼此走动。',
  骄矜:'她谢恩时仪态一丝不乱，出了殿门才悄悄问身边宫人，自己的位分在同批中排第几。'
};
function newcomerReaction(c){
  return {
    solitary:'她向同来的几人依礼道别，将书匣交给宫人，独自认了回宫的路。有人邀她晚间闲坐，她温言辞谢，并无怠慢之意。',
    careful:'她将名册上的位分与各宫住处听得仔细，先请教了明日请安的次序，才松开一直捏着的袖边。',
    bold:'她听清封位便抬起眼，谢恩的声音清亮。转身时又回望了一眼殿门，盼着往后还能常被记起。',
    quiet:'她随宫人走过长廊，瞧见窗外的一枝新绿，脚步便慢下来。行李里那卷旧书，终于有地方安放了。',
    nervous:NERVOUS_REACTIONS[c.trait]||'直到名册合上，她才确信自己的名字留了下来。走出殿门时眼眶微红，悄悄向同来的几人点了点头。'
  }[c.entryAdjustment?.manner||entryManner(c)];
}
function selectionSummary(admissions,total=admissions.length){
  return `选秀定榜，共留选${total}人入宫。${admissions.map(({name,rank})=>`${name}封${rank}`).join('、')}。`;
}
function selectionInitialRank(c){
  const admission=/选秀入宫，封为([^，。]+)，赐居/;
  return c.story.find(entry=>admission.test(entry.t))?.t.match(admission)?.[1]??RANKS[c.rank];
}
function selectionChronicle(entries){
  let admissions=[];
  return entries.flatMap(entry=>{
    if(entry.t.endsWith('，开选秀，各地秀女入宫待选。')){
      admissions=[];
      return [{...entry,b:0}];
    }
    const admission=entry.t.match(/^(.+?)（.*之女）.*选秀入宫，封([^。]+)。$/);
    if(admission){
      admissions.push({name:admission[1],rank:admission[2]});
      return [];
    }
    if(entry.t.startsWith('选秀定榜，')||entry.t==='选秀礼毕，本次未留新人。')admissions=[];
    const total=entry.t.match(/^选秀礼毕，留选(\d+)人。可到储秀宫查看新妃安顿。$/);
    if(total){
      const roster=admissions;
      admissions=[];
      if(roster.length)return [{...entry,t:selectionSummary(roster,+total[1]),b:1}];
    }
    return [entry];
  });
}
function rememberDroppedKin(s,c){
 if(!s||journalContentVersion()<81||!(c.fatherId||c.house?.father||Object.keys(c.kin||{}).length))return;
 const departed=s.departedKin||=[];
 if(!departed.some(p=>p.id===c.id))departed.push({id:c.id,sur:c.sur,given:c.given,age:c.age,fatherId:c.fatherId??c.house?.father?.id,
   kin:{...c.kin},kinRival:{...c.kinRival},willing:c.willing});
}
function rosterSister(c,p){
 const direct=c.kin?.[p.id],reverse=p.kin?.[c.id];
 if(KIN_TXT[direct])return KIN_TXT[direct];
 if(KIN_TXT[reverse])return KIN_TXT[reverse[0]+(reverse[1]==='姐'?'妹':'姐')];
 const id=p.fatherId??p.house?.father?.id;
 const same=id!=null&&(c.fatherId===id||c.house?.father?.id===id);
 if(!same&&!c.house?.father?.siblingFatherIds?.includes(id))return '';
 return KIN_TXT[(same?'亲':'堂')+(p.age>c.age||p.age===c.age&&p.id<c.id?'姐':'妹')];
}
function selectionKinNews(s,members,remaining){
 if(journalContentVersion()<81)return;
 const kept=new Set(members.map(c=>c.id)),roster=new Map([...(s?.peerDeparted||[]),...(s?.departedKin||[]),...remaining,...members].map(c=>[c.id,c]));
 for(const c of S.consorts.filter(c=>c.alive&&!c.gone&&!c.maid)){
  const news=[];
  for(const p of roster.values()){
   if(p.id===c.id||kept.has(p.id)&&p.sisterArrivalRecorded&&c.kin?.[p.id])continue;
   const kin=rosterSister(c,p);if(!kin)continue;
   const retained=kept.has(p.id),name=kin+fullName(p),rival=isRival(c,p)||isRival(p,c)||relGet(c,p)<=-25;
   let mood,feeling,line;
   if(retained&&rival){mood=-5;feeling='忧心';line='礼数上该道喜，可往后抬头不见低头见，我担心家中那些旧话又被人提起。';}
   else if(retained){mood=6;feeling='欢喜';line='从前隔着宫门惦记，如今总算能见面了。我还记得自己头一次请安时走错了门，想先把这事告诉她。';}
   else if(rival){mood=2;feeling='释然';line='听到她回家的消息，我松了口气。托人回家只说她一路平安，别在她面前再议这张榜。';}
   else if(p.willing===false){mood=3;feeling='释然';line='她本就不愿留宫。虽舍不得，也替她高兴，盼她回家过自己想过的日子。';}
   else{mood=-4;feeling='思念';line='原想若能留下，往后便有人一起说家常。如今只盼家里别拿这次落选说她，等她到家报声平安。';}
   const fact=name+(retained?'留选，初封'+selectionInitialRank(p):'此次未留选，归家');
   news.push({fact,mood,feeling,id:p.id});
   story(c,'【选秀 · 姐妹定榜】'+fact+'。'+line);
  }
  if(!news.length)continue;
  const delta=news.reduce((v,n)=>v+n.mood,0);cchg(c,{mood:delta});
  const main=news.reduce((a,b)=>Math.abs(a.mood)>=Math.abs(b.mood)?a:b);
  if(!['悲恸','心如死灰'].includes(xinOf(c)))setXin(c,main.feeling,news.map(n=>n.fact).join('；'),main.id,{record:false});
 }
}
function finishSelection(){
  const s=S.selection;
  if(s?.phase==='arrivals'||(!s&&!S.cands.length))return false;
  const members=(s?.accepted||[]).map(byId).filter(Boolean);
  if(journalContentVersion()>=81)for(const c of members)familyAdmissionReactions(c,true);
  selectionKinNews(s,members,S.cands);
  if(s)delete s.departedKin;
  if(outerIntegration())for(const c of S.cands)outerSelectionDismissed(c);
  S.cands=[];
  if(!members.length){finishSelectionCourt(s,[]);delete S.selection;log('选秀礼毕，本次未留新人。');return true;}
  s.phase='arrivals';s.finishedAt=S.turn;
  for(const c of members){
    c.selectionCohort={id:s.batch,date:s.date,turn:S.turn};
    if(c.entryAdjustment)c.entryAdjustment.pendingBatch=false;
    if(!inPalace(c))continue;
    c.entryAdjustment.reaction=newcomerReaction(c);
    story(c,`【选秀礼毕】同批留选共${members.length}人。${c.entryAdjustment.reaction}`);
  }
  // At most two new acquaintances each; ceremony attendance never erases a feud.
  const pairs=[],counts={};
  for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
    const a=members[i],b=members[j];
    if(inPalace(a)&&inPalace(b)&&cohortAffinity(a,b))pairs.push({a,b,order:R()});
  }
  pairs.sort((a,b)=>a.order-b.order);
  for(const {a,b} of pairs){
    if((counts[a.id]||0)>=2||(counts[b.id]||0)>=2)continue;
    const shared=sharedConsortHobby(a,b),p=Math.min(.8,.4+consortCompatibility(a,b)*.025+(Math.abs(a.age-b.age)<=4?.1:0));
    if(!chance(p))continue;
    relAdd(a,b,10);counts[a.id]=(counts[a.id]||0)+1;counts[b.id]=(counts[b.id]||0)+1;
    const activity=shared?`说起彼此都喜欢${shared}，约好安顿后再叙`:'一同记下请安的时辰与宫门的方向，约好日后照应';
    for(const [c,o] of [[a,b],[b,a]]){
      const line=`【同批入宫】与${fullName(o)}一同留选，${activity}，陌生的宫里多了一个相识的人。`;
      c.entryAdjustment.acquaintances||=[];c.entryAdjustment.acquaintances.push(o.id);story(c,line);
    }
    NPCMemory.record(S,{type:'selection_cohort',time:S.turn,location:'储秀宫',participants:[a.id,b.id],outcome:activity},
      [[a,b],[b,a]].map(([c,o])=>({person:c.id,subject:o.id,emotion:.55,impact:55,interpretation:`与${fullName(o)}同批入宫，${activity}。`})));
  }
  finishSelectionCourt(s,members);
  if(journalContentVersion()>=41)log(selectionSummary(members.map(c=>({name:fullName(c),rank:selectionInitialRank(c)}))),1);
  else log(`选秀礼毕，留选${members.length}人。可到储秀宫查看新妃安顿。`);
  return true;
}
function selectionCohortHTML(c){
  if(!c.selectionCohort)return '';
  const peers=S.consorts.filter(o=>sameSelectionCohort(c,o));
  return `<div>入宫同批 · ${esc(c.selectionCohort.date)}${peers.length?' · '+peers.map(o=>`${parentLink(o.id)}${!o.alive?'（已故）':''}`).join('、'):' · 本批仅她一人留选'}</div>`;
}
function selectionArrivalsRecent(){
  const s=S.selection;if(s?.phase!=='arrivals')return false;
  const started=Number.isFinite(s.finishedAt)?s.finishedAt:(s.accepted||[]).map(byId).find(c=>Number.isFinite(c?.selectionCohort?.turn))?.selectionCohort.turn;
  return Number.isFinite(started)&&S.turn>=started&&S.turn-started<2;
}
function viewSelectionArrivals(){
  const members=(S.selection?.accepted||[]).map(byId).filter(Boolean);
  return `${selectionDiscussionPanel()}<section class="story-scene selection-scene"><header><p>储秀宫 · ${esc(S.selection.date||'选秀礼毕')}</p><h2>新妃安顿</h2></header><div class="acts"><button class="btn" onclick="A.go('harem')">回后宫</button><button class="btn gold" onclick="A.xxDecree()">重新选秀</button></div></section>
    <p class="hint">本批名单已定，共留选 ${members.length} 人。安顿页保留本月和下月；此后仍可在人物纪事中回看入宫经历。也可随时重新选秀，未满三年仍有国库与民心代价。</p>
    <div class="grid portrait-grid">${members.map(c=>`<article class="card" style="display:block"><div class="row">${porImg(c,76)}<div><h3>${esc(fullName(c))}</h3><p>${esc(c.palace)} · ${esc(c.trait)} ${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}</p></div></div>
    <p>${esc(c.entryAdjustment?.reaction||'她的留选记在这一批名册中。')}</p>
    ${(c.entryAdjustment?.acquaintances||[]).length?`<p class="hint">一同入宫时相识：${c.entryAdjustment.acquaintances.map(id=>parentLink(id)).join('、')}。</p>`:''}
    <div class="acts">${!inPalace(c)?'<span class="hint">目前不在宫中</span>':c.entryAdjustment?.settled?'<span class="tag g">已问候</span>':S.turn-c.entryAdjustment?.turn>=6?'<span class="hint">已渐渐住惯</span>':`<button class="btn gold sm" onclick="A.xxWelcome(${c.id})">去问候她</button>`}<button class="btn sm" onclick="A.go('consort',${c.id})">人物纪事与近况</button></div></article>`).join('')}</div>
`;
}
A.xxWelcome=function(id){if(modalOpen)return;const c=byId(id);if(c)pushEv(newcomerWelcomeEvent(c));};
function viewSelectionAudience(){
  const c=selectionCurrent();if(!c)return '';
  const speech=selectionSpeech(c),shown=S.selection?.performed?.includes(c.id);
  return `<section class="selection-audience selection-scene" aria-label="秀女觐见"><header><div><p>储秀宫 · 依次觐见</p><h2>${esc(fullName(c))}</h2><p>${c.age}岁 · ${esc(c.fam.t)}之女</p>${solitaryTag(c)}${dowagerKinTag(c)}${consortTraitTags(c)}</div><button class="btn sm" onclick="A.xxRoster()">直接看名册</button></header>
    <div class="audience-body"><div class="audience-portrait">${porImg(c,210)}</div><div class="audience-dialogue"><p>${esc(shown?speech.talent:speech.stage)}</p><blockquote>“${esc(shown?speech.reply:speech.line)}”</blockquote><p class="hint">${esc(pastLifeSelectionHint(c))}</p>${portraitResemblanceHint(c)?`<p class="hint">${esc(portraitResemblanceHint(c))}</p>`:''}<p class="hint">${esc(c.kinNote||'')} ${shown?'已看过才艺，可继续觐见或回名册留选。':'可听她展示所长，再统一决定留谁。'}</p></div></div>
    <footer><span>${S.cands.indexOf(c)+1} / ${S.cands.length} 位候选</span><div class="acts"><button class="btn" onclick="A.xxPerform(${c.id})" ${shown?'disabled':''}>展示才艺 · ${esc(consortHobby(c))}</button><button class="btn gold" onclick="A.xxNext(${c.id})">${S.cands.indexOf(c)===S.cands.length-1?'看完，回名册留选':'请下一位'}</button></div></footer></section>${selectionDiscussionPanel()}`;
}
A.xxRoster=function(){if(modalOpen)return;S.selection={...(S.selection||{}),phase:'roster'};save('auto');render();};
A.xxMeet=function(id){if(modalOpen||!S.cands.some(c=>c.id===id))return;S.selection={...(S.selection||{}),phase:'audience',current:id};save('auto');render();};
A.xxPerform=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;S.selection||={};S.selection.performed||=[];if(!S.selection.performed.includes(id))S.selection.performed.push(id);save('auto');render();};
A.xxNext=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;const i=S.cands.findIndex(c=>c.id===id);S.selection||={};S.selection.current=S.cands[i+1]?.id;S.selection.phase=i+1<S.cands.length?'audience':'roster';save('auto');render();};
function newcomerWelcomeEvent(c){
  const arrival=c.entryAdjustment;
  if(!arrival||arrival.settled||arrival.pendingBatch||S.turn-arrival.turn>=6||!inPalace(c)||c.outerPrivateResidence)return null;
  const valid=()=>inPalace(c)&&!arrival.settled&&!arrival.pendingBatch&&S.turn-arrival.turn<6&&!c.outerPrivateResidence;
  const favored=harem().filter(o=>o.id!==c.id&&o.favor>=40).sort((a,b)=>b.favor-a.favor||a.id-b.id)[0];
  const news=favored?`宫人答说，近来${cName(favored)}常蒙召见。`:'宫人只说，各宫各有起居，不好妄议圣意。';
  const text={solitary:'她问清请安的时辰，便将自己的书与茶具放好。“分内的礼数，臣妾不会怠慢。至于闲时，可否容臣妾独自过？并非与谁不睦，只是不惯结伴。”',careful:`她先请教请安的次序，又不动声色地问了各宫近来的赏赐。${news}\n见你进来，她收住话：“臣妾只怕不懂规矩，给人添了麻烦。”`,
    bold:`行李还没收好，她便拉住领路宫人：“宫里如今谁最得宠？陛下平日爱往哪一宫去？”${news}\n见你来了，她仍忍不住问：“臣妾若做得好，陛下也会常来么？”`,
    quiet:'她把带来的旧书放在窗下，先问院里可否种一丛兰。见你来了，她微微一笑：“地方还生疏，不过有这一窗日色，臣妾便能慢慢住惯。”',
    nervous:'她望着陌生的宫门，几次想问话，又将话咽回去。见你来了才轻声道：“臣妾怕行错礼，也怕说错话。今夜的灯，可否留得晚些？”'}[arrival.manner];
  const settle=(answer,changes,line)=>{
    if(!valid())return null;arrival.settled=true;arrival.answer=answer;arrival.favored=favored?.id;arrival.answeredAt=S.turn;
    cchg(c,changes);story(c,`初入宫时，${line}`);remember(c,'care',line);save('auto');return line;
  };
  return {title:'初入宫门',por:c,valid,text:`${fullName(c)}${S.turn===arrival.turn?'刚住进':'入宫不久，住在'}${c.palace}。\n${text}`,choices:[
    {t:'先安心住下，有不懂的慢慢问',f:()=>settle('reassured',{aff:6,mood:8},'陛下许她慢慢熟悉宫中生活，不必事事惶恐。')},
    {t:'请掌事姑姑教她宫中礼数',f:()=>settle('guided',{aff:2,mood:4},'陛下安排掌事姑姑陪她认路、习礼，也教她分辨传言。')},
    {t:'各人有各人的日子，不必急着比较',f:()=>settle('boundaries',{mood:2},'陛下劝她先过好自己的日子，不必急着争高下。')}]};
}
function newcomerVoice(c){
  const a=c.entryAdjustment;if(!a?.settled||S.turn-a.turn>=6)return null;
  const lines={solitary:['请安的路已经记熟，借来的书也照期归还了。臣妾仍喜欢独处，倒不觉得这里的日子难捱。','旁人的邀约，臣妾会认真回话；去不去，却想自己作主。如此也好，彼此都不必猜。'],careful:['请安的路臣妾已经认得了。宫人说的话，臣妾也只听一半，剩下的，总要自己看过才算。','刚来时怕失了分寸，如今才懂，话不必句句都接。陛下若愿听，臣妾也有自己的想法。'],bold:['那日问谁得宠，原是臣妾心急了。只是盼陛下下回来时，不必再让人通报名姓。','宫里的日子，比臣妾在家想的难猜。可臣妾还是想把自己喜欢的，认认真真做给陛下看。'],quiet:['窗下那一点新绿，今早又长了。宫里虽大，也渐渐有了臣妾认得的地方。','昨日走过长廊，竟没有走错。原来熟悉一个地方，也可以这样慢慢来。'],nervous:['昨夜终于睡安稳了。醒来时还以为在家，听见廊下请安的声音，才想起已经进宫。','臣妾把各宫的名字写在纸上，认得一个，便划去一个。如今不大怕独自走过长廊了。']};
  return voiceLine('newcomer','她说起这些日子，语气比初见时松了一些。',lines[a.manner]||lines.nervous);
}
