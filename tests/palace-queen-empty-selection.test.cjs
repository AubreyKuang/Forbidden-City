const test=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function setup(){
 const b=world();b.ctx.assert=assert;
 b.run(`var finishEmpty=()=>{genCands(1);A.xxRoster();for(const {id} of [...S.cands])A.xxDrop(id);A.xxEnd();};
 var queenNotes=c=>c.story.filter(e=>e.t.startsWith('【选秀定榜·中宫见空册】'));
 var reactions=()=>Q.filter(e=>e.title===QUEEN_EMPTY_TITLE).length+Number(curEv?.title===QUEEN_EMPTY_TITLE);
 PalaceActions.reset();`);
 return b;
}
const storyCases={
 qingyi:['返乡','家书'],luwan:['关外驿路','雨还没落'],ayimu:['初来京中','撂牌'],chuwan:['家籍','写错'],
 suheng:['香样','封条'],xiaoman:['灯市散场','抬箱子'],gouyi:['一双手','名帖'],hongjian:['代笔','素笺']
};
for(const [key,[queenPhrase,consortPhrase]] of Object.entries(storyCases))test('authored empty selection voice in both palace roles for '+key,()=>{
 const b=setup();b.ctx.which=key;b.ctx.queenPhrase=queenPhrase;b.ctx.consortPhrase=consortPhrase;
 b.run(`a.fixedStory=which;
 if(which==='gouyi')a.gouyi={opened:true};
 if(which==='hongjian')a.hongjian={gen:S.gen,admitted:S.turn};
 a.trait='善妒';var ordinary=q;
 finishEmpty();assert.equal(curEv.por,ordinary);assert.equal(reactions(),1);
 assert.match(a.selectionConcern.text+a.selectionConcern.quote,new RegExp(consortPhrase));
 assert.ok(a.story.some(s=>s.t.startsWith('【选秀礼毕·六宫议论】')&&s.t.includes('无人留选')));
 assert.match(a.story.at(-1).t,/无人留选/);assert.equal(queenNotes(a).length,0);
 choose(1);drain();ordinary.rank=4;a.rank=8;assignPalace(a);
 finishEmpty();assert.equal(curEv.por,a);assert.match(curEv.text,new RegExp(queenPhrase));
 assert.ok(curEv.choices[0].t!==curEv.choices[1].t);assert.equal(queenNotes(a).length,1);
 choose(0);drain();assert.ok(a.selectionConcern.reply);
 assert.ok(a.story.some(e=>e.t.startsWith('【选秀定榜·中宫答话】')));`);
});

test('each regular personality has its own voice, and accepting her suggestion can be reloaded exactly once',()=>{
 let b=setup();
 b.run(`var profiles=Object.keys(TRAITS).map(trait=>queenEmptySelectionData({...q,trait}));
 for(const field of ['text','quote','action','reply'])assert.equal(new Set(profiles.map(p=>p[field])).size,Object.keys(TRAITS).length);
 q.trait='善妒';genCands(1);S.cands=[makeGirl({sur:'段',given:'初晴',fam:{t:'农家',p:5}})];A.xxRoster();A.xxDrop(S.cands[0].id);
 q.mood=60;q.aff=50;A.xxEnd();
 assert.equal(curEv.title,QUEEN_EMPTY_TITLE);assert.match(curEv.text,/松了口气/);assert.equal(q.mood,65);
 assert.equal(S.selection,undefined);assert.equal(queenNotes(q).length,1);
 assert.ok(!q.story.some(e=>e.t.startsWith('【选秀礼毕·六宫议论】')));
 save('auto');`);
 const id=b.run('q.id');
 b=boot(195,b.storage);b.ctx.assert=assert;b.ctx.id=id;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,QUEEN_EMPTY_TITLE);
 var q=byId(id);assert.equal(q.mood,65);assert.equal(q.aff,50);choose(0);
 assert.equal(q.aff,52);assert.equal(q.story.filter(e=>e.t.startsWith('【选秀定榜·中宫答话】')).length,1);
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);
 drain();q=byId(id);A.xxEnd();
 assert.equal(q.aff,52);assert.equal(q.story.filter(e=>e.t.startsWith('【选秀定榜·中宫见空册】')).length,1);
 assert.equal(q.story.filter(e=>e.t.startsWith('【选秀定榜·中宫答话】')).length,1);`);
});

test('a real batch can end empty at the month boundary and the routine reply leaves affection unchanged',()=>{
 const b=setup();
 b.run(`q.trait='好客';q.mood=60;q.aff=50;genCands(1);var turn=S.turn;A.endMonth();
 assert.equal(S.turn,turn+1);assert.equal(curEv.title,QUEEN_EMPTY_TITLE);
 assert.match(curEv.text,/一壶热茶/);assert.equal(q.selectionConcern.turn,turn);
 var before=q.aff;choose(1);drain();assert.equal(q.aff,before);
 assert.equal(queenNotes(q).length,1);assert.equal(S.cands.length,0);`);
});

test('a skipped selection, a nonempty roster, and an absent queen do not trigger the empty roster scene',()=>{
 const b=setup();
 b.run(`A.xxEnd();assert.equal(reactions(),0);assert.equal(queenNotes(q).length,0);
 S.turn=71;S.year=7;S.month=2;scheduledSelectionEvent().choices[1].f();
 assert.equal(reactions(),0);assert.equal(queenNotes(q).length,0);
 genCands(1);A.xxRoster();A.xxTake(S.cands[0].id);choose(1);drain();A.xxEnd();assert.equal(reactions(),0);drain();
 assert.equal(queenNotes(q).length,0);
 q.homeLeave={};finishEmpty();assert.equal(reactions(),0);assert.equal(queenNotes(q).length,0);`);
});
