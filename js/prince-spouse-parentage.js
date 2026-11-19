/* Pregnancy and birth share the household record. The evidence and true father stay in the sealed file. */
const PRINCE_PRIVATE_CONCEPTION_CHANCE=.03;
const princeSpouseParentageCases=k=>k?.household?.spouseParentage||[];
function filePrinceSpouseParentage(k,p,pregnancy,imperial){
  if(pregnancy.princeParentage)return;
  const key=`${k.id}:${p.id}:${pregnancy.conceived}`;
  pregnancy.princeParentage=key;
  (k.household.spouseParentage||=[]).push({key,gen:S.gen,mother:p.id,motherName:p.name,before:p.trust??50,
    princeName:k.name,imperialFather:imperial?E().sur+E().name:null,noticeAt:pregnancy.conceived+2,status:'news'});
}
function notePrinceSpouseMeeting(k,p,visit){
  visit.lastMeeting=S.turn;
  const h=ensureMarriedLife(k),pregnancy=h.pregnancies.find(g=>g.mother===p.id);
  if(pregnancy){
    if(pregnancy.conceived>=S.turn-1)filePrinceSpouseParentage(k,p,pregnancy,false);
    return;
  }
  if(householdCoupleInTown(k,p)&&householdCanConceive(k,p,{privateVisit:true})&&chance(PRINCE_PRIVATE_CONCEPTION_CHANCE))
    startHouseholdPregnancy(k,p,{privateVisit:true});
}
function princeSpouseParentageActive(k,record){
  return !S.over&&princeSpouseParentageCases(k).includes(record)&&
    (record.status==='complete'||k.household.pregnancies.some(g=>g.princeParentage===record.key)||k.household.children.some(c=>c.id===record.childId));
}
const princeSpouseParentageWife=(k,record)=>k.spouse?.id===record.mother&&k.spouse.alive!==false?k.spouse:null;
const princeSpouseParentageChild=(k,record)=>k.household.children.find(c=>c.id===record.childId);
const princeSpouseParentageName=(k,record)=>princeSpouseParentageChild(k,record)?.name||record.motherName+'腹中的孩子';
const princeSpouseParentageFather=record=>record.imperialFather?`皇帝${record.imperialFather}`:record.princeName;
function princeSpouseParentageNote(person,record,title,text){
  if(!person||person.alive===false)return;
  princePersonNote(person,`【${title}】${text}`);
  person.story.at(-1).thread=`prince-spouse-parentage:${record.key}`;
}
function princeSpouseParentageSuspicion(k,record){
  if(!k.alive)return false;
  const visit=k.spouse?.princePrivateVisit;
  const heard=visit?.gen===record.gen&&visit.noticed;
  const disposition=childDisposition(k);
  const odds=(record.before>=65?.28:record.before<45?.68:.48)+(heard?.24:0)+(['审慎','好奇','自矜'].includes(disposition)?.10:0);
  return mulberry32(voiceHash(`prince-parentage:${record.gen}:${k.seed}:${record.key}`))()<odds;
}
const PRINCE_PARENTAGE_SUSPECT={
  好奇:'他问过是哪日请的脉，还想知道那半月都有谁来过府上。',好胜:'他开口便问时日，话有些急，问完才等她回答。',
  仁厚:'他怕自己问重了伤人，先叮嘱照常备药，待两人独处才问起日子。',内敛:'他将请脉的日子记在纸角，踌躇到夜里才带着那张纸去见她。',
  爽直:'他把疑问摆在两人中间，直问这孩子会不会另有生父。',灵动:'他一向能拿暖场的话解围，这次却把贺喜时准备说的笑话全忘了。',
  审慎:'他对了自己出入王府的日子，仍有几处对不上，便把疑问一并写了下来。',自矜:'他等府里贺喜的人散去，才关了门问她，问得很轻，句句都要听清。'
};
const PRINCE_PARENTAGE_RESULT={
  好奇:['他逐项听完证词，最后问该怎样把这一页往事留给长大后的孩子。','他把盘问了一晚的几张纸收起来，转而问起产房该备些什么。'],
  好胜:['他攥紧了回帖，到开口时只说此后凡关孩子的事，都得先同他商量。','他本想将那些疑处逐一辩完，话到嘴边，先为自己那几句重话道了歉。'],
  仁厚:['他先问王妃与孩子可还安稳，又说府里该备的东西一件也别撤。','他的第一句话是问她这几日睡得好不好，随后为自己那几句问话道歉。'],
  内敛:['他听得一言未发，夜里却留下一张笺，亲笔写明愿照旧让孩子住在府中。','他把原本搁着的一叠小衣送回她房里，只在最上面压了张写着「是我多疑」的笺。'],
  爽直:['他当面说自己心里过不去，随后也当面说孩子用的东西照旧备齐。','他当着她的面承认自己问得太急，等她说完，才去请府医再看一次。'],
  灵动:['府里有人问可要添一架小木马。他应了，过后许久才想起自己那时竟忘了笑。','他终于敢把早备下的小玩意儿拿出来，第一眼却先看她肯不肯伸手接。'],
  审慎:['他只认经核实的几页，又亲手将它们封起，另把照料孩子的支用照常列好。','他当面划去原先记下的疑处，将照料孩子的日程重新同她对了一遍。'],
  自矜:['他将封卷亲自锁好，在府里照旧行礼见客，回房才说自己还需些时日。','他将卷宗交还，走到门口又折回来，亲口说那句疑问伤了她，自己记得。']
};
const CONSORT_PARENTAGE_RESULT={
  温厚:['她先问他往后见到孩子会不会难受，说若他愿意，两人可以一道商量照料的事。','她听了他的道歉，给他留了座，也慢慢说起那几日受人打听时自己的委屈。'],
  爽朗:['她当面把话认下，转身却在小衣箱前站了很久，怕从此连孩子的寻常日子也添了顾忌。','她终于长出一口气，说这几日想说的话攒得太多，得让她一件一件讲。'],
  矜持:['她将回报收起，只当面问了一句，孩子将来可否由她亲自照看。','她依礼收了卷宗，待闲人退尽，才请他以后有疑问先来同她说。'],
  好胜:['她声音发紧，仍当面认下旧事，随即问明府里以后谁照料孩子、谁能知道内情。','她听到“他的骨血”以后才松开手，说可以谈错处，也要把她这些日子的难堪谈完。'],
  敏感:['她一听见结论就去摸缝到一半的小被，怕日后有人又来问孩子该算哪一家的。','她原以为听到结论便能安心，直到他问她这几日受了什么委屈，眼眶才红起来。'],
  沉静:['她待人都退下，才承认自己对这几个月也一直拿不准，愿亲自料理孩子的起居。','她将回报放下，坐完一盏茶的工夫，才告诉他，那些问题她一直记在心里。']
};
function princeParentageInquiryChoice(k,record,recordNews){
  const ready=()=>princeSpouseParentageActive(k,record)&&record.status===(recordNews?'news':'open')&&jinyiweiCommanderReady()&&E().energy>=1&&E().treasury>=15;
  return {t:'交锦衣卫秘密查证 · 精力−1 · 国库−15',cond:ready,why:'须有在任指挥使、精力和国库',f:()=>{
    if(!ready()||!useE())return null;
    recordNews?.();
    E().treasury-=15;record.status='investigating';record.due=S.turn+2;
    const p=princeSpouseParentageWife(k,record);
    if(k.alive)princeSpouseParentageNote(k,record,'王府密查','几处往来已交锦衣卫核对，王府先照常安排养护。');
    princeSpouseParentageNote(p,record,'王府密查','她收起脉案旧笺，愿单独向经手的指挥使说明当日情形。');
    story(jinyiwei().commander,`【王府密查】奉旨核对${princeEstateLabel(k)}的往来簿与经手人证词，约两月回奏。`);
    return '锦衣卫已接下封卷，两个月后密奏。府里照常备药与安排照料。'+fx('精力−1','国库−15');
  }};
}
function princeSpouseParentageNews(k,record){
  const p=princeSpouseParentageWife(k,record),suspected=princeSpouseParentageSuspicion(k,record);
  const affair=p?.princePrivateVisit?.gen===record.gen&&p.princePrivateVisit.discovery;
  const reaction=suspected?PRINCE_PARENTAGE_SUSPECT[childDisposition(k)]:'';
  const closeness=record.before>=65?'她原想头一个把孕信说给他听，如今仍在灯下等他把话说完。':
    record.before<45?'两人平日连用膳往往分开，她慢慢将手中的针线搁下，把请脉的日子说给他听。':'她把医官写的那张笺摊在案上，请他坐近些再看。';
  const privateThought=affair?'偏厅旧事已经说开，她想起那段日子，一时也难拿准。':'她想起偏厅里的那次相见，把有几句话留到了独处时才肯说。';
  const recordNews=()=>{
    record.status='open';record.suspected=suspected;
    if(k.alive)princeSpouseParentageNote(k,record,suspected?'王府胎月起疑':'王府孕信',suspected?`${reaction}他心中仍有疑问，照料却已先安排下去。`:'他得知王妃有喜，嘱府里按时请脉，自己也问了她想添些什么。');
    princeSpouseParentageNote(p,record,'王府孕信',closeness+privateThought);
  };
  return {title:suspected?'王府 · 胎月起疑':'王府 · 孕信密呈',cast:[k.alive?k:null,p],sealedAnnals:true,
    valid:()=>princeSpouseParentageActive(k,record)&&record.status==='news',
    text:`医官已记下${record.motherName}的孕信。${suspected?'王爷心里有几日放不下，想暗中核对那阵子的往来。':''}\n${reaction}\n${p?closeness+privateThought:''}\n若要核明生父，可交锦衣卫封卷查证。`,
    choices:[...(jinyiweiCommanderReady()?[princeParentageInquiryChoice(k,record,recordNews)]:[]),
      {t:'先照料王妃，将孕信留在府中',f:()=>{recordNews();return '你嘱府里照常请脉。日后若要核查，可从王府的密卷另行交办。';}}]};
}
function princeSpouseParentageReport(k,record){
  const p=princeSpouseParentageWife(k,record),imperial=!!record.imperialFather,band=imperial?0:1;
  const intimate=record.before>=65,distant=record.before<45;
  const prince=k.alive?PRINCE_PARENTAGE_RESULT[childDisposition(k)][band]+(imperial?
    intimate?'他只叹道，从前连给孩子取什么名字，都觉得可以同她商量一辈子。':distant?'两人本就少谈心事，他先同她约定今后各自料理哪些事。':'他没催她再解释，只请过几日再谈彼此的打算。':
    intimate?'他将以前商量过的乳名又念了一遍，问她还想不想用。':distant?'他答应尽该尽的父责，夫妻还是各过各的日子。':'他请她一起回看医官交代的事，想从眼下能做的事开始。'):'';
  const wife=p?(CONSORT_PARENTAGE_RESULT[marriageNature(p).temperament]||CONSORT_PARENTAGE_RESULT.沉静)[band]+(imperial?
    intimate?'她原以为还来得及同他说心里话，到此时才问，他往后还愿不愿听。':distant?'她把两处屋里的照料划分说清，独自留下理好孩子的东西。':'她请他先给自己几日，让她想清怎么继续过日子。':
    intimate?'她也想慢慢拾回从前能把话说开的日子。':distant?'身世既明，她总算能专心过自己的日子。':'她愿从照料孩子的几件小事重新同他相处。'):'';
  const result=`锦衣卫核明，${princeSpouseParentageName(k,record)}的生父为${princeSpouseParentageFather(record)}。`;
  return {title:'锦衣卫回奏 · 王府亲缘',por:jinyiwei()?.commander,cast:[k.alive?k:null,p],sealedAnnals:true,
    valid:()=>princeSpouseParentageActive(k,record)&&record.status==='investigating'&&S.turn>=record.due,
    text:`锦衣卫先以请脉原簿厘清时日，再核对那段日子的行止与经手人证词。诸项对得上，回报才封送御前，也分别告知了王府当事人。\n${result}\n${prince}\n${wife}`,
    choices:[{t:'封存回奏，依王府旧册照料孩子',f:()=>{
      record.status='complete';record.completed=S.turn;
      const visit=p?.princePrivateVisit;
      if(imperial&&visit?.gen===record.gen)visit.paternityConfirmed=true;
      if(k.alive)princeSpouseParentageNote(k,record,'王府亲缘密卷',result+prince);
      princeSpouseParentageNote(p,record,'王府亲缘密卷',result+wife);
      const delta=imperial?(intimate?-9:distant?-5:-7):(intimate?5:distant?1:3);
      const change=k.alive&&p&&k.married?changeHouseholdAffection(k,delta):0;
      return '回奏封入密卷。孩子的名册和照料仍按王府旧例办理。'+(change?fx(`夫妻感情${change>0?'+'+change:'−'+Math.abs(change)}`):'');
    }}]};
}
function pendingPrinceSpouseParentage(){
  if(!PalaceActions.princeSpouseParentage||S.over||mourningActive())return [];
  return royalHouseholds().flatMap(k=>princeSpouseParentageCases(k).filter(record=>princeSpouseParentageActive(k,record)).flatMap(record=>{
    if(record.status==='news'&&S.turn>=record.noticeAt)return [princeSpouseParentageNews(k,record)];
    if(record.status==='investigating'&&S.turn>=record.due)return [princeSpouseParentageReport(k,record)];
    return [];
  }));
}
A.princeSpousePaternity=function(id,key){
  if(modalOpen||!PalaceActions.princeSpouseParentage)return;
  const k=royalById(id),record=princeSpouseParentageCases(k).find(x=>x.key===key);
  if(!record||!princeSpouseParentageActive(k,record))return;
  if(record.status==='investigating'&&S.turn>=record.due){pushEv(princeSpouseParentageReport(k,record));return;}
  if(record.status!=='open'||!jinyiweiCommanderReady())return;
  pushEv({title:'锦衣卫密查 · 王府亲缘',por:jinyiwei().commander,sealedAnnals:true,
    text:`将${princeSpouseParentageName(k,record)}的往来原簿与证词交锦衣卫分别核对，约两个月后回奏。`,
    choices:[princeParentageInquiryChoice(k,record),{t:'暂存密卷，日后再议'}]});
};
function princeSpouseParentageRow(k,record){
  if(record.status==='news'||!princeSpouseParentageActive(k,record))return '';
  const ready=record.status==='open',due=record.status==='investigating'&&S.turn>=record.due;
  const state=record.status==='complete'?`已核明生父为${princeSpouseParentageFather(record)}`:
    ready?(record.suspected?'王爷曾问及胎月，亲缘待核':'可秘密查证亲缘'):due?'锦衣卫回奏已到':`密查中 · 还需 ${record.due-S.turn} 个月`;
  const action=ready||due?` <button class="btn sm jade" onclick="A.princeSpousePaternity(${royalActionArg(k.id)},${royalActionArg(record.key)})" ${ready&&!jinyiweiCommanderReady()?'disabled':''}>${due?'听取密奏':'请锦衣卫查证'}${ready&&!jinyiweiCommanderReady()?'<small>需有在任指挥使</small>':''}</button>`:'';
  return `<p>${esc(princeSpouseParentageName(k,record))} · ${esc(state)}${action}</p>`;
}
function princeSpouseParentagePanel(k,records=princeSpouseParentageCases(k)){
  return detailSection('王府亲缘密卷',records.map(record=>princeSpouseParentageRow(k,record)).join(''));
}
function jinyiweiPrinceSpouseParentagePanel(){
  return detailSection('王府亲缘密卷',royalHouseholds().flatMap(k=>princeSpouseParentageCases(k).map(record=>princeSpouseParentageRow(k,record))).join(''));
}
