/* Reproducible presentation saves. Generated pages are local-only, never shipped. */
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs');
const root=path.resolve(__dirname,'..');
for(const kind of ['duty','family','child']){
 const b=boot(202);b.run(`A.start();drain();S.turn=36;S.year=4;S.month=5;E().energy=4;E().treasury=800;
 var a=harem()[0],b=harem()[1],helper=makeGirl({sur:'沈',given:'知微',trait:'巧手',age:21});addConsort(helper,3,'入宫');
 for(var c of [a,b,helper]){c.preg=0;c.hp=90;c.arc.t=10000;}
 a.trait='持重';a.age=28;E().age=28;`);
 if(kind==='duty')b.run(`var work={year:S.year,gen:S.gen,stage:'review',tables:a.id,gifts:b.id,helper:helper.id,helperRole:'tables',issue:'漏记帮手'};
 finishDuanwu(work,'照例办结');var t=continuityThreads()[0];S.turn=t.due;S.month=7;UI.view='consort';UI.sel=helper.id;`);
 if(kind==='family')b.run(`var p=houseOf(a).father;
 p.commission={title:'核查地方钱粮',due:S.turn,outcome:'setback',wasAway:false};officialTaskTick();
 var t=continuityThreads()[0];S.turn=t.due;S.month=7;continuityChoose(t,'facts');S.turn=t.due;S.month=9;UI.view='consort';UI.sel=a.id;`);
 if(kind==='child')b.run(`var k=makeKid(a,'m','承安');k.born=S.turn-8*12;k.temperament='好奇';a.trait='将门';
 recordFamilyTime(k,a,'练习投壶','和母亲练习投壶。','陪孩子练习投壶。');var t=continuityThreads()[0];S.turn=t.due;S.month=7;
 continuityChoose(t,'child');S.turn=t.due;S.month=9;UI.view='consort';UI.sel=a.id;`);
 b.run('E().energy=4;delete S.pendingActions;');
 const state=b.run('JSON.stringify(S)'),ui=b.run('JSON.stringify(UI)');
 const setup=`window.addEventListener('DOMContentLoaded',()=>{if(!sessionStorage.getItem('continuity-fixture-${kind}')){S=${state};Object.assign(UI,${ui});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('continuity-fixture-${kind}','1');save('auto');render();}});`;
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+setup+'</script>';
 fs.writeFileSync(path.join(root,`qa-continuity-${kind}.html`),html);
}
console.log('Generated local duty, family and child presentation saves.');
