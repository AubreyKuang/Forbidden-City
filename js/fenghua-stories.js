/* Authored continuations: each decision leaves a persistent consequence and a named record. */
const fenghuaChild=()=>kidsAlive().filter(k=>kidAge(k)>=12&&childCanVisitCourt(k)&&!k.pendingName).sort((a,b)=>b.lit-a.lit)[0];
const fenghuaLady=()=>harem().filter(inPalace).sort((a,b)=>a.mood-b.mood)[0];
const fenghuaCanChild=k=>!!k&&k.alive&&childCanVisitCourt(k)&&kidAge(k)>=12;
const fenghuaCanLady=c=>!!c&&inPalace(c);
function fenghuaTeach(k,field,amount,text){k[field]=clamp((k[field]||0)+amount);kstory(k,text);return `${kidName(k)}${field==='lit'?'才学':'武艺'}有所进益。`;}
function fenghuaFriend(a,b){if(!a||!b)return;if(a.fenghua&&!a.fenghua.friends.includes(b.id))a.fenghua.friends.push(b.id);if(b.fenghua&&!b.fenghua.friends.includes(a.id))b.fenghua.friends.push(a.id);}
function fenghuaDeliverLetter(c,p,amounts){
 const result=cchg(c,amounts),text='收到陛下以薛红笺所制笺纸写来的近况信，信中问候近日心绪，约好亲自相见。';
 (c.story ||= []).push({d:dateStr(),thread:'fenghua:'+p.id,t:text,event:{title:'红笺来信',participants:[{id:c.id,name:fullName(c)},{id:p.id,name:p.name}],situation:'收到一封亲笔近况信。',choice:'亲自写信问候',outcome:text}});
 return fx(result);
}
function fenghuaStoryEvent(p){
 const key=p.fenghuaKey,stage=p.fenghua.stage;if(stage>=3)return fenghuaDailyEvent(p);
 if(key==='shangguanLantai'){
  if(stage===0)return fenghuaEvent(p,'红笔署名','女官初任，送出的校稿却被人抄去署了另一个名字。兰台带来两份底稿，没有哭诉：“我能再写一篇。可若今日不问，下次替谁担错的，也未必是写错的人。”',[
   {t:'核对底稿，恢复她的署名',trust:10,key:'credit',f:()=>{p.fenghua.credit=true;E().wen=clamp(E().wen+2);return '两份底稿当面核对，原署名恢复。她将校书责任也一并签下，今后愿继续直陈文字中的问题。';}},
   {t:'私下赏赐，请她不必追究',trust:-7,key:'silence',f:()=>{p.fenghua.credit=false;return '她收下口谕，仍把底稿封存：“赏赐归赏赐，写过什么，总该留下。”此后交卷时，她会多留一份凭据。';}}
  ]);
  if(stage===1){const k=fenghuaChild();return fenghuaEvent(p,'不替皇嗣落笔',k?`${kidName(k)}的文章送来，请她润色。兰台指着一处生涩的话：“这一句不好，却是孩子自己想的。改成我的句子，陛下会读得舒服，却不知道孩子到底懂了多少。”`:'没有皇嗣到了合适的课业年龄。兰台提出先编一册有错题、有改稿的教材，让日后的学生能看见文章怎样慢慢写成。',[
   {t:k?'让孩子亲自修改，再听她讲评':'准她编教材，留下改稿过程',trust:8,f:()=>{p.fenghua.teaching=true;if(fenghuaCanChild(k)){p.fenghua.student=k.id;return fenghuaTeach(k,'lit',4,'上官兰台没有代笔，陪着自己逐句改完文章。');}E().wen=clamp(E().wen+2);return '教材保留初稿与修改的痕迹，供日后教学。';}},
   {t:'先修成一篇好文章，留作展示',trust:-3,f:()=>{p.fenghua.teaching=false;return '她依旨校成定稿，在卷尾明确注明“奉命润色”，没有把自己的句子说成皇嗣的才学。';}}
  ],{peers:k?[k]:[]});}
  const x=(S.scholars||[]).find(x=>x.storyPerson==='xiean'&&xiePresent(x));return fenghuaEvent(p,'席上敢评诗',`${x?'谢安也来赴这场小型文会。':'宫中小型文会开席。'}一首御制诗被众人争着称好，兰台却停在第三句：“这一句有气象，下一句未必接得住。”她合上诗卷，等你开口。${p.fenghua.credit?'她记得你曾替她恢复署名，所以这次愿意直说。':'她记得署名一事，这一回仍决定把实话说完。'}`,[
   {t:'请她讲清，再一起修改',trust:12,f:()=>{p.fenghua.honestReview=true;E().wen=clamp(E().wen+4);if(x)fenghuaFriend(p,x);return '她指出哪里用力过满，也保留真正动人的句子。文会渐渐有人敢讲实话，兰台把这次改稿珍重地存下。';}},
   {t:'今日宴饮，不必当众评点',trust:-6,f:()=>{p.fenghua.honestReview=false;return '她合卷退回座位。以后会先私呈意见，公开场合不再替你判断诗的好坏。';}}
  ],{peers:x?[x]:[]});
 }
 if(key==='gaoHuaibi'){
  if(stage===0)return fenghuaEvent(p,'功册最后一页','封赏名册已经誊清，高怀璧却请添上一个战死军士的名字。那人违了撤退的号令，折返背出两名伤兵；记功还是记过，军中争执不下。他把自己原拟的赏银数目划去：“先安顿他家里，臣的赏可以晚些。”',[
   {t:'核实救人经过，拨银抚恤（国库20）',cond:()=>E().treasury>=20,why:'国库需有20万两',trust:10,f:()=>{p.fenghua.pension=true;p.merit=clamp(p.merit+10);return '救人的经过另入功册，违令的缘由也如实记下。抚恤送往家中，没有用一场盛宴代替。'+fx(chg({treasury:-20,people:2}));}},
   {t:'先按军律审议，再补抚恤',trust:2,f:()=>{p.fenghua.pension=false;p.merit=clamp(p.merit+4);return '你要求把救人与违令分开审议。他没有反对，只请求每次回奏都抄送一份，免得家属从此等不到消息。';}}
  ]);
  if(stage===1){const doctor=fenghuaPerson('sunYunxiu'),hasDoctor=fenghuaPresent(doctor);return fenghuaEvent(p,'甲下旧伤','校阅时，高怀璧抬臂略慢了一瞬，随后若无其事地把披风扣好。随军医官说旧伤还未长好，他却担心休养会被说成只凭容貌承恩。“臣不怕疼，怕的是让那些人说中了。”',[
   {t:hasDoctor?'请孙云岫会诊，准他休养两个月':'依医官所请，准他休养两个月',peers:hasDoctor?[doctor]:[],cond:()=>!hasDoctor||fenghuaPresent(doctor),trust:10,f:()=>{p.fenghua.rested=true;p.fenghua.awayUntil=S.turn+2;if(hasDoctor&&fenghuaPresent(doctor))fenghuaFriend(p,doctor);return '休养令写明是旧伤复诊，不以失职论处。他终于承认伤处在阴雨天疼得厉害，两个月后再来复命。';}},
   {t:'暂免操演，改核军需文书',trust:5,f:()=>{p.fenghua.rested='desk';p.ability=clamp(p.ability+2);return '他暂留京中核验军需，仍有实事可做。出阵与披甲的差事押后，不拿忍痛作忠诚的凭据。';}}
  ]);}
  return fenghuaEvent(p,'摘下面具以后',`${p.fenghua.rested?'伤后重回校场，':'再一次受召时，'}有人建议绘一幅他的容貌广传京城，称这能振奋军心。高怀璧把面具放在案上：“臣愿领兵，也愿让人看见。只是他们若只记得这张脸，下一回谁还会读功册？”`,[
   {t:'军报记战功，画像由他自己决定',trust:10,f:()=>{p.fenghua.publicFace='choice';p.merit=clamp(p.merit+8);return '军报先记部署、战损与有功者。画像留给他自行处置；他答应留一幅便服小像给家人。'+fx(chg({prestige:2}));}},
   {t:'征得同意后，连同众将一起绘像',trust:6,f:()=>{p.fenghua.publicFace='comrades';return '他答应与同袍一道入画，仍请将阵亡者留在画中。画像旁列全体姓名，京人渐渐也会问他们打过什么仗。'+fx(chg({prestige:3}));}}
  ]);
 }
 if(key==='jiShuye'){
  if(stage===0)return fenghuaEvent(p,'不合时宜的一音','乐工请嵇叔夜删去新曲里那一段沉郁的声调，说宫宴应当只奏太平。他却道：“曲中有人远行，家里的人就不能全都欢喜。陛下若只肯听一半，我便不奏这一首。”',[
   {t:'连同沉郁处一起听完',trust:10,f:()=>{p.fenghua.completeSong=true;E().wen=clamp(E().wen+3);return '琴声落下时，席上静了许久。他没有称颂，只问你听见的是归人，还是等归人的人。';}},
   {t:'另选一首，原曲留待私下',trust:3,f:()=>{p.fenghua.completeSong=false;return '他另选旧谱赴宴，把原曲带回去。临走说，若哪日真想听完，可以只邀三两个人。';}}
  ]);
  if(stage===1){const k=fenghuaChild();return fenghuaEvent(p,'学琴先听风',k?`${kidName(k)}想学一曲可以在宴上得彩的琴。嵇叔夜却让学生先听一刻钟檐下风声。孩子坐不住，他也不斥责，只问：“你想学琴，还是想听掌声？”`:'嵇叔夜愿留下几页指法，却说琴学若只剩下考试，便会失掉耳朵。他想从真正愿意听的人里择徒。',[
   {t:k?'让孩子自己决定，再慢慢学':'准他自行择徒，保留旧谱',trust:8,f:()=>{p.fenghua.teaching=true;if(fenghuaCanChild(k)){p.fenghua.student=k.id;return fenghuaTeach(k,'lit',3,'随嵇叔夜学琴，先听檐下风声，再学辨别曲中情绪。');}E().wen=clamp(E().wen+2);return '旧谱存入书房，择徒由他与学生自己相看，不以门第排次序。';}},
   {t:'只请他留下曲谱，不勉强授课',trust:4,f:()=>{p.fenghua.teaching=false;return '他认真写下指法，另外添了一页如何听音。授课暂缓，约定有心学时再来。';}}
  ],{peers:k?[k]:[]});}
  return fenghuaEvent(p,'归山不是绝交',`${p.fenghua.completeSong?'他记得你曾听完整首曲子。':'他记得那首曲子还有一段没奏。'}如今春山草木新绿，嵇叔夜提出离京一阵。有人劝你用官职留住他，他只将琴囊系好：“愿意再来，与不能离开，是两回事。”`,[
   {t:'赠路费，约好归来再听琴（国库8）',cond:()=>E().treasury>=8,why:'国库需有8万两',trust:12,f:()=>{p.fenghua.awayUntil=S.turn+3;p.fenghua.freeReturn=true;return '他约定三个月后来访。没有留下官印，倒留下了未完的曲谱。'+fx(chg({treasury:-8}));}},
   {t:'不授官，只请再留一月教完旧课',trust:5,f:()=>{p.fenghua.freeReturn=false;return '他答应把约好的旧课教完。你们说明了归期，他仍能自行安排之后的行程。';}}
  ]);
 }
 if(key==='xueHongjian'){
  if(stage===0)return fenghuaEvent(p,'红笺上的别名','京中刊出一册新诗，把薛红笺的两首作品署给一位名士。书坊愿多付润笔，只求她别声张。她把原稿与染坏的纸一齐放下：“原稿在，写坏过的句子也在。做得不够好的地方，我也认。”',[
   {t:'核对原稿，重印并署她的名字',trust:10,f:()=>{p.fenghua.credit=true;return '旧版收回更正，新版写明作者。她只收应得的稿酬，另把几张未染好的笺送来，说这些才看得出手艺怎样练成。'+fx(chg({prestige:1}));}},
   {t:'先促成双方对质，不用御名压书坊',trust:6,f:()=>{p.fenghua.credit='hearing';return '原稿、见过写作过程的伙计与书坊账目一并核验。她愿意等一个有凭据的结果，不借帝王的名字争口舌。';}}
  ]);
  if(stage===1)return fenghuaEvent(p,'花笺不是贡役','宫中想把红笺定为常用笺纸，采买的人却要她一年交齐许多，价钱还按旧例压低。她说：“若这叫恩典，我铺里的人以后就只能替宫里活着。”她仍喜欢自己的小铺，也要付工钱、照看学徒。',[
   {t:'按市价下小单，限额采购（国库12）',cond:()=>E().treasury>=12,why:'国库需有12万两',trust:10,f:()=>{p.fenghua.shopIndependent=true;return '订单写清数量与交期，超额须另议。她保留普通客人的生意，也教会学徒怎样记账。'+fx(chg({treasury:-12,people:1}));}},
   {t:'取消定贡，只在需要时购买',trust:8,f:()=>{p.fenghua.shopIndependent=true;return '常供的名目撤去。她松了口气，说日后想买什么颜色，仍可像寻常客人那样来问。';}}
  ]);
  const c=fenghuaLady();return fenghuaEvent(p,'一封不套话的信',c?`你想给${fullName(c)}送一封漂亮的信，薛红笺却迟迟不肯下笔：“陛下记得她近来为什么高兴、又为什么难过么？若只写花好月圆，换个名字也能送给别人。”`:'薛红笺送来一张没有题字的笺。她说纸可以备好，话仍该由写信的人自己想。',[
   {t:c?'亲自写一件记得的近事':'亲自写下今日所感',trust:10,f:()=>{p.fenghua.personalLetter=true;if(fenghuaCanLady(c)){return '你没有套用现成情诗，只问她近日过得如何，约好亲自去听。'+fenghuaDeliverLetter(c,p,{aff:4,mood:5});}E().wen=clamp(E().wen+2);return '你写下今日亲见的一幕，未必工整，却不再借别人的话代言。';}},
   {t:'先收好素笺，等有话时再写',trust:5,f:()=>{p.fenghua.personalLetter=false;return '她把纸收进防潮的匣里：“不必急着写，真有话的时候，再来找我。”';}}
   ]);
 }
 if(key==='sunYunxiu'){
  if(stage===0)return fenghuaEvent(p,'先看最急的人','宫门外有车夫伤了手，孙云岫因此晚到。值事的人要按失仪责他，他没有求情：“若陛下也是急症，我自然先来。今日伤口等不得的是他。”',[
   {t:'问清伤情，准他先处置急症',trust:10,f:()=>{p.fenghua.triage=true;return '车夫的伤势另交医官跟进。你没有把诊治次序当作是否敬重皇权的试题，他这才展开带来的诊册。'+fx(chg({people:2}));}},
   {t:'请他以后先遣人通报，急症仍先看',trust:6,f:()=>{p.fenghua.triage='message';return '往后若临时救治急症，随行者先来通报，既不误伤者，也不让宫中无故等候。';}}
  ]);
  if(stage===1)return fenghuaEvent(p,'药价之外','孙云岫带来义诊账簿。药材花费并不算最多，真正让病人不敢来的，是停工一天便断一天口粮。他问能否拨一笔钱，先给病者两三日安心养病的余地。',[
   {t:'拨银设临时义诊与病粮（国库25）',cond:()=>E().treasury>=25,why:'国库需有25万两',trust:10,f:()=>{p.fenghua.clinic=true;return '药粮分账，领用要留名，也允许识字的病者核对。他答应定期回报花在何处。'+fx(chg({treasury:-25,people:4}));}},
   {t:'先试办小额义诊，逐月核账（国库10）',cond:()=>E().treasury>=10,why:'国库需有10万两',trust:6,f:()=>{p.fenghua.clinic='trial';return '先开一处小诊棚，账册逐月核验。规模不大，仍开始有人敢来复诊。'+fx(chg({treasury:-10,people:2}));}},
   {t:'国库暂难支应，保留方案待议',trust:-2,f:()=>{p.fenghua.clinic=false;return '他收好账册，回到原来的义诊处。没有承诺做不到的规模，也没有把病人写成一串数字。';}}
  ]);
  const c=harem().find(c=>inPalace(c)&&consortRecovery(c));return fenghuaEvent(p,'不肯报喜的诊脉',c?`${fullName(c)}仍在调养，有人希望医者早些说“已无大碍”。孙云岫却按原定休养时间写下复诊日期：“病人盼着快好，我也盼。可盼着，不等于已经好了。”`:'近来起居繁忙，孙云岫问完作息，没有献上所谓立见奇效的方子，只把复诊与休息逐项写明。',[
   {t:'按实情安排调养，两个月后复诊',trust:10,f:()=>{p.fenghua.followup={patient:c?.id||'emp',gen:S.gen,due:S.turn+2};return '复诊日期已记下。原有的产后或病后静养安排照常，不因一纸口谕提前结束。';}},
   {t:'请太医院共同会诊，保留他的意见',trust:7,f:()=>{p.fenghua.followup={patient:c?.id||'emp',gen:S.gen,due:S.turn+2};p.fenghua.coConsult=true;return '不同意见一并写入诊册，会诊后仍按实际情况休养，两个月后再核对变化。';}}
  ],{peers:c?[c]:[]});
 }
 if(key==='liuZhaoshuang'){
  if(stage===0)return fenghuaEvent(p,'车上的人先开口','有人送来一封匿名告状信，说柳照霜与拦路者原是一伙。她交出护送文契，请你先问车上的行旅：“若只因我佩剑便信我，或只因我佩剑便疑我，都不算查过。”',[
   {t:'查验文契，分别询问当事人',trust:10,f:()=>{p.fenghua.cleared=true;return '行旅、渡口记簿与契约相互核对，护送经过没有矛盾。匿名信不能证明勾连，查验结果记入纪事。';}},
   {t:'请锦衣卫留意线索，暂不扣人',cond:()=>jinyiweiCommanderReady(),why:'尚未设立有指挥使在任的锦衣卫',trust:5,f:()=>{p.fenghua.cleared='watch';story(S.jinyiwei.commander,'奉命留意柳照霜护送一事的可核实线索，不因匿名传言扣人。');return '查验请求交给在任指挥使，柳照霜仍可照约护送。没有把这份请求写成已经查实的罪证。';}},
   {t:'先听她与行旅一起说明经过',trust:6,f:()=>{p.fenghua.cleared='heard';return '你把能核实的路程与仍待查的说法分开记下，不让匿名传言直接替人定罪。';}}
  ]);
  if(stage===1){const x=(S.scholars||[]).find(x=>x.storyPerson==='xiean'&&xiePresent(x));return fenghuaEvent(p,'渡口的旧朋友',x?'谢安与柳照霜在渡口相遇，相互认出旧日同舟的人。旁人立即把这件事说成他结交某个门派。柳照霜笑了一声：“他那时连船钱都忘了带，是借我的。若这也算结党，掌柜的账本怕比名册厚。”':'柳照霜收到江湖旧友的来信，托她问一条回乡的路。她坦然摊开信：“我有朋友，不意味着每个朋友做什么，我都知道。”',[
   {t:'问旧交的来由，不把往来当成罪名',trust:10,f:()=>{p.fenghua.oldFriends=true;if(x)fenghuaFriend(p,x);return x?'同舟与借船钱的经过被说清。谢安承认旧交，未因此被强加门派身份；两人也记住了这次不带猜忌的询问。':'她说清自己知道的部分，余下的没有装作了解。往来可记，传闻仍待凭据。';}},
   {t:'提醒涉公务须回避，私交如实登记',trust:6,f:()=>{p.fenghua.oldFriends='disclose';if(x)fenghuaFriend(p,x);return '涉及同一件公事时先说明私交，另找无关者核验。私交保留，查事的规矩也讲清了。';}}
  ],{peers:x?[x]:[]});}
  return fenghuaEvent(p,'留剑还是留人','宫中有人想给柳照霜一份长久差事。她认真看过职责，却在最后一行停下：“若接了，我就该守约。若不接，也不想让陛下觉得先前的相识都算白费。”',[
   {t:'以短期护送相邀，约满可自行离去',trust:10,f:()=>{p.fenghua.role='护送剑客';p.fenghua.contract='season';return '约定只写具体差事与期限，她愿在京中停留，日常仍可交游。以后也可以请她指点骑射。';}},
   {t:'让她继续行走，约好来京再见',trust:12,f:()=>{p.fenghua.role='江湖剑客';p.fenghua.contract='free';p.fenghua.awayUntil=S.turn+3;return '她约三个月后再来，临行留下可转递书信的铺号。没有领宫牌，这段交情仍然在。';}}
  ]);
 }
 return null;
}
function fenghuaDailyEvent(p){
 const key=p.fenghuaKey,k=fenghuaChild(),c=fenghuaLady(),options=[],peers=[];let title,text;
 if(key==='shangguanLantai'){
  title='校书灯下';text=p.fenghua.honestReview?'兰台把一段诏稿中容易误解的用语圈出，仍像上次文会那样直言。':'兰台把修改意见私下附在卷后，等你愿意细看时再解释。';
  options.push({t:'一起校阅，听她说明理由',trust:2,f:()=>{E().wen=clamp(E().wen+2);return '几处含混的句子被改清，你也记下了她判断的缘由。';}});
 }else if(key==='gaoHuaibi'){
  title='校场边的闲话';text='高怀璧看过操演，谈的不是自己如何得胜，而是哪一队的新兵脚步乱、哪一件旧甲该修。';
  options.push({t:'听取操演建议，交兵部核议',trust:2,f:()=>{E().wu=clamp(E().wu+2);p.merit=clamp(p.merit+2);return '操演建议按实记录，兵部可以据此核议，不另虚报一场战功。';}});
 }else if(key==='jiShuye'){
  title='旧谱新声';text='嵇叔夜带来旅途中补写的一小段琴谱。他问你想听一遍，还是愿意自己试着辨出其中的变化。';
  options.push({t:'静听一曲，辨别新旧两段',trust:2,f:()=>{E().wen=clamp(E().wen+2);return '他没有考校对错，只把你听到的意思记在谱旁。';}});
  if(k){options.push({peers:[k],t:`请${kidName(k)}来听讲`,cond:()=>fenghuaCanChild(k),trust:2,f:()=>fenghuaTeach(k,'lit',2,'再听嵇叔夜讲琴，学着分辨曲意。')});}
 }else if(key==='xueHongjian'){
  title='今日什么颜色';text='薛红笺送来几种新染的笺，先问要写给谁、有什么真正想说的话。铺中的新学徒已经能独自记账了。';
  if(c){options.push({t:`为${fullName(c)}写一封近况信`,cond:()=>fenghuaCanLady(c),trust:2,f:()=>`信中询问近况，约好有空亲自相见。${fenghuaDeliverLetter(c,p,{aff:2,mood:3})}`});}
  options.push({t:'留一张素笺，自己练习题诗',trust:2,f:()=>{E().wen=clamp(E().wen+2);return '她只指点用字，不替你写最后一行。';}});
 }else if(key==='sunYunxiu'){
  title='例行复诊';text=p.fenghua.followup?'先前约定的复诊尚未到期，孙云岫问你这几日是否按时休息。':'孙云岫询问近期起居，将记录与上次相对照，再约复诊。';
  options.push({t:'如实说明作息，约下次复诊',trust:2,f:()=>{p.fenghua.followup ||= {patient:'emp',gen:S.gen,due:S.turn+2};return '复诊仍按已约日期进行，不因反复询问而提前。';}});
  const patient=harem().find(x=>inPalace(x)&&consortRecovery(x));if(patient&&!p.fenghua.followup){options.push({peers:[patient],t:`请他与太医看望${fullName(patient)}`,cond:()=>fenghuaCanLady(patient)&&!!consortRecovery(patient)&&!p.fenghua.followup,trust:3,f:()=>{p.fenghua.followup={patient:patient.id,gen:S.gen,due:S.turn+2};return '会诊安排记下，原定静养期限照常，不催她提前恢复侍寝。';}});}
 }else{
  title='不用争胜的一课';text='柳照霜把剑收在鞘里，只教如何站稳、如何在没有把握时退一步。她说护送人回家，比当众赢一场更费心。';
  options.push({t:'亲自请教，练一回步法',trust:2,f:()=>{E().wu=clamp(E().wu+2);return '练过才知道，能进能退比摆出漂亮姿态更难。';}});
  if(k){options.push({peers:[k],t:`请她指点${kidName(k)}的骑射基本功`,cond:()=>fenghuaCanChild(k),trust:2,f:()=>fenghuaTeach(k,'mar',2,'柳照霜指点基本功，叮嘱不为争胜逞险。')});}
 }
 options.push({t:'只谈谈近况，今日不劳烦',trust:1,result:`你听${p.name}谈完近况，约了有空再见。`});
 return fenghuaEvent(p,title,text,options,{peers,advance:false});
}
