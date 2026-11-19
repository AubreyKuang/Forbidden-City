// The sealed register belongs to a reign. Public people are linked by id only.
const outerActive=()=>S&&journalContentVersion()>=76&&PalaceActions.outerHouseholds;
const outerFamilyStories=()=>outerActive()&&journalContentVersion()>=83;
const outerHouseholdUpdates=()=>journalContentVersion()>=90&&PalaceActions.outerHouseholdUpdates;
const outerIntegration=()=>outerActive()&&outerHouseholdUpdates();
const outerBook=()=>S.outerRegisters?.find(r=>r.gen===S.gen);
function openOuterBook(){
  S.outerRegisters||=[];
  if(!outerBook())S.outerRegisters.push({gen:S.gen,era:E().era,mothers:[],children:[],notes:[],awards:[]});
  return outerBook();
}
const outerMother=id=>outerBook()?.mothers.find(m=>m.id===id);
const outerChild=id=>outerBook()?.children.find(k=>k.id===id);
const outerStats={lit:'才学',mar:'武艺',vir:'品德',amb:'野心',looks:'容貌',trade:'家业'};
const outerLessons={读书:'lit',习武:'mar',经商:'trade',随其性情:null};
const outerTrades=[
  ['民女','她替渡口的父亲记船钱，退给你两枚多付的铜板。','留住家里的渡船'],
  ['商女','她把南北两路的茶价写在柜门背后，谈起今年迟到的一船春茶。','替母亲撑起茶行'],
  ['歌伎','一曲唱完，她坐到台阶上，一针一线补裂开的琴囊。','攒够钱开间曲社'],
  ['女医','她给船娘换了药，才回来接那碗已经凉了的茶。','让街坊夜里也有地方问诊'],
  ['绣娘','她拆了半幅并蒂莲，说客人许的是给两个女儿各绣一朵。','让徒弟们也能领到工钱'],
  ['寡妇','她独自开了酒铺，用亡夫刻下的旧木升给客人量米。','把铺子和日子都握在自己手里']
];
const outerMemories=['你们儿时在渡头埋过一枚铜钱。她还记得，是你先忍不住挖开来看。','订亲那日两家交换过一双香囊。后来婚约作罢，她拆了绣线，布一直留着。','在藩邸时她总替你留一盏灯。如今她说起那盏灯，你才知道灯油是她自己添的。','登基前你曾在她家躲过一场大雨。她还收着你那天抄错一个字的诗。'];
const outerOldTies=[
  {name:'青梅竹马',token:'两枚渡钱',after:'她把另一枚渡钱缝在钱袋里，笑你还同小时候一样，总要先摸到钱才肯上船。',proof:'两家渡钱原出一串，那年一起等船的人还认得钱上的孔。'},
  {name:'旧日婚约',token:'拆线的香囊',after:'她摊开拆过的香囊：“那年是你家先退帖的。如今我肯见你，这一句旧话也得许我说。”',proof:'退亲的年月仍记在两家礼帖里，香囊的旧针脚同帖上的花样相合。'},
  {name:'藩邸故人',token:'藩邸灯牌',after:'她还记得藩邸熄灯的时辰。如今灯是她自己点的，几点落锁也由她说了算。',proof:'旧邸点灯簿上，两人的名字在同一夜出现过。'},
  {name:'民间旧识',token:'写错字的诗笺',after:'她把那张旧诗拿出来，只用指尖点了点错字。你们隔着茶碗笑了，像当年雨还没停。',proof:'诗笺落款早于登基，那处错字在御前旧稿中也找得到。'}
];
function outerOldTie(m,book=outerBook()){
  if(!outerFamilyStories()||m.source!=='旧识')return null;
  let i=m.oldTie;
  if(i==null){const memory=book?.notes.find(n=>n.mother===m.id&&n.title==='相识');i=outerMemories.findIndex(line=>memory?.line?.includes(line));}
  return outerOldTies[i]||null;
}
function outerKinChoices(place){
  const choices=[],known=new Set((outerBook()?.mothers||[]).map(m=>m.relative));
  for(const host of harem()){
    if(!inPalace(host)||place==='birthday'&&birthMonth(host)!==S.month)continue;
    const houses=[host,...cousinFatherEntries(host).map(e=>e.c)];
    for(const owner of houses)for(const p of owner.house?.relatives||[]){
      if(known.has(p.id)||!p.alive||p.sex!=='f'||p.consortId||p.parentRelativeId||p.motherRelativeId||p.outsideFamilyOrigin||natalAge(p)<18||p.natalPregnancy||p.marriedSisterAffair?.coerced)continue;
      const visiting=p.visit&&S.turn<p.visit.until;
      if(place==='gate'?(!visiting||p.visit.host!==owner.id||S.turn!==p.visit.from&&S.turn!==p.visit.until-1):visiting)continue;
      choices.push({host,owner,p,kin:owner===host?'亲姐妹':'堂姐妹'});
    }
  }
  return choices;
}
function outerNote(m,k,title,choice,line,voice=''){
  const b=outerBook();
  b.notes.push({date:dateStr(),turn:S.turn,title,choice,line,voice,mother:m.id,motherName:m.name,
    child:k?.id??null,childName:k?.alias??'',secrecy:k?Math.ceil(k.secret):null,
    witnesses:k?k.witnesses.filter(w=>w.active).map(w=>w.name):[]});
  return line+(voice?'\n'+voice:'');
}
function outerAward(key){const awards=outerBook().awards;if(!awards.includes(key))awards.push(key);}
function outerSibling(){
  for(const host of harem()){
    const p=host.house?.relatives?.find(p=>p.sex==='f'&&p.alive&&!p.consortId&&!p.parentRelativeId&&!p.motherRelativeId&&natalAge(p)>=18&&!natalInPalace(host,p)&&!p.natalPregnancy&&!p.marriedSisterAffair?.coerced&&!outerBook()?.mothers.some(m=>m.relative===p.id));
    if(p)return {host,p};
  }
}
function outerSister(m){
  return familyHostById(m.owner??m.host)?.house?.relatives?.find(p=>p.id===m.relative);
}
function outerMotherAge(m){
  const sister=PalaceActions.familyAgeLimits&&m.relative!=null&&outerSister(m);
  if(Number.isFinite(sister?.born))return natalAge(sister);
  return Math.max(sister?.age??0,m.age+Math.floor((S.turn-m.created)/12));
}
function outerContactPresent(m){
  if(m.palaceWork)return false;
  if(m.relative==null)return true;
  const host=familyHostById(m.host),p=outerSister(m);
  return !!p&&p.alive&&!p.consortId&&!(outerFamilyStories()?p.visit&&S.turn<p.visit.until:natalInPalace(host,p))&&!p.natalPregnancy&&!p.marriedSisterAffair?.coerced;
}
function outerTripLead(place){
  // Only an excursion that spent energy can leave a lead for this month.
  if(outerActive()&&!S.over&&E().age>=18&&!mourningActive())
    S.flags.outerTrip={turn:S.turn,place};
}
function outerSouthernTour(){
  const trip=S.flags.outerSouthernTour;
  return trip?.gen===S.gen&&S.turn<trip.returns?trip:null;
}
A.outerSouthTour=function(){
  if(!outerIntegration()||S.over||modalOpen||mourningActive()||E().age<18||S.year<3||outerSouthernTour()||!useE())return;
  S.flags.outerSouthernTour={gen:S.gen,departed:S.turn,returns:S.turn+3};
  setScene('city');
  log(`${dateStr()}，帝启程南巡，沿江察访三月。`);
  pushEv({title:'南巡启程',text:'御舟离京，巡察江南水道。接下来三个月，可到渡口访人。',choices:[{t:'登舟，沿江而行'}]});
};
function outerTourAllows(place){
  return !outerIntegration()||(place==='suzhou')===Boolean(outerSouthernTour());
}
const haremStability=()=>E().haremStability??100;
function outerHaremFall(level,m){
  const before=haremStability();
  E().haremStability=clamp(before-({60:4,40:8,20:15}[level]+(m.host?2:0)));
  E().haremDisturbedAt=S.turn;
  return before-E().haremStability;
}
const outerPlaces={city:'城南茶市',hunt:'南苑猎场外',temple:'护国寺山门',suzhou:'苏州渡头',altar:'郊坛归途',home:'城外别院',gate:'宫门外的长亭',natal:'外家的门庭',birthday:'贺寿别院'};
function outerEncounter(place,source,sibling){
  const b=openOuterBook(),trade=pick(outerFamilyStories()&&sibling&&!sibling.p.widow?outerTrades.filter(t=>t[0]!=='寡妇'):outerTrades),sur=sibling?.p.sur||pick(SUR);
  const m={id:S.nid++,gen:S.gen,sur,name:sibling?.p.name||sur+pick(GIRLA)+pick(GIRLB),age:sibling?natalAge(sibling.p):ri(21,34),
    trade:trade[0],wish:trade[2],trait:pick(['温和','倔强','进取']),source,place,aff:source==='旧识'?55:32,trust:source==='旧识'?50:28,
    meetings:1,last:S.turn,seen:S.turn,created:S.turn,seed:ri(1,2e9)};
  if(sibling)Object.assign(m,{host:sibling.host.id,relative:sibling.p.id,aunt:fullName(sibling.host),clan:sibling.host.clan});
  if(outerFamilyStories()&&sibling){
    m.owner=sibling.owner.id;m.kin=sibling.kin;m.marital=sibling.p.widow?'守寡自立':sibling.p.spouse||sibling.p.married?'已成家':'尚未出嫁';
    m.trait=({温婉:'温和',沉静:'温和',爽直:'倔强',活泼:'倔强',聪慧:'进取',才女:'进取'})[sibling.p.trait]||m.trait;
  }
  if(outerFamilyStories()&&source==='旧识'){m.oldTie=ri(0,outerOldTies.length-1);m.marital=m.trade==='寡妇'?'守寡自立':pick(['已成家','守寡自立','尚未成婚']);}
  const tie=outerOldTie(m);
  const kinScene=sibling&&outerFamilyStories()?({
    gate:`${m.aunt}的${m.kin}${m.name}在宫门外等娘家的车。她从食盒里取出给亲人的点心，同你说起家事。`,
    natal:`你微服登门，${m.name}正在院里清点寄给${m.aunt}的衣物。她是宫里这位妃嫔的${m.kin}，如今${m.marital}。`,
    birthday:`今日是${m.aunt}生辰。她的${m.kin}${m.name}来别院送寿礼，留下来把一盏灯笼的流苏系好。`
  })[place]:null;
  const line=tie?outerMemories[m.oldTie]+' 如今她'+m.marital+'，还留着'+tie.token+'。':kinScene|| (source==='旧识'?pick(outerMemories):sibling?`${m.name}替${m.aunt}取寿礼，认出你的随从。她让车夫先走，留在别院的廊下与你说话。`:trade[1]);
  const oldTitle=source==='旧识'?'渡头重逢':sibling?'宫门外的寿礼':'宫外相识';
  const title=outerFamilyStories()&&(sibling||tie)?({gate:'长亭送客',natal:'微服访外家',birthday:'别院里的寿礼',city:'茶市重逢',altar:'归途遇故人'})[place]||oldTitle:oldTitle;
  pushEv({title,text:`${outerPlaces[place]}，${m.name}今年${m.age}岁。\n${line}\n她提起眼下最想办成的一件事，是${m.wish}。`,choices:[
    {t:'留下回信的去处',f:()=>{b.mothers.push(m);return outerNote(m,null,'相识','留下回信处',line+' 她约你改日再来。');}},
    {t:'送她一程，就此作别'}]});
}
A.outerEstate=function(){
  if(!outerActive()||modalOpen||S.over||mourningActive()||E().age<18||outerBook()?.estate)return;
  pushEv({title:'城西的一纸房契',text:'城西有一处两进的小院，后门临着集市。卖家将钥匙放在桌上。置下宅子后，可以另择日出宫，到此访邻会友。',
    choices:[outerCostChoice('置下别院',35,()=>{openOuterBook().estate={date:dateStr(),turn:S.turn};return '院门换了一把新锁，钥匙由心腹收着。';}),{t:'先不置办'}]});
};
A.outerMeet=function(source,place='city',hostId,relativeId){
  if(!outerActive()||modalOpen||S.over||mourningActive()||E().age<18||!Object.hasOwn(outerPlaces,place)||!['市井','旧识','姊妹'].includes(source))return;
  if(outerFamilyStories()&&source==='姊妹'&&place==='home')place='natal';
  if(!outerTourAllows(place))return;
  const allowed=source==='姊妹'?['natal','gate','birthday']:source==='旧识'?['city','suzhou','altar']:['city','hunt','temple','altar','suzhou','home'];
  if(outerFamilyStories()&&!allowed.includes(place))return;
  const b=outerBook(),sibling=source!=='姊妹'?null:outerFamilyStories()?outerKinChoices(place).find(x=>(hostId==null||x.host.id===hostId)&&(relativeId==null||x.p.id===relativeId)):outerSibling();
  if(source==='市井'&&place==='home'&&!b?.estate)return;
  if(['hunt','temple','altar'].includes(place)&&(S.flags.outerTrip?.turn!==S.turn||S.flags.outerTrip.place!==place))return;
  if(source==='姊妹'&&!sibling||source==='旧识'&&(S.year<3||b?.mothers.some(m=>m.source==='旧识'))||b?.lastMeet===S.turn||!useE())return;
  openOuterBook().lastMeet=S.turn;setScene('city');outerEncounter(place,source,sibling);
};
A.outerVisit=function(id){
  const m=outerMother(id);
  if(!outerActive()||modalOpen||S.over||mourningActive()||E().age<18||!m||m.closed||!outerTourAllows(m.place)||!outerContactPresent(m)||m.seen===S.turn||!useE())return;
  m.seen=S.turn;setScene('city');
  const choices=[];
  function visit(t,line,aff,trust,cost=0,intimate=false){
    choices.push({t,cond:()=>!cost||E().treasury>=cost,why:'国库不足',f:()=>{
      if(cost)chg({treasury:-cost});m.last=S.turn;m.meetings++;m.aff=clamp(m.aff+aff);m.trust=clamp(m.trust+trust);
      if(intimate&&belowConceptionAgeLimit(outerMotherAge(m),48)&&!m.preg&&S.turn>=(m.restUntil??0)&&chance(.38))m.preg={notice:S.turn+ri(1,2),due:S.turn+9};
      if(intimate&&journalContentVersion()>=84&&m.relative!=null){
        const sister=outerSister(m);
        if(sister?.married&&!sister.widow&&sister.spouse?.alive!==false){
          m.privateMeetings=(m.privateMeetings||0)+1;
          story(sister,'【别院私会】'+sisterMarriageReflection(sister,m.privateMeetings));
        }
      }
      return outerNote(m,null,'别院重访',t,line);
    }});
  }
  visit('坐下来听她说话',`你记得她想${m.wish}。她打开柜门，给你看这些天一点点攒下的东西。`,8,10);
  visit('替她分担家计 · 8万两','她逐项记下用处，又把写好的账递给你。她想让你知道她靠什么过日子。',10,7,8);
  if(m.meetings>=2&&m.aff>=45&&m.trust>=40)visit('应她的约，留到明早','她让人把院门掩上。清早你走时，她还倚在门边，约你下回早些来。',6,6,0,true);
  const tie=outerOldTie(m);
  pushEv({title:'别院 · '+m.name,text:(tie?tie.after+'\n':'')+`她收起手头的活计。“${m.trait==='倔强'?'我有几句话，想让你当真听进去。':m.trait==='进取'?'你上回问我往后打算，我想好了。':'还记得上回坐的那张椅子么？'}”`,choices});
};
function outerWitness(role,name){return {role,name,loyal:ri(40,85),discretion:ri(35,90),active:true};}
function outerBirth(m){
  const sex=pick(['m','f']),given=sex==='m'?pick(BOYC)+pick(BOYC):pick(GIRLA)+pick(GIRLB);
  const witnesses=[outerWitness('生母',m.name),outerWitness('稳婆',pick(SUR)+'婆婆'),outerWitness('心腹内侍',pick(SUR)+'内侍')];
  if(m.host){
    const aunt=familyHostById(m.host),sister=outerFamilyStories()?outerSister(m):aunt?.house?.relatives?.find(p=>p.id===m.relative);
    if(aunt&&sister&&relGet(aunt,sister)>=30)witnesses.push(outerWitness('知情的姨母',fullName(aunt)));
  }
  if(m.source!=='旧识')witnesses.push(outerWitness('送信人',pick(SUR)+'小满'));
  const k={id:S.nid++,born:S.turn,birthDate:dateStr(),sex,given,alias:m.sur+given,royalName:E().sur+given,mother:m.id,
    seed:ri(1,2e9),secret:100,trust:50,knowledge:'不知',witnesses,token:pick(['半枚玉佩','青线香囊','折过四次的旧信']),
    mark:pick(['左腕一颗朱痣','笑时眉梢微挑','右耳后一弯浅记']),lit:ri(26,49),mar:ri(22,45),vir:ri(30,56),amb:ri(22,46),looks:ri(45,83),trade:ri(18,38),
    register:'本姓',pedigree:'未入',placement:'待安置',path:'随母生活',visits:0,lesson:'随其性情',fee:0,alerts:[],pending:[],lastTick:S.turn};
  if(outerFamilyStories()){
    const tie=outerOldTie(m);if(tie)k.token=tie.token;
    k.temper=pick(['沉静','直率','坚韧']);k.likeness=pick(['抬眼时很像生母','侧脸的轮廓像年轻时的皇帝','笑起来与生母一模一样']);
  }
  assignChildPortrait(k);outerBook().children.push(k);delete m.preg;m.restUntil=S.turn+12;
  outerNote(m,k,'出生','接到平安信',`${m.name}给孩子起了名，将${k.token}压在襁褓底下。稳婆认得孩子的${k.mark}。`);
  outerQueue(k,'birth');
}
function outerQueue(k,key){if(!k.pending.includes(key))k.pending.push(key);}
function outerCostChoice(t,cost,f){
  return {t:t+(cost?' · '+cost+'万两':''),cond:()=>!cost||E().treasury>=cost,why:'国库不足',f:()=>{if(cost)chg({treasury:-cost});return f();}};
}
function outerPlace(k,m,kind,family='',fee=0){
  k.placement=kind;k.fee=fee;
  if(kind==='寄养'){k.foster=family;k.register='寄养姓';k.alias=family+k.given;k.witnesses.push(outerWitness('养家长辈',family+'夫人'));}
  if(kind==='外宅')k.witnesses.push(outerWitness('奶妈',pick(SUR)+'妈妈'));
  if(kind==='断联'){m.closed='自立门户';if(outerFamilyStories())m.aff=clamp(m.aff-18);m.trust=clamp(m.trust-30);k.trust=20;}
  if(kind==='宫中'){k.secret-=30;outerBeginClaim(k);k.path='暂居宫中，待核家籍';}
  const line={宫中:'太后听说宫门里添了个摇篮，遣人来问生母的姓名。',外宅:'临街的屋子换了一扇厚窗，奶妈在窗下晒起第一床小被。',断联:'她收好路费，独自给孩子报了户籍。回宫那条路，她一次也没再走。',寄养:`${family}家腾出一间朝阳的小屋。养母用新姓叫了一声，孩子还只会握她的手指。`}[kind];
  if(outerFamilyStories()&&m.trait==='倔强'&&['寄养','断联'].includes(kind))outerNote(m,k,'生母的意思','索一纸凭据',m.name+'收下安置文书，执意请你写明何时可以让孩子看自己的原籍。');
  if(outerFamilyStories()&&m.trait==='进取'&&kind==='宫中'){m.trust=clamp(m.trust+5);outerNote(m,k,'生母的意思','呈上原籍',m.name+'亲自递上原家的户帖，请内廷把孩子的名字写全。');}
  if(outerFamilyStories()&&m.trait==='温和'&&kind==='外宅'){m.trust=clamp(m.trust+5);outerNote(m,k,'生母的意思','安居外宅',m.name+'只求孩子能安稳过日子，把不该外传的家书收进箱底。');}
  if(outerFamilyStories()&&kind==='宫中'&&inPalace(empress())){const q=empress();cchg(q,{mood:-4});story(q,'【宫门添人】内廷忽然添了一处襁褓，她命女官核清起居与用度，等御前亲自说明。');}
  return outerNote(m,k,'安置',kind,line);
}
function outerCanClaim(k){return !outerFamilyStories()||!k.denied&&!k.refused;}
function outerBeginClaim(k){
  if(outerFamilyStories()&&(!outerCanClaim(k)||k.claim))return;
  k.claim={step:'太后问话',due:S.turn+1};
}
function outerRequestPapers(k){
  if(!outerCanClaim(k))return false;
  if(outerFamilyStories()&&E().age>=60&&kidAge(k)>=18&&(!k.lateAsked||k.lateReply==='留下未寄的家书')){
    outerQueue(k,'late');pushNow(outerPendingEvent(k,'late'));return false;
  }
  outerBeginClaim(k);return true;
}
function outerDeclineClaim(k){
  k.denied=true;
  if(outerFamilyStories()){delete k.claim;k.pending=k.pending.filter(p=>p!=='claim'&&p!=='council');}
}
function outerKnown(k){return k.trust<35?'怨恨':k.trust>=65?'亲近':'知道';}
function outerPressure(k){
  const active=k.witnesses.filter(w=>w.active);
  const officer=outerFamilyStories()&&k.officialId&&scholarById(k.officialId);
  const risk=(officer?Math.max(0,officer.merit||0)/250:0)+active.reduce((s,w)=>s+(105-w.discretion)/1900+(100-w.loyal)/3000,0);
  k.secret=clamp(k.secret-risk-(k.officialId||k.path==='宫中留名'? .60:0)-Math.min(.5,k.visits*.012)-(k.clues||0)*.025);
  for(const threshold of [60,40,20])if(k.secret<threshold&&!k.alerts.includes(threshold)){
    k.alerts.push(threshold);
    const loose=active.slice().sort((a,b)=>(a.loyal+a.discretion)-(b.loyal+b.discretion))[0];
    k.reports||={};
    if(outerFamilyStories()&&!loose){k.reports[threshold]='经手的人已经离散，县衙保存的旧帖却还查得到。';}
    else if(outerFamilyStories()&&loose&&threshold===60&&loose.loyal>=75&&loose.discretion>=75){
      k.reports[threshold]='邻人看见有人来问旧事。'+loose.name+'守住了口风，流言只说起当年那辆眼熟的车。';
    }else if(outerFamilyStories()&&loose&&threshold===40&&loose.loyal<55){
      k.reports[threshold]=loose.name+'收过来历不明的赏钱。御史将旧帖与供词对照，发现两处相同的乳名。';
    }else if(outerFamilyStories()&&loose&&threshold===60&&loose.discretion<45){
      k.reports[threshold]=loose.name+'在酒席上叫错一声乳名。席间的人想起多年前的一桩家事，才有了街口的传闻。';
    }else if(loose)k.reports[threshold]=threshold===60?loose.name+'在亲邻面前提起当年的差事，说完才发觉说漏了嘴。':
      threshold===40?'御史传问'+loose.name+'，供词里的日子同旧户帖对上了。':'从'+(loose?.name||'旧日知情人')+'处取得的证词与接生簿相合。';
    if(threshold===60&&k.knowledge==='不知')k.knowledge='怀疑';
    k.pending=k.pending.filter(key=>!key.startsWith('leak'));outerQueue(k,'leak'+threshold);
  }
}
function outerHouseholdExpense(){
  if(!outerActive())return 0;
  let balance=Math.max(0,E().treasury),total=0;
  for(const k of outerBook()?.children||[]){
    if(k.pedigree==='认领'||kidAge(k)>=18||!k.fee)continue;
    if(balance<k.fee){k.fee=balance>=2?2:0;k.trust=clamp(k.trust-5);outerNote(outerMother(k.mother),k,'家用裁减','按余银降等','账房退回旧支票。生母把原定的课程划去一门，重新安排这个月的家用。');}
    balance-=k.fee;total+=k.fee;
  }
  return total;
}
function outerMonthly(){
  if(outerIntegration()&&!S.over){
    const trip=S.flags.outerSouthernTour;
    if(trip?.gen===S.gen&&S.turn>=trip.returns){
      delete S.flags.outerSouthernTour;
      log(`${dateStr()}，南巡毕，御舟还京。`);
    }
  }
  const b=outerBook();if(!outerActive()||!b||S.over||b.tick===S.turn)return;b.tick=S.turn;
  if(outerIntegration()&&haremStability()<100&&S.turn-(E().haremDisturbedAt??-99)>=2){
    if(haremStability()<80)for(const c of harem())cchg(c,{mood:-1});
    E().haremStability=clamp(haremStability()+2);
  }
  for(const m of b.mothers){
    if(m.relative!=null&&outerSister(m)?.alive===false&&m.closed!=='已故'){
      m.closed='已故';delete m.preg;
      for(const k of b.children.filter(k=>k.mother===m.id))k.witnesses[0].active=false;
      outerNote(m,null,'宫外讣信','收家信','生母的讣信送到了。旧箱和书信交由家人保存。');
    }
    if(m.preg&&!m.preg.told&&S.turn>=m.preg.notice){
      m.preg.told=true;outerNote(m,null,'有喜来信','收到私信',m.name+'托人捎来一封没有落款的信。纸角另包着大夫写的月份。');
      pushEv({title:'宫外来信 · '+m.name,text:'“前几日请大夫看过了。你知道这件事以后，还肯来看我么？”',choices:[
        outerCostChoice('回信并送去药资',5,()=>{m.trust=clamp(m.trust+8);return outerNote(m,null,'答孕信','送去药资','她收到回信，终于把那张药方拿去抓了药。');}),
        {t:'亲笔回信，约定报平安',f:()=>outerNote(m,null,'答孕信','亲笔回信','她将回信折成四叠，收进装针线的匣子。')}]});
    }
    if(m.preg&&S.turn>=m.preg.due)outerBirth(m);
    if(!m.closed&&S.turn-m.last>=12&&(S.turn-m.last)%12===0){
      const oldPromise=!!outerOldTie(m);
      m.aff=clamp(m.aff-(oldPromise?11:8));m.trust=clamp(m.trust-(oldPromise?8:5));
      if(m.aff<20&&!m.preg){
        const remarry=m.source!=='姊妹'&&m.trait==='温和';m.closed=remarry?'另嫁':'自立门户';
        outerNote(m,null,'别院辞书','经年未访',remarry?'她寄来喜帖，说新家也给孩子留了一间屋。往后的家信请寄新址。':'她把院门钥匙送还，说往后有自己的日子要过。家书仍按旧址收寄。');
      }
      else outerNote(m,null,'岁末家信','经年未访',m.trait==='倔强'?'她只问了一句：“你还记得答应过什么吗？”':'信中附了一张今年的家用清单，末尾留了半页空白。');
    }
  }
  for(const k of b.children){
    if(k.lastTick===S.turn)continue;k.lastTick=S.turn;
    const m=outerMother(k.mother),age=kidAge(k),birthday=(S.turn-k.born)%12===0;
    const atPalace=nieceSelectionEntryActive()&&!!k.palaceRank;
    if(outerIntegration()){
      if(age>=18||atPalace)k.pending=k.pending.filter(key=>key!=='school');
      if(k.palaceRank)outerReconcileResident(k,m);
    }
    if(journalContentVersion()>=84&&m.relative!=null&&!k.sealed){
      const recognized=k.pedigree==='认领',child=recognized?kidById(k.id):k,previous=child?.outsideGrowthAge;
      outsideChildGrowing(child,byId(m.relative)||outerSister(m),familyHostById(m.host),recognized?'recognized':'quiet');
      if(child?.outsideGrowthAge!==previous)outerNote(m,k,'成长家书','收家信',child.story.at(-1).t);
    }
    if(k.pedigree==='认领'||k.sealed)continue;
    const official=k.officialId&&scholarById(k.officialId);
    if(official?.alive===false){
      if(outerFamilyStories()&&k.denied&&k.knowledge==='不知'&&k.trust>=50){k.knowledge='知道';outerNote(m,k,'弥留家信','将信物交还',k.alias+'病中拆开生母留下的旧信，终于明白为何当年总有人来看自己。','“不必再换一个名字了。”');}
      k.sealed=true;k.path='身后归档';k.pending=[];
      outerNote(m,k,'身后旧信','封存旧籍','遗物中有一封写了多年、始终没有寄出的家书。最后一行，署的是原家的名字。');
      continue;
    }
    if(outerFamilyStories()){
      if(!outerCanClaim(k)){delete k.claim;k.pending=k.pending.filter(key=>key!=='claim'&&key!=='council');}
      const sister=m.relative!=null&&outerSister(m);
      if(sister?.alive&&sister.visit&&sister.visit.from<=S.turn&&S.turn<sister.visit.until&&inPalace(byId(m.host))&&!k.visitWitness&&age>=3&&['随母','外宅'].includes(k.placement)&&!k.palaceRank&&chance(.3)){
        k.visitWitness=true;outerQueue(k,'visitResemblance');
      }
      if(age>=18&&E().age>=60&&!k.lateAsked&&!k.claim&&!k.pending.includes('late'))outerQueue(k,'late');
    }
    if(outerFamilyStories()&&k.illUntil&&S.turn>=k.illUntil){
      delete k.illUntil;k.sealed=true;k.pending=[];k.path='病逝故里';delete k.claim;
      outerNote(m,k,'故里讣音','收存遗书',k.alias+'离宫养病三个月，病势终未好转。家人遵她的意思，按原籍安葬，把那封旧信留在家里。','“请叫我自己用惯的名字。”');continue;
    }
    if(k.inquiry?.due<=S.turn)outerQueue(k,'proof');
    if(k.claim){if(k.claim.due<=S.turn&&!k.pending.includes('council'))outerQueue(k,'claim');}
    if(!k.exposed)outerPressure(k);
    if(age<18){const stat=outerLessons[k.lesson]||pick(['lit','mar','vir','amb','trade']);k[stat]=clamp(k[stat]+(k.fee>=4?.32:.21));}
    if(birthday){
      if(age<18){k.vir=clamp(k.vir+(k.fee?1:.5));k.looks=clamp(k.looks+.5);}
      if(age>=6&&S.turn-(k.lastVisit??k.born)>=24)k.trust=clamp(k.trust-(k.placement==='断联'?2:.5));

      if(age===3)outerNote(m,k,'三岁家报','收家书',`信里说孩子近来少生病，笑起来很像${m.name}。信末印着一只沾了糕粉的手。`,'“这个手印，也是我的名字吗？”');
      if(!atPalace&&(age===6||outerIntegration()&&age>6&&age<18&&k.schoolAge!==age))outerQueue(k,'school');
      if(age===10)outerQueue(k,'father');
      if(age===18){
        if(!atPalace&&!(nieceSelectionEntryActive()&&k.familySelection))outerQueue(k,'adult');
        outerNote(m,k,'成年','收成人礼家书',`${k.alias}将旧户帖上的幼名描了一遍，问明年能否自己署名。`,'“往后若有我的事，先问问我。”');
      }
      if(age>18)outerAnnual(k,m,age);
    }
    if(k.path==='宫中留名'&&!k.pending.includes('recognizedFace')&&chance(.035+(100-k.secret)/700+(m.host ? .05 : 0))){
      if(outerFamilyStories())k.discoverer=pick(outerDiscoverers(m));
      outerQueue(k,'recognizedFace');
    }
  }
  // Important petitions survive a busy month and can also be opened from the register.
  const petitions=b.children.filter(k=>!k.sealed&&k.pending.length);
  const urgent=petitions.filter(k=>k.pending.includes('birth')||k.pending.includes('leak20'));
  if(urgent.length){
    for(const k of urgent)pushEv(outerPendingEvent(k,k.pending.includes('birth')?'birth':'leak20'));
  }else if(petitions.length){
    const k=petitions.find(k=>k.id>(b.lastPetition??0))||petitions[0];
    b.lastPetition=k.id;pushEv(outerPendingEvent(k));
  }
}
