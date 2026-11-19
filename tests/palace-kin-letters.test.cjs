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
