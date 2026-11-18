const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(sex='f',age=12){
 const b=boot(318);b.ctx.assert=assert;b.ctx.sex=sex;b.ctx.age=age;
 b.run(`A.start();drain();S.turn=300;S.year=26;S.month=1;E().age=45;E().energy=30;E().treasury=2000;S.children=[];
 var m=makeGirl({age:40,trait:'才女'});addConsort(m,3,'入宫');m.hp=90;m.solitary={path:'both'};
 var f=makeGirl({age:39,trait:'温婉'});addConsort(f,3,'入宫');
 var k=makeKid(m,sex,'昭瑶');k.born=S.turn-age*12;k.hp=90;k.amb=10;k.lit=40;k.mar=30;k.vir=40;k.love=40;k.pendingName=false;
 k.immortalTalent='冰灵根';k.foster=f.id;k.temperament='自矜';k.daoPractice={path:'dao',visits:6};
 immortalDiscover(k);PalaceActions.reset();`);return b;
}
function stay(b){b.run(`A.immortalTalk(k.id);assert.match(curEv.title,/仙师来访/);choose(1);drain();`);}

test('waiting for adulthood keeps six-month lessons without another first invitation',()=>{
 const b=world();stay(b);b.run(`assert.equal(k.immortal.stage,'invited');assert.equal(k.immortal.due,306);
 assert.match(k.story.at(-1).t,/满十六岁再谈启程/);assert.equal(immortalEvent(k),null);
 S.turn+=5;assert.equal(immortalEvent(k),null);S.turn++;
 var lesson=immortalEvent(k);assert.equal(lesson.title,'宫中修习 · 一招一息');
 assert.doesNotMatch(lesson.text,/受国师相邀来访|年纪尚小|我愿从普通弟子做起/);
 assert.match(lesson.text,/不必只挑好听的说/);assert.equal(lesson.choices.length,2);
 var before=k.lit;lesson.choices[0].f();assert.equal(k.lit,before+2);
 assert.equal(k.immortal.stage,'invited');assert.equal(immortalAway(k),false);assert.equal(k.immortal.due,312);
 assert.equal(lesson.choices[0].f(),null);assert.equal(k.lit,before+2);`);
});

test('all eight half-year topics occur before any repetition and keep the actual teacher and route',()=>{
 for(const route of ['sword','cloud']){
  const b=world();stay(b);b.ctx.route=route;b.run(`k.immortal.route=route;k.immortal.adultDiscussed=true;
  var seen=new Set(),words=[];
  for(var i=0;i<8;i++){
   S.turn=k.immortal.due;var e=immortalEvent(k);assert.ok(e.title.startsWith('宫中修习'));
   assert.equal(seen.has(e.title),false);seen.add(e.title);words.push(e.text);e.choices[0].f();
  }
  assert.equal(k.immortal.palaceLessons,8);assert.equal(seen.size,8);
  assert.match(words.join(''),route==='sword'?/云岑真人/:/照玄道长/);
  assert.doesNotMatch(words.join(''),route==='sword'?/照玄道长|云岫山水图/:/云岑真人|华山山路图/);
  assert.equal(k.immortal.stage,'invited');`);
 }
});

test('each topic has eight distinct personality responses and rendering never changes state or rolls',()=>{
 const b=world();stay(b);b.run(`S.turn=k.immortal.due;
 for(var i=0;i<8;i++){
  k.immortal.palaceLessons=i;var lines=new Set();
  for(var temperament of IMMORTAL_PALACE_DISPOSITIONS){
   k.temperament=temperament;var before=JSON.stringify(S);var e=immortalEvent(k);lines.add(e.text);
   immortalPanel(k);immortalHall();assert.equal(JSON.stringify(S),before);assert.doesNotMatch(e.text,/undefined/);
  }
  assert.equal(lines.size,8);
 }
 var old=Math.random;Math.random=()=>{throw Error('render consumed a roll');};
 immortalEvent(k);immortalPanel(k);immortalHall();Math.random=old;`);
});

test('the sixteenth birthday has its own decision and continued study has fresh lessons',()=>{
 const b=world('f',15);b.run('k.born-=11;');stay(b);b.run(`assert.equal(k.immortal.due,S.turn+1);
 S.turn++;assert.equal(kidAge(k),16);var e=immortalEvent(k);assert.equal(e.title,'山门再约 · 成年问志');
 assert.match(e.text,/当年暂留京中/);assert.equal(immortalAway(k),false);
 e.choices[1].f();assert.equal(k.immortal.adultDiscussed,true);assert.equal(k.immortal.due,S.turn+6);
 S.turn+=6;assert.match(immortalEvent(k).title,/宫中修习/);assert.equal(immortalAway(k),false);`);
});

test('a child who initially deferred as an adult gets lessons rather than another invitation',()=>{
 const b=world('f',18);stay(b);b.run(`S.turn+=6;assert.match(immortalEvent(k).title,/宫中修习/);`);
});

test('adults can revisit departure from a lesson, pay once and continue the original two-year journey',()=>{
 const b=world('f',17);stay(b);b.run(`S.turn+=6;var cash=E().treasury;A.immortalTalk(k.id);
 choose(curEv.choices.findIndex(c=>c.t.includes('另谈')));assert.equal(curEv.title,'山门再约 · 重议行程');
 var e=curEv;choose(0);assert.equal(k.immortal.stage,'learning');assert.equal(E().treasury,cash-30);
 assert.equal(e.choices[0].f(),null);assert.equal(E().treasury,cash-30);drain();
 S.turn+=12;immortalEvent(k).choices[0].f();assert.equal(k.immortal.stage,'trial');
 S.turn+=12;immortalEvent(k).choices[0].f();assert.equal(k.immortal.stage,'sect');`);
});

for(const change of ['S.heir=k.id','k.married=true','k.spouse={name:"未央"}','k.hp=40','E().treasury=20']){
 test('renewed adulthood decision respects departure restrictions: '+change,()=>{
  const b=world('m',15);stay(b);b.run(`S.turn+=12;k.immortal.due=S.turn;${change};
  var e=immortalEvent(k);assert.match(e.title,/成年问志/);var cash=E().treasury;
  assert.equal(e.choices[0].cond(),false);assert.equal(e.choices[0].f(),null);
  assert.equal(k.immortal.stage,'invited');assert.equal(E().treasury,cash);`);
 });
}

test('permanently declining the renewed invitation stores the past without further lessons',()=>{
 const b=world('f',15);stay(b);b.run(`S.turn+=12;var e=immortalEvent(k);e.choices[2].f();
 assert.equal(k.immortal.stage,'closed');S.turn+=24;assert.equal(immortalEvent(k),null);
 assert.equal(k.immortal.root,'冰灵根');assert.match(k.story.at(-1).t,/各有归处/);`);
});

test('sick children receive alternating restful scenes without weapons, healing or skipped normal lessons',()=>{
 const b=world();stay(b);b.run(`k.immortal.route='sword';k.hp=40;var hp=k.hp;var titles=new Set();
 for(var i=0;i<2;i++){
  S.turn=k.immortal.due;var e=immortalEvent(k);titles.add(e.title);
  assert.match(e.text,/身体不适|静养/);assert.doesNotMatch(e.text,/陪练|踏上|下山/);e.choices[0].f();
 }
 assert.equal(titles.size,2);assert.equal(k.hp,hp);assert.equal(k.immortal.palaceLessons,undefined);
 k.hp=90;S.turn=k.immortal.due;assert.equal(immortalEvent(k).title,'宫中修习 · 一招一息');`);
});

test('child, birth mother and foster mother can reconstruct the same local lesson',()=>{
 const b=world();stay(b);b.run(`S.turn+=6;immortalEvent(k).choices[1].f();
 for(var p of [k,m,f])assert.match(p.story.at(-1).t,/昭瑶.*一招一息|一招一息.*昭瑶/);
 assert.match(m.story.at(-1).t,/默默替孩子理好书页/);assert.match(f.story.at(-1).t,/亲手照护/);
 for(var p of [m,f])assert.doesNotMatch(p.story.at(-1).t,/山门里的名望|几时能再有音信|送走/);
 m.alive=false;var n=m.story.length;S.turn+=6;immortalEvent(k).choices[0].f();
 assert.equal(m.story.length,n);assert.match(f.story.at(-1).t,/书页疑处/);`);
});

for(const change of ['k.alive=false','k.jailed=true','k.away=true','k.removedFromRoyal=true','k.templeStay={}','k.hp=40','S.turn++']){
 test('opened local lessons cannot reward stale or unavailable people: '+change,()=>{
  const b=world();stay(b);b.run(`S.turn+=6;var e=immortalEvent(k),n=k.story.length,lit=k.lit;${change};
  assert.equal(e.valid(),false);assert.equal(e.choices[0].f(),null);assert.equal(k.story.length,n);assert.equal(k.lit,lit);`);
 });
}

test('two independently prepared copies of a lesson cannot reward the same progress twice',()=>{
 const b=world();stay(b);b.run(`S.turn+=6;var a=immortalEvent(k),b=immortalEvent(k);a.choices[0].f();
 S.turn+=6;var lit=k.lit;assert.equal(b.choices[0].f(),null);assert.equal(k.lit,lit);`);
});

test('underage deferral is not a refusal requiring an immediate royal-son appeal',()=>{
 const b=world('m',13);stay(b);b.run(`assert.equal(k.immortal.travelAppeal,undefined);S.turn++;
 assert.equal(immortalTravelPetition(k),null);assert.equal(immortalEvent(k),null);
 S.turn+=5;assert.match(immortalEvent(k).title,/宫中修习/);`);
});

test('a genuine refusal still has its appeal and a deferred appeal leads into local lessons',()=>{
 const b=world('m',18);b.run(`A.immortalTalk(k.id);choose(curEv.choices.findIndex(c=>c.t.includes('皇子不可远行')));drain();S.turn++;
 A.immortalTalk(k.id);assert.equal(curEv.title,'皇子远行 · 再请圣裁');choose(2);drain();
 assert.equal(k.immortal.travelAppeal.resolved,true);S.turn+=6;assert.match(immortalEvent(k).title,/宫中修习/);`);
});

test('plain old invited saves need no new fields and render without mutating their world',()=>{
 const b=world();b.run(`k.immortal.stage='invited';k.immortal.due=S.turn;
 var before=JSON.stringify(S);assert.match(immortalEvent(k).title,/宫中修习/);
 assert.equal(JSON.stringify(S),before);immortalEvent(k).choices[1].f();assert.equal(k.immortal.palaceLessons,1);`);
});

test('a pending lesson and its answered result both survive fresh-context reloads exactly once',()=>{
 let b=world();stay(b);b.run(`S.turn+=6;A.immortalTalk(k.id);save('auto');`);
 const text=b.run('curEv.text');b=boot(920,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var k=S.children[0];`);assert.equal(b.run('curEv.text'),text);
 b.run(`choose(0);save('auto');`);const lit=b.run('k.lit');
 b=boot(921,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);
 var k=S.children[0];assert.equal(k.immortal.palaceLessons,1);drain();assert.equal(k.story.filter(e=>e.t.includes('【一招一息】')).length,1);
 S.turn=k.immortal.due;A.immortalTalk(k.id);assert.equal(curEv.title,'宫中修习 · 书页疑处');`);
 assert.equal(b.run('k.lit'),lit);
});

test('the actual monthly queue offers a new lesson after six months and reloads the same scene',()=>{
 let b=world('f',14);stay(b);b.run(`var seen=[];
 for(var month=0;month<6;month++){
  A.endMonth();for(var n=0;modalOpen&&n<150;n++){
   if(curEv?.title?.startsWith('宫中修习')){seen.push(curEv.title);break;}
   if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));
  }
 }
 assert.deepEqual(seen,['宫中修习 · 一招一息']);assert.equal(k.immortal.stage,'invited');save('auto');`);
 b=boot(922,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
 assert.equal(curEv.title,'宫中修习 · 一招一息');choose(0);assert.equal(S.children[0].immortal.palaceLessons,1);`);
});

for(const version of [49,50,51])for(const [name,payload] of Object.entries(require(`./fixtures/immortal-lessons-legacy-v${version}.json`))){
 test('published v'+version+' '+name+' restores its original scene before new lessons take over',()=>{
  const b=boot(318,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;
  b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,${version});
  assert.equal(immortalPalaceLessonsEnabled(),false);if(!modalResult)choose(1);drain();
  assert.equal(PalaceActions.contentVersion,70);var k=S.children.find(k=>k.name==='昭瑶');
  S.turn=k.immortal.due;A.immortalTalk(k.id);assert.match(curEv.title,/宫中修习/);
  save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/宫中修习/);`);
 });
}
