const {test}=require('node:test'),assert=require('node:assert/strict'),{world:base}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}
test('cards expose the direct audience below cards without rolling or spending energy',()=>{const w=world();w.run(`var before=JSON.stringify(S);Math.random=()=>{throw Error('view rolled')};assert.match(viewCards(),/宫女留侍/);assert.ok(viewCards().indexOf('宫女留侍')>viewCards().indexOf('class="pais"'));assert.equal(JSON.stringify(S),before);`);});
test('an explicit audience works during ambient cooldown and at a crowded court',()=>{const w=world();w.run(`S.flags.lastMaidEncounter=S.turn;S.flags.haremRestraint={gen:S.gen,pauseUntil:S.turn+12};var energy=E().energy;A.maidAudience();choose(0);assert.match(curEv.title,/召见宫女/);assert.ok(curEv.por.age>=18);assert.equal(E().energy,energy);choose(0);assert.equal(E().energy,energy-1);assert.equal(maids().length,1);assert.ok(maids()[0].nights>=1);drain();`);});
test('declining and reopening keeps the same candidate, including pending reload',()=>{let w=world();w.run(`A.maidAudience();choose(0);`);const id=w.run('curEv.por.id');w=boot(701,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.por.id,${id});choose(1);drain();A.maidAudience();choose(0);assert.equal(curEv.por.id,${id});assert.equal(maids().length,0);`);});
test('returning maids stay anonymous until one is randomly summoned; the meeting resumes with the same maid',()=>{
 let w=world();w.run(`var first=newMaid('尚衣局'),second=newMaid('尚衣局');for(var g of [first,second]){g.age=22;g.nights=2;g.near=false;g.preg=0;g.recovery={kind:'birth',turn:S.turn,until:S.turn+3};}PalaceActions.reset();A.maidAudience();assert.equal(curEv.choices.filter(c=>c.t.includes('旧识')).length,1);for(var g of [first,second])assert.ok(curEv.choices.every(c=>!c.t.includes(fullName(g))));`);
 w.force(.99);const id=w.run('maidAudienceRoster().at(-1).id');w.run(`choose(0);assert.equal(curEv.por.id,${id});assert.ok(curEv.title.includes(fullName(curEv.por)));assert.equal(curEv.choices[0].cond(),false);assert.match(curEv.choices[0].why,/静养|产后/);`);
 w=boot(701,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.por.id,${id});choose(2);drain();for(var g of maidAudienceRoster()){delete g.recovery;g.cardWithdrawn=true;}A.maidAudience();choose(0);assert.equal(curEv.choices[0].cond(),false);`);
});
test('new-maid night and morning arrangements reload without adding a second person or charging twice',()=>{let w=world();w.run(`A.maidAudience();choose(0);choose(0);`);const energy=w.run('E().energy'),id=w.run('maids()[0].id');w=boot(218,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(maids().length,1);assert.equal(E().energy,${energy});drain();assert.equal(S.consorts.filter(g=>g.id===${id}).length,1);`);});
test('monthly encounter checks its twenty-five-percent gate and six-month cooldown',()=>{const w=world();w.run(`S.flags.lastMaidEncounter=60;S.turn=65;Math.random=()=>0;assert.equal(monthlyMaidEvent(),null);S.turn=66;Math.random=()=>.25;assert.equal(monthlyMaidEvent(),null);`);});

test('monthly gate accepts just under 25 percent and garden includes its full quarter interval',()=>{const w=world();w.force(.249);w.run(`assert.ok(monthlyMaidEvent());`);w.force(.749);w.run(`A.out('garden');assert.equal(curEv.title,'宫女');choose(2);drain();S.turn+=5;assert.equal(maidEncounterReady(),false);S.turn++;assert.equal(maidEncounterReady(),true);`);w.force(.75);w.run(`A.out('garden');assert.equal(curEv.title,'御花园');`);});
test('genuine published v29 garden encounter keeps its old cooldown until completion',()=>{const payload=require('./fixtures/maid-encounter-legacy-v29.json'),w=boot(229,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,29);assert.equal(curEv.title,'宫女');choose(2);drain();assert.equal(PalaceActions.contentVersion,64);S.turn+=5;assert.equal(maidEncounterReady(),false);S.turn++;assert.equal(maidEncounterReady(),true);`);});

test('a pregnancy after sending a maid back is announced once in the new month and survives reload',()=>{
 const w=world();w.run('A.maidAudience();choose(0);');
 w.force(.2376181826,.6413819692,.5583668493,.8159323614,.0499424019,.6126509556,.0678740593,.3046474559);w.run(`choose(0);var g=maids()[0],id=g.id,start=S.turn;assert.equal(g.preg,1);
 choose(1);assert.equal(curEv.title,'天明');choose(3);drain();
 assert.equal(g.maid,true);assert.equal(g.near,false);assert.equal(g.palace,'尚衣局');assert.equal(g.maidReturnedAt,start);assert.doesNotMatch(consortNightReason(g),/孕/);
 assert.ok(!g.story.some(x=>x.t.includes('诊出身孕')));assert.ok(!S.log.some(x=>x.t.includes('尚衣局来报')));
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);
 A.endMonth();assert.equal(S.turn,start+1);assert.equal(curEv.title,'尚衣局来报 · 喜脉');
 assert.match(curEv.text,/上月侍寝.*回了尚衣局/);
 assert.equal(byId(id).story.find(x=>x.t.startsWith('【尚衣局来报】')).d,dateStr());
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'尚衣局来报 · 喜脉');
 assert.equal(S.log.filter(x=>x.t.includes('尚衣局来报')).length,1);choose(1);drain();
 assert.equal(byId(id).prot,true);assert.equal(byId(id).maid,true);assert.equal(byId(id).preg,2);`);
});

test('sending a maid back without conception does not manufacture a pregnancy report',()=>{
 const w=world();w.run('A.maidAudience();choose(0);');
 w.force(.95,.95);w.run(`choose(0);var g=maids()[0];assert.equal(g.preg,0);choose(1);choose(3);drain();
 assert.equal(g.maidReturnedAt,undefined);A.endMonth();assert.ok(![curEv,...Q].some(x=>x?.title.includes('尚衣局来报')));
 drain();assert.equal(g.preg,0);assert.ok(!S.log.some(x=>x.t.includes('尚衣局来报')));`);
});

test('only a previously favored maid has the attendant report, without a mistress or a plea for a visit',()=>{
 const w=world();w.run(`var g=newMaid('尚衣局');g.xin={k:'委屈',t:S.turn};assert.equal(XEV.委屈(g),null);
 g.nights=1;var ev=xinEvent();assert.equal(ev.por,g);assert.match(ev.text,/内侍来报.*曾承宠的宫女.*伤心.*落泪/);
 assert.doesNotMatch(ev.text,/小主|姑姑|求陛下去/);assert.equal(ev.present.length,0);
 assert.equal(ev.choices.length,1);assert.equal(ev.choices[0].t,'知道了');
 var e=E().energy;pushEv(ev);choose(0);assert.equal(E().energy,e);
 assert.match(g.story.at(-1).event.situation,/内侍来报/);
 assert.match(XEV.委屈(empress()).text,/掌事姑姑.*小主/);`);
});
