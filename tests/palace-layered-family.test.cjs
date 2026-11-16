const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`officialMarriageConfirm(ref,br,agree(ref,br));beginNatalPregnancy(other,sister);sister.natalPregnancy.difficult=false;S.turn=sister.natalPregnancy.due;natalPregnancyTick();var baby=oh.relatives.find(p=>p.parentRelativeId===sister.id);assert.ok(baby);`);return b;}
test('a known interfamily couple has one child node in the paternal branch, and maternal links remain real',()=>{
 const b=setup();b.run(`var nodes=familyTreeRegistry().nodes.filter(n=>n.p.id===baby.id);assert.equal(nodes.length,1);assert.equal(nodes[0].parent,h.brother.id);assert.equal(nodes[0].home,c);assert.equal(nodes[0].mother.p,sister);assert.equal(familyTreeChildren(sister).length,0);assert.equal(familyTreeChildren(h.brother)[0].p,baby);
 assert.equal(natalEntry(c.id,baby.id).p,baby);assert.equal(natalEntry(other.id,baby.id).p,baby);assert.equal(natalLabel(c,baby),baby.sex==='m'?'侄子':'侄女');assert.equal(natalLabel(other,baby),baby.sex==='m'?'外甥':'外甥女');assert.match(natalLifePanel(other,sister),new RegExp(baby.name));`);
});
test('two levels fold independently, a child appears exactly once, and royal father-daughter links remain',()=>{
 const b=setup();b.run(`UI.view='family';assert.ok(!familyGraphSVG().includes('data-family-child-id="'+baby.id+'"'));A.familyTreeToggle(c.id,h.brother.id);var graph=familyGraphSVG();assert.equal(graph.split('data-family-child-id="'+baby.id+'"').length-1,1);assert.match(graph,/paternal-links/);assert.match(graph,/收起沈明远的子女/);assert.ok(!familyHouseTree(other).includes('data-family-child-id="'+baby.id+'"'));var height=familyHouseHeight(c);A.familyTreeToggle(c.id,h.father.id,true);assert.ok(familyHouseHeight(c)<height);assert.ok(!familyHouseTree(c).includes(baby.name));A.familyTreeToggle(c.id,h.father.id,true);assert.ok(familyHouseTree(c).includes(baby.name));`);
});
test('old saves infer father from the saved marriage without generating or renaming a child',()=>{
 const b=setup();b.run(`var name=baby.name,id=baby.id,count=oh.relatives.length;for(var legacy of [undefined,'spouse:'+sister.id]){baby.fatherId=legacy;assert.equal(familyTreeChildren(h.brother)[0].p,baby);assert.equal(baby.name,name);assert.equal(baby.id,id);assert.equal(oh.relatives.length,count);assert.equal(baby.fatherId,legacy);}baby.fatherName='另有记载的生父';assert.equal(familyTreeChildren(h.brother).length,0);`);
});
test('the chart retains a paternal branch when the father’s sister has left the palace and hides the maternal child hint',()=>{
 const b=setup();b.run(`c.gone=true;UI.view='family';A.familyTreeToggle(c.id,h.brother.id);var graph=familyGraphSVG(),marker='data-family-child-id="'+baby.id+'"';assert.equal(graph.split(marker).length-1,1);assert.match(graph,/已出宫/);assert.ok(familyHouseTree(c).includes(marker));assert.ok(!familyHouseTree(other).includes(marker));assert.doesNotMatch(familyHouseTree(other),/名子女列于/);`);
});
test('the family list uses the same paternal hierarchy and retains every known relative entry',()=>{
 const b=setup();b.run(`UI.familyMode='list';A.familyTreeToggle(c.id,h.brother.id);var html=viewFamily();assert.equal(html.split('data-family-child-id="'+baby.id+'"').length-1,1);assert.match(html,/family-tree-branches/);for(var p of [h.father,h.brother,sister,oh.father])assert.ok(html.includes(p.name),p.name);assert.ok(!familyHouseTree(other,true).includes('data-family-child-id="'+baby.id+'"'));`);
});
test('known dead fathers retain their children and unknown husbands do not acquire invented branches',()=>{
 const b=setup();b.run(`h.brother.alive=false;assert.equal(familyTreeChildren(h.brother)[0].p,baby);delete baby.fatherId;delete sister.spouse.personId;assert.equal(familyTreeChildren(sister)[0].p,baby);assert.equal(familyTreeChildren(h.brother).length,0);`);
});
test('paternal links open the same child profile with both parents, including after adulthood and reload',()=>{
 const b=setup();b.run(`var host=c.id,id=baby.id,motherId=other.id;PalaceActions.reset();A.go('natal',host+':'+id);assert.match(viewNatalRelative(),/父亲：/);assert.match(viewNatalRelative(),/母亲：/);assert.match(viewNatalRelative(),new RegExp(sister.name));save('1');load('1');var entry=natalEntry(host,id);assert.ok(entry);assert.equal(entry.p.id,id);entry.p.sex='m';entry.p.born=S.turn-18*12;UI.view='natal';UI.sel=host+':'+id;assert.doesNotThrow(()=>viewNatalRelative());assert.equal(UI.view,'official');assert.equal(officialEntry(UI.sel).p.id,id);`);
});
