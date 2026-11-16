/* Recorded cousins share a clan, not a father. Keep both paternal households. */
const cousinFamiliesActive=()=>!!S&&journalContentVersion()>=40;
function reconcileCousinFamilies(extra=[]){
 if(!cousinFamiliesActive())return;
 const people=[...new Map([...familyOriginPeople(),...extra].filter(c=>c&&!c.maid).map(c=>[c.id,c])).values()],by=new Map(people.map(c=>[String(c.id),c]));
 const groups=[],seen=new Set();
 for(const c of people){
  if(seen.has(c.id))continue;
  const group=[c];seen.add(c.id);
  for(let n=0;n<group.length;n++)for(const other of people){
   if(seen.has(other.id)||other.sur!==group[n].sur)continue;
   if(![group[n].kin?.[other.id],other.kin?.[group[n].id]].some(k=>/^[亲堂][姐妹]$/.test(k||'')))continue;
   group.push(other);seen.add(other.id);
  }
  if(group.length>1)groups.push(group);
 }
 for(const group of groups){
  const anchor=group.find(c=>c.clan&&c.clan===S.flags.dowager?.clan)||group.slice().sort((a,b)=>Number(!S.consorts.includes(a))-Number(!S.consorts.includes(b))||a.id-b.id)[0],key=clanKey(anchor);
  group.forEach(c=>{c.clan=key;houseOf(c);});
  const fathers=new Map(group.map(c=>[c.house.father.id,{c,p:c.house.father}])),edges=new Map([...fathers.keys()].map(id=>[id,new Set([id])]));
  for(const c of group)for(const [id,kind] of Object.entries(c.kin||{})){
   const other=by.get(id);if(!/^堂[姐妹]$/.test(kind)||!group.includes(other))continue;
   const a=c.house.father.id,b=other.house.father.id;if(a===b)continue;
   edges.get(a).add(b);edges.get(b).add(a);
  }
  // Several cousin pairs may refer to three brothers; close the sibling group once.
  for(const ids of edges.values())for(const id of ids)for(const next of edges.get(id)||[])ids.add(next);
  for(const [id,ids] of edges){
   const {p}=fathers.get(id);if(ids.size<2)continue;
   p.siblingFatherIds ||= [];
   for(const otherId of ids){
    if(otherId===id||p.siblingFatherIds.includes(otherId))continue;
    const other=fathers.get(otherId).p;p.siblingFatherIds.push(otherId);
    story(p,`【族谱亲缘】${other.name}与自己是亲兄弟，两房女儿为堂姐妹；各自保留本房家人与仕履。`);
   }
  }
  for(const a of group)for(const b of group){
   if(a===b||a.house.father.id===b.house.father.id||!edges.get(a.house.father.id)?.has(b.house.father.id))continue;
   a.kin ||= {};a.kin[b.id] ||= '堂'+(b.age>a.age||b.age===a.age&&b.id<a.id?'姐':'妹');
  }
 }
}
function cousinFatherEntries(c){
 if(!cousinFamiliesActive())return [];
 const father=c?.house?.father;if(!father)return [];
 const seen=new Set();return familyCourtHosts().filter(o=>{
  const id=o.house?.father?.id;if(!id||seen.has(id)||!father.siblingFatherIds?.includes(id))return false;
  seen.add(id);return true;
 }).map(o=>({c:o,p:o.house.father,key:o.id+':father',e:{c:o,h:o.house,p:o.house.father,role:'father'}}));
}
function cousinFatherLinks(c){
 const others=cousinFatherEntries(c);if(!others.length)return '';
 return `<p class="hint cousin-father-links">父亲的亲兄弟：${others.map(x=>`${officialLink(x.c,'father')}（${esc(fullName(x.c))}之父）`).join('；')}。两房女儿为堂姐妹。</p>`;
}
function clanPalaceCount(key){return S.consorts.filter(c=>c.alive&&!c.gone&&!c.maid&&hasClan(c)&&clanKey(c)===key).length;}
function cousinAdmissionNotice(g){
 if(!cousinFamiliesActive()||g.cousinAdmissionRecorded)return;
 const relatives=S.consorts.filter(c=>c!==g&&/^堂[姐妹]$/.test(c.kin?.[g.id]||g.kin?.[c.id]||''));
 if(!relatives.length)return;
 g.cousinAdmissionRecorded=true;
 const fathers=[...new Map(relatives.filter(c=>c.house?.father.id!==g.house?.father.id).map(c=>[c.house.father.id,c])).values()];
 const kin=fathers.map(c=>`${c.house.father.name}与${g.house.father.name}是亲兄弟，${fullName(c)}与${fullName(g)}是堂姐妹`).join('；');
 const text=`${fullName(g)}留选入宫，${clanName(clanKey(g))}在宫妃嫔由${Math.max(0,clanPalaceCount(clanKey(g))-1)}人增至${clanPalaceCount(clanKey(g))}人。${kin}。`;
 story(g,'【同族入宫】'+text);for(const c of relatives)story(c,'【同族入宫】'+text);
 log(text,1);g.cousinAdmissionText=text;
}
const cousinsMakeKin=makeKin;
makeKin=function(c,type){const g=cousinsMakeKin(c,type);if(cousinFamiliesActive())reconcileCousinFamilies([c,g]);return g;};
const cousinsAddConsort=addConsort;
addConsort=function(c,...args){if(cousinFamiliesActive())reconcileCousinFamilies([c]);const result=cousinsAddConsort(c,...args);cousinAdmissionNotice(c);return result;};
const cousinsMigrate=migrate;
migrate=function(...args){const result=cousinsMigrate.apply(this,args);reconcileCousinFamilies();return result;};
const cousinsOfficialBrothers=officialBrothers;
officialBrothers=function(person){return cousinFamiliesActive()&&person.e?.role==='father'?cousinFatherEntries(person.e.c):cousinsOfficialBrothers(person);};
