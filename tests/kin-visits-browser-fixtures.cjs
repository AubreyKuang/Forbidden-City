/* UI-importable, disposable scenarios; no access to player saves. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-kin-visits-fixtures';fs.mkdirSync(out,{recursive:true});
function world(){const b=boot(873);b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.children=[];S.rel={};E().energy=10;E().treasury=900;
 var c=makeGirl({sur:'沈',given:'知微',age:26,trait:'温婉',fam:{t:'翰林学士',p:45}}),o=makeGirl({sur:'顾',given:'明珠',age:24,trait:'温婉',fam:{t:'户部侍郎',p:55}});
 for(var x of [c,o]){addConsort(x,4,'入宫');x.solitary=null;delete x.timeTraveler;x.enteredAt=36;x.hp=90;x.favor=40;}
 var h=houseOf(c),oh=houseOf(o);oh.brother={id:'test-brother',name:'顾云深',sur:'顾',age:26,alive:true,married:false,career:'official',post:'翰林院编修',story:[]};houseOf(o);
 var p=addNatalPerson(c,h,'f',22,791,false);p.married=false;p.willing=true;delete p.spouse;p.marriageChecked=48;
 p.betrothal={turn:58,due:72,seen:false,match:{kind:'alliance',name:'顾云深',sur:'顾',desc:'顾明珠的兄长',consortId:o.id,personId:'test-brother',role:'brother'}};
 p.visit={host:c.id,from:60,until:62};S.rel[rk(c,o)]=50;UI.view='natal';UI.sel=c.id+':'+p.id;PalaceActions.reset();`);return b;}
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
let b=world();b.run('A.natalMeet(c.id,p.id)');write('visiting-sister',b);
b=world();b.run('p.willing=false;A.natalMeet(c.id,p.id)');write('declines-palace',b);
b=world();b.run(`delete p.visit;var g=makeGirl({sur:'许',given:'清容',age:22,trait:'温婉',fam:{t:'礼部侍郎',p:50}});g.solitary=null;delete g.timeTraveler;g.kin={};c.kin={};c.trait='善妒';
 makeOldFriendTie(g,c);S.cands=[g];S.selection={phase:'audience',current:g.id,performed:[]};selectionBatch();UI.view='xx';PalaceActions.reset();save('auto');`);write('old-friends',b);
b=world();b.run(`delete p.visit;var g=makeGirl({sur:'许',given:'清容',age:22,trait:'温婉',fam:{t:'礼部侍郎',p:50}});g.solitary=null;delete g.timeTraveler;g.kin={};c.kin={};
 makeOldFriendTie(g,c);addConsort(g,2,'选秀入宫');S.turn+=6;S.month=7;c.favor=15;g.favor=80;oldFriendLifeTick();UI.view='consort';UI.sel=c.id;PalaceActions.reset();save('auto');`);write('old-friends-later',b);
console.log('Created four kin visit scenarios in '+out);
