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
function royalNatalStory(k,p,c,title,text,relativeText,motherText=text){
  const people=[k,p,c].filter(Boolean);
  for(const person of people){
    person.story ||= [];
    story(person,`【${title}】${person===p?relativeText:person===c?motherText:text}`);
    person.story.at(-1).life={kind:'family',title,turn:S.turn,gen:S.gen,source:'外家婚帖',summary:text,
      people:people.map(x=>({id:x.id,name:x.sex?x.name:fullName(x)}))};
  }
  log(`【${title}】${text}`,1);
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
function royalNatalCancel(k,p){
  const b=k.betrothal;
  delete k.betrothal;
  if(royalNatalEngaged(p)&&p.betrothal.personId===k.id)delete p.betrothal;
  k.natalMatchAsked=true;
  const text=`${k.name}与${b.name}的婚约已撤销，旧婚帖另存礼部。`;
  royalNatalStory(k,p,familyHostById(b.motherId),'婚约作罢',text,text);
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
    if(S.turn>=b.due&&!k.jailed&&!k.templeStay&&!royalJourneyAway(k)&&!p.jailed&&!p.exiled)
      royalNatalMarry(k,p,e.c,b);
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
  return detailSection(b?'已定亲':'配偶档案',`<p>${b?'定亲对象':'配偶'} · ${link}${b?' · 等双方满十八岁后成婚。'+engagementTiming(b.due??(e&&royalNatalMarriageAge(k,e.p)),'待双方可以行礼时成婚。'):''}</p>`);
}
function natalRoyalPartnerLine(p){
  const b=royalNatalEngaged(p)?p.betrothal:null,id=b?.personId??p.spouse?.royalId;
  if(id==null)return '';
  const ruler=E().natalMarriageHeir,k=ruler?.id===id?ruler:royalById(id),name=k&&k===ruler?k.name+' · 当朝天子':k?kidName(k):(b||p.spouse).name;
  const link=k?royalNatalPersonLink(S.children.includes(k)?'kid':'relative',k.id,name):esc(name);
  return `<p>${b?'已定亲':'配偶'} · ${link}${b?' · 等双方满十八岁后成婚':k?.alive===false?' · 已故':''}</p>`;
}
