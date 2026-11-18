const test=require('node:test'),assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs');
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
 assert.equal(event.title,'宫门私约');event.onQueue();event.choices[0].f();assert.ok(lady.guardTryst);assert.match(lady.story.at(-1).t,/调离|奉调/);
 lady.age=17;delete lady.guardTryst;S.turn+=18;assert.equal(guardTrystEvent(),null);`);
});
