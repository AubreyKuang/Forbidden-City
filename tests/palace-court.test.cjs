const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const {runGameScripts}=require('./game-scripts.cjs');

// Same harness as palace-flow: run the whole game script with drawing and storage stubbed.
function boot(seedValue=4242){
  const noop=()=>{};
  const canvas=new Proxy({measureText:()=>({width:100}),getImageData:()=>({data:[]}),createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})},{get:(o,k)=>o[k]||noop});
  const el=()=>({hidden:false,innerHTML:'',value:'',style:{},getContext:()=>canvas,toDataURL:()=>'',setAttribute:noop,addEventListener:noop,appendChild:noop,scrollIntoView:noop,remove:noop});
  const elements=new Map(),storage=new Map();
  const document={querySelector:key=>{if(!elements.has(key))elements.set(key,el());return elements.get(key)},createElement:el,addEventListener:noop};
  const math=Object.create(Math);let seed=seedValue;
  math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,run:code=>vm.runInContext(code,ctx)};
}

test('every consort gets a named father and brother whose office decides her stance, and they persist',()=>{
  const {run}=boot();
  const info=JSON.parse(run(`JSON.stringify(harem().map(c=>({sur:c.sur,office:c.fam.t,house:houseOf(c),stance:stanceOf(c),p:c.fam.p})))`));
  assert.ok(info.length>0);
  for(const c of info){
    assert.ok(c.house.father.name.startsWith(c.sur));
    assert.ok(c.house.brother.name.startsWith(c.sur));
    assert.equal(c.house.father.office,c.office);
    const expected={'内阁首辅':'civil','镇国大将军':'army','皇商':'kin','太医院院判':'dowager'}[c.office];
    if(expected)assert.equal(c.stance,expected);
  }
  const before=run(`JSON.stringify(houseOf(harem()[0]))`);
  run(`save('1');load('1');migrate();`);
  assert.equal(run(`JSON.stringify(houseOf(harem()[0]))`),before);
  assert.match(run(`houseLine(harem()[0])`),/父亲：.*兄长：.*立场：/);
});

test('faction events name the real father or brother and their choices move the court and the consort',()=>{
  const {run}=boot(7);
  run(`const c=harem()[0];c.fam={t:'镇国大将军',p:70};delete c.house;c.favor=60;c.mood=50;S.courtPolicy={};`);
  let ev=null;
  for(let i=0;i<40&&!ev;i++){const e=run(`(()=>{const e=factionEvent();return e&&['边关捷报','边关失利'].includes(e.title)?e:null})()`);if(e)ev=e;}
  assert.ok(ev,'an army event for the general\'s daughter');
  const brother=run(`houseOf(harem()[0]).brother.name`);
  assert.ok(ev.text.includes(brother));
  const army=run(`S.courtPolicy.army||0`),mood=run(`harem()[0].mood`);
  ev.choices[0].f();
  assert.notEqual(run(`S.courtPolicy.army||0`),army);
  assert.notEqual(run(`harem()[0].mood`),mood);
});

test('adopting one bloc pleases consorts of that stance and stings its rival bloc',()=>{
  const {run}=boot(11);
  run(`const [a,b]=harem();a.fam={t:'内阁首辅',p:60};b.fam={t:'皇商',p:40};delete a.house;delete b.house;a.mood=b.mood=50;`);
  run(`courtEcho('civil')`);
  assert.equal(run(`harem()[0].mood`),54);
  assert.equal(run(`harem()[1].mood`),47);
});

test('the relationship graph shows fathers, consorts and close or hostile ties',()=>{
  const {run}=boot(13);
  run(`const [a,b]=harem();relAdd(a,b,-60);`);
  const svg=run(`familyGraphSVG()`);
  const father=run(`houseOf(harem()[0]).father.name.slice(0,4)`);
  assert.match(svg,/<svg class="family-graph"/);
  assert.ok(svg.includes(father));
  assert.match(svg,/stroke="#b8473c"/);
  assert.match(svg,/A\.go\('consort'/);
  assert.match(svg,/graph-kin-person[\s\S]*data-portrait-cell="4[0-3]"/);
  assert.match(svg,/graph-consort[\s\S]*data-portrait-cell=/);
  run(`A.go('family')`);
  assert.match(run(`$('#panel').innerHTML`),/关系图/);
});

test('Duanwu assignments survive a reload, credit the helper and open a prepaid banquet once',()=>{
  const {run}=boot(888);
  run(`
    const [tables,gifts]=harem();
    const helper=makeGirl({trait:'温婉'});
    addConsort(helper,2,'选秀入宫');
    tables.trait='持重'; gifts.trait='巧手';
    relAdd(gifts,helper,40);
    S.month=4;
    const before=E().treasury;
    A.openDuanwuGarden();
    assert.match($('#panel').innerHTML,/分派端午宫务/);
    A.assignDuanwu();
    assert.equal(($('#mbox').innerHTML.match(/event-person-choice/g)||[]).length,3);
    choose(0);
    assert.equal(($('#mbox').innerHTML.match(/event-person-choice/g)||[]).length,2);
    choose(0); drain();
    assert.equal(E().treasury,before-20);
    assert.equal(duanwuWork().stage,'preparing');
    assert.equal(duanwuWork().tables,tables.id);
    assert.equal(duanwuWork().gifts,gifts.id);
    assert.ok(save('1')); assert.ok(load('1')); migrate();
    S.month=5; S.turn++; palaceDutiesTick();
    assert.equal(duanwuWork().helper,helper.id);
    assert.equal(duanwuWork().issue,'漏记帮手');
    A.reviewDuanwu();
    assert.equal(($('#mbox').innerHTML.match(/<figure>/g)||[]).length,3);
    assert.match(curEv.text,/先列清了宴席.*开支/);
    assert.match(curEv.text,/节礼的花样/);
    choose(0);
    assert.equal(($('#mbox').innerHTML.match(/<figure>/g)||[]).length,3);
    drain();
    assert.equal(duanwuWork().stage,'finished');
    assert.ok(NPCMemory.recall(S,helper.id).some(entry=>entry.type==='duanwu_help'&&entry.interpretation.includes('我的名字')));
    assert.equal(banquetKind('duanwu').ready,true);
    A.openBanquet('duanwu'); A.holdBanquet(); choose(0); drain();
    assert.equal(duanwuWork().held,true);
    assert.equal(E().treasury,before-20);
    assert.equal(banquetKind('duanwu').ready,false);
    assert.ok(load('auto')); migrate();
    assert.equal(banquetKind('duanwu').ready,false);
  `);
});

test('a two-consort ruling shows both portraits and the matching choice throughout the event',()=>{
  const {run}=boot(919);
  run(`
    const [,a]=harem();
    const b=makeGirl({trait:'好学'});
    addConsort(b,2,'选秀入宫');
    S.consorts=S.consorts.filter(c=>c===empress()||c===a||c===b);
    const event=HAREM.find(make=>make.name==='quarrel')();
    assert.equal(event.cast.length,2);
    pushEv({...event,por:event.cast[0]});
    const markup=$('#mbox').innerHTML;
    assert.equal((markup.match(/<figure>/g)||[]).length,2);
    assert.doesNotMatch(markup,/class="mpor"/);
    assert.equal((markup.match(/event-person-choice/g)||[]).length,2);
    assert.equal(event.choices[1].person,event.cast[1]);
    const selected=event.choices[1].person, mood=selected.mood;
    choose(1);
    assert.ok(selected.mood>mood);
    assert.equal(($('#mbox').innerHTML.match(/<figure>/g)||[]).length,2);
    drain();
  `);
});

test('private support and public testimony produce different memories, and events have a cooldown',()=>{
  const {run}=boot(98);
  run(`
    const [friend,subject]=harem();
    Object.assign(friend,{trait:'持重',favor:58});
    Object.assign(subject,{favor:15,xin:{k:'委屈',t:S.turn,why:'被冷落'}});
    relAdd(subject,friend,45);
    const before=relGet(subject,friend);
    const event=courtFriendshipEvent();
    assert.match(event.text,/却沉默了/);
    pushEv(event); choose(1); drain();
    assert.ok(relGet(subject,friend)<before);
    const first=NPCMemory.recall(S,subject.id).find(m=>m.type==='palace_support');
    const second=NPCMemory.recall(S,friend.id).find(m=>m.type==='palace_support');
    assert.notEqual(first.interpretation,second.interpretation);
    assert.equal(first.sources[0],second.sources[0]);
    assert.equal(courtFriendshipEvent(),null);
  `);
});

test('seasonal activities require the matching personality and mood and appear in the actual palace',()=>{
  const {run}=boot(316);
  run(`
    const c=harem()[1], autumn=PALACE_INITIATIVES.autumnLamp;
    Object.assign(c,{trait:'沉静',t2:'念旧',xin:{k:'思念',t:S.turn,why:'思亲'}});
    S.month=3;
    assert.equal(autumn.match(c),false);
    assert.equal(PALACE_INITIATIVES.springPetals.match(c),true);
    S.month=9;
    assert.equal(autumn.match(c),true);
    c.xin.k='平和';
    assert.equal(autumn.match(c),false);
    c.xin.k='思念';
    const palace=c.palace;
    c.initiative={id:'autumnLamp',turn:S.turn,place:'p'+palace,text:autumn.text(c)};
    assert.match(initiativeNotices(),/秋夜听雨/);
    assert.ok(initiativeMapScenes().some(scene=>scene.person===c));
    A.seeInitiative(c.id,false);
    assert.equal(UI.sel,palace);
    assert.match($('#panel').innerHTML,/秋夜听雨/);
    const energy=E().energy;
    A.answerInitiative(c.id,false);
    assert.equal(E().energy,energy-1);
    assert.match($('#panel').innerHTML,/你已回应/);
  `);
});

test('shared hobbies outweigh a matching trait, and compatible visits persist across saves',()=>{
  const {run}=boot(413);
  run(`
    const [reader,otherQuiet]=harem();
    const learner=makeGirl({trait:'好学'});
    addConsort(learner,2,'选秀入宫');
    S.consorts=[reader,otherQuiet,learner];
    Object.assign(reader,{trait:'沉静',hobby:'读书',t2:'好读史',like:'诗书',hate:'绸缎'});
    Object.assign(otherQuiet,{trait:'沉静',hobby:'投壶',t2:'好胜',like:'弓马',hate:'点心'});
    Object.assign(learner,{hobby:'读书',t2:'念旧',like:'字画',hate:'花草'});
    const quieterPastimes=new Set(Array.from({length:24},(_,index)=>
      consortHobby({trait:'沉静',t2:'好读史',like:'诗书',seed:index+1})));
    assert.ok(quieterPastimes.size>=3,'the same personality can yield different hobbies');
    S.rel={};
    assert.ok(consortCompatibility(reader,learner)>consortCompatibility(reader,otherQuiet));
    relAdd(reader,otherQuiet,-40);
    relAdd(learner,otherQuiet,-40);
    relTick();
    for(let attempt=0;!reader.lastSocial&&attempt<30;attempt++)consortSocialTick();
    assert.ok(reader.lastSocial,'the eligible pair met');
    assert.equal(reader.lastSocial.other,learner.id);
    assert.equal(learner.lastSocial.other,reader.id);
    assert.equal(otherQuiet.lastSocial,undefined);
    assert.ok(relGet(reader,learner)>0);
    const firstMemory=NPCMemory.recall(S,reader.id).find(entry=>entry.type==='consort_social');
    const secondMemory=NPCMemory.recall(S,learner.id).find(entry=>entry.type==='consort_social');
    assert.equal(firstMemory.sources[0],secondMemory.sources[0]);
    assert.notEqual(firstMemory.interpretation,secondMemory.interpretation);
    const score=relGet(reader,learner);
    consortSocialTick();
    assert.equal(relGet(reader,learner),score);
    delete otherQuiet.hobby;
    const legacyHobby=consortHobby(otherQuiet);
    assert.ok(save('1'));
    assert.ok(load('1'));
    migrate();
    assert.equal(byId(reader.id).hobby,'读书');
    assert.equal(byId(otherQuiet.id).hobby,legacyHobby);
    assert.equal(relGet(byId(reader.id),byId(learner.id)),score);
    assert.match(relLine(byId(reader.id)),/文渊阁.*旧抄本/);
    assert.match(deepLine(byId(reader.id)),/平日消遣.*读书/);
    assert.equal(PALACE_INITIATIVES.compareCopies.target(byId(learner.id)).id,reader.id);
  `);
});

test('ten princes and ten princesses keep distinct faces as they age and after loading',()=>{
  const {run}=boot(15);
  const cells=JSON.parse(run(`JSON.stringify((()=>{
    const [mother,other]=harem();
    const sons=Array.from({length:10},(_,i)=>makeKid(mother,'m','皇子'+i));
    const daughters=Array.from({length:10},(_,i)=>makeKid(mother,'f','公主'+i));
    const children=[...sons,...daughters];
    sons[0].foster=other.id;
    delete sons[7].ord;
    delete daughters[8].ord;
    const stages=[0,8,18].map(age=>{
      children.forEach(k=>{k.born=S.turn-age*12});
      return children.map(portraitCell);
    });
    S.heir=sons[0].id;
    mother.alive=false;
    const graph=familyGraphSVG();
    assert.match(graph,/皇子0/);
    assert.match(graph,/抚养/);
    save('1');load('1');migrate();
    return {stages,loaded:S.children.map(portraitCell)};
  })())`));
  assert.equal(new Set(cells.stages.flat()).size,60);
  assert.deepEqual(cells.stages.map(stage=>stage.slice(0,4)),[[28,29,30,31],[32,33,34,35],[36,37,38,39]]);
  assert.deepEqual(cells.loaded,cells.stages[2]);
});

test('version 1 saves load, rewinding restores a new-year snapshot, and absence piles up memorials',()=>{
  const {run,storage}=boot(17);
  run(`save('2')`);
  const key=run(`SKEY+'2'`),old=JSON.parse(storage.get(key));
  old.saveVersion=1;delete old.savedAt;for(const c of old.consorts)delete c.house;
  storage.set(key,JSON.stringify(old));
  assert.equal(run(`load('2')`),true);
  run(`migrate()`);
  assert.ok(run(`!!houseOf(harem()[0]).father.name`));
  storage.set(key,JSON.stringify({...old,saveVersion:9}));
  assert.equal(run(`load('2')`),false);
  run(`snapshotYear()`);
  const turn=run(`S.turn`);
  run(`for(let i=0;i<3;i++){A.endMonth();drain();}`);
  assert.ok(run(`S.turn`)>turn);
  run(`A.rewind(SaveManager.snapshots(localStorage,SKEY+'auto').at(-1).index)`);
  assert.equal(run(`S.turn`),turn);
  run(`S.savedAt=Date.now()-5*36e5;offlineMemorials()`);
  assert.equal(run(`S.flags.memorials`),3);
  run(`A.endMonth();drain();`);
  assert.equal(run(`S.flags.memorials`),0);
});

test('a princess opens her own estate, sends project letters and stays in the family after succession',()=>{
  const {run}=boot();
  run(`
    const mother=harem()[0], p=makeKid(mother,'f','明昭'), h=makeKid(mother,'m','承安');
    p.born=S.turn-16*12;h.born=S.turn-15*12;p.lit=70;p.mar=30;
    assert.equal(milestone().title,'公主开府来信');
    A.openPrincess(p.id);choose(0);drain();
    assert.equal(p.estate.pursuit,'books');assert.equal(p.married,false);assert.equal(childInPalace(p),false);
    const oldTreasury=E().treasury;
    A.princessLetter(p.id);choose(0);drain();
    assert.equal(E().treasury,oldTreasury-20);assert.equal(p.estate.due,S.turn+2);
    A.princessLetter(p.id);assert.equal(modalOpen,false);
    S.turn+=2;A.princessLetter(p.id);choose(0);drain();
    assert.equal(p.estate.stage,'done');assert.equal(p.lit,75);
    const mood=mother.mood;A.princessVisit(p.id);choose(0);drain();assert.ok(mother.mood>mood);
    A.princessVisit(p.id);assert.equal(modalOpen,false);
    succeed(h);choose(0);drain();
    assert.equal(kidById(p.id),undefined);
    assert.equal(estatePrincesses()[0].estate.stage,'done');
    assert.equal(princessKinship(estatePrincesses()[0]),'皇姐');
    save('1');load('1');migrate();
    assert.equal(princessById(p.id).estate.stage,'done');
    assert.ok(NPCMemory.recall(S,p.id).some(m=>m.type==='princess_result'));
  `);
});

test('princess marriage can be postponed and leaves a personal route when agreed',()=>{
  const {run}=boot();
  run(`
    const p=makeKid(harem()[0],'f','宁华');p.born=S.turn-15*12;p.lit=75;
    A.princessMarriage(p.id);choose(3);drain();
    const due=p.marriageAfter;
    A.princessMarriage(p.id);assert.equal(modalOpen,false);
    S.turn=due;A.princessMarriage(p.id);choose(0);
    assert.equal(curEv.title,'灯下谈婚事');choose(0);drain();
    assert.equal(p.princessMarriage,'scholar');assert.equal(p.married,true);
    A.openPrincess(p.id);choose(0);drain();assert.equal(p.estate.route,'scholar');
  `);
});

test('lantern hunt follows three map locations, scores once and survives reload',()=>{
  const {run}=boot();
  run(`
    const [mother]=harem(), a=makeKid(mother,'m','承光'), b=makeKid(mother,'f','明月');
    a.born=b.born=S.turn-8*12;S.month=1;
    const place=id=>arrive(PLACES.find(p=>p.id===id));
    place('yh');const before=relGet(a,b);
    A.startLantern('team');A.guessLantern('wy',0);assert.equal(activeLantern().step,0);
    A.guessLantern('yh',1);assert.equal(lanternStop().place,'wy');
    save('1');load('1');migrate();assert.equal(activeLantern().correct,1);
    place('wy');A.guessLantern('wy',0);
    place('ss');A.guessLantern('ss',2);drain();
    assert.equal(seasonJournal().lanternRecord.score,3);
    assert.equal(relGet(kidById(a.id),kidById(b.id)),before+6);
    A.guessLantern('ss',2);assert.equal(lanternStop(),null);
    S.month=2;S.turn++;assert.equal(activeLantern(),null);
  `);
});

test('flower conditions and the passed inkstone give separate delayed follow-ups',()=>{
  const {run}=boot();
  run(`
    const c=harem()[0];c.like='花草';S.month=2;
    const place=id=>arrive(PLACES.find(p=>p.id===id));
    place('yh');A.plantPalaceFlower('sun');const flower=springFlower();
    A.seePalaceFlower();assert.equal(modalOpen,false);
    S.turn=flower.due;S.month=1;S.year++;A.seePalaceFlower();choose(0);drain();
    assert.equal(flower.plot,'shade');assert.equal(flower.due,S.turn+12);
    S.turn=flower.due;S.year++;A.seePalaceFlower();choose(0);drain();assert.equal(flower.seen,true);
    const a=makeKid(c,'m','承书'),b=makeKid(c,'f','静仪');
    a.born=S.turn-13*12;b.born=S.turn-6*12;
    place('ss');const before=b.lit;A.passPalaceInkstone(b.id);assert.equal(a.passedInkstone,true);
    A.readInkstoneEssay();assert.equal(modalOpen,false);
    S.turn+=3;A.readInkstoneEssay();choose(0);drain();
    assert.equal(seasonJournal().inkstone,undefined);assert.equal(b.lit,before+4);
    assert.equal(inkstonePair(),null);
  `);
});
