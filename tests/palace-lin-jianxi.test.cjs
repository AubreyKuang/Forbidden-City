const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function game(storage){
 const b=boot(204,storage);
 b.ctx.assert=assert;
 if(storage)b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);
 else b.run(`A.start();drain();S.turn=120;E().energy=10;E().sur='萧';PalaceActions.reset();`);
 return b;
}
function setupPrincess(b,disposition='好奇'){
 b.run(`var k=makeKid(harem()[0],'f','昭宁');k.pendingName=false;k.born=S.turn-18*12;
  k.hp=100;k.temperament='${disposition}';k.away=false;var kidId=k.id;PalaceActions.reset();`);
}
function openHeart(b){
 b.run(`A.linJianxiHeart(kidId);assert.match(curEv.title,/皇嗣心事/);choose(0);drain();`);
}
function advance(b,months=3){
 b.run(`S.turn+=${months};E().energy=10;PalaceActions.reset();`);
}
function visit(b,option=0){
 b.run(`A.linJianxiVisit(kidId);assert.ok(modalOpen);choose(${option});drain();`);
}
function setupCourtship(b){
 setupPrincess(b);
 b.run(`var p=createFenghuaPerson('linJianxi');PalaceActions.reset();`);
 openHeart(b);visit(b);advance(b);visit(b);advance(b);visit(b);
}

test('find Lin on a real city outing, replay the encounter, and visit him without a princess',()=>{
 let b=game();
 b.run(`for(const key of Object.keys(FENGHUA_PEOPLE))if(key!=='linJianxi')fenghuaState().attempts[key]=S.turn;
  PalaceActions.reset();assert.match(fenghuaCodex(),/林见溪/);`);
 b.force(0,0);
 b.run(`A.out('city');assert.equal(curEv.title,'林见溪 · 竹径拾纸');assert.equal(E().energy,9);save('auto');`);
 b=game(b.storage);
 b.run(`assert.match(curEv.text,/哪一张是你最想留的/);choose(0);drain();
  const p=linJianxiPerson();assert.equal(createFenghuaPerson('linJianxi'),p);assert.equal(portraitCell(p),501);
  assert.match(porImg(p,200),/palace-lin-jianxi.webp/);assert.equal(S.children.length,0);
  A.fenghuaVisit('linJianxi');assert.match(curEv.title,/竹下清坐/);choose(1);drain();
  A.fenghuaVisit('linJianxi');assert.equal(modalOpen,false);assert.equal(E().energy,8);`);
});

for(const [mode,fan,reply,first,future] of [
 [0,'route','wait',/带来画清了岔路/,/等到公主自己答完/],
 [1,'sketch','help',/从扇匣取出/,/朝这边望过来/]
]){
 test('courtship remembers '+fan+' and '+reply+' across reloads and respects shared cooldowns',()=>{
  let b=game();setupPrincess(b,mode===0?'好奇':'内敛');
  b.run(`var p=createFenghuaPerson('linJianxi');PalaceActions.reset();assert.match(youthPanel(k),/听她说起林见溪/);`);
  openHeart(b);
  b.run(`assert.ok(!p.story.some(s=>s.t.includes('想见林见溪')));
   A.linJianxiVisit(kidId);assert.match(curEv.title,/扇上山水/);assert.equal(E().energy,9);save('auto');`);
  b=game(b.storage);
  b.run(`var k=S.children[0],p=linJianxiPerson(),kidId=k.id;
   assert.match(curEv.title,/扇上山水/);choose(0);assert.ok(modalResult);save('auto');`);
  b=game(b.storage);
  b.run(`var k=S.children[0],p=linJianxiPerson(),kidId=k.id;assert.ok(modalResult);drain();
   assert.equal(k.linJianxi.fan,'${fan}');
   assert.ok(k.story.some(s=>s.event?.title==='扇上山水'));assert.ok(p.story.some(s=>s.event?.title==='扇上山水'));
   A.linJianxiVisit(kidId);assert.equal(modalOpen,false);assert.equal(E().energy,9);`);
  advance(b,2);
  b.run(`A.fenghuaVisit('linJianxi');assert.equal(modalOpen,false);assert.equal(E().energy,10);`);
  advance(b,1);
  b.run(`k.away=true;A.linJianxiVisit(kidId);assert.equal(E().energy,10);
   assert.match(youthPanel(k),/待两人方便/);k.away=false;PalaceActions.reset();
   A.linJianxiVisit(kidId);assert.match(curEv.text,${first});choose(${mode});drain();
   assert.equal(k.linJianxi.reply,'${reply}');`);
  advance(b);
  b.run(`A.linJianxiVisit(kidId);assert.match(curEv.text,${future});
   choose(1);drain();assert.equal(k.linJianxi.phase,'friends');assert.equal(p.fenghua.matchId,undefined);
   assert.equal(linJianxiProposalReady(k),false);assert.equal(k.spouse,undefined);`);
 });
}

test('the agreement in the normal marriage menu creates a real household and unlocks one walk at the estate',()=>{
 let b=game();setupCourtship(b);
 b.run(`A.openPrincess(kidId);choose(0);drain();assert.ok(k.estate);
  A.go('princess',k.id);assert.match(viewPrincessEstate(),/听林见溪的求亲回话/);
  A.kidMarriage(kidId);choose(curEv.choices.findIndex(x=>x.t==='听林见溪的求亲回话'));
  assert.match(curEv.title,/山水有约/);choose(1);drain();
  assert.equal(k.married,false);assert.equal(linJianxiProposalReady(k),false);`);
 advance(b);
 b.run(`A.linJianxiProposal(kidId);choose(0);assert.ok(modalResult);save('auto');`);
 b=game(b.storage);
 b.run(`var k=S.children[0],p=linJianxiPerson(),kidId=k.id;assert.ok(modalResult);drain();
  assert.ok(k.married&&p.married&&k.household);assert.equal(k.spouse.id,p.id);
  assert.equal(p.royalSpouseId,k.id);assert.equal(k.estate.route,'scholar');
  assert.equal(portraitCell(spouseAppearance(k)),501);assert.match(marriagePanel(k),/驸马 · 林见溪/);
  assert.ok(k.story.some(s=>s.t.includes('竹林贤客，两情相悦')));
  assert.equal(linJianxiWalkReady(k,p),false);`);
 advance(b);
 b.run(`A.go('princess',k.id);assert.match(viewPrincessEstate(),/听听溪桥家常/);
  A.linJianxiWalk(kidId);choose(1);drain();assert.equal(k.linJianxi.walked,'bank');
  assert.ok(k.story.some(s=>s.event?.title==='溪桥家常'));assert.ok(p.story.some(s=>s.event?.title==='溪桥家常'));
  assert.equal(linJianxiWalkReady(k,p),false);`);
});

test('another betrothal invalidates a pending proposal and releases the pair',()=>{
 const b=game();setupCourtship(b);
 b.run(`A.linJianxiProposal(kidId);assert.match(curEv.title,/山水有约/);
  k.betrothal={kind:'xiean',personId:776};choose(0);assert.equal(k.spouse,undefined);
  assert.equal(k.linJianxi.phase,'closed');assert.equal(p.fenghua.matchId,undefined);`);
});

test('the heart can wait or decline without spending energy or starting a shared story',()=>{
 const b=game();setupPrincess(b,'内敛');
 b.run(`var p=createFenghuaPerson('linJianxi');k.born=S.turn-14*12;assert.doesNotMatch(youthPanel(k),/听她说起林见溪/);
  k.born=S.turn-18*12;E().energy=9;PalaceActions.reset();A.linJianxiHeart(kidId);choose(1);drain();
  assert.equal(k.linJianxi.phase,'considering');assert.equal(p.fenghua.matchId,undefined);assert.equal(p.story.length,1);
  assert.equal(E().energy,9);assert.doesNotMatch(youthPanel(k),/听她说起林见溪/);`);
 advance(b);
 b.run(`A.linJianxiHeart(kidId);choose(2);drain();assert.equal(k.linJianxi.phase,'friends');assert.equal(p.story.length,1);`);
});

test('an actual v69 city encounter replays its original guest before Lin enters the pool',()=>{
 const legacy=require('./fixtures/lin-jianxi-legacy-city-v69.json');
 const b=game(new Map([['chengongji_v1_auto',JSON.stringify(legacy)]]));
 b.run(`assert.equal(PalaceActions.contentVersion,69);assert.equal(curEv.title,'嵇叔夜 · 初识');
  assert.doesNotMatch(fenghuaCodex(),/林见溪/);choose(0);drain();
  assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);
  assert.ok(fenghuaPerson('jiShuye'));assert.equal(linJianxiPerson(),undefined);
  assert.match(fenghuaCodex(),/林见溪/);`);
});

test('three special visits work without a princess and keep a single portrait and identity',()=>{
 let b=game();
 b.run(`createFenghuaPerson('linJianxi');A.fenghuaVisit('linJianxi');choose(0);drain();`);
 for(const title of ['借的是书','扇上不题名','风里有回声']){
  advance(b);
  b.run(`A.fenghuaVisit('linJianxi');assert.match(curEv.title,/${title}/);save('auto');`);
  b=game(b.storage);
  b.run(`choose(0);drain();assert.ok(linJianxiPerson().story.some(s=>s.event?.title==='${title}'));`);
 }
 advance(b);
 b.run(`A.fenghuaVisit('linJianxi');assert.match(curEv.title,/竹下清坐/);choose(0);drain();`);
});

test('all eight dispositions leave specific memories in his own proposal',()=>{
 const b=game();
 setupPrincess(b);
 b.run(`var p=createFenghuaPerson('linJianxi');A.linJianxiHeart(k.id);choose(0);drain();
  A.linJianxiVisit(k.id);choose(0);drain();`);
 advance(b);visit(b);advance(b);
 b.run(`for(const [temperament,[memory,text]] of Object.entries(LIN_JIANXI_PASTIMES)){
  k.temperament=temperament;const scene=linJianxiVisit(p,k);assert.ok(scene.text.includes(text));scene.choices[0].f();
  assert.ok(linJianxiProposalEvent(k).text.includes(memory));k.linJianxi.phase='return';
 }`);
 b.run(`A.linJianxiVisit(k.id);choose(1);drain();
  assert.doesNotMatch(youthPanel(k),/读林见溪的画笺/);`);
 advance(b);
 b.run(`A.linJianxiFriend(k.id);assert.match(curEv.title,/旧图知音/);choose(0);drain();
  assert.equal(k.linJianxi.phase,'friends');assert.ok(k.story.some(s=>s.event?.title==='旧图知音'));
  A.linJianxiFriend(k.id);assert.equal(modalOpen,false);`);
});

test('married chapters remember her choice and require a present child for the family branch',()=>{
 let b=game();setupCourtship(b);
 b.run(`A.openPrincess(k.id);choose(0);drain();A.linJianxiProposal(k.id);choose(0);drain();`);
 advance(b);
 b.run(`A.linJianxiWalk(k.id);choose(1);drain();A.linJianxiHome(k.id);assert.equal(modalOpen,false);`);
 advance(b);
 b.run(`A.linJianxiHome(k.id);assert.match(curEv.title,/竹门有灯/);choose(1);drain();`);
 advance(b,6);
 b.run(`A.linJianxiHome(k.id);assert.match(curEv.title,/竹径归来/);assert.match(curEv.text,/桥边竹荫下喝茶.*静坐/);
  choose(0);drain();assert.ok(startHouseholdPregnancy(k,k.spouse));`);
 advance(b,9);
 b.run(`var child=deliverHouseholdChild(k,k.household.pregnancies[0]);assert.ok(child);
  A.linJianxiHome(k.id);assert.equal(modalOpen,false);`);
 advance(b,48);
 b.run(`A.linJianxiHome(k.id);assert.match(curEv.title,/小儿问水/);save('auto');`);
 b=game(b.storage);
 b.run(`assert.match(curEv.title,/小儿问水/);choose(0);drain();assert.equal(S.children[0].linJianxi.childStory,true);`);
});
