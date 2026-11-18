const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const plan=require('../docs/consort-half-portrait-plan.json');
const manifest=require('../docs/consort-half-portrait-sources.json');
const root=path.resolve(__dirname,'..');
function game(){const g=boot();g.ctx.assert=assert;g.run('A.newGame();A.start();drain();');return g;}

test('every audited consort close-up has a half-body detail while keeping its original thumbnail',()=>{
  const {run}=game();
  assert.equal(plan.new.length,82);
  assert.equal(Object.keys(plan.paired).length,6);
  assert.deepEqual(manifest.portraits.map(p=>p.id),plan.new);
  for(const cell of [...plan.new,...Object.keys(plan.paired).map(Number)]){
    run(`{
      const p={portraitOverride:${cell},seed:17,rank:0};
      const original=portraitSheet(${cell});
      const view=portraitView(${cell},false);
      const small=porImg(p,64),large=porImg(p,224);
      assert.equal(portraitCell(p),${cell});
      assert.equal(portraitView(${cell},true).sheet,original);
      assert.equal(portraitView(${cell},true).cell,${cell});
      assert.ok(small.includes(original.src));
      assert.ok(large.includes(view.sheet.src));
      assert.ok(large.includes('data-portrait-cell="${cell}"'));
      assert.ok(small.includes('data-portrait-framing="bust"'));
      assert.ok(large.includes('data-portrait-framing="full"'));
      assert.equal(porImg(p,84).includes(original.src),true);
      assert.equal(porImg(p,85).includes(view.sheet.src),true);
      assert.notEqual(localPortrait(${cell},0,'','',true),localPortrait(${cell},0,'','',false));
    }`);
  }
});

test('all half-body atlas cells are distinct, bounded and backed by real files',()=>{
  const {run}=game();
  assert.equal(new Set(manifest.portraits.map(p=>p.atlas+':'+p.tile)).size,82);
  for(const p of manifest.portraits){
    assert.ok(fs.statSync(path.join(root,'assets/images',p.atlas)).size>1000);
    const view=run(`portraitView(${p.id},false)`);
    assert.equal(view.cell,p.tile);
    assert.ok(view.sheet.src.includes(p.atlas));
    assert.ok(p.tile>=0&&p.tile<view.sheet.rows*4);
    assert.ok(p.head[0]>=20&&p.head[0]<=92);
    assert.ok(p.head[1]>=16&&p.head[1]<=45);
    assert.ok(p.head[2]>=18&&p.head[2]<=34);
  }
});

test('white and flower close-ups reuse their already approved matching half-body paintings',()=>{
  const {run}=game();
  for(const [close,half] of Object.entries(plan.paired))run(`{
    const view=portraitView(${close},false);
    assert.equal(view.cell,${half});
    assert.equal(view.sheet,portraitSheet(${half}));
    assert.deepEqual(view.head,portraitHead(${half}));
    assert.deepEqual(portraitView(${close},true).head,portraitHead(${close}));
  }`);
});

test('detail rendering and jewelry never change saved identities, pools or story assignments',()=>{
  const {run}=game();
  run(`{
    assert.equal(PORTRAIT_COUNT,503);
    assert.equal(ALL_CONSORT_PORTRAITS.length,181);
    assert.equal(STORY_CONSORT_PORTRAITS.gouyi,422);
    const c=harem()[0];c.artPortrait=112;c.portraitOverride=112;
    const id=c.id;const before=JSON.stringify(S);
    for(const cell of Object.keys(CONSORT_DETAIL_ART).map(Number)){
      const p={portraitOverride:cell,rank:8,seed:19};
      const view=portraitView(cell,false);
      const fit=fittedPortraitJewelry(cell,8,'',view.head);
      assert.ok(fit.box[1]+fit.box[2]*.42<view.head[1]);
      for(const jewelry of ['',...Object.keys(JEWELRY)]){
        const detail=localPortrait(cell,8,'',jewelry,false);
        assert.ok(detail.includes(view.sheet.src));
        assert.ok(detail.includes('data-headpiece'));
        if(JEWELRY[jewelry]?.cell>=3){
          const pin=fittedPortraitJewelry(cell,0,jewelry,view.head),center=pin.box[0]+pin.box[2]/2;
          assert.ok(center>=view.head[0]-view.head[2]/2,'pin attaches inside the hair');
          assert.ok(center<view.head[0],'pin stays beside the face');
        }
      }
      porImg(p,64);porImg(p,224);
    }
    assert.equal(JSON.stringify(S),before);
    for(const rank of [0,4,8]){c.rank=rank;assert.equal(portraitCell(c),112);assert.ok(porImg(c,224).includes(portraitView(112,false).sheet.src));}
    save('1');assert.ok(load('1'));
    assert.equal(byId(id).artPortrait,112);assert.equal(portraitCell(byId(id)),112);
    for(const cell of [12,28,44,136,256,316,363,380,398,422,423,429]){
      const view=portraitView(cell,false);
      assert.equal(view.cell,cell);assert.equal(view.sheet,portraitSheet(cell));
    }
  }`);
});
