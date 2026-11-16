const fs=require('node:fs'),path=require('node:path'),{world}=require('./court-family-browser-fixtures.cjs');const out='/tmp/palace-court-rhythm-fixtures';fs.mkdirSync(out,{recursive:true});
function save(name,w){fs.writeFileSync(path.join(out,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));}
{
 const w=world();w.run(`var d=ensureDowager();E().age=38;var notes=[['窗前新叶','说起春风转暖，留人陪着看了一会儿窗外。'],['旧日食谱','翻出少放糖的旧食谱，谈起熟悉的滋味。'],['起居叮咛','劝皇帝夜里少熬些时候，记得添衣。'],['母家来信','读过母家的平安信，又亲笔回了几句话。'],['茶里的滋味','细尝清茶，谈起各人喜欢的浓淡。'],['手边针线','缝完一角旧帕，觉得做完一件小事也踏实。'],['书里人情','读书说到误会，盼亲近的人有话慢慢说。'],['寻常母子','留皇帝暂且放下朝堂上的身份，只说些家常。']];for(var note of notes)dowagerRecord(d,...note);UI.view='place';UI.sel='cn';PalaceActions.reset();save('auto');`);save('cining',w);
}
{
 const w=world();w.run(`var k=makeKid(a,'f','清宁');k.pendingName=false;k.lit=50;applyBirthOmen(k,'star');S.turn=71;S.month=12;PalaceActions.reset();A.endMonth();`);save('annual',w);
}
{
 const w=world();w.run(`a.rank=5;a.palace='景仁宫';a.residenceRoom='main';b.rank=5;b.palace='咸福宫';b.residenceRoom='main';b.trait='骄纵';b.favor=90;b.lastResidenceMove=-99;b.lastResidenceRequest=-99;PalaceActions.reset();A.residencePetition(b.id);`);save('residence',w);
}
console.log('Generated Cining, annual-tag and residence browser fixtures');

fs.copyFileSync(path.join(__dirname,'fixtures/dowager-repeat-legacy-v29.json'),path.join(out,'old-cining.json'));
