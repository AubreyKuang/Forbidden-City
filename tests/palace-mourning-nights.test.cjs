const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(134);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.month=1;S.year=6;E().energy=15;E().treasury=1000;var d=ensureDowager(),c=empress();c.hp=95;c.preg=0;c.lastBirth=-99;delete c.recovery;d.lastYears={deathTurn:60,askTurn:30,asked:true,warned:true,caregiver:null,lastCare:-1,history:[]};PalaceActions.reset();`);return b;}
test('new mourning blocks all nights, maid audiences, and stale encounters for six months',()=>{
 const b=world();b.run(`var maid=newMaid('尚衣局');maid.nights=1;maid.preg=0;maid.hp=95;var ev=maidEvent('御花园');assert.ok(ev);var energy=E().energy,n=c.nights,count=S.consorts.length;
 pushEv(dowagerFuneralEvent(d));assert.match(curEv.text,/暂停宴饮/);choose(0);drain();assert.equal(mourningNightPause(),true);assert.match(viewCards(),/太后服丧，暂停侍寝/);assert.match(consortNightReason(c),/暂停侍寝/);
 A.night(c.id);nightWith(c);maidNight(maid);assert.equal(E().energy,energy);assert.equal(c.nights,n);assert.match(maidAudiencePanel(),/disabled/);A.maidAudience();assert.equal(modalOpen,false);
 var choice=ev.choices.find(x=>x.t.includes('侍寝'));assert.equal(choice.cond(),false);choice.f();assert.equal(S.consorts.length,count);assert.equal(E().energy,energy);
 for(let i=1;i<6;i++){S.turn=60+i;assert.equal(mourningNightPause(),true);assert.equal(mourningNightMonths(),6-i);}S.turn=66;assert.equal(mourningNightPause(),false);assert.equal(consortNightReason(c),'');A.night(c.id);assert.equal(E().energy,energy-1);`);
});
test('pregnancy and delivery continue during mourning, without forbidden new conception',()=>{
 const b=world();b.run(`pushEv(dowagerFuneralEvent(d));choose(1);drain();c.preg=9;c.pregnancyCalendar={term:10,nights:[]};var old=S.children.length;PalaceActions.reset();A.endMonth();drain();assert.equal(S.turn,61);assert.ok(S.children.length>old);assert.equal(c.preg,0);assert.equal(mourningNightPause(),true);assert.equal(mourningNightMonths(),5);`);
});
test('mourning and pregnancy state survive reload and the following month retains the restriction',()=>{
 let b=world();b.run(`pushEv(dowagerFuneralEvent(d));choose(1);drain();c.preg=3;PalaceActions.reset();A.meetOnRoad(c.id,'回廊散步');save('auto');`);
 b=boot(135,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(mourningNightPause(),true);assert.match(consortNightReason(empress()),/暂停侍寝/);assert.equal(empress().preg,3);drain();A.endMonth();drain();assert.equal(mourningNightPause(),true);assert.equal(mourningNightMonths(),5);assert.equal(empress().preg,4);`);
});
test('older losses without a dated mourning record do not impose a new restriction',()=>{
 const b=world();b.run(`d.alive=false;delete d.mourning;migrateMourning();assert.equal(mourningNightPause(),false);assert.equal(consortNightReason(c),'');`);
});
test('a genuine v93 pending scene remains replayable and the new pause starts after it ends',()=>{
 const data=require('./fixtures/mourning-night-legacy-v93.json'),b=boot(136,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,93);choose(curEv.choices.length-1);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(mourningNightPause(),true);assert.match(consortNightReason(empress()),/暂停侍寝/);`);
});
test('the emperor may choose a full year, and that choice survives monthly saves and reload',()=>{
 let b=world();b.run(`S.turn=59;S.month=5;c.preg=3;PalaceActions.reset();A.endMonth();for(let i=0;modalOpen&&curEv.title!=='太后崩逝 · 宫中举哀'&&i<100;i++){if(modalResult)nextEv();else choose(0);}assert.equal(curEv.title,'太后崩逝 · 宫中举哀');choose(1);if(modalResult)nextEv();assert.equal(curEv.title,'慈宁宫 · 守孝之期');save('auto');`);
 b=boot(137,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'慈宁宫 · 守孝之期');choose(1);drain();assert.equal(mourningOf().nightChoice,12);assert.equal(mourningNightMonths(),12);assert.equal(empress().preg,4);save('auto');`);
 b=boot(138,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(mourningNightMonths(),12);assert.equal(mourningOf().nightChoice,12);var start=mourningOf().turn;S.turn=start+11;assert.equal(mourningNightMonths(),1);assert.match(viewCards(),/还需1个月/);S.turn=start+12;assert.equal(mourningNightPause(),false);`);
});
