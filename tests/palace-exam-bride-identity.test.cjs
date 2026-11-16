const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`other.sur='赵';other.given='令仪';sister.sur='赵';sister.given='令珠';sister.name='赵令珠';sister.born=S.turn-26*12;sister.willing=true;scholar.name='姚允执';scholar.sur='姚';scholar.examRank='探花';scholar.willing=true;PalaceActions.reset();`);return b;}
test('a consort sister keeps her name and family identity in the tanhua list and review',()=>{
 const b=setup();b.run(`var list=examMarriageEvent(scholar),choice=list.choices.find(x=>x.person?.id===sister.id);assert.equal(porName(choice.person),'赵令珠');assert.ok(!porName(choice.person).includes('公主'));A.examMarriage(scholar.id);option('赵令珠');assert.equal(porName(curEv.por),'赵令珠');assert.match(curEv.text,/她是赵令仪的姐姐/);assert.ok(!eventCast(eventPortraits(curEv),curEv).includes('公主'));assert.equal(portraitCell(curEv.por),portraitCell(natalPortrait(sister)));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.equal(porName(curEv.por),'赵令珠');choose(0);drain();var wife=houseOf(byId(other.id)).relatives.find(x=>x.name==='赵令珠'),man=S.scholars.find(x=>x.name==='姚允执');assert.equal(wife.spouse.personId,man.id);assert.equal(man.royalSpouseId,undefined);assert.ok(!wife.story.concat(man.story).some(s=>/公主|驸马/.test(s.t)));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);`);
});
test('an actual princess retains her royal title in the same review',()=>{
 const b=setup();b.run(`k.willing=true;var ev=examMarriageReview(scholar,'princess:'+k.id);assert.match(porName(ev.por),/公主/);assert.ok(!porName(ev.por).includes('undefined'));ev.choices[0].f();assert.equal(scholar.royalSpouseId,k.id);assert.match(scholar.story.at(-1).t,/驸马/);`);
});

test('an exam-ranked groom sends real career news and a single obituary to an archived princess',()=>{
 const b=setup();b.run(`k.willing=true;examMarriageReview(scholar,'princess:'+k.id).choices[0].f();
 S.royalRelatives=[{...k,reign:S.gen}];S.children=[];S.gen++;var wife=royalById(k.id);
 scholarRecord(scholar,'调任吏部，明日赴任。');assert.match(wife.story.at(-1).t,/驸马近况.*姚允执.*调任吏部/);
 assert.match(officialSpousePanel(courtPerson('scholar:'+scholar.id)),/A.go\\('relative'/);
 scholar.alive=false;scholarRecord(scholar,'奉差途中去世。');scholarRecord(scholar,'奏报去世。');
 assert.equal(wife.story.filter(x=>x.t.includes('驸马讣报')).length,1);assert.equal(householdLiving(wife),false);`);
});
