// Local, isolated QA scenes made from the real game. Generated HTML is not published.
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./playtest-harness.cjs'),root=path.resolve(__dirname,'..');
function fixture(name,setup,action=''){
 const b=boot(311);b.run(`A.start();drain();S.turn=36;S.year=4;S.month=1;E().age=22;E().energy=4;${setup}delete S.pendingActions;`);
 const code=`window.addEventListener('DOMContentLoaded',()=>{if(!sessionStorage.getItem('${name}-v1')){S=${b.run('JSON.stringify(S)')};Object.assign(UI,${b.run('JSON.stringify(UI)')});Q.length=0;curEv=null;modalOpen=false;modalResult=null;PalaceActions.reset();sessionStorage.setItem('${name}-v1','1');save('auto');render();${action}}});`;
 fs.writeFileSync(path.join(root,`qa-${name}.html`),fs.readFileSync(path.join(root,'index.html'),'utf8')+'\n<script>'+code+'</script>');
}
fixture('government',`annualRevenueTick();S.month=10;S.turn=45;annualRevenueTick();E().energy=4;var e=officialEntries().find(e=>e.h.bloc!=='army');e.p.career='official';e.p.age=40;e.p.ability=90;e.p.office='县令';e.p.retired=false;delete e.p.report;delete e.p.commission;UI.view='government';`);
fixture('queen-council',`var q=empress();q.sur='沈';q.given='清和';q.trait='温婉';q.virtue=90;q.artPortrait=358;delete q.solitary;genCands(1);var g=S.cands[0];g.sur='顾';g.given='知微';A.xxTake(g.id);choose(1);drain();A.xxEnd();UI.view='xx';`, `A.selectionCouncil();`);
fixture('keeper',`S.flags.haremAttendance={gen:S.gen,turn:S.turn-8};E().energy=4;UI.view='home';`, `A.endMonth();`);
fixture('city-life',`S.flags.marketRescueSeen=true;beginIncognitoCase('bridge',null);var f=governance().visits.at(-1);f.outcome='success';S.turn=f.due;incognitoTick();UI.view='out';`, `pushEv(pendingIncognitoReport());`);
fixture('crown-fit',`UI.view='harem';`, `
  const cells=[92,248,316,358,363,371];
  const cards=cells.map(cell=>{
    const p={...S.consorts[0],artPortrait:cell};
    JEWELRY.phoenix.box[1]=-2;ART_CACHE.clear();const before=localPortrait(cell,8,'width="168" height="210"');
    JEWELRY.phoenix.box[1]=-8;ART_CACHE.clear();const after=localPortrait(cell,8,'width="168" height="210"');
    return '<article style="text-align:center"><p>立绘 '+cell+'</p><div style="display:flex;gap:8px"><figure style="margin:0">'+before+'<figcaption>原位置</figcaption></figure><figure style="margin:0">'+after+'<figcaption>上移后</figcaption></figure></div></article>';
  });
  document.querySelector('#panel').innerHTML='<h2>凤冠试戴 · 近景与半身</h2><p>保持凤冠与人物大小，上移 6 个画布单位。</p><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">'+cards.join('')+'</div>';
`);
console.log('Generated five local governance/crown fixtures.');
