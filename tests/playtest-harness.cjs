const vm=require('node:vm');
const {runGameScripts}=require('./game-scripts.cjs');
function boot(seed=202,storage=new Map()){
  const noop=()=>{},messages=[];
  const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(o,k)=>o[k]||noop});
  const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:d=>{if(d.textContent)messages.push(d.textContent);},scrollIntoView:noop,remove:noop,querySelectorAll:()=>[]});
  const elements=new Map(),rolls=[];
  const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key);},createElement:el,addEventListener:noop};
  const math=Object.create(Math);math.random=()=>rolls.length?rolls.shift():((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,confirm:()=>true});
  runGameScripts(ctx);
  const run=s=>vm.runInContext(s,ctx);
  run(`var drain=()=>{for(var n=0;modalOpen&&n<150;n++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}if(modalOpen)throw Error('Stuck modal');};`);
  return {ctx,run,storage,messages,force:(...values)=>rolls.push(...values)};
}
module.exports={boot};
