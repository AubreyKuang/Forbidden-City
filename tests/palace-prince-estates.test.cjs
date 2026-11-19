const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

function princeWorld(age=19){
  const game=world();game.ctx.assert=assert;
  game.run(`var prince=makeKid(a,'m','承安');prince.born=S.turn-${age}*12;prince.pendingName=false;prince.title='睿亲王';prince.sup=61;prince.adult=true;`);
  return game;
}

test('early low-trust couples have an awkward visit and separate chronicles, while a close couple does not',()=>{
 const game=princeWorld(23);
 game.run(`openPrinceEstate(prince);prince.married=true;
   prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn,trust:36};
   var p=prince.spouse,h=ensureMarriedLife(prince);recordHouseholdNews(prince);
   assert.equal(h.pending.id,'newlywed');assert.match(p.story.at(-1).t,/新婚初识.*茶送到两处/);
   A.householdVisit(prince.id);assert.equal(curEv.title,'新婚 · 话到嘴边');choose(0);drain();
   assert.equal(p.trust,40);assert.match(p.story.at(-1).t,/同桌用饭/);
   assert.ok(prince.story.some(x=>x.t.includes('新婚 · 话到嘴边')));
   assert.equal(makeHouseholdScene(prince),null);
   var princess=makeKid(a,'f','昭仪');princess.born=S.turn-21*12;princess.pendingName=false;
   princess.married=true;princess.spouse={...marriageCandidate(princess,'scholar'),marriedAt:S.turn,trust:78};
   ensureMarriedLife(princess);assert.equal(makeHouseholdScene(princess),null);
   princess.spouse.trust=34;recordHouseholdNews(princess);assert.equal(princess.household.pending.id,'newlywed');
   assert.match(householdSceneEvent(princess).text,/昭仪.*对方/);`);
});

test('the Wang residence and the collapsible family roster open the same child portrait and profile',()=>{
 const game=princeWorld(30);
 game.run(`openPrinceEstate(prince);prince.married=true;
  prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-72,trust:70};
  var h=ensureMarriedLife(prince),id='grand-'+prince.id;
  h.children.push({id,name:'景行',sex:'m',born:S.turn-24,alive:true,seed:21,portraitVariant:3,
    motherName:prince.spouse.name,fatherName:prince.name,father:prince.id,mother:prince.spouse.id,lit:41,mar:26,vir:38,hp:91,story:[{d:dateStr(),t:'初学识字。'}]});
  A.go('prince-estate',prince.id);assert.match(viewPrinceEstate(),/household-child/);assert.match(viewPrinceEstate(),/景行/);
  A.go('household-child',id);assert.match(viewHouseholdChild(),/景行/);assert.match(viewHouseholdChild(),/class="por /);
  assert.match(viewHouseholdChild(),/生父.*承安/);assert.match(viewHouseholdChild(),/体魄/);assert.match(viewHouseholdChild(),/初学识字/);
  assert.equal(chroniclePersonTarget(id).person,h.children[0]);assert.match(viewHouseholdChild(),/返回王府/);
  A.backPerson('family');assert.equal(UI.view,'prince-estate');
  assert.match(viewFamily(),/<details class="family-branch"><summary><strong>皇子公主的子女/);
  UI.familyMode='list';assert.match(viewFamily(),/皇子公主的子女/);`);
});

test('a Wang consort can refuse a private visit or agree once without telling the prince',()=>{
 let game=princeWorld(25);
 game.run(`E().age=45;openPrinceEstate(prince);prince.married=true;
  prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-12,trust:31,willing:false};
  ensureMarriedLife(prince);var p=prince.spouse;
  A.princeSpouseVisit(prince.id);assert.equal(curEv.title,'王府 · 私下求见');
  assert.equal(curEv.choices.length,1);choose(0);drain();assert.equal(p.princePrivateVisit.meetings,0);
  A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
  S.turn++;p.willing=true;p.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>mulberry32(voiceHash('prince-spouse-visit:'+seed+':'+(E().seed||S.gen)))()<.62);
  PalaceActions.reset();A.princeSpouseVisit(prince.id);assert.equal(curEv.choices.length,2);save('1');`);
 game=boot(83,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,energy=E().energy;
  choose(0);assert.equal(E().energy,energy-1);drain();assert.equal(p.princePrivateVisit.meetings,1);
  assert.match(p.story.at(-1).t,/亲口应允/);assert.doesNotMatch(prince.story.map(x=>x.t).join(''),/王府私会/);
  assert.ok(!(S.reignAnnals||[]).some(e=>e.title==='王府 · 私下求见'));
  S.turn++;prince.away=true;A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
  prince.away=false;p.born=S.turn-17*12;A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);`);
});

test('a noticed private meeting reaches the next month, with two private accounts and lasting fallout after a reload',()=>{
 let game=princeWorld(27);
 game.run(`E().age=45;openPrinceEstate(prince);prince.married=true;prince.temperament='仁厚';
   var p=prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-40,trust:78,willing:true};
   p.marriageNature={...marriageNature(p),temperament:'沉静'};
   p.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>mulberry32(voiceHash('prince-spouse-visit:'+seed+':'+(E().seed||S.gen)))()<.10);
   ensureMarriedLife(prince).nextNews=S.turn+48;
   A.princeSpouseVisit(prince.id);choose(0);drain();assert.equal(p.princePrivateVisit.meetings,1);
   assert.equal(p.princePrivateVisit.noticed,undefined);
   S.turn++;A.princeSpouseVisit(prince.id);`);
 game.force(.01);
 game.run(`choose(0);drain();var visit=p.princePrivateVisit;assert.equal(visit.meetings,2);assert.equal(visit.noticedAt,S.turn);
   assert.match(prince.story.at(-1).t,/王府闲话.*没.*准话/);assert.equal(pendingPrinceSpouseDiscoveries().length,0);
   var seek=title=>{for(var n=0;modalOpen&&n<150;n++){
     if(!modalResult&&curEv.title===title)return;
     if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));
   }throw Error('Missing '+title);};
   A.endMonth();seek('王府 · 私约说开');
   assert.match(curEv.text,/账册阖上.*亲口答允/s);assert.match(curEv.text,/责问偏厅当差的宫人.*先听你亲口说/s);
   save('1');`);
 game=boot(84,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'王府 · 私约说开');
   var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,visit=p.princePrivateVisit;
   choose(0);assert.equal(visit.discovery.before,78);assert.equal(p.trust,66);
   assert.match(prince.story.at(-1).t,/王府私约说开.*父皇.*答应止住/);assert.match(p.story.at(-1).t,/王府私约说开.*替我留着灯/);
   drain();assert.match(princeSpouseVisitPanel(prince),/私下往来已止/);
   A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
   A.princeFamilyMemo(prince.id,p.id);assert.match(curEv.text,/王府私约说开.*替我留着灯/);drain();
   A.endMonth();assert.ok(![curEv,...Q].some(e=>e?.title==='王府 · 风波之后'));drain();
   A.endMonth();var follow=[curEv,...Q].find(e=>e?.title==='王府 · 风波之后');assert.match(follow.text,/重新请她同桌用饭/);
   drain();assert.equal(visit.discovery.followed,true);assert.equal(p.trust,68);
   assert.match(prince.story.at(-1).t,/王府风波之后.*照常待值夜/);assert.match(p.story.at(-1).t,/王府风波之后.*肯听的时候才说/);
   for(const person of [prince,p])assert.equal(person.story.filter(e=>e.t.includes('【王府私约说开】')).length,1);
   assert.equal(pendingPrinceSpouseDiscoveries().length,0);
   assert.ok(!S.reignAnnals.some(e=>['王府 · 私约说开','王府 · 风波之后'].includes(e.title)));
   assert.ok(!S.log.some(e=>/王府私约说开|王府风波之后/.test(e.t)));`);
});

test('an old rumour continues for a distant marriage and survives a temporary absence',()=>{
 const game=princeWorld(27);
 game.run(`E().age=45;openPrinceEstate(prince);prince.married=true;prince.temperament='自矜';
   var p=prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-40,trust:35};
   p.marriageNature={...marriageNature(p),temperament:'好胜'};ensureMarriedLife(prince);
   var visit=p.princePrivateVisit={gen:S.gen,meetings:2,last:S.turn-1,noticed:true};
   p.away=true;assert.equal(pendingPrinceSpouseDiscoveries().length,0);p.away=false;
   visit.gen--;assert.equal(pendingPrinceSpouseDiscoveries().length,0);visit.gen++;
   pushEv(pendingPrinceSpouseDiscoveries()[0]);assert.match(curEv.text,/声音虽有些发颤.*把门掩好.*原先就少问彼此的心事/s);
   choose(1);drain();assert.equal(p.trust,27);
   assert.match(prince.story.at(-1).t,/晚膳摆在书房/);assert.match(p.story.at(-1).t,/我自己做的决定/);
   S.turn+=2;pushEv(pendingPrinceSpouseDiscoveries()[0]);assert.match(curEv.text,/见客的安排先互相知会/);
   choose(0);drain();assert.equal(p.trust,27);assert.match(p.story.at(-1).t,/把每句话辩到底/);`);
});

function princeParentageWorld(trust,princeNature,wifeNature){
 const game=princeWorld(27);
 game.run(`E().age=45;openPrinceEstate(prince);prince.married=true;prince.temperament='${princeNature}';
   var p=prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn-40,trust:${trust},willing:true};
   p.marriageNature={...marriageNature(p),temperament:'${wifeNature}'};
   p.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>mulberry32(voiceHash('prince-spouse-visit:'+seed+':'+(E().seed||S.gen)))()<.10);
   ensureMarriedLife(prince).nextNews=S.turn+48;
   var seek=pattern=>{for(var n=0;modalOpen&&n<150;n++){
     if(!modalResult&&pattern.test(curEv.title))return;
     if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));
   }throw Error('Missing '+pattern);};`);
 return game;
}

test('a rare private conception is concealed until a sealed inquiry, then survives a reload and a single household birth',()=>{
 let game=princeParentageWorld(78,'仁厚','敏感');
 game.run(`setupJyw();A.princeSpouseVisit(prince.id);`);
 game.force(.029);
 game.run(`choose(0);drain();var h=prince.household,g=h.pregnancies[0],dossier=princeSpouseParentageCases(prince)[0];
   assert.equal(h.pregnancies.length,1);assert.equal(dossier.imperialFather,E().sur+E().name);
   assert.match(householdPanel(prince),/暂无孕信/);assert.doesNotMatch(viewJinyiwei(),/王府亲缘密卷/);
   A.endMonth();assert.ok(![curEv,...Q].some(e=>/胎月起疑|孕信密呈/.test(e?.title)));drain();
   A.endMonth();seek(/王府 · (胎月起疑|孕信密呈)/);assert.match(curEv.text,/头一个把孕信说给他听/);
   var energy=E().energy,treasury=E().treasury;choose(0);assert.equal(dossier.status,'investigating');
   assert.equal(E().energy,energy-1);assert.equal(E().treasury,treasury-15);drain();
   assert.match(viewJinyiwei(),/密查中 · 还需 2 个月/);assert.doesNotMatch(viewJinyiwei(),/已核明生父/);
   A.endMonth();drain();A.endMonth();seek(/锦衣卫回奏 · 王府亲缘/);save('1');`);
 game=boot(991,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
   var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,h=prince.household,dossier=princeSpouseParentageCases(prince)[0];
   assert.match(curEv.text,/生父为皇帝.*王妃与孩子可还安稳.*缝到一半的小被/s);
   choose(0);drain();assert.equal(dossier.status,'complete');assert.equal(p.trust,69);
   assert.equal(p.princePrivateVisit.paternityConfirmed,true);assert.equal(princeSpouseDiscoveryEvent(prince),null);
   assert.match(princeSpouseVisitPanel(prince),/私下往来已止/);
   A.princeSpouseVisit(prince.id);assert.equal(modalOpen,false);
   assert.match(prince.story.findLast(e=>e.t.startsWith('【王府亲缘密卷】')).t,/取什么名字/);assert.match(p.story.findLast(e=>e.t.startsWith('【王府亲缘密卷】')).t,/往后还愿不愿听/);
   assert.match(prince.story.at(-1).t,/王府留养.*大人的为难/);assert.match(p.story.at(-1).t,/王府留养.*缝了一半的小被/);
   assert.ok(!S.reignAnnals.some(e=>/王府亲缘|胎月起疑|孕信密呈/.test(e.title)));
   assert.ok(!S.log.some(e=>/生父为皇帝|王府密查/.test(e.t)));
   S.turn=h.pregnancies[0].due;marriedLifeTick();marriedLifeTick();
   assert.equal(h.children.length,1);assert.equal(dossier.childId,h.children[0].id);
   assert.equal(h.children[0].father,prince.id);assert.ok(!S.children.includes(h.children[0]));
   A.go('household-child',dossier.childId);assert.match(viewHouseholdChild(),/宗谱所载父亲.*承安/s);assert.match(viewHouseholdChild(),/已核明生父为皇帝/);
   assert.equal(pendingPrinceSpouseParentage().length,0);`);
});

test('the husband may suspect a child he fathered, and the deferred investigation is available in both places once appointed',()=>{
 const game=princeParentageWorld(42,'自矜','好胜');
 game.run(`assert.equal(startHouseholdPregnancy(prince,p),true);S.turn++;
   A.princeSpouseVisit(prince.id);choose(0);drain();
   var h=prince.household,dossier=princeSpouseParentageCases(prince)[0];assert.equal(h.pregnancies.length,1);
   assert.equal(dossier.imperialFather,null);p.princePrivateVisit.noticed=true;
   var oldSeed=prince.seed;prince.seed=Array.from({length:40},(_,i)=>i+1).find(seed=>{prince.seed=seed;return princeSpouseParentageSuspicion(prince,dossier);})||oldSeed;
   A.endMonth();seek(/王府 · 胎月起疑/);assert.match(curEv.text,/贺喜的人散去.*往往分开/s);
   assert.equal(curEv.choices.length,1);choose(0);drain();assert.equal(dossier.status,'open');
   assert.match(princeSpouseParentagePanel(prince),/亲缘待核.*需有在任指挥使/s);
   setupJyw();assert.match(viewJinyiwei(),/请锦衣卫查证/);
   A.princeSpousePaternity(prince.id,dossier.key);assert.equal(curEv.title,'锦衣卫密查 · 王府亲缘');
   var treasury=E().treasury;E().treasury=0;choose(0);assert.equal(dossier.status,'open');E().treasury=treasury;
   choose(0);drain();S.turn=dossier.due;A.princeSpousePaternity(prince.id,dossier.key);
   assert.match(curEv.text,/生父为承安.*走到门口又折回来.*她这些日子的难堪/s);
   choose(0);drain();assert.equal(p.trust,43);assert.equal(dossier.status,'complete');
   assert.equal(p.princePrivateVisit.paternityConfirmed,undefined);
   assert.match(prince.story.at(-1).t,/各过各的日子/);assert.match(p.story.at(-1).t,/专心过自己的日子/);
   A.princeSpousePaternity(prince.id,dossier.key);assert.equal(modalOpen,false);`);
});

test('saying no, an old pregnancy, and an unlucky private meeting do not create a new pregnancy',()=>{
 const game=princeParentageWorld(60,'审慎','沉静');
 game.run(`p.willing=false;A.princeSpouseVisit(prince.id);choose(0);drain();
   assert.equal(prince.household.pregnancies.length,0);assert.equal(p.princePrivateVisit.lastMeeting,undefined);
   S.turn++;p.willing=true;A.princeSpouseVisit(prince.id);`);
 game.force(.03);
 game.run(`choose(0);drain();assert.equal(prince.household.pregnancies.length,0);
   S.turn+=3;assert.equal(startHouseholdPregnancy(prince,p),true);S.turn+=3;
   A.princeSpouseVisit(prince.id);choose(0);drain();
   assert.equal(prince.household.pregnancies.length,1);assert.equal(princeSpouseParentageCases(prince).length,0);`);
});

test('a sealed placement waits for birth, then the actual child moves to the selected dowager after reload',()=>{
 let game=princeParentageWorld(75,'仁厚','敏感');
 game.run(`var main=S.flags.dowager=makeDowager(q,'嫡母'),birth=S.flags.birthDowager=makeDowager(a,'生母');setupJyw();
   assert.ok(startHouseholdPregnancy(prince,p,{privateVisit:true}));
   var g=prince.household.pregnancies[0],dossier=princeSpouseParentageCases(prince)[0];dossier.status='investigating';dossier.due=S.turn;
   PalaceActions.reset();A.princeSpousePaternity(prince.id,dossier.key);choose(1);
   assert.equal(curEv.title,'王府密议 · 孩子的去处');
   choose(curEv.choices.findIndex(c=>c.t.includes('慈宁宫西殿')));assert.match(modalResult.text,/先顾她的身子/);drain();
   assert.equal(dossier.placement.status,'waiting');assert.equal(S.children.length,1);
   assert.match(princeSpouseParentagePanel(prince),/待出生后/);assert.equal(pendingPrinceSpousePlacements().length,0);
   assert.match(p.story.at(-1).t,/王府接养密议.*枕边/);
   S.turn=g.due-1;PalaceActions.reset();A.endMonth();seek(/王府密信 · 孩子已出生/);save('1');`);
 game=boot(898,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'王府密信 · 孩子已出生');
   var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,dossier=princeSpouseParentageCases(prince)[0];
   var baby=prince.household.children[0],original=baby.id,firstPortrait=portraitCell(baby),firstName=baby.name;
   choose(0);drain();assert.equal(prince.household.children.length,0);assert.equal(dossier.placement.status,'palace');
   assert.equal(householdBirthCount(prince),1);assert.equal(dossier.placement.palaceId,baby.id);
   assert.equal(kidById(baby.id),baby);assert.equal(baby.princeSpouseOrigin.formerId,original);assert.equal(baby.name,firstName);
   assert.equal(portraitCell(baby),firstPortrait);assert.equal(upbringingDowager(baby),S.flags.birthDowager);
   assert.match(childResidence(baby),/西殿/);assert.match(kidName(baby),/宗室寄养/);
   assert.match(prince.story.findLast(e=>e.t.startsWith('【王府送别】')).t,/再抱一会儿/);assert.match(p.story.findLast(e=>e.t.startsWith('【王府送别】')).t,/小被/);
   assert.equal(eligiblePalaceSon(baby),false);assert.equal(pendingPrinceSpousePlacements().length,0);
   assert.ok(!S.log.some(e=>/密接入宫|王府送别/.test(e.t)));
   A.go('kid',baby.id);assert.match(viewKid(),/来处密记/);assert.match(viewKid(),/慈宁宫西殿/);`);
});

test('an unavailable planned caregiver can be replaced by a specific consort in an old resolved case',()=>{
 const game=princeParentageWorld(42,'自矜','好胜');
 game.run(`S.flags.dowager=makeDowager(q,'太后');
   startHouseholdPregnancy(prince,p,{privateVisit:true});var g=prince.household.pregnancies[0],dossier=princeSpouseParentageCases(prince)[0];dossier.status='complete';
   A.princeSpousePlacement(prince.id,dossier.key);choose(0);drain();assert.equal(dossier.placement.seat,'main');
   S.flags.dowager.alive=false;S.turn=g.due;var baby=deliverHouseholdChild(prince,g);
   A.princeSpousePlacement(prince.id,dossier.key);assert.match(curEv.text,/无法接养/);choose(0);
   var index=curEv.choices.findIndex(c=>c.person?.id===a.id);assert.ok(index>=0);choose(index);drain();
   assert.equal(dossier.placement.palaceId,baby.id);assert.equal(fosterOf(baby),a);assert.equal(youngChildMother(baby),a);
   assert.match(prince.story.at(-1).t,/多留一夜/);assert.match(p.story.at(-1).t,/亲口告诉她/);assert.match(a.story.at(-1).t,/接养宗亲/);
   A.princeSpousePlacement(prince.id,dossier.key);assert.equal(modalOpen,false);`);
});

test('a dowager visit follows the actual ward to her hall and sends only a private household letter',()=>{
 let game=princeParentageWorld(74,'仁厚','敏感');
 game.run(`S.flags.dowager=makeDowager(q,'嫡母');S.flags.birthDowager=makeDowager(a,'生母');
   startHouseholdPregnancy(prince,p,{privateVisit:true});
   var g=prince.household.pregnancies[0],dossier=princeSpouseParentageCases(prince)[0];
   S.turn=g.due;var k=deliverHouseholdChild(prince,g);dossier.status='complete';
   A.princeSpousePlacement(prince.id,dossier.key);choose(1);drain();
   assert.equal(upbringingDowager(k),S.flags.birthDowager);
   A.greet();assert.ok(!Q.some(e=>e.title.includes('请安之后')));drain();
   var energy=E().energy;A.greetBirthDowager();choose(0);if(modalResult)nextEv();
   assert.equal(curEv.title,'慈宁宫西殿 · 请安之后');choose(0);
   assert.equal(curEv.title,'慈宁宫西殿 · 探望'+k.name);assert.match(curEv.text,/伸出手/);
   assert.equal(E().energy,energy-1);save('1');`);
 game=boot(792,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
   var prince=S.children.find(k=>k.name==='承安'),p=prince.spouse,k=S.children.find(k=>k.princeSpouseOrigin);
   assert.equal(curEv.title,'慈宁宫西殿 · 探望'+k.name);var mood=k.mood??65;
   choose(1);drain();
   assert.equal(k.mood,Math.min(100,mood+4));assert.match(k.story.at(-1).t,/慈宁宫探望/);
   assert.match(S.flags.birthDowager.story.at(-1).t,/寄养日常/);
   assert.match(prince.story.at(-1).t,/慈宁宫平安信.*念给王妃/);assert.match(p.story.at(-1).t,/慈宁宫平安信.*手指/);
   assert.ok(!S.log.some(e=>e.t.includes('慈宁宫平安信')||e.t.includes('探望'+k.name)));
   A.greetBirthDowager();assert.ok(!Q.some(e=>e.title.includes('请安之后')));drain();
   k.born=S.turn-8*12;k.temperament='内敛';S.turn++;
   A.greetBirthDowager();choose(0);if(modalResult)nextEv();choose(0);
   assert.match(curEv.text,/只剩几个人/);choose(0);drain();
   assert.equal(prince.story.filter(e=>e.t.startsWith('【慈宁宫平安信】')).length,1);`);
});

test('a prince moves from a capital residence to a named fief and later returns',()=>{
  const game=princeWorld();game.run(`openPrinceEstate(prince);var id=prince.id;A.go('prince-estate',id);
    assert.match(viewPrinceEstate(),/睿亲王府/);assert.match(viewPrinceEstate(),/到王府探望/);
    A.princeEstateMove(id);choose(0);drain();assert.equal(prince.away,true);assert.equal(prince.sup,41);
    assert.equal(childWhereabouts(prince),'西安');assert.match(viewOut(),/外地藩邸/);assert.doesNotMatch(viewPrinceEstate(),/到王府探望/);
    assert.ok(a.story.some(x=>x.t.includes('赴西安就藩')));assert.ok(S.log.some(x=>x.t.includes('赴西安就藩')));
    A.princeEstateMove(id);assert.equal(modalOpen,false);S.turn+=6;
    A.princeEstateMove(id);choose(0);drain();assert.equal(prince.away,false);assert.equal(prince.princeEstate.location,'京城');
    assert.equal(prince.sup,41);assert.match(viewPrinceEstate(),/到王府探望/);`);
});

test('a legacy fief can be registered and mailed without reapplying the cost of moving',()=>{
  let game=princeWorld();game.run(`prince.away=true;save('auto');`);
  game=boot(824,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');var prince=S.children.find(k=>k.name==='承安'),id=prince.id;A.go('prince-estate',id);
    assert.match(viewPrinceEstate(),/藩地未载/);A.princeRegisterFief(id);choose(1);drain();assert.equal(prince.sup,61);
    assert.equal(princeEstatePlace(prince),'太原');var energy=E().energy;
    A.royalKinContact(id,true);assert.equal(curEv.title,'王府家书');choose(0);drain();assert.equal(E().energy,energy-1);
    assert.equal(prince.royalKinContact.pending.due,S.turn+1);A.princeEstateMove(id);assert.equal(modalOpen,false);
    S.turn++;royalKinContactTick();A.royalKinReply(id,true);assert.equal(curEv.title,'王府回信');save('auto');`);
  game=boot(825,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安');
    assert.equal(curEv.title,'王府回信');choose(0);drain();assert.equal(prince.royalKinContact.reply.unread,false);
    assert.equal(prince.story.filter(x=>x.t.includes('【王府回信】')).length,1);`);
});

test('a prior-reign prince retains the same residence and can be visited there',()=>{
  const game=princeWorld();game.run(`openPrinceEstate(prince);S.children=[];prince.reign=S.gen;prince.kinship='皇弟';S.royalRelatives=[prince];S.gen++;
    assert.equal(princeEstateById(prince.id),prince);A.royalKinContact(prince.id,true);assert.equal(curEv.title,'王府 · 到府探望');
    choose(1);drain();assert.ok(prince.story.some(x=>x.t.includes('到王府看望皇弟承安')));`);
});

test('quarterly reports summarize the fiefs and only include weddings registered recently',()=>{
  const game=princeWorld();game.run(`S.month=3;prince.away=true;
    var other=makeKid(a,'m','承宁');other.born=prince.born;other.pendingName=false;other.away=true;other.adult=true;
    var local=makeKid(a,'m','承宣');local.born=prince.born;local.pendingName=false;local.adult=true;openPrinceEstate(local);
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:S.turn};ensureMarriedLife(prince);
    assert.equal(princeQuarterReports(),null);A.endMonth();
    var summary=[curEv,...Q].filter(e=>e?.title==='王府长史 · 季度奏报');assert.equal(summary.length,1);
    assert.match(summary[0].text,/睿亲王府.*禄米、王府修缮、婚礼用度/);
    assert.match(summary[0].text,/承宁王府.*禄米、王府修缮/);assert.doesNotMatch(summary[0].text,/承宣/);
    assert.equal(princeDocketPending(prince).length,3);assert.equal(princeDocketPending(other).length,2);
    assert.equal(princeQuarterReports(),null);drain();`);
});

test('deferred quarterly items survive reload and funding cannot spend twice or overdraw',()=>{
  let game=princeWorld();game.run(`S.month=4;prince.away=true;princeQuarterReports();var id=prince.id;
    A.princeDocket(id,'grain');choose(2);drain();assert.equal(princeDocketPending(prince).length,2);
    E().treasury=5;A.princeDocket(id,'grain');assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[1].cond(),false);choose(2);drain();
    E().treasury=50;A.princeDocket(id,'repair');save('auto');`);
  game=boot(481,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var prince=S.children.find(k=>k.name==='承安'),id=prince.id;
    assert.equal(curEv.title,'长史奏报 · 王府修缮');var fund=curEv.choices[0].f;
    choose(0);assert.equal(fund(),null);drain();assert.equal(E().treasury,30);
    assert.ok(prince.story.some(x=>x.t.includes('国库拨银20万两')));assert.equal(S.log.filter(x=>x.t.includes('国库拨银20万两')).length,1);
    S.turn+=3;S.month=7;assert.equal(princeQuarterReports(),null);assert.equal(princeDocketPending(prince).length,1);
    A.princeDocket(id,'grain');choose(1);drain();assert.equal(E().treasury,24);
    S.turn+=3;S.month=10;assert.ok(princeQuarterReports());assert.equal(princeDocketPending(prince)[0].kind,'grain');
  `);
});

test('the original household son succeeds after a death report and keeps the fief and docket on reload',()=>{
  let game=princeWorld(40);game.run(`var id=prince.id;prince.away=true;prince.princeEstate={location:'西安',opened:0};
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};var h=ensureMarriedLife(prince);
    var son={id:'grand-1-'+id+'-1',name:'承礼',sex:'m',born:S.turn-7*12,alive:true,seed:17,mother:prince.spouse.id,father:id,story:[]};h.children.push(son);
    assert.match(princeSuccessionTick().text,/请陛下核定世子/);assert.equal(princeSuccessionTick(),null);
    A.princeReviewSuccession(id);choose(0);drain();assert.equal(princeHeir(prince),son);
    assert.ok(prince.spouse.story.some(x=>x.t.includes('册封世子')));S.month=4;princeQuarterReports();
    prince.born=S.turn-95*12;assert.match(princeSuccessionTick().text,/承礼奉表请袭/);assert.equal(prince.alive,false);
    A.go('prince-estate',id);A.princeReviewSuccession(id);assert.equal(curEv.title,'长史奏报 · 请袭王爵');choose(0);drain();
    assert.equal(royalById(son.id),h.children[0]);assert.equal(princeEstatePlace(son),'西安');assert.equal(son.title,'睿亲王');
    assert.equal(princeDocketPending(son).length,2);assert.equal(princeDocketPending(prince).length,0);
    assert.match(viewPrinceEstate(),/读先王的记事/);assert.match(viewOut(),/grand-1-/);assert.equal(princeSuccessionTick(),null);
    assert.ok(prince.story.some(x=>x.t.includes('袭爵')));assert.ok(S.log.some(x=>x.t.includes('府中庶务由长史暂理')));save('auto');`);
  game=boot(81,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');var p=S.children.find(x=>x.name==='承安'),son=p.household.children[0];
    assert.equal(royalById(son.id),son);assert.equal(son.away,true);assert.equal(royalHouseholds().filter(x=>x.id===son.id).length,1);
    assert.equal(S.children.includes(son),false);assert.ok(son.story.some(x=>x.t.includes('袭爵')));`);
});

test('a predeceased heir is reported once and the throne can designate another son',()=>{
  const game=princeWorld(40);game.run(`openPrinceEstate(prince);prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
    var first={id:'first-son',name:'景和',sex:'m',born:S.turn-10*12,alive:true,hp:0,seed:17,mother:prince.spouse.id,father:prince.id};
    var second={...first,id:'second-son',name:'景宁',born:S.turn-8*12,hp:90};ensureMarriedLife(prince).children.push(first,second);
    prince.princeEstate.succession={heir:first.id,nominated:first.id};var report=princeSuccessionTick();
    assert.match(report.text,/景和先于王爷离世，请旨重新册立世子/);
    assert.equal(first.alive,false);assert.equal(princeSuccessionTick(),null);assert.equal(princeHeir(prince),undefined);
    A.princeReviewSuccession(prince.id);assert.equal(curEv.title,'长史奏报 · 另立世子');choose(0);drain();
    assert.equal(princeHeir(prince),second);assert.ok(prince.story.some(x=>x.t.includes('另立世子')));
    assert.ok(prince.spouse.story.some(x=>x.t.includes('世子讣报')));assert.equal(S.log.filter(x=>x.t.includes('世子讣报')).length,1);`);
});

test('adoption retains the original child and parents through inheritance and a cold reload',()=>{
  let game=princeWorld(40);game.run(`prince.away=true;prince.princeEstate={location:'太原',opened:0};
    prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};ensureMarriedLife(prince);
    var brother=makeKid(a,'m','承宁');brother.pendingName=false;brother.born=prince.born;openPrinceEstate(brother);
    brother.married=true;brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};var h=ensureMarriedLife(brother);
    var nephew={id:'grand-adoption',name:'景修',sex:'m',born:S.turn-6*12,alive:true,hp:90,seed:31,mother:brother.spouse.id,father:brother.id};h.children.push(nephew);
    assert.match(princeSuccessionTick().text,/议请过继/);A.princeReviewAdoption(prince.id);choose(0);drain();
    assert.equal(princeHeir(prince),nephew);assert.equal(princeSons(brother).length,0);assert.equal(princeSons(prince).length,1);
    for(const p of [nephew,brother,brother.spouse,prince,prince.spouse])assert.ok(p.story.some(x=>x.t.includes('王府过继')));
    assert.equal(S.log.filter(x=>x.t.includes('【王府过继】')).length,1);assert.equal(nephew.father,brother.id);save('auto');`);
  game=boot(82,game.storage);game.ctx.assert=assert;game.run(`A.load('auto');var p=S.children.find(k=>k.name==='承安'),b=S.children.find(k=>k.name==='承宁'),son=b.household.children[0];
    assert.equal(princeHeir(p),son);p.alive=false;princeSuccessionTick();A.princeReviewSuccession(p.id);choose(0);drain();
    assert.equal(royalById(son.id),son);assert.equal(princeEstatePlace(son),'太原');assert.ok(b.spouse.story.some(x=>x.t.includes('亲生儿子')||x.t.includes('惦记孩子在嗣府')));
    S.children=S.children.filter(k=>k!==b);inheritHousehold(b,harem()[0]);assert.equal(royalById(son.id),son);assert.equal(S.children.some(k=>k.name===son.name),false);
    assert.equal(princeBiologicalParents(son).mother.id,b.spouse.id);`);
});

test('a sonless deceased prince can receive a posthumous heir from a brother',()=>{
  const game=princeWorld();game.run(`prince.away=true;prince.princeEstate={location:'开封',opened:0};prince.alive=false;
    var brother=makeKid(a,'m','承宁');brother.pendingName=false;brother.born=prince.born;
    brother.married=true;brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};
    var son={id:'grand-posthumous',name:'景修',sex:'m',born:S.turn-6*12,alive:true,seed:17,mother:brother.spouse.id,father:brother.id};
    ensureMarriedLife(brother).children.push(son);assert.match(princeSuccessionTick().text,/请择嗣承袭/);
    A.princeReviewAdoption(prince.id);assert.match(curEv.choices[0].t,/过继并承袭/);choose(0);drain();
    assert.equal(princeEstatePlace(son),'开封');assert.equal(princeProbate(prince),false);assert.equal(S.log.filter(x=>x.t.includes('【袭爵】')).length,1);`);
});

test('a living prince petitions on his fortieth birthday, including an unanswered nomination from an older save',()=>{
 const game=princeWorld(39);game.run(`prince.born=S.turn-40*12+1;openPrinceEstate(prince);
 prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 var son={id:'forty-son',name:'景宁',sex:'m',born:S.turn-9*12,alive:true,mother:prince.spouse.id,father:prince.id};
 ensureMarriedLife(prince).children.push(son);prince.princeEstate.succession={nominated:son.id};
 assert.match(princeSuccessionPanel(prince),/年满四十/);assert.doesNotMatch(princeSuccessionPanel(prince),/批阅请封世子/);
 A.princeReviewSuccession(prince.id);assert.equal(modalOpen,false);var notes=S.log.length;
 assert.equal(princeSuccessionTick(),null);assert.equal(S.log.length,notes);
 prince.princeEstate.succession.nominated=son.id;S.turn++;
 assert.match(princeSuccessionTick().text,/请封世子/);assert.equal(princeSuccessionTick(),null);assert.match(princeSuccessionPanel(prince),/批阅请封世子/);
 A.princeReviewSuccession(prince.id);choose(0);drain();assert.equal(princeHeir(prince),son);`);
});

test('an old review opened before forty replays and is then withdrawn without appointing an heir',()=>{
 const game=princeWorld(40);game.run(`openPrinceEstate(prince);prince.married=true;prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 ensureMarriedLife(prince).children.push({id:'prior-son',name:'景明',sex:'m',alive:true,born:S.turn-9*12,mother:prince.spouse.id,father:prince.id});
 PalaceActions.reset();A.princeReviewSuccession(prince.id);save('1');`);
 const key='chengongji_v1_1',data=JSON.parse(game.storage.get(key)),journal=data.pendingActions;
 journal.version=129;for(const snapshot of [data,journal.base])snapshot.children.find(c=>c.name==='承安').born+=12;
 game.storage.set(key,JSON.stringify(data));const resumed=boot(12,game.storage);resumed.ctx.assert=assert;resumed.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
 assert.equal(modalOpen,false);assert.equal(princeHeir(S.children.find(c=>c.name==='承安')),undefined);`);
});

test('a younger prince keeps a previously confirmed heir and must wait until forty to replace him by adoption',()=>{
 const game=princeWorld(39);game.run(`prince.born=S.turn-40*12+1;openPrinceEstate(prince);prince.married=true;
 prince.spouse={...marriageCandidate(prince,'scholar'),marriedAt:0};
 var first={id:'earlier-heir',name:'景和',sex:'m',alive:true,born:S.turn-9*12,hp:90,mother:prince.spouse.id,father:prince.id};
 ensureMarriedLife(prince).children.push(first);prince.princeEstate.succession={heir:first.id};
 assert.equal(princeSuccessionTick(),null);assert.equal(princeHeir(prince),first);
 var brother=makeKid(a,'m','承宁');brother.born=S.turn-32*12;brother.pendingName=false;openPrinceEstate(brother);brother.married=true;
 brother.spouse={...marriageCandidate(brother,'scholar'),marriedAt:0};var nephew={...first,id:'nephew',name:'景明',father:brother.id,mother:brother.spouse.id};
 ensureMarriedLife(brother).children.push(nephew);first.hp=0;
 assert.match(princeSuccessionTick().text,/待王爷年满四十/);assert.doesNotMatch(princeSuccessionPanel(prince),/批阅过继/);
 A.princeReviewAdoption(prince.id);assert.equal(modalOpen,false);S.turn++;
 assert.match(princeSuccessionTick().text,/议请过继/);assert.equal(princeSuccessionTick(),null);
 A.princeReviewAdoption(prince.id);choose(0);drain();assert.equal(princeHeir(prince),nephew);`);
});
