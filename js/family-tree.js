/* One person record, two parent links. Household branches follow a known father. */
const layeredFamilyActive=()=>!!S&&journalContentVersion()>=19;
function familyVisibilityActive(){return !!S&&journalContentVersion()>=54;}
function familyGroupKey(c){return hasClan(c)?clanKey(c):'house-'+(c.fatherId??c.house?.father.id??c.id);}
function familyGroupHidden(key){return familyVisibilityActive()&&S.flags.hiddenFamilies?.[key]===true;}
function familyVisibilityButton(key,label){
 if(!familyVisibilityActive())return '';
 const hidden=familyGroupHidden(key);
 return `<button class="btn sm family-visibility" data-family-toggle="${esc(key)}" aria-label="${hidden?'显示':'隐藏'}${esc(label)}整个家族" aria-expanded="${!hidden}" onclick="event.preventDefault();event.stopPropagation();A.familyVisibilityToggle(${esc(JSON.stringify(key))})">${hidden?'显示家族':'隐藏'}</button>`;
}
A.familyVisibilityToggle=function(key){
 if(modalOpen||!familyVisibilityActive()||!S.consorts.some(c=>familyGroupKey(c)===key))return;
 const panel=$('#panel'),scroll=panel.scrollTop,graph=panel.querySelector?.('.graph-wrap'),x=graph?.scrollLeft||0,y=graph?.scrollTop||0;
 const open=new Map([...(panel.querySelectorAll?.('.family-branch[data-family-key]')||[])].map(el=>[el.dataset.familyKey,el.open]));
 const hidden=familyGroupHidden(key);
 if(hidden)delete S.flags.hiddenFamilies[key];else(S.flags.hiddenFamilies||={})[key]=true;
 render();panel.scrollTop=scroll;
 panel.querySelectorAll?.('.family-branch[data-family-key]').forEach(el=>{el.open=!familyGroupHidden(el.dataset.familyKey)&&(el.dataset.familyKey===key?hidden:!!open.get(el.dataset.familyKey));});
 const current=panel.querySelector?.('.graph-wrap');if(current){current.scrollLeft=x;current.scrollTop=y;}
 [...(panel.querySelectorAll?.('.family-visibility')||[])].find(el=>el.dataset.familyToggle===key)?.focus?.({preventScroll:true});
};
function familyTreeRegistry(){
  const houses=[],seen=new Set(),relatives=[];
  for(const c of familyCourtHosts()){const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);houses.push({c,h});}
  for(const {c,h} of houses)for(const p of (h.relatives||[]).filter(p=>!p.consortId||byId(p.consortId)?.familyBranchOrigin))relatives.push({c,h,p});
  if(outsideParentageActive())for(const p of S.children.filter(k=>k.outsideFamilyOrigin)){
    const origin=houses.find(x=>x.h.father.id===p.outsideFamilyOrigin.house);
    if(origin)relatives.push({...origin,p});
  }
  const men=houses.flatMap(({c,h})=>[{c,h,p:h.father,role:'father'},...brotherRoles(h).map(role=>({c,h,p:h[role],role})),...natalPeople(h).filter(p=>p.sex==='m').map(p=>({c,h,p,role:'relative'+p.id}))]);
  const menById=new Map(men.map(e=>[String(e.p.id),e]));
  const nodes=relatives.map(e=>{
    const original=e.p.outsideFamilyOrigin;
    const motherId=original?.motherId??e.p.motherRelativeId??e.p.parentRelativeId;
    let mother=relatives.find(x=>x.p.id===motherId&&x.p.sex==='f');
    if(!mother&&marriedSisterAffairsActive()&&motherId!=null){
      const host=houses.find(({h})=>h.relatives?.some(p=>p.id===motherId&&p.consortId));
      if(host)mother={...host,p:host.h.relatives.find(p=>p.id===motherId)};
    }
    const spouse=mother?.p.spouse;
    const sameMarriage=spouse&&(!e.p.fatherName||e.p.fatherName===spouse.name)&&
      (e.p.fatherId==null||e.p.fatherId===spouse.id||e.p.fatherId===`spouse:${motherId}`);
    const father=journalContentVersion()>=33
      ?menById.get(String(original?.fatherId??e.p.fatherId))||(sameMarriage?menById.get(String(spouse.personId)):null)
      :men.find(x=>x.p.id===(e.p.fatherId??spouse?.personId));
    const fatherId=father?.p.id??e.p.fatherId??spouse?.personId;
    return {...e,mother,father,fatherId,parent:father?.p.id??(mother?mother.p.id:e.p.parentRelativeId),home:father?.c||e.c};
  });
  return {houses,nodes,men};
}
function familyTreeChildren(person,registry=familyTreeRegistry()){
  return registry.nodes.filter(n=>n.parent===person.id);
}
function familyTreeFoldKey(c,id){return String(houseOf(c).father.id)+':'+id;}
function familyTreeExpanded(c,id,defaultOpen=false){return UI.familyTreeFolds?.[familyTreeFoldKey(c,id)]??defaultOpen;}
A.familyTreeToggle=function(id,person,defaultOpen=false){
  const c=familyHostById(id);if(!c||!houseOf(c))return;
  const panel=$('#panel'),branches=[...(panel.querySelectorAll?.('.family-branch')||[])].map(e=>e.open),scroll=panel.scrollTop,
    graph=panel.querySelector?.('.graph-wrap'),graphX=graph?.scrollLeft,graphY=graph?.scrollTop;
  const key=familyTreeFoldKey(c,person);(UI.familyTreeFolds ||= {})[key]=!familyTreeExpanded(c,person,defaultOpen);render();
  panel.querySelectorAll?.('.family-branch').forEach((e,i)=>{e.open=branches[i];});panel.scrollTop=scroll;
  const current=panel.querySelector?.('.graph-wrap');if(current){current.scrollLeft=graphX||0;current.scrollTop=graphY||0;}
};
function familyTreeEntries(c,registry=familyTreeRegistry()){
  const h=houseOf(c);if(!h)return [];
  const top=[...brotherRoles(h).map(role=>({p:h[role],role,c,h})),...natalPeople(h).filter(p=>!p.parentRelativeId&&!p.motherRelativeId).map(p=>({p,c,h}))];
  return top.map(e=>{
    const children=familyTreeChildren(e.p,registry);
    if(marriedSisterAffairsActive()&&e.p.sex==='f')children.push(...registry.nodes.filter(n=>n.mother?.p.id===e.p.id&&n.parent!==e.p.id));
    return {...e,children};
  });
}
function familyHouseHeight(c){
  const h=houseOf(c);if(!h)return 68;
  if(!familyTreeExpanded(c,h.father.id,true))return 68;
  const registry=familyTreeRegistry();
  return 68+familyTreeEntries(c,registry).reduce((n,e)=>n+62+(familyTreeExpanded(c,e.p.id)?e.children.length*60:0),0);
}
function familyTreePerson(c,p,role,relation,list=false){
  const royal=!!p.outsideFamilyOrigin;
  if(!royal&&list&&!role&&p.sex==='m'&&natalAge(p)>=18)role='relative'+p.id;
  const target=p.consortId?`'consort',${p.consortId}`:royal?`'kid',${p.id}`:role?`'official','${c.id}:${role}'`:`'natal','${c.id}:${p.id}'`,age=role?p.age:natalAge(p),status=royal?'已认回宫':role?officialStatus(p):natalStatus(p);
  return `<button class="graph-kin-person${p.alive===false?' deceased':''}" onclick="A.go(${target})" aria-label="查看${esc(p.name)}">${porImg(role?p:natalPortrait(p),34)}<span class="graph-person"><strong>${esc(p.name)}</strong><small>${esc(relation)} · ${role?esc(status)+' · '+esc(p.office||p.post||''):age+'岁 · '+esc(status)}${outsideChildBadge(p)}</small>${role?`<small>${age}岁 · ${esc(officialOfficeLabel(p))}</small>`:''}</span></button>`;
}
function familyHouseTree(c,list=false){
  const h=houseOf(c);if(!h)return '';
  const registry=familyTreeRegistry(),entries=familyTreeEntries(c,registry),open=familyTreeExpanded(c,h.father.id,true);
  const toggle=(p,count,defaultOpen=false)=>`<button class="family-fold" aria-expanded="${familyTreeExpanded(c,p.id,defaultOpen)}" aria-label="${familyTreeExpanded(c,p.id,defaultOpen)?'收起':'展开'}${esc(p.name)}的${defaultOpen?'家人':'子女'}" onclick="A.familyTreeToggle(${c.id},'${p.id}',${defaultOpen})">${familyTreeExpanded(c,p.id,defaultOpen)?'−':'+'}${count?`<small>${count}</small>`:''}</button>`;
  return `<div class="family-house-tree"><div class="family-tree-row">${familyTreePerson(c,h.father,'father',paternalFamily(c).filter(x=>S.consorts.includes(x)).length>1?'父亲 · 亲姐妹同父':'父亲',list)}${entries.length?toggle(h.father,entries.length,true):''}</div>${open?`<div class="family-tree-branches">${entries.map(e=>{
    const expanded=familyTreeExpanded(c,e.p.id),label=e.role?officialKinLabel(h,e.role,c):natalLabel(c,e.p);
    return `<div class="family-tree-branch" data-relative-id="${e.p.id}"><div class="family-tree-row">${familyTreePerson(c,e.p,e.role,label,list)}${e.children.length?toggle(e.p,e.children.length):''}</div>${expanded&&e.children.length?`<div class="family-tree-descendants">${e.children.map(n=>`<div class="family-tree-row" data-family-child-id="${n.p.id}">${familyTreePerson(n.mother?.p.id===e.p.id?n.c:n.home,n.p,null,n.p.sex==='m'?'儿子':'女儿',list)}</div>`).join('')}</div>`:''}</div>`;
  }).join('')}</div>`:''}</div>${list?royalTravelFamilyPanel(h):''}`;
}
const treeNatalEntry=natalEntry;
natalEntry=function(id,relative){
  const own=treeNatalEntry(id,relative);if(own||!layeredFamilyActive())return own;
  const c=familyHostById(id),h=c&&houseOf(c);if(!h)return null;
  const node=familyTreeRegistry().nodes.find(n=>String(n.p.id)===String(relative)&&n.father?.h.father.id===h.father.id);
  return node?{c,h,p:node.p,originHost:node.c.id}:null;
};
const treeNatalLabel=natalLabel;
natalLabel=function(c,p){
  if(layeredFamilyActive()&&p.parentRelativeId){const node=familyTreeRegistry().nodes.find(n=>n.p.id===p.id);
    if(node?.father?.h.father.id===houseOf(c)?.father.id)return p.sex==='m'?'侄子':'侄女';
  }
  return treeNatalLabel(c,p);
};
function natalParentLinks(c,p){
  if(!layeredFamilyActive()||!p.parentRelativeId)return `<p>${p.parentRelativeId?'母亲':'父亲'}：${p.parentRelativeId?`<button class="btn quiet" onclick="A.go('natal','${c.id}:${p.parentRelativeId}')">${esc(c.house.relatives.find(x=>x.id===p.parentRelativeId)?.name||'家中长辈')}</button>`:officialLink(c,'father')}</p>`;
  const n=familyTreeRegistry().nodes.find(n=>n.p.id===p.id),mother=n?.mother,father=n?.father;
  const motherLink=mother?(mother.p.consortId?`<button class="person-link" onclick="A.go('consort',${mother.p.consortId})">${esc(mother.p.name)}</button>`:`<button class="person-link" onclick="A.go('natal','${mother.c.id}:${mother.p.id}')">${esc(mother.p.name)}</button>`):'未详录';
  const label=p.unconfirmedParentage||['proved','stayed'].includes(p.outsideParentage?.status)?'婚籍所载父亲':'父亲';
  return `<p>${label}：${father?officialLink(father.c,father.role):esc(p.fatherName||mother?.p.spouse?.name||'未详录')}</p><p>母亲：${motherLink}</p>${father?`<p class="hint">${marriedSisterAffairsActive()?'家谱保留父母两侧的亲缘入口。':`家谱列于父亲${esc(father.p.name)}名下，母系亲缘与原有纪事保留。`}</p>`:''}`;
}

function familyAgeNote(p){
 let months;
 if(p.sex){
  if(p.alive!==false)months=S.turn-p.born;
  else if(Number.isFinite(p.deathAgeMonths))months=p.deathAgeMonths;
  else if(Number.isFinite(p.death?.turn))months=p.death.turn-p.born;
  else {const text=(p.story||[]).findLast(s=>/薨逝|夭折|去世|身亡/.test(s.t))?.t||'',match=text.match(/(?:享年|年仅|年)(\d+)岁/);if(match)months=+match[1]*12;}
 }else if(Number.isFinite(p.age))months=p.age*12;
 const value=Number.isFinite(months)?(months<12?Math.max(0,months)+'个月':Math.floor(months/12)+'岁'):'未详';
 return `<small class="family-age">${p.alive===false?'享年 ':''}${value}</small>`;
}
function familyRememberDeathAges(previous){
 if(!S||PalaceActions.blocked||journalContentVersion()<24||!previous||previous.gen!==S.gen)return;
 for(const k of S.children)if(k.alive===false&&!Number.isFinite(k.deathAgeMonths)&&previous.children?.some(p=>p.id===k.id&&p.alive))k.deathAgeMonths=Math.max(0,S.turn-k.born);
}
