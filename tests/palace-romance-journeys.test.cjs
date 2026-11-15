const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(id){const b=boot(112);b.ctx.assert=assert;b.ctx.topic=id;b.run(`A.start();drain();S.turn=300;E().energy=30;var c=makeGirl({age:40,trait:'才女',fam:{t:'皇商',p:80}});addConsort(c,3,'入宫');c.aff=80;c.hp=90;c.enteredAt=100;c.favor=20;c.knownBeforeAccession=true;c.solitary={path:'both'};
 if(topic==='scentedKnot')c.trait='巧手';
 if(topic==='sisterLantern'){var sister=makeGirl({age:36,trait:'善妒'});addConsort(sister,3,'入宫');c.kin={[sister.id]:'堂妹'};sister.kin={[c.id]:'堂姐'};relAdd(c,sister,-50);}
 if(topic==='travelKnot'){var child=makeKid(c,'f','明月');child.born=S.turn-156;child.pendingName=false;}
 PalaceActions.reset();`);return b;}
for(const id of ['rainUmbrella','scentedKnot','delayedLetter','oldResidence','dowryLedger','sisterLantern','travelKnot','windowChess'])test('original guyan journey '+id+' supports all eight persistent three-chapter paths',()=>{
 for(let mask=0;mask<8;mask++){const b=world(id);b.ctx.mask=mask;b.run(`assert.equal(journeyStart(c,topic),true);var before=E().energy;
 for(var st=0;st<3;st++){var ev=journeyEvent(c);assert.ok(ev);var ix=(mask>>st)&1;assert.ok(ev.choices[ix].f());assert.equal(ev.choices[ix].f(),null);if(st<2){assert.equal(journeyEvent(c),null);S.turn+=3;}}
 assert.equal(c.journeys.history.length,3);assert.equal(E().energy,before-3);assert.equal(c.journeys.current,undefined);assert.ok(CHARACTER_JOURNEYS[topic].endings.includes(c.journeys.history.at(-1).outcome));assert.equal(journeyStart(c,topic),false);
 if(topic==='sisterLantern'){assert.ok(sister.story.some(e=>e.t.includes('姐妹灯影')));assert.ok(relGet(c,sister)<0);}
 if(topic==='travelKnot')assert.ok(child.story.some(e=>e.t.includes('行囊里的红线')));
 S=JSON.parse(JSON.stringify(S));c=byId(c.id);assert.equal(c.journeys.history.length,3);`);}
});
test('new plots require actual character history, dispositions and family relationships',()=>{
 const b=world('oldResidence');b.run(`delete c.knownBeforeAccession;assert.equal(journeyStart(c,'oldResidence'),false);c.favor=80;assert.equal(journeyStart(c,'delayedLetter'),false);delete c.solitary;c.trait='将门';assert.equal(journeyStart(c,'windowChess'),false);assert.equal(journeyStart(c,'scentedKnot'),false);assert.equal(journeyStart(c,'travelKnot'),false);assert.equal(journeyStart(c,'sisterLantern'),false);`);
});
test('a deceased or absent sister is not replaced and heavy grief suspends new romance',()=>{
 const b=world('sisterLantern');b.run(`journeyStart(c,topic);journeyEvent(c).choices[0].f();sister.alive=false;S.turn+=3;var ev=journeyEvent(c);assert.match(ev.title,/时移事易/);ev.choices[0].f();assert.equal(c.journeys.history.at(-1).outcome,'未竟');
 delete c.journeys;var kid=makeKid(c,'f','明月');kid.pendingName=false;maternalTick();kid.alive=false;maternalTick();assert.equal(journeyStart(c,'rainUmbrella'),false);`);
});
test('saved guyan conversations resume in a fresh world with the same pending chapter',()=>{
 const b=world('rainUmbrella');b.run(`A.journeyBegin(c.id,topic);save('1');`);const c=boot(2,b.storage);c.ctx.assert=assert;c.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.match(curEv.title,/雨廊一伞/);choose(0);drain();assert.ok(S.consorts.some(c=>c.journeys?.current?.stage===1));`);
});
test('eligible new stories are reachable from the actual character page',()=>{
 const b=world('rainUmbrella');b.run(`var panel=journeyPanel(c);assert.ok(panel.includes("'rainUmbrella'"));assert.ok(panel.includes("'windowChess'"));`);
});
