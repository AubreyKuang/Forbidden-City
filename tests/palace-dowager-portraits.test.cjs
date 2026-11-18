const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/dowager-portrait-sources.json');
function game(storage=new Map()){
  const b=boot(947,storage);b.ctx.assert=assert;return b;
}

test('all eighteen approved dowagers have unique bounded atlas cells and stay out of other random pools',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:18},(_,i)=>441+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.atlas+':'+p.cell)).size,18);
  const b=game();b.run('A.start();drain();');
  for(const p of manifest.portraits){
    assert.ok(fs.statSync(path.join(__dirname,'../assets/images',p.atlas)).size>1000);
    const [x,y,w,h]=p.placed;
    assert.ok(x>=p.cell%4*448&&x+w<=(p.cell%4+1)*448);
    assert.ok(y>=Math.floor(p.cell/4)*560&&y+h<=(Math.floor(p.cell/4)+1)*560);
    b.run(`{
      const cell=${p.id},sheet=portraitSheet(cell),person={isMom:true,portraitOverride:cell};
      assert.equal(cell-sheet.start,${p.cell});assert.equal(sheet.scale,4);assert.equal(sheet.rows,2);
      assert.ok(sheet.src.includes('${p.atlas}'));
      for(const pool of [ALL_CONSORT_PORTRAITS,ALL_OFFICIAL_PORTRAITS,EMPEROR_PORTRAITS,Object.values(STORY_CONSORT_PORTRAITS),Object.values(STORY_NPC_PORTRAITS)])assert.ok(!pool.includes(cell));
      for(const size of [64,224]){const html=porImg(person,size);assert.ok(html.includes('${p.atlas}'));assert.ok(!html.includes('data-headpiece'));}
      assert.equal(portraitCell({isMom:true,seed:17}),9);
    }`);
  }
});

test('opening dowagers use every new face without rerolling or mutating game state while viewed',()=>{
  const b=game();b.run(`A.start();drain();
    var originalRandom=Math.random;Math.random=()=>{throw Error('Viewing must not roll RNG');};
    try{
      for(var i=0;i<18;i++){
        E().seed=i;S.flags.dowager={name:'沈太后',alive:true};
        var before=JSON.stringify(S),person=dowagerPerson(S.flags.dowager);
        assert.equal(portraitCell(person),441+i);porImg(person,64);porImg(person,224);
        assert.equal(JSON.stringify(S),before);
        S.flags.dowager.age=65;S.flags.dowager.name='沈皇太后';S.turn+=12;
        assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),441+i);
      }
    }finally{Math.random=originalRandom;}
    save('auto');`);
  const cold=game(b.storage);cold.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),458);`);
});

test('existing opening portraits and explicit overrides take priority over the new pool',()=>{
  const b=game();b.run(`A.start();drain();
    for(var portrait of [{isMom:true,seed:91},{isMom:true,portraitOverride:244},{seed:91,artPortrait:242,rank:8}]){
      var d={name:'太后',alive:true,portrait},face=portraitCell(portrait),before=JSON.stringify(d);
      assert.equal(portraitCell(dowagerPerson(d)),face);assert.equal(JSON.stringify(d),before);
    }
    for(var key of ['portraitOverride','artPortrait'])for(var cell of [9,242,422,453]){
      var d={name:'太后',alive:true,[key]:cell};assert.equal(portraitCell(dowagerPerson(d)),cell);
    }
  `);
});

for(const [queenFace,motherFace] of [[242,243],[438,422]])test(`actual succession retains empress ${queenFace} and birth mother ${motherFace} through save reload and greeting`,()=>{
  let b=game();b.run(`A.start();drain();
    var queen=empress(),mother=harem().find(c=>c!==queen);
    queen.portraitOverride=${queenFace};mother.portraitOverride=${motherFace};
    var son=makeKid(mother,'m','承宁');son.born=S.turn-240;
    S.flags.dowagerTestIds=[queen.id,mother.id];succeed(son);choose(0);drain();
    assert.equal(S.flags.dowager.personId,S.flags.dowagerTestIds[0]);
    assert.equal(S.flags.birthDowager.personId,S.flags.dowagerTestIds[1]);
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),${queenFace});
    assert.equal(portraitCell(dowagerPerson(S.flags.birthDowager)),${motherFace});
    save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),${queenFace});
    assert.equal(portraitCell(dowagerPerson(S.flags.birthDowager)),${motherFace});
    UI.sel='cn';var html=viewPlace();assert.ok(html.includes('data-portrait-cell="${queenFace}"'));assert.ok(html.includes('data-portrait-cell="${motherFace}"'));
    E().energy=20;S.flags.dowager.lastOffer=S.turn;A.greet();
    assert.equal(portraitCell(curEv.por),${queenFace});save('auto');`);
  b=game(b.storage);b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(portraitCell(curEv.por),${queenFace});drain();
    assert.equal(portraitCell(dowagerPerson(S.flags.birthDowager)),${motherFace});`);
});

test('legacy inherited dowagers recover the same woman from retained families or archived courts without writing a replacement',()=>{
  const b=game();b.run(`A.start();drain();var c=empress();c.portraitOverride=242;
    var d=makeDowager(c,'嫡母');delete d.portrait;
    for(var source of ['retained','archive','current']){
      S.retainedFamilies=source==='retained'?[c]:[];
      S.previousCourts=source==='archive'?[{consorts:[c]}]:[];
      S.consorts=source==='current'?[c]:[];S.gen=2;S.flags.dowager=d;
      var before=JSON.stringify(S);assert.equal(portraitCell(dowagerPerson(d)),242);
      porImg(dowagerPerson(d),224);assert.equal(JSON.stringify(S),before);
    }
    S.consorts=[];assert.equal(portraitCell(dowagerPerson(d)),9);
    delete d.personId;assert.equal(portraitCell(dowagerPerson(d)),9);
    d.portrait={portraitOverride:438};assert.equal(portraitCell(dowagerPerson(d)),438);
  `);
});

test('without a living empress the birth mother retains her own portrait as sole dowager',()=>{
  const b=game();b.run(`A.start();drain();var queen=empress(),mother=harem().find(c=>c!==queen);
    queen.alive=false;mother.portraitOverride=422;var son=makeKid(mother,'m','承宁');son.born=S.turn-240;
    succeed(son);choose(0);drain();assert.equal(S.flags.birthDowager,null);
    assert.equal(portraitCell(dowagerPerson(S.flags.dowager)),422);assert.equal(S.flags.dowager.relation,'生母');
  `);
});

test('opening Cining biography follows the natal clan and stays stable when revisited or loaded',()=>{
  const b=game();b.run(`A.start();drain();UI.sel='cn';
    var d=S.flags.dowager,bio=dowagerBiography(d),before=JSON.stringify(d);
    assert.ok(bio.includes('出自'+d.sur+'氏'));assert.match(bio,/家书|家训|母家|旧信封/);
    assert.ok(viewPlace().includes(bio));assert.equal(JSON.stringify(d),before);save('auto');`);
  const cold=game(b.storage);
  assert.equal(cold.run("A.load('auto');dowagerBiography(S.flags.dowager)"),b.run('bio'));
});

test('both inherited biographies keep real admission, promotions and distinct children across reload',()=>{
  const b=game();b.run(`A.start();drain();var queen=empress();S.year=4;S.month=6;S.turn=39;
    var mother=makeGirl({sur:'沈'});addConsort(mother,3,'选秀入宫');
    var admitted=dateStr(),natal=mother.house.father.name;story(mother,'【初领宫务】奉旨协理六宫，第一次在宫务簿上落款。');
    A.promote(mother.id,true);choose(0);drain();
    var heir=makeKid(mother,'m','承宁'),daughter=makeKid(mother,'f','清和'),other=makeKid(queen,'f','昭华');
    daughter.alive=false;heir.foster=queen.id;heir.born=S.turn-240;
    succeed(heir);choose(0);drain();UI.sel='cn';var main=dowagerBiography(S.flags.dowager),birth=dowagerBiography(S.flags.birthDowager);
    assert.ok(birth.includes(admitted+'经选秀入宫'));assert.ok(birth.includes(natal));assert.match(birth,/贵人，晋为嫔/);assert.ok(birth.includes(admitted+'，奉旨协理六宫'));
    assert.match(birth,/亲生皇子一人、公主一人/);assert.match(main,/亲生皇子零人、公主一人，另抚养皇嗣一人/);
    assert.match(main,/永宁元年三月自潜邸随驾入宫/);assert.ok(viewPlace().includes(main)&&viewPlace().includes(birth));save('auto');`);
  const cold=game(b.storage);cold.run("A.load('auto');");
  for(const [key,profile] of [['dowager','main'],['birthDowager','birth']]){
    assert.equal(cold.run('dowagerBiography(S.flags.'+key+')'),b.run(profile));
  }
  cold.run(`var d=S.flags.birthDowager;delete d.childrenSummary;assert.match(dowagerBiography(d),/亲生皇子一人、公主一人/);
    var source=S.previousCourts.at(-1).consorts.find(c=>c.id===d.personId);
    delete source.courtRanks;source.story=source.story.filter(e=>!e.t.includes('赐居'));
    assert.match(dowagerBiography(d),/永宁四年六月入宫受封/);
    S.previousCourts=[];S.retainedFamilies=[];delete d.portrait.courtRanks;
    assert.doesNotMatch(dowagerBiography(d),/晋为皇后/);`);
});
