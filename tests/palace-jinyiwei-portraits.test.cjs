const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
const manifest=require('../docs/jinyiwei-portrait-sources.json');
const legacy=require('./fixtures/jinyiwei-portraits-legacy-v14.json');
const legacy15=require('./fixtures/jinyiwei-portraits-legacy-v15.json');
function game(seed=831,storage=new Map()){
  const b=withClock(boot(seed,storage));b.ctx.assert=assert;return b;
}
function reload(b){const n=game(901,b.storage);n.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");return n;}

test('guard portraits remain exclusive even when an old ordinary officer has a mistaken assignment',()=>{
 const b=game();b.run(`A.start();drain();
 for(var cell of JINYIWEI_PORTRAITS){
   var p={id:'ordinary-'+cell,seed:cell,age:28,official:2,artPortrait:cell,portraitOverride:cell};var before=JSON.stringify(p);
   assert.ok(!JINYIWEI_PORTRAITS.includes(portraitCell(p)));assert.equal(JSON.stringify(p),before);
   assignCourtOfficialPortrait(p,'civil');assert.ok(!JINYIWEI_PORTRAITS.includes(p.artPortrait));assert.ok(!JINYIWEI_PORTRAITS.includes(portraitCell(p)));
   assert.ok(!JINYIWEI_PORTRAITS.includes(portraitCell({sex:'f',born:S.turn-240,seed:cell,portraitOverride:cell})));
   assert.equal(portraitCell({jinyiwei:true,artPortrait:cell,portraitOverride:cell}),cell);
 }`);
});

test('stable guard and shared IDs select the two explicitly approved batches and exact source cells',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:10},(_,i)=>423+i));
  const guards=manifest.portraits.slice(0,6),shared=manifest.portraits.slice(6);
  assert.deepEqual(guards.map(p=>p.cell),[0,1,2,3,4,5]);
  assert.ok(guards.every(p=>p.source==='exec-365cbf96-f794-4fa0-bb92-9561cfa9c56c.png'));
  assert.deepEqual(shared.map(p=>p.cell),[0,1,2,4]);
  assert.ok(shared.every(p=>p.source==='exec-a0e084cb-7206-4c65-a8ca-1bfd2d3ba03c.png'));
  const b=game();b.run(`
    assert.deepEqual(JINYIWEI_PORTRAITS,[423,424,425,426,427,428]);
    assert.deepEqual(SHARED_OFFICIAL_PORTRAITS,[429,430,431,432]);
    assert.equal(STORY_CONSORT_PORTRAITS.gouyi,422);
    for(var cell of JINYIWEI_PORTRAITS){
      assert.equal(portraitCell({jinyiwei:true,artPortrait:cell}),cell);
      assert.ok(!JINYIWEI_PORTRAITS.includes(portraitCell({official:3,artPortrait:cell})));
      assert.ok(!FATHER_PORTRAITS.includes(cell)&&!BROTHER_PORTRAITS.includes(cell));
      assert.equal(portraitSheet(cell).start,423);
    }
    for(var cell of SHARED_OFFICIAL_PORTRAITS){
      assert.ok(BROTHER_PORTRAITS.includes(cell));assert.ok(OFFICIAL_PORTRAITS.civil.young.includes(cell));
      assert.ok(OFFICIAL_PORTRAITS.army.young.includes(cell));assert.equal(portraitSheet(cell).start,429);
    }
    for(var cell=423;cell<433;cell++){
      assert.equal(portraitCell({portraitOverride:cell,jinyiwei:JINYIWEI_PORTRAITS.includes(cell)}),cell);assert.ok(!ALL_CONSORT_PORTRAITS.includes(cell));
      var sheet=portraitSheet(cell),[x,y]=portraitTile(cell,sheet);assert.ok(x>=0&&x<448&&y>=0&&y<sheet.rows*140);
    }
  `);
});

test('all six guard choices are reachable, seeded once, and remain fixed through age and office changes',()=>{
  const b=game();b.run(`A.start();drain();var seen=new Set();
    for(var seed=1;seed<=80;seed++){
      var p={id:'guard-'+seed,seed,age:24,official:3,jinyiwei:true};assignCourtOfficialPortrait(p,'army');
      assert.ok(JINYIWEI_PORTRAITS.includes(p.artPortrait));seen.add(p.artPortrait);var cell=p.artPortrait;
      p.age=65;p.office='锦衣卫指挥使';p.alive=false;assignJinyiweiPortrait(p);assert.equal(p.artPortrait,cell);
    }
    assert.equal(seen.size,6);
    var old={seed:221,age:55,official:3,jinyiwei:true,artPortrait:285};var before=JSON.stringify(old);
    var fixed=portraitCell(old);assert.ok(JINYIWEI_PORTRAITS.includes(fixed));assert.equal(JSON.stringify(old),before);
    old.age=70;assert.equal(portraitCell(old),fixed);old.portraitOverride=428;assert.equal(portraitCell(old),428);
  `);
});

test('only the four selected older pictures enter the general scholar and brother pools and survive reload',()=>{
  let b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];S.flags.frontierHouses=[];S.scholars=[];delete S.jinyiwei;
    for(var i=0;i<OFFICIAL_PORTRAITS.civil.young.length;i++)S.scholars.push(makeScholar());
    for(var cell of SHARED_OFFICIAL_PORTRAITS)assert.ok(S.scholars.some(p=>p.artPortrait===cell));
    assert.ok(S.scholars.every(p=>!JINYIWEI_PORTRAITS.includes(p.artPortrait)));
    for(var bloc of ['civil','army']){
      S.consorts=[];S.cands=[];S.scholars=[];var h={bloc};
      for(var i=0;i<OFFICIAL_PORTRAITS[bloc].young.length+BROTHER_ONLY_PORTRAITS.length;i++){
        var p={id:bloc+'-brother-'+i,age:25,seed:i+700,official:3};h['brother'+i]=p;assignOfficialPortrait(p,h,'brother');
      }
      for(var cell of SHARED_OFFICIAL_PORTRAITS)assert.ok(Object.values(h).some(p=>p.artPortrait===cell));
    }
  `);
  b=game();b.run(`A.start();drain();var c=harem()[0],h=houseOf(c);h.brother={name:c.sur+'行远',id:'fixed-white-brother',age:25,seed:700,official:2,artPortrait:432,alive:true,story:[]};save('auto');`);
  b=reload(b);b.run(`var p=houseOf(harem()[0]).brother;assert.equal(portraitCell(p),432);p.age=60;assignOfficialPortrait(p,{bloc:'army'},'brother');assert.equal(portraitCell(p),432);`);
});

for(const fixture of [...legacy.cases,...legacy15.cases])test('version '+fixture.save.pendingActions.version+' '+fixture.name+' resumes without rewriting saved portraits',()=>{
  let b=game(901,new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
  b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
  assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
  assert.equal(b.run('PalaceActions.contentVersion'),fixture.save.pendingActions.version);
  if(fixture.name==='commander'){
    assert.equal(b.run('S.jinyiwei.commander.artPortrait'),fixture.save.jinyiwei.commander.artPortrait);
    b.run('assert.ok(JINYIWEI_PORTRAITS.includes(portraitCell(S.jinyiwei.commander)));');
  }
  if(fixture.name==='examination')assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.scholars.map(p=>p.artPortrait))')),fixture.save.scholars.map(p=>p.artPortrait));
  b.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));');
  b=reload(b);b.run('drain();assert.equal(PalaceActions.contentVersion,48);');
});
