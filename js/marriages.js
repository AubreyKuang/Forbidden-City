/* 皇嗣议婚：入口、固定名帖与皇子赐婚。公主仍沿用开府和旧日相识路线。 */
const marriageEligible=k=>!!(k?.alive&&!royalJourneyAway(k)&&!k.templeStay&&!k.removedFromRoyal&&(S.children.includes(k)||princeSuccessionActive()&&k.princelySuccession)&&kidAge(k)>=(k.outerRegisterId?18:15)&&!k.jailed&&!k.married&&!k.pendingName&&!S.over&&(journalContentVersion()<22||!k.betrothal));
const marriageReady=k=>marriageEligible(k)&&S.turn>=(k.marriageAfter??0);
const PRINCE_MATCHES={
  scholar:{name:'书香人家',note:'她喜欢校书作画，希望婚后还能保留自己的书房。',stat:'lit',gain:5},
  martial:{name:'将门人家',note:'她自幼习骑射，愿与他一道练习，也不愿被困在内宅。',stat:'mar',gain:5},
  household:{name:'清正官宦',note:'她性情温厚，擅理家事，愿同他商量府中的大小安排。',stat:'vir',gain:5}
};
function marriageCandidate(k,route){
  k.marriageCandidates ||= {};
  if(k.marriageCandidates[route])return k.marriageCandidates[route];
  const excluded=new Set([E().sur,byId(k.mom)?.sur,byId(k.foster)?.sur,...Object.values(k.marriageCandidates).map(p=>p.sur)]);
  const sur=pick(SUR.filter(s=>!excluded.has(s))),sex=k.sex==='m'?'f':'m';
  const name=sur+(sex==='f'?pick(GIV)+pick(GIV):pick(['子','景','怀','允','修','知'])+pick(BOYC));
  const person={id:`match-${k.id}-${route}`,courtGuest:true,sex,name,sur,born:S.turn-(Math.max(15,kidAge(k))+ri(0,2))*12,
    seed:ri(1,2e9),alive:true,route,background:k.sex==='m'?PRINCE_MATCHES[route].name:PRINCESS_MATCHES[route].name};
  if(sex==='f')person.appearance=makeGirl({sur,given:name.slice(sur.length),age:kidAge(person),
    trait:{scholar:'好学',martial:'将门',household:'温婉'}[route],
    fam:{t:{scholar:'翰林学士',martial:'镇国大将军',household:'知府'}[route],p:{scholar:50,martial:65,household:38}[route]}});
  k.marriageCandidates[route]=person;
  return person;
}
function marriageEmpress(k){
  const spouse=k.married&&k.spouse;if(!spouse)return null;
  if(spouse.natalHost!=null){
    const e=natalEntry(spouse.natalHost,spouse.personId);
    return e?.p.alive?royalNatalConsort(e.c,e.p):null;
  }
  const em=spouse.appearance?JSON.parse(JSON.stringify(spouse.appearance)):makeGirl({sur:spouse.sur,given:spouse.name.slice((spouse.sur||'').length)});
  em.age=Math.max(15,kidAge(spouse));return em;
}
function marriageStatus(k){
  if(royalNatalEngaged(k))return '已定亲 · '+k.betrothal.name;
  if(royalTravelAway(k))return '离宫游历，暂不议婚';
  if(immortalAway(k))return '山中修行，暂不议婚';
  if(!k.alive||k.templeStay||k.removedFromRoyal||kidAge(k)<15||k.pendingName)return '';
  if(k.married)return k.spouse?`已赐婚 · ${k.spouse.name}`:'婚事已定';
  if(k.jailed)return '圈禁期间暂不议婚';

  if(S.turn<(k.marriageAfter??0))return `婚事暂缓 · 还需${k.marriageAfter-S.turn}个月`;
  return '已满十五岁 · 可以议婚';
}
function marriageButton(k,small=false){
  return marriageEligible(k)?`<button class="btn ${small?'sm ':''}gold" onclick="A.kidMarriage(${royalActionArg(k.id)})" ${marriageReady(k)?'':'disabled'}>议婚 / 赐婚${marriageReady(k)?' →':`<small>还需${k.marriageAfter-S.turn}个月</small>`}</button>`:'';
}
function spouseAppearance(k){
  const spouse=k?.spouse;if(!spouse)return null;
  if(spouse.appearance)return spouse;
  // Old acquaintance marriages saved only a name and id. Recover the guest first;
  // otherwise derive a stable adult identity without consuming gameplay randomness.
  const guest=Object.values(S.youngGuests||{}).find(p=>p.id===spouse.id);
  const person={...guest,...spouse};
  let seed=2166136261;
  for(const ch of `${k.id}:${person.id||person.name}`)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  return {sex:k.sex==='f'?'m':'f',born:k.born,seed,...person,courtGuest:true};
}
function marriagePanel(k){
  const partner=royalNatalPartnerPanel(k);
  if(royalNatalEngaged(k)||!k.alive||royalJourneyAway(k)||kidAge(k)<15||k.pendingName)return partner;
  const spouse=k.spouse;
  return `<section class="marriage-panel" aria-label="皇嗣婚事">${spouse?`<figure class="spouse-portrait">${porImg(spouseAppearance(k),112)}<figcaption>${k.sex==='f'?'驸马':'王妃'} · ${esc(spouse.name)}</figcaption></figure>`:''}<div class="grow"><strong>${esc(marriageStatus(k))}</strong><p class="hint">${spouse?esc(spouse.background||spouse.fatherName&&spouse.fatherName+'之子'||'双方心意已定'):
    k.married?'这门婚事已经记入起居注。':'先看名帖、听本人意愿，再确认赐婚；也可以暂缓半年。'}</p>${Number.isFinite(spouse?.trust)?`<p class="hint">夫妻信任 ${rd(spouse.trust)} / 100${spouse.story?.length?' · '+esc(spouse.story[spouse.story.length-1].t):''}</p>`:''}</div>${marriageButton(k)}</section>`+partner;
}
function princeMarriage(k){
  const order=k.lit>=k.mar&&k.lit>=k.vir?['scholar','household','martial']:k.mar>=k.vir?['martial','household','scholar']:['household','scholar','martial'];
  const people=order.map(route=>marriageCandidate(k,route));
  return {title:'皇子议婚',por:k,valid:()=>marriageReady(k),text:`礼部送来三家的名帖。${kidName(k)}请你先听听他的心意，再决定这门婚事。\n名帖上写着家世与平日喜好，可逐一细问，或留待日后再议。`,choices:[
    ...people.map(p=>({t:`看看${p.name} · ${p.background}`,person:p,f:()=>{pushNow(princeMatchReview(k,p.route));return null;}})),
    {t:'暂缓半年，让他再想想',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '名帖收在礼部，半年后可再从皇嗣详情议婚。';}}
  ]};
}
function princeMatchReview(k,route){
  const p=marriageCandidate(k,route),match=PRINCE_MATCHES[route],statName={lit:'才学',mar:'武艺',vir:'品德'}[match.stat];
  const fits=k[match.stat]>=Math.max(k.lit,k.mar,k.vir);
  return {title:'赐婚前问心意',cast:[k,p],valid:()=>marriageReady(k),text:`${p.name} · ${kidAge(p)}岁 · ${p.background}\n${match.note}\n${k.name}${fits?'听得认真，说两人倒有相投之处。':'想了想，说愿意先听她亲口谈谈将来的打算。'}\n${marriageProfileText(k,p)}\n礼部已分别问过双方，二人愿意议定。婚仪需国库五十万两；婚后${statName}+${match.gain}，父爱+${fits?10:5}。`,choices:[
    {t:'下诏赐婚 · 国库−50万两',primary:true,cond:()=>E().treasury>=50&&marriageReady(k),f:()=>{
      if(!marriageReady(k)||E().treasury<50)return null;
      k.married=true;k.spouse={...p,marriedAt:S.turn};k[match.stat]=clamp(k[match.stat]+match.gain);k.love=clamp(k.love+(fits?10:5));
      princessMemory(k,'child_marriage',`经问双方心意，与${p.name}议定婚事。`,'礼部');log(`${kidName(k)}赐婚${p.name}。`,1);
      ensureMarriedLife(k);const result=chg({treasury:-50});save('auto');return `${k.name}与${p.name}的婚事已定。${k.away?'礼部将诏书送往封地。':'婚后仍留京，原有课业和亲人往来照常。'}${fx(result)}`;
    }},
    {t:'先让两人谈谈日常',f:()=>{pushNow(marriageMeeting(k,p,()=>princeMatchReview(k,route)));return null;}},
    {t:'再看别的人选',f:()=>{pushNow(princeMarriage(k));return null;}},
    {t:'暂缓半年',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '婚事暂缓半年。';}}
  ]};
}
A.kidMarriage=function(id){
  const k=kidById(id)||(princeSuccessionActive()?royalById(id):null);if(modalOpen||!marriageReady(k))return;
  if(k.sex==='f'){A.princessMarriage(id);return;}
  pushEv(princeMarriage(k));save('auto');
};

/* 外家婚约保留双方的原人物档案，成年后接入皇嗣府中的婚后生活。 */
const ROYAL_NATAL_MATCH='royal-natal';
const ROYAL_NATAL_ADULT=18;
const ROYAL_NATAL_AGE_GAP=36;
const royalNatalMatchActive=()=>journalContentVersion()>=117;
const royalNatalEngaged=p=>p?.betrothal?.kind===ROYAL_NATAL_MATCH;
const royalNatalMarriageAge=(k,p)=>Math.max(k.born,p.born)+ROYAL_NATAL_ADULT*12;
const royalNatalParentageEligible=p=>!p.outsideFamilyOrigin&&!p.unconfirmedParentage&&
  (!p.outsideParentage||p.outsideParentage.status==='cleared');

function royalNatalChildReady(k){
  const age=kidAge(k);
  return k.alive&&!k.pendingName&&!k.married&&!k.spouse&&!k.betrothal&&!k.natalMatchAsked&&
    !k.adoptedRoyal&&!k.outerRegisterId&&!k.birthSwap?.occurred&&!k.removedFromRoyal&&
    !k.jailed&&childInPalace(k)&&age>=2&&age<=11;
}
function royalNatalRelativeReady(k,p){
  return p.alive&&p.sex===(k.sex==='m'?'f':'m')&&!p.consortId&&!p.visit&&!p.married&&!p.spouse&&!p.betrothal&&
    royalNatalParentageEligible(p)&&natalAge(p)>=1&&Math.abs(k.born-p.born)<=ROYAL_NATAL_AGE_GAP;
}
function royalNatalFamilyOptions(c,k,h=c.house){
  if(!h)return [];
  const branches=[{c,h,collateral:false},...cousinFatherEntries(c).map(e=>({c:e.c,h:e.e.h,collateral:true}))];
  const out=[];
  for(const branch of branches){
    const {h}=branch,people=h.relatives||[];
    const mothers=new Map(people.filter(p=>p.sex==='f'&&!p.parentRelativeId&&!p.motherRelativeId&&
      !p.consortId&&!p.outsideFamilyOrigin).map(p=>[p.id,p]));
    for(const p of natalPeople(h)){
      const mother=mothers.get(p.motherRelativeId??p.parentRelativeId);
      if(mother&&royalNatalRelativeReady(k,p))
        out.push({host:branch.c,p,mother,collateral:branch.collateral||!!mother.natalCollateral});
    }
  }
  return out.sort((a,b)=>Number(a.collateral)-Number(b.collateral)||Math.abs(a.p.born-k.born)-Math.abs(b.p.born-k.born));
}
function royalNatalCanRegisterBranch(c){
  return !!c.house?.natal&&!c.house.natal.marriageBranchRegistered;
}
function registerRoyalNatalBranch(c,k){
  const h=c.house,seed=marriageHash(`royal-natal:${h.father.id}:${k.id}`);
  const childAge=Math.max(1,kidAge(k)+(seed%3)-1);
  const motherAge=Math.min(49,Math.max(c.age+2,childAge+19));
  const elderAge=h.father.age,mother=addNatalPerson(c,h,'f',motherAge,seed,false);
  h.father.age=elderAge;
  mother.natalCollateral=true;
  mother.married=true;
  const father=initialNatalSpouse(mother,motherAge);
  const surnames=SUR.filter(s=>s!==c.sur&&s!==E().sur);
  father.sur=surnames[seed%surnames.length];father.name=father.sur+BROTHER_NAMES[seed%BROTHER_NAMES.length];
  mother.spouse=father;
  mother.lifeCourse={adult:S.turn,children:1,lastBirth:S.turn-childAge*12,last:S.turn};
  const p=addNatalPerson(c,h,k.sex==='m'?'f':'m',childAge,voiceHash(seed+':child'),false);
  p.sur=father.sur;p.name=p.sur+p.given;
  p.parentRelativeId=mother.id;p.fatherId=father.id;p.fatherName=father.name;
  h.natal.marriageBranchRegistered=true;
  story(mother,`族谱补录：与${fullName(c)}为堂姐妹，嫁与${father.name}，育有${p.name}。`);
  story(p,`由${mother.name}与${father.name}在家中抚养，随母亲一支载入外家名册。`);
  return {host:c,p,mother,collateral:true};
}
function royalNatalMarriageProposal(){
  if(!royalNatalMatchActive()||S.over||mourningActive()||S.turn-(S.flags.lastRoyalNatalProposal??-12)<12)return null;
  const entries=S.children.filter(royalNatalChildReady).flatMap(k=>{
    const c=byId(k.mom);
    if(!inPalace(c)||c.maid||!c.house)return [];
    const option=royalNatalFamilyOptions(c,k)[0];
    return option||royalNatalCanRegisterBranch(c)?[{c,k,option}]:[];
  });
  const known=entries.filter(e=>e.option);
  if(!entries.length||!chance(known.length ? .08 : .025))return null;
  const direct=known.filter(e=>!e.option.collateral);
  const {c,k,option}=pick(direct.length?direct:known.length?known:entries);
  const {host,p,mother,collateral}=option||registerRoyalNatalBranch(c,k);
  const relation=k.sex==='m'?'女儿':'儿子',name=kidName(k);
  const introduction=collateral
    ?`家书附了族谱里堂亲一房的近况。她的${host===c?natalLabel(c,mother):'堂亲'}${mother.name}有个${relation}，名叫${p.name}，今年${natalAge(p)}岁。`
    :`她的${natalLabel(c,mother)}${mother.name}写信来，说${relation}${p.name}今年${natalAge(p)}岁。`;
  const letters=[
    '前些日子家里捎来两只小竹马，她一见就想起自己小时候和姐妹争骑一根竹竿的事。',
    '她把两人的生辰写在一张纸上，挨在窗下算了半晌，笑说原来两个孩子隔得这样近。',
    '信里还夹着小孩描的花样。她把纸铺平，想起小时候在外家过节，正是这一房亲眷陪她守岁。'
  ];
  const valid=()=>inPalace(c)&&royalNatalChildReady(k)&&royalNatalRelativeReady(k,p);
  return {title:'外家有约 · 娃娃亲',por:c,cast:[k,natalPortrait(p)],present:[c],valid,
    onShow:()=>{S.flags.lastRoyalNatalProposal=S.turn;},
    text:`${fullName(c)}趁问安时提起一封家书。${introduction}${name}今年${kidAge(k)}岁，两个孩子年岁相近。${letters[marriageHash(k.id+':match-letter')%letters.length]}\n她想求陛下准两家先交换婚帖，等孩子们都满十八岁，照礼成婚。`,
    choices:[
      {t:'准两家交换婚帖',f:()=>{
        if(!valid())return null;
        const due=royalNatalMarriageAge(k,p);
        k.betrothal={kind:ROYAL_NATAL_MATCH,host:host.id,personId:p.id,name:p.name,turn:S.turn,due,motherId:c.id};
        p.betrothal={kind:ROYAL_NATAL_MATCH,personId:k.id,name:k.name,turn:S.turn,due};
        const text=`${name}与${p.name}交换婚帖，订下婚约，待二人都满十八岁按礼成婚。`;
        royalNatalStory(k,p,c,'外家定亲',text,`家里替${p.name}收好婚帖，另把宫中亲眷的名字与生辰抄在册中。`,
          `她如愿为${k.name}与${p.name}换了婚帖。回娘家的信里又添一句，两个孩子的生辰往后都记着。`);
        return text;
      }},
      {t:'等孩子长大，自行议婚',f:()=>{
        if(!valid())return null;
        k.natalMatchAsked=true;
        const text=`${fullName(c)}曾提起与${p.name}家结亲。陛下让孩子们长大后再自行议婚，家中收到回音。`;
        royalNatalStory(k,p,c,'婚议暂留',text,`${p.name}家收到回书，依旧照常与宫中亲眷通问。`,
          `外家的婚事留待孩子们长大再议。她回信时先问${p.name}近来学会了什么。`);
        return '家书送回外家，两家照常往来。';
      }}
    ]};
}
function royalNatalStory(k,p,c,title,text,relativeText,motherText=text,{publicRecord=true,source='外家婚帖',royalText=text}={}){
  const people=[k,p,c].filter(Boolean);
  for(const person of people){
    person.story ||= [];
    story(person,`【${title}】${person===p?relativeText:person===c?motherText:royalText}`);
    person.story.at(-1).life={kind:'family',title,turn:S.turn,gen:S.gen,source,summary:text,
      people:people.map(x=>({id:x.id,name:x.sex?x.name:fullName(x)}))};
  }
  if(publicRecord)log(`【${title}】${text}`,1);
}
function royalNatalConsort(host,p){
  const face=makeGirl({sur:p.sur,given:p.given,age:natalAge(p),trait:p.trait,fam:{...host.fam}});
  face.id=p.id;face.seed=p.seed;face.artPortrait=p.artPortrait;
  face.familyBranchOrigin={host:host.id,relative:p.id};
  face.story=p.story.map(entry=>({...entry}));p.consortId=face.id;
  return face;
}
function royalNatalMarry(k,p,host,b){
  const c=familyHostById(b.motherId),ruling=k===E().natalMarriageHeir,name=ruling?'新帝'+k.name:kidName(k);
  delete k.betrothal;delete p.betrothal;delete p.visit;
  k.married=true;
  const face=natalPortrait(p);
  k.spouse={id:p.id,personId:p.id,natalHost:host.id,name:p.name,sur:p.sur,sex:p.sex,born:p.born,seed:p.seed,
    alive:true,official:face.official,artPortrait:p.artPortrait,trait:p.trait,background:`${c?c.sur:host.sur}氏外家`,marriedAt:S.turn};
  if(royalNatalCourtshipActive()&&b.bond)k.spouse.trust=Math.round((b.bond.royal+b.bond.relative)/2);
  if(p.sex==='f')k.spouse.appearance={sur:p.sur,given:p.given,age:natalAge(p),seed:p.seed,artPortrait:p.artPortrait,trait:p.trait,rank:0};
  p.married=true;
  p.spouse={id:k.id,royalId:k.id,name:k.name,sur:E().sur,born:k.born,alive:true,marriedAt:S.turn};
  if(p.sex==='m')p.royalSpouseId=k.id;
  const text=`${name}与${p.name}都已满十八岁，依幼时所定的婚约行礼成婚。礼部将两人的旧婚帖与成婚日期一同存档。`;
  royalNatalStory(k,p,c,'依约成婚',text,`礼成后，${p.name}将两家旧日交换的婚帖收进新居。`,
    `婚礼这日，她找出当年问过的那张生辰纸。纸角已黄，当初挨着写下的两个名字还清楚。`);
  if(ruling){
    const bride=royalNatalConsort(host,p);
    bride.favor=35;bride.aff=30;bride.knownBeforeAccession=true;
    addConsort(bride,empress()?6:8,'依幼时婚约成婚，迎入宫中');
  }else ensureMarriedLife(k);
}
function royalNatalCancel(k,p,outcome){
  const b=k.betrothal;
  delete k.betrothal;
  if(royalNatalEngaged(p)&&p.betrothal.personId===k.id)delete p.betrothal;
  k.natalMatchAsked=true;
  const text=outcome?.text||`${k.name}与${b.name}的婚约已撤销，旧婚帖另存礼部。`;
  royalNatalStory(k,p,familyHostById(b.motherId),'婚约作罢',text,outcome?.relativeText||text,text,{royalText:outcome?.royalText||text});
}
function royalNatalEndReign(ruler){
  if(!royalNatalEngaged(ruler))return;
  const b=ruler.betrothal;
  royalNatalCancel(ruler,natalEntry(b.host,b.personId)?.p);
}
function royalNatalMarriageTick(){
  if(!royalNatalMatchActive())return;
  const ruler=E().natalMarriageHeir;
  const children=royalHouseholds();
  if(ruler)children.push(ruler);
  for(const k of children){
    if(k.spouse?.natalHost!=null){
      const p=natalEntry(k.spouse.natalHost,k.spouse.personId)?.p;
      if(p?.alive===false)k.spouse.alive=false;
      if(k.alive===false&&p?.spouse?.royalId===k.id)p.spouse.alive=false;
    }
    if(!royalNatalEngaged(k))continue;
    const b=k.betrothal,e=natalEntry(b.host,b.personId),p=e?.p;
    const linked=royalNatalEngaged(p)&&p.betrothal.personId===k.id;
    if(!linked||!k.alive||k.removedFromRoyal||k.married||k.spouse||!p.alive||p.consortId||
       p.married||p.spouse||!royalNatalParentageEligible(p)){
      royalNatalCancel(k,p);
      continue;
    }
    const weddingReady=S.turn>=b.due&&!k.jailed&&!k.templeStay&&!royalJourneyAway(k)&&!p.jailed&&!p.exiled;
    if(!royalNatalCourtshipTick(k,p,b,weddingReady)&&weddingReady)royalNatalMarry(k,p,e.c,b);
  }
}
function royalNatalPersonLink(view,id,name){
  return `<button class="person-link" onclick="A.go('${view}',${royalActionArg(id)})">${esc(name)} ↗</button>`;
}
function engagementTiming(due,waiting){
  if(!Number.isFinite(due))return waiting;
  const months=Math.max(0,due-S.turn);
  if(!months)return '已到婚期，'+waiting;
  const years=Math.floor(months/12),rest=months%12;
  return '距婚期还有 '+[years?years+' 年':'',rest?rest+' 个月':''].filter(Boolean).join(' ');
}
function royalNatalPartnerPanel(k){
  const b=royalNatalEngaged(k)?k.betrothal:null,s=k.spouse;
  if(!b&&s?.natalHost==null)return '';
  const e=b?natalEntry(b.host,b.personId):natalEntry(s.natalHost,s.personId);
  const name=e?.p.name||(b||s).name;
  const link=e?royalNatalPersonLink('natal',e.c.id+':'+e.p.id,name):esc(name);
  const undecided=b?.bond?.petition||b?.bond?.holdUntil>S.turn;
  const timing=b&&!undecided?engagementTiming(b.due??(e&&royalNatalMarriageAge(k,e.p)),'待双方可以行礼时成婚。'):'';
  return detailSection(b?'已定亲':'配偶档案',`<p>${b?'定亲对象':'配偶'} · ${link}${b?' · 双方满十八岁后依约成婚。'+timing:''}</p>`+
    (b?royalNatalCourtshipPanel(k,e?.p):''));
}
function natalRoyalPartnerLine(p){
  const b=royalNatalEngaged(p)?p.betrothal:null,id=b?.personId??p.spouse?.royalId;
  if(id==null)return '';
  const k=royalNatalById(id),name=k&&k===E().natalMarriageHeir?k.name+' · 当朝天子':k?kidName(k):(b||p.spouse).name;
  const link=k?royalNatalPersonLink(S.children.includes(k)?'kid':'relative',k.id,name):esc(name);
  return `<p>${b?'已定亲':'配偶'} · ${link}${b?' · 双方满十八岁后依约成婚':k?.alive===false?' · 已故':''}</p>`+
    (b&&k?royalNatalCourtshipPanel(k,p):'');
}
function royalNatalById(id){
  const ruler=E().natalMarriageHeir;
  return ruler?.id===id?ruler:royalById(id);
}

/* 婚帖上的两个人各有心意，随来往改变。外家的档案读取同一份婚约。 */
const ROYAL_NATAL_CONTACTS={
  letter:{age:8,months:6,title:'婚帖往来 · 书信',label:'让两人互通信札',chance:.12},
  visit:{age:12,months:12,title:'婚帖往来 · 相见',label:'安排两人见面',chance:.06}
};
const royalNatalCourtshipActive=()=>journalContentVersion()>=119;
function royalNatalInitialBond(k,p){
  const key=k.id+':'+p.id;
  return {royal:44+marriageHash(key+':royal-affection')%13,relative:44+marriageHash(key+':relative-affection')%13,last:{}};
}
function royalNatalContactReason(k,p,kind){
  const rule=ROYAL_NATAL_CONTACTS[kind],b=k.betrothal;
  if(!royalNatalCourtshipActive()||!royalNatalEngaged(k)||!royalNatalEngaged(p)||b.personId!==p.id||p.betrothal.personId!==k.id||
     !k.alive||!p.alive||k.married||p.married||k.removedFromRoyal||p.consortId||!royalNatalParentageEligible(p))return '婚约已变';
  if(b.bond?.petition)return '婚约正在等候裁决';
  if(k.jailed||p.jailed||p.exiled||k.templeStay)return '两家暂时不便往来';
  if(mourningActive())return '守丧期间暂缓来往';
  if(kind==='gift')return S.month===1&&S.turn-(b.bond?.last.gift??-12)>=12?'':'岁礼每年正月互送一次';
  if(Math.min(kidAge(k),natalAge(p))<rule.age)return `等两人都满${rule.age}岁`;
  const wait=rule.months-(S.turn-(b.bond?.last[kind]??-12));
  if(wait>0)return `还需等${wait}个月`;
  if(kind==='visit'&&(k.away||royalJourneyAway(k)||p.away||p.commission||p.diplomaticJourney||p.incognitoCase))return '两人须同在京中';
  return '';
}
function royalNatalExchange(k,p,kind){
  if(royalNatalContactReason(k,p,kind))return null;
  const b=k.betrothal,bond=b.bond||=royalNatalInitialBond(k,p);
  const key=`${k.id}:${p.id}:${S.turn}:${kind}`,n=marriageHash(key),young=Math.min(kidAge(k),natalAge(p))<12;
  const pickFor=(items,index=n)=>items[index%items.length];
  const oldRoyal=bond.royal,oldRelative=bond.relative;
  let title,summary,royalLine,relativeLine;
  if(kind==='gift'){
    const gifts=young?['描红纸','小风车','木制七巧板','彩纸灯笼','一对布老虎','刻花木陀螺']:
      ['一笺梅花纸','一册新年诗抄','一轴小景','一柄竹骨扇','一匣桂花糕','一枚手编书签'];
    const first=n%gifts.length,second=(first+1+(n>>>5)%(gifts.length-1))%gifts.length;
    const fromRoyal=gifts[first],fromRelative=gifts[second];
    title='正月互送岁礼';
    summary=`两家拜年时，${k.name}托人送去${fromRoyal}，${p.name}也捎来了${fromRelative}。`;
    royalLine=`把${fromRoyal}托给家里，收到${p.name}的${fromRelative}。${pickFor(['留了原来的包纸，回头好认出是谁送的。','拆开后就拿给身边的人看。','特意请送礼的人捎一句新岁安好。'])}`;
    relativeLine=`给${k.name}挑了${fromRelative}，回礼是${fromRoyal}。${pickFor(['晚饭时才想起，还没问对方喜不喜欢自己挑的那一份。','大人问起谁送的，便把名字从头到尾念了一遍。','想着过几日若有机会，想亲口道一声谢。'],n>>>4)}`;
    bond.royal=clamp(oldRoyal+1+(n%2));bond.relative=clamp(oldRelative+1+((n>>>7)%2));
  }else{
    const fit=marriageFit(k,p).score;
    const chanceFor=(value)=>clamp(.51+(fit-58)/85+(value-50)/500,.2,.8);
    const royalWarm=chance(chanceFor(oldRoyal)),relativeWarm=chance(chanceFor(oldRelative));
    const topic=kind==='letter'?pickFor(young?['庭前新来的燕子','各自的课业','家里种的第一盆花','上元见过的灯'] :
      ['近来读过的书','雨后出门所见','各自平日最舍不得放下的事','来年想学的一门本领']):
      pickFor(['在花厅下了一局棋','在水榭旁看了半卷画','在长辈陪同下走过了梅径','在花厅各自挑了一本书']);
    title=ROYAL_NATAL_CONTACTS[kind].title;
    summary=`${k.name}与${p.name}${kind==='letter'?`互寄书信，谈起${topic}`:`${topic}，散时又各说了几句心里话`}。`;
    const warm=kind==='letter'?['没想到对方还记得上封信里的一句闲话。回信纸短，又添了半页。','读到有趣的一处，赶紧圈起来，下回还想接着问。','把信读完了，又翻回去看了一遍开头。']:
      ['意外发觉对方还记得上回的一句闲话，便多说了一点自己的事。','本来只想应一声，后来越说越有趣，散了还惦记下回。','说到彼此擅长的事，觉得听对方说话也有意思。'];
    const cool=young?['最想说的事只得了一句问安，便把预备好的后半句咽下了。','对方惦记的是另一样事，原先想讲的那件也没了兴致。','还以为对方也会觉得有趣，过后才知道人家根本没留意。']:
      ['兴致勃勃说起自己在意的事，等到的只有一句客气话，心里慢慢凉了。','想问清对方真正的打算，几句话过去，反倒觉得隔着一层。','谈到一半就想收住，心想照这样的相处，日后怕是有话也说不到一处。'];
    royalLine=summary+pickFor(royalWarm?warm:cool,n>>>3);
    const opening=kind==='letter'?`读了${k.name}写来的信，也说了些家中的事。`:`随长辈见了${k.name}，回来后又想了一遍两人说过的话。`;
    relativeLine=opening+pickFor(relativeWarm?warm:cool,(n>>>3)+1);
    const gain=kind==='letter'?4:7,loss=kind==='letter'?7:10;
    bond.royal=clamp(oldRoyal+(royalWarm?gain:-loss));bond.relative=clamp(oldRelative+(relativeWarm?gain:-loss));
  }
  bond.last[kind]=S.turn;
  bond.latest={text:summary,turn:S.turn,date:dateStr()};
  royalNatalStory(k,p,null,title,summary,relativeLine,undefined,{publicRecord:false,source:'婚约往来',royalText:royalLine});
  const change=(delta)=>delta>0?'+'+delta:String(delta);
  return summary+`\n§${k.name}的好感 ${change(bond.royal-oldRoyal)} · ${p.name}的好感 ${change(bond.relative-oldRelative)}`;
}
A.royalNatalContact=function(id,kind){
  if(!S||S.over||modalOpen||!Object.hasOwn(ROYAL_NATAL_CONTACTS,kind))return;
  const k=royalNatalById(id);
  if(!royalNatalEngaged(k))return;
  const b=k.betrothal,p=natalEntry(b.host,b.personId)?.p;
  if(royalNatalContactReason(k,p,kind))return;
  const rule=ROYAL_NATAL_CONTACTS[kind];
  const valid=()=>k.betrothal===b&&!royalNatalContactReason(k,p,kind);
  pushEv({title:rule.title,cast:[k,natalPortrait(p)],valid,
    text:kind==='letter'?`${k.name}与${p.name}各写了一封信。封口还没糊上，里头除了问安，也有几句想亲自说的话。`:
      `两家长辈愿意陪同，择个清静时辰，让${k.name}与${p.name}在花厅见一面。`,
    choices:[{t:kind==='letter'?'让两人把信递给对方':'准他们在长辈陪同下见面',f:()=>royalNatalExchange(k,p,kind)},
      {t:'这次先作罢'}]});
};
function royalNatalPetitionEvent(k,p,b){
  const bond=b.bond,petition=bond.petition;
  const royal=petition.side==='royal',speaker=royal?k:p,other=royal?p:k;
  const c=familyHostById(b.motherId);
  const reasons=[
    '几回把真心话说到一半，就想收回去。再往下过一辈子，我心里害怕。',
    '家里提到婚期时我总盼那话早点过去。这份婚帖压在心里许久，我今日才敢开口。',
    '礼数我都记得。可两个人每回有话，总像是各在各的屋里。我想求陛下准我们把旧约解了。'
  ];
  const reason=reasons[marriageHash(speaker.id+':dissolve-betrothal')%reasons.length];
  const title='婚约问心 · 请求解约';
  const valid=()=>k.betrothal===b&&royalNatalEngaged(p)&&p.betrothal.personId===k.id&&k.alive&&p.alive&&bond.petition===petition;
  function resolve(choice){
    if(!valid())return null;
    delete bond.petition;
    const start=`${speaker.name}向陛下禀明，想与${other.name}解除幼时所订的婚约。`;
    if(choice==='release'){
      const result='陛下准予解约，礼部撤下双方现行婚帖。两人此后可另议婚事。';
      royalNatalCancel(k,p,{text:start+result,royalText:royal?'终于说出心事，蒙准解除旧约。':'接到解约的回话，亲自收起幼时交换的旧帖。',
        relativeText:royal?'从家中得知旧约已解，把原先备好的回信放回了匣子。':'亲笔写明自己的想法，收到准予解约的回音。'});
      return result;
    }
    const result=choice==='wait'?'礼部奉命暂缓婚期六个月，届时再问双方的心意。':'礼部奉命保留婚约，双方各自接到了答复。';
    if(choice==='wait')bond.holdUntil=S.turn+6;
    else{delete bond.holdUntil;bond.kept={royal:bond.royal,relative:bond.relative};}
    royalNatalStory(k,p,c,title,start+result,
      (royal?'得知'+k.name+'主动提起解约。':'终于亲口说了自己对旧约的想法。')+result,
      `听完礼部转述，她把旧帖留在原处，又向家里问了问${p.name}的近况。`);
    return result;
  }
  return {title,por:royal?k:natalPortrait(p),cast:[royal?natalPortrait(p):k],valid,
    text:`${speaker.name}托人递进一封亲笔信，求解除与${other.name}幼时订下的婚约。信末写道：“${reason}”\n礼部候陛下裁决，再办理婚事。`,
    choices:[{t:'准许解除婚约',f:()=>resolve('release')},{t:'暂缓半年，届时再问',f:()=>resolve('wait')},{t:'照旧保留婚约',f:()=>resolve('keep')}]};
}
function royalNatalCourtshipTick(k,p,b,weddingReady){
  if(!royalNatalCourtshipActive())return false;
  const bond=b.bond;
  const held=(bond?.holdUntil??-1)>S.turn;
  if(bond&&!bond.petition&&!held&&Math.min(kidAge(k),natalAge(p))>=15){
    const sides=['royal','relative'].filter(side=>bond[side]<=36&&(!bond.kept||bond[side]<=bond.kept[side]-8));
    const side=sides.sort((a,b)=>bond[a]-bond[b])[0];
    if(side&&(S.turn>=b.due||chance(.25)))bond.petition={side};
  }
  if(bond?.petition){
    if(PalaceActions.busy&&!mourningActive())pushEv(royalNatalPetitionEvent(k,p,b));
    return true;
  }
  if(weddingReady&&!held)return false;
  if(bond?.latest?.turn===S.turn)return held;
  if(!royalNatalContactReason(k,p,'gift'))royalNatalExchange(k,p,'gift');
  else for(const [kind,rule] of Object.entries(ROYAL_NATAL_CONTACTS)){
    if(!royalNatalContactReason(k,p,kind)&&chance(rule.chance)){royalNatalExchange(k,p,kind);break;}
  }
  return held;
}
function royalNatalCourtshipPanel(k,p){
  if(!royalNatalCourtshipActive()||!royalNatalEngaged(p)||!royalNatalEngaged(k)||p.betrothal.personId!==k.id)return '';
  const bond=k.betrothal.bond||royalNatalInitialBond(k,p);
  const status=bond.petition?'解约请求等候裁决':bond.holdUntil>S.turn?`婚期暂缓 · 约${bond.holdUntil-S.turn}个月后再议`:'';
  const age=Math.min(kidAge(k),natalAge(p));
  const next=age<8?'正月互送岁礼。两人都满八岁后可通信，满十二岁后可在京相见。':age<12?'两人都满十二岁后可在京相见。':'';
  const actions=Object.entries(ROYAL_NATAL_CONTACTS).map(([kind,rule])=>{
    if(age<rule.age)return '';
    const why=royalNatalContactReason(k,p,kind);
    return `<button class="btn sm" onclick="A.royalNatalContact(${royalActionArg(k.id)},'${kind}')" ${why?'disabled':''}>${rule.label}${why?`<small>${esc(why)}</small>`:''}</button>`;
  }).join('');
  return `<p><strong>彼此好感</strong> · ${esc(k.name)}对${esc(p.name)} ${bond.royal} / 100 · ${esc(p.name)}对${esc(k.name)} ${bond.relative} / 100</p>
    ${status||next?`<p class="hint">${esc(status||next)}</p>`:''}
    ${bond.latest?`<p class="hint">上次往来 · ${esc(bond.latest.date)} · ${esc(bond.latest.text)}</p>`:''}
    ${actions?`<div class="acts">${actions}</div>`:''}`;
}
