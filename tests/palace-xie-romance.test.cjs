const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./court-family-browser-fixtures.cjs'),{boot}=require('./playtest-harness.cjs');
function w(trait='灵动'){const b=world();b.ctx.assert=assert;b.run(`var k=makeKid(a,'f','昭宁');k.pendingName=false;k.born=S.turn-18*12;k.temperament='${trait}';k.hp=90;k.love=70;var p=createXieAn();k.xieAdmiration={personId:p.id,outcome:'admired'};PalaceActions.reset();`);return b;}
function declined(alone=false,trait){const b=w(trait);b.force(alone?0:.99);b.run(`xieMarriageRefusal(k,p).choices[1].f();var path=p.xiean.path;`);return b;}
function mature(trait='灵动'){const b=w(trait);b.run(`xieMarriageRefusal(k,p).choices[0].f();var m=p.xiean.marriage;S.turn+=24;m.affection=80;m.loveRemembered=S.turn-1;m.joinedAt=S.turn-12;`);return b;}
function nextStage(b){b.run('S.turn+=3;');b.force(0);b.run('xiePathTick(p);');}
test('an existing independent estate can start and finish the Xie An route after reload',()=>{
 let b=w();b.run(`delete k.xieAdmiration;A.openPrincess(k.id);choose(0);drain();save('auto');`);
 b=boot(89,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');var k=S.children[0],p=xieAn();assert.equal(childInPalace(k),false);assert.ok(xieAdmirerReady(k));assert.equal(p.age,21);assert.match(p.story[0].t,/二十一岁/);S.turn++;`);
 b.force(0,0,0);b.run(`royalHeartTick();assert.equal(heartState().pending.kind,'xiean');
  A.go('princess',k.id);assert.match(viewPrincessEstate(),/听听年少心事/);assert.match(viewPrincessEstate(),/生母 <button/);
  A.royalHeart(k.id);assert.equal(curEv.title,'诗名与心意');choose(0);drain();assert.match(viewPrincessEstate(),/再问谢安的婚事/);
  A.xieMarriage(k.id);assert.equal(curEv.title,'谢安辞婚');choose(1);drain();S.turn++;E().energy=10;
  A.xieBridge('meet');assert.equal(curEv.title,'为他们留一次相遇');choose(0);drain();
  A.xieAfterRefusal();assert.equal(curEv.title,'旧诗之外，重新相识');choose(0);drain();`);
 b.run(`S.turn+=3;`);b.force(0);b.run(`xiePathTick(p);A.xieAfterRefusal();assert.equal(curEv.title,'渐识卿心');choose(0);drain();S.turn+=3;`);
 b.force(0);b.run(`xiePathTick(p);A.xieAfterRefusal();assert.equal(curEv.title,'谢安主动提亲');choose(0);assert.equal(curEv.title,'迟来的心意 · 公主的答复');choose(0);drain();assert.equal(k.spouse.personId,p.id);assert.equal(k.estate.route,'xiean');`);
});
test('Xie An estate eligibility still rejects other marriages, betrothal and absence from the capital',()=>{
 const b=w();b.run(`var estate={pursuit:'books',route:'independent'};k.estate=estate;
  assert.ok(xieAdmirerReady(k));k.estate.route='frontier';assert.equal(xieAdmirerReady(k),false);
  k.estate.route='independent';k.away=true;assert.equal(xieAdmirerReady(k),false);k.away=false;
  k.betrothal={name:'别人'};assert.equal(xieAdmirerReady(k),false);delete k.betrothal;
  k.married=true;assert.equal(xieAdmirerReady(k),false);
 `);
});
for(const age of [11,12,14,15,20,25,26])test('new pursuit starts only at ages 12 through 25: '+age,()=>{const b=w();b.run(`k.born=S.turn-${age}*12;assert.equal(!!xieMarriageRefusal(k,p),${age>=12&&age<=25});`);});
for(const origin of ['forced','proposal'])test('under fifteen '+origin+' creates only reciprocal engagement, not a household',()=>{const b=w();b.run(`k.born=S.turn-14*12;`);if(origin==='forced')b.run(`xieMarriageRefusal(k,p).choices[0].f();`);else{b.force(.99);b.run(`xieMarriageRefusal(k,p).choices[1].f();p.xiean.path.pending='answer';xiePathEvent().choices[0].f();`);}b.run(`assert.ok(!k.married&&!p.married&&!k.spouse&&!k.household);assert.equal(k.betrothal.personId,p.id);assert.equal(p.betrothal.personId,k.id);assert.equal(p.xiean.marriage,undefined);assert.ok(!heartReady(k));assert.ok(!xieBridgeReady());assert.equal(xieMarriageRefusal(k,p),null);UI.sel=k.id;assert.match(viewKid(),/已订婚/);assert.match(marriagePanel(k),/尚非夫妻/);UI.sel=p.id;assert.match(viewScholar(),/已订婚/);var at=S.turn;S.turn+=11;`);b.force(.99);b.run(`xieBetrothalTick(p);assert.ok(!k.married);S.turn=at+12;assert.equal(kidAge(k),15);assert.equal(marriageReady(k),false);xieBetrothalTick(p);assert.ok(k.married&&p.married);assert.equal(k.betrothal,undefined);assert.equal(p.betrothal,undefined);assert.equal(p.xiean.marriage.at,S.turn);assert.equal(p.xiean.marriage.joinedAt,${origin==='forced'?'null':'S.turn'});assert.equal(p.xiean.marriage.separateUntil,${origin==='forced'?'S.turn+12':'null'});assert.equal(householdCanConceive(k,k.spouse),false);`);});
test('forced betrothal that grew into affection does not impose separation at the wedding',()=>{const b=w();b.run(`k.born=S.turn-14*12;xieMarriageRefusal(k,p).choices[0].f();p.xiean.engagement.affection=65;S.turn+=12;xieBetrothalTick(p);assert.equal(p.xiean.marriage.joinedAt,S.turn);assert.equal(p.xiean.marriage.separateUntil,null);assert.ok(p.xiean.marriage.startedWithLove);assert.ok(k.story.some(s=>s.t.includes('成婚，不设一年分房'))||k.story.some(s=>s.t.includes('婚后共同生活，不设一年分房')));`);});
test('a fifteen-year-old forced bride starts separation only on the actual wedding date',()=>{const b=w();b.run(`k.born=S.turn-15*12;xieMarriageRefusal(k,p).choices[0].f();assert.ok(k.married);assert.equal(p.xiean.marriage.joinedAt,null);assert.equal(p.xiean.marriage.separateUntil,S.turn+12);`);});
test('engagement ends on death without fabricating a wedding or widowhood',()=>{const b=w();b.run(`k.born=S.turn-14*12;xieMarriageRefusal(k,p).choices[0].f();var n=k.story.length;k.alive=false;S.turn+=12;xieBetrothalTick(p);assert.equal(k.story.length,n);assert.equal(p.betrothal,undefined);assert.equal(p.xiean.engagement,undefined);assert.ok(!p.married&&!p.xiean.marriage&&!p.xiean.widowed);assert.ok(p.xiean.lifelongSingle);`);});
test('underage engagement result survives replay with neither party mislabeled married',()=>{let b=w();b.run(`k.born=S.turn-12*12;PalaceActions.reset();A.xieMarriage(k.id);choose(0);save('auto');`);b=boot(90,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(xieAn().betrothal);assert.ok(!xieAn().married);drain();`);});
test('many princesses may admire, but only the boldest starts one durable pursuit',()=>{const b=w('内敛');b.run(`var brave=makeKid(a,'f','明昭');brave.pendingName=false;brave.born=S.turn-18*12;brave.hp=90;brave.temperament='爽直';brave.xieAdmiration={personId:p.id,outcome:'admired'};assert.ok(xieAdmirerReady(k)&&xieAdmirerReady(brave));assert.equal(xieMarriageRefusal(k,p),null);var ev=xieMarriageRefusal(brave,p);assert.ok(ev);assert.equal(p.xiean.pursuerId,brave.id);ev.choices[2].f();brave.betrothal={name:'别人'};assert.equal(xieMarriageRefusal(k,p),null);assert.equal(p.xiean.pursuerId,brave.id);assert.ok(xieAdmirerReady(k));`);});
test('secondary admirers can talk about poetry but cannot request duplicate marriage',()=>{const b=declined();b.run(`var other=makeKid(a,'f','清和');other.pendingName=false;other.born=S.turn-18*12;other.hp=90;other.temperament='爽直';S.royalHeart={gen:S.gen,pending:{kind:'xiean',child:other.id,stage:'young'}};assert.ok(xieAdmirerReady(other));var ev=xieAdmirationEvent(other,heartState().pending);assert.ok(ev);assert.ok(!ev.choices.some(c=>c.t.includes('是否愿意议婚')));ev.choices[0].f();assert.equal(other.xieAdmiration.outcome,'admired');assert.equal(p.xiean.pursuerId,k.id);assert.equal(xieMarriageReady(other),false);`);});
test('quiet route becomes a real lifelong bachelor after eighteen months, with continuing poetry',()=>{const b=declined(true);b.run(`assert.equal(path.kind,'solitude');S.turn+=17;xiePathTick(p);assert.ok(!p.xiean.lifelongSingle);S.turn++;xiePathTick(p);assert.equal(path.kind,'free');assert.equal(p.xiean.lifelongSingle,true);assert.equal(xieMarriageReady(k),false);assert.ok(!p.married);S.turn+=6;`);b.force(0);b.run(`xieLifeTick();assert.ok(p.story.some(s=>s.t.includes('终身不娶')));assert.ok(p.story.some(s=>s.t.includes('独自乘舟')));assert.ok(!xieBridgeReady());`);});
test('player can redirect the initial solitary inclination through an actual poetry invitation',()=>{const b=declined(true);b.run(`S.turn++;A.xieBridge('meet');choose(0);drain();assert.equal(path.kind,'return');assert.equal(path.pending,'meeting');assert.ok(k.story.some(s=>s.t.includes('留一席相逢')));assert.ok(p.story.some(s=>s.t.includes('留一席相逢')));assert.equal(xieBridgeReady(),false);xiePathEvent().choices[0].f();assert.equal(path.stage,1);assert.ok(!p.married&&!k.married);`);});
test('encouragement helps her express herself, with cost, cooldown and no immediate proposal',()=>{const b=declined();b.run(`S.turn++;var energy=E().energy;A.xieBridge('courage');choose(0);drain();assert.equal(E().energy,energy-1);assert.equal(path.pending,'meeting');assert.ok(k.story.some(s=>s.t.includes('亲笔寄心')));assert.ok(p.story.some(s=>s.t.includes('认真回信')));assert.ok(!k.betrothal&&!k.married);xiePathEvent().choices[0].f();assert.equal(xieBridgeReady(),false);S.turn+=3;assert.ok(xieBridgeReady());`);});
test('respecting solitude closes pursuit explicitly without cancelling his public life',()=>{const b=declined();b.run(`S.turn++;A.xieBridge('leave');choose(0);drain();assert.equal(path.kind,'free');assert.ok(p.xiean.lifelongSingle);assert.equal(xiePathEvent(),null);assert.ok(xiePresent(p));assert.ok(xieAudienceEvent(p,false));assert.ok(k.story.some(s=>s.t.includes('彼此珍重')));`);});
for(const trait of ['灵动','好奇','好胜','爽直','仁厚','审慎','内敛','自矜'])test('a voluntary proposal grows from knowing '+trait,()=>{const b=declined(false,trait);nextStage(b);b.run(`assert.equal(path.pending,'meeting');xiePathEvent().choices[0].f();assert.equal(path.stage,1);`);nextStage(b);b.run(`assert.equal(path.pending,'knowing');xiePathEvent().choices[0].f();assert.ok(p.story.some(s=>s.t.includes(XIE_KNOWING['${trait}'][1])));assert.equal(path.stage,2);`);nextStage(b);b.run(`assert.equal(path.pending,'proposal');var ev=xiePathEvent();assert.ok(ev.text.includes('后来才明白'));ev.choices[0].f();assert.equal(path.pending,'answer');assert.ok(!p.married&&!k.married);choose(0);drain();assert.ok(k.married&&p.married);assert.equal(k.spouse.personId,p.id);assert.equal(p.xiean.marriage.origin,'proposal');assert.equal(k.xieAdmiration.outcome,'mutual');assert.equal(p.xiean.marriage.joinedAt,S.turn);assert.equal(portraitCell(k.spouse),433);assert.ok(a.story.some(s=>s.t.includes('主动提亲')));assert.ok(p.story.some(s=>s.t.includes('辞婚获准')));assert.ok(k.story.some(s=>s.t.includes('两心相许')));`);});
test('courting the same princess can continue after her twentieth birthday',()=>{const b=declined();b.run(`k.born-=36;assert.equal(kidAge(k),21);S.turn+=3;`);b.force(0);b.run(`xiePathTick(p);assert.equal(path.pending,'meeting');assert.ok(xiePathEvent());`);});
test('a princess may decline his late proposal and her answer stays final',()=>{const b=declined();b.run(`path.stage=2;path.pending='answer';xiePathEvent().choices[1].f();assert.equal(path.kind,'free');assert.ok(!p.married&&!k.married);assert.equal(xiePathEvent(),null);assert.ok(!xieBridgeReady());`);});
for(const change of ['k.betrothal={name:"他人"}','k.married=true','k.spouse={name:"他人"}','k.alive=false','p.married=true','p.betrothal={}','p.alive=false','p.away=true','k.away=true','k.hp=20'])test('pending new pursuit rechecks eligibility: '+change,()=>{const b=declined();b.run(`path.pending='answer';var ev=xiePathEvent(),money=E().treasury,n=k.story.length;${change};assert.equal(ev.choices[0].f(),null);assert.equal(E().treasury,money);assert.equal(k.story.length,n);`);});
test('death closes her route without giving the dead a new memory or assigning another princess',()=>{const b=declined();b.run(`var n=k.story.length;k.alive=false;S.turn++;xiePathTick(p);assert.equal(k.story.length,n);assert.equal(path.kind,'free');assert.equal(p.xiean.pursuerId,k.id);assert.equal(xiePathEvent(),null);`);});
test('temporary absence pauses courtship, not the lifelong vow decision',()=>{const b=declined();b.run(`k.away=true;S.turn+=6;xiePathTick(p);assert.equal(path.kind,'return');assert.equal(path.pending,undefined);assert.ok(!xieBridgeReady());k.away=false;S.turn++;`);b.force(0);b.run(`xiePathTick(p);assert.equal(path.pending,'meeting');`);});
test('duplicate callback cannot marry twice or charge twice',()=>{const b=declined();b.run(`path.pending='answer';var ev=xiePathEvent(),money=E().treasury;ev.choices[0].f();var n=p.story.length;assert.equal(ev.choices[0].f(),null);assert.equal(E().treasury,money-50);assert.equal(p.story.length,n);`);});
test('voluntary marriage begins together and does not inherit forced-marriage separation',()=>{const b=declined();b.run(`path.pending='answer';xiePathEvent().choices[0].f();var m=p.xiean.marriage;assert.equal(m.joinedAt,S.turn);assert.equal(m.separateUntil,null);assert.ok(m.startedWithLove);S.turn+=3;assert.equal(householdCanConceive(k,k.spouse),true);`);b.force(0);b.run(`xieLifeTick();assert.ok(p.story.some(s=>s.t.includes('成婚前已盼')));assert.ok(!p.story.some(s=>s.t.includes('成婚时说过并无此意')));assert.ok(!k.story.some(s=>s.t.includes('分房满一年')));k.alive=false;xieLifeTick();assert.ok(p.xiean.widowed);assert.ok(p.married);`);});
test('romantic late chapters wait for actual affection, mutual love and a full year',()=>{const b=mature();b.run(`assert.ok(xieLateReady());m.affection=50;assert.equal(xieLateReady(),false);m.affection=80;delete m.loveRemembered;assert.equal(xieLateReady(),false);m.loveRemembered=S.turn;S.turn=m.at+11;assert.equal(xieLateReady(),false);`);});
test('childless couples hear no invented baby and follow their own temperament',()=>{for(const trait of ['灵动','内敛']){const b=mature(trait);b.run(`var lines=[];for(var i=0;i<6;i++){lines.push(xieRememberLate(xieCouple()));}assert.ok(lines.some(s=>s.includes('不期而遇的意外')));assert.ok(!lines.some(s=>/一大一小|习作|孩子/.test(s)));assert.ok(lines.some(s=>s.includes('${trait==='灵动'?'大诗人借走':'不必想好说什么'}')));`);}});
for(const age of [0,3,8,16,24])test('a real child gets age-appropriate affection at '+age,()=>{const b=mature();b.run(`var baby={id:'grand-test',name:'谢怀瑾',born:S.turn-${age}*12,mother:k.id,father:p.id,alive:true};k.household.children.push(baby);m.lateNews=1;var text=xieRememberLate(xieCouple());assert.ok(text.includes('谢怀瑾'));assert.ok(text.includes('${age<1?'抱哄':age<6?'攥着':age<13?'习作':'志趣'}'));assert.ok(baby.story[0].t.includes('家中温情'));assert.ok(p.story.at(-1).t.includes(text));assert.ok(k.story.at(-1).t.includes(text));`);});
for(const changed of ['alive:false','away:true','mother:999','father:"someone-else"'])test('family affection excludes absent, deceased or unrelated children: '+changed,()=>{const b=mature();b.run(`k.household.children.push({id:'grand-test',name:'不可出现',born:S.turn-12,mother:k.id,father:p.id,alive:true,${changed}});m.lateNews=1;assert.ok(!xieLateWords(xieCouple())[1].includes('不可出现'));`);});
test('family chat has meaningful action cost and cooldown; reading pages is pure',()=>{const b=mature();b.run(`var saved=JSON.stringify(S);xieRomancePanel();xieLateWords(xieCouple());assert.equal(JSON.stringify(S),saved);var energy=E().energy;A.xieFamilyTalk();choose(0);drain();assert.equal(E().energy,energy-1);assert.ok(p.story.at(-1).t.includes('不期而遇'));A.xieFamilyTalk();assert.equal(modalOpen,false);`);});
test('the homecoming lamp is shown only when family talk reaches the corresponding story',()=>{
 for(const chapter of [0,1]){
  const b=mature();
  b.run(`m.lateNews=${chapter};A.xieFamilyTalk();assert.ok(modalOpen);assert.equal($('#mbox').innerHTML.includes('story-xie-homecoming-lamp.webp'),false);choose(0);save('auto');`);
  const resumed=boot(81,b.storage);
  resumed.ctx.assert=assert;
  resumed.run(`A.load('auto');assert.ok(modalResult);assert.equal($('#mbox').innerHTML.includes('story-xie-homecoming-lamp.webp'),${chapter===1});`);
 }
});
for(const phase of ['meeting','knowing','proposal','answer'])test('new pending '+phase+' scene and result survive a real cold reload',()=>{let b=declined();b.run(`path.pending='${phase}';PalaceActions.reset();A.xieAfterRefusal();save('auto');`);b=boot(81,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);choose(0);save('auto');`);b=boot(87,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();assert.equal(PalaceActions.blocked,false);`);});
for(const mode of ['meet','courage','leave'])test('player intervention '+mode+' survives cold reload',()=>{let b=declined(true);b.run(`S.turn++;PalaceActions.reset();A.xieBridge('${mode}');save('auto');`);b=boot(81,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);choose(0);save('auto');`);b=boot(87,b.storage);b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);drain();`);});
for(const [name,payload] of Object.entries(require('./fixtures/xie-romance-legacy-v21.json')))test('genuine version 21 '+name+' remains exact',()=>{const b=boot(11,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(PalaceActions.contentVersion,21);assert.equal(xieAn().xiean.path,undefined);drain();assert.equal(PalaceActions.blocked,false);`);});
test('an actual old declined save can start the new aftermath after its old scene finishes',()=>{const payload=require('./fixtures/xie-romance-legacy-v21.json').declined,b=boot(11,new Map([['chengongji_v1_auto',JSON.stringify(payload)]]));b.ctx.assert=assert;b.run(`A.load('auto');drain();xieLifeTick();assert.ok(xieAn().xiean.path);assert.ok(xieAn().xiean.pursuerId);`);});
test('general poetry admiration does not fabricate a refusal or a new courtship',()=>{const b=w();b.run(`k.xieAdmiration.outcome='declined';xieLifeTick();assert.equal(p.xiean.path,undefined);assert.equal(p.xiean.pursuerId,undefined);`);});


test('meeting Xie An early leaves time for a daughter born three years later to start the route',()=>{
 const b=w();
 b.run(`
  k.born=S.turn+36;S.turn=k.born+12*12;careerTick();
  assert.equal(kidAge(k),12);assert.equal(p.age,36);
  assert.ok(xieAdmirerReady(k));assert.ok(xieMarriageRefusal(k,p));
  p.age=45;assert.ok(xieAdmirerReady(k));
  p.age=46;assert.equal(xieAdmirerReady(k),false);
 `);
});

test('opening her capital estate preserves a pending meeting, including after a cold reload',()=>{
 let b=declined();
 b.run(`
  path.pending='meeting';PalaceActions.reset();pushEv(princessOpening(k));choose(0);drain();
  assert.ok(k.estate);assert.ok(!childInPalace(k));assert.ok(xiePathAvailable(p,k));
  assert.match(xieRomancePanel(p),/赴诗会，重新相识/);
  A.xieAfterRefusal();choose(2);assert.match(modalResult.text,/档案继续/);
  save('auto');
 `);
 b=boot(100,b.storage);b.ctx.assert=assert;
 b.run(`
  A.load('auto');assert.equal(PalaceActions.blocked,false);nextEv();
  var p=xieAn(),k=xiePathTarget(p);assert.ok(k.estate);
  A.xieAfterRefusal();choose(0);drain();assert.equal(p.xiean.path.stage,1);
  p.xiean.path.pending='knowing';k.away=true;
  assert.equal(xiePathEvent(),null);assert.match(xieRomancePanel(p),/不便相见/);
  k.away=false;assert.equal(xiePathEvent().title,'渐识卿心');
 `);
});

test('a betrothed princess in a capital estate can marry once they can meet',()=>{
 const b=w();
 b.run(`
  k.born=S.turn-14*12;xieMarriageRefusal(k,p).choices[0].f();
  S.turn+=12;princessOpening(k).choices[0].f();
  assert.ok(k.estate&&!k.married);xieBetrothalTick(p);
  assert.ok(k.married&&p.married);assert.equal(k.betrothal,undefined);
 `);
});

test('a princess can discover Xie An from her estate without admitting unrelated hopes there',()=>{
 const b=w();b.force(0,0,0);
 b.run(`
  delete k.xieAdmiration;princessOpening(k).choices[0].f();
  assert.equal(heartReady(k),false);
  royalHeartTick();assert.equal(heartState().pending.kind,'xiean');
  assert.ok(heartPendingValid());assert.match(heartEvent(k).text,/谢安的诗/);
 `);
});

test('the letter is playable separately from the invitation and preserves her final choice',()=>{
 const b=declined();
 b.run(`
  S.turn++;A.xieBridge('courage');choose(0);drain();
  assert.match(xieRomancePanel(p),/读谢安的回笺/);
  A.xieAfterRefusal();assert.equal(curEv.title,'一页回笺');choose(0);
  assert.match(modalResult.text,/诗里没有的事/);drain();
  assert.equal(path.stage,1);assert.equal(path.meetingSource,undefined);
  path.pending='answer';A.xieAfterRefusal();choose(1);
  assert.match(modalResult.text,/当年盼你点头是真的/);
  assert.match(modalResult.text,/谢殿下相告/);assert.equal(path.kind,'free');
 `);
});

test('the list and profile distinguish voluntary marriage from falling in love after an imperial betrothal',()=>{
 const b=declined();
 b.run(`
  path.pending='answer';xiePathEvent().choices[0].f();UI.sel=p.id;
  assert.match(viewScholar(),/疏朗自持 · 两心相许/);
  assert.match(officialsTable(),/21岁 · 两心相许/);
  assert.doesNotMatch(officialsTable(),/曾奉旨尚主/);
 `);
 const forced=w();
 forced.run(`
  k.born=S.turn-14*12;xieMarriageRefusal(k,p).choices[0].f();
  p.xiean.engagement.affection=65;S.turn+=12;xieBetrothalTick(p);UI.sel=p.id;
  assert.match(viewScholar(),/奉旨尚主 · 婚前已相知/);
  assert.match(officialsTable(),/奉旨尚主 · 婚前已相知/);
 `);
});

test('the audience and its result keep the same large portrait and updated register',()=>{
 const b=w();
 b.run(`
  A.xieAudience();assert.match(curEv.text,/谢安愧不敢当/);
  assert.match($('#mbox').innerHTML,/event-portrait-featured[^]*data-portrait-cell="433"[^]*width="210"/);
  choose(1);assert.match(modalResult.text,/谢安写得几首诗/);
  assert.doesNotMatch(modalResult.text,/草民/);
  assert.match($('#mbox').innerHTML,/event-portrait-featured[^]*data-portrait-cell="433"[^]*width="210"/);
 `);
});

test('the next chronicle gives the couple one private step between knowing and the proposal',()=>{
 const b=declined(false,'内敛');
 b.run(`
  path.stage=2;k.estate={pursuit:'books'};S.turn++;xiePathTick(p);xiePathTick(p);
  assert.equal(path.pending,undefined);
  assert.equal(p.story.filter(s=>s.t.includes('【一页留白】')).length,1);
  assert.equal(k.story.filter(s=>s.t.includes('【一页留白】')).length,1);
  assert.match(p.story.at(-1).t,/有人肯接下去/);
  assert.match(k.story.at(-1).t,/没催我交卷/);
 `);
 nextStage(b);
 b.run(`
  const ev=xiePathEvent();
  assert.equal(ev.title,'谢安主动提亲');
  assert.match(ev.text,/从前辞婚，谢安确无此意/);
  assert.doesNotMatch(ev.text,/草民|容我/);
  assert.equal(k.story.filter(s=>s.t.includes('【一页留白】')).length,1);
 `);
});

test('betrothal rotates new scenes without creating a household or altering affection per scene',()=>{
 const b=w();
 b.run(`k.born=S.turn-12*12;xieMarriageRefusal(k,p).choices[0].f();`);
 for(let month=0;month<4;month++){
  b.force(0);
  b.run(`S.turn+=6;xieBetrothalTick(p);`);
 }
 b.run(`
  assert.equal(p.xiean.engagement.affection,18+4*12);
  assert.ok(!k.spouse&&!k.household);
  for(const [title] of XIE_BETROTHAL_CHRONICLES){
   assert.ok(p.story.some(e=>e.t.includes(title)));
   assert.ok(k.story.some(e=>e.t.includes(title)));
  }
 `);
});

test('a marriage diary uses the new temperament row even while separated and later expands family conversations',()=>{
 for(const [trait,title] of [['灵动','城南问路'],['审慎','请帖上的空白'],['自矜','借卷有约']]){
  const b=w(trait);b.force(0,0);
  b.run(`
   xieMarriageRefusal(k,p).choices[0].f();var m=p.xiean.marriage;
   S.turn+=3;xieLifeTick();assert.equal(m.news,1);
   S.turn+=3;xieLifeTick();assert.equal(m.news,2);
   assert.equal(m.joinedAt,null);assert.ok(p.story.at(-1).t.includes('${title}'));assert.ok(k.story.at(-1).t.includes('${title}'));
  `);
 }
 const b=mature();
 b.run(`
  m.lateNews=3;A.xieFamilyTalk();choose(0);
  assert.match(modalResult.text,/把饭吃热/);
  assert.ok(p.story.some(e=>e.t.includes('【饭凉以前】')));
  assert.ok(k.story.some(e=>e.t.includes('【饭凉以前】')));
 `);
});

test('the first two marriage chronicles arrive by month eight despite missed rolls',()=>{
 const b=w('审慎');b.force(.99,.99,.99,.99);
 b.run(`
  xieMarriageRefusal(k,p).choices[0].f();var m=p.xiean.marriage;
  for(var month=1;month<=8;month++){S.turn++;xieLifeTick();assert.equal(m.news,Math.floor(month/4));}
  assert.ok(k.story.at(-1).t.includes('【请帖上的空白】'));
  assert.ok(p.story.at(-1).t.includes('【请帖上的空白】'));
  assert.equal(m.joinedAt,null);
 `);
});

test('the early marriage deadline waits for both to be available',()=>{
 const b=w('审慎');b.force(.99,.99);
 b.run(`
  xieMarriageRefusal(k,p).choices[0].f();var m=p.xiean.marriage;
  S.turn+=4;k.away=true;xieLifeTick();assert.equal(m.news,0);
  k.away=false;S.turn++;xieLifeTick();assert.equal(m.news,1);
  S.turn+=4;p.away=true;xieLifeTick();assert.equal(m.news,1);
  p.away=false;S.turn++;xieLifeTick();assert.equal(m.news,2);
  assert.equal(m.joinedAt,null);
 `);
});

test('upgrading a marriage keeps prior entries and carries the swapped order across reload',()=>{
 for(const previousCount of [1,2]){
  let b=w('审慎');
  b.run(`
   xieMarriageRefusal(k,p).choices[0].f();var m=p.xiean.marriage;
   var old=XIE_COUPLE_WORDS.gentle;
   for(var [title,previousText,his,hers] of old.slice(0,${previousCount})){
    S.turn+=3;m.last=S.turn;m.news++;xieCoupleRecord(p,k,title,previousText,his,hers);
   }
   save('auto');
  `);
  b=boot(31,b.storage);b.ctx.assert=assert;b.force(previousCount===1?.99:0);
  b.run(`
   A.load('auto');assert.equal(PalaceActions.blocked,false);
   var {p,k,m}=xieCouple();S.turn+=4;xieLifeTick();
   assert.ok(k.story.at(-1).t.includes('【请帖上的空白】'));save('auto');
  `);
  b=boot(32,b.storage);b.ctx.assert=assert;b.force(0);
  b.run(`
   A.load('auto');assert.equal(PalaceActions.blocked,false);
   var {p,k,m}=xieCouple();S.turn+=3;xieLifeTick();
   assert.ok(k.story.at(-1).t.includes(${JSON.stringify(previousCount===1?'【回信中的名字】':'【账簿上一行字】')}));
   for(const person of [p,k]){
    assert.equal(person.story.filter(s=>s.t.includes('【请帖上的空白】')).length,1);
    assert.equal(person.story.filter(s=>s.t.includes('【回信中的名字】')).length,1);
   }
  `);
 }
});

test('after parting each goes on with a life of their own and the princess remembers it once',()=>{
 const b=declined(false,'审慎');
 b.run(`
  path.pending='answer';xiePathEvent().choices[1].f();
  k.estate={pursuit:'books'};k.away=true;S.turn+=6;xiePathTick(p);
  assert.ok(!path.partingRemembered);
  k.away=false;xiePathTick(p);S.turn++;xiePathTick(p);
  assert.equal(k.story.filter(e=>e.t.includes('【又添一席】')).length,1);
  assert.ok(!p.story.some(e=>e.t.includes('【又添一席】')));
  p.xiean.newsIndex=XIE_FREE_WORDS.length;S.turn+=6;
 `);
 b.force(0);
 b.run(`xieLifeTick();assert.match(p.story.at(-1).t,/城南书肆要替他印集/);assert.equal(xieMarriageReady(k),false);`);
});

test('an open capital estate supports each interactive stage through the scene queue and replay',()=>{
 let b=declined();
 b.run(`
  princessOpening(k).choices[0].f();S.turn++;PalaceActions.reset();
  assert.ok(k.estate&&!childInPalace(k));
  A.xieBridge('courage');assert.equal(curEv.title,'鼓励她说出心意');choose(0);drain();
  A.xieAfterRefusal();assert.equal(curEv.title,'一页回笺');choose(0);drain();
  path.pending='knowing';PalaceActions.reset();
  A.xieAfterRefusal();assert.equal(curEv.title,'渐识卿心');choose(0);drain();
  path.pending='proposal';PalaceActions.reset();A.xieAfterRefusal();choose(0);
  assert.equal(curEv.title,'迟来的心意 · 公主的答复');save('auto');
 `);
 b=boot(100,b.storage);b.ctx.assert=assert;
 b.run(`
  A.load('auto');assert.equal(PalaceActions.blocked,false);
  assert.equal(curEv.title,'迟来的心意 · 公主的答复');
  choose(0);drain();assert.ok(xieCouple().k.estate&&xieCouple().k.married);
 `);
});

test('estate visits cover late family talk without opening scenes for people away from the capital',()=>{
 const b=mature();
 b.run(`
  princessOpening(k).choices[0].f();PalaceActions.reset();
  assert.ok(k.estate&&!childInPalace(k));k.away=true;
  A.xieFamilyTalk();assert.equal(modalOpen,false);k.away=false;
  A.xieFamilyTalk();assert.match(curEv.title,/归处有灯/);choose(0);drain();
  assert.ok(p.story.some(e=>e.t.includes('【不期而遇的归处】')));
 `);
});
