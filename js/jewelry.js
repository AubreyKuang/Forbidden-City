/* Saved imperial gifts; transparent ornaments layer over the unchanged paintings. */
const JEWELRY_ART='./assets/images/palace-headpieces.png?v=1';
const JEWELRY={
  phoenix:{name:'九凤点翠冠',cell:0,box:[16,-8,80,80],desc:'金凤衔珠，翠羽舒展，珠串垂于两鬓。'},
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
function grantJewelry(c,id,reason='御前赏赐',{reactions=true}={}){
  const vault=ensureJewelry();if(!jewelryRecipient(c,id)||!(vault.stock[id]>0))return false;
  vault.stock[id]--;
  const gift=receiveJewelry(c,id,reason);
  jewelryRecord(`${fullName(c)}获赐${JEWELRY[id].name}，内库销去一件。`);
  if(reactions&&journalContentVersion()>=32)jewelryGiftReactions(c,JEWELRY[id].name,gift);
  save('auto');return true;
}
function receiveJewelry(c,id,reason){
  const gift={id,from:S.turn,date:dateStr(),reason};
  (c.jewelry||=[]).push(gift);c.jewelryWorn=id;
  const name=JEWELRY[id].name,proud=['骄纵','骄矜','贪财'].includes(c.trait),loves=c.like==='珠翠';
  cchg(c,{mood:proud||loves?20:12,aff:8,favor:3});setXin(c,'欢喜',`得赐${name}`);
  story(c,`获赐${name}，命宫人替自己戴上。${reason}。`);remember(c,'jewelry-gift',`陛下赐我${name}，我已收好。`);
  return gift;
}
function jewelryReactionStory(c,other,thread,title,text,emotion){
  const people=[c,other].map(person=>({id:person.id,name:fullName(person)}));
  story(c,`【${title}】${text}`);
  Object.assign(c.story.at(-1),{thread,life:{kind:'bond',title,turn:S.turn,gen:S.gen,people,source:'宫中赏赐'}});
  NPCMemory.record(S,{type:'jewelry-reaction',time:S.turn,participants:[c.id,other.id],object:title,outcome:text},[
    {person:c.id,subject:other.id,interpretation:text,emotion,impact:50,channel:'participant'}
  ]);
}
function jewelryRivalCanAsk(c,owner,id){
  return jewelryRecipient(c,id)&&inPalace(owner)&&c.favor>=75&&c.scheme<=40&&!isSolitary(c)&&
    ['骄纵','骄矜','善妒','贪财','爽直'].includes(c.trait)&&relGet(c,owner)<=-35&&
    S.turn-(c.lastJewelryRivalAsk??-99)>=12;
}
function jewelryGiftReactions(owner,name,gift){
  if(mourningActive()||owner.maid)return;
  const observers=harem().filter(c=>c!==owner&&!['悲恸','心如死灰'].includes(xinOf(c)));
  const rivals=gift?observers.filter(c=>jewelryRivalCanAsk(c,owner,gift.id)):[];
  const petitioner=rivals.length&&chance(.45)?pick(rivals):null;
  let recorded=0;
  for(const c of petitioner?[petitioner,...observers.filter(o=>o!==petitioner)]:observers){
    const relation=relGet(c,owner),jealous=relation<0&&(TRAITS[c.trait]?.jealous||relation<=-25);
    const reactionChance=jealous ? .45 : c.like==='珠翠' ? .3 : .14;
    if(c!==petitioner&&!chance(reactionChance))continue;
    const thread=`jewelry-gift:${S.gen}:${S.turn}:${owner.id}:${c.id}:${gift?.id||'珠翠'}`;
    const news=`听说${fullName(owner)}得了${name}，`;
    const reaction=jealous?'她原不肯多问，却忍不住拿两人的赏赐相比。回到自己宫里，连手边的妆匣也不想再开。':
      relation>=30?'她替对方高兴，也忍不住想，若哪日也能收到这样合心意的东西便好了。':'她听宫人说起样式，颇有些羡慕，悄悄把喜欢的式样记了下来。';
    jewelryReactionStory(c,owner,thread,jealous?'听闻赏赐，心生妒意':'听闻赏赐，心生羡慕',news+reaction,jealous?-.35:.15);
    if(jealous)cchg(c,{mood:-2});
    if(c===petitioner)pushEv(jewelryRivalPetition(c,owner,gift,thread));
    if(++recorded>=3)break;
  }
}
function jewelryRivalPetition(c,owner,gift,thread){
  const {id}=gift,name=JEWELRY[id].name,gen=S.gen,turn=S.turn,wantsOriginal=relGet(c,owner)<=-50;
  let shown=false,settled=false;
  const valid=()=>!settled&&S.gen===gen&&S.turn===turn&&byId(c.id)===c&&byId(owner.id)===owner&&owner.jewelry?.includes(gift)&&
    (shown?jewelryRecipient(c,id)&&inPalace(owner):jewelryRivalCanAsk(c,owner,id));
  const cl=fullName(c),other=fullName(owner),title=wantsOriginal?'争一件御赐首饰':'也想要一件同款';
  const request=wantsOriginal?`臣妾就想要${other}戴的那一件。陛下若舍不得收回，另赏臣妾一件同式的也好。`:`臣妾瞧见${other}那件${name}，也想讨一件同式的。陛下可肯赏臣妾？`;
  const record=(person,peer,text,emotion)=>jewelryReactionStory(person,peer,thread,title,text,emotion);
  return {title,por:c,cast:[owner],present:[c,owner],jewelry:id,valid,
    onShow:()=>{if(shown)return;shown=true;c.lastJewelryRivalAsk=S.turn;record(c,owner,`见${other}得了${name}，她当面开口：“${request}”`,-.3);
      record(owner,c,`${cl}当着她的面${wantsOriginal?'索要御赐的那一件':'讨一件同样的'}${name}。她下意识扶了扶鬓边。`,-.2);},
    text:`${cl}见${other}戴着御赐的${name}，当面走上前来。\n“${request}”`,choices:[
      ...(wantsOriginal?[{t:'收回原件，改赐给她',f:()=>{
        if(!valid())return null;settled=true;
        owner.jewelry.splice(owner.jewelry.indexOf(gift),1);if(owner.jewelryWorn===id)owner.jewelryWorn='';
        receiveJewelry(c,id,`从${other}处收回后转赐`);
        jewelryRecord(`${other}的${name}奉旨收回，原件改赐${cl}。`);
        cchg(owner,{mood:-15,aff:-8});relAdd(c,owner,-12);
        if(['平和','欢喜','释然'].includes(xinOf(owner)))setXin(owner,'委屈',`御赐的${name}被收回转赠`,null,{record:false});
        record(owner,c,`${name}已交还，亲眼见它被改赐给${cl}。她照礼谢了恩，回宫后却把空匣收到了柜底。`,-.8);
        record(c,owner,`陛下将原赐${other}的那一件${name}改赐给她。她当时称心，却也看清了对方离开时的脸色。`,.45);
        return `${other}把${name}摘下来，交给了内侍。${cl}接过原件，${other}沉默着退了出去。`;
      }}]:[]),
      {t:'从内库另赐一件同款',cond:()=>valid()&&ensureJewelry().stock[id]>0,why:'内库没有同款现货',f:()=>{
        if(!valid()||!grantJewelry(c,id,'另赐内库同款',{reactions:false}))return null;settled=true;
        record(c,owner,`内库另取一件同款${name}赐给她。她接过自己的那一件，终于收住了话头。`,.4);
        record(owner,c,`陛下从内库另赐${cl}一件同款${name}。原来获赐的那一件仍归她自己。`,.2);
        return `内库呈上一件同式的${name}给${cl}。${other}的原件仍归她自己。`;
      }},
      {t:'不因争抢另行赏赐',f:()=>{
        if(!valid())return null;settled=true;cchg(c,{mood:-6});
        record(c,owner,`讨要${name}未获应允。她没有再开口，回去的路上仍有些不甘。`,-.35);
        record(owner,c,`陛下回绝了${cl}当面讨要${name}的请求。她在袖中松开了攥紧的手。`,.25);
        return `你回绝了${cl}的请求。两人各自退下，争执暂且止住。`;
      }}]};
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
