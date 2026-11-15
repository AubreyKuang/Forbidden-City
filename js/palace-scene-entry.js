/* Map invitations open the advertised scene, retaining the palace overview as a separate choice. */
const directPalaceScenes=()=>!!S&&journalContentVersion()>=19;
function mapStoryToken(kind,p){
  const c=kind==='experience'?experienceState(p)?.current:kind==='journey'?p.journeys?.current:historyState(p)?.current;
  return c?`${c.id}:${c.stage}`:null;
}
function mapStoryEvent(kind,id,token,child=false){
  const p=child?kidById(id):byId(id);if(!p||mapStoryToken(kind,p)!==token)return null;
  return kind==='experience'?personalExperienceEvent(p):kind==='journey'?journeyEvent(p):historyEvent(p);
}
function directStoryLead(lead,kind){
  const p=lead.person,token=mapStoryToken(kind,p);if(!p||!token)return lead;
  return {...lead,storyKind:kind,storyToken:token,action:`A.mapStory('${kind}',${p.id},'${token}',${!!p.sex})`};
}
const directExperienceLeads=personalExperienceLeads;
personalExperienceLeads=function(){const leads=directExperienceLeads();return directPalaceScenes()?leads.map(l=>directStoryLead(l,'experience')):leads;};
const directJourneyLeads=journeyLeads;
journeyLeads=function(){const leads=directJourneyLeads();return directPalaceScenes()?leads.map(l=>directStoryLead(l,'journey')):leads;};
const directHistoryLeads=historyLeads;
historyLeads=function(){const leads=directHistoryLeads();return directPalaceScenes()?leads.map(l=>directStoryLead(l,'history')):leads;};
A.mapStory=function(kind,id,token,child=false){
  if(modalOpen||!directPalaceScenes())return;
  const ev=mapStoryEvent(kind,id,token,child);if(ev)pushEv(ev);else toast('这段事情已有后续，宫城上的动向已更新。');
};
function palaceActiveSceneEvent(place){
  if(!directPalaceScenes()||place.k!=='palace')return null;
  const leads=[...personalExperienceLeads(),...journeyLeads(),...historyLeads()].filter(l=>l.place===place.id&&l.storyKind);
  const event=lead=>mapStoryEvent(lead.storyKind,lead.person.id,lead.storyToken,!!lead.person.sex);
  const ready=leads.filter(l=>event(l));if(!ready.length)return null;if(ready.length===1)return event(ready[0]);
  return {title:place.n+' · 正在发生',text:'这座宫里有几件事正在等你过问，选一件便可直接听当事人说。',choices:[
    ...ready.map(l=>({t:`${l.person.sex?l.person.name:fullName(l.person)} · ${l.title}`,person:l.person,f:()=>{const ev=event(l);if(ev)pushNow(ev);return null;}})),
    {t:'看看宫中近况',f:()=>{pushNow(palaceArrivalEvent(place.p));return null;}},{t:'改日再来'}]};
}
