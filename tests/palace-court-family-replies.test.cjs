const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {world}=require('./court-family-browser-fixtures.cjs');

test('one father’s verified report reaches his daughters separately, reflecting their own ties and circumstances',()=>{
 const game=world();game.ctx.assert=assert;
 game.run(`var sister=makeKin(a,'亲');addConsort(sister,3,'姐妹入宫');delete sister.solitary;
   sister.trait='骄矜';sister.cold=true;a.trait='温婉';a.preg=5;
   var e=officialEntry(a.id+':father'),p=e.p;a.fatherLetters={father:p.id,closeness:65};
   sister.fatherLetters={father:p.id,closeness:-40};
   var before=S.log.length;officialFamilyReaction(e,'success','清理漕册','漕粮数核清，三处积案已销。');
   var n=courtFamilyPending(a)[0],other=courtFamilyPending(sister)[0];
   assert.equal(n.officialId,p.id);assert.equal(other.officialId,p.id);assert.notEqual(n.id,other.id);
   assert.equal(courtFamilyPending(b).length,0);
   assert.match(n.reaction,/榻上.*小时候.*吃顿饭/);
   assert.match(other.reaction,/冷宫.*规规矩矩.*功簿/);
   assert.equal(courtFamilyReplyEvent(sister,other),null);
   assert.ok(a.story.find(x=>x.occasion==='court-family:'+n.id+':incoming').t.includes('三处积案已销'));
   assert.ok(p.story.find(x=>x.occasion==='court-family:'+n.id+':incoming').t.includes(fullName(a)));
   assert.equal(S.log.length,before);
   officialFamilyReaction(e,'success','清理漕册','漕粮数核清，三处积案已销。');
   assert.equal(courtFamilyPending(a).length,1);assert.equal(courtFamilyPending(sister).length,1);`);
});

test('a brother receives a letter after his real commission, and both sides keep distinct linked accounts after reload',()=>{
 let game=world();game.ctx.assert=assert;
 game.run(`var e=officialEntry(b.id+':brother');e.p.away=true;e.p.temperament='谨慎';
   relAdd(b,e.p,43);assignOfficialTask(e,'water');e.p.commission.outcome='success';S.turn=e.p.commission.due;officialTaskTick();
   var n=courtFamilyPending(b)[0],c=b,official=e.p;
   assert.match(n.fact,/疏通农渠/);assert.equal(n.kin,officialKinLabel(e.h,e.role,b));assert.match(n.reaction,/小名/);
   A.go('consort',b.id);assert.match(viewConsort(),/听她谈前朝家书/);
   A.courtFamilyReply(b.id,n.id);assert.equal(curEv.title,'前朝家书 · 任上报捷');save('1');`);
 game=boot(831,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'前朝家书 · 任上报捷');
   var c=S.consorts.find(c=>fullName(c)==='许清容'),n=courtFamilyPending(c)[0],p=courtFamilyOfficial(c,n),energy=E().energy;
   choose(0);drain();assert.equal(E().energy,energy-1);assert.equal(n.due,S.turn+2);
   assert.equal(n.status,'sent');assert.equal(courtFamilyPending(c).length,0);
   assert.equal(continuityThreads(c).find(t=>t.officialId===p.id).stage,'ended');
   S.turn++;courtFamilyReplyTick();assert.ok(!p.story.some(x=>x.occasion==='court-family:'+n.id+':reply'));
   S.turn++;courtFamilyReplyTick();assert.equal(n.status,'delivered');assert.equal(relGet(c,p),47);
   var left=c.story.find(x=>x.occasion==='court-family:'+n.id+':reply'),right=p.story.find(x=>x.occasion===left.occasion);
   assert.match(left.t,/回信.*反倒多心/);assert.match(right.t,/读过许清容的家书/);assert.equal(left.thread,right.thread);
   courtFamilyReplyTick();assert.equal(p.story.filter(x=>x.occasion===left.occasion).length,1);
   assert.ok(!S.log.some(x=>x.t.includes('手头的事')||x.t.includes('反倒多心')));`);
});

test('an open relief impeachment gives only the known facts and a second letter distinguishes a real verdict',()=>{
 for(const guilty of [false,true]){
  const game=world();game.ctx.assert=assert;
  game.run(`a.favor=20;a.trait='持重';var p=houseOf(a).father,power=a.fam.p;
    a.fatherLetters={father:p.id,closeness:-25};p.daughterLetterNature='demanding';
    S.flags.impeachmentSeen=true;S.flags.monthlyCourt={gen:S.gen,turn:S.turn,index:IMPEACHMENT_INDEX,person:a.id,
      impeachment:{person:a.id,matching:false,guilty:${guilty}}};
    A.court();choose(curEv.choices.findIndex(c=>c.t.includes('封存账册')));drain();
    var waiting=courtFamilyPending(a)[0];assert.equal(waiting.kind,'pending');assert.equal(p.dismissed,undefined);
    assert.match(waiting.reaction,/少有召见.*规规矩矩.*风闻、证词、原簿/);
    assert.doesNotMatch(waiting.fact,/证实|私账|得还清白/);assert.equal(a.fam.p,power);
    S.turn++;S.month++;E().energy=10;a.cold=${guilty};
    A.court();assert.match(curEv.title,/查账回奏/);var mood=a.mood;choose(0);drain();
    var decided=courtFamilyPending(a)[0];assert.equal(decided.kind,${JSON.stringify(guilty?'proven':'cleared')});
    assert.equal(waiting.status,'updated');assert.equal(decided.caseKey,waiting.caseKey);
    assert.equal(!!p.dismissed,${guilty});assert.equal(a.mood,mood-(${guilty}?30:0));
    assert.ok(p.story.some(s=>s.occasion==='court-family:'+decided.id+':incoming'));
    if(${guilty}){assert.match(decided.reaction,/冷宫/);assert.equal(courtFamilyReplyEvent(a,decided),null);a.cold=false;}
    A.courtFamilyReply(a.id,decided.id);choose(0);drain();S.turn=decided.due;courtFamilyReplyTick();
    assert.equal(a.fatherLetters.closeness,-27);assert.match(a.story.at(-1).t,/多想些门路/);`);
 }
});

test('a closed accusation is not treated as proved and a deceased brother cannot send a reply',()=>{
 const game=world();game.ctx.assert=assert;
 game.run(`var target=officialEntry(b.id+':brother'),actor=officialEntry(a.id+':father');setupJyw();
   var pair={key:rk(a,b),rel:-50,cause:'palace-foe'},cast={x:actor,y:target,lapse:null};
   var ev=kinCourtImpeachEvent(pair,cast);ev.choices.find(c=>c.t.includes('锦衣卫')).f();
   var item=palaceCases().find(x=>x.kind==='rumor'),n=courtFamilyPending(b)[0];
   assert.equal(n.kind,'pending');rumorReport(item,false);
   assert.equal(courtFamilyPending(b)[0],n);assert.ok(!b.courtFamilyNews.some(x=>x.kind==='cleared'));
   A.courtFamilyReply(b.id,n.id);choose(0);drain();target.p.alive=false;
   S.turn=n.due;courtFamilyReplyTick();assert.equal(n.status,'returned');assert.match(b.story.at(-1).t,/报了讣音/);
   assert.ok(!target.p.story.some(s=>s.t.startsWith('【前朝家书有回音】')));`);
});
