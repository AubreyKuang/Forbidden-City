// Import through dev.html's backup UI; never edit a player's production save.
const fs=require('node:fs'),{boot}=require('./playtest-harness.cjs');
const setup=`A.start();drain();S.turn=72;S.year=7;S.month=3;E().age=30;E().energy=8;S.consorts=[];S.children=[];S.rel={};
var m=makeGirl({sur:'沈',given:'知微',age:30,trait:'才女'}),f=makeGirl({sur:'柳',given:'凝音',age:29,trait:'温婉'}),o=makeGirl({sur:'顾',given:'明珠',age:28,trait:'骄矜'});
for(var c of [m,f,o]){addConsort(c,5,'入宫');c.solitary=null;c.hp=90;c.aff=75;c.favor=45;c.preg=0;}
m.solitary={path:'both',stage:0,last:null,respect:0,history:[],origin:solitaryOrigin(m)};
var k=makeKid(m,'f','昭宁');k.born=S.turn-8*12;k.pendingName=false;k.foster=f.id;k.fosterT=S.turn-36;k.motherBonds={[m.id]:{trust:55},[f.id]:{trust:70}};
var h=houseOf(m),p=addNatalPerson(m,h,'f',22,791,false);p.willing=true;p.married=false;p.visit={host:m.id,until:S.turn+2};S.rel[rk(m,p)]=65;
UI.view='kid';UI.sel=k.id;render();PalaceActions.reset();`;
for(const mode of ['child','sister','former','roster']){
 const b=boot(920);b.run(setup);
 if(mode==='child'){b.force(0,0);b.run('A.kidVisit(k.id)');}
 if(mode==='sister')b.run('A.natalMeet(m.id,p.id);choose(1)');
 if(mode==='former')b.run('doFoster(k,o);S.turn+=3;S.month+=3;UI.view="kid";UI.sel=k.id;render();PalaceActions.reset();');
 if(mode==='roster')b.run(`S.consorts=[];S.rel={};var leads=[],followers=[];for(var i=0;i<4;i++){var a=makeGirl({trait:'持重',age:30}),z=makeGirl({trait:'活泼',age:22});addConsort(a,5,'入宫');addConsort(z,2,'入宫');a.solitary=null;z.solitary=null;leads.push(a);followers.push(z);}S.consorts.push(m);m.rank=4;var old=makeGirl({sur:'陆',given:'清和',age:26});old.alive=false;S.consorts.push(old);S.children=[];S.rel={};for(var i=0;i<4;i++)S.rel[rk(leads[i],followers[i])]=60;UI.view='harem';render();PalaceActions.reset();`);
 fs.writeFileSync('/tmp/palace-family-'+mode+'.json',b.run('JSON.stringify({...PalaceActions.payload(),saveVersion:SaveManager.version})'));
 console.log(mode,b.run('JSON.stringify({mother:m.id,foster:f.id,next:o.id,child:k.id,sister:p.id})'));
}
