// Creates an importable demonstration save through the actual game runtime.
// node tests/lived-chronicles-browser-fixture.cjs /tmp/palace-lived-browser.json
const fs=require('node:fs');
const {boot}=require('./playtest-harness.cjs');
const b=boot(202);
b.run(`A.start();drain();S.turn=72;S.year=7;S.month=3;E().age=26;E().energy=maxEnergy();
 var a=harem()[0],b=harem()[1];a.sur='沈';a.given='知微';a.age=30;a.trait='才女';a.solitary={path:'both',stage:0,last:null,respect:0,history:[],origin:solitaryOrigin(a)};a.hp=90;a.aff=80;a.mood=80;a.preg=0;b.sur='柳';b.given='凝音';b.age=29;b.hp=90;b.preg=0;S.rel[rk(a,b)]=60;
 a.selectionCohort=b.selectionCohort={id:'1:0:1',date:'永宁元年三月'};cohortLifeTick();
 var child=makeKid(a,'f','昭宁');child.born=S.turn-8*12;child.pendingName=false;parentEpisodeEvent(a).choices[0].f();S.turn++;S.month++;parentEpisodeTick();
 var kids=[makeKid(a,'m','承安'),makeKid(a,'f','明月')];kids.forEach(k=>k.pendingName=false);registerMultipleBirth(kids);a.delivery={children:kids.map(k=>k.id),turn:S.turn,date:dateStr(),kind:'龙凤胎',settled:true,carePlan:{closed:false}};
 var h=houseOf(a);h.natal.memberBorn[a.id]=S.turn-a.age*12;var sister=addNatalPerson(a,h,'f',24,11,false);sister.married=true;sister.spouse={name:'顾明谦',sur:'顾',born:S.turn-300};sister.lifeCourse={path:'整理家藏书卷',adult:S.turn,last:S.turn};natalLifeRecord(a,[sister],'自己的生计',sister.name+'在家中整理书卷，也经营自己的家庭。');
 E().energy=maxEnergy();UI.sel=a.id;viewConsort();UI.sel=child.id;viewKid();UI.sel=a.id+':'+sister.id;viewNatalRelative();PalaceActions.reset();`);
fs.writeFileSync(process.argv[2]||'/tmp/palace-lived-browser.json',b.run('JSON.stringify({...PalaceActions.payload(),saveVersion:SaveManager.version})'));
console.log(b.run('JSON.stringify({mother:a.id,friend:b.id,child:child.id,sister:sister.id,twins:kids.map(k=>k.id)})'));
