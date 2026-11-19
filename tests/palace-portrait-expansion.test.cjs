const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/expanded-portrait-sources.json');
const growthManifest=require('../docs/royal-growth-sources.json');
const petiteManifest=require('../docs/princess-petite-growth-sources.json');
function game(){const g=boot();g.ctx.assert=assert;g.run('A.newGame();A.start();drain();');return g;}

test('each new royal identity has its own infant, child and grown portrait and survives reload',()=>{
  const {run}=game();run(`
    for(var sex of ['m','f'])for(var offset=0;offset<3;offset++){
      var k=makeKid(harem()[0],sex,'新皇嗣'+offset);k.portraitVariant=(sex==='m'?26:30)+offset;
      var id=k.id,variant=k.portraitVariant,base=sex==='m'?294:303;
      for(var [age,stage] of [[0,0],[2,0],[3,1],[8,1],[11,1],[12,2],[20,2]]){
        k.born=S.turn-age*12;var expected=base+stage*3+offset;
        assert.equal(portraitCell(k),expected);save('1');assert.ok(load('1'));
        k=kidById(id);assert.equal(k.portraitVariant,variant);assert.equal(portraitCell(k),expected);
      }
    }
  `);
  for(const [start,sex] of [[294,'princes'],[303,'princesses']])for(let variant=0;variant<3;variant++){
    const frames=[0,1,2].map(stage=>manifest.portraits.find(p=>p.id===start+stage*3+variant));
    assert.equal(frames[0].source,'exec-15265987-6376-4e82-976b-fbb0838b0091.png');
    assert.notEqual(frames[0].source,frames[1].source);
    assert.equal(frames[1].source,frames[2].source);
    assert.equal(frames[2].cell,frames[1].cell+3,sex+' keeps its approved child/adult column');
  }
});

test('approved close-up royal sets keep the correct identity at age boundaries and after reload',()=>{
  const {run}=game();run(`
    for(var [sex,variant,cells] of [
      ['f',33,[380,381,382]],['f',34,[383,384,385]],
      ['m',29,[386,387,388]],['m',30,[389,390,391]],
      ['f',35,[392,393,394]],['f',36,[395,396,397]]
    ]){
      var child=makeKid(harem()[0],sex,'成长套图');child.portraitVariant=variant;var id=child.id;
      for(var [age,stage] of [[0,0],[2,0],[3,1],[11,1],[12,2],[18,2]]){
        child.born=S.turn-age*12;assert.equal(portraitCell(child),cells[stage]);
        save('1');assert.ok(load('1'));child=kidById(id);
        assert.equal(child.portraitVariant,variant);assert.equal(portraitCell(child),cells[stage]);
      }
    }
  `);
  assert.deepEqual(growthManifest.portraits.map(p=>p.id),Array.from({length:12},(_,i)=>380+i));
  assert.deepEqual(petiteManifest.portraits.map(p=>p.id),Array.from({length:6},(_,i)=>392+i));
  const allGrowth=[...growthManifest.portraits,...petiteManifest.portraits];
  for(let offset=0;offset<allGrowth.length;offset+=3){
    const frames=allGrowth.slice(offset,offset+3);
    assert.equal(new Set(frames.map(p=>p.source+':'+p.sex+':'+p.variant)).size,1);
    assert.deepEqual(frames.map(p=>p.stage),[0,1,2]);
    assert.deepEqual(frames.map(p=>p.cell%3),[0,1,2]);
  }
});

test('five brothers have distinct persisted faces shared across sisters and retained on death',()=>{
  const {run}=game();run(`
    var c=harem()[0];S.consorts=[c];S.cands=[];
    var h=c.house={bloc:'army',familyVersion:2,father:{id:'portrait-father',name:'沈文远',age:60,alive:true}};
    for(var i=0;i<5;i++)h[i?'brother'+(i+1):'brother']={name:'沈兄'+i,age:30-i,alive:true};
    initializeOfficialHouse(c,h,[c]);
    var faces=brotherRoles(h).map(role=>portraitCell(h[role]));
    assert.equal(new Set(faces).size,5);assert.ok(FATHER_PORTRAITS.includes(portraitCell(h.father)));
    var sister=makeKin(c,'亲');addConsort(sister,3,'姐妹入宫');
    assert.equal(houseOf(sister),h);assert.deepEqual(brotherRoles(h).map(role=>portraitCell(h[role])),faces);
    var brother=h.brother;officialDeath(c,'brother','边关阵亡','battle');assert.equal(portraitCell(brother),faces[0]);
    save('1');load('1');c=byId(c.id);h=houseOf(c);
    assert.deepEqual(brotherRoles(h).map(role=>portraitCell(h[role])),faces);
    assert.equal(houseOf(byId(sister.id)),h);assert.equal(h.brother.alive,false);
    h.bloc='civil';houseOf(c);assert.deepEqual(brotherRoles(h).map(role=>portraitCell(h[role])),faces);
  `);
});

test('new allocation does not repaint existing consorts, legacy relatives or succession overrides',()=>{
  const {run}=game();run(`
    var c=harem()[0];c.artPortrait=112;assignConsortPortrait(c);assert.equal(portraitCell(c),112);
    for(var type=0;type<4;type++)assert.equal(portraitCell({official:type,seed:7}),40+type);
    var old={age:18,seed:123};assert.equal(emperorPortraitCell(old),12);old.age=50;assert.equal(emperorPortraitCell(old),13);
    assert.ok([312,313].includes(portraitCell('emp')));E().age=50;assert.ok([314,315].includes(portraitCell('emp')));
    E().portraitOverride=302;assert.equal(portraitCell('emp'),302);
    for(var v=26;v<30;v++){var p={sex:'f',portraitVariant:v,born:S.turn-240};assert.equal(childPortraitCell(p),244+v-26);}
    for(var cell=248;cell<268;cell++)assert.ok([...CONSORT_PORTRAITS,...WESTERN_PORTRAITS].includes(cell));
    assert.equal(ALL_CONSORT_PORTRAITS.length,193);
  `);
});

test('royal allocation keeps infant and child faces distinct before repeating a growth set',()=>{
  const {run}=game();run(`
    for(var sex of ['m','f']){
      S.children=[];var count=sex==='f'?33:31;var kids=Array.from({length:count},(_,i)=>makeKid(harem()[0],sex,'皇嗣'+i));
      for(var age of [0,8,20]){kids.forEach(k=>k.born=S.turn-age*12);assert.equal(new Set(kids.map(portraitCell)).size,count);}
    }
  `);
});

test('asset manifest appends 68 unique IDs without touching existing atlas IDs',()=>{
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:68},(_,i)=>248+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.source+':'+p.cell)).size,68);
});
