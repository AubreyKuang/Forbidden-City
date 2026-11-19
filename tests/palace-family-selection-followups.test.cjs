const test=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs');
const {boot}=require('./playtest-harness.cjs');
function setup(){const b=world();b.ctx.assert=assert;return b;}

test('paternal and maternal recommendations share one niece through selection, reload and admission',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,br,agree(ref,br));var niece=addNatalPerson(other,oh,'f',18,170,false);
 niece.parentRelativeId=sister.id;niece.fatherId=h.brother.id;niece.fatherName=h.brother.name;niece.married=false;
 niece.sur=c.sur;niece.name=niece.sur+niece.given;while(!restlessDisposition(niece))niece.seed++;
 var girlId=niece.id,cId=c.id,aId=other.id;
 A.nominateRelative(cId,girlId);A.nominateRelative(aId,girlId);assert.equal(S.flags.familyNominees.length,1);assert.ok(!S.cands.some(p=>p.id===girlId));
 save('auto');A.load('auto');drain();genCands();var g=S.cands.find(p=>p.id===girlId);
 assert.equal(S.cands.filter(p=>p.id===girlId).length,1);assert.match(g.kinNote,/侄女/);
 assert.ok(!g.known);assert.match(consortTraitTags(g),/不安于室/);assert.ok(!g.house);
 A.xxTake(girlId);choose(0);drain();A.xxEnd();drain();save('auto');A.load('auto');drain();
 g=byId(girlId);assert.ok(g);assert.equal(houseOf(g),null);assert.match(houseLine(g),/沈明远/);
 assert.equal(natalEntry(cId,girlId).p.consortId,girlId);assert.equal(PalaceActions.blocked,false);
 assert.ok(familyTreeChildren(h.brother).some(n=>n.p.id===girlId));
 `);
});
test('the family tree and list link to the profile, where nomination sits beside the visit action',()=>{
 const b=setup();b.run(`for(const mode of ['graph','list']){
   UI.familyMode=mode;const html=viewFamily();
   assert.ok(html.includes("A.go('natal','"+other.id+":"+sister.id+"')"));assert.doesNotMatch(html,/A\\.nominateRelative/);
 }
 A.go('natal',other.id+':'+sister.id);
 assert.match(viewNatalRelative(),/准入宫探亲<\\/button><button [^>]+>荐入下届选秀/);
 A.nominateRelative(other.id,sister.id);
 assert.match(viewNatalRelative(),/disabled>已荐入下届选秀/);`);
});
test('a married sister’s daughter can be nominated from her own maternal-family profile',()=>{
 const b=setup();b.run(`sister.married=true;
 var niece=addNatalPerson(other,oh,'f',15,218,false);
 niece.parentRelativeId=sister.id;niece.married=false;
 A.familyTreeToggle(other.id,String(sister.id),false);
 assert.ok(familyHouseTree(other).includes("A.go('natal','"+other.id+":"+niece.id+"')"));
 A.go('natal',other.id+':'+niece.id);assert.match(viewNatalRelative(),/外甥女/);
 assert.match(viewNatalRelative(),/荐入下届选秀/);A.nominateRelative(other.id,niece.id);
 genCands();var matches=S.cands.filter(g=>g.id===niece.id);
 assert.equal(matches.length,1);assert.match(matches[0].kinNote,/外甥女/);`);
});
test('a niece can register early from her profile and retain her identity in the first selection after fifteen',()=>{
 const b=setup();b.run(`sister.married=true;
 var niece=addNatalPerson(other,oh,'f',14,210,false);
 niece.motherRelativeId=sister.id;niece.married=false;
 var nieceId=niece.id,auntId=other.id,momId=sister.id;
 A.go('natal',auntId+':'+momId);assert.ok(viewNatalRelative().includes("A.go('natal','"+auntId+":"+nieceId+"')"));
 A.go('natal',auntId+':'+nieceId);assert.match(viewNatalRelative(),/预登记选秀 · 满十五岁后入册/);
 A.nominateRelative(auntId,nieceId);assert.match(viewNatalRelative(),/disabled>已预登记/);
 A.load('auto');drain();genCands();assert.ok(!S.cands.some(p=>p.id===nieceId));assert.equal(S.flags.familyNominees.length,1);
 var entry=natalEntry(auntId,nieceId);S.turn=entry.p.born+180;genCands();
 assert.equal(S.cands.filter(p=>p.id===nieceId).length,1);assert.match(S.cands.find(p=>p.id===nieceId).kinNote,/外甥女/);
 A.xxTake(nieceId);choose(0);drain();
 var g=byId(nieceId);assert.equal(natalEntry(auntId,nieceId).p.consortId,g.id);assert.equal(g.familyBranchOrigin.host,auntId);
 assert.ok(g.story.some(e=>e.t.includes('礼部留存了选秀名帖')));`);
});
test('a mother’s children list offers nomination for a young collateral niece with uncertain parentage',()=>{
 const b=setup();b.run(`sister.natalCollateral=true;
 var niece=addNatalPerson(other,oh,'f',14,210,false);
 niece.motherRelativeId=sister.id;niece.married=false;niece.unconfirmedParentage=true;
 niece.outsideParentage={gen:S.gen,status:'quiet',imperial:true};var id=niece.id;
 A.go('natal',other.id+':'+sister.id);
 assert.match(viewNatalRelative(),/预登记选秀 · 满十五岁后入册/);
 A.go('natal',other.id+':'+id);assert.match(viewNatalRelative(),/堂外甥女.*身世未明/);
 assert.match(viewNatalRelative(),/预登记选秀/);
 niece.betrothal={match:{name:'约婚',desc:''}};assert.match(viewNatalRelative(),/选秀 · 已定亲/);delete niece.betrothal;
 A.nominateRelative(other.id,id);S.turn=niece.born+180;genCands();
 A.xxTake(id);assert.equal(curEv.title,'留牌子');choose(0);drain();assert.ok(byId(id));
 assert.ok(other.story.some(e=>e.life?.title==='姨甥定榜 · 留牌入宫'));`);
});
function nieceSelection({trait='温婉',relation=45,willing=true,uncertain=false}={}){
 const b=setup();Object.assign(b.ctx,{trait,relation,willing,uncertain});
 b.run(`sister.married=true;other.trait=trait;
 var niece=addNatalPerson(other,oh,'f',18,210,false);
 niece.motherRelativeId=sister.id;niece.married=false;niece.willing=willing;
 if(uncertain){niece.unconfirmedParentage=true;niece.outsideParentage={gen:S.gen,status:'suppressed',imperial:true};}
 S.rel[rk(other,niece)]=relation;
 var nieceId=niece.id,auntId=other.id,profile=auntId+':'+nieceId;
 S.flags.lastXX=-99;PalaceActions.reset();A.go('natal',profile);
 assert.match(viewNatalRelative(),/荐入下届选秀/);
 if(uncertain){var born=niece.born;niece.born=S.turn-179;assert.match(viewNatalRelative(),/预登记选秀/);niece.born=born;}
 A.nominateRelative(auntId,nieceId);A.xxDecree();drain();
 var candidate=S.cands.find(c=>c.id===nieceId);
 assert.ok(candidate);A.xxMeet(nieceId);
 var notices=(p)=>p.story.filter(e=>e.thread?.startsWith('selection-niece:'));`);
 return b;
}
test('a close aunt welcomes the same niece at the audience and after retention, including pending reload',()=>{
 const b=nieceSelection();
 b.run(`assert.match(viewSelectionAudience(),/喘匀了再开口/);
 assert.match(notices(niece)[0].t,/把一直握紧的手松开/);
 assert.ok(!notices(other)[0].t.includes('把一直握紧的手松开'));
 A.xxTake(nieceId);save('1');`);
 const runtime=boot(11,b.storage);runtime.ctx.assert=assert;
 runtime.ctx.nieceId=b.run('nieceId');runtime.ctx.auntId=b.run('auntId');
 runtime.run(`A.load('1');assert.equal(PalaceActions.blocked,false);assert.equal(curEv.title,'留牌子');
 choose(0);assert.match(modalResult.text,/手里的针竟扎偏了/);drain();A.xxEnd();drain();
 var aunt=byId(auntId),g=byId(nieceId),relative=natalEntry(auntId,nieceId).p;
 var notes=p=>p.story.filter(e=>e.thread?.startsWith('selection-niece:'));
 for(const p of [aunt,g,relative])assert.deepEqual(notes(p).map(e=>e.life.title),['姨甥应选 · 储秀宫来信','姨甥定榜 · 留牌入宫']);
 assert.match(notes(g)[1].t,/凭自己的本事/);assert.equal(notes(aunt)[1].thread,notes(g)[1].thread);`);
});
for(const explicit of [true,false])test('declined nieces keep both histories after '+(explicit?'a direct dismissal':'the end of the selection'),()=>{
 const b=nieceSelection({trait:'骄矜',relation:explicit?-45:0,willing:explicit});
 b.ctx.explicit=explicit;
 b.run(`if(explicit){A.xxDrop(nieceId);assert.match(notices(niece).at(-1).t,/我的确松了口气/);}
 A.xxEnd();drain();assert.equal(byId(nieceId),undefined);
 assert.deepEqual(notices(niece).map(e=>e.life.title),['姨甥应选 · 储秀宫来信','姨甥定榜 · 宫门辞归']);
 assert.equal(notices(other).length,2);
 assert.match(notices(niece).at(-1).t,explicit?/日子仍是我自己的/:/搁了几日的活计/);
 save('1');A.load('1');drain();assert.equal(notices(natalEntry(auntId,nieceId).p).length,2);`);
});
test('uncertain nieces can be retained and titled through the ordinary selection without checking parentage',()=>{
 const b=nieceSelection({uncertain:true,trait:'沉静'});
 b.run(`assert.match(viewSelectionAudience(),/窗纸上的影子/);
 var sealed=JSON.stringify(niece.outsideParentage);
 A.xxTake(nieceId);assert.equal(curEv.title,'留牌子');assert.match(curEv.choices[0].t,/封为/);
 choose(0);assert.match(modalResult.text,/姨母/);drain();
 assert.equal(byId(nieceId).id,nieceId);assert.equal(niece.unconfirmedParentage,true);
 assert.equal(JSON.stringify(niece.outsideParentage),sealed);
 assert.match(notices(other).at(-1).life.title,/留牌入宫/);assert.match(notices(byId(nieceId)).at(-1).life.title,/留牌入宫/);`);
});
test('a sealed finding does not affect selection and later case handling keeps one identity',()=>{
 const b=nieceSelection({uncertain:true});
 b.run(`niece.outsideParentage.privateInquiry={status:'complete',imperial:true};
 A.xxTake(nieceId);assert.equal(curEv.title,'留牌子');choose(0);drain();
 assert.equal(byId(nieceId).id,nieceId);assert.equal(niece.consortId,nieceId);
 var f=outsideParentageFamily(other,niece);
 assert.equal(outsideParentageEvent(f,true),null);assert.equal(recognizeOutsideChild(f),null);
 niece.outsideParentage.status='investigating';niece.outsideParentage.due=S.turn;
 pushEv(outsideParentageEvent(f));assert.equal(curEv.title,'宫外身世回奏');
 choose(0);assert.match(modalResult.text,/已有名册/);drain();
 assert.equal(S.consorts.filter(c=>c.id===nieceId).length,1);assert.equal(kidById(nieceId),undefined);`);
});
test('next actual selection rechecks marriage and keeps valid nominated sisters across skipped selections',()=>{
 const b=setup();b.run(`var friend=addNatalPerson(other,oh,'f',17,106,false);
 A.nominateRelative(other.id,sister.id);A.nominateRelative(other.id,friend.id);friend.married=true;
 genCands();assert.ok(!S.cands.some(p=>p.id===friend.id));var g=S.cands.find(p=>p.id===sister.id);
 assert.ok(g&&!g.known);A.xxTake(g.id);choose(0);drain();assert.equal(byId(sister.id).house.father.id,oh.father.id);`);
});
test('the same New Year gift can lead directly to the drum dance and is booked only once',()=>{
 const b=setup();b.run(`S.month=1;Math.random=()=>0;var tribute=annualRevenueTick(),stock=JSON.stringify(ensureJewelry().stock),money=E().treasury;
 var ev=tributeEnvoyEvent(tribute);assert.match(ev.text,/岁贡/);assert.match(ev.text,/白泉国王/);pushEv(ev);option('观白泉鼓舞');
 assert.match(curEv.title,/白泉公主献舞/);assert.equal(JSON.stringify(ensureJewelry().stock),stock);assert.equal(E().treasury,money);
 assert.equal(tributeEnvoyEvent(null),null);`);
});
test('growing up leaves age-specific memories and status badges without disclosing the sealed truth',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,br,agree(ref,br));beginNatalPregnancy(other,sister,{unconfirmed:true});
 Object.assign(sister.natalPregnancy,{sex:'m',difficult:false,imperialParentage:true,husbandSuspects:false,noted:true});
 S.turn=sister.natalPregnancy.due;natalPregnancyTick();var child=oh.relatives.find(p=>p.parentRelativeId===sister.id);
 S.turn=child.born+36;outsideParentageTick();var notes=child.story.length;outsideParentageTick();
 assert.equal(child.story.length,notes);assert.match(other.story.at(-1).t,/储位/);assert.ok(sister.story.some(e=>e.t.includes('歪带子')));
 assert.match(outsideChildBadge(child),/身世未明/);child.outsideParentage.status='proved';delete child.unconfirmedParentage;
 assert.match(outsideChildBadge(child),/宫外皇嗣/);recognizeOutsideChild(outsideParentageFamily(other,child));
 var royal=kidById(child.id);assert.match(outsideChildBadge(royal),/宫外归宗/);assert.equal(royal.outsideGrowthAge,3);
 S.turn=royal.born+84;outsideParentageTick();assert.match(royal.story.at(-1).t,/大字/);assert.match(other.story.at(-1).t,/已认回/);`);
});
test('private dialogue reflects family tensions and records the marriage without telling the husband',()=>{
 const b=setup();b.run(`officialMarriageConfirm(ref,br,agree(ref,br));sister.willing=true;sister.trait='温婉';
 S.rel[rk(other,sister)]=-40;assert.match(sisterPrivateWords(other,sister,0),/她能得你喜欢/);S.rel[rk(other,sister)]=60;
 assert.match(sisterPrivateWords(other,sister,0),/陪她/);sister.maritalBond={kind:'affectionate',wife:80,husband:85};
 Math.random=()=>.79;var n=h.brother.story.length;A.marriedSisterVisit(other.id,sister.id);choose(0);
 assert.match(sister.story.at(-1).t,/不敢看他/);assert.equal(h.brother.story.length,n);`);
});
test('the preference changes opportunities for actual adult prince and guard events',()=>{
 const b=setup();b.run(`var lady=other,prince=makeKid(c,'m','承安');
 prince.born=S.turn-20*12;prince.lit=75;prince.vir=40;prince.love=35;
 lady.age=22;lady.trait='好学';lady.hobby='读书';lady.aff=10;lady.favor=10;lady.virtue=40;lady.enteredAt=S.turn;
 S.rel[rk(prince,lady)]=40;c.favor=80;
 while(restlessDisposition(lady))lady.seed++;var ordinary=lady.seed;
 while(!restlessDisposition(lady))lady.seed++;var marked=lady.seed;
 Math.random=()=>.06;lady.seed=ordinary;palaceRomanceTick();assert.equal(Object.keys(palaceRomanceState().pairs).length,0);
 S.turn++;lady.seed=marked;palaceRomanceTick();assert.equal(Object.values(palaceRomanceState().pairs)[0].consort,lady.id);
 for(let tries=0;tries<5000;tries++,S.turn++){let roll=voiceHash(E().seed+':guard-tryst:'+S.turn+':roll')%100;if(roll>=2&&roll<6)break;}
 lady.seed=ordinary;assert.equal(guardTrystEvent(),null);lady.seed=marked;var event=guardTrystEvent();
 assert.equal(event.title,affairReportTitle()+' · 宫门私约');event.onQueue();event.choices[0].f();assert.ok(lady.guardTryst);assert.match(lady.story.at(-1).t,/调离|奉调/);
 lady.age=17;delete lady.guardTryst;S.turn+=18;assert.equal(guardTrystEvent(),null);`);
});

test('withdraw early and adult nominations, save, reopen and register again',()=>{
 const z=setup();z.run(`var p=addNatalPerson(other,oh,'f',14,628,false);p.parentRelativeId=sister.id;p.married=false;
 var hostId=other.id,id=p.id;A.nominateRelative(hostId,id);assert.match(familyNominationButton(other,p),/取消登记/);
 A.cancelFamilyNomination(hostId,id);A.cancelFamilyNomination(hostId,id);assert.equal(p.story.filter(e=>e.t.includes('撤下了这次登记')).length,1);
 A.load('auto');drain();var e=natalEntry(hostId,id);e.p.born=S.turn-16*12;genCands();assert.ok(!S.cands.some(g=>g.id===id));
 A.nominateRelative(hostId,id);A.cancelFamilyNomination(hostId,id);A.nominateRelative(hostId,id);genCands();
 assert.equal(S.cands.filter(g=>g.id===id).length,1);assert.doesNotMatch(familyNominationButton(e.c,e.p),/取消登记/);A.cancelFamilyNomination(hostId,id);assert.ok(S.cands.some(g=>g.id===id));`);
});

test('身世未明随本人从应选到留牌，旧存档凭家籍恢复，其他人的特质不被占用',()=>{
 const b=nieceSelection({uncertain:true});b.run(`
 candidate.selectionRestless=true;var badge=/>身世未明</,restless=/>不安于室</;
 assert.match(viewSelectionAudience(),badge);assert.match(consortTraitTags(candidate),restless);
 A.xxTake(nieceId);choose(0);drain();var g=byId(nieceId);assert.equal(g.unclearParentageOrigin,true);
 assert.match(consortTraitTags(g),badge);assert.match(consortTraitTags(g),restless);
 A.go('consort',g.id);assert.match(viewConsort(),badge);assert.match(viewHarem(),badge);
 assert.doesNotMatch(consortTraitTags(other),badge);
 delete g.unclearParentageOrigin;PalaceActions.reset();save('auto');A.load('auto');drain();
 g=byId(nieceId);var saved=JSON.stringify(S);assert.match(consortTraitTags(g),badge);
 assert.match(consortTraitTags(g),restless);assert.equal(JSON.stringify(S),saved);
 assert.doesNotMatch(consortTraitTags(g),/宫外皇嗣|生父为皇帝/);`);
});

test('知情姨母记得当年劝避嫌、盼入宫或伤心的反应，三份纪事各有视角',()=>{
 for(const [reaction,speech,diary] of [['afraid','替大人','避嫌'],['hopeful','一顿热饭','相伴'],['sad','脚疼','没去送']]){
  const b=nieceSelection({uncertain:true});Object.assign(b.ctx,{reaction,speech,diary});
  b.run(`other.sisterAffairKnowledge={[sister.id]:{sister:sister.id,name:sister.name,reaction,turn:S.turn-48,letter:{sent:S.turn-45}}};
   niece.outsideParentage.privateInquiry={status:'complete',imperial:true};var before=JSON.stringify(niece.outsideParentage);
   A.xxTake(nieceId);choose(0);assert.ok(modalResult.text.includes(reaction==='afraid'?'长辈的事':speech));drain();
   var girl=byId(nieceId),find=p=>p.story.filter(e=>e.thread==='niece-confidence:'+other.id+':'+nieceId);
   assert.ok(find(other)[0].t.includes(diary));assert.equal(find(sister).length,1);assert.equal(find(girl).length,1);
   assert.match(find(sister)[0].t,/女儿/);assert.doesNotMatch(find(girl)[0].t,/回信|避嫌的信|私下相见|生父|盼姐妹|亲笔信/);
   assert.equal(JSON.stringify(niece.outsideParentage),before);S.turn++;nieceHandwrittenMailTick();assert.equal(find(girl).length,1);`);
 }
});
test('未触发察觉的姨母到下月亲收手书才知情，读档、同胞与其他姨母的知情记录相互独立',()=>{
 const b=nieceSelection({uncertain:true});b.run(`
 var second=makeGirl({sur:other.sur,given:'清兰',age:35,trait:'善妒'});addConsort(second,3,'入宫');second.house=other.house;
 second.sisterAffairKnowledge={[sister.id]:{sister:sister.id,name:sister.name,reaction:'sad',turn:S.turn-50}};
 other.sisterAffairKnowledge={999:{sister:999,name:'旁人',reaction:'hopeful'}};
 A.xxTake(nieceId);choose(0);drain();var g=byId(nieceId),sid=sister.id,aid=other.id,secondId=second.id;
 assert.equal(sisterAffairKnowledge(other,sister),undefined);assert.equal(sisterAffairKnowledge(second,sister).reaction,'sad');
 var mail=()=>g.story.filter(e=>e.life?.title==='姨甥私语 · 生母手书');nieceHandwrittenMailTick();assert.equal(mail().length,0);
 PalaceActions.reset();save('auto');A.load('auto');drain();g=byId(nieceId);other=byId(aid);sister=natalEntry(aid,sid).p;S.turn++;nieceHandwrittenMailTick();
 assert.equal(curEv.title,'姨甥私语 · 入宫以后');assert.match(curEv.text,/亲笔信/);drain();
 assert.equal(sisterAffairKnowledge(other,sister).source,'handwritten');
 assert.equal(sisterAffairKnowledge(byId(secondId),sister).source,undefined);
 assert.equal(mail().length,1);assert.equal(sister.story.filter(e=>e.life?.title==='姨甥私语 · 生母手书').length,1);
 assert.match(other.story.at(-1).t,/才知道/);assert.doesNotMatch(mail()[0].t,/当年曾与陛下|生父是/);
 S.turn++;nieceHandwrittenMailTick();assert.equal(mail().length,1);`);
});
test('落选、无该标签或生母已故，不能靠手书凭空知情；旧档留牌可续收',()=>{
 for(const mode of ['lost','ordinary','deceased','legacy']){
  const b=nieceSelection({uncertain:mode!=='ordinary'});b.ctx.mode=mode;
  b.run(`if(mode==='lost'){A.xxDrop(nieceId);drain();}else{A.xxTake(nieceId);choose(0);drain();}
   var g=byId(nieceId);if(mode==='deceased')sister.alive=false;if(mode==='legacy')delete g.nieceConfidenceMail;
   S.turn++;nieceHandwrittenMailTick();drain();
   assert.equal(!!sisterAffairKnowledge(other,sister),mode==='legacy');
   assert.equal(sister.story.some(e=>e.life?.title==='姨甥私语 · 生母手书'),mode==='legacy');`);
 }
});
