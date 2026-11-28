const test=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
// An empress with one younger sister in the household register, nominated for the next selection.
function setup(prep=''){
 const b=boot(187);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;var a=empress(),h=houseOf(a);a.age=27;h.natal.memberBorn[a.id]=S.turn-27*12;
 var younger=addNatalPerson(a,h,'f',18,183,false);younger.willing=true;younger.married=false;
 for(const p of h.relatives)if(p!==younger)p.willing=false;
 delete a.solitary;a.trait='温婉';a.mood=50;a.favor=50;a.xin=null;delete a.xinLog;
 var id=younger.id,host=a.id,TITLE='姐妹应选 · 储秀宫名册',news=p=>p.story.filter(e=>e.life?.title===TITLE);
 PalaceActions.reset();${prep}A.nominateRelative(a.id,id);`);
 return b;
}
test('a consort hears that her own sister is on the new roster: chronicle, mood and 心境',()=>{
 const b=setup();b.run(`genCands();var g=S.cands.find(x=>x.id===id);assert.ok(g);
 assert.equal(news(a).length,1);assert.match(news(a)[0].t,/妹妹.*列入本届秀女名册/);assert.match(news(a)[0].t,/软底鞋/);
 assert.equal(a.mood,56);assert.equal(xinOf(a),'欢喜');assert.match(a.xin.why,/妹妹/);
 assert.equal(news(g).length,1);assert.match(news(g)[0].t,/姐姐托人捎来话/);assert.equal(news(younger).length,1);
 assert.match(selectionNieceArrivalNote(g),/软底鞋/);assert.equal(a.selectionSisterNews.kind,'glad');`);
});
const cases=[
 ['an old quarrel turns into resentment and no message','S.rel[rk(a,{id:younger.id})]=-60;a.trait=\'爽直\';','resent','嫉恨',40,/没有给妹妹捎话/,/没有捎来一句话/],
 ['a jealous sister fears sharing the favor','a.trait=\'善妒\';S.rel[rk(a,{id:younger.id})]=40;','wary','忧心',44,/不会让着你|别指望我|心里难受|各守位分/,/一根刺/],
 ['a lukewarm bond leaves her uneasy','S.rel[rk(a,{id:younger.id})]=10;','mixed','忧心',51,/想清楚了/,/有暖也有冷/],
 ['a quiet consort answers in her own voice','a.trait=\'沉静\';','glad','欢喜',56,/槐树/,/姐姐托人捎来话/]
];
for(const [name,prep,kind,xin,mood,own,heard] of cases)test(name,()=>{
 const b=setup(prep);b.run(`genCands();var g=S.cands.find(x=>x.id===id);assert.equal(a.selectionSisterNews.kind,'${kind}');
 assert.equal(xinOf(a),'${xin}');assert.equal(a.mood,${mood});assert.match(news(a)[0].t,${own});assert.match(news(g)[0].t,${heard});`);
});
test('one entry per sister and selection, across repeats and a reload; a new selection writes again',()=>{
 const b=setup();b.run(`genCands();var g=S.cands.find(x=>x.id===id);recordSelectionSisters(g);recordSelectionSisters(g);
 assert.equal(news(a).length,1);assert.equal(news(g).length,1);assert.equal(a.mood,56);
 save('auto');A.load('auto');drain();a=byId(host);g=S.cands.find(x=>x.id===id);recordSelectionSisters(g);assert.equal(news(a).length,1);
 A.xxDrop(id);A.xxEnd();drain();younger=houseOf(a).relatives.find(p=>p.id===id);S.turn+=36;A.nominateRelative(host,id);genCands();
 assert.equal(news(a).length,2);assert.notEqual(news(a)[0].thread,news(a)[1].thread);`);
});
test('generated blood sisters react, the other sisters already in the palace too; cousins do not',()=>{
 const b=setup();b.run(`S.flags.familyNominees=[];var other=makeKin(a,'亲');other.trait='骄矜';addConsort(other,2,'入宫');other.mood=50;other.favor=70;
 var newcomer=makeKin(a,'亲');delete a.kinRival[newcomer.id];delete newcomer.kinRival[a.id];var cousin=makeKin(a,'堂');
 S.cands=[newcomer,cousin];S.selection={phase:'audience',current:newcomer.id,performed:[]};selectionBatch();
 for(const c of S.cands)recordSelectionSisters(c);
 assert.equal(news(a).length,1);assert.equal(news(other).length,1);assert.equal(news(newcomer).length,2);assert.equal(news(cousin).length,0);
 assert.match(news(a)[0].t,new RegExp(KIN_TXT[a.kin[newcomer.id]].replace(/^亲/,'')+fullName(newcomer)));
 assert.equal(other.selectionSisterNews.kind,'wary');assert.equal(xinOf(other),'忧心');assert.ok(other.mood<50);`);
});
test('a niece from the same register is not treated as a sister',()=>{
 const b=setup();b.run(`assert.equal(selectionSisters({id:-1,selectionNatalHost:host,familyBranchOrigin:{host,relative:-1}}).length,0);
 younger.parentRelativeId=h.relatives.find(p=>p!==younger)?.id??-7;assert.equal(selectionSisters({id,selectionNatalHost:host,age:18}).length,0);`);
});
test('journals before content 175 open the same selection without the sister reaction',()=>{
 const b=setup();b.run(`var real=journalContentVersion;journalContentVersion=()=>174;genCands();var g=S.cands.find(x=>x.id===id);
 assert.ok(g);assert.equal(news(a).length,0);assert.equal(news(g).length,0);assert.equal(a.mood,50);assert.equal(a.selectionSisterNews,undefined);
 assert.equal(selectionNieceArrivalNote(g),'');journalContentVersion=real;assert.equal(PalaceActions.releaseVersion,175);`);
});
