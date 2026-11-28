/* ============ 事件频率 ============
   Owners of the 金手指包 (and the web test page) choose, per kind of event, whether it
   never happens, happens rarely, as usual, or often. The choice lives in the saved
   world (S.flags.eventFreq) and is changed through a journaled action, so a pending
   scene replays with the same odds it was recorded with.
   Each kind of event asks eventFrequency(category) for a multiplier where its odds are
   decided; events the player starts themself, and follow-ups of a story already under
   way, are not touched. Journal content 171+. */
const EVENT_FREQ_VERSION=171;
const EVENT_FREQ_LEVELS=Object.freeze({off:{label:'不触发',mul:0},low:{label:'小概率',mul:.35},normal:{label:'常规',mul:1},high:{label:'高概率',mul:2}});
const EVENT_FREQ_CATEGORIES=Object.freeze([
  {id:'scheme',name:'宫斗与夺嫡',desc:'争风吃醋、香囊藏麝、石阶泼油、巫蛊栽赃、谋害储君、派系倾轧、储位之争、皇子结党'},
  {id:'affair',name:'妃嫔私情',desc:'宫门私约、侍卫私会、宫墙私情等妃嫔出轨的事，以及由此而来的私生身世'},
  {id:'traveler',name:'天外来客',desc:'来自未来的穿越妃嫔和她们的异世旧梦（对之后新入宫的人生效）'},
  {id:'mystic',name:'仙缘与前世',desc:'求仙问道、仙山奇遇、前世旧梦'},
  {id:'heart',name:'心境与小性子',desc:'思念、委屈、嫉恨等心境引出的事，各人的小性子，失宠之问'},
  {id:'harem',name:'后宫日常',desc:'争执、求晋位分、中宫奏事、芳辰雅集、冷宫来信、迁宫与祈愿、太后叮嘱'},
  {id:'family',name:'娘家与家书',desc:'娘家来信、外戚请托、亲眷求见、省亲与家中变故'},
  {id:'children',name:'皇嗣日常',desc:'孩子的功课、玩闹、心事，少年皇嗣的见闻，抚养请托'},
  {id:'court',name:'朝堂奏议',desc:'朝臣主动奏事、党争、外戚请封、历史典故事件'},
  {id:'disaster',name:'天灾',desc:'黄河决堤、蝗灾、地龙翻身'},
  {id:'intel',name:'锦衣卫密报',desc:'锦衣卫主动呈上的线索（你派下去的案子照常回奏）'},
  {id:'festival',name:'节庆与进贡',desc:'岁时节庆、珠宝进贡、使臣朝贺'},
  {id:'maid',name:'宫女',desc:'奉茶宫女、近身宫女的偶遇与心事'},
  {id:'story',name:'风华人物与剧情来信',desc:'出宫时偶遇风华人物、剧情人物托人递话（已相遇的故事照常继续）'},
  {id:'secret',name:'身世与隐情',desc:'隐瞒小产、宫外孩子的身世疑云、身世传闻、换婴寻亲'},
]);
function eventFrequencyLevel(cat){
  if(journalContentVersion()<EVENT_FREQ_VERSION)return 'normal';
  const level=S?.flags?.eventFreq?.[cat];
  return Object.hasOwn(EVENT_FREQ_LEVELS,level)?level:'normal';
}
function eventFrequency(cat){return EVENT_FREQ_LEVELS[eventFrequencyLevel(cat)].mul;}
// For a probability p decided in code: scaled and capped.
function eventOdds(cat,p){return Math.min(1,p*eventFrequency(cat));}
// For events with no roll of their own: never when off, about one month in three when
// rare, otherwise as written. Draws from the world's RNG only when the level is rare.
function eventGate(cat){const m=eventFrequency(cat);return m>=1||(m>0&&chance(m));}
// A generator that rolls for itself: skipped when off, thinned when rare.
function eventPick(cat,make){return eventGate(cat)?make():null;}
// Sorting bonus in the month's optional pool, so "often" also wins ties for the few slots.
function eventPriority(cat){const m=eventFrequency(cat);return m>1?2.5:m<1?-1.5:0;}
function eventFreqUnlocked(){
  // The web test page loads its own tools object; packages never do.
  return !!S&&(S.flags.goldFinger===true||typeof DEV!=='undefined');
}
A.setEventFreq=function(cat,level){
  if(!S||S.over||modalOpen||!eventFreqUnlocked()||journalContentVersion()<EVENT_FREQ_VERSION||
    !EVENT_FREQ_CATEGORIES.some(c=>c.id===cat)||!Object.hasOwn(EVENT_FREQ_LEVELS,level)){toast('现在不能调整');return;}
  const set=S.flags.eventFreq ||= {};
  if(level==='normal')delete set[cat];else set[cat]=level;
  render();
};
A.resetEventFreq=function(){
  if(!S||S.over||modalOpen||!eventFreqUnlocked()||journalContentVersion()<EVENT_FREQ_VERSION){toast('现在不能调整');return;}
  delete S.flags.eventFreq;render();
};
function eventFreqPage(){
  return `${pageHeading('事件频率','各类事件出现的多少')}${eventFreqUnlocked()?eventFreqView():'<p class="hint">金手指包的功能：购买后可在商城里调整。</p>'}`;
}
function eventFreqView(){
  if(!S)return '<section class="save-section" aria-label="事件频率"><h3>金手指 · 事件频率</h3><p class="hint">开始或读取一朝后，可在这里调整各类事件出现的多少。</p></section>';
  const waiting=journalContentVersion()<EVENT_FREQ_VERSION?'这份存档里还有旧版本没处理完的事，处理完并进入下个月后就能调整。':modalOpen?'先处理完眼前的事再调整。':S.over?'这一朝已经结束。':'';
  const rows=EVENT_FREQ_CATEGORIES.map(c=>{
    const now=eventFrequencyLevel(c.id);
    return `<div class="event-freq-row"><div><b>${esc(c.name)}</b><small class="hint">${esc(c.desc)}</small></div><div class="acts" role="group" aria-label="${esc(c.name)}">${Object.entries(EVENT_FREQ_LEVELS).map(([key,l])=>
      `<button class="btn sm${key===now?' primary':''}" data-onclick="A.setEventFreq('${c.id}','${key}')" aria-pressed="${key===now}" ${waiting?'disabled':''}>${l.label}</button>`).join('')}</div></div>`;
  }).join('');
  return `<section class="save-section event-freq" aria-label="事件频率"><h3>金手指 · 事件频率</h3>
    <p class="hint">每类事件选一档，从下个月起生效，只对当前这份存档有效。已经开始的故事会照常走完；你自己去做的事（翻牌、探望、微服）不受影响。</p>
    ${waiting?`<p role="status">${esc(waiting)}</p>`:''}${rows}
    <div class="acts"><button class="btn sm" data-onclick="A.resetEventFreq()" ${waiting||!S.flags.eventFreq||!Object.keys(S.flags.eventFreq).length?'disabled':''}>全部恢复常规</button></div></section>`;
}
