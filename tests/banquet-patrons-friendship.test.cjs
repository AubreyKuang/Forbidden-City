const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');
function setup(){
 const b=world();b.ctx.assert=assert;b.run(`E().age=32;E().energy=20;E().treasury=400;S.month=6;S.year=13;S.turn=150;
 q.birthMonth=a.birthMonth=6;q.favor=85;a.rank=6;a.favor=80;b.favor=12;a.enteredAt=b.enteredAt=0;
 a.house.father.office=a.house.father.post='礼部尚书';Object.assign(a.house.father,{career:'official',away:false,alive:true,retired:false});
 var storyKid=makeKid(a,'f','清竹');storyKid.born=S.turn-7*12;S.rel[rk(a,b)]=65;
 var arc=friendshipTrack(a,b);PalaceActions.reset();`);return b;
}
for(const [key,kind] of [['xiaoman','empress'],['suheng','family'],['hongjian','family']]){
 test('actual banquet presents '+key+' and preserves the established entry story',()=>{
 const w=setup();w.ctx.key=key;w.ctx.kind=kind;
 w.run(`var id=kind==='family'?'family-'+a.id:kind;const f=banquetKind(id);assert.ok(f.ready);var patron=banquetPatron(id,f);
 A.openBanquet(id);A.banquetArtist(key);assert.equal(UI.banquet.artist,key);A.holdBanquet();choose(0);
 assert.match(curEv.title,new RegExp(FEAST_ARTISTS[key]));assert.equal(E().treasury,kind==='family'?400:370);save('auto');`);
 const n=boot(122,w.storage);n.ctx.assert=assert;n.ctx.key=key;n.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);choose(0);drain();
 if(key==='hongjian'){assert.ok(fenghuaPerson('xueHongjian').story[0].t.includes('生辰家宴'));assert.equal(fenghuaEntryReady('xueHongjian'),false);}
 else {var r=storyCastRecord(key);assert.equal(r.stage,1);assert.equal(r.id,undefined);S.turn++;A.storyCastVisit(key);
 assert.match(curEv.title,key==='suheng'?/铺契/:/赏钱/);choose(0);drain();
 if(key==='xiaoman'){assert.equal(E().treasury,366);S.turn++;A.storyCastVisit(key);choose(0);drain();}assert.ok(r.id);}`);});
}
test('birthdays require rank, favor, date and an actual serving capital relative; personal and public accounts differ',()=>{
 const w=setup();w.run(`assert.ok(familyBirthdayEligible(a));const f=monthlyIntroduction();assert.match(f.title,/娘家请贺/);
 assert.ok(!monthlyIntroduction()?.title.includes('娘家请贺'));
 for(const [field,value] of [['rank',4],['favor',64],['cold',true],['birthMonth',5]]){const old=a[field];a[field]=value;assert.ok(!familyBirthdayEligible(a));a[field]=old;}
 for(const p of [a.house.father,...brotherRoles(a.house).map(r=>a.house[r]),...natalPeople(a.house)])p.away=true;
 assert.equal(familyBirthdayEligible(a),false);`);});
test('petition routes preserve gates, different identities and original remaining decisions',()=>{
 const w=setup();w.run(`S.year=2;assert.equal(palacePetitionReady('qingyi'),false);S.year=12;assert.equal(palacePetitionReady('chuwan'),false);S.year=13;
 for(const key of ['qingyi','luwan','chuwan']){A.storyPetition(key);choose(1);drain();assert.ok(!storyCastRecord(key));
 A.storyPetition(key);choose(0);drain();const r=storyCastRecord(key);assert.equal(r.stage,1);assert.equal(r.id,undefined);assert.equal(palacePetitionReady(key),false);S.turn++;A.storyCastVisit(key);assert.ok(curEv);choose(0);drain();}
 assert.ok(storyCastRecord('qingyi').office);assert.ok(storyCastRecord('luwan').id);
 assert.ok(storyCastRecord('chuwan').revealed);`);});
test('family toast needs a real attending child and friends, protects a bereaved or foster parent, produces two recorded reactions and lasting distance',()=>{
 const w=setup();w.run(`assert.ok(arc);Math.random=()=>0;
 assert.equal(banquetFriendshipIncident([a,b],'中秋宫宴',null),null);
 b.lastBirth=20;assert.equal(banquetFriendshipIncident([a,b,storyKid],'中秋宫宴',null),null);b.lastBirth=-99;
 storyKid.foster=b.id;assert.equal(banquetFriendshipIncident([a,b,storyKid],'中秋宫宴',null),null);delete storyKid.foster;
 for(let i=0;i<6;i++){S.turn+=12;var note=banquetFriendshipIncident([a,b,storyKid],'中秋宫宴',null);assert.ok(note);assert.match(note.text,/清竹/);}
 assert.equal(arc.stage,'broken');assert.notEqual(a.friendshipNotes[b.id].thought,b.friendshipNotes[a.id].thought);
 const relation=relGet(a,b);assert.match(banquetPair(a,b,'投壶',true,{}),/各自用膳/);assert.equal(relGet(a,b),relation);`);});
test('a birthday honor only hurts the attending friend if the birthday guest is favored',()=>{
 const w=setup();w.run(`Math.random=()=>0;const originally=b.favor;b.favor=61;assert.equal(banquetFriendshipIncident([a,b],'生辰宴',a),null);b.favor=originally;
 assert.equal(banquetFriendshipIncident([a,b],'生辰宴',q),null);assert.match(banquetFriendshipIncident([a,b],'生辰宴',a).title,/寿席/);
 assert.equal(banquetFriendshipIncident([a,b],'生辰宴',a),null);`);});
test('rank seating crosses tables, honors the customized list including infants and mandatory birthday guest, and restores the same open banquet',()=>{
 const w=setup();w.run(`var infant=makeKid(q,'m','安和'),older=makeKid(a,'f','云华');older.born=S.turn-12*12;
 A.openBanquet('empress');A.banquetRankSeats();
 assert.deepEqual(Array.from(UI.banquet.seats),[q.id,a.id,b.id,older.id,storyKid.id,infant.id]);
 A.banquetGuest(q.id);assert.ok(UI.banquet.seats.includes(q.id));
 A.banquetFirst(older.id);A.banquetMove(2,-1);
 const order=[...UI.banquet.seats];A.holdBanquet();assert.equal(curEv.gardenTables.length,2);
 assert.deepEqual(curEv.gardenTables.flat().map(p=>p.id),order);save('auto');`);
 const n=boot(234,w.storage);n.ctx.assert=assert;n.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
 assert.equal(curEv.gardenTables[0][0].name,'云华');assert.deepEqual(curEv.gardenTables.map(t=>t.length),[4,2]);
 choose(3);drain();A.banquetInviteAll(false);const c=S.consorts.find(c=>c.given==='清容');A.banquetGuest(c.id);A.banquetRankSeats();assert.equal(UI.banquet.seats.length,2);
 A.banquetInviteAll(true);assert.equal(UI.banquet.ranked,undefined);`);});
for(const kept of [false,true])test('selection final roster tells a sister once, even when the rejected candidate was dropped before saving '+kept,()=>{
 const w=setup();w.ctx.kept=kept;w.run(`const h=houseOf(a);for(const p of h.relatives)p.willing=false;
 var sister=addNatalPerson(a,h,'f',18,114,false);sister.willing=true;sister.married=false;sister.given='春燕';sister.name=a.sur+'春燕';
 var girl=registeredSelectionSister(a);S.rel[rk(a,girl)]=65;
 S.cands=[girl];S.selection={phase:'roster',accepted:[]};PalaceActions.reset();
 if(kept){A.xxTake(girl.id);choose(1);drain();}else A.xxDrop(girl.id);
 assert.ok(!a.story.some(e=>e.t.includes('【选秀 · 姐妹定榜】')));save('auto');`);
 const b=boot(44,w.storage);b.ctx.assert=assert;b.ctx.kept=kept;b.run(`A.load('auto');const a=S.consorts.find(c=>c.given==='知微');const mood=a.mood;
 A.xxEnd();drain();const notes=a.story.filter(e=>e.t.includes('【选秀 · 姐妹定榜】'));assert.equal(notes.length,1);
 assert.match(notes[0].t,kept?/春燕留选，初封答应/:/春燕此次未留选，归家/);assert.equal(a.mood,clamp(mood+(kept?8:-4)));
 assert.equal(xinOf(a),kept?'欢喜':'思念');finishSelection();assert.equal(a.story.filter(e=>e.t.includes('姐妹定榜')).length,1);
 assert.equal(S.log.filter(e=>e.b&&e.t.includes('选秀定榜')).length,kept?1:0);`);});
test('an illness ending survives the real monthly queue, reloads the funeral decision and never announces earlier deaths again',()=>{
 const w=setup();w.run(`for(const c of S.consorts)delete c.arc;a.arc=makeArc('ill',0);a.arc.st=2;a.arc.t=S.turn;a.arc.f={};S.flags.arcPacing={byType:{}};
 PalaceActions.reset();A.endMonth();for(let i=0;i<100&&curEv?.deathNotice!==a.id&&modalOpen;i++){if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(x=>!x.cond||x.cond()));}
 assert.equal(curEv?.deathNotice,a.id);assert.match(curEv.title,/后宫丧讯/);assert.match(curEv.text,/心疾/);assert.equal(a.alive,false);save('auto');`);
 const b=boot(72,w.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);const c=curEv.por,rank=c.rank;
 choose(0);drain();assert.equal(c.rank,Math.min(7,rank+1));assert.equal(c.story.filter(e=>e.t.startsWith('【丧讯】')).length,1);A.endMonth();assert.ok(![curEv,...Q].some(ev=>ev?.deathNotice===c.id));`);});
