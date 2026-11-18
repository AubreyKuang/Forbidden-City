const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');
const setup=`var admit=key=>{const r=storyCastCreate(key);storyCastAdmit(r.person,r,'入宫');return byId(r.id);};
 E().age=40;E().energy=30;E().treasury=300;E().people=50;`;

test('White Spring brothers cannot enter the succession and sisters can choose a distinct foreign household and exchange letters',()=>{
 const b=world();b.ctx.assert=assert;b.run(setup+`
 const m=admit('ayimu'),boy=makeKid(m,'m','承清'),girl=makeKid(m,'f','清竹'),other=makeKid(a,'f','云锦');
 for(const k of [boy,girl,other])k.born=S.turn-18*12;
 assert.match(birthTags(girl),/异域血脉/);assert.match(birthTags(boy),/异域血脉/);assert.equal(boy.charm,25);
 A.kidHeir(boy.id);assert.equal(S.heir,null);assert.equal(heirTick(),null);
 other.foster=m.id;assert.equal(whiteSpringMatchReady(other),false);
 girl.betrothal={};assert.equal(whiteSpringMatchReady(girl),false);delete girl.betrothal;
 girl.estate={pursuit:'books',opened:0,stage:'done',route:'independent'};girl.whiteSpringStudy=true;
 const menu=()=>{A.kidMarriage(girl.id);return curEv.choices.findIndex(o=>o.t.includes('白泉国'));};
 let n=menu();assert.ok(n>=0);choose(n);const fiance=curEv.cast[1].id;
 choose(2);choose(curEv.choices.findIndex(o=>o.t.includes('白泉国')));assert.equal(curEv.cast[1].id,fiance);
 choose(0);drain();assert.equal(girl.spouse.id,fiance);assert.equal(girl.estate.stage,'done');assert.equal(girl.spouse.route,'whiteSpring');
 assert.equal(childInPalace(girl),false);assert.equal(childWhereabouts(girl),'白泉国');assert.equal(royalKinContactPlace(girl,'letter'),'白泉国');
 assert.equal(princessEstateVisitReady(girl),false);assert.equal(whiteSpringMatchReady(girl),false);assert.ok(m.story.some(e=>e.t.includes('和亲白泉')));
 S.turn+=2;A.princessVisit(girl.id);assert.equal(curEv.title,'白泉国家书');choose(0);drain();assert.ok(m.story.at(-1).t.includes('白泉寄回'));
 assert.equal(princessMarriageLand({princessMarriage:'frontier'}),'北境');assert.doesNotMatch(birthTags(other),/异域血脉/);S.heir=boy.id;assert.match(deathEvent('病逝').text,/宗室旁支继统/);
 `);
});

for(const plan of [0,1])test('public favor checks consecutive months, independent cooldowns, costs and a once-only reply '+plan,()=>{
 let b=world();b.ctx.assert=assert;b.ctx.plan=plan;b.run(setup+`
 var su=admit('suheng'),x=admit('xiaoman'),rec=key=>storyCastRecord(key),tick=()=>{S.turn++;commonerFavorMonth();commonerFavorMonth();};
 su.favor=x.favor=80;tick();tick();assert.equal(E().people,50);x.cold=true;tick();assert.equal(E().people,51);x.cold=false;
 tick();tick();assert.equal(E().people,51);tick();assert.equal(E().people,52);
 su.favor=20;tick();assert.equal(commonerFavorEvent(su,rec('suheng')),null);su.favor=80;
 A.commonerFavor(x.id);choose(plan);drain();assert.equal(E().treasury,plan===0?296:300);assert.equal(rec('xiaoman').publicFavor.plan,plan===0?'public':'local');
 tick();assert.equal(commonerFavorEvent(x,rec('xiaoman')),null);tick();A.commonerFavor(x.id);save('auto');`);
 b=boot(666,b.storage);b.ctx.assert=assert;b.ctx.plan=plan;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
 assert.match(curEv.title,/花名账/);choose(0);drain();assert.equal(E().treasury,300);assert.ok(storyCastRecord('xiaoman').publicFavor.done);
 S.turn++;commonerFavorMonth();const su=byId(storyCastRecord('suheng').id);A.commonerFavor(su.id);choose(plan);drain();
 const treasury=E().treasury;S.turn+=2;A.commonerFavor(su.id);assert.match(curEv.title,/复秤回帖/);choose(0);drain();assert.equal(E().treasury,treasury);
 assert.equal(commonerFavorEvent(su,storyCastRecord('suheng')),null);`);
});

test('ordinary month advancement awards both commoners their own popular-support entry',()=>{
 const b=world();b.ctx.assert=assert;b.run(setup+`
 const su=admit('suheng'),x=admit('xiaoman');su.favor=x.favor=95;
 for(let n=0;n<3;n++){A.endMonth();drain();}
 for(const c of [su,x]){
   const p=storyCastRecord(c.fixedStory).publicFavor;
   assert.equal(p.last,S.turn);assert.equal(p.months,3);
   assert.equal(c.story.filter(e=>e.t.includes('民心+1')).length,1);
 }
 `);
});
