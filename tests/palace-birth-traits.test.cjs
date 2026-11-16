const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs'),{world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}

for(const [omen,roll] of [['red',0],['star',.1],['rainbow',.2]])test('ordinary births assign '+omen+' from the shared three percent gate',()=>{
 const w=world();w.run(`assert.equal(birthOmenChance(a),.03);a.preg=10;`);
 w.force(.9,.2,.029999,0,roll,.9);w.run(`birthEvent(a);assert.equal(a.delivery.omen,'${omen}');assert.equal(deliveryKids(a)[0].birthOmen,'${omen}');`);
});
test('the ninety-seven percent without an omen remains available',()=>{
 const w=world();w.run(`a.preg=10;`);w.force(.9,.2,.03);w.run(`birthEvent(a);assert.equal(a.delivery.omen,null);assert.ok(deliveryKids(a).every(k=>!k.birthOmen));`);
});
test('maternal frailty can lower birth health enough to produce the annual frail trait, but is not certain',()=>{
 const w=world();w.run(`a.trait='温婉';`);w.force(.5,.5,.5,.3);w.run(`var healthy=makeKid(a,'f','清宁');assert.equal(healthy.hp,65);a.trait='体弱';`);
 w.force(.5,.5,.5,.3);w.run(`var frail=makeKid(a,'f','清和');assert.equal(frail.hp,50);assert.equal(frail.birthTraits.mother.trait,'体弱');`);
 w.run(`assert.equal(birthLabelPool(a,'bad').find(x=>x.id==='frail').w,3);assert.ok(applyBirthLabels(frail,['frail']));assert.equal(frail.birthTrouble,'frail');assert.deepEqual(frail.birthLabelYears,{});assert.match(frail.story.at(-1).t,/生母亦素来体弱/);assert.match(frail.story.at(-1).t,/每年体魄-2/);S.turn+=36;`);
 w.run(`assert.equal(rollBirthTempleAdvice([healthy],null),null);`);
 w.force(.5,.5,.5,.99);w.run(`var robust=makeKid(a,'m','允和');assert.equal(robust.hp,75);`);
 w.run(`assert.equal(rollBirthTempleAdvice([robust],null),null);assert.equal(robust.birthTrouble,undefined);`);
});
test('frailty reduces health once per birthday from age one and chronicles the actual loss',()=>{
 const w=world();w.run(`var k=makeKid(a,'f','清宁');k.hp=50;k.birthTrouble='frail';var initial=JSON.stringify(k.birthTraits.initial);assert.match(birthTags(k),/初生体弱 · 每年体魄-2/);annualBirthOmenTick();S.turn+=11;annualBirthOmenTick();assert.equal(k.hp,50);S.turn++;annualBirthOmenTick();assert.equal(k.hp,48);assert.equal(k.birthTroubleYear,1);annualBirthOmenTick();assert.equal(k.hp,48);S.turn+=12;annualBirthOmenTick();assert.equal(k.hp,46);assert.match(k.story.at(-1).t,/2岁生辰，体魄-2（48→46）/);assert.equal(JSON.stringify(k.birthTraits.initial),initial);`);
});
test('frailty respects the health floor and leaves other attributes unchanged',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','允和');k.hp=1;k.lit=44;k.mar=32;k.birthTrouble='frail';S.turn+=12;annualBirthOmenTick();assert.equal(k.hp,0);assert.equal(k.lit,44);assert.equal(k.mar,32);assert.match(k.story.at(-1).t,/体魄-1（1→0）/);S.turn+=12;annualBirthOmenTick();assert.equal(k.hp,0);assert.match(k.story.at(-1).t,/已达属性边界/);`);
});
test('old frail children keep prior health without retroactive years of deductions',()=>{
 const w=world();w.run(`var k=makeKid(a,'f','清宁');k.hp=50;k.birthTrouble='frail';k.born=0;S.turn=61;annualBirthOmenTick();assert.equal(k.hp,50);S.turn=72;annualBirthOmenTick();assert.equal(k.hp,48);assert.equal(k.birthTroubleYear,6);assert.equal(k.story.filter(s=>s.t.includes('禀赋岁记')).length,1);`);
});
test('frailty skips deceased and unnamed children; children living away still age with their constitution',()=>{
 const w=world();w.run(`var ks=['甲','乙','丙','丁','戊'].map(n=>makeKid(a,'f',n));for(var k of ks){k.hp=50;k.birthTrouble='frail';}ks[0].alive=false;ks[1].pendingName=true;ks[2].away=true;ks[3].birthTrouble='quake';ks[4].birthTrouble='drought';S.turn+=12;annualBirthOmenTick();assert.deepEqual(ks.map(k=>k.hp),[50,50,48,50,50]);assert.doesNotMatch(birthTags(ks[3]),/每年/);assert.doesNotMatch(birthTags(ks[4]),/每年/);`);
});
test('a true month transition saves the frail birthday deduction and never applies it twice on reload',()=>{
 let w=world();w.run(`var k=makeKid(a,'f','清宁');k.hp=50;k.birthTrouble='frail';S.turn=71;S.month=12;PalaceActions.reset();A.endMonth();assert.equal(k.hp,48);`);const id=w.run('k.id');
 w=boot(324,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${id}).hp,48);drain();save('auto');A.load('auto');annualBirthOmenTick();assert.equal(kidById(${id}).hp,48);assert.equal(kidById(${id}).story.filter(s=>s.t.includes('禀赋岁记')).length,1);`);
});
for(const version of [35,36])for(const name of ['birth','frail-birthday'])test('published v'+version+' '+name+' replays its original rules before adopting the new rules',()=>{
 const payload=require('./fixtures/birth-traits-legacy-v'+version+'.json')[name],w=boot(336,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});assert.equal(birthOmenChance(harem()[0]),.03);`);
 if(name==='birth')w.run(`assert.ok(S.children.every(k=>!k.birthOmen));`);
 else w.run(`assert.equal(S.children.find(k=>k.name==='清宁').hp,50);`);
 w.run(`drain();assert.equal(PalaceActions.contentVersion,65);assert.equal(birthOmenChance(harem()[0]),.03);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
