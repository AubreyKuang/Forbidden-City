#!/usr/bin/env node
/* The five 易次元 introduction images (介绍图): 1280×720, PNG/JPG, at most 2MB each.
   Landscape shots of the real game, driven in headless Chrome like the TapTap
   screenshots and showing the same prepared reign (萧珩 · 弘晏):

     python3 scripts/build-taptap.py
     node scripts/capture-yiciyuan-intro.cjs        # docs/yiciyuan/intro-0*.jpg (Node 22+)

   960×540 CSS px at 4/3× gives 1280×720 exactly. JPEG keeps each file far under 2MB. */
const fs=require('node:fs'),path=require('node:path');
const {root,sleep,MEMORIAL,gameSession}=require('./lib/taptap-chrome.cjs');

const out=path.join(root,'docs/yiciyuan');
const VIEWPORT={width:960,height:540,deviceScaleFactor:4/3,mobile:false};
const LIMIT=2*1024*1024;
const load=`A.load('1');await new Promise(r=>setTimeout(r,300));`;

async function main(){
  const game=await gameSession(VIEWPORT),{send,evaluate,open}=game;
  const shot=async name=>{
    await sleep(900);await game.assertClean(name);
    const {data}=await send('Page.captureScreenshot',{format:'jpeg',quality:90});
    const file=path.join(out,name+'.jpg'),bytes=Buffer.from(data,'base64');
    if(bytes.length>LIMIT)throw Error(name+' is over 2MB');
    fs.writeFileSync(file,bytes);console.log('captured',name,(bytes.length/1024).toFixed(0)+'KB');
  };
  try{
    fs.mkdirSync(out,{recursive:true});
    await open();
    await shot('intro-01-title');

    await open();
    await evaluate(`${load}A.go('map');await new Promise(r=>setTimeout(r,400));`);
    await shot('intro-02-palace');

    await open();
    await evaluate(`${load}A.court();await new Promise(r=>setTimeout(r,300));
      if(curEv?.title!==${JSON.stringify(MEMORIAL)})throw Error('memorial did not open: '+curEv?.title);`);
    await shot('intro-03-memorial');

    await open();
    await evaluate(`${load}openHomeBook('archive');await new Promise(r=>setTimeout(r,300));jumpToPageSection('home-story-consorts');await new Promise(r=>setTimeout(r,400));
      const card=document.querySelector('[data-story-consort="luwan"]');
      if(!card)throw Error('陆绾 card missing');card.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));
      const covering=[...document.querySelectorAll('#panel *')].filter(e=>getComputedStyle(e).position==='sticky').map(e=>e.getBoundingClientRect().bottom);
      const top=card.getBoundingClientRect().top,clear=Math.max(0,...covering.filter(b=>b<innerHeight/2))+6;
      (document.scrollingElement||document.documentElement).scrollBy(0,top-clear);`);
    await shot('intro-04-story-consort');

    await open();
    await evaluate(`${load}A.go('jinyiwei');await new Promise(r=>setTimeout(r,300));
      A.heXingjianMission();await new Promise(r=>setTimeout(r,300));if(curEv?.title!=='借牌的人')throw Error('case did not open: '+curEv?.title);`);
    await shot('intro-05-jinyiwei-case');
  }finally{game.close();}
}
main().catch(e=>{console.error(e.message);process.exit(1);});
