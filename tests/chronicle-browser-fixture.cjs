// Local-only presentation page; do not publish qa-event-chronicle.html.
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const root=path.resolve(__dirname,'..'),b=boot(202);
b.run(`A.start();drain();S.turn=36;S.year=4;S.month=6;E().age=30;E().energy=4;E().treasury=800;
 var queen=harem()[0];queen.trait='持重';queen.age=30;queen.t2='畏寒';
 S.consorts=[queen];var helper=makeGirl({sur:'沈',given:'知微',trait:'巧手',age:23});addConsort(helper,3,'选秀入宫');helper.t2='爱猫';
 for(const c of S.consorts){c.preg=0;c.hp=90;c.arc.t=10000;}
 UI.view='consort';UI.sel=helper.id;delete S.pendingActions;`);
const state=b.run('JSON.stringify(S)'),ui=b.run('JSON.stringify(UI)'),id=b.run('helper.id');
const setup=`window.addEventListener('DOMContentLoaded',()=>{
 A.qaChronicle=id=>pushEv(QEV.爱猫(byId(id)));PalaceActions.install();
 if(!sessionStorage.getItem('event-chronicle-fixture')){S=${state};Object.assign(UI,${ui});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('event-chronicle-fixture','1');save('auto');render();A.qaChronicle(${id});}
});`;
fs.writeFileSync(path.join(root,'qa-event-chronicle.html'),fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+setup+'</script>');
console.log('Generated qa-event-chronicle.html for local browser verification.');
