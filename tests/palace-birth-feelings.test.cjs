const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(trait='温婉',sexes=['f']){const b=boot(202);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;
 var c=harem()[0];c.trait=${JSON.stringify(trait)};c.solitary=null;c.rank=4;c.favor=50;c.story=[];
 var ks=${JSON.stringify(sexes)}.map((sex,i)=>makeKid(c,sex,['知秋','知夏','知春'][i]));
 c.delivery={children:ks.map(k=>k.id),date:dateStr(),turn:S.turn,settled:false,difficult:false,kind:birthType(ks.map(k=>k.sex))};
 PalaceActions.reset();var finish=()=>finishDelivery(c);`);return b;}
test('a mother can regret not having a son and still express named affection for her daughter',()=>{
 const b=world('善妒');b.force(...Array(100).fill(0));b.run('var text=finish()');b.run(`assert.equal(c.delivery.feeling.regret,true);assert.match(text,/失落/);assert.match(text,/知秋攥住我的手/);assert.match(text,/不能让她受委屈/);
 for(var p of [c,...ks])assert.equal(p.story.filter(s=>s.life?.title==='初见孩子的心事').length,1);
 assert.ok(NPCMemory.recall(S,c.id).some(m=>String(m.subject)===String(ks[0].id)&&m.interpretation.includes('失落')));
 assert.ok(!NPCMemory.recall(S,ks[0].id).some(m=>m.interpretation?.includes('失落')));
 var saved=JSON.stringify(c.delivery.feeling),n=c.story.length;finish();recordBirthFeeling(c);assert.equal(c.story.length,n);assert.equal(JSON.stringify(c.delivery.feeling),saved);`);
});
test('probability follows personality, existing sons and low favor without making regret universal',()=>{
 const b=world();b.run(`var gentle=birthFeelingContext(c,ks).regret;c.trait='善妒';var jealous=birthFeelingContext(c,ks).regret;assert.ok(jealous>gentle);
 c.favor=20;assert.ok(birthFeelingContext(c,ks).regret>jealous);c.favor=50;var son=makeKid(c,'m','知远');assert.ok(birthFeelingContext(c,ks).regret<jealous);son.alive=false;assert.equal(birthFeelingContext(c,ks).regret,0);
 son.alive=true;son.mom=-1;for(var trait of ['淡泊','体弱']){c.trait=trait;assert.equal(birthFeelingContext(c,ks).regret,0);}
 c.trait='善妒';c.solitary={path:'letters'};assert.equal(birthFeelingContext(c,ks).regret,0);`);
 for(const roll of [false,true]){const w=world('善妒');w.force(...Array(100).fill(roll?0:.99));w.run(`finish();assert.equal(c.delivery.feeling.regret,${roll});`);}
});
for(const sexes of [['m'],['m','f'],['f','f'],['f','f','f']])test('single and multiple newborns keep names and actual sex composition '+sexes.join(''),()=>{
 const b=world('城府',sexes);b.force(...Array(100).fill(0));b.run(`var text=finish();assert.equal(c.delivery.feeling.regret,${!sexes.includes('m')});for(var k of ks)assert.ok(text.includes(k.name));
 if(ks.length>1&&ks.every(k=>k.sex==='f'))assert.match(text,/她们受委屈/);assert.equal(c.delivery.feeling.children.length,${sexes.length});`);
});
test('previous death and a missing child remain distinct, and affection does not erase either experience',()=>{
 for(const missing of [false,true]){const b=world('善妒');b.run(`var older=makeKid(c,'m','知远');older.alive=${missing};older.lost=${missing};var text=finish();assert.equal(c.delivery.feeling.regret,false);assert.match(text,/${missing?'还没有找到':'先前失去'}/);`);}
});
test('fatal delivery, concealed loss, swapped children and stillbirth do not invent a joyful maternal meeting',()=>{
 for(const patch of ['c.delivery.difficult=true','c.delivery.concealedLoss=true','ks[0].birthSwap={occurred:true}','ks[0].alive=false','ks[0].pendingName=true']){const b=world();b.run(`${patch};finish();assert.equal(c.delivery.feeling,undefined);`);}
});
test('a real naming action survives refresh with exactly one immutable feeling and named chronicles',()=>{
 const b=world('善妒');b.run(`ks[0].pendingName=true;PalaceActions.reset();A.resumeBirth(c.id);choose(0);var id=c.id,saved=JSON.stringify(c.delivery.feeling),n=c.story.length;
 save('auto');A.load('auto');c=byId(id);assert.equal(PalaceActions.blocked,false);assert.equal(JSON.stringify(c.delivery.feeling),saved);assert.equal(c.story.length,n);drain();
 var before=JSON.stringify(S);UI.sel=id;viewConsort();maternalVoice(c);assert.equal(JSON.stringify(S),before);
 assert.equal(maternalVoice(c).key,'maternal-newborn');`);
});
test('newborn dialogue yields to later death, separation and time instead of repeating an obsolete mood',()=>{
 const b=world();b.run(`finish();var original=c.delivery.feeling.line;assert.ok(JSON.stringify(maternalVoice(c)).includes(original));
 ks[0].foster=harem().find(p=>p.id!==c.id)?.id||-1;assert.ok(!JSON.stringify(maternalVoice(c)).includes(original));delete ks[0].foster;
 S.turn+=3;assert.ok(!JSON.stringify(maternalVoice(c)).includes(original));S.turn-=3;ks[0].alive=false;assert.ok(!JSON.stringify(maternalVoice(c)).includes(original));`);
});
test('a real version 11 delivery result replays without new feelings or random draws',()=>{
 const save=require('./fixtures/birth-feelings-legacy-v11.json'),b=boot(202,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'弄璋弄瓦');assert.ok(modalResult);assert.equal(S.consorts.find(c=>c.delivery).delivery.feeling,undefined);drain();assert.equal(PalaceActions.blocked,false);`);
});
