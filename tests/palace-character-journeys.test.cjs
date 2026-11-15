const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot:world}=require('./playtest-harness.cjs');
function boot(){const b=world(819);b.ctx.assert=assert;b.run(`A.newGame();A.start();drain();S.turn=36;var c=makeGirl({sur:'沈',given:'知微',trait:'才女',age:36,fam:{t:'翰林学士',p:50}});delete c.solitary;addConsort(c,3,'测试');deepen(c);c.hp=80;c.aff=80;c.mood=70;c.wound='quiet';S.turn+=6;E().energy=20;PalaceActions.reset();
 var setupJourney=id=>{var gate=CHARACTER_JOURNEYS[id].gate;delete c.journeys;c.enteredAt=S.turn-12;
  if(gate==='craft')c.trait='巧手';if(gate==='merchant')c.fam.t='皇商';if(gate==='humble')c.fam.p=5;
  if(gate==='noble'){c.fam.p=90;c.trait='持重';}if(gate==='medical')c.fam.t='太医院院判';
  if(gate==='military'){houseOf(c).father.alive=true;houseOf(c).father.office='镇国大将军';}
  if(gate==='five'){var h=houseOf(c);for(var j=0;j<5;j++)h[j?'brother'+(j+1):'brother']={id:'b'+j,name:'沈兄'+j,alive:true,age:40+j,story:[]};h.fiveBrothers={sister:c.id,birthOrder:6};}
  if(gate==='sister'){var sister=makeGirl({age:34,trait:'温婉',fam:c.fam});delete sister.solitary;addConsort(sister,2,'测试');c.kin={[sister.id]:'亲妹'};}
  if(['quietChild','teenChild','bereaved'].includes(gate)){var k=makeKid(c,'f','清和');k.born=S.turn-(gate==='teenChild'?168:72);k.pendingName=false;
   if(gate==='quietChild')c.solitary={path:'both',stage:0,history:[]};maternalTick();
   if(gate==='bereaved'){k.alive=false;maternalTick();S.turn+=3;}}
  if(gate==='rescued')c.rescue={at:S.turn-12,trust:70,familyContact:'unknown'};
 };`);return b;}
for(const id of ['ownName','needle','ledger','reed','borderLetter','fiveBrothers','sisters','silk','medicine','quietChild','growingChild','keepsake','distantHome']){
 test('three-chapter journey '+id+' keeps all eight decision paths and final outcomes',()=>{
  for(let mask=0;mask<8;mask++){const {run,ctx}=boot();ctx.topic=id;ctx.mask=mask;
   run(`setupJourney(topic);assert.equal(journeyStart(c,topic),true);var originalArc=JSON.stringify(c.arc),startEnergy=E().energy;
    for(var st=0;st<3;st++){var ev=journeyEvent(c);assert.ok(ev,topic);assert.equal(ev.valid(),true);var pickIndex=(mask>>st)&1;var result=ev.choices[pickIndex].f();assert.ok(result.length>12);assert.equal(ev.choices[pickIndex].f(),null);if(st<2){assert.equal(journeyEvent(c),null);S.turn+=3;}}
    assert.equal(c.journeys.current,undefined);assert.equal(c.journeys.history.length,3);assert.equal(E().energy,startEnergy-3);assert.equal(JSON.stringify(c.arc),originalArc);
    assert.ok(CHARACTER_JOURNEYS[topic].endings.includes(c.journeys.history.at(-1).outcome));assert.equal(journeyStart(c,topic),false);
    if(topic==='distantHome')assert.equal(c.rescue.familyContact,(mask&3)===0?'confirmed':'uncertain');
    var before=JSON.stringify(c.journeys);S=JSON.parse(JSON.stringify(S));c=byId(c.id);assert.equal(JSON.stringify(c.journeys),before);assert.match(journeyPanel(c),/人生长卷/);`);
  }
 });
}
test('all nineteen traits have distinct age-specific mothering, and solitary tenderness remains independent',()=>{
 const {run}=boot();run(`assert.equal(Object.keys(MATERNAL_STYLES).length,20);var k=makeKid(c,'f','清和'),lines=new Set();
 for(var trait of Object.keys(TRAITS)){c.trait=trait;var ages=[];for(var age of [1,7,15]){k.born=S.turn-age*12;var a=maternalActivity(k,c,false);ages.push(a.mother);assert.ok(a.mother.includes(k.name));}assert.equal(new Set(ages).size,3);lines.add(ages[1]);}assert.equal(lines.size,19);
 c.solitary={path:'both',stage:0,history:[]};k.born=S.turn-60;assert.match(maternalActivity(k,c,false).mother,/温柔|笑意/);spendFamilyTime(k,c,false);assert.match(k.motherBonds[c.id].motherView,/笑意/);assert.equal(consortVoicePool(c)[0].key,'maternal-near');`);
});
test('adoption, denied visits, exile, missing and death remain different without false funerals',()=>{
 const {run}=boot();run(`var k=makeKid(c,'m','承晏');k.born=S.turn-48;k.pendingName=false;maternalTick();var other=harem().find(x=>x!==c);doFoster(k,other);maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'foster');
 k.visitRule='closed';maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'closed');assert.doesNotMatch(maternalVoice(c).lines.join(''),/离世|超度/);
 k.away=true;maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'away');
 k.alive=false;k.lost=true;maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'missing');assert.match(maternalVoice(c).lines.join(''),/不能当作/);
 delete k.lost;maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'death');var length=c.story.length,mood=c.mood;maternalTick();maternalTick();assert.equal(c.story.length,length);assert.equal(c.mood,mood);
 assert.equal(other.maternalLife.children[k.id].kind,'death');`);
});
test('long grief remembers the specific child, preserves beliefs and cannot be cured with one gift',()=>{
 const {run}=boot();run(`c.solitary={path:'dao',stage:0,history:[]};var k=makeKid(c,'f','清和');k.pendingName=false;maternalTick();k.alive=false;maternalTick();S.turn+=6;maternalTick();assert.equal(c.maternalLife.children[k.id].retreat,'静室问道');
 setXin(c,'释然','收到赏赐');assert.equal(xinOf(c),'悲恸');assert.equal(solitaryReady(c),false);
 var e=maternalCareEvent(c,k.id);e.choices[0].f();assert.equal(xinOf(c),'悲恸');assert.equal(e.choices[0].f(),null);assert.equal(maternalCareEvent(c,k.id),null);
 S=JSON.parse(JSON.stringify(S));c=byId(c.id);k=kidById(k.id);assert.equal(c.maternalLife.children[k.id].care,1);assert.match(maternalPanel(c),/清和.*丧子追思/);`);
});
test('a changed participant ends a bound journey rather than substituting another child or dead father',()=>{
 const {run}=boot();run(`setupJourney('quietChild');journeyStart(c,'quietChild');var bound=c.journeys.current.binding.child;journeyEvent(c).choices[0].f();kidById(bound).away=true;S.turn+=3;var e=journeyEvent(c);assert.match(e.title,/时移事易/);e.choices[0].f();assert.equal(c.journeys.history.at(-1).outcome,'未竟');
 delete c.journeys;setupJourney('borderLetter');journeyStart(c,'borderLetter');journeyEvent(c).choices[0].f();houseOf(c).father.alive=false;S.turn+=3;assert.match(journeyEvent(c).title,/时移事易/);`);
});
test('home leave excludes palace encounters, conversations and dinners but retains rank and residence',()=>{
 const {run}=boot();run(`var rank=c.rank,palace=c.palace,k=makeKid(c,'f','清和');var energy=E().energy;assert.equal(startHomeLeave(c,2,'探病'),true);assert.equal(inPalace(c),false);assert.equal(harem().includes(c),false);assert.equal(familyVisitAllowed(k,c),false);assert.equal(journeyEvent(c),null);npcSync();assert.equal(NPC.has(c.id),false);
 UI.sel=c.id;UI.view='consort';var html=viewConsort();assert.match(html,/暂离宫中/);assert.doesNotMatch(html,/onclick="A.night/);A.chat(c.id);assert.equal(E().energy,energy);
 S=JSON.parse(JSON.stringify(S));c=byId(c.id);S.turn++;homeLeaveTick();assert.ok(c.homeLeave);S.turn++;homeLeaveTick();assert.equal(c.homeLeave,undefined);assert.equal(inPalace(c),true);assert.equal(c.rank,rank);assert.equal(c.palace,palace);assert.match(c.story.at(-1).t,/按约/);
 c.preg=5;assert.equal(startHomeLeave(c),false);c.preg=0;assert.ok(startHomeLeave(c,3));assert.ok(returnHomeLeave(c,true));`);
});
test('sick mother stays home, dispatches a physician or permits a bounded visit without claiming a cure',()=>{
 const {run}=boot();run(`var ev=sickMotherEvent(c);assert.ok(ev);assert.ok(ev.choices.every(x=>!x.t.includes('入宫')));var money=E().treasury;ev.choices[0].f();assert.equal(E().treasury,money-15);assert.equal(c.visitor,undefined);assert.equal(ev.choices[0].f(),null);
 c.rescue={};assert.equal(sickMotherEvent(c),null);assert.equal(momVisitState(c).ready,false);delete c.rescue;c.wound='mom';assert.equal(sickMotherEvent(c),null);`);
});
test('market rescue is adult, not automatic enrollment, and all exit paths are genuine',()=>{
 for(const option of [0,1,2]){const {run,ctx}=boot();ctx.option=option;run(`var ev=marketRescueEvent();pushEv(ev);choose(0);assert.equal(curEv.title,'获救之后');var n=S.consorts.length;choose(option);assert.equal(S.consorts.length,n);drain();
 assert.equal(marketRescueEvent(),null);if(option===1){var g=S.shelteredGuests[0];assert.ok(g.age>=18);assert.ok(g.rescuedGuest);assert.equal(houseOf(g),null);assert.match(rescuedGuestsPanel(),/尚未册封/);assert.ok(!rescuedGuestEvent(g).choices.some(x=>x.t.includes('册为')));}
 else assert.equal(S.shelteredGuests,undefined);`);}
});
test('guest trust and family evidence persist; optional enrollment does not fabricate relatives',()=>{
 const {run}=boot();run(`pushEv(marketRescueEvent());choose(0);choose(1);drain();var g=S.shelteredGuests[0];
 for(var j=0;j<2;j++){var ev=rescuedGuestEvent(g);ev.choices[0].f();assert.equal(ev.choices[0].f(),null);S.turn+=3;}assert.equal(g.rescue.trust,50);
 assert.equal(journeyStart(g,'distantHome'),true);journeyEvent(g).choices[0].f();S.turn+=3;journeyEvent(g).choices[0].f();S.turn+=3;journeyEvent(g).choices[0].f();assert.equal(g.rescue.familyContact,'confirmed');
 var ev=rescuedGuestEvent(g),join=ev.choices.find(x=>x.t.includes('册为'));assert.ok(join);join.f();assert.ok(S.consorts.includes(g));assert.equal(S.shelteredGuests.includes(g),false);assert.equal(houseOf(g),null);assert.equal(g.wound,'exile');assert.equal(g.wish,'rescueLetter');
 S=JSON.parse(JSON.stringify(S));g=byId(g.id);assert.equal(g.rescue.familyContact,'confirmed');assert.match(rescueVoice(g).lines[0],/远处/);UI.sel=g.id;assert.ok(viewConsort().length);assert.ok(viewFamily().length);`);
});
test('prejudice has named actors, differentiated temperaments, persistent consequences and shared cooldown',()=>{
 const {run}=boot();run(`c.fam={t:'西域流寓',p:5};c.rescue={trust:40};for(var o of harem())if(o!==c){o.fam.p=90;o.trait='持重';delete o.solitary;}
 var a=harem().find(x=>x!==c);assert.equal(originAttitude(a,c),'reserved');a.trait='骄纵';assert.equal(originAttitude(a,c),'mock');a.solitary={path:'letters'};assert.equal(originAttitude(a,c),'reserved');delete a.solitary;
 var ev=originPressureEvent();assert.ok(ev);ev.onQueue();assert.equal(originPressureEvent(),null);var result=ev.choices[0].f();assert.match(result,/出身/);assert.equal(ev.choices[0].f(),null);assert.ok(c.rescue.trust>40);assert.ok(c.story.some(e=>e.t===result));`);
});
test('married events append once to the same newest-first character chronicle',()=>{
 const {run}=boot();run(`var k=makeKid(c,'m','承晏');k.born=S.turn-216;k.married=true;k.spouse={name:'许清',born:S.turn-216,alive:true,seed:999};ensureMarriedLife(k);kstory(k,'幼时读书');householdRecord(k,'test','夫妻共写一封信');var n=k.story.filter(e=>e.t==='夫妻共写一封信').length;assert.equal(n,1);
 UI.view='kid';UI.sel=k.id;var html=viewKid();assert.match(html,/人物纪事/);assert.doesNotMatch(html,/成长记|婚后家事/);assert.match(html,/人生篇章/);assert.equal(detailStory(k).split('夫妻共写一封信').length-1,1);assert.equal(k.story.filter(e=>e.t==='夫妻共写一封信').length,1);assert.ok(detailStory(k).indexOf('夫妻共写一封信')<detailStory(k).indexOf('幼时读书'));`);
});
test('refresh restores pending journey choices and settled results without charging twice',()=>{
 const {run}=boot();run(`setupJourney('quietChild');A.journeyBegin(c.id,'quietChild');assert.ok(modalOpen);var energy=E().energy;assert.ok(save('1'));A.load('1');c=byId(c.id);assert.match(curEv.title,/被弄皱的书/);choose(0);assert.equal(E().energy,energy-1);assert.ok(save('1'));A.load('1');c=byId(c.id);assert.equal(PalaceActions.blocked,false);assert.equal(E().energy,energy-1);assert.equal(c.journeys.current.stage,1);assert.equal(c.journeys.history.length,1);drain();`);
});
test('rescue disposition choice survives refresh without enrolling or duplicating a guest',()=>{
 const {run}=boot();run(`pushEv(marketRescueEvent());choose(0);assert.equal(curEv.title,'获救之后');choose(1);drain();assert.ok(save('1'));A.load('1');assert.equal(S.shelteredGuests.length,1);assert.equal(S.consorts.some(c=>c.rescue),false);var g=S.shelteredGuests[0];A.rescuedGuest(g.id);choose(0);assert.ok(save('1'));A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(S.shelteredGuests[0].rescue.trust,35);drain();`);
});
test('new background keys cannot spread to unrelated women and rescued identity survives migration',()=>{
 const {run}=boot();run(`for(var i=0;i<100;i++){var p=makeGirl();deepen(p);assert.notEqual(p.wound,'exile');assert.notEqual(p.wish,'rescueLetter');}pushEv(marketRescueEvent());choose(0);choose(1);drain();var g=S.shelteredGuests[0];assert.equal(woundOK(g,'mom'),false);assert.equal(wishOK(g,'brother'),false);assert.equal(woundOK(g,'exile'),true);`);
});
test('a solitary mother may withdraw after long separation from a living child without calling it death',()=>{
 const {run}=boot();run(`c.solitary={path:'letters',stage:0,history:[]};var k=makeKid(c,'f','清和');k.born=S.turn-72;maternalTick();k.templeStay={from:S.turn,due:null};maternalTick();S.turn+=6;maternalTick();assert.equal(c.maternalLife.children[k.id].retreat,'闭门少言');assert.doesNotMatch(maternalVoice(c).lines.join(''),/离世|超度/);delete k.templeStay;maternalTick();assert.equal(c.maternalLife.children[k.id].kind,'near');assert.equal(c.maternalLife.children[k.id].retreat,undefined);assert.match(c.maternalLife.children[k.id].history.at(-1).text,/回到身边/);`);
});
