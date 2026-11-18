const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const {secretWorld}=require('./palace-secret-world.cjs');

function game(storage){
 const b=boot(830,storage);
 b.ctx.assert=assert;
 if(storage)b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);
 else b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=12;E().treasury=900;
  A.establishJinyiwei();choose(0);drain();E().energy=10;PalaceActions.reset();
  var find=fragment=>curEv.choices.findIndex(choice=>choice.t.includes(fragment));`);
 return b;
}
const openCase=`var a=harem()[0],v=harem()[1],x=openPalaceCase({kind:'harem',title:'香囊疑案',
 crime:'香囊藏麝',culprit:a.id,victim:v?.id??null});PalaceActions.reset();`;

for(const [name,action] of [
 ['patrol','A.jinyiweiPatrol()'],
 ['case',openCase+'A.jinyiweiInvestigate(x.id)'],
 ['memorial','A.court()']
]){
 test('the '+name+' entry opens his own contact and saves a single identity',()=>{
  let b=game();
  b.run(`${action};assert.ok(find('阅东厂附札')>=0);choose(find('阅东厂附札'));
   assert.match(curEv.title,/贺行简/);assert.match(curEv.text,/不怕。我死了，东厂还有下一个首捕。/);save('auto');`);
  b=game(b.storage);
  b.run(`choose(0);drain();var p=heXingjianPerson();
   assert.equal(p.fenghua.contact,'${name}');assert.equal(portraitCell(p),502);
   assert.match(porImg(p,160),/palace-he-xingjian.webp/);assert.equal(fenghuaAll().filter(x=>x.fenghuaKey==='heXingjian').length,1);
   assert.equal(heXingjianLeadChoice('${name}'),null);assert.notEqual(jinyiwei().commander.id,p.id);`);
 });
}

test('an accelerated old case always reports the saved culprit before any disposition',()=>{
 let b=game();
 b.run(`${openCase}createFenghuaPerson('heXingjian');PalaceActions.reset();var before=E().treasury;
  Math.random=()=>.999999;A.jinyiweiInvestigate(x.id);choose(find('交贺行简'));
  assert.equal(curEv.title,'贺行简 · 复命');assert.match(curEv.text,/办好了/);
  assert.match(curEv.text,new RegExp(cName(a)));assert.equal(x.culprit,a.id);
  assert.equal(x.status,'solved');assert.equal(x.solvedTurn,S.turn);assert.equal(E().treasury,before-15);
  assert.equal(x.tries,1);assert.ok(!x.withheld);assert.ok(!a.known);save('auto');`);
 b=game(b.storage);
 b.run(`var x=palaceCases()[0];assert.equal(curEv.title,'贺行简 · 复命');choose(1);drain();
  assert.ok(x.withheld);assert.equal(palaceCases().length,1);
  assert.ok(heXingjianPerson().story.some(s=>s.event?.title==='办好了'));`);
});

test('secret-case success preserves the recorded parentage and offers the original choices',()=>{
 const b=secretWorld('clear');b.ctx.assert=assert;
 b.run(`var p=createFenghuaPerson('heXingjian'),father=JSON.stringify(k.parentage.father);
  Math.random=()=>.999999;A.secretInquiry('parentage',kid);
  choose(curEv.choices.findIndex(c=>c.t.includes('交贺行简')));
  assert.equal(curEv.title,'贺行简 · 复命');assert.equal(currentCase().status,'solved');
  assert.equal(JSON.stringify(k.parentage.father),father);assert.equal(k.parentage.decision,undefined);
  choose(0);assert.equal(k.parentage.decision,'cleared');`);
});

test('the two special assignments run at doubled speed and block overlapping dispatches',()=>{
 let b=game();
 b.run(`var p=createFenghuaPerson('heXingjian');A.go('jinyiwei');
  assert.match(viewJinyiwei(),/借牌的人/);A.heXingjianMission();assert.match(curEv.text,/通常需2个月.*1个月回奏/s);
  choose(0);drain();assert.equal(p.fenghua.assignment.due,S.turn+1);
  A.heXingjianMission();A.heXingjianReport();assert.equal(modalOpen,false);
  S.turn++;PalaceActions.reset();A.heXingjianReport();assert.match(curEv.text,/领油簿上的名字是后添的/);save('auto');`);
 b=game(b.storage);
 b.run(`var p=heXingjianPerson();choose(0);drain();assert.equal(p.fenghua.casesDone,1);
  A.heXingjianMission();assert.match(curEv.text,/通常需4个月.*2个月回奏/s);choose(0);drain();
  assert.equal(p.fenghua.assignment.due,S.turn+2);
  S.turn++;A.heXingjianReport();assert.equal(modalOpen,false);
  S.turn++;A.heXingjianReport();assert.match(curEv.text,/臣看漏了这一页/);
  choose(1);drain();assert.equal(p.fenghua.casesDone,2);assert.match(viewJinyiwei(),/专案已结/);`);
});

test('an actual pending release-71 Lin encounter replays before the additional guest unlocks',()=>{
 const source=readFileSync('docs/qa/lin-jianxi/index.html','utf8');
 const scenes=JSON.parse(source.match(/id="lin-demo-data">(.*?)<\/script>/s)[1]);
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(scenes.meet.world)]]));
 b.run(`assert.equal(PalaceActions.contentVersion,71);assert.equal(curEv.title,'林见溪 · 竹径拾纸');
  assert.doesNotMatch(fenghuaCodex(),/贺行简/);choose(0);drain();
  assert.match(fenghuaCodex(),/贺行简/);assert.equal(heXingjianPerson(),undefined);`);
});
