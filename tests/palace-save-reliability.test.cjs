const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const KEY='chengongji_v1_auto';
const start=b=>b.run('A.start();drain();');

// Close the browser during a month-end scene, then make the transcript unreplayable.
// 'version' makes the transcript unsupported up front; 'replay' lets it start and then
// diverge mid-way, as an update that changes a scene's random draws would.
// The blocked actions below spend energy at once (a spa visit), so the rollback does not
// depend on which conversation a month's random draws happen to open first.
function stranded(kind='version'){
  const b=boot();start(b);b.run('A.endMonth()');assert.ok(b.run('modalOpen'));
  const data=JSON.parse(b.storage.get(KEY));
  if(kind==='version')data.pendingActions.version=999;else data.pendingActions.steps[0].rolls.push(.5);
  b.storage.set(KEY,JSON.stringify(data));
  const n=boot(1,b.storage);n.run("A.load('auto')");
  return {n,pending:data.pendingActions.pending,turn:data.turn,transcript:data.pendingActions};
}

test('an unreplayable scene offers a way back into the game instead of locking the save',()=>{
  const {n,pending,turn}=stranded();
  assert.equal(n.run('PalaceActions.blocked'),true);
  assert.equal(n.run('curEv.title'),'未完事件无法续接');
  const unanswered=[...(pending.result?[]:[pending.title]),...pending.queue];
  const held=unanswered.filter(title=>n.run(`S.flags.ambientRecent?.[${JSON.stringify(title)}]`)===turn);
  n.run('choose(0);drain()');
  assert.equal(n.run('PalaceActions.blocked'),false);
  const saved=JSON.parse(n.storage.get(KEY));
  assert.equal(saved.pendingActions,undefined);
  for(const title of held)assert.notEqual(saved.flags.ambientRecent?.[title],turn,`${title} kept a cooldown it never showed`);
  const month=n.run('S.turn');n.run('A.endMonth();drain()');assert.equal(n.run('S.turn'),month+1);
  assert.equal(JSON.parse(n.storage.get(KEY)).turn,month+1);
});

test('a transcript that diverges mid-replay gets the same way out',()=>{
  const {n,turn,transcript}=stranded('replay');
  assert.equal(n.run('PalaceActions.blocked'),true);assert.equal(n.run('curEv.title'),'未完事件无法续接');
  n.run("var downloaded=null;A.downloadSave=()=>{downloaded=JSON.stringify(PalaceActions.payload())}");
  n.run('choose(1)');assert.deepEqual(JSON.parse(n.run('downloaded')).pendingActions,transcript,'the backup must carry the transcript exactly as saved');
  const raw=n.storage.get(KEY);n.run('choose(2)');const energy=n.run('E().energy');
  const warn=console.warn;let replays=0;console.warn=(...a)=>{if(String(a[0]).includes('Pending scene recovery'))replays++;else warn(...a);};
  try{n.run("A.out('spa')");}finally{console.warn=warn;}
  assert.equal(replays,0,'a rollback must not replay the broken transcript again');
  assert.equal(n.run('E().energy'),energy);assert.equal(n.storage.get(KEY),raw);assert.equal(n.run('curEv.title'),'未完事件无法续接');
  n.run('choose(0);drain()');assert.equal(n.run('PalaceActions.blocked'),false);
  assert.equal(JSON.parse(n.storage.get(KEY)).pendingActions,undefined);
  n.run('A.endMonth();drain()');assert.equal(JSON.parse(n.storage.get(KEY)).turn,turn+1);
});

test('postponing the decision keeps the original save and brings the choice back',()=>{
  const {n}=stranded();const raw=n.storage.get(KEY);
  n.run('choose(2)');assert.equal(n.run('modalOpen'),false);
  const energy=n.run('E().energy');n.run("A.out('spa')");
  assert.equal(n.run('E().energy'),energy);assert.equal(n.storage.get(KEY),raw);
  assert.equal(n.run('curEv.title'),'未完事件无法续接');
});

test('the backup choice keeps the untouched transcript in the downloaded file',()=>{
  const {n}=stranded();
  n.run("var downloaded=null;A.downloadSave=()=>{downloaded=JSON.stringify(PalaceActions.payload())}");
  n.run('choose(1)');assert.equal(n.run('curEv.title'),'未完事件无法续接');
  assert.equal(n.run('JSON.parse(downloaded).pendingActions.version'),999);
});

class QuotaStore extends Map{
  constructor(){super();this.limit=Infinity;}
  used(){let n=0;for(const [k,v] of this)n+=k.length+String(v).length;return n;}
  set(k,v){const old=this.has(k)?k.length+String(this.get(k)).length:0;
    if(this.used()-old+k.length+String(v).length>this.limit)throw new DOMException('full','QuotaExceededError');return super.set(k,v);}
}
const fakeSnapshots=()=>JSON.stringify(Array.from({length:4},(_,i)=>({label:'y-1-'+i,day:i,date:'旧年',savedAt:i,raw:'x'.repeat(60000)})));

test('a full store gives up rewind snapshots and the backup copy before the live save',()=>{
  const store=new QuotaStore(),b=boot(202,store);start(b);
  const fake=fakeSnapshots();
  store.set(KEY+':snapshots',fake);store.limit=store.used()+500;
  const energy=b.run('E().energy');b.run('A.chat(2);drain()');
  assert.equal(b.run('E().energy'),energy-1);assert.equal(b.run('lastAutoSaveError'),'');
  assert.ok((store.get(KEY+':snapshots')||'').length<fake.length,'snapshots should have been trimmed');
  const next=boot(7,store);next.run("A.load('auto')");assert.equal(next.run('byId(2).voiceVisits'),1);
});

test('a new reign can begin and continue when the browser refuses all storage',()=>{
  const b=boot();b.run("localStorage.setItem=()=>{throw Error('denied')};localStorage.getItem=()=>{throw Error('denied')}");
  start(b);assert.ok(b.run('!!S'));b.run('A.endMonth();drain()');assert.equal(b.run('S.turn'),1);
  assert.ok(b.messages.some(s=>s.includes('尚未写入')));
});

test('a write refused for another reason keeps rewind snapshots and the backup copy',()=>{
  const b=boot();start(b);b.run('A.chat(2);drain()');
  const fake=fakeSnapshots();b.storage.set(KEY+':snapshots',fake);const backup=b.storage.get(KEY+':backup');assert.ok(backup);
  b.run("localStorage.setItem=()=>{var e=Error('denied');e.name='SecurityError';throw e}");
  const energy=b.run('E().energy');b.run("A.out('spa');drain()");
  assert.equal(b.run('E().energy'),energy-1);assert.ok(b.run('!!lastAutoSaveError'));
  assert.equal(b.storage.get(KEY+':snapshots'),fake);assert.equal(b.storage.get(KEY+':backup'),backup);
});
