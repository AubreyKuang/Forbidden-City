/* Small, durable pursuits: the interest stays hers; the purpose can change. */
const LIFE_CRAFTS={
 '读书':{title:'窗下诗笺',work:'诗笺',doing:'校读诗稿、补上小注',ritual:'窗下读一页旧诗',echo:'把夹着旧注的诗笺放在案头，读到熟悉的一页'},
 '抚琴':{title:'四时琴谱',work:'琴谱',doing:'试弹旧曲、记下指法',ritual:'同听一阕旧曲',echo:'照着谱上的指法重弹了一阕旧曲'},
 '刺绣':{title:'花枝绣样',work:'绣样册',doing:'整理针法、描下花样',ritual:'挑一枝时花描样',echo:'照旧绣样做了一个小香囊，特意留下原来的配色'},
 '侍花':{title:'庭前花历',work:'花历',doing:'记下花期、整理养护心得',ritual:'沿旧路看看花',echo:'按花历照看了一盆新苗，在原来的注旁添了一行日期'},
 '做点心':{title:'家常食笺',work:'食笺',doing:'试做点心、记下火候',ritual:'分尝一碟时令点心',echo:'照食笺做了一碟点心，仍用了当年记下的火候'},
 '投壶':{title:'投壶小记',work:'投壶图记',doing:'绘下壶位、整理练习心得',ritual:'并坐看一场投壶',echo:'用图记上的壶位陪家人练习，才明白当年那行提醒'},
 '骑射':{title:'弓马手录',work:'弓马手录',doing:'口述要领、校对图示',ritual:'翻看旧日弓马图',echo:'翻出手录核对练习要领，没有省去当年反复强调的准备'},
 '对弈':{title:'闲窗棋谱',work:'棋谱',doing:'复盘旧局、留下变化',ritual:'重摆一局旧棋',echo:'重摆棋谱里的旧局，终于试出了另一种走法'},
 '品茶':{title:'四时茶记',work:'茶记',doing:'分记茶味、整理水温',ritual:'温一壶当季的茶',echo:'照茶记温了一壶茶，留意到原来圈出的水温'}
};
const LIFE_CHAPTERS=[
 {key:'craft',title:'手中留下的东西',re:/诗笺|琴谱|绣样|食笺|花历|手录|茶记|棋谱|投壶图记|留作|合编/},
 {key:'family',title:'子女与亲缘',re:/孩子|皇子|公主|生母|养母|小产|产下|抚养|身孕|有孕|亲子/},
 {key:'bond',title:'人与人之间',re:/合作|相助|相约|旧约|探望|交情|争执|信任|心结/},
 {key:'loss',title:'离别与牵念',re:/病逝|去世|亡故|薨逝|病故|丧|离宫|省亲/},
 {key:'court',title:'宫中来路',re:/入宫|册|封|冷宫|晋|潜邸|选秀/},
 {key:'days',title:'走过的日子',re:/./}
];
