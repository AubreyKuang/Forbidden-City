const {test}=require('node:test'),assert=require('node:assert/strict');
const {secretWorld}=require('./palace-secret-world.cjs');
const {boot}=require('./playtest-harness.cjs');
function setup(){
 const game=secretWorld('romance');game.ctx.assert=assert;
 game.run(`var pair=Object.values(S.palaceRomance.pairs)[0];
   pair.status='active';pair.pending=true;var seedWatch=33;Math.random=()=>((seedWatch=(Math.imul(seedWatch,1664525)+1013904223)>>>0)/4294967296);PalaceActions.reset();`);
 return game;
}
test('confirmed palace affair gets a compulsory named monthly report, survives reload, and can be dealt with immediately',()=>{
 let g=setup();
 g.run(`A.endMonth();for(let i=0;modalOpen&&!curEv.title.includes('密报 · 皇子与宫眷')&&i<120;i++){if(modalResult)nextEv();else choose(0);}
 assert.equal(curEv.title,'锦衣卫密报 · 皇子与宫眷');assert.ok(curEv.text.includes(fullName(c)));assert.match(curEv.text,/承安/);
 assert.equal(jinyiwei().rareNotices.filter(n=>n.title==='宫闱私情').length,1);save('auto');`);
 g=boot(11,g.storage);g.ctx.assert=assert;
 g.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫密报 · 皇子与宫眷');
 choose(0);assert.equal(curEv.title,'回廊相依');choose(0);drain();assert.equal(Object.values(S.palaceRomance.pairs)[0].status,'ended');assert.equal(princeAffairReports().length,0);
 assert.equal(jinyiwei().rareNotices.filter(n=>n.title==='宫闱私情').length,1);`);
});
test('ordinary letters and suspicions stay out of the report, a true concealed meeting does not disclose paternity',()=>{
 const g=setup();g.run(`pair.stage=2;assert.equal(princeAffairReports().length,0);pair.conceivedAt=S.turn;S.jinyiwei=null;
 pushEv(princeAffairReports()[0]);assert.match(curEv.title,/值房密报/);assert.doesNotMatch(curEv.text,/有孕|身世|生父/);
 choose(0);drain();pair.stage=3;assert.equal(princeAffairReports().length,0);assert.equal(S.log.filter(e=>e.t.includes('宫门值房密报')).length,1);`);
});
test('a confirmed guard relationship is discovered even when a random discovery would fail',()=>{
 const g=setup();g.run(`A.recruitIntelligenceAgent('guard');var man=intelligenceAgent('guard');c.age=24;A.assignPersonalGuard(c.id);
 var bond=man.protection;bond.months=29;bond.stage=2;bond.secrecy=100;S.turn++;Math.random=()=>.999;
 guardProtectionTick();assert.equal(bond.discovered,true);pushEv(guardAffairEvent());assert.match(curEv.title,/锦衣卫密报/);
 assert.ok(curEv.text.includes(man.name)&&curEv.text.includes(fullName(c)));choose(1);drain();assert.equal(guardAffairEvent(),null);`);
});
test('all fixed consorts are exempt even with a restless seed, including palace guard assignments',()=>{
 const g=setup();g.run(`var lady=byId(pair.consort),pr=kidById(pair.prince);
 lady.age=22;lady.aff=10;lady.favor=10;lady.virtue=40;lady.hobby='读书';lady.trait='好学';
 pr.lit=75;pr.vir=40;S.rel[rk(pr,lady)]=40;
 while(!restlessDisposition(lady))lady.seed++;
 for(const identity of [{gouyi:true},{hongjian:true},...Object.keys(STORY_CAST).map(fixedStory=>({fixedStory}))]){
   Object.assign(lady,identity);assert.equal(restlessDisposition(lady),false);assert.doesNotMatch(consortTraitTags(lady),/不安于室/);
   assert.equal(romanceAffinity(pr,lady),0);for(const field of Object.keys(identity))delete lady[field];
 }
 reconcileConsortDistinctions();assert.ok(lady.distinctions.noted.restless);
 lady.fixedStory='suheng';story(lady,'留存的旧事');reconcileConsortDistinctions();assert.ok(!lady.distinctions.noted.restless);assert.ok(lady.story.some(e=>e.t==='留存的旧事'));assert.ok(!lady.story.some(e=>e.t.startsWith('【人物特质·不安于室】')));
 pair.stage=2;palaceRomanceTick();assert.equal(pair.status,'ended');
 A.recruitIntelligenceAgent('guard');A.assignPersonalGuard(lady.id);var bond=intelligenceAgent('guard').protection;
 Math.random=()=>0;for(let n=0;n<30;n++){S.turn++;guardProtectionTick();}assert.equal(bond.stage,1);assert.ok(!bond.ended);assert.equal(guardAffairEvent(),null);
 bond.stage=2;bond.months=29;S.turn++;guardProtectionTick();assert.equal(bond.stage,1);assert.ok(!bond.discovered);`);
});
test('a marked ordinary queen can have both prince and night guard encounters while an unmarked queen cannot',()=>{
 const g=setup();g.run(`var lady=byId(pair.consort),pr=kidById(pair.prince);
 Object.assign(lady,{age:22,aff:10,favor:10,virtue:40,hobby:'读书',trait:'好学',rank:8});pr.lit=75;pr.vir=40;S.rel[rk(pr,lady)]=40;
 for(const x of harem())if(x!==lady)x.aff=90;
 while(restlessDisposition(lady))lady.seed++;
 assert.equal(romanceAffinity(pr,lady),0);
 while(!restlessDisposition(lady))lady.seed++;
 for(const rank of [5,6,7,8]){lady.rank=rank;assert.ok(romanceAffinity(pr,lady)>0);}
 S.turn+=20;while(voiceHash(E().seed+':guard-tryst:'+S.turn+':roll')%100>=6)S.turn++;
 lady.fixedStory='ayimu';assert.equal(guardTrystEvent(),null);delete lady.fixedStory;
 var ev=guardTrystEvent();assert.match(ev.title,/锦衣卫密报/);pushEv(ev);assert.equal(lady.guardTryst.affairReported,true);choose(0);drain();assert.ok(lady.guardTryst.order);
 assert.equal(jinyiwei().rareNotices.filter(n=>n.text.includes(fullName(lady))&&n.text.includes('换班')).length,1);`);
});

function restlessWorld(){
 const g=boot(231);g.ctx.assert=assert;
 g.run(`A.start();drain();var c=harem().find(x=>x.rank!==8);Object.assign(c,{age:25,aff:15,favor:10,trait:'活泼',solitary:null});
 while(!restlessDisposition(c))c.seed++;var traits=c.story.length;
 var rolls=(seed,turn)=>{const key=seed+':private-gate:'+S.gen+':'+c.id+':'+turn;return ['invitation','witness'].map(k=>voiceHash(key+':'+k)/0x100000000);};
 var fit=(turn,condition)=>{for(var seed=1;seed<1e5;seed++){if(condition(...rolls(seed,turn))){E().seed=seed;return;}}throw Error('no matching seed');};`);
 return g;
}
test('restless chances build once per eligible month, survive saving and never apply to minors or authored companions',()=>{
 const g=restlessWorld();g.run(`c.aff=80;for(let i=1;i<=40;i++){S.turn=i;restlessTrystTick();restlessTrystTick();assert.equal(restlessTrystBonus(c),.18*i/(12+i));}assert.equal(c.restlessCourt.tryst,undefined);
 c.aff=10;S.turn++;fit(S.turn,(r,w)=>r>.04&&r<.14&&w>.4);restlessTrystTick();var secret=c.restlessCourt.tryst;
 assert.ok(secret);assert.equal(secret.count,1);assert.equal(secret.witnessed,undefined);assert.equal(pendingRestlessTrysts().length,0);
 assert.ok(!S.log.some(e=>e.t.includes(secret.guard)));assert.ok(!c.story.slice(traits).some(e=>e.t.includes(secret.guard)));
 save('auto');A.load('auto');c=byId(c.id);assert.equal(c.restlessCourt.tryst.guard,secret.guard);restlessTrystTick();assert.equal(c.restlessCourt.tryst.count,1);
 S.turn++;fit(S.turn,(r,w)=>r>.15&&r<.22&&w>.5);restlessTrystTick();assert.equal(c.restlessCourt.tryst.count,2);assert.equal(restlessTrystBonus(c),.18*42/54);
 for(const prop of [{age:17},{fixedStory:'ayimu',age:25},{fixedStory:null,homeLeave:{}}]){
  Object.assign(c,prop);S.turn++;restlessTrystTick();assert.equal(c.restlessCourt.last,42);
 }`);
});
test('an unseen repeat meeting leads to one dated compulsory report, a reloadable choice and one chronicle entry',()=>{
 let g=restlessWorld();g.run(`S.turn=23;S.month=2;E().energy=5;c.restlessCourt={months:20,last:22,tryst:{count:1,guard:'程安',first:'永宁二年正月',turn:22,last:22}};
 fit(24,(r,w)=>r<.18&&w<.14);PalaceActions.reset();A.endMonth();
 for(let i=0;modalOpen&&!curEv.title.includes('密报 · 宫门私约')&&i<160;i++){if(modalResult)nextEv();else choose(0);}
 assert.ok(curEv.title.includes('密报 · 宫门私约'));assert.match(curEv.text,/程安/);assert.match(curEv.text,/共赴约二次/);
 assert.equal(c.restlessCourt.months,0);assert.equal(c.restlessCourt.tryst.affairReported,true);save('auto');`);
 g=boot(2,g.storage);g.ctx.assert=assert;g.run(`A.load('auto');assert.ok(!PalaceActions.blocked);assert.ok(curEv.title.includes('密报 · 宫门私约'));
 var c=harem().find(x=>x.restlessCourt?.tryst?.guard==='程安');choose(1);drain();assert.equal(c.restlessCourt.tryst,undefined);
 assert.equal(c.story.filter(e=>e.t.includes('永宁二年正月初次与侍卫程安')).length,1);assert.equal(pendingRestlessTrysts().length,0);
 S.turn++;restlessTrystTick();assert.equal(c.restlessCourt.months,1);`);
});
