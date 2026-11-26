// Handlers live in data-on* attributes and run through js/inline-actions.js, so a strict
// CSP (no inline script, no eval) still lets every button work.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot}=require('./playtest-harness.cjs');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/inline-actions.js'),'utf8');

function sandbox(globals={}){
  const context=vm.createContext({console,...globals});
  vm.runInContext(source,context);
  return {context,api:vm.runInContext('PalaceInlineActions',context)};
}
function fakeEvent(type='click'){
  const e={type,defaultPrevented:false,cancelBubble:false,preventDefault(){e.defaultPrevented=true;},stopPropagation(){e.cancelBubble=true;}};
  return e;
}

test('dotted global calls receive literal arguments of every kind',()=>{
  const calls=[];
  const {api}=sandbox({A:{go:(...a)=>calls.push(['go',...a])},openX:(...a)=>calls.push(['openX',...a])});
  api.run(`A.go('harem')`,null,fakeEvent());
  api.run(`openX(3,'a',true,null,false,undefined,-1.5,"双引号",'it\\'s')`,null,fakeEvent());
  assert.deepEqual(calls,[['go','harem'],['openX',3,'a',true,null,false,undefined,-1.5,'双引号',"it's"]]);
});

test('const and let globals such as A, UI and S are reachable although they are not window properties',()=>{
  const {context,api}=sandbox();
  vm.runInContext(`const A={seen:[],go(v,id){this.seen.push([v,id]);}};const UI={logF:'all'};let S={turn:3};function render(){UI.rendered=true;}`,context);
  api.run(`A.go('consort',7);UI.logF='big';render()`,null,fakeEvent());
  assert.equal(JSON.stringify(vm.runInContext('A.seen',context)),JSON.stringify([['consort',7]]));
  assert.equal(vm.runInContext('UI.logF',context),'big');
  assert.equal(vm.runInContext('UI.rendered',context),true);
  assert.equal(api.resolve('S').value.turn,3);
});

test('this, event, nested calls and multiple statements behave like the inline handlers did',()=>{
  const log=[];
  const {api}=sandbox({A:{chronicleSearch:k=>log.push(['search',k]),familyVisibilityToggle:k=>log.push(['toggle',k])},
    meetConsort:c=>log.push(['meet',c]),byId:id=>({id}),Number,
    document:{getElementById:id=>({value:id==='amount'?'12':''})},compareChronicleOccasion:d=>log.push(['compare',d.open])});
  const el={value:'7',checked:true,open:true,classList:{list:[],add(x){this.list.push(x);}}};
  const submit=fakeEvent('submit');
  api.run(`event.preventDefault();A.chronicleSearch('reign')`,el,submit);
  assert.equal(submit.defaultPrevented,true);
  const click=fakeEvent();
  api.run(`event.preventDefault();event.stopPropagation();A.familyVisibilityToggle("hide:\\u5bab")`,el,click);
  assert.equal(click.cancelBubble,true);
  api.run(`meetConsort(byId(4))`,el,fakeEvent());
  api.run(`compareChronicleOccasion(this)`,el,fakeEvent('toggle'));
  api.run(`this.classList.add('event-illustration-loaded')`,el,fakeEvent('load'));
  assert.deepEqual(el.classList.list,['event-illustration-loaded']);
  const r=api.run(`Number(document.getElementById('amount').value)`,el,fakeEvent());
  assert.equal(r.returned,false);
  assert.deepEqual(log,[['search','reign'],['toggle','hide:宫'],['meet',{id:4}],['compare',true]]);
});

test('member assignment uses this properties, and return false is reported',()=>{
  const {context,api}=sandbox();
  vm.runInContext(`const UI={};`,context);
  api.run(`UI.mapBriefOpen=this.open`,{open:true},fakeEvent('toggle'));
  assert.equal(vm.runInContext('UI.mapBriefOpen',context),true);
  const r=api.run(`return false`,null,fakeEvent());
  assert.equal(r.returned,true);assert.equal(r.value,false);
  const empty=api.run(`;;`,null,fakeEvent());assert.equal(empty.returned,false);assert.equal(empty.value,undefined);
});

test('code that is not a plain handler is refused before it runs',()=>{
  const {api}=sandbox({A:{x(){},key:'constructor'},S:1});
  for(const bad of [
    `()=>A.x()`,`eval('1')`,`Function('return 1')()`,`new A.x()`,`A.x.constructor('return 1')()`,`A['__proto__']`,
    `S=null`,`A.x()==1`,`A.x()?1:2`,`a+b`,`\`tpl\``,`window.open('x')`,`setTimeout('A.x()')`,`A.x(`,`'open`,`A..x()`,
    `typeof A`,`A.x();;A.x() A.x()`,`globalThis.A`,`A.prototype`
  ])assert.throws(()=>api.parse(bad),e=>e.name==='SyntaxError',bad);
  // Values reached at run time cannot step into the constructor chain either.
  assert.throws(()=>api.parse(`A.x['constructor']`),e=>e.name==='SyntaxError');
  assert.throws(()=>api.run(`A.x[A.key]`,null,fakeEvent()),e=>e.name==='TypeError');
  assert.throws(()=>api.run(`missingFunction()`,null,fakeEvent()),e=>e.name==='ReferenceError');
});

test('delegation runs handlers from the target outward and honours stopPropagation',()=>{
  const listeners={};
  const doc={addEventListener:(type,fn,capture)=>{listeners[type+(capture?':capture':'')]=fn;}};
  const order=[];
  const {api}=sandbox({document:doc,A:{inner:()=>order.push('inner'),outer:()=>order.push('outer'),stop:()=>order.push('stop')}});
  assert.ok(listeners.click&&listeners.submit&&listeners['toggle:capture']&&listeners['load:capture']);
  const node=(attrs,parent)=>({nodeType:1,parentNode:parent,getAttribute:k=>attrs[k]??null,hasAttribute:k=>k in attrs});
  const outer=node({'data-onclick':'A.outer()'},null),inner=node({'data-onclick':'A.inner()'},outer);
  const ev=Object.assign(fakeEvent(),{target:inner,composedPath:()=>[inner,outer,doc]});
  listeners.click(ev);
  assert.deepEqual(order,['inner','outer']);
  order.length=0;
  const stopper=node({'data-onclick':'event.stopPropagation();A.stop()'},outer);
  listeners.click(Object.assign(fakeEvent(),{target:stopper,composedPath(){return [stopper,outer];}}));
  assert.deepEqual(order,['stop']);
  // A broken handler is reported and never navigates a form away.
  const form=node({'data-onsubmit':'nope('},null);
  const submit=fakeEvent('submit');submit.target=form;submit.composedPath=()=>[form];
  const errors=[];const saved=console.error;console.error=e=>errors.push(e);
  try{listeners.submit(submit);}finally{console.error=saved;}
  // (reportError does not exist in this sandbox, so the error goes to console.error.)
  assert.equal(submit.defaultPrevented,true);assert.equal(errors.length,1);
  assert.equal(api.install(doc),false,'installs once');
});

// ---- Every handler the game can write ----------------------------------------------
const decode=s=>s.replace(/&(quot|#39|amp|lt|gt|#(\d+));/g,(m,name,num)=>num?String.fromCharCode(+num):({quot:'"','#39':"'",amp:'&',lt:'<',gt:'>'})[name]);
function sourceTemplates(){
  const files=fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f).concat(['index.html','dev.html']);
  const out=[];
  for(const file of files){
    const src=fs.readFileSync(path.join(root,file),'utf8');
    const re=/data-on([a-z]+)=(\\?)"/g;let m;
    while((m=re.exec(src))){
      let i=re.lastIndex,expr='';
      while(i<src.length){
        if(src[i]==='$'&&src[i+1]==='{'){let d=0,j=i+1;do{if(src[j]==='{')d++;else if(src[j]==='}')d--;j++;}while(d>0&&j<src.length);expr+=src.slice(i,j);i=j;continue;}
        if(m[2]?src[i]==='\\'&&src[i+1]==='"':src[i]==='"')break;
        expr+=src[i++];
      }
      out.push({file,line:src.slice(0,m.index).split('\n').length,event:m[1],expr});
    }
  }
  return out;
}
// Template holes become sample values; a hole after a dot names a method.
function samples(expr){
  const holes=/\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
  return [expr.replace(holes,(h,o,s)=>s[o-1]==='.'?'go':'1'),expr.replace(holes,(h,o,s)=>s[o-1]==='.'?'go':''),expr.replace(holes,(h,o,s)=>s[o-1]==='.'?'go':'x')];
}

test('every handler template in the source parses (dynamic ones are checked at run time below)',()=>{
  const {api}=sandbox(),templates=sourceTemplates();
  assert.ok(templates.length>=570,'expected the full handler set, found '+templates.length);
  const dynamic=[],failed=[];
  for(const t of templates){
    if(/^\$\{[\s\S]*\}$/.test(t.expr.trim())&&!/\}[^}]*\$\{/.test(t.expr)){dynamic.push(t);continue;}
    const ok=samples(decode(t.expr.replace(/\\'/g,"'").replace(/\\"/g,'"'))).some(s=>{try{api.parse(s);return true;}catch{return false;}});
    if(!ok)failed.push(`${t.file}:${t.line} ${t.expr}`);
  }
  assert.deepEqual(failed,[]);
  assert.ok(dynamic.length<=12,'only a few handlers are built entirely at run time');
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script defer src="([^"]+)"/)[1].split('?')[0],'./js/inline-actions.js','delegation loads before any game script');
});

test('no inline event attribute or javascript: URL is left in the game source',()=>{
  const files=fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f).concat(['index.html','dev.html']);
  const left=[];
  for(const file of files){
    const src=fs.readFileSync(path.join(root,file),'utf8');
    for(const m of src.matchAll(/(?<![\w-])on[a-z]+=\\?["']|javascript:/g))left.push(file+': '+src.slice(m.index,m.index+40));
  }
  assert.deepEqual(left,[]);
});

function collectHandlers(b,seen){
  for(const key of ['#panel','#mbox','#menu','#top','#toast']){
    const html=b.run(`$('${key}').innerHTML`)||'';
    for(const m of String(html).matchAll(/data-on([a-z]+)="([^"]*)"/g)){seen.add(m[1]+' '+decode(m[2]));}
  }
}
// Walk the parsed program: every name resolves and every dotted call target is a function.
const CHECK=`(function(src){
  var program=PalaceInlineActions.parse(src),problems=[];
  function chain(n){if(n.k==='id')return n.v==='this'||n.v==='event'?null:[n.v];if(n.k==='get'&&n.p.k==='lit'){var c=chain(n.o);return c&&c.concat(n.p.v);}return null;}
  function look(parts){var r=PalaceInlineActions.resolve(parts[0]);if(!r.found)return {missing:parts[0]};var v=r.value;for(var i=1;i<parts.length;i++){if(v==null)return {missing:parts.slice(0,i+1).join('.')};v=v[parts[i]];}return {value:v};}
  function visit(n){if(!n||typeof n!=='object')return;
    if(n.k==='id'&&n.v!=='this'&&n.v!=='event'&&!PalaceInlineActions.resolve(n.v).found)problems.push('unknown '+n.v);
    if(n.k==='call'){var c=chain(n.f);if(c&&(c[0]==='document'||c[0]==='location'))c=null;if(c){var r=look(c);if(r.missing)problems.push('unknown '+r.missing);else if(typeof r.value!=='function')problems.push(c.join('.')+' is not a function');}}
    for(var k in n)if(n[k]&&typeof n[k]==='object')Array.isArray(n[k])?n[k].forEach(visit):visit(n[k]);}
  program.forEach(visit);return problems;})`;

test('handlers rendered during long random reigns all parse and point at real functions',()=>{
  const seen=new Set(),problems=[];
  const views=['map','home','government','harem','cards','xx','kids','family','out','log','sys','residences','officials'];
  for(const seed of [202,9137,44021]){
    const b=boot(seed);let prng=seed;const pick=n=>((prng=(Math.imul(prng,1103515245)+12345)>>>0)%n);
    b.run(`var choiceRng=${seed};drain=function(){for(var n=0;modalOpen&&n<150;n++){if(modalResult){nextEv();continue;}var opts=curEv.choices.map(function(c,i){return {c:c,i:i};}).filter(function(x){return !x.c.cond||x.c.cond();});choiceRng=(Math.imul(choiceRng,1664525)+1013904223)>>>0;var o=opts.find(function(x){return /重新开局/.test(x.c.t)===false;})&&opts.filter(function(x){return !/重新开局/.test(x.c.t);});o=o&&o.length?o:opts;var chosen=o[choiceRng%o.length];if(curEv.input)$('#minput').value=curEv.input.def||'安';choose(chosen.i);}};`);
    b.run(`render()`);collectHandlers(b,seen);
    b.run(`A.newGame();render()`);collectHandlers(b,seen);
    b.run(`A.start();drain();for(const id of S.cands.slice(0,3).map(c=>c.id)){A.xxTake(id);drain();}A.xxEnd();drain();`);
    for(let month=0;month<90&&!b.run('S.over');month++){
      for(const view of views){try{b.run(`A.go('${view}');drain()`);collectHandlers(b,seen);}catch{/* a view may need state the reign lacks */}}
      const people=b.run(`JSON.stringify({c:harem().slice(0,4).map(c=>c.id),k:S.children.slice(-3).map(k=>k.id),p:(typeof PLACES!=='undefined'?PLACES:[]).map(p=>p.id)})`);
      const {c,k,p}=JSON.parse(people);
      for(const id of c){try{b.run(`A.go('consort',${id});drain()`);collectHandlers(b,seen);}catch{}}
      for(const id of k){try{b.run(`A.go('kid',${id});drain()`);collectHandlers(b,seen);}catch{}}
      if(p.length){try{b.run(`A.go('place','${p[pick(p.length)]}');drain()`);collectHandlers(b,seen);}catch{}}
      try{b.run(`A.endMonth();drain()`);}catch(e){problems.push('reign stalled: '+e.message);break;}
      collectHandlers(b,seen);
    }
    for(const entry of seen){
      const [event,...rest]=entry.split(' ');const src=rest.join(' ');
      try{const found=b.run(`${CHECK}(${JSON.stringify(src)})`);for(const p of found)problems.push(`${event}: ${src} -> ${p}`);}
      catch(e){problems.push(`${event}: ${src} -> ${e.message}`);}
    }
  }
  assert.ok(seen.size>400,'expected a broad sample of rendered handlers, saw '+seen.size);
  assert.deepEqual([...new Set(problems)],[]);
});
