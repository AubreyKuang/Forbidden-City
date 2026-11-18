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
  for(const key of ['luwan','suheng']){visit(key);S.turn++;visit(key);}
  visit('ayimu');assert.equal(storyCastPerson(storyCastRecord('ayimu')).enteredAt,S.turn);
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
  assert.ok(Object.keys(STORY_CAST).every(k=>storyCastCodexCards().includes('story-cast/'+k+(k==='chuwan'?'-court':'')+'.webp')));`);
});

test('pending scenes restore and each daughter or son inherits only the relevant story rule',()=>{
 let b=world();b.ctx.assert=assert;
 b.run(`S.year=3;S.turn=24;A.storyCastVisit('luwan');save('auto');`);
 b=boot(320,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'北苑校场 · 陆绾');
  choose(0);drain();S.turn++;E().energy=8;A.storyCastVisit('luwan');choose(0);drain();
  var lu=storyCastPerson(storyCastRecord('luwan'));var son=makeKid(lu,'m','景谦');assert.ok(son.jiangmenChild);
  A.storyCastVisit('ayimu');choose(0);drain();
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

test('all six yellow tags reach the ordinary harem cards and new chapters change real game values',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`S.year=13;S.turn=144;E().age=38;E().energy=35;E().prestige=50;E().people=50;
  var admit=key=>{const r=storyCastCreate(key);if(key==='chuwan'){r.revealed=true;r.person.sur='楚';r.person.fam.t='前朝遗孤';}storyCastAdmit(r.person,r,'测试册封');return byId(r.id);};
  var shen=admit('qingyi'),lu=admit('luwan'),ayi=admit('ayimu'),chu=admit('chuwan'),su=admit('suheng'),xiao=admit('xiaoman');
  for(const c of [shen,lu,ayi,chu,su,xiao])assert.ok(consortCard(c).includes('<span class="tag y">'+STORY_CAST_TAGS[c.fixedStory]+'</span>'));
  assert.doesNotMatch(solitaryTag(a),/京城第一美人/);
  var runChapter=(p,title,n=0)=>{A.storyCastPalace(p.id);assert.equal(curEv.title,title);choose(n);drain();};
  S.turn+=2;
  var treasury=E().treasury;
  runChapter(shen,'沈清漪 · 两封家信');assert.equal(shen.aff,53);assert.equal(E().treasury,treasury-12);
  S.turn++;assert.equal(storyCastPalaceEvent(shen),null);shen.aff=55;shen.favor=60;
  runChapter(shen,'沈清漪 · 旧信去处');assert.equal(E().prestige,52);
  var child=makeKid(lu,'f','清禾');child.born=S.turn-6*12;child.policy='习武';child.mar=60;
  runChapter(lu,'陆绾 · 校场教箭');assert.equal(child.mar,66);
  lu.aff=60;S.turn++;runChapter(lu,'陆绾 · 军驿移交簿');assert.equal(E().prestige,54);
  storyCastRecord('ayimu').palaceStage=2;treasury=E().treasury;
  runChapter(ayi,'阿依慕 · 随使团回乡的信');assert.equal(E().treasury,treasury-8);
  S.turn++;runChapter(ayi,'白泉来使 · 核对开市日');assert.equal(E().people,53);
  storyCastRecord('chuwan').palaceStage=2;
  runChapter(chu,'楚晚 · 旧仓赈册');assert.equal(E().people,58);
  storyCastRecord('suheng').palaceStage=1;storyCastRecord('suheng').amends=true;treasury=E().treasury;
  runChapter(su,'苏蘅 · 宫中供香比价');assert.equal(E().treasury,treasury+12);
  storyCastRecord('xiaoman').palaceStage=2;treasury=E().treasury;
  runChapter(xiao,'岑小满 · 旧院账本');assert.equal(E().treasury,treasury-10);
  assert.equal(E().people,61);assert.equal(storyCastPalaceEvent(xiao),null);
  S.turn++;S.lastGardenBanquet=S.turn;runChapter(xiao,'岑小满 · 散席后学戏');
  assert.equal(storyCastRecord('xiaoman').followupChapter,2);
  assert.ok(S.log.some(e=>e.t.includes('验过的账')));`);
});

test('Chu Wan keeps her original portrait before admission and wears robes for her current palace rank',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`S.year=13;S.turn=144;E().age=35;
  const r=storyCastCreate('chuwan'),wan=r.person;
  assert.match(porImg(wan,200),/chuwan\.webp/);wan.sur='楚';r.revealed=true;
  assert.match(porImg(wan,64),/chuwan\.webp/);
  storyCastAdmit(wan,r,'测试册封');assert.match(porImg(wan,200),/chuwan-court\.webp/);
  wan.rank=4;assert.match(porImg(wan,84),/chuwan-noble\.webp/);
  wan.rank=6;assert.match(porImg(wan,200),/chuwan-grand\.webp/);
  wan.rank=3;assert.match(porImg(wan,64),/chuwan-court\.webp/);`);
});

test('White Spring guests can leave or stay for a later audience without repeating the dance',()=>{
 for(const answer of [0,1,2]){
  const b=world();b.ctx.assert=assert;b.ctx.answer=answer;
  b.run(`E().age=14;var energy=E().energy;A.storyCastVisit('ayimu');assert.equal(E().energy,energy);
   E().age=25;S.flags.dowager.mourning={turn:S.turn};assert.equal(storyCastMeetReady('ayimu'),false);
   delete S.flags.dowager.mourning;assert.match(storyCastGardenButton(),/赴白泉国宫宴/);
   A.storyCastVisit('ayimu');assert.match(curEv.title,/白泉公主献舞/);assert.equal(porName(curEv.por),'白泉公主 · 阿依慕');choose(answer);drain();
   var r=storyCastRecord('ayimu');
   if(answer===2){assert.equal(storyCastMeetReady('ayimu'),false);S.turn++;A.storyCastVisit('ayimu');
    assert.match(curEv.title,/席后回话/);choose(0);drain();}
   if(answer===1){assert.ok(r.closed);assert.match(r.person.story.at(-1).t,/随父王/);}
   else{assert.equal(harem().filter(c=>c.id===r.id).length,1);assert.equal(byId(r.id).rank,3);}
   assert.equal(storyCastMeetReady('ayimu'),false);assert.doesNotMatch(storyCastGardenButton(),/白泉/);`);
 }
});
