const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./playtest-harness.cjs');
function world(sex='f',age=16){
 const b=boot(318);b.ctx.assert=assert;b.ctx.sex=sex;b.ctx.age=age;
 b.run(`A.start();drain();S.turn=300;S.year=26;S.month=4;E().age=45;E().energy=30;E().treasury=2000;S.children=[];
 var m=makeGirl({age:40,trait:'才女'});addConsort(m,3,'入宫');m.aff=85;m.hp=90;m.enteredAt=100;m.solitary={path:'both'};
 var f=makeGirl({age:39,trait:'温婉'});addConsort(f,3,'入宫');var k=makeKid(m,sex,'清和');k.born=S.turn-age*12;k.hp=90;k.amb=10;k.lit=70;k.mar=30;k.pendingName=false;k.immortalTalent='水灵根';k.foster=f.id;
 k.daoPractice={path:'dao',visits:6};PalaceActions.reset();`);return b;
}
test('ordinary travel rolls once per eligible month and can be requested without a spiritual root',()=>{
 const b=world();b.run(`k.immortalTalent=null;`);
 b.force(.02,0,0,0);
 b.run(`royalTravelTick();royalTravelTick();assert.equal(k.royalTravel,undefined);
  S.turn++;royalTravelTick();assert.equal(k.royalTravel.stage,'request');
  assert.match(pendingRoyalTravelEvent().title,/游历山河/);
  assert.equal(childInPalace(k),true);assert.equal(k.immortal,undefined);
  k.betrothal={};assert.equal(royalTravelEvent(k),null);delete k.betrothal;
  assert.equal(royalTravelEvent(k).choices[1].f(),'行期暂缓，孩子暂留京中。');
  assert.equal(royalTravelEvent(k),null);assert.equal(royalTravelAway(k),false);`);
});
test('travel stays separate from spiritual training and records departure, real letters and return for both mothers',()=>{
 let b=world();b.run(`k.immortalTalent=null;S.flags.dowager.alive=false;var kId=k.id,mId=m.id,fId=f.id;`);
 b.force(0,0,0);
 b.run(`royalTravelTick();A.endMonth();
  for(var i=0;i<30&&modalOpen&&curEv.title!=='皇嗣请行 · 游历山河';i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(o=>!o.cond||o.cond()));}
  assert.equal(curEv.title,'皇嗣请行 · 游历山河');save('1');`);
 b=boot(191,b.storage);b.ctx.assert=assert;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'皇嗣请行 · 游历山河');
  var k=S.children[0],m=byId(k.mom),f=fosterOf(k),cash=E().treasury;
  choose(0);assert.equal(E().treasury,cash-20);drain();assert.equal(k.immortal,undefined);assert.equal(immortalAway(k),false);
  assert.ok(royalJourneyAway(k));assert.equal(childInPalace(k),false);assert.equal(marriageEligible(k),false);assert.equal(templeEligible(k),false);
  assert.match(kidFamilyPanel(k),/离宫游历 · 齐地临淄/);assert.match(royalTravelPanel(k),/距约定归期还有半年/);
  assert.ok(m.story.some(e=>e.t.includes('【离宫游历】')));assert.ok(f.story.some(e=>e.t.includes('【离宫游历】')));
  assert.doesNotMatch(continuityPanel(m),/收到孩子的旅途家书/);
  var r=k.royalTravel;assert.equal(r.returnAt-r.departed,6);
  S.turn=r.departed+2;royalTravelTick();
  for(const c of [m,f])assert.match(continuityPanel(c),/收到孩子的旅途家书.*从齐地临淄/);
  S.turn=r.departed+4;royalTravelTick();assert.equal(childWhereabouts(k),'登州海滨');
  S.turn=r.returnAt-1;royalTravelTick();assert.equal(royalTravelAway(k),true);
  A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.includes('游历归来')));
  assert.equal(royalJourneyAway(k),false);assert.equal(childInPalace(k),true);assert.equal(k.royalTravel.stage,'returned');
  for(const c of [m,f])assert.ok(c.story.some(e=>e.t.includes('【游历归来】')&&e.t.includes('添了半盏茶')));`);
});

for(const itinerary of ['scriptures','east'])test('a five-year '+itinerary+' journey returns safely and offers two saved reforms',()=>{
 const b=world();b.run(`var r=k.royalTravel={stage:'request',due:S.turn,history:[],itinerary:'${itinerary}'};
  var route=royalItinerary(r),e=royalTravelEvent(k);assert.match(e.text,/五年后归来/);e.choices[0].f();assert.equal(r.returnAt-r.departed,60);
  S.turn=r.departed+route.stops[0][0];royalTravelTick();assert.equal(royalTravelAway(k),true);var oldMood=f.mood,hp=k.hp;`);
 b.force(0);
 b.run(`S.turn=r.departed+route.stops[1][0];royalTravelTick();assert.ok(f.mood<oldMood);assert.equal(k.hp,hp);assert.equal(k.alive,true);
  assert.match(continuityPanel(f),/收到孩子的旅途家书.*心一下悬了起来/);
  var e=pendingRoyalTravelEvent(),p=r.proposals.road,cash=E().treasury;
  assert.match(e.title,/旅途奏议/);assert.ok(e.text.includes(route.road[0]));assert.ok(e.choices.at(-1).f());
  assert.equal(p.decision,'declined');assert.equal(E().treasury,cash);
  S.turn=r.returnAt;S.flags.dowager.mourning={turn:S.turn,handled:true};royalTravelTick();assert.equal(r.stage,'returned');
  assert.equal(k.hp,hp);assert.equal(royalTravelAway(k),false);assert.equal(pendingRoyalTravelEvent(),null);
  S.turn++;var e=pendingRoyalTravelEvent();assert.ok(e.text.includes(route.home[0]));
  var wen=E().wen,wu=E().wu;assert.ok(e.choices[0].f());assert.equal(e.choices[0].f(),null);
  assert.equal(E().treasury,cash-route.home[2]);assert.equal(E().wen,wen);assert.equal(E().wu,wu);
  assert.equal(r.proposals.home.project.due,S.turn+6);assert.match(royalTravelPanel(k),/正在试办/);
  save('1');A.load('1');drain();var r=S.children[0].royalTravel;
  assert.equal(r.proposals.road.decision,'declined');assert.equal(r.proposals.home.decision,'adopted');assert.equal(pendingRoyalTravelEvent(),null);`);
});

for(const itinerary of ['scriptures','east'])test('an approved '+itinerary+' project delivers a specific report in a later month',()=>{
 let b=world(itinerary==='east'?'m':'f');b.run(`S.flags.dowager.alive=false;
  var kId=k.id,r=k.royalTravel={stage:'returned',itinerary:'${itinerary}',history:[],proposals:{home:{received:S.turn}}};
  A.royalTravelTalk(kId);assert.match(curEv.choices[0].t,/请孩子参与试办/);choose(0);drain();
  assert.equal(r.proposals.home.project.participate,true);
  S.turn=r.proposals.home.project.due-1;royalTravelTick();assert.equal(pendingRoyalTravelEvent(),null);
  A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.includes('游历奏议回报')));save('1');`);
 b=boot(191,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var k=S.children[0],r=k.royalTravel,project=r.proposals.home.project;
  assert.match(project.report,/${itinerary==='east'?'工部奏报.*海船':'译经院.*校'}/);
  assert.match(project.report,/清和亲自参与试办/);
  assert.equal(k.story.filter(e=>e.t.includes('游历奏议回报')).length,1);
  assert.match(royalTravelPanel(k),/看试办回报/);
  for(var i=0;i<30&&modalOpen&&curEv.title!=='游历奏议回报 · 清和';i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(o=>!o.cond||o.cond()));}
  assert.equal(curEv.title,'游历奏议回报 · 清和');choose(1);assert.equal(project.read,true);
  var cash=E().treasury;royalTravelTick();assert.equal(pendingRoyalTravelEvent(),null);assert.equal(E().treasury,cash);
  assert.equal(k.story.filter(e=>e.t.includes('游历奏议回报')).length,1);`);
});

test('travelers can work by letter and partial results settle less than full results',()=>{
 const b=world();b.run(`var r=k.royalTravel={stage:'traveling',itinerary:'east',departed:S.turn-20,returnAt:S.turn+40,stop:1,nextStop:2,lastLetter:S.turn,history:[],proposals:{road:{received:S.turn}}};
  var event=royalTravelEvent(k);assert.match(event.choices[0].t,/以书信协助/);
  var people=E().people,wen=E().wen,cash=E().treasury;event.choices[0].f();
  var project=r.proposals.road.project;assert.equal(E().treasury,cash-40);assert.equal(E().people,people);S.turn=project.due;`);
 b.force(.99);b.run(`royalTravelTick();
  assert.match(project.report,/船期仍被风向打乱/);assert.match(project.report,/清和从外地寄回手稿/);
  assert.equal(E().people,people+2);assert.equal(E().wen,wen+1);assert.equal(r.stage,'traveling');
  assert.equal(E().treasury,cash-40);`);
});

test('older completed payments get reports without crediting the project a second time',()=>{
 const b=world();b.run(`var r=k.royalTravel={stage:'returned',itinerary:'lu',history:[],proposals:{home:{decision:'adopted',decided:S.turn-4}}};
  var cash=E().treasury,wen=E().wen,people=E().people;`);
 b.force(0);b.run(`royalTravelTick();assert.match(royalTravelEvent(k).text,/两处县学都开了借书簿/);
  assert.match(royalTravelEvent(k).text,/承办官员按清和的原议/);
  assert.equal(E().treasury,cash);assert.equal(E().wen,wen);assert.equal(E().people,people);
  assert.equal(k.story.filter(e=>e.t.includes('游历奏议回报')).length,1);`);
});

test('the same pending report survives the proposing prince succeeding to the throne',()=>{
 const b=world('m');b.run(`S.flags.dowager.alive=false;
  k.royalTravel={stage:'returned',itinerary:'east',history:[],proposals:{home:{received:S.turn}}};
  A.royalTravelTalk(k.id);choose(1);drain();
  var due=k.royalTravel.proposals.home.project.due,id=k.id;
  succeed(k);choose(0,'承平');drain();
  assert.equal(E().travelProposer.id,id);assert.equal(royalById(id),undefined);
  delete S.flags.dowager.mourning;S.turn=due;royalTravelTick();
  var report=pendingRoyalTravelEvent();assert.match(report.text,/承办官员按清和的原议/);
  assert.equal(E().travelProposer.story.filter(e=>e.t.includes('游历奏议回报')).length,1);
  report.choices[1].f();assert.equal(pendingRoyalTravelEvent(),null);`);
});

test('a successful shipbuilding trial can fund a second batch and receive its delivery report',()=>{
 let b=world('m');b.run(`S.flags.dowager.alive=false;E().wu=35;
  var kId=k.id;k.royalTravel={stage:'returned',itinerary:'east',history:[],proposals:{home:{decision:'adopted',decided:S.turn-6,
   project:{due:S.turn,participate:true}}}};`);
 b.force(0);b.run(`royalTravelTick();
  A.royalTravelTalk(kId);var project=k.royalTravel.proposals.home.project;
  assert.equal(project.outcome,'complete');assert.match(curEv.text,/增造三艘海船/);
  assert.match(curEv.choices[0].t,/拨银推广/);assert.doesNotMatch(curEv.choices[0].t,/改进/);
  var cash=E().treasury,wu=E().wu;E().treasury=0;assert.equal(curEv.choices[0].cond(),false);
  assert.equal(curEv.choices[0].f(),null);assert.equal(project.expand,undefined);
  E().treasury=cash;choose(0);drain();assert.equal(E().treasury,cash-155);assert.equal(E().wu,wu);
  assert.match(royalTravelPanel(k),/正在推广/);S.turn=project.expand.due-1;royalTravelTick();
  assert.equal(pendingRoyalTravelEvent(),null);A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.includes('游历推广回报')));save('1');`);
 b=boot(191,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var k=S.children[0],project=k.royalTravel.proposals.home.project,report=pendingRoyalTravelEvent();
  assert.match(report.text,/三艘新造海船已经分批通过试航/);assert.match(royalTravelPanel(k),/已完成推广/);
  assert.equal(k.story.filter(e=>e.t.includes('游历推广回报')).length,1);
  assert.ok(project.expand.report.includes('武略+9'));drain();assert.equal(project.expand.read,true);
  var cash=E().treasury,wu=E().wu;S.turn++;royalTravelTick();assert.equal(pendingRoyalTravelEvent(),null);
  assert.equal(E().treasury,cash);assert.equal(E().wu,wu);`);
});

test('a partial translation trial lets the child propose a fix before expansion',()=>{
 const b=world();b.run(`E().wen=35;
  var kId=k.id;k.royalTravel={stage:'returned',itinerary:'scriptures',history:[],proposals:{home:{decision:'adopted',decided:S.turn-6,
   project:{due:S.turn}}}};`);
 b.force(.99);b.run(`royalTravelTick();var project=k.royalTravel.proposals.home.project;
  assert.equal(project.outcome,'partial');assert.equal(E().wen,38);
  var e=royalTravelEvent(k),cash=E().treasury;
  assert.match(e.text,/清和翻着簿册提议.*另请熟悉原文的通译复核/);
  assert.match(e.choices[0].t,/拨银改进/);assert.ok(e.choices[0].f());assert.equal(e.choices[0].f(),null);
  assert.equal(project.expand,undefined);assert.equal(E().treasury,cash-35);assert.equal(E().wen,38);
  S.turn=project.repair.due;royalTravelTick();assert.equal(E().wen,42);
  var e=royalTravelEvent(k);assert.match(e.title,/游历改进回报/);
  assert.match(e.text,/历法试算/);assert.match(e.text,/续译诸国的医书、历书和舆地图志/);
  assert.ok(e.choices[1].f());assert.equal(project.expand.declined,true);assert.equal(E().treasury,cash-35);
  assert.equal(royalTravelEvent(k),null);assert.equal(k.story.filter(e=>e.t.includes('游历改进回报')).length,1);`);
});

test('a previously read trial report still offers the right follow-up without replaying the trial',()=>{
 const b=world();b.run(`var route=ROYAL_TRAVEL_ITINERARIES.east;
  var project={due:S.turn-2,read:true,report:'旧奏报。'+route.home[4][3]};
  k.royalTravel={stage:'returned',itinerary:'east',history:[],proposals:{home:{decision:'adopted',project}}};
  var e=royalTravelEvent(k),cash=E().treasury;
  assert.match(e.title,/游历奏议续议/);assert.match(e.text,/第二艘船渗水处/);e.choices[1].f();
  assert.equal(project.repair.declined,true);assert.equal(royalTravelEvent(k),null);assert.equal(E().treasury,cash);`);
});

test('completed shipbuilding supplies reusable ships and voyages return once across reloads',()=>{
 let b=world();b.run(`S.flags.dowager.alive=false;
  k.royalTravel={stage:'returned',itinerary:'east',history:[],proposals:{home:{decision:'adopted',
   project:{outcome:'complete',read:true,report:'试办已回报。',expand:{read:true,report:'推广完毕。'}}}}};
  travelInstitutionTick();travelInstitutionTick();assert.equal(S.travelInstitutions.ships.length,3);
  assert.match(viewMinistries(),/水师船册.*靖海一号/s);
  A.travelShip(1);assert.match(curEv.title,/水师派遣/);var cash=E().treasury;choose(2);drain();
  var ship=S.travelInstitutions.ships[0];assert.equal(E().treasury,cash-26);
  assert.equal(ship.voyage.due,S.turn+5);A.travelShip(1);assert.equal(modalOpen,false);
  S.turn=ship.voyage.due-1;travelInstitutionTick();assert.equal(ship.voyage.returned,undefined);
  A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.startsWith('海船归报')));save('1');`);
 b=boot(191,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
  var ship=S.travelInstitutions.ships[0],k=S.children[0],cash=E().treasury;
  assert.match(pendingTravelInstitutionEvent().text,/国库已收到税银48万两/);
  assert.equal(k.story.filter(e=>e.t.includes('【海船归报】')).length,1);
  travelInstitutionTick();assert.equal(E().treasury,cash);
  drain();assert.equal(ship.voyage.read,true);assert.equal(pendingTravelInstitutionEvent(),null);
  A.travelShip(1);assert.match(curEv.title,/水师派遣/);`);
});

test('translated books can be opened in the palace and trigger a delayed consultation',()=>{
 const b=world();b.run(`S.flags.dowager.alive=false;
  k.royalTravel={stage:'returned',itinerary:'scriptures',history:[],proposals:{home:{decision:'adopted',
   project:{outcome:'complete',read:true,report:'试办已回报。',expand:{read:true,report:'推广完毕。'}}}}};
  travelInstitutionTick();UI.sel='wy';
  assert.match(viewPlace(),/译经院新藏.*《诸邦药录》.*《海西道里图志》.*《西域历日推步》/s);
  A.travelBook('calendar');assert.match(curEv.text,/连阴不能见，则记其阙/);choose(0);drain();
  var book=S.travelInstitutions.books.find(b=>b.key==='calendar');assert.equal(book.due,S.turn+2);
  S.turn++;assert.equal(pendingTravelInstitutionEvent(),null);
  A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title.startsWith('钦天监对历')));drain();
  assert.equal(book.decision,'adopted');assert.equal(pendingTravelInstitutionEvent(),null);
  assert.ok(k.story.some(e=>e.t.includes('【译书回报】')&&e.t.includes('官历底册')));
  A.travelBook('calendar');assert.equal(curEv.choices.length,1);`);
});

test('the proposer, both mothers and the birth mother’s own living relatives keep the concrete proposal',()=>{
 const b=world();b.run(`var h=houseOf(m);
  h.brother||={name:'长明',age:44,alive:true};h=houseOf(m);
  h.brother2||={name:'长宁',age:41,alive:false};h.brother2.alive=false;h=houseOf(m);
  k.royalTravel={stage:'returned',itinerary:'east',history:[],proposals:{home:{received:S.turn}}};
  noteRoyalTravelProposal(k,'home');noteRoyalTravelProposal(k,'home');
  assert.equal(k.story.filter(e=>e.t.includes('【游历献策】')&&e.t.includes('先试造两条船')).length,1);
  for(const mother of [m,f])assert.ok(mother.story.some(e=>e.t.includes('先试造两条船')&&e.t.includes('骄傲')));
  assert.ok(h.father.story.some(e=>e.t.includes('外公')&&e.t.includes('支持')||e.t.includes('写信赞成')));
  assert.ok(h.brother.story.some(e=>e.t.includes('舅舅')&&e.t.includes('写信表示支持')));
  assert.ok(!h.brother2.story.some(e=>e.t.includes('【游历献策】')));
  assert.match(familyHouseTree(m,true),/外家游历纪事.*先试造两条船/s);`);
});

test('an old route honors its existing promised return and a two-year itinerary uses its own clock',()=>{
 const b=world();b.run(`k.royalTravel={stage:'traveling',route:0,stop:1,departed:S.turn-17,due:S.turn+1,extended:true,history:[]};
  royalTravelTick();assert.equal(royalTravelAway(k),true);S.turn++;royalTravelTick();assert.equal(k.royalTravel.stage,'returned');
  k.royalTravel={stage:'request',itinerary:'rivers',due:S.turn,history:[]};var e=royalTravelEvent(k);
  assert.match(e.text,/两年后归来/);e.choices[0].f();assert.equal(k.royalTravel.returnAt-S.turn,24);
  assert.match(ROYAL_TRAVEL_ITINERARIES.rivers.stops[1][2],/君向潇湘我向秦/);`);
});

function travelFamily(){
 const b=world();b.run(`k.foster=null;
 var addTraveler=(mom,sex,name)=>{const child=makeKid(mom,sex,name);child.born=k.born;child.hp=90;child.pendingName=false;return child;};
 var p=addTraveler(f,'f','昭宁'),q=addTraveler(m,'m','元朗');
 S.rel[rk(k,p)]=50;S.rel[rk(k,q)]=40;S.rel[rk(p,q)]=0;S.rel[rk(m,f)]=-55;
 var roll=Math.random;`);return b;
}
test('both sexes can request and leave concurrently, including while another household member is abroad',()=>{
 const b=travelFamily();
 b.run(`S.rel[rk(k,p)]=S.rel[rk(k,q)]=0;
  Math.random=()=>0;royalTravelTick();Math.random=roll;
  assert.deepEqual(pendingRoyalTravelEvents().map(e=>e.por.id),[k.id,p.id,q.id]);
  royalTravelEvent(k).choices[0].f();royalTravelEvent(p).choices[1].f();
  var last=addTraveler(f,'m','清明');S.rel[rk(last,q)]=S.rel[rk(last,k)]=S.rel[rk(last,p)]=0;
  S.turn++;Math.random=()=>0;royalTravelTick();Math.random=roll;
  assert.ok(royalTravelAway(k));assert.equal(p.royalTravel.due,S.turn+5);assert.equal(last.royalTravel.stage,'request');
  for(const c of [last,q])assert.ok(royalTravelEvent(c).choices[0].f());assert.equal([k,last,q].filter(royalTravelAway).length,3);`);
});
test('a joint petition survives reload and records shared letters, mothers making peace, ritual and one return proposal',()=>{
 let b=travelFamily();b.run(`Math.random=()=>0;royalTravelTick();Math.random=roll;
  assert.equal(travelInvitee(k).id,p.id);assert.equal(p.royalTravel,undefined);
  assert.equal(pendingRoyalTravelEvents().length,2);S.flags.immortalPace={last:S.turn,lastOffer:S.turn};S.flags.dowager.alive=false;PalaceActions.reset();A.endMonth();
  for(let i=0;modalOpen&&curEv.title!=='皇嗣请行 · 手足同游'&&i<120;i++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'皇嗣请行 · 手足同游');assert.match(curEv.text,/昭宁/);save('1');`);
 b=boot(21,b.storage);b.ctx.assert=assert;b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var [k,p,q]=S.children;
  var cash=E().treasury;choose(0);assert.equal(cash-E().treasury,40);drain();
  var m=byId(k.mom),f=byId(p.mom),r=k.royalTravel,rr=p.royalTravel;assert.equal(travelSibling(p),k);
  assert.equal(rr.returnAt,r.returnAt);assert.equal(childInPalace(p),false);assert.match(royalTravelPanel(p),/清和结伴/);
  for(const c of [m,f,k,p])assert.equal(c.story.filter(e=>e.t.startsWith('【手足同行】')).length,1);
  assert.match(m.story.find(e=>e.t.startsWith('【手足同行】')).t,/姜糖/);
  assert.match(f.story.find(e=>e.t.startsWith('【手足同行】')).t,/追到门边/);
  assert.match(monthlyGrainEvent(LOCUST_INDEX,{}).choices.find(o=>o.t==='设坛祭天').f(),/清和与昭宁尚在齐地临淄/);
  assert.equal(siblingTravelRite(),'');for(const c of [m,f,k,p])assert.equal(c.story.filter(e=>e.t.startsWith('【在外逢祭】')).length,1);
  S.turn=r.departed+2;var before=relGet(m,f);royalTravelTick();assert.equal(relGet(m,f),before+10);
  for(const c of [m,f])assert.equal(c.story.filter(e=>e.t.startsWith('【同行家书】')&&e.t.includes('下次信到了')).length,1);
  for(const c of [k,p])assert.equal(c.story.filter(e=>e.t.startsWith('【同行家书】')&&e.t.includes('两人署名')).length,1);
  assert.match(continuityPanel(f),/收到孩子的旅途家书/);save('2');`);
 b=boot(4,b.storage);b.ctx.assert=assert;b.run(`A.load('2');var [k,p]=S.children,m=byId(k.mom),f=byId(p.mom),r=k.royalTravel;
  var before=relGet(m,f);royalTravelTick();assert.equal(relGet(m,f),before);assert.equal(k.royalTravel.lastLetter,p.royalTravel.lastLetter);
  S.turn=r.departed+4;royalTravelTick();assert.equal(childWhereabouts(p),'登州海滨');assert.equal(relGet(m,f),before);
  A.royalTravelRecall(p.id);assert.match(curEv.text,/两人一同/);choose(0);drain();
  for(const c of [m,f,k,p])assert.equal(c.story.filter(e=>e.t.startsWith('【携手归京】')).length,1);
  assert.equal(royalTravelAway(k)||royalTravelAway(p),false);assert.ok(r.proposals.home);assert.equal(p.royalTravel.proposals,undefined);
  assert.equal(siblingTravelRite(),'');`);
});
test('cross-sex friends can pair, unrelated or estranged children cannot, and refusal and solo approval release the companion',()=>{
 for(const choice of [1,2,3]){
  const b=travelFamily();b.run(`S.rel[rk(k,p)]=-45;requestRoyalTravel(k);Math.random=()=>0;inviteTravelSiblings([k]);Math.random=roll;
   assert.equal(travelInvitee(k),q);var e=royalTravelEvent(k),cash=E().treasury;
   S.rel[rk(k,q)]=24;assert.equal(e.valid(),false);assert.equal(royalTravelEvent(k).cast,undefined);S.rel[rk(k,q)]=50;
   assert.ok(e.choices[${choice}].f());assert.equal(royalTravelAway(q),false);
   ${choice===2?"assert.equal(royalTravelEvent(k),null);S.turn+=6;assert.match(royalTravelEvent(k).title,/手足同游/);":
    "assert.equal(travelInvitee(k),null);assert.equal(E().treasury,cash-"+(choice===1?20:0)+");"}`);
 }
});
