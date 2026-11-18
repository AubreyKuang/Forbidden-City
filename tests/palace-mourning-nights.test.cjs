const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(134);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.month=1;S.year=6;E().energy=15;E().treasury=1000;var d=ensureDowager(),c=empress();c.hp=95;c.preg=0;c.lastBirth=-99;delete c.recovery;d.lastYears={deathTurn:60,askTurn:30,asked:true,warned:true,caregiver:null,lastCare:-1,history:[]};PalaceActions.reset();`);return b;}
test('new mourning blocks all nights, maid audiences, and stale encounters only during the month',()=>{
 const b=world();b.run(`var maid=newMaid('尚衣局');maid.nights=1;maid.preg=0;maid.hp=95;var ev=maidEvent('御花园');assert.ok(ev);var energy=E().energy,n=c.nights,count=S.consorts.length;
 pushEv(dowagerFuneralEvent(d));assert.match(curEv.text,/暂停宴饮与召幸/);choose(0);drain();assert.equal(mourningNightPause(),true);assert.match(viewCards(),/太后新丧，本月暂停翻牌召幸/);assert.match(consortNightReason(c),/本月暂停侍寝/);
 A.night(c.id);nightWith(c);maidNight(maid);assert.equal(E().energy,energy);assert.equal(c.nights,n);assert.match(maidAudiencePanel(),/disabled/);A.maidAudience();assert.equal(modalOpen,false);
 var choice=ev.choices.find(x=>x.t.includes('侍寝'));assert.equal(choice.cond(),false);choice.f();assert.equal(S.consorts.length,count);assert.equal(E().energy,energy);
 S.turn++;assert.equal(mourningNightPause(),false);assert.equal(consortNightReason(c),'');A.night(c.id);assert.equal(E().energy,energy-1);`);
});
test('pregnancy and delivery continue during mourning, without forbidden new conception',()=>{
 const b=world();b.run(`pushEv(dowagerFuneralEvent(d));choose(1);drain();c.preg=9;c.pregnancyCalendar={term:10,nights:[]};var old=S.children.length;PalaceActions.reset();A.endMonth();drain();assert.equal(S.turn,61);assert.ok(S.children.length>old);assert.equal(c.preg,0);assert.equal(mourningNightPause(),false);`);
});
test('mourning and pregnancy state survive reload and the following month clears the restriction',()=>{
 let b=world();b.run(`pushEv(dowagerFuneralEvent(d));choose(1);drain();c.preg=3;PalaceActions.reset();A.meetOnRoad(c.id,'回廊散步');save('auto');`);
 b=boot(135,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(mourningNightPause(),true);assert.match(consortNightReason(empress()),/暂停侍寝/);assert.equal(empress().preg,3);drain();A.endMonth();drain();assert.equal(mourningNightPause(),false);assert.equal(empress().preg,4);`);
});
test('older losses without a dated mourning record do not impose a new restriction',()=>{
 const b=world();b.run(`d.alive=false;delete d.mourning;migrateMourning();assert.equal(mourningNightPause(),false);assert.equal(consortNightReason(c),'');`);
});
test('a genuine v93 pending scene remains replayable and the new pause starts after it ends',()=>{
 const data=require('./fixtures/mourning-night-legacy-v93.json'),b=boot(136,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,93);choose(curEv.choices.length-1);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(mourningNightPause(),true);assert.match(consortNightReason(empress()),/本月暂停侍寝/);`);
});
