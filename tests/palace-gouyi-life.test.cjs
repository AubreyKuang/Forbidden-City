const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs'),{world}=require('./court-family-browser-fixtures.cjs');
function w(){const b=world();b.ctx.assert=assert;b.run(`A.out('procession');choose(0);choose(0);drain();var g=S.consorts.find(c=>c.gouyi);E().energy=20;S.turn+=3;PalaceActions.reset();`);return b;}
function reload(b){const next=boot(991,b.storage);next.ctx.assert=assert;next.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var g=S.consorts.find(c=>c.gouyi);`);return next;}
for(const seed of [2,7,14,39,83,158,209,300,440,777,999,2082])test('fixed identity and coherent personal history across seed '+seed,()=>{
 const b=boot(seed);b.ctx.assert=assert;b.run(`A.start();drain();var ev=gouyiEncounter(),g=ev.por;assert.equal(fullName(g),'赵令仪');assert.equal(g.trait,'沉静');assert.equal(g.t2,'念旧');assert.equal(portraitCell(g),422);addConsort(g,3,'巡狩入宫');assert.equal(g.timeTraveler,undefined);assert.equal(g.solitary,undefined);assert.equal(g.wound,'gouyi');assert.equal(g.wish,'poem');assert.equal(g.hobby,'品茶');assert.equal(Object.keys(WOUNDS).includes('gouyi'),false);for(var n=0;n<8;n++)deepen(g);assert.equal(fullName(g),'赵令仪');assert.equal(g.trait,'沉静');assert.equal(g.t2,'念旧');assert.match(WOUNDS[g.wound],/河间/);`);
});
test('fixed consort does not occupy a random rare arc owner on admission',()=>{const b=w();b.run(`assert.ok(!Object.values(S.flags.rareArcOwners||{}).includes(g.id));assert.equal(g.arc.id,'gouyi');`);});
test('inquiry is sparse and views cannot reroll it or change the world',()=>{
 const b=w();b.run(`S.turn=g.enteredAt+1;Math.random=()=>0;gouyiLifeTick();assert.equal(g.gouyi.inquiry.pending,undefined);S.turn++;Math.random=()=>.99;gouyiLifeTick();assert.equal(g.gouyi.inquiry.pending,undefined);Math.random=()=>0;gouyiLifeTick();assert.equal(g.gouyi.inquiry.pending,undefined);S.turn++;gouyiLifeTick();assert.equal(g.gouyi.inquiry.pending.stage,0);var before=JSON.stringify(S);for(var n=0;n<10;n++){gouyiInquiryPanel(g);gouyiInquiryEvent(g);}assert.equal(JSON.stringify(S),before);assert.equal(queueGouyiInquiry(g),false);`);
});
for(let chapter=0;chapter<4;chapter++)for(let choice=0;choice<2;choice++)test(`inquiry ${chapter+1}/${choice+1}: previous choices, actual master, memories and replay`,()=>{
 let b=w();b.run(`for(var n=0;n<${chapter};n++){queueGouyiInquiry(g);gouyiInquiryEvent(g).choices[${choice}].f();S.turn+=4;}assert.equal(queueGouyiInquiry(g),true);PalaceActions.reset();A.gouyiInquiry(g.id);assert.match(curEv.title,/钦安殿/);save('auto');`);
 b=reload(b);b.run(`var before=E().energy,health=g.hp,fertility=g.fertility;choose(${choice});assert.equal(E().energy,before-1);assert.equal(g.hp,health);assert.equal(g.fertility,fertility);assert.equal(g.gouyi.inquiry.stage,${chapter+1});assert.equal(g.gouyi.inquiry.pending,undefined);assert.equal(g.gouyi.inquiry.history.at(-1).master,daoMaster().name);assert.ok(g.story.some(s=>s.thread==='gouyi-inquiry:'+S.gen+':'+g.id&&s.t.includes('记下')));assert.equal(S.children.length,0);save('auto');`);
 b=reload(b);b.run(`assert.equal(g.gouyi.inquiry.stage,${chapter+1});assert.equal(g.gouyi.inquiry.history.length,${chapter+1});drain();assert.equal(queueGouyiInquiry(g),false);if(${chapter}===3){assert.match(gouyiInquiryPanel(g),/四次问答已收存/);assert.equal(xinOf(g),'释然');}else{S.turn+=3;assert.equal(queueGouyiInquiry(g),false);S.turn++;assert.equal(queueGouyiInquiry(g),true);}`);
});
test('declining now preserves the inquiry and consumes no energy',()=>{let b=w();b.run(`queueGouyiInquiry(g);PalaceActions.reset();var energy=E().energy;A.gouyiInquiry(g.id);choose(2);assert.equal(E().energy,energy);assert.equal(g.gouyi.inquiry.stage,0);assert.ok(g.gouyi.inquiry.pending);save('auto');`);b=reload(b);b.run(`drain();A.gouyiInquiry(g.id);assert.match(curEv.title,/掌心问因/);`);});
test('stale callbacks and insufficient energy cannot duplicate memories',()=>{const b=w();b.run(`queueGouyiInquiry(g);var ev=gouyiInquiryEvent(g),count=g.story.length;E().energy=0;assert.equal(ev.choices[0].cond(),false);assert.equal(ev.choices[0].f(),null);assert.equal(g.story.length,count);E().energy=20;ev.choices[0].f();count=g.story.length;assert.equal(ev.choices[1].f(),null);assert.equal(g.story.length,count);`);});
for(const state of ["g.alive=false","g.cold=true","g.gone=true","g.homeLeave={until:S.turn+3}","g.templeStay={}","g.hp=25","g.preg=8","g.xin={k:'悲恸',t:S.turn}","S.gen++"])
test('temple inquiry pauses for '+state,()=>{const b=w();b.run(`queueGouyiInquiry(g);var ev=gouyiInquiryEvent(g),energy=E().energy,n=g.story.length;${state};assert.equal(gouyiInquiryEvent(g),null);assert.equal(ev.choices[0].f(),null);assert.equal(g.story.length,n);assert.equal(E().energy,energy);assert.equal(g.gouyi.inquiry.stage,0);`);});
test('late pregnancy pauses an actual request and resumes after recovery',()=>{const b=w();b.run(`queueGouyiInquiry(g);g.preg=9;assert.match(gouyiInquiryPanel(g),/disabled/);assert.ok(g.gouyi.inquiry.pending);g.preg=0;g.hp=95;assert.ok(gouyiInquiryEvent(g));`);});
test('real temple visitor is routed to her pending exclusive question',()=>{const b=w();b.run(`queueGouyiInquiry(g);for(var n=0;n<100&&!daoVisitors().includes(g);n++)S.turn++;assert.ok(daoVisitors().includes(g));assert.match(daoConversation(g).title,/掌心问因/);assert.match(viewDaoHall(),/同赴钦安殿/);`);});
const reactions={curious:'活泼',doubt:'聪慧',rival:'善妒',kind:'温婉',reserved:'淡泊',etiquette:'持重'};
for(const [kind,trait] of Object.entries(reactions))test('court reaction '+kind+' records both participants, relationship and refreshed outcome',()=>{
 let b=w();b.run(`a.trait='${trait}';a.rank=${kind==='etiquette'?8:2};a.favor=20;g.favor=60;S.rel[rk(a,g)]=0;assert.equal(gouyiReactionKind(a,g),'${kind}');assert.ok(queueGouyiReaction(g,a));PalaceActions.reset();A.gouyiReaction(g.id);save('auto');`);b=reload(b);
 b.run(`var other=byId(g.gouyi.court.pending.other),rel=relGet(g,other),old=other.story.length;choose(0);assert.equal(g.gouyi.court.pending,undefined);assert.equal(relGet(g,other),rel+GOUYI_REACTIONS['${kind}'].delta);assert.ok(other.story.length>old);assert.equal(other.gouyiImpression.kind,'${kind}');assert.ok(g.story.some(s=>s.thread==='gouyi-court:'+S.gen+':'+g.id+':'+other.id));assert.ok(consortVoicePool(other).some(v=>v.key==='gouyi-impression'));save('auto');`);b=reload(b);b.run(`assert.equal(g.gouyi.court.pending,undefined);`);
});
test('rivalry requires rank or favor threat; solitary consort does not become a friend',()=>{const b=w();b.run(`a.trait='城府';a.rank=7;a.favor=90;g.favor=10;S.rel[rk(a,g)]=0;assert.equal(gouyiReactionKind(a,g),'doubt');g.favor=100;assert.equal(gouyiReactionKind(a,g),'rival');a.solitary={path:'letters'};assert.equal(gouyiReactionKind(a,g),'reserved');queueGouyiReaction(g,a);gouyiReactionEvent(g).choices[0].f();assert.equal(relGet(a,g),1);`);});
test('protection checks attendance and records no imaginary audience or automatic reconciliation',()=>{const b=w();b.run(`a.trait='骄纵';S.rel[rk(a,g)]=0;queueGouyiReaction(g,a);var ev=gouyiReactionEvent(g),n=b.story.length;a.cold=true;assert.equal(ev.choices[1].f(),null);a.cold=false;ev.choices[1].f();assert.equal(b.story.length,n);assert.equal(relGet(a,g),-1);assert.equal(ev.choices[0].f(),null);S.turn+=6;assert.equal(queueGouyiReaction(g,a),false);`);});
test('a changed rank cancels stale social lines instead of disrespecting a new empress',()=>{const b=w();b.run(`a.trait='骄纵';a.rank=3;queueGouyiReaction(g,a);var ev=gouyiReactionEvent(g);a.rank=8;assert.equal(ev.choices[0].f(),null);assert.equal(gouyiReactionEvent(g),null);`);});
test('social encounter is rolled only monthly and skips unavailable others',()=>{const b=w();b.run(`a.cold=true;b.gone=true;q.alive=false;Math.random=()=>0;gouyiLifeTick();assert.equal(g.gouyi.court.pending,undefined);a.cold=false;gouyiLifeTick();assert.equal(g.gouyi.court.pending,undefined);S.turn++;gouyiLifeTick();assert.equal(g.gouyi.court.pending.other,a.id);var count=Q.length;gouyiLifeTick();assert.equal(Q.length,count);`);});
test('actual monthly action introducing reactions survives reload',()=>{let b=w();b.run(`g.gouyi.court={last:0,heard:{}};g.gouyi.inquiry={stage:0,last:0,history:[]};PalaceActions.reset();A.endMonth();save('auto');`);b=reload(b);b.run(`assert.equal(PalaceActions.blocked,false);drain();save('auto');`);reload(b);});
test('appointing Gouyi’s birth son opens three dated East Palace scenes and replays an open choice',()=>{
 let b=w();
 b.run(`var k=makeKid(g,'m','承安');k.born=S.turn-96;delete k.pendingName;
   PalaceActions.reset();A.kidHeir(k.id);choose(1);assert.equal(k.gouyiCrown,undefined);
   A.kidHeir(k.id);choose(0);assert.ok(modalResult);nextEv();
   assert.equal(curEv.title,'东宫 · 从前的名字');assert.deepEqual(curEv.present.map(x=>x.id).join(','),[k.id,g.id].join(','));`);
 b=reload(b);
 b.run(`var k=kidById(S.heir),started=S.turn,thread='gouyi-crown:'+S.gen+':'+k.id;
   assert.equal(curEv.title,'东宫 · 从前的名字');choose(0);drain();
   assert.equal(k.gouyiCrown.due,started+1);assert.equal(k.gouyiCrown.stage,1);
   A.endMonth();drain();assert.equal(S.turn,started+1);assert.equal(k.gouyiCrown.stage,2);
   A.endMonth();drain();assert.equal(k.gouyiCrown.stage,2);
   A.endMonth();drain();assert.equal(S.turn,started+3);assert.equal(k.gouyiCrown.stage,3);
   assert.equal(k.story.filter(n=>n.thread===thread).length,3);assert.equal(g.story.filter(n=>n.thread===thread).length,2);
   assert.equal(S.log.filter(n=>n.t.startsWith('【东宫 ·')).length,3);
   A.endMonth();drain();assert.equal(k.story.filter(n=>n.thread===thread).length,3);`);
});
test('an existing Gouyi heir begins at month-end and a rival’s appointment pauses unplayed scenes',()=>{
 const b=w();
 b.run(`var k=makeKid(g,'m','承安'),other=makeKid(a,'m','承宁');
   for(const child of [k,other]){child.born=S.turn-96;delete child.pendingName;}
   g.homeLeave={until:S.turn+12};S.heir=k.id;
   gouyiCrownSettled({gen:S.gen,turn:S.turn-1,heir:k.id});
   assert.match(curEv.text,/书签/);assert.equal(curEv.present.length,1);choose(0);drain();
   A.kidHeir(other.id);choose(0);drain();assert.equal(other.gouyiCrown,undefined);
   A.endMonth();drain();assert.equal(k.gouyiCrown.stage,1);
   A.kidHeir(k.id);choose(0);nextEv();
   assert.equal(curEv.title,'东宫 · 太傅第一问');choose(1);drain();assert.equal(k.gouyiCrown.stage,2);`);
});
const legacy=require('./fixtures/gouyi-legacy-v16.json');
for(const [name,payload] of Object.entries(legacy))test('genuine version 16 '+name+' pending save resumes with its original decisions',()=>{
 const b=boot(991,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,16);drain();assert.equal(PalaceActions.blocked,false);`);
});
