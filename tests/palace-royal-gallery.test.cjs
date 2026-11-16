const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
for(const name of ['young','adult','refusal','marriage','chronicle','check','intervention','romance-check','proposal','proposal-check','betrothal-check','family','single'])test('royal heart browser fixture restores intended screen: '+name,()=>{
 const html=fs.readFileSync(path.join(__dirname,'../docs/qa/royal-heart-gallery',name+'.html'),'utf8'),payload=html.match(/id="royal-heart-save">(.*?)<\/script>/s)[1];
 assert.ok(html.indexOf('memory-storage.js')<html.indexOf('js/npc-memory.js'));
 const b=boot(71,new Map([['chengongji_v1_auto',payload]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(xieAn().artPortrait,433);`);
 assert.equal(b.run('modalOpen'),!['marriage','chronicle','intervention','romance-check','single'].includes(name));
 if(name==='chronicle')assert.equal(b.run("xieAn().story.some(s=>s.t.includes('一年相知'))"),true);
});
