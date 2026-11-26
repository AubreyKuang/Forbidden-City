const imperialFertilityActive=()=>journalContentVersion()>=64;
const imperialFertilityFollowupsActive=()=>journalContentVersion()>=66;
const IMPERIAL_PHYSICIAN_SUCCESS='医者复诊后发现还有一点转机。往后或可有孕，太医院会继续观察。';
function imperialFertilityProfile(){
  if(!imperialFertilityActive())return 'usual';
  if(E().fertilityReview)return E().fertilityReview.profile;
  if(S.children.some(k=>!k.palaceAdoption)||S.consorts.some(c=>c.preg&&c.pregnancyFather?.kind!=='prince'))return 'usual';
  const roll=mulberry32((E().seed||7)^0x3eb82ac9)();
  return roll<.01?'none':roll<.07?'low':'usual';
}
function imperialFertilityMultiplier(){
  const profile=imperialFertilityProfile();
  return profile==='none'?0:profile==='low'?.14:profile==='improved'?.55:1;
}
function noteImperialFertilityAttempt(base,success){
  if(!imperialFertilityActive()||base<=0)return;
  const profile=imperialFertilityProfile();if(profile==='usual')return;
  const s=E().fertilityReview||={profile,months:0,last:-99};
  if(success){s.months=0;s.last=-99;s.conceived=S.turn;return;}
  if(s.last===S.turn)return;
  s.months=s.last===S.turn-1?s.months+1:1;s.last=S.turn;
}
function imperialFertilityEvent(){
  if(!imperialFertilityActive())return null;
  const s=E().fertilityReview;if(!s)return null;
  if(s.searchDue!=null&&S.turn>=s.searchDue){
    const improved=chance(s.profile==='none'?.01:.03);
    const text=improved?IMPERIAL_PHYSICIAN_SUCCESS:'访来的医者会同太医院复诊，眼下仍无可用的办法。';
    delete s.searchDue;s.searched=true;s.outcome=text;
    if(improved)s.profile=s.profile==='none'?'low':'improved';
    if(improved&&imperialFertilityFollowupsActive())s.improvedAt=S.turn;
    log(`【寻医回奏】${text}`,1);
    return {title:'太医院 · 寻医回奏',text,choices:[{t:'记下回奏'}]};
  }
  if(s.diagnosed||s.months<12||S.turn-s.last>1||S.children.some(k=>!k.palaceAdoption)||S.consorts.some(c=>c.preg&&c.pregnancyFather?.kind!=='prince'))return null;
  const conclusion=s.profile==='none'?'院使携诸太医会看旧案，合议陛下眼下无法使人有孕。':'院使携诸太医会看旧案，合议陛下使人有孕的机会很低。';
  s.diagnosed=S.turn;log(`【太医院会诊】${conclusion}`,1);
  return {title:'太医院合议 · 一年未有孕讯',text:`敬事房核过一年里的侍寝记档，十二个月均有可育时日的临幸，宫中一直未有孕讯。${conclusion}\n若仍想再问，可从御书房请遣人寻访医者。宗亲入继也有原来的礼例。`,choices:[{t:'记下会诊结论'}]};
}
A.seekImperialPhysician=function(){
  const s=E().fertilityReview;
  const valid=()=>imperialFertilityActive()&&!S.over&&s?.diagnosed!=null&&!s.searched&&s.searchDue==null&&E().treasury>=15;
  if(modalOpen||!valid())return;
  pushEv({title:'太医院 · 寻访医者',valid,text:'太医院愿另访有经验的医者一同复看，约两个月能回奏。',choices:[
    {t:'拨十五万两，请再寻访 · 国库−15',f:()=>{if(!valid())return null;chg({treasury:-15});s.searchDue=S.turn+2;log('【寻医】太医院奉命再访医者。');return '已交太医院，约两个月后回奏。';}},{t:'先放一放'}]});
};
function registerImperialCollateralWard(){
  if(availableRoyalWards().some(r=>r.child.sex==='m'))return;
  const father={id:S.nid++,sex:'m',name:'承远',alive:true,seed:2231,born:S.turn-35*12,title:'宗室旁支',royalRegisterBranch:true,story:[]};
  const mother={id:S.nid++,name:'陆氏',alive:true,story:[]};father.spouse=mother;
  const given=['景和','景修','允章','明谦'].find(n=>!S.children.some(k=>k.name===n))||`景${cnNum(S.gen)}`;
  father.household={children:[{id:`grand-collateral-${father.id}`,name:E().sur+given,given,sex:'m',born:S.turn-5*12,alive:true,seed:3197,
    mother:mother.id,motherName:mother.name,father:father.id,lit:35,mar:25,vir:48,hp:85,amb:32,story:[]}],concubines:[]};
  (S.royalRelatives||=[]).push(father);
}
A.imperialFertilityKin=function(){
  const s=E().fertilityReview;
  const valid=()=>imperialFertilityActive()&&!S.over&&s?.diagnosed!=null&&!s.kinFound&&palaceNeedsSon();
  if(modalOpen||!valid())return;
  const commander=jinyiweiCommanderReady()?jinyiwei().commander:null;
  const text=commander?`${commander.name}回禀，缇骑没有治病的途径，但可与宗人府核查旁支名册，问明有无合适的孩子。`:'宗人府得知太医院会诊结果，愿调旁支名册核查合适人选。';
  pushEv({title:commander?'锦衣卫 · 宗亲名册':'宗人府 · 核对旁支名册',por:commander||undefined,valid,text,choices:[{t:'核对名册，去皇亲列表查看',f:()=>{
    if(!valid())return null;
    registerImperialCollateralWard();s.kinFound=true;
    if(commander)princePersonNote(commander,'【宗亲名册】奉旨同宗人府核对旁支的亲缘及家册，供陛下议请入继。');
    log('宗人府核对旁支名册，议请入继的人选可在御书房查阅。');A.go('home');return '宗亲名册已送到御书房「皇亲列表」。';
  }},{t:'先收好回禀'}]});
};
function imperialConsultingPhysician(review){
  const variant=(E().seed>>>0)%3;
  return review.physician||={id:`consulting-physician-${S.gen}`,name:['顾怀仁','陆守安','周慎微'][variant],
    temperament:['宽和','务实','谨慎'][variant],story:[]};
}
function imperialWardAfterConsultation(ward,review){
  const doctor=imperialConsultingPhysician(review),q=empress();
  const title='太医院回访 · 宗亲入继',name=ward.name;
  const physicianLine=doctor.temperament==='宽和'?`他请乳母留一件${name}从生家带来的旧物在枕边，好让孩子慢慢安顿。`:
    doctor.temperament==='务实'?`他向生家问清${name}平日的饮食和旧病，同乳母逐项商量。`:
    `他给${name}把过脉，交代随侍先照原来的时辰起居，等孩子住惯了再改。`;
  const queenLine=q?.id===ward.foster?`她亲自问${name}夜里怕不怕，叫乳母把他从家里带来的东西好好摆着。`:
    `她请照料${name}的人来回话，问他近来吃得好不好，有没有同龄的孩子作伴。`;
  const wardLine=kidAge(ward)<5?'乳母把从家里带来的包袱放在床头，他摸着熟悉的布角才肯睡。':
    ['审慎','内敛','好胜'].includes(childDisposition(ward))?'他先把宫里的规矩问清，等旁人退下才问，往后还能不能给生家报平安。':'他跟着随侍认过了路，转身就问能不能写一封家书，说自己已经安顿下来了。';
  const entry=`【会诊后续·入继】${name}奉旨入继，太医院入宫看望。`;
  review.adoptionFollowup=ward.id;
  princePersonNote(doctor,entry+physicianLine);princePersonNote(q,entry+queenLine);princePersonNote(ward,entry+wardLine);log(entry,1);
  pushEv({title,por:ward,cast:q?[ward,q]:[ward],text:[`院使${doctor.name}记下${name}入宫后的近况。${physicianLine}`,q&&`皇后得了回报。${queenLine}`,wardLine].filter(Boolean).join('\n'),
    choices:[{t:'让孩子按熟悉的规矩慢慢安顿'}]});
}
function imperialBirthAfterTreatment(children,ward,review){
  const doctor=imperialConsultingPhysician(review),q=empress(),mother=byId(children[0].mom);
  const names=children.map(k=>k.name).join('、'),oneWord=children.length===1?'孩子':'几个孩子';
  const entry=`【寻医后续·诞育】寻医复诊有了转机，${names}平安降生并取名入册。`;
  const physicianLine=mother&&!mother.alive?`在诊案里如实记下产妇身故的经过，另外交代乳母如何照看${oneWord}。`:
    doctor.temperament==='宽和'?`见${oneWord}喝上了乳，才稍稍放下心来。`:
    doctor.temperament==='务实'?`在旧案后添了诞生簿的日期，留下产妇休养和${oneWord}喂养的嘱咐。`:
    '只照实记下这次母婴的情形，嘱咐太医院继续照看产妇和新生儿。';
  const queenLine=mother&&!mother.alive?`她为产妇惋惜，问乳母${oneWord}如今由谁照料。`:
    q===mother?`她歇过一阵，才让乳母把${oneWord}抱到榻边看。${ward&&q?.id===ward.foster?`她也叫人给${ward.name}留了平日来用膳的座位。`:''}`:
    ward&&q?.id===ward.foster?`她先遣人去贺产妇平安，又特意同${ward.name}说，想去看看襁褓里的孩子就来找她。`:
    '她叫乳母回报产妇和孩子的近况，交代来贺的人等产妇歇够了再去。';
  const sibling=children.length>1?'弟妹':children[0].sex==='m'?'弟弟':'妹妹';
  const wardLine=!ward?'':kidAge(ward)<5?`他踮脚看了一眼${sibling}，把自己的小木鸟留给了乳母。`:
    S.heir===ward.id?`他从东宫送来一枚小长命锁，请太傅替他问一声${sibling}可好。`:
    ['审慎','内敛','好胜'].includes(childDisposition(ward))?`他怕报喜的人顾不上自己，在廊下等了一会儿，还是问可否进去看看${sibling}。`:
    `他把自己最喜欢的一幅小画托人送去，盼${sibling}长大些就能看。`;
  review.birthFollowup=children[0].id;
  princePersonNote(doctor,entry+physicianLine);princePersonNote(q,entry+queenLine);
  if(mother?.alive&&mother!==q)princePersonNote(mother,entry+'听完复诊后的报喜，她请乳母把孩子抱近一点，仔细看了许久。');
  if(ward)princePersonNote(ward,entry+wardLine);
  for(const child of children)princePersonNote(child,'【寻医后续·诞育】取名入册后，太医院来探看，嘱咐乳母留意饮食和冷暖。');
  log(entry,1);
  pushEv({title:'太医院回访 · 新嗣入册',por:children[0],cast:[...children,...[q,ward].filter(Boolean)],
    text:[entry,`院使${doctor.name}${physicianLine}`,q&&`皇后得了消息。${queenLine}`,ward&&`${ward.name}也听到了喜讯。${wardLine}`].filter(Boolean).join('\n'),
    choices:[{t:mother?.alive?'请太医院照料产妇和孩子':'请太医院照料孩子'}]});
}
function imperialFertilityFollowups(){
  if(!imperialFertilityFollowupsActive()||S.over)return;
  const review=E().fertilityReview;if(review?.diagnosed==null)return;
  const wards=S.children.filter(k=>eligiblePalaceSon(k)&&k.palaceAdoption).sort((a,b)=>a.palaceAdoption.at-b.palaceAdoption.at);
  const admitted=wards.find(k=>k.palaceAdoption.at>=review.diagnosed);
  if(admitted&&review.adoptionFollowup==null)imperialWardAfterConsultation(admitted,review);
  if(review.birthFollowup!=null||review.outcome!==IMPERIAL_PHYSICIAN_SUCCESS)return;
  const eligible=S.children.filter(k=>{
    const father=k.birthTraits?.father,delivery=byId(k.mom)?.delivery;
    return k.alive&&!k.pendingName&&!k.lost&&!k.removedFromRoyal&&!k.palaceAdoption&&!k.outsideFamilyOrigin&&!k.birthSwap?.occurred&&
      father?.kind==='emperor'&&father.gen===S.gen&&father.conceived>=(review.improvedAt??review.diagnosed)&&
      (!delivery||delivery.settled||!delivery.children?.includes(k.id));
  }).sort(royalBirthOrder);
  const first=eligible[0];if(!first)return;
  const children=first.birthGroup==null?[first]:eligible.filter(k=>k.birthGroup===first.birthGroup);
  const ward=wards.find(k=>k.id===S.heir&&k.palaceAdoption.at<=first.born)||wards.find(k=>k.palaceAdoption.at<=first.born);
  imperialBirthAfterTreatment(children,ward,review);
}
function imperialFertilityPanel(){
  if(!imperialFertilityActive())return '';
  const s=E().fertilityReview;if(s?.diagnosed==null)return '';
  const status=s.searchDue!=null?`等候寻医回奏 · 约 ${Math.max(0,s.searchDue-S.turn)} 个月`:(s.outcome||'太医院合议已经记入起居注。');
  return detailSection('太医院会诊',`<p>${esc(status)}</p><div class="acts">${s.searched||s.searchDue!=null?'':
    `<button class="btn" data-onclick="A.seekImperialPhysician()" ${E().treasury<15?'disabled':''}>再请太医院寻访医者</button>`}${!s.kinFound&&palaceNeedsSon()?
    `<button class="btn jade" data-onclick="A.imperialFertilityKin()">${jinyiweiCommanderReady()?'请锦衣卫核对宗亲名册':'请宗人府核对名册'}</button>`:''}</div>`)+
    (imperialFertilityFollowupsActive()&&s.physician?.story.length?detailFold(`院使${esc(s.physician.name)}的纪事`,detailStory(s.physician)):'');
}
