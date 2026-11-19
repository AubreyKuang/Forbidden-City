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
    assert.doesNotMatch(childListCard(k),/已定亲/);
    assert.match(marriagePanel(k),/已定亲/);assert.match(marriagePanel(k),/距婚期还有 10 年/);
    UI.sel=k.id;assert.match(viewKid(),/已定亲/);assert.ok(viewKid().indexOf('A.kidVisit(')<viewKid().indexOf('定亲对象'));
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
    assert.match(viewNatalRelative(),new RegExp(k.name));assert.equal(UI.view,'natal');assert.equal(natalStatus(p),'已婚');
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
    S.turn=k.born+14*12;succeed(k);choose(0,'长宁');drain();
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

function engaged(sex='m'){
  const b=family(sex);
  b.force(0,0);
  b.run(`var ev=royalNatalMarriageProposal();ev.onShow();ev.choices[0].f();PalaceActions.reset();`);
  return b;
}
const yearStep=`S.turn+=12;S.year++;S.month=1;`;
const seekPetition=`for(let n=0;modalOpen&&!curEv.title.includes('请求解约')&&n<100;n++){
  if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
}
assert.equal(curEv?.title,'婚约问心 · 请求解约');`;
const dueMonth=`S.turn=k.betrothal.due-1;S.month=6;k.adult=true;E().health=95;PalaceActions.reset();A.endMonth();`;

test('children swap distinct gifts once per New Year and the two profiles read their independent scores',()=>{
  const b=engaged();
  b.run(`var starting=royalNatalInitialBond(k,p);
    assert.match(marriagePanel(k),/彼此好感/);assert.match(natalLifePanel(a,p),/彼此好感/);
    assert.equal(k.betrothal.bond,undefined);
    assert.match(marriagePanel(k),/互通信札/);assert.doesNotMatch(marriagePanel(k),/安排两人见面/);
    S.month=1;royalNatalMarriageTick();royalNatalMarriageTick();
    var bond=k.betrothal.bond;
    assert.ok(bond.royal>starting.royal);assert.ok(bond.relative>starting.relative);
    for(const person of [k,p])assert.equal(person.story.filter(e=>e.life?.title==='正月互送岁礼').length,1);
    assert.notEqual(k.story.at(-1).t,p.story.at(-1).t);
    ${yearStep}
    royalNatalMarriageTick();assert.equal(k.story.filter(e=>e.life?.title==='正月互送岁礼').length,2);
    assert.ok(!p.betrothal.bond);`);
});

test('both need to reach the letter and meeting ages, with cooldowns and separate responses',()=>{
  const b=engaged('f');
  b.run(`S.turn=k.born+5*12-1;
    A.royalNatalContact(k.id,'letter');assert.equal(modalOpen,false);
    S.turn++;var initial=royalNatalInitialBond(k,p);
    A.royalNatalContact(k.id,'letter');assert.match(curEv.title,/书信/);assert.match(curEv.text,/长辈替他们写下问候/);`);
  b.force(.01,.99);
  b.run(`choose(0);drain();var bond=k.betrothal.bond;
    assert.equal(bond.royal,initial.royal+4);assert.equal(bond.relative,initial.relative-7);
    assert.match(natalLifePanel(a,p),/还需等6个月/);assert.match(k.story.at(-1).t,/托长辈帮着写信/);
    A.royalNatalContact(k.id,'letter');assert.equal(modalOpen,false);
    S.turn=k.born+9*12-1;A.royalNatalContact(k.id,'visit');assert.equal(modalOpen,false);
    S.turn++;k.away=true;
    assert.match(royalNatalContactReason(k,p,'visit'),/同在京中/);
    A.royalNatalContact(k.id,'visit');assert.equal(modalOpen,false);
    k.away=false;PalaceActions.reset();
    A.royalNatalContact(k.id,'visit');assert.match(curEv.title,/相见/);`);
  const loaded=boot(236,b.storage);loaded.ctx.assert=assert;
  loaded.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/相见/);
    var k=S.children[0],p=natalEntry(k.betrothal.host,k.betrothal.personId).p,prior=k.betrothal.bond.royal;`);
  loaded.force(.01,.01);
  loaded.run(`choose(0);drain();assert.equal(k.betrothal.bond.royal,prior+7);
    assert.match(marriagePanel(k),/还需等12个月/);
    S.turn=k.betrothal.due;royalNatalMarriageTick();
    assert.equal(k.married,true);assert.equal(k.spouse.trust,Math.round((prior+7+royalNatalInitialBond(k,p).relative)/2));`);
});

test('letters and supervised meetings can also happen without a player visit',()=>{
  const b=engaged();
  b.run(`S.turn=k.born+5*12;S.month=5;`);
  b.force(.01,.01,.99);
  b.run(`royalNatalMarriageTick();assert.match(k.betrothal.bond.latest.text,/长辈帮着写信/);
    S.turn=k.born+9*12;S.month=3;`);
  b.force(.99,.01,.99,.01);
  b.run(`royalNatalMarriageTick();assert.match(k.story.at(-1).life.title,/相见/);
    assert.equal(k.betrothal.bond.last.visit,S.turn);`);
});

test('unwilling relative petitions before the wedding, persists on reload, and can be released',()=>{
  const b=engaged();
  b.run(`k.betrothal.bond={royal:60,relative:26,last:{}};
    ${dueMonth}
    ${seekPetition}
    assert.match(curEv.text,new RegExp(p.name+'托人'));assert.equal(k.married,false);
    assert.equal(k.betrothal.bond.petition.side,'relative');`);
  const loaded=boot(117,b.storage);loaded.ctx.assert=assert;
  loaded.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/请求解约/);
    var k=S.children[0],p=natalEntry(k.betrothal.host,k.betrothal.personId).p;
    choose(0);drain();
    assert.equal(k.betrothal,undefined);assert.equal(p.betrothal,undefined);assert.equal(marriageEligible(k),true);
    assert.equal(k.married,false);assert.equal(p.married,false);
    assert.equal(k.story.filter(e=>e.life?.title==='婚约作罢').length,1);
    assert.notEqual(k.story.at(-1).t,p.story.at(-1).t);`);
});

test('a royal petitioner can be granted more time and eventually marry if the player keeps the promise',()=>{
  const b=engaged('f');
  b.run(`k.betrothal.bond={royal:27,relative:62,last:{}};
    ${dueMonth}
    ${seekPetition}
    assert.match(curEv.text,new RegExp(k.name+'托人'));
    choose(1);drain();
    var bond=k.betrothal.bond,until=bond.holdUntil;assert.equal(until,S.turn+6);
    assert.match(marriagePanel(k),/婚期暂缓/);
    S.turn=until-1;royalNatalMarriageTick();assert.equal(k.married,false);assert.equal(bond.petition,undefined);
    A.endMonth();
    ${seekPetition}
    choose(2);drain();assert.ok(bond.kept);assert.equal(bond.petition,undefined);
    S.turn++;royalNatalMarriageTick();assert.equal(k.married,true);assert.equal(p.married,true);`);
});

function courtshipHistory(sex='m'){
  const b=engaged(sex);
  b.force(.01,.01,.01,.01);
  b.run(`var bond=k.betrothal.bond={royal:76,relative:78,last:{}};
    S.turn=k.born+12*12;S.month=1;royalNatalExchange(k,p,'gift');
    S.turn+=7;S.month=8;royalNatalExchange(k,p,'letter');
    S.turn+=5;S.month=1;royalNatalExchange(k,p,'visit');
    assert.equal(betrothalMemories(k,p,k.betrothal.turn).length,3);`);
  return b;
}
const seekWeddingScene=(title)=>`for(let i=0;modalOpen&&curEv.title!=='${title}'&&i<90;i++){
  if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
}
assert.equal(curEv?.title,'${title}');`;

test('longtime mutual affection prompts them to ask together at the latest on their wedding month',()=>{
  const b=courtshipHistory('f');
  b.run(`${dueMonth}
    ${seekWeddingScene('两心问婚期')}
    assert.equal(k.married,false);
    assert.match(curEv.text,new RegExp(k.name));assert.match(curEv.text,new RegExp(p.name));`);
  const loaded=boot(163,b.storage);loaded.ctx.assert=assert;
  loaded.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    var k=S.children[0],p=natalEntry(k.betrothal.host,k.betrothal.personId).p,turn=S.turn;
    assert.equal(curEv.title,'两心问婚期');choose(0);
    assert.equal(S.turn,turn);assert.equal(k.married,false);
    nextEv();assert.equal(curEv.title,'婚前听母亲说几句话');assert.equal(k.married,false);
    choose(0);assert.equal(k.married,true);assert.equal(curEv.title,'依约成婚 · 行礼');
    assert.match(curEv.text,/从简/);assert.match(curEv.text,/相视/);
    assert.match(curEv.text,/互寄书信/);
    drain();
    for(const person of [k,p]){
      assert.equal(person.story.filter(e=>e.life?.title==='两心问婚期').length,1);
      assert.equal(person.story.filter(e=>e.life?.title==='依约成婚').length,1);
    }
    assert.notEqual(k.story.at(-1).t,p.story.at(-1).t);`);
});

test('agreeing to an early question keeps the fifteen-year wedding gate and carries the chosen plan',()=>{
  const b=courtshipHistory();
  b.run(`S.turn=k.born+14*12;var b=k.betrothal;
    var inquiry=b.bond.weddingInquiry={turn:S.turn};
    var ev=betrothalWeddingInquiryEvent(k,p,a,b,inquiry);
    assert.match(ev.text,/都满十五岁/);
    ev.choices[1].f();assert.equal(k.married,false);assert.equal(inquiry.plan,'family');
    assert.equal(ev.valid(),false);assert.match(marriagePanel(k),/婚礼正在备办/);
    assert.match(a.story.findLast(e=>e.life?.title==='两心问婚期').t,/想知道两个孩子问婚期时是什么神情/);
    S.turn=b.due-1;royalNatalMarriageTick();assert.equal(k.married,false);
    S.turn=b.due;royalNatalMarriageTick();assert.equal(k.married,true);
    assert.match(p.story.at(-1).life.summary,/长辈依二人所请到场见证/);`);
});

test('high affection alone or one-sided affection leaves out the joint inquiry',()=>{
  const onlyScore=engaged();
  onlyScore.run(`k.betrothal.bond={royal:95,relative:95,last:{}};
    ${dueMonth}
    ${seekWeddingScene('依约成婚 · 行礼')}
    assert.equal(k.married,true);assert.ok(!k.story.some(e=>e.life?.title==='两心问婚期'));drain();`);
  const uneven=courtshipHistory();
  uneven.run(`bond.royal=77;bond.relative=45;
    ${dueMonth}
    ${seekWeddingScene('依约成婚 · 行礼')}
    assert.match(curEv.text,/把手里的礼单叠齐/);
    assert.doesNotMatch(curEv.text,/笑意都落/);
    assert.equal(k.spouse.trust,61);assert.ok(k.household.harmony<61);
    assert.notEqual(k.story.at(-1).t,p.story.at(-1).t);drain();`);
});

test('courtship memories carry into different married anecdotes and both original chronicles',()=>{
  const b=courtshipHistory();
  b.run(`var due=k.betrothal.due;S.turn=due;royalNatalMarriageTick();
    var h=k.household,start=k.spouse.trust;
    assert.ok(h.harmony>=72);
    var wedding=k.story.find(e=>e.life?.title==='依约成婚');
    assert.match(wedding.life.summary,/互寄书信/);
    PalaceActions.reset();save('auto');`);
  const loaded=boot(318,b.storage);loaded.ctx.assert=assert;
  loaded.run(`A.load('auto');drain();var k=S.children[0],p=natalEntry(k.spouse.natalHost,k.spouse.personId).p,h=k.household;
    var start=k.spouse.trust;
    for(let i=0;i<3;i++){S.turn=h.nextNews;marriedLifeTick();}
    var royal=k.story.filter(e=>e.life?.source==='婚后旧约'),relative=p.story.filter(e=>e.life?.source==='婚后旧约');
    assert.equal(royal.length,3);assert.equal(relative.length,3);
    assert.deepEqual(royal.map(e=>e.life.title),['把信里的话接下去','为相见留一张桌','拆开旧岁礼']);
    assert.ok(royal.every((e,i)=>e.t!==relative[i].t&&/旧记/.test(e.life.summary)));
    assert.equal(h.history.filter(e=>e.type==='household_betrothal').length,3);
    assert.ok(k.spouse.trust>start);
    S.turn=h.nextNews;marriedLifeTick();assert.equal(p.story.filter(e=>e.life?.source==='婚后旧约').length,3);`);
});

test('a real childhood keepsake or journey from the same engagement appears in the wedding and married life',()=>{
  const b=courtshipHistory();
  b.run(`var b=k.betrothal;
    b.childhood={count:1,last:S.turn,items:['折歪尾巴的纸燕']};
    betrothalPairRecord({k,p,b},'两小无猜 · 燕尾朝哪儿','他们一起拾回纸燕。','替人捡纸燕。','想着下回再折。');
    betrothalPairRecord({k,p,b},'同行手记 · 河埠','两人记下河埠晨雾。','在案边添了一笔。','把航程说了一遍。');
    S.turn=b.due;royalNatalMarriageTick();
    assert.match(k.story.at(-1).t,/折歪尾巴的纸燕/);
    S.turn++;recordHouseholdNews(k);assert.match(p.story.at(-1).life.summary,/拾回纸燕/);
    S.turn++;recordHouseholdNews(k);assert.match(p.story.at(-1).life.summary,/河埠晨雾/);`);
});

test('old engagement dates recalculate from the younger partner without resetting a deliberate postponement',()=>{
  const b=engaged();
  b.run(`var newDue=Math.max(k.born,p.born)+15*12,oldDue=newDue+36;
    k.betrothal.due=p.betrothal.due=oldDue;
    delete p.royalNatalPortrait;
    S.turn=newDue-1;S.month=6;
    assert.match(marriagePanel(k),/满十五岁.*距婚期还有 1 个月/);
    assert.match(natalLifePanel(a,p),/满十五岁/);
    assert.equal(k.betrothal.due,oldDue);assert.equal(p.betrothal.due,oldDue);
    var bond=k.betrothal.bond={royal:66,relative:65,last:{},holdUntil:newDue+6};
    royalNatalMarriageTick();
    assert.equal(k.betrothal.due,newDue);assert.equal(p.betrothal.due,newDue);
    S.turn=newDue+5;royalNatalMarriageTick();
    assert.equal(k.married,false);assert.equal(bond.holdUntil,newDue+6);
    S.turn++;royalNatalMarriageTick();assert.equal(k.married,true);assert.equal(p.married,true);
    assert.equal(natalStatus(p),'已婚');`);
});

test('the old marriage timetable does not delay an eligible couple and the bride uses her adult portrait',()=>{
  const b=engaged();
  b.run(`var due=royalNatalMarriageAge(k,p);k.betrothal.due=p.betrothal.due=due+36;
    delete p.royalNatalPortrait;
    S.turn=p.born+15*12-1;assert.equal(portraitCell(natalPortrait(p)),childPortraitCell(p));
    S.turn++;assert.ok(CONSORT_PORTRAITS.includes(portraitCell(natalPortrait(p))));
    assert.equal(kidAge(k),14);royalNatalMarriageTick();assert.equal(k.married,false);
    S.turn=due;assert.equal(kidAge(k),15);royalNatalMarriageTick();
    assert.equal(k.married,true);assert.equal(k.spouse.marriedAt,due);
    assert.equal(portraitCell(natalPortrait(p)),portraitCell(spouseAppearance(k)));`);
});

test('either partner can request release after both turn twelve',()=>{
  const b=engaged('f');
  b.run(`var bond=k.betrothal.bond={royal:28,relative:65,last:{}};
    S.turn=k.born+12*12-1;S.month=6;bond.latest={turn:S.turn};
    royalNatalMarriageTick();assert.equal(bond.petition,undefined);
    S.turn++;bond.latest={turn:S.turn};`);
  b.force(.01);
  b.run(`royalNatalMarriageTick();assert.equal(bond.petition.side,'royal');assert.equal(k.married,false);`);
});

test('the engaged pair may start accompanied travel at thirteen before the new wedding age',()=>{
  const b=engaged();
  b.run(`k.hp=95;S.turn=k.born+13*12-1;
    assert.equal(royalTravelCanLeave(k),false);
    S.turn++;assert.equal(kidAge(k),13);assert.equal(royalTravelCanLeave(k),true);
    A.planBetrothedTravel(k.id);assert.match(curEv.title,/游历山河/);
    assert.ok(curEv.choices.some(o=>o.t.includes('结伴启程')));
    assert.ok(!curEv.choices.some(o=>o.t.includes('只带随侍')));
    choose(curEv.choices.findIndex(o=>o.t.includes('结伴启程')));drain();
    assert.equal(royalTravelCompanion(k),p);assert.equal(k.married,false);`);
});

test('the mother speaks before an outside-family wedding and her recollection survives reloading',()=>{
  const b=courtshipHistory();
  b.run(`a.trait='持重';k.betrothal.childhood={count:1,last:S.turn,items:['折歪尾巴的纸燕']};
    bond.royal=77;bond.relative=45;
    ${dueMonth}
    ${seekWeddingScene('婚前听母亲说几句话')}
    assert.equal(k.married,false);assert.match(curEv.text,/礼单收好/);assert.match(curEv.text,/折歪尾巴的纸燕/);
    assert.match(curEv.text,new RegExp(p.name+'，你若心里'));
    assert.equal(a.story.filter(e=>e.life?.title==='婚前听母亲说几句话').length,1);`);
  const loaded=boot(418,b.storage);loaded.ctx.assert=assert;
  loaded.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    var k=S.children[0],m=byId(k.mom);
    assert.equal(curEv.title,'婚前听母亲说几句话');assert.equal(k.married,false);
    choose(0);assert.equal(curEv.title,'依约成婚 · 行礼');assert.equal(k.married,true);drain();
    var entries=m.story.filter(e=>e.life?.title==='婚前听母亲说几句话');
    assert.equal(entries.length,1);assert.match(entries[0].t,/折歪尾巴的纸燕/);
    assert.ok(m.story.indexOf(entries[0])<m.story.findIndex(e=>e.life?.title==='依约成婚'));
    assert.match(detailStory(m),/婚前听母亲说几句话/);`);
});

test('maternal advice distinguishes temperament, mutual affection, hesitation and letters from afar',()=>{
  const b=courtshipHistory();
  b.run(`var b=k.betrothal;S.turn=b.due;
    a.trait='温婉';var soft=maternalWeddingEvent(k,p,b);
    assert.match(soft.text,/活计放下/);assert.match(soft.text,/愿意等对方/);
    a.trait='爽直';var frank=maternalWeddingEvent(k,p,b);
    assert.match(frank.text,/两张凳子/);assert.notEqual(frank.text,soft.text);
    bond.relative=36;bond.royal=35;k.away=true;
    var fromAfar=maternalWeddingEvent(k,p,b);
    assert.match(fromAfar.text,/亲笔写信/);assert.match(fromAfar.text,/今日先说一件/);
    assert.doesNotMatch(fromAfar.text,/两张凳子/);
    a.alive=false;assert.equal(maternalWeddingEvent(k,p,b),null);
    k.away=false;royalNatalMarriageTick();assert.equal(k.married,false);assert.ok(bond.petition);
    bond.kept={royal:bond.royal,relative:bond.relative};delete bond.petition;
    royalNatalMarriageTick();assert.equal(k.married,true);
    assert.ok(!a.story.some(e=>e.life?.title==='婚前听母亲说几句话'||e.life?.title==='依约成婚'));`);
});

for(const sex of ['m','f'])test('a mother also hears about a regular arranged wedding for a royal '+sex,()=>{
  const b=family(sex);
  b.run(`a.trait='活泼';S.turn=k.born+17*12;k.adult=true;PalaceActions.reset();
    A.kidMarriage(k.id);
    choose(curEv.choices.findIndex(c=>k.sex==='m'?c.t.startsWith('看看'):c.t.includes('进士')));
    choose(0);
    ${seekWeddingScene('婚前听母亲说几句话')}
    assert.equal(k.married,true);assert.match(curEv.text,/笑着把它放下/);assert.match(curEv.text,new RegExp(k.spouse.name));
    drain();assert.equal(a.story.filter(e=>e.life?.title==='婚前听母亲说几句话').length,1);
    A.kidPolicy(k.id,'习武');assert.equal(a.story.filter(e=>e.life?.title==='婚前听母亲说几句话').length,1);`);
});

test('each mother’s own advice and each royal child’s answer are drawn from their actual identities',()=>{
  const b=family();
  b.run(`S.turn=k.born+19*12;
    var voices=new Set();for(const trait of Object.keys(TRAITS)){a.trait=trait;
      const scene=maternalWeddingEvent(k,p);assert.ok(scene.text.includes(MATERNAL_WEDDING_ADVICE[trait]));voices.add(MATERNAL_WEDDING_ADVICE[trait]);}
    assert.equal(voices.size,Object.keys(TRAITS).length);
    a.fixedStory='ayimu';assert.match(maternalWeddingEvent(k,p).text,/两人轮着击/);
    var heard=new Set();for(const sex of ['m','f'])for(const temperament of Object.keys(CHILD_DISPOSITIONS)){
      k.sex=sex;k.temperament=temperament;const line=WEDDING_CHILD_PLANS[temperament][sex];
      assert.ok(maternalWeddingEvent(k,p).text.includes(line));heard.add(line);
    }assert.equal(heard.size,16);`);
});

test('the private dowry album is stable, only some adult daughters receive one, and both remember it once',()=>{
  const b=family('f');
  b.run(`S.turn=k.born+18*12;k.married=true;k.spouse=p;
    let has,plain;for(let i=0;i<32;i++){
      p.id='gift-'+i;if(maternalWeddingEvent(k,p).text.includes('避火图'))has=p.id;else plain=p.id;
    }assert.ok(has&&plain);p.id=has;
    const giftScene=maternalWeddingEvent(k,p);assert.match(giftScene.text,/单独留了女儿/);
    assert.equal(giftScene.text,maternalWeddingEvent(k,p).text);
    k.born+=12;assert.doesNotMatch(maternalWeddingEvent(k,p).text,/避火图/);k.born-=12;
    k.sex='m';assert.doesNotMatch(maternalWeddingEvent(k,p).text,/避火图/);k.sex='f';
    k.away=true;const letter=maternalWeddingEvent(k,p);assert.match(letter.text,/亲笔写信/);assert.match(letter.text,/扁匣/);
    assert.doesNotMatch(letter.text,/单独留了女儿/);letter.onShow();letter.onShow();
    assert.equal(k.story.filter(e=>e.t.includes('避火图')).length,1);
    assert.equal(a.story.filter(e=>e.t.includes('避火图')).length,1);
    assert.equal(maternalWeddingEvent(k,p),null);`);
});
