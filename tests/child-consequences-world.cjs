const {world:base}=require('./court-family-browser-fixtures.cjs');
function world(){const w=base();w.run(`var child=(m,name,age)=>{var k=makeKid(m,'f',name);k.born=S.turn-age*12;k.pendingName=false;k.hp=95;k.love=50;k.motherBonds={[m.id]:{trust:80}};return k;};
 var elder=child(a,'清宁',12),little=child(a,'清和',5),foster=child(b,'明仪',9),friend=child(q,'玉宁',11),stranger=child(q,'玉华',10),baby=child(a,'清圆',1);
 foster.foster=a.id;foster.motherBonds[a.id]={trust:75};S.rel[rk(friend,elder)]=65;elder.temperament='内敛';little.temperament='活泼';
 for(var x of [a,b,q]){x.arc=null;x.kinRival={};}PalaceActions.reset();`);return w;}
module.exports={world};
