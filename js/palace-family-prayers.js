/* Family facts create intentions. Prayer stays within the palace and does not decide medical outcomes. */
const palacePrayersActive=()=>!!S&&!PalaceActions.blocked&&!S.over&&journalContentVersion()>=22;
function prayerKin(c,state=S){
 const house=c.house,list=[];
 if(house){for(const role of ['father',...brotherRoles(house)]){const p=house[role];if(p)list.push({p,relation:role==='father'?'父亲':p.age>=c.age?'兄长':'弟弟'});}
  for(const p of house.relatives||[]){if(p.consortId||p.parentRelativeId)continue;list.push({p,relation:p.sex==='f'?(p.age>=c.age?'姐姐':'妹妹'):(p.age>=c.age?'兄长':'弟弟')});}}
 for(const p of state.consorts||[]){if(p.id===c.id)continue;if(c.kin?.[p.id]||c.house?.father?.id&&c.house.father.id===p.house?.father?.id)list.push({p,relation:c.kin?.[p.id]||(p.age>=c.age?'姐姐':'妹妹')});}
 for(const p of state.children||[])if(p.mom===c.id||p.foster===c.id)list.push({p,relation:p.sex==='f'?'女儿':'儿子'});
 const m=homeMother(c);if(m)list.push({p:{...m,id:'mother:'+c.id,name:m.name||'母亲',alive:m.status!=='dead'&&m.status!=='deceased',story:m.story||[]},relation:'母亲'});
 return list.filter((e,i)=>list.findIndex(o=>o.p.id===e.p.id)===i);
}
function prayerFact(c,n){const e=prayerKin(c).find(e=>String(e.p.id)===String(n.person));if(!e)return null;
 if(n.kind==='death')return e.p.alive===false?e:null;
 return e.p.alive!==false&&(e.p.natalPregnancy||e.p.preg>=2)?e:null;
}
function palacePrayerChanges(previous){
 if(!palacePrayersActive())return;
 for(const c of S.consorts){if(!c.alive||c.gone||c.maid)continue;const h=c.palacePrayers||{seen:{},intentions:[]},old=previous?.consorts?.find(x=>x.id===c.id),before=old?prayerKin(old,previous):[];
  for(const e of prayerKin(c)){const p=e.p,prior=before.find(x=>x.p.id===p.id)?.p;let kind,key;
   if(p.alive===false&&(prior?.alive!==false&&prior||p.death?.turn!=null&&S.turn-p.death.turn<=6||recentRecoveryStory(p,/病逝|亡故|薨逝|去世|难产身亡/,6)!==null)){kind='death';key='death:'+p.id;}
   else if(p.alive!==false&&/姐妹|姐姐|妹妹/.test(e.relation)&&(p.natalPregnancy||p.preg>=2)){kind='pregnancy';key='pregnancy:'+p.id+':'+(p.natalPregnancy?.conceived??(p.pregnancyCalendar?.conceived??S.turn-p.preg));}
   if(!key||h.seen[key])continue;c.palacePrayers=h;h.seen[key]=true;h.intentions.push({key,kind,person:p.id,name:p.name||fullName(p),relation:e.relation,turn:S.turn});
  }
 }
}
function prayerPlace(c){return c.preg>=7||!!consortRecovery(c)||(c.hp??100)<55||c.illnessRecovery&&S.turn<c.illnessRecovery.until?'home':c.t2==='信佛'||c.like==='佛经'?'buddha':daoInterest(c)>0?'dao':voiceHash('prayer:'+c.id)%2?'buddha':'dao';}
const prayerPlaceName=(c,place)=>place==='home'?c.palace+'内':place==='buddha'?'慈宁宫偏殿佛堂':'钦安殿';
function palacePrayerReady(c){const a=c?.palacePrayers?.active;return !!(palacePrayersActive()&&inPalace(c)&&!c.maid&&a&&!a.greeted&&a.turn===S.turn&&prayerFact(c,a.intention));}
function palacePrayerTick(){
 if(!palacePrayersActive()||S.flags.prayerTick===S.turn)return;S.flags.prayerTick=S.turn;palacePrayerChanges();
 let count=0;for(const c of harem()){const h=c.palacePrayers;if(!h||S.turn-(h.last??-99)<4)continue;
  const options=h.intentions.filter(n=>!n.prayed&&S.turn-n.turn<=6&&prayerFact(c,n));if(!options.length||!chance(.24))continue;
  const n=options.find(n=>n.kind==='death')||pick(options),place=prayerPlace(c);n.prayed=S.turn;h.last=S.turn;h.active={turn:S.turn,place,intention:n,greeted:false};
  const text=`在${prayerPlaceName(c,place)}${place==='home'?'遥寄心愿':'点灯祈愿'}，${n.kind==='death'?'悼念已故的':'为'}${n.relation}${n.name}${n.kind==='death'?'，仍记挂旧日相处。':'与腹中孩子祈求平安。'}`;
  story(c,'【宫中寄愿】'+text);remember(c,'family-prayer',text);if(++count>=2)break;
 }
}
function palacePrayerWords(c,n){
 const e=prayerFact(c,n),who=n.relation==='母亲'?'母亲':n.relation+n.name;
 if(n.kind==='pregnancy'){const late=e.p.natalPregnancy?e.p.natalPregnancy.due-S.turn<=2:e.p.preg>=8;
  return `是为臣妾的${who}。${late?'家信说临盆就在近前了，':'听说她有了身孕，'}欢喜归欢喜，夜里总免不了牵挂。${['活泼','爽直','将门'].includes(c.trait)?'平时笑她爱操心，如今最坐不住的反倒是臣妾。':'臣妾不能在她身边，便在宫里为她与孩子求个平安。'}`;}
 return `臣妾在想${who}。${['活泼','爽直','将门'].includes(c.trait)?'从前总以为往后还有许多话能说，如今想起来，最舍不得的却是那些小事。':c.trait==='骄纵'||c.trait==='骄矜'?'从前在家里，许多任性都有人包容。如今连想赔一句不是，也不知该向哪里说。':c.trait==='好学'||c.trait==='才女'?'旧信翻了好几遍，本想把心事写下来，写到称呼处便停了。':'灯点上了，人却不会回来。臣妾只是想静静坐一会儿，也盼故人安宁。'}`;
}
function palacePrayerEvent(c){
 if(!palacePrayerReady(c))return null;const a=c.palacePrayers.active,n=a.intention,place=prayerPlace(c),master=place==='dao'?daoMaster():null;
 let done=false;const valid=()=>!done&&palacePrayerReady(c)&&c.palacePrayers.active===a;
 const finish=stay=>{if(!valid())return null;done=true;a.greeted=true;const words=palacePrayerWords(c,n),text=`陛下在${prayerPlaceName(c,place)}遇见自己，问起祈愿，便告诉他：“${words}”${stay?'陛下留下陪坐，听自己说完家人的事。':'陛下轻声问候，留自己安静寄愿。'}`;
  story(c,'【寄愿相逢】'+text);remember(c,'care',text);cchg(c,{mood:stay?4:2,aff:stay?3:1});return stay?'你陪她坐到灯火安稳，听她把那位家人的事说完。':'你轻声道了珍重，嘱咐宫人添一盏温茶。';};
 return {title:n.kind==='death'?'宫中寄愿 · 灯前故人':'宫中寄愿 · 盼一封平安信',por:c,cast:master?[master]:[],present:[c],valid,
  text:`你来到${prayerPlaceName(c,place)}，见${fullName(c)}${place==='home'?'将家信压在灯旁，在本宫静养遥祈':'点过灯，仍没有起身'}。\n你问她在为谁祈愿，她答：“${palacePrayerWords(c,n)}”${master?'\n'+master.name+'国师静听，叮嘱有孕者依医嘱照护，灯前的心愿可以寄托，不必拿吉凶吓自己。':''}`,
  choices:[{t:'留下陪她说说这位家人',f:()=>finish(true)},{t:'轻声问候，留她静静祈愿',f:()=>finish(false)}]};
}
A.prayerGreeting=function(id){if(modalOpen)return;const c=byId(id),ev=palacePrayerEvent(c);if(ev&&useE())pushEv(ev);};
function palacePrayerPanel(place,c){
 const people=c?[c]:harem();const available=people.filter(p=>palacePrayerReady(p)&&prayerPlace(p)===place);
 if(!available.length)return '';
 return detailSection(place==='home'?'本宫寄愿':place==='buddha'?'偏殿佛堂 · 为家人寄愿':'灯下寄愿',available.map(p=>`<article class="card">${porImg(p,92)}<div class="grow"><strong>${esc(fullName(p))}</strong><p>${place==='home'?'正在本宫静养，灯旁放着一封家信。':'正在灯前祈愿，似有家事挂心。'}</p><button class="btn jade" onclick="A.prayerGreeting(${p.id})">上前问候 · 精力−1</button></div></article>`).join(''));
}
const prayerChildLifeTick=childLifeTick;
childLifeTick=function(monthly=false){const result=prayerChildLifeTick();if(monthly)palacePrayerTick();return result;};
const prayerViewPlace=viewPlace;
viewPlace=function(){const html=prayerViewPlace();return !palacePrayersActive()?html:html+(UI.sel==='cn'?palacePrayerPanel('buddha'):UI.sel==='qa'?palacePrayerPanel('dao'):'');};
const prayerConsortView=viewConsort;
viewConsort=function(){const html=prayerConsortView(),c=byId(UI.sel);return html+(palacePrayersActive()&&c?palacePrayerPanel('home',c):'');};
const prayerRoutine=npcRoutine;
npcRoutine=function(c,roll){if(palacePrayerReady(c)){const place=prayerPlace(c);return {where:'family-prayer',dest:place==='home'?npcHome(c):PLACES.find(p=>p.id===(place==='dao'?'qa':'cn')).d};}return prayerRoutine(c,roll);};
const prayerRoutineText=npcRoutineText;
npcRoutineText=function(c,n){return n?.where==='family-prayer'&&palacePrayerReady(c)?`在宫内${prayerPlaceName(c,prayerPlace(c))}为家人寄愿`:prayerRoutineText(c,n);};
const prayerMeet=meetConsort;
meetConsort=function(c,...args){if(palacePrayerReady(c)){A.prayerGreeting(c.id);return;}return prayerMeet(c,...args);};
