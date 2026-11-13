/* ============ 宫城地图 ============ */
const MW=200,MH=128,HY=[46,64,82,100];
const MAPC=document.createElement('canvas');MAPC.width=MW;MAPC.height=MH;MAPC.id='mapc';MAPC.setAttribute('aria-label','宫城地图');
const mg=MAPC.getContext('2d');
const PLACES=[
 {id:'qq',n:'乾清宫',r:[80,68,40,11],d:[100,82],k:'view',v:'home',sc:'court'},
 {id:'kn',n:'坤宁宫',r:[82,50,36,11],d:[100,64],k:'palace',p:'坤宁宫',sc:'harem'},
 {id:'cj',n:'宸极殿',r:[78,86,44,12],d:[100,100],k:'place',sc:'court'},
 {id:'yh',n:'御花园',r:[58,12,84,30],d:[100,46],k:'place',sc:'garden'},
 {id:'sw',n:'神武门',r:[90,2,20,6],d:[100,9],k:'view',v:'out',sc:'city'},
 {id:'wm',n:'午门',r:[90,119,20,7],d:[100,117],k:'view',v:'out',sc:'court'},
 {id:'lg',n:'冷宫',r:[10,16,26,14],d:[23,46],k:'palace',p:'冷宫',sc:'night'},
 {id:'wy',n:'文渊阁',r:[164,16,26,14],d:[177,46],k:'place',sc:'court'},
 {id:'js',n:'敬事房',r:[122,104,28,10],d:[136,100],k:'view',v:'cards',sc:'night'},
 {id:'ss',n:'上书房',r:[156,104,30,10],d:[171,100],k:'place',sc:'court'},
 {id:'cn',n:'慈宁宫',r:[14,104,30,10],d:[29,100],k:'place',sc:'harem'}];
[[['景仁宫','承乾宫','钟粹宫','延禧宫','永和宫','景阳宫'],[124,158]],[['永寿宫','翊坤宫','储秀宫','启祥宫','长春宫','咸福宫'],[14,48]]].forEach(([names,xs])=>names.forEach((n,i)=>{const x=xs[i%2],y=[50,68,86][Math.floor(i/2)];PLACES.push({id:'p'+n,n,r:[x,y,26,12],d:[x+13,y+14],k:'palace',p:n,sc:'harem'})}));
const emp={x:100,y:82,path:[],arrive:null,trail:[]};
const NPC=new Map();let hoverP=null,mapParts=[];
function resetMapPosition({x,y}){
  NPC.clear();
  Object.assign(emp,{x,y,path:[],arrive:null,trail:[]});
}
function nearestH(y){return HY.reduce((a,b)=>Math.abs(b-y)<Math.abs(a-y)?b:a)}
function planPath(sx,sy,tx,ty){const pts=[];let x=sx,y=sy;
  if(!HY.includes(y)){const ny=(x===100&&(y<46||y>100))?(y<46?46:100):nearestH(y);pts.push([x,ny]);y=ny}
  if(!HY.includes(ty)){const ny=ty<46?46:100;if(y!==ny){const sv=Math.abs(x-44)<Math.abs(x-154)?44:154;pts.push([sv,y],[sv,ny]);y=ny}pts.push([100,y],[100,ty]);return pts}
  if(ty===y){pts.push([tx,ty]);return pts}
  const vx=[44,154].sort((a,b)=>(Math.abs(x-a)+Math.abs(a-tx))-(Math.abs(x-b)+Math.abs(b-tx)))[0];
  pts.push([vx,y],[vx,ty],[tx,ty]);return pts}
function stepTo(n,sp){const [tx,ty]=n.path[0],dx=tx-n.x,dy=ty-n.y,d=Math.hypot(dx,dy);if(d<=sp){n.x=tx;n.y=ty;n.path.shift();return !n.path.length}n.x+=dx/d*sp;n.y+=dy/d*sp;return false}
function npcHome(c){const pl=PLACES.find(p=>p.k==='palace'&&p.p===c.palace);return pl?pl.d:[100,64]}
function npcSync(){const ids=new Set();alive().filter(c=>!c.maid).forEach(c=>{ids.add(c.id);if(!NPC.has(c.id)){const h=c.cold?[23,46]:npcHome(c);NPC.set(c.id,{x:h[0],y:h[1],path:[],wait:ri(5,60),ox:ri(-3,3),where:'home'})}});[...NPC.keys()].forEach(id=>{if(!ids.has(id))NPC.delete(id)})}
function npcRoutine(c,roll) {
  const home=npcHome(c);
  const hobby=consortHobby(c);
  const gardenBias=['活泼','淡泊'].includes(c.trait)||c.t2==='爱猫'||CONSORT_HOBBIES[hobby].place==='御花园';
  const studyBias=['才女','好学'].includes(c.trait)||c.t2==='好读史'||hobby==='读书';
  const friends=harem().filter(o=>o!==c&&relGet(c,o)>=25)
    .sort((a,b)=>relGet(c,b)-relGet(c,a)+
      3*(consortCompatibility(c,b)-consortCompatibility(c,a))+
      8*(NPCMemory.influence(S,c.id,b.id)-NPCMemory.influence(S,c.id,a.id)));
  if (c.preg>=2||c.mood<30||roll<.32) return {where:'home',dest:home};
  if (roll<(studyBias?.54:gardenBias?.76:.54)) return {where:'garden',dest:[100,46]};
  if (studyBias&&roll<.8) return {where:'library',dest:[177,46]};
  if (friends.length && (roll<.9 || ['温婉','好客'].includes(c.trait))) {
    const guest=friends[0];
    return {where:'visit',dest:npcHome(guest),guest:guest.id};
  }
  return {where:'kn',dest:[100,64]};
}

function npcStep(){npcSync();for(const [id,n] of NPC){const c=byId(id);if(!c)continue;
  if(c.cold){n.x=23;n.y=46;n.path=[];n.where='cold';continue}
  if(n.path.length){stepTo(n,1.2);continue}
  if(n.wait>0){n.wait--;continue}
  const {where,dest,guest}=npcRoutine(c,R());
  n.path=planPath(Math.round(n.x),Math.round(n.y),dest[0],dest[1]);
  if(where==='garden')n.path.push([ri(64,136),ri(16,38)]);
  n.where=where;n.guest=guest;n.wait=ri(60,220);
}}

function npcRoutineText(c,n) {
  if(!n)return '在宫道上停下脚步，向你行了一礼';
  if(n.where==='library')return n.path.length?'抱着旧抄本，正往文渊阁去':'在文渊阁门前等宫人取来借阅的书';
  if(n.where==='visit'){
    const friend=byId(n.guest);
    if(inPalace(friend)){
      const hobby=sharedConsortHobby(c,friend);
      return n.path.length?`正要去探望${cName(friend)}${hobby?`，约了${CONSORT_HOBBIES[hobby].activity}`:''}`:`刚从${cName(friend)}那里出来，两人还约好改日再坐坐`;
    }
  }
  if(n.where==='garden')return n.path.length?'沿长街往御花园走':c.like==='花草'?'在亭边辨认刚开的花':'在花亭边慢慢散步';
  if(n.where==='kn')return n.path.length?'正往坤宁宫请安':'刚从坤宁宫请安出来';
  return c.preg>=2?'正在本宫门前透气，身边的宫人替她拿着软垫':
    c.mood<30?'在宫门外独坐了许久，见你来才起身':'在宫门前和掌事姑姑说着今日的琐事';
}

const INITIATIVE_SPOTS={yh:[91,35],wy:[181,48],ss:[169,103]};
function initiativeMapScenes() {
  const occupied=new Set();
  const family=gardenFamilyMoment();
  if(family){occupied.add(family.child);occupied.add(family.mother)}
  const count={};
  const scenes=[];
  for(const person of initiativePeople()){
    const move=currentInitiative(person)||activeInitiativeEcho(person);
    const scene=move&&initiativeParticipants(person,move);
    const place=initiativePlace(scene?.rule,person,move);
    const venue=PLACES.find(p=>p.id===place);
    const spot=INITIATIVE_SPOTS[place]||venue?.d;
    if(!scene||!spot||occupied.has(person.id))continue;
    const visitors=[person];
    if(scene.target&&!occupied.has(scene.target.id))visitors.push(scene.target);
    visitors.forEach(p=>occupied.add(p.id));
    const index=count[place]||0;
    count[place]=index+1;
    scenes.push({person,visitors,x:spot[0]+index*10,y:spot[1]});
  }
  return scenes;
}

function goPlace(p){AU.sfx('click');if(Math.round(emp.x)===p.d[0]&&Math.round(emp.y)===p.d[1]&&!emp.path.length){arrive(p);return}
  emp.path=planPath(Math.round(emp.x),Math.round(emp.y),p.d[0],p.d[1]);emp.arrive=()=>arrive(p)}
// 宫名按钮是直达：点一下就到，不必等皇帝慢慢走过去（走路仍可点地图上的宫殿本身）。
function goDirect(p){emp.path=[];emp.arrive=null;emp.x=p.d[0];emp.y=p.d[1];arrive(p)}
function arrive(p){S.pos={x:p.d[0],y:p.d[1]};setScene(p.sc);AU.sfx('page');
  if(p.k==='view')UI.view=p.v;else if(p.k==='palace'){UI.view='palace';UI.sel=p.p;preparePalaceLife(p.p)}else{UI.view='place';UI.sel=p.id}
  render()}
function nearestPlace(){const p=PLACES.find(p=>S.pos&&p.d[0]===S.pos.x&&p.d[1]===S.pos.y);return p?p.n+'门前':'宫道上'}
function mapTick(){if(!S||UI.view!=='map'||modalOpen)return;
  if(emp.path.length){const done=stepTo(emp,3.5);emp.trail.push([emp.x,emp.y]);if(emp.trail.length>5)emp.trail.shift();
    if(done){S.pos={x:Math.round(emp.x),y:Math.round(emp.y)};if(emp.arrive){const f=emp.arrive;emp.arrive=null;f()}}}
  npcStep();drawMap()}
const MAP_SCALE=2;
MAPC.width=MW*MAP_SCALE;MAPC.height=MH*MAP_SCALE;
mg.setTransform(MAP_SCALE,0,0,MAP_SCALE,0,0);
mg.imageSmoothingEnabled=false;
const terrainCanvas=document.createElement('canvas');
terrainCanvas.width=MAPC.width;terrainCanvas.height=MAPC.height;
const terrainInk=terrainCanvas.getContext('2d');
terrainInk.setTransform(MAP_SCALE,0,0,MAP_SCALE,0,0);
terrainInk.imageSmoothingEnabled=false;
const buildingAtlas=document.createElement('img');
let terrainSeason=-1;
buildingAtlas.addEventListener('load',()=>{terrainSeason=-1});
buildingAtlas.src='./palace-buildings-b.webp';
let mapInk=mg;
function M(x,y,w,h,c){mapInk.fillStyle=c;mapInk.fillRect(Math.round(x*MAP_SCALE)/MAP_SCALE,Math.round(y*MAP_SCALE)/MAP_SCALE,w,h)}

function mapPaving(x,y,w,h,palette){
  const [edge,shadow,stone,joint,light]=palette;
  M(x,y,w,h,edge);M(x+.5,y+.5,w-1,h-1,stone);M(x+1,y+h-1,w-2,.5,shadow);
  for(let row=0;row<h-2;row+=2.5){
    const line=y+1+row;
    M(x+1,line,w-2,.5,joint);
    for(let col=2+(Math.round(row/2.5)%2)*3;col<w-1;col+=6)M(x+col,line,.5,Math.min(2,h-row-2),joint);
  }
  M(x+1,y+.5,w-2,.5,light);
}

function mapTree(x,y,s,size=1){
  const [dark,leaf,glow]=[
    ['#4e6150','#64836c','#e0a6ac'],['#405c4d','#577760','#9db477'],
    ['#8b5740','#ab794e','#d5a66b'],['#53645f','#788681','#e8e3d6']
  ][s];
  M(x-2*size,y-1,5*size,2,'#342e2844');M(x,y-3,.75,4,'#634330');
  M(x-2.5*size,y-5,5*size,3,dark);M(x-1.5*size,y-6.5,3*size,4,leaf);
  M(x-2*size,y-5.5,2.5*size,2,leaf);M(x-size,y-6,1.5*size,1,glow);
  M(x+.5*size,y-4.5,1.5*size,.75,glow);
}

function drawBuildingArt(ctx,cell,x,y,w,h,filter='none'){
  if(!buildingAtlas.naturalWidth)return false;
  ctx.imageSmoothingEnabled=false;
  ctx.filter=filter;
  ctx.drawImage(buildingAtlas,cell%3*128,Math.floor(cell/3)*80,128,80,x,y,w,h);
  ctx.filter='none';
  return true;
}

function mapBuilding(cell,x,y,w,h,s,cold=false){
  if(drawBuildingArt(mapInk,cell,x,y,w,h,cold?'grayscale(.8) brightness(.85)':'none')){
    if(s===3){
      M(x+w*.26,y+h*.26,w*.47,.5,'#f4ede3c8');
      M(x+w*.14,y+h*.43,w*.7,.5,'#ebe8e2b0');
    }
    return;
  }
  const red=cold?'#6f5a55':'#914a3c',roof=cell===2||cell===5?'#486755':'#a37a40';
  M(x+2,y+h*.44,w-4,h*.5,red);M(x+3,y+h-1,w-6,1,'#a89b83');
  M(x,y+h*.32,w,h*.16,'#4b3528');M(x+2,y+h*.16,w-4,h*.18,roof);M(x+5,y+h*.08,w-10,h*.12,roof);
  for(let i=4;i<w-4;i+=3)M(x+i,y+h*.49,.75,h*.32,'#d48963');
}

function drawMapTerrain(s){
  if(terrainSeason===s)return;
  terrainSeason=s;
  mapInk=terrainInk;
  const winter=s===3;
  const paving=winter?['#a89f90','#b2a99a','#e0d8c9','#c9beb0','#f8f1e3']:
    ['#97826d','#ab967b','#d9c6a7','#c8b492','#f0ddbf'];
  M(0,0,MW,MH,winter?'#c5c3b4':'#bba98c');
  M(3,2,194,124,winter?'#e1dacf':'#d5c2a1');
  // Rows of warm stone courts are framed by the cinnabar perimeter.
  for(let y=8;y<MH-4;y+=4)for(let x=5+(y%8?2:0);x<MW-4;x+=8)M(x,y,1.5,.5,winter?'#cac1b2':'#beaa88');
  M(2,0,196,2.5,'#563329');M(2,2.5,196,1,'#b9774d');
  for(const x of [2,196]){
    M(x,3,2,121,'#6e3b32');M(x+1,4,.5,119,'#c68461');
    for(let y=8;y<124;y+=9)M(x-1,y,4,2,'#92503d');
  }
  M(2,124,196,2.5,'#6e3b32');M(2,124,196,.5,'#cf8c61');
  for(const y of HY)mapPaving(6,y-3,188,6.5,paving);
  for(const x of [44,100,154])mapPaving(x-2.5,x===100?4:43,5.5,x===100?118:60,paving);
  mapPaving(77,39,46,7,paving);
  mapPaving(76,113,48,6,paving);

  // Garden: shaded trees, koi pond, stepping stones and a waterside pavilion.
  M(58,12,84,30,'#71564a');
  M(59,13,82,28,winter?'#bcc3b4':['#81936d','#687f5f','#a18a61'][s]);
  M(60,14,80,1,'#c4986f');
  for(let i=0;i<28;i++){
    const x=61+(i*23)%78,y=15+(i*17)%23;
    M(x,y,1.5,.5,i%3===0?'#e8c6a166':'#42594345');
  }
  for(let y=-7;y<=7;y++)for(let x=-16;x<=16;x++){
    const d=(x/16)**2+(y/7)**2;
    if(d>1)continue;
    const color=d>.88?'#927d61':d>.72?'#87a8a0':y<0?'#588b8b':'#416f78';
    M(79+x,27+y,1,1,color);
    if(d<.7&&(x+3*y)%11===0)M(79+x,27+y,2,.5,'#a4c2af');
  }
  for(const [x,y] of [[73,26],[84,29],[88,24]]){
    M(x,y,1.5,.5,'#f0b97e');M(x+.5,y+.5,.5,.5,'#db875f');
  }
  mapPaving(96,28,5,13,paving);
  mapPaving(100,28,22,3.5,paving);
  mapBuilding(5,114,13,22,15,s);
  [[64,19],[68,38],[92,18],[132,36],[136,21],[107,38],[63,29],[126,37]].forEach(([x,y],i)=>mapTree(x,y,s,i%3===0?1.2:1));
  for(const x of [10,49,149,190])for(const y of [18,28,36,109,116])mapTree(x,y,s,.75);
  for(const [x,y] of [[73,52],[126,52],[76,70],[124,70],[73,90],[126,90]])mapTree(x,y,s,.7);

  for(const p of PLACES){
    if(p.id==='yh')continue;
    const [x,y,w,h]=p.r;
    const cell=p.id==='cj'?0:p.id==='qq'||p.id==='kn'||p.id==='cn'?1:
      ['wy','ss'].includes(p.id)?2:['sw','wm'].includes(p.id)?4:3;
    if(cell!==4){
      M(x-.5,y+.5,w+1,h+1,'#60493644');
      mapPaving(x,y+h-2,w,3,paving);
    }
    mapBuilding(cell,x,y-1,w,h+2,s,p.id==='lg');
  }
  mapInk=mg;
}

function figOnMap(x,y,color,small){
  const top=y-(small?5:7);
  M(x-1,top,3,2,'#1d1520');M(x-1,top+2,3,1,'#f2cfb2');
  M(x-1,top+3,3,y-top-3,color);M(x-1,y,1,1,INK);M(x+1,y,1,1,INK);
}
function drawMap(){const s=season(),family=gardenFamilyMoment(),scenes=initiativeMapScenes();
  const busy=new Set(scenes.flatMap(scene=>scene.visitors.map(p=>p.id)));
  drawMapTerrain(s);
  mg.drawImage(terrainCanvas,0,0,MW,MH);
  const occupied=new Set(harem().filter(c=>c.preg>=2).map(c=>c.palace));
  for(const p of PLACES){
    const [x,y,w,h]=p.r;
    if(p.k==='palace'&&occupied.has(p.p))M(x+w-3,y+1,2,2,'#f7a4b3');
    if(S.cands?.length&&p.p==='储秀宫')M(x+1,y+1,2,2,GOLD);
    if(hoverP===p){
      mg.strokeStyle='#ffe2a8';mg.lineWidth=.65;
      mg.strokeRect(x-.5,y-.5,w+1,h+1);
    }
  }
  // 妃嫔
  for(const [id,n] of NPC){const c=byId(id);if(!c||family?.mother===id||busy.has(id))continue;const x=Math.round(n.x+n.ox),y=Math.round(n.y);
    if(n.where==='home'&&!n.path.length&&n.wait>0&&(frame+id)%40<28)continue;
    M(x-1,y-6,3,2,'#1d1520');M(x-1,y-4,3,1,'#f2cfb2');M(x-1,y-3,3,3,c.cold?'#8a8a8a':robeOf(c));M(x-1,y,1,1,INK);M(x+1,y,1,1,INK);
    if(c.preg>=2)M(x,y-8,1,1,'#f08aa8');if(c.rank>=5)M(x+1,y-7,1,1,GOLD)}
  if(family){
    const x=GARDEN_FAMILY_SPOT[0], y=GARDEN_FAMILY_SPOT[1], child=kidById(family.child);
    figOnMap(x-4,y,robeOf(byId(family.mother)),false);
    figOnMap(x+4,y,child.sex==='m'?'#527987':'#ae6c82',true);
  }
  for(const scene of scenes){
    scene.visitors.forEach((p,i)=>figOnMap(scene.x+i*5,scene.y,p.sex?(p.sex==='m'?'#527987':'#ae6c82'):robeOf(p),!!p.sex));
    M(scene.x,scene.y-10,2,2,JADE);
  }
  drawSeasonalMap();
  // 皇帝与太监
  const tr=emp.trail[0]||[emp.x,emp.y];const ax=Math.round(tr[0])-4,ay=Math.round(tr[1]);
  drawAttendant(M,ax,ay,emp.path.length?(frame%2?1:-1):0);
  const ex=Math.round(emp.x),ey=Math.round(emp.y),bob=emp.path.length&&frame%2?1:0;
  M(ex-2,ey-7-bob,5,1,'#1b1b24');M(ex-1,ey-8-bob,3,1,'#1b1b24');M(ex-1,ey-6-bob,3,1,'#f2cfb2');M(ex-1,ey-5-bob,3,4,'#e8b52c');M(ex,ey-4-bob,1,1,'#c0392b');M(ex-1,ey-1,1,1,INK);M(ex+1,ey-1,1,1,INK);
  // 四季
  const want=[18,0,14,30][s];if(mapParts.length<want&&chance(.5))mapParts.push({x:R()*MW,y:-2,vx:s===3?.1:.4,vy:s===3?.35:.3,t:R()*6,c:s===0?'#f7b6c8':s===2?pick(['#e0893a','#c9562a']):'#ffffff'});
  mapParts.forEach(p=>{p.t+=.2;p.x+=p.vx+Math.sin(p.t)*.3;p.y+=p.vy;M(p.x,p.y,1,1,p.c)});mapParts=mapParts.filter(p=>p.y<MH&&p.x<MW);
}
function meetConsort(c){if(!c||!c.alive||c.gone)return;setScene('harem');
  const t=npcRoutineText(c,NPC.get(c.id));
  pushEv({title:'宫道偶遇',por:c,text:`你在宫道上遇见了${cName(c)}，她${t}。`,choices:[
    {t:'闲话家常（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{A.chat(c.id);return null}},
    {t:'今夜召她侍寝（精力-1）',cond:()=>E().energy>0&&!c.preg,why:c.preg?'她有孕在身':'精力不足',f:()=>{nightWith(c);return null}},
    {t:'赏她一支簪子（国库-10万两）',f:()=>fx(chg({treasury:-10}),cchg(c,{mood:10,aff:3}))},
    {t:'点头作别'}]})}
MAPC.addEventListener('click',e=>{if(!S)return;const r=MAPC.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*MW,my=(e.clientY-r.top)/r.height*MH;
  if(mapGuideInspect){const place=PLACES.find(p=>mx>=p.r[0]&&mx<=p.r[0]+p.r[2]&&my>=p.r[1]&&my<=p.r[1]+p.r[3]);if(place)showMapGuide(place);return;}
  const family=gardenFamilyMoment();
  if(family&&Math.abs(mx-GARDEN_FAMILY_SPOT[0])<9&&Math.abs(my-GARDEN_FAMILY_SPOT[1]+3)<5){
    goPlace(gardenPlace());return;
  }
  const scenes=initiativeMapScenes();
  const activity=scenes.find(scene=>Math.abs(mx-scene.x-2)<6&&Math.abs(my-scene.y+4)<7);
  if(activity){A.seeInitiative(activity.person.id,!!activity.person.sex);return}
  const busy=new Set(scenes.flatMap(scene=>scene.visitors.map(p=>p.id)));
  let best=null,bd=6;for(const [id,n] of NPC){if(family?.mother===id||busy.has(id))continue;const d=Math.hypot(n.x+n.ox-mx,n.y-3-my);if(d<bd){bd=d;best=[id,n]}}
  if(best){const c=byId(best[0]),n=best[1];if(!c)return;n.path=[];n.wait=400;let tx=Math.round(n.x),ty=Math.round(n.y);
    if(!HY.includes(ty)){if(ty<46){tx=100;ty=46}else ty=nearestH(ty)}
    AU.sfx('click');emp.path=planPath(Math.round(emp.x),Math.round(emp.y),tx,ty);
    emp.arrive=()=>{n.wait=ri(30,80);if(c.cold){UI.view='palace';UI.sel='冷宫';setScene('night');render();return}meetConsort(c)};
    if(!emp.path.length)emp.arrive();return}
  const p=PLACES.find(p=>mx>=p.r[0]&&mx<=p.r[0]+p.r[2]&&my>=p.r[1]&&my<=p.r[1]+p.r[3]);if(p)goPlace(p)});
MAPC.addEventListener('mousemove',e=>{const r=MAPC.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*MW,my=(e.clientY-r.top)/r.height*MH;
  const p=PLACES.find(p=>mx>=p.r[0]&&mx<=p.r[0]+p.r[2]&&my>=p.r[1]&&my<=p.r[1]+p.r[3]);
  if(p)mapGuideEnter(p);else mapGuideLeave()});
MAPC.addEventListener('mouseleave',()=>mapGuideLeave());
setInterval(mapTick,50);
// Derive leads from live activities so expired or unavailable characters leave the map.
function mapActivityLeads(){
  if(!S||S.over)return [];
  const leads=palaceRomanceLeads(),meeting=showGardenReunion(),stop=lanternStop(),work=duanwuWork();
  const school=schoolScene();if(school&&!school.scene.result)leads.push({place:'ss',title:SCHOOL_TITLES[school.scene.kind],text:school.cast.map(k=>k.name).join('与')+'正在窗下说话。',cast:school.cast});
  if(meeting)leads.push({place:'yh',title:'御花园赴约',button:'去御花园赴约',text:meeting.reunion.text,cast:[meeting.first,meeting.second],expires:true});
  if(stop)leads.push({place:stop.place,title:'上元寻灯 · '+stop.name,text:'正月灯会，带孩子走一走，猜一回灯谜。',cast:(activeLantern()?.ids||lanternChildren().map(k=>k.id)).map(kidById),expires:!!activeLantern()});
  if(work?.stage==='review')leads.push({place:'yh',title:'查验端午筹备',text:'宴席与节礼已备好，两位主事等你来核对。',cast:duanwuOfficers(work)});
  else if(work?.stage==='finished'&&work.year===S.year&&S.month===5&&!work.held)
    leads.push({place:'yh',title:'安排端午宴',text:'筹备已查验，可以安排本年的端午宴。',cast:duanwuOfficers(work)});
  else if(S.month===4&&work?.stage!=='preparing'&&harem().filter(canManageFeast).length>=2)
    leads.push({place:'yh',title:'分派端午宫务',text:'选两位妃嫔分管宴席与节礼，下月查验。',cast:[]});
  const flower=springFlower(),gift=seasonJournal().inkstone;
  if(flower&&!flower.seen&&S.turn>=flower.due)leads.push({place:'yh',title:'花圃有消息',text:'去年栽下的花苗有了变化，去花圃看看。',cast:[]});
  if(gift&&childInPalace(kidById(gift.young))&&S.turn>=gift.due)leads.push({place:'ss',title:'旧砚新文',text:'孩子已写好新作，等你来看。',cast:[kidById(gift.young)]});
  for(const person of initiativePeople()){
    for(const move of [currentInitiative(person),activeInitiativeEcho(person)]){
      const scene=move&&initiativeParticipants(person,move);
      if(!scene||move.response)continue;
      const place=initiativePlace(scene.rule,person,move);
      leads.push({place:PLACES.some(p=>p.id===place)?place:null,person,title:scene.rule.title+(move.delivered?' · 后续':''),text:move.text,cast:[person,scene.target].filter(Boolean)});
    }
  }
  const moment=gardenFamilyMoment();
  if(moment&&!meeting)leads.push({place:'yh',title:'母子相聚',text:moment.text,cast:[kidById(moment.child),byId(moment.mother)]});
  return leads;
}
function mapLeadAction(lead){return lead.place?`A.visitMapActivity('${lead.place}')`:`A.go('${lead.person.sex?'kid':'consort'}',${lead.person.id})`;}
function mapLeadPlace(lead){return lead.place?PLACES.find(p=>p.id===lead.place).n:porName(lead.person);}
function mapActivityPanel(leads){
  if(!leads.length)return '<p class="hint map-quiet">宫中暂静，可以到各宫走走。</p>';
  const card=lead=>`<article class="map-activity-card"><div><strong>${esc(lead.title)}</strong><small>${lead.expires?'本月邀约':'本月动向'}</small><p>${esc(lead.text)}</p></div>
    ${activityPortraits(...lead.cast)}<button class="btn sm jade" onclick="${mapLeadAction(lead)}">${esc(lead.button||mapLeadPlace(lead)+' · '+lead.title)} →</button></article>`;
  return `<section class="map-activity-panel" aria-label="本月值得一看">${leads.slice(0,2).map(card).join('')}</section>${leads.length>2?`<div class="initiative-notices">${leads.slice(2).map(lead=>`<button class="btn sm" onclick="${mapLeadAction(lead)}">${esc(mapLeadPlace(lead))} · ${esc(lead.title)}</button>`).join('')}</div>`:''}`;
}
A.visitMapActivity=function(place){
  if(!S||S.over||modalOpen)return;
  const destination=PLACES.find(p=>p.id===place);
  if(destination)goDirect(destination);
};
A.finishMonth=function(){
  if(!S||S.over||modalOpen)return;
  if(pendingDelivery()){A.endMonth();return;}
  const invitations=mapActivityLeads().filter(lead=>lead.expires);
  const floodDue=floodReliefDue();
  if(S.turn>0&&!invitations.length&&!floodDue){A.endMonth();return;}
  const nextMonth=MONTHS[S.month%12];
  const detail=invitations.length?'换月后，这些邀约就散了：'+invitations.map(lead=>lead.title).join('、')+'。':'';
  const floodDetail=floodDue?'\n本月尚未批复赈灾回奏。直接换月会停止续拨，民心 −3。':'';
  const remaining=E().energy>0?`本月还可用 ${E().energy} 点精力。\n`:'';
  pushEv({title:invitations.length?'尚有本月邀约':`进入${nextMonth}？`,scene:'month-review',
    cast:invitations.flatMap(lead=>lead.cast),text:`${remaining}进入${nextMonth}后会结算本月收支，补充精力，并可能发生新的宫中事件。${detail?'\n'+detail:''}${floodDetail}`,choices:[
    ...invitations.map(lead=>({t:'先去'+lead.title,f:()=>{goDirect(PLACES.find(p=>p.id===lead.place));return null;}})),
    {t:'留在本月'},
    {t:invitations.length?`略过邀约，进入${nextMonth}`:`进入${nextMonth}`,primary:true,
      f:()=>{setTimeout(()=>A.endMonth(),0);return null;}}
  ]});
  $('#mbox .mch button:nth-last-child(2)')?.focus?.();
};
function mountMap(){const w=$('#mapwrap');if(!w)return;w.appendChild(MAPC);mountMapGuide(w);
  const leads=mapActivityLeads();
  PLACES.forEach(p=>{const b=document.createElement('button');b.className='mlab'+(['qq','kn','cj','yh','sw','wm'].includes(p.id)?' landmark':'');b.textContent=p.n;const here=leads.filter(lead=>lead.place===p.id);if(here.length){b.className+=' has-activity';b.setAttribute('data-activity',String(here.length));b.setAttribute('aria-label',p.n+'，'+here.map(lead=>lead.title).join('、'));}if(lanternStop()?.place===p.id){b.className+=' seasonal-lit';}const [x,y,ww,h]=p.r;
    b.style.left=((x+ww/2)/MW*100)+'%';b.style.top=((y+(p.id==='yh'?h/2:h-2))/MH*100)+'%';
    bindMapGuide(b,p);w.appendChild(b)})}
const backBtn=`<button class="btn sm" onclick="A.go('map')">◂ 返回宫城</button>`;
function viewMap(){
  const leads=mapActivityLeads();
  const first=leads.find(lead=>lead.expires)||leads[0];
  const done=S.flags.monthlyCourt?.turn===S.turn&&S.flags.monthlyCourt.gen===S.gen&&S.flags.monthlyCourt.done;
  const pending=S.flags.impeachmentReview;
  const reviewReady=!done&&((pending?.turn===S.turn&&pending.gen===S.gen&&impeachmentSubject(pending.file?.person))||
    (S.flags.monthlyCourt?.turn===S.turn&&S.flags.monthlyCourt.gen===S.gen&&S.flags.monthlyCourt.review&&impeachmentSubject(S.flags.monthlyCourt.person)));
  const report=reviewReady?'查账回奏':!done&&floodReliefDue()?'赈灾回奏':'';
  const host=S.turn===0&&done&&empress();
  return `<section class="map-play" aria-label="宫城地图">
    <header class="map-location"><h2>宫城</h2><span class="hint">${esc(nearestPlace())}</span></header>
    <div class="map-first-month">
      <span>${done?'奏折已批复':report?report+'待阅':'奏折待批'} · 余 ${E().energy} 点精力</span>
      ${!done?`<button class="btn sm" onclick="A.court()">查看${report||'本月奏折'}</button>`:''}
      ${host?`<button class="btn sm" onclick="A.visitMapActivity('kn')">去坤宁宫见${esc(fullName(host))}</button>`:''}
      ${S.flags.lastMonthReview?'<button class="btn sm" onclick="A.go(\'log\')">上月回顾</button>':''}
    </div>
    <div id="mapwrap"></div>
    <div id="map-guide-preview" aria-live="polite"></div>
    <div class="map-dock">
      ${first?`<button class="btn map-lead" onclick="${mapLeadAction(first)}">${esc(mapLeadPlace(first))} · ${esc(first.title)} <span aria-hidden="true">›</span></button>`:''}
      <button id="map-guide-toggle" class="btn sm" aria-pressed="false" onclick="A.toggleMapGuide()">地点用途与玩法</button>
      <details class="map-brief" ${UI.mapBriefOpen?'open':''} ontoggle="UI.mapBriefOpen=this.open">
        <summary>宫中动向</summary>
        <div class="map-brief-content">
          ${mourningNotice()}${mapActivityPanel(leads)}${princessMapNotice()}${birthdayBanquetButtons()}${proudDemandNotice()}
          ${floodDikeReady()?'<p class="hint">黄河险堤已加固。日后一次直接赈济可少花 '+FLOOD_DIKE_SAVING+' 万两。</p>':''}
          <p class="hint">${grainReserveReady()?`常平仓有${grainReserveLabel()}备荒粮。遇到蝗灾月奏时可发放，免耗精力。`:'常平仓暂无备荒粮，可以向粮商买半批。'}</p>
          ${autumnGrainOrderStatus()==='due'?'<p class="hint">预订的半批秋粮已到，须在本月领走。</p>':''}
          <button class="btn sm" onclick="A.grainReserve()">查看常平仓</button>
          <p class="map-legend">点宫殿名直达 · 点宫殿步行前往 · 点小人偶遇 · 绿点：有人活动 · 粉点：有孕 · 金点：选秀</p>
        </div>
      </details>
    </div>
  </section>`;
}
function viewPalace(){const name=UI.sel,res=name==='冷宫'?alive().filter(c=>c.cold):harem().filter(c=>c.palace===name);
  const extra=name==='储秀宫'&&S.cands.length?`<div class="acts"><button class="btn gold" onclick="A.go('xx')">秀女正在候选（${S.cands.length}人）</button></div>`:'';
  const note=name==='冷宫'?'荒草萋萋，宫门深锁。':name==='坤宁宫'?'中宫所居，凤仪万方。':(PALACE_NOTES[name]||'宫门半掩，廊下挂着鸟笼。');
  const count=res.length?(name==='冷宫'?`<p class="hint">冷宫里关着 ${res.length} 人。</p>`:`<p class="hint">住着 ${res.length} 位妃嫔。</p>`):'';
  return `<h2>${esc(name)}${backBtn}</h2><p class="hint">${note}</p>${extra}${palaceRomanceAt(initiativePlace(null,null,{place:'p'+name}))}${palaceLifePanel(name)}${initiativesAt(initiativePlace(null,null,{place:'p'+name}))}${count}${res.length?`<div class="grid">${res.map(consortCard).join('')}</div>`:'<p class="hint">此处暂无人居住。</p>'}`}
function viewPlace(){const id=UI.sel;
  if(id==='cj')return `<h2>宸极殿${backBtn}</h2><p>文武百官已在丹墀下候着。</p><div class="acts"><button class="btn gold" onclick="A.court()">查看本月奏折</button></div>`;
  if(id==='yh'){const here=[...NPC].filter(([i,n])=>n.where==='garden'&&!n.path.length).map(([i])=>byId(i)).filter(c=>inPalace(c)&&c.id!==gardenFamilyMoment()?.mother&&
      !initiativeMapScenes().some(scene=>scene.visitors.includes(c))&&!palaceRomanceLeads().some(lead=>lead.place==='yh'&&lead.cast.includes(c)));
    return `<h2>御花园${backBtn}</h2><p>${['桃花开得正好，蜂蝶纷飞。','荷风送香，蝉鸣阵阵。','丹桂飘香，满地金黄。','红梅映雪，暗香浮动。'][season()]}</p><div class="acts"><button class="btn" onclick="A.out('garden')">园中漫步<small>精力-1</small></button>${banquetReady()?`<button class="btn gold" onclick="A.openBanquet()">筹办小宴</button>`:'<span class="hint">小宴每三个月可办一次</span>'}</div>${birthdayBanquetButtons()}${gardenFamilyNotice()}${palaceRomanceAt('yh')}${seasonalPlacePanel('yh')}${duanwuPanel()}${initiativesAt('yh')}${here.length?`<h3>园中的人</h3><div class="grid">${here.map(c=>`<button class="card" onclick="meetConsort(byId(${c.id}))">${porImg(c,48)}<div class="grow"><div class="nm">${esc(cName(c))}</div><div>${esc(npcRoutineText(c,NPC.get(c.id)))}</div></div></button>`).join('')}</div>`:'<p class="hint">园中没有其他闲游的人。</p>'}`}
  if(id==='ss'||id==='wy'){
    const school=id==='ss';
    return `<h2>${school?'上书房':'文渊阁'}${backBtn}</h2>
      ${school?schoolPanel():''}${palaceRomanceAt(id)}${seasonalPlacePanel(id)}
      ${initiativesAt(id)||(school?'':'<p class="hint">此刻只有当值宫人在这里。</p>')}
      <button class="btn" onclick="A.go('${school?'kids':'log'}')">${school?'查看皇嗣':'翻阅起居注'}</button>`;
  }
  if(id==='cn'){const d=S.flags.dowager;return `<h2>慈宁宫${backBtn}</h2>${d&&d.alive?`<p>${esc(d.name)}正在佛堂诵经。</p><div class="acts"><button class="btn" onclick="A.greet()">请安<small>精力-1</small></button></div>`:mourningPlacePanel()}${initiativesAt('cn')}`}
  return viewMap()}
