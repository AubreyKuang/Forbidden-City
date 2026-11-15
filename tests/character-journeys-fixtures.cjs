/* UI-importable, disposable fixtures; never alter a player's primary save. */
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-character-fixtures';fs.mkdirSync(out,{recursive:true});
function world(){const b=boot(823);b.run(`A.newGame();A.start();drain();S.turn=72;S.year=7;S.month=1;var c=makeGirl({sur:'沈',given:'知微',trait:'才女',age:36,fam:{t:'翰林学士',p:50}});c.solitary={path:'both',stage:0,history:[],respect:0};addConsort(c,3,'选秀入宫');c.enteredAt=50;c.aff=78;c.hp=88;c.mood=72;c.xin={k:'平和',t:S.turn};E().energy=10;E().treasury=2000;var k=makeKid(c,'f','清和');k.born=S.turn-72;k.pendingName=false;maternalTick();UI.view='consort';UI.sel=c.id;PalaceActions.reset();`);return b;}
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
let b=world();write('mother',b);
b=world();b.run(`A.journeyBegin(c.id,'quietChild');`);write('journey',b);
b=world();b.run(`journeyStart(c,'quietChild');journeyEvent(c).choices[0].f();S.turn+=3;journeyEvent(c).choices[0].f();S.turn+=3;A.journeyTalk(c.id);`);write('journey-ending',b);
b=world();b.run(`k.alive=false;maternalTick();S.turn+=6;maternalTick();A.maternalCare(c.id,k.id);`);write('grief',b);
b=world();b.run(`delete c.solitary;c.wound='quiet';A.homeLeave(c.id);`);write('leave',b);
b=world();b.force(.01);b.run(`A.out('city');`);write('market',b);
b=world();b.force(.01);b.run(`A.out('city');choose(0);choose(1);drain();var g=S.shelteredGuests[0];S.turn+=9;g.rescue.trust=65;g.aff=60;g.enteredAt=S.turn-9;A.journeyBegin(g.id,'distantHome');`);write('homeland',b);
b=world();b.run(`c.fam={t:'西域流寓',p:5};c.rescue={at:0,trust:45};delete c.solitary;for(var o of harem())if(o!==c){o.fam.p=90;o.trait='骄矜';delete o.solitary;}pushEv(originPressureEvent());`);write('prejudice',b);
b=world();b.run(`k.born=S.turn-216;k.married=true;k.spouse={name:'许清',born:S.turn-216,alive:true,seed:999};ensureMarriedLife(k);kstory(k,'幼时在母亲身边读书，留着第一张写歪的字。');householdRecord(k,'shared-project','夫妻共写一封家书，也谈妥了小家的来年用度。');UI.view='kid';UI.sel=k.id;`);write('chronicle',b);
console.log(out);
