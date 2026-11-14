/* A suspected switch has a saved factual outcome; investigation never rerolls it. */
function planBirthSwap(mother,plotter,guarded){
  if(!inPalace(mother)||!inPalace(plotter)||mother.preg<8||mother.swapAsked)return null;
  mother.swapAsked=true;mother.prot=guarded;mother.swapRisk=!guarded;
  mother.swapPlot={turn:S.turn,plotter:plotter.id,guarded,settled:false};save('auto');
  return guarded?'稳婆已换为心腹，产房出入皆记名，八名侍卫守在门外。':'你未采信宫女的话。产房照旧安排，这场疑云是否有实情，要待日后查证。';
}
function settleBirthSwap(c,k){
  const plot=c.swapPlot;if(!plot||plot.settled)return false;
  plot.settled=true;
  const occurred=!plot.guarded&&inPalace(byId(plot.plotter))&&chance(.35);
  k.birthSwap={occurred,plotter:plot.plotter,claimedMother:c.id,claimedMotherName:fullName(c),turn:S.turn,
    guarded:plot.guarded,clueDue:S.turn+ri(2,5),clueShown:false,confirmed:false};
  if(occurred){
    const s=k.birthSwap;
    s.original=JSON.parse(JSON.stringify({...k,birthSwap:undefined}));
    s.externalMother={id:'outside-mother-'+k.id,name:pick(SUR)+'氏',talent:ri(25,75),virtue:ri(30,80),scheme:ri(15,55)};
    s.externalFather={kind:'outsider',name:pick(SUR)+pick(['明','怀','仲','修','景'])+pick(BOYC),wen:ri(25,75),wu:ri(20,65)};
    s.originalSafe=chance(.85);
    k.lit=clamp(s.externalMother.talent*.6+s.externalFather.wen*.25);k.mar=clamp(s.externalFather.wu*.3+ri(0,15));
    k.vir=clamp(s.externalMother.virtue*.7+ri(0,12));k.amb=clamp(s.externalMother.scheme*.65+ri(0,18));
    // The public register remains a claim until the inquiry. No secret parent is leaked by the UI.
    s.externalTraits={mother:s.externalMother,father:s.externalFather,initial:{lit:k.lit,mar:k.mar,vir:k.vir,hp:k.hp,amb:k.amb}};
    delete k.parentage;
  }
  return true;
}
function birthSwapClueEvent(){
  const k=S.children.find(k=>k.alive&&!k.pendingName&&k.birthSwap&&!k.birthSwap.clueShown&&S.turn>=k.birthSwap.clueDue);
  if(!k)return null;const s=k.birthSwap,m=byId(s.claimedMother);let queued=false;
  return {title:'襁褓上的旧结',cast:[m,k],valid:()=>k.alive&&(!s.clueShown||queued),
    onQueue:()=>{queued=true;s.clueShown=true;k.parentage={status:'suspected',father:{kind:'birth-swap'},claimedFather:E().sur+E().name,clue:{kind:'birth-swap',text:'乳母整理旧物，发现产房出入簿的一页有涂改。有人提起那夜送进来的包裹，证词互有出入，尚不能断言曾经换婴。'}};save('auto');},
    text:`${k.name}的乳母翻出出生那夜的旧包被，结扣与当值宫人记得的不同。产房簿页也有涂改。\n${m?fullName(m)+'听后怔住了。':''}这些细节可能是照护时留下的，也可能另有内情，不能只凭传言定案。`,choices:[
      {t:'封存旧物，查接生与出入记录 · 精力−1',cond:()=>E().energy>0,f:()=>beginParentageInquiry(k)},
      {t:'问起滴血验亲的旧说',f:()=>{pushNow(bloodRitualEvent(k));return null;}},{t:'先记下线索，暂不声张'}]};
}
function confirmBirthSwap(k){
  const s=k.birthSwap,p=k.parentage;if(s.confirmed)return;
  s.confirmed=true;p.status='confirmed';
  if(!s.occurred)return;
  k.birthTraits=s.externalTraits;k.mom=s.externalMother.id;k.momName=s.externalMother.name;
  // The woman whose child was taken is a victim, not the culprit or biological mother.
  const caregiver=byId(s.claimedMother);
  if(caregiver?.alive&&!caregiver.cold&&!caregiver.gone&&!k.foster){k.foster=caregiver.id;k.fosterT=S.turn;}
  p.father=s.externalFather;
  if(s.originalSafe&&!s.recovered){
    const original=JSON.parse(JSON.stringify(s.original));original.id=S.nid++;original.name=suggestName(original.sex);original.ord=S.children.filter(c=>c.sex===original.sex).length+1;
    original.pendingName=false;original.alive=true;original.recoveredFromSwap=true;original.story||=[];S.children.push(original);s.recovered=original.id;
    kstory(original,`换婴案查明，循乳母证词从宫外照护人家接回，另赐名“${original.name}”。`);
    if(caregiver?.alive){story(caregiver,`换婴案查明，亲生的${original.name}被接回。`);cchg(caregiver,{mood:20});}
  }
  kstory(k,`查明自己被带入产房顶替，生母为${s.externalMother.name}，生父为${s.externalFather.name}，二人均为宫外平民。`);
  if(caregiver?.alive&&!s.originalSafe){story(caregiver,'换婴案查明，亲生孩子仍然下落不明，已命人继续寻找。');setXin(caregiver,'悲恸','亲生孩子下落不明');}
  save('auto');
}
function birthSwapVerdictEvent(k){
  const s=k.birthSwap,p=k.parentage;if(!s||!parentageReady(k)||!['investigating','confirmed'].includes(p.status)||S.turn<(p.due||0))return null;
  const m=byId(s.claimedMother),a=byId(s.plotter);
  const truth=s.occurred?`接生稳婆与门房供词相互印证，又循包被与出入记录找到了宫外人家。\n${k.name}确被带入产房顶替，生母为${s.externalMother.name}，生父为${s.externalFather.name}，均为宫外平民。${m?fullName(m):s.claimedMotherName}并非生母，也并未参与换婴。\n${s.originalSafe?'原来的亲生孩子已寻到，由随行医官验看照护后接回。':'原来的亲生孩子仍下落不明，追查不会因这次定案而停止。'}\n幕后指使者为${a?fullName(a):'当年的宫中主使'}，其责任与孩子的安置分开处理。`:
    `逐一问询稳婆、乳母与门房后，产房出入记录能够相互印证。${s.guarded?'心腹稳婆接管后，没有陌生人靠近婴儿。':'有人试探过稳婆，却未能将宫外婴儿带入。'}\n${k.name}并未被调换，原来的亲缘记录不变，不能据此责罚母子。`;
  return {title:s.occurred?'换婴案 · 真相':'换婴疑云已释',cast:[m,k],valid:()=>k.alive&&!p.decision,
    onShow:()=>confirmBirthSwap(k),text:truth,choices:s.occurred?[
      {t:'仍留宫抚养，不罪无辜孩子',f:()=>resolveBirthSwap(k,'keep')},
      {t:'护送归还亲生父母，拨给养育银',cond:()=>E().treasury>=20,f:()=>resolveBirthSwap(k,'family')},
      {t:'先送护国寺养护，另议归家',cond:()=>!k.jailed,f:()=>resolveBirthSwap(k,'temple')},
      ...(a?.alive?[{t:'另审主使，孩子暂缓安置',f:()=>{pushNow(punishEv(a,m,'串通稳婆调换皇嗣'));return null;}}]:[]),{t:'留待再议'}]:[
      {t:'安抚母子，澄清流言',f:()=>{if(p.decision)return null;p.status='resolved';p.decision='cleared';p.result='查证未发生换婴，原有亲缘不变。';kstory(k,p.result);if(m?.alive)cchg(m,{mood:8,aff:4});save('auto');return p.result;}}]};
}
function resolveBirthSwap(k,decision){
  const s=k?.birthSwap,p=k?.parentage;if(!s?.occurred||!s.confirmed||p?.status!=='confirmed'||p.decision||!k.alive||!['keep','family','temple'].includes(decision))return null;
  if(decision==='family'&&E().treasury<20||decision==='temple'&&k.jailed)return null;
  let line;
  if(decision==='keep'){line=`${k.name}仍留宫抚养，谱牒注明收养与真实生父母，不再冒作亲生。`;k.adoptedRoyal=true;}
  if(decision==='family'){chg({treasury:-20});removeImperialStatus(k);k.away=true;delete k.templeStay;line=`${k.name}由专人护送归还亲生父母，拨给养育银20万两。`;}
  if(decision==='temple'){if(!k.templeStay&&!sendChildToTemple(k,{months:null,reason:'parentage'}))return null;removeImperialStatus(k);k.templeStay.reason='parentage';k.templeStay.due=null;line=`${k.name}暂在护国寺客舍养护，乳母随行，亲生父母与宫中照护人均可获知平安。`;}
  p.status='resolved';p.decision=decision;p.result=line;childSeparationMemory(k,line,.5);log(line,1);save('auto');return line;
}
function recoveredSwapEvent(){
  const k=S.children.find(k=>k.birthSwap?.confirmed&&k.birthSwap.occurred&&!k.birthSwap.originalSafe&&!k.birthSwap.recovered&&S.turn-k.birthSwap.turn>=12);
  if(!k||!chance(.08))return null;const s=k.birthSwap,m=byId(s.claimedMother);
  return {title:'海内寻亲',cast:[m],text:'地方官循乳母的亲眷访得一户人家，旧物、送养文契与当年证词相合，找到了换婴案中失散的亲生孩子。',valid:()=>!s.recovered,choices:[{t:'接回宫中，安排照护',f:()=>{if(s.recovered)return null;const original=JSON.parse(JSON.stringify(s.original));original.id=S.nid++;original.name=suggestName(original.sex);original.ord=S.children.filter(c=>c.sex===original.sex).length+1;original.pendingName=false;original.alive=true;original.recoveredFromSwap=true;S.children.push(original);s.recovered=original.id;kstory(original,'换婴后流落宫外，循文契与证词寻回。');if(m?.alive){cchg(m,{mood:25});story(m,`失散的${original.name}被寻回。`);}save('auto');return `${original.name}已接回宫中，亲缘与纪事一并补入。`;}}]};
}
function outsideBirthFamilyPanel(){
  const children=S.children.filter(k=>k.birthSwap?.occurred&&k.birthSwap.confirmed);
  if(!children.length)return '';
  return `<section class="family-branch"><h3>宫外亲缘与收养</h3>${children.map(k=>`<article class="card portrait-card"><button class="child-portrait" onclick="A.go('kid',${k.id})">${porImg(k,72)}</button><div class="grow"><button class="person-link" onclick="A.go('kid',${k.id})">${esc(kidName(k))}</button><p>生母 ${esc(k.momName)} · 生父 ${childFatherHTML(k)}</p>${fosterOf(k)?`<p>宫中养母 ${parentLink(k.foster)}</p>`:''}<p class="hint">${esc(k.parentage?.result||'身世已查明，安置待议。')}</p></div></article>`).join('')}</section>`;
}
