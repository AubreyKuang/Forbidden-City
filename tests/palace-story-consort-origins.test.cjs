const assert=require('node:assert/strict');
const {test}=require('node:test');
const {boot}=require('./playtest-harness.cjs');

function palace(storage){
 const b=boot(4417,storage);b.ctx.assert=assert;
 if(!storage)b.run(`A.start();drain();S.turn=120;S.year=11;E().energy=20;
   var ripe=Array.from({length:100},(_,i)=>i+1).find(seed=>mulberry32(seed^0x5a1739)()<.04);
   var r=storyCastCreate('luwan');r.person.seed=ripe;var lu=r.person;
   storyCastAdmit(lu,r,'北苑相识');lu.enteredAt=0;lu.age=25;lu.aff=90;lu.hp=85;
   var ordinary=makeGirl({trait:'持重',age:25});addConsort(ordinary,3,'入宫');
   ordinary.enteredAt=0;ordinary.hp=90;ordinary.aff=85;PalaceActions.reset();`);
 return b;
}

test('陆绾用可抽中穿越身份的种子入宫，保留原设并跳过随机标签及剧情',()=>{
 const b=palace();
 b.run(`assert.equal(fullName(lu),'陆绾');assert.equal(lu.trait,'将门');assert.equal(lu.hobby,'骑射');
   assert.equal(lu.timeTraveler,undefined);assert.equal(initTimeTraveler(lu,true),null);
   travelerLifeTick();assert.equal(lu.timeTraveler,undefined);
   var identity=initTimeTraveler(ordinary,true);assert.ok(identity);
   lu.timeTraveler={...identity,pending:'confession',known:true};lu.solitary={path:'both',stage:0};lu.looks=99;
   assert.equal(travelerConfessionEvent(lu),null);assert.equal(pendingTravelerEvent(),null);
   assert.equal(timeTravelerVoice(lu),null);assert.equal(timeTravelerPanel(lu),'');
   assert.equal(isSolitary(lu),false);assert.equal(consortTraitTags(lu),'');assert.equal(consortTraitLabels(lu).length,0);
   assert.equal(travelerSelectionBlurt(lu),null);assert.equal(travelerPairCandidates().some(p=>p.a===lu||p.b===lu),false);
   assert.equal(travelerPairEvent({a:ordinary,b:lu,key:'stale'}),null);
   assert.match(storyCastPanel(lu),/北境|陆绾/);
   for(const marker of ['gouyi','hongjian']){
     var c=makeGirl({age:22,trait:'沉静'});c[marker]={};c.seed=ripe;delete c.solitary;
     assert.equal(initTimeTraveler(c,true),null);assert.equal(consortTraitTags(c),'');
     initSolitary(c);assert.equal(isSolitary(c),false);
   }`);
});

test('旧档清理剧情妃误挂的身份及占用，保留已写下的纪事',()=>{
 let b=palace();
 b.run(`var source={key:'1:former',id:'former',gen:S.gen,name:'故人',pages:[],noticed:1};
   S.pastLives={sources:[source],claimed:{[source.key]:lu.id},reigns:{[S.gen]:lu.id},excluded:[]};
   lu.pastLife={source,gen:S.gen,accepted:true,stage:0,history:[]};
   lu.solitary={path:'both',stage:1,history:[]};lu.timeTraveler={...initTimeTraveler(ordinary,true),known:true};
   story(lu,'已经写入的纪事');var id=lu.id,ordinaryId=ordinary.id;save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify([id,ordinaryId])'));
 b=palace(b.storage);b.ctx.ids=ids;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);var [id,ordinaryId]=ids;
   var lu=byId(id),ordinary=byId(ordinaryId);
   assert.equal(lu.timeTraveler,undefined);assert.equal(lu.pastLife,undefined);assert.equal(lu.solitary,undefined);
   assert.ok(lu.story.some(e=>e.t==='已经写入的纪事'));assert.ok(ordinary.timeTraveler);
   assert.equal(S.pastLives.claimed['1:former'],undefined);assert.equal(S.pastLives.reigns[S.gen],undefined);
   assert.equal(pastLifeCandidates()[0].key,'1:former');`);
});

test('旧的陆绾穿越弹窗随存档恢复后会跳过，下一件正常事件仍可继续并再次读档',()=>{
 let b=palace();
 b.run(`var id=lu.id;lu.timeTraveler={...initTimeTraveler(ordinary,true),known:false};
   delete lu.entryAdjustment;delete lu.kinArrival;
   // Recreate the previous release's eligibility while generating a real pending transcript.
   Object.defineProperty(PalaceActions,'exclusiveStoryOrigins',{get:()=>false});
   dismissInvalidStoryOrigin=()=>{};
   A.fixtureOldQueue=function(id){
     pushEv(travelerConfessionEvent(byId(id)));
     pushEv({title:'原排队的宫务',choices:[{t:'收到'}]});
   };PalaceActions.install();
   A.fixtureOldQueue(id);assert.match(curEv.title,/不属于此世的话|灯下的来处/);save('1');`);
 const id=b.run('id'),save=JSON.parse(b.storage.get('chengongji_v1_1'));
 delete save.pendingActions.exclusiveStoryOrigins;b.storage.set('chengongji_v1_1',JSON.stringify(save));
 function restore(w){
   w.ctx.luId=id;
   w.run(`A.fixtureOldQueue=function(id){
     pushEv(travelerConfessionEvent(byId(id)));
     pushEv({title:'原排队的宫务',choices:[{t:'收到'}]});
   };PalaceActions.install();`);
 }
 b=palace(b.storage);restore(b);
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
   assert.equal(curEv.title,'原排队的宫务');assert.equal(byId(luId).timeTraveler.spoken,0);
   save('2');`);
 b=palace(b.storage);restore(b);
 b.run(`A.load('2');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'原排队的宫务');
   choose(0);drain();assert.equal(byId(luId).timeTraveler,undefined);
   assert.equal(PalaceActions.exclusiveStoryOrigins,true);`);
});

test('普通妃嫔身份公开后，人物卡和档案都显示天外来客',()=>{
 let b=palace();
 b.run(`initTimeTraveler(ordinary,true);var id=ordinary.id;
   assert.doesNotMatch(consortTraitTags(ordinary),/天外来客/);
   A.travelerTalk(id);assert.equal(curEv.title,'灯下的来处');
   assert.match(consortTraitTags(ordinary),/天外来客/);choose(0);drain();save('1');`);
 const id=b.run('id');b=palace(b.storage);b.ctx.ladyId=id;
 b.run(`A.load('1');A.go('consort',ladyId);assert.match(viewConsort(),/天外来客/);assert.match(viewConsort(),/异世旧梦/);`);
});
