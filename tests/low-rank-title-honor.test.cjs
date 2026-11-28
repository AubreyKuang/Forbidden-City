// 嫔位以下破格赐号：她欢喜，人物纪事与心境都有记载；高位交恶者不屑、高位交好者替她高兴、低位者不服。
// Journals recorded before content 166 keep the old rule: no 赐封号 below 嫔, titles below 嫔 stay hidden.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');

test('Special 赐号 below 嫔 shows the title and moves the whole harem',()=>{
  const b=world();b.ctx.assert=assert;
  b.run(`{
    const mk=(sur,given,trait,rank)=>{const c=makeGirl({sur,given,age:20,trait,fam:{t:'知县',p:30}});addConsort(c,rank,'选秀入宫');
      delete c.solitary;delete c.timeTraveler;c.hp=95;c.xin={k:'平和',t:S.turn};return c;};
    const t=mk('苏','若','活泼',1);                       // 答应, the one honoured
    const foe=mk('严','凝','骄矜',5),friend=mk('林','照','温婉',4),peer=mk('赵','蕊','善妒',1);
    S.rel[rk(foe,t)]=-30;S.rel[rk(friend,t)]=40;S.rel[rk(peer,t)]=0;
    assert.equal(cName(t),'苏答应');
    A.go('consort',t.id);assert.match($('#panel').innerHTML,/赐封号/);
    const mood=t.mood;
    A.rename(t.id);assert.equal(curEv.title,'破格赐号');choose(0,'婉');
    assert.equal(t.title,'婉');assert.equal(cName(t),'婉答应');
    assert.ok(t.mood>mood);assert.equal(xinOf(t),'欢喜');
    assert.ok(t.story.some(s=>s.t.includes('破格赐号「婉」')&&s.t.includes('荣宠')));
    assert.match(modalResult?.text||String(modalResult||''),/消息传遍六宫/);
    assert.equal(xinOf(foe),'不屑');assert.ok(foe.story.some(s=>s.t.includes('婉答应')));
    assert.equal(xinOf(friend),'欢喜');assert.ok(friend.story.some(s=>s.t.includes('婉答应')));
    assert.equal(xinOf(peer),'嫉恨');assert.ok(peer.story.some(s=>/凭什么|摔在了地上/.test(s.t)));
    assert.ok(relGet(foe,t)<-30&&relGet(friend,t)>40&&relGet(peer,t)<0);
    drain();
    A.go('consort',t.id);assert.match($('#panel').innerHTML,/改封号/);
    // A title kept after demotion (no special grant) stays hidden, as before.
    peer.title='敏';assert.equal(cName(peer),'赵答应');
    // Older journals: the old naming rule.
    const real=journalContentVersion;journalContentVersion=()=>165;
    assert.equal(cName(t),'苏答应');journalContentVersion=real;
  }`);
});
