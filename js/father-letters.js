/* Private money and private family letters. No invented father, office, or shared mind. */
const fatherLettersActive=()=>journalContentVersion()>=33;
function fatherLetterPerson(c){return c?.house?.father||null;}
function queenOfficialHouse(c){
 if(journalContentVersion()<39||c?.rank!==8)return false;
 const roots=familyUpbringing(c);
 return !!(officialGrade({office:roots.title})||/官宦/.test(roots.title)||roots.group==='noble'&&officialGrade(fatherLetterPerson(c)));
}
function fatherLetterRoots(c){
 if(!fatherLettersActive()||!c||c.maid||c.rescue||!fatherLetterPerson(c))return false;
 const r=familyUpbringing(c);
 return queenOfficialHouse(c)||['humble','farm'].includes(r.group)||r.group==='scholar'&&r.means==='modest'||r.group==='official'&&r.power<=25&&r.means!=='ample';
}
function fatherLetterAvailable(c){
 return (fatherLetterRoots(c)||!!c?.fatherLetters?.letter?.topic)&&fatherCanWrite(c);
}
function fatherCanWrite(c){
 const p=fatherLetterPerson(c);
 return !!(p&&S.consorts.includes(c)&&!S.over&&!mourningActive()&&inPalace(c)&&p.alive!==false&&!p.exiled&&!p.dismissed&&!p.incognitoCase&&c.hp>=40&&!homeWorryActive(c)&&!maternalUnsettled(c)&&!lifeBoundary(c)&&!continuityConcern(c)&&!['悲恸','心如死灰','惶恐','怨恨'].includes(xinOf(c)));
}
function fatherLetterInit(c){
 if(!fatherLetterAvailable(c))return null;
 const p=fatherLetterPerson(c);
 // This is a disposition of the same father, shared across sisters and saved once.
 const royal=queenOfficialHouse(c);
 if(!royal)p.daughterLetterNature||=chance(.12)?'demanding':'caring';
 if(!c.fatherLetters)c.fatherLetters={father:p.id,gen:S.gen,purse:royal?0:2,lastAccrual:S.turn,closeness:royal||p.daughterLetterNature==='caring'?65:-15,serial:0};
 return c.fatherLetters.father===p.id?c.fatherLetters:null;
}
function fatherLetterWellOff(c){const p=fatherLetterPerson(c);return c.fam.p>=55||officialGrade(p)>0&&officialGrade(p)<=4;}
function fatherLetterAmbition(c){
 const p=fatherLetterPerson(c);
 if(p.age>=70||p.retired)return '家门往后还要靠你多争些体面，莫总安于眼前';
 if(p.career==='commoner'||p.career==='student')return '若能替为父问得一份正经差事，家里也好有个出路';
 return officialGrade(p)<=2?'家门已有体面，你更该在宫里站稳脚跟':'为父眼下的官职还低，盼你多留意能否有个进身的机会';
}
function fatherLetterConcern(c){
 const p=fatherLetterPerson(c),s=c.fatherLetters,kind=p.daughterLetterNature,newcomer=familyBearingContext(c).stage==='new';
 if(kind==='demanding')return {title:'家书里的催促',quote:`${fatherLetterWellOff(c)?'家中如今虽已宽裕，人情往来却不能省。':'家里尚有许多用钱的地方。'}你在宫中，也该${c.favor>=60?'趁着如今得宠':'想法子立稳脚跟'}，有余钱便多往家里寄些。${fatherLetterAmbition(c)}。`,father:'女儿既进了宫，家里便该多得些照应。我把盼头写得重了，也仍觉得她应当替家门打算。'};
 const lines=newcomer?[
  '宫里的饭菜可还吃得惯？不懂的礼数慢慢学，莫怕旁人笑。家里能过日子，你先把自己照顾好。',
  '从前在家有事总肯问我，如今隔着宫门，也不知你有没有把难处都咽下去。不要只报喜，父亲想知道你睡得安不安。'
 ]:[
  '你在宫里住得久些了，可还有什么不惯？家里不求你事事拔尖，只盼你夜里睡得安稳，遇事有个能说话的人。',
  '天时转了，衣裳该添便添。你从前总将好的留给家里，父亲只怕你如今仍这样待自己。',
  '家中一切照常，不必只问我缺不缺银钱。也说说你近日喜欢什么、做成了什么小事，让父亲知道你怎样过日子。'
 ];
 return {title:newcomer?'父亲惦记她初入宫门':'家里只问她安好',quote:lines[s.serial%lines.length],father:`不知${fullName(c)}是不是又只肯报喜。我帮不上宫里的事，总该让她知道，家书里可以说自己的难处。`};
}
function daughterLetterThought(c,kind){
 const style=familyBearingStyle(c),dad=fatherLetterPerson(c).name;
 const caring={gentle:`父亲${dad}问的还是吃睡。读到这里，才发觉自己有许多小事想告诉他。`,proud:'在人前撑着的体面，到父亲这一句问候前才松了些。原来我不必在家书里也装作样样都好。',measured:'我把平安和难处分开写清，不叫父亲凭空担心，也不必一味报喜。',bright:'想把近日学会的规矩和闹过的小笑话都告诉父亲，让他知道我已经慢慢安顿了。',studious:'父亲不问我得了多少赏，只问过得怎样。信笺虽短，比旁人的夸赞更能让我定下心。',solitary:'旁人的热闹我不大愿说，父亲的信却反复读过。提笔时，还是用了在家时的亲近称呼。'};
 const pressure={gentle:'我想照顾家里，可也盼父亲先问一句我过得好不好。看完信，竟不知该从哪里回起。',proud:'我在宫中也要撑住自己的体面，怎么连家书都只问能带回多少好处？这份委屈，不想总咽下去。',measured:'家用可以量力安排，求官却不是寄一封信就能许下的事。我得把能做与不能做的分清。',bright:'本来备了许多家常想讲，读完催促的话，忽然一句也不想写了。',studious:'父亲盼家门有起色，我明白。可我的名字后面，不该只剩可以换来的银钱与功名。',solitary:'我不爱与人争逐，偏偏父亲总把家门的盼头写成催促。信收进匣里，心里却比从前更远了一点。'};
 return (kind==='demanding'?pressure:caring)[style];
}
function recordFatherLetter(c,thread,title,text,daughter,father,{toDaughter=true,toFather=true,emotion=.3}={}){
 const p=fatherLetterPerson(c),people=[{id:c.id,name:fullName(c)},{id:p.id,name:p.name}];
 const observers=[];
 for(const [person,thought,enabled] of [[c,daughter,toDaughter],[p,father,toFather]])if(enabled&&person.alive!==false){
  story(person,`【父女家书·${title}】${text} ${person===c?fullName(c):p.name}记下：${thought}`);
  Object.assign(person.story.at(-1),{thread,life:{kind:'family',title,turn:S.turn,gen:S.gen,people,source:'宫中与娘家之间的书信'}});
  observers.push({person:person.id,subject:person===c?p.id:c.id,interpretation:thought,emotion,impact:65,channel:'participant'});
 }
 if(observers.length)NPCMemory.record(S,{type:'father-letter',time:S.turn,participants:observers.map(o=>o.person),object:title,outcome:text},observers);
 const note={turn:S.turn,date:dateStr(),title,text,daughter,father};
 if(toFather&&p.alive!==false)(p.daughterLetters||={})[c.id]={daughterId:c.id,name:fullName(c),...note};
 return note;
}
function fatherLetterRecord(c,title,text,daughter,father,options){
 const s=c.fatherLetters,thread=`father-letters:${s.father}:${c.id}:${s.serial}`;
 s.latest=recordFatherLetter(c,thread,title,text,daughter,father,options);
 return s.latest;
}
function fatherHeirPressureChance(c){
 const p=fatherLetterPerson(c),rank=c?.rank,rate=[.08,.12,.17,.24][rank-5];
 const royal=queenOfficialHouse(c);
 const enteredAt=c?.enteredAt??(S.gen===1&&c?.knownBeforeAccession?0:S.turn);
 if(!fatherLettersActive()||!rate||c.maid||c.rescue||!fatherCanWrite(c)||c.preg||c.delivery&&!c.delivery.settled||
   S.turn-enteredAt<(royal?18:rank===8?24:36)||S.turn-(c.lastBirth??-99)<6||S.turn-(c.fatherHeirPressure?.turn??-99)<(royal?12:24)||
   S.children.some(k=>k.mom===c.id&&k.sex==='m'&&!k.removedFromRoyal))return 0;
 const grade=officialGrade(p),highOffice=grade&&grade<=4&&!p.retired;
 const ambitious=p.temperament==='进取'||p.daughterLetterNature==='demanding';
 if(royal)return highOffice ? .45 : .28;
 if(highOffice)return rate;
 if(ambitious&&(grade||c.fam?.p>=55))return rate*.4;
 return p.daughterLetterNature==='demanding'?rate*.15:0;
}
function fatherHeirPressureTick(){
 if(S.turn-(S.flags.lastFatherHeirPressure??-99)<6)return;
 const candidates=S.consorts.filter(c=>c.rank>=5&&!queenOfficialHouse(c)).sort((a,b)=>b.rank-a.rank||a.id-b.id);
 const c=candidates.find(c=>{const rate=fatherHeirPressureChance(c);return rate>0&&chance(rate);});
 if(!c)return;
 const p=fatherLetterPerson(c),title='父亲来信催问皇子',queen=c.rank===8;
 const daughter=S.children.some(k=>k.mom===c.id&&k.sex==='f'&&k.alive);
 const fosterSon=S.children.some(k=>k.foster===c.id&&k.sex==='m'&&k.alive);
 const grade=officialGrade(p),highOffice=grade&&grade<=4&&!p.retired;
 const quote=(queen?'你如今位居中宫，若能早日诞下嫡子，朝中议论便能少些。':`你如今已是${RANKS[c.rank]}，若能早日有亲生的皇子，在宫中也多一份倚仗。`)+
   (highOffice?`为父身居${p.office||p.post}，同僚偶尔也问起宫中子嗣。家里对你还有盼头，这件事须放在心上。`:'家里也盼着有这份喜信，往后你还须多上些心。');
 const thought=daughter?'我本想在回信里多写几句公主近来的趣事，提了笔又停住。父亲只问何时能有皇子，我却舍不得让女儿觉得她的出生叫人失望。':
   fosterSon?'我日日照看孩子，他有什么烦恼、喜欢什么，我都记得。父亲偏要问我何时生下自己的皇子，读来心里很不是滋味。':
   queen?'坐在中宫，外头的人总盼我事事合他们的心意。如今连父亲的信也只问嫡子，我读罢坐了很久，竟不知怎样回他。':
   '父亲信里把位分、家里的前程和一个还没出生的孩子写在了一处。我读到末尾，只觉得肩上又多了一件无法许诺的事。';
 cchg(c,{mood:-4});
 if(['平和','思念','释然'].includes(xinOf(c)))setXin(c,'委屈',`父亲${p.name}来信催问皇子`);
 c.fatherHeirPressure=recordFatherLetter(c,`father-heir-pressure:${p.id}:${c.id}:${S.turn}`,title,
   `${p.name}给${fullName(c)}写信道：“${quote}”`,thought,highOffice?'同僚的话我听进了心里，写信时只顾催她早有皇子，想得最多的是朝中与家里的前程。':'我把家里的盼头在信里写了一遍，却少问了她这几年在宫中是怎样过的。',{emotion:-.45});
 S.flags.lastFatherHeirPressure=S.turn;
 log(`${fullName(c)}收到父亲关于皇嗣的家书。`);
}
function fatherLetterNewReady(c,months=6){
 const s=c.fatherLetters;
 return fatherLetterRoots(c)&&fatherCanWrite(c)&&!s?.pending&&(!s?.letter||s.letter.answered)&&S.turn-(s?.lastLetter??-99)>=months&&S.turn>=(s?.quietUntil??-1);
}
function queenFatherLetter(c,pressure){
 const p=fatherLetterPerson(c),s=c.fatherLetters;
 const princesses=S.children.filter(k=>k.mom===c.id&&k.sex==='f'&&k.alive&&!k.removedFromRoyal);
 const princess=princesses.length===1?'公主':'几位公主';
 if(pressure){
  const grade=officialGrade(p);
  const court=grade&&grade<=4&&!p.retired?`为父在${p.office||p.post}任上，偶尔听见同僚问起中宫的子嗣。`:'族中谈起中宫的子嗣，常有人托我问一声。';
  const appeal=princesses.length?`我也挂念${princess}，只是中宫只有公主，朝里议起承嗣时仍会问你。若早日有个亲生皇子，${princess}将来出阁，在宫里也有同母的兄弟可倚仗。`:
    '中宫至今还无亲生皇子。若能早日诞下嫡子，朝里议及承嗣时少些揣测，你也少受几句闲话。';
  const daughter=princesses.length?'父亲问公主近况，末了又说要等一个皇子才有依仗。我原想跟他说女儿近日的趣事，提了笔又搁下。':
    '父亲把朝里的议论写到了我的桌上。嫡子不是多催几次便能有的，我提着笔，许久才写下头一句问安。';
  return {topic:'queen-heir',title:'父亲来信催问皇子',quote:court+appeal,daughter,
    father:princesses.length?'我确实惦记外孙女，却也把她往后的安稳系在了一个尚未出世的弟弟身上。':'我把朝里的话抄进了家书，盼她有个嫡子。等墨干时，才想起信中没有问她近来可曾睡好。'};
 }
 const quote=(s.serial%2===0&&princesses.length)?`我惦记${princess}，得闲时也说说近况。家中一切安好，你自己也要顾好起居。`:
   ['这两日家里翻出了你从前的习字本，连那张写歪了的也还留着。中宫事务繁忙，得闲时给家里报个平安。','前日家里收拾书房，找着你从前用的那方小砚。宫里人多事也多，若有烦心的，家书里尽可说。'][s.serial%2];
 return {topic:'queen-family',title:'中宫收到家书',quote,daughter:'父亲在信里仍同我说些家中的小事。读罢我重新铺纸，把近来想告诉家里的事写下来。',
   father:'送信时又嘱咐人走稳些。我只盼女儿得空回几句，知道她近来怎样便好。'};
}
function receiveFatherLetter(c,heirPressure=false){
 if(!fatherLetterNewReady(c))return null;
 const s=fatherLetterInit(c);if(!s)return null;
 const p=fatherLetterPerson(c),royal=queenOfficialHouse(c),words=royal?queenFatherLetter(c,heirPressure):fatherLetterConcern(c);
 const thought=royal?words.daughter:daughterLetterThought(c,p.daughterLetterNature);
 s.letter={...words,turn:S.turn,serial:++s.serial,answered:false};s.lastLetter=S.turn;
 const pressure=royal?heirPressure:p.daughterLetterNature==='demanding';cchg(c,{mood:pressure?-3:3});
 if(['平和','思念','委屈','释然','欢喜'].includes(xinOf(c)))setXin(c,pressure?'委屈':'思念',`读到父亲${p.name}的家书`);
 const note=fatherLetterRecord(c,words.title,`${p.name}给${fullName(c)}写信：“${words.quote}”`,thought,words.father,{emotion:pressure?-.4:.45});
 if(royal&&heirPressure){c.fatherHeirPressure=note;S.flags.lastFatherHeirPressure=S.turn;}
 return s.letter;
}
function fatherLetterAccrue(c){
 const s=c.fatherLetters;if(!s||!fatherLettersActive()||!inPalace(c)||s.gen!==S.gen||queenOfficialHouse(c)||s.letter?.topic&&!fatherLetterRoots(c))return;
 const periods=Math.floor((S.turn-s.lastAccrual)/3);if(periods<=0)return;
 // Reserve for personal extras, not historical taels; no retrospective grant on migration.
 s.purse=Math.max(s.purse,Math.min(6,s.purse+Math.min(periods,2)*(c.rank>=4||c.favor>=65?2:1)));s.lastAccrual=S.turn;
}
function fatherLetterReturn(c){
 const s=c.fatherLetters,p=fatherLetterPerson(c),mail=s?.pending;if(!mail)return false;
 if(mail.gen!==S.gen||mail.father!==p?.id){delete s.pending;return false;}
 if(p.alive===false){
  delete s.pending;if(mail.kind==='money')s.purse++;
  if(c.alive)fatherLetterRecord(c,(palaceDetailsActive()?mail.kind!=='money':mail.topic)?'未能送到的家书':'未能送到的银封',`${fullName(c)}此前寄出的${mail.kind==='money'?'银封与家书':'家书'}未及送达，便传来父亲${p.name}的讣讯。${mail.kind==='money'?'银封退回，仍归她的体己。':'送出的信也随递信人带回。'}`,'原以为来日还能听见父亲回话，如今只剩一封没能读给他听的信。','',{toFather:false,emotion:-.8});
  return true;
 }
 if(S.turn<mail.due||p.exiled||p.dismissed||p.incognitoCase)return false;
 if(c.alive===false){
  delete s.pending;fatherLetterRecord(c,'女儿未等到的回信',`${p.name}收到${fullName(c)}生前寄出的${mail.kind==='money'?'一份体己与家书':'家书'}。女儿已经去世，回信再也送不到她手中。`,'','我还收着她最后写的字，却再不能问她过得好不好。',{toDaughter:false,emotion:-.8});return true;
 }
 if(!fatherLetterAvailable(c))return false;
 delete s.pending;
 const royal=!!mail.topic,demanding=!royal&&p.daughterLetterNature==='demanding',money=mail.kind==='money';let reply,father,thought;
 if(royal){
  if(mail.kind==='boundary'){
   reply='你的回信我读了。朝中怎么议论，我且留在朝中。你近来过得如何，下回得闲，再说给父亲听。';
   father='她劝我莫把承嗣的话句句写进家书。我犹疑了半晌，还是将那几句旧话划去，改问她的近况。';
   thought='这回父亲肯听我把话说完。我把他的回信收好，想等下次有了闲暇，再写些平日的事。';
  }else{
   reply='知道你近来安好，我与家里都放心。宫中诸事慢慢料理，等你得闲，再写信来。';
   father='她肯写几笔中宫的日常。我将那封信叠在案边，闲下来又看了一遍。';
   thought='父亲读进了我写的近况。家书来去，总还有几句是我们父女的话。';
  }
  s.closeness=clamp(s.closeness+3,-100,100);
 }else if(money&&demanding){
  reply=`银钱已经收下。${fatherLetterWellOff(c)?'家里虽不缺衣食，往来体面却处处要用钱。':'这回先补了家用，往后还有许多用处。'}你也该在宫里再往上走一步，若得了赏赐，下回多寄些回来。${fatherLetterAmbition(c)}。`;
  father='收到女儿寄来的银钱，先算了家中的用处，又在回信里提起往后的盼头，没有问她为这份心意省了什么。';
  thought='读到父亲收下银钱，我原还松了口气。再往下读，他只问何时能多寄些，能不能帮家里谋个前程。那句想问我过得好不好，始终没等到。';s.closeness=clamp(s.closeness-5,-100,100);
 }else if(money){
  reply=mail.constrained?'银钱收到了，父亲知道你的心意。可你是不是又舍不得添衣，把零用一点点省下来了？宫中纵有份例，也不能事事委屈自己。往后先顾好你，不必回回寄钱。':'银钱收到了，父亲领你的心意。知道你如今用度从容些，我便安心一点；仍别只顾家里，自己喜欢的东西也该留一份。';
  if(fatherLetterWellOff(c))reply+='家中如今已经宽裕，往后只写平安便好。';
  father=mail.constrained?'我把银封收好，却忍不住想她攒下这些时，舍去了多少喜欢的小物。宁可少收些，也盼女儿别委屈自己。':'女儿渐渐过得从容，我替她高兴。收下的是心意，不能让她以为家里只等着她寄钱。';
  thought=isSolitary(c)?'父亲仍记得我从前省着用东西的习惯。信读到末尾，才发现自己已经将那句叮嘱轻轻念出了声。':'父亲收下了，却先担心我过得紧。我在回信旁添了几笔，说自己留够了用度，也会照顾好自己。';s.closeness=clamp(s.closeness+4,-100,100);
 }else if(demanding){
  reply=mail.kind==='boundary'?'你的话我读过了。家里仍盼你出息，也知道官职不能只凭一句私情就定。我暂且不再催，你自己也要记着家门。':'平安信收到了。只是家中也有指望，你在宫里总该多想些门路，不要只说吃睡安好。';
  father=mail.kind==='boundary'?'她把能做的与不能许诺的写得清楚，我心里仍不痛快，先把催促的话收一收。':'女儿只报了平安，没提银钱与差事，我读过后仍有些不甘。';
  thought=mail.kind==='boundary'?'父亲没有立即改了心意。我能尽的是牵挂与量力照应，不能拿自己的日子去许下所有盼头。':daughterLetterThought(c,'demanding');s.closeness=clamp(s.closeness-2,-100,100);
 }else{
  reply='知道你睡得安稳、也有自己的小欢喜，父亲便放心了。银钱留着自用，下回得闲，再说几件日常小事给家里听。';
  father='她终于肯说自己的日子，没再只问家里缺什么。比起收到银钱，这封平安信更叫我踏实。';thought='原来只把自己过得如何告诉父亲，也能让他安心。不必每封家书都夹上一份银钱。';s.closeness=clamp(s.closeness+3,-100,100);
 }
 s.lastReply={turn:S.turn,quote:reply,kind:mail.kind};
 cchg(c,{mood:demanding?-2:4});if(['平和','思念','委屈','释然','欢喜'].includes(xinOf(c)))setXin(c,demanding?'委屈':'释然',`收到父亲${p.name}的回信`);
 fatherLetterRecord(c,royal?'中宫家书有了回音':money?'银封之后的回信':'平安信有了回音',`${p.name}收到${fullName(c)}寄出的${money?'一份体己与家书':'家书'}，回信道：“${reply}”`,thought,father,{emotion:demanding?-.4:.5});
 log(`${fullName(c)}寄给父亲的${money?'银封':'家书'}有了回音。`);
 return true;
}
function fatherLetterTick(){
 if(!fatherLettersActive()||!S||S.over||S.flags.fatherLettersChecked===S.turn)return;
 S.flags.fatherLettersChecked=S.turn;
 for(const c of S.consorts){fatherLetterAccrue(c);fatherLetterReturn(c);}
 // An unattended family letter need not wait forever for the emperor to answer it.
 if(!mourningActive()&&S.turn-(S.flags.lastFatherLetterAutonomy??-99)>=3&&chance(.3)){
  const waiting=S.consorts.filter(c=>fatherLetterAvailable(c)&&c.fatherLetters?.letter&&!c.fatherLetters.letter.answered&&!c.fatherLetters.pending&&S.turn-c.fatherLetters.letter.turn>=3);
  if(waiting.length){const c=pick(waiting),s=c.fatherLetters,careful=['measured','solitary','studious'].includes(familyBearingStyle(c));
   const kind=s.letter.topic?(s.letter.topic==='queen-heir'&&careful?'boundary':'peace'):
     fatherLetterPerson(c).daughterLetterNature==='demanding'&&careful?'boundary':s.purse>=2&&chance(.6)?'money':'peace';
   if(fatherLetterSend(c,kind,false))S.flags.lastFatherLetterAutonomy=S.turn;
  }
 }
 if(mourningActive())return;
 const queen=S.consorts.find(c=>queenOfficialHouse(c)&&fatherLetterNewReady(c));
 if(queen){
  const rate=S.turn-(S.flags.lastFatherHeirPressure??-99)>=6?fatherHeirPressureChance(queen):0;
  const pressure=rate>0&&chance(rate);
  if(pressure||chance(.4)){
   if(receiveFatherLetter(queen,pressure))log(`${fullName(queen)}收到父亲${pressure?'关于皇嗣的':''}家书。`);
  }
 }
 if(S.turn-(S.flags.lastFatherLetter??-99)<3||!chance(.25))return;
 const pool=S.consorts.filter(c=>!queenOfficialHouse(c)&&fatherLetterNewReady(c,12));
 if(!pool.length)return;
 const c=pick(pool);if(receiveFatherLetter(c)){S.flags.lastFatherLetter=S.turn;log(`${fullName(c)}收到父亲的家书，心里有些话想说。`);}
}
function fatherLetterSend(c,kind,manual=true){
 const s=c?.fatherLetters,p=fatherLetterPerson(c),letter=s?.letter;
 if(!['money','peace','boundary'].includes(kind)||!fatherLetterAvailable(c)||s?.gen!==S.gen||s?.father!==p.id||!letter||letter.answered||s.pending)return null;
 const topic=letter.topic;
 if(kind==='money'&&(topic||s.purse<2)||kind==='boundary'&&(topic?topic!=='queen-heir':p.daughterLetterNature!=='demanding'))return null;
 if(manual&&!useE())return null;
  letter.answered=true;if(kind==='money')s.purse--;
 if(kind==='boundary'&&!topic)s.quietUntil=S.turn+12;
  s.pending={gen:S.gen,father:p.id,kind,sent:S.turn,due:S.turn+(p.commission||p.away?2:1),constrained:familyBearingContext(c).constrained};
 if(topic){
  s.pending.topic=topic;
  const own=kind==='boundary'?'我想请父亲少提承嗣，多问几句家里人过得怎样。':'近况都写在信上了，得空也想听父亲说说家里的事。';
  const text=`${fullName(c)}给父亲${p.name}回信，${kind==='boundary'?'请父亲以后家书少谈承嗣，多问女儿近况':'问候家中，写了几件中宫近来的事'}。信件已经交出，回音尚未到。`;
  fatherLetterRecord(c,'中宫致父亲的回信',text,own,'',{toFather:false,emotion:.3});
  return text+(manual?'\n§精力−1':'');
 }
  const own=kind==='money'?'想把这一份心意送回家，也替自己留够日常余地。':kind==='boundary'?'能量力照应家用，却不能许下拿恩宠换官职的事。这些话，我想自己写清。':'先说清自己近来的日子，银钱暂留自用，不必拿每一次寄钱证明牵挂。';
  const text=`${fullName(c)}给父亲${p.name}回信，${kind==='money'?'从自己的体己中取出一份银钱随信寄出，另留一份作自用余地':kind==='boundary'?'说明会量力照应，却不替家门许诺官职与恩宠':'只报平安与近况，体己仍留着自用'}。信件已经交出，回音尚未到。`;
  fatherLetterRecord(c,kind==='money'?'寄一份体己回家':'把自己的话写清',text,own,'',{toFather:false,emotion:kind==='boundary'?-.1:.3});return text+(manual?'\n§精力−1'+(kind==='money'?' · 她的体己−1':''):'');
}
function fatherLetterEvent(c){
 if(!fatherLetterAvailable(c))return null;
 const s=c.fatherLetters,p=fatherLetterPerson(c);if(!s)return null;
 const letter=s.letter,gen=S.gen,turn=S.turn;let done=false;
 const valid=()=>!done&&S.gen===gen&&S.turn===turn&&byId(c.id)===c&&fatherLetterPerson(c)===p&&c.fatherLetters===s&&fatherLetterAvailable(c);
 const ready=()=>valid()&&s.letter===letter&&letter&&!letter.answered&&!s.pending;
 const act=kind=>{if(!ready())return null;const result=fatherLetterSend(c,kind);if(result)done=true;return result;};
 const context=letter&&!letter.answered?`父亲${p.name}写道：“${letter.quote}”`:s.pending?'寄出的家书尚在路上。':s.lastReply?`父亲最近的回信：“${s.lastReply.quote}”`:`父亲${p.name}写道：“${letter?.quote||''}”`;
 if(letter?.topic)return {title:!letter.answered?letter.title:'父亲的家书',por:c,valid,text:`${context}\n她说：“${s.latest.daughter}”`,choices:[
  {t:'陪她回信问安 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('peace')},
  ...(letter.topic==='queen-heir'?[{t:'陪她写信，请父亲少谈承嗣 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('boundary')}]:[]),
  {t:'先陪她收好信'}]};
 return {title:'父亲的家书',por:c,valid,text:`${context}\n她说：“${s.latest?.daughter||daughterLetterThought(c,p.daughterLetterNature)}”\n可支配体己：${s.purse}份。${s.purse<2?'眼下先留着自用，不勉强寄钱。':'寄出一份后仍为她保留自用余地。'}`,choices:[
  {t:'陪她写信，寄一份体己 · 精力−1',cond:()=>ready()&&s.purse>=2&&E().energy>0,why:s.purse<2?'先留一份自用':'这封信已回过或尚待回音',f:()=>act('money')},
  {t:'先报平安，银钱留着自用 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('peace')},
  ...(p.daughterLetterNature==='demanding'?[{t:'陪她写清：家用量力，官职不许诺 · 精力−1',cond:()=>ready()&&E().energy>0,f:()=>act('boundary')}]:[]),
  {t:'先陪她收好信'}]};
}
A.fatherLetter=function(id){
 if(modalOpen)return;
 const c=byId(id);if(!c||!fatherLetterRoots(c)&&!c.fatherLetters?.letter?.topic)return;
 // Journal snapshots deserialize each sister's household separately.
 houseOf(c);if(!fatherLetterAvailable(c))return;
 if(fatherLetterNewReady(c))receiveFatherLetter(c);
 const event=fatherLetterEvent(c);if(event)pushEv(event);
};
function fatherLetterPanel(c){
 const p=fatherLetterPerson(c),s=c.fatherLetters;
 if(!p||!fatherLetterRoots(c)&&!s?.letter?.topic)return '';
 if(s?.letter?.topic||queenOfficialHouse(c)){
  return `<div class="father-letter-panel"><h4>父女家书</h4>${s?.latest?`<p>${esc(s.latest.date)} · ${esc(s.latest.title)}<br>${esc(s.latest.text)}</p><p>她记下：${esc(s.latest.daughter)}</p>`:'<p class="hint">她常与父亲通信，写些中宫与家中的近况。</p>'}${fatherLetterAvailable(c)?`<button class="btn sm" onclick="A.fatherLetter(${c.id})">${s?.pending?'看看寄出的家书':s?.latest?'听她谈父亲的家书':'同她聊聊父亲的来信'}</button>`:p.alive===false?'<p class="hint">父亲已故，旧日书信仍留着。</p>':''}</div>`;
 }
 return `<div class="father-letter-panel"><h4>父女家书</h4>${s?.latest?`<p>${esc(s.latest.date)} · ${esc(s.latest.title)}<br>她记下：${esc(s.latest.daughter)}</p><p class="hint">父女情分：${s.closeness>=40?'亲近牵挂':s.closeness<0?'有些隔阂':'仍在磨合'} · 可支配体己 ${s.purse}份${s.pending?' · 家书待回音':''}</p>`:'<p class="hint">家门虽小，父亲与女儿也有各自的牵挂与盼头。</p>'}${fatherLetterAvailable(c)?`<button class="btn sm" onclick="A.fatherLetter(${c.id})">${s?.pending?'看看寄出的家书':s?.latest?'听她谈父亲的家书':'谈谈家中的用度'}</button>`:p.alive===false?'<p class="hint">父亲已故，旧日书信仍留着。</p>':''}</div>`;
}
const letterHouseLine=houseLine;
houseLine=function(c){
 const html=letterHouseLine(c)+fatherLetterPanel(c),note=c.fatherHeirPressure,latest=c.fatherLetters?.latest;
 const alreadyShown=c.fatherLetters?.letter?.topic==='queen-heir'&&latest?.turn===note?.turn&&latest?.title===note?.title;
 return html+(fatherLettersActive()&&note&&!alreadyShown?`<div class="father-letter-panel"><h4>${esc(note.title)}</h4><p>${esc(note.date)} · ${esc(note.text)}</p><p>她记下：${esc(note.daughter)}</p></div>`:'');
};
const letterLivedTick=livedRelationshipsTick;
livedRelationshipsTick=function(){
 letterLivedTick();
 if(!fatherLettersActive())return;
 fatherLetterTick();fatherHeirPressureTick();
};
const letterTopics=consortChatTopics;
consortChatTopics=function(c){
 const topics=letterTopics(c),s=c.fatherLetters,p=fatherLetterPerson(c);
 if(!fatherLettersActive()||!fatherCanWrite(c))return topics;
 const pressure=c.fatherHeirPressure,recentPressure=pressure&&S.turn-pressure.turn<=6;
 if(recentPressure)topics.unshift({id:'father-heir-pressure',make:()=>({key:'father-heir-pressure',stage:`她提起父亲${p.name}催问皇嗣的那封信。`,text:pressure.daughter})});
 const sameLetter=recentPressure&&s?.letter?.topic==='queen-heir'&&s.latest?.title===pressure.title;
 if(s?.latest&&!sameLetter&&(fatherLetterRoots(c)||s.letter?.topic))topics.unshift({id:'father-letter',make:()=>({key:'father-letter',stage:`她将父亲${p.name}的信重新叠好，谈起自己的心事。`,text:s.latest.daughter})});
 return topics;
};
const letterOfficialView=viewOfficial;
viewOfficial=function(){
 const html=letterOfficialView(),e=officialEntry(UI.sel);if(!fatherLettersActive()||e?.role!=='father')return html;
 const notes=Object.values(e.p.daughterLetters||{});if(!notes.length)return html;
 return html+detailSection('宫中女儿的家书',notes.map(n=>`<p><strong>${esc(n.name)}</strong> · ${esc(n.date)} · ${esc(n.title)}<br>他记下：${esc(n.father)}</p>`).join(''));
};
const letterOfficialConversation=officialConversation;
officialConversation=function(e,topic){
 if(fatherLettersActive()&&e.role==='father'&&topic==='family'&&officialAlive(e.p)){
  const notes=Object.values(e.p.daughterLetters||{}).filter(n=>{const c=byId(n.daughterId);return c&&inPalace(c)&&c.hp>=40&&!maternalUnsettled(c)&&!homeWorryActive(c);}).sort((a,b)=>b.turn-a.turn);
  const note=notes[0];if(note&&S.turn-note.turn<=12)return `“说起${note.name}，${e.p.career==='commoner'?'草民':'臣'}仍记着那封家书。${note.father}”`;
 }
 return letterOfficialConversation(e,topic);
};
