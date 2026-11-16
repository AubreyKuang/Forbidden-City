const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(592);b.ctx.assert=assert;b.run(`A.start();drain();
 var a=makeGirl({sur:'沈',given:'清和',fam:{t:'书香门第',p:60}});addConsort(a,3,'入宫');
 var sister=makeKin(a,'堂');addConsort(sister,2,'入宫');
 var other=makeGirl({sur:'顾',given:'明月',fam:{t:'太尉',p:70}});addConsort(other,3,'入宫');
 var k=makeKid(a,'f','清宁');k.pendingName=false;k.born=S.turn-24;
 A.go('family');var key=familyGroupKey(a);`);return b;}
test('graph has an explicit right-hand family control, hides all branches and shrinks the layout',()=>{
 const b=world();b.run(`var before=familyGraphSVG(),width=Number(before.match(/graph-sheet.*?width:(\\d+)px/)[1]);
 assert.match(before,/data-family-toggle=/);assert.match(before,/隐藏家族/);A.familyVisibilityToggle(key);
 var after=familyGraphSVG();assert.ok(after.includes(clanName(key)));assert.match(after,/显示家族/);
 for(var p of [a,sister,k])assert.ok(!after.includes("A.go('"+(p.sex?'kid':'consort')+"',"+p.id+")"));
 assert.ok(after.includes("A.go('consort',"+other.id+")"));assert.ok(Number(after.match(/graph-sheet.*?width:(\\d+)px/)[1])<width);
 assert.doesNotMatch(after,/NaN|undefined/);A.familyVisibilityToggle(key);assert.equal(familyGraphSVG(),before);`);
});
test('list and graph share hiding without altering kinship, people or history',()=>{
 const b=world();b.run(`var people=JSON.stringify([S.consorts,S.children,S.rel]);A.familyVisibilityToggle(key);UI.familyMode='list';
 var list=viewFamily(),part=list.split('data-family-key="'+key+'"')[1].split('</details>')[0];
 assert.match(part,/显示家族/);assert.doesNotMatch(part,/paternal-branch|family-person/);
 assert.equal(JSON.stringify([S.consorts,S.children,S.rel]),people);
 A.familyVisibilityToggle(key);assert.match(viewFamily(),/隐藏家族/);assert.ok(viewFamily().includes(a.given));`);
});
test('hiding persists after fresh-context loading and restoring has no gameplay cost',()=>{
 let b=world();const id=b.run('a.id');b.run(`var energy=E().energy;A.familyVisibilityToggle(key);assert.equal(E().energy,energy);save('1');`);
 b=boot(593,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var a=byId(${id}),key=familyGroupKey(a);
 assert.equal(familyGroupHidden(key),true);A.familyVisibilityToggle(key);assert.equal(familyGroupHidden(key),false);save('1');`);
 b=boot(594,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(familyGroupHidden(familyGroupKey(byId(${id}))),false);`);
});
test('ordinary unrelated families with the same surname have separate controls in both views',()=>{
 const b=world();b.run(`var x=makeGirl({sur:'柳',fam:{t:'寒门',p:5}}),y=makeGirl({sur:'柳',fam:{t:'寒门',p:5}});addConsort(x,1,'入宫');addConsort(y,1,'入宫');
 houseOf(x);houseOf(y);assert.notEqual(familyGroupKey(x),familyGroupKey(y));A.familyVisibilityToggle(familyGroupKey(x));
 for(var mode of ['graph','list']){UI.familyMode=mode;var html=viewFamily();assert.ok(!html.includes("A.go('consort',"+x.id+")"));assert.ok(html.includes("A.go('consort',"+y.id+")"));}`);
});
test('all families can be hidden and restored without blank giant sheets or lost headers',()=>{
 const b=world();b.run(`var keys=[...new Set(S.consorts.map(familyGroupKey))];keys.forEach(key=>A.familyVisibilityToggle(key));
 var html=familyGraphSVG();assert.ok(Number(html.match(/graph-sheet.*?height:(\\d+)px/)[1])<120);assert.doesNotMatch(html,/graph-consort|graph-child|paternal-links/);
 assert.equal((html.match(/显示家族/g)||[]).length,keys.length);A.familyVisibilityToggle(key);assert.match(familyGraphSVG(),/graph-consort/);`);
});
test('family controls and kin badges are read-only, and unrelated favorites receive no kin badge',()=>{
 const b=world();b.run(`var d=ensureDowager();d.clan=a.clan;var before=JSON.stringify(S);
 assert.match(dowagerKinTag(a),/dowager-kin-tag.*太后族亲/);assert.equal(dowagerKinTag(other),'');
 familyGraphSVG();UI.familyMode='list';viewFamily();assert.equal(JSON.stringify(S),before);
 d.alive=false;assert.match(dowagerKinTag(a),/太后族亲/);
 d.clan='别家|太尉';other.sur=a.sur;other.dowagerAffinity=100;assert.equal(dowagerKinTag(other),'');
 a.dowagerKin={gen:S.gen,relation:'侄女'};assert.match(dowagerKinTag(a),/太后族亲/);
 S.gen++;assert.equal(dowagerKinTag(a),'');`);
});
test('kin tag appears on roster and consort detail and a dowager cannot label herself as her own kin',()=>{
 const b=world();b.run(`S.flags.dowager.clan=a.clan;assert.match(consortCard(a),/dowager-kin-tag/);UI.sel=a.id;assert.match(viewConsort(),/dowager-kin-tag/);
 S.flags.dowager.personId=a.id;assert.equal(dowagerKinTag(a),'');`);
});
