const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

const setup=`S.year=15;S.turn=174;S.month=7;E().age=40;E().energy=100;E().treasury=2000;E().people=50;E().prestige=50;
 var fixed={};
 for(const key of Object.keys(STORY_CAST_LIVES)){
   const r=storyCastCreate(key);
   if(key==='chuwan'){r.revealed=true;r.person.sur='楚';r.person.fam.t='前朝遗孤';}
   storyCastAdmit(r.person,r,'测试册封');fixed[key]=byId(r.id);
 }
 storyCastRecord('suheng').amends=true;
 S.turn+=2;
 var chapter=(key,n=0,kind='chapter')=>{A.storyCastLife(fixed[key].id,kind);assert.ok(curEv?.title,key);choose(n);drain();};
 var walk=(key,actions)=>{for(const n of actions){chapter(key,n);S.turn=storyCastRecord(key).life.due;}};`;

test('all six complete their three palace chapters and unlock a playable, character-specific follow-up',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(setup+`
  var own=makeKid(fixed.luwan,'m','铭弓');own.born=S.turn-8*12;own.policy='习武';own.mar=45;
  var translator=makeKid(fixed.ayimu,'f','清竹');translator.born=S.turn-8*12;translator.whiteSpringStudy=true;
  var wanKid=makeKid(fixed.chuwan,'f','晓霜');wanKid.born=S.turn-9*12;
  fixed.qingyi.aff=60;fixed.suheng.aff=60;E().health=64;
  walk('qingyi',[1,0,0]);chapter('qingyi',1,'routine');
  assert.equal(storyCastRecord('qingyi').life.next,S.turn+4);
  assert.equal(storyCastLifeEvent(fixed.qingyi,'routine'),null);assert.match(storyCastLifeEvent(fixed.qingyi,'secret').title,/秋夜归笺/);chapter('qingyi',0,'secret');
  assert.equal(storyCastLifeEvent(fixed.qingyi,'secret'),null);
  walk('luwan',[0,0,0]);var before=own.mar;chapter('luwan',0,'routine');assert.equal(own.mar,before+3);
  walk('ayimu',[0,0,0]);assert.match(storyCastLifeEvent(fixed.ayimu,'routine').choices[0].t,/75%/);
  S.month=4;assert.match(storyCastLifeEvent(fixed.ayimu,'secret').title,/母亲的香囊/);chapter('ayimu',0,'secret');S.month=7;
  S.flags.grainReserveGen=S.gen;walk('chuwan',[0,0,0]);assert.ok(halfGrainReserve());
  chapter('chuwan',0,'routine');assert.equal(grainReserveReady(),false);
  assert.match(storyCastLifeEvent(fixed.chuwan,'secret').title,/一只旧木碗/);
  var treasury=E().treasury;walk('suheng',[0,0,0]);assert.equal(E().treasury,treasury-4);
  chapter('suheng',0,'routine');assert.equal(E().treasury,treasury+1);
  assert.match(storyCastLifeEvent(fixed.suheng,'secret').title,/一味无香/);
  walk('xiaoman',[0,0,0]);assert.equal(storyCastLifeEvent(fixed.xiaoman,'routine'),null);
  assert.match(storyCastLifePanel(fixed.xiaoman),/排入下一场宫宴/);
  A.openBanquet();A.banquetInviteAll(true);A.holdBanquet();choose(0);drain();
  var cash=E().treasury;chapter('xiaoman',0,'routine');assert.equal(E().treasury,cash-6);
  assert.equal(storyCastRecord('xiaoman').life.performance,undefined);assert.match(storyCastLifeEvent(fixed.xiaoman,'secret').title,/多出一枚铜钱/);
  for(const key of Object.keys(fixed)){assert.equal(storyCastRecord(key).life.stage,3);assert.ok(fixed[key].story.length>=4);}
  `);
});

test('a pending new chapter replays with the original amount and pays once after reload',()=>{
 let b=world();b.ctx.assert=assert;
 b.run(setup+`A.storyCastLife(fixed.qingyi.id,'chapter');assert.match(curEv.title,/旧本退还/);save('auto');`);
 b=boot(423,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/旧本退还/);
  var r=storyCastRecord('qingyi'),money=E().treasury;
  choose(1);drain();assert.equal(E().treasury,money-6);assert.equal(r.life.path,'共校');
  A.storyCastLife(r.id,'chapter');assert.equal(modalOpen,false);assert.equal(r.life.stage,1);`);
});
