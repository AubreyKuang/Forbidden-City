const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(921);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=60;E().energy=10;E().treasury=500;`);return b;}
const multi=`S.consorts=[];S.cands=[];S.children=[];var c=makeGirl({sur:'沈',age:26,fam:{t:'镇国大将军',p:60}});addConsort(c,4,'入宫');var h=houseOf(c);for(var role of brotherRoles(h))delete h[role];
 h.brother={name:'沈怀远',post:'参将',age:35};h.brother2={name:'沈明修',post:'守备',age:32};houseOf(c);var sister=makeKin(c,'亲');addConsort(sister,3,'入宫');`;
test('new households include zero through five brothers with stable distinct identities and plausible ages',()=>{
 const {run}=boot();run(`S.consorts=[];S.cands=[];var counts=new Set();for(var i=0;i<240;i++){var c=makeGirl({sur:'顾',age:25,fam:{t:'镇国大将军',p:60}});addConsort(c,3,'入宫');var h=houseOf(c),rs=brotherRoles(h);counts.add(rs.length);
 assert.equal(new Set(rs.map(r=>h[r].id)).size,rs.length);assert.equal(new Set(rs.map(r=>h[r].name)).size,rs.length);
 for(var r of rs){assert.ok(h[r].age>c.age);assert.ok(h.father.age>=h[r].age+18);}}
 assert.deepEqual([...counts].sort(),[0,1,2,3,4,5]);var before=JSON.stringify(S.consorts.map(c=>houseOf(c)));save('1');load('1');assert.equal(JSON.stringify(S.consorts.map(c=>houseOf(c))),before);`);
});
test('legacy single brother and explicit absence are preserved, without inventing new relatives',()=>{
 const {run}=boot();run(multi+`delete h.brother2;delete h.familyVersion;var old=JSON.stringify(h.brother);save('1');load('1');c=byId(c.id);h=houseOf(c);assert.deepEqual(brotherRoles(h),['brother']);assert.equal(JSON.stringify(h.brother),old);
 for(var woman of paternalFamily(c))woman.house=h;h.brother=null;save('2');load('2');c=byId(c.id);h=houseOf(c);assert.equal(brotherRoles(h).length,0);assert.match(houseLine(c),/无兄长/);assert.match(familyGraphSVG(),/无兄长/);
 c.trait='贪财';assert.equal(ARCS.greed.fit(c),false);assert.equal(householdGuest(c,{born:S.turn-180}),null);`);
});
test('each brother has independent actions and death, shared correctly by sisters after reload',()=>{
 const {run,force}=boot();run(multi+`var first=h.brother,second=h.brother2;var key=c.id+':brother2';A.go('official',key);assert.match(viewOfficial(),/沈明修/);assert.match(viewOfficial(),/沈怀远/);
 var trust=first.trust;A.officialAct(key,'talk');choose(1);drain();assert.equal(first.trust,trust);assert.equal(second.lastAudience,S.turn);
 assert.ok(c.story.some(x=>x.t.includes('二兄沈明修')));assert.ok(sister.story.some(x=>x.t.includes('二兄沈明修')));`);
 force(.001);run(`assignOfficialTask(officialEntry(key),'border');S.turn=h.brother2.commission.due;officialTaskTick();assert.equal(h.brother2.alive,false);assert.equal(h.brother.alive,true);
 save('1');load('1');c=byId(c.id);sister=byId(sister.id);h=houseOf(c);assert.equal(houseOf(sister).brother2,h.brother2);assert.equal(h.brother2.alive,false);
 assert.match(familyGraphSVG(),/沈明修/);assert.equal(officialEntries().filter(x=>x.p.id===h.brother2.id).length,1);assert.equal(officialEntry(key).role,'brother2');`);
});
test('military rewards and greed cases stay attached to the selected second brother',()=>{
 const {run}=boot();run(multi+`var first=h.brother,second=h.brother2,merit=first.merit;militaryMeritEvent(c,'雁门关','brother2').choices[0].f();assert.equal(first.merit,merit);assert.equal(second.post,'总兵');
 first.retired=true;first.exiled=true;c.arc={id:'greed',st:0,f:{},done:false,t:S.turn};assert.equal(greedBrother(c),second);assert.match(ARCS.greed.stages[0](c,c.arc.f).text,/沈明修/);
 first.exiled=false;c.arc.st=1;assert.equal(greedBrother(c),second);aEnd(c,'抄家','涉案兄长被流放。');assert.equal(second.exiled,true);assert.ok(!first.exiled);assert.equal(officialArcEligible(c),false);`);
});
test('guest parent identity does not jump to another brother after his death',()=>{
 const {run}=boot();run(multi+`var child=makeKid(c,'f','清和');child.born=S.turn-168;var guest=householdGuest(c,child);assert.ok(guest);var father=guestFather(h,guest);assert.ok(father.age>=kidAge(guest)+16);
 officialDeath(c,brotherRoles(h).find(r=>h[r]===father),'前线阵亡','battle');assert.equal(householdGuest(c,child),null);assert.equal(guestFather(h,guest),father);`);
});
const poets=`S.consorts=[];S.cands=[];delete S.flags.scholarArc;var a=makeGirl({trait:'才女',fam:{t:'翰林学士',p:40}}),b=makeGirl({trait:'才女',fam:{t:'翰林学士',p:40}});addConsort(a,3,'入宫');addConsort(b,3,'入宫');`;
test('unselected candidates never consume the scholar story reservation',()=>{
 const {run}=boot();run(`S.consorts=[];S.cands=[];delete S.flags.scholarArc;var c=makeGirl({trait:'才女'});S.cands=[c];reconcileScholarArcs();assert.equal(S.flags.scholarArc,undefined);assert.equal(c.arc,undefined);`);
});
test('an unstarted dead or departed scholar releases the reservation without stealing a started craft',()=>{
 for(const status of ['dead','gone']){const {run}=boot();run(poets+`a.${status==='dead'?'alive=false':'gone=true'};reconcileScholarArcs();assert.equal(b.arc.id,'scholar');assert.equal(S.flags.scholarArc,b.id);assert.ok(b.arc.t>=S.turn+8);assert.equal(a.arc,undefined);var state=JSON.stringify(b.arc);save('1');load('1');assert.equal(JSON.stringify(byId(b.id).arc),state);`);}
 const {run}=boot();run(poets+`b.arc.startedAt=S.turn;a.alive=false;reconcileScholarArcs();assert.equal(b.arc.id,'craft');assert.equal(S.flags.scholarArc,undefined);var c=makeGirl({trait:'才女',fam:{t:'翰林学士',p:40}});addConsort(c,3,'入宫');assert.equal(c.arc.id,'scholar');`);
});
test('a started scholar story ends with its own person and retains choices without being transplanted',()=>{
 const {run}=boot();run(poets+`a.arc.st=1;a.arc.f={poem:'旧诗',asked:1};a.alive=false;var id=a.id;reconcileScholarArcs();assert.equal(a.arc.end,'诗笺未竟');assert.equal(a.arc.f.poem,'旧诗');assert.equal(b.arc.id,'craft');var n=a.story.length;
 save('1');load('1');reconcileScholarArcs();assert.equal(byId(id).story.length,n);assert.equal(S.flags.scholarArc,id);`);
});
test('temporary absence pauses scholar scenes, and multiple started legacy histories are retained',()=>{
 const {run}=boot();run(poets+`a.templeStay={due:S.turn+6};a.arc.t=S.turn;a.aff=80;assert.equal(arcTick(),null);assert.equal(S.flags.scholarArc,a.id);assert.equal(a.arc.done,false);
 delete a.templeStay;a.arc.st=1;b.arc={id:'scholar',st:2,f:{asked:1},done:false,t:S.turn+20};reconcileScholarArcs();assert.equal(a.arc.st,1);assert.equal(b.arc.st,2);`);
});

test('new sisters respect the existing father and elder brothers ages without rewriting them',()=>{
 const {run}=boot();run(multi+`h.brother.age=22;h.brother2.age=20;var before=JSON.stringify([h.father,h.brother,h.brother2]);
 for(var n=0;n<20;n++){var girl=makeKin(c,'亲');assert.ok(girl.age<h.brother2.age);assert.ok(h.father.age-girl.age>=18);}
 assert.equal(JSON.stringify([h.father,h.brother,h.brother2]),before);`);
});

const five=`S.consorts=[];S.cands=[];S.children=[];var c;for(var n=0;n<500;n++){var x=makeGirl({sur:'沈',age:24,trait:'活泼',fam:{t:'镇国大将军',p:60}});if(brotherRoles(houseOf(x)).length===5){c=x;break;}}assert.ok(c);addConsort(c,4,'入宫');c.aff=70;c.enteredAt=0;delete c.entryAdjustment;var h=houseOf(c);`;
test('rare five-brother background records the sixth child and names all five, with personality and life-state dialogue',()=>{
 const {run}=boot();run(five+`assert.equal(h.fiveBrothers.sister,c.id);assert.equal(h.fiveBrothers.birthOrder,6);A.go('consort',c.id);assert.match(viewConsort(),/家中行六/);assert.match(viewConsort(),/A.fiveBrotherTalk/);var text=fiveBrotherVoice(c);assert.match(text,/五个哥哥/);for(var r of brotherRoles(h))assert.ok(text.includes(h[r].name));
 c.trait='才女';assert.match(fiveBrotherVoice(c),/不只是书上的字/);h.brother3.away=true;assert.match(fiveBrotherVoice(c),/如今在外/);
 officialDeath(c,'brother2','前线阵亡','battle');assert.match(fiveBrotherVoice(c),/已经不在了/);assert.ok(!fiveBrotherVoice(c).includes('五个哥哥都等我回家'));var id=c.id;save('1');load('1');assert.equal(fiveBrotherFamily(byId(id)).brother2.alive,false);`);
});
test('five-brother choices and shared memories restore once and do not affect the brothers official careers',()=>{
 const {run}=boot();run(five+`var peer=makeGirl({age:22});addConsort(peer,3,'入宫');var careers=JSON.stringify(brotherRoles(h).map(r=>h[r]));var e=E().energy;A.fiveBrotherTalk(c.id);save('1');A.load('1');assert.equal(curEv.title,'五位兄长的妹妹');choose(0);save('2');A.load('2');assert.equal(E().energy,e-1);assert.equal(PalaceActions.blocked,false);drain();c=byId(c.id);h=houseOf(c);assert.equal(fiveBrotherReady(c),false);assert.equal(JSON.stringify(brotherRoles(h).map(r=>h[r])),careers);
 S.turn+=12;peer=byId(peer.id);pushEv(fiveBrotherEvent(c,peer));choose(0);drain();assert.ok(NPCMemory.recall(S,peer.id).some(m=>m.type==='five-brothers'));assert.ok(peer.story.some(x=>x.t.includes('五位兄长')));`);
});
test('five-brother correspondence excludes dead and exiled relatives and cannot charge when unavailable',()=>{
 const {run}=boot();run(five+`h.brother.alive=false;h.brother2.exiled=true;var e=E().energy,ev=fiveBrotherEvent(c);var out=ev.choices[1].f();assert.ok(!out.includes(h.brother.name));assert.ok(!out.includes(h.brother2.name));assert.ok(out.includes(h.brother3.name));assert.equal(E().energy,e-1);assert.equal(ev.choices[1].f(),null);
 S.turn+=12;for(var r of brotherRoles(h))h[r].alive=false;assert.equal(fiveBrotherEvent(c).choices[1].cond(),false);assert.equal(fiveBrotherEvent(c).choices[1].f(),null);
 c.templeStay={};assert.equal(fiveBrotherEvent(c),null);assert.equal(fiveBrotherChat(c),'');`);
});
test('new sisters cannot rewrite the rare background sixth-child birth order',()=>{
 const {run}=boot();run(five+`var person=c.id;for(var i=0;i<12;i++){var sister=makeKin(c,'亲');assert.ok(sister.age<=c.age);assert.equal(c.kin[sister.id],'亲妹');}assert.equal(h.fiveBrothers.sister,person);assert.equal(h.fiveBrothers.birthOrder,6);`);
});
