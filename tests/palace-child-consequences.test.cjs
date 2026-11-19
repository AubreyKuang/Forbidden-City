const {test}=require('node:test'),assert=require('node:assert/strict'),{world:base}=require('./child-consequences-world.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}
function cold(w){w.run(`Math.random=()=>0;A.cold(a.id);choose(0);nextEv();`);}
test('cold palace immediately queues one collective child response with foster siblings and a real friend',()=>{
 const w=world();cold(w);w.run(`assert.equal(curEv.title,'孩子们一同求情');assert.match(curEv.text,/清宁、清和、明仪、玉宁一同/);assert.match(curEv.text,/陪交好的孩子前来/);assert.match(curEv.text,/沈知微.*入冷宫/);assert.doesNotMatch(curEv.text,/object Object|undefined|玉华/);
 for(var k of [elder,little,foster,baby])assert.ok(k.story.some(s=>s.familyIncident?.kind==='cold'));assert.ok(!stranger.story.some(s=>s.familyIncident));assert.match(foster.story.find(s=>s.familyIncident).t,/养母/);assert.match(baby.story.find(s=>s.familyIncident).t,/尚不明白/);
 assert.equal(S.flags.childFamilyIncidents.length,1);choose(0);drain();assert.equal(a.cold,true);assert.ok(friend.story.some(s=>s.t.includes('陪交好的皇嗣')));assert.ok(!friend.story.some(s=>s.t.includes('为母妃')));assert.equal(motherAppealEvent(),null);`);
});
test('visit conversations vary, cost one energy, remain brief and never repeat the petition',()=>{
 const w=world();cold(w);w.run(`choose(0);drain();var spoken=new Set(),start=E().energy;for(var i=0;i<7;i++){A.kidVisit(elder.id);assert.equal(curEv.title,'探望皇嗣');assert.ok(curEv.text.length<200);assert.doesNotMatch(curEv.text,/一同来御前求情|消息传到了/);spoken.add(curEv.text);drain();}assert.equal(spoken.size,7);assert.equal(E().energy,start-7);assert.equal(elder.familyFeeling.visits,7);assert.equal(S.flags.childFamilyIncidents.length,1);`);
});
test('real punishment pending scene, reply and subsequent visits replay exactly once',()=>{
 let w=world();cold(w);const eid=w.run('elder.id'),aid=w.run('a.id');const text=w.run('curEv.text');w=boot(102,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.flags.childFamilyIncidents.length,1);`);assert.equal(w.run('curEv.text'),text);
 w.run(`choose(1);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();A.kidVisit(${eid});save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${eid}).familyFeeling.visits,1);drain();assert.equal(byId(${aid}).cold,true);assert.equal(kidById(${eid}).story.filter(s=>s.familyIncident?.response==='care').length,1);`);
});
test('release does not create a second demotion incident and stops cold-palace talk',()=>{
 const w=world();cold(w);w.run(`choose(2);drain();assert.equal(a.cold,false);assert.equal(a.rank,0);assert.equal(S.flags.childFamilyIncidents.length,1);assert.equal(childConsequenceVoice(elder),null);`);
});
test('a childless consort may take over care after the foster mother has spent two months in the cold palace',()=>{
 const w=world();w.run(`var willing=makeGirl({sur:'陆',given:'静华',age:26});addConsort(willing,3,'入宫');willing.hp=90;PalaceActions.reset();`);
 cold(w);w.run(`choose(0);drain();
   var mother=foster.mom;foster.visitRule='closed';
   S.turn++;assert.equal(coldFosterPetitionEvent(),null);
   S.turn++;var offer=coldFosterPetitionEvent();assert.equal(offer.por,willing);assert.equal(foster.foster,a.id);
   pushEv(offer);assert.equal(curEv.title,'请养 · 冷宫之后');choose(0);drain();
   assert.equal(foster.mom,mother);assert.equal(foster.foster,willing.id);assert.equal(foster.visitRule,'closed');
   assert.ok(foster.story.some(e=>e.t.includes('陆静华抚养')));
   assert.ok(a.story.some(e=>e.t.includes('改由陆静华抚养')));
   assert.equal(coldFosterPetitionEvent(),null);`);
});
test('a close friend may petition once during a cold-palace stay and arrange aid without release',()=>{
 const w=world();cold(w);w.run(`choose(0);drain();S.children=[];
   relAdd(b,a,65-relGet(b,a));assert.equal(coldFriendPetitionEvent(),null);
   S.turn++;Math.random=()=>.99;assert.equal(coldFriendPetitionEvent(),null);
   Math.random=()=>0;var event=coldFriendPetitionEvent();pushEv(event);
   assert.equal(curEv.title,'为冷宫旧友求情');assert.equal(curEv.por,b);
   assert.deepEqual(curEv.present.map(p=>p.id),[b.id]);var rank=a.rank;
   choose(0);drain();assert.equal(a.cold,true);assert.equal(a.rank,rank);
   assert.ok(a.story.some(e=>e.t.includes('托宫人送衣食')));
   assert.ok(b.story.some(e=>e.t.includes('托宫人送衣食')));
   assert.equal(coldFriendPetitionEvent(),null);assert.equal(event.choices[1].f(),null);`);
});
test('a refused probability still records every affected child, without any forced plea',()=>{
 const w=world();w.run(`Math.random=()=>.999;A.cold(a.id);choose(0);nextEv();assert.equal(curEv.title,'母亲遭逢变故');assert.equal(S.flags.childFamilyIncidents[0].pleaders.length,0);assert.equal(a.childDisgrace.checked,true);choose(0);drain();assert.equal(motherAppealEvent(),null);`);
});
test('death records children including a former foster child, but never offers pardon or a plea',()=>{
 const w=world();w.run(`var prev=JSON.parse(JSON.stringify(S));a.alive=false;foster.foster=q.id;childMotherConsequences(prev);assert.equal(curEv.title,'亲人离世之后');assert.equal(S.flags.childFamilyIncidents[0].pleaders.length,0);assert.ok(curEv.choices.every(c=>!/出冷宫|求情|原处分/.test(c.t)));assert.match(foster.story.find(s=>s.familyIncident).t,/养母/);assert.equal(elder.familyFeeling.kind,'death');var n=elder.story.length;childMotherConsequences(prev);assert.equal(elder.story.length,n);drain();A.kidVisit(elder.id);assert.match(curEv.text,/记不清/);`);
});
test('an infant receives care narration and never speaks adult dialogue',()=>{
 const w=world();cold(w);w.run(`drain();A.kidVisit(baby.id);assert.match(curEv.text,/乳母/);assert.doesNotMatch(curEv.text,/“|儿臣|功课|写.*信/);`);
});
test('remote children send letters and cannot join a physical group at court',()=>{
 const w=world();w.run(`for(var k of [elder,little,foster,friend])k.away=true;Math.random=()=>0;A.cold(a.id);choose(0);nextEv();assert.match(curEv.text,/托人递来求情的书信/);assert.doesNotMatch(curEv.text,/一同来御前/);drain();A.kidVisit(elder.id);assert.equal(curEv.title,'皇嗣家书');assert.doesNotMatch(curEv.text,/你坐近|你的衣袖|靠到你身边|向你挪近/);`);
});
test('older settled cold-palace saves get varied visits without replaying a historical punishment',()=>{
 const w=world();w.run(`a.cold=true;syncChildDisgrace();PalaceActions.reset();save('auto');A.load('auto');var k=S.children.find(k=>k.name==='清宁');A.kidVisit(k.id);var first=curEv.text;drain();A.kidVisit(k.id);assert.notEqual(curEv.text,first);assert.equal(S.flags.childFamilyIncidents,undefined);assert.equal(k.familyVisitCount,2);`);
});
test('profile reading is pure and sorrow gradually leaves everyday speech',()=>{
 const w=world();cold(w);w.run(`drain();var before=JSON.stringify(S);childVoicePool(elder);childVoicePool(elder);assert.equal(JSON.stringify(S),before);S.turn+=6;assert.match(childConsequenceVoice(elder).stage,/恢复日常/);a.cold=false;assert.equal(childConsequenceVoice(elder),null);`);
});
test('departure produces immediate concern without asserting an offense',()=>{
 const w=world();w.run(`Math.random=()=>0;A.away(a.id);choose(0);nextEv();assert.match(curEv.text,/离宫/);assert.match(curEv.text,/只求父皇容人传个平安/);assert.doesNotMatch(curEv.text,/没有过错/);`);
});
test('genuine published v29 punishment finishes unchanged, then old-save visit dialogue improves',()=>{const payload=require('./fixtures/child-cold-legacy-v29.json'),w=boot(229,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,29);assert.equal(S.flags.childFamilyIncidents,undefined);drain();var k=S.children.find(k=>k.name==='清宁');A.kidVisit(k.id);assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);assert.match(curEv.text,/厚些的衣裳/);`);});
for(const [name,change,kind] of [['demotion',"a.rank=1;story(a,'石阶泼油事发，被降为答应，禁足宫中。')",'demotion'],['discipline',"story(a,'争执失礼，罚俸三月，禁足宫中。')",'punishment']])test(name+' records the child reaction as soon as the incident settles',()=>{const w=world();w.run(`var prev=JSON.parse(JSON.stringify(S));${change};childMotherConsequences(prev);assert.equal(elder.familyFeeling.kind,'${kind}');assert.ok(elder.story.some(s=>s.familyIncident?.kind==='${kind}'));`);});
test('every remote visit stays a letter, including later topics',()=>{const w=world();cold(w);w.run(`drain();elder.away=true;for(var i=0;i<7;i++){A.kidVisit(elder.id);assert.equal(curEv.title,'皇嗣家书');assert.doesNotMatch(curEv.text,/父皇肯来|和您坐一会儿|你的衣袖|你坐近|向你挪近/);drain();}`);});
test('petitioners lead the popup and identical infant reactions share one short line',()=>{
 const w=world();w.run(`var other=makeKid(a,'f','静姝');other.pendingName=false;other.born=S.turn-5;`);cold(w);w.run(`assert.match(curEv.text.split('\\n')[0],/清宁、清和、明仪、玉宁一同来御前求情/);assert.equal(curEv.cast.map(k=>k.id).join(','),[elder,little,foster,friend].map(k=>k.id).join(','));assert.equal(curEv.text.split('尚不明白大人的处置').length-1,1);assert.ok(curEv.text.includes(baby.name+'、静姝：'));assert.doesNotMatch(curEv.text,/清宁：|清和：|明仪：/);for(var k of [baby,other])assert.match(k.story.find(s=>s.familyIncident?.kind==='cold').t,/尚不明白大人的处置/);`);
});
test('a genuine v31 pending petition keeps its original words through reload',()=>{
 const payload=require('./fixtures/child-plea-legacy-v31.json'),w=boot(123,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,31);assert.match(curEv.text,/消息传到了孩子们那里/);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);`);
});
test('choose care for each dependent after a cold-palace order, including an infant, and resume between children',()=>{
 const w=world();w.run(`elder.away=true;little.born=S.turn-14*12;Math.random=()=>.999;
 var fosterId=foster.id,babyId=baby.id,motherId=a.id,carerId=q.id;
 A.cold(a.id);choose(0);nextEv();assert.equal(curEv.title,'母亲遭逢变故');
 choose(curEv.choices.findIndex(x=>x.t==='把孩子交给其他妃嫔抚养'));
 assert.equal(curEv.por.id,fosterId);choose(curEv.choices.length-1);assert.equal(curEv.por.id,babyId);
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.por.id,babyId);
 choose(curEv.choices.findIndex(x=>x.person?.id===carerId));drain();
 assert.equal(kidById(babyId).foster,carerId);assert.equal(kidById(babyId).mom,motherId);
 assert.equal(kidById(fosterId).foster,motherId);assert.equal(S.flags.childFamilyIncidents.at(-1).response,'foster');
 assert.ok(byId(carerId).story.some(s=>s.t.includes(baby.name)&&s.t.includes('抚养')));
 assert.ok(S.log.some(s=>s.t.includes(baby.name)&&s.t.includes(fullName(byId(carerId)))));`);
});
test('declining every carer returns to the unresolved incident without moving the child',()=>{
 const w=world();w.run(`S.children=[baby];`);cold(w);
 w.run(`choose(curEv.choices.findIndex(x=>x.t==='把孩子交给其他妃嫔抚养'));
 choose(curEv.choices.length-1);assert.equal(curEv.title,'母亲遭逢变故');
 assert.ok(!S.flags.childFamilyIncidents.at(-1).resolved);choose(0);drain();assert.ok(!baby.foster);`);
});

test('public pregnancy news includes birth and foster children, all three feelings, letters and quiet pregnancies',()=>{
 const w=world();w.run(`a.preg=2;a.pregnancyCalendar={conceived:42,term:10,nights:[]};
 var cases=new Set(),heard=k=>k.story.filter(e=>e.t.startsWith('【听闻喜脉】')).length;
 for(const [k,nature,away] of [[little,'好胜',false],[foster,'仁厚',false],[elder,'好奇',true]]){
   S.children=[k,baby,stranger];k.temperament=nature;if(away){k.sex='m';k.princeEstate={};}
   for(let n=1;n<=160;n++){
     a.pregnancyCalendar.conceived=n;let before=heard(k),mom=heard(a);
     let result=pregEvent(a).choices[2].f();
     if(heard(k)===before){cases.add('quiet');assert.equal(heard(a),mom);}
     else{
       const entry=k.story.at(-1).t;assert.equal(heard(a),mom+1);
       assert.ok(result.includes(a.story.at(-1).t.slice('【听闻喜脉】'.length)));
       assert.equal(entry.includes('回信'),away);assert.match(entry,k===foster?/养母/:/母妃/);
       for(const feeling of ['分给自己','生产时的安危','与弟妹见面'])if(entry.includes(feeling))cases.add(k.id+feeling);
       if(entry.includes('与弟妹见面'))assert.ok(result.includes(away?'哥哥':'姐姐'));
     }
     assert.equal(childPregnancyNews(a),'');assert.equal(heard(baby)+heard(stranger),0);
   }
 }
 assert.equal(cases.size,10);foster.visitRule='closed';S.children=[foster];b.preg=2;assert.equal(childPregnancyNews(b),'');`);
});
test('a month-end pregnancy notice survives loading before and after the answer with one chronicle apiece',()=>{
 const w=world();w.run(`S.children=[foster];a.preg=1;a.pregnancyCalendar={conceived:S.turn,term:10,nights:[]};
 while(mulberry32(voiceHash('child-pregnancy:'+a.seed+':'+pregnancyPrayerKey(a)))()>=.55)a.seed++;
 var mid=a.id,kid=foster.id;PalaceActions.reset();A.endMonth();
 for(let i=0;i<100&&modalOpen&&curEv.title!=='喜脉';i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}
 assert.equal(curEv.title,'喜脉');save('1');`);
 const mid=w.run('mid'),kid=w.run('kid');
 const n=boot(40,w.storage);n.ctx.assert=assert;n.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'喜脉');
 choose(2);assert.ok(modalResult);save('2');`);
 const r=boot(70,w.storage);r.ctx.assert=assert;r.run(`A.load('2');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);
 var m=byId(${mid}),k=kidById(${kid}),count=p=>p.story.filter(e=>e.t.includes('【听闻喜脉】')).length;
 assert.equal(count(m),1);assert.equal(count(k),1);drain();assert.equal(count(m),1);assert.equal(count(k),1);`);
});

test('the same sibling follows this pregnancy through naming, including old text-only saves and a twin batch',()=>{
 const w=world();w.run(`a.preg=2;a.pregnancyCalendar={conceived:S.turn-1,term:10,nights:[]};
 S.children=[foster];let seen=false;while(!seen){a.seed++;delete a.childPregnancyNotice;seen=!!childPregnancyNews(a);}
 var heard=a.siblingExpectation;delete a.siblingExpectation;S.children.push(little);S.turn+=8;S.month+=8;
 if(S.month>12){S.month-=12;S.year++;}
 a.preg=10;var makeBirth=birthEvent(a);a.delivery.difficult=false;
 var second=makeKid(a,'f','嘉容');second.pendingName=true;second.birthOrder=2;
 a.delivery.children.push(second.id);a.delivery.kind='双胞胎';
 birthNamingEvent(a).choices[0].f('嘉仪');assert.equal(a.delivery.siblingVisit,undefined);
 var result=birthNamingEvent(a).choices[0].f('嘉容');assert.ok(result.text.includes(foster.name));
 assert.equal(a.delivery.siblingVisit.child,heard.child);assert.equal(a.delivery.siblingVisit.kind,heard.kind);
 const count=p=>p.story.filter(e=>e.t.startsWith('【产后家话】')).length;
 assert.equal(count(a),1);assert.equal(count(foster),1);assert.equal(count(little),0);
 assert.equal(finishDelivery(a),'');assert.equal(count(foster),1);
 delete a.delivery.siblingVisit;assert.equal(siblingExpectationAtBirth(a,S.gen+':'+a.id+':0'),null);`);
});
test('age at announcement and at birth, grief, letters and both first reactions to sharing attention',()=>{
 const w=world();w.run(`a.preg=2;a.pregnancyCalendar={conceived:S.turn-1,term:10,nights:[]};S.children=[baby];
 assert.equal(childPregnancyNews(a),'');S.children=[elder];elder.born=S.turn-180;
 let teen=new Set();for(let i=0;i<100;i++){delete a.childPregnancyNotice;a.seed=i;if(childPregnancyNews(a))teen.add(a.siblingExpectation.kind);}
 assert.deepEqual([...teen].sort(),['joy','worry']);
 const newborn=makeKid(a,'f','锦华');const visit=(kind,seed,person=little,loss=false)=>{
   const key=S.gen+':'+a.id+':'+seed;a.childPregnancyNotice=key;a.siblingExpectation={key,child:person.id,kind};
   a.delivery={settled:true,siblingNoticeKey:key};return siblingBirthVisit(a,[newborn],loss);
 };
 S.children.push(little,foster,baby);const variants=new Set();
 for(let n=0;n<90;n++){const text=visit('attention',n);variants.add(text.includes('抓住我')?'soft':text.includes('那我坐哪儿')?'jealous':'unknown');}
 assert.deepEqual([...variants].sort(),['jealous','soft']);
 assert.match(visit('joy',1,foster),/能教我怎么抱/);assert.match(visit('joy',2,elder),/歇一会儿/);
 assert.match(visit('worry',3,elder),/先告诉我，她平安么/);
 assert.doesNotMatch(visit('attention',4,elder),/那我坐哪儿|委屈/);
 assert.equal(visit('joy',4,baby),'');elder.estate=true;assert.match(visit('joy',5,elder),/捎话/);
 assert.match(visit('joy',6,elder,true),/没能留住/);a.alive=false;assert.match(visit('worry',7,elder),/噩耗/);
 `);
});
