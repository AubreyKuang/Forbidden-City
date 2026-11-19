const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function family(seedSex='m'){
  const b=world();b.ctx.assert=assert;
  b.run(`var k=makeKid(a,'${seedSex}','允昭');k.born=S.turn-5*12;
    var p=addNatalPerson(a,ah,k.sex==='m'?'f':'m',6,733,false);p.parentRelativeId=wife.id;
    p.born=k.born-12;p.fatherName='顾闻道';p.sur='顾';p.name='顾'+p.given;
    a.house.father.alive=true;PalaceActions.reset();`);
  return b;
}
function prepareBirth(withDaughter=false){
  const b=world();b.ctx.assert=assert;
  b.run(`var first=makeKid(a,'m','允昭');first.born-=42;
    var second=makeKid(a,'${withDaughter?'f':'m'}','明安');second.born-=22;second.alive=false;
    var baby=makeKid(a,'m','允初');baby.pendingName=true;
    a.delivery={children:[baby.id],turn:S.turn,date:dateStr(),settled:false,difficult:false};
    var writers=familyDaughterWriters(a);
    if(!writers.brother)addNatalPerson(a,ah,'m',a.age+2,801,false);
    PalaceActions.reset();A.resumeBirth(a.id);`);
  return b;
}

test('registered nieces take priority and only close in age, unmarried relatives may be proposed',()=>{
  const b=family();
  b.run(`assert.equal(royalNatalFamilyOptions(a,k)[0].p,p);
    var branch=makeKin(a,'堂');addConsort(branch,3,'留牌');
    var ch=houseOf(branch),cousin=addNatalPerson(branch,ch,'f',27,2606,false),
      niece=addNatalPerson(branch,ch,'f',5,3241,false);
    niece.parentRelativeId=cousin.id;niece.born=k.born;
    assert.equal(royalNatalFamilyOptions(a,k)[0].p,p);
    p.born=k.born-37;
    assert.equal(royalNatalFamilyOptions(a,k)[0].p,niece);
    niece.unconfirmedParentage=true;
    assert.equal(royalNatalFamilyOptions(a,k).length,0);
    delete niece.unconfirmedParentage;niece.betrothal={kind:'alliance'};
    assert.equal(royalNatalFamilyOptions(a,k).length,0);`);
});

test('a princess can be betrothed to a documented nephew and both profiles use the original people',()=>{
  const b=family('f');
  b.force(.081);
  b.run(`assert.equal(royalNatalMarriageProposal(),null);`);
  b.force(.079,.1);
  b.run(`var ev=royalNatalMarriageProposal();assert.match(ev.text,/姐姐|妹妹/);
    ev.onShow();ev.choices[0].f();
    assert.equal(k.betrothal.personId,p.id);assert.equal(p.betrothal.personId,k.id);
    assert.equal(natalStatus(p),'已定亲');assert.equal(marriageEligible(k),false);
    assert.match(marriagePanel(k),/已定亲/);assert.match(marriagePanel(k),/距婚期还有 13 年/);
    UI.sel=k.id;assert.ok(viewKid().indexOf('A.kidVisit(')<viewKid().indexOf('定亲对象'));
    assert.ok(marriagePanel(k).includes(royalNatalPersonLink('natal',a.id+':'+p.id,p.name)));assert.match(marriagePanel(k),new RegExp(p.name));
    assert.match(natalLifePanel(a,p),/已定亲/);assert.match(natalLifePanel(a,p),new RegExp(k.name));
    assert.notEqual(k.story.at(-1).t,p.story.at(-1).t);assert.notEqual(k.story.at(-1).t,a.story.at(-1).t);
    var kidId=k.id,natalId=p.id;S.turn=k.betrothal.due-1;royalNatalMarriageTick();assert.equal(k.married,false);
    k.adult=true;delete S.flags.monthlyCourt;PalaceActions.reset();save('auto');`);
  const b2=boot(624,b.storage);b2.ctx.assert=assert;
  b2.run(`A.load('auto');drain();
    var k=S.children[0],p=natalEntry(k.betrothal.host,k.betrothal.personId).p;
    assert.equal(p.betrothal.personId,k.id);assert.equal(k.married,false);
    A.endMonth();drain();assert.equal(k.married,true);assert.equal(p.married,true);
    assert.equal(k.spouse.id,p.id);assert.equal(p.spouse.id,k.id);assert.equal(p.royalSpouseId,k.id);
    assert.ok(k.household);assert.equal(k.betrothal,undefined);assert.equal(p.betrothal,undefined);
    assert.match(marriagePanel(k),/配偶档案/);
    UI.view='natal';UI.sel=k.spouse.natalHost+':'+p.id;
    assert.match(viewNatalRelative(),new RegExp(k.name));assert.equal(UI.view,'official');
    marriedLifeTick();assert.equal(k.story.filter(e=>e.life?.title==='依约成婚').length,1);`);
});

test('a rare collateral proposal registers a real branch, with princess art only during childhood',()=>{
  const b=family();
  b.run('p.born=k.born-49;');
  b.force(.026);
  b.run(`assert.equal(royalNatalMarriageProposal(),null);assert.equal(ah.natal.marriageBranchRegistered,undefined);`);
  b.force(.024,.1);
  b.run(`var ev=royalNatalMarriageProposal();assert.match(ev.text,/堂姐|堂妹/);
    ev.onShow();ev.choices[0].f();
    var bride=natalEntry(k.betrothal.host,k.betrothal.personId).p;
    var mother=ah.relatives.find(p=>p.id===bride.parentRelativeId);
    assert.ok(mother.natalCollateral);assert.equal(natalLabel(a,bride),'堂外甥女');
    assert.match(natalParentLinks(a,bride),new RegExp(mother.name));
    assert.equal(portraitCell(natalPortrait(bride)),childPortraitCell(bride));
    var childhood=portraitCell(natalPortrait(bride));
    assert.ok(natalAge(bride)<18);assert.ok(Math.abs(bride.born-k.born)<=36);
    S.turn=k.betrothal.due;royalNatalMarriageTick();
    assert.ok(CONSORT_PORTRAITS.includes(portraitCell(natalPortrait(bride))));
    assert.notEqual(portraitCell(natalPortrait(bride)),childhood);
    assert.equal(portraitCell(spouseAppearance(k)),portraitCell(natalPortrait(bride)));
    assert.equal(natalPregnancyReady(bride),false);
    assert.equal(k.spouse.id,bride.id);assert.equal(bride.spouse.royalId,k.id);
    succeed(k);choose(0,'长宁');drain();
    assert.equal(empress().id,bride.id);assert.equal(empress().artPortrait,bride.artPortrait);
    assert.match(detailStory(empress()),/依约成婚/);`);
});

test('a prince who accedes first carries the marriage promise into the new reign',()=>{
  const b=family();
  b.force(0,0);
  b.run(`var ev=royalNatalMarriageProposal();ev.onShow();ev.choices[0].f();
    var due=k.betrothal.due,id=p.id,host=a.id;
    S.turn=k.born+15*12;succeed(k);choose(0,'长宁');drain();
    var heir=E().natalMarriageHeir,bride=natalEntry(host,id).p;
    assert.ok(heir);assert.equal(bride.betrothal.personId,heir.id);
    assert.match(natalLifePanel(natalEntry(host,id).c,bride),/当朝天子/);
    S.turn=due;royalNatalMarriageTick();assert.equal(empress().id,bride.id);
    assert.equal(heir.betrothal,undefined);assert.equal(bride.betrothal,undefined);`);
});

test('refusal leaves both free and a death cancels a recorded promise on both sides',()=>{
  const declined=family();declined.force(0,0);
  declined.run(`var ev=royalNatalMarriageProposal();ev.onShow();ev.choices[1].f();
    assert.equal(k.betrothal,undefined);assert.equal(p.betrothal,undefined);assert.equal(k.natalMatchAsked,true);
    assert.equal(royalNatalMarriageProposal(),null);`);
  const loss=family();loss.force(0,0);
  loss.run(`var ev=royalNatalMarriageProposal();ev.onShow();ev.choices[0].f();
    p.alive=false;royalNatalMarriageTick();assert.equal(k.betrothal,undefined);assert.equal(p.betrothal,undefined);
    assert.match(k.story.at(-1).t,/婚约作罢/);royalNatalMarriageTick();
    assert.equal(k.story.filter(e=>e.life?.title==='婚约作罢').length,1);`);
});

test('on the third boy the father and elder brother can each write once, after naming',()=>{
  const b=prepareBirth();b.force(...Array(40).fill(.02));
  b.run(`choose(0,'允初');nextEv();assert.equal(curEv.title,'报喜后的家书');
    assert.match(curEv.text,/外孙女/);assert.match(curEv.text,/外甥女/);
    var writers=familyDaughterWriters(a);
    assert.match(writers.father.story.at(-1).t,/外孙女/);assert.match(writers.brother.story.at(-1).t,/外甥女/);
    assert.equal(familyDaughterLetter(a),null);`);
  const b2=boot(721,b.storage);b2.ctx.assert=assert;
  b2.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'报喜后的家书');drain();
    var c=S.consorts.find(c=>c.given==='知微');assert.equal(c.story.filter(e=>e.life?.title==='报喜后的家书').length,1);`);
});

test('a daughter already born or sons conceived in just one pregnancy do not produce the letter',()=>{
  const b=prepareBirth(true);
  b.run(`assert.equal(familyDaughterBirths(a).daughter,true);
    var other=makeKid(a,'m','允博');other.born-=12;choose(0,'允初');drain();
    assert.ok(!a.familyDaughterWishes);var daughter=S.children.find(p=>p.sex==='f');
    S.children=S.children.filter(p=>p!==daughter);S.children.forEach(k=>k.born=S.turn);
    assert.equal(familyDaughterLetter(a),null);`);
});

test('a naturally triggered monthly proposal survives replay before any choice',()=>{
  const setup=family();
  const b=boot(40);b.ctx.assert=assert;b.ctx.base=setup.run('JSON.stringify(S)');
  b.run(`S=JSON.parse(base);migrate();UI.view='kids';PalaceActions.reset();A.endMonth();
    for(let j=0;modalOpen&&!curEv.title.includes('娃娃亲')&&j<90;j++){
      if(modalResult)nextEv();else choose(curEv.choices.findIndex(o=>!o.cond||o.cond()));
    }
    assert.equal(curEv.title,'外家有约 · 娃娃亲');assert.equal(S.children[0].betrothal,undefined);`);
  const b2=boot(514,b.storage);b2.ctx.assert=assert;
  b2.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'外家有约 · 娃娃亲');choose(0);drain();
    assert.equal(S.children[0].betrothal.kind,ROYAL_NATAL_MATCH);`);
});
