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
    epithet:'白泉国来使',route:'四夷馆接风宴',rank:3,
    intro:'白泉国和亲公主，天真活泼，初来不熟宫规，衣袖常带故乡的淡香。她在意互市，也想让远方的母亲能收到亲笔信。'},
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
  if(c.fixedStory==='qingyi'&&residenceSlot(c,'钟粹宫','side')){c.palace='钟粹宫';c.residenceRoom='side';}
  c.favor=35;c.aff=45;UI.view='consort';UI.sel=c.id;setScene('harem');
  return storyCastRecordLine(c,'她亲口应允入宫，册为'+cName(c)+'。',true);
}
const storyCastLater={t:'过些日子再谈'};
const storyCastChoice=(t,f,cond)=>({t,f,cond});
function storyCastMeetEvent(key,r){
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
    if(stage===1)return scene('姑苏 · 随驾回京','她想为病弱的母亲安顿住处，又怕沈家返京被说成翻案。她愿先领掌书差，校完那批旧书，再问自己愿不愿留。',
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
      join('北苑相识，亲口应允入宫'),close('送她随陆家回边城','已相识 · 回北境','告别京城，仍随陆家回北境。'));
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
      join('姑苏辨香后结识，自定香铺分账，自愿入宫'),close('让她留在姑苏掌柜','已相识 · 留在香铺','收好铺契，仍在姑苏经营苏家香铺。'));
  }
  if(stage===0)return scene('京城灯市 · 岑小满','礼官看中岑小满的戏法，请她和搭档赴宴。她收起刚从空碗下变出来的铜钱：“几时收场？两个人的赏钱都在名册上么？”',
    advance('递演出名帖，约好两个人的工钱','领了宫宴名帖，先讲定自己和搭档的工钱。'));
  if(stage===1)return scene('宫宴散场 · 少了一份赏钱','两人都演完了，管事却把搭档那一份并进岑小满的赏里。她在总管面前重报两个人的名字。',
    storyCastChoice('核对名册，补足两人的工钱 · 国库−4',()=>{if(E().treasury<4)return null;chg({treasury:-4});return storyCastAdvance(r,c,'按名册结清两人工钱。她说打算给大杂院的几个孩子添冬被。');},()=>E().treasury>=4),
    storyCastChoice('另赏她银钱 · 国库−4',()=>{if(r.extra||E().treasury<4)return null;chg({treasury:-4});r.extra=true;return storyCastRecordLine(c,'谢过另赏，仍请宫里核对搭档应领的工钱。');},()=>!r.extra&&E().treasury>=4));
  return scene('岑小满 · 留或走','小满问，大杂院的孩子能不能照旧由熟悉的邻里管饭、她按时送钱。她熟的是守约的人，愿留下也要先把这句话说清。',
    join('灯市与宫宴反复相见，按约照拂街坊，自愿入宫'),
    close('日后仍请她做宫宴艺人','已相识 · 宫宴艺人','仍按场领酬，在宫宴演戏法，平日回灯市。'),
    close('送她回灯市，自由往来','已相识 · 回到灯市','仍在灯市演戏法，记住了这趟宫宴的几份工钱。'));
}

const STORY_CAST_PLACES={suzhou:'南巡苏州',drill:'北苑校场',envoy:'四夷馆接风宴',register:'查阅地方旧籍',lantern:'京城灯市'};
function storyCastMeetReady(key){
  const r=storyCastRecord(key);
  return storyCastReady(key)&&!r?.closed&&!r?.id&&S.turn>=(r?.due??0)&&
    !(key==='xiaoman'&&r?.stage===1&&!r.performed);
}
A.storyCastVisit=function(key){
  if(!storyCastActive()||!storyCastData(key)||modalOpen||S.over||!storyCastMeetReady(key)||!useE())return;
  const r=storyCastRecord(key)||storyCastCreate(key);
  setScene(r.office?'harem':key==='luwan'?'garden':'city');
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
  const label=r?.office?'往钟粹宫见沈清漪':r?.stage?'继续「'+name+'」的故事':'寻访'+name;
  const hint=!storyCastReady(key)?d.route:r?.due>S.turn?'再等 '+(r.due-S.turn)+' 个月':'精力−1';
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
  if(!storyCastActive()||S.month!==1)return '';
  return storyCastVisitButton('xiaoman');
}
function storyCastCodexCards(){
  if(!storyCastActive())return '';
  return Object.entries(STORY_CAST).map(([key,d])=>{
    const r=storyCastRecord(key),p=storyCastPerson(r)||{...d,fixedStory:key,alive:true};
    const name=key==='chuwan'&&!r?'姓名待考':storyCastName(key,r);
    return `<article class="story-consort-card" data-story-consort="${key}"><div class="story-consort-picture">${porImg(p,200)}<span class="tag y">${esc(storyCastStatus(r))}</span></div><div class="story-consort-copy"><h3>${esc(name)} · ${esc(d.epithet)}</h3><p>${esc(d.intro)}</p><p>出巡 → ${esc(d.route)}</p><div class="acts">${r?`<button class="btn" onclick="A.storyCastDossier('${key}')">查看经历</button>`:''}${storyCastVisitButton(key)}</div></div></article>`;
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
const storyCastHeirBar=k=>storyCastActive()&&!!k?.foreignLineage;
function storyCastChildPanel(k){
  if(!storyCastActive())return '';
  const tags=[k.jiangmenChild?'将门虎子':'',k.foreignLineage?'异域血脉 · 魅力 '+k.charm+' · 依礼例不可入主东宫':'',k.fieldWorry?'担心母妃 · 心情 '+k.mood:''].filter(Boolean);
  return tags.length?detailSection('家世与近况',tags.map(t=>'<p>'+esc(t)+'</p>').join('')+
    (k.fieldWorry?`<button class="btn" onclick="A.storyCastComfort(${k.id})">陪孩子等母妃的消息</button>`:'')):'';
}
A.storyCastComfort=function(id){
  const k=kidById(id);
  if(!storyCastActive()||modalOpen||!k?.alive||!k.fieldWorry||!childInPalace(k)||!useE())return;
  pushEv({title:'等一封前线家书',por:k,text:k.name+'问，母妃信里画的归期，怎么还没有到。',choices:[
    {t:'陪他把旧家书再读一遍',f:()=>{delete k.fieldWorry;k.mood=clamp(k.mood+10);kstory(k,'陛下陪自己读前线家书，等母妃平安归来。');log('陪'+k.name+'等陆绾的前线消息。');return '他把母妃写过的归期重新折好，收进书匣。';}}]});
};
function storyCastFrontier(c){
  const h=houseOf(c);
  if(!officialServing(h?.father)&&!officialServing(h?.brother))return null;
  const w=(S.flags.frontierCampaigns||[]).findLast(x=>x.gen===S.gen&&S.turn-x.turn<=4);
  return w&&w.id!==c.castCampaign?w:null;
}
function storyCastFrontierReturn(c,early=false){
  const leave=c.homeLeave;
  delete c.homeLeave;
  const text=early?'奉旨提前从北境军驿回宫，军中已另派人接手。':leave.delay?'军驿最后补发了迟到的回信。陆绾归宫，把亲手清过的伤员簿连同家书一并带回来。':'陆绾按期归宫，说军马伤病已核清，随队伤员也有人接手照应。';
  storyCastRecordLine(c,text,true);
  for(const k of storyCastOffspring(c,5)){if(k.fieldWorry){delete k.fieldWorry;k.mood=clamp(k.mood+10);}kstory(k,'亲眼见到母妃自北境回宫，这才放下心来。');}
  npcSync();
  return text;
}
function storyCastFrontierTick(c){
  const leave=c.homeLeave;
  if(S.turn===leave.from+1){
    storyCastRecordLine(c,'北境第一封家书已送到，信里说军马与伤员都按册接手，预计三个月归宫。');
    for(const k of storyCastOffspring(c,5))kstory(k,'读到了母妃从军驿写来的第一封家书，记住她说的归期。');
  }
  if(S.turn===leave.due-1&&leave.delay){
    for(const k of storyCastOffspring(c,5).filter(childInPalace)){k.fieldWorry=true;k.mood=clamp((k.mood??65)-10);kstory(k,'已经到了母妃先前说的归期，军驿却没有回信。忍不住问：“娘什么时候回来？” 心情−10。');}
    log('北境家书逾期，陆绾的孩子惦记母妃归期。',1);
  }
  if(S.turn>=leave.due){
    const text=storyCastFrontierReturn(c);
    pushEv({title:'陆绾 · 北境归来',por:c,text,choices:[{t:'听她讲完这趟差事'}]});
  }
}
function storyCastMilitaryEvent(c,w){
  return {title:'陆绾 · 边城来急报',por:c,valid:()=>inPalace(c)&&storyCastFrontier(c)?.id===w.id,
    text:'北境有军报。陆绾读完父兄的家书，请往军驿照管军马与伤员。若战事逼近，她愿护送应撤的伤员。她答应叫驿卒每月传家书。',
    choices:[storyCastChoice('准她随队赴北境，三个月后回宫',()=>{
      if(!homeLeaveEligible(c))return null;
      c.castCampaign=w.id;
      c.homeLeave={from:S.turn,due:S.turn+(w.outcome==='defeat'?4:3),reason:'赴北境军驿',field:true,delay:w.outcome==='defeat'};
      const same=houseOf(c);
      for(const p of [same.father,same.brother].filter(officialServing))princePersonNote(p,'【陆绾出征】她奉旨来军驿照看军马与伤员，军令仍由守将发出。');
      const rival=harem().find(o=>o.trait==='持重'&&relGet(o,c)<0);
      const pupil=harem().find(o=>o!==c&&o.age<=24&&consortHobby(o)==='骑射');
      if(rival){relAdd(c,rival,-10);story(rival,'说起陆绾赴边地，脱口道「女子就该在宫里」，被陆绾听见。');story(c,'听见'+fullName(rival)+'说女子就该在宫里，对她少了几分好感。');}
      if(pupil){relAdd(pupil,c,20);story(pupil,'偷偷学陆绾骑马、学她说话，熟了成了她的小跟班。');story(c,'离宫前替'+fullName(pupil)+'订了一份骑射功课，叫她莫光学自己的腔调。');}
      npcSync();return storyCastRecordLine(c,'奉旨赴北境军驿。保留位分居所，约三个月回宫，期间以家书往来。',true);
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
      storyCastChoice('请'+child.name+'协助通译',()=>{const ok=chance(.55+(child.foreignLineage ? .20 : 0));r.tradeDue=S.turn+12;const line=ok?'译明两国礼单中的日期，互市按时议成。':'译清了条款，两方仍需回去复核。';kstory(child,'协助白泉使团通译。'+line);if(ok)chg({people:3,prestige:2});return storyCastRecordLine(c,line,true);}),
      storyCastChoice('交礼官照常办理',()=>{r.tradeDue=S.turn+12;const ok=chance(.55);if(ok)chg({people:3,prestige:2});return storyCastRecordLine(c,ok?'礼官议定本年互市。':'使团和礼部另约时日复议。');}));
    if(r.butterflies===S.year||season()>1)return null;
    if(c.mood>=70)return scene('御花园 · 蝶落花枝','阿依慕读完白泉家书，在花树下忍不住笑了。一只蝴蝶落在她手边。',
      storyCastChoice('与她并看一会儿花蝶',()=>{r.butterflies=S.year;return storyCastRecordLine(c,'陛下同看过一阵花蝶，还听她讲了母亲信里的近况。')+fx(cchg(c,{aff:10}));}));
    if(c.mood<55)return scene('御花园 · 今日无蝶','她坐在花树下，一封家书还压在膝头。庭中今日没有蝴蝶。',
      storyCastChoice('问她遇到了什么事',()=>{r.butterflies=S.year;return storyCastRecordLine(c,'陛下问她何事难过，陪她说完家信里让她牵挂的事。')+fx(cchg(c,{mood:10,aff:3}));}));
    return null;
  }
  if(key==='chuwan'){
    if(step===0)return scene('楚晚 · 方姓家书','她仍用旧时的称呼写信问照养人是否吃得下饭。'+(empress()?'中宫听说她这几日病了，悄悄送来药，又问旧臣可曾托人来过。':'照养人催她生病就要吃药。'),
      storyCastChoice('安排按旧址送信',()=>{const q=empress();if(q&&q!==c)story(q,'遣人悄悄给楚晚送药，另问她有无收到旧臣捎来的口信。');return advance('仍旧给照养人写方姓名的平安信，第一次在宫中安心睡了一夜。');}));
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
function storyCastPanel(c){
  if(!storyCastActive()||!c.fixedStory)return '';
  const d=STORY_CAST[c.fixedStory],ev=storyCastPalaceEvent(c);
  const father=c.fixedStory==='chuwan'?'<p class="muted">生父 · 前朝楚国皇帝（已故）</p>':'';
  return detailSection(esc(d.epithet),'<p>'+esc(d.intro)+'</p>'+father+
    (ev?`<button class="btn jade" onclick="A.storyCastPalace(${c.id})" ${E().energy?'':'disabled'}>${esc(ev.title)}<small>精力−1</small></button>`:''));
}
function storyCastMonthlyEvents(){
  if(!storyCastActive())return [];
  const events=[];
  for(const c of S.consorts.filter(c=>c.fixedStory&&inPalace(c))){
    const r=storyCastRecord(c.fixedStory);if(!r||r.id!==c.id)continue;
    const ev=storyCastPalaceEvent(c);
    const identity=c.fixedStory==='luwan'?storyCastFrontier(c)?.id:ev?.title;
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
