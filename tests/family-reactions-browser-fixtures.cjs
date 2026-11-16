const fs=require('node:fs'),path=require('node:path'),{world}=require('./child-consequences-world.cjs'),{world:marriage}=require('./official-marriage-world.cjs');
const out='/tmp/palace-family-reactions-fixtures';fs.mkdirSync(out,{recursive:true});
function save(name,w){fs.writeFileSync(path.join(out,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));}
{const w=world();w.run(`Math.random=()=>0;A.cold(a.id);choose(0);`);save('cold',w);}
{const w=world();w.run(`a.cold=true;syncChildDisgrace();UI.view='kids';PalaceActions.reset();save('auto');`);save('old-cold',w);}
{const w=world();w.run(`UI.view='cards';PalaceActions.reset();save('auto');`);save('maid',w);}
{const w=marriage();w.run(`sister.willing=true;h.brother.marriageWilling=true;sister.marriageWilling=true;PalaceActions.reset();A.officialMarriage(key);option('已有家族');option(sister.name);option('分别问过');option('下诏赐婚');`);save('marriage',w);}
{const w=world();w.run(`S.children=[];a.rank=2;a.favor=80;b.rank=3;b.favor=75;q.favor=55;var followers=[];for(var i=0;i<3;i++){var x=makeGirl({sur:'林',given:['朝云','夕月','春华'][i],age:23,trait:'温婉',fam:{t:'良家子',p:10}});addConsort(x,1,'入宫');x.favor=10;delete x.solitary;followers.push(x);}S.rel={};for(var i=0;i<3;i++)S.rel[rk([a,b,q][i],followers[i])]=70;S.rel[rk(q,a)]=60;S.rel[rk(q,b)]=60;for(var x of followers)S.rel[rk(q,x)]=Math.max(35,relGet(q,x));UI.view='harem';palaceFactionTick();PalaceActions.reset();save('auto');`);save('factions',w);}
console.log('Generated five family reaction and direct audience scenarios');
