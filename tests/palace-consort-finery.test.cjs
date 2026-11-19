const assert=require('node:assert/strict'),{test}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/consort-finery-sources.json');
const legacy=require('./fixtures/consort-finery-legacy-v156.json');
function game(storage=new Map()){const b=boot(941,storage);b.ctx.assert=assert;return b;}

test('all twelve approved finery portraits render both views and preserve identities through save, rank and maid changes',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:12},(_,i)=>503+i));
  assert.deepEqual([...new Set(manifest.portraits.map(p=>p.source))],[
    'exec-88ec8ed5-9c60-417d-b8fe-676d70a824f1.png','exec-41c7c9bf-7b90-4626-b2ce-579556fefafc.png']);
  const b=game();b.run('A.start();drain();');
  for(const p of manifest.portraits){
    assert.ok(fs.statSync(path.join(__dirname,'../assets/images',p.atlas)).size>1000);
    const [x,y,w,h]=p.placed;
    assert.ok(x>=p.tile%4*448&&x+w<=(p.tile%4+1)*448);
    assert.ok(y>=Math.floor(p.tile/4)*560&&y+h<=(Math.floor(p.tile/4)+1)*560);
    b.run(`{
      const cell=${p.id},person=makeGirl({age:22,fam:{t:'县令',p:20}});person.artPortrait=cell;
      assert.equal(portraitSheet(cell).start,503);assert.equal(cell-503,${p.tile});
      assert.ok(ALL_CONSORT_PORTRAITS.includes(cell));assert.ok(!DOWAGER_PORTRAITS.includes(cell));
      assert.ok(!ALL_OFFICIAL_PORTRAITS.includes(cell));assert.ok(!Object.values(STORY_NPC_PORTRAITS).includes(cell));
      assert.equal(PORTRAIT_CLOTHES[cell],${JSON.stringify(p.label)});
      for(const rank of [0,4,8]){
        person.rank=rank;assignConsortPortrait(person);assert.equal(portraitCell(person),cell);
        for(const size of [64,224])assert.ok(porImg(person,size).includes('${p.atlas}'));
      }
      const before=JSON.stringify(person);porImg(person,64);porImg(person,224);assert.equal(JSON.stringify(person),before);
      const fit=fittedPortraitJewelry(cell,8);assert.ok(fit.box[1]+fit.box[2]*.42<portraitHead(cell)[1]);
      person.maid=true;assignConsortPortrait(person);assert.equal(portraitCell(person),cell);
      S.consorts.push(person);
    }`);
  }
  b.run(`var faces=S.consorts.map(c=>[c.id,portraitCell(c)]);save('1');assert.ok(load('1'));
    assert.deepEqual(S.consorts.map(c=>[c.id,portraitCell(c)]),faces);`);
});

test('a finery empress retains her saved portrait when she becomes the next reigns dowager',()=>{
  let b=game();b.run(`A.start();drain();var c=empress();c.artPortrait=507;
    var son=makeKid(c,'m','承宁');son.born=S.turn-240;succeed(son);choose(0);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),507);`);
});

for(const [name,data] of Object.entries(legacy))test('published v156 '+name+' retains its portrait allocation across pending-scene reload',()=>{
  let b=game(new Map([['chengongji_v1_auto',JSON.stringify(data)]]));
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,156);`);
  const faces=s=>[...s.consorts,...s.cands].map(c=>[c.id,c.artPortrait]);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(data));
  if(name==='selection-before'){
    b.force(...legacy['selection-after'].pendingActions.steps.at(-1).rolls);
    b.run(`choose(0);save('auto');`);b=game(b.storage);
    b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,156);`);
    assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(legacy['selection-after']));
  }
  b.run(`assert.ok(S.cands.every(c=>!FINERY_CONSORT_PORTRAITS.includes(c.artPortrait)));
    drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(PalaceActions.blocked,false);`);
});
