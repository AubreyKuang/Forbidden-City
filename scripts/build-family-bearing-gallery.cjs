/* Public fictional saves; actual UI buttons and replay are checked in the browser. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('../tests/playtest-harness.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/qa/family-bearing-gallery');fs.mkdirSync(out,{recursive:true});
const cases={noble:{title:'内阁首辅',power:90,trait:'温婉'},humble:{title:'寒门',power:5,trait:'温婉'},proud:{title:'寒门',power:5,trait:'骄矜'},merchant:{title:'皇商',power:30,trait:'聪慧'},allowance:{title:'寒门',power:5,trait:'温婉'},growth:{title:'寒门',power:5,trait:'温婉'}};
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [name,spec] of Object.entries(cases)){
 const b=boot(428);b.run(`A.start();drain();S.turn=60;S.consorts=[];S.children=[];var c=makeGirl({sur:'沈',given:'若棠',age:24,trait:${JSON.stringify(spec.trait)},fam:{t:${JSON.stringify(spec.title)},p:${spec.power}}});delete c.solitary;addConsort(c,2,'选秀入宫');c.hp=90;c.aff=50;c.favor=20;c.xin={k:'平和',t:S.turn};c.entryAdjustment={turn:S.turn,manner:entryManner(c),settled:false,reaction:newcomerReaction(c)};S.selection={batch:'1:60:1',accepted:[c.id],date:dateStr(),finishedAt:S.turn,phase:'arrivals'};E().energy=20;`);
 if(name==='growth')b.run(`S.turn+=36;c.rank=6;c.entryAdjustment.settled=true;recordOriginLife(c,c,6);c.chatThread={turn:S.turn,moodKey:JSON.stringify([xinOf(c),c.xin?.why,lifeBoundary(c)?.cause,continuityConcern(c)?.text]),seen:consortChatTopics(c).filter(t=>t.id!=='family-bearing').map(t=>t.id)};`);
 b.run(`PalaceActions.reset();`);
 const payload=b.run('JSON.stringify(PalaceActions.payload())').replace(/</g,'\\u003c');
 const html=source.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>')+`\n<script type="application/json" id="bearing-save">${payload}</script>\n<script type="application/json" id="bearing-scene">${JSON.stringify(name)}</script>\n<script defer src="./docs/qa/family-bearing-gallery/bootstrap.js"></script>\n`;
 fs.writeFileSync(path.join(out,name+'.html'),html);
}
console.log('Built six family bearing browser cases');
