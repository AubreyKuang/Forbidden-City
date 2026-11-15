const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
const dir=path.join(__dirname,'../docs/qa/gouyi-gallery');
for(const name of ['meeting','profile','inquiry','lamplight','friendship','rivalry','chronicle','reading'])test('published '+name+' demonstration restores real game data and isolates player storage',()=>{
 const html=fs.readFileSync(path.join(dir,name+'.html'),'utf8');assert.ok(html.indexOf('memory-storage.js')<html.indexOf('js/npc-memory.js'));assert.match(html,/<base href="\.\.\/\.\.\/\.\.\/">/);
 const payload=html.match(/id="gouyi-demo-save">(.*?)<\/script>/s)[1],b=boot(178,new Map([['chengongji_v1_auto',payload]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);
 const view=JSON.parse(html.match(/id="gouyi-demo-view">(.*?)<\/script>/s)[1]);if(view==='event')assert.equal(b.run('modalOpen'),true);else b.run(`A.go('consort',S.consorts.find(c=>c.gouyi).id);assert.match(viewConsort(),/赵令仪/);`);
});
