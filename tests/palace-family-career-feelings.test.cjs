const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`var dad=courtPerson(c.id+':father');dad.p.office=dad.p.post='知县';var sister2=addNatalPerson(c,h,'f',22,779,false);sister2.trait='骄矜';h.brother.temperament='谨慎';`);return b;}
test('a father promotion can leave specific, different memories for his son and daughter',()=>{
 const b=setup();b.force(...Array(20).fill(0));b.run(`careerSetOffice(dad,'知府','实绩升任');assert.match(h.brother.familyCareerNews.feeling,/谨慎/);assert.equal(sister2.familyCareerNews.feeling,'扬眉吐气');
 for(var p of [h.brother,sister2]){assert.ok(p.story.some(s=>s.t.includes(dad.p.name)&&s.t.includes('知县')&&s.t.includes('知府')));assert.ok(p.mood>65);assert.ok(NPCMemory.recall(S,p.id).some(m=>m.type==='father-career-feeling'));}
 assert.equal(sister.familyCareerNews,undefined);assert.match(officialConversation(officialEntry(key),'family'),new RegExp(dad.p.name));assert.match(familyCareerPanel(sister2),/扬眉吐气/);`);
});
test('bad news is fear for a cautious brother and grievance for a proud sister, never proof of a conspiracy',()=>{
 const b=setup();b.run(`dad.p.office=dad.p.post='知府';`);b.force(...Array(20).fill(0));b.run(`careerSetOffice(dad,'知县','失职贬任');assert.equal(h.brother.familyCareerNews.feeling,'惶恐');assert.equal(sister2.familyCareerNews.feeling,'委屈');assert.match(sister2.familyCareerNews.line,/倒霉/);assert.match(sister2.familyCareerNews.line,/不能把猜测当作有人陷害/);assert.ok(h.brother.mood<65);`);
});
test('probability can skip every private reaction; viewing cannot reroll it',()=>{
 const b=setup();b.force(...Array(20).fill(.99));b.run(`careerSetOffice(dad,'知府','实绩升任');assert.equal(h.brother.familyCareerNews,undefined);assert.equal(sister2.familyCareerNews,undefined);UI.sel=key;viewOfficial();assert.equal(h.brother.familyCareerNews,undefined);`);
});
test('small-life echo appears once and letters expose the same remembered response',()=>{
 const b=setup();b.force(...Array(20).fill(0));b.run(`careerSetOffice(dad,'知府','实绩升任');S.turn+=2;familyCareerFollowup();assert.ok(h.brother.story.some(s=>s.t.includes('家书之后的小事')));var n=h.brother.story.length;familyCareerFollowup();assert.equal(h.brother.story.length,n);
 PalaceActions.reset();A.natalLetter(c.id,sister2.id);assert.match(curEv.text,new RegExp(dad.p.name));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(curEv.text,/扬眉吐气/);`);
});
test('minor siblings have childlike reactions; deceased relatives and grandchildren do not acquire them',()=>{
 const b=setup();b.run(`h.brother.alive=false;sister2.born=S.turn-7*12;var baby=addNatalPerson(c,h,'f',1,7799,false),grandchild=addNatalPerson(c,h,'f',18,7749,false);grandchild.parentRelativeId=sister2.id;`);b.force(...Array(20).fill(0));b.run(`careerSetOffice(dad,'知府','实绩升任');assert.match(sister2.familyCareerNews.line,/最好的字/);assert.equal(h.brother.familyCareerNews,undefined);assert.equal(baby.familyCareerNews,undefined);assert.equal(grandchild.familyCareerNews,undefined);`);
});
test('later demotion supersedes old congratulatory voices even if a new private scene is not drawn',()=>{
 const b=setup();b.force(...Array(10).fill(0));b.run(`careerSetOffice(dad,'知府','实绩升任');assert.ok(currentFamilyCareerNews(h.brother));`);
 // Clear unused forced draws before using a fresh deterministic game roll source.
 b.run(`Math.random=()=>.99;careerSetOffice(dad,'知县','失职贬任');assert.equal(currentFamilyCareerNews(h.brother),null);assert.equal(familyCareerPanel(sister2),'');`);
});
test('official postings in the same grade and silver rewards do not invent a parental promotion',()=>{
 const b=setup();b.force(...Array(20).fill(0));b.run(`careerSetOffice(dad,'临安知县','平调');assert.equal(h.brother.familyCareerNews,undefined);assert.equal(sister2.familyCareerNews,undefined);`);
});
test('a daughter’s personal account replaces the generic promotion entry and the follow-up does not repeat the appointment',()=>{
 const b=setup();b.force(...Array(30).fill(0));b.run(`var from=officialOfficeLabel(dad.p);var text=careerSetOffice(dad,'知府','实绩升任');var to=officialOfficeLabel(dad.p);var entries=()=>c.story.filter(e=>e.t.includes(from)&&e.t.includes(to));assert.equal(entries().length,1);assert.match(entries()[0].t,/家书传来/);story(c,'父亲'+dad.p.name+'：'+text);assert.equal(chronicleVisibleEntries(c.story).filter(({e})=>e.t.includes(from)&&e.t.includes(to)).length,1);S.turn+=2;familyCareerFollowup();assert.doesNotMatch(c.story.at(-1).t,/改任|升任/);`);
});
