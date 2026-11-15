const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(873);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.rel={};
 var c=makeGirl({sur:'沈',given:'知微',age:24,trait:'温婉',fam:{t:'翰林学士',p:45}}),o=makeGirl({sur:'顾',given:'明珠',age:24,trait:'善妒',fam:{t:'户部侍郎',p:55}});
 for(var x of [c,o]){addConsort(x,4,'入宫');x.solitary=null;x.kinRival={};delete x.timeTraveler;}
 var h=houseOf(c),oh=houseOf(o);oh.brother={id:'test-brother',name:'顾云深',sur:'顾',age:26,alive:true,married:false,career:'official',post:'翰林院编修',story:[]};houseOf(o);
 var p=addNatalPerson(c,h,'f',26,791,false);p.married=false;delete p.spouse;
 var match={kind:'alliance',name:'顾云深',sur:'顾',desc:'顾明珠的兄长',consortId:o.id,personId:'test-brother',role:'brother'};
 S.rel[rk(c,o)]=0;PalaceActions.reset();var bond=()=>Object.values(S.flags.marriageBonds||{})[0];`);return b;}
test('marrying a named brother and sister creates actual friendship, mutual chronicles and an accessible scene',()=>{
 const b=world();b.run(`marrySister(c,p,match);assert.ok(relGet(c,o)>=30);assert.match(relLine(c),/交好/);assert.match(relLine(c),/听她们谈姻亲家事/);
 assert.equal(p.spouse.alliance.personId,'test-brother');for(var x of [c,o]){var s=x.story.find(s=>s.life?.title==='结为姻亲');assert.ok(s);assert.ok(s.t.includes(p.name));assert.match(s.t,/顾云深/);}
 var before=JSON.stringify(S);relLine(c);relLine(o);assert.equal(JSON.stringify(S),before);`);
});
test('existing hostility survives marriage and a solitary woman keeps her reserved manner',()=>{
 for(const patch of ['S.rel[rk(c,o)]=-40','c.kinRival[o.id]=true','c.solitary={path:"letters"}']){const b=world();b.run(`${patch};marrySister(c,p,match);var ev=marriageBondEvent(bond());
 if(isSolitary(c)){assert.match(ev.text,/话少/);assert.match(relLine(c),/敬重/);}else{assert.ok(relGet(c,o)<30);assert.match(ev.text,/旧日的事尚未说开/);}`);}
});
test('a wedding cannot boost relationships twice and a repeated callback cannot duplicate conversation memories',()=>{
 const b=world();b.run(`marrySister(c,p,match);var before=JSON.stringify(S);marrySister(c,p,match);repairMarriageBonds();assert.equal(JSON.stringify(S),before);
 var ev=marriageBondEvent(bond());ev.choices[0].f();var n=c.story.length,r=relGet(c,o);ev.choices[0].f();assert.equal(c.story.length,n);assert.equal(relGet(c,o),r);assert.equal(marriageBondEvent(bond()),null);`);
});
test('pending and resolved conversations reload; six months later they can talk about family again',()=>{
 const b=world();b.run(`marrySister(c,p,match);PalaceActions.reset();var cid=c.id,oid=o.id;A.allianceTalk(bond().key);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'姻亲道喜');
 choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();c=byId(cid);o=byId(oid);S.turn+=6;assert.equal(marriageBondEvent(bond()).title,'姻亲家常');`);
});
test('cold palace, departure, death or widowing prevents a present-tense family gathering',()=>{
 for(const patch of ['c.cold=true','o.gone=true','c.alive=false','p.alive=false','oh.brother.alive=false']){const b=world();b.run(`marrySister(c,p,match);${patch};assert.equal(marriageBondEvent(bond()),null);`);}
});
test('a verified older marriage gains a bond once, without inventing a historical wedding date',()=>{
 const b=world();b.run(`marriageFriendshipsMarry(c,p,match);assert.equal(S.flags.marriageBonds,undefined);repairMarriageBonds();assert.ok(bond().legacy);assert.ok(relGet(c,o)>=30);assert.match(c.story.at(-1).t,/旧有婚书补记/);
 var before=JSON.stringify(S);repairMarriageBonds();assert.equal(JSON.stringify(S),before);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(Object.keys(S.flags.marriageBonds).length,1);`);
});
test('old marriage repairs require both spouse names and the right household, and never link an unconsummated proposal',()=>{
 for(const patch of ["oh.brother.spouseName='别的人'","p.spouse.desc='别家的兄长'","p.married=false"]){const b=world();b.run(`marriageFriendshipsMarry(c,p,match);${patch};repairMarriageBonds();assert.equal(S.flags.marriageBonds,undefined);`);}
 const b=world();b.run(`p.betrothal={match,due:70};repairMarriageBonds();assert.equal(S.flags.marriageBonds,undefined);assert.equal(relGet(c,o),0);`);
});
test('a real version 11 wedding result replays unchanged and repairs its verified bond after the old scene ends',()=>{
 const save=require('./fixtures/marriage-friendships-legacy-v11.json'),b=boot(202,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(modalResult);assert.equal(S.flags.marriageBonds,undefined);drain();save('auto');A.load('auto');
 assert.equal(PalaceActions.blocked,false);assert.equal(Object.keys(S.flags.marriageBonds).length,1);var p=Object.values(S.flags.marriageBonds)[0];assert.equal(p.legacy,true);`);
});
