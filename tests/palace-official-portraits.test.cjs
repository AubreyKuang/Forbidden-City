const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
const manifest=require('../docs/official-portrait-sources.json');
const legacy=require('./fixtures/official-portraits-legacy-v11.json');
const legacy13=require('./fixtures/official-portraits-legacy-v13.json');
const gouyi=require('../docs/gouyi-portrait-source.json');
function game(seed=831,storage=new Map()){
  const b=withClock(boot(seed,storage));b.ctx.assert=assert;return b;
}
function reload(b){const n=game(901,b.storage);n.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");return n;}

test('24 approved portraits occupy appended atlas cells and all belong to the correct official pools',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:24},(_,i)=>398+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.source+':'+p.cell)).size,24);
  assert.equal(manifest.portraits.filter(p=>p.bloc==='civil').length,12);
  assert.equal(manifest.portraits.filter(p=>p.bloc==='army').length,12);
  const b=game();b.ctx.entries=manifest.portraits;
  b.run(`for(var p of entries){
    assert.ok(OFFICIAL_PORTRAITS[p.bloc][p.ageGroup].includes(p.id));
    assert.equal(portraitCell({official:p.bloc==='army'?3:2,artPortrait:p.id}),p.id);
    assert.equal(portraitSheet(p.id).start,398);
    assert.equal(ALL_CONSORT_PORTRAITS.includes(p.id),false);
    var [x,y]=portraitTile(p.id,portraitSheet(p.id));assert.ok(x>=0&&x<448&&y>=0&&y<840);
  }`);
});

test('family roles use profession pools and dedicated brother additions without repeating',()=>{
  const b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];delete S.jinyiwei;
    for(var bloc of ['civil','army'])for(var role of ['father','brother']){
      S.scholars=[];var mature=role==='father',pool=[...OFFICIAL_PORTRAITS[bloc][mature?'mature':'young'],...(mature?[]:BROTHER_ONLY_PORTRAITS)];
      for(var i=0;i<pool.length;i++){
        var p={id:'pool-'+i,seed:193+i,age:mature?50:25,official:mature?0:2};
        assignOfficialPortrait(p,{bloc},role);
        assert.ok(pool.includes(p.artPortrait));S.scholars.push(p);
      }
      assert.equal(new Set(S.scholars.map(p=>p.artPortrait)).size,pool.length);
      var p=S.scholars[0],original=p.artPortrait;p.age=80;p.alive=false;
      assignCourtOfficialPortrait(p,bloc==='army'?'civil':'army');assert.equal(p.artPortrait,original);
    }
  `);
});

test('new exam candidates have distinct civilian faces and retain them through appointment and reload',()=>{
  let b=game();b.run(`A.start();drain();S.year=4;S.month=2;S.turn=38;A.endMonth();
    for(var n=0;modalOpen&&!/殿试/.test(curEv.title)&&n<150;n++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}
    assert.match(curEv.title,/殿试/);assert.equal(new Set(curEv.cast.map(p=>p.artPortrait)).size,3);
    for(var p of curEv.cast)assert.ok(OFFICIAL_PORTRAITS.civil.young.includes(p.artPortrait));
  `);
  const faces=JSON.parse(b.run('JSON.stringify(curEv.cast.map(p=>[p.id,p.artPortrait]))'));
  b=reload(b);assert.deepEqual(JSON.parse(b.run('JSON.stringify(curEv.cast.map(p=>[p.id,p.artPortrait]))')),faces);
  b.run('choose(0);');b=reload(b);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.scholars.filter(p=>p.examRank).map(p=>[p.id,p.artPortrait]))')).sort(),faces.sort());
});

test('new commanders use dedicated Jinyiwei portraits and retain the saved result across reloads',()=>{
  let b=game();b.run(`A.start();drain();E().energy=4;E().treasury=900;A.establishJinyiwei();choose(0);
    var p=S.jinyiwei.commander;assert.ok(JINYIWEI_PORTRAITS.includes(p.artPortrait));
  `);
  const face=b.run('S.jinyiwei.commander.artPortrait');b=reload(b);
  assert.equal(b.run('S.jinyiwei.commander.artPortrait'),face);
  b.run('nextEv();S.jinyiwei.commander.age=65;save("auto");');b=reload(b);
  assert.equal(b.run('S.jinyiwei.commander.artPortrait'),face);
});

test('frontier generals outside the harem also share the military pool without immediately repeating',()=>{
  const b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];S.flags.frontierHouses=[];
    var generals=Array.from({length:OFFICIAL_PORTRAITS.army.mature.length},()=>frontierCreateGeneral().p);
    assert.equal(new Set(generals.map(p=>p.artPortrait)).size,generals.length);
    for(var p of generals)assert.ok(OFFICIAL_PORTRAITS.army.mature.includes(p.artPortrait));
  `);
});

test('new coronations replay with the expanded family portraits',()=>{
  let b=game();b.run('A.start();');
  const faces=b.run('JSON.stringify(S.consorts.map(c=>Object.values(c.house||{}).map(p=>p?.artPortrait)))');
  b=reload(b);
  assert.equal(b.run('JSON.stringify(S.consorts.map(c=>Object.values(c.house||{}).map(p=>p?.artPortrait)))'),faces);
});

test('Gouyi is permanently ID 422, renders through either portrait field and stays out of every random pool',()=>{
  assert.equal(gouyi.portraits[0].id,422);assert.equal(gouyi.portraits[0].key,'gouyi');
  let b=game();b.run(`A.start();drain();
    assert.equal(STORY_CONSORT_PORTRAITS.gouyi,422);assert.equal(ALL_CONSORT_PORTRAITS.includes(422),false);
    var c=harem()[0];c.artPortrait=STORY_CONSORT_PORTRAITS.gouyi;assignConsortPortrait(c);
    assert.equal(portraitCell(c),422);assert.match(porImg(c,96),/data-portrait-cell="422"/);
    c.rank=8;assert.equal(portraitCell(c),422);assert.ok(fittedPortraitJewelry(422,8));
    assert.equal(portraitCell({portraitOverride:422}),422);
    assert.equal(portraitSheet(422).start,422);assert.deepEqual(portraitTile(422,portraitSheet(422)),[0,0]);
    save('auto');
  `);
  b=reload(b);b.run(`var c=harem()[0];assignConsortPortrait(c);assert.equal(portraitCell(c),422);
    for(var i=0;i<200;i++){var p=makeGirl();assert.notEqual(p.artPortrait,422);}
  `);
});

for(const fixture of [...legacy.cases,...legacy13.cases])test('unmodified version '+fixture.save.pendingActions.version+' '+fixture.name+' keeps its saved faces and pending decisions',()=>{
  let b=game(901,new Map([['chengongji_v1_auto',JSON.stringify(fixture.save)]]));
  b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
  assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
  assert.equal(b.run('PalaceActions.contentVersion'),fixture.save.pendingActions.version);
  if(fixture.name==='commander')assert.equal(b.run('S.jinyiwei.commander.artPortrait'),fixture.save.jinyiwei.commander.artPortrait);
  if(fixture.name==='examination')assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.scholars.filter(p=>p.examRank).map(p=>p.artPortrait))')),fixture.save.scholars.filter(p=>p.examRank).map(p=>p.artPortrait));
  b.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));');
  b=reload(b);b.run('drain();assert.equal(PalaceActions.contentVersion,40);');
});
