const test=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');

test('皇亲按实际行止筛选，山门与在京修习有别，旧信在各页共用已读状态',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var m=empress(),heir=makeKid(m,'m','承旭');
 heir.born=S.turn-244;
 var mount=makeKid(m,'f','明昭'),local=makeKid(m,'m','承宣'),far=makeKid(m,'m','承和');
 for(const k of [mount,local,far])k.born=S.turn-230;
 succeed(heir);choose(0);drain();
 mount=royalById(mount.id);local=royalById(local.id);far=royalById(far.id);
 mount.immortal={route:'cloud',root:'水灵根',stage:'learning',rank:0,departed:S.turn-4,history:[]};
 local.immortal={...mount.immortal,stage:'invited'};far.princeEstate={location:'蜀地'};far.away=true;
 UI.view='home';E().energy=8;var unchanged=JSON.stringify(S);
 for(const stage of ['learning','trial','sect']){
  mount.immortal.stage=stage;A.royalKinFilter('outside');var panel=royalKinRosterPanel();
  assert.match(panel,/明昭/);assert.match(panel,/在外修行/);assert.match(panel,/水灵根/);assert.match(panel,/云岫清微门/);
  assert.match(panel,/承和/);assert.doesNotMatch(panel,/承宣/);
  assert.equal(royalKinContactMode(mount),'letter');
 }
 mount.immortal.stage='learning';A.royalKinFilter('capital');assert.equal(JSON.stringify(S),unchanged);
 assert.match(royalKinRosterPanel(),/承宣/);assert.match(royalKinRosterPanel(),/召见/);assert.doesNotMatch(royalKinRosterPanel(),/明昭/);
 A.royalKinContact(mount.id);assert.match(curEv.text,/云岫清微门/);choose(0);drain();A.royalKinFilter('outside');assert.match(royalKinRosterPanel(),/等候回信/);
 A.royalKinFilter('unread');assert.match(royalKinRosterPanel(),/暂无未读回信/);
 S.turn++;royalKinContactTick();var unread=royalKinRosterPanel();assert.match(unread,/有回信 1/);assert.match(unread,/明昭/);assert.doesNotMatch(unread,/承宣|承和/);
 assert.match(mount.royalKinContact.reply.text,/晨课/);assert.ok(mount.story.some(e=>e.t.includes('皇亲回信')));
 mount.immortal.stage='returned';A.royalKinFilter('capital');assert.match(royalKinRosterPanel(),/明昭/);assert.equal(royalKinContactMode(mount),'visit');
 A.go('relative',mount.id);A.royalKinReply(mount.id);assert.match(curEv.text,/云岫清微门/);choose(0);drain();A.go('home');
 A.royalKinFilter('unread');assert.match(royalKinRosterPanel(),/有回信 0/);assert.doesNotMatch(royalKinRosterPanel(),/明昭/);
 far.princessMarriage='frontier';far.household={whiteSpringVisit:{stage:'palace'}};assert.equal(royalKinContactMode(far),'visit');
 far.jailed=true;assert.equal(royalKinContactMode(far),'');`);
});
