/* Small, sourced stories live in places and profiles, not the mandatory queue.
   Saved episodes contain IDs and choices only. No timers, callbacks or rerolls. */
const historyTemper=(k,...values)=>values.includes(childDisposition(k));
const historyTrait=(c,...values)=>values.includes(c.trait);
const historyPresent=p=>p?.sex?childInPalace(p)&&!p.pendingName:inPalace(p)&&!p.maid;
const historyPeople=()=>[...S.consorts,...S.children];
const historyPerson=id=>byId(id)||kidById(id);
const historyAge=p=>p.sex?kidAge(p):p.age;
const historyName=p=>p.sex?kidName(p):cName(p);
const historyState=p=>p?.livingHistory;
// Discovery has its own deterministic ordering, so adding quiet stories does
// not consume the RNG used by childbirth, disasters or mandatory monthly events.
const historyOrder=(items,salt)=>items.map(item=>({item,order:voiceHash(`${S.gen}:${S.turn}:${salt}:${item.id}`)})).sort((a,b)=>a.order-b.order).map(x=>x.item);
function historyFits(p,role){
  return historyPresent(p)&&!!p.sex===(role.kind==='child')&&
    p.hp>=(role.minHp??40)&&
    historyAge(p)>=(role.min??18)&&historyAge(p)<=(role.max??100)&&
    (!role.sex||p.sex===role.sex)&&(!role.fit||role.fit(p));
}
function historyOthers(p,rule){
  return rule.other?historyPeople().filter(o=>o!==p&&historyFits(o,rule.other)&&(!rule.other.with||rule.other.with(o,p))):[];
}
function historyEligible(p,rule){
  return !!rule&&historyFits(p,rule)&&(!rule.months||rule.months.includes(S.month))&&
    (!rule.guard||rule.guard(p))&&(!rule.other||historyOthers(p,rule).length>0);
}
function offerHistory(p,rule,other){
  if(S.over||mourningActive()||!historyEligible(p,rule)||historyState(p)?.current||historyState(p)?.seen?.[rule.id]!==undefined)return false;
  const o=rule.other?(other||historyOthers(p,rule)[0]):null;
  if(rule.other&&!historyOthers(p,rule).includes(o))return false;
  if(historyPeople().some(x=>{const c=historyState(x)?.current;return c&&(c.other===p.id||o&&(x===o||c.other===o.id))}))return false;
  const state=p.livingHistory||={seen:{},history:[],lastEnd:-99};
  state.current={id:rule.id,other:o?.id??null,stage:'offered',offered:S.turn,gen:S.gen};
  return true;
}
function historyScene(p){
  const current=historyState(p)?.current,rule=current&&LIVING_STORIES.find(r=>r.id===current.id);
  if(!rule||current.gen!==S.gen||!historyPresent(p)||historyPerson(p.id)!==p||p.hp<40||mourningActive())return null;
  if(rule.ongoing&&!rule.ongoing(p))return null;
  const other=current.other==null?null:historyPerson(current.other);
  if(rule.other&&(!historyFits(other,{kind:rule.other.kind,min:0,minHp:rule.other.minHp})||
    (rule.other.ongoing&&!rule.other.ongoing(other,p))))return null;
  // A later birthday does not erase work already undertaken; an unaccepted
  // invitation must still fit its original age, season and authority.
  if(current.stage==='offered'&&(!historyEligible(p,rule)||S.turn-current.offered>5||
    (rule.other&&(!historyFits(other,rule.other)||rule.other.with&&!rule.other.with(other,p)))))return null;
  return {person:p,other,current,rule};
}
function historyText(text,p,o){return typeof text==='function'?text(p,o):text;}
function historyApply(p,values){
  const labels={lit:'才学',mar:'武艺',vir:'品德',love:'父爱',amb:'野心',talent:'才情',virtue:'德行',scheme:'心机',aff:'情分',mood:'心情',favor:'恩宠'};
  const changes=[];
  for(const [key,amount] of Object.entries(values||{})){
    if(!Object.hasOwn(labels,key))continue;
    const before=p[key];p[key]=clamp((before??0)+amount);const delta=rd(p[key]-(before??0));
    if(delta)changes.push(labels[key]+(delta>0?'+':'')+delta);
  }
  return changes.length?historyName(p)+'：'+changes.join(' · '):'';
}
function recordHistory(p,other,rule,text,memory,otherMemory){
  const cast=[p,other].filter(Boolean);
  for(const person of cast)(person.sex?kstory:story)(person,`【宫中故事·${rule.title}】${text}`);
  NPCMemory.record(S,{type:'living-history',time:S.turn,location:PLACES.find(q=>q.id===rule.place)?.n||'宫中',participants:cast.map(x=>x.id),outcome:text},
    cast.map((person,index)=>({person:person.id,subject:index===0?(other?.id??'emperor'):p.id,
      interpretation:index===0?memory:otherMemory||`我与${historyName(p)}经历了「${rule.title}」。${text}`,emotion:.3,impact:65})));
}
function endHistory(p,result,keepMemory=true){
  const scene=historyScene(p);if(!scene)return null;
  const {other,rule,current}=scene,choice=rule.choices[current.choice],h=historyState(p);
  if(keepMemory&&(current.stage!=='working'||!choice||S.turn<current.due)||!keepMemory&&current.stage!=='offered')return null;
  const memory=choice?historyText(choice.memory,p,other):result;
  h.history.push({id:rule.id,title:rule.title,turn:S.turn,d:dateStr(),text:result,memory,other:other?.id??null,choice:current.choice??null});
  if(h.history.length>20)h.history.shift();
  h.seen[rule.id]=S.turn;h.lastEnd=S.turn;delete h.current;
  if(keepMemory)recordHistory(p,other,rule,result,memory,choice&&historyText(choice.otherMemory,p,other));
  save('auto');return result;
}
function chooseHistory(p,index){
  const scene=historyScene(p);if(!scene||scene.current.stage!=='offered'||S.over)return null;
  const {other,rule,current}=scene,choice=rule.choices[index];if(!choice)return null;
  if(E().energy<1||E().treasury<(choice.cost||0)){toast('精力或国库不足');return null;}
  if(!useE())return null;
  current.choice=index;current.stage='working';current.due=S.turn+(rule.delay||2);
  const changes=[choice.cost?chg({treasury:-choice.cost}):'',historyApply(p,choice.stats),other?historyApply(other,choice.otherStats):'',choice.court?chg(choice.court):''];
  if(other&&choice.relation){relAdd(p,other,choice.relation);changes.push('两人关系'+(choice.relation>0?'+':'')+choice.relation);}
  const result=historyText(choice.result,p,other);
  (p.sex?kstory:story)(p,`【${rule.title}】${choice.label}。${result}`);
  save('auto');
  return result+`\n${current.due-S.turn}个月后，可再来听这件事的后话。`+fx(...changes);
}
function historyEvent(p){
  const scene=historyScene(p);if(!scene)return null;
  const {other,rule,current}=scene,source=LIVING_SOURCES[rule.source];
  const stage=current.stage;
  const valid=()=>historyScene(p)?.current===current&&current.stage===stage&&!S.over;
  const common={cast:[p,other].filter(Boolean),present:rule.remoteOther?[p]:[p,other].filter(Boolean),valid,
    ref:source.name+' · '+source.kind+(rule.source==='original'?'':'，剧情改编'),refURL:source.url};
  if(current.stage==='offered')return {...common,title:rule.title,
    text:historyText(rule.begin,p,other)+'\n\n'+source.note,
    choices:[...rule.choices.map((choice,index)=>({t:choice.label+'（精力−1'+(choice.cost?'，国库−'+choice.cost+'万两':'')+'）',
      preview:choice.preview,cond:()=>valid()&&E().energy>0&&E().treasury>=(choice.cost||0),why:'精力或国库不足',f:()=>chooseHistory(p,index)})),
      {t:'先不打断，改日再来'},{t:'让这件事暂且过去',f:()=>valid()?endHistory(p,'这次没有继续谈下去。',false):null}]};
  if(S.turn<current.due)return null;
  const choice=rule.choices[current.choice];if(!choice)return null;
  return {...common,title:rule.title+' · 后来',text:historyText(choice.later,p,other),choices:[
    {t:'听完后话，记下这一回',f:()=>valid()?endHistory(p,historyText(choice.later,p,other)):null},
    {t:'留着这段话，改日再听'}]};
}
A.historyScene=function(id,child){
  if(!S||S.over||modalOpen)return;
  const p=child?kidById(id):byId(id),event=historyEvent(p);if(event)pushEv(event);
};
function historyTick(){
  if(S.over)return;
  const people=historyPeople();
  for(const p of people){
    const h=historyState(p),c=h?.current;if(!c)continue;
    const other=c.other==null?null:historyPerson(c.other);
    const ended=c.gen!==S.gen||!p.alive||p.gone||(c.other!=null&&(!other||!other.alive||other.gone));
    if(ended||c.stage==='offered'&&S.turn-c.offered>5){
      h.lastEnd=S.turn;h.seen[c.id]=S.turn;delete h.current;
      if(c.stage==='working')(p.sex?kstory:story)(p,'人物际遇已变，先前约定的宫中故事未能续完。');
    }
  }
  if(mourningActive())return;
  const pace=S.flags.livingHistoryPace;
  if(pace?.gen===S.gen&&S.turn-pace.last<3)return;
  if(people.filter(p=>!!historyScene(p)).length>=3)return;
  const busy=new Set(people.flatMap(p=>{const c=historyState(p)?.current;return c?[p.id,c.other]:[]}).filter(id=>id!=null));
  const candidates=historyOrder(people.filter(p=>historyPresent(p)&&!busy.has(p.id)&&!p.personalExperiences?.current&&
    S.turn-(historyState(p)?.lastEnd??-99)>=12&&(p.sex||!['悲恸','心如死灰','惶恐'].includes(xinOf(p)))),'people');
  for(const p of candidates){
    const rules=historyOrder(LIVING_STORIES.filter(r=>historyEligible(p,r)&&historyState(p)?.seen?.[r.id]===undefined&&
      (pace?.gen!==S.gen||S.turn-(pace.topics[r.id]??-99)>=36)),p.id);
    for(const rule of rules){
      const other=rule.other?historyOthers(p,rule).find(o=>!busy.has(o.id)&&!o.personalExperiences?.current):null;
      if(rule.other&&!other)continue;
      if(!offerHistory(p,rule,other))continue;
      const next=pace?.gen===S.gen?pace:{gen:S.gen,last:-99,topics:{}};
      next.last=S.turn;next.topics[rule.id]=S.turn;S.flags.livingHistoryPace=next;return;
    }
  }
}
function historyPanel(p){
  const scene=historyScene(p),past=historyState(p)?.history?.at(-1);
  if(!scene&&!past)return '';
  const {rule,current,other}=scene||{},ready=scene&&!!historyEvent(p);
  return `<section class="living-history-note"><small class="history-eyebrow">宫中故事 · 典故生新枝</small>${scene?`<h3>${esc(rule.title)}${current.stage==='working'?' · 后话':''}</h3><p>${esc(current.stage==='offered'?historyText(rule.begin,p,other):ready?'先前的事已有了后话，对方想亲口说给你听。':'事情正在慢慢往前走，不必催促。')}</p><button class="btn sm jade" onclick="A.historyScene(${p.id},${!!p.sex})" ${ready?'':'disabled'}>${ready?(current.stage==='offered'?'走近听听':'听听后话')+' →':`约${current.due-S.turn}个月后再来`}</button>`:''}
    ${past?`<details><summary>曾经 · ${esc(past.title)}</summary><p>${esc(past.text)}</p></details>`:''}</section>`;
}
function historyAt(place){return historyPeople().filter(p=>historyScene(p)?.rule.place===place).map(historyPanel).join('');}
function historyLeads(){
  return historyPeople().filter(p=>!!historyEvent(p)).map(p=>{const {rule,other,current}=historyScene(p);return {
    place:rule.place,person:p,title:rule.title+(current.stage==='working'?' · 后来':''),
    text:`${historyName(p)}${current.stage==='working'?'还记得上回的约定，想说说后来。':'有了一件在意的事，正等你走近。'}`,cast:[p,other].filter(Boolean)};});
}
function historyVoice(p){
  const h=historyState(p)?.history?.at(-1);
  return h?.choice!=null&&S.turn-h.turn>=0&&S.turn-h.turn<=12?voiceLine('living-history',`想起「${h.title}」，${p.sex==='m'?'他':'她'}又说了一句。`,h.memory):null;
}
