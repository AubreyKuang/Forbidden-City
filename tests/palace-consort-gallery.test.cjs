const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');
const manifest=require('../docs/consort-gallery-sources.json');
const closeups=require('../docs/consort-closeup-sources.json');
const flowers=require('../docs/flower-consort-sources.json');
function game(){const g=boot();g.ctx.assert=assert;g.run('A.newGame();A.start();drain();');return g;}

test('all approved consort designs are reachable without repeats before a pool is exhausted',()=>{
  const {run}=game();run(`
    var pools=[NEW_DOMESTIC_CONSORT_PORTRAITS,WESTERN_PORTRAITS,EASTERN_PORTRAITS,OVERSEAS_PORTRAITS];
    var families=['翰林学士','西域贡女','东瀛贵族','海西贵族'];
    for(var n=0;n<pools.length;n++){
      S.consorts=[];S.cands=[];var faces=[];
      for(var i=0;i<pools[n].length;i++){
        var c=makeGirl({fam:{t:families[n],p:10},age:22});S.consorts.push(c);faces.push(portraitCell(c));
      }
      assert.equal(new Set(faces).size,pools[n].length);
      for(var cell of pools[n])assert.ok(faces.includes(cell));
    }
    for(var cell=316;cell<380;cell++)assert.ok(ALL_CONSORT_PORTRAITS.includes(cell));
  `);
  assert.deepEqual(manifest.portraits.map(p=>p.id),Array.from({length:42},(_,i)=>316+i));
  assert.equal(new Set(manifest.portraits.map(p=>p.source+':'+p.cell)).size,42);
  assert.deepEqual(flowers.portraits.map(p=>p.id),Array.from({length:9},(_,i)=>371+i));
  assert.equal(new Set(flowers.portraits.map(p=>p.source+':'+p.cell)).size,9);
  assert.deepEqual(closeups.portraits.map(p=>p.id),Array.from({length:13},(_,i)=>358+i));
  assert.deepEqual(closeups.portraits.slice(0,5).map(p=>[p.source,p.cell]),
    [0,2,3,4,5].map(cell=>['exec-18ac34e0-90f8-45c1-be2d-1413c18b6aad.png',cell]));
  assert.deepEqual(closeups.portraits.slice(5,9).map(p=>[p.source,p.cell]),
    [0,1,2,3].map(cell=>['exec-c722316b-2d03-47c2-91e6-74784eb0d5cf.png',cell]));
  assert.deepEqual(closeups.portraits.slice(9).map(p=>[p.source,p.cell]),
    [0,1,2,3].map(cell=>['exec-cd8a972e-c7eb-4491-aec9-cbda05b29ab4.png',cell]));
});

test('each foreign envoy retains the same guest and face across refresh, acceptance and reload',()=>{
  const {run}=game();run(`
    for(var origin=0;origin<3;origin++){
      var guest=makeForeignConsort(origin),id=guest.id,face=portraitCell(guest),name=fullName(guest);
      S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:8,guest};
      var ev=monthlyCourtEvent();assert.equal(ev.foreignArrival,true);
      assert.equal(ev.title,FOREIGN_CONSORT_ORIGINS[origin].region+'使臣');
      assert.ok(ev.text.includes(name));assert.equal(ev.por.id,id);
      save('1');assert.ok(load('1'));ev=monthlyCourtEvent();
      assert.equal(ev.por.id,id);assert.equal(portraitCell(ev.por),face);assert.ok(ev.text.includes(name));
      ev.choices[0].f();var accepted=byId(id);
      assert.ok(accepted);assert.equal(portraitCell(accepted),face);assert.equal(hasClan(accepted),false);
      save('1');load('1');assert.equal(portraitCell(byId(id)),face);
    }
  `);
});

test('ordinary and western legacy faces and explicit overrides survive the expanded gallery',()=>{
  const {run}=game();run(`
    var old=makeGirl({fam:{t:'西域贡女',p:10},age:22});old.artPortrait=263;S.consorts.push(old);
    var existing=harem()[0];existing.artPortrait=112;
    var special=makeForeignConsort(1);special.portraitOverride=357;S.consorts.push(special);
    var ids=[old.id,existing.id,special.id];save('1');load('1');
    assert.deepEqual(ids.map(id=>portraitCell(byId(id))),[263,112,357]);
  `);
});
