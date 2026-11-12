/* ============ 启动 ============ */
setScene('court');render();requestAnimationFrame(loop);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&modalOpen&&document.activeElement&&document.activeElement.id==='minput'){choose(0)}});
