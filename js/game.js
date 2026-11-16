/* ============ 工具 ============ */
const $=s=>document.querySelector(s);
const R=()=>typeof PalaceActions==='undefined'?Math.random():PalaceActions.random(), ri=(a,b)=>a+Math.floor(R()*(b-a+1)), pick=a=>a[Math.floor(R()*a.length)], chance=p=>R()<p;
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rd=v=>Math.round(v);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pickW(a){const s=a.reduce((x,y)=>x+(y.w||1),0);let r=R()*s;for(const v of a){r-=(v.w||1);if(r<=0)return v}return a[a.length-1]}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));return '#'+((1<<24)|(f(n>>16)<<16)|(f(n>>8&255)<<8)|f(n&255)).toString(16).slice(1)}
function cnNum(n){const d='零一二三四五六七八九';if(n<=10)return n===10?'十':d[n];if(n<20)return '十'+d[n%10];const t=Math.floor(n/10),o=n%10;return d[t]+'十'+(o?d[o]:'')}

/* ============ 状态 ============ */
let S=null; const Q=[]; let modalOpen=false, curEv=null;
let modalInvoker, modalResult=null;
$('#modal').addEventListener('cancel',event=>event.preventDefault());
const UI={view:'title',sel:null,logF:'all'};
const E=()=>S.emp;
const alive=()=>S.consorts.filter(c=>c.alive&&!c.gone);
const harem=()=>alive().filter(c=>!c.cold&&!c.maid&&!c.templeStay&&!c.homeLeave);
const kidsAlive=()=>S.children.filter(k=>k.alive&&!k.removedFromRoyal);
const byId=id=>S.consorts.find(c=>c.id===id);
const kidById=id=>S.children.find(k=>k.id===id);
const kidAge=k=>Math.floor((S.turn-k.born)/12);
const empress=()=>alive().find(c=>c.rank===8&&!c.cold&&!c.maid);
const rankCount=r=>alive().filter(c=>c.rank===r&&!c.cold&&!c.maid).length;
const season=()=>S?Math.floor(((S.month+11)%12)/3):0; // 0春(1-3)…
function dateStr(s=S){return `${s.emp.era}${s.year===1?'元':cnNum(s.year)}年${MONTHS[s.month-1]}`}
function cName(c){
  if(c.rescuedGuest)return fullName(c)+'姑娘';
  if(c.maid) return c.near?`贴身宫女${c.given}`:`宫女${c.given}`;
  if(c.cold) return `${c.sur}庶人`;
  if(c.rank===8) return '皇后';
  if(journalContentVersion()>=24&&c.gouyi&&c.rank===2&&c.title==='瑞')return '瑞常在';
  if(c.title&&c.rank>=4) return c.title+RANKS[c.rank];
  if(S&&S.consorts.some(o=>o!==c&&o.alive&&!o.gone&&!o.maid&&!o.cold&&o.sur===c.sur&&o.rank===c.rank&&!(o.title&&o.rank>=4)))return c.sur+c.given[0]+RANKS[c.rank];
  return c.sur+RANKS[c.rank];
}
const fullName=c=>c.sur+c.given;
function kidName(k){
  if(k.removedFromRoyal)return k.name;
  const base=k.sex==='m'?`皇${ORD[k.ord-1]||k.ord}子`:`${ORD[k.ord-1]||k.ord}公主`;
  if(S.heir===k.id) return `太子 ${k.name}`;
  return `${k.title||base} ${k.name}`;
}
function log(t,big){S.log.push({d:dateStr(),t,b:big?1:0}); if(S.log.length>1500) S.log.splice(0,200)}
function story(c,t){c.story.push({d:dateStr(),t})}
function chg(o){
  const lab={prestige:'威望',people:'民心',treasury:'国库',health:'龙体'};const p=[];const e=E();
  for(const k in o){const v=o[k]; if(!v) continue; if(k==='treasury') e.treasury=rd(e.treasury+v); else e[k]=clamp(e[k]+v);
    p.push(`${lab[k]}${v>0?'+':''}${v}${k==='treasury'?'万两':''}`)}
  renderTop(); return p.join('　');
}
function cchg(c,o){
  const lab={favor:'恩宠',mood:'心情',aff:'情分',talent:'才情',virtue:'德行',looks:'容貌',scheme:'心机'};const p=[];
  for(const k in o){let v=rd(o[k]); if(!v) continue; c[k]=clamp(c[k]+v); p.push(`${lab[k]}${v>0?'+':''}${v}`)}
  return p.length?`${cName(c)}：${p.join(' ')}`:'';
}
const fx=(...a)=>'\n§'+a.filter(Boolean).join('　');
function toast(t){const d=document.createElement('div');d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2200)}
function maxEnergy(){const e=E();return 3+(e.style==='勤政'?1:0)-(e.health<35?1:0)}
function useE(){ if(!S||S.over) return false; if(E().energy<=0){toast('本月精力已尽，请「结束本月」');AU.sfx('err');return false} E().energy--; renderTop(); return true }

/* ============ 人物生成 ============ */
function makeGirl(o={}){
  const trait=o.trait||pickConsortTrait(), T=TRAITS[trait], fam=o.fam||pickW(FAMS);
  let g1=pick(GIV),g2=pick(GIV),nameRerolls=0; while(g2===g1){g2=pick(GIV);if(journalContentVersion()>=43&&++nameRerolls>=32&&g2===g1)g2=GIV[(GIV.indexOf(g1)+1)%GIV.length];}
  const sur=o.sur||pick(SUR.filter(x=>!S||x!==S.emp.sur));
  const girl={id:S.nid++, sur, given:o.given||(chance(.45)?g1:g1+g2), age:o.age||ri(16,19), trait, fam,
    looks:clamp(ri(40,88)+(T.looks||0)), talent:clamp(ri(30,85)+(T.talent||0)), virtue:clamp(ri(30,85)+(T.virtue||0)), scheme:clamp(ri(15,75)+(T.scheme||0)),
    rank:0, palace:'', favor:ri(5,15), mood:65, aff:ri(10,25), preg:0, prot:false, lastBirth:-99, alive:true, cold:false, gone:false,
    seed:ri(1,2e9), title:'', story:[], nights:0, known:false};
  assignConsortPortrait(girl,true);initSolitary(girl);ensureConsortFertility(girl);
  if(consortTraitsActive())girl.hp=consortHealthBase(girl);
  return girl;
}
function assignPalace(c){
  autoResidence(c);reconcileResidences();
}
function addConsort(c,rank,why,{major=false,recordAdmission=true}={}){
  const previousKin=new Map(Object.keys(c.kin||{}).map(id=>[+id,S.rel?.[rk(c,{id:+id})]]));
  c.rank=rank; c.enteredAt=S.turn; c.enteredMonth=S.month; S.consorts.push(c); assignPalace(c); S.ys.c++; deepen(c); initRel(c); assignArc(c); acceptPastLife(c); initTimeTraveler(c); clanKey(c); if(c.kin)for(const id in c.kin){const o=byId(+id);if(o&&o.alive)relAdd(c,o,(previousKin.get(o.id)??(isRival(c,o)?-30:45))-relGet(c,o))}
  story(c,`${why}，封为${RANKS[rank]}，赐居${c.palace}。`);
  if(recordAdmission)log(`${fullName(c)}（${c.fam.t}之女）${why}，封${RANKS[rank]}。`,major);
  houseOf(c);portraitAdmission(c);familyAdmissionReactions(c);
}

/* ============ 弹窗与事件队列 ============ */
function fmt(t){return String(t).split('\n').map(l=>l.startsWith('§')?`<p class="fx">${esc(l.slice(1))}</p>`:l?`<p>${esc(l)}</p>`:'').join('')}
// Portraits may show someone mentioned in a letter. Only `present` means physically here.
function eventStillValid(ev){
  return !!ev&&(!ev.valid||ev.valid())&&(ev.present||[]).every(p=>p?.sex?childInPalace(p):inPalace(p));
}
function pushEv(ev){
  if(!eventStillValid(ev))return;
  if(ev.maidEncounter){
    if(!maidEncounterReady())return;
    S.flags.lastMaidEncounter=S.turn;
  }
  ev.onQueue?.();
  Q.push(ev);if(!modalOpen)nextEv();
}
function pushNow(ev){if(!eventStillValid(ev))return;Q.unshift(ev);if(!modalOpen)nextEv()}
function nextEv(){
  if(typeof PalaceActions!=='undefined'&&!PalaceActions.busy)return PalaceActions.run('next',[],()=>nextEv());
  modalResult=null;
  while(Q.length){const ev=Q.shift();if(eventStillValid(ev)){openModal(ev);return}}
  const invoker=modalInvoker;
  modalInvoker=null;
  modalOpen=false;curEv=null;const modal=$('#modal');modal.close?.();modal.hidden=true;modal.setAttribute('data-scene','');checkEnd();render();
  if(!modalOpen&&invoker){
    const replacement=invoker.id?document.getElementById(invoker.id):
      [...$('#app').querySelectorAll('button')].find(button=>button.getAttribute('onclick')===invoker.getAttribute('onclick'));
    const target=replacement||$('#panel');
    target.focus?.({preventScroll:true});
  }
}
function eventPortraits(ev){
  const seen=new Set();
  return [ev.por,...(ev.cast||[])].filter(person=>{
    if(!person)return false;
    const key=person.id??person;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
function eventCast(people,event){
  const label=person=>event?.personalStory&&S.consorts.includes(person)?fullName(person)+' · '+cName(person):porName(person);
  return people.length>1?`<div class="event-cast" aria-label="${event?.personalStory?'故事相关人物':'事件在场人物'}">${people.map(person=>
    `<figure>${porImg(person,104)}<figcaption>${esc(label(person))}</figcaption></figure>`).join('')}</div>`:'';
}
const EVENT_ILLUSTRATIONS={
  'spring-garden':'几瓣海棠落进池里，贴着水纹慢慢打转。你沿回廊走过去，隔着花枝看见一个熟悉的身影。',
  'mother-window':'竹影在窗纸上轻轻摇。你正要让人通传，忽听里面有人低低唤了一声她的乳名。',
  'lantern-street':'沿街的灯一盏盏亮起。桥头人潮一挤，你伸手去牵她，掌心只擦过一点衣袖。',
  'east-sea':'船身轻轻一晃，栏外的礁石白了一瞬。再抬眼，日光已沿着浪尖，一路照到雾里的岛影。',
  'snow-painting':'画卷暂搁在廊栏上。檐外雪还在落，隔着一方院子，连脚步声都轻了。',
  'school-window':'私塾的窗半开着。站在墙外看不见书上写些什么，先生每念一句，却都能听得真切。',
  'dream-corridor':'“每回都走到那处拐角。廊外天已经亮了，臣妾还是想不起自己在等谁。”',
  'kite-eaves':'檐影里露出半边纸燕翅。一截红纸尾扑在瓦上，风再起时，断了的线也跟着一跳。',
  'garden-fish':'水面落了几点碎光。她的手影才移过青瓷缸，两尾小鱼已经摇着尾巴凑了上来。',
  'plum-lattice':'日光穿过花窗，照得枝上那几枚李子像是熟透了。孩子仰着头看了半晌，还是没伸手。',
  'red-plum-snow':'她说最难调的是雪光里的那一点红。笔尖只重半分，枝旁的雪也像添了颜色。',
  'rain-lotus':'廊下静了好一会儿，才听见一滴雨敲在卷起的荷叶上。紧接着，满池都是轻轻接上的声响。',
  'old-inkstone':'晨光擦过砚角，那一处磨得最亮。新写的纸页搁在旁边，墨迹还湿，孩子舍不得拿手去碰。',
  'old-teabowl':'她指腹沿着盏口慢慢转了一圈，那一处釉面早已磨得温润。日光里，茶还冒着细细的热气。',
  'west-lake-rain':'船篷还滴着水，天光已从云缝里落到湖上。她靠在你肩头，望了许久。',
  'rain-corridor-umbrella':'天光透过伞纸，照出浅浅的伞骨。你这边没沾着雨，她的衣袖却湿了一角。',
  'liuxi-broken-bridge':'断桥下水正急，渡船贴着岸。',
  'qionglin-spilled-cup':'酒沿着桌缝淌下去。方才那句诗，谁也没有接。',
  'child-wooden-boat':'小舟一歪，墨线一头沉到水里。孩子凑得更近了。',
  'huashan-stone-steps':'山雾掠过石阶。转过一道弯，前头又露出几级。',
  'grass-stems-sunlit':'风过草地，几根细茎先弯了腰。孩子蹲下来，一根一根地挑。',
  'fallen-petals-after-rain':'几片花瓣落在湿草间。枝上还有花，在薄薄的天光里轻轻摇。',
  'summer-lotus-walk':'廊下凉快。一阵风过来，池边两片荷叶先动了。',
  'autumn-osmanthus-walk':'走到桂树下，香气忽然浓了。石径上落着几粒金黄的小花。',
  'xishan-hot-spring':'天光照进雾里，水边才一点点亮起来。',
  'moonlit-needle':'针身闪过一点月光，彩线还没捻好。',
  'west-window-second-tea':'靠近你的那盏茶，还冒着热气。',
  'spring-orchid-bloom':'春兰开了，花瓣薄得能透光。',
  'peony-corridor-rest':'廊下风暖，芍药挨着栏杆开。最外一层花瓣轻轻动了动。',
  'spring-crabapple-walk':'风穿过回廊，垂下来的海棠花轻轻点了一下。',
  'winter-plum-walk':'雪地上亮起一线晴光，檐边那枝红梅也跟着亮了。',
  'floating-willow-catkins':'柳丝才动，一点白絮就贴着水光漂远了。',
  'scholar-exam-papers':'花笺搁在殿试卷旁。同一句诗，你已经读过一回。',
  'scholar-gate-letter':'宫门外的日光斜了。那封信折得很小，展开也只有两个字。',
  'frontier-family-letter':'她手边的家书折了又展，系信的细绳还留在窗边。',
  'frontier-pass-evening':'北境的日光再往下落一点，关道就会没进山影里。',
  'palace-snow-stairs':'台阶上的雪还没扫净。有人在阶前停了很久。',
  'craft-repaired-book':'日光照着新旧两层纸，补过的地方还能看出一线浅痕。',
  'craft-pavilion-qin':'水光映到琴身上。一根细弦亮着，仿佛刚停了声。',
  'craft-flower-album':'册页上的花还没画完。窗外那枝被风吹得偏了偏。',
  'secret-old-scroll':'灯下露着半卷旧纸，卷边一层叠一层。',
  'palace-stone-threshold':'门槛内外，天光刚好落在石纹上一线。',
  'illness-rest-window':'窗只开了一半，一点天光透进来，落在轻轻动着的帘上。',
  'kunlun-snow-fungus':'雪线边那一点赭红，是郎中提起的昆仑雪灵芝。',
  'willow-by-pillow':'枕边还搁着从西湖带回来的柳枝。晨光照到叶尖上。',
  'western-envoy-bell':'远处的路转过关口。似乎还能听见驼铃的余音。',
  'western-palace-screen':'光透过屏纱，只能看见一层模糊的影。',
  'queen-palace-incense':'香炉旁静着一缕烟，越过窗边的天光就看不见了。',
  'city-market-window':'京城街角，日光穿过半卷的帘。街面渐渐安静下来。',
  'city-storehouse-ledger':'库门里明暗相交，纸上系着的细绳还没有解开。',
  'kite-roof-ridge':'屋脊上的薄纸抖了抖，断线跟着风一跳。',
  'kite-by-the-window':'窗边那只纸鸢安安静静，风只吹得动细长的尾。',
  'festival-lantern-making':'天还亮着，街边的灯已经挂了起来。',
  'hezhong-river-bank':'河间的晨雾正在散，风把几根芦苇压向水边。',
  'gouyi-go-stone':'棋盘边有一颗白子，伏在这一格安静的日光里。',
  'gouyi-study-window':'她写到一半停下来。方窗外，枝头的粉花晃了晃。',
  'hongjian-poem-at-dusk':'傍晚的光从半开的窗进来，照到小笺折起的那一角。',
  'quiet-palace-keepsakes':'窗边的浅匣安安静静，外头的树影慢慢移过来。',
  'western-moon-window':'窗前静得只剩月色，远处的屋瓦也淡了下去。'
};
function eventIllustration(key){
  if(!Object.hasOwn(EVENT_ILLUSTRATIONS,key))return '';
  return `<figure class="event-illustration" data-illustration="${key}"><img src="./assets/images/story-${key}.webp" alt="" decoding="async" onload="this.classList.add('event-illustration-loaded')"><figcaption>${esc(EVENT_ILLUSTRATIONS[key])}</figcaption></figure>`;
}
function openModal(ev){
  if(!modalOpen&&document.activeElement?.matches('button,input,select')) modalInvoker=document.activeElement;
  modalOpen=true;curEv=ev;modalResult=null;if(ev.onShow)ev.onShow();const b=$('#mbox');
  const people=eventPortraits(ev);
  const rareNotice=jinyiweiRareNotice(ev,people);
  // Portrait buttons distinguish people, not several actions for the same person.
  const choicePeople=new Set(ev.choices.filter(c=>c.portrait||c.person).map(c=>(c.portrait||c.person).id??c.person));
  const showChoicePortraits=choicePeople.size>1;
  const arrival=ev.scene==='palace-arrival';
  let h=`<h2 class="mtitle" id="event-title" tabindex="-1">${esc(ev.title)}</h2>${ev.scene==='mourning'?mourningScene():''}${eventIllustration(ev.illustration)}${arrival?palaceArrivalHTML(ev):ev.gardenTables?banquetSeating(ev.gardenTables):eventCast(people,ev)}<div class="mbody"${arrival?' hidden':''}>`;
  if(people.length===1&&!ev.gardenTables)h+=`<div class="mpor">${porImg(people[0],112)}<div>${esc(porName(people[0]))}</div></div>`;
  h+=`<div class="mtext">${ev.jewelry?`<figure class="event-jewelry">${jewelryImage(ev.jewelry,88)}<figcaption>${esc(JEWELRY[ev.jewelry]?.name||'')}</figcaption></figure>`:''}${fmt(ev.text)}${rareNotice?`<p class="hint">${esc(rareNotice)}</p>`:''}${ev.ref?`<p class="ref">典出 · ${ev.refURL?`<a href="${esc(ev.refURL)}" target="_blank" rel="noopener noreferrer">${esc(ev.ref)}</a>`:esc(ev.ref)}</p>`:''}${ev.input?`<input id="minput" class="inp" maxlength="${ev.input.max||4}" value="${esc(ev.input.def||'')}" aria-label="输入">`:''}</div></div><div class="mch${showChoicePortraits?' event-choices':''}">`;
  ev.choices.forEach((c,i)=>{
    const ok=!c.cond||c.cond();
    const style=ev.danger?(c.f?' danger':' quiet'):c.primary||ev.choices.length===1||(ev.input&&i===0)?' primary':'';
    const label=`${esc(c.t)}${c.preview?`<small class="choice-preview">${esc(c.preview)}</small>`:''}${!ok&&c.why?`<small>${esc(c.why)}</small>`:''}`;
    const portrait=showChoicePortraits&&(c.portrait||(typeof c.person==='object'?c.person:byId(c.person)));
    h+=`<button class="btn${style}${portrait?' event-person-choice':''}" ${ok?'':'disabled'} onclick="choose(${i})">${portrait?`${porImg(portrait,60)}<span>${label}</span>`:label}</button>`;
  });
  b.innerHTML=h+'</div>';const modal=$('#modal');modal.setAttribute('data-scene',ev.scene||'');modal.hidden=false;b.scrollTop=0;
  if(!modal.open) modal.showModal?.();
  if(ev.sfx) AU.sfx(ev.sfx); else AU.sfx('page');
  const inp=ev.input&&$('#minput');
  (inp||$(ev.scene==='monthly-court'?'#mbox .mch button:not(:disabled)':'#event-title'))?.focus?.({preventScroll:true});
  inp?.select?.();
}
function choose(i,inputValue){
  const entered=inputValue!==undefined?inputValue:curEv?.input?($('#minput').value||''):null;
  if(typeof PalaceActions!=='undefined'&&!PalaceActions.busy)return PalaceActions.run('choose',[i,entered],()=>choose(i,entered));
  if(modalResult)return;
  if(!eventStillValid(curEv)){toast('人物处境已变，这件事已不再适用。');nextEv();return;}
  const c=curEv&&curEv.choices[i];if(!c)return;if(c.cond&&!c.cond())return;
  const val=curEv.input?((entered||'').trim().slice(0,curEv.input.max||4)||curEv.input.def):undefined;
  AU.sfx('click');const res=c.f?c.f(val):null;
  if(res) showRes(res); else nextEv();
}
function showRes(res){
  if(typeof res==='string') res={text:res};
  modalResult=res;
  const b=$('#mbox');
  const cast=res.por?'':eventCast(eventPortraits(curEv),curEv);
  const illustration=eventIllustration(res.illustration);
  b.innerHTML=`<h2 class="mtitle" id="event-title"${illustration?' tabindex="-1"':''}>${esc(res.title||curEv.title)}</h2>${curEv.scene==='mourning'?mourningScene():''}${illustration}${cast}<div class="mbody">${res.por?`<div class="mpor">${porImg(res.por,96)}</div>`:''}<div class="mtext">${fmt(res.text)}</div></div><div class="mch"><button class="btn gold" onclick="nextEv()">继续</button></div>`;
  b.scrollTop=0;renderTop();
  $(illustration?'#event-title':'#mbox .mch button')?.focus?.({preventScroll:true});
}

/* ============ 侍寝与互动 ============ */
function nightWith(c,fromEvent){
  if(!inPalace(c)||c.preg||c.cardWithdrawn)return;
  if(consortRecoveryActive()&&consortNightReason(c)){toast(consortNightReason(c));return;}
  if(!useE()) return;
  const e=E();e.nightsMonth=(e.nightsMonth||0)+1;S.ys.n++;
  const lines=isSolitary(c)?['她合上读到一半的书，给你留出身侧的位置。夜深后仍有半晌，各自静静想着白日未尽的话。','她不说讨巧的话，只把茶递到你手里。你们谈了一回诗书，意见未必相同，她却比平日更愿意说了。']:(NIGHT[c.trait]||[]).concat(NIGHT._),line=familyScenesEnabled()?nightVoice(c):pick(lines);
  const fm=e.style==='风流'?1.5:1;
  const s=cchg(c,{favor:10*fm*(XIN[xinOf(c)].favorMul||1),mood:10,aff:routineAffection(c,c.trait==='痴情'?9:6)});
  c.nights++;noteHaremVisit(c,'night');c.lastPersonalAttention=S.turn;recordImperialNight(c);S.flags.lastNight=c.id;if(c.nights===1)remember(c,'first','第一次侍寝');
  const p=consortConceptionChance(c);
  if(!c.preg&&(!c.delivery||c.delivery.settled)&&S.turn-c.lastBirth>=3&&chance(p)){c.preg=1;c.pregnancyFather={kind:'emperor',gen:S.gen,mother:c.id,name:e.sur+e.name,wen:e.wen,wu:e.wu,conceived:S.turn};beginPregnancyCalendar(c);}
  harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-2);relAdd(o,c,-3)}});
  story(c,`奉召侍寝。${line}`);
  log(`召${cName(c)}侍寝。`);
  setScene('night');
  pushNow({title:'春宵',por:c,sfx:'chime',text:`是夜，敬事房传${cName(c)}侍寝。\n${line}${fx(s)}`,choices:[
    {t:'翌日赏赐（国库-10万两）',f:()=>{AU.sfx('coin');story(c,'侍寝翌日，陛下另赏了一对白玉镯子。');remember(c,'gift','侍寝翌日收到一对白玉镯子');return `你命人送去一对白玉镯子。${fx(chg({treasury:-10}),cchg(c,{mood:8,aff:2}))}`}},
    {t:'就此作罢'}]});
}
const A={
  go(v,id){
    if(PAGE_ORIGIN_VIEWS.includes(v)&&UI.view!==v&&!PERSON_DETAIL_VIEWS.includes(UI.view))(UI.pageFrom ||= {})[v]=UI.view;
    rememberPersonRoute(v,id);UI.view=v;UI.sel=id;
    if(v==='palace')preparePalaceLife(id);
    if(v==='consort'&&S&&!haremReturnActive())noteHaremVisit(byId(id));
    if(v==='consort'&&S?.turn===0&&!S.flags.firstEmpressVisit&&id===empress()?.id){
      S.flags.firstEmpressVisit=true;save('auto');
    }
    AU.sfx('click');render();
    if(v!=='title')$('#panel').scrollIntoView({block:'nearest',behavior:'smooth'});
  },
  court(){
    if(!S||S.over||modalOpen)return;
    const ev=monthlyCourtEvent();
    if(!ev){
      if(monthlyCourtBatchEnabled()){
        toast(monthlyCourtStatus().done?'本月三份奏折均已批复，下月再呈新奏。':'暂无可呈阅的奏折，可继续处理其他事务。');
        render();return;
      }
      if(S.flags.monthlyCourt?.done){A.go('government');return;}toast('这份奏折已不适用。');return;
    }
    const brief=S.flags.monthlyCourt;
    const delegation=brief.floodFollowup||brief.locustFollowup||brief.locustDispatched?null:reliefDelegation(brief.index);
    const installment=brief.index===FLOOD_INDEX&&!brief.floodFollowup?stagedFloodRelief(brief):null;
    const freightBooking=installment&&brief.floodNeed==='grain'&&grainReserveReady()?stagedFloodRelief(brief,true):null;
    const waiver=grainPaymentWaiverChoice(brief);
    ev.scene='monthly-court';
    ev.choices=[...ev.choices,...[delegation,installment,freightBooking,waiver].filter(Boolean)].map((choice,index)=>{
      const cost=choice.delegated?0:1;
      return {...choice,t:`${choice.t}（${cost?'精力 −1':'免耗精力'}）`,
        preview:choice.preview||COURT_PREVIEWS[brief.index]?.[index],
        cond:()=>!brief.done&&(!cost||E().energy>0)&&(!choice.cond||choice.cond()),why:choice.why||'精力不足',
        f:()=>{
          if(brief.done||S.flags.monthlyCourt!==brief)return;
          if(choice.inspectLocust)return saveGrainAction(()=>{
            const record={...brief,locustNeed:brief.locustAuditNeed,locustAudited:true};
            S.flags.monthlyCourt=record;
            log('户部核实了蝗灾粮情，奏折仍待批复。');
            const result=`户部核实：${brief.locustAuditNeed==='near'?'近村':'远村'}先断粮。可重新打开本月奏折调粮。`;
            if(choice.locustFreightBooking){
              record.locustFreightBooked=true;
              log('蝗灾，户部付订金预订本月远村仓车。');
              return `${result}\n远村仓车已订好。${fx(chg({treasury:-LOCUST_FREIGHT_DEPOSIT}))}`;
            }
            if(!choice.f)return result;
            const relief=choice.f();
            record.locustDispatched=true;
            log('蝗灾，户部先发半批仓粮救济近村。');
            record.result={title:ev.title,choice:choice.t,text:`${relief.replace(/§/g,'')}\n${result}`};
            return `${result}\n${relief}`;
          });
          const settle=record=>{
            record.done=true;
            S.flags.lastCourt=ev.title;
            log(`批复奏折「${ev.title}」，${choice.t}。`);
            const result=choice.f?.();
            record.result={title:ev.title,choice:choice.t,text:(typeof result==='string'?result:result?.text||'').replace(/§/g,''),
              person:choice.person??ev.person,child:ev.sons?.[index]};
            return result;
          };
          if(choice.grainTransaction)return saveGrainAction(()=>settle(S.flags.monthlyCourt={...brief}),Boolean(cost));
          if(cost&&!useE())return;
          const result=settle(brief);
          save('auto');
          return result;
        }};
    });
    ev.choices.push({t:'稍后再议'});
    setScene('court');pushEv(ev);
  },
  night(id){const c=byId(id);if(!inPalace(c)||c.preg||c.cardWithdrawn)return;nightWith(c)},
  promote(id){const c=byId(id),nr=c.rank+1;
    if(nr>=8){toast('立后请用「册立皇后」');return}
    if(rankCount(nr)>=RANK_CAP[nr]){toast(`${RANKS[nr]}之位已满（${RANK_CAP[nr]}人）`);return}
    const doIt=(title)=>{c.rank=nr;if(title)grantConsortTitle(c,title);
      let txt=`晋${fullName(c)}为${cName(c)}。`;const s=cchg(c,{mood:20,aff:8,favor:3});let s2='';
      if(c.fam.p<30&&nr>=6){s2=chg({prestige:-3});txt+='\n朝中有大臣上书，言其出身微贱，不宜居高位。'}
      if(c.fam.p>=70&&nr>=5){s2=chg({prestige:2});txt+='\n其父在朝中深感皇恩，愈发尽心。'}
      harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-6);relAdd(o,c,-6)}});
      story(c,`晋封为${cName(c)}。`);remember(c,'promo','晋位');setXin(c,'欢喜',`晋为${cName(c)}`);clanEcho(c,'up');harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous&&relGet(o,c)<0)setXin(o,'嫉恨',`${fullName(c)}晋了位分`,c.id)});log(`晋${fullName(c)}为${cName(c)}。`,nr>=5);AU.sfx('joy');
      return txt+fx(s,s2)};
    if(nr>=4&&!c.title){
      const opts=shuffle(TITLES.filter(t=>!harem().some(x=>x.title===t))).slice(0,3);
      pushEv({title:'拟定封号',por:c,text:`${fullName(c)}将晋为${RANKS[nr]}，请陛下钦定封号（一字），或自拟：`,input:{def:opts[0],max:2},
        choices:[{t:'就用这个封号',f:v=>doIt(v)},...opts.slice(1).map(o=>({t:`「${o}」`,f:()=>doIt(o)}))]});
    } else pushEv({title:'晋封',por:c,text:`晋${fullName(c)}为${RANKS[nr]}？`,choices:[{t:'准',f:()=>doIt()},{t:'再想想'}]});},
  demote(id){const c=byId(id);if(c.rank<=0||c.rank===8)return;
    pushEv({title:'降位',danger:true,por:c,text:`降${cName(c)}为${RANKS[c.rank-1]}？`,choices:[{t:'降位',f:()=>{c.rank--;reconcileResidences();const s=cchg(c,{mood:-25,aff:-10,favor:-5});story(c,`被降为${RANKS[c.rank]}。`);remember(c,'hurt','被降位');setXin(c,(c.t2==='记仇'||c.scheme>60)?'怨恨':'委屈','被降了位分','emp');log(`降${fullName(c)}为${RANKS[c.rank]}。`);AU.sfx('sad');return `${fullName(c)}跪地谢恩，泪落无声。${fx(s)}`}},{t:'作罢'}]})},
  rename(id){const c=byId(id);pushEv({title:'更改封号',por:c,text:'请为她拟一个新的封号：',input:{def:c.title||pick(TITLES),max:2},choices:[{t:'赐此封号',f:v=>{grantConsortTitle(c,v);story(c,`陛下赐封号「${v}」。`);return `自今日起，她便是${cName(c)}。${fx(cchg(c,{mood:10,aff:4}))}`}},{t:'作罢'}]})},
  crown(id){const c=byId(id);if(empress()){toast('中宫已有皇后');return}
    pushEv({title:'册立皇后',por:c,text:`册${fullName(c)}为皇后，入主坤宁宫？\n册封大典需耗费国库一百万两。`,choices:[
      {t:'择吉日行册封礼',f:()=>{c.rank=8;assignPalace(c);AU.sfx('gong');
        let s=chg({treasury:-100,prestige:c.fam.p>=50?6:2});
        if(c.virtue<40) s+='　'+chg({people:-3});
        story(c,'钦天监择吉日，行册后大典，入主坤宁宫，母仪天下。');log(`册${fullName(c)}为皇后。`,1);
        harem().forEach(o=>{if(o!==c&&o.scheme>60)o.mood=clamp(o.mood-10)});
        return `礼炮九响，百官朝贺。${fullName(c)}凤冠霞帔，自此母仪天下。${fx(s,cchg(c,{mood:30,aff:15}))}`}},{t:'再想想'}]})},
  depose(id){const c=byId(id);
    pushEv({title:'废后',danger:true,por:c,text:`废黜皇后乃动摇国本之事。是否废去${fullName(c)}的后位？`,choices:[
      {t:'降为贵妃，迁出坤宁宫',cond:()=>rankCount(6)<2,why:'贵妃之位已满',f:()=>{c.rank=6;assignPalace(c);const s=chg({prestige:-6});story(c,'被废去后位，降为贵妃。');log(`废皇后${fullName(c)}，降为贵妃。`,1);AU.sfx('sad');return `满朝哗然。${fx(s,cchg(c,{mood:-40,aff:-25}))}`}},
      {t:'废为庶人，打入冷宫',f:()=>{c.cold=true;c.palace='冷宫';const s=chg({prestige:-10,people:-3});story(c,'被废去后位，打入冷宫。');log(`废皇后${fullName(c)}，打入冷宫。`,1);AU.sfx('sad');return `凤冠跌落在地，珠翠四散。${fx(s,cchg(c,{mood:-60,aff:-40}))}`}},
      {t:'作罢'}]})},
  cold(id){const c=byId(id);if(c.rank===8){A.depose(id);return}
    pushEv({title:'打入冷宫',danger:true,por:c,text:`将${cName(c)}打入冷宫？`,choices:[{t:'打入冷宫',f:()=>{const s=c.fam.p>=70?chg({prestige:-3}):'';c.cold=true;c.oldPalace=c.palace;c.palace='冷宫';story(c,'触怒天颜，被打入冷宫。');remember(c,'hurt','被打入冷宫');setXin(c,(c.scheme>60||c.t2==='记仇')?'怨恨':'心如死灰','被打入冷宫','emp');clanEcho(c,'down');log(`${fullName(c)}被打入冷宫。`,1);AU.sfx('sad');return `宫门落锁，杂草丛生。${fx(s,cchg(c,{mood:-40,aff:-20,favor:-30}))}`}},{t:'作罢'}]})},
  uncold(id){const c=byId(id);c.cold=false;if(c.rank>3)c.rank=Math.max(0,Math.min(c.rank,3));assignPalace(c);const s=cchg(c,{mood:35,aff:10,favor:10});story(c,`蒙陛下开恩，出冷宫，复为${RANKS[c.rank]}。`);remember(c,'saved','出冷宫');c.xin={k:'平和',t:S.turn};setXin(c,'感激','被放出冷宫');log(`${fullName(c)}出冷宫，复为${RANKS[c.rank]}。`);AU.sfx('joy');toast(s);render()},
  away(id){const c=byId(id);pushEv({title:'遣出宫',danger:true,por:c,text:`许${fullName(c)}出宫，往城外静慈庵带发修行？此后她便不在后宫名册之中。`,choices:[{t:'准她离宫',f:()=>{c.gone=true;story(c,'奉旨出宫，往静慈庵带发修行。青灯古佛，了此余生。');log(`${fullName(c)}出宫修行。`,1);return '马车驶出神武门，再没有回头。'}},{t:'作罢'}]})},
};

/* ============ 回合推进 ============ */
A.endMonth=function(){
  if(!S||S.over||modalOpen)return;const e=E();
  const delivery=pendingDelivery();if(delivery){A.resumeBirth(delivery.id);return;}
  // 财政
  const localGrainPayment=localGrainPaymentDue()?localGrainBalance():0;
  const hongjianIncome=typeof settleHongjianIncome==='function'?settleHongjianIncome():0;
  const inc=rd(45+e.people*1.1+(S.flags.canal?25:0))+hongjianIncome,exp=alive().reduce((s,c)=>s+(c.cold?1:STIPEND[c.rank]),0)+kidsAlive().reduce((s,k)=>s+3+(k.tutor?5:0),0)+localGrainPayment;
  e.treasury+=inc-exp;
  if(localGrainPayment){
    clearLocalGrainPayment();
    log(`户部结清灾区粮商的赈粮尾款 ${localGrainPayment} 万两。`);
  }
  const monthDate=dateStr(), brief=S.flags.monthlyCourt;
  let court=brief?.turn===S.turn&&brief.gen===S.gen?brief.result:null;
  const courts=monthlyCourtBatchEnabled()?monthlyCourtCompleted().map(item=>item.result).filter(Boolean):null;
  if(courts&&court&&!courts.includes(court))courts.push(court);
  if(courts&&!court)court=courts.at(-1)||null;
  if(floodReliefDue()){
    delete S.flags.floodRelief;
    const text='本月未续拨赈银，灾区粮食供给中断，民心 −3。';
    chg(FLOOD_UNFUNDED);
    log(text);
    court={title:'黄河决堤 · 赈灾回奏',choice:'未续拨',text};
    if(courts)courts.push(court);
  }
  if(locustReliefDue()){
    delete S.flags.locustRelief;
    chg(LOCUST_UNFUNDED);
    log(LOCUST_UNFUNDED_TEXT);
    court={title:'蝗灾 · 远村补粮回奏',choice:'未按期补粮',text:LOCUST_UNFUNDED_TEXT};
    if(courts)courts.push(court);
  }
  const people=S.consorts.flatMap(c=>{
    const latest=c.story?.findLast(entry=>entry.d===monthDate);
    return latest&&!(S.turn===0&&latest===c.story[0])?[{id:c.id,text:latest.t}]:[];
  });
  S.flags.lastMonthReview={date:monthDate,inc,exp,court,...(courts?{courts}:{}),people:continuityReview(people),...(hongjianIncome?{hongjianIncome}:{}),...(localGrainPayment?{localGrainPayment}:{})};
  recordHaremCourtMonth();
  // 后宫
  const returnedMaidNotices=[];
  for(const c of alive()){
    if(!c.cold){c.favor=clamp(c.favor-(c.bond?0:c.trait==='淡泊'?1:2));if(c.favor<25)c.mood=clamp(c.mood-3);else if(c.favor>60)c.mood=clamp(c.mood+1)}else c.mood=clamp(c.mood-3);
    if(c.preg>0){
      concealedLossTick(c);c.preg++;
      if(c.preg===2){
        if(returnedMaidPregnancy(c))returnedMaidNotices.push(c);
        else pushEv(pregEvent(c));
      }
      if(c.preg>=(c.pregnancyCalendar?.term||10))pushEv(birthEvent(c));
    }
  }
  if(typeof settleHaremStewardReward==='function'){
    const stewardship=settleHaremStewardReward();if(stewardship)S.flags.lastMonthReview.stewardship=stewardship;
  }
  maternalTick();alive().forEach(c=>{xinTick(c);visitorTick(c)});kidsAlive().forEach(growKid);
  finishSelection();
  // 时间
  S.turn++;S.month++;let newYear=false;
  UI.view='map';UI.sel=null;
  if(S.flags.impeachmentReview?.turn<S.turn||
      (brief?.review&&!brief.done&&brief.turn===S.turn-1&&brief.gen===S.gen)){
    delete S.flags.impeachmentReview;
    log('查账回奏未获批复，弹劾案已归档。');
  }
  if(S.month>12){S.month=1;S.year++;e.age++;newYear=true;alive().forEach(c=>c.age++)}
  consortHealthTick();
  for(const maid of returnedMaidNotices)pushEv(pregEvent(maid));
  annualBirthOmenTick();
  const revenue=legacyPendingAction()?null:annualRevenueTick();
  if(!legacyPendingAction()){postingTick();incognitoTick();}
  homeLeaveTick();
  cohabitationTick();
  S.consorts.forEach(solitaryHouseholdTick);
  let dh=-.17-(e.age>40?(e.age-40)*.05:0)-Math.max(0,(e.nightsMonth||0)-3)*1.2-(e.style==='风流'?.05:0);
  e.health=clamp(e.health+dh);e.nightsMonth=0;e.energy=maxEnergy();
  if(e.treasury<0){const d=Math.min(8,Math.ceil(-e.treasury/400));chg({people:-1-d,prestige:-1});log(`国库亏空${-e.treasury}万两，百官俸禄迟发，民间加征赋税。`)}
  toast(`${monthDate}　月入${inc}　支出${exp}`);
  // 岁末总结
  if(newYear)snapshotYear();
  if(newYear){const y=S.ys;pushEv({title:'岁首',sfx:'chime',text:`爆竹声中一岁除。${dateStr()}，陛下${e.age}岁。\n去岁：新入宫${y.c}人，皇嗣降生${y.b}位，侍寝${y.n}次。\n国库${e.treasury}万两，威望${rd(e.prestige)}，民心${rd(e.people)}。`,choices:[{t:'新岁新气象'}]});S.ys={c:0,b:0,n:0}}
  if(revenue)pushEv(revenue);
  // 事件
  if(selectionSkipTimingActive()){const selectionOffer=scheduledSelectionEvent();if(selectionOffer)pushEv(selectionOffer);}
  else if(S.month===2&&S.turn-S.flags.lastXX>=34&&newConsortEventAllowed()) pushEv({title:'三年大选',sfx:'chime',text:'又到三年一度的大选之期，各地秀女已候于储秀宫。',choices:[{t:'前去看看',f:()=>{genCands();UI.view='xx';return null}},{t:'今年免了',f:()=>{S.flags.lastXX=S.turn;return fx(chg({people:2}))}}]});
  reconcileResidences();archivePastLives();travelerLifeTick();daoLifeTick();immortalTick();childTempleTick();relTick();consortSocialTick();kidRelTick();clanTick();dowagerTick();initiativeTick();familyLifeTick();childLifeTick(true);courtTick();natalFamilyTick();seasonalTick();palaceDutiesTick();palaceRomanceTick();palaceParentageTick();marriedLifeTick();royalKinContactTick();personalExperienceTick();journeyTick();maternalTick();historyTick();continuityTick();personalLifeTick();livedRelationshipsTick();
  const passing=dowagerPassingEvent();if(passing)pushEv(passing);
  const princeSuccession=princeSuccessionTick();
  const comingOfAge=royalComingOfAgeEvent();
  const fiefDockets=princeQuarterReports();
  const must=[passing?null:haremRemonstranceEvent(),passing?null:pendingImmortalEvent(),passing?null:arcTick(),heirTick(),milestone(),parentageReportEvent(),birthSwapClueEvent(),birthSwapSearchReport(),pendingBirthSwapJustice(),pendingKinGreeting(),pendingMaternalKinCare(),pendingMaternalSisterArrival(),pendingDaoVoyage(),pendingTravelerEvent(),pendingOfficialReport(),pendingConcealedLoss(),...(legacyPendingAction()?[]:[pendingIncognitoReport(),passing?null:jingtishiEvent(),passing?null:selectionCouncilEvent()]),passing||typeof pendingHaremStewardEvent!=='function'?null:pendingHaremStewardEvent(),...(familyGardenActive()&&!passing?[familyGardenMonthlyEvent(),familyGardenDisputeEvent()]:[])].filter(Boolean),opt=[];
  if(comingOfAge)must.unshift(comingOfAge);
  if(princeSuccession)must.push(princeSuccession);
  if(fiefDockets)must.push(fiefDockets);
  // 积压的奏折：离宫期间攒下的朝堂事务，月末一并呈上
  while((S.flags.memorials||0)>0){S.flags.memorials--;const memo=factionEvent();if(memo&&!must.some(e=>e.title===memo.title))must.push(memo)}
  const add=(e,p)=>{if(e&&ambientEventReady(e))opt.push([e,p+R()-ambientNovelty(e)+continuityEventScore(e)])};
  if(!passing){
  add(continuityMonthlyEvent(),9);
  add(homeReturnSocialEvent(),8);add(natalVisitRequest(),7);add(awaitingNoticeEvent(),6);
  add(pastLifeMonthlyEvent(),6);add(pregnancyPrayerMonthlyEvent(),6);add(residencePetitionEvent(),8);add(fiveBrotherMonthlyEvent(),6);add(travelerMonthlyEvent(),8);add(recoveredSwapEvent(),8);add(fosterPetitionEvent(),8);add(kinSuccessionEvent(),8);add(parentageClueEvent(),8);
  add(coldFosterPetitionEvent(),9);add(coldFriendPetitionEvent(),8);
  add(jewelryTributeEvent(),7);add(jewelryRequestEvent(),7);
  add(chance(.8)?festival():null,5);add(chance(.75)?haremEvent():null,6);
  add(chance(.65)?quirkEvent():null,5);add(chance(.5)?histEvent():null,6);add(chance(.4)?courtEvent():null,4);add(palaceRomanceEvent(),8);add(courtFriendshipEvent(),9);add(motherAppealEvent(),9);
  add(chance(.3)?youthEvent():null,7);add(chance(.45)?kidEvent():null,4);add(chance(.55)?xinEvent():null,6);add(monthlyMaidEvent(),4);add(chance(.3)?fosterEvent():null,4);add(chance(.45)?relEvent():null,5);add(chance(.35)?clanEvent():null,5);add(chance(.45)?factionEvent():null,6);add(chance(.5)?visitorEvent():null,5);add(chance(.15)?dowagerEvent():null,3);
  add(typeof kinCourtEvent==='function'?kinCourtEvent():null,6);add(typeof betrothalEvent==='function'?betrothalEvent():null,5);
  }
  opt.sort((a,b)=>b[1]-a[1]);const seen=new Set();must.forEach(e=>{seen.add(e.title);pushEv(e)});
  const limit=Math.max(must.length,ri(1,3));
  for(const [e] of opt){
    if(Q.length+(modalOpen?1:0)>=limit)break;
    if(seen.has(e.title)||!ambientEventReady(e))continue;
    seen.add(e.title);const queued=e.onQueue;e.onQueue=()=>{queued?.();rememberAmbientEvent(e);};pushEv(e);
  }
  log(`—— ${dateStr()} ——`);
  setScene(pick(['court','harem','garden']));
  save('auto');
  render();if(!modalOpen)checkEnd();
};
function checkEnd(){
  if(!S||S.over)return;const e=E();
  if(e.health<=0) pushEv(deathEvent('驾崩'));
  else if(e.people<=0) pushEv(deathEvent('民变'));
}
function deathEvent(why){
  S.over=true;const e=E();const yrs=S.year;
  const score=e.prestige*.5+e.people*.5;
  const shi=score>=80?'圣':score>=68?'文':score>=56?'景':score>=44?'恭':score>=32?'哀':'炀';
  const miao=['太祖','太宗','高宗','仁宗','宣宗','英宗','宪宗','孝宗','穆宗','神宗'][S.gen-1]||'睿宗';
  const sons=kidsAlive().filter(k=>k.sex==='m'&&!k.jailed&&!immortalAway(k));let heir=S.heir&&kidById(S.heir);if(!heir||!heir.alive||immortalAway(heir))heir=sons.sort((a,b)=>a.born-b.born)[0];
  const nC=S.consorts.length,nK=S.children.length;
  let t= why==='民变'?`流民四起，叛军攻破京城。${e.era}${cnNum(yrs)}年，${e.sur}${e.name}自缢于宫中，享年${e.age}岁。`
    :`${dateStr()}，${e.sur}${e.name}崩于养心殿，享年${e.age}岁，在位${yrs}年。`;
  t+=`\n庙号${miao}，谥曰「${shi}皇帝」。\n一生册封后妃${nC}人，育皇子${S.children.filter(k=>k.sex==='m').length}人、公主${S.children.filter(k=>k.sex==='f').length}人。`;
  if(why==='民变')heir=null;
  t+=heir?`\n遗诏：传位于${kidName(heir)}。`:why==='民变'?'\n社稷倾覆，国祚至此而终。':immortalEnabled()&&kidsAlive().some(k=>k.sex==='m'&&immortalAway(k))?'\n皇子长留山门，未列入继统之序，宗室旁支承继大统。山中的亲人仍在人世。':'\n膝下无子，宗室旁支入继大统，本朝血脉至此而终。';
  S.history.push({sur:e.sur,name:e.name,era:e.era,yrs,miao,shi});
  log(t.split('\n')[0]+`庙号${miao}。`,1);AU.sfx('gong');
  const ch=[];
  if(heir) ch.push({t:`传位于${heir.name}，开启新朝`,f:()=>{succeed(heir);return null}});
  ch.push({t:'重新开局',f:()=>{S=null;UI.view='title';return null}},{t:'翻阅起居注',f:()=>{UI.view='log';return null}});
  return {title:why==='民变'?'国破':'龙驭宾天',por:'emp',text:t,choices:ch};
}
function succeed(h){
  const old=E(),a=kidAge(h);
  pushNow({title:'新君登基',por:h,text:`${h.name}即将即位。请为新朝拟定年号（二字）：`,input:{def:pick(ERAS.filter(x=>x!==old.era)),max:2},choices:[{t:'改元',f:v=>{
    inheritDowager(h);
    S.emp={sur:old.sur,name:h.name,era:v,age:Math.max(a,14),health:clamp(h.hp+10),prestige:clamp(35+h.vir/3),people:old.people,treasury:old.treasury,energy:3,nightsMonth:0,
      style:h.mar>h.lit+15?'尚武':h.lit>h.mar+15?'文雅':'勤政',wen:rd(h.lit),wu:rd(h.mar),seed:h.seed,portraitOverride:portraitCell(h),birthMonth:birthMonth(h)};
    archivePrincessEstates(h);
    S.consorts=[];S.children=[];S.rel=retainedFamiliesActive()?S.rel:{};S.courtPolicy={};S.courtPolicyTurn=null;S.heir=null;S.cands=[];S.gen++;S.year=1;S.over=false;S.genChar=GEN_CHARS[(GEN_CHARS.indexOf(S.genChar)+1)%GEN_CHARS.length];
    delete S.selection;if(!legacyPendingAction())S.flags.haremAttendance={gen:S.gen,turn:S.turn};S.flags.lastXX=-99;if(selectionSkipTimingActive())delete S.flags.lastXXSkipped;delete S.flags.lastProudDemand;delete S.flags.scholarArc;delete S.flags.rareArcOwners;delete S.flags.arcPacing;delete S.flags.xinPacing;delete S.flags.lastLiteraryGathering;delete S.lastGardenBanquet;S.gardenPlans=[];seasonalTick();S.emp.energy=maxEnergy();
    log(`━━ 第${cnNum(S.gen)}代 ━━ ${v}元年，新帝${S.emp.sur}${h.name}登基，尊${S.flags.dowager.fullName||S.flags.dowager.name}为${S.flags.dowager.name}${S.flags.birthDowager?.alive?`，另尊生母${S.flags.birthDowager.fullName}为皇太后`:""}。`,1);
    if(S.emp.age>=15){const em=marriageEmpress(h)||makeGirl({fam:pick(FAMS.slice(0,4)),trait:pick(['温婉','聪慧','城府','骄矜'])});em.favor=35;em.aff=30;if(h.spouse)em.knownBeforeAccession=true;addConsort(em,8,h.spouse?'潜邸嫡妻，随新帝登基册立':'新帝登基，奉遗诏册立');}
    inheritHousehold(h,empress());inheritLifeKeepsakes(h);S.ys={c:0,b:0,n:0};UI.kidsResidence='palace';
    migrate();UI.view='map';AU.sfx('gong');
    return {title:'新朝家人',por:dowagerPerson(S.flags.dowager),text:`${v}元年，新帝登基，大赦天下。\n${S.flags.dowager.fullName||S.flags.dowager.name}${S.flags.dowager.alive?'尊为'+S.flags.dowager.name+'，居慈宁宫。':'已故，尊谥存于宗谱。'}${S.flags.birthDowager?.alive?'\n生母'+S.flags.birthDowager.fullName+'亦尊为皇太后。':''}\n潜邸妻儿与亲族的往来，由此接入新朝。`}}}]});
}

/* ============ 开局 ============ */
A.newGame=function(){UI.view='new';render()};
A.start=function(){
  const fv=id=>typeof PalaceActions==='undefined'?$(id)?.value:PalaceActions.input(id);
  const sur=(fv('#f-sur')||'萧').trim().slice(0,2),name=(fv('#f-name')||'彻').trim().slice(0,2),era=(fv('#f-era')||'永宁').trim().slice(0,2);
  const style=fv('input[name=f-style]:checked')||'勤政';
  S={v:1,emp:{sur,name,era,age:18,birthMonth:3,health:90,prestige:50,people:60,treasury:800,energy:3,nightsMonth:0,style,wen:50,wu:50,seed:ri(1,2e9)},
    year:1,month:3,turn:0,consorts:[],children:[],cands:[],log:[],nid:1,gen:1,heir:null,genChar:pick(GEN_CHARS),
    flags:{lastXX:-99,dowager:{name:'太后',alive:true},peek:0,openingCourt:true,familyRules:2},history:[],ys:{c:0,b:0,n:0},over:false};
  const e=S.emp;
  e.imperialPortrait=style==='尚武'?1:style==='文雅'?0:e.seed%2;
  if(style==='勤政'){e.prestige=58;e.people=65}if(style==='风流')e.health=84;if(style==='尚武'){e.wu=80;e.prestige=55}if(style==='文雅')e.wen=80;
  e.energy=maxEnergy();
  const em=makeGirl({fam:pick(FAMS.slice(0,3)),trait:pick(['温婉','聪慧','城府','骄矜'])});em.favor=40;em.aff=40;em.age=18;em.knownBeforeAccession=true;
  S.consorts.push(em);em.rank=8;assignPalace(em);story(em,'潜邸时奉先帝之命嫁与陛下为嫡妻。新帝登基，册为皇后，入主坤宁宫。');
  const old=makeGirl({});old.favor=55;old.aff=60;old.knownBeforeAccession=true;old.rank=3;S.consorts.push(old);assignPalace(old);story(old,'潜邸旧人，陪伴陛下多年。新帝登基，册为贵人。');
  log(`${era}元年三月，新帝${sur}${name}登基，改元${era}，大赦天下。`,1);
  log(`册嫡妻${fullName(em)}为皇后，潜邸旧人${fullName(old)}为贵人。`);
  migrate();initializeMinistryRoster();initializeDowagerOpening();UI.view='map';setScene('court');AU.sfx('gong');render();
  pushEv({title:'登基',scene:'coronation',por:'emp',text:`${era}元年三月，先帝龙驭上宾，你在太和钟声中登上了宸极殿的御座。\n嫡妻${fullName(em)}册为皇后，潜邸旧人${fullName(old)}册为贵人。${dowagerCareActive()&&em.dowagerKin?"\n皇后亦是太后母家侄女，宫中有潜邸夫妻与母族两层亲缘。":""}\n礼部奏请：新帝登基，当广选秀女，以充后宫、绵延皇嗣。`,choices:[
    {t:'进入宫城',primary:true},{t:'准奏，即刻选秀',f:()=>{genCands(7);UI.view='xx';return null}}]});
};
