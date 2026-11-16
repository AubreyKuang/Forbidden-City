const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./playtest-harness.cjs');
function world(sex='f',age=16){
 const b=boot(318);b.ctx.assert=assert;b.ctx.sex=sex;b.ctx.age=age;
 b.run(`A.start();drain();S.turn=300;S.year=26;S.month=4;E().age=45;E().energy=30;E().treasury=2000;S.children=[];
 var m=makeGirl({age:40,trait:'才女'});addConsort(m,3,'入宫');m.aff=85;m.hp=90;m.enteredAt=100;m.solitary={path:'both'};
 var f=makeGirl({age:39,trait:'温婉'});addConsort(f,3,'入宫');var k=makeKid(m,sex,'清和');k.born=S.turn-age*12;k.hp=90;k.amb=10;k.lit=70;k.mar=30;k.pendingName=false;k.immortalTalent='水灵根';k.foster=f.id;
 k.temperament='内敛';k.daoPractice={path:'dao',visits:6};PalaceActions.reset();`);return b;
}
test('stable spiritual potential favors daughters, rarely sons and still fewer sons born to the empress',()=>{
 const b=world();b.run(`var counts=[];
 for(var type of ['daughter','son','legitimate']){var count=0;for(var seed=1;seed<=10000;seed++){var p={seed,sex:type==='daughter'?'f':'m',birthTraits:{mother:{rank:type==='legitimate'?8:3}}};if(immortalRoot(p))count++;}counts.push(count);}
 assert.ok(counts[0]>2100&&counts[0]<2700);assert.ok(counts[1]>450&&counts[1]<750);assert.ok(counts[2]>80&&counts[2]<230);
 var root=k.immortalTalent;k.birthTraits.mother.rank=8;m.rank=8;assert.equal(immortalRoot(k),root);
 var before=JSON.stringify(S);immortalRoot(k);immortalRoot(k);assert.equal(JSON.stringify(S),before);`);
});
test('discovery requires age, interest and a real local living royal child',()=>{
 for(const change of [`k.born=S.turn-11*12`,`k.alive=false`,`k.pendingName=true`,`k.jailed=true`,`k.templeStay={}`,`k.away=true`,`k.removedFromRoyal=true`,`k.immortalTalent=null`,`delete k.daoPractice;k.amb=90;k.lit=20`]){
  const b=world();b.run(change);assert.equal(b.run('immortalDiscover(k)'),false,change);
 }
 const b=world();b.run(`assert.equal(immortalDiscover(k),true);assert.equal(immortalDiscover(k),false);assert.match(birthTags(k),/水灵根/);assert.ok(m.story.some(e=>e.t.includes('灵根初显')));`);
});
test('the master is a named Daoist and personality remains the child’s own',()=>{
 const b=world();b.run(`immortalDiscover(k);var e=immortalEvent(k);assert.match(e.title,/仙师来访/);assert.match(e.text,new RegExp(IMMORTAL_VOICES[childDisposition(k)]));assert.doesNotMatch(porName(immortalMaster(k)),/国师/);
 assert.ok(porImg(immortalMaster(k)).includes('aria-label="'+porName(immortalMaster(k))+'"'));
 var before=JSON.stringify(S);immortalPanel(k);immortalHall();immortalEvent(k);assert.equal(JSON.stringify(S),before);`);
});
test('young children, heirs, ill children and married children cannot depart',()=>{
 for(const change of [`k.born=S.turn-15*12`,`S.heir=k.id`,`k.hp=40`,`k.married=true`,`k.spouse={name:'旧有婚约'}`]){
  const b=world('m');b.run(`immortalDiscover(k);${change};var e=immortalEvent(k);assert.equal(e.choices[0].cond(),false);assert.equal(immortalDepart(k),false);assert.equal(k.immortal.stage,'noticed');`);
 }
});
test('departure is paid once, marks actual absence and records both mothers’ different feelings',()=>{
 const b=world();b.run(`immortalDiscover(k);var e=immortalEvent(k),cash=E().treasury;e.choices[0].f();assert.equal(E().treasury,cash-30);assert.equal(e.choices[0].f(),null);
 assert.equal(immortalAway(k),true);assert.equal(childInPalace(k),false);assert.equal(childCanVisitCourt(k),false);assert.equal(daoEligible(k),false);assert.equal(templeEligible(k),false);assert.equal(marriageEligible(k),false);assert.equal(marriagePanel(k),'');assert.equal(canOpenPrincess(k),false);
 assert.match(childWhereabouts(k),/清微门/);assert.ok(m.story.some(e=>e.t.includes('久久不肯松手')));assert.ok(f.story.some(e=>e.t.includes('亲手照护')));assert.ok(m.childConcern);assert.ok(f.childConcern);`);
});
test('an existing princess estate cannot produce visits while she lives in the mountains',()=>{
 const b=world();b.run(`k.estate={pursuit:'books',stage:'proposal',nextVisit:0};immortalDiscover(k);immortalDepart(k);assert.equal(princessById(k.id),undefined);assert.equal(estatePrincesses().length,0);assert.equal(princessActions(k),'');
 A.princessVisit(k.id);assert.equal(modalOpen,false);`);
});
test('staged apprenticeship takes two actual years before permanent admission',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);assert.equal(immortalEvent(k),null);S.turn+=12;var e=immortalEvent(k);e.choices[0].f();assert.equal(k.immortal.stage,'trial');assert.equal(e.choices[0].f(),null);
 assert.equal(immortalEvent(k),null);S.turn+=12;immortalEvent(k).choices[0].f();assert.equal(k.immortal.stage,'sect');assert.match(k.story.at(-1).t,/不定归期/);`);
});
test('permanent mountain life does not automatically return or accept a forced recall',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);k.immortal.stage='sect';k.immortal.due=S.turn+18;S.turn+=240;childTempleTick();immortalTick();assert.equal(immortalAway(k),true);
 A.immortalRecall(k.id);assert.equal(curEv.choices.length,1);choose(0);assert.equal(k.immortal.stage,'sect');drain();assert.match(k.story.at(-1).t,/归来不作强求/);`);
});
test('return before permanent admission preserves spiritual identity and original residence',()=>{
 const b=world('m');b.run(`k.princeEstate={opened:200,location:'京城'};immortalDiscover(k);immortalDepart(k);assert.equal(immortalReturn(k),true);assert.equal(immortalAway(k),false);assert.equal(childWhereabouts(k),'京中皇子府');assert.equal(k.immortal.root,'水灵根');assert.match(m.story.at(-1).t,/平安归来/);assert.equal(immortalReturn(k),false);`);
});
test('sect offices require both years and lived merit, not repeated conversations',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);k.immortal.stage='sect';k.temperament='好胜';k.immortal.merit=20;
 assert.equal(immortalRank(k),0);S.turn=k.immortal.departed+60;assert.equal(immortalRank(k),1);S.turn=k.immortal.departed+96;assert.equal(immortalRank(k),2);assert.equal(immortalRankName(k,2),'少主');
 S.turn=k.immortal.departed+180;assert.equal(immortalRank(k),3);k.immortal.merit=0;assert.equal(immortalRank(k),0);
 k.immortal.merit=8;k.immortal.due=S.turn;var e=immortalEvent(k);var old=k.immortal.merit;e.choices[0].f();assert.equal(k.immortal.rank,3);assert.equal(k.immortal.merit,old+1);assert.equal(e.choices[0].f(),null);assert.match(k.story.at(-1).t,/核对无误.*宗主/);`);
});
test('distant accounts vary with all eight dispositions and current health or public hardship',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);k.immortal.stage='sect';var lines=new Set();for(var t of Object.keys(CHILD_DISPOSITIONS)){k.temperament=t;lines.add(immortalNews(k).text);}assert.equal(lines.size,8);
 E().health=40;assert.equal(immortalNews(k).topic,'山中问安');assert.doesNotMatch(immortalNews(k).text,/仙丹治愈/);E().health=90;E().people=30;assert.equal(immortalNews(k).topic,'山门济民');`);
});
test('unverified rumors postpone identity changes without rewarding them',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);k.immortal.stage='sect';k.immortal.merit=8;S.turn+=180;k.immortal.due=S.turn;var e=immortalEvent(k),prestige=E().prestige;e.choices[1].f();assert.equal(k.immortal.rank,0);assert.equal(k.immortal.merit,8);assert.equal(k.immortal.due,S.turn+6);assert.equal(E().prestige,prestige);`);
});
test('letters are saved, rate limited and comfort the actual living mothers',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);var energy=E().energy;A.immortalLetter(k.id);assert.equal(E().energy,energy-1);assert.match(curEv.text,/父皇/);drain();A.immortalLetter(k.id);assert.equal(E().energy,energy-1);assert.ok(f.story.some(e=>e.t.includes('青山家书')));save('1');`);
 const c=boot(44,b.storage);c.ctx.assert=assert;c.run(`A.load('1');var k=S.children[0];assert.equal(immortalAway(k),true);assert.equal(k.immortal.lastLetter,S.turn);assert.match(immortalPanel(k),/山门|学艺/);`);
});
test('death, confinement and removal invalidate a previously opened letter',()=>{
 for(const change of [`k.alive=false`,`k.jailed=true`,`k.removedFromRoyal=true`]){const b=world();b.run(`immortalDiscover(k);immortalDepart(k);S.turn+=12;var e=immortalEvent(k),n=k.story.length;${change};assert.equal(e.valid(),false);assert.equal(e.choices[0].f(),null);assert.equal(k.story.length,n);assert.equal(immortalEvent(k),null);`);}
});
test('mountain princes cannot accumulate succession support or be appointed heir remotely',()=>{
 const b=world('m');b.run(`immortalDiscover(k);immortalDepart(k);k.amb=90;k.sup=80;var before=k.sup;supTick(k);assert.equal(k.sup,before);A.kidHeir(k.id);assert.equal(S.heir,null);assert.equal(heirTick(),null);assert.equal(milestone(),null);`);
});
test('succession retains the same mountain relative and uses the new emperor’s proper address',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);k.immortal.stage='sect';k.immortal.merit=8;var id=k.id;var h=makeKid(m,'m','承安');h.born=S.turn-240;h.pendingName=false;S.heir=h.id;
 succeed(h);choose(0,'承平');drain();var relative=royalById(id);assert.ok(relative);assert.equal(relative.immortal.stage,'sect');assert.equal(immortalAway(relative),true);assert.match(immortalVoice(relative).lines.join(''),/^陛下/);assert.doesNotMatch(immortalVoice(relative).lines.join(''),/父皇/);
 S.turn+=180;relative.immortal.due=S.turn;immortalEvent(relative).choices[0].f();assert.equal(relative.immortal.rank,3);UI.sel=id;assert.match(viewRoyalRelative(),/仙缘与江湖/);`);
});
test('an automatic monthly invitation survives a fresh-context pending-action reload',()=>{
 const b=world();b.run(`immortalDiscover(k);S.flags.immortalPace={last:S.turn,lastOffer:-99};A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title==='仙师来访 · 山门之约'));save('1');`);
 const c=boot(8,b.storage);c.ctx.assert=assert;c.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.ok([curEv,...Q].some(e=>e?.title==='仙师来访 · 山门之约'));drain();assert.equal(S.children[0].immortal.stage,'learning');assert.equal(S.children[0].estate,undefined);`);
});
test('already queued coming-of-age and residence requests expire after a mountain departure',()=>{
 for(const sex of ['m','f']){const b=world(sex);b.run(`var request=milestone();assert.ok(request);immortalDiscover(k);immortalDepart(k);assert.equal(request.valid(),false);assert.equal(request.choices[0].f(),null);assert.equal(k.princeEstate,undefined);assert.equal(k.estate,undefined);A.kidTitle(k.id);assert.equal(modalOpen,false);`);}
});
test('moving out invalidates an open master interview without creating another conversation',()=>{
 const b=world();b.run(`immortalDiscover(k);var e=immortalEvent(k),n=k.story.length;k.away=true;assert.equal(e.valid(),false);assert.equal(e.choices[1].f(),null);assert.equal(k.story.length,n);`);
});
test('a living mountain son is not described as dead or nonexistent at the end of the reign',()=>{
 const b=world('m');b.run(`immortalDiscover(k);immortalDepart(k);var e=deathEvent('驾崩');assert.match(e.text,/皇子长留山门/);assert.doesNotMatch(e.text,/膝下无子|血脉至此而终/);assert.equal(e.choices.some(c=>c.t.includes('传位于')),false);`);
});
test('letters never add new living experiences to deceased mothers',()=>{
 const b=world();b.run(`immortalDiscover(k);immortalDepart(k);m.alive=false;var count=m.story.length;A.immortalLetter(k.id);drain();assert.equal(m.story.length,count);assert.ok(f.story.some(e=>e.t.includes('青山家书')));`);
});
for(const fixture of JSON.parse(fs.readFileSync(__dirname+'/fixtures/immortal-journeys-v6.json','utf8')))test('real v6 '+fixture.mode+' pending action retains its original draws and scene',()=>{
 const b=boot();b.ctx.assert=assert;b.ctx.fixture=fixture.save;b.run(`S=fixture;assert.equal(PalaceActions.restore(S.pendingActions),true);assert.equal(PalaceActions.contentVersion,6);assert.equal(immortalEnabled(),false);drain();assert.equal(immortalEnabled(),true);`);
});
