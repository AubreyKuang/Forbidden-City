const {test}=require('node:test'),assert=require('node:assert/strict'),{world}=require('./official-marriage-world.cjs');
function setup(){const b=world();b.ctx.assert=assert;b.run(`c.rank=3;var father=houseOf(c).father;father.temperament='进取';var cid=c.id;PalaceActions.reset();`);return b;}
for(const temperament of ['持正','谨慎','进取','温厚'])test('proven guilt produces responsibility and family worry: '+temperament,()=>{
 const b=setup();b.run(`father.temperament='${temperament}';var previous=JSON.parse(JSON.stringify(S));var ev=punishEv(c,other,'石阶泼油');ev.choices[1].f();courtFamilyLifeTick(previous);
 var letter=c.story.findLast(s=>s.t.startsWith('【娘家来信】'));assert.match(letter.t,new RegExp(fullName(c)+'由贵人降为答应'));assert.ok(!letter.t.includes('得知自己'));assert.ok(!letter.t.includes('性子里的委屈'));assert.match(letter.t,/认错|悔过|思过/);assert.match(letter.t,/石阶泼油/);assert.ok(father.story.some(s=>s.t.includes(father.palaceConcern.quote)));`);
});
test('unexplained punishment is neither proof of guilt nor proof of injustice',()=>{
 const b=setup();b.run(`A.cold(cid);choose(0);assert.match(father.palaceConcern.quote,/不知事情全貌|不敢妄议/);assert.ok(!father.palaceConcern.quote.includes('既已查实'));assert.ok(!father.palaceConcern.quote.includes('性子里的委屈'));save('auto');A.load('auto');assert.equal(PalaceActions.blocked,false);assert.match(byId(cid).story.at(-1).t,/娘家来信/);`);
});
test('mere allegations cannot use the hidden wronged flag to claim knowledge of innocence',()=>{
 const b=setup();b.run(`var old=JSON.parse(JSON.stringify(S));S.flags.wronged={v:c.id,a:other.id};c.rank=1;story(c,'被指行巫蛊之术，尚未查明。');courtFamilyLifeTick(old);assert.match(father.palaceConcern.quote,/不知事情全貌/);assert.ok(!father.palaceConcern.quote.includes('查明她未涉'));`);
});
test('old erroneous letters are corrected once using the same dated proven punishment',()=>{
 const b=setup();b.run(`var bad='臣想听听她的近况。她性子里的委屈，可有人肯听？';story(c,'石阶泼油事发，被降为答应，禁足宫中。');story(c,'【娘家来信】父亲'+father.name+'得知自己由贵人降为答应，托人传话：“'+bad+'”');story(father,'【宫中牵挂】得知'+fullName(c)+'由贵人降为答应，'+father.name+'道：“'+bad+'”');father.palaceConcern={c:cid,kind:'demoted',turn:S.turn,quote:bad};
 repairFamilyConcernWording();assert.ok(!c.story.at(-1).t.includes('得知自己'));assert.match(c.story.at(-1).t,/石阶泼油/);assert.match(father.palaceConcern.quote,/认错/);var snapshot=JSON.stringify(S);repairFamilyConcernWording();assert.equal(JSON.stringify(S),snapshot);`);
});
