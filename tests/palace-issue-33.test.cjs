const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const makeGame=(storage)=>{const b=boot(17001,storage);b.ctx.assert=assert;if(!storage)b.run('A.start();drain()');return b;};

test('reported monthly memorials show specific previews and prose first, with effects underneath',()=>{
 const b=makeGame();
 b.run(String.raw`
   for(const [index,title,choice,effect] of [[16,'立木为信',0,'国库 −5'],[21,'宝船',1,'国库 +30'],[22,'青苗法',0,'国库 +150'],[24,'金丹',1,'威望 +2'],[12,'修建园林',1,'民心 +3'],[14,'地龙翻身',1,'国库 −200'],[11,'五谷丰登',0,'国库 −100']]){
     S.flags.courtDocket={turn:S.turn,gen:S.gen,completed:[],skipped:[]};
     S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index};E().energy=4;PalaceActions.reset();
     A.court();assert.equal(curEv.title,title);
     assert.ok(curEv.choices.every(c=>c.preview&&c.preview!=='按此批示办理'),title);
     assert.ok(curEv.choices[choice].preview.includes(effect),title);
     choose(choice);assert.match($('#mbox').innerHTML,/<div class="mtext"><p>[^<]+<\/p><p class="fx">/);drain();
   }
 `);
});
test('earthquakes rotate across eligible reports without changing a pinned report, while harvests follow the season',()=>{
 const b=makeGame();b.run(`
  assert.equal(courtSubjectReady(HARVEST_INDEX),false);
  S.month=8;assert.equal(courtSubjectReady(HARVEST_INDEX),true);
  rememberCourtSubject(HARVEST_INDEX);assert.equal(courtSubjectReady(HARVEST_INDEX),false);
  const index=EARTHQUAKE_INDEX,first=nextEarthquakeReport(),pinned={earthquake:first};
  assert.match(COURT[index](pinned).text,/陇西/);
  rememberCourtSubject(index);S.turn+=2;assert.equal(courtSubjectReady(index),false);
  assert.match(COURT[index](pinned).text,/陇西/);
  S.turn+=4;assert.equal(courtSubjectReady(index),true);assert.match(COURT[index]().text,/河东/);
 `);
});
test('finance reconciliation, the popular-support cap and paths to parenthood are explained in game',()=>{
 const b=makeGame();
 b.run(`
   E().people=98;assert.equal(chg({people:9}),'民心+2（已达上限100）');assert.equal(E().people,100);
   assert.match($('#top').innerHTML,/民心范围 0–100/);
   assert.match(viewKids(),/连续十二个月/);assert.match(viewKids(),/皇子满五岁/);assert.match(viewKids(),/护国寺祈福/);
   E().nightsMonth=4;S.month=12;A.endMonth();
   const m=S.flags.lastMonthReview;
   assert.equal(m.finance.opening+m.inc-m.exp+m.finance.other,m.finance.closing);
   assert.equal(m.health.nightFatigue,1.2);
   assert.match(viewLog(),/其他换月收支/);assert.match(viewLog(),/召幸过频损耗 1.2/);
 `);
});
test('a real v68 result reloads and then uses the new manual month control',()=>{
 const save=require('./fixtures/playtest-issue-33-legacy-v68.json');
 const b=makeGame(new Map([['chengongji_v1_auto',JSON.stringify(save)]]));
 b.run(`
   A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,68);
   assert.equal(curEv.title,'黄河决堤');assert.ok(modalResult);drain();
   assert.equal(PalaceActions.contentVersion,69);assert.equal(S.turn,0);
   A.go('family');assert.equal(S.turn,0);assert.equal(UI.view,'family');
 `);
});
