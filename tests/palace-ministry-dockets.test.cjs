const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {world}=require('./court-family-browser-fixtures.cjs');

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
    var docket=ministryDockets()[0];assert.equal(docket.followup.date,undefined);
    S.month=10;var estimate=taxEstimate();annualRevenueTick();assert.equal(treasuryReceipt('tax').policy,'light');
    assert.equal(treasuryReceipt('tax').amount,estimate);assert.equal(docket.followup.outcome,'success');
    assert.equal(modalOpen,false);A.ministryAftermath(docket.id);assert.match(curEv.text,new RegExp(estimate+' 万两'));assert.match(curEv.text,/老农/);
    choose(1);drain();assert.ok(ministryHead('revenue').p.story.some(s=>s.t.includes('秋税张榜')));
    A.ministryAftermath(docket.id);assert.equal(modalOpen,false);`);
});

test('the autumn vignette follows actual receipts after a later policy reversal',()=>{
  const game=court();
  game.run(`approve('revenue');advance();advance();var d=ministryDockets()[0];
    A.ministryDocket(d.id);choose(0);drain();A.taxPlan('regular');
    S.month=10;annualRevenueTick();assert.equal(d.followup.outcome,'setback');
    A.ministryAftermath(d.id);assert.match(curEv.text,/按「依定额征收」结算/);assert.match(curEv.text,/减免榜撤下了/);
    choose(curEv.choices.length-1);assert.equal(d.followup.read,undefined);`);
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
    choose(curEv.choices.length-1);assert.equal(E().treasury,treasury);assert.equal(E().energy,energy);assert.equal(find('war').followup,undefined);
    assert.equal(find('war').closed,undefined);assert.ok(ministryDocketReady(find('war')));
    A.ministryDocket(find('works').id);choose(0);assert.equal(curEv.title,OFFICIAL_TASKS.water.title);
    assert.equal(E().treasury,treasury);choose(0);drain();
    assert.equal(E().treasury,treasury-OFFICIAL_TASKS.water.cost);assert.equal(E().energy,energy-1);assert.ok(floodDikeReady());
    assert.ok(find('works').closed);assert.equal(find('works').followup.type,'water');`);
});

test('a second minister takes over pending memorials and a temporary assignment does not leave the seat vacant',()=>{
  const game=court();
  game.run(`var old=ministryHead('revenue').p;
    old.commission={due:S.turn+1};assert.equal(ministryHead('revenue').p,old);
    assert.equal(ministryReady('revenue'),false);assert.match(viewMinistries(),/尚书有差在身/);
    A.ministryAppoint('revenue');assert.equal(modalOpen,false);
    delete old.commission;approve('revenue');
    var d=ministryDockets()[0],newHead=makeScholar();
    newHead.ability=80;newHead.temperament='谨慎';newHead.appointedTurn=S.turn-24;S.scholars.push(newHead);
    A.ministryAppoint('revenue');choose(curEv.choices.findIndex(c=>c.person===newHead));drain();
    assert.equal(ministryHead('revenue').p,newHead);assert.notEqual(old.office,'户部尚书');
    S.turn+=2;S.month+=2;A.ministryDocket(d.id);
    assert.ok(curEv.text.includes(d.headName+'主办'));assert.ok(curEv.text.includes(newHead.name+'接续署理'));
    choose(curEv.choices.findIndex(c=>c.t==='看过回奏，照实归档'));drain();
    assert.equal(d.headId,old.id);assert.equal(d.reviewedBy,newHead.name);
    assert.match(newHead.story.at(-1).t,/逐页核过/);assert.ok(viewMinistries().includes('接办 '+newHead.name));`);
});

for(const outcome of ['success','setback','interrupted'])test('the works feature archives the actual '+outcome+' from the commissioner',()=>{
  const game=court();game.force(.1,outcome==='setback'?.99:.2);
  game.run(`approve('works');S.turn+=2;S.month+=2;var d=ministryDockets()[0];
    A.ministryDocket(d.id);choose(0);assert.equal(curEv.title,'疏通农渠');var person=curEv.choices[0].person;choose(0);drain();
    assert.equal(d.followup.personId,person.id);assert.equal(d.followup.date,undefined);
    A.ministryAftermath(d.id);assert.equal(modalOpen,false);
    S.turn=person.commission.due;S.month+=OFFICIAL_TASKS.water.months;
    if(${JSON.stringify(outcome)}==='interrupted')delete person.commission;
    officialTaskTick();settleInterruptedMinistryFollowups();assert.equal(modalOpen,false);
    assert.equal(d.followup.outcome,${JSON.stringify(outcome)});A.ministryAftermath(d.id);
    assert.match(curEv.text,new RegExp(person.name));assert.match(curEv.text,${outcome==='success'?'/第一畦也见了水/':outcome==='setback'?'/验单留着最后一栏空白/':'/交接未能完成/'});
    choose(0);drain();assert.ok(S.log.some(x=>x.t.includes('工部纪事 · 第一畦引水')));
    assert.ok(!person.story.some(x=>x.t.includes('工部纪事 · 第一畦引水')));`);
});

for(const solved of [true,false])test('a justice referral records '+(solved?'proved evidence without naming the culprit':'a cold file without assigning blame'),()=>{
  const game=world();game.ctx.assert=assert;
  game.run(`setupJyw();var minister=makeScholar();minister.post=minister.office='刑部尚书';S.scholars.push(minister);
    var x=openPalaceCase({kind:'harem',title:'香囊疑案',crime:'香囊藏麝',culprit:b.id,victim:a.id});
    A.ministryAct('justice');choose(0);drain();S.turn+=2;S.month+=2;
    var d=ministryDockets()[0];A.ministryDocket(d.id);choose(0);assert.match(curEv.title,/锦衣卫密查/);
    choose(curEv.choices.findIndex(c=>c.t==='暂缓'));drain();
    assert.equal(d.closed,undefined);assert.equal(d.followup,undefined);assert.equal(x.status,'cold');
    A.ministryDocket(d.id);choose(0);choose(0);drain();
    assert.ok(d.closed);assert.equal(x.ministryDocket,d.id);assert.equal(d.followup.date,undefined);S.turn++;S.month++;`);
  game.force(solved?.1:.99);
  game.run(`jinyiweiTick();assert.equal(x.status,${JSON.stringify(solved?'solved':'cold')});assert.equal(curEv.title,'锦衣卫密报');
    choose(curEv.choices.length-1);drain();assert.equal(d.followup.outcome,${JSON.stringify(solved?'success':'setback')});
    A.ministryAftermath(d.id);assert.doesNotMatch(curEv.text,/许清容/);assert.match(curEv.text,${solved?'/人证物证/':'/尚缺哪一页/'});
    choose(1);drain();assert.ok(jinyiwei().commander.story.some(x=>x.t.includes('刑部纪事 · 秋审归卷')));`);
});
