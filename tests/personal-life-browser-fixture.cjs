// A local-only mid-game demonstration built with the actual game operations.
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const root=path.resolve(__dirname,'..'),b=boot(202);
b.run(`A.start();drain();S.turn=36;S.year=4;S.month=5;E().age=27;E().energy=6;E().treasury=1200;
 var queen=harem()[0];S.consorts=[queen];queen.trait='持重';queen.age=29;queen.preg=0;queen.hp=95;
 var author=makeGirl({sur:'沈',given:'知微',trait:'才女',age:25}),friend=makeGirl({sur:'柳',given:'音',trait:'温婉',age:26});
 addConsort(author,3,'选秀入宫');addConsort(friend,3,'选秀入宫');
 for(const c of [author,friend]){delete c.solitary;c.hobby='读书';c.aff=75;c.hp=95;c.preg=0;c.arc.t=10000;}
 relAdd(author,friend,70);var child=makeKid(author,'f','昭宁');child.born=S.turn-7*12;
 lifeStart(author,lifeProposal(author),'private');
 for(var i=0;i<3;i++){S.turn++;S.month++;personalLifeTick();}
 lifeFinish(author,author.personalLife.project,'private');A.lifePass(author.id,child.id,author.personalLife.works[0].id);
 A.lifeRitual(author.id);choose(0);drain();
 S.turn+=12;S.year++;E().age++;author.age++;friend.age++;E().energy=6;
 lifeStart(author,lifeProposal(author),'shared',friend);
 for(var i=0;i<3;i++){S.turn++;S.month++;personalLifeTick();}
 UI.view='consort';UI.sel=author.id;E().energy=4;delete S.pendingActions;`);
const state=b.run('JSON.stringify(S)'),ui=b.run('JSON.stringify(UI)');
const setup=`window.addEventListener('DOMContentLoaded',()=>{
 if(!sessionStorage.getItem('personal-life-fixture')){S=${state};Object.assign(UI,${ui});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('personal-life-fixture','1');save('auto');render();}
});`;
fs.writeFileSync(path.join(root,'qa-personal-life.html'),fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+setup+'</script>');
console.log('Generated qa-personal-life.html (do not publish).');
const family=boot(203);
family.run(`A.start();drain();S.turn=36;S.year=4;S.month=6;E().energy=4;
 var m=makeGirl({sur:'柳',given:'清和',trait:'体弱',age:23,fam:{t:'太后母家',p:72}});addConsort(m,5,'太后举荐入宫');m.clan='柳|太后母家';
 S.flags.dowager={name:'柳太后',sur:'柳',alive:true,clan:m.clan,fam:{...m.fam}};
 var aunt=makeKin(m,'堂');aunt.age=20;aunt.sur='柳';aunt.given='清音';aunt.trait='温婉';aunt.kin[m.id]='堂姐';m.kin[aunt.id]='堂妹';addConsort(aunt,3,'太后举荐入宫，与堂姐相伴');
 m.preg=10;var count=rollBirthCount;rollBirthCount=()=>1;birthEvent(m);rollBirthCount=count;m.delivery.difficult=true;m.delivery.templeAdvice=null;deliveryKids(m)[0].name='承安';
 UI.view='consort';UI.sel=m.id;delete S.pendingActions;`);
const birthSetup=`window.addEventListener('DOMContentLoaded',()=>{
 if(!sessionStorage.getItem('maternal-care-fixture')){S=${family.run('JSON.stringify(S)')};Object.assign(UI,${family.run('JSON.stringify(UI)')});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('maternal-care-fixture','1');save('auto');render();A.resumeBirth(${family.run('m.id')});}
});`;
fs.writeFileSync(path.join(root,'qa-maternal-care.html'),fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+birthSetup+'</script>');
console.log('Generated qa-maternal-care.html (do not publish).');
