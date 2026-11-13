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
  const math=Object.create(Math);let seed=seedValue;const rolls=[];
  math.random=()=>rolls.length?rolls.shift():((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,force:(...values)=>rolls.push(...values),run:code=>vm.runInContext(code,ctx)};
}

test('scene activity cards show both saved portraits and omit unavailable participants',()=>{
  const {run}=boot();
  run(`var mother=harem()[0]; var child={id:9999,name:'景明',sex:'m',born:S.turn-96,alive:true,mom:mother.id,seed:123,lit:35,vir:40,hp:90};S.children.push(child);
    mother.initiative={id:'duanwu',turn:S.turn,target:child.id,text:'母子一起结百索。'};`);
  // Find the actual historical mother-child activity, without assuming its internal key.
  run(`mother.initiative.id=Object.keys(PALACE_INITIATIVES).find(id=>PALACE_INITIATIVES[id].echo&&!PALACE_INITIATIVES[id].child&&PALACE_INITIATIVES[id].place==='yh');`);
  const html=run(`initiativesAt('yh')`);
  assert.equal((html.match(/class="activity-person"/g)||[]).length,2);
  assert.ok(html.includes(run(`'data-portrait-cell="'+portraitCell(mother)+'"'`)));
  assert.ok(html.includes(run(`'data-portrait-cell="'+portraitCell(child)+'"'`)));
  run(`child.away=true;`);
  assert.equal(run(`initiativesAt('yh')`),'');
  assert.equal(run(`mapActivityLeads().some(l=>l.cast.includes(mother))`),false);
  assert.doesNotThrow(()=>run(`initiativeMapScenes()`));
});

test('palace activities resolve the queen palace to the real map entrance',()=>{
  const {run}=boot();
  run(`var queen=harem().find(c=>c.rank===8);queen.initiative={id:Object.keys(PALACE_INITIATIVES).find(id=>PALACE_INITIATIVES[id].title==='中宫核账'),place:'p坤宁宫',turn:S.turn,text:'皇后正在核账。'};`);
  assert.equal(run(`initiativePlace(PALACE_INITIATIVES[queen.initiative.id],queen,queen.initiative)`),'kn');
  run(`A.visitMapActivity('kn')`);
  assert.equal(run(`UI.view`),'palace');
  assert.match(run(`$('#panel').innerHTML`),/activity-person[\s\S]*中宫核账/);
});

test('family, nested child and location details return to the real source with scroll restored',()=>{
  const {run}=boot();
  run(`A.go('family');var panel=$('#panel');var graph={scrollLeft:164,scrollTop:0};var branches=[{open:true},{open:false}];
    panel.querySelector=()=>graph;panel.querySelectorAll=()=>branches;panel.scrollTop=240;
    A.go('consort',harem()[0].id);`);
  assert.match(run(`personBackButton('harem')`),/返回家族/);
  run(`var kid={id:10000,name:'景明',sex:'m',born:S.turn-90,mom:harem()[0].id,momName:'母妃',seed:1,alive:true,hp:90,lit:30,mar:30,vir:30,story:[]};S.children.push(kid);A.go('kid',kid.id);A.backPerson('kids');`);
  assert.equal(run(`UI.view`),'consort');
  run(`graph.scrollLeft=0;panel.scrollTop=0;branches[0].open=false;A.backPerson('harem')`);
  assert.equal(run(`UI.view`),'family');
  assert.equal(run(`graph.scrollLeft`),164);
  assert.equal(run(`panel.scrollTop`),240);
  assert.equal(run(`branches[0].open`),true);
  run(`A.go('place','yh');A.go('consort',harem()[0].id);A.backPerson('harem')`);
  assert.equal(run(`UI.view`),'place');assert.equal(run(`UI.sel`),'yh');
  run(`A.go('consort',harem()[0].id);S=JSON.parse(JSON.stringify(S));A.backPerson('harem')`);
  assert.equal(run(`UI.view`),'harem');
});

test('sisters share one named father across legacy migration and reload, cousins keep distinct fathers',()=>{
  const {run}=boot();
  run(`var first=harem()[0],sister=makeKin(first,'亲'),cousin=makeKin(first,'堂');addConsort(sister,2,'姐妹入宫');addConsort(cousin,2,'堂妹入宫');
    var originalFather=houseOf(first).father.name;
    delete sister.fatherId;delete sister.house;houseOf(sister);
    assert.equal(houseOf(first),houseOf(sister));assert.notEqual(houseOf(cousin).father,houseOf(first).father);
    var fatherAge=houseOf(first).father.age;S.month=1;houseOf(first).father.age=50;courtTick();assert.equal(houseOf(sister).father.age,51);
    save('1');load('1');migrate();first=byId(first.id);sister=byId(sister.id);cousin=byId(cousin.id);
    assert.equal(houseOf(first),houseOf(sister));assert.equal(houseOf(first).father.name,originalFather);assert.notEqual(houseOf(cousin),houseOf(first));`);
  const graph=run(`familyGraphSVG()`);
  const id=run(`first.fatherId`);
  assert.equal(graph.split(`data-father-id="${id}"`).length-1,1);
  assert.match(graph,/亲姐妹同父/);
  run(`UI.familyMode='list'`);
  assert.match(run(`viewFamily()`),/paternal-branch[\s\S]*亲姐妹同父/);
});

test('the dowager and maternal clan are visible in both tree modes without inventing daughter kinship',()=>{
  const {run}=boot();
  run(`var d=ensureDowager(),woman=makeGirl({sur:d.sur,fam:{...d.fam}});woman.clan=d.clan;addConsort(woman,2,'太后荐入');`);
  for(const mode of ['graph','list']){
    run(`UI.familyMode='${mode}'`);
    const html=run(`viewFamily()`);
    assert.match(html,/太后与母家亲族/);assert.match(html,/母子 →/);assert.match(html,/母家同族/);
    assert.ok(html.includes(run(`fullName(woman)`))||html.includes(run(`cName(woman)`)));
    assert.doesNotMatch(html,/太后之女/);
  }
  run(`S.flags.dowager.alive=false`);
  assert.match(run(`dowagerFamilyPanel()`),/已故/);
});

test('map leads point at playable scenes, disappear after response and warn only on invitations',()=>{
  const {run,ctx}=boot();
  run(`var a=harem()[0],b=harem()[1];S.banquetReunion={turn:S.turn,guest:a.id,partner:b.id,activity:'投壶',text:'两位妃嫔在亭中等你。'};`);
  assert.equal(run(`mapActivityLeads()[0].expires`),true);
  run(`A.visitMapActivity(mapActivityLeads()[0].place)`);
  assert.equal(run(`UI.sel`),'yh');
  assert.match(run(`$('#panel').innerHTML`),/去御花园赴约/);
  const turn=run(`S.turn`),energy=run(`E().energy`);
  run(`A.finishMonth();choose(0);`);
  assert.equal(run(`S.turn`),turn);assert.equal(run(`E().energy`),energy);
  let callback;ctx.setTimeout=f=>{callback=f;};
  run(`A.finishMonth();choose(curEv.choices.length-1);`);
  assert.ok(callback);callback();run(`drain()`);
  assert.equal(run(`S.turn`),turn+1);
  assert.equal(run(`mapActivityLeads().some(l=>l.title==='御花园赴约')`),false);
});

test('all music scores play bounded pentatonic notes and preserve independent selection',()=>{
  const {run,storage}=boot();
  run(`AU.selectTrack('silk')`);assert.equal(storage.get('palace-music-track'),'silk');
  run(`AU.selectTrack('missing')`);assert.equal(run(`AU.track`),'silk');
  run(`AU.setMode('garden')`);assert.equal(run(`AU.track`),'silk');
  run(`assert.equal(savedMusicTrack(),'silk');
    for(const id of Object.keys(PALACE_MUSIC)){
      AU.track=id;AU.on=true;AU.step=0;AU.next=0;AU.ctx={currentTime:0};
      var notes=[];AU.pluck=(f,t,v,b,voice)=>notes.push({f,t,v,voice});AU.flute=(f,t,d,v)=>notes.push({f,t,v});
      for(var i=0;i<1000;i++){AU.ctx.currentTime=i*.12;AU.sched();}
      assert.ok(notes.length>30);assert.ok(notes.every(n=>n.f>100&&n.f<3000&&n.v>0&&n.v<=.2&&Number.isFinite(n.t)));
      assert.ok(notes.some(n=>n.voice===PALACE_MUSIC[id].voice));
    }AU.on=false;AU.ctx=null;`);
});

test('switching audio fades the previous music buses and never adds a second scheduler',()=>{
  const {run,ctx}=boot();let timers=0,scheduled=0;
  ctx.setInterval=()=>{timers++;return 123};ctx.clearInterval=()=>{timers--;};ctx.setTimeout=()=>{};
  ctx.document.querySelector('#snd').classList={toggle:()=>{}};
  const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(v){this.target=v;}});
  const gain=()=>({gain:param(),connect(){},disconnect(){}});
  ctx.testAudio={currentTime:1,state:'running',createGain:gain};
  ctx.scheduled=()=>scheduled++;
  run(`AU.ctx=testAudio;AU.bus={};AU.wet={};AU.master=testAudio.createGain();AU.sched=scheduled;AU.toggle();var original=AU.musicDry;AU.selectTrack('silk');assert.notEqual(original,AU.musicDry);assert.equal(original.gain.target,0);AU.selectTrack('pine');`);
  assert.equal(timers,1);assert.equal(scheduled,3);
  run(`AU.toggle()`);assert.equal(timers,0);
  run(`AU.selectTrack('stream')`);assert.equal(timers,0);
});

test('finished Duanwu preparations keep a map entrance until the feast is held',()=>{
  const {run}=boot();
  run(`S.month=5;S.duanwuWork={gen:S.gen,year:S.year,stage:'finished',tables:harem()[0].id,gifts:harem()[1].id,held:false};`);
  assert.match(run(`viewMap()`),/安排端午宴/);
  run(`S.duanwuWork.held=true`);
  assert.doesNotMatch(run(`viewMap()`),/安排端午宴/);
});

test('three synthesized string voices produce finite, decaying and distinct waveforms',()=>{
  const {run,ctx}=boot();
  ctx.sampleContext={sampleRate:24000,createBuffer:(channels,length)=>{
    const data=new Float32Array(length);return {length,getChannelData:()=>data};
  }};
  run(`AU.ctx=sampleContext;var tails=[];
    for(const voice of ['zheng','pipa','qin']){
      var buffer=AU.ksBuf(587.32,voice),samples=buffer.getChannelData(0);
      assert.ok(samples.every(Number.isFinite));assert.ok(samples.some(n=>Math.abs(n)>.1));
      var energy=from=>samples.slice(from,from+2400).reduce((sum,n)=>sum+n*n,0)/2400;
      assert.ok(energy(0)>energy(24000),'the plucked string decays');
      tails.push(energy(24000));assert.equal(AU.ksBuf(587.32,voice),buffer);
    }
    assert.equal(new Set(tails).size,3);AU.ctx=null;`);
});

test('legacy daughters naming the same father become one pedigree branch after JSON reload',()=>{
  const {run}=boot();
  run(`var d=ensureDowager(),a=makeGirl({sur:d.sur,fam:{...d.fam}}),b=makeGirl({sur:d.sur,fam:{...d.fam}});
    a.clan=b.clan=d.clan;addConsort(a,3,'族女入宫');addConsort(b,2,'族女入宫');
    houseOf(a);b.house=JSON.parse(JSON.stringify(a.house));delete a.house.father.id;delete b.house.father.id;
    delete a.fatherId;delete b.fatherId;delete a.kin;delete b.kin;
    S=JSON.parse(JSON.stringify(S));migrate();a=byId(a.id);b=byId(b.id);
    assert.equal(houseOf(a).father,houseOf(b).father);
    var parent=houseOf(a).father.id,graph=familyGraphSVG();
    assert.equal(graph.split('data-person-id="'+parent+'"').length-1,1);
    var edges=graph.split('<g class="paternal-links" data-parent-id="'+parent+'">')[1].split('</g>')[0];
    assert.ok(edges.includes('data-child-id="'+a.id+'"'));assert.ok(edges.includes('data-child-id="'+b.id+'"'));
    save('1');load('1');migrate();assert.equal(houseOf(byId(a.id)).father.id,parent);
    assert.equal(houseOf(byId(a.id)).father,houseOf(byId(b.id)).father);`);
});

test('a shared father identity joins daughters even when their older daughter keys differ',()=>{
  const {run}=boot();
  run(`var a=harem()[0],b=makeKin(a,'亲');addConsort(b,2,'姐妹入宫');houseOf(b);
    var id=houseOf(a).father.id;b.house=JSON.parse(JSON.stringify(b.house));b.fatherId=b.id;
    delete a.kin;delete b.kin;assert.equal(houseOf(b).father,houseOf(a).father);
    assert.equal(familyGraphSVG().split('data-person-id="'+id+'"').length-1,1);`);
});

test('explicit cousins remain separate but connected to one clan even if old generated fathers share a name',()=>{
  const {run}=boot();
  run(`var a=harem()[0],b=makeKin(a,'堂');addConsort(b,2,'堂妹入宫');houseOf(a);
    b.house=JSON.parse(JSON.stringify(a.house));delete a.house.father.id;delete b.house.father.id;
    delete a.fatherId;delete b.fatherId;houseOf(a);houseOf(b);
    assert.notEqual(a.house.father.id,b.house.father.id);assert.notEqual(a.house.father.name,b.house.father.name);
    var graph=familyGraphSVG();assert.equal(graph.split('data-clan="'+clanKey(a)+'"').length-1,1);
    assert.ok(graph.includes('data-person-id="'+a.house.father.id+'"'));
    assert.ok(graph.includes('data-person-id="'+b.house.father.id+'"'));`);
});

test('maternal attributes make a strong ordered difference to newborn traits while siblings vary',()=>{
  const {run}=boot();
  run(`var mother=harem()[0];E().wen=50;var batches=[];
    for(const value of [10,90]){
      mother.talent=mother.virtue=mother.scheme=value;
      batches.push(Array.from({length:30},(_,i)=>makeKid(mother,i%2?'m':'f','测试'+S.nid)));
    }
    for(const stat of ['lit','vir','amb'])assert.ok(Math.max(...batches[0].map(k=>k[stat]))<Math.min(...batches[1].map(k=>k[stat])),stat);
    assert.ok(new Set(batches[1].map(k=>k.lit)).size>1,'siblings have individual variation');
    assert.ok(batches.flat().every(k=>['lit','vir','amb','hp','mar'].every(stat=>k[stat]>=0&&k[stat]<=100)));`);
});

test('birth traits survive fostering, changes to the mother, growth and save reload',()=>{
  const {run}=boot();
  run(`var [mother,foster]=harem();mother.talent=90;var child=makeKid(mother,'m','承安'),id=child.id;
    var birth=JSON.stringify(child.birthTraits),initial=child.lit;
    mother.talent=10;child.foster=foster.id;child.born=S.turn-72;child.policy='读书';
    for(var i=0;i<12;i++)growKid(child);
    assert.ok(child.lit>initial);assert.equal(JSON.stringify(child.birthTraits),birth);
    save('1');load('1');migrate();child=kidById(id);assert.equal(JSON.stringify(child.birthTraits),birth);
    assert.equal(child.birthTraits.mother.id,mother.id);assert.notEqual(child.birthTraits.mother.id,child.foster);
    delete child.birthTraits;var before=child.lit;migrate();assert.equal(child.lit,before);
    assert.equal(childBirthPanel(child),'');`);
});
test('rare biographies are optional and belong to at most one consort per reign',()=>{
  const {run,force}=boot();
  run(`S.consorts=[];S.flags.rareArcOwners={};var makeMaid=()=>makeGirl({trait:'温婉',fam:{t:'宫女',p:0}});var a=makeMaid();`);
  force(.9);run(`assignArc(a);assert.notEqual(a.arc.id,'secret');var b=makeMaid();`);
  force(.01);run(`assignArc(b);S.consorts.push(b);assert.equal(b.arc.id,'secret');assert.ok(b.arc.t-S.turn>=8);
    for(var i=0;i<30;i++){var c=makeMaid();assignArc(c);S.consorts.push(c);}
    assert.equal(S.consorts.filter(c=>c.arc.id==='secret').length,1);
    b.arc.done=true;b.alive=false;save('1');load('1');migrate();var next=makeMaid();assignArc(next);assert.notEqual(next.arc.id,'secret');`);
});

test('old duplicate investigations are removed before starting and ongoing choices survive',()=>{
  const {run}=boot();
  run(`S.flags.rareArcOwners={};var women=Array.from({length:4},()=>makeGirl({fam:{t:'宫女',p:0},trait:'温婉'}));S.consorts=women;
    women.forEach(c=>c.arc=makeArc('secret',0));women[0].arc.st=2;women[0].arc.f.wait=1;women[1].arc.st=1;
    story(women[2],'旧时记录仍在。');save('1');load('1');migrate();
    assert.equal(S.consorts[0].arc.st,2);assert.equal(S.consorts[0].arc.f.wait,1);assert.equal(S.consorts[1].arc.st,1);
    assert.notEqual(S.consorts[2].arc.id,'secret');assert.notEqual(S.consorts[3].arc.id,'secret');
    assert.ok(S.consorts[2].story.some(x=>x.t==='旧时记录仍在。'));
    var saved=JSON.stringify(S.consorts.map(c=>c.arc));migrate();assert.equal(JSON.stringify(S.consorts.map(c=>c.arc)),saved);`);
});

test('investigations share a cooldown across people and preserve their next stage',()=>{
  const {run}=boot();
  run(`S.turn=30;S.flags.arcPacing={byType:{}};var [a,b]=harem();a.aff=b.aff=80;
    a.arc=makeArc('secret',0);b.arc=makeArc('envoy',0);var ev=arcTick();assert.ok(ev);assert.equal(S.flags.arcPacing.last,undefined);
    pushEv(ev);choose(0);drain();assert.equal(a.arc.st,1);
    S.turn++;assert.equal(arcTick(),null);S.turn+=2;assert.equal(arcTick(),null);
    S.turn++;var next=arcTick();assert.ok(next);pushEv(next);drain();
    save('1');load('1');migrate();assert.equal(arcTick(),null);`);
});

test('new clothes honor preferences and a shared annual cooldown without consuming discarded candidates',()=>{
  const {run}=boot();
  run(`var [a,b]=harem();for(const c of [a,b]){c.aff=70;c.like='绸缎';c.trait='温婉';c.xin={k:'欢喜',t:0};delete c.xcd;}
    var event=xinEvent();assert.equal(event.title,'新衣');assert.equal(S.flags.xinPacing.last,undefined);
    assert.ok(xinEvent());pushEv(event);drain();S.turn+=11;assert.equal(xinEvent(),null);
    save('1');load('1');migrate();S.turn++;var second=xinEvent();assert.equal(second.title,'新衣');pushEv(second);drain();
    S.turn+=24;assert.equal(xinEvent(),null,'one event per uninterrupted mood episode');
    var c=harem()[0];c.xin={k:'欢喜',t:S.turn};c.like='佛经';assert.equal(XEV['欢喜'](c),null);
    c.like='珠翠';assert.equal(XEV['欢喜'](c).title,'新衣');`);
});

test('mother names are separate accessible controls in the list and detail, with a return route',()=>{
  const {run}=boot();
  run(`var [mother,foster]=harem(),child=makeKid(mother,'m','承玉');child.foster=foster.id;A.go('kids');`);
  let html=run(`viewKids()`);
  assert.match(html,/<article class="card portrait-card child-card">/);
  for(const id of run(`[mother.id,foster.id]`))assert.ok(html.includes(`A.go('consort',${id})`));
  run(`A.go('consort',mother.id);assert.ok(personBackButton('harem').includes('返回皇嗣'));A.backPerson('harem');assert.equal(UI.view,'kids');
    A.go('kid',child.id);A.go('consort',foster.id);A.backPerson('harem');assert.equal(UI.view,'kid');assert.equal(UI.sel,child.id);`);
  html=run(`viewKid()`);assert.ok(html.includes(run(`"A.go('consort',"+mother.id+")"`)));
});

test('birth probabilities include rare multiples and independent sexes without amplifying with family size',()=>{
  const {run}=boot();
  run(`var counts=[0,0,0,0];for(var i=0;i<100000;i++)counts[rollBirthCount(i/100000)]++;
    assert.equal(counts[1],97900);assert.equal(counts[2],2000);assert.equal(counts[3],100);
    assert.equal(birthType(['m','f']),'龙凤胎');assert.equal(birthType(['f','f']),'双胞胎');assert.equal(birthType(['m','m','f']),'三胞胎');`);
});

test('twins are registered together, resume after a partial naming reload and settle only once',()=>{
  const {run,force}=boot();
  run(`var mother=harem()[0];mother.trait='温婉';mother.preg=10;mother.mood=20;mother.aff=20;mother.favor=20;mother.rank=4;mother.swapRisk=false;var before=S.children.length;`);
  force(.01,.1,.9,.01,.1); // twins, boy/girl, omen, red skies
  run(`var ev=birthEvent(mother);mother.delivery.difficult=false;assert.equal(ev.title,'龙凤胎');assert.equal(S.children.length,before+2);
    var kids=deliveryKids(mother),ids=kids.map(k=>k.id);assert.equal(kids[0].birthGroup,kids[1].birthGroup);
    assert.equal(kids[0].born,kids[1].born);assert.ok(kids.every(k=>k.birthOmen==='red'));assert.equal(mother.preg,0);
    pushEv(ev);$('#minput').value='承双';choose(0);assert.equal(kids[0].pendingName,false);assert.equal(kids[1].pendingName,true);
    var motherId=mother.id;save('1');Q.length=0;modalOpen=false;curEv=null;load('1');migrate();mother=byId(motherId);
    var turn=S.turn;A.endMonth();assert.equal(S.turn,turn);assert.equal(curEv.title,'龙凤胎');
    $('#minput').value='明双';choose(0);drain();
    assert.equal(S.children.length,before+2);assert.ok(deliveryKids(mother).every(k=>!k.pendingName));assert.equal(mother.delivery.settled,true);
    assert.equal(mother.aff,30);assert.equal(mother.favor,28);var prestige=E().prestige;finishDelivery(mother);assert.equal(E().prestige,prestige);
    var stats=JSON.stringify(deliveryKids(mother));save('1');load('1');migrate();assert.equal(JSON.stringify(deliveryKids(byId(motherId))),stats);`);
});

test('triplets keep unique IDs and per-sex birth order, with one maternal outcome and three foster offers',()=>{
  const {run,force}=boot();
  run(`var mother=harem()[0];mother.preg=10;mother.swapRisk=false;`);
  force(.0001,.1,.1,.9,.9);
  run(`var ev=birthEvent(mother);mother.delivery.difficult=true;var kids=deliveryKids(mother);assert.equal(kids.length,3);
    assert.equal(new Set(kids.map(k=>k.id)).size,3);assert.equal(kids[1].ord,kids[0].ord+1);
    assert.ok(kids.every(k=>k.birthType==='三胞胎'));assert.ok(kids.every(k=>!k.birthOmen));
    kids.forEach((k,i)=>{k.name='诞'+i;k.pendingName=false});finishDelivery(mother);
    assert.equal(mother.alive,false);assert.equal(Q.filter(e=>e.title==='抚养').length,3);
    assert.equal(mother.story.filter(s=>s.t.includes('撒手人寰')).length,1);
    finishDelivery(mother);assert.equal(Q.filter(e=>e.title==='抚养').length,3);`);
});

test('birth omens apply a bounded one-time bonus, persist and do not rewrite old children',()=>{
  const {run}=boot();
  run(`var child=makeKid(harem()[0],'f','灵昭');child.lit=98;applyBirthOmen(child,'star');assert.equal(child.lit,100);
    applyBirthOmen(child,'star');assert.equal(child.lit,100);assert.equal(child.birthTraits.initial.lit,100);
    assert.match(birthTags(child),/文星流彩/);var id=child.id;save('1');load('1');migrate();assert.equal(kidById(id).birthOmen,'star');
    delete kidById(id).birthOmen;var old=kidById(id).lit;migrate();assert.equal(kidById(id).lit,old);assert.equal(birthTags(kidById(id)),'');`);
});

test('a close child can plead for a foster mother only once per punishment and release does not restore rank',()=>{
  const {run,force}=boot();
  run(`var [bio,mother]=harem(),k=makeKid(bio,'m','承孝');k.foster=mother.id;k.born=S.turn-108;k.fosterT=k.born;k.vir=80;
    mother.cold=true;mother.rank=6;childLifeTick();`);
  force(0);
  run(`var ev=motherAppealEvent();assert.ok(ev);assert.match(ev.text,/养母/);pushEv(ev);choose(0);drain();
    assert.equal(mother.cold,true);assert.equal(k.motherBonds[mother.id].activity,'冷宫探望');
    S.turn+=12;childLifeTick();assert.equal(motherAppealEvent(),null);
    mother.cold=false;childLifeTick();mother.cold=true;childLifeTick();`);
  force(0);
  run(`var ev=motherAppealEvent();assert.ok(ev);pushEv(ev);choose(1);drain();assert.equal(mother.cold,false);assert.equal(mother.rank,0);
    assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='mother-appeal'||JSON.stringify(m).includes('求情')));`);
});

test('infants and estranged children do not plead and a failed chance is not rerolled each month',()=>{
  const {run,force}=boot();
  run(`var mother=harem()[0],k=makeKid(mother,'f','明心');mother.cold=true;childLifeTick();assert.equal(motherAppealEvent(),null);
    k.born=S.turn-72;k.motherBonds={[mother.id]:{trust:20}};assert.equal(motherAppealEvent(),null);k.motherBonds[mother.id].trust=50;`);
  force(.99);run(`assert.equal(motherAppealEvent(),null);`);
  force(0);run(`S.turn++;childLifeTick();assert.equal(motherAppealEvent(),null);`);
});

test('school scenes keep multiple portraits and stable dialogue, change relationships and cannot be farmed',()=>{
  const {run}=boot();
  run(`var mother=harem()[0],a=makeKid(mother,'m','承文'),b=makeKid(mother,'f','明书');a.born=S.turn-120;b.born=S.turn-84;a.lit=85;b.lit=20;a.mar=b.mar=5;a.amb=b.amb=20;
    delete S.schoolChecked;ensureSchoolScene();assert.equal(schoolScene().scene.kind,'help');var html=schoolPanel();assert.match(html,/school-room/);assert.match(html,/承文/);assert.match(html,/明书/);
    var initial=JSON.stringify(S.schoolScene);ensureSchoolScene();assert.equal(JSON.stringify(S.schoolScene),initial);
    var relation=relGet(a,b);A.joinSchool();assert.equal(eventPortraits(curEv).length,2);choose(0);drain();assert.ok(relGet(a,b)>relation);
    var after=relGet(a,b);A.joinSchool();assert.equal(modalOpen,false);assert.equal(relGet(a,b),after);
    assert.ok(S.schoolScene.result);assert.match(schoolPanel(),/role="status"/);
    save('1');load('1');migrate();assert.ok(S.schoolScene.result);assert.equal(mapActivityLeads().some(l=>l.title==='同窗共读'),false);
    kidById(b.id).away=true;assert.equal(schoolScene(),null);`);
});

test('banquet controls expose the selected mode and activity and accept only one birthday feast per year',()=>{
  const {run}=boot();
  run(`var queen=empress();queen.birthMonth=S.month;A.openBanquet('empress');assert.equal(UI.view,'banquet');
    assert.match(viewBanquet(),/class="btn on" aria-pressed="true"[^>]*>全员宴请/);
    A.banquetActivity('paint');assert.match(viewBanquet(),/已选：全员宴请 · 共绘花枝/);
    assert.match(viewBanquet(),/class="btn sm on" aria-pressed="true"[^>]*>共绘花枝/);
    A.banquetInviteAll(false);assert.match(viewBanquet(),/已选：自选宾客/);A.banquetInviteAll(true);
    A.holdBanquet();choose(0);drain();assert.equal(queen.birthFeastYear,S.year);assert.equal(banquetKind('empress').ready,false);`);
});

test('father and brother merit can promote or reward the right consort with rank and treasury guards',()=>{
  const {run}=boot();
  run(`var c=harem()[1];c.rank=3;var ev=militaryMeritEvent(c,'辽东','father');assert.ok(ev.text.includes(houseOf(c).father.name));
    assert.ok(ev.choices[1].cond());ev.choices[1].f();assert.equal(c.rank,4);assert.ok(c.title);assert.ok(c.story.some(s=>s.t.includes('当场加恩')));
    ev=militaryMeritEvent(c,'大同','brother');var treasury=E().treasury;ev.choices[2].f();assert.equal(E().treasury,treasury-15);
    E().treasury=0;assert.equal(ev.choices[2].cond(),false);c.rank=7;ev=militaryMeritEvent(c,'大同');assert.equal(ev.choices[1].cond(),false);
    c.rank=3;for(var i=0;i<6;i++){var girl=makeGirl();girl.rank=4;S.consorts.push(girl);}ev=militaryMeritEvent(c,'大同');assert.equal(ev.choices[1].cond(),false);
    var rank=c.rank;ev.choices[1].f();assert.equal(c.rank,rank);`);
});
test('school activities follow skills, rivalry and a punished mother instead of swapping generic lines',()=>{
  const {run}=boot();
  run(`var [m1,m2]=harem(),a=makeKid(m1,'m','承勇'),b=makeKid(m2,'f','明善');
    a.born=S.turn-120;b.born=S.turn-96;a.lit=35;b.lit=20;a.mar=80;b.mar=10;a.amb=b.amb=20;a.vir=b.vir=70;
    relAdd(a,b,30-relGet(a,b));
    var resetSchool=()=>{delete S.schoolChecked;delete S.schoolScene;S.schoolRecent={};delete a.lastSchoolScene;delete b.lastSchoolScene;};
    resetSchool();ensureSchoolScene();assert.equal(S.schoolScene.kind,'play');
    a.mar=10;relAdd(a,b,-40-relGet(a,b));resetSchool();ensureSchoolScene();assert.equal(S.schoolScene.kind,'debate');
    var oldLove=b.love,oldRel=relGet(a,b);A.joinSchool();choose(2);drain();assert.ok(relGet(a,b)<oldRel);
    assert.ok([a,b].some(k=>k.love<50));
    relAdd(a,b,30-relGet(a,b));m2.cold=true;resetSchool();ensureSchoolScene();assert.equal(S.schoolScene.kind,'comfort');
    assert.ok(S.schoolScene.lines.some(line=>line.includes('母妃')));`);
});

test('a large harem cannot make new-clothes invitations occur more than once per twelve months',()=>{
  const {run}=boot();
  run(`S.consorts=[];for(var i=0;i<30;i++){var c=makeGirl({trait:'温婉'});c.aff=80;c.like='绸缎';S.consorts.push(c);}
    var turns=[];for(var t=0;t<60;t++){S.turn=t;S.consorts.forEach(c=>c.xin={k:'欢喜',t});var ev=xinEvent();if(ev){turns.push(t);pushEv(ev);choose(1);drain();}}
    assert.ok(turns.length>0&&turns.length<=5);for(var i=1;i<turns.length;i++)assert.ok(turns[i]-turns[i-1]>=12);`);
});
test('a discarded dowager death candidate cannot silently kill her or change character moods',()=>{
  const {run,force}=boot();
  run(`S.turn=50;var d=ensureDowager(),moods=JSON.stringify(S.consorts.map(c=>c.mood));`);
  force(0);run(`var announcement=dowagerPassingEvent();assert.ok(announcement);assert.equal(d.alive,true);assert.equal(d.mourning,undefined);
    assert.equal(JSON.stringify(S.consorts.map(c=>c.mood)),moods);
    pushEv(announcement);assert.equal(d.alive,false);assert.equal(d.mourning.handled,false);assert.equal(curEv.scene,'mourning');
    assert.match($('#mbox').innerHTML,/慈宁宫丧仪画面/);assert.match(mourningNotice(),/丧仪尚待/);`);
});

test('dowager death is delivered outside the monthly random budget and relatives grieve once',()=>{
  const {run}=boot();
  run(`var d=ensureDowager(),c=harem()[0];c.clan=d.clan;c.trait='骄纵';c.mood=90;S.turn=50;
    var original=dowagerPassingEvent;dowagerPassingEvent=()=>dowagerFuneralEvent(d);A.endMonth();dowagerPassingEvent=original;
    assert.equal(d.alive,false);assert.ok([curEv,...Q].some(e=>e.scene==='mourning'));
    assert.equal(xinOf(c),'悲恸');assert.match(d.mourning.reactions[c.id],/哭得直不起身/);
    var mood=c.mood;beginDowagerMourning(d);assert.equal(c.mood,mood);
    assert.equal(S.log.filter(l=>l.t.includes('宫门悬素')).length,1);
    assert.ok(NPCMemory.recall(S,c.id).some(m=>JSON.stringify(m).includes('去世')));drain();`);
});

test('an unfinished funeral survives reload, charges once and resumes from Cining palace',()=>{
  const {run}=boot();
  run(`var d=ensureDowager();pushEv(dowagerFuneralEvent(d));var turn=S.turn;save('1');Q.length=0;modalOpen=false;curEv=null;
    load('1');migrate();d=ensureDowager();assert.equal(d.mourning.handled,false);assert.ok(dowagerPassingEvent());
    A.go('place','cn');assert.match(viewPlace(),/料理太后丧仪/);var money=E().treasury;
    A.openMourning();var action=curEv.choices[0];choose(0);assert.equal(E().treasury,money-80);assert.equal(d.mourning.handled,true);
    action.f();assert.equal(E().treasury,money-80);drain();assert.equal(dowagerPassingEvent(),null);
    assert.equal(banquetKind('garden').ready,false);S.turn++;assert.equal(banquetKind('garden').ready,true);`);
});

test('old deceased dowagers get a memorial without a new death, bill or repeated grief',()=>{
  const {run}=boot();
  run(`var d=ensureDowager();d.alive=false;delete d.mourning;var money=E().treasury,moods=JSON.stringify(S.consorts.map(c=>c.mood));migrate();
    assert.equal(d.mourning.legacy,true);assert.match(mourningNotice(),/追思/);assert.equal(dowagerPassingEvent(),null);assert.equal(E().treasury,money);
    assert.equal(JSON.stringify(S.consorts.map(c=>c.mood)),moods);A.openMourning();assert.equal(curEv.title,'慈宁宫 · 追思');
    assert.doesNotMatch(curEv.text,/传来长长的哭声/);drain();assert.equal(E().treasury,money);assert.equal(mourningNotice(),'');`);
});

test('cold-palace relatives mourn in their own room, and follow-up comfort is not farmable',()=>{
  const {run}=boot();
  run(`var d=ensureDowager(),[a,b]=harem();a.clan=b.clan=d.clan;b.cold=true;pushEv(dowagerFuneralEvent(d));
    assert.match(d.mourning.reactions[b.id],/消息传到冷宫/);assert.equal(eventPortraits(curEv).includes(b),false);
    assert.match(d.mourning.reactions[a.id],/眼泪|泪人|泪水|哭/);drain();S.turn+=2;
    var before=a.aff;A.openMourning();choose(0);drain();assert.equal(a.aff,clamp(before+3));var after=a.aff;
    A.openMourning();choose(0);drain();assert.equal(a.aff,after);save('1');load('1');migrate();A.openMourning();choose(0);drain();assert.equal(byId(a.id).aff,after);`);
});

test('funeral has an affordable option and greeting a deceased dowager never invents a live conversation',()=>{
  const {run}=boot();
  run(`var d=ensureDowager();E().treasury=0;pushEv(dowagerFuneralEvent(d));assert.equal(curEv.choices[0].cond(),false);
    choose(1);drain();assert.equal(E().treasury,0);assert.equal(d.mourning.handled,true);
    var energy=E().energy;A.greet();assert.equal(E().energy,energy);assert.equal(modalOpen,false);assert.equal(UI.sel,'cn');`);
});


test('maternal full sisters with separately saved fathers share one parent in both views and after reload',()=>{
  const {run}=boot();
  run(`var d=ensureDowager(),a=makeGirl({sur:d.sur,fam:{...d.fam}}),b=makeGirl({sur:d.sur,fam:{...d.fam}});
    a.clan=b.clan=d.clan;addConsort(a,3,'太后荐入');addConsort(b,2,'亲妹入宫');
    houseOf(a);b.house=JSON.parse(JSON.stringify(a.house));b.house.father.id='legacy-father-'+b.id;b.fatherId=b.id;
    a.age=26;b.age=22;a.kin={[b.id]:'亲妹'};delete b.kin;
    var cousin=makeKin(a,'堂');addConsort(cousin,1,'堂妹入宫');houseOf(cousin);
    S=JSON.parse(JSON.stringify(S));migrate();a=byId(a.id);b=byId(b.id);cousin=byId(cousin.id);
    assert.equal(a.house,b.house);assert.equal(b.kin[a.id],'亲姐');assert.notEqual(a.house,cousin.house);
    var name=a.house.father.name,id=a.house.father.id;
    UI.familyMode='list';var list=viewFamily();assert.equal(list.split('父亲 · '+name).length-1,1);
    UI.familyMode='graph';var graph=viewFamily();assert.equal(graph.split('data-person-id="'+id+'"').length-1,1);
    var edges=graph.split('<g class="paternal-links" data-parent-id="'+id+'">')[1].split('</g>')[0];
    assert.ok(edges.includes('data-child-id="'+a.id+'"'));assert.ok(edges.includes('data-child-id="'+b.id+'"'));
    save('1');load('1');migrate();assert.equal(houseOf(byId(a.id)),houseOf(byId(b.id)));`);
});
