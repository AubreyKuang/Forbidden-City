const {test}=require('node:test'),assert=require('node:assert/strict'),{world:base}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');
function world(){const w=base();w.ctx.assert=assert;return w;}
test('cards expose the direct audience below cards without rolling or spending energy',()=>{const w=world();w.run(`var before=JSON.stringify(S);Math.random=()=>{throw Error('view rolled')};assert.match(viewCards(),/宫女留侍/);assert.ok(viewCards().indexOf('宫女留侍')>viewCards().indexOf('class="pais"'));assert.equal(JSON.stringify(S),before);`);});
test('an explicit audience works during ambient cooldown and at a crowded court',()=>{const w=world();w.run(`S.flags.lastMaidEncounter=S.turn;S.flags.haremRestraint={gen:S.gen,pauseUntil:S.turn+12};var energy=E().energy;A.maidAudience();choose(0);assert.match(curEv.title,/召见宫女/);assert.ok(curEv.por.age>=18);assert.equal(E().energy,energy);choose(0);assert.equal(E().energy,energy-1);assert.equal(maids().length,1);assert.ok(maids()[0].nights>=1);drain();`);});
test('declining and reopening keeps the same candidate, including pending reload',()=>{let w=world();w.run(`A.maidAudience();choose(0);`);const id=w.run('curEv.por.id');w=boot(701,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.por.id,${id});choose(1);drain();A.maidAudience();choose(0);assert.equal(curEv.por.id,${id});assert.equal(maids().length,0);`);});
test('returning maids stay anonymous until one is randomly summoned; the meeting resumes with the same maid',()=>{
 let w=world();w.run(`var first=newMaid('尚衣局'),second=newMaid('尚衣局');for(var g of [first,second]){g.age=22;g.nights=2;g.near=false;g.preg=0;g.recovery={kind:'birth',turn:S.turn,until:S.turn+3};}PalaceActions.reset();A.maidAudience();assert.equal(curEv.choices.filter(c=>c.t.includes('旧识')).length,1);for(var g of [first,second])assert.ok(curEv.choices.every(c=>!c.t.includes(fullName(g))));`);
 w.force(.99);const id=w.run('maidAudienceRoster().at(-1).id');w.run(`choose(0);assert.equal(curEv.por.id,${id});assert.ok(curEv.title.includes(fullName(curEv.por)));assert.equal(curEv.choices[0].cond(),false);assert.match(curEv.choices[0].why,/静养|产后/);`);
 w=boot(701,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.por.id,${id});choose(2);drain();for(var g of maidAudienceRoster()){delete g.recovery;g.cardWithdrawn=true;}A.maidAudience();choose(0);assert.equal(curEv.choices[0].cond(),false);`);
});
test('new-maid night and morning arrangements reload without adding a second person or charging twice',()=>{let w=world();w.run(`A.maidAudience();choose(0);choose(0);`);const energy=w.run('E().energy'),id=w.run('maids()[0].id');w=boot(218,w.storage);w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(maids().length,1);assert.equal(E().energy,${energy});drain();assert.equal(S.consorts.filter(g=>g.id===${id}).length,1);`);});
test('monthly encounter checks its twenty-five-percent gate and six-month cooldown',()=>{const w=world();w.run(`S.flags.lastMaidEncounter=60;S.turn=65;Math.random=()=>0;assert.equal(monthlyMaidEvent(),null);S.turn=66;Math.random=()=>.25;assert.equal(monthlyMaidEvent(),null);`);});

test('monthly gate accepts just under 25 percent and garden includes its full quarter interval',()=>{const w=world();w.force(.249);w.run(`assert.ok(monthlyMaidEvent());`);w.force(.749);w.run(`A.out('garden');assert.equal(curEv.title,'宫女');choose(2);drain();S.turn+=5;assert.equal(maidEncounterReady(),false);S.turn++;assert.equal(maidEncounterReady(),true);`);w.force(.75);w.run(`A.out('garden');assert.equal(curEv.title,'御花园');`);});
test('genuine published v29 garden encounter keeps its old cooldown until completion',()=>{const payload=require('./fixtures/maid-encounter-legacy-v29.json'),w=boot(229,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,29);assert.equal(curEv.title,'宫女');choose(2);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);S.turn+=5;assert.equal(maidEncounterReady(),false);S.turn++;assert.equal(maidEncounterReady(),true);`);});

test('a pregnancy after sending a maid back is announced once in the new month and survives reload',()=>{
 const w=world();w.run('A.maidAudience();choose(0);');
 w.force(.2376181826,.6413819692,.5583668493,.8159323614,.0499424019,.6126509556,.0678740593,.3046474559);w.run(`choose(0);var g=maids()[0],id=g.id,start=S.turn;assert.equal(g.preg,1);
 choose(1);assert.equal(curEv.title,'天明');choose(3);drain();
 assert.equal(g.maid,true);assert.equal(g.near,false);assert.equal(g.palace,'尚衣局');assert.equal(g.maidReturnedAt,start);assert.doesNotMatch(consortNightReason(g),/孕/);
 assert.ok(!g.story.some(x=>x.t.includes('诊出身孕')));assert.ok(!S.log.some(x=>x.t.includes('尚衣局来报')));
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);
 A.endMonth();assert.equal(S.turn,start+1);assert.equal(curEv.title,'尚衣局来报 · 喜脉');
 assert.match(curEv.text,/上月侍寝.*回了尚衣局/);
 assert.equal(byId(id).story.find(x=>x.t.startsWith('【尚衣局来报】')).d,dateStr());
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'尚衣局来报 · 喜脉');
 assert.equal(S.log.filter(x=>x.t.includes('尚衣局来报')).length,1);choose(1);drain();
 assert.equal(byId(id).prot,true);assert.equal(byId(id).maid,true);assert.equal(byId(id).preg,2);`);
});

test('sending a maid back without conception does not manufacture a pregnancy report',()=>{
 const w=world();w.run('A.maidAudience();choose(0);');
 w.force(.95,.95);w.run(`choose(0);var g=maids()[0];assert.equal(g.preg,0);choose(1);choose(3);drain();
 assert.equal(g.maidReturnedAt,undefined);A.endMonth();assert.ok(![curEv,...Q].some(x=>x?.title.includes('尚衣局来报')));
 drain();assert.equal(g.preg,0);assert.ok(!S.log.some(x=>x.t.includes('尚衣局来报')));`);
});

test('the commander reports a favored maid pregnancy once and the original care decision survives reload',()=>{
 let w=world();w.run(`E().energy=20;E().treasury=1000;A.establishJinyiwei();choose(0);drain();A.maidAudience();choose(0);`);
 w.force(.2376181826,.6413819692,.5583668493,.8159323614,.0499424019,.6126509556,.0678740593,.3046474559);
 w.run(`choose(0);var g=maids()[0],id=g.id;assert.equal(g.preg,1);choose(1);choose(3);drain();A.endMonth();
  assert.equal(curEv.title,'锦衣卫急报 · 宫女有孕');save('auto');`);
 const id=w.run('id');w=boot(730,w.storage);w.ctx.assert=assert;w.ctx.maidId=id;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'锦衣卫急报 · 宫女有孕');
  choose(0);assert.equal(curEv.title,'尚衣局来报 · 喜脉');choose(1);drain();assert.equal(byId(maidId).prot,true);
  assert.equal(S.log.filter(x=>x.t.includes('尚衣局来报')).length,1);`);
});

test('a genuine v87 pregnancy scene completes without inserting a new report into the old transcript',()=>{
 const payload=require('./fixtures/maid-pregnancy-legacy-v87.json'),w=boot(731,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,87);
  assert.equal(curEv.title,'尚衣局来报 · 喜脉');choose(1);drain();assert.equal(PalaceActions.contentVersion,PalaceActions.releaseVersion);`);
});

test('only a previously favored maid has the attendant report, without a mistress or a plea for a visit',()=>{
 const w=world();w.run(`var g=newMaid('尚衣局');g.xin={k:'委屈',t:S.turn};assert.equal(XEV.委屈(g),null);
 g.nights=1;var ev=xinEvent();assert.equal(ev.por,g);assert.match(ev.text,/内侍来报.*曾承宠的宫女.*伤心.*落泪/);
 assert.doesNotMatch(ev.text,/小主|姑姑|求陛下去/);assert.equal(ev.present.length,0);
 assert.equal(ev.choices.length,1);assert.equal(ev.choices[0].t,'知道了');
 var e=E().energy;pushEv(ev);choose(0);assert.equal(E().energy,e);
 assert.match(g.story.at(-1).event.situation,/内侍来报/);
 assert.match(XEV.委屈(empress()).text,/掌事姑姑.*小主/);`);
});

function maidDisputeWorld(){
 const w=world();
 w.run(`var queen=empress();queen.trait='温婉';
  for(const c of harem()){c.favor=75;c.scheme=12;if(c!==queen)c.trait='温婉';}
  var rival=makeGirl({sur:'宋',given:'婉宁',age:26,trait:'善妒'});addConsort(rival,3,'入宫');
  rival.favor=10;rival.hp=95;delete rival.solitary;
  var maid=(name,trait='温婉')=>{
   const g=newMaid('尚衣局');g.sur='许';g.given=name;g.age=22;g.trait=trait;g.hp=95;
   g.nights=1;g.imperialNights=[S.turn-1];g.favor=30;return g;
  };
  var g=maid('绮云');PalaceActions.reset();`);
 return w;
}

test('a current maid’s real favor can rarely cause a dispute and several such maids raise the monthly chance',()=>{
 const w=maidDisputeWorld();
 w.run(`var random=Math.random;Math.random=()=>.025;assert.equal(maidFavorDispute(),null);
  Math.random=()=>.024;var ev=maidFavorDispute();assert.equal(ev.por,g);assert.match(ev.text,/在廊下拦住.*行礼不周/);
  assert.equal(S.flags.lastMaidFavorDispute,undefined);
  Math.random=random;var second=maid('令秋');second.favor=29;
  Math.random=()=>.04;ev=maidFavorDispute();assert.equal(ev.por,g);assert.match(ev.text,/不止一位宫女/);
  Math.random=()=>.05;assert.equal(maidFavorDispute(),null);
  g.favor=60;Math.random=()=>.06;assert.ok(maidFavorDispute());
  pushEv(maidFavorDispute());assert.equal(S.flags.lastMaidFavorDispute,S.turn);
  Math.random=()=>0;assert.equal(maidFavorDispute(),null);drain();
  S.turn+=12;g.imperialNights=second.imperialNights=[S.turn-4];assert.equal(maidFavorDispute(),null);
  g.imperialNights=[S.turn-1];g.maid=false;assert.equal(maidFavorDispute(),null);
  g.maid=true;rival.homeLeave={from:S.turn,due:S.turn+1};assert.equal(maidFavorDispute(),null);`);
});

test('personality changes the reaction and Queen’s judgement, while a vacant throne still lets the Emperor decide',()=>{
 const w=maidDisputeWorld();
 w.run(`g.favor=65;g.trait='骄矜';g.mood=60;rival.trait='城府';
  g.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>mulberry32(voiceHash('maid-favor-pride:'+seed))()<.28);
  var ev=maidFavorDisputeEvent(g,rival,queen,false);
  assert.match(ev.text,/交接簿.*旧页从头重抄/);assert.match(ev.text,/抿嘴一笑.*瞧不上我/);
  assert.match(ev.text,/宫里谁受了委屈/);
  pushEv(ev);choose(1);assert.match(modalResult.text,/先让宫女坐下说完/);
  assert.equal(g.mood,67);assert.equal(xinOf(g),'欢喜');assert.match(g.story.at(-1).t,/几分得意/);drain();
  queen.trait='善妒';g.trait='温婉';g.favor=30;g.mood=60;
  ev=maidFavorDisputeEvent(g,rival,queen,false);
  assert.match(ev.text,/宫中怎么会没人议论/);assert.match(ev.text,/红了眼/);
  pushEv(ev);choose(1);assert.match(modalResult.text,/敲打宫女以后谨慎行事/);assert.equal(g.mood,57);
  assert.equal(xinOf(g),'委屈');assert.match(queen.story.at(-1).t,/自己介意/);drain();
  queen.trait='持重';assert.match(maidFavorQueenResponse(queen).voice,/问当值的宫人/);
  queen.trait='城府';assert.match(maidFavorQueenResponse(queen).voice,/私下问/);
  queen.rank=7;ev=maidFavorDisputeEvent(g,rival,null,false);
  assert.equal(ev.choices.length,2);assert.doesNotMatch(ev.text,/皇后/);
  pushEv(ev);choose(1);assert.match(modalResult.text,/没有追问/);assert.equal(g.mood,50);drain();`);
});

test('the genuine month queue records each viewpoint and survives a save before and after the response',()=>{
 let w=maidDisputeWorld();
 w.run(`var ids=[g.id,rival.id,queen.id];g.favor=65;
  var monthlyDispute=maidFavorDispute;
  maidFavorDispute=()=>{const random=Math.random;try{Math.random=()=>.01;return monthlyDispute();}finally{Math.random=random;}};
  A.endMonth();
  for(let i=0;modalOpen&&curEv.title!==MAID_FAVOR_DISPUTE_TITLE&&i<150;i++){
   if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
  }
  assert.equal(curEv.title,MAID_FAVOR_DISPUTE_TITLE);assert.equal(curEv.por.id,ids[0]);save('1');`);
 const ids=JSON.parse(w.run('JSON.stringify(ids)'));w=boot(501,w.storage);w.ctx.assert=assert;w.ctx.ids=ids;
 w.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,MAID_FAVOR_DISPUTE_TITLE);
   var entries=p=>p.story.filter(x=>x.event?.title===MAID_FAVOR_DISPUTE_TITLE);
   assert.ok(ids.every(id=>entries(byId(id)).length===0));
   choose(0);assert.match(modalResult.text,/撤回加派的差事/);save('2');
   A.load('2');assert.equal(PalaceActions.blocked,false);assert.match(modalResult.text,/撤回加派的差事/);drain();
   var [g,rival,queen]=ids.map(byId);
   assert.match(entries(g)[0].t,/受召.*加派了差事/);assert.match(entries(rival)[0].t,/心下不平/);
   assert.match(entries(queen)[0].t,/谁受了委屈/);
   for(const id of ids)assert.equal(entries(byId(id)).length,1);
   assert.equal(xinOf(g),'释然');assert.equal(S.flags.lastMaidFavorDispute,S.turn);`);
});
