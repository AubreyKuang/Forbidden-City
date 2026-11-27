/* ============ 启动 ============ */
function startPalacePage(){
  if(PalaceStorage.startupError&&!PALACE_EDITION.feature('saveExport')){
    // Hosts without file backups: say plainly that this session will not be saved.
    $('#panel').innerHTML='<section class="pix"><h2>当前无法存档</h2><p>'+esc(PalaceStorage.startupError.message||'本机存储暂不可用。')+'</p><p>可以先不存档游玩：本局进度只在本次游玩中保留，退出后不会保存。</p><button class="btn gold" data-onclick="playWithoutSaving()">不存档先玩</button> <button class="btn" data-onclick="location.reload()">重新检查存储</button></section>';
    return;
  }
  if(PalaceStorage.startupError){
    $('#panel').innerHTML='<section class="pix"><h2>存档暂时无法读取</h2><p>'+esc(PalaceStorage.startupError.message||'浏览器没有允许存档数据库打开。')+'</p><p>已有存档没有被删除。请关闭其他旧版游戏页面，确认浏览器允许本站保存数据后重试。</p><button class="btn gold" data-onclick="location.reload()">重新读取存档</button> <button class="btn" data-onclick="playWithoutSaving()">不存档先玩</button><p class="hint">不存档时，可随时在「存档」页下载备份文件，之后再读入。</p></section>';
    return;
  }
  connectPalaceStorage();setScene('court');render();requestAnimationFrame(loop);
}
// A host that refuses every store still lets the reign be played and downloaded.
function playWithoutSaving(){PalaceStorage.unsaved=true;globalThis.PALACE_UNSAVED=true;connectPalaceStorage();setScene('court');render();requestAnimationFrame(loop);}
const palaceStorageOpening=PalaceStorage.init();
if(palaceStorageOpening){$('#panel').innerHTML='<p role="status">'+(PALACE_EDITION.name==='yiciyuan'?'正在读取云存档…':'正在读取本机存档…')+'</p>';palaceStorageOpening.then(startPalacePage);}
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
