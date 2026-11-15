const fs=require('node:fs'),path=require('node:path'),{world}=require('./official-marriage-world.cjs');
const out=process.argv[2]||'/tmp/palace-wedding-fixtures';fs.mkdirSync(out,{recursive:true});
const scenarios={
 'princess':`UI.view='official';UI.sel=key;`,
 'princess-entry':`UI.view='kid';UI.sel=k.id;`,
 'family':`UI.view='official';UI.sel=key;`,
 'guest':`UI.view='scholar';UI.sel=scholar.id;`,
 'refusal':`sister.marriageWilling=false;UI.view='official';UI.sel=key;`,
 'betrothal':`sister.betrothal={turn:S.turn,due:90,match:{kind:'noble',name:'顾旧约'}};UI.view='official';UI.sel=key;`,
 'same-family':`k.mom=c.id;k.sur=c.sur;UI.view='official';UI.sel=key;`,
 'married':`h.brother.married=true;h.brother.spouseName='苏清月';UI.view='official';UI.sel=key;`,
 'letter':`officialMarriageConfirm(ref,br,agree(ref,br));S.turn+=6;S.month=7;UI.view='official';UI.sel=key;`,
 'guard':`A.establishJinyiwei();choose(0);drain();UI.view='jinyiwei';`
};
for(const [name,script] of Object.entries(scenarios)){const b=world();b.run(script+'PalaceActions.reset();');fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
for(const [name,roll,age] of [['child-alone',.99,15],['child-company',0,8],['infant-alone',.99,0]]){const b=world();b.run(`k.born=S.turn-${age}*12;UI.view='kid';UI.sel=k.id;PalaceActions.reset();`);b.force(roll);b.run('A.kidVisit(k.id)');fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
console.log('Wrote thirteen wedding, family visit and guard fixtures.');
