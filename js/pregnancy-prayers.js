/* Fictional pregnancy divination: a saved wish, never a medical or parentage test. */
const PREGNANCY_LOTS=[
  {id:'bear',name:'熊罴入梦',hint:'m',line:'签上画着山中熊罴。古书占梦，以熊罴为男子之祥；照这签意，倒像是位小皇子。只是梦与签都隔着一层云，贫道不敢把一句贺语说成定数。'},
  {id:'serpent',name:'虺蛇游庭',hint:'f',line:'签上小蛇穿过花影。莫因见蛇便惊惧，《斯干》里也把虺蛇记作女子之祥。若循古意，是位小公主的好兆头；真正是谁来叩宫门，还须等相见那日。'},
  {id:'stars',name:'双星照水',hint:null,line:'两点星光落在一池水里，看着像成双，水动时又合在一处。有人愿解作龙凤呈祥，也有人解作母子相照。男女、几人，都不能只凭这两点光来定。'},
  {id:'cloud',name:'云开见月',hint:null,line:'月还藏在云后，签上没有写男女。与其追问云何时散，不如先护好眼前这一盏灯。孩子自有来到人间的时辰。'}
];
function pregnancyPrayerKey(c){
  const began=c?.pregnancyCalendar?.conceived??c?.pregnancyFather?.conceived??(S.turn-(c?.preg||0));
  return `${S.gen}:${c?.id}:${began}`;
}
function pregnancyPrayerEligible(c){return !S.over&&inPalace(c)&&!c.maid&&c.age>=16&&c.preg>=2&&c.preg<(c.pregnancyCalendar?.term||10)&&(!c.delivery||c.delivery.settled);}
function pregnancyPrayerHome(c){return c.preg>=8||c.trait==='体弱'||(c.hp??100)<40;}
function currentPregnancyPrayer(c){return c?.pregnancyPrayer?.key===pregnancyPrayerKey(c)?c.pregnancyPrayer:null;}
function pregnancyPrayerLot(c){return PREGNANCY_LOTS.find(l=>l.id===currentPregnancyPrayer(c)?.lot)||PREGNANCY_LOTS[voiceHash('prayer:'+pregnancyPrayerKey(c)+':'+c.seed)%PREGNANCY_LOTS.length];}
function pregnancyPrayerWish(c){
  const children=S.children.filter(k=>k.mom===c.id&&!k.removedFromRoyal),living=children.filter(k=>k.alive);
  const lost=children.some(k=>!k.alive&&!k.missing)||c.concealedLoss?.revealed;
  const anxious=lost||['悲恸','惶恐','忧虑'].includes(xinOf(c));
  let line;
  if(anxious)line='“国师，这一胎是男是女？……其实，臣妾更怕又等不到抱一抱的那天。能不能只替我们留一句平安？”';
  else if(['骄纵','骄矜','善妒'].includes(c.trait))line=living.some(k=>k.sex==='m')?'“宫里都说臣妾已有皇子，便不必再问。可这一回是谁，臣妾还是想先知道。”':'“国师，这回可像是位皇子？臣妾想知道，又怕旁人先拿这件事说嘴。”';
  else if(['才女','好学','聪慧'].includes(c.trait))line='“臣妾读过《斯干》的占梦之辞。国师看来，这一胎是男是女？那些古人的吉梦，究竟藏着多少心愿？”';
  else if(['活泼','爽直','将门'].includes(c.trait))line='“国师快说，是皇子还是公主？臣妾连小木马和小纸鸢都想好了，可别只笑着不答呀。”';
  else if(['城府','持重'].includes(c.trait))line='“臣妾想问这一胎男女，只愿在这里听一句。还未落地的事，不必先传成六宫的口舌。”';
  else line='“国师可看得出，是个男孩还是女孩？臣妾并非要挑，只是想起将来抱着孩子的样子，心里便静不下来。”';
  let family='';
  if(!anxious&&living.length){const k=living[0];family=`她又想起${k.name}：${kidAge(k)<3?'“家里那个还小，以后会不会轻轻摸新来的弟弟妹妹呢？”':'“'+k.name+'已经问过，要添弟弟还是妹妹了。”'}`;}
  else if(!anxious&&!children.length)family='头一回等着做母亲，她把问题在心里转了几遍，才真正问出口。';
  return line+(family?'\n'+family:'');
}
function pregnancyPrayerVisitors(){
  return harem().filter(c=>pregnancyPrayerEligible(c)&&!pregnancyPrayerHome(c)&&!currentPregnancyPrayer(c)&&c.t2!=='信佛'&&c.like!=='佛经'&&
    mulberry32((c.seed||c.id)^Math.imul(S.turn+1,3571))()<.22).slice(0,1);
}
function pregnancyPrayerMemory(c,text,location){
  story(c,text);NPCMemory.record(S,{type:'pregnancy-prayer',time:S.turn,location,participants:[c.id],object:text},[
    {person:c.id,subject:'emperor',interpretation:text,emotion:.5,impact:60}]);
}
function pregnancyPrayerEvent(c){
  if(!pregnancyPrayerEligible(c))return null;
  const prior=currentPregnancyPrayer(c);
  if(prior)return {title:'重读孕中祈愿',por:c,text:`${prior.date}，${prior.master}国师为这一胎留下「${PREGNANCY_LOTS.find(l=>l.id===prior.lot)?.name||'平安'}」。\n${prior.wish||''}\n${prior.reading||''}\n${prior.text}`,choices:[{t:'收好祈愿笺'}]};
  const key=pregnancyPrayerKey(c),lot=pregnancyPrayerLot(c),home=pregnancyPrayerHome(c),master=daoMaster();
  const valid=()=>pregnancyPrayerEligible(c)&&pregnancyPrayerKey(c)===key&&!currentPregnancyPrayer(c);
  const settle=kind=>{
    if(!valid()||kind==='lamp'&&E().treasury<5||!useE())return null;
    if(kind==='lamp')chg({treasury:-5});
    const words=kind==='peace'?'你答她：“男孩女孩，朕都盼着见。先顾好你自己，不必拿这一胎向谁交代。”':kind==='lamp'?'你命在殿外留一盏平安灯，将她的名字和心愿写在笺上，供物从简。':'你陪她听完解签，又问她将来最想带孩子做什么。';
    const response=kind==='peace'?'她攥着衣袖的手慢慢松了，问男女的急切，也终于肯换成一句自己的心事。':kind==='lamp'?'她认真看着自己的名字，轻声说，原来这盏灯也为她而留。':'她说了几件极小的事：听雨、认花，还有亲手做一只不会扎手的玩具。';
    const text=`${fullName(c)}孕${c.preg}月，${home?'在本宫收到国师送来的祈愿笺':'到钦安殿问国师这一胎男女'}，得「${lot.name}」。${words}${response}`;
    c.pregnancyPrayer={key,lot:lot.id,choice:kind,month:c.preg,turn:S.turn,date:dateStr(),master:master.name,text,wish:pregnancyPrayerWish(c),reading:lot.line,answered:false};
    cchg(c,{mood:6,aff:4});pregnancyPrayerMemory(c,text,home?c.palace:'钦安殿');log(text);save('auto');
    return `${words}\n${response}\n她把「${lot.name}」收进匣里，等来日再看。`;
  };
  const place=home?`${fullName(c)}${c.preg>=8?'孕期已晚':'身子需要休养'}，不便再往殿中奔走。${master.name}国师将祈愿笺送到${c.palace}廊下，你也陪她坐了一会儿。`:
    `${fullName(c)}由宫人陪着来到钦安殿，在廊下软垫上坐定。松风掠过帘角，她望着${master.name}国师，终于问起惦念多日的话。`;
  return {title:home?'孕中祈愿 · 一笺入宫':'钦安殿 · 问男问女',cast:[master,c],present:[c],valid,
    text:`${place}\n${pregnancyPrayerWish(c)}\n${master.name}将「${lot.name}」展开：“${lot.line}”`,choices:[
      {t:'陪她解签，再听她的心愿 · 精力−1',cond:()=>E().energy>0,f:()=>settle('listen')},
      {t:'男孩女孩都好，先顾好她 · 精力−1',cond:()=>E().energy>0,f:()=>settle('peace')},
      {t:'为她留平安灯 · 国库−5 · 精力−1',cond:()=>E().energy>0&&E().treasury>=5,f:()=>settle('lamp')},
      {t:'今日先歇着，改日再说'}]};
}
function pregnancyPrayerMonthlyEvent(){
  if(S.turn-(S.flags.lastPregnancyPrayerScene??-99)<6)return null;
  const c=pregnancyPrayerVisitors()[0];if(!c||!chance(.35))return null;
  const ev=pregnancyPrayerEvent(c);ev.onQueue=()=>{S.flags.lastPregnancyPrayerScene=S.turn;};return ev;
}
function pregnancyPrayerPanel(c){
  if(!pregnancyPrayerEligible(c))return '';
  const p=currentPregnancyPrayer(c),label=p?'重读孕中祈愿':pregnancyPrayerHome(c)?'请国师送祈愿笺':'同赴钦安殿问男女';
  return `<p class="hint">${p?'这一胎的祈愿已收进匣里，可随时重读。':pregnancyPrayerHome(c)?'留在本宫休养，也可请国师送来祈愿。':'松风入殿，她或许有想问国师的话。'}</p><button class="btn jade" onclick="A.pregnancyPrayer(${c.id})">${label}<small>${p?'重读不耗精力':'精力−1 · 可另留平安灯'}</small></button>`;
}
function pregnancyPrayerHall(){
  const women=harem().filter(pregnancyPrayerEligible),here=pregnancyPrayerVisitors();
  return women.length?`<h3>孕中祈愿</h3><div class="grid">${women.map(c=>`<section class="card portrait-card">${porImg(c,92)}<div class="grow"><button class="person-link" onclick="A.go('consort',${c.id})">${esc(fullName(c))} · ${esc(cName(c))}</button><p>有孕${c.preg}月${here.includes(c)?' · 此刻在殿廊候见':''}</p>${pregnancyPrayerPanel(c)}</div></section>`).join('')}</div>`:'';
}
function pregnancyPrayerBirthEcho(c,children){
  const p=c.pregnancyPrayer;if(!p||p.answered||c.delivery?.prayerKey!==p.key)return '';
  p.answered=true;p.children=children.map(k=>k.id);
  if(!c.alive||children.some(k=>!k.alive||k.birthSwap?.occurred)||c.delivery.concealedLoss)return '';
  const lot=PREGNANCY_LOTS.find(l=>l.id===p.lot),names=children.map(k=>k.name).join('、');
  const answer=children.length>1?'如今几声啼哭此起彼伏，一张签笺装不下每个孩子的来处。':!lot?.hint?'当日签里没有定下男女，如今总算见到了孩子。':lot.hint===children[0].sex?'当日签意恰与报喜相合，她笑说，倒像是先得了一封孩子的来信。':'当日签意与眼前的孩子不同，她仍将旧笺收好：“原来你不按签上的路来，倒更叫人记得。”';
  const text=`${fullName(c)}抱着${names}，又想起孕中「${lot?.name||'平安'}」的旧笺。${answer}`;
  pregnancyPrayerMemory(c,text,c.palace);log(text);return '\n'+text;
}
A.pregnancyPrayer=function(id){if(!modalOpen)pushEv(pregnancyPrayerEvent(byId(id)));};
