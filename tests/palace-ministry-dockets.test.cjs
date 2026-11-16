const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');

function court(){
  const game=boot(202);game.ctx.assert=assert;
  game.run(`A.start();drain();E().energy=15;E().treasury=1500;A.go('ministries');
    var approve=id=>{A.ministryAct(id);choose(0);drain();};
    var advance=()=>{A.endMonth();drain();};`);
  return game;
}

test('a revenue review arrives in two real months and uses the actual autumn tax policy',()=>{
  let game=court();game.force(.1);
  game.run(`approve('revenue');var d=ministryDockets()[0];
    assert.ok(d.success);assert.match(viewMinistries(),/2个月后回奏/);
    A.ministryDocket(d.id);assert.equal(modalOpen,false);
    advance();assert.match(viewMinistries(),/1个月后回奏/);
    advance();assert.match(viewGovernment(),/1 份回奏待阅/);assert.equal(modalOpen,false);
    A.ministryDocket(d.id);assert.equal(curEv.title,'户部回奏 · 追库与秋税');
    choose(curEv.choices.length-1);assert.equal(d.closed,undefined);
    A.ministryDocket(d.id);save('auto');`);
  game=boot(921,game.storage);game.ctx.assert=assert;
  game.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);
    assert.equal(curEv.title,'户部回奏 · 追库与秋税');var energy=E().energy;
    choose(0);drain();assert.equal(governance().tax,'light');assert.equal(E().energy,energy-1);
    assert.match(ministryDockets()[0].decision,/减免三成秋税/);assert.equal(S.log.filter(x=>x.t.includes('六部纪事 · 追库与秋税')).length,1);
    S.month=10;var estimate=taxEstimate();annualRevenueTick();assert.equal(treasuryReceipt('tax').policy,'light');
    assert.equal(treasuryReceipt('tax').amount,estimate);`);
});

test('the rites review names the player-selected winner of the actual grace examination',()=>{
  const game=court();
  game.run(`approve('rites');var d=ministryDockets()[0];assert.match(viewMinistries(),/待恩科放榜/);
    A.endMonth();for(var i=0;modalOpen&&curEv.title!=='恩科殿试 · 钦点三甲'&&i<40;i++){
      if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));
    }
    assert.equal(curEv.title,'恩科殿试 · 钦点三甲');assert.equal(d.winner,undefined);
    var chosen=curEv.cast[1];choose(1);drain();assert.equal(d.winner,chosen.id);
    assert.equal(d.winner,S.ministries.exams.at(-1).top[0]);assert.ok(!ministryDocketReady(d));
    advance();A.ministryDocket(d.id);assert.match(curEv.text,new RegExp(chosen.name));assert.ok(curEv.text.includes(chosen.essay));
    choose(0);drain();assert.equal(UI.view,'scholar');assert.equal(UI.sel,chosen.id);assert.ok(d.closed);`);
});

test('minister reviews link to existing court pages and preserve the original cost of follow-up assignments',()=>{
  const game=court();
  game.force(.1,.99,.1,.1);
  game.run(`for(var id of ['personnel','war','justice','works'])approve(id);
    var find=id=>ministryDockets().find(d=>d.ministry===id);
    assert.equal(find('war').success,false);assert.equal(find('works').success,true);
    S.turn+=2;S.month+=2;
    A.ministryDocket(find('personnel').id);choose(0);drain();assert.equal(UI.view,'officials');
    A.ministryDocket(find('justice').id);choose(0);drain();assert.equal(UI.view,'jinyiwei');
    var treasury=E().treasury,energy=E().energy;
    A.ministryDocket(find('war').id);choose(0);assert.equal(curEv.title,OFFICIAL_TASKS.border.title);
    choose(curEv.choices.length-1);assert.equal(E().treasury,treasury);assert.equal(E().energy,energy);
    A.ministryDocket(find('works').id);choose(0);assert.equal(curEv.title,OFFICIAL_TASKS.water.title);
    assert.equal(E().treasury,treasury);choose(0);drain();
    assert.equal(E().treasury,treasury-OFFICIAL_TASKS.water.cost);assert.equal(E().energy,energy-1);assert.ok(floodDikeReady());`);
});
