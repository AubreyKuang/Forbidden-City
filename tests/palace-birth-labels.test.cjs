const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs'),{world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const b=base();b.ctx.assert=assert;return b;}
test('the selected nine labels join the old pool with explicit types and no unselected proposals',()=>{
 const b=world();b.run(`assert.deepEqual(Object.values(BIRTH_LABELS).filter(x=>!['赤霞映阙','文星流彩','长虹贯庭','初生体弱','出生时地动','出生逢旱'].includes(x.name)).map(x=>x.name),['紫气东来','麟趾呈祥','文武双璧','龙吟虎啸','瑞雪凝华','幼慧过人','慧极易伤','锋芒毕露','清静无争']);assert.equal(BIRTH_LABELS.fragile.kind,'bad');assert.equal(BIRTH_LABELS.sharp.kind,'good');assert.equal(BIRTH_LABELS.serene.kind,'good');`);
});
for(const id of ['purple','qilin','dual','dragon','snow','early','fragile','sharp','serene'])test(id+' is visible as a newborn celestial sign before any later growth scene',()=>{
 const b=world();b.run(`var k=makeKid(a,'f','清宁');applyBirthLabels(k,['${id}']);assert.equal(kidAge(k),0);assert.match(birthTags(k),new RegExp(BIRTH_LABELS['${id}'].name));UI.sel=k.id;assert.match(viewKid(),new RegExp(BIRTH_LABELS['${id}'].name));assert.ok(k.story.some(s=>s.t.includes('出生天象')&&s.t.includes(BIRTH_LABEL_SKIES['${id}'])));var events=birthLabelFollowups([k]);assert.equal(events.length,1);assert.ok(!events[0].choices.some(c=>c.t==='陪孩子说说心里的打算'));if(BIRTH_LABELS['${id}'].age>0){assert.ok(events[0].text.includes(BIRTH_LABEL_SKIES['${id}']));assert.equal(birthLabelStory(k,'${id}'),null);}pushEv(events[0]);choose(0);drain();var saved=JSON.stringify(k.birthLabels);if(BIRTH_LABELS['${id}'].age>0){k.born=S.turn-BIRTH_LABELS['${id}'].age*12;assert.ok(birthLabelStory(k,'${id}'));}assert.equal(JSON.stringify(k.birthLabels),saved);`);
});
test('the three percent and eighty percent gates have strict boundaries and no additional trouble roll',()=>{
 const b=world();b.force(.03);b.run(`assert.deepEqual(rollBirthLabels(a),[]);var g={gouyi:true};`);b.force(.8);b.run(`assert.deepEqual(rollBirthLabels(g),[]);var k=makeKid(a,'f','无忧');k.hp=30;applyBirthLabels(k,[]);Math.random=()=>0;assert.equal(rollBirthTempleAdvice([k],null),null);assert.deepEqual(k.birthLabels,[]);assert.equal(k.birthTrouble,undefined);`);
});
test('the second tag is unique and belongs to the same category, with opposed ambitions excluded',()=>{
 const b=world();b.force(0,.1,.4,0,.8);b.run(`var good=rollBirthLabels(a);assert.equal(good.length,2);assert.ok(good.every(id=>BIRTH_LABELS[id].kind==='good'));`);
 b.force(0,.9,0,0,.9);b.run(`var bad=rollBirthLabels(a);assert.equal(bad.length,2);assert.ok(bad.every(id=>BIRTH_LABELS[id].kind==='bad'));assert.notEqual(bad[0],bad[1]);assert.ok(!birthLabelPool(a,'good',['sharp']).some(x=>x.id==='serene'));assert.ok(!birthLabelPool(a,'good',['serene']).some(x=>x.id==='sharp'));var k=makeKid(a,'m','守一');assert.equal(applyBirthLabels(k,['red','frail']),false);assert.equal(applyBirthLabels(k,['red','red']),false);assert.equal(applyBirthLabels(k,['sharp','serene']),false);assert.equal(k.birthLabels,undefined);`);
});
test('frail inheritance has a thirty percent boundary and cannot be rolled again in the remaining branch',()=>{
 const b=world();b.run(`a.trait='体弱';`);b.force(.3,.03);b.run(`assert.deepEqual(rollBirthLabels(a),[]);`);b.force(.299999,0,.9);b.run(`assert.deepEqual(rollBirthLabels(a),['frail']);`);b.force(.3,.029999,.9,0,0,.9);b.run(`assert.deepEqual(rollBirthLabels(a),['quake','drought']);`);
});
test('seeded population samples stay near the fixed total rate, and frail mothers have exactly thirty percent health labels',()=>{
 const b=world();const result=JSON.parse(b.run(`JSON.stringify((()=>{
  const out={};for(const [name,mother] of Object.entries({ordinary:a,weak:{trait:'体弱'},gouyi:{gouyi:true,trait:'体弱'}})){
   const counts={n:100000,tagged:0,good:0,bad:0,double:0,frail:0,health:0};
   for(let n=0;n<counts.n;n++){const ids=rollBirthLabels(mother);assert.ok(ids.length<=2);assert.equal(new Set(ids).size,ids.length);if(!ids.length)continue;counts.tagged++;counts[BIRTH_LABELS[ids[0]].kind]++;if(ids.length===2)counts.double++;if(ids.includes('frail'))counts.frail++;if(ids.some(id=>BIRTH_HEALTH_LABELS.includes(id)))counts.health++;assert.ok(ids.every(id=>BIRTH_LABELS[id].kind===BIRTH_LABELS[ids[0]].kind));assert.ok(!(ids.includes('sharp')&&ids.includes('serene')));}
   out[name]=counts;
  }return out;
 })())`));
 for(const name of ['ordinary']){const c=result[name];assert.ok(Math.abs(c.tagged/c.n-.03)<.002);assert.ok(Math.abs(c.good/c.tagged-.75)<.04);assert.ok(Math.abs(c.double/c.tagged-.1)<.025);}
 assert.ok(Math.abs(result.gouyi.tagged/result.gouyi.n-.8)<.005);assert.equal(result.gouyi.bad,0);assert.equal(result.gouyi.frail,0);assert.ok(Math.abs(result.gouyi.double/result.gouyi.n-.08)<.004);assert.ok(Math.abs(result.weak.health/result.weak.n-.3)<.005);assert.ok(Math.abs(result.weak.tagged/result.weak.n-.321)<.005);assert.ok(result.weak.frail>result.weak.health*.7);assert.equal(result.gouyi.health,0);
 console.log('Birth label sample:',JSON.stringify(result));
});
for(const id of ['red','star','rainbow','purple','qilin','dual','dragon','snow','early','fragile','sharp','serene','frail','quake','drought'])test(id+' has its own age-appropriate event and writes both participants once',()=>{
 const b=world();b.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;applyBirthLabels(k,['${id}']);var label=BIRTH_LABELS['${id}'];if(label.age){assert.equal(birthLabelStory(k,'${id}'),null);k.born=S.turn-label.age*12;}var ev=birthLabelStory(k,'${id}');assert.equal(ev.title,label.title);assert.match(ev.text,new RegExp(label.name));assert.match(ev.text,/清宁/);pushEv(ev);choose(0);var marker=JSON.stringify(k.birthLabelEvents),before=JSON.stringify(S);ev.choices[0].f();assert.equal(JSON.stringify(S),before);drain();assert.equal(JSON.stringify(k.birthLabelEvents),marker);assert.ok(k.story.some(s=>s.t.includes(label.scene)));assert.ok(a.story.some(s=>s.t.includes(label.scene)));assert.equal(birthLabelStory(k,'${id}'),null);assert.equal(ev.valid(),false);`);
});
test('double labels accumulate bounded annual effects once and the early gift changes at age seven',()=>{
 const b=world();b.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;k.hp=k.lit=k.mar=k.vir=50;applyBirthLabels(k,['purple','dual']);S.turn+=12;annualBirthOmenTick();assert.deepEqual([k.hp,k.lit,k.mar,k.vir],[51,54,54,51]);var count=k.story.length;annualBirthOmenTick();assert.equal(k.story.length,count);S.turn+=12;k.lit=99;annualBirthOmenTick();assert.equal(k.lit,100);var early=makeKid(a,'m','允安');early.lit=50;applyBirthLabels(early,['early']);early.born=S.turn-72;annualBirthOmenTick();assert.equal(early.lit,58);S.turn+=12;annualBirthOmenTick();assert.equal(early.lit,60);assert.ok(early.story.findLast(s=>s.t.includes('禀赋岁记')).t.includes('往后每年才学+2'));`);
});
test('two bad labels stay bad and combine health deductions without re-awarding an inherited trait',()=>{
 const b=world();b.run(`a.trait='体弱';var k=makeKid(a,'m','允安');k.hp=75;k.lit=40;applyBirthLabels(k,['fragile','frail']);assert.equal(k.hp,60);assert.equal(k.birthTraits.initial.hp,60);assert.match(birthTags(k),/tag r/);assert.ok(k.story.some(s=>s.t.includes('生母亦素来体弱')));S.turn+=12;annualBirthOmenTick();assert.equal(k.hp,56);assert.equal(k.lit,46);assert.equal(applyBirthLabels(k,['purple']),false);assert.deepEqual(k.birthLabels,['fragile','frail']);`);
});
test('birth-linked temperaments keep later voices consistent',()=>{
 const b=world();b.run(`for(var [id,expected] of [['sharp','好胜'],['serene','内敛'],['qilin','仁厚']]){var k=makeKid(a,'f',id);applyBirthLabels(k,[id]);assert.equal(childDisposition(k),expected);}a.gouyi=true;var child=makeKid(a,'m','允安');assert.equal(applyBirthLabels(child,['frail']),false);assert.equal(child.birthLabels,undefined);`);
});
test('birth naming, two shared good labels, subsequent choices and reloads preserve one result',()=>{
 let b=world();b.run(`a.preg=10;`);b.force(.01,.2,.8,0,.1,0,0,.1);b.run(`birthEvent(a);a.delivery.difficult=false;assert.equal(a.delivery.labels.length,2);PalaceActions.reset();A.resumeBirth(a.id);`);const id=b.run('a.id'),ids=b.run('JSON.stringify(a.delivery.labels)');
 b=boot(393,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var a=byId(${id});assert.equal(JSON.stringify(a.delivery.labels),${JSON.stringify(ids)});choose(0,'清宁');save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();a=byId(${id});assert.ok(deliveryKids(a).every(k=>JSON.stringify(k.birthLabels)===${JSON.stringify(ids)}));var saved=JSON.stringify(deliveryKids(a));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(JSON.stringify(deliveryKids(byId(${id}))),saved);`);
});
test('the real sixth birthday queues a growth scene once and reload preserves the annual stats and choice',()=>{
 let b=world();b.run(`var k=makeKid(a,'f','清宁');applyBirthLabels(k,['sharp']);k.policy='修德';a.talent=a.virtue=a.scheme=0;k.lit=k.mar=40;k.amb=50;S.turn=k.born+71;S.month=12;PalaceActions.reset();A.endMonth();assert.equal(curEv.title,BIRTH_LABELS.sharp.title);assert.equal(k.lit,43);assert.equal(k.mar,43);assert.equal(k.amb,52);`);const id=b.run('k.id');
 b=boot(393,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var k=kidById(${id});assert.equal(k.lit,43);assert.equal(curEv.title,BIRTH_LABELS.sharp.title);choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(kidById(${id}).birthLabelEvents.sharp);drain();annualBirthOmenTick();assert.equal(kidById(${id}).lit,43);assert.equal(birthLabelStory(kidById(${id}),'sharp'),null);`);
});
test('replaced babies do not retain the original royal labels or their queued stories',()=>{
 const b=world();b.run(`var k=makeKid(a,'f','清宁');applyBirthLabels(k,['purple','star']);var s={claimedMotherName:fullName(a)};applySwapOutsideParents(k,s);assert.equal(k.birthLabels,undefined);assert.equal(k.birthLabelYears,undefined);assert.equal(k.birthOmen,undefined);assert.deepEqual(birthLabelFollowups([k]),[]);`);
});
for(const name of ['birth','frail-birthday','coronation'])test('real v38 '+name+' continues the old probabilities, annual effects and opening court',()=>{
 const payload=require('./fixtures/birth-labels-legacy-v38.json')[name],b=boot(393,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,38);assert.equal(birthOmenChance(harem()[0]),.09);assert.ok(!S.ministries?.foundingRoster);assert.ok(S.children.every(k=>k.birthLabels===undefined));drain();assert.equal(PalaceActions.contentVersion,50);assert.equal(birthOmenChance(harem()[0]),.03);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
