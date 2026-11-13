/* Saved imperial gifts; transparent ornaments layer over the unchanged paintings. */
const JEWELRY_ART='./assets/images/palace-headpieces.png?v=1';
const JEWELRY={
  phoenix:{name:'九凤点翠冠',cell:0,box:[16,-2,80,80],desc:'金凤衔珠，翠羽舒展，珠串垂于两鬓。'},
  blossoms:{name:'花树珠翠冠',cell:1,box:[14,-2,80,80],desc:'花枝攒成轻冠，珠玉错落，繁而不重。'},
  goldphoenix:{name:'金凤衔珠冠',cell:2,box:[16,-1,72,72],desc:'一凤舒翼，细金尾羽间缀着红珠。'},
  peony:{name:'牡丹花簪',cell:3,box:[0,3,48,48],desc:'粉白牡丹压鬓，金叶间垂着两点珠光。'},
  peacock:{name:'孔雀步摇',cell:4,box:[-1,1,52,52],desc:'翠尾开屏，玉坠随步轻摇。'},
  jade:{name:'白玉流苏步摇',cell:5,box:[1,3,48,48],desc:'白玉琢花，三缕珠穗衬着一滴浅碧。'}
};
function ensureJewelry(){
  return S.jewelry ||= {version:1,stock:{peony:1,jade:1},received:{peony:1,jade:1},lastTribute:S.turn,lastRequest:-99,
    history:[{d:dateStr(),t:'御府旧藏点验：牡丹花簪、白玉流苏步摇各一件，交内库保管。'}]};
}
function jewelryRecord(text){const vault=ensureJewelry();vault.history.push({d:dateStr(),t:text});if(vault.history.length>40)vault.history.shift();log(text);}
function jewelryOwned(c,id){return !!c?.jewelry?.some(item=>item.id===id);}
function jewelryWorn(c){return JEWELRY[c?.jewelryWorn]&&jewelryOwned(c,c.jewelryWorn)?c.jewelryWorn:'';}
function jewelryRecipient(c,id){return !!(inPalace(c)&&!c.maid&&JEWELRY[id]&&!jewelryOwned(c,id)&&!S.over);}
function jewelryImage(id,size=110){
  const item=JEWELRY[id];if(!item)return '';
  return `<svg class="jewelry-art" role="img" aria-label="${item.name}" width="${size}" height="${size}" viewBox="${item.cell%3*512} ${Math.floor(item.cell/3)*512} 512 512"><image href="${JEWELRY_ART}" width="1536" height="1024"/></svg>`;
}
function grantJewelry(c,id,reason='御前赏赐'){
  const vault=ensureJewelry();if(!jewelryRecipient(c,id)||!(vault.stock[id]>0))return false;
  vault.stock[id]--;c.jewelry ||= [];c.jewelry.push({id,from:S.turn,date:dateStr(),reason});c.jewelryWorn=id;
  const name=JEWELRY[id].name,proud=['骄纵','骄矜','贪财'].includes(c.trait),loves=c.like==='珠翠';
  cchg(c,{mood:proud||loves?20:12,aff:8,favor:3});setXin(c,'欢喜',`得赐${name}`);
  story(c,`获赐${name}，命宫人替自己戴上。${reason}。`);remember(c,'jewelry-gift',`陛下赐我${name}，我已收好。`);
  jewelryRecord(`${fullName(c)}获赐${name}，内库销去一件。`);save('auto');return true;
}
function jewelryGiveEvent(c,id,reason){
  if(!jewelryRecipient(c,id)||!(ensureJewelry().stock[id]>0))return null;
  const item=JEWELRY[id];
  return {title:'赐予珍饰',por:c,jewelry:id,valid:()=>jewelryRecipient(c,id)&&ensureJewelry().stock[id]>0,
    text:`将内库的「${item.name}」赐给${fullName(c)}？\n${item.desc}\n赐出后归她所有，立绘会佩戴这件首饰；以后仍可换戴或收起。`,choices:[
      {t:'赐给她，替她戴上',f:()=>grantJewelry(c,id,reason)?`${fullName(c)}谢过赏赐，转身对镜，轻轻扶正了${item.name}。`:null},
      {t:'再想一想'}]};
}
function jewelryRecipientEvent(id,page=0){
  const people=alive().filter(c=>jewelryRecipient(c,id)),size=6;
  page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(people.length/size)-1)));
  return {title:'挑选受赏之人',text:`${JEWELRY[id].name} · 内库现存${ensureJewelry().stock[id]||0}件\n${people.length?'想把这件珍饰送给谁？':'眼下没有合适的受赏之人，已拥有此物的人不会重复领取。'}`,choices:[
    ...people.slice(page*size,(page+1)*size).map(c=>({t:`${cName(c)} · ${fullName(c)}`,person:c,f:()=>{pushNow(jewelryGiveEvent(c,id));return null;}})),
    ...(page>0?[{t:'上一页',f:()=>{pushNow(jewelryRecipientEvent(id,page-1));return null;}}]:[]),
    ...((page+1)*size<people.length?[{t:'下一页',f:()=>{pushNow(jewelryRecipientEvent(id,page+1));return null;}}]:[]),{t:'留在内库'}]};
}
A.jewelryRecipient=function(id){if(S.over||modalOpen||!JEWELRY[id]||!(ensureJewelry().stock[id]>0))return;pushEv(jewelryRecipientEvent(id));};
A.jewelryGift=function(person,id){if(modalOpen||S.over)return;pushEv(jewelryGiveEvent(byId(person),id));};
A.jewelryChoose=function(person){
  const c=byId(person);if(S.over||!inPalace(c)||c.maid)return;
  const ids=Object.keys(JEWELRY).filter(id=>ensureJewelry().stock[id]>0&&jewelryRecipient(c,id));
  pushNow({title:'挑选内库首饰',por:c,text:ids.length?'从内库挑一件珍饰送给她。':'眼下没有可赠的新首饰，节庆献礼或地方进献会添入内库。',choices:[
    ...ids.map(id=>({t:JEWELRY[id].name,f:()=>{pushNow(jewelryGiveEvent(c,id));return null;}})),{t:'暂不赏赐'}]});
};
A.jewelryWear=function(person,id){
  const c=byId(person);if(modalOpen||S.over||!inPalace(c)||c.maid||(id&&!jewelryOwned(c,id))||(id&&!JEWELRY[id])||jewelryWorn(c)===id)return;
  c.jewelryWorn=id;
  story(c,id?`今日换戴了${JEWELRY[id].name}。`:'将御赐珍饰妥善收起，恢复平日的装扮。');save('auto');render();
};
function jewelryPanel(c){
  const owned=(c.jewelry||[]).filter(item=>JEWELRY[item.id]);if(!owned.length)return '';
  const active=inPalace(c)&&!S.over,worn=jewelryWorn(c);
  return `<div class="jewelry-owned">${owned.map(item=>`<div class="jewelry-piece">${jewelryImage(item.id,72)}<div><strong>${JEWELRY[item.id].name}</strong><p class="hint">${esc(item.date)}获赐 · ${esc(item.reason)}</p>${active?`<button class="btn sm ${worn===item.id?'gold':'jade'}" onclick="A.jewelryWear(${c.id},'${item.id}')" ${worn===item.id?'disabled':''}>${worn===item.id?'正在佩戴':'换戴'}</button>`:''}</div></div>`).join('')}</div>${active&&worn?`<button class="btn quiet sm" onclick="A.jewelryWear(${c.id},'')">收起珍饰，恢复原装扮</button>`:''}`;
}
function viewJewelryVault(){
  const vault=ensureJewelry();
  return `<button class="btn quiet sm" onclick="A.go('home')">← 返回御书房</button><h2>内库珍藏</h2><p>御府旧藏与各地献来的珍饰，都记在这本簿上。挑选一件，赐给心上之人。</p><div class="jewelry-grid">${Object.entries(JEWELRY).map(([id,item])=>`<section class="jewelry-card">${jewelryImage(id,130)}<h3>${item.name}</h3><p class="hint">${item.desc}</p><p>内库 ${vault.stock[id]||0} 件</p><button class="btn jade" onclick="A.jewelryRecipient('${id}')" ${S.over||!vault.stock[id]?'disabled':''}>${vault.stock[id]?'选人赏赐':'尚待进献'}</button></section>`).join('')}</div><h3>珍藏簿</h3><ul class="story">${vault.history.slice(-12).reverse().map(entry=>`<li><time>${esc(entry.d)}</time>${esc(entry.t)}</li>`).join('')}</ul>`;
}
function jewelryTributeEvent(){
  const vault=ensureJewelry();
  if(S.over||mourningActive()||S.turn-vault.lastTribute<12||![1,5,8,12].includes(S.month)||!chance(.35))return null;
  const ids=Object.keys(JEWELRY),least=Math.min(...ids.map(id=>vault.received[id]||0));
  const id=pick(ids.filter(id=>(vault.received[id]||0)===least)),item=JEWELRY[id];
  const source=S.month===1?'岁首贡礼':S.month===5?'端午呈巧':S.month===8?'中秋献礼':'江南织造进献';
  let received=false;
  const receive=()=>{if(received)return false;received=true;vault.stock[id]=(vault.stock[id]||0)+1;vault.received[id]=(vault.received[id]||0)+1;jewelryRecord(`${source}：${item.name}一件收入内库。`);save('auto');return true;};
  return {title:source,jewelry:id,valid:()=>!S.over&&!received,onQueue:()=>{vault.lastTribute=S.turn;},
    text:`内侍捧来锦匣，揭开软缎，露出一件「${item.name}」。\n${item.desc}\n来使呈上名帖，说明是工匠择料细作，随本次${source}一并送到。`,choices:[
      {t:'登记入内库，日后再赏',f:()=>receive()?`${item.name}已入内库。可从御书房的「内库珍藏」挑选受赏之人。`:null},
      {t:'当场挑一人赏赐',f:()=>{if(receive())pushNow(jewelryRecipientEvent(id));return null;}}]};
}
function jewelryRequestEvent(){
  const vault=ensureJewelry();if(S.over||mourningActive()||S.turn-vault.lastRequest<12)return null;
  const people=harem().filter(c=>['骄纵','骄矜','贪财'].includes(c.trait)&&c.mood>=55&&c.favor>=(c.preg>=2?50:65)&&S.turn-(c.lastJewelryRequest??-99)>=24&&Object.keys(JEWELRY).some(id=>vault.stock[id]>0&&!jewelryOwned(c,id)));
  if(!people.length||!chance(.08))return null;
  const c=pick(people),id=pick(Object.keys(JEWELRY).filter(id=>vault.stock[id]>0&&!jewelryOwned(c,id))),item=JEWELRY[id];
  return {title:'妆匣里还缺一件',por:c,jewelry:id,present:[c],valid:()=>jewelryRecipient(c,id)&&vault.stock[id]>0,
    onQueue:()=>{vault.lastRequest=S.turn;c.lastJewelryRequest=S.turn;},
    text:`${cName(c)}今日心情正好，说起内库的${item.name}，眼底藏不住欢喜。\n${c.preg>=2?'她轻抚衣襟：“近来闷在宫里，旁的倒不想，只想戴件称心的首饰。陛下舍得赏臣妾么？”':c.trait==='骄矜'?'她扶了扶鬓边：“臣妾瞧过那件珍饰，倒像是照着臣妾的心意做的。”':'她凑近些，笑道：“好东西总藏在匣里，可惜了。陛下不如赏给臣妾？”'}`,choices:[
      {t:`把${item.name}赏给她`,f:()=>grantJewelry(c,id,'亲口向陛下讨赏')?`她对镜戴好${item.name}，回身又向你笑了一笑。`:null},
      {t:'先留着，改日再说',f:()=>{story(c,`讨要${item.name}，陛下暂未应允。`);return fx(cchg(c,{mood:-3}));}},
      {t:'劝她节俭，不必争这一件',f:()=>{story(c,`讨要${item.name}时被劝节俭，心里有些不快。`);return fx(cchg(c,{mood:-6,favor:-2}));}}]};
}
