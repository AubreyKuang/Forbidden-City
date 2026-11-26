/* Health is real, persisted state. Initial constitution never consumes the story RNG. */
function consortHealthBase(c){
 const r=mulberry32(((c.seed||c.id||1)^0x683129af)>>>0)();
 return c.trait==='体弱'?38+Math.floor(r*19):70+Math.floor(r*26);
}
function ensureConsortHealth(c){
 if(!consortTraitsActive()||!c||c.sex||PalaceActions.blocked)return;
 if(!Number.isFinite(c.hp))c.hp=consortHealthBase(c);
 c.healthProfile||={usual:Math.max(1,c.hp),lastTick:S.turn,hits:{}};
}
function consortHealthHurt(c,kind,turn=S.turn){
 if(!consortTraitsActive()||!c?.alive)return;
 ensureConsortHealth(c);if(!c.healthProfile)return;
 const h=c.healthProfile;if(h.hits[kind]===turn)return;h.hits[kind]=turn;
 const loss=kind==='ill'?18:kind==='birth'?20:24;
 c.hp=Math.max(1,c.hp-loss);h.lastTick=Math.max(h.lastTick,S.turn,turn);
}
function consortHealthTreat(c,{immediate=8}={}){
 if(!consortTraitsActive()||!c?.alive)return;
 ensureConsortHealth(c);const h=c.healthProfile;if(!h)return;
 h.usual=Math.max(h.usual,60);h.careUntil=S.turn+3;c.hp=Math.max(c.hp,Math.min(h.usual,c.hp+immediate));
}
function consortHealthTick(){
 if(!consortTraitsActive())return;
 for(const c of S.consorts){
  if(!c.alive)continue;ensureConsortHealth(c);const h=c.healthProfile;
  if(!h||h.lastTick>=S.turn)continue;
  const elapsed=Math.min(12,S.turn-h.lastTick),ill=c.illnessRecovery?.until>S.turn;
  h.lastTick=S.turn;
  if(c.hp<h.usual)c.hp=Math.min(h.usual,c.hp+elapsed*(h.careUntil>=S.turn?8:ill?3:6));
 }
}
function consortHealthNeedsCare(c){return !!c?.alive&&!c.gone&&!c.cold&&(c.hp<60||c.hp<(c.healthProfile?.usual??c.hp)-5||consortRecovery(c)||c.illnessRecovery?.until>S.turn);}
function consortHealthPanel(c){
 if(!consortTraitsActive()||!Number.isFinite(c.hp)||!c.alive)return '';
 const cooldown=Math.max(0,3-(S.turn-(c.healthProfile?.lastCare??-99))),need=consortHealthNeedsCare(c);
 return `<section class="detail-section consort-health"><h3>身体与调养</h3><p>健康 <strong>${rd(c.hp)}</strong> / 100${c.hp<50?' · 身子虚弱，宜静养':c.hp<65?' · 仍需留意调养':''}</p>${consortRecovery(c)?'<p class="hint">近日需静养，医官仍按原定期限安排照料。</p>':''}${need?`<button class="btn sm" data-onclick="A.consortHealthCare(${c.id})" ${cooldown||E().treasury<10?'disabled':''}>请太医调养<small>${cooldown?`还需${cooldown}个月`:'国库−10万两'}</small></button>`:''}</section>`;
}
A.consortHealthCare=function(id){
 const c=byId(id);if(modalOpen||!consortTraitsActive()||!consortHealthNeedsCare(c))return;
 ensureConsortHealth(c);
 const valid=()=>consortHealthNeedsCare(c)&&S.turn-(c.healthProfile.lastCare??-99)>=3&&E().treasury>=10;
 if(!valid())return;
 pushEv({title:'太医调养',por:c,valid,text:`太医将为${fullName(c)}复诊，调整饮食与休息。\n当前健康${rd(c.hp)}；本次诊养需国库10万两，随后三个月继续照料。`,choices:[
  {t:'安排诊养 · 国库−10万两',f:()=>{if(!valid())return null;const before=c.hp;c.healthProfile.lastCare=S.turn;chg({treasury:-10});consortHealthTreat(c);cchg(c,{mood:3});story(c,'【太医调养】陛下安排复诊，调整饮食与作息，随后三个月继续照料。');return `太医已拟好调养方，宫人照嘱安排起居。健康${rd(before)} → ${rd(c.hp)}。${consortRecovery(c)?'原定静养期限仍须遵守。':''}`;}},
  {t:'稍后安排'}
 ]});
};

function consortPassingReason(c){
 if(c.deathReason)return c.deathReason;
 if(c.arc?.id==='ill'&&['香消','烟雨'].includes(c.arc.end))return '心疾不治';
 if(c.story?.some(e=>e.t.includes('病势沉重，无人问津')))return '病势沉重，不治身故';
 if(c.story?.some(e=>e.t.includes('被以“知情不报”赐死')))return '因宫变牵连被赐死';
 return '';
}
function recordConsortPassing(c){
 c.passingDate=dateStr();
 const reason=consortPassingReason(c),line=fullName(c)+'，'+c.age+'岁'+(reason?'，'+reason:'，已故')+'。';
 story(c,'【丧讯】'+line);return line;
}
function announceConsortPassings(previous){
 if(journalContentVersion()<81||!previous||previous.gen!==S.gen)return;
 const dead=S.consorts.filter(c=>c.alive===false&&!c.passingDate);
 if(!dead.length)return;
 const living=new Set(previous.consorts?.filter(c=>c.alive).map(c=>c.id));
 for(const c of dead){
  if(!living.has(c.id))continue;
  const line=recordConsortPassing(c);
  if([curEv,...Q].some(ev=>ev?.deathNotice===c.id))continue;
  pushNow({title:(c.maid?'宫人丧讯':'后宫丧讯')+' · '+fullName(c),por:c,sfx:'sad',deathNotice:c.id,
   text:c.passingDate+'，'+line,choices:[{t:'记下讣闻'}]});
 }
}
