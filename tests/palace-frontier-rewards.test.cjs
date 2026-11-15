const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(family=false){const b=boot(821);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=10;E().treasury=900;S.consorts=[];S.children=[];
 var e=frontierCreateGeneral();e.c.willing=true;e.p.temperament='圆融';e.p.office='参将';
 ${family?`addConsort(e.c,4,'将门入宫');S.flags.frontierHouses=[];e=officialEntry(e.key);e.h.relatives=[];var sister=addNatalPerson(e.c,e.h,'f',22,791,false);sister.married=false;delete sister.spouse;delete sister.betrothal;sister.willing=true;for(var role of brotherRoles(e.h))e.h[role].retired=true;`:''}
 var cid=e.c.id,pid=e.p.id;PalaceActions.reset();`);return b;}
function win(b){b.force(0);b.run(`var outcome=frontierDispatch(e);var r=S.flags.frontierCampaigns.at(-1);`);}
test('generic court dispatch names the actual commander and queues a single reward',()=>{
 const b=world();b.run(`S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1};PalaceActions.reset();A.court();assert.equal(curEv.title,'北境告急');assert.equal(curEv.person,undefined);`);b.force(0);
 b.run(`choose(0);assert.match(modalResult.text,/王师告捷/);var r=S.flags.frontierCampaigns[0];assert.equal(r.commander.id,cid);assert.equal(r.name,e.p.name);assert.equal(E().treasury,600);
 assert.ok(e.p.story.some(s=>s.t.includes('奉旨领兵')));assert.ok(e.p.story.some(s=>s.t.includes('王师告捷')));nextEv();assert.equal(curEv.title,'北境论功行赏');
 choose(0);assert.equal(e.p.office,'副将');var funds=E().treasury;assert.equal(frontierReward(r,'silver'),null);assert.equal(E().treasury,funds);`);
});
test('named family commander retains his identity, promotes in his own career and reaches palace memories',()=>{
 const b=world(true);b.run(`S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1,person:cid};PalaceActions.reset();A.court();assert.match(curEv.choices[3].t,/领兵/);`);b.force(0);
 b.run(`choose(3);var r=S.flags.frontierCampaigns.at(-1);assert.equal(r.commander.personId,pid);assert.equal(r.commander.key,e.key);assert.equal(E().treasury,650);nextEv();choose(0);
 assert.equal(e.p.office,'副将');assert.ok(e.c.story.some(s=>s.t.includes(e.p.name)&&s.t.includes('王师告捷')));assert.ok(e.c.story.some(s=>s.t.includes(e.p.name)&&s.t.includes('晋为副将')));
 assert.ok(e.c.familyDuty);assert.ok(NPCMemory.recall(S,cid).some(m=>m.subject===pid));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(frontierEntry(S.flags.frontierCampaigns[0].commander).p.office,'副将');`);
});
test('commander requests follow temperament, remain stable and use the Mulan allusion for silver',()=>{
 for(const [temperament,request] of [['进取','promotion'],['谨慎','silver'],['持正','silver'],['圆融','daughter']]){const b=world();b.run(`e.p.temperament='${temperament}'`);win(b);b.run(`assert.equal(r.request,'${request}');var one=frontierRequestEvent(r).text;assert.equal(frontierRequestEvent(r).text,one);if(r.request==='silver')assert.match(one,/不求尚书郎/);`);}
});
test('silver is budgeted once and a recorded merit is not treated as an already paid reward',()=>{
 const b=world();win(b);b.run(`E().treasury=29;assert.equal(frontierReward(r,'silver'),null);assert.equal(r.reward,undefined);E().treasury=30;assert.ok(frontierReward(r,'silver'));assert.equal(E().treasury,0);assert.equal(e.p.rewardSilver,30);assert.equal(frontierReward(r,'silver'),null);`);
 const c=world();win(c);c.run(`assert.ok(frontierReward(r,'record'));assert.equal(e.p.lastReward,undefined);assert.equal(e.p.rewardedMerit,undefined);`);
});
for(const family of [false,true])test('adult recommended daughter preserves identity and parentage; military reward remains due '+family,()=>{
 const b=world(family);win(b);b.run(`var d=frontierDaughter(e),identity={id:d.id,seed:d.g.seed,name:d.name},event=frontierDaughterEvent(r);assert.equal(event.title,'功臣荐女');
 event.choices[0].f();var admitted=byId(identity.id);assert.ok(admitted);assert.equal(admitted.seed,identity.seed);assert.equal(fullName(admitted),identity.name);assert.equal(houseOf(admitted).father.id,pid);assert.equal(r.reward,undefined);
 assert.equal(frontierDaughterEvent(r)?.title,'北境论功行赏');assert.ok(frontierReward(r,'silver'));assert.ok(admitted.story.some(s=>s.t.includes('北境')&&s.t.includes('金银')));
 ${family?`assert.equal(admitted.natalOrigin.host,cid);assert.ok(paternalFamily(admitted).includes(e.c));`:''}`);
});
test('unwilling, underage, married and betrothed relatives do not receive an admission choice',()=>{
 for(const patch of ['sister.born=S.turn-17*12','sister.married=true','sister.betrothal={turn:S.turn}','sister.frontierDeclined=true']){const b=world(true);b.run(patch);win(b);b.run(`assert.equal(frontierDaughter(e),null);assert.notEqual(r.request,'daughter');`);}
 const b=world();b.run('e.c.willing=false');win(b);b.run(`var event=frontierDaughterEvent(r);assert.equal(event.choices.length,1);assert.match(event.text,/更愿在宫外/);event.choices[0].f();assert.equal(byId(cid),undefined);assert.ok(frontierCanReward(r));assert.equal(frontierDaughter(e),null);assert.ok(frontierReward(r,'promotion'));`);
});
test('brothers do not invent adult daughters; retired generals can receive silver but cannot be promoted',()=>{
 const b=world(true);b.run(`e.h.brother={name:'顾云深',age:28,alive:true,career:'official',post:'参将',story:[]};houseOf(e.c);e=officialEntry(cid+':brother');assert.equal(frontierDaughter(e),null);`);win(b);b.run(`e.p.retired=true;assert.equal(frontierPromotion(e),null);assert.equal(frontierReward(r,'promotion'),null);assert.ok(frontierReward(r,'silver'));`);
});
test('defeat has no reward; death and a later generation invalidate an unclaimed award',()=>{
 for(const named of [false,true]){const b=world(true);b.force(.99);b.run(`frontierDispatch(e,{named:${named}});var r=S.flags.frontierCampaigns.at(-1);assert.equal(r.outcome,'defeat');assert.equal(frontierRewardEvent(r),null);assert.equal(frontierReward(r,'silver'),null);assert.equal(officialAlive(e.p),${!named});`);}
 for(const patch of ['e.p.alive=false','e.p.exiled=true','e.p.dismissed=true','S.gen++','S.over=true']){const b=world();win(b);b.run(`${patch};assert.ok(!frontierCanReward(r));assert.equal(frontierReward(r,'silver'),null);`);}
});
test('real reward, request, admission and result actions survive refresh with no duplicate payments or people',()=>{
 const b=world();b.run(`S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1};PalaceActions.reset();A.court();`);b.force(0);
 b.run(`choose(0);var check=()=>{var before=JSON.stringify(S.flags.frontierCampaigns),title=curEv.title;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);assert.equal(JSON.stringify(S.flags.frontierCampaigns),before);};
 check();nextEv();check();choose(2);check();choose(0);check();assert.equal(curEv.title,'功臣荐女');choose(0);check();nextEv();check();choose(1);check();drain();
 assert.equal(S.consorts.filter(c=>c.id===cid).length,1);assert.equal(S.flags.frontierHouses.length,0);assert.equal(E().treasury,570);assert.equal(frontierEntry(S.flags.frontierCampaigns[0].commander).p.rewardSilver,30);
 S.turn++;S.month++;S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1,person:cid};PalaceActions.reset();A.court();`);
 b.force(0);b.run(`choose(3);check();assert.equal(S.flags.frontierCampaigns.length,2);`);
});
test('deferred awards are reachable from government after refresh',()=>{
 const b=world();b.run(`S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1};PalaceActions.reset();A.court();`);b.force(0);b.run(`choose(0);nextEv();choose(4);drain();save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);
 assert.match(viewGovernment(),/北境军功册/);assert.match(viewGovernment(),/继续论功行赏/);A.frontierReward(S.flags.frontierCampaigns[0].id);assert.equal(curEv.title,'北境论功行赏');choose(1);drain();assert.doesNotMatch(frontierPanel(),/继续论功行赏/);`);
});
test('outside households are reused and age by elapsed years only',()=>{
 const b=world();b.run(`assert.equal(frontierPickCommander().p.id,pid);var age=e.c.age,pa=e.p.age;S.turn+=12;courtTick();assert.equal(e.c.age,age+1);assert.equal(e.p.age,pa+1);courtTick();assert.equal(e.c.age,age+1);
 var data=JSON.stringify(S.flags.frontierHouses);frontierPanel();frontierDaughter(e);assert.equal(JSON.stringify(S.flags.frontierHouses),data);`);
});
test('a real v12 northern result restores the original outcome without generating new commanders',()=>{
 const data=require('./fixtures/frontier-legacy-v12.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);assert.equal(S.flags.frontierCampaigns,undefined);drain();assert.equal(PalaceActions.blocked,false);`);
});
