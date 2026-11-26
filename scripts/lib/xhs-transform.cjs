#!/usr/bin/env node
/* JS / CSS lowering for the Xiaohongshu mini-tool build (called by scripts/build-xhs.py).

   node scripts/lib/xhs-transform.cjs job.json

   job = {tools, js:[{src,out}], css:[{src,out}], hasOut}
   tools is a folder with node_modules for esbuild, lightningcss and acorn, installed outside
   the repository (see build-xhs.py). Nothing here is shipped in the package.

   JS:  esbuild target chrome61 (ES2017 syntax), minified; then acorn parses the result as
        ECMAScript 2017, so newer syntax or regex features fail the build.
   CSS: lightningcss target Chrome 61, then a Chrome-61 baseline pass:
        - :is(a,b) X and :not(a,b) are expanded into plain selectors.
        - logical properties become left/right/top/bottom (the game is left-to-right).
        - max() / min() / clamp() / env() / dvh values: the base rule gets a static fallback,
          and the original declaration moves into an @supports block right after it.
        - gap also writes grid-gap (Chrome 61 grids); flex containers get margin fallbacks
          under html.no-flexgap, which js/xhs-compat-ui.js sets after a layout test.
        - A:has(X) also matches A.xhs-has-N; js/xhs-compat-ui.js keeps those classes when
          :has() is not supported. The patterns are written to hasOut. */
const fs=require('fs'),path=require('path');
const job=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const req=name=>require(path.join(job.tools,'node_modules',name));
const esbuild=req('esbuild'),acorn=req('acorn'),lightning=req('lightningcss');
const report={js:[],css:[],urlsRemoved:0,has:[]};

// ---------------------------------------------------------------- JS
// (runs after the CSS pass, which writes the :has() pattern file that is transpiled too)
function transpileJs(){for(const {src,out} of job.js||[]){
  let code=fs.readFileSync(src,'utf8');
  // Source notes (wikisource etc.) are data only and never rendered as links; drop them
  // so no external address ships in the package.
  code=code.replace(/(['"`])https?:\/\/[^'"`\s]*\1/g,()=>{report.urlsRemoved++;return "''";});
  const result=esbuild.transformSync(code,{loader:'js',target:['es2017','chrome61'],minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'none',charset:'utf8',logLevel:'silent'});
  try{acorn.parse(result.code,{ecmaVersion:2017,sourceType:'script'});}
  catch(error){throw new Error(`${src}: output is not ES2017 (${error.message})`);}
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,result.code);
  report.js.push({src,in:Buffer.byteLength(code),out:Buffer.byteLength(result.code)});
}}

// ---------------------------------------------------------------- CSS
function scan(text,from,stop){ // index of the first stop char at depth 0, honouring strings
  let depth=0,quote=null;
  for(let i=from;i<text.length;i++){
    const c=text[i];
    if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(depth===0&&stop.includes(c))return i;
    if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;
  }
  return -1;
}
function splitTop(text,sep){
  const out=[];let start=0,depth=0,quote=null;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;
    else if(depth===0&&c===sep){out.push(text.slice(start,i));start=i+1;}
  }
  out.push(text.slice(start));return out;
}
function matchBrace(text,open){let depth=0,quote=null;for(let i=open;i<text.length;i++){const c=text[i];if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;else if(c==='}'){depth--;if(!depth)return i;}}throw new Error('unbalanced CSS');}
const GROUPING=/^@(media|supports|document|layer|container)\b/i;
function parse(text){
  const nodes=[];let i=0;
  while(i<text.length){
    while(i<text.length&&/\s/.test(text[i]))i++;
    if(i>=text.length)break;
    const stop=scan(text,i,'{;');
    if(stop<0)break;
    const prelude=text.slice(i,stop).trim();
    if(text[stop]===';'){nodes.push({type:'stmt',raw:prelude+';'});i=stop+1;continue;}
    const end=matchBrace(text,stop),body=text.slice(stop+1,end);
    if(prelude.startsWith('@')){
      if(GROUPING.test(prelude))nodes.push({type:'group',prelude,children:parse(body)});
      else nodes.push({type:'raw',prelude,body});
    }else nodes.push({type:'rule',sel:prelude,decls:splitTop(body,';').map(d=>d.trim()).filter(Boolean).map(d=>{const k=d.indexOf(':');return [d.slice(0,k).trim(),d.slice(k+1).trim()];})});
    i=end+1;
  }
  return nodes;
}
const serialize=nodes=>nodes.map(n=>n.type==='stmt'?n.raw:n.type==='raw'?`${n.prelude}{${n.body}}`:n.type==='group'?`${n.prelude}{${serialize(n.children)}}`:n.decls.length?`${n.sel}{${n.decls.map(([p,v])=>p+':'+v).join(';')}}`:'').join('');

// Selector lowering --------------------------------------------------
function expandFn(sel,name){ // a:is(x,y) b -> a x b, a y b (first occurrence, recursively)
  const at=sel.indexOf(':'+name+'(');if(at<0)return [sel];
  const open=at+name.length+1,close=scan(sel,open+1,')');
  const inner=sel.slice(open+1,close),options=splitTop(inner,',').map(s=>s.trim());
  const before=sel.slice(0,at),after=sel.slice(close+1);
  if(name==='not'){
    if(options.length<2){const rest=expandFn(after,'not');return rest.map(r=>before+':not('+inner+')'+r);}
    return expandFn(before+options.map(o=>':not('+o+')').join('')+after,'not');
  }
  return options.flatMap(o=>expandFn(before+o+after,name));
}
const hasPatterns=[];
function lowerHas(sel){
  const at=sel.indexOf(':has(');if(at<0)return null;
  const close=scan(sel,at+5,')'),arg=sel.slice(at+5,close).trim();
  // The compound selector that carries :has() starts after the last combinator before it.
  let start=at;
  while(start>0&&!/[\s>+~]/.test(sel[start-1])){
    if(sel[start-1]===')'){let d=0;for(let j=start-1;j>=0;j--){if(sel[j]===')')d++;else if(sel[j]==='('){d--;if(!d){start=j;break;}}}continue;}
    start--;
  }
  const target=(sel.slice(start,at)||'*').trim();
  let id=hasPatterns.findIndex(p=>p.target===target&&p.arg===arg);
  if(id<0){id=hasPatterns.length;hasPatterns.push({target,arg,className:'xhs-has-'+id});}
  const replaced=sel.slice(0,at)+'.'+hasPatterns[id].className+sel.slice(close+1);
  return lowerHas(replaced)||replaced;
}
function lowerSelectors(sel){
  let list=splitTop(sel,',').map(s=>s.trim());
  list=list.flatMap(s=>expandFn(s,'is')).flatMap(s=>expandFn(s,'where')).flatMap(s=>expandFn(s,'not'));
  const alt=[];
  for(const s of list){const h=lowerHas(s);if(h)alt.push(h);}
  // An unknown selector invalidates its whole list in older engines, so selectors that
  // Chrome 61 cannot parse go into rules of their own and the rest still apply.
  const RISKY=/:has\(|:focus-visible|::?picker|:where\(|:is\(|::marker|::backdrop|:modal|:popover-open|::file-selector-button|:user-invalid|:user-valid/;
  const safe=[...new Set([...list.filter(s=>!RISKY.test(s)),...alt.filter(s=>!RISKY.test(s))])];
  const risky=[...new Set(list.filter(s=>RISKY.test(s)))];
  return {safe,risky};
}

// Declaration lowering -----------------------------------------------
const LOGICAL={
  'margin-inline-start':['margin-left'],'margin-inline-end':['margin-right'],'margin-block-start':['margin-top'],'margin-block-end':['margin-bottom'],
  'padding-inline-start':['padding-left'],'padding-inline-end':['padding-right'],'padding-block-start':['padding-top'],'padding-block-end':['padding-bottom'],
  'inset-inline-start':['left'],'inset-inline-end':['right'],'inset-block-start':['top'],'inset-block-end':['bottom'],
  'border-inline-start':['border-left'],'border-inline-end':['border-right'],'border-block-start':['border-top'],'border-block-end':['border-bottom'],
  'margin-inline':['margin-left','margin-right'],'margin-block':['margin-top','margin-bottom'],
  'padding-inline':['padding-left','padding-right'],'padding-block':['padding-top','padding-bottom'],
  'inset-inline':['left','right'],'inset-block':['top','bottom'],
  'inline-size':['width'],'block-size':['height'],'min-inline-size':['min-width'],'min-block-size':['min-height'],'max-inline-size':['max-width'],'max-block-size':['max-height']
};
function logical([p,v]){
  if(p==='inset'){ // inset: 1-4 values -> top right bottom left
    const important=/!important$/.test(v)?'!important':'',parts=splitTop(v.replace(/!important$/,'').trim(),' ').filter(Boolean);
    const [t,r=t,b=t,l=r]=parts;return [['top',t+important],['right',r+important],['bottom',b+important],['left',l+important]];
  }
  const map=LOGICAL[p];if(!map)return [[p,v]];
  if(map.length===1)return [[map[0],v]];
  const important=/!important$/.test(v)?'!important':'';const parts=splitTop(v.replace(/!important$/,'').trim(),' ').filter(Boolean);
  return [[map[0],parts[0]+important],[map[1],(parts[1]||parts[0])+important]];
}
const MODERN=/\b(max|min|clamp|env)\(|\d(dvh|svh|lvh|dvw|svw|lvw)\b/;
function supportsFor(v){
  const c=[];
  if(/\b(max|min|clamp)\(/.test(v))c.push('(width:max(1px,2px))');
  if(/\benv\(/.test(v))c.push('(top:env(safe-area-inset-top,0px))');
  if(/\d(dvh|svh|lvh|dvw|svw|lvw)\b/.test(v))c.push('(height:1dvh)');
  return c.join(' and ');
}
const unitOf=a=>{const m=/^(-?\d*\.?\d+)([a-z%]*)$/.exec(a.trim());return m?{n:+m[1],u:m[2]||'px'}:null;};
function staticValue(v){
  let s=v.replace(/(\d)(dvh|svh|lvh)\b/g,'$1vh').replace(/(\d)(dvw|svw|lvw)\b/g,'$1vw');
  const fn=/\b(env|max|min|clamp)\(/g;
  for(let guard=0;guard<100;guard++){
    fn.lastIndex=0;let m,picked=null;
    // Resolve an innermost call (one whose arguments hold no further env/max/min/clamp).
    while((m=fn.exec(s))){
      const open=m.index+m[0].length-1,close=scan(s,open+1,')');
      if(close<0)return s;
      if(!/\b(env|max|min|clamp)\(/.test(s.slice(open+1,close))){picked=[m.index,close];break;}
    }
    if(!picked)break;
    // Minified CSS may drop the space after ")": keep values separated after substitution.
    const before=s.slice(0,picked[0]),after=s.slice(picked[1]+1),value=resolveCall(s.slice(picked[0],picked[1]+1));
    s=before+(/[\w)%.]$/.test(before)?' ':'')+value+(/^[\w(#.-]/.test(after)?' ':'')+after;
  }
  return s;
}
function resolveCall(call){
  const name=call.slice(0,call.indexOf('(')),args=splitTop(call.slice(name.length+1,-1),',').map(a=>a.trim());
  if(name==='env')return args[1]||'0px';
  if(name==='clamp')return args[1];
  const units=args.map(unitOf);
  if(units.every(Boolean)&&units.every(u=>u.u===units[0].u)){
    const n=name==='max'?Math.max(...units.map(u=>u.n)):Math.min(...units.map(u=>u.n));return n+(units[0].u==='px'&&args[0].trim()==='0'?'':units[0].u);
  }
  const fluid=a=>/%|vw|vh|vmin|vmax/.test(a);
  if(name==='min')return args.find(fluid)||args[0];
  return args.find(a=>/^-?\d*\.?\d+px$/.test(a))||args.find(a=>!fluid(a))||args[0];
}
// Gap fallbacks --------------------------------------------------------
function gapParts(decls){
  let row=null,col=null;
  for(const [p,v] of decls){
    const val=v.replace(/!important$/,'').trim();
    if(p==='gap'||p==='grid-gap'){const parts=splitTop(val,' ').filter(Boolean);row=parts[0];col=parts[1]||parts[0];}
    if(p==='row-gap'||p==='grid-row-gap')row=val;
    if(p==='column-gap'||p==='grid-column-gap')col=val;
  }
  return {row,col};
}
function processCss(src){
  const lc=lightning.transform({filename:src,code:fs.readFileSync(src),minify:true,errorRecovery:true,
    targets:{chrome:61<<16,android:61<<16,ios_saf:(18<<16)|(4<<8)},
    exclude:lightning.Features.LogicalProperties|lightning.Features.ClampFunction});
  const tree=parse(lc.code.toString());
  // Which selectors are flex / grid / column / wrap anywhere in the sheet.
  const traits=new Map();
  (function walk(nodes){for(const n of nodes){if(n.type==='group')walk(n.children);if(n.type!=='rule')continue;
    for(const s of splitTop(n.sel,',').map(x=>x.trim())){const t=traits.get(s)||{};for(const [p,v] of n.decls){
      if(p==='display'){if(/flex/.test(v))t.flex=true;if(/grid/.test(v))t.grid=true;}
      if(p==='flex-direction'&&/column/.test(v))t.column=true;if(p==='flex-direction'&&/^row/.test(v))t.column=false;
      if((p==='flex-wrap'||p==='flex-flow')&&/(^|\s)wrap/.test(v))t.wrap=true;
      if(p==='flex-flow'&&/column/.test(v))t.column=true;
      if(/^grid-template|^grid-auto-(rows|columns|flow)/.test(p))t.grid=true;
    }traits.set(s,t);}}})(tree);
  const stats={fallbacks:0,supports:0,gridGap:0,flexGap:0,has:0};
  function lowerNodes(nodes){
    const out=[];
    for(const n of nodes){
      if(n.type==='group'){out.push({...n,children:lowerNodes(n.children)});continue;}
      if(n.type!=='rule'){out.push(n);continue;}
      const lowered=lowerSelectors(n.sel);if(lowered.safe.some(x=>x.includes('xhs-has-')))stats.has++;
      const risky=lowered.risky;n.sel=lowered.safe.join(',');
      let decls=n.decls.flatMap(logical);
      const modern=[],base=[];
      for(const [p,v] of decls){
        if(p.startsWith('--')){base.push([p,v]);continue;}
        if(MODERN.test(v)){const fb=staticValue(v);if(fb&&!MODERN.test(fb))base.push([p,fb]);modern.push([p,v]);stats.fallbacks++;continue;}
        if(p==='gap'||p==='row-gap'||p==='column-gap'){base.push(['grid-'+p,v]);stats.gridGap++;}
        base.push([p,v]);
      }
      // Flex gap margins for engines that ignore gap in flexbox.
      const {row,col}=gapParts(decls);
      const flexRules=[];
      if(row||col){
        const sels=splitTop(n.sel,',').map(s=>s.trim());
        const local={flex:decls.some(([p,v])=>p==='display'&&/flex/.test(v)),grid:decls.some(([p,v])=>p==='display'&&/grid/.test(v)||/^grid-template/.test(p))};
        for(const s of sels){
          const t={...(traits.get(s)||{}),...(local.flex?{flex:true}:{}),...(local.grid?{grid:true}:{})};
          if(!t.flex||t.grid&&!local.flex)continue;
          const column=decls.some(([p,v])=>p==='flex-direction'&&/column/.test(v))||t.column;
          const wrap=decls.some(([p,v])=>(p==='flex-wrap'||p==='flex-flow')&&/(^|\s)wrap/.test(v))||t.wrap;
          const r=row&&!MODERN.test(row)?row:row&&staticValue(row),c=col&&!MODERN.test(col)?col:col&&staticValue(col);
          if(column&&r&&r!=='0')flexRules.push({type:'rule',sel:`html.no-flexgap ${s}>*+*`,decls:[['margin-top',r]]});
          else if(!column&&wrap){const d=[];if(c&&c!=='0')d.push(['margin-right',c]);if(r&&r!=='0')d.push(['margin-bottom',r]);if(d.length)flexRules.push({type:'rule',sel:`html.no-flexgap ${s}>*`,decls:d});}
          else if(!column&&c&&c!=='0')flexRules.push({type:'rule',sel:`html.no-flexgap ${s}>*+*`,decls:[['margin-left',c]]});
        }
        stats.flexGap+=flexRules.length;
      }
      const emit=sel=>{
        if(!sel)return;
        out.push({type:'rule',sel,decls:base});
        if(modern.length){
          const groups=new Map();
          for(const d of modern){const c=supportsFor(d[1]);if(!groups.has(c))groups.set(c,[]);groups.get(c).push(d);}
          for(const [cond,list] of groups){out.push({type:'group',prelude:'@supports '+cond,children:[{type:'rule',sel,decls:list}]});stats.supports++;}
        }
      };
      emit(n.sel);for(const r of risky)emit(r);
      out.push(...flexRules);
    }
    return out;
  }
  const code=serialize(lowerNodes(tree));
  // What still needs a newer engine (left as enhancement only).
  const remaining={};
  for(const f of [':has(',':is(',':where(',':focus-visible','aspect-ratio','backdrop-filter','text-wrap','::marker','accent-color','overscroll-behavior','display:contents','::picker']){
    const n=code.split(f).length-1;if(n)remaining[f]=n;
  }
  const outsideSupports=code.replace(/@supports [^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,'');
  for(const [label,re] of [['max()',/(^|[^\w-])max\(/g],['min()',/(^|[^\w-])min\(/g],['clamp()',/clamp\(/g],['env()',/env\(/g],['dvh',/\ddvh/g],['inset:',/[{;]inset:/g],['logical props',/[{;](margin|padding)-(inline|block)/g]]){
    const n=(outsideSupports.match(re)||[]).length;if(n)remaining['unguarded '+label]=n;
  }
  remaining.notList=(code.match(/:not\([^()]*,/g)||[]).length;
  return {code,stats,remaining,warnings:lc.warnings.map(w=>w.message)};
}
for(const {src,out} of job.css||[]){
  const r=processCss(src);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,r.code);
  report.css.push({src,in:fs.statSync(src).size,out:Buffer.byteLength(r.code),stats:r.stats,remaining:r.remaining,warnings:[...new Set(r.warnings)]});
}
report.has=hasPatterns;
if(job.hasOut){
  fs.mkdirSync(path.dirname(job.hasOut),{recursive:true});
  fs.writeFileSync(job.hasOut,'/* Generated by scripts/build-xhs.py: :has() patterns used by the stylesheets. */\nvar XHS_HAS_PATTERNS='+JSON.stringify(hasPatterns)+';\n');
}
transpileJs();

// ---------------------------------------------------------------- bundle
// The container caps a package at 200 files, so the lowered scripts are joined, in their
// load order, into one classic script. Separate classic scripts and one joined script
// behave alike except in a few cases, which are checked here and fail the build:
// - a directive prologue ("use strict") at the start of a file: joined, it would either
//   make every later file strict (first file) or stop applying (any other file);
// - the same top-level function declared in two files (or a function and a var/let/const):
//   joined, hoisting lets the last one win from the very start;
// - top-level code that runs while a file loads and names something a later file
//   declares: joined, function declarations exist earlier and let/const are in their TDZ;
// - document.currentScript, which would point at the joined file.
function topLevelNames(ast){
  const names=[];
  for(const node of ast.body){
    if(node.type==='FunctionDeclaration'||node.type==='ClassDeclaration')names.push([node.id.name,node.type==='FunctionDeclaration'?'function':'class']);
    else if(node.type==='VariableDeclaration')for(const d of node.declarations)collectPattern(d.id,n=>names.push([n,node.kind]));
  }
  return names;
}
function collectPattern(p,add){
  if(!p)return;
  if(p.type==='Identifier')add(p.name);
  else if(p.type==='ObjectPattern')p.properties.forEach(x=>collectPattern(x.type==='RestElement'?x.argument:x.value,add));
  else if(p.type==='ArrayPattern')p.elements.forEach(x=>collectPattern(x&&x.type==='RestElement'?x.argument:x,add));
  else if(p.type==='AssignmentPattern')collectPattern(p.left,add);
  else if(p.type==='RestElement')collectPattern(p.argument,add);
}
// Identifiers read by code that runs while the file loads: everything outside function
// bodies, plus the bodies of functions that are called on the spot (IIFEs). Names declared
// inside those bodies or blocks (and parameters) are local and not counted.
function declaredIn(body){
  const names=new Set();
  (function scan(node){
    if(!node||typeof node.type!=='string')return;
    if(node.type==='VariableDeclaration'){node.declarations.forEach(d=>collectPattern(d.id,n=>names.add(n)));node.declarations.forEach(d=>scan(d.init));return;}
    if(node.type==='FunctionDeclaration'||node.type==='ClassDeclaration'){if(node.id)names.add(node.id.name);return;}
    if(node.type==='FunctionExpression'||node.type==='ArrowFunctionExpression')return;
    if(node.type==='CatchClause'&&node.param)collectPattern(node.param,n=>names.add(n));
    for(const k of Object.keys(node)){const v=node[k];if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v.type==='string')scan(v);}
  })(body);
  return names;
}
function loadTimeReferences(ast){
  const refs=new Map();
  const isFn=n=>n&&(n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression');
  const note=(name,typeofOnly)=>{if(!refs.has(name))refs.set(name,{typeofOnly});else if(!typeofOnly)refs.get(name).typeofOnly=false;};
  (function walk(node,parent,key,locals){
    if(!node||typeof node.type!=='string')return;
    if(node.type==='FunctionDeclaration')return;
    if(isFn(node)){
      if(!(parent&&parent.type==='CallExpression'&&key==='callee'))return;
      const own=declaredIn(node.body);node.params.forEach(p=>collectPattern(p,n=>own.add(n)));
      locals=new Set([...locals,...own]);
      for(const p of node.params)walk(p,node,'params',locals);
      walk(node.body,node,'body',locals);return;
    }
    if(node.type==='BlockStatement'&&parent&&parent.type!=='Program')locals=new Set([...locals,...declaredIn({type:'Program',body:node.body.filter(s=>s.type==='VariableDeclaration'&&s.kind!=='var'||s.type==='ClassDeclaration')})]);
    if(node.type==='Identifier'){
      const decl=parent&&((parent.type==='VariableDeclarator'&&key==='id')||key==='params'||(parent.type==='CatchClause'&&key==='param'));
      const skip=decl||parent&&((parent.type==='MemberExpression'&&key==='property'&&!parent.computed)||(parent.type==='Property'&&key==='key'&&!parent.computed)||(parent.type==='MethodDefinition'&&key==='key')||key==='label');
      if(!skip&&!locals.has(node.name))note(node.name,parent&&parent.type==='UnaryExpression'&&parent.operator==='typeof');
      return;
    }
    for(const k of Object.keys(node)){
      if(k==='type'||k==='start'||k==='end')continue;
      const v=node[k];
      if(Array.isArray(v))v.forEach(c=>walk(c,node,k,locals));else if(v&&typeof v.type==='string')walk(v,node,k,locals);
    }
  })(ast,null,null,new Set());
  return refs;
}
if(job.bundle){
  const files=job.bundle.order.map(rel=>({rel,code:fs.readFileSync(path.join(job.bundle.stage,rel),'utf8')}));
  const problems=[],declared=new Map();
  for(const f of files){
    f.ast=acorn.parse(f.code,{ecmaVersion:2017,sourceType:'script'});
    if(f.ast.body[0]&&f.ast.body[0].directive)problems.push(`${f.rel}: starts with the directive "${f.ast.body[0].directive}"`);
    if(/\bcurrentScript\b/.test(f.code))problems.push(`${f.rel}: uses document.currentScript`);
    f.names=topLevelNames(f.ast);
  }
  files.forEach((f,i)=>{
    for(const [name,kind] of f.names){
      const prior=declared.get(name);
      // esbuild's lowering helpers (__defProp, __async, ...) repeat as identical vars.
      if(prior&&!(kind==='var'&&prior.kind==='var'&&name.startsWith('__')))
        if(kind==='function'||prior.kind==='function'||kind!=='var'||prior.kind!=='var')problems.push(`${name}: declared in ${prior.rel} (${prior.kind}) and ${f.rel} (${kind})`);
      if(!prior)declared.set(name,{rel:f.rel,kind,index:i});
    }
  });
  const later=new Map();
  files.forEach((f,i)=>{for(const [name,kind] of f.names)if(!later.has(name)||later.get(name).index>i)later.set(name,{index:i,kind,rel:f.rel});});
  files.forEach((f,i)=>{
    const own=new Set(f.names.map(([n])=>n));
    for(const [name,info] of loadTimeReferences(f.ast)){
      const decl=later.get(name);
      if(!decl||decl.index<=i||own.has(name))continue;
      if(decl.kind==='var')continue; // undefined either way until the later file runs
      problems.push(`${f.rel}: load-time code names ${name}${info.typeofOnly?' (typeof)':''}, declared later as ${decl.kind} in ${decl.rel}`);
    }
  });
  if(problems.length)throw new Error('cannot join scripts:\n'+problems.join('\n'));
  // Consecutive files are grouped so each joined script stays under maxBytes (the audit
  // flags single text files above 2 MiB); the checks above already cover the whole order.
  const groups=[[]];let size=0;
  for(const f of files){
    const piece=`/* --- ${f.rel} --- */\n${f.code.replace(/;?\s*$/,'')}\n;`,bytes=Buffer.byteLength(piece)+1;
    if(size+bytes>job.bundle.maxBytes&&groups[groups.length-1].length){groups.push([]);size=0;}
    groups[groups.length-1].push(piece);size+=bytes;
  }
  const outputs=[];let total=0;
  groups.forEach((pieces,i)=>{
    const out=pieces.join('\n'),name=job.bundle.out.replace(/\.js$/,`-${i+1}.js`);
    try{acorn.parse(out,{ecmaVersion:2017,sourceType:'script'});}
    catch(error){throw new Error(`${name} is not ES2017 (${error.message})`);}
    fs.writeFileSync(path.join(job.bundle.stage,name),out);outputs.push(name);total+=Buffer.byteLength(out);
  });
  for(const f of files)fs.unlinkSync(path.join(job.bundle.stage,f.rel));
  report.bundle={outputs,files:files.length,bytes:total};
}
process.stdout.write(JSON.stringify(report));
