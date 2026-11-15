// Representative rendered pages, including states whose controls must stay available.
const {boot}=require('./playtest-harness.cjs');
const cases=[
 ['home','viewHome()'],['government','viewGovernment()'],['harem','viewHarem()'],
 ['family-graph','viewFamily()'],['family-list','viewFamily()',"UI.familyMode='list'"],
 ['residences','viewResidences()'],['residence-selected','viewResidences()','UI.sel=c.id'],
 ['officials','officialsRoster()'],['official','viewOfficial()',"UI.sel=c.id+':father'"],
 ['officials-all','officialsRoster()',"UI.officialsFilter='all'"],
 ['officials-away','officialsRoster()',"houseOf(c).father.away=true;UI.officialsFilter='away'"],
 ['officials-gone','officialsRoster()',"houseOf(c).father.alive=false;UI.officialsFilter='gone'"],
 ['officials-from-government','officialsRoster()',"UI.pageFrom={officials:'government'}"],
 ['residences-from-harem','viewResidences()',"UI.pageFrom={residences:'harem'}"],
 ['official-retired','viewOfficial()',"houseOf(c).father.retired=true;UI.sel=c.id+':father'"],
 ['official-deceased','viewOfficial()',"houseOf(c).father.alive=false;UI.sel=c.id+':father'"],
 ['queen','viewConsort()','UI.sel=empress().id'],
 ['consort','viewConsort()','UI.sel=c.id'],
 ['pregnant','viewConsort()','c.preg=5;UI.sel=c.id'],
 ['cold','viewConsort()','c.cold=true;c.palace="冷宫";UI.sel=c.id'],
 ['maid','viewConsort()','c.maid=true;c.near=true;UI.sel=c.id'],
 ['deceased','viewConsort()','c.alive=false;UI.sel=c.id'],
 ['children','viewKids()'],['children-out','viewKids()',"UI.kidsResidence='out'"],
 ['child-young','viewKid()','k.born=S.turn-24;UI.sel=k.id'],
 ['child-fostered','viewKid()','k.born=S.turn-96;k.foster=empress().id;UI.sel=k.id'],
 ['child-teen','viewKid()','k.born=S.turn-156;UI.sel=k.id'],
 ['child-adult','viewKid()','k.born=S.turn-216;UI.sel=k.id'],
 ['child-deceased','viewKid()','k.alive=false;UI.sel=k.id'],
 ['out','viewOut()'],['log','viewLog()'],['saves','viewSys()'],
 ['saves-populated','viewSys()',"save('1');save('2');save('3');save('auto')"]
];
function renderCase([name,render,setup='']){
 const b=boot(6701);
 b.run(`A.start();drain();S.turn=240;S.year=21;S.month=1;E().energy=4;
  var c=harem().find(x=>x.rank!==8);c.rank=5;c.known=true;
  var k=makeKid(c,'m','承安');var sister=makeKid(c,'f','昭宁');
  k.born=S.turn-96;sister.born=S.turn-72;
  story(c,'与皇上谈起旧日家书，盼孩子平安长大。');kstory(k,'与母亲一同读诗。');
  UI.logF='all';${setup};`);
 return {name,html:b.run(render)};
}
// These are HTML strings from the game, not a browser substitute. Keep all text
// (including existing disclosures) and every inline control/availability attribute.
function signature(html){
 const tokens=html.match(/<(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+/g)||[];
 const controls=[],text=[];
 const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[x]).replace(/\s+/g,' ').trim();
 for(const token of tokens){
  if(!token.startsWith('<')){const s=decode(token);if(s)text.push(s);continue;}
  if(!/^<(button|input|select|option)\b/.test(token))continue;
  const attrs=Object.fromEntries([...token.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
  const kind=token.match(/^<(\w+)/)[1];
  if(attrs.onclick||attrs.onchange||attrs.onkeydown||kind==='option'||kind==='input')controls.push({kind,...Object.fromEntries(Object.entries(attrs).filter(([k])=>['onclick','onchange','onkeydown','value','type','accept','name','id','aria-pressed'].includes(k))),disabled:/\sdisabled(?:\s|>|=)/.test(token),selected:/\sselected(?:\s|>|=)/.test(token)});
 }
 return {controls,text};
}
module.exports={cases,renderCase,signature};
