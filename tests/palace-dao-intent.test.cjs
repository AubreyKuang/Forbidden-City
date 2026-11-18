const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(593);b.ctx.assert=assert;b.run(`A.start();drain();var c=harem()[0];c.trait='温婉';c.solitary=null;c.t2='畏寒';c.like='诗书';c.mood=20;c.hp=90;c.preg=0;
 for(var seed=1;seed<1000;seed++){c.seed=seed;if(!daoInclined(c))break;}delete c.daoPractice;`);return b;}
test('one unhappy visit does not turn an ordinary consort into a permanent Daoist regular',()=>{
 const b=world();b.run(`assert.equal(daoInterest(c),1);recordDaoVisit(c);assert.equal(c.daoPractice.path,'visits');c.mood=80;
 assert.equal(daoInterest(c),0);assert.equal(daoVisitors().includes(c),false);assert.doesNotMatch(daoPracticePanel(c),/潜心问道/);`);
});
test('old inflated counts retain all memories but do not assert an unsuitable religious commitment',()=>{
 const b=world();b.run(`c.daoPractice={path:'dao',visits:100,lastVisit:S.turn,lastLine:'曾为母亲祈愿。'};c.mood=80;
 var before=JSON.stringify(c);assert.equal(daoInterest(c),0);assert.match(daoPracticePanel(c),/听讲经历.*100/);
 assert.doesNotMatch(daoPracticePanel(c),/潜心问道/);assert.equal(daoLifeVoice(c),null);assert.equal(JSON.stringify(c),before);`);
});
test('true solitary Daoists and a limited stable share of other temperaments can remain devoted',()=>{
 const b=world();b.run(`c.solitary={path:'dao'};c.daoPractice={path:'dao',visits:6,lastVisit:S.turn};assert.equal(daoInterest(c),3);assert.match(daoPracticePanel(c),/潜心问道/);
 c.solitary=null;var counts=[];for(var trait of ['温婉','淡泊','好学']){c.trait=trait;var total=0;for(var seed=1;seed<=10000;seed++){c.seed=seed;if(daoInclined(c))total++;}counts.push(total);}
 assert.ok(counts[0]>120&&counts[0]<400);assert.ok(counts[1]>4200&&counts[1]<4800);assert.ok(counts[2]>1500&&counts[2]<2100);
 var before=daoInclined(c);S.turn+=120;assert.equal(daoInclined(c),before);`);
});
test('Buddhist characters do not gain a Daoist devotion tag from previous attendance',()=>{
 const b=world();b.run(`c.solitary={path:'dao'};c.daoPractice={path:'dao',visits:100};c.t2='信佛';
 assert.equal(daoInterest(c),0);assert.doesNotMatch(daoPracticePanel(c),/潜心问道/);c.t2='畏寒';c.like='佛经';assert.equal(daoInterest(c),0);assert.doesNotMatch(daoPracticePanel(c),/潜心问道/);`);
});
test('ten years of monthly attendance does not convert a whole harem and preserves personalities',()=>{
 const b=world();b.run(`S.consorts=[];S.children=[];var originals=[];
 for(var i=0;i<38;i++){var p=makeGirl({trait:Object.keys(TRAITS)[i%19]});addConsort(p,1,'入宫');p.solitary=null;p.like='诗书';p.t2='畏寒';p.hp=90;p.preg=0;p.mood=20;originals.push(p.trait);}
 for(var month=0;month<120;month++){S.turn++;S.consorts.forEach(p=>p.mood=month<3?20:80);daoLifeTick();}
 assert.ok(S.consorts.filter(daoDevoted).length<12);assert.deepEqual(S.consorts.map(p=>p.trait),originals);`);
});
test('children’s existing Daoist and immortal paths retain their potential and record',()=>{
 const b=world();b.run(`var k=makeKid(c,'f','昭瑶');k.born=S.turn-156;k.pendingName=false;k.hp=90;k.daoPractice={path:'dao',visits:6};k.immortalTalent='冰灵根';
 assert.equal(daoInterest(k),3);assert.match(daoPracticePanel(k),/潜心问道/);assert.equal(immortalDiscover(k),true);`);
});
for(const version of [52,53])test('published v'+version+' monthly attendance replays unchanged before the corrected labels activate',()=>{
 const payload=require('./fixtures/selection-and-dao-legacy-v'+version+'.json').daoMonth,b=boot(593,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});assert.equal(daoIntentActive(),false);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(daoIntentActive(),true);`);
});
