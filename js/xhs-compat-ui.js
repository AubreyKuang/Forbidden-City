/* Layout fallbacks for older WebViews in the Xiaohongshu build (deferred, so the body exists).
   - Flex gap: measured once, as css-compatibility.md describes. Without it html gets
     .no-flexgap and the generated margin fallbacks in the stylesheet take over.
   - :has(): when unsupported, elements matching a pattern's target that contain its
     argument get the generated class (XHS_HAS_PATTERNS from the build), kept current
     on DOM changes and form input. */
(function(){
  'use strict';
  var root=document.documentElement;
  function supportsFlexGap(){
    var flex=document.createElement('div');
    flex.style.position='absolute';flex.style.visibility='hidden';flex.style.display='flex';
    flex.style.flexDirection='column';flex.style.rowGap='1px';
    flex.appendChild(document.createElement('div'));flex.appendChild(document.createElement('div'));
    document.body.appendChild(flex);
    var ok=flex.scrollHeight===1;flex.parentNode.removeChild(flex);return ok;
  }
  if(!supportsFlexGap())root.classList.add('no-flexgap');

  var patterns=typeof XHS_HAS_PATTERNS!=='undefined'?XHS_HAS_PATTERNS:[];
  var hasSupported=false;
  try{hasSupported=!!(window.CSS&&CSS.supports&&CSS.supports('selector(:has(*))'));}catch(e){hasSupported=false;}
  if(hasSupported||!patterns.length)return;
  var usable=patterns.filter(function(p){
    try{document.querySelector(p.target);document.querySelector(/^[>+~]/.test(p.arg)?':scope'+p.arg:p.arg);return true;}catch(e){return false;}
  });
  function matchInside(el,arg){
    try{return /^[>+~]/.test(arg)?!!el.querySelector(':scope'+arg):!!el.querySelector(arg);}catch(e){return false;}
  }
  var queued=false;
  function refresh(){
    queued=false;
    for(var i=0;i<usable.length;i++){
      var p=usable[i],marked=document.getElementsByClassName(p.className);
      for(var j=marked.length-1;j>=0;j--){var m=marked[j];if(!m.matches(p.target)||!matchInside(m,p.arg))m.classList.remove(p.className);}
      var list=document.querySelectorAll(p.target);
      // Only touch class lists that change, so the observer does not wake itself up.
      for(var k=0;k<list.length;k++)if(!list[k].classList.contains(p.className)&&matchInside(list[k],p.arg))list[k].classList.add(p.className);
    }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(refresh);}}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','checked']});
  document.addEventListener('change',schedule,true);
  document.addEventListener('input',schedule,true);
  refresh();
}());
