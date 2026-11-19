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

function mountainWorld(){
 const w=world();w.ctx.assert=assert;
 w.run(`var m=empress(),heir=makeKid(m,'m','承旭');heir.born=S.turn-244;
 var kin=makeKid(m,'f','明昭');kin.born=S.turn-230;
 succeed(heir);choose(0);drain();kin=royalById(kin.id);
 kin.immortal={stage:'learning',route:'cloud',root:'水灵根',departed:S.turn-5,rank:0,history:[]};
 UI.view='home';E().energy=8;`);return w;
}
test('山门主动家书按寄出时的阶段与实职落笔，两端记实，旧信稍后可覆且不重复扣费',()=>{
 for(const [stage,rank,trait,expected] of [
  ['learning',0,'内敛','晨钟'],['trial',0,'内敛','驿亭'],['sect',0,'内敛','饭碗'],['sect',1,'内敛','首席弟子'],
  ['sect',2,'好胜','少主'],['sect',2,'审慎','护山长老'],['sect',3,'内敛','宗主']
 ]){
  const w=mountainWorld();Object.assign(w.ctx,{stage,rank,trait,expected});
  w.run('kin.immortal.stage=stage;kin.immortal.rank=rank;kin.temperament=trait');
  w.force(0,0,0);w.run(`royalKinContactTick();
   var mail=kin.royalKinContact.reply;assert.equal(mail.kind,'mountain');assert.ok(mail.text.includes(expected));
   assert.match(royalKinRosterPanel(),/读明昭的山门家书/);assert.ok(royalKinUnread().includes(kin));
   assert.ok(kin.story.at(-1).t.includes(mail.text));assert.ok(S.log.at(-1).t.includes(mail.text));
   A.royalKinReply(kin.id);choose(2);drain();assert.ok(mail.unread);
   kin.immortal.stage='returned';E().energy=0;A.royalKinReply(kin.id);assert.ok(!curEv.choices[0].cond());choose(2);drain();
   E().energy=2;A.royalKinReply(kin.id);var reply=curEv.choices[0].f;choose(0);drain();reply();
   assert.equal(E().energy,1);assert.ok(!mail.unread);assert.ok(!royalKinUnread().includes(kin));
   assert.ok(kin.story.at(-1).t.includes(mail.answer));assert.match(S.log.at(-1).t,/御笔覆家书.*送往京城/);
   assert.equal(kin.story.filter(e=>e.t.includes('【御笔覆家书】')).length,1);`);
 }
});
test('名册同月只抽一次，避开待复、未读、离山、近日已通信者；另次家书换题',()=>{
 const w=mountainWorld();w.force(.99);w.run(`royalKinContactTick();assert.ok(!kin.royalKinContact?.reply);
 royalKinContactTick();assert.ok(!kin.royalKinContact?.reply);S.turn++;
 kin.royalKinContact={pending:{due:S.turn+5}};mountainKinLetterTick();assert.ok(!kin.royalKinContact.reply);
 delete kin.royalKinContact.pending;kin.royalKinContact.reply={text:'旧回信',unread:true};mountainKinLetterTick();assert.equal(kin.royalKinContact.reply.text,'旧回信');
 delete kin.royalKinContact.reply;kin.immortal.stage='invited';mountainKinLetterTick();assert.ok(!kin.royalKinContact.reply);
 kin.immortal.stage='trial';kin.immortal.lastLetter=S.turn;mountainKinLetterTick();assert.ok(!kin.royalKinContact.reply);S.turn+=2;`);
 w.force(0,0,0);w.run(`mountainKinLetterTick();var first=kin.royalKinContact.reply;A.royalKinReply(kin.id);choose(3);drain();
 S.turn+=7;mountainKinLetterTick();assert.equal(first,kin.royalKinContact.reply);S.turn++;`);
 w.force(0,0,0);w.run(`mountainKinLetterTick();var next=kin.royalKinContact.reply;assert.notEqual(next.subject,first.subject);
 A.royalKinReply(kin.id);choose(1);drain();assert.match(S.log.at(-1).t,/书案边/);`);
});
