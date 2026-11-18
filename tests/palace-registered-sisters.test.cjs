const test=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');
function setup(){
 const b=boot(187);b.ctx.assert=assert;
 b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;var a=empress(),h=houseOf(a);a.age=27;h.natal.memberBorn[a.id]=S.turn-27*12;
 var younger=addNatalPerson(a,h,'f',18,183, false);younger.willing=true;younger.married=false;
 for(const p of h.relatives)if(p!==younger)p.willing=false;
 var id=younger.id,host=a.id,notes=p=>p.story.map(e=>e.t).join(' ');PalaceActions.reset();`);return b;
}
for(const accept of [false,true])test('the named sister shown before selection survives nomination, reload and '+(accept?'admission':'rejection'),()=>{
 const b=setup();b.run(`assert.match(familyHouseTree(a),new RegExp(younger.name));var n=h.relatives.length,father=h.father.id;
 var g=registeredSelectionSister(a);assert.equal(g.id,id);assert.equal(g.age,natalAge(younger));assert.equal(g.artPortrait,younger.artPortrait);assert.equal(g.trait,younger.trait);assert.match(g.kinNote,/亲妹妹/);
 S.cands=[g];S.selection={phase:'audience',current:g.id,performed:[]};selectionBatch();houseOf(g);save('auto');A.load('auto');drain();
 a=byId(host);h=houseOf(a);younger=h.relatives.find(p=>p.id===id);g=S.cands[0];assert.ok(!younger.consortId);assert.equal(h.relatives.length,n);assert.match(familyHouseTree(a),new RegExp(younger.name));
 ${accept?"A.xxTake(id);choose(2);save('auto');A.load('auto');drain();a=byId(host);h=houseOf(a);younger=h.relatives.find(p=>p.id===id);g=byId(id);assert.equal(g.natalOrigin.via,'selection');assert.equal(g.house.father.id,father);assert.equal(younger.consortId,id);assert.match(notes(g),/殿选留牌/);assert.equal(registeredSelectionSister(a),null);":"A.xxDrop(id);A.xxEnd();save('auto');A.load('auto');drain();a=byId(host);h=houseOf(a);assert.ok(!h.relatives.find(p=>p.id===id).consortId);assert.equal(byId(id),undefined);assert.match(familyHouseTree(a),new RegExp(younger.name));"}
 assert.equal(h.relatives.length,n);assert.equal(h.relatives.filter(p=>p.id===id).length,1);assert.equal(PalaceActions.blocked,false);`);
});
test('no eligible sister never manufactures a relative; a stale marriage blocks admission',()=>{
 const b=setup();b.run(`var g=registeredSelectionSister(a);S.cands=[g];younger.married=true;var before=JSON.stringify(h.relatives);
 assert.equal(registeredSelectionSister(a),null);A.xxTake(g.id);choose(0);drain();assert.equal(byId(g.id),undefined);assert.equal(younger.consortId,undefined);assert.equal(JSON.stringify(h.relatives),before);
 for(const c of S.consorts)if(c.house)c.house.relatives=[];for(let i=0;i<20;i++){genCands();assert.ok(!S.cands.some(x=>Object.values(x.kin||{}).some(k=>k.startsWith('亲'))));}
 `);
});
function plot(guarded){
 const b=setup();b.run(`var m=a,aunt=makeNatalConsort(m,younger);addConsort(aunt,3,'探亲留宫');aunt.scheme=85;aunt.hp=80;m.hp=80;S.rel[rk(aunt,m)]=-60;m.preg=5;m.pregnancyCalendar={conceived:56,term:10,nights:[]};`);
 b.force(.9);b.run('assert.equal(pendingSisterCustody(),null)');b.force(.01,0);
 b.run(`var intro=pendingSisterCustody();assert.match(intro.title,/孕中问养/);intro.choices[${guarded?0:1}].f();assert.equal(pendingSisterCustody(),null);
 S.turn+=5;var kid=makeKid(m,'f','映月');kid.pendingName=true;m.preg=0;m.delivery={turn:S.turn,date:dateStr(),children:[kid.id],settled:false,difficult:false};
 var mother=m.id,child=kid.id,culprit=aunt.id;PalaceActions.reset();A.resumeBirth(m.id);`);return b;
}
test('early protection prevents the crime; another pregnancy cannot inherit it',()=>{
 for(const protect of [true,false]){const b=plot(protect);b.run(`${protect?'':'kid.birthCalendar.conceived++;'}choose(0);drain();assert.equal(m.alive,true);assert.equal(kid.foster||null,null);assert.equal(pendingSisterInquiry(),null);`);}
});
for(const investigate of [true,false])test('deathbed words, separate custody and the dated investigation or rival disclosure '+investigate,()=>{
 const b=plot(false);b.run(`choose(0);assert.match(modalResult.text,/怀里/);assert.match(modalResult.text,/妹妹/);assert.equal(m.alive,false);assert.equal(m.deathReason,'临盆身故，死因未明');
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);m=byId(mother);kid=kidById(child);aunt=byId(culprit);
 nextEv();assert.match(curEv.title,/查或不查/);choose(${investigate?0:1});nextEv();assert.match(curEv.title,/姨母请养/);choose(${investigate?1:0});drain();
 assert.equal(kid.mom,m.id);assert.equal(kid.foster||null,${investigate?'null':'aunt.id'});var since=m.sisterCustody.since;
 save('auto');A.load('auto');drain();m=byId(mother);aunt=byId(culprit);kid=kidById(child);S.turn=since+5;assert.equal(pendingSisterInquiry(),null);S.turn++;
 ${investigate?"assert.match(pendingSisterInquiry().title,/锦衣卫回奏/);":"assert.equal(pendingSisterInquiry(),null);S.turn=since+12;for(const p of harem()){if(p!==aunt){S.rel[rk(p,aunt)]=0;delete p.kinRival?.[aunt.id];delete aunt.kinRival?.[p.id];}}assert.equal(pendingSisterInquiry(),null);var rival=makeGirl();addConsort(rival,3,'入宫');S.rel[rk(rival,aunt)]=-45;assert.match(pendingSisterInquiry().title,/敌妃揭案/);"}
 var report=pendingSisterInquiry();report.choices[0].f();assert.equal(report.valid(),false);assert.equal(pendingSisterInquiry(),null);assert.equal(m.deathReason,'临盆遭亲姊妹所害');assert.equal(kid.mom,mother);assert.match(notes(kid),/生母旧案/);`);
});
