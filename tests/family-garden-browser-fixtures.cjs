const fs=require('node:fs'),path=require('node:path'),{world}=require('./family-garden-world.cjs');
function monthly(kind,seed){const w=world();w.run(`if('${kind}'==='dispute')S.rel[rk(a,b)]=0;var qaSeed=${seed};Math.random=()=>((qaSeed=(Math.imul(qaSeed,1664525)+1013904223)>>>0)/4294967296);PalaceActions.reset();A.endMonth();for(var i=0;modalOpen&&i<100&&!curEv.title.startsWith('${kind==='dispute'?'童争':'携子同游'}');i++){if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));}`);return w;}
function make(name){
 const w=world();
 if(name==='garden'||name==='infants'){if(name==='infants')w.run('ka.born=S.turn-1;kb.born=S.turn-14;');w.force(.1);w.run(`A.out('garden');`);return w;}
 if(name==='plan-declined'){w.run(`Math.random=()=>.99;A.familyTime(ka.id,a.id);`);return w;}
 if(name==='selection'){w.run(`for(var c of [a,b]){c.favor=10;c.trait='温婉';delete c.solitary;}q.trait='温婉';q.virtue=95;delete q.solitary;houseOf(b).father.office=houseOf(b).father.post=b.fam.t='两江总督';var g=makeGirl({sur:'崔',given:'澜',age:31,trait:'温婉',fam:{t:'两江总督',p:70}}),other=makeGirl({sur:'白',given:'嫣漪',age:29,trait:'持重',fam:{t:'两江总督',p:70}});S.cands=[g,other];for(var c of S.cands){delete c.timeTraveler;delete c.solitary;houseOf(c);deepen(c);}makeOldFriendTie(g,a);S.selection={phase:'roster',performed:[]};selectionBatch();captureSelectionCourt();UI.view='xx';PalaceActions.reset();save('auto');`);return w;}
 if(name==='autosave'){w.run(`UI.view='sys';PalaceActions.reset();save('auto');`);return w;}
 if(name==='monthly'||name==='dispute'){for(let seed=1;seed<=250;seed++){const m=monthly(name==='dispute'?'dispute':'outing',seed);if(m.run(`modalOpen&&curEv.title.startsWith('${name==='dispute'?'童争':'携子同游'}')`)){m.fixtureSeed=seed;return m;}}throw Error('No deterministic monthly scenario '+name);}
 throw Error('Unknown scenario '+name);
}
if(require.main===module){const out='/tmp/palace-family-garden-fixtures';fs.mkdirSync(out,{recursive:true});for(const name of ['garden','infants','monthly','dispute','plan-declined','autosave','selection']){const w=make(name);fs.writeFileSync(path.join(out,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));console.log(name,'seed',w.fixtureSeed||'-',w.run('curEv?.title'));}}
module.exports={make,monthly};
