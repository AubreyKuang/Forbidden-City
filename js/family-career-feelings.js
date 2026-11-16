/* 升黜发生在父亲身上，家书落到每个子女的生活里；未收到消息的人不共享内心。 */
const familyCareerActive=()=>!!S&&!S.over&&journalContentVersion()>=19;
function familyCareerChildren(person){
  if(person?.e?.role!=='father')return [];
  const {c,h}=person.e,people=[...paternalFamily(c).filter(p=>S.consorts.includes(p)),...brotherRoles(h).map(role=>h[role]),...natalPeople(h).filter(p=>!p.parentRelativeId)];
  return [...new Map(people.filter(p=>p?.alive!==false&&!p.gone&&!p.consortId&&officialMarriageAge(p)>=6).map(p=>[p.id,p])).values()];
}
function familyCareerReaction(p,kind){
  const trait=p.temperament||p.trait,young=officialMarriageAge(p)<12,proud=['进取','骄矜','骄纵','善妒','好胜'].includes(trait),careful=['谨慎','持重','沉静','聪慧','城府'].includes(trait),study=['持正','才女','好学','有文才'].includes(trait);
  if(young)return kind==='promote'?{feeling:'欢喜',delta:4,line:'听说父亲得了好消息，想把今日写得最好的字带给父亲看。',small:'把新练的一页字重新描齐，等家里回信。'}:{feeling:'不安',delta:-4,line:'听见家中大人说话都轻了，不大明白官职，却担心父亲是不是很难过。',small:'原本想出门玩，走到门前又回来问父亲何时能回信。'};
  if(kind==='promote')return proud?{feeling:'扬眉吐气',delta:7,line:'总算有人看见父亲的本事！想起从前受过的冷脸，忍不住觉得扬眉吐气。',small:'挑出一件平日舍不得用的好衣料，又想起父亲来信叮嘱不可张扬，最终只添了一碟家人爱吃的点心。'}:careful?{feeling:'欣慰又谨慎',delta:3,line:'升职是喜事，却也更招人看。替父亲高兴，仍怕家人得意忘形，给任上添麻烦。',small:'原想多备些贺礼，列完单子又删去几项，只留下合礼的家用和一封平安信。'}:study?{feeling:'欣慰',delta:4,line:'父亲的辛劳终于被看见，自己也想凭学业立身，不愿只借家里的声势。',small:'把桌上未读完的书重新摊开，想到父亲在任上的辛苦，比平日多读了几页。'}:{feeling:'欢喜',delta:5,line:'替父亲高兴，也盼他新任上少些操劳，家里能安安稳稳地过日子。',small:'让家里添一道父亲爱吃的菜，写到贺信末尾，仍多叮嘱了一句注意饮食。'};
  return proud?{feeling:'委屈',delta:-7,line:'怎么偏偏又轮到自己家倒霉？心里不服，也怕旁人借机看轻；仍想先看清原委，不能把猜测当作有人陷害。',small:'赴亲友的约之前反复挑衣，最后收起鲜亮的一件；听见别人谈任官，也少接了几句话。'}:careful?{feeling:'惶恐',delta:-7,line:'父亲被贬，最怕家中跟着受牵连。反复问新任在何处，往后的用度和来往该怎样收束。',small:'夜里又翻了一回家书，把家中的用度重新算过，想问父亲是否平安，却怕催得太急。'}:study?{feeling:'忧心',delta:-5,line:'心里难受，却也想知道任上究竟出了什么差错。若有疏失，盼父亲还能补过，不能只怨旁人。',small:'提笔时想替父亲辩白，写了两行又停下，改问事情原委与如今起居。'}:{feeling:'惶恐',delta:-6,line:'听完消息，先担心父亲能不能撑住。家中的体面仿佛忽然薄了一层，只盼还有重新安顿的机会。',small:'饭菜放凉了才回过神来，托家人捎一件御寒的衣物，盼下一封信能说平安。'};
}
function familyCareerRecord(p,father,text,emotion,followup=false,publicText){
  const previous=journalContentVersion()>=32&&publicText&&p.story.findLast(e=>e.d===dateStr()&&e.t===`父亲${father.name}：${publicText}`);
  if(!previous)story(p,text);
  Object.assign(previous||p.story.at(-1),{t:text,thread:`father-career:${S.gen}:${father.id}`,life:{kind:'family',title:followup?'家书之后的小事':'父亲升黜后的心绪',turn:S.turn,gen:S.gen,people:[{id:p.id,name:p.name||fullName(p)},{id:father.id,name:father.name}]}});
  NPCMemory.record(S,{type:'father-career-feeling',time:S.turn,participants:[p.id,father.id],outcome:text},[{person:p.id,subject:father.id,interpretation:text,emotion,impact:60}]);
}
function reflectFatherCareer(person,before,from,after,publicText){
  if(!familyCareerActive()||person?.e?.role!=='father'||!before||!after||before===after)return;
  const father=person.p,serial=(father.careerHistory||[]).length,key=`${S.gen}:${S.turn}:${serial}:${from}:${father.office||father.post}`;
  if(father.familyFeelingDispatch===key)return;father.familyFeelingDispatch=key;
  const kind=after<before?'promote':'demote',to=officialOfficeLabel(father);
  for(const p of familyCareerChildren(person)){
    if(p.familyCareerNews?.fatherId===father.id)p.familyCareerNews.superseded=true;
    if(!chance(.55))continue;
    const reaction=familyCareerReaction(p,kind),consort=S.consorts.includes(p);
    p.familyCareerNews={key,turn:S.turn,fatherId:father.id,fatherName:father.name,fatherKey:person.key,from,to,kind,...reaction,followupDue:chance(.5)?S.turn+2:null};
    p.mood=clamp((p.mood??65)+reaction.delta);
    if(consort&&!['悲恸','心如死灰','怨恨'].includes(xinOf(p)))setXin(p,kind==='promote'?'欢喜':reaction.feeling==='委屈'?'委屈':reaction.feeling==='忧心'?'忧心':'惶恐',`父亲${father.name}由${from}${kind==='promote'?'升任':'贬任'}${to}`,null,{record:journalContentVersion()<32});
    const text=`【父亲升黜·${reaction.feeling}】家书传来：父亲${father.name}由${from}${kind==='promote'?'升任':'贬任'}${to}。${reaction.line}`;
    familyCareerRecord(p,father,text,reaction.delta/10,false,publicText);
  }
}
const feelingsSetOffice=careerSetOffice;
careerSetOffice=function(person,title,reason){const before=officialGrade(person.p),from=officialOfficeLabel(person.p),result=feelingsSetOffice(person,title,reason);reflectFatherCareer(person,before,from,officialGrade(person.p),result);return result;};
const feelingsFrontierReward=frontierReward;
frontierReward=function(r,kind){const e=r&&frontierEntry(r.commander),before=e&&officialGrade(e.p),from=e&&officialOfficeLabel(e.p),result=feelingsFrontierReward(r,kind);if(result&&kind==='promotion'&&e)reflectFatherCareer({p:e.p,key:e.key,e},before,from,officialGrade(e.p));return result;};
function currentFamilyCareerNews(p){const n=p?.familyCareerNews,father=n&&courtPerson(n.fatherKey)?.p;return n&&!n.superseded&&p.alive!==false&&father?.id===n.fatherId&&father.alive!==false&&S.turn-n.turn<=6?n:null;}
function familyCareerPanel(p){const n=currentFamilyCareerNews(p);return n?detailSection('家书与心境',`<p><strong>${esc(n.feeling)}</strong> · 父亲${esc(n.fatherName)}${n.kind==='promote'?'升任':'贬任'}${esc(n.to)}</p><p>${esc(n.line)}</p>${n.followupDone?`<p class="hint">${esc(n.small)}</p>`:''}`):'';}
function familyCareerFollowup(){
  if(!familyCareerActive())return;const seen=new Set();
  for(const e of officialEntries().filter(e=>e.role==='father'))for(const p of familyCareerChildren({p:e.p,key:e.key,e})){
    if(seen.has(p.id))continue;seen.add(p.id);const n=currentFamilyCareerNews(p);
    if(!n||!n.followupDue||n.followupDone||S.turn<n.followupDue)continue;n.followupDone=true;
    const recap=journalContentVersion()<32?`想到父亲${n.fatherName}由${n.from}${n.kind==='promote'?'升任':'贬任'}${n.to}，`:'';
    familyCareerRecord(p,e.p,`【家书之后的小事】${recap}${n.small}`,n.delta/20,true);
  }
}
const feelingsCourtTick=courtTick;
courtTick=function(...args){const result=feelingsCourtTick(...args);familyCareerFollowup();return result;};
const feelingsOfficialConversation=officialConversation;
officialConversation=function(e,topic){const n=currentFamilyCareerNews(e.p);return topic==='family'&&n?`“父亲${n.fatherName}近来${n.kind==='promote'?'升任':'贬任'}${n.to}。${n.line}”`:feelingsOfficialConversation(e,topic);};
const feelingsOfficialView=viewOfficial;
viewOfficial=function(){const html=feelingsOfficialView();return html+familyCareerPanel(officialEntry(UI.sel)?.p);};
const feelingsNatalView=viewNatalRelative;
viewNatalRelative=function(){const html=feelingsNatalView(),[id,r]=String(UI.sel).split(':');return html+(UI.view==='natal'?familyCareerPanel(natalEntry(id,r)?.p):'');};
const feelingsConsortVoices=consortVoicePool;
consortVoicePool=function(c){const pool=feelingsConsortVoices(c),n=currentFamilyCareerNews(c);if(n)pool.push(voiceLine('father-career-feeling',`她提起父亲${n.fatherName}近来的升黜。`,n.line));return pool;};
const feelingsNatalMeeting=natalMeetingEvent;
natalMeetingEvent=function(c,p){const ev=feelingsNatalMeeting(c,p),n=currentFamilyCareerNews(p);if(ev&&n)ev.text+=`\n说起父亲${n.fatherName}${n.kind==='promote'?'升任':'贬任'}${n.to}，${p.name}说：“${n.line}”`;return ev;};
const feelingsNatalLetter=A.natalLetter;
A.natalLetter=function(id,relative){if(modalOpen)return;const result=feelingsNatalLetter(id,relative),p=natalEntry(id,relative)?.p,n=currentFamilyCareerNews(p);if(n&&curEv?.title==='家中回音'&&p.lastLetter===S.turn&&!modalResult){curEv.text+=`\n${p.name}又提起父亲${n.fatherName}：“${n.line}”`;openModal(curEv);save('auto');}return result;};
