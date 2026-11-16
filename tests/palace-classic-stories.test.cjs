const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){
 const b=boot(218);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=120;S.year=11;S.month=4;E().energy=10;E().treasury=2000;S.flags.dowager.alive=false;
  var [a,z]=harem();a.trait='才女';a.upbringing={group:'merchant',means:'ample'};z.trait='好学';
  for(const c of [a,z]){c.hp=90;c.preg=0;c.alive=true;c.cold=false;}`);
 return b;
}
test('a shared school revision and finished palace collaboration can turn into a garden circle and a printed lesson',()=>{
 let b=world();b.run(`S.children=[];var k=makeKid(a,'f','清和'),reader=makeKid(z,'m','承礼');
  for(const p of [k,reader]){p.born=S.turn-108;p.pendingName=false;p.lit=80;}
  S.duanwuWork={gen:S.gen,year:S.year,stage:'finished',tables:a.id,gifts:z.id};
  k.story.push({d:dateStr(),t:'太傅留了一页课业。'});noteRoyalSchoolwork(k,'核对纸笔小账','gift');
  S.turn=k.schoolRevision.due;pendingRoyalSchoolRevision().choices[0].f();
  assert.equal(classicCircle().helper,z.id);assert.equal(pendingClassicStory(),null);S.turn++;
  var call=pendingClassicStory();assert.match(call.ref,/红楼梦/);assert.match(call.text,/空账页/);
  var cash=E().treasury;call.choices[0].f();assert.equal(E().treasury,cash-12);assert.equal(call.choices[0].f(),null);
  assert.match(classicStoryPanel('garden'),/小园诗社/);
  S.turn=classicCircle().due;pendingClassicStory().choices[0].f();
  var key='circle-'+S.gen;UI.sel='wy';assert.match(viewPlace(),/小园诗草/);
  A.classicReadWork(key);assert.match(curEv.text,/市桥人散后/);drain();
  A.classicPress(key);assert.match(curEv.ref,/活板/);choose(1);drain();
  var work=classicWorks()[key];S.turn=work.press.due-1;A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.includes('印本交样')));save('1');`);
 b=boot(306,b.storage);b.ctx.assert=assert;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var work=classicWorks()['circle-'+S.gen];drain();assert.equal(work.press.copies,20);assert.equal(work.press.destination,'上书房');
  UI.sel='ss';assert.match(viewPlace(),/新到课本.*小园诗草/s);S.turn=work.press.schoolDue;
  var ev=pendingClassicStory();assert.equal(ev.por.name,'承礼');ev.choices[0].f();assert.equal(pendingClassicStory(),null);
  var reader=S.children.find(p=>p.name==='承礼');assert.ok(reader.story.some(e=>e.thread===work.thread&&e.t.includes('上书房新读')));`);
});
test('only adopted translations and publicly shared drafts can reach the new public shelves',()=>{
 const b=world();b.run(`var k=makeKid(a,'f','清和');k.born=S.turn-108;k.pendingName=false;
  k.story.push({d:dateStr(),t:'太傅留了一页课业。'});noteRoyalSchoolwork(k,'核对纸笔小账','gift');
  S.turn=k.schoolRevision.due;pendingRoyalSchoolRevision().choices[1].f();assert.equal(classicCircle(),undefined);
  S.travelInstitutions={books:[{key:'atlas',sources:[k.id],decision:'adopted'},{key:'calendar',sources:[k.id],decision:'archived'}]};
  assert.match(classicStoryPanel('library'),/付梓《海西道里图志》/);assert.doesNotMatch(classicStoryPanel('library'),/西域历日推步/);
  var cash=E().treasury;A.classicPress('translation-atlas');choose(0);drain();A.classicPress('translation-atlas');assert.equal(modalOpen,false);
  assert.equal(E().treasury,cash-10);var w=classicWorks()['translation-atlas'];S.turn=w.press.due;
  pendingClassicStory().choices[1].f();assert.equal(w.press.destination,'文渊阁');assert.equal(classicStoryPanel('school'),'');`);
});

test('an existing main-branch yi-land publishes rules without creating another estate',()=>{
 const b=world();b.run(`var p=houseOf(a).father,key='relief-'+S.gen;
 S.yiLands={[S.gen]:{gen:S.gen,title:'清河 · 赈济有方',key:a.id+':father',kin:a.id,thread:'yi-existing',stored:true,estate:{units:2,nextHarvest:S.turn+6,manager:null}}};
 assert.equal(classicWorks()[key].thread,'yi-existing');
 A.classicPress(key);choose(0);drain();var w=classicWorks()[key];
 S.turn=w.press.due;pendingClassicStory().choices[0].f();
 assert.equal(w.press.destination,'地方粮仓');assert.match(yiLandLedger().text,/仓门已张榜/);
 assert.equal(S.yiLands[S.gen].estate.units,2);assert.equal(yiLandProjects().length,1);`);
});
