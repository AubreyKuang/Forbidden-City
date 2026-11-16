const assert=require('node:assert/strict'),{test}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/consort-colors-sources.json');
const legacyCases=[require('./fixtures/consort-colors-legacy-v34.json'),require('./fixtures/consort-colors-legacy-v35.json'),require('./fixtures/consort-colors-legacy-v36.json'),require('./fixtures/consort-colors-legacy-v37.json')];
function game(storage=new Map()){const b=boot(510,storage);b.ctx.assert=assert;return b;}

test('the thirty approved portraits have distinct cells, full and bust views, and fitted jewelry',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:30},(_,i)=>459+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.atlas+':'+p.cell)).size,30);
  const b=game();b.run('A.start();drain();');
  for(const p of manifest.portraits){
    assert.ok(fs.statSync(path.join(__dirname,'../assets/images',p.atlas)).size>1000);
    const [x,y,w,h]=p.placed;assert.ok(x>=p.cell%4*448&&x+w<=(p.cell%4+1)*448);
    assert.ok(y>=Math.floor(p.cell/4)*560&&y+h<=(Math.floor(p.cell/4)+1)*560);
    b.run(`{
      const cell=${p.id},sheet=portraitSheet(cell),person={seed:17,artPortrait:cell,rank:0};
      assert.equal(portraitCell(person),cell);assert.equal(cell-sheet.start,${p.cell});
      assert.ok(ALL_CONSORT_PORTRAITS.includes(cell));assert.ok(!DOWAGER_PORTRAITS.includes(cell));assert.ok(!ALL_OFFICIAL_PORTRAITS.includes(cell));
      for(const size of [64,224])assert.ok(porImg(person,size).includes('${p.atlas}'));
      const fit=fittedPortraitJewelry(cell,8);assert.ok(fit.box[1]+fit.box[2]*.42<portraitHead(cell)[1]);
      assert.ok(PORTRAIT_CLOTHES[cell]);
    }`);
  }
});

test('new domestic candidates can use all thirty colors without repeats, while foreign pools remain separate',()=>{
  const b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];S.children=[];
    for(var i=0;i<NEW_DOMESTIC_CONSORT_PORTRAITS.length;i++)S.cands.push(makeGirl({age:22,fam:{t:'县令',p:20}}));
    var faces=S.cands.map(p=>p.artPortrait);assert.equal(new Set(faces).size,NEW_DOMESTIC_CONSORT_PORTRAITS.length);
    for(var cell of COLOR_CONSORT_PORTRAITS)assert.ok(faces.includes(cell));
    for(var title of ['西域贡女','东瀛贵族','海西贵族']){
      var g=makeGirl({age:22,fam:{t:title,p:20}});assert.ok(consortPortraits(g).includes(g.artPortrait));assert.ok(!COLOR_CONSORT_PORTRAITS.includes(g.artPortrait));
    }
  `);
});

test('existing and missing-art identities keep their legacy mapping during migration, including forEach callers',()=>{
  const b=game();b.run(`A.start();drain();S.consorts=[];S.cands=[];S.children=[];
    var beforeRandom=Math.random;Math.random=()=>{throw Error('Art selection consumed RNG');};
    try{
      for(var seed=1;seed<60;seed++){
        var g={id:seed,seed,alive:true,fam:{t:'县令',p:20}},face=portraitCell(g);
        assignConsortPortrait(g);assert.equal(g.artPortrait,face);
        var old=g.artPortrait;assignConsortPortrait(g,true);assert.equal(g.artPortrait,old);
      }
      var people=Array.from({length:15},(_,i)=>({id:i,seed:i+21,alive:true,fam:{t:'县令',p:20}})),faces=people.map(p=>portraitCell(p));
      people.forEach(assignConsortPortrait);assert.deepEqual(people.map(p=>p.artPortrait),faces);
    }finally{Math.random=beforeRandom;}
    for(var cell of [...COLOR_CONSORT_PORTRAITS,422,438]){
      var g={artPortrait:cell,seed:8,fam:{t:'县令',p:20}};assignConsortPortrait(g);assert.equal(portraitCell(g),cell);
      if(COLOR_CONSORT_PORTRAITS.includes(cell)){g.maid=true;assert.equal(portraitCell(g),cell);}
    }
  `);
});

test('a new colored consort keeps her face through promotion, saved pending succession and dowager greeting',()=>{
  let b=game();b.run(`A.start();drain();var c=empress();c.artPortrait=466;
    var son=makeKid(c,'m','承宁');son.born=S.turn-240;
    var old=JSON.stringify(S);porImg(c,64);porImg(c,224);assert.equal(JSON.stringify(S),old);
    succeed(son);choose(0);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),466);
    E().energy=20;S.flags.dowager.lastOffer=S.turn;A.greet();assert.equal(portraitCell(curEv.por),466);save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(portraitCell(curEv.por),466);drain();`);
});

for(const legacy of legacyCases)for(const [name,data] of Object.entries(legacy))test('published v'+data.pendingActions.version+' '+name+' retains original faces and finishes before adopting expanded creation',()=>{
  const version=data.pendingActions.version;
  let b=game(new Map([['chengongji_v1_auto',JSON.stringify(data)]]));
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});`);
  const faces=s=>[...s.consorts,...s.cands].map(c=>[c.id,c.artPortrait]);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(data));
  if(name==='selection-before'){
    // Continue with the genuine published action's draws, independent of reload RNG.
    b.force(...legacy['selection-after'].pendingActions.steps.at(-1).rolls);
    b.run(`choose(0);save('auto');`);b=game(b.storage);
    b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});`);
    assert.deepEqual(JSON.parse(b.run('JSON.stringify([...S.consorts,...S.cands].map(c=>[c.id,c.artPortrait]))')),faces(legacy['selection-after']));
  }
  b.run(`drain();assert.equal(PalaceActions.contentVersion,59);assert.equal(PalaceActions.blocked,false);`);
});
