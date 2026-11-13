/* 宫务筹备与妃嫔之间的人情 */
const canManageFeast = c => inPalace(c) && !c.maid && c.preg < 7;
const DUANWU_ROLES = { tables:'宴席', gifts:'节礼' };

function palaceSupportMemory(a,b,type,place,outcome,aView,bView,aEmotion,bEmotion){
  NPCMemory.record(S,{type,time:S.turn,location:place,participants:[a.id,b.id],outcome},[
    {person:a.id,subject:b.id,interpretation:aView,emotion:aEmotion,impact:83},
    {person:b.id,subject:a.id,interpretation:bView,emotion:bEmotion,impact:83}
  ]);
  story(a,aView);
  story(b,bView);
}

function palaceAllyScore(a,b){
  return relGet(a,b)+consortCompatibility(a,b)*3+NPCMemory.influence(S,a.id,b.id)*6;
}

function courtFriendshipEvent(){
  const people=harem(), factionsNow=factions();
  for(const c of people){
    if(!['委屈','惶恐','思念'].includes(xinOf(c))||c.favor>32||S.turn-(c.xin?.t??-Infinity)>2||
        S.turn-(c.lastFriendshipTest??-Infinity)<12)continue;
    const friend=people.filter(o=>o!==c&&relGet(c,o)>=28&&!isRival(c,o))
      .sort((a,b)=>palaceAllyScore(c,b)-palaceAllyScore(c,a))[0];
    if(!friend)continue;
    const side=p=>factionsNow.L.find(l=>l===p||factionsNow.map[l.id].includes(p));
    const cSide=side(c), friendSide=side(friend);
    const cautious=['城府','持重','骄矜'].includes(friend.trait)||(cSide&&friendSide&&cSide!==friendSide);
    const name=fullName(c), ally=fullName(friend);
    const finish=(mode,gain,mood,aView,bView,aEmotion,bEmotion)=>()=>{
      if(!inPalace(c)||!inPalace(friend))return '两人已经各自离开。';
      relAdd(c,friend,gain);
      palaceSupportMemory(c,friend,'palace_support',c.palace,mode,aView,bView,aEmotion,bEmotion);
      return aView+'\n'+fx(cchg(c,{mood}),cchg(friend,{mood:mode==='公开'&&cautious?-5:3}));
    };
    return {title:'旧友来访',cast:[c,friend],onShow:()=>{c.lastFriendshipTest=S.turn;},
      text:`${name}近来闭门少见人，${ally}还是带了她爱吃的点心来。${cautious?'她愿意私下照顾旧友，提到是否在众人面前开口，却沉默了。':'她愿在下回请安时说明自己所知，也等着陛下拿主意。'}`,
      choices:[
        {t:'准她们私下照应',f:finish('私下',7,8,`${ally}来陪我，她仍肯在这时登门。`,`悄悄去看了${name}，免得她独自捱着。`,.7,.55)},
        {t:'请她在请安时说清所知',f:finish('公开',cautious?-5:12,10,
          cautious?`${ally}只说了亲见的事，后半句始终没替我说出口。`:`${ally}当众替我说了一句公道话。`,
          cautious?`我说了所见，${name}却想让我替她担下更多。`:`当着众人替${name}说明了实情。`,cautious?-.45:.9,cautious?-.3:.75)},
        {t:'暂且避嫌，少些走动',f:finish('避嫌',-9,-5,`${ally}此后没再登门，我以为她也避着我。`,`奉旨少往${name}宫里走动，始终惦念她。`,-.75,.25)}
      ]};
  }
  return null;
}

function duanwuWork(){return S.duanwuWork?.gen===S.gen?S.duanwuWork:null;}
function duanwuOfficers(work){return [byId(work.tables),byId(work.gifts)];}
function duanwuHelper(lead,other){
  return harem().filter(c=>c!==lead&&c!==other&&canManageFeast(c)&&relGet(lead,c)>=12&&!isRival(lead,c)&&
      NPCMemory.influence(S,c.id,lead.id)>-.65)
    .sort((a,b)=>palaceAllyScore(lead,b)-palaceAllyScore(lead,a))[0];
}
function duanwuPanel(){
  const work=duanwuWork();
  if(work?.stage==='finished'&&work.year===S.year&&S.month===5){
    return activityCard('端午宫务',`<p>${esc(work.result)}</p>${work.held?'<p>本年端午宴已办。</p>':seasonalButton('安排端午宴',"A.openBanquet('duanwu')")}`);
  }
  if(work?.stage==='review'){
    return activityCard('端午宫务',`<p>宴席与节礼已经备好，可以核对功劳和份例。</p><div class="acts">${seasonalButton('查验筹备','A.reviewDuanwu()')}</div>`);
  }
  if(work?.stage==='preparing'){
    const [tables,gifts]=duanwuOfficers(work);
    return activityCard('端午宫务',`<p>${esc(fullName(tables))}管宴席，${esc(fullName(gifts))}管节礼。下个月可到御花园查验。</p>`);
  }
  if(S.month!==4||harem().filter(canManageFeast).length<2)return '';
  return activityCard('端午宫务',`<p>选两位妃嫔分别料理宴席与节礼，五月查验。备办需二十万两。</p><div class="acts">${seasonalButton('分派端午宫务','A.assignDuanwu()')}</div>`);
}

function duanwuNotice(){
  const work=duanwuWork();
  const label=work?.stage==='review'?'查验端午筹备':
    work?.stage==='finished'&&work.year===S.year&&S.month===5&&!work.held?'安排端午宴':
    S.month===4&&work?.stage!=='preparing'&&harem().filter(canManageFeast).length>=2?'分派端午宫务':'';
  return label?`<div class="season-map-leads">${seasonalButton('御花园 · '+label,'A.openDuanwuGarden()')}</div>`:'';
}
A.openDuanwuGarden=()=>{if(S&&!S.over&&!modalOpen)goDirect(gardenPlace());};

A.assignDuanwu=function(){
  if(!S||S.over||modalOpen||S.month!==4||duanwuWork()?.stage==='preparing')return;
  const options=harem().filter(canManageFeast);
  if(options.length<2)return;
  pushEv({title:'分派端午宫务',text:'先定一位主理宴席，再选一位筹备节礼。两人可请相熟的妃嫔帮忙。',
    choices:[...options.map(lead=>({t:`请${fullName(lead)}主理宴席 · ${lead.trait} · ${consortHobby(lead)}`,person:lead,f:()=>{
      pushNow({title:'谁来筹备节礼',por:lead,text:`暂拟由${fullName(lead)}料理宴席，再选一位妃嫔准备节礼。`,
        choices:[...options.filter(c=>c!==lead).map(gifts=>({t:`请${fullName(gifts)}筹备节礼 · ${gifts.trait} · ${consortHobby(gifts)}`,person:gifts,
          cond:()=>E().treasury>=20,why:'需二十万两',f:()=>{
            if(!canManageFeast(lead)||!canManageFeast(gifts)||S.month!==4||duanwuWork()?.stage==='preparing'||E().treasury<20)return null;
            chg({treasury:-20});
            S.duanwuWork={gen:S.gen,year:S.year,stage:'preparing',tables:lead.id,gifts:gifts.id,due:S.turn+1};
            log(`端午宫务交由${fullName(lead)}与${fullName(gifts)}筹备。`);
            save('auto');
            return '内务府已拨下备办银两。五月到御花园看筹备结果。';
          }})),{t:'稍后再定'}]});
      return null;
    }})),{t:'稍后再定'}]});
};

function finishDuanwu(work,mode){
  if(work.stage!=='review')return null;
  const [tables,gifts]=duanwuOfficers(work);
  const helper=byId(work.helper);
  const partner=work.helperRole==='gifts'?gifts:tables;
  const countCredit=mode==='公开署名';
  const valid=canManageFeast(tables)&&canManageFeast(gifts);
  let result='两位主事未能齐到，内务府按原例备齐了宴席和节礼。';
  if(valid){
    const conflict=work.issue==='争份例';
    const gain=countCredit?7:mode==='私下协调'?5:conflict?-5:2;
    result=countCredit?'按实记下各宫所做的事，逐一核对席次与节礼。':
      mode==='私下协调'?'两位主事私下分清了余下的差事，照常备齐宴席和节礼。':
      conflict?'席位与节礼照报来的册子办，几位当事人仍介意份例的分法。':'照两位主事报来的册子结了这场端午宫务。';
    relAdd(tables,gifts,gain);
    palaceSupportMemory(tables,gifts,'duanwu_work','御花园',mode,
      `与${fullName(gifts)}同办端午，我负责${DUANWU_ROLES.tables}。${result}`,
      `和${fullName(tables)}合办端午，我负责${DUANWU_ROLES.gifts}。${conflict&&!countCredit?'还记着席次与份例争执。':result}`,
      gain<0?-.55:.7,gain<0?-.65:.65);
    if(canManageFeast(helper)){
      relAdd(partner,helper,countCredit?8:mode==='私下协调'?4:work.issue==='漏记帮手'?-6:2);
      palaceSupportMemory(partner,helper,'duanwu_help','御花园',mode,
        `${fullName(helper)}帮我料理了${DUANWU_ROLES[work.helperRole]}。`,
        `我帮${fullName(partner)}做了${DUANWU_ROLES[work.helperRole]}。${countCredit?'结案册上也有我的名字。':mode==='私下协调'?'她特地来谢了我。':work.issue==='漏记帮手'?'结案时却没提我做过的事。':'她私下谢了我。'}`,
        .65,countCredit?.85:work.issue==='漏记帮手'&&mode!=='私下协调'?-.7:.45);
    }
    cchg(tables,{mood:gain});cchg(gifts,{mood:gain});
  }
  Object.assign(work,{stage:'finished',result});
  log(`端午宫务办结。${result}`,1);
  return result;
}

function palaceDutiesTick(){
  const work=duanwuWork();
  if(work?.stage==='preparing'&&S.turn>=work.due){
    const [tables,gifts]=duanwuOfficers(work);
    if(!canManageFeast(tables)||!canManageFeast(gifts)){finishDuanwu(Object.assign(work,{stage:'review'}),'照例办结');return;}
    const giftsHelper=duanwuHelper(gifts,tables),tablesHelper=duanwuHelper(tables,gifts);
    const giftsFirst=giftsHelper&&(!tablesHelper||gifts.trait==='巧手'||
      palaceAllyScore(gifts,giftsHelper)>=palaceAllyScore(tables,tablesHelper));
    const helper=giftsFirst?giftsHelper:tablesHelper;
    const contest=[tables,gifts].some(c=>['骄纵','骄矜','善妒'].includes(c.trait)&&c.favor>=40)||relGet(tables,gifts)<=-15;
    Object.assign(work,{stage:'review',helper:helper?.id,helperRole:giftsFirst?'gifts':'tables',
      issue:contest?'争份例':helper?'漏记帮手':'核对开支'});
  }
  if(work?.stage==='review'&&S.turn>work.due)finishDuanwu(work,'照例办结');
}

A.reviewDuanwu=function(){
  const work=S&&duanwuWork();
  if(!work||S.over||modalOpen||work.stage!=='review')return;
  const [tables,gifts]=duanwuOfficers(work),helper=byId(work.helper);
  if(!canManageFeast(tables)||!canManageFeast(gifts)){
    const result=finishDuanwu(work,'照例办结');
    save('auto');render();toast(result);return;
  }
  const helperNote=canManageFeast(helper)?`${fullName(helper)}受邀来帮着料理${DUANWU_ROLES[work.helperRole]}。`:'';
  const preparations=[
    ['宴席',tables],['节礼',gifts]
  ].map(([role,person])=>{
    if(person.trait==='持重')return `${fullName(person)}先列清了${role}的开支，再逐笔核对。`;
    if(person.trait==='巧手'&&role==='节礼')return `${fullName(person)}先做了样品，节礼的花样由她亲手定下。`;
    if(person.trait==='好客'&&role==='宴席')return `${fullName(person)}问过各宫口味，另外备了几样不甜的点心。`;
    return '';
  }).filter(Boolean).join('\n');
  const issue={
    '争份例':'有人要把自家宫里的席次往前挪，节礼也要多领一份。',
    '漏记帮手':'两位主事的名字写上了册，帮着跑前跑后的人却没写进去。',
    '核对开支':'两份账目都送来了，案上还留着一笔未核销的开支。'
  }[work.issue];
  setScene('garden');
  pushEv({title:'端午筹备 · '+work.issue,cast:[tables,gifts,...(helperNote?[helper]:[])],
    text:[`${fullName(tables)}管宴席，${fullName(gifts)}管节礼。`,preparations,helperNote,issue].filter(Boolean).join('\n'),
    choices:[['逐一核对，按实记下各人功劳','公开署名'],['请她们私下协调','私下协调'],['照来报的册子办结','照例办结']]
      .map(([t,mode])=>({t,f:()=>{const result=finishDuanwu(work,mode);save('auto');return result;}}))});
};
