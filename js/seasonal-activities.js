/* 宫城岁时活动 */
const LANTERN_STOPS=[
  {place:'yh',name:'御花园',spot:[114,29],riddle:'生在水里，撑把绿伞，风来点头。',choices:['芭蕉','荷叶','松枝'],answer:1},
  {place:'wy',name:'文渊阁',spot:[174,13],riddle:'黑身白脚，往纸上一走，便留下一行路。',choices:['墨笔','乌鸦','灯烛'],answer:0},
  {place:'ss',name:'上书房',spot:[165,112],riddle:'有线牵着它才会飞，断了线就找不到家。',choices:['宫灯','燕子','纸鸢'],answer:2}
];
const ALTERNATE_LANTERN_CLUES=[
  {riddle:'身圆像满月，穿着红衣裳，夜里肚子亮。',choices:['橘子','铜镜','灯笼'],answer:2},
  {riddle:'一页一页不会说话，翻开却听得古人讲话。',choices:['木匣','书卷','琴谱'],answer:1},
  {riddle:'生来一方石，滴水便能磨出一池黑。',choices:['砚台','花盆','水壶'],answer:0}
];
const lanternClue=stop=>S.year%2?stop:ALTERNATE_LANTERN_CLUES[LANTERN_STOPS.indexOf(stop)];
const FLOWER_SEEDS={
  peony:{name:'芍药',plot:'sun',hint:'她说这株喜亮，最好能晒到半日太阳。'},
  orchid:{name:'春兰',plot:'shade',hint:'她请你给它找处有树影的地方，正午别直晒。'}
};
const seasonJournal=()=>S.seasonal||{};
const ensureSeasonJournal=()=>S.seasonal ||= {};
const seasonalButton=(label,action)=>`<button class="btn sm jade" onclick="${action}">${label}</button>`;
const activityCard=(title,body)=>`<section class="palace-activity"><h3>${title}</h3>${body}</section>`;
const atSeasonPlace=place=>UI.view==='place'&&UI.sel===place;
const lanternChildren=()=>kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=5).sort((a,b)=>b.lit-a.lit||a.id-b.id).slice(0,2);
const activeLantern=()=>S.month===1&&seasonJournal().lantern?.turn===S.turn?seasonJournal().lantern:null;
function lanternStop(){
  if(S.month!==1)return null;
  const event=activeLantern();
  if(event)return !event.done&&event.ids.every(id=>childInPalace(kidById(id)))?LANTERN_STOPS[event.step]:null;
  return lanternChildren().length===2?LANTERN_STOPS[0]:null;
}
function seasonalMemory(people,type,place,text){
  for(const p of people)if(p.sex)kstory(p,text);else story(p,text);
  NPCMemory.record(S,{type,time:S.turn,location:place,participants:people.map(p=>p.id),outcome:text},people.map(p=>({
    person:p.id,subject:people.find(o=>o!==p)?.id||'emperor',interpretation:text,emotion:.65,impact:65
  })));
}

A.startLantern=function(mode){
  if(S.over||modalOpen||!atSeasonPlace('yh')||lanternStop()?.place!=='yh'||activeLantern()||!['team','race'].includes(mode))return;
  const ids=lanternChildren().map(k=>k.id);
  ensureSeasonJournal().lantern={turn:S.turn,ids,mode,step:0,correct:0};
  save('auto');render();
};
A.guessLantern=function(place,index){
  const event=activeLantern(),stop=lanternStop();
  if(S.over||modalOpen||!event||!stop||stop.place!==place||!atSeasonPlace(place)||!Number.isInteger(index))return;
  const clue=lanternClue(stop);
  if(index<0||index>=clue.choices.length)return;
  const pair=event.ids.map(kidById);
  const right=index===clue.answer;
  event.correct+=Number(right);event.step++;
  if(event.step<LANTERN_STOPS.length){
    toast(`${right?'猜中了':'这盏灯的谜底是'+clue.choices[clue.answer]}。下一盏在${LANTERN_STOPS[event.step].name}。`);
    save('auto');render();return;
  }
  event.done=true;
  const old=seasonJournal().lanternRecord;
  const otherScore=pair[1].lit>=50?3:2;
  const verdict=event.mode==='team'?'两人把解过的谜笺合在一处。':event.correct===otherScore?'两边猜中了同样多的灯谜。':event.correct>otherScore?'今年与你同队的孩子赢了灯谜比试。':'另一位孩子猜中了更多灯谜。';
  const score=`三盏灯猜中 ${event.correct} 盏。`;
  ensureSeasonJournal().lanternRecord={year:S.year,gen:S.gen,score:event.correct,mode:event.mode};
  if(event.mode==='team')relAdd(pair[0],pair[1],6);
  for(const k of pair)k.lit=clamp(k.lit+(event.correct>=2?3:1));
  const text=`${pair.map(k=>k.name).join('与')}同游上元灯会。${score}${verdict}`;
  seasonalMemory(pair,'lantern_walk','宫城',text);log(text,1);save('auto');
  pushEv({title:'上元灯会 · 收灯',por:pair[0],text:`${score}${verdict}${old?`上一次记下的成绩是 ${old.score} 盏。`:''}`,choices:[{t:'把谜笺收好'}]});
};
function lanternPlacePanel(place){
  const stop=lanternStop(),event=activeLantern();
  if(stop?.place!==place)return '';
  if(!event){
    const pair=lanternChildren(),old=seasonJournal().lanternRecord;
    return activityCard('上元寻灯',`<p>${esc(pair.map(k=>k.name).join('与'))}各拿着一张谜笺等你。三盏灯分在御花园、文渊阁和上书房。</p>
      ${old?`<p class="hint">上回猜中 ${old.score} 盏。</p>`:''}<div class="acts">${seasonalButton('与他们一起猜',"A.startLantern('team')")}${seasonalButton('帮一人比试',"A.startLantern('race')")}</div>`);
  }
  const clue=lanternClue(stop);
  return activityCard(`上元寻灯 · 第${cnNum(event.step+1)}盏`,`<p>${clue.riddle}</p><div class="acts">${clue.choices.map((s,i)=>seasonalButton(s,`A.guessLantern('${place}',${i})`)).join('')}</div>`);
}

const flowerDonor=()=>harem().find(c=>inPalace(c)&&c.like==='花草')||harem().find(c=>inPalace(c)&&c.aff>=35);
const flowerSeed=c=>c.like==='花草'?'orchid':'peony';
const springFlower=()=>seasonJournal().flower;
const canPlantFlower=()=>season()===0&&(!springFlower()||springFlower().seen)&&seasonJournal().flowerPlanted!==S.year+'-'+S.gen&&flowerDonor();
A.plantPalaceFlower=function(plot){
  const donor=canPlantFlower();
  if(S.over||modalOpen||!atSeasonPlace('yh')||!donor||!['sun','shade'].includes(plot))return;
  const seed=flowerSeed(donor),state=ensureSeasonJournal();
  state.flower={seed,plot,donor:donor.id,donorName:fullName(donor),planted:S.turn,due:S.turn+13-S.month};
  state.flowerPlanted=S.year+'-'+S.gen;
  const text=`把${fullName(donor)}送来的${FLOWER_SEEDS[seed].name}种在了${plot==='sun'?'向阳花圃':'树影下'}。`;
  seasonalMemory([donor],'garden_plant','御花园',text);log(text);save('auto');render();
};
A.seePalaceFlower=function(){
  const flower=springFlower();
  if(S.over||modalOpen||!atSeasonPlace('yh')||!flower||flower.seen||S.turn<flower.due)return;
  const donor=byId(flower.donor),plant=FLOWER_SEEDS[flower.seed],bloom=flower.plot===plant.plot;
  const text=bloom?`${plant.name}开了，园丁还留着${flower.donorName}亲手写的花签。`:`${plant.name}没有开花，只长出了几片新叶。园丁说换个地方，明年还能再试。`;
  const finish=(care)=>()=>{
    if(flower.seen)return null;
    if(care){flower.plot=plant.plot;flower.due=S.turn+13-S.month;log(`将${plant.name}移栽，留待来年。`);}
    else{flower.seen=true;if(donor?.alive&&!donor.gone){cchg(donor,{mood:bloom?7:2});seasonalMemory([donor],'garden_flower','御花园',text);}log(text,bloom);}
    save('auto');return null;
  };
  pushEv({title:'御花园第一株花',por:donor?.alive&&!donor.gone?donor:undefined,text,choices:bloom?
    [{t:'留下这张花签',f:finish(false)}]:[{t:'移栽，等来年开花',f:finish(true)},{t:'留下花签，改日再种',f:finish(false)}]});
};
function palaceFlowerPanel(){
  const f=springFlower(),donor=canPlantFlower();
  if(f&&!f.seen){
    const plant=FLOWER_SEEDS[f.seed];
    return activityCard('御花园第一株花',`<p>${esc(f.donorName)}送来的${plant.name}已经种下。${S.turn<f.due?'园丁说来年春天再来看。':''}</p>${S.turn>=f.due?seasonalButton('去花圃看看','A.seePalaceFlower()'):''}`);
  }
  if(!donor)return '';
  const plant=FLOWER_SEEDS[flowerSeed(donor)];
  return activityCard('御花园第一株花',`<p>${esc(cName(donor))}送来一株${plant.name}。${plant.hint}</p><div class="acts">${seasonalButton('种在向阳花圃',"A.plantPalaceFlower('sun')")}${seasonalButton('种在树影下',"A.plantPalaceFlower('shade')")}</div>`);
}

function inkstonePair(){
  const present=kidsAlive().filter(childInPalace),young=present.filter(k=>kidAge(k)>=5&&kidAge(k)<12);
  const elder=present.find(k=>kidAge(k)>=12&&!k.passedInkstone);
  return elder&&young.length?{elder,young}:null;
}
A.passPalaceInkstone=function(id){
  const pair=inkstonePair(),young=pair?.young.find(k=>k.id===id);
  if(S.over||modalOpen||!atSeasonPlace('ss')||seasonJournal().inkstone||!young)return;
  const {elder}=pair;
  elder.passedInkstone=true;
  ensureSeasonJournal().inkstone={elder:elder.id,elderName:elder.name,young:young.id,due:S.turn+3};
  relAdd(elder,young,5);seasonalMemory([elder,young],'inkstone_gift','上书房',`${elder.name}把旧砚送给了${young.name}。`);save('auto');render();
};
A.readInkstoneEssay=function(){
  const gift=seasonJournal().inkstone,young=gift&&kidById(gift.young);
  if(S.over||modalOpen||!atSeasonPlace('ss')||!gift||!childInPalace(young)||S.turn<gift.due)return;
  const elder=kidById(gift.elder);
  pushEv({title:'上书房 · 旧砚新文',por:young,text:`${young.name}第一次把一页文章写得工整，特意带着${gift.elderName}送的旧砚来给你看。`,choices:[
    {t:'让孩子把文章也送一份给手足',f:()=>{
      if(ensureSeasonJournal().inkstone!==gift)return null;
      delete S.seasonal.inkstone;
      young.lit=clamp(young.lit+4);
      const pair=elder?.alive?[elder,young]:[young];
      if(elder?.alive)relAdd(elder,young,7);
      const text=`${young.name}用旧砚写成一页文章，将抄本送给${gift.elderName}。`;
      seasonalMemory(pair,'inkstone_essay','上书房',text);log(text,1);save('auto');return null;
    }}
  ]});
};
function inkstonePanel(){
  const gift=seasonJournal().inkstone;
  if(gift){
    const young=kidById(gift.young);
    if(!childInPalace(young))return '';
    return activityCard('上书房的旧砚',`<p>${esc(gift.elderName)}的旧砚现在在${esc(young.name)}的书案上。</p>
      ${S.turn>=gift.due?seasonalButton('看看孩子写的文章','A.readInkstoneEssay()'):'<p class="hint">孩子说想用它写好一页文章。</p>'}`);
  }
  const pair=inkstonePair();
  if(!pair)return '';
  return activityCard('上书房的旧砚',`<p>${esc(pair.elder.name)}想把常用的砚台留给一位弟妹。</p><div class="acts">${pair.young.map(k=>seasonalButton(`传给${esc(k.name)}`,`A.passPalaceInkstone(${k.id})`)).join('')}</div>`);
}
function seasonalTick(){
  const state=S.seasonal;
  if(state?.inkstone&&!childInPalace(kidById(state.inkstone.young)))delete state.inkstone;
}
function seasonalPlacePanel(place){
  return lanternPlacePanel(place)+(place==='yh'?palaceFlowerPanel():place==='ss'?inkstonePanel():'');
}
function seasonalMapNotices(){
  if(S.over)return '';
  const stop=lanternStop(),flower=springFlower(),gift=seasonJournal().inkstone;
  const leads=[
    stop&&`上元寻灯 · ${stop.name}`,
    flower&&!flower.seen&&S.turn>=flower.due&&'御花园 · 花圃有消息',
    gift&&childInPalace(kidById(gift.young))&&S.turn>=gift.due&&'上书房 · 旧砚新文'
  ].filter(Boolean);
  return leads.length?`<p class="season-map-leads">${leads.join('　·　')}</p>`:'';
}
function drawSeasonalMap(){
  const stop=lanternStop();
  if(stop){
    const [x,y]=stop.spot;
    const event=activeLantern(),pair=event?event.ids.map(kidById):lanternChildren();
    pair.forEach((k,i)=>figOnMap(x+(i?5:-5),y+9,k.sex==='m'?'#527987':'#ae6c82',true));
    M(x-1,y,4,4,'#df6547');M(x,y+.5,2,2,'#ffd384');M(x+.5,y+4,1,1.5,'#a6503c');
  }
  const f=springFlower();
  if(f){
    M(129,32,6,3,'#765c45');M(130,31,4,1,'#557359');
    if(S.turn>=f.due&&f.plot===FLOWER_SEEDS[f.seed].plot)M(131,29,2,2,'#e895a7');
  }
}
