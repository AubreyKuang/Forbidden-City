const fs=require('node:fs'),vm=require('node:vm');
const {runGameScripts}=require('./game-scripts.cjs');
const root=process.env.PALACE_PLAYTEST_DIR||'/tmp/palace-playtest-results';
fs.mkdirSync(root+'/runs',{recursive:true});
function boot(seed,mode){
 const noop=()=>{};const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(o,k)=>o[k]||noop});
 const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,scrollIntoView:noop,remove:noop,focus:noop,querySelectorAll:()=>[]});
 const elements=new Map(),storage=new Map();
 const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key)},createElement:el,addEventListener:noop};
 const math=Object.create(Math);let rs=seed;
 math.random=()=>((rs=(Math.imul(rs,1664525)+1013904223)>>>0)/4294967296);
 const ctx=vm.createContext({Math:math,btoa,atob,confirm:()=>true,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,mode,seed});
 runGameScripts(ctx);
 vm.runInContext(`
 var events=[],months=[],actions=[],errors=[],phase='setup',act='setup',prng=mulberry32(seed^0xaabbccdd),currentRecord=null;
 var originalOpen=openModal;openModal=function(ev){originalOpen(ev);currentRecord={turn:S?.turn,date:S?dateStr():null,phase,act,title:ev.title,text:ev.text,choices:ev.choices.map(c=>c.t),actors:eventPortraits(ev).filter(x=>typeof x==='object').map(c=>({id:c.id,name:c.sex?c.name:fullName(c),trait:c.trait,t2:c.t2,age:c.sex?kidAge(c):c.age,aff:c.aff,favor:c.favor,mood:c.mood,xin:c.sex?null:xinOf(c),alive:c.alive,gone:c.gone,cold:c.cold,temple:!!c.templeStay,rank:c.rank}))};events.push(currentRecord)};
 var originalRes=showRes;showRes=function(res){if(currentRecord)currentRecord.result=typeof res==='string'?res:res.text;originalRes(res)};
 function drain(){for(let n=0;modalOpen&&n<150;n++){
   if($('#mbox').innerHTML.includes('onclick="nextEv()"')){nextEv();continue;}
   if(!curEv)throw Error('modal without event');
   const opts=curEv.choices.map((c,i)=>({c,i})).filter(({c})=>!c.cond||c.cond());
   if(!opts.length)throw Error('no enabled choices: '+curEv.title);
   let chosen;
   if(curEv.title==='登基')chosen=opts.find(x=>x.i===1);
   else if(S.over)chosen=opts.find(x=>/翻阅起居注/.test(x.c.t))||opts.at(-1);
   else if(curEv.title==='三年大选')chosen=opts.find(x=>/今年免了/.test(x.c.t));
   else if(curEv.title==='留牌子')chosen=opts.find(x=>x.c.t==='封为贵人')||opts[0];
   else if(mode==='random'||mode==='explorer')chosen=opts[Math.floor(prng()*opts.length)];
   else chosen=opts.find(x=>!(/处死|赐死|打入冷宫|废为|杖毙|重杖|斩|不必|训斥|重新开局|稍后再议|自尽/.test(x.c.t)))||opts.at(-1);
   currentRecord.choice=chosen.c.t;if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(chosen.i);
 }if(modalOpen)throw Error('modal loop exceeds 150');}
 function call(label,fn){act=label;const before=E().energy;fn();drain();actions.push({turn:S.turn,label,spent:before-E().energy});}
 function roster(){return S.consorts.map(c=>({id:c.id,name:fullName(c),trait:c.trait,t2:c.t2,age:c.age,alive:c.alive,gone:c.gone,cold:c.cold,temple:!!c.templeStay,aff:c.aff,favor:c.favor,mood:c.mood,xin:xinOf(c),kids:S.children.filter(k=>k.mom===c.id).length}))}
 A.start();drain();
 for(const id of S.cands.slice(0,3).map(c=>c.id)){A.xxTake(id);drain();}A.xxEnd();
 var initial=roster();
 function play(limit){for(let i=0;i<limit&&!S.over;i++){
  phase='active';const began=S.turn,evStart=events.length;
  try{
   if(mode!=='skip'){
    call('court',()=>A.court());
    for(let n=0;n<8&&E().energy>0&&!S.over;n++){
     const before=E().energy,hs=harem(),cs=hs.filter(c=>!c.preg),kids=kidsAlive().filter(k=>!k.pendingName&&!k.jailed),c=hs[Math.floor(prng()*hs.length)];
     if(mode==='explorer')call('out',()=>A.out(['garden','city','hunt','temple','spa'][Math.floor(prng()*5)]));
     else if(mode==='affection'){
      const target=hs.find(c=>c.id===2)||hs[0];
      if(!target)call('garden',()=>A.out('garden'));
      else if(n===0&&!target.preg)call('night',()=>A.night(target.id));
      else if(E().health<65)call('spa',()=>A.out('spa'));
      else call('chat',()=>A.chat(target.id));
     }else{
      const roll=prng();
      if(E().health<55)call('spa',()=>A.out('spa'));
      else if(roll<.25&&cs.length)call('night',()=>A.night(cs[Math.floor(prng()*cs.length)].id));
      else if(roll<.55&&c)call('chat',()=>A.chat(c.id));
      else if(roll<.7&&kids.length)call('kidVisit',()=>A.kidVisit(kids[Math.floor(prng()*kids.length)].id));
      else if(roll<.85)call('garden',()=>A.out('garden'));
      else call('greet',()=>A.greet());
     }
     if(E().energy===before)break;
    }
   }
   if(S.over)break;
   phase='monthly';act='endMonth';const monthlyStart=events.length;A.endMonth();drain();
   const monthly=events.slice(monthlyStart);
   months.push({turn:S.turn,events:monthly.length,titles:monthly.map(e=>e.title),choiceEvents:monthly.filter(e=>e.choices.length>1).length,allEvents:events.length-evStart,health:E().health,treasury:E().treasury,people:E().people,prestige:E().prestige,roster:roster(),children: kidsAlive().map(k=>({id:k.id,name:k.name,age:kidAge(k),sex:k.sex,lit:k.lit,mar:k.mar,vir:k.vir,love:k.love}))});
   if(S.turn!==began+1&&!S.over)throw Error('turn did not advance');
   for(const [k,v] of Object.entries(E()))if(typeof v==='number'&&!Number.isFinite(v))throw Error('nonfinite emperor '+k);
  }catch(e){errors.push({turn:S.turn,act,message:e.message,stack:e.stack});break;}
 }return {seed,mode,initial,months,events,actions,errors,over:S.over,turn:S.turn,finalEmp:E(),finalRoster:roster(),finalLog:S.log};}
 `,ctx);
 return ctx;
}
if(require.main===module){
 const summaries=[];
 for(const mode of ['balanced','affection','explorer','skip','random'])for(const seed of [101,202,303,404]){
  const ctx=boot(seed,mode);const r=vm.runInContext(`play(${Number(process.env.PALACE_MONTHS)||120})`,ctx,{timeout:120000});
  fs.writeFileSync(root+'/runs/'+mode+'-'+seed+'.json',JSON.stringify(r,null,2));
  const m=r.months,ev=r.events.filter(e=>e.phase==='monthly'),counts={};for(const e of ev)counts[e.title]=(counts[e.title]||0)+1;
  const summary={mode,seed,months:m.length,turn:r.turn,over:r.over,errors:r.errors,events:ev.length,unique:new Set(ev.map(e=>e.title)).size,mean:m.reduce((s,x)=>s+x.events,0)/(m.length||1),zero:m.filter(x=>!x.events).length,max:Math.max(...m.map(x=>x.events)),choiceEvents:m.reduce((s,x)=>s+x.choiceEvents,0),treasury:r.finalEmp.treasury,health:r.finalEmp.health,people:r.finalEmp.people,consorts:r.finalRoster.length,children:m.at(-1)?.children.length,top:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8)};
  summaries.push(summary);console.log(JSON.stringify(summary));fs.writeFileSync(root+'/summary.json',JSON.stringify(summaries,null,2));
 }
}
module.exports={boot};
