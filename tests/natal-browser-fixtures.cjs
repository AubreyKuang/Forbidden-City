// Import into the isolated dev.html save namespace through the real backup UI.
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const dir='/tmp/palace-natal-fixtures';fs.mkdirSync(dir,{recursive:true});
function world(){const w=boot(921);w.run(`A.newGame();A.start();drain();S.turn=48;S.year=5;S.month=1;S.consorts=[];S.children=[];E().energy=20;E().treasury=1500;
 var c=makeGirl({sur:'沈',given:'知微',trait:'温婉',age:26,fam:{t:'翰林学士',p:45}});addConsort(c,4,'入宫');c.enteredAt=12;c.hp=90;c.favor=45;c.aff=45;c.nights=0;delete c.solitary;
 var h=houseOf(c);for(var role of brotherRoles(h))delete h[role];h.relatives=[];var p=addNatalPerson(c,h,'f',22,791,false);p.married=false;p.willing=true;relAdd(c,p,60-relGet(c,p));
 var brother=addNatalPerson(c,h,'m',20,703,false);brother.education=brother.post='举人';brother.examTurn=S.turn;houseOf(c);UI.view='family';PalaceActions.reset();`);return w;}
function write(name,w){fs.writeFileSync(path.join(dir,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));}
let w=world();write('family',w);
w=world();w.run(`A.natalVisit(c.id,p.id);`);write('visit',w);
w=world();w.run(`A.natalVisit(c.id,p.id);choose(0);choose(1);`);write('admission',w);
w=world();w.run(`A.appointRelative(c.id+':relative'+brother.id);`);write('scholar',w);
w=world();w.run(`c.trait='善妒';c.favor=90;var g=makeKin(c,'堂');c.kinRival={};g.kinRival={};relAdd(c,g,20-relGet(c,g));addConsort(g,2,'娘家送来同族堂妹');UI.view='consort';UI.sel=c.id;PalaceActions.reset();`);write('rivalry',w);
w=world();w.run(`c.trait='体弱';c.hp=30;c.rank=5;c.favor=45;var m=makeGirl({sur:'许',given:'清容',age:24});addConsort(m,1,'入宫');var k=makeKid(m,'f','明月');k.pendingName=false;PalaceActions.reset();A.fosterWish(c.id);`);write('frail',w);
w=world();w.run(`c.favor=15;PalaceActions.reset();A.awaitingNotice(c.id);`);write('waiting',w);
w=world();w.run(`var d=ensureDowager();c.clan=d.clan;c.virtue=20;c.favor=20;var o=makeGirl({sur:'许',given:'清容',age:25});addConsort(o,4,'入宫');o.clan='许|翰林学士';o.virtue=20;o.favor=95;PalaceActions.reset();`);w.force(.5);w.run(`A.greet();`);write('dowager',w);
w=world();w.force(.01);w.run(`A.out('city');`);write('foreign',w);
w=world();w.run(`var g=newMaid('长街');g.sur='林';g.given='清月';g.age=22;g.preg=10;g.near=false;g.nights=1;PalaceActions.reset();A.endMonth();`);write('maid-birth',w);
console.log(dir);
