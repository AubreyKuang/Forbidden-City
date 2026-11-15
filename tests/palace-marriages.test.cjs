const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function world(seed=717){
 const b=boot(seed);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=40;S.month=5;E().treasury=900;E().energy=4;
 var addGirl=(fam,rank=3)=>{const g=makeGirl({fam:{t:fam,p:FAMS.find(f=>f.t===fam)?.p??5}});delete g.solitary;addConsort(g,rank,'选秀入宫');return g;};
 var sister=(c,age,seed=12345)=>{const h=houseOf(c);const p=addNatalPerson(c,h,'f',age,seed,false);return p;};
 var drainAll=()=>{for(let i=0;modalOpen&&i<50;i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};`);
 return b;
}

test('new games: humble fathers and brothers are commoners, not officials; noble and physician offices remain',()=>{
 const b=world();
 b.run(`assert.equal(S.flags.commonerKin,1);
 var poor=addGirl('寒门'),h=houseOf(poor);h.brother||={name:poor.sur+'长风',post:'书生',career:'student',age:24,story:[]};delete h.commonerChecked;houseOf(poor);
 assert.equal(h.father.career,'commoner');assert.equal(h.father.office,'务农');assert.equal(officialServing(h.father),false);
 assert.equal(h.brother.career,'commoner');assert.ok(COMMONER_WORK.farm.son.includes(h.brother.post));assert.equal(officialStatus(h.brother),h.brother.post);
 assert.equal(officialActionReady(officialEntry(poor.id+':father'),'commission'),false);
 A.go('officials');assert.ok(!officialsTable().includes(h.father.name),'commoners are not on the officials table');
 var doc=addGirl('太医院院判'),hd=houseOf(doc);assert.equal(hd.father.office,'太医院院判');assert.notEqual(hd.father.career,'commoner');
 for(const r of brotherRoles(hd))assert.ok(COMMONER_WORK.physician.son.includes(hd[r].post));
 var rich=addGirl('吏部尚书'),hr=houseOf(rich);assert.notEqual(hr.father.career,'commoner');for(const r of brotherRoles(hr))assert.notEqual(hr[r].career,'commoner');
 assert.equal(newImpeachment()?.person===poor.id,false,'a farming father cannot be accused of embezzling relief silver');`);
});

test('saves begun before these rules keep their families as they were',()=>{
 const b=world();
 b.run(`delete S.flags.commonerKin;var poor=addGirl('寒门'),h=houseOf(poor);assert.notEqual(h.father.career,'commoner');assert.equal(h.commonerChecked,undefined);`);
});

test('sisters over thirty are married; humble sisters marry ordinary people',()=>{
 const b=world();
 b.run(`var poor=addGirl('寒门'),p=sister(poor,33);p.married=false;delete p.spouse;var young=sister(poor,15,999);young.married=false;
 kinMarriageTick();assert.equal(p.married,true);assert.equal(p.spouse.kind,'commoner');assert.ok(COMMONER_WORK.farm.spouse.includes(p.spouse.desc));
 assert.ok(p.story.some(x=>x.t.includes('早年已嫁')));assert.equal(young.married,false);assert.equal(young.betrothal,undefined);
 var name=p.spouse.name;kinMarriageTick();assert.equal(p.spouse.name,name,'a married sister is not married again');
 A.go('natal',poor.id+':'+p.id);assert.match(viewNatalRelative(),new RegExp(p.spouse.desc));`);
});

test('a sister in her twenties is either married, betrothed or still deciding, settled by her own record',()=>{
 const b=world();
 b.run(`var rich=addGirl('翰林学士'),seen={married:0,betrothal:0,none:0};
 for(let i=0;i<24;i++){const p=sister(rich,22+i%7,1000+i*37);p.married=false;delete p.spouse;}
 kinMarriageTick();for(const p of natalPeople(houseOf(rich)).filter(x=>x.sex==='f'&&natalAge(x)>=20)){seen[p.married?'married':p.betrothal?'betrothal':'none']++;assert.ok(p.marriageChecked!=null);}
 assert.ok(seen.married>0&&seen.betrothal>0&&seen.none>0,JSON.stringify(seen));
 var p=natalPeople(houseOf(rich)).find(x=>x.betrothal),count=rich.story.length;S.turn=p.betrothal.due;kinMarriageTick();
 assert.equal(p.married,true);assert.ok(rich.story.length>count,'the consort hears of the wedding');assert.match(natalStatus(p),/已婚/);`);
});

test('friendly noble houses may marry into each other; an imperial match or refusal moves both families',()=>{
 for(const [index,sign] of [[0,1],[2,-1]]){
  const b=world();
  b.run(`var a=addGirl('吏部尚书'),o=addGirl('户部侍郎'),ho=houseOf(o);for(const x of S.consorts)if(x!==a&&x!==o)relAdd(a,x,-50-relGet(a,x));relAdd(a,o,50-relGet(a,o));
  ho.brother={name:o.sur+'云深',post:'翰林院编修',career:'official',age:26,story:[],alive:true};initializeOfficialHouse(o,ho,paternalFamily(o));
  for(const r of brotherRoles(ho))if(r!=='brother')delete ho[r];
  var p=sister(a,22);p.married=false;delete p.spouse;p.marriageChecked=S.turn-12;var b0=startBetrothal(a,p);
  assert.equal(b0.match.kind,'alliance');assert.equal(b0.match.name,ho.brother.name);assert.equal(natalStatus(p),'议亲中');
  var ev=null;for(let i=0;i<20&&!ev;i++){ev=betrothalEvent();}assert.ok(ev);assert.match(ev.text,new RegExp(ho.brother.name));assert.match(ev.text,/结党/);
  var before=relGet(a,o);ev.choices[${index}].f();`);
  if(sign>0)b.run(`assert.equal(p.married,true);assert.equal(ho.brother.married,true);assert.ok(relGet(a,o)>before);
   assert.ok(o.story.some(x=>x.t.startsWith('【两家姻亲】')));assert.ok(a.story.some(x=>x.t.includes('奉旨赐婚')));
   var q=sister(o,23,4321);q.married=false;delete q.spouse;assert.ok(!allianceCandidates(o,q).some(x=>x.p===ho.brother),'a married brother is not matched again');`);
  else b.run(`assert.equal(p.betrothal,undefined);assert.equal(p.married,false);assert.ok(relGet(a,o)<before);`);
 }
});

test("hostile houses are not matched, and a humble sister's match is a matter for her own family",()=>{
 const b=world();
 b.run(`var a=addGirl('吏部尚书'),o=addGirl('户部侍郎'),ho=houseOf(o);relAdd(a,o,-50-relGet(a,o));
 ho.brother={name:o.sur+'云深',post:'翰林院编修',career:'official',age:26,story:[],alive:true};
 var p=sister(a,22);p.married=false;assert.ok(!allianceCandidates(a,p).some(x=>x.consort===o));
 var poor=addGirl('农家'),q=sister(poor,21,777);q.married=false;delete q.spouse;q.marriageChecked=S.turn-12;startBetrothal(poor,q);
 assert.equal(q.betrothal.match.kind,'commoner');for(const r of natalPeople(houseOf(a)))r.betrothal&&(r.betrothal.seen=true);
 var ev=null;for(let i=0;i<20&&!ev;i++){ev=betrothalEvent();if(ev&&!ev.text.includes(q.name))ev=null;}assert.ok(ev);
 assert.deepEqual(ev.choices.map(c=>c.t),['赏一份嫁妆 · 国库−5','由她家里做主','召她入宫，亲自听听婚事']);ev.choices[0].f();assert.equal(q.betrothal.dowry,true);
 assert.equal(betrothalEvent()?.text?.includes(q.name)||false,false,'a match the emperor already knows about is not raised again');`);
});

test('older pending transcripts neither settle marriages nor raise matches',()=>{
 const b=world();
 b.run(`var poor=addGirl('寒门'),p=sister(poor,33);p.married=false;delete p.spouse;Object.defineProperty(PalaceActions,'contentVersion',{get:()=>9,configurable:true});
 kinMarriageTick();assert.equal(p.married,false);assert.equal(betrothalEvent(),null);delete PalaceActions.contentVersion;kinMarriageTick();assert.equal(p.married,true);`);
});

const {withClock}=require('./test-clock.cjs');
const legacy=require('./fixtures/marriages-legacy-v9.json');
for(const fixture of legacy.cases)test('version 9 month-end transcript still replays exactly: '+fixture.name,()=>{
 const game=save=>{const b=withClock(boot(311,new Map([['chengongji_v1_auto',JSON.stringify(save)]])));b.ctx.assert=assert;return b;};
 let b=game(fixture.save);b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);");
 const relabelled=JSON.parse(JSON.stringify(fixture.save));relabelled.pendingActions.version=10;
 b=game(relabelled);b.run("A.load('auto');assert.equal(PalaceActions.blocked,true);");
});

test('every answer to a match leaves a note in the consort\'s own chronicle',()=>{
 const b=world();
 b.run(`var poor=addGirl('农家');for(const x of S.consorts)if(x!==poor)for(const p of natalPeople(houseOf(x)))delete p.betrothal;
 for(const i of [0,1]){var q=sister(poor,21,900+i);q.married=false;delete q.spouse;q.marriageChecked=S.turn-12;startBetrothal(poor,q);
  var ev=null;for(let k=0;k<20&&!ev;k++){ev=betrothalEvent();if(ev&&!ev.text.includes(q.name))ev=null;}var n=poor.story.length;ev.choices[i].f();assert.ok(poor.story.length>n);assert.ok(poor.story.at(-1).t.includes(q.name));}`);
});

test('only humble backgrounds count as commoners; the dowager\'s kin and foreign nobility stay noble houses',()=>{
 const b=world();
 b.run(`for(const fam of ['太后母家','平反忠臣之后','东瀛贵族','海西贵族','皇商']){const g=addGirl(fam);assert.equal(familyIsNoble(g),true,fam);assert.notEqual(houseOf(g).father.career,'commoner',fam);
  for(const r of brotherRoles(houseOf(g)))assert.notEqual(houseOf(g)[r].career,'commoner',fam);}
 for(const fam of ['寒门','农家','歌女','宫女','书香门第','县令','太医院院判'])assert.equal(familyIsNoble(addGirl(fam)),false,fam);
 var g=addGirl('太后母家'),p=sister(g,33,555);p.married=false;delete p.spouse;kinMarriageTick();assert.notEqual(p.spouse.kind,'commoner');`);
});

test('marriage talks allow asking about palace life, but an already decreed marriage does not',()=>{
 const b=world();
 b.run(`var g=addGirl('吏部尚书'),p=sister(g,21,321);p.married=false;delete p.spouse;natalInPalace=()=>true;
 assert.equal(natalRomanceReady(g,p),true);p.marriageChecked=S.turn-12;startBetrothal(g,p);assert.equal(natalRomanceReady(g,p),true);
 p.betrothal.arranged=true;assert.equal(natalRomanceReady(g,p),false);`);
});
