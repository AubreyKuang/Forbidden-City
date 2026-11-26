/* A change of emperor changes kinship, not the identities in the court register. */
const retainedFamiliesActive=()=>journalContentVersion()>=27;
function familyCourtHosts(){return retainedFamiliesActive()?[...new Map([...(S.retainedFamilies||[]),...S.consorts].map(c=>[c.id,c])).values()]:S.consorts;}
function familyHostById(id){return byId(Number(id))||(retainedFamiliesActive()?(S.retainedFamilies||[]).find(c=>c.id===Number(id)):null);}
const retainConsortRecord=c=>c?.house||(journalContentVersion()>=154&&storyQueenKey(c));
function reconcileRetainedFamilies(){
  if(!retainedFamiliesActive())return;
  const hosts=new Map((S.retainedFamilies||[]).map(c=>[c.id,c]));
  for(const court of [...(S.previousCourts||[])].reverse())for(const c of court.consorts||[]){
    if(!retainConsortRecord(c)||hosts.has(c.id)||byId(c.id))continue;
    hosts.set(c.id,{...c,familyArchive:{gen:court.gen,atTurn:court.turn??S.turn,age:c.age}});
  }
  for(const d of dowagerCourtMembers())if(retainConsortRecord(d?.portrait)&&!hosts.has(d.personId)&&!byId(d.personId)){
    hosts.set(d.personId,{...d.portrait,id:d.personId,familyArchive:{gen:(d.seniorSince??S.gen+1)-2,atTurn:d.atTurn??S.turn,age:d.age??d.portrait.age}});
  }
  if(hosts.size)S.retainedFamilies=[...hosts.values()];
  // Rejoin JSON copies to one live household. Current households have priority.
  const houses=new Map();
  for(const c of [...S.consorts,...hosts.values()])if(c.house?.father?.id){
    const id=c.house.father.id;if(!houses.has(id))houses.set(id,c.house);else c.house=houses.get(id);
  }
  for(const d of dowagerCourtMembers()){
    const c=hosts.get(d?.personId);if(c?.house&&d.portrait)d.portrait.house=JSON.parse(JSON.stringify(c.house));
  }
}
function retainAccessionFamilies(h){
  if(!retainedFamiliesActive())return;
  reconcileRetainedFamilies();
  const hosts=new Map((S.retainedFamilies||[]).map(c=>[c.id,c]));
  for(const c of S.consorts){
    if(!retainConsortRecord(c))continue;
    hosts.set(c.id,{...JSON.parse(JSON.stringify(c)),familyArchive:{gen:S.gen,atTurn:S.turn,age:c.age}});
  }
  S.retainedFamilies=[...hosts.values()];
  S.imperialMaternalLine=[{mother:h.mom,adoptive:empress()?.id,gen:S.gen+1},...(S.imperialMaternalLine||[])];
  // Preserve existing recorded relationships among these people across the reign.
}
function retainedFamilyAgeTick(){
  if(!retainedFamiliesActive())return;
  for(const c of S.retainedFamilies||[]){
    const d=dowagerCourtMembers().find(d=>d?.personId===c.id),a=c.familyArchive;
    if(d?.alive===false)c.alive=false;
    if(c.alive&&a)c.age=a.age+Math.max(0,Math.floor((S.turn-a.atTurn)/12));
  }
}
function retainedHostTitle(c){
  const d=dowagerCourtMembers().find(d=>d?.personId===c.id);
  return d?`${d.relation||'皇太后'}${d.alive?'':' · 已故'}`:c.familyArchive?`第${cnNum(c.familyArchive.gen)}代宫眷${c.alive?'':' · 已故'}`:'本朝宫眷';
}
function retainedKinship(c,role){
  const line=S.imperialMaternalLine||[],direct=line[0];
  if(c.id===(direct?.mother??S.flags.birthDowager?.personId??S.flags.dowager?.personId))return role==='father'?'皇帝外祖父':/^brother/.test(role)?'皇帝舅父 · 国舅':'皇帝母家亲眷';
  if(c.id===(direct?.adoptive??S.flags.dowager?.personId))return role==='father'?'嫡母之父':/^brother/.test(role)?'嫡母兄弟':'嫡母家族亲眷';
  const depth=line.findIndex(l=>l.mother===c.id||l.adoptive===c.id);
  if(depth===1)return role==='father'?'先帝外祖父':/^brother/.test(role)?'先帝舅父 · 新帝舅祖':'先帝母家亲眷';
  return depth>1?'先朝外戚 · 家谱存录':`先朝宫眷${fullName(c)}的${officialKinLabel(c.house,role,c)}`;
}
function retainedFamiliesPanel(){
  const hosts=familyCourtHosts().filter(c=>c.familyArchive),seen=new Set();
  const direct=new Set([S.flags.dowager?.personId,S.flags.birthDowager?.personId]);
  const ordered=hosts.slice().sort((a,b)=>Number(direct.has(b.id))-Number(direct.has(a.id))||b.familyArchive.gen-a.familyArchive.gen);
  const branches=ordered.map(c=>{
    const h=houseOf(c);if(!h||seen.has(h.father.id))return '';seen.add(h.father.id);
    const members=hosts.filter(x=>x.house?.father.id===h.father.id);
    const from=members.some(p=>direct.has(p.id))?'太后母家':reignEra(c.familyArchive.gen)||'先朝';
    return `<details class="family-branch"><summary><strong>${esc(c.sur)}氏</strong><span class="hint">${esc(from)} · ${members.length} 位宫眷</span></summary>
      <div class="acts">${members.map(p=>`<button class="btn sm quiet" data-onclick="A.go('consort',${royalActionArg(p.id)})">${esc(fullName(p))}<small>${esc(retainedHostTitle(p))}</small></button>`).join('')}</div>
      <dl class="family-kin-list">${officialRoles(h).filter(r=>!r.startsWith('relative')).map(role=>`<div><dt>${esc(retainedKinship(c,role))}</dt><dd>${officialLink(c,role)}<small>${esc(officialOfficeLabel(officialPerson(h,role)))} · ${esc(officialStatus(officialPerson(h,role)))}</small></dd></div>`).join('')}</dl>
      ${detailFold('展开家谱',familyHouseTree(c,true))}</details>`;
  }).join('');
  return branches?`<details class="family-branch family-context"><summary><strong>太后母家与先朝外戚</strong><span class="hint">${seen.size} 支</span></summary>${branches}</details>`:'';
}
const inheritedFamilyView=viewFamily;
viewFamily=function(){return inheritedFamilyView()+(UI.familyMode==='list'&&retainedFamiliesActive()?retainedFamiliesPanel():'');};
const inheritedConsortView=viewConsort;
viewConsort=function(){
  const c=!byId(UI.sel)&&familyHostById(UI.sel);
  if(!c?.familyArchive)return inheritedConsortView();
  return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg(c,224)}<div class="grow"><h2>${esc(fullName(c))}</h2><p>${esc(retainedHostTitle(c))} · ${c.age}岁 ${consortParentageBadge(c)}</p></div></header>${storyElderVisitButton(c.id)}${detailSection('人物纪事',detailStory(c))}${detailSection('母家亲族',familyHouseTree(c,true))}`;
};
const inheritedOfficialView=viewOfficial;
viewOfficial=function(){
  const html=inheritedOfficialView(),e=officialEntry(UI.sel);
  return e?.c.familyArchive?html.replace('<h2>',`<p class="tag">${esc(retainedKinship(e.c,e.role))}</p><h2>`):html;
};
const inheritedOfficialRecord=officialRecord;
officialRecord=function(c,role,text,options){
  inheritedOfficialRecord(c,role,text,options);
  if(!retainedFamiliesActive())return;
  for(const d of dowagerCourtMembers()){
    const mother=familyHostById(d?.personId);if(!d?.alive||!mother?.familyArchive||mother.house?.father.id!==c.house?.father.id)continue;
    const p=officialPerson(c.house,role),kin=officialKinLabel(c.house,role,mother);
    const feeling=!officialAlive(p)?'讣信送到，她抚着旧信许久未语，家中少了一人，尊位也不能减轻这份失落。':/降|疏漏|失职|革职|流放|未尽/.test(text)?'她心中忧虑，盼先查清实情，也叮嘱家人承担应尽的责任。':/赏|升|擢|办结|嘉奖/.test(text)?'她为家人欣慰，又嘱咐得意时更须谨慎，不可倚仗宫中亲缘。':'她记下家人的近况，关切任上的辛劳，也盼往后平安来信。';
    const entry=`【母家消息·${p.name}】${kin}${p.name}：${text}${feeling}`;
    story(mother,entry);if(d.portrait)d.portrait.story=JSON.parse(JSON.stringify(mother.story));
    NPCMemory.record(S,{type:'dowager-family',time:S.turn,participants:[mother.id,p.id],outcome:entry},[{person:mother.id,subject:p.id,interpretation:entry,emotion:!officialAlive(p)?-.8:.4,impact:70}]);
  }
};
const inheritedOfficialConversation=officialConversation;
officialConversation=function(e,topic){
  if(retainedFamiliesActive()&&e.c.familyArchive&&topic==='family'){
    const d=dowagerCourtMembers().find(d=>d?.personId===e.c.id);
    return d?.alive?`“${e.role==='father'?'女儿':'家中姐妹'}如今尊为太后，臣仍惦记她的起居。家门虽与皇室有亲，任上该尽的本分，一分也不敢少。”`:d?'“太后虽已不在，家中仍收着旧日来信。臣记得的是亲人，也会守好今日的本分。”':'“朝代更迭，家人的书信与旧事还在。臣只盼各自安好，任上的事也不负新朝所托。”';
  }
  return inheritedOfficialConversation(e,topic);
};
