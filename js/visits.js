/* ============ 出巡 ============ */
// A chance meeting should look like something she would actually be doing.
const GARDEN_HOBBY_SCENES={
  读书:n=>`${n}坐在澄瑞亭里读一卷旧书，读到入神处，连你走近都没察觉。`,
  抚琴:n=>`你远远听见琴声，循声而去，原来是${n}在水榭抚琴。`,
  刺绣:n=>`${n}借着亭中天光描绣样，见你来了，忙把未完的花样掩在袖下。`,
  侍花:n=>`${n}蹲在花圃边，正替一株新移的芍药培土，指尖还沾着泥。`,
  做点心:n=>`${n}提着食盒从园中经过，说是试做了时令点心，正要送去给姐妹们尝。`,
  投壶:n=>`${n}在亭前摆了铜壶，一连投中三支，回头见你，笑着把箭递了过来。`,
  骑射:n=>`${n}在园中空地比划弓步，见你来了，收了架势规规矩矩行礼。`,
  对弈:n=>`${n}独自在石桌上摆一局残棋，一手执黑一手执白，正想得出神。`,
  品茶:n=>`${n}在亭中温杯煮水，见你过来，先分了一盏新茶给你。`
};
function gardenEncounter(c){
  const n=cName(c),own=GARDEN_HOBBY_SCENES[consortHobby(c)];
  const spring=season()===0, garden=spring?'spring-garden':undefined;
  return pick([
    {text:own?.(n),illustration:garden},
    {text:`${n}正在亭中扑蝶，见你来了，红着脸躲到柱子后面。`,illustration:garden},
    {text:`${n}在池边喂鱼，鱼儿聚了一大片。她笑着分了你一把鱼食。`,illustration:spring?'garden-fish':undefined},
    {text:`细雨忽至，你与${n}在回廊下躲雨，说了许多话。`}
  ].filter(scene=>scene.text));
}
function pregnancyGardenEvent(monthly=false){
 if(journalContentVersion()<80||mourningActive()||S.turn-(S.flags.lastPregnancyWalk??-99)<3)return null;
 const ready=c=>inPalace(c)&&c.preg>0&&c.preg<10&&!concealedPregnancy(c)&&c.hp>=40&&
  !(c.delivery&&!c.delivery.settled)&&!(c.illnessRecovery?.until>S.turn);
 const women=harem().filter(ready),friends=[],others=[];
 for(let i=0;i<women.length;i++)for(const b of women.slice(i+1)){
  const a=women[i],feeling=palaceSocialFeeling(a,b);
  if(feeling==='close')friends.push([a,b]);else if(feeling==='neutral')others.push([a,b]);
 }
 if(!friends.length&&!others.length||monthly&&!chance(friends.length ? .32 : .18))return null;
 const close=friends.length>0&&(!others.length||chance(.8)),[a,b]=pick(close?friends:others);
 const scene=[
  ['海棠树下','风把落花吹了满阶。','这边青苔还湿，走廊下吧。','你也慢些，花落了还会再开呀。'],
  ['荷亭听雨','才走到荷亭，一阵疏雨便打响了荷叶。','石凳被雨打湿了，来我这边坐。','你的袖口也湿了，我带了干帕子。'],
  ['桂影扶栏','桂花落了一肩，两人索性停在栏边闻香。','香气太浓，你上回闻久了难受，咱们站在上风处。','那就再站一小会儿。你若腿酸，可别陪我硬撑。'],
  ['隔窗看梅','北风卷过梅梢，两人都在向阳的游廊收了步。','风从那扇窗子钻进来。换我坐外边，你手还冷呢。','挤一挤就好。手炉你也捂一会儿。']
 ][season()];
 const intro=close?`两人原约好一路走到园门，走到半途却谁也没催。${fullName(a)}先开口：“${scene[2]}”${fullName(b)}笑着答：“${scene[3]}”`:
  `${fullName(a)}与${fullName(b)}各自带人散步，在廊下遇着。两人都有了身孕，走得也慢。${fullName(a)}往里挪了一席，${fullName(b)}便留下来，同她说了会儿闲话。`;
 const valid=()=>ready(a)&&ready(b)&&palaceSocialFeeling(a,b)!=='strained'&&S.turn-(S.flags.lastPregnancyWalk??-99)>=3;
 return {title:'孕中同游 · '+scene[0],cast:[a,b],present:[a,b],valid,text:scene[1]+intro,choices:[
  {t:'让她们自在走一会儿',f:()=>finish(false)},{t:'请掌事留一处歇脚的地方',f:()=>finish(true)}]};
 function finish(seat){
  if(!valid())return null;S.flags.lastPregnancyWalk=S.turn;
  const end=seat?'掌事在廊下安了靠背，二人歇够了才慢慢往回走。':'随侍远远跟着，两人自己定了回去的时辰。';
  for(const [c,other,line] of [[a,b,scene[3]],[b,a,scene[2]]]){
   const note=close?`她记住${fullName(other)}那句“${line}”，回宫时心里还暖着。`:
    `她原与${fullName(other)}来往平常，今日并肩坐过一会，下次遇见也有话可说了。`;
   story(c,`【孕中同游·${scene[0]}】有孕时与${fullName(other)}在御花园散步。${note}${end}`);cchg(c,{mood:close?4:2});
  }
  relAdd(a,b,close?3:2);return end;
 }
}
const SPA_COST=60;
A.out=function(kind){ if(!useE())return; const e=E();
  if(['hunt','temple'].includes(kind)&&typeof outerTripLead==='function')outerTripLead(kind);
  if(kind==='garden'){setScene('garden');
    const h=harem();
    const roll=R();
    if(roll>=.75){const walk=pregnancyGardenEvent();if(walk){pushEv(walk);return;}}
    if(familyGardenActive()&&roll<FAMILY_GARDEN_RULES.garden){const together=familyGardenEvent('garden');if(together){pushEv(together);return;}}
    if(roll<.5&&h.length){const c=pick(h);const {text:t,illustration}=gardenEncounter(c);
      story(c,`与陛下在御花园偶遇。${t}`);pushEv({title:'御花园偶遇',illustration,por:c,text:t+fx(cchg(c,{favor:6,aff:6,mood:10})),choices:[{t:'今夜便召她侍寝',cond:()=>E().energy>0&&!c.preg&&(!consortRecoveryActive()||!consortNightReason(c)),why:(consortRecoveryActive()&&consortNightReason(c))||(c.preg?'她有孕在身':'精力不足'),f:()=>{nightWith(c);return null}},{t:'与她作别'}]});}
    else {
      const encounter=roll>=.5&&roll<(journalContentVersion()>=30?.75:.6)?maidEvent('御花园'):null;
      if(encounter){pushEv(encounter);return;}
      const period=season(),illustration=['spring-crabapple-walk','summer-lotus-walk','autumn-osmanthus-walk','winter-plum-walk'][period];
      const s=chg({health:2});pushEv({title:'御花园',illustration,text:`${['春日融融，百花争艳。','荷风送香，蝉鸣阵阵。','丹桂飘香，层林尽染。','红梅映雪，暗香浮动。'][period]}你独自走了一圈，心旷神怡。${fx(s)}`,choices:[{t:'回宫'}]});
    }
  }
  else if(kind==='city'){setScene('city');
    if(!S.flags.marketRescueSeen&&chance(.18)){const rescue=marketRescueEvent();if(rescue){pushEv(rescue);return;}}
    if(!legacyPendingAction()&&chance(.8)){const encounter=incognitoEvent();if(encounter){pushEv(encounter);return;}}
    let ev=pick(['girl','tea','porridge','assassin','girl']);
    if(ev==='girl'&&!newConsortEventAllowed())ev=pick(['tea','porridge']);
    if(ev==='girl'){const g=makeGirl({fam:pick([{t:'寒门',p:5},{t:'书香门第',p:15},{t:'皇商',p:30}]),age:ri(16,19)});
      const t=pick([`街角书肆里，一位姑娘正与掌柜争论一句诗的出处，句句有据，掌柜哑口无言。`,`桥头一个卖花的姑娘不小心把花篮撞翻在你脚边，抬头一笑，你怔了一怔。`,`茶楼上有位姑娘凭栏而立，正在吹一支竹笛，曲调清越。`]);
      pushEv({title:'市井奇缘',por:g,text:`${t}\n随从打听到，她名唤${fullName(g)}，${g.fam.t}出身，年方${g.age}。`,choices:[
        {t:'接她入宫，封为答应（大臣或有非议）',f:()=>{addConsort(g,1,'陛下微服出宫时结识，接入宫中');g.aff=40;g.favor=30;const s=chg({prestige:-2});return `她又惊又喜，跪下谢恩。${fx(s)}`}},
        {t:'赏她些银钱，就此别过',f:()=>'她屈膝道谢，转身没入人群。'}]})}
    else if(ev==='tea'){pushEv({title:'茶馆闻声',text:'你在茶馆里听见几个商贩议论：某地知县强征“修河银”，百姓苦不堪言。',choices:[
      {t:'回宫立即严查',f:()=>{const s=chg({people:6,prestige:2,treasury:40});log('帝微服私访，查办贪墨知县，抄没家产。');return `知县被革职拿问，抄没的赃银充入国库。${fx(s)}`}},{t:'记下，暂不声张',f:()=>'你把这件事记在了心里。'}]})}
    else if(ev==='porridge'){pushEv({title:'城门施粥',text:'城门外聚着不少逃荒的百姓，衣衫褴褛。',choices:[
      {t:'命人设粥棚（国库-30万两）',f:()=>{const s=chg({treasury:-30,people:5});log('帝于城门设粥棚，赈济流民。');return `百姓不知你的身份，只一个劲地道谢。${fx(s)}`}},{t:'默然离开',f:()=>'你转身离去，心里沉甸甸的。'}]})}
    else {const p=.45+e.wu/200;pushEv({title:'遇刺',sfx:'err',text:'巷口忽然窜出一名黑衣人，手持短刃直扑而来！',choices:[{t:'迎战',f:()=>{if(chance(p)){const s=chg({prestige:3});log('帝微服遇刺，亲手擒贼。',1);return `你侧身避过，反手将刺客制住。${fx(s)}`}const s=chg({health:-12});log('帝微服遇刺，负伤回宫。',1);return `你虽击退刺客，左臂却被划了一道口子。${fx(s)}`}}]})}
  }
  else if(kind==='hunt'){setScene('garden');const p=.4+e.wu/180;
    if(chance(p)){const s=chg({prestige:6,health:2});log('帝于南苑围猎，亲射猛虎。',1);pushEv({title:'南苑围猎',text:`你纵马入林，弯弓射中一头吊睛白额虎，将士欢声雷动。${fx(s)}`,choices:[{t:'凯旋'}]})}
    else if(chance(.3)){const s=chg({health:-10});pushEv({title:'南苑围猎',sfx:'err',text:`马匹受惊，你从马背上摔下，扭伤了腰。${fx(s)}`,choices:[{t:'回宫养伤'}]})}
    else{const s=chg({prestige:2});pushEv({title:'南苑围猎',text:`收获平平，猎得几只野兔獐子。${fx(s)}`,choices:[{t:'回宫'}]})}}
  else if(kind==='temple'){setScene('garden');S.flags.bless=S.turn;const s=chg({people:2,health:2,treasury:-20});log('帝往护国寺进香祈福。');
    pushEv({title:'护国寺祈福',sfx:'chime',text:`你在护国寺上香，为国祚、为子嗣祈福。方丈说：“陛下仁心，必有福报。”\n也可在这里安排皇子公主祈福，或妃嫔入寺清修。\n（本月宠幸妃嫔更易得子）${fx(s)}`,choices:[
      {t:'安排皇子公主来祈福',f:()=>{pushNow(templeRosterEvent('kids'));return null;}},
      {t:'安排妃嫔来祈福或清修',f:()=>{pushNow(templeRosterEvent('consorts'));return null;}},{t:'回宫'}]})}
  else if(kind==='spa'){setScene('garden');const s=chg({health:5,treasury:-SPA_COST});log('帝往西山温泉行宫休养。');
    pushEv({title:'温泉行宫',illustration:'xishan-hot-spring',text:`西山温泉氤氲，你静养了几日，精神好了许多。${fx(s)}`,choices:[{t:'回宫'}]})}
};
function maidEncounterReady(){return S.turn-(S.flags.lastMaidEncounter??-Infinity)>=(journalContentVersion()>=30?6:4);}
function maidEvent(where){
  if(!maidEncounterReady())return null;
  const known=maids().filter(m=>!m.near&&!m.preg&&!m.cardWithdrawn&&inPalace(m)&&m.nights>0);
  if(known.length&&chance(.4))return returningMaidEvent(pick(known),where);
  if(!newConsortEventAllowed())return null;
  const g=makeGirl({fam:{t:'宫女',p:3},age:ri(16,19)});
  return {title:'宫女',maidEncounter:true,por:g,text:`${where}的花径上，一个小宫女正低头扫落花，口中轻轻哼着家乡的小调。你问她名字，她慌忙跪下：“奴婢${fullName(g)}。”`,choices:[
    {t:'今夜召她侍寝（精力-1）',cond:()=>E().energy>0&&!mourningNightPause(),why:mourningNightPause()?mourningNightMessage():'精力不足',f:()=>{if(mourningNightPause())return null;g.maid=true;g.near=false;g.palace='尚衣局';g.favor=20;g.aff=25;S.consorts.push(g);deepen(g);story(g,`本是${where}一带当差的宫女，被陛下看中。`);maidNight(g);return null}},
    {t:'收为官女子',f:()=>{addConsort(g,0,'本为宫女，蒙陛下青眼');g.favor=25;g.aff=30;return `${fullName(g)}受宠若惊，磕了好几个头。`}},
    {t:'赏她一支簪子',f:()=>'她捧着簪子，红着脸退下了。'}]};
}

/* ============ 太后与节令 ============ */
// Persist maternal identity, recommendation history and continuous eligibility across saves.
function ensureDowager(){
  const d=S.flags.dowager;if(!d)return null;
  const legacy=S.consorts.filter(c=>c.fam.t==='太后母家');
  d.sur=d.sur||d.name.replace(/太后$/,'')||legacy[0]?.sur||pick(SUR.filter(x=>x!==S.emp.sur));
  d.fam=d.fam||{t:'太后母家',p:72};
  d.clan=d.clan||d.sur+'|'+d.fam.t;
  for(const c of legacy){c.sur=d.sur;c.clan=d.clan;c.fam={...d.fam,p:c.fam.p};}
  if(d.lastOffer===undefined)d.lastOffer=(d.recommended||legacy.length)?S.turn:null;
  if(d.cooldown===undefined)d.cooldown=24;
  delete d.recommended;delete d.candidate;
  for(const c of S.consorts.filter(c=>c.clan===d.clan)){
    if(c.enteredAt===undefined)c.enteredAt=S.turn;
  }
  return d;
}
function dowagerKin(){const d=ensureDowager();return d?S.consorts.filter(c=>c.clan===d.clan&&c.alive&&!c.gone&&!c.maid):[]}
function dowagerFavorite(d=S.flags.dowager){
  if(!d?.alive)return null;
  const eligible=harem().filter(c=>c.rank<8&&c.age>=18);
  const kin=eligible.filter(c=>d.clan&&c.clan===d.clan);
  return (kin.length?kin:eligible.filter(c=>stanceOf(c)==='dowager'||c.virtue>=70))
    .sort((a,b)=>b.virtue-a.virtue||a.id-b.id)[0]||null;
}
function dowagerFavorEvent(){
  const d=ensureDowager(),c=dowagerFavorite(d);if(!c)return null;
  const kin=c.clan===d.clan;
  return {title:'慈宁宫',por:c,present:[c],valid:()=>!!d.alive&&dowagerFavorite(d)===c,
    text:`${d.name}召陛下用膳，席间先提起${cName(c)}。${kin?`“${fullName(c)}是哀家母家的孩子，性子${c.trait}，自有她的好处。皇帝得空也去看看她，别叫她独自冷清。”`:`“${c.virtue>=70?'她处事懂得礼数':'她家与慈宁宫常有往来，哀家也多留意她些'}。皇帝得空，不妨多与她说说话。”`}话里的提携之意，宫人都听得明白。`,choices:[
      {t:'遵太后之意，多去她宫里',f:()=>{story(c,`太后在慈宁宫${kin?'念及母家亲缘，优先提携她':'称许她'}，陛下答应多来相处。`);remember(c,'care','太后在慈宁宫提起我，陛下答应多来相处。');policyNudge('dowager',5);const em=empress();if(em&&em!==c)cchg(em,{mood:-3});return fx(cchg(c,{favor:8,mood:8}),chg({prestige:1}))}},
      {t:'“儿臣心里有数。”',f:()=>{story(c,'太后在慈宁宫提携她，陛下没有作出多来相处的许诺。');policyNudge('dowager',-4);return fx(chg({prestige:1}))}}
    ]};
}
function dowagerTick(){
  for(const c of dowagerKin()){
    if(c.favor<20&&!c.cold){if(c.neglectedSince===undefined)c.neglectedSince=S.turn}
    else delete c.neglectedSince;
  }
}
function dowagerProposal(d){
  if(d.lastOffer!==null&&S.turn-d.lastOffer<d.cooldown)return null;
  const kin=dowagerKin();
  // A pregnancy or a family member in disgrace makes another introduction inappropriate.
  if(kin.some(c=>c.preg||c.cold))return null;
  const eligible=kin.filter(c=>c.age>=17&&S.turn-c.enteredAt>=24);
  const neglected=eligible.find(c=>c.favor<20&&c.neglectedSince!==undefined&&S.turn-c.neglectedSince>=12);
  const childless=eligible.find(c=>c.lastBirth<0&&!S.children.some(k=>k.mom===c.id));
  const sister=neglected||childless;
  if(kin.length&&!sister)return null;
  if(!newConsortEventAllowed())return null;
  const reason=sister?(neglected?'久未承宠，独居宫中':'入宫已有两年，膝下仍无子女'):'';
  const g=makeGirl({sur:d.sur,fam:{...d.fam},age:sister?Math.min(ri(16,19),sister.age-1):ri(16,19)});
  g.clan=d.clan;
  const cousin=g.age>E().age?'表姐':'表妹',adoptive=d.relation?.includes('嫡母');
  const relation=adoptive?'嫡母母家的'+cousin:'母族'+cousin;
  if(!legacyPendingAction()){g.imperialKin={gen:S.gen,relation,via:d.fullName||d.name,blood:!adoptive};g.kinNote=`陛下的${relation}`;}
  const preface=`${d.name}先叫人取来母家的家书，说：“这次想同你说的，是哀家母家晚辈${fullName(g)}。${adoptive?'她是你嫡母娘家的亲眷，按礼是你的'+cousin+'，并非生母那边的血亲':'按母族辈分，她是你的'+cousin}。她长在宫外，尚未见过你，不能只凭一句亲戚就叫她贸然入宫。”\n待你问起，太后才展开画像，细说她年方${g.age}、性子${g.trait}。\n`;
  const text=preface+(sister?`“${fullName(sister)}${reason}，她又是${fullName(sister)}的堂妹。若你愿意见见，也好让她们有个说话的伴儿。”`:
    '“皇帝若愿意，可按宫中的礼数见一见；不愿添人，哀家也不强求。”');
  return {title:'太后荐人',por:g,...(legacyPendingAction()?{}:{cast:[dowagerPerson(d)]}),text,onShow:()=>{d.lastOffer=S.turn;d.cooldown=24},choices:[
    {t:'准她入宫，封为贵人',f:()=>{
      if(S.consorts.some(c=>c.id===g.id))return '她已经入宫了。';
      if(sister){g.kin={[sister.id]:'堂姐'};g.kinRival={};sister.kin=sister.kin||{};sister.kin[g.id]='堂妹';g.kinNote=(legacyPendingAction()?'':g.kinNote+'；')+`${fullName(sister)}的堂妹`;}
      addConsort(g,3,legacyPendingAction()?'由太后举荐入宫':`由太后举荐入宫，先说明是陛下的${relation}，再依礼相见`);
      remember(g,'family',sister?`太后因${fullName(sister)}${reason}，举荐我入宫与堂姐相伴。`:'太后举荐我入宫，陛下准许，封为贵人。');
      if(sister){story(sister,`太后因她${reason}，举荐堂妹${fullName(g)}入宫相伴。`);remember(sister,'family',`陛下准许太后举荐的堂妹${fullName(g)}入宫，与我作伴。`);}
      if(journalContentVersion()>=169)d.kinRefusals=0;
      return '太后点头，嘱咐她入宫后恪守宫规。'+fx(chg({prestige:1}));}},
    {t:'婉拒，暂不添新人',f:()=>{if(journalContentVersion()>=169){d.kinRefusals=(d.kinRefusals||0)+1;d.cooldown=24+12*d.kinRefusals;}else d.cooldown=12;if(sister)remember(sister,'family','太后想让堂妹入宫陪伴我，陛下暂未答应。');return '太后收起画像：“也罢，此事以后再议。”';}}
  ]};
}
function dowagerEvent(){const d=ensureDowager();if(!d||!d.alive)return null;
  const r=R();
  if(r<.35&&kidsAlive().length<3&&S.turn>=12) return {title:'慈宁宫 · 开枝散叶',por:dowagerPerson(d),text:`${d.name}拉着你的手说：“${kidsAlive().length?'宫中已有孩子，是好事，只是子嗣还少':'皇帝登基已有些时日，膝下却还空着'}。哀家也盼你开枝散叶。${harem().some(c=>c.preg)?'既有人有孕，就好生照料，莫催她们冒险。':'得空多与妃嫔相处，也要顾着她们的身子。'}”`,choices:[{t:'记下母后的嘱咐',f:()=>{log('帝在慈宁宫听太后谈起子嗣与妃嫔调养。');return '你应下常去探望，子嗣仍须看各人的身体与缘分。';}},{t:'子嗣随缘，先顾好身体',f:()=>'太后叹了口气，仍嘱咐太医院细心照料。'}]};
  if(r<.6){const advice=dowagerPartialityEvent(d);if(advice)return advice;}
  if(r<.6){const proposal=dowagerProposal(d);if(proposal)return proposal;}
  if(r<.8){const favor=dowagerFavorEvent();if(favor)return favor;}
  if(S.month===9) return {title:'太后千秋',por:dowagerPerson(d),text:`今日是${d.name}千秋节。`,choices:[
    {t:'大办寿宴（国库-60万两）',f:()=>fx(chg({treasury:-60,prestige:3,people:1}))},{t:'一切从简',f:()=>fx(chg({people:2}))}]};
  return null;
}
function dowagerPartialityEvent(d=ensureDowager()){
  if(!d?.alive)return null;
  const people=harem().filter(c=>c.age>=18).sort((a,b)=>b.favor-a.favor),top=people[0],kin=dowagerFavorite(d);
  if(!top||top.clan===d.clan||top.favor<70||!kin||kin.clan!==d.clan||top.favor-kin.favor<25)return null;
  const disliked=top.virtue<45||(d.dislikes||[]).includes(top.id);
  if(!disliked)return null;
  return {title:'慈宁宫 · 莫独偏一人',por:dowagerPerson(d),present:[],valid:()=>d.alive&&inPalace(top)&&inPalace(kin),
    text:`${d.name}提起${cName(top)}，语气淡了些：“${top.virtue<45?'她处事还欠周全，哀家原就不大放心':'哀家与她素来不投契'}。你近来偏宠她太过，也该少些独往。${cName(kin)}是哀家母家的孩子，皇帝不妨多去看她。”\n这既有劝你不独宠的意思，也藏着母族的私心。`,choices:[
      {t:'听取劝告，留意母家族女',f:()=>{story(kin,`太后劝陛下莫独宠${fullName(top)}，转而提携自己母家的她；陛下应下多留意。`);return fx(cchg(kin,{favor:3}),chg({prestige:1}));}},
      {t:'朕会兼顾，不以母族分亲疏',f:()=>{log('帝听取太后独宠之谏，未允因母族亲缘另分恩宠。');return '太后听过，没有再催。你没有因此责罚任何人。';}}
    ]};
}
function festival(){const m=S.month,h=harem();if(!h.length)return null;
  const top=h.slice().sort((a,b)=>b.favor-a.favor).slice(0,3);
  const pickOne=(name,desc,act)=>({title:name,text:desc,choices:[...top.map(c=>({t:`携${cName(c)}同往`,f:()=>{story(c,act);harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous)o.mood=clamp(o.mood-4)});return fx(cchg(c,{aff:10,favor:6,mood:12}))}})),{t:'独自一人',f:()=>pz('你独自站了很久。','你独自站了很久。灯火是别人的热闹，月色倒是谁都有一份。')}]});
  if(m===1) return pickOne('上元灯节',pz('正月十五，宫中张灯结彩，太液池畔挂满了花灯。','正月十五，火树银花合，星桥铁锁开。太液池畔的花灯一路挂到水边，灯影落在冰面上，上下都是人间。'),`上元节陪陛下赏灯，猜中了最难的一道灯谜。`);
  if(m===7) return pickOne('七夕',pz('七月初七，鹊桥相会。宫中女子都在穿针乞巧。','七月初七，天上一年一会。宫中女子对月穿针，乞的是巧，心里求的多半是别的。\n银汉迢迢，隔着的何止牛郎织女。'),'七夕之夜陪陛下看星，许了一个不肯说出口的愿。');
  if(m===8&&envoyFeastsActive())return midAutumnCourtEvent();
  if(m===8) return {title:'中秋家宴',text:pz('八月十五，月圆人团圆。','八月十五，月到中天。宫里人的家都在千里之外，同一轮月亮，各宫看出各样的心事。'),choices:[{t:'设中秋家宴，六宫同乐（国库-30万两）',f:()=>{h.forEach(c=>c.mood=clamp(c.mood+6));kidsAlive().forEach(k=>k.love=clamp(k.love+5));log('中秋家宴，六宫同乐。');return fx(chg({treasury:-30}))+'\n§后宫心情+6　皇嗣父爱+5'}},{t:'简单赏月',f:()=>pz('你独自登上角楼赏月。','你独自登上角楼。高处不胜寒，这句词到今夜才算读懂。')}]};
  return null;
}

A.greet=function(){if(!S.flags.dowager?.alive){A.go('place','cn');return;}if(!useE())return;const ev=dowagerEvent();
  pushEv(ev||{title:'请安',por:dowagerPerson(S.flags.dowager),text:`${S.flags.dowager.name}${pick(['拉着你的手问长问短，叮嘱你夜里早些歇息。','说起你小时候爬树摔破了膝盖，笑出了眼泪。','让你尝了尝她亲手做的素点心。'])}${fx(chg({prestige:1,health:1}))}`,choices:[ok1]});
  if(journalContentVersion()>=122)offerCiningChildVisit();
};

/* ============ 母亲入宫小住 ============ */
function momVisitState(c){
  if(whiteSpringRoyal(c))return {ready:false,hint:'白泉王室循使团通家书'};
  if(homeMother(c)&&homeMother(c).status!=='well')return {ready:false,hint:'母亲病中调养，不宜远行；可派医赴家或准回家探病'};
  if(!inPalace(c)||c.maid||c.rescue||c.wound==='mom')return {ready:false,hint:c?.rescue?'远方家人需循寻亲线索联系':'眼下不能安排家眷入宫'};
  if(c.visitor){const left=Math.max(0,Math.ceil(c.visitor.until-S.turn)||0);return {ready:false,hint:left?`母亲在宫 · 还住${left}个月`:'母亲在宫 · 本月出宫'};}
  const last=c.lastVisit==null?null:Number(c.lastVisit);
  const wait=Number.isFinite(last)&&last<=S.turn?Math.max(0,24-(S.turn-last)):0;
  if(wait)return {ready:false,hint:`距上次探亲未满两年 · 还需${Math.ceil(wait)}个月`};
  return {ready:E().treasury>=15,hint:E().treasury>=15?'国库-15万两 · 小住两三个月':'国库不足 · 需15万两'};
}
function momVisitButton(c){
  if(whiteSpringRoyal(c))return '';
  const state=momVisitState(c);
  return `<button class="btn" data-onclick="A.momIn(${c.id})" ${state.ready?'':'disabled'}>接母亲入宫<small>${esc(state.hint)}</small></button>`;
}
const momObj=c=>c.visitor?{isMom:true,seed:c.visitor.seed,name:c.visitor.name,alive:true}:null;
function momVisit(c,months){if(whiteSpringRoyal(c))return false;if(homeMother(c)&&homeMother(c).status!=='well')return false;const v=c.visitor;if(v){v.until=Math.max(v.until,S.turn+months);return}
  c.visitor={name:`${c.sur}夫人`,full:`${c.sur}门${pick(SUR.filter(x=>x!==c.sur))}氏`,from:S.turn,until:S.turn+months,seed:(c.seed%999983)*7+13};c.lastVisit=S.turn;
  story(c,`母亲${c.visitor.name}奉旨入宫，在${c.palace}小住${cnNum(months)}个月。`);log(`准${fullName(c)}之母入宫小住。`)}
function visitorTick(c){const v=c.visitor;if(!v)return;if(!inPalace(c)){delete c.visitor;return}
  c.mood=clamp(c.mood+3);
  if(S.turn>=v.until){story(c,`母亲${v.name}出宫回家了，临走前拉着她的手说了很久的话。`);toast(`${cName(c)}的母亲出宫回家了`);delete c.visitor;if(chance(.4))setXin(c,'思念','母亲出宫回家')}}
function visitorEvent(){const vs=alive().filter(c=>c.visitor&&inPalace(c)&&S.turn-(c.visitor.ev===undefined?-9:c.visitor.ev)>=2);if(!vs.length)return null;const c=pick(vs),v=c.visitor,m=momObj(c);v.ev=S.turn;deepen(c);
  if(!c.woundKnown&&chance(.5))return {title:'母女夜话',illustration:'mother-window',por:m,text:`你路过${c.palace}，听见${v.name}在屋里低声叮嘱女儿：“……娘知道你心里苦。可这宫里不比家里，凡事要忍。”\n后来你才知道，${cName(c)}${consortPastText(c).replace(/^。/,'')}`,choices:[
    {t:'进去坐坐',f:()=>{c.woundKnown=true;remember(c,'care','母亲在宫时陛下来坐');story(c,'母亲在宫时，陛下进来坐了坐，第一次听她说起从前的事。');return fx(cchg(c,{aff:8,mood:8}))}},
    {t:'悄悄走开',f:()=>{c.woundKnown=true;return '你没有进去。'}}]};
  return {title:'谢恩',por:m,text:`${v.name}求见陛下，跪下谢恩：“小女自幼${pick(['娇惯','体弱','心思重','性子倔'])}，在宫里承蒙陛下照拂，民妇感激不尽。”`,choices:[
    {t:'赐座，闲话家常',f:()=>{story(c,`母亲${v.name}在宫中时，陛下赐座与她说了许久的话。`);return fx(cchg(c,{aff:6,mood:10}))}},
    {t:'赏她一柄玉如意（国库-5万两）',f:()=>fx(chg({treasury:-5}),cchg(c,{aff:4,mood:6}))},
    {t:'“夫人不必多礼。”',f:()=>fx(cchg(c,{mood:3}))}]}}
function natalVisitorRow(portrait,identity,palace,left,departure,detail=''){
  return `<div class="natal-visitor">${porImg(portrait,44)}<div class="grow">${identity}正在${esc(palace)}小住，${left>0?`还有 ${left} 个月${departure}`:`本月${departure}`}。${detail?`<div class="hint">${detail}</div>`:''}</div></div>`;
}
function motherVisitorRow(c){
  const v=c.visitor;if(!v)return '';
  return natalVisitorRow(momObj(c),`母亲 <b>${esc(v.name)}</b>（${esc(v.full)}）`,c.palace,v.until-S.turn,'出宫','母亲在宫的日子，她每月心情都会好一些。');
}
A.momIn=function(id){if(!S||S.over||modalOpen)return;const c=byId(id),state=momVisitState(c);if(!state.ready){toast(state.hint);return}chg({treasury:-15});momVisit(c,ri(2,3));setXin(c,'欢喜','母亲进宫来了');AU.sfx('joy');
  pushEv({title:'母亲入宫',por:momObj(c),text:`${c.visitor.name}进宫来了，要在${c.palace}住上几个月。母女俩一见面就抱头哭了。`+fx(cchg(c,{mood:20,aff:8})),choices:[ok1]});save('auto')};

function returningMaidEvent(g,where){
  return {title:'宫女 · 旧识',maidEncounter:true,por:g,present:[g],valid:()=>inPalace(g)&&g.maid&&!g.near&&!g.preg,
    text:`在${where}，你认出仍在当差的${fullName(g)}。她曾承恩，后来回去做事，仍是初见时那张面孔。她行过礼，等你开口。`,choices:[
      {t:'问问她近来过得如何',f:()=>{story(g,'当差时与陛下重逢，被认出是旧识，听问起近况。');return fx(cchg(g,{aff:4,mood:5}));}},
      {t:'今夜相伴',cond:()=>E().energy>0&&!g.cardWithdrawn,f:()=>{maidNight(g);return null;}},
      {t:'让她安心当差',f:()=>{story(g,'与陛下偶遇，仍依原例当差，未改身份。');return '她行礼退下，仍照常做事。';}}
    ]};
}
