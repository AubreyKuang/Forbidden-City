/* 商城: in-game products, only in builds whose edition config lists them (the 易次元
   package). The web, TapTap and 小红书 builds have no shop config, so nothing here shows
   and every portrait stays open.

   Products (scripts/yiciyuan-edition.json, shop.products), sold through the host's store
   (PALACE_HOST.store, js/yiciyuan-host.js → AvgAIGameSDK):
   - silver: repeatable. The platform's paid count minus the count already delivered
     (an account value) is what the player is owed; it goes into the reign that is open.
     Delivery runs after a purchase and whenever the shop or a save opens, so a payment
     whose page closed early still arrives.
   - painter: one-time. Unlocks 「更换立绘」 on ordinary consorts' pages.
   - portraitPack: one-time. Its portraits stay out of new consorts' pools and out of the
     painter's gallery until bought. Ownership is copied onto the world
     (S.flags.portraitPacks) only between actions, so replays of a pending scene draw from
     the same pool they were recorded with.
   - bundle (金手指包): one-time. Owning it also owns the products it lists (includes), and
     opens 事件频率 (js/event-frequency.js: how often each kind of event happens) and
     「立即召见」: every 剧情妃 and 风华人物 not yet met can be met now, through the same
     first-meeting scene the game already has, without its time, place or entry condition.
     Like packs, ownership reaches the world (S.flags.goldFinger) only between actions,
     and the summon is journaled, so a scene left open replays after a reload.
   Shop actions run outside the action journal (this file loads after it). */
const PORTRAIT_PACKS=Object.freeze({
  legends:Object.freeze({name:'传说珠翠',cells:Object.freeze([...Array.from({length:24},(_,i)=>316+i),...Array.from({length:6},(_,i)=>515+i)])})
});
const PalaceShop=(()=>{
  const config=typeof PALACE_EDITION!=='undefined'&&PALACE_EDITION.shop||null;
  const products=config&&Array.isArray(config.products)?config.products:[];
  const enabled=products.length>0;
  const owned=new Set();
  let checked=false,delivering=null,buying=null,note='';
  const host=()=>{const h=globalThis.PALACE_HOST;return h&&h.store||null;};
  const byKey=key=>products.find(p=>p.key===key);
  const yuan=price=>(price/10).toFixed(price%10?1:0);
  // World changes wait until no scene is pending.
  const safe=()=>!!S&&!modalOpen&&!PalaceActions.busy&&!PalaceActions.blocked&&!S.pendingActions;
  const packOwned=pack=>!!(S&&S.flags&&Array.isArray(S.flags.portraitPacks)&&S.flags.portraitPacks.includes(pack));
  function cellOpen(cell){
    if(!enabled)return true;
    for(const [pack,info] of Object.entries(PORTRAIT_PACKS))if(info.cells.includes(cell)&&!packOwned(pack))return false;
    return true;
  }
  function own(key){
    owned.add(key);
    const p=byKey(key);
    for(const k of p&&p.kind==='bundle'&&Array.isArray(p.includes)?p.includes:[])owned.add(k);
  }
  function syncWorld(){
    if(!enabled||!safe())return false;
    let changed=false;
    for(const p of products)if(p.kind==='portraitPack'&&owned.has(p.key)&&!packOwned(p.pack)){
      S.flags.portraitPacks=[...(S.flags.portraitPacks||[]),p.pack];changed=true;
    }
    if(products.some(p=>p.kind==='bundle'&&owned.has(p.key))&&S.flags.goldFinger!==true){S.flags.goldFinger=true;changed=true;}
    return changed;
  }
  async function deliver(){
    if(delivering)return delivering;
    delivering=(async()=>{
      const h=host();if(!h||!safe())return 0;
      let total=0;
      for(const p of products.filter(p=>p.kind==='silver')){
        let paid,done;
        try{paid=Number(await h.paidCount(p.productId))||0;done=Number(await h.getValue(p.doneKey))||0;}catch(e){console.warn('Shop delivery check:',e);continue;}
        if(paid<=done||!safe())continue;
        const amount=p.amount*(paid-done);
        E().treasury+=amount;total+=amount;
        log(`【内帑】${p.name}到账：国库增加${amount}万两。`,1);
        save('auto');
        // The reign is credited first: a lost write here repeats a delivery, never loses one.
        try{await h.setValue(p.doneKey,String(paid));}catch(e){console.warn('Shop delivery record:',e);}
      }
      if(total){toast(`银两已到账：国库增加${total}万两`);render();}
      return total;
    })().finally(()=>{delivering=null;});
    return delivering;
  }
  async function refresh(){
    const h=host();if(!enabled||!h)return;
    for(const p of products){
      if(p.kind==='silver')continue;
      try{if(Number(await h.paidCount(p.productId))>0)own(p.key);}catch(e){console.warn('Shop entitlement check:',e);}
    }
    checked=true;
    if(syncWorld())save('auto');
    await deliver();
    if(S&&(UI.view==='shop'||UI.view==='consort'))render();
  }
  async function buy(key){
    const p=byKey(key),h=host();
    if(!p||!h||buying)return;
    if(p.kind!=='silver'&&owned.has(key)){note='已经拥有。';render();return;}
    if(p.kind==='silver'&&!safe()){note='请先处理完当前事件，再购买银两。';render();return;}
    buying=key;note='';UI.shopConfirm=null;render();
    try{
      await h.purchase(p.productId,p.price);
      if(p.kind==='silver')await deliver();
      else{own(key);if(syncWorld())save('auto');toast(`已获得「${p.name}」`);}
      note=`「${p.name}」购买成功。`;
    }catch(e){
      if(e&&e.code==='COIN_INSUFFICIENT'){note='次元币不足。';UI.shopWallet=true;}
      else{console.warn('Shop purchase:',e);note='购买没有完成。如果已经付款，稍后回到商城会自动到账，不要重复购买。';}
    }finally{buying=null;render();}
  }
  function productLine(p){
    const isOwned=p.kind!=='silver'&&owned.has(p.key);
    const price=`${p.price} 次元币（${yuan(p.price)} 元）`;
    const confirm=UI.shopConfirm===p.key;
    const action=isOwned?'<span class="tag">已购买 · 已生效</span>':
      buying===p.key?'<button class="btn sm" disabled>购买中…</button>':
      confirm?`<button class="btn sm gold" data-onclick="A.shopBuy('${p.key}')">确认支付 ${p.price} 次元币</button> <button class="btn sm" data-onclick="A.shopConfirm(null)">取消</button>`:
      `<button class="btn sm gold" data-onclick="A.shopConfirm('${p.key}')" ${buying||!host()?'disabled':''}>购买</button>`;
    return `<article class="save-slot shop-item"><div class="save-slot-info"><b>${esc(p.name)}</b><span class="hint">${esc(p.desc||'')}</span><small>${price}${p.kind==='silver'?' · 可重复购买':' · 买一次永久有效'}</small></div><div class="save-slot-actions">${action}</div></article>`;
  }
  function view(){
    const h=host();
    const status=!h?'<p class="hint">当前环境不能购买，请在易次元里打开游戏。</p>':!checked?'<p class="hint" role="status">正在核对已购商品…</p>':'';
    const wallet=UI.shopWallet&&h&&typeof h.openWallet==='function'?' <button class="btn sm" data-onclick="A.shopWallet()">去充值</button>':'';
    return `${pageHeading('商城','用次元币购买；点「购买」后还要再确认一次才会付款。')}
     ${status}${note?`<p role="status">${esc(note)}${wallet}</p>`:''}
     ${summonView()}${owned.has('goldFinger')&&typeof eventFreqView==='function'?eventFreqView():''}
     <section class="save-section" aria-label="商品"><div class="save-slots">${products.map(productLine).join('')}</div></section>
     <p class="hint">银两到账到当前打开的存档，传位后新君照样能用；新开一局不带过去。立绘包、画师换像和金手指包跟着易次元账号走，换设备、开新朝也有效。${owned.has('painter')?'在妃嫔详情页点「更换立绘」即可换像。':''}</p>`;
  }
  // 立即召见: who can still be met, each through their own first-meeting scene.
  function summonTargets(){
    if(!S||S.over)return [];
    const list=[];
    const storyCast=typeof storyCastActive==='function'&&storyCastActive();
    if(storyCast)for(const [key,d] of Object.entries(STORY_CAST)){
      if(!editionAllows('story',key)||storyCastRecord(key)||livingStoryConsort(key))continue;
      list.push({id:'story:'+key,group:'剧情妃',name:key==='chuwan'?'方晚':d.sur+d.given,title:d.epithet});
    }
    if(typeof gouyiEncounter==='function'&&editionAllows('story','gouyi')&&careersActive()&&!S.flags.gouyiSeen&&!livingStoryConsort('gouyi'))
      list.push({id:'gouyi',group:'剧情妃',name:'赵令仪',title:'钩弋夫人'});
    if(typeof fenghuaActive==='function'&&fenghuaActive())for(const [key,d] of Object.entries(FENGHUA_PEOPLE)){
      if(!fenghuaReleased(key)||fenghuaPerson(key)||S.fenghua&&S.fenghua.admitted&&S.fenghua.admitted[key]||key==='xueHongjian'&&livingStoryConsort('hongjian'))continue;
      const consort=key==='xueHongjian'&&typeof hongjianContent==='function'&&hongjianContent()&&editionAllows('story','hongjian');
      list.push({id:'fenghua:'+key,group:consort?'剧情妃':'风华人物',name:d.name,title:consort?'笺铺知己':d.role});
    }
    return list;
  }
  const summonBlocked=()=>!S?'请先开始或读取一朝。':S.over?'这一朝已经结束。':typeof mourningActive==='function'&&mourningActive()?'服丧期间不召见新人，下个月再来。':'';
  function summonView(){
    if(!owned.has('goldFinger'))return '';
    if(!S)return '<section class="save-section" aria-label="立即召见"><h3>金手指 · 立即召见</h3><p class="hint">开始或读取一朝后，可在这里召见还没相遇的剧情妃和风华人物。</p></section>';
    const list=summonTargets(),blocked=summonBlocked()||(S.flags.goldFinger!==true?'正在登记金手指包，处理完当前事件后再来。':'');
    const groups=['剧情妃','风华人物'].map(group=>{
      const items=list.filter(t=>t.group===group);
      return items.length?`<p><b>${group}</b></p><div class="acts">${items.map(t=>`<button class="btn sm jade" data-onclick="A.goldSummon('${t.id}')" ${blocked||modalOpen?'disabled':''}>${esc(t.name)}<small>${esc(t.title)}</small></button>`).join('')}</div>`:'';
    }).join('');
    return `<section class="save-section" aria-label="立即召见"><h3>金手指 · 立即召见</h3>
     <p class="hint">点名字，立刻开始与这位人物的初遇剧情，不受时间、地点和前置条件限制，也不耗精力。之后的故事照常展开。</p>
     ${blocked?`<p role="status">${esc(blocked)}</p>`:''}${groups||'<p class="hint">本朝的剧情妃和风华人物都已经相遇过了。</p>'}</section>`;
  }
  // Runs inside the action journal (A.goldSummon), so it reads only the world, never the store.
  function summon(id){
    if(!S||S.flags.goldFinger!==true||modalOpen||summonBlocked()||!summonTargets().some(t=>t.id===id))return false;
    const [kind,key]=id.split(':');
    if(kind==='story'){
      const r=storyCastCreate(key);if(!r)return false;
      // Met before the usual year: the story keeps her listed age.
      r.person.age=Math.max(r.person.age,STORY_CAST[key].age);
      setScene((key==='luwan'||key==='ayimu'&&whiteSpringBanquetActive())?'garden':'city');
      pushEv(storyCastMeetEvent(key,r));
    }else if(kind==='gouyi'){
      const ev=gouyiEncounter();if(!ev)return false;
      setScene('garden');pushEv(ev);
    }else if(kind==='fenghua'){
      const ev=fenghuaMeetEvent(key,true);if(!ev)return false;
      fenghuaState().attempts[key]=S.turn;setScene('city');pushEv(ev);
    }else return false;
    return true;
  }
  // 画师换像: ordinary consorts only; story characters keep their own art.
  function repaintable(c){
    return !!c&&c.alive&&!c.gone&&!c.fixedStory&&!c.fenghuaKey&&!c.jinyiwei&&c.official===undefined&&!c.sex&&!c.isMom&&
      (c.portraitOverride==null||c.paintedPortrait!=null)&&!Object.values(STORY_CONSORT_PORTRAITS).includes(c.artPortrait);
  }
  const PAGE=24;
  function galleryCells(){return ALL_CONSORT_PORTRAITS.filter((cell,i,all)=>all.indexOf(cell)===i&&cellOpen(cell));}
  function repaintButton(c){
    if(!enabled||!owned.has('painter')||!repaintable(c))return '';
    return ` <button class="btn sm" data-onclick="A.repaint(${c.id})">更换立绘</button>`;
  }
  function pickView(){
    const c=byId(UI.repaintFor);
    if(!c||!repaintable(c)||!owned.has('painter'))return view();
    const cells=galleryCells(),pages=Math.max(1,Math.ceil(cells.length/PAGE)),page=Math.min(Math.max(0,UI.repaintPage||0),pages-1);
    const shown=cells.slice(page*PAGE,page*PAGE+PAGE);
    const current=portraitCell(c);
    return `${pageHeading('更换立绘',`为${esc(cName(c))}挑一张立绘`,`<button class="btn sm" data-onclick="A.repaintDone()">返回</button>`)}
     <div class="acts">${c.paintedPortrait!=null?`<button class="btn sm" data-onclick="A.repaintPick(${c.id},-1)">恢复原立绘</button>`:''}
      <button class="btn sm" data-onclick="A.repaintPage(-1)" ${page?'':'disabled'}>上一页</button><span class="hint">${page+1} / ${pages}</span><button class="btn sm" data-onclick="A.repaintPage(1)" ${page<pages-1?'':'disabled'}>下一页</button></div>
     <div class="shop-gallery">${shown.map(cell=>`<button class="btn shop-cell${cell===current?' on':''}" data-onclick="A.repaintPick(${c.id},${cell})" aria-label="立绘 ${cell}">${porImg({id:'shop-pick-'+cell,portraitOverride:cell,alive:true,seed:cell,rank:0},96)}<small>${esc(PORTRAIT_CLOTHES[cell]||'')}</small></button>`).join('')}</div>
     ${PalaceShop.lockedCount()?`<p class="hint">另有 ${PalaceShop.lockedCount()} 张在立绘包里，购买后可选。</p>`:''}`;
  }
  return {enabled,cellOpen,refresh,deliver,buy,view,pickView,repaintButton,repaintable,summon,summonTargets,
    owns:key=>owned.has(key),
    lockedCount:()=>Object.entries(PORTRAIT_PACKS).reduce((n,[pack,info])=>n+(packOwned(pack)?0:info.cells.length),0),
    get products(){return products.slice();},
    _setOwned(keys){owned.clear();for(const k of keys)own(k);checked=true;}};
})();

if(PalaceShop.enabled){
  MENU.splice(MENU.length-1,0,['shop','商城']);
  DOCK_ART.shop='M7 12h18l-1.6 13H8.6L7 12zM11 12V9a5 5 0 0 1 10 0v3M12 17h8';
  A.shopConfirm=function(key){UI.shopConfirm=key;UI.shopWallet=false;render();};
  A.shopBuy=function(key){return PalaceShop.buy(key);};
  A.shopWallet=function(){const h=globalThis.PALACE_HOST&&PALACE_HOST.store;if(h&&h.openWallet)h.openWallet();};
  A.repaint=function(id){UI.repaintFor=id;UI.repaintPage=0;UI.view='portrait-pick';render();};
  A.repaintPage=function(step){UI.repaintPage=(UI.repaintPage||0)+step;render();};
  A.repaintDone=function(){UI.view='consort';UI.sel=UI.repaintFor;render();};
  A.repaintPick=function(id,cell){
    const c=byId(id);
    if(!PalaceShop.owns('painter')||!PalaceShop.repaintable(c)||!S||modalOpen||PalaceActions.busy||S.pendingActions){toast('现在不能更换立绘');return;}
    if(cell<0){delete c.portraitOverride;delete c.paintedPortrait;}
    else{if(!ALL_CONSORT_PORTRAITS.includes(cell)||!PalaceShop.cellOpen(cell)){toast('这张立绘还没有解锁');return;}c.portraitOverride=cell;c.paintedPortrait=cell;}
    save('auto');toast('立绘已更换');UI.view='consort';UI.sel=id;render();
  };
  A.goldSummon=function(id){if(!PalaceShop.summon(id))toast('现在不能召见');render();};
  PalaceActions.install(['goldSummon']);
}
