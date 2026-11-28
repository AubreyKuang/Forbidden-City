// 易次元 shop (js/palace-shop.js): repeatable silver is delivered once per paid purchase
// into the open reign, one-time products follow the platform's paid count, and portrait
// packs stay out of new faces until the world records them. Builds without a shop config
// change nothing.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const editionSource=read('js/edition.js'),shopSource=read('js/palace-shop.js');
const SHOP=JSON.parse(read('scripts/yiciyuan-edition.json')).shop;
const AMOUNT=key=>SHOP.products.find(p=>p.key===key).amount;

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
    S:{turn:7,emp:{treasury:800},flags:{},...(pending?{pendingActions:{}}:{})},
    UI:{view:'shop'},modalOpen:modal,installed:[],PalaceActions:{busy:false,blocked:false,install(names){context.installed.push(...names);}},
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
  assert.equal(context.S.emp.treasury,800+AMOUNT('silverSmall'));
  assert.equal(host.values.paid_silverSmall,'2');
  await shop.refresh();
  assert.equal(context.S.emp.treasury,800+AMOUNT('silverSmall'),'nothing owed twice');
  assert.equal(logs.length,1);
});

test('buying silver pays once and credits the open reign',async()=>{
  const host=fakeStore();
  const {context,shop}=load({store:host.store});
  await shop.buy('silverLarge');
  assert.deepEqual(host.calls.filter(c=>c[0]==='buy'),[['buy','2485888261127002',200]]);
  assert.equal(context.S.emp.treasury,800+AMOUNT('silverLarge'));
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

// 金手指包: a one-time bundle that also owns what it includes and opens 立即召见.
function summonWorld(extra={}){
  const pushed=[],created=[];
  const world={
    STORY_CAST:{qingyi:{sur:'沈',given:'清漪',age:20,epithet:'曾经的京城第一美人'},chuwan:{sur:'方',given:'晚',age:15,epithet:'旧籍里的名字'}},
    storyCastActive:()=>true,storyCastRecord:key=>world.records[key]||null,records:{},
    livingStoryConsort:()=>null,editionAllows:()=>true,whiteSpringBanquetActive:()=>true,
    storyCastCreate(key){const r={person:{age:3},stage:0};world.records[key]=r;created.push(key);return r;},
    storyCastMeetEvent:(key,r)=>({title:'meet '+key,r}),
    careersActive:()=>true,gouyiEncounter:()=>({title:'gouyi'}),
    fenghuaActive:()=>true,FENGHUA_PEOPLE:{gaoHuaibi:{name:'高怀璧',role:'边关功臣'},xueHongjian:{name:'薛红笺',role:'诗人与笺铺主人'}},
    fenghuaReleased:()=>true,fenghuaPerson:()=>null,hongjianContent:()=>true,
    fenghuaMeetEvent:(key,summoned)=>summoned?{title:'fenghua '+key}:null,
    fenghuaState(){return world.fh||(world.fh={attempts:{}});},
    mourningActive:()=>false,setScene(){},pushEv:ev=>pushed.push(ev),...extra};
  return {world,pushed,created};
}
function loadSummon(opts={},extra){
  const {world,pushed,created}=summonWorld(extra);
  const loaded=load(opts);
  Object.assign(loaded.context,world);
  return {...loaded,world,pushed,created};
}

test('the 金手指包 owns what it includes and records itself on the world',async()=>{
  const host=fakeStore();
  const {context,shop}=load({store:host.store});
  await shop.buy('goldFinger');
  assert.deepEqual(host.calls.filter(c=>c[0]==='buy'),[['buy','2485888261128001',198]]);
  assert.ok(shop.owns('goldFinger')&&shop.owns('painter')&&shop.owns('legendsPack'));
  assert.equal(context.S.flags.goldFinger,true);
  assert.deepEqual([...context.S.flags.portraitPacks],['legends']);
  await shop.buy('painter');
  assert.equal(host.calls.filter(c=>c[0]==='buy').length,1,'included products are not sold again');
});

test('a 金手指包 paid on another device is found on refresh',async()=>{
  const host=fakeStore({paid:{'2485888261128001':1}});
  const {context,shop}=load({store:host.store});
  await shop.refresh();
  assert.ok(shop.owns('painter'));assert.equal(context.S.flags.goldFinger,true);
});

test('立即召见 lists everyone not yet met and opens their first meeting',()=>{
  const {context,shop,pushed,created,world}=loadSummon();
  context.S.flags.goldFinger=true;
  assert.deepEqual(JSON.parse(JSON.stringify(shop.summonTargets().map(t=>[t.id,t.group]))),[
    ['story:qingyi','剧情妃'],['story:chuwan','剧情妃'],['gouyi','剧情妃'],['fenghua:gaoHuaibi','风华人物'],['fenghua:xueHongjian','剧情妃']]);
  assert.equal(shop.summon('story:chuwan'),true);
  assert.deepEqual(created,['chuwan']);
  assert.equal(world.records.chuwan.person.age,15,'met early, she keeps her listed age');
  assert.equal(shop.summon('fenghua:gaoHuaibi'),true);
  assert.equal(world.fh.attempts.gaoHuaibi,7);
  assert.deepEqual(pushed.map(e=>e.title),['meet chuwan','fenghua gaoHuaibi']);
  assert.ok(!shop.summonTargets().some(t=>t.id==='story:chuwan'),'met people leave the list');
});

test('立即召见 needs the pack on the world, no open scene and no mourning',()=>{
  const {context,shop,pushed}=loadSummon();
  assert.equal(shop.summon('gouyi'),false,'not owned');
  context.S.flags.goldFinger=true;context.modalOpen=true;
  assert.equal(shop.summon('gouyi'),false,'scene open');
  context.modalOpen=false;context.mourningActive=()=>true;
  assert.equal(shop.summon('gouyi'),false,'mourning');
  context.mourningActive=()=>false;
  assert.equal(shop.summon('nobody:x'),false);
  assert.equal(shop.summon('gouyi'),true);
  assert.equal(pushed.length,1);
});

test('the summon panel shows only to owners, and the action is journaled',()=>{
  const {context,shop}=loadSummon();
  assert.doesNotMatch(shop.view(),/aria-label="立即召见"/);
  shop._setOwned(['goldFinger']);context.S.flags.goldFinger=true;
  assert.match(shop.view(),/A\.goldSummon\('story:qingyi'\)/);
  assert.ok(context.installed.includes('goldSummon'));
  context.eventFreqView=()=>'<section aria-label="事件频率"></section>';
  assert.match(shop.view(),/aria-label="事件频率"/);
  shop._setOwned([]);assert.doesNotMatch(shop.view(),/aria-label="事件频率"/);
});

// The featured product (金手指包) leads the list and shows its contents before purchase.
test('the 金手指包 comes first and shows what it holds before it is bought',()=>{
  const {context,shop}=loadSummon();
  context.EVENT_FREQ_LEVELS={off:{label:'不触发'},low:{label:'小概率'},normal:{label:'常规'},high:{label:'高概率'}};
  context.EVENT_FREQ_CATEGORIES=[{id:'scheme',name:'宫斗与夺嫡',desc:'争风吃醋'},{id:'disaster',name:'天灾',desc:'黄河决堤'}];
  const html=shop.view();
  const order=[...html.matchAll(/<article class="save-slot shop-item[^"]*"><div class="save-slot-info"><b>([^<]+)<\/b>/g)].map(m=>m[1]);
  assert.equal(order[0],'金手指包');assert.equal(order.length,SHOP.products.length);
  assert.match(html,/shop-featured/);
  assert.match(html,/立即召见/);assert.match(html,/事件频率 · 2 类/);
  for(const label of ['不触发','小概率','常规','高概率'])assert.match(html,new RegExp(label));
  assert.match(html,/宫斗与夺嫡 · 天灾/);
  assert.match(html,/剧情妃 \d+ 位/);
  assert.match(html,/画师换像（单买 9\.9 元）/);
  shop._setOwned(['goldFinger']);context.S.flags.goldFinger=true;
  assert.doesNotMatch(shop.view(),/shop-contents/);
});
