#!/usr/bin/env node
/* Phone-portrait store screenshots of the built TapTap package, driven through the
   real game in headless Chrome (DevTools protocol; Node 22+ for the global WebSocket).

     python3 scripts/build-taptap.py
     node scripts/capture-taptap-screenshots.cjs      # docs/taptap/raw + screenshots

   Every shot shows the same reign (萧珩 · 弘晏), see lib/taptap-chrome.cjs. The
   package's index.html is served unchanged: no debug panel. */
const fs=require('node:fs'),path=require('node:path');
const {root,sleep,MEMORIAL,gameSession}=require('./lib/taptap-chrome.cjs');

const out=path.join(root,'docs/taptap/raw'),store=path.join(root,'docs/taptap/screenshots');
// 400×600 CSS px at 2.7× → 1080×1620, the gameplay area under a 300px caption band.
const VIEWPORT={width:400,height:600,deviceScaleFactor:2.7,mobile:true};

// Captions from issue #37. The store accepts portrait shots from 720×1280 up to a 5:8
// ratio; 1080×1920 keeps the real game on 84% of the image.
const CAPTIONS={'01-title':'一朝为帝，宫阙深深。','02-memorial':'每一封奏折，都是一次抉择。',
  '03-story-consort':'六位剧情妃，各有一段前尘。','04-jinyiwei-case':'宫里没有秘密，只有还没查到的案子。'};
const captionPage=(png,text)=>`<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#2a0f0c}
  header{height:300px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:28px;
    background:linear-gradient(180deg,#8f1d18,#5e1210);border-bottom:6px solid #d9a441}
  i{width:18px;height:18px;transform:rotate(45deg);background:#e9bf5a;flex:none}
  h1{margin:0;color:#ffe7a3;font:900 ${Math.min(64,Math.floor(860/[...text].length)-4)}px/1.25 "Songti SC","STSong","Noto Serif SC",serif;letter-spacing:3px;white-space:nowrap;
    text-shadow:0 3px 0 #3a0906,0 0 18px #00000055;max-width:900px;text-align:center}
  img{display:block;width:1080px;height:1620px}
</style><header><i></i><h1>${text}</h1><i></i></header><img src="data:image/png;base64,${png}">`;

async function main(){
  const game=await gameSession(VIEWPORT),{send,evaluate,open}=game;
  const shot=async name=>{
    await sleep(900);await game.assertClean(name);
    const {data}=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data,'base64'));console.log('captured',name);
  };
  try{
    fs.mkdirSync(out,{recursive:true});

    // 1. Title: the saved reign is offered on the landing page.
    await open();
    if(!(await evaluate(`return document.body.innerText`)).includes('萧珩'))throw Error('title does not list the prepared reign');
    await shot('01-title');

    // 2. A memorial with approve / reject choices and their previewed effects.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));A.court();await new Promise(r=>setTimeout(r,300));
      if(curEv?.title!==${JSON.stringify(MEMORIAL)})throw Error('memorial did not open: '+curEv?.title);`);
    await shot('02-memorial');

    // 3. Story consort codex, opened at 陆绾.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));openHomeBook('archive');await new Promise(r=>setTimeout(r,300));jumpToPageSection('home-story-consorts');await new Promise(r=>setTimeout(r,400));
      const card=document.querySelector('[data-story-consort="luwan"]');
      if(!card)throw Error('陆绾 card missing');card.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));
      // Sit the card just below the sticky chapter tabs.
      const covering=[...document.querySelectorAll('#panel *')].filter(e=>getComputedStyle(e).position==='sticky').map(e=>e.getBoundingClientRect().bottom);
      const top=card.getBoundingClientRect().top,clear=Math.max(0,...covering.filter(b=>b<innerHeight/2))+6;
      (document.scrollingElement||document.documentElement).scrollBy(0,top-clear);`);
    await shot('03-story-consort');

    // 4. Jinyiwei: 贺行简's first assignment, 「借牌的人」.
    await open();
    await evaluate(`A.load('1');await new Promise(r=>setTimeout(r,300));A.go('jinyiwei');await new Promise(r=>setTimeout(r,300));
      A.heXingjianMission();await new Promise(r=>setTimeout(r,300));if(curEv?.title!=='借牌的人')throw Error('case did not open: '+JSON.stringify({modalOpen,title:curEv?.title,view:UI.view,queue:Q.map(e=>e.title)}));`);
    await shot('04-jinyiwei-case');

    // Captioned store copies.
    fs.mkdirSync(store,{recursive:true});
    await send('Emulation.setDeviceMetricsOverride',{width:1080,height:1920,deviceScaleFactor:1,mobile:false});
    const {frameTree}=await send('Page.getFrameTree');
    for(const [name,text] of Object.entries(CAPTIONS)){
      const png=fs.readFileSync(path.join(out,name+'.png')).toString('base64');
      await send('Page.navigate',{url:'about:blank'});await sleep(200);
      await send('Page.setDocumentContent',{frameId:frameTree.frame.id,html:captionPage(png,text)});await sleep(500);
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(store,name+'.png'),Buffer.from(data,'base64'));console.log('captioned',name);
    }
  }finally{game.close();}
}
main().catch(e=>{console.error(e.message);process.exit(1);});
