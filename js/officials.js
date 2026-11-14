/* Named maternal relatives: one household, one life record, shared by sisters. */
// Stable slots retain the original brother key for old saves and journal actions.
const brotherRoles=h=>Object.keys(h||{}).filter(k=>/^brother(?:[2-9]\d*)?$/.test(k)&&h[k]).sort((a,b)=>(Number(a.slice(7))||1)-(Number(b.slice(7))||1));
const officialRoles=h=>['father',...brotherRoles(h)];
const brotherRole=(h,predicate=()=>true)=>brotherRoles(h).find(role=>predicate(h[role]));
const officialKinLabel=(h,role)=>role==='father'?'父亲':brotherRoles(h).length<2?'兄长':({brother:'长兄',brother2:'二兄',brother3:'三兄',brother4:'四兄',brother5:'五兄'}[role]||'兄长');
const OFFICIAL_TEMPERAMENTS=['持正','谨慎','进取','圆融'];
const officialAlive=p=>!!p&&p.alive!==false;
const officialServing=p=>officialAlive(p)&&!p.retired&&!p.commission&&!p.exiled&&!p.dismissed;
function initializeOfficialHouse(c,h,family){
  for(const other of family.map(x=>x.house).filter(Boolean))for(const role of brotherRoles(other))h[role]??=other[role];
  for(const role of officialRoles(h)){
    const p=h[role];if(!p)continue;
    // JSON saves copy the same household into each sister. A death must survive reunion.
    for(const other of family.map(x=>x.house?.[role]).filter(x=>x&&x!==p)){
      if(other.alive===false){p.alive=false;p.death||=other.death;}
      p.story=[...(p.story||[]),...(other.story||[])].filter((x,i,a)=>a.findIndex(y=>y.d===x.d&&y.t===x.t)===i);
      p.report||=other.report;p.commission||=other.commission;
    }
    const seed=voiceHash(h.father.id+':'+role);
    p.id||=role==='father'?h.father.id:h.father.id+':'+role;p.seed??=seed;
    p.official=(role==='father'?0:2)+(h.bloc==='army'?1:0);
    p.alive??=true;p.story||=[];p.temperament||=OFFICIAL_TEMPERAMENTS[seed%4];
    p.ability??=35+seed%51;p.trust??=35+(seed>>>6)%21;p.merit??=20+(seed>>>3)%30;
    p.age??=Math.max(...family.map(x=>x.age||18))+2+(seed%4);
    // Import only explicit old court outcomes, never hypothetical backstories.
    if(!p.legacyLifeChecked){
      const records=family.flatMap(x=>x.story||[]);
      const entry=records.find(x=>role==='father'?x.t.includes('父亲'+p.name+'在家中病故'):role==='brother'&&/父兄出征失利，兄长战死沙场/.test(x.t));
      if(entry){p.alive=false;p.death||={kind:role==='brother'?'battle':'illness',reason:role==='brother'?'北境出征，战死沙场':'在家中病故',d:entry.d};p.story.push({d:entry.d,t:p.death.reason+'（据旧纪事补录）。'});}
      const ended=family.find(x=>x.arc?.done&&(role==='father'?x.arc.id==='general'&&['削爵','孤女'].includes(x.arc.end):x.arc.id==='greed'&&x.arc.end==='抄家'&&(x.arc.f?.brotherRole||'brother')===role));
      if(ended){const record=(ended.story||[]).find(x=>x.t.startsWith(`【${role==='father'?'边关烽火':'金玉其外'}·${ended.arc.end}】`));
        if(role==='father'){p.alive=false;p.death||={kind:ended.arc.end==='孤女'?'execution':'illness',reason:ended.arc.end==='孤女'?'叛乱平定后伏诛':'被夺兵权，回京后郁郁而终',d:record?.d};}
        else p.exiled=true;
        if(record&&!p.story.some(x=>x.d===record.d&&x.t===record.t))p.story.push({...record});
      }
      p.legacyLifeChecked=true;
    }
    if(!p.alive){delete p.commission;p.away=false;}
  }
}
function officialEntries(){
  const entries=[],seen=new Set();
  for(const c of S.consorts){const h=houseOf(c);if(!h)continue;
    for(const role of officialRoles(h)){const p=h[role];if(!p||seen.has(p.id))continue;seen.add(p.id);entries.push({c,h,p,role,key:c.id+':'+role});}
  }
  return entries;
}
function officialEntry(key){
  const [id,role]=String(key).split(':');if(role!=='father'&&!/^brother(?:[2-9]\d*)?$/.test(role))return null;
  const c=byId(Number(id)),h=c&&houseOf(c),p=h?.[role];return p?{c,h,p,role,key:c.id+':'+role}:null;
}
function officialStatus(p){
  if(!officialAlive(p))return p.death?.kind==='battle'?'阵亡':'已故';
  return p.exiled?'流放':p.dismissed?'革职':p.commission?'奉差在外':p.retired?'致仕归乡':p.away?'外任':'在任';
}
function officialRecord(c,role,text,{family=true,emotion=0}={}){
  const h=houseOf(c),p=h?.[role];if(!p)return;
  story(p,text);
  if(family)for(const member of paternalFamily(c).filter(x=>S.consorts.includes(x)&&x.alive)){
    story(member,`${officialKinLabel(h,role)}${p.name}：${text}`);
    NPCMemory.record(S,{type:'maternal-house',time:S.turn,participants:[member.id,p.id],object:text},[
      {person:member.id,subject:p.id,interpretation:text,emotion,impact:65}]);
  }
  log(`${p.name}：${text}`,1);
}
function officialDeath(c,role,reason,kind='illness'){
  const h=houseOf(c),p=h?.[role];if(!officialAlive(p))return false;
  p.alive=false;p.death={kind,reason,d:dateStr(),turn:S.turn};p.away=false;delete p.commission;
  if(p.report)p.report={text:reason,outcome:'death',title:'身故讣报',turn:S.turn};
  officialRecord(c,role,reason,{emotion:-.9});
  for(const member of paternalFamily(c).filter(x=>S.consorts.includes(x)&&x.alive)){
    cchg(member,{mood:kind==='battle'?-25:-15});setXin(member,'悲恸',`${officialKinLabel(h,role)}${p.name}${kind==='battle'?'阵亡':'去世'}`);
    member.fam.p=Math.max(5,member.fam.p-6);
  }
  startOfficialContinuity({c,p,role},'death',p.death.reason);
  return true;
}
function officialLink(c,role,label){
  const p=houseOf(c)?.[role];return p?`<button class="person-link" onclick="A.go('official','${c.id}:${role}')">${esc(label||p.name)} ↗</button>`:'';
}
function officialFamilyLine(c){
  const h=houseOf(c);if(!h)return '';
  return `<div class="official-family-links">${officialRoles(h).map(role=>{const p=h[role];return p?`<div>${officialKinLabel(h,role)}：${officialLink(c,role)} <span class="hint">${esc(p.office||p.post)} · ${officialStatus(p)}${p.death?' · '+esc(p.death.d||'日期未详'):''}</span></div>`:'';}).join('')}${brotherRoles(h).length?'':'<p class="hint">无兄长</p>'}</div>`;
}
function officialsRoster(){
  const entries=officialEntries(),dead=entries.filter(x=>!officialAlive(x.p));
  const cards=items=>items.map(({c,h,p,role,key})=>`<button class="card portrait-card official-card${!p.alive?' deceased':''}" onclick="A.go('official','${key}')">${porImg(p,76)}<span><strong>${esc(p.name)}</strong><small>${esc(p.office||p.post)} · ${officialStatus(p)}</small><small>${esc(fullName(c))}的${officialKinLabel(h,role)}</small><span class="person-link">查看履历与往来 →</span></span></button>`).join('');
  return `<h2>朝臣与外家</h2><p class="hint">按实际人物归档，同父姐妹共用父兄履历。可从家族树、妃嫔详情或此处进入。</p><div class="grid portrait-grid">${cards(entries.filter(x=>officialAlive(x.p)))||'<p>暂无在世亲眷。</p>'}</div>${dead.length?`<h3>故人名录</h3><div class="grid portrait-grid">${cards(dead)}</div>`:''}`;
}
function officialActionReady(e,action){
  if(!e||S.over)return false;const p=e.p;
  if(action==='honor')return !officialAlive(p)&&!p.memorialHonor;
  if(!officialAlive(p))return false;
  if(p.exiled||p.dismissed)return false;
  if(action==='talk')return S.turn-(p.lastAudience??-99)>=3;
  if(action==='reward')return !p.report&&p.merit>=50&&p.merit>(p.rewardedMerit??0)&&S.turn-(p.lastReward??-99)>=12;
  if(action==='retire')return !p.retired&&!p.commission&&p.age>=55;
  if(action==='recall')return !!p.retired&&p.age<70&&S.turn-(p.retiredAt??-99)>=12;
  if(action==='commission')return officialServing(p)&&!p.report&&!reliefSuspended(p)&&p.age<70&&S.turn-(p.lastCommission??-99)>=6;
  return false;
}
function viewOfficial(){
  const e=officialEntry(UI.sel);if(!e)return officialsRoster();
  const {c,p,role,h,key}=e,kin=paternalFamily(c).filter(x=>S.consorts.includes(x)),otherRoles=officialRoles(h).filter(r=>r!==role);
  const act=(action,label,cost=0)=>`<button class="btn ${action==='talk'?'primary':''}" onclick="A.officialAct('${key}','${action}')" ${officialActionReady(e,action)?'':'disabled'}>${label}<small>${action==='commission'?'选择差事与所需银两':`精力 −1${cost?' · 国库 −'+cost:''}`}</small></button>`;
  const actions=!officialAlive(p)?act('honor','赐祭抚恤',20):p.exiled||p.dismissed?'':act('talk',p.away||p.commission||p.retired?'赐书问候':'召见议事')+act('commission','委派差事')+act('reward','论功赏赐',20)+(p.retired?act('recall','征召复出'):p.age>=55?act('retire','准予致仕'): '');
  const hint=!officialAlive(p)?'故人的履历与家族关系继续保留；抚恤仅可办理一次。':p.exiled||p.dismissed?'获罪期间不再召见、领差或受赏，既有处置留在履历中。':'问候每三个月一次；差事有回奏与冷却；赏赐须有新增功绩且间隔一年。致仕须满五十五岁，复出须未满七十岁且致仕满一年。';
  return `${personBackButton('officials')}<header class="detail-head">${porImg(p,224)}<div class="grow"><p>${role==='father'?'外家长辈':'外家子弟'} · ${esc(blocName(h.bloc))}</p><h2>${esc(p.name)}</h2><p>${esc(p.office||p.post)}${p.honor?' · '+esc(p.honor):''}</p><p>${p.age}岁 · <strong>${officialStatus(p)}</strong> · ${esc(p.temperament)}</p>${p.death?`<p class="official-death">${esc(p.death.d||'日期未详')} · ${esc(p.death.reason)}</p>`:''}${p.retired?'<p class="hint">不再承接官差；仍可书信问候。</p>':''}</div></header>
    <div class="detail-vitals">${bar('才干',p.ability)}${bar('功绩',p.merit)}${bar('信任',p.trust)}</div><div class="detail-actions"><div class="acts">${actions}</div><p class="hint">${hint}</p></div>
    ${p.report?`<section class="detail-section"><h3>待阅回奏</h3><p>${esc(p.report.text)}</p><button class="btn jade" onclick="A.officialReport('${key}')">阅看回奏</button></section>`:''}
    ${p.commission?detailSection('当前差事',`<p>${esc(p.commission.title)} · ${Math.max(0,p.commission.due-S.turn)}个月后回奏</p>`):''}
    ${detailSection('家族往来',kin.map(x=>`<button class="btn quiet sm" onclick="A.go('consort',${x.id})">${esc(fullName(x))} · ${role==='father'?'女儿':'姐妹'}${x.alive?'':' · 已故'}</button>`).join(' ')+otherRoles.map(r=>`<p>${r==='father'?'父亲':role==='father'?'儿子':'兄弟'}：${officialLink(c,r)} · ${officialStatus(h[r])}</p>`).join(''))}
    ${detailSection('个人履历与纪事',detailStory(p))}`;
}
function officialConversation(e,topic){
  const {c,p,role,h}=e,kin=role==='father'?'女儿':'妹妹';
  if(topic==='family'){
    const relatives=paternalFamily(c).filter(x=>S.consorts.includes(x));
    if(relatives.some(x=>!x.alive))return '“家中还留着她旧时的书信。有些话，当年只当来日方长，如今再无机会问了。”';
    if(relatives.some(x=>x.cold))return '“臣不敢以家事乱国法，只求她在冷宫有衣御寒，有药可医。”';
    const letter=c.familyVoice;if(letter?.gen===S.gen&&letter.officialId===p.id&&letter.heard&&letter.delivered)return `“${fullName(c)}在信里把自己的判断写得很明白。臣已认真读过，也会把实情回信说明。”`;
    const deceased=brotherRoles(h).map(r=>h[r]).find(x=>x!==p&&!officialAlive(x));
    if(deceased)return `“${role==='father'?'儿子':'兄弟'}${deceased.name}留下的旧物还在。家里人经过，谁也不肯先抬头。”`;
    return `“${kin}入宫前${p.temperament==='谨慎'?'总怕行差踏错':'也会在家中檐下听雨'}。臣只盼她记得本心，不因一时荣辱忘了从前。”`;
  }
  if(topic==='service'){
    if(p.retired)return '“离了公署才知，乡间一条断桥，能让百姓绕上半日。臣虽归田，仍愿把亲眼所见写给陛下。”';
    if(p.commission)return `“${p.commission.title}尚未办结，臣不敢先报全功。待簿册与实情一一核对，再据实回奏。”`;
    if(h.bloc==='army')return '“边关不只有捷报。马料、棉衣、伤兵的归途，少顾一样，便要士卒拿命去填。”';
    return {持正:'“账上多一分虚报，百姓便少一口口粮。臣宁可奏折不好看，也不敢把亏空写成丰年。”',谨慎:'“地方回报尚有出入。臣愿多走几处乡里，不以一纸漂亮文书请功。”',进取:'“积弊并非一日能除。请许臣先办成一件，再凭实绩论用人。”',圆融:'“各司有各司的难处。臣愿把争议摊在案上，请众人对着同一本账说话。”'}[p.temperament];
  }
  return {持正:'“臣的亲眷在宫中，越该守住公私之界。若臣失职，请陛下照章问责。”',谨慎:'“位高一分，责任便重一分。臣不求骤升，只求交来的差事能够交代。”',进取:'“臣愿在任上留下能查验的事，不愿世人只记得臣是哪位娘娘的父兄。”',圆融:'“一家受恩，旁人难免多看几眼。臣当收束门客，不使家声成为宫里的牵累。”'}[p.temperament];
}
function greedBrother(c){
  const h=houseOf(c);if(!h||!c.arc)return null;
  c.arc.f.brotherRole??=c.arc.st>0?'brother':brotherRole(h,p=>officialAlive(p)&&!p.exiled&&!p.dismissed);
  return h[c.arc.f.brotherRole]||null;
}
function officialArcEligible(c){
  if(c.arc?.id==='general')return houseOf(c)?.bloc==='army'&&officialServing(houseOf(c)?.father);
  if(c.arc?.id==='greed'){const p=greedBrother(c);return officialAlive(p)&&!p.exiled&&!p.dismissed;}
  return true;
}
function syncOfficialArcOutcome(c,title,text){
  const role=c.arc.id==='general'?'father':c.arc.id==='greed'?(c.arc.f.brotherRole||'brother'):null;
  if(!role)return;if(c.arc.id==='greed')c.arc.f.brotherRole=role;const p=houseOf(c)?.[role];if(!p)return;
  if(role==='father'&&['削爵','孤女'].includes(title))return officialDeath(c,role,title==='孤女'?'叛乱平定后伏诛。':'被夺去兵权、削去爵位，回京后郁郁而终。',title==='孤女'?'execution':'illness');
  if(title==='抄家'){p.exiled=true;delete p.commission;}
  if(title==='连坐'){p.dismissed=true;delete p.commission;}
  if(title==='将相和')p.honor='一等公';
  officialRecord(c,role,text);
}
const OFFICIAL_TASKS={
  border:{title:'巡边整饬军备',army:true,cost:30,months:3,risk:.025},
  escort:{title:'护送边关粮道',army:true,cost:20,months:2,risk:.01},
  accounts:{title:'核查地方钱粮',army:false,cost:15,months:2,risk:0},
  public:{title:'巡察民间疾苦',army:false,cost:15,months:3,risk:0}
};
function assignOfficialTask(e,id){
  const task=OFFICIAL_TASKS[id];if(!task||!officialActionReady(e,'commission')||task.army!==(e.h.bloc==='army')||E().treasury<task.cost||!useE())return null;
  const p=e.p;chg({treasury:-task.cost});p.lastCommission=S.turn;
  const roll=R(),success=.35+p.ability/200+p.trust/500;
  p.commission={id,title:task.title,due:S.turn+task.months,started:S.turn,contact:e.c.id,wasAway:!!p.away,outcome:roll<task.risk?'death':roll<success?'success':'setback'};
  officialRecord(e.c,e.role,`奉旨${task.title}，约${task.months}个月后回奏。`);save('auto');return `${p.name}领命。进展将记入其履历，并向家眷通报。`;
}
function officialTaskTick(){
  for(const e of officialEntries()){
    const {p,c,role}=e,j=p.commission;if(!j||!officialAlive(p)||S.turn<j.due)continue;
    const contact=byId(j.contact),familyContact=contact?.house?.[role]?.id===p.id?{...e,c:contact}:e;
    delete p.commission;p.away=j.wasAway;let text;
    if(j.outcome==='death'){text=`奉差${j.title}途中遇伏，率部断后，力战身亡。`;officialDeath(familyContact.c,role,text,'battle');}
    else{
      text=j.outcome==='success'?`${j.title}已办结，簿册与实地核验相符，相关善后也已安排。`:`${j.title}未尽如期，回奏列明了调度疏漏，并请朝廷复核善后。`;
      p.merit=clamp(p.merit+(j.outcome==='success'?12:-6));chg({people:j.outcome==='success'?3:-1});officialRecord(c,role,text,{emotion:j.outcome==='success'?.5:-.3});
    }
    p.report={text,outcome:j.outcome,title:j.title,turn:S.turn};
    startOfficialContinuity(familyContact,j.outcome,j.title);
  }
}
function officialReportEvent(e){
  const report=e?.p.report;if(!report)return null;
  const {c,p,role}=e,valid=()=>!S.over&&p.report===report;
  const finish=(kind,cost=0)=>{
    if(!valid()||E().treasury<cost||kind==='honor'&&p.memorialHonor)return null;delete p.report;chg({treasury:-cost});
    const text=kind==='honor'?'奉旨厚恤，家人收到祭文与抚恤银。':kind==='reward'?'差事办妥，奉旨另赐银帛。':kind==='accountable'?'责令补交失职说明，相关差务另派人接手。':'回奏已阅，善后依例办理。';
    if(kind==='honor')p.memorialHonor=true;
    if(kind==='reward'){p.lastReward=S.turn;p.rewardedMerit=p.merit;p.trust=clamp(p.trust+5);}
    if(kind==='accountable')p.trust=clamp(p.trust-5);
    officialRecord(c,role,text,{emotion:kind==='honor'||kind==='reward'?.5:0});save('auto');return text;
  };
  return {title:report.outcome==='death'?'边关讣报':'外臣回奏 · '+report.title,por:p,valid,text:`${p.name}：${report.text}\n${report.outcome==='death'?'讣报已经送达家中，相关姐妹的纪事与家谱也已记明。':'差事的结果已记入个人履历，可据此决定赏罚。'}`,choices:[
    ...(report.outcome==='death'?[{t:'厚加抚恤，赐祭其家 · 国库−20',cond:()=>!p.memorialHonor&&E().treasury>=20,why:p.memorialHonor?'已办理抚恤':'国库不足',f:()=>finish('honor',20)}]:report.outcome==='success'?[{t:'嘉奖实绩，赐银帛 · 国库−15',cond:()=>E().treasury>=15,why:'国库不足',f:()=>finish('reward',15)}]:[{t:'责令说明疏漏，另派人善后',f:()=>finish('accountable')}]),
    {t:report.outcome==='death'?'依例治丧，记入忠烈簿':'阅毕，依例办理',f:()=>finish('record')} ]};
}
function pendingOfficialReport(){return officialReportEvent(officialEntries().find(e=>e.p.report));}
A.officialReport=function(key){if(!modalOpen)pushEv(officialReportEvent(officialEntry(key)));};
A.officialAct=function(key,action){
  const e=officialEntry(key);if(modalOpen||!officialActionReady(e,action))return;const {c,p,role,h}=e;
  const valid=()=>officialActionReady(e,action),cost=['honor','reward'].includes(action)?20:0;
  if(action==='commission')return pushEv({title:'委派差事 · '+p.name,por:p,valid,text:'按其履历选择差事，领命后会在数月内回奏。边关军务有低概率遇伏伤亡。',choices:[
    ...Object.entries(OFFICIAL_TASKS).filter(([,t])=>t.army===(h.bloc==='army')).map(([id,t])=>({t:`${t.title} · ${t.months}个月 · 精力−1 · 国库−${t.cost}`,cond:()=>E().energy>=1&&E().treasury>=t.cost,why:'精力或国库不足',f:()=>assignOfficialTask(e,id)})),{t:'暂不委派'}]});
  if(action==='talk')return pushEv({title:(p.away||p.commission||p.retired?'赐书问候':'召见议事')+' · '+p.name,por:p,valid,text:p.away||p.commission||p.retired?'内侍备好御札，可写下想问的话。':'内侍引他入殿。他行礼后，等候你开口。',choices:[
    ...[['service','问任上见闻'],['family','问家中近况'],['duty','谈公私与用人']].map(([topic,t])=>({t:t+' · 精力−1',cond:()=>E().energy>=1,why:'精力不足',f:()=>{
      if(!valid()||!useE())return null;p.lastAudience=S.turn;p.trust=clamp(p.trust+4);const line=officialConversation(e,topic);
      officialRecord(c,role,`陛下${p.away||p.commission||p.retired?'赐书垂询':'召见'}。${line}`,{family:topic==='family',emotion:.4});save('auto');return {text:line,por:p};
    }})),{t:'改日再谈'}]});
  const labels={honor:'赐祭抚恤',reward:'论功赏赐',retire:'准予致仕',recall:'征召复出'};
  pushEv({title:labels[action]+' · '+p.name,por:p,valid,text:{honor:'将赐祭文与抚恤银给其家眷，故人的履历仍留在家族中。',reward:'按新增功绩赐银帛，嘉奖将记入本人履历与家眷纪事。',retire:'准其卸下差务归乡，今后仍可书信往来。',recall:'征召其重返原职，恢复承接差事的资格。'}[action],choices:[
    {t:'准奏'+(cost?' · 国库−'+cost:'')+' · 精力−1',cond:()=>E().energy>=1&&E().treasury>=cost,why:'精力或国库不足',f:()=>{
      if(!valid()||E().treasury<cost||!useE())return null;chg({treasury:-cost});
      if(action==='honor')p.memorialHonor=true;
      if(action==='reward'){p.lastReward=S.turn;p.rewardedMerit=p.merit;p.trust=clamp(p.trust+6);}
      if(action==='retire'){p.retired=true;p.retiredAt=S.turn;}
      if(action==='recall'){p.retired=false;p.away=false;}
      const line={honor:'奉旨赐祭抚恤，家中收到祭文与抚恤银。',reward:'因新增功绩获赏银帛。',retire:'奉准致仕归乡，卸下差务。',recall:'奉诏复出，恢复原职。'}[action];officialRecord(c,role,line,{emotion:.5});save('auto');return line;
    }},{t:'暂缓'}]});
};
