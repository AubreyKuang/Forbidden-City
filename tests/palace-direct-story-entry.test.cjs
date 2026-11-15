const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`c.trait='沉静';c.palace='景仁宫';var episode=PERSONAL_EPISODES.find(e=>e.title==='雪梅辨色');offerPersonalExperience(c,episode);var cid=c.id,place=PLACES.find(p=>p.p===c.palace);PalaceActions.reset();`);return b;}
test('clicking the advertised palace directly opens its personal scene without charging for entry',()=>{
 const b=setup();b.run(`var energy=E().energy;A.visitMapActivity(place.id);assert.equal(curEv.title,'雪梅辨色');assert.equal(curEv.por,c);assert.equal(E().energy,energy);choose(0);assert.equal(E().energy,energy-1);assert.equal(c.personalExperiences.current.stage,'working');`);
});
test('the map invitation carries its exact scene and stale invitations cannot open a different story',()=>{
 const b=setup();b.run(`var lead=personalExperienceLeads()[0];assert.match(mapLeadAction(lead),/A.mapStory/);var token=lead.storyToken;A.mapStory('experience',cid,token);choose(1);drain();var energy=E().energy;A.mapStory('experience',cid,token);assert.equal(modalOpen,false);assert.equal(E().energy,energy);`);
});
test('several named scenes in one palace produce one short chooser with a separate overview entry',()=>{
 const b=setup();b.run(`other.palace=c.palace;other.trait='沉静';offerPersonalExperience(other,episode);PalaceActions.reset();A.visitMapActivity(place.id);assert.match(curEv.title,/正在发生/);assert.equal(curEv.choices.filter(o=>o.t.includes('雪梅辨色')).length,2);choose(1);assert.equal(curEv.title,'雪梅辨色');assert.equal(curEv.por,other);`);
});
test('a completed or unavailable scene falls back to the ordinary palace visit',()=>{
 const b=setup();b.run(`c.cold=true;assert.equal(palaceActiveSceneEvent(place),null);c.cold=false;endPersonalExperience(c,episode,'自行完成','自主');A.visitMapActivity(place.id);assert.notEqual(curEv?.title,'雪梅辨色');`);
});
test('both direct scene and multi-person chooser survive a real refresh without duplicate cost',()=>{
 for(const multiple of [false,true]){const b=setup();b.run(`${multiple?"other.palace=c.palace;other.trait='沉静';offerPersonalExperience(other,episode);":''}PalaceActions.reset();A.visitMapActivity(place.id);var title=curEv.title;save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,title);${multiple?'choose(0);':''}choose(0);save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(E().energy,9);assert.match(modalResult.text,/开始按自己的想法/);`);}
});
