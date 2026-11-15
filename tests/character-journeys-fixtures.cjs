/* UI-importable, disposable fixtures; never alter a player's primary save. */
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-character-fixtures';fs.mkdirSync(out,{recursive:true});
function world(){const b=boot(823);b.run(`A.newGame();A.start();drain();S.turn=72;S.year=7;S.month=1;var c=makeGirl({sur:'沈',given:'知微',trait:'才女',age:36,fam:{t:'翰林学士',p:50}});c.solitary={path:'both',stage:0,history:[],respect:0};addConsort(c,3,'选秀入宫');c.enteredAt=50;c.aff=78;c.hp=88;c.mood=72;c.xin={k:'平和',t:S.turn};E().age=39;E().energy=10;E().treasury=2000;var k=makeKid(c,'f','清和');k.born=S.turn-72;k.pendingName=false;maternalTick();UI.view='consort';UI.sel=c.id;PalaceActions.reset();`);return b;}
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
let b=world();write('mother',b);
b=world();b.run(`A.journeyBegin(c.id,'quietChild');`);write('journey',b);
b=world();b.run(`journeyStart(c,'quietChild');journeyEvent(c).choices[0].f();S.turn+=3;journeyEvent(c).choices[0].f();S.turn+=3;A.journeyTalk(c.id);`);write('journey-ending',b);
b=world();b.run(`k.alive=false;maternalTick();S.turn+=6;maternalTick();A.maternalCare(c.id,k.id);`);write('grief',b);
b=world();b.run(`delete c.solitary;c.wound='quiet';A.homeLeave(c.id);`);write('leave',b);
b=world();b.force(.01);b.run(`A.out('city');`);write('market',b);
b=world();b.force(.01);b.run(`A.out('city');choose(0);choose(1);drain();var g=S.shelteredGuests[0];S.turn+=9;g.rescue.trust=65;g.aff=60;g.enteredAt=S.turn-9;A.journeyBegin(g.id,'distantHome');`);write('homeland',b);
b=world();b.run(`c.fam={t:'西域流寓',p:5};c.rescue={at:0,trust:45};delete c.solitary;for(var o of harem())if(o!==c){o.fam.p=90;o.trait='骄矜';delete o.solitary;}pushEv(originPressureEvent());`);write('prejudice',b);
b=world();b.run(`k.born=S.turn-216;k.married=true;k.spouse={name:'许清',born:S.turn-216,alive:true,seed:999};ensureMarriedLife(k);kstory(k,'幼时在母亲身边读书，留着第一张写歪的字。');householdRecord(k,'shared-project','夫妻共写一封家书，也谈妥了小家的来年用度。');UI.view='kid';UI.sel=k.id;`);write('chronicle',b);
console.log(out);
function companion(b){b.run(`var o=makeGirl({sur:'许',given:'清容',trait:'活泼',age:30,fam:{t:'翰林学士',p:50}});delete o.solitary;addConsort(o,4,'选秀入宫');o.enteredAt=30;o.hp=90;o.aff=80;o.wound='quiet';o.xin={k:'平和',t:S.turn};c.palace=o.palace='承乾宫';c.residenceRoom='side';o.residenceRoom='main';for(var p of S.consorts)if(p!==c&&p!==o&&p.palace===c.palace)p.palace='景阳宫';relAdd(c,o,60-relGet(c,o));PalaceActions.reset();`);}
b=world();b.run(`delete c.solitary;c.wound='quiet';sickMotherEvent(c).choices[0].f();PalaceActions.reset();A.homeStory(c.id);`);write('home-worry',b);
b=world();companion(b);b.run(`delete c.solitary;c.trait='温婉';c.wound='quiet';startHomeLeave(c,1);S.turn++;homeLeaveTick();PalaceActions.reset();A.homeConversation(c.id);`);write('home-social',b);
b=world();b.run(`delete c.solitary;c.wound='quiet';var e=officialEntry(c.id+':father'),task=Object.keys(OFFICIAL_TASKS).find(id=>OFFICIAL_TASKS[id].army===(e.h.bloc==='army'));assignOfficialTask(e,task);e.p.commission.outcome='setback';S.turn=e.p.commission.due;officialTaskTick();PalaceActions.reset();A.officialReport(c.id+':father');`);write('official-setback',b);
b=world();companion(b);b.run(`delete c.solitary;UI.view='map';for(var i=0;i<4&&!cohabScene(c.palace,o);i++)S.turn++;PalaceActions.reset();`);write('cohab-map',b);
b=world();companion(b);b.run(`var a=makeKid(o,'f','锦和'),d=makeKid(o,'m','承晏');a.born=d.born=S.turn-24;a.pendingName=d.pendingName=false;PalaceActions.reset();A.quietHousehold(c.id);`);write('quiet-household',b);
b=world();companion(b);b.run(`initTimeTraveler(o,true);PalaceActions.reset();A.neighborWord(c.id);`);write('traveler-quiet',b);
b=world();companion(b);b.run(`c.artPortrait=o.artPortrait=CONSORT_PORTRAITS[0];PalaceActions.reset();A.resemblanceTalk(c.id);`);write('resemblance',b);
b=world();b.run(`var candidate=makeGirl({sur:'林',given:'宛宁',trait:'温婉',age:23,fam:{t:'书香门第',p:25}});candidate.artPortrait=c.artPortrait;S.cands=[candidate];S.selection={phase:'audience',current:candidate.id};S.flags.peek=3;UI.view='xx';PalaceActions.reset();`);write('resemblance-selection',b);
function fosterWorld(){const b=world();companion(b);b.run(`S.consorts=S.consorts.filter(p=>p===c||p===o||p.rank===8);S.children=[];c.age=26;c.rank=5;c.enteredAt=24;c.nights=12;c.favor=85;c.lastBirth=-99;c.fertility.base=.08;o.rank=2;o.age=25;o.hp=90;delete o.solitary;var baby=makeKid(o,'f','明月');baby.born=S.turn-24;baby.pendingName=false;relAdd(c,o,15-relGet(c,o));UI.view='consort';UI.sel=c.id;PalaceActions.reset();`);return b;}
b=fosterWorld();b.run(`A.fosterWish(c.id);`);write('foster-long-wait',b);
b=fosterWorld();b.run(`o.hp=48;relAdd(c,o,65-relGet(c,o));A.fosterWish(c.id);choose(0);`);write('foster-agreement',b);
