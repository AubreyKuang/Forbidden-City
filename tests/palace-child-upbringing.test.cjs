const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./child-consequences-world.cjs');
function setup(){const w=world();w.ctx.assert=assert;return w;}
test('after a transfer the child records homesickness, hurt, and a better experience after real shared care',()=>{
 const w=setup();w.run(`elder.temperament='内敛';elder.motherBonds[a.id].trust=20;
 doFoster(elder,b);var notes=()=>elder.story.filter(s=>s.t.startsWith('【在养母身边】'));
 fosterAdjustmentMonth(elder);assert.equal(notes().length,0);
 S.turn++;fosterAdjustmentMonth(elder);assert.match(notes()[0].t,/没好意思/);
 b.mood=15;for(let i=0;i<3;i++){S.turn++;fosterAdjustmentMonth(elder);}
 assert.match(notes()[1].t,/委屈/);
 recordFamilyTime(elder,b,'听孩子说心事','肯和养母说','耐心听完',{gain:30});
 for(let i=0;i<6;i++){S.turn++;fosterAdjustmentMonth(elder);}
 assert.match(notes()[2].t,/心里踏实多了/);fosterAdjustmentMonth(elder);assert.equal(notes().length,3);
 var before=notes().length;doFoster(elder,q);q.homeLeave={};S.turn++;fosterAdjustmentMonth(elder);assert.equal(notes().length,before);
 delete q.homeLeave;S.turn++;fosterAdjustmentMonth(elder);assert.equal(notes().length,before+1);assert.ok(notes().at(-1).t.includes(fullName(q)));`);
});
test('infant records, established placements and foreign-born foster families respect who is raising whom',()=>{
 const w=setup();w.run(`b.fam={t:'海西贵族',p:10};baby.foster=b.id;baby.fosterT=S.turn-16;
 childUpbringingMonth();assert.match(baby.story.at(-1).t,/乳母记下/);assert.equal(baby.fosterAdjustment.stage,3);
 assert.equal(baby.homelandMemories,undefined);baby.born=S.turn-85;childUpbringingMonth();assert.equal(baby.homelandMemories,undefined);
 assert.equal(baby.story.filter(s=>s.t.startsWith('【在养母身边】')).length,1);`);
});
test('language milestones include the rescued Ayina, White Spring princess and each envoy origin; a practice scene saves and replays',()=>{
 const w=setup();w.run(`a.fam={t:'西域流寓',p:5};a.rescue={oldName:'依娜',trust:50};a.enteredAt=S.turn;
 var id=a.id;assert.equal(consortHomeland(a),'西域');assert.equal(consortHomeland({...a,fixedStory:'ayimu'}),'白泉');
 for(const d of FOREIGN_CONSORT_ORIGINS)assert.equal(consortHomeland({fam:{t:d.fam}}),d.region);
 assert.equal(palaceSpeechPanel(q),'');PalaceActions.reset();var energy=E().energy;
 A.practicePalaceSpeech(id);assert.equal(curEv.title,'同习中原话');save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();
 var woman=byId(id);A.practicePalaceSpeech(id);assert.equal(E().energy,energy-1);
 assert.equal(woman.story.filter(s=>s.t.startsWith('【同习中原话】')).length,1);
 S.turn+=15;childUpbringingMonth();assert.equal(woman.palaceSpeech.stage,3);assert.doesNotMatch(palaceSpeechPanel(woman),/onclick/);
 assert.doesNotMatch(rescueVoice(woman).lines[0],/说汉话仍有不熟/);`);
});
test('children discover their birth mother’s language, likeness and changing feelings at different ages',()=>{
 const w=setup();w.run(`a.fixedStory='ayimu';little.temperament='内敛';var notes=()=>little.story.filter(x=>x.t.startsWith('【母亲的故乡】'));
 childUpbringingMonth();assert.match(notes()[0].t,/白泉话/);
 S.turn+=12;childUpbringingMonth();assert.match(notes()[1].t,/稀奇事/);assert.ok(little.homelandMemories.hurt);
 recordFamilyTime(little,a,'听孩子说心事','说了自己的难处','听完',{gain:8});
 S.turn+=60;childUpbringingMonth();assert.match(notes()[2].t,/这句我愿意教你/);assert.ok(!little.homelandMemories.hurt);
 var k=child(a,'安和',9);k.temperament='灵动';k.foster=b.id;k.visitRule='closed';var n=a.story.length;
 homelandChildMonth(k,a,'白泉');assert.match(k.story.at(-1).t,/我们家就是这样笑的/);assert.equal(a.story.length,n);
 childUpbringingMonth();assert.equal(notes().length,3);`);
});
