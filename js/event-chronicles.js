/* Older ambient scenes keep a replayable account of the decision. Displayed
   participants and explicit chroniclePeople receive it; `present` can contain
   secret suspects and is never used as a list of people who know. */
function chronicleText(text){return String(text||'').split('\n').filter(line=>!line.startsWith('§')).join('\n').trim();}
function chronicleEvent(ev){
  if(!ev||ev.chronicled)return ev;
  ev.chronicled=true;let resolved=false;
  ev.choices=ev.choices.map(choice=>{
    if(!choice.f||choice.chronicle===false)return choice;
    const perform=choice.f;
    return {...choice,f:function(...args){
      if(resolved||!eventStillValid(ev)||choice.cond&&!choice.cond())return null;
      const people=[...new Set([...eventPortraits(ev),...(ev.chroniclePeople||[])])].filter(p=>p&&typeof p==='object'&&p.alive!==false);
      const before=new Map(people.map(p=>[p,p.story?.length||0]));
      const names=people.map(p=>({id:p.id,name:p.sex||!legacyPendingAction()&&p.official!==undefined?p.name:fullName(p)}));
      const situation=chronicleText(ev.text),decision=choice.t.replace(/\s*[（(·]\s*(?:精力|国库).*$/,'');
      const result=perform.apply(this,args);resolved=true;
      const outcome=chronicleText(typeof result==='string'?result:result?.text);
      for(const p of people){
        if(!S.consorts.includes(p)&&!S.children.includes(p)&&(legacyPendingAction()||p.official===undefined))continue;
        const entries=(p.story||[]).slice(before.get(p));
        let entry=entries.find(e=>!e.t.startsWith('【心境')),embedded=false;
        if(!entry){
          (p.sex?kstory:story)(p,`【${ev.title} · ${names.map(p=>p.name).join('、')}】${situation}\n陛下回应：${decision}。${outcome?'\n'+outcome:''}`);
          entry=p.story.at(-1);
          embedded=true;
        }
        entry.event={title:ev.title,participants:names,situation,choice:decision,outcome,embedded};
        // This is the player's historical record, not automatic private knowledge.
        // Subjective memories remain the responsibility of each scene's author.
      }
      return result;
    }};
  });
  return ev;
}
// Wrap after content registration, before the action journal captures actions.
for(const table of [QEV,XEV])for(const key of Object.keys(table)){
  const create=table[key];table[key]=(...args)=>chronicleEvent(create(...args));
}
const CHRONICLE_HAREM=new Set(['醋海生波','香囊疑案','石阶惊变','巫蛊之祸','芳辰','雅集','病榻','中宫奏事','争执','冷宫来信','求晋位分','外戚请托','害喜','派系倾轧','姐妹情深','投靠','东宫惊魂']);
for(const table of [HAREM,HIST])for(let i=0;i<table.length;i++){
  const create=table[i],wrapped=(...args)=>{const ev=create(...args);return table===HIST||CHRONICLE_HAREM.has(ev?.title)?chronicleEvent(ev):ev;};
  Object.defineProperty(wrapped,'name',{value:create.name});table[i]=wrapped;
}
const chronicleArcTick=arcTick,chronicleKidEvent=kidEvent,chronicleClanEvent=clanEvent,chronicleRelEvent=relEvent,chroniclePunish=punishEv;
arcTick=(...args)=>chronicleEvent(chronicleArcTick(...args));
kidEvent=(...args)=>chronicleEvent(chronicleKidEvent(...args));
clanEvent=(...args)=>chronicleEvent(chronicleClanEvent(...args));
relEvent=(...args)=>{const ev=chronicleRelEvent(...args);if(ev)ev.cast=ev.present;return chronicleEvent(ev);};
punishEv=(...args)=>chronicleEvent(chroniclePunish(...args));
const chronicleFactionEvent=factionEvent,chronicleImpeachmentEvent=impeachmentEvent;
factionEvent=(...args)=>chronicleEvent(chronicleFactionEvent(...args));
impeachmentEvent=(...args)=>chronicleEvent(chronicleImpeachmentEvent(...args));
// COURT retained the original factory when it was registered; new cases use it
// while saved/pending cases call impeachmentEvent directly. Cover both routes.
COURT[IMPEACHMENT_INDEX]=impeachmentEvent;
