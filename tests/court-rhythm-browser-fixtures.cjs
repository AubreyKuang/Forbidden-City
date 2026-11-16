const fs=require('node:fs'),path=require('node:path'),{world}=require('./court-family-browser-fixtures.cjs');const out='/tmp/palace-court-rhythm-fixtures';fs.mkdirSync(out,{recursive:true});
function save(name,w){fs.writeFileSync(path.join(out,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));}
{
 const w=world();w.run(`var d=ensureDowager();for(var i=0;i<12;i++)dowagerRecord(d,'宫中日常','太后在慈宁宫说起起居与家中近况，留下闲谈纪事。');UI.view='place';UI.sel='cn';PalaceActions.reset();save('auto');`);save('cining',w);
}
{
 const w=world();w.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;k.lit=50;applyBirthOmen(k,'star');S.turn=71;S.month=12;PalaceActions.reset();A.endMonth();`);save('annual',w);
}
{
 const w=world();w.run(`a.rank=5;a.palace='景仁宫';a.residenceRoom='main';b.rank=5;b.palace='咸福宫';b.residenceRoom='main';b.trait='骄纵';b.favor=90;b.lastResidenceMove=-99;b.lastResidenceRequest=-99;PalaceActions.reset();A.residencePetition(b.id);`);save('residence',w);
}
console.log('Generated Cining, annual-tag and residence browser fixtures');
