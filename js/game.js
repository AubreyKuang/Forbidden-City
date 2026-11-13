/* ============ 工具 ============ */
const $=s=>document.querySelector(s);
const R=Math.random, ri=(a,b)=>a+Math.floor(R()*(b-a+1)), pick=a=>a[Math.floor(R()*a.length)], chance=p=>R()<p;
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
const UI={view:'title',sel:null,logF:'all'};
const E=()=>S.emp;
const alive=()=>S.consorts.filter(c=>c.alive&&!c.gone);
const harem=()=>alive().filter(c=>!c.cold&&!c.maid);
const kidsAlive=()=>S.children.filter(k=>k.alive);
const byId=id=>S.consorts.find(c=>c.id===id);
const kidById=id=>S.children.find(k=>k.id===id);
const kidAge=k=>Math.floor((S.turn-k.born)/12);
const empress=()=>harem().find(c=>c.rank===8);
const rankCount=r=>harem().filter(c=>c.rank===r).length;
const season=()=>S?Math.floor(((S.month+11)%12)/3):0; // 0春(1-3)…
function dateStr(s=S){return `${s.emp.era}${s.year===1?'元':cnNum(s.year)}年${MONTHS[s.month-1]}`}
function cName(c){
  if(c.maid) return c.near?`贴身宫女${c.given}`:`宫女${c.given}`;
  if(c.cold) return `${c.sur}庶人`;
  if(c.rank===8) return '皇后';
  if(c.title&&c.rank>=4) return c.title+RANKS[c.rank];
  if(S&&S.consorts.some(o=>o!==c&&o.alive&&!o.gone&&!o.maid&&!o.cold&&o.sur===c.sur&&o.rank===c.rank&&!(o.title&&o.rank>=4)))return c.sur+c.given[0]+RANKS[c.rank];
  return c.sur+RANKS[c.rank];
}
const fullName=c=>c.sur+c.given;
function kidName(k){
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
  let g1=pick(GIV),g2=pick(GIV); while(g2===g1) g2=pick(GIV);
  const sur=o.sur||pick(SUR.filter(x=>!S||x!==S.emp.sur));
  const girl={id:S.nid++, sur, given:o.given||(chance(.45)?g1:g1+g2), age:o.age||ri(16,19), trait, fam,
    looks:clamp(ri(40,88)+(T.looks||0)), talent:clamp(ri(30,85)+(T.talent||0)), virtue:clamp(ri(30,85)+(T.virtue||0)), scheme:clamp(ri(15,75)+(T.scheme||0)),
    rank:0, palace:'', favor:ri(5,15), mood:65, aff:ri(10,25), preg:0, prot:false, lastBirth:-99, alive:true, cold:false, gone:false,
    seed:ri(1,2e9), title:'', story:[], nights:0, known:false};
  assignConsortPortrait(girl);
  return girl;
}
function assignPalace(c){
  if(c.rank===8){c.palace='坤宁宫';return}
  const cnt={};PALACES.forEach(p=>cnt[p]=0);harem().forEach(x=>{if(cnt[x.palace]!==undefined)cnt[x.palace]++});
  const min=Math.min(...Object.values(cnt));c.palace=pick(PALACES.filter(p=>cnt[p]===min));
}
function addConsort(c,rank,why){
  c.rank=rank; c.enteredAt=S.turn; S.consorts.push(c); assignPalace(c); S.ys.c++; deepen(c); initRel(c); assignArc(c); clanKey(c); if(c.kin)for(const id in c.kin){const o=byId(+id);if(o&&o.alive)relAdd(c,o,(isRival(c,o)?-30:45)-relGet(c,o))}
  story(c,`${why}，封为${RANKS[rank]}，赐居${c.palace}。`);
  log(`${fullName(c)}（${c.fam.t}之女）${why}，封${RANKS[rank]}。`);
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
  while(Q.length){const ev=Q.shift();if(eventStillValid(ev)){openModal(ev);return}}
  const returningFromMonthReview=curEv?.scene==='month-review';
  if(returningFromMonthReview) $('#app').inert=false;
  modalOpen=false;curEv=null;const modal=$('#modal');modal.hidden=true;modal.setAttribute('data-scene','');checkEnd();render();
  if(returningFromMonthReview&&!modalOpen) $('#finish-month')?.focus?.({preventScroll:true});
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
function eventCast(people){
  return people.length>1?`<div class="event-cast" aria-label="事件在场人物">${people.map(person=>
    `<figure>${porImg(person,104)}<figcaption>${esc(porName(person))}</figcaption></figure>`).join('')}</div>`:'';
}
function openModal(ev){
  if(ev.scene==='month-review'||curEv?.scene==='month-review') $('#app').inert=ev.scene==='month-review';
  modalOpen=true;curEv=ev;if(ev.onShow)ev.onShow();const b=$('#mbox');
  const people=eventPortraits(ev);
  // Portrait buttons distinguish people, not several actions for the same person.
  const choicePeople=new Set(ev.choices.filter(c=>c.person).map(c=>c.person.id??c.person));
  const showChoicePortraits=choicePeople.size>1;
  let h=`<div class="mtitle" id="event-title">${esc(ev.title)}</div>${ev.scene==='mourning'?mourningScene():''}${eventCast(people)}<div class="mbody">`;
  if(people.length===1)h+=`<div class="mpor">${porImg(people[0],112)}<div>${esc(porName(people[0]))}</div></div>`;
  h+=`<div class="mtext">${fmt(ev.text)}${ev.ref?`<p class="ref">典出 · ${ev.refURL?`<a href="${esc(ev.refURL)}" target="_blank" rel="noopener noreferrer">${esc(ev.ref)}</a>`:esc(ev.ref)}</p>`:''}${ev.input?`<input id="minput" class="inp" maxlength="${ev.input.max||4}" value="${esc(ev.input.def||'')}" aria-label="输入">`:''}</div></div><div class="mch${showChoicePortraits?' event-choices':''}">`;
  ev.choices.forEach((c,i)=>{
    const ok=!c.cond||c.cond();
    const style=ev.danger?(c.f?' danger':' quiet'):c.primary||ev.choices.length===1||(ev.input&&i===0)?' primary':'';
    const label=`${esc(c.t)}${c.preview?`<small class="choice-preview">${esc(c.preview)}</small>`:''}${!ok&&c.why?`<small>${esc(c.why)}</small>`:''}`;
    const portrait=showChoicePortraits&&c.person;
    h+=`<button class="btn${style}${portrait?' event-person-choice':''}" ${ok?'':'disabled'} onclick="choose(${i})">${portrait?`${porImg(c.person,60)}<span>${label}</span>`:label}</button>`;
  });
  b.innerHTML=h+'</div>';const modal=$('#modal');modal.setAttribute('data-scene',ev.scene||'');modal.hidden=false;b.scrollTop=0;
  if(ev.sfx) AU.sfx(ev.sfx); else AU.sfx('page');
  const inp=$('#minput'); if(inp) setTimeout(()=>inp.select(),30);
  if(ev.scene==='monthly-court') $('#mbox .mch button:not(:disabled)')?.focus?.({preventScroll:true});
}
function choose(i){
  if(!eventStillValid(curEv)){toast('人物处境已变，这件事已不再适用。');nextEv();return;}
  const c=curEv&&curEv.choices[i];if(!c)return;if(c.cond&&!c.cond())return;
  const val=curEv.input?(($('#minput').value||'').trim().slice(0,curEv.input.max||4)||curEv.input.def):undefined;
  AU.sfx('click');const res=c.f?c.f(val):null;
  if(res) showRes(res); else nextEv();
}
function showRes(res){
  if(typeof res==='string') res={text:res};
  const b=$('#mbox');
  const cast=res.por?'':eventCast(eventPortraits(curEv));
  b.innerHTML=`<div class="mtitle" id="event-title">${esc(res.title||curEv.title)}</div>${curEv.scene==='mourning'?mourningScene():''}${cast}<div class="mbody">${res.por?`<div class="mpor">${porImg(res.por,96)}</div>`:''}<div class="mtext">${fmt(res.text)}</div></div><div class="mch"><button class="btn gold" onclick="nextEv()">继续</button></div>`;
  b.scrollTop=0;renderTop();
}

/* ============ 侍寝与互动 ============ */
function nightWith(c,fromEvent){
  if(!useE()) return;
  const e=E();e.nightsMonth=(e.nightsMonth||0)+1;S.ys.n++;
  const lines=(NIGHT[c.trait]||[]).concat(NIGHT._),line=pick(lines);
  const fm=e.style==='风流'?1.5:1;
  const s=cchg(c,{favor:10*fm*(XIN[xinOf(c)].favorMul||1),mood:10,aff:(c.trait==='痴情'?9:6)});
  c.nights++;S.flags.lastNight=c.id;if(c.nights===1)remember(c,'first','第一次侍寝');
  let p=.18+(e.style==='风流'?.06:0)+(S.flags.bless===S.turn?.1:0)-(c.trait==='体弱'?.05:0)-(e.age>50?.07:0)+(e.health>80?.03:0);
  if(!c.preg&&(!c.delivery||c.delivery.settled)&&S.turn-c.lastBirth>=3&&chance(p)){c.preg=1}
  harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-2);relAdd(o,c,-3)}});
  story(c,`奉召侍寝。${line}`);
  log(`召${cName(c)}侍寝。`);
  setScene('night');
  pushNow({title:'春宵',por:c,sfx:'chime',text:`是夜，敬事房传${cName(c)}侍寝。\n${line}${fx(s)}`,choices:[
    {t:'翌日赏赐（国库-10万两）',f:()=>{AU.sfx('coin');return `你命人送去一对白玉镯子。${fx(chg({treasury:-10}),cchg(c,{mood:8,aff:2}))}`}},
    {t:'就此作罢'}]});
}
const A={
  go(v,id){rememberPersonRoute(v,id);UI.view=v;UI.sel=id;if(v==='palace')preparePalaceLife(id);AU.sfx('click');render();if(v!=='title')$('#panel').scrollIntoView({block:'nearest',behavior:'smooth'})},
  court(){
    if(!S||S.over||modalOpen)return;
    const ev=monthlyCourtEvent();
    if(!ev){toast(S.flags.monthlyCourt?.done?'本月奏折已批复。':'这份奏折已不适用。');return;}
    const brief=S.flags.monthlyCourt;
    const delegation=brief.floodFollowup||brief.locustFollowup?null:reliefDelegation(brief.index);
    const installment=brief.index===FLOOD_INDEX&&!brief.floodFollowup?stagedFloodRelief(brief):null;
    const freightBooking=installment&&brief.floodNeed==='grain'&&grainReserveReady()?stagedFloodRelief(brief,true):null;
    ev.scene='monthly-court';
    ev.choices=[...ev.choices,...[delegation,installment,freightBooking].filter(Boolean)].map((choice,index)=>{
      const cost=choice.delegated?0:1;
      return {...choice,t:`${choice.t}（${cost?'精力 −1':'免耗精力'}）`,
        preview:choice.preview||COURT_PREVIEWS[brief.index]?.[index],
        cond:()=>!brief.done&&(!cost||E().energy>0)&&(!choice.cond||choice.cond()),why:choice.why||'精力不足',
        f:()=>{
          if(brief.done)return;
          if(choice.inspectLocust)return saveGrainAction(()=>{
            S.flags.monthlyCourt={...brief,locustNeed:brief.locustAuditNeed,locustAudited:true};
            log('户部核实了蝗灾粮情，奏折仍待批复。');
            return `户部核实：${brief.locustAuditNeed==='near'?'近村':'远村'}先断粮。可重新打开本月奏折调粮。`;
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
  night(id){const c=byId(id);if(!c||c.preg||c.cold)return;nightWith(c)},
  promote(id){const c=byId(id),nr=c.rank+1;
    if(nr>=8){toast('立后请用「册立皇后」');return}
    if(rankCount(nr)>=RANK_CAP[nr]){toast(`${RANKS[nr]}之位已满（${RANK_CAP[nr]}人）`);return}
    const doIt=(title)=>{c.rank=nr;if(title)c.title=title;
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
    pushEv({title:'降位',danger:true,por:c,text:`降${cName(c)}为${RANKS[c.rank-1]}？`,choices:[{t:'降位',f:()=>{c.rank--;const s=cchg(c,{mood:-25,aff:-10,favor:-5});story(c,`被降为${RANKS[c.rank]}。`);remember(c,'hurt','被降位');setXin(c,(c.t2==='记仇'||c.scheme>60)?'怨恨':'委屈','被降了位分','emp');log(`降${fullName(c)}为${RANKS[c.rank]}。`);AU.sfx('sad');return `${fullName(c)}跪地谢恩，泪落无声。${fx(s)}`}},{t:'作罢'}]})},
  rename(id){const c=byId(id);pushEv({title:'更改封号',por:c,text:'请为她拟一个新的封号：',input:{def:c.title||pick(TITLES),max:2},choices:[{t:'赐此封号',f:v=>{c.title=v;story(c,`陛下赐封号「${v}」。`);return `自今日起，她便是${cName(c)}。${fx(cchg(c,{mood:10,aff:4}))}`}},{t:'作罢'}]})},
  crown(id){const c=byId(id);if(empress()){toast('中宫已有皇后');return}
    pushEv({title:'册立皇后',por:c,text:`册${fullName(c)}为皇后，入主坤宁宫？\n册封大典需耗费国库一百万两。`,choices:[
      {t:'择吉日行册封礼',f:()=>{c.rank=8;c.palace='坤宁宫';AU.sfx('gong');
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
  const localGrainPayment=localGrainPaymentDue()?LOCUST_LOCAL_BALANCE:0;
  const inc=rd(45+e.people*1.1+(S.flags.canal?25:0)),exp=alive().reduce((s,c)=>s+(c.cold?1:STIPEND[c.rank]),0)+kidsAlive().reduce((s,k)=>s+3+(k.tutor?5:0),0)+localGrainPayment;
  e.treasury+=inc-exp;
  if(localGrainPayment){
    delete S.flags.localGrainPaymentTurn;
    log(`户部结清灾区粮商的赈粮尾款 ${localGrainPayment} 万两。`);
  }
  const monthDate=dateStr(), brief=S.flags.monthlyCourt;
  let court=brief?.turn===S.turn&&brief.gen===S.gen?brief.result:null;
  if(floodReliefDue()){
    delete S.flags.floodRelief;
    const text='本月未续拨赈银，灾区粮食供给中断，民心 −3。';
    chg(FLOOD_UNFUNDED);
    log(text);
    court={title:'黄河决堤 · 赈灾回奏',choice:'未续拨',text};
  }
  if(locustReliefDue()){
    delete S.flags.locustRelief;
    chg(LOCUST_UNFUNDED);
    log(LOCUST_UNFUNDED_TEXT);
    court={title:'蝗灾 · 远村补粮回奏',choice:'未按期补粮',text:LOCUST_UNFUNDED_TEXT};
  }
  const people=S.consorts.flatMap(c=>{
    const latest=c.story?.findLast(entry=>entry.d===monthDate);
    return latest&&!(S.turn===0&&latest===c.story[0])?[{id:c.id,text:latest.t}]:[];
  });
  S.flags.lastMonthReview={date:monthDate,inc,exp,court,people:people.slice(-2),...(localGrainPayment?{localGrainPayment}:{})};
  // 后宫
  for(const c of alive()){
    if(!c.cold){c.favor=clamp(c.favor-(c.bond?0:c.trait==='淡泊'?1:2));if(c.favor<25)c.mood=clamp(c.mood-3);else if(c.favor>60)c.mood=clamp(c.mood+1)}else c.mood=clamp(c.mood-3);
    if(c.preg>0){c.preg++;if(c.preg===2)pushEv(pregEvent(c));if(c.preg>=10)pushEv(birthEvent(c))}
  }
  alive().forEach(c=>{xinTick(c);visitorTick(c)});kidsAlive().forEach(growKid);
  // 时间
  S.turn++;S.month++;let newYear=false;
  if(S.flags.impeachmentReview?.turn<S.turn||
      (brief?.review&&!brief.done&&brief.turn===S.turn-1&&brief.gen===S.gen)){
    delete S.flags.impeachmentReview;
    log('查账回奏未获批复，弹劾案已归档。');
  }
  if(S.month>12){S.month=1;S.year++;e.age++;newYear=true;alive().forEach(c=>c.age++)}
  let dh=-.17-(e.age>40?(e.age-40)*.05:0)-Math.max(0,(e.nightsMonth||0)-3)*1.2-(e.style==='风流'?.05:0);
  e.health=clamp(e.health+dh);e.nightsMonth=0;e.energy=maxEnergy();
  if(e.treasury<0){const d=Math.min(8,Math.ceil(-e.treasury/400));chg({people:-1-d,prestige:-1});log(`国库亏空${-e.treasury}万两，百官俸禄迟发，民间加征赋税。`)}
  if(S.cands.length){S.cands=[];log('选秀礼毕。')}
  toast(`${monthDate}　月入${inc}　支出${exp}`);
  // 岁末总结
  if(newYear)snapshotYear();
  if(newYear){const y=S.ys;pushEv({title:'岁首',sfx:'chime',text:`爆竹声中一岁除。${dateStr()}，陛下${e.age}岁。\n去岁：新入宫${y.c}人，皇嗣降生${y.b}位，侍寝${y.n}次。\n国库${e.treasury}万两，威望${rd(e.prestige)}，民心${rd(e.people)}。`,choices:[{t:'新岁新气象'}]});S.ys={c:0,b:0,n:0}}
  // 事件
  if(S.month===2&&S.turn-S.flags.lastXX>=34) pushEv({title:'三年大选',sfx:'chime',text:'又到三年一度的大选之期，各地秀女已候于储秀宫。',choices:[{t:'前去看看',f:()=>{genCands();UI.view='xx';return null}},{t:'今年免了',f:()=>{S.flags.lastXX=S.turn;return fx(chg({people:2}))}}]});
  relTick();consortSocialTick();kidRelTick();clanTick();dowagerTick();initiativeTick();familyLifeTick();childLifeTick();courtTick();seasonalTick();palaceDutiesTick();palaceRomanceTick();
  const passing=dowagerPassingEvent();if(passing)pushEv(passing);
  const must=[passing?null:arcTick(),heirTick(),milestone()].filter(Boolean),opt=[];
  // 积压的奏折：离宫期间攒下的朝堂事务，月末一并呈上
  while((S.flags.memorials||0)>0){S.flags.memorials--;const memo=factionEvent();if(memo&&!must.some(e=>e.title===memo.title))must.push(memo)}
  const add=(e,p)=>{if(e&&ambientEventReady(e))opt.push([e,p+R()-ambientNovelty(e)])};
  if(!passing){
  add(chance(.8)?festival():null,5);add(chance(.75)?haremEvent():null,6);
  add(chance(.65)?quirkEvent():null,5);add(chance(.5)?histEvent():null,6);add(chance(.4)?courtEvent():null,4);add(palaceRomanceEvent(),8);add(courtFriendshipEvent(),9);add(motherAppealEvent(),9);
  add(chance(.3)?youthEvent():null,7);add(chance(.45)?kidEvent():null,4);add(chance(.55)?xinEvent():null,6);add(monthlyMaidEvent(),4);add(chance(.3)?fosterEvent():null,4);add(chance(.45)?relEvent():null,5);add(chance(.35)?clanEvent():null,5);add(chance(.45)?factionEvent():null,6);add(chance(.5)?visitorEvent():null,5);add(chance(.15)?dowagerEvent():null,3);
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
  const sons=kidsAlive().filter(k=>k.sex==='m'&&!k.jailed);let heir=S.heir&&kidById(S.heir);if(!heir||!heir.alive)heir=sons.sort((a,b)=>a.born-b.born)[0];
  const nC=S.consorts.length,nK=S.children.length;
  let t= why==='民变'?`流民四起，叛军攻破京城。${e.era}${cnNum(yrs)}年，${e.sur}${e.name}自缢于宫中，享年${e.age}岁。`
    :`${dateStr()}，${e.sur}${e.name}崩于养心殿，享年${e.age}岁，在位${yrs}年。`;
  t+=`\n庙号${miao}，谥曰「${shi}皇帝」。\n一生册封后妃${nC}人，育皇子${S.children.filter(k=>k.sex==='m').length}人、公主${S.children.filter(k=>k.sex==='f').length}人。`;
  if(why==='民变')heir=null;
  t+=heir?`\n遗诏：传位于${kidName(heir)}。`:why==='民变'?'\n社稷倾覆，国祚至此而终。':'\n膝下无子，宗室旁支入继大统，本朝血脉至此而终。';
  S.history.push({sur:e.sur,name:e.name,era:e.era,yrs,miao,shi});
  log(t.split('\n')[0]+`庙号${miao}。`,1);AU.sfx('gong');
  const ch=[];
  if(heir) ch.push({t:`传位于${heir.name}，开启新朝`,f:()=>{succeed(heir);return null}});
  ch.push({t:'重新开局',f:()=>{S=null;UI.view='title';return null}},{t:'翻阅起居注',f:()=>{UI.view='log';return null}});
  return {title:why==='民变'?'国破':'龙驭宾天',por:'emp',text:t,choices:ch};
}
function succeed(h){
  const old=E(),mom=byId(h.mom),a=kidAge(h);
  pushNow({title:'新君登基',por:h,text:`${h.name}即将即位。请为新朝拟定年号（二字）：`,input:{def:pick(ERAS.filter(x=>x!==old.era)),max:2},choices:[{t:'改元',f:v=>{
    S.emp={sur:old.sur,name:h.name,era:v,age:Math.max(a,14),health:clamp(h.hp+10),prestige:clamp(35+h.vir/3),people:old.people,treasury:old.treasury,energy:3,nightsMonth:0,
      style:h.mar>h.lit+15?'尚武':h.lit>h.mar+15?'文雅':'勤政',wen:rd(h.lit),wu:rd(h.mar),seed:h.seed,birthMonth:birthMonth(h)};
    S.flags.dowager={name:mom?`${mom.sur}太后`:'太后',portrait:mom?{fam:{...mom.fam},seed:mom.seed,artPortrait:mom.artPortrait,trait:mom.trait,rank:8}:undefined,sur:mom?.sur,fam:mom?{...mom.fam}:undefined,clan:mom?clanKey(mom):undefined,lastOffer:null,cooldown:24,alive:!!(mom&&mom.alive)};
    archivePrincessEstates(h);
    S.consorts=[];S.children=[];S.rel={};S.courtPolicy={};S.courtPolicyTurn=null;S.heir=null;S.cands=[];S.gen++;S.year=1;S.over=false;S.genChar=GEN_CHARS[(GEN_CHARS.indexOf(S.genChar)+1)%GEN_CHARS.length];
    S.flags.lastXX=-99;delete S.flags.lastProudDemand;delete S.flags.scholarArc;delete S.flags.rareArcOwners;delete S.flags.arcPacing;delete S.flags.xinPacing;delete S.flags.lastLiteraryGathering;delete S.lastGardenBanquet;S.gardenPlans=[];seasonalTick();S.emp.energy=maxEnergy();
    log(`━━ 第${cnNum(S.gen)}代 ━━ ${v}元年，新帝${S.emp.sur}${h.name}登基，尊生母为${S.flags.dowager.name}。`,1);
    if(S.emp.age>=15){const em=marriageEmpress(h)||makeGirl({fam:pick(FAMS.slice(0,4)),trait:pick(['温婉','聪慧','城府','骄矜'])});em.favor=35;em.aff=30;addConsort(em,8,h.spouse?'潜邸嫡妻，随新帝登基册立':'新帝登基，奉遗诏册立');}
    migrate();UI.view='map';AU.sfx('gong');
    return `${v}元年，新帝登基，大赦天下。属于你的故事，翻开了新的一页。`}}]});
}

/* ============ 开局 ============ */
A.newGame=function(){UI.view='new';render()};
A.start=function(){
  const fv=id=>{const el=$(id);return el?el.value:''};
  const sur=(fv('#f-sur')||'萧').trim().slice(0,2),name=(fv('#f-name')||'彻').trim().slice(0,2),era=(fv('#f-era')||'永宁').trim().slice(0,2);
  const style=(document.querySelector('input[name=f-style]:checked')||{}).value||'勤政';
  S={v:1,emp:{sur,name,era,age:18,birthMonth:3,health:90,prestige:50,people:60,treasury:800,energy:3,nightsMonth:0,style,wen:50,wu:50,seed:ri(1,2e9)},
    year:1,month:3,turn:0,consorts:[],children:[],cands:[],log:[],nid:1,gen:1,heir:null,genChar:pick(GEN_CHARS),
    flags:{lastXX:-99,dowager:{name:'太后',alive:true},peek:0,openingCourt:true},history:[],ys:{c:0,b:0,n:0},over:false};
  const e=S.emp;
  if(style==='勤政'){e.prestige=58;e.people=65}if(style==='风流')e.health=84;if(style==='尚武'){e.wu=80;e.prestige=55}if(style==='文雅')e.wen=80;
  e.energy=maxEnergy();
  const em=makeGirl({fam:pick(FAMS.slice(0,3)),trait:pick(['温婉','聪慧','城府','骄矜'])});em.favor=40;em.aff=40;em.age=18;
  S.consorts.push(em);em.rank=8;em.palace='坤宁宫';story(em,'潜邸时奉先帝之命嫁与陛下为嫡妻。新帝登基，册为皇后，入主坤宁宫。');
  const old=makeGirl({});old.favor=55;old.aff=60;old.rank=3;S.consorts.push(old);assignPalace(old);story(old,'潜邸旧人，陪伴陛下多年。新帝登基，册为贵人。');
  log(`${era}元年三月，新帝${sur}${name}登基，改元${era}，大赦天下。`,1);
  log(`册嫡妻${fullName(em)}为皇后，潜邸旧人${fullName(old)}为贵人。`);
  migrate();UI.view='map';setScene('court');AU.sfx('gong');render();
  pushEv({title:'登基',scene:'coronation',por:'emp',text:`${era}元年三月，先帝龙驭上宾，你在太和钟声中登上了宸极殿的御座。\n嫡妻${fullName(em)}册为皇后，潜邸旧人${fullName(old)}册为贵人。\n礼部奏请：新帝登基，当广选秀女，以充后宫、绵延皇嗣。`,choices:[
    {t:'进入宫城',primary:true},{t:'准奏，即刻选秀',f:()=>{genCands(7);UI.view='xx';return null}}]});
};
