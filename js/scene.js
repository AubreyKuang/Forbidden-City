/* ============ 细绘宫苑：随游戏月份换季，地图仍独立运行 ============ */
const PALACE_SEASONS=['spring','summer','autumn','winter'];
let scene='court',frame=0,lastT=0;
function setScene(mode){scene=mode;AU.setMode(mode);drawScene()}
function drawScene(){
  const stage=$('#stage'),s=PALACE_SEASONS[season()];
  const art=!S&&UI.view!=='new'?'cover':s;
  // The title screen shows the emperor cover; the coronation and the court use the seasonal palace.
  const source=art==='cover'?'url("./assets/images/palace-title-emperor.webp")':`url("./assets/images/palace-painted-${art}.webp")`;
  if(stage.style.backgroundImage!==source)stage.style.backgroundImage=source;
  stage.setAttribute('data-season',s);
  stage.setAttribute('data-time',S&&scene==='night'?'night':'day');
}
// Shared clock and attendant are still used by the interactive palace map.
function loop(t){if(t-lastT>100){lastT=t;frame++}requestAnimationFrame(loop)}

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
