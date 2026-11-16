/* Original romance, gated so unfinished older scenes keep their recorded answers. */
const xieRomanceActive=()=>royalHeartActive()&&journalContentVersion()>=22;
const XIE_PHASE_ACTIONS={meeting:'赴诗会，重新相识',knowing:'看两人如何渐渐相知',proposal:'查看谢安的求亲书帖',answer:'听公主亲口答复'};
const xieUnbound=p=>!!p&&!p.married&&!p.spouse&&!p.royalSpouseId&&!p.betrothal&&!p.xiean.widowed;
const XIE_FREE_WORDS=[
 '春日曲水流觞，他临水写诗，衣袖沾了酒也不在意。有人提起旧日婚议，他从容道：“是我无意成家，不是公主有半分不好。”散席仍独自乘舟。',
 '花灯夜有人问他，可曾遇见想共度一生的人。他收起折扇笑道：“此生许给山川与诗酒，便不再借情诗误人。”他照旧惊艳满座，却未向谁许下婚诺。',
 '江湖旧友携酒入京，他在江边相迎，新诗一夜传遍书肆。席上又有人说媒，他温言谢过：“早已说定终身不娶，莫替我耽误人家的好年华。”',
 '世家长辈劝他留一个归处。他寄回一卷新诗，说山中有友、江上有舟，独身也过得认真。他终身不娶的心意未改，待旁人仍有礼有情。'
];
const XIE_FREE_CHRONICLES=[
 '城南书肆要替他印集，把一首未署名的旧诗也排了进去。谢安认出那首是店里抄书人的，便翻出原稿，请掌柜把名字还给人家。新书出来那日，两人一块去吃了碗面。',
 '江上水浅，往年的船过不去。旧友问诗会是否就此取消，谢安卷起袖子，把酒和竹席一件件搬上岸。那天诗作得不多，他倒记住了同席人教的几句船歌。',
 '熟人送来一束新梅，嫌其中一枝偏往墙上长。谢安把那枝留下，插在读书窗边。几日后邻家少年来借砚台，他让出临窗的位置，两人分坐一案，各自做完了手里的事。'
];
const XIE_KNOWING={
 灵动:['她在诗会散后领他去看河边新扎的纸鸢，讲到有趣处，自己先笑了。他听着，竟忘了原要赶回去的时辰。','从前见她只是公主，今日才见到这样明亮的一个人。'],
 好奇:['她问起他诗中渡口的水色，又追问船夫为何不肯夜航。谈过一轮月升，她仍有许多想知道的事，他也愿意慢慢答。','她要听的是我真正见过的天地，不是别人替我堆出的声名。'],
 好胜:['她带着改过的文章来，偏不许他因身份让步。他认真挑出两处，她反问得有理，倒叫他当场改口。','与她并肩，不必总做无所不知的人。认输竟也让人欢喜。'],
 爽直:['她说起上回难过，既不遮掩，也不责怪他的拒绝：“我喜欢过你，可你不欠我。”他收了笑，郑重听她说完。','她敢把心意说得这样坦然，我反而更不愿敷衍她一句。'],
 仁厚:['席间有抄书的小姑娘打翻茶盏，她先扶住烫红的手，没有顾自己的新裙。他陪她找来凉水，又听她说起日常照料人的琐事。','她的温柔不只给心上人。这一刻，我想认真珍重她。'],
 审慎:['她问他若不做官，如何安排书肆收入，又是否愿让妻子保有自己的志趣。他逐一答复，头一回觉得谈日子并不扫兴。','她看见的是一个要过日子的人，不只是一卷好看的诗。'],
 内敛:['两人隔案校诗，她起初说得很轻。他放下笔等着，终于听见她完整的想法。告别时，她把一页亲注的诗笺递给他。','我想再听她说下去，不只为怕她伤心。'],
 自矜:['她指出他的诗里有一处用典太满，既不因爱慕奉承，也不因辞婚故意为难。他将那句划去，请她再看。','她自有她的光彩，并不需要我的喜欢来证明。可我已开始期待她的目光。']
};
const XIE_BEFORE_PROPOSAL={
 lively:['下回有约','诗会散席时，她提起摊上有幅画，把燕子的尾巴画反了。隔了几日，谢安路过那摊，问明何时换画，才写信请她同去。公主在回信末尾添了一句：“这回你先告诉我，你看出了什么。”','过去总等旁人来邀，如今遇见可以同看的事，倒先想提笔。','他自己找来了下一回的话头。'],
 gentle:['话记在心上','她在诗席提过，收书的人若总在饭点催人，抄书人连口热汤也喝不成。再见时，谢安带来一张改过的交稿单，特意留出午间一段空白。她端详片刻，把先前那份也收了起来。','有些话听过以后，该改的是自己的做法。','我那日只随口一提，他却真拿来照做了。'],
 quiet:['一页留白','谢安借来一本小集，归还时把一张素纸夹在卷末。她问为何一字也没写，他答：“你上回讲到这里，正说到有意思的地方。想着留一页，等你愿意时续上。”过了两日，她递回写了半页的批注。','纸上的话可以慢慢等，有人肯接下去就好。','那半页我改了很久，好在他没催我交卷。']
};
const XIE_AFTER_PARTING={
 lively:['给自己留半日','她抽了半日出门看新挂的灯样，回来把最喜欢的那盏画在纸上。孩子们问要送给谁，她想了想，把图样压在自己窗前：“先做一盏给我。”','好些事以前总等人相约，其实今天就能去。'],
 gentle:['又添一席','她把手里的旧书归好，想起近来常有人来借，便在院里另置一张桌案。第一日来的人很少，她也照旧点了灯，坐下来把自己那一卷读完。','这些日子总在想以后会怎样。这张桌子，倒可以今天就摆起来。'],
 quiet:['自己的署名','她整理薄薄一册读书札记，序改了三次，终于在末页署上自己的名字。抄书人来问要送往何处，她挑了几位平日谈得来的朋友，也给自己留了一本。','这一册写的都是自己的话。往后再翻起来，大约还能认得今天的我。']
};
const XIE_BETROTHAL_CHRONICLES=[
 ['婚约后的书友','亲友同席的诗会里，公主谈起新读的书，谢安认真听完，又借给她一册游记。婚约仍只是婚约，两人各自回家，未开始夫妻生活。','她的想法渐渐鲜明，我也愿多了解她一些。','慢慢长大，也慢慢看见诗名以外的他。'],
 ['问一处山路','公主和亲友同来书肆，拿一册游记向谢安请教。她指出书里前后两处里程对不上，谢安便找来另一张旧图，与众人一同核对。临散他把错误记在册里，旁边写了她的名字。','这处错我从前读过几遍，她头一回便留了神。','原来指正大诗人，也可以是平常读书的事。'],
 ['一册书的归期','亲友同席时，谢安问她愿借哪本书。她选了薄些的一本，说近来还有功课，读不完长卷。谢安在书签上写下归期，另添一句，若有事误了，尽管托人说一声。','知道她忙些什么，才知道什么时候该等。','婚约有婚约的日子，这本书还是照我自己的进度读。'],
 ['灯下各题一字','亲友聚坐续诗，她写了一个“远”字，谢安另写一个“迟”字。大家说哪一个都入韵，他却请她先讲讲自己的意思。她说完才发现，他把原先那一行空着，等众人都说过再落笔。','不妨多听片刻。这一行迟一点写，也有迟一点的所得。','往后若见解不同，我也愿像今天这样慢慢说。']
];
function xiePathStart(k,p){
 if(!xieRomanceActive()||p.xiean.path||!xieUnbound(p))return;
 const alone=chance(.45);p.xiean.path={kind:alone?'solitude':'return',childId:k.id,at:S.turn,last:S.turn,stage:0};
 if(alone)scholarRecord(p,'【暂寄诗酒】辞婚之后，谢安仍愿独自游赏，无意再议婚事。此刻未把话说成终身誓愿，但若往后无人相知，他也愿独身过完这一生。');
}
function xieCanPursue(k,p=xieAn()){
 if(!p||p.xiean.lifelongSingle||p.xiean.path)return false;
 if(p.xiean.pursuerId!=null)return p.xiean.pursuerId===k?.id;
 const bold={爽直:8,灵动:7,好胜:6,好奇:5,仁厚:4,自矜:3,审慎:2,内敛:1};
 const candidates=S.children.filter(c=>xieAdmirerReady(c)).sort((a,b)=>(bold[childDisposition(b)]-bold[childDisposition(a)])||a.id-b.id);
 return candidates[0]===k;
}
const romanceMarriageReady=xieMarriageReady;
xieMarriageReady=function(k,p=xieAn()){
 if(!xieRomanceActive())return romanceMarriageReady(k,p);
 return xieCanPursue(k,p)&&xieAdmirerReady(k)&&k.xieAdmiration?.personId===p.id&&k.xieAdmiration.outcome==='admired'&&S.turn>=(k.marriageAfter??0);
};
const romanceRefusal=xieMarriageRefusal;
xieMarriageRefusal=function(k,p){
 const ev=romanceRefusal(k,p);if(!ev||!xieRomanceActive())return ev;
 if(p.xiean.pursuerId==null){p.xiean.pursuerId=k.id;heartRecord(k,'愿问君心','读过谢安的诗，也听过旁人的赞叹后，她终于主动请'+(S.children.includes(k)?'父皇':'陛下')+'问一问这门亲事。','欣赏他的不止我一个，可这一次，我想大胆为自己的心意说句话。');}
 if(kidAge(k)<15){let done=false;const gen=S.gen,valid=()=>!done&&S.gen===gen&&xieMarriageReady(k,p)&&kidAge(k)<15;
  ev.choices[0]={t:'强制定亲，待公主满十五岁再成婚 · 国库−50',cond:()=>valid()&&E().treasury>=50,why:'须双方仍无婚约，公主未满十五岁且国库足够',f:()=>{if(!valid()||E().treasury<50)return null;done=true;chg({treasury:-50});return xieBetroth(k,p,'forced');}};
  ev.text+='\n公主尚未满十五岁，此时即使坚持旨意，也只登记订婚，不入夫妻生活。';
 }
 const decline=ev.choices[1].f;ev.choices[1].f=()=>{const result=decline();if(result)xiePathStart(k,p);return result;};return ev;
};
const romanceAdmirer=xieAdmirerReady;
xieAdmirerReady=function(k){
 if(!xieRomanceActive())return romanceAdmirer(k);
 const p=xieAn(),h=xieHouse(p);
 return xieHeartReady(k)&&kidAge(k)<=25&&xiePresent(p)&&xieUnbound(p)&&p.age<=(xieStoryUpdated()?45:35)&&
  !mothersOf(k).some(m=>houseOf(m)?.father.id===h?.rootId)&&E().sur!=='谢';
};
function xiePathTarget(p=xieAn()){return p?.xiean.path&&royalById(p.xiean.path.childId);}
function xiePathEligible(p=xieAn(),k=xiePathTarget(p)){
 return xieRomanceActive()&&['solitude','return'].includes(p?.xiean.path?.kind)&&xieUnbound(p)&&!!k?.alive&&k.sex==='f'&&kidAge(k)>=12&&!k.married&&!k.spouse&&!k.betrothal&&k.xieAdmiration?.personId===p.id&&k.xieAdmiration.outcome==='declined';
}
function xiePathAvailable(p=xieAn(),k=xiePathTarget(p)){
 return xiePathEligible(p,k)&&xiePresent(p)&&xieCanMeetPrincess(k)&&k.hp>=45&&!mourningActive();
}
function xiePathClose(p,k,text){
 const path=p.xiean.path;path.kind='free';path.closedAt=S.turn;delete path.pending;p.xiean.lifelongSingle=true;
 scholarRecord(p,'【各自珍重】'+text+'他收好这一段心事，仍以诗酒自遣，此后不再议婚。');
 if(k?.alive)heartRecord(k,'各自珍重',text,'旧事留在记忆里，往后的生活仍属于自己。');
}
function xiePathTick(p){
 const path=p?.xiean.path;
 if(!xieRomanceActive()||!path)return;
 if(path.kind==='free'&&xieStoryUpdated()){
  const k=xiePathTarget(p);
  if(path.closedAt!=null&&S.turn-path.closedAt>=6&&!path.partingRemembered&&xieCanMeetPrincess(k)&&k.hp>=45){
   const [title,scene,thought]=XIE_AFTER_PARTING[xieTemperamentGroup(k)];
   kstory(k,`【${title}】${scene} 心中所想：${thought}`);path.partingRemembered=true;
  }
  return;
 }
 if(!['solitude','return'].includes(path.kind)||!officialAlive(p)||path.checkedAt===S.turn)return;
 path.checkedAt=S.turn;const k=xiePathTarget(p);
 if(!xieUnbound(p)){path.kind='closed';delete path.pending;return;}
 if(!xiePathEligible(p,k)){xiePathClose(p,k,!k?.alive?'听闻公主已逝，谢安将未能说完的话收进旧诗。':k.betrothal||k.married||k.spouse?'得知公主已有婚约或归处，谢安没有再提旧日婚议，也没有打扰她的生活。':'旧日心意已变，谢安不再以往事打扰公主。');return;}
 if(path.kind==='solitude'){if(S.turn-path.at>=18)xiePathClose(p,k,'辞婚后一年半，两人没有继续相知。谢安认真想过，决定将此生留给山川、诗酒与朋友，终身不娶。');return;}
 if(path.pending||!xiePathAvailable(p,k))return;
 const elapsed=S.turn-path.last;
 if(xieStoryUpdated()&&path.stage===2&&elapsed>=1&&!path.beforeProposal){
  xieCoupleRecord(p,k,...XIE_BEFORE_PROPOSAL[xieTemperamentGroup(k)]);path.beforeProposal=true;
 }
 if(elapsed<3||!chance(.35))return;
 path.pending=['meeting','knowing','proposal'][Math.min(2,path.stage)];path.last=S.turn;
 if(path.stage===0){
  const reserved=['自矜','审慎','好胜'].includes(childDisposition(k));
  const sorrow=reserved?'公主在人前照旧自持，独处时却搁下诗卷许久，眼眶微红。':'公主连日读到旧诗便落泪，侍女劝她用膳时，她才勉强拭去泪痕。';
  heartRecord(k,'旧诗未干',sorrow+'她准许侍女转达自己尚未放下的心情，也说明不愿用难过逼他点头。','原来放下一段心意，不能只凭一句算了。',-.25);
  scholarRecord(p,'【听闻旧事】经公主准许，侍女转告她近日的伤心。谢安不忍，却自省：“若只为不见她落泪便许婚，往后才是真正误她。”他愿先在诗会相识，不作婚诺。');
 }
 log(path.stage===2?'谢安亲自递来求亲的书帖，可到他的档案听他说明心意。':'谢安与公主的旧日心事有了后续，可到两人的档案查看。',1);
}
function xiePathEvent(){
 const p=xieAn(),k=xiePathTarget(p),path=p?.xiean.path,phase=path?.pending;
 if(!phase||!xiePathAvailable(p,k))return null;
 let done=false;const gen=S.gen,valid=()=>!done&&S.gen===gen&&p.xiean.path===path&&path.pending===phase&&xiePathAvailable(p,k);
 const updated=xieStoryUpdated(),letter=updated&&phase==='meeting'&&path.meetingSource==='courage';
 const finish=()=>{if(!valid())return false;done=true;delete path.pending;delete path.meetingSource;path.last=S.turn;return true;};
 const goodbye=()=>{
  if(!finish())return null;
  if(updated){
   const parting=phase==='answer'
    ? '公主将书帖轻轻折好：“当年盼你点头是真的。只是后来，我也学会把自己的日子过得有滋味。如今看见这封信，我欢喜的是你肯亲口告诉我。要应下这门亲事，我却已经没有当年的心意了。”谢安托人回了一句：“谢殿下相告。今日能听到这句实话，便不枉我亲自落这一笔。”'
    : '公主托人捎去一页短笺：“你的诗，我往后还会读。至于相见，这一回就作罢吧，我也有想去做的事。”谢安回了一句：“愿殿下往后所行，皆出自己心意。”';
   xiePathClose(p,k,parting);return parting;
  }
  xiePathClose(p,k,'公主想过之后，决定把这份旧日心意留在过去。谢安听到明确的答复，温言道珍重，未再追问。');return '旧事到此为止，两人的纪事各自留下这一回告别。';
 };
 const defer=(t,reminder)=>updated?{t,chronicle:false,f:()=>valid()?reminder:null}:{t};
 if(phase==='meeting'||phase==='knowing'){
  const first=phase==='meeting',row=XIE_KNOWING[childDisposition(k)];
  const scene=letter?'谢安的回笺夹着她原先写的那一页。他把纸边折到她写自己志趣的地方，添了一行小字：“这一段写得好。若殿下还愿意说，我想听完。”公主把来信读了两遍，提笔又搁下。':first?'谢安愿在有亲友同席的诗会上与公主交谈。公主收到邀请，仍想认识传闻之外的他，也明白这不是婚约。':row[0];
  return chronicleEvent({title:letter?'一页回笺':first?'旧诗之外，重新相识':'渐识卿心',cast:[k,p],present:first?[]:xieCapitalEstate(k)?[p]:[k,p],valid,text:scene+'\n'+(first?'这一次可以给彼此一个认识的机会，也可以就此放下。':'交谈渐渐超出了诗句，两人都在认识对方真实的日常。'),choices:[
   {t:letter?'公主回信，愿与他再谈':first?'公主愿意赴会，让两人重新相识':'让他们按自己的心意继续来往',f:()=>{if(!finish())return null;path.stage++;
    const text=letter?'公主回信：“我的字还没写到末页，你倒肯在这一句停下来。下回见面，我说剩下的，你也得说一件诗里没有的事。”谢安把手边拟了一半的客套回信揉掉，重新写下一个“好”字。':first&&updated?'诗会上，公主摊开他的旧诗，指着涂改过的两字问取舍。谢安把自己的草稿推过去：“原来这一句，还有人肯问我为什么改。”他笑着问起她案头正读的书。散席时，两人只约下次再谈。':first?'公主应邀赴诗会。谢安认真听她说完喜欢哪一句，也问了她平日的志趣。散席时只约再谈，并未订婚。':scene;
    xieCoupleRecord(p,k,first?'重新相识':'渐识卿心',text,first?'愿再见她，是想认识这个人，不能拿怜惜当成爱。':row[1],first?'这回我也想亲眼认识他，若不合适，仍有说不的余地。':'他开始记住我说的小事。我也渐渐看见诗名以外的他。');return text;}},
   {t:'公主决定放下，转达她的告别',f:goodbye},defer('暂缓，改日再听','这段相识暂缓，仍可从两人的档案继续。')]});
 }
 if(phase==='proposal'){
  const declaration=xieStoryUpdated()?'从前辞婚，谢安确无此意；今日求娶，也是真心。':`从前辞婚，是草民真无此意；如今求娶，也是真心。`;
  const request=xieStoryUpdated()?'还请陛下准许再向殿下问一句。若她不愿，谢安绝不拿迟来的心意为难她。':`求陛下容我再问她一句。若她不愿，草民绝不拿迟来的心意为难她。`;
  return chronicleEvent({title:'谢安主动提亲',por:p,present:[p],valid,text:`谢安亲自递来求亲书帖，为${kidName(k)}郑重一礼。\n“${declaration}最初不忍她伤心，后来才明白，自己已在盼每一次见面。”\n“${request}”`,choices:[
  {t:'转告公主，听她亲口答复',f:()=>{if(!finish())return null;path.pending='answer';scholarRecord(p,`【主动求娶】亲自为${kidName(k)}递上求亲书帖，坦陈数次相识后的心意，尚未订婚，等她亲口答复。`);pushNow(xiePathEvent());return null;}},
   defer('暂留书帖，稍后再议','书帖留在案上，尚未转达。日后可从两人的档案重新查看。')]});
 }
 if(phase==='answer')return chronicleEvent({title:'迟来的心意 · 公主的答复',por:k,present:xieCapitalEstate(k)?[]:[k],valid,text:`${kidName(k)}读完亲笔书帖，许久才抬起头。\n他记着相处时她说过的话，也写明愿照顾她的一生。她曾喜欢过他，今日仍可以重新选择。`,choices:[
  {t:(kidAge(k)<15?'她仍愿意，先订婚，满十五岁再成婚':'她仍愿意，成全两人的婚事')+' · 国库−50',cond:()=>valid()&&E().treasury>=50,why:'须双方仍无婚约，且国库足够',f:()=>{
   if(E().treasury<50||!finish())return null;chg({treasury:-50});return kidAge(k)<15?xieBetroth(k,p,'proposal'):xieCelebrate(k,p,'proposal',65);
  }},{t:'她已放下这段心事，婉拒提亲',f:goodbye},defer('让她再想一想','公主把书帖留下慢慢考虑。待她想好了，可从两人的档案听她答复。')]});
 return null;
}
A.xieAfterRefusal=function(){if(!modalOpen)pushEv(xiePathEvent());};
function xieBetroth(k,p,origin){
 const mutual=origin==='proposal',at=S.turn;
 k.betrothal={kind:'xiean',personId:p.id,name:p.name,at,origin,due:k.born+15*12};p.betrothal={kind:'xiean',personId:k.id,name:k.name,at,origin};
 p.xiean.engagement={childId:k.id,at,last:at,origin,affection:mutual?65:18};k.xieAdmiration.outcome='betrothed';
 if(p.xiean.path)p.xiean.path.kind='betrothed';
 const text=mutual?'公主答应谢安的提亲，因尚未满十五岁，先登记婚约。两人仍各居原处，待成年再成婚。':'谢安辞婚未获准，陛下坚持定亲。公主尚未满十五岁，礼部只登记婚约，双方仍各居原处；此时尚非夫妻，分房一年也未开始计时。';
 xieCoupleRecord(p,k,mutual?'两心定约':'奉旨定亲',text,mutual?'既已相知，便认真等她长成，不让婚约催促她的日子。':'帝命已下，我会守约有礼，也不会把尚未长成的她当作妻子相待。',mutual?'婚约定下了，往后的读书与生活，仍要认真过好。':'愿往后能真正认识他；今天定下的是婚约，还不是婚后的生活。');
 const mom=byId(k.mom);if(mom?.alive)story(mom,`【女儿订婚】${kidName(k)}与谢安订婚，待满十五岁后再成婚，尚未出嫁。`);
 return text;
}
function xieCelebrate(k,p,origin,affection){
 const loving=origin==='proposal'||affection>=60,engaged=!!p.xiean.engagement;
 delete k.betrothal;delete p.betrothal;delete p.xiean.engagement;if(p.xiean.path)p.xiean.path.kind='married';
 k.married=true;k.princessMarriage='xiean';k.xieAdmiration.outcome=loving?'mutual':'forced';p.married=true;p.royalSpouseId=k.id;p.spouseName=k.name;
 if(xieCapitalEstate(k))k.estate.route='xiean';
 k.spouse={id:p.id,personId:p.id,scholarId:p.id,name:p.name,sur:p.sur,sex:'m',seed:p.seed,official:p.official,artPortrait:433,born:S.turn-p.age*12,alive:true,background:'京中诗客 · '+(loving?'两心相许':'奉旨尚主'),marriedAt:S.turn,trust:loving?60:38,marriageNature:{temperament:'温厚',hobby:'books',spending:'节俭',space:'需要独处'}};
 p.xiean.marriage={childId:k.id,at:S.turn,last:S.turn,news:0,affection,separateUntil:loving?null:S.turn+12,joinedAt:loving?S.turn:null,origin,startedWithLove:loving};ensureMarriedLife(k);
 const text=(engaged?'公主已满十五岁，双方依婚约举行婚礼。':'公主亲口答应谢安的提亲，两人自愿成婚。')+(loving?'谢安说：“这一回是我走向你。往后的风雨，不必一个人等。”两人已相知相许，婚后共同生活，不设一年分房。':'谢安仍未有相同心意，却愿温柔照应，不让妻子因帝命受委屈。两人从今日起约定先分房一年，慢慢相知。')+'他不纳妾，妻亡也不再娶。';
 xieCoupleRecord(p,k,loving?'两心相许':'践约成婚',text,loving?'曾经的拒绝不必抹去，今天的心动也无需再藏。':'相守始于旨意，待她周全却该出于自己的责任。',loving?'婚礼之前我们已认真相知，如今不必再把彼此隔在门外。':'成为夫妻了，也仍愿等真正的心意生长。');
 const mom=byId(k.mom);if(mom?.alive)story(mom,`【女儿成婚】${kidName(k)}${origin==='proposal'?'接受谢安主动提亲':'与谢安依约'}成婚。${loving?'听闻两人相知相许，她终于放下几分旧日的忧心。':'知道谢安仍守着分寸，她既盼女儿被照应，也忧心真心未至。'}`);
 log(`${kidName(k)}与谢安举行婚礼。`,1);return text;
}
function xieBetrothalTick(p){
 const engagement=p?.xiean.engagement;if(!xieRomanceActive()||!engagement)return;
 const k=royalById(engagement.childId);
 if(!k?.alive||!officialAlive(p)||k.married||k.spouse||p.married||p.spouse||k.betrothal?.personId!==p.id||p.betrothal?.personId!==k.id){
  if(k?.betrothal?.personId===p.id)delete k.betrothal;if(p.betrothal?.personId===k?.id)delete p.betrothal;delete p.xiean.engagement;
  const text=!k?.alive?'公主未及婚期便已离世，这一纸婚约留作旧事。':!officialAlive(p)?'谢安未及婚期便已离世，婚约止于此，往事仍在。':'婚约因双方处境变化而终止，未再举行婚礼。';
  if(officialAlive(p)){scholarRecord(p,'【婚约成旧事】'+text);p.xiean.lifelongSingle=true;}
  if(k?.alive)heartRecord(k,'婚约成旧事',text,'往事值得记住，未来也仍可以重新选择。',-.5);
  if(p.xiean.path){p.xiean.path.kind='free';delete p.xiean.path.pending;}return;
 }
 if(!xiePresent(p)||!xieCanMeetPrincess(k)||k.hp<45||mourningActive())return;
 if(kidAge(k)>=15){xieCelebrate(k,p,engagement.origin,engagement.affection);return;}
 if(S.turn-engagement.last<6||!chance(.3))return;
 engagement.last=S.turn;engagement.affection=clamp(engagement.affection+12);
 const expanded=xieStoryUpdated(),index=expanded?(engagement.news??0):0;
 if(expanded)engagement.news=index+1;
 xieCoupleRecord(p,k,...XIE_BETROTHAL_CHRONICLES[index%XIE_BETROTHAL_CHRONICLES.length]);
}
function xieBridgeReady(p=xieAn()){
 const path=p?.xiean.path;return xiePathAvailable(p)&&!path.pending&&path.stage<2&&S.turn-path.at>=1&&S.turn-(path.lastHelp??-99)>=3;
}
A.xieBridge=function(mode){
 const p=xieAn(),k=xiePathTarget(p),path=p?.xiean.path;if(modalOpen||!['meet','courage','leave'].includes(mode)||!xieBridgeReady(p))return;
 let done=false;const gen=S.gen,valid=()=>!done&&S.gen===gen&&p.xiean.path===path&&xieBridgeReady(p);
 const meeting=mode==='meet',leave=mode==='leave';
 pushEv(chronicleEvent({title:leave?'各有归途':meeting?'为他们留一次相遇':'鼓励她说出心意',por:k,present:xieCapitalEstate(k)?[]:[k],valid,
  text:leave?'公主与谢安都可以不再继续这段旧事。尊重独身的选择后，不再为他们安排婚议。':meeting?'你提议在有亲友同席的诗会上留两席，让公主与谢安有机会谈谈彼此真正关心的事。她可以赴约，也不必把相遇当成一定要成婚的考验。':'你告诉公主，喜欢并不羞耻。她可以拿出自己的文章、见闻与想法，亲自说出心意，也听对方真实的答复。',choices:[
   {t:leave?'让这段婚议就此止步':(meeting?'安排诗会，请两人自行决定是否赴约':'鼓励她以自己的方式表达')+' · 精力−1',cond:()=>valid()&&(leave||E().energy>0),why:'精力不足或处境已变',f:()=>{
    if(!valid()||!leave&&!useE())return null;done=true;path.lastHelp=S.turn;
    if(leave){xiePathClose(p,k,'公主决定不再追问旧日婚事，谢安也郑重表明愿终身独处。双方彼此珍重，没有再为难对方。');return '这条支线以独身作结，谢安往后的诗酒纪事仍会继续。';}
    path.kind='return';path.last=S.turn;path.help=(path.help||0)+1;
    const line=meeting?(xieStoryUpdated()?'经长辈牵线，谢安愿赴一场亲友同席的诗会。请帖送到公主手里，由她自己决定是否赴约。':'经长辈牵线，公主与谢安各自答应一次有亲友同席的诗会。'):'经长辈鼓励，公主亲手写下一页诗笺，谈自己的志趣，也坦陈愿再认识他。谢安认真回信，愿在下次诗会听她说完。';
    xieCoupleRecord(p,k,meeting?'留一席相逢':'亲笔寄心',line,'相见不是许婚，但我愿听她亲口说，而不再只听传闻。','有人支持我走出这一步，我也会保留自己的分寸与选择。');
    path.pending=['meeting','knowing','proposal'][Math.min(2,path.stage)];
    if(xieStoryUpdated()&&!meeting&&path.stage===0)path.meetingSource='courage';
    return line+'可以从档案继续这一次相识，尚未订婚。';
   }},{t:'暂不干预'}]}));
};
const romanceLifeTick=xieLifeTick;
xieLifeTick=function(){
 if(xieRomanceActive()){
  const p=xieAn();
  if(xieUnbound(p)&&!p.xiean.path&&!p.xiean.pursuerId){
   const k=S.children.find(k=>k.alive&&kidAge(k)>=12&&kidAge(k)<=25&&!k.married&&!k.spouse&&!k.betrothal&&k.xieAdmiration?.personId===p.id&&k.xieAdmiration.outcome==='declined'&&p.story?.some(s=>s.t.includes('【辞婚获准】')&&s.t.includes(k.name)));
   if(k){p.xiean.pursuerId=k.id;xiePathStart(k,p);}
  }
  xieBetrothalTick(p);
 }
 romanceLifeTick();if(xieRomanceActive())xiePathTick(xieAn());
};

function xieLateReady(pair=xieCouple()){
 return xieRomanceActive()&&pair&&pair.k.alive&&householdActive(pair.k)&&xiePresent(pair.p)&&!pair.k.away&&!pair.k.templeStay&&pair.k.hp>=45&&!mourningActive()&&pair.m?.affection>=65&&pair.m.loveRemembered!=null&&S.turn-pair.m.at>=12;
}
function xieLateWords({p,k,m}){
 const children=(k.household?.children||[]).filter(c=>c.alive!==false&&c.mother===k.id&&c.father===p.id&&!c.away),n=m.lateNews||0;
 const lively=xieTemperamentGroup(k)==='lively';
 const rows=[
  ['不期而遇的归处',`她问起当年他为何连婚事都不肯考虑。谢安替她拢好被风吹乱的衣袖，笑道：“我原以为，一生有诗酒便够了。你是不期而遇的意外，却成了我往后每一日的盼头。”`, '从前以为自在是无人牵挂，如今有人可想，归途也有了方向。','他记得当初的拒绝，也肯亲口承认如今的爱。'],
  ['满城风月，不及归灯',`诗会尚未散，他已经起身告辞。有人笑他如今有了牵挂，他回家后把这话讲给她听：“从前满城风月，哪里都可停舟。如今知道你在等，便觉得归路总不够短。”`,'佳句可以改日再论，想见她却是此刻的事。','那些人人称道的诗，原来也能落在我这盏寻常的灯下。'],
  lively?['只为卿留',`她笑着挡在书房门前，问今日能否把大诗人借走。谢安搁下笔：“旁人借我的诗名，你不必借。我的工夫，原就愿留给你。”说完便随她去看新开的花。`,'她一来，寻常的一日便多了想记下的事。','他不是被我缠得无奈，是真的愿意陪我。']:['未说出口，也在心上',`她以为他正忙，轻手轻脚要退回去，他却合上书替她留了身边的位置：“不必想好说什么才来。你坐在这里，我便觉得很好。”`,'我所眷恋的，是她在身边，不是她要为我做些什么。','我不必时时体贴周全，原来安静地坐着，也已被喜欢。']
 ];
 if(xieStoryUpdated())rows.push(
  ['饭凉以前','客人已在门外求见，谢安正要起身，她却把菜往他面前推了推：“你答应今天把饭吃热。”他愣了一刻，坐回原处，请门房把会面的时辰往后挪一挪。外头等信，她慢慢给他添了一勺汤。','对外头守约是应当的，对她说过的话也一样。','那日的汤喝到底还是热的，我记得。'],
  ['雨里送卷','她撰的小集要送去誊写，谢安原可吩咐旁人代劳，却带了伞和一个干布包，同她走了一趟。誊书人问序是谁写的，他转向她：“你来答。我只管把这些纸带到，没淋湿一页。”','她的书有人好好读，我撑这一路的伞就值得。','回家的路也在下雨，这回换我替他举一会儿伞。'],
  ['灯留在自己房里','她把原先约好共读的书收了起来，说今日只想清静一会儿。谢安问她要不要留盏灯，便到隔壁去誊他自己的诗。后来她开门说想出去走走，他合卷起身，刚巧也写完了末句。','她有想一个人待着的时辰，我也有可以自己做的事。','今日各自过了半晚，临到出门，又有新话说。'],
  ['旧谱补页','有一册两人早年理过的曲谱，散了一页。谢安把那册谱放了几日，终究还是去问她。她想不起旧谱，试着哼了一段新调。他索性铺纸记下来，落款仍题两人的名字，另标明是今日的新曲。','旧时候的调子能记得当然好。跟她另写一页，也很好。','原以为找不回来了，倒又多得一段可以慢慢唱的。'],
  ['一盏茶的工夫','茶馆老板听说他们从前的婚事，要谢安讲给满堂客人听。他摇摇头，只说两人今日还约了回家试一把新壶。到家后，公主问新壶好不好用。他倒了许久才倒出半盏，两人一起笑起来。','有些日子说给外人，只剩一段传奇。我最喜欢的偏是这半盏茶。','他如今还会挑不中一把壶，也会同我笑半天。']
 );
 if(children.length&&n%2===1){
  const child=children[Math.floor(n/2)%children.length],age=kidAge(child),name=child.name;
  const scene=age<1?`夜里${name}醒来，谢安先起身抱哄，让她再歇一会儿。他低声笑道：“本以为此生只会为一句诗辗转，如今你们一大一小，倒把我的心都占满了。”`:age<6?`${name}攥着他的衣袖不肯松手，他便把诗稿放远，蹲下听孩子讲完。回头见她笑，他也笑：“你来时，我添了一处归途；有了这孩子，归途便有了两声唤我。”`:age<13?`${name}把习作拿来，他先认真夸了用心的一句，再陪着改错。她打趣他偏心，他坦然答：“自然偏心。但宠爱不是哄骗，答应教的字，也要一个一个陪着写好。”`:`${name}说起自己的志趣，谢安听完才开口：“不必活成我的诗，也不必替我们争一份声名。往后走远些，记得家里的灯一直为你留着。”说罢，他与她相视一笑。`;
  return ['诗外的小天地',scene,'诗名给了许多人看，温柔与耐心，却该真真切切给家里的人。','他珍重我，也珍重我们的孩子。许多寻常小事，便是长久的承诺。',child];
 }
 return rows[(children.length?Math.floor(n/2):n)%rows.length];
}
function xieRememberLate(pair,visit=false){
 const {p,k,m}=pair,row=xieLateWords(pair);m.lateNews=(m.lateNews||0)+1;m.affection=clamp(m.affection+4);k.spouse.trust=clamp(k.spouse.trust+3);
 xieCoupleRecord(p,k,row[0],(visit?'两人与你说起近日家常：':'')+row[1],row[2],row[3]);
 if(row[4]){row[4].story ||= [];kstory(row[4],`【家中温情】${row[1]}`);}
 return row[1];
}
A.xieFamilyTalk=function(){
 const pair=xieCouple();if(modalOpen||!xieLateReady(pair)||S.turn-(pair.m.lastTalk??-99)<6)return;
 const {p,k,m}=pair;let done=false;const valid=()=>!done&&xieCouple()?.m===m&&xieLateReady(pair)&&S.turn-(m.lastTalk??-99)>=6;
 pushEv(chronicleEvent({title:'归处有灯 · 谢安与公主',cast:[k,p],present:xieCapitalEstate(k)?[p]:[k,p],valid,text:'两人来问安，提起府里近来的日常，谢安看向妻子时，眼底已有藏不住的笑意。',choices:[
  {t:'听他们说说家常 · 精力−1',cond:()=>valid()&&E().energy>0,why:'精力不足或两人不便相见',f:()=>{if(!valid()||!useE())return null;done=true;m.lastTalk=S.turn;m.last=S.turn;return xieRememberLate(pair,true);}},
  {t:'改日再叙'}]}));
};
function xieRomancePanel(p=xieAn()){
 if(!xieRomanceActive()||!p)return '';
 const path=p.xiean.path,pending=XIE_PHASE_ACTIONS[path?.pending],awaiting=pending&&xiePathAvailable(p),pair=xieCouple();
 const next=path?.pending==='meeting'&&path.meetingSource==='courage'?'读谢安的回笺':pending;
 return (path?.kind==='free'?'<p>此生不婚 · 仍以诗酒会友，独身心意已写入纪事。</p>':'')+
  (xieBridgeReady(p)?'<div class="actions"><button class="btn" onclick="A.xieBridge(\'meet\')">安排相遇机会</button><button class="btn" onclick="A.xieBridge(\'courage\')">鼓励公主表达心意</button><button class="btn" onclick="A.xieBridge(\'leave\')">尊重独身的选择</button></div>':'')+
  (awaiting?`<button class="btn jade" onclick="A.xieAfterRefusal()">${next}</button>`:pending&&xiePathEligible(p)?'<p class="hint">两人现在不便相见，这段心事暂缓，等方便时可继续。</p>':'')+
  (xieLateReady(pair)?`<button class="btn jade" onclick="A.xieFamilyTalk()" ${S.turn-(pair.m.lastTalk??-99)<6?'disabled':''}>听他们说说家常 · 精力−1</button>`:'');
}
const romanceScholarView=viewScholar;
viewScholar=function(){const html=romanceScholarView(),p=scholarById(UI.sel);return p?.storyPerson==='xiean'?html.replace('</header>','</header>'+xieEngagementPanel(p)+xieRomancePanel(p)):html;};
function xieEngagementPanel(p=xieAn()){
 const e=p?.xiean.engagement,k=e&&royalById(e.childId);if(!xieRomanceActive()||!e||!k)return '';
 return detailSection('订婚 · 待成年成婚',`<p>${esc(k.name)}与谢安已有婚约。${kidAge(k)<15?'公主尚未满十五岁，待成年后再举行婚礼。':'公主已满十五岁，待双方都可相见时举行婚礼。'}两人尚非夫妻，不进入婚后家事。</p><p>${e.origin==='proposal'?'两心定约':'奉旨定亲'} · ${e.affection>=60?'已渐相知':'仍在了解彼此'}。${e.origin==='forced'&&e.affection<60?'若成婚时仍未相爱，届时才开始一年分房。':'成婚时已有感情，不设一年分房。'}</p>`);
}
const romanceMarriagePanel=marriagePanel;
marriagePanel=function(k){return xieRomanceActive()&&k.betrothal?.kind==='xiean'?xieEngagementPanel():romanceMarriagePanel(k);};
const romanceMarriageStatus=marriageStatus;
marriageStatus=function(k){return xieRomanceActive()&&k.betrothal?.kind==='xiean'?'已订婚 · 谢安 · 尚未成婚':romanceMarriageStatus(k);};
const romanceKidView=viewKid;
viewKid=function(){const html=romanceKidView(),k=kidById(UI.sel);return xieRomanceActive()&&k?.betrothal?.kind==='xiean'?html.replace('<h2>','<p>已订婚 · 谢安 · 尚未成婚</p><h2>'):html;};
const romanceYouthPanel=youthPanel;
youthPanel=function(k){const html=romanceYouthPanel(k);return html+(xieRomanceActive()&&xiePathTarget()===k?xieRomancePanel():'');};
const romanceHouseholdPanel=householdPanel;
householdPanel=function(k){const html=romanceHouseholdPanel(k);return html+(xieCouple()?.k===k?xieRomancePanel():'');};
