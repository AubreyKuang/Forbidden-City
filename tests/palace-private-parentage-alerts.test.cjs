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
  assert.equal(curEv.title,'锦衣卫回奏 · 宫外生父');assert.match(curEv.text,new RegExp(child.fatherName));choose(0);drain();
  assert.equal(child.unconfirmedParentage,true);assert.equal(q.imperial,false);assert.doesNotMatch(natalFatherPanel(child),/生父：皇帝/);`);
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
