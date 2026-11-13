/* ============ 母子日常与御花园小宴 ============ */
const inPalace = c => c?.alive && !c.gone && !c.cold && !c.templeStay;
// Marriage alone does not move a child: a local couple may still await an estate.
const childHasLeftPalace = k => !!(k?.away || k?.estate || k?.princeEstate || k?.jailed || k?.templeStay || k?.removedFromRoyal || k?.princessMarriage==='frontier');
const childInPalace = k => !!k?.alive && !childHasLeftPalace(k);
const childCanVisitCourt = k => !!k?.alive&&!k.templeStay&&!k.removedFromRoyal&&!k.jailed&&!k.away&&(childInPalace(k)||!!k.princeEstate);
const familyName = person => person.sex ? kidName(person) : cName(person);
const mothersOf = k => [...new Set([byId(k.mom), fosterOf(k)].filter(Boolean))];

function childTrust(k, mother) {
  const saved = k.motherBonds?.[mother.id]?.trust;
  if (saved !== undefined) return saved;
  const raisedByMother = (k.foster || k.mom) === mother.id;
  const monthsTogether = k.fosterT ?? k.born;
  return raisedByMother
    ? Math.min(68, 38 + Math.max(0, S.turn - monthsTogether))
    : Math.min(60, 22 + Math.max(0, monthsTogether - k.born));
}

function familyVisitAllowed(k, mother) {
  return childInPalace(k) && inPalace(mother) && mothersOf(k).includes(mother) &&
    !(k.foster && k.mom === mother.id && k.visitRule === 'closed');
}

function recordFamilyTime(k, mother, activity, childView, motherView, { gain = 8, place = '宫中', stat } = {}) {
  const trust = clamp(childTrust(k, mother) + gain);
  const bonds = k.motherBonds ||= {};
  bonds[mother.id] = { trust, turn: S.turn, activity, childView, motherView };
  relAdd(mother, k, gain / 2);
  cchg(mother, { mood: 3 });
  if (stat) skillGain(k, stat, 1);
  NPCMemory.record(S, { type: 'family-time', time: S.turn, location: place,
    participants: [k.id, mother.id], object: activity }, [
    { person: k.id, subject: mother.id, interpretation: childView, emotion: .75, impact: 75 },
    { person: mother.id, subject: k.id, interpretation: motherView, emotion: .8, impact: 78 }
  ]);
}

const FAMILY_ACTIVITIES = {
  cradle: { title: '哄睡', place: '宫中', child: '听见熟悉的歌声，渐渐睡安稳了。', mother: '哼着旧曲哄孩子入睡，孩子一直攥着她的衣袖。' },
  paint: { title: '一同描画', place: '御花园', stat: 'lit', child: '画歪了花枝，她便在旁添了一只小雀。', mother: '孩子坚持留下那根画歪的花枝，说风吹过的树就该是这样。' },
  archery: { title: '练习投壶', place: '御花园', stat: 'mar', child: '练了几次才投中，她记得头一回就差了多少。', mother: '孩子嫌壶口太近，自己往后退了一步再投。' },
  cakes: { title: '做点心', place: '宫中', child: '把第一块捏成了团子，她照样给蒸了。', mother: '孩子把最好看的那块留给她，自己吃了蒸破的。' },
  walk: { title: '并肩散步', place: '御花园', child: '走到池边才肯说出这几日烦心的事。', mother: '两人绕了池子一圈，孩子终于肯告诉她近来在愁什么。' },
  listen: { title: '听孩子说心事', place: '宫中', child: '心里有话，想起她从前肯听自己慢慢说，便去找她。', mother: '孩子主动来找她说话。她放下手中的事，听孩子从头讲完。' },
  reading: { title: '一起读书', place: '宫中', stat: 'lit', child: '有一处读不懂，她用自己小时候的事讲明白了。', mother: '念到有趣处，孩子合上书，换了自己的话又说了一遍。' }
};

function familyActivity(k, mother, seeking) {
  if (kidAge(k) < 3) return FAMILY_ACTIVITIES.cradle;
  if (seeking) return FAMILY_ACTIVITIES.listen;
  const activities = [];
  if (mother.trait === '才女' || mother.like === '字画') activities.push('paint');
  if (kidAge(k) >= 6 && (mother.trait === '将门' || mother.t2 === '擅骑射')) activities.push('archery');
  if (mother.t2 === '嗜甜' || mother.t2 === '擅厨艺') activities.push('cakes');
  if (kidAge(k) >= 5 && (k.policy === '读书' || mother.t2 === '好读史')) activities.push('reading');
  activities.push('walk');
  const last = k.motherBonds?.[mother.id]?.activity;
  return FAMILY_ACTIVITIES[activities.find(key => FAMILY_ACTIVITIES[key].title !== last) || activities[0]];
}

function spendFamilyTime(k, mother, seeking) {
  const act = familyActivity(k, mother, seeking);
  const childView = `与${cName(mother)}${act.title === '哄睡' ? '相处' : '相聚'}。${act.child}`;
  recordFamilyTime(k, mother, act.title, childView, `${k.name}在身边。${act.mother}`, {
    place: act.place, stat: act.stat, gain: seeking ? 9 : 7
  });
  const text = seeking
    ? `${k.name}心里有事，主动去找了${cName(mother)}。两人说了许久。`
    : `${cName(mother)}带着${k.name}${act.title === '哄睡' ? '，在窗边轻声哼曲' : act.title}。`;
  S.familyMoment = { turn: S.turn, child: k.id, mother: mother.id, place: act.place, text };
  return childView;
}

function familyLifeTick() {
  if (S.familyMoment?.turn === S.turn) return;
  const pending = S.gardenPlans || [];
  S.gardenPlans = pending.filter(plan => plan.turn > S.turn);
  const plan = pending.find(item => item.turn === S.turn);
  if (plan) {
    const k = kidById(plan.child), mother = byId(plan.mother);
    if (familyVisitAllowed(k, mother)) {
      const text = `${k.name}记得上次小宴，主动邀${cName(mother)}到园中再${plan.activity === '投壶' ? '练一回投壶' : '画一幅花枝'}。`;
      recordFamilyTime(k, mother, plan.activity, text, `孩子还记得那回小宴上的约定，自己来邀她同行。`, { place: '御花园', gain: 9 });
      S.familyMoment = { turn: S.turn, child: k.id, mother: mother.id, place: '御花园', text };
      S.banquetReunion={...plan,text};
      return;
    } else if (plan.guest) {
      const first=byId(plan.guest), second=byId(plan.partner);
      if (inPalace(first) && inPalace(second)) {
        relAdd(first,second,4);
        S.banquetReunion={...plan,text:`${cName(first)}带着${plan.activity==='投壶'?'铜壶':'新裁的花笺'}赴约，${cName(second)}已经在亭里等她。`};
      }
    }
  }
  const candidates = [];
  for (const k of kidsAlive()) {
    const options = mothersOf(k).filter(m => familyVisitAllowed(k, m));
    const seeking = kidAge(k) >= 4 && (k.hp < 55 || (S.turn - k.born) % 5 === 0);
    for (const mother of options) {
      const last = k.motherBonds?.[mother.id]?.turn ?? -3;
      if (S.turn - last < 3) continue;
      const separated = k.foster && k.mom === mother.id;
      if (separated && !k.visitRule && !seeking && relGet(mother, fosterOf(k)) < -10) continue;
      const trust = childTrust(k, mother) + NPCMemory.influence(S, k.id, mother.id) * 6;
      if (seeking && trust < 35) continue;
      const priority = seeking ? trust : Math.min(24, S.turn - last) + (separated && k.visitRule === 'open' ? 4 : 0);
      candidates.push({ k, mother, seeking, priority: priority + (seeking ? 30 : 0) });
    }
  }
  candidates.sort((a, b) => b.priority - a.priority);
  if (candidates.length) {
    const { k, mother, seeking } = candidates[0];
    spendFamilyTime(k, mother, seeking);
  }
}

function currentFamilyMoment() {
  const moment = S.familyMoment;
  if (moment?.turn === S.turn && familyVisitAllowed(kidById(moment.child), byId(moment.mother))) return moment;
}

A.familyVisitRule = function(id, rule) {
  const k = kidById(id);
  if (S.over || !childInPalace(k) || !k.foster || !inPalace(byId(k.mom)) || !['open','closed'].includes(rule)) return;
  if (k.visitRule === rule) return;
  k.visitRule = rule;
  const mother = byId(k.mom);
  remember(mother, rule === 'open' ? 'care' : 'hurt', rule === 'open' ? `准我平日去看${k.name}` : `暂缓我私下探望${k.name}`);
  log(rule === 'open' ? `准${fullName(mother)}平日探望${k.name}。` : `暂缓${fullName(mother)}私下探望${k.name}。`);
  render();
};

A.familyTime = function(childId, motherId) {
  const k = kidById(childId), mother = byId(motherId);
  if (modalOpen || !familyVisitAllowed(k, mother) || k.motherBonds?.[motherId]?.turn === S.turn || !useE()) return;
  const text = spendFamilyTime(k, mother, false);
  pushEv({ title: '陪伴', por: k, text, choices: [ok1] });
};

function familyTimePanel(k, mothers) {
  return mothers.map(mother => {
    const bond = k.motherBonds?.[mother.id];
    const trust = childTrust(k, mother);
    const closeness = kidAge(k) < 3
      ? trust >= 45 ? '认得她的声音' : '还在熟悉她的声音'
      : trust >= 68 ? '有事愿意先来找她' : trust >= 45 ? '相处自在' : '见面还有些拘谨';
    const ready = familyVisitAllowed(k, mother) && bond?.turn !== S.turn;
    return `<article class="family-time-row"><div><strong>${mother.id === k.mom ? '生母' : '养母'} · ${parentLink(mother.id)}</strong>
      <p class="hint">${inPalace(mother) ? closeness : '如今无法相见'}</p>
      ${bond?.activity ? `<p>${esc(UI.view === 'kid' ? bond.childView : bond.motherView)}</p>` : ''}</div>
      ${ready ? `<button class="btn sm jade" onclick="A.familyTime(${k.id},${mother.id})">一起陪陪孩子<small>精力-1</small></button>` : ''}</article>`;
  }).join('');
}

function kidFamilyPanel(k) {
  const separated = childInPalace(k) && k.foster && inPalace(byId(k.mom));
  const rule = k.visitRule === 'open' ? '准许平日探望' : k.visitRule === 'closed' ? '暂缓私下探望' : '照宫中旧例';
  const controls = separated ? `<p class="hint">生母探望安排 · ${rule}</p><div class="acts">
    <button class="btn sm" aria-pressed="${k.visitRule === 'open'}" onclick="A.familyVisitRule(${k.id},'open')">准许探望</button>
    <button class="btn sm" aria-pressed="${k.visitRule === 'closed'}" onclick="A.familyVisitRule(${k.id},'closed')">暂缓探望</button></div>` : '';
  return familyTimePanel(k, mothersOf(k)) + controls;
}

function consortFamilyPanel(mother) {
  return S.children.filter(k => k.alive && (k.mom === mother.id || k.foster === mother.id)).map(k =>
    `<div><button class="btn quiet sm" onclick="A.go('kid',${k.id})">${esc(kidName(k))}</button>${familyTimePanel(k,[mother])}</div>`
  ).join('');
}

/* ============ 家族 ============ */
const KIN_TXT={'亲姐':'亲姐姐','亲妹':'亲妹妹','堂姐':'堂姐','堂妹':'堂妹'};
function clanKey(c){return c.clan||(c.clan=c.sur+'|'+c.fam.t)}
function clanName(key){const [s,t]=key.split('|');return `${s}氏（${t.endsWith('家')?t:t+'家'}）`}
function clanMembers(key){return alive().filter(c=>!c.maid&&clanKey(c)===key&&!NOCLAN.includes(key.split('|')[1]))}
const NOCLAN=['宫女','寒门','西域贡女','歌女','良家子','先帝才人'];
const hasClan=c=>!c.maid&&!NOCLAN.includes((c.clan||'').split('|')[1]||c.fam.t);
function clans(){const m={};alive().filter(hasClan).forEach(c=>{const k=clanKey(c);(m[k]=m[k]||[]).push(c)});return Object.entries(m).filter(([k,v])=>v.length>=2)}
const isRival=(a,b)=>!!(a.kinRival&&a.kinRival[b.id]);
function clanTick(){for(const [k,ms] of clans()){const p=Math.round(ms.reduce((s,c)=>s+c.fam.p,0)/ms.length);ms.forEach(c=>c.fam.p=p);
  for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)relAdd(ms[i],ms[j],isRival(ms[i],ms[j])?-.5:.6)}}
function makeKin(c,type){c.kin=c.kin||{};c.kinRival=c.kinRival||{};const g=makeGirl({sur:c.sur,fam:{t:c.fam.t,p:c.fam.p}});g.clan=clanKey(c);g.kin={};g.kinRival={};
  if(type==='亲'){g.house=houseOf(c);g.fatherId=c.fatherId;}
  const older=g.age>c.age||(g.age===c.age&&chance(.5));c.kin[g.id]=type+(older?'姐':'妹');g.kin[c.id]=type+(older?'妹':'姐');
  if(chance(.35)){c.kinRival[g.id]=1;g.kinRival[c.id]=1}g.kinNote=`${cName(c)}的${KIN_TXT[c.kin[g.id]]}`;return g}
function clanEcho(c,t){const ms=clanMembers(clanKey(c));ms.filter(o=>o!==c).forEach(o=>{const rv=isRival(o,c);
  if(t==='up'){if(rv)setXin(o,'嫉恨',`${fullName(c)}晋了位分`,c.id);else cchg(o,{mood:6})}else{if(rv)cchg(o,{mood:5});else setXin(o,'惶恐',`同族的${fullName(c)}获罪`)}});
  ms.forEach(o=>o.fam.p=clamp(o.fam.p+(t==='up'?3:-6),0,95))}
function clanLine(c){if(c.maid||!c.alive||c.gone)return '';if(!hasClan(c))return `<div>家族：出身${esc(c.fam.t)}，娘家没有倚仗</div>`;const k=clanKey(c),ms=clanMembers(k).filter(o=>o!==c);
  const kt=o=>(c.kin&&c.kin[o.id])?KIN_TXT[c.kin[o.id]]:'同族';
  return `<div>家族：${esc(clanName(k))}　势力 ${rd(c.fam.p)}${ms.length?`　同族在宫：${ms.map(o=>`<span class="tag ${isRival(c,o)?'r':'g'}">${esc(cName(o))}·${kt(o)}${isRival(c,o)?'·不和':''}</span>`).join('')}`:''}</div>`}
function clanEvent(){
  for(const [k,family] of shuffle(clans())){const ms=family.filter(inPalace);if(ms.length<2)continue;const [a,b]=shuffle(ms),rv=isRival(a,b),kt=a.kin&&a.kin[b.id],r=R();
    if(rv&&r<.5)return {title:'嫡庶',present:[a,b],cast:[a,b],text:`${cName(a)}与${cName(b)}是${kt?.startsWith('亲')?'亲生':kt?.startsWith('堂')?'堂房':'同族'}姐妹，在娘家时一个是嫡出、一个是庶出，从小就不对付。今日请安，两人又为座次争了起来，家里的老夫人连夜递了牌子进宫。`,choices:[
      {t:`偏向${cName(a)}`,person:a,f:()=>{relAdd(a,b,-10);setXin(b,'委屈','陛下偏向了姐妹');return fx(cchg(a,{mood:10}),cchg(b,{mood:-10}))}},
      {t:`偏向${cName(b)}`,person:b,f:()=>{relAdd(a,b,-10);setXin(a,'委屈','陛下偏向了姐妹');return fx(cchg(b,{mood:10}),cchg(a,{mood:-10}))}},
      {t:'让两人一同去见老夫人，把话说开',f:()=>{if(chance(.45)){delete a.kinRival[b.id];if(b.kinRival)delete b.kinRival[a.id];relAdd(a,b,25);story(a,`与${fullName(b)}在老夫人面前把多年心结说开了。`);story(b,`与${fullName(a)}在老夫人面前把多年心结说开了。`);return '姐妹俩抱头哭了一场。多年的心结，总算解开了。'}return '两人在老夫人面前忍着，一出门就各走各的。'}}]};
    if(!rv&&r<.4)return {title:'姐妹同心',present:[a,b],cast:[a,b],text:`${cName(a)}与${cName(b)}是${kt?KIN_TXT[kt].replace('姐姐','姐妹').replace('妹妹','姐妹'):'同族姐妹'}，在宫里也常常同进同出。今日两人一同来求见，说娘家${pick(['被人参了一本','想为家中子弟求个差事','老父亲七十大寿'])}，想求陛下一个恩典。`,choices:[
      {t:'准了',f:()=>{ms.forEach(o=>{o.fam.p=Math.min(95,o.fam.p+5);cchg(o,{mood:10,aff:4})});return fx(chg({prestige:-2}))+`\n§${clanName(k)}势力上升`}},
      {t:'“家事是家事，国事是国事。”',f:()=>{ms.forEach(o=>cchg(o,{mood:-6}));return fx(chg({prestige:1}))}}]};
    if(ms.length>=3&&ms[0].fam.p>=55&&r<.75)return {title:'外戚',ref:'外戚专权（汉·吕氏、霍氏）',por:a,text:`${clanName(k)}一门已有${ms.length}人在宫中，父兄子侄遍布六部。御史上疏：“昔吕氏、霍氏之祸，皆起于外戚。”`,choices:[
      {t:'削其兄弟官职，以安朝野',f:()=>{ms.forEach(o=>{o.fam.p=Math.max(5,o.fam.p-25);setXin(o,'惶恐','家族被削权')});log(`削${clanName(k)}外戚官职。`,1);return fx(chg({prestige:5,people:3}))}},
      {t:'倚重外戚，稳固朝局',f:()=>{ms.forEach(o=>{o.fam.p=Math.min(95,o.fam.p+10);setXin(o,'欢喜','家族更受倚重')});return fx(chg({prestige:-4}))}}]};
    if(!rv&&a.favor>=50&&b.favor>=50)return {title:'娥皇女英',present:[a,b],ref:'娥皇、女英姐妹同嫁舜（上古传说）',cast:[a,b],text:`宫宴上有人吟起娥皇女英的典故，满座都看向${cName(a)}与${cName(b)}这对姐妹。两人对视一眼，都红了脸。`,choices:[{t:'举杯：“朕之幸也。”',f:()=>{relAdd(a,b,8);return fx(cchg(a,{aff:5,mood:8}),cchg(b,{aff:5,mood:8}))}}]};
  }
  const h=harem().filter(c=>c.favor>=60&&c.fam.p>=15&&hasClan(c)&&!c.recommended);
  if(h.length&&chance(.5)){const c=pick(h);c.recommended=1;const g=makeKin(c,chance(.5)?'亲':'堂');
    return {title:'家书',por:g,text:`${cName(c)}的娘家送来一封信：家中${KIN_TXT[c.kin[g.id]].replace(/^亲/,'')}${fullName(g)}今年${g.age}岁，想送进宫来陪伴姐姐。${isRival(c,g)?'\n宫女私下说，这两姐妹在家时并不和睦。':''}`,choices:[
      {t:'接她入宫，封为常在',f:()=>{addConsort(g,2,`经${fullName(c)}娘家举荐入宫`);return fx(cchg(c,{mood:isRival(c,g)?-8:10}))}},
      {t:'婉拒',f:()=>{delete c.kin[g.id];return '信被原样退了回去。'}}]}}
  return null}
