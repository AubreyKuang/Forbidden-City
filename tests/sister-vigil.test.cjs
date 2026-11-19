const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function household(count=2){
 const b=boot(202);
 b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=36;S.year=4;S.month=5;
 var a=harem()[0],s=makeKin(a,'亲');addConsort(s,3,'入宫');
 var daughters=[a,s];
 while(daughters.length<${count}){const c=makeKin(a,'亲');addConsort(c,3,'入宫');daughters.push(c);}
 var cousin=makeKin(a,'堂');addConsort(cousin,2,'入宫');houseOf(cousin);
 var h=houseOf(a),p=h.father;
 assert.equal(h,houseOf(s));assert.notEqual(h,houseOf(cousin));
 a.kinRival={};s.kinRival={};S.rel[rk(a,s)]=50;
 var notes=c=>(c.story||[]).filter(e=>e.thread==='sister-vigil:'+S.gen+':'+p.id);
 officialDeath(a,'father','在家中病故。');drain();`);
 return b;
}
test('同父姐妹共祭，各留一段心事；同姓堂姐妹不在场，重入月结不重记',()=>{
 const b=household();
 b.run(`p.daughterLetterNature='caring';s.fatherLetters={father:p.id,lastReply:{kind:'money'}};
 sisterVigilTick();assert.ok(!p.death.sisterVigil);S.turn++;sisterVigilTick();
 assert.equal(p.death.sisterVigil.title,'姐妹同祭');assert.equal(relGet(a,s),56);
 assert.match(notes(a)[0].t,/银子/);assert.match(notes(s)[0].t,/银子/);
 assert.notEqual(notes(a)[0].t,notes(s)[0].t);assert.equal(notes(cousin).length,0);
 drain();S.turn++;sisterVigilTick();assert.equal(notes(s).length,1);assert.equal(notes(a).length,1);assert.ok(!modalOpen);`);
});
for(const [roll,title,change] of [[.05,'各有一句祭辞',-3],[.95,'今夜同守一灯',3]]){
 test('有旧怨的姐妹 · '+title,()=>{
  const b=household();
  b.run(`s.kinRival[a.id]=1;S.rel[rk(a,s)]=-20;a.fatherHeirPressure={turn:S.turn-5};
   p.daughterLetterNature='caring';s.fatherLetters={father:p.id,lastReply:{kind:'peace'}};S.turn++;`);
  b.force(roll);
  b.run(`sisterVigilTick();assert.equal(p.death.sisterVigil.title,'${title}');assert.equal(relGet(a,s),-20+${change});
   assert.ok(isRival(s,a));assert.match(notes(a)[0].t,/皇子/);if('${title}'==='各有一句祭辞')assert.match(notes(s)[0].t,/报了个平安/);assert.notEqual(notes(a)[0].t,notes(s)[0].t);`);
 });
}
test('需两人同在宫中，可等省亲归来；超过三月或丧后入宫不补演',()=>{
 for(const mode of ['return','late','new']){
  const b=household();
  b.run(`S.turn++;s.homeLeave={};sisterVigilTick();assert.ok(!p.death.sisterVigil);delete s.homeLeave;
   S.turn=p.death.turn+${mode==='late'?4:3};if('${mode}'==='new')s.enteredAt=p.death.turn+1;
   S.rel[rk(a,s)]=5;sisterVigilTick();assert.equal(p.death.sisterVigil?.title,${mode==='return'?"'灯前相伴'":'undefined'});`);
 }
});
test('从旁支入宫的同父女儿共祭生父，不与姑母误认作姐妹',()=>{
 const b=household();
 b.run(`var parent=addNatalPerson(a,h,'m',48,1004,false);
 var girls=[201,203].map(seed=>{const r=addNatalPerson(a,h,'f',18,seed,false);r.fatherId=parent.id;
  const girl=royalNatalConsort(a,r);addConsort(girl,2,'入宫');return girl;});
 officialDeath(a,'relative'+parent.id,'病故。');drain();S.turn++;sisterVigilTick();
 assert.deepEqual(parent.death.sisterVigil.daughters,girls.map(c=>c.id));
 assert.ok(!p.death.sisterVigil.daughters.some(id=>girls.some(c=>c.id===id)));`);
});
test('四姐妹同祭，一人先退；私记写清各自的亲疏，单场只结算一次',()=>{
 const b=household(4);
 b.run(`var [,,third,last]=daughters;
 for(const c of daughters){c.kinRival={};for(const o of daughters)if(c!==o)S.rel[rk(c,o)]=10;}
 S.rel[rk(a,s)]=65;S.rel[rk(s,third)]=40;last.kinRival[s.id]=1;
 last.fatherHeirPressure={turn:S.turn-8};S.turn++;`);
 // The two women with a rift roll in attendance order: the one with friends stays.
 b.force(.99,.01);
 b.run(`sisterVigilTick();const vigil=p.death.sisterVigil;
 assert.deepEqual(vigil.daughters,daughters.map(c=>c.id));assert.deepEqual(vigil.leftEarly,[last.id]);
 assert.deepEqual(curEv.cast,daughters);assert.equal(curEv.title,'姐妹共祭先父');
 for(const c of daughters){
   const note=notes(c)[0];assert.equal(note.life.people.length,4);
   const memory=NPCMemory.recall(S,c.id,{subject:p.id,type:'personal-life'})[0].interpretation;
   for(const o of daughters)if(o!==c)assert.ok(memory.includes(fullName(o)));
   assert.ok(note.t.endsWith(memory));
 }
 assert.equal(new Set(daughters.map(c=>notes(c)[0].t)).size,4);
 assert.match(notes(last)[0].t,/皇子.*先告辞/);assert.ok(!notes(a)[0].t.includes('皇子'));
 assert.ok(notes(s)[0].t.includes(fullName(a)+'、'+fullName(third)+'陪我守着灯'));
 assert.equal(relGet(a,s),69);assert.equal(relGet(last,s),10);assert.ok(isRival(last,s));
 drain();S.turn++;sisterVigilTick();assert.ok(daughters.every(c=>notes(c).length===1));assert.equal(notes(cousin).length,0);`);
});
test('三姐妹皆亲近时一同守灯，出宫省亲的人不被写作在场',()=>{
 const b=household(4);
 b.run(`var absent=daughters[3];absent.homeLeave={};var three=daughters.slice(0,3);
 for(const c of three){c.kinRival={};for(const o of three)if(o!==c)S.rel[rk(c,o)]=75;}
 S.turn++;sisterVigilTick();assert.deepEqual(p.death.sisterVigil.daughters,three.map(c=>c.id));
 assert.deepEqual(p.death.sisterVigil.leftEarly,[]);assert.ok(three.every(c=>notes(c)[0].t.includes('陪我守着灯')));
 assert.equal(notes(absent).length,0);assert.ok(!curEv.text.includes(fullName(absent)));`);
});
test('回放旧版的待阅合祭维持原先两位，结过的祭不补演',()=>{
 const b=household(4);
 b.run(`const currentVersion=journalContentVersion;journalContentVersion=()=>133;
 S.turn++;sisterVigilTick();assert.equal(p.death.sisterVigil.daughters.length,2);drain();
 journalContentVersion=currentVersion;S.turn++;sisterVigilTick();assert.equal(daughters.flatMap(notes).length,2);`);
});
