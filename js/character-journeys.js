/* Durable, optional multi-chapter lives coexist with the original assigned arc. */
const journeyPeople=()=>[...S.consorts,...(S.shelteredGuests||[])];
const journeyPerson=id=>journeyPeople().find(c=>c.id===id);
function journeyBinding(c,id){
 const gate=CHARACTER_JOURNEYS[id]?.gate;if(!gate)return null;
 const children=maternalChildren(c).filter(k=>!k.pendingName&&c.age>=kidAge(k)+14);
 const child=children.find(k=>gate==='bereaved'?!k.alive&&!k.lost&&S.turn-(c.maternalLife?.children?.[k.id]?.since??S.turn)>=3:
  familyVisitAllowed(k,c)&&(gate==='quietChild'?kidAge(k)>=3&&kidAge(k)<12:kidAge(k)>=12));
 const simple={letters:['才女','聪慧','好学'].includes(c.trait),craft:c.trait==='巧手'||consortHobby(c)==='刺绣',merchant:c.fam.t==='皇商',humble:c.fam.p<=20&&!c.rescue&&!c.rescuedGuest,noble:c.fam.p>=60&&['骄矜','才女','持重'].includes(c.trait),medical:c.fam.t==='太医院院判'||c.trait==='好学'&&c.hp<60};
 if(gate in simple)return simple[gate]?{}:null;
 if(['quietChild','teenChild','bereaved'].includes(gate))return child&&(gate!=='quietChild'||isSolitary(c))?{child:child.id,childName:child.name}:null;
 if(gate==='rescued')return c.rescue&&c.rescue.trust>=50&&S.turn-c.rescue.at>=6?{}:null;
 if(c.rescuedGuest)return null;
 if(gate==='military'){const p=houseOf(c)?.father;return officialAlive(p)&&(/将|军|武/.test(p.office||p.post||'')||c.fam.t==='镇国大将军')?{role:'father',person:p.id,personName:p.name}:null;}
 if(gate==='five')return fiveBrotherFamily(c)?{}:null;
 if(gate==='sister'){const other=S.consorts.find(o=>o!==c&&inPalace(o)&&c.kin?.[o.id]);return other?{sister:other.id,personName:fullName(other)}:null;}
 return null;
}
function journeyEligible(c,id){return !!(c&&inPalace(c)&&!c.maid&&c.age>=18&&c.aff>=35&&S.turn-(c.enteredAt??S.turn)>=6&&journeyBinding(c,id));}
function journeyStart(c,id){
 if(!journeyEligible(c,id)||c.journeys?.current||c.journeys?.seen?.[id]!==undefined||S.turn-(c.journeys?.lastEnd??-99)<12)return false;
 const h=c.journeys||={seen:{},history:[],lastEnd:-99};
 h.current={id,stage:0,due:S.turn,choices:[],notes:[],binding:journeyBinding(c,id)};return true;
}
function journeyCastValid(c,r){
 const b=r.binding||{};
 if(b.person){const p=houseOf(c)?.[b.role];if(!p||p.id!==b.person||!officialAlive(p)||p.exiled)return false;}
 if(b.sister&&!inPalace(byId(b.sister)))return false;
 if(b.child){const k=kidById(b.child);if(!k||!maternalChildren(c).includes(k))return false;
  if(r.id==='keepsake')return !k.alive&&!k.lost;
  return familyVisitAllowed(k,c)&&(r.id!=='quietChild'||kidAge(k)<12);}
 return true;
}
function journeyText(c,r,text){return text.replaceAll('{child}',r.binding.childName||'孩子').replaceAll('{person}',r.binding.personName||'家人').replaceAll('{prior}',r.notes.at(-1)||'');}
function journeyRecord(c,r,text,outcome){
 const h=c.journeys,e={id:r.id,turn:S.turn,d:dateStr(),title:CHARACTER_JOURNEYS[r.id].name,chapter:r.stage,text,outcome};
 h.history.push(e);const chapter=CHARACTER_JOURNEYS[r.id].chapters[r.stage]?.[0]||'';
 const entry=`【${e.title}${outcome?'·'+outcome:''}】${chapter}。${text}`;story(c,entry);
 if(!outcome||outcome!=='未竟'){
  const child=r.binding.child&&kidById(r.binding.child),sister=r.binding.sister&&byId(r.binding.sister);
  if(child?.alive&&familyVisitAllowed(child,c))kstory(child,`与${fullName(c)}有关的共同经历：${entry}`);
  if(inPalace(sister))story(sister,`与${fullName(c)}的姐妹往来：${entry}`);
 }
 NPCMemory.record(S,{type:'character-journey',time:S.turn,location:c.palace,participants:[c.id,...(r.binding.child?[r.binding.child]:[])],outcome:text},[{person:c.id,subject:'emperor',interpretation:text,emotion:.35,impact:75}]);
}
function journeyEnd(c,r,text,outcome){journeyRecord(c,r,text,outcome);c.journeys.seen[r.id]=S.turn;c.journeys.lastEnd=S.turn;delete c.journeys.current;}
function journeyEvent(c){
 const r=c?.journeys?.current;if(!r||!inPalace(c)||S.turn<r.due||S.over)return null;
 const stage=r.stage,def=CHARACTER_JOURNEYS[r.id],valid=()=>inPalace(c)&&c.journeys?.current===r&&r.stage===stage&&S.turn>=r.due;
 if(!def)return null;
 if(!journeyCastValid(c,r))return {title:def.name+' · 时移事易',por:c,present:[c],valid,text:`${r.binding.childName||r.binding.personName||'当初的人'}如今的处境已经不同。她没有把旧约移交给另一个人，想将这段尚未说完的事留在纪事里。`,choices:[{t:'听她说完，保留未竟之事',f:()=>{if(!valid())return null;const text='人物处境变化，原来的约定停在此处，没有虚构会面或替换参与者。';journeyEnd(c,r,text,'未竟');save('auto');return text;}}]};
 const chapter=def.chapters[stage];
 return {title:def.name+' · '+chapter[0],por:c,present:[c],valid,ref:def.source,text:journeyText(c,r,chapter[1]),choices:[...chapter[2].map((label,i)=>({t:label+' · 精力−1',cond:()=>E().energy>0,f:()=>{
  if(!valid()||!journeyCastValid(c,r)||!useE())return null;
  let text=journeyText(c,r,chapter[3][i]);r.choices.push(i);r.notes.push(text);cchg(c,{aff:i===0?4:1,mood:i===0?3:1});
  if(stage===2){
   const followed=r.choices.filter(v=>v===0).length>=2&&i===0;
   if(r.id==='distantHome'){
    const verified=r.choices[0]===0&&r.choices[1]===0;
    c.rescue.familyContact=verified?'confirmed':'uncertain';
    if(!verified)text='回音还无法与旧日细节相互印证，她留下线索，没有把陌生人冒认作亲人。';
    else text=i===0?'远方亲人的回信核实了旧名与织纹，往来的信路终于接上。她可以继续通信，也可以请求归乡。':'回音已经核实，她暂未决定是否继续通信，但知道归去的路仍在。';
    journeyEnd(c,r,text,verified?def.endings[0]:def.endings[1]);
   }else{
    if(r.id==='keepsake'){const care=c.maternalLife?.children?.[r.binding.child];if(care){care.care+=2;if(i===1)care.retreat=solitaryDao(c)?'静室问道':c.t2==='信佛'||c.like==='佛经'?'青灯诵经':'闭门静养';}}
    journeyEnd(c,r,text,def.endings[followed?0:1]);
   }
  }else{journeyRecord(c,r,text);r.stage++;r.due=S.turn+3;}
  save('auto');return text+(stage<2?'\n三个月后，再来听她的后话。':'');
 }})),{t:'留待下回谈'}]};
}
function journeyTick(){
 const pace=S.flags.journeyPace||={last:-99,topics:{}};
 if(S.over||S.turn-pace.last<6||journeyPeople().filter(c=>c.journeys?.current).length>=2)return;
 const choices=[];
 for(const c of journeyPeople())if(!c.journeys?.current&&S.turn-(c.journeys?.lastEnd??-99)>=12)for(const id of Object.keys(CHARACTER_JOURNEYS))if(c.journeys?.seen?.[id]===undefined&&S.turn-(pace.topics[id]??-99)>=36&&journeyEligible(c,id))choices.push({c,id});
 if(!choices.length||!chance(.6))return;const {c,id}=pick(choices);if(journeyStart(c,id)){pace.last=S.turn;pace.topics[id]=S.turn;}
}
function journeyPanel(c){
 const h=c.journeys,r=h?.current;
 const available=!r&&S.turn-(h?.lastEnd??-99)>=12?Object.keys(CHARACTER_JOURNEYS).filter(id=>h?.seen?.[id]===undefined&&journeyEligible(c,id)).slice(0,3):[];
 if(!r&&!h?.history.length&&!available.length)return '';
 return `<section class="personal-experience"><h3>人生长卷</h3>${r?`<p><strong>${CHARACTER_JOURNEYS[r.id].name}</strong> · 第${cnNum(r.stage+1)}章 / 三章</p>${inPalace(c)?`<button class="btn jade" onclick="A.journeyTalk(${c.id})" ${journeyEvent(c)?'':'disabled'}>${journeyEvent(c)?'听她说后来的事 →':`再过${Math.max(0,r.due-S.turn)}个月`}</button>`:'<p class="hint">暂不在宫中，待能相见时再续。</p>'}`:available.map(id=>`<button class="btn" onclick="A.journeyBegin(${c.id},'${id}')">谈谈「${CHARACTER_JOURNEYS[id].name}」</button>`).join('')}${(h?.history||[]).slice(-3).reverse().map(e=>`<p>${esc(e.d)} · ${esc(e.title)}${e.outcome?' · '+esc(e.outcome):''}<br>${esc(e.text)}</p>`).join('')}</section>`;
}
function journeyVoice(c){const e=c.journeys?.history?.at(-1);return e?voiceLine('journey-'+e.id,`她又提起「${e.title}」。`,e.text):null;}
function journeyLeads(){return S.consorts.filter(c=>journeyEvent(c)).map(c=>({place:PLACES.find(p=>p.k==='palace'&&p.p===c.palace)?.id,person:c,title:CHARACTER_JOURNEYS[c.journeys.current.id].name,text:`${cName(c)}的故事有了后话。`,cast:[c]}));}
A.journeyBegin=function(id,topic){if(modalOpen)return;const c=journeyPerson(id);if(journeyStart(c,topic))pushEv(journeyEvent(c));};
A.journeyTalk=function(id){if(modalOpen)return;const ev=journeyEvent(journeyPerson(id));if(ev)pushEv(ev);};
