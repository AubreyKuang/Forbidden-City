const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');
const {boot}=require('./playtest-harness.cjs');

test('all six dossiers use their own visits, wait for consent and admit exactly one fixed person',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`S.year=3;S.turn=24;E().age=36;E().energy=80;drain();
  var visit=(key,choice=0)=>{A.storyCastVisit(key);assert.ok(modalOpen,key);choose(choice);drain();};
  assert.equal(storyCastMeetReady('chuwan'),false);
  assert.match(storyConsortCodex(),/曾经的京城第一美人/);
  visit('qingyi');S.turn++;visit('qingyi');
  assert.equal(storyCastRecord('qingyi').office,true);assert.equal(harem().some(c=>c.fixedStory==='qingyi'),false);
  S.turn+=2;assert.equal(storyCastMeetReady('qingyi'),false);S.turn++;visit('qingyi');
  var shen=storyCastPerson(storyCastRecord('qingyi'));assert.equal(shen.rank,1);assert.equal(shen.palace,'钟粹宫');
  for(const key of ['luwan','ayimu','suheng']){visit(key);S.turn++;visit(key);}
  visit('xiaoman');S.turn++;assert.equal(storyCastMeetReady('xiaoman'),false);
  A.openBanquet();A.banquetInviteAll(true);A.holdBanquet();choose(0);drain();
  visit('xiaoman',1);
  assert.equal(storyCastRecord('xiaoman').stage,1);visit('xiaoman');S.turn++;visit('xiaoman');
  S.year=13;S.turn=144;visit('chuwan');assert.equal(storyCastName('chuwan'),'方晚');S.turn++;
  visit('chuwan');assert.equal(storyCastName('chuwan'),'楚晚');S.turn++;visit('chuwan');
  assert.equal(harem().filter(c=>c.fixedStory).length,6);
  assert.equal(houseOf(storyCastPerson(storyCastRecord('chuwan'))),null);
  var lu=storyCastPerson(storyCastRecord('luwan'));assert.equal(houseOf(lu).brother.name,'陆从谦');
  A.storyCastVisit('xiaoman');assert.equal(modalOpen,false);
  assert.ok(Object.keys(STORY_CAST).every(k=>storyCastCodexCards().includes('story-cast/'+k+'.webp')));`);
});

test('pending scenes restore and each daughter or son inherits only the relevant story rule',()=>{
 let b=world();b.ctx.assert=assert;
 b.run(`S.year=3;S.turn=24;A.storyCastVisit('luwan');save('auto');`);
 b=boot(320,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'北苑校场 · 陆绾');
  choose(0);drain();S.turn++;E().energy=8;A.storyCastVisit('luwan');choose(0);drain();
  var lu=storyCastPerson(storyCastRecord('luwan'));var son=makeKid(lu,'m','景谦');assert.ok(son.jiangmenChild);
  A.storyCastVisit('ayimu');choose(0);drain();S.turn++;A.storyCastVisit('ayimu');choose(0);drain();
  var ayi=storyCastPerson(storyCastRecord('ayimu'));var white=makeKid(ayi,'m','景泽');white.born=S.turn-8*12;
  assert.ok(white.foreignLineage);assert.equal(white.charm,25);A.kidHeir(white.id);assert.equal(S.heir,null);assert.equal(modalOpen,false);
  assert.equal(makeKid(empress(),'f','清荷').foreignLineage,undefined);
  son.born=S.turn-8*12;S.turn++;
  S.flags.frontierCampaigns=[{gen:S.gen,turn:S.turn,id:'campaign',outcome:'defeat'}];
  A.storyCastPalace(lu.id);assert.match(curEv.title,/边城来急报/);choose(0);drain();
  assert.equal(inPalace(lu),false);S.turn+=3;homeLeaveTick();assert.equal(son.fieldWorry,true);assert.equal(son.mood,55);
  A.storyCastComfort(son.id);choose(0);drain();assert.equal(son.mood,65);
  S.turn++;homeLeaveTick();assert.equal(inPalace(lu),true);assert.match(curEv.title,/北境归来/);drain();`);
});
