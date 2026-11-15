const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function setup(){const b=boot(821);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.consorts=S.consorts.slice(0,1);var c=harem()[0],h=houseOf(c);
 h.brother={id:'student-demo',name:'沈闻书',age:24,career:'student',education:'秀才',post:'秀才',alive:true,story:[]};houseOf(c);var e=officialEntry(c.id+':brother');E().energy=10;`);return b;}
test('all roster filters exclude students, including degree holders waiting for office',()=>{
 const b=setup();b.run(`for(var education of ['书生','秀才','举人','进士']){e.p.education=education;for(var [filter] of OFFICIAL_FILTERS){UI.officialsFilter=filter;assert.doesNotMatch(officialsTable(),/沈闻书/);assert.equal(officialFilterMatch(e.p,filter),false);}}
 assert.ok(officialEntry(e.key));UI.sel=e.key;assert.match(viewOfficial(),/沈闻书/);UI.officialsFilter='all';e.p.education='举人';assert.ok(appointRelative(e));assert.match(officialsTable(),/沈闻书/);assert.match(officialsTable(),/候补知县/);`);
});
test('both family officials and imperial exam officials have separate age and temperament cells',()=>{
 const b=setup();b.run(`var scholar=makeScholar();S.scholars=[scholar];UI.officialsFilter='all';var html=officialsTable();assert.ok(html.includes('<th>姓名</th><th>年龄</th><th>性格</th>'));
 for(var name of [h.father.name,scholar.name]){var row=html.split('<tr').find(x=>x.includes(name));assert.match(row,/data-label="年龄"/);assert.match(row,/data-label="性格"/);assert.equal((row.match(/<td /g)||[]).length,10);}
 var before=JSON.stringify(S);officialsTable();assert.equal(JSON.stringify(S),before);`);
});
