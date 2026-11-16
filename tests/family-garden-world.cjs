const {world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const w=base();w.run(`S.turn=64;S.month=5;E().age=38;for(var c of [a,b,q]){c.preg=0;c.hp=95;c.mood=75;c.xin={k:'平和',t:S.turn};c.kin={};c.kinRival={};c.arc=null;delete c.solitary;delete c.recovery;delete c.illnessRecovery;}
 var makeChild=(m,name,age,temperament)=>{var k=makeKid(m,'f',name);k.born=S.turn-age*12;k.pendingName=false;k.hp=95;k.temperament=temperament;k.love=60;k.motherBonds={[m.id]:{trust:75,turn:S.turn-1}};return k;};
 var ka=makeChild(a,'清宁',8,'好奇'),kb=makeChild(b,'明仪',7,'仁厚');S.rel={};S.rel[rk(a,b)]=60;
 S.friendshipArcs={};S.flags.marriageBonds={};S.continuity=null;for(var c of [a,b,q]){c.arc=makeArc('love',50);c.arc.done=true;}for(var k of [ka,kb])k.lastSchoolScene=S.turn;PalaceActions.reset();`);return w;}
module.exports={world};
