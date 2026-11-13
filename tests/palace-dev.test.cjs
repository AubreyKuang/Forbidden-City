const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {read,runGameScripts}=require('./game-scripts.cjs');
function boot(){
  const noop=()=>{},ctx2d=new Proxy({measureText:()=>({width:100})},{get:(o,k)=>o[k]||noop});
  const el=()=>({hidden:true,style:{},value:'',innerHTML:'',textContent:'',getContext:()=>ctx2d,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,querySelectorAll:()=>[],scrollIntoView:noop,remove:noop});
  const elements=new Map(),storage=new Map();
  const document={body:el(),querySelector:k=>{if(k==='meta[name="palace-dev"]')return {content:'true'};if(!elements.has(k))elements.set(k,el());return elements.get(k)},createElement:el,addEventListener:noop};
  let seed=14234;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,Date});
  runGameScripts(ctx);vm.runInContext(read('js/dev-tools.js'),ctx);
  const run=s=>vm.runInContext(s,ctx);
  run(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()))}};A.newGame();A.start();drain();`);
  return {run,storage,ctx};
}
test('dev entry shares every production module and adds only its own editor',()=>{
  const sources=html=>[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]);
  const prod=sources(read('index.html')),dev=sources(read('dev.html'));
  assert.deepEqual(dev.slice(0,-1),prod);assert.match(dev.at(-1),/dev-tools.js/);assert.doesNotMatch(read('index.html'),/dev-tools/);
});
test('dev saves are isolated and importing production creates a copy',()=>{
  const {run,storage}=boot();run(`assert.equal(SKEY,'chengongji_dev_v1_');var production=JSON.stringify(S);localStorage.setItem('chengongji_v1_auto',production);DEV.copyProduction();DEV.applyPatch('emp',{treasury:99999});`);
  assert.equal(storage.get('chengongji_v1_auto'),run('production'));
  assert.equal(JSON.parse(storage.get('chengongji_dev_v1_auto')).emp.treasury,99999);
});
test('age and stat edits persist and rollback restores the exact prior child age',()=>{
  const {run}=boot();run(`var child=makeKid(harem()[0],'m','承安');child.born=S.turn-125;var oldBorn=child.born,id=child.id;
    DEV.applyPatch('kid:'+id,{age:20,lit:99,mar:85,love:77});assert.equal(kidAge(child),20);assert.equal((S.turn-child.born)%12,5);assert.equal(child.lit,99);
    A.load('auto');drain();assert.equal(kidAge(kidById(id)),20);DEV.restore();assert.equal(kidById(id).born,oldBorn);`);
});
test('portrait selection persists and child variants continue to grow with age',()=>{
  const {run}=boot();run(`var lady=harem()[0],child=makeKid(lady,'f','明昭');child.born=S.turn-96;
    DEV.applyPatch('consort:'+lady.id,{portraitOverride:24});assert.equal(portraitCell(lady),24);
    DEV.applyPatch('kid:'+child.id,{portraitVariant:8});var youngCell=portraitCell(child);DEV.applyPatch('kid:'+child.id,{age:18});assert.notEqual(portraitCell(child),youngCell);var adultCell=portraitCell(child),id=child.id,ladyId=lady.id;
    save('auto');A.load('auto');drain();assert.equal(portraitCell(byId(ladyId)),24);assert.equal(portraitCell(kidById(id)),adultCell);
    DEV.applyPatch('consort:'+ladyId,{portraitOverride:null});assert.notEqual(portraitCell(byId(ladyId)),24);`);
});
test('invalid data and a live event leave the world unchanged',()=>{
  const {run}=boot();run(`var child=makeKid(harem()[0],'m','承安'),id=child.id,before=JSON.stringify(S);
    for(const patch of [{age:-1},{age:1.5},{lit:101},{mom:999999},{id:999},{sex:'f'},{born:S.turn+1}])assert.throws(()=>DEV.applyPatch('kid:'+id,patch));
    assert.throws(()=>DEV.applyPatch('emp',JSON.parse('{"__proto__":{"polluted":true}}')));
    assert.equal(JSON.stringify(S),before);pushEv({title:'待处理',choices:[{t:'继续'}]});assert.throws(()=>DEV.applyPatch('emp',{treasury:1}));choose(0);drain();`);
});
test('full world edits accept nested flags and reject duplicate identities',()=>{
  const {run}=boot();run(`var world=DEV.clone(S);world.flags.peek=100;world.emp.treasury=9000;DEV.applyPatch('world',world);assert.equal(S.flags.peek,100);assert.equal(E().treasury,9000);
    world=DEV.clone(S);world.emp={};assert.throws(()=>DEV.applyPatch('world',world));
    world=DEV.clone(S);world.consorts[1].id=world.consorts[0].id;assert.throws(()=>DEV.applyPatch('world',world));
    assert.equal(new Set(S.consorts.map(c=>c.id)).size,S.consorts.length);`);
});
test('new portrait ranges are selectable and reject cells beyond the final atlas',()=>{
  const {run}=boot();run(`var lady=harem()[0],child=makeKid(lady,'f','明昭');
    DEV.applyPatch('consort:'+lady.id,{portraitOverride:215});assert.equal(portraitCell(lady),215);
    DEV.applyPatch('kid:'+child.id,{portraitVariant:25});var babyFace=portraitCell(child);DEV.applyPatch('kid:'+child.id,{age:20});assert.notEqual(portraitCell(child),babyFace);assert.equal(portraitCell(child),239);
    assert.throws(()=>DEV.applyPatch('kid:'+child.id,{portraitVariant:26}));assert.throws(()=>DEV.applyPatch('consort:'+lady.id,{portraitOverride:240}));
    DEV.target='kid:'+child.id;DEV.draft=DEV.clone(child);DEV.gallery();assert.equal(($('#dev-gallery').innerHTML.match(/class="dev-face"/g)||[]).length,26);`);
});
