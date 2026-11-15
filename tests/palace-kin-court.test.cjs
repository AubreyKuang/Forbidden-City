const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');

// Two consorts from different households, both fathers serving at court.
function world(rel,{blocs=['镇国大将军','两江总督'],seed=515}={}){
 const b=boot(seed);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=40;E().treasury=900;
 var a=harem()[0],z=harem()[1];delete a.solitary;delete z.solitary;
 a.fam={t:${JSON.stringify(blocs[0])},p:60};z.fam={t:${JSON.stringify(blocs[1])},p:60};delete a.house;delete z.house;
 var ha=houseOf(a),hz=houseOf(z);
 for(const p of [ha.father,hz.father]){p.alive=true;p.retired=false;delete p.commission;delete p.report;delete p.postReview;p.age=50;p.career='official';p.merit=50;p.story=[];}
 for(const h of [ha,hz])for(const r of brotherRoles(h)){h[r].career='student';}
 relAdd(a,z,${rel}-relGet(a,z));
 var fa=ha.father,fz=hz.father;
 var findEvent=kind=>{for(let i=0;i<60;i++){S.flags.kinCourt&&(S.flags.kinCourt.lastEvent=-99,S.flags.kinCourt.pairs={});const ev=kinCourtEvent();if(ev&&(!kind||ev.kinCourt===kind))return ev;}return null;};
 var stories=()=>[a,z,fa,fz].map(p=>p.story.length);`);
 return b;
}

test('friendly consorts: a serving father recommends the other, both families record it and the bond grows',()=>{
 const b=world(60);
 b.run(`assert.deepEqual(kinCourtPairs().map(p=>p.cause),['palace-friend']);
 var ev=findEvent('recommend');assert.ok(ev);assert.equal(ev.title,'同朝举荐');
 var target=ev.cast[1],actor=ev.cast[0];assert.ok([fa,fz].includes(target)&&[fa,fz].includes(actor)&&target!==actor);
 var before=relGet(a,z),counts=stories(),treasury=E().treasury;
 ev.onQueue();var result=ev.choices[0].f();assert.match(result,/领命/);
 assert.ok(target.commission,'the recommended official actually receives the commission');
 assert.equal(target.commission.recommendedBy,actor.id);assert.ok(E().treasury<treasury);
 assert.ok(relGet(a,z)>before,'help at court brings the consorts closer');
 [a,z,fa,fz].forEach((p,i)=>assert.ok(p.story.length>counts[i],'every party has a chronicle entry'));
 assert.ok(actor.story.at(-1).t.includes(target.name));assert.ok(target.story.at(-1).t.includes(actor.name));
 assert.ok(a.story.some(x=>x.t.startsWith('【前朝牵动·'+fullName(z)+'】')));assert.ok(z.story.some(x=>x.t.startsWith('【前朝牵动·'+fullName(a)+'】')));
 assert.equal(ev.choices[0].f(),null,'a resolved scene cannot be applied twice');
 assert.ok(S.flags.kinCourt.log.some(x=>x.kind==='recommend'&&x.delta>0));`);
});

test('hostile consorts: impeachment outcomes are written to both sides and never improve the relationship',()=>{
 for(const index of [0,1,2]){
  const b=world(-60);
  b.run(`assert.deepEqual(kinCourtPairs().map(p=>p.cause),['palace-foe']);
  var ev=findEvent('impeach');assert.ok(ev);assert.equal(ev.title,'同朝参本');assert.match(ev.text,/素有嫌隙/);
  var before=relGet(a,z),counts=stories();ev.choices[${index}].f();
  assert.ok(relGet(a,z)<before,'an impeachment pushes the consorts apart');
  [a,z,fa,fz].forEach((p,i)=>assert.ok(p.story.length>counts[i]));`);
 }
});

test('dead, retired, exiled, dismissed, studying or absent relatives are never put forward or impeached',()=>{
 for(const state of ['p.alive=false','p.retired=true','p.exiled=true','p.dismissed=true',"p.career='student'","p.commission={title:'巡察',due:S.turn+3}"]){
  const b=world(60);
  b.run(`var p=fz;${state};assert.equal(kinCourtPairs().length,0);assert.equal(findEvent(),null);
  S.flags.kinCourt={pairs:{},log:[]};for(let i=0;i<20;i++){S.flags.kinCourt.lastTick=-99;assert.equal(kinCourtTick(),null);}
  assert.ok(!fz.story.some(x=>/举荐|参劾|附议|指摘|讥讽/.test(x.t)));`);
 }
});

test('a scene already queued lapses if the official dies or the consort leaves before it is shown',()=>{
 let b=world(60);
 b.run(`var ev=findEvent('recommend');assert.equal(eventStillValid(ev),true);ev.cast[1].alive=false;assert.equal(eventStillValid(ev),false);assert.equal(ev.choices[0].f(),null);`);
 b=world(-60);
 b.run(`var ev=findEvent('impeach');z.cold=true;assert.equal(eventStillValid(ev),false);var before=relGet(a,z);assert.equal(ev.choices[0].f(),null);assert.equal(relGet(a,z),before);`);
 b=world(60);
 b.run(`var ev=findEvent('recommend');ev.cast[1].report={title:'旧差',outcome:'success',text:'待阅'};assert.equal(eventStillValid(ev),false);`);
});

test('sisters of one household are not set against their own father',()=>{
 const b=world(60);
 b.run(`var sister=makeKin(a,'亲');addConsort(sister,3,'姐妹入宫');delete sister.solitary;relAdd(a,sister,-80-relGet(a,sister));
 assert.ok(kinCourtPairs().every(p=>!(p.a===sister&&p.b===a)&&!(p.a===a&&p.b===sister)));`);
});

test('rival blocs only clash over a lapse already on record; a groundless clash is not invented',()=>{
 const b=world(0,{blocs:['皇商','内阁首辅']});
 b.run(`assert.deepEqual(kinCourtPairs().map(p=>p.cause),['court-rival']);
 assert.equal(findEvent('impeach'),null,'no recorded lapse, no impeachment');
 S.flags.kinCourt.lastTick=-99;for(let i=0;i<20;i++){S.flags.kinCourt.lastTick=-99;S.flags.kinCourt.pairs={};assert.equal(kinCourtTick(),null);}
 fz.report={title:'核查地方钱粮',outcome:'setback',text:'未尽如期'};
 var ev=findEvent('impeach');assert.ok(ev);assert.equal(ev.cast[0],fa);assert.equal(ev.cast[1],fz);
 assert.match(ev.text,/核查地方钱粮未尽如期/);assert.match(ev.text,/履历中确有记载/);`);
});

test('court shapes the palace: allies at court draw neutral consorts together; a clash can end an old friendship',()=>{
 let b=world(0,{blocs:['镇国大将军','两江总督']});
 b.run(`assert.deepEqual(kinCourtPairs().map(p=>p.cause),['court-ally']);var ev=findEvent('recommend');assert.ok(ev);assert.match(ev.text,/同属武将/);
 var before=relGet(a,z);ev.choices[0].f();assert.equal(relGet(a,z),before+10);`);
 b=world(40,{blocs:['皇商','内阁首辅']});
 b.run(`fa.report={title:'岁修河堤',outcome:'setback',text:'未尽如期'};fz.report={title:'整修常平仓',outcome:'setback',text:'未尽如期'};
 var ev=null;for(let i=0;i<200&&!ev;i++)ev=findEvent('impeach');assert.ok(ev,'friends from rival blocs may still clash over a real lapse');
 assert.match(ev.text,/本来交好/);ev.choices[1].f();assert.ok(relGet(a,z)<35);
 var accuser=ev.cast[0]===fa?a:z;assert.ok(accuser.story.some(x=>x.t.includes('从前的交情，自此隔了一层')));`);
});

test('monthly court ties record both households and move the relationship in the matching direction',()=>{
 for(const [rel,sign] of [[60,1],[-60,-1]]){
  const b=world(rel);
  b.run(`var t=null;for(let i=0;i<40&&!t;i++){S.flags.kinCourt&&(S.flags.kinCourt.lastTick=-99,S.flags.kinCourt.pairs={});var before=relGet(a,z),counts=stories();t=kinCourtTick();}
  assert.ok(t);assert.equal(Math.sign(relGet(a,z)-before),${sign});assert.equal(Math.sign(t.delta),${sign});
  [a,z,fa,fz].forEach((p,i)=>assert.ok(p.story.length>counts[i]));
  var turn=S.turn;assert.equal(kinCourtTick(),null,'the household pair rests before the next tie');S.turn=turn+KIN_COURT_TICK_GAP;
  assert.ok(!/undefined|NaN/.test(JSON.stringify(S.flags.kinCourt)));`);
 }
});

test('an official drawn into one court tie is not drawn into another for eight months',()=>{
 const b=world(60);
 b.run(`var t=null;for(let i=0;i<40&&!t;i++){S.flags.kinCourt&&(S.flags.kinCourt.lastTick=-99,S.flags.kinCourt.pairs={});t=kinCourtTick();}assert.ok(t);
 var start=S.turn;for(;S.turn<start+KIN_COURT_PERSON_GAP;S.turn++)for(let i=0;i<10;i++){S.flags.kinCourt.lastTick=-99;S.flags.kinCourt.pairs={};assert.equal(kinCourtTick(),null);}
 var again=null;for(let i=0;i<40&&!again;i++){S.flags.kinCourt.lastTick=-99;S.flags.kinCourt.pairs={};again=kinCourtTick();}assert.ok(again,'after the rest the households may meet again');
 assert.match(fa.story.concat(fz.story).map(x=>x.t).join(''),/./);assert.doesNotMatch(fa.story.concat(fz.story).map(x=>x.t).join(''),/「(?:内阁首辅|两江总督|镇国大将军|吏部尚书)」条陈/);`);
});

test('court ties are rare: at most one decision scene per eight months',()=>{
 const b=world(60);
 b.run(`var shown=[];for(let m=0;m<120;m++){S.turn++;var ev=kinCourtEvent();if(ev){ev.onQueue();shown.push(S.turn);}}
 assert.ok(shown.length>=3,'qualifying households do meet at court');assert.ok(shown.length<=15);
 for(let i=1;i<shown.length;i++)assert.ok(shown[i]-shown[i-1]>=KIN_COURT_EVENT_GAP);`);
});

test('older pending transcripts draw nothing and write nothing for court ties',()=>{
 const b=world(60);
 b.run(`S.pendingActions={version:4};var flags=JSON.stringify(S.flags.kinCourt||null),rel=relGet(a,z);`);
 b.force(.123456);
 b.run(`assert.equal(kinCourtEvent(),null);assert.equal(kinCourtTick(),null);assert.equal(R(),.123456,'no random draw was consumed');
 assert.equal(JSON.stringify(S.flags.kinCourt||null),flags);assert.equal(relGet(a,z),rel);delete S.pendingActions;`);
});

const legacy=require('./fixtures/kin-court-legacy-v4.json');
for(const fixture of legacy.cases)test('version 4 month-end transcript still replays exactly: '+fixture.name,()=>{
 const game=save=>{const b=withClock(boot(311,new Map([['chengongji_v1_auto',JSON.stringify(save)]])));b.ctx.assert=assert;return b;};
 let b=game(fixture.save);
 b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
 assert.equal(b.run('curEv.title'),fixture.save.pendingActions.pending.title);
 assert.equal(b.run('S.flags.kinCourt'),undefined);
 // The same transcript claimed as version 5 would now draw for court ties, so it cannot match.
 const relabelled=JSON.parse(JSON.stringify(fixture.save));relabelled.pendingActions.version=5;
 b=game(relabelled);b.run("A.load('auto');assert.equal(PalaceActions.blocked,true);");
});

test('the officials table lists real people with consort and heir links, filters, and court ties on the profile',()=>{
 const b=world(60);
 b.run(`var k={id:9001,name:'承瑞',sex:'m',mom:z.id,born:S.turn-60,alive:true,ord:1,story:[],seed:7};S.children.push(k);
 var ev=findEvent('recommend');ev.choices[0].f();
 A.go('officials');var html=officialsTable();
 assert.match(html,/<table class="official-table">/);assert.doesNotMatch(html,/undefined|NaN/);
 for(const p of [fa,fz])assert.ok(html.includes(p.name));
 assert.ok(html.includes("A.go('consort',"+z.id+")"),'jumps to the consort');assert.ok(html.includes("A.go('kid',9001)"),'jumps to her child');
 assert.ok(html.includes(blocName(houseOf(a).bloc)));assert.match(html,/举荐/);
 fz.alive=false;fz.death={kind:'illness',reason:'病故',d:dateStr()};
 A.officialsFilter('serving');assert.ok(!officialsTable().includes(fz.name+'</span>'));
 A.officialsFilter('gone');assert.ok(officialsTable().includes(fz.name));
 A.officialsFilter('nonsense');assert.equal(UI.officialsFilter,'gone');
 A.officialsBloc('army');assert.ok(officialsTable().includes(fa.name));A.officialsBloc('all');
 A.go('official',a.id+':father');var page=viewOfficial();assert.match(page,/同朝往来/);assert.ok(page.includes(fz.name));
 A.go('consort',z.id);assert.equal(UI.view,'consort');A.go('kid',9001);assert.equal(UI.view,'kid');assert.equal(UI.sel,9001);`);
});

test('list pages offer a way back to the page that opened them',()=>{
 const b=world(60);
 b.run(`A.go('home');A.go('officials');assert.match(officialsTable(),/← 返回御书房/);assert.ok(officialsTable().includes("A.go('home')"));
 A.go('government');A.go('officials');assert.match(officialsTable(),/← 返回治国理政/);
 A.go('official',a.id+':father');A.backPerson('officials');assert.equal(UI.view,'officials');assert.match(officialsTable(),/← 返回治国理政/,'a profile visit keeps the original origin');
 A.go('harem');A.openResidence();assert.match(viewResidences(),/← 返回后宫/);A.go('map');A.go('residences');assert.match(viewResidences(),/← 返回宫城/);
 UI.pageFrom={};assert.match(officialsTable(),/← 返回御书房/);`);
});
