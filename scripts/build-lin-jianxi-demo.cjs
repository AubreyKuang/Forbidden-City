const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {boot}=require('../tests/playtest-harness.cjs');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'docs/qa/lin-jianxi');

function setup(found=true){
 const game=boot(204);
 game.run(`A.start();drain();S.turn=252;S.year=22;S.month=1;E().sur='萧';E().energy=10;
  var princess=makeKid(harem()[0],'f','昭宁');princess.born=S.turn-18*12;princess.pendingName=false;
  princess.temperament='内敛';princess.hp=100;princess.away=false;
  PalaceActions.reset();A.openPrincess(princess.id);choose(0);drain();`);
 if(found)game.run(`createFenghuaPerson('linJianxi');PalaceActions.reset();`);
 return game;
}
const invite=game=>game.run(`A.linJianxiHeart(princess.id);choose(0);drain();`);
const advance=(game,months=3)=>game.run(`S.turn+=${months};S.month=(S.month+${months}-1)%12+1;E().energy=10;PalaceActions.reset();`);
const visit=(game,answer=0)=>game.run(`A.linJianxiVisit(princess.id);if(!modalOpen)throw Error('相见入口未打开');choose(${answer});drain();`);
const save=(game,view)=>({view,id:game.run('princess.id'),world:JSON.parse(game.run('JSON.stringify(PalaceActions.payload())'))});

const game=setup(false),scenes={};
game.run(`for(const key of Object.keys(FENGHUA_PEOPLE))if(key!=='linJianxi')fenghuaState().attempts[key]=S.turn;PalaceActions.reset();`);
game.force(0,0);
game.run("A.out('city')");
assert.equal(game.run('curEv.title'),'林见溪 · 竹径拾纸');
scenes.meet=save(game,'event');
game.run('choose(0);drain()');
scenes.profile=save(game,'fenghua');
scenes.heart=save(game,'kid');
invite(game);
scenes.fan=save(game,'kid');
visit(game);
advance(game);
scenes.reply=save(game,'kid');
visit(game);
advance(game);
scenes.revisit=save(game,'kid');
visit(game);
scenes.proposal=save(game,'princess');
game.run(`A.linJianxiProposal(princess.id);choose(0);drain();`);
advance(game);
scenes.walk=save(game,'princess');
game.run(`A.linJianxiWalk(princess.id);choose(1);drain();`);
advance(game);
scenes.lamp=save(game,'princess');

const labels={profile:'人物档案',meet:'竹径拾纸',heart:'皇嗣心事',fan:'扇上山水',reply:'等她答完',
 revisit:'回约',proposal:'山水有约',walk:'溪桥家常',lamp:'竹门有灯'};
const links=Object.entries(labels).map(([key,label])=>`<a href="./docs/qa/lin-jianxi/?scene=${key}" data-lin-demo-scene="${key}">${label}</a>`).join('');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const html=source.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>')
 .replace('<title>宸宫纪</title>','<title>林见溪 · 宸宫纪试玩</title>');
const panel=`<details id="lin-demo-menu"><summary>林见溪 · 试玩场景</summary><p>在此页作出的选择只在当前试玩中保存。</p><nav aria-label="林见溪试玩场景">${links}</nav></details>`;
const css=`#lin-demo-menu{position:fixed;z-index:10;left:12px;bottom:12px;max-width:min(430px,calc(100vw - 24px));padding:8px 12px;border:1px solid #c5b794;border-radius:8px;background:#f8f1e2;color:#31281d;box-shadow:0 2px 10px #342a2530}#lin-demo-menu summary{cursor:pointer;font-weight:700}#lin-demo-menu p{font-size:.9rem;margin:8px 0}#lin-demo-menu nav{display:flex;flex-wrap:wrap;gap:8px 14px}#lin-demo-menu a{color:#24594a}#lin-demo-menu a[aria-current]{font-weight:700}`;
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'index.html'),html.replace('</head>',`<style>${css}</style>\n</head>`)
 +`\n${panel}\n<script type="application/json" id="lin-demo-data">${JSON.stringify(scenes).replace(/</g,'\\u003c')}</script>\n<script defer src="./docs/qa/lin-jianxi/bootstrap.js"></script>\n`);
console.log(`Generated ${Object.keys(scenes).length} Lin Jianxi demo scenes.`);
