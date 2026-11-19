const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {world}=require('./court-family-browser-fixtures.cjs');

function family(){
 const game=world();game.ctx.assert=assert;game.run(`
  var c=b, h=houseOf(c), father=h.father, brother=officialEntry(c.id+':brother').p;
  father.temperament='谨慎';father.away=false;father.office=father.post='兵部尚书';father.age=58;
  brother.temperament='进取';brother.office=brother.post='户部侍郎';brother.away=false;
  c.fatherLetters={father:father.id,gen:S.gen,purse:2,lastAccrual:S.turn,closeness:-20,serial:0};
  relAdd(c,brother,70-relGet(c,brother));c.hp=90;c.rank=3;c.title='安';
 `);return game;
}

test('promotion letters from a reserved father and a close brother preserve each reaction, and distant mail takes time',()=>{
 let game=family();game.run(`brother.away=true;A.promote(c.id);choose(0);drain();
  var f=c.palaceKinNews.find(x=>x.officialId===father.id),n=c.palaceKinNews.find(x=>x.officialId===brother.id);
  assert.equal(f.kind,'promoted');assert.equal(f.letter,'received');assert.match(f.quote,/改在自家用饭.*照这样的家书往来/);
  assert.equal(n.kind,'promoted');assert.equal(n.letter,'sent');assert.match(n.quote,/点了香告祖.*得空就写给家里/);
  assert.ok(father.story.some(e=>e.occasion==='court-family:'+f.id+':received'));
  assert.ok(!c.story.some(e=>e.thread==='court-family:'+n.id));save('1');`);
 game=boot(102,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var c=S.consorts.find(c=>fullName(c)==='许清容'),n=c.palaceKinNews.find(x=>x.letter==='sent'),p=courtFamilyOfficial(c,n);
  S.turn++;S.month++;palaceKinMailTick();palaceKinMailTick();
  assert.equal(n.letter,'received');var recipient=c.story.find(e=>e.occasion==='court-family:'+n.id+':received');
  var sender=p.story.find(e=>e.occasion===recipient.occasion);
  assert.match(recipient.t,/笑着同随侍说起/);assert.match(sender.t,/家书递达/);assert.notEqual(sender.t,recipient.t);
  assert.equal(p.story.filter(e=>e.occasion===recipient.occasion).length,1);`);
});
test('fading favor draws quiet inquiries rather than a petition and messages follow a real threshold crossing',()=>{
 const game=family();game.run(`c.trait='持重';c.favor=26;var previous=JSON.parse(JSON.stringify(S));
  c.favor=24;courtFamilyLifeTick(previous);courtFamilyLifeTick(previous);
  var n=c.palaceKinNews.find(x=>x.officialId===father.id);
  assert.equal(n.kind,'neglected');assert.match(n.quote,/吃得如何，夜里睡不睡得安稳/);
  assert.ok(brother.story.some(s=>s.t.includes('写下一串名字')));
  assert.equal(c.story.filter(s=>s.occasion==='court-family:'+n.id+':received').length,1);
  assert.equal(palaceKinPetitionRows().length,0);assert.match(palaceKinLettersPanel(c),/宫中少见/);`);
});
test('a serving brother submits one personal petition, the court can grant winter supplies and care, and both parties learn the result',()=>{
 let game=family();game.run(`father.temperament='进取';c.fatherLetters.closeness=38;
  A.cold(c.id);choose(0);drain();assert.equal(palaceKinPetitionRows().length,0);
  var n=c.palaceKinNews.find(x=>x.petition);assert.equal(n.officialId,brother.id);
  assert.ok(!c.story.some(e=>e.occasion==='court-family:'+n.id+':filed'));
  S.turn++;S.month++;palaceKinMailTick();assert.match(viewGovernment(),/外家陈情/);
  A.palaceKinPetition(n.id);assert.match(curEv.text,new RegExp(brother.name+'为'));save('1');`);
 game=boot(350,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/外家陈情/);
  var {c,n,p}=palaceKinPetitionRows()[0];c.hp=40;var mood=c.mood;
  choose(0);drain();assert.equal(n.petition.decision,'care');assert.ok(c.cold);assert.equal(c.hp,44);assert.equal(c.mood,Math.min(100,mood+5));
  var written=p.story.find(x=>x.occasion==='court-family:'+n.id+':ruling'),received=c.story.find(x=>x.occasion===written.occasion);
  assert.match(written.t,/太医已按症诊看/);assert.match(received.t,/接过衣物/);
  assert.equal(palaceKinPetitionRows().length,0);`);
});
test('a proved offence only permits care, and release invalidates any still-pending request',()=>{
 const game=family();game.run(`var previous=JSON.parse(JSON.stringify(S));
  punishEv(c,a,'石阶泼油').choices[0].f();courtFamilyLifeTick(previous);
  var n=c.palaceKinNews.find(x=>x.petition);assert.equal(n.petition.cause.crime,'石阶泼油');
  assert.match(n.quote,/查实.*不能说她无辜/);S.turn++;S.month++;palaceKinMailTick();
  var ev=palaceKinPetitionEvent(c,n,brother);assert.ok(ev.valid());assert.match(ev.text,/经查属实/);
  assert.ok(!ev.choices.some(o=>o.t.includes('准出冷宫')));
  A.uncold(c.id);assert.equal(palaceKinPetitionRows().length,0);assert.equal(ev.choices[0].f(),null);
  assert.equal(n.petition.decision,undefined);`);
});

test('a neglected woman reassures a distant father, confides in her brother, and each hears only what she actually sent',()=>{
 let game=family();game.run(`c.trait='持重';c.favor=26;brother.away=true;
  var old=JSON.parse(JSON.stringify(S));c.favor=24;courtFamilyLifeTick(old);
  var f=c.palaceKinNews.find(n=>n.officialId===father.id),b=c.palaceKinNews.find(n=>n.officialId===brother.id);
  assert.equal(palaceKinResponseReady(c,b,'letter'),false);
  A.palaceKinResponse(c.id,f.id,'letter');assert.equal(curEv.title,'回信 · 宫中少见');
  assert.match(curEv.text,/起居照常，你们且安心/);assert.doesNotMatch(curEv.text,/睡不安稳/);
  choose(0);drain();assert.equal(f.responses.letter.mode,'peace');
  S.turn++;S.month++;palaceKinMailTick();
  assert.match(father.story.at(-1).t,/平安二字看了两遍/);
  assert.ok(!brother.story.some(e=>e.t.includes('收到宫中家书')));
  A.palaceKinResponse(c.id,b.id,'letter');assert.match(curEv.text,/夜里确有几回睡不安稳/);save('1');`);
 game=boot(129,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var c=S.consorts.find(c=>fullName(c)==='许清容'),n=c.palaceKinNews.find(n=>n.letter==='received'&&!n.responses),p=courtFamilyOfficial(c,n);
  choose(0);drain();assert.equal(n.responses.letter.mode,'open');assert.equal(n.responses.letter.status,'sent');
  S.turn++;palaceKinMailTick();assert.equal(n.responses.letter.status,'sent');
  S.turn++;palaceKinMailTick();palaceKinMailTick();assert.equal(n.responses.letter.status,'delivered');
  var note=c.story.find(s=>s.occasion==='court-family:'+n.id+':letter-delivered');
  assert.match(note.t,/后来|已经读过信/);assert.match(p.story.find(s=>s.occasion===note.occasion).t,/睡不安稳.*先问清能照应/);
  assert.equal(c.story.filter(s=>s.occasion===note.occasion).length,1);
  A.palaceKinResponse(c.id,n.id,'letter');assert.equal(modalOpen,false);`);
});

for(const [trait,mode] of [['活泼','thanks'],['持重','caution']])test('the same brother’s petition draws a distinct reply when she is '+trait,()=>{
 const game=family();game.run(`c.trait='${trait}';A.cold(c.id);choose(0);drain();
  assert.ok(c.cold);assert.equal(palaceKinCommoner(c),false);assert.doesNotMatch(cName(c),/庶人/);
  S.turn++;S.month++;palaceKinMailTick();
  var n=c.palaceKinNews.find(n=>n.petition);
  assert.equal(palaceKinResponseReady(c,n,'petition'),false);
  A.palaceKinPetition(n.id);choose(0);drain();
  assert.ok(palaceKinResponseReady(c,n,'petition'));
  A.palaceKinResponse(c.id,n.id,'petition');assert.match(curEv.text,/衣物，我已经收到了/);choose(0);drain();
  assert.equal(n.responses.petition.mode,'${mode}');
  S.turn++;palaceKinMailTick();var pair='court-family:'+n.id+':petition-delivered';
  assert.match(brother.story.find(s=>s.occasion===pair).t,${mode==='thanks'?'/折尾的名字/':'/再递一折.*收回匣里/'});
  assert.ok(c.story.some(s=>s.occasion===pair));assert.ok(palaceKinResponseReady(c,n,'letter'));
  assert.equal(palaceKinResponseReady(c,n,'petition'),false);`);
});

for(const outcome of ['commoner','expelled'])test('an in-flight reply, old reply options, and new correspondence are shut off when she is '+outcome,()=>{
 const game=family();game.run(`c.trait='持重';c.favor=26;
  var old=JSON.parse(JSON.stringify(S));c.favor=24;courtFamilyLifeTick(old);
  var n=c.palaceKinNews.find(n=>n.officialId===father.id),other=c.palaceKinNews.find(n=>n.officialId===brother.id);
  A.palaceKinResponse(c.id,n.id,'letter');choose(0);drain();
  var stale=palaceKinResponseEvent(c,other,'letter');
  ${outcome==='commoner'?"q.rank=6;c.rank=8;A.depose(c.id);choose(1);":"A.away(c.id);choose(0);"}
  drain();assert.equal(n.responses.letter.status,'returned');assert.equal(stale.valid(),false);assert.equal(stale.choices[0].f(),null);
  assert.doesNotMatch(palaceKinLettersPanel(c),/回这封家书|回信谈陈情/);
  var diarySizes=[c.story.length,father.story.length,brother.story.length];S.turn++;S.month++;palaceKinMailTick();
  assert.deepEqual([c.story.length,father.story.length,brother.story.length],diarySizes);
  assert.equal(palaceKinPetitionRows().length,0);assert.equal(c.palaceKinNews.filter(n=>n.kind==='cold').length,0);
  var count=c.courtFamilyNews?.length||0;courtFamilyNewsFor(c,'father','merit','盐务','盐务办妥。');
  assert.equal(c.courtFamilyNews?.length||0,count);`);
});

test('old formal verdicts are recognized by the signed record, and a restored palace title is eligible again',()=>{
 const game=family();game.run(`c.cold=true;c.rank=0;
  assert.equal(palaceKinCommoner(c),false);
  story(c,fullName(a)+'因主使换婴被废为庶人，押入冷宫，案卷记明罪责。');
  assert.equal(palaceKinCommoner(c),false);
  story(c,fullName(c)+'因主使换婴被废为庶人，押入冷宫，案卷记明罪责。');
  assert.equal(palaceKinCommoner(c),true);assert.match(cName(c),/庶人/);
  A.uncold(c.id);A.cold(c.id);choose(0);drain();
  assert.equal(palaceKinCommoner(c),false);assert.doesNotMatch(cName(c),/庶人/);
  assert.ok(c.palaceKinNews.some(n=>palaceKinResponseReady(c,n,'letter')));`);
});

function arrangeRecovery(game){
 game.run(`c.rank=5;story(c,'晋封为安妃。');A.cold(c.id);choose(0);drain();
  var coldNote=c.palaceKinNews.find(n=>n.petition);
  S.turn++;S.month++;palaceKinMailTick();A.palaceKinPetition(coldNote.id);choose(0);drain();`);
}
test('release continues the same petition in both diaries and a saved letter can be sent after reload',()=>{
 let game=family();arrangeRecovery(game);
 game.run(`c.trait='持重';A.uncold(c.id);
  var n=c.palaceKinNews.find(n=>n.kind==='released'&&n.officialId===brother.id);
  assert.equal(c.rank,3);assert.equal(n.recovery.priorId,coldNote.id);assert.equal(n.recovery.help,'care');
  assert.match(n.fact,/获准离开冷宫，现依贵人位分/);
  assert.match(n.quote,/上回递进去的衣物.*长出了一口气/);
  var timeline='court-family:'+coldNote.id;
  assert.ok(c.story.some(s=>s.thread===timeline&&s.t.includes('衣物是你按例托人送来的')));
  assert.ok(brother.story.some(s=>s.thread===timeline&&s.t.includes('获准离开冷宫')));
  assert.match(palaceKinLettersPanel(c),/回信报平安/);
  A.palaceKinResponse(c.id,n.id,'letter');assert.match(curEv.text,/我已经出了冷宫.*把夜觉养回来/s);save('1');`);
 game=boot(882,game.storage);game.ctx.assert=assert;
 game.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'回信 · 出冷宫后的家书');
  var c=S.consorts.find(c=>fullName(c)==='许清容'),n=c.palaceKinNews.find(n=>n.kind==='released'&&n.recovery.help==='care');
  var p=courtFamilyOfficial(c,n);choose(0);drain();S.turn++;S.month++;palaceKinMailTick();
  var pair='court-family:'+n.id+':letter-delivered';
  var court=p.story.find(s=>s.occasion===pair),palace=c.story.find(s=>s.occasion===pair);
  assert.match(court.t,/那道折子的旧底/);assert.equal(court.thread,palace.thread);
  assert.equal(court.thread,'court-family:'+n.recovery.priorId);
  assert.equal(n.responses.letter.status,'delivered');`);
});
test('an intervening promotion is ordinary, while actual restoration links the previous discharge and an earlier petition',()=>{
 const game=family();arrangeRecovery(game);
 game.run(`A.uncold(c.id);var episode=c.palaceKinRecovery.id;
  var discharged=c.palaceKinNews.find(n=>n.kind==='released'&&n.officialId===brother.id);
  A.promote(c.id);choose(0);drain();assert.equal(c.rank,4);assert.ok(!c.palaceKinNews.some(n=>n.kind==='restored'));
  father.away=true;A.promote(c.id);choose(0);drain();assert.equal(c.rank,5);
  var restored=c.palaceKinNews.find(n=>n.kind==='restored'&&n.officialId===brother.id),late=c.palaceKinNews.find(n=>n.kind==='restored'&&n.officialId===father.id);
  assert.equal(restored.recovery.episode,episode);assert.equal(restored.recovery.priorId,discharged.recovery.priorId);
  assert.equal(restored.recovery.help,'care');assert.equal(late.letter,'sent');
  assert.match(restored.fact,/恢复原位，复为妃/);
  assert.ok(!c.story.some(s=>s.occasion==='court-family:'+late.id+':received'));
  S.turn++;S.month++;palaceKinMailTick();assert.equal(late.letter,'received');
  A.promote(c.id);choose(0);drain();assert.equal(c.rank,6);
  assert.equal(c.palaceKinNews.filter(n=>n.kind==='restored'&&n.officialId===brother.id).length,1);`);
});
test('a fresh cold-palace stay never reuses a petition from the last stay, and a fresh draft is not called filed',()=>{
 const game=family();arrangeRecovery(game);
 game.run(`A.uncold(c.id);var previous=c.palaceKinRecovery.id;
  A.cold(c.id);choose(0);drain();var episode=c.palaceKinRecovery.id;
  var later=c.palaceKinNews.find(n=>n.coldEpisode===episode&&n.officialId===brother.id);
  assert.ok(later.petition);assert.equal(later.petition.filed,undefined);
  A.uncold(c.id);
  var n=c.palaceKinNews.find(n=>n.kind==='released'&&n.recovery.episode===episode&&n.officialId===brother.id);
  assert.notEqual(episode,previous);assert.equal(n.recovery.priorId,later.id);assert.equal(n.recovery.help,'letter');
  assert.doesNotMatch(n.quote,/递过折/);assert.equal(palaceKinPetitionRows().length,0);`);
});
test('an old save that already released her can still link a future restoration to the earlier care',()=>{
 const game=family();arrangeRecovery(game);
 game.run(`A.uncold(c.id);
  delete c.palaceKinRecovery;c.palaceKinNews=c.palaceKinNews.filter(n=>n.kind!=='released');
  for(const n of c.palaceKinNews)delete n.coldEpisode;
  A.promote(c.id);choose(0);drain();assert.equal(c.rank,4);assert.ok(!c.palaceKinNews.some(n=>n.kind==='restored'));
  A.promote(c.id);choose(0);drain();var n=c.palaceKinNews.find(n=>n.kind==='restored'&&n.officialId===brother.id);
  assert.ok(n);assert.equal(n.recovery.priorId,coldNote.id);assert.equal(n.recovery.help,'care');`);
});
