/* Connect the entries actually earned by a scene, without generating stories when a page is opened. */
const characterRecordsActive=()=>royalTravelActive();
function characterChapter(person,thread,kind,title,people,detail,{append=false}={}){
 if(!characterRecordsActive())return;
 const cast=[...new Map([person,...people].filter(p=>p?.id!=null).map(p=>
  [p.id,{id:p.id,name:p.fam?fullName(p):p.name}])).values()];
 if(append){if(detail)person.story.at(-1).t+=' '+detail;}
 else story(person,`【${title}】${detail}`);
 const entry=person.story.at(-1);
 entry.thread=thread;
 entry.life={kind,title,people:cast,gen:S.gen};
}
const DUANWU_UPBRINGING={
 merchant:['循着在家看铺账的习惯，把各席需用的器皿与食材分成两本账。','照家中验货的办法，先点礼匣，再逐份核收，免得一处短缺牵连别宫。'],
 scholar:['取纸画了一张席次图，把为何挪动一席写在图旁。','给各宫礼签另留一张底稿，誊写时一一按底稿查错。'],
 military:['先问值守宫人何时换班，安排上膳避开交接的时辰。','从前家中有人远行便按人分装行囊，她也把这一回的节礼按宫分箱，写明谁来领。'],
 farm:['点菜时先问当令有什么，听说园圃新收一批嫩菜，就叫膳房省下一道远来的料。','记得家中做节礼总按时鲜取用，她选了一样眼下正好的吃食，请膳房试做。'],
 medicine:['她请膳房记下茶饮与点心的用料，也留出几碟口味清淡的。','分装香草时逐一核对袋签，请帮忙的宫人把容易弄混的两味另置。'],
 foreign:['从小听惯了两地过节的讲究。她询问本朝端午的席序，又挑了一样娘家常吃的小食供人尝。','她记下本地节礼的规矩，另做一份自己从前在家里系惯的五色线给同办之人。'],
 humble:['从小知道一桌饭菜要花多少人手，她算清份例，给当值宫人也留了热食。','她知道旧布仍能用，留着宫中原有的礼包，将省下的工夫用来补齐短缺的份礼。'],
 noble:['她熟悉家宴的座次，仍去问了几位常年执事的宫人，照宫里的规矩改了席图。','她在家见过厚礼往来，这回却先问各宫按例应领多少，再封匣。'],
 official:['她把每一处临时调换的席位用小签标好，让经手的宫人也说得出缘由。','她给经手的人留了一张对照簿，节礼出一份就签记一份。']
};
function duanwuCharacterChapter(work,person,others,role,result){
 if(!characterRecordsActive())return;
 const thread=`duanwu:${work.gen}:${work.year}`;
 const upbringing=DUANWU_UPBRINGING[familyUpbringing(person).group]||DUANWU_UPBRINGING.official;
 const detail=result||upbringing[role==='tables'?0:1];
 characterChapter(person,thread,'bond','端午宫务',others,detail,{append:true});
}

const CHILD_STUDY_HOME={
 scholar:'她从家中旧书里找出一篇可对读的短文，在页角夹了一张签。',
 merchant:'她给孩子看了家中旧账的一页，请孩子也说说怎样核对纸上的数。',
 military:'她拿家中旧驿图给孩子看，讲起一条画在纸上很近、实地却不容易走的路。',
 farm:'她说起节气和田里的旧事，问孩子书上所写和实际看到的是否一样。',
 medicine:'她讲起家中旧时如何查药名，提醒孩子落笔前先看清实物。',
 foreign:'她用家乡的说法讲了一遍相近的事，又请孩子同课本上的写法比较。',
 humble:'她没有另寻名贵笔墨，帮孩子把写过的一张纸翻面，留作改稿。',
 noble:'她请孩子说清课业里哪一步是自己做的，替孩子认真收好了那一页。',
 official:'她拿出家中一份能说给孩子听的旧簿，陪孩子理清先后次序。'
};
const CHILD_STUDY_REVISION={
 好奇:'把原先不懂的地方另列一栏，找来两种说法，写下哪一种亲手验过。',
 好胜:'将最得意的一页和改过三次的一页都交上来，请老师各指一处不足。',
 仁厚:'把学会的办法写成三条短句，又问同窗哪一句最容易读懂。',
 内敛:'在原稿旁添了密密一页小字，先让太傅读，再逐条讲自己的意思。',
 爽直:'把原稿里一处断语划掉，补上亲眼见过的事和还没有弄明白的缘由。',
 灵动:'给先前的课业添一小幅图，太傅叫孩子照图讲，才发现有一处漏画。',
 审慎:'把原稿与新稿并放，逐笔核过日期、数字和出处，把拿不准的地方圈了出来。',
 自矜:'亲手誊了两份，只留一份署名，请太傅也照常批改那份无名稿。'
};
function noteRoyalSchoolwork(k,title,decision){
 if(!characterRecordsActive())return;
 const thread=`schoolwork:${k.id}:${S.turn}`,mothers=mothersOf(k).filter(m=>m.alive&&!m.gone);
 const detail=decision==='gift'?'孩子把新笔墨先收起来，打算用来写一页改稿。':'孩子把这番勉励记在原稿边上，打算重新理顺其中一段。';
 characterChapter(k,thread,'family','上书房课业',mothers,detail,{append:true});
 for(const m of mothers){
  const care=CHILD_STUDY_HOME[familyUpbringing(m).group]||CHILD_STUDY_HOME.official;
  characterChapter(m,thread,'family','上书房课业',[k],
   `${k.name}在上书房${title}。看到孩子带回的课业，${care}`);
 }
 if(!k.schoolRevision)k.schoolRevision={thread,title,due:S.turn+2};
}
function pendingRoyalSchoolRevision(){
 if(!characterRecordsActive()||S.over)return null;
 const k=S.children.find(p=>p.schoolRevision?.due<=S.turn&&childInPalace(p)&&!p.jailed);
 if(!k)return null;
 const revision=k.schoolRevision,mothers=mothersOf(k).filter(m=>m.alive&&!m.gone);
 const valid=()=>!S.over&&k.schoolRevision===revision&&childInPalace(k)&&!k.jailed;
 const detail=CHILD_STUDY_REVISION[childDisposition(k)];
 const finish=share=>{
  if(!valid())return null;
  delete k.schoolRevision;
  const text=`${k.name}补完了当时${revision.title}的课业。${detail}${share?'新稿抄送上书房，留给同窗参考。':'新旧两稿夹在一处，仍由孩子收着。'}`;
  characterChapter(k,revision.thread,'family','上书房课业',mothers,text);
  for(const m of mothers.filter(m=>m.alive&&!m.gone))characterChapter(m,revision.thread,'family','上书房课业',[k],
   `${k.name}把${share?'留给同窗的抄本也送来给她看。她重新翻到以前谈过的地方，看出孩子真又想过一遍。':'还带着批字的原稿与新稿一起给她看。她只问哪一处改得最费思量，陪孩子读到收笔。'}`);
  if(share)seedClassicCircle(k,revision);
  return text;
 };
 return {title:`上书房 · 再看旧稿 · ${k.name}`,por:k,valid,text:`太傅送回${k.name}前些日子的课业。孩子${detail}`,
  choices:[{t:'抄一份留给同窗参考',f:()=>finish(true)},{t:'新旧两稿都交还孩子',f:()=>finish(false)}]};
}
function noteInkstoneChapter(gift,person,other,received){
 if(!characterRecordsActive())return;
 const detail=received?(person.id===gift.young?'才明白砚背那道浅痕是旧主人试墨留下的，自己用过，也舍不得擦去。':'把送来的文章折在旧课本里，头一回认真看起弟妹的批字。'):
  person.id===gift.young?'接砚时先问往后能不能把自己写的字给对方看。':'把砚缘擦净，交给弟妹时还指了指从前试墨磨出的浅痕。';
 characterChapter(person,gift.thread,'family','旧砚往来',[other],detail,{append:true});
}

const OFFICIAL_LOCAL_WORK={
 water:['雨后让里正逐段记下渗水和沉降，旧验单与新验单一同归档。','把退回的护岸重新分段验看，未过的地方仍列在未完册里。'],
 grain:['请里正隔月回访偏远灾户，另留一册登记后来迁到的人家。','逐户补核赈册，旧路不通的村子另在送粮簿上标明，逐处签收。'],
 justice:['把结案的证词、契据并排抄存，供下任官员复核旧卷。','把证词不足的案卷逐件列出，证人与旧契没有补齐的，仍不结案。'],
 school:['学舍开课后交来一册到学簿，分记复学与后来入学的孩童。','暂借的屋舍已点名开课，原报的缺料与欠聘教习分别入册，逐项核验。'],
 irrigation:['渠首及末梢各留一人核记水时，下一季轮灌可以照册互验。','再验下游的闸板与水高，已通水和仍待修的渠段分列两册。'],
 bridges:['渡边贴出按期查梁的日子，桥旁添一册给舟夫和行人报损。','补交返工和再验的簿册，未验载的桥面仍挂着封行的木牌。'],
 granary:['加一页换粮日期，盘仓时请里正一道对照旧粮出入。','霉损之粮另列清数，已换补与待补购的分笔入册。'],
 tax:['按乡核对旧税单，将已经退还的重收款单独列账。','争议的地册先在村中逐户核认，尚有异议的税项另留备查。'],
 market:['在市口张贴准收的市税，巡查时请商人带原票来核。','把未撤的关卡逐处查清，旧货场重开日期也写在市榜上。'],
 medicine:['将坐诊与发药分册核记，偏村来取药时也可查到下一回坐诊的日子。','核对补换药材的入库单，缺医者的地方先派人转送急症。'],
 reclamation:['请里正回访本季复耕的人家，记下还要用农具还是已经能归还。','暂缓有旧契争议的田，把缺苗与待核田契的人家分开造册。'],
 'public-order':['把报案接收与原物发还列入同一簿册，夜巡交班时依册核验。','将捕役缺额和外县尚未回覆的案牍分别呈报，约下次联署查验。']
};
function localChronicleThread(r){return `local-duty:${r.id}`;}
function noteLocalChronicle(person,r,decision){
 if(!characterRecordsActive()||r.kind!=='local'||!r.id)return;
 const p=person.p,root=person.e?.c,people=root?[root]:[];
 const work=OFFICIAL_LOCAL_WORK[r.taskId];
 let detail;
 if(!decision){
  const upbringing=root?familyUpbringing(root).group:null;
  detail=upbringing==='merchant'?'他把实地验过的数与申领簿分列，沿用了家中核收时逐笔签认的办法。':
   upbringing==='military'?'他按家中旧营册的办法，把亲验与下属转报的两列标在不同页。':
   /军户/.test(p.origin||'')?'他把派往各处的人手与实地验看的记录分列，沿用早年见惯的军户点册。':
   /寒门|农家/.test(p.origin||'')?'他特意把不能到县里回话的人另记一页，托里正上门核问。':
   /书香/.test(p.origin||'')?'他将原话留在验册边注里，遇不同的说法便并列留存。':
   '他把实核过的数另抄一页，留着日后与原奏对照。';
 }else{
  const kind=decision;
  const linkedEstate=S.yiLands?.[S.gen]?.thread===localChronicleThread(r);
  const followup=work&&!linkedEstate&&['commend','accountable'].includes(kind)&&!p.localChronicleReview;
  detail=kind==='central'||kind==='promote'?'交卸时将原奏与验簿一并移交，供后来任职的人查考。':
   kind==='accountable'?'将短缺与待复核的地方另造一册。':
   kind==='commend'?'留下原先的验簿，留任推行时仍按册检查。':'收存原奏与御批，留作日后考课的依据。';
  if(followup){
   p.localChronicleReview={id:r.id,taskId:r.taskId,title:r.title,office:r.office,kind,due:S.turn+3};
   detail+='三个月后复核归档。';
  }
 }
 characterChapter(p,localChronicleThread(r),'days','地方差务',people,detail,{append:true});
}
function pendingLocalChronicleReview(){
 if(!characterRecordsActive()||S.over)return null;
 const person=careerPeople().find(({p})=>p.localChronicleReview?.due<=S.turn);
 if(!person)return null;
 const p=person.p,r=p.localChronicleReview,roots=careerKin(person).filter(x=>x.type==='blood'&&x.c.alive&&!x.c.gone).map(x=>x.c);
 const inOffice=()=>officialAlive(p)&&!p.retired&&!p.exiled&&!p.dismissed&&(p.office||p.post)===r.office;
 const text=inOffice()?OFFICIAL_LOCAL_WORK[r.taskId][r.kind==='commend'?0:1]:
  '吏部调卷时，原奏者已离任。其原奏和点交的差务清册一同留存，复核由接任者接手。';
 const valid=()=>!S.over&&p.localChronicleReview===r;
 return {title:`地方差务复核 · ${r.title}`,por:p,valid,text,choices:[{t:'收入原案，备考',f:()=>{
  if(!valid())return null;
  delete p.localChronicleReview;
  const thread=localChronicleThread(r);
  characterChapter(p,thread,'days','地方差务续记',roots,`${r.title}。${text}`);
  for(const c of roots)characterChapter(c,thread,'family','外家差务续记',[p],
   `家书提到${p.name}的「${r.title}」已有后续。${text}${r.kind==='commend'?'她再读一遍旧报，想起家里也曾为这差事担过心。':'她读完松了口气，把还需查明的几处折起页角，等下封来信再问。'}`);
  return null;
 }}]};
}

function noteCommissionChapter(entry,task,finished=false){
 if(!characterRecordsActive()||!Number.isInteger(task.started))return;
 const {p,c,h,role}=entry,thread=`commission:${p.id}:${task.started}:${task.id}`;
 const army=OFFICIAL_TASKS[task.id]?.army;
 const detail=finished?(task.outcome==='death'?'留下的差册由随行人封还，出发时那一页点名册也依旧在。':
  task.outcome==='setback'?'将办过的地方与仍待查验的缺项分开写，回京时一并交还差册。':
  army?'回呈所经各处的点验簿，给留守与换防人员各留一份便于接续。':'把所查的原簿一并带回，请经手的书吏留着实地核验的签记。'):
  army?(familyUpbringing(c).group==='military'?'照家中老将教过的办法，行前分点随差与留守人手，连替班的名册也一并收好。':'临行前问清各处何人领事，把军令、路程和换防的时辰各抄一页。'):
  (familyUpbringing(c).group==='merchant'?'仍用家中看铺账的办法，把原数、实数和差额分栏，预留一页给沿路经手人亲签。':'出门前将来文抄了一份，另外留出实地勘验的一栏，免得只凭原报销案。');
 characterChapter(p,thread,'days','领差纪事',[c],detail,{append:true});
 if(c.alive&&!c.gone){
  const label=officialKinLabel(h,role,c);
  const reaction=finished?(task.outcome==='death'?'她把出发前谈过的那封信也取出来，与讣报并放了很久。':
   task.outcome==='setback'?'她读完回信才明白差事难在何处，卷起旧家书等他说明善后。':'她从回奏里认出从前提过的一处难办的地方，如今才放下心。'):
   army?'她将家书先收好，问明消息往后要寄到哪一处，再提笔叮嘱平安。':'她想起家中从前谈过的事，请他得空写几句所见，也把回信日期记了下来。';
  const existing=c.familyDuty?.relativeId===p.id&&c.familyDuty.turn===S.turn&&c.story.at(-1)?.t.startsWith('【外家差事·');
  characterChapter(c,thread,'family','外家领差',[p],existing?reaction:
   `${label}${p.name}${finished?'传来差事消息':'奉差'}「${task.title}」。${reaction}`,{append:existing});
 }
}
