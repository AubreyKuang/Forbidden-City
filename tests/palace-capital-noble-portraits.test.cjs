const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');
const legacyCases=[require('./fixtures/capital-noble-art-legacy-v19.json'),require('./fixtures/capital-noble-art-legacy-v20.json')];
function game(storage=new Map()){const b=withClock(boot(947,storage));b.ctx.assert=assert;return b;}

test('Xie An keeps his dedicated face through office assignment, aging and save reload',()=>{
  let b=game();b.run(`A.start();drain();
    assert.equal(STORY_NPC_PORTRAITS.capitalNoble,433);
    for(var pool of [ALL_CONSORT_PORTRAITS,ALL_OFFICIAL_PORTRAITS,EMPEROR_PORTRAITS])assert.ok(!pool.includes(433));
    var p=createXieAn();assert.equal(p.artPortrait,433);assert.equal(portraitCell(p),433);
    p.age=70;assignCourtOfficialPortrait(p,'army');assert.equal(portraitCell(p),433);
    for(var size of [64,224])assert.match(porImg(p,size),/palace-capital-noble.webp/);
    S.flags.portraitSubject=p.id;save('auto');
  `);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(portraitCell(S.scholars.find(p=>p.id===S.flags.portraitSubject)),433);
  `);
});

test('white jade art reaches brothers including later sons, never the general officer or father pools',()=>{
  const b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];S.flags.frontierHouses=[];S.scholars=[];delete S.jinyiwei;
    for(var bloc of ['civil','army']){
      var h={bloc},count=OFFICIAL_PORTRAITS[bloc].young.length+1;
      for(var i=0;i<count;i++){
        var role=i%2?'brother2':'brother',p={id:bloc+i,age:25,seed:750+i,official:2};
        h['person'+i]=p;assignOfficialPortrait(p,h,role);
      }
      assert.equal(Object.values(h).filter(p=>p?.artPortrait===434).length,1);
    }
    for(var i=0;i<120;i++){
      var p={id:'ordinary'+i,age:25,seed:i};assignCourtOfficialPortrait(p,'civil');assert.notEqual(p.artPortrait,434);
      var f={id:'father'+i,age:50,seed:i};assignOfficialPortrait(f,{bloc:'civil'},'father');assert.notEqual(f.artPortrait,434);
    }
    var p={id:'white',age:25,seed:17,official:2,artPortrait:434};p.age=65;
    assignOfficialPortrait(p,{bloc:'army'},'brother2');assert.equal(portraitCell(p),434);
    for(var size of [64,224])assert.match(porImg(p,size),/palace-brother-jade-white.webp/);
  `);
});

for(const legacy of legacyCases)test('v'+legacy.pendingActions.version+' pending coronation restores original faces before enabling new brother art',()=>{
  const b=game(new Map([['chengongji_v1_auto',JSON.stringify(legacy)]]));
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${legacy.pendingActions.version});`);
  assert.equal(b.run('curEv.title'),legacy.pendingActions.pending.title);
  const faces=consorts=>consorts.map(c=>Object.values(c.house||{}).filter(p=>p&&typeof p==='object'&&p.id).map(p=>[p.id,p.artPortrait]));
  assert.deepEqual(faces(JSON.parse(b.run('JSON.stringify(S.consorts)'))),faces(legacy.consorts));
  b.run('drain();assert.equal(PalaceActions.contentVersion,40);');
});
