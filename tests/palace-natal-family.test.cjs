const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const w=boot(921);w.ctx.assert=assert;w.run(`A.newGame();A.start();drain();S.turn=48;S.year=5;S.month=1;S.consorts=[];S.children=[];E().energy=20;
 var c=makeGirl({sur:'沈',given:'知微',trait:'温婉',age:26,fam:{t:'翰林学士',p:45}});addConsort(c,4,'入宫');c.enteredAt=12;c.hp=90;c.favor=45;c.aff=45;c.nights=0;c.wound='quiet';delete c.solitary;
 var h=houseOf(c);h.relatives=[];var p=addNatalPerson(c,h,'f',22,791,false);p.married=false;p.willing=true;relAdd(c,p,60-relGet(c,p));PalaceActions.reset();`);return w;}
test('retired invented brother wish migrates without deleting a real family death',()=>{
 const w=world();w.run(`c.wish='brother';c.wishKnown=true;c.wishDone=true;story(c,'陛下成全了她的心愿：想为早夭的弟弟立个牌位。');story(c,'兄长沈云深在边关战死。');remember(c,'wish','想为早夭的弟弟立个牌位');remember(c,'hurt','兄长沈云深在边关战死。');save('1');A.load('1');c=byId(c.id);
 assert.equal(c.wish,'poem');assert.equal(c.wishDone,false);assert.ok(!WISHES.brother);assert.doesNotMatch(JSON.stringify(c.story),/早夭的弟弟/);assert.match(JSON.stringify(c.story),/沈云深/);assert.doesNotMatch(JSON.stringify(NPCMemory.recall(S,c.id)),/早夭的弟弟/);assert.match(JSON.stringify(NPCMemory.recall(S,c.id)),/沈云深/);assert.doesNotMatch(deepLine(c),/undefined/);`);
});
test('dowager favors her eligible clan over a higher-virtue outsider and keeps factual praise',()=>{
 const w=world();w.run(`var d=ensureDowager();c.clan=d.clan;c.virtue=20;c.trait='骄纵';var outsider=makeGirl({age:25,trait:'温婉'});addConsort(outsider,4,'入宫');outsider.clan='other';outsider.virtue=99;assert.equal(dowagerFavorite(d),c);var ev=dowagerFavorEvent();assert.match(ev.text,/母家的孩子/);assert.doesNotMatch(ev.text,/温良贤淑/);ev.choices[0].f();assert.match(c.story.at(-1).t,/优先提携/);`);
});
test('unavailable, underage, dead and empress clan members cannot be recommended for visits',()=>{
 const w=world();w.run(`var d=ensureDowager();c.clan=d.clan;c.virtue=99;for(var change of [{age:17},{cold:true},{gone:true},{alive:false},{rank:8},{homeLeave:{due:99}},{templeStay:{}}]){var old={...c};Object.assign(c,change);assert.equal(dowagerFavorite(d),null);Object.assign(c,old);delete c.homeLeave;delete c.templeStay;}d.alive=false;assert.equal(dowagerFavorEvent(),null);`);
});
test('dowager objects to disliked favoritism and points to her actual clan woman',()=>{
 const w=world();w.run(`var d=ensureDowager();c.clan=d.clan;c.favor=20;var top=makeGirl({age:24});addConsort(top,4,'入宫');top.clan='other';top.favor=95;top.virtue=20;var ev=dowagerPartialityEvent(d);assert.ok(ev);assert.match(ev.text,new RegExp(cName(c)));top.virtue=90;assert.equal(dowagerPartialityEvent(d),null);`);
});
test('family displays only actual relatives, with readable profiles and age growth',()=>{
 const w=world();w.run(`for(var role of brotherRoles(h))delete h[role];assert.doesNotMatch(officialFamilyLine(c),/无兄长/);assert.match(officialFamilyLine(c),new RegExp(p.name));UI.sel=c.id+':'+p.id;assert.match(viewNatalRelative(),/22岁/);assert.doesNotThrow(()=>familyGraphSVG());S.turn+=12;natalFamilyTick();assert.equal(natalAge(p),23);assert.match(viewNatalRelative(),/23岁/);save('1');load('1');migrate();assert.equal(natalAge(byId(c.id).house.relatives[0]),23);`);
});
test('shared sisters keep one household and one newborn record across reload',()=>{
 const w=world();w.run(`var g=makeKin(c,'亲');addConsort(g,2,'姐妹入宫');h.natal.pregnancy={due:S.turn,sex:'m',seed:17};natalFamilyTick();var newborn=h.relatives.at(-1);assert.equal(natalAge(newborn),0);assert.match(g.story.at(-1).t,new RegExp(newborn.name));var len=h.relatives.length;natalFamilyTick();assert.equal(h.relatives.length,len);save('1');load('1');migrate();assert.equal(houseOf(byId(c.id)),houseOf(byId(g.id)));assert.equal(houseOf(byId(c.id)).relatives.filter(x=>x.id===newborn.id).length,1);`);
});
test('a father already dead and an elderly mother cannot generate a new conception',()=>{
 const w=world();w.run(`h.natal.created=S.turn-30;h.father.alive=false;`);w.force(0);w.run(`natalFamilyTick();assert.ok(!h.natal.pregnancy);h.father.alive=true;h.natal.lastTick=-1;h.natal.motherBorn=S.turn-60*12;natalFamilyTick();assert.ok(!h.natal.pregnancy);`);
});
test('visits have a return date, preserve status, and survive pending-scene reload',()=>{
 const w=world();w.run(`A.natalVisit(c.id,p.id);assert.equal(curEv.title,'娘家来访');choose(0);assert.equal(curEv.title,'探亲相见');assert.ok(!byId(p.id));save('1');A.load('1');assert.equal(curEv.title,'探亲相见');c=byId(c.id);p=c.house.relatives.find(x=>x.id===p.id);assert.equal(homeLeaveEligible(c),false);drain();S.turn+=2;natalFamilyTick();assert.equal(p.visit,undefined);assert.match(p.story.at(-1).t,/平安归家/);`);
});
test('minor and married sisters cannot enter romance; unwilling adults can decline',()=>{
 const w=world();w.run(`p.visit={host:c.id,until:99};for(var patch of [{born:S.turn-17*12},{married:true}]){var old={...p};Object.assign(p,patch);assert.equal(natalRomanceReady(c,p),false);assert.equal(natalMeetingEvent(c,p).choices.length,2);Object.assign(p,old);}p.willing=false;assert.equal(natalCourtshipEvent(c,p).title,'她自己的心意');assert.equal(p.declined,true);assert.equal(admitNatalSister(c,p),null);`);
});
test('consenting adult visitor keeps identity, portrait, family, age and story upon admission',()=>{
 const w=world();w.run(`p.visit={host:c.id,until:99};story(p,'带着家书进宫探亲。');var id=p.id,face=portraitCell(natalPortrait(p));var result=admitNatalSister(c,p),g=byId(id);assert.ok(result);assert.equal(g.age,22);assert.equal(portraitCell(g),face);assert.equal(houseOf(g),h);assert.match(JSON.stringify(g.story),/带着家书/);assert.equal(p.consortId,id);assert.equal(admitNatalSister(c,p),null);assert.equal(S.consorts.filter(x=>x.id===id).length,1);assert.equal(c.kin[g.id],'亲妹');`);
});
test('cousins are more guarded but good prior relationships can support a welcome',()=>{
 const w=world();w.run(`var g=makeKin(c,'堂');c.trait='温婉';c.favor=80;c.kinRival={};g.kinRival={};relAdd(c,g,35-relGet(c,g));var cautious=sisterArrivalFeeling(c,g);assert.equal(cautious.kind,'uneasy');assert.match(cautious.text,/不同父亲/);relAdd(c,g,65-relGet(c,g));assert.equal(sisterArrivalFeeling(c,g).kind,'welcome');c.trait='善妒';c.favor=10;relAdd(c,g,20-relGet(c,g));assert.equal(sisterArrivalFeeling(c,g).kind,'replaced');`);
});
test('admission changes living sisters relationships but does not turn a deceased sister into a rival',()=>{
 const w=world();w.run(`var g=makeKin(c,'堂');c.trait='善妒';c.favor=90;c.kinRival={};g.kinRival={};relAdd(c,g,10-relGet(c,g));addConsort(g,2,'家中送来');assert.ok(relGet(c,g)<10);assert.ok(c.story.some(s=>s.t.includes('姐妹入宫')));var dead=makeKin(c,'亲');c.alive=false;var before=c.story.length;addConsort(dead,3,'因姐姐旧缘入宫');assert.equal(c.story.length,before);assert.equal(dead.kinArrival,undefined);assert.ok(!c.sisterArrival||c.sisterArrival.other!==dead.id);`);
});
test('an actual younger brother needs a degree before appointment and an appointment before office',()=>{
 const w=world();w.run(`var brother=addNatalPerson(c,h,'m',20,701,false),e=officialEntry(c.id+':relative'+brother.id);assert.equal(officialServing(brother),false);assert.equal(officialActionReady(e,'commission'),false);assert.equal(relativeAppointmentEvent(e),null);brother.education=brother.post='举人';brother.examTurn=S.turn;assert.match(relativeAppointmentEvent(e).text,/弟弟.*今年中了举/);UI.sel=e.key;assert.match(viewOfficial(),/尚未授官/);assert.doesNotMatch(viewOfficial(),/任知县/);relativeAppointmentEvent(e).choices[1].f();assert.equal(brother.career,'student');appointRelative(e);assert.equal(brother.career,'official');assert.equal(brother.post,'候补知县');assert.equal(officialServing(brother),true);assert.match(c.story.at(-1).t,/候补知县/);save('1');A.load('1');assert.equal(officialEntry(e.key).p.post,'候补知县');`);
});
test('students receive actual exam results and never gain an office automatically',()=>{
 const w=world();w.run(`var brother=addNatalPerson(c,h,'m',21,703,false);brother.education=brother.post='秀才';S.month=9;S.year=6;`);w.force(...Array(30).fill(0));w.run(`relativeStudyTick();assert.equal(brother.education,'举人');assert.equal(brother.career,'student');assert.equal(officialServing(brother),false);var n=brother.story.length;relativeStudyTick();assert.equal(brother.story.length,n);`);
});
test('new relatives vary between students and officials, legacy real offices stay intact',()=>{
 const w=world();w.run(`var careers=new Set();for(var i=0;i<35;i++){var g=makeGirl({age:23});addConsort(g,2,'入宫');for(var r of brotherRoles(houseOf(g)))careers.add(g.house[r].career);}assert.ok(careers.has('student'));assert.ok(careers.has('official'));var p={age:30,post:'参将'};initializeRelativeCareer(p,'brother');assert.equal(p.career,'official');`);
});
test('frail women can conceive at lower rates and ask about care when bedridden without moving a child immediately',()=>{
 const w=world();w.run(`c.fertility.base=.2;c.age=26;var normal=consortConceptionChance(c);c.trait='体弱';assert.ok(consortConceptionChance(c)>0);assert.ok(consortConceptionChance(c)<normal);c.hp=30;c.rank=5;c.favor=45;var mom=makeGirl({age:22});addConsort(mom,1,'入宫');var baby=makeKid(mom,'f','清和');baby.pendingName=false;assert.equal(fosterPetitionReason(c),'frail-wish');assert.ok(fosterPetitionMatch(c,baby));var ev=fosterPetitionEvent(c);assert.equal(ev.title,'病榻心愿');assert.match(ev.choices[0].t,/先调养/);assert.equal(petitionFoster(baby,c),null);ev.choices[0].f();assert.ok(!baby.foster);assert.match(c.story.at(-1).t,/待身体允许/);c.hp=50;assert.ok(fosterPetitionEvent(c).choices[0].t.includes('生母'));`);
});
test('waiting distinguishes recent arrival, company, grief and genuinely forgotten women',()=>{
 const w=world();w.run(`c.favor=15;assert.equal(awaitingNoticeReason(c),'forgotten');c.lastPersonalAttention=S.turn;assert.equal(awaitingNoticeReason(c),'uncertain');c.aff=80;assert.equal(awaitingNoticeReason(c),null);c.aff=40;c.enteredAt=S.turn-2;assert.equal(awaitingNoticeReason(c),null);c.enteredAt=0;c.xin={k:'悲恸',t:S.turn};assert.equal(awaitingNoticeReason(c),null);c.xin={k:'平和',t:S.turn};c.nights=1;assert.equal(awaitingNoticeReason(c),null);`);
});
test('green-card withdrawal removes the card and blocks all nights, while restoring survives reload',()=>{
 const w=world();w.run(`UI.sel=c.id;A.toggleGreenCard(c.id);assert.equal(c.cardWithdrawn,true);assert.doesNotMatch(viewCards(),new RegExp('A.night\\('+c.id+'\\)'));var energy=E().energy,nights=c.nights;A.night(c.id);nightWith(c);assert.equal(E().energy,energy);assert.equal(c.nights,nights);assert.match(viewConsort(),/恢复绿头牌/);save('1');A.load('1');c=byId(c.id);assert.equal(c.cardWithdrawn,true);A.toggleGreenCard(c.id);assert.equal(c.cardWithdrawn,false);assert.match(viewCards(),new RegExp(cName(c)));assert.match(c.story.at(-1).t,/恢复绿头牌/);`);
});
test('rescued foreign women use the foreign gallery from encounter through legacy migration',()=>{
 const w=world();w.run(`var foreign=makeGirl({fam:{t:'西域流寓',p:5},age:21});assert.ok(WESTERN_PORTRAITS.includes(portraitCell(foreign)));foreign.rescue={};foreign.artPortrait=CONSORT_PORTRAITS.find(x=>!WESTERN_PORTRAITS.includes(x));S.shelteredGuests=[foreign];migrate();assert.ok(WESTERN_PORTRAITS.includes(foreign.artPortrait));`);
});
test('maids retain their portrait, leave no hidden harem section, and return as the same person',()=>{
 const w=world();w.run(`var g=makeGirl({fam:{t:'宫女',p:3},age:20}),face=portraitCell(g);g.maid=true;g.near=false;g.palace='尚衣局';S.consorts.push(g);deepen(g);nightWith(g);drain();assert.equal(portraitCell(g),face);afterMaidNight(g).choices[3].f();assert.doesNotMatch(viewHarem(),/承恩宫女/);assert.doesNotMatch(viewHarem(),new RegExp(fullName(g)));g.preg=0;assert.match(returningMaidEvent(g,'长街').text,/认出/);assert.equal(returningMaidEvent(g,'长街').por,g);g.preg=2;var ev=pregEvent(g);ev.choices.find(x=>x.t.includes('产后再议')).f();assert.equal(g.maid,true);assert.equal(g.prot,true);assert.equal(portraitCell(g),face);`);
});
test('palace map exposes residence management directly',()=>{world().run(`assert.ok(viewMap().includes("A.go('residences')"));assert.match(viewMap(),/分配住所/);`);});
test('a maid may give birth before foster care is decided and keeps her face and maternal identity',()=>{
 const w=world();w.run(`var g=newMaid('御花园');g.age=22;g.preg=10;var face=portraitCell(g);`);w.force(...Array(80).fill(.7));
 w.run(`var ev=birthEvent(g);assert.ok(ev);pushEv(ev);choose(0);assert.equal(g.maid,true);assert.equal(portraitCell(g),face);var kid=deliveryKids(g)[0];assert.equal(kid.mom,g.id);if(modalResult)nextEv();assert.equal(curEv.title,'抚养');assert.ok(!kid.foster);choose(1);drain();assert.ok(!kid.foster);assert.match(kid.story.at(-1).t,/仍依原安排/);`);
});
test('frail childbirth retains a higher risk without making every pregnancy fatal',()=>{
 for(const trait of ['体弱','温婉']){const w=world();w.run(`c.trait='${trait}';c.preg=10;`);w.force(...Array(80).fill(.08));w.run(`birthEvent(c);assert.equal(c.delivery.difficult,${trait==='体弱'});`);}
 const w=world();w.run(`c.trait='体弱';c.preg=10;`);w.force(...Array(80).fill(.6));w.run(`birthEvent(c);assert.equal(c.delivery.difficult,false);`);
});
test('sibling ages remain whole years between birthdays and family rendering does not consume identities',()=>{
 const w=world();w.run(`var id=S.nid,age=natalAge(p);S.turn+=5;houseOf(c);familyGraphSVG();assert.equal(S.nid,id);assert.equal(natalAge(p),age);assert.equal(Number.isInteger(natalAge(p)),true);`);
});
test('a relatives old link follows the same person after adulthood and palace admission',()=>{
 const w=world();w.run(`var brother=addNatalPerson(c,h,'m',18,704,false);UI.view='natal';UI.sel=c.id+':'+brother.id;viewNatalRelative();assert.equal(UI.view,'official');assert.equal(officialEntry(UI.sel).p.id,brother.id);
 p.visit={host:c.id,until:99};admitNatalSister(c,p);UI.view='natal';UI.sel=c.id+':'+p.id;viewNatalRelative();assert.equal(UI.view,'consort');assert.equal(UI.sel,p.id);render();assert.match(viewConsort(),new RegExp(p.name));`);
});

test('dowager dialogue uses her current title while retaining an inherited portrait',()=>{
 const w=world();w.run(`var d=ensureDowager();assert.equal(porName(dowagerPerson(d)),d.name);var inherited=makeDowager(c,'生母');assert.equal(porName(dowagerPerson(inherited)),inherited.name);assert.equal(portraitCell(dowagerPerson(inherited)),portraitCell(c));c.clan=d.clan;c.favor=20;var top=makeGirl({age:24});addConsort(top,4,'入宫');top.clan='other';top.favor=95;top.virtue=20;var ev=dowagerPartialityEvent(d);assert.equal(eventPortraits(ev).length,1);assert.equal(porName(eventPortraits(ev)[0]),d.name);`);
});
