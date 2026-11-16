const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(782);b.ctx.assert=assert;b.run(`A.start();drain();S.turn=72;S.month=1;S.year=7;E().energy=8;S.rel={};
 var a=makeGirl({sur:'沈',given:'清微',age:22,trait:'温婉',fam:{t:'知府',p:38}}),b=makeGirl({sur:'顾',given:'兰音',age:23,trait:'活泼',fam:{t:'翰林学士',p:50}});
 for(var p of [a,b]){p.solitary=null;p.kin={};p.kinRival={};delete p.timeTraveler;}
 S.cands=[a,b];S.selection={phase:'roster',performed:[]};selectionBatch();var pair=linkSelectionFriends(a,b,{kind:'childhood',memory:'幼时在花宴相识，两家交好，常互通问候',score:42});
 assert.ok(pair,'fixture friends have comparable ages and upbringing');UI.view='xx';PalaceActions.reset();var take=(p,rank=2)=>{A.xxTake(p.id);choose(rank);drain();};
 var refresh=()=>{save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);};`);return b;}
for(const [left,right] of [[true,true],[true,false],[false,true],[false,false]])test(`friends' selection outcomes ${left}/${right} preserve people and replay once`,()=>{
 const w=world();w.run(`var aid=a.id,bid=b.id;if(${left})take(a);else A.xxDrop(a.id);refresh();b=selectionPeer(S.selection,bid);
 if(${right})take(b);else A.xxDrop(b.id);refresh();A.xxEnd();`);
 if(!left&&!right){w.run(`assert.equal(modalOpen,false);assert.equal(S.selection,undefined);assert.ok(!byId(aid)&&!byId(bid));`);return;}
 w.run(`assert.equal(curEv.title,${left&&right?"'留选后的悄悄话'":"'宫门前的私语'"});assert.match(curEv.text,/清微/);assert.match(curEv.text,/兰音/);refresh();
 choose(0);refresh();var kept=byId(${left?'aid':'bid'});assert.equal(kept.selectionBonds.length,1);assert.equal(kept.selectionBonds[0].otherKept,${left&&right});
 assert.ok(kept.story.some(x=>x.life?.title===${left&&right?"'留选后的悄悄话'":"'宫门前的私语'"}));
 var n=kept.story.length;drain();finishSelection();assert.equal(kept.story.length,n);assert.equal(modalOpen,false);assert.match(selectionCohortHTML(kept),/选秀交好/);`);
});
test('holding the final choice keeps the bond and choosing the opposite order gives the same farewell',()=>{
 const w=world();w.run(`var aid=a.id,bid=b.id;A.xxDrop(b.id);refresh();a=S.cands.find(x=>x.id===aid);take(a);refresh();A.xxEnd();
 assert.match(curEv.text,/沈清微获留选，顾兰音此次未留选/);choose(0);drain();assert.equal(byId(aid).selectionBonds[0].id,bid);assert.equal(byId(bid),undefined);`);
});
test('unprocessed candidates are dismissed at confirmation and still have a named farewell with retained friends',()=>{
 const w=world();w.run(`take(a);A.xxEnd();assert.equal(curEv.title,'宫门前的私语');choose(0);drain();assert.equal(S.cands.length,0);assert.equal(a.selectionBonds[0].name,'顾兰音');`);
});
test('month-end selection closure preserves its farewell through pending-event replay',()=>{
 const w=world();w.run(`var aid=a.id;take(a);A.endMonth();assert.ok([curEv,...Q].some(e=>e?.title==='宫门前的私语'));
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);drain();assert.equal(byId(aid).selectionBonds.length,1);
 assert.equal(byId(aid).selectionBonds[0].outcome,'farewell');`);
});
test('the threshold matches existing friendly relationships and neither low affinity nor rivalry is repaired by the ceremony',()=>{
 for(const patch of ['S.rel[rk(a,b)]=29','S.rel[rk(a,b)]=-30','a.kinRival[b.id]=1','b.kinRival[a.id]=1','S.selection.peerPairs=[]']){
  const w=world();w.run(`${patch};take(a);take(b);A.xxEnd();assert.equal(modalOpen,false);assert.ok(!a.selectionBonds&&!b.selectionBonds);`);
 }
 const w=world();w.run(`S.rel[rk(a,b)]=30;take(a);A.xxDrop(b.id);A.xxEnd();assert.equal(curEv.title,'宫门前的私语');`);
});
test('retaining a candidate preserves her actual friendship instead of rerolling it on admission',()=>{
 const w=world();w.run(`S.rel[rk(a,b)]=62;take(a);take(b);assert.equal(relGet(a,b),62);assert.match(relLine(a),/交好/);`);
});
for(const trait of ['温婉','善妒','沉静','活泼','聪慧','才女','骄矜'])test(`dialogue follows ${trait} for both retained and departing speakers`,()=>{
 const w=world();w.run(`a.trait='${trait}';a.rank=1;b.rank=3;var together=selectionPeerLine(a,b,true,true),leaving=selectionPeerLine(a,b,false,true);
 assert.ok(together&&leaving);assert.doesNotMatch(together+leaving,/undefined|NaN/);
 if(a.trait==='善妒'){assert.match(together,/位分比我高/);assert.match(leaving,/不甘/);}
 if(a.trait==='沉静')assert.match(together,/清静/);
 if(a.trait==='活泼')assert.match(together,/走错宫门/);
 if(a.trait==='聪慧')assert.match(together,/分寸/);
 if(a.trait==='才女')assert.match(together,/读完/);
 if(a.trait==='骄矜')assert.match(leaving,/朋友/);`);
});
test('solitary friends stay reserved, and cold or absent people do not attend a private conversation',()=>{
 const w=world();w.run(`a.solitary={path:'letters'};assert.match(selectionPeerLine(a,b,true,true),/清静/);take(a);take(b);a.cold=true;A.xxEnd();assert.equal(modalOpen,false);`);
});
test('friendship generation is bounded and views/reloads cannot reroll it',()=>{
 const w=world();w.run(`var seen=0;for(var i=0;i<12;i++){S.selection=undefined;S.cands=[];genCands(8);var pairs=S.selection.peerPairs||[];seen+=pairs.length;
 assert.ok(pairs.length<=2);var ids=pairs.flatMap(x=>[x.a,x.b]);assert.equal(new Set(ids).size,ids.length);
 for(const p of pairs)assert.ok(selectionFriendsClose(selectionPeer(S.selection,p.a),selectionPeer(S.selection,p.b)));
 var before=JSON.stringify(S);viewXX();assignSelectionFriendships();viewXX();assert.equal(JSON.stringify(S),before);}
 assert.ok(seen>0);PalaceActions.reset();save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
test('a real version 11 pending selection still replays and does not invent candidate friendships',()=>{
 const save=require('./fixtures/selection-friends-legacy-v11.json'),w=boot(782,new Map([['chengongji_v1_auto',JSON.stringify(save)]]));w.ctx.assert=assert;
 w.run(`A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'留牌子');assert.equal(S.selection.peerPairs,undefined);choose(0);drain();assert.equal(PalaceActions.blocked,false);`);
});

function family(){const w=boot(921);w.ctx.assert=assert;w.run(`A.start();drain();var c=harem()[0],g=makeKin(c,'亲');addConsort(g,2,'姐妹入宫');var h=houseOf(c),p=addNatalPerson(c,h,'f',22,791,false);
 p.married=false;p.willing=true;delete p.spouse;p.visit={host:c.id,until:S.turn+2};UI.view='natal';UI.sel=g.id+':'+p.id;PalaceActions.reset();`);return w;}
test('opening a guest through another sister resolves the real host and exposes a direct admission action',()=>{
 const w=family();w.run(`var e=natalEntry(g.id,p.id);assert.equal(e.c.id,c.id);assert.equal(natalRomanceReady(e.c,e.p),true);
 assert.match(viewNatalRelative(),/询问留宫意愿/);assert.match(viewNatalRelative(),/可纳为常在/);A.natalCourtship(g.id,p.id);assert.equal(curEv.title,'留宫之意');
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);choose(0);drain();assert.ok(byId(p.id));assert.equal(byId(p.id).natalOrigin.host,c.id);`);
});
test('the direct entry shows marriage and refusal reasons, allows unsettled marriage talks, and rejects stale or absent guests',()=>{
 for(const [patch,reason] of [["p.married=true",'已婚'],["p.declined=true",'宫外的生活'],["p.visit.until=S.turn",'探亲期间']]){
  const w=family();w.run(`${patch};assert.match(viewNatalRelative(),new RegExp('${reason}'));A.natalCourtship(g.id,p.id);assert.equal(modalOpen,false);`);
 }
 const w=family();w.run(`startBetrothal(c,p);assert.match(natalStatus(p),/入宫探亲 · 议亲中/);A.natalCourtship(g.id,p.id);assert.equal(curEv.title,'留宫之意');`);
});
test('every empress painting gets a head-mounted default crown and all awarded headpieces share that placement',()=>{
 const w=family();w.run(`for(const cell of CONSORT_PORTRAITS){
 const [cx,brow]=portraitHead(cell),fit=fittedPortraitJewelry(cell,8,'');assert.ok(fit,'default crown '+cell);assert.equal(fit.badge,undefined);
 assert.equal(fit.box[0]+fit.box[2]/2,cx);assert.ok(fit.box[1]+fit.box[2]*.42<brow);
 const svg=localPortrait(cell,8,'');assert.match(svg,/data-headpiece="0"/);assert.doesNotMatch(svg,/<circle/);
 for(const id of Object.keys(JEWELRY)){const f=fittedPortraitJewelry(cell,0,id);assert.ok(f.box[1]<brow);assert.equal(f.badge,undefined);assert.match(localPortrait(cell,0,'',id),/data-headpiece/);}
 }`);
});
