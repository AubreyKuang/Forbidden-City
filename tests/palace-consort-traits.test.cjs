const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(17001);b.ctx.assert=assert;b.run(`A.start();drain();var c=harem()[0];c.known=true;c.kl=true;c.hp=85;c.distinctions.initialTalent=100;`);return b;}
test('every distinction has a reachable genuine attribute combination',()=>{
 const b=world();b.run(`var cases={grace:{looks:91},poet:{talent:95},both:{looks:85,talent:90},kind:{virtue:90},hidden:{scheme:90},innocent:{scheme:10,virtue:75},reader:{hobby:'读书',talent:90},music:{hobby:'抚琴',talent:90},needle:{trait:'巧手',hobby:'刺绣',talent:85},paint:{like:'字画',talent:90},archer:{trait:'将门',t2:'擅骑射'},humble:{upbringing:{title:'寒门'},talent:90},quiet:{trait:'淡泊',scheme:10,virtue:80},clever:{talent:90,scheme:70},pretty:{looks:87},quick:{talent:85},gentle:{virtue:84},careful:{scheme:75},frail:{hp:49}};
 for(var r of CONSORT_DISTINCTIONS){var p={...c,looks:50,talent:50,virtue:50,scheme:50,hp:85,...cases[r.id]};assert.ok(consortTraitMatches(p,{reveal:true}).includes(r),r.name);}
 assert.equal(CONSORT_DISTINCTIONS.length,19);`);
});
test('exact thresholds do not turn missing health into illness or include beauty 90',()=>{
 const b=world();b.run(`c.looks=90;c.hp=50;assert.ok(!consortTraitMatches(c).some(r=>r.id==='grace'||r.id==='frail'));
 c.looks=91;c.hp=49;assert.ok(consortTraitMatches(c).some(r=>r.id==='grace'));assert.ok(consortTraitMatches(c).some(r=>r.id==='frail'));
 delete c.hp;assert.ok(!consortTraitMatches(c).some(r=>r.id==='frail'));c.hp=20;c.alive=false;assert.ok(!consortTraitMatches(c).some(r=>r.id==='frail'));`);
});
test('unrevealed virtue, schemes and likes cannot leak through tags or explanations',()=>{
 const b=world();b.run(`c.known=false;c.kl=false;c.virtue=95;c.scheme=95;c.talent=95;c.like='字画';
 var hidden=['kind','hidden','paint','clever'];for(var id of hidden)assert.ok(consortTraitMatches(c,{reveal:true}).some(r=>r.id===id));
 for(var r of consortTraitMatches(c))assert.ok(!hidden.includes(r.id));
 assert.doesNotMatch(consortTraitPanel(c),/心机|德行|字画|玲珑/);
 c.known=true;assert.ok(consortTraitMatches(c).some(r=>r.id==='hidden'));assert.ok(!consortTraitMatches(c).some(r=>r.id==='paint'));
 c.kl=true;assert.ok(consortTraitMatches(c).some(r=>r.id==='paint'));`);
});
test('same-family grades are replaced and roster shows at most two with health first',()=>{
 const b=world();b.run(`Object.assign(c,{looks:96,talent:100,virtue:95,scheme:95,hp:40,hobby:'抚琴'});
 var labels=consortTraitLabels(c),ids=labels.map(r=>r.id);assert.ok(ids.includes('both'));assert.ok(!ids.includes('pretty')&&!ids.includes('grace')&&!ids.includes('quick')&&!ids.includes('poet'));
 assert.equal(labels[0].id,'frail');assert.equal((consortTraitTags(c).match(/consort-trait-tag/g)||[]).length,2);assert.ok(labels.length>2);
 assert.ok(consortTraitPanel(c).includes('琴心雅韵'));`);
});
test('selection and roster rendering neither roll nor modify the world',()=>{
 const b=world();b.run(`c.looks=95;var before=JSON.stringify(S);`);b.force(.123456);
 b.run(`for(var i=0;i<10;i++){consortTraitTags(c);consortTraitPanel(c);consortHealthPanel(c);}assert.equal(R(),.123456);assert.equal(JSON.stringify(S),before);`);
});
test('late talent growth needs an actual matching achievement, and setbacks cannot grant it',()=>{
 const b=world();b.run(`c.distinctions.initialTalent=60;c.distinctions.proof={};c.talent=100;c.hobby='抚琴';
 assert.ok(!consortTraitMatches(c).some(r=>r.id==='poet'||r.id==='music'||r.id==='quick'));
 recordConsortPractice(c,PERSONAL_EPISODES.find(e=>e.id==='life11'),'有遗憾');assert.deepEqual(Object.keys(c.distinctions.proof),[]);
 recordConsortPractice(c,PERSONAL_EPISODES.find(e=>e.id==='life11'),'有所成');
 assert.ok(consortTraitMatches(c).some(r=>r.id==='music'));assert.ok(!consortTraitMatches(c).some(r=>r.id==='poet'));
 recordConsortPractice(c,PERSONAL_EPISODES.find(e=>e.id==='life05'),'有所成');assert.ok(consortTraitMatches(c).some(r=>r.id==='poet'));`);
});
test('successful personal story grants durable evidence and new distinction chronicle once',()=>{
 const b=world();b.run(`c.trait='才女';c.talent=92;c.distinctions.initialTalent=60;c.distinctions.proof={};c.distinctions.noted={};
 var episode=PERSONAL_EPISODES.find(e=>e.id==='life05');assert.equal(offerPersonalExperience(c,episode),true);A.personalExperience(c.id);choose(0);drain();
 S.turn=c.personalExperiences.current.due;A.personalExperience(c.id);`);b.force(0);
 b.run(`choose(0);drain();assert.equal(c.talent,95);assert.equal(c.distinctions.proof.letters.title,'半阕春词');assert.ok(consortTraitMatches(c).some(r=>r.id==='poet'));
 var count=c.story.filter(e=>e.t.includes('人物特质·咏絮之才')).length;assert.equal(count,1);reconcileConsortDistinctions();assert.equal(c.story.filter(e=>e.t.includes('人物特质·咏絮之才')).length,count);`);
});
test('ordinary high talent is not mistaken for humble origin and a recorded humble origin can survive promotion',()=>{
 const b=world();b.run(`c.talent=95;c.fam={t:'县令',p:20};delete c.upbringing;assert.ok(!consortTraitMatches(c).some(r=>r.id==='humble'));
 c.fam={t:'书香门第',p:15};assert.ok(!consortTraitMatches(c).some(r=>r.id==='humble'));c.upbringing={title:'寒门'};c.fam={t:'内阁首辅',p:90};assert.ok(consortTraitMatches(c).some(r=>r.id==='humble'));`);
});
test('tags appear in the live card, detail and selection audience without extra rewards',()=>{
 const b=world();b.run(`c.looks=95;c.talent=50;assert.match(consortCard(c),/沉鱼落雁/);UI.sel=c.id;assert.match(viewConsort(),/人物特质/);
 genCands();var candidate=S.cands[0];candidate.looks=95;candidate.talent=50;S.selection.current=candidate.id;
 assert.match(viewSelectionAudience(),/沉鱼落雁/);S.selection.phase='roster';assert.match(viewXX(),/沉鱼落雁/);
 var stats=JSON.stringify([c.looks,c.talent,c.virtue,c.scheme]);reconcileConsortDistinctions();assert.equal(JSON.stringify([c.looks,c.talent,c.virtue,c.scheme]),stats);`);
});
for(const key of ['month','birth','ill'])test('genuine v54 '+key+' resumes with original health and random outcomes',()=>{
 const payload=require('./fixtures/consort-traits-legacy-v54.json')[key],b=boot(17001,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,54);assert.equal(consortTraitsActive(),false);
 drain();A.go('harem');assert.equal(PalaceActions.contentVersion,59);assert.ok(S.consorts.every(c=>Number.isFinite(c.hp)));`);
});
for(const version of [56,57,58])test('genuine published v'+version+' scene finishes before activating health and distinctions',()=>{
 const payload=require('./fixtures/consort-traits-legacy-v'+version+'.json').month,b=boot(17001,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});assert.equal(princeAdoptionActive(),${version>=57});assert.equal(xieStoryUpdated(),${version>=58});assert.equal(consortTraitsActive(),false);drain();A.go('harem');assert.equal(PalaceActions.contentVersion,59);assert.ok(S.consorts.every(c=>Number.isFinite(c.hp)));`);
});
