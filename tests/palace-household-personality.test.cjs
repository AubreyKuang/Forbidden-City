const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(1935);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=72;E().energy=20;E().treasury=2000;
 var c=makeGirl({sur:'沈',given:'知微',trait:'才女',age:28}),o=makeGirl({sur:'许',given:'清容',trait:'活泼',age:30});delete c.solitary;delete o.solitary;
 addConsort(c,3,'入宫');addConsort(o,4,'入宫');c.enteredAt=50;o.enteredAt=20;c.hp=o.hp=90;c.aff=o.aff=75;c.xin=o.xin={k:'平和',t:S.turn};c.wound=o.wound='quiet';
 c.palace=o.palace='承乾宫';c.residenceRoom='side';o.residenceRoom='main';for(var p of S.consorts)if(p!==c&&p!==o&&p.palace===c.palace)p.palace='景阳宫';relAdd(c,o,10-relGet(c,o));PalaceActions.reset();`);return b;}
const quiet=`c.solitary={path:'letters',stage:0,history:[],respect:0};var a=makeKid(o,'f','清和'),b=makeKid(o,'m','承晏');a.born=b.born=S.turn-24;a.pendingName=b.pendingName=false;`;
test('a quiet household does not create distress; real children do, without creating enemies',()=>{
 const {run}=world();run(`c.solitary={path:'letters'};var before=JSON.stringify(S);assert.equal(solitaryHousehold(c),null);assert.equal(solitaryQuietEvent(c),null);assert.equal(JSON.stringify(S),before);`);run(quiet);run(`var relation=relGet(c,o);solitaryHouseholdTick(c);assert.equal(xinOf(c),'清静被扰');assert.equal(relGet(c,o),relation);assert.equal(consortVoicePool(c)[0].key,'solitary-household');var n=c.story.length;solitaryHouseholdTick(c);assert.equal(c.story.length,n);`);
});
test('solitary mothers can need quiet while remaining tender with their own children',()=>{
 const {run}=world();run(quiet);run(`a.mom=b.mom=c.id;maternalTick();solitaryHouseholdTick(c);assert.match(solitaryHouseholdVoice(c).lines[0],/疼孩子与想独处/);assert.match(c.story.at(-2).t,/放轻声音/);a.alive=false;b.alive=false;maternalTick();assert.equal(xinOf(c),'悲恸');solitaryHouseholdTick(c);assert.equal(xinOf(c),'悲恸');assert.equal(solitaryQuietEvent(c),null);`);
});
test('crowded adult residences cause pressure without inventing children or a party',()=>{
 const {run}=world();run(`c.solitary={path:'letters'};var p=makeGirl({age:25});addConsort(p,2,'入宫');p.palace=c.palace;solitaryHouseholdTick(c);assert.match(solitaryHousehold(c).reason,/3位妃嫔/);assert.doesNotMatch(solitaryHousehold(c).reason,/幼儿|宴/);assert.match(residencePetitionFor(c).reason,/人少的院落/);`);
});
test('quiet arrangements soothe for their actual duration, preserve child care and survive reload',()=>{
 const {run}=world();run(quiet);run(`A.quietHousehold(c.id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);c=byId(c.id);o=byId(o.id);assert.equal(curEv.title,'留一段清静');var en=E().energy;choose(0);assert.equal(E().energy,en-1);assert.equal(xinOf(c),'释然');assert.match(c.story.at(-1).t,/孩子哭病时仍先照顾/);save('2');A.load('2');assert.equal(PalaceActions.blocked,false);c=byId(c.id);assert.equal(E().energy,en-1);drain();S.turn+=3;solitaryHouseholdTick(c);assert.equal(xinOf(c),'清静被扰');`);
});
test('moving to quiet rooms resolves pressure but gifts alone do not',()=>{
 const {run}=world();run(quiet);run(`solitaryHouseholdTick(c);setXin(c,'欢喜','赐礼');assert.equal(xinOf(c),'清静被扰');var target=PALACES.find(n=>n!==c.palace&&residencePeople(n).length<2&&!nurseryChildren(n).length&&residenceMovePlan(c,n,'side'));settleResidenceMove(c,residenceMovePlan(c,target,'side'));assert.equal(xinOf(c),'释然');assert.match(c.story.map(s=>s.t).join(''),/迁离承乾宫/);assert.equal(solitaryHouseholdVoice(c),null);`);
});
test('modern slang requires an actual present time traveler and does not reveal her secret or create friendship',()=>{
 const {run}=world();run(`c.solitary={path:'letters'};delete o.timeTraveler;assert.equal(travelerQuietEvent(c),null);initTimeTraveler(o,true);o.timeTraveler.known=false;var before=JSON.stringify(S),e=travelerQuietEvent(c),rel=relGet(c,o);assert.ok(e);assert.equal(JSON.stringify(S),before);assert.match(e.text,/i 人/);e.choices[0].f();assert.equal(o.timeTraveler.known,false);assert.equal(relGet(c,o),rel);assert.match(c.story.at(-1).t,/莫拿一个字替我全说了/);assert.match(o.story.at(-1).t,/沈知微/);assert.equal(travelerQuietEvent(c),null);assert.equal(e.choices[0].f(),null);S.turn+=6;startHomeLeave(o,1);assert.equal(travelerQuietEvent(c),null);`);
});
test('the future-traveler conversation persists at a pending and a resolved choice',()=>{
 const {run}=world();run(`c.solitary={path:'letters'};initTimeTraveler(o,true);A.neighborWord(c.id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'廊下的新词');choose(1);c=byId(c.id);var n=c.story.length;save('2');A.load('2');assert.equal(PalaceActions.blocked,false);c=byId(c.id);assert.equal(c.story.length,n);drain();assert.equal(travelerQuietEvent(c),null);`);
});
test('same rendered portrait honors overrides and keeps missing or different portraits separate',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];assert.equal(resemblancePair(c).anchor.c,o);c.portraitOverride=CONSORT_PORTRAITS[1];assert.equal(resemblancePair(c),null);o.portraitOverride=c.portraitOverride;assert.ok(resemblancePair(c));assert.equal(resemblanceCell({age:20}),null);assert.equal(resemblanceCell({sex:'f',age:20,artPortrait:c.artPortrait}),null);`);
});
test('rank then entry date decides the comparison, while promotion changes its direction',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];assert.equal(resemblancePair(c).target.c,c);c.rank=5;assert.equal(resemblancePair(c).target.c,o);c.rank=o.rank=4;c.enteredAt=10;assert.equal(resemblancePair(c).anchor.c,c);c.enteredAt=30;assert.equal(resemblancePair(c).anchor.c,o);`);
});
test('deceased and previous-reign likeness is not a reincarnation fact or a new emperors former wife',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];o.alive=false;assert.match(portraitResemblanceHint(c),/已故的许清容/);var n=o.story.length;resemblanceEvent(c).choices[0].f();assert.equal(o.story.length,n);delete S.flags.resemblancePairs;S.consorts=S.consorts.filter(p=>p!==o);S.previousCourts=[{gen:1,consorts:[o]}];S.gen=2;var hint=portraitResemblanceHint(c);assert.match(hint,/先朝已故的/);assert.doesNotMatch(hint,/前妻|转世|前缘/);assert.equal(c.pastLife,undefined);`);
});
test('actual sisters are described as familial likeness, not a replacement romance',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];c.kin={[o.id]:'亲姐'};var e=resemblanceEvent(c);assert.match(e.text,/姐妹/);assert.doesNotMatch(e.text,/替身/);assert.match(portraitResemblanceHint(c),/自家姐妹/);`);
});
test('selection surprise is visible, stable and read-only, including two unselected candidates',()=>{
 const {run}=world();run(`var candidate=makeGirl({age:22});candidate.artPortrait=o.artPortrait;S.cands=[candidate];S.selection={phase:'audience',current:candidate.id};var before=JSON.stringify(S);assert.match(viewSelectionAudience(),/宫人忽然一怔/);assert.match(viewXX(),/宫人忽然一怔/);assert.equal(JSON.stringify(S),before);S.consorts=[];var second=makeGirl({age:23});second.artPortrait=candidate.artPortrait;S.cands.push(second);assert.match(portraitResemblanceHint(candidate),/同批秀女/);assert.doesNotMatch(portraitResemblanceHint(candidate),/替身/);`);
});
test('resemblance response records both living parties and restores without duplicated affection',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];A.resemblanceTalk(c.id);save('1');A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'肖似之议');choose(0);c=byId(c.id);o=byId(o.id);assert.match(o.story.at(-1).t,/后来将此事传来/);var n=c.story.length,aff=c.aff;save('2');A.load('2');assert.equal(PalaceActions.blocked,false);c=byId(c.id);assert.equal(c.story.length,n);assert.equal(c.aff,aff);drain();assert.equal(resemblanceEvent(c),null);`);
});
test('resemblance drama yields to severe grief and honors closed or absent traveler boundaries',()=>{
 const {run}=world();run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];c.xin={k:'悲恸',t:S.turn};assert.equal(resemblanceEvent(c),null);c.xin.k='平和';c.solitary={path:'letters'};initTimeTraveler(o,true);o.timeTraveler.closed=true;assert.equal(travelerQuietEvent(c),null);o.timeTraveler.closed=false;o.cold=true;assert.equal(travelerQuietEvent(c),null);`);
});
