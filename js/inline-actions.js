/* Inline actions without inline script.
   Game markup carries handlers as data attributes, e.g. data-onclick="A.go('harem',3)".
   A strict CSP (script-src 'self', no 'unsafe-inline' / 'unsafe-eval') refuses data-onclick=""
   attributes, eval and new Function, so this file reads the attribute and runs it with a
   tiny interpreter instead. It understands only what the game writes:
     calls on dotted names       A.go('harem',3)  openX(3,'a',true,null)  meetConsort(byId(4))
     several statements          event.preventDefault();A.start()
     literals                    'text' "text" 12 -1.5 true false null undefined
     this / event and members    this.value  this.classList.add('x')  event.stopPropagation()
     member assignment           UI.logF='all'
     return                      return false   (a false result also prevents the default)
   Anything else is a syntax error, raised when the handler first runs. */
const PalaceInlineActions=(()=>{
  // const / let globals are not window properties; name them so handlers can reach them.
  const LEXICAL={
    A:()=>typeof A!=='undefined'?A:undefined,
    AU:()=>typeof AU!=='undefined'?AU:undefined,
    UI:()=>typeof UI!=='undefined'?UI:undefined,
    S:()=>typeof S!=='undefined'?S:undefined,
    DEV:()=>typeof DEV!=='undefined'?DEV:undefined,
    byId:()=>typeof byId!=='undefined'?byId:undefined,
    gardenPlace:()=>typeof gardenPlace!=='undefined'?gardenPlace:undefined,
    $:()=>typeof $!=='undefined'?$:undefined
  };
  const BLOCKED_PROPS=new Set(['constructor','__proto__','prototype','__defineGetter__','__defineSetter__','__lookupGetter__','__lookupSetter__']);
  const BLOCKED_NAMES=new Set(['eval','Function','setTimeout','setInterval','execScript','globalThis','window','self','top','parent','frames','opener']);
  const PUNCT='.(),;=[]!-+';

  function tokenize(src){
    const tokens=[];let i=0;
    const fail=msg=>{throw new SyntaxError(msg+' at '+i+' in: '+src);};
    while(i<src.length){
      const ch=src[i];
      if(/\s/.test(ch)){i++;continue;}
      if(ch==='"'||ch==="'"){
        let j=i+1,value='';
        while(j<src.length&&src[j]!==ch){
          if(src[j]==='\\'){
            const n=src[j+1];j+=2;
            if(n==='n')value+='\n';else if(n==='t')value+='\t';else if(n==='r')value+='\r';
            else if(n==='b')value+='\b';else if(n==='f')value+='\f';else if(n==='v')value+='\v';else if(n==='0'&&!/[0-9]/.test(src[j]||''))value+='\0';
            else if(n==='x'){const h=src.slice(j,j+2);if(!/^[0-9a-fA-F]{2}$/.test(h))fail('Bad \\x escape');value+=String.fromCharCode(parseInt(h,16));j+=2;}
            else if(n==='u'){
              if(src[j]==='{'){const end=src.indexOf('}',j);const h=src.slice(j+1,end);if(end<0||!/^[0-9a-fA-F]{1,6}$/.test(h))fail('Bad \\u escape');value+=String.fromCodePoint(parseInt(h,16));j=end+1;}
              else{const h=src.slice(j,j+4);if(!/^[0-9a-fA-F]{4}$/.test(h))fail('Bad \\u escape');value+=String.fromCharCode(parseInt(h,16));j+=4;}
            }
            else if(n==='\n')continue;
            else if(n===undefined)fail('Unterminated string');
            else value+=n;
            continue;
          }
          if(src[j]==='\n')fail('Unterminated string');
          value+=src[j++];
        }
        if(j>=src.length)fail('Unterminated string');
        tokens.push({t:'str',v:value});i=j+1;continue;
      }
      if(/[0-9]/.test(ch)||(ch==='.'&&/[0-9]/.test(src[i+1]||''))){
        const m=/^(?:0[xX][0-9a-fA-F]+|(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)/.exec(src.slice(i));
        tokens.push({t:'num',v:Number(m[0])});i+=m[0].length;
        if(/[A-Za-z_$0-9]/.test(src[i]||''))fail('Bad number');
        continue;
      }
      if(/[A-Za-z_$]/.test(ch)){
        const m=/^[A-Za-z_$][A-Za-z0-9_$]*/.exec(src.slice(i));
        tokens.push({t:'id',v:m[0]});i+=m[0].length;continue;
      }
      if(PUNCT.includes(ch)){
        // Comparison, arrow and compound operators are not part of the handler language.
        if(ch==='='&&(src[i+1]==='='||src[i+1]==='>'))fail('Unsupported operator');
        if(ch==='!'&&src[i+1]==='=')fail('Unsupported operator');
        if((ch==='+'||ch==='-')&&(src[i+1]===ch||src[i+1]==='='))fail('Unsupported operator');
        tokens.push({t:ch});i++;continue;
      }
      fail('Unexpected character '+JSON.stringify(ch));
    }
    tokens.push({t:'end'});
    return tokens;
  }

  function parse(src){
    const tokens=tokenize(String(src));let pos=0;
    const peek=()=>tokens[pos],next=()=>tokens[pos++];
    const fail=msg=>{throw new SyntaxError(msg+' in: '+src);};
    const expect=t=>{if(peek().t!==t)fail('Expected '+t+' but found '+(peek().v??peek().t));return next();};
    function primary(){
      const tok=next();
      if(tok.t==='num'||tok.t==='str')return {k:'lit',v:tok.v};
      if(tok.t==='id'){
        if(tok.v==='true')return {k:'lit',v:true};
        if(tok.v==='false')return {k:'lit',v:false};
        if(tok.v==='null')return {k:'lit',v:null};
        if(tok.v==='undefined')return {k:'lit',v:undefined};
        if(tok.v==='return'||tok.v==='new'||tok.v==='function'||tok.v==='delete'||tok.v==='typeof'||tok.v==='void')fail('Unsupported keyword '+tok.v);
        if(BLOCKED_NAMES.has(tok.v))fail('Blocked name '+tok.v);
        return {k:'id',v:tok.v};
      }
      if(tok.t==='('){const e=expression();expect(')');return e;}
      fail('Unexpected '+(tok.v??tok.t));
    }
    function postfix(){
      let node=primary();
      for(;;){
        const t=peek().t;
        if(t==='.'){next();const name=expect('id').v;if(BLOCKED_PROPS.has(name))fail('Blocked property '+name);node={k:'get',o:node,p:{k:'lit',v:name}};}
        else if(t==='['){next();const p=expression();expect(']');if(p.k==='lit'&&BLOCKED_PROPS.has(String(p.v)))fail('Blocked property '+p.v);node={k:'get',o:node,p};}
        else if(t==='('){
          next();const args=[];
          if(peek().t!==')'){for(;;){args.push(expression());if(peek().t===','){next();if(peek().t===')')break;continue;}break;}}
          expect(')');node={k:'call',f:node,a:args};
        }
        else return node;
      }
    }
    function unary(){
      const t=peek().t;
      if(t==='!'||t==='-'||t==='+'){next();return {k:'un',op:t,e:unary()};}
      return postfix();
    }
    function expression(){return unary();}
    function statement(){
      if(peek().t==='id'&&peek().v==='return'){
        next();
        if(peek().t===';'||peek().t==='end')return {k:'ret',e:null};
        return {k:'ret',e:expression()};
      }
      const e=expression();
      if(peek().t==='='){
        next();
        if(e.k!=='get')fail('Only member assignment is supported');
        return {k:'set',o:e.o,p:e.p,e:expression()};
      }
      return {k:'expr',e};
    }
    const body=[];
    while(peek().t!=='end'){
      if(peek().t===';'){next();continue;}
      body.push(statement());
      if(peek().t!==';'&&peek().t!=='end')fail('Expected ; but found '+(peek().v??peek().t));
    }
    return body;
  }

  const root=()=>typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:undefined;
  function resolve(name){
    if(Object.prototype.hasOwnProperty.call(LEXICAL,name)){const v=LEXICAL[name]();if(v!==undefined)return {found:true,value:v};}
    const g=root();
    if(g&&name in g)return {found:true,value:g[name]};
    return {found:false};
  }
  const BLOCKED_FUNCS=()=>{const g=root()||{};return [g.eval,g.Function,g.setTimeout,g.setInterval].filter(Boolean);};
  function prop(v){const k=typeof v==='symbol'?v:String(v);if(BLOCKED_PROPS.has(k))throw new TypeError('Blocked property '+k);return k;}
  function evaluate(node,scope){
    switch(node.k){
      case 'lit':return node.v;
      case 'id':{
        if(node.v==='this')return scope.self;
        if(node.v==='event')return scope.event;
        const r=scope.resolve(node.v);if(!r.found)throw new ReferenceError(node.v+' is not defined');return r.value;
      }
      case 'get':{const o=evaluate(node.o,scope),k=prop(evaluate(node.p,scope));if(o===null||o===undefined)throw new TypeError('Cannot read property '+String(k)+' of '+o);return o[k];}
      case 'un':{const v=evaluate(node.e,scope);return node.op==='!'?!v:node.op==='-'?-v:+v;}
      case 'call':{
        let self,fn;
        if(node.f.k==='get'){
          self=evaluate(node.f.o,scope);const k=prop(evaluate(node.f.p,scope));
          if(self===null||self===undefined)throw new TypeError('Cannot read property '+String(k)+' of '+self);
          fn=self[k];
        }else fn=evaluate(node.f,scope);
        if(typeof fn!=='function')throw new TypeError('Not a function');
        if(BLOCKED_FUNCS().includes(fn))throw new TypeError('Blocked function');
        const args=node.a.map(a=>evaluate(a,scope));
        return fn.apply(self,args);
      }
    }
    throw new SyntaxError('Unknown node');
  }
  function execute(program,self,event,resolver){
    const scope={self,event,resolve:resolver||resolve};
    for(const st of program){
      if(st.k==='ret')return {returned:true,value:st.e?evaluate(st.e,scope):undefined};
      if(st.k==='set'){const o=evaluate(st.o,scope),k=prop(evaluate(st.p,scope));if(o===null||o===undefined)throw new TypeError('Cannot set property of '+o);o[k]=evaluate(st.e,scope);continue;}
      evaluate(st.e,scope);
    }
    return {returned:false,value:undefined};
  }
  const cache=new Map();
  function compile(src){
    let p=cache.get(src);
    if(!p){p=parse(src);if(cache.size>600)cache.clear();cache.set(src,p);}
    return p;
  }
  function run(src,self,event,resolver){return execute(compile(src),self,event,resolver);}

  // Events whose handlers the game writes. toggle and load do not bubble, so they are
  // caught in the capture phase and only run on the element that fired them.
  const BUBBLING=['click','change','input','submit','keydown'];
  const TARGET_ONLY=['toggle','load'];
  function report(error){
    if(typeof reportError==='function'){try{reportError(error);return;}catch(e){/* fall through */}}
    if(typeof console!=='undefined')console.error(error);
  }
  function invoke(el,type,event){
    const src=el.getAttribute('data-on'+type);
    if(src===null)return;
    if(type==='submit')event.preventDefault();
    try{
      const result=run(src,el,event);
      if(result.value===false)event.preventDefault();
    }catch(error){report(error);}
  }
  function handle(event){
    const type=event.type;
    if(TARGET_ONLY.includes(type)){const t=event.target;if(t&&t.nodeType===1)invoke(t,type,event);return;}
    // Match inline handler order: target first, then each ancestor, until one stops propagation.
    const path=typeof event.composedPath==='function'?event.composedPath():[];
    const chain=path.length?path:(()=>{const out=[];for(let n=event.target;n;n=n.parentNode)out.push(n);return out;})();
    for(const node of chain){
      if(!node||node.nodeType!==1)continue;
      if(node.hasAttribute('data-on'+type))invoke(node,type,event);
      if(event.cancelBubble)break;
    }
  }
  function install(doc){
    if(!doc||typeof doc.addEventListener!=='function'||doc.__palaceInlineActions)return false;
    doc.__palaceInlineActions=true;
    for(const type of BUBBLING)doc.addEventListener(type,handle,false);
    for(const type of TARGET_ONLY)doc.addEventListener(type,handle,true);
    return true;
  }
  if(typeof document!=='undefined')install(document);
  return {parse,run,compile,resolve,install,LEXICAL_NAMES:Object.keys(LEXICAL),EVENTS:BUBBLING.concat(TARGET_ONLY)};
})();
