/* ============ 启动 ============ */
setScene('court');render();requestAnimationFrame(loop);
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
