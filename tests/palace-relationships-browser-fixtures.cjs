/* Reproducible, disposable fixtures imported through the game's save screen. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-relationships-fixtures';fs.mkdirSync(out,{recursive:true});
function world(seed=782){const b=boot(seed);b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=10;E().treasury=900;S.consorts=[];S.children=[];S.rel={};
 var queen=makeGirl({sur:'沈',given:'知微',age:26,trait:'温婉'});addConsort(queen,8,'册立皇后');queen.artPortrait=98;queen.solitary=null;delete queen.timeTraveler;`);return b;}
function write(name,b){b.run('PalaceActions.reset()');fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
for(const rival of [false,true]){const b=world();b.run(`var a=makeGirl({sur:'沈',given:'清微',age:22,trait:'善妒'}),b=makeGirl({sur:'顾',given:'兰音',age:23,trait:'活泼'});
 for(var p of [a,b]){p.solitary=null;p.kin={};p.kinRival={};delete p.timeTraveler;}
 S.cands=[a,b];S.selection={phase:'roster',performed:[]};selectionBatch();linkSelectionFriends(a,b,{kind:'childhood',memory:'幼时在花宴相识，两家交好，常互通问候',score:42});
 ${rival?'a.kinRival[b.id]=true;':''}UI.view='xx';`);write(rival?'rival':'friends',b);}
for(const married of [false,true]){const b=world(921);b.run(`var g=makeKin(queen,'亲');addConsort(g,2,'姐妹入宫');g.given='知柔';var h=houseOf(queen),p=addNatalPerson(queen,h,'f',22,791,false);
 p.married=${married};p.willing=true;delete p.spouse;p.visit={host:queen.id,until:S.turn+2};UI.view='natal';UI.sel=g.id+':'+p.id;`);write(married?'married-sister':'sister',b);}
{const b=world();b.run(`queen.jewelry=Object.keys(JEWELRY).map(id=>({id,date:dateStr(),reason:'御前赏赐'}));queen.jewelryWorn='';UI.view='consort';UI.sel=queen.id;`);write('crowns',b);}
for(const [name,trait,sexes] of [['daughter','善妒',['f']],['son','城府',['m']],['twins','淡泊',['f','f']]]){
 let b;
 // Select a deterministic pending naming action that actually resolves the desired branch.
 for(let seed=1;seed<80;seed++){
  const w=world(seed);w.run(`queen.trait=${JSON.stringify(trait)};queen.favor=20;var children=${JSON.stringify(sexes)}.map((sex,i)=>makeKid(queen,sex,['知秋','知夏'][i]));
   for(var k of children)k.pendingName=true;registerMultipleBirth(children);queen.delivery={children:children.map(k=>k.id),date:dateStr(),turn:S.turn,settled:false,difficult:false,kind:birthType(children.map(k=>k.sex))};
   PalaceActions.reset();A.resumeBirth(queen.id);`);
  const pending=w.run('JSON.stringify(PalaceActions.payload())');w.run('choose(0)');
  if(name!=='daughter'||w.run('queen.delivery.feeling.regret')){b=name==='daughter'?w.run('JSON.stringify(PalaceActions.payload())'):pending;break;}
 }
 if(!b)throw Error('No childbirth fixture '+name);fs.writeFileSync(path.join(out,name+'.json'),b);
}
for(const legacy of [false,true]){const w=world(873);w.run(`var other=makeGirl({sur:'顾',given:'明珠',age:24,trait:'善妒',fam:{t:'户部侍郎',p:55}});addConsort(other,4,'入宫');other.solitary=null;other.favor=5;
 var oh=houseOf(other);oh.brother={id:'demo-brother',name:'顾云深',sur:'顾',age:28,alive:true,married:false,career:'official',post:'翰林院编修',story:[]};houseOf(other);
 var sister=addNatalPerson(queen,houseOf(queen),'f',28,791,false);sister.married=false;delete sister.spouse;sister.willing=true;
 var match={kind:'alliance',name:'顾云深',sur:'顾',desc:'顾明珠的兄长',consortId:other.id,personId:'demo-brother',role:'brother'};
 S.rel[rk(queen,other)]=0;queen.favor=60;
 ${legacy?'marriageFriendshipsMarry(queen,sister,match);':'sister.betrothal={turn:58,due:70,seen:false,match};sister.visit={host:queen.id,until:62};'}
 PalaceActions.reset();${legacy?'':'A.natalMeet(queen.id,sister.id);'}`);
 fs.writeFileSync(path.join(out,(legacy?'marriage-legacy':'marriage')+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));
}
console.log('Created ten relationship, portrait and childbirth fixtures in '+out);
