const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const {runGameScripts}=require('./game-scripts.cjs');

// Same harness as palace-flow: run the whole game script with drawing and storage stubbed.
function boot(seedValue=4242){
  const noop=()=>{};
  const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(o,k)=>o[k]||noop});
  const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,scrollIntoView:noop,remove:noop});
  const elements=new Map(),storage=new Map();
  const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key)},createElement:el,addEventListener:noop};
  const math=Object.create(Math);let seed=seedValue;
  math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,run:code=>vm.runInContext(code,ctx)};
}

test('every consort gets a named father and brother whose office decides her stance, and they persist',()=>{
  const {run}=boot();
  const info=JSON.parse(run(`JSON.stringify(harem().map(c=>({sur:c.sur,office:c.fam.t,house:houseOf(c),stance:stanceOf(c),p:c.fam.p})))`));
  assert.ok(info.length>0);
  for(const c of info){
    assert.ok(c.house.father.name.startsWith(c.sur));
    assert.ok(c.house.brother.name.startsWith(c.sur));
    assert.equal(c.house.father.office,c.office);
    const expected={'内阁首辅':'civil','镇国大将军':'army','皇商':'kin','太医院院判':'dowager'}[c.office];
    if(expected)assert.equal(c.stance,expected);
  }
  const before=run(`JSON.stringify(houseOf(harem()[0]))`);
  run(`save('1');load('1');migrate();`);
  assert.equal(run(`JSON.stringify(houseOf(harem()[0]))`),before);
  assert.match(run(`houseLine(harem()[0])`),/父亲：.*兄长：.*立场：/);
});

test('faction events name the real father or brother and their choices move the court and the consort',()=>{
  const {run}=boot(7);
  run(`const c=harem()[0];c.fam={t:'镇国大将军',p:70};delete c.house;c.favor=60;c.mood=50;S.courtPolicy={};`);
  let ev=null;
  for(let i=0;i<40&&!ev;i++){const e=run(`(()=>{const e=factionEvent();return e&&['边关捷报','边关失利'].includes(e.title)?e:null})()`);if(e)ev=e;}
  assert.ok(ev,'an army event for the general\'s daughter');
  const brother=run(`houseOf(harem()[0]).brother.name`);
  assert.ok(ev.text.includes(brother));
  const army=run(`S.courtPolicy.army||0`),mood=run(`harem()[0].mood`);
  ev.choices[0].f();
  assert.notEqual(run(`S.courtPolicy.army||0`),army);
  assert.notEqual(run(`harem()[0].mood`),mood);
});

test('adopting one bloc pleases consorts of that stance and stings its rival bloc',()=>{
  const {run}=boot(11);
  run(`const [a,b]=harem();a.fam={t:'内阁首辅',p:60};b.fam={t:'皇商',p:40};delete a.house;delete b.house;a.mood=b.mood=50;`);
  run(`courtEcho('civil')`);
  assert.equal(run(`harem()[0].mood`),54);
  assert.equal(run(`harem()[1].mood`),47);
});

test('the relationship graph shows fathers, consorts and close or hostile ties',()=>{
  const {run}=boot(13);
  run(`const [a,b]=harem();relAdd(a,b,-60);`);
  const svg=run(`familyGraphSVG()`);
  const father=run(`houseOf(harem()[0]).father.name.slice(0,4)`);
  assert.match(svg,/<svg class="family-graph"/);
  assert.ok(svg.includes(father));
  assert.match(svg,/stroke="#b8473c"/);
  assert.match(svg,/A\.go\('consort'/);
  assert.match(svg,/graph-kin-person[\s\S]*data-portrait-cell="4[0-3]"/);
  assert.match(svg,/graph-consort[\s\S]*data-portrait-cell=/);
  run(`A.go('family')`);
  assert.match(run(`$('#panel').innerHTML`),/关系图/);
});

test('four brothers keep distinct faces as they age, on promotion and after loading',()=>{
  const {run}=boot(15);
  const cells=JSON.parse(run(`JSON.stringify((()=>{
    const [mother,other]=harem();
    const sons=['承安','承明','承昭','承翊'].map(name=>makeKid(mother,'m',name));
    sons[0].foster=other.id;
    const stages=[0,8,18].map(age=>{
      sons.forEach(k=>{k.born=S.turn-age*12});
      return sons.map(portraitCell);
    });
    S.heir=sons[0].id;
    mother.alive=false;
    const graph=familyGraphSVG();
    assert.match(graph,/承安/);
    assert.match(graph,/抚养/);
    save('1');load('1');migrate();
    return {stages,loaded:S.children.map(portraitCell)};
  })())`));
  assert.deepEqual(cells.stages,[[28,29,30,31],[32,33,34,35],[36,37,38,39]]);
  assert.deepEqual(cells.loaded,cells.stages[2]);
});

test('version 1 saves load, rewinding restores a new-year snapshot, and absence piles up memorials',()=>{
  const {run,storage}=boot(17);
  run(`save('2')`);
  const key=run(`SKEY+'2'`),old=JSON.parse(storage.get(key));
  old.saveVersion=1;delete old.savedAt;for(const c of old.consorts)delete c.house;
  storage.set(key,JSON.stringify(old));
  assert.equal(run(`load('2')`),true);
  run(`migrate()`);
  assert.ok(run(`!!houseOf(harem()[0]).father.name`));
  storage.set(key,JSON.stringify({...old,saveVersion:9}));
  assert.equal(run(`load('2')`),false);
  run(`snapshotYear()`);
  const turn=run(`S.turn`);
  run(`for(let i=0;i<3;i++){A.endMonth();drain();}`);
  assert.ok(run(`S.turn`)>turn);
  run(`A.rewind(SaveManager.snapshots(localStorage,SKEY+'auto').at(-1).index)`);
  assert.equal(run(`S.turn`),turn);
  run(`S.savedAt=Date.now()-5*36e5;offlineMemorials()`);
  assert.equal(run(`S.flags.memorials`),3);
  run(`A.endMonth();drain();`);
  assert.equal(run(`S.flags.memorials`),0);
});
