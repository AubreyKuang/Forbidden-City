// 敬事房 · 翻牌子 pop-up (js/cards-sheet.js): editions with features.cardsDock:false take
// 翻牌子 out of the bottom bar and open it from 后宫; other editions keep the bar as it is.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const MENU_ITEMS=[['map','宫城'],['harem','后宫'],['cards','翻牌子'],['sys','存档']];
function load(config){
  const context=vm.createContext({PALACE_EDITION_CONFIG:config,MENU:MENU_ITEMS.map(m=>m.slice()),A:{},S:null,modalOpen:false,viewCards:()=>'<h2>敬事房 · 翻牌子</h2>'});
  vm.runInContext(read('js/edition.js'),context);vm.runInContext(read('js/cards-sheet.js'),context);
  return {context,sheet:vm.runInContext('CardsSheet',context),menu:context.MENU.map(m=>m[0]).join()};
}
test('the web edition keeps 翻牌子 in the bottom bar',()=>{
  const {sheet,menu,context}=load(null);
  assert.equal(sheet.enabled,false);assert.equal(menu,'map,harem,cards,sys');assert.equal(context.A.cardsSheet,undefined);
});
test('the 易次元 edition moves 翻牌子 into 后宫',()=>{
  const config=JSON.parse(read('scripts/yiciyuan-edition.json'));
  const {sheet,menu,context}=load(config);
  assert.equal(sheet.enabled,true);assert.equal(menu,'map,harem,sys');assert.equal(typeof context.A.cardsSheet,'function');
});
test('后宫 offers the pop-up only where the bar has no 翻牌子',()=>{
  const views=read('js/views.js');
  assert.match(views,/data-onclick="A\.cardsSheet\(\)">敬事房 · 翻牌子</);
  assert.match(views,/if\(typeof CardsSheet==='undefined'\|\|!CardsSheet\.enabled\)return residence;/);
});
