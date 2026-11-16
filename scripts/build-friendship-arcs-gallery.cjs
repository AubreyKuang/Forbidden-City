/* Real UI, fictional public people, disposable storage. No player saves are exposed. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('../tests/playtest-harness.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/qa/friendship-arcs-gallery');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const setup=fs.readFileSync(path.join(root,'tests/palace-friendship-arcs.test.cjs'),'utf8').match(/b.run\(`([\s\S]*?)`\);return b/)[1];
for(const name of ['gift','favor','distance','chronicle','repair','reunion']){
 const b=boot(883);b.run(setup);b.run(`S.year=6;S.month=1;a.portraitOverride=338;b.portraitOverride=339;`);
 if(name==='gift')b.run(`a.favor=b.favor=20;b.trait='温婉';friendshipIncident(a,b,'gift');`);
 else b.run(`friendshipIncident(a,b,'favor');`);
 if(['distance','chronicle'].includes(name))b.run(`S.turn+=6;S.month=7;friendshipIncident(a,b,'gift');S.turn+=6;S.year=7;S.month=1;a.age++;b.age++;var third=makeGirl({age:24,sur:'顾',given:'明舒',trait:'温婉',fam:{t:'知府',p:40}});addConsort(third,2,'选秀入宫');a.lastSocial={turn:S.turn,other:third.id,place:'御花园',activity:'共看杏花'};friendshipIncident(a,b,'third');`);
 if(name==='reunion')b.run(`friendshipTalkEvent(a,b).choices[0].f();S.turn=arc.pending.due-1;S.month=3;`);
 b.run(`PalaceActions.reset();`);
 const payload=b.run('JSON.stringify(PalaceActions.payload())').replace(/</g,'\\u003c');
 const html=source.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<link rel="preload" as="image" href="./assets/images/palace-consorts-legends.webp?v=1">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>')+`\n<script type="application/json" id="friendship-save">${payload}</script>\n<script type="application/json" id="friendship-scene">${JSON.stringify(name)}</script>\n<script defer src="./docs/qa/friendship-arcs-gallery/bootstrap.js"></script>\n`;
 fs.writeFileSync(path.join(out,name+'.html'),html);
}
console.log('Built six friendship browser cases');
