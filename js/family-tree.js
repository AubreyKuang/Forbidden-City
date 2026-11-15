/* One person record, two parent links. Household branches follow a known father. */
const layeredFamilyActive=()=>!!S&&journalContentVersion()>=19;
function familyTreeRegistry(){
  const houses=[],seen=new Set(),relatives=[];
  for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);houses.push({c,h});}
  for(const {c,h} of houses)for(const p of natalPeople(h))relatives.push({c,h,p});
  const men=houses.flatMap(({c,h})=>[{c,h,p:h.father,role:'father'},...brotherRoles(h).map(role=>({c,h,p:h[role],role})),...natalPeople(h).filter(p=>p.sex==='m').map(p=>({c,h,p,role:'relative'+p.id}))]);
  const nodes=relatives.map(e=>{
    const motherId=e.p.motherRelativeId??e.p.parentRelativeId,mother=relatives.find(x=>x.p.id===motherId&&x.p.sex==='f');
    const fatherId=e.p.fatherId??mother?.p.spouse?.personId,father=men.find(x=>x.p.id===fatherId);
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
  const c=byId(id);if(!c||!houseOf(c))return;
  const panel=$('#panel'),branches=[...(panel.querySelectorAll?.('.family-branch')||[])].map(e=>e.open),scroll=panel.scrollTop,
    graph=panel.querySelector?.('.graph-wrap'),graphX=graph?.scrollLeft,graphY=graph?.scrollTop;
  const key=familyTreeFoldKey(c,person);(UI.familyTreeFolds ||= {})[key]=!familyTreeExpanded(c,person,defaultOpen);render();
  panel.querySelectorAll?.('.family-branch').forEach((e,i)=>{e.open=branches[i];});panel.scrollTop=scroll;
  const current=panel.querySelector?.('.graph-wrap');if(current){current.scrollLeft=graphX||0;current.scrollTop=graphY||0;}
};
function familyTreeEntries(c,registry=familyTreeRegistry()){
  const h=houseOf(c);if(!h)return [];
  const top=[...brotherRoles(h).map(role=>({p:h[role],role,c,h})),...natalPeople(h).filter(p=>!p.parentRelativeId&&!p.motherRelativeId).map(p=>({p,c,h}))];
  return top.map(e=>({...e,children:familyTreeChildren(e.p,registry)}));
}
function familyHouseHeight(c){
  const h=houseOf(c);if(!h)return 68;
  if(!familyTreeExpanded(c,h.father.id,true))return 68;
  const registry=familyTreeRegistry();
  return 68+familyTreeEntries(c,registry).reduce((n,e)=>n+62+(registry.nodes.some(x=>x.mother?.p.id===e.p.id&&x.parent!==e.p.id)?28:0)+(familyTreeExpanded(c,e.p.id)?e.children.length*60:0),0);
}
function familyTreePerson(c,p,role,relation,list=false){
  if(list&&!role&&p.sex==='m'&&natalAge(p)>=18)role='relative'+p.id;
  const target=role?`'official','${c.id}:${role}'`:`'natal','${c.id}:${p.id}'`,age=role?p.age:natalAge(p),status=role?officialStatus(p):natalStatus(p);
  return `<button class="graph-kin-person${p.alive===false?' deceased':''}" onclick="A.go(${target})" aria-label="查看${esc(p.name)}">${porImg(role?p:natalPortrait(p),34)}<span class="graph-person"><strong>${esc(p.name)}</strong><small>${esc(relation)} · ${role?esc(status)+' · '+esc(p.office||p.post||''):age+'岁 · '+esc(status)}</small>${role?`<small>${age}岁 · ${esc(officialOfficeLabel(p))}</small>`:''}</span></button>`;
}
function familyHouseTree(c,list=false){
  const h=houseOf(c);if(!h)return '';
  const registry=familyTreeRegistry(),entries=familyTreeEntries(c,registry),open=familyTreeExpanded(c,h.father.id,true);
  const toggle=(p,count,defaultOpen=false)=>`<button class="family-fold" aria-expanded="${familyTreeExpanded(c,p.id,defaultOpen)}" aria-label="${familyTreeExpanded(c,p.id,defaultOpen)?'收起':'展开'}${esc(p.name)}的${defaultOpen?'家人':'子女'}" onclick="A.familyTreeToggle(${c.id},'${p.id}',${defaultOpen})">${familyTreeExpanded(c,p.id,defaultOpen)?'−':'+'}${count?`<small>${count}</small>`:''}</button>`;
  return `<div class="family-house-tree"><div class="family-tree-row">${familyTreePerson(c,h.father,'father',paternalFamily(c).filter(x=>S.consorts.includes(x)).length>1?'父亲 · 亲姐妹同父':'父亲',list)}${entries.length?toggle(h.father,entries.length,true):''}</div>${open?`<div class="family-tree-branches">${entries.map(e=>{
    const expanded=familyTreeExpanded(c,e.p.id),label=e.role?officialKinLabel(h,e.role,c):natalLabel(c,e.p);
    const maternal=registry.nodes.filter(n=>n.mother?.p.id===e.p.id&&n.parent!==e.p.id);
    return `<div class="family-tree-branch" data-relative-id="${e.p.id}"><div class="family-tree-row">${familyTreePerson(c,e.p,e.role,label,list)}${e.children.length?toggle(e.p,e.children.length):''}</div>${maternal.length?`<small class="family-married-hint">${maternal.length}名子女列于${esc(maternal[0].father?.p.name||'夫家')}名下 · 详情可查看</small>`:''}${expanded&&e.children.length?`<div class="family-tree-descendants">${e.children.map(n=>`<div class="family-tree-row" data-family-child-id="${n.p.id}">${familyTreePerson(n.home,n.p,null,n.p.sex==='m'?'儿子':'女儿',list)}</div>`).join('')}</div>`:''}</div>`;
  }).join('')}</div>`:''}</div>`;
}
const treeNatalEntry=natalEntry;
natalEntry=function(id,relative){
  const own=treeNatalEntry(id,relative);if(own||!layeredFamilyActive())return own;
  const c=byId(+id),h=c&&houseOf(c);if(!h)return null;
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
  return `<p>父亲：${father?officialLink(father.c,father.role):esc(p.fatherName||mother?.p.spouse?.name||'未详录')}</p><p>母亲：${mother?`<button class="person-link" onclick="A.go('natal','${mother.c.id}:${mother.p.id}')">${esc(mother.p.name)}</button>`:'未详录'}</p>${father?`<p class="hint">家谱列于父亲${esc(father.p.name)}名下，母系亲缘与原有纪事保留。</p>`:''}`;
}
