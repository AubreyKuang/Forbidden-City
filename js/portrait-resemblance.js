/* Shared rendered portraits inspire gossip, never a replacement identity. */
function resemblanceCell(c){
 if(!c||c.sex||c.maid||c.official!==undefined||c.isMom||c.age<16||(!Number.isInteger(c.artPortrait)&&!Number.isInteger(c.portraitOverride)&&!Number.isFinite(c.seed)))return null;
 return portraitCell(c);
}
function resemblancePeople(){
 const people=S.consorts.map(c=>({c,gen:S.gen,key:`${S.gen}:${c.id}`}));
 for(const court of S.previousCourts||[])for(const c of court.consorts||[])if(c.alive===false&&!c.maid)people.push({c,gen:court.gen,key:`${court.gen}:${c.id}`});
 return people;
}
function resemblanceRank(a,b){return (b.c.rank||0)-(a.c.rank||0)||(a.c.enteredAt??Infinity)-(b.c.enteredAt??Infinity)||(b.c.favor||0)-(a.c.favor||0)||a.c.id-b.c.id;}
function resemblancePair(c){
 const cell=resemblanceCell(c);if(cell===null)return null;
 const self={c,gen:S.gen,key:`${S.gen}:${c.id}`};
 const matches=resemblancePeople().filter(o=>o.key!==self.key&&!o.c.gone&&resemblanceCell(o.c)===cell).sort(resemblanceRank);
 if(!matches.length)return null;
 const other=matches[0],dead=other.c.alive===false;
 const [anchor,target]=dead||resemblanceRank(other,self)<=0?[other,self]:[self,other];
 const kin=anchor.gen===target.gen&&!!(anchor.c.kin?.[target.c.id]||target.c.kin?.[anchor.c.id]);
 return {anchor,target,cell,kin,key:[anchor.key,target.key].sort().join('|')};
}
function resemblanceSource(p){const a=p.anchor;return `${a.gen<S.gen?'先朝已故的':a.c.alive===false?'已故的':''}${fullName(a.c)}${RANKS[a.c.rank]?`（${RANKS[a.c.rank]}）`:''}`;}
function portraitResemblanceHint(c){
 const p=resemblancePair(c);
 if(p)return `引见的宫人忽然一怔，回头与身旁人交换眼色：“${p.kin?'原来是自家姐妹，眉眼果然相近。':`这眉眼，竟与${resemblanceSource(p)}有几分相似。`}”她报上自己的姓名，声音与举止又分明不同。`;
 const cell=resemblanceCell(c),peer=cell!==null&&(S.cands||[]).find(o=>o!==c&&resemblanceCell(o)===cell);
 return peer?`宫人将她与同批秀女${fullName(peer)}的名帖对看，惊讶两人眉眼相似，赶忙仔细核对姓名，免得认错。`:'';
}
function portraitAdmission(c){
 const p=resemblancePair(c);if(!p||c.resemblanceAdmission===p.key)return;
 c.resemblanceAdmission=p.key;
 story(c,`【眉眼相似】入宫时，宫人惊讶她与${fullName(p.anchor.c===c?p.target.c:p.anchor.c)}眉眼相似，随后又因声音与举止不同，重新记住她自己的姓名。${p.kin?'这是自家姐妹间的肖似。':'相似的容貌尚不能说明两人的性情与来处。'}`);
}
function resemblanceReply(c){
 if(isSolitary(c))return '臣妾不拦旁人看出相似。只是她有她的诗，臣妾有臣妾的字，不愿照着谁过一生。';
 if(['骄纵','骄矜'].includes(c.trait))return '臣妾就是臣妾。眉眼生得像，难道连喜怒也要依着旁人么？';
 if(c.trait==='城府')return '有人说像她是臣妾的福气，臣妾也知道这话或许能讨巧。可若连一句真话都不能说，那点福气又值什么？';
 if(['活泼','好客'].includes(c.trait))return '起初听说像个美人，臣妾还偷偷高兴。后来连笑起来都被比较，倒想问：陛下记得臣妾自己的笑么？';
 if(c.trait==='痴情')return '陛下望着臣妾时，心里想起的是谁？臣妾盼您留下，也怕您只是借这张脸想念另一个人。';
 if(['将门','爽直'].includes(c.trait))return '像便像罢，臣妾不会因此学她说话行事。今日坐在这里的，是有自己主意的人。';
 return '听见宫人叫错名字，臣妾也会难过。陛下可否先听完臣妾想说的话，再唤一声臣妾的名字？';
}
function resemblanceEvent(person){
 const p=resemblancePair(person);if(!p||S.flags.resemblancePairs?.[p.key]||p.target.gen!==S.gen||!cohabAvailable(p.target.c))return null;
 const c=p.target.c,a=p.anchor.c,source=resemblanceSource(p);let done=false;
 const valid=()=>!done&&!S.flags.resemblancePairs?.[p.key]&&cohabAvailable(c)&&resemblanceCell(c)===p.cell&&resemblanceCell(a)===p.cell&&resemblancePair(c)?.key===p.key;
 const description=p.kin?`宫人将${fullName(c)}与${source}的眉眼相提并论，说起姐妹间的肖似。她却请人认清名帖，不要把两人的心意也混作一样。`:
  `${a.alive===false?'旧宫人望着帘边的人影，竟将故人的名字唤到一半，又匆匆收住。':'廊下宫人低声道：“'+fullName(c)+'的眉眼，倒有几分像'+source+'。”'}\n议论传开，有人私下猜她是否成了${source}的“替身”。${a.alive===false?'故人的旧事仍在，可眼前人的经历与心意，谁也不能据一张脸替她断定。':`宫里拿位分较高、资历较深的人作比，却并不知陛下究竟如何想。`}\n${fullName(c)}听见脚步，停下手里的事：“${resemblanceReply(c)}”`;
 const finish=kind=>{if(!valid())return null;done=true;
  const text=kind==='name'?`陛下郑重唤她${fullName(c)}，让宫人不再混叫名字，也不拿旁人的旧事要求她。她记得这一次，自己的话被认真听完。`:kind==='listen'?`陛下承认看见相似，也请${fullName(c)}说起自己的喜好与经历。她慢慢说下去，仍等着日后相处证明今日的话。`:`陛下让${fullName(c)}学${source}的举止。她依礼应声，却把原本要说的话咽了回去，觉得自己的名字被放到了那张相似的脸之后。`;
  (S.flags.resemblancePairs||={})[p.key]={turn:S.turn,kind,target:c.id,anchor:p.anchor.key,cell:p.cell};
  c.resemblance={turn:S.turn,kind,source,cell:p.cell,quote:resemblanceReply(c)};
  story(c,`【肖似之议】${description.replaceAll('\n','')}${text}`);cchg(c,{aff:kind==='imitate'?-7:kind==='name'?5:3,mood:kind==='imitate'?-8:5});
  if(kind==='imitate')setXin(c,'委屈','被要求模仿眉眼相似的另一人');
  if(p.anchor.gen===S.gen&&inPalace(a))story(a,`【肖似之议】宫人后来将此事传来：${fullName(c)}因与自己眉眼相似被比较，${text}她才知旁人连两人的举止都放在一起议论。`);
  NPCMemory.record(S,{type:'portrait-resemblance',time:S.turn,location:c.palace,participants:[c.id],outcome:text},[{person:c.id,subject:p.anchor.key,interpretation:description+text,emotion:kind==='imitate'?-.7:.55,impact:75}]);save('auto');return text;
 };
 return {title:p.kin?'同样眉眼，各自心意':'肖似之议',cast:[c,a],present:[c],personalStory:true,valid,text:description,choices:[{t:'唤她自己的名字，制止混称',f:()=>finish('name')},{t:'承认相似，听她说自己的事',f:()=>finish('listen')},{t:'让她学那个人的举止',f:()=>finish('imitate')}]};
}
function resemblanceVoice(c){const r=c.resemblance;if(!r||S.turn-r.turn>6)return null;return voiceLine('resemblance','她记得上回宫人比较眉眼的议论。',r.kind==='imitate'?'陛下上回要臣妾学她，可有时，臣妾也想按自己的心意说一句话。':r.kind==='name'?'上回陛下唤的是臣妾自己的名字。那一声，臣妾听得分明。':r.quote);}
A.resemblanceTalk=function(id){if(!modalOpen)pushEv(resemblanceEvent(byId(id)));};
HAREM.push(function resemblanceEncounter(){if(S.turn-(S.flags.lastResemblance??-99)<12||!chance(.2))return null;const c=harem().find(c=>resemblanceEvent(c));if(!c)return null;const ev=resemblanceEvent(c);ev.onQueue=()=>{S.flags.lastResemblance=S.turn;};return ev;});
