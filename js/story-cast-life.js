/* The palace chapters leave each character with something the player can still do. */
const storyCastLifeActive=()=>journalContentVersion()>=74;
const STORY_CAST_LIVES={
  qingyi:{title:'钟粹宫书案',chapters:['旧本退还','两封回信','留一席读书'],routine:'灯下共校',secret:'秋夜归笺',after:'书末谁署名',
    guide:'沈母来信后可开书案。选择私下校书或交女官公议，将决定日后与中宫以及皇嗣的来往。'},
  luwan:{title:'北苑骑课',chapters:['先学牵马','分场试骑','把伤簿送回去'],routine:'校场授课',secret:'驿马归栏',after:'听马的人',
    guide:'可以带皇嗣，也可和骑射同好的妃嫔开课。重基本功和重骑射各有不同收获。'},
  ayimu:{title:'白泉关书',chapters:['两边的市日','驿路回单','席上两种话'],routine:'核白泉互市',secret:'母亲的香囊',after:'把曲子寄回白泉',
    guide:'商路可先试办，也可等两边共同核准。懂白泉话的皇嗣参与时，在互市里更容易议成。'},
  chuwan:{title:'旧仓新册',chapters:['门外的证人','半批粮的去处','谁在卷尾署名'],routine:'复核一处粮仓',secret:'一只旧木碗',after:'粥棚门前的孩子',
    guide:'公开旧卷有朝上的益处，封存住址可以照料证人。赈粮会真实扣除常平仓库存。'},
  suheng:{title:'供香账房',chapters:['香炉归位','三张供单','谁验最后一缸'],routine:'换季比香',secret:'一味无香',after:'空炉也有领用单',
    guide:'赔礼后开账房。供香有押款与回账，苏家铺子也要按同一标准验收。'},
  xiaoman:{title:'宫宴戏班',chapters:['按手艺报工钱','一张要紧的契','第一场自己登台'],routine:'排下一场戏',secret:'多出一枚铜钱',after:'幕布后面的人',
    guide:'学徒和成年艺人都按名册领工钱。排好的节目会在真正举办的宫宴里演，再回来核账。'}
};

function storyCastLifeRecord(c){
  const r=storyCastRecord(c.fixedStory);
  return r?.id===c.id?r:null;
}
function storyCastLifeUnlocked(c,r){
  if(!storyCastLifeActive()||!r||!inPalace(c)||S.over||S.turn-r.admitted<2)return false;
  return c.fixedStory!=='suheng'||r.amends||!!r.life||(!r.palaceStage&&harem().every(o=>o===c));
}
function storyCastLifePupil(c){
  return kidsAlive().filter(k=>kidAge(k)>=5&&childInPalace(k)&&!k.pendingName)
    .sort((a,b)=>Number(b.mom===c.id)-Number(a.mom===c.id)||a.id-b.id)[0];
}
function storyCastLifePartner(c,predicate){
  return harem().filter(o=>o!==c&&predicate(o)).sort((a,b)=>relGet(c,b)-relGet(c,a)||a.id-b.id)[0];
}
function storyCastLifeScene(c,r,state,key,title,text,choices,cast=[]){
  const stage=state?.stage||0;
  const valid=()=>storyCastLifeUnlocked(c,r)&&r.life===state&&(state?.stage||0)===stage&&
    (key==='chapter'?S.turn>=(state?.due??0):key==='routine'?S.turn>=(state?.next??0):key==='after'?state?.after==null:state?.secret==null);
  return {title,por:c,cast:[c,...cast.filter(Boolean)],text,valid,choices:[
    ...choices.map(({t,cond,effect})=>({t,cond:()=>valid()&&(!cond||cond()),f:()=>{
      if(!valid()||cond&&!cond())return null;
      const life=r.life||={stage:0,visits:0};
      const outcome=effect(life);
      if(key==='chapter'){life.stage++;life.due=S.turn+(outcome.wait??1);if(life.stage===3)life.next=life.due;}
      if(key==='routine'){life.visits++;life.next=S.turn+(outcome.wait??4);}
      if(key==='secret')life.secret=S.turn;
      if(key==='after')life.after=S.turn;
      life.last=S.turn;
      const note=storyCastRecordLine(c,'【'+title.split(' · ').at(-1)+'】'+outcome.line,key!=='routine');
      return note+(outcome.effects?fx(outcome.effects):'');
    }})),storyCastLater]};
}
const lifeChoice=(t,effect,cond)=>({t,effect,cond});
const lifeOutcome=(line,effects,wait)=>({line,effects,wait});
function storyCastLifeLetter(p,line){
  if(officialAlive(p))princePersonNote(p,line);
}

function storyCastLifeQingyi(c,r,life,stage,scene){
  const q=empress(),child=storyCastLifePupil(c),father=houseOf(c)?.father;
  if(stage===0)return scene('旧本退还','钟粹宫校毕一册旧本，封里夹着沈家借书的凭签。沈母可认出上面的旧字。清漪想把书先退回家里，再问母亲是否愿让宫中抄录。',[
    lifeChoice('由她自己寄还原本 · 情分+5',s=>{s.path='私函';return lifeOutcome('把原本同家书送回姑苏，她第一次在信上写明自己在宫中做些什么。',cchg(c,{aff:5,mood:4}),2);}),
    lifeChoice('请女官同抄副本 · 国库−6',s=>{s.path='共校';return lifeOutcome('女官按借簿留副本、送原本，清漪把自己校出的旧字逐条抄给母亲。',chg({treasury:-6})+'　'+cchg(c,{aff:3,talent:2}),2);},()=>E().treasury>=6)]);
  if(stage===1)return scene('两封回信',life.path==='共校'?'两份回信各有封套，沈母给女儿说家常，给宫里说旧书。当年一起争过错字的人重新对上了话。':'沈母的回信说她肯借书，却怕女儿在宫中仍需借旧情讨人欢心。清漪问，能不能由她落自己给母亲的款。',[
    lifeChoice('照她写的递回去 · 情分+6',s=>{s.trust=true;storyCastLifeLetter(father,'听沈夫人读完清漪家书，知道女儿校过几册旧本，也有自己的安排。');return lifeOutcome('亲笔回信递出，公事另附一页，给母亲的话仍留在内封。',cchg(c,{aff:6,mood:5}));}),
    lifeChoice('把借书章程留下 · 才情+3',s=>{s.trust=false;return lifeOutcome('照旧例留了借还手续。她添了一册自己的校记，承诺拿得出书才收下一批。',cchg(c,{talent:3}));})]);
  if(stage===2)return scene('留一席读书','清漪把案前空出一席。她说可以向皇嗣讲旧书，也可以约宫里人坐下来，各取一卷读。',[
    lifeChoice(child?'请'+child.name+'来读一页 · 才学+4':'留一席给愿来读书的人',()=>{
      if(child){skillGain(child,'lit',4);kstory(child,'在钟粹宫听沈清漪校了一页书，知道旧书从哪里来。');}
      return lifeOutcome(child?'为'+child.name+'留下旁注，日后可来钟粹宫接着读。':'将钟粹宫旧案留出一席，进来的人可以自挑一卷。',child?child.name+'才学+4':cchg(c,{mood:6}));}),
    ...(q&&q!==c?[lifeChoice('请皇后一起校书 · 两人关系+8',()=>{relAdd(q,c,8);story(q,'和沈清漪各校一卷旧书，核过借簿才闲谈。');return lifeOutcome('清漪与皇后商定各候一本，宫人照登记往来，少了私下比较。','关系+8');})]:[])],[child,q].filter(o=>o!==c));
  return scene('灯下共校','书案仍留着一盏灯。'+(life.trust?'她等那份只写家常的回信。':'她刚校完一卷，给你留了两处拿不准的字。'),[
    lifeChoice('陪她写一封家书 · 情分+4',()=>lifeOutcome('你陪她写完关切的话，她又夹了一页旧书校记送回去。',cchg(c,{aff:4,mood:4}))),
    ...(child?[lifeChoice('带'+child.name+'来校一页 · 才学+'+(life.signedCopy?5:3),()=>{skillGain(child,'lit',life.signedCopy?5:3);kstory(child,'又到钟粹宫同清漪校书，为一个异字翻查了旧本。');return lifeOutcome('借给'+child.name+'一卷旧书，让其下回把疑问带来。',child.name+'才学+'+(life.signedCopy?5:3));})]:[])],[child]);
}

function storyCastLifeLuwan(c,r,life,stage,scene){
  const child=storyCastLifePupil(c),mate=storyCastLifePartner(c,o=>consortHobby(o)==='骑射');
  const h=houseOf(c),teacher=child||mate;
  if(stage===0)return scene('先学牵马','陆绾在马厩门口等你。她说想在北苑教骑课，先教人记马的脾气，再决定开轻弓还是只绕场。',[
    lifeChoice('准她开轻弓课，拨修弓费 · 国库−8',s=>{s.path='骑射';return lifeOutcome('校场修好轻弓，只许站稳的学员加练。她先把弓递给骑过一回的人。',chg({treasury:-8}),2);},()=>E().treasury>=8),
    lifeChoice('先教照管马匹 · 心情+5',s=>{s.path='马厩';return lifeOutcome('学员从梳毛、牵马学起。陆绾教宫人认老马的坏腿，再把套在栏上的绳放松。',cchg(c,{mood:5}),2);})]);
  if(stage===1)return scene('分场试骑',teacher?'试骑这日，'+(child?child.name:fullName(mate))+'先到，陆绾把容易受惊的马留下，临时换了一匹。':'试骑这日，只有北苑随侍到齐。她照旧把课讲了一遍，也让来看的皇帝试一趟。',[
    lifeChoice('照她的分场安排授课',()=>{
      if(child){const skill=life.path==='骑射'&&child.policy==='习武'?'mar':'hp';skillGain(child,skill,4);kstory(child,'在北苑头一回正式上陆绾的骑课，按自己的进度练习。');return lifeOutcome('亲自带'+child.name+'试骑，选了合其教养的功课。',child.name+(skill==='mar'?'武艺':'体魄')+'+4');}
      if(mate){relAdd(c,mate,8);story(mate,'在陆绾的骑课上第一次自己绕场。');return lifeOutcome('同'+fullName(mate)+'在北苑试骑，约定下一回仍同来。','关系+8');}
      return lifeOutcome('把骑课先教给随侍，皇帝同她走完一圈。',chg({health:2})+'　'+cchg(c,{aff:3}));
    })],[teacher]);
  if(stage===2)return scene('把伤簿送回去','陆绾把每匹马的歇息时日写成一册。北境来信催补一份伤病清单，她认得家里原先总漏写哪一栏。',[
    lifeChoice('抄送军驿留用 · 威望+2',s=>{s.militaryBook=true;for(const p of [h?.father,h?.brother].filter(officialServing))storyCastLifeLetter(p,'陆绾从宫中抄来新版骑课伤簿，把换马、伤病和归还的时辰分开。');return lifeOutcome('伤簿抄送了北境军驿，军令仍由在任将领出。',chg({prestige:2}));}),
    lifeChoice('留在北苑给学员看 · 情分+5',()=>lifeOutcome('让新来的学员知道受伤时先去哪里报，不许硬撑。',cchg(c,{aff:5})))]);
  return scene('校场授课','陆绾在场边点马名，让学员按各人的体力挑课。',[
    ...(child?[lifeChoice('让'+child.name+'按教养方向练习',()=>{const skill=life.path==='骑射'&&child.policy==='习武'?'mar':'hp';skillGain(child,skill,3);if(life.stableLesson)skillGain(child,'hp',2);kstory(child,'陆绾换了一项适合自己的北苑功课。'+(life.stableLesson?'课前还跟她到老马栏边练了脚力。':''));return lifeOutcome('教'+child.name+'复练初学的动作，并留一笔在课簿。',child.name+(skill==='mar'?'武艺':'体魄')+'+3'+(life.stableLesson?'　体魄+2':''));})]:[]),
    lifeChoice(mate?'与'+fullName(mate)+'比稳骑 · 关系+5':'随陆绾慢骑一圈 · 龙体+2',()=>{
      if(mate){relAdd(c,mate,5);story(mate,'和陆绾在北苑比过稳骑，轮着给对方牵马。');return lifeOutcome('和骑射同好绕场，先说怎样才算稳。','关系+5');}
      return lifeOutcome('陆绾给皇帝挑一匹性子稳的马，慢慢走过半场。',chg({health:2}));})],[teacher]);
}

function storyCastLifeAyimu(c,r,life,stage,scene){
  const child=storyCastOffspring(c,7).find(k=>k.whiteSpringStudy&&childInPalace(k));
  if(stage===0)return scene('两边的市日','城门外商队已经备好驮物。白泉说的月末与关内用的市日差一天。阿依慕把母亲用的日历画在纸上，请礼官先定沿途怎样交接。',[
    lifeChoice('拨驿费先试一趟 · 国库−8',s=>{s.path='试市';return lifeOutcome('试用一段共同驿程，通译把两边容易写错的日期列成小单。',chg({treasury:-8})+'　'+cchg(c,{aff:4}),2);},()=>E().treasury>=8),
    lifeChoice('等两边重签同一日期',s=>{s.path='重签';return lifeOutcome('阿依慕请两边从同一日重新起算，家书照现有商路递。',cchg(c,{aff:3}),3);})]);
  if(stage===1)return scene('驿路回单','第一张回单搁在她手边。'+(life.path==='试市'?'有一段路比预计慢，商队却已带回母亲的信。':'改好日期的两张凭签一起回来了，这回使团没有人多等一天。'),[
    lifeChoice('核对回单，留一条家书驿路 · 情分+5',s=>{s.post=true;return lifeOutcome('两边留下同一条送家书的驿路，回路也列出日子。',cchg(c,{aff:5,mood:6}));}),
    lifeChoice('让礼官复看商路清单 · 威望+2',()=>lifeOutcome('礼官收下重抄的清单，边关照日期验收。',chg({prestige:2})))]);
  if(stage===2)return scene('席上两种话','白泉使者带来了署名的礼单，说愿长年照新市期来。阿依慕还要问一遍，年幼的译生往后可以去哪里学两边的商话。',[
    lifeChoice('给译生留听讲席',()=>{
      if(child){skillGain(child,'lit',4);kstory(child,'随阿依慕校了两地礼单，为新译生试讲。');}
      return lifeOutcome('使团同意留一席听讲，熟悉礼节的人可以照约协助。',child?child.name+'才学+4':cchg(c,{talent:3}));
    })],[child]);
  return scene('核白泉互市','新一季花期过去，使团递来互市货簿。'+(child?child.name+'愿照母妃教的白泉话替两地核单。':'礼官请阿依慕帮着读船队送来的记载。'),[
    lifeChoice(child?'让'+child.name+'随礼官核对 · 议成率75%':'由礼官和阿依慕核对 · 议成率55%',()=>{
      const ok=chance(child ? .75 : .55);
      if(child){skillGain(child,'lit',2);kstory(child,ok?'核清白泉互市货簿，亲眼看两边盖印。':'复核白泉货簿后仍有一处日期待对，已记给两边的通译。');}
      return lifeOutcome(ok?'两地货单相合，白泉互市照期开市。':'货单仍有一处日期不合，留给两边下次复核。',(ok?chg({people:3,prestige:1}):cchg(c,{aff:2}))+(child?'　'+child.name+'才学+2':''));
    })],[child]);
}

function storyCastLifeChuwan(c,r,life,stage,scene){
  const child=storyCastOffspring(c,8).find(childInPalace),q=empress();
  if(stage===0)return scene('门外的证人','有人从旧仓的村子来京补一张口供，只肯同认识的人说话。楚晚认得他从前给照养人带过柴，问能否隐去他搬家后住的门牌。',[
    lifeChoice('收实证，封住址 · 情分+6',s=>{s.path='封籍';return lifeOutcome('只收说得清的仓账和名字，现住处另封，楚晚愿意再问旧仓账。',cchg(c,{aff:6,mood:4}));}),
    lifeChoice('请他到礼官前说完 · 威望+2',s=>{s.path='公议';return lifeOutcome('证人由自己决定说哪些旧事。礼官当面听完，把可公开的抄本给楚晚核。',chg({prestige:2}));})]);
  if(stage===1)return scene('半批粮的去处','旧账上欠着几个村的粮。楚晚问，现在先补一处时，常平仓够不够留给别处。',[
    lifeChoice('调半批常平仓粮就近补发 · 民心+5',s=>{if(halfGrainReserve())clearGrainReserve();else S.flags.grainReserveHalf=true;s.aid=true;return lifeOutcome('补发半批现粮，运粮官按实记了数目，余粮仍以常平仓账为准。',chg({people:5}));},grainReserveReady),
    lifeChoice('拨银市买少量粮 · 国库−16，民心+3',s=>{s.aid=true;return lifeOutcome('拨银由地方就近籴粮，保留常平仓原有存粮。',chg({treasury:-16,people:3}));},()=>E().treasury>=16),
    lifeChoice('先复核欠粮名册',()=>lifeOutcome('让地方先一户户查，余下的欠粮留入卷宗，等有钱粮再办。',cchg(c,{aff:3})))]);
  if(stage===2)return scene('谁在卷尾署名',life.path==='公议'?'礼官留下一块空白，问本朝的查档人和前朝旧姓要不要一起署名。':'封卷时楚晚翻出方姓旧簿，问能不能让证词用本名，照养人的住处仍封着。',[
    lifeChoice('按她自己的意思落款',()=>{
      if(child){skillGain(child,'vir',4);kstory(child,'看母妃在仓卷落款，先听明白前朝那些账为何要重查。');}
      if(q&&q!==c)story(q,'听楚晚亲自决定仓卷如何署名，也请宫人别在照养人的住处传话。');
      return lifeOutcome('卷尾只列她愿意公开的字。'+(life.aid?'赈过的几户也各有回单留下。':'未补发的账照实留待下回。'),child?child.name+'品德+4':cchg(c,{aff:5}));
    })],[child,q].filter(o=>o!==c));
  return scene('复核一处粮仓','地方又送来一页夏粮账。楚晚指着两户近来迁出的名字，问要怎样核这一回的欠粮。',[
    lifeChoice('先拨半批仓粮再验回单 · 民心+4',()=>{if(halfGrainReserve())clearGrainReserve();else S.flags.grainReserveHalf=true;return lifeOutcome('本次用掉半批常平仓粮，楚晚在新旧清单间补进搬家的两户。',chg({people:4}),6);},grainReserveReady),
    lifeChoice('就地访核，抄回实数 · 情分+3'+(life.checkNewcomers?'，民心+2':''),()=>lifeOutcome('请地方照搬家后的户址找人，先把欠数抄实再议怎么发。',cchg(c,{aff:3})+(life.checkNewcomers?'　'+chg({people:2}):''),4))]);
}

function storyCastLifeSuheng(c,r,life,stage,scene){
  const other=storyCastLifePartner(c,o=>relGet(c,o)>=8);
  if(stage===0)return scene('香炉归位','苏蘅把旧炉和领用簿放回外间，搬进来一只小炉，只给愿意试的人用。她问自己能不能只做查簿的人，让掌事收银与点货。',[
    lifeChoice('她辨样，掌事管银 · 情分+5',s=>{s.path='分办';return lifeOutcome('领用簿分两处签字，苏蘅只在实物样品一栏落款。',cchg(c,{aff:5}));}),
    lifeChoice('请另一位妃嫔共同验样',s=>{s.path='复核';if(other){relAdd(c,other,6);story(other,'同苏蘅校了两份香样，自己和掌事各留了领用簿。');}return lifeOutcome('新样都留双签，供单由掌事公示。',other?'关系+6':cchg(c,{talent:3}));})],[other]);
  if(stage===1)return scene('三张供单','苏家和另外两家都投了单。掌事说可先给一笔押款，再从验过的货里结清。苏蘅把家铺的那张翻给你看，让第三人也核同一规矩。',[
    lifeChoice('拨押款，三家照同一标准验 · 国库−10',s=>{s.deposit=10;return lifeOutcome('库中实拨押款十万两，一直到验完都有可查的去处。',chg({treasury:-10}),2);},()=>E().treasury>=10),
    lifeChoice('只试样，请掌事按旧单供货',s=>{s.deposit=0;return lifeOutcome('没有新押款，旧单仍由掌事点数。她留下新样等以后比较。',cchg(c,{mood:4}),2);})]);
  if(stage===2)return scene('谁验最后一缸',life.deposit?'掌事验完三缸，账上还有六万两可退。苏蘅等另一名经手人写完名字才伸手接册。':'入库的几笔照旧单结清了。苏蘅指给你看，她自己负责的那一列只有几个批号。',[
    lifeChoice('照签过的账结算',s=>{const refund=s.deposit?6:0;s.deposit=0;return lifeOutcome('把验过的清单留在供香账房，退回银钱也按实记数。',(refund?chg({treasury:refund})+'　':'')+cchg(c,{aff:5}));})]);
  return scene('换季比香','掌事带两份到期的报价过来。苏蘅认出其中一批应暂存，问你愿不愿继续看这份账。',[
    lifeChoice('按诉求抽查后按旧约减支 · 国库+'+(life.orderByUse?7:5),()=>lifeOutcome('掌事向供货人核过到期支出，收回旧约多付的五万两。'+(life.orderByUse?'另扣去空炉的两万两。':''),chg({treasury:life.orderByUse?7:5})+'　'+cchg(c,{aff:2}),6)),
    lifeChoice('只与她看样，按旧账结清 · 心情+4',()=>lifeOutcome('苏蘅逐批道明来处，继续按掌事原先的账结清，没有另动押款。',cchg(c,{mood:4}),4))]);
}

function storyCastLifeXiaoman(c,r,life,stage,scene){
  const child=storyCastLifePupil(c),performance=life?.performance;
  if(stage===0)return scene('按手艺报工钱','小满从院里接了两个教本领的师傅来。她将杂役、学徒和能登台的各写一栏，说进宫领赏也照出力的人算。',[
    lifeChoice('为学徒垫一月工钱 · 国库−8',s=>{s.path='带徒';return lifeOutcome('两位师傅各领一份，来学手艺的孩子先学，工钱等能上台再另计。',chg({treasury:-8})+'　'+cchg(c,{aff:5}),2);},()=>E().treasury>=8),
    lifeChoice('先办街坊师傅的约',s=>{s.path='结约';return lifeOutcome('街坊自己分工，帮手的工钱也另起一栏。小满在约上写清什么时候再问。',cchg(c,{aff:4}),2);})]);
  if(stage===1)return scene('一张要紧的契','有人提议把替戏班跑腿的几个孩子也签成宫里的人。岑小满把笔搁下，说孩子们可以学艺，也可以回院里做别的活。',[
    lifeChoice('约定按场交账，孩子自择 · 民心+2',()=>lifeOutcome('戏班仍按场领钱，学徒不因演过一回就改了籍。',chg({people:2})+'　'+cchg(c,{mood:4}))),
    lifeChoice('让内务府只与师傅立约 · 情分+5',()=>lifeOutcome('内务府只同各位师傅结工钱，学徒不用到宫里签押。',cchg(c,{aff:5})))]);
  if(stage===2)return scene('第一场自己登台',life.path==='带徒'?'院里最稳的两个学徒都已经练熟，央她听一遍开场。':'两位街坊师傅愿先带徒一同试一场，验过座位再谈能否开演。',[
    lifeChoice('给她留一次宫宴登台的名帖',s=>{s.booking=S.turn;return lifeOutcome('将节目记入下一场实际办成的宫宴。宴后小满会来对上台和领钱的名册。',cchg(c,{aff:3}));})]);
  if(performance!=null)return scene('散席工钱簿','宫宴已经散了。岑小满带了两份名单来，一份是台上人，一份是台下布置的人。她问都能不能按场领钱。',[
    lifeChoice('照册发给各人 · 国库−6，民心+'+(life.backstageCredit?5:3),s=>{delete s.performance;s.settled=true;return lifeOutcome('按两份名册逐人发了工钱，院里收到一封可核对的回信。'+(s.backstageCredit?'学徒和抬箱师傅一道报了姓名。':''),chg({treasury:-6,people:s.backstageCredit?5:3})+'　'+cchg(c,{aff:4}),4);},()=>E().treasury>=6),
    lifeChoice('记明国库欠付，先给领钱凭签',()=>{const note='欠款仍留在账上，日后可以回来发放。';return lifeOutcome(note,cchg(c,{mood:-2}),1);})]);
  if(life.booking!=null)return null;
  return scene('排下一场戏',child?'小满捧来两枚不值钱的铜钱。'+child.name+'还记得她演过的第一手。':'小满找出一张换新的节目单，问什么时候还有下一场杯盏响。',[
    lifeChoice('排入下一场宫宴',s=>{s.booking=S.turn;return lifeOutcome('下一场实际开办的宫宴由戏班登台，散席后按名单结账。','',1);}),
    ...(child?[lifeChoice('教'+child.name+'一手小戏 · 才学+2',()=>{skillGain(child,'lit',2);kstory(child,'跟岑小满学会看铜钱从哪里换手，也知道台下的人都按名册领钱。');return lifeOutcome('把一个简单戏法教给'+child.name+'，戏班下一场仍未排定。',child.name+'才学+2');})]:[])],[child]);
}

function storyCastLifeSecret(c,r,life,scene){
  const key=c.fixedStory,d=STORY_CAST_LIVES[key];
  if(key==='qingyi'&&season()===2&&c.aff>=60&&life.trust)return scene(d.secret,
    '入秋后沈母托人还来最后一页借签。清漪从秋灯下递给你，说这一次回信里，终于没人争当初是谁负了谁。',[
    lifeChoice('把新旧两封都留给她 · 情分+7',()=>lifeOutcome('她收好两封信，另取一张纸写了一句「我如今很好」。',cchg(c,{aff:7,mood:8})))]);
  if(key==='luwan'&&c.story.some(e=>/陆绾按期归宫|军驿最后补发|提前从北境军驿回宫/.test(e.t)))return scene(d.secret,
    '北境军驿带来一匹老马，正是陆绾离开军营时嘱人留下照料的那匹。她先试它脚还疼不疼，才想起来谢人把它送来。',[
    lifeChoice('把马留下养老 · 国库−5，情分+6',()=>lifeOutcome('北苑给老马腾出一栏，不再令它负重。陆绾从伤簿上亲手勾掉等回信的一项。',chg({treasury:-5})+'　'+cchg(c,{aff:6,mood:6})),()=>E().treasury>=5)]);
  if(key==='ayimu'&&season()<=1&&(life.post||r.whiteSpringPost))return scene(d.secret,
    '雨后使团捎来一个新香囊，花样还是从前那朵，缝得却比原先慢。阿依慕猜母亲近来手抖，问出门的人是否见过她。',[
    lifeChoice('陪她问过使者，再写封回信 · 情分+6',()=>lifeOutcome('她亲手写下自己的近况，想让母亲少挂念，末尾还问她用了哪色线。',cchg(c,{aff:6,mood:8})))]);
  if(key==='chuwan'&&life.aid&&season()===2)return scene(d.secret,
    '得过粮的一户托人送来一只旧木碗。方晚认得底下那道缝，家里从前也用过。她问是否可以自己收着，别写成哪一家的谢礼。',[
    lifeChoice('让她把碗留下 · 情分+6',()=>lifeOutcome('旧木碗留在她自己的抽屉里。秋来再核仓账，她还记得当年有人借给家里一碗粮。',cchg(c,{aff:6,mood:4})))]);
  if(key==='suheng'&&E().health<70&&c.aff>=55)return scene(d.secret,
    '听说陛下乏，苏蘅把香炉往外推了推，只留一盏温茶。她说有时心烦，清清静静把话讲完就好。',[
    lifeChoice('不点香，坐一会儿 · 龙体+2',()=>lifeOutcome('炉仍空着。她支开收账的人，陪陛下把这一日的事说完。',chg({health:2})+'　'+cchg(c,{aff:4})))]);
  if(key==='xiaoman'&&life.settled)return scene(d.secret,
    '散席那天台下扫出一枚铜钱。小满把它放在账上，逐个问谁的，问完才说是自己藏进去逗学徒记账的。',[
    lifeChoice('让她把铜钱留给认真对账的人 · 情分+6',()=>lifeOutcome('她挑了最先报出多一文的学徒，把那枚专为排戏准备的铜钱留给他。',cchg(c,{aff:6,mood:5})))]);
  return null;
}

function storyCastLifeAfter(c,life,scene){
  const key=c.fixedStory,title=STORY_CAST_LIVES[key].after;
  if(key==='qingyi'){
    const child=storyCastLifePupil(c);
    return scene(title,'新抄本送来了。末页写着「旧抄一本」，清漪翻到母亲当年用朱笔补的那个字：“她也在这本书上做过工夫。”她想在校记末尾添上母女两代的名字，家信仍由自己收好。',[
      lifeChoice('准母女同署，留作讲本',s=>{s.signedCopy=true;return lifeOutcome('在卷末分署沈母订字、清漪复校。此后皇嗣来校书，可多读一层母女旁注。',cchg(c,{talent:3}));}),
      lifeChoice(child?'请'+child.name+'做私本的第一位读者':'陪她装订一册家藏本',()=>{
        if(child){skillGain(child,'lit',5);kstory(child,'第一个读到清漪母女合署的家藏本，亲手描下卷尾的朱笔。');}
        return lifeOutcome('把母女二人的名字写在私本上，照她的意思收进书匣。',cchg(c,{aff:6})+(child?'　'+child.name+'才学+5':''));})],[child]);
  }
  if(key==='luwan'){
    return scene(title,'北苑那匹退下来的驿马，一听铃响便伸头找旧日的马夫。陆绾把鞍子摘下：“今日教人听它喘气。它已经替我们跑够了。”',[
      lifeChoice('留老马在栏，给北苑学员上识马课',s=>{s.stableLesson=true;return lifeOutcome('在栏外挂上休骑木牌。此后皇嗣来授课，先学看马的步态，再练自己的脚力。',cchg(c,{mood:5}));}),
      lifeChoice('照伤簿描一页，送给仍在军驿的人',()=>{const kin=houseOf(c);for(const p of [kin?.father,kin?.brother].filter(officialServing))storyCastLifeLetter(p,'读到陆绾寄来的旧马图，认出当年送信那匹马耳边的白斑。');return lifeOutcome('按旧伤簿画下马耳和蹄印，附上它如今能安稳吃草的消息，随驿袋送往北境。',cchg(c,{aff:6})+'　'+chg({prestige:2}));})]);
  }
  if(key==='ayimu'){
    const drummer=(c.gardenDrummers||[]).map(byId).find(o=>inPalace(o)&&danceFriend(c,o));
    const child=storyCastOffspring(c,7).find(k=>k.whiteSpringStudy&&childInPalace(k));
    return scene(title,'香囊里还压着一小片花瓣。回白泉的信封已经糊好一半，阿依慕又拿了回来：“光说我过得好，母亲哪知道我跳到哪一拍了？”',[
      lifeChoice(drummer?'请'+fullName(drummer)+'同录鼓谱寄回去':'陪她敲一遍，替她记下鼓点',()=>{if(drummer){story(drummer,'与阿依慕把学过的舞曲录成鼓谱，自己的名字也随家书去了白泉。');relAdd(c,drummer,7);}return lifeOutcome('把宫宴所用的急拍、收袖前的轻拍逐一记在谱上，让母亲在白泉也能照着敲。',cchg(c,{aff:5})+(drummer?'　两人关系+7':''));}),
      lifeChoice(child?'让'+child.name+'用白泉话给外祖母写谱注':'请她亲笔写一份双语谱注',()=>{if(child){skillGain(child,'lit',5);kstory(child,'替母亲的舞谱写了白泉语小注，第一次把故乡歌名完整写给外祖母。');}return lifeOutcome('把两种话写在同一段谱下，给故乡的回信终于封好了。',child?child.name+'才学+5':cchg(c,{talent:4}));})],[drummer,child]);
  }
  if(key==='chuwan'){
    const child=storyCastLifePupil(c);
    return scene(title,'楚晚把那只裂碗搁在新册旁。粥棚按户发筹，昨日恰有一户迁来，名下的孩子到散棚也没领着。她把那一行圈出来，请你看看漏在何处。',[
      lifeChoice('给迁户添补领栏，每回核仓都查漏户',s=>{s.checkNewcomers=true;return lifeOutcome('旧册添了迁入日期与领筹两栏。往后她就地访核粮仓时，也会查刚落脚的人家。',chg({people:3}));}),
      lifeChoice('从国库补给本次漏领的人家 · 国库−6',()=>{if(child){skillGain(child,'vir',4);kstory(child,'跟楚晚数完漏发的粮筹，记住了粥棚外等着的一家人。');}return lifeOutcome('按核实的漏领名单拨补粮钱，旧碗仍归本人收存。',chg({treasury:-6,people:5})+(child?'　'+child.name+'品德+4':''));},()=>E().treasury>=6)],[child]);
  }
  if(key==='suheng'){
    const other=storyCastLifePartner(c,o=>relGet(c,o)>=8);
    return scene(title,'苏蘅翻到一张供单，上写「各殿照旧」，连她亲自收起香炉那日也算了一份。她在纸边画只空炉：“这一栏，往后总得有人能勾。”',[
      lifeChoice('供单改为按殿领用，空炉可停供',s=>{s.orderByUse=true;return lifeOutcome('掌事逐殿核签，空炉从下季的订量中扣除。此后抽查旧约可多省二万两。',cchg(c,{talent:3}));}),
      lifeChoice(other?'请'+fullName(other)+'同核这笔，退回未用香银':'请掌事清点这笔，退回未用香银',()=>{if(other){story(other,'与苏蘅核对空炉旧账，见她连自家香铺也照样追退。');relAdd(c,other,6);}return lifeOutcome('按领簿退回这一次未焚用的香银，苏家铺契也销去这一笔。',chg({treasury:8})+(other?'　两人关系+6':''));})],[other]);
  }
  return scene(title,'戏班学徒拿着那枚铜钱来交账，指着戏单最下面一行：“抬箱子的师傅也会手彩，可台前的人总认不得他。”小满把幕布掀开一角，等你说这回怎样开场。',[
    lifeChoice('让幕后师傅带徒谢幕，往后两班同记',s=>{s.backstageCredit=true;return lifeOutcome('台上师傅报了抬箱人和学徒的名字。从下一次真正演出并结清工钱起，两班都记在戏单上。',cchg(c,{aff:5}));}),
    lifeChoice('另拨一场教艺钱，让师傅回街坊开课 · 国库−6',()=>lifeOutcome('把教艺钱另立一笔，不抵戏班的工钱。师傅带着旧幕布回了大杂院，小满答应等他们能上台时亲自来看。',chg({treasury:-6,people:5})+'　'+cchg(c,{mood:5})),()=>E().treasury>=6)]);
}

const STORY_CAST_LIFE_BUILDERS={qingyi:storyCastLifeQingyi,luwan:storyCastLifeLuwan,ayimu:storyCastLifeAyimu,
  chuwan:storyCastLifeChuwan,suheng:storyCastLifeSuheng,xiaoman:storyCastLifeXiaoman};
function storyCastLifeEvent(c,kind){
  const r=STORY_CAST_LIVES[c?.fixedStory]&&storyCastLifeRecord(c);
  if(!storyCastLifeUnlocked(c,r))return null;
  const life=r.life,stage=life?.stage||0;
  if(kind==='after'&&(journalContentVersion()<76||stage<3||life.secret==null||S.turn<life.secret+2||life.after!=null))return null;
  if(kind==='secret'&&(stage<3||life.secret!=null))return null;
  if(kind==='chapter'&&(stage>=3||S.turn<(life?.due??0)))return null;
  if(kind==='routine'&&(stage<3||S.turn<(life?.next??0)))return null;
  const scene=(title,text,choices,cast)=>storyCastLifeScene(c,r,life,kind,fullName(c)+' · '+title,text,choices,cast);
  return kind==='after'?storyCastLifeAfter(c,life,scene):kind==='secret'?storyCastLifeSecret(c,r,life,scene):
    STORY_CAST_LIFE_BUILDERS[c.fixedStory](c,r,life,stage,scene);
}
A.storyCastLife=function(id,kind){
  if(modalOpen||!['chapter','routine','secret','after'].includes(kind))return;
  const ev=storyCastLifeEvent(byId(id),kind);
  if(ev&&useE())pushEv(ev);
};
function storyCastLifePanel(c){
  if(!storyCastLifeActive()||!c.fixedStory)return '';
  const r=storyCastLifeRecord(c),d=STORY_CAST_LIVES[c.fixedStory];
  if(!r||!d)return '';
  const life=r.life,stage=life?.stage||0,chapter=storyCastLifeEvent(c,'chapter'),routine=storyCastLifeEvent(c,'routine'),secret=storyCastLifeEvent(c,'secret');
  const due=(stage<3?life?.due:life?.next)??S.turn,wait=Math.max(0,due-S.turn);
  const options=[['chapter',chapter],['routine',routine],['secret',secret],['after',storyCastLifeEvent(c,'after')]].filter(([,event])=>event)
    .map(([key,event])=>`<button class="btn jade" onclick="A.storyCastLife(${c.id},'${key}')" ${E().energy?'':'disabled'}>${esc(event.title.split(' · ').at(-1))}<small>精力−1</small></button>`).join('');
  const status=c.fixedStory==='xiaoman'&&life?.performance!=null?'戏已演完，散席工钱尚待结算。':
    c.fixedStory==='xiaoman'&&life?.booking!=null?'戏班已经排入下一场宫宴。':
    !inPalace(c)?'在宫里相见后才可续谈。':
    !storyCastLifeUnlocked(c,r)?(c.fixedStory==='suheng'&&!r.amends?'先处理换香旧事并完成赔礼。':'入宫满两个月可开始。'):
    wait>0?'还需等 '+wait+' 个月。':stage>=3?'三幕已写入纪事，可继续日常往来。':d.chapters[stage]+'可以续谈。';
  return detailSection(esc(d.title),'<p>'+esc(d.guide)+'</p><p class="hint">'+esc(status)+'</p>'+
    '<ol>'+d.chapters.map((title,i)=>'<li>'+esc(title)+(i<stage?' · 已记入纪事':'')+'</li>').join('')+'</ol>'+
    (life?.secret!=null&&journalContentVersion()>=76?'<p class="hint">'+esc(d.after)+(life.after!=null?' · 已记入纪事':S.turn<life.secret+2?' · 特殊事件两个月后可续谈':' · 可续谈')+'</p>':'')+
    (options?'<div class="acts">'+options+'</div>':''));
}
function storyCastLifeMonthly(offered){
  if(!storyCastLifeActive())return null;
  for(const c of harem().filter(o=>o.fixedStory&&!offered.some(ev=>ev.por===o))){
    const r=storyCastLifeRecord(c);
    if(!r)continue;
    const ev=storyCastLifeEvent(c,'after')||storyCastLifeEvent(c,'secret')||storyCastLifeEvent(c,'chapter');
    if(ev&&ev.title!==r.lifeNotice){
      ev.onQueue=()=>{r.lifeNotice=ev.title;};
      return ev;
    }
  }
  return null;
}
function storyCastLifeBanquet(){
  if(!storyCastLifeActive())return '';
  const r=storyCastRecord('xiaoman'),c=storyCastPerson(r),life=r?.life;
  if(!life||life.booking==null||!storyCastLifeUnlocked(c,r)||life.performance!=null)return '';
  delete life.booking;life.performance=S.turn;life.next=S.turn;
  return storyCastRecordLine(c,'戏班按名册在这场宫宴登台，布置和演出各记一页，散席后可到人物档案对账。');
}
