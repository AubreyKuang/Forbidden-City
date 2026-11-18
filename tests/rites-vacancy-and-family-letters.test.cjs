const {test}=require('node:test');
const assert=require('node:assert/strict');
const {world}=require('./official-marriage-world.cjs');
function setup(){const w=world();w.ctx.assert=assert;return w;}

test('vacancies have separate clocks, actual candidates, signed petitions and the normal coronations',()=>{
  const w=setup();w.run(`
    c.rank=5;var son=makeKid(c,'m','承安');son.born=S.turn-60;delete son.pendingName;
    var excluded=makeKid(c,'m','幼安');excluded.born=S.turn-48;
    var chief=S.scholars[0];chief.office=chief.post='礼部尚书';chief.alive=true;
    delete S.flags.ritesVacancies;var t=S.turn;observeRitesVacancies();Math.random=()=>0;
    S.turn=t+2;assert.equal(ritesVacancyPetitions().length,0);
    S.turn++;var [ev]=ritesVacancyPetitions();assert.match(ev.text,/礼部尚书陆怀瑾/);
    pushEv(ev);choose(0);drain();assert.ok(!empress());assert.equal(ritesVacancyPetitions().length,0);
    S.turn=t+6;var [q,hp]=ritesVacancyPetitions();assert.match(q.text,/凤位久虚/);
    pushEv(q);choose(1);assert.equal(curEv.title,'册立皇后');choose(0);drain();assert.equal(empress().id,c.id);
    assert.equal(hp.choices.length,2);assert.match(hp.choices[1].t,/承安/);pushEv(hp);choose(1);
    assert.equal(curEv.title,'册立太子');choose(0);drain();assert.equal(S.heir,son.id);
    assert.match(son.story.at(-1).t,/太子/);assert.ok(chief.story.some(x=>x.t.includes('册立太子')));
    assert.equal(observeRitesVacancies().heir,undefined);assert.equal(observeRitesVacancies().queen,undefined);
    c.rank=6;observeRitesVacancies();Math.random=()=>.99;S.turn+=3;assert.equal(ritesVacancyPetitions().length,0);
    Math.random=()=>0;assert.equal(ritesVacancyPetitions().length,0);`);
});
test('punishment letters respect sender limits, kinship, verdict, and the loss of the crown',()=>{
  const w=setup();w.run(`
    c.rank=8;var old=JSON.parse(JSON.stringify(S));Math.random=()=>0;
    punishEv(c,other,'香囊藏麝').choices[1].f();courtFamilyLifeTick(old);
    var letters=c.story.filter(x=>x.t.startsWith('【娘家来信】'));
    assert.equal(letters.length,2);assert.ok(letters.every(x=>x.t.includes('香囊藏麝')));
    assert.match(letters.map(x=>x.t).join(''),/凤印|凤冠|女儿/);
    assert.notEqual(letters[0].t.split('：“')[1],letters[1].t.split('：“')[1]);
    courtFamilyLifeTick(old);assert.equal(c.story.filter(x=>x.t.startsWith('【娘家来信】')).length,2);
    var before=JSON.parse(JSON.stringify(S));S.turn++;c.rank--;Math.random=()=>.999;
    courtFamilyLifeTick(before);assert.equal(c.story.filter(x=>x.t.startsWith('【娘家来信】')).length,2);
    assert.equal(h.father.palaceConcern.turn,S.turn);
    var lines=['父亲秦慕白','兄长秦文彦'].map(x=>({d:'四月',t:'【娘家来信】'+x+'得知秦音由皇后降为贵妃，托人传话：“已经查实。”'}));
    assert.match(chronicleVisibleEntries(lines)[0].e.t,/秦慕白、兄长秦文彦/);
    assert.equal(chronicleVisibleEntries(lines).length,1);assert.equal(lines.length,2);`);
});
test('the card records absence during family leave and rechecks pregnancy and availability on return',()=>{
  const w=setup();w.run(`
    c.preg=2;c.hp=90;assert.ok(startHomeLeave(c,1));var card=()=>viewCards().match(new RegExp('<button class="pai" [^>]*A.night\\\\('+c.id+'\\\\)[^>]*>[\\\\s\\\\S]*?</button>'))[0];
    assert.match(card(),/disabled/);assert.match(card(),/外出省亲/);assert.doesNotMatch(card(),/有孕/);
    var energy=E().energy;A.night(c.id);assert.equal(E().energy,energy);
    returnHomeLeave(c);assert.match(card(),/有孕在身/);
    c.preg=0;assert.doesNotMatch(card(),/disabled|省亲|有孕/);`);
});
