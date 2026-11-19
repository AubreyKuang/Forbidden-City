const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./child-consequences-world.cjs');
function setup(){const w=world();w.ctx.assert=assert;return w;}
test('new map destinations and field guides lead to the right venue',()=>{
 const w=setup();w.run(`for(const [id,name] of [['music','南府乐房'],['wardrobe','尚衣局']]){
  const p=PLACES.find(p=>p.id===id);assert.equal(p.n,name);
  assert.equal(PLACES.filter(o=>o.d.join(',')===p.d.join(',')).length,1);
  A.arrivePlace(id);assert.equal(UI.view,'place');assert.equal(UI.sel,id);assert.match(viewPlace(),new RegExp(name));assert.ok(PLACE_GUIDES[id][1].length);
 }`);
});
test('garden performance requires its performer, survives reload, and rewards a child only at the actual banquet',()=>{
 const w=setup();w.run(`a.fixedStory='xiaoman';var aid=a.id,energy=E().energy;
 A.arrivePlace('music');A.rehearseWorkshop(aid);A.rehearseWorkshop(aid);
 assert.equal(E().energy,energy-1);assert.equal(availableProgram().name,'双碗藏钱');
 save('auto');A.load('auto');drain();var actor=byId(aid);assert.equal(availableProgram().artist,aid);
 A.openBanquet();assert.match(viewBanquet(),/须请排演者入席/);
 A.toggleWorkshopProgram();assert.equal(UI.banquet.programTurn,undefined);
 A.banquetInviteAll(true);A.toggleWorkshopProgram();assert.equal(UI.banquet.programTurn,S.turn);
 A.holdBanquet();choose(0);drain();assert.equal(availableProgram(),null);
 assert.ok(actor.story.some(e=>e.t.includes('【南府节目·双碗藏钱】')));
 assert.ok(kidsAlive().some(k=>k.story.some(e=>e.t.includes('【南府节目·双碗藏钱】'))));
 assert.equal(rehearsalPiece({...actor,fixedStory:'ayimu'}).name,'白泉鼓引');`);
});
test('work orders consume energy once and follow the actual caregiver at handover; infants and consorts receive distinct items',()=>{
 const w=setup();w.run(`var id=baby.id,energy=E().energy,gold=E().treasury;
 A.arrivePlace('wardrobe');A.orderChildWardrobe(id);A.orderConsortWardrobe(q.id);A.deliverWardrobe();
 assert.equal(wardrobeOrder().item,'夹衣');assert.equal(E().energy,energy-1);assert.equal(E().treasury,gold);
 baby.foster=q.id;S.turn++;baby.away=true;A.deliverWardrobe();assert.ok(wardrobeOrder());
 delete baby.away;A.go('kid',id);assert.match(viewKid(),/交付夹衣/);var trust=childTrust(baby,q);
 A.deliverWardrobe();drain();assert.equal(wardrobeOrder(),null);assert.ok(childTrust(baby,q)>trust);
 assert.ok(q.story.some(e=>e.t.includes('【尚衣局·夹衣】')));assert.ok(!a.story.some(e=>e.t.includes('【尚衣局·夹衣】')));
 A.arrivePlace('wardrobe');A.orderChildWardrobe(elder.id);assert.equal(wardrobeOrder().item,'书袋');
 A.closeWardrobeOrder();S.turn++;b.fixedStory='suheng';A.orderConsortWardrobe(b.id);S.turn++;
 A.go('consort',b.id);A.deliverWardrobe();drain();assert.match(b.story.at(-1).t,/苏蘅拆开香囊/);`);
});
