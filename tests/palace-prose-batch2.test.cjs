const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');

/* Content version 173 reworded existing lines. Each site below is run twice from the same seed:
   once as an unfinished scene left by version 172, once at the current version. `expr` returns
   {text, old, neu}: the text the game produced and the sentence expected under each wording. */
const PREP=`var haremScene=name=>HAREM.find(f=>f.name===name)();
 var third=makeGirl({sur:'林',given:'晚照',age:20,trait:'沉静',fam:{t:'知府',p:38}});addConsort(third,2,'入宫');third.solitary=null;
 var fourth=makeGirl({sur:'顾',given:'棠音',age:19,trait:'好学',fam:{t:'县令',p:20}});addConsort(fourth,1,'入宫');fourth.solitary=null;
 var fifth=makeGirl({sur:'许',given:'念安',age:19,trait:'巧手',fam:{t:'寒门',p:5}});addConsort(fifth,1,'入宫');fifth.solitary=null;
 S.rel={};for(var p of harem()){p.favor=10;p.scheme=20;p.mood=60;p.aff=40;}c.favor=80;other.favor=50;other.scheme=80;c.lastPersonalAttention=S.turn;`;
const FACTIONS=`relAdd(third,c,60);relAdd(fourth,other,60);`;
const SITES=[
 ['心愿 · 江南','',`({text:WISHES.south.f(c),old:'烟雨江南，画舫笙歌。她靠在船舷上说，这辈子值了。',neu:'船入江南，雨丝斜进舱来。她伸手接了一掌：“从前只在画上见过。”'})`],
 ['心愿 · 烟火','',`({text:WISHES.fire.f(c),old:'火树银花不夜天。她仰着头，烟火映在她眼睛里。',neu:'烟火升过角楼，东风里开了千树。她仰着头，明明灭灭都落在眼睛里。'})`],
 ['心愿 · 母亲','',`({text:WISHES.mother.f(c),old:'她母亲进宫来了，要在宫里住上几个月。母女俩一见面就抱头哭了。',neu:'她母亲进宫来了，要在宫里住上几个月。人还没跨过门槛，她已迎了出去，攥住母亲的手半天不肯松。'})`],
 ['雷雨夜','S.month=6;',`({text:QEV.怕雷(c).text,old:'半夜电闪雷鸣，'+c.palace+'的宫女冒雨跑来乾清宫：“我们小主吓得缩在床角，谁也不让碰。”',neu:'三更一声炸雷，窗纸都亮了。'+c.palace+'的宫女冒雨跑来乾清宫：“我们小主吓得缩在床角，谁也不让碰。”'})`],
 ['对弈 · 和局','other.talent=80;third.talent=10;fourth.talent=10;fifth.talent=10;',`({text:QEV.好胜(c).choices[1].f(),old:'两人对视一眼，都笑了。',neu:'两人同时伸手去收子，都笑了。'})`],
 ['绿腰','',`({text:QEV.擅舞(c).text,old:'宫宴上，'+cName(c)+'一曲《绿腰》，满座皆惊。有老臣低声说：“颇有汉时赵飞燕之风。”',neu:'宫宴上，'+cName(c)+'舞了一曲《绿腰》。曲终袖落，满座的酒盏还停在半空。有老臣低声说：“颇有汉时赵飞燕之风。”'})`],
 ['读史','',`({text:QEV.好读史(c).choices[0].f(),old:'她沉默了很久，没有再说话。',neu:'她的手还按在书封上，很久没有再说话。'})`],
 ['称病','',`({text:XEV.怨恨(c,{who:'emp'}).choices[0].f(),old:'她开门看见是你，愣了很久，眼泪一下子掉了下来。',neu:'她开门看见是你，扶着门框愣了很久，眼泪落在手背上才觉出来。'})`,[0]],
 ['青灯','',`({text:XEV.心如死灰(c,{t:S.turn-9}).text,old:'的'+fullName(c)+'托人递来一句话：求陛下准她剪发出家，从此青灯古佛，不再惹陛下心烦。',neu:fullName(c)+'托人递来一句话：求陛下准她剪发出家，往后只守着一盏青灯，不再惹陛下心烦。'})`],
 ['青灯 · 冷宫','c.cold=true;',`({text:XEV.心如死灰(c,{t:S.turn-9}).text,old:'冷宫里的'+fullName(c)+'托人递来一句话：求陛下准她剪发出家，从此青灯古佛，不再惹陛下心烦。',neu:'冷宫里的'+fullName(c)+'托人递来一句话：求陛下准她剪发出家，往后只守着一盏青灯，不再惹陛下心烦。'})`],
 ['新衣',`c.like='绸缎';c.aff=60;`,`({text:XEV.欢喜(c).text,old:cName(c)+'心情极好，派人来请陛下去看她新裁的衣裳，说用的是今年江南新进的料子。',neu:cName(c)+'一早就打发人来请陛下，说新裁的衣裳上了身，用的是今年江南新进的料子，要陛下头一个看。'})`],
 ['野心','',`({text:XEV.野心(c).choices[1].f(),old:'她娘家的门槛，被人踏破了。',neu:'她娘家门前的拴马桩，渐渐不够用了。'})`],
 ['真相大白 · 从轻','',`({text:punishEv(other,c,'香囊藏麝').choices[2].f(),old:cName(other)+'叩头谢恩，眼底却闪过一丝庆幸。',neu:cName(other)+'叩头谢恩，额头贴着金砖，肩膀却悄悄松了下来。'})`],
 ['醋海生波','',`({text:haremScene('jealous').text,old:cName(other)+'前来请安，言语间颇有怨怼：\\n“',neu:cName(other)+'前来请安，茶盏端起又放下，半晌才开口：\\n“'})`],
 ['香囊疑案','',`({text:haremScene('musk').text,old:cName(c)+'宫中的宫女整理衣物时，发现主子常佩的香囊里竟混了麝香。'+cName(c)+'面色惨白，跪在殿前请陛下做主。',neu:cName(c)+'宫中的宫女整理衣物时，发现主子常佩的香囊里竟混了麝香。'+cName(c)+'攥着那只香囊，指节都白了，跪在殿前请陛下做主。'})`],
 ['香囊疑案 · 彻查','',`({text:haremScene('musk').choices[0].f(),old:'慎刑司连夜审讯，顺藤摸瓜，竟查到了'+cName(other)+'宫中……',neu:'慎刑司连夜审讯，从缝香囊的丝线一路问到递针线的人，竟查到了'+cName(other)+'宫中……'})`,[0,0]],
 ['巫蛊 · 查出','relAdd(other,c,-50);',`({text:haremScene('wugu').choices[1].f(),old:'密查之下，发现布偶上的针脚与某宫绣娘如出一辙……',neu:'密查之下，布偶上的针脚，与某宫一位绣娘手里的活计对上了……'})`,[0]],
 ['巫蛊 · 无果','relAdd(other,c,-50);',`({text:haremScene('wugu').choices[1].f(),old:'查不出头绪，'+cName(c)+'从此惶惶不可终日。',neu:'查不出头绪。'+cName(c)+'从此夜里不敢熄灯，枕席都要宫女先翻检一遍。'})`,[.999]],
 ['病榻 · 不理',`c.trait='体弱';`,`(haremScene('ill').choices.at(-1).f(),{text:c.story.at(-1).t,old:'病势沉重，无人问津，于一个雪夜香消玉殒。',neu:'病势沉重，无人过问。药碗在床头凉透，她没能熬过那一夜。'})`,[.999,.999,.999,.999,0,0]],
 ['冷宫来信 · 放出',`c.cold=true;c.palace='冷宫';`,`({text:haremScene('coldPlea').choices[0].f(),old:fullName(c)+'出了冷宫，形容憔悴，却仍向你深深一拜。',neu:fullName(c)+'出了冷宫，旧衣穿在身上空荡荡的，却仍向你深深一拜。'})`],
 ['派系倾轧 · 偏向',FACTIONS,`(()=>{var ev=haremScene('clash'),a=ev.cast[0],b=ev.cast[1];return {text:ev.choices[0].f(),old:cName(a)+'一派扬眉吐气，'+cName(b)+'一派面色难看。',neu:cName(a)+'一派出门时裙角都带着风，'+cName(b)+'一派落在后头，一路无话。'};})()`],
 ['派系倾轧 · 各打五十',FACTIONS,`({text:haremScene('clash').choices[2].f(),old:'两边都闭了嘴，表面上总算和气了几分。',neu:'两边都闭了嘴，退出去时还互相让了让门。'})`],
 ['投靠',FACTIONS,`(()=>{var ev=haremScene('defect'),who=ev.cast[0],l=ev.cast[1];return {text:ev.text,old:'有宫人看见，'+cName(who)+'近来常往'+l.palace+'跑，给'+cName(l)+'送这送那。看样子是想找个靠山。',neu:'有宫人看见，'+cName(who)+'近来常往'+l.palace+'走动，今日送一碟点心，明日送一方绣帕。看样子，是想在'+cName(l)+'这棵树下乘凉。'};})()`]
];
function sample(version,setup,expr,rolls=[]){
 const b=world();b.ctx.assert=assert;
 return JSON.parse(b.run(`${PREP}${setup}PalaceActions.reset();${version?`journalContentVersion=()=>${version};`:''}
  var calls=0,forced=${JSON.stringify(rolls)},random=PalaceActions.random;PalaceActions.random=()=>{calls++;return forced.length?forced.shift():random();};
  var result=${expr};PalaceActions.random=random;JSON.stringify({...result,calls,left:forced.length,version:journalContentVersion()})`));
}

for(const [name,setup,expr,rolls] of SITES)test(`${name}: version 172 replays the old sentence, the current version uses the new one, and the draws do not move`,()=>{
 const legacy=sample(172,setup,expr,rolls),current=sample(0,setup,expr,rolls);
 assert.ok(current.version>=173);assert.notEqual(legacy.old,legacy.neu);
 assert.ok(legacy.text.startsWith(legacy.old),`172 gave: ${legacy.text}`);
 assert.ok(current.text.startsWith(current.neu),`current gave: ${current.text}`);
 // Whatever follows the reworded sentence (effects, aftermath) is the same in both.
 assert.equal(current.text.slice(current.neu.length),legacy.text.slice(legacy.old.length));
 assert.equal(current.calls,legacy.calls);assert.equal(legacy.left,0);assert.equal(current.left,0);
});

test('pz2 and proseLine split on content version 173 and leave unknown text alone',()=>{
 const b=world();b.ctx.assert=assert;b.run(`PalaceActions.reset();
  assert.equal(pz2('旧','新'),'新');assert.equal(proseLine('没有改写的句子'),'没有改写的句子');assert.equal(proseLine(undefined),undefined);
  for(var [old,neu] of Object.entries(PROSE_REWRITES)){assert.equal(proseLine(old),neu);assert.notEqual(old,neu);assert.ok(neu.length<=old.length*1.5,neu);}
  var real=journalContentVersion;journalContentVersion=()=>172;
  assert.equal(proseActive(),true);assert.equal(pz2('旧','新'),'旧');for(var old of Object.keys(PROSE_REWRITES))assert.equal(proseLine(old),old);
  journalContentVersion=real;`);
});

test('every rewritten table line still exists verbatim in the table it came from',()=>{
 const b=world();b.ctx.assert=assert;b.run(`var notes=Object.values(PALACE_NOTES),traits=Object.values(TRAITS).map(t=>t.d);
  for(var key of Object.keys(PROSE_REWRITES))assert.equal(notes.filter(t=>t===key).length+traits.filter(t=>t===key).length,1,key);
  assert.equal(Object.keys(PROSE_REWRITES).filter(key=>notes.includes(key)).length,3);assert.equal(Object.keys(PROSE_REWRITES).filter(key=>traits.includes(key)).length,8);`);
});

test('palace notes and trait descriptions are swapped where they are read, not in the tables',()=>{
 const b=world();b.ctx.assert=assert;b.run(`PalaceActions.reset();
  assert.equal(PALACE_NOTES.景阳宫,'东六宫之一，藏书最多，满室书香。');assert.equal(TRAITS.聪慧.d,'冰雪聪明，一点即透。');
  UI.sel='景阳宫';assert.match(viewPalace(),/晴日里满院晒着书。/);assert.match(viewResidences(),/落雪时也是青的。/);assert.doesNotMatch(viewResidences(),/满室书香|少有人来|冬日也有绿意/);
  UI.sel='钟粹宫';assert.match(viewPalace(),/院里种满了秋菊。/);
  c.trait='聪慧';UI.sel=c.id;assert.match(viewConsort(),/心思敏捷，话听半句便知下文。 · 侍寝/);assert.match(viewConsort(),/<p class="verdict">一点即透。/);
  var real=journalContentVersion;journalContentVersion=()=>172;
  UI.sel='景阳宫';assert.match(viewPalace(),/满室书香。/);UI.sel=c.id;assert.match(viewConsort(),/冰雪聪明，一点即透。 · 侍寝/);
  journalContentVersion=real;`);
});

test('a trait description no longer repeats the phrase its verdict line opens with',()=>{
 const b=world();b.ctx.assert=assert;b.run(`PalaceActions.reset();
  var shared=(a,b)=>{for(var i=0;i+4<=a.length;i++){var run=a.slice(i,i+4);if(!/[，。]/.test(run)&&b.includes(run))return run;}return '';};
  for(var trait of Object.keys(TRAITS))assert.equal(shared(proseLine(TRAITS[trait].d),PROSE_VERDICTS[trait]),'',trait);
  assert.equal(shared(TRAITS.聪慧.d,PROSE_VERDICTS.聪慧),'一点即透');assert.equal(shared(TRAITS.将门.d,PROSE_VERDICTS.将门),'将门虎女');`);
});
