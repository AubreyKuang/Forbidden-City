/* ============ 场景（逐像素绘制的宫殿与四季） ============ */
const SC=$('#scene'),sg=SC.getContext('2d'),SW=192,SH=80,SCENE_SCALE=2;
SC.width=SW*SCENE_SCALE;
SC.height=SH*SCENE_SCALE;
sg.setTransform(SCENE_SCALE,0,0,SCENE_SCALE,0,0);
let scene='court',parts=[],frame=0,lastT=0,LIGHTS=[];
const clouds=[{x:10,y:6},{x:90,y:13},{x:150,y:4}];
function setScene(m){ if(scene!==m){scene=m;parts=[]} AU.setMode(m)}
function P(x,y,w,h,c){sg.fillStyle=c;sg.fillRect(Math.round(x*SCENE_SCALE)/SCENE_SCALE,Math.round(y*SCENE_SCALE)/SCENE_SCALE,w,h)}
const SKY=[['#7fbde6','#a8d4ef','#d3ecf6'],['#4fa3dd','#86c6ef','#c0e4f7'],['#d99a66','#ebbd8a','#f6dcb4'],['#8d9fb6','#b5c3d4','#dce4ed']];
const NSKY=['#070a22','#0e1438','#1a2150'];
function sky(cols){const b=[0,16,32,50];for(let i=0;i<3;i++)P(0,b[i],SW,b[i+1]-b[i],cols[i]);
  for(let i=1;i<3;i++)for(let x=0;x<SW;x+=2){P(x,b[i]-1,1,1,cols[i]);P(x+1,b[i],1,1,cols[i-1])}}
function cloud(x,y,c){P(x+3,y,7,2,c);P(x,y+2,14,2,c);P(x+2,y+4,9,1,c)}
function roof(x,y,w,col){const[c1,c2,c3]=col,win=season()===3;
  P(x+6,y,w-12,1,c3);for(let i=1;i<6;i++){const s=6-i;P(x+s,y+i,w-s*2,1,i%2?c1:c2)}
  for(let tx=x+5;tx<x+w-5;tx+=3)P(tx,y+2,1,3,c2);
  P(x-1,y+6,w+2,1,c2);P(x-2,y+5,1,1,c1);P(x+w+1,y+5,1,1,c1);P(x+5,y-1,1,1,c3);P(x+w-6,y-1,1,1,c3);
  if(win){P(x+6,y,w-12,1,'#f4f7fa');P(x+5,y+1,w-10,1,'#e6edf3');P(x+4,y+2,w-8,1,'#dfe7ee')}}
const YROOF=['#e3b23c','#b98420','#7a4f10'],GROOF=['#4d9a86','#2f6b5e','#1d4a41'],HROOF=['#6d727c','#50545c','#33363c'];
function hall(x,y,w,h,o={}){const rc=o.roof||YROOF;
  P(x,y,w,h,'#a3262a');for(let cx=x+1;cx<x+w;cx+=5)P(cx,y,1,h,'#7a1a1e');
  for(let dx=x+3;dx<x+w-3;dx+=5){P(dx,y+2,3,h-3,o.lit?'#ffd36b':'#c98b2b');P(dx+1,y+3,1,h-5,o.lit?'#ffb43c':'#8a5a12');if(o.lit)LIGHTS.push([dx,y+2,3,h-3])}
  P(x,y,w,1,'#5a1215');P(x-1,y-1,w+2,1,'#2f6b5e');
  if(o.double){roof(x-2,y-16,w+4,rc);P(x+3,y-10,w-6,3,'#a3262a');P(x+3,y-10,w-6,1,'#2f6b5e')}
  roof(x-5,y-8,w+10,rc)}
function lantern(x,y,lit){P(x+1,y-2,1,2,'#3a2a20');P(x,y,3,4,'#d0303a');P(x,y+1,3,1,'#a3262a');P(x+1,y+4,1,2,GOLD);if(lit)LIGHTS.push([x,y,3,4,1])}
function tree(x,y,s){P(x,y,3,14,'#5a3a22');P(x-2,y+3,2,1,'#5a3a22');P(x+3,y+5,3,1,'#5a3a22');
  const cs=[['#f4a6c0','#e27aa0'],['#4f9a5a','#3a7a44'],['#e08a3a','#c0602a'],null][s];
  if(cs){[[0,-4,9,5],[-6,-1,7,4],[5,-1,8,4],[-3,1,12,4]].forEach(([dx,dy,w,h],i)=>P(x+dx-2,y+dy,w,h,cs[i%2]));
    if(s===0)for(let i=0;i<6;i++)P(x-6+((i*7)%15),y-3+((i*5)%6),1,1,'#fff0f5')}
  else{P(x-5,y-2,4,1,'#5a3a22');P(x+3,y-3,5,1,'#5a3a22');P(x-5,y-3,4,1,'#f4f7fa');P(x+3,y-4,5,1,'#f4f7fa');P(x-1,y-5,4,1,'#f4f7fa')}}
function fig(x,y,body,hat){P(x+1,y,3,1,hat||'#1d1520');P(x+1,y+1,3,2,'#f2cfb2');P(x,y+3,5,5,body);P(x+1,y+8,1,2,INK);P(x+3,y+8,1,2,INK)}
function drawAttendant(pixel,x,y,step){
  const cloth='#527286',shade='#344b62',highlight='#7697a8',hat='#262a38';
  pixel(x-2.5,y-.5,5,1,'#33241f54');
  pixel(x-1.5,y-9,3,2,hat);
  pixel(x-.5,y-9.5,1,1,'#ab4143');
  pixel(x-2,y-7.5,4,1,hat);
  pixel(x-1,y-6.5,2,1.5,'#e8b997');
  pixel(x+.5,y-6,.5,.5,'#513430');
  pixel(x-1.5,y-5,3,4,shade);
  pixel(x-1,y-4.5,2,3.5,cloth);
  pixel(x-2,y-4.5,1,2.5,highlight);
  pixel(x+1,y-4.5,1,2,cloth);
  pixel(x-.5,y-5,1,.5,'#dfd2b3');
  pixel(x-1,y-3,2,.5,hat);
  pixel(x-1,y-1,1,step>0?.5:1,hat);
  pixel(x+.5,y-1,1,step<0?.5:1,hat);
  pixel(x-2.5,y-4,1.5,.5,'#a99172');
  pixel(x-3,y-5,.5,1.5,'#ded1b8');
}
function empFig(x,y){P(x-1,y,7,1,'#1b1b24');P(x+1,y-1,3,1,'#1b1b24');P(x+1,y+1,3,2,'#f2cfb2');P(x,y+3,5,6,'#e8b52c');P(x+2,y+4,1,1,'#c0392b');P(x+1,y+9,1,1,INK);P(x+3,y+9,1,1,INK)}
function ground(c1,c2,y){P(0,y,SW,SH-y,c1);for(let yy=y+3;yy<SH;yy+=4)for(let x=((yy>>2)%2)*5;x<SW;x+=10)P(x,yy,8,1,c2)}
function drawCourt(s){
  sky(SKY[s]);clouds.forEach(c=>cloud(c.x,c.y,'#ffffffcc'));
  P(0,38,SW,10,'#9b2428');roof(-8,31,SW+16,YROOF);
  if(!drawBuildingArt(sg,0,42,10,108,45)){
    hall(60,33,72,12,{double:true});
    for(let i=0;i<3;i++){P(56-i*5,45+i*3,80+i*10,3,i%2?'#d8d2c4':'#ece7db');P(56-i*5,47+i*3,80+i*10,1,'#b9b2a2')}
  }
  ground('#c9c2b2','#b7af9e',54);P(86,54,20,26,'#e3dccb');for(let y=46;y<54;y+=2)P(88,y,16,1,'#f6f2e8');
  P(30,30,1,24,'#5a3a22');P(31,30,6,4,'#c0392b');P(160,30,1,24,'#5a3a22');P(161,30,6,4,'#c0392b');
  for(let i=0;i<4;i++){drawAttendant(P,22+i*12,68,0);drawAttendant(P,138+i*12,68,0)}
  empFig(93,62);
  P(70,66,3,4,'#7a6a5a');P(119,66,3,4,'#7a6a5a');P(69,64,5,2,'#8f8070');P(118,64,5,2,'#8f8070');
}
function drawHarem(s,night){
  sky(night?NSKY:SKY[s]);
  if(night){for(let i=0;i<30;i++){const x=(i*53)%SW,y=(i*29)%34;if((frame+i)%23)P(x,y,1,1,'#fff8d0')} P(150,6,8,8,'#fff3c4');P(151,5,6,10,'#fff3c4');P(149,7,10,6,'#fff3c4');P(154,7,2,2,'#e9dcae')}
  else clouds.forEach(c=>cloud(c.x,c.y,'#ffffffbb'));
  P(0,36,SW,8,'#9b2428');roof(-8,29,SW+16,YROOF);
  for(const x of [10,110]){
    if(!drawBuildingArt(sg,1,x,23,72,33,night?'brightness(.64) saturate(.76)':'none'))hall(x+8,45,56,11,{lit:night});
  }
  ground(night?'#7d7465':'#d9cfbb',night?'#6c6456':'#c8bea9',56);
  P(80,56,32,24,night?'#8a8070':'#e8dfcc');
  tree(94,40,s);
  [22,68,122,168].forEach(x=>lantern(x,40,night));
  if(!night){drawAttendant(P,62+(frame>>2)%60,72,frame%4<2?1:-1);fig(140-((frame>>3)%40),66,'#d79ab0','#1d1520')}
  else drawAttendant(P,32,74,0);
}
function drawGarden(s){
  sky(SKY[s]);clouds.forEach(c=>cloud(c.x,c.y,'#ffffffcc'));
  for(let x=0;x<SW;x++){const h=8+Math.round(Math.sin(x/17)*4+Math.sin(x/7)*2);P(x,46-h,1,h,s===3?'#c8d2dc':'#7aa883')}
  P(0,44,SW,8,s===3?'#e8eef2':'#6c9a5a');
  P(0,52,SW,28,s===3?'#9fbccb':'#4a8fb0');
  for(let i=0;i<14;i++){const x=(i*37+frame)%SW,y=55+(i*7)%22;P(x,y,6,1,'#7fb9d4')}
  if(!drawBuildingArt(sg,5,109,13,70,33)){
    P(118,40,52,4,'#ece7db');P(118,43,52,1,'#b9b2a2');
    [122,134,152,164].forEach(x=>P(x,26,2,14,'#a3262a'));roof(114,19,60,GROOF);P(143,14,2,5,GOLD);P(142,13,4,1,GOLD);
  }
  for(let x=60;x<110;x++){const y=50-Math.round(Math.sin((x-60)/50*Math.PI)*8);P(x,y,1,2,'#a3262a');if(x%5===0)P(x,y-3,1,3,'#a3262a')}
  P(18,20,3,32,'#5a3a22');
  const wc=s===3?'#d7dfe4':s===2?'#c9a240':'#7fbf5a';
  for(let i=0;i<9;i++){const x=6+i*3,sw=Math.round(Math.sin(frame/8+i)*1);for(let y=18;y<40+(i%3)*4;y+=2)P(x+sw,y,1,2,wc)}
  P(30,46,10,6,'#8a8a8a');P(32,43,6,3,'#a0a0a0');
  if(s===1)for(let i=0;i<8;i++){const x=20+i*19,y=60+(i*5)%14;P(x,y,4,2,'#3f7f3a');if(i%2)P(x+1,y-2,2,2,'#f08aa8')}
  empFig(80,36);
}
function drawCity(s){
  sky(SKY[s]);clouds.forEach(c=>cloud(c.x,c.y,'#ffffffcc'));
  P(0,30,SW,4,'#8d8576');for(let x=0;x<SW;x+=6)P(x,28,4,2,'#8d8576');
  for(let i=0;i<5;i++){const x=4+i*38;P(x,42,32,14,'#c9b28a');P(x+12,47,8,9,'#5a3a22');P(x+3,46,6,4,'#e6d7b0');P(x+23,46,6,4,'#e6d7b0');roof(x-3,35,38,HROOF);
    if(i%2===0){P(x+30,30,1,16,'#5a3a22');P(x+31,31,5,8,'#d0303a');P(x+32,33,3,1,'#fff3c4')}}
  ground('#bfa57a','#ad936a',56);
  const cols=['#86a8bf','#c47a5a','#7a9a6a','#d79ab0','#9a7ac0','#c9b28a'];
  for(let i=0;i<9;i++){const x=(i*23+(frame>>1)*(i%2?1:-1)*.6+400)%SW;fig(x,58+(i%3)*5,cols[i%6],i%3?'#1d1520':'#6b6f78')}
  P(70,58,22,3,'#8a5a32');P(72,55,18,3,'#d0303a');P(73,61,2,4,'#5a3a22');P(87,61,2,4,'#5a3a22');
  fig(100,64,'#e8b52c','#1b1b24');
}
function drawScene(){
  LIGHTS=[];const s=season(),night=scene==='night';
  if(scene==='court')drawCourt(s);else if(scene==='garden')drawGarden(s);else if(scene==='city')drawCity(s);else drawHarem(s,night);
  if(night){sg.fillStyle='rgba(10,14,48,.5)';sg.fillRect(0,0,SW,SH);
    LIGHTS.forEach(([x,y,w,h,l])=>{if(l){sg.fillStyle='rgba(255,170,80,.18)';sg.fillRect(x-3,y-3,w+6,h+6)}P(x,y,w,h,l?'#ff5a4a':'#ffd36b')});
    P(150,6,8,8,'#fff3c4');P(151,5,6,10,'#fff3c4');P(149,7,10,6,'#fff3c4')}
  // 四季粒子
  const want=night?(s===1?14:s===3?30:0):[22,0,18,34][s];
  if(parts.length<want&&chance(.5)){
    if(night&&s===1)parts.push({x:R()*SW,y:40+R()*35,vx:0,vy:0,c:'#e8ff8a',ff:1,t:R()*6});
    else parts.push({x:R()*SW*1.2-20,y:-2,vx:s===3?.1:.5+R()*.4,vy:s===3?.35+R()*.3:.3+R()*.3,c:s===0?pick(['#f7b6c8','#ffd6e2']):s===2?pick(['#e0893a','#c9562a','#e8b84a']):'#ffffff',t:R()*6})}
  parts.forEach(p=>{p.t+=.2;if(p.ff){p.x+=Math.sin(p.t)*.4;p.y+=Math.cos(p.t*.7)*.3;if((frame+(p.x|0))%9<6)P(p.x,p.y,1,1,p.c)}
    else{p.x+=p.vx+Math.sin(p.t)*.3;p.y+=p.vy;P(p.x,p.y,s===2?2:1,1,p.c)}});
  parts=parts.filter(p=>p.y<SH&&p.x<SW+4);
  clouds.forEach(c=>{c.x+=.05;if(c.x>SW)c.x=-16});
}
function loop(t){ if(t-lastT>100){lastT=t;frame++;drawScene()} requestAnimationFrame(loop) }
