/* Material culture supplies the activity; participants and outcomes are fictional. */
Object.assign(INITIATIVE_SOURCES,{
  sericulture:'https://www.dpm.org.cn/court/system/236408.html',
  needle:'https://www.dpm.org.cn/lemmas/244336.html',
  grass:'https://www.dpm.org.cn/collection/paint/232619.html',
  clearTea:'https://www.dpm.org.cn/lemmas/241642.html'
});
const pastimePartner=(c,test=()=>true)=>harem().filter(o=>o!==c&&relGet(c,o)>=0&&test(o)).sort((a,b)=>relGet(c,b)-relGet(c,a))[0];
Object.assign(PALACE_INITIATIVES,{
  silkwormLessons:{
    title:'春蚕试养',place:'kn',seasonal:true,source:'sericulture',ref:'取意皇后亲蚕礼；此处为日常试养的游戏改编',
    match:c=>[2,3].includes(S.month)&&(c.rank===8||['持重','巧手'].includes(c.trait)),
    target:c=>pastimePartner(c,o=>['好学','巧手','温婉'].includes(o.trait)),
    text:(c,o)=>`${cName(c)}备了几匾桑叶。${cName(o)}想先照样子做一遍，她却把叶背翻过来，让对方看哪些还带着水。小宫女抱着蚕匾等两人拿主意。`,
    choices:[
      {label:'请她教挑叶，照料由两宫轮值',respond:(c,o)=>{relAdd(c,o,5);return cchg(c,{talent:2,mood:4})+' · '+cchg(o,{talent:2});}},
      {label:'记下用量，把余丝留给针线房',respond:c=>chg({treasury:5})+' · '+cchg(c,{virtue:2,aff:3})}
    ]
  },
  needleMoon:{
    title:'月下借针',place:'yh',seasonal:true,source:'needle',ref:'故宫博物院·乞巧；人物交往为游戏改编',
    match:c=>S.month===7&&(c.trait==='巧手'||c.t2==='好胜'||consortHobby(c)==='刺绣'),
    target:c=>pastimePartner(c),
    text:(c,o)=>`${cName(c)}已将彩线穿过几孔，${cName(o)}的线头却散了。${c.t2==='好胜'?'她捏着最快穿好的针，既想夺巧，又忍不住看向对方。':'她停下手，想教对方捻线，又怕被误会成故意相让。'}`,
    choices:[
      {label:'先比一回，再互教穿针的诀窍',respond:(c,o)=>{relAdd(c,o,3);return cchg(c,{talent:2,mood:5})+' · '+cchg(o,{talent:1});}},
      {label:'两人合作，给孩子缝一个针线包',respond:(c,o)=>{relAdd(c,o,7);return cchg(c,{virtue:2})+' · '+cchg(o,{mood:6});}}
    ]
  },
  grassNames:{
    title:'斗草辨芳名',place:'yh',seasonal:true,source:'grass',ref:'取意清宫旧藏《婴戏图册·斗草图》',
    match:c=>[4,5].includes(S.month)&&(['活泼','爽直','好学'].includes(c.trait)||consortHobby(c)==='侍花'),
    target:c=>kidsAlive().find(k=>kidAge(k)>=4&&kidAge(k)<=11&&childInPalace(k)&&familyVisitAllowed(k,c)),
    text:(c,k)=>`${k.name}拿来两根草茎，要比谁的更结实。${c.trait==='好学'?'她先问每片叶子叫什么，孩子急得把整束草往身后藏。':'她故意挑了一根细的，孩子却说不许相让，输赢要自己试。'}`,
    choices:[{label:'让孩子自己选草，输赢都再试一次',impact:'lead'},{label:'请母亲认叶，带孩子做一页草木簿',impact:'keep'}],
    echo:(c,k,choice)=>choice==='lead'?`${k.name}终于找到一根结实的草茎，跑去教同窗怎样挑选，还承认自己上回输了。`:`${k.name}带着和${cName(c)}合做的草木簿来请安，认得叶子，也记得母亲讲的小名。`
  },
  clearTeaTasting:{
    title:'三清茶辨香',place:consortPalaceVenue,seasonal:true,source:'clearTea',ref:'取意三清茶配料；宫中小聚为游戏改编',
    match:c=>[1,11,12].includes(S.month)&&(['好客','沉静','淡泊'].includes(c.trait)||consortHobby(c)==='品茶'),
    target:initiativeAlly,
    text:(c,o)=>`${cName(c)}备了梅花、佛手与松仁，请${cName(o)}先闻香再试味。${c.trait==='好客'?'她给对方添了两遍热水，又怕自己说得太多，耽误了品茶。':'她只把三只小碟推近，等对方说出最喜欢的那一味。'}`,
    choices:[
      {label:'各配一盏，记下彼此喜欢的香气',respond:(c,o)=>{relAdd(c,o,6);return cchg(c,{mood:6,aff:3})+' · '+cchg(o,{mood:5});}},
      {label:'留下茶方，送去当值的暖阁',respond:(c,o)=>cchg(c,{virtue:3})+' · '+cchg(o,{virtue:2})}
    ]
  },
  paperMending:{
    title:'残卷补纸',place:'wy',
    match:c=>['好学','巧手','持重'].includes(c.trait)&&c.talent>=45,
    target:c=>pastimePartner(c,o=>consortHobby(o)==='读书'||o.trait==='巧手'),
    text:(c,o)=>`${cName(c)}发现旧书缺了半页，${cName(o)}找来一张颜色接近的纸。两人试了几次，接缝仍看得出来。她们没有拿新书冒充，而是把补过的位置认真记在卷末。`,
    choices:[
      {label:'照实留记，让两人再校缺字',respond:(c,o)=>{relAdd(c,o,4);return cchg(c,{talent:3})+' · '+cchg(o,{talent:2});}},
      {label:'留下原卷，另抄一册供大家读',respond:(c,o)=>{relAdd(c,o,2);return cchg(c,{virtue:3,aff:3})+' · '+cchg(o,{mood:4});}}
    ]
  },
  winterSilk:{
    title:'旧锦裁冬衣',place:consortPalaceVenue,seasonal:true,
    match:c=>season()===3&&['温婉','持重','巧手'].includes(c.trait)&&c.virtue>=50,
    target:c=>pastimePartner(c),
    text:(c,o)=>`${cName(c)}拆开一件旧锦袍，发现里子还好，便邀${cName(o)}一起裁几件小衣。${o.trait==='骄矜'||o.trait==='骄纵'?'对方挑了最亮的滚边，嘴上说不能做得寒酸，手里却一直没停。':'对方把最柔软的一块留下，说孩子贴身穿更舒服。'}`,
    choices:[
      {label:'先给宫里的幼儿备齐冬衣',respond:(c,o)=>{relAdd(c,o,5);return cchg(c,{virtue:2,mood:5})+' · '+cchg(o,{mood:5});}},
      {label:'按旧料裁样，教针线房节用',respond:(c,o)=>chg({treasury:6})+' · '+cchg(c,{talent:2})+' · '+cchg(o,{virtue:2})}
    ]
  }
});
