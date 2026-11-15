/* Genuine game renderings from public disposable saves. No player storage is read. */
const fs=require('node:fs'),path=require('node:path');
const {world,scenarios}=require('../tests/court-family-browser-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/qa/gouyi-gallery');fs.mkdirSync(out,{recursive:true});
const entries={
 meeting:{scenario:'gouyi'},
 profile:{scenario:'gouyi',after:`choose(0);choose(0);drain();var g=S.consorts.find(c=>c.gouyi);g.known=true;g.kl=true;PalaceActions.reset();`,view:'profile'},
 inquiry:{scenario:'gouyi-inquiry-1'},
 lamplight:{scenario:'gouyi-inquiry-2'},
 friendship:{scenario:'gouyi-reaction-kind'},
 rivalry:{scenario:'gouyi-reaction-rival'},
 chronicle:{scenario:'gouyi-inquiry-1',after:'choose(0);drain();PalaceActions.reset();',view:'chronicle'},
 reading:{scenario:'gouyi',after:`choose(0);choose(0);drain();S.turn+=3;PalaceActions.reset();A.gouyiReadHistory(S.consorts.find(c=>c.gouyi).id);`}
};
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [name,spec] of Object.entries(entries)){
 const b=world();b.run(scenarios[spec.scenario]);if(spec.after)b.run(spec.after);
 const payload=b.run('JSON.stringify(PalaceActions.payload())').replace(/</g,'\\u003c');
 let html=source.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>').replace('<title>宸宫纪</title>',`<title>赵令仪 · ${name} · 演示存档</title>`);
 html+=`\n<script type="application/json" id="gouyi-demo-save">${payload}</script>\n<script type="application/json" id="gouyi-demo-view">${JSON.stringify(spec.view||'event')}</script>\n<script defer src="./docs/qa/gouyi-gallery/bootstrap.js"></script>\n`;
 fs.writeFileSync(path.join(out,name+'.html'),html);
}
console.log('Generated '+Object.keys(entries).length+' isolated game gallery pages.');
