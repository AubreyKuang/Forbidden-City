const outerLink=(label,action,disabled=false)=>`<button class="btn sm" ${disabled?'disabled':''} onclick="${action}">${esc(label)}</button>`;
function outerNieceNominationControl(k,m,age){
  if(!nieceSelectionEntryActive()||!outerIntegration()||k.sex!=='f')return '';
  const cancel=!S.cands.some(c=>c.outerHouseholdId===k.id)&&k.familySelection!=='listed'&&(k.familySelection==='pending'||k.path==='候选秀')
    ?`<button class="btn sm" onclick="A.outerCancelNomination(${k.id})">取消登记</button>`:'';
  if(m.relative==null)return cancel||(k.withdrawnAdultSelection&&k.path==='自立门户'&&!outerNieceNominationReason(k)
    ?`<button class="btn sm" onclick="A.outerRestoreNomination(${k.id})">重新登记选秀</button>`:'');
  const reason=outerNieceNominationReason(k);
  if(reason)return `<small class="hint">选秀 · ${esc(reason)}</small>`+cancel;
  const listed=S.cands.some(c=>c.outerHouseholdId===k.id),pending=k.familySelection==='pending'||k.path==='候选秀';
  const label=listed?'已在本届名册':age<15?(pending?'已预登记 · 满十五岁后入册':'预登记选秀 · 满十五岁后入册'):
    pending?'已荐入下届选秀':'荐入下届选秀';
  const canSubmit=!listed&&k.familySelection!=='pending';
  return `<button class="btn sm gold" ${canSubmit?'':'disabled'} onclick="A.outerNominateNiece(${k.id})">${esc(canSubmit&&pending?'改为直接荐入下届选秀':label)}</button>`+cancel;
}
A.outerNominateNiece=function(id){
  if(!S||S.over||modalOpen||!nieceSelectionEntryActive())return;
  const k=outerChild(id);
  if(!outerNieceCanNominate(k)||k.familySelection||S.cands.some(c=>c.id===id))return;
  const early=kidAge(k)<15;
  k.familySelection='pending';
  outerNote(outerMother(k.mother),k,'荐入选秀',early?'预留名帖':'下届入册',
    early?'名帖先收于密匣，等她满十五岁后，随实际开选送去。':'已经登记，实际开选时照现有户籍送名帖入册。');
  render();toast(early?'已预登记，满十五岁后开选时入册':'已登记，下次开选时入册');
};
A.outerCancelNomination=function(id){
  const k=outerChild(id);
  if(!outerWritable(k)||k.sex!=='f'||k.familySelection==='listed'||S.cands.some(c=>c.outerHouseholdId===id)||
    (k.familySelection!=='pending'&&k.path!=='候选秀'))return;
  delete k.familySelection;
  if(k.path==='候选秀'){
    k.path='自立门户';k.pending=k.pending.filter(n=>!['roster','audience'].includes(n));
    if(outerMother(k.mother)?.relative==null)k.withdrawnAdultSelection=true;
  }
  outerNote(outerMother(k.mother),k,'选秀撤帖','取消登记','家里领回了名帖，下次开选时不用再为她送帖。');
  save('auto');render();toast('已取消选秀登记');
};
A.outerRestoreNomination=function(id){
  const k=outerChild(id);
  if(!outerWritable(k)||!k.withdrawnAdultSelection||k.path!=='自立门户'||outerNieceNominationReason(k)||S.cands.some(c=>c.outerHouseholdId===id))return;
  delete k.withdrawnAdultSelection;k.path='候选秀';
  outerNote(outerMother(k.mother),k,'荐入选秀','重新登记','家里重新递了名帖，等下次礼部开选。');
  save('auto');render();toast('已重新登记选秀');
};
function outerWritable(k){return outerActive()&&!S.over&&!modalOpen&&k&&!k.sealed&&k.pedigree!=='认领';}
A.outerPetition=function(id){const k=outerChild(id);if(k&&!modalOpen){const ev=outerPendingEvent(k);if(ev)pushEv(ev);}};
A.outerCare=function(id,task){
  const k=outerChild(id);if(!outerWritable(k)||k.placement==='待安置')return;
  const m=outerMother(k.mother),age=kidAge(k),choices=[];
  let title,text;
  if(task==='visit'){
    if(k.lastVisit===S.turn||mourningActive()||k.placement==='断联'||outerIntegration()&&k.palaceRank||!useE())return;
    k.lastVisit=S.turn;k.visits++;k.trust=clamp(k.trust+8);k.secret=clamp(k.secret-.8);
    if(age>=10&&k.knowledge!=='不知'&&k.knowledge!=='怀疑')k.knowledge=outerKnown(k);
    title='探望 · '+k.alias;text=outerNote(m,k,'探望家中','亲自出宫',age<3?'你坐到摇篮边，孩子攥住你的袖口，睡熟了才松开。':age<10?'你陪孩子走了一趟上学的小路，记住了哪块石阶下雨会打滑。':'你让车马停在巷外，听孩子慢慢讲完这一年的打算。',age>=3?'“下回来的时候，你还认得路吧？”':'');
  }else if(task==='withdraw'){
    if(!k.palaceRank)return;title='另院去留';text='趁宫中尚未传开，你可以先问她愿往何处。';
    for(const path of ['请她出宫归家','为她议一门远亲','问她愿否入寺'])choices.push({t:path,f:()=>{
      if(outerIntegration())outerReleaseResidence(k,'宫牌已交还，她依自己的意思离开内廷。');
      delete k.palaceRank;k.pending=k.pending.filter(key=>key!=='recognizedFace');
      k.path=path==='请她出宫归家'?'出宫归家':path==='问她愿否入寺'&&k.trust<35?'入寺清修':path==='为她议一门远亲'&&k.trust>=55?'自愿远嫁':'自立门户';
      return outerNote(m,k,'留牌后改籍',path,`女史领回宫牌。她在去向栏写了“${k.path}”，把信物连同自己的衣物一并带走。`,'“往后的信，请寄到我自己选的地方。”');}});
  }else if(task==='allowance'){
    if(age>=18||!['外宅','寄养','随母'].includes(k.placement))return;title='核定月用';text='下次结账按新额度供给，银钱不足时账房会降等，并在密匣记下缘由。';
    for(const fee of [0,2,4,6])if(fee!==k.fee)choices.push({t:'月支'+fee+'万两',f:()=>{k.fee=fee;return outerNote(m,k,'核定家用','月支'+fee+'万两','家里重列了开支，把下月能请几日先生也算在里面。');}});
  }else if(task==='school'){
    if(age<6||age>=18||k.schoolAge===age)return;title='今年学什么';text='按孩子的生辰，每年可重新议一次教养。';
    for(const lesson of Object.keys(outerLessons))choices.push({t:lesson,f:()=>{k.pending=k.pending.filter(p=>p!=='school');return outerEducate(k,lesson);}});
  }else if(task==='identity'){
    title='户籍与私记';text='改籍须付抄契钱，旧帖仍会留下痕迹。暗记只在你的密匣里存一笔。';
    for(const label of ['本姓','化名',...(k.foster?['寄养姓']:[])])if(k.register!==label)choices.push(outerCostChoice('改用'+label,8,()=>{
      k.register=label;k.coverSur||=pick(SUR.filter(s=>s!==m.sur&&s!==k.foster&&(!outerIntegration()||s!==E().sur)));k.alias=(label==='本姓'?m.sur:label==='化名'?k.coverSur:k.foster)+k.given;
      const p=k.officialId&&scholarById(k.officialId);if(p){p.name=k.alias;p.sur=k.alias.slice(0,-k.given.length);}
      if(outerIntegration()){
        const c=S.cands.find(x=>x.outerHouseholdId===k.id)||byId(k.id);
        if(c?.outerHouseholdId===k.id)c.sur=k.alias.slice(0,-k.given.length);
      }
      k.clues=(k.clues||0)+1;k.secret=clamp(k.secret-3);return outerNote(m,k,'改籍',label,'新帖用了新姓，旧帖仍留在县衙的底册里。');
    }));
    if(k.pedigree==='未入')choices.push({t:'在密匣暗记一笔',f:()=>{k.pedigree='暗记';return outerNote(m,k,'暗记','留存私牍','御笔写下出生年月，封套上只题了一个小字。');}});
    if(!k.claim&&!k.refused&&outerCanClaim(k))choices.push({t:'请太后、宗人府核验',f:()=>{if(!outerRequestPapers(k))return null;return outerNote(m,k,'请认','呈请核验','家书和证物分作两封，次月候太后问话。');}});
  }else if(task==='witness'){
    title='知情人口供';text='留下的人各有顾虑，口风与忠诚都会影响保密。调走知情人仍会留下调令。';
    for(const [i,w] of k.witnesses.entries())if(w.active)choices.push({t:`${w.role} · ${w.name}`,f:()=>{
      const note=(decision,line)=>outerNote(m,k,'知情人变动',decision,w.name+' '+line);
      const options=[
        outerCostChoice('补给家用',6,()=>{w.loyal=clamp(w.loyal+12);w.discretion=clamp(w.discretion+6);return note('补给家用','收好家信，答应守住当日的话。');}),
        outerCostChoice('提拔或酬谢',14,()=>{w.loyal=clamp(w.loyal+22);return note('酬谢','领了赏，旧日的差遣也有了交割凭据。');})];
      if(i!==0){
        options.push(outerCostChoice('调往外地',12,()=>{w.active=false;k.clues=(k.clues||0)+1;return note('调离','带着调令离京，原衙门却留着一张抄件。');}));
        options.push({t:'下令灭口 · 威望−8',f:()=>{w.active=false;k.clues=(k.clues||0)+3;k.secret=clamp(k.secret-14);chg({prestige:-8});return note('灭口','从此失踪。家属递来寻人状，案头反添了一条线索。');}});
      }
      pushNow({title:w.role+' · '+w.name,text:`忠诚 ${rd(w.loyal)} · 口风 ${rd(w.discretion)}`,choices:[...options,{t:'照旧'}]});return null;
    }});
  }else return;
  pushEv({title,text,choices:[...choices,{t:'合上家书'}]});
};
const outerOutView=viewOut;
viewOut=function(){
  const html=outerOutView();if(!outerActive()||S.over||mourningActive()||E().age<18)return html;
  const b=outerBook(),busy=b?.lastMeet===S.turn||E().energy<1;
  const oldTieReady=S.year>=3&&!b?.mothers.some(m=>m.source==='旧识');
  const south=outerIntegration()&&outerSouthernTour();
  if(south){
    const buttons=[outerLink('访江南渡口 · 精力1',"A.outerMeet('市井','suzhou')",busy)];
    if(oldTieReady)buttons.push(outerLink('重访旧渡 · 精力1',"A.outerMeet('旧识','suzhou')",busy));
    for(const m of b?.mothers||[])if(m.place==='suzhou'&&!m.closed&&outerContactPresent(m))
      buttons.push(outerLink('重访'+m.name+' · 精力1',`A.outerVisit(${m.id})`,m.seen===S.turn||E().energy<1));
    return html+detailSection('城外人家',`<p>御舟在江南 · 尚余${south.returns-S.turn}个月</p>`+buttons.join(' '));
  }
  const buttons=[outerLink('微服访城南茶市 · 精力1',"A.outerMeet('市井','city')",busy)];
  if(outerIntegration()&&S.year>=3)buttons.push(outerLink('启程南巡三月 · 精力1','A.outerSouthTour()',E().energy<1));
  buttons.push(b?.estate?outerLink('出宫到别院访邻 · 精力1',"A.outerMeet('市井','home')",busy):outerLink('置办城外别院',"A.outerEstate()"));
  const trip=S.flags.outerTrip;
  if(trip?.turn===S.turn&&['hunt','temple','altar'].includes(trip.place))buttons.push(outerLink('重走'+outerPlaces[trip.place]+' · 精力1',`A.outerMeet('市井','${trip.place}')`,busy));
  if(!outerIntegration()&&oldTieReady)buttons.push(outerLink('南巡重访旧渡 · 精力1',"A.outerMeet('旧识','suzhou')",busy));
  if(outerFamilyStories()){
    if(!outerIntegration())buttons.push(outerLink('南巡访江南渡口 · 精力1',"A.outerMeet('市井','suzhou')",busy));
    if(oldTieReady){
      buttons.push(outerLink('微服寻访旧识 · 精力1',"A.outerMeet('旧识','city')",busy));
      if(trip?.turn===S.turn&&trip.place==='altar')buttons.push(outerLink('祭天归途寻旧人 · 精力1',"A.outerMeet('旧识','altar')",busy));
    }
    for(const [place,label] of [['gate','宫门外遇探亲人'],['natal','微服访娘家'],['birthday','别院赴寿席']]){
      const rows=outerKinChoices(place).map(({host,p,kin})=>outerLink(fullName(host)+'的'+kin+' · '+p.name+' · 精力1',`A.outerMeet('姊妹','${place}',${host.id},${p.id})`,busy));
      if(rows.length)buttons.push(detailFold(label,rows.join(' ')));
    }
  }else if(outerSibling())buttons.push(outerLink('往外家别院送寿礼 · 精力1',"A.outerMeet('姊妹','home')",busy));
  for(const m of b?.mothers||[])if(!m.closed&&outerTourAllows(m.place)&&outerContactPresent(m))buttons.push(outerLink('重访'+m.name+' · 精力1',`A.outerVisit(${m.id})`,m.seen===S.turn||E().energy<1));
  return html+detailSection('城外人家',buttons.join(' '));
};
function outerCard(b,k,frozen){
  const m=b.mothers.find(m=>m.id===k.mother),age=Math.floor(((b.closedTurn??S.turn)-k.born)/12);
  const c=!frozen&&outerIntegration()&&byId(k.id);
  const lines=[`生母 ${m.name} · 生于${k.birthDate} · ${age}岁 · 真名 ${k.pedigree==='认领'?k.royalName:'＊＊'}`,
    `${k.register} · ${k.pedigree} · ${k.placement} · ${k.path} · ${k.knowledge} · 保密 ${Math.ceil(k.secret)}`,
    `${k.mark} · ${k.token} · ${m.trait}的${m.trade}所出`,Object.entries(outerStats).map(([s,t])=>t+' '+rd(k[s])).join(' · '),
    age<18?`教养 ${k.lesson} · 月支 ${k.fee}万两`:'已成年'];
  if(c?.outerHouseholdId===k.id&&c.alive&&!c.gone)lines.push(`宫中位分 ${RANKS[c.rank]} · ${c.palace}`);
  if(outerFamilyStories()){
    if(k.temper)lines.push(k.temper+' · '+k.likeness);
    if(k.denied)lines.push('御前已决：永不认领，保留原籍。');
    else if(k.refused)lines.push('本人已谢绝归宗，仍用原籍。');
    if(k.lateReply)lines.push('暮年家书 · '+k.lateReply);
  }
  if(k.claim)lines.push('归宗待办 · '+k.claim.step);
  const controls=[];
  if(!frozen){const nomination=outerNieceNominationControl(k,m,age);if(nomination)controls.push(nomination);}
  if(!frozen&&!k.sealed){
    if(k.pending.length)controls.push(outerLink('阅待办家书',`A.outerPetition(${k.id})`));
    if(k.pedigree!=='认领'&&k.placement!=='待安置'){
      if(k.placement!=='断联'&&(!outerIntegration()||!k.palaceRank))controls.push(outerLink('出宫探望 · 精力1',`A.outerCare(${k.id},'visit')`,k.lastVisit===S.turn||E().energy<1||mourningActive()));
      if(k.palaceRank)controls.push(outerLink('商量去留',`A.outerCare(${k.id},'withdraw')`));
      if(c?.outerHouseholdId===k.id&&c.alive&&!c.gone)controls.push(outerLink('查阅后宫档案',`A.go('consort',${c.id})`));
      if(age<18&&['外宅','寄养','随母'].includes(k.placement))controls.push(outerLink('调整月用',`A.outerCare(${k.id},'allowance')`));
      if(age>=6&&age<18)controls.push(outerLink('定今年教养',`A.outerCare(${k.id},'school')`,k.schoolAge===age));
      controls.push(outerLink('户籍与认领',`A.outerCare(${k.id},'identity')`),outerLink('处置知情人',`A.outerCare(${k.id},'witness')`));
    }
    if(k.officialId&&scholarById(k.officialId))controls.push(outerLink('查阅朝臣履历',`A.go('scholar','${k.officialId}')`));
    if(k.pedigree==='认领'&&kidById(k.id))controls.push(outerLink('查阅皇嗣档案',`A.go('kid',${k.id})`));
  }
  const witnesses=k.witnesses.map(w=>`<li>${esc(w.role+' '+w.name)} · 忠诚 ${rd(w.loyal)} · 口风 ${rd(w.discretion)}${w.active?'':' · 已离开'}</li>`).join('');
  return detailSection(esc(k.alias),`${porImg({...k,courtGuest:true,name:k.alias,born:S.turn-age*12},72)}${outsideChildBadge(k,m.relative!=null)}${lines.map(l=>'<p>'+esc(l)+'</p>').join('')}<details><summary>知情人名册</summary><ul>${witnesses}</ul></details>${controls.join(' ')}`);
}
function outerRegisterView(){
  const records=S.outerRegisters||[],reign=Number(UI.sel)||S.gen,b=records.find(b=>b.gen===reign);
  if(!b||!outerActive())return pageHeading('御前密匣')+'<p>匣中尚无来信。出巡时可以去城南走走。</p>'+outerLink('返回皇嗣',"A.go('kids')");
  const frozen=S.over||b.gen!==S.gen,notes=b.notes.filter(n=>!frozen||n.title!=='本纪定笔'||n.choice!=='入本纪');
  return pageHeading(frozen?'野史拾遗 · '+b.era:'御前密匣 · '+b.era)+outerLink('返回'+(frozen?'起居注':'皇嗣'),frozen?"A.go('log')":"A.go('kids')")+
    b.mothers.map(m=>detailFold(esc(m.name)+' · '+esc(outerOldTie(m,b)?.name||m.kin||m.source),`<p>${esc(m.trade)} · ${esc(m.trait)} · 好感 ${m.aff} · 信任 ${m.trust}${m.marital?' · '+esc(m.marital):''}</p><p>${esc(m.wish)} · ${esc(m.closed||m.palaceWork||'仍通家书')}</p>`)).join('')+
    b.children.map(k=>outerCard(b,k,frozen)).join('')+
    (b.awards.length?detailSection('成就',b.awards.map(esc).join(' · ')):'')+
    detailSection('暗线纪事','<ul class="story">'+[...notes].reverse().map(n=>`<li><time>${esc(n.date)} · ${esc(n.title)}</time><b>${esc([n.motherName,n.childName].filter(Boolean).join('、'))}</b><p>${esc(n.line)}</p>${n.voice?'<p>'+esc(n.voice)+'</p>':''}<small>${esc(n.choice)}${n.secrecy===null?'':' · 保密 '+n.secrecy+' · 知情 '+esc(n.witnesses.join('、'))}</small></li>`).join('')+'</ul>');
}
const outerKidsView=viewKids;
viewKids=function(){return outerKidsView()+(outerActive()&&!S.over?outerLink('启御前密匣',"A.go('outer')"):'');};
const outerLogView=viewLog;
viewLog=function(){
  const history=outerActive()?(S.outerRegisters||[]).filter(b=>b.gen!==S.gen||S.over).slice().reverse():[];
  return outerLogView()+(history.length?detailFold('野史拾遗',`<div class="acts">${history.map(b=>outerLink(b.era+'朝',`A.go('outer',${b.gen})`)).join('')}</div>`):'');
};

const outerHaremView=viewHarem;
viewHarem=function(){
  const html=outerHaremView(),residents=outerActive()?(outerBook()?.children||[]).filter(k=>k.palaceRank&&(!outerIntegration()||!byId(k.id))):[];
  return residents.length?html+detailSection('别院名册',residents.map(k=>`<p>${esc(k.alias)} · ${esc(k.palaceRank)} · 别院另居</p>`).join('')):html;
};
