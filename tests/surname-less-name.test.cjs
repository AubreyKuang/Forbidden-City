// A consort without a surname (阿依慕) is called by her given name, not by her rank alone.
// Scenes recorded before journal content 165 replay with the old wording.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');

test('阿依慕 is 阿依慕贵人 on her 绿头牌 and her page; older journals keep the old name',()=>{
  const b=world();b.ctx.assert=assert;
  b.run(`{E().age=30;const r=storyCastCreate('ayimu');storyCastAdmit(r.person,r,'test');
    const c=S.consorts.find(x=>x.fixedStory==='ayimu');
    assert.equal(c.sur,'');assert.equal(cName(c),c.given+RANKS[c.rank]);
    assert.match(viewCards(),new RegExp(c.given+RANKS[c.rank]));
    c.cold=true;assert.ok(cName(c).startsWith(c.given));c.cold=false;
    const real=journalContentVersion;journalContentVersion=()=>164;
    assert.equal(cName(c),RANKS[c.rank]);journalContentVersion=real;}`);
});
