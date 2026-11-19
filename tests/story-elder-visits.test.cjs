const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');

test('传位后探望阿依慕与陆绾，实际白泉家人、答话、双册纪事和跨月读档',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var addLady=key=>{const r=storyCastCreate(key),c=r.person;storyCastAdmit(c,r,'入宫');return c};
 var m=addLady('ayimu'),l=addLady('luwan');empress().rank=6;m.rank=8;
 var k=makeKid(m,'f','清竹');k.born=S.turn-22*12;
 A.kidMarriage(k.id);choose(curEv.choices.findIndex(o=>o.t.includes('白泉国')));choose(0);drain();
 k.spouse.trust=80;k.spouse.born=k.born;S.turn+=4;assert.ok(startHouseholdPregnancy(k,k.spouse));
 S.turn+=9;var child=deliverHouseholdChild(k,k.household.pregnancies[0]);drain();
 var heir=makeKid(a,'m','承旭');heir.born=S.turn-244;succeed(heir);choose(0);drain();
 var mid=m.id,lid=l.id,childname=whiteSpringKinTerm(child)+child.name;E().energy=12;PalaceActions.reset();
 assert.match(dowagerCourtPanel(),/探望阿依慕/);assert.match(dowagerCourtPanel(),/探望陆绾/);
 A.visitStoryElder(mid);assert.ok(curEv.text.includes(childname));assert.match(curEv.text,/清竹/);
 save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.ok(curEv.text.includes(childname));choose(0);drain();
 var note='【探望 · 问白泉家音】';
 for(const entries of [familyHostById(mid).story,S.flags.dowager.story,S.log]){
 const rows=entries.filter(e=>e.t.includes(note));assert.equal(rows.length,1);assert.ok(rows[0].t.includes(childname));}
 var left=E().energy;A.visitStoryElder(mid);assert.equal(E().energy,left);assert.equal(modalOpen,false);
 UI.sel=lid;assert.match(viewConsort(),/探望陆绾/);A.visitStoryElder(lid);choose(1);drain();
 assert.match(familyHostById(lid).story.at(-1).t,/桥下的水声/);assert.match(S.log.at(-1).t,/桥下的水声/);
 S.turn++;A.visitStoryElder(lid);assert.match(curEv.title,/旧马衔/);choose(0);drain();
 const princess=royalById(k.id);assert.equal(whiteSpringElderTalk(familyHostById(mid),1)[0],'翻一页白泉家书');princess.household.whiteSpringVisit={stage:'palace',child:child.id};A.visitStoryElder(mid);
 assert.match(curEv.text,/回宫小住/);choose(1);drain();`);
});

test('八人的身份各有专属答话，已故与宫外的人无法被探望，旧档不按同名找人',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var elders=[],titles=new Set();
 for(const key of Object.keys(STORY_QUEEN_SCENES)){
 const p={...a,sur:'',given:key,story:[],id:600+elders.length,familyArchive:{gen:1}};
 if(key==='gouyi'||key==='hongjian')p[key]={};else p.fixedStory=key;elders.push(p);}
 S.retainedFamilies=elders;E().energy=20;
 for(const p of elders){A.visitStoryElder(p.id);assert.ok(modalOpen);titles.add(curEv.title);
 assert.equal(curEv.choices.length,2);choose(0);drain();assert.match(p.story.at(-1).t,/【探望/);}
 assert.equal(titles.size,8);var p=elders[0],cost=E().energy;S.turn++;
 for(const field of ['gone','cold','homeLeave','templeStay']){p[field]=true;A.visitStoryElder(p.id);assert.equal(modalOpen,false);delete p[field];}
 S.flags.dowager={...S.flags.dowager,personId:p.id,alive:false,portrait:{...p,alive:true}};A.visitStoryElder(p.id);assert.equal(modalOpen,false);
 A.visitStoryElder(a.id);assert.equal(E().energy,cost);
 var lookalike={...a,id:800,given:'阿依慕'};S.retainedFamilies.push(lookalike);assert.equal(storyElderResident(800),null);
 const senior=elders[1];S.flags.seniorDowagers=[{personId:senior.id,seniorSince:2,alive:true,portrait:senior}];A.visitStoryElder(senior.id);
 assert.match(curEv.title,/慈宁宫/);choose(1);drain();assert.match(S.flags.seniorDowagers[0].story.at(-1).t,/探望/);`);
});

test('白泉谈话分辨无女、无外孙、归宁与丧女，认生母和实际孩子',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var mother={...a,id:899},girl={id:1003,sex:'f',alive:true,name:'明昭',mom:900,foster:899,spouse:{route:'whiteSpring'}};
 S.royalRelatives=[girl];assert.equal(whiteSpringElderTalk(mother,0)[0],'听一支白泉旧调');
 girl.mom=899;assert.match(whiteSpringElderTalk(mother,0)[1],/明昭/);assert.doesNotMatch(whiteSpringElderTalk(mother,0)[1],/外孙/);
 girl.alive=false;assert.match(whiteSpringElderTalk(mother,0)[1],/已故的明昭/);`);
});
