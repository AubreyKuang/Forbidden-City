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

test('map leads point at playable scenes and warn before invitations expire',()=>{
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

test('first month review can be canceled without spending energy or advancing time',()=>{
  const {run,ctx}=boot();
  run(`mapActivityLeads=()=>[];E().energy=2;A.finishMonth();`);
  assert.match(run(`curEv.text`),/2 点精力.*[\s\S]*结算本月收支/);
  run(`choose(curEv.choices.findIndex(choice=>choice.t==='留在本月'))`);
  assert.equal(run(`S.turn`),0);
  assert.equal(run(`E().energy`),2);
  let callback;
  ctx.setTimeout=f=>{callback=f;};
  run(`A.finishMonth();choose(curEv.choices.length-1);`);
  assert.ok(callback);
  callback();
  assert.equal(run(`S.turn`),1);
  assert.equal(run(`E().energy`),run(`maxEnergy()`));
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

test('succession audiences exclude confined or absent mothers and children without disinheriting their sons',()=>{
  const {run}=boot();
  run(`var [a,b]=harem(),ka=makeKid(a,'m','承安'),kb=makeKid(b,'m','承泽');ka.born=kb.born=S.turn-120;
    assert.ok(successionRivalryEvent());
    for(var state of ['cold','gone','dead']){
      a.cold=state==='cold';a.gone=state==='gone';a.alive=state!=='dead';assert.equal(successionRivalryEvent(),null);
    }
    a.alive=true;a.gone=false;a.cold=false;
    for(var state of ['away','jailed']){ka[state]=true;assert.equal(successionRivalryEvent(),null);ka[state]=false;}
    ka.foster=b.id;ka.visitRule='closed';assert.equal(successionRivalryEvent(),null);ka.visitRule='open';assert.ok(successionRivalryEvent());
    a.cold=true;A.kidHeir(ka.id);choose(0);drain();assert.equal(S.heir,ka.id);assert.equal(a.cold,true);
    assert.equal(ka.mom,a.id);assert.equal(relWord(80,'ck',a,ka),'亲生皇子');`);
});

test('succession rivalries pick two different eligible mothers and never make a dead grandfather petition',()=>{
  const {run}=boot();
  run(`var [a,b]=harem(),ka=makeKid(a,'m','承安'),kb=makeKid(a,'m','承泽');ka.born=kb.born=S.turn-96;
    assert.equal(successionRivalryEvent(),null);
    var kc=makeKid(b,'m','承明');kc.born=S.turn-96;var c=makeGirl();addConsort(c,3,'入宫');var kd=makeKid(c,'m','承荣');kd.born=S.turn-96;c.cold=true;
    houseOf(a).father.alive=false;var deadFather=houseOf(a).father.name;
    for(var i=0;i<50;i++){var ev=successionRivalryEvent();assert.ok(ev);assert.equal(ev.cast.includes(c),false);assert.equal(ev.cast.includes(kd),false);
      assert.equal(new Set(ev.cast.filter(p=>p.sex).map(p=>p.mom)).size,2);assert.ok(!ev.text.includes(deadFather+'领着'));}`);
});

test('a punishment cancels a queued audience and the queue continues to the next valid event',()=>{
  const {run}=boot();
  run(`var [a,b]=harem(),ka=makeKid(a,'m','承安'),kb=makeKid(b,'m','承泽');ka.born=kb.born=S.turn-96;
    var audience=successionRivalryEvent(),shown=0;audience.onShow=()=>shown++;
    pushEv(punishEv(a,null,'违例'));pushEv(audience);pushEv({title:'后续奏报',text:'奏报仍可处理。',choices:[{t:'知道了'}]});
    choose(0);assert.equal(a.cold,true);nextEv();assert.equal(curEv.title,'后续奏报');assert.equal(shown,0);drain();assert.equal(modalOpen,false);
    var queued=0;audience.onQueue=()=>queued++;pushEv(audience);pushNow(audience);assert.equal(queued,0);assert.equal(Q.length,0);assert.equal(modalOpen,false);
    a.cold=false;var current=successionRivalryEvent();pushEv(current);var support=JSON.stringify(S.children.map(k=>k.sup));a.cold=true;choose(0);
    assert.equal(JSON.stringify(S.children.map(k=>k.sup)),support);assert.equal(modalOpen,false);`);
});

test('same-clan audiences use free residents while confined sisters keep their family links',()=>{
  const {run}=boot();
  run(`var a=harem()[0],b=makeKin(a,'亲');addConsort(b,3,'亲妹入宫');S.consorts=[a,b];a.recommended=b.recommended=true;a.favor=b.favor=80;
    b.cold=true;for(var i=0;i<30;i++)assert.equal(clanEvent(),null);assert.ok(clanMembers(clanKey(a)).includes(b));assert.equal(houseOf(a),houseOf(b));
    var c=makeKin(a,'堂');addConsort(c,2,'堂妹入宫');c.recommended=true;c.favor=80;
    var count=0;for(var i=0;i<60;i++){var ev=clanEvent();if(!ev)continue;count++;assert.ok(!eventPortraits(ev).includes(b));assert.ok(eventStillValid(ev));}
    assert.ok(count>0);b.cold=false;assert.ok(eventStillValid({present:[a,b]}));`);
});

test('confined women cannot kneel at court or attend temple intrigues but can send letters and mourn',()=>{
  const {run}=boot();
  run(`var [a,b]=harem();a.cold=true;
    assert.equal(XEV['惶恐'](a),null);assert.equal(XEV['怨恨'](a,{who:b.id}),null);assert.equal(XEV['嫉恨'](b,{who:a.id}),null);
    var letter=HAREM.find(f=>f.name==='coldPlea')();assert.ok(eventStillValid(letter));pushEv(letter);choose(1);drain();assert.equal(a.cold,true);
    setXin(a,'悲恸','亲人去世');S.consorts=[a];var grief=xinEvent();assert.equal(grief.title,'超度');assert.match(grief.text,/冷宫.*托看守/);assert.ok(eventStillValid(grief));
    pushEv(grief);choose(0);drain();assert.equal(a.cold,true);
    S.turn+=12;a.xin={k:'心如死灰',t:S.turn-8};var request=xinEvent();assert.equal(request.title,'青灯');assert.ok(eventStillValid(request));
    a.gone=true;assert.equal(eventStillValid(request),false);`);
});

test('poisoned heirs receive a confined mother message without summoning her as a free court participant',()=>{
  const {run,force}=boot();
  run(`var [a,b]=harem();a.cold=true;b.scheme=90;var ka=makeKid(a,'m','承安'),kb=makeKid(b,'m','承泽');ka.born=kb.born=S.turn-96;S.heir=ka.id;
    var ev=HAREM.find(f=>f.name==='poisonHeir')();assert.match(ev.text,/消息传到冷宫/);assert.doesNotMatch(ev.text,/哭着跪在殿外/);assert.ok(eventStillValid(ev));pushEv(ev);`);
  force(0);run(`choose(0);nextEv();assert.equal(curEv.title,'真相大白');assert.equal(eventPortraits(curEv).includes(a),false);choose(2);drain();assert.equal(a.cold,true);`);
});

test('confined children cannot appear in school, garden or feast encounters',()=>{
  const {run}=boot();
  run(`var a=harem()[0],ka=makeKid(a,'m','承安'),kb=makeKid(a,'m','承泽');ka.born=S.turn-144;kb.born=S.turn-120;ka.away=true;kb.jailed=true;
    assert.equal(kidEvent(),null);assert.equal(relEvent(),null);
    var events=HIST.map(f=>f()).filter(Boolean);assert.ok(!events.some(e=>['七步诗','让梨','砸缸'].includes(e.title)));
    ka.away=false;kb.jailed=false;ka.born=S.turn-84;kb.born=S.turn-72;S.flags.gang=0;
    events=HIST.map(f=>f()).filter(Boolean);var garden=events.find(e=>e.title==='砸缸');assert.ok(garden);assert.ok(eventStillValid(garden));kb.jailed=true;assert.equal(eventStillValid(garden),false);`);
});

test('mother appeals still deliver because only the child must be physically present',()=>{
  const {run,force}=boot();
  run(`var a=harem()[0],k=makeKid(a,'m','承安');k.born=S.turn-96;a.cold=true;k.motherBonds={[a.id]:{trust:80}};childLifeTick();`);
  force(0);run(`var plea=motherAppealEvent();assert.ok(plea);assert.ok(eventStillValid(plea));assert.ok(eventPortraits(plea).includes(a));pushEv(plea);choose(0);drain();assert.equal(a.cold,true);assert.equal(k.motherBonds[a.id].activity,'冷宫探望');`);
});


test('coming of age and leaving for a fief actually removes the prince from palace encounters',()=>{
  const {run}=boot();
  run(`var k=makeKid(harem()[0],'m','承安');k.born=S.turn-192;pushEv(milestone());assert.equal(curEv.title,'皇子成年');choose(1);drain();
    assert.equal(k.away,true);assert.equal(childInPalace(k),false);assert.equal(relEvent(),null);save('1');load('1');migrate();assert.equal(kidById(k.id).away,true);`);
});


test('Ehuang and Nuying excludes a confined sister and cancels after a queued punishment',()=>{
  const {run,force}=boot();
  run(`var a=harem()[0],b=makeKin(a,'亲');addConsort(b,3,'亲妹入宫');S.consorts=[a,b];
    a.kinRival={};b.kinRival={};a.recommended=b.recommended=true;a.favor=b.favor=80;`);
  force(.99,.99);
  run(`var ev=clanEvent();assert.equal(ev.title,'娥皇女英');assert.deepEqual(ev.present,[a,b]);
    pushEv(punishEv(b,null,'违例'));pushEv(ev);choose(0);var aff=[a.aff,b.aff];nextEv();assert.equal(modalOpen,false);assert.deepEqual([a.aff,b.aff],aff);
    for(var i=0;i<100;i++)assert.equal(clanEvent(),null);
    for(var state of ['gone','alive']){b.cold=false;b[state]=state==='gone';assert.equal(clanEvent(),null);b[state]=state==='alive';}
    b.cold=false;b.alive=true;`);
  force(.99,.99);
  run(`var restored=clanEvent();assert.equal(restored.title,'娥皇女英');pushEv(restored);choose(0);drain();assert.ok(a.aff>aff[0]);assert.ok(b.aff>aff[1]);`);
});

test('one-person reward choices omit duplicate portraits but retain the large portrait and working rewards',()=>{
  const {run}=boot();
  run(`var c=harem()[1];c.rank=3;E().treasury=100;pushEv(militaryMeritEvent(c,'雁门关','father'));
    var html=$('#mbox').innerHTML;assert.equal((html.match(/class="mpor"/g)||[]).length,1);
    assert.doesNotMatch(html,/event-person-choice|event-choices/);assert.equal(html.split('onclick="choose(').length-1,4);
    choose(2);assert.equal(E().treasury,85);drain();`);
});

test('frontier reports share a yearly court limit and a two-year household limit across sisters and reloads',()=>{
  const {run}=boot();
  run(`var a=harem()[0],other=harem()[1],b=makeKin(a,'亲');addConsort(b,2,'亲妹入宫');S.turn=100;
    var discarded=militaryMeritEvent(a,'雁门关');assert.equal(frontierReportReady(a),true);
    pushEv(discarded);assert.equal(frontierReportReady(a),false);assert.equal(frontierReportReady(b),false);assert.equal(frontierReportReady(other),false);
    choose(3);drain();assert.equal(S.flags.lastFrontierReport,100);assert.equal(houseOf(b).lastFrontierReport,100);
    pushEv(militaryMeritEvent(other,'玉门关'));assert.equal(modalOpen,false);
    S.turn=111;assert.equal(frontierReportReady(other),false);S.turn=112;assert.equal(frontierReportReady(other),true);assert.equal(frontierReportReady(b),false);
    save('1');load('1');migrate();a=byId(a.id);b=byId(b.id);other=byId(other.id);
    assert.equal(frontierReportReady(b),false);S.turn=123;assert.equal(frontierReportReady(b),false);S.turn=124;assert.equal(frontierReportReady(b),true);
    delete S.flags.lastFrontierReport;S.flags.lastMilitaryMerit=120;S.turn=131;assert.equal(frontierReportReady(other),false);S.turn=132;assert.equal(frontierReportReady(other),true);`);
});

test('frontier defeats also start the shared cooldown and rejected candidates do not consume it',()=>{
  const {run}=boot(805);
  run(`S.turn=100;S.children=[];S.flags.dowager.alive=false;S.consorts=[harem()[0]];var c=harem()[0];
    c.fam={t:'镇国大将军',p:60};delete c.house;houseOf(c).brother.merit=0;E().wu=0;var defeat;
    for(var i=0;i<200&&!defeat;i++){var ev=factionEvent();if(ev?.title==='边关失利')defeat=ev;}
    assert.ok(defeat);assert.equal(S.flags.lastFrontierReport,undefined);
    c.cold=true;pushEv(defeat);assert.equal(S.flags.lastFrontierReport,undefined);assert.equal(modalOpen,false);c.cold=false;
    pushEv(defeat);assert.equal(S.flags.lastFrontierReport,100);choose(1);drain();
    for(var i=0;i<50;i++)assert.equal(factionEvent(),null);`);
});

test('many military families cannot multiply report frequency over sixty months',()=>{
  const {run}=boot(901);
  run(`S.consorts=[];S.children=[];S.flags.dowager.alive=false;
    for(var i=0;i<30;i++){var c=makeGirl({fam:{t:'镇国大将军',p:60}});addConsort(c,2,'入宫');}
    var turns=[],houseTurns={};
    for(S.turn=100;S.turn<160;S.turn++){
      // Include several pending memorials in addition to the ordinary monthly draw.
      var candidates=Array.from({length:4},()=>factionEvent()).filter(Boolean);
      for(var ev of candidates){if(!eventStillValid(ev))continue;
        var key=houseOf(ev.por).father.id;
        if(turns.length)assert.ok(S.turn-turns[turns.length-1]>=12);
        if(houseTurns[key]!=null)assert.ok(S.turn-houseTurns[key]>=24);
        pushEv(ev);assert.equal(modalOpen,true);turns.push(S.turn);houseTurns[key]=S.turn;choose(ev.choices.length-1);drain();
      }
    }
    assert.ok(turns.length>0&&turns.length<=5);`);
});

test('historical audiences recheck their participants while Changmen letters remain possible',()=>{
  const {run}=boot();
  run(`var a=harem()[0];S.consorts=[a];a.virtue=80;a.rank=4;S.flags.hcd={};
    var index=HIST.findIndex(f=>f()?.title==='辞辇');HIST.forEach((_,i)=>{if(i!==index)S.flags.hcd[i]=S.turn;});
    var ev=histEvent();assert.equal(ev.title,'辞辇');a.cold=true;assert.equal(eventStillValid(ev),false);
    var letter=HIST.map(f=>f()).find(e=>e?.title==='长门赋');assert.ok(eventStillValid(letter));a.cold=false;assert.equal(eventStillValid(letter),false);`);
});

test('young children live with the current caregiver, not both mothers or a confined mother',()=>{
  const {run}=boot();
  run(`var [mother,foster]=harem(),k=makeKid(mother,'f','明昭');mother.palace='坤宁宫';foster.palace='景仁宫';k.born=S.turn-48;
    assert.equal(youngChildMother(k),mother);assert.match(childResidence(k),/生母.*坤宁宫/);assert.ok(nurseryChildren('坤宁宫').includes(k));
    A.visitChildHome(k.id);assert.equal(UI.sel,'坤宁宫');assert.equal(S.pos.x,PLACES.find(p=>p.id==='kn').d[0]);
    doFoster(k,foster);assert.equal(youngChildMother(k),foster);assert.ok(!nurseryChildren('坤宁宫').includes(k));assert.match(childResidence(k),/养母.*景仁宫/);
    foster.cold=true;assert.equal(youngChildMother(k),null);assert.match(childResidence(k),/乳母/);assert.equal(nurseryChildren('冷宫').length,0);
    foster.cold=false;for(var flag of ['away','jailed','married','pendingName']){k[flag]=true;assert.equal(youngChildMother(k),null);k[flag]=false;}
    k.born=S.turn-72;assert.equal(youngChildMother(k),null);assert.equal(childResidence(k),'');`);
});

test('palace visits roll once per month even after a failed roll, navigation and reload',()=>{
  const {run,force}=boot();
  run(`var mother=harem()[0],k=makeKid(mother,'m','承安');mother.palace='坤宁宫';S.turn=100;k.born=S.turn-48;`);
  force(.99);
  run(`A.go('palace','坤宁宫');assert.equal(palaceLifeScene('坤宁宫'),null);assert.match(viewPalace(),/随母同住/);`);
  force(0,0);
  run(`A.go('map');A.go('palace','坤宁宫');assert.equal(palaceLifeScene('坤宁宫'),null);save('1');load('1');migrate();
    A.go('palace','坤宁宫');assert.equal(palaceLifeScene('坤宁宫'),null);S.turn++;A.go('palace','坤宁宫');
    assert.ok(palaceLifeScene('坤宁宫'));assert.match(viewPalace(),/family-room/);`);
});

test('joining a nursery scene changes relationships once and persists the result',()=>{
  const {run,force}=boot();
  run(`var mother=harem()[0],k=makeKid(mother,'f','明昭');mother.palace='坤宁宫';k.born=S.turn-48;E().energy=3;`);
  force(0,0);
  run(`A.visitMapActivity('kn');var start=k.love,trust=childTrust(k,mother);assert.ok(palaceLifeScene('坤宁宫'));A.joinNursery('join');
    assert.equal(E().energy,2);assert.equal(k.love,start+5);assert.ok(childTrust(k,mother)>trust);
    assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='family-time'));assert.match(viewPalace(),/role="status"/);
    A.joinNursery('join');assert.equal(E().energy,2);save('1');load('1');migrate();A.joinNursery('watch');assert.equal(E().energy,2);
    mother=byId(mother.id);k=kidById(k.id);mother.cold=true;assert.equal(palaceLifeScene('坤宁宫'),null);assert.ok(!viewPalace().includes('family-room'));
    assert.equal(k.love,start+5);`);
});

test('nursery actions respect age, personality, energy and custody changes',()=>{
  const {run,force}=boot();
  run(`var [mother,foster]=harem(),k=makeKid(mother,'m','承安');mother.palace='坤宁宫';
    assert.equal(nurseryActivity(k,mother).id,'cradle');k.born=S.turn-18;assert.equal(nurseryActivity(k,mother).id,'steps');
    k.born=S.turn-48;mother.trait='将门';mother.mood=70;mother.talent=20;mother.like='骑射';assert.equal(nurseryActivity(k,mother).id,'play');
    mother.trait='好学';assert.equal(nurseryActivity(k,mother).id,'letters');mother.mood=20;assert.equal(nurseryActivity(k,mother).id,'comfort');E().energy=0;`);
  force(0,0);
  run(`A.go('palace','坤宁宫');var love=k.love;A.joinNursery('join');assert.equal(k.love,love);assert.ok(!palaceLifeScene('坤宁宫').scene.result);
    doFoster(k,foster);assert.equal(palaceLifeScene('坤宁宫'),null);A.joinNursery('watch');assert.equal(k.love,love);`);
});

test('adolescent quarrels require teenagers, change their actual ties and obey global and personal intervals',()=>{
  const {run}=boot();
  run(`var a=makeKid(harem()[0],'m','承安'),b=makeKid(harem()[1],'f','明昭');a.born=b.born=S.turn-144;
    assert.equal(youthEvent(),null);a.born=b.born=S.turn-168;b.youthIdeal='books';a.amb=80;
    var ev=youthEvent();assert.equal(ev.title,'少年意气');var before=relGet(a,b);pushEv(ev);choose(0);drain();assert.equal(relGet(a,b),before+10);
    for(var k of [a,b])assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='youth-talk'));
    assert.equal(youthEvent(),null);S.turn+=4;assert.equal(youthEvent(),null);S.turn+=4;assert.ok(youthEvent());
    b.jailed=true;assert.equal(youthEvent(),null);b.jailed=false;a.born=b.born=S.turn-192;assert.equal(youthEvent(),null);`);
});

test('a princess can discuss her ideals without becoming engaged or married',()=>{
  const {run}=boot();
  run(`var k=makeKid(harem()[0],'f','明昭');k.born=S.turn-168;k.mar=80;k.lit=30;
    var ev=youthEvent();assert.equal(ev.title,'少女心事');assert.match(ev.text,/骑马/);pushEv(ev);choose(0);drain();
    assert.equal(k.youthIdeal,'riding');assert.equal(k.married,false);assert.match(youthPanel(k),/自己拿主意/);
    assert.ok(NPCMemory.recall(S,k.id).some(m=>m.type==='youth_ideal'));`);
});

const guestSetup=`S.consorts=[];S.children=[];S.turn=180;E().sur='赵';
  var mother=makeGirl({sur:'林',age:32,fam:{t:'翰林学士',p:50}}),host=makeGirl({sur:'沈',age:30,fam:{t:'镇国大将军',p:60}});
  addConsort(mother,4,'入宫');addConsort(host,4,'入宫');mother.palace='坤宁宫';host.palace='景仁宫';
  var k=makeKid(mother,'f','明昭');k.born=S.turn-168;`;

test('a named visitor is remembered across saves and can become the same grown princess marriage choice',()=>{
  const {run,force}=boot();run(guestSetup);force(0,0);
  run(`A.go('palace','景仁宫');var found=palaceLifeScene('景仁宫');assert.equal(found.scene.kind,'guest');var guest=found.guest;
    assert.equal(guest.fatherName,houseOf(host).brother.name);assert.ok(!porName(guest).includes('皇'));assert.ok(!porName(guest).includes('undefined'));
    A.answerYoungGuest('listen');var love=k.love;A.answerYoungGuest('listen');assert.equal(k.love,love);assert.equal(k.married,false);assert.equal(rememberedMatch(k),null);
    var guestId=guest.id,guestName=guest.name;save('1');load('1');migrate();k=kidById(k.id);assert.equal(S.youngGuests[k.youngAdmiration.guestKey].id,guestId);
    S.turn+=24;assert.equal(rememberedMatch(k).name,guestName);pushEv(princessMarriage(k));assert.ok(curEv.choices[0].t.includes(guestName));
    choose(0);assert.equal(curEv.title,'再谈旧日相识');choose(0);drain();assert.equal(k.spouse.id,guestId);assert.equal(k.married,true);
    assert.equal(S.youngGuests[k.youngAdmiration.guestKey].married,k.id);assert.equal(rememberedMatch(k),null);`);
});

test('guest acquaintance excludes maternal kin, foster kin, royal surname and unavailable guests',()=>{
  const {run}=boot();run(guestSetup);
  run(`var cousin=householdGuest(mother,k);assert.equal(youngGuestEligible(k,cousin),false);
    var guest=householdGuest(host,k);assert.equal(youngGuestEligible(k,guest),true);k.foster=host.id;assert.equal(youngGuestEligible(k,guest),false);delete k.foster;
    guest.sur=E().sur;assert.equal(youngGuestEligible(k,guest),false);guest.sur=host.sur;guest.alive=false;assert.equal(youngGuestEligible(k,guest),false);
    guest.alive=true;guest.married=999;assert.equal(youngGuestEligible(k,guest),false);`);
});

test('guest scenes disappear if a host is confined or custody changes and cannot reward stale interactions',()=>{
  const {run,force}=boot();run(guestSetup);force(0,0);
  run(`A.go('palace','景仁宫');assert.ok(palaceLifeScene('景仁宫'));host.cold=true;var love=k.love;
    assert.equal(palaceLifeScene('景仁宫'),null);A.answerYoungGuest('listen');assert.equal(k.love,love);assert.equal(k.youngAdmiration,undefined);
    host.cold=false;k.foster=host.id;assert.equal(palaceLifeScene('景仁宫'),null);delete k.foster;
    S.turn++;assert.equal(youngGuestVisit('景仁宫'),null);`);
});

test('marriage entry is hidden before fifteen for both sexes and explains confinement and delay',()=>{
  const {run}=boot();
  run(`var mother=harem()[0];var son=makeKid(mother,'m','承安'),daughter=makeKid(mother,'f','明昭');
    for(const k of [son,daughter]){
      k.born=S.turn-179;assert.equal(marriageReady(k),false);assert.equal(marriageStatus(k),'');assert.equal(marriagePanel(k),'');
      k.born--;assert.equal(marriageReady(k),true);assert.match(marriageButton(k),/A.kidMarriage/);
      k.jailed=true;assert.equal(marriageReady(k),false);assert.match(marriageStatus(k),/圈禁/);k.jailed=false;
      k.marriageAfter=S.turn+6;assert.equal(marriageReady(k),false);assert.match(marriageButton(k),/disabled/);assert.match(marriageStatus(k),/6个月/);
      delete k.marriageAfter;k.alive=false;assert.equal(marriageReady(k),false);k.alive=true;
      k.married=true;assert.equal(marriageReady(k),false);k.married=false;
    }
    assert.ok(!viewKids().includes('议婚 / 赐婚'));assert.ok(!viewKids().includes('可以议婚'));UI.sel=son.id;assert.match(viewKid(),/皇嗣婚事/);`);
});

test('prince marriage keeps fixed candidates across save/load and settles once without removing a resident prince',()=>{
  const {run}=boot();
  run(`var son=makeKid(harem()[0],'m','承安');son.born=S.turn-180;son.lit=80;son.mar=30;son.vir=40;E().treasury=200;
    A.kidMarriage(son.id);var candidates=JSON.stringify(son.marriageCandidates);
    assert.equal(Object.keys(son.marriageCandidates).length,3);
    assert.equal(new Set(Object.values(son.marriageCandidates).map(p=>p.name)).size,3);
    assert.ok(Object.values(son.marriageCandidates).every(p=>p.sex==='f'&&kidAge(p)>=15&&p.sur!==E().sur&&p.sur!==byId(son.mom).sur));
    choose(3);drain();assert.equal(son.marriageAfter,S.turn+6);S.turn+=6;save('auto');var id=son.id;A.load('auto');drain();son=kidById(id);
    assert.equal(JSON.stringify(son.marriageCandidates),candidates);
    A.kidMarriage(id);choose(0);var confirmMarriage=curEv.choices[0].f;choose(0);drain();
    assert.equal(son.married,true);assert.equal(son.spouse.name,son.marriageCandidates.scholar.name);
    assert.equal(son.lit,85);assert.equal(E().treasury,150);assert.equal(childInPalace(son),true);
    confirmMarriage();A.kidMarriage(id);assert.equal(modalOpen,false);assert.equal(E().treasury,150);assert.equal(son.lit,85);
    save('auto');A.load('auto');drain();son=kidById(id);assert.match(marriagePanel(son),new RegExp(son.spouse.name));
    son.away=true;assert.equal(childInPalace(son),false);`);
});

test('marriage requires the budget and rechecks confinement at confirmation',()=>{
  const {run}=boot();
  run(`var son=makeKid(harem()[0],'m','承安');son.born=S.turn-180;E().treasury=49;
    A.kidMarriage(son.id);choose(0);assert.equal(curEv.choices[0].cond(),false);choose(0);assert.equal(son.married,false);
    E().treasury=50;son.jailed=true;choose(0);assert.equal(son.married,false);assert.equal(E().treasury,50);assert.equal(modalOpen,false);`);
});

test('princess standard routes retain named spouses and the prominent action supports already opened estates',()=>{
  const {run}=boot();
  run(`var daughter=makeKid(harem()[0],'f','明昭');daughter.born=S.turn-180;daughter.lit=80;daughter.mar=20;daughter.estate={pursuit:'books',opened:S.turn,stage:'proposal'};
    A.kidMarriage(daughter.id);assert.equal(curEv.title,'公主婚事');choose(0);
    var candidate=curEv.cast[1];assert.ok(candidate.name);assert.equal(candidate.sex,'m');choose(0);drain();
    assert.equal(daughter.spouse.name,candidate.name);assert.equal(daughter.princessMarriage,'scholar');assert.equal(daughter.estate.route,'scholar');
    assert.equal(childInPalace(daughter),false);assert.equal(marriageButton(daughter),'');
    var id=daughter.id;save('auto');A.load('auto');drain();assert.equal(kidById(id).spouse.name,candidate.name);`);
});

test('princess official route cannot spend an unavailable marriage budget',()=>{
  const {run}=boot();
  run(`var daughter=makeKid(harem()[0],'f','明昭');daughter.born=S.turn-180;E().treasury=49;
    pushEv(princessMatchReview(daughter,'official'));assert.equal(curEv.choices[0].cond(),false);choose(0);
    assert.equal(daughter.married,false);assert.equal(E().treasury,49);
    E().treasury=50;choose(0);drain();assert.equal(daughter.married,true);assert.equal(E().treasury,0);`);
});

test('all map place guides are read only and show activities without drawing new palace events',()=>{
  const {run}=boot();
  run(`var before=JSON.stringify(S);for(const p of PLACES){var guide=placeGuide(p);assert.ok(guide.purpose);assert.ok(guide.activities.length);assert.match(placeGuideHTML(p),/可以做什么/);}
    assert.equal(JSON.stringify(S),before);assert.equal(S.palaceLife?.checked?.['永和宫'],undefined);`);
});

test('map guides distinguish residents from active participants and follow cold-palace and dowager state',()=>{
  const {run}=boot();
  run(`var mother=harem()[0];mother.palace='永和宫';var child=makeKid(mother,'f','明昭');child.born=S.turn-36;
    var place=PLACES.find(p=>p.p==='永和宫');assert.ok(placeGuide(place).residents.includes(fullName(mother)));
    assert.ok(placeGuide(place).residents.some(n=>n.includes('明昭')));
    mother.cold=true;mother.palace='冷宫';assert.equal(placeGuide(place).residents.length,0);
    assert.ok(placeGuide(PLACES.find(p=>p.id==='lg')).residents.includes(fullName(mother)));
    child.born=S.turn-84;assert.ok(placeGuide(PLACES.find(p=>p.id==='ss')).residents.some(n=>n.includes('明昭')));
    S.flags.dowager.alive=false;assert.match(placeGuideHTML(PLACES.find(p=>p.id==='cn')),/添香追思/);
    assert.doesNotMatch(placeGuideHTML(PLACES.find(p=>p.id==='cn')),/向太后请安/);`);
});

test('a married prince keeps his actual wife as empress when succeeding',()=>{
  const {run}=boot();
  run(`var son=makeKid(harem()[0],'m','承安');son.born=S.turn-192;E().treasury=200;
    A.kidMarriage(son.id);choose(0);choose(0);drain();var wife=son.spouse,wifePortrait=portraitCell(wife.appearance);
    succeed(son);choose(0);drain();var queen=harem().find(c=>c.rank===8);
    assert.equal(fullName(queen),wife.name);assert.equal(queen.age,kidAge(wife));assert.equal(portraitCell(queen),wifePortrait);
    assert.equal(queen.trait,wife.appearance.trait);assert.ok(queen.story.some(s=>s.t.includes('潜邸嫡妻')));`);
});

function romanceBoot(){
  const game=boot();game.run(`E().sur='赵';var mother=harem()[0];mother.sur='林';
    var prince=makeKid(mother,'m','承安');prince.born=S.turn-240;prince.lit=75;prince.vir=40;prince.love=35;
    var lady=makeGirl({sur:'沈',given:'清和',age:22,trait:'好学'});addConsort(lady,3,'入宫');
    lady.hobby='读书';lady.aff=10;lady.favor=10;lady.virtue=40;lady.preg=0;relAdd(prince,lady,30-relGet(prince,lady));`);return game;
}
test('palace friendship begins at fifteen and still excludes family and former caregivers',()=>{
  const {run}=romanceBoot();run(`assert.equal(romanceEligible(prince,lady),true);
    const born=prince.born;prince.born=S.turn-179;assert.equal(romanceEligible(prince,lady),false);prince.born=born;
    lady.age=14;assert.equal(romanceEligible(prince,lady),false);lady.age=29;assert.equal(romanceEligible(prince,lady),false);lady.age=22;
    lady.enteredAt=prince.born+179;assert.equal(romanceEligible(prince,lady),false);lady.enteredAt=S.turn;
    prince.mom=lady.id;assert.equal(romanceEligible(prince,lady),false);prince.mom=mother.id;
    prince.foster=lady.id;assert.equal(romanceEligible(prince,lady),false);prince.foster=null;
    prince.motherBonds={[lady.id]:{trust:60}};assert.equal(romanceEligible(prince,lady),false);delete prince.motherBonds;
    lady.sur=mother.sur;assert.equal(romanceEligible(prince,lady),false);lady.sur='沈';
    lady.kin={[mother.id]:'亲姐'};assert.equal(romanceEligible(prince,lady),false);delete lady.kin;`);
});
test('personality, trust and common interests govern attraction instead of age alone',()=>{
  const {run}=romanceBoot();run(`assert.ok(romanceAffinity(prince,lady)>0);
    for(const trait of ['痴情','持重']){lady.trait=trait;assert.equal(romanceAffinity(prince,lady),0)}lady.trait='好学';
    lady.aff=70;assert.equal(romanceAffinity(prince,lady),0);lady.aff=10;
    lady.favor=60;assert.equal(romanceAffinity(prince,lady),0);lady.favor=10;
    lady.hobby='刺绣';assert.equal(romanceAffinity(prince,lady),0);lady.hobby='读书';
    prince.vir=85;assert.equal(romanceAffinity(prince,lady),0);prince.vir=40;
    relAdd(prince,lady,-100);assert.equal(romanceAffinity(prince,lady),0);`);
});
test('a failed monthly romance roll persists and cannot be refreshed by opening locations or loading',()=>{
  const {run,force}=romanceBoot();force(.9);run(`palaceRomanceTick();assert.equal(Object.keys(S.palaceRomance.pairs).length,0);save('auto');A.load('auto');drain();`);
  force(0,0);run(`palaceRomanceTick();assert.equal(Object.keys(S.palaceRomance.pairs).length,0);`);
  run(`S.turn++`);force(0,0);run(`palaceRomanceTick();assert.equal(Object.keys(S.palaceRomance.pairs).length,1);var pair=Object.values(S.palaceRomance.pairs)[0];
    assert.equal(pair.stage,1);assert.equal(pair.place,'wy');assert.equal(palaceRomanceLeads().length,1);assert.match(palaceRomanceAt('wy'),/走近过问/);`);
});
test('romance develops across months with two portraits, persistent memories and one-time consequences',()=>{
  const {run,force}=romanceBoot();force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];pushEv(palaceRomanceEvent(pair));
    assert.equal(curEv.cast.length,2);assert.ok(curEv.text.includes('20岁'));choose(0);drain();assert.equal(pair.pending,false);var due=pair.due;
    assert.ok(due-S.turn>=4);S.turn=due;`);
  force(0);run(`palaceRomanceTick();assert.equal(pair.stage,2);pushEv(palaceRomanceEvent(pair));choose(0);drain();S.turn=pair.due;`);
  force(0);run(`palaceRomanceTick();assert.equal(pair.stage,3);pushEv(palaceRomanceEvent(pair));assert.match(curEv.text,/轻轻回握/);assert.match(curEv.text,/短暂相拥/);
    prince.spouse={name:'许静宜'};var decision=curEv.choices[2].f;var prestige=E().prestige;choose(2);drain();
    assert.equal(pair.status,'exposed');assert.equal(prince.spouse.trust,35);assert.match(marriagePanel(prince),/夫妻信任/);assert.equal(E().prestige,prestige-3);
    decision();assert.equal(E().prestige,prestige-3);assert.equal(palaceRomanceLeads().length,0);
    assert.ok(prince.story.some(s=>s.t.includes('私情被随侍察觉')));assert.ok(lady.story.some(s=>s.t.includes('私情被随侍察觉')));
    save('auto');var key=pair.key;A.load('auto');drain();assert.equal(S.palaceRomance.pairs[key].status,'exposed');`);
});
test('cold palace and departures invalidate queued romance and terminate the pending map clue',()=>{
  const {run,force}=romanceBoot();force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];
    pushEv({title:'先行处理',choices:[{t:'送入冷宫',f:()=>{lady.cold=true;lady.palace='冷宫';}}]});pushEv(palaceRomanceEvent(pair));choose(0);drain();
    assert.equal(pair.known,false);assert.equal(palaceRomanceLeads().length,0);reconcilePalaceRomance();assert.equal(pair.status,'ended');
    lady.cold=false;lady.palace='景仁宫';for(const field of ['away','jailed']){prince[field]=true;assert.equal(romanceEligible(prince,lady),false);prince[field]=false;}`);
});
test('choosing a boundary closes the romance without relaunching it for the same people',()=>{
  const {run,force}=romanceBoot();force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];pushEv(palaceRomanceEvent(pair));choose(1);drain();
    assert.equal(pair.status,'ended');assert.equal(pair.stage,1);S.turn+=24;lady.age+=2;`);
  force(0,0);run(`palaceRomanceTick();assert.equal(Object.keys(S.palaceRomance.pairs).length,1);assert.equal(palaceRomanceEvent(),null);`);
});

test('a crowded palace still has one romance roll and at least eighteen months between new stories',()=>{
  const {run,force}=romanceBoot();run(`for(let i=0;i<20;i++){
    const c=makeGirl({sur:'沈',age:22,trait:'好学'});addConsort(c,2,'入宫');c.hobby='读书';c.aff=10;c.favor=10;c.virtue=40;
    const k=makeKid(mother,'m','承'+i);k.born=S.turn-240;k.lit=75;k.vir=40;relAdd(k,c,30-relGet(k,c));}
    var starts=[];`);
  force(.99,...Array(100).fill(0));run(`palaceRomanceTick();assert.equal(Object.keys(S.palaceRomance.pairs).length,0);`);
  for(let turn=1;turn<=72;turn++){
    force(0,0);run(`S.turn=${turn};palaceRomanceTick();var current=Object.values(S.palaceRomance.pairs).find(p=>p.status==='active');if(current){starts.push(S.turn);closePalaceRomance(current,'测试收束');}`);
  }
  run(`assert.ok(starts.length>1);for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]>=18);assert.ok(starts.length<=4);`);
});
test('mourning pauses romance clues and queued encounters without deleting their history',()=>{
  const {run,force}=romanceBoot();force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];S.flags.dowager.mourning={turn:S.turn,handled:true};
    assert.equal(palaceRomanceEvent(),null);assert.equal(palaceRomanceLeads().length,0);assert.equal(pair.pending,true);
    S.turn++;assert.ok(palaceRomanceEvent());`);
});

test('romance exile stops meetings while concealing keeps a memory without recurring scenes',()=>{
  for(const mode of ['away','conceal']){
    const {run,force}=romanceBoot();force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];pair.stage=3;pushEv(palaceRomanceEvent(pair));
      choose(${mode==='away'?1:3});drain();assert.equal(pair.status,'${mode==='away'?'ended':'concealed'}');assert.equal(pair.pending,false);assert.equal(palaceRomanceLeads().length,0);
      assert.equal(prince.away===true,${mode==='away'});assert.ok(palaceRomancePanel(prince).includes('${mode==='away'?'往来已断':'未公开的私情'}'));
      var saved=JSON.stringify(S.palaceRomance);S.turn++;palaceRomanceTick();assert.equal(pair.stage,3);
      if('${mode}'==='conceal'){lady.cold=true;reconcilePalaceRomance();assert.equal(pair.status,'ended');}`);
  }
});

test('expanded portrait atlases keep legacy identities, stable growth and every cell in bounds',()=>{
  const {run}=boot();run(`var mother=harem()[0];S.children=[];
    for(const sex of ['m','f'])for(let i=1;i<=32;i++){
      const k={id:1000+S.children.length,sex,ord:i,seed:i,born:S.turn,alive:true};S.children.push(k);
      for(const [age,stage] of [[0,0],[8,1],[18,2]]){k.born=S.turn-age*12;const v=(i-1)%10;
        const old=sex==='m'?(v<4?28+stage*4+v:44+stage*6+v-4):62+stage*10+v;
        assert.equal(portraitCell(k),old);}
    }
    var before=S.children.map(portraitCell);S=JSON.parse(JSON.stringify(S));assert.deepEqual(S.children.map(portraitCell),before);
    for(let cell=0;cell<PORTRAIT_COUNT;cell++){const sheet=portraitSheet(cell),xy=portraitTile(cell,sheet);assert.ok(xy[0]>=0&&xy[0]<448);assert.ok(xy[1]>=0&&xy[1]<sheet.rows*140);}
    assert.equal(CONSORT_PORTRAITS.length+WESTERN_PORTRAITS.length,63);
    assert.equal(new Set([...CONSORT_PORTRAITS,...WESTERN_PORTRAITS]).size,63);
    assert.equal(portraitSheet(239).src,'./palace-royal-regalia.webp?v=1');`);
});
test('prince brides share the expanded portrait pool without duplicate faces or changes after marriage and succession',()=>{
  const {run}=boot(880);run(`var mother=harem()[0];S.children=[];var faces=[];
    for(let i=0;i<12;i++){
      const k=makeKid(mother,'m','承'+i);k.born=S.turn-240;
      for(const route of Object.keys(PRINCE_MATCHES)){const p=marriageCandidate(k,route);faces.push(portraitCell(p));assert.ok(CONSORT_PORTRAITS.includes(portraitCell(p)));assert.equal(marriageCandidate(k,route),p);}
    }
    assert.equal(new Set(faces).size,36);assert.ok(faces.some(cell=>cell>=208));
    var prince=S.children[0],bride=marriageCandidate(prince,'scholar'),face=portraitCell(bride);
    E().treasury=500;pushEv(princeMatchReview(prince,'scholar'));choose(0);drain();
    assert.equal(portraitCell(prince.spouse),face);assert.ok(marriagePanel(prince).includes('data-portrait-cell="'+face+'"'));
    var id=prince.id;save('auto');A.load('auto');drain();prince=kidById(id);assert.equal(portraitCell(prince.spouse),face);
    assert.equal(portraitCell(marriageEmpress(prince)),face);`);
});
test('fifteen-year-old correspondence waits for adulthood before intimate scenes, including after reload',()=>{
  const {run,force}=romanceBoot();run(`prince.born=S.turn-180;lady.age=17;lady.enteredAt=S.turn;`);
  force(0,0);run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];assert.ok(pair);pushEv(palaceRomanceEvent(pair));choose(0);drain();S.turn=pair.due;`);
  force(0);run(`palaceRomanceTick();assert.equal(pair.stage,2);pushEv(palaceRomanceEvent(pair));choose(0);drain();var key=pair.key;S.turn=pair.due;`);
  force(0);run(`palaceRomanceTick();assert.equal(pair.stage,2);save('auto');A.load('auto');drain();pair=S.palaceRomance.pairs[key];
    pair.stage=3;pair.pending=true;assert.equal(palaceRomanceEvent(pair),null);assert.equal(resolvePalaceRomance(key,3,'conceal'),null);
    var prince=kidById(pair.prince),lady=byId(pair.consort);prince.born=S.turn-216;lady.age=18;assert.ok(palaceRomanceEvent(pair));`);
});
test('redirecting a fifteen-year-old changes lessons without falsely sending him to a fief',()=>{
  const {run,force}=romanceBoot();run(`prince.born=S.turn-180;lady.age=18;lady.enteredAt=S.turn;`);force(0,0);
  run(`palaceRomanceTick();var pair=Object.values(S.palaceRomance.pairs)[0];pushEv(palaceRomanceEvent(pair));assert.match(curEv.choices[2].t,/课业/);choose(2);drain();assert.equal(pair.status,'ended');assert.notEqual(prince.away,true);`);
});
test('ambient cooldown follows the event across different women, persists, and extends for the same participant',()=>{
  const {run}=boot();run(`var [a,b]=harem(),first={title:'争执',cast:[a]},other={title:'争执',cast:[b]};
    assert.equal(ambientEventReady(first),true);rememberAmbientEvent(first);assert.equal(ambientEventReady(other),false);
    S.turn+=12;assert.equal(ambientEventReady(other),true);assert.equal(ambientEventReady(first),false);
    save('auto');A.load('auto');drain();assert.equal(ambientEventReady({title:'争执',cast:[byId(a.id)]}),false);
    S.turn+=6;assert.equal(ambientEventReady({title:'争执',cast:[byId(a.id)]}),true);
    var grave={title:'香囊疑案',por:byId(a.id)};rememberAmbientEvent(grave);S.turn+=23;assert.equal(ambientEventReady({...grave,por:byId(b.id)}),false);S.turn++;assert.equal(ambientEventReady(grave),true);`);
});
test('new pastimes obey traits, season, attendance and actual choice consequences only once',()=>{
  const {run}=boot();run(`var [a,b]=harem();a.trait='巧手';b.trait='好学';a.palace='景仁宫';a.talent=60;relAdd(a,b,30-relGet(a,b));
    S.month=7;assert.equal(PALACE_INITIATIVES.needleMoon.match(a),true);S.month=8;assert.equal(PALACE_INITIATIVES.needleMoon.match(a),false);S.month=7;
    a.initiative={id:'needleMoon',turn:S.turn,target:b.id,text:PALACE_INITIATIVES.needleMoon.text(a,b)};
    E().energy=4;var before=relGet(a,b);A.answerInitiative(a.id,false);assert.equal(curEv.cast.length,2);var act=curEv.choices[1].f;choose(1);drain();
    assert.equal(relGet(a,b),before+7);assert.equal(E().energy,3);assert.match(a.initiative.response,/德行/);assert.doesNotMatch(a.initiative.response,/undefined/);act();assert.equal(E().energy,3);assert.equal(relGet(a,b),before+7);
    a.initiative={id:'paperMending',turn:S.turn,target:b.id,text:'修书'};b.cold=true;assert.equal(initiativeParticipants(a,a.initiative),null);A.answerInitiative(a.id,false);assert.equal(modalOpen,false);
    b.cold=false;a.cold=true;assert.equal(initiativeParticipants(a,a.initiative),null);`);
});
test('grass play leaves a mother-child follow-up and initiative cooldown cannot rotate around the harem',()=>{
  const {run}=boot();run(`var [a,b]=harem();a.trait='活泼';var k=makeKid(a,'f','明昭');k.born=S.turn-72;S.month=4;
    var rule=PALACE_INITIATIVES.grassNames;assert.equal(rule.target(a).id,k.id);assert.equal(rule.match(a),true);
    a.initiativeEcho={id:'grassNames',turn:S.turn+1,target:k.id,impact:'keep'};S.turn++;historicEchoTick(a);assert.equal(a.initiativeEcho.delivered,true);assert.ok(k.story.some(s=>s.t.includes('草木簿')));
    var original=Object.fromEntries(Object.entries(PALACE_INITIATIVES).map(([id,r])=>[id,r.match]));
    for(const [id,r] of Object.entries(PALACE_INITIATIVES))r.match=()=>id==='paperMending';
    a.initiative=b.initiative=null;a.trait='巧手';b.trait='好学';a.hobby=b.hobby='读书';relAdd(a,b,30-relGet(a,b));S.flags.initiativeTurns={};
    initiativeTick();assert.equal(S.flags.initiativeTurns.paperMending,S.turn);a.initiative=b.initiative=null;S.turn+=11;initiativeTick();assert.notEqual(a.initiative?.id,'paperMending');assert.notEqual(b.initiative?.id,'paperMending');
    for(const [id,match] of Object.entries(original))PALACE_INITIATIVES[id].match=match;`);
});
