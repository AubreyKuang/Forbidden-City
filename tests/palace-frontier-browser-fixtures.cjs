/* Disposable fixtures produced through game actions; import in an isolated browser profile. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
const out=process.argv[2]||'/tmp/palace-frontier-fixtures';fs.mkdirSync(out,{recursive:true});
function world(seed=821){const b=boot(seed);b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;E().energy=10;E().treasury=900;S.consorts=[];S.children=[];S.rel={};`);return b;}
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
for(const name of ['daughter','unwilling','family-daughter','promotion','silver','defer','defeat']){
 const b=world();b.run(`var e=frontierCreateGeneral();e.c.willing=${name!=='unwilling'};e.p.temperament='${name==='promotion'?'进取':name==='silver'?'谨慎':'圆融'}';
 ${['family-daughter','promotion'].includes(name)?`addConsort(e.c,4,'将门入宫');S.flags.frontierHouses=[];e=officialEntry(e.key);e.h.relatives=[];var sister=addNatalPerson(e.c,e.h,'f',22,791,false);sister.married=false;delete sister.spouse;delete sister.betrothal;sister.willing=true;for(var role of brotherRoles(e.h))e.h[role].retired=true;`:''}
 ${name==='promotion'?`e.p.office='总兵';`:''}
 S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:1,person:${['family-daughter','promotion'].includes(name)?'e.c.id':'null'}};PalaceActions.reset();A.court();`);
 b.force(name==='defeat'?.99:0);b.run(`choose(${['family-daughter','promotion'].includes(name)?3:0});`);write(name,b);
}
{const b=world();b.run(`var c=makeGirl({sur:'沈',given:'清微',age:26,trait:'温婉'});addConsort(c,4,'入宫');c.solitary=null;c.mood=70;c.aff=70;c.xin={k:'平和',t:S.turn};
 var k=makeKid(c,'f','清宁');k.parentage={father:{...k.birthTraits.father},status:'investigating',due:60,clue:{kind:'whisper'}};PalaceActions.reset();A.parentageInquiry(k.id);`);write('cleared',b);}
for(const offset of [0,2]){const b=world();b.run(`genCands(1);var c=S.cands[0];c.solitary=null;A.xxTake(c.id);choose(2);drain();A.xxEnd();drain();S.turn+=${offset};S.month+=${offset};UI.view='xx';PalaceActions.reset();`);write(offset?'expired':'arrivals',b);}
{const b=world();b.run(`var c=makeGirl({sur:'沈',given:'知微',age:26,trait:'温婉',fam:{t:'吏部尚书',p:78}});addConsort(c,8,'册立皇后');var h=houseOf(c);
 h.brother={id:'student-demo',name:'沈闻书',age:24,career:'student',education:'秀才',post:'秀才',alive:true,story:[]};houseOf(c);
 var scholar=makeScholar();scholar.name='顾明远';scholar.office='翰林院编修';S.scholars=[scholar];UI.view='officials';UI.officialsFilter='all';PalaceActions.reset();`);write('officials',b);}
for(const name of ['dowager-praise','dowager-chat']){const b=world();b.run(`var d=ensureDowager(),c=makeGirl({sur:d.sur,given:'清微',age:24,trait:'骄纵'});addConsort(c,4,'入宫');c.clan=d.clan;c.virtue=75;c.solitary=null;d.lastOffer=60;UI.view='place';UI.sel='cn';PalaceActions.reset();`);b.force(name==='dowager-praise'?.01:.9,0);b.run('A.greet()');write(name,b);}
console.log('Created thirteen frontier, parentage, selection, officials and dowager fixtures in '+out);
