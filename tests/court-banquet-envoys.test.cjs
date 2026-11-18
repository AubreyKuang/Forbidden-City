const {test}=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');

for(const [kind,month] of [['newYear',1],['midAutumn',8],['emperor',5]]){
  test(kind+' banquet actually receives the same White Spring party and saves their decision',()=>{
    const b=world();b.ctx.assert=assert;b.ctx.kind=kind;b.ctx.month=month;
    b.run(`S.month=month;E().birthMonth=5;E().age=30;
      assert.ok(banquetKind(kind).ready);A.openBanquet(kind);assert.match(viewBanquet(),/外宾席/);
      A.banquetEnvoys();assert.ok(UI.banquet.envoys);A.holdBanquet();choose(3);drain();
      assert.equal(storyCastRecord('ayimu'),null);assert.ok(banquetKind(kind).ready);
      const funds=E().treasury,energy=E().energy;A.holdBanquet();choose(0);
      assert.match(curEv.title,/白泉来使/);assert.equal(E().treasury,funds-30);assert.equal(E().energy,energy-1);
      assert.equal(banquetKind(kind).ready,false);choose(0);assert.match(curEv.title,/公主献舞/);save('auto');`);
    const n=boot(817,b.storage);n.ctx.assert=assert;n.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
      const r=storyCastRecord('ayimu');assert.equal(curEv.por.id,r.person.id);
      choose(2);drain();assert.equal(r.stage,1);assert.equal(storyCastMeetReady('ayimu'),false);
      S.turn++;A.storyCastVisit('ayimu');choose(0);drain();assert.equal(byId(r.id).fixedStory,'ayimu');
      assert.equal(S.consorts.filter(c=>c.fixedStory==='ayimu').length,1);`);
  });
}
test('automatic arrivals use one roll, courtesy deferral preserves the encounter, admitted characters are not introduced again',()=>{
  const b=world();b.ctx.assert=assert;b.run(`E().age=30;S.month=8;
    var roll=0,calls=0;Math.random=()=>{calls++;return roll;};
    roll=.36;receiveBanquetEnvoys('midAutumn','中秋宫宴',false);assert.equal(modalOpen,false);assert.equal(calls,1);
    roll=.34;receiveBanquetEnvoys('midAutumn','中秋宫宴',false);assert.match(curEv.title,/白泉/);choose(1);drain();
    assert.equal(storyCastRecord('ayimu'),null);assert.equal(banquetKind('garden').ready,true);`);
});
test('existing Mid-Autumn dialog and new calendar entry share one feast, mourning blocks invitations',()=>{
  const b=world();b.ctx.assert=assert;b.run(`S.month=8;E().age=30;const k=makeKid(a,'f','清竹');k.love=50;
    const funds=E().treasury;pushEv(festival());choose(1);nextEv();assert.match(curEv.title,/白泉来使/);
    choose(0);choose(0);drain();assert.equal(E().treasury,funds-30);assert.equal(k.love,55);
    assert.equal(festival(),null);assert.equal(banquetKind('midAutumn').ready,false);
    S.month=1;A.openBanquet('newYear');A.banquetEnvoys();A.holdBanquet();choose(0);
    assert.match(curEv.title,/(西域|海西|东瀛)使臣/);choose(1);drain();assert.equal(S.consorts.filter(c=>c.fixedStory==='ayimu').length,1);
    S.flags.dowager.mourning={turn:S.turn};assert.equal(banquetKind('emperor')?.ready,false);
    receiveBanquetEnvoys('newYear','新年宫宴',true);assert.equal(modalOpen,false);`);
});
