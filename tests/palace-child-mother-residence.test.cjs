const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(sex='f',age=6){const b=boot(6123);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=240;S.year=21;S.month=1;var mother=harem().find(c=>!c.cold);var child=makeKid(mother,'${sex}','念安');child.born=S.turn-${age}*12;child.temperament='内敛';child.love=60;var childId=child.id,motherId=mother.id;`);return b;}
test('a quiet child asks on an eligible birthday, with a higher chance for princesses',()=>{
 for(const [sex,roll,expected] of [['f',.34,1],['f',.35,0],['m',.17,1],['m',.18,0]]){const b=game(sex);b.run(`Math.random=()=>${roll};assert.equal(childMotherResidenceRequests().length,${expected});`);}
 const b=game();b.run(`Math.random=()=>0;child.temperament='好胜';assert.equal(childMotherResidenceRequests().length,0);child.temperament='内敛';child.born--;assert.equal(childMotherResidenceRequests().length,0);child.born++;mother.cold=true;assert.equal(childMotherResidenceRequests().length,0);`);
});
test('permission follows the caregiver and ends on adulthood, departure or changed caregiver',()=>{
 for(const [sex,limit] of [['f',15],['m',16]]){const b=game(sex);b.run(`Math.random=()=>0;var ev=childMotherResidenceRequests()[0];ev.choices[0].f();assert.equal(child.motherResidence.choice,'stay');assert.match(child.story.at(-1).t,/欢喜/);assert.match(mother.story.at(-1).t,/欢喜/);assert.equal(youngChildMother(child),mother);assert.match(childResidence(child),/同住/);assert.ok(nurseryChildren(mother.palace).includes(child));assert.ok(schoolChildren().includes(child));
 mother.palace='景仁宫';assert.match(childResidence(child),/景仁宫/);mother.cold=true;assert.match(childResidence(child),/未与母亲同住/);mother.cold=false;child.born=S.turn-(${limit}*12-1);assert.equal(youngChildMother(child),mother);child.born=S.turn-${limit}*12;assert.equal(youngChildMother(child),null);
 child.born=S.turn-7*12;child.away=true;assert.equal(youngChildMother(child),null);child.away=false;var foster=harem().find(c=>c!==mother);child.foster=foster.id;assert.equal(youngChildMother(child),null);`);}
});
test('refusal assigns the shared residence and does not invent roommates',()=>{
 const b=game();b.run(`Math.random=()=>0;var ev=childMotherResidenceRequests()[0];var result=ev.choices[1].f();assert.match(result,/暂无其他适龄孩子/);assert.match(child.story.at(-1).t,/难过/);assert.match(mother.story.at(-1).t,/心疼/);assert.match(childResidence(child),/暂无其他同住的公主/);assert.equal(youngChildMother(child),null);
 var sibling=makeKid(mother,'f','静好');sibling.born=S.turn-7*12;assert.match(childResidence(child),/静好同住/);assert.match(childResidence(sibling),/念安同住/);sibling.away=true;assert.match(childResidence(child),/暂无其他同住的公主/);`);
});
test('older children may ask to return and foster mothers are the actual caregiver',()=>{
 const b=game('f',10);b.run(`var foster=harem().find(c=>c!==mother);child.foster=foster.id;Math.random=()=>0;var ev=childMotherResidenceRequests()[0];assert.match(ev.text,/已不再随母同住/);ev.choices[0].f();assert.equal(youngChildMother(child),foster);assert.match(childResidence(child),/养母/);`);
});
test('a previous version cannot generate requests or alter the six-year-old residence',()=>{
 const b=game();b.run(`var old=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>104,configurable:true});Math.random=()=>0;assert.equal(childMotherResidenceRequests().length,0);child.motherResidence={choice:'stay',caregiver:mother.id};assert.equal(youngChildMother(child),null);assert.equal(childResidence(child),'');Object.defineProperty(PalaceActions,'contentVersion',old);`);
});
test('monthly request and its selected arrangement survive pending-scene reload',()=>{
 let b=game('f',6);b.run(`child.born++;E().health=100;E().people=90;E().treasury=5000;var seed=2;Math.random=()=>((seed=seed*16807%2147483647)/2147483647);PalaceActions.reset();A.endMonth();
 for(var i=0;i<100&&curEv?.title!=='孩子请求随母同住';i++){if(modalResult)nextEv();else if(modalOpen){var j=curEv.choices.findIndex(c=>!c.cond||c.cond());assert.ok(j>=0);choose(j);}else break;}
 assert.equal(curEv?.title,'孩子请求随母同住');`);
 const id=b.run('childId'),motherId=b.run('motherId');
 b=boot(9,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'孩子请求随母同住');choose(0);assert.equal(kidById(${id}).motherResidence.choice,'stay');assert.equal(youngChildMother(kidById(${id})).id,${motherId});`);
 b=boot(11,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(kidById(${id}).motherResidence.choice,'stay');assert.equal(youngChildMother(kidById(${id})).id,${motherId});`);
});
test('living maternal relatives may learn and discuss the actual decision with reactions for sons and daughters',()=>{
 for(const sex of ['f','m']){const b=game(sex);b.run(`var house=houseOf(mother),father=house.father;house.brother={id:'uncle-test',name:'外家兄长',alive:true,story:[]};Math.random=()=>0;var ev=childMotherResidenceRequests()[0];ev.choices[1].f();
 for(const [person,role] of [[father,'father'],[house.brother,'brother']]){assert.equal(person.motherResidenceNews.at(-1).child,child.id);assert.match(person.story.at(-1).t,/未允/);var talk=officialConversation({c:mother,p:person,role,h:house},'family');assert.match(talk,/${sex==='m'?'振作':'怜爱'}/);assert.match(talk,/念安/);child.alive=false;assert.match(officialConversation({c:mother,p:person,role,h:house},'family'),/难过/);child.alive=true;}`);}
});
test('only living relatives who actually hear the news can discuss it',()=>{
 const b=game();b.run(`var h=houseOf(mother);h.father.alive=false;h.brother={id:'uncle-test',name:'外家兄长',alive:true,story:[]};var count=0;Math.random=()=>count++===0?0:.99;var ev=childMotherResidenceRequests()[0];ev.choices[0].f();assert.equal(h.father.motherResidenceNews,undefined);assert.equal(h.brother.motherResidenceNews,undefined);assert.doesNotMatch(officialConversation({c:mother,p:h.brother,role:'brother',h},'family'),/念安/);`);
});
test('an informed grandfather has an explicit conversation option even when other family stories take priority',()=>{
 const b=game();b.run(`var h=houseOf(mother);Math.random=()=>0;childMotherResidenceRequests()[0].choices[0].f();E().energy=4;PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.match(curEv.title,/召见议事|赐书问候/);var index=curEv.choices.findIndex(c=>c.t.includes('谈孩子请求同住'));assert.ok(index>=0);choose(index);assert.match(modalResult.text,/念安/);assert.match(modalResult.text,/怜爱/);`);
});
test('officials without the news and older pending conversations do not gain the new option',()=>{
 const b=game();b.run(`var h=houseOf(mother);E().energy=4;PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.ok(!curEv.choices.some(c=>c.t.includes('谈孩子请求同住')));drain();
 delete h.father.lastAudience;E().energy=4;h.father.motherResidenceNews=[{name:child.name,child:child.id,sex:'f',stay:true}];var old=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>105,configurable:true});PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.ok(!curEv.choices.some(c=>c.t.includes('谈孩子请求同住')));Object.defineProperty(PalaceActions,'contentVersion',old);`);
});
test('a pending request from before the emotional follow-up replays its original text',()=>{
 for(const choice of [0,1]){const b=game();b.run(`var original=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>107,configurable:true});Math.random=()=>0;var ev=childMotherResidenceRequests()[0];var result=ev.choices[${choice}].f();assert.doesNotMatch(result,/欢喜地依偎|孩子难过地低下头/);assert.doesNotMatch(child.story.at(-1).t,/欢喜地松|眼圈发红/);assert.doesNotMatch(mother.story.at(-1).t,/自己也欢喜|她心疼孩子/);Object.defineProperty(PalaceActions,'contentVersion',original);`);}
});
