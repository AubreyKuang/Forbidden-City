// The Xiaohongshu edition opens one story consort and one fenghua person, and ends the
// trial after the third emperor. The web and TapTap builds keep every character and reign.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../scripts/xhs-edition.json'),'utf8'));
const XHS={PALACE_EDITION_CONFIG:config};

const STORY_NAMES={qingyi:'沈清漪',luwan:'陆绾',ayimu:'阿依慕',chuwan:'方晚',suheng:'苏蘅',xiaoman:'岑小满',gouyi:'赵令仪',hongjian:'薛红笺'};
const FENGHUA_NAMES={shangguanLantai:'上官兰台',gaoHuaibi:'高怀璧',jiShuye:'嵇叔夜',xueHongjian:'薛红笺',sunYunxiu:'孙云岫',liuZhaoshuang:'柳照霜',linJianxi:'林见溪',heXingjian:'贺行简',xiean:'谢安'};
const lockedStory=Object.keys(STORY_NAMES).filter(k=>!config.allow.story.includes(k));
const lockedFenghua=Object.keys(FENGHUA_NAMES).filter(k=>!config.allow.fenghua.includes(k));
const lockedNames=[...new Set([...lockedStory.map(k=>STORY_NAMES[k]),...lockedFenghua.map(k=>FENGHUA_NAMES[k])])];

test('the edition config opens exactly one story consort and one fenghua person and caps three reigns',()=>{
  assert.equal(config.edition,'xhs');
  assert.deepEqual(config.allow.story,['ayimu']);
  assert.deepEqual(config.allow.fenghua,['shangguanLantai']);
  assert.equal(config.maxGenerations,3);
  assert.equal(config.features.saveExport,false);assert.equal(config.features.browserStorage,false);
  assert.equal(config.features.saveBackups,false);assert.equal(config.saveSnapshots,1);
});

// Everything in the save that could hold one of the authored characters.
const PRESENT=`(function(){
  var out={story:[],fenghua:[]};
  var people=[].concat(S.consorts||[],S.retainedFamilies||[],(S.previousCourts||[]).flatMap(function(c){return c.consorts||[];}));
  people.forEach(function(c){if(c.fixedStory)out.story.push(c.fixedStory);if(c.gouyi)out.story.push('gouyi');if(c.hongjian)out.story.push('hongjian');});
  Object.keys((S.flags.storyCast&&S.flags.storyCast.people)||{}).forEach(function(k){out.story.push(k);});
  if(S.flags.gouyiSeen)out.story.push('gouyi');
  ((S.fenghua&&S.fenghua.people)||[]).forEach(function(p){out.fenghua.push(p.fenghuaKey);});
  Object.keys((S.fenghua&&S.fenghua.admitted)||{}).forEach(function(k){out.fenghua.push(k);});
  (S.scholars||[]).forEach(function(p){if(p.fenghuaKey)out.fenghua.push(p.fenghuaKey);if(p.storyPerson==='xiean')out.fenghua.push('xiean');});
  if(S.flags.xieStoryId!=null)out.fenghua.push('xiean');
  return JSON.stringify(out);})()`;
const pages=['map','home','government','harem','xx','kids','family','out','log','sys'];
function play(seed,months){
  const b=boot(seed,new Map(),XHS),seen={story:new Set(),fenghua:new Set()},leaks=[],generated=new Set();
  b.run(`var rng=${seed};drain=function(){for(var n=0;modalOpen&&n<150;n++){if(modalResult){nextEv();continue;}var opts=curEv.choices.map(function(c,i){return {c:c,i:i};}).filter(function(x){return (!x.c.cond||x.c.cond())&&!/重新开局|新开一局/.test(x.c.t);});if(!opts.length)opts=curEv.choices.map(function(c,i){return {c:c,i:i};});rng=(Math.imul(rng,1664525)+1013904223)>>>0;var o=opts[rng%opts.length];if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(o.i);}};
    var shown=[];var openModal0=openModal;openModal=function(ev){shown.push((ev.title||'')+'\\n'+(ev.text||'')+'\\n'+(ev.choices||[]).map(function(c){return c.t;}).join('|'));return openModal0(ev);};`);
  b.run(`A.start();drain();for(const id of S.cands.slice(0,3).map(c=>c.id)){A.xxTake(id);drain();}A.xxEnd();drain();`);
  const scan=label=>{
    const present=JSON.parse(b.run(PRESENT));
    present.story.forEach(k=>seen.story.add(k));present.fenghua.forEach(k=>seen.fenghua.add(k));
    // Generated people (and their kin) may carry names that contain a locked name, e.g. 谢安之.
    for(const name of JSON.parse(b.run(`(function(){var out={};(function walk(v,d){if(!v||typeof v!=='object'||d>12)return;if(Array.isArray(v)){v.forEach(function(x){walk(x,d+1);});return;}if(typeof v.name==='string'&&v.name.length<8)out[v.name]=1;if(typeof v.sur==='string'&&typeof v.given==='string')out[v.sur+v.given]=1;for(var k in v)walk(v[k],d+1);})(S,0);return JSON.stringify(Object.keys(out));})()`)))generated.add(name);
    const ordered=[...generated].filter(n=>!lockedNames.includes(n)).sort((a,b)=>b.length-a.length);
    const texts=[b.run(`$('#panel').innerHTML`),b.run(`$('#mbox').innerHTML`),...JSON.parse(b.run(`JSON.stringify(shown.splice(0))`))];
    for(const raw of texts){
      // Codex cards for locked people show their names with 敬请期待 only.
      let text=String(raw).replace(/<article class="story-consort-card edition-locked"[\s\S]*?<\/article>/g,'');
      for(const name of ordered)if(name.length>2||lockedNames.some(l=>name.includes(l)))text=text.split(name).join('〇');
      for(const name of lockedNames)if(text.includes(name))leaks.push(`${label}: ${name} :: ${text.slice(Math.max(0,text.indexOf(name)-60),text.indexOf(name)+40).replace(/\s+/g,' ')}`);
    }
  };
  for(let m=0;m<months&&!b.run('S.over');m++){
    b.run(`E().energy=8;E().treasury=Math.max(E().treasury,400);`);
    const tries=[`A.out('city')`,`A.out('procession')`,`A.out('garden')`,
      ...Object.keys(STORY_NAMES).map(k=>`A.storyCastVisit('${k}')`),...Object.keys(STORY_NAMES).map(k=>`A.storyPetition('${k}')`),
      ...Object.keys(FENGHUA_NAMES).map(k=>`A.fenghuaMeet('${k}')`),`A.hongjianInvite()`,
      ...['garden','newyear','midautumn','birthday','family'].map(kind=>`A.openBanquet('${kind}');for(const k of Object.keys(FEAST_ARTISTS))A.banquetArtist(k);A.holdBanquet();UI.banquet=null`)];
    for(const t of tries){try{b.run(`if(!modalOpen&&!S.over){${t};}drain();`);}catch{/* an action may not fit this month */}scan(t);}
    for(const p of pages){try{b.run(`A.go('${p}');drain()`);}catch{}scan('page '+p);}
    for(const tab of ['story-consorts','notable-people']){try{b.run(`UI.homeSection='${tab}';A.go('home');drain()`);}catch{}scan('codex '+tab);}
    try{b.run(`A.endMonth();drain()`);}catch(e){leaks.push('stalled: '+e.message);break;}
    scan('month '+m);
  }
  return {b,seen,leaks};
}

const met={story:new Set(),fenghua:new Set()};
for(const seed of [11,202,3907,58111])test(`seed ${seed}: locked characters never appear in play, events, pages or the save`,()=>{
  const {seen,leaks}=play(seed,60);
  seen.story.forEach(k=>met.story.add(k));seen.fenghua.forEach(k=>met.fenghua.add(k));
  assert.deepEqual([...seen.story].filter(k=>lockedStory.includes(k)),[]);
  assert.deepEqual([...seen.fenghua].filter(k=>lockedFenghua.includes(k)),[]);
  assert.deepEqual([...new Set(leaks)].slice(0,10),[]);
});

test('across those seeds the open characters were reachable, so the gate is not closing everything',()=>{
  assert.ok(met.story.has('ayimu'),'阿依慕 can be met');
  assert.ok(met.fenghua.has('shangguanLantai'),'上官兰台 can be met');
});

test('the codex lists locked people as 敬请期待 without portraits or any paid wording',()=>{
  const b=boot(7,new Map(),XHS);
  b.run(`A.start();drain();`);
  const html=b.run(`storyConsortCodex()+fenghuaCodex()`);
  const cards=html.match(/<article class="story-consort-card edition-locked"[\s\S]*?<\/article>/g)||[];
  assert.equal(cards.length,lockedStory.length+lockedFenghua.length-1,'xueHongjian is listed once, as hongjian');
  for(const card of cards){assert.match(card,/敬请期待/);assert.doesNotMatch(card,/<img|<svg|<image|story-cast\//);}
  assert.doesNotMatch(html,/付费|解锁购买|充值/);
  assert.match(html,/data-story-consort="ayimu"/);assert.match(html,/data-fenghua="shangguanLantai"/);
});

function reignOnce(b){
  b.run(`var heirKid=makeKid(harem()[0]||empress(),'m','承'+S.gen);heirKid.born=S.turn-240;S.heir=heirKid.id;E().health=0;checkEnd();drain();`);
}
test('the third emperor is the last: no fourth reign, a three-reign summary and 完整版敬请期待',()=>{
  const b=boot(31,new Map(),XHS);
  b.run(`var titles=[],texts=[];var om=openModal;openModal=function(ev){titles.push(ev.title);texts.push(ev.text||'');return om(ev);};drain=function(){for(var n=0;modalOpen&&n<60;n++){if(modalResult){nextEv();continue;}if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(curEv.choices.findIndex(function(c){return !c.cond||c.cond();}));}};`);
  b.run(`A.start();drain();`);
  assert.equal(b.run('S.gen'),1,'the first emperor is generation 1');
  reignOnce(b);assert.equal(b.run('S.gen'),2);assert.equal(b.run('S.over'),false);
  for(let i=0;i<5;i++)b.run(`A.endMonth();drain();`);
  reignOnce(b);assert.equal(b.run('S.gen'),3);assert.equal(b.run('S.over'),false);
  for(let i=0;i<5;i++)b.run(`A.endMonth();drain();`);
  reignOnce(b);
  assert.equal(b.run('S.gen'),3,'no fourth emperor');
  assert.equal(b.run('S.over'),true);
  const titles=b.run('JSON.stringify(titles)'),texts=JSON.parse(b.run('JSON.stringify(texts)'));
  assert.match(titles,/试玩到此为止/);
  const summary=texts[JSON.parse(titles).lastIndexOf('试玩到此为止')];
  assert.match(summary,/3朝本纪至此合卷/);assert.match(summary,/第一代[\s\S]*第二代[\s\S]*第三代/);assert.match(summary,/完整版敬请期待/);
  assert.doesNotMatch(titles+summary,/付费|购买|充值/);
  assert.equal(b.run('S.history.length'),3);
  // The death notice no longer offers the throne; the trial end leads to the chronicle or a new game.
  assert.doesNotMatch(b.run(`JSON.stringify(deathEvent('驾崩').choices.map(c=>c.t))`),/传位于/);
  b.run(`succeed(heirKid);drain();`);assert.equal(b.run('S.gen'),3,'succeed() itself refuses a fourth reign');
  b.run(`A.newGame();`);assert.equal(b.run('S===null||!!S'),true);
});

test('abdication at the third reign also ends the trial',()=>{
  const b=boot(32,new Map(),XHS);
  b.run(`drain=function(){for(var n=0;modalOpen&&n<60;n++){if(modalResult){nextEv();continue;}if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(curEv.choices.findIndex(function(c){return !c.cond||c.cond();}));}};A.start();drain();`);
  reignOnce(b);reignOnce(b);assert.equal(b.run('S.gen'),3);
  b.run(`var k=makeKid(harem()[0]||empress(),'m','禅');k.born=S.turn-240;pushNow(abdicateEvent(k));`);
  assert.equal(b.run(`curEv.choices[0].t`),'试玩到此为止 · 查看三朝本纪');
  b.run(`choose(0);if(modalResult)nextEv();`);
  assert.equal(b.run('curEv&&curEv.title'),'试玩到此为止');
  assert.equal(b.run('S.gen'),3);
});

test('without an edition config the fourth reign still begins (web and TapTap)',()=>{
  const b=boot(31);
  b.run(`drain=function(){for(var n=0;modalOpen&&n<60;n++){if(modalResult){nextEv();continue;}if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(curEv.choices.findIndex(function(c){return !c.cond||c.cond();}));}};A.start();drain();`);
  for(let i=0;i<3;i++)reignOnce(b);
  assert.equal(b.run('S.gen'),4);
  assert.equal(b.run(`editionAllows('story','qingyi')&&editionAllows('fenghua','xiean')`),true);
});
