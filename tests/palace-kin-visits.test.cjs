const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(873);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.children=[];S.rel={};E().energy=10;E().treasury=900;
 var c=makeGirl({sur:'沈',given:'知微',age:26,trait:'温婉',fam:{t:'翰林学士',p:45}});addConsort(c,4,'入宫');c.solitary=null;c.enteredAt=36;
 var o=makeGirl({sur:'顾',given:'明珠',age:24,trait:'温婉',fam:{t:'户部侍郎',p:55}});addConsort(o,4,'入宫');o.solitary=null;
 var h=houseOf(c),oh=houseOf(o);oh.brother={id:'test-brother',name:'顾云深',sur:'顾',age:26,alive:true,married:false,career:'official',post:'翰林院编修',story:[]};
 var p=addNatalPerson(c,h,'f',22,791,false);p.married=false;p.willing=true;delete p.spouse;p.marriageChecked=48;
 var match={kind:'alliance',name:'顾云深',sur:'顾',desc:'顾明珠的兄长',consortId:o.id,personId:'test-brother',role:'brother'};
 p.betrothal={turn:58,due:72,match,seen:false};p.visit={host:c.id,from:60,until:62};S.rel[rk(c,o)]=50;houseOf(o);
 UI.view='natal';UI.sel=c.id+':'+p.id;PalaceActions.reset();
 var refresh=()=>{save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);c=byId(c.id);o=byId(o.id);h=houseOf(c);oh=houseOf(o);p=h.relatives.find(x=>x.id===p.id);};`);return b;}
test('a visiting sister asks for a decree; both spouses and both households remember it exactly once',()=>{
 const b=world();b.run(`A.natalMeet(c.id,p.id);assert.match(curEv.text,/顾云深/);choose(curEv.choices.findIndex(x=>x.t.includes('商议指婚')));
 assert.equal(curEv.title,'探亲请婚');refresh();var money=E().treasury;choose(0);assert.equal(E().treasury,money-10);refresh();
 assert.equal(p.married,true);assert.equal(oh.brother.married,true);assert.equal(p.visit,undefined);assert.equal(p.spouse.name,'顾云深');
 assert.ok(c.story.some(x=>x.t.includes(p.name)&&x.t.includes('亲自请婚')));assert.ok(o.story.some(x=>x.t.includes(p.name)&&x.t.includes('姻亲')));
 assert.equal(admitNatalSister(c,p),null);assert.equal(visitingMarriageEvent(c,p),null);`);
});
test('palace admission explicitly ends the old match and preserves identity, portrait, histories and the disappointed household',()=>{
 const b=world();b.run(`var id=p.id,face=portraitCell(natalPortrait(p)),oldRel=relGet(c,o);A.natalMeet(c.id,p.id);choose(curEv.choices.findIndex(x=>x.t.includes('一见倾心')));
 assert.equal(curEv.title,'留宫之意');assert.match(curEv.text,/顾云深/);refresh();choose(0);refresh();var g=byId(id);
 assert.equal(g.id,id);assert.equal(portraitCell(g),face);assert.equal(p.consortId,id);assert.equal(p.betrothal,undefined);assert.equal(p.spouse,undefined);
 assert.equal(oh.brother.married,false);assert.ok(relGet(c,o)<oldRel);assert.ok(g.story.some(x=>x.t.includes('顾云深')&&x.t.includes('作罢')));
 assert.ok(c.story.some(x=>x.t.includes(p.name)&&x.t.includes('作罢')));assert.ok(o.story.some(x=>x.t.includes(p.name)&&x.t.includes('议亲生变')));
 assert.equal(g.previousMarriageTalk.match.name,'顾云深');assert.equal(admitNatalSister(c,p),null);
 S.turn=80;kinMarriageTick();assert.equal(g.previousMarriageTalk.match.name,'顾云深');assert.equal(p.married,false);assert.equal(oh.brother.married,false);`);
});
test('deferring admission or declining it leaves the existing match intact',()=>{
 for(const willing of [true,false]){const b=world();b.run(`p.willing=${willing};A.natalMeet(c.id,p.id);choose(curEv.choices.findIndex(x=>x.t.includes('一见倾心')));refresh();
 choose(${willing?1:0});refresh();assert.equal(p.betrothal.match.name,'顾云深');assert.equal(p.consortId,undefined);assert.ok(p.visit);
 if(!${willing})assert.equal(natalRomanceReady(c,p),false);`);}
});
test('unmatched visitors can request a match, while money and stale spouse checks guard the decree',()=>{
 const b=world();b.run(`delete p.betrothal;A.natalMeet(c.id,p.id);choose(curEv.choices.findIndex(x=>x.t.includes('商议指婚')));assert.ok(p.betrothal);refresh();
 E().treasury=0;assert.equal(curEv.choices[0].cond(),false);assert.equal(curEv.choices[0].f(),null);assert.equal(p.married,false);
 E().treasury=900;p.betrothal.match=match;var ev=visitingMarriageEvent(c,p);oh.brother.married=true;
 assert.equal(ev.choices[0].f(),null);assert.equal(E().treasury,900);assert.equal(p.married,false);`);
});
test('age, marriage, absence and full ranks cannot be bypassed by direct admission or stale buttons',()=>{
 for(const patch of ["p.born=S.turn-17*12","p.married=true","p.spouse={name:'已有夫婿'}","p.alive=false","c.cold=true","p.visit.until=S.turn","p.betrothal.arranged=true"]){
  const b=world();b.run(`${patch};assert.equal(natalRomanceReady(c,p),false);assert.equal(admitNatalSister(c,p),null);assert.equal(p.betrothal.match.name,'顾云深');`);
 }
 const b=world();b.run(`var cap=RANK_CAP[2];RANK_CAP[2]=0;assert.equal(admitNatalSister(c,p),null);assert.ok(p.betrothal);RANK_CAP[2]=cap;`);
});
test('a match raised by letter can invite precisely the same sister into the palace',()=>{
 const b=world();b.run(`delete p.visit;for(const x of S.consorts)for(const r of natalPeople(houseOf(x)))if(r!==p)delete r.betrothal;
 var ev=betrothalEvent();assert.equal(ev.kinMarriagePerson,p.id);ev.choices.find(x=>x.t.includes('召她入宫')).f();assert.equal(curEv.title,'娘家来访');
 choose(0);assert.equal(curEv.title,'探亲相见');assert.match(curEv.text,new RegExp(p.name));assert.equal(p.visit.host,c.id);`);
});
test('a match lost during a visit is acknowledged before discussing another marriage, without writing new memories for the dead',()=>{
 const b=world();b.run(`oh.brother.alive=false;var before=oh.brother.story.length;A.natalMeet(c.id,p.id);refresh();
 assert.equal(p.betrothal,undefined);assert.ok(p.story.some(x=>x.t.includes('顾云深已离世')));assert.doesNotMatch(curEv.text,/正与.*顾云深议亲/);
 choose(curEv.choices.findIndex(x=>x.t.includes('一见倾心')));choose(0);refresh();assert.equal(oh.brother.story.length,before);assert.ok(byId(p.id));`);
});
test('version 10 pending visits replay their original choices without losing the marriage',()=>{
 const save=require('./fixtures/kin-visits-legacy-v10.json');
 const b=boot(873,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'探亲相见');assert.equal(curEv.choices.length,2);choose(0);drain();
 var c=S.consorts[0],p=natalPeople(houseOf(c)).find(x=>x.betrothal);assert.ok(p);A.natalMeet(c.id,p.id);assert.ok(curEv.choices.some(x=>x.t.includes('商议指婚')));`);
});
function friends(){const b=world();b.run(`delete p.visit;var g=makeGirl({sur:'许',given:'清容',age:22,trait:'温婉',fam:{t:'礼部侍郎',p:50}});g.solitary=null;delete g.timeTraveler;delete c.timeTraveler;
 g.kin={};c.kin={};var tie=makeOldFriendTie(g,c);assert.ok(tie);S.cands=[g];S.selection={phase:'audience',current:g.id,performed:[]};selectionBatch();PalaceActions.reset();`);return b;}
test('childhood ties fit both ages and precede the resident entering court; older residents have household ties',()=>{
 const b=friends();b.run(`assert.equal(tie.kind,'childhood');assert.ok(tie.metTurn<c.enteredAt);
 for(const a of [c,g]){var age=a.age-(S.turn-tie.metTurn)/12;assert.ok(age>=5&&age<=14);}
 c.age=60;c.enteredAt=-420;delete g.oldCourtFriend;var late=makeOldFriendTie(g,c);assert.equal(late.kind,'households');assert.equal(late.metTurn,undefined);
 assert.doesNotMatch(late.memory,/小时候|幼时/);`);
});
test('old friends are visible before selection, survive reload and create reciprocal history and links only when admitted',()=>{
 const b=friends();b.run(`assert.match(viewSelectionAudience(),/旧缘/);A.xxRoster();assert.match(viewXX(),/自幼相识/);
 var before=JSON.stringify(S);viewXX();viewXX();assert.equal(JSON.stringify(S),before);refresh();g=S.cands[0];assert.equal(g.oldCourtFriend.kind,'childhood');
 A.xxTake(g.id);choose(2);refresh();g=byId(g.id);assert.ok(c.oldCourtFriends.includes(g.id));assert.ok(relGet(c,g)>=35);
 for(const x of [c,g])assert.ok(x.story.some(s=>s.life?.title==='宫门旧识'));
 assert.match(selectionCohortHTML(c),/宫门旧识/);var stories=c.story.length;recordOldFriendAdmission(g);assert.equal(c.story.length,stories);`);
});
test('declining a candidate does not make her a palace friend or manufacture a meeting',()=>{
 const b=friends();b.run(`A.xxDrop(g.id);assert.equal(byId(g.id),undefined);assert.ok(!c.oldCourtFriends);assert.ok(!c.story.some(x=>x.t.includes('宫门旧识')));`);
});
test('old friend reactions respect jealousy, solitude and later unequal favor without automatic forgiveness',()=>{
 const b=friends();b.run(`c.trait='善妒';addConsort(g,2,'选秀入宫');assert.match(c.story.at(-1).t,/发涩/);
 c.solitary={path:'letters'};assert.equal(oldFriendFeeling(c,g).kind,'quiet');assert.match(oldFriendLaterThought(c,g),/清静/);delete c.solitary;
 c.trait='温婉';c.favor=15;g.favor=80;S.turn+=6;oldFriendLifeTick();assert.match(c.story.at(-1).t,/我虽眼热/);assert.match(g.story.at(-1).t,/家乡点心/);
 var len=c.story.length;oldFriendLifeTick();assert.equal(c.story.length,len);S.rel[rk(c,g)]=-35;assert.match(oldFriendLaterThought(c,g),/隔阂/);
 c.favor=g.favor=10;S.rel[rk(c,g)]=50;assert.match(oldFriendLaterThought(c,g),/别怕，我还陪着你/);
 c.favor=g.favor=80;assert.match(oldFriendLaterThought(c,g),/一盏茶/);`);
});
test('old acquaintance generation is bounded, skips relatives and time travelers, and never rerolls an existing roster',()=>{
 const b=friends();b.run(`g.kin[c.id]='亲妹';assert.equal(oldFriendEligible(g,c),false);g.kin={};g.timeTraveler={};assert.equal(oldFriendEligible(g,c),false);delete g.timeTraveler;
 genCands(12);assert.ok(S.cands.filter(x=>x.oldCourtFriend).length<=2);var data=JSON.stringify(S);viewXX();viewXX();assert.equal(JSON.stringify(S),data);`);
});
