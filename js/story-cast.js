/* Fixed characters from the story-consort dossiers. */
const storyCastActive=()=>journalContentVersion()>=70;
const STORY_CAST={
  qingyi:{sur:'沈',given:'清漪',age:20,trait:'痴情',family:'书香门第',power:25,place:'suzhou',
    epithet:'曾经的京城第一美人',route:'南巡苏州 · 本朝第三年起',rank:1,
    intro:'两小无猜的旧识，幼时议过娃娃亲。沈父在夺嫡时替另一位皇子上奏，削职遣回姑苏。太后以「沈家不宜为后」断了议亲。'},
  luwan:{sur:'陆',given:'绾',age:18,trait:'将门',family:'镇国大将军',power:62,place:'drill',
    epithet:'北境将门',route:'北苑校场',rank:3,
    intro:'陆将军独女，有一位兄长。十岁随父见过战阵，长成后百步穿杨，说不惯宫里的客套话。'},
  ayimu:{sur:'',given:'阿依慕',age:15,trait:'活泼',family:'白泉国王室',power:50,place:'envoy',
    epithet:'白泉国公主',route:'御花园 · 白泉国宫宴',rank:3,
    intro:'白泉国王携女入朝求亲。她随父亲赴宫宴，亲自挑了一支故乡舞曲，袖上系着母亲缝的香囊。她在意互市，也想让远方的母亲能收到亲笔信。'},
  chuwan:{sur:'方',given:'晚',age:15,trait:'沉静',family:'民间寄居',power:8,place:'register',
    epithet:'旧籍里的名字',route:'查阅地方旧籍 · 第一代登基满十二年',rank:1,
    intro:'随照养人姓方，旧籍中还有一个被涂去的名字。'},
  suheng:{sur:'苏',given:'蘅',age:18,trait:'城府',family:'香料商',power:30,place:'suzhou',
    epithet:'姑苏香铺',route:'南巡苏州',rank:2,
    intro:'苏家独女，街坊说她「鼻子比别人灵三倍」。说话轻，手很稳，想用自己的名字接下铺契。'},
  xiaoman:{sur:'岑',given:'小满',age:19,trait:'贪财',family:'市井艺人',power:5,place:'lantern',
    epithet:'灯市戏法',route:'京城灯市 · 正月也可从御花园请她献艺',rank:1,
    intro:'街头卖艺，接活先谈钱，不偷不骗，也不求怜悯。她数得清每场工钱，也记得大杂院里几个孩子缺过冬的炭。'}
};
const WHITE_SPRING_DANCE_ART={src:'./assets/images/story-cast/ayimu-dance.webp',alt:'阿依慕身着绣银白泉舞服，轻踏鼓面，腕上银铃随袖扬起'};
const whiteSpringBanquetActive=()=>journalContentVersion()>=75;
const storyIntroductionsActive=()=>journalContentVersion()>=81;
const COURT_PETITIONS={
 qingyi:{title:'沈清漪 · 姑苏递来的旧信',body:'姑苏送来的抄本夹着一封私信。沈清漪落了自己的款：“父亲当年上过什么折子，您尽可问我。只是那桩婚事如何散的，我也想听您亲口说一句。”她请递书的人把回信带给沈母。',choice:'亲笔回信，准她与母亲商议赴京',line:'从姑苏递上旧信，收到亲笔回书，愿与母亲商议京中掌书的差事。'},
 luwan:{title:'陆绾 · 军驿送来的马簿',body:'北境军驿送来换马簿。陆绾在几匹马的蹄印旁画了圈：“不是马慢，是这段石路伤蹄。我随父亲走过，愿进京把这几处说清。”末页有陆将军验过的押记。',choice:'请陆绾入京，当面听她谈军驿',line:'以亲见的蹄伤佐证驿路失修，应召进京，从军马的事与陛下相识。'},
 chuwan:{title:'方晚 · 请核两页户籍',body:'地方呈上的户籍申诉附着两页抄件。一个署名方晚的姑娘指给书吏看：同一户人的迁出与迁入竟差了一年。她愿到京里作证，只求照养她的人别因此失去住处。',choice:'收下抄件，先安顿证人再核旧籍',line:'亲递两页户籍，在照养人得到安顿后同意继续核查旧粮册。'}
};
function palacePetitionReady(key){
 return !!(storyIntroductionsActive()&&Object.hasOwn(COURT_PETITIONS,key)&&!S.over&&!mourningActive()&&storyCastMeetReady(key)&&!(storyCastRecord(key)?.stage));
}
function palacePetition(key){
 const d=COURT_PETITIONS[key],valid=()=>palacePetitionReady(key);
 return {title:d.title,text:d.body,valid,choices:[{t:d.choice,f:()=>{
  if(!valid())return null;
  const r=storyCastRecord(key)||storyCastCreate(key);r.introduction='petition';
  return storyCastAdvance(r,r.person,d.line);
 }},{t:'把来信留在御书房，改日再读'}]};
}
A.storyPetition=function(key){
 if(!modalOpen&&palacePetitionReady(key))pushEv(palacePetition(key));
};
function monthlyIntroduction(){
 if(!storyIntroductionsActive()||S.over||mourningActive())return null;
 const host=harem().find(c=>familyBirthdayEligible(c)&&c.familyFeastNotice!==S.year);
 if(host){
  host.familyFeastNotice=S.year;
  const feast=banquetKind('family-'+host.id);
  return {title:'娘家请贺生辰 · '+fullName(host),por:host,valid:()=>familyBirthdayEligible(host),text:feast.sponsor.p.name+'递帖，请用家资给'+fullName(host)+'备一桌寿席：“她小时候爱热闹。若陛下许她与亲近的人坐一席，家里人也就欢喜了。”',choices:[
   {t:'准予筹办，看看寿宴席单',f:()=>{UI.banquet={kind:'family-'+host.id,all:true,activity:'toss',seats:[]};UI.view='banquet';setScene('garden');return null;}},
   {t:'寿礼照收，先不设宴'}]};
 }
 if(S.turn-(S.flags.lastCastPetition??0)<6)return null;
 const key=Object.keys(COURT_PETITIONS).find(k=>palacePetitionReady(k)&&!S.flags.castPetitions?.[k]);
 if(!key||!chance(.15))return null;
 (S.flags.castPetitions||={})[key]=true;S.flags.lastCastPetition=S.turn;return palacePetition(key);
}
const storyCastData=key=>Object.hasOwn(STORY_CAST,key)?STORY_CAST[key]:null;
const storyCastRecord=key=>S.flags.storyCast?.gen===S.gen?S.flags.storyCast.people[key]:null;
const storyCastPerson=r=>r?.person||byId(r?.id);
const storyCastReady=key=>key==='qingyi'?S.year>=3:key==='chuwan'?S.gen===1&&S.year>=13:true;
function storyCastName(key,r=storyCastRecord(key)){
  const d=STORY_CAST[key];return key==='chuwan'&&r?.revealed?'楚晚':d.sur+d.given;
}
function storyCastStatus(r){
  const c=storyCastPerson(r);
  if(r?.id)return !c?.alive?'已入宫 · 已故':c.gone?'已入宫 · 已离宫':'已入宫';
  return r?.closed||(r?.office?'掌书女官 · 钟粹宫':r?'已相识':'尚未相遇');
}
function storyCastCreate(key){
  const d=STORY_CAST[key],age=d.age+(key==='chuwan'?S.year-13:key==='qingyi'?S.year-3:0);
  const c=makeGirl({sur:d.sur||'白',given:d.given,age,trait:d.trait,fam:{t:d.family,p:d.power}});
  c.sur=d.sur;c.fixedStory=key;c.known=true;delete c.solitary;
  if(key==='qingyi'){c.looks=98;c.talent=Math.max(68,c.talent);}
  if(key==='luwan')c.hobby='骑射';
  if(key==='suheng')c.scheme=Math.max(75,c.scheme);
  if(S.flags.storyCast?.gen!==S.gen)S.flags.storyCast={gen:S.gen,people:{}};
  const r={person:c,stage:0,due:S.turn,metYear:S.year};
  S.flags.storyCast.people[key]=r;return r;
}
function storyCastRecordLine(c,line,big=false){
  story(c,line);log(fullName(c)+'：'+line,big);return line;
}
function storyCastAdvance(r,c,line,delay=1){
  r.stage++;r.due=S.turn+delay;return storyCastRecordLine(c,line);
}
function storyCastClose(r,c,status,line){
  r.closed=status;delete r.office;return storyCastRecordLine(c,line,true);
}
function storyCastHouse(c){
  const key=c.fixedStory;
  const fixed={
    qingyi:{father:'沈惟恭',office:'削职归里',career:'commoner'},
    luwan:{father:'陆承简',office:'镇国大将军',career:'official',brother:{name:'陆从谦',office:'游击将军',post:'游击将军',career:'official',away:true}},
    suheng:{father:'苏茂实',office:'香铺掌柜',career:'commoner'}
  }[key];
  if(!fixed)return;
  c.house={familyVersion:2,bloc:key==='luwan'?'army':null,relatives:[],natal:{version:1,created:S.turn,motherBorn:S.turn-(c.age+22)*12,births:0},
    father:{name:fixed.father,office:fixed.office,post:fixed.office,career:fixed.career,age:c.age+25,alive:true,away:key==='luwan',story:[]},
    brother:fixed.brother?{...fixed.brother,age:c.age+4,alive:true,story:[]}:null};
}
const storyCastAdmissionAllowed=(c,r)=>!r.id&&!r.closed&&!S.over&&!mourningActive()&&c.age>=15&&E().age>=15;
function storyCastAdmit(c,r,reason){
  if(!storyCastAdmissionAllowed(c,r))return null;
  const d=STORY_CAST[c.fixedStory];
  r.id=c.id;r.admitted=S.turn;delete r.person;delete r.office;
  c.age+=S.year-r.metYear;storyCastHouse(c);
  const limit=RANK_CAP[d.rank];
  addConsort(c,limit&&rankCount(d.rank)>=limit?d.rank-1:d.rank,reason,{major:true});
  if(journalContentVersion()>=98){
    const identity={qingyi:['念旧','读书','诗书'],luwan:['擅骑射','骑射','弓马'],ayimu:['擅舞','侍花','香料'],chuwan:['念旧','读书','诗书'],suheng:['护短','对弈','香料'],xiaoman:['直言','投壶','点心']}[c.fixedStory];
    if(identity){[c.t2,c.hobby,c.like]=identity;if(c.hate===c.like)c.hate='珠翠';}
    if(c.fixedStory==='luwan'&&c.wish==='ride'||c.fixedStory==='chuwan'&&['mother','father'].includes(c.wish)){c.wish='poem';c.wishKnown=false;c.wishDone=false;}
  }
  if(c.fixedStory==='qingyi'&&residenceSlot(c,'钟粹宫','side')){c.palace='钟粹宫';c.residenceRoom='side';}
  c.favor=35;c.aff=45;UI.view='consort';UI.sel=c.id;setScene('harem');
  return storyCastRecordLine(c,'她亲口应允入宫，册为'+cName(c)+'。',true);
}
const storyCastLater={t:'过些日子再谈'};
const storyCastChoice=(t,f,cond)=>({t,f,cond});
function storyCastMeetEvent(key,r,feastTitle='御花园宫宴'){
  const c=r.person,stage=r.stage;
  const advance=(title,line,delay)=>storyCastChoice(title,()=>storyCastAdvance(r,c,line,delay));
  const close=(title,status,line)=>storyCastChoice(title,()=>storyCastClose(r,c,status,line));
  const join=(reason,first)=>storyCastChoice('问她的心意，准她入宫',()=>{
    if(!storyCastAdmissionAllowed(c,r))return null;first?.();return storyCastAdmit(c,r,reason);
  },()=>storyCastAdmissionAllowed(c,r));
  const scene=(title,text,...choices)=>({title,text,por:c,valid:()=>!r.id&&!r.closed&&r.stage===stage,choices:[...choices,storyCastLater]});
  if(key==='qingyi'){
    if(stage===0)return scene('南巡苏州 · 未寄的信','沈清漪主动递帖。昔日的京城第一美人如今穿着半旧青衫，照礼叫你陛下。她拿出当年没寄出的信：“太后说亲事作罢时，您知道么？”',
      advance('坐下来，告诉她当年的实情','在姑苏递上旧信，终于问清当年断亲的事。她仍惦记母亲住在哪里。'),
      advance('先问沈母，许她日后寄信','陛下问了母亲的病，她把旧信交给随侍，等日后再谈。'));
    if(stage===1)return scene(r.introduction==='petition'?'御书房 · 沈家回书':'姑苏 · 随驾回京','她想为病弱的母亲安顿住处，又怕沈家返京被说成翻案。她愿先领掌书差，校完那批旧书，再问自己愿不愿留。',
      storyCastChoice('召她任掌书女官，居钟粹宫偏殿',()=>{r.office=true;return storyCastAdvance(r,c,'以故人之后回京，任掌书女官，居钟粹宫偏殿校书。三个月后再议去留。',3);}),
      close('准沈家返京居住','已相识 · 归京奉母','奉母返京寓居，沈父旧案仍照原案。'),
      close('沈家仍留姑苏','已相识 · 留在姑苏','仍居姑苏奉母，陛下准她继续通信。'));
    const q=empress(),d=ensureDowager();
    return scene('钟粹宫 · 请封答应','三个月的校书差做完，清漪亲手交回钥匙。'+(d?.alive?'太后念及夺嫡旧事，只肯准封答应。':'礼官照例拟封答应。')+
      (q?'皇后当面问她求的是家中安稳，还是愿在宫里长住。':'她请掌事把自己的话呈上。')+'她说母亲已经安顿，今日的答复是为了她自己。',
      join('昔日旧识，掌书差满，自愿卸任入宫',()=>{if(q)story(q,'在钟粹宫询问沈清漪去留，得知她愿卸任受封。');}),
      close('准她卸任归家','已相识 · 卸任归家','卸去掌书差，归家奉母。'));
  }
  if(key==='luwan'){
    if(stage===0)return scene('北苑校场 · 陆绾','北境军马进京试辔。陆绾一眼认出其中一匹旧伤未好：“它不是不肯跑，是踩不实。”陆将军听完，叫马夫请兽医。',
      advance('问她怎么看出马伤','在校场指出军马足伤，陛下愿听她把话说完。'));
    return scene('陆绾 · 听她谈军驿','她谈起十岁在边营见的第一仗，也谈父兄夜里核对伤员名册。“我愿留京。北边真出事了，您得让我先把家书看了。”',
      join(r.introduction==='petition'?'以驿马簿相识，亲口应允入宫':'北苑相识，亲口应允入宫'),close('送她随陆家回边城','已相识 · 回北境','告别京城，仍随陆家回北境。'));
  }
  if(key==='ayimu'&&whiteSpringBanquetActive()){
    const first=stage===0;
    const keep=storyCastChoice(first?'应下国王的婚议，留阿依慕入宫':'准阿依慕留下，遣使向国王报喜',
      ()=>storyCastAdmit(c,r,first?'随父王赴'+feastTitle+'，鼓上献舞惊艳四座，席间亲允婚议':'接风宴后亲自回话，愿留京入宫，与白泉家书往来'),
      ()=>storyCastAdmissionAllowed(c,r));
    const farewell=close('以国宾礼送父女归国','已相识 · 随父王归国',first?
      '随父赴宫宴，在御前献了白泉鼓舞。陛下赐宴答礼，次日随父王启程回乡。':'入宫辞行，领了回赠母亲的织锦，随父王回白泉。');
    if(!first)return scene('白泉公主 · 席后回话','阿依慕跟父王一道来辞行。国王提起席上的婚议，她已想好：“我愿留下。开春商队入关，我想托他们带一封平安信给母亲。”国王听完，向你行了一礼，等候回音。',keep,farewell);
    return {title:feastTitle+' · 白泉公主献舞',por:c,
      portraitArt:WHITE_SPRING_DANCE_ART,
      text:'宫中设宴款待白泉国王。酒过一巡，国王领女儿上前：“小女阿依慕，愿以一支家乡的舞为陛下祝酒。臣也有意将她许与陛下，求两家结亲。”'
        +'\n乐工把三面扁鼓依次放平。阿依慕提起裙角，足尖踏上鼓面，一串轻响从席前传到花下。最后一拍，她忽然收袖，腕上的银铃还在响。一只白蝶停在袖口，她索性等它飞走才行礼。席间静了一瞬，连方才执壶的宫人也跟着喝起彩来。'
        +'\n你问她自己的意思。她望了父亲一眼，用才学的官话答道：“我愿意。若留下，明早可许我托父王给母亲带封信？她还在等我说，京里的鼓跟家里响得一不一样。”',
      valid:()=>!r.id&&!r.closed&&r.stage===0,choices:[keep,farewell,
        advance('请父女在京暂住，稍后再答复',(feastTitle==='御花园宫宴'?'父王在御花园席上':'父王在'+feastTitle+'上')+'求亲，她献过鼓舞，随父暂住馆舍，等候回音。')]};
  }
  if(key==='ayimu'){
    if(stage===0)return scene('四夷馆 · 白泉国接风宴','阿依慕戴着母亲缝的干花香囊献舞。曲将终时，一只蝴蝶落在她肩上。她笑着收住袖口，请通译等舞罢再问边关几时开市。',
      advance('请她留坐，一并听使团来意','接风宴献舞后与陛下叙话，问及边关互市和寄家书的办法。'),
      close('只按来使之礼接待','已相识 · 随使团归国','以使团客礼相见，按原定日程归国。'));
    return scene('白泉国 · 议亲与互市','双方对过互市日期和家书交接办法。阿依慕请通译重念了一遍回信条款，才亲口答应留下。',
      join('白泉使团议定互市和家书往来，公主自愿入宫'),close('留好互市约定，婚事作罢','已相识 · 随使团归国','互市议定，阿依慕随使团归国。'));
  }
  if(key==='chuwan'){
    if(stage===0)return scene('地方旧籍 · 方晚','地方重抄户籍，方晚的迁籍年月对不上。照养人先求一个安全住处。她只记得幼时一扇很高的宫门，旁的得问识字的老人。',
      advance('先保二人平安，待她同意后查档','官府安顿两人住处，方晚愿意查一查旧户籍。'));
    if(stage===1)return scene('旧粮册 · 楚晚','旧籍与照养人笔录印证，她是前朝楚国皇帝之女。粮册记着被父亲挪走的赈粮，兄长争位时也有人枉死。遗臣求她署旧名，她问：“您当年签的是哪一本粮册？”',
      storyCastChoice('依实证核旧案，保护她的住处',()=>{r.revealed=true;c.sur='楚';c.fam.t='前朝遗孤';const d=ensureDowager();if(d?.alive)dowagerRecord(d,'前朝旧案','闻楚氏遗孤旧案，说起当年开国不易，嘱防旧臣借名生事。');return storyCastAdvance(r,c,'确认本姓楚。愿意查清冤案，不愿替遗臣翻案。');}),
      close('封存私身档案，仍由她用方姓度日','已相识 · 方姓安居','旧籍封存，方晚与照养人留在民间。'));
    return scene('楚晚 · 选自己的去处','照养人已有安全住处。她游移了多日，若准她继续写家书，愿入宫住一段日子。日后要署旧姓，也只为自己肯作证的事。',
      join('旧案核实后自择入宫'),close('准她与照养人迁居','已相识 · 迁居民间','与照养人迁居，继续过平民日子。'));
  }
  if(key==='suheng'){
    if(stage===0)return scene('姑苏香铺 · 辨香','行馆收了两包盖同一字号的供香，气味偏不一样。苏蘅请来小铺掌柜和送货人，当面厘清两批货。街坊说她鼻子比别人灵三倍，她只是低头把账页折回去。',
      advance('替小铺核清账，再约她见面','同掌事查清来货来源，替被赖账的小铺说了实话。'));
    return scene('苏蘅 · 铺契与去留','苏蘅将铺契摊在桌上。若她进宫，由老伙计照契经营，分账每季送来一次。把经营的安排说定，她才肯谈去留。',
      join((r.introduction==='banquet'?'宫宴':'姑苏')+'辨香后结识，自定香铺分账，自愿入宫'),close('让她留在姑苏掌柜','已相识 · 留在香铺','收好铺契，仍在姑苏经营苏家香铺。'));
  }
  if(stage===0)return scene('京城灯市 · 岑小满','礼官看中岑小满的戏法，请她和搭档赴宴。她收起刚从空碗下变出来的铜钱：“几时收场？两个人的赏钱都在名册上么？”',
    advance('递演出名帖，约好两个人的工钱','领了宫宴名帖，先讲定自己和搭档的工钱。'));
  if(stage===1)return scene('宫宴散场 · 少了一份赏钱','两人都演完了，管事却把搭档那一份并进岑小满的赏里。她在总管面前重报两个人的名字。',
    storyCastChoice('核对名册，补足两人的工钱 · 国库−4',()=>{if(E().treasury<4)return null;chg({treasury:-4});return storyCastAdvance(r,c,'按名册结清两人工钱。她说打算给大杂院的几个孩子添冬被。');},()=>E().treasury>=4),
    storyCastChoice('另赏她银钱 · 国库−4',()=>{if(r.extra||E().treasury<4)return null;chg({treasury:-4});r.extra=true;return storyCastRecordLine(c,'谢过另赏，仍请宫里核对搭档应领的工钱。');},()=>!r.extra&&E().treasury>=4));
  return scene('岑小满 · 留或走','小满问，大杂院的孩子能不能照旧由熟悉的邻里管饭、她按时送钱。她熟的是守约的人，愿留下也要先把这句话说清。',
    join((r.introduction==='banquet'?'宫宴荐艺相识':'灯市与宫宴反复相见')+'，按约照拂街坊，自愿入宫'),
    close('日后仍请她做宫宴艺人','已相识 · 宫宴艺人','仍按场领酬，在宫宴演戏法，平日回灯市。'),
    close('送她回灯市，自由往来','已相识 · 回到灯市','仍在灯市演戏法，记住了这趟宫宴的几份工钱。'));
}

const STORY_CAST_PLACES={suzhou:'南巡苏州',drill:'北苑校场',envoy:'白泉国宫宴',register:'查阅地方旧籍',lantern:'京城灯市'};
function storyCastMeetReady(key){
  const r=storyCastRecord(key);
  if(key==='ayimu'&&whiteSpringBanquetActive()&&(mourningActive()||E().age<15))return false;
  return storyCastReady(key)&&!r?.closed&&!r?.id&&S.turn>=(r?.due??0)&&
    !(key==='xiaoman'&&r?.stage===1&&!r.performed);
}
A.storyCastVisit=function(key){
  if(!storyCastActive()||!storyCastData(key)||modalOpen||S.over||!storyCastMeetReady(key)||!useE())return;
  const r=storyCastRecord(key)||storyCastCreate(key);
  setScene(r.office?'harem':(key==='luwan'||key==='ayimu'&&whiteSpringBanquetActive())?'garden':'city');
  pushEv(storyCastMeetEvent(key,r));
};
A.storyCastDossier=function(key){
  const r=storyCastData(key)&&storyCastRecord(key),c=storyCastPerson(r);
  if(!storyCastActive()||modalOpen||!c)return;
  if(r.id){A.go('consort',r.id);return;}
  pushEv({title:'档案 · '+fullName(c),por:c,text:STORY_CAST[key].intro+'\n'+c.story.map(e=>e.d+' '+e.t).join('\n'),choices:[{t:'合上档案'}]});
};
function storyCastVisitButton(key){
  const r=storyCastRecord(key),ready=storyCastMeetReady(key)&&E().energy>0&&!S.over;
  if(r?.closed||r?.id)return '';
  if(key==='xiaoman'&&r?.stage===1&&!r.performed&&S.turn>=r.due){
    return `<button class="btn jade" onclick="A.openBanquet()">筹御花园小宴请岑小满献艺</button>`;
  }
  const d=STORY_CAST[key],name=key==='chuwan'&&!r?'地方旧籍':storyCastName(key,r);
  const banquet=key==='ayimu'&&whiteSpringBanquetActive();
  const label=banquet?(r?.stage?'听白泉公主回话':'赴白泉国宫宴') : r?.office?'往钟粹宫见沈清漪':r?.stage?'继续「'+name+'」的故事':'寻访'+name;
  const hint=banquet&&mourningActive()?'服丧期间暂缓设宴':banquet&&E().age<15?'陛下年满十五岁后赴宴':!storyCastReady(key)?d.route:r?.due>S.turn?'再等 '+(r.due-S.turn)+' 个月':'精力−1';
  return `<button class="btn jade" onclick="A.storyCastVisit('${key}')" ${ready?'':'disabled'}>${esc(label)}<small>${esc(hint)}</small></button>`;
}
function storyCastOutPanel(){
  if(!storyCastActive())return '';
  return detailSection('寻访剧情人物',Object.entries(STORY_CAST_PLACES).map(([place,label])=>{
    const keys=Object.keys(STORY_CAST).filter(k=>STORY_CAST[k].place===place);
    const items=keys.map(storyCastVisitButton).join('');
    return items?actionGroup(esc(label),items):'';
  }).join(''));
}
function storyCastGardenButton(){
  if(!storyCastActive())return '';
  return (whiteSpringBanquetActive()?storyCastVisitButton('ayimu'):'')+(S.month===1?storyCastVisitButton('xiaoman'):'');
}
function storyCastCodexCards(){
  if(!storyCastActive())return '';
  return Object.entries(STORY_CAST).map(([key,d])=>{
    const r=storyCastRecord(key),p=storyCastPerson(r)||{...d,fixedStory:key,alive:true};
    const name=key==='chuwan'&&!r?'姓名待考':storyCastName(key,r);
    const tag=storyConsortBadge(key);
    const badge=key==='chuwan'&&!r?.revealed?'<details><summary>查看特殊标签（含身世）</summary>'+tag+'</details>':tag;
    const guide=STORY_CAST_LIVES[key];
    return `<article class="story-consort-card" data-story-consort="${key}"><div class="story-consort-picture">${porImg(p,200)}${storyConsortProgress(storyCastStatus(r))}</div><div class="story-consort-copy"><h3>${esc(name)} · ${esc(d.epithet)}</h3><div aria-label="人物特殊标签">${badge}</div><p>${esc(d.intro)}</p><p>${key==='ayimu'?'宫中':'出巡'} → ${esc(d.route)}</p><p>入宫主线 · ${esc(guide.title)}<br>日常 · ${esc(guide.routine)}<br>特殊事件 · ${esc(guide.secret)} → ${esc(guide.after)}</p>${key==='ayimu'?'<p>新年宫宴、中秋宫宴和皇帝万寿宴都可能有使臣来贺。筹宴时可在外宾席主动请白泉国王携阿依慕赴宴。入宫后，可在御花园小宴请她跳白泉舞。交好的妃嫔学过鼓点，往后同席可点名伴奏。亲生皇嗣带有异域血脉，皇子不可入储，公主成年后可和亲白泉。</p>':''}${COMMONER_STORIES[key]?'<p>街坊口碑 · 持续得宠影响民心，可在人物档案处理「'+esc(COMMONER_STORIES[key].title)+'」。</p>':''}<div class="acts">${r?`<button class="btn" onclick="A.storyCastDossier('${key}')">查看经历</button>`:''}${storyCastVisitButton(key)}${palacePetitionReady(key)?`<button class="btn" onclick="A.storyPetition('${key}')">读${esc(COURT_PETITIONS[key].title)}</button>`:''}</div></div></article>`;
  }).join('');
}

const storyCastOffspring=(c,min=0)=>kidsAlive().filter(k=>k.mom===c.id&&!k.pendingName&&kidAge(k)>=min);
function storyCastBirth(k,c){
  if(!storyCastActive())return;
  if(c.fixedStory==='luwan'){
    k.jiangmenChild=true;k.mar=clamp(k.mar+30);k.hp=clamp(k.hp+20);
    kstory(k,'【将门虎子】出生承陆家骑射禀赋，武艺+30，体魄+20；日后选习武受教时成长翻倍。');
  }else if(c.fixedStory==='ayimu'){
    k.foreignLineage=true;k.mar=clamp(k.mar+20);k.charm=25;
    kstory(k,'【异域血脉】白泉国王室一脉，武艺+20，魅力+25；参与白泉使团事务时可以帮忙。');
  }
}
const storyCastCivicActive=()=>journalContentVersion()>=77;
const whiteSpringChild=k=>!!k?.foreignLineage&&!(k.birthSwap?.confirmed&&k.birthSwap.occurred);
const storyCastHeirBar=k=>storyCastActive()&&(storyCastCivicActive()?whiteSpringChild(k):!!k?.foreignLineage);
function storyCastChildPanel(k){
  if(!storyCastActive())return '';
  const tags=[k.jiangmenChild?'将门虎子':'',whiteSpringChild(k)?'异域血脉 · 出生武艺+20，魅力 '+k.charm+' · '+(k.sex==='m'?'依本朝礼例不可立为太子':k.spouse?.route==='whiteSpring'?'已作为和亲公主远嫁白泉国':k.married?'白泉国王室外孙女':'年满十五岁、未婚未订亲时可议白泉和亲'):'',k.fieldWorry?'担心母妃 · 心情 '+k.mood:''].filter(Boolean);
  return tags.length?detailSection('家世与近况',tags.map(t=>'<p>'+esc(t)+'</p>').join('')+
    (k.fieldWorry?`<button class="btn" onclick="A.storyCastComfort(${k.id})">陪孩子等母妃的消息</button>`:'')):'';
}
A.storyCastComfort=function(id){
  const k=kidById(id);
  if(!storyCastActive()||modalOpen||!k?.alive||!k.fieldWorry||!childInPalace(k)||!useE())return;
  const pronoun=PalaceActions.luwanFrontierChronicles&&k.sex==='f'?'她':'他';
  pushEv({title:'等一封前线家书',por:k,text:k.name+'问，母妃信里画的归期，怎么还没有到。',choices:[
    {t:'陪'+pronoun+'把旧家书再读一遍',f:()=>{delete k.fieldWorry;k.mood=clamp(k.mood+10);kstory(k,'陛下陪自己读前线家书，等母妃平安归来。');log('陪'+k.name+'等陆绾的前线消息。');return pronoun+'把母妃写过的归期重新折好，收进书匣。';}}]});
};
function storyCastFrontier(c){
  const h=houseOf(c);
  if(!officialServing(h?.father)&&!officialServing(h?.brother))return null;
  const w=(S.flags.frontierCampaigns||[]).findLast(x=>x.gen===S.gen&&S.turn-x.turn<=4);
  return w&&w.id!==c.castCampaign?w:null;
}

const LUWAN_FRONTIER_CHAPTERS={departure:'陆绾出征',letter:'前线家书',delay:'军驿失期',return:'北境归来'};
function luwanFrontierNote(p,c,leave,phase,line,source){
  const title=LUWAN_FRONTIER_CHAPTERS[phase];
  princePersonNote(p,'【'+title+'】'+line);
  Object.assign(p.story.at(-1),{thread:`luwan-frontier:${c.id}:${leave.from}`,
    life:{kind:'family',title,gen:S.gen,turn:S.turn,people:[{id:c.id,name:fullName(c)}],source}});
}
function luwanFrontierFriends(c){
  return harem().filter(p=>p!==c&&relGet(c,p)>=30&&socialPair(c,p)&&!friendshipTense(c,p))
    .sort((a,b)=>relGet(c,b)-relGet(c,a)||a.id-b.id).slice(0,3).map(p=>p.id);
}
function luwanFrontierChildVoice(k,phase,local){
  const age=kidAge(k),temper=childDisposition(k);
  if(!local)return {
    departure:'从送来的家信里知道母妃陆绾去了北境。写完平安家书，末尾又添了一句，请她早些报信。',
    letter:'收到辗转送来的前线家书，把母妃陆绾说的归期记在自己房中的历上。',
    delay:'原约的日子已过，仍未接到母妃陆绾的新信。想再托人问问消息，拿起笔却只写得出一句「望平安」。',
    return:'收到母妃陆绾平安回宫的口信，提笔回信道：「下回见面，再亲口讲给我听。」'
  }[phase];
  if(age<3)return {
    departure:'陆绾临行前抱了好一阵子，交给乳母时，小手还攥着她的袖角，松了手便哭。',
    letter:'乳母在床边读起陆绾的来信，小小的孩子听到母妃二字便抬头朝门外望。',
    delay:'陆绾先前说的归期到了，乳母仍没能等到新信。孩子认得门扇响，一响就探头去看。',
    return:'陆绾换下赶路的衣裳来看孩子。孩子先盯住她看，认出来了，便张开胳膊让她抱。'
  }[phase];
  if(age<8)return {
    departure:'送陆绾走到廊口，还不肯把手松开：「您走了，夜里我想您怎么办？」回屋后把脸埋在枕上哭了一会儿。',
    letter:'听完陆绾从军驿捎来的信，在纸上画了三行小马，问能不能每天涂去一匹，等母妃回来。',
    delay:'已经涂完最后一匹小马，陆绾也没捎回新信。夜里听见院门响，披着衣裳就跑出去问：「娘回来了吗？」',
    return:'见陆绾进门，先扑过去抱她，随后扭过脸小声说：「我等了好久。下回再晚，也要托人告诉我。」'
  }[phase];
  if(['审慎','内敛','自矜'].includes(temper))return {
    departure:'替陆绾把归期端端正正抄在历上，人前只道一声保重。等车走远，才向随侍问北边的驿路是否还通。',
    letter:'收到陆绾的第一封信，特意核了一遍封签上的日期，把那句「一切安好」折在最容易翻到的地方。',
    delay:'对着旧信核了两遍归期，仍未等来陆绾的新信。怕把传闻当真，悄悄央人只问最后一站驿卒何时见过她。',
    return:'等旁人说完话，才关起门告诉陆绾：「前几天我总怕敲门的人是来报坏消息的。」说完把旧信一封封还给她看。'
  }[phase];
  return {
    departure:'送陆绾上车时还抢着说「等您回来我再练给您看」。车辙出了宫门，才发现自己一直没舍得往回走。',
    letter:'读到陆绾说马匹和伤员有人照管，立刻回信问她腿脚累不累，也写了句自己今日照常读书练习。',
    delay:'往常最耐不住等，今日却守在收信的廊下。听人说陆绾也许只是被耽搁了，忍不住回一句：「那也该有个准信呀。」',
    return:'见到陆绾就把准备好的一串问题忘了，只拉她坐下歇脚，隔了一会儿才说自己是真的怕过。'
  }[phase];
}
function luwanFrontierKinVoice(p,role,phase){
  if(phase==='delay'&&p.retired)return role==='father'?
    '致仕后许久没再碰军驿的旧簿，这回却翻出来找当年相熟的人，只求打听女儿陆绾最后一次报信是在何处。':
    '退下来后已不管军中差事，这次特意给旧同袍写了一张便笺，问可曾见到妹妹陆绾的回京车队。';
  const lines=role==='father'?{
    departure:'女儿陆绾将往军驿，他托人交一张换马站的清单给她。说尽该交代的公事，最后还是嘱咐一句：「到驿便写信报平安。」',
    letter:'接到女儿陆绾的报安信，看过军马交接的数目，又把落款那句「女儿平安」从头读了一遍。',
    delay:'军报照常有送到，却迟迟没见女儿陆绾的私信。他记下最后一封到驿的日子，只托相熟的人核实她是否已经启程。',
    return:'听说女儿陆绾安全回宫，先回信让她睡足再来交代伤簿，自己到夜里才想起撤下桌边等消息的灯。'
  }:{
    departure:'给妹妹陆绾捎去旧日跑驿站常用的薄护腕。信里还笑她小时候总戴反，最后只写「到了给兄长一句话」。',
    letter:'见妹妹陆绾信上还会拿旧马打趣，终于缓过一口气，回信又问她那副护腕带了没有。',
    delay:'迟迟没等到妹妹陆绾的笔迹，来人一说「大约无妨」，他便请对方讲清最后在哪一站见过她。',
    return:'得知妹妹陆绾已回宫，原本写了满纸埋怨她怎么不捎信，停笔后只留下：「回来就好，哪天得空再说。」'
  };
  return lines[phase];
}
function luwanFrontierFriendVoice(p,phase){
  if(consortHobby(p)==='骑射')return {
    departure:'为陆绾送来亲手理好的旧缰绳。平日两人爱争谁先到场，这回只约她平安回来再比。',
    letter:'听说陆绾到了军驿，第一句便问同行的马是否吃草。问完才承认，更想知道她有没有歇过一夜。',
    delay:'替陆绾留的北苑骑课日子已到了，仍没有回信。独自练过一圈，便把她常用的弓收回原处。',
    return:'见陆绾回来，本想照旧约她比骑射，瞧见她手上的裂口，改口说：「先养几日，我替你把弓擦了。」'
  }[phase];
  if(['持重','沉静','淡泊','城府'].includes(p.trait))return {
    departure:'替陆绾把离宫前托付的几件小事记在纸上。临别没劝她留步，只低声问家书该递到哪里。',
    letter:'得知陆绾报过平安，便把她放心不下的宫中小事一项项写回去，让她在外也有个准话。',
    delay:'听得廊下都在猜陆绾为何误期，只去问哪一天截下最后一封信。回来照旧让那边的宫人给她留灯。',
    return:'等陆绾歇过一晚才去看她，将出门时托付的纸笺原样交还：「都在这里。你先说这一路累不累。」'
  }[phase];
  return {
    departure:'追到廊下把一小包耐放的点心塞给陆绾，说路上别嫌占地方。回去见着空席，这才觉出舍不得。',
    letter:'听说陆绾有了第一封平安信，当晚回话讲的尽是宫中小事，想让她在外也能笑一笑。',
    delay:'园子里那处常与陆绾说话的石凳还空着。去问了两次有无新信，第三次走到门口，又怕添乱折了回来。',
    return:'等陆绾喝过热茶才开口埋怨她让人挂心。话说到一半，自己先红了眼眶，便把剩下的都咽了回去。'
  }[phase];
}
function luwanFrontierReactions(c,leave,phase){
  const children=royalHouseholds().filter(k=>k.mom===c.id&&k.alive&&!k.pendingName&&!k.lost&&!k.removedFromRoyal&&!k.jailed);
  let farewell='';
  for(const k of children){
    const local=childInPalace(k),line=luwanFrontierChildVoice(k,phase,local);
    let mood='';
    if(local&&phase==='departure'){
      k.mood=clamp((k.mood??65)-4);mood=' 心情−4。';
      farewell||=k.name+'也来送行。'+line;
    }
    if(local&&phase==='delay'&&kidAge(k)>=3){
      k.fieldWorry=true;k.mood=clamp((k.mood??65)-10);mood=' 心情−10。';
    }
    if(phase==='return'&&k.fieldWorry){delete k.fieldWorry;k.mood=clamp(k.mood+10);}
    luwanFrontierNote(k,c,leave,phase,line+mood,local?'宫中亲历':k.sex==='f'?'母女家书':'母子家书');
  }
  const house=houseOf(c);
  for(const role of ['father',...brotherRoles(house)]){
    const p=house?.[role];
    if(officialAlive(p))luwanFrontierNote(p,c,leave,phase,luwanFrontierKinVoice(p,role,phase),'陆家往来');
  }
  leave.fieldFriends??=luwanFrontierFriends(c);
  for(const id of leave.fieldFriends){
    const p=byId(id);
    if(inPalace(p))luwanFrontierNote(p,c,leave,phase,luwanFrontierFriendVoice(p,phase),'宫中旧交');
  }
  return farewell;
}

function syncLuwanFrontierMap(){
  // The map frame updates sprites. Older pending actions may also have recorded those draws.
  if(!PalaceActions.luwanFrontierVisuals&&!PalaceActions.replayRollsExhausted)npcSync();
}
function storyCastFrontierReturn(c,early=false){
  const leave=c.homeLeave;
  delete c.homeLeave;
  const text=early?'奉旨提前从北境军驿回宫，军中已另派人接手。':leave.delay?'军驿最后补发了迟到的回信。陆绾归宫，把亲手清过的伤员簿连同家书一并带回来。':'陆绾按期归宫，说军马伤病已核清，随队伤员也有人接手照应。';
  storyCastRecordLine(c,text,true);
  if(PalaceActions.luwanFrontierChronicles)luwanFrontierReactions(c,leave,'return');
  else for(const k of storyCastOffspring(c,5)){if(k.fieldWorry){delete k.fieldWorry;k.mood=clamp(k.mood+10);}kstory(k,'亲眼见到母妃自北境回宫，这才放下心来。');}
  syncLuwanFrontierMap();
  return text;
}
function storyCastFrontierTick(c){
  const leave=c.homeLeave;
  const reactions=PalaceActions.luwanFrontierChronicles;
  if(S.turn===leave.from+1&&(!reactions||!leave.fieldLetter)){
    storyCastRecordLine(c,'北境第一封家书已送到，信里说军马与伤员都按册接手，预计三个月归宫。');
    if(reactions){leave.fieldLetter=true;luwanFrontierReactions(c,leave,'letter');}
    else for(const k of storyCastOffspring(c,5))kstory(k,'读到了母妃从军驿写来的第一封家书，记住她说的归期。');
  }
  if(S.turn===leave.due-1&&leave.delay&&(!reactions||!leave.fieldLate)){
    if(reactions){leave.fieldLate=true;luwanFrontierReactions(c,leave,'delay');}
    else for(const k of storyCastOffspring(c,5).filter(childInPalace)){k.fieldWorry=true;k.mood=clamp((k.mood??65)-10);kstory(k,'已经到了母妃先前说的归期，军驿却没有回信。忍不住问：“娘什么时候回来？” 心情−10。');}
    log('北境家书逾期，陆绾的孩子惦记母妃归期。',1);
  }
  if(S.turn>=leave.due){
    const text=storyCastFrontierReturn(c);
    pushEv({title:'陆绾 · 北境归来',por:c,text,choices:[{t:'听她讲完这趟差事'}]});
  }
}
function storyCastMilitaryEvent(c,w){
  return {title:'陆绾 · 边城来急报',por:c,valid:()=>inPalace(c)&&storyCastFrontier(c)?.id===w.id,
    text:'北境有军报。陆绾读完父兄的家书，请往军驿照管军马与伤员。若战事逼近，她愿护送应撤的伤员。'+(PalaceActions.luwanFrontierChronicles?'她答应托驿卒沿途捎家书。':'她答应叫驿卒每月传家书。'),
    choices:[storyCastChoice('准她随队赴北境，三个月后回宫',()=>{
      if(!homeLeaveEligible(c))return null;
      c.castCampaign=w.id;
      c.homeLeave={from:S.turn,due:S.turn+(w.outcome==='defeat'?4:3),reason:'赴北境军驿',field:true,delay:w.outcome==='defeat'};
      let farewell='';
      if(PalaceActions.luwanFrontierChronicles)farewell=luwanFrontierReactions(c,c.homeLeave,'departure');
      else{
        const same=houseOf(c);
        for(const p of [same.father,same.brother].filter(officialServing))princePersonNote(p,'【陆绾出征】她奉旨来军驿照看军马与伤员，军令仍由守将发出。');
      }
      const rival=harem().find(o=>o.trait==='持重'&&relGet(o,c)<0);
      const pupil=harem().find(o=>o!==c&&o.age<=24&&consortHobby(o)==='骑射');
      if(rival){relAdd(c,rival,-10);story(rival,'说起陆绾赴边地，脱口道「女子就该在宫里」，被陆绾听见。');story(c,'听见'+fullName(rival)+'说女子就该在宫里，对她少了几分好感。');}
      if(pupil){relAdd(pupil,c,20);story(pupil,'偷偷学陆绾骑马、学她说话，熟了成了她的小跟班。');story(c,'离宫前替'+fullName(pupil)+'订了一份骑射功课，叫她莫光学自己的腔调。');}
      syncLuwanFrontierMap();return storyCastRecordLine(c,'奉旨赴北境军驿。保留位分居所，约三个月回宫，期间以家书往来。'+farewell,true);
    },()=>homeLeaveEligible(c)),
    storyCastChoice('请她在京中协助接报调拨',()=>{c.castCampaign=w.id;return storyCastRecordLine(c,'在京核对了军马、伤员与军驿清单，给父兄回信交代各处递送的时日。');}),storyCastLater]};
}

function storyCastPalaceEvent(c){
  const r=storyCastRecord(c.fixedStory);
  if(!r||r.id!==c.id||!inPalace(c)||S.turn<=r.admitted)return null;
  const key=c.fixedStory,step=r.palaceStage||0;
  const advance=(line,months=1)=>{r.palaceStage=step+1;r.palaceDue=S.turn+months;return storyCastRecordLine(c,line,true);};
  const scene=(title,text,...choices)=>({title,por:c,text,valid:()=>inPalace(c)&&(r.palaceStage||0)===step,choices:[...choices,storyCastLater]});
  if(S.turn<(r.palaceDue??0))return null;
  const followup=storyCastFollowupEvent(c,r);if(followup)return followup;
  if(key==='luwan'){
    const w=storyCastFrontier(c);return w?storyCastMilitaryEvent(c,w):null;
  }
  if(key==='ayimu'){
    if(step===0){
      const d=S.flags.dowager,rival=harem().find(o=>o!==c&&TRAITS[o.trait].jealous);
      return scene('阿依慕 · 香囊传言',(rival?fullName(rival)+'听来蝴蝶逐香的消息，私下说她是妖女。':'席外渐有说她会引蝴蝶的议论。')+
        (d?.alive?'太后让人把使团礼单和香囊一同送来。':'礼官送来了使团礼单。')+'阿依慕只说，香囊是母亲亲手缝的。',
        storyCastChoice('照礼单问清来处，为她澄清',()=>{if(rival)story(rival,'因白泉香囊一事被问过话，得知确是公主家人所赠。');if(d?.alive)dowagerRecord(d,'白泉香囊','核过使团礼单，阿依慕的香囊来自生母，宫中不再追查她。');return advance('使团礼单核清，香囊是母亲临行缝的。');}),
        storyCastChoice('请她教好奇的妃嫔制香',()=>{const pupil=harem().find(o=>o!==c&&['侍花','刺绣'].includes(consortHobby(o)));if(pupil){relAdd(c,pupil,12);story(pupil,'同阿依慕学制香，熟了后在宫里领了一处小香铺，替相熟的人合些香囊。');}return advance(pupil?'同'+fullName(pupil)+'开了间小香铺，宫人来问香囊的做法。':'答应教有意来访的宫人做故乡香囊。');}));
    }
    const child=storyCastOffspring(c,7).find(childInPalace);
    if(step===1)return scene('阿依慕 · 家书与互市','母亲的回信随白泉使团送到。后半封写的是边市习俗，一名通译也没读懂。'+(child?child.name+'坐在她身边听着。':'她愿自己先把称谓逐句解释。'),
      storyCastChoice('请她在两边家书里注明称谓',()=>advance('帮通译译清白泉来信，另附一页解释故乡称谓。')),
      ...(child?[storyCastChoice('请她教'+child.name+'白泉话',()=>{child.whiteSpringStudy=true;kstory(child,'随生母阿依慕学白泉话，知道使团如何问候与谈互市。');return advance('教'+child.name+'读懂家信里的白泉语。');})]:[]));
    if(child&&!child.whiteSpringStudy)return scene('阿依慕 · 教孩子白泉话',child.name+'能读一封家书了，问白泉国的外祖母平日如何称呼自己。',
      storyCastChoice('由阿依慕教孩子读家信',()=>{child.whiteSpringStudy=true;kstory(child,'随母学会家书的白泉语，也学了使团礼节。');return advance('给'+child.name+'讲白泉的家书称谓与使团礼节。');}));
    if(child?.whiteSpringStudy&&S.turn>=(r.tradeDue??0))return scene('白泉使者 · 互市议事','使者来核对今年开市时日。礼官请会白泉话的皇嗣旁听，必要时把两边的意思再说清。',
      storyCastChoice('请'+child.name+'协助通译',()=>{const ok=chance(.55+(storyCastHeirBar(child) ? .20 : 0));r.tradeDue=S.turn+12;whiteSpringDeed(c,ok?'market':'review');const line=ok?'译明两国礼单中的日期，互市按时议成。':'译清了条款，两方仍需回去复核。';kstory(child,'协助白泉使团通译。'+line);if(ok)chg({people:3,prestige:2});return storyCastRecordLine(c,line,true);}),
      storyCastChoice('交礼官照常办理',()=>{r.tradeDue=S.turn+12;const ok=chance(.55);whiteSpringDeed(c,ok?'market':'review');if(ok)chg({people:3,prestige:2});return storyCastRecordLine(c,ok?'礼官议定本年互市。':'使团和礼部另约时日复议。');}));
    if(r.butterflies===S.year||season()>1)return null;
    if(c.mood>=70)return scene('御花园 · 蝶落花枝','阿依慕读完白泉家书，在花树下忍不住笑了。一只蝴蝶落在她手边。',
      storyCastChoice('与她并看一会儿花蝶',()=>{r.butterflies=S.year;return storyCastRecordLine(c,'陛下同看过一阵花蝶，还听她讲了母亲信里的近况。')+fx(cchg(c,{aff:10}));}));
    if(c.mood<55)return scene('御花园 · 今日无蝶','她坐在花树下，一封家书还压在膝头。庭中今日没有蝴蝶。',
      storyCastChoice('问她遇到了什么事',()=>{r.butterflies=S.year;return storyCastRecordLine(c,'陛下问她何事难过，陪她说完家信里让她牵挂的事。')+fx(cchg(c,{mood:10,aff:3}));}));
    return null;
  }
  if(key==='chuwan'){
    if(step===0){
      if(journalContentVersion()<115)return scene('楚晚 · 方姓家书','她仍用旧时的称呼写信问照养人是否吃得下饭。'+(empress()?'中宫听说她这几日病了，悄悄送来药，又问旧臣可曾托人来过。':'照养人催她生病就要吃药。'),
        storyCastChoice('安排按旧址送信',()=>{const q=empress();if(q&&q!==c)story(q,'遣人悄悄给楚晚送药，另问她有无收到旧臣捎来的口信。');return advance('仍旧给照养人写方姓名的平安信，第一次在宫中安心睡了一夜。');}));
      const queen=empress(),other=queen&&queen!==c&&inPalace(queen)?queen:null;
      const ill=()=>c.hp<65||c.illnessRecovery?.until>S.turn;
      const sick=!!ill();
      const note=other?(sick?'皇后听说她身体不适，想遣人问候，也惦记着旧臣是否托人来过。':'皇后得知她在写信，想问书信是否顺利送出，以及旧臣可曾托人来过。'):'她把信仔细折好，惦记着旧址的人能否收到。';
      const event=scene('楚晚 · 方姓家书','她仍用旧时的称呼写信问照养人是否吃得下饭。'+note,
        storyCastChoice('安排按旧址送信',()=>{if(other&&inPalace(other)&&empress()===other)story(other,sick?'得知楚晚身体不适，遣人问候，另问她有无收到旧臣捎来的口信。':'遣人问楚晚家书是否顺利送出，另问她有无收到旧臣捎来的口信。');return advance('仍旧给照养人写方姓名的平安信，第一次在宫中安心睡了一夜。');}));
      const valid=event.valid;event.valid=()=>valid()&&(empress()&&empress()!==c&&inPalace(empress())?empress():null)===other&&!!ill()===sick;
      return event;
    }
    if(step===1&&c.rank>=2)return scene('楚晚 · 署旧名作证','有一份旧案需要证词。她终于肯写下楚晚二字，证明照养人当年受了无妄之灾。',
      storyCastChoice('将她的证词交给核案官',()=>advance('晋位后首次署名楚晚，为照养人当年的冤事作证。')));
    const child=storyCastOffspring(c,8).find(k=>!k.chuAncestryTalk);
    if(child&&step>=2){
      const proud=['自矜','好胜'].includes(childDisposition(child));
      return scene('楚晚 · 粮册与外家',proud?child.name+'在书房自称「双皇之后，血统纯正」。楚晚听完，问他可曾读过那本赈粮册。':child.name+'在书房问起外祖家。楚晚想了想，只讲自己记得的两个人。',
        storyCastChoice('听她把旧事讲完',()=>{child.chuAncestryTalk=true;kstory(child,proud?'说自己是双皇之后。母妃拿出旧粮册，叫自己先读百姓名字。':'问起外祖家，听母妃说完了旧宫里她还记得的人。');return storyCastRecordLine(c,'给'+child.name+'说了父兄和旧粮册的事。');}));
    }
    return null;
  }
  if(key==='suheng'){
    if(step===0){
      const victim=harem().find(o=>o!==c&&o.scheme>=55)||harem().find(o=>o!==c);
      if(!victim)return null;
      return scene('苏蘅 · 动过的香炉','苏蘅看出供香管事偏袒熟人，临宴擅自换了香，存心逼'+fullName(victim)+'离席。'+
        '对方果然不适。宫人送来领用簿，当值的人也认出是苏蘅经手。她头一句仍说自己是想讨回欠款。',
        storyCastChoice('先照料对方，再命她赔礼交钥匙',()=>{story(victim,'因宴上换香身体不适，陛下先遣人照料，苏蘅随后来赔礼。');relAdd(c,victim,-15);r.amends=true;return advance('承认故意换香，交回钥匙、补齐账目，也向受影响的妃嫔赔礼。');}),
        storyCastChoice('撤去供香差事，停她经手',()=>{story(victim,'因宴上换香不适，随后听说苏蘅被撤了经手供香的差事。');relAdd(c,victim,-20);return advance('因换香一事被撤去差事，欠款另由宫人核对。');}));
    }
    if(step===1&&!r.amends)return scene('苏蘅 · 补清欠账','她拿着抄过的账回来。过了这些日子，她肯承认自己算的不是一笔工钱，还有一口争不下的气。',
      storyCastChoice('准她赔礼，写清今后的做法',()=>{r.amends=true;return advance('终于认真赔礼，答应往后先拿账说话。',2);}));
    if(S.turn>=(r.scentDue??0))return scene('苏蘅 · 窗边小试','她问陛下今日想闻些什么。宫人说她的香会蛊惑人心；她只说，有些气味一闻就会想起旧事。',
      storyCastChoice('试一味香，听她说旧账的近况',()=>{r.scentDue=S.turn+6;return storyCastRecordLine(c,'得陛下应允后试香，聊完从前的欠账，一室相安。')+fx(cchg(c,{aff:6}),chg({health:2}));}),
      storyCastChoice('今日不试，陪她说说话',()=>{r.scentDue=S.turn+3;return storyCastRecordLine(c,'陛下谢绝试香，两人仍把铺里的话谈完。');}));
  }
  if(key==='xiaoman'&&step<2)return scene('岑小满 · 大杂院来信',step===0?
    '冬前的信来了，邻里已经替孩子们量过被子。小满当初说会照旧送工钱，先问这回能不能按说好的日子办。':
    '邻里回信，孩子们已盖上新被。她数完扔给学徒的铜钱，笑着说可以教陛下戏法的收尾。',
    step===0?storyCastChoice('按期补足过冬钱 · 国库−6',()=>{if(E().treasury<6)return null;chg({treasury:-6});return advance('按约给大杂院送到过冬钱，岑小满写信请邻里代记清账。',2);},()=>E().treasury>=6):
      storyCastChoice('学一回戏法怎么收尾',()=>advance('将铜钱戏法的收尾教给陛下，说说得明白的人才值得再教一手。')),
    ...(step===0?[storyCastChoice('请她再等一月',()=>{r.palaceDue=S.turn+1;return storyCastRecordLine(c,'银钱还没到，她只问哪日能补齐，好给邻里一个准话。');})]:[]));
  return null;
}
A.storyCastPalace=function(id){
  const c=byId(id);
  if(!storyCastActive()||modalOpen||S.over||!c?.fixedStory)return;
  const ev=storyCastPalaceEvent(c);if(ev&&useE())pushEv(ev);
};
const COMMONER_STORIES={
  suheng:{title:'姑苏香市 · 两杆秤',reply:'姑苏香市 · 复秤回帖',rumor:'姑苏铺户听说宫中肯听做香人的话，合计将几家公用的秤砣重新校过。'},
  xiaoman:{title:'京城庙会 · 散场的工钱',reply:'京城庙会 · 幕后的花名账',rumor:'往日在灯市看过小满戏法的街坊听说她在宫中得宠，逢人便提，搭戏台的人也能教宫里看见。'}
};
function commonerFavorTick(c,r){
  if(!storyCastCivicActive()||!COMMONER_STORIES[c.fixedStory])return;
  const p=r.publicFavor||={months:0};
  if(p.checked===S.turn)return;
  p.months=inPalace(c)&&c.favor>=65?(p.checked===S.turn-1?p.months:0)+1:0;
  p.checked=S.turn;
  if(p.months<3||S.turn-(p.last??-Infinity)<6)return;
  p.last=S.turn;const before=E().people;chg({people:1});
  storyCastRecordLine(c,COMMONER_STORIES[c.fixedStory].rumor+(E().people>before?'（民心+1）':'（民心已满）'));
}
function commonerFavorMonth(){
  if(!storyCastCivicActive())return;
  for(const key of Object.keys(COMMONER_STORIES)){
    const r=storyCastRecord(key),c=byId(r?.id);
    if(c&&(inPalace(c)||r.publicFavor?.months))commonerFavorTick(c,r);
  }
}
function commonerFavorEvent(c,r){
  const d=COMMONER_STORIES[c.fixedStory],p=r?.publicFavor;
  if(!storyCastCivicActive()||!d||!p||p.last==null||p.done||!inPalace(c)||S.over)return null;
  const reply=!!p.plan,su=c.fixedStory==='suheng';
  const valid=()=>inPalace(c)&&!S.over&&!p.done&&(reply?p.plan&&S.turn>=p.due:!p.plan&&p.months>=3&&c.favor>=65);
  if(!valid())return null;
  const choose=(title,plan,line,gains,cost=0)=>({t:title,cond:()=>valid()&&E().treasury>=cost,f:()=>{
    if(!valid()||E().treasury<cost)return null;
    if(reply)p.done=true;else{p.plan=plan;p.due=S.turn+2;}
    const effects=chg(gains);return storyCastRecordLine(c,line,true)+fx(effects);
  }});
  if(!reply)return {title:d.title,por:c,valid,text:su?'姑苏香市递来两包都标一两的白芷，一上秤却差了好几钱。苏蘅认得封口，有一包正出自自家铺子。她请你先把苏家的秤也送去校准，让别家愿意跟着办。':'庙会散场，台上的赏钱结了，抬箱和搭棚的人却还在等。岑小满认出领条上的老相识：“街坊知道我在宫里说得上话，才肯把这张纸递来。”',choices:[
    su?choose('拨四万两设公秤，请各家验货','public','市口设了公秤，苏家第一批香料也当众过秤。',{treasury:-4,people:3},4):
      choose('先垫四万两结清帮工钱，留下领条','public','从国库垫付搭棚和抬箱人的工钱，小满拿到逐人签收的领条。',{treasury:-4,people:3},4),
    su?choose('先从苏家铺契试行，交铺户互验','local','苏家先照新秤交货，两位街坊掌柜在单上做了见证。',{people:1}):
      choose('让班主当众核工，按旧契自行补发','local','小满把当日工序与旧契对上，班主认下欠款，约定下场前交回凭据。',{people:1}),storyCastLater]};
  const publicPlan=p.plan==='public';
  const result=su?(publicPlan?'市口的公秤用了两个月，几个小铺送来并排盖印的复秤单。':'苏家和邻铺交回互验的货签，连老主顾也肯在收货时一起看秤。'):
    (publicPlan?'庙会班主还来当初垫付的银钱，散工的手印和领条逐人对得上。':'班主把补发的工钱交清，抬箱人自己带来了写有名字的回执。');
  return {title:d.reply,por:c,valid,text:result,choices:[choose(su?'验过回帖，把秤样留给街坊':'照名册核销，让街坊收好副本','',result,
    !su&&publicPlan?{treasury:4,people:2}:{people:2}),storyCastLater]};
}
A.commonerFavor=function(id){
  const c=byId(id);if(modalOpen||!c)return;
  const ev=commonerFavorEvent(c,storyCastRecord(c.fixedStory));if(ev&&useE())pushEv(ev);
};
function commonerFavorPanel(c,r){
  if(!storyCastCivicActive()||!COMMONER_STORIES[c.fixedStory])return '';
  const p=r?.publicFavor,ev=commonerFavorEvent(c,r);
  const state=p?.done?'街坊的回执已记入纪事。':p?.plan?'已递出批复，约定两个月后收回帖。':'恩宠达到 65，连续三个转月在宫受宠，民心加 1；此后每人每六个月至多一次。';
  return detailSection('街坊口碑','<p>'+state+'</p>'+(ev?`<button class="btn jade" onclick="A.commonerFavor(${c.id})" ${E().energy?'':'disabled'}>${esc(ev.title)}<small>精力−1</small></button>`:''));
}
function storyCastPanel(c){
  if(!storyCastActive()||!c.fixedStory)return '';
  const d=STORY_CAST[c.fixedStory],ev=storyCastPalaceEvent(c);
  const father=c.fixedStory==='chuwan'?'<p class="muted">生父 · 前朝楚国皇帝（已故）</p>':'';
  const guide=storyCastFollowupsActive()?storyCastFollowupGuide(c,storyCastRecord(c.fixedStory)):'';
  return whiteSpringMailPanel(c)+detailSection(esc(d.epithet),'<p>'+esc(d.intro)+'</p>'+father+guide+
    (ev?`<button class="btn jade" onclick="A.storyCastPalace(${c.id})" ${E().energy?'':'disabled'}>${esc(ev.title)}<small>精力−1</small></button>`:''))+storyCastLifePanel(c)+commonerFavorPanel(c,storyCastRecord(c.fixedStory))+(c.fixedStory==='ayimu'?estatePrincesses().filter(k=>k.mom===c.id&&k.household?.whiteSpringVisit).map(whiteSpringFamilyPanel).join(''):'');
}
function storyCastMonthlyEvents(){
  if(!storyCastActive())return [];
  const incoming=monthlyIntroduction(),events=incoming?[incoming]:[];
  for(const c of S.consorts.filter(c=>c.fixedStory&&inPalace(c))){
    const r=storyCastRecord(c.fixedStory);if(!r||r.id!==c.id)continue;
    const civic=commonerFavorEvent(c,r);
    if(civic&&r.publicFavor.notice!==civic.title){r.publicFavor.notice=civic.title;events.push(civic);continue;}
    const ev=storyCastPalaceEvent(c);
    const identity=c.fixedStory==='luwan'&&ev?.title==='陆绾 · 边城来急报'?storyCastFrontier(c)?.id:ev?.title;
    if(ev&&identity!==r.lastProposed){r.lastProposed=identity;events.push(ev);}
  }
  return events;
}
function storyCastPromotionEvent(c,resume){
  if(!storyCastActive()||c?.fixedStory!=='chuwan'||c.rank<1||c.rank>=7)return false;
  const d=ensureDowager(),r=storyCastRecord('chuwan');
  if(!d?.alive||!r||r.promotionCleared)return false;
  pushEv({title:'慈宁宫 · 楚氏旧议',por:dowagerPerson(d),text:'太后得知楚晚拟晋位，问是否有人要借她的旧姓翻案。可先说明卷宗封存与照养人安置，再议册封。',
    choices:[storyCastChoice('说明旧案经办，请仍走册封礼',()=>{r.promotionCleared=true;dowagerRecord(d,'楚晚晋位','听皇帝说明旧案与照养人的安排，准礼官依例议封。');storyCastRecordLine(c,'太后过问旧案，终准按礼再议晋位。');resume();return null;}),{t:'此时先缓一缓'}]});
  return true;
}
function storyCastPalaceRoom(name){
  if(!storyCastActive()||name!=='钟粹宫'||!storyCastRecord('qingyi')?.office)return '';
  return detailSection('掌书女官沈清漪','<p>她正在钟粹宫偏殿校书，差满后会亲口回话。</p>'+storyCastVisitButton('qingyi'));
}

function storyCastBanquetPerformance(){
  if(!storyCastActive())return '';
  const r=storyCastRecord('xiaoman');
  if(!r?.person||r.id||r.stage<1||S.turn<r.due)return '';
  if(r.closed==='已相识 · 宫宴艺人'){
    return storyCastRecordLine(r.person,'与搭档继续受邀在宫宴献艺，依旧照名册各领工钱。');
  }
  if(r.closed||r.stage!==1||r.performed)return '';
  r.performed=S.turn+1;
  return storyCastRecordLine(r.person,'和搭档按名帖登席献艺。散席时，等内务府按名单结清工钱。');
}

const storyCastFollowupsActive=()=>journalContentVersion()>=72;
const STORY_CAST_TAGS={
  qingyi:'京城第一美人 · 姑苏旧识',
  luwan:'北境将门 · 百步穿杨',
  ayimu:'白泉公主 · 蝶落香肩',
  chuwan:'前朝遗孤 · 楚氏旧籍',
  suheng:'姑苏苏氏 · 调香辨账',
  xiaoman:'京城灯市 · 铜钱戏法'
};
const previousStoryCastTags=solitaryTag;
solitaryTag=function(c){
  const key=c?.gouyi?'gouyi':c?.hongjian?'hongjian':storyCastFollowupsActive()&&c?.fixedStory;
  return previousStoryCastTags(c)+(key?storyConsortBadge(key):'');
};

function storyCastFollowupEvent(c,r){
  if(!storyCastFollowupsActive()||S.turn-(r.admitted??S.turn)<2||S.turn<(r.followupDue??0))return null;
  const key=c.fixedStory,chapter=r.followupChapter||0,base=r.palaceStage||0;
  const scene=(title,text,choices,cast=[])=>({title,por:c,cast:[c,...cast],text,
    valid:()=>inPalace(c)&&(r.followupChapter||0)===chapter,
    choices:[...choices,storyCastLater]});
  const result=(text,effects)=>{
    r.followupChapter=chapter+1;r.followupDue=S.turn+1;
    return storyCastRecordLine(c,text,true)+(effects?fx(effects):'');
  };
  const choice=(t,f,cond)=>storyCastChoice(t,f,cond);

  if(key==='qingyi'){
    if(chapter===0)return scene('沈清漪 · 两封家信',
      '沈母寄来信说，姑苏入冬后旧疾又犯，叫女儿别求人。清漪把当年的旧信和新家书并排放好，问陛下还记不记得重逢时答应过什么。',[
        choice('请地方医者照看沈母 · 国库−12，情分+8',()=>{
          if(E().treasury<12)return null;
          const effects=chg({treasury:-12})+'　'+cchg(c,{aff:8,mood:10});
          r.shenCare='医者';setXin(c,'感激','母亲终于有人照看');
          return result('地方医者依旧址探看母亲，诊金由宫中拨付。她另写家信报了平安。',effects);
        },()=>E().treasury>=12),
        choice('陪她写信，向家里问清病况 · 情分+4',()=>{
          r.shenCare='家书';return result('陛下陪她把信写完，让母亲先讲实情。她仍牵挂，却总算有了回信的地址。',cchg(c,{aff:4,mood:3}));
        })]);
    if(chapter===1&&c.aff>=55){
      const q=empress(),publicTalk=c.favor>=60&&q&&q!==c;
      return scene('沈清漪 · 旧信去处',
        (r.shenCare==='医者'?'家书说母亲已得调养。':'家书终于写明母亲的病势。')+
        (publicTalk?'清漪近来得宠，宫人又拿京城第一美人的旧话同皇后比较。':'清漪把旧信拿出来，问值不值得一直收藏。'),[
          ...(publicTalk?[choice('当面和中宫说清沈家的安排 · 威望+2',()=>{
            story(q,'陛下在中宫当面说清沈家家眷的安排。谈过后，她省去了再从宫人口中打听。');
            relAdd(c,q,8);return result('同中宫当面把旧事说清，清漪将信收回妆匣。她和中宫各自在纪事里记下这回对话。',chg({prestige:2})+'　'+cchg(c,{aff:6}));
          })]:[]),
          choice('把旧信交还，听她说今天的话 · 情分+8',()=>result('陛下把旧信交回她手里。她只说眼下想回封什么信，昔日的亲事留在纸上。',cchg(c,{aff:8,mood:6})))],publicTalk?[q]:[]);
    }
  }

  if(key==='luwan'&&chapter<2){
    if(storyCastFrontier(c))return null;
    const child=storyCastOffspring(c,5).find(childInPalace);
    const pupil=harem().find(o=>o!==c&&consortHobby(o)==='骑射'&&relGet(o,c)>=10);
    if(!child&&!pupil)return null;
    if(chapter===0)return scene('陆绾 · 校场教箭',
      child?child.name+'问母妃，能不能学她小时候搭弓。陆绾先让孩子试一张轻弓，再问近来想学些什么。':
        fullName(pupil)+'敢牵马走一圈了，来问陆绾下一回能否同去校场。',[
      ...(child?[choice('让她按教养方向带这堂课',()=>{
        const martial=child.policy==='习武',value=martial?6:3;
        skillGain(child,martial?'mar':'hp',value);
        kstory(child,martial?'跟陆绾习骑射，母妃让自己由轻弓起练。':'随陆绾学牵马、站稳，练过便照常回书房。');
        return result('亲自给'+child.name+'上了一堂骑射课。'+(martial?'练习与习武方向相合。':'按孩子的步调先学牵马。'),(martial?'武艺':'体魄')+'+'+value+'　'+cchg(c,{mood:6}));
      })]:[]),
      ...(pupil?[choice('让她和同好一起练马术 · 关系+8',()=>{relAdd(c,pupil,8);story(pupil,'同陆绾在校场学稳坐、控马，发觉她教学比平日说话耐心。');return result('和'+fullName(pupil)+'照约在校场练马术。','两人关系+8');})]:[])],child?[child]:[pupil]);
    if(chapter===1&&(c.castCampaign||c.aff>=60)){
      const father=houseOf(c)?.father;
      return scene('陆绾 · 军驿移交簿','陆绾把从边营学来的移交法用在宫里，把用过的马料和伤病记在一册。她问要不要把这份写得明白的簿子送回北境。',[
        choice('交给兵部和家中各留一份 · 威望+2',()=>{
          if(officialServing(father))princePersonNote(father,'收到女儿陆绾寄来的军驿移交簿样式，交军中照册核对。');
          return result('把军驿登记的办法抄给兵部，边营接手的人知道先核哪几项。',chg({prestige:2}));
        }),
        choice('先留给校场 · 情分+5',()=>result('将移交簿留在校场，供养马的人按册交接。',cchg(c,{aff:5})))]);
    }
  }

  if(key==='ayimu'&&base>=2){
    if(chapter===0)return scene('阿依慕 · 随使团回乡的信',
      '近两回寄到白泉的家书走了不同驿路，其中一封到晚了。阿依慕请通译列出可以随商队带信的日子，自己在信尾写好回程驿名。',[
        choice('给家书留固定驿期 · 国库−8，情分+7',()=>{
          if(E().treasury<8)return null;r.whiteSpringPost=true;whiteSpringDeed(c,'post');
          return result('白泉使团领到固定驿期的札记。她终于能告诉母亲，几月能等到回信。',chg({treasury:-8})+'　'+cchg(c,{aff:7,mood:10}));
        },()=>E().treasury>=8),
        choice('先让商队捎这一封 · 情分+3',()=>result('请将出关的商队带上书信。她把通译写的驿名又看了一遍。',cchg(c,{aff:3})))]);
    if(chapter===1&&r.whiteSpringPost){
      const child=storyCastOffspring(c,7).find(k=>k.whiteSpringStudy&&childInPalace(k));
      return scene('白泉来使 · 核对开市日','使团送来回信，也请朝廷把两地的开市日写在同一张礼单上。'+(child?child.name+'能读白泉话，已经圈出有歧义的几处。':'阿依慕和通译逐条核过。'),[
        choice('准两边张贴同一份市期 · 民心+3',()=>{
          whiteSpringDeed(c,'calendar');
          if(child){skillGain(child,'lit',3);kstory(child,'凭所学白泉话核对互市日期，才学+3。');}
          return result('两边都领到一份核对过的市期。阿依慕把母亲的回信收进匣里。',chg({people:3})+(child?'　'+child.name+'才学+3':''));
        })],child?[child]:[]);
    }
  }

  if(key==='chuwan'&&base>=2){
    if(chapter===0)return scene('楚晚 · 旧仓赈册',
      '她署旧名作证后，地方又送来一份少了两页的仓账。那两页记着没领到粮的家户。楚晚愿重抄人名，私下问照养人的地址能不能继续封存。',[
        choice('封存私籍，核实名单后补粮 · 国库−18，民心+5',()=>{
          if(E().treasury<18)return null;
          return result('将照养人的住处和可用于赈济的名单分别封存。地方核实名单后补粮，旧案再添一笔实据。',chg({treasury:-18,people:5}));
        },()=>E().treasury>=18),
        choice('核存旧册，经手人另作说明 · 威望+2',()=>result('旧仓册留作证据，当年经手的官员另行说明缺页缘由。',chg({prestige:2})))]);
    if(chapter===1){
      const child=storyCastOffspring(c,8).find(k=>k.chuAncestryTalk&&childInPalace(k));
      if(!child)return null;
      return scene('楚晚 · 让孩子抄一次粮册',child.name+'又问起两边皇家的旧事。楚晚抽出那本赈簿，指着最早没领到粮的一户，请孩子把理由也抄下来。',[
        choice('请孩子写下旧账给人的难处 · 品德+4',()=>{
          skillGain(child,'vir',4);kstory(child,'抄过母妃指出的赈粮户名，写下为什么当初官仓该开。品德+4。');
          return result('听完'+child.name+'如何看那本旧账，她把自己的名字写在注脚。',child.name+'品德+4');
        })],[child]);
    }
  }

  if(key==='suheng'&&r.amends&&base>=1){
    if(chapter===0)return scene('苏蘅 · 宫中供香比价','供香又到了换契的时日。苏蘅带来三家的报价和样品，把苏家铺子的那份也列在内，愿由掌事另作核验。',[
      choice('共同复核，再按实价换契 · 国库+12',()=>{
        r.suhengOpenBid=true;
        return result('账目由掌事与三家供货人当面核清。退回多支的旧款，内库收回十二万两。',chg({treasury:12})+'　'+cchg(c,{aff:4}));
      }),
      choice('她只辨样品，契约另委掌事 · 情分+5',()=>result('她把辨出的差异整理给掌事，留下样品，自己依例回避家铺的契约。',cchg(c,{aff:5})))]);
    if(chapter===1&&r.suhengOpenBid&&c.aff>=55)return scene('苏蘅 · 合香之前先问',
      '新供香送到。苏蘅先让常来陪她说话的几个人各选一件喜欢的，只给愿意试的人备香。她问陛下近来睡得如何。',[
        choice('清香只留在她自己的屋里 · 龙体+2，情分+5',()=>result('两人说好，调养时只试她房里这一回，宫宴仍用各人认可的旧例。',chg({health:2})+'　'+cchg(c,{aff:5})))]);
  }

  if(key==='xiaoman'&&base>=2){
    if(chapter===0)return scene('岑小满 · 旧院账本','大杂院的孩子想跟邻里学手艺。小满拿出上回补冬被的账，另划出几个人原先漏记的工钱，请把这两笔各写一页。',[
      choice('照册结工钱，再帮孩子延请师傅 · 国库−10，民心+3',()=>{
        if(E().treasury<10)return null;r.xiaoApprentices=true;
        return result('照册结清匠人的工钱，孩子们到自己选的师傅那里试学。小满留下一份验过的账。',chg({treasury:-10,people:3})+'　'+cchg(c,{aff:6}));
      },()=>E().treasury>=10),
      choice('请她自行安排，按单核清旧账 · 情分+4',()=>result('她自己向邻里回信，另指定旧账逐人找回，欠谁多少都写清。',cchg(c,{aff:4})))]);
    if(chapter===1&&r.xiaoApprentices&&S.turn-S.lastGardenBanquet<=2)return scene('岑小满 · 散席后学戏',
      '刚散了小宴。小满身边几枚铜钱还是整整齐齐。她说院里的孩子学会了第一手，今日也可以教陛下看穿一手。',[
        choice('请她教当年答应的那一手 · 情分+6',()=>result('她记得上回答应要教的动作，等到没人催着散席才慢慢演一遍。',cchg(c,{aff:6,mood:8})))]);
  }
  return null;
}

function storyCastFollowupGuide(c,r){
  if(!r||r.id!==c.id)return '';
  const chapter=r.followupChapter||0;
  const hint={
    qingyi:chapter===1&&c.aff<55?'清漪要等情分达到 55，才肯再拿出旧信。恩宠达到 60 时，中宫也可能听到议论。':'',
    luwan:chapter===0?'有满五岁、在宫的孩子，或关系达到 10 的骑射同好，可开校场教箭。':'',
    ayimu:chapter===0?'处理香囊传言和白泉家书后，可议两边如何定驿期。':'',
    chuwan:chapter===0?'晋位后完成署旧名作证，可续查旧仓赈册。':'',
    suheng:chapter===0?'赔礼并补清旧账后，可请她参与宫中供香比价。':'',
    xiaoman:chapter===1&&r.xiaoApprentices?'帮院里孩子请过师傅后，御花园小宴结束两个月内可找她学戏法。':''
  }[c.fixedStory];
  return hint?'<p class="hint">'+esc(hint)+'</p>':'';
}
