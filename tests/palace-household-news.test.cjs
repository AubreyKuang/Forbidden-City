const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(){
 const b=boot(961);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;var q=empress(),a=harem().find(c=>c!==q);
 var add=r=>{const c=makeGirl({});addConsort(c,r,'入宫');return c;},b=add(5),d=add(2);
 a.rank=5;a.title='端';a.mood=40;S.rel[rk(q,a)]=60;S.rel[rk(b,a)]=-35;S.rel[rk(d,a)]=50;
 var notes=(p,t)=>p.story.filter(s=>s.t.includes(t));PalaceActions.reset();`);return b;
}
test('appointment records joy, queen, senior rival, ordinary friend, predecessor and a vacant central palace',()=>{
 const w=world();w.run(`var x=add(2);x.homeLeave={};appointHaremSteward(a);
 assert.equal(a.mood,48);assert.equal(notes(a,'【初领宫务】').length,1);assert.match(notes(q,'【闻协理任命】')[0].t,/圈得密密/);
 assert.match(notes(b,'【闻协理任命】')[0].t,/旧账/);assert.match(notes(d,'【闻协理任命】')[0].t,/热糕/);assert.equal(notes(x,'【闻协理任命】').length,0);
 assert.equal(appointHaremSteward(a),null);q.gone=true;appointHaremSteward(d);assert.match(notes(b,'【闻协理任命】').at(-1).t,/中宫虚位/);
 assert.match(notes(a,'【闻协理任命】').at(-1).t,/交出/);`);
});
test('queen recommends a senior friend, waits six months, seeks a single promotion, then stops on refusal',()=>{
 const w=world();w.force(0);
 w.run(`var proposal=queenHouseholdRecommendation();pushEv(proposal);assert.match(curEv.title,/分掌宫务/);choose(0);drain();
 assert.equal(haremStewardPerson(),a);assert.equal(S.flags.queenRecommendations.count,1);
 S.turn+=5;assert.equal(queenHouseholdRecommendation(),null);S.turn++;`);
 w.force(0);w.run(`pushEv(queenHouseholdRecommendation());assert.match(curEv.title,/请晋一级/);choose(0);drain();assert.equal(a.rank,6);
 assert.equal(S.flags.queenRecommendations.count,2);S.turn+=6;assert.equal(queenHouseholdRecommendation(),null);S.year++;`);
 w.force(0);w.run(`pushEv(queenHouseholdRecommendation());choose(1);drain();assert.equal(a.rank,6);var id=q.id;save('auto');A.load('auto');drain();S.turn+=24;S.year+=2;
 assert.equal(byId(id).declinedHouseholdGen,S.gen);assert.equal(queenHouseholdRecommendation(),null);`);
});
test('a full higher rank or a friendship that has ended prevents the queued petition',()=>{
 const w=world();w.force(0);w.run(`appointHaremSteward(a);var ev=queenHouseholdRecommendation();assert.ok(eventStillValid(ev));
 add(6);add(6);assert.equal(eventStillValid(ev),false);assert.equal(ev.choices[0].f(),null);assert.equal(a.rank,5);
 S.rel[rk(a,q)]=-10;assert.equal(queenHouseholdRecommendation(),null);`);
});
for(const close of [true,false])test('pregnant companions leave distinct dated memories, survive a reload, and cool down: '+close,()=>{
 const w=world();w.run(`for(const c of harem())c.preg=0;a.preg=4;b.preg=6;a.hp=b.hp=90;S.rel[rk(a,b)]=${close?60:0};E().energy=5;PalaceActions.reset();`);
 w.force(.9,0);w.run(`A.out('garden');assert.match(curEv.title,/孕中同游/);assert.ok(curEv.cast.includes(a)&&curEv.cast.includes(b));var ids=[a.id,b.id];save('auto');A.load('auto');
 assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/孕中同游/);choose(1);save('auto');A.load('auto');drain();a=byId(ids[0]);b=byId(ids[1]);
 for(const c of [a,b]){assert.equal(notes(c,'【孕中同游').length,1);assert.match(notes(c,'【孕中同游')[0].t,/${close?'心里还暖着':'来往平常'}/);}
 assert.equal(pregnancyGardenEvent(),null);S.turn+=3;b.concealedLoss={};assert.equal(pregnancyGardenEvent(),null);delete b.concealedLoss;
 S.rel[rk(a,b)]=-20;assert.equal(pregnancyGardenEvent(),null);b.preg=0;assert.equal(pregnancyGardenEvent(),null);`);
});
for(const sex of ['m','f'])test('named auspicious newborn has warm and hostile observers, exactly once for each',()=>{
 const w=world();w.run(`var k=makeKid(a,'${sex}','安宁');k.birthLabels=['red'];a.delivery={children:[k.id],turn:S.turn,date:dateStr(),settled:false,difficult:false};
 var result=finishDelivery(a);assert.match(result,/赤霞映阙/);assert.match(notes(q,'【听闻皇嗣祥瑞】')[0].t,/${sex==='m'?'旧绫':'小花鞋'}/);
 assert.match(notes(q,'【听闻皇嗣祥瑞】')[0].t,/中宫/);assert.match(notes(b,'【听闻皇嗣祥瑞】')[0].t,/照宫例送/);
 assert.equal(notes(d,'【听闻皇嗣祥瑞】').length,0);finishDelivery(a);assert.equal(notes(q,'【听闻皇嗣祥瑞】').length,1);`);
});
