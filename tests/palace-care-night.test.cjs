const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(934);b.ctx.assert=assert;b.run(`A.start();drain();var d=ensureDowager(),q=empress();q.hp=95;q.preg=0;q.lastBirth=-99;delete q.recovery;
var c=makeGirl({sur:'林',given:'玉',age:25,trait:'温婉',fam:{t:'官员',p:30}});addConsort(c,3,'入宫');c.hp=95;c.preg=0;c.lastBirth=-99;
var c2=makeGirl({sur:'陆',given:'兰',age:25,trait:'温婉',fam:{t:'官员',p:30}});addConsort(c2,3,'入宫');c2.hp=95;c2.preg=0;c2.lastBirth=-99;
S.turn=94;E().energy=10;d.lastYears={deathTurn:100,askTurn:70,asked:true,warned:true,caregiver:null,lastCare:-1,history:[]};PalaceActions.reset();`);return b;}
test('dowager caregiver cannot be summoned, is visible on cards and is freed on replacement or end of care',()=>{
 const b=world();b.run(`assert.ok(appointDowagerCaregiver(d,c));var before=E().energy,n=c.nights;assert.match(consortNightReason(c),/太后侍疾/);assert.match(viewCards(),/太后侍疾/);A.night(c.id);nightWith(c);assert.equal(E().energy,before);assert.equal(c.nights,n);
 assert.ok(appointDowagerCaregiver(d,c2));assert.equal(consortNightReason(c),'');assert.match(consortNightReason(c2),/太后侍疾/);d.alive=false;assert.equal(consortNightReason(c2),'');`);
});
test('sick queen can receive an assigned caregiver who is blocked until the recorded illness ends',()=>{
 const b=world();b.run(`q.trait='体弱';Math.random=()=>.99;var ill=HAREM.find(f=>f.name==='ill')();assert.equal(ill.por,q);pushEv(ill);var i=curEv.choices.findIndex(x=>x.t.includes('安排妃嫔侍疾'));assert.ok(i>=0);choose(i);assert.equal(curEv.title,'中宫 · 安排侍疾');i=curEv.choices.findIndex(x=>x.person===c);choose(i);drain();
 assert.equal(queenCaregiver(),c);assert.match(consortNightReason(c),/皇后侍疾/);var before=E().energy,n=c.nights;A.night(c.id);nightWith(c);assert.equal(E().energy,before);assert.equal(c.nights,n);
 assert.match(viewCards(),/皇后侍疾/);UI.sel=q.id;assert.match(viewConsort(),/安排或更换侍疾妃嫔/);assert.equal(dowagerCareCandidates().includes(c),false);
 S.turn=q.illnessRecovery.until;assert.equal(queenCaregiver(),null);assert.equal(consortNightReason(c),'');`);
});
test('queen care can be reassigned or cancelled and does not occupy dowager caregiver',()=>{
 const b=world();b.run(`appointDowagerCaregiver(d,c);q.illnessRecovery={turn:S.turn,until:S.turn+2};var ev=queenCareSelection(q);assert.ok(!ev.choices.some(x=>x.person===c));pushEv(ev);choose(curEv.choices.findIndex(x=>x.person===c2));drain();assert.equal(queenCaregiver(),c2);
 A.queenCare();choose(curEv.choices.length-1);drain();assert.equal(queenCaregiver(),null);assert.equal(consortNightReason(c2),'');`);
});
test('pending queen-care selection survives reload and charges treatment only once',()=>{
 let b=world();b.run(`q.illnessRecovery={turn:S.turn,until:S.turn+2};PalaceActions.reset();A.queenCare();save('auto');`);
 const id=b.run('c.id');b=boot(935,b.storage);b.ctx.assert=assert;b.ctx.careId=id;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'中宫 · 安排侍疾');choose(curEv.choices.findIndex(x=>x.person?.id===careId));drain();assert.match(consortNightReason(byId(careId)),/皇后侍疾/);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(consortNightReason(byId(careId)),/皇后侍疾/);`);
});
test('a genuine v89 pending scene finishes before the new care restriction takes effect',()=>{
 const payload=require('./fixtures/dowager-care-night-legacy-v89.json'),b=boot(936,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,89);var id=ensureDowager().lastYears.caregiver;assert.ok(curEv.choices.some(x=>x.t.includes('侍寝')));choose(curEv.choices.length-1);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.match(consortNightReason(byId(id)),/太后侍疾/);`);
});
