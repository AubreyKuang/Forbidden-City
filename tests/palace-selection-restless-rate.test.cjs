const test=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
test('new selection candidates use the reduced stable rate, while existing people retain their disposition',()=>{
 const b=boot(381);b.ctx.assert=assert;
 b.run(`A.start();drain();S.consorts=[];var total=0,positive=0,rounds=0;
 for(var i=0;i<600;i++){S.cands=[];S.selection=null;genCands(6);var any=false;
  for(var c of S.cands){if(typeof c.selectionRestless!=='boolean')continue;total++;assert.equal(c.selectionRestless,voiceHash(c.seed+':restless')%100<3);assert.equal(restlessDisposition(c),c.selectionRestless);if(c.selectionRestless){positive++;any=true;}}
  if(any)rounds++;
 }
 assert.ok(total>=3500);assert.ok(positive/total>.02&&positive/total<.04,positive+'/'+total);
 var old=makeGirl();while(voiceHash(old.seed+':restless')%100<3||voiceHash(old.seed+':restless')%100>=8)old.seed++;
 assert.equal(restlessDisposition(old),true);old.selectionRestless=false;assert.equal(restlessDisposition(old),false);delete old.selectionRestless;assert.equal(restlessDisposition(old),true);
 console.log('selection sample:',positive,'/',total,'candidates;',rounds,'/ 600 rounds');`);
});
test('a selection candidate keeps the same trait across admission and save/load',()=>{
 const b=boot(459);b.ctx.assert=assert;b.run(`A.start();drain();genCands(6);var g=S.cands.find(p=>typeof p.selectionRestless==='boolean'),id=g.id,assigned=g.selectionRestless;
 save('auto');A.load('auto');drain();g=S.cands.find(p=>p.id===id);assert.equal(g.selectionRestless,assigned);assert.equal(restlessDisposition(g),assigned);
 A.xxTake(id);choose(0);drain();save('auto');A.load('auto');drain();g=byId(id);assert.ok(g);assert.equal(g.selectionRestless,assigned);assert.equal(restlessDisposition(g),assigned);assert.equal(PalaceActions.blocked,false);`);
});
test('a version 148 pending admission replays with the existing disposition',()=>{
 const saved=require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/selection-restless-pending-v148.json'),'utf8');
 const b=boot(8,new Map([['chengongji_v1_auto',saved]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(curEv.title,'留牌子');var g=S.cands[0],id=g.id;assert.equal(restlessDisposition(g),true);assert.equal(g.selectionRestless,undefined);choose(0);drain();g=byId(id);assert.ok(g);assert.equal(restlessDisposition(g),true);save('auto');A.load('auto');drain();assert.equal(restlessDisposition(byId(id)),true);assert.equal(PalaceActions.blocked,false);`);
});
