const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function game(sex='f',age=6){const b=boot(6123);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=240;S.year=21;S.month=1;var mother=harem().find(c=>!c.cold);var child=makeKid(mother,'${sex}','念安');child.born=S.turn-${age}*12;child.temperament='内敛';child.love=60;function setRoll(k,target){for(let seed=0;seed<10000;seed++){k.seed=seed;if(childMotherResidenceRoll(k)===target)return;}throw Error('missing birthday fixture');}setRoll(child,0);var childId=child.id,motherId=mother.id;`);return b;}
test('a quiet child asks on an eligible birthday, with a ten percent roll for princesses',()=>{
 for(const [sex,roll,expected] of [['f',9,1],['f',10,0],['m',17,1],['m',18,0]]){const b=game(sex);b.run(`setRoll(child,${roll});assert.equal(childMotherResidenceRequests().length,${expected});`);}
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
test('a six-year-old can ask to stay with the foster mother who raises him',()=>{
 const b=game('m',6);b.run(`var foster=harem().find(c=>c!==mother);child.foster=foster.id;Math.random=()=>0;var ev=childMotherResidenceRequests()[0];assert.match(ev.text,/该搬往皇子居所/);ev.choices[0].f();assert.equal(youngChildMother(child),foster);assert.match(childResidence(child),/养母/);`);
});
test('a previous version cannot generate requests or alter the six-year-old residence',()=>{
 const b=game();b.run(`var old=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>104,configurable:true});Math.random=()=>0;assert.equal(childMotherResidenceRequests().length,0);child.motherResidence={choice:'stay',caregiver:mother.id};assert.equal(youngChildMother(child),null);assert.equal(childResidence(child),'');Object.defineProperty(PalaceActions,'contentVersion',old);`);
});
test('monthly request and its selected arrangement survive pending-scene reload',()=>{
 let b=game('f',6);b.run(`child.born++;E().health=100;E().people=90;E().treasury=5000;var seed=15;Math.random=()=>((seed=seed*16807%2147483647)/2147483647);PalaceActions.reset();A.endMonth();
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
 const b=game();b.run(`var h=houseOf(mother);h.father.alive=false;h.brother={id:'uncle-test',name:'外家兄长',alive:true,story:[]};Math.random=()=>.99;var ev=childMotherResidenceRequests()[0];ev.choices[0].f();assert.equal(h.father.motherResidenceNews,undefined);assert.equal(h.brother.motherResidenceNews,undefined);assert.doesNotMatch(officialConversation({c:mother,p:h.brother,role:'brother',h},'family'),/念安/);`);
});
test('an informed grandfather has an explicit conversation option even when other family stories take priority',()=>{
 const b=game();b.run(`var h=houseOf(mother);Math.random=()=>0;childMotherResidenceRequests()[0].choices[0].f();E().energy=4;PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.match(curEv.title,/召见议事|赐书问候/);var index=curEv.choices.findIndex(c=>c.t.includes('谈孩子请求同住'));assert.ok(index>=0);choose(index);assert.match(modalResult.text,/念安/);assert.match(modalResult.text,/怜爱/);`);
});
test('officials without the news and older pending conversations do not gain the new option',()=>{
 const b=game();b.run(`var h=houseOf(mother);E().energy=4;PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.ok(!curEv.choices.some(c=>c.t.includes('谈孩子请求同住')));drain();
 delete h.father.lastAudience;E().energy=4;h.father.motherResidenceNews=[{name:child.name,child:child.id,sex:'f',stay:true}];var old=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>105,configurable:true});PalaceActions.reset();A.officialAct(mother.id+':father','talk');assert.ok(!curEv.choices.some(c=>c.t.includes('谈孩子请求同住')));Object.defineProperty(PalaceActions,'contentVersion',old);`);
});
test('a pending request from before the emotional follow-up replays its original text',()=>{
 for(const choice of [0,1]){const b=game();b.run(`var original=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>108,configurable:true});Math.random=()=>0;var ev=childMotherResidenceRequests()[0];var result=ev.choices[${choice}].f();assert.doesNotMatch(result,/欢喜地依偎|孩子难过地低下头/);assert.doesNotMatch(child.story.at(-1).t,/欢喜地松|眼圈发红/);assert.doesNotMatch(mother.story.at(-1).t,/自己也欢喜|她心疼孩子/);Object.defineProperty(PalaceActions,'contentVersion',original);`);}
});
test('recent mother-residence choices shape both child and caregiver conversation without contradicting later changes',()=>{
 for(const choice of [0,1]){const b=game();b.run(`Math.random=()=>0;childMotherResidenceRequests()[0].choices[${choice}].f();var home=currentMotherResidenceConversation(child);assert.equal(home.mother,mother);assert.equal(home.stay,${choice===0});
 var voice=childVoicePool(child).find(v=>v.key==='mother-residence');assert.ok(voice);assert.match(voice.lines.join(''),/${choice===0?'高兴':'不习惯'}/);
 var topic=consortChatTopics(mother).find(t=>t.id==='mother-residence-'+child.id);assert.ok(topic);assert.match(topic.make().text,/${choice===0?'身边':'牵挂|安静'}/);
 child.away=true;assert.equal(currentMotherResidenceConversation(child),null);child.away=false;mother.cold=true;assert.equal(currentMotherResidenceConversation(child),null);mother.cold=false;
 S.turn+=13;assert.equal(currentMotherResidenceConversation(child),null);assert.ok(!consortChatTopics(mother).some(t=>t.id==='mother-residence-'+child.id));`);}
});
test('a child awaiting their unavailable caregiver is not counted as another child’s roommate',()=>{
 const b=game();b.run(`var waiting=makeKid(mother,'f','静好');waiting.born=S.turn-7*12;waiting.motherResidence={choice:'stay',caregiver:mother.id,turn:S.turn};child.motherResidence={choice:'shared',caregiver:mother.id,turn:S.turn};mother.cold=true;
 assert.match(childResidence(waiting),/宫人照料/);assert.match(childResidence(child),/暂无其他同住的公主/);mother.cold=false;assert.equal(youngChildMother(waiting),mother);assert.match(childResidence(child),/暂无其他同住的公主/);`);
});
test('an aunt who raises a child is named correctly and a solitary mother has a fitting follow-up',()=>{
 const b=game();b.run(`var aunt=makeGirl({sur:mother.sur,given:'如岚',age:30,trait:'沉静'});addConsort(aunt,4,'入宫');aunt.kin||={};aunt.kin[mother.id]='亲姐';aunt.solitary={path:'letters'};child.foster=aunt.id;Math.random=()=>0;childMotherResidenceRequests()[0].choices[0].f();
 assert.match(childResidence(child),/姨母/);assert.match(childVoicePool(child).find(v=>v.key==='mother-residence').lines.join(''),/姨母/);assert.match(consortChatTopics(aunt).find(t=>t.id==='mother-residence-'+child.id).make().text,/各自读书/);
 var original=Object.getOwnPropertyDescriptor(PalaceActions,'contentVersion');Object.defineProperty(PalaceActions,'contentVersion',{get:()=>110,configurable:true});assert.equal(currentMotherResidenceConversation(child),null);assert.doesNotMatch(childResidence(child),/姨母/);Object.defineProperty(PalaceActions,'contentVersion',original);`);
});

test('each princess gets her own sixth birthday roll, including twins and after another child asked',()=>{
 const b=game();b.run(`var twin=makeKid(mother,'f','静好');twin.temperament='内敛';twin.born=child.born;
  setRoll(child,10);setRoll(twin,9);
  var events=childMotherResidenceRequests();assert.deepEqual(events.map(e=>e.por.id),[twin.id]);assert.ok(child.motherResidenceChecked&&twin.motherResidenceChecked);
  save('auto');A.load('auto');Math.random=()=>0;assert.equal(childMotherResidenceRequests().length,0);`);
});
test('missing the sixth birthday closes the opportunity even after reload and on every later birthday',()=>{
 for(const sex of ['m','f']){const b=game(sex);b.run(`var birthday=S.turn;S.turn--;Math.random=()=>0;assert.equal(childMotherResidenceRequests().length,0);
  S.turn=birthday;setRoll(child,18);assert.equal(childMotherResidenceRequests().length,0);save('auto');A.load('auto');
  Math.random=()=>0;for(let i=0;i<=10*12;i++){S.turn=birthday+i;assert.equal(childMotherResidenceRequests().length,0);}`);}
});

test('replaying a v117 seventh birthday preserves its original random roll and request',()=>{
 const b=game('f',7);b.run(`Object.defineProperty(PalaceActions,'contentVersion',{get:()=>117});Math.random=()=>.34;
  var events=childMotherResidenceRequests();assert.equal(events.length,1);assert.match(events[0].text,/想搬回/);assert.equal(child.motherResidenceChecked,undefined);`);
});
