#!/usr/bin/env node
/* Portrait gameplay video for the TapTap store page, recorded from the built package.

     python3 scripts/build-taptap.py
     node scripts/record-taptap-video.cjs     # docs/taptap/gameplay-1080x1920.mp4

   TapTap asks for 15 s – 30 min, a short side of at least 540 px and core play within
   the first 5 s, so the clip opens straight on a memorial. Same reign as the
   screenshots (萧珩 · 弘晏). Needs ffmpeg with libx264 and Chrome. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {root,sleep,MEMORIAL,gameSession}=require('./lib/taptap-chrome.cjs');

// 405×720 CSS px at 8/3 → 1080×1920.
const VIEWPORT={width:405,height:720,deviceScaleFactor:8/3,mobile:true};
const output=path.join(root,'docs/taptap/gameplay-1080x1920.mp4');

async function main(){
  const frames=fs.mkdtempSync(path.join(os.tmpdir(),'chengongji-video-'));
  const game=await gameSession(VIEWPORT),{send,on,evaluate,open}=game;
  const recorded=[];let recording=false;
  on('Page.screencastFrame',({data,metadata,sessionId})=>{
    send('Page.screencastFrameAck',{sessionId}).catch(()=>{});
    if(!recording)return;
    const file=path.join(frames,`f${String(recorded.length).padStart(5,'0')}.jpg`);
    fs.writeFileSync(file,Buffer.from(data,'base64'));recorded.push({file,t:metadata.timestamp});
  });
  // Page helpers: tap a visible button by its text, scroll the panel smoothly, and
  // close result screens so the next scene starts clean.
  const helpers=`window.__tap=async(fragment,scope='body')=>{
      const b=[...document.querySelectorAll(scope+' button')].find(x=>x.offsetParent&&x.textContent.includes(fragment));
      if(!b)throw Error('no button '+fragment);b.scrollIntoView({block:'nearest'});b.click();await new Promise(r=>setTimeout(r,60));};
    window.__glide=async(px,ms)=>{const el=document.querySelector('#panel');const steps=Math.round(ms/16);
      for(let i=0;i<steps;i++){el.scrollBy(0,px/steps);await new Promise(r=>setTimeout(r,16));}};
    window.__settle=()=>{for(let n=0;modalOpen&&n<20;n++){if(modalResult)nextEv();else choose(curEv.choices.length-1);}};`;
  const step=async(code,hold)=>{await evaluate(code);await sleep(hold);};
  try{
    await open();
    await evaluate(helpers+`A.load('1');`);await sleep(700);
    await game.assertClean('start');
    await send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1080,maxHeight:1920,everyNthFrame:1});
    recording=true;

    // Court: the month's memorial, approved.
    await step(`A.court();if(curEv?.title!==${JSON.stringify(MEMORIAL)})throw Error('memorial: '+curEv?.title);`,2600);
    await step(`await __tap('准奏','#mbox');`,2400);
    await step(`__settle();`,900);
    // Harem: the empress's page.
    await step(`A.go('harem');`,1300);
    await step(`await __tap('皇后','#panel');`,1600);
    await step(`await __glide(420,1600);`,900);
    // Selection: a fresh draft of candidates.
    await step(`genCands(6);A.go('xx');`,1400);
    await step(`await __glide(520,2000);`,900);
    // Jinyiwei: 贺行简 takes 「借牌的人」.
    await step(`A.go('jinyiwei');`,1100);
    await step(`A.heXingjianMission();if(curEv?.title!=='借牌的人')throw Error('case: '+curEv?.title);`,2600);
    await step(`await __tap('差遣贺行简','#mbox');`,2200);
    await step(`__settle();`,500);
    // Story consorts in the study's codex.
    await step(`openHomeBook('archive');await new Promise(r=>setTimeout(r,200));jumpToPageSection('home-story-consorts');`,1300);
    await step(`await __glide(1500,4200);`,800);
    // The month turns.
    await step(`window.scrollTo(0,0);A.endMonth();`,2600);
    await step(`__settle();A.go('map');`,1800);
    await game.assertClean('end');
    recording=false;await send('Page.stopScreencast');
  }finally{game.close();}

  if(recorded.length<20)throw Error('too few frames recorded: '+recorded.length);
  const list=recorded.map((f,i)=>{
    const next=recorded[i+1]?.t??f.t+1.5;
    return `file '${f.file}'\nduration ${Math.max(next-f.t,1/60).toFixed(4)}`;
  }).join('\n')+`\nfile '${recorded.at(-1).file}'\n`;
  fs.writeFileSync(path.join(frames,'list.txt'),list);
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',path.join(frames,'list.txt'),
    '-vf','fps=30,scale=1080:1920:flags=lanczos,format=yuv420p','-c:v','libx264','-profile:v','high','-crf','20','-preset','slow',
    '-movflags','+faststart',output],{stdio:'inherit'});
  fs.rmSync(frames,{recursive:true,force:true});
  const seconds=recorded.at(-1).t-recorded[0].t+1.5;
  console.log(`${path.relative(root,output)}  ${seconds.toFixed(1)}s  ${(fs.statSync(output).size/1048576).toFixed(1)}MB  ${recorded.length} frames`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
