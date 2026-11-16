const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(storage){const b=boot(928,storage);b.ctx.assert=assert;if(!storage)b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=20;var c=S.consorts[1];c.favor=30;var other=makeGirl({});addConsort(other,3,'测试入宫');PalaceActions.reset();`);return b;}
function reload(b){const x=world(b.storage);x.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var c=S.consorts[1],other=S.consorts[2];`);return x;}
function hongjian(){const b=world();b.run(`var p=createFenghuaPerson('xueHongjian');p.fenghua.stage=3;admitHongjian(p);p.arc.st=2;`);return b;}
test('home appointment is read-only and candidates are actual current consorts',()=>{
 const b=world();b.run(`var before=JSON.stringify(S);assert.match(viewHome(),/任命协理六宫/);assert.equal(JSON.stringify(S),before);A.openHaremSteward();assert.ok(curEv.choices.some(o=>o.person===c));assert.ok(!curEv.choices.some(o=>o.person===S.consorts[0]));assert.equal(S.flags.haremSteward,undefined);`);
});
test('every candidate remains reachable in a large harem through the paged roster',()=>{
 let b=world();b.run(`for(var i=0;i<18;i++)addConsort(makeGirl({}),3,'测试入宫');S.flags.rosterIds=S.consorts.filter(haremStewardEligible).sort((a,b)=>b.rank-a.rank||b.talent-a.talent).map(c=>c.id);A.openHaremSteward();assert.equal(curEv.choices.filter(o=>o.person).length,8);choose(curEv.choices.findIndex(o=>o.t==='下一页'));save('auto');`);b=reload(b);
 b.run(`assert.deepEqual(curEv.choices.filter(o=>o.person).map(o=>o.person.id),S.flags.rosterIds.slice(8,16));choose(curEv.choices.findIndex(o=>o.t==='下一页'));assert.deepEqual(curEv.choices.filter(o=>o.person).map(o=>o.person.id),S.flags.rosterIds.slice(16));assert.ok(!curEv.choices.some(o=>o.t==='下一页'));choose(curEv.choices.findIndex(o=>o.t==='上一页'));assert.deepEqual(curEv.choices.filter(o=>o.person).map(o=>o.person.id),S.flags.rosterIds.slice(8,16));`);
});
test('appointment selection, confirmation and result all cold-reload without an early reward',()=>{
 let b=world();b.run(`A.openHaremSteward();save('auto');`);b=reload(b);b.run(`choose(curEv.choices.findIndex(o=>o.person===c));assert.equal(curEv.title,'御书房 · 协理六宫');save('auto');`);b=reload(b);b.run(`choose(0);assert.equal(haremStewardPerson(),c);assert.equal(c.favor,30);save('auto');`);b=reload(b);b.run(`drain();assert.equal(haremStewardPerson(),c);assert.equal(c.favor,30);assert.equal(c.stewardship.terms.length,1);assert.match(haremStewardPersonPanel(c),/现任协理六宫/);`);
});
test('one actual month applies ten extra favor after ordinary decay, with a visible receipt',()=>{
 let b=world();b.run(`appointHaremSteward(c);c.bond=true;S.flags.stewardBefore=c.favor;A.endMonth();save('auto');`);b=reload(b);b.run(`assert.equal(c.favor,S.flags.stewardBefore+10);assert.equal(c.stewardship.receipts.length,1);assert.equal(S.flags.lastMonthReview.stewardship.gain,10);assert.ok(viewLog().includes('本月额外恩宠 +10'));save('auto');`);b=reload(b);b.run(`assert.equal(c.stewardship.receipts.length,1);assert.equal(c.favor,S.flags.stewardBefore+10);`);
});
test('replacing the appointee cannot award twice in one turn; next turn rewards only the new appointee',()=>{
 const b=world();b.run(`appointHaremSteward(c);settleHaremStewardReward();assert.equal(c.favor,40);assert.equal(settleHaremStewardReward(),null);var n=other.favor;appointHaremSteward(other);assert.equal(haremStewardPerson(),other);assert.equal(c.stewardship.terms[0].ended.turn,S.turn);assert.equal(settleHaremStewardReward(),null);assert.equal(other.favor,n);S.turn++;settleHaremStewardReward();assert.equal(c.favor,40);assert.equal(other.favor,n+10);`);
});
test('favor respects its existing cap and reports the actual applied gain',()=>{
 const b=world();b.run(`appointHaremSteward(c);c.favor=96;assert.equal(settleHaremStewardReward().gain,4);assert.equal(c.favor,100);S.turn++;assert.equal(settleHaremStewardReward().gain,0);assert.equal(c.favor,100);`);
});
test('explicit removal survives reload, preserves past favor and closes the term',()=>{
 let b=world();b.run(`appointHaremSteward(c);settleHaremStewardReward();A.openHaremSteward();choose(curEv.choices.findIndex(o=>o.t==='撤去现任协理之责'));save('auto');`);b=reload(b);b.run(`choose(0);save('auto');`);b=reload(b);b.run(`drain();assert.equal(haremStewardPerson(),null);assert.equal(c.favor,40);assert.ok(c.stewardship.terms[0].ended);S.turn++;assert.equal(settleHaremStewardReward(),null);`);
});
for(const state of ['cold','gone','dead','queen'])test('terminal appointment condition clears the role: '+state,()=>{
 const b=world();b.run(`appointHaremSteward(c);${state==='dead'?'c.alive=false':state==='queen'?'c.rank=8':'c.'+state+'=true'};haremStewardChanges();assert.equal(haremStewardPerson(),null);assert.equal(settleHaremStewardReward(),null);assert.equal(c.favor,30);assert.ok(c.stewardship.terms[0].ended);`);
});
for(const state of ['homeLeave','templeStay'])test('temporary absence pauses reward and resumes after return: '+state,()=>{
 const b=world();b.run(`appointHaremSteward(c);c.${state}={};haremStewardChanges();assert.equal(haremStewardPerson(),c);assert.equal(settleHaremStewardReward(),null);assert.match(haremStewardPanel(),/增益暂停/);delete c.${state};assert.equal(settleHaremStewardReward().gain,10);`);
});
test('succession never transfers a previous emperor consort appointment or payoff',()=>{
 const b=world();b.run(`appointHaremSteward(c);S.gen++;S.consorts=[];haremStewardChanges();assert.equal(haremStewardPerson(),null);assert.equal(settleHaremStewardReward(),null);assert.equal(S.flags.haremSteward,undefined);`);
});
test('stale appointment callbacks cannot replace a newer assignment or appoint an unavailable person',()=>{
 const b=world();b.run(`var ev=haremStewardAppointmentEvent(c);appointHaremSteward(other);assert.equal(ev.choices[0].f(),null);assert.equal(haremStewardPerson(),other);var ev=haremStewardAppointmentEvent(c);c.cold=true;assert.equal(ev.choices[0].f(),null);assert.equal(haremStewardPerson(),other);`);
});
test('Hongjian can ask after two palace chapters and accept through a reloadable scene',()=>{
 let b=hongjian();b.run(`p.arc.st=1;assert.equal(hongjianStewardProposal(p),null);p.arc.st=2;A.hongjianSteward(p.id);assert.match(curEv.text,/重复签过|灯油/);save('auto');`);b=reload(b);b.run(`var p=fenghuaPerson('xueHongjian');choose(0);save('auto');`);b=reload(b);b.run(`var p=fenghuaPerson('xueHongjian');drain();assert.equal(haremStewardPerson(),p);assert.equal(p.arc.st,2);assert.equal(p.hongjian.stewardDecision,'accepted');assert.equal(p.favor,40);assert.equal(hongjianStewardProposal(p),null);`);
});
test('deferral has a twelve-month cooldown and refusal still permits later manual appointment',()=>{
 const b=hongjian();b.run(`hongjianStewardProposal(p).choices[1].f();assert.equal(haremStewardPerson(),null);assert.equal(hongjianStewardProposal(p),null);S.turn+=12;var ev=hongjianStewardProposal(p);assert.ok(ev);ev.choices[2].f();S.turn+=12;assert.equal(hongjianStewardProposal(p),null);assert.ok(appointHaremSteward(p));assert.equal(haremStewardPerson(),p);`);
});
test('appointing Hongjian before her petition prevents a repeated petition and does not affect her income threshold',()=>{
 const b=hongjian();b.run(`p.arc.st=0;appointHaremSteward(p);p.arc.st=2;assert.equal(hongjianStewardProposal(p),null);assert.equal(hongjianMonthlyIncome(p),0);p.rank=4;assert.equal(hongjianMonthlyIncome(p),8);`);
});
for(const choice of [0,1])test('the three-month stewardship report has independent progress and stable choices: '+choice,()=>{
 let b=hongjian();b.run(`appointHaremSteward(p);assert.equal(haremStewardReport(),null);S.turn+=2;PalaceActions.reset();A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title==='协理六宫 · 第一本宫务簿'));save('auto');`);b=reload(b);
 b.run(`for(var n=0;curEv?.title!=='协理六宫 · 第一本宫务簿'&&n<50;n++){if(modalResult)nextEv();else choose(0);}assert.equal(curEv.title,'协理六宫 · 第一本宫务簿');save('auto');`);b=reload(b);
 b.run(`var p=fenghuaPerson('xueHongjian');choose(${choice});assert.equal(p.stewardship.terms[0].reportDone,true);save('auto');`);b=reload(b);b.run(`var p=fenghuaPerson('xueHongjian');assert.equal(p.stewardship.terms[0].reportDone,true);assert.equal(haremStewardReport(),null);`);
});
for(const [scene,payload] of Object.entries(require('./fixtures/hongjian-legacy-v26.json')))test('published v26 '+scene+' retains its exact scene before enabling v27',()=>{
 let b=world(new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,26);assert.equal(haremStewardEnabled(),false);assert.equal(hongjianContent(),false);drain();assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,48);`);
});
for(const [scene,payload] of Object.entries(require('./fixtures/hongjian-legacy-v27.json')))test('published v27 '+scene+' retains its exact scene before enabling v28',()=>{
 let b=world(new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,27);assert.equal(haremStewardEnabled(),false);assert.equal(hongjianContent(),false);drain();assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,48);`);
});
