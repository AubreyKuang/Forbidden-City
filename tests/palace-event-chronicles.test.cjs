const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(202);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=48;S.year=5;S.month=6;E().health=60;E().energy=5;E().treasury=800;
 var a=harem()[1],b=harem()[0],c=makeGirl({trait:'善妒',age:26});addConsort(c,3,'入宫');
 for(const p of harem()){p.preg=0;p.hp=90;p.talent=75;p.aff=65;p.favor=65;p.cold=false;p.gone=false;p.age=26;p.xin={k:'平和',t:S.turn};}
 a.rank=3;b.rank=8;S.flags.lastCourt='赈灾';relAdd(a,b,50-relGet(a,b));relAdd(b,c,-60-relGet(b,c));relAdd(a,c,-60-relGet(a,c));
 rememberQuarrel(a,c,c.id);`);return b;}
const traits=world().run('Object.keys(TRAITS)');
for(const trait of traits)test(`${trait}: every quirk response retains the actor and decision in the chronicle`,()=>{
 const quirks=world().run('Object.keys(QEV)');
 for(const quirk of quirks){
  const count=world();count.run(`a.trait=${JSON.stringify(trait)};a.t2=${JSON.stringify(quirk)};if(a.t2==='畏寒')S.month=12;var e=QEV[a.t2](a);`);
  const choices=count.run('e?.choices.length||0');assert.ok(choices,`${trait}/${quirk} fixture did not produce a scene`);
  for(let i=0;i<choices;i++){
   const w=world();w.run(`a.trait=${JSON.stringify(trait)};a.t2=${JSON.stringify(quirk)};if(a.t2==='畏寒')S.month=12;
    var e=QEV[a.t2](a),people=eventPortraits(e),lengths=people.map(p=>p.story.length);e.choices[${i}].f();
    for(const [j,p] of people.entries())assert.ok(p.story.slice(lengths[j]).some(s=>s.event?.title===e.title&&s.event.choice),e.title+' / '+fullName(p));
    assert.equal(a.trait,${JSON.stringify(trait)});assert.equal(a.t2,${JSON.stringify(quirk)});
   `);
  }
 }
});
test('sending the cat away preserves personality and cannot repeat the absent cat accident',()=>{
 const w=world();w.run(`a.t2='爱猫';var e=QEV.爱猫(a);e.choices[1].f();assert.equal(a.t2,'爱猫');assert.equal(a.catAbsent,true);assert.equal(QEV.爱猫(a),null);
 var n=a.story.length;e.choices[1].f();assert.equal(a.story.length,n);`);
 w.run(`WISHES.cat.f(a);assert.equal(a.catAbsent,false);assert.ok(QEV.爱猫(a));`);
});
test('a grudge quotes an actual negative memory, never invents an insult or promotes hearsay',()=>{
 const w=world();w.run(`a.t2='记仇';var e=QEV.记仇(a);assert.match(e.text,/争蜀锦/);assert.doesNotMatch(e.text,/一句酸话/);
 delete S.npcMemory;assert.equal(QEV.记仇(a),null);NPCMemory.record(S,{type:'rumor',time:S.turn},[{person:a.id,subject:c.id,emotion:-1,impact:90,channel:'hearsay',interpretation:'听说她讥讽过我'}]);assert.equal(QEV.记仇(a),null);`);
});
test('grief, pregnancy and physical condition constrain entertainment',()=>{
 const w=world();w.run(`for(const p of harem())p.xin={k:'悲恸',t:S.turn,why:'父亲病故'};assert.equal(quirkEvent(),null);assert.doesNotMatch(xinLine(a),/小衣裳/);
 a.preg=5;assert.equal(QEV.擅舞(a),null);assert.equal(QEV.擅骑射(a),null);a.preg=0;a.hp=30;assert.equal(QEV.擅骑射(a),null);`);
});
test('reserved partners and novice needleworkers do not inherit another persons mannerisms',()=>{
 const w=world();w.run(`S.consorts=[a,b];a.t2='爱猫';b.trait='持重';b.t2='畏寒';assert.doesNotMatch(QEV.爱猫(a).text,/哭到了/);
 a.t2='好胜';assert.match(QEV.好胜(a).text,/明日再论/);a.trait='爽直';assert.match(QEV.好胜(a).choices[2].f(),/爽快认了/);
 a.trait='将门';a.hobby='骑射';assert.match(XEV.感激(a).text,/裁剪请绣娘相助/);`);
});
test('rank requests fit motivation; family requests bind a real living available brother',()=>{
 const w=world();w.run(`for(const p of harem())p.trait='淡泊';assert.equal(HAREM.find(f=>f.name==='ambition')(),null);
 var house=houseOf(a);house.brother||={name:a.sur+'怀远',age:28,post:'知县',alive:true};house.brother.career='official';house.brother.post='知县';a.fam.p=50;initializeOfficialHouse(a,house,[a]);
 var create=HAREM.find(f=>f.name==='family'),e=create();assert.ok(e);assert.doesNotMatch(e.text,/幼弟今年中了举/);e.choices[0].f();
 var p=officialEntries().find(e=>e.p.commission);assert.ok(p);assert.match(e.text,new RegExp(p.p.name));assert.ok(p.p.story.some(s=>s.t.includes('奉旨')));
 for(const e of officialEntries())if(e.role!=='father')e.p.alive=false;assert.equal(create(),null);`);
});
test('known parties remember a quarrel while a secret suspect gains no scene or private knowledge',()=>{
 const w=world();w.run(`var e=HAREM.find(f=>f.name==='quarrel')(),ps=eventPortraits(e);e.choices[0].f();for(const p of ps)assert.ok(p.story.some(s=>s.event?.title==='争执'));
 S.consorts=[a,b];a.scheme=90;a.mood=20;b.favor=90;var e=HAREM.find(f=>f.name==='musk')(),n=a.story.length,m=NPCMemory.recall(S,a.id).length;e.choices[1].f();assert.equal(a.story.length,n);assert.equal(NPCMemory.recall(S,a.id).length,m);
 assert.ok(b.story.some(s=>s.event?.title==='香囊疑案'));`);
});
test('chronicle context and names survive saves and repeated result clicks',()=>{
 const w=world();w.run(`a.t2='嘴硬心软';for(const p of harem())if(p!==a)p.qcd=S.turn;
 A.auditQuirk=id=>pushEv(QEV.嘴硬心软(byId(id)));PalaceActions.install();var id=a.id;A.auditQuirk(id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'参汤');choose(0);a=byId(id);
 var before=JSON.stringify(a.story);assert.ok(a.story.at(-1).event?.choice);choose(0);assert.equal(JSON.stringify(a.story),before);
 save('2');A.load('2');assert.equal(PalaceActions.blocked,false);a=byId(id);assert.equal(JSON.stringify(a.story),before);
 assert.match(detailStory(a),/参汤/);assert.match(detailStory(a),/道谢/);`);
});
test('a failed write keeps the consequence and its chronicle together, once',()=>{
 const w=world();w.run(`A.auditQuirk=id=>pushEv(QEV.擅厨艺(byId(id)));PalaceActions.install();var id=a.id;A.auditQuirk(id);var before=JSON.stringify(a.story),energy=E().energy;`);
 const set=w.storage.set;w.storage.set=()=>{throw Error('quota');};
 w.run(`choose(0);a=byId(id);var after=JSON.stringify(a.story),spent=E().energy;assert.notEqual(after,before);assert.ok(a.story.at(-1).event?.choice);assert.ok(modalResult);
  choose(0);assert.equal(JSON.stringify(a.story),after);assert.equal(E().energy,spent);`);w.storage.set=set;
 w.run(`nextEv();assert.equal(lastAutoSaveError,'');A.load('auto');assert.equal(JSON.stringify(byId(id).story),after);assert.equal(E().energy,spent);`);
});
test('reading or discarding a generated event does not fabricate a chronicle',()=>{
 const w=world();w.run(`var before=JSON.stringify(S);var e=QEV.嘴硬心软(a);assert.equal(JSON.stringify(S),before);e.choices[0].f();var n=a.story.length;
 detailStory(a);detailStory(a);assert.equal(a.story.length,n);var e=QEV.擅厨艺(a);E().energy=0;var before=JSON.stringify(S);assert.equal(e.choices[0].f(),null);assert.equal(JSON.stringify(S),before);`);
});
test('every mood-event response retains its decision, including the second party in jealousy',()=>{
 const states=world().run('Object.keys(XEV)');
 for(const state of states){
  const make=()=>{const w=world();w.run(`a.xin={k:${JSON.stringify(state)},t:S.turn-8,why:'往事',who:b.id};a.aff=70;a.like='珠翠';var e=XEV[${JSON.stringify(state)}](a,a.xin);`);return w;};
  const n=make().run('e?.choices.length||0');assert.ok(n,state);
  for(let i=0;i<n;i++){const w=make();w.run(`var ps=eventPortraits(e),ns=ps.map(p=>p.story.length);e.choices[${i}].f();for(const [i,p] of ps.entries())assert.ok(p.story.slice(ns[i]).some(s=>s.event?.title===e.title),e.title);`);}
 }
});
test('a change of visitation is available in the child, birth mother and foster mother records',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安');k.born=S.turn-60;k.foster=b.id;var ns=[k,a,b].map(p=>p.story.length);A.familyVisitRule(k.id,'closed');
 for(const [i,p] of [k,a,b].entries())assert.ok(p.story.slice(ns[i]).some(s=>s.t.includes('暂缓')&&s.t.includes('承安')));var n=k.story.length;A.familyVisitRule(k.id,'closed');assert.equal(k.story.length,n);A.familyVisitRule(k.id,'open');assert.match(k.story.at(-1).t,/准生母/);`);
});
test('declined gifts and next-day rewards remain distinct entries',()=>{
 const w=world();w.run(`a.hate='珠翠';giveGift(a,'珠翠');assert.match(a.story.at(-1).t,/并非她的喜好/);nightWith(a);choose(0);assert.ok(a.story.some(s=>s.t.includes('侍寝翌日')));`);
});
test('opening an heir confirmation cannot record a coronation that is later cancelled',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安');k.born=S.turn-144;var before=JSON.stringify(k.story);
 var e=chronicleEvent({title:'兄弟阋墙',por:k,text:'有人建议改立储君。',choices:[{t:'改立他为太子',chronicle:false,f:()=>A.kidHeir(k.id)}]});
 e.choices[0].f();assert.equal(curEv.title,'册立太子');assert.equal(JSON.stringify(k.story),before);choose(1);assert.equal(JSON.stringify(k.story),before);assert.notEqual(S.heir,k.id);`);
});
test('all impeachment decisions retain the pending investigation or actual ruling',()=>{
 for(const review of [false,true])for(const guilty of [false,true]){
  const make=()=>{const w=world();w.run(`var e=${review?'impeachmentEvent':'COURT[IMPEACHMENT_INDEX]'}({impeachment:{person:a.id,matching:true,guilty:${guilty}},review:${review}});`);return w;};
  for(let i=0;i<make().run('e.choices.length');i++){const w=make();w.run(`e.choices[${i}].f();assert.ok(a.story.some(s=>s.event?.title===e.title));`);}
 }
});
test('family faction decisions leave concrete records for every displayed mother and child',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安'),j=makeKid(b,'m','承宁');for(const x of [k,j])x.born=S.turn-96;S.heir=null;
 var e=chronicleEvent(successionRivalryEvent());assert.ok(e);var ps=eventPortraits(e),ns=ps.map(p=>p.story.length);e.choices[0].f();
 for(const [i,p] of ps.entries())assert.ok(p.story.slice(ns[i]).some(s=>s.event?.title==='国本之争'));assert.equal(S.heir,null);`);
});
test('changing or ending foster care records the previous foster mothers actual loss',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安');doFoster(k,b);doFoster(k,c);assert.match(b.story.at(-1).t,/改由/);assert.doesNotMatch(b.story.at(-2).t,/多年/);
 var n=c.story.length;A.unfoster(k.id);assert.ok(c.story.slice(n).some(s=>s.t.includes('回到生母')));assert.match(k.story.at(-1).t,new RegExp(fullName(a)));`);
});
test('declining foster care preserves the existing arrangement in the child chronicle',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安');fosterOffer(k,'照护之议').choices[1].f();assert.match(k.story.at(-1).t,/未允/);assert.ok(!k.foster);`);
});
test('a lone mourner retains the funeral decision without invented companions',()=>{
 const w=world();w.run(`var d=ensureDowager();a.clan=d.clan;b.clan='different-b';c.clan='different-c';a.trait='沉静';
 var e=dowagerFuneralEvent(d);e.onQueue();var n=a.story.length,result=e.choices[1].f();assert.doesNotMatch(result,/靠在一起|姐妹/);assert.ok(a.story.slice(n).some(s=>s.t.includes('从简尽礼')));`);
});
test('deferring a parentage allegation records uncertainty without making it a verdict',()=>{
 const w=world();w.run(`var k=makeKid(a,'m','承安');k.born=S.turn;k.pendingName=false;a.favor=10;var e;for(var i=0;i<1000&&!e;i++)e=parentageClueEvent();assert.ok(e);e.onQueue();e.choices[1].f();
 assert.match(k.story.at(-1).t,/暂不追究/);assert.match(a.story.at(-1).t,/未据传言定罪/);assert.equal(k.parentage.status,'suspected');assert.ok(!k.removedFromRoyal);`);
});
test('recalled care and rescue use actual experiences rather than inventing a cold-palace history',()=>{
 const w=world();w.run(`S.npcMemory=undefined;a.mem=[];a.aff=80;a.wishKnown=true;a.woundKnown=true;a.t2='念旧';a.entryTurn=-120;
 remember(a,'saved','花架倾倒时，陛下扶住了她');var heard=false;
 for(var i=0;i<80;i++){E().energy=5;A.chat(a.id);if(curEv){assert.doesNotMatch(curEv.text,/冷宫里那几个月|廊下站了一夜/);if(curEv.text.includes('她说起一段记得的往事：花架倾倒'))heard=true;}drain();}
 assert.equal(heard,true);`);
});
