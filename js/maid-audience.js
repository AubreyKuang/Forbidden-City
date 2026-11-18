/* Deliberate audiences are independent of the ambient encounter lottery. */
function maidAudienceActive(){return !!S&&!S.over&&journalContentVersion()>=30;}
function maidAudienceRoster(){return maids().filter(g=>inPalace(g)&&g.age>=18).sort((a,b)=>Number(b.near)-Number(a.near)||b.favor-a.favor);}
function maidAudiencePanel(){
 if(!maidAudienceActive())return '';
 return `<section class="detail-section"><h3>宫女留侍</h3><p class="hint">可召见当值宫女，也可再见承恩后回去当差的旧识。召见不耗精力，决定留侍时耗精力一。</p><button class="btn jade" onclick="A.maidAudience()" ${mourningNightPause()?'disabled':''}>召见宫女</button>${mourningNightPause()?`<p class="hint">${mourningNightMessage()}。</p>`:''}</section>`;
}
function maidAudienceMenu(){
 const list=maidAudienceRoster(),randomOld=journalContentVersion()>=33;
 const oldChoices=randomOld?(list.length?[{t:'召见一位旧识宫女',f:()=>{
  const available=maidAudienceRoster();if(maidAudienceActive()&&available.length)pushNow(maidAudienceMeeting(pick(available)));
  return null;
 }}]:[]):list.map(g=>({t:`${fullName(g)} · ${g.near?'御前当差':'尚衣局旧识'}${consortNightReason(g)?' · '+consortNightReason(g):''}`,f:()=>{if(inPalace(g)&&g.maid)pushNow(maidAudienceMeeting(g));return null;}}));
 return {title:'敬事房 · 宫女留侍',text:randomOld?'可以召见一位当值宫女，也可以让敬事房请一位旧识过来，见面后再决定今夜是否留侍。':'敬事房另呈当值名册。你可以先见一面、听她说话，再决定今夜是否留侍。已有的宫女仍保留原来的经历与姓名。',choices:[
  ...oldChoices,
  {t:'召见一位当值宫女',cond:()=>E().energy>0,why:'本月精力已尽',f:()=>{if(!maidAudienceActive()||E().energy<=0)return null;
   let slot=S.flags.maidAudience;
   if(slot?.gen!==S.gen||slot.turn!==S.turn){slot=S.flags.maidAudience={gen:S.gen,turn:S.turn,person:makeGirl({fam:{t:'宫女',p:3},age:ri(18,24)})};}
   const g=byId(slot.person.id)||slot.person;
   if(S.consorts.includes(g)&&(!g.maid||!inPalace(g))){return '本月名册上的这位已另作安置。若要再见，可从她的人物档案进入；新的当值名册下月呈上。';}
   pushNow(maidAudienceMeeting(g));return null;
  }},
  {t:'今日先不召见'}
 ]};
}
function maidAudienceMeeting(g){
 const fresh=!S.consorts.some(c=>c.id===g.id);let done=false;
 const valid=()=>!done&&maidAudienceActive()&&g.age>=18&&(fresh?!byId(g.id):inPalace(g)&&g.maid);
 const intro=fresh?`${fullName(g)}，${g.age}岁，原在尚衣局当差。敬事房先告知召见之意，她愿意前来，行过礼后等你问话。`:`${fullName(g)}${g.near?'从御前值房过来':'仍在尚衣局当差，听见传召便收好手头的活计'}。${g.nights?'你还认得这位旧识，她也记得从前的相处。':'她行过礼，等你开口。'}`;
 const words=['活泼','爽直','好客'].includes(g.trait)?'当值时也有有趣的小事。陛下若愿听，奴婢想慢慢说。':['沉静','淡泊','持重'].includes(g.trait)?'奴婢话不多，陛下若问起，会认真答。':'忽然被召来，心里还有些紧张。能先说说话，便安心些。';
 return {title:'召见宫女 · '+fullName(g),por:g,valid,text:intro+`\n“${words}”`,choices:[
  {t:'今夜留侍 · 精力−1',cond:()=>valid()&&E().energy>0&&!consortNightReason(g),why:consortNightReason(g)||'精力不足',f:()=>{
   if(!valid()||E().energy<=0||consortNightReason(g))return null;done=true;
   if(fresh){g.maid=true;g.near=false;g.palace='尚衣局';g.favor=20;g.aff=25;S.consorts.push(g);deepen(g);story(g,'原在尚衣局当差，经敬事房召见，自愿留侍。');S.flags.lastMaidEncounter=S.turn;}
   maidNight(g);return null;
  }},
  {t:'先说些家常，今日仍回去当差',f:()=>{if(!valid())return null;done=true;if(!fresh){story(g,'奉召到御前说了些当值的家常，陛下听完，仍让她按原例回去歇息。');cchg(g,{mood:3});}return '你听她慢慢说完。临走时，她比来时自在了一些；今日仍照原来的安排当差。';}},
  {t:'今日先到这里'}
 ]};
}
A.maidAudience=function(){if(mourningNightPause()){toast(mourningNightMessage());return;}if(maidAudienceActive()&&!modalOpen)pushEv(maidAudienceMenu());};
