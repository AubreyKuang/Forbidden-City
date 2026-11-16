const fs=require('node:fs'),path=require('node:path'),{world}=require('./court-family-browser-fixtures.cjs');
const out=process.argv[2]||'/tmp/palace-personal-talk-fixtures';fs.mkdirSync(out,{recursive:true});
function save(name,w){fs.writeFileSync(path.join(out,name+'.json'),w.run('JSON.stringify(PalaceActions.payload())'));}
{
 const w=world();w.run(`a.aff=85;a.favor=80;a.nights=3;a.wish='travel';if(!WISHES[a.wish])a.wish=Object.keys(WISHES)[0];a.wishKnown=false;a.wishDone=false;a.kl=false;a.woundKnown=false;
 a.personalLife={boundary:{gen:S.gen,cause:'静姝身世已查明，却仍记得母子受疑',turn:S.turn,acknowledged:false,resolved:false}};a.xin={k:'委屈',why:'静姝身世已查明，却仍记得母子受疑',t:S.turn};
 var k=makeKid(a,'f','静姝');k.pendingName=false;S.rel[rk(a,b)]=60;S.rel[rk(a,q)]=0;UI.view='consort';UI.sel=a.id;PalaceActions.reset();A.chat(a.id);`);save('chat',w);
}
{
 const w=world();w.run(`for(var c of S.consorts)c.arc={id:'love',done:true};a.arc={id:'love',st:2,t:0,f:{token:'proud',respected:true},done:false};a.nights=3;a.aff=85;a.favor=5;delete S.flags.arcPacing;PalaceActions.reset();A.endMonth();`);
 for(let i=0;i<80&&w.run('modalOpen');i++){
  if(w.run("curEv?.title==='相伴有凭'&&!modalResult")){save('love',w);break;}
  w.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));');
 }
}
for(let seed=1;seed<=100;seed++){
 const w=world();w.run(`q.favor=100;q.lastPersonalAttention=0;q.imperialNights=[0];delete q.palaceWelcome;a.favor=80;a.lastPersonalAttention=60;a.imperialNights=[59,60];b.trait='善妒';b.scheme=90;b.favor=10;var randomSeed=${seed};Math.random=()=>((randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0)/4294967296);PalaceActions.reset();A.endMonth();`);
 let found=false;for(let i=0;i<80&&w.run('modalOpen');i++){
  if(w.run("curEv?.title==='醋海生波'&&!modalResult")){save('jealous',w);found=true;break;}
  w.run('if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));');
 }
 if(found)break;
}
for(const name of ['chat','love','jealous'])if(!fs.existsSync(path.join(out,name+'.json')))throw Error('Missing '+name);
console.log('Generated three personal-talk browser fixtures');
