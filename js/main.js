/* ============ 启动 ============ */
function startPalacePage(){
  if(PalaceStorage.startupError){
    $('#panel').innerHTML='<section class="pix"><h2>存档暂时无法读取</h2><p>'+esc(PalaceStorage.startupError.message||'浏览器没有允许存档数据库打开。')+'</p><p>已有存档没有被删除。请关闭其他旧版游戏页面，确认浏览器允许本站保存数据后重试。</p><button class="btn gold" onclick="location.reload()">重新读取存档</button></section>';
    return;
  }
  connectPalaceStorage();setScene('court');render();requestAnimationFrame(loop);
}
const palaceStorageOpening=PalaceStorage.init();
if(palaceStorageOpening){$('#panel').innerHTML='<p role="status">正在读取本机存档…</p>';palaceStorageOpening.then(startPalacePage);}
else startPalacePage();
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&modalOpen&&curEv?.scene==='month-review'){
    e.preventDefault();
    choose(curEv.choices.length-2);
    return;
  }
  if(e.key==='Enter'&&modalOpen&&e.target.id==='minput'&&!e.isComposing&&e.keyCode!==229){
    e.preventDefault();
    choose(0);
  }
});

document.addEventListener('input',event=>{if(event.target.id==='minput')PalaceActions.keepInput(event.target.value);});
