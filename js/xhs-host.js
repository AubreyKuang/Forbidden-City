/* Xiaohongshu mini-tool host (only in the xhs build, loaded after the game).
   - Keeps the page clear of the container's top-right capsule: getWindowInfo (9.49+) gives
     the safe area and menu buttons; the larger of safeArea.top and the button bottoms
     becomes --xhs-top-inset. Without the API the CSS env()/fallback values stay in force.
   - Saves images through saveImageToPhotosAlbum instead of downloads.
   - Removes the static first screen from index.html once the game has drawn. */
const XhsHost=(()=>{
  const root=document.documentElement;
  root.classList.add('xhs-host');
  const miniTool=()=>{const x=globalThis.xhs;return x&&x.miniTool||null;};
  const rect=r=>r&&typeof r==='object'&&Number.isFinite(r.bottom)&&r.bottom>0&&(r.width>0||r.right>r.left)?r:null;
  function applyWindowInfo(info){
    if(!info||typeof info!=='object')return false;
    const safeTop=Number.isFinite(info.safeArea&&info.safeArea.top)?info.safeArea.top:0;
    const buttons=info.menuButtons||{};
    // Prefer the capsule (9.55+); otherwise the visible back / me / share buttons.
    const capsule=rect(buttons.capsule);
    const visible=capsule?[capsule]:['back','me','share'].map(k=>rect(buttons[k])).filter(Boolean);
    const buttonBottom=visible.reduce((m,r)=>Math.max(m,r.bottom),0);
    const top=Math.max(safeTop,buttonBottom);
    const right=visible.reduce((m,r)=>Math.max(m,(info.windowWidth||info.screenWidth||0)-(Number.isFinite(r.left)?r.left:0)),0);
    root.style.setProperty('--xhs-top-inset',Math.round(top)+'px');
    if(right>0)root.style.setProperty('--xhs-capsule-width',Math.round(right)+'px');
    if(info.safeArea&&Number.isFinite(info.safeArea.bottom)&&Number.isFinite(info.windowHeight||info.screenHeight)){
      const bottom=Math.max(0,(info.windowHeight||info.screenHeight)-info.safeArea.bottom);
      root.style.setProperty('--xhs-bottom-inset',Math.round(bottom)+'px');
    }
    root.classList.add('xhs-window-info');
    return true;
  }
  async function readWindowInfo(){
    const mt=miniTool();
    if(!mt||typeof mt.getWindowInfo!=='function')return false;
    try{return applyWindowInfo(await mt.getWindowInfo());}
    catch(error){console.warn('getWindowInfo:',error&&(error.errMsg||error.message));return false;}
  }
  let saving=false;
  async function saveCanvasImage(canvas,label){
    const mt=miniTool();
    const say=text=>typeof toast==='function'?toast(text):console.log(text);
    if(!mt||typeof mt.saveImageToPhotosAlbum!=='function'){say('当前环境不能保存图片');return false;}
    if(saving)return false;saving=true;
    try{
      const data=canvas.toDataURL('image/png');
      let filePath=data;
      // Large images go through a temporary file first, as the container recommends.
      if(typeof mt.writeTempFile==='function'){
        try{const r=await mt.writeTempFile({data});if(r&&r.filePath)filePath=r.filePath;}catch(e){filePath=data;}
      }
      await mt.saveImageToPhotosAlbum({filePath});
      say((label||'图片')+'已保存到相册');return true;
    }catch(error){
      const msg=error&&(error.errMsg||error.message)||'';
      say(/auth|deny|denied|permission|权限/i.test(msg)?'需要相册权限才能保存图片':'图片未能保存，请稍后重试');
      return false;
    }finally{saving=false;}
  }
  globalThis.PALACE_HOST={saveCanvasImage};

  // The static first screen in index.html stays until the game has rendered its first view.
  function finishBoot(){
    const boot=document.getElementById('xhs-boot');
    if(!boot)return;
    document.getElementById('app').removeAttribute('aria-busy');
    boot.parentNode.removeChild(boot);
  }
  const slow=setTimeout(()=>{const s=document.getElementById('xhs-boot-status');if(s)s.textContent='仍在准备…若长时间没有反应，请退出后重新打开。';},12000);
  const ready=()=>{clearTimeout(slow);requestAnimationFrame(()=>requestAnimationFrame(finishBoot));};
  if(typeof palaceStorageOpening!=='undefined'&&palaceStorageOpening&&typeof palaceStorageOpening.then==='function')palaceStorageOpening.then(ready,ready);
  else ready();
  readWindowInfo();
  return {applyWindowInfo,readWindowInfo,saveCanvasImage};
})();
