/* 公主开府、议婚、府中事务与还宫 */
const PRINCESS_PURSUITS = {
  books: {title:'整理一部书', wish:'我想把宫里旧书校清楚，抄一部留给弟妹。', result:'校成的书已经装订好，她在第一页写上了帮忙校对的人。', stat:'lit'},
  archery: {title:'办一场女骑赛', wish:'我想请城中善骑的女子来比试，也给初学的人留一场。', result:'女骑赛已办完。她将第一支彩箭带回，说要留给当初教她骑马的人。', stat:'mar'},
  near: {title:'安一座近宫的府', wish:'我想住得离宫门近些，时常能回来看看母亲，也请弟妹到府里坐坐。', result:'府里的小厅已经布置好，她在窗前留了一张母亲从前喜欢的椅子。', stat:'vir'}
};
const PRINCESS_MATCHES = {
  official:{name:'重臣之子', note:'他的家人能在朝中照应她，她担心婚后很难拒绝娘家的请托。'},
  frontier:{name:'北境来使为本部求亲', note:'她问，远行之后可否继续给母亲写信，又能否保留自己的府中人手。'},
  scholar:{name:'她愿意交往的进士', note:'两人谈过她想做的事。对方愿先来见她，等她自己作答。'}
};

const archivedPrincesses=()=>S.princessRelatives||[];
const estatePrincesses=()=>[...kidsAlive().filter(k=>k.estate),...archivedPrincesses()];
const princessById=id=>kidById(id)||archivedPrincesses().find(k=>k.id===id);
const canOpenPrincess=k=>k?.alive&&!k.templeStay&&!k.removedFromRoyal&&k.sex==='f'&&kidAge(k)>=15&&!k.jailed;
const princessPursuit=k=>k.lit>=Math.max(45,k.mar+7)?'books':k.mar>=45?'archery':'near';

function princessMemory(k,type,text,location='公主府',emotion=.7){
  kstory(k,text);
  NPCMemory.record(S,{type,time:S.turn,location,participants:[k.id],outcome:text},[
    {person:k.id,subject:'emperor',interpretation:text,emotion,impact:70}
  ]);
}

function princessOpening(k){
  const pursuit=princessPursuit(k);
  return {title:'公主开府来信',por:k,text:`${kidName(k)}亲手递来一封信。\n「${PRINCESS_PURSUITS[pursuit].wish}」\n她已相中一处府邸，请你准她自理府中事务。`,choices:[
    {t:'准她开府，由她自理',f:()=>{
      if(k.estate)return null;
      k.estate={pursuit,opened:S.turn,stage:'proposal',nextVisit:S.turn+2,route:k.princessMarriage||(k.married?'married':'independent')};
      princessMemory(k,'princess_estate','获准开府，可以自行安排府中事务。');
      log(`${kidName(k)}开府，设于京城。`,1);
      save('auto');
      return '她谢了恩，请你得空去府里看一看。';
    }},
    {t:'三个月后再议',f:()=>{k.estateDeferred=S.turn+3;save('auto');return '她把府邸的图样留在御案上，等日后再谈。';}}
  ]};
}

function princessMarriage(k){
  const preference=k.estate?.pursuit||princessPursuit(k);
  const order=preference==='books'?['scholar','official','frontier']:preference==='archery'?['frontier','scholar','official']:['official','scholar','frontier'];
  return {title:'公主婚事',por:k,valid:()=>marriageReady(k),text:`${kidName(k)}请你先看她写的笺子：「${PRINCESS_PURSUITS[preference].wish}」\n她愿意与你逐一谈谈求亲的人。`,choices:[
    ...(rememberedMatch(k)?[{t:'谈谈少年时相识的'+rememberedMatch(k).name,f:()=>{pushNow(rememberedMatchEvent(k));return null;}}]:[]),
    ...order.map(id=>({t:`听她谈谈${PRINCESS_MATCHES[id].name}`,f:()=>{pushNow(princessMatchReview(k,id));return null;}})),
    {t:'由她安排，半年后再谈',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '她收起名帖，说等有了主意会来找你。';}}
  ]};
}
function princessMatchReview(k,id){
  const match=PRINCESS_MATCHES[id],person=marriageCandidate(k,id);save('auto');
  return {title:'灯下谈婚事',cast:[k,person],valid:()=>marriageReady(k),text:`${person.name} · ${kidAge(person)}岁 · ${match.name}\n${match.note}\n${marriageProfileText(k,person)}${id==='official'?'\n婚仪需国库五十万两。':''}\n她把名帖推过来，等你回答。`,choices:[
    {t:id==='scholar'?'准她自择驸马':id==='frontier'?'允准和亲':'允准这门亲事',cond:()=>marriageReady(k)&&(id!=='official'||E().treasury>=50),f:()=>{
      if(!marriageReady(k)||(id==='official'&&E().treasury<50))return null;
      k.married=true;k.spouse={...person,marriedAt:S.turn};
      if(k.estate)k.estate.route=id;
      k.princessMarriage=id;
      princessMemory(k,'princess_marriage',`婚事议定：${person.name}（${match.name}）。`);
      log(`${kidName(k)}与${person.name}议定婚事。`,1);
      const mother=byId(k.mom);
      if(id==='frontier'&&mother?.alive)cchg(mother,{mood:-18,aff:-5});
      if(id==='scholar')k.love=clamp(k.love+15);
      const gains=id==='frontier'?chg({prestige:3,people:6}):id==='official'?chg({prestige:4,treasury:-50}):'父爱+15';
      ensureMarriedLife(k);save('auto');return fx(gains);
    }},
    {t:'先让两人谈谈日常',f:()=>{pushNow(marriageMeeting(k,person,()=>princessMatchReview(k,id)));return null;}},
    {t:'再看别的人选',f:()=>{pushNow(princessMarriage(k));return null;}},
    {t:'先不定亲',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '她把名帖收回，婚事暂且搁下。';}}
  ]};
}
function princessMilestone(k){
  if(!canOpenPrincess(k))return null;
  if(!k.estate&&S.turn>=(k.estateDeferred??0))return princessOpening(k);
  if(!k.married&&(!k.asked||k.marriageAfter!==undefined)&&S.turn>=(k.marriageAfter??0)){
    return {...princessMarriage(k),onShow:()=>{k.asked=true;delete k.marriageAfter;}};
  }
  return null;
}
A.openPrincess=function(id){
  const k=kidById(id);
  if(!S.over&&canOpenPrincess(k)&&!k.estate&&!modalOpen&&S.turn>=(k.estateDeferred??0))pushEv(princessOpening(k));
};
A.princessMarriage=function(id){
  const k=kidById(id);
  if(canOpenPrincess(k)&&marriageReady(k)&&!modalOpen){
    pushEv({...princessMarriage(k),onShow:()=>{k.asked=true;delete k.marriageAfter;}});
  }
};
function princessActions(k,showEstate=true){
  if(!canOpenPrincess(k))return '';
  const canRead=S.turn>=(k.estateDeferred??0);
  return `<div class="acts">${k.estate?(showEstate?`<button class="btn jade" onclick="A.go('princess',${k.id})">公主府</button>`:''):
    `<button class="btn jade" onclick="A.openPrincess(${k.id})" ${canRead?'':'disabled'}>开府来信${canRead?'':'<small>她暂且搁下了此事</small>'}</button>`}
    ${showEstate?'':marriageButton(k)}</div>`;
}

function archivePrincessEstates(heir){
  const estates=kidsAlive().filter(k=>k.estate);
  if(!estates.length)return;
  S.princessRelatives=[...archivedPrincesses(),...estates.map(k=>({...k,estate:{...k.estate},reign:S.gen,kinship:k.born<=heir.born?'皇姐':'皇妹'}))];
}
const princessKinship=k=>k.reign===S.gen-1?k.kinship||'先帝之女':'宗亲';
function princessMapNotice(){
  const k=estatePrincesses().find(p=>p.estate.stage==='proposal'||(p.estate.stage==='working'&&S.turn>=p.estate.due));
  return k?`<div class="season-map-leads">${esc(k.name)}的府上送了信。 <button class="btn sm" onclick="A.go('princess',${k.id})">去公主府读信</button></div>`:'';
}
function princessEstatePanel(){
  const estates=estatePrincesses();
  if(!estates.length)return '';
  return `<section class="palace-activity"><h3>公主府</h3><div class="grid">${estates.map(k=>`<button class="card" onclick="A.go('princess',${k.id})">${porImg(k,44)}
    <span class="grow"><b>${esc(kidName(k))}</b><small>${k.reign?princessKinship(k)+' · ':''}${princessLetterLabel(k.estate)}</small></span></button>`).join('')}</div></section>`;
}
function princessLetterLabel(estate){
  if(estate.stage==='proposal')return '府中有一封新信';
  if(estate.stage==='working')return S.turn>=estate.due?'送来了办成的消息':'府中正在筹办';
  return S.turn>=estate.nextVisit?'可邀她回宫':'府中日常';
}
function viewPrincessEstate(){
  const k=princessById(UI.sel),e=k?.estate;
  if(!k?.alive||!e)return viewOut();
  const plan=PRINCESS_PURSUITS[e.pursuit];
  const ready=e.stage==='working'&&S.turn>=e.due;
  const message=e.stage==='proposal'?plan.wish:ready?plan.result:e.stage==='working'?`府上说还需 ${e.due-S.turn} 个月。`:'她已办成这件事，近来常把府中的消息寄到宫里。';
  const local=(e.route||k.princessMarriage)!=='frontier';
  return `<button class="btn quiet sm" onclick="A.go('out')">← 返回出巡</button>
    <header class="detail-head">${porImg(k,112)}<div class="grow"><p>${k.reign?princessKinship(k)+' · ':''}${local?'京城府邸':'北境来信'}</p><h2>${esc(kidName(k))} · 公主府</h2><p>生母 ${esc(k.momName)}</p></div></header>
    <section class="palace-activity"><h3>${plan.title}</h3><p>${esc(message)}</p><div class="acts">
    ${e.stage==='proposal'||ready?`<button class="btn gold" onclick="A.princessLetter(${k.id})">${ready?'读她的回信':'读府中来信'}</button>`:''}
    ${S.turn>=e.nextVisit?`<button class="btn jade" onclick="A.princessVisit(${k.id})">${local?'请她回宫探亲':'写信邀她还宫'}</button>`:''}</div></section>
    ${marriagePanel(k)}
    ${householdPanel(k)}
    ${detailSection('府中记事',detailStory(k))}`;
}
A.princessLetter=function(id){
  const k=princessById(id),e=k?.estate;
  if(S.over||modalOpen||!k?.alive||!e)return;
  const plan=PRINCESS_PURSUITS[e.pursuit];
  if(e.stage==='proposal'){
    const start=(mode,months,cost)=>()=>{
      if(e.stage!=='proposal'||E().treasury<cost)return null;
      if(cost)chg({treasury:-cost});
      Object.assign(e,{stage:'working',mode,due:S.turn+months});
      princessMemory(k,'princess_project',`${plan.title}：${mode}。`);
      save('auto');return `她写信道谢，预计 ${months} 个月后有回音。`;
    };
    pushEv({title:`公主来信 · ${plan.title}`,por:k,text:plan.wish,choices:[
      {t:'拨银二十万两',cond:()=>E().treasury>=20,why:'国库不足',f:start('拨银相助',2,20)},
      {t:'替她引荐合适的人',f:start('引荐人手',3,0)},
      {t:'让她用府中人手慢慢办',f:start('自行筹办',4,0)}
    ]});
  }else if(e.stage==='working'&&S.turn>=e.due){
    pushEv({title:'府中回信',por:k,text:plan.result,choices:[{t:'记入起居注',f:()=>{
      if(e.stage!=='working')return null;
      e.stage='done';k[plan.stat]=clamp(k[plan.stat]+5);
      princessMemory(k,'princess_result',plan.result);
      log(`${kidName(k)}：${plan.title}已办成。`,1);save('auto');return null;
    }},{t:'稍后再读'}]});
  }
};
A.princessVisit=function(id){
  const k=princessById(id),e=k?.estate;
  if(S.over||modalOpen||!k?.alive||!e||S.turn<e.nextVisit)return;
  const mother=!k.reign&&byId(k.mom);
  const parent=k.reign?`新君与${princessKinship(k)}在宫里叙了旧。`:mother?.alive&&!mother.gone&&!mother.cold?`她与${cName(mother)}在廊下坐了半日，说起开府后的日子。`:'她在宫里走了走，在从前住的地方停了一会儿。';
  const far=(k.princessMarriage||e.route)==='frontier';
  const text=far?`她托来京的使者带回一封家书：「${e.stage==='done'?'府中的事已经办妥，愿宫中安好。':'等府中事务安顿，我再寻机会回来。'}」`:parent;
  pushEv({title:far?'北境家书':'回宫探亲',por:k,text,choices:[{t:far?'回信问安':'留她用膳',f:()=>{
    if(S.turn<e.nextVisit)return null;
    e.nextVisit=S.turn+4;k.love=clamp(k.love+5);
    if(!far&&mother?.alive&&!mother.gone&&!mother.cold){cchg(mother,{mood:6});story(mother,`${k.name}回宫探亲，母女叙话。`);}
    princessMemory(k,'princess_visit',text,far?'公主府':'宫中');
    log(`${kidName(k)}${far?'从北境寄回家书':'回宫探亲'}。`);save('auto');return null;
  }},{t:'改日再说'}]});
};
