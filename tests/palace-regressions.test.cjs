const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function source(from,to){return html.slice(html.indexOf(from),html.indexOf(to,html.indexOf(from)));}
function setup(d={name:'沈太后',alive:true}){
  const S={flags:{dowager:d},emp:{sur:'萧'},consorts:[],children:[],turn:1,month:1};
  let id=100;
  const ctx=vm.createContext({S,SUR:['沈','苏'],pick:a=>a[0],ri:a=>a,fullName:c=>c.sur+'兰',remember:()=>{},story:()=>{},R:()=>.5,chance:()=>false,kidsAlive:()=>S.children,makeGirl:o=>({id:id++,alive:true,favor:10,lastBirth:-99,trait:'温婉',...o}),addConsort:g=>{g.enteredAt=S.turn;S.consorts.push(g)},chg:()=>'',fx:()=>'',harem:()=>S.consorts,byId:id=>S.consorts.find(c=>c.id===id),relGet:()=>80,rd:Math.round,esc:String});
  vm.runInContext(source('function ensureDowager()','function festival()'),ctx);
  vm.runInContext(source('const fosterOf=','const raisesKid='),ctx);
  vm.runInContext(source('function relWord(','function initKidRel('),ctx);
  vm.runInContext(source('function conKidLine(','/* ============ 家族'),ctx);
  return ctx;
}
test('discarded optional proposal does not consume cooldown or create kin links',()=>{
  const c=setup();c.dowagerEvent();assert.equal(c.S.flags.dowager.lastOffer,null);assert.equal(c.S.consorts.length,0);
  assert.equal(c.dowagerEvent().por.sur,'沈');
});
test('accepted introduction waits for sustained neglect, then creates a younger same-clan cousin',()=>{
  const c=setup(),first=c.dowagerEvent();first.onShow();first.choices[0].f();const elder=c.S.consorts[0];elder.age=20;
  for(let t=2;t<25;t++){c.S.turn=t;c.dowagerTick();assert.equal(c.dowagerEvent(),null)}
  c.S.turn=25;c.dowagerTick();const ev=c.dowagerEvent();assert.ok(ev);assert.match(ev.text,/久未承宠/);
  assert.equal(elder.kin,undefined);assert.equal(ev.por.sur,elder.sur);assert.equal(ev.por.clan,elder.clan);assert.ok(ev.por.age<elder.age);
  ev.onShow();ev.choices[0].f();assert.equal(elder.kin[ev.por.id],'堂妹');assert.equal(ev.por.kin[elder.id],'堂姐');
  assert.equal(c.dowagerEvent(),null);
});
test('declining waits twelve months and creates no family members',()=>{
  const c=setup(),ev=c.dowagerEvent();ev.onShow();ev.choices[1].f();
  c.S.turn=12;assert.equal(c.dowagerEvent(),null);c.S.turn=13;assert.ok(c.dowagerEvent());assert.equal(c.S.consorts.length,0);
  const saved=JSON.parse(JSON.stringify(c.S.flags.dowager));assert.equal(saved.lastOffer,1);assert.equal(saved.cooldown,12);
});
function established(){const c=setup();c.ensureDowager();c.S.turn=30;c.S.consorts=[{id:1,sur:'沈',clan:'沈|太后母家',fam:{t:'太后母家',p:72},alive:true,age:24,enteredAt:1,favor:60,lastBirth:-99}];return c;}
test('two years without children is eligible even if favored',()=>{const c=established();assert.match(c.dowagerEvent().text,/膝下仍无子女/)});
test('pregnancy, cold palace, a short stay, or a happy mother prevents another proposal',()=>{
  for(const change of [{preg:2},{cold:true},{enteredAt:20},{lastBirth:15}]){const c=established();Object.assign(c.S.consorts[0],change);assert.equal(c.dowagerEvent(),null)}
  const c=established();c.S.children=[{mom:1,alive:false}];assert.equal(c.dowagerEvent(),null);
});
test('renewed favor resets sustained neglect; no fabricated years on old-save migration',()=>{
  const c=established(),g=c.S.consorts[0];g.lastBirth=10;g.favor=5;g.neglectedSince=2;
  g.favor=60;c.dowagerTick();assert.equal(g.neglectedSince,undefined);g.favor=5;c.dowagerTick();assert.equal(g.neglectedSince,30);assert.equal(c.dowagerEvent(),null);
  delete g.enteredAt;c.ensureDowager();assert.equal(g.enteredAt,30);
});
test('legacy save repairs inconsistent maternal surnames/clans without deleting characters',()=>{
  const c=setup({name:'太后',alive:true});
  c.S.consorts=[{id:1,sur:'苏',clan:'苏|太后母家',fam:{t:'太后母家',p:60}},{id:2,sur:'林',clan:'林|太后母家',fam:{t:'太后母家',p:65}}];
  c.ensureDowager();c.ensureDowager();
  assert.equal(c.S.consorts.length,2);assert.ok(c.S.consorts.every(g=>g.sur==='苏'&&g.clan==='苏|太后母家'));assert.equal(c.dowagerEvent(),null);
});
test('successor dowager retains actual maternal clan and gets a fresh introduction',()=>{
  const c=setup({name:'顾太后',sur:'顾',fam:{t:'翰林学士',p:50},clan:'顾|翰林学士',recommended:false,alive:true});
  const ev=c.dowagerEvent();assert.equal(ev.por.sur,'顾');assert.equal(ev.por.fam.t,'翰林学士');assert.equal(ev.por.clan,'顾|翰林学士');
});
test('dead dowager never introduces a candidate',()=>{assert.equal(setup({name:'太后',alive:false}).dowagerEvent(),null)});
test('biological identity survives foster placement and any affection score',()=>{
  const c=setup(),mom={id:1,alive:true},foster={id:2,alive:true};c.S.consorts=[mom,foster];
  for(const sex of ['m','f'])for(const affection of [-90,0,80]){
    const k={id:3,mom:1,foster:2,sex,alive:true,name:'承安'};c.S.children=[k];
    const label=sex==='m'?'亲生皇子':'亲生公主';
    assert.equal(c.relWord(affection,'ck',mom,k),label);
    assert.ok(c.conKidLine(mom).includes(label));assert.ok(!c.conKidLine(mom).includes('视如己出'));
    assert.equal(c.relWord(80,'ck',foster,k),'视如己出');
  }
});
test('other relationship thresholds remain unchanged',()=>{const c=setup();assert.equal(c.relWord(80,'kk'),'手足情深');assert.equal(c.relWord(-80,'ck'),'敌视');assert.equal(c.relWord(80,'cc'),'情同姐妹')});
test('multiple later recommendations remain possible and cooldown survives a serialized reload',()=>{
  const c=established();for(const turn of [30,54,78]){c.S.turn=turn;const ev=c.dowagerEvent();assert.ok(ev);ev.onShow();ev.choices[0].f();c.S.flags.dowager=JSON.parse(JSON.stringify(c.S.flags.dowager));assert.equal(c.dowagerEvent(),null)}
  assert.equal(c.S.consorts.length,4);assert.ok(c.S.consorts.every(g=>g.sur==='沈'&&g.clan==='沈|太后母家'));
});
test('accepted relatives write independent persistent NPC memories through the actual memory implementation',()=>{
  const c=established();
  vm.runInContext(source('const NPCMemory =','/* ============ 工具'),c);
  vm.runInContext(source('function remember(c,','function deepLine('),c);
  const ev=c.dowagerEvent();ev.onShow();ev.choices[0].f();
  const memories=vm.runInContext('NPCMemory.recall(S,1)',c);assert.ok(memories.some(m=>String(m.interpretation).includes('堂妹')));
  const younger=vm.runInContext(`NPCMemory.recall(S,${ev.por.id})`,c);assert.ok(younger.some(m=>String(m.interpretation).includes('堂姐')));
  assert.notEqual(memories[0].interpretation,younger[0].interpretation);
});
