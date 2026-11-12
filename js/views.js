/* ============ 渲染 ============ */
function bar(l,v,c){v=rd(v);return `<div class="bar"><span>${l}</span><i><b style="width:${clamp(v)}%;${c?`background:${c}`:''}"></b></i><em>${v}</em></div>`}
function renderTop(){
  const t=$('#top');
  const sound=`<button id="snd" class="btn sm${AU.on?' on':''}" aria-pressed="${AU.on}" onclick="AU.toggle()">${AU.on?'♪ 声音：开':'♪ 开启声音'}</button>`;
  if(!S){t.innerHTML=`<span class="brand">宸宫纪</span><span class="sp"></span>${sound}`;return}
  const e=E(),mx=maxEnergy();let pips='';for(let i=0;i<mx;i++)pips+=`<span class="pip${i<e.energy?'':' off'}"></span>`;
  const hd=e.health>=80?'康健':e.health>=55?'安好':e.health>=30?'欠安':'病笃';
  t.innerHTML=`<div class="hud-identity">${porImg('emp',38)}<div class="hud-name"><span class="date">${esc(dateStr())}</span><span class="hud-person">${esc(e.sur+e.name)} · ${e.age}岁</span></div></div>
   <div class="hud-stats"><span class="st" title="${hd}">龙体 <b>${rd(e.health)}</b></span><span class="st">威望 <b>${rd(e.prestige)}</b></span><span class="st">民心 <b>${rd(e.people)}</b></span>
   <span class="st">国库 <b>${e.treasury}</b>万两</span><span class="st" aria-label="精力 ${e.energy}／${mx}">精力 ${pips}</span></div>
   <div class="hud-controls">${sound}<button class="btn gold sm hud-next" onclick="A.endMonth()" ${S.over?'disabled':''}>结束本月 ▸</button></div>`;
}
const MENU=[['map','宫城'],['home','御书房'],['court','上朝'],['harem','后宫'],['cards','翻牌子'],['xx','选秀'],['kids','皇嗣'],['family','家族'],['out','出巡'],['log','起居注'],['sys','存档']];
const DOCK_ART={
  map:['....g....','..ggggg..','ggggggggg','.rr...rr.','.rg...gr.','.rg...gr.','ggggggggg'],
  home:['.ggggggg.','.g.....g.','.ggggggg.','.g.r.r.g.','.g.r.r.g.','.ggggggg.','...ggg...'],
  court:['.gggggg..','.g...ggg.','.g.g.gg..','.g...g...','.g.g.g...','gg...g...','.ggggg...'],
  harem:['..g.g.g..','.ggggggg.','...ggg...','..rrrrr..','...rrr...','..rrrrr..','.rrrrrrr.'],
  cards:['...jjj...','..jjjjj..','..jgggj..','..jgjgj..','..jgggj..','..jjjjj..','..jjjjj..'],
  xx:['...rrr...','..rgrgr..','.rrgggrr.','..rrgrr..','...rrr...','....j....','...jjj...'],
  kids:['..g.g.g..','..ggggg..','..rrrrr..','..rgrgr..','..rrrrr..','...rrr...','..rrrrr..'],
  family:['..gg.gg..','.gjjgjjg.','.gjjjjjg.','..gjjjg..','...gjg...','....g....','....g....'],
  out:['....g....','..ggggg..','.ggggggg.','ggggggggg','..r.r.r..','..r.r.r..','....r....'],
  log:['.ggggggg.','.grrrrgg.','.grggrgg.','.grrrrgg.','.grggrgg.','.grrrrgg.','.ggggggg.'],
  sys:['...ggg...','...ggg...','....g....','..rrrrr..','..rgrgr..','..rgrgr..','..rrrrr..']
};
const dockImages=new Map();
function dockIcon(key){
  if(!dockImages.has(key)){
    const canvas=document.createElement('canvas');canvas.width=9;canvas.height=9;
    const pen=canvas.getContext('2d'),colors={g:'#eeca8a',r:'#ce7754',j:'#93bd9b'};
    DOCK_ART[key].forEach((row,y)=>[...row].forEach((dot,x)=>{
      if(!colors[dot])return;
      pen.fillStyle=colors[dot];pen.fillRect(x,y+1,1,1);
    }));
    dockImages.set(key,canvas.toDataURL());
  }
  return `<img class="dock-icon px" src="${dockImages.get(key)}" alt="" aria-hidden="true">`;
}
function renderMenu(){const m=$('#menu');if(!S){m.innerHTML='';m.hidden=true;return}m.hidden=false;
  const current={palace:'map',place:'map',banquet:'map',consort:'harem',kid:'kids'}[UI.view]||UI.view;
  m.innerHTML=MENU.map(([k,l])=>`<button class="btn${current===k?' on':''}" ${current===k?'aria-current="page"':''} ${k==='court'?'title="精力-1"':''} onclick="${k==='court'?'A.court()':`A.go('${k}')`}">${dockIcon(k)}<span>${l}</span></button>`).join('');
}
let panelRoute;
function renderPanel(){
  const p=$('#panel'),v=UI.view;
  const route=JSON.stringify([v,UI.sel]);
  if(!S)p.innerHTML=v==='new'?viewNew():viewTitle();
  else p.innerHTML=({family:viewFamily,map:viewMap,palace:viewPalace,place:viewPlace,banquet:viewBanquet,home:viewHome,harem:viewHarem,consort:viewConsort,cards:viewCards,xx:viewXX,kids:viewKids,kid:viewKid,out:viewOut,log:viewLog,sys:viewSys}[v]||viewHome)();
  if(route!==panelRoute){p.scrollTop=0;panelRoute=route;}
}
function render(){
  const app=$('#app');
  app.setAttribute('data-layout',S?'game':UI.view==='new'?'setup':'landing');
  app.setAttribute('data-view',UI.view);
  renderTop();renderMenu();renderPanel();if(S&&UI.view==='map')mountMap();
}
function viewTitle(){
  const slots=['auto','1','2','3'].map(s=>({s,i:slotInfo(s)})).filter(x=>x.i);
  return `<div class="title-wrap"><div class="eyebrow">FORBIDDEN CITY</div><h1>宸宫纪</h1>
   <p class="intro">在宫城里处理朝政、走访后宫，写下属于你的一朝本纪。</p>
   <button class="btn gold" onclick="A.newGame()">新开一局</button>
   ${slots.length?`<div class="save-list">${slots.map(x=>`<button class="btn sm" onclick="A.load('${x.s}')">读取${x.s==='auto'?'自动存档':'存档'+x.s}：${esc(x.i)}</button>`).join('')}</div>`:''}</div>`}
function viewNew(){
  return `<h2>登基大典</h2><div class="form">
   <div class="two"><label>国姓<input id="f-sur" class="inp" maxlength="2" value="萧"></label><label>名讳<input id="f-name" class="inp" maxlength="2" value="${pick(['彻','珩','翊','昭','衍','恪'])}"></label></div>
   <label>年号<input id="f-era" class="inp" maxlength="2" value="${pick(ERAS)}"></label>
   <div>帝王性情</div>
   ${Object.entries(STYLES).map(([k,d],i)=>`<label class="opt"><input type="radio" name="f-style" value="${k}" ${i===0?'checked':''}><span><b>${k}</b>　<span class="hint">${d}</span></span></label>`).join('')}
   <div class="acts"><button class="btn gold" onclick="A.start()">登基</button><button class="btn sm" onclick="A.go('title')">返回</button></div></div>`}
function consortCard(c){
  const tags=[xinTag(c),c.visitor?'<span class="tag y">母亲在宫</span>':'',c.preg>=2?'<span class="tag r">有孕</span>':'',c.cold?'<span class="tag k">冷宫</span>':'',c.rank===8?'<span class="tag y">中宫</span>':''].join('');
  return `<button class="card" onclick="A.go('consort',${c.id})">${porImg(c,72)}<div class="grow"><div class="nm">${esc(cName(c))}</div><div>${esc(fullName(c))} · ${c.age}岁 · ${esc(c.palace)}</div><div>${tags}<span class="tag">${c.trait}</span></div>${bar('恩宠',c.favor)}${bar('心情',c.mood,'#4f9078')}</div></button>`}

/* ---- 人物关系图：父兄 → 妃嫔 → 皇嗣，妃嫔之间的亲疏用连线表示 ---- */
function familyGraphSVG(){
  const people=S.consorts.filter(c=>c.alive&&!c.gone&&!c.maid).sort((a,b)=>clanKey(a)===clanKey(b)?b.rank-a.rank:clanKey(a)>clanKey(b)?1:-1);
  if(!people.length)return '<p class="hint">目前没有入宫的妃嫔。</p>';
  const col=96,W=Math.max(720,people.length*col+60),kids=new Map();
  for(const k of kidsAlive()){if(!kids.has(k.mom))kids.set(k.mom,[]);kids.get(k.mom).push(k)}
  const maxKids=Math.max(0,...people.map(c=>kids.get(c.id)?.length||0));
  const H=330+maxKids*34,x=i=>40+col/2+i*col,yF=50,yC=200,yK=280;
  const pos=new Map(people.map((c,i)=>[c.id,x(i)]));
  const t=(s,n=5)=>esc(String(s).slice(0,n));
  let out=`<svg class="family-graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="人物关系图">`;
  // 帝王：横线连着每位妃嫔，名牌最后再画，压在连线上面
  const ex=(x(0)+x(people.length-1))/2;
  out+=`<line x1="${ex}" y1="${yC-58}" x2="${ex}" y2="${yC-40}" stroke="#a87a26"/><line x1="${x(0)}" y1="${yC-40}" x2="${x(people.length-1)}" y2="${yC-40}" stroke="#a87a26"/>`;
  const emperor=`<rect x="${ex-46}" y="${yC-86}" width="92" height="28" rx="6" fill="#a87a26"/><text x="${ex}" y="${yC-67}" text-anchor="middle" fill="#fff6e0" font-size="13">${esc(E().sur+E().name)}</text>`;
  // 妃嫔之间的亲疏
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const v=relGet(people[i],people[j]);if(Math.abs(v)<30)continue;
    const x1=pos.get(people[i].id),x2=pos.get(people[j].id),mid=(x1+x2)/2,lift=yC+52+Math.min(60,(x2-x1)/6);
    out+=`<path d="M${x1} ${yC+22} Q${mid} ${lift} ${x2} ${yC+22}" fill="none" stroke="${v>0?'#4f9078':'#b8473c'}" stroke-width="${1+Math.abs(v)/40}" stroke-dasharray="${v>0?'':'4 3'}" opacity=".75"><title>${esc(fullName(people[i]))} 与 ${esc(fullName(people[j]))}：${v>0?'亲近':'不和'} ${Math.round(v)}</title></path>`;
  }
  people.forEach(c=>{
    const cx=pos.get(c.id),h=houseOf(c),st=stanceOf(c),color=BLOC_COLOR[st]||'#8a8277';
    out+=`<line x1="${cx}" y1="${yC-40}" x2="${cx}" y2="${yC-22}" stroke="#a87a26" opacity=".6"/>`;
    if(h){out+=`<line x1="${cx}" y1="${yF+22}" x2="${cx}" y2="${yC-22}" stroke="${color}" stroke-dasharray="2 3"/>
      <g><title>${esc(h.father.name)}（${esc(h.father.office)}）· 兄长${esc(h.brother.name)}（${esc(h.brother.post)}）· ${esc(blocName(st))}</title>
      <rect x="${cx-42}" y="${yF-18}" width="84" height="40" rx="5" fill="#fff8ea" stroke="${color}" stroke-width="2" opacity="${h.father.alive?1:.55}"/>
      <text x="${cx}" y="${yF-2}" text-anchor="middle" font-size="11" fill="#3a2a22">${t(h.father.name,4)}${h.father.alive?'':'†'}</text>
      <text x="${cx}" y="${yF+14}" text-anchor="middle" font-size="10" fill="${color}">${t(blocName(st),4)}·${t(h.father.office,4)}</text></g>`;}
    out+=`<g class="node" onclick="A.go('consort',${c.id})" style="cursor:pointer"><title>${esc(cName(c))} · 恩宠 ${Math.round(c.favor)}</title>
      <rect x="${cx-42}" y="${yC-22}" width="84" height="44" rx="7" fill="${c.rank===8?'#f5dfb0':'#fff2df'}" stroke="${c.cold?'#555':'#9a483e'}" stroke-width="2"/>
      <text x="${cx}" y="${yC-4}" text-anchor="middle" font-size="12" fill="#3a2a22">${t(fullName(c),4)}</text>
      <text x="${cx}" y="${yC+13}" text-anchor="middle" font-size="10" fill="#7a5a4a">${t(cName(c),5)}</text></g>`;
    (kids.get(c.id)||[]).forEach((k,i)=>{const ky=yK+i*34,foster=k.foster!==k.mom&&fosterOf(k);
      out+=`<line x1="${cx}" y1="${yC+22}" x2="${cx}" y2="${ky-12}" stroke="#9a483e" opacity=".5"/><g class="node" onclick="A.go('kid',${k.id})" style="cursor:pointer">
      <title>${esc(kidName(k))}${foster?` · 由${esc(fullName(foster))}抚养`:''}</title>
      ${foster?`<text x="${cx+40}" y="${ky+4}" font-size="9" fill="#7a5a4a">养于${t(fullName(foster),3)}</text>`:''}
      <rect x="${cx-38}" y="${ky-12}" width="76" height="26" rx="13" fill="${S.heir===k.id?'#f5dfb0':'#eef3ea'}" stroke="${k.sex==='m'?'#3b5fa8':'#b0587a'}"/>
      <text x="${cx}" y="${ky+5}" text-anchor="middle" font-size="11" fill="#2a2a2a">${t(k.name,4)}${S.heir===k.id?'·储':''}</text></g>`;});
  });
  out+=emperor+'</svg>';
  const legend=COURT_BLOCS.map(b=>`<span class="tag" style="border-color:${BLOC_COLOR[b.id]};color:${BLOC_COLOR[b.id]}">${b.name}</span>`).join('');
  return `<div class="graph-legend">${legend}<span class="hint">绿实线：亲近　红虚线：不和　上排是父亲，下排是皇嗣。点人名查看详情。</span></div><div class="graph-wrap">${out}</div>`;
}
A.familyMode=function(mode){UI.familyMode=mode;render()};
/* ---- 起居注纪念卡 ---- */
A.logCard=function(){
  const marks=S.log.map((l,i)=>l.t.startsWith('——')?i:-1).filter(i=>i>=0);
  const from=marks.length>=2?marks[marks.length-2]+1:0,to=marks.length?marks[marks.length-1]:S.log.length;
  const lines=S.log.slice(from,to).filter(l=>!l.t.startsWith('——')).slice(-12);
  const W=360,H=540,c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.scale(2,2);
  g.fillStyle='#5a2e28';g.fillRect(0,0,W,H);g.fillStyle='#f6ead2';g.fillRect(12,12,W-24,H-24);
  g.fillStyle='#a87a26';for(let i=12;i<W-12;i+=8){g.fillRect(i,12,4,4);g.fillRect(i+4,H-16,4,4)}for(let i=12;i<H-12;i+=8){g.fillRect(12,i+4,4,4);g.fillRect(W-16,i,4,4)}
  const font='"Songti SC","STSong","Noto Serif CJK SC",serif';
  g.textAlign='center';g.fillStyle='#5a2e28';g.font=`700 28px ${font}`;g.fillText('起居注',W/2,62);
  g.font=`14px ${font}`;g.fillStyle='#7a5a4a';g.fillText(`${E().sur}${E().name} · ${lines[0]?.d||dateStr()}`,W/2,86);
  g.fillStyle='#5a2e28';g.fillRect(36,98,W-72,2);g.textAlign='left';g.font=`13px ${font}`;let y=126;
  for(const l of lines){if(y>H-60)break;g.fillStyle=l.b?'#9a3b33':'#3a2a22';let row='';
    for(const ch of '· '+l.t){if(g.measureText(row+ch).width>W-80){g.fillText(row,40,y);y+=19;row='  '+ch;if(y>H-60)break}else row+=ch}
    if(row&&y<=H-60){g.fillText(row,40,y);y+=24}}
  g.textAlign='center';g.fillStyle='#a08870';g.font=`11px ${font}`;g.fillText('宸宫纪 · 像素后宫',W/2,H-30);
  if(!c.toBlob){toast('当前环境不能导出图片');return}
  c.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`起居注-${dateStr()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},'image/png');
};

function viewFamily(){
  if((UI.familyMode||'graph')==='graph')return `<h2>家族关系树</h2><div class="acts"><button class="btn sm on">关系图</button><button class="btn sm" onclick="A.familyMode('list')">家族列表</button></div>${familyGraphSVG()}`;
  const byClan=new Map(),kidsByMother=new Map();
  for(const k of S.children){
    if(!kidsByMother.has(k.mom))kidsByMother.set(k.mom,[]);
    kidsByMother.get(k.mom).push(k);
  }
  for(const c of S.consorts){
    if(c.maid&&!kidsByMother.has(c.id))continue;
    const key=hasClan(c)?clanKey(c):null;
    if(!byClan.has(key))byClan.set(key,[]);
    byClan.get(key).push(c);
  }
  const childLine=k=>{
    const foster=k.foster!==k.mom&&fosterOf(k);
    return `<li><button class="btn quiet sm" onclick="A.go('kid',${k.id})">${esc(kidName(k))}</button>${foster?`<span class="hint">由${esc(fullName(foster))}抚养</span>`:''}</li>`;
  };
  const branch=(label,people,force='')=>{
    const childCount=people.reduce((sum,c)=>sum+(kidsByMother.get(c.id)?.length||0),0);
    return `<details class="family-branch"><summary><strong>${esc(label)}</strong><span class="hint">${people.length} 人 · ${childCount} 位皇嗣${force}</span></summary>
      <ul>${people.map(c=>`<li><button class="btn quiet sm" onclick="A.go('consort',${c.id})">${esc(fullName(c))}</button>${!c.alive?'<span class="hint">已故</span>':c.gone?'<span class="hint">已出宫</span>':''}
        ${kidsByMother.has(c.id)?`<ul>${kidsByMother.get(c.id).map(childLine).join('')}</ul>`:''}</li>`).join('')}</ul></details>`;
  };
  const branches=[...byClan].sort(([a],[b])=>Number(a==null)-Number(b==null)).map(([key,people])=>
    branch(key?clanName(key):'未列家族',people,key?` · 势力 ${Math.max(...people.map(c=>rd(c.fam.p)))}`:'')).join('');
  const unlisted=S.children.filter(k=>!byId(k.mom));
  return `<h2>家族关系树</h2><div class="acts"><button class="btn sm" onclick="A.familyMode('graph')">关系图</button><button class="btn sm on">家族列表</button></div><p class="hint">皇嗣列在生母名下，另标养母。点名字可查看人物。</p>
    ${branches||'<p class="hint">目前没有入宫的妃嫔。</p>'}
    ${unlisted.length?`<details class="family-branch"><summary>生母未载</summary><ul>${unlisted.map(childLine).join('')}</ul></details>`:''}`;
}
function viewHome(){
  const e=E(),h=harem(),k=kidsAlive(),heir=S.heir&&kidById(S.heir);
  const recent=S.log.filter(l=>!l.t.startsWith('——')).slice(-8).reverse();
  return `<h2>御书房</h2><div class="row">${porImg('emp',96)}<div class="grow">
   <div><b style="font-size:17px">${esc(e.sur+e.name)}</b>　年号${esc(e.era)}　${S.gen>1?`第${cnNum(S.gen)}代　`:''}${e.style}之君</div>
   <div class="stats" style="margin-top:6px">${bar('龙体',e.health,'#4f9078')}${bar('威望',e.prestige,'#a87a26')}${bar('民心',e.people,'#3b5fa8')}${bar('文才',e.wen)}${bar('武略',e.wu)}</div>
   <div style="margin-top:6px">后宫 ${h.length} 人${alive().some(c=>c.cold)?`（冷宫 ${alive().filter(c=>c.cold).length}）`:''}　皇嗣 ${k.length} 位　储君：${heir?esc(heir.name):'未立'}　${S.flags.dowager&&S.flags.dowager.alive?esc(S.flags.dowager.name)+'健在':''}</div>
   </div></div>
   <p class="hint">每月有${maxEnergy()}点精力：上朝、召幸、闲谈、探望皇嗣、出巡都要花费精力；赏赐、晋封、选秀不花精力。用完后点「结束本月」，宫中会发生新的事。侍寝后若怀上龙胎，要到下个月末太医才诊得出喜脉。每位妃嫔都有一段专属故事，情分越深越容易推进。</p>
   ${birthdayBanquetButtons()}${proudDemandNotice()}${courtBlocHTML()}<h3>近事</h3><ul class="story">${recent.map(l=>`<li class="${l.b?'big':''}"><time>${esc(l.d)}</time>${esc(l.t)}</li>`).join('')||'<li>尚无记载</li>'}</ul>`}
function viewHarem(){
  const all=alive().filter(c=>!c.maid);const g=r=>all.filter(c=>!c.cold&&r(c)).sort((a,b)=>b.rank-a.rank||b.favor-a.favor);
  const sec=(t,arr)=>arr.length?`<h3>${t}（${arr.length}）</h3><div class="grid">${arr.map(consortCard).join('')}</div>`:'';
  const dead=S.consorts.filter(c=>!c.alive||c.gone);
  return `<h2>后宫</h2><p class="hint">点击妃嫔查看详情、互动与她的故事。各位分名额：嫔6、妃4、贵妃2、皇贵妃1、皇后1。</p>${facHTML()}
   ${sec('中宫',g(c=>c.rank===8))}${sec('妃位',g(c=>c.rank>=5&&c.rank<8))}${sec('嫔位',g(c=>c.rank===4))}${sec('小主',g(c=>c.rank<4))}${sec('冷宫',all.filter(c=>c.cold))}${sec('贴身宫女',maids().filter(m=>m.near))}${sec('承恩宫女',maids().filter(m=>!m.near))}
   ${dead.length?`<h3>故人</h3><div class="hint">${dead.map(c=>`<button class="btn sm" onclick="A.go('consort',${c.id})">${esc(fullName(c))}${c.gone?'（出宫）':'（已故）'}</button>`).join(' ')}</div>`:''}`}
function detailSection(title,content){
  return content?`<section class="detail-section"><h3>${title}</h3><div class="detail-content">${content}</div></section>`:'';
}
function detailFold(title,content){
  return content?`<details class="detail-fold"><summary>${title}</summary><div class="detail-content">${content}</div></details>`:'';
}
function detailStory(person){
  const entries=person.story.slice().reverse().map(s=>`<li><time>${esc(s.d)}</time>${esc(s.t)}</li>`);
  if(!entries.length)return '<p class="hint">尚无记载。</p>';
  const list=items=>`<ul class="story">${items.join('')}</ul>`;
  return list(entries.slice(0,2))+(entries.length>2?detailFold(`更早的记录（${entries.length-2}条）`,list(entries.slice(2))):'');
}
function viewConsort(){
  const c=byId(UI.sel);if(!c)return viewHarem();
  const act=c.alive&&!c.gone;
  const kids=S.children.filter(k=>k.mom===c.id);
  const st=(l,v,hid)=>hid?`<div class="bar"><span>${l}</span><i></i><em>??</em></div>`:bar(l,v,'#8e6f57');
  let acts='', management='', penalties='';
  if(act&&c.maid){
    acts+=`<button class="btn" onclick="A.night(${c.id})" ${c.preg?'disabled':''}>召幸<small>${c.preg?'有孕在身':'精力-1'}</small></button>`;
    acts+=`<button class="btn primary" onclick="A.chat(${c.id})">闲话家常<small>精力-1</small></button>`;
    acts+=`<button class="btn jade" onclick="A.gift(${c.id})">赏赐<small>国库-20</small></button>`;
    management+=`<button class="btn" onclick="A.raiseMaid(${c.id},1)">册封为答应</button><button class="btn" onclick="A.raiseMaid(${c.id},0)">册封为官女子</button><button class="btn" onclick="A.maidNear(${c.id})">${c.near?'遣回尚衣局':'调到身边'}</button>`;
    penalties+=`<button class="btn danger" onclick="A.maidOut(${c.id})">放出宫</button>`;
  } else if(act&&!c.cold){
    acts+=`<button class="btn" onclick="A.night(${c.id})" ${c.preg?'disabled':''}>召幸侍寝<small>${c.preg?'有孕在身':'精力-1'}</small></button>`;
    acts+=`<button class="btn primary" onclick="A.chat(${c.id})">闲话家常<small>精力-1</small></button>`;
    acts+=`<button class="btn jade" onclick="A.gift(${c.id})">赏赐<small>国库-20</small></button>`;
    if(!c.visitor&&S.turn-(c.lastVisit??-99)>=24)management+=`<button class="btn" onclick="A.momIn(${c.id})">接母亲入宫<small>国库-15</small></button>`;
    if(c.rank<7)management+=`<button class="btn" onclick="A.promote(${c.id})">晋封<small>→${RANKS[c.rank+1]}</small></button>`;
    if(c.rank>0&&c.rank<8)penalties+=`<button class="btn danger" onclick="A.demote(${c.id})">降位</button>`;
    if(c.rank>=4)management+=`<button class="btn" onclick="A.rename(${c.id})">改封号</button>`;
    if(c.rank>=5&&c.rank<8&&!empress())management+=`<button class="btn" onclick="A.crown(${c.id})">册立皇后</button>`;
    penalties+=`<button class="btn danger" onclick="A.cold(${c.id})">${c.rank===8?'废后':'打入冷宫'}</button><button class="btn danger" onclick="A.away(${c.id})">遣出宫</button>`;
  } else if(act&&c.cold){
    acts+=`<button class="btn primary" onclick="A.uncold(${c.id})">放出冷宫</button>`;
    penalties+=`<button class="btn danger" onclick="A.away(${c.id})">遣出宫</button>`;
  }
  const family=act?visitorLine(c)+fosterLine(c)+clanLine(c)+houseLine(c)+conKidLine(c)+relLine(c):'';
  return `<button class="btn quiet sm detail-back" onclick="A.go('harem')">← 返回后宫</button>
   <header class="detail-head">${porImg(c,128)}<div class="grow">
    <p>${esc(fullName(c))} · ${c.age}岁 · ${c.alive?c.gone?'已出宫':esc(c.palace):'已故'}</p>
    <h2>${esc(cName(c))}</h2>
    <p>${esc(c.fam.t)} · ${esc(c.trait)}${c.preg>=2?` <span class="tag r">有孕${c.preg}月</span>`:''}</p>
    ${PORTRAIT_CLOTHES[portraitCell(c)]?`<p>衣着 · ${PORTRAIT_CLOTHES[portraitCell(c)]}</p>`:''}
   </div></header>
   ${acts?`<div class="detail-actions" role="group" aria-label="人物操作"><span class="detail-action-label" aria-hidden="true">人物操作</span><div class="acts">${acts}</div></div>`:''}
   <div class="detail-vitals">${bar('恩宠',c.favor)}${bar('心情',c.mood,'#517369')}${bar('情分',c.aff,'#936375')}</div>
   <div class="detail-stack">
    ${act&&!c.cold?initiativeHTML(c):''}
    ${act&&c.rank===8?birthdayBanquetButtons():''}
    <div class="detail-columns">
     ${detailSection('近况与性情',`<p class="hint">${esc(TRAITS[c.trait].d)} · 侍寝 ${c.nights} 次</p>${act?xinDetail(c)+deepLine(c):''}<div class="stats">${st('容貌',c.looks)}${st('才情',c.talent)}${st('德行',c.virtue)}${st('心机',c.scheme,!c.known)}</div>`)}
     ${detailSection('家族与人际',`${kids.length?`<div>子女：${kids.map(k=>`<button class="btn quiet sm" onclick="A.go('kid',${k.id})">${esc(k.name)}</button>`).join(' ')}</div>`:''}${family}`)}
    </div>
    ${act?detailSection('与孩子的日常',consortFamilyPanel(c)):''}
    ${detailSection('册封与宫务',management?`<div class="acts">${management}</div>`:'')}
    ${detailSection('她的故事',arcLine(c)+detailStory(c))}
    ${detailFold('处置',penalties?`<div class="acts">${penalties}</div>`:'')}
   </div>`;
}
function viewCards(){
  const h=harem().sort((a,b)=>b.rank-a.rank||b.favor-a.favor).concat(maids().filter(m=>m.near));
  return `<h2>敬事房 · 翻牌子</h2><p class="hint">敬事房呈上绿头牌。翻谁的牌子，今夜便召谁侍寝（精力-1）。本月已侍寝 ${E().nightsMonth||0} 次，一月超过三次有损龙体。</p>
   ${h.length?`<div class="pais">${h.map(c=>`<button class="pai" ${c.preg?'disabled':''} onclick="A.night(${c.id})"><strong>${esc(cName(c))}</strong><small>${c.preg?'有孕':'恩宠 '+rd(c.favor)}</small></button>`).join('')}</div>`:'<p class="hint">后宫空虚，先去选秀吧。</p>'}`;
}
function viewXX(){
  const since=S.turn-S.flags.lastXX;
  if(!S.cands.length) return `<h2>选秀</h2><p>距上次选秀：${S.flags.lastXX<0?'从未':`${Math.floor(since/12)}年${since%12}月`}。三年一度大选可在二月自动举行；也可随时下旨，但未满三年会耗费国库、有损民心。</p>
    <div class="acts"><button class="btn gold" onclick="A.xxDecree()">下旨选秀</button></div>`;
  return `<h2>储秀宫·选秀<button class="btn sm" onclick="A.xxEnd()">结束选秀</button></h2>
   <p class="hint">容貌、才情一望便知；德行、心机需要暗访（剩余 ${S.flags.peek} 次）。本月结束时未选的秀女会遣返回家。</p>
   <div class="grid">${S.cands.map(c=>`<div class="card" style="cursor:default;flex-direction:column">
     <div class="row" style="gap:8px">${porImg(c,64)}<div class="grow"><div class="nm">${esc(fullName(c))}</div><div>${c.age}岁 · ${esc(c.fam.t)}之女</div>${c.kinNote?`<div><span class="tag y">${esc(c.kinNote)}</span></div>`:''}<div><span class="tag">${c.trait}</span></div></div></div>
     ${bar('容貌',c.looks,'#8e6f57')}${bar('才情',c.talent,'#8e6f57')}${c.known?bar('德行',c.virtue,'#8e6f57')+bar('心机',c.scheme,'#8e6f57'):'<div class="bar"><span>德行</span><i></i><em>??</em></div><div class="bar"><span>心机</span><i></i><em>??</em></div>'}
     <div class="acts" style="margin:4px 0 0"><button class="btn sm gold" onclick="A.xxTake(${c.id})">留牌子</button><button class="btn sm" onclick="A.xxDrop(${c.id})">撂牌子</button>${c.known?'':`<button class="btn sm jade" onclick="A.xxPeek(${c.id})">暗访</button>`}</div></div>`).join('')}</div>`}
function viewKids(){
  const ks=S.children;
  return `<h2>皇嗣</h2>${ks.length?`<div class="grid">${ks.map(k=>`<button class="card" onclick="A.go('kid',${k.id})">${porImg(k,56)}<div class="grow"><div class="nm">${esc(kidName(k))}</div><div>${k.alive?kidAge(k)+'岁':k.lost?'下落不明':'已夭折'} · 生母${esc(k.momName)}${fosterOf(k)?` · 养母${esc(fullName(fosterOf(k)))}`:''}</div>${bar('才学',k.lit,'#3b5fa8')}${bar('武艺',k.mar,'#a3262a')}${bar('品德',k.vir,'#4f9078')}</div></button>`).join('')}</div>`:'<p class="hint">膝下尚无子嗣。多召幸妃嫔，或去护国寺祈福。</p>'}`}
function viewKid(){
  const k=kidById(UI.sel);if(!k)return viewKids();const a=kidAge(k);
  const pol=['均衡','读书','习武','修德','放养'];
  const foster=fosterOf(k),mom=byId(k.mom);
  const status=[k.alive?`${a}岁`:k.lost?'下落不明':'已夭折',k.married?'已婚嫁':'',k.away?'已就藩':'',k.jailed?'圈禁于宗人府':''].filter(Boolean).join(' · ');
  const care=k.alive?`<div class="hint">当前方针：${esc(k.policy)} · 三岁起生效</div><div class="acts">
    ${pol.map(p=>`<button class="btn sm ${k.policy===p?'on':''}" aria-pressed="${k.policy===p}" onclick="A.kidPolicy(${k.id},'${p}')">${p}</button>`).join('')}</div>
    <div class="acts">${a>=6?`<button class="btn ${k.tutor?'on':''}" onclick="A.kidTutor(${k.id})">${k.tutor?'已延请太傅':'延请太傅'}<small>每月5万两</small></button>`:''}
    ${a<14?`<button class="btn" onclick="A.foster(${k.id})">${foster?'换一位养母':'交给妃嫔抚养'}</button>`:''}
    ${foster&&mom?.alive?`<button class="btn" onclick="A.unfoster(${k.id})">抱回生母身边</button>`:''}</div>`:'';
  const titles=k.alive?`${k.sex==='m'&&a>=5&&S.heir!==k.id?`<button class="btn" onclick="A.kidHeir(${k.id})">立为太子</button>`:''}
    ${a>=12?`<button class="btn" onclick="A.kidTitle(${k.id})">赐封号</button>`:''}`.trim():'';
  return `<button class="btn quiet sm detail-back" onclick="A.go('kids')">← 返回皇嗣</button>
   <header class="detail-head">${porImg(k,112)}<div class="grow"><p>${status}</p><h2>${esc(kidName(k))}</h2>
    <p>生母 ${esc(k.momName)}${foster?` · 养母 ${esc(cName(foster))}`:''}</p></div></header>
   ${k.alive?`<div class="detail-actions" role="group" aria-label="人物操作"><span class="detail-action-label" aria-hidden="true">人物操作</span><div class="acts"><button class="btn primary" onclick="A.kidVisit(${k.id})">探望<small>精力-1</small></button></div></div>`:''}
   <div class="detail-vitals">${bar('才学',k.lit,'#617991')}${bar('武艺',k.mar,'#92504a')}${bar('品德',k.vir,'#517369')}</div>
   <div class="detail-stack">
    ${k.alive?initiativeHTML(k):''}
    ${k.alive?detailSection('与母亲的日常',kidFamilyPanel(k)):''}
    ${detailSection('教养与抚养',care)}
    <div class="detail-columns">
     ${detailSection('其他属性',`<div class="stats">${bar('体魄',k.hp,'#a87a26')}${bar('野心',k.amb,'#6b4a33')}${bar('父爱',k.love,'#936375')}${k.sex==='m'&&a>=10?bar('支持',k.sup||0,'#617991'):''}</div>`)}
     ${detailSection('宫中关系',k.alive?kidRelLine(k):'')}
    </div>
    ${detailSection('封号与储位',titles?`<div class="acts">${titles}</div>`:'')}
    ${detailSection('成长记',detailStory(k))}
   </div>`;
}
function viewOut(){
  const o=[['garden','御花园','偶遇妃嫔、宫女，或独自散心'],['city','微服出宫','体察民情，也许会遇见有缘人'],['hunt','南苑围猎','武略越高越易成功，有受伤风险'],['temple','护国寺祈福','民心、龙体小增，本月更易得子'],['spa','温泉行宫','休养龙体（国库-50万两）']];
  return `<h2>出巡</h2><p class="hint">每次出巡花费1点精力。</p><div class="grid">${o.map(([k,n,d])=>`<button class="card" onclick="A.out('${k}')"><div class="grow"><div class="nm">${n}</div><div>${d}</div></div></button>`).join('')}</div>`}
function viewLog(){
  const L=S.log.filter(l=>UI.logF==='all'?true:l.b).slice().reverse();
  return `<h2>起居注</h2><div class="log-filter"><button class="btn sm ${UI.logF==='all'?'on':''}" onclick="UI.logF='all';render()">全部</button><button class="btn sm ${UI.logF==='big'?'on':''}" onclick="UI.logF='big';render()">只看大事</button><button class="btn sm" onclick="A.logCard()">保存上月纪念卡</button></div>
   ${S.history.length?`<p class="hint">历代：${S.history.map(h=>esc(`${h.shi?h.miao+h.shi+'皇帝':h.miao} ${h.sur}${h.name}（${h.era}，在位${h.yrs}年）`)).join('；')}</p>`:''}
   <ul class="story" style="max-height:560px">${L.map(l=>`<li class="${l.b?'big':''}"><time>${esc(l.d)}</time>${esc(l.t)}</li>`).join('')}</ul>`}
function viewSys(){
  return `<h2>存档</h2><p class="hint">存档保存在本浏览器中；每月结束时会自动存档。</p>
   ${['1','2','3'].map(s=>`<div class="acts" style="align-items:center"><b>存档${s}</b><span class="hint grow">${esc(slotInfo(s)||'空')}</span><button class="btn sm gold" onclick="A.save('${s}')">保存</button><button class="btn sm" onclick="A.load('${s}')">读取</button></div>`).join('')}
   <div class="acts" style="align-items:center"><b>自动</b><span class="hint grow">${esc(slotInfo('auto')||'空')}</span><button class="btn sm" onclick="A.load('auto')">读取</button></div>
   <h3>存档码</h3><p class="hint">导出后复制这串字，可以换浏览器继续玩，也可以发给别人看你的进度。</p><textarea id="savecode" class="inp" aria-label="存档码"></textarea><div class="acts"><button class="btn sm gold" onclick="A.exportSave()">导出存档码</button><button class="btn sm" onclick="A.importSave()">导入存档码</button></div>
   ${rewindHTML()}
   <h3>其他</h3><div class="acts"><button class="btn sm" onclick="S=null;UI.view='title';render()">返回标题</button></div>`}
function rewindHTML(){
  const snaps=SaveManager.snapshots(localStorage,SKEY+'auto').sort((a,b)=>b.day-a.day);
  if(!snaps.length)return '';
  return `<h3>岁首快照</h3><p class="hint">每年正月自动留一份，最多四份。回到那年岁首，之后的事会重新发生。</p>${snaps.map(s=>`<div class="acts" style="align-items:center"><span class="grow">${esc(s.date||'')}</span><button class="btn sm" onclick="A.rewind(${s.index})">回到这里</button></div>`).join('')}`;
}
