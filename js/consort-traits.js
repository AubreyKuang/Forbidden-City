/* Descriptive distinctions follow real attributes. Nothing rolls during rendering. */
const consortTraitsActive=()=>!!S&&journalContentVersion()>=59;
const consortDistinctionStoriesActive=()=>journalContentVersion()>=67;
// Use the person's original seed so a relative keeps the same disposition at selection.
function restlessDisposition(p){
 return journalContentVersion()>=84&&p&&Number.isFinite(p.seed)&&voiceHash(p.seed+':restless')%100<8;
}
const CONSORT_DISTINCTIONS=[
 {id:'restless',name:'不安于室',groups:['romance'],priority:120,why:'容易对相投之人动心，私下相会时更可能回应。',test:restlessDisposition},
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
const CONSORT_DISTINCTION_NOTES={
 restless:'她并不避讳谈情。若遇见投契的人，她也愿意先递出一封信。',
 grace:'容色出众，殿上诸人一眼便能认出她来。',
 poet:'她落笔便有诗意，寻常时景到了她笔下也有了新意。',
 both:'她的容貌先教人记住，听她论诗说事，才知道她的才情也一样出众。',
 kind:'她替人着想，连容易被忽略的难处也肯细听。',
 hidden:'她的心事藏得极深，外人听完一席话，仍难猜到她真正留意的是哪一句。',
 innocent:'她待人坦诚，有为难处往往直接说出，少叫人费心猜测。',
 reader:'她平日爱翻书，看过的章句记得细，也有自己的讲法。',
 music:'她惯常抚琴，熟曲到了她指下，缓急轻重自有章法。',
 needle:'她一向爱做针线，细小的花叶也绣得出转折。',
 paint:'她看字画有自己的眼光，落笔时也懂得在哪一处留白。',
 archer:'她说起骑射有实在的见识，坐鞍与张弓的细处都讲得明白。',
 humble:'她从寒门来，读书很下过功夫，说到熟处自有见地。',
 quiet:'她少争热闹，待人仍有温意，寻常日子过得安静自持。',
 clever:'她听得懂话里的转折，也能想明白席上各人有何难处。',
 pretty:'她的眉眼清秀，微微一笑，便叫人记住了模样。',
 quick:'她接话时思路很快，别人还在斟酌，她已经想出另一种说法。',
 gentle:'她待人温和，遇上分派用度、推让礼数一类的事，言语间自有分寸。',
 careful:'她听完一桩事，还会留意其中哪一步说得含糊，心里记得分明。',
 frail:'她近日身子虚弱，宜把长久坐立的事分作几回，得闲便歇。'
};
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
   story(c,`【人物特质·${r.name}】${consortDistinctionStoriesActive()?CONSORT_DISTINCTION_NOTES[r.id]:r.why}`);
  }
 }
}
