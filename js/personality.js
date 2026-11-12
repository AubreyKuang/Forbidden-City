/* ============ 人物立体：小性子、喜好、心愿、往事、记忆 ============ */
const QUIRKS={
 '嗜甜':['她把一碟桂花糖推到你面前，自己先拈了两块：“陛下尝尝，御膳房新做的。”','太医说她再吃甜的牙要坏了，她嘴上应着，袖子里还藏着一包松子糖。'],
 '怕雷':['她说小时候一打雷，奶娘就把她搂在怀里念《心经》。如今听见雷声，她还是会发抖。','她问你夏天什么时候过去，说一到雷雨季就睡不好。'],
 '爱猫':['她怀里的狸花猫冲你“喵”了一声。她笑：“它认得陛下呢。”','她宫里的猫又把绣绷扯烂了。她舍不得罚猫，只罚自己少吃了一碗饭。'],
 '路痴':['她进宫几年了，还常在长街上走岔路，宫女们早就习惯了跟在后头提醒。','她说宫里每道门都长得一样，她是数着门钉认路的。'],
 '好胜':['她拉着你下棋，输了一局便不依不饶，非要再下三局。','她听说别宫的小主投壶十中八，回来练到手腕都肿了。'],
 '念旧':['她妆奁里还收着入宫那年你随手赏的一枚银簪，擦得锃亮。','她记得你们第一次说话那天在下雨，连你穿的哪件衣裳都记得。'],
 '嘴硬心软':['她嘴上说“陛下爱去哪儿去哪儿”，可你每次来，她宫里总温着你爱喝的茶。','她嫌你批折子太晚，转头又让小厨房炖了参汤送去乾清宫，还不许说是她送的。'],
 '爱哭':['说着说着她眼圈就红了，自己也笑：“臣妾就是这样没出息。”','她看话本看到伤心处，哭得帕子湿了两条。'],
 '贪睡':['你来时已近午时，她才睡眼惺忪地起身，头发还乱着。','她说最好的日子，是落雪的早上不用去请安，可以睡到自然醒。'],
 '护短':['她听说有人背后编排她宫里的小宫女，当即带人找上门去，回来还气鼓鼓的。','她宫里的人犯了错，她关起门来骂，出了门却一句不许别人说。'],
 '记仇':['她慢悠悠地剥着橘子：“谁对臣妾好，谁给臣妾使绊子，臣妾都记着呢。”','她说她有个小本子，谁欠她的都写在上面。你问写了陛下没有，她笑而不答。'],
 '好读史':['她案上摊着一卷《汉书》，正读到班婕妤那篇。','她说读史读多了，就觉得宫里的事，前朝早都演过一遍了。'],
 '信佛':['她每日抄一卷《金刚经》，说要为陛下祈福。','她小佛堂里的长明灯，从入宫那天起就没灭过。'],
 '擅厨艺':['她亲手做了一碗鸡丝馄饨，汤清味鲜，你一连吃了两碗。','她说她娘做的腌笃鲜天下第一，她只学到了七分。'],
 '直言':['她说话从不拐弯，连你新换的龙袍颜色不好看都直说了。','她说她宁可说真话被罚，也不想说假话讨赏。'],
 '擅舞':['她赤足在殿中为你跳了一段《绿腰》，裙裾翻飞如蝶。','她说跳舞的时候，什么烦心事都忘了。'],
 '畏寒':['才入秋她就裹上了狐裘，手炉一刻不离。见你来了，她把手炉塞进你怀里。'],
 '擅骑射':['她说宫里最闷的就是不能骑马，南苑那几匹马她都偷偷喂过。'],
};
const LIKES=['诗书','琴谱','字画','珠翠','绸缎','花草','点心','香料','佛经','弓马'];
const GIFTN={'诗书':'一套宋版诗集','琴谱':'一卷失传的古琴谱','字画':'一幅前朝名家山水','珠翠':'一匣东珠点翠头面','绸缎':'十匹江南云锦','花草':'一盆十八学士茶花','点心':'御膳房新制的八珍糕','香料':'一盒南海龙涎香','佛经':'一部泥金《法华经》','弓马':'一匹西域小红马'};
const WISHES={
 mother:{t:'想再见母亲一面',btn:'接她母亲入宫小住（国库-15万两）',f:c=>{chg({treasury:-15});momVisit(c,ri(2,3));return '她母亲进宫来了，要在宫里住上几个月。母女俩一见面就抱头哭了。'}},
 father:{t:'想为父亲求一个清白名声',btn:'下旨褒奖她父亲（威望-2）',f:c=>{chg({prestige:-2});c.fam.p=Math.min(95,c.fam.p+8);return '圣旨送到她老家，她父亲跪在门口，哭得像个孩子。'}},
 child:{t:'想要一个孩子',btn:null},
 south:{t:'想去江南看一眼',btn:'带她南巡（国库-150万两，龙体-2）',f:c=>{chg({treasury:-150,health:-2,people:2});return '烟雨江南，画舫笙歌。她靠在船舷上说，这辈子值了。'}},
 title:{t:'想要一个属于自己的封号',btn:'赐她封号',cond:c=>!c.title,f:c=>{c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)));return `你赐她「${c.title}」字为号。她把那个字写了一遍又一遍。`}},
 ride:{t:'想学骑马',btn:'亲自教她骑马（精力-1）',cond:()=>E().energy>0,f:c=>{E().energy--;c.t2='擅骑射';return '她在南苑摔了三回，第四回终于稳稳地跑完一圈，回头冲你笑。'}},
 cat:{t:'想养一只猫',btn:'送她一只狮子猫（国库-2万两）',f:c=>{chg({treasury:-2});c.t2='爱猫';return '雪白的狮子猫一进门就钻进了她怀里。她给它起名叫“团圆”。'}},
 fire:{t:'想看一场烟火',btn:'上元夜放烟火（国库-40万两）',f:c=>{chg({treasury:-40});harem().forEach(o=>o.mood=clamp(o.mood+5));return '火树银花不夜天。她仰着头，烟火映在她眼睛里。'}},
 poem:{t:'想要陛下亲笔写的诗',btn:'为她写一首诗（精力-1）',cond:()=>E().energy>0,f:c=>{E().energy--;return '你写了四句，字不算好，诗也平平。她却裱起来挂在了床头。'}},
 brother:{t:'想为早夭的弟弟立个牌位',btn:'准她在宫中设牌位（国库-5万两）',f:c=>{chg({treasury:-5});return '她在小佛堂里给弟弟上了一炷香，说：“他要是活着，今年该十五了。”'}},
};
const WOUNDS={
 mom:'幼年丧母，是继母带大的。她说从那以后，就学会了看人脸色。',
 sister:'在家时处处被嫡姐压一头，连入宫都是替嫡姐来的。',
 engaged:'入宫前曾许过人家，那家公子在她入宫前一个月病死了。',
 fall:'家道中落，入宫前随母亲寄人篱下，冬天连炭都分不到。',
 lost:'小时候被拐子拐走过，三天后才被找回来，至今不敢一个人走夜路。',
 scorn:'因为出身低，选秀时被嬷嬷当众嘲笑过，她一直记得那天。',
};
const MEMT={
 first:['她忽然问你，还记不记得她第一次侍寝那晚。她说自己紧张得一夜没敢翻身。'],
 hurt:['她低头拨着茶盏：“那年的事，臣妾早不怪陛下了。”可她的手在发抖。','“那天臣妾在廊下站了一夜。”她说得很轻，像在说别人的事。'],
 promo:['她摸着衣襟上新绣的纹样，说晋位那天她偷偷给家里写了信，写了三页纸。'],
 saved:['“冷宫里那几个月，臣妾以为这辈子就那样了。”她握着你的手，“是陛下把臣妾拉出来的。”'],
 bday:['她说那年陛下记得那个日子，是她进宫以来最高兴的一天。'],
 neglect:['她淡淡地说：“臣妾病着那阵子，陛下一次也没来。也是，陛下忙。”'],
 care:['她说起那回的事，眼睛亮亮的：“陛下那天来了，臣妾一辈子都记得。”'],
 child:['她说起孩子出生那夜，疼得以为自己要死了，听见第一声啼哭，又什么都忘了。'],
 gift:['她今天戴的，正是你上回赏的东西。'],
 wish:['她说，从前许的那个愿，陛下替她圆了。她以为这种事只会出现在话本里。'],
};
const HISTC={
 '黄河决堤':'她说起汉武帝瓠子堵口，天子亲临，百官负薪。“陛下若肯亲往，民心必附。”',
 '北境告急':'她说汉初和亲六十年，才攒出卫青、霍去病的家底。“打与不打，都得先算清粮草。”',
 '盐政':'她说桑弘羊盐铁官营，国库是满了，可《盐铁论》里那些贤良文学骂了他几十年。',
 '殿试':'她说唐太宗看新科进士鱼贯而出，笑说“天下英雄入吾彀中矣”。',
 '御史弹劾':'她说起董宣“强项令”，宁死不向湖阳公主低头。“这样的臣子，陛下要留着。”',
 '蝗灾':'她说唐太宗生吞蝗虫，说“宁食朕之肺肠”。“虽有作秀之嫌，百姓却记了一千年。”',
 '立木为信':'她说商鞅立木为信，新法才推得下去；可他最后也死在自己的法里。',
 '治安疏':'她说海瑞上疏前买好了棺材。“嘉靖骂了他，到底也没杀他。”',
 '杯酒释兵权':'她说宋太祖一杯酒卸了兵权，换来的却是三百年积弱。“万事都有代价。”',
 '金丹':'她轻声说：“秦皇汉武，求了一辈子仙，谁也没能长生。陛下别信那些。”',
 '开凿运河':'她说隋炀帝开运河，骂名背了千年，可那条河如今还在走船。',
 '文字狱':'她说：“清风不识字，何故乱翻书——为一句诗杀人，诗没了，人心也没了。”',
};
const woundOK=(c,w)=>!((w==='scorn'&&c.fam.p>=30)||(w==='fall'&&c.fam.p>=55));
const wishOK=(c,w)=>!(w==='father'&&c.fam.p>=60);
function deepen(c){if(!c)return;
  if(c.t2===undefined){c.t2=pick(Object.keys(QUIRKS));c.like=pick(LIKES);let h=pick(LIKES);while(h===c.like)h=pick(LIKES);c.hate=h;c.kl=false;
    c.wish=pick(Object.keys(WISHES).filter(w=>wishOK(c,w)));c.wishKnown=false;c.wishDone=false;c.wound=pick(Object.keys(WOUNDS).filter(w=>woundOK(c,w)));c.woundKnown=false;c.mem=c.mem||[]}
  if(!woundOK(c,c.wound))c.wound=pick(Object.keys(WOUNDS).filter(w=>woundOK(c,w)));
  if(!c.wishDone&&!wishOK(c,c.wish))c.wish=pick(Object.keys(WISHES).filter(w=>wishOK(c,w)));
  if(c.wish==='title'&&c.title)c.wishDone=true}
function remember(c,k,t){
  if(!c)return;
  const negative=k==='hurt'||k==='neglect';
  NPCMemory.record(S,{type:k,time:S.turn,location:c.palace,participants:[c.id],outcome:t},[
    {person:c.id,subject:'emperor',interpretation:t,emotion:negative?-.9:.85,impact:85}
  ]);
}
function rememberQuarrel(a,b,winner){
  NPCMemory.record(S,{type:'quarrel',time:S.turn,location:'御前',
    participants:[a.id,b.id],object:'蜀锦',outcome:winner??'both'},
    [[a,b],[b,a]].map(([person,other])=>({
      person:person.id,subject:other.id,impact:90,
      emotion:winner===other.id?-.95:winner===person.id?-.65:-.45,
      interpretation:`我与${fullName(other)}争蜀锦，${winner===person.id?'陛下判给了我':winner===other.id?'陛下判给了她':'陛下各赏一匹'}`
    })));
}
function deepLine(c){deepen(c);if(c.wish==='title'&&c.title&&!c.wishDone){c.wishDone=true}const w=WISHES[c.wish];
  return `<div style="margin-top:4px">小性子：<span class="tag">${c.t2}</span>　喜好：${c.kl?`<span class="tag g">${c.like}</span>不喜<span class="tag r">${c.hate}</span>`:'<span class="hint">多闲谈才知道</span>'}</div>
  <div>心愿：${c.wishKnown?`${esc(w.t)}${c.wishDone?' <span class="tag y">已成全</span>':w.btn?` <button class="btn sm jade" onclick="A.wish(${c.id})">${esc(w.btn)}</button>`:' <span class="hint">（生下孩子便成全了）</span>'}`:'<span class="hint">情分到 50 以后，闲谈时她也许会说</span>'}</div>
  ${c.woundKnown?`<div>往事：${esc(WOUNDS[c.wound])}</div>`:'<div class="hint">往事：情分到 65 以后，她也许会对你说起</div>'}`}
A.chat=function(id){const c=byId(id);if(!c||!useE())return;deepen(c);const L=[];const xk=xinOf(c);
  if(xk!=='平和')L.push(cName(c)+xinLine(c));else L.push(c.mood<30?pick([`${cName(c)}眼圈微红，像是刚哭过，见你来了忙低头拭泪。`,`${cName(c)}恹恹地靠在榻上，见你来了才勉强起身。`]):c.mood>80?pick([`${cName(c)}老远就迎了出来，笑意藏都藏不住。`,`${cName(c)}正哼着小曲修剪花枝，见你来了，剪子一丢就过来行礼。`]):pick([`${cName(c)}正在窗下做针线。`,`${cName(c)}在廊下逗鹦鹉。`,`${cName(c)}刚沏好一壶茶。`,`${cName(c)}在灯下翻一卷书。`]));
  L.push(chance(.45)?pick(QUIRKS[c.t2]):pick(CHAT[c.trait]||CHAT['温婉']));
  if(S.flags.lastCourt&&(c.t2==='好读史'||c.t2==='直言')&&chance(.6))L.push(c.t2==='好读史'?`她听说了「${S.flags.lastCourt}」的事。${HISTC[S.flags.lastCourt]||'她说：“以史为镜，可以知兴替。”'}`:`她听说了「${S.flags.lastCourt}」的事，直截了当地说：“陛下那样处置，${pick(['臣妾觉得不妥。','臣妾觉得极好。','怕是要挨骂的。'])}”`);
  const others=harem().filter(o=>o!==c).map(o=>[o,relGet(c,o)]),fr=others.filter(x=>x[1]>=30),en=others.filter(x=>x[1]<=-30);
  if(fr.length&&chance(.35)){const o=pick(fr)[0];L.push(`说起${cName(o)}，她眉眼都软了：“${pick(['她前儿送了我一盒胭脂，颜色正好。','我们约好了，开春一起去放纸鸢。','她做的梅花糕，比御膳房的还好吃。','她病的那几天，是我守着的。'])}”`)}
  else if(en.length&&chance(.4)){const o=pick(en)[0];L.push(`提到${cName(o)}，她的脸色淡了下来：“${pick(['她那张嘴，臣妾不想提。','前儿请安，她当着众人的面给臣妾难堪。','陛下还是少去她那儿吧——臣妾随口一说。'])}”${c.t2==='记仇'?'她顿了顿：“这笔账臣妾记着。”':''}`)}
  const kid=S.children.filter(k=>(k.mom===c.id||k.foster===c.id)&&k.alive);
  if(kid.length&&chance(.4)){const k=pick(kid),a=kidAge(k),bond=k.motherBonds?.[c.id];
    L.push(bond?.motherView&&S.turn-bond.turn<=6?`说起${k.name}，她想起近来的一件事。 ${bond.motherView}`:
      `说起${k.name}，她滔滔不绝：“${a<3?'昨儿会叫“父皇”了，含含糊糊的，可把臣妾高兴坏了。':a<10?'太傅说背书快，就是坐不住。':'孩子大了，心思也多了，臣妾有时都猜不透。'}”`)}
  const memories=NPCMemory.recall(S,c.id).map(entry=>({k:entry.type,t:entry.interpretation}));
  const dialogueMemories=memories.concat(c.mem||[]).filter(m=>MEMT[m.k]||m.k==='hurt');
  if(dialogueMemories.length&&chance(.3)){const m=pick(dialogueMemories);if(c.t2==='记仇'&&m.k==='hurt')L.push('她似笑非笑：“那年的事，臣妾可一直记着呢。”');else if(MEMT[m.k])L.push(pick(MEMT[m.k]))}
  let rev='';
  if(!c.kl&&chance(.35)){c.kl=true;rev+=`\n她随口说起，自己最喜欢${c.like}，最烦${c.hate}。`}
  if(c.aff>=50&&!c.wishKnown&&chance(.5)){c.wishKnown=true;rev+=`\n她犹豫了很久，小声说出一个心愿：${WISHES[c.wish].t}。`;story(c,`对陛下说出心愿：${WISHES[c.wish].t}。`)}
  else if(c.aff>=65&&!c.woundKnown&&chance(.5)){c.woundKnown=true;rev+=`\n夜深了，她第一次说起从前的事：${WOUNDS[c.wound]}`;story(c,'第一次对陛下说起入宫前的往事。')}
  const sch=harem().filter(x=>x!==c&&x.scheme>=65&&!x.known);
  if(c.aff>=50&&sch.length&&chance(.25)){const x=pick(sch);x.known=true;rev+=`\n她压低声音：“${cName(x)}那边，陛下还是留个心眼好。”（${cName(x)}的心机已显露：${rd(x.scheme)}）`}
  if(NEGX.includes(xk)){const p={'思念':.8,'委屈':.6,'惶恐':.55,'嫉恨':.25,'悲恸':.3,'怨恨':.12,'心如死灰':.1}[xk]+c.aff/400;if(chance(p)){const nk=xk==='思念'?'欢喜':'释然';setXin(c,nk,'陛下陪她说了许久的话');rev+=`\n§心境：${xk} → ${nk}`}else rev+=`\n§她的心境仍是「${xk}」`}
  const s=cchg(c,{aff:c.trait==='痴情'?8:5,mood:8,favor:2});
  story(c,`陛下驾临闲话。${L[1]}`);setScene('harem');
  pushEv({title:'闲话家常',por:c,text:L.join('\n')+rev+fx(s),choices:[ok1]})};
A.gift=function(id){const c=byId(id);deepen(c);if(E().treasury<20){toast('国库不足');return}
  let opts=shuffle(LIKES).slice(0,4);if(c.kl&&!opts.includes(c.like))opts[0]=c.like;
  pushEv({title:'赏赐',por:c,text:`赏${cName(c)}些什么好？（每样国库-20万两）${c.kl?`\n你记得她喜欢${c.like}，不喜${c.hate}。`:'\n你还不知道她喜欢什么。'}`,choices:[...opts.map(g=>({t:GIFTN[g],f:()=>giveGift(c,g)})),{t:'算了'}]})};
function giveGift(c,g){chg({treasury:-20});AU.sfx('coin');if(g==='绸缎')c.robeC=pick(RPAL[rTier(c.rank)]);
  if(g===c.like){c.kl=true;remember(c,'gift',GIFTN[g]);setXin(c,'欢喜',`得了心爱的${g}`);story(c,`陛下赏了${GIFTN[g]}，正是她心头所好。`);return `她眼睛一亮，捧在手里看了又看。${fx(cchg(c,{mood:25,aff:8}))}\n§你记住了：她喜欢${g}`}
  if(g===c.hate)return `她谢了恩，笑容却有些勉强。宫女悄悄说，主子向来不喜${g}。${fx(cchg(c,{mood:-5}))}`;
  const big=c.trait==='贪财'&&(g==='珠翠'||g==='绸缎');story(c,`陛下赏了${GIFTN[g]}。`);return `她欢欢喜喜地谢了恩。${fx(cchg(c,{mood:big?20:10,aff:3}))}`}
A.wish=function(id){const c=byId(id),w=WISHES[c.wish];if(!w||!w.btn||c.wishDone)return;if(w.cond&&!w.cond(c)){toast('眼下还办不到');return}
  const t=w.f(c);c.wishDone=true;setXin(c,NEGX.includes(xinOf(c))?'释然':'欢喜',`心愿「${w.t}」得偿`);remember(c,'wish',w.t);story(c,`陛下成全了她的心愿：${w.t}。`);log(`帝成全${fullName(c)}的心愿：${w.t}。`);
  pushEv({title:'成全',por:c,sfx:'joy',text:t+fx(cchg(c,{aff:22,mood:30})),choices:[ok1]})};

/* ============ 小性子引出的宫中琐事 ============ */
const QEV={
 '怕雷':c=>season()!==1?null:{title:'雷雨夜',por:c,text:`半夜电闪雷鸣，${c.palace}的宫女冒雨跑来乾清宫：“我们小主吓得缩在床角，谁也不让碰。”`,choices:[
   {t:'披衣过去陪她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();remember(c,'care','雷雨夜');story(c,'雷雨夜，陛下冒雨来陪她，握着她的手到天亮。');return fx(cchg(c,{aff:12,mood:15}))}},
   {t:'让太医送安神汤过去',f:()=>fx(cchg(c,{mood:3}))}]},
 '爱猫':c=>{const o=pick(harem().filter(x=>x!==c));if(!o)return null;return {title:'猫祸',por:c,text:`${cName(c)}养的猫溜进${o.palace}，抓破了${cName(o)}一件新做的蜀锦衣裳。${cName(o)}抱着破衣裳哭到了你跟前。`,choices:[
   {t:`让${cName(c)}赔一件新衣`,f:()=>{relAdd(c,o,-4);return fx(cchg(c,{mood:-5}),cchg(o,{mood:6}))}},
   {t:'把猫送出宫去',f:()=>{relAdd(c,o,-15);c.t2='念旧';remember(c,'hurt','猫被送走');story(c,'她的猫被送出了宫，她哭了一整天。');return fx(cchg(c,{mood:-25,aff:-8}),cchg(o,{mood:10}))}},
   {t:'打个圆场，各赏一匹新料子',f:()=>{relAdd(c,o,3);return fx(chg({treasury:-10}),cchg(c,{mood:3}),cchg(o,{mood:5}))}}]}},
 '路痴':c=>{const cold=alive().find(x=>x.cold);return {title:'迷路',por:c,text:`${cName(c)}从御花园回宫时又走岔了路，${cold?`一路走到冷宫门口，还和里面的${cold.sur}庶人隔着门说了半天话。`:'在西长街转了半个时辰，最后被巡夜的侍卫送了回来。'}`,choices:[
   {t:'笑她：“改日给你画张宫城图。”',f:()=>{remember(c,'care','陛下要给她画宫城图');return fx(cchg(c,{aff:5,mood:8}))}},
   ...(cold?[{t:'问她冷宫里那人说了什么',f:()=>`她说，${cold.sur}庶人瘦得厉害，只托她带一句话：“问陛下安。”${fx(cchg(cold,{mood:5}))}`}]:[]),
   {t:'罚她身边的宫女不尽心',f:()=>fx(cchg(c,{mood:-6}))}]}},
 '好胜':c=>{const o=pick(harem().filter(x=>x!==c&&x.talent>=50));if(!o)return null;return {title:'对弈',por:c,text:`${cName(c)}与${cName(o)}在御花园对弈，从晌午下到天黑，谁也不肯认输，两边的宫女都站麻了腿。`,choices:[
   {t:`判${cName(c)}胜`,f:()=>{relAdd(c,o,-3);return fx(cchg(c,{mood:15}),cchg(o,{mood:-6}))}},
   {t:'判和局',f:()=>{relAdd(c,o,4);return '两人对视一眼，都笑了。'}},
   {t:'亲自下场，各杀一盘（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();return `你连赢两盘，${cName(c)}不服气，缠着你又下到三更。${fx(cchg(c,{aff:6}),cchg(o,{aff:4}))}`}}]}},
 '念旧':c=>({title:'旧物',por:c,text:`今天是${cName(c)}入宫的日子。她不提，却在桌上摆了一碟你们第一次见面时吃过的点心。`,choices:[
   {t:'“朕也记得。”',f:()=>{remember(c,'bday','入宫的日子');return fx(cchg(c,{aff:10,mood:12}))}},{t:'没留意',f:()=>fx(cchg(c,{mood:-8}))}]}),
 '嘴硬心软':c=>({title:'参汤',por:c,text:'你批折子到三更，小太监端来一碗参汤，说是御膳房送的。你尝了一口，里面加了枸杞——御膳房从不这么做。',choices:[
   {t:`去${c.palace}道谢`,f:()=>`她扭过头：“谁送的谁知道，反正不是臣妾。”耳根却红了。${fx(cchg(c,{aff:8,mood:10}),chg({health:1}))}`},{t:'喝完便睡',f:()=>fx(chg({health:1}))}]}),
 '贪睡':c=>{const em=empress();if(!em||em===c)return null;return {title:'请安迟了',por:c,text:`${cName(c)}又睡过了头，晨昏定省迟了半个时辰。皇后罚她在坤宁宫外站了一炷香。`,choices:[
   {t:'后宫之事，皇后做主',f:()=>{relAdd(c,em,-6);return fx(cchg(c,{mood:-8}),cchg(em,{aff:3}))}},{t:'替她求个情',f:()=>{relAdd(c,em,-3);return fx(cchg(c,{aff:6}),cchg(em,{mood:-6}))}}]}},
 '护短':c=>{const ally=harem().find(o=>o!==c&&relGet(c,o)>=30);if(!ally)return null;const bully=harem().find(o=>o!==c&&o!==ally&&relGet(ally,o)<=-20);if(!bully)return null;
   return {title:'护短',por:c,text:`${cName(bully)}在长街上训斥${cName(ally)}，${cName(c)}恰好路过，二话不说挡在前头：“要罚她，先罚我。”`,choices:[
   {t:`赞${cName(c)}仗义`,f:()=>{relAdd(c,ally,10);relAdd(c,bully,-15);return fx(cchg(c,{aff:4}),cchg(ally,{mood:8}),cchg(bully,{mood:-10}))}},
   {t:'三人都罚俸一月',f:()=>{[c,ally,bully].forEach(x=>cchg(x,{mood:-5}));return '三人都闭了嘴。'}}]}},
 '擅厨艺':c=>({title:'小厨房',por:c,text:`${cName(c)}亲手做了四样小菜，派人来问陛下今晚得不得空。`,choices:[
   {t:'去（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();remember(c,'care','来吃了她做的菜');return fx(cchg(c,{aff:8,favor:5,mood:10}),chg({health:2}))}},{t:'让她把菜送来乾清宫',f:()=>fx(cchg(c,{mood:4}),chg({health:1}))}]}),
 '信佛':c=>E().health>=70?null:{title:'抄经',por:c,text:`听说陛下龙体欠安，${cName(c)}在小佛堂跪着抄了七日《药师经》，膝盖都跪青了。`,choices:[
   {t:'去看她',f:()=>{remember(c,'care','为陛下抄经');return fx(cchg(c,{aff:10}),chg({health:2}))}},{t:'让她保重身子',f:()=>fx(cchg(c,{aff:4}))}]},
 '擅舞':c=>({title:'绿腰',por:c,ref:'赵飞燕“掌上舞”（西汉）',text:`宫宴上，${cName(c)}一曲《绿腰》，满座皆惊。有老臣低声说：“颇有汉时赵飞燕之风。”`,choices:[
   {t:'重赏',f:()=>{harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-5);relAdd(o,c,-5)}});return fx(chg({treasury:-10}),cchg(c,{favor:10,mood:15}))}},
   {t:'“舞是好舞，只是宫宴不宜太过。”',f:()=>fx(cchg(c,{mood:-6}),chg({prestige:1}))}]}),
 '直言':c=>!S.flags.lastCourt?null:{title:'直言',por:c,text:`${cName(c)}听说了「${S.flags.lastCourt}」的处置，当着众人的面说：“臣妾斗胆，陛下这回怕是错了。”满屋子的人都吓得跪下了。`,choices:[
   {t:'“说下去。”',f:()=>{remember(c,'care','陛下听她把话说完');return `她说了一炷香的工夫，有几句竟很在理。${fx(cchg(c,{aff:8}),chg({prestige:1}))}`}},
   {t:'“后宫不得干政。”',f:()=>{remember(c,'hurt','因直言被训斥');return fx(cchg(c,{mood:-12,aff:-4}))}}]},
 '畏寒':c=>season()!==3?null:{title:'炭例',por:c,text:`入冬了，内务府按位分发炭，${cName(c)}宫里分到的是烟大呛人的黑炭。她冻得手都裂了口子，却没吭声。`,choices:[
   {t:'把乾清宫的银霜炭分她一半',f:()=>{remember(c,'care','分了陛下的银霜炭');return fx(cchg(c,{aff:10,mood:15}))}},{t:'申斥内务府',f:()=>fx(cchg(c,{mood:8}),chg({people:1}))}]},
 '嗜甜':c=>({title:'牙疼',por:c,text:`${cName(c)}偷吃松子糖吃坏了牙，半边脸肿得老高，还嘴硬说是被蚊子咬的。`,choices:[
   {t:'笑着让太医去瞧',f:()=>fx(cchg(c,{mood:5,aff:3}))},{t:'下令她宫里禁糖一月',f:()=>fx(cchg(c,{mood:-8}))}]}),
 '好读史':c=>({title:'读史',por:c,ref:'立子杀母（西汉·汉武帝与钩弋夫人）',text:`${cName(c)}合上书，问你：“陛下觉得，汉武帝该不该杀钩弋夫人？”\n汉武帝立幼子为太子，怕“主少母壮”，赐死了太子的生母。`,choices:[
   {t:'“该。主少母壮，必生祸乱。”',f:()=>{remember(c,'hurt','陛下说钩弋夫人该杀');return `她沉默了很久，没有再说话。${fx(cchg(c,{mood:-10}))}`}},
   {t:'“不该。防人之心，不该拿人命去换。”',f:()=>fx(cchg(c,{aff:10,mood:8}))},{t:'“朕不是汉武帝。”',f:()=>fx(cchg(c,{aff:6}))}]}),
 '爱哭':c=>{const o=pick(harem().filter(x=>x!==c&&relGet(c,x)<0));if(!o)return null;return {title:'梨花带雨',por:c,text:`${cName(c)}哭着来找你，说${cName(o)}笑她请安时裙角沾了泥。宫女们说，其实${cName(o)}只是多看了一眼。`,choices:[
   {t:'哄她',f:()=>fx(cchg(c,{mood:10,aff:3}))},{t:'“这点小事也值得哭？”',f:()=>{remember(c,'hurt','被说小题大做');return fx(cchg(c,{mood:-10}))}}]}},
 '擅骑射':c=>({title:'南苑跑马',por:c,text:`${cName(c)}换了一身胡服，在南苑骑马射柳，三箭全中。围观的侍卫齐声喝彩。`,choices:[
   {t:'下场与她比试（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();E().wu=clamp(E().wu+1);return fx(cchg(c,{aff:8,mood:12}))}},
   {t:'“成何体统。”',f:()=>fx(cchg(c,{mood:-10}),chg({prestige:1}))}]}),
 '记仇':c=>{const o=harem().find(x=>x!==c&&relGet(c,x)<=-40);if(!o)return null;return {title:'旧账',por:c,text:`${cName(c)}把${cName(o)}当年在请安时说过的一句酸话，一字不差地学给你听，末了说：“臣妾不是记仇，臣妾只是记性好。”`,choices:[
   {t:'笑着劝和',f:()=>{relAdd(c,o,5);return fx(cchg(c,{mood:3}))}},{t:'冷落那一位',f:()=>{relAdd(c,o,-5);return fx(cchg(c,{mood:8}),cchg(o,{favor:-8,mood:-8}))}}]}},
};
function quirkEvent(){for(const c of shuffle(harem())){deepen(c);if(S.turn-(c.qcd??-99)<10)continue;const ev=QEV[c.t2]?.(c);if(ev)return {...ev,onQueue:()=>{c.qcd=S.turn}};}return null}

/* ============ 心境 ============ */
const XIN={
 '平和':{c:'',d:0,expr:'',mood:0,lines:['']},
 '欢喜':{c:'g',d:3,expr:'smile',mood:2,lines:['眉梢眼角都是笑意，连说话的声音都轻快了几分。','一边说话一边忍不住地笑，像心里揣着一罐蜜。']},
 '感激':{c:'g',d:6,expr:'smile',mood:1,lines:['看你的眼神里满是感激，给你斟茶时手都有些抖。','把你的话一句一句都记着，生怕漏了哪个字。']},
 '释然':{c:'g',d:4,expr:'',mood:2,lines:['整个人松快了许多，说起从前的事，也能淡淡一笑了。']},
 '思念':{c:'y',d:4,expr:'sad',mood:-1,lines:['说你好久没来了。说完又低头笑笑，像是怕你嫌她多话。','把你上回来时用过的茶盏一直摆在桌上，没让宫女收。']},
 '委屈':{c:'y',d:3,expr:'sad',mood:-2,lines:['眼圈红红的，话说到一半就别过脸去。','低着头绞帕子，问一句答一句。']},
 '惶恐':{c:'y',d:3,expr:'worry',mood:-2,lines:['一见你就跪下了，说话时声音一直在抖。','宫女说，主子这些天夜里总是惊醒。']},
 '嫉恨':{c:'r',d:5,expr:'angry',mood:-1,scheme:1,lines:['笑着同你说话，可一提到{who}，那笑就僵在了脸上。']},
 '怨恨':{c:'r',d:12,expr:'angry',mood:-2,scheme:1.5,favorMul:.7,lines:['规规矩矩地行礼，规规矩矩地回话，眼神却冷得像冬天的井水。','说：“臣妾一切都好，劳陛下挂心。”可那语气，一点也不好。']},
 '悲恸':{c:'r',d:4,expr:'tear',mood:-4,lines:['哭得眼睛都肿了，见了你，眼泪又簌簌地掉下来。','抱着一件小衣裳坐在窗边，从早坐到晚。']},
 '心如死灰':{c:'k',d:18,expr:'blank',mood:-3,favorMul:.5,lines:['不哭也不闹，只是安安静静地坐着，像一盏快燃尽的灯。','你跟她说了很多话，她只是“嗯”了几声。']},
 '野心':{c:'r',d:8,expr:'',mood:1,scheme:1,lines:['说话比从前多了几分底气，偶尔会提起朝中某位大人的名字。']},
};
const NEGX=['思念','委屈','惶恐','嫉恨','怨恨','悲恸','心如死灰'];
const ARCX={'孤女':'心如死灰','诗绝':'心如死灰','沙尽':'心如死灰','冷月':'心如死灰','囚鸟':'怨恨','怨怼':'怨恨','削爵':'怨恨','连坐':'怨恨','心冷':'委屈','心结':'委屈','抄家':'委屈','昭雪':'释然','尘封':'释然','回头':'释然','知音':'欢喜','此心已许':'欢喜','同心':'欢喜','知己':'欢喜','回春':'欢喜','江南春':'欢喜','君臣相得':'感激','赎罪':'感激','驼铃归':'感激','将相和':'感激','清白':'感激','凤仪':'野心','摄六宫':'野心','败露':'惶恐'};
function xinOf(c){return (c&&c.xin&&c.xin.k)||'平和'}
function setXin(c,k,why,who){if(!c||!c.alive||!XIN[k])return;const cur=xinOf(c);
  if(cur==='心如死灰'&&!['释然','感激','悲恸'].includes(k))return;
  if(cur==='怨恨'&&['欢喜','委屈','思念','惶恐','嫉恨','野心'].includes(k))return;
  if(cur===k){c.xin.t=S.turn;c.xin.why=why;if(who)c.xin.who=who;return}
  c.xin={k,t:S.turn,why,who:who||null};if(k!=='平和'&&c.xinLog!==k+why){story(c,`【心境·${k}】${why}。`);c.xinLog=k+why}}
function xinLine(c){const x=c.xin;if(!x||x.k==='平和')return '';const w=x.who&&x.who!=='emp'?byId(x.who):null;return pick(XIN[x.k].lines).replace('{who}',w?cName(w):'旁人')}
function xinTag(c){const k=xinOf(c);return k==='平和'?'':`<span class="tag ${XIN[k].c}">${k}</span>`}
function xinDetail(c){const k=xinOf(c);if(k==='平和')return '<div style="margin-top:4px">心境：<span class="tag">平和</span></div>';const x=c.xin,m=S.turn-x.t;
  return `<div style="margin-top:4px">心境：<span class="tag ${XIN[k].c}">${k}</span> <span class="hint">因${esc(x.why)}${m>0?`，已 ${m} 个月`:''}${NEGX.includes(k)?'。多去陪她说话，或成全她的心愿，也许能解开':''}</span></div>`}
function xinTick(c){if(!c.alive||c.gone)return;
  if(c.cold){if(c.coldT===undefined)c.coldT=S.turn}else delete c.coldT;
  const x=c.xin,k=xinOf(c);
  if(k!=='平和'){const X=XIN[k];c.mood=clamp(c.mood+X.mood);if(X.scheme)c.scheme=clamp(c.scheme+X.scheme*.3);
    if(S.turn-x.t>=X.d){if(k==='怨恨'||k==='心如死灰'){if(chance(.2))c.xin={k:'平和',t:S.turn}}else if(k==='悲恸'&&chance(.3))setXin(c,'心如死灰','悲伤久久不散');else c.xin={k:'平和',t:S.turn}}}
  const k2=xinOf(c);
  if(c.cold&&!['心如死灰','怨恨'].includes(k2)&&S.turn-c.coldT>=3)setXin(c,'心如死灰','冷宫的日子一天比一天长');
  if(c.cold)return;
  if(k2==='平和'&&c.aff>=50&&c.favor<15&&chance(.15))setXin(c,'思念','陛下许久未来');
  else if(k2==='平和'&&c.aff<35&&c.favor<10&&chance(.2))setXin(c,'委屈','备受冷落');
  if(TRAITS[c.trait].jealous&&['平和','委屈'].includes(xinOf(c))){const top=harem().filter(o=>o!==c).sort((a,b)=>b.favor-a.favor)[0];if(top&&top.favor>c.favor+40&&chance(.3))setXin(c,'嫉恨',`${fullName(top)}独得圣宠`,top.id)}}
const XEV={
 '思念':c=>c.cold?null:{title:'香囊',por:c,text:`${cName(c)}托人送来一只香囊，里面没有香料，只有一张折得很小的纸条：“${pick(['庭前的海棠开了，陛下何时来看？','近来夜长，数着更漏到天明。','一日不见，如三秋兮。'])}”`,choices:[
   {t:'今晚就去（精力-1）',cond:()=>E().energy>0&&!c.preg,why:'精力不足或她有孕',f:()=>{setXin(c,'欢喜','陛下见了香囊便来了');nightWith(c);return null}},
   {t:'回一张纸条',f:()=>{remember(c,'care','回了她的纸条');return fx(cchg(c,{aff:4,mood:8}))}},
   {t:'收下，不回',f:()=>{setXin(c,'委屈','香囊送去，石沉大海');return fx(cchg(c,{mood:-8}))}}]},
 '委屈':c=>c.cold?null:{title:'委屈',por:c,text:`${cName(c)}宫里的掌事姑姑来求见，跪着说：“我们小主这些日子吃不下睡不着，夜里一个人对着窗户掉眼泪。奴婢斗胆，求陛下去看看她。”`,choices:[
   {t:'去看她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();setXin(c,'释然','陛下来看她了');return fx(cchg(c,{mood:15,aff:6}))}},
   {t:'赏些东西过去',f:()=>fx(chg({treasury:-10}),cchg(c,{mood:5}))},
   {t:'“后宫谁没受过委屈。”',f:()=>{setXin(c,'怨恨','求陛下来看她，陛下没有来','emp');return '掌事姑姑磕了个头，退下了。'}}]},
 '惶恐':c=>({title:'惶恐',por:c,text:`${cName(c)}脱簪待罪，在乾清宫外跪了一夜：“臣妾不知做错了什么，求陛下明示。”`,choices:[
   {t:'扶她起来：“朕没有怪你。”',f:()=>{setXin(c,'感激','陛下亲手扶她起来');return fx(cchg(c,{aff:8,mood:12}))}},
   {t:'让她跪着',f:()=>{setXin(c,'委屈','在乾清宫外跪了一夜');return fx(cchg(c,{mood:-10}),chg({prestige:1}))}}]}),
 '嫉恨':(c,x)=>{const w=x.who&&byId(x.who);if(!w||!w.alive||w.cold||c.cold)return null;return {title:'嫉恨',por:c,text:`宫宴上，${cName(c)}笑盈盈地给${cName(w)}敬酒，一失手，整杯葡萄酒泼在了${cName(w)}新做的衣裳上。满座都看见了，那一下不像是失手。`,choices:[
   {t:'当场斥责她',f:()=>{setXin(c,'惶恐','宴上当众被斥');relAdd(c,w,-10);return fx(cchg(c,{mood:-12,favor:-8}),cchg(w,{aff:5}))}},
   {t:'笑着替两人解围',f:()=>{relAdd(c,w,-5);return fx(cchg(w,{mood:-6}))}},
   {t:`赐${cName(w)}一身新衣，冷落那一位`,f:()=>{w.robeC=pick(RPAL[rTier(w.rank)]);relAdd(c,w,-12);return fx(chg({treasury:-10}),cchg(w,{mood:12}),cchg(c,{favor:-10}))}}]}},
 '怨恨':(c,x)=>{if(x.who==='emp')return c.cold?null:{title:'称病',por:c,text:`敬事房来报：今晚翻到了${cName(c)}的牌子，她却称病推了。太医去看，说脉象平和，并无病症。`,choices:[
     {t:'去她宫里（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();if(chance(.35+c.aff/300)){setXin(c,'释然','陛下夜里亲自来了');return `她开门看见是你，愣了很久，眼泪一下子掉了下来。${fx(cchg(c,{aff:10,mood:15}))}`}return `她隔着门说：“臣妾病着，怕过了病气给陛下。”你在门外站了一会儿，走了。${fx(cchg(c,{aff:-2}))}`}},
     {t:'由她去',f:()=>fx(cchg(c,{favor:-10}))}]};
   const w=byId(x.who);if(!w||!w.alive)return null;return {title:'怨毒',por:c,text:`有宫人密报：${cName(c)}最近常在小佛堂里待到深夜，佛龛下压着一张写了${cName(w)}生辰的黄纸。`,choices:[
     {t:'召她来，把话说开',f:()=>{if(chance(.4)){setXin(c,'释然','陛下替她和旧怨做了了断');relAdd(c,w,15);return `她哭着说了很久，说完了，人也松了。${fx(cchg(c,{aff:6}))}`}return `她一句也不肯认。${fx(cchg(c,{mood:-5}))}`}},
     {t:'没收黄纸，罚她禁足',f:()=>{setXin(c,'惶恐','暗咒之事被发现');return fx(cchg(c,{mood:-10,favor:-10}))}},
     {t:'装作不知道',f:()=>{c.scheme=clamp(c.scheme+5);relAdd(c,w,-10);return '你什么也没说。'}}]}},
 '悲恸':c=>({title:'超度',por:c,text:`${cName(c)}求陛下准她请护国寺的僧人进宫，做七天法事。“臣妾只想让……走得安心些。”`,choices:[
   {t:'准（国库-20万两）',f:()=>{setXin(c,'释然','七天法事做完');return fx(chg({treasury:-20}),cchg(c,{aff:8,mood:10}))}},
   {t:'宫中不宜大做法事',f:()=>{setXin(c,'心如死灰','连一场法事也求不来');return fx(cchg(c,{mood:-10}))}}]}),
 '心如死灰':(c,x)=>S.turn-x.t<6?null:({title:'青灯',por:c,text:`${c.cold?'冷宫里':''}的${fullName(c)}托人递来一句话：求陛下准她剪发出家，从此青灯古佛，不再惹陛下心烦。`,choices:[
   {t:'准她出家',f:()=>{c.gone=true;story(c,'剪发出家，从此青灯古佛。');log(`${fullName(c)}出家。`,1);return '她剪下的头发用红绳系着，托人送了回来。'}},
   {t:'去看她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();if(chance(.3+c.aff/250)){setXin(c,'感激','万念俱灰时陛下来了');if(c.cold)A.uncold(c.id);return '你握住她的手，她的手冰凉。过了很久，她轻轻回握了一下。'}return `她始终没有抬头。${fx(cchg(c,{aff:2}))}`}},
   {t:'不准',f:()=>fx(cchg(c,{mood:-5}))}]}),
 '欢喜':c=>c.cold?null:{title:'新衣',por:c,text:`${cName(c)}心情极好，派人来请陛下去看她新裁的衣裳，说用的是今年江南新进的料子。`,choices:[
   {t:'去看看（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();c.robeC=pick(RPAL[rTier(c.rank)]);return fx(cchg(c,{aff:6,favor:6}))+'\n§她换上了新衣裳'}},
   {t:'让她改日穿给朕看',f:()=>fx(cchg(c,{mood:-3}))}]},
 '感激':c=>c.cold?null:{title:'寝衣',por:c,text:`${cName(c)}熬了三夜，为陛下绣了一件寝衣，针脚密得看不出接头。`,choices:[{t:'当晚就穿上',f:()=>fx(cchg(c,{aff:6,mood:10}))}]},
 '野心':c=>c.cold?null:{title:'野心',por:c,text:`${cName(c)}最近常召娘家人入宫，还托人打听朝中几位尚书的喜好。`,choices:[
   {t:'敲打她',f:()=>{setXin(c,'惶恐','野心被陛下点破');c.scheme=clamp(c.scheme-5);return fx(cchg(c,{mood:-8}))}},
   {t:'由她去',f:()=>{c.fam.p=Math.min(95,c.fam.p+5);return '她娘家的门槛，被人踏破了。'}}]},
};
function xinEvent(){for(const c of shuffle(alive().filter(c=>!c.gone))){const k=xinOf(c);if(k==='平和'||S.turn-(c.xcd??-99)<6)continue;const ev=XEV[k]?.(c,c.xin);if(ev)return {...ev,onQueue:()=>{c.xcd=S.turn}};}return null}
