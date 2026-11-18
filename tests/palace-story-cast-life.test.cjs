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

test('garden dance follows the confirmed guest list and teaches a friend to accompany a later banquet',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`
  const r=storyCastCreate('ayimu');storyCastAdmit(r.person,r,'白泉宫宴');const dancer=byId(r.id);
  const outsider=makeGirl({sur:'冯',given:'丝雨',age:20});addConsort(outsider,2,'入宫');
  S.rel[rk(dancer,a)]=70;S.rel[rk(dancer,b)]=-55;b.scheme=70;
  A.openBanquet();A.banquetDance('solo');assert.equal(UI.banquet.dance,undefined);
  for(const c of [dancer,a,b])A.banquetGuest(c.id);
  A.banquetDance('solo');A.banquetGuest(dancer.id);assert.equal(UI.banquet.dance,undefined);
  A.banquetGuest(dancer.id);A.banquetDance('solo');let cost=E().treasury;
  A.holdBanquet();choose(3);drain();assert.equal(E().treasury,cost);assert.equal(dancer.gardenDrummers,undefined);
  A.holdBanquet();choose(0);assert.match(curEv.title,/泉上铃/);assert.match(curEv.portraitArt.src,/ayimu-dance/);
  assert.deepEqual([...dancer.gardenDrummers],[a.id]);assert.match(a.story.at(-1).t,/鼓/);assert.match(b.story.at(-1).t,/一曲可真长/);
  assert.ok(!outsider.story.some(e=>e.t.includes('白泉舞')));assert.equal(E().treasury,cost-15);drain();
  S.turn+=3;A.openBanquet();A.banquetInviteAll(true);assert.match(viewBanquet(),new RegExp('请'+fullName(a)+'伴鼓'));
  A.banquetDance(String(a.id));A.banquetInviteAll(false);assert.equal(UI.banquet.dance,undefined);
  A.banquetInviteAll(true);A.banquetDance(String(a.id));A.holdBanquet();choose(0);
  assert.match(curEv.title,/归泉/);assert.ok(a.story.some(e=>e.t.includes('为阿依慕伴鼓')));drain();
  S.turn+=3;S.rel[rk(dancer,a)]=-40;A.openBanquet();A.banquetInviteAll(true);A.banquetDance(String(a.id));
  assert.equal(UI.banquet.dance,undefined);assert.ok(!viewBanquet().includes('请'+fullName(a)+'伴鼓'));
  dancer.cold=true;assert.ok(!viewBanquet().includes('请阿依慕独舞'));
  for(const [key,tag] of Object.entries(STORY_CAST_TAGS))assert.ok(storyCastCodexCards().includes('<span class="tag y">'+tag+'</span>'),key);
 `);
});

test('reloading the solo performance keeps the paid banquet and its drum lesson exactly once',()=>{
 let b=world();b.ctx.assert=assert;
 b.run(`const r=storyCastCreate('ayimu');storyCastAdmit(r.person,r,'白泉宫宴');
   S.rel[rk(byId(r.id),a)]=80;A.openBanquet();A.banquetInviteAll(true);A.banquetDance('solo');
   A.holdBanquet();choose(0);assert.match(curEv.title,/泉上铃/);save('auto');`);
 b=boot(923,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/泉上铃/);
   const d=byId(storyCastRecord('ayimu').id);assert.equal(d.gardenDrummers.length,1);
   assert.equal(E().treasury,1985);drain();assert.equal(d.gardenDrummers.length,1);
   assert.equal(S.log.filter(e=>e.t.includes('再跳白泉舞')).length,1);`);
});

for(const choice of [0,1])test('six keepsake scenes branch once and settle actual consequences, choice '+choice,()=>{
 const b=world();b.ctx.assert=assert;b.ctx.n=choice;b.run(setup+`
 const kid=makeKid(fixed.ayimu,'f','清竹');kid.born=S.turn-8*12;kid.whiteSpringStudy=true;kid.lit=kid.hp=kid.vir=40;
 for(const [key,c] of Object.entries(fixed)){
  const life=storyCastRecord(key).life={stage:3,secret:S.turn-1,visits:0,settled:true};
  assert.equal(storyCastLifeEvent(c,'after'),null);life.secret--;const money=E().treasury;
  E().treasury=0;if(n===1&&['chuwan','xiaoman'].includes(key))assert.equal(storyCastLifeEvent(c,'after').choices[n].cond(),false);
  E().treasury=money;chapter(key,n,'after');assert.equal(life.after,S.turn);
  assert.equal(storyCastLifeEvent(c,'after'),null);assert.match(c.story.at(-1).t,new RegExp(STORY_CAST_LIVES[key].after));
  if(n===1&&['chuwan','xiaoman'].includes(key))assert.equal(E().treasury,money-6);
  if(n===1&&key==='suheng')assert.equal(E().treasury,money+8);
 }
 if(n===0){
  chapter('qingyi',1,'routine');assert.equal(kid.lit,45);
  chapter('luwan',0,'routine');assert.equal(kid.hp,45);
  const pop=E().people,treasury=E().treasury;
  chapter('chuwan',1,'routine');assert.equal(E().people,pop+2);
  chapter('suheng',0,'routine');assert.equal(E().treasury,treasury+7);
  storyCastRecord('xiaoman').life.performance=S.turn;chapter('xiaoman',0,'routine');assert.equal(E().people,pop+7);assert.equal(E().treasury,treasury+1);
 }else{assert.equal(kid.lit,50);assert.equal(kid.vir,44);assert.match(kid.story.map(e=>e.t).join(' '),/谱/);}
 `);
});
