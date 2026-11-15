/* 娘家姐妹嫁入另一个已知家族后，仍是有感受、有来往的人。 */
function courtWives(person){
  const wives=[],seen=new Set();
  for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);
    for(const p of natalPeople(h))if(p.sex==='f'&&p.alive&&p.married&&p.spouse?.personId===person.p.id)wives.push({c,h,p});
  }
  return wives;
}
function maritalCourtEcho(person,text,kind){
  if(!careersActive())return;
  kind ||= !officialAlive(person.p)?'death':/降职|疏漏|失职|革职|流放|未尽如期/.test(text)?'setback':/升任|擢升|嘉奖|获赏|出任|改任/.test(text)?'success':/回奏|呈奏|御批|奉差|领命|委派/.test(text)?'duty':null;
  if(!kind)return;
  for(const {c,p} of courtWives(person)){
    const husband=person.p,id=`${S.turn}:${kind}:${text}`;
    if(p.maritalEchoes?.includes(id))continue;(p.maritalEchoes ||= []).push(id);if(p.maritalEchoes.length>40)p.maritalEchoes.shift();
    let line,emotion;
    if(kind==='death'){
      if(p.widow)continue;
      p.spouse.alive=false;p.spouse.death=husband.death;p.widow={husbandId:husband.id,name:husband.name,turn:S.turn,imperial:!!p.marriageImperial,authorized:false};
      line=`${husband.name}${husband.death?.kind==='battle'?'在前线阵亡':'去世'}，讣信送到${p.name}手中。她将旧日家书反复展平，又收回匣里，自此守寡。${p.marriageImperial?'当年的赐婚仍记在册，今后若愿再婚，须先请旨重新议亲。':'此后是否重议婚事，仍须先听她自己的意思。'}`;emotion=-.9;p.maritalMood='哀恸';
    }else{
      const mood=kind==='demote'||kind==='accountable'||kind==='setback'?'惶恐':kind==='promote'||kind==='reward'||kind==='success'?'欣慰':'牵挂';
      const feelings={惶恐:'她读信时指尖发凉，想问明原委，也担心丈夫往后的日子。',欣慰:'她替丈夫高兴，先把消息写给家里，又叮嘱他别只顾公务忘了饮食。',牵挂:'她把启程时备的衣物又清点一遍，盼回信里能多写一句平安。'};
      p.maritalMood=mood;emotion=mood==='惶恐'?-.5:mood==='欣慰'?.5:-.1;
      line=`丈夫${husband.name}：${text} ${feelings[mood]}`;
    }
    p.mood=clamp((p.mood??65)+emotion*10);p.maritalNews={turn:S.turn,kind,text:line};
    natalRecord(c,p,`【婚后家书】${line}`,emotion);
    NPCMemory.record(S,{type:'marital-court',time:S.turn,participants:[p.id,husband.id],object:text},[{person:p.id,subject:husband.id,interpretation:line,emotion,impact:85}]);
  }
}
const maritalOfficialRecord=officialRecord;
officialRecord=function(c,role,text,options){const result=maritalOfficialRecord(c,role,text,options);if(careersActive()){const e=officialEntry(c.id+':'+role);if(e)maritalCourtEcho({p:e.p,e,key:e.key},text);}return result;};
const maritalScholarRecord=scholarRecord;
scholarRecord=function(p,text,big){const result=maritalScholarRecord(p,text,big);if(careersActive())maritalCourtEcho({p,key:'scholar:'+p.id,scholar:true},text);return result;};
const maritalBaseMarriage=marrySister;
marrySister=function(c,p,match,options={}){
  if(careersActive()&&p.widow&&!p.widow.authorized)return false;
  if(careersActive()){
    if(p.widow){(p.marriageHistory ||= []).push({...p.widow});delete p.widow;}
    p.marriageImperial=/奉旨|赐婚/.test(options.source||'');
    if(match.kind==='alliance'){const e=allianceEntry(match);if(e){match={...match,personId:e.p.id};e.p.spouseRelative={consortId:c.id,relativeId:p.id};}}
  }
  const result=maritalBaseMarriage(c,p,match,options);
  if(careersActive()&&match.kind==='alliance'){
    const e=allianceEntry(match);
    if(e){p.spouse.born=S.turn-e.p.age*12;p.maritalMood='新婚中的期待';
      const line=`【两家姻亲】${p.name}与${e.p.name}${p.marriageImperial?'奉旨':'经两家议定'}成婚。${fullName(c)}的娘家与${fullName(e.o)}的娘家自此结为姻亲。`;
      for(const parent of new Set([houseOf(c).father,e.h.father]))if(parent.alive!==false)story(parent,line);
    }
  }
  return result;
};
function maritalCourtTick(){
  if(!careersActive())return;
  for(const person of careerPeople())if(!officialAlive(person.p))maritalCourtEcho(person,person.p.death?.reason||'收到讣报','death');
}
const maritalCareersTick=careerTick;
careerTick=function(){maritalCourtTick();return maritalCareersTick();};

function natalStayLabel(p){
  if(!p.visit)return '';const host=byId(p.visit.host);
  return host&&natalInPalace(host,p)?`正在宫中小住 · ${host.palace} · 约${Math.max(0,p.visit.until-S.turn)}个月后归家`:'';
}
const maritalNatalStatus=natalStatus;
natalStatus=function(p){return !p.alive?maritalNatalStatus(p):natalStayLabel(p)||(p.widow?(p.widow.authorized?'丧偶 · 获准重新议亲':'守寡'):maritalNatalStatus(p));};
const maritalNatalReady=natalVisitReady;
natalVisitReady=function(c,p){
  if(!careersActive()||!p.widow)return maritalNatalReady(c,p);
  return inPalace(c)&&!c.maid&&p.alive&&!p.consortId&&!p.visit&&S.turn-(p.lastVisit??-99)>=6&&!mourningActive()&&!natalPeople(houseOf(c)).some(x=>x.visit);
};
const maritalNatalVisit=natalVisitEvent;
natalVisitEvent=function(c,p){
  const ev=maritalNatalVisit(c,p);if(!ev||!careersActive()||!p.widow)return ev;
  ev.title='入宫宽慰 · '+p.name;
  ev.text=`${p.name}守寡后${p.lastVisit==null?'第一次':'又'}寄来家书：“我想进宫住些日子，和${natalLabel(c,p)==='姐姐'?'妹妹':'姐姐'}说说话。屋里太静，旧物却处处都是。”\n${fullName(c)}${relGet(c,p)>=25?'读罢红了眼眶，想亲自陪她坐一坐':'与她虽未亲厚，也愿留一间安静的屋子'}。仍约定两个月后归家。`;
  return ev;
};
const maritalNatalMeeting=natalMeetingEvent;
natalMeetingEvent=function(c,p){
  const ev=maritalNatalMeeting(c,p);if(!ev||!careersActive()||!p.widow)return ev;
  ev.text=`${p.name}正在${c.palace}小住。提起亡夫${p.widow.name}，她握着茶盏，没有像平日那样说完一句话。${fullName(c)}陪在旁边，等她慢慢开口。`;
  ev.choices.unshift({t:'让姐妹慢慢说，暂不催她振作',f:()=>{if(!natalInPalace(c,p))return null;p.maritalMood='悲伤中稍得宽慰';p.mood=clamp((p.mood??40)+8);relAdd(c,p,5);const line=`${p.name}入宫小住时向${fullName(c)}说起亡夫${p.widow.name}。姐妹静坐许久，她终于肯说起思念，也知道不必立刻装作无事。`;natalRecord(c,p,line,.4);return line;}});
  return ev;
};
function widowFutureReady(c,p){return careersActive()&&p.alive&&inPalace(c)&&!!p.widow&&!p.widow.authorized&&S.turn-p.widow.turn>=6&&S.turn-(p.widow.lastAsked??-99)>=6;}
A.widowFuture=function(id,relative){
  const e=natalEntry(id,relative);if(modalOpen||!e||!widowFutureReady(e.c,e.p))return;const {c,p}=e;
  const valid=()=>widowFutureReady(c,p),willing=p.willing!==false;
  pushEv({title:'旧约与来日 · '+p.name,por:natalPortrait(p),cast:[c],valid,text:`${p.name}守寡已有${S.turn-p.widow.turn}个月。${p.widow.imperial?'她记得当年的赐婚，不敢擅自另议。':'家里问起她往后的打算。'}\n她说：“${willing?'我仍记得他。可若将来遇到肯相扶过日子的人，我也想有重新选择的余地。':'眼下我还没有这个心思。先让我把自己的日子慢慢过好罢。'}”`,choices:[
    {t:'准其依本人意愿重新议亲',cond:()=>willing&&E().energy>0,why:willing?'精力不足':'她目前无意再婚',f:()=>{
      if(!valid()||!willing||!useE())return null;p.widow.authorized=true;p.widow.authorizedAt=S.turn;p.married=false;
      (p.formerSpouses ||= []).push({...p.spouse});delete p.spouse;p.marriageChecked=S.turn;
      startBetrothal(c,p);p.betrothal.due=Math.max(p.betrothal.due,S.turn+6);
      const text=`${p.name}表达愿意重新考虑婚事，陛下准其重新议亲${p.widow.imperial?'，说明不因前次赐婚而终身拘束':''}。亡夫${p.widow.name}与旧日婚姻仍留在纪事，新的亲事尚未成婚。`;natalRecord(c,p,text,.4);p.maritalMood='惆怅中有了盼望';save('auto');return text;
    }},
    {t:'尊重她眼下的步调，先不议亲',f:()=>{if(!valid())return null;p.widow.lastAsked=S.turn;const line=`陛下让${p.name}不必急着重议婚事，也准她按亲眷规矩进宫向姐妹说说心事。`;natalRecord(c,p,line,.2);return line;}}
  ]});
};
const maritalLifePanel=natalLifePanel;
natalLifePanel=function(c,p){
  const person=p.spouse?.personId&&careerPeople().find(x=>x.p.id===p.spouse.personId);
  return maritalLifePanel(c,p)+(p.maritalMood?detailSection('婚后心绪',`<p>${esc(p.maritalMood)}${p.maritalNews?' · '+esc(p.maritalNews.text):''}</p>${person?`<p>丈夫履历：${careerLink(person)} · ${esc(officialStatus(person.p))}</p>`:''}${p.widow?`<p>亡夫：${esc(p.widow.name)} · ${p.widow.imperial?'原为赐婚':'两家旧约'}。${p.widow.authorized?'已获准依本人意愿重新议亲。':'原婚姻保留记载，尚未重新议亲。'}</p>`:''}${widowFutureReady(c,p)?`<button class="btn" onclick="A.widowFuture(${c.id},${p.id})">听她谈往后婚事<small>同意重议需精力−1</small></button>`:''}`):'');
};
function natalVisitorsPanel(c){
  const visitors=natalPeople(houseOf(c)).filter(p=>p.visit&&p.visit.host===c.id&&natalInPalace(c,p));
  return visitors.length?`<section class="detail-section"><h3>娘家亲眷在宫中</h3>${visitors.map(p=>`<p>${natalLabel(c,p)} <button class="person-link" onclick="A.go('natal','${c.id}:${p.id}')">${esc(p.name)} ↗</button> <span class="tag">${esc(natalStayLabel(p))}</span></p>`).join('')}</section>`:'';
}
function natalSpouseSummary(p){
  if(!p.spouse)return '';
  const partner=p.spouse.personId&&careerPeople().find(x=>x.p.id===p.spouse.personId);
  if(partner)return `<p>配偶：${careerLink(partner)} · ${esc(officialOfficeLabel(partner.p))} · ${partner.p.age}岁 · ${esc(officialStatus(partner.p))}</p>`;
  return `<p>配偶：${esc(p.spouse.name)}${p.spouse.desc?' · '+esc(p.spouse.desc):''} · ${Math.max(18,Math.floor((S.turn-p.spouse.born)/12))}岁${p.spouse.alive===false?' · 已故':''}</p>`;
}
function officialSpousePanel(person){
  const wives=courtWives(person);return wives.length?detailSection('婚姻与家书',wives.map(({c,p})=>`<p>妻子：<button class="person-link" onclick="A.go('natal','${c.id}:${p.id}')">${esc(p.name)} ↗</button> · ${esc(natalStatus(p))}${p.maritalMood?' · '+esc(p.maritalMood):''}</p>`).join('')):'';
}
