/* Small runtime fallbacks for older WebViews (Chrome / Android WebView 61). Syntax is
   lowered at build time; these fill only the library methods the game actually calls.
   Each one is installed only when the method is missing and is not enumerable. */
(function(){
  'use strict';
  var root=typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:typeof self!=='undefined'?self:this;
  if(typeof globalThis==='undefined')root.globalThis=root;
  function define(target,name,value){
    if(!target||typeof target[name]!=='undefined')return;
    Object.defineProperty(target,name,{value:value,configurable:true,writable:true,enumerable:false});
  }
  function toInt(n){n=Number(n);return n!==n?0:n<0?Math.ceil(n):Math.floor(n);}
  function at(index){
    var o=Object(this),len=o.length>>>0,i=toInt(index);if(i<0)i+=len;
    return i<0||i>=len?undefined:typeof o==='string'?o.charAt(i):o[i];
  }
  define(Array.prototype,'at',at);
  define(String.prototype,'at',function(index){return at.call(String(this),index);});
  define(Object,'hasOwn',function(object,key){
    if(object===null||object===undefined)throw new TypeError('Cannot convert undefined or null to object');
    return Object.prototype.hasOwnProperty.call(Object(object),key);
  });
  function flatten(out,list,depth){
    for(var i=0;i<list.length;i++){
      if(!(i in list))continue;
      var v=list[i];
      if(depth>0&&Array.isArray(v))flatten(out,v,depth-1);else out.push(v);
    }
    return out;
  }
  define(Array.prototype,'flat',function(depth){return flatten([],Object(this),depth===undefined?1:toInt(depth));});
  define(Array.prototype,'flatMap',function(fn,thisArg){
    var o=Object(this),out=[];
    for(var i=0;i<(o.length>>>0);i++){
      if(!(i in o))continue;
      var v=fn.call(thisArg,o[i],i,o);
      if(Array.isArray(v))for(var j=0;j<v.length;j++)out.push(v[j]);else out.push(v);
    }
    return out;
  });
  define(Array.prototype,'findLast',function(fn,thisArg){
    var o=Object(this);for(var i=(o.length>>>0)-1;i>=0;i--)if(fn.call(thisArg,o[i],i,o))return o[i];return undefined;
  });
  define(Array.prototype,'findLastIndex',function(fn,thisArg){
    var o=Object(this);for(var i=(o.length>>>0)-1;i>=0;i--)if(fn.call(thisArg,o[i],i,o))return i;return -1;
  });
  define(Object,'fromEntries',function(entries){
    var out={};
    // Arrays, Maps and other iterables of [key, value] pairs.
    if(entries&&typeof entries.forEach==='function'&&!Array.isArray(entries)&&typeof Map!=='undefined'&&entries instanceof Map){entries.forEach(function(v,k){out[k]=v;});return out;}
    var list=Array.from(entries);
    for(var i=0;i<list.length;i++){var e=list[i];out[e[0]]=e[1];}
    return out;
  });
  define(String.prototype,'trimStart',String.prototype.trimLeft||function(){return String(this).replace(/^[\s﻿\xA0]+/,'');});
  define(String.prototype,'trimEnd',String.prototype.trimRight||function(){return String(this).replace(/[\s﻿\xA0]+$/,'');});
  define(String.prototype,'replaceAll',function(search,replacement){
    var s=String(this);
    if(search instanceof RegExp){
      if(!search.global)throw new TypeError('replaceAll must be called with a global RegExp');
      return s.replace(search,replacement);
    }
    var needle=String(search);
    if(typeof replacement==='function'){
      var out='',from=0,at=needle===''?0:s.indexOf(needle);
      if(needle==='')return s.split('').map(function(ch,i){return String(replacement(needle,i,s))+ch;}).join('')+String(replacement(needle,s.length,s));
      while(at!==-1){out+=s.slice(from,at)+String(replacement(needle,at,s));from=at+needle.length;at=s.indexOf(needle,from);}
      return out+s.slice(from);
    }
    // String replacements keep the $-pattern meaning of String.prototype.replace.
    var escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return s.replace(new RegExp(escaped,'g'),String(replacement));
  });
  if(typeof Promise!=='undefined')define(Promise.prototype,'finally',function(fn){
    var P=this.constructor;
    return this.then(function(v){return P.resolve(fn()).then(function(){return v;});},function(e){return P.resolve(fn()).then(function(){throw e;});});
  });
}());
