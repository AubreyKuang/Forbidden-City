const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function setup(){
 const b=boot(1291);b.ctx.assert=assert;
 b.run(`A.start();drain();var q=empress();for(const p of harem())p.nights=1;
 var m=makeGirl({age:23,trait:'淡泊'});addConsort(m,2,'选秀入宫');
 m.enteredAt=0;m.hp=85;m.favor=80;m.aff=90;q.hp=85;S.turn=11;
 var mid=m.id;PalaceActions.reset();`);
 return b;
}
test('one year is required, regardless of favor; impermissible nights and recorded prior nights are excluded',()=>{
 const b=setup();b.run(`assert.equal(queenFirstNightReminder(),null);S.turn=12;
 assert.ok(queenFirstNightReminder());for(const change of [{nights:1},{imperialNights:[0]},{age:17},{cold:true},{homeLeave:{}},{templeStay:{}},{cardWithdrawn:true},{preg:1},{maid:true},{hp:30},{outerHouseholdId:1}]){
 const original={...m};Object.assign(m,change);assert.equal(queenFirstNightReminder(),null);
 for(const field of Object.keys(change)){if(field in original)m[field]=original[field];else delete m[field];}}
 q.homeLeave={};assert.equal(queenFirstNightReminder(),null);delete q.homeLeave;
 delete m.enteredAt;assert.equal(queenFirstNightReminder(),null);m.accessionArrival={gen:S.gen,started:0};assert.ok(queenFirstNightReminder());
 m.lastBirth=1;var adopted=makeKid(q,'f','宁宁');adopted.foster=m.id;
 assert.ok(queenFirstNightReminder());var ev=queenFirstNightReminder();m.cardWithdrawn=true;assert.ok(!eventStillValid(ev));assert.ok(!S.flags.queenFirstNight);`);
});
test('the empress mentions the longest unmentioned wait first and a greeting neither spends energy nor counts as a night',()=>{
 const b=setup();b.run(`var late=makeGirl({age:22});addConsort(late,3,'选秀入宫');late.enteredAt=3;late.hp=85;S.turn=20;
 var energy=E().energy,ev=queenFirstNightReminder();assert.equal(ev.firstNightConsort,mid);pushEv(ev);
 assert.match(curEv.text,/一年零八个月/);choose(1);drain();assert.equal(m.nights,0);assert.equal(E().energy,energy);
 assert.ok(m.story.some(e=>e.t.includes('中宫传问安')));assert.ok(q.story.some(e=>e.t.includes(fullName(m))));
 S.turn+=5;assert.equal(queenFirstNightReminder(),null);S.turn++;ev=queenFirstNightReminder();assert.equal(ev.firstNightConsort,late.id);pushEv(ev);choose(0);drain();
 S.turn+=6;assert.equal(queenFirstNightReminder().firstNightConsort,mid);E().energy=0;assert.equal(queenFirstNightReminder().choices[2].cond(),false);`);
});
test('monthly reminder restores at its choices and first night follows the normal route exactly once',()=>{
 let b=setup();const id=b.run('mid');
 b.run(`A.endMonth();for(let i=0;modalOpen&&curEv.title!=='中宫奏事 · 久未承召'&&i<100;i++){if(modalResult)nextEv();else choose(0);}
 assert.equal(curEv.title,'中宫奏事 · 久未承召');save('auto');`);
 b=boot(42,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
 assert.equal(curEv.title,'中宫奏事 · 久未承召');var energy=E().energy,m=byId(${id});choose(2);
 assert.equal(curEv.title,'春宵');assert.equal(m.nights,1);assert.equal(E().energy,energy-1);choose(1);drain();
 assert.equal(empress().story.filter(e=>e.t.includes('【久未承召】')).length,1);S.turn+=24;assert.equal(queenFirstNightReminder(),null);`);
});
