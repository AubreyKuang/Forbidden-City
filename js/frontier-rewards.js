/* Dispatch, victory and reward keep the same named commander and household. */
const FRONTIER_POSTS=['骁骑校尉','守备','游击将军','参将','副将','总兵','骠骑将军','镇国大将军'];
const frontierRewardsEnabled=()=>journalContentVersion()>=13;
function frontierEntry(ref){
 if(!ref)return null;
 if(ref.kind==='family'){const e=officialEntry(ref.key);return e?.p.id===ref.personId?e:null;}
 const g=byId(ref.id)||(S.flags.frontierHouses||[]).find(x=>x.guest.id===ref.id)?.guest,h=g&&houseOf(g);
 return h?{c:g,h,p:h.father,role:'father',key:g.id+':father',outside:!byId(g.id)}:null;
}
const frontierRef=e=>e.outside?{kind:'guest',id:e.c.id}:{kind:'family',key:e.key,personId:e.p.id};
function frontierCreateGeneral(){
 const g=makeGirl({age:ri(20,25),fam:{t:'镇国大将军',p:50},trait:pick(['温婉','爽直','聪慧','沉静','才女'])});
 delete g.timeTraveler;g.willing=g.seed%4!==0;
 const h=houseOf(g),p=h.father;p.office='参将';p.official=1;p.temperament=pick(OFFICIAL_TEMPERAMENTS);p.age=Math.max(p.age,g.age+20);g.fam.t=p.office;
 story(p,'久在北境领军，奉调候命。');story(g,`父亲${p.name}在北境任${p.office}，自己仍居家中，尚未入宫。`);
 (S.flags.frontierHouses||=[]).push({gen:S.gen,guest:g,agedAt:S.turn});
 return {c:g,h,p,role:'father',key:g.id+':father',outside:true};
}
function frontierPickCommander(){
 const entries=officialEntries().filter(e=>officialMilitary(e.p,e.h)&&officialServing(e.p)&&!e.p.report&&e.p.age<70);
 if(entries.length&&chance(.5))return pick(entries);
 const outside=(S.flags.frontierHouses||[]).filter(x=>x.gen===S.gen&&!byId(x.guest.id)).map(x=>frontierEntry({kind:'guest',id:x.guest.id})).filter(e=>e&&officialServing(e.p)&&e.p.age<70);
 return outside[0]||frontierCreateGeneral();
}
function frontierDaughter(e){
 if(!e||!officialAlive(e.p))return null;
 if(e.outside){const g=e.c;return g.alive&&g.age>=18&&g.age<=35&&!g.married&&!g.frontierDeclined?{kind:'guest',id:g.id,name:fullName(g),age:g.age,g}:null;}
 if(e.role!=='father')return null;
 const p=natalPeople(e.h).find(p=>p.sex==='f'&&!p.parentRelativeId&&p.alive&&natalAge(p)>=18&&natalAge(p)<=35&&!p.married&&!p.spouse&&!p.betrothal&&!p.declined&&!p.frontierDeclined);
 return p?{kind:'natal',id:p.id,name:p.name,age:natalAge(p),g:p}:null;
}
function frontierPromotion(e){
 if(!officialServing(e.p))return null;
 const old=e.p.office||e.p.post||'',i=FRONTIER_POSTS.indexOf(old);
 if(i>=0&&i<FRONTIER_POSTS.length-1)return {old,next:FRONTIER_POSTS[i+1],honor:false};
 if(e.p.honor!=='护国功臣')return {old,next:'护国功臣',honor:true};
 return null;
}
function frontierRecord(r){return (S.flags.frontierCampaigns||[]).find(x=>x.id===r);}
function frontierCanReward(r){const e=r&&frontierEntry(r.commander);return !!r&&r.gen===S.gen&&r.outcome==='victory'&&!r.reward&&!S.over&&e&&officialAlive(e.p)&&!e.p.exiled&&!e.p.dismissed;}
function frontierDispatch(e,{cost=300,odds=.6,named=false}={}){
 if(!e||!officialServing(e.p)||!officialMilitary(e.p,e.h)||e.p.report)return null;
 const ref=frontierRef(e),id=`${S.gen}-${S.turn}-${(S.flags.frontierSerial||0)+1}`;S.flags.frontierSerial=(S.flags.frontierSerial||0)+1;
 const r={id,gen:S.gen,turn:S.turn,date:dateStr(),commander:ref,name:e.p.name,post:e.p.office||e.p.post,outcome:chance(odds)?'victory':'defeat'};
 (S.flags.frontierCampaigns||=[]).push(r);
 officialRecord(e.c,e.role,`奉旨领兵出征北境，军费${cost}万两拨付军前。`);
 if(r.outcome==='victory'){
  e.p.merit=clamp((e.p.merit||0)+15);const daughter=frontierDaughter(e);
  r.request=e.p.temperament==='圆融'&&daughter?'daughter':e.p.temperament==='进取'?'promotion':'silver';
  if(daughter)r.daughter={kind:daughter.kind,id:daughter.id};
  officialRecord(e.c,e.role,'领兵出征北境，王师告捷，军功录册，待陛下论赏。',{emotion:.7});
  if(!e.outside)officialFamilyReaction(e,'success','北境出征','北境军报已到，王师告捷，军功录册，等候御前论赏。');
  const effect=chg({treasury:-cost,prestige:named?8:5});
  pushNow(frontierRewardEvent(r));
  return `王师告捷。${r.post}${r.name}率部击退来敌，捷报与功册一同呈上。\n陛下龙颜大悦，召他入殿，准备论功行赏。${fx(effect)}`;
 }
 if(named){officialDeath(e.c,e.role,'领兵出征北境，中伏战死沙场。','battle');return `兵败。${r.name}战死沙场，讣报已送达家中。${fx(chg({treasury:-300,prestige:-6}))}`;}
 officialRecord(e.c,e.role,'北境出征失利，撤军回防，奉命查明失利缘由。',{emotion:-.5});
 if(!e.outside)officialFamilyReaction(e,'setback','北境出征');
 return `${r.name}前线失利，丢了两座城池。军功未成，先查明战损与责任。${fx(chg({treasury:-cost,prestige:-5,people:-5}))}`;
}
function frontierReward(r,kind){
 if(!frontierCanReward(r))return null;const e=frontierEntry(r.commander),p=e.p,promo=frontierPromotion(e);let text;
 if(kind==='promotion'){
  if(!promo)return null;if(promo.honor)p.honor=promo.next;else p[p.office!==undefined?'office':'post']=promo.next;
  text=promo.honor?`以北境军功加封${p.name}为${promo.next}，原职${promo.old}照旧。`:`以北境军功，${p.name}由${promo.old}晋为${promo.next}。`;
  p.trust=clamp(p.trust+6);chg({prestige:2});
 }else if(kind==='silver'){
  if(E().treasury<30)return null;chg({treasury:-30});p.rewardSilver=(p.rewardSilver||0)+30;p.trust=clamp(p.trust+4);
  text=`${p.name}因北境军功获赐金银绢帛，合计三十万两，内含犒军与将士家眷抚恤之用。`;
 }else if(kind==='record')text=`${p.name}北境军功已记入功册，陛下暂不加官或赐金。`;
 else return null;
 r.reward={kind,turn:S.turn,date:dateStr(),text};if(kind!=='record'){p.lastReward=S.turn;p.rewardedMerit=p.merit;}
 officialRecord(e.c,e.role,text,{emotion:kind==='record'?0:.7});
 if(!e.outside&&kind!=='record')officialFamilyReaction(e,'reward',text);
 return text;
}
function frontierRewardEvent(r){
 if(!frontierCanReward(r))return null;const e=frontierEntry(r.commander),promo=frontierPromotion(e);
 return {title:'北境论功行赏',por:e.p,valid:()=>frontierCanReward(r),
  text:`${r.post}${r.name}领兵出征，王师告捷。功册核实后，他卸甲入殿听赏。${e.outside?'':`\n他是${fullName(e.c)}的${officialKinLabel(e.h,e.role,e.c)}，家眷也盼着他的消息。`}`,choices:[
   ...(promo?[{t:promo.honor?`加封${promo.next}`:`晋为${promo.next}`,f:()=>frontierReward(r,'promotion')}]:[]),
   {t:'赐金银绢帛 · 国库−30',cond:()=>E().treasury>=30,why:'国库不足',f:()=>frontierReward(r,'silver')},
   {t:'问卿所欲，听他亲口请赏',f:()=>{if(!frontierCanReward(r))return null;if(!r.asked){r.asked=true;officialRecord(e.c,e.role,'陛下问其所欲，准许亲口陈说战后所求。');}pushNow(frontierRequestEvent(r));return null;}},
   {t:'记功，暂不封赏',f:()=>frontierReward(r,'record')},
   {t:'稍后论赏',f:()=>{if(frontierCanReward(r)&&!r.deferred){r.deferred=true;officialRecord(e.c,e.role,'战后封赏留待再议，功册仍存理政处。');}return '可从理政页的北境军功册继续论赏。';}}
  ]};
}
function frontierRequestEvent(r){
 if(!frontierCanReward(r))return null;const e=frontierEntry(r.commander),d=frontierDaughter(e),promo=frontierPromotion(e);
 const daughter=r.request==='daughter'&&d&&d.id===r.daughter?.id;
 const quote=daughter?`臣有一女${d.name}，年${d.age}，尚未婚配。臣盼她能入宫侍奉，愿请陛下召见，容她亲自回话。`:
  r.request==='promotion'&&promo?`军功愿凭功册查验。臣愿再进一阶，仍替陛下守边，不负将士所托。`:
  '臣不求尚书郎，只愿领些金银绢帛，安顿家小，也让同行将士的家眷沾一分喜。';
 return {title:'将军所愿',por:e.p,ref:'《木兰诗》问所欲意境化用',valid:()=>frontierCanReward(r),text:`陛下问：“卿此番立功，可有所愿？”\n${e.p.name}俯身答道：“${quote}”`,choices:[
  ...(daughter?[{t:`召见${d.name}，先听她的心意`,f:()=>{if(!frontierCanReward(r))return null;pushNow(frontierDaughterEvent(r));return null;}}]:[]),
  ...(r.request==='promotion'&&promo?[{t:promo.honor?`准请，加封${promo.next}`:`准请，晋为${promo.next}`,f:()=>frontierReward(r,'promotion')}]:[]),
  {t:'赏金银，犒军并照拂家小 · 国库−30',cond:()=>E().treasury>=30,why:'国库不足',f:()=>frontierReward(r,'silver')},
  {t:'另按功册定赏',f:()=>{if(frontierCanReward(r))pushNow(frontierRewardEvent(r));return null;}}
 ]};
}
function frontierDaughterEvent(r){
 if(!frontierCanReward(r))return null;const e=frontierEntry(r.commander),d=frontierDaughter(e);
 if(!d||d.id!==r.daughter?.id)return frontierRewardEvent(r);
 const g=d.g,valid=()=>frontierCanReward(r)&&frontierDaughter(frontierEntry(r.commander))?.id===d.id;
 const willing=g.willing!==false;
 const decline=()=>{if(!valid())return null;g.frontierDeclined=true;officialRecord(e.c,e.role,`${d.name}未留宫，军功仍凭功册另议，不因荐女未成而抹去。`);story(g,'因父亲军功获召入见，未留宫，仍归家中生活。');pushNow(frontierRewardEvent(r));return null;};
 return {title:'功臣荐女',por:d.kind==='natal'?natalPortrait(g):g,valid,
  text:`${e.p.name}之女${d.name}，${d.age}岁，${g.trait}，奉召入见。${d.kind==='natal'?`她也是${fullName(e.c)}的${natalLabel(e.c,g)}，宫里已有这一重亲缘。`:g.story[0]?.t||''}\n${willing?'她听清留宫之意，思量后愿意留下。':'她行礼谢过父亲与陛下，仍坦言更愿在宫外过自己的日子。'}\n将领的军功另有功册，不以她是否入宫作抵。`,choices:[
   ...(willing?[{t:'依她心意，纳为常在',cond:()=>rankCount(2)<RANK_CAP[2],why:'常在位分已满',f:()=>{
    if(!valid()||g.willing===false||rankCount(2)>=RANK_CAP[2])return null;
    const admitted=d.kind==='natal'?makeNatalConsort(e.c,g):g;
    if(d.kind==='guest')admitted.fam.t=e.p.office||e.p.post;
    addConsort(admitted,2,`父亲${e.p.name}北境立功，奉召入见后自愿留宫`);
    // Once admitted, the palace person owns this household. Do not serialize a second
    // mutable copy under the guest list: it would diverge on the next journal replay.
    if(d.kind==='guest')S.flags.frontierHouses=(S.flags.frontierHouses||[]).filter(x=>x.guest.id!==admitted.id);
    story(admitted,`父亲${e.p.name}出征北境告捷，御前请荐；本人入见后愿意留下，册为常在。`);
    if(d.kind==='natal')g.story=admitted.story.map(x=>({...x}));
    r.daughterAdmitted=admitted.id;r.request='silver';
    officialRecord(e.c,e.role,`女儿${fullName(admitted)}奉召入见，自愿留宫，册为常在；本次军功仍另行论赏。`,{emotion:.6});
    pushNow(frontierRewardEvent(r));return `${fullName(admitted)}受封常在，依例安排宫室。${e.p.name}的军功另待论赏。`;
   }}]:[]),
   {t:willing?'不留宫，仍按军功另赏':'尊重她的心意，另行赏功',f:decline}
  ]};
}
A.frontierReward=function(id){if(!modalOpen)pushEv(frontierRewardEvent(frontierRecord(id)));};
A.frontierGeneral=function(id){
 if(modalOpen)return;const r=frontierRecord(id),e=r&&frontierEntry(r.commander);if(!e)return;
 pushEv({title:e.p.name+' · 军中履历',por:e.p,text:`${e.p.office||e.p.post}${e.p.honor?' · '+e.p.honor:''} · ${e.p.age}岁\n${e.p.story.map(s=>s.d+'：'+s.t).join('\n')}`,choices:[{t:'阅毕'}]});
};
function frontierPanel(){
 const records=(S.flags.frontierCampaigns||[]).filter(r=>r.gen===S.gen);if(!records.length)return '';
 const shown=[...new Set([...records.filter(r=>!r.reward&&r.outcome==='victory'),...records.slice(-3)])];
 return `<section class="detail-section"><h3>北境军功册</h3>${shown.map(r=>`<p>${esc(r.date)} · ${esc(r.name)} · ${r.outcome==='victory'?'王师告捷':'出征失利'}</p><p class="hint">${esc(r.reward?.text|| (r.outcome==='victory'?'军功待赏':'失利缘由已记入履历'))}</p><div class="acts"><button class="btn sm" onclick="A.frontierGeneral('${r.id}')">查看将领履历</button>${frontierCanReward(r)?`<button class="btn sm gold" onclick="A.frontierReward('${r.id}')">继续论功行赏</button>`:''}</div>`).join('')}</section>`;
}
const frontierGovernment=viewGovernment;
viewGovernment=function(...args){return frontierGovernment.apply(this,args)+frontierPanel();};
const frontierNorthern=COURT[1];
COURT[1]=function(brief){
 const ev=frontierNorthern(brief);if(!frontierRewardsEnabled())return ev;
 let sent=false;const once=(get,options)=>()=>{if(sent)return null;const e=get();if(!e||!officialServing(e.p)||!officialMilitary(e.p,e.h)||e.p.report)return null;sent=true;return frontierDispatch(e,options);};
 ev.choices[0].f=once(frontierPickCommander,{odds:S.flags.wolf?.35:.6});
 const c=byId(ev.person),h=c&&houseOf(c),role=h&&(brotherRole(h,p=>officialServing(p)&&officialMilitary(p,h))||'father'),e=c&&{c,h,role,p:officialPerson(h,role),key:c.id+':'+role};
 if(ev.choices[3]&&e){ev.choices[3].person=e.p;ev.choices[3].cond=()=>officialServing(e.p)&&officialMilitary(e.p,e.h)&&!e.p.report;ev.choices[3].f=once(()=>e,{cost:250,odds:.75,named:true});}
 delete ev.person;ev.cast=[];return ev;
};
const frontierCourtTick=courtTick;
courtTick=function(...args){
 const result=frontierCourtTick.apply(this,args);if(!frontierRewardsEnabled())return result;
 for(const x of S.flags.frontierHouses||[]){if(byId(x.guest.id))continue;const years=Math.floor((S.turn-x.agedAt)/12);if(years>0){x.guest.age+=years;x.guest.house.father.age+=years;x.agedAt+=years*12;}}
 return result;
};
