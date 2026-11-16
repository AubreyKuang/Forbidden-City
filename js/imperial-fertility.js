const imperialFertilityActive=()=>journalContentVersion()>=64;
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
    const text=improved?'医者复诊后发现还有一点转机。往后或可有孕，太医院会继续观察。':'访来的医者会同太医院复诊，眼下仍无可用的办法。';
    delete s.searchDue;s.searched=true;s.outcome=text;
    if(improved)s.profile=s.profile==='none'?'low':'improved';
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
function imperialFertilityPanel(){
  if(!imperialFertilityActive())return '';
  const s=E().fertilityReview;if(s?.diagnosed==null)return '';
  const status=s.searchDue!=null?`等候寻医回奏 · 约 ${Math.max(0,s.searchDue-S.turn)} 个月`:(s.outcome||'太医院合议已经记入起居注。');
  return detailSection('太医院会诊',`<p>${esc(status)}</p><div class="acts">${s.searched||s.searchDue!=null?'':
    `<button class="btn" onclick="A.seekImperialPhysician()" ${E().treasury<15?'disabled':''}>再请太医院寻访医者</button>`}${!s.kinFound&&palaceNeedsSon()?
    `<button class="btn jade" onclick="A.imperialFertilityKin()">${jinyiweiCommanderReady()?'请锦衣卫核对宗亲名册':'请宗人府核对名册'}</button>`:''}</div>`);
}
