const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(88);b.ctx.assert=assert;b.run(`A.start();drain();var d=ensureDowager(),q=empress();q.hp=95;q.preg=0;q.lastBirth=-99;delete q.solitary;var c=makeGirl({sur:d.sur,given:'清容',age:24,trait:'温婉',fam:{...d.fam}});c.clan=d.clan;addConsort(c,3,'太后母家入宫');c.hp=95;c.lastBirth=-99;S.turn=60;d.lastYears={deathTurn:100,askTurn:70,asked:false,warned:false,caregiver:null,lastCare:-1,history:[]};PalaceActions.reset();`);return b;}
test('opening queen kinship has a strict twenty-five percent gate, real family identity, and no reroll',()=>{
 const b=world();b.run(`delete S.flags.openingQueenKinChecked;delete q.dowagerKin;`);b.force(.25);b.run(`initializeDowagerOpening();assert.equal(S.flags.openingQueenKinChecked,true);assert.equal(q.dowagerKin,undefined);delete S.flags.openingQueenKinChecked;`);b.force(.24999);b.run(`initializeDowagerOpening();assert.equal(q.dowagerKin.relation,'侄女');assert.equal(q.clan,d.clan);assert.equal(q.sur,d.sur);assert.equal(d.natalBrotherId,q.house.father.id);assert.match(q.kinNote,/母族表妹/);assert.ok(q.story.some(s=>s.t.includes('母家亲缘')));var before=JSON.stringify(S);initializeDowagerOpening();assert.equal(JSON.stringify(S),before);`);
});
test('private lifespan is stored once and asks within three years, before the six-month illness window',()=>{
 const b=world();b.run(`delete d.lastYears;var plan=dowagerLifePlan(d),before=JSON.stringify(plan);assert.ok(plan.deathTurn-S.turn>=37);assert.ok(plan.deathTurn-plan.askTurn>=12&&plan.deathTurn-plan.askTurn<=36);assert.equal(JSON.stringify(dowagerLifePlan(d)),before);d.lastYears={deathTurn:100,askTurn:70,asked:false,warned:false,caregiver:null,lastCare:-1,history:[]};S.turn=69;dowagerCareTick();assert.equal(modalOpen,false);S.turn=70;dowagerCareTick();assert.equal(curEv.title,'钦安殿 · 太后问寿');assert.ok(d.lastYears.asked);assert.doesNotMatch(curEv.text,/100|三年后|半年后|死期已定/);choose(0);drain();dowagerCareTick();assert.equal(modalOpen,false);assert.ok(d.story.some(s=>s.t.includes('问寿之后')));`);
});
test('six months before passing, eligible maternal kin serves by default and can be replaced',()=>{
 const b=world();b.run(`q.clan='陆|无关家';d.lastYears.asked=true;S.turn=94;dowagerCareTick();assert.equal(curEv.title,'慈宁宫 · 太后欠安');assert.equal(d.lastYears.caregiver,c.id);assert.match(curEv.text,/先行侍疾/);choose(1);assert.equal(curEv.title,'慈宁宫 · 安排侍疾');var i=curEv.choices.findIndex(x=>x.person===q);assert.ok(i>=0);choose(i);drain();assert.equal(d.lastYears.caregiver,q.id);assert.ok(c.story.some(s=>s.t.includes('结束这一段侍奉')));assert.ok(q.story.some(s=>s.t.includes('慈宁宫侍疾')));assert.match(dowagerCourtPanel(),/安排或更换侍疾妃嫔/);var count=q.story.length;dowagerCareTick();dowagerCareTick();assert.equal(q.story.length,count);S.turn++;dowagerCareTick();assert.ok(q.story.some(s=>s.t.includes('侍疾日常')));`);
});
test('ill, postpartum, absent and punished women cannot be assigned and an unavailable caregiver is relieved',()=>{
 const b=world();b.run(`d.lastYears.asked=true;S.turn=94;q.hp=20;dowagerCareTick();drain();assert.equal(d.lastYears.caregiver,c.id);c.cold=true;S.turn++;dowagerCareTick();assert.equal(d.lastYears.caregiver,null);assert.equal(dowagerCareCandidates().includes(q),false);assert.equal(appointDowagerCaregiver(d,c),false);c.cold=false;c.lastBirth=S.turn;assert.equal(dowagerCareCandidates().includes(c),false);c.lastBirth=-99;c.preg=8;assert.equal(dowagerCareCandidates().includes(c),false);c.preg=0;c.gone=true;assert.equal(dowagerCareCandidates().includes(c),false);`);
});
test('death is committed only when the scheduled funeral queues, with the non-kin caregiver remembering her',()=>{
 const b=world();b.run(`q.clan='陆|无关家';d.lastYears.asked=true;S.turn=94;appointDowagerCaregiver(d,q);dowagerCareTick();drain();S.turn=99;assert.equal(dowagerPassingEvent(),null);S.turn=100;var ev=dowagerPassingEvent();assert.ok(ev);assert.equal(d.alive,true);pushEv(ev);assert.equal(d.alive,false);assert.ok(q.story.some(s=>s.t.includes('侍疾送别')));assert.equal(xinOf(q),'悲恸');drain();assert.equal(dowagerPassingEvent(),null);assert.equal(dowagerCareSelection(d),null);assert.doesNotMatch(dowagerCourtPanel(),/安排或更换/);`);
});
for(const stage of ['question','illness'])test(stage+' popup and subsequent care decision survive monthly autosave and fresh reload',()=>{
 let b=world();b.run(`d.lastYears.askTurn=${stage==='question'?70:60};d.lastYears.asked=${stage==='illness'};S.turn=${stage==='question'?69:93};S.month=5;PalaceActions.reset();A.endMonth();`);const title=b.run('curEv.title'),state=b.run('JSON.stringify(d.lastYears)');
 b=boot(188,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var d=ensureDowager();assert.equal(curEv.title,${JSON.stringify(title)});assert.equal(JSON.stringify(d.lastYears),${JSON.stringify(state)});choose(0);drain();save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(dowagerLifePlan().deathTurn,100);`);
});

test('a long-lived dowager keeps her face, lifespan and history as the senior dowager across reigns',()=>{
 let b=world();b.run(`d.age=43;d.atTurn=S.turn;delete d.lastYears;
  assert.ok(dowagerYearsToLive(d,.98)>45*12);
  assert.ok(dowagerYearsToLive(d,.01)<18*12);
  var plan=dowagerLifePlan(d);plan.deathTurn=900;plan.askTurn=880;
  var face=portraitCell(dowagerPerson(d));dowagerRecord(d,'旧事','还收着从前那封旧家书。');
  E().age=45;S.turn=180;
  var heir=makeKid(q,'m','承宁');heir.born=S.turn-19*12;heir.pendingName=false;
  succeed(heir);choose(0,'景明');assert.match(modalResult.text,/受尊为.*太皇太后/);drain();
  assert.equal(S.flags.seniorDowagers[0],d);assert.equal(dowagerLifePlan(d).deathTurn,900);
  assert.equal(portraitCell(dowagerPerson(d)),face);
  S.turn=360;var next=makeKid(empress(),'m','恒宁');next.born=S.turn-20*12;next.pendingName=false;
  succeed(next);choose(0,'长乐');drain();assert.equal(S.gen,3);
  assert.equal(S.flags.seniorDowagers[0],d);assert.ok(S.flags.seniorDowagers[1].personId);
  assert.match(dowagerCourtPanel(),/太皇太后.*请安/);assert.match(dowagerCourtPanel(),/旧家书/);
  save('1');`);
 b=boot(991,b.storage);b.ctx.assert=assert;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var d=S.flags.seniorDowagers[0],main=S.flags.dowager;
  E().energy=5;A.greetSeniorDowager(0);assert.match(curEv.title,/太皇太后/);choose(0);drain();
  assert.match(d.story.at(-1).t,/来请安/);
  S.turn=900;main.lastYears={deathTurn:999,askTurn:970,asked:false,warned:false};
  S.flags.seniorDowagers[1].lastYears={deathTurn:1000,askTurn:990};
  var ev=dowagerPassingEvent();assert.match(ev.title,/太皇太后崩逝/);pushEv(ev);
  assert.equal(d.alive,false);assert.equal(main.alive,true);assert.equal(mourningOf(),d.mourning);
  choose(1);drain();assert.equal(d.mourning.handled,true);`);
});
