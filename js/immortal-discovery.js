const immortalDiscoveryNewsActive=()=>PalaceActions.immortalDiscoveryNews;

function reconcileImmortalDiscovery(){
 if(!immortalDiscoveryNewsActive()||!S||S.immortalDiscovery)return;
 // Retained relatives include deceased children. A discovery counts even after
 // death, refusing training, or leaving the current ruler's household.
 const first=immortalPeople().filter(k=>k.immortal.root)
  .sort((a,b)=>(a.immortal.since??Infinity)-(b.immortal.since??Infinity))[0];
 if(first){
  S.immortalDiscovery={id:first.id,gen:first.reign??S.gen,turn:first.immortal.since??null};
  return;
 }
 // An old save may already have crowned the child, removing their royal record.
 const past=[...S.log,...S.consorts.flatMap(c=>c.story||[]),...(S.previousCourts||[])
  .flatMap(court=>(court.consorts||[]).flatMap(c=>c.story||[]))];
 const record=past.find(e=>e.t?.includes('【灵根初显】')&&e.t.includes('国师辨为'));
 if(record)S.immortalDiscovery={id:null,gen:record.gen??null,turn:record.turn??null};
}

function immortalDiscoveryFamily(k){
 const mother=familyHostById(k.mom),origin=k.outsideFamilyOrigin;
 if(k.secretPalaceOrigin)return [];
 const host=mother||(origin&&familyHostById(origin.host));
 if(!host)return [];
 const house=whiteSpringRoyal(host)?whiteSpringFamily(host):houseOf(host);
 if(!house)return [];
 const birthMother=mother||house.relatives?.find(p=>p.id===k.mom);
 if(!birthMother)return [];
 const born=birthMother.born??house.natal?.memberBorn?.[birthMother.id]??S.turn-birthMother.age*12;
 const people=[[house.father,'grandfather'],...brotherRoles(house).map(role=>[officialPerson(house,role),'uncle'])];
 const auntRole=(p,age)=>p.born!=null?p.born<born?'older-aunt':'younger-aunt':age>birthMother.age?'older-aunt':'younger-aunt';
 for(const p of house.relatives||[]){
  if(p.parentRelativeId!=null||p.motherRelativeId!=null||p.id===birthMother.id||p.consortId===birthMother.id)continue;
  const canonical=p.consortId?byId(p.consortId)||familyHostById(p.consortId):p;
  const age=natalAgeOf(p);
  people.push([canonical,p.sex==='m'?'uncle':auntRole(p,age),age]);
 }
 for(const c of paternalFamily(host)){
  if(c!==birthMother&&c.id!==k.mom&&familyCourtHosts().includes(c)){
   people.push([c,auntRole(c,c.age),c.age]);
  }
 }
 const seen=new Set();
 return people.filter(([p])=>{
  if(!officialAlive(p)||p.id==null||seen.has(p.id))return false;
  seen.add(p.id);
  return true;
 }).map(([person,role,age])=>({person,role,age:age??person.age??natalAgeOf(person),mother:birthMother,host}));
}

const IMMORTAL_DISCOVERY_ROLES={'grandfather':'外祖父','uncle':'舅舅','older-aunt':'大姨','younger-aunt':'小姨'};

function immortalRelativeAtCourt(p){
 if(S.consorts.includes(p))return inPalace(p);
 const host=p.visit&&byId(p.visit.host);
 return !!host&&natalInPalace(host,p);
}

function immortalDiscoveryFamilyVoice(entry,k){
 const {person:p,role,age,mother,host}=entry,trait=p.temperament||p.trait;
 const sister=mother.alive===false?'故去的姐妹':role==='older-aunt'?'妹妹':role==='younger-aunt'?'姐姐':'姐妹';
 if(role==='grandfather')return (host.fam?.p??0)<20?'他从未亲见此事，先问孩子夜里睡得可好，怕一门心思想那声玉磬，反倒忘了身边人的牵挂。':'他把问道册上的话读了一遍，叮嘱家中先听孩子怎么想，谈师承也别急于作主。';
 if(role==='uncle'){
  if(age<12)return '他把“玉磬”两字写在纸上，追着问那东西是什么模样，回头还说自己也要敲给家里人听。';
  if(p.away||p.militaryCampaign)return '消息辗转随驿袋送到。他照旧先记来信的日子，打听起山门通往哪条驿道。将来孩子若真远行，至少得有地方寄信报平安。';
  if(['谨慎','持正','持重','沉静'].includes(trait))return '他把亲眼所见与旁人添的话分开记，提笔问仙师平日怎样授课，想替孩子先打听清楚。';
  if(p.career==='student'||age<18)return '他正读到山川一卷，听见消息就把那页折了个角，盼见面时问孩子玉磬响过以后，殿里究竟是什么声音。';
  return `他替孩子欢喜，也想起${sister}从前照料孩子的辛苦，只说等家里再有信，先问孩子愿意学什么。`;
 }
 if(age<12)return '她听完就去找纸笔，把一只歪歪的玉磬画了下来，叠起来托家人转送。';
 if(immortalRelativeAtCourt(p))return ['沉静','持重','淡泊'].includes(trait)?
  `她见廊下已经有人打听，便只寻机会私下向孩子问一句：“那日你自己觉着如何？”`:
  `她听说${k.name}试磬时出了光，直想拉孩子来细问。走到门口却先问了一句：“这几日来问的人多，你可觉得烦？”`;
 if(p.married)return `她在自家收到抄来的消息，原想提笔向${sister}道一声喜，写到末尾，却添了一句：“往后孩子真要远行，你有话也可同我说。”`;
 return ['好学','才女','聪慧','沉静'].includes(trait)?
  '她从旧书里找出一页记玉磬的图，抄在纸上，又另留半页空白，想听孩子自己补记那日的事。':
  '她在家里听得新鲜，连问三遍动的是磬还是灯，随即又惦记孩子可曾受惊，怕家人一封信只顾着问奇事。';
}

function immortalDiscoveryNote(person,k,title,text,people,source){
 person.story||=[];
 story(person,`【${title}】${text}`);
 Object.assign(person.story.at(-1),{thread:`immortal-discovery:${k.id}`,
  life:{kind:'family',title,turn:S.turn,gen:S.gen,people,source}});
}

function shareImmortalDiscovery(k){
 const r=k.immortal;
 if(r.familyHeard&&r.discoveryNews?.family)return;
 (r.discoveryNews||={}).family=true;
 const entries=immortalDiscoveryFamily(k),heard=S.turn-r.since<=3?'得知':'重读宫中问道旧记，才细问起';
 for(const entry of entries){
  const {person:p,role,mother}=entry,roleName=IMMORTAL_DISCOVERY_ROLES[role];
  const kin=role==='grandfather'?(k.sex==='m'?'外孙':'外孙女'):(k.sex==='m'?'外甥':'外甥女');
  // Existing saves already sent certain domestic grandfather and brother notes.
  if(p.story?.some(e=>e.t?.startsWith('【宫中灵根】')&&
    (e.thread===`immortal-discovery:${k.id}`||r.familyHeard&&e.t.includes(kin+k.name)&&e.t.includes(r.root))))continue;
  const people=[{id:p.id,name:p.name||fullName(p)},{id:mother.id,name:mother.name||fullName(mother)},{id:k.id,name:k.name}];
  immortalDiscoveryNote(p,k,'宫中灵根',`身为${roleName}，${heard}${kin}${k.name}被国师辨出${r.root}。${immortalDiscoveryFamilyVoice(entry,k)}`,
   people,immortalRelativeAtCourt(p)?'宫中家人相告':'问道消息传至外家');
 }
 r.familyHeard=true;
}

function immortalDiscoveryCourtVoice(p,k){
 if(p.sex){
  const young=kidAge(p)<12;
  if(young)return '“我想知道玉磬是怎么响的。等人少些，我能不能自己去问？”';
  if(['仁厚','审慎','内敛'].includes(childDisposition(p)))return `“从书房出来，人人都问起那日的光。可我想知道，${k.name}忽然被这么多人盯着，心里舒不舒服。”`;
  return '“有人叫我也去试玉磬。平日各人各有所长，怎么这两日偏要拿这一件事比个高下？”';
 }
 const ownChild=kidsAlive().some(o=>o!==k&&(o.mom===p.id||o.foster===p.id)&&Math.abs(kidAge(o)-kidAge(k))<=4);
 if(ownChild&&['善妒','骄矜','城府','骄纵'].includes(p.trait))return '“才隔了一日，便有人拿自己宫里的孩子去比。孩子还要一道读书，传成谁高谁低，往后见面都不自在。”';
 if(p.daoPractice?.visits>=3||solitaryDao(p))return '“钦安殿那口磬，我也听过多回。若得空，我想问国师当时如何核明，传到我耳边的说法已有三样了。”';
 if(['温婉','持重','沉静','淡泊'].includes(p.trait))return '“新鲜归新鲜，还是先听孩子自己怎么说。旁人盼着往山上去，孩子或许还惦记书房里没读完的那卷书。”';
 if(['好客','活泼','爽直'].includes(p.trait))return '“我原听说殿上的灯全亮了。方才去问，才知道只是一线清光。再传过两道门，不知又要添出什么来。”';
 return '“国师册上既有明记，孩子自可以按自己的心意学一学。连拜不拜师都还未议定，谁也休拿灵根说什么天命。”';
}

function immortalDiscoveryCourtEvent(){
 if(!immortalDiscoveryNewsActive()||S.over||mourningActive())return null;
 const k=kidById(S.immortalDiscovery?.id),r=k?.immortal;
 if(!r||!k.alive||r.discoveryNews?.court||S.turn<=r.since)return null;
 const family=new Set(immortalDiscoveryFamily(k).map(e=>e.person.id));
 const consorts=harem().filter(c=>c.id!==k.mom&&c.id!==k.foster&&!family.has(c.id)&&(c.hp??100)>=40)
  .sort((a,b)=>relGet(b,k)-relGet(a,k)||b.rank-a.rank||a.id-b.id);
 const peer=kidsAlive().filter(o=>o!==k&&childInPalace(o)&&!o.pendingName&&!o.married&&kidAge(o)>=8)
  .sort((a,b)=>Math.abs(kidAge(a)-kidAge(k))-Math.abs(kidAge(b)-kidAge(k))||a.id-b.id)[0];
 const speakers=[...consorts.slice(0,2),...(peer?[peer]:[])];
 if(speakers.length<2)return null;
 const recent=S.turn-r.since<=3,title=recent?'六宫闲话 · 灵根初显':'六宫闲话 · 问道旧记';
 const name=p=>p.sex?p.name:fullName(p);
 const voices=speakers.map(p=>immortalDiscoveryCourtVoice(p,k));
 if(voices[0]===voices[1])voices[1]='“我倒盼国师哪天把经过说清楚。宫人越好奇，孩子跟前的闲话就越难消停。”';
 const dialogue=speakers.map((p,i)=>`${name(p)}道：${voices[i]}`);
 const text=(recent?`钦安殿的消息传开，国师记下${k.name}显出${r.root}。`:
  `宫人翻阅问道旧册，谈起其中记着${k.name}的${r.root}那一页。`)+
  '你经过上书房外的廊下，听见几个人就这事说起各自所闻。';
 const valid=()=>!S.over&&!mourningActive()&&k.alive&&kidById(k.id)===k&&k.immortal===r&&!r.discoveryNews?.court;
 return {title,cast:speakers,present:speakers,valid,text:text+'\n'+dialogue.join('\n'),choices:[{t:'听几人把话说完',f:()=>{
  if(!valid())return null;
  (r.discoveryNews||={}).court=true;
  const people=[{id:k.id,name:k.name},...speakers.map(p=>({id:p.id,name:name(p)}))];
  speakers.forEach((p,i)=>immortalDiscoveryNote(p,k,'宫中议灵根',
   `廊下谈及${k.name}被国师辨出${r.root}，${voices[i]}`,people,'宫中闲谈'));
  const line=`${name(speakers[0])}等人谈及${k.name}显出${r.root}，各有所问。问道册只记试磬所见，其余尚待孩子自己拿主意。`;
  log('【宫中议灵根】'+line);
  return line;
 }}]};
}
