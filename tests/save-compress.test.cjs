// js/save-compress.js keeps long saves inside small host stores (Xiaohongshu: 10MB total).
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/save-compress.js'),'utf8')+';this.P=PalaceCompress;',context);
const P=context.P;

test('round trips edge cases and random text byte for byte, as plain ASCII',()=>{
  let seed=99;const rnd=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n);
  const cases=['','a','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','abababababababab','宸宫纪宸宫纪宸宫纪','😀😀x😀','\u0000ÿĀ￿','"\\\n'];
  for(let n=0;n<400;n++){let s='';const len=rnd(600);for(let i=0;i<len;i++){const r=rnd(100);s+=r<40?'abc"{}:,'[rnd(8)]:r<75?String.fromCharCode(0x4e00+rnd(40)):r<90?String.fromCharCode(rnd(65536)):'\u0000\\'[rnd(2)];}cases.push(s);}
  for(const text of cases){
    const packed=P.compress(text);
    assert.match(packed,/^z1:[A-Za-z0-9+/]*$/);
    assert.equal(P.decompress(packed),text);
    assert.equal(JSON.parse(JSON.stringify(packed)),packed);
  }
});

test('a real save compresses about four times and survives the trip',()=>{
  const {boot}=require('./playtest-harness.cjs');
  const b=boot(41);b.run(`A.start();drain();for(let i=0;i<60;i++){A.endMonth();drain();}`);
  const raw=b.run('JSON.stringify(PalaceActions.payload())');
  const packed=P.compress(raw);
  assert.equal(P.decompress(packed),raw);
  assert.ok(packed.length*3<Buffer.byteLength(raw),`${packed.length} vs ${Buffer.byteLength(raw)}`);
});

test('non-compressed, truncated or invalid characters raise an error',()=>{
  const packed=P.compress('人物纪事'.repeat(200));
  assert.throws(()=>P.decompress('plain text'));
  assert.throws(()=>P.decompress(packed.slice(0,packed.length/2)));
  assert.throws(()=>P.decompress(packed.slice(0,10)+'!'+packed.slice(11)));
});
