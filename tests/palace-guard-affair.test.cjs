const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function start(){const b=boot(55001);b.ctx.assert=assert;b.run(`A.start();drain();E().energy=20;E().treasury=1000;A.establishJinyiwei();choose(0);drain();A.recruitIntelligenceAgent('guard');var guard=intelligenceAgent('guard'),c=harem().find(x=>x.rank!==8);c.age=22;A.assignPersonalGuard(c.id);assert.equal(guard.protection.consort,c.id);`);return b;}
function develop(b){b.force(.001,.001);b.run(`for(let month=1;month<=30;month++){S.turn=month;guardProtectionTick();}assert.equal(guard.protection.stage,3);assert.equal(guard.protection.discovered,true);`);}
test('guard relationship develops across months and discovery survives a save',()=>{
 let b=start();develop(b);b.run(`assert.ok(c.story.some(e=>e.t.includes('挡过一场雨')));save('auto');`);
 b=boot(3,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var guard=intelligenceAgent('guard'),c=byId(guard.protection.consort),affairScene=guardAffairEvent();assert.equal(affairScene.title,'锦衣卫密报 · 守宫旧事');assert.match(affairScene.text,/私会/);assert.match(intelligencePanel(),/保密值/);
  pushEv(affairScene);choose(0);drain();assert.match(guard.protection.ended,/保全/);assert.ok(c.story.some(e=>e.t.includes('私下来往被发现')));assert.equal(guardAffairEvent(),null);`);
});

test('transferring the guard ends the secret and affects the protected consort',()=>{
 const b=start();develop(b);b.run(`var mood=c.mood,loyalty=guard.loyalty;pushEv(guardAffairEvent());choose(1);drain();
  assert.equal(c.mood,Math.max(0,mood-8));assert.equal(guard.loyalty,Math.max(0,loyalty-8));assert.match(guard.protection.ended,/调离/);`);
});

test('a guard in love may conceal evidence involving the protected consort',()=>{
 const b=start();b.run(`guard.protection.stage=2;var file=openPalaceCase({kind:'harem',title:'香囊疑案',crime:'香囊藏麝',culprit:c.id,victim:null});
  A.intelligenceDispatch('guard',file.id,c.id);assert.equal(intelligenceState().reports[0].conclusion,false);`);
});

test('the discovery event returns after refresh with its choices intact',()=>{
 let b=start();b.run(`guard.protection.stage=3;guard.protection.months=30;guard.protection.discovered=true;
  E().energy=4;A.endMonth();for(let i=0;modalOpen&&curEv.title!=='锦衣卫密报 · 守宫旧事'&&i<100;i++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'锦衣卫密报 · 守宫旧事');save('auto');`);
 b=boot(3,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫密报 · 守宫旧事');
  choose(1);drain();assert.match(intelligenceAgent('guard').protection.ended,/调离/);`);
});

test('framing an innocent leaves consequences and a chronicle',()=>{
 const b=start();b.run(`var innocent=makeGirl({});addConsort(innocent,2,'选秀入宫');`);develop(b);
 b.run(`var mood=innocent.mood,power=innocent.fam.p;pushEv(guardAffairEvent());choose(2);drain();
  assert.equal(innocent.mood,Math.max(0,mood-12));assert.equal(innocent.fam.p,Math.max(0,power-5));assert.ok(innocent.story.some(e=>e.t.includes('不白之冤')));`);
});

test('a devoted consort need not develop an affair simply because a guard was assigned',()=>{
 const b=start();b.run(`c.aff=90;for(let month=1;month<=36;month++){S.turn=month;guardProtectionTick();}
  assert.equal(guard.protection.stage,1);assert.equal(guard.protection.discovered,false);assert.equal(guardAffairEvent(),null);`);
});

test('verified discipline reduces rank and affects her family and son once',()=>{
 const b=start();b.run(`var son=makeKid(c,'m','承安');son.born=S.turn-240;son.sup=50;`);develop(b);
 b.run(`var rank=c.rank,power=c.fam.p;pushEv(guardAffairEvent());assert.match(curEv.choices[3].t,/降位/);choose(3);drain();
  assert.equal(c.rank,rank-1);assert.equal(c.fam.p,Math.max(0,power-5));assert.equal(son.sup,47);
  assert.ok(son.story.some(e=>e.t.includes('生母因宫中私情被降位')));assert.equal(guardAffairEvent(),null);`);
});
