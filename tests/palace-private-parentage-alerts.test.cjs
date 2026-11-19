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
for(const allow of [true,false])test('repeated homesickness petitions the dowager and records four reactions after reload: '+allow,()=>{
 let b=auntVisitWorld();b.run(`var care=ward.dowagerUpbringing;
 S.month=4;S.year=6;
 ward.story.push({d:dateStr({...S,month:2}),t:'【姨母探望】那年她教我打的结'},
 {d:dateStr({...S,month:3}),t:'【慈宁宫探望】小声问可不可以给娘捎个信。'});
 PalaceActions.reset();A.endMonth();
 for(let n=0;modalOpen&&curEv.title!=='慈宁宫 · 姨母求恩'&&n<100;n++){if(modalResult)nextEv();else choose(0);}
 assert.equal(curEv.title,'慈宁宫 · 姨母求恩');save('auto');`);
 const ids=b.run('[ward.id,host,motherId]');b=boot(71,b.storage);b.ctx.assert=assert;b.ctx.ids=ids;
 b.run(`A.load('auto');assert.equal(curEv.title,'慈宁宫 · 姨母求恩');assert.equal(PalaceActions.blocked,false);
 const [id,host,mom]=ids,k=kidById(id),a=byId(host),m=natalEntry(host,mom).p,d=S.flags.dowager,care=k.dowagerUpbringing;
 var action=curEv.choices[${allow?0:1}];choose(${allow?0:1});assert.ok(modalResult);
 assert.deepEqual(care.longingMonths,[]);assert.equal(care.motherVisitRuling,S.turn);assert.equal(!!care.farewell,${allow});assert.equal(action.f(),null);
 for(const p of [a,k,m,d]){const notes=p.story.filter(e=>/^【慈宁宫(母子相见|母女相见|探亲未准)】/.test(e.t));
 assert.equal(notes.length,1);assert.match(notes[0].t,${allow?'/相见/':'/未准/'});}
 assert.ok(raisedByDowager(k));assert.ok(!m.visit);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();`);
});
test('longing is personal, counts distinct recent months and requires an available family',()=>{
 const b=auntVisitWorld();b.run(`var care=ward.dowagerUpbringing;noteCiningLonging(ward);noteCiningLonging(ward);
 assert.deepEqual(care.longingMonths,[S.turn]);offerCiningMotherVisit(ward);assert.ok(!modalOpen);
 S.turn+=12;noteCiningLonging(ward);offerCiningMotherVisit(ward);assert.ok(!modalOpen);
 S.turn++;noteCiningLonging(ward);sister.alive=false;offerCiningMotherVisit(ward);assert.ok(!modalOpen);
 sister.alive=true;other.cold=true;offerCiningMotherVisit(ward);assert.ok(!modalOpen);
 other.cold=false;sister.royalCompanionTrip={};offerCiningMotherVisit(ward);assert.ok(!modalOpen);
 delete sister.royalCompanionTrip;offerCiningMotherVisit(ward);choose(1);drain();
 for(var i=0;i<2;i++){S.turn++;noteCiningLonging(ward);offerCiningMotherVisit(ward);assert.ok(!modalOpen);}
 S.turn+=4;offerCiningMotherVisit(ward);assert.equal(curEv.title,'慈宁宫 · 姨母求恩');`);
});
for(const [sex,trait,age,temper,voice] of [['m','沉静',9,'内敛','舍不得'],['f','活泼',8,'灵动','先笑了'],['f','温婉',0,'仁厚','还听不懂']]){
 test('recognition respects the outside child’s age and character '+sex+trait,()=>{
  const b=setup();birth(b);b.run(`drain();child.sex='${sex}';child.trait='${trait}';child.born=S.turn-${age}*12;
  var result=recognizeOutsideChild(outsideParentageFamily(other,child),${age<9}),ward=kidById(child.id);
  assert.equal(ward.temperament,'${temper}');assert.match(result,/${sex==='m'?'皇子':'公主'}/);assert.match(result,/${voice}/);
  assert.match(ward.story.at(-1).t,/【初知身世】.*${voice}/);assert.ok(ward.mood${trait==='活泼'?'>':'<'}65);`);
 });
}
for(const [age,trait,roll,clung,line] of [
 [1,'好奇',.45,true,'攥紧她的袖边'],[1,'内敛',.95,false,'在她肩头睡熟'],
 [4,'爽直',.45,true,'抱住她的腿'],[4,'审慎',.85,false,'收在枕边'],
 [9,'内敛',.45,true,'捏着娘的袖口'],[9,'灵动',.45,false,'笑着叮嘱']
])test('the farewell follows age and temperament: '+age+' '+trait,()=>{
 const b=auntVisitWorld();b.run(`ward.born=S.turn-${age}*12;ward.temperament='${trait}';
 var care=ward.dowagerUpbringing;care.longingMonths=[S.turn-2,S.turn-1];offerCiningMotherVisit(ward);
 var accept=curEv.choices[0].f;`);
 b.force(roll);b.run(`var end=accept();assert.match(end,/${line}/);assert.equal(accept(),null);
 assert.deepEqual(care.farewell,{turn:S.turn,clung:${clung}});
 var tag=ward.sex==='m'?'【慈宁宫母子相见】':'【慈宁宫母女相见】';
 var farewellLines=people.map(p=>p.story.filter(e=>e.t.startsWith(tag)));
 assert.ok(farewellLines.every(lines=>lines.length===1));assert.equal(new Set(farewellLines.map(lines=>lines[0].t)).size,4);
 assert.match(farewellLines[0][0].t,/${line}/);
 S.turn++;var previousTurn=S.turn;
 assert.ok(Math.abs(ciningLongingChance(ward,.35)-${clung?.55:.15})<.000001);
 S.turn+=3;assert.ok(Math.abs(ciningLongingChance(ward,.4)-${clung?.50:.30})<.000001);
 S.turn+=3;assert.equal(ciningLongingChance(ward,.35),.35);
 S.turn=previousTurn;`);
 // Choose a roll that would give the opposite result at either unmodified visit rate.
 const nextRoll=clung?.45:.32;
 b.force(nextRoll);b.run(`assert.equal(ciningChildVisit(ward).text.includes('惦记娘亲'),${clung});`);
 b.force(0,0,nextRoll);b.run(`ciningAuntVisitTick(dowager,household);assert.equal(care.longingMonths.includes(S.turn),${clung});`);
});
