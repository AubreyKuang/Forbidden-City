const GARDEN_FAMILY_SPOT = [117,35];
const GARDEN_ACTIVITIES = {
  toss: { label:'投壶', prompt:'花亭前摆好了远近两只铜壶。头一轮由你定玩法。', moves:[
    { label:'近壶试投 · 先让孩子和新手试手', bonus:14, skill:'mar' },
    { label:'两人接力 · 同席的人轮流投', bonus:5, skill:'mar', cooperate:true },
    { label:'挑战远壶 · 请擅射的人领投', bonus:-8, skill:'mar', showcase:true }
  ] },
  paint: { label:'共绘花枝', prompt:'案上铺着长幅花笺，石绿、胭脂和墨都已研好。你想怎么起笔？', moves:[
    { label:'先勾花枝 · 给初学的人留个样子', bonus:14, skill:'lit' },
    { label:'轮流添花 · 每人接着上一笔画', bonus:5, skill:'lit', cooperate:true },
    { label:'即兴设色 · 请擅画的人领笔', bonus:-8, skill:'lit', showcase:true }
  ] }
};
const gardenPlace = () => PLACES.find(p => p.id === 'yh');
const birthMonth = person => person.birthMonth ?? (Math.abs(person.seed || 0)%12+1);

function banquetKind(kind) {
  if (kind === 'garden') return { title:'御花园小宴', cost:15,
    ready:!S.over && S.turn-(S.lastGardenBanquet ?? -3)>=3 };
  if (kind === 'duanwu') {
    const work=duanwuWork();
    return {title:'端午宴',cost:0,ready:!S.over&&S.month===5&&work?.year===S.year&&work.stage==='finished'&&!work.held};
  }
  if (!['emperor','empress'].includes(kind)) return null;
  const host = kind === 'emperor' ? E() : empress();
  if (!host) return null;
  const title = kind === 'emperor' ? '皇帝万寿宴' : '皇后千秋宴';
  return { title, host, cost:30, ready:!S.over && birthMonth(host)===S.month && host.birthFeastYear!==S.year };
}

function birthdayBanquetButtons() {
  const feasts = ['emperor','empress'].map(kind=>[kind,banquetKind(kind)]).filter(([,feast])=>feast);
  return `<div class="acts">${feasts.map(([kind,feast])=>feast.ready
    ? `<button class="btn gold" onclick="A.openBanquet('${kind}')">筹办${feast.title}</button>`
    : `<span class="hint">${feast.title} · ${MONTHS[birthMonth(feast.host)-1]}${feast.host.birthFeastYear===S.year?'（本年已办）':''}</span>`).join('')}</div>`;
}

const banquetGuests = all => [...alive().filter(inPalace),
  ...kidsAlive().filter(k=>childInPalace(k)&&(all||kidAge(k)>=5))];
const banquetReady = () => banquetKind('garden').ready;
const banquetDraft = () => UI.view==='banquet' ? UI.banquet : null;

A.openBanquet = function(kind='garden') {
  if(modalOpen){toast('请先处理眼前的事件。');return;}
  const feast=banquetKind(kind);
  if(!feast?.ready){toast(feast?.host?`${feast.title}在${MONTHS[birthMonth(feast.host)-1]}举办${feast.host.birthFeastYear===S.year?'，本年已办过':''}。`:'眼下还不能筹办这场宴会。');return;}
  UI.banquet = { kind, activity:'toss', all:kind!=='garden', seats:[] };
  setScene('garden');
  A.go('banquet');
};

A.banquetActivity = function(activity) {
  const draft = banquetDraft();
  if (!draft || !Object.hasOwn(GARDEN_ACTIVITIES,activity)) return;
  draft.activity=activity;
  render();
};

A.banquetInviteAll = function(all) {
  const draft = banquetDraft();
  if (!draft) return;
  draft.all=all;
  render();
};

A.banquetGuest = function(id) {
  const draft = banquetDraft();
  if (!draft || draft.all || !banquetGuests(false).some(p=>p.id===id)) return;
  const index=draft.seats.indexOf(id);
  if (index>=0) draft.seats.splice(index,1);
  else if (draft.seats.length<4) draft.seats.push(id);
  render();
};

A.banquetMove = function(index,direction) {
  const draft = banquetDraft();
  if (!draft || draft.all || ![-1,1].includes(direction)) return;
  const {seats}=draft, other=index+direction;
  if (!Number.isInteger(index)||index<0||index>=seats.length||other<0||other>=seats.length) return;
  [seats[index],seats[other]]=[seats[other],seats[index]];
  render();
};

function banquetAttendees(draft, feast) {
  const available = banquetGuests(draft.all);
  const people = draft.all ? available : available.filter(p=>draft.seats.includes(p.id))
    .sort((a,b)=>draft.seats.indexOf(a.id)-draft.seats.indexOf(b.id));
  if (draft.kind==='empress' && !people.includes(feast.host)) people.unshift(feast.host);
  return people;
}

function banquetProblem(draft, feast, people) {
  if (!feast?.ready) return '这场宴会目前不能举办。';
  if (people.length<(feast.host?1:2)||people.every(p=>p.sex)) return '还需选足宾客，并至少有一位妃嫔或宫人在席。';
  if (E().energy<=0) return '本月精力已尽。';
  if (feast.cost>0&&E().treasury<feast.cost) return '国库银两不足。';
  return '';
}

function banquetChildCount(children) {
  const sons=children.filter(k=>k.sex==='m').length;
  return `皇子 ${sons} 位 · 公主 ${children.length-sons} 位`;
}

function banquetGuestFamily(p,children) {
  if (p.sex) {
    const foster=fosterOf(p);
    return `${kidAge(p)}岁 · 生母 ${p.momName}${foster?` · 养母 ${fullName(foster)}`:''}`;
  }
  const own=children.filter(k=>k.mom===p.id);
  const raising=children.filter(k=>k.foster===p.id && k.mom!==p.id);
  return `亲生${banquetChildCount(own)}${raising.length?`　养育${banquetChildCount(raising)}`:''}`;
}

function viewBanquet() {
  const draft=banquetDraft(), feast=draft&&banquetKind(draft.kind);
  if (!feast) return viewMap();
  const people=banquetAttendees(draft,feast);
  const children=kidsAlive();
  const problem=banquetProblem(draft,feast,people);
  const guestCards = draft.all?'':banquetGuests(false).filter(p=>!people.includes(p)).map(p=>
    `<button class="card" ${draft.seats.length>=4?'disabled':''} onclick="A.banquetGuest(${p.id})">${porImg(p,40)}
      <span class="grow"><strong>${esc(familyName(p))}</strong>
      ${p.sex?'':`<small>${esc(p.trait)} · ${esc(p.t2)}</small>`}
      <small>${esc(banquetGuestFamily(p,children))}</small></span></button>`).join('');
  return `<h2>${feast.title} <button class="btn sm" onclick="arrive(gardenPlace())">返回御花园</button></h2>
    <p class="hint">在世皇嗣 · ${banquetChildCount(children)}</p>
    ${draft.kind==='empress'?`<p class="hint">寿星皇后 · ${esc(banquetGuestFamily(feast.host,children))}</p>`:''}
    <div class="acts"><button class="btn ${draft.all?'on':''}" aria-pressed="${draft.all}" onclick="A.banquetInviteAll(true)">全员宴请</button>
    <button class="btn ${!draft.all?'on':''}" aria-pressed="${!draft.all}" onclick="A.banquetInviteAll(false)">自选宾客</button></div>
    ${draft.all
      ? `<p class="hint">全邀在宫的妃嫔、宫人与皇嗣，共 ${people.length} 位，其中${banquetChildCount(people.filter(p=>p.sex))}。按家人分桌，幼童可观礼。</p>`
      : `<h3>座次</h3><p class="hint">自选至多四位宾客。相邻两人同玩一轮。${draft.kind==='empress'?'皇后为寿星，自动入席。':''}</p>
        <ol class="banquet-seats">${draft.seats.map((id,i)=>{
          const p=people.find(person=>person.id===id);
          return p?`<li><strong>${esc(familyName(p))}</strong><div class="acts">
            <button class="btn quiet sm" aria-label="${esc(familyName(p))}前移" ${i===0?'disabled':''} onclick="A.banquetMove(${i},-1)">前移</button>
            <button class="btn quiet sm" aria-label="${esc(familyName(p))}后移" ${i===draft.seats.length-1?'disabled':''} onclick="A.banquetMove(${i},1)">后移</button>
            <button class="btn quiet sm" aria-label="撤下${esc(familyName(p))}" onclick="A.banquetGuest(${id})">撤下</button></div>
            <div class="hint">${esc(banquetGuestFamily(p,children))}</div></li>`:'';
        }).join('')}</ol><div class="grid">${guestCards}</div>`}
    <p class="banquet-selection" role="status">已选：${draft.all?'全员宴请':'自选宾客'} · ${GARDEN_ACTIVITIES[draft.activity].label} · ${people.length} 位宾客</p><h3>席间活动</h3><div class="acts">${Object.entries(GARDEN_ACTIVITIES).map(([key,act])=>
      `<button class="btn sm ${draft.activity===key?'on':''}" aria-pressed="${draft.activity===key}" onclick="A.banquetActivity('${key}')">${act.label}</button>`).join('')}</div>
    <div class="acts"><button class="btn gold" ${problem?'disabled':''} onclick="A.holdBanquet()">开宴<small>精力-1 · ${feast.cost?`国库-${feast.cost}万两`:'筹备时已拨款'}</small></button></div>
    ${problem?`<p class="hint">${problem}</p>`:''}`;
}

function banquetTables(people) {
  const remaining=new Set(people), tables=[];
  const seat=(p,table)=>{if (remaining.delete(p)) table.push(p)};
  for (const k of people.filter(p=>p.sex && kidAge(p)>=5)) {
    if (!remaining.has(k)) continue;
    const family=mothersOf(k).filter(m=>remaining.has(m));
    if (!family.length) continue;
    const table=[];
    seat(family[0],table);
    seat(k,table);
    if (family[1]) seat(family[1],table);
    tables.push(table);
  }
  for (const p of remaining) {
    const parent=p.sex ? tables.find(t=>t.length<4 && mothersOf(p).some(m=>t.includes(m))) : null;
    let table=parent || tables.find(t=>t.length<4);
    if (!table) tables.push(table=[]);
    seat(p,table);
  }
  return tables;
}

function banquetTalent(p, toss) {
  if (p.sex) return toss ? p.mar : p.lit;
  if (toss) return p.trait === '将门' || p.t2 === '擅骑射' ? 80 : 35;
  return p.talent + (p.like === '字画' ? 15 : 0);
}

A.holdBanquet = function() {
  const draft=banquetDraft(), feast=draft&&banquetKind(draft.kind);
  if (modalOpen || !feast || !Object.hasOwn(GARDEN_ACTIVITIES,draft.activity)) return;
  const people=banquetAttendees(draft,feast);
  const problem=banquetProblem(draft,feast,people);
  if (problem) {toast(problem);return}
  const activity=GARDEN_ACTIVITIES[draft.activity];
  const tables=draft.all?banquetTables(people):[people];
  pushEv({ title:`${feast.title} · ${activity.label}`, cast:people.slice(0,4),
    text:`${people.length} 位宾客入席，分 ${tables.length} 桌。\n${activity.prompt}`,
    choices:[...activity.moves.map((move,i)=>({t:move.label, primary:i===0, f:()=>{
      playBanquet(draft,feast,people,tables,move);
      return null;
    }})), {t:'再看看席单'}] });
};

function playBanquet(draft,feast,people,tables,move) {
  if (!useE()) return;
  E().treasury-=feast.cost;
  if (feast.host) feast.host.birthFeastYear=S.year;
  else if (draft.kind==='duanwu') duanwuWork().held=true;
  else S.lastGardenBanquet=S.turn;
  const label=GARDEN_ACTIVITIES[draft.activity].label, toss=draft.activity==='toss';
  const lines=[];
  let entries=0, successes=0;
  for (const table of tables) {
    const players=table.filter(p=>!p.sex||kidAge(p)>=5);
    if (!players.length) continue;
    const skilled=players.reduce((best,p)=>banquetTalent(p,toss)>banquetTalent(best,toss)?p:best);
    for (const p of players) {
      const talent=banquetTalent(p,toss);
      const score=talent+move.bonus+(move.showcase && p!==skilled?Math.max(0,(banquetTalent(skilled,toss)-talent)*.4):0);
      if (score>=48) {
        successes++;
        if (p.sex) skillGain(p,move.skill,1);
        else cchg(p,{mood:move.showcase && p===skilled?5:3});
      }
      entries++;
    }
    for (let i=1;i<table.length;i++) {
      const a=table[i-1], b=table[i];
      if ((a.sex && kidAge(a)<5)||(b.sex && kidAge(b)<5)) continue;
      lines.push(banquetPair(a,b,label,toss,move));
    }
    for (let i=1;i<table.length-1;i++) {
      const k=table[i], left=table[i-1], right=table[i+1];
      if (!k.sex || kidAge(k)<5 || !k.foster || ![left.id,right.id].includes(k.mom) || ![left.id,right.id].includes(k.foster)) continue;
      if (relGet(left,right)>=-15) {
        relAdd(left,right,5);
        lines.push(`${k.name}请两位母亲也${toss?'各投一支':'各添一朵花'}。散席时，她们还在商量孩子下回想玩什么。`);
      } else {
        lines.push(`${k.name}来回给两位母亲看自己的${toss?'投壶成绩':'花笺'}。两人各夸了一句，仍有些拘束。`);
      }
    }
  }
  if (feast.host) {
    if (draft.kind==='empress') {
      const queen=feast.host;
      cchg(queen,{mood:16,aff:8});
      remember(queen,'bday','陛下在我生辰亲自主持千秋宴。');
      story(queen,'生辰设千秋宴，众人来贺。');
      lines.unshift('皇后受了众人的寿礼，请掌事姑姑把寿面先分给孩子们。');
    } else {
      chg({prestige:Math.min(5,2+successes)});
      for (const k of people.filter(p=>p.sex)) skillGain(k,'love',3);
      lines.unshift('众人向陛下贺寿，年幼的皇嗣跟着母亲行礼。');
    }
  }
  const follow=S.gardenPlans?.find(plan=>plan.turn===S.turn+2);
  const promise=follow? `\n§${familyName(kidById(follow.child)||byId(follow.guest))}约好两个月后再来御花园。`:'';
  const result=toss?`${successes} 人投中，共 ${entries} 人试投`:`${successes} 人完成画作，共 ${entries} 人执笔`;
  log(`${feast.title}，${people.length} 位宾客同席${label}。 ${result}。`);
  if(draft.kind==='duanwu')save('auto');
  UI.banquet=null;
  arrive(gardenPlace());
  const demand=proudBanquetGuest(people);
  if (demand) pushNow(proudDemandEvent(demand,people));
  pushNow({title:`${feast.title} · ${label}`, cast:people.slice(0,4),
    text:`§${result}${promise}\n${lines.slice(0,6).join('\n')}`, choices:[ok1]});
}

function banquetPair(a,b,label,toss,move) {
  const k=a.sex?a:b.sex?b:null;
  const mother=k && (!a.sex?a:!b.sex?b:null);
  if (mother && mothersOf(k).includes(mother)) {
    const trust=childTrust(k,mother), skill=banquetTalent(mother,toss);
    const opensUp=skill>=60 || trust>=48 || mother.t2==='护短' || mother.trait==='温婉' || move.cooperate;
    const action=toss
      ? skill>=60?`帮${k.name}扶稳手肘，下一支箭果然投中了`:`蹲下来陪${k.name}数投中的箭，没投中的也捡回来再试`
      : skill>=60?`在${k.name}画歪的花枝旁添了几笔，两人的画接在了一起`:`请${k.name}选花的颜色，两人一笔一笔填满了花笺`;
    const child=opensUp?`${cName(mother)}${action}。`:
      `${cName(mother)}递来${toss?'一支箭':'一支笔'}，两人先各自试了一回，后来才说上话。`;
    const adult=opensUp?`见${k.name}愿意让她帮忙，想以后再陪孩子${toss?'练一回':'画一幅'}。`:
      `见${k.name}还拘谨，便让孩子按自己的步调来。`;
    recordFamilyTime(k,mother,label,child,adult,{place:'御花园',gain:opensUp?11:5,stat:move.skill});
    if (opensUp && familyVisitAllowed(k,mother)) planGardenReunion({child:k.id,mother:mother.id,activity:label});
    return child;
  }
  const friendly=relGet(a,b)>=-25;
  const competitive=[a,b].find(p=>p.t2==='好胜'||(p.sex&&p.amb>=75));
  const lead=competitive || (banquetTalent(a,toss)>=banquetTalent(b,toss)?a:b);
  const peer=lead===a?b:a;
  const action=friendly
    ? competitive?'兴致正高，又邀身旁的人来一轮':toss?'示范如何瞄准壶口':'给身旁的人留了半张纸'
    : '行了礼，各做各的，席上没怎么搭话';
  relAdd(a,b,friendly?(move.cooperate?8:competitive?3:6):1);
  NPCMemory.record(S,{type:'garden-banquet',time:S.turn,location:'御花园',participants:[a.id,b.id],object:label},[
    {person:lead.id,subject:peer.id,interpretation:`与${familyName(peer)}同席${label}，${action}。`,emotion:friendly?.65:.12,impact:65},
    {person:peer.id,subject:lead.id,interpretation:friendly?`与${familyName(lead)}同席${label}，愿意下次再试。`:`小宴上与${familyName(lead)}同席，仍然生分。`,emotion:friendly?.55:.05,impact:64}
  ]);
  if (friendly && !a.sex && !b.sex) planGardenReunion({guest:lead.id,partner:peer.id,activity:label});
  return `${familyName(lead)}和${familyName(peer)}相邻。席间，${familyName(lead)}${action}。`;
}

function planGardenReunion(plan) {
  const plans=S.gardenPlans ||= [], turn=S.turn+2;
  const existing=plans.findIndex(item=>item.turn===turn);
  if (existing<0) plans.push({...plan,turn});
  else if (plan.child && !plans[existing].child) plans[existing]={...plan,turn};
}

function proudBanquetGuest(people) {
  if (S.over || S.turn-(S.flags.lastProudDemand ?? -4)<4) return null;
  return people.filter(c=>!c.sex && inPalace(c) && !c.maid && c.rank<8 && c.trait==='骄纵' &&
      c.favor>=(c.preg>=2?56:70)-4*(c.palacePrivilege||0))
    .sort((a,b)=>(b.favor+(b.preg>=2?16:0))-(a.favor+(a.preg>=2?16:0)))[0];
}

function proudDemandNotice() {
  const c=proudBanquetGuest(harem());
  return c?`<div class="acts"><button class="btn sm jade" onclick="A.hearProudDemand()">${esc(cName(c))} · ${c.preg>=2?'有孕请旨':'宫中起争执'}</button></div>`:'';
}

A.hearProudDemand = function() {
  if (modalOpen) return;
  const c=proudBanquetGuest(harem());
  if (c) pushEv(proudDemandEvent(c));
};

function proudDemandEvent(c,guests) {
  const atBanquet=!!guests, queen=empress();
  const present=guests||harem();
  const other=present.filter(p=>!p.sex&&p!==c&&p!==queen).sort((a,b)=>relGet(c,a)-relGet(c,b))[0];
  const witness=present.includes(queen)?queen:other;
  const name=cName(c), pregnancy=c.preg>=2, repeated=(c.palacePrivilege||0)>0;
  let text=atBanquet
    ? `正席上菜前，${name}看了眼席签：“${pregnancy?'臣妾近来有孕，坐远了怕照应不及':'陛下平日最懂臣妾的心'}，今日就让我坐在御座旁吧。”`
    : `${name}${pregnancy?'以有孕为由，叫御膳房先把别宫的燕窝送到自己宫里':'把内务府送往别宫的新缎截下，说自己要先挑'}。`;
  if (repeated) text+='她又道：“上回陛下也准了，怎么这回就不行？”';
  if (witness) text+=`\n${cName(witness)}${witness===queen?'放下茶盏：“有孕该照顾。各宫的分例和席次，也得有个准绳。”':'听见这话，默默把原本准备好的贺礼收回袖里。'}`;
  const settle=(decision)=>{
    S.flags.lastProudDemand=S.turn;
    let result;
    if (decision==='yield') {
      c.palacePrivilege=Math.min(3,(c.palacePrivilege||0)+1);
      cchg(c,{mood:12,favor:5,aff:4});
      if(witness){relAdd(c,witness,-14);cchg(witness,{mood:-9});}
      result=atBanquet?'你让人照她的意思改了座次。她笑着坐下，旁人少了几分谈兴。':'内务府照她的吩咐改了分例。下回她会记得，向你开口就能破例。';
    } else if (decision==='care') {
      cchg(c,{mood:5,aff:3});
      if(witness)relAdd(c,witness,3);
      result=pregnancy?'你请太医按她的需要开调养单，额外从御前支取。各宫原有的份例照发。':'你问她究竟缺什么，准她从御前另领一份。其他人的份例照旧。';
    } else {
      c.palacePrivilege=Math.max(0,(c.palacePrivilege||0)-1);
      cchg(c,{mood:-12,favor:-8,aff:-3});
      setXin(c,'委屈','越过宫规，当众被劝回');
      if(witness)cchg(witness,{mood:6,aff:3});
      result=atBanquet?'你示意她照原定座次入席。她没有再争，却比旁人早一步离席。':'你命内务府照例发放。她收下原有的份例，几日没再来御前。';
    }
    story(c,result);remember(c,decision==='rules'?'hurt':'care',result);
    if(witness)remember(witness,decision==='yield'?'hurt':'care',
      decision==='yield'?`陛下为${name}破例，我的话没有被听进去。`:
        decision==='care'?`陛下准许照顾${name}，各宫的份例照旧。`:`陛下听了宫中各人的话，仍按原来的规矩办。`);
    log(`${name}因${atBanquet?'席次':'分例'}请旨。 ${result}`);
    return result;
  };
  return {title:atBanquet?'席间争座':pregnancy?'恃宠争例':'内务府争执',cast:[c,witness],text,choices:[
    {t:'这回依她',f:()=>settle('yield')},
    {t:pregnancy?'照顾身孕，席次和分例照旧':'另给她一份，其他人照旧',f:()=>settle('care')},
    {t:'按宫规办',f:()=>settle('rules')}
  ]};
}

function showGardenReunion() {
  const reunion=S.banquetReunion;
  if (!reunion || reunion.turn!==S.turn || reunion.joined) return null;
  const first=kidById(reunion.child)||byId(reunion.guest);
  const second=byId(reunion.mother||reunion.partner);
  if (!(first?.sex ? familyVisitAllowed(first,second) : inPalace(first)&&inPalace(second))) return null;
  return {reunion,first,second};
}

A.joinGardenReunion = function() {
  const meeting=showGardenReunion();
  if (!meeting || modalOpen) return;
  const {reunion,first,second}=meeting;
  setScene('garden');
  pushEv({title:'御花园赴约',cast:[first,second],text:reunion.text,choices:[
    {t:'陪他们再玩一轮',f:()=>{
      reunion.joined=true;
      if (first.sex) skillGain(first,reunion.activity==='投壶'?'mar':'lit',2);
      else cchg(first,{aff:3,mood:4});
      cchg(second,{aff:3,mood:4});
      return `${familyName(first)}见你来了，把身旁的位置让给你。`;
    }}, {t:'让他们自己玩'}]});
};

function gardenFamilyMoment() {
  const moment = currentFamilyMoment();
  return moment?.place === '御花园' ? moment : null;
}

function gardenFamilyNotice() {
  const meeting=showGardenReunion();
  if(meeting)return `<section class="initiative-note">${activityPortraits(meeting.first,meeting.second)}<p>${esc(meeting.reunion.text)}</p><button class="btn sm jade" onclick="A.joinGardenReunion()">去御花园赴约</button></section>`;
  const moment=gardenFamilyMoment();
  return moment?`<section class="initiative-note">${activityPortraits(kidById(moment.child),byId(moment.mother))}<p>${esc(moment.text)}</p><button class="btn sm quiet" onclick="A.go('kid',${moment.child})">看看孩子</button></section>`:'';
}
