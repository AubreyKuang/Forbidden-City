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
  const math=Object.create(Math);let seed=seedValue,roll;
  math.random=()=>roll??((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const ctx=vm.createContext({Math:math,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    requestAnimationFrame:noop,setTimeout:noop,setInterval:noop,getComputedStyle:()=>({getPropertyValue:()=>'sans-serif'}),console,assert,confirm:()=>true,Date});
  runGameScripts(ctx);
  vm.runInContext(`var drain=()=>{for(let i=0;modalOpen&&i<150;i++){if($('#mbox').innerHTML.includes('onclick="nextEv()"'))nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));}};
    A.newGame();A.start();drain();`,ctx);
  return {ctx,storage,setRoll:value=>{roll=value;},run:code=>vm.runInContext(code,ctx)};
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

test('monthly court can be previewed repeatedly, including after loading, and resolved once',()=>{
  const {run}=boot();
  run(`
    E().energy=1;
    A.court();
    const preview=curEv.title, brief=JSON.stringify(S.flags.monthlyCourt);
    assert.equal(E().energy,1);
    choose(curEv.choices.length-1);
    save('1');load('1');
    A.court();
    assert.equal(curEv.title,preview);
    assert.equal(JSON.stringify(S.flags.monthlyCourt),brief);
    assert.equal(E().energy,1);
    choose(0);
    assert.equal(E().energy,0);
    assert.equal(S.flags.monthlyCourt.done,true);
    drain();A.court();
    assert.equal(modalOpen,false);
    S.turn++;
    A.court();
    assert.equal(S.flags.monthlyCourt.turn,S.turn);
  `);
});

test('a new reign previews the first flood memorial and keeps its result across the month',()=>{
  const {run}=boot();
  run(`
    A.court();
    assert.equal(curEv.title,'黄河决堤');
    assert.ok(curEv.choices[0].preview.includes('国库 −300 万两 · 民心 +10'));
    choose(0);drain();
    const host=empress();
    story(host,'陛下驾临闲话。');
    A.endMonth();
    assert.equal(S.flags.lastMonthReview.court.title,'黄河决堤');
    assert.ok(S.flags.lastMonthReview.people.some(person=>person.id===host.id));
    save('1');load('1');
    assert.match(viewLog(),/黄河决堤/);
    assert.match(viewLog(),/陛下驾临闲话/);
  `);
});

test('repairing a dike costs extra now and discounts exactly one later direct flood payment',()=>{
  const {run}=boot();
  run(`
    E().treasury=389;E().energy=1;E().people=50;E().prestige=50;
    A.court();
    const repair=()=>curEv.choices.findIndex(c=>c.t.includes('修复险堤'));
    assert.equal(curEv.choices[repair()].cond(),false);
    choose(repair());
    assert.equal(floodDikeReady(),false);
    choose(curEv.choices.length-1);
    E().treasury=390;
    A.court();choose(repair());
    assert.equal(E().treasury,0);
    assert.equal(E().energy,0);
    assert.equal(E().people,60);
    assert.equal(E().prestige,53);
    drain();A.endMonth();drain();save('1');load('1');
    assert.equal(floodDikeReady(),true);
    assert.match(viewMap(),/黄河险堤已加固/);
    const nextFlood=()=>{S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodNeed:'shelter'};};
    nextFlood();
    E().treasury=400;E().energy=1;
    A.court();
    assert.match(curEv.text,/先前加固的河堤/);
    assert.match(curEv.choices[0].preview,/国库 −160 万两/);
    assert.equal(repair(),-1);
    choose(curEv.choices.findIndex(c=>c.t.includes('全权办理')));drain();
    assert.equal(E().treasury,60);
    assert.equal(floodDikeReady(),true);
    A.endMonth();drain();nextFlood();
    E().treasury=160;E().energy=1;
    A.court();choose(0);drain();
    assert.equal(E().treasury,0);
    assert.equal(floodDikeReady(),false);
    assert.ok(S.log.some(entry=>entry.t.includes('省下 140 万两')));
    save('1');load('1');
    A.endMonth();drain();nextFlood();
    A.court();
    assert.match(curEv.choices[0].preview,/国库 −300 万两/);
    assert.ok(repair()>=0);
  `);
});

test('the first seasonal harvest and later locust memorial connect through a single saved grain reserve',()=>{
  const {run}=boot();
  run(`
    S.turn=5;S.month=8;S.flags.impeachmentSeen=true;
    E().treasury=100;E().people=50;E().energy=1;
    A.court();
    assert.equal(curEv.title,'五谷丰登');
    const option=text=>curEv.choices.findIndex(c=>c.t.includes(text));
    choose(option('留粮入常平仓'));drain();
    assert.equal(E().treasury,160);
    assert.equal(E().people,52);
    assert.equal(E().energy,0);
    assert.match(viewMap(),/常平仓有一批备荒粮/);
    save('1');load('1');
    assert.equal(grainReserveReady(),true);
    S.turn++;S.month=9;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:HARVEST_INDEX};
    A.court();
    assert.equal(option('留粮入常平仓'),-1);
    choose(option('稍后再议'));
    S.turn=12;S.year=2;S.month=3;
    E().energy=0;
    A.court();
    assert.equal(curEv.title,'蝗灾');
    assert.equal(curEv.choices[option('开仓放粮')].cond(),false);
    choose(option('发放常平仓储粮'));drain();
    assert.equal(E().treasury,160);
    assert.equal(E().people,58);
    assert.equal(E().energy,0);
    assert.equal(grainReserveReady(),false);
    save('1');load('1');
    S.turn++;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX};
    A.court();
    assert.equal(option('发放常平仓储粮'),-1);
  `);
});

test('selling stored grain takes one energy, saves the proceeds, and removes the free locust option',()=>{
  const {run}=boot();
  run(`
    S.flags.grainReserveGen=S.gen;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX};
    E().treasury=60;E().energy=0;
    assert.match(viewMap(),/查看常平仓/);
    A.grainReserve();
    assert.equal(curEv.title,'常平仓');
    assert.match(curEv.choices[0].preview,/国库 \\+100 万两/);
    assert.equal(curEv.choices[0].cond(),false);
    choose(0);
    assert.equal(E().treasury,60);
    choose(1);
    assert.equal(grainReserveReady(),true);
    E().energy=2;
    A.grainReserve();choose(1);
    assert.equal(E().energy,2);
    assert.equal(E().treasury,60);
    A.grainReserve();choose(0);
    assert.equal(E().treasury,160);
    assert.equal(E().energy,1);
    assert.match(S.log.at(-1).t,/售出常平仓储粮/);
    drain();
    assert.equal(load('auto'),true);
    assert.equal(E().treasury,160);
    assert.equal(E().energy,1);
    assert.equal(grainReserveReady(),false);
    assert.doesNotMatch(viewMap(),/查看常平仓/);
    A.grainReserve();
    assert.equal(modalOpen,false);
    A.court();
    assert.equal(curEv.title,'蝗灾');
    assert.equal(curEv.choices.some(c=>c.t.includes('发放常平仓储粮')),false);
  `);
});

test('transporting stored grain requires silver and energy, extends relief, and spends the reserve once',()=>{
  const {run}=boot();
  run(`
    S.flags.grainReserveGen=S.gen;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX};
    E().treasury=69;E().energy=1;E().people=50;
    A.court();
    const option=text=>curEv.choices.findIndex(c=>c.t.includes(text));
    const transport=option('调储粮，拨银运送');
    assert.equal(curEv.choices[transport].cond(),false);
    choose(transport);
    E().treasury=70;E().energy=0;
    assert.equal(curEv.choices[transport].cond(),false);
    assert.equal(curEv.choices[option('发放常平仓储粮')].cond(),true);
    choose(option('稍后再议'));
    assert.equal(grainReserveReady(),true);
    E().energy=1;
    A.court();choose(option('调储粮，拨银运送'));drain();
    assert.equal(load('auto'),true);
    assert.deepEqual([E().treasury,E().energy,E().people,grainReserveReady()],[0,0,60,false]);
    S.turn++;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:LOCUST_INDEX};
    A.court();
    assert.equal(option('调储粮，拨银运送'),-1);
    assert.equal(option('发放常平仓储粮'),-1);
  `);
});

test('delegating the exam resolves the memorial without spending the last energy point',()=>{
  const {run}=boot();
  run(`
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:2};
    E().energy=0;
    const prestige=E().prestige;
    A.court();
    assert.equal(curEv.title,'殿试');
    choose(0);
    assert.equal(S.flags.monthlyCourt.done,undefined);
    choose(1);
    assert.equal(E().energy,0);
    assert.equal(E().prestige,prestige+1);
    assert.equal(S.flags.monthlyCourt.done,true);
  `);
});

test('relief delegation trades treasury and some relief for a free action, once across reloads',()=>{
  const {run}=boot();
  run(`
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:0};
    E().energy=1;E().treasury=339;E().people=50;
    A.court();
    let delegate=curEv.choices.findIndex(c=>c.t.includes('全权办理'));
    assert.equal(curEv.choices[delegate].cond(),false);
    choose(delegate);
    assert.equal(S.flags.monthlyCourt.done,undefined);
    choose(curEv.choices.length-1);
    E().treasury=340;
    A.court();choose(curEv.choices.findIndex(c=>c.t.includes('全权办理')));
    assert.equal(E().energy,1);
    assert.equal(E().treasury,0);
    assert.equal(E().people,56);
    drain();save('1');load('1');A.court();
    assert.equal(modalOpen,false);
    assert.equal(E().treasury,0);
  `);
});

test('monthly flood names both specialists and persists the need that determines their odds',()=>{
  for(const need of ['grain','shelter']){
    const {run,setRoll}=boot();
    run(`
      const [grain,shelter]=harem();
      houseOf(grain).father.office='户部侍郎';
      houseOf(shelter).father.office='两江总督';
      const shelterId=shelter.id,grainId=grain.id;
      S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodNeed:'${need}'};
      E().treasury=264;E().energy=1;
      A.court();
      assert.match(curEv.text,/${need==='grain'?'最缺粮':'急需人手'}/);
      const find=label=>curEv.choices.find(c=>c.t.includes(label));
      assert.match(find('调运赈粮').preview,/成功率 ${need==='grain'?80:55}%/);
      assert.match(find('安置灾民').preview,/成功率 ${need==='shelter'?80:55}%/);
      assert.equal(find('安置灾民').cond(),false);
      choose(curEv.choices.length-1);save('1');load('1');
      E().treasury=265;E().people=50;E().prestige=50;
      const c=byId(shelterId);
      c.mood=50;c.aff=50;c.fam.p=60;
      const otherPower=byId(grainId).fam.p;
      A.court();
      assert.match(curEv.text,/${need==='grain'?'最缺粮':'急需人手'}/);
      assert.equal(find('安置灾民').cond(),true);
    `);
    setRoll(.60);
    run(`
      choose(curEv.choices.indexOf(find('安置灾民')));
      assert.equal(E().treasury,${need==='shelter'?50:0});
      assert.equal(E().people,${need==='shelter'?59:45});
      assert.equal(E().prestige,${need==='shelter'?52:50});
      assert.equal(E().energy,0);
      assert.equal(c.mood,${need==='shelter'?60:38});
      assert.equal(c.aff,${need==='shelter'?58:50});
      assert.equal(c.fam.p,${need==='shelter'?65:60});
      assert.equal(byId(grainId).fam.p,otherPower);
      assert.equal(S.flags.monthlyCourt.result.person,shelterId);
      drain();save('1');load('1');A.court();
      assert.equal(modalOpen,false);
    `);
  }
});

test('a flood relief follow-up remembers the district need and spends grain only if it fits',()=>{
  for(const need of ['grain','shelter']){
    const {run}=boot();
    run(`
      S.flags.grainReserveGen=S.gen;
      S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodNeed:'${need}'};
      E().treasury=200;E().energy=1;
      const option=label=>curEv.choices.findIndex(c=>c.t.includes(label));
      A.court();choose(option('先拨急赈'));drain();
      assert.equal(load('auto'),true);
      A.endMonth();drain();
      E().treasury=49;E().energy=1;E().people=50;E().prestige=50;
      A.court();
      assert.equal(S.flags.monthlyCourt.floodNeed,'${need}');
      if('${need}'==='grain'){
        assert.equal(option('借驻军'),-1);
        const freight=option('调常平仓粮');
        assert.equal(curEv.choices[freight].cond(),false);
        choose(freight);
        E().treasury=50;
        assert.equal(curEv.choices[freight].cond(),true);
        choose(freight);drain();
        assert.equal(load('auto'),true);
        assert.deepEqual([E().treasury,E().energy,E().people,E().prestige,grainReserveReady()],[0,0,54,50,false]);
        assert.equal(S.flags.monthlyCourt.done,true);
      }else{
        assert.equal(option('调常平仓粮'),-1);
        assert.match(curEv.text,/仍缺人手/);
        assert.equal(grainReserveReady(),true);
        const barracks=option('借驻军');
        assert.equal(curEv.choices[barracks].cond(),false);
        E().treasury=80;E().energy=0;
        assert.equal(curEv.choices[barracks].cond(),false);
        E().energy=1;
        const armyBefore=S.courtPolicy?.army||0;
        choose(barracks);drain();
        assert.equal(load('auto'),true);
        assert.deepEqual([E().treasury,E().energy,E().people,E().prestige,grainReserveReady()],[0,0,55,50,true]);
        assert.equal(S.courtPolicy.army,Math.min(30,armyBefore+8));
        assert.equal(S.flags.monthlyCourt.done,true);
      }
    `);
  }
});

test('flood installments postpone half the cost and consume the next monthly memorial once',()=>{
  const {run}=boot();
  run(`
    const option=label=>curEv.choices.findIndex(c=>c.t.includes(label));
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX};
    E().energy=1;E().treasury=149;E().people=50;
    A.court();choose(option('先拨急赈'));
    assert.equal(E().treasury,149);
    assert.equal(S.flags.floodRelief,undefined);
    choose(option('稍后再议'));
    E().treasury=150;
    A.court();choose(option('先拨急赈'));
    assert.equal(E().treasury,0);
    assert.equal(E().people,54);
    assert.equal(E().energy,0);
    drain();save('1');load('1');
    assert.equal(S.flags.floodRelief.turn,S.turn+1);
    assert.doesNotMatch(viewMap(),/赈灾回奏待阅/);
    A.endMonth();drain();
    assert.match(viewMap(),/查看赈灾回奏/);
    A.finishMonth();
    assert.match(curEv.text,/直接换月会停止续拨，民心 −3/);
    choose(option('留在本月'));
    E().treasury=149;E().people=50;E().prestige=50;E().energy=1;
    A.court();assert.match(curEv.title,/赈灾回奏/);
    assert.equal(option('全权办理'),-1);
    choose(option('拨清余款'));
    assert.equal(E().treasury,149);
    assert.equal(E().energy,1);
    choose(option('稍后再议'));save('1');load('1');
    assert.match(viewMap(),/查看赈灾回奏/);
    E().treasury=150;
    A.court();choose(option('拨清余款'));
    assert.equal(E().treasury,0);
    assert.equal(E().energy,0);
    assert.equal(E().people,55);
    assert.equal(E().prestige,52);
    drain();save('1');load('1');A.court();
    assert.equal(modalOpen,false);
    assert.equal(E().treasury,0);
    assert.equal(S.flags.floodRelief,undefined);
  `);
});

test('unfunded flood relief reduces public support once whether declined or left unread',()=>{
  for(const action of ['stop','unread','defer']){
    const {run}=boot();
    run(`
      const action='${action}';
      S.flags.floodRelief={turn:S.turn,gen:S.gen};
      E().treasury=500;E().people=50;E().energy=0;
      if(action!=='unread'){
        A.court();
        choose(action==='stop'?1:curEv.choices.length-1);
        assert.equal(E().people,action==='stop'?47:50);
        assert.equal(E().energy,0);
        assert.equal(E().treasury,500);
      }
      drain();save('1');load('1');A.endMonth();
      assert.equal(E().people,47);
      assert.match(S.flags.lastMonthReview.court.text,/民心\\s*[−-]\\s*3/);
      assert.equal(S.flags.floodRelief,undefined);
      drain();assert.doesNotMatch(viewMap(),/赈灾回奏待阅/);
    `);
  }
});

test('the first eligible impeachment is offered by the fourth month, while the opening flood stays in place',()=>{
  const {run}=boot();
  run(`
    A.court();
    assert.equal(curEv.title,'黄河决堤');
    choose(curEv.choices.length-1);
    for(let i=0;i<3;i++){A.endMonth();drain();}
    assert.equal(S.turn,3);
    A.court();
    assert.equal(curEv.title,'御史弹劾');
    assert.match(curEv.text,/两份账目[相不]/);
    assert.equal(S.flags.impeachmentSeen,true);
    const file=JSON.stringify(S.flags.monthlyCourt.impeachment);
    choose(curEv.choices.length-1);
    save('1');load('1');A.court();
    assert.equal(JSON.stringify(S.flags.monthlyCourt.impeachment),file);
    assert.equal(S.flags.impeachmentSeen,true);
  `);
});

test('a sealed impeachment keeps the same evidence across months and saves, then resolves once',()=>{
  const {run}=boot();
  run(`
    const person=harem()[0].id;
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:IMPEACHMENT_INDEX,person,
      impeachment:{person,matching:false,guilty:false}};
    E().energy=1;
    A.court();
    assert.match(curEv.text,/抄账记着只入库二十万两.*库房摘要记着入库一百万两/);
    assert.doesNotMatch(curEv.text,/已全数入库/);
    choose(curEv.choices.findIndex(c=>c.t.includes('封存账册')));
    assert.equal(E().energy,0);
    assert.equal(S.flags.monthlyCourt.done,true);
    assert.equal(S.flags.impeachmentReview.turn,S.turn+1);
    drain();A.endMonth();drain();save('1');load('1');
    assert.match(viewMap(),/查账回奏待阅/);
    A.court();
    assert.match(curEv.text,/查得原始签押，赈银已全数入库/);
    assert.equal(curEv.choices.some(c=>c.t.includes('封存账册')),false);
    assert.equal(S.flags.impeachmentReview,undefined);
    choose(curEv.choices.length-1);
    save('1');load('1');A.court();
    const before=E().prestige;
    choose(0);
    assert.equal(E().prestige,before+1);
    assert.equal(S.flags.monthlyCourt.done,true);
    drain();A.court();
    assert.equal(modalOpen,false);
  `);
});

test('impeachment review offers rulings that reflect the proven outcome',()=>{
  for(const guilty of [true,false]){
    const {run}=boot();
    run(`
      const c=harem()[0];
      c.mood=50;c.aff=50;
      E().people=50;E().prestige=50;E().energy=1;
      const treasury=E().treasury,familyPower=c.fam.p;
      S.flags.impeachmentReview={turn:S.turn,gen:S.gen,file:{person:c.id,matching:false,guilty:${guilty}}};
      A.court();
      assert.match(curEv.title,/查账回奏/);
      assert.equal(curEv.choices.length,${guilty?4:3});
      assert.equal(curEv.choices[0].t,'${guilty?'革职，追回赈银':'公布原簿，还其清白'}（精力 −1）');
      assert.equal(curEv.choices[1].t,'${guilty?'责令退银，留任察看':'私下告知查实结果，撤销弹劾'}（精力 −1）');
      choose(1);
      assert.equal(E().energy,0);
      assert.equal(E().treasury,treasury+${guilty?80:0});
      assert.equal(E().people,${guilty?52:50});
      assert.equal(E().prestige,${guilty?48:50});
      assert.equal(c.aff,${guilty?50:60});
      assert.equal(c.mood,${guilty?42:56});
      assert.equal(c.fam.p,familyPower);
      assert.equal(S.flags.monthlyCourt.done,true);
    `);
  }
});

test('a proven case can direct fifty of the eighty recovered taels to relief and retain the official',()=>{
  const {run}=boot();
  run(`
    const c=harem()[0], id=c.id, power=c.fam.p, title=c.fam.t;
    c.mood=50;E().people=50;E().prestige=50;E().energy=0;E().treasury=0;
    S.flags.impeachmentReview={turn:S.turn,gen:S.gen,file:{person:id,matching:true,guilty:true}};
    A.court();
    const order=curEv.choices.findIndex(choice=>choice.t.includes('退银直拨灾区'));
    assert.equal(curEv.choices[order].cond(),false);
    choose(order);
    E().energy=1;
    choose(order);drain();
    assert.equal(load('auto'),true);
    assert.deepEqual([E().treasury,E().people,E().prestige,E().energy],[30,55,51,0]);
    assert.deepEqual([byId(id).fam.t,byId(id).fam.p,byId(id).mood],[title,power,38]);
    assert.equal(S.flags.monthlyCourt.done,true);
    A.court();
    assert.equal(modalOpen,false);
  `);
});

test('relief suspension follows the same official across saves and ends after three subsequent turns',()=>{
  const {run}=boot();
  run(`
    const c=harem()[0],id=c.id;
    const father=houseOf(c).father;
    father.office='户部侍郎';
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodNeed:'grain'};
    const appointment=()=>curEv.choices.some(choice=>choice.person===id&&choice.t.includes('督办'));
    A.court();
    assert.equal(appointment(),true);
    choose(curEv.choices.length-1);
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:IMPEACHMENT_INDEX,review:true,
      impeachment:{person:id,matching:true,guilty:true}};
    E().energy=1;
    A.court();choose(curEv.choices.findIndex(choice=>choice.t.includes('退银直拨灾区')));drain();
    assert.equal(load('auto'),true);
    assert.equal(houseOf(byId(id)).father.office,'户部侍郎');
    assert.match(houseLine(byId(id)),/停办赈务中/);
    for(let month=1;month<=4;month++){
      S.turn++;
      S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:FLOOD_INDEX,floodNeed:'grain'};
      A.court();
      assert.equal(appointment(),month===4);
      if(month<4)assert.match(curEv.text,/仍在停办赈务期间/);
      choose(curEv.choices.length-1);
    }
    assert.doesNotMatch(houseLine(byId(id)),/停办赈务中/);
  `);
});

test('an ineligible impeachment subject frees the next month for a regular memorial',()=>{
  const {run}=boot();
  run(`
    const c=harem()[0];
    S.flags.impeachmentReview={turn:S.turn,gen:S.gen,file:{person:c.id,matching:true,guilty:true}};
    houseOf(c).father.alive=false;
    assert.doesNotMatch(viewMap(),/查账回奏待阅/);
    A.court();
    assert.doesNotMatch(curEv.title,/查账回奏/);
    assert.equal(S.flags.impeachmentReview,undefined);
    assert.ok(S.log.some(entry=>entry.t.includes('已归档')));
  `);
});

test('ruling immediately on the same innocent case costs prestige and damages the relationship',()=>{
  const {run}=boot();
  run(`
    const c=harem()[0];
    S.flags.monthlyCourt={turn:S.turn,gen:S.gen,index:IMPEACHMENT_INDEX,person:c.id,
      impeachment:{person:c.id,matching:false,guilty:false}};
    const prestige=E().prestige,aff=c.aff;
    A.court();choose(0);
    assert.match($('#mbox').innerHTML,/收回成命/);
    assert.equal(E().prestige,prestige-5);
    assert.equal(c.aff,aff-8);
    assert.equal(S.flags.impeachmentReview,undefined);
  `);
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

test('twenty-six princes and twenty-six princesses keep distinct faces as they age and after loading',()=>{
  const {run}=boot(15);
  const cells=JSON.parse(run(`JSON.stringify((()=>{
    const [mother,other]=harem();
    const sons=Array.from({length:26},(_,i)=>makeKid(mother,'m','皇子'+i));
    const daughters=Array.from({length:26},(_,i)=>makeKid(mother,'f','公主'+i));
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
  assert.equal(new Set(cells.stages.flat()).size,156);
  assert.ok(cells.stages[0].slice(0,10).some(cell=>cell>=136),'newborns can use expanded art from the first births');
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
