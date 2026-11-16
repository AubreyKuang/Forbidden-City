/* A marriage joins named households and changes the women who hear the news. */
function marriageFriendshipsEnabled(){return journalContentVersion()>=12;}
function marriageBondPeople(b){return [byId(b.a),byId(b.b)];}
function marriageBondTense(a,b){return relGet(a,b)<0||isRival(a,b)||isRival(b,a);}
function marriageGreeting(c,o,b,later=false){
 const tense=marriageBondTense(c,o);
 if(tense)return `家中${b.bride}与${b.groom}的婚事，我按礼道喜。你我旧日的事尚未说开，也不该叫他们夹在中间。`;
 if(isSolitary(c)||['沉静','淡泊'].includes(c.trait))return later?'往来不必热闹。家书若有要紧事，递来便是，我会记得。':'既成了一家亲眷，便多一份牵挂。平日我话少，家中有事仍可来同我说。';
 if(['善妒','骄纵','骄矜'].includes(c.trait))return c.favor+20<o.favor?'你如今比我得宠，我仍会眼热。可家里添了这层亲，贺喜的话也是真心的。':'我有时爱计较，这点脾气你知道。如今既是姻亲，有话便私下说明白，别叫家里人跟着猜。';
 if(['聪慧','城府','持重'].includes(c.trait))return later?'家中若有难处，我们可互通消息；朝堂上的差事，仍各凭本事，莫借姻亲求偏私。':'两家既结了亲，礼数与往来都该照应。宫里的事仍有分寸，不能叫这门喜事变成旁人的话柄。';
 if(['活泼','爽直','将门'].includes(c.trait))return later?'以前见面还找个由头，如今谈家事便能坐半日。你也说说你家那边的近况罢。':'这下可好，往后家书里常要读到同一对名字了！我先替他们道喜，也想同你多亲近些。';
 return later?'收到家书便会想起你。两家人的日子牵在一起，欢喜和牵挂也多了一个能说的人。':'从前是宫中相识，如今又成了姻亲。家里添一门喜事，你我往后也多走动些。';
}
function marriageReply(c,o,b,later=false){
 const words=marriageGreeting(c,o,b,later);
 if(journalContentVersion()<30||words!==marriageGreeting(o,c,b,later))return words;
 if(marriageBondTense(c,o))return '这话我也认。同他们道喜归道喜，你我若有心结，日后再慢慢说，不让家里人为难。';
 if(isSolitary(c)||['沉静','淡泊'].includes(c.trait))return '我记下了。贺礼已备好，家书来了也会告诉你，不必因我话少便见外。';
 if(['活泼','爽直','将门'].includes(c.trait))return '我正想着要来找你！待家书到了，一起看看他们新婚过得如何。';
 if(['聪慧','城府','持重'].includes(c.trait))return '亲眷之间该照应的，我会记着。至于朝中的规矩，也请两家各自守好。';
 if(['善妒','骄纵','骄矜'].includes(c.trait))return '你肯这样说，我心里便好过些。宫中得失还是会在意，可这门亲事，我也是真心盼他们过好。';
 return '我也替他们欢喜。回信时会叮嘱家里，多些体谅；你若惦记他们，便来同我说说。';
}
function registerMarriageBond(c,p,e,{legacy=false,before}={}){
 if(!marriageFriendshipsEnabled()||!c||!e||c.id===e.o.id||houseOf(c)===e.h||!p.married||!e.p.married)return null;
 const key=`${S.gen}:${p.id}:${e.p.id||e.p.name}`,bonds=S.flags.marriageBonds||={};if(bonds[key])return bonds[key];
 const b=bonds[key]={key,gen:S.gen,a:c.id,b:e.o.id,bride:p.name,brideId:p.id,groom:e.p.name,groomId:e.p.id,role:e.role,
  turn:S.turn,date:dateStr(),legacy,lastTalk:null};
 b.fact=`${fullName(c)}的${natalLabel(c,p)}${p.name}与${fullName(e.o)}的${officialKinLabel(e.h,e.role,e.o)}${e.p.name}成婚，两家结为姻亲。`;
 p.spouse.alliance={consortId:e.o.id,personId:e.p.id,role:e.role};
 const prior=before??relGet(c,e.o),tense=prior<0||isRival(c,e.o)||isRival(e.o,c);
 if(c.alive&&e.o.alive)S.rel[rk(c,e.o)]=tense?(prior<0?Math.min(0,prior+4):prior):Math.min(100,Math.max(30,prior+12));
 const text=(legacy?'据家中旧有婚书补记：':'家书报喜：')+b.fact+(tense?'两人仍有旧怨，家中结亲没有使嫌隙一笔勾销。':socialPair(c,e.o)?'两人因此多了一层家中牵挂，愿意多走动，交情也亲近了。':'两人更添敬重与照应，仍保留各自喜静的习惯。');
 livedRecord([c,e.o],'bond','结为姻亲',`marriage:${key}`,text,[marriageGreeting(c,e.o,b),marriageGreeting(e.o,c,b)]);
 return b;
}
const marriageFriendshipsMarry=marrySister;
marrySister=function(c,p,match,options={}){
 if(!marriageFriendshipsEnabled())return marriageFriendshipsMarry(c,p,match,options);
 if(p.married)return;
 const e=match.kind==='alliance'?allianceEntry(match):null,prior=e?relGet(c,e.o):null;
 const result=marriageFriendshipsMarry(c,p,match,options);
 if(e&&!options.quiet)registerMarriageBond(c,p,{...e,role:match.role},{before:prior});
 return result;
};
function repairMarriageBonds(){
 if(!S||!marriageFriendshipsEnabled())return;const seen=new Set();
 for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h))continue;seen.add(h);
  for(const p of natalPeople(h)){
   if(!p.married||p.spouse?.kind!=='alliance')continue;
   if(Object.values(S.flags.marriageBonds||{}).some(b=>b.gen===S.gen&&b.brideId===p.id))continue;
   const matches=[],houses=new Set([h]);
   for(const o of S.consorts){const oh=houseOf(o);if(!oh||houses.has(oh))continue;houses.add(oh);
    const roles=[...brotherRoles(oh),...natalPeople(oh).filter(x=>x.sex==='m').map(x=>'relative'+x.id)];
    for(const role of roles){const groom=officialPerson(oh,role),link=p.spouse.alliance;
     const exact=link?link.personId===groom?.id&&link.role===role:p.spouse.desc?.startsWith(fullName(o)+'的');
     if(exact&&groom?.married&&groom.name===p.spouse.name&&groom.spouseName===p.name)matches.push({o,h:oh,p:groom,role});
    }
   }
   // Older saves have no ids: require the named household and reciprocal spouse.
   if(matches.length===1)registerMarriageBond(c,p,matches[0],{legacy:true});
  }
 }
}
function marriageBondAvailable(b){
 const [a,o]=marriageBondPeople(b),bride=a&&houseOf(a)?.relatives?.find(p=>p.id===b.brideId),groom=o&&officialPerson(houseOf(o),b.role);
 return b.gen===S.gen&&inPalace(a)&&inPalace(o)&&bride?.alive!==false&&bride?.married&&bride.spouse?.name===b.groom&&groom?.alive!==false&&groom?.married&&groom.spouseName===b.bride;
}
function marriageBondEvent(b){
 if(!b||!marriageBondAvailable(b)||b.lastTalk!==null&&S.turn-b.lastTalk<6)return null;
 const [a,o]=marriageBondPeople(b),last=b.lastTalk,later=last!==null||S.turn-b.turn>=6;
 const valid=()=>marriageBondAvailable(b)&&b.lastTalk===last;
 const text=b.fact+`\n两人谈起这门亲事。\n${fullName(a)}：“${marriageGreeting(a,o,b,later)}”\n${fullName(o)}：“${marriageReply(o,a,b,later)}”`;
 return {title:later?'姻亲家常':'姻亲道喜',por:a,cast:[o],present:[a,o],valid,text,choices:[{t:'听她们聊聊家事',f:()=>{
  if(!valid())return null;b.lastTalk=S.turn;livedRecord([a,o],'bond',later?'姻亲家常':'姻亲道喜',`marriage:${b.key}`,text);
  if(!marriageBondTense(a,o))relAdd(a,o,2);return '家中这门亲事，成了两人往来时记得的一段来处。';
 }}]};
}
A.allianceTalk=function(key){if(!modalOpen)pushEv(marriageBondEvent(S.flags.marriageBonds?.[key]));};
const marriageFriendshipsLine=relLine;
relLine=function(c){return marriageFriendshipsLine(c)+Object.values(S.flags.marriageBonds||{}).filter(b=>b.gen===S.gen&&(b.a===c.id||b.b===c.id)).map(b=>{
 const other=byId(b.a===c.id?b.b:b.a);return `<p class="hint">姻亲 · ${other?parentLink(other.id):'家中旧亲'}：${esc(b.fact)}</p>${marriageBondEvent(b)?`<button class="btn sm jade" onclick="A.allianceTalk('${esc(b.key)}')">听她们谈姻亲家事</button>`:''}`;
 }).join('');};
const marriageFriendshipsMigrate=migrate;
migrate=function(...args){const result=marriageFriendshipsMigrate.apply(this,args);repairMarriageBonds();return result;};
const marriageFriendshipsTick=kinMarriageTick;
kinMarriageTick=function(...args){if(marriageFriendshipsEnabled())repairMarriageBonds();return marriageFriendshipsTick.apply(this,args);};

// An actual wedding introduces its own conversation immediately after the decree.
// Restored historical bonds remain history, rather than becoming new weddings.
function marriageBondConsequences(previous){
 if(!S||PalaceActions.blocked||journalContentVersion()<30||previous?.gen!==S.gen)return;
 for(const b of Object.values(S.flags.marriageBonds||{})){
  if(b.legacy||b.gen!==S.gen||b.turn!==S.turn||b.lastTalk!==null||b.automaticQueued||previous.flags?.marriageBonds?.[b.key])continue;
  const [a,o]=marriageBondPeople(b);if(!a?.alive||!o?.alive)continue;
  let ev=marriageBondEvent(b);
  if(!ev){
   const valid=()=>b.lastTalk===null&&a.alive&&o.alive;
   const text=b.fact+`\n两人眼下不能相聚，各自在收到婚书消息后向随侍谈起这门亲事。\n${fullName(a)}：“${marriageGreeting(a,o,b)}”\n${fullName(o)}：“${marriageReply(o,a,b)}”`;
   ev={title:'姻亲喜讯',por:a,cast:[o],present:[],valid,text,choices:[{t:'记下两家的心意',f:()=>{if(!valid())return null;b.lastTalk=S.turn;livedRecord([a,o],'bond','姻亲喜讯',`marriage:${b.key}`,text);return '婚书与两人的心意一同记下，眼下的居处与禁令仍照原安排。';}}]};
  }
  const prior=ev.onQueue;ev.onQueue=()=>{prior?.();b.automaticQueued=true;};pushEv(ev);
 }
}
