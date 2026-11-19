const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');
function setup(commander=true,imperial=true){const b=world();b.ctx.assert=assert;
 b.run(`officialMarriageConfirm(ref,br,agree(ref,br));E().energy=20;E().treasury=1000;${commander?"A.establishJinyiwei();choose(0);drain();":''}
  beginNatalPregnancy(other,sister,{unconfirmed:true});Object.assign(sister.natalPregnancy,{imperialParentage:${imperial},husbandSuspects:false,difficult:false});
  var originalPreg=sister.natalPregnancy,host=other.id,motherId=sister.id;PalaceActions.reset();`);return b;}
function birth(b){b.run(`S.turn=originalPreg.due;natalPregnancyTick();var child=oh.relatives.find(p=>p.parentRelativeId===sister.id),childId=child.id;
 assert.ok(child);assert.ok(child.unconfirmedParentage);if(curEv?.title.includes('宫外孕讯')||curEv?.title==='宫外来信 · 有孕')choose(0);`);}
test('a private pregnancy receives a timely commander notice without claiming its father',()=>{
 const b=setup();b.run(`S.turn++;natalPregnancyTick();assert.equal(curEv.title,'锦衣卫密报 · 宫外孕讯');assert.match(curEv.text,new RegExp(fullName(other)+'）的'+natalLabel(other,sister)+sister.name+'已有身孕'));assert.match(curEv.text,/不能.*断定/);assert.ok(S.log.some(x=>x.t.includes(fullName(other))&&x.t.includes(sister.name)));
  assert.equal(originalPreg.privateNoticeQueued,true);drain();natalPregnancyTick();assert.equal(modalOpen,false);`);
});
test('the monthly pregnancy notice survives refresh without duplication',()=>{
 let b=setup();b.run(`A.endMonth();for(let n=0;modalOpen&&curEv.title!=='锦衣卫密报 · 宫外孕讯'&&n<100;n++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'锦衣卫密报 · 宫外孕讯');save('auto');`);
 b=boot(73,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫密报 · 宫外孕讯');
  choose(0);drain();assert.equal(S.log.filter(x=>x.t.includes('【宫外孕讯】')).length,1);`);
});
test('a pregnancy and birth still get a clear notice when the guard is not established',()=>{
 const b=setup(false);b.run(`S.turn++;natalPregnancyTick();assert.equal(curEv.title,'宫外来信 · 有孕');assert.match(curEv.text,new RegExp(fullName(other)+'）的'+natalLabel(other,sister)+sister.name+'已有身孕'));drain();`);birth(b);
 b.run(`assert.equal(curEv.title,'宫外来信 · 添丁');assert.equal(curEv.choices.length,1);drain();`);
});
test('birth alert can order three-month investigation without changing the unclear status',()=>{
 let b=setup();birth(b);b.run(`assert.equal(curEv.title,'锦衣卫密报 · 宫外添丁');var oldFather=child.fatherId,oldName=child.name,oldCount=S.children.length;
  choose(0);assert.equal(child.outsideParentage.privateInquiry.due,S.turn+3);assert.equal(child.unconfirmedParentage,true);drain();save('auto');`);
 const id=b.run('childId'),host=b.run('host'),father=b.run('oldFather'),name=b.run('oldName'),count=b.run('oldCount');
 b=boot(71,b.storage);b.ctx.assert=assert;b.ctx.testId=id;b.ctx.testHost=host;b.ctx.originalFather=father;b.ctx.originalName=name;b.ctx.originalCount=count;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var hostPerson=byId(testHost),child=houseOf(hostPerson).relatives.find(p=>p.id===testId),q=child.outsideParentage.privateInquiry;
  assert.equal(q.status,'investigating');for(let n=0;n<2;n++){A.endMonth();drain();}assert.equal(q.status,'investigating');
  A.endMonth();for(let n=0;modalOpen&&curEv.title!=='锦衣卫回奏 · 宫外生父'&&n<100;n++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'锦衣卫回奏 · 宫外生父');assert.match(curEv.text,/生父为皇帝/);save('auto');`);
 b=boot(72,b.storage);b.ctx.assert=assert;b.ctx.testId=id;b.ctx.testHost=host;b.ctx.originalFather=father;b.ctx.originalName=name;b.ctx.originalCount=count;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫回奏 · 宫外生父');
  var hostPerson=byId(testHost),child=houseOf(hostPerson).relatives.find(p=>p.id===testId);choose(0);drain();
  assert.equal(child.outsideParentage.privateInquiry.status,'complete');assert.equal(child.unconfirmedParentage,true);
  assert.equal(child.fatherId,originalFather);assert.equal(child.name,originalName);assert.equal(S.children.length,originalCount);
  assert.match(outsideChildBadge(child),/身世未明/);assert.match(natalFatherPanel(child),/生父：皇帝/);assert.match(natalParentLinks(hostPerson,child),/婚籍所载父亲/);`);
});
test('saved non-imperial truth is not rewritten to the emperor',()=>{
 const b=setup(true,false);birth(b);b.run(`choose(0);drain();var q=child.outsideParentage.privateInquiry;S.turn=q.due;outsidePaternityTick();
  assert.equal(curEv.title,'锦衣卫回奏 · 宫外生父');assert.match(curEv.text,new RegExp(child.fatherName));assert.equal(curEv.choices.length,1);choose(0);drain();
  assert.equal(child.unconfirmedParentage,true);assert.equal(q.imperial,false);assert.doesNotMatch(outsideParentagePanel(other,child),/决定孩子归处/);assert.doesNotMatch(natalFatherPanel(child),/生父：皇帝/);`);
});
test('parallel inquiries cannot silently change the unclear label',()=>{
 const b=setup();birth(b);b.run(`choose(0);drain();var data=child.outsideParentage,f=outsideParentageFamily(other,child);data.status='reported';
  var oldCase=outsideParentageEvent(f);assert.equal(oldCase.choices[0].cond(),false);assert.equal(data.privateInquiry.status,'investigating');
  data.privateInquiry.status='complete';data.status='investigating';delete data.privateInquiry;assert.equal(outsidePaternityReady(f),false);`);
});

test('shared households name the consort associated with the actual private meeting',()=>{
 const b=setup();b.run(`var relative=makeKin(other,'亲');addConsort(relative,3,'入宫');assert.ok(paternalFamily(other).some(p=>p.id===relative.id));sister.marriedSisterAffair={host:other.id};originalPreg.reportingHost=relative.id;PalaceActions.reset();S.turn++;natalPregnancyTick();assert.equal(curEv.title,'锦衣卫密报 · 宫外孕讯');assert.match(curEv.text,new RegExp(fullName(relative)+'）的'+natalLabel(relative,sister)+sister.name+'已有身孕'));`);
});
test('a stale unrelated meeting host is ignored and the real household is named',()=>{
 const b=setup();b.run(`sister.marriedSisterAffair={host:c.id};originalPreg.reportingHost=c.id;S.turn++;natalPregnancyTick();assert.match(curEv.text,new RegExp(fullName(other)+'）的'+natalLabel(other,sister)+sister.name+'已有身孕'));`);
});
test('a real v100 pregnancy notice remains replayable with its original text',()=>{
 const data=require('./fixtures/outside-pregnancy-legacy-v100.json'),b=boot(74,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,100);assert.equal(curEv.title,'锦衣卫密报 · 宫外孕讯');assert.doesNotMatch(curEv.text,/）的(?:姐姐|妹妹)/);choose(0);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);`);
});

test('a new pregnancy pins the consort from the actual encounter',()=>{const b=setup();b.run(`assert.equal(originalPreg.reportingHost,other.id);`);});
test('imperial private report opens placement directly, supports a pending reload and care by the dowager',()=>{
 let b=setup();birth(b);b.run(`choose(0);drain();var q=child.outsideParentage.privateInquiry;S.turn=q.due;PalaceActions.reset();A.outsidePaternityReport(host,child.id);
 choose(1);assert.equal(curEv.title,'骨肉归处');assert.ok(!kidById(child.id));save('auto');`);
 const id=b.run('child.id');b=boot(72,b.storage);b.ctx.assert=assert;b.ctx.testId=id;
 b.run(`A.load('auto');assert.equal(curEv.title,'骨肉归处');choose(curEv.choices.findIndex(x=>x.t==='认回宫中，由太后抚养'));drain();
 const k=kidById(testId);assert.equal(k.outsideParentage.status,'recognized');
 assert.match(childResidence(k),/太后抚养.*慈宁宫/);assert.ok(S.flags.dowager.story.some(e=>e.t.includes(k.name)));
 assert.equal(S.children.filter(p=>p.id===testId).length,1);assert.ok(k.story.some(e=>e.t.includes('太后接到慈宁宫')));
 S.flags.dowager.alive=false;assert.doesNotMatch(childResidence(k),/太后抚养/);`);
});
test('old privately confirmed cases can be revisited without another investigation or a living husband',()=>{
 const b=setup();birth(b);b.run(`choose(0);drain();var q=child.outsideParentage.privateInquiry;q.status='complete';
 var f=outsideParentageFamily(other,child);if(f.husband)f.husband.alive=false;
 var energy=E().energy,gold=E().treasury;assert.match(outsideParentagePanel(other,child),/决定孩子归处/);
 A.outsideParentage(host,child.id,true);choose(2);drain();assert.equal(child.unconfirmedParentage,true);
 A.outsideParentage(host,child.id,true);choose(0);drain();assert.ok(kidById(child.id));assert.equal(E().energy,energy);assert.equal(E().treasury,gold);
 assert.ok(!oh.relatives.includes(child));`);
});
test('a Cining greeting can include a homesick child and four separate chronicles after reload',()=>{
 let b=setup();birth(b);b.run(`choose(0);drain();var q=child.outsideParentage.privateInquiry;q.status='complete';
 A.outsideParentage(host,child.id,true);choose(curEv.choices.findIndex(x=>x.t==='认回宫中，由太后抚养'));drain();
 var k=kidById(child.id);delete k.outsideFamilyOrigin.auntId;k.born=S.turn-8*12;k.hp=80;
 var month=S.turn,start=E().energy;PalaceActions.reset();A.greet();
 for(let i=0;modalOpen&&curEv.title!=='慈宁宫 · 请安之后'&&i<75;i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(x=>!x.cond||x.cond()));}
 assert.equal(curEv.title,'慈宁宫 · 请安之后');assert.equal(E().energy,start-1);`);
 b.force(0);b.run(`choose(0);assert.match(curEv.title,/慈宁宫 · 探望/);assert.match(curEv.text,/给娘捎个信/);save('auto');`);
 const ids=b.run('[k.id,host,motherId]');b=boot(73,b.storage);b.ctx.assert=assert;b.ctx.ids=ids;
 b.run(`A.load('auto');assert.match(curEv.text,/给娘捎个信/);choose(0);drain();
 const [id,host,mom]=ids,k=kidById(id),a=byId(host),m=natalEntry(host,mom).p,d=S.flags.dowager;
 assert.equal(k.dowagerUpbringing.visits,1);assert.equal(canVisitCiningChild(k),false);
 for(const [p,t] of [[d,'说起孩子的近况'],[k,'慈宁宫探望'],[m,'慈宁宫家音'],[a,'姨母牵挂']]){
  assert.equal(p.story.filter(e=>e.t.startsWith('【'+t+'】')).length,1,t);
 }
 assert.ok(a.story.at(-1).t.includes(k.name));assert.ok(m.story.at(-1).t.includes(a.given));
 S.turn++;assert.ok(canVisitCiningChild(k));k.born=S.turn;var ev=ciningChildVisit(k);assert.doesNotMatch(ev.text,/给娘捎个信|父皇猜/);
 S.heir=id;assert.equal(canVisitCiningChild(k),false);`);
});
test('a shared house keeps the aunt identified for this particular birth in both new and old placements',()=>{
 const b=setup();b.run(`var expected=makeKin(other,'亲');addConsort(expected,3,'入宫');
 originalPreg.reportingHost=expected.id;`);birth(b);b.run(`choose(0);drain();
 var f=outsideParentageFamily(other,child);recognizeOutsideChild(f,true);
 var k=kidById(child.id);assert.equal(k.outsideFamilyOrigin.auntId,expected.id);
 delete k.outsideFamilyOrigin.auntId;assert.equal(ciningChildKin(k).aunt,expected);
 sister.alive=false;var before=sister.story.length,ev=ciningChildVisit(k);ev.choices[0].f();
 assert.equal(sister.story.length,before);assert.match(expected.story.at(-1).t,/姨母牵挂/);
 assert.ok(!other.story.some(e=>e.t.startsWith('【姨母牵挂】')));`);
});
function auntVisitWorld(){
 const b=setup();birth(b);b.run(`drain();recognizeOutsideChild(outsideParentageFamily(other,child),true);
 var ward=kidById(child.id),dowager=ensureDowager(),household=dowagerLiving(dowager);
 delete ward.outsideFamilyOrigin.auntId;ward.born=S.turn-8*12;S.turn++;
 var notes=p=>p.story.filter(e=>e.t.startsWith('【姨母探望】')).map(e=>e.t);
 var people=[ward,other,sister,dowager];`);return b;
}
test('a maternal aunt independently carries a message from a homesick child to her sister, once for each participant',()=>{
 const b=auntVisitWorld();b.force(...Array(150).fill(0));b.run(`
 dowagerTick();assert.deepEqual(people.map(p=>notes(p).length),[1,1,1,1]);
 assert.match(notes(ward)[0],/姨母答应/);assert.match(notes(other)[0],/托人给姐妹/);
 assert.match(notes(sister)[0],/还会打.*旧络子/);assert.match(notes(dowager)[0],/晚些时候再传饭/);
 assert.ok(canVisitCiningChild(ward));assert.equal(notes(c).length,0);
 for(let i=0;i<3;i++){dowagerTick();assert.equal(notes(ward).length,1);S.turn++;}
 dowagerTick();assert.equal(notes(ward).length,2);`);
});
test('a quiet month, an absent aunt, a departed child or an unavailable mother never produces a false message',()=>{
 const b=auntVisitWorld();b.force(.99);b.run(`ciningAuntVisitTick(dowager,household);assert.equal(notes(ward).length,0);`);
 b.force(...Array(50).fill(0));b.run(`
 other.homeLeave={until:S.turn+2};ciningAuntVisitTick(dowager,household);delete other.homeLeave;
 S.heir=ward.id;ciningAuntVisitTick(dowager,household);S.heir=null;
 sister.visit={host:other.id,until:S.turn+2};ciningAuntVisitTick(dowager,household);delete sister.visit;
 assert.ok(people.every(p=>!notes(p).length));
 sister.alive=false;ciningAuntVisitTick(dowager,household);
 assert.equal(notes(sister).length,0);assert.match(notes(ward)[0],/当年怎样/);assert.doesNotMatch(notes(other)[0],/捎话/);`);
});
test('an ordinary visit brings family news without putting a spoken request in the mouth of an infant',()=>{
 const b=auntVisitWorld();b.force(0,0,.9);b.run(`ward.born=S.turn;
 ciningAuntVisitTick(dowager,household);assert.match(notes(ward)[0],/握住姨母/);
 assert.doesNotMatch(notes(ward)[0],/答应|开口/);assert.match(notes(sister)[0],/小手的力气/);`);
});
