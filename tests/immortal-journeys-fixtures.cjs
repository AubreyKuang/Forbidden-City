/* Disposable UI-importable scenarios. Never read or write the player's own saves. */
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-immortal-fixtures';fs.mkdirSync(out,{recursive:true});
function world(){const b=boot(318);b.run(`A.start();drain();S.turn=300;S.year=26;S.month=1;E().age=45;E().energy=20;E().health=90;E().people=75;E().treasury=2000;S.children=[];
 var m=makeGirl({sur:'沈',given:'知微',age:40,trait:'才女'});addConsort(m,3,'入宫');m.aff=85;m.hp=90;m.enteredAt=100;m.solitary={path:'both',stage:0,history:[],respect:0};m.xin={k:'平和',t:S.turn};
 var f=makeGirl({sur:'许',given:'清容',age:39,trait:'温婉'});addConsort(f,3,'入宫');var k=makeKid(m,'f','清和');k.born=S.turn-192;k.hp=90;k.amb=10;k.lit=70;k.mar=30;k.pendingName=false;k.immortalTalent='水灵根';k.foster=f.id;k.temperament='自矜';k.daoPractice={path:'dao',visits:6};immortalDiscover(k);UI.view='kid';UI.sel=k.id;PalaceActions.reset();`);return b;}
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
let b=world();b.run('A.immortalTalk(k.id)');write('master',b);
b=world();b.run('immortalDepart(k);S.turn+=12;PalaceActions.reset();A.immortalTalk(k.id)');write('first-trial',b);
b=world();b.run(`immortalDepart(k);S.turn+=12;immortalEvent(k).choices[0].f();S.turn+=12;PalaceActions.reset();A.immortalTalk(k.id);`);write('stay-or-return',b);
b=world();b.run(`immortalDepart(k);k.immortal.stage='sect';k.immortal.practice='care';k.immortal.merit=8;S.turn+=180;k.immortal.due=S.turn;PalaceActions.reset();A.immortalTalk(k.id);`);write('sect-leader',b);
b=world();b.run(`immortalDepart(k);k.immortal.stage='sect';k.immortal.practice='care';k.immortal.merit=4;var id=k.id,h=makeKid(m,'m','承安');h.born=S.turn-240;h.pendingName=false;S.heir=h.id;succeed(h);choose(0,'承平');drain();S.turn+=96;var k=royalById(id);k.immortal.due=S.turn;UI.view='relative';UI.sel=id;PalaceActions.reset();A.immortalTalk(id);`);write('next-reign',b);
b=world();b.run(`UI.view='consort';UI.sel=m.id;PalaceActions.reset();A.journeyBegin(m.id,'windowChess');`);write('window-chess',b);
console.log('Created 6 disposable scenarios in '+out);
