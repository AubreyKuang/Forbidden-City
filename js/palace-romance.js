/* 宫墙私情：成年后相识、双方投契，少量且有后续的秘密往来。 */
const ROMANCE_TITLES=['','花亭同话','夹在书中的笺子','回廊相依'];
function palaceRomanceState(){
  if(S.palaceRomance?.gen!==S.gen)S.palaceRomance={gen:S.gen,pairs:{},lastStart:-999,lastScene:-999};
  return S.palaceRomance;
}
function romanceKin(k){
  return [...new Set([k.mom,k.foster,...Object.keys(k.motherBonds||{}).map(Number)].filter(Boolean))].map(byId).filter(Boolean);
}
function romanceEligible(k,c){
  if(!childInPalace(k)||k.sex!=='m'||kidAge(k)<18||!inPalace(c)||c.maid||c.rank===8||c.age<18||Math.abs(kidAge(k)-c.age)>8)return false;
  // A late entry establishes that this was an acquaintance formed in adulthood.
  if(!Number.isFinite(c.enteredAt)||c.enteredAt<k.born+18*12)return false;
  return c.sur!==E().sur&&!romanceKin(k).some(m=>m.id===c.id||m.sur===c.sur||clanKey(m)===clanKey(c)||m.kin?.[c.id]||c.kin?.[m.id]);
}
function romanceAffinity(k,c){
  if(!romanceEligible(k,c)||c.preg||c.bond||['痴情','持重'].includes(c.trait)||c.aff>=50||c.favor>=40||c.virtue>=75||k.vir>=80||relGet(k,c)<18)return 0;
  const hobby=consortHobby(c);
  if(k.lit>=55&&['读书','抚琴','对弈'].includes(hobby))return 3;
  if(k.mar>=55&&['骑射','投壶'].includes(hobby))return 3;
  if(['活泼','爽直','好客'].includes(c.trait)&&k.love<50)return 2;
  return 0;
}
function romancePeople(pair){return {prince:kidById(pair.prince),consort:byId(pair.consort)};}
function romanceRecord(pair,text,emotion=.3){
  const {prince:k,consort:c}=romancePeople(pair);if(!k||!c)return;
  kstory(k,text);story(c,text);
  NPCMemory.record(S,{type:'palace-romance',time:S.turn,location:pair.place,participants:[k.id,c.id],object:ROMANCE_TITLES[pair.stage]},[
    {person:k.id,subject:c.id,interpretation:text,emotion,impact:80},
    {person:c.id,subject:k.id,interpretation:text,emotion,impact:80}
  ]);
}
function closePalaceRomance(pair,reason,status='ended'){
  pair.status=status;pair.pending=false;pair.result=reason;pair.endedAt=S.turn;
  if(pair.known)romanceRecord(pair,reason,-.5);
}
function reconcilePalaceRomance(){
  if(S.palaceRomance?.gen!==S.gen)return;
  for(const pair of Object.values(S.palaceRomance.pairs)){
    if(!['active','concealed'].includes(pair.status))continue;
    const {prince:k,consort:c}=romancePeople(pair);
    if(!romanceEligible(k,c))closePalaceRomance(pair,'处境已变，两人的私下来往就此中断。');
  }
}
function palaceRomanceTick(){
  const state=palaceRomanceState();reconcilePalaceRomance();
  if(state.checkedTurn===S.turn||S.over||mourningActive())return;state.checkedTurn=S.turn;
  const active=Object.values(state.pairs).find(p=>p.status==='active');
  if(active){
    if(active.pending||S.turn<active.due||S.turn-state.lastScene<4)return;
    const {prince:k,consort:c}=romancePeople(active);
    if(c.aff>=65||c.bond||relGet(k,c)<15){closePalaceRomance(active,'她收起了旧笺，两人决定止于礼节，不再私下相约。');return;}
    if(c.preg||!chance(.3))return;
    active.stage++;active.pending=true;active.place=active.stage===2?initiativePlace(null,null,{place:'p'+c.palace}):'yh';return;
  }
  if(S.turn-state.lastStart<18)return;
  const used=new Set(Object.values(state.pairs).flatMap(p=>[p.prince,p.consort]));
  const matches=[];
  for(const k of kidsAlive())for(const c of harem()){
    if(used.has(k.id)||used.has(c.id))continue;
    const score=romanceAffinity(k,c);if(score)matches.push({k,c,score});
  }
  // One roll for the whole palace, not one roll for every possible pair.
  if(!matches.length||!chance(.04))return;
  const {k,c}=pick(matches.sort((a,b)=>b.score-a.score).slice(0,3));
  const key=k.id+'-'+c.id,books=['读书','抚琴','对弈'].includes(consortHobby(c));
  state.pairs[key]={key,prince:k.id,consort:c.id,stage:1,status:'active',pending:true,known:false,started:S.turn,place:books?'wy':'yh',theme:books?'books':'riding'};
  state.lastStart=S.turn;
}
function romancePending(pair){
  if(!pair||pair.status!=='active'||!pair.pending||mourningActive())return false;
  const {prince:k,consort:c}=romancePeople(pair);return romanceEligible(k,c);
}
function palaceRomanceEvent(pair){
  pair ||= Object.values(S.palaceRomance?.gen===S.gen?S.palaceRomance.pairs:{}).find(romancePending);
  if(!romancePending(pair))return null;
  const {prince:k,consort:c}=romancePeople(pair),stage=pair.stage;
  const opening=`${kidName(k)}（${kidAge(k)}岁）与${cName(c)}（${c.age}岁）。`;
  const text=stage===1?`${opening}\n${pair.theme==='books'?'文渊阁窗下，两人对着一页旧注谈了许久。她说起一段无人肯听的见解，他竟接上了后半句。':'御花园里，两人比过一轮投壶。他讲起宫外骑马的趣事，她难得笑得毫无拘束。'}\n随侍只说两人近来投契，尚无逾矩之举。`:
    stage===2?`${opening}\n宫人送还书册时，一张写着小字的笺子滑了出来：她记得他上回未说完的话，也回赠了亲手结的书签。\n他将笺子仔细收起。她曾悄声叮嘱：“往后若要来，也先问问我愿不愿见。”`:
    `${opening}\n雨后的回廊没有旁人。他停在她身边，低声问可否握一握她的手。她犹豫片刻，轻轻回握。\n灯影里，两人短暂相拥；听见脚步，才各自退开。随侍亲眼看见这一幕，回来禀报。${k.married?'\n皇子已有嫡妻，这件事若传开，也会伤及她。':''}`;
  const option=(t,mode)=>({t,f:()=>resolvePalaceRomance(pair.key,stage,mode)});
  return {title:ROMANCE_TITLES[stage],cast:[k,c],present:[k,c],valid:()=>romancePending(pair)&&pair.stage===stage,
    onShow:()=>{pair.known=true;if(pair.seenStage!==stage){pair.seenStage=stage;S.palaceRomance.lastScene=S.turn;romanceRecord(pair,stage===1?'成年后因趣味相投，开始留意彼此。':stage===2?'两人私下交换书笺，心意渐深。':'两人于回廊牵手相拥，私情被随侍察觉。');save('auto');}},text,
    choices:stage<3?[
      option(stage===1?'先当寻常往来，暂不干预':'暂不声张，继续留意','watch'),
      option('分别提醒，两人往来止于礼节','boundary'),
      option('让皇子赴封地历练，错开往来','away')
    ]:[
      option('分别问清，令二人断了私下来往','boundary'),
      option('让皇子就藩，将此事留在家中','away'),
      option('公开申斥二人','expose'),
      option('暂压消息，不作处置','conceal')
    ]};
}
function resolvePalaceRomance(key,stage,mode){
  const pair=S.palaceRomance?.pairs[key];if(!romancePending(pair)||pair.stage!==stage)return null;
  const {prince:k,consort:c}=romancePeople(pair);let result;
  if(mode==='watch'&&stage<3){
    pair.pending=false;pair.due=S.turn+4+ri(0,3);relAdd(k,c,6);cchg(c,{mood:3});
    result='你暂未干预。两人记住了这段往来，日后如何，还要看彼此的心意。';
  }else if(mode==='boundary'){
    relAdd(k,c,stage===3?-18:-6);k.love=clamp(k.love-3);cchg(c,{mood:-6});
    result='你分别听过两人的话，令他们收起私笺，此后只在众人面前循礼相见。';closePalaceRomance(pair,result);
  }else if(mode==='away'){
    result=`${k.name}奉旨赴封地历练，两人的私下来往至此中断。`;closePalaceRomance(pair,result);k.away=true;k.love=clamp(k.love-8);cchg(c,{mood:-10});
  }else if(mode==='expose'&&stage===3){
    result='二人当众受了申斥，私下来往被禁止。消息传开，皇子的支持与皇家的威望也受到影响。';
    closePalaceRomance(pair,result,'exposed');relAdd(k,c,-25);k.sup=clamp((k.sup||0)-10);k.love=clamp(k.love-12);cchg(c,{favor:-15,mood:-15,aff:-10});chg({prestige:-3});
    const mother=byId(k.mom);if(mother?.alive&&mother!==c){relAdd(mother,c,-15);story(mother,`${k.name}与${fullName(c)}的私情被公开申斥。`);}
    if(k.spouse){k.spouse.trust=clamp((k.spouse.trust??60)-25);k.spouse.story ||= [];k.spouse.story.push({d:dateStr(),t:'得知丈夫与宫中妃嫔的私情，信任受损。'});}
  }else if(mode==='conceal'&&stage===3){
    result='你压下了消息，未对二人作出处置。这段未公开的私情留在两人的记忆里。';
    closePalaceRomance(pair,result,'concealed');relAdd(k,c,5);cchg(c,{aff:-5});
  }else return null;
  pair.result=result;log(`【${ROMANCE_TITLES[stage]}】${kidName(k)}与${fullName(c)}：${result}`,stage===3?1:0);save('auto');return result;
}
A.reviewPalaceRomance=function(key){const pair=S.palaceRomance?.pairs[key];if(pair&&!modalOpen&&!S.over)pushEv(palaceRomanceEvent(pair));};
function palaceRomanceLeads(){
  if(S.palaceRomance?.gen!==S.gen)return [];
  return Object.values(S.palaceRomance.pairs).filter(romancePending).map(pair=>{
    const {prince,consort}=romancePeople(pair);return {place:pair.place,title:ROMANCE_TITLES[pair.stage],text:pair.stage===1?'两人在此谈得投契，可以走近看看。':'随侍禀来一段往来的消息，尚待你过问。',cast:[prince,consort],romanceKey:pair.key};
  });
}
function palaceRomanceAt(place){
  return palaceRomanceLeads().filter(l=>l.place===place).map(l=>`<section class="palace-activity"><h3>${esc(l.title)}</h3>${activityPortraits(...l.cast)}<p>${esc(l.text)}</p><button class="btn jade" onclick="A.reviewPalaceRomance('${l.romanceKey}')">走近过问 →</button></section>`).join('');
}
function palaceRomancePanel(person){
  if(S.palaceRomance?.gen!==S.gen)return '';
  return Object.values(S.palaceRomance.pairs).filter(p=>p.known&&[p.prince,p.consort].includes(person.id)).map(pair=>{
    const {prince,consort}=romancePeople(pair),other=person.sex?consort:prince;if(!other)return '';
    const unavailable=['active','concealed'].includes(pair.status)&&!romanceEligible(prince,consort);
    const label=unavailable?'往来已断':{active:pair.stage===1?'投契往来':pair.stage===2?'私笺传情':'私情已现',ended:'往来已断',exposed:'私情已公开',concealed:'未公开的私情'}[pair.status];
    return `<p><strong>${esc(label)}</strong> · <button class="person-link" onclick="A.go('${person.sex?'consort':'kid'}',${other.id})">${esc(porName(other))}</button></p><p class="hint">${esc(pair.result||'随侍已将见闻禀来，尚待过问。')}</p>${romancePending(pair)?`<button class="btn sm" onclick="A.reviewPalaceRomance('${pair.key}')">查看这次见闻</button>`:''}`;
  }).join('');
}
