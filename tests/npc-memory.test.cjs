const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { read, scripts } = require('./game-scripts.cjs');
const memorySource = read('js/npc-memory.js');
function runtime(extra = {}) {
  const context = vm.createContext(extra);
  vm.runInContext(memorySource, context);
  context.memory = vm.runInContext('NPCMemory', context);
  return context;
}
function emit(ctx, world, options = {}) {
  return ctx.memory.record(world, {type:'gift', time:12}, [
    {person:'alice',subject:'bob',interpretation:'Bob helped me',emotion:.4,impact:50,...options}
  ]);
}
function loadFunction(ctx, source, name, next) {
  const start = source.lastIndexOf('function ' + name + '(');
  const finish = source.indexOf(next, start + 1);
  assert.ok(start >= 0 && finish > start, 'function extraction boundary');
  vm.runInContext(source.slice(start, finish), ctx);
}
test('all entry-point scripts parse', () => {
  assert.ok(scripts.length > 0);
});
test('independent perspectives, unknown observers, duplicate event and sequence gap', () => {
  const ctx=runtime(), world={};
  const event=ctx.memory.record(world,{type:'argue',time:1},[
    {person:'alice',subject:'bob',interpretation:'I confronted Bob',emotion:-1,impact:100},
    {person:'bob',subject:'alice',interpretation:'Alice confronted me',emotion:-.6,impact:90}
  ]);
  assert.notEqual(ctx.memory.recall(world,'alice')[0].interpretation,ctx.memory.recall(world,'bob')[0].interpretation);
  assert.equal(ctx.memory.recall(world,'diana').length,0);
  const before=JSON.stringify(world);
  assert.equal(ctx.memory.record(world,event,[]),null);
  assert.equal(JSON.stringify(world),before);
  assert.throws(()=>ctx.memory.record(world,{sequence:3},[]),/sequence gap/);
  assert.equal(JSON.stringify(world),before);
});
test('structured interpretations survive consolidation', () => {
  const ctx=runtime(), world={};
  for(let i=0;i<3;i++) emit(ctx,world,{interpretation:{type:'gift',object:'cookie'}});
  const entry=world.npcMemory.people.alice.long[0];
  assert.ok(entry);
  assert.equal(typeof entry.interpretation,'object');
  assert.equal(entry.interpretation.object,'cookie');
  assert.equal(entry.sources.length,3);
});
test('capacity, retained sources, confidence and twenty save/load cycles', () => {
  const ctx=runtime(); let world={};
  emit(ctx,world,{emotion:-1,impact:100});
  for(let i=0;i<200;i++) emit(ctx,world,{subject:'person-'+i});
  assert.ok(world.npcMemory.people.alice.short.length<=32);
  assert.ok(ctx.memory.recall(world,'alice').some(entry=>entry.sources.includes('event-1')));
  for(const entry of ctx.memory.recall(world,'alice')) for(const id of entry.sources) assert.ok(world.npcMemory.events[id]);
  const before=JSON.stringify(world), influence=ctx.memory.influence(world,'alice','bob');
  for(let i=0;i<20;i++) world=JSON.parse(JSON.stringify(world));
  assert.equal(JSON.stringify(world),before);
  assert.equal(ctx.memory.influence(world,'alice','bob'),influence);
  const uncertain={}; emit(ctx,uncertain,{emotion:-1,confidence:0,impact:100});
  assert.equal(ctx.memory.influence(uncertain,'alice','bob'),0);
  assert.equal(ctx.memory.influence({},'alice','bob'),0);
});
test('actual quarrel and legacy remember entry points produce distinct memories', () => {
  const S={turn:5},ctx=runtime({S,fullName:c=>c.name});
  loadFunction(ctx,read('js/personality.js'),'remember','function deepLine(');
  const a={id:1,name:'Alice'},b={id:2,name:'Bob'};
  ctx.rememberQuarrel(a,b,a.id);
  assert.match(ctx.memory.recall(S,1)[0].interpretation,/判给了我/);
  assert.match(ctx.memory.recall(S,2)[0].interpretation,/判给了她/);
  assert.equal(ctx.memory.recall(S,3).length,0);
  ctx.remember(a,'hurt','被降位');
  assert.ok(ctx.memory.influence(S,1,'emperor')<0);
  assert.ok(S.npcMemory.events['event-1'].participants.includes(2));
});
