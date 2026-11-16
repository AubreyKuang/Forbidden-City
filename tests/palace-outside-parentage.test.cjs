const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs');
const {boot}=require('./playtest-harness.cjs');

function household(imperial=true,suspected=true){
  const w=world();w.ctx.assert=assert;
  w.run(`officialMarriageConfirm(ref,br,agree(ref,br));
    beginNatalPregnancy(other,sister,{unconfirmed:true});
    Object.assign(sister.natalPregnancy,{noted:true,husbandSuspects:${suspected},imperialParentage:${imperial},difficult:false});
    S.turn=sister.natalPregnancy.due;natalPregnancyTick();
    var child=oh.relatives.find(p=>p.parentRelativeId===sister.id),id=child.id,host=other.id,husband=h.brother,oldName=child.name;
    PalaceActions.reset();`);
  return w;
}
function openCase(w){
  w.run(`S.turn=child.born+3;outsideParentageTick();assert.equal(curEv.title,'宫外家书 · 身世起疑');nextEv();A.outsideParentage(host,id);`);
}
function investigate(w){
  w.run(`choose(0);drain();S.turn++;A.outsideParentage(host,id);assert.equal(curEv.title,'宫外身世回奏');`);
}

test('husband suspicion can be sealed, then reopened without changing the child or the saved truth',()=>{
  const w=household();openCase(w);
  w.run(`var count=S.children.length;choose(1);assert.equal(child.outsideParentage.status,'suppressed');assert.equal(child.unconfirmedParentage,true);assert.equal(S.children.length,count);assert.equal(child.name,oldName);
    for(var person of [child,sister,husband,E()])assert.match(person.story.at(-1).t,/将疑问暂压/);
    drain();outsideParentageTick();assert.equal(modalOpen,false);assert.match(outsideParentagePanel(other,child),/重阅身世旧案/);A.outsideParentage(host,id);assert.equal(curEv.title,'重阅旧案');`);
  investigate(w);w.run(`assert.match(curEv.text,/确系皇帝亲生/);`);
});

test('a child stays in the original family when the inquiry confirms that the husband is the father',()=>{
  const w=household(false);openCase(w);investigate(w);
  w.run(`assert.match(curEv.text,/为生父/);choose(0);assert.equal(child.outsideParentage.status,'cleared');assert.equal(child.unconfirmedParentage,undefined);assert.equal(child.fatherId,husband.id);assert.ok(oh.relatives.includes(child));assert.match(husband.story.at(-1).t,/确是亲生/);assert.match(child.story.at(-1).t,/疑问已经查清/);drain();assert.equal(modalOpen,false);`);
});

test('confirmed imperial parentage can stay private while the child continues living in the original home',()=>{
  const w=household();openCase(w);investigate(w);
  w.run(`choose(0);assert.equal(curEv.title,'骨肉归处');choose(2);assert.equal(child.outsideParentage.status,'proved');assert.equal(kidById(id),undefined);A.outsideParentage(host,id);choose(1);assert.equal(child.outsideParentage.status,'stayed');assert.ok(oh.relatives.includes(child));assert.equal(kidById(id),undefined);assert.match(outsideParentagePanel(other,child),/生父为.*仍留在原家/);assert.match(natalParentLinks(other,child),/婚籍所载父亲/);for(var person of [child,sister,husband,E(),other])assert.match(person.story.at(-1).t,/留在原家/);`);
});

test('recognition moves the same identity into the royal roster once and the original family still links to it',()=>{
  let w=household();openCase(w);investigate(w);w.run(`choose(0);assert.equal(curEv.title,'骨肉归处');`);
  const id=w.run('id'),host=w.run('host'),born=w.run('child.born'),name=w.run('child.given');
  w=boot(78,w.storage);w.ctx.assert=assert;
  w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'骨肉归处');var host=byId(${host}),h=houseOf(host),child=h.relatives.find(p=>p.id===${id}),oldStory=child.story.length,originalMother=child.parentRelativeId,births=S.ys.b,husband=careerPeople().find(e=>e.p.id===child.fatherId).p;choose(0);var royal=kidById(${id});assert.ok(royal);assert.equal(royal.name,${JSON.stringify(name)});assert.equal(royal.born,${born});assert.equal(royal.mom,originalMother);assert.equal(royal.foster,host.id);assert.equal(royal.story.length,oldStory+1);assert.equal(S.ys.b,births);assert.ok(!h.relatives.includes(child));assert.equal(royal.outsideParentage.status,'recognized');assert.ok(outsideMotherLink(royal).includes("A.go('natal'"));assert.match(royal.story.at(-1).t,/认回宫中/);assert.match(husband.story.at(-1).t,/送到门前/);assert.match(E().story.at(-1).t,/皇室宗谱/);assert.equal(familyTreeRegistry().nodes.find(n=>n.p.id===royal.id).p,royal);`);
  w=boot(79,w.storage);w.ctx.assert=assert;
  w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.children.filter(k=>k.id===${id}).length,1);drain();A.go('natal','${host}:${id}');assert.equal(UI.view,'kid');assert.match(viewKid(),/已认回宫中/);`);
});

test('an existing unconfirmed child can pick up the saved husband-suspicion history and adults do not reroll it',()=>{
  const w=household(true,false);w.run(`delete child.outsideParentage;var history=sister.pregnancyHistory.at(-1);delete history.imperialParentage;history.husbandSuspects=true;
    S.turn=child.born+24;outsideParentageTick();assert.equal(curEv.title,'宫外家书 · 身世起疑');var outcome=child.outsideParentage.imperial;Math.random=()=>{throw Error('rerolled')};outsideParentageTick();assert.equal(child.outsideParentage.imperial,outcome);assert.equal(husband.story.filter(e=>e.t.startsWith('【丈夫起疑】')).length,1);`);
});

test('a commoner husband has his own readable notes even without a court official profile',()=>{
  const w=household();w.run(`sister.spouse={id:'spouse:'+sister.id,name:'陈文',alive:true};child.fatherId=sister.spouse.id;child.fatherName=sister.spouse.name;`);
  openCase(w);w.run(`choose(1);assert.match(sister.spouse.story.at(-1).t,/将疑问暂压/);UI.sel=host+':'+sister.id;assert.match(viewNatalRelative(),/陈文的身世纪事/);`);
});
