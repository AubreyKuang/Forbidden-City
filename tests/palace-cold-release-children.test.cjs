const {test}=require('node:test'),assert=require('node:assert/strict'),{world:base}=require('./child-consequences-world.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const b=base();b.ctx.assert=assert;b.run(`S.turn=80;E().energy=10;a.cold=true;a.palace='冷宫';a.hp=95;little.born=S.turn-5*12;baby.born=S.turn-12;elder.born=S.turn-12*12;PalaceActions.reset();`);return b;}
test('release reunites all eligible biological children and resumes their existing care without changing identity',()=>{
 const b=world();b.run(`var cId=a.id,id=little.id,babyId=baby.id,elderId=elder.id,before=S.children.length,oldMother=little.mom;
 assert.equal(youngChildMother(little),null);A.uncold(cId);assert.equal(curEv.title,'冷宫归来 · 惦念孩子');assert.match(curEv.text,/急忙去接/);assert.match(curEv.text,/守好规矩/);assert.match(curEv.text,/清宁/);
 assert.equal(youngChildMother(little),a);assert.match(childResidence(little),/随生母/);assert.equal(little.foster,undefined);assert.equal(little.mom,oldMother);assert.equal(S.children.length,before);
 for(const k of [little,baby,elder]){assert.ok(k.story.some(x=>x.life?.title==='冷宫归来 · 惦念孩子'));assert.ok(k.motherBonds[a.id].trust>0);}assert.ok(a.story.some(x=>x.t.includes('担惊受怕')));drain();
 var n=little.story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length;A.uncold(cId);assert.equal(little.story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length,n);`);
});
test('an adopted child is visited quietly and remains with the same foster mother',()=>{
 const b=world();b.run(`var oldMom=little.mom;doFoster(little,b);var before=b.story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length;PalaceActions.reset();A.uncold(a.id);assert.equal(curEv.title,'冷宫归来 · 惦念孩子');assert.match(curEv.text,/悄悄来探望/);assert.match(curEv.text,/没有擅自接走/);assert.equal(little.foster,b.id);assert.equal(little.mom,oldMom);assert.equal(youngChildMother(little),b);assert.equal(b.story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length,before);assert.ok(little.story.some(x=>x.life?.title==='冷宫归来 · 惦念孩子'));`);
});
test('a closed visit stays closed and no secret encounter or child memory is fabricated',()=>{
 const b=world();b.run(`doFoster(little,b);little.visitRule='closed';var n=little.story.length,bond=JSON.stringify(little.motherBonds[a.id]);PalaceActions.reset();A.uncold(a.id);
 assert.match(curEv.text,/禁探仍在/);assert.equal(little.foster,b.id);assert.equal(little.story.length,n);assert.equal(JSON.stringify(little.motherBonds[a.id]),bond);assert.ok(a.story.some(x=>x.t.includes('只能托人送去问候')));`);
});
test('children who are away, imprisoned or deceased are not silently brought back',()=>{
 const b=world();b.run(`little.away=true;baby.jailed=true;elder.alive=false;var before=JSON.stringify([little.away,baby.jailed,elder.alive]);PalaceActions.reset();A.uncold(a.id);assert.equal(modalOpen,false);assert.equal(JSON.stringify([little.away,baby.jailed,elder.alive]),before);`);
});
test('pending release event and shared memories survive fresh save replay once',()=>{
 let b=world();b.run(`doFoster(little,b);PalaceActions.reset();A.uncold(a.id);save('auto');`);const mother=b.run('a.id'),child=b.run('little.id'),foster=b.run('b.id');
 b=boot(556,b.storage);b.ctx.assert=assert;b.ctx.motherId=mother;b.ctx.childId=child;b.ctx.fosterId=foster;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'冷宫归来 · 惦念孩子');var kid=kidById(childId);assert.equal(kid.foster,fosterId);assert.equal(kid.mom,motherId);assert.equal(kid.story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length,1);choose(0);drain();save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(childId).story.filter(x=>x.life?.title==='冷宫归来 · 惦念孩子').length,1);`);
});
test('release from a child plea queues the same reunion after the plea result',()=>{
 const b=world();b.run(`var n={id:'test-cold',mother:a.id,kind:'cold',turn:S.turn,children:[little.id],pleaders:[little.id],resolved:false,addresses:{[little.id]:'母妃'}};
 pushEv(childMotherConsequenceEvent(n));var i=curEv.choices.findIndex(x=>x.t.includes('准出冷宫'));assert.ok(i>=0);PalaceActions.reset();choose(i);assert.equal(a.cold,false);assert.ok(Q.some(ev=>ev.title==='冷宫归来 · 惦念孩子'));if(modalResult)nextEv();assert.equal(curEv.title,'冷宫归来 · 惦念孩子');assert.equal(youngChildMother(little),a);`);
});
test('a real v95 release result continues without injecting a new scene into its saved transcript',()=>{
 const data=require('./fixtures/cold-release-legacy-v95.json'),b=boot(557,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,95);assert.ok(modalResult);assert.ok(!Q.some(ev=>ev.title==='冷宫归来 · 惦念孩子'));drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);`);
});
test('the published v96 foster-chronicle release result also replays unchanged',()=>{
 const data=require('./fixtures/cold-release-legacy-v96.json'),b=boot(558,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,96);assert.ok(modalResult);assert.ok(!Q.some(ev=>ev.title==='冷宫归来 · 惦念孩子'));drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);`);
});
