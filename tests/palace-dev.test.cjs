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
    assert.throws(()=>DEV.applyPatch('kid:'+child.id,{portraitVariant:30}));assert.throws(()=>DEV.applyPatch('consort:'+lady.id,{portraitOverride:PORTRAIT_COUNT}));
    DEV.target='kid:'+child.id;DEV.draft=DEV.clone(child);DEV.gallery();assert.equal(($('#dev-gallery').innerHTML.match(/class="dev-face"/g)||[]).length,30);`);
});
test('age input previews the grown portrait and applies age without the distant confirmation button',()=>{
  const {run}=boot();run(`var child=makeKid(harem()[0],'f','明昭');child.portraitVariant=26;child.portraitOverride=62;DEV.select('kid:'+child.id);var originalBorn=child.born;DEV.previewAge('20');assert.equal(child.born,originalBorn);assert.equal(portraitCell(DEV.draft),244);
    $('#dev-fields').querySelector=()=>({value:'20'});DEV.saveAge();assert.equal(kidAge(child),20);assert.equal(portraitCell(child),244);assert.equal(child.portraitOverride,null);assert.match($('#dev-status').textContent,/年龄已保存/);`);
});
test('calendar jumps age all born-based relatives, save only the debug world and can be rolled back',()=>{
  const {run,storage}=boot();run(`var child=makeKid(harem()[0],'f','明昭');child.portraitVariant=27;var turn=S.turn,month=S.month,age=E().age,ladyAge=harem()[0].age;localStorage.setItem('chengongji_v1_auto','production untouched');
    DEV.jumpTime(20,'year');assert.equal(S.turn,turn+240);assert.equal(S.month,month);assert.equal(E().age,age+20);assert.equal(harem()[0].age,ladyAge+20);assert.equal(kidAge(child),20);assert.equal(portraitCell(child),245);assert.equal(modalOpen,false);
    DEV.restore();assert.equal(S.turn,turn);assert.equal(kidAge(kidById(child.id)),0);DEV.jumpTime(13,'month');assert.equal(S.month,(month+12)%12+1);assert.equal(S.turn,turn+13);`);
  assert.equal(storage.get('chengongji_v1_auto'),'production untouched');
});
test('invalid jumps and storage failures leave the original timeline unchanged',()=>{
  const {run}=boot();run(`var before=JSON.stringify(S);for(var args of [[0,'month'],[-1,'year'],[1.5,'year'],[101,'year'],[1,'day']])assert.throws(()=>DEV.jumpTime(...args));assert.equal(JSON.stringify(S),before);
    var writer=localStorage.setItem;localStorage.setItem=(k,v)=>{if(k===SKEY+'auto')throw Error('quota');writer(k,v);};assert.throws(()=>DEV.jumpTime(1,'year'));assert.equal(JSON.stringify(S),before);`);
});
test('young portrait alternatives have exactly one selected identity and keep the target in sync',()=>{
  const {run}=boot();run(`var child=makeKid(harem()[0],'f','清嘉');child.portraitVariant=26;DEV.select('kid:'+child.id);
    assert.equal($('#dev-target').value,'kid:'+child.id);assert.equal(($('#dev-gallery').innerHTML.match(/aria-pressed="true"/g)||[]).length,1);
    assert.ok($('#dev-gallery').innerHTML.includes('aria-pressed="true" onclick="DEV.face(26)"'));`);
});
test('portrait preview through the real form handles newborn and legacy missing support as a number',()=>{
  const {run}=boot();run(`for(var sex of ['m','f'])for(var age of [0,8,20]){
    var child=makeKid(harem()[0],sex,'测试'+age);child.born=S.turn-age*12;var oldVariant=child.portraitVariant;assert.equal(child.sup,0);delete child.sup;
    DEV.select('kid:'+child.id);var html=$('#dev-fields').innerHTML;assert.match(html,/data-dev-field="sup" data-dev-type="number" type="number"[^>]*value="0"/);
    var inputs=[...html.matchAll(/<input ([^>]+)>/g)].map(([,attributes])=>({dataset:{devField:attributes.match(/data-dev-field="([^"]+)"/)[1],devType:attributes.match(/data-dev-type="([^"]+)"/)[1]},value:attributes.match(/value="([^"]*)"/)?.[1]??'',checked:attributes.includes('checked')}));
    $('#dev-fields').querySelectorAll=()=>inputs;DEV.face(2);DEV.preview();assert.ok(!$('#dev-confirm').disabled);DEV.confirm();
    assert.equal(child.portraitVariant,2);assert.equal(child.sup,0);var id=child.id;load('auto');assert.equal(kidById(id).portraitVariant,2);DEV.restore();assert.equal(kidById(id).portraitVariant,oldVariant);
  }`);
});
