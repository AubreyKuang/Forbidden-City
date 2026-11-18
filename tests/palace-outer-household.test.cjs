const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(seed=34,storage){
  const b=boot(seed,storage);b.ctx.assert=assert;
  b.run(storage?"A.load('auto');assert.equal(PalaceActions.blocked,false);":"A.start();drain();");
  return b;
}
function household(){
  const b=game();b.run(`A.outerMeet('市井','city');choose(0);drain();
    var m=outerBook().mothers[0];outerBirth(m);var k=outerBook().children[0];`);return b;
}
test('adult encounters use an outing and earn trust across visits; the reported pregnancy, birth and pending choice survive reload',()=>{
  let b=game();b.run(`
    var energy=E().energy;A.outerMeet('市井','city');assert.equal(E().energy,energy-1);
    choose(0);drain();var m=outerBook().mothers[0];assert.ok(m.age>=18);
    A.outerVisit(m.id);assert.equal(modalOpen,false);
    for(let i=0;i<2;i++){S.turn++;A.outerVisit(m.id);assert.ok(!curEv.choices.some(c=>c.t.includes('明早')));choose(0);drain();}
    S.turn++;A.outerVisit(m.id);Math.random=()=>.1;choose(2);drain();
    assert.ok(m.preg);assert.doesNotMatch(outerRegisterView(),/有喜|怀孕/);
    S.turn=m.preg.notice;outerMonthly();assert.match(curEv.title,/宫外来信/);choose(1);drain();
    S.turn=m.preg.due;outerMonthly();var k=outerBook().children[0];assert.equal(k.born,S.turn);
    nextEv();A.outerPetition(k.id);assert.match(curEv.title,/报生书/);`);
  b=game(66,b.storage);b.run(`var k=outerBook().children[0],m=outerMother(k.mother);
    assert.match(curEv.title,/报生书/);choose(4);drain();assert.equal(k.register,'寄养姓');assert.equal(k.fee,6);
    assert.equal(S.children.some(c=>c.id===k.id),false);assert.ok(!S.log.some(n=>n.t.includes(k.alias)));
    assert.match(outerRegisterView(),/顾家/);assert.match(outerRegisterView(),/真名 ＊＊/);
    E().treasury=2;assert.equal(outerHouseholdExpense(),2);assert.equal(k.fee,2);assert.equal(outerHouseholdExpense(),2);
    assert.equal(outerBook().notes.filter(n=>n.title==='家用裁减').length,1);`);
});
test('a real selection calls an adult daughter, warns before audience, and resolves her residence and discovery exactly once',()=>{
  let b=household();b.run(`k.sex='f';A.outerPetition(k.id);choose(1);drain();
    k.born=S.turn-17*12;k.path='候选秀';genCands();assert.ok(!k.pending.includes('roster'));
    k.born=S.turn-18*12;PalaceActions.reset();A.go('outer');genCands();assert.match(curEv.title,/名册/);
    assert.ok(curEv.text.includes(k.token));choose(2);nextEv();assert.equal(k.path,'待殿选');
    nextEv();A.outerPetition(k.id);assert.match(curEv.title,/殿选/);`);
  b=game(67,b.storage);b.run(`var k=outerBook().children[0];choose(0);drain();
    assert.equal(k.path,'宫中留名');assert.ok(!S.consorts.some(c=>c.id===k.id));assert.ok(outerBook().awards.includes('暗度陈仓'));
    Math.random=()=>0;S.turn++;outerMonthly();assert.match(curEv.title,/认出了故人/);
    choose(3);drain();assert.notEqual(k.path,'宫中留名');assert.equal(outerBook().notes.filter(n=>n.title==='认出身世').length,1);`);
});
test('an aspiring son appears on a completed real exam, keeps a real career and can decline late recognition',()=>{
  const b=household();b.run(`k.sex='m';A.outerPetition(k.id);choose(2);drain();k.born=S.turn-18*12;k.lit=85;k.path='候会试';
    var before=(S.scholars||[]).length;var exam=examEvent();assert.equal(k.officialId,undefined);
    pushEv(exam);choose(0);drain();var p=scholarById(k.officialId);assert.equal(p.name,k.alias);assert.equal(p.examRank,'进士');
    outerExamResults();assert.equal(S.scholars.filter(p=>p.outerChildId===k.id).length,1);
    A.outerPetition(k.id);choose(0);drain();assert.equal(p.office,'州府通判');
    A.outerCare(k.id,'identity');choose(curEv.choices.findIndex(c=>c.t.includes('核验')));drain();
    S.turn++;outerMonthly();assert.match(curEv.title,/太后问话/);choose(0);drain();assert.equal(k.refused,true);
    assert.ok(!kidById(k.id));assert.equal(k.pedigree,'未入');`);
});
test('recognition uses separate months and corroboration, keeps identity, birthday and stats, and makes publication optional',()=>{
  for(const publish of [true,false]){
    const b=household();b.run(`A.outerPetition(k.id);choose(3);drain();k.lit=72;
      A.outerCare(k.id,'identity');choose(curEv.choices.findIndex(c=>c.t.includes('核验')));drain();
      for(let i=0;i<5;i++){S.turn++;outerMonthly();if(modalOpen){choose(0);drain();}}
      var royal=kidById(k.id);assert.ok(royal);assert.equal(royal.born,k.born);assert.equal(royal.lit,k.lit);
      assert.equal(outerBook().notes.filter(n=>n.title==='归宗补证').length,1);
      A.outerPetition(k.id);assert.match(curEv.title,/史官/);choose(${publish?0:1});drain();
      assert.equal(S.log.filter(n=>n.t.includes('帝认皇')).length,${publish?1:0});
      assert.ok(outerBook().awards.includes('认祖归宗'));S.over=true;assert.match(viewLog(),/野史拾遗/);
      assert.equal(outerRegisterView().includes('onclick="A.outerCare'),false);`);
  }
});
test('private milestones, education, exposure and witness controls are dated, capped and do not duplicate on the same month',()=>{
  const b=household();b.run(`A.outerPetition(k.id);choose(1);drain();
    S.turn=k.born+36;outerMonthly();outerMonthly();assert.equal(outerBook().notes.filter(n=>n.title==='三岁家报').length,1);
    S.turn=k.born+72;outerMonthly();choose(0);drain();assert.equal(k.lesson,'读书');A.outerCare(k.id,'school');assert.equal(modalOpen,false);
    S.turn=k.born+120;outerMonthly();choose(1);drain();assert.equal(k.knowledge,'怀疑');
    A.outerCare(k.id,'witness');choose(1);choose(2);drain();assert.ok(!k.witnesses[1].active);assert.equal(k.clues,1);
    k.secret=19;S.turn++;outerMonthly();assert.match(curEv.title,/御前/);choose(0);drain();
    assert.ok(k.exposed);assert.ok(outerBook().awards.includes('满城风雨'));
    outerMonthly();assert.deepEqual(k.alerts,[60,40,20]);assert.ok(!k.pending.includes('leak20'));`);
});
test('sisters use an actual adult relative and prenatal calendar; a reunion has an earlier memory and there is one meeting per month',()=>{
  const b=game();b.run(`var c=empress(),h=houseOf(c);addNatalPerson(c,h,'f',23,1234567,false);
    A.outerMeet('姊妹','home');assert.ok(curEv);choose(0);drain();var m=outerBook().mothers[0];
    assert.equal(m.name,outerSister(m).name);assert.ok(natalAge(outerSister(m))>=18);
    outerSister(m).married=true;outerSister(m).spouse={name:'许文',alive:true};
    m.preg={notice:S.turn+2,due:S.turn+9};assert.equal(natalPregnancyReady(outerSister(m)),false);
    A.outerMeet('旧识','suzhou');assert.equal(modalOpen,false);
    S.year=3;S.turn+=24;A.outerMeet('旧识','suzhou');assert.match(curEv.text,/渡头|订亲|藩邸|大雨/);choose(0);drain();
    assert.ok(outerBook().mothers[1].aff>m.aff);assert.ok(outerBook().mothers[1].trust>m.trust);
    var count=outerBook().mothers.length;A.outerMeet('市井','city');assert.equal(modalOpen,false);assert.equal(outerBook().mothers.length,count);`);
});
test('secrecy passes through rumor, inquiry and compulsory decision in order and archived registers cannot act for a successor',()=>{
  const b=household();b.run(`A.outerPetition(k.id);choose(5);drain();
    for(const [level,title] of [[60,'街口的流言'],[40,'御史核查外籍'],[20,'隐情已达御前']]){
      k.secret=level;S.turn++;outerMonthly();assert.equal(curEv.title,title);
      choose(level===20?1:0);drain();while(k.pending.length){A.outerPetition(k.id);choose(0);drain();}
    }
    assert.equal(k.exposed,true);assert.equal(k.denied,true);
    var old=outerBook();old.closedTurn=S.turn;S.gen++;S.turn+=24;
    assert.equal(outerBook(),undefined);assert.match(viewLog(),/野史拾遗/);UI.sel=old.gen;
    assert.match(outerRegisterView(),/街口的流言/);assert.doesNotMatch(outerRegisterView(),/onclick="A.outerCare/);
    A.outerCare(k.id,'visit');assert.equal(modalOpen,false);`);
});
test('216 consecutive monthly updates grow one private child; adult stats freeze and the mother answers a later identity inquiry',()=>{
  const b=household();b.run(`A.outerPetition(k.id);choose(1);drain();var start=k.born;k.sex='m';
    for(let i=1;i<=216;i++){S.turn=start+i;S.month=(i+2)%12+1;S.year=Math.floor((i+2)/12)+1;outerMonthly();
      if(modalOpen){choose(0);drain();}
      if(i===215)assert.notEqual(k.path,'候会试');
    }
    assert.equal(k.path,'候会试');assert.equal(kidAge(k),18);
    assert.equal(outerBook().notes.filter(n=>n.title==='成年').length,1);
    var lit=k.lit;S.turn++;outerMonthly();assert.equal(k.lit,lit);
    outerQueue(k,'search');A.outerPetition(k.id);choose(0);drain();assert.equal(k.searchDone,undefined);
    S.turn++;outerMonthly();assert.equal(curEv.title,'生母的回话');choose(0);drain();assert.equal(k.searchDone,true);`);
});
test('an isolated residence is bought once and its visits, hunting and temple leads require a real outing',()=>{
  const b=game();b.run(`var money=E().treasury,energy=E().energy;
    A.outerMeet('市井','home');A.outerMeet('市井','hunt');assert.equal(modalOpen,false);assert.equal(E().energy,energy);
    A.outerEstate();choose(0);drain();assert.equal(E().treasury,money-35);A.outerEstate();assert.equal(modalOpen,false);
    A.outerMeet('市井','home');choose(0);drain();assert.equal(outerBook().mothers[0].place,'home');
    S.turn++;A.out('temple');drain();assert.match(viewOut(),/重走护国寺山门/);
    A.outerMeet('市井','temple');choose(0);drain();assert.equal(outerBook().mothers[1].place,'temple');`);
});
test('military and sponsored entrants use real career grades, source-specific records and the correct promotion track',()=>{
  for(const [route,origin,bloc,post] of [['候武选','武选','army','边营千总'],['候荫补','荫补','civil','州府通判']]){
    const b=household();b.run(`k.sex='m';A.outerPetition(k.id);choose(3);drain();k.born=S.turn-18*12;k.mar=88;k.vir=88;k.path='${route}';
      outerAttemptOffice(k,m,k.path);var p=scholarById(k.officialId),person=courtPerson('scholar:'+p.id);assert.ok(officialGrade(p));
      assert.equal(person.bloc,'${bloc}');UI.sel=p.id;assert.match(viewScholar(),/${origin}出身/);assert.doesNotMatch(viewScholar(),/undefined|殿试策论/);
      A.outerPetition(k.id);choose(0);drain();assert.equal(p.office,'${post}');assert.ok(officialGrade(p));`);
  }
});
test('a treasury already in deficit can answer compulsory petitions and choose a cost-free home',()=>{
  const b=household();b.run(`E().treasury=-12;A.outerPetition(k.id);
    assert.ok(!curEv.choices[1].cond());assert.ok(curEv.choices[5].cond());choose(5);drain();
    assert.equal(k.placement,'随母');assert.equal(E().treasury,-12);
    k.secret=19;S.turn++;outerMonthly();choose(1);drain();assert.ok(k.exposed);`);
});
test('two births due together both receive dated placement petitions even with another family letter waiting',()=>{
  const b=household();b.run(`A.outerPetition(k.id);choose(1);drain();outerQueue(k,'father');
    S.turn++;A.outerMeet('市井','city');choose(0);drain();
    for(const mother of outerBook().mothers)mother.preg={told:true,notice:S.turn,due:S.turn+1};
    S.turn++;outerMonthly();assert.equal(curEv.title,'一封报生书');assert.equal(Q[0].title,'一封报生书');
    choose(5);nextEv();choose(5);drain();
    assert.ok(k.pending.includes('father'));assert.equal(outerBook().children.filter(x=>x.born===S.turn&&x.placement==='随母').length,2);`);
});
