const {test}=require('node:test'),assert=require('node:assert/strict');
const {world:base}=require('./official-marriage-world.cjs'),{boot}=require('./playtest-harness.cjs');

function world(willing=true){
  const w=base();w.ctx.assert=assert;
  w.run(`officialMarriageConfirm(ref,br,agree(ref,br));sister.willing=${willing};sister.trait='活泼';var wifeId=sister.id,hostId=other.id;PalaceActions.reset();`);
  return w;
}

function askToEnter(w){
  w.run(`Math.random=()=>0;A.marriedSisterVisit(hostId,wifeId);Math.random=()=>.99;choose(0);drain();S.turn++;
    A.marriedSisterVisit(hostId,wifeId);choose(0);drain();S.turn++;
    A.marriedSisterVisit(hostId,wifeId);choose(0);nextEv();assert.equal(curEv.title,'她问能否留下');`);
}

test('an adult marked married in the old household can open the visible private visit before the spouse is filled in',()=>{
 const w=base();w.ctx.assert=assert;
 w.run(`sister.married=true;sister.willing=true;sister.visit={host:other.id,from:S.turn,until:S.turn+2};
   UI.sel=other.id+':'+sister.id;var panel=viewNatalRelative();
   assert.ok(panel.includes('<h3>私下求见</h3>'));assert.match(panel,/在宫中私下求见/);assert.equal(sister.spouse,undefined);
   PalaceActions.reset();A.marriedSisterVisit(other.id,sister.id);
   assert.match(curEv.title,/私下求见/);assert.match(curEv.text,/偏厅/);assert.equal(sister.spouse.id,'spouse:'+sister.id);`);
 const reloaded=boot(17,w.storage);reloaded.ctx.assert=assert;
 reloaded.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/私下求见/);`);
});

test('an adult married sister can be approached at home or through her palace visit',()=>{
  const w=world();w.run(`assert.match(marriedSisterVisitButton(other,sister),/到她的住所求见/);var energy=E().energy;Math.random=()=>0;A.marriedSisterVisit(hostId,wifeId);assert.match(curEv.text,/平日所住/);assert.match(curEv.text,/吃了一惊/);assert.match(curEv.choices[0].t,/私下承宠/);choose(1);assert.equal(E().energy,energy);assert.equal(sister.natalPregnancy,undefined);assert.equal(sister.marriedSisterAffair.meetings,0);
    sister.visit={host:hostId,from:S.turn,until:S.turn+2};assert.match(marriedSisterVisitButton(other,sister),/在宫中私下求见/);A.natalMeet(hostId,wifeId);option('请她到偏厅');assert.match(curEv.text,new RegExp(other.palace));Math.random=()=>.99;choose(0);drain();assert.equal(sister.marriedSisterAffair.meetings,1);assert.match(sister.story.at(-1).t,/私下承宠.*偏厅/);assert.equal(E().energy,energy-1);assert.match(marriedSisterVisitButton(other,sister),/disabled/);S.turn++;sister.born=S.turn-17*12;assert.equal(marriedSisterVisitButton(other,sister),'');`);
});

test('refusal stays refusal and coercion has consequences while withdrawing remains available',()=>{
  const w=world(false);w.run(`var energy=E().energy,prestige=E().prestige;A.marriedSisterVisit(hostId,wifeId);assert.match(curEv.text,/不愿/);choose(0);assert.equal(curEv.title,'她已拒绝');choose(0);assert.equal(E().energy,energy);assert.equal(sister.marriedSisterAffair.coerced,undefined);
    A.marriedSisterVisit(hostId,wifeId);choose(0);Math.random=()=>.99;choose(1);assert.equal(sister.marriedSisterAffair.meetings,0);assert.equal(sister.marriedSisterAffair.coerced,true);assert.equal(E().prestige,prestige-8);assert.equal(E().energy,energy-1);assert.match(sister.story.at(-1).t,/已明言拒绝/);drain();S.turn++;assert.equal(marriedSisterEncounter(other,sister),null);`);
});

test('a private pregnancy leaves an uncertain child and the husband only suspects on the low roll',()=>{
  const w=world();w.run(`var prior=h.brother.story.length,courtChildren=S.children.length;Math.random=()=>0;A.marriedSisterVisit(hostId,wifeId);choose(0);drain();var pregnancy=sister.natalPregnancy;assert.ok(pregnancy.unconfirmed);assert.equal(h.brother.story.length,prior);
    S.turn+=2;natalPregnancyTick();assert.ok(pregnancy.husbandSuspects);assert.match(h.brother.story.at(-1).t,/疑惑/);assert.match(sister.story.at(-1).t,/丈夫问/);var count=h.brother.story.length;natalPregnancyTick();assert.equal(h.brother.story.length,count);
    pregnancy.difficult=false;S.turn=pregnancy.due;natalPregnancyTick();var baby=oh.relatives.find(p=>p.parentRelativeId===sister.id);assert.ok(baby.unconfirmedParentage);assert.equal(baby.fatherId,h.brother.id);assert.equal(S.children.length,courtChildren);assert.match(sister.story.at(-1).t,/亲自过问乳母/);assert.match(natalFatherPanel(baby),/身世未明/);
    UI.view='family';A.familyTreeToggle(hostId,sister.id);var marker='data-family-child-id="'+baby.id+'"';assert.ok(familyHouseTree(other).includes(marker));A.familyTreeToggle(c.id,h.brother.id);assert.ok(familyHouseTree(c).includes(marker));assert.equal(natalEntry(hostId,baby.id).p,natalEntry(c.id,baby.id).p);`);
});

test('declining or heeding the dowager preserves the marriage; the sister remembers and is hurt',()=>{
  const w=world();askToEnter(w);w.run(`var mood=sister.mood??65;choose(1);assert.ok(sister.married);assert.ok(sister.mood<mood);assert.match(sister.story.at(-1).t,/求入宫未允/);drain();S.turn+=12;A.marriedSisterVisit(hostId,wifeId);choose(0);nextEv();choose(0);assert.equal(curEv.title,'慈宁宫劝止');assert.match(other.story.at(-1).t,/惊闻/);choose(0);assert.ok(sister.married);assert.ok(h.brother.married);assert.match(sister.story.at(-1).t,/作罢/);`);
});

test('overriding the dowager ends one marriage, angers senior consorts and replays without repeating penalties',()=>{
  let w=world();w.run(`var q=makeGirl({sur:'陆',given:'静姝',age:29,trait:'骄矜'});addConsort(q,8,'册后');var senior=makeGirl({sur:'谢',given:'明徽',age:25,trait:'持重'});addConsort(senior,6,'入宫');var ceremony=sister.officialMarriageId,queenId=q.id,seniorId=senior.id;PalaceActions.reset();`);
  askToEnter(w);w.run(`choose(0);assert.equal(curEv.title,'慈宁宫劝止');`);
  const id=w.run('wifeId'),host=w.run('hostId'),queen=w.run('queenId'),senior=w.run('seniorId');
  w=boot(134,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'慈宁宫劝止');var host=byId(${host}),sister=houseOf(host).relatives.find(p=>p.id===${id}),husband=maritalFather(sister,null).p,marriage=officialMarriageRecord(sister.officialMarriageId),prestige=E().prestige;choose(1);var g=byId(${id});assert.ok(g);assert.equal(sister.married,false);assert.equal(husband.married,false);assert.equal(marriage.ended.turn,S.turn);assert.equal(E().prestige,prestige-27);assert.ok(relGet(byId(${queen}),g)<-25);assert.ok(relGet(byId(${senior}),g)<-25);assert.match(S.flags.dowager.story.at(-1).t,/劝止/);`);
  const prestige=w.run('E().prestige');w=boot(310,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(E().prestige,${prestige});assert.equal(S.consorts.filter(c=>c.id===${id}).length,1);`);
});
