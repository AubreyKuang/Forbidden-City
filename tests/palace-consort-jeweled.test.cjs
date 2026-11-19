const assert=require('node:assert/strict'),{test}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/consort-jeweled-sources.json');
const legacy=require('./fixtures/consort-jeweled-legacy-v163.json');
function game(storage=new Map()){const b=boot(947,storage);b.ctx.assert=assert;return b;}

test('six approved jeweled portraits keep stable identities in full, thumbnail, promoted and saved views',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:6},(_,i)=>515+i));
  const b=game();b.run('A.start();drain();');
  for(const p of manifest.portraits){
    assert.equal(p.source,'exec-826864b7-00bd-4f91-998b-2b662009d7a5.png');
    assert.ok(fs.statSync(path.join(__dirname,'../assets/images',p.atlas)).size>1000);
    const [x,y,w,h]=p.placed;
    assert.ok(x>=p.tile%4*448&&x+w<=(p.tile%4+1)*448);
    assert.ok(y>=Math.floor(p.tile/4)*560&&y+h<=(Math.floor(p.tile/4)+1)*560);
    b.run(`{
      const cell=${p.id},c=makeGirl({age:22,fam:{t:'县令',p:20}});c.artPortrait=cell;
      assert.equal(portraitSheet(cell).start,515);assert.ok(ALL_CONSORT_PORTRAITS.includes(cell));
      assert.ok(!DOWAGER_PORTRAITS.includes(cell));assert.ok(!ALL_OFFICIAL_PORTRAITS.includes(cell));
      assert.ok(!Object.values(STORY_NPC_PORTRAITS).includes(cell));
      assert.equal(PORTRAIT_CLOTHES[cell],${JSON.stringify(p.label)});
      for(const rank of [0,4,8]){
        c.rank=rank;assignConsortPortrait(c);assert.equal(portraitCell(c),cell);
        for(const size of [64,224])assert.ok(porImg(c,size).includes('${p.atlas}'));
      }
      const before=JSON.stringify(c);porImg(c,64);porImg(c,224);assert.equal(JSON.stringify(c),before);
      const fit=fittedPortraitJewelry(cell,8);assert.ok(fit.box[1]+fit.box[2]*.42<portraitHead(cell)[1]);
      c.maid=true;assignConsortPortrait(c);assert.equal(portraitCell(c),cell);S.consorts.push(c);
    }`);
  }
  b.run(`var faces=S.consorts.map(c=>[c.id,portraitCell(c)]);save('1');assert.ok(load('1'));
    assert.deepEqual(S.consorts.map(c=>[c.id,portraitCell(c)]),faces);`);
});

test('a jeweled empress keeps her portrait after succession and pending-scene reload',()=>{
  let b=game();b.run(`A.start();drain();empress().artPortrait=520;
    var son=makeKid(empress(),'m','承宁');son.born=S.turn-240;succeed(son);choose(0);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),520);`);
});

for(const [name,data] of Object.entries(legacy))test('published v163 '+name+' retains its original faces across reload',()=>{
  let b=game(new Map([['chengongji_v1_auto',JSON.stringify(data)]]));
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,163);`);
  const faces=s=>[...s.consorts,...s.cands].map(c=>[c.id,c.artPortrait]);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(data));
  if(name==='selection-before'){
    b.force(...legacy['selection-after'].pendingActions.steps.at(-1).rolls);
    b.run(`choose(0);save('auto');`);b=game(b.storage);
    b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,163);`);
    assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(legacy['selection-after']));
  }
  b.run(`assert.ok(S.cands.every(c=>!JEWELED_CONSORT_PORTRAITS.includes(c.artPortrait)));
    drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.equal(PalaceActions.blocked,false);`);
});
