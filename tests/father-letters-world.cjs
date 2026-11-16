const {boot}=require('./playtest-harness.cjs');
function world(trait='温婉',nature='caring'){
 const w=boot(916);w.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.children=[];var c=makeGirl({sur:'柳',given:'知微',age:24,trait:${JSON.stringify(trait)},fam:{t:'寒门',p:5}});delete c.solitary;addConsort(c,2,'选秀入宫');c.hp=90;c.preg=0;c.mood=70;c.favor=15;c.aff=60;c.xin={k:'平和',t:S.turn};var h=houseOf(c),father=h.father;father.daughterLetterNature=${JSON.stringify(nature)};E().energy=30;PalaceActions.reset();`);return w;
}
module.exports={world};
