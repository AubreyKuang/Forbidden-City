/* ============ 人物主动行动 ============ */
const initiativeAlly=c=>harem().filter(o=>o!==c&&relGet(c,o)>=15)
  .sort((a,b)=>relGet(c,b)-relGet(c,a)+3*(consortCompatibility(c,b)-consortCompatibility(c,a)))[0];
const initiativeChild=(c,minAge)=>kidsAlive().find(k=>
  kidAge(k)>=minAge&&childInPalace(k)&&(k.foster===c.id||(!k.foster&&k.mom===c.id)));
const skillGain=(k,key,amount)=>{k[key]=clamp(k[key]+amount)};
const INITIATIVE_SOURCES={
  song:'https://zh.wikisource.org/wiki/東京夢華錄/卷八',
  beijing:'https://zh.wikisource.org/wiki/燕京歲時記',
  charms:'https://www.dpm.org.cn/Uploads/File/2020/05/18/u5ec225b518cc8.pdf',
  rabbit:'https://www.dpm.org.cn/collection/sculpture/233282.html',
  winter:'https://www.dpm.org.cn/curriculum/246428.html',
  school:'https://www.dpm.org.cn/court/culture/157157.html'
};
const PALACE_INITIATIVES={
  springPetals:{
    title:'拾花伤春', place:'yh', seasonal:true,
    match:c=>season()===0&&['思念','委屈'].includes(xinOf(c))&&(['沉静','痴情','淡泊'].includes(c.trait)||c.t2==='念旧'),
    text:()=> '昨夜一阵雨打落了海棠。她挑出一瓣尚完整的夹进书里，说去年还有人陪她在这里等花开。',
    button:'陪她沿花径走一段', respond:c=>cchg(c,{mood:7,aff:3})
  },
  autumnLamp:{
    title:'秋夜听雨', seasonal:true, place:consortPalaceVenue,
    match:c=>season()===2&&['思念','委屈'].includes(xinOf(c))&&(['沉静','痴情','体弱'].includes(c.trait)||c.t2==='念旧'),
    text:()=> '她把家里寄来的信读了两遍，搁在窗下听雨。宫人来添灯，她说留一盏便够了。',
    button:'陪她坐一会儿', respond:c=>cchg(c,{mood:7,aff:3})
  },
  winterTea:{
    title:'暖阁分茶', seasonal:true, place:consortPalaceVenue,
    match:c=>season()===3&&['好客','温婉'].includes(c.trait)&&consortHobby(c)==='品茶'&&c.mood>=40,
    target:initiativeAlly,
    text:(c,o)=>`她温了两只茶盏，替${cName(o)}把靠门的坐垫挪到火盆边，才喊宫人端茶。`,
    start:(c,o)=>{relAdd(c,o,3);return '两人围炉叙话';},
    button:'留下尝一盏茶', respond:(c,o)=>cchg(c,{aff:3})+' · '+cchg(o,{mood:4})
  },
  ciNingCopy:{
    title:'佛堂抄经', place:'cn',
    match:c=>c.t2==='信佛'&&S.flags.dowager?.alive&&(NEGX.includes(xinOf(c))||c.mood<45),
    text:()=> '她在慈宁宫佛堂誊完半卷经，把写坏的几页叠在一旁，说手有事做，心便慢慢静下来。',
    button:'替她续一盏灯', respond:c=>cchg(c,{mood:6})
  },
  kunNingAccounts:{
    title:'中宫核账', place:'p坤宁宫',
    match:c=>['持重','聪慧'].includes(c.trait)&&empress()&&E().treasury<600,
    text:()=> '她带着各宫领用簿来坤宁宫，发现两处炭例数目相同，便请掌事姑姑找来原单核对。',
    button:'让内务府按原单更正', respond:()=>chg({treasury:6})
  },
  gardenPractice:{
    title:'花亭试投', place:'yh',
    match:c=>!c.preg&&c.mood>=40&&(['爽直','将门'].includes(c.trait)||consortHobby(c)==='投壶'),
    target:c=>harem().find(o=>o!==c&&!o.preg&&relGet(c,o)>=0&&consortHobby(o)==='投壶'),
    text:(c,o)=>`她和${cName(o)}在花亭前试投，输了便把离壶最近的一支箭捡回来，拉对方再比一轮。`,
    start:(c,o)=>{relAdd(c,o,2);return '两人约好下次再比';},
    button:'给她们换一只远壶', respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{mood:4});}
  },
  silkCharm:{
    title:'端午结百索', seasonal:true, place:'yh', source:'charms', ref:'故宫博物院·端午服饰与佩饰',
    match:c=>S.month===5 && (['温婉','骄纵'].includes(c.trait)||c.t2==='护短'),
    target:c=>initiativeChild(c,3),
    text:(c,k)=>c.trait==='骄纵'&&c.favor>=55
      ? `她挑了最鲜亮的丝线，要给${k.name}打个一眼就认得出来的长命缕。孩子看了片刻，问能否也给同窗编一个。`
      : `她拿出五色丝线，和${k.name}各编一股。孩子编得松，她放慢手，让孩子看清怎么收结。`,
    choices:[
      {label:'带孩子再编几根，送给同窗',impact:'share'},
      {label:'系在孩子腕上，留作家里的节礼',impact:'keep'}
    ],
    echo:(c,k,choice)=>choice==='share'
      ? `${k.name}把学来的结法教给同窗。有人学不会，孩子拆了自己的百索，重新示范了一遍。`
      : `${k.name}的五色丝线松了，孩子收好线头，跑回${cName(c)}宫里请她打回原来的结。`
  },
  clayRabbit:{
    title:'中秋彩绘兔儿爷', seasonal:true, place:'yh', source:'rabbit', ref:'故宫博物院·泥制兔儿爷',
    match:c=>S.month===8&&(c.trait==='活泼'||c.trait==='才女'||['念旧','爱猫'].includes(c.t2)),
    target:c=>initiativeChild(c,4),
    text:(c,k)=>c.trait==='才女'
      ? `她给泥兔画了眉眼，刚要蘸红，${k.name}递来一碟青色：“它也能穿和我一样的衣裳吗？”`
      : `她让人从宫外捎来几只泥兔。最大的那只歪着耳朵，${k.name}偏挑中了它。`,
    choices:[
      {label:'把颜料交给孩子，由孩子选颜色',impact:'lead'},
      {label:'请母亲教笔法，两人合画',impact:'keep'}
    ],
    echo:(c,k,choice)=>choice==='lead'
      ? `${k.name}带着亲手上色的泥兔来请安，还用剩下的颜料给它画了一张小坐垫。`
      : `${k.name}和${cName(c)}把合画的泥兔放在窗台。她留着孩子画歪的那只耳朵，始终没改。`
  },
  winterChart:{
    title:'冬至描消寒图', seasonal:true, place:'wy', source:'winter', ref:'故宫博物院·数九消寒',
    match:c=>S.month===11&&(['淡泊','聪慧'].includes(c.trait)||['畏寒','好读史'].includes(c.t2)),
    target:c=>initiativeChild(c,5),
    text:(c,k)=>`她铺开一张消寒图，请${k.name}从冬至开始添笔。${k.policy==='读书'?'孩子先认图上的字，又问每一笔为何要等一天。':'孩子问能否一天添好几笔，这样春天就能来得快一些。'}`,
    choices:[
      {label:'交给孩子保管，下个月来看看',impact:'lead'},
      {label:'挂到母亲窗边，请两人一起填',impact:'keep'}
    ],
    echo:(c,k,choice)=>choice==='lead'
      ? `${k.name}亲自拿来消寒图，指出哪一笔是在下雪那天描的。孩子记得比掌事宫女还清楚。`
      : `${cName(c)}指着消寒图上粗细不同的笔画，说有些是她填的，有些是${k.name}描的。孩子站在旁边，一眼就能分出来。`
  },
  firstLesson:{
    title:'上书房备笔砚', seasonal:true, child:true, place:'ss', source:'school', ref:'故宫博物院·上书房',
    match:k=>S.month===2&&kidAge(k)>=8&&kidAge(k)<16&&k.policy==='读书'&&k.lit>=30,
    target:k=>mothersOf(k).filter(m=>familyVisitAllowed(k,m)).sort((a,b)=>childTrust(k,b)-childTrust(k,a))[0],
    text:(k,c)=>`${k.name}随${cName(c)}来上书房备齐笔砚。太傅问起昨日的功课，孩子能背出原文，却还没想好用自己的话怎么讲。`,
    choices:[
      {label:'让孩子讲自己的理解',impact:'lead'},
      {label:'请母亲听完，再和孩子慢慢读一遍',impact:'keep'}
    ],
    echo:(k,c,choice)=>choice==='lead'
      ? `${k.name}散学后主动留下来讲书。这回连最难的一段，也能用自己的话说清楚。`
      : `${k.name}请${cName(c)}在自己的书签上题字，说见了那几个字，就想起两人一起读书的日子。`
  },
  fan:{
    title:'端午画扇', place:'yh', seasonal:true, source:'song', ref:'《东京梦华录》卷八·端午',
    match:c=>S.month===5&&(c.trait==='才女'||c.like==='字画'),
    text:()=> '端午将近，她画了两柄团扇。一柄已经上色，另一柄特意留着空白等人题字。',
    start:c=>cchg(c,{mood:3}), button:'给团扇题字', respond:c=>cchg(c,{aff:6})
  },
  iceTickets:{
    title:'查点冰票', seasonal:true, source:'beijing', ref:'《燕京岁时记》·赐冰',
    match:c=>S.month===6&&(c.trait==='聪慧'||c.trait==='体弱'),
    target:c=>harem().find(o=>o!==c&&o.mood<=65&&relGet(c,o)>=0),
    text:(c,o)=>'暑热正盛，她把两宫的用冰账对过一遍，发现'+cName(o)+'那边还没领冰，先让人送了一份。',
    start:(c,o)=>{relAdd(c,o,3);return cchg(o,{mood:3});},
    button:'替两宫补上冰例（国库-6）', cost:6,
    respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{mood:4})+' · '+cchg(o,{mood:4});}
  },
  sprouts:{
    title:'七夕种生', seasonal:true, source:'song', ref:'《东京梦华录》卷八·七夕',
    match:c=>S.month===7&&(c.trait==='活泼'||c.t2==='念旧'),
    target:c=>initiativeChild(c,3),
    text:(c,k)=>'她和'+k.name+'用瓷盘浸豆，看它发芽，再拿彩线围起一个小院。',
    start:(c,k)=>{relAdd(c,k,4);return '亲子关系改善';},
    button:'陪孩子给小院添一座桥', respond:(c,k)=>{skillGain(k,'love',4);return '父爱 +4';}
  },
  chrysanthemum:{
    title:'重阳摆菊', place:'yh', seasonal:true, source:'beijing', ref:'《燕京岁时记》·九花山子',
    match:c=>S.month===9&&(c.trait==='淡泊'||c.like==='花草'), target:initiativeAlly,
    text:(c,o)=>'她和'+cName(o)+'把高矮不同的菊盆叠成一座小花山，特意给最小的那盆留了个好位置。',
    start:(c,o)=>{relAdd(c,o,4);return '两人关系改善';},
    button:'把花山移到御花园同赏', respond:(c,o)=>cchg(c,{mood:5})+' · '+cchg(o,{mood:5})
  },
  cakes:{
    title:'重阳分糕', seasonal:true, source:'song', ref:'《东京梦华录》卷八·重阳',
    match:c=>S.month===9&&(c.t2==='擅厨艺'||c.t2==='嗜甜'), target:initiativeAlly,
    text:(c,o)=>'她做了几层枣栗糕，把蒸得最好的一笼送给'+cName(o)+'，自己留了有些塌的一笼。',
    start:(c,o)=>{relAdd(c,o,3);return cchg(o,{mood:3});},
    button:'请两宫一起尝糕', respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{aff:4});}
  },
  skate:{
    title:'太液池练冰嬉', seasonal:true, child:true, source:'beijing', ref:'《燕京岁时记》·溜冰鞋',
    match:k=>S.month===12&&kidAge(k)>=8&&k.policy==='习武'&&k.mar>=32&&k.hp>=45,
    text:()=> '孩子看完太液池的冰嬉，跟着教习在岸边练起步。第一圈还要扶人，第二圈已经能自己转弯。',
    start:k=>{skillGain(k,'mar',2);return '武艺 +2';},
    button:'看孩子滑完一圈', respond:k=>{skillGain(k,'love',4);return '父爱 +4';}
  },
  porridge:{
    title:'腊八分粥', seasonal:true, source:'beijing', ref:'《燕京岁时记》·腊八粥',
    match:c=>S.month===12&&(c.t2==='信佛'||c.t2==='擅厨艺'||c.trait==='温婉'),
    text:()=> '她领着宫人淘米剥果，天刚亮便分好几碗。给值夜宫人的那一份还特意温着。',
    start:c=>cchg(c,{mood:3}), button:'拨粮多煮一锅（国库-8）', cost:8,
    respond:c=>chg({people:2})+' · '+cchg(c,{aff:4})
  },
  broth:{
    title:'送汤', match:c=>E().health<82&&(c.trait==='温婉'||c.t2==='嘴硬心软'),
    text:c=>c.t2==='嘴硬心软'?'她让小厨房熬了汤，嘱咐宫人说是御膳房送的。':'她见你近来劳累，亲自送了一盅热汤到乾清宫。',
    start:()=>chg({health:1}), button:'去向她道谢', respond:c=>cchg(c,{aff:5,mood:4})
  },
  wager:{
    title:'投壶约赛', place:'yh', match:c=>!c.preg&&c.mood>=40&&(c.trait==='骄矜'||c.t2==='好胜'),
    target:c=>harem().find(o=>o!==c&&!o.preg&&o.favor>=c.favor+8),
    text:(c,o)=>'她向'+cName(o)+'约了一局投壶，特意请对方先投。两宫的人都来围观。',
    start:(c,o)=>{relAdd(c,o,-2);return '两宫关系稍显紧张';}, button:'亲自主持，按成绩定名次', respond:(c,o)=>{relAdd(c,o,7);return '两宫关系改善 · '+cchg(c,{mood:5})}
  },
  ledger:{
    title:'重算账目', match:c=>(['聪慧','持重'].includes(c.trait)||c.t2==='好读史')&&(E().treasury<450||S.flags.lastCourt),
    text:()=> '她核对了本宫的领用簿，找出两笔重记的支出，把原簿和自己算的数一并送来。',
    start:()=>chg({treasury:4}), button:'请她教各宫核账', respond:c=>chg({treasury:12})+' · '+cchg(c,{aff:4})
  },
  gardenWalk:{
    title:'邀友赏花', place:'yh', match:c=>!c.preg&&(['淡泊','活泼','好客'].includes(c.trait)||c.t2==='爱猫'||consortHobby(c)==='侍花'),
    target:initiativeAlly,
    text:(c,o)=>'她请'+cName(o)+'到御花园散步。两人绕过热闹的亭子，坐在树荫下聊了半日。',
    start:(c,o)=>{relAdd(c,o,4);return cchg(c,{mood:3})}, button:'把水榭留给她们', respond:(c,o)=>cchg(o,{mood:6})+' · '+cchg(c,{aff:3})
  },
  swapPatterns:{
    title:'交换绣样', match:c=>c.trait==='巧手'||consortHobby(c)==='刺绣',
    target:c=>harem().find(o=>o!==c&&relGet(c,o)>=0&&sharedConsortHobby(c,o)==='刺绣'),
    text:(c,o)=>'她拿自己画的团花样去找'+cName(o)+'，两人把各自最难的一针做在了同一块绢上。',
    start:(c,o)=>{relAdd(c,o,3);return '两人更熟悉了';},
    button:'请她们各留一份绣样', respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{mood:4});}
  },
  compareCopies:{
    title:'合校旧抄本', place:'wy', match:c=>c.trait==='好学'||consortHobby(c)==='读书',
    target:c=>harem().find(o=>o!==c&&relGet(c,o)>=0&&consortHobby(o)==='读书'),
    text:(c,o)=>'她和'+cName(o)+'各从文渊阁借了一册旧抄本，把两处互不相同的字夹上了纸条。',
    start:(c,o)=>{relAdd(c,o,3);return '两人更熟悉了';},
    button:'请文渊阁取来另一版本', respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{aff:3});}
  },
  tutorVisit:{
    title:'拜访太傅', place:'ss', match:c=>c.trait==='城府'||c.t2==='护短', target:c=>initiativeChild(c,6),
    text:(c,k)=>'她独自去见了太傅，请他替'+k.name+'列出擅长和欠缺的功课。',
    start:(c,k)=>{skillGain(k,'lit',1);return '才学 +1';}, button:'亲自看功课', respond:(c,k)=>{skillGain(k,'love',4);return '父爱 +4';}
  },
  keepsake:{
    title:'拿出旧礼', match:c=>c.trait==='痴情'||c.t2==='念旧',
    memory:c=>NPCMemory.recall(S,c.id).find(m=>m.subject==='emperor'&&['care','gift','wish'].includes(m.type)&&typeof m.interpretation==='string'),
    text:(c,o,m)=>'她整理妆奁时提起一件旧事：“'+m.interpretation+'。”旁人已经忘了，她还记着。',
    start:c=>cchg(c,{mood:3}), button:'陪她说说那天的事', respond:c=>cchg(c,{aff:7})
  },
  stove:{
    title:'移座避寒', match:c=>season()===3&&(c.trait==='体弱'||c.t2==='畏寒'),
    text:()=> '她让人把读书用的案几移到朝阳的窗边，又把值夜的宫女调进暖阁。',
    start:c=>cchg(c,{mood:4}), button:'拨一盆好炭（国库-8）', cost:8, respond:c=>cchg(c,{mood:8,aff:3})
  },
  archery:{
    title:'带孩子练弓', match:c=>!c.preg&&(c.trait==='将门'||c.t2==='擅骑射'), target:c=>initiativeChild(c,6),
    text:(c,k)=>'她带'+k.name+'到南苑，先教站姿，再让孩子自己拉了第一张轻弓。',
    start:(c,k)=>{skillGain(k,'mar',2);return '武艺 +2';}, button:'到南苑看他们练习', respond:(c,k)=>{skillGain(k,'mar',2);skillGain(k,'love',3);return '武艺 +2 · 父爱 +3';}
  },
  poetry:{
    title:'改诗一首', match:c=>c.trait==='才女'&&c.arc?.id!=='scholar'&&S.turn-(S.flags.lastLiteraryGathering??-12)>=12,
    text:()=> '她把一首新诗退回给小宫女重写，自己也改了三遍首句，才肯把两稿一起送来。',
    start:c=>{S.flags.lastLiteraryGathering=S.turn;return cchg(c,{mood:3});}, button:'读两稿，留一句评语', respond:c=>cchg(c,{aff:6})
  },
  barter:{
    title:'换置首饰', match:c=>c.trait==='贪财'&&c.favor>=35,
    text:()=> '她把几件用不上的旧饰交给内务府，问能否换成一件常戴的。账簿上列得一清二楚。',
    start:c=>cchg(c,{mood:2}), button:'准照原价换置', respond:c=>cchg(c,{aff:5,mood:5})
  },
  study:{
    title:'主动校书', place:'ss', child:true, match:k=>k.policy==='读书'&&k.lit>=28,
    text:()=> '散学后，孩子留下来对照两本旧抄卷，把抄错的地方逐个标了出来。',
    start:k=>{skillGain(k,'lit',1);return '才学 +1';}, button:'让孩子讲一遍发现', respond:k=>{skillGain(k,'lit',2);skillGain(k,'love',3);return '才学 +2 · 父爱 +3';}
  },
  spar:{
    title:'约手足比试', child:true, match:k=>k.policy==='习武'&&k.mar>=25,
    target:k=>kidsAlive().find(o=>o!==k&&kidAge(o)>=6&&!o.away&&!o.jailed&&relGet(k,o)>=5),
    text:(k,o)=>'孩子拉'+o.name+'一起练习，输了的一方主动请对方教招式。',
    start:(k,o)=>{skillGain(k,'mar',1);relAdd(k,o,3);return '武艺 +1 · 手足关系改善';},
    button:'让两人交换教练', respond:(k,o)=>{skillGain(k,'mar',2);skillGain(o,'mar',2);relAdd(k,o,5);return '两人武艺 +2 · 手足关系改善';}
  },
  mentor:{
    title:'给手足补课', child:true, match:k=>k.policy==='修德'&&k.vir>=30,
    target:k=>kidsAlive().find(o=>o!==k&&kidAge(o)>=5&&kidAge(o)<kidAge(k)&&!o.away&&!o.jailed),
    text:(k,o)=>'孩子拿着自己的字帖，去教'+o.name+'写那几个总记错的字。',
    start:(k,o)=>{skillGain(o,'lit',1);relAdd(k,o,3);return '手足才学 +1 · 关系改善';},
    button:'把字帖留给两人', respond:(k,o)=>{skillGain(k,'vir',2);relAdd(k,o,4);return '品德 +2 · 手足关系改善';}
  }
};

function consortPalaceVenue(c){return 'p'+c.palace;}
const initiativePlace=(rule,person,move)=>{
  const place=move?.place??(typeof rule?.place==='function'?rule.place(person):rule?.place);
  return place==='p坤宁宫'?'kn':place==='p冷宫'?'lg':place;
};

function initiativeParticipants(person,move) {
  if (!(person.sex?childInPalace(person):inPalace(person))) return null;
  const target=move.target==null?null:kidById(move.target)||byId(move.target);
  if (move.target!=null && !(target?.sex?childInPalace(target):inPalace(target))) return null;
  const rule=PALACE_INITIATIVES[move.id];
  if (!rule) return null;
  if (rule.echo && !familyVisitAllowed(person.sex?person:target,person.sex?target:person)) return null;
  return {person,target,rule};
}

function historicEchoTick(person) {
  const echo=person.initiativeEcho;
  if (!echo || echo.turn>S.turn || echo.delivered) return;
  if (echo.turn<S.turn) {delete person.initiativeEcho;return}
  const scene=initiativeParticipants(person,echo);
  if (!scene) {delete person.initiativeEcho;return}
  const {target,rule}=scene;
  const child=person.sex?person:target, mother=person.sex?target:person;
  const text=rule.echo(person,target,echo.impact);
  const views={
    share:[`同窗也学会了${rule.title}的做法。下回还想教他们。`,`${child.name}愿意把学来的手艺教给同窗，没急着炫耀自己的成品。`],
    lead:[`这回没人替我做，${cName(mother)}也肯由着我把它完成。`,`${child.name}独自做成了这件事，兴冲冲地拿来给我看。`],
    keep:[`还想和${cName(mother)}照上回那样一起做。`,`又和${child.name}一起做了「${rule.title}」，孩子还记得上回的小细节。`]
  }[echo.impact];
  recordFamilyTime(child,mother,rule.title,views[0],views[1],{gain:echo.impact==='keep'?7:4,
    place:PLACES.find(p=>p.id===rule.place).n,
    stat:echo.impact==='share'?'vir':echo.impact==='lead'?'lit':undefined});
  echo.delivered=true;
  echo.text=text;
  kstory(child,text);
}

function initiativeTick(){
  const recent=S.flags.initiativeTurns ||= {};
  const types=Object.entries(PALACE_INITIATIVES);
  const groups=[harem(),kidsAlive().filter(k=>kidAge(k)>=6&&childInPalace(k))];
  for (const person of groups.flat()) historicEchoTick(person);
  groups.forEach((people,index)=>{
    const ready=shuffle(people).filter(p=>S.turn-(p.initiative?.turn??-Infinity)>=4);
    ready.sort((a,b)=>(a.initiative?.turn??-1)-(b.initiative?.turn??-1));
    const rules=shuffle(types).filter(([,rule])=>!!rule.child===!!index);
    for(const seasonal of [true,false]){
      for(const person of ready){
        for(const [id,rule] of rules){
          if(!!rule.seasonal!==seasonal||S.turn-(recent[id]??-Infinity)<7||!rule.match(person))continue;
          const target=rule.target?.(person), memory=rule.memory?.(person);
          if((rule.target&&!target)||(rule.memory&&!memory))continue;
          const move={id,turn:S.turn,target:target?.id};
          if(typeof rule.place==='function')move.place=rule.place(person);
          if(!initiativeParticipants(person,move))continue;
          move.text=rule.text(person,target,memory);
          move.effect=rule.start?.(person,target);
          person.initiative=move;
          if(rule.echo)person.initiativeEcho={id,turn:S.turn+1,target:target.id,impact:rule.child?'lead':'keep'};
          recent[id]=S.turn;
          return;
        }
      }
    }
  });
}

function currentInitiative(person){
  return person?.initiative?.turn===S.turn?person.initiative:null;
}

function activeInitiativeEcho(person) {
  const echo=person?.initiativeEcho;
  return echo?.delivered&&echo.turn===S.turn?echo:null;
}

// Use the same saved portrait as the character page, with a name for every participant.
function activityPortraits(...people){
  const cast=[...new Set(people.filter(Boolean))];
  return cast.length?`<div class="activity-portraits">${cast.map(p=>`<button class="activity-person" onclick="A.go('${p.sex?'kid':'consort'}',${p.id})" aria-label="查看${esc(porName(p))}">${porImg(p,68)}<span>${esc(porName(p))}</span></button>`).join('')}</div>`:'';
}
function initiativeHTML(person,venue){
  const move=currentInitiative(person), rule=PALACE_INITIATIVES[move?.id];
  const echo=activeInitiativeEcho(person), echoRule=PALACE_INITIATIVES[echo?.id];
  const echoCast=echo&&initiativeParticipants(person,echo);
  const followup=echoRule&&echoCast&&(!venue||initiativePlace(echoRule,person,echo)===venue)
    ?`<section class="initiative-note">${venue?activityPortraits(person,echoCast.target):''}<strong>后来 · ${esc(echoRule.title)}</strong><p>${esc(echo.text)}</p></section>`:'';
  const placeId=initiativePlace(rule,person,move);
  const cast=move&&initiativeParticipants(person,move);
  if(!rule||(venue&&placeId!==venue)||!cast)return followup;
  const place=PLACES.find(p=>p.id===placeId);
  const response=move.response
    ? `<small>你已回应 · ${esc(move.response)}</small>`
    : `<button class="btn sm" onclick="A.answerInitiative(${person.id},${!!person.sex})">${esc(rule.choices?'到场看看':rule.button)}<small>${rule.choices?'观看无需精力':'精力-1'}</small></button>`;
  return `<section class="initiative-note">${venue?activityPortraits(person,cast.target):''}<strong>${esc(rule.title)}${place?' · '+place.n:''}${venue?` · ${esc(person.sex?kidName(person):cName(person))}`:''}</strong><p>${esc(move.text)}</p>
    ${move.effect?`<small>${esc(move.effect)}</small>`:''}${response}
    ${rule.ref?`<small class="initiative-ref">参考 <a href="${INITIATIVE_SOURCES[rule.source]}" target="_blank" rel="noopener noreferrer">${esc(rule.ref)}</a></small>`:''}</section>${followup}`;
}

function initiativePeople(){
  return [...harem(),...kidsAlive().filter(childInPalace)];
}

function initiativeNotices(){
  const people=initiativePeople().filter(p=>currentInitiative(p)||activeInitiativeEcho(p));
  if(!people.length)return '';
  return `<div class="initiative-notices" aria-label="本月宫中动向">${people.map(p=>{
    const move=currentInitiative(p)||activeInitiativeEcho(p);
    const rule=PALACE_INITIATIVES[move.id];
    if(!rule)return '';
    const place=PLACES.find(q=>q.id===initiativePlace(rule,p,move));
    return `<button class="btn sm" onclick="A.seeInitiative(${p.id},${!!p.sex})">${place?place.n+' · ':''}${esc(p.sex?kidName(p):cName(p))} · ${esc(rule.title)}${move.delivered?'后续':''}</button>`;
  }).join('')}</div>`;
}

function initiativesAt(place) {
  return initiativePeople().filter(p=>[currentInitiative(p),activeInitiativeEcho(p)]
    .some(move=>initiativePlace(PALACE_INITIATIVES[move?.id],p,move)===place))
    .map(p=>initiativeHTML(p,place)).join('');
}

A.seeInitiative=function(id,child){
  const person=child?kidById(id):byId(id);
  const move=currentInitiative(person);
  if(move && !move.response && PALACE_INITIATIVES[move.id]?.choices){
    A.answerInitiative(id,child);
    return;
  }
  const echo=activeInitiativeEcho(person);
  const placeId=initiativePlace(PALACE_INITIATIVES[(move||echo)?.id],person,move||echo);
  const place=PLACES.find(p=>p.id===placeId);
  if(place&&place.k!=='view'){goDirect(place);return;}
  A.go(child?'kid':'consort',id);
};

A.answerInitiative=function(id,child){
  if(!S||S.over||modalOpen)return;
  const person=child?kidById(id):byId(id),move=currentInitiative(person);
  if(!move||move.response)return;
  const scene=initiativeParticipants(person,move);
  if(!scene){toast('这场相聚已经散了');return}
  const {target,rule}=scene;
  if(rule.choices){
    const place=PLACES.find(p=>p.id===rule.place);
    setScene(place.sc);
    pushEv({title:rule.title,cast:[person,target],text:move.text,ref:rule.ref,refURL:INITIATIVE_SOURCES[rule.source],
      choices:[...rule.choices.map(choice=>({t:choice.label+'（精力-1）',cond:()=>E().energy>0,
        why:'精力不足',f:()=>{
          if(move.response||!initiativeParticipants(person,move)||!useE())return null;
          if(person.initiativeEcho?.id===move.id)person.initiativeEcho.impact=choice.impact;
          move.response=choice.label;
          remember(person,'care',`陛下到场。${choice.label}。`);
          save('auto');
          return `${choice.label}。过一个月再看看他们做得怎样。`;
        }})),{t:'留他们继续，朕先走了'}]});
    return;
  }
  if(rule.cost&&E().treasury<rule.cost){toast('国库不足');return}
  if(!useE())return;
  const cost=rule.cost?chg({treasury:-rule.cost}):'';
  move.response=[cost,rule.respond(person,target)].filter(Boolean).join(' · ');
  const result=`「${rule.title}」陛下${rule.button.replace(/（.*）/,'')}。`;
  if(child)kstory(person,result);else story(person,result);
  remember(person,'care',result);
  save('auto');render();toast(move.response);
};
