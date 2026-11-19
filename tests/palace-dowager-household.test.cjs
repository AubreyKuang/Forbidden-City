const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./dowager-household-world.cjs'),{boot}=require('./playtest-harness.cjs');
function scene(code){const b=world();b.ctx.assert=assert;b.run(code);return b;}
test('a normal consort without a health field can visit, but absence and recovery exclude her',()=>{
 scene(`delete c.hp;assert.equal(c.hp,undefined);assert.ok(dowagerVisitReady(c));for(var field of ['cold','gone','homeLeave','templeStay','maid']){c[field]=true;assert.ok(!dowagerVisitReady(c),field);delete c[field];}c.alive=false;assert.ok(!dowagerVisitReady(c));c.alive=true;c.hp=40;assert.ok(!dowagerVisitReady(c));delete c.hp;c.preg=8;assert.ok(!dowagerVisitReady(c));c.preg=0;beginConsortRecovery(c,'loss');assert.ok(!dowagerVisitReady(c));S.turn+=3;assert.ok(dowagerVisitReady(c));c.illnessRecovery={until:S.turn+2};assert.ok(!dowagerVisitReady(c));`);
});
test('company is occasional and stable for the month; opening the palace does not reroll it',()=>{
 const b=world();b.ctx.assert=assert;b.force(.9);b.run(`prepareDowagerCompany(d);assert.equal(d.household.company.people.length,0);var before=JSON.stringify(d);prepareDowagerCompany(d);assert.equal(JSON.stringify(d),before);S.turn++;`);b.force(.01,0);b.run(`prepareDowagerCompany(d);assert.deepEqual(d.household.company.people,[cid]);var before=JSON.stringify(d);prepareDowagerCompany(d);assert.equal(JSON.stringify(d),before);assert.equal(d.household.bonds[cid].visits,1);assert.equal(c.story.filter(s=>s.t.includes('慈宁宫往来')).length,1);UI.sel='cn';assert.match(viewPlace(),/沈知微/);`);
});
test('frequent companionship is earned by separate months, not reopening the same scene',()=>{
 scene(`dowagerLiving(d);noteDowagerCompany(d,[c]);var a=dowagerCompanyEvent(d,[c]);assert.ok(!a.text.includes('多亏她常来'));noteDowagerCompany(d,[c]);assert.equal(d.household.bonds[cid].visits,1);S.turn++;noteDowagerCompany(d,[c]);S.turn++;noteDowagerCompany(d,[c]);assert.match(dowagerCompanyEvent(d,[c]).text,/多亏她常来/);`);
});
test('kin newborn twins are one topic with real identities and records for mother and both children',()=>{
 scene(`var one=makeKid(c,'f','明珠'),two=makeKid(c,'m','明珩');for(var child of [one,two]){child.born=S.turn;delete child.pendingName;}dowagerFamilyChanges();dowagerFamilyChanges();var news=d.household.news.filter(n=>n.kind==='birth');assert.equal(news.length,1);var ev=dowagerNewsEvent(d,news[0]);assert.match(ev.text,/明珠/);assert.match(ev.text,/明珩/);assert.match(ev.text,/母家/);assert.match(ev.text,/男孩女孩/);assert.equal(ev.present.length,0);ev.onShow();ev.choices[0].f();var before=JSON.stringify({...S,savedAt:undefined});ev.choices[0].f();assert.equal(JSON.stringify({...S,savedAt:undefined}),before);assert.ok(c.story.some(s=>s.t.includes('太后问候')));for(var child of [one,two])assert.ok(child.story.some(s=>s.t.includes('太后在慈宁宫')));assert.equal(dowagerNewsEvent(d,news[0]),null);`);
});
test('birth news excludes unnamed, deceased, removed, future and older children',()=>{
 scene(`for(var state of ['unnamed','dead','removed','future','old']){var child=makeKid(c,'f',state);child.born=S.turn;delete child.pendingName;if(state==='unnamed')child.pendingName=true;if(state==='dead')child.alive=false;if(state==='removed')child.removedFromRoyal=true;if(state==='future')child.born++;if(state==='old')child.born-=4;}dowagerFamilyChanges();assert.equal(d.household.news.length,0);`);
});
test('a real family death causes grief once, precedes praise and remembers surviving children',()=>{
 scene(`var child=makeKid(c,'f','明珠');delete child.pendingName;var previous=JSON.parse(JSON.stringify({...S,savedAt:undefined}));c.alive=false;c.deathReason='产后血崩';story(c,'生产后血崩，抢救无效薨逝。');dowagerFamilyChanges(previous);assert.equal(d.mood,40);assert.equal(d.feeling.kind,'悲恸');assert.equal(d.household.news.filter(n=>n.kind==='death').length,1);dowagerFamilyChanges();assert.equal(d.mood,40);var ev=dowagerEvent();assert.equal(ev.title,'慈宁宫 · 母家旧人');assert.match(ev.text,/血崩/);assert.match(ev.text,/明珠/);assert.equal(ev.present.length,0);ev.onShow();ev.choices[0].f();assert.doesNotMatch(dowagerEvent().text,/开枝散叶|子嗣|笑着/);assert.ok(c.story.some(s=>s.t.includes('身后家人')));`);
});
test('old unrelated losses do not invent new grief; a recent dated old-save loss does',()=>{
 scene(`c.alive=false;other.alive=false;story(other,'病逝。');dowagerFamilyChanges();assert.equal(d.household.news.length,0);story(c,'病逝。');dowagerFamilyChanges();assert.equal(d.household.news.length,1);assert.equal(d.household.news[0].person,cid);`);
});
test('the dowager cannot name a culprit from a secret or nonfatal unrelated case',()=>{
 scene(`c.alive=false;var x=openPalaceCase({kind:'harem',crime:'香囊藏麝',culprit:oid,victim:cid});x.status='solved';x.fatal=true;x.withheld=true;dowagerFamilyChanges();assert.ok(!d.household.news.some(n=>n.kind==='justice'));d.household.publicCases[x.id]={culprit:oid,victim:cid};dowagerFamilyChanges();assert.ok(!d.household.news.some(n=>n.kind==='justice'));x.withheld=false;x.fatal=false;dowagerFamilyChanges();assert.ok(!d.household.news.some(n=>n.kind==='justice'));x.fatal=true;dowagerFamilyChanges();assert.equal(d.household.news.filter(n=>n.kind==='justice').length,1);var ev=dowagerNewsEvent(d,d.household.news[0]);assert.match(ev.text,/魏清微/);assert.equal(ev.present.length,0);`);
});
test('publicly announced punishment links the real case and does not punish the same person twice',()=>{
 scene(`var x=openPalaceCase({kind:'harem',crime:'石阶泼油',culprit:oid,victim:cid});x.fatal=true;c.alive=false;var ev=punishEv(other,c,'石阶泼油');ev.onShow();ev.choices[1].f();assert.ok(d.household.publicCases[x.id].penalty);assert.equal(x.status,'solved');dowagerFamilyChanges();var news=d.household.news.find(n=>n.kind==='justice');assert.ok(news);var talk=dowagerNewsEvent(d,news);assert.match(talk.text,/先前已有处置/);assert.equal(talk.choices.length,1);var rank=other.rank;talk.onShow();talk.choices[0].f();assert.equal(other.rank,rank);`);
});
test('queen praise requires both recent real work and a warm relationship',()=>{
 scene(`c.rank=8;dowagerLiving(d);var ev=dowagerCompanyEvent(d,[c]);assert.ok(!ev.text.includes('这些操劳'));story(c,'主持宫务，安排掌事女官照看新人。');assert.match(dowagerCompanyEvent(d,[c]).text,/这些操劳/);d.household.bonds[cid]={score:20,visits:1};ev=dowagerCompanyEvent(d,[c]);assert.ok(!ev.text.includes('这些操劳'));assert.match(ev.text,/生分/);d.household.bonds[cid].score=80;S.turn+=7;S.month=8;assert.ok(!dowagerCompanyEvent(d,[c]).text.includes('这些操劳'));`);
});
test('private opinions use actual favor and relations, and do not enter the absent consort memory',()=>{
 scene(`dowagerLiving(d);var ev=dowagerFavoriteComment(d);assert.match(ev.text,/让人喜欢/);assert.equal(ev.present.length,0);var n=c.story.length;ev.onShow();ev.choices[0].f();assert.equal(c.story.length,n);assert.equal(dowagerFavoriteComment(d),null);S.turn+=8;d.household.bonds[cid]={score:20,visits:0};ev=dowagerFavoriteComment(d);assert.match(ev.text,/少些独宠/);var favor=c.favor;ev.onShow();ev.choices[0].f();assert.equal(c.favor,favor);c.cold=true;assert.equal(dowagerFavoriteComment(d),null);`);
});
test('a selected companion who becomes unavailable cannot act in a stale scene',()=>{
 scene(`dowagerLiving(d);var ev=dowagerCompanyEvent(d,[c]);c.homeLeave={until:S.turn+1};assert.equal(ev.valid(),false);var before=JSON.stringify({...S,savedAt:undefined});ev.choices[0].f();assert.equal(JSON.stringify({...S,savedAt:undefined}),before);`);
});
test('a deceased dowager has neither visitors nor a new dialogue',()=>{
 scene(`d.alive=false;assert.equal(dowagerEvent(),null);assert.equal(prepareDowagerCompany(d).people.length,0);c.alive=false;story(c,'病逝。');dowagerFamilyChanges();assert.equal(d.story.length,0);`);
});
test('pending tea company and its result reload with identical people, memories and energy',()=>{
 const b=world();b.ctx.assert=assert;b.force(0,0);b.run(`A.greet();assert.equal(curEv.title,'慈宁宫 · 茶席有伴');var title=curEv.title,text=curEv.text,before=JSON.stringify({...S,savedAt:undefined}),energy=E().energy;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);assert.equal(curEv.text,text);assert.equal(JSON.stringify({...S,savedAt:undefined}),before);choose(0);var after=JSON.stringify({...S,savedAt:undefined});save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(JSON.stringify({...S,savedAt:undefined}),after);assert.equal(E().energy,energy);assert.equal(S.flags.dowager.household.bonds[cid].visits,1);drain();`);
});
test('a real version 19 pending greeting retains its old rolls and words after upgrade',()=>{
 const data=require('./fixtures/dowager-greeting-legacy-v19.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'慈宁宫');assert.equal(S.flags.dowager.household,undefined);choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();`);
});

test('the emperor can separately visit his legal mother in the east hall and birth mother in the west hall',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`var main=S.flags.dowager,biological=S.flags.birthDowager=makeDowager(other,'生母 · 尊为皇太后');
   UI.sel='cn';assert.match(viewPlace(),/慈宁宫东殿/);assert.match(viewPlace(),/慈宁宫西殿/);
   assert.match(viewPlace(),/A\.greet\(\).*A\.greetBirthDowager\(\)/s);
   E().energy=10;var previous=main.story.length;PalaceActions.reset();
   A.greetBirthDowager();assert.equal(curEv.title,'慈宁宫西殿 · 西殿初叙');assert.equal(E().energy,9);
   save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'慈宁宫西殿 · 西殿初叙');
   choose(0);drain();assert.equal(S.flags.dowager.story.length,previous);
   assert.ok(S.flags.birthDowager.story.some(e=>e.t.includes('西殿初叙')));
   A.greet();assert.ok(modalOpen);assert.notEqual(curEv.por?.dowagerName,S.flags.birthDowager.name);drain();
   S.flags.dowager.alive=false;assert.match(viewPlace(),/A\.greetBirthDowager/);
   A.greetBirthDowager();assert.match(curEv.title,/慈宁宫西殿/);drain();`);
});
