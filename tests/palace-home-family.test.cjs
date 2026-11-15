const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(1829);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=72;S.year=7;S.month=1;E().age=39;E().energy=20;E().treasury=2000;
 var c=makeGirl({sur:'沈',given:'知微',trait:'温婉',age:36,fam:{t:'翰林学士',p:50}});delete c.solitary;addConsort(c,3,'选秀入宫');c.wound='quiet';c.aff=78;c.hp=90;c.enteredAt=30;c.xin={k:'平和',t:S.turn};
 var o=makeGirl({sur:'许',given:'清容',trait:'好客',age:30,fam:{t:'书香门第',p:15}});delete o.solitary;addConsort(o,2,'选秀入宫');o.wound='quiet';o.hp=90;relAdd(c,o,60-relGet(c,o));PalaceActions.reset();`);return b;}
test('illness candidates and family panels are read-only until an actual event occurs',()=>{
 const {run}=boot();run(`var before=JSON.stringify(S);var e=sickMotherEvent(c);homeFamilyPanel(c);homeReturnSocialEvent(c);assert.equal(JSON.stringify(S),before);pushEv(e);assert.equal(homeMother(c).status,'ill');assert.equal(xinOf(c),'忧心');assert.ok(c.story.some(s=>s.t.includes('担忧')));`);
});
test('illness remains a named worry after doctor dispatch, gifts, a conversation and save reload',()=>{
 const {run}=boot();run(`sickMotherEvent(c).choices[0].f();assert.equal(xinOf(c),'忧心');assert.equal(homeMother(c).care,'physician');assert.equal(consortVoicePool(c)[0].key,'home-mother-worry');c.like='诗书';giveGift(c,'诗书');assert.equal(xinOf(c),'忧心');A.chat(c.id);assert.equal(curEv.title,'家书未至');var en=E().energy;choose(0);assert.equal(E().energy,en-1);assert.equal(xinOf(c),'忧心');save('1');A.load('1');c=byId(c.id);assert.equal(PalaceActions.blocked,false);assert.equal(homeMother(c).status,'ill');assert.equal(E().energy,en-1);drain();assert.match(c.story.map(s=>s.t).join(''),/担忧.*太医.*忧心/s);`);
});
test('a sick or convalescing mother cannot enter through either the normal or wish route',()=>{
 const {run}=boot();run(`sickMotherEvent(c).choices[0].f();c.wish='mother';c.wishDone=false;var money=E().treasury;A.wish(c.id);assert.equal(E().treasury,money);assert.equal(c.visitor,undefined);assert.equal(c.wishDone,false);assert.equal(momVisitState(c).ready,false);assert.equal(momVisit(c,2),false);S.turn+=2;homeMotherTick(c);assert.equal(homeMother(c).status,'recovering');assert.equal(momVisitState(c).ready,false);S.turn+=4;homeMotherTick(c);assert.equal(homeMother(c).status,'well');assert.equal(momVisitState(c).ready,true);`);
});
test('a sick visit retains concern when recalled early and records gradual news once',()=>{
 const {run}=boot();run(`sickMotherEvent(c).choices[1].f();assert.ok(c.homeLeave);assert.equal(xinOf(c),'忧心');assert.match(homeLifeVoice(c).lines.join(''),/陪着母亲/);returnHomeLeave(c,true);assert.equal(xinOf(c),'忧心');assert.match(homeLifeVoice(c).lines.join(''),/依旨先回来/);assert.match(c.story.at(-1).t,/提前.*仍一封封等/);S.turn+=2;homeLeaveTick();assert.equal(xinOf(c),'释然');assert.equal(homeMother(c).status,'recovering');var n=c.story.length;homeLeaveTick();assert.equal(c.story.length,n);S.turn+=4;homeLeaveTick();assert.equal(homeMother(c).status,'well');assert.equal(sickMotherEvent(c),null);`);
});
test('normal visits have all nineteen temperament voices and distinct solitary privacy',()=>{
 const {run}=boot();run(`var lines=new Set();for(var trait of Object.keys(TRAITS)){c.trait=trait;startHomeLeave(c,1);S.turn++;homeLeaveTick();lines.add(homeLifeVoice(c).lines[0]);assert.match(c.story.at(-1).t,/按约/);}assert.equal(lines.size,19);c.solitary={path:'letters'};startHomeLeave(c,1);S.turn++;homeLeaveTick();assert.match(homeLifeVoice(c).lines[0],/不想多说/);assert.equal(homeSocialTone(c),'quiet');`);
});
test('two-month leave returns at the second month boundary, not one month late',()=>{
 const {run}=boot();run(`A.homeLeave(c.id);choose(1);drain();A.endMonth();drain();c=byId(c.id);assert.ok(c.homeLeave);A.endMonth();drain();c=byId(c.id);assert.equal(c.homeLeave,undefined);assert.equal(c.homeLife.returned.turn,74);assert.ok(c.story.some(s=>/按约.*回到/.test(s.t)));`);
});
test('a caring friend envies the home visit without turning hostile; both remember actual speech',()=>{
 const {run}=boot();run(`startHomeLeave(c,1);S.turn++;homeLeaveTick();var e=homeReturnSocialEvent(c);assert.ok(e);assert.match(e.text,/替你高兴.*听着想家/);var before=relGet(c,o);pushEv(e);choose(0);drain();assert.ok(relGet(c,o)>before);assert.ok(c.story.some(s=>s.t.includes(fullName(o))&&s.t.includes('归家闲话')));assert.ok(o.story.some(s=>s.t.includes(fullName(c))&&s.t.includes('替你高兴')));assert.equal(homeLifeVoice(o).key,'home-shared-memory');assert.equal(homeReturnSocialEvent(c),null);assert.ok(NPCMemory.recall(S,o.id).some(m=>m.type==='home-family'));`);
});
test('boasting respects family means while bereaved and foreign listeners do not invent an easy homecoming',()=>{
 const {run}=boot();run(`c.trait='骄矜';c.fam.p=5;startHomeLeave(c,1);S.turn++;homeLeaveTick();assert.match(homeReturnSocialEvent(c).text,/家里虽不阔绰/);o.wound='mom';assert.match(homeReturnSocialEvent(c).text,/见不到从前的人/);assert.doesNotMatch(homeReturnSocialEvent(c).text,/我也想回去坐/);o.wound='quiet';o.rescue={trust:30};assert.match(homeReturnSocialEvent(c).text,/路远/);c.solitary={path:'letters'};assert.doesNotMatch(homeReturnSocialEvent(c).text,/恩典.*记着/);`);
});
test('sick visits do not become boasts and absent friends cannot be in the conversation',()=>{
 const {run}=boot();run(`c.trait='骄纵';sickMotherEvent(c).choices[1].f();S.turn+=2;homeLeaveTick();assert.equal(homeSocialTone(c),'care');var e=homeReturnSocialEvent(c);assert.match(e.text,/病势稍稳/);startHomeLeave(o,1);assert.equal(e.valid(),false);assert.equal(e.choices[0].f(),null);`);
});
test('social scene and its chosen result survive reload without duplicate diaries or relationships',()=>{
 const {run}=boot();run(`startHomeLeave(c,1);S.turn++;homeLeaveTick();A.homeConversation(c.id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'归家闲话');c=byId(c.id);o=byId(o.id);var count=c.story.length;choose(0);var after=c.story.length,rel=relGet(c,o);assert.equal(after,count+1);save('2');A.load('2');assert.equal(PalaceActions.blocked,false);c=byId(c.id);o=byId(o.id);assert.equal(c.story.length,after);assert.equal(relGet(c,o),rel);drain();assert.equal(homeReturnSocialEvent(c),null);`);
});
test('returning home cannot erase child bereavement or write new experiences for a dead consort',()=>{
 const {run}=boot();run(`var k=makeKid(c,'f','清和');maternalTick();k.alive=false;maternalTick();assert.equal(xinOf(c),'悲恸');startHomeLeave(c,1);S.turn++;homeLeaveTick();assert.equal(xinOf(c),'悲恸');assert.equal(homeReturnSocialEvent(c),null);startHomeLeave(c,1);c.alive=false;var n=c.story.length;S.turn++;homeLeaveTick();assert.equal(c.story.length,n);assert.equal(c.homeLeave,undefined);`);
});
test('rescued guest chronicle preserves the rescue before enrollment and after family search',()=>{
 const {run}=boot();run(`pushEv(marketRescueEvent());choose(0);choose(1);drain();var g=S.shelteredGuests[0];assert.match(g.story.map(s=>s.t).join(''),/集市获救.*感激.*客舍/);assert.match(rescuedGuestsPanel(),/人物纪事/);assert.match(rescuedGuestsPanel(),/被骗离乡/);`);
});
test('a prejudice witness records her own involvement as well as the victim and actor',()=>{
 const {run}=boot();run(`c.rescue={trust:30};c.fam.p=5;o.fam.p=90;o.trait='骄矜';for(var p of harem())if(p!==c&&p!==o){p.trait='持重';p.fam.p=70;delete p.solitary;}var ev=originPressureEvent();assert.ok(ev);var witness=ev.present.find(p=>p!==c&&p!==o);assert.ok(witness);ev.choices[0].f();assert.match(witness.story.at(-1).t,/公道话.*怠慢/);assert.match(c.story.at(-1).t,/口音|来处|出身/);`);
});
test('shared child and sister journey decisions appear in both relevant chronicles',()=>{
 const {run}=boot();run(`c.solitary={path:'letters'};var k=makeKid(c,'f','清和');k.born=S.turn-72;k.pendingName=false;maternalTick();journeyStart(c,'quietChild');journeyEvent(c).choices[0].f();assert.match(c.story.at(-1).t,/被弄皱的书/);assert.match(k.story.at(-1).t,/只为你低眉/);delete c.journeys;delete c.solitary;c.kin={[o.id]:'亲妹'};journeyStart(c,'sisters');journeyEvent(c).choices[0].f();assert.match(o.story.at(-1).t,/姐妹往来.*同根不同枝/);`);
});
test('consort chronicle shows six recent entries with older pages available in newest-first order',()=>{
 const {run}=boot();run(`for(var i=0;i<9;i++)story(c,'纪事'+i);UI.sel=c.id;var html=viewConsort();assert.match(html,/人物纪事/);assert.match(html,/翻阅更早的纪事/);assert.ok(detailStory(c).indexOf('纪事8')<detailStory(c).indexOf('纪事0'));`);
});
test('father commission, success and reward each leave the daughters own reaction and named dialogue',()=>{
 const {run}=boot();run(`var e=officialEntry(c.id+':father'),task=Object.keys(OFFICIAL_TASKS).find(id=>OFFICIAL_TASKS[id].army===(e.h.bloc==='army'));assignOfficialTask(e,task);assert.equal(c.familyDuty.kind,'assigned');assert.equal(xinOf(c),'感激');assert.match(officialFamilyVoice(c).lines[0],new RegExp(e.p.name));e.p.commission.outcome='success';S.turn=e.p.commission.due;officialTaskTick();assert.equal(c.familyDuty.kind,'success');assert.equal(xinOf(c),'释然');var ev=officialReportEvent(e);ev.choices[0].f();assert.equal(c.familyDuty.kind,'reward');assert.equal(xinOf(c),'感激');var n=c.story.length;assert.equal(ev.choices[0].f(),null);assert.equal(c.story.length,n);assert.match(c.story.at(-1).t,/父亲.*获赏.*谢一声/);`);
});
test('setback causes concern, formal accountability causes fear, and sisters keep separate reactions',()=>{
 const {run}=boot();run(`var sister=makeKin(c,'亲');delete sister.solitary;addConsort(sister,2,'姐妹入宫');sister.trait='持重';sister.xin={k:'平和',t:S.turn};var e=officialEntry(c.id+':father'),task=Object.keys(OFFICIAL_TASKS).find(id=>OFFICIAL_TASKS[id].army===(e.h.bloc==='army'));assignOfficialTask(e,task);e.p.commission.outcome='setback';S.turn=e.p.commission.due;officialTaskTick();assert.equal(xinOf(c),'忧心');assert.equal(c.familyDuty.kind,'setback');assert.equal(sister.familyDuty.kind,'setback');assert.match(c.story.at(-1).t,/未尽如期/);officialReportEvent(e).choices[0].f();assert.equal(xinOf(c),'惶恐');assert.equal(xinOf(sister),'惶恐');assert.notEqual(c.familyDuty.quote,sister.familyDuty.quote);assert.equal(consortVoicePool(c)[0].key,'official-family-accountable');assert.doesNotMatch(consortVoicePool(c)[0].lines[0],/臣妾不知做错/);`);
});
test('a second elder brother keeps his own identity rather than becoming the eldest in reactions',()=>{
 const {run}=boot();run(`var h=houseOf(c);h.brother={id:'elder-one',name:'沈长兄',alive:true,age:40,story:[],official:2};h.brother2={id:'elder-two',name:'沈二兄',alive:true,age:39,story:[],official:2};var e=officialEntry(c.id+':brother2'),task=Object.keys(OFFICIAL_TASKS).find(id=>OFFICIAL_TASKS[id].army===(e.h.bloc==='army'));assignOfficialTask(e,task);assert.equal(c.familyDuty.relativeId,'elder-two');assert.equal(c.familyDuty.kin,'二兄');assert.match(c.story.at(-1).t,/二兄沈二兄/);assert.doesNotMatch(c.familyDuty.quote,/沈长兄/);`);
});
test('official family reactions persist across a pending commission and report reload',()=>{
 const {run}=boot();run(`A.officialAct(c.id+':father','commission');choose(0);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);c=byId(c.id);assert.equal(c.familyDuty.kind,'assigned');var n=c.story.filter(s=>s.t.includes('【外家差事')).length;drain();assert.equal(n,1);`);
});
test('a memorial honor preserves bereavement rather than replacing it with gratitude',()=>{
 const {run}=boot();run(`var e=officialEntry(c.id+':father');officialDeath(c,'father','奉差途中阵亡','battle');assert.equal(xinOf(c),'悲恸');assert.equal(c.familyDuty.kind,'death');officialFamilyReaction(e,'honor','赐祭抚恤');assert.equal(xinOf(c),'悲恸');assert.match(c.story.at(-1).t,/悲伤却不能由恩赏抵消/);`);
});
test('birth prayer echo appears in the actual children chronicles, once',()=>{
 const {run}=boot();run(`c.preg=3;c.pregnancyCalendar={conceived:S.turn-3,term:10,nights:[]};pregnancyPrayerEvent(c).choices[0].f();c.delivery={prayerKey:c.pregnancyPrayer.key};var k=makeKid(c,'f','清和');pregnancyPrayerBirthEcho(c,[k]);assert.match(k.story.at(-1).t,/孕中祈愿的后话/);var n=k.story.length;pregnancyPrayerBirthEcho(c,[k]);assert.equal(k.story.length,n);`);
});
const shared=`c.palace=o.palace='承乾宫';c.residenceRoom=o.residenceRoom='side';for(var other of S.consorts)if(other!==c&&other!==o&&other.palace===c.palace)other.palace='景阳宫';`;
test('shared food and activities strengthen relationships and record both people without repeat farming',()=>{
 const {run}=boot();run(shared);run(`var coScene=cohabScene(c.palace,c,true),before=relGet(c,o);assert.ok(['food','needle','reading'].includes(coScene.kind));recordCohab(coScene);assert.equal(relGet(c,o),before+4);assert.match(c.story.at(-1).t,/同宫日常/);assert.match(o.story.at(-1).t,/沈知微/);var count=c.story.length;recordCohab(coScene);assert.equal(c.story.length,count);assert.equal(relGet(c,o),before+4);`);
});
test('cohabiting enemies quarrel, mediation eases the immediate dispute without erasing hostility',()=>{
 const {run}=boot();run(shared);run(`relAdd(c,o,-55-relGet(c,o));var coScene=cohabScene(c.palace,c,true);assert.equal(coScene.kind,'argument');recordCohab(coScene);assert.equal(relGet(c,o),-59);var ev=cohabResponseEvent(coScene);ev.choices[0].f();assert.equal(relGet(c,o),-56);assert.match(c.story.at(-1).t,/旧怨仍在/);assert.match(o.story.at(-1).t,/共用地方/);assert.equal(ev.choices[0].f(),null);`);
});
test('a solitary co-resident retains boundaries, and absent, ill or Kunning residents are excluded',()=>{
 const {run}=boot();run(shared);run(`c.solitary={path:'letters'};var coScene=cohabScene(c.palace,c,true),before=relGet(c,o);assert.equal(coScene.kind,'boundaries');recordCohab(coScene);assert.equal(relGet(c,o),before);startHomeLeave(o,1);assert.equal(cohabScene(c.palace,c,true),null);returnHomeLeave(o);o.hp=20;assert.equal(cohabScene(c.palace,c,true),null);assert.equal(cohabScene('坤宁宫',empress(),true),null);`);
});
test('roster visits remain direct while entering a palace can reveal co-residents and survives refresh',()=>{
 const {run}=boot();run(shared);run(`A.go('consort',c.id);assert.equal(modalOpen,false);assert.equal(c.lastCohab,undefined);for(var tries=0;tries<4&&!cohabScene(c.palace,c);tries++)S.turn++;var place=PLACES.find(p=>p.p===c.palace);A.arrivePlace(place.id);assert.ok(curEv.arrival.together);assert.equal(curEv.present.length,2);assert.match(palaceArrivalHTML(curEv),/也在这里/);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);c=byId(c.id);o=byId(o.id);var relation=relGet(c,o),n=c.story.length;assert.ok(curEv.arrival.together);nextEv();A.go('consort',c.id);assert.equal(c.story.length,n);assert.equal(relGet(c,o),relation);`);
});
test('monthly cohabitation produces bounded autonomous entries, not only player-triggered scenes',()=>{
 const {run}=boot();run(shared);run(`var before=relGet(c,o);for(var i=0;i<12;i++){S.turn++;cohabitationTick();}assert.ok(c.story.some(s=>s.t.includes('同宫日常')));assert.ok(relGet(c,o)>before);assert.ok(c.story.filter(s=>s.t.includes('同宫日常')).length<=4);`);
});
test('noisy children and a crowded own nursery produce distinct petitions using actual young residents',()=>{
 const {run}=boot();run(shared);run(`c.trait='沉静';var a=makeKid(o,'f','清和'),b=makeKid(o,'m','承晏');a.born=b.born=S.turn-24;a.pendingName=b.pendingName=false;var req=residencePetitionFor(c);assert.match(req.reason,/同宫有2个幼儿/);assert.notEqual(req.plan.to,c.palace);a.mom=b.mom=c.id;req=residencePetitionFor(c);assert.match(req.reason,/清和、承晏.*单独安排/);assert.equal(residencePeople(req.plan.to).length,0);`);
});
test('proud host petitions to exchange better situated rooms and both host records survive the move',()=>{
 const {run}=boot();run(`c.rank=o.rank=4;c.residenceRoom=o.residenceRoom='main';c.palace='景阳宫';o.palace='景仁宫';c.trait='骄纵';c.favor=90;relAdd(c,o,-relGet(c,o));for(var p of S.consorts)if(p!==c&&p!==o&&p.palace===o.palace)p.palace='延禧宫';var req=residencePetitionFor(c);assert.ok(req);assert.equal(req.plan.swap,o.id);assert.match(req.reason,/许清容.*换一换/);var ev=residencePetitionEvent(c);pushEv(ev);choose(0);drain();assert.equal(c.palace,'景仁宫');assert.equal(o.palace,'景阳宫');assert.ok(c.story.some(s=>s.t.includes('迁宫之请')));assert.ok(o.story.some(s=>s.t.includes('换居')));`);
});
test('full side rooms produce a visible waiting list without breaking occupancy or Kunning exclusivity',()=>{
 const {run}=boot();run(`for(var name of PALACES)for(var i=palaceSides(name).length;i<3;i++){var p=makeGirl({age:22});p.rank=2;p.palace=name;p.residenceRoom='side';S.consorts.push(p);}var last=makeGirl({age:22});addConsort(last,2,'选秀入宫');assert.equal(last.palace,PALACE_WAITING);assert.equal(last.residenceRoom,'waiting');assert.ok(PALACES.every(n=>palaceSides(n).length===3));assert.equal(residencePeople('坤宁宫').length,1);UI.sel=last.id;assert.ok(viewResidences().includes('侧殿 36/36 · 待安置 1'));assert.match(viewResidences(),/掖庭待安置/);`);
});
