/* Kinship survives foster placement. A request, a visit and a transfer are separate decisions. */
function maternalAbsent(m){return !!m&&(!m.alive||!!m.gone);}
function maternalAbsenceText(m){return !m.alive?'去世':'出宫';}
function childCareAddress(k,c){const m=byId(k?.mom);return c?.id===k?.mom?'母妃':m&&(KIN_TXT[c?.kin?.[m.id]]||KIN_TXT[m.kin?.[c?.id]])?'姨母':'养母';}
function kinCareChildren(m){return S.children.filter(k=>k.mom===m?.id&&childInPalace(k)&&!k.pendingName&&kidAge(k)<18);}
function maternalCaregiver(k){const f=k&&fosterOf(k);return f?.alive&&!f.cold&&!f.gone?f:null;}
function maternalKinCanAsk(c,k){
 const m=k&&byId(k.mom);
 return !!(!S.over&&inPalace(c)&&(!familyScenesEnabled()||c.rank>=3)&&!c.maid&&c.age>=16&&!(c.hp<40)&&!(c.delivery&&!c.delivery.settled)&&
  m&&(!m.alive||m.cold||m.gone)&&(KIN_TXT[c.kin?.[m.id]]||KIN_TXT[m.kin?.[c.id]])&&
  childInPalace(k)&&!k.pendingName&&kidAge(k)<18&&k.foster!==c.id);
}
function maternalCareSnapshot(children){return children.map(k=>k.foster||null);}
function maternalCareUnchanged(c,children,snapshot){return children.length>0&&children.every((k,i)=>maternalKinCanAsk(c,k)&&(k.foster||null)===snapshot[i]);}
function maternalCaregiversPresent(children){return children.every(k=>!maternalCaregiver(k)||inPalace(maternalCaregiver(k)));}
function maternalPlacementText(children){return children.map(k=>{const f=maternalCaregiver(k);return f?`${k.name}已有养母${fullName(f)}照顾。`:`${k.name}暂由乳母照顾。`;}).join('');}
function maternalCareStatus(c,m,children,status){(c.maternalKinRequests||={})[m.id]={status,turn:S.turn,children:children.map(k=>k.id)};children.forEach(k=>{k.maternalKinAsked=true;});}
function maternalCareRecord(c,m,children,text,others=[]){
 const people=[...new Set([c,m,...children,...others].filter(Boolean))];
 people.forEach(p=>(S.children.includes(p)?kstory:story)(p,text));
 const living=people.filter(p=>p.alive);
 NPCMemory.record(S,{type:'family-care',time:S.turn,participants:living.map(p=>p.id),outcome:text},living.map(p=>({person:p.id,subject:c.id,interpretation:text,emotion:.25,impact:85})));
}
function maternalCareDiscussion(c,m,children){
 const placement=maternalCareSnapshot(children),fosters=[...new Set(children.map(maternalCaregiver).filter(Boolean))];let done=false;
 const valid=()=>!done&&maternalCareUnchanged(c,children,placement)&&maternalCaregiversPresent(children);
 const voices=fosters.map(f=>`${fullName(f)}说：“${relGet(f,c)>=35||['温婉','持重'].includes(f.trait)?'她惦念姐妹的孩子，我明白。愿意一道照看，但起居不能骤然改变。':'我已经在一日一日照看孩子，不能因她是亲人，就当这些日子不曾有过。若要往来，也请先把安排说清。'}”`).join('\n');
 const childVoice=children.filter(k=>kidAge(k)>=3&&maternalCaregiver(k)).map(k=>`${k.name}${childTrust(k,maternalCaregiver(k))>=45?'依偎在熟悉的养母身边':'还在适应原来的照料'}，你决定先让孩子慢慢熟悉姨母。`).join('\n');
 const finish=(status,text)=>{done=true;maternalCareStatus(c,m,children,status);maternalCareRecord(c,m,children,text,fosters);save('auto');return text;};
 return {title:'姨母与养母',por:c,cast:[...fosters,...children],present:[c,...fosters],valid,
  onShow:()=>{const r=c.maternalKinRequests?.[m.id];if(r?.discussionTurn===S.turn)return;maternalCareStatus(c,m,children,'pending');c.maternalKinRequests[m.id].discussionTurn=S.turn;maternalCareRecord(c,m,children,`${fullName(c)}为${fullName(m)}留下的${children.map(k=>k.name).join('、')}与原养母商议照料。${voices}`,fosters);},
  text:`${maternalPlacementText(children)}\n姨母${fullName(c)}想照料姐妹${fullName(m)}留下的孩子，你请原养母一同说清安排。\n${voices}\n${childVoice}\n共同照看保留原养母与居处；只有明确另定抚养，孩子才会改随姨母生活。`,choices:[
   {t:'保留原养母，准姨母共同照看',f:()=>{if(!valid())return null;
    const lines=children.map(k=>{const f=maternalCaregiver(k);if(!f){petitionFoster(k,c,true);return `${k.name}原由乳母照料，现交由姨母${fullName(c)}抚养。`;}
     (k.careVisitors||={})[c.id]={role:'姨母',since:S.turn};relAdd(c,f,2);return `${k.name}仍由${fullName(f)}抚养，居处不变；准姨母${fullName(c)}探望、共同照看。`;});
    return finish('shared',lines.join('\n')+'生母仍是'+fullName(m)+'。');}},
   {t:'改由姨母抚养，保留原养母往来',f:()=>{if(!valid())return null;
    children.forEach(k=>{const old=maternalCaregiver(k);doFoster(k,c,{maternalKin:true});if(k.careVisitors)delete k.careVisitors[c.id];if(old)(k.careVisitors||={})[old.id]={role:'原养母',since:S.turn};});
    return finish('accepted',`听取原养母的心意后，陛下仍决定由姨母${fullName(c)}抚养${children.map(k=>k.name).join('、')}，保留原养母探望与旧有情分；生母仍是${fullName(m)}。原养母的不舍也留在各自记事中。`);}},
   {t:'维持原安排，暂缓商议',f:()=>valid()?finish('deferred',`姨母${fullName(c)}与原养母谈过照护，陛下暂缓定夺。${maternalPlacementText(children)}以后可到姨母档案继续商议。`):null}
  ]};
}

function careVisitorAllowed(k,c){
 const f=maternalCaregiver(k);
 return !!(!S.over&&childInPalace(k)&&!k.pendingName&&inPalace(c)&&k.careVisitors?.[c.id]&&!k.careVisitors[c.id].blocked&&c.id!==(k.foster||k.mom)&&(!f||inPalace(f)));
}
A.kinCareTime=function(childId,consortId){
 const k=kidById(childId),c=byId(consortId),v=k?.careVisitors?.[consortId];
 if(modalOpen||!careVisitorAllowed(k,c)||v.last===S.turn||!useE())return;
 if(familyScenesEnabled()&&v.role==='原养母'){const text=formerCareVisit(k,c);pushEv({title:'旧情仍在',por:c,cast:[k],text,choices:[ok1]});return;}
 v.last=S.turn;const small=kidAge(k)<3,f=maternalCaregiver(k);
 const activity=small?'在乳母身旁轻声哄睡':['才女','聪慧','好学'].includes(c.trait)?(v.role==='姨母'?'一起读书，讲起生母小时候的家中旧事':'一起读书，谈起从前相伴的日子'):['将门','爽直','活泼'].includes(c.trait)?'在廊下玩了一会儿投壶':'坐在窗边，听孩子说近来的小事';
 const text=`${v.role}${fullName(c)}来看${k.name}，${activity}。${f?`养母${fullName(f)}仍照原来的起居安排照看孩子。`:'乳母仍在旁照护。'}`;
 v.text=text;relAdd(c,k,4);cchg(c,{mood:3});maternalCareRecord(c,null,[k],text,f?[f]:[]);save('auto');pushEv({title:'亲人相伴',por:c,cast:[k,...(f?[f]:[])],text,choices:[ok1]});
};
function careVisitorPanel(k,only=null){
 return Object.entries(k.careVisitors||{}).map(([id,v])=>{const c=byId(+id);if(!c||only&&c!==only||c.id===(k.foster||k.mom))return '';
  const ready=careVisitorAllowed(k,c)&&v.last!==S.turn;
  return `<article class="family-time-row"><div><strong>${esc(v.role)} · ${parentLink(c.id)}</strong><p class="hint">${esc(k.name)}的亲人往来 · 保留现有抚养</p>${v.text?`<p>${esc(v.text)}</p>`:''}${v.role==='原养母'&&familyScenesEnabled()&&c.alive&&childInPalace(k)?`<button class="btn quiet sm" onclick="A.formerCareRule(${k.id},${c.id})">${v.blocked?'恢复探视':'暂停探视'}</button>`:''}</div>${ready?`<button class="btn sm jade" onclick="A.kinCareTime(${k.id},${c.id})">陪${esc(k.name)}一会儿<small>精力−1</small></button>`:'<span class="hint">'+(v.last===S.turn?'本月已相伴':'眼下无法相见')+'</span>'}</article>`;
 }).join('');
}

// An existing, willing adult sister is a concrete follow-up, not an optional ambient roll.
function maternalSisterCandidates(m){return (m?.house?.relatives||[]).filter(p=>!p.parentRelativeId&&p.alive&&p.sex==='f'&&!p.consortId&&!p.married&&!p.declined&&p.willing&&natalAge(p)>=18&&!p.visit);}
function maternalSisterSource(m,manual=false){
 const status=m?.maternalArrival?.status;
 return !!(!S.over&&maternalAbsent(m)&&!m.maid&&!m.kinSuccessor&&kinCareChildren(m).length&&
  (!status||status==='pending'||manual&&status==='deferred')&&maternalSisterCandidates(m).length&&
  !harem().some(c=>kinCareChildren(m).some(k=>maternalKinCanAsk(c,k)||k.foster===c.id&&(KIN_TXT[c.kin?.[m.id]]||KIN_TXT[m.kin?.[c.id]]))));
}
function maternalSisterArrival(m,manual=false){
 if(!maternalSisterSource(m,manual))return null;
 if(!manual&&m.maternalArrival?.status!=='pending'&&!newConsortEventAllowed())return null;
 const candidates=maternalSisterCandidates(m),p=candidates.find(p=>p.id===m.maternalArrival?.relative)||candidates[0],children=kinCareChildren(m),names=children.map(k=>k.name).join('、');let done=false;
 const valid=()=>!done&&maternalSisterSource(m,true)&&maternalSisterCandidates(m).includes(p);
 const setStatus=status=>{m.maternalArrival={status,relative:p.id,turn:S.turn};};
 const record=text=>maternalCareRecord(p,m,children,text,children.map(maternalCaregiver).filter(Boolean));
 return {title:'姐妹来书 · 惦念幼子',por:natalPortrait(p),cast:children,valid,
  onShow:()=>{if(m.maternalArrival?.status==='pending')return;setStatus('pending');record(`${fullName(m)}${maternalAbsenceText(m)}后，${natalLabel(m,p)}${p.name}来信请求入宫，惦念${names}，愿参与照料。`);},
  text:`${fullName(m)}${maternalAbsenceText(m)}后，她的${natalLabel(m,p)}${p.name}从家中写来一封信。\n“听说${names}如今的情形，心里一直放不下。我愿入宫，也盼能照料她留下的孩子。”\n${maternalPlacementText(children)}\n已有养母的照顾，不会断掉这份亲缘。准她入宫之后，还会当面商议照料；孩子不会随之自动更换养母。`,choices:[
   {t:'准她入宫，封为贵人',cond:()=>rankCount(3)<RANK_CAP[3],why:'贵人位分已满，可先暂缓',f:()=>{if(!valid()||rankCount(3)>=RANK_CAP[3])return null;
    const g=makeNatalConsort(m,p);g.kinArrival={mother:m.id,pending:true,turn:S.turn};m.kinSuccessor=g.id;setStatus('accepted');done=true;
    addConsort(g,3,`为照料${fullName(m)}留下的孩子，自愿入宫`);maternalCareRecord(g,m,children,`${fullName(g)}获准入宫，先问起${names}；现有养母与居处未改变，待当面商议照料。`);save('auto');pushNow(kinArrivalGreeting(g));return null;}},
   {t:'暂缓入宫，保留这封家书',f:()=>{if(!valid())return null;done=true;setStatus('deferred');const text=`${p.name}为照料${names}请求入宫，陛下暂缓。家书保留，可在${fullName(m)}档案继续商议，孩子仍照原安排生活。`;record(text);save('auto');return text;}},
   {t:'婉拒入宫，维持现有照料',f:()=>{if(!valid())return null;done=true;setStatus('declined');const text=`${p.name}请求入宫照看${names}，陛下未允；孩子现有照料不变。`;record(text);save('auto');return text;}}
  ]};
}
function pendingMaternalSisterArrival(){
 if(!haremRestraintEnabled())return S.consorts.map(m=>maternalSisterArrival(m)).find(Boolean)||null;
 // One new-letter opportunity per month; many eligible families must not reroll it.
 const m=S.consorts.find(c=>c.maternalArrival?.status==='pending'&&maternalSisterSource(c))||S.consorts.find(c=>maternalSisterSource(c));
 return m?maternalSisterArrival(m):null;
}
A.maternalSisterArrival=function(id){if(modalOpen)return;const ev=maternalSisterArrival(byId(id),true);if(ev)pushEv(ev);};
function maternalSisterArrivalButton(m){return maternalSisterSource(m,true)?`<button class="btn sm jade" onclick="A.maternalSisterArrival(${m.id})">谈谈姐妹入宫照看孩子</button>`:'';}
