/* Shared residences create shared events. A roster visit never stages an encounter. */
const cohabKey=(a,b)=>[a.id,b.id].sort((x,y)=>x-y).join(':');
const cohabAvailable=c=>inPalace(c)&&c.hp>=40&&!homeWorryActive(c)&&!maternalUnsettled(c)&&!['悲恸','心如死灰','怨恨','惶恐','忧心'].includes(xinOf(c));
function cohabScene(name,host,force=false){
 if(!PALACES.includes(name)||S.over)return null;
 const people=palaceResidents(name).filter(cohabAvailable),a=host&&people.includes(host)?host:people[0];if(!a)return null;
 const others=people.filter(c=>c!==a);if(!others.length)return null;
 const b=others[(voiceHash(name)+S.turn)%others.length],key=cohabKey(a,b),old=S.flags.cohabRecent?.[key];
 if(old?.turn===S.turn&&old.palace===name)return {...old,a:byId(old.a),b:byId(old.b)};
 if(S.turn-(old?.turn??-99)<3||!force&&(voiceHash(name+S.turn+a.id)%4===0))return null;
 const rel=relGet(a,b),quiet=isSolitary(a)||isSolitary(b),tense=rel<=-20;
 const kind=tense?'argument':quiet?'boundaries':rel>=30?['food','needle','reading'][voiceHash(key+S.turn)%3]:'courtesy';
 const title={argument:'同宫拌嘴',boundaries:'同住也各留清静',food:'一碟乡味',needle:'窗下针线',reading:'共看一页书',courtesy:'廊下相让'}[kind];
 const text={
  argument:`${fullName(a)}与${fullName(b)}因共用廊下的作息起了争执。${['骄纵','骄矜','善妒'].includes(a.trait)?'前者嫌旁人事事与自己相争，话说得急；':'前者说昨夜歇息被惊动，语气也硬了；'}后者不肯认下一整桩过错，争的是日常相处，不是谁的位分高便能代替道理。`,
  boundaries:`${fullName(a)}与${fullName(b)}商量廊下的安静时辰。喜独处的人不愿日日聚坐，另一人听明白后答应借物先问、来访先通传。各留清静，并不等于互相厌恶。`,
  food:`${fullName(a)}与${fullName(b)}正分一碟温热点心，记得把对方不爱吃的口味另放。说起各自家乡的吃食，两人都笑了。`,
  needle:`${fullName(a)}与${fullName(b)}坐在窗下看花样，针线不熟的一人先替另一人理线。她们边做边说家常，并不拿手艺分高下。`,
  reading:`${fullName(a)}与${fullName(b)}共看一页书，一人读出声，另一人说自己的理解。意见不尽相同，却愿意听完再议。`,
  courtesy:`${fullName(a)}与${fullName(b)}在廊下碰面，先商量好晒衣与摆花的地方。还算不上亲近，却比初同住时多了些体谅。`
 }[kind];
 return {key,a,b,palace:name,turn:S.turn,kind,title,text};
}
function cohabSceneValid(s){return !!s&&cohabAvailable(s.a)&&cohabAvailable(s.b)&&s.a.palace===s.palace&&s.b.palace===s.palace;}
function recordCohab(s){
 if(!cohabSceneValid(s))return null;
 const records=S.flags.cohabRecent||={},old=records[s.key];if(old?.turn===s.turn&&old.palace===s.palace)return old;
 if(old&&S.turn-old.turn<3)return null;
 const saved=records[s.key]={key:s.key,a:s.a.id,b:s.b.id,palace:s.palace,turn:s.turn,kind:s.kind,title:s.title,text:s.text};
 relAdd(s.a,s.b,s.kind==='argument'?-4:s.kind==='boundaries'?0:s.kind==='courtesy'?1:4);
 for(const [c,o] of [[s.a,s.b],[s.b,s.a]]){
  c.lastCohab={turn:S.turn,other:o.id,palace:s.palace,kind:s.kind,title:s.title,text:s.text};
  story(c,`【同宫日常·${s.title}】${s.text}`);cchg(c,{mood:s.kind==='argument'?-2:s.kind==='boundaries'?0:2});
  NPCMemory.record(S,{type:'cohabitation',time:S.turn,location:s.palace,participants:[c.id,o.id],outcome:s.text},[{person:c.id,subject:o.id,interpretation:s.text,emotion:s.kind==='argument'?-.5:s.kind==='boundaries'?.1:.45,impact:55}]);
 }
 return saved;
}
function cohabitationTick(){
 let count=0;for(const name of PALACES){if(count>=2)break;if(voiceHash(name+':month:'+S.turn)%3)continue;
  const s=cohabScene(name);if(s&&s.turn===S.turn&&S.flags.cohabRecent?.[s.key]?.turn!==S.turn&&recordCohab(s))count++;
 }
}
function cohabResponseEvent(s){
 const record=S.flags.cohabRecent?.[s?.key];if(!cohabSceneValid(s)||!record||record.turn!==s.turn||record.responded)return null;
 const valid=()=>cohabSceneValid(s)&&record===S.flags.cohabRecent?.[s.key]&&!record.responded;
 const resolve=kind=>{if(!valid()||!useE())return null;record.responded=true;
  const text=kind==='fair'?`陛下听${fullName(s.a)}与${fullName(s.b)}各自说明，将共用地方的作息与分寸说清，未凭位分断谁先错。旧怨仍在，两人先肯把眼前的事议妥。`:kind==='join'?`陛下与${fullName(s.a)}、${fullName(s.b)}一同坐下，听完两人的家常，记得各人不同的喜好。`:`陛下尊重${fullName(s.a)}与${fullName(s.b)}各自的作息，不强求同住就时时相伴。`;
  relAdd(s.a,s.b,kind==='fair'?3:kind==='join'?2:0);for(const c of [s.a,s.b]){story(c,`【同宫相处】${text}`);cchg(c,{aff:2,mood:2});}return text;
 };
 return {title:s.title,cast:[s.a,s.b],present:[s.a,s.b],valid,text:s.text,choices:[{t:s.kind==='argument'?'听双方说清，安排共用之处 · 精力−1':s.kind==='boundaries'?'尊重各自的作息 · 精力−1':'一起坐坐，听她们说家常 · 精力−1',cond:()=>E().energy>0,f:()=>resolve(s.kind==='argument'?'fair':s.kind==='boundaries'?'space':'join')},{t:'让她们自己相处'}]};
}
function cohabVoice(c){const m=c.lastCohab,o=m&&byId(m.other);if(!m||!o||S.turn-m.turn>3||!inPalace(c))return null;
 return voiceLine('cohab-'+m.kind,`她说起与${fullName(o)}同住时的一件事。`,m.kind==='argument'?`与${fullName(o)}的拌嘴，臣妾还记着。住得近，作息上的小事便容易积在心里。`:m.kind==='boundaries'?`同住时各留清静，并不是与${fullName(o)}不睦。先说好分寸，反倒自在。`:`前些日子与${fullName(o)}「${m.title}」，倒觉得同住有同住的好。小事里也能多懂对方一些。`);
}
