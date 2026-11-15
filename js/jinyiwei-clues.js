/* 定期线索来自既有案卷与实际回奏；风闻不是罪证。密查中的消息不凭空进入当事人的内心。 */
function jinyiweiClueSources(){
  const j=jinyiwei();if(!j)return [];
  return [
    ...palaceCases().filter(x=>x.kind!=='audit'&&caseReady(x)).map(x=>({key:'case:'+x.id,caseId:x.id,title:x.title,text:`旧卷「${x.title}」尚未查清。缇骑访得当年经手簿册的去处，可沿原案再核对证人与时日。去处是线索，尚不能据此指认主使。`})),
    ...careerPeople().filter(x=>careerEligible(x.p)&&x.p.report&&x.p.report.outcome==='setback').map(x=>({key:`report:${x.p.id}:${x.p.report.turn}:${x.p.report.title}`,target:x.key,targetId:x.p.id,targetName:x.p.name,office:x.p.office||x.p.post,report:{...x.p.report},title:x.p.name+'任内回奏',text:`${x.p.name}呈报「${x.p.report.title}」：${x.p.report.text} 缇骑建议调取原簿复核。办事不力、簿册有误与故意侵吞须分别查证，不能混作一案。`}))
  ].filter(x=>!(j.clues||[]).some(y=>y.key===x.key&&S.turn-y.turn<12));
}
function createJinyiweiClue(source){
  const j=jinyiwei();if(!j||!source)return null;
  const clue={...source,id:`clue-${S.gen}-${S.turn}-${(j.clueSerial=(j.clueSerial||0)+1)}`,turn:S.turn,d:dateStr(),status:'new'};
  (j.clues ||= []).push(clue);if(j.clues.length>24){const i=j.clues.findIndex(x=>x.status!=='new');if(i>=0)j.clues.splice(i,1);}
  story(j.commander,`【巡访线索】${clue.text} 已密呈御前，尚未定案。`);return clue;
}
function jinyiweiClueReady(clue){
  if(!clue||clue.status!=='new'||!jinyiweiCommanderReady())return false;
  if(clue.caseId)return caseReady(palaceCases().find(x=>x.id===clue.caseId));
  const p=courtPerson(clue.target)?.p;return p?.id===clue.targetId&&careerEligible(p)&&(p.office||p.post)===clue.office;
}
function jinyiweiClueEvent(clue){
  if(!clue||clue.status!=='new')return null;const j=jinyiwei(),valid=()=>clue.status==='new'&&jinyiweiCommanderReady();
  return {title:'锦衣卫巡访 · 新线索',por:j.commander,valid,text:`${j.commander.name}呈上密札：\n${clue.text}\n请旨后才会正式追查；线索不足时仍可能无功而返。`,choices:[
    {t:'循线查证 · 精力−1 · 国库−15',cond:()=>jinyiweiClueReady(clue)&&E().energy>0&&E().treasury>=15,why:'人事已变、原案暂不可查，或精力国库不足',f:()=>{
      if(!valid()||!jinyiweiClueReady(clue)||E().treasury<15||!useE())return null;
      chg({treasury:-15});clue.status='assigned';
      const x=clue.caseId?palaceCases().find(x=>x.id===clue.caseId):openPalaceCase({kind:'audit',title:clue.title,crime:'核对任内簿册',target:clue.target,targetId:clue.targetId,targetName:clue.targetName,office:clue.office,report:{...clue.report},clueId:clue.id});
      dispatchCase(x,15);clue.caseId=x.id;save('auto');return '已交办核验，下一月回报。线索尚未作为定罪依据。';
    }},
    {t:'继续留意，暂不立案',f:()=>{if(!valid())return null;clue.status='watching';story(j.commander,`【线索留察】${clue.title}奉旨继续留意，尚无新增证据，不据传言问罪。`);return '线索留在密札中，未因此处罚任何人。';}},
    {t:'证据不足，暂且封存',f:()=>{if(!valid())return null;clue.status='shelved';story(j.commander,`【线索封存】${clue.title}尚无足够证据，奉旨封存此次线索。原有案卷仍在。`);return '此次线索封存，原有案卷和人物履历均保留。';}}
  ]};
}
A.jinyiweiClue=function(id){const clue=jinyiwei()?.clues?.find(x=>x.id===id);if(!modalOpen&&clue)pushEv(jinyiweiClueEvent(clue));};
const clueDispatchCase=dispatchCase;
dispatchCase=function(x,cost){const result=clueDispatchCase(x,cost);if(careersActive()){
  x.investigatorId=jinyiwei()?.commander.id;(x.progress ||= []).push({turn:S.turn,text:`第${x.tries}次领案，约次月回报。`});
  if(jinyiwei())story(jinyiwei().commander,`【领案出查】奉旨核查「${x.title}」，先对簿册和证人口供，不以风闻作结论。`);
}return result;};
const clueCaseReport=caseReport;
caseReport=function(x){
  if(!careersActive())return clueCaseReport(x);
  if(x.kind!=='audit'){
    const ev=clueCaseReport(x),text=x.status==='solved'?'已有结论，原案所记的真相未因查访改写。':x.status==='closed'?'当事身份已变，案卷留存。':'尚未查清，半年后可循新线索再查。';
    (x.progress ||= []).push({turn:S.turn,text});story(jinyiwei().commander,`【结案回奏】「${x.title}」：${text}`);return ev;
  }
  const j=jinyiwei(),target=courtPerson(x.target),valid=target?.p.id===x.targetId&&officialAlive(target.p)&&(target.p.office||target.p.post)===x.office;
  delete x.due;
  if(!valid){x.status='closed';story(j.commander,`【查访中止】「${x.title}」所涉官员已离任或去世，不沿旧身份继续处置。`);return {title:'锦衣卫复核回报',por:j.commander,text:`「${x.title}」所涉官员的处境已有变化。旧簿留档，未据旧线索追授处罚。`,choices:[{t:'记入案卷'}]};}
  const found=chance(caseOdds(x));x.status=found?'solved':'cold';if(found)x.solvedTurn=S.turn;
  const line=found?`【簿册复核】${target.p.name}任内「${x.report.title}」：${x.report.text} 原报告中的疏漏已有簿册印证；仍未查得故意侵吞的证据，不能据此添定贪墨之罪。`:`【查访未果】${target.p.name}任内「${x.report.title}」的原簿暂未齐备，尚不足另下结论。`;
  (x.progress ||= []).push({turn:S.turn,text:line});story(j.commander,line);
  if(found){courtPersonRecord(target,line);careerFamilyEcho(target,'report',line);j.commander.merit=clamp(j.commander.merit+4);}
  return {title:'锦衣卫复核回报',por:j.commander,cast:[target.p],text:line,choices:[{t:'照实记档，任内升黜另依回奏',f:()=>{story(j.commander,`【御批】「${x.title}」照实记档，未额外定罪。`);return '复核结论入档；原有回奏仍按实绩审阅，不重复处罚。';}}]};
};
const clueJinyiweiTick=jinyiweiTick;
jinyiweiTick=function(){
  clueJinyiweiTick();if(!careersActive()||!jinyiweiCommanderReady())return;const j=jinyiwei();
  if(j.clueTick===S.turn)return;j.clueTick=S.turn;
  const p=j.commander;p.ageTrackedAt??=j.established;const years=Math.floor((S.turn-p.ageTrackedAt)/12);if(years>0){p.age+=years;p.ageTrackedAt+=years*12;}
  if(S.turn-(j.lastClue??j.established)<4||j.clues?.some(x=>x.status==='new')||palaceCases().some(x=>x.status==='investigating')||!chance(.35))return;
  const sources=jinyiweiClueSources();if(!sources.length)return;
  const clue=createJinyiweiClue(pick(sources));j.lastClue=S.turn;pushEv(jinyiweiClueEvent(clue));
};
const clueCasesSection=casesSection;
casesSection=function(){const base=clueCasesSection();if(!careersActive()||!jinyiwei())return base;
  const rows=(jinyiwei().clues||[]).slice().reverse(),labels={new:'待御览',assigned:'已循线查证',watching:'继续留意',shelved:'此次封存'};
  return detailSection('巡访密札',rows.length?`<ul class="story">${rows.map(x=>`<li><time>${esc(x.d)}</time><b>${esc(x.title)}</b> · ${labels[x.status]}<p>${esc(x.text)}</p>${x.status==='new'?`<button class="btn sm" onclick="A.jinyiweiClue('${x.id}')">阅看线索</button>`:''}</li>`).join('')}</ul>`:'<p class="hint">缇骑会间隔数月从未破旧案、任内回奏中带回线索。有线索才呈报，传闻须再查证。</p>')+base;
};
