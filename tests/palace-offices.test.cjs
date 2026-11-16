const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {withClock}=require('./test-clock.cjs');

function world(seed=616){
 const b=boot(seed);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=40;S.year=4;S.month=2;E().treasury=900;E().energy=4;
 var [a,z]=harem();for(const c of [a,z])delete c.solitary;
 a.fam={t:'吏部尚书',p:60};z.fam={t:'户部侍郎',p:60};delete a.house;delete z.house;
 var fa=houseOf(a).father,fz=houseOf(z).father;
 for(const p of [fa,fz]){p.alive=true;p.retired=false;p.career='official';delete p.commission;delete p.report;p.age=50;p.ability=70;}
 var musk=HAREM.find(f=>f.name==='musk'),drainAll=()=>{for(let i=0;modalOpen&&i<50;i++){if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
 var setupMusk=()=>{a.scheme=90;a.mood=40;z.favor=a.favor+20;return musk();};
 var closeExamMarriage=()=>{if(curEv?.title==='金榜之后 · 探花议婚'){choose(curEv.choices.length-1);nextEv();}};
 var establish=()=>{A.establishJinyiwei();choose(0);nextEv();return S.jinyiwei.commander;};`);
 return b;
}

test('the triennial palace examination names three graduates, and kin with a juren degree sit on merit',()=>{
 const b=world();
 b.run(`var kin=houseOf(a);kin.brother={name:a.sur+'子期',career:'student',education:'举人',post:'举人',age:24,story:[],alive:true};initializeOfficialHouse(a,kin,paternalFamily(a));
 E().energy=0;S.month=3;assert.equal(examDueNow(),true);var ev=examEvent();assert.match(ev.title,/殿试/);assert.equal(ev.cast.length,3);assert.match(ev.text,/子期/);
 assert.equal(examDueNow(),false,'one sitting per examination year');
 var chosen=ev.cast[2];ev.choices[2].f();
 assert.equal(S.scholars.length,3);assert.equal(chosen.examRank,"状元");assert.equal(chosen.office,"翰林院修撰");
 assert.deepEqual(S.scholars.map(p=>p.examRank).sort(),['探花','榜眼','状元'].sort());
 for(const p of S.scholars){assert.ok(p.story.some(x=>x.t.includes('殿试')));assert.equal(officialServing(p),true);}
 assert.ok(['进士','举人'].includes(kin.brother.education));
 assert.equal(officialStatus(kin.brother),kin.brother.education==='进士'?'进士 · 候选授官':'候选 · 尚未授官','a new jinshi is shown awaiting appointment, not studying at home');assert.ok(kin.brother.story.some(x=>/会试/.test(x.t)));
 assert.ok(a.story.some(x=>/会试/.test(x.t)),'the consort hears how her brother fared');
 assert.equal(ev.choices[0].f(),null,'the list cannot be published twice');
 S.month=4;assert.equal(examDueNow(),false);S.year=5;S.month=3;assert.equal(examDueNow(),false);S.year=7;assert.equal(examDueNow(),true);`);
});

test('the rites ministry previews and saves annual, three-, five- and ten-year schedules',()=>{
 const b=world();b.run(`assert.equal(regularExamInterval(),3);assert.match(viewMinistries(),/调整正科周期/);var rendered=JSON.stringify(S);assert.match(nextRegularExamDate(),/四年三月/);assert.equal(JSON.stringify(S),rendered);A.examSchedule();assert.deepEqual(curEv.choices.slice(0,4).map(c=>c.t),['每年一科','每三年一科','每五年一科','每十年一科']);assert.match(curEv.choices[3].preview,/十一年三月/);choose(3);assert.equal(regularExamInterval(),10);A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(regularExamInterval(),10);assert.match(modalResult.text,/十一年三月/);drain();for(var interval of [1,3,5,10]){ministryState().examInterval=interval;S.year=interval+1;S.month=3;assert.equal(examDueNow(),true);S.month=4;assert.equal(examDueNow(),false);}`);
});
test('an extra examination blocks a repeated sitting and the autumn qualifying round follows the selected cycle',()=>{
 const b=world();b.run(`ministryState().examInterval=5;S.year=6;S.month=2;S.ministries.examDue=S.turn+1;assert.match(nextExamLabel(),/恩科.*十一年三月/);S.turn++;S.month=3;assert.ok(examDueNow());var ev=examEvent();assert.match(ev.title,/恩科/);assert.equal(examDueNow(),false);var kin=houseOf(a);kin.brother={name:'试读',career:'student',education:'书生',post:'书生',age:24,story:[],alive:true};initializeOfficialHouse(a,kin,paternalFamily(a));S.year=9;S.month=9;relativeStudyTick();assert.equal(kin.brother.lastExamYear,undefined);S.year=10;relativeStudyTick();assert.equal(kin.brother.lastExamYear,10);`);
});

test('ministers must be serving and able; graduates serve two years first; one person heads one ministry',()=>{
 const b=world();
 b.run(`fa.office='知府';fz.office='知府';var ev=examEvent();ev.choices[3].f();closeExamMarriage();var top=S.scholars[0];top.ability=80;
 assert.ok(!ministryCandidates('revenue').some(x=>x.p===top),'a new graduate is not yet eligible');
 S.turn+=24;assert.ok(ministryCandidates('revenue').some(x=>x.p===top));
 assert.ok(!ministryCandidates('war').some(x=>x.p===top),'civil graduates do not head the war ministry');
 fz.ability=40;assert.ok(!ministryCandidates('revenue').some(x=>x.p===fz));
 fa.retired=true;assert.ok(!ministryCandidates('revenue').some(x=>x.p===fa));fa.retired=false;
 A.ministryAppoint('revenue');var i=curEv.choices.findIndex(c=>c.t.startsWith(top.name));choose(i);nextEv();
 assert.equal(ministryHead('revenue').p,top);assert.equal(top.office,'户部尚书');
 assert.ok(!ministryCandidates('personnel').some(x=>x.p===top),'already heads a ministry');
 A.ministryAppoint('personnel');i=curEv.choices.findIndex(c=>c.t.startsWith(fa.name));choose(i);nextEv();assert.equal(ministryHead('personnel').p,fa);
 assert.ok(a.story.some(x=>x.t.includes('吏部尚书')));
 fa.alive=false;assert.equal(ministryHead('personnel'),null,'a minister who dies leaves the post vacant');
 top.office='江南知府';assert.equal(ministryHead('revenue'),null,'a transfer vacates the ministry');`);
});

test('ministry business costs energy, waits a year, and has real effects',()=>{
 const b=world();
 b.run(`S.ministries={heads:{revenue:a.id+':father',works:z.id+':father'},used:{},exams:[]};fa.office='户部尚书';fz.office='工部尚书';
 var treasury=E().treasury,energy=E().energy;A.ministryAct('revenue');choose(0);nextEv();
 assert.equal(E().energy,energy-1);assert.ok(E().treasury>treasury);assert.ok(fa.story.some(x=>/亏空/.test(x.t)));
 assert.equal(ministryReady('revenue'),false);A.ministryAct('revenue');assert.equal(modalOpen,false);S.turn+=12;assert.equal(ministryReady('revenue'),true);
 delete S.flags.floodDikeGen;`);
 b.force(.01);b.run(`A.ministryAct('works');choose(0);nextEv();assert.equal(S.flags.floodDikeGen,S.gen);assert.equal(ministryReady('works'),false);
 assert.equal(ministryReady('war'),false,'no minister, no business');`);
});

test('the justice ministry rights a consort framed by witchcraft, naming the real culprit',()=>{
 const b=world();
 b.run(`var c3=makeGirl({});addConsort(c3,3,'选秀入宫');delete c3.solitary;
 z.cold=true;z.palace='冷宫';S.flags.wronged={v:z.id,a:c3.id};
 S.ministries={heads:{justice:a.id+':father'},used:{},exams:[]};fa.office='刑部尚书';`);
 b.force(.01);b.run(`A.ministryAct('justice');choose(0);assert.equal(z.cold,false);assert.equal(S.flags.wronged,null);
 nextEv();assert.equal(curEv.title,'真相大白');assert.equal(curEv.cast[0],c3);`);
});

test('an unsolved harem case is filed against the person who actually did it',()=>{
 const b=world();
 b.run(`var ev=setupMusk();assert.ok(ev);assert.equal(ev.choices.some(c=>/锦衣卫/.test(c.t)),false,'no Jinyiwei choice before it exists');`);
 b.force(.99);b.run(`ev.choices[0].f();var x=S.palaceCases.at(-1);assert.equal(x.culprit,a.id);assert.equal(x.victim,z.id);assert.equal(x.status,'cold');
 var ev2=setupMusk();ev2.choices[1].f();assert.equal(S.palaceCases.filter(k=>k.status==='cold').length,1,'the same open case is not filed twice');`);
 b.force(.01);b.run(`var ev3=setupMusk();ev3.choices[0].f();assert.equal(S.palaceCases.length,1,'a solved scene files nothing new');`);
});

test('Jinyiwei investigations report the recorded culprit or go cold, and may be retried after six months',()=>{
 const b=world();
 b.run(`var j=establish();assert.ok(j.name);assert.equal(S.jinyiwei.commander,j);assert.ok(viewJinyiwei().includes(j.name));
 var ev=setupMusk();var choice=ev.choices.find(c=>/锦衣卫/.test(c.t));assert.ok(choice);choice.f();var x=S.palaceCases.at(-1);
 assert.equal(x.status,'investigating');assert.equal(x.culprit,a.id);`);
 b.force(.99);b.run(`S.turn++;jinyiweiTick();assert.equal(x.status,'cold');assert.match(curEv.title,/锦衣卫密报/);drainAll();
 assert.equal(caseReady(x),false);S.turn+=6;assert.equal(caseReady(x),true);A.jinyiweiInvestigate(x.id);choose(0);nextEv();assert.equal(x.status,'investigating');`);
 b.force(.01);b.run(`S.turn++;jinyiweiTick();assert.equal(x.status,'solved');assert.equal(curEv.cast[1],a);choose(0);nextEv();
 assert.equal(curEv.title,'真相大白');assert.equal(curEv.cast[0],a);`);
});

test('a search finds evidence only on someone with a real case; an innocent consort resents it',()=>{
 const b=world();
 b.run(`establish();var ev=setupMusk();`);b.force(.99);b.run(`ev.choices[0].f();
 var aff=z.aff;A.jinyiweiSearch(z.id);choose(0);assert.ok(z.aff<aff);assert.ok(z.story.some(x=>/一无所获/.test(x.t)));nextEv();
 assert.equal(searchReady(z),false,'once a year at most');A.jinyiweiSearch(z.id);assert.equal(modalOpen,false);
 A.jinyiweiSearch(a.id);choose(0);assert.equal(S.palaceCases.at(-1).status,'solved');nextEv();assert.equal(curEv.title,'真相大白');assert.equal(curEv.cast[0],a);drainAll();
 var c=harem().find(x=>x!==a&&x!==z)||z;c.templeStay=true;assert.equal(searchReady(c),false,'only consorts present in the palace can be searched');`);
});

test('a rumoured impeachment can go to the Jinyiwei; its truth is fixed when the case is handed over',()=>{
 const b=world();
 b.run(`establish();z.fam={t:'镇国大将军',p:60};a.fam={t:'镇国大将军',p:60};delete a.house;delete z.house;fa=houseOf(a).father;fz=houseOf(z).father;
 for(const p of [fa,fz]){p.alive=true;p.retired=false;p.career='official';p.age=50;p.story=[];p.merit=50;}relAdd(a,z,-60-relGet(a,z));
 var ev=null;for(let i=0;i<60&&!ev;i++){S.flags.kinCourt&&(S.flags.kinCourt.lastEvent=-99,S.flags.kinCourt.pairs={},S.flags.kinCourt.log=[]);ev=kinCourtEvent();if(ev&&(ev.kinCourt!=='impeach'||!/风闻/.test(ev.text)))ev=null;}
 assert.ok(ev);var choice=ev.choices.find(c=>/锦衣卫/.test(c.t));assert.ok(choice);`);
 b.force(.1);b.run(`choice.f();var x=S.palaceCases.at(-1);assert.equal(x.kind,'rumor');assert.equal(x.truth,true);assert.equal(ev.choices[0].f(),null);
 var target=officialEntry(x.target).p,trust=target.trust;`);
 b.force(.01);b.run(`S.turn++;jinyiweiTick();assert.equal(x.status,'solved');assert.ok(target.trust<trust);assert.ok(target.story.some(x=>/锦衣卫查实/.test(x.t)));`);
});

test('older pending transcripts neither hold examinations nor file or report cases',()=>{
 const b=world();
 b.run(`S.month=3;Object.defineProperty(PalaceActions,'contentVersion',{get:()=>6,configurable:true});assert.equal(examDueNow(),false);var ev=setupMusk();var n=ev.choices.length;`);
 b.force(.99);b.run(`ev.choices[0].f();assert.equal(S.palaceCases,undefined);delete PalaceActions.contentVersion;assert.ok(courtOfficesActive());`);
});

test('pages render real people without gaps',()=>{
 const b=world();
 b.run(`var html=viewMinistries();assert.match(html,/吏部/);assert.match(html,/工部/);assert.doesNotMatch(html,/undefined|NaN/);
 assert.match(viewJinyiwei(),/设立锦衣卫/);establish();var ev=examEvent();ev.choices[3].f();closeExamMarriage();
 var p=S.scholars[0];A.go('scholar',p.id);var page=viewScholar();assert.ok(page.includes(p.name));assert.doesNotMatch(page,/undefined|NaN/);
 A.scholarTalk(p.id);assert.ok(modalOpen);nextEv();assert.equal(p.lastAudience,S.turn);
 A.go('officials');var table=officialsTable();assert.ok(table.includes(p.name));assert.ok(table.includes("A.go('scholar','"+p.id+"')"));
 assert.doesNotMatch(viewJinyiwei()+viewMinistries()+table,/undefined|NaN/);
 A.go('government');assert.match(viewGovernment(),/六部/);assert.match(viewGovernment(),/锦衣卫/);`);
});

const legacy=require('./fixtures/offices-legacy-v8.json');
for(const fixture of legacy.cases)test('version 8 month-end transcript still replays exactly: '+fixture.name,()=>{
 const game=save=>{const b=withClock(boot(311,new Map([['chengongji_v1_auto',JSON.stringify(save)]])));b.ctx.assert=assert;return b;};
 let b=game(fixture.save);b.run("A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(S.scholars,undefined);");
 const relabelled=JSON.parse(JSON.stringify(fixture.save));relabelled.pendingActions.version=9;
 b=game(relabelled);b.run("A.load('auto');assert.equal(PalaceActions.blocked,true);");
});

test('a father who already holds a ministry title is its sitting minister until someone replaces him',()=>{
 const b=world();
 b.run(`assert.equal(fa.office,'吏部尚书');S.ministries=undefined;assert.equal(ministryHead('personnel').p,fa);
 fz.office='户部侍郎';var ev=examEvent();ev.choices[3].f();closeExamMarriage();var top=S.scholars[0];top.ability=80;S.turn+=24;
 S.flags.kinCourt=undefined;A.ministryAppoint('personnel');var i=curEv.choices.findIndex(c=>c.t.startsWith(top.name));assert.ok(i>=0);choose(i);nextEv();
 assert.equal(ministryHead('personnel').p,top);assert.equal(fa.office,'内阁学士');assert.ok(a.story.some(x=>x.t.includes('卸任吏部尚书')));`);
});
