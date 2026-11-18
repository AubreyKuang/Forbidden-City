const {test}=require('node:test'),assert=require('node:assert/strict'),{boot}=require('./playtest-harness.cjs');

test('a real serving official teaches a child and the relationship survives reload',()=>{
 let b=boot(12001);b.ctx.assert=assert;
 b.run(`A.start();drain();var child=makeKid(harem()[0],'m','师承测试');child.born=S.turn-8*12;
  var entry=officialEntries().find(e=>officialServing(e.p)&&!e.p.away);assert.ok(entry);
  A.childMentor(child.id,encodeURIComponent(entry.key));assert.equal(child.mentorId,entry.p.id);
  assert.match(childMentorPanel(child),new RegExp(entry.p.name));assert.ok(child.story.some(s=>s.t.includes('为师')));
  assert.ok(entry.p.story.some(s=>s.t.includes('教导')));save('auto');`);
 b=boot(5,b.storage);b.ctx.assert=assert;
 b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);var child=S.children.find(k=>k.name==='师承测试');
  assert.ok(childMentor(child));assert.match(childMentorPanel(child),/现任师长/);
  childMentor(child).p.dismissed=true;assert.match(childMentorPanel(child),/已不能授课/);
  A.childMentor(child.id,'');assert.equal(child.mentorId,null);`);
});

test('only an eligible child and serving official may establish a mentorship',()=>{
 const b=boot(12001);b.ctx.assert=assert;
 b.run(`A.start();drain();var child=makeKid(harem()[0],'m','未成年');var entry=officialEntries().find(e=>officialServing(e.p));
  A.childMentor(child.id,encodeURIComponent(entry.key));assert.equal(child.mentorId,undefined);
  child.born=S.turn-8*12;entry.p.dismissed=true;A.childMentor(child.id,encodeURIComponent(entry.key));
  assert.equal(child.mentorId,undefined);`);
});

test('an available mentor affects education and stops teaching when dismissed',()=>{
 const b=boot(12001);b.ctx.assert=assert;b.force(.5);
 b.run(`A.start();drain();var child=makeKid(harem()[0],'m','教养测试');child.born=S.turn-8*12;child.policy='放养';child.vir=20;
  var entry=officialEntries().find(e=>officialServing(e.p)&&!e.p.away);entry.p.temperament='持正';entry.p.ability=70;
  A.childMentor(child.id,encodeURIComponent(entry.key));growKid(child);var taught=child.vir-20;
  child.vir=20;entry.p.dismissed=true;growKid(child);var untaught=child.vir-20;
  assert.ok(Math.abs(taught-untaught-.19)<1e-8);`);
});
