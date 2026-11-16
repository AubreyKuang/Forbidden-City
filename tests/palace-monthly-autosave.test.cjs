const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');const KEY='chengongji_v1_auto';
test('twelve consecutive month transitions save before pending scenes and after choices, without a manual save',()=>{
 let w=boot(717);w.run('A.start();drain();');
 for(let month=1;month<=12;month++){
  w.run('A.endMonth();');let saved=JSON.parse(w.storage.get(KEY));assert.equal(saved.turn,month);const title=w.run('modalOpen?curEv.title:null');
  w=boot(500+month,w.storage);w.run("A.load('auto');");assert.equal(w.run('PalaceActions.blocked'),false);assert.equal(w.run('S.turn'),month);assert.equal(w.run('modalOpen?curEv.title:null'),title);w.run('drain();');saved=JSON.parse(w.storage.get(KEY));assert.equal(saved.turn,month);assert.equal(saved.pendingActions,undefined);
 }
});
test('saved month metadata and the rendered saves page agree after persistence',()=>{
 const w=boot();w.ctx.assert=assert;w.run(`A.start();drain();A.go('sys');A.endMonth();assert.equal(lastAutoSaveInfo.turn,S.turn);assert.match(viewSys(),new RegExp(dateStr()));assert.equal($('#auto-save-status').textContent,'本月已自动保存');drain();assert.equal(lastAutoSaveInfo.turn,S.turn);`);
});
test('automatic advance after spending the last energy also persists the new month',()=>{
 const w=boot();w.ctx.assert=assert;w.run(`A.start();drain();E().energy=1;PalaceActions.reset();A.out('spa');drain();assert.ok(exhaustedMonthReady());clearExhaustedMonthNotice();A.completeExhaustedMonth(S.gen,S.turn);assert.equal(S.turn,1);assert.equal(lastAutoSaveInfo.turn,1);`);const n=boot(73,w.storage);n.run("A.load('auto')");assert.equal(n.run('S.turn'),1);assert.equal(n.run('PalaceActions.blocked'),false);
});
test('refused storage keeps the old saved month visible, and retry saves the current month',()=>{
 const w=boot();w.ctx.assert=assert;w.run(`A.start();drain();A.go('sys');var write=localStorage.setItem;localStorage.setItem=()=>{throw Error('denied')};A.endMonth();assert.equal(S.turn,1);assert.equal(lastAutoSaveInfo.turn,0);assert.equal($('#auto-save-status').textContent,'自动存档未写入');assert.ok(lastAutoSaveError);localStorage.setItem=write;A.save('auto');assert.equal(lastAutoSaveInfo.turn,1);assert.equal(lastAutoSaveError,'');assert.equal($('#auto-save-status').textContent,'本月已自动保存');`);
 const n=boot(72,w.storage);n.run("A.load('auto')");assert.equal(n.run('S.turn'),1);assert.equal(n.run('PalaceActions.blocked'),false);
});
