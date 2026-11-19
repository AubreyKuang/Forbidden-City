const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function world(){
 const b=boot(318);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=300;S.year=26;S.month=4;E().age=45;E().energy=30;E().treasury=2000;
   var m=makeGirl({sur:'沈',given:'知微',age:39,trait:'才女'});addConsort(m,3,'入宫');
   var f=makeGirl({sur:'许',given:'丰容',age:41,trait:'温婉'});addConsort(f,3,'入宫');
   var h=houseOf(m);h.relatives=[];h.father.alive=true;
   h.brother={id:'capital-uncle',name:'沈明修',alive:true,age:35,temperament:'谨慎',story:[]};
   var older=addNatalPerson(m,h,'f',45,81,false);older.married=true;
   var younger=addNatalPerson(m,h,'f',11,82,false);
   var uncle=addNatalPerson(m,h,'m',20,83,false);uncle.away=true;
   var unrelated=addNatalPerson(m,h,'f',14,84,false);unrelated.parentRelativeId=uncle.id;
   var aunt=makeKin(m,'亲');addConsort(aunt,3,'入宫');aunt.age=32;aunt.trait='沉静';
   var copy=addNatalPerson(m,h,'f',32,85,false);copy.consortId=aunt.id;
   var child=(sex,name,age=16,root='水灵根')=>{
     const k=makeKid(m,sex,name);k.born=S.turn-age*12;k.hp=90;k.amb=10;k.lit=70;k.mar=30;
     k.pendingName=false;k.immortalTalent=root;k.temperament='仁厚';k.daoPractice={path:'dao',visits:6};
     return k;
   };
   var k=child('f','清和');k.foster=f.id;
   var news=p=>(p.story||[]).filter(e=>e.t.startsWith('【宫中灵根】'));
   PalaceActions.reset();`);
 return b;
}
function reopen(b){
 const c=boot(841,b.storage);c.ctx.assert=assert;return c;
}

test('maternal aunts and uncles hear once on their canonical profiles and react to their real circumstances',()=>{
 const b=world();
 b.run(`assert.equal(immortalDiscover(k),true);
   assert.match(news(h.father)[0].t,/外孙女清和.*水灵根/);
   assert.match(news(h.brother)[0].t,/舅舅.*外甥女清和.*分开记/);
   assert.match(news(uncle)[0].t,/舅舅.*外甥女清和.*驿袋/);
   assert.match(news(older)[0].t,/大姨.*外甥女清和.*往后孩子真要远行/);
   assert.match(news(younger)[0].t,/小姨.*外甥女清和.*画了下来/);
   assert.match(news(aunt)[0].t,/小姨.*外甥女清和.*私下/);
   assert.equal(news(aunt)[0].thread,'immortal-discovery:'+k.id);
   assert.equal(news(copy).length,0);assert.equal(news(unrelated).length,0);
   assert.equal(news(houseOf(f).father).length,0);
   assert.match(f.story.at(-1).t,/灵根初显/);
   for(let i=0;i<5;i++){S.turn++;immortalTick();}
   for(const p of [h.father,h.brother,uncle,older,younger,aunt])assert.equal(news(p).length,1);`);
});

test('a recorded old discovery adds missing aunt and uncle notes without repeating old letters',()=>{
 let b=world();
 b.run(`immortalDiscover(k);delete S.immortalDiscovery;delete k.immortal.discoveryNews;
   h.father.story=[{d:dateStr(),t:'【宫中灵根】听说外孙女清和被国师辨出水灵根。旧信仍在。'}];
   h.brother.story=[{d:dateStr(),t:'【宫中灵根】听说姐妹的孩子、自己的外甥女清和显出水灵根。旧信仍在。'}];
   older.story=[];uncle.story=[];S.turn+=12;var ids=[k.id,m.id,older.id,uncle.id];save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify(ids)'));b=reopen(b);b.ctx.ids=ids;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);immortalTick();immortalTick();
   var [id,mother,olderId,uncleId]=ids,h=houseOf(byId(mother));
   assert.equal(S.immortalDiscovery.id,id);
   assert.equal(h.father.story.filter(e=>e.t.includes('宫中灵根')).length,1);
   assert.equal(h.brother.story.filter(e=>e.t.includes('宫中灵根')).length,1);
   for(const id of [olderId,uncleId])assert.match(h.relatives.find(p=>p.id===id).story.at(-1).t,/问道旧记.*清和/);`);
});

test('palace talk appears in a real monthly queue, survives reload, and gives named participants their own chronicle',()=>{
 let b=world();
 b.run(`var careful=makeGirl({age:28,trait:'持重'}),lively=makeGirl({age:27,trait:'活泼'});
   addConsort(careful,5,'入宫');addConsort(lively,4,'入宫');
   relAdd(k,careful,90);relAdd(k,lively,85);
   var peer=child('m','承礼',13,null);peer.temperament='审慎';
   var ids=[k.id,careful.id,lively.id,peer.id];immortalDiscover(k);PalaceActions.reset();A.endMonth();
   for(let i=0;modalOpen&&curEv.title!=='六宫闲话 · 灵根初显'&&i<150;i++){
     if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
   }
   assert.equal(curEv.title,'六宫闲话 · 灵根初显');
   assert.match(curEv.text,/先听孩子自己怎么说/);assert.match(curEv.text,/只是一线清光/);assert.match(curEv.text,/问起那日的光/);
   save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify(ids)'));b=reopen(b);b.ctx.ids=ids;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'六宫闲话 · 灵根初显');
   choose(0);drain();assert.equal(kidById(ids[0]).immortal.discoveryNews.court,true);
   for(const id of ids.slice(1)){
     const p=byId(id)||kidById(id);
     assert.equal(p.story.filter(e=>e.life?.title==='宫中议灵根'&&e.t.includes('清和')).length,1);
   }
   assert.equal(immortalDiscoveryCourtEvent(),null);
   save('2');A.load('2');assert.equal(immortalDiscoveryCourtEvent(),null);`);
});

test('only one discovery is available per save even after the child dies and the game is reloaded',()=>{
 let b=world();
 b.run(`var second=child('m','承安',17,'雷灵根'),id=second.id;
   assert.equal(immortalDiscover(k),true);assert.equal(immortalDiscover(second),false);
   k.alive=false;S.turn+=36;immortalTick();assert.equal(second.immortal,undefined);
   assert.equal(immortalDiscover(second),false);assert.equal(S.immortalDiscovery.id,k.id);save('1');`);
 const id=b.run('id');b=reopen(b);b.ctx.id=id;
 b.run(`A.load('1');assert.ok(S.immortalDiscovery);
   var candidate=kidById(id);assert.equal(immortalDiscover(candidate),false);assert.equal(candidate.immortalTalent,'雷灵根');
   assert.equal(candidate.immortal,undefined);assert.doesNotMatch(immortalTags(candidate),/灵根/);`);
});

test('an old missing ledger is captured when the only discovered child succeeds and follows the new reign',()=>{
 const b=world();
 b.run(`var heir=child('m','承安',18,'雷灵根');assert.equal(immortalDiscover(heir),true);
   delete S.immortalDiscovery;var id=heir.id;S.heir=id;
   succeed(heir);choose(0,'承平');drain();
   assert.equal(S.gen,2);assert.equal(S.immortalDiscovery.id,id);
   assert.equal(royalById(id),undefined);
   var next=makeKid(empress(),'f','昭宁');next.born=S.turn-14*12;next.immortalTalent='木灵根';next.daoPractice={path:'dao',visits:6};
   assert.equal(immortalDiscover(next),false);
   assert.equal(next.immortal,undefined);`);
});

test('a legacy chronicle can preserve the lock after the discovered child is absent from all rosters',()=>{
 let b=world();
 b.run(`assert.equal(immortalDiscover(k),true);
   S.children=S.children.filter(p=>p!==k);delete S.immortalDiscovery;
   var id=child('m','承安',17,'雷灵根').id;save('1');`);
 const id=b.run('id');b=reopen(b);b.ctx.id=id;
 b.run(`A.load('1');assert.ok(S.immortalDiscovery);assert.equal(S.immortalDiscovery.id,null);
   assert.equal(immortalDiscover(kidById(id)),false);assert.equal(kidById(id).immortal,undefined);`);
});

test('unrevealed talents from the equal-odds release return to the original odds on the next discovery',()=>{
 let b=world();
 b.run(`m.rank=8;var son=child('m','承安',14,null);
   son.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>
     rolledImmortalRoot({seed},.15)&&!rolledImmortalRoot({seed},.015));
   k.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>
     rolledImmortalRoot({seed},.24)&&!rolledImmortalRoot({seed},.15));
   for(const p of [k,son]){assert.ok(p.seed);p.immortalTalent=rolledImmortalRoot(p,.15);p.immortalTalentBalanced=true;}
   S.flags.immortalPace={last:-99,lastOffer:-99};
   PalaceActions.reset();save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify([k.id,son.id])'));
 b=reopen(b);b.ctx.ids=ids;b.run(`A.load('1');`);b.force(0,0);
 b.run(`var [daughter,son]=ids.map(kidById);
   assert.equal(daughter.immortalTalent,null);assert.ok(son.immortalTalent);
   assert.equal(immortalRoot(son),null);assert.equal(immortalBirthChance(son),.015);
   var root=immortalRoot(daughter);assert.ok(root);immortalTick();
   assert.equal(daughter.immortal.root,root);assert.equal(S.immortalDiscovery.id,daughter.id);
   assert.equal(daughter.immortalTalentBalanced,undefined);assert.equal(son.immortal,undefined);`);
});

test('a confirmed discovery from an old save adds separate admiration from her younger brother and close sister once',()=>{
 let b=world();
 b.run(`var brother=child('m','承宁',6,null),closeMale=makeKid(f,'m','承岳'),
     sister=makeKid(f,'f','昭安'),rival=child('f','昭蘅',15,null);
   closeMale.born=S.turn-13*12;sister.born=S.turn-14*12;
   closeMale.pendingName=sister.pendingName=false;sister.temperament='好胜';sister.away=true;
   relAdd(k,closeMale,70);relAdd(k,sister,65);relAdd(k,rival,-100);
   assert.equal(immortalDiscover(k),true);
   k.seed=Array.from({length:300},(_,i)=>i+1).find(seed=>rolledImmortalRoot({seed},.24)&&!rolledImmortalRoot({seed},.15));
   assert.ok(k.seed);delete k.immortalTalentBalanced;delete k.immortal.discoveryNews.admirers;
   S.flags.immortalPace={last:S.turn,lastOffer:S.turn};var ids=[k.id,brother.id,sister.id,closeMale.id,rival.id];
   PalaceActions.reset();save('1');`);
 const ids=JSON.parse(b.run('JSON.stringify(ids)'));b=reopen(b);b.ctx.ids=ids;
 b.run(`A.load('1');assert.equal(PalaceActions.blocked,false);
   var [k,brother,sister,closeMale,rival]=ids.map(kidById),notes=p=>p.story.filter(e=>e.life?.title==='手足眼里的灵根');
   assert.equal(immortalRoot(k),'水灵根');assert.equal(notes(brother).length,0);
   A.endMonth();
   assert.match(notes(brother)[0].t,/姐姐清和.*最神气/);
   assert.match(notes(sister)[0].t,/姐姐清和.*真服气/);
   assert.equal(notes(sister)[0].life.source,'手足间的家书');
   assert.equal(notes(closeMale).length,0);assert.equal(notes(rival).length,0);
   assert.equal(notes(k).length,2);assert.ok(notes(k).some(e=>e.t.includes('弟弟承宁')));
   drain();save('2');A.load('2');assert.equal(PalaceActions.blocked,false);
   S.turn++;immortalTick();immortalTick();
   assert.equal(notes(kidById(ids[1])).length,1);assert.equal(notes(kidById(ids[2])).length,1);
   assert.equal(notes(kidById(ids[0])).length,2);`);
});
