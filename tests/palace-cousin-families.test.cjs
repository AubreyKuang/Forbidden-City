const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(81);b.ctx.assert=assert;b.run(`A.start();drain();S.consorts=[];S.cands=[];S.rel={};var a=makeGirl({sur:'沈',given:'清和',age:26,trait:'温婉',fam:{t:'两江总督',p:70}});addConsort(a,3,'入宫');var g=makeKin(a,'堂');g.given='清音';S.cands=[g];S.selection={phase:'roster'};PalaceActions.reset();`);return b;}
test('selection kin badge becomes two real father branches, increased membership and immediate admission feedback',()=>{
 const b=world();b.run(`assert.match(g.kinNote,/堂妹/);assert.equal(clanPalaceCount(a.clan),1);assert.notEqual(a.house.father.id,g.house.father.id);assert.notEqual(a.house.father.office,g.house.father.office);A.xxTake(g.id);choose(1);assert.match(modalResult.text,/由1人增至2人/);assert.match(modalResult.text,/是亲兄弟/);assert.equal(clanPalaceCount(a.clan),2);assert.equal(g.clan,a.clan);for(var c of [a,g])assert.ok(c.story.some(s=>s.t.includes('同族入宫')&&s.t.includes('由1人增至2人')));drain();var html=familyGraphSVG();assert.match(html,/在宫妃嫔 2 人/);assert.doesNotMatch(html,/父亲的亲兄弟|两房女儿为堂姐妹/);assert.ok(html.includes(g.house.father.name));UI.familyMode='list';var list=viewFamily();assert.doesNotMatch(list,/父亲的亲兄弟|两房女儿为堂姐妹/);assert.ok(list.includes(g.house.father.name));UI.sel=a.id+':father';assert.match(viewOfficial(),/兄弟与提携/);assert.ok(viewOfficial().includes(g.house.father.name));assert.equal(officialBrothers(courtPerson(UI.sel))[0].p.id,g.house.father.id);`);
});
test('new cousin brings her existing sister into the same cousin network without merging fathers or clearing a feud',()=>{
 const b=world();b.run(`var sister=makeKin(a,'亲');S.cands.push(sister);addConsort(sister,1,'入宫');addConsort(g,1,'入宫');var other=makeKin(g,'堂');S.cands.push(other);addConsort(other,1,'入宫');assert.equal(a.house.father.id,sister.house.father.id);assert.equal(new Set([a,g,other].map(c=>c.house.father.id)).size,3);assert.equal(a.house.father.siblingFatherIds.length,2);assert.ok(/^堂/.test(sister.kin[g.id]));assert.ok(/^堂/.test(a.kin[other.id]));S.rel[rk(a,g)]=-60;a.kinRival[g.id]=1;var before=JSON.stringify(S);reconcileCousinFamilies();assert.equal(JSON.stringify(S),before);assert.equal(relGet(a,g),-60);assert.equal(a.kinRival[g.id],1);`);
});
test('unrelated same-surname women and rejected candidates do not increase the admitted cousin family',()=>{
 const b=world();b.run(`var x=makeGirl({sur:'沈',given:'云容',fam:{t:'知府',p:35}});addConsort(x,1,'入宫');assert.notEqual(x.clan,a.clan);assert.equal(x.house.father.siblingFatherIds,undefined);assert.equal(clanPalaceCount(a.clan),1);A.xxDrop(g.id);assert.equal(clanPalaceCount(a.clan),1);assert.equal(cousinFatherEntries(a).length,0);assert.equal(g.cousinAdmissionRecorded,undefined);`);
});
test('a household without a powerful clan still displays its actual palace membership',()=>{
 const b=world();b.run(`S.consorts=[];S.cands=[];var humble=makeGirl({sur:'柳',given:'知微',fam:{t:'寒门',p:5}});addConsort(humble,1,'入宫');assert.match(familyGraphSVG(),/在宫妃嫔 1 人/);assert.doesNotMatch(familyGraphSVG(),/在宫妃嫔 0 人/);`);
});
test('a constant random stream cannot trap name generation in an endless repeated-character loop',()=>{
 const b=world();b.run(`Math.random=()=>.5;var girl=makeGirl();assert.equal(girl.given.length,2);assert.notEqual(girl.given[0],girl.given[1]);`);
});
test('existing recorded cousins repair once on load even when offices previously separated their clan keys',()=>{
 let b=world();b.run(`addConsort(g,1,'入宫');S.cands=[];g.clan='沈|直隶总督';delete a.house.father.siblingFatherIds;delete g.house.father.siblingFatherIds;save('auto');`);const id=b.run('a.id'),gid=b.run('g.id');
 b=boot(91,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var a=byId(${id}),g=byId(${gid});assert.equal(g.clan,a.clan);assert.ok(a.house.father.siblingFatherIds.includes(g.house.father.id));var before=JSON.stringify(S);reconcileCousinFamilies();assert.equal(JSON.stringify(S),before);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(clanPalaceCount(a.clan),2);`);
});
test('pending current selection and its result survive fresh reload without duplicating the family announcement',()=>{
 let b=world();b.run(`A.xxTake(g.id);`);const gid=b.run('g.id');b=boot(92,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);choose(1);assert.match(modalResult.text,/由1人增至2人/);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();var g=byId(${gid});assert.equal(g.story.filter(s=>s.t.includes('【同族入宫】')).length,1);`);
});
for(const name of ['coronation','cousin-selection','birth'])test('published v39 '+name+' replays before applying new content',()=>{
 const payload=require('./fixtures/court-family-legacy-v39.json')[name],b=boot(396,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,39);assert.equal(S.flags.openingQueenKinChecked,undefined);assert.ok(!S.ministries?.foundingRoster);assert.ok(!S.flags.dowager.lastYears);drain();assert.equal(PalaceActions.contentVersion,66);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
for(const name of ['coronation','selection'])test('published v41 '+name+' preserves its original opening court and grouped admission journal',()=>{
 const payload=require('./fixtures/court-family-legacy-v41.json')[name],b=boot(396,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,41);assert.equal(S.flags.openingQueenKinChecked,undefined);assert.ok(!S.ministries?.foundingRoster);drain();assert.equal(PalaceActions.contentVersion,66);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
test('published v42 opening keeps the six-month court pacing without activating newer birth and family draws',()=>{
 const payload=require('./fixtures/court-family-legacy-v42.json'),b=boot(396,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,42);assert.equal(S.flags.openingQueenKinChecked,undefined);assert.ok(!S.ministries?.foundingRoster);drain();assert.equal(PalaceActions.contentVersion,66);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
