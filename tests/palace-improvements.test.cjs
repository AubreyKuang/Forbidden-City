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
