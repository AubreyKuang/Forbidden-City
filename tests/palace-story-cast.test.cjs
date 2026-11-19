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
  assert.equal(inPalace(lu),false);assert.equal(son.mood,61);S.turn+=3;homeLeaveTick();assert.equal(son.fieldWorry,true);assert.equal(son.mood,51);
  A.storyCastComfort(son.id);choose(0);drain();assert.equal(son.mood,61);
  S.turn++;homeLeaveTick();assert.equal(inPalace(lu),true);assert.match(curEv.title,/北境归来/);drain();`);
});

test('Lu Wan’s departure and return follow her actual children, father, brother and close friends through reload',()=>{
 let b=world();b.ctx.assert=assert;
 b.run(`S.year=13;S.turn=144;E().energy=24;E().age=40;
  var r=storyCastCreate('luwan');storyCastAdmit(r.person,r,'入宫');
  var lu=byId(r.id),h=houseOf(lu);h.father.retired=true;
  var small=makeKid(lu,'f','明棠'),older=makeKid(lu,'m','承远'),absent=makeKid(lu,'f','清和');
  for(const [p,age] of [[small,5],[older,12],[absent,16]]){p.born=S.turn-12*age;p.pendingName=false;p.hp=96;}
  older.temperament='审慎';absent.away=true;
  var friend=makeGirl({age:28,trait:'持重'}),rider=makeGirl({age:23,trait:'爽直'}),neutral=makeGirl({age:26,trait:'温婉'});
  for(const p of [friend,rider,neutral]){addConsort(p,3,'入宫');delete p.solitary;}
  friend.hobby='读书';rider.hobby='骑射';relAdd(lu,friend,70);relAdd(lu,rider,60);
  S.turn++;S.flags.frontierCampaigns=[{gen:S.gen,turn:S.turn,id:'defeat',outcome:'defeat'}];
  var ids=[lu,small,older,absent,friend,rider,neutral].map(p=>p.id);
  npcSync();PalaceActions.reset();A.storyCastPalace(lu.id);choose(0);
  assert.match(modalResult.text,/明棠也来送行.*不肯把手松开.*哭了一会儿/);
  assert.match(older.story.at(-1).t,/抄在历上.*驿路是否还通/);
  assert.match(absent.story.at(-1).t,/从送来的家信里知道/);
  assert.match(friend.story.at(-1).t,/家书该递到哪里/);
  assert.ok(rider.story.some(e=>e.t.includes('旧缰绳')));
  assert.match(h.father.story.at(-1).t,/女儿陆绾.*换马站/);
  assert.match(h.brother.story.at(-1).t,/妹妹陆绾.*薄护腕/);
  save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify(ids)'));b=boot(441,b.storage);b.ctx.assert=assert;b.ctx.ids=ids;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.match(modalResult.text,/明棠也来送行/);drain();
  var [luId,smallId,olderId,absentId,friendId,riderId,neutralId]=ids;
  var lu=byId(luId),h=houseOf(lu),small=kidById(smallId),older=kidById(olderId),absent=kidById(absentId),
      friend=byId(friendId),rider=byId(riderId),neutral=byId(neutralId);
  var notes=p=>p.story.filter(e=>e.thread===('luwan-frontier:'+lu.id+':145'));
  assert.match(viewHarem(),/暂离宫中（1）/);assert.doesNotMatch(viewHarem(),/回家省亲/);
  assert.match(consortCard(lu),/暂离宫中 · 北境军驿/);UI.sel=lu.id;assert.match(viewConsort(),/暂离宫中 · 北境军驿/);
  assert.equal(consortStatusTag(lu),'暂离宫中');assert.equal(consortNightReason(lu),'暂离宫中 · 北境军驿');
  assert.equal(startHomeLeave(neutral,1),true);
  assert.match(viewHarem(),/暂离宫中（2）/);assert.match(consortCard(neutral),/暂离宫中 · 娘家/);
  var nextMonth=()=>{A.endMonth();drain();};
  nextMonth();
  homeLeaveTick();assert.equal(notes(small).length,2);
  assert.match(notes(small).at(-1).t,/小马/);assert.match(notes(rider).at(-1).t,/有没有歇过一夜/);
  nextMonth();nextMonth();
  var mood=small.mood;homeLeaveTick();assert.equal(small.mood,mood);assert.equal(small.fieldWorry,true);
  assert.match(notes(small).at(-1).t,/娘回来了吗/);assert.match(notes(older).at(-1).t,/悄悄央人/);
  assert.match(notes(h.father).at(-1).t,/致仕.*旧簿/);assert.match(notes(h.brother).at(-1).t,/哪一站/);
  assert.match(notes(friend).at(-1).t,/给她留灯/);assert.match(notes(rider).at(-1).t,/弓收回原处/);
  A.storyCastComfort(small.id);assert.match(curEv.choices[0].t,/陪她/);drain();
  nextMonth();
  assert.equal(lu.homeLeave,undefined);assert.equal(older.fieldWorry,undefined);
  assert.match(notes(small).at(-1).t,/扑过去抱她/);assert.match(notes(absent).at(-1).t,/收到.*口信/);
  assert.match(notes(h.brother).at(-1).t,/回来就好/);assert.match(notes(friend).at(-1).t,/纸笺原样交还/);
  for(const p of [small,older,absent,friend,rider,h.father,h.brother])
    assert.deepEqual(notes(p).map(e=>e.life.title),['陆绾出征','前线家书','军驿失期','北境归来']);
  assert.equal(notes(neutral).length,0);`);
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
