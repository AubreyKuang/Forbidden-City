const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(path='both'){
 const b=world(644);b.ctx.assert=assert;b.ctx.path=path;
 b.run(`A.newGame();A.start();drain();S.turn=24;var c=makeGirl({sur:'陆',given:'知微',trait:'才女',age:22,fam:{t:'翰林学士',p:50}});
 c.solitary={path,stage:0,last:null,respect:0,history:[]};deepen(c);addConsort(c,3,'选秀入宫');c.aff=75;c.hp=90;c.mood=70;c.xin={k:'平和',t:S.turn};S.turn+=3;E().energy=10;PalaceActions.reset();`);return b;
}
test('new people can combine reserve with literary talent or Daoist interests without rerolling identity',()=>{
 const {run}=boot();run(`var paths=new Set(),count=0;for(var i=1;i<=1200;i++){
 var p={id:i,seed:i,age:19,trait:i%2?'才女':'沉静',fam:{t:'书香门第',p:15}};initSolitary(p);
 if(p.solitary){count++;paths.add(p.solitary.path);var identity=JSON.stringify(p);initSolitary(p);assert.equal(JSON.stringify(p),identity);}}
 assert.deepEqual([...paths].sort(),['both','dao','letters']);assert.ok(count>80&&count<300);
 for(var trait of ['善妒','骄纵','好客','城府'])for(var seed=1;seed<100;seed++){var p={seed,age:19,trait,fam:{t:'寒门',p:5}};initSolitary(p);assert.equal(p.solitary,undefined);}
 var old={...c};delete old.solitary;deepen(old);assert.equal(old.solitary,undefined);
 assert.equal(c.trait,'才女');assert.ok(!['信佛','好胜','记仇'].includes(c.t2));assert.notEqual(c.like,'佛经');`);
});
test('selection, newcomer welcome and close daily voice retain an independent disposition',()=>{
 const {run}=boot();run(`S.cands=[c];S.selection={phase:'audience',current:c.id};assert.equal(entryManner(c),'solitary');assert.match(viewSelectionAudience(),/诗道兼修/);
 c.entryAdjustment={turn:S.turn,manner:entryManner(c),settled:false};assert.match(newcomerWelcomeEvent(c).text,/并非与谁不睦/);newcomerWelcomeEvent(c).choices[0].f();
 for(var aff of [10,50,95]){c.aff=aff;assert.equal(consortVoicePool(c)[0].key,'solitary');assert.match(palaceWelcome(c).text,/臣妾|诗|问道|陛下/);}
 assert.match(solitaryVoice(c).lines.join(''),/不是疏远/);`);
});
test('neutral relations do not drift into friends or enemies and real injuries still persist',()=>{
 const {run}=boot();run(`var other=harem().find(o=>o!==c);other.trait='善妒';other.favor=0;c.favor=100;S.rel={};initRel(c);assert.equal(relGet(c,other),0);
 for(var i=0;i<60;i++){S.turn++;relTick();consortSocialTick();}assert.equal(relGet(c,other),0);assert.equal(c.lastSocial,undefined);
 relAdd(c,other,-70);relTick();assert.ok(relGet(c,other)<-60);assert.match(relLine(c),/交恶/);
 relAdd(c,other,150);assert.match(relLine(c),/敬重/);assert.ok(!relLine(c).includes('交好'));`);
});
test('high rank and favor do not recruit a faction or trigger visits and generic friend initiatives',()=>{
 const {run}=boot();run(`c.rank=7;c.favor=100;for(var o of harem())if(o!==c)relAdd(c,o,90);
 assert.equal(facOf(c),null);assert.ok(!leaders().includes(c));assert.equal(initiativeAlly(c),undefined);assert.equal(pastimePartner(c),undefined);
 for(var roll of [.4,.7,.95])assert.notEqual(npcRoutine(c,roll).where,'visit');
 var peer=harem().find(o=>o!==c);c.initiative={id:'winterTea',turn:S.turn,target:peer.id};assert.equal(initiativeParticipants(c,c.initiative),null);
 assert.notEqual(residencePetitionFor(c)?.reason?.includes('闲时也好相伴'),true);
 c.rank=8;for(var o of harem())if(o!==c&&o.rank===8)o.rank=5;assert.ok(!leaders().includes(c));`);
});
test('reserve does not remove motherhood or assigned palace duties',()=>{
 const {run}=boot();run(`var k=makeKid(c,'f','清和');k.born=S.turn-96;k.pendingName=false;c.initiative={id:'archery',turn:S.turn,target:k.id};
 assert.equal(initiativeParticipants(c,c.initiative).target,k);assert.equal(canManageFeast(c),true);
 c.childConcern={value:90};k.away=true;assert.notEqual(motherConcernVoice(c),null);`);
});
test('three paths have distinct middle encounters and respect develops without changing personality',()=>{
 for(const path of ['letters','dao','both']){const {run}=boot(path);run(`var original=[c.trait,c.solitary.path,c.artPortrait,c.fam.t].join();var first=solitaryEvent(c);first.choices[0].f();assert.equal(E().energy,9);assert.equal(first.choices[0].f(),null);assert.equal(solitaryEvent(c),null);
 S.turn+=6;var middle=solitaryEvent(c);assert.equal(middle.title,{letters:'一行不改',dao:'问道不随众',both:'诗与道之间'}[path]);middle.choices[1].f();S.turn+=6;
 assert.equal(solitaryEvent(c).title,'灯下留席');solitaryEvent(c).choices[0].f();assert.equal(c.solitary.stage,3);assert.equal(c.solitary.respect,3);assert.equal(solitaryEvent(c),null);assert.equal(E().energy,7);
 assert.equal([c.trait,c.solitary.path,c.artPortrait,c.fam.t].join(),original);assert.equal(c.solitary.history.length,3);assert.match(solitaryPanel(c),/各留一段独处/);assert.ok(NPCMemory.recall(S,c.id).some(m=>m.type==='solitary-trust'));`);}
});
test('pressuring her to socialize is remembered without forced friends or a personality conversion',()=>{
 const {run}=boot();run(`var affinity=c.aff;solitaryEvent(c).choices[2].f();assert.equal(c.aff,affinity-2);assert.equal(c.solitary.respect,0);assert.match(solitaryVoice(c).lines.join(''),/不能奉旨便亲近/);assert.equal(initiativeAlly(c),undefined);`);
});
test('grief, illness, absence and energy gate scenes while pregnancy keeps the encounter at home',()=>{
 const {run}=boot();run(`for(var condition of [{cold:true},{gone:true},{alive:false},{templeStay:{}},{hp:20},{xin:{k:'悲恸',t:S.turn}}]){
 var saved={...c};Object.assign(c,condition);assert.equal(solitaryEvent(c),null);Object.assign(c,saved);delete c.templeStay;}
 E().energy=0;var ev=solitaryEvent(c);assert.equal(ev.choices[0].cond(),false);assert.equal(ev.choices[0].f(),null);assert.equal(c.solitary.stage,0);
 E().energy=5;c.preg=8;assert.ok(solitaryEvent(c).text.includes(c.palace));assert.equal(daoEligible(c),false);assert.equal(solitaryVoice(c).key,'solitary-pregnant');
 var stale=solitaryEvent(c);c.cold=true;assert.equal(stale.choices[0].f(),null);assert.equal(E().energy,5);`);
});
test('literary and spiritual interests remain separate, with honest recorded visits',()=>{
 const {run}=boot('dao');run(`assert.equal(daoInterest(c),2);assert.equal(c.daoPractice,undefined);c.t2='信佛';assert.equal(daoInterest(c),0);c.t2='畏寒';
 recordDaoVisit(c);assert.equal(c.daoPractice.visits,1);recordDaoVisit(c);assert.equal(c.daoPractice.visits,1);assert.equal(daoInterest(c),3);
 c.solitary.path='letters';delete c.daoPractice;c.trait='才女';assert.equal(daoInterest(c),0);`);
});
test('neutral solitude is not converted into neglect distress or opportunistic intrigue',()=>{
 const {run}=boot();run(`c.aff=10;c.favor=0;for(var i=0;i<80;i++){S.turn++;xinTick(c);}assert.equal(xinOf(c),'平和');
 c.scheme=100;c.mood=10;S.consorts=[c];assert.equal(HAREM.find(f=>f.name==='musk')(),null);assert.equal(HAREM.find(f=>f.name==='wugu')(),null);assert.equal(ARCS.ambition.fit(c),false);assert.equal(ARCS.scholar.fit(c),false);assert.equal(ARCS.craft.fit(c),true);`);
});
test('family-based origins remain distinct without inventing relatives or deaths',()=>{
 const {run}=boot();run(`assert.match(solitaryOrigin(c),/家中重诗书/);c.fam={t:'寒门',p:5};assert.match(solitaryOrigin(c),/门庭不阔/);c.fam={t:'内阁首辅',p:90};assert.match(solitaryOrigin(c),/出身显门/);
 c.solitary.origin=solitaryOrigin(c);c.fam={t:'寒门',p:5};assert.match(solitaryOrigin(c),/出身显门/);assert.ok(!/亡|五位|兄长/.test(solitaryOrigin(c)));`);
});
test('rendering and save restoration preserve choices, cooldown, new tags and original identities',()=>{
 const {run}=boot();run(`solitaryEvent(c).choices[0].f();var id=c.id;UI.view='consort';UI.sel=id;var state=JSON.stringify(c.solitary);for(var i=0;i<12;i++){viewConsort();palaceWelcome(c);}assert.equal(JSON.stringify(c.solitary),state);
 save('1');load('1');c=byId(id);assert.equal(JSON.stringify(c.solitary),state);assert.equal(solitaryEvent(c),null);assert.match(viewConsort(),/孤高 · 诗道兼修/);`);
});
test('a pending personal conversation replays across a fresh runtime with exactly one paid choice',()=>{
 const b=boot();b.run(`A.solitaryTalk(c.id);save('auto');`);const next=world(900,b.storage);next.ctx.assert=assert;
 next.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'清茶留白');var c=curEv.por,before=E().energy;choose(0);assert.equal(c.solitary.stage,1);assert.equal(E().energy,before-1);nextEv();save('auto');`);
 const again=world(4,b.storage);again.ctx.assert=assert;again.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var c=harem().find(c=>isSolitary(c)&&c.solitary.stage===1);assert.equal(c.solitary.history.length,1);assert.equal(E().energy,9);`);
});
