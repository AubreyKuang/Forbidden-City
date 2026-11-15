const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`c.aff=90;c.hp=95;c.preg=0;c.lastBirth=-99;other.aff=10;var cid=c.id;PalaceActions.reset();`);return b;}
test('three complete months of recovery block direct night, cards and maid night without spending anything',()=>{
 for(const kind of ['birth','loss']){const b=setup();b.run(`beginConsortRecovery(c,'${kind}');var origin=S.turn;
 for(var ago=0;ago<3;ago++){S.turn=origin+ago;var before=JSON.stringify({c,energy:E().energy,treasury:E().treasury,nights:E().nightsMonth});nightWith(c);A.night(cid);assert.equal(JSON.stringify({c,energy:E().energy,treasury:E().treasury,nights:E().nightsMonth}),before);assert.match(viewCards(),/调养/);UI.sel=cid;assert.match(viewConsort(),/disabled[^>]*>召幸侍寝/);}
 c.maid=true;var count=Q.length;maidNight(c);assert.equal(Q.length,count);c.maid=false;
 S.turn=origin+3;assert.equal(consortNightReason(c),'');var energy=E().energy;A.night(cid);assert.equal(E().energy,energy-1);assert.equal(c.nights,1);`);}
});
test('real childbirth stamps the first playable month and naming cannot restart recovery',()=>{
 const b=setup();b.run(`c.preg=10;Math.random=()=>.4;var ev=birthEvent(c);assert.equal(c.recovery.turn,61);assert.equal(c.recovery.until,64);assert.equal(c.recovery.kind,'birth');var saved=JSON.stringify(c.recovery);birthEvent(c);assert.equal(JSON.stringify(c.recovery),saved);
 pushEv(ev);drain();S.turn=61;assert.match(consortNightReason(c),/还需3个月/);S.turn=63;assert.match(consortNightReason(c),/还需1个月/);S.turn=64;assert.equal(consortNightReason(c),'');`);
});
test('a failed miscarriage rescue starts recovery but successful treatment does not',()=>{
 for(const roll of [.99,0]){const b=setup();b.run(`c.preg=4;other.scheme=90;other.solitary=null;var ev=HAREM.find(f=>f.name==='slip')();assert.ok(ev);Math.random=()=>${roll};ev.choices[0].f();`);assert.equal(b.run('!!c.recovery'),roll===.99);}
});
test('concealed loss uses its original date; revelation or a false delivery cannot add three new months',()=>{
 const b=setup();b.run(`Object.assign(c,{preg:5,scheme:90,virtue:10,favor:80,swapAsked:false});Math.random=()=>0;assert.ok(beginConcealedLoss(c));assert.equal(c.recovery.kind,'loss');assert.equal(consortNightReason(c),'有孕在身');assert.ok(!c.story.some(s=>s.t.includes('小产后')));
 S.turn+=2;revealConcealedLoss(c,'查明');assert.match(consortNightReason(c),/还需1个月/);S.turn++;assert.equal(consortNightReason(c),'');`);
 const x=setup();x.run(`Object.assign(c,{preg:5,scheme:90,virtue:10,favor:80,swapAsked:false});Math.random=()=>0;beginConcealedLoss(c);S.turn+=5;c.preg=10;var ev=birthEvent(c);assert.equal(c.delivery.concealedLoss,true);pushEv(ev);drain();assert.equal(consortRecovery(c),null);assert.equal(consortNightReason(c),'');`);
});
test('old delivery dates and concrete miscarriage chronicles retain the remaining recovery period',()=>{
 const b=setup();b.run(`c.lastBirth=S.turn-1;assert.match(consortNightReason(c),/产后.*2个月/);c.lastBirth=-99;story(c,'在御花园失足滑倒，腹中骨肉没能保住。');assert.match(consortNightReason(c),/小产后.*3个月/);S.turn+=3;S.month+=3;assert.equal(consortNightReason(c),'');`);
});
test('bear shielding excludes recent loss, childbirth, pregnancy, illness and low health but returns after recovery',()=>{
 const b=setup();b.run(`assert.ok(HIST[4]());beginConsortRecovery(c,'loss');assert.equal(HIST[4](),null);S.turn+=3;S.month+=3;assert.ok(HIST[4]());c.preg=2;assert.equal(HIST[4](),null);c.preg=0;c.hp=60;assert.equal(HIST[4](),null);c.hp=95;c.illnessRecovery={turn:S.turn,until:S.turn+2};assert.equal(HIST[4](),null);S.turn+=2;assert.ok(HIST[4]());beginConsortRecovery(c,'birth');assert.equal(HIST[4](),null);`);
});
test('the actual sickbed scene stamps illness only when shown and blocks already queued bear scenes',()=>{
 const b=setup();b.run(`c.trait='体弱';Math.random=()=>.99;var bear=HIST[4](),ill=HAREM.find(f=>f.name==='ill')();assert.equal(c.illnessRecovery,undefined);pushEv(ill);assert.equal(c.illnessRecovery.until,S.turn+2);assert.equal(eventStillValid(bear),false);bear.choices[0].f();assert.equal(c.bond,undefined);choose(0);drain();assert.equal(HIST[4](),null);`);
});
test('road encounters and longing letters disable night choices without changing mood or arc stage',()=>{
 const b=setup();b.run(`beginConsortRecovery(c,'loss');A.meetOnRoad(cid,'在回廊慢慢散步');var n=curEv.choices.findIndex(x=>x.t.includes('侍寝'));assert.equal(curEv.choices[n].cond(),false);var snapshot=JSON.stringify(c);choose(n);assert.equal(JSON.stringify(c),snapshot);assert.match(curEv.choices[n].why,/小产后调养/);drain();var ev=XEV['思念'](c);assert.equal(ev.choices[0].cond(),false);`);
});
test('recovery and visible remaining months survive a real journal replay',()=>{
 const b=setup();b.run(`beginConsortRecovery(c,'loss');PalaceActions.reset();A.meetOnRoad(cid,'在回廊慢慢散步');save('auto');A.load('auto');c=byId(cid);assert.equal(PalaceActions.blocked,false);assert.equal(c.recovery.until,63);assert.match(curEv.choices[1].why,/还需3个月/);`);
});
