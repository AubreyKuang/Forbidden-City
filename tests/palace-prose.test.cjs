const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;return b;}
const legacy=`PalaceActions.reset();var real=journalContentVersion;journalContentVersion=()=>168;`,restore=`journalContentVersion=real;`;

test('every month has three almanac lines and the choice never draws from the game\'s random numbers',()=>{
 const b=setup();b.run(`assert.equal(PROSE_ALMANAC.length,12);
  for(var m=1;m<=12;m++){assert.equal(PROSE_ALMANAC[m-1].length,3);for(var o of PROSE_ALMANAC[m-1]){assert.ok(o[0].length>=12&&o[0].length<=60,o[0]);assert.equal(typeof o[1],'string');}}
  var calls=0,random=PalaceActions.random;PalaceActions.random=()=>{calls++;return random();};
  S.month=8;S.year=6;var first=proseAlmanac(),again=proseAlmanac();assert.deepEqual(first,again);assert.ok(PROSE_ALMANAC[7].some(o=>o[0]===first.line));
  S.year=7;assert.notEqual(proseAlmanac().line,first.line);
  assert.match(proseAlmanacHTML(),/class="map-almanac"/);assert.match(viewMap(),/class="map-almanac"/);
  assert.equal(calls,0);PalaceActions.random=random;`);
});

test('epigraphs follow the event title, yield to a cited historical source, and are escaped into the modal',()=>{
 const b=setup();b.run(`assert.deepEqual(proseEpigraph({title:'雷雨夜'}),{line:'何当共剪西窗烛，却话巴山夜雨时。',source:'李商隐《夜雨寄北》'});
  assert.equal(proseEpigraph({title:'后宫丧讯 · 沈氏'}).source,'元稹《遣悲怀》');
  assert.equal(proseEpigraph({title:'雷雨夜',ref:'《史记》'}),null);assert.equal(proseEpigraph({title:'没有题记的事'}),null);
  for(var key of Object.keys(PROSE_EPIGRAPHS)){var e=PROSE_EPIGRAPHS[key];assert.equal(e.length,2,key);assert.ok(e[0]&&e[1],key);}
  pushEv({title:'七夕',text:'夜色如水。',choices:[{t:'知道了'}]});
  assert.match($('#mbox').innerHTML,/<p class="epigraph">两情若是久长时，又岂在朝朝暮暮。<cite>秦观《鹊桥仙》<\\/cite><\\/p>/);choose(0);`);
});

test('traits carry a verdict line, places a seasonal scene, and the opening screens use the new copy',()=>{
 const b=setup();b.run(`for(var t of Object.keys(TRAITS))assert.ok(proseVerdict(t),t);
  UI.sel=c.id;assert.match(viewConsort(),/<p class="verdict">温其如玉。/);
  for(var id of Object.keys(PROSE_SCENES))assert.equal(PROSE_SCENES[id].length,4,id);
  S.month=1;assert.equal(proseScene('yh'),PROSE_SCENES.yh[0]);S.month=11;assert.equal(proseScene('yh'),PROSE_SCENES.yh[3]);
  for(var id of Object.keys(DYNASTY_SCENARIOS))assert.ok(PROSE_SCENARIOS[id],id);
  for(var k of Object.keys(STYLES))assert.ok(PROSE_STYLES[k].endsWith(STYLES[k].slice(STYLES[k].indexOf('。')+1)),k);
  assert.match(viewTitle(),/从此落笔都是史/);`);
});

test('a decision without its own account gets a varied line that is the same on every replay',()=>{
 const b=setup();b.run(`var ev={title:'盐政',scene:'monthly-court'},plain={title:'闲事'};
  var a=narrativeResult(fx('威望+1'),ev,{}),again=narrativeResult(fx('威望+1'),ev,{});assert.equal(a,again);
  assert.ok(PROSE_OUTCOMES.court.some(f=>a.startsWith(f('盐政'))));assert.match(a,/§威望\\+1/);
  assert.ok(PROSE_OUTCOMES.plain.includes(narrativeResult('',plain,{})));
  assert.equal(narrativeResult('',plain,{outcome:'她收下了。'}),'她收下了。');
  var seen=new Set();for(var turn=0;turn<12;turn++){S.turn=turn;seen.add(narrativeResult('',plain,{}));}assert.equal(seen.size,3);`);
});

test('scenes left unfinished by an older version replay with the old wording',()=>{
 const b=setup();b.run(`${legacy}
  assert.equal(proseActive(),false);assert.equal(pz('旧','新'),'旧');
  assert.equal(proseAlmanac(),null);assert.equal(proseAlmanacHTML(),'');assert.equal(proseEpigraph({title:'雷雨夜'}),null);assert.equal(proseVerdict('温婉'),'');assert.equal(proseScene('yh'),'');
  assert.equal(narrativeResult('',{title:'闲事'},{}),'你拿定主意，身边的人听了吩咐，各去料理。');
  assert.equal(narrativeResult('',{title:'盐政',scene:'monthly-court'},{}),'内侍收起「盐政」的折子，将你的批复交值班官员传下去。');
  S.month=7;assert.equal(festival().text,'七月初七，鹊桥相会。宫中女子都在穿针乞巧。');
  assert.equal(festival().choices.at(-1).f(),'你独自站了很久。');
  ${restore}
  assert.equal(proseActive(),true);assert.match(festival().text,/银汉迢迢/);assert.match(festival().choices.at(-1).f(),/月色倒是谁都有一份/);`);
});

test('a natural death adds the vigil and a historian\'s verdict while the chronicle line stays the plain record',()=>{
 const b=setup();b.run(`E().prestige=90;E().people=90;E().health=0;var ev=deathEvent('驾崩'),lines=ev.text.split('\\n');
  assert.match(lines[0],/崩于养心殿，享年\\d+岁，在位\\d+年。$/);assert.match(lines[1],/朱笔搁在砚边/);
  assert.ok(ev.text.includes('谥曰「圣皇帝」'));assert.match(ev.text,/史臣曰：其兴也，非一日之功。/);
  assert.match(S.log.at(-1).t,/在位\\d+年。庙号/);assert.doesNotMatch(S.log.at(-1).t,/朱笔/);`);
 const old=setup();old.run(`${legacy}E().health=0;var ev=deathEvent('驾崩');assert.doesNotMatch(ev.text,/史臣曰|朱笔/);${restore}`);
});
