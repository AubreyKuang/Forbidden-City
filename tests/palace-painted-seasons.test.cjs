const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const art=b=>b.run("$('#stage').style.backgroundImage");

test('opening cover, setup and every saved game month choose the correct artwork',()=>{
  const b=boot(143);
  assert.match(art(b),/palace-title-emperor\.webp/);
  b.run('A.newGame()');assert.match(art(b),/painted-spring\.webp/);
  b.run('A.start();drain()');
  for(let month=1;month<=12;month++){
    b.run(`S.month=${month};render();save('1')`);
    const expected=['spring','summer','autumn','winter'][Math.floor((month-1)/3)];
    const restored=boot(149,b.storage);restored.run("A.load('1');drain()");
    assert.match(art(restored),new RegExp(`painted-${expected}\\.webp`),`month ${month} restored`);
    const file=art(restored).match(/url\("(.+)"\)/)[1];
    assert.ok(fs.statSync(path.resolve(__dirname,'..',file)).size>0);
  }
});

test('turning the month switches artwork at each seasonal boundary and new year',()=>{
  const b=boot(151);b.run('A.start();drain()');
  for(const [month,next] of [[3,'summer'],[6,'autumn'],[9,'winter'],[12,'spring']]){
    b.run(`S.month=${month};S.turn=24+${month}-1;S.year=3;render();A.endMonth();drain()`);
    assert.match(art(b),new RegExp(`painted-${next}\\.webp`),`after month ${month}`);
  }
});

test('changing court scenes preserves seasonal artwork; returning to title restores cover',()=>{
  const b=boot(157);b.run('A.start();drain();S.month=11;render()');
  for(const scene of ['garden','harem','night','city','court']){
    b.run(`setScene('${scene}')`);assert.match(art(b),/painted-winter\.webp/);
  }
  b.run("S=null;UI.view='title';render()");assert.match(art(b),/palace-title-emperor\.webp/);
});
