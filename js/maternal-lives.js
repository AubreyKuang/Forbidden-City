/* Motherhood is a relationship, not a replacement personality. */
const MATERNAL_STYLES={
 温婉:['把哭声听完再轻拍襁褓','蹲下来听孩子把委屈说完','把劝告说得很轻，也认真听孩子不同的打算','反复叠好衣裳，托人问睡得可好','仍备着孩子爱吃的小碟，摆好才想起不必了'],
 骄纵:['平日嫌烦的乳母规矩，自己竟一条条追问','替孩子挑最亮的衣裳，见孩子不喜欢又闷闷换下','想替孩子作主，却被一句“我自己来”刺得眼眶发红','当面要人给个说法，回去却抱着小衣裳哭','摔下手里的玉梳后，独独舍不得动孩子留下的东西'],
 骄矜:['屏退旁人，才肯低声学乳母哼歌','在人前挺直脊背，独处时替孩子擦去掌心的汗','替孩子整好衣领：“便是输了，也可以回来说。”','在人前不肯失态，夜里却一遍遍问守门的人','仍端正行礼，回到内室便再说不出话'],
 聪慧:['记下喂养与睡醒的时辰，发现孩子握住手指才真正安静','先问孩子为什么，再一起试另一种办法','把两条路的难处摊开，最后把笔交回孩子手里','逐项询问照护和传信安排，却无法把担忧算尽','一遍遍回想哪一步还能挽回，纸上列满了无解的问句'],
 善妒:['总想自己抱着，又怕抱久了反而睡不好','听孩子夸旁人便有些酸，仍忍着问那人教了什么','想听一句“最亲母亲”，也在学着容下孩子别的牵挂','怕孩子不再记得自己，连一句称呼都反复揣摩','把与孩子相处的每一刻翻来覆去地想，却无从再求一句亲近'],
 淡泊:['不添华贵摆设，只把软枕与干净小衣备齐','容孩子慢慢玩，不急着同别人比进度','说不必争第一，随后又添一句“你若想争，我也听着”','说孩子自有日子，手却久久没松开送行的衣带','以为自己看得淡，到那扇空门前才知道放不下'],
 活泼:['做了几个笨拙的鬼脸，只为换一声咿呀','陪孩子编游戏，输了一回便笑着讨再来','本想拿玩笑逗孩子，却在看见烦恼时认真坐下','临别还逗孩子笑，转过身便再没有笑声','屋里少了她常有的笑闹，旧游戏留在半途'],
 城府:['把照护的人逐一问清，亲手试过被褥才放心','先教孩子看清处境，夜里又怕自己教得太早','想为孩子铺路，听见孩子不愿时沉默许久','先打听是谁作的安排，夜深才肯承认自己只是想孩子','仍能把事情安排得井井有条，独自坐下却久久失神'],
 痴情:['舍不得放下睡着的孩子，连呼吸都放轻','把孩子随口的小愿望一一记住','愿意一直陪着，却也怕自己的牵挂压住孩子','日日等着消息，听见脚步就起身','守着旧物不肯收起，连一句安慰都像隔着很远'],
 体弱:['抱不久便请乳母接手，仍把手指留给孩子攥着','坐在软榻旁陪玩，答应累了会直说','担心自己拖累孩子，试着先说“今日我想你陪一会儿”','托人送去亲手缝了一半的衣裳，余下几针怎么也没力气','悲伤与疲倦交叠，她连起身看旧物都需歇息'],
 将门:['托着孩子后颈的手，比握弓时还谨慎','练习前先护好手腕，跌了先看伤再说勇气','问孩子是否真想习武，并没有拿家门的名声逼答','最会说远行须坚强的人，送行后却久久立在原地','曾能听完军报的人，如今听见孩子的名字便握不住茶盏'],
 才女:['放下整卷诗书，只哼孩子听得安稳的短句','留着写歪的字，不把每一页都改成自己的样子','读孩子的文字，忍住替改末句的习惯','在信上写了又删，末了只问衣食平安','翻到孩子留下的笔迹，往后的空页再也写不下去'],
 贪财:['平日舍不得用的好料，先裁给了孩子','教孩子数小钱，也问哪些东西不能拿来交换','盘算前程用度，仍把一笔钱留给孩子自己安排','清点行李三遍，明知金银买不来相伴','收起珠宝才发觉，最想留下的从来不是这些'],
 沉静:['不多说话，一下一下轻拍，记得孩子熟悉的节奏','坐在旁边等孩子自己开口，手里已递过一方帕子','没有追问所有秘密，只说有难处时门总开着','送行时只说保重，灯下才把未说的话写满一页','没有哭出声，听见门响却总抬头'],
 爽直:['照护有不明白便问，学得笨也不遮掩','做错了便说清，也肯当面认自己方才太急','问“这是你自己的主意吗”，听清后不再拐弯试探','直说自己不舍，不拿大道理把话盖住','说“我很想孩子”，说完便再没有旁的话'],
 持重:['先理清照护轮值，再亲手掖好被角','立下规矩，也解释为什么自己同样要守','把责任交给孩子，出了差错先陪着收拾','照旧把该办的事办完，独处时才卸下撑着的神色','众人面前安排妥当，关上门后才允许自己哭'],
 好客:['见客时也留意摇篮，睡了便请大家轻声','想约同伴一起玩，也问孩子今日是否只想独处','愿意认识孩子的新朋友，却先问能否相见','往日热闹的屋子少了一个人，再多客人也填不满','仍习惯摆齐座位，看到那处空席便垂下眼'],
 巧手:['反复摸过小衣的接缝，怕一道硬线磨着孩子','让孩子留下一针歪线，说这是两人合做的记号','把工具交给孩子，不替孩子修掉所有不同','量好的尺寸还在针线笸箩里，人却已不在眼前','针停在半件小衣上，过了许久也没有落下'],
 好学:['认真向乳母请教，才知道书上没有写全','一起找答案，也坦然承认自己有不懂处','孩子提出不同见解时，愿意再读一次旧书','查了路程与时令，心里仍总有书上答不了的担忧','翻遍书也寻不到能把孩子带回来的答案'],
 孤高:['平日不许人乱碰的书案让出一角，她俯身贴了贴孩子的额头，声音温柔得几乎陌生','对旁人淡淡的人，肯听孩子把一句话说上三遍，还低头藏住笑意','仍不爱应酬，却给孩子留着随时可坐的一席：“不必像我，想热闹便去。”','她把门关得更早，唯独听到孩子的消息，才立即起身','旁人面前仍冷淡，独坐时却把孩子的小物握在掌心，久久不肯松开']
};
const maternalStyle=c=>MATERNAL_STYLES[isSolitary(c)?'孤高':c.trait]||MATERNAL_STYLES.温婉;
function maternalActivity(k,c,seeking){
 const a=kidAge(k),line=maternalStyle(c)[a<3?0:a<12?1:2];
 return {title:a<3?'轻声照护':seeking?'听孩子说心事':a<12?'母子小坐':'灯下谈心',place:c.palace||'宫中',child:`${fullName(c)}${line}。`,mother:`面对${k.name}，她${line}。`};
}
function maternalChildren(c){return S.children.filter(k=>k.mom===c.id||k.foster===c.id||k.motherBonds?.[c.id]);}
function maternalStatus(k,c){
 if(k.lost)return 'missing';
 if(!k.alive)return 'death';
 if(childHasLeftPalace(k)||c.templeStay&&!k.templeStay)return 'away';
 if((k.foster||k.mom)!==c.id)return k.visitRule==='closed'&&k.mom===c.id?'closed':'foster';
 return 'near';
}
const MATERNAL_STATUS={near:'相伴',foster:'抱养分居',closed:'探望受阻',away:'出宫牵挂',missing:'失散待寻',death:'丧子追思'};
function maternalRecord(c,k,r,text,emotion){
 story(c,`【${MATERNAL_STATUS[r.kind]}·${k.name}】${text}`);
 NPCMemory.record(S,{type:'maternal-life',time:S.turn,participants:[c.id,k.id],object:k.name,outcome:text},[{person:c.id,subject:k.id,interpretation:text,emotion,impact:85}]);
}
function maternalTick(){
 if(!S)return;
 for(const c of S.consorts.filter(c=>c.alive&&!c.gone))for(const k of maternalChildren(c)){
  const state=c.maternalLife||={children:{}},kind=maternalStatus(k,c),old=state.children[k.id];
  if(!old||old.kind!==kind){
   const r=state.children[k.id]={kind,since:S.turn,care:0,lastCare:-99,history:old?.history||[]};
   if(kind!=='near'||old&&old.kind!=='near'){
    const text=kind==='near'?`${k.name}重新回到身边，她仍记得分开的日子。`:kind==='death'?`${k.name}已离世。她${maternalStyle(c)[4]}。`:kind==='missing'?`${k.name}下落未明，她仍等着寻回的消息，不肯把失散当作死别。`:`${k.name}${kind==='away'?`如今在${childWhereabouts(k)}`:kind==='closed'?'被抱养后暂不能私下探望':'如今由另一位母亲抚养'}。她${maternalStyle(c)[3]}。`;
    r.history.push({turn:S.turn,kind,text});maternalRecord(c,k,r,text,kind==='near'?.6:-.8);
    if(old&&['death','missing','closed'].includes(kind)){cchg(c,{mood:isSolitary(c)?-12:-6});setXin(c,kind==='death'?'悲恸':'思念',`${k.name}：${MATERNAL_STATUS[kind]}`);}
   }
  }
  const r=state.children[k.id];
  if(['death','missing','closed'].includes(kind)&&S.turn-r.since>=6&&r.care<2&&!r.retreat){
   r.retreat=solitaryDao(c)?'静室问道':c.t2==='信佛'||c.like==='佛经'?'青灯诵经':'闭门少言';
   maternalRecord(c,k,r,`牵挂久久未解，她渐渐${r.retreat}。清静并没有让她忘记${k.name}。`,-.6);
  }
 }
}
function maternalConcern(c){return Object.entries(c?.maternalLife?.children||{}).map(([id,r])=>({k:kidById(Number(id)),r})).filter(x=>x.k&&x.r.kind===maternalStatus(x.k,c)&&x.r.kind!=='near').sort((a,b)=>(b.r.kind==='death')-(a.r.kind==='death')||b.r.since-a.r.since)[0];}
function maternalUnsettled(c){const x=maternalConcern(c);return !!(x&&['death','missing','closed'].includes(x.r.kind)&&(S.turn-x.r.since<12||x.r.care<3));}
function maternalVoice(c){
 const x=maternalConcern(c);
 if(x){const {k,r}=x;return voiceLine('maternal-'+r.kind,r.retreat?`她近来${r.retreat}，提到${k.name}才抬起眼。`:`说起${k.name}，她停了许久。`,r.kind==='death'?`${k.name}不在了。${maternalStyle(c)[4]}。有人肯记得孩子，臣妾心里会暖一点，却不能就这样不想了。`:r.kind==='missing'?`${k.name}还没找到，臣妾不能当作孩子已经不在。哪怕只有一点线索，也请告诉臣妾。`:`臣妾知道${k.name}还好好活着，可不能日日相见，终究难熬。${maternalStyle(c)[3]}。`);}
 const k=maternalChildren(c).find(k=>k.alive&&!k.pendingName&&familyVisitAllowed(k,c));
 return k?voiceLine('maternal-near',`说到${k.name}，她露出与待旁人不同的神情。`,maternalStyle(c)[kidAge(k)<3?0:kidAge(k)<12?1:2]+'。'):null;
}
function maternalCareEvent(c,id){
 const k=kidById(id),r=c?.maternalLife?.children?.[id];
 const valid=()=>inPalace(c)&&r===c.maternalLife?.children?.[id]&&r?.kind===maternalStatus(k,c)&&r.kind!=='near'&&S.turn-r.lastCare>=3;
 if(!k||!r||!valid())return null;
 const resolve=mode=>{if(!valid()||!useE())return null;r.lastCare=S.turn;r.care+=mode==='dismiss'?0:1;
  const text=mode==='dismiss'?`陛下催她放下${k.name}的事。她没有再争辩，却更不愿提起。`:mode==='quiet'?`她选择${solitaryDao(c)?'静室问道':c.t2==='信佛'||c.like==='佛经'?'青灯诵经':'闭门静养'}，陛下安排照护，也答应不催她忘记${k.name}。`:`陛下坐下听她谈${k.name}，没有催她振作。悲伤未消，她终于肯说起一件具体的小事。`;
  if(mode==='quiet')r.retreat=solitaryDao(c)?'静室问道':c.t2==='信佛'||c.like==='佛经'?'青灯诵经':'闭门静养';
  cchg(c,{aff:mode==='dismiss'?-4:3,mood:mode==='dismiss'?-5:3});r.history.push({turn:S.turn,kind:r.kind,text});maternalRecord(c,k,r,text,mode==='dismiss'?-.6:.35);save('auto');return text;};
 return {title:MATERNAL_STATUS[r.kind],por:c,cast:[c,k],present:[c],valid,text:maternalVoice(c).lines.join('\n'),choices:[
  {t:'陪她说说孩子 · 精力−1',cond:()=>E().energy>0,f:()=>resolve('listen')},
  {t:'听从她想静养的心意 · 精力−1',cond:()=>E().energy>0,f:()=>resolve('quiet')},
  {t:'劝她不要再想 · 精力−1',cond:()=>E().energy>0,f:()=>resolve('dismiss')},{t:'改日再来'}]};
}
A.maternalCare=function(id,child){const ev=maternalCareEvent(byId(id),child);if(!modalOpen&&ev)pushEv(ev);};
function maternalPanel(c){
 const entries=Object.entries(c.maternalLife?.children||{}).filter(([,r])=>r.kind!=='near');if(!entries.length)return '';
 return `<section class="personal-experience"><h3>牵挂与追思</h3>${entries.map(([id,r])=>{const k=kidById(Number(id));if(!k)return '';return `<p><strong>${esc(k.name)} · ${MATERNAL_STATUS[r.kind]}</strong>${r.retreat?' · '+r.retreat:''}</p><p>${esc(r.history.at(-1)?.text||'')}</p>${maternalCareEvent(c,k.id)?`<button class="btn jade" onclick="A.maternalCare(${c.id},${k.id})">听她谈这个孩子<small>精力−1</small></button>`:''}`;}).join('')}<p class="hint">抱养探望与出宫行程在孩子页安排。陪伴能让她愿意开口，无法抹去曾经的分离与失去。</p></section>`;
}
