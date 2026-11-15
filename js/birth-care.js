/* One durable care plan per delivery, rather than an automatic modal for every twin. */
function birthCareKids(c){return deliveryKids(c).filter(k=>k.alive&&!k.pendingName&&!k.removedFromRoyal&&!k.jailed&&!k.templeStay&&kidAge(k)<1);}
function birthCareOpen(c){return !!c?.delivery?.carePlan&&!c.delivery.carePlan.closed&&birthCareKids(c).length>0;}
function birthCarePanel(c){return birthCareOpen(c)?`<section class="detail-section"><h3>同生手足的安置</h3><p>${birthCareKids(c).map(k=>esc(k.name)).join('、')}的照料可一并商议，也可分别安排。</p><button class="btn" onclick="A.birthCare(${c.id})">查看这一胎的照料安排</button></section>`:'';}
function birthCarePosthumous(c,ks,title,text){if(c.alive)return;story(c,'【身后家事】'+text);Object.assign(c.story.at(-1),{thread:`birth-care:${S.gen}:${c.id}:${c.delivery.turn}`,life:{kind:'family',title,turn:S.turn,gen:S.gen,people:ks.map(k=>({id:k.id,name:k.name}))}});}
function birthCareRecord(c,ks,title,text){const carers=[...new Set(ks.map(fosterOf).filter(Boolean))];livedRecord([c,...carers,...ks],'family',title,`birth-care:${S.gen}:${c.id}:${c.delivery.turn}`,text,[]);birthCarePosthumous(c,ks,title,text);}
function birthCareEvent(c){
 if(!birthCareOpen(c))return null;const plan=c.delivery.carePlan,ks=birthCareKids(c),valid=()=>birthCareOpen(c)&&c.delivery.carePlan===plan;
 const arrangements=ks.map(k=>`${kidName(k)}：${fosterOf(k)?fullName(fosterOf(k))+'抚养':byId(k.mom)?.alive?'仍由生母照料':'暂由宫中乳母照料'}`).join('\n');
 return {title:'同生手足的安置',por:ks[0],cast:ks,valid,text:`孩子们已经分别赐名，不必逐个重复问一遍。\n${arrangements}\n${c.alive?'另择养母会使生母不舍；同生手足也可尽量一处养育。':'生母已经不在，当前的乳母照料不会因暂未选养母而中断。'}\n可以一次选同一位养母，也可以只调整某个孩子。`,choices:[
  {t:'照现有安排，一并定下',f:()=>{if(!valid())return null;plan.closed=true;plan.settled=S.turn;const t=`${ks.map(k=>k.name).join('、')}的照料商议完毕：${arrangements.replaceAll('\n','；')}。没有另行更换抚养人。`;birthCareRecord(c,ks,'同生手足的安置',t);return t;}},
  {t:'一同交给同一位养母',f:()=>{if(!valid())return null;pushNow(birthCareChoose(c,ks));return null;}},
  ...ks.map(k=>({t:`单独商议${k.name}的照料`,f:()=>{if(!valid())return null;pushNow(birthCareChoose(c,[k]));return null;}})),
  {t:'先照料着，稍后从生母档案继续',f:()=>{if(!valid())return null;if(plan.deferred!==S.turn){plan.deferred=S.turn;birthCareRecord(c,ks,'安置尚待商议',`${ks.map(k=>k.name).join('、')}暂依现有安排照料，养母人选尚未定下，待从生母档案继续商议。`);}return '照料不会中断，未作的决定仍留待商议。';}}
 ]};
}
function birthCareChoose(c,ks){
 const plan=c.delivery.carePlan,expected=ks.map(k=>[k.id,k.foster||null]);
 const valid=()=>birthCareOpen(c)&&c.delivery.carePlan===plan&&ks.every((k,i)=>birthCareKids(c).includes(k)&&(k.foster||null)===expected[i][1]);
 const cands=harem().filter(m=>m.rank>=2&&m.hp>=40&&m!==c&&ks.some(k=>k.foster!==m.id)).sort((a,b)=>b.rank-a.rank||b.virtue-a.virtue);
 return {title:'商定照料的人',por:ks[0],cast:ks,valid,text:`本次商议：${ks.map(k=>k.name).join('、')}。请听清安排再定，其他同生手足的照料不会同时更改。`,choices:[
  ...cands.map(m=>({t:`请${fullName(m)}照料`,person:m,f:()=>{if(!valid()||!inPalace(m)||m.rank<2||m.hp<40)return null;
   const previous=[...new Set(ks.map(fosterOf).filter(Boolean))];for(const k of ks)if(k.foster!==m.id)doFoster(k,m);
   plan.changed||=[];for(const k of ks)if(!plan.changed.includes(k.id))plan.changed.push(k.id);
   const all=birthCareKids(c),same=new Set(all.map(k=>k.foster||k.mom)).size===1;
   const t=`${ks.map(k=>k.name).join('、')}改由${fullName(m)}抚养。${same?'同生手足仍在一处照料。':'同生手足分处照料，各自的生母与手足身份不变；今后相见仍依实际探视规矩安排。'}${ks.length<all.length?'其余孩子仍依原安排照料，整胎安排尚可继续商议。':''}`;
   livedRecord([c,...previous,m,...all],'family','同生手足的安置',`birth-care:${S.gen}:${c.id}:${c.delivery.turn}`,t);
   birthCarePosthumous(c,all,'同生手足的安置',t);
   if(ks.length===all.length){plan.closed=true;plan.settled=S.turn;}return t;
  }})),
  {t:'仍依原安排，回头再议',f:()=>{if(!valid())return null;birthCareRecord(c,ks,'安置尚待商议',`商议${ks.map(k=>k.name).join('、')}的养母人选后，陛下暂未更改照料安排。`);return '没有改变抚养人。';}}
 ]};
}
A.birthCare=function(id){if(modalOpen)return;const c=byId(id),ev=c&&birthCareEvent(c);if(ev)pushEv(ev);};
