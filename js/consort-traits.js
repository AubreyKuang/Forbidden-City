/* Descriptive distinctions follow real attributes. Nothing rolls during rendering. */
const consortTraitsActive=()=>!!S&&journalContentVersion()>=58;
const CONSORT_DISTINCTIONS=[
 {id:'grace',name:'沉鱼落雁',groups:['looks'],priority:60,why:'容貌超过90，眉目容色出众。',test:c=>c.looks>90},
 {id:'poet',name:'咏絮之才',groups:['talent'],priority:60,why:'才情达到95，才思尤为出众。',talent:95,art:'letters',test:c=>c.talent>=95},
 {id:'both',name:'才貌双绝',groups:['looks','talent'],priority:100,why:'容貌至少85、才情至少90，兼具才貌。',talent:90,art:'any',test:c=>c.looks>=85&&c.talent>=90},
 {id:'kind',name:'蕙质兰心',groups:['virtue'],priority:60,why:'德行达到90，心地温厚。',known:true,test:c=>c.virtue>=90},
 {id:'hidden',name:'深藏不露',groups:['scheme'],priority:60,why:'心机达到90，善于藏住自己的打算；不据此断定善恶。',known:true,test:c=>c.scheme>=90},
 {id:'innocent',name:'赤子之心',groups:['virtue','scheme'],priority:90,why:'心机不高于10、德行至少75，待人少有机心。',known:true,test:c=>c.scheme<=10&&c.virtue>=75},
 {id:'reader',name:'书卷清芬',groups:['art'],priority:60,why:'平日爱好读书，才情至少90。',talent:90,art:'letters',test:c=>consortHobby(c)==='读书'&&c.talent>=90},
 {id:'music',name:'琴心雅韵',groups:['art'],priority:60,why:'平日爱好抚琴，才情至少90。',talent:90,art:'music',test:c=>consortHobby(c)==='抚琴'&&c.talent>=90},
 {id:'needle',name:'绣心巧手',groups:['art'],priority:75,why:'性情巧手、爱好刺绣，才情至少85。',talent:85,art:'needle',test:c=>c.trait==='巧手'&&consortHobby(c)==='刺绣'&&c.talent>=85},
 {id:'paint',name:'丹青妙笔',groups:['art'],priority:65,why:'喜爱字画，才情至少90。',likes:true,talent:90,art:'paint',test:c=>c.like==='字画'&&c.talent>=90},
 {id:'archer',name:'弓马娴熟',groups:['bearing'],priority:70,why:'性情出自将门，并且擅骑射或喜爱弓马。',test:c=>c.trait==='将门'&&(c.t2==='擅骑射'||c.like==='弓马'),visible:c=>c.t2==='擅骑射'&&(c.known||S.consorts.includes(c))||c.kl&&c.like==='弓马'},
 {id:'humble',name:'寒门明珠',groups:['origin'],priority:75,why:'明确出身寒门，才情至少90；不以家族势力低就判为寒门。',talent:90,art:'any',test:c=>(c.upbringing?.title||c.fam?.t)==='寒门'&&c.talent>=90},
 {id:'quiet',name:'人淡如菊',groups:['temperament'],priority:80,why:'性情淡泊、心机不高于10、德行至少80。',known:true,test:c=>c.trait==='淡泊'&&c.scheme<=10&&c.virtue>=80},
 {id:'clever',name:'玲珑心窍',groups:['talent','scheme'],priority:85,why:'才情至少90、心机至少70，善于琢磨人情事理。',known:true,talent:90,art:'any',test:c=>c.talent>=90&&c.scheme>=70},
 {id:'pretty',name:'清丽可人',groups:['looks'],priority:20,why:'容貌达到87，清丽动人。',test:c=>c.looks>=87},
 {id:'quick',name:'才思敏捷',groups:['talent'],priority:20,why:'才情达到85，思路敏捷。',talent:85,art:'any',test:c=>c.talent>=85},
 {id:'gentle',name:'温良恭俭',groups:['virtue'],priority:20,why:'德行达到84，处事有分寸。',known:true,test:c=>c.virtue>=84},
 {id:'careful',name:'心思缜密',groups:['scheme'],priority:20,why:'心机达到75，思虑细密；不据此断定善恶。',known:true,test:c=>c.scheme>=75},
 {id:'frail',name:'弱柳扶风',groups:['health'],priority:110,why:'当前健康低于50，宜注意静养调护；健康恢复后不再显示。',test:c=>c.alive&&Number.isFinite(c.hp)&&c.hp<50}
];
function ensureConsortDistinctions(c){
 if(!consortTraitsActive()||!c||c.sex||PalaceActions.blocked)return;
 c.distinctions||={initialTalent:Number.isFinite(c.talent)?c.talent:0,proof:{},noted:{}};
}
function consortTraitPractice(c,rule){
 if(!rule.talent||(c.distinctions?.initialTalent??c.talent)>=rule.talent)return true;
 const proof=c.distinctions?.proof||{};
 return rule.art==='any'?Object.keys(proof).length>0:!!proof[rule.art];
}
function consortTraitMatches(c,{reveal=false}={}){
 if(!consortTraitsActive()||!c||c.sex)return [];
 return CONSORT_DISTINCTIONS.filter(r=>r.test(c)&&consortTraitPractice(c,r)&&(reveal||(!r.known||c.known)&&(!r.likes||c.kl)&&(!r.visible||r.visible(c))))
   .sort((a,b)=>b.priority-a.priority);
}
function consortTraitLabels(c,options){
 const groups=new Set();return consortTraitMatches(c,options).filter(r=>{
  if(r.groups.some(g=>groups.has(g)))return false;r.groups.forEach(g=>groups.add(g));return true;
 });
}
function consortTraitTags(c){return consortTraitLabels(c).slice(0,2).map(r=>`<span class="tag y consort-trait-tag" title="${esc(r.why)}">${r.name}</span>`).join('');}
function consortTraitPanel(c){
 const labels=consortTraitLabels(c);if(!labels.length)return '';
 return `<section class="detail-section"><h3>人物特质</h3>${labels.map(r=>`<p><span class="tag y consort-trait-tag">${r.name}</span> <span class="hint">${esc(r.why)}</span></p>`).join('')}</section>`;
}
function recordConsortPractice(c,episode,outcome){
 if(!consortTraitsActive()||outcome!=='有所成')return;
 const art=episode.group==='ink'?'letters':({life09:'needle',life10:'needle',life11:'music',life14:'paint',life15:'letters',life16:'needle',life20:'letters',life21:'letters',life22:'paint'})[episode.id]|| (episode.group==='growth'?'study':null);
 if(!art)return;ensureConsortDistinctions(c);if(!c.distinctions||c.distinctions.proof[art])return;
 c.distinctions.proof[art]={turn:S.turn,date:dateStr(),title:episode.title};
}
function reconcileConsortDistinctions(){
 if(!consortTraitsActive()||PalaceActions.blocked)return;
 // A retained selection entry can also be the admitted person. JSON separates
 // these references; restore the canonical person before recording milestones.
 for(const list of [S.cands,S.shelteredGuests])if(list)for(let i=0;i<list.length;i++){
  const admitted=S.consorts.find(c=>c.id===list[i].id);if(admitted)list[i]=admitted;
 }
 for(const c of [...S.consorts,...(S.cands||[]),...(S.shelteredGuests||[])]){
  ensureConsortHealth(c);ensureConsortDistinctions(c);
  if(!c.alive||c.maid||!S.consorts.includes(c))continue;
  const noted=c.distinctions.noted;
  for(const r of consortTraitLabels(c))if(!noted[r.id]){
   noted[r.id]={date:dateStr(),turn:S.turn};
   story(c,`【人物特质·${r.name}】${r.why}`);
  }
 }
}
