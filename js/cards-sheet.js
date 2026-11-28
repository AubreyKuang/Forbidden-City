/* 敬事房 · 翻牌子 as a pop-up from 后宫, for editions whose bottom bar has no room for it
   (features.cardsDock:false; the 易次元 build, where 商城 takes its place). The pop-up shows
   the same 绿头牌 as the 翻牌子 page; choosing one closes it and runs the usual action, so
   nights and their scenes are journaled exactly as before. The page itself stays reachable
   from 宫城 (敬事房). Other editions keep 翻牌子 in the bottom bar and see no change. */
const CardsSheet=(()=>{
  const enabled=typeof PALACE_EDITION!=='undefined'&&!PALACE_EDITION.feature('cardsDock');
  let sheet=null;
  function close(){
    if(!sheet)return;
    const d=sheet;sheet=null;
    try{if(d.open&&typeof d.close==='function')d.close();}catch(e){/* Already closed. */}
    d.remove();
  }
  function open(){
    if(!enabled||!S||S.over||modalOpen)return;
    close();
    const d=document.createElement('dialog');
    d.id='cards-sheet';d.setAttribute('aria-label','敬事房 · 翻牌子');
    d.innerHTML=`<div class="pix cards-sheet-box">${viewCards()}<div class="acts cards-sheet-foot"><button class="btn" type="button" data-cards-close>关闭</button></div></div>`;
    // Bubbles here before the document's action handler: close after it has run.
    d.addEventListener('click',event=>{
      const t=event.target;
      if(t===d||t.closest&&t.closest('[data-cards-close]')){close();return;}
      if(t.closest&&t.closest('[data-onclick]'))setTimeout(close,0);
    });
    d.addEventListener('cancel',event=>{event.preventDefault();close();});
    document.body.append(d);sheet=d;
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  }
  return {enabled,open,close,get isOpen(){return !!sheet;}};
})();

if(CardsSheet.enabled){
  const at=MENU.findIndex(item=>item[0]==='cards');
  if(at>=0)MENU.splice(at,1);
  A.cardsSheet=function(){CardsSheet.open();};
}
