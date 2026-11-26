// js/compat.js fills library methods newer than Chrome 61 for the Xiaohongshu build.
// Here the natives are removed in a fresh context so the fallbacks themselves run.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/compat.js'),'utf8');

function oldEngine(){
  const context=vm.createContext({});
  vm.runInContext(`delete Array.prototype.at;delete String.prototype.at;delete Object.hasOwn;delete Array.prototype.flat;delete Array.prototype.flatMap;
    delete Array.prototype.findLast;delete Array.prototype.findLastIndex;delete Object.fromEntries;delete String.prototype.replaceAll;`,context);
  vm.runInContext(source,context);
  return expr=>JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,context));
}

test('array and string helpers behave like the native methods',()=>{
  const run=oldEngine();
  assert.deepEqual(run(`[[1,2,3].at(-1),[1,2,3].at(0),[1].at(5)===undefined,'宸宫纪'.at(-1),'ab'.at(9)===undefined]`),[3,1,true,'纪',true]);
  assert.deepEqual(run(`[[1,[2,[3]]].flat(),[1,[2,[3]]].flat(2),[1,2].flatMap(x=>[x,x*10]),[1,2].flatMap(x=>x)]`),[[1,2,[3]],[1,2,3],[1,10,2,20],[1,2]]);
  assert.deepEqual(run(`[[1,2,3,4].findLast(x=>x%2),[1,2,3,4].findLastIndex(x=>x>9),[5,6].findLastIndex(x=>x===5)]`),[3,-1,0]);
  assert.deepEqual(run(`['  a '.trimStart(),' a  '.trimEnd()]`),['a ',' a']);
});

test('Object.hasOwn and Object.fromEntries',()=>{
  const run=oldEngine();
  assert.deepEqual(run(`[Object.hasOwn({a:1},'a'),Object.hasOwn({},'toString'),Object.hasOwn(Object.create({a:1}),'a')]`),[true,false,false]);
  assert.deepEqual(run(`Object.fromEntries([['a',1],['b',2]])`),{a:1,b:2});
  assert.deepEqual(run(`Object.fromEntries(new Map([['x',3]]))`),{x:3});
  assert.deepEqual(run(`Object.fromEntries(Object.entries({k:'v'}).map(([k,v])=>[k+k,v]))`),{kk:'v'});
});

test('replaceAll covers strings with regex characters, $ patterns, functions and global regexes',()=>{
  const run=oldEngine();
  assert.deepEqual(run(`['a.b.c'.replaceAll('.','·'),'a+a+'.replaceAll('a+','$&!'),'aaa'.replaceAll('a',(m,i)=>i),'x1y2'.replaceAll(/\\d/g,'#'),'abc'.replaceAll('','-')]`),
    ['a·b·c','a+!a+!','012','x#y#','-a-b-c-']);
  assert.throws(()=>run(`'a'.replaceAll(/a/,'b')`),/global/);
});

test('installed methods are not enumerable and real natives are left alone',()=>{
  const run=oldEngine();
  assert.deepEqual(run(`Object.keys(Array.prototype).concat(Object.keys(String.prototype))`),[]);
  const context=vm.createContext({});const native=vm.runInContext('Array.prototype.at',context);
  vm.runInContext(source,context);assert.equal(vm.runInContext('Array.prototype.at',context),native);
});
