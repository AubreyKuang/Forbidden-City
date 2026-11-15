const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(495);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=72;S.consorts=[];S.children=[];E().energy=10;E().health=90;E().age=35;
 var c=makeGirl({sur:'沈',given:'知微',age:26,trait:'才女'});addConsort(c,4,'入宫');Object.assign(c,{enteredAt:24,nights:12,favor:80,hp:90});delete c.solitary;
 var m=makeGirl({sur:'许',given:'清容',age:24,trait:'温婉'});addConsort(m,2,'入宫');m.hp=90;
 var k=makeKid(m,'f','清和');k.born=S.turn-24;k.pendingName=false;PalaceActions.reset();`);return b;}
test('individual fertility varies deterministically and survives save, cold load and legacy migration',()=>{
 const {run,force}=world();run(`var values=new Set();for(var n=1;n<=100;n++)values.add(consortFertilityBase({seed:n}));assert.ok(values.size>50);var base=c.fertility.base;save('1');load('1');c=byId(c.id);assert.equal(c.fertility.base,base);delete c.fertility;var expected=consortFertilityBase(c);migrate();assert.equal(c.fertility.base,expected);var before=JSON.stringify(S);for(var n=0;n<5;n++)consortConceptionChance(c);assert.equal(JSON.stringify(S),before);`);force(.4321);run(`consortFertilityBase(c);consortConceptionChance(c);assert.equal(R(),.4321);`);
});
test('pregnancy probability uses individual constitution, age and current health, not rank or virtue',()=>{
 const {run}=world();run(`c.age=26;c.fertility.base=.08;var low=consortConceptionChance(c);c.fertility.base=.30;var high=consortConceptionChance(c);assert.ok(high>low*2);c.rank=8;c.fam.p=99;c.virtue=1;assert.equal(consortConceptionChance(c),high);c.age=40;assert.ok(consortConceptionChance(c)<high);c.age=26;c.hp=45;assert.ok(consortConceptionChance(c)<high);c.hp=90;c.trait='体弱';assert.ok(consortConceptionChance(c)<high);`);
});
test('conception gates protect minors, older women, illness, current pregnancy, recovery and absence',()=>{
 const {run}=world();run(`for(var patch of [{age:17},{age:50},{hp:24},{preg:3},{lastBirth:71},{delivery:{settled:false}},{cold:true},{gone:true},{alive:false}]){var old={...c};Object.assign(c,patch);assert.equal(consortConceptionChance(c),0,JSON.stringify(patch));Object.assign(c,old);delete c.delivery;}c.lastBirth=69;assert.ok(consortConceptionChance(c)>0);`);
});
test('the actual night action applies different conception chances without changing fixed constitution',()=>{
 for(const [base,expected] of [[.06,false],[.30,true]]){const b=world();b.run(`c.fertility.base=${base};`);b.force(.5,.16);
 b.run(`nightWith(c);assert.equal(!!c.preg,${expected});assert.equal(c.fertility.base,${base});`);}
});
test('a favored young consort who has waited years can petition without being thirty',()=>{
 const {run}=world();run(`assert.equal(fosterPetitionReason(c),'long-wait');assert.ok(fosterPetitionMatch(c,k));assert.match(fosterPetitionText(c,k),/入宫已4年/);assert.match(fosterPetitionText(c,k),/仍在亲自抚养/);assert.doesNotMatch(fosterPetitionText(c,k),/生母已不在/);`);
});
test('waiting requires actual years, repeated visits, favor and no previous birth, not a momentary gift',()=>{
 const {run}=world();run(`for(var patch of [{enteredAt:60},{enteredAt:undefined},{nights:7},{favor:69},{age:19},{preg:1},{hp:30},{rank:2},{lastBirth:30}]){var old={...c};Object.assign(c,patch);assert.equal(fosterPetitioner(c),false,JSON.stringify(patch));Object.assign(c,old);}var own=makeKid(c,'m','承和');own.alive=false;c.lastBirth=-99;assert.equal(fosterPetitioner(c),false);c.age=36;c.fam.p=50;assert.equal(fosterPetitionReason(c),'empty-household');assert.doesNotMatch(fosterPetitionText(c,k),/一直未曾生育/);`);
});
test('petitions respect current foster care, original maternal rank, heir status and child whereabouts',()=>{
 const {run}=world();run(`m.rank=5;assert.equal(fosterPetitionMatch(c,k),false);m.rank=2;k.birthTraits.mother.rank=6;assert.equal(fosterPetitionMatch(c,k),false);k.birthTraits.mother.rank=2;S.heir=k.id;assert.equal(fosterPetitionMatch(c,k),false);S.heir=null;k.born=S.turn-72;assert.equal(fosterPetitionMatch(c,k),false);k.born=S.turn-24;m.homeLeave={from:S.turn,until:S.turn+2};assert.equal(fosterPetitionMatch(c,k),false);delete m.homeLeave;var other=makeGirl({age:32});addConsort(other,5,'入宫');k.foster=other.id;assert.equal(fosterPetitionMatch(c,k),false);`);
});
test('generating a possible petition is read-only; queueing records the named wish and cooldown',()=>{
 const {run}=world();run(`var before=JSON.stringify(S),ev=fosterPetitionEvent(c);assert.ok(ev);assert.equal(JSON.stringify(S),before);ev.onQueue();assert.ok(c.story.some(s=>/请养之愿.*清和/s.test(s.t)));assert.equal(fosterPetitionEvent(c),null);assert.equal(k.foster,undefined);`);
});
test('a living mother is heard before reassignment and may keep her child',()=>{
 const {run}=world();run(`A.fosterWish(c.id);assert.equal(curEv.title,'愿留一盏灯');choose(0);assert.equal(curEv.title,'生母的心意');assert.equal(k.foster,undefined);assert.match(curEv.text,/仍想亲自养着/);choose(1);assert.equal(k.foster,undefined);assert.ok(m.story.some(s=>/生母.*生活/.test(s.t)));assert.ok(k.story.some(s=>/仍随生母/.test(s.t)));assert.ok(c.story.some(s=>/生母回应/.test(s.t)));`);
});
test('forcing foster care retains the biological mother and records her hurt',()=>{
 const {run}=world();run(`A.fosterWish(c.id);choose(0);choose(0);assert.equal(k.foster,c.id);assert.equal(k.mom,m.id);assert.ok(['悲恸','怨恨'].includes(xinOf(m)));assert.ok(m.story.some(s=>/被抱去/.test(s.t)));assert.ok(NPCMemory.recall(S,m.id).some(x=>JSON.stringify(x).includes('仍想亲自照看')));`);
});
test('agreed care needs real strain and trust, allows visits, and does not invent hostility',()=>{
 const {run}=world();run(`relAdd(m,c,60-relGet(m,c));assert.equal(motherAcceptsFoster(c,k),false);m.hp=48;assert.equal(motherAcceptsFoster(c,k),true);A.fosterWish(c.id);choose(0);assert.match(curEv.text,/愿商量/);choose(0);assert.equal(k.foster,c.id);assert.equal(k.visitRule,'open');assert.ok(!['悲恸','怨恨'].includes(xinOf(m)));assert.ok(m.story.some(s=>/仍有不舍/.test(s.t)));assert.equal(k.mom,m.id);`);
});
test('pending maternal discussion and chosen results restore without repeated adoption',()=>{
 const {run}=world();run(`A.fosterWish(c.id);choose(0);save('1');A.load('1');c=byId(c.id);m=byId(m.id);k=kidById(k.id);assert.equal(curEv.title,'生母的心意');assert.equal(k.foster,undefined);choose(0);var count=k.story.length;save('1');A.load('1');k=kidById(k.id);assert.equal(k.foster,c.id);assert.equal(k.story.length,count);assert.ok(modalResult);`);
});
test('an absent mother or a changed care arrangement invalidates the discussion',()=>{
 const {run}=world();run(`var ev=fosterMotherDiscussion(c,k);m.cold=true;assert.equal(ev.valid(),false);assert.equal(ev.choices[0].f(),null);assert.equal(k.foster,undefined);m.cold=false;c.preg=3;assert.equal(ev.valid(),false);assert.equal(ev.choices[1].f(),null);`);
});
test('solitary petition and biological-mother responses preserve rare maternal tenderness',()=>{
 const {run}=world();run(`c.solitary={path:'both'};assert.match(fosterWishWords(c,k),/喜欢独坐/);m.solitary={path:'letters'};var ev=fosterMotherDiscussion(c,k);assert.match(ev.text,/这孩子.*不一样/s);`);
});
