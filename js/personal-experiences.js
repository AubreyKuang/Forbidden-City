/* Optional personal episodes: one invitation, a later response, durable consequences. */
const EXPERIENCE_GROUPS={
  ink:{name:'诗书与自我表达',stat:'talent',fit:c=>['才女','好学','聪慧'].includes(c.trait)||consortHobby(c)==='读书'},
  craft:{name:'技艺与传承',stat:'talent',fit:c=>['巧手','才女'].includes(c.trait)||['刺绣','抚琴'].includes(consortHobby(c))},
  garden:{name:'四时与心境',stat:'mood',fit:c=>['淡泊','沉静','活泼','体弱','痴情'].includes(c.trait)||consortHobby(c)==='侍花'},
  home:{name:'故园与亲情',stat:'virtue',fit:c=>c.age>=18&&c.aff>=35},
  agency:{name:'处事与边界',stat:'virtue',fit:c=>c.rank>=3&&['持重','聪慧','城府','爽直','骄矜','好客'].includes(c.trait)},
  growth:{name:'学习与成长',stat:'talent',fit:c=>c.talent<70||['好学','体弱','将门','温婉'].includes(c.trait)},
  mother:{name:'母子与放手',stat:'virtue',fit:c=>experienceChildren(c).length>0},
  fate:{name:'失意与重新出发',stat:'mood',fit:c=>c.favor<30||c.mood<40||['思念','委屈','悲恸','释然','怨恨'].includes(xinOf(c))}
};
const experienceChildren=c=>kidsAlive().filter(k=>(k.foster||k.mom)===c.id&&!k.pendingName&&childInPalace(k));
function experienceChildCandidates(c,episode){
  const n=Number(episode.id.slice(4));
  return experienceChildren(c).filter(k=>{
    const age=kidAge(k);
    return n===49||n===50?age>=3&&age<=8:n===51?age>=3:n===52||n===56?age>=12:age>=6;
  });
}
function experienceParticipants(c,episode,current){
  return current.childIds?current.childIds.map(id=>kidById(id)).filter(k=>k&&experienceChildren(c).includes(k)):
    experienceChildCandidates(c,episode).slice(0,episode.id==='life51'?2:1);
}
function experienceEligible(c,episode){
  if(!inPalace(c)||c.maid||!episode||!EXPERIENCE_GROUPS[episode.group].fit(c))return false;
  if(episode.group!=='mother')return true;
  return experienceChildCandidates(c,episode).length>=(episode.id==='life51'?2:1);
}
function experienceState(c){return c?.personalExperiences||null;}
function experienceRule(c){return PERSONAL_EPISODES.find(e=>e.id===experienceState(c)?.current?.id);}
function offerPersonalExperience(c,episode){
  if(!experienceEligible(c,episode))return false;
  const h=c.personalExperiences||={seen:{},history:[],lastEnd:-99};
  if(h.current||h.seen[episode.id]!==undefined)return false;
  h.current={id:episode.id,stage:'offered',offered:S.turn};
  if(episode.group==='mother')h.current.childIds=experienceChildCandidates(c,episode).slice(0,episode.id==='life51'?2:1).map(k=>k.id);
  return true;
}
function personalExperienceTick(){
  if(S.over)return;
  const pace=S.flags.personalExperiencePace||={last:-99,topics:{},lastGroup:null};
  if(S.turn-pace.last<3||harem().filter(c=>experienceState(c)?.current).length>=3)return;
  const people=harem().filter(c=>!c.maid&&!experienceState(c)?.current&&S.turn-(c.enteredAt??0)>=6&&S.turn-(experienceState(c)?.lastEnd??-99)>=12);
  if(!people.length||!chance(.65))return;
  const offered=[];
  for(const c of people){const episodes=PERSONAL_EPISODES.filter(e=>experienceEligible(c,e)&&experienceState(c)?.seen?.[e.id]===undefined&&S.turn-(pace.topics[e.id]??-99)>=48);if(episodes.length)offered.push({c,episodes});}
  if(!offered.length)return;
  const {c,episodes}=pick(offered),different=episodes.filter(e=>e.group!==pace.lastGroup),episode=pick(different.length?different:episodes);
  if(offerPersonalExperience(c,episode)){pace.last=S.turn;pace.topics[episode.id]=S.turn;pace.lastGroup=episode.group;}
}
function endPersonalExperience(c,episode,result,outcome){
  const h=experienceState(c),current=h?.current;if(!current||current.id!==episode.id)return;
  h.seen[episode.id]=S.turn;h.lastEnd=S.turn;h.history.push({id:episode.id,title:episode.title,turn:S.turn,d:dateStr(),outcome,t:result});
  if(h.history.length>24)h.history.shift();delete h.current;
  story(c,`【个人经历·${episode.title}】${result}`);
  remember(c,'personal-experience',`${episode.title}：${result}`);
}
function personalExperienceEvent(c){
  const h=experienceState(c),current=h?.current,episode=experienceRule(c);if(!current||!episode||!inPalace(c))return null;
  const valid=()=>inPalace(c)&&experienceState(c)?.current===current&&(episode.group!=='mother'||experienceParticipants(c,episode,current).length>=(episode.id==='life51'?2:1));
  if(!valid())return null;
  const source=EXPERIENCE_SOURCES[episode.source],ref=source.name+' · 意象改编';
  if(current.stage==='offered')return {title:episode.title,por:c,present:[c],valid,ref,text:`${cName(c)}：\n${episode.begin}\n她想听听你的意思，也希望保留自己作主的余地。`,choices:[
    {t:episode.action+' · 精力−1',cond:()=>valid()&&E().energy>0,why:'精力不足',f:()=>{
      if(!valid()||!useE())return null;
      current.stage='working';current.due=S.turn+ri(2,4);current.skill=c[EXPERIENCE_GROUPS[episode.group].stat]??50;
      story(c,`【个人经历·${episode.title}】陛下答应${episode.action}，她开始着手。`);save('auto');return `她开始按自己的想法做这件事。约${current.due-S.turn}个月后，可来听她的后话。`;
    }},
    {t:'让她按自己的步调来',f:()=>{if(!valid())return null;endPersonalExperience(c,episode,episode.privateResult,'自主');cchg(c,{aff:2,mood:2});save('auto');return episode.privateResult;}},
    {t:'暂不谈此事',f:()=>{if(!valid())return null;endPersonalExperience(c,episode,'她收起了这个念头，暂时没有继续。','搁置');cchg(c,{aff:-1});save('auto');return '她没有再追问，这次未完的心愿留在了纪事里。';}}
  ]};
  if(S.turn<current.due)return null;
  return {title:episode.title+' · 后话',por:c,present:[c],ref,valid,text:`先前说好的事，${cName(c)}已有了新的进展。她把这些日子的所得与难处都留着，等你来听。`,choices:[
    {t:'听她慢慢说完',f:()=>{if(!valid())return null;
      const success=chance(.4+current.skill/220),result=success?episode.success:episode.setback,stat=EXPERIENCE_GROUPS[episode.group].stat;
      endPersonalExperience(c,episode,result,success?'有所成':'有遗憾');c[stat]=clamp(c[stat]+(success?3:1));cchg(c,{aff:success?5:3,mood:success?6:1});
      if(episode.group==='mother')for(const k of experienceParticipants(c,episode,current)){k.vir=clamp(k.vir+2);const bonds=k.motherBonds||={};const b=bonds[c.id]||={trust:childTrust(k,c)};b.trust=clamp(b.trust+4);b.turn=S.turn;b.activity=episode.title;b.motherView=result;kstory(k,`母亲${fullName(c)}在「${episode.title}」中学着更认真听我的想法。`);}
      save('auto');return result+fx(`${{talent:'才情',virtue:'德行',mood:'心情'}[stat]}+${success?3:1} · 情分+${success?5:3}`);
    }},
    {t:'让她先保管好，改日再听'}
  ]};
}
A.personalExperience=function(id){if(modalOpen)return;const ev=personalExperienceEvent(byId(id));if(ev)pushEv(ev);};
function personalExperiencePanel(c){
  const h=experienceState(c),e=experienceRule(c);if(!h)return '';
  const current=h.current,ready=!!personalExperienceEvent(c),waiting=current&&current.stage==='working'&&S.turn<current.due;
  return `<section class="personal-experience"><h3>她自己的事</h3>${e?`<p><strong>${esc(e.title)}</strong> · ${esc(EXPERIENCE_GROUPS[e.group].name)}</p><p>${esc(current.stage==='offered'?e.begin:ready?'先前的事已有后话，等你来听。':'她正按自己的步调做这件事。')}</p>${inPalace(c)?`<button class="btn jade" onclick="A.personalExperience(${c.id})" ${ready?'':'disabled'}>${ready?'听她说说 →':waiting?`约${current.due-S.turn}个月后再来`:'孩子暂不便参与，陪伴暂缓'}</button>`:'<p class="hint">眼下不便相见，这段经历暂缓。</p>'}`:''}
    ${h.history.length?`<ul class="story">${h.history.slice(-2).reverse().map(r=>`<li><time>${esc(r.d)}</time><strong>${esc(r.title)} · ${esc(r.outcome)}</strong> ${esc(r.t)}</li>`).join('')}</ul>`:''}</section>`;
}
function personalExperienceLeads(){
  return harem().filter(c=>!!personalExperienceEvent(c)).map(c=>({place:PLACES.find(p=>p.k==='palace'&&p.p===c.palace)?.id,person:c,title:experienceRule(c).title,text:`${cName(c)}有件自己的事想同你说。`,cast:[c]}));
}
