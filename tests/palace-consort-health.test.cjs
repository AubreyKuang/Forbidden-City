const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(17004);b.ctx.assert=assert;b.run(`A.start();drain();var c=harem()[0];E().treasury=1000;`);return b;}
test('ordinary and frail constitutions initialize once without story random draws',()=>{
 const b=world();b.run(`for(var seed=1;seed<=300;seed++){var p={id:seed,seed,trait:'温婉',hp:undefined};ensureConsortHealth(p);assert.ok(p.hp>=70&&p.hp<=95);var hp=p.hp;S.turn++;ensureConsortHealth(p);assert.equal(p.hp,hp);var weak={id:seed,seed,trait:'体弱'};ensureConsortHealth(weak);assert.ok(weak.hp>=38&&weak.hp<=56);}`);
 b.force(.234567);b.run(`consortHealthBase(c);assert.equal(R(),.234567);`);
});
test('migration fills missing fields without replacing known health or healing anyone on reload',()=>{
 let b=world();b.run(`var cid=c.id;delete c.hp;delete c.healthProfile;delete c.distinctions;var d=harem()[1];d.hp=27;delete d.healthProfile;save('1');`);
 b=boot(1,b.storage);b.ctx.assert=assert;b.run(`A.load('1');var c=harem()[0],d=harem()[1];assert.ok(Number.isFinite(c.hp));assert.equal(d.hp,27);var hp=c.hp;save('1');A.load('1');assert.equal(harem()[0].hp,hp);assert.equal(harem()[1].hp,27);`);
});
test('illness and its care have once-only damage and monthly recovery, with no passive decline of well people',()=>{
 const b=world();b.run(`c.hp=85;c.healthProfile={usual:85,lastTick:S.turn,hits:{}};consortHealthHurt(c,'ill');assert.equal(c.hp,67);
 consortHealthHurt(c,'ill');assert.equal(c.hp,67);consortHealthTreat(c);assert.equal(c.hp,75);
 S.turn++;consortHealthTick();assert.equal(c.hp,83);consortHealthTick();assert.equal(c.hp,83);S.turn++;consortHealthTick();assert.equal(c.hp,85);
 for(var n=0;n<120;n++){S.turn++;consortHealthTick();}assert.equal(c.hp,85);`);
});
test('real birth and loss reduce health once and treatment never bypasses three months of rest',()=>{
 const b=world();b.run(`c.hp=85;c.healthProfile={usual:85,lastTick:S.turn,hits:{}};c.preg=10;Math.random=()=>.4;
 birthEvent(c);assert.equal(c.hp,65);birthEvent(c);assert.equal(c.hp,65);var until=c.recovery.until;
 consortHealthTreat(c);assert.equal(c.recovery.until,until);assert.match(consortNightReason(c),/产后调养/);
 S.turn=c.recovery.turn;consortHealthTick();assert.equal(c.hp,73,'birth month is not an additional healing month');
 S.turn=until;consortHealthTick();assert.equal(consortRecovery(c),null);
 beginConsortRecovery(c,'loss');var hp=c.hp;beginConsortRecovery(c,'loss');assert.equal(c.hp,hp);assert.match(consortNightReason(c),/小产后调养/);`);
});
test('concealed loss health care does not disclose miscarriage in the public panel',()=>{
 const b=world();b.run(`c.preg=5;beginConsortRecovery(c,'loss',S.turn,true);assert.doesNotMatch(consortHealthPanel(c),/小产|假孕/);assert.equal(consortNightReason(c),'有孕在身');`);
});
test('medicine is cancellable, costs once and resumes after a full browser-context save load',()=>{
 let b=world();b.run(`c.hp=40;c.healthProfile={usual:80,lastTick:S.turn,hits:{}};A.consortHealthCare(c.id);choose(1);drain();assert.equal(c.hp,40);assert.equal(E().treasury,1000);A.consortHealthCare(c.id);save('auto');`);
 b=boot(2,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'太医调养');choose(0);save('auto');`);
 b=boot(3,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();var c=harem()[0];assert.equal(c.hp,48);assert.equal(E().treasury,990);A.consortHealthCare(c.id);assert.equal(modalOpen,false);
 S.turn++;consortHealthTick();assert.equal(c.hp,56);assert.ok(!consortTraitLabels(c).some(r=>r.id==='frail'));assert.equal(c.story.filter(e=>e.t.includes('【太医调养】')).length,1);`);
});
test('treating a higher current health never lowers it and very low health blocks night actions',()=>{
 const b=world();b.run(`c.healthProfile={usual:80,lastTick:S.turn,hits:{}};c.hp=95;consortHealthTreat(c);assert.equal(c.hp,95);
 c.hp=34;assert.match(consortNightReason(c),/身体虚弱/);c.hp=35;assert.doesNotMatch(consortNightReason(c),/身体虚弱/);`);
});
test('unrecoverable old scenes are not mutated by health or trait migrations',()=>{
 const payload=JSON.parse(JSON.stringify(require('./fixtures/consort-traits-legacy-v54.json').ill));payload.pendingActions.version=999;
 const storage=new Map([['chengongji_v1_auto',JSON.stringify(payload)]]),raw=storage.get('chengongji_v1_auto');const b=boot(4,storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,true);assert.equal(curEv.title,'未完事件无法续接');assert.equal(S.consorts[0].healthProfile,undefined);`);assert.equal(storage.get('chengongji_v1_auto'),raw);
});
