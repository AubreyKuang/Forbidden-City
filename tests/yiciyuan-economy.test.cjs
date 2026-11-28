// 易次元 economy (config.economy): consorts cost 宫人用度 on top of their stipend and a 逾制
// fee past ten, 岁贡 follows 威望, and journals before content 165 keep the old sums.
// From content 167 the v167 step applies: tighter upkeep and 月常入, 月例 by age, a floor on
// how far 国库 may be overdrawn, 盐政 / 青苗法 enacted once, and a cooldown on selling 贡品.
// Builds without the setting keep the original numbers.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const economy=JSON.parse(fs.readFileSync(path.join(__dirname,'..','scripts/yiciyuan-edition.json'),'utf8')).economy;
const setup=`A.start();drain();for(const id of S.cands.slice(0,3).map(c=>c.id)){A.xxTake(id);drain();}A.xxEnd();drain();`;

test('without the setting, upkeep is the stipend and 岁贡 is 120',()=>{
  const b=boot(311);b.run(setup);
  const r=b.run(`({u:haremUpkeep(),stipend:alive().reduce((s,c)=>s+(c.cold?1:STIPEND[c.rank]),0),tribute:tributeAmount(),hint:haremUpkeepHint()})`);
  assert.equal(r.u.total,r.stipend);assert.equal(r.tribute,120);assert.equal(r.hint,'');
});
test('the 易次元 setting charges 宫人用度 per consort and 逾制 past ten',()=>{
  const b=boot(311,new Map(),{PALACE_EDITION_CONFIG:{edition:'sim',economy}});b.run(setup);
  const up=economy.v167.upkeep;
  const r=b.run(`(()=>{const u=haremUpkeep(),n=alive().filter(c=>!c.cold).length;
    while(alive().filter(c=>!c.cold).length<14){const g=makeGirl({sur:'试',given:'人'+S.consorts.length,age:18,trait:'沉静',fam:{t:'良家子',p:5}});addConsort(g,1,'测试');}
    const big=haremUpkeep();return {u,n,big,hint:haremUpkeepHint()};})()`);
  assert.equal(r.u.staff,r.n*up.staff);assert.equal(r.u.crowd,0);
  assert.equal(r.big.count,14);assert.equal(r.big.over,4);assert.equal(r.big.crowd,4*up.crowdFee);
  assert.equal(r.big.total,r.big.stipend+14*up.staff+4*up.crowdFee);
  assert.match(r.hint,/后宫现有 14 人[^]*已超出 4 人/);
});
test('month end charges the upkeep and the review shows it',()=>{
  const b=boot(312,new Map(),{PALACE_EDITION_CONFIG:{edition:'sim',economy}});b.run(setup);
  const r=b.run(`(()=>{const u=haremUpkeep().total;A.endMonth();drain();return {u,review:S.flags.lastMonthReview.upkeep};})()`);
  assert.ok(r.review);assert.equal(r.review.total,r.u);
});
test('岁贡 follows 威望 within its bounds; older journals keep 120',()=>{
  const b=boot(313,new Map(),{PALACE_EDITION_CONFIG:{edition:'sim',economy}});b.run(setup);
  const t=economy.tribute;
  const at=p=>b.run(`E().prestige=${p};tributeAmount()`);
  assert.equal(at(50),Math.round(t.base+50*t.perPrestige));
  assert.equal(at(0),t.min);assert.equal(at(1000),t.max);
  assert.equal(b.run(`(()=>{const real=journalContentVersion;journalContentVersion=()=>164;const v=tributeAmount();journalContentVersion=real;return v;})()`),120);
});

// Runs `body` with journalContentVersion() reporting `v`.
const atVersion=(b,v,body)=>JSON.parse(b.run(`(()=>{const real=journalContentVersion;journalContentVersion=()=>${v};try{return JSON.stringify((${body})());}finally{journalContentVersion=real;}})()`));
const plain=v=>JSON.parse(JSON.stringify(v));
const sim=seed=>{const b=boot(seed,new Map(),{PALACE_EDITION_CONFIG:{edition:'sim',economy}});b.run(setup);return b;};

test('journals from 165 to 166 keep the first step; 167 uses the second',()=>{
  const b=sim(321);
  const old=atVersion(b,166,`()=>({staff:haremUpkeep().staff,n:alive().filter(c=>!c.cold).length,inc:(E().people=80,monthlyBaseIncome()),debt:economyRule('debt')})`);
  assert.equal(old.staff,old.n*economy.upkeep.staff);assert.equal(old.inc,Math.round(45+80*1.1));assert.equal(old.debt,null);
  const now=b.run(`(()=>{E().people=80;return {staff:haremUpkeep().staff,n:alive().filter(c=>!c.cold).length,inc:monthlyBaseIncome()};})()`);
  const inc=economy.v167.income;
  assert.equal(now.staff,now.n*economy.v167.upkeep.staff);assert.equal(now.inc,Math.round(inc.base+80*inc.perPeople));
});
test('without the setting, 月常入 and 皇嗣月例 keep the original sums',()=>{
  const b=boot(322);b.run(setup);
  const r=b.run(`(()=>{E().people=80;return {inc:monthlyBaseIncome(),kid:childUpkeep({born:S.turn}),tutor:childUpkeep({born:S.turn,tutor:true}),rule:economyRule('debt')};})()`);
  assert.deepEqual(plain(r),{inc:Math.round(45+80*1.1),kid:3,tutor:8,rule:null});
});
test('皇嗣月例 rises with age',()=>{
  const b=sim(323),c=economy.v167.children;
  const at=(age,tutor=false)=>b.run(`childUpkeep({born:S.turn-${age}*12,tutor:${tutor}})`);
  assert.equal(at(2),c.young);assert.equal(at(c.schoolFrom),c.school);assert.equal(at(c.grownFrom),c.grown);assert.equal(at(8,true),c.school+c.tutor);
});
test('a choice the treasury cannot cover is disabled; the cheapest stays open when all are',()=>{
  const b=sim(324),floor=economy.v167.debt.floor;
  const r=b.run(`(()=>{
    E().treasury=50;
    const ev=guardChoiceTreasury({title:'试',choices:[{t:'拨银（国库-300万两）'},{t:'督办',preview:'成功花 150 万两 · 失利花 240 万两'},{t:'不拨'}]});
    const open=ev.choices.map(c=>!c.cond||c.cond());
    const all=guardChoiceTreasury({title:'试',choices:[{t:'甲',preview:'国库 −400 万两'},{t:'乙',preview:'国库 −300 至 −350 万两'}]});
    const allOpen=all.choices.map(c=>!c.cond||c.cond());
    E().treasury=200;const later=ev.choices.map(c=>!c.cond||c.cond());
    return {open,why:ev.choices[0].why,allOpen,later,costs:[choiceTreasuryCost({t:'国库 −150 至 −200 万两'}),choiceTreasuryCost({t:'国库 +250 万两'}),choiceTreasuryCost({t:'本月国库 −60 万两 · 下月底扣 80 万两'})]};})()`);
  // 50 − 300 < −200: blocked; 50 − 240 ≥ −200: open; free choice open.
  assert.deepEqual(plain(r.open),[50-300>=floor,50-240>=floor,true]);
  assert.match(r.why,/国库不足/);
  assert.deepEqual(plain(r.allOpen),[false,true]);
  assert.deepEqual(plain(r.later),[true,true,true]);
  assert.deepEqual(plain(r.costs),[200,0,60]);
});
test('older journals and builds without the setting never block a choice',()=>{
  const b=sim(325);
  const r=atVersion(b,166,`()=>{E().treasury=-500;const ev=guardChoiceTreasury({title:'试',choices:[{t:'拨银（国库-300万两）'},{t:'不拨'}]});return ev.choices.every(c=>!c.cond||c.cond());}`);
  assert.equal(r,true);
  const w=boot(326);w.run(setup);
  assert.equal(w.run(`E().treasury=-500;guardChoiceTreasury({title:'试',choices:[{t:'拨银（国库-300万两）'}]}).choices[0].cond`),undefined);
});
test('盐政 is enacted once and pays 盐课 every month after',()=>{
  const b=sim(327),reform=economy.v167.reforms;
  const r=b.run(`(()=>{const before=monthlyBaseIncome(),t0=E().treasury;
    const p=E().people;const ev=COURT[6]();const pv=ev.choices[0].preview;ev.choices[0].f();const gain=E().treasury-t0;E().people=p;
    return {pv,gain,after:monthlyBaseIncome()-before,again:COURT[6]()};})()`);
  assert.match(r.pv,/推行后不再呈奏/);assert.equal(r.gain,reform.saltNow);assert.equal(r.after,reform.saltMonthly);assert.equal(r.again,null);
  const old=atVersion(sim(328),166,`()=>{const t0=E().treasury;const ev=COURT[6]();ev.choices[0].f();return {gain:E().treasury-t0,again:!!COURT[6]()};}`);
  assert.deepEqual(old,{gain:250,again:true});
});
test('青苗法 leaves the memorials once enacted',()=>{
  const b=sim(329);
  const r=b.run(`(()=>{const i=COURT.findIndex(f=>{try{return f()?.title==='青苗法'}catch(e){return false}});const ev=COURT[i]();ev.choices[0].f();return {i,again:COURT[i]()};})()`);
  assert.ok(r.i>0);assert.equal(r.again,null);
});
test('江南贡品 can be sold once in twelve months',()=>{
  const b=sim(330),cd=economy.v167.tributeSaleCooldown;
  const r=b.run(`(()=>{const sell=()=>COURT[7]().choices[1];const first=!sell().cond||sell().cond();sell().f();const soon=sell().cond();S.turn+=${cd};const later=sell().cond();return {first,soon,later};})()`);
  assert.deepEqual(plain(r),{first:true,soon:false,later:true});
});
test('an overdrawn treasury costs 民心 by the configured step',()=>{
  const b=sim(331);
  const r=b.run(`(()=>{E().people=60;E().prestige=60;E().treasury=-450;const p=E().people;A.endMonth();drain();return {p,after:E().people,t:S.flags.lastMonthReview};})()`);
  assert.ok(r.after<r.p);
});
test('three months below the floor end the reign as 亡国之君; two warnings come first',()=>{
  const b=sim(332),debt=economy.v167.debt;
  const r=b.run(`(()=>{const seen=[];
    const month=()=>{E().treasury=${debt.floor}-900;E().people=60;E().health=90;A.endMonth();
      for(let n=0;modalOpen&&n<150;n++){if(modalResult){nextEv();continue;}seen.push(curEv.title);if(curEv.title==='亡国之君')break;const i=curEv.choices.findIndex(c=>c.t==='再撑一撑');choose(i>=0?i:curEv.choices.findIndex(c=>!c.cond||c.cond()));}
      return bankruptcyMonths();};
    const counts=[];for(let m=0;m<${debt.bankruptMonths};m++)counts.push(month());
    return {counts,warnings:seen.filter(t=>t.startsWith('国库告急')),over:S.over,history:S.history.at(-1)};})()`);
  assert.deepEqual(plain(r.counts),[1,2,3]);
  assert.deepEqual(plain(r.warnings),['国库告急 · 欠饷','国库告急 · 民变四起']);
  assert.equal(r.over,true);assert.equal(r.history.shi,'愍');
});
test('the fall names what happened in the palace and leaves no heir',()=>{
  const b=sim(333);
  const r=b.run(`(()=>{E().treasury=-1200;S.flags.bankrupt={gen:S.gen,months:3};const ev=deathEvent('破产');return {title:ev.title,text:ev.text,choices:ev.choices.map(c=>c.t)};})()`);
  assert.equal(r.title,'亡国之君');
  assert.match(r.text,/国库亏空1200万两/);assert.match(r.text,/煤山/);assert.match(r.text,/社稷倾覆/);
  assert.ok(!r.choices.some(t=>t.startsWith('传位')));
});
test('a month back above the floor clears the count; older journals never go bankrupt',()=>{
  const b=sim(334),debt=economy.v167.debt;
  const r=b.run(`(()=>{E().treasury=${debt.floor}-500;bankruptcyTick();const first=bankruptcyMonths();while(modalOpen){if(modalResult)nextEv();else choose(curEv.choices.length-1);}E().treasury=0;bankruptcyTick();return {first,after:bankruptcyMonths()};})()`);
  assert.deepEqual(plain(r),{first:1,after:0});
  const old=atVersion(sim(335),166,`()=>{E().treasury=-5000;bankruptcyTick();bankruptcyTick();bankruptcyTick();return {m:bankruptcyMonths(),end:bankruptcyReached()};}`);
  assert.deepEqual(old,{m:0,end:false});
});
test('the warning offers 加征 and 变卖 to raise silver',()=>{
  const b=sim(336),debt=economy.v167.debt;
  const r=b.run(`(()=>{const ev=bankruptcyWarningEvent(1,economyRule('debt'));const t0=E().treasury,p0=E().people;ev.choices[0].f();return {labels:ev.choices.map(c=>c.t),gain:E().treasury-t0,people:E().people-p0};})()`);
  assert.equal(r.labels.length,3);assert.equal(r.gain,debt.levy);assert.ok(r.people<0);
});
test('silver a choice brings in is halved, and its preview says so; costs are not',()=>{
  const b=sim(337);
  const r=b.run(`(()=>{while(modalOpen){if(modalResult)nextEv();else choose(0);}
    pushEv({title:'试',choices:[{t:'变卖（国库+120万两）',preview:'国库 +120 万两 · 民心 +2',f:()=>fx(chg({treasury:120,people:2}))},{t:'拨银',preview:'国库 −80 万两',f:()=>fx(chg({treasury:-80}))}]});
    const labels=curEv.choices.map(c=>c.t+'|'+(c.preview||''));const t0=E().treasury;choose(0);const gain=E().treasury-t0;const shown=modalResult&&String(modalResult.text||modalResult);while(modalOpen){if(modalResult)nextEv();else choose(0);}
    pushEv({title:'试二',choices:[{t:'拨银',preview:'国库 −80 万两',f:()=>fx(chg({treasury:-80}))}]});const t1=E().treasury;choose(0);const cost=E().treasury-t1;while(modalOpen){if(modalResult)nextEv();else choose(0);}
    const t2=E().treasury;chg({treasury:120});const outside=E().treasury-t2;
    return {labels,gain,cost,outside};})()`);
  const g=economy.v167.choiceGain;
  assert.equal(r.gain,Math.round(120*g));assert.equal(r.cost,-80);assert.equal(r.outside,120);
  assert.match(r.labels[0],new RegExp(`国库\\+${Math.round(120*g)}万两.*国库 \\+${Math.round(120*g)} 万两`));
  const old=atVersion(sim(338),166,`()=>{while(modalOpen){if(modalResult)nextEv();else choose(0);}pushEv({title:'试',choices:[{t:'变卖',f:()=>fx(chg({treasury:120}))}]});const t0=E().treasury;choose(0);return E().treasury-t0;}`);
  assert.equal(old,120);
});
