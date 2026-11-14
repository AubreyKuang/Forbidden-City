/* A shared birthday is a relationship, not a shared personality. Reads never roll RNG. */
const MULTIPLE_BIRTH_LABELS={
  mm:{name:'双龙并耀',detail:'双生皇子'},ff:{name:'双凤齐鸣',detail:'双生公主'},fm:{name:'龙凤呈祥',detail:'龙凤胎'},
  mmm:{name:'三龙同辉',detail:'三位同生皇子'},fff:{name:'三凤同辉',detail:'三位同生公主'},
  fmm:{name:'双龙伴凤',detail:'两位皇子与一位公主同生'},ffm:{name:'双凤伴龙',detail:'两位公主与一位皇子同生'}
};
const multipleIsOutsider=k=>!!(k?.birthSwap?.occurred&&k.birthSwap.confirmed);
function multipleMembers(k){
  if(k?.birthGroup==null||multipleIsOutsider(k))return [];
  return S.children.filter(o=>o.birthGroup===k.birthGroup&&!multipleIsOutsider(o))
    .sort((a,b)=>(a.birthOrder||99)-(b.birthOrder||99)||a.id-b.id);
}
function multipleIdentity(k){
  if(!k||multipleIsOutsider(k))return null;
  const group=multipleMembers(k),expected=k.birthType==='三胞胎'?3:k.birthType?2:group.length;
  let composition=MULTIPLE_BIRTH_LABELS[k.birthComposition]?k.birthComposition:'';
  if(!composition&&expected>=2&&group.length===expected)composition=group.map(p=>p.sex).sort().join('');
  if(!composition&&k.birthType==='龙凤胎')composition='fm';
  if(!composition&&k.birthType==='双胞胎')composition=k.sex+k.sex;
  const label=MULTIPLE_BIRTH_LABELS[composition];
  return label?{...label,composition,count:composition.length}:expected===3?{name:'三曜同辉',detail:'三胞同生',count:3}:null;
}
function registerMultipleBirth(children){
  if(children.length<2)return;
  const composition=children.map(k=>k.sex).sort().join('');
  children.forEach((k,i)=>{k.birthGroup=children[0].id;k.birthOrder=i+1;k.birthType=birthType(children.map(o=>o.sex));k.birthComposition=composition;});
}
function reconcileMultipleBirths(){
  // Only an explicit historical batch establishes kinship, never matching birthdays.
  for(const k of S.children){
    if(multipleIsOutsider(k))continue;
    const info=multipleIdentity(k);if(info?.composition&&!k.birthComposition)k.birthComposition=info.composition;
  }
}
function multipleBadge(k){const info=multipleIdentity(k);return info?`<span class="tag multiple-birth-tag" title="${esc(info.detail)}">${esc(info.name)} · ${esc(info.detail)}</span>`:'';}
function multipleRelation(k,o){
  if(!Number.isInteger(k.birthOrder)||!Number.isInteger(o.birthOrder)||k.birthOrder===o.birthOrder)return '同生手足';
  return '同生'+(o.birthOrder<k.birthOrder?(o.sex==='m'?'哥哥':'姐姐'):(o.sex==='m'?'弟弟':'妹妹'));
}
function multipleMother(group){
  const m=byId(group[0]?.mom);
  return inPalace(m)&&group.every(k=>k.mom===m.id&&familyVisitAllowed(k,m))?m:null;
}
const multipleKey=k=>`${S.gen}:${k.birthGroup}`;
const multipleState=k=>k?S.flags.multipleBirthMoments?.[multipleKey(k)]:null;
function multipleAvailable(k,rule){
  const group=multipleMembers(k),info=multipleIdentity(k),state=multipleState(k);
  if(!rule||S.over||mourningActive()||!info||group.length!==info.count||state?.seen?.[rule.id]!==undefined||S.turn-(state?.last??-99)<6)return false;
  if(!group.every(p=>p.alive&&!p.gone&&!p.pendingName&&!p.removedFromRoyal&&!p.jailed&&!p.templeStay&&p.hp>=40&&
    kidAge(p)>=rule.min&&kidAge(p)<=rule.max&&(rule.remote||childInPalace(p))))return false;
  return (!rule.fit||rule.fit(group))&&(!rule.mother||!!multipleMother(group));
}
function multipleSay(k,lines){return `${k.name}：“${lines[childDisposition(k)]||lines.default}”`;}
function multipleMotherLine(m){
  if(['骄纵','骄矜','善妒'].includes(m.trait))return '“这句好话臣妾爱听。只是日后，也请陛下把每个孩子的名字记清。”';
  if(['好学','聪慧','城府'].includes(m.trait))return '“星图可以慢慢看，乳母的轮值簿可得先排妥。臣妾要每个孩子都照顾到。”';
  if(m.trait==='将门'||m.trait==='爽直')return '“都说将来不得了，臣妾却只盼他们各有胆量，也能彼此照应。”';
  return '“臣妾听着欢喜。愿他们各自平安，也愿长大以后仍认得彼此的心事。”';
}
function multipleBlessing(group){
  const info=multipleIdentity(group[0]),master=daoMaster(),m=multipleMother(group);
  const vision=group.length===3?'昨夜三点星光映在殿前水中，风来时散开，风定又聚。':info.composition==='fm'?'昨夜云边一缕如龙，一缕似凤，过宫墙时交映成霞。':'园中一枝并蒂花初开，两朵各向一边，却共饮一脉春水。';
  const saying={清疏:'同从一片云里来，也可各往一处山中去。',通达:'这份瑞意，贵在相照，未必要他们步步相同。',博闻:'古人借星与花寄愿，今日便借它祝这几位同生手足各有所成。',恬淡:'愿他们不必争着应验一句预言，只把自己的日子过好。'}[master.temper];
  return `国师${master.name}来贺「${info.name}」，轻展一张云纹笺：\n“${vision}${saying}”\n${m?fullName(m)+'听过，'+multipleMotherLine(m):''}\n襁褓里的孩子各自睡着，乳母把他们的小名一一报给你听。`;
}
function multipleMomentEvent(k,id){
  const rule=MULTIPLE_MOMENTS.find(r=>r.id===id);if(!multipleAvailable(k,rule))return null;
  const group=multipleMembers(k),ids=group.map(p=>p.id),gen=S.gen,mother=rule.mother?multipleMother(group):null;
  const valid=()=>S.gen===gen&&kidById(k.id)===k&&multipleAvailable(k,rule)&&JSON.stringify(multipleMembers(k).map(p=>p.id))===JSON.stringify(ids)&&(!rule.mother||multipleMother(group)===mother);
  return {title:rule.title,cast:[...(rule.mother?[daoMaster(),mother]:[]),...group].filter(Boolean),present:rule.remote?[]:[...group,...(mother?[mother]:[])],valid,
    ref:rule.source.name,refURL:rule.source.url,text:rule.begin(group)+'\n\n'+rule.source.note,
    choices:[...rule.choices.map((choice,index)=>({t:choice.label+' · 精力−1'+(choice.cost?' · 国库−'+choice.cost:''),
      cond:()=>valid()&&E().energy>=1&&E().treasury>=(choice.cost||0),why:'精力或国库不足',f:()=>{
        if(!valid()||E().treasury<(choice.cost||0)||!useE())return null;
        if(choice.cost)chg({treasury:-choice.cost});
        S.flags.multipleBirthMoments||={};const state=S.flags.multipleBirthMoments[multipleKey(k)]||={seen:{},history:[]};
        state.seen[id]=S.turn;state.last=S.turn;
        const result=choice.result(group),memories=group.map((p,i)=>choice.memory(p,i,group));
        group.forEach((p,i)=>{for(const [stat,delta] of Object.entries(choice.stats||{}))p[stat]=clamp((p[stat]||0)+delta);
          kstory(p,`【同生手足·${rule.title}】${result}`);p.multipleMemory={turn:S.turn,title:rule.title,text:memories[i],born:p.born,min:rule.min,max:rule.max};});
        if(choice.relation)for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)relAdd(group[i],group[j],choice.relation);
        if(mother){story(mother,`【${rule.title}】${result}`);cchg(mother,{mood:5,aff:3});}
        NPCMemory.record(S,{type:'multiple-birth',time:S.turn,location:rule.remote?'家书往来':rule.mother?'宫中贺生':'同生手足小聚',participants:ids,outcome:result},group.map((p,i)=>({person:p.id,subject:group[(i+1)%group.length].id,interpretation:memories[i],emotion:.4,impact:65})));
        state.history.push({title:rule.title,turn:S.turn,text:result,choice:index});if(state.history.length>12)state.history.shift();
        log(`${group.map(p=>p.name).join('、')}：${rule.title}。`);save('auto');
        return result+fx('精力−1',choice.cost?'国库−'+choice.cost:'',...Object.entries(choice.stats||{}).map(([stat,n])=>'每人'+({love:'父爱',lit:'才学',vir:'品德',mar:'武艺'}[stat]||stat)+'+'+n),choice.relation?'手足间关系+'+choice.relation:'');
      }})),{t:'先听到这里，改日再聊'}]};
}
A.multipleTalk=function(id,topic){if(modalOpen||!S)return;const ev=multipleMomentEvent(kidById(id),topic);if(ev)pushEv(ev);};
function multipleBirthPanel(k){
  const info=multipleIdentity(k);if(!info)return '';
  const siblings=multipleMembers(k).filter(p=>p!==k),state=multipleState(k),ready=MULTIPLE_MOMENTS.filter(r=>multipleAvailable(k,r));
  const links=siblings.map(o=>`<button class="btn quiet multiple-sibling" onclick="A.go('kid',${o.id})">${porImg(o,52)}<span>${esc(multipleRelation(k,o))} · ${esc(o.name)}<small>${esc(!o.alive?(o.lost?'下落不明':'已故'):childHasLeftPalace(o)?childWhereabouts(o):'宫中 · '+childDisposition(o))}</small></span></button>`).join('');
  return `<section class="multiple-birth-panel"><small class="history-eyebrow">同生手足 · ${esc(info.name)}</small><h3>同一天来，各有自己的名字</h3><div class="multiple-siblings">${links||'<p class="hint">旧档中的同生手足资料暂不完整。</p>'}</div><p class="hint">${esc(info.detail)}。${k.birthOrder?'诞生簿记为'+(['先降生','随后降生','最后降生'][k.birthOrder-1]||'同日降生')+'；':''}宫中排行仍各按皇子、公主记载。</p>
    <div class="acts">${ready.map(r=>`<button class="btn jade" onclick="A.multipleTalk(${k.id},'${r.id}')">${esc(r.title)}<small>同生手足互动 · 精力−1</small></button>`).join('')}</div>
    ${!ready.length?`<p class="hint">${state&&S.turn-state.last<6?'上次的话还在心头，过些日子再聚。':'各自成长、安顿下来后，还会有新的话题。'}</p>`:''}
    ${state?.history?.length?`<details><summary>一起经历过的事</summary>${state.history.slice(-3).map(h=>`<p><strong>${esc(h.title)}</strong> · ${esc(h.text)}</p>`).join('')}</details>`:''}</section>`;
}
function multipleVoice(k){
  const a=kidAge(k);if(a<3||!multipleIdentity(k))return null;
  const memory=k.multipleMemory;
  if(memory&&memory.min>=3&&a>=memory.min&&a<=memory.max&&S.turn-memory.turn>=0&&S.turn-memory.turn<12)return voiceLine('multiple-memory',`提起「${memory.title}」，仍记得当时的话。`,memory.text);
  const other=multipleMembers(k).find(o=>o!==k&&o.alive&&!o.gone&&!o.removedFromRoyal&&!o.pendingName);if(!other)return null;
  const who=other.name,close=relGet(k,other)>=15,away=childHasLeftPalace(other)||childHasLeftPalace(k);
  if(!close)return voiceLine('multiple-distance','说起同生手足，语气有一点别扭。',a<6?`我今天不想和${who}玩。明天……明天再说。`:`人人说我与${who}同日出生，便该事事投契。可我们也有合不来的时候，父皇肯听听么？`);
  if(a<6)return voiceLine('multiple-child','说着自己的事，又想起同日出生的手足。',away?`这块小糕想留给${who}。回来还能一起吃吗？`:`我的名字和${who}不一样！不过玩的时候，可以叫我们一起。`);
  return voiceLine('multiple-sibling','同生手足的名字，自然而然落进了话里。',away?`想给${who}留一封信。我们如今各有住处，小时候的事却还记得。`:['好胜','自矜'].includes(childDisposition(k))?`我想赢${who}，也不许旁人只拿输赢笑话我们。父皇，这两件事并不冲突。`:childDisposition(k)==='好奇'?`我问${who}，同一天出生的人，为什么偏偏喜欢不同的东西？越想越有意思。`:`${who}有自己的主意，我也有。一起长大，不必连想法都长成一样。`);
}
function multipleLeads(){
  const seen=new Set(),leads=[];
  for(const k of S.children){
    if(multipleIsOutsider(k)||seen.has(k.birthGroup)||kidAge(k)<3)continue;seen.add(k.birthGroup);
    const rule=MULTIPLE_MOMENTS.find(r=>!r.remote&&multipleAvailable(k,r));if(!rule)continue;
    const group=multipleMembers(k);leads.push({place:kidAge(k)<6?'yh':'ss',person:k,cast:group,
      title:'同生手足 · '+rule.title,text:group.map(p=>p.name).join('、')+'有话想一起说。',topic:rule.id});
  }
  return leads.slice(0,2);
}
function multipleAt(place){return multipleLeads().filter(l=>l.place===place).map(l=>`<section class="multiple-birth-panel"><small class="history-eyebrow">${esc(multipleIdentity(l.person).name)}</small><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p><button class="btn jade" onclick="A.multipleTalk(${l.person.id},'${l.topic}')">听听他们的话<small>精力−1</small></button></section>`).join('');}
