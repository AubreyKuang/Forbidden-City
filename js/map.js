/* ============ 宫城地图 ============ */
const MW=200,MH=128,HY=[46,64,82,100];
const MAPC=document.createElement('canvas');MAPC.width=MW;MAPC.height=MH;MAPC.id='mapc';MAPC.setAttribute('aria-label','宫城地图');
const mg=MAPC.getContext('2d');
const PLACES=[
 {id:'qq',n:'乾清宫',r:[80,68,40,11],d:[100,82],k:'view',v:'home',sc:'court'},
 {id:'kn',n:'坤宁宫',r:[82,50,36,11],d:[100,64],k:'palace',p:'坤宁宫',sc:'harem'},
 {id:'cj',n:'宸极殿',r:[78,86,44,12],d:[100,100],k:'place',sc:'court'},
 {id:'qa',n:'钦安殿',r:[164,33,26,10],d:[177,46],k:'place',sc:'garden'},
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
function npcSync(){const ids=new Set();alive().filter(c=>!c.maid&&(inPalace(c)||c.cold)).forEach(c=>{ids.add(c.id);if(!NPC.has(c.id)){const h=c.cold?[23,46]:npcHome(c);NPC.set(c.id,{x:h[0],y:h[1],path:[],wait:ri(5,60),ox:ri(-3,3),where:'home'})}});[...NPC.keys()].forEach(id=>{if(!ids.has(id))NPC.delete(id)})}
function npcRoutine(c,roll) {
  const home=npcHome(c);
  if(pregnancyPrayerVisitors().includes(c))return {where:'dao-pregnancy',dest:PLACES.find(p=>p.id==='qa').d};
  if(daoVisitors().includes(c))return {where:'dao',dest:PLACES.find(p=>p.id==='qa').d};
  const hobby=consortHobby(c);
  const gardenBias=['活泼','淡泊'].includes(c.trait)||c.t2==='爱猫'||CONSORT_HOBBIES[hobby].place==='御花园';
  const studyBias=['才女','好学'].includes(c.trait)||c.t2==='好读史'||hobby==='读书';
  const friends=harem().filter(o=>o!==c&&socialPair(c,o)&&relGet(c,o)>=25)
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
  if(n.where==='dao-pregnancy')return n.path.length?'由宫人陪着，慢慢往钦安殿祈愿去':'在钦安殿廊下候见国师，想问问这一胎男女';
  if(isSolitary(c)&&['garden','library','dao'].includes(n.where))return n.path.length?'独自沿宫道而行，遇人仍依礼致意':n.where==='dao'?'独坐殿侧读道书，有疑处便写在页边':n.where==='library'?'在廊下独读，合上书后才与你说话':'独自在花亭看水，向路过的人微微颔首';
  if(n.where==='dao')return n.path.length?'沿东侧宫道，往钦安殿听讲去':'在钦安殿廊下翻阅经卷';
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
A.arrivePlace=function(id){const p=PLACES.find(p=>p.id===id);if(p)arrive(p);};
function arrive(p){if(typeof PalaceActions!=='undefined'&&!PalaceActions.busy)return A.arrivePlace(p.id);S.pos={x:p.d[0],y:p.d[1]};setScene(p.sc);AU.sfx('page');
  if(p.k==='view')UI.view=p.v;else if(p.k==='palace'){UI.view='palace';UI.sel=p.p;preparePalaceLife(p.p)}else{UI.view='place';UI.sel=p.id}
  if(p.id==='cn'&&dowagerLivingActive()&&S.flags.dowager?.alive)prepareDowagerCompany(ensureDowager());
  render();if(p.k==='palace')pushEv(palaceActiveSceneEvent(p)||palaceArrivalEvent(p.p))}
function nearestPlace(){const p=PLACES.find(p=>S.pos&&p.d[0]===S.pos.x&&p.d[1]===S.pos.y);return p?p.n+'门前':'宫道上'}
function mapTick(){if(!S||UI.view!=='map'||modalOpen||exhaustedMonthNotice)return;
  if(emp.path.length){const done=stepTo(emp,3.5);emp.trail.push([emp.x,emp.y]);if(emp.trail.length>5)emp.trail.shift();
    if(done){S.pos={x:Math.round(emp.x),y:Math.round(emp.y)};if(emp.arrive){const f=emp.arrive;emp.arrive=null;f()}}}
  npcStep();drawMap()}
// Six physical pixels per map unit retain fine brushwork on high-density displays.
const MAP_SCALE=6;
MAPC.width=MW*MAP_SCALE;MAPC.height=MH*MAP_SCALE;
mg.setTransform(MAP_SCALE,0,0,MAP_SCALE,0,0);
mg.imageSmoothingEnabled=true;mg.imageSmoothingQuality='high';
const terrainCanvas=document.createElement('canvas');
terrainCanvas.width=MAPC.width;terrainCanvas.height=MAPC.height;
const terrainInk=terrainCanvas.getContext('2d');
terrainInk.setTransform(MAP_SCALE,0,0,MAP_SCALE,0,0);
terrainInk.imageSmoothingEnabled=true;terrainInk.imageSmoothingQuality='high';
let terrainSeason=-1,mapInk=mg;
function mapAtlas(file){
  const image=document.createElement('img');
  image.addEventListener('load',()=>{terrainSeason=-1;if(S&&UI.view==='map')drawMap();});
  image.src='./assets/images/'+file;
  return image;
}
const buildingAtlas=mapAtlas('palace-map-buildings.webp');
const winterBuildingAtlas=mapAtlas('palace-map-buildings-winter.webp');
const floraAtlas=mapAtlas('palace-map-flora.webp');
const figureAtlas=mapAtlas('palace-map-figures.webp');
function M(x,y,w,h,c){mapInk.fillStyle=c;mapInk.fillRect(x,y,w,h);}
function mapOval(x,y,rx,ry,color){mapInk.fillStyle=color;mapInk.beginPath();mapInk.ellipse(x,y,rx,ry,0,0,Math.PI*2);mapInk.fill();}
function mapLine(points,color,width=.2){
  mapInk.strokeStyle=color;mapInk.lineWidth=width;mapInk.beginPath();
  points.forEach(([x,y],i)=>i?mapInk.lineTo(x,y):mapInk.moveTo(x,y));mapInk.stroke();
}
function mapPaving(x,y,w,h,palette){
  const [edge,shadow,stone,joint,light]=palette;
  M(x,y,w,h,edge);M(x+.35,y+.35,w-.7,h-.7,stone);
  for(let row=0;row<h-.7;row+=2.6){
    const line=y+.5+row;mapLine([[x+.4,line],[x+w-.4,line]],joint,.12);
    for(let col=2+(Math.round(row/2.6)%2)*3;col<w-.4;col+=6)
      mapLine([[x+col,line],[x+col,Math.min(y+h-.4,line+2.6)]],joint,.12);
  }
  mapLine([[x+.35,y+.35],[x+w-.35,y+.35]],light,.2);
  mapLine([[x+.35,y+h-.35],[x+w-.35,y+h-.35]],shadow,.2);
}
function mapTree(x,y,s,size=1,kind=0){
  const w=(kind===2?7.5:9)*size,h=(kind===2?5.2:11)*size;
  if(floraAtlas.complete&&floraAtlas.naturalWidth){
    mapInk.drawImage(floraAtlas,s*288,kind*288,288,288,x-w/2,y-h,w,h);return;
  }
  mapLine([[x,y],[x,y-h*.6]],'#79654d',.5);
  mapOval(x,y-h*.6,w*.38,h*.3,['#9ba786','#77936f','#c1a06b','#deded3'][s]);
}
function drawBuildingArt(ctx,cell,x,y,w,h,filter='none',s=season()){
  const atlas=s===3&&winterBuildingAtlas.complete&&winterBuildingAtlas.naturalWidth?winterBuildingAtlas:buildingAtlas;
  if(!atlas.complete||!atlas.naturalWidth)return false;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.filter=filter;
  ctx.drawImage(atlas,cell%3*512,Math.floor(cell/3)*352,512,352,x,y,w,h);
  ctx.filter='none';return true;
}
function mapBuilding(cell,x,y,w,h,s,cold=false){
  if(drawBuildingArt(mapInk,cell,x,y,w,h,cold?'grayscale(.75) brightness(.85)':'none',s))return;
  M(x+2,y+h*.45,w-4,h*.5,cold?'#8c7f70':'#aa7762');
  mapInk.fillStyle=cell===2||cell===5?'#779283':'#c6a36c';mapInk.beginPath();
  mapInk.moveTo(x,y+h*.45);mapInk.quadraticCurveTo(x+w*.2,y+h*.25,x+w*.3,y+h*.1);
  mapInk.lineTo(x+w*.7,y+h*.1);mapInk.quadraticCurveTo(x+w*.8,y+h*.25,x+w,y+h*.45);mapInk.closePath();mapInk.fill();
}
function drawMapTerrain(s){
  if(terrainSeason===s)return;terrainSeason=s;mapInk=terrainInk;
  const winter=s===3;
  const paving=winter?['#b7b1a2','#c0b8aa','#e6e0d5','#d0c8bb','#fcf8ee']:
    ['#b4a58b','#c4b395','#eee2c9','#d2c2a5','#fff5de'];
  M(0,0,MW,MH,winter?'#d8d8cf':'#d9c9ac');
  mapPaving(3,3,194,121,paving);
  // Cinnabar enclosure and a continuous gilded roof-cap, with slender pilasters.
  M(2,1,196,2,'#8e5141');M(2,1,196,.4,'#d9b77c');M(2,3,196,.25,'#f5dfb0');
  M(2,124,196,2.5,'#985846');M(2,124,196,.45,'#e0be8b');
  for(const x of [2,196]){
    M(x,3,1.6,121,'#a76855');M(x+.3,3,.35,121,'#e0ae85');
    for(let y=8;y<124;y+=9){M(x-.6,y,2.8,1,'#a06b50');M(x-.8,y-.25,3.2,.3,'#e3c391');}
  }
  for(const y of HY)mapPaving(5,y-3,190,6.5,paving);
  for(const x of [44,100,154])mapPaving(x-2.5,x===100?4:43,5.5,x===100?118:60,paving);
  mapPaving(77,39,46,7,paving);mapPaving(76,113,48,6,paving);
  // Garden walls, a rounded koi pond and fine stone paths preserve walkable space.
  M(57.5,11.5,85,31,'#9d8c73');M(58,12,84,30,'#f3e5c9');
  M(59,13,82,28,winter?'#d1d8cb':['#b9c5a0','#a3b294','#c4b48e'][s]);
  mapOval(79,27,16.8,8,'#a79d80');mapOval(79,26.7,16,7.4,winter?'#b7d0cb':'#74a39e');
  mapOval(78.7,26.1,14.8,6.3,winter?'#d6e4de':'#85b2aa');
  for(let i=0;i<15;i++){
    const a=i/15*Math.PI*2,x=79+Math.cos(a)*16,y=27+Math.sin(a)*7.4;
    mapOval(x,y,1.1,.65,winter?'#efede3':'#d1c9ac');
  }
  for(const [x,y] of [[72,25],[84,29],[87,24]]){
    mapLine([[x-1,y],[x+1,y]],winter?'#f4faf3':'#c8ded0',.18);
    if(!winter){mapOval(x,y+.6,.6,.2,'#d99b66');mapOval(x+2,y-1,.8,.4,'#789c78');}
  }
  mapPaving(96,28,5,13,paving);mapPaving(100,28,22,3.5,paving);
  mapBuilding(5,113,12,24,17,s);
  [[64,19],[92,18],[132,36],[136,21],[107,38],[63,32]].forEach(([x,y],i)=>mapTree(x,y,s,i===0?1.3:.9,i===0?1:0));
  for(const [x,y] of [[68,38],[91,36],[109,21],[126,38]])mapTree(x,y,s,1,2);
  for(const x of [10,49,149,190])for(const y of [18,29,38,110,120])mapTree(x,y,s,.8,y===120?2:0);
  for(const [x,y] of [[74,54],[122,54],[76,72],[122,72],[73,92],[126,92]])mapTree(x,y,s,.7);
  for(const p of PLACES){
    if(p.id==='yh')continue;
    const [x,y,w,h]=p.r;
    const cell=p.id==='cj'?0:['qq','kn','cn'].includes(p.id)?1:['wy','ss','qa'].includes(p.id)?2:['sw','wm'].includes(p.id)?4:3;
    if(cell!==4){mapOval(x+w/2,y+h-.8,w*.48,1,'#79684c22');mapPaving(x,y+h-2,w,3,paving);}
    mapBuilding(cell,x,y-2,w,h+3,s,p.id==='lg');
  }
  mapInk=mg;
}
function mapFigure(cell,x,y,height=8.2,moving=false,cold=false){
  const bob=moving?Math.sin(frame*1.4)*.18:0,w=height*2/3;
  mapOval(x,y,1.3,.35,'#53452c25');
  if(figureAtlas.complete&&figureAtlas.naturalWidth){
    mg.filter=cold?'grayscale(.8)':'none';
    mg.drawImage(figureAtlas,cell%4*224,Math.floor(cell/4)*336,224,336,x-w/2,y-height-bob,w,height);mg.filter='none';return;
  }
  mapOval(x,y-height*.8,.65,.8,'#d9b696');
  mg.fillStyle=cell===6?'#c9a04b':'#a88986';mg.beginPath();mg.moveTo(x-.7,y-height*.65);mg.lineTo(x+.7,y-height*.65);mg.lineTo(x+1.4,y);mg.lineTo(x-1.4,y);mg.closePath();mg.fill();
}
function figOnMap(x,y,color,small){mapFigure(small?(color==='#527987'?8:9):Math.abs(Math.round(x+y))%6,x,y,small?6:8.2);}
function drawMap(){const s=season(),family=gardenFamilyMoment(),scenes=initiativeMapScenes();
  const busy=new Set(scenes.flatMap(scene=>scene.visitors.map(p=>p.id)));
  drawMapTerrain(s);mg.drawImage(terrainCanvas,0,0,MW,MH);
  const occupied=new Set(harem().filter(c=>c.preg>=2).map(c=>c.palace));
  for(const p of PLACES){
    const [x,y,w,h]=p.r;
    if(p.k==='palace'&&occupied.has(p.p))mapOval(x+w-2,y+1,.85,.85,'#d68b99');
    if(S.cands?.length&&p.p==='储秀宫')mapOval(x+1,y+1,.85,.85,'#d7a54f');
    if(hoverP===p){mg.fillStyle='#fff4ce26';mg.fillRect(x-.5,y-.5,w+1,h+1);mg.strokeStyle='#a87139';mg.lineWidth=.3;mg.strokeRect(x-.5,y-.5,w+1,h+1);}
  }
  for(const [id,n] of NPC){
    const c=byId(id);if(!c||family?.mother===id||busy.has(id))continue;
    if(n.where==='home'&&!n.path.length&&n.wait>0&&(frame+id)%40<28)continue;
    const x=n.x+n.ox,y=n.y;
    mapFigure(Math.abs(c.seed||id)%6,x,y,8.2,!!n.path.length,c.cold);
    if(c.preg>=2)mapOval(x,y-9,.4,.4,'#ca718c');
  }
  if(family){
    const x=GARDEN_FAMILY_SPOT[0],y=GARDEN_FAMILY_SPOT[1],child=kidById(family.child);
    mapFigure(Math.abs(byId(family.mother).seed||0)%6,x-4,y);
    mapFigure(child.sex==='m'?8:9,x+4,y,6);
  }
  for(const scene of scenes){
    scene.visitors.forEach((p,i)=>mapFigure(p.sex?(p.sex==='m'?8:9):Math.abs(p.seed||0)%6,scene.x+i*5,scene.y,p.sex?6:8.2));
    mapOval(scene.x,scene.y-10,.7,.7,'#6c9a8b');
  }
  drawSeasonalMap();
  const tr=emp.trail[0]||[emp.x,emp.y];
  mapFigure(7,tr[0]-4,tr[1],8.1,!!emp.path.length);
  mapFigure(6,emp.x,emp.y,9,!!emp.path.length);
  const want=[18,0,14,30][s];
  if(mapParts.length<want&&chance(.5))mapParts.push({x:R()*MW,y:-2,vx:s===3?.1:.4,vy:s===3?.35:.3,t:R()*6,c:s===0?'#edb7bd':s===2?pick(['#c99557','#bd7c51']):'#ffffff'});
  mapParts.forEach(p=>{p.t+=.2;p.x+=p.vx+Math.sin(p.t)*.3;p.y+=p.vy;mapOval(p.x,p.y,.45,s===3?.45:.2,p.c);});mapParts=mapParts.filter(p=>p.y<MH&&p.x<MW);
}
// Routed through A.* like arrivals, so the encounter is journaled and survives a refresh.
// The routine line is passed in because walker positions are not part of the save.
A.meetOnRoad=function(id,routine){meetConsort(byId(id),routine);};
function meetConsort(c,routine){if(!c||!c.alive||c.gone)return;
  if(typeof PalaceActions!=='undefined'&&!PalaceActions.busy)return A.meetOnRoad(c.id,npcRoutineText(c,NPC.get(c.id)));
  setScene('harem');
  const t=routine||npcRoutineText(c,NPC.get(c.id));
  pushEv({title:'宫道偶遇',por:c,text:`你在宫道上遇见了${cName(c)}，她${t}。`,choices:[
    {t:'闲话家常（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{A.chat(c.id,true);return null}},
    {t:'今夜召她侍寝（精力-1）',cond:()=>E().energy>0&&!c.preg&&(!consortRecoveryActive()||!consortNightReason(c)),why:(consortRecoveryActive()&&consortNightReason(c))||(c.preg?'她有孕在身':'精力不足'),f:()=>{nightWith(c);return null}},
    {t:'赏她一支簪子（国库-10万两）',f:()=>fx(chg({treasury:-10}),cchg(c,{mood:10,aff:3}))},
    {t:'点头作别'}]})}
MAPC.addEventListener('click',e=>{if(!S||exhaustedMonthNotice)return;const r=MAPC.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*MW,my=(e.clientY-r.top)/r.height*MH;
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
  const leads=[...journeyLeads(),...continuityLeads(),...palaceRomanceLeads(),...personalExperienceLeads(),...historyLeads(),...multipleLeads()],meeting=showGardenReunion(),stop=lanternStop(),work=duanwuWork();
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
  return leads.sort((a,b)=>continuityLeadScore(b)-continuityLeadScore(a));
}
function mapLeadAction(lead){if(lead.action)return lead.action;return lead.place?`A.visitMapActivity('${lead.place}')`:`A.go('${lead.person.sex?'kid':'consort'}',${lead.person.id})`;}
function mapLeadPlace(lead){return lead.place?PLACES.find(p=>p.id===lead.place).n:porName(lead.person);}
function mapActivityPanel(leads){
  if(!leads.length)return '<p class="hint map-quiet">宫中暂静，可以到各宫走走。</p>';
  const card=lead=>`<article class="map-activity-card"><div><strong>${esc(lead.title)}</strong><small>${lead.continuity?'前事有后话':lead.expires?'本月邀约':'本月动向'}</small><p>${esc(lead.text)}</p></div>
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
  const locustDue=locustReliefDue();
  const paymentDue=localGrainPaymentDue();
  const auditDue=mapMemorial().name==='查账回奏';
  const openingMemorial=S.turn===0&&monthlyCourtStatus().count===0;
  if(S.turn>0&&!invitations.length&&!floodDue&&!locustDue&&!paymentDue&&!auditDue){A.endMonth();return;}
  const nextMonth=MONTHS[S.month%12];
  const detail=invitations.length?'换月后，这些邀约就散了：'+invitations.map(lead=>lead.title).join('、')+'。':'';
  const reliefDetail=locustDue?`\n本月尚未批复远村补粮回奏。直接换月将失约。 ${LOCUST_UNFUNDED_TEXT}`
    :floodDue?'\n本月尚未批复赈灾回奏。直接换月会停止续拨，民心 −3。'
    :auditDue?'\n查账回奏尚未批复，换月后此案将归档。'
    :openingMemorial?'\n首月奏折尚未批复，可以先查看奏折。':'';
  const remaining=E().energy>0?`本月还可用 ${E().energy} 点精力。\n`:'';
  const paymentDetail=paymentDue?`\n换月结算时将扣除赈粮尾款 ${localGrainBalance()} 万两。${grainReserveReady()?'可留在本月，到常平仓用半批粮抵一部分。':''}${localGrainExtensionAvailable()?'留在本月也可到常平仓展期，或查看本月奏折能否改批免息宽限。':''}`:'';
  pushEv({title:invitations.length?'尚有本月邀约':`进入${nextMonth}？`,scene:'month-review',
    cast:invitations.flatMap(lead=>lead.cast),text:`${remaining}进入${nextMonth}后会结算本月收支，补充精力，并可能发生新的宫中事件。${detail?'\n'+detail:''}${reliefDetail}${paymentDetail}`,choices:[
    ...invitations.map(lead=>({t:'先去'+lead.title,f:()=>{goDirect(PLACES.find(p=>p.id===lead.place));return null;}})),
    ...(openingMemorial||floodDue||locustDue||auditDue?[{t:'查看'+mapMemorial().name,f:()=>{if(!PalaceActions.replaying)setTimeout(()=>A.court(),0);}}]:[]),
    ...(paymentDue?[{t:'去常平仓',f:()=>{if(!PalaceActions.replaying)setTimeout(()=>A.grainReserve(),0);}}]:[]),
    {t:'留在本月'},
    {t:invitations.length?`略过邀约，进入${nextMonth}`:`进入${nextMonth}`,primary:true,
      f:()=>{if(!PalaceActions.replaying)setTimeout(()=>A.endMonth(),0);return null;}}
  ]});
  $('#mbox .mch button:nth-last-child(2)')?.focus?.();
};
function mountMap(){const w=$('#mapwrap');if(!w)return;w.appendChild(MAPC);mountMapGuide(w);
  const leads=mapActivityLeads();
  PLACES.forEach(p=>{const b=document.createElement('button');b.className='mlab'+(['qq','kn','cj','yh','sw','wm'].includes(p.id)?' landmark':'');b.textContent=p.n;const here=leads.filter(lead=>lead.place===p.id);if(here.length){b.className+=' has-activity';b.setAttribute('data-activity',String(here.length));b.setAttribute('aria-label',p.n+'，'+here.map(lead=>lead.title).join('、'));}if(lanternStop()?.place===p.id){b.className+=' seasonal-lit';}const [x,y,ww,h]=p.r;
    b.style.left=((x+ww/2)/MW*100)+'%';b.style.top=((y+(p.id==='yh'?h/2:h-2))/MH*100)+'%';
    bindMapGuide(b,p);w.appendChild(b)})}
const backBtn=`<button class="btn sm" onclick="A.go('map')">◂ 返回宫城</button>`;
function mapMemorial(){
  const {done}=monthlyCourtStatus();
  const pending=S.flags.impeachmentReview;
  const reviewReady=!done&&((pending?.turn===S.turn&&pending.gen===S.gen&&impeachmentSubject(pending.file?.person))||
    (S.flags.monthlyCourt?.turn===S.turn&&S.flags.monthlyCourt.gen===S.gen&&!S.flags.monthlyCourt.done&&S.flags.monthlyCourt.review&&impeachmentSubject(S.flags.monthlyCourt.person)));
  return {done,name:!done&&locustReliefDue()?'远村补粮回奏':reviewReady?'查账回奏':!done&&floodReliefDue()?'赈灾回奏':'本月奏折'};
}
function viewMap(){
  const leads=mapActivityLeads();
  const first=leads.find(lead=>lead.expires)||leads[0];
  const {done,name:report}=mapMemorial();
  const host=S.turn===0&&monthlyCourtStatus().count>0&&!S.flags.firstEmpressVisit&&empress();
  const next=host?`<button id="map-next" class="btn sm jade" onclick="A.visitMapActivity('kn')">去坤宁宫见${esc(fullName(host))}</button>`
    :!done?`<button id="map-next" class="btn sm jade" onclick="A.court()">查看${report}</button>`
    :first?`<button id="map-next" class="btn sm jade" onclick="${mapLeadAction(first)}">${esc(mapLeadPlace(first))} · ${esc(first.title)} →</button>`:'';
  return `<section class="map-play" aria-label="宫城地图">
    <header class="map-location"><h2>宫城</h2><button class="btn sm" onclick="A.go('residences')">分配住所</button><span class="hint">${esc(nearestPlace())}</span></header>
    <div class="map-first-month">
      <span>${monthlyCourtBatchEnabled()?`本月已批 ${monthlyCourtStatus().count}/${MONTHLY_COURT_LIMIT} 份 · `:''}${done?'奏折已批复':report==='本月奏折'?'奏折待批':report+'待阅'} · 余 ${E().energy} 点精力</span>
      ${next}
      ${S.flags.lastMonthReview?'<button class="btn sm" onclick="A.go(\'log\')">上月回顾</button>':''}
    </div>
    <section class="map-month-notices" aria-label="本月宫中消息">${mourningNotice()}${mapActivityPanel(leads)}${princessMapNotice()}${birthdayBanquetButtons()}${proudDemandNotice()}</section>
    <div id="mapwrap"></div>
    <div id="map-guide-preview" aria-live="polite"></div>
    <div class="map-dock">
      <button id="map-guide-toggle" class="btn sm" aria-pressed="false" onclick="A.toggleMapGuide()">地点用途与玩法</button>
      <details class="map-brief" ${UI.mapBriefOpen?'open':''} ontoggle="UI.mapBriefOpen=this.open">
        <summary>宫中事务与常平仓</summary>
        <div class="map-brief-content">

          ${floodDikeReady()?'<p class="hint">黄河险堤已加固。日后一次直接赈济可少花 '+FLOOD_DIKE_SAVING+' 万两。</p>':''}
          <p class="hint">${grainReserveReady()?`常平仓有${grainReserveLabel()}备荒粮。遇到蝗灾月奏时可发放，免耗精力。`:'常平仓暂无备荒粮，可以向粮商买半批。'}</p>
          ${Number.isInteger(S.flags.localGrainPaymentTurn)?`<p class="hint">赈粮尾款 ${localGrainBalance()} 万两，将于${localGrainPaymentDue()?'本月底':'下月底'}结清。${localGrainPaymentDue()&&grainReserveReady()?'可到常平仓以粮抵款。':''}${localGrainExtensionAvailable()?'可在常平仓展期一次。':''}</p>`:''}
          ${autumnGrainOrderStatus()==='due'?`<p class="hint">预订的半批秋粮已到。${S.month===8?'本月可领粮、改期或退订。':'九月是最后的领取期限。'}</p>`:''}
          ${autumnGrainOrderStatus()==='delayed'?'<p class="hint">预订的半批秋粮已改到九月交付。</p>':''}
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
  return `<h2>${esc(name)}${backBtn}</h2><p class="hint">${note}</p>${residenceSummary(name)}${PALACES.includes(name)?'<div class="acts"><button class="btn" onclick="A.openResidence()">分配主位与同住</button></div>':''}${extra}${palaceRomanceAt(initiativePlace(null,null,{place:'p'+name}))}${palaceLifePanel(name)}${initiativesAt(initiativePlace(null,null,{place:'p'+name}))}${count}${res.length?`<div class="grid">${res.map(consortCard).join('')}</div>`:'<p class="hint">此处暂无人居住。</p>'}`}
function viewPlace(){const id=UI.sel;
  if(id==='qa')return viewDaoHall();
  if(id==='cj')return `<h2>宸极殿${backBtn}</h2><p>文武百官已在丹墀下候着。</p><div class="acts">${monthlyCourtButton()}<button class="btn jade" onclick="A.go('officials')">朝臣与外家 · 召见议事</button></div>`;
  if(id==='yh'){const here=[...NPC].filter(([i,n])=>n.where==='garden'&&!n.path.length).map(([i])=>byId(i)).filter(c=>inPalace(c)&&c.id!==gardenFamilyMoment()?.mother&&
      !initiativeMapScenes().some(scene=>scene.visitors.includes(c))&&!palaceRomanceLeads().some(lead=>lead.place==='yh'&&lead.cast.includes(c)));
    return `<h2>御花园${backBtn}</h2><p>${['桃花开得正好，蜂蝶纷飞。','荷风送香，蝉鸣阵阵。','丹桂飘香，满地金黄。','红梅映雪，暗香浮动。'][season()]}</p><div class="acts"><button class="btn jade" onclick="A.go('place','qa')">钦安殿问道</button><button class="btn" onclick="A.out('garden')">园中漫步<small>精力-1</small></button>${banquetReady()?`<button class="btn gold" onclick="A.openBanquet()">筹办小宴</button>`:'<span class="hint">小宴每三个月可办一次</span>'}</div>${birthdayBanquetButtons()}${gardenFamilyNotice()}${palaceRomanceAt('yh')}${historyAt('yh')}${multipleAt('yh')}${seasonalPlacePanel('yh')}${duanwuPanel()}${initiativesAt('yh')}${here.length?`<h3>园中的人</h3><div class="grid">${here.map(c=>`<button class="card" onclick="meetConsort(byId(${c.id}))">${porImg(c,48)}<div class="grow"><div class="nm">${esc(cName(c))}</div><div>${esc(npcRoutineText(c,NPC.get(c.id)))}</div></div></button>`).join('')}</div>`:'<p class="hint">园中没有其他闲游的人。</p>'}`}
  if(id==='ss'||id==='wy'){
    const school=id==='ss';
    return `<h2>${school?'上书房':'文渊阁'}${backBtn}</h2>
      ${school?schoolPanel():''}${palaceRomanceAt(id)}${historyAt(id)}${multipleAt(id)}${seasonalPlacePanel(id)}
      ${initiativesAt(id)||(school||historyAt(id)?'':'<p class="hint">此刻只有当值宫人在这里。</p>')}
      <button class="btn" onclick="A.go('${school?'kids':'log'}')">${school?'查看皇嗣':'翻阅起居注'}</button>`;
  }
  if(id==='cn'){const d=S.flags.dowager;return `<header class="cining-heading"><h2>慈宁宫</h2><div class="cining-actions">${backBtn}${d?.alive?'<button class="btn primary" onclick="A.greet()">给太后请安<small>精力-1</small></button>':''}</div></header>${dowagerCourtPanel()}${d&&d.alive?`<p>${dowagerLivingActive()&&dowagerCompanyPeople(d).length?esc(d.name)+'与'+dowagerCompanyPeople(d).map(c=>esc(fullName(c))).join('、')+'坐在窗下说话。':esc(d.name)+'正在佛堂诵经。'}</p>`:mourningPlacePanel()}${initiativesAt('cn')}`}
  return viewMap()}
