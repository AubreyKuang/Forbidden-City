/* One saved birth draw owns the whole label set. Growth stories never reroll it. */
const BIRTH_LABEL_JOURNAL=39;
const birthLabelsActive=()=>journalContentVersion()>=BIRTH_LABEL_JOURNAL;
const BIRTH_LABEL_STATS={lit:'才学',mar:'武艺',vir:'品德',hp:'体魄',amb:'野心'};
const BIRTH_LABEL_RULES={ordinary:.03,gouyi:.8,good:.75,double:.1};
const BIRTH_LABELS={
 red:{name:'赤霞映阙',kind:'good',effects:{hp:6},age:0,title:'赤霞映阙 · 殿窗初红',scene:'第一声啼哭传出时，暮霞将殿窗映得通红。乳母抱着襁褓，让人放轻脚步，生怕惊着这份新来的安宁。'},
 star:{name:'文星流彩',kind:'good',effects:{lit:6},age:0,title:'文星流彩 · 银痕过阁',scene:'值夜宫人说，孩子降生那一刻，一道流星掠过文渊阁，像夜空中落下的一笔银墨。掌事将时辰写入诞生簿，盼孩子日后能与书卷相亲。'},
 rainbow:{name:'长虹贯庭',kind:'good',effects:{mar:6},age:0,title:'长虹贯庭 · 雨后初啼',scene:'雨刚停，庭院上方便横起长虹。产房中的哭声清亮，檐下侍卫也不由抬起头；有人笑说，愿孩子长大有一副敢迎风雨的胆气。'},
 purple:{name:'紫气东来',kind:'good',effects:{lit:1,mar:1,vir:1,hp:1},age:0,title:'紫气东来 · 晓色入帘',scene:'晨光穿过薄雾，东边天色泛起淡紫。孩子睡在新换的软衾里，宫人将这场晓色记作吉兆，盼日后的才学、品行与身体都能稳稳长成。'},
 qilin:{name:'麟趾呈祥',kind:'good',effects:{vir:6},age:3,title:'麟趾呈祥 · 留下的糖',scene:'分点心时，孩子将自己那份留了一半，递给刚挨过训的小宫人，又认真问：“她今日是不是还没有吃过？”乳母把这件小事说给你听。'},
 dual:{name:'文武双璧',kind:'good',effects:{lit:3,mar:3},age:6,title:'文武双璧 · 书卷与小弓',scene:'课后，孩子抱着刚读过的书来问骑射里的道理，又拿起小弓，比画书中将军怎样守城。师傅请示，是否让读书与习武各有一段合宜的工夫。'},
 dragon:{name:'龙吟虎啸',kind:'good',effects:{mar:4,hp:2},age:6,title:'龙吟虎啸 · 演武初试',scene:'演武场上，孩子练完步法仍不肯歇，主动请师傅再看一遍。额上汗珠滚下来，眼睛却亮着；师傅夸有筋骨，也叮嘱不可逞强伤身。'},
 snow:{name:'瑞雪凝华',kind:'good',effects:{hp:4,vir:2},age:0,title:'瑞雪凝华 · 云华如雪',scene:'孩子降生时，日边泛起一圈清白的光晕，云华如碎雪凝在天上。值守宫人取名“瑞雪凝华”，愿孩子体魄康健，也有一颗肯体恤旁人的心。'},
 early:{name:'幼慧过人',kind:'good',effects:{lit:8},later:{lit:2},age:3,title:'幼慧过人 · 认得旧句',scene:'乳母随口念了半句旧诗，孩子竟接上了前几日听过的后半句，又问那里面的月亮为什么会照到别人的家。师傅欣喜，也怕大人急着拿聪慧去催逼一个幼童。'},
 fragile:{name:'慧极易伤',kind:'bad',effects:{lit:6,hp:-2},age:6,title:'慧极易伤 · 灯下倦意',scene:'孩子把一道题想得透彻，讲起来头头是道，却在说完后疲倦地伏在案上。太医请把用功的时辰分短一些：才思可贵，身体更不能一直透支。'},
 sharp:{name:'锋芒毕露',kind:'good',effects:{lit:3,mar:3,amb:2},age:6,excludes:['serene'],title:'锋芒毕露 · 请再试一回',scene:'课业与骑射都结束了，孩子还追着师傅问哪里能够再进一分。听见同伴受夸，便也想试上一回；你看得出那份进取心，也可以教孩子学会欣赏旁人。'},
 serene:{name:'清静无争',kind:'good',effects:{vir:4,hp:2,amb:-2},age:6,excludes:['sharp'],title:'清静无争 · 树下小憩',scene:'同伴争着排演献艺，孩子把位置让出，坐到树下帮年幼的手足理好衣带。被问起为何不争先，只说：“做得好就好了，未必要人人先看见我。”'},
 frail:{name:'初生体弱',kind:'bad',effects:{hp:-2},age:0,title:'初生体弱 · 襁褓调养',scene:'太医诊过脉，叮嘱乳母勤看饮食、睡眠与冷暖。孩子体质偏弱，日后每年都须留意调养，不能因为一时气色好些便疏忽。'},
 quake:{name:'出生时地动',kind:'bad',effects:{},age:0,title:'出生时地动 · 不罪婴儿',scene:'孩子降生当夜，京畿传来地动的消息。有人将两件事牵扯到一起，产房里也渐渐有人不敢说话。你可以让朝臣去查灾情，让乳母安心照看孩子。'},
 drought:{name:'出生逢旱',kind:'bad',effects:{},age:0,title:'出生逢旱 · 久旱中的啼声',scene:'京畿久旱未解，孩子偏在这个时候降生。有宫人把灾情附会到襁褓上；太医却请照常送乳、照常探视，不要让流言耽误一个新生儿的照护。'}
};
const BIRTH_LABEL_SKIES={
 red:'啼哭初起，赤霞映红殿窗，宫人记下了这一刻的天色。',
 star:'诞生之夜，一道流星划过文渊阁上空，如银墨落在夜幕。',
 rainbow:'产房报喜时雨歇虹出，一道长虹横过宫庭。',
 purple:'孩子降生时，东边云霭泛出淡紫，晓色徐徐入帘。',
 qilin:'产房报喜前，庭上五色云舒展如麟趾。国师记作仁厚之兆，仍说品行须在日后的教养中养成。',
 dual:'降生之夜，东西两颗明亮的星遥遥相映。掌事记下“文武双璧”，愿书卷与弓马都能陪孩子长大。',
 dragon:'诞生时远山雷动，云间回声似龙吟，云影又有虎踞之形。宫人记作勇健之兆。',
 snow:'孩子降生时，日边现出银白光晕，云华如雪而不落，宫人记为“瑞雪凝华”。',
 early:'孩子降生前的晨光里，文星早早透出云层，亮得格外分明。国师解作幼慧之兆，却叮嘱不要急着催逼一个幼童。',
 fragile:'孩子降生之夜，一颗星光芒锐亮，却时明时隐。国师记为“慧极易伤”，太医只请日后兼顾读书与调养。',
 sharp:'产房报喜时，天边一道星芒清亮夺目，压过近旁微光。宫人记作进取之兆，掌事也添了一句：日后须学会收放。',
 serene:'孩子诞生之夜，群星之间有一处清光静定，不争最亮，却久不散去。国师记作清静无争之象。',
 frail:'诞生之夜薄云掩星，星色微弱。太医察看襁褓，见孩子体质偏弱，叮嘱今后格外照料饮食冷暖。',
 quake:'孩子降生当夜，京畿报来地动。宫人将两件事并记，灾情却不能成为责罚婴儿的凭据。',
 drought:'孩子出生之时，京畿久旱未雨。有人将旱象附会于襁褓，仍应照常照护孩子、另查民间灾情。'
};
function birthLabelEffects(id,age=1){const label=BIRTH_LABELS[id];return id==='early'&&age>=7?label.later:label?.effects||{};}
function birthLabelEffectText(id){
 const label=BIRTH_LABELS[id];if(!label)return '';
 const describe=effects=>Object.entries(effects).map(([key,n])=>`${BIRTH_LABEL_STATS[key]}${n>=0?'+':''}${n}`).join('、');
 return id==='early'?'1—6岁每年才学+8；7岁起每年才学+2':Object.keys(label.effects).length?'每年'+describe(label.effects):'剧情标记，不扣年度属性';
}
function birthLabelPool(c,kind,except=[]){
 return Object.keys(BIRTH_LABELS).filter(id=>BIRTH_LABELS[id].kind===kind&&!except.includes(id)&&!except.some(other=>BIRTH_LABELS[other].excludes?.includes(id)||BIRTH_LABELS[id].excludes?.includes(other)))
   .map(id=>({id,w:id==='frail'&&c?.trait==='体弱'?3:1}));
}
function rollBirthLabels(c){
 const blessed=gouyiBirthBlessing(c);
 if(!chance(blessed?BIRTH_LABEL_RULES.gouyi:BIRTH_LABEL_RULES.ordinary))return [];
 const kind=blessed||chance(BIRTH_LABEL_RULES.good)?'good':'bad',ids=[pickW(birthLabelPool(c,kind)).id];
 if(chance(BIRTH_LABEL_RULES.double))ids.push(pickW(birthLabelPool(c,kind,ids)).id);
 return ids;
}
function applyBirthLabels(k,ids){
 if(Array.isArray(k.birthLabels))return false;
 if(ids.length>2||new Set(ids).size!==ids.length||ids.some(id=>!BIRTH_LABELS[id])||new Set(ids.map(id=>BIRTH_LABELS[id].kind)).size>1)return false;
 if(ids.some(id=>BIRTH_LABELS[id].excludes?.some(other=>ids.includes(other))))return false;
 if(gouyiBirthBlessing(byId(k.mom))&&ids.some(id=>BIRTH_LABELS[id].kind==='bad'))return false;
 k.birthLabels=[...ids];k.birthLabelYears={};k.birthLabelEvents={};
 if(ids.includes('sharp'))k.temperament='好胜';else if(ids.includes('serene'))k.temperament='内敛';else if(ids.includes('qilin'))k.temperament='仁厚';
 // Compatibility fields are only mirrors for older story and investigation code.
 k.birthOmen=ids.find(id=>BIRTH_OMENS[id]);if(!k.birthOmen)delete k.birthOmen;
 k.birthTrouble=ids.find(id=>BIRTH_TROUBLES[id]);if(!k.birthTrouble)delete k.birthTrouble;
 if(ids.includes('frail')){k.hp=Math.min(k.hp,60);if(k.birthTraits)k.birthTraits.initial.hp=k.hp;}
 for(const id of ids){const label=BIRTH_LABELS[id];kstory(k,`【出生天象 · ${label.name}】${BIRTH_LABEL_SKIES[id]}${label.kind==='good'?'吉禀':'隐忧'}，${birthLabelEffectText(id)}。${id==='frail'&&k.birthTraits?.mother?.trait==='体弱'?'生母亦素来体弱，太医叮嘱母子都须留意调养。':''}${label.age>0?`待${label.age}岁渐长，留意这份禀赋在日常中的表现。`:''}`);}
 return true;
}
function birthLabelsHTML(k){return k.birthLabels.map(id=>BIRTH_LABELS[id]?`<span class="tag ${BIRTH_LABELS[id].kind==='good'?'y':'r'}" title="${BIRTH_LABELS[id].kind==='good'?'好标签':'坏标签'}；周岁起按生辰结算，属性范围0—100。">${BIRTH_LABELS[id].name} · ${birthLabelEffectText(id)}</span>`:'').join('');}
function annualBirthLabels(k,age){
 k.birthLabelYears ||= {};
 for(const id of k.birthLabels){
   const label=BIRTH_LABELS[id];if(!label||k.birthLabelYears[id]>=age)continue;
   k.birthLabelYears[id]=age;const changes=[];
   for(const [key,n] of Object.entries(birthLabelEffects(id,age))){const before=k[key];k[key]=clamp(before+n);const delta=rd(k[key]-before);changes.push(`${BIRTH_LABEL_STATS[key]}${delta>=0?'+':''}${delta}（${rd(before)}→${rd(k[key])}）`);}
   if(changes.length)kstory(k,`【禀赋岁记 · ${label.name}】${age}岁生辰，${changes.join('，')}。${id==='early'&&age===7?'幼慧渐转为平稳成长，往后每年才学+2。':''}`);
 }
 queueBirthLabelStories(k);
}
function birthLabelStoryGroup(k,id,marker=id){return (k.birthGroup?S.children.filter(other=>other.birthGroup===k.birthGroup):[k]).filter(other=>other.alive&&!other.pendingName&&other.birthLabels?.includes(id)&&!other.birthLabelEvents?.[marker]);}
function birthLabelMotherLine(m,label){
 if(!inPalace(m))return '';
 if(label.kind==='bad')return `\n${fullName(m)}听后有些担忧，只请你别让议论与催逼落到孩子身上。`;
 return `\n${fullName(m)}${['城府','骄矜','善妒'].includes(m.trait)?'欣喜之余，也盼这份天资能让孩子日后多些立足的本事。':'听了很欢喜，却仍说，最要紧的是孩子能平安长大。'}`;
}
function birthLabelStory(k,id,birth=false){
 const label=BIRTH_LABELS[id];if(!label)return null;
 const birthScene=birth&&label.age>0,marker=birthScene?id+':birth':id,storyAge=birthScene?0:label.age,scene=birthScene?BIRTH_LABEL_SKIES[id]:label.scene,children=birthLabelStoryGroup(k,id,marker);
 if(!children.length||children[0]!==k||kidAge(k)<storyAge)return null;
 const eventKey=`birth-label:${k.birthGroup||k.id}:${marker}`;
 if(curEv?.birthLabelKey===eventKey||Q.some(ev=>ev.birthLabelKey===eventKey))return null;
 const m=byId(k.mom),names=children.map(kidName).join('、'),physical=['frail','fragile'].includes(id),weather=['quake','drought'].includes(id);
 const remote=storyAge>0&&children.every(child=>!childInPalace(child)),careFor=inPalace(m)?'母子':'孩子';
 const valid=()=>children.some(child=>child.alive&&!child.birthLabelEvents?.[marker]);
 const settle=(choice,care=false)=>{
   if(!valid()||care&&E().treasury<10)return null;
   if(care)chg({treasury:-10});
   for(const child of children.filter(child=>child.alive&&!child.birthLabelEvents?.[marker])){
     (child.birthLabelEvents ||= {})[marker]={turn:S.turn,choice};child.love=clamp(child.love+2);
     if(care&&physical)child.hp=clamp(child.hp+3);
     kstory(child,`【${birthScene?'诞生天象 · ':''}${label.name}】${scene}陛下${choice}。${care&&physical?'太医加强照护，体魄+3；年度调养仍不可中断。':''}`);
   }
   if(inPalace(m)){story(m,`${names}的「${label.name}」一事：${scene}陛下${choice}。`);cchg(m,{mood:label.kind==='bad'?4:3});}
   return `${names}的经历已写入纪事。${care&&physical?'太医已拟好调养方，日后仍须留意起居。':''}${weather?'灾情归朝臣查办，不将责任加于孩子。':''}`;
 };
 return {title:birthScene?label.name+' · 诞生天象':label.title,birthLabelKey:eventKey,cast:[...(inPalace(m)?[m]:[]),...children],valid,text:`${names}\n\n${remote?'随侍送来家书，说起孩子近来的事：':''}${scene}${birthLabelMotherLine(m,label)}\n§${label.name} · ${label.kind==='good'?'好标签':'坏标签'}：${birthLabelEffectText(id)}`,
   choices:physical?[{t:'请太医拟定养护方 · 国库−10',cond:()=>E().treasury>=10,f:()=>settle('命太医拟定养护方',true)},{t:remote?'写信问候，嘱咐细心照护':'陪着孩子，按常例照护',f:()=>settle(remote?'写信问候，嘱咐照常细心照护':'陪着孩子，嘱咐照常细心照护')}]:weather?[{t:'查灾情，不以灾异罪婴儿',f:()=>settle('命朝臣查明灾情，不以灾异责罚孩子')},{t:'嘱宫人安静照护，止住流言',f:()=>settle('止住宫中流言，嘱宫人安静照护')}]:[{t:'循性教养，不急着催逼',f:()=>settle('嘱咐循性教养，不急着催逼')},{t:storyAge?(remote?'回信说说往后的打算':'陪孩子说说心里的打算'):'记下这份祝愿，先顾好'+careFor,f:()=>settle(storyAge?(remote?'与孩子通信，说起往后的打算':'陪孩子说起心里的打算'):'记下祝愿，先照顾好'+careFor+'起居')}]};
}
function queueBirthLabelStories(k){
 if(!birthLabelsActive()||!k.alive||k.pendingName||!Array.isArray(k.birthLabels))return;
 for(const id of k.birthLabels){const ev=birthLabelStory(k,id);if(ev)pushEv(ev);}
}
function birthLabelFollowups(children){return children.flatMap(k=>(k.birthLabels||[]).map(id=>birthLabelStory(k,id,true)).filter(Boolean));}
function birthLabelDeliveryText(d){return (d.labels||[]).map(id=>`\n${BIRTH_LABEL_SKIES[id]}\n§${BIRTH_LABELS[id].name} · ${BIRTH_LABELS[id].kind==='good'?'好标签':'坏标签'}：${birthLabelEffectText(id)}`).join('');}
