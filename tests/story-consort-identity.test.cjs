const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./court-family-browser-fixtures.cjs');

test('双太后、太皇太后和太妃各占本人的剧情身份，传代读档仍有原纪事',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var women={};for(const key of ['ayimu','suheng','luwan']){
 const r=storyCastCreate(key);women[key]=r.person;storyCastAdmit(r.person,r,'依故事册入');
 }
 empress().rank=6;women.ayimu.rank=8;women.luwan.story.push({d:dateStr(),t:'随父巡视北境。'});
 var takeThrone=mother=>{const heir=makeKid(mother,'m','承旭');heir.born=S.turn-244;succeed(heir);choose(0);drain();};
 takeThrone(women.suheng);
 assert.match(livingStoryConsort('ayimu').status,/皇太后/);assert.match(livingStoryConsort('suheng').status,/生母皇太后/);
 assert.match(livingStoryConsort('luwan').status,/太妃/);assert.ok(livingStoryConsort('luwan').person.story.some(e=>e.t.includes('巡视北境')));
 var slots=S.consorts.length,nid=S.nid,energy=E().energy;A.storyCastVisit('luwan');assert.equal(E().energy,energy);
 assert.equal(storyCastCreate('ayimu'),null);assert.equal(S.nid,nid);assert.equal(S.consorts.length,slots);
 assert.equal(storyCastVisitButton('luwan'),'');assert.equal(whiteSpringAudienceReady(),false);assert.equal(feastArtistReady('suheng'),false);assert.equal(palacePetitionReady('luwan'),false);
 assert.equal(storyCastMeetReady('xiaoman'),true);assert.match(storyCastCodexCards(),/先朝太妃/);
 takeThrone(empress());PalaceActions.reset();save('auto');A.load('auto');drain();
 assert.match(livingStoryConsort('ayimu').status,/太皇太后/);assert.equal(storyCastMeetReady('suheng'),false);
 assert.equal(livingStoryConsort('luwan').person.id,women.luwan.id);`);
});
test('存续判定以活人册和太后实况为准，旧档留存的同名、前朝快照和过时婚议不会增人',()=>{
 const w=world();w.ctx.assert=assert;w.run(`var r=storyCastCreate('ayimu'),stale=storyCastMeetEvent('ayimu',r),g=r.person;
 var old={...g,id:777,alive:true};S.previousCourts=[{gen:0,consorts:[old]}];S.retainedFamilies=[{...old,alive:false}];
 assert.ok(storyCastMeetReady('ayimu'));S.retainedFamilies[0].alive=true;
 assert.ok(!stale.valid());assert.ok(!storyCastAdmit(g,r,'旧席单'));var count=S.consorts.length;
 addConsort(g,3,'过时册封');assert.equal(S.consorts.length,count);assert.ok(!r.id);
 S.flags.dowager={personId:777,alive:false,portrait:{...old}};assert.equal(livingStoryConsort('ayimu'),null);
 S.flags.dowager.alive=true;delete S.flags.dowager.portrait.fixedStory;assert.match(livingStoryConsort('ayimu').status,/皇太后/);
 S.flags.dowager.alive=false;delete S.previousCourts;S.retainedFamilies=[];a.sur='';a.given='阿依慕';
 assert.equal(livingStoryConsort('ayimu'),null);assert.ok(storyCastMeetReady('ayimu'));`);
});
test('八位固定人物不能从不同入口再册封，冷宫和省亲中的人物仍在世',()=>{
 const w=world();w.ctx.assert=assert;w.run(`for(const key of [...Object.keys(STORY_CAST),'gouyi','hongjian']){
 const p={...a,id:819,alive:true,cold:true};if(STORY_CAST[key])p.fixedStory=key;else p[key]={};
 S.consorts.push(p);assert.equal(livingStoryConsort(key).person.id,819);
 p.cold=false;p.homeLeave={};assert.equal(livingStoryConsort(key).person.id,819);
 if(STORY_CAST[key])assert.equal(storyCastMeetReady(key),false);
 if(key==='gouyi'){delete S.flags.gouyiSeen;assert.equal(gouyiEncounter(),null);}
 if(key==='hongjian'){assert.equal(fenghuaEntryReady('xueHongjian'),false);assert.equal(feastArtistReady('hongjian'),false);assert.equal(admitHongjian({}),null);}
 S.consorts.pop();
 }`);
});
test('旧档已有两位阿依慕时保留各自档案，直到最后一位离世都不能再招',()=>{
 const w=world();w.ctx.assert=assert;
 w.run(`var makeCopy=id=>({...a,id,fixedStory:'ayimu',alive:true});
 const first=makeCopy(710),second=makeCopy(720);
 S.retainedFamilies=[first,second];
 S.flags.dowager={personId:first.id,alive:true,portrait:{...first}};
 S.flags.birthDowager={personId:second.id,alive:true,portrait:{...second}};
 assert.equal(storyCastMeetReady('ayimu'),false);
 S.flags.dowager.alive=false;
 assert.equal(livingStoryConsort('ayimu').person.id,second.id);
 assert.equal(storyCastCreate('ayimu'),null);
 assert.deepEqual(S.retainedFamilies.map(c=>c.id).join(','),'710,720');
 S.flags.birthDowager.alive=false;
 assert.equal(livingStoryConsort('ayimu'),null);`);
});
