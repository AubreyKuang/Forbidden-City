const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(821);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=10;S.consorts=[];S.children=[];
 var d=ensureDowager(),c=makeGirl({sur:d.sur,given:'清微',age:24,trait:'骄纵'});addConsort(c,4,'入宫');c.clan=d.clan;c.virtue=75;c.solitary=null;d.lastOffer=60;PalaceActions.reset();`);return b;}
test('praise has a shared six-month interval and a twelve-month interval for the same person',()=>{
 const b=world();b.run(`var before=JSON.stringify(d),ev=dowagerFavorEvent();assert.ok(ev);assert.equal(JSON.stringify(d),before);ev.onShow();ev.choices[0].f();assert.equal(dowagerFavorEvent(),null);
 S.turn+=6;assert.equal(dowagerFavorEvent(),null);S.turn+=6;assert.ok(dowagerFavorEvent());
 S.turn-=6;var other=makeGirl({sur:d.sur,age:25,trait:'温婉'});addConsort(other,4,'入宫');other.clan=d.clan;other.virtue=99;assert.ok(dowagerFavorEvent());S.turn--;assert.equal(dowagerFavorEvent(),null);`);
});
test('only the selected scene consumes the interval; a queued duplicate becomes invalid',()=>{
 const b=world();b.run(`var a=dowagerFavorEvent(),z=dowagerFavorEvent();assert.ok(a.valid()&&z.valid());a.onShow();assert.ok(a.valid());assert.equal(z.valid(),false);var memory=JSON.stringify(d.conversations);a.onShow();assert.equal(JSON.stringify(d.conversations),memory);
 a.choices[0].f();var favor=c.favor;a.choices[0].f();assert.equal(c.favor,favor);`);
});
test('ordinary conversation covers distinct topics and does not invent absent children or past victories',()=>{
 const b=world();b.run(`var keys=dowagerConversationTopics(d).map(t=>t.key);assert.equal(keys.length,7);assert.ok(!keys.includes('grandchild'));assert.ok(!keys.includes('frontier'));assert.ok(!keys.includes('cleared'));
 var seen=new Set();for(var month=0;month<7;month++){S.turn=60+month;var ev=dowagerEverydayEvent(d);ev.onShow();seen.add(ev.dowagerTopic);ev.choices[0].f();}assert.equal(seen.size,7);assert.equal(d.conversations.notes.length,7);`);
});
test('factual topics identify a real child, cleared mother, new selection and victorious commander',()=>{
 const b=world();b.run(`var k=makeKid(c,'f','清宁');k.parentage={decision:'cleared',resolvedAt:60};S.flags.lastXX=60;S.flags.frontierCampaigns=[{gen:S.gen,turn:60,outcome:'victory',name:'沈守义'}];
 var topics=dowagerConversationTopics(d);for(var key of ['grandchild','cleared','selection','frontier'])assert.ok(topics.some(t=>t.key===key));
 assert.match(topics.find(t=>t.key==='cleared').line,/清宁/);assert.match(topics.find(t=>t.key==='frontier').line,/沈守义/);
 k.alive=false;S.turn+=7;topics=dowagerConversationTopics(d);for(var key of ['grandchild','cleared','selection','frontier'])assert.ok(!topics.some(t=>t.key===key));`);
});
test('sixty months of forced praise requests still praise one woman at most once per year',()=>{
 const b=world();let count=0;for(let month=0;month<60;month++){b.run(`S.turn=${60+month};S.month=${month%12+1};`);b.force(.01);const key=b.run(`var ev=dowagerEvent();ev.onShow?.();ev.choices[0].f();ev.dowagerTopic`);if(key==='praise')count++;b.run(`assert.equal(dowagerEvent().title,'慈宁宫 · 静坐');assert.equal(dowagerFavorEvent(),null);`);}assert.ok(count<=5);assert.ok(count>0);
});
test('greeting results and praise intervals persist through an actual action replay',()=>{
 const b=world();b.force(.01);b.run(`A.greet();assert.equal(curEv.title,'慈宁宫');choose(0);var n=c.story.length;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.consorts[0].story.length,n);drain();assert.equal(dowagerFavorEvent(),null);A.greet();assert.equal(curEv.title,'慈宁宫 · 静坐');`);
});
test('everyday remarks retain the same topic, words and notes after refresh',()=>{
 const b=world();b.force(.9,0);b.run(`A.greet();var title=curEv.title,text=curEv.text;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);assert.equal(curEv.text,text);choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.dowager.conversations.notes.length,1);`);
});
test('birthday and family-promotion advice are not repeatable within the month; a deceased dowager cannot speak',()=>{
 const b=world();b.run(`S.month=9;var ev=dowagerEvent();assert.equal(ev.title,'太后千秋');ev.onShow();ev.choices[1].f();assert.equal(dowagerEvent().title,'慈宁宫 · 静坐');d.alive=false;assert.equal(dowagerEvent(),null);assert.equal(dowagerFavorEvent(),null);`);
});
test('real version 12 dowager praise replays without introducing new intervals',()=>{
 const data=require('./fixtures/dowager-praise-legacy-v12.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'慈宁宫');assert.ok(modalResult);assert.equal(S.flags.dowager.conversations,undefined);drain();`);
});
