const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(seed=82){const b=boot(seed);b.ctx.assert=assert;b.run(`A.start();drain();E().energy=20;E().treasury=10000;PalaceActions.reset();`);return b;}
function reload(b){const next=boot(912,b.storage);next.ctx.assert=assert;next.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);return next;}

test('three distinct briefs can be resolved; all entrances show the limit and further clicks do nothing',()=>{
 const b=world();b.run(`
  var titles=[],energy=E().energy;
  for(var i=0;i<3;i++){
    assert.equal(monthlyCourtStatus().count,i);A.court();assert.equal(modalOpen,true);
    titles.push(curEv.title);assert.match(curEv.text,new RegExp('本月第 '+(i+1)+' 份'));
    choose(0);drain();assert.equal(monthlyCourtStatus().count,i+1);
  }
  assert.equal(new Set(titles).size,3);assert.equal(E().energy,energy-3);
  assert.equal(mapMemorial().done,true);assert.ok(viewGovernment().includes('disabled>本月奏折已办完 · 3/3'));
  UI.sel='cj';assert.ok(viewPlace().includes('disabled>本月奏折已办完 · 3/3'));
  var before=JSON.stringify(S),view=UI.view;A.court();A.court();
  assert.equal(modalOpen,false);assert.equal(JSON.stringify(S),before);assert.equal(UI.view,view);
 `);
 assert.ok(b.messages.some(m=>m.includes('三份奏折均已批复')));
});

test('preview, deferral, navigation and cold reload keep the second brief without spending its quota',()=>{
 let b=world();b.run(`A.court();choose(0);drain();A.court();var title=curEv.title;choose(curEv.choices.length-1);A.go('government');save('auto');`);
 const title=b.run('title');b=reload(b);b.run(`assert.equal(monthlyCourtStatus().count,1);A.court();assert.equal(curEv.title,${JSON.stringify(title)});`);
 const state=b.run('JSON.stringify(S.flags.monthlyCourt)');b=reload(b);
 assert.equal(b.run('JSON.stringify(S.flags.monthlyCourt)'),state);
 b.run(`assert.equal(curEv.title,${JSON.stringify(title)});assert.equal(monthlyCourtStatus().count,1);choose(0);assert.equal(monthlyCourtStatus().count,2);`);
 b=reload(b);b.run(`assert.ok(modalResult);assert.equal(monthlyCourtStatus().count,2);drain();A.court();choose(0);drain();assert.equal(monthlyCourtStatus().count,3);save('auto');`);
 b=reload(b);b.run(`A.court();assert.equal(modalOpen,false);assert.equal(monthlyCourtStatus().count,3);`);
});

test('month settlement retains every reply and starts a fresh quota, without accusing a partially diligent month of neglect',()=>{
 const b=world();b.run(`
  A.court();choose(0);drain();A.court();choose(0);drain();var titles=monthlyCourtCompleted().map(x=>x.result.title);
  A.court();choose(curEv.choices.length-1);recordHaremCourtMonth();assert.equal(haremRestraintState().months.at(-1).court,true);
  A.endMonth();drain();assert.equal(monthlyCourtStatus().count,0);assert.equal(mapMemorial().done,false);
  assert.deepEqual(S.flags.lastMonthReview.courts.map(x=>x.title),titles);
  var html=viewLog();for(var title of titles)assert.ok(html.includes(title));
  A.court();assert.match(curEv.text,/本月第 1 份/);assert.equal(S.flags.courtDocket.completed.length,0);
 `);
});

for(const version of [44,45])for(const name of ['preview','result'])test('published v'+version+' '+name+' replays unchanged and then continues toward three replies',()=>{
 const payload=require('./fixtures/monthly-court-legacy-v'+version+'.json')[name];
 let b=boot(82,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});assert.doesNotMatch(curEv.text,/本月第/);drain();assert.equal(PalaceActions.contentVersion,64);assert.equal(monthlyCourtStatus().count,1);A.court();assert.match(curEv.text,/本月第 2 份/);assert.notEqual(curEv.title,'黄河决堤');`);
 b=reload(b);b.run(`assert.equal(monthlyCourtStatus().count,1);assert.match(curEv.text,/本月第 2 份/);`);
});

test('an already resolved old save counts as one reply and never rerolls or repeats its rewards',()=>{
 const b=world();b.run(`
  S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:0,done:true,result:{title:'黄河决堤',choice:'拨银',text:'已经赈济'}};
  delete S.flags.courtDocket;var treasury=E().treasury;A.court();
  assert.equal(monthlyCourtStatus().count,1);assert.notEqual(curEv.title,'黄河决堤');assert.equal(E().treasury,treasury);
 `);
});

for(const index of [9,999])test('stale pinned brief '+index+' is replaced without an empty modal or a lost reply',()=>{
 const b=world();b.run(`
  S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:${index},sons:[]};
  A.court();assert.equal(modalOpen,true);assert.ok(curEv.choices.length);assert.notEqual(S.flags.monthlyCourt.index,${index});
  assert.equal(monthlyCourtStatus().count,0);assert.match(curEv.text,/本月第 1 份/);
 `);
});

test('due follow-up replies use one of three slots and precede unrelated reports',()=>{
 const b=world();b.run(`
  S.turn=5;S.month=8;S.flags.impeachmentSeen=true;S.flags.floodRelief={turn:S.turn,gen:S.gen,floodNeed:'grain'};
  A.court();assert.equal(S.flags.monthlyCourt.floodFollowup,true);choose(0);drain();
  assert.equal(monthlyCourtStatus().count,1);assert.equal(floodReliefDue(),false);
  A.court();assert.equal(curEv.title,'五谷丰登');choose(0);drain();
  assert.equal(monthlyCourtStatus().count,2);A.court();assert.notEqual(S.flags.monthlyCourt.index,FLOOD_INDEX);
 `);
});

test('grain investigation is still pending, consumes no reply, and its final disposal consumes only one',()=>{
 const b=world();b.run(`
  S.month=8;S.turn=5;S.flags.grainReserveGen=S.gen;S.flags.autumnGrainOrder={turn:S.turn,gen:S.gen};
  S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX,locustNeed:'near',locustAuditNeed:'far'};
  A.court();var inspect=curEv.choices.findIndex(x=>x.inspectLocust);assert.ok(inspect>=0);choose(inspect);drain();
  assert.equal(monthlyCourtStatus().count,0);A.court();choose(0);drain();assert.equal(monthlyCourtStatus().count,1);
 `);
});

test('free delegation also consumes a reply and is capped despite leaving energy untouched',()=>{
 const b=world();b.run(`
  var energy=E().energy;A.court();var delegated=curEv.choices.findIndex(x=>x.delegated);assert.ok(delegated>=0);choose(delegated);drain();
  assert.equal(E().energy,energy);assert.equal(monthlyCourtStatus().count,1);
 `);
});

test('the third personal reply finishes its result before energy exhaustion advances exactly one month',()=>{
 const b=world();b.run(`
  E().energy=3;var turn=S.turn,gen=S.gen;
  for(var i=0;i<3;i++){A.court();choose(0);assert.equal(S.turn,turn);drain();}
  assert.equal(monthlyCourtStatus().count,3);assert.equal(exhaustedMonthReady(),true);
  A.completeExhaustedMonth(gen,turn);drain();assert.equal(S.turn,turn+1);
  assert.equal(monthlyCourtStatus().count,0);assert.equal(S.flags.lastMonthReview.courts.length,3);
  A.completeExhaustedMonth(gen,turn);assert.equal(S.turn,turn+1);
 `);
});

test('one opening reply is sufficient for the queen guidance and is not described as unhandled court business',()=>{
 const b=world();b.run(`
  A.court();choose(0);drain();assert.match(viewMap(),/去坤宁宫见/);A.finishMonth();
  assert.doesNotMatch(curEv.text,/首月奏折尚未批复/);choose(curEv.choices.findIndex(x=>x.t==='留在本月'));
  assert.equal(monthlyCourtStatus().count,1);
 `);
});
