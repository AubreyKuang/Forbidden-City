/* Public, disposable demo saves; all screens use production game scripts. */
const fs=require('node:fs'),path=require('node:path'),{world}=require('../tests/court-family-browser-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/qa/royal-heart-gallery');fs.mkdirSync(out,{recursive:true});
const setup=`E().age=45;a.age=42;var k=makeKid(a,'f','昭宁');k.pendingName=false;k.born=S.turn-18*12;k.temperament='灵动';k.hp=90;k.love=70;var p=createXieAn();k.xieAdmiration={personId:p.id,outcome:'admired'};`;
const scenes={
 refusal:{after:`PalaceActions.reset();A.xieMarriage(k.id);`},
 check:{after:`PalaceActions.reset();A.xieMarriage(k.id);`,view:'check'},
 young:{after:`k.sex='m';k.temperament='内敛';delete k.xieAdmiration;S.royalHeart={gen:S.gen,pending:{kind:'hope',child:k.id,stage:'young',topic:heartTopic(k)}};PalaceActions.reset();A.royalHeart(k.id);`},
 adult:{after:`k.born=S.turn-25*12;k.temperament='自矜';k.xieAdmiration.outcome='declined';S.royalHeart={gen:S.gen,pending:{kind:'hope',child:k.id,stage:'adult',topic:heartTopic(k)}};PalaceActions.reset();A.royalHeart(k.id);`},
 marriage:{after:`xieMarriageRefusal(k,p).choices[0].f();S.turn+=3;PalaceActions.reset();`,view:'marriage'},
 chronicle:{after:`xieMarriageRefusal(k,p).choices[0].f();for(var i=0;i<24;i++){S.turn++;S.month++;if(S.month>12){S.month=1;S.year++;E().age++;}xieLifeTick();}careerTick();for(var person of careerPeople().filter(x=>x.p.report)){A.officialReport(person.key);if(modalOpen)choose(curEv.choices.length-1);drain();}PalaceActions.reset();`,view:'chronicle'}
};
for(const [name,spec] of Object.entries(scenes)){
 const b=world();b.run(setup+spec.after);const payload=b.run('JSON.stringify(PalaceActions.payload())').replace(/</g,'\\u003c');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="../../../">\n<meta name="robots" content="noindex">\n<script src="./docs/qa/gouyi-gallery/memory-storage.js"></script>').replace('<title>宸宫纪</title>',`<title>谢安与皇嗣心事 · ${name} · 演示存档</title>`)+
  `\n<script type="application/json" id="royal-heart-save">${payload}</script>\n<script type="application/json" id="royal-heart-view">${JSON.stringify(spec.view||'event')}</script>\n<script defer src="./docs/qa/royal-heart-gallery/bootstrap.js"></script>\n`;
 fs.writeFileSync(path.join(out,name+'.html'),html);
}
console.log('Generated six isolated royal heart browser scenarios.');
