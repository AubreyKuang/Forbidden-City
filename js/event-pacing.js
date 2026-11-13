/* Ambient scenes share palace-wide and per-person cooldowns, saved with the world.
   Births, deaths, pending decisions and story continuations use their own queues. */
const AMBIENT_LONG_COOLDOWNS={'芳辰':0,'香囊疑案':24,'石阶惊变':24,'巫蛊':36,'巫蛊之祸':36,'思亲':18,'冷宫来信':12,'求晋位分':12,'外戚请托':18,'中宫奏事':12,'争执':12,'醋海生波':10};
function ambientCooldown(ev){return ev.cooldown??AMBIENT_LONG_COOLDOWNS[ev.title]??10;}
function ambientEventReady(ev){
  if(!ev)return false;
  const gap=ambientCooldown(ev);if(!gap)return true;
  if(S.turn-(S.flags.ambientRecent?.[ev.title]??-Infinity)<gap)return false;
  const people=S.flags.ambientPeople?.[ev.title]||{};
  return eventPortraits(ev).every(p=>S.turn-(people[p.id]??-Infinity)>=Math.max(18,gap));
}
function rememberAmbientEvent(ev){
  if(!ambientCooldown(ev))return;
  (S.flags.ambientRecent ||= {})[ev.title]=S.turn;
  const people=(S.flags.ambientPeople ||= {})[ev.title] ||= {};
  eventPortraits(ev).forEach(p=>{people[p.id]=S.turn;});
  const counts=S.flags.ambientCounts ||= {};counts[ev.title]=Math.min(6,(counts[ev.title]||0)+1);
  for(const [id,turn] of Object.entries(people))if(S.turn-turn>60)delete people[id];
}
function ambientNovelty(ev){return Math.min(3,(S.flags.ambientCounts?.[ev.title]||0)*.6);}
