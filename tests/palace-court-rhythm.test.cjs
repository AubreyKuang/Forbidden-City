const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs'),{world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}
for(const [omen,stat] of [['red','hp'],['star','lit'],['rainbow','mar']])test('birth tag '+omen+' settles once on each birthday, starting at age one',()=>{
 const w=world();w.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;k.${stat}=50;var initial=JSON.stringify(k.birthTraits.initial);applyBirthOmen(k,'${omen}');assert.equal(k.${stat},50);assert.match(birthTags(k),/每年.*[+]6/);S.turn+=11;annualBirthOmenTick();assert.equal(k.${stat},50);S.turn++;annualBirthOmenTick();assert.equal(k.${stat},56);annualBirthOmenTick();assert.equal(k.${stat},56);S.turn+=12;annualBirthOmenTick();assert.equal(k.${stat},62);assert.equal(k.story.filter(s=>s.t.includes('禀赋岁记')).length,2);assert.equal(JSON.stringify(k.birthTraits.initial),initial);`);
});
test('signed annual tag effects obey stat bounds without changing unrelated attributes',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承远');k.pendingName=false;k.mar=2;k.lit=44;BIRTH_OMENS.rainbow.bonus=-6;applyBirthOmen(k,'rainbow');assert.match(birthTags(k),/每年武艺-6/);S.turn+=12;annualBirthOmenTick();assert.equal(k.mar,0);assert.equal(k.lit,44);assert.match(k.story.at(-1).t,/武艺-2/);BIRTH_OMENS.rainbow.bonus=6;k.mar=98;S.turn+=12;annualBirthOmenTick();assert.equal(k.mar,100);`);
});
test('an old save keeps prior stats and receives no retroactive years of bonuses',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承远');k.pendingName=false;k.birthOmen='star';k.lit=40;k.born=0;S.turn=61;annualBirthOmenTick();assert.equal(k.lit,40);S.turn=72;annualBirthOmenTick();assert.equal(k.lit,46);assert.equal(k.birthOmenYear,6);assert.equal(k.story.filter(s=>s.t.includes('禀赋岁记')).length,1);`);
});
test('deceased, unnamed and untagged children get no annual tag effect; adults away still do',()=>{
 const w=world();w.run(`var children=[makeKid(a,'f','甲'),makeKid(a,'f','乙'),makeKid(a,'m','丙'),makeKid(a,'m','丁')];for(var k of children){k.lit=40;k.birthOmen='star';k.pendingName=false;k.born=S.turn-20*12;}children[0].alive=false;children[1].pendingName=true;delete children[2].birthOmen;children[3].away=true;annualBirthOmenTick();assert.deepEqual(children.map(k=>k.lit),[40,40,40,46]);`);
});
test('a real month transition and pending-scene reload apply the birthday bonus exactly once',()=>{
 let w=world();w.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;k.lit=50;applyBirthOmen(k,'star');S.turn=71;S.month=12;PalaceActions.reset();A.endMonth();assert.equal(k.lit,56);`);const id=w.run('k.id');
 w=boot(324,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${id}).lit,56);drain();save('auto');A.load('auto');annualBirthOmenTick();assert.equal(kidById(${id}).lit,56);assert.equal(kidById(${id}).story.filter(s=>s.t.includes('禀赋岁记')).length,1);`);
});
function residenceWorld(){const w=world();w.run(`a.rank=5;a.palace='景仁宫';a.residenceRoom='main';b.rank=5;b.palace='咸福宫';b.residenceRoom='main';b.trait='骄纵';b.favor=90;b.lastResidenceMove=-99;b.lastResidenceRequest=-99;PalaceActions.reset();`);return w;}
for(const choice of [0,1,2])test('residence petitions start a two-year interval on proposal, including response '+choice,()=>{
 const w=residenceWorld();w.run(`A.residencePetition(b.id);assert.equal(b.lastResidenceRequest,60);assert.equal(S.flags.lastResidenceRequest,60);choose(${choice});drain();S.turn=83;assert.equal(residencePetitionFor(b),null);assert.equal(residencePetitionEvent(a),null);S.turn=84;assert.equal(residenceRequestCooling(b),false);assert.equal(residenceRequestCooling(a),false);`);
});
test('residence previews are pure, stale duplicates cannot queue, and pushNow records only once',()=>{
 const w=residenceWorld();w.run(`var before=JSON.stringify(S),ev=residencePetitionEvent(b),duplicate=residencePetitionEvent(b);assert.equal(JSON.stringify(S),before);pushNow(ev);assert.equal(b.lastResidenceRequest,60);assert.equal(duplicate.valid(),false);ev.onShow();assert.equal(b.story.filter(s=>s.t.includes('【迁宫之请】')).length,1);`);
});
test('a residence request and its cooldown survive refreshing before answering',()=>{
 let w=residenceWorld();w.run('A.residencePetition(b.id);');const id=w.run('b.id');w=boot(831,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'迁宫之请');choose(1);drain();assert.equal(byId(${id}).lastResidenceRequest,60);assert.equal(residencePetitionEvent(byId(${id})),null);`);
});
test('same-month dowager audiences offer different topics and third and fourth visits can recall childhood',()=>{
 const w=world();w.run(`var d=ensureDowager();Math.random=()=>0;A.greet();var first=curEv.text;drain();A.greet();assert.notEqual(curEv.text,first);assert.doesNotMatch(curEv.text,/今日已经说过一回话/);drain();A.greet();assert.match(curEv.text,/舍不得走|小时候/);var third=curEv.text;drain();A.greet();assert.notEqual(curEv.text,third);assert.match(curEv.text,/小时候/);assert.equal(d.conversations.visits.count,4);drain();assert.ok(d.story.some(s=>s.t.includes('迟迟不走')));`);
});
test('mourning dowager companionship respects grief and exhausted topics still vary',()=>{
 const w=world();w.run(`var d=ensureDowager();d.feeling={kind:'悲恸',turn:60};d.conversations={topics:{},recent:[],visits:{turn:60,count:4}};var last='';for(var i=0;i<8;i++){var ev=dowagerCompanionEvent(d,true);assert.ok(ev);assert.notEqual(ev.text,last);assert.doesNotMatch(ev.text,/笑着|笑问|好点心|小时候/);last=ev.text;ev.onShow();ev.choices[0].f();}assert.equal(d.feeling.kind,'悲恸');`);
});
test('repeated dowager conversation counts and chosen words survive reload without replaying the reward',()=>{
 let w=world();w.run(`Math.random=()=>0;A.greet();drain();A.greet();drain();A.greet();`);const text=w.run('curEv.text'),energy=w.run('E().energy');w=boot(944,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.dowager.conversations.visits.count,3);`);assert.equal(w.run('curEv.text'),text);assert.equal(w.run('E().energy'),energy);
});
test('Cining greeting action precedes the long court panel and is absent after the dowager dies',()=>{
 const w=world();w.run(`UI.sel='cn';var html=viewPlace();assert.match(html,/<header class="cining-heading">/);assert.equal(html.split('onclick="A.greet()"').length-1,1);assert.ok(html.indexOf('onclick="A.greet()"')<html.indexOf('</header>'));S.flags.dowager.alive=false;assert.ok(!viewPlace().includes('onclick="A.greet()"'));`);
});
for(const version of [26,28,29])for(const name of ['annual-tags','residence-request','dowager-repeat'])test('genuine version '+version+' '+name+' action resumes before new rules activate',()=>{
 const payload=require('./fixtures/'+name+'-legacy-v'+version+'.json'),w=boot(912,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});`);
 if(name==='annual-tags')w.run(`assert.equal(S.children.find(k=>k.name==='清宁').lit,56);`);
 if(name==='dowager-repeat')w.run(`assert.match(curEv.text,/今日已经说过一回话/);`);
 w.run(`drain();assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,69);`);
});
test('third and later greetings always turn to companionship, even on the highest random roll',()=>{
 const w=world();w.run(`var d=ensureDowager();d.conversations={topics:{},recent:[],visits:{turn:S.turn,count:2},lastTurn:S.turn};Math.random=()=>.999;var heard=new Set();for(var i=0;i<12;i++){E().energy=20;A.greet();assert.ok(curEv.dowagerTopic.startsWith('company:'));assert.ok(!heard.has(curEv.text));heard.add(curEv.text);drain();}E().energy=20;A.greet();assert.doesNotMatch(curEv.text,/今日已经说过一回话|先前的话已说过/);assert.equal(d.conversations.visits.count,15);`);
});
test('after finishing an old repeated greeting, the next audience uses the varied current dialogue',()=>{
 const payload=require('./fixtures/dowager-repeat-legacy-v29.json'),w=boot(912,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.match(curEv.text,/今日已经说过一回话/);drain();E().energy=20;A.greet();assert.doesNotMatch(curEv.text,/今日已经说过一回话|先前的话已说过/);drain();A.greet();assert.doesNotMatch(curEv.text,/今日已经说过一回话|先前的话已说过/);`);
});
