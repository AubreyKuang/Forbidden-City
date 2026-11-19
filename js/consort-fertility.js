/* Fictional game balance, not a medical prediction. Identity never rerolls on load. */
function belowConceptionAgeLimit(age,legacyCutoff){
  return age<(PalaceActions.familyAgeLimits?45:legacyCutoff);
}
function consortFertilityBase(c){
  const saved=c?.fertility?.base;
  if(Number.isFinite(saved)&&saved>=.04&&saved<=.34)return saved;
  let h=((Number(c?.seed)||Number(c?.id)||1)>>>0)^0x6c8e9cf5;
  h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);h=(h^(h>>>16))>>>0;
  const u=h/4294967296;
  return Math.round((u<.15?.05+u/.15*.06:u<.8?.12+(u-.15)/.65*.1:.23+(u-.8)/.2*.1)*1000)/1000;
}
function ensureConsortFertility(c){if(c)c.fertility={base:consortFertilityBase(c)};}
function consortFertilityFactor(c){
  if(!c||!Number.isFinite(c.age)||c.age<18||!belowConceptionAgeLimit(c.age,50)||(c.hp??85)<25)return 0;
  const age=c.age<21?.85:c.age<30?1:c.age<35?.85:c.age<40?.65:c.age<45?.35:.12;
  const health=Math.max(.35,Math.min(1,.35+(c.hp??85)*.0065));
  return age*health*(c.trait==='体弱'?.75:1);
}
function consortConceptionChance(c){
  if(!inPalace(c)||c.preg||(c.delivery&&!c.delivery.settled)||S.turn-(c.lastBirth??-99)<3)return 0;
  const e=E(),base=consortFertilityBase(c)+(e.style==='风流'?.06:0)+(S.flags.bless===S.turn?.1:0)+(e.health>80?.03:0)-(e.age>50?.07:0);
  return Math.max(0,Math.min(.65,base*consortFertilityFactor(c)));
}
