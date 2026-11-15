/* ============ 锦衣卫 ============ */
// 锦衣卫只查确有其事的案子：每宗案卷在立案时已记下真正的主使（后宫疑案）或事实真伪（风闻参本），
// 密查只决定能否查到，不会临时改写真相。搜宫只能搜出确有案底的人；搜不出东西，被搜的妃嫔会记恨。
const JINYIWEI_RETRY=6, JINYIWEI_SEARCH_GAP=12;
const PALACE_CASE_EVENTS={
  '香囊疑案':{crime:'香囊藏麝',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '石阶惊变':{crime:'石阶泼油',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '巫蛊之祸':{crime:'栽赃巫蛊',culprit:ev=>ev.present?.[0],victim:ev=>ev.present?.[1]},
  '东宫惊魂':{crime:'谋害储君',culprit:ev=>ev.present?.[1],victim:ev=>ev.present?.[2]||null}
};
const jinyiwei=()=>S.jinyiwei?.commander?S.jinyiwei:null;
const palaceCases=()=>S.palaceCases||[];
const caseOpen=x=>x.status==='cold'||x.status==='investigating';
function jinyiweiCommanderReady(){const j=jinyiwei();return !!j&&officialServing(j.commander);}
function openPalaceCase(data){
  const list=S.palaceCases ||= [];
  const same=list.find(x=>caseOpen(x)&&x.kind===data.kind&&x.crime===data.crime&&x.culprit===data.culprit&&x.victim===data.victim&&x.target===data.target);
  if(same)return same;
  const item={id:`case-${S.gen}-${S.turn}-${list.length+1}`,opened:S.turn,d:dateStr(),status:'cold',tries:0,...data};
  list.push(item);if(list.length>40)list.splice(0,list.findIndex(x=>!caseOpen(x))+1||0);
  return item;
}
function caseVictimName(x){const v=x.victim!=null&&byId(x.victim);return v?fullName(v):x.victimName||'—';}

/* —— 后宫疑案：未能查明的，记入案卷；设立锦衣卫后可直接交其密查 —— */
function palaceCaseWrap(ev){
  const spec=ev&&PALACE_CASE_EVENTS[ev.title];
  if(!spec||!courtOfficesActive())return ev;
  const a=spec.culprit(ev),b=spec.victim(ev);if(!a||!S.consorts.includes(a))return ev;
  const data={kind:'harem',title:ev.title,crime:spec.crime,culprit:a.id,victim:b&&S.consorts.includes(b)?b.id:null,victimName:b?fullName(b):null};
  ev.choices=ev.choices.map(choice=>!choice.f?choice:{...choice,f:function(...args){
    const result=choice.f.apply(this,args);
    const exposed=Q.some(e=>e.title==='真相大白'&&e.cast?.[0]===a);
    if(!exposed&&result!==null)openPalaceCase({...data,note:choice.t});
    return result;
  }});
  if(jinyiwei())ev.choices.push({t:'交锦衣卫密查 · 国库−15',cond:()=>jinyiweiCommanderReady()&&E().treasury>=15,why:'锦衣卫指挥使不在任或国库不足',f:()=>{
    const item=openPalaceCase({...data,note:'交锦衣卫密查'});dispatchCase(item,15);
    if(b?.alive)story(b,`${ev.title}一案，陛下交锦衣卫密查。`);
    return `锦衣卫${jinyiwei().commander.name}领了案卷，下月回报。${fx(chg({treasury:-15}))}`;
  }});
  return ev;
}
for(let i=0;i<HAREM.length;i++){
  const create=HAREM[i],wrapped=(...args)=>palaceCaseWrap(create(...args));
  Object.defineProperty(wrapped,'name',{value:create.name});HAREM[i]=wrapped;
}

/* —— 设立与差遣 —— */
A.establishJinyiwei=function(){
  if(modalOpen||S.over||jinyiwei())return;
  pushEv({title:'设立锦衣卫',text:'锦衣卫掌侍卫、缉捕与诏狱，可替陛下密查宫闱疑案、核实风闻奏事，也能搜查宫室。\n文官们担心“厂卫横行”，设立之后每次搜宫或密查都会让朝野多一分侧目。',choices:[
    {t:'设立锦衣卫，择人出任指挥使 · 精力−1 · 国库−50',cond:()=>E().energy>=1&&E().treasury>=50,why:'精力或国库不足',f:()=>{
      if(jinyiwei()||!useE())return null;chg({treasury:-50});
      const sur=pick(SUR),given=pick(BROTHER_NAMES),seed=ri(1,2e9),faces=[273,285,286,287];
      const commander={id:`jyw-${S.gen}-${S.turn}`,name:sur+given,sur,age:ri(30,46),seed,ability:ri(55,82),trust:50,merit:20,temperament:pick(['持正','谨慎','进取']),
        office:'锦衣卫指挥使',post:'锦衣卫指挥使',career:'official',alive:true,story:[],official:3,artPortrait:faces[seed%faces.length],jinyiwei:true};
      if(expandedOfficialPortraitsActive()){delete commander.artPortrait;assignCourtOfficialPortrait(commander,'army');}
      S.jinyiwei={established:S.turn,commander,searched:{}};story(commander,'奉旨出任锦衣卫指挥使。');
      policyNudge('civil',-3);log(`设立锦衣卫，以${commander.name}为指挥使。`,1);save('auto');
      return {text:`${commander.name}领了绣春刀与飞鱼服，叩首谢恩。${fx(chg({prestige:1}))}`,por:commander};
    }},{t:'暂不设立'}]});
};
function caseReady(x){return !!x&&x.status==='cold'&&S.turn-(x.lastTry??-99)>=JINYIWEI_RETRY;}
function dispatchCase(x,cost){x.status='investigating';x.due=S.turn+1;x.tries++;x.lastTry=S.turn;x.cost=cost;policyNudge('civil',-1);}
A.jinyiweiInvestigate=function(id){
  const x=palaceCases().find(c=>c.id===id);if(modalOpen||!caseReady(x)||!jinyiweiCommanderReady())return;
  pushEv({title:'锦衣卫密查 · '+x.title,por:jinyiwei().commander,text:`案卷：${x.title}（${x.d}立案）。${x.kind==='harem'?`受害：${caseVictimName(x)}。`:''}${x.tries?`此前已查过${x.tries}次未果。`:''}\n指挥使${jinyiwei().commander.name}才干${rd(jinyiwei().commander.ability)}，下月回报。`,choices:[
    {t:'派人密查 · 精力−1 · 国库−15',cond:()=>caseReady(x)&&E().energy>=1&&E().treasury>=15,why:'精力或国库不足',f:()=>{
      if(!caseReady(x)||!useE())return null;chg({treasury:-15});dispatchCase(x,15);
      story(jinyiwei().commander,`奉旨密查「${x.title}」旧案。`);save('auto');return '缇骑已经出发，下月回报。';
    }},{t:'暂缓'}]});
};
// 回报：成败看指挥使才干、案子新旧与此前查过几次；真相在立案时已定。
function caseOdds(x){const j=jinyiwei();return clamp(.3+j.commander.ability/200+Math.min(.15,(x.tries-1)*.05)-(S.turn-x.opened>36?.1:0),.1,.85);}
function caseReport(x){
  const j=jinyiwei(),found=chance(caseOdds(x));
  x.status=found?'solved':'cold';delete x.due;
  if(x.kind==='rumor')return rumorReport(x,found);
  const a=byId(x.culprit),v=x.victim!=null?byId(x.victim):null;
  if(!found){
    story(j.commander,`密查「${x.title}」，线索中断。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：「${x.title}」一案，经手的宫人或死或散，线索暂断。案卷仍留，半年后可再查。`,choices:[{t:'知道了'}]};
  }
  j.commander.merit=clamp(j.commander.merit+8);story(j.commander,`密查「${x.title}」，查得主使。`);x.solvedTurn=S.turn;
  const reachable=a&&a.alive&&!a.gone;
  if(!reachable){
    if(v?.alive)story(v,`锦衣卫查明，${x.crime}一事的主使是${a?fullName(a):'已不在宫中之人'}。此人已不在人世或早已出宫，无从问罪。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：「${x.title}」的主使是${a?fullName(a):'旧人'}，但此人已不在宫中，无从问罪。真相已记入案卷。`,choices:[{t:'记入案卷'}]};
  }
  const wronged=x.crime==='栽赃巫蛊'&&v?.alive&&v.cold;
  return {title:'锦衣卫密报',por:j.commander,cast:[j.commander,a],text:`${j.commander.name}回奏：「${x.title}」一案查得人证物证，主使是${cName(a)}。${wronged?`\n${fullName(v)}至今仍在冷宫喊冤。`:''}`,choices:[
    {t:wronged?`为${fullName(v)}平反，传${cName(a)}问话`:`传${cName(a)}问话`,f:()=>{
      if(wronged){A.uncold(v.id);if(S.flags.wronged?.v===v.id)S.flags.wronged=null;story(v,'锦衣卫查明她是被人栽赃，奉旨出冷宫。');cchg(v,{mood:20,aff:10});}
      a.known=true;pushNow(punishEv(a,v&&inPalace(v)?v:null,x.crime));return '侍卫往她宫中去了。';
    }},
    {t:'记下真相，暂不声张',f:()=>{a.known=true;story(a,`锦衣卫查得${x.crime}一事是她所为，陛下暂未声张。`);x.withheld=true;
      if(v?.alive&&!wronged)story(v,`${x.crime}一事已有了结论，陛下却没有声张。`);return `案卷封存。${cName(a)}还不知道你已经知道了。`;}}]};
}
function rumorReport(x,found){
  const j=jinyiwei(),actor=officialEntry(x.accuserKey),target=officialEntry(x.target);
  if(!actor||!target||actor.p.id!==x.accuser||target.p.id!==x.targetId){x.status='closed';return null;}
  if(!found){x.status='cold';story(j.commander,`密查${target.p.name}被参一事，未得实据。`);
    return {title:'锦衣卫密报',por:j.commander,text:`${j.commander.name}回奏：${target.p.name}被参「${x.charge}」一事，暂未查得实据，也未能证其清白。`,choices:[{t:'知道了'}]};}
  const delta=x.friendsBefore?-12:-8;
  if(x.truth){target.p.trust=clamp(target.p.trust-5);target.p.merit=clamp(target.p.merit-6);actor.p.trust=clamp(actor.p.trust+2);
    officialRecord(target.c,target.role,`锦衣卫查实其「${x.charge}」，罚俸半年。`,{emotion:-.5});officialRecord(actor.c,actor.role,`参劾${target.p.name}，经锦衣卫查实。`);}
  else{actor.p.trust=clamp(actor.p.trust-6);
    officialRecord(target.c,target.role,`被参「${x.charge}」，锦衣卫查明并无其事，得还清白。`,{emotion:.3});officialRecord(actor.c,actor.role,`参劾${target.p.name}，锦衣卫查无其事。`,{emotion:-.4});}
  if(inPalace(actor.c)&&inPalace(target.c))relAdd(actor.c,target.c,delta);
  story(j.commander,`密查${target.p.name}被参一事，${x.truth?'查实':'查明不实'}。`);
  return {title:'锦衣卫密报',por:j.commander,cast:[j.commander,target.p,actor.p],text:`${j.commander.name}回奏：${target.p.name}被参「${x.charge}」一事，${x.truth?'确有其事，已取得驿递簿与证人口供':'查无其事，系同僚以讹传讹'}。`,choices:[{t:'依例处置'}]};
}
// 同朝参本中的风闻之事，可改交锦衣卫核实；真伪在交办时即已定下。
function jinyiweiRumorChoice(pair,cast,charge){
  if(!jinyiwei()||cast.lapse?.grounded)return null;
  return {t:'交锦衣卫核实 · 国库−15',cond:()=>jinyiweiCommanderReady()&&E().treasury>=15,why:'锦衣卫指挥使不在任或国库不足',f:()=>{
    const item=openPalaceCase({kind:'rumor',title:`${cast.y.p.name}被参`,crime:'风闻奏事',charge,accuser:cast.x.p.id,accuserKey:cast.x.key,targetId:cast.y.p.id,target:cast.y.key,truth:chance(.3),friendsBefore:pair.rel>=KIN_COURT_FRIEND});
    chg({treasury:-15});dispatchCase(item,15);
    officialRecord(cast.y.c,cast.y.role,`被${cast.x.p.name}参劾，奉旨交锦衣卫核实。`,{emotion:-.2});
    officialRecord(cast.x.c,cast.x.role,`参劾${cast.y.p.name}，奉旨交锦衣卫核实。`);
    return '缇骑已出京查访，下月回报。';
  }};
}

/* —— 搜宫：只能搜出确有案底的人 —— */
function searchReady(c){const j=jinyiwei();return !!j&&jinyiweiCommanderReady()&&harem().includes(c)&&S.turn-(j.searched?.[c.id]??-99)>=JINYIWEI_SEARCH_GAP&&E().energy>=1;}
A.jinyiweiSearch=function(id){
  const c=byId(id);if(modalOpen||!searchReady(c))return;
  pushEv({title:'搜宫 · '+cName(c),por:c,present:[c],text:`命锦衣卫搜查${c.palace||'她的居处'}。${c.rank===8?'\n搜查中宫，朝野必然震动。':''}\n若查不出东西，她会记恨，六宫也会人人自危。`,choices:[
    {t:'搜 · 精力−1',cond:()=>searchReady(c),why:'精力不足，或一年内已搜查过',f:()=>{
      if(!searchReady(c)||!useE())return null;const j=jinyiwei();j.searched[c.id]=S.turn;policyNudge('civil',-1);
      const x=palaceCases().find(k=>k.kind==='harem'&&caseOpen(k)&&k.culprit===c.id);
      if(x){x.status='solved';x.solvedTurn=S.turn;delete x.due;const v=x.victim!=null?byId(x.victim):null;
        story(j.commander,`搜查${fullName(c)}居处，搜出「${x.title}」一案的物证。`);
        const wronged=x.crime==='栽赃巫蛊'&&v?.alive&&v.cold;if(wronged){A.uncold(v.id);if(S.flags.wronged?.v===v.id)S.flags.wronged=null;story(v,'锦衣卫搜出栽赃的物证，她奉旨出冷宫。');}
        c.known=true;pushNow(punishEv(c,v&&inPalace(v)?v:null,x.crime));
        return `锦衣卫在${c.palace}的暗格里搜出了与「${x.title}」相关的物证。`;}
      story(c,`锦衣卫奉旨搜查她的居处，一无所获。她当着六宫的面受了这番羞辱。`);setXin(c,'委屈','居处被锦衣卫搜查');
      for(const o of harem())if(o!==c)cchg(o,{mood:-2});
      return `翻遍了箱笼妆奁，什么也没搜出来。${fx(chg({prestige:c.rank===8?-4:-1}),cchg(c,{aff:-10,mood:-15}))}`;
    }},{t:'作罢'}]});
};

/* —— 每月：回报到期的案子 —— */
function jinyiweiTick(){
  if(!courtOfficesActive()||!jinyiwei())return;
  for(const x of palaceCases().filter(k=>k.status==='investigating'&&k.due<=S.turn)){
    if(!jinyiweiCommanderReady()){x.status='cold';continue;}
    const ev=caseReport(x);if(ev)pushEv(ev);
  }
}
const jinyiweiBaseTick=courtTick;
courtTick=function(...args){const result=jinyiweiBaseTick.apply(this,args);jinyiweiTick();return result;};

/* —— 页面 —— */
function viewJinyiwei(){
  const back=`<button class="btn quiet sm detail-back" onclick="A.go('government')">← 返回治国理政</button>`,j=jinyiwei();
  if(!j)return `${back}<h2>锦衣卫</h2><p>锦衣卫可密查宫闱疑案、核实风闻奏事、搜查宫室。尚未设立。</p><div class="acts"><button class="btn jade" onclick="A.establishJinyiwei()">设立锦衣卫<small>精力−1 · 国库−50</small></button></div>${casesSection()}`;
  const c=j.commander;
  return `${back}<header class="detail-head">${porImg(c,160)}<div class="grow"><p>锦衣卫</p><h2>${esc(c.name)}</h2><p>指挥使 · ${c.age}岁 · ${officialStatus(c)} · ${esc(c.temperament)}</p></div></header>
    <div class="detail-vitals">${bar('才干',c.ability)}${bar('功绩',c.merit)}${bar('信任',c.trust)}</div>
    ${casesSection()}
    ${detailSection('搜查宫室',`<p class="hint">只有确有案底的人才可能被搜出物证；搜不出东西，被搜者记恨、六宫不安。同一人一年内只搜一次。</p><div class="acts">${harem().map(x=>`<button class="btn sm" onclick="A.jinyiweiSearch(${x.id})" ${searchReady(x)?'':'disabled'}>${esc(cName(x))}<small>${esc(x.palace||'')}</small></button>`).join('')}</div>`)}
    ${detailFold('指挥使履历',detailStory(c))}`;
}
function casesSection(){
  const list=palaceCases().slice().reverse(),label={cold:'未破',investigating:'密查中',solved:'已破',closed:'已结'};
  const row=x=>`<li><time>${esc(x.d)}</time><b>${esc(x.title)}</b> · ${label[x.status]||x.status}${x.kind==='harem'?` · 受害：${esc(caseVictimName(x))}`:` · ${esc(x.charge||'')}`}${x.tries?` · 已查${x.tries}次`:''}
    ${jinyiwei()&&x.status==='cold'?`<button class="btn sm" onclick="A.jinyiweiInvestigate('${x.id}')" ${caseReady(x)&&jinyiweiCommanderReady()?'':'disabled'}>派人密查${caseReady(x)?'':' · 半年内已查'}</button>`:''}</li>`;
  return detailSection('案卷',list.length?`<ul class="story">${list.map(row).join('')}</ul>`:'<p class="hint">尚无未破的案子。后宫疑案未能查明时，会记入这里。</p>');
}
