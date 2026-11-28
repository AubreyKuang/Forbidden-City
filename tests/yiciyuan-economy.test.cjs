// 易次元 economy (config.economy): consorts cost 宫人用度 on top of their stipend and a 逾制
// fee past ten, 岁贡 follows 威望, and journals before content 165 keep the old sums.
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
  const r=b.run(`(()=>{const u=haremUpkeep(),n=alive().filter(c=>!c.cold).length;
    while(alive().filter(c=>!c.cold).length<14){const g=makeGirl({sur:'试',given:'人'+S.consorts.length,age:18,trait:'沉静',fam:{t:'良家子',p:5}});addConsort(g,1,'测试');}
    const big=haremUpkeep();return {u,n,big,hint:haremUpkeepHint()};})()`);
  assert.equal(r.u.staff,r.n*economy.upkeep.staff);assert.equal(r.u.crowd,0);
  assert.equal(r.big.count,14);assert.equal(r.big.over,4);assert.equal(r.big.crowd,4*economy.upkeep.crowdFee);
  assert.equal(r.big.total,r.big.stipend+14*economy.upkeep.staff+4*economy.upkeep.crowdFee);
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
