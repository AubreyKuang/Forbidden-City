// 易次元 shop (js/palace-shop.js): repeatable silver is delivered once per paid purchase
// into the open reign, one-time products follow the platform's paid count, and portrait
// packs stay out of new faces until the world records them. Builds without a shop config
// change nothing.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const editionSource=read('js/edition.js'),shopSource=read('js/palace-shop.js');
const SHOP=JSON.parse(read('scripts/yiciyuan-edition.json')).shop;

function fakeStore({paid={},values={},failPurchase=null}={}){
  const calls=[];
  return {calls,paid,values,store:{
    async paidCount(id){calls.push(['paid',id]);return paid[id]||0;},
    async purchase(id,price){calls.push(['buy',id,price]);if(failPurchase)throw failPurchase;paid[id]=(paid[id]||0)+1;return {};},
    async getValue(name){return values[name]??null;},
    async setValue(name,value){calls.push(['set',name,value]);values[name]=value;},
    openWallet(){calls.push(['wallet']);}
  }};
}
function load({shop=SHOP,store=null,pending=false,modal=false}={}){
  const logs=[],saves=[];
  const context=vm.createContext({console:{...console,warn(){}},setTimeout,
    PALACE_EDITION_CONFIG:shop?{edition:'yiciyuan',shop}:null,
    S:{emp:{treasury:800},flags:{},...(pending?{pendingActions:{}}:{})},
    UI:{view:'shop'},modalOpen:modal,PalaceActions:{busy:false,blocked:false},
    MENU:[['map','宫城'],['sys','存档']],DOCK_ART:{},A:{},
    PALACE_HOST:store?{store}:undefined,
    STORY_CONSORT_PORTRAITS:{gouyi:422},ALL_CONSORT_PORTRAITS:[1,2,316,339,346,515,520],PORTRAIT_CLOTHES:{},
    log:t=>logs.push(t),save:slot=>saves.push(slot),render(){},toast(){},esc:s=>String(s),
    pageHeading:t=>`<h2>${t}</h2>`,byId:()=>null,cName:()=>'',porImg:()=>'',portraitCell:()=>0});
  context.E=()=>context.S.emp;
  vm.runInContext(editionSource,context);vm.runInContext(shopSource,context);
  return {context,logs,saves,shop:vm.runInContext('PalaceShop',context)};
}

test('without a shop config nothing is sold and every portrait stays open',()=>{
  const {context,shop}=load({shop:null});
  assert.equal(shop.enabled,false);
  assert.equal(shop.cellOpen(316),true);assert.equal(shop.cellOpen(520),true);
  assert.equal(context.MENU.length,2);assert.equal(context.A.shopBuy,undefined);
});

test('the shop sits in the menu before 存档 when products exist',()=>{
  const {context}=load();
  assert.deepEqual(context.MENU.map(m=>m[0]),['map','shop','sys']);
  assert.ok(context.DOCK_ART.shop);
});

test('unbought pack portraits are closed; owning the pack records it on the world and opens them',async()=>{
  const host=fakeStore({paid:{'2485888261127004':1}});
  const {context,shop,saves}=load({store:host.store});
  assert.equal(shop.cellOpen(316),false);assert.equal(shop.cellOpen(515),false);assert.equal(shop.cellOpen(346),true);
  await shop.refresh();
  assert.ok(shop.owns('legendsPack'));
  assert.deepEqual([...context.S.flags.portraitPacks],['legends']);
  assert.equal(shop.cellOpen(316),true);
  assert.ok(saves.includes('auto'));
});

test('ownership waits while a scene is pending, so replays keep their pool',async()=>{
  const host=fakeStore({paid:{'2485888261127004':1}});
  const {context,shop}=load({store:host.store,pending:true});
  await shop.refresh();
  assert.ok(shop.owns('legendsPack'));
  assert.equal(context.S.flags.portraitPacks,undefined);
  assert.equal(shop.cellOpen(316),false);
});

test('silver is delivered once for each paid purchase, and only what is owed',async()=>{
  const host=fakeStore({paid:{'2485888261127001':2},values:{paid_silverSmall:'1'}});
  const {context,shop,logs}=load({store:host.store});
  await shop.refresh();
  assert.equal(context.S.emp.treasury,800+500);
  assert.equal(host.values.paid_silverSmall,'2');
  await shop.refresh();
  assert.equal(context.S.emp.treasury,800+500,'nothing owed twice');
  assert.equal(logs.length,1);
});

test('buying silver pays once and credits the open reign',async()=>{
  const host=fakeStore();
  const {context,shop}=load({store:host.store});
  await shop.buy('silverLarge');
  assert.deepEqual(host.calls.filter(c=>c[0]==='buy'),[['buy','2485888261127002',200]]);
  assert.equal(context.S.emp.treasury,800+2000);
  assert.equal(host.values.paid_silverLarge,'1');
});

test('silver is not bought while a scene is pending',async()=>{
  const host=fakeStore();
  const {context,shop}=load({store:host.store,modal:true});
  await shop.buy('silverSmall');
  assert.equal(host.calls.filter(c=>c[0]==='buy').length,0);
  assert.equal(context.S.emp.treasury,800);
});

test('a one-time product is not bought twice',async()=>{
  const host=fakeStore({paid:{'2485888261127003':1}});
  const {shop}=load({store:host.store});
  await shop.refresh();
  await shop.buy('painter');
  assert.equal(host.calls.filter(c=>c[0]==='buy').length,0);
});

test('too few coins offers the wallet; a failed purchase credits nothing',async()=>{
  const host=fakeStore({failPurchase:Object.assign(Error('short'),{code:'COIN_INSUFFICIENT'})});
  const {context,shop}=load({store:host.store});
  await shop.buy('silverSmall');
  assert.equal(context.S.emp.treasury,800);
  assert.equal(context.UI.shopWallet,true);
  assert.match(shop.view(),/次元币不足/);
});
