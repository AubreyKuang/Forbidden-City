const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');
function setup(){const b=world();b.ctx.assert=assert;return b;}
test('official and scholar profiles expose marriage without treating fathers as unmarried',()=>{
 const b=setup();b.run(`UI.sel=key;assert.ok(viewOfficial().includes('议婚 / 赐婚'));UI.sel=scholar.id;assert.ok(viewScholar().includes('议婚 / 赐婚'));
 assert.match(officialMarriageReason(courtPerson(c.id+':father')),/已有家室/);A.officialMarriage(c.id+':father');assert.equal(modalOpen,false);
 assert.equal(officialMarriageReason(courtPerson(key)),'');assert.equal(officialMarriageReason(courtPerson('scholar:'+scholar.id)),'');`);
});
test('real relatives, fifteen-year-old princess and fixed named visiting cards are available',()=>{
 const b=setup();b.run(`A.officialMarriage(key);assert.match(curEv.text,/十五岁/);var offers=courtPerson(key).p.officialCourtship;
 assert.ok(offers.candidates.some(b=>b.id===k.id));assert.ok(offers.candidates.some(b=>b.id===sister.id));assert.equal(offers.candidates.filter(b=>b.kind==='guest').length,2);
 var cards=JSON.stringify(offers);officialMarriageOffers(courtPerson(key));assert.equal(JSON.stringify(offers),cards);
 assert.equal(S.officialMarriages.guests.some(g=>S.consorts.includes(g)||S.cands.includes(g)),false);assert.ok(S.officialMarriages.guests.every(g=>g.name&&g.born&&officialMarriageAge(g)>=18));`);
});
test('princess boundary is fifteen; a newly eligible princess joins the same stable visiting cards',()=>{
 const b=setup();b.run(`k.born=S.turn-14*12;var o=officialMarriageOffers(courtPerson(key));assert.ok(!o.candidates.some(b=>b.id===k.id));
 var guests=JSON.stringify(S.officialMarriages.guests);k.born=S.turn-15*12;o=officialMarriageOffers(courtPerson(key));assert.ok(o.candidates.some(b=>b.id===k.id));assert.equal(JSON.stringify(S.officialMarriages.guests),guests);
 sister.born=S.turn-17*12;assert.equal(officialMarriageOpen(courtPerson(key),officialMarriageBride(br)),false);`);
});
test('same surname, clan and family kin remain eligible under the chosen marriage rules',()=>{
 const b=setup();b.run(`k.mom=c.id;k.foster=c.id;k.sur='沈';assert.equal(officialMarriageOpen(courtPerson(key),officialMarriageBride(kr)),true);
 var own=addNatalPerson(c,h,'f',22,793,false);own.married=false;delete own.spouse;assert.equal(officialMarriageOpen(courtPerson(key),{kind:'family',id:own.id,p:own,c,h}),true);
 own.married=true;assert.equal(officialMarriageOpen(courtPerson(key),{kind:'family',id:own.id,p:own,c,h}),false);`);
});
for(const [title,patch] of [['student',`h.brother.career='student'`],['commoner',`h.brother.career='commoner'`],['married',`h.brother.married=true`],['known spouse',`h.brother.spouseName='原配'`],['minor',`h.brother.age=17`],['dead',`h.brother.alive=false`],['exiled',`h.brother.exiled=true`],['commission',`h.brother.commission={due:90}`],['report',`h.brother.report={text:'回奏'}`]])test('ineligible groom cannot open or confirm: '+title,()=>{
 const b=setup();b.run(`var round=agree(ref,br);${patch};assert.ok(officialMarriageReason(courtPerson(key)));assert.equal(officialMarriageConfirm(ref,br,round),null);assert.equal(E().treasury,900);assert.equal(sister.married,false);`);
});
test('an existing proposal stays selectable but cannot be silently overwritten',()=>{
 const b=setup();b.run(`sister.betrothal={match:{kind:'noble',name:'顾旧约'}};assert.equal(officialMarriageOpen(courtPerson(key),officialMarriageBride(br)),true);
 var round=agree(ref,br);assert.equal(officialMarriageConfirm(ref,br,round),null);assert.equal(sister.betrothal.match.name,'顾旧约');assert.equal(E().treasury,900);
 assert.ok(officialMarriageConfirm(ref,br,round,true));assert.equal(sister.betrothal,undefined);assert.ok(sister.story.some(s=>s.t.includes('顾旧约')&&s.t.includes('止议')));`);
 const d=setup();d.run(`sister.betrothal={match:{kind:'alliance',name:h.brother.name,consortId:c.id,role:'brother',personId:h.brother.id}};
 var o=officialMarriageOffers(courtPerson(key));assert.ok(o.candidates.some(b=>b.kind==='princess'));assert.ok(officialMarriageConfirm(ref,br,agree(ref,br)));assert.equal(sister.betrothal,undefined);assert.equal(h.brother.spouseName,sister.name);`);
});
test('choosing another bride releases the original family proposal and keeps its history',()=>{
 const b=setup();b.run(`sister.betrothal={match:{kind:'alliance',name:h.brother.name,consortId:c.id,role:'brother',personId:h.brother.id}};
 var round=agree(ref,kr);assert.equal(officialMarriageConfirm(ref,kr,round),null);assert.ok(officialMarriageConfirm(ref,kr,round,true));assert.equal(sister.betrothal,undefined);assert.equal(sister.married,false);assert.ok(sister.story.some(s=>s.t.includes('止议')));assert.ok(k.married);`);
});
test('marrying real family members preserves identities, creates friendship and records both families',()=>{
 const b=setup();b.run(`var pid=h.brother.id,bid=sister.id,face=sister.artPortrait;assert.ok(officialMarriageConfirm(ref,br,agree(ref,br)));
 assert.equal(sister.id,bid);assert.equal(sister.artPortrait,face);assert.equal(sister.spouse.id,pid);assert.equal(sister.spouse.alive,true);assert.equal(sister.spouse.alliance.personId,pid);
 assert.equal(h.brother.spouse.id,bid);assert.equal(E().treasury,880);assert.equal(E().energy,9);assert.ok(relGet(c,other)>=30);
 assert.ok(c.story.some(s=>s.t.includes(sister.name)&&s.t.includes(h.brother.name)));assert.ok(other.story.some(s=>s.t.includes(sister.name)&&s.t.includes(h.brother.name)));
 assert.ok(NPCMemory.recall(S,pid).some(m=>m.subject===String(bid)));assert.equal(officialMarriageConfirm(ref,br,1),null);assert.equal(E().treasury,880);`);
});
test('harem willingness does not stand in for marriage consent; decline is respected',()=>{
 const b=setup();b.run(`assert.equal(sister.willing,false);var round=agree(ref,br);assert.equal(h.brother.officialCourtship.answers[officialBrideToken(br)].bride,true);
 sister.marriageWilling=false;assert.equal(officialMarriageConfirm(ref,br,round),null);h.brother.officialCourtship.answers={};agree(ref,br);assert.equal(officialMarriageReview(ref,br).choices.some(x=>x.t.startsWith('下诏')),false);assert.equal(E().treasury,900);`);
});
test('consent must precede payment and scarce funds or energy cannot mutate the marriage',()=>{
 const b=setup();b.run(`var o=officialMarriageOffers(courtPerson(key));assert.equal(officialMarriageConfirm(ref,br,o.round),null);agree(ref,br);
 E().treasury=19;assert.equal(officialMarriageConfirm(ref,br,o.round),null);E().treasury=900;E().energy=0;assert.equal(officialMarriageConfirm(ref,br,o.round),null);
 assert.equal(sister.married,false);assert.equal(S.officialMarriages.couples.length,0);E().energy=10;sister.married=true;assert.equal(officialMarriageConfirm(ref,br,o.round),null);assert.equal(E().treasury,900);`);
});
test('princess marries the actual officer with original portrait, rank and reciprocal household links',()=>{
 const b=setup();b.run(`var office=h.brother.office,face=h.brother.artPortrait;assert.ok(officialMarriageConfirm(ref,kr,agree(ref,kr)));
 assert.equal(k.spouse.id,h.brother.id);assert.equal(k.spouse.artPortrait,face);assert.equal(h.brother.office,office);assert.equal(k.spouse.background,office);assert.ok(k.household);assert.equal(k.princessMarriage,'official');
 assert.equal(E().treasury,850);assert.match(marriagePanel(k),/查看驸马沈明远的履历/);assert.match(officialMarriagePanel(key),/看看清宁的近况/);
 assert.ok(k.story.some(s=>s.t.includes(h.brother.name)&&s.t.includes('成婚')));assert.ok(h.brother.story.some(s=>s.t.includes(k.name)&&s.t.includes('成婚')));
 householdRecord(k,'household_daily','清宁与沈明远整理家中书房。');assert.ok(h.brother.story.some(s=>s.t.includes('整理家中书房')));`);
});
test('new scholar can marry a family woman or a princess without fabricating another official',()=>{
 for(const bride of ['br','kr']){const b=setup();b.run(`var sr=officialMarriageRef(courtPerson('scholar:'+scholar.id));assert.ok(officialMarriageConfirm(sr,${bride},agree(sr,${bride})));assert.equal(officialMarriageBride(${bride}).p.spouse.id,scholar.id);assert.equal(scholar.married,true);assert.equal(S.scholars.length,1);`);}
});
test('spouse deaths propagate once, terminate active household scenes and keep the wedding history',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,kr,agree(ref,kr));officialDeath(c,'brother','奉差途中病故');assert.equal(k.spouse.alive,false);assert.equal(householdLiving(k),false);
 var count=k.story.length;syncOfficialMarriages();assert.equal(k.story.length,count);assert.ok(k.story.some(s=>s.t.includes('沈明远')&&s.t.includes('病故')));
 S.turn++;marriedLifeTick();assert.equal(k.household.pregnancies.length,0);assert.equal(k.household.pending,null);assert.equal(h.brother.married,true);`);
 const d=setup();d.run(`officialMarriageConfirm(ref,br,agree(ref,br));sister.alive=false;syncOfficialMarriages();assert.equal(h.brother.spouse.alive,false);assert.ok(h.brother.story.some(s=>s.t.includes(sister.name+'去世')));`);
});
test('couples remain tied to their archived identities across a succession',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,kr,agree(ref,kr));var groomId=h.brother.id,wedding=S.officialMarriages.couples[0];
 S.previousCourts=[{gen:S.gen,consorts:JSON.parse(JSON.stringify(S.consorts))}];S.royalRelatives=[k];S.consorts=[];S.children=[];S.gen++;
 var archived=officialMarriagePerson(wedding.groom);assert.equal(archived.p.id,groomId);assert.equal(archived.archived,true);archived.p.alive=false;syncOfficialMarriages();assert.equal(k.spouse.alive,false);
 assert.ok(officialMarriageReason(archived));assert.equal(S.officialMarriages.couples.length,1);`);
});
test('six-month family letters are named, mirrored and charged just once',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,br,agree(ref,br));A.officialMarriageTalk(key);assert.equal(modalOpen,false);S.turn+=6;PalaceActions.reset();A.officialMarriageTalk(key);assert.equal(curEv.title,'婚后家书');
 assert.match(curEv.text,new RegExp(sister.name));assert.ok(sister.story.some(s=>s.t.includes('婚后家书')));assert.equal(E().energy,8);drain();A.officialMarriageTalk(key);assert.equal(modalOpen,false);assert.equal(E().energy,8);`);
});
test('all real action stages restore unchanged after refresh, including result and reciprocal links',()=>{
 const b=setup();b.run(`var check=()=>{var before=JSON.stringify(S.officialMarriages),title=curEv?.title;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv?.title,title);assert.equal(JSON.stringify(S.officialMarriages),before);};
 A.officialMarriage(key);check();option('适婚公主');check();option('清宁');check();option('分别问');check();option('下诏');check();assert.ok(modalResult);drain();
 var man=courtPerson(key).p;assert.equal(man.married,true);assert.equal(royalById(kr.id).spouse.id,man.id);assert.equal(E().treasury,850);assert.equal(S.officialMarriages.couples.length,1);`);
});
test('princess-side route is reachable and both fourteen/fifteen boundaries hold through actions',()=>{
 const b=setup();b.run(`k.born=S.turn-14*12;A.princessMarriage(k.id);assert.equal(modalOpen,false);k.born=S.turn-15*12;PalaceActions.reset();A.princessMarriage(k.id);option('从在任官员');option('沈明远');option('分别问');option('下诏');assert.ok(k.married);`);
});
test('a real v14 pending princess marriage retains old choices and recorded random draws',()=>{
 const data=require('./fixtures/official-marriage-legacy-v14.json'),b=boot(821,new Map([['chengongji_v1_auto',JSON.stringify(data)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'公主婚事');assert.ok(!curEv.choices.some(x=>x.t.includes('从在任官员')));choose(0);assert.equal(curEv.title,'灯下谈婚事');choose(0);assert.ok(modalResult);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();assert.equal(S.officialMarriages,undefined);`);
});
