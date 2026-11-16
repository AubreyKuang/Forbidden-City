const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function world(trait='内敛'){
 const b=boot(82);b.ctx.assert=assert;b.run(`A.start();drain();var k=makeKid(harem()[0],'f','淑月');k.born=S.turn-192;k.lit=90;k.mar=20;k.temperament=${JSON.stringify(trait)};E().treasury=500;PalaceActions.reset();`);return b;
}
function reload(b){const n=boot(929,b.storage);n.ctx.assert=assert;n.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);`);return n;}

test('equally literate princesses have eight distinct voices instead of eight requests to copy books',()=>{
 const b=world();b.run(`
  var texts=[],original=JSON.stringify(S);
  for(var trait of Object.keys(CHILD_DISPOSITIONS)){
    k.temperament=trait;var voice=princessMarriageVoice(k);texts.push(voice.quote);
    assert.ok(PRINCESS_MARRIAGE_VOICES[trait].lines.includes(voice.quote));
    assert.doesNotMatch(voice.text,/我想把宫里旧书校清楚|她愿意与你逐一谈谈求亲的人/);
  }
  assert.equal(new Set(texts).size,8);k.temperament='内敛';assert.equal(JSON.stringify(S),original);
 `);
});

for(const trait of ['好奇','好胜','仁厚','内敛','爽直','灵动','审慎','自矜'])test(trait+' has variation within the same personality and a consistent marriage profile',()=>{
 const b=world(trait);b.run(`
  var quotes=new Set();for(var i=1;i<=64;i++){var person={...k,id:i,seed:i*9137};quotes.add(princessMarriageVoice(person).quote);}
  assert.ok(quotes.size>=3);assert.equal(PRINCESS_MARRIAGE_VOICES[k.temperament].lines.length,4);
  assert.equal(marriageNature(k).temperament,({好奇:'爽朗',灵动:'爽朗',爽直:'爽朗',好胜:'好胜',自矜:'好胜',仁厚:'温厚',内敛:'沉静',审慎:'矜持'})[k.temperament]);
  var reviews=['official','frontier','scholar'].map(id=>princessMatchVoice(k,id));assert.equal(new Set(reviews).size,3);
 `);
});

test('a fresh reload keeps the same conversation and named candidates; returning never duplicates its chronicle',()=>{
 let b=world();b.run(`A.princessMarriage(k.id);`);const text=b.run('curEv.text');b=reload(b);assert.equal(b.run('curEv.text'),text);
 b.run(`var k=S.children.find(k=>k.name==='淑月');assert.equal(k.story.filter(s=>s.t.includes('【议亲心意】')).length,1);choose(0);`);
 const review=b.run('curEv.text');b=reload(b);assert.equal(b.run('curEv.text'),review);
 b.run(`choose(2);assert.equal(curEv.text,${JSON.stringify(text)});var k=S.children.find(k=>k.name==='淑月');assert.equal(k.story.filter(s=>s.t.includes('【议亲心意】')).length,1);choose(3);drain();save('auto');`);
 b=reload(b);b.run(`var k=S.children.find(k=>k.name==='淑月');assert.equal(k.story.filter(s=>s.t.includes('【议亲心意】')).length,1);assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='princess_marriage_wish'));`);
});

test('a six-month postponement refreshes the wording without changing temperament, candidate identity or project',()=>{
 const b=world('审慎');b.run(`
  k.estate={pursuit:'books',stage:'working',due:S.turn+8};A.princessMarriage(k.id);var first=curEv.text;
  assert.match(first,/整理一部书.*还在筹办/);choose(0);var candidate=k.marriageCandidates.scholar.id;choose(2);choose(3);drain();
  S.turn=k.marriageAfter;A.princessMarriage(k.id);assert.notEqual(curEv.text,first);assert.equal(k.temperament,'审慎');
  assert.equal(k.estate.stage,'working');assert.equal(k.marriageCandidates.scholar.id,candidate);
  assert.equal(k.story.filter(s=>s.t.includes('【议亲心意】')).length,2);
 `);
});

test('mother context follows a recorded, current family incident and never invents a death or a palace visit',()=>{
 const b=world();b.run(`
  var m=byId(k.mom);k.familyFeeling={mother:m.id,kind:'death',turn:S.turn};
  assert.doesNotMatch(princessMarriageContext(k),/已故/);m.alive=false;assert.ok(princessMarriageContext(k).includes(fullName(m)));assert.match(princessMarriageContext(k),/若她还在/);
  for(var trait of Object.keys(CHILD_DISPOSITIONS)){k.temperament=trait;var voice=princessMarriageVoice(k);assert.equal(voice.quote,PRINCESS_MARRIAGE_CONCERNS[trait]);assert.ok(voice.emotion<0);assert.doesNotMatch(voice.text,/忍不住|点子|猜灯谜/);}
  m.alive=true;m.cold=true;k.familyFeeling.kind='cold';assert.match(princessMarriageContext(k),/冷宫.*按宫规/);
  m.cold=false;assert.doesNotMatch(princessMarriageContext(k),/冷宫/);m.gone=true;k.familyFeeling.kind='departure';assert.match(princessMarriageContext(k),/离宫/);
  S.turn+=13;assert.doesNotMatch(princessMarriageContext(k),/离宫|已故|冷宫/);
 `);
});

test('an eligible remembered acquaintance is named, but a married or deceased one is not offered as a prospect',()=>{
 const b=world();b.run(`
  S.youngGuests={old:{id:'old',name:'顾清衍',sur:'顾',clan:'independent',alive:true,sex:'m',born:S.turn-216}};k.youngAdmiration={guestKey:'old'};
  E().sur='李';assert.match(princessMarriageContext(k),/顾清衍.*没有把旧日相识当作已经定下/);
  S.youngGuests.old.married=true;assert.doesNotMatch(princessMarriageContext(k),/顾清衍/);
  S.youngGuests.old.married=false;S.youngGuests.old.alive=false;assert.doesNotMatch(princessMarriageContext(k),/顾清衍/);
 `);
});

test('completed projects, past wishes and close companions each connect to actual experiences',()=>{
 const b=world();b.run(`
  k.estate={pursuit:'archery',stage:'done'};assert.match(princessMarriageContext(k),/办成.*女骑赛/);
  delete k.estate;k.youthIdeal='riding';assert.match(princessMarriageContext(k),/少年时.*骑马/);
  delete k.youthIdeal;var p=makeKid(harem()[1],'f','宁容');k.peerMemory={person:p.id,turn:S.turn};relAdd(k,p,50);
  assert.match(princessMarriageContext(k),/宁容/);p.alive=false;assert.doesNotMatch(princessMarriageContext(k),/宁容/);
 `);
});

test('the monthly milestone records her wishes once; reading an unshown scene does not alter the world',()=>{
 const b=world();b.run(`
  k.estate={pursuit:'near',stage:'proposal'};var before=JSON.stringify(S),ev=princessMilestone(k);
  assert.equal(JSON.stringify(S),before);pushEv(ev);assert.equal(k.asked,true);assert.ok(k.marriageVoiceMemory);
  assert.equal(k.story.filter(s=>s.t.includes('【议亲心意】')).length,1);
 `);
});

test('hobbies use recorded preferences and building a voice consumes neither gameplay rolls nor money',()=>{
 const b=world();b.run(`
  k.youthIdeal='riding';assert.match(princessMarriageContext(k),/骑马/);delete k.youthIdeal;
  k.marriageNature={temperament:'敏感',hobby:'riding',spending:'节俭',space:'需要独处'};
  var snapshot=JSON.stringify(S);Math.random=()=>{throw Error('Dialogue must not roll gameplay RNG');};
  for(var i=0;i<5;i++)princessMarriageVoice(k);assert.equal(JSON.stringify(S),snapshot);
  assert.equal(marriageNature(k).temperament,'敏感');assert.ok(PRINCESS_MARRIAGE_INTERESTS.riding.includes(princessMarriageContext(k)));
 `);
});

for(const name of ['opening','review','return'])test('published v46 '+name+' resumes its original words and effects before new dialogue activates',()=>{
 const payload=require('./fixtures/princess-voices-legacy-v46.json')[name],b=boot(82,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,46);assert.equal(S.children[0].marriageVoiceMemory,undefined);drain();assert.equal(PalaceActions.contentVersion,49);assert.equal(PalaceActions.blocked,false);`);
});

for(const name of ['opening','review','married'])test('published v47 '+name+' keeps the existing royal-family and married-life behavior when reloaded',()=>{
 const payload=require('./fixtures/princess-voices-legacy-v47.json')[name],b=boot(82,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,47);assert.equal(S.children[0].marriageVoiceMemory,undefined);drain();assert.equal(PalaceActions.contentVersion,49);assert.equal(PalaceActions.blocked,false);var k=S.children[0];assert.equal(k.household.nextNews-k.household.started,2);`);
});
