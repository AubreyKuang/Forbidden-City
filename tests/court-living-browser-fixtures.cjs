const fs=require('node:fs'),path=require('node:path'),{world}=require('./official-marriage-world.cjs'),{secretWorld}=require('./palace-secret-world.cjs');
const out=process.argv[2]||'/tmp/palace-court-living-fixtures';fs.mkdirSync(out,{recursive:true});
function write(name,b){fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}
for(const kind of ['clear','swap','no-swap','loss','romance','parentage']){
 const b=secretWorld(kind);b.run(`var type='${kind}'==='loss'?'loss':'${kind}'==='romance'?'romance':'parentage',subject=type==='parentage'?kid:type==='loss'?cid:Object.values(S.palaceRomance.pairs)[0].key;A.secretInquiry(type,subject);choose(0);drain();Math.random=()=>.5;A.endMonth();
 var expected='${kind}'==='clear'?'疑云已释':'${kind}'==='swap'?'换婴案 · 真相':'${kind}'==='no-swap'?'换婴疑云已释':'${kind}'==='loss'?'脉案查实':'${kind}'==='romance'?'宫墙私笺 · 查证回奏':'身世查证';
 for(var n=0;n<20&&curEv?.title!==expected;n++){if(modalResult)nextEv();else if(curEv.title==='三年大选')choose(1);else choose(curEv.choices.findIndex(x=>!x.cond||x.cond()));}if(curEv?.title!==expected)throw Error('No report '+expected);`);write('report-'+kind,b);
}
{const b=secretWorld('parentage');b.run('A.jinyiweiPatrol();choose(0);');write('patrol-found',b);}
{const b=secretWorld('clear');b.run('delete k.parentage;PalaceActions.reset();');write('patrol-empty',b);}
for(const kind of ['birth','loss']){const b=world();b.run(`c.hp=95;c.aff=90;other.scheme=90;other.solitary=null;var cid=c.id;
 ${kind==='birth'?"c.preg=10;Math.random=()=>.4;pushEv(birthEvent(c));drain();S.turn=c.lastBirth;S.month++;":"c.preg=4;Math.random=()=>.99;pushEv(HAREM.find(f=>f.name==='slip')());choose(0);drain();"}
 PalaceActions.reset();`);write('recovery-'+kind,b);}
{const b=world();b.run(`officialMarriageConfirm(ref,br,agree(ref,br));beginNatalPregnancy(other,sister);sister.natalPregnancy.difficult=false;S.turn=sister.natalPregnancy.due;natalPregnancyTick();PalaceActions.reset();`);write('family-tree',b);}
for(const kind of ['story','story-multiple']){const b=world();b.run(`c.trait='沉静';c.palace='景仁宫';var episode=PERSONAL_EPISODES.find(e=>e.title==='雪梅辨色');offerPersonalExperience(c,episode);${kind==='story-multiple'?"other.palace=c.palace;other.trait='沉静';offerPersonalExperience(other,episode);":''}PalaceActions.reset();`);write(kind,b);}
for(const kind of ['promotion','demotion']){const b=world();b.run(`var father=courtPerson(c.id+':father');father.p.office=father.p.post='${kind==='promotion'?'知县':'知府'}';h.brother.temperament='谨慎';Math.random=()=>0;careerSetOffice(father,'${kind==='promotion'?'知府':'知县'}','考课${kind==='promotion'?'升任':'降职'}');S.turn+=2;familyCareerFollowup();PalaceActions.reset();`);write(kind,b);}
{const b=world();b.run(`c.rank=3;var father=houseOf(c).father;father.temperament='进取';var previous=JSON.parse(JSON.stringify(S));punishEv(c,other,'石阶泼油').choices[1].f();courtFamilyLifeTick(previous);PalaceActions.reset();`);write('justice-letter',b);}
{const b=world();write('codex',b);}
{const b=world();b.run(`other.sur='赵';other.given='令仪';sister.sur='赵';sister.given='令珠';sister.name='赵令珠';sister.born=S.turn-26*12;sister.willing=true;scholar.name='姚允执';scholar.sur='姚';scholar.examRank='探花';scholar.willing=true;PalaceActions.reset();A.examMarriage(scholar.id);option('赵令珠');`);write('exam-sister',b);}
console.log('Wrote eighteen court living browser fixtures.');
