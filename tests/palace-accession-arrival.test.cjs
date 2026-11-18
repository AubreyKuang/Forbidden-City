const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');

test('former household consorts talk about the move once, recording the response and surviving reload',()=>{
 let b=boot(33001);b.ctx.assert=assert;
 b.run(`A.start();drain();var queen=empress(),old=harem().find(c=>c!==queen),qid=queen.id,oid=old.id;E().energy=5;
  A.chat(qid);assert.equal(curEv.title,'初入宫城 · 潜邸旧人');assert.match(curEv.text,/王府/);choose(0);drain();
  assert.equal(E().energy,4);assert.equal(queen.accessionArrival.response,'listen');
  assert.ok(queen.story.some(s=>s.t.includes('初入宫城')));A.chat(oid);assert.equal(curEv.title,'初入宫城 · 潜邸旧人');choose(1);drain();save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var queen=byId(S.consorts.find(c=>c.rank===8).id);
  assert.equal(queen.accessionArrival.response,'listen');assert.equal(accessionArrivalConversation(queen),null);
  assert.ok(S.consorts.find(c=>c!==queen).story.some(s=>s.t.includes('初入宫城')));`);
});

test('the dialogue is limited to actual former household members and the first year',()=>{
 const b=boot(33001);b.ctx.assert=assert;
 b.run(`A.start();drain();var queen=empress(),newcomer=makeGirl({});addConsort(newcomer,2,'新选入宫');
  assert.equal(accessionArrivalConversation(newcomer),null);S.turn+=12;assert.equal(accessionArrivalConversation(queen),null);`);
});

test('a spouse who joins the new ruler at succession receives the arrival conversation',()=>{
 const b=boot(33001);b.ctx.assert=assert;
 b.run(`A.start();drain();var heir=makeKid(empress(),'m','承安');heir.born=S.turn-240;
  heir.spouse={name:'沈清',sur:'沈',given:'清',age:20,trait:'温婉',seed:123,alive:true,story:[]};heir.married=true;
  succeed(heir);choose(0,'承平');drain();var queen=empress();assert.ok(queen.knownBeforeAccession);
  assert.equal(queen.accessionArrival.gen,S.gen);assert.ok(accessionArrivalConversation(queen));`);
});

test('a conversation left open can be resumed after refreshing before a choice',()=>{
 let b=boot(33001);b.ctx.assert=assert;
 b.run(`A.start();drain();var queen=empress();A.chat(queen.id);assert.equal(curEv.title,'初入宫城 · 潜邸旧人');save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'初入宫城 · 潜邸旧人');
  choose(2);drain();assert.equal(empress().accessionArrival.response,'reassure');`);
});

test('a former prince’s household concubine also has the arrival conversation',()=>{
 const b=boot(33001);b.ctx.assert=assert;
 b.run(`A.start();drain();var heir=makeKid(empress(),'m','承安');heir.born=S.turn-240;
  heir.spouse={id:992,name:'沈清',sur:'沈',given:'清',age:20,trait:'温婉',seed:123,alive:true,story:[]};heir.married=true;
  var appearance=makeGirl({});appearance.given='映秋';heir.household={children:[],pregnancies:[],concubines:[{id:993,born:S.turn-240,alive:true,appearance}]};
  succeed(heir);choose(0,'承平');drain();var c=S.consorts.find(x=>x.given==='映秋');assert.ok(c);
  assert.equal(c.accessionArrival.gen,S.gen);assert.ok(accessionArrivalConversation(c));`);
});
