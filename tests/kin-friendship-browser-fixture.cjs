// Controlled local fixtures. Generated HTML is never published or used on the production origin.
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs'),root=path.resolve(__dirname,'..');
function fixture(name,setup,action){
 const b=boot(206);b.run(`A.start();drain();S.turn=144;S.year=13;S.month=3;E().age=35;E().energy=4;${setup}delete S.pendingActions;`);
 const code=`window.addEventListener('DOMContentLoaded',()=>{if(!sessionStorage.getItem('${name}-v2')){S=${b.run('JSON.stringify(S)')};Object.assign(UI,${b.run('JSON.stringify(UI)')});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('${name}-v2','1');save('auto');render();${action}}});`;
 fs.writeFileSync(path.join(root,`qa-${name}.html`),fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+code+'</script>');
}
fixture('kin-followup',`var m=harem()[0];m.sur='沈';m.given='清和';m.age=32;m.preg=0;var h=houseOf(m);h.relatives=[];
 var relative=addNatalPerson(m,h,'f',35,123,false);relative.willing=true;relative.married=false;relative.given='清音';relative.name='沈清音';relative.trait='才女';
 var foster=makeGirl({sur:'柳',given:'知微',trait:'持重',age:30});addConsort(foster,4,'入宫');foster.hp=90;
 var k=makeKid(m,'f','明月');k.born=S.turn-9*12;k.pendingName=false;doFoster(k,foster);m.alive=false;m.deathReason='病逝';story(m,'病逝于宫中，九岁的明月已有养母柳知微照料。');
 UI.view='kid';UI.sel=k.id;`, `A.maternalSisterArrival(S.children.find(k=>k.name==='明月').mom);`);
fixture('friend-dialogue',`S.consorts=[];var a=makeGirl({sur:'沈',given:'知微',trait:'温婉',age:26}),b=makeGirl({sur:'柳',given:'清音',trait:'爽直',age:27});addConsort(a,3,'入宫');addConsort(b,3,'入宫');
 for(var c of [a,b]){delete c.solitary;c.hp=90;c.preg=0;c.xin={k:'平和',t:S.turn};c.favor=c===a?15:80;}relAdd(a,b,65-relGet(a,b));UI.view='consort';UI.sel=a.id;`, `A.friendFavorTalk(S.consorts[0].id,S.consorts[1].id);`);
console.log('Generated qa-kin-followup.html and qa-friend-dialogue.html (local only).');
