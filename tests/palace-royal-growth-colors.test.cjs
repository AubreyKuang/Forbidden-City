const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/royal-growth-colors-sources.json');
const legacyCases=[require('./fixtures/royal-growth-colors-legacy-v58.json'),require('./fixtures/royal-growth-colors-legacy-v61.json')];
function game(storage){const b=boot(724,storage);b.ctx.assert=assert;return b;}
const sets=[['f',37,489],['f',38,492],['m',31,495],['m',32,498]];

test('the twelve approved royal portraits form four correctly ordered three-age identities',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:12},(_,i)=>489+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.source+':'+p.sourceCell)).size,12);
  assert.ok(fs.statSync(path.join(__dirname,'../assets/images/palace-royal-growth-colors.webp')).size>1000);
  const b=game();b.run('A.start();drain();');
  for(const [sex,variant,first] of sets){
    const frames=manifest.portraits.filter(p=>p.sex===sex&&p.variant===variant);
    assert.deepEqual(frames.map(p=>p.id),[first,first+1,first+2]);
    assert.deepEqual(frames.map(p=>p.stage),[0,1,2]);
    assert.equal(new Set(frames.map(p=>p.sourceSha256)).size,1);
    for(const p of frames){
      const [x,y,w,h]=p.placed;assert.ok(x>=p.cell%4*448&&x+w<=(p.cell%4+1)*448);
      assert.ok(y>=Math.floor(p.cell/4)*560&&y+h<=(Math.floor(p.cell/4)+1)*560);
      b.run(`assert.equal(portraitSheet(${p.id}).start,489);assert.ok(!ALL_CONSORT_PORTRAITS.includes(${p.id}));assert.ok(!ALL_OFFICIAL_PORTRAITS.includes(${p.id}));`);
    }
  }
});

test('all four identities keep the same saved set at both age boundaries and after cold reload',()=>{
  let b=game();b.run('A.start();drain();');
  for(const [sex,variant,first] of sets){
    const id=b.run(`var k=makeKid(harem()[0],'${sex}','成长套图');k.portraitVariant=${variant};k.id`);
    for(const [months,stage] of [[0,0],[35,0],[36,1],[143,1],[144,2],[240,2]]){
      b.run(`var k=kidById(${id});k.born=S.turn-${months};assert.equal(portraitCell(k),${first+stage});
        assert.ok(porImg(k,64).includes('palace-royal-growth-colors.webp'));assert.ok(porImg(k,224).includes('palace-royal-growth-colors.webp'));save('auto');`);
      b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${id}).portraitVariant,${variant});assert.equal(portraitCell(kidById(${id})),${first+stage});`);
    }
  }
});

test('new births can choose every appended set before repeating young faces',()=>{
  const b=game();b.run(`A.start();drain();
    for(var sex of ['m','f']){
      S.children=[];var n=portraitVariantCount({sex})-(sex==='f'?4:0);
      for(var i=0;i<n;i++)makeKid(harem()[0],sex,'皇嗣'+i);
      assert.equal(new Set(S.children.map(portraitCell)).size,n);
      for(var v of sex==='f'?[37,38]:[31,32])assert.ok(S.children.some(k=>k.portraitVariant===v));
    }
  `);
});

test('saved old variants and missing-variant fallback retain their identities without random draws',()=>{
  const b=game();b.run(`A.start();drain();
    var random=Math.random;Math.random=()=>{throw Error('portrait rendering rolled RNG')};
    try{for(var sex of ['m','f'])for(var i=0;i<10;i++){
      var old={id:i,sex,ord:i+1,seed:i+7,born:S.turn-240};
      assert.equal(portraitCell(old),portraitCell({...old,portraitVariant:i}));
    }}finally{Math.random=random;}
    for(var [sex,v,cell] of [['f',35,394],['f',36,397],['m',29,388],['m',30,391]])
      assert.equal(portraitCell({sex,portraitVariant:v,born:S.turn-240}),cell);
  `);
});

for(const legacy of legacyCases)for(const [name,payload] of Object.entries(legacy))test('genuine v'+payload.pendingActions.version+' '+name+' birth preserves its original face while replaying and then enables the new pool',()=>{
  let b=game(new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${payload.pendingActions.version});
    assert.equal(portraitCreationVariantCount({sex:'m'}),31);assert.equal(portraitCreationVariantCount({sex:'f'}),37);`);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.children.map(k=>[k.id,k.sex,k.portraitVariant]))')),payload.children.map(k=>[k.id,k.sex,k.portraitVariant]));
  b.run(`drain();assert.equal(PalaceActions.contentVersion,70);assert.equal(portraitCreationVariantCount({sex:'m'}),33);assert.equal(portraitCreationVariantCount({sex:'f'}),39);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.children.map(k=>[k.id,k.sex,k.portraitVariant]))')),payload.children.map(k=>[k.id,k.sex,k.portraitVariant]));
});

test('an appended prince keeps his grown portrait after succession and pending-event reload',()=>{
  let b=game();b.run(`A.start();drain();var son=makeKid(empress(),'m','承宁');son.portraitVariant=32;son.born=S.turn-240;
    assert.equal(portraitCell(son),500);succeed(son);choose(0);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(portraitCell('emp'),500);drain();save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(portraitCell('emp'),500);`);
});

test('new household daughters can receive the appended princess set and retain it in a save',()=>{
  const b=game();b.run(`A.start();drain();var son=makeKid(empress(),'m','承宁');son.born=S.turn-240;son.married=true;
    son.spouse={...marriageCandidate(son,'scholar'),marriedAt:S.turn-24};ensureMarriedLife(son);S.turn+=3;
    assert.ok(startHouseholdPregnancy(son,son.spouse));S.turn+=9;var random=Math.random;Math.random=()=>.999;
    try{var baby=deliverHouseholdChild(son,son.household.pregnancies[0]);assert.equal(baby.sex,'f');assert.equal(baby.portraitVariant,38);assert.equal(portraitCell(baby),492);}
    finally{Math.random=random;}var id=son.id;save('auto');load('auto');assert.equal(portraitCell(kidById(id).household.children[0]),492);
  `);
});
