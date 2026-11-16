/* Public, isolated fictional saves run the real game and real DOM controls. */
const fs=require('node:fs'),path=require('node:path'),{world}=require('../tests/court-family-browser-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/qa/personal-context-gallery');fs.mkdirSync(out,{recursive:true});
const gouyi=`A.out('procession');choose(0);choose(0);drain();var g=S.consorts.find(c=>c.gouyi);g.aff=75;g.woundKnown=true;delete g.wound;S.turn+=3;PalaceActions.reset();`;
const prayer=`var c=a;c.preg=4;c.pregnancyCalendar={conceived:S.turn-3,term:10,nights:[S.turn-3]};c.trait='才女';`;
const succession=`wed();var heir=makeKid(b,'m','承宁');heir.born=S.turn-240;heir.pendingName=false;S.heir=heir.id;husband.commission={id:'dikes',title:'河堤修缮',started:S.turn,due:S.turn+3,contact:b.id,wasAway:false,outcome:'success'};E().health=-1000;PalaceActions.reset();A.endMonth();for(var i=0;i<100&&modalOpen&&curEv.title!=='龙驭宾天';i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}if(curEv.title!=='龙驭宾天')throw Error('No accession');choose(0);`;
const scenes={profile:gouyi,past:gouyi,prayer:prayer+`var k=makeKid(c,'f','明珠');k.born=S.turn-60;S.royalRelatives=[k];S.children=[];PalaceActions.reset();A.pregnancyPrayer(c.id);`,foster:prayer+`var k=makeKid(b,'f','清宁');k.foster=c.id;PalaceActions.reset();A.pregnancyPrayer(c.id);`,succession,official:succession};
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [name,script] of Object.entries(scenes)){
 const b=world();b.run(script);const payload=b.run('JSON.stringify(PalaceActions.payload())').replace(/</g,'\\u003c');
 const html=source.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>')+`\n<script type="application/json" id="context-save">${payload}</script>\n<script type="application/json" id="context-scene">${JSON.stringify(name)}</script>\n<script defer src="./docs/qa/personal-context-gallery/bootstrap.js"></script>\n`;
 fs.writeFileSync(path.join(out,name+'.html'),html);
}
console.log('Built '+Object.keys(scenes).length+' personal context browser cases');
