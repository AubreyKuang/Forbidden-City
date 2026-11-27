/* 易次元 host (only in the yiciyuan build, loaded after the game).
   - The platform SDK (AvgAIGameSDK, loaded from the platform CDN before the game) is
     initialised and logged in by js/palace-storage.js when the cloud store opens.
   - Marks the session as playing (SDK.logGamePlay) once the player starts or loads a
     reign, so the platform counts play time.
   - The App WebView has no download folder: cards drawn on canvas open full screen,
     where the player can long-press the picture to save it.
   - Removes the static first screen from index.html once the game has drawn.
   The platform's own exit button (top left) is used; the page keeps clear of it. */
const YiciyuanHost=(()=>{
  const root=document.documentElement;
  root.classList.add('yiciyuan-host');
  const sdk=()=>globalThis.AvgAIGameSDK||null;
  let played=false;
  function markPlaying(){
    if(played)return;played=true;
    try{const s=sdk();if(s&&typeof s.logGamePlay==='function')Promise.resolve(s.logGamePlay()).catch(()=>{});}catch(e){/* Play-time logging never blocks the game. */}
  }
  // Store for js/palace-shop.js. Spending always follows the player's own confirmation in
  // the shop; the SDK shows no UI of its own and never charges by itself.
  const store={
    paidCount:async productId=>{const r=await sdk().fetchPaidCount({productId});return Number(r&&r.count)||0;},
    purchase:(productId,price)=>sdk().purchaseGood({productId,price,count:1}),
    getValue:name=>sdk().getUserValue(name),
    setValue:(name,value)=>sdk().setUserValue(name,value),
    openWallet:()=>sdk().openWallet()
  };
  const storeReady=()=>{const s=sdk();return !!s&&['fetchPaidCount','purchaseGood','getUserValue','setUserValue'].every(n=>typeof s[n]==='function');};
  const refreshShop=()=>{if(typeof PalaceShop!=='undefined'&&PalaceShop.enabled&&storeReady())PalaceShop.refresh().catch(e=>console.warn('Shop:',e));};
  // Start a reign or load a save: wrap the actions the buttons call. Each also checks
  // purchases, so silver paid for earlier reaches the reign now open.
  for(const name of ['start','load']){
    const base=typeof A!=='undefined'&&A&&A[name];
    if(typeof base==='function')A[name]=function(...args){
      const out=base.apply(this,args);markPlaying();
      Promise.resolve(out).then(()=>setTimeout(refreshShop,0));
      return out;
    };
  }
  const go=typeof A!=='undefined'&&A&&A.go;
  if(typeof go==='function')A.go=function(view,...rest){const out=go.call(this,view,...rest);if(view==='shop')refreshShop();return out;};
  function saveCanvasImage(canvas,label){
    const old=document.getElementById('yiciyuan-picture');if(old)old.remove();
    const box=document.createElement('div');
    box.id='yiciyuan-picture';box.setAttribute('role','dialog');box.setAttribute('aria-label',label||'图片');
    const img=document.createElement('img');img.src=canvas.toDataURL('image/png');img.alt=label||'图片';
    const hint=document.createElement('p');hint.textContent='长按图片可保存到相册';
    const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='关闭';
    close.addEventListener('click',()=>box.remove());
    box.append(img,hint,close);document.body.append(box);
    return true;
  }
  globalThis.PALACE_HOST={saveCanvasImage,get store(){return storeReady()?store:null;}};

  function finishBoot(){
    const boot=document.getElementById('yc-boot');
    if(!boot)return;
    document.getElementById('app').removeAttribute('aria-busy');
    boot.parentNode.removeChild(boot);
  }
  const slow=setTimeout(()=>{const s=document.getElementById('yc-boot-status');if(s)s.textContent='仍在准备…若长时间没有反应，请退出后重新打开。';},12000);
  const ready=()=>{clearTimeout(slow);requestAnimationFrame(()=>requestAnimationFrame(finishBoot));refreshShop();};
  if(typeof palaceStorageOpening!=='undefined'&&palaceStorageOpening&&typeof palaceStorageOpening.then==='function')palaceStorageOpening.then(ready,ready);
  else ready();
  return {markPlaying,saveCanvasImage};
})();
