/* ============ 朝堂事件 ============ */
const officialC=(p=50)=>{const a=harem().filter(c=>c.fam.p>=p);return a.length?pick(a):null};
const COURT=[
 brief=>{const off=brief?harem().find(c=>c.id===brief.person):officialC(50);const ch=[
   {t:'拨银三百万两赈灾',f:()=>{log('黄河决堤，帝拨银三百万两赈灾。',1);return `赈灾粮银连夜出京，灾民感念皇恩。${fx(chg({treasury:-300,people:10,prestige:3}))}`}},
   {t:'令地方官府自行筹措',f:()=>{log('黄河决堤，帝令地方自筹，民怨沸腾。');return `地方层层摊派，民间怨声四起。${fx(chg({people:-8}))}`}}];
  if(off)ch.push({t:`命${cName(off)}之父（${off.fam.t}）督办`,f:()=>{if(chance(.6)){story(off,'其父奉旨督办黄河赈灾，颇有成效，她在宫中亦觉面上有光。');return `差事办得漂亮。${fx(chg({treasury:-150,people:6,prestige:2}),cchg(off,{aff:8,mood:10}))}`}
    story(off,'其父督办赈灾不力，遭御史弹劾，她日夜忧惧。');return `赈灾银两被层层克扣，灾情反而加重。${fx(chg({treasury:-200,people:-5}),cchg(off,{mood:-12}))}`}});
  return {title:'黄河决堤',person:off?.id,text:'工部急奏：入夏以来暴雨连绵，黄河于开封段决口，良田万顷尽成泽国，灾民流离失所。',choices:ch}},
 brief=>{const e=E();const gen=harem().find(c=>brief?c.id===brief.person:c.trait==='将门');const ch=[
   {t:'遣大将出征',f:()=>{if(chance(S.flags.wolf?.35:.6)){log('北狄犯边，王师击退之。');return `王师告捷。${fx(chg({treasury:-300,prestige:5}))}`}return `前线失利，丢了两座城池。${fx(chg({treasury:-300,prestige:-5,people:-5}))}`}},
   {t:'御驾亲征',f:()=>{const p=.35+e.wu/180;if(chance(p)){log('北狄犯边，帝御驾亲征，大破敌军。',1);return `你身先士卒，三战三捷，狄戎远遁漠北。${fx(chg({prestige:12,people:5,treasury:-300}))}`}
     log('帝亲征北狄失利，负伤而还。',1);return `大军中伏，你虽突围而出，却身负箭伤。${fx(chg({prestige:-10,health:-10,treasury:-400}))}`}},
   {t:'遣使议和，岁赐金帛',f:()=>{log('与北狄议和，岁赐金帛。');return `边境暂安，朝中却有人暗讽软弱。${fx(chg({treasury:-150,prestige:-6}))}`}}];
  if(gen)ch.push({t:`命${cName(gen)}的父兄领兵`,f:()=>{if(chance(.75)){story(gen,'父兄领兵出征北境，大胜而归。');log(`${fullName(gen)}之父兄领兵击退北狄。`,1);return `将门虎子，果然不凡。${fx(chg({treasury:-250,prestige:8}),cchg(gen,{aff:12,mood:15}))}`}
    story(gen,'父兄出征失利，兄长战死沙场。她哭了整整三日。');return `兵败。她的兄长战死沙场。${fx(chg({treasury:-300,prestige:-6}),cchg(gen,{mood:-30}))}`}});
  return {title:'北境告急',person:gen?.id,sfx:'gong',text:'八百里加急：北狄铁骑南下，连破两道关隘，边民死伤无数。'+(S.flags.wolf?'\n各路诸侯想起骊山那场烽火，援军来得很慢。':''),choices:ch}},
 ()=>({title:'殿试',text:'三年一度的殿试之期已到，三百贡士候于殿外。',choices:[
   {t:'亲自出题考校',f:()=>{E().wen=clamp(E().wen+2);log('帝亲临殿试，钦点状元。');return `你出了一道“论民本”的策问，钦点一位寒门士子为状元，天下读书人称颂。${fx(chg({prestige:4,people:2}))}`}},
   {t:'交由礼部操办',delegated:true,f:()=>`殿试循例而行。${fx(chg({prestige:1}))}`}]}),
 brief=>{const c=brief?harem().find(c=>c.id===brief.person):officialC(35);if(!c)return null;return {title:'御史弹劾',person:c.id,por:c,text:`御史台上折，弹劾${cName(c)}之父（${c.fam.t}）贪墨枉法，证据凿凿。`,choices:[
   {t:'严查到底',f:()=>{if(chance(.6)){c.fam={t:c.fam.t+'（获罪）',p:Math.max(0,c.fam.p-30)};story(c,'其父贪墨案发，被革职查办。她在宫中脱簪待罪。');log(`${fullName(c)}之父贪墨案发，革职查办。`,1);return `查实其父贪墨百万两。${fx(chg({people:6,prestige:4,treasury:80}),cchg(c,{mood:-30,aff:-12}))}`}
     story(c,'其父遭弹劾，查无实据，得还清白。');return `查无实据，乃政敌构陷。${fx(chg({prestige:-2}),cchg(c,{aff:6}))}`}},
   {t:'留中不发',f:()=>{story(c,'其父遭弹劾，陛下将奏折压下。她心中感念。');return `你把奏折压下了。${fx(chg({people:-5}),cchg(c,{aff:10}))}`}},
   {t:'罚俸一年，以儆效尤',f:()=>`${fx(chg({people:2}),cchg(c,{mood:-8}))}`}]}},
 ()=>({title:'祥瑞',text:'礼部奏报：终南山猎户献上一头白鹿，称是天降祥瑞，颂陛下圣德。',choices:[
   {t:'大赦庆贺',f:()=>{log('终南山献白鹿，帝大赦天下。');return `举国同庆。${fx(chg({prestige:5,people:3,treasury:-80}))}`}},
   {t:'斥其谄媚，放鹿归山',f:()=>`你命人将白鹿放归山林。朝臣暗暗称是。${fx(chg({people:4,prestige:2}))}`}]}),
 ()=>({title:'蝗灾',text:'河南、山东飞蝗蔽日，禾稼尽毁。',choices:[
   {t:'开仓放粮（国库-200万两）',f:()=>{log('蝗灾，帝开仓放粮。');return `${fx(chg({treasury:-200,people:8}))}`}},
   {t:'设坛祭天',f:()=>chance(.4)?`祭天三日，忽降大雨，蝗群散去。${fx(chg({prestige:4}))}`:`蝗灾未止，百姓流亡。${fx(chg({people:-7}))}`},
   {t:'悬赏捕蝗，以蝗换粟',f:()=>`百姓争相捕蝗，灾情渐缓。${fx(chg({treasury:-80,people:4}))}`}]}),
 ()=>({title:'盐政',text:'户部尚书奏请整顿盐政：废除盐引世袭，可增岁入，但必触怒盐商与其背后的勋贵。',choices:[
   {t:'准奏，雷厉风行',f:()=>{log('帝整顿盐政。',1);return `盐税大增，勋贵怨声载道。${fx(chg({treasury:250,prestige:2,people:-3}))}`}},
   {t:'维持旧制',f:()=>`一切照旧。${fx(chg({prestige:-1}))}`}]}),
 ()=>({title:'江南贡品',text:'江南织造进贡云锦百匹、东珠十斛。',choices:[
   {t:'分赏六宫',f:()=>{harem().forEach(c=>{c.mood=clamp(c.mood+8)});return '六宫欢喜，争相裁制新衣。\n§后宫众人心情+8'}},
   {t:'变卖充入国库',f:()=>`${fx(chg({treasury:120}))}`},
   {t:'下旨减免织造之役',f:()=>`江南织工感激涕零。${fx(chg({people:5}))}`}]}),
 brief=>{const g=brief?.guest||makeGirl({fam:{t:'西域贡女',p:10},trait:pick(['活泼','骄矜','聪慧','痴情'])});if(!brief?.guest){g.looks=clamp(g.looks+12);g.sur='阿';g.given=pick(['依娜','古丽','月儿','米娅']);}
  return {title:'西域使臣',por:g,text:`西域诸国遣使朝贡，献上美人${fullName(g)}，碧眼雪肤，能歌善舞。`,choices:[
   {t:'纳入后宫，封为常在',f:()=>{addConsort(g,2,'西域进献');return `她用生涩的汉话向你行礼。${fx(chg({prestige:2}))}`}},
   {t:'婉拒，厚赐使臣',f:()=>`使臣叹服天朝气度。${fx(chg({prestige:3,people:2,treasury:-30}))}`}]}},
 brief=>{const sons=kidsAlive().filter(k=>k.sex==='m'&&kidAge(k)>=6&&(!brief||brief.sons?.includes(k.id))).slice(0,4);if(!sons.length||S.heir)return null;
  return {title:'请立储君',sons:sons.map(k=>k.id),text:`以内阁首辅为首，群臣联名上书：“国本未定，人心不安，伏请陛下早立储君。”`,choices:[
   ...sons.map(k=>({t:`立${kidName(k)}（${kidAge(k)}岁）`,f:()=>{S.heir=k.id;kstory(k,'群臣请立储君，被册为皇太子。');log(`立${k.name}为皇太子。`,1);const m=byId(k.mom);if(m)cchg(m,{mood:25});return `${fx(chg({prestige:6}))}`}})),
   {t:'朕春秋正盛，此事容后再议',f:()=>`${fx(chg({prestige:-3}))}`}]}},
 ()=>({title:'京畿疫病',text:'京畿一带爆发时疫，染病者日增。',choices:[
   {t:'命太医院全力救治（国库-150万两）',f:()=>{log('京畿时疫，太医院救治有方。');return `${fx(chg({treasury:-150,people:6}))}`}},
   {t:'封锁疫区',f:()=>`疫情被控制住了，但疫区百姓死伤惨重。${fx(chg({people:-6,prestige:1}))}`}]}),
 ()=>({title:'五谷丰登',text:'今年风调雨顺，各省奏报丰收。',choices:[
   {t:'减免三成赋税',f:()=>{log('岁丰，帝减免赋税。');return `${fx(chg({treasury:-100,people:9}))}`}},
   {t:'照常征收，充实国库',f:()=>`${fx(chg({treasury:180}))}`}]}),
 ()=>({title:'修建园林',text:'工部奏请于西郊修建避暑园林，以供圣驾消夏。',choices:[
   {t:'准奏（国库-300万两）',f:()=>{harem().forEach(c=>c.mood=clamp(c.mood+10));log('帝修西郊园林。');return `${fx(chg({treasury:-300,people:-4}))}\n§后宫众人心情+10`}},
   {t:'不准，崇尚节俭',f:()=>`${fx(chg({people:3,prestige:2}))}`}]}),
 ()=>({title:'文武之争',text:'内阁首辅与镇国大将军在朝堂上争执不下：一要削减军费兴修水利，一要扩军备边。',choices:[
   {t:'偏向文臣，兴修水利',f:()=>{harem().filter(c=>c.trait==='将门').forEach(c=>cchg(c,{mood:-10}));return `${fx(chg({treasury:-100,people:6,prestige:-1}))}`}},
   {t:'偏向武将，扩军备边',f:()=>`${fx(chg({treasury:-150,prestige:5,people:-2}))}`},
   {t:'各打五十大板',f:()=>`两人都讨了没趣。${fx(chg({prestige:2}))}`}]}),
 ()=>({title:'地龙翻身',sfx:'gong',text:'钦天监奏报：陇西地震，屋舍倾颓，死伤者众。朝野议论，皆言上天示警。',choices:[
   {t:'下罪己诏',f:()=>{log('陇西地震，帝下罪己诏。',1);return `${fx(chg({prestige:-3,people:8}))}`}},
   {t:'拨银赈灾（国库-200万两）',f:()=>`${fx(chg({treasury:-200,people:5}))}`}]}),
 ()=>({title:'老臣乞骸骨',text:'三朝元老、太傅陈公年过七旬，上表请求告老还乡。',choices:[
   {t:'厚赐金帛，亲送出城',f:()=>`老臣涕泪纵横。百官感念陛下仁厚。${fx(chg({treasury:-30,prestige:3}))}`},
   {t:'挽留：“朝廷离不开您老。”',f:()=>`老臣又留任一年，朝政井井有条。${fx(chg({prestige:1,people:2}))}`}]}),
];
const SPONT=[0,1,5,10,11,14];
function courtEvent(){
  const ev=COURT[pick(SPONT)]();
  ev.onQueue=()=>{S.flags.lastCourt=ev.title;};
  return ev;
}

function monthlyCourtEvent(){
  const brief=S.flags.monthlyCourt;
  if(brief?.turn===S.turn&&brief.gen===S.gen){
    return brief.done?null:COURT[brief.index]?.(brief);
  }
  for(const index of shuffle(COURT.map((_,i)=>i))){
    const ev=COURT[index]();
    if(!ev)continue;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index,person:ev.person,sons:ev.sons,
      guest:ev.title==='西域使臣'?ev.por:undefined};
    save('auto');
    return ev;
  }
}

const COURT_BLOCS=[
  {id:'kin',name:'外戚',interest:'家族地位与官职',metric:()=>Math.max(0,...harem().map(c=>c.fam.p)),cost:{treasury:-12},gain:{prestige:3}},
  {id:'civil',name:'文官',interest:'科举、财政与民政',metric:()=>E().people,cost:{treasury:-10},gain:{people:5,wen:2}},
  {id:'army',name:'武将',interest:'军功与边防',metric:()=>E().wu,cost:{treasury:-16},gain:{wu:4,prestige:2}},
  {id:'dowager',name:'太后',interest:'宗室血脉与宫廷稳定',metric:()=>S.flags.dowager?.alive?65:0,cost:{treasury:-8},gain:{prestige:4}},
  {id:'princes',name:'皇子',interest:'储位与继承',metric:()=>Math.max(0,...kidsAlive().filter(k=>k.sex==='m').map(k=>k.sup||0)),cost:{treasury:-12},gain:{prestige:3,people:2}}
];
function courtStanding(bloc){return clamp(Math.round(bloc.metric()+(S.courtPolicy?.[bloc.id]||0)))}
A.courtPolicy=function(id){
  const bloc=COURT_BLOCS.find(group=>group.id===id);
  if(!bloc||S.courtPolicyTurn===S.turn||E().energy<=0||E().treasury< -bloc.cost.treasury)return;
  if(id==='dowager'&&!S.flags.dowager?.alive)return;
  S.courtPolicy ||= {};
  E().energy--;
  S.courtPolicyTurn=S.turn;
  chg({...bloc.cost,...bloc.gain});
  for(const group of COURT_BLOCS){
    const previous=S.courtPolicy[group.id]||0;
    S.courtPolicy[group.id]=Math.max(-30,Math.min(30,previous+(group===bloc?10:-2)));
  }
  log(`御书房议政，优先采纳${bloc.name}建议。`,1);
  courtEcho(id);
  save('auto');render();
};
function courtBlocHTML(){
  return `<h3>朝堂势力</h3><div class="grid">${COURT_BLOCS.map(bloc=>{
    const unavailable=S.courtPolicyTurn===S.turn||E().energy<=0||E().treasury< -bloc.cost.treasury||(bloc.id==='dowager'&&!S.flags.dowager?.alive);
    return `<article class="card" style="display:block;cursor:default"><b>${bloc.name}</b><div>${bloc.interest}</div>${bar('影响力',courtStanding(bloc))}<button class="btn sm" onclick="A.courtPolicy('${bloc.id}')" ${unavailable?'disabled':''}>采纳建议 · 国库 ${bloc.cost.treasury}</button></article>`;
  }).join('')}</div>`;
}
/* ============ 父兄、立场与朝局 ============ */
// 每位妃嫔的父亲和兄长都是有名有姓的人，分属五大集团之一。朝堂上的事会落到具体的人和妃嫔身上。
const OFFICE_BLOC={'内阁首辅':'civil','吏部尚书':'civil','户部侍郎':'civil','翰林学士':'civil','知府':'civil','县令':'civil','书香门第':'civil',
  '镇国大将军':'army','两江总督':'army','皇商':'kin','太医院院判':'dowager','寒门':null};
const FATHER_NAMES=['敬之','文远','守义','承业','怀瑾','思齐','伯庸','仲谋','子衡','季安','修远','明德','元朗','景行','致远','叔夜','延年','鸿儒'];
const BROTHER_NAMES=['子昂','云深','少卿','长风','清和','怀远','叔宝','仲安','伯言','子期','砚秋','望舒','承泽','慕白'];
const BROTHER_POSTS={civil:['翰林院编修','户部主事','监察御史','知县'],army:['游击将军','守备','参将','骁骑校尉'],kin:['盐运使','苏州织造','内务府员外郎'],dowager:['太医院吏目','宗人府主事'],none:['举人','国子监生']};
const FRONTIERS=['雁门关','玉门关','居庸关','嘉峪关','山海关'];
const blocName=id=>COURT_BLOCS.find(b=>b.id===id)?.name||'无所依附';
const BLOC_COLOR={kin:'#b8742c',civil:'#3b5fa8',army:'#9a3b33',dowager:'#7a5a99',princes:'#2f7d62'};
function sameFather(a,b){
  const left=a.house?.father,right=b.house?.father;
  if(left?.id!=null&&right?.id!=null&&left.id===right.id)return true;
  if(a.fatherId!=null&&a.fatherId===b.fatherId)return true;
  const kin=[a.kin?.[b.id],b.kin?.[a.id]].filter(Boolean);
  if(kin.some(k=>/^亲[姐妹]$/.test(k)))return true;
  if(kin.some(k=>/^堂[姐妹]$/.test(k)))return false;
  // Before fathers had an identity, the same father was copied into each daughter.
  // Only reconcile within a clan; explicit cousins and two identified fathers stay separate.
  return !!(left&&right&&(!left.id||!right.id)&&clanKey(a)===clanKey(b)&&
    left.name===right.name&&left.office===right.office);
}
function paternalFamily(c){
  const people=[...new Set([...(S?.consorts||[]),...(S?.cands||[]),c])].filter(p=>p&&!p.maid);
  const relatives=new Set([c]);
  let changed=true;
  while(changed){
    changed=false;
    for(const person of people){
      if(relatives.has(person))continue;
      if([...relatives].some(other=>sameFather(person,other))){
        relatives.add(person);changed=true;
      }
    }
  }
  return [...relatives].sort((a,b)=>a.id-b.id);
}
function identifyFather(family,house){
  const root=family[0],father=house.father;
  father.id ||= 'father-'+S.gen+'-'+root.id;
  // Generated cousins may have picked the same short name. Distinguish those people.
  const taken=new Set([...(S.consorts||[]),...(S.cands||[])].filter(p=>
    !family.includes(p)&&clanKey(p)===clanKey(root)&&p.house?.father.id&&p.house.father.id!==father.id)
    .map(p=>p.house.father.name));
  if(taken.has(father.name)){
    const available=FATHER_NAMES.map(name=>root.sur+name);
    let suffix=1;
    father.name=available.find(name=>!taken.has(name))||root.sur+'承'+suffix;
    while(taken.has(father.name))father.name=root.sur+'承'+(++suffix);
  }
  family.forEach(p=>{p.house=house;p.fatherId=root.id;});
  for(const person of family)for(const sister of family){
    if(person===sister)continue;
    person.kin ||= {};
    if(!person.kin[sister.id]||person.kin[sister.id].startsWith('堂'))
      person.kin[sister.id]='亲'+(sister.age>person.age||(sister.age===person.age&&sister.id<person.id)?'姐':'妹');
  }
  return house;
}
function houseOf(c){
  if(!c||c.maid)return null;
  const family=paternalFamily(c),root=family[0];
  const existing=family.find(p=>p.house)?.house;
  if(existing)return identifyFather(family,existing);
  const seed=(root.seed||root.id*7919)>>>0,bloc=Object.hasOwn(OFFICE_BLOC,root.fam?.t)?OFFICE_BLOC[root.fam.t]:null;
  const posts=BROTHER_POSTS[bloc||'none'];
  root.house={bloc,
    father:{name:root.sur+FATHER_NAMES[seed%FATHER_NAMES.length],office:root.fam?.t||'寒门',age:42+seed%17,alive:true},
    brother:{name:root.sur+BROTHER_NAMES[(seed>>>5)%BROTHER_NAMES.length],post:posts[(seed>>>9)%posts.length],merit:20+(seed>>>3)%30,away:false}};
  return identifyFather(family,root.house);
}
// 立场：父兄所在的集团；娘家势力大的妃嫔也会被看作外戚一派
function stanceOf(c){const h=houseOf(c);if(!h)return null;return h.bloc||(c.fam?.p>=55?'kin':null)}
function houseLine(c){
  const h=houseOf(c);if(!h)return '';
  const st=stanceOf(c);
  return `<div>父亲：${esc(h.father.name)}（${esc(h.father.office)}${h.father.honor?' · '+esc(h.father.honor):''}${h.father.alive?'':'，已故'}）　兄长：${esc(h.brother.name)}（${esc(h.brother.post)}${h.brother.away?'，外放':''}）　立场：<span class="tag" style="border-color:${BLOC_COLOR[st]||'#999'}">${esc(blocName(st))}</span></div>`;
}
const policyNudge=(id,v)=>{S.courtPolicy ||= {};S.courtPolicy[id]=Math.max(-30,Math.min(30,(S.courtPolicy[id]||0)+v))};
// 采纳某一派的建议：同派妃嫔高兴，与之相争的一派妃嫔不痛快
const BLOC_RIVAL={kin:'civil',civil:'kin',army:'civil',dowager:'princes',princes:'dowager'};
function courtEcho(id){
  const glad=[],sour=[];
  for(const c of harem()){
    const st=stanceOf(c);
    if(st===id){cchg(c,{mood:4});glad.push(c);}
    else if(st&&st===BLOC_RIVAL[id]){cchg(c,{mood:-3});sour.push(c);}
  }
  if(glad.length)log(`${glad.map(cName).join('、')}的娘家在朝中得了脸面。`);
  if(sour.length)story(sour[0],`陛下采纳了${blocName(id)}的建议，她父亲${houseOf(sour[0]).father.name}在朝上碰了钉子。`);
}
// 每月：兄长攒军功或政绩，父亲渐老，偶有致仕或病故
function courtTick(){
  const seen=new Set();
  for(const c of harem()){
    const h=houseOf(c);if(!h)continue;
    if(seen.has(h))continue;
    seen.add(h);
    h.brother.merit=clamp(h.brother.merit+(h.bloc==='army'?(E().wu-50)/40:.3)+R()*.6);
    if(S.month===1&&h.father.alive){h.father.age++;
      if(h.father.age>=66&&chance(.12)){
        h.father.alive=false;
        for(const daughter of paternalFamily(c).filter(inPalace)){
          cchg(daughter,{mood:-15});setXin(daughter,'悲恸',`父亲${h.father.name}病故`);
          story(daughter,`父亲${h.father.name}在家中病故。`);daughter.fam.p=Math.max(5,daughter.fam.p-10);
        }
        log(`${cName(c)}之父${h.father.name}病故。`,1);
      }}
  }
}
// Wins and defeats share a court-wide interval; sisters share their household's interval.
function frontierReportReady(c){
  return S.turn-(S.flags.lastFrontierReport??S.flags.lastMilitaryMerit??-99)>=12&&
    S.turn-(houseOf(c)?.lastFrontierReport??-99)>=24;
}
function frontierReport(c,officer,event){
  let queued=false;
  return {...event,present:[c],
    valid:()=>officer.alive!==false&&(queued||frontierReportReady(c)),
    onQueue:()=>{queued=true;S.flags.lastFrontierReport=S.turn;houseOf(c).lastFrontierReport=S.turn;
      if(event.title==='边关捷报')S.flags.lastMilitaryMerit=S.turn;}};
}
function militaryMeritEvent(c,place,relative='brother'){
  const h=houseOf(c),officer=h[relative],kin=relative==='father'?'父亲':'兄长';
  const mark=()=>{officer.merit=clamp((officer.merit||0)+15);policyNudge('army',5);};
  const next=c.rank+1,promotable=()=>c.alive&&!c.cold&&!c.gone&&next<8&&c.rank+1===next&&rankCount(next)<RANK_CAP[next];
  return frontierReport(c,officer,{title:'边关捷报',por:c,
    text:`传旨公公捧着${place}八百里捷报进殿：${officer.name}率部夜袭敌营，斩获颇丰。${relative==='father'?`其子${h.brother.name}也随军效力。`:''}\n${cName(c)}听见${kin}的名字，忙起身听旨，眼中难掩喜色。`,choices:[
      {t:`厚赏，加封其${relative==='father'?'父':'兄'}（国库-20）`,cond:()=>E().treasury>=20,why:'国库银两不足',f:()=>{
        mark();if(relative==='brother')h.brother.post='总兵';else h.father.honor='护国功臣';
        story(c,`${kin}${officer.name}在${place}立功受封。`);log(`${officer.name}在${place}立功，朝廷加封厚赏。`,1);
        return fx(cchg(c,{mood:10,aff:3}),chg({treasury:-20,prestige:3}));
      }},
      {t:next<8?`以军功加恩，晋${cName(c)}为${RANKS[next]}`:'位分已不能再晋，改行赏赐',person:c,cond:promotable,
        why:next>=8?'中宫需另行册立，不能因军功直接升后':'该位分名额已满或人物已不在宫',f:()=>{
          if(!promotable())return '眼下不合晋封条件，仍请按原位分论赏。';
          mark();c.rank=next;if(next>=4&&!c.title)c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)))||'昭';assignPalace(c);
          story(c,`${kin}${officer.name}在${place}立功，陛下当场加恩，晋为${cName(c)}。`);remember(c,'promo',`因${kin}军功晋封`);setXin(c,'欢喜','父兄立功，当场获晋封');clanEcho(c,'up');
          log(`以${officer.name}军功，加恩晋${fullName(c)}为${cName(c)}。`,1);return fx(cchg(c,{mood:20,aff:8,favor:5}),chg({prestige:2}));
        }},
      {t:`赏${cName(c)}锦缎珠玉（国库-15）`,person:c,cond:()=>E().treasury>=15,why:'国库银两不足',f:()=>{
        mark();remember(c,'gift','父兄立功，陛下当场赏赐锦缎珠玉');story(c,`${kin}${officer.name}立功，自己获赏锦缎珠玉。`);setXin(c,'欢喜','父兄立功，获赏锦缎珠玉');log(`因${officer.name}军功，赏${fullName(c)}锦缎珠玉。`,1);
        return fx(chg({treasury:-15,prestige:1}),cchg(c,{mood:15,aff:6,favor:3}));
      }},
      {t:'记功，暂不封赏',f:()=>{officer.merit=clamp((officer.merit||0)+8);story(c,`${kin}${officer.name}在${place}立功，已记入功册，暂未封赏。`);return fx(cchg(c,{mood:-4}));}}
    ]});
}
// An audience with two mothers requires two distinct households able to attend.
// A mother's confinement does not remove her child's independent succession rights.
function successionRivalryEvent(){
  if(S.heir)return null;
  const sons=shuffle(kidsAlive().filter(k=>k.sex==='m'&&kidAge(k)>=6&&
    familyVisitAllowed(k,byId(k.mom))&&!byId(k.mom).maid));
  const a=sons[0],b=a&&sons.find(k=>k.mom!==a.mom);if(!b)return null;
  const ma=byId(a.mom),mb=byId(b.mom),fa=houseOf(ma)?.father,fb=houseOf(mb)?.father;
  return {title:'国本之争',ref:'明·万历国本之争',cast:[ma,a,mb,b],present:[ma,a,mb,b],valid:()=>!S.heir&&familyVisitAllowed(a,ma)&&familyVisitAllowed(b,mb),text:`${fa?.alive?fa.name:fullName(ma)+'母家的支持者'}领着一班人上疏，请早立${kidName(a)}为储；${fb?.alive?fb.name:fullName(mb)+'母家的支持者'}的人则推${kidName(b)}。两位皇子的生母在御花园碰见，谁也没有先开口。`,choices:[
      {t:`暗示倾向${kidName(a)}`,person:a,f:()=>{a.sup=clamp((a.sup||0)+10);policyNudge('princes',3);setXin(mb,'嫉恨','陛下倾向别家皇子',ma.id);relAdd(ma,mb,-12);return fx(cchg(ma,{mood:8}),cchg(mb,{mood:-8}))}},
      {t:`暗示倾向${kidName(b)}`,person:b,f:()=>{b.sup=clamp((b.sup||0)+10);policyNudge('princes',3);setXin(ma,'嫉恨','陛下倾向别家皇子',mb.id);relAdd(ma,mb,-12);return fx(cchg(mb,{mood:8}),cchg(ma,{mood:-8}))}},
      {t:'“储位之事，谁再提，罚俸。”',f:()=>{policyNudge('princes',-5);return fx(chg({prestige:2,people:-1}))}}]};
}
// 朝堂派系事件：都落在具体的父兄、妃嫔和皇子身上
function factionEvent(){
  const pool=[];
  const withHouse=harem().filter(c=>houseOf(c)&&c.house.father.alive);
  const kin=withHouse.filter(c=>stanceOf(c)==='kin'&&c.favor>=45);
  if(kin.length){const c=pick(kin),h=houseOf(c);pool.push({title:'外戚请封',por:c,text:`${h.father.name}递了折子，请擢其子${h.brother.name}为京官。朝中都知道，这是${cName(c)}的娘家。文官们已经在私下议论“恩出于内”。`,choices:[
    {t:'准了',f:()=>{h.brother.post='通政司参议';h.brother.merit+=8;c.fam.p=Math.min(95,c.fam.p+6);policyNudge('kin',5);policyNudge('civil',-4);story(c,`陛下准了兄长${h.brother.name}入京为官。`);return fx(cchg(c,{mood:8,aff:3}),chg({prestige:-2}))}},
    {t:'驳回：“官职是朝廷的，不是谁家的。”',f:()=>{policyNudge('civil',3);setXin(c,'委屈','娘家请封被驳');return fx(cchg(c,{mood:-8}),chg({prestige:2}))}},
    {t:'外放历练，三年后再议',f:()=>{h.brother.away=true;h.brother.post='外放'+pick(['知州','同知','通判']);h.brother.merit+=4;policyNudge('civil',1);return fx(cchg(c,{mood:-2}))+`\n§${h.brother.name}出京赴任`}}]});}
  const civil=withHouse.filter(c=>stanceOf(c)==='civil');
  if(civil.length){const c=pick(civil),h=houseOf(c);pool.push({title:'科场案',ref:'科场舞弊（明·弘治己未科场案）',por:c,text:`今科会试有舞弊传闻，御史顺藤摸瓜，查到${h.father.name}的门生头上。${cName(c)}一早就跪在殿外，说父亲为官清白。`,choices:[
    {t:'严查到底',f:()=>{c.fam.p=Math.max(5,c.fam.p-12);policyNudge('civil',4);setXin(c,'惶恐','父亲牵涉科场案');story(c,`父亲${h.father.name}因科场案受审。`);return fx(cchg(c,{mood:-10}),chg({people:4,prestige:2}))}},
    {t:`看在${cName(c)}面上，从轻发落`,f:()=>{policyNudge('civil',-5);return fx(cchg(c,{mood:6,aff:4}),chg({people:-3,prestige:-2}))}},
    {t:'交三司会审，查清再说',f:()=>{if(chance(.55)){story(c,`三司会审还了父亲${h.father.name}清白。`);policyNudge('civil',2);return '三司会审，门生确有舞弊，却与'+h.father.name+'无关。'+fx(cchg(c,{mood:8}),chg({people:2}))}
      c.fam.p=Math.max(5,c.fam.p-8);setXin(c,'惶恐','父亲被查出失察之责');return h.father.name+'失察，罚俸一年。'+fx(cchg(c,{mood:-6}),chg({people:2}))}}]});}
  const army=withHouse.filter(c=>stanceOf(c)==='army'&&frontierReportReady(c));
  if(army.length&&chance(.35)){const c=pick(army),h=houseOf(c),place=pick(FRONTIERS),win=chance(.35+E().wu/200+h.brother.merit/300);
    pool.push(win?militaryMeritEvent(c,place,chance(.35)?'father':'brother')
    :frontierReport(c,h.brother,{title:'边关失利',por:c,text:`${place}急报：${h.brother.name}中了埋伏，折损了三百骑。武将们说胜败乃兵家常事，御史却要问罪。${cName(c)}已经两天没吃下饭。`,choices:[
      {t:'依律问责',f:()=>{h.brother.merit=Math.max(0,h.brother.merit-15);policyNudge('army',-2);policyNudge('civil',2);setXin(c,'惶恐','兄长兵败受责');return fx(cchg(c,{mood:-12}),chg({people:1}))}},
      {t:'宽宥，许他戴罪立功',f:()=>{policyNudge('army',4);return fx(cchg(c,{mood:6,aff:5}),chg({prestige:-1}))}}]}));}
  const dw=S.flags.dowager;
  if(dw?.alive){const pref=harem().filter(c=>c.rank<8&&(stanceOf(c)==='dowager'||c.virtue>=70)).sort((a,b)=>b.virtue-a.virtue)[0];
    if(pref)pool.push({title:'慈宁宫',por:pref,text:`${dw.name}召陛下用膳，席间夸${cName(pref)}温良贤淑，又叹皇家子嗣单薄，“哀家看着她就喜欢”。话没说透，意思谁都明白。`,choices:[
      {t:'遵太后之意，多去她宫里',f:()=>{policyNudge('dowager',5);const em=empress();if(em&&em!==pref)cchg(em,{mood:-3});return fx(cchg(pref,{favor:8,mood:8}),chg({prestige:1}))}},
      {t:'“儿臣心里有数。”',f:()=>{policyNudge('dowager',-4);return fx(chg({prestige:1}))}}]});}
  const rivalry=successionRivalryEvent();if(rivalry)pool.push(rivalry);
  const ev=pool.length?pick(pool):null;
  return ev?{...ev,present:ev.present||eventPortraits(ev)}:null;
}
// 离开太久，御案上会积下奏折；下个月末一并呈上
function offlineMemorials(){
  if(!S||!S.savedAt)return;
  const hours=(Date.now()-S.savedAt)/36e5;
  if(hours<1)return;
  const n=Math.min(3,Math.floor(hours/2)+1);
  S.flags.memorials=Math.min(3,(S.flags.memorials||0)+n);
  toast(`陛下离宫约${Math.round(hours)}个时辰，御案上积了${S.flags.memorials}份奏折，月末呈上`);
}
