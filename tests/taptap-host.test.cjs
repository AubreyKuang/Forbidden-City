const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../js/taptap.js'),'utf8');
function run(globals){
  const classes=new Set(),listeners={};
  const context=vm.createContext({console:{warn(){}},document:{documentElement:{classList:{add:c=>classes.add(c)}}},
    addEventListener:(name,fn)=>{listeners[name]=fn;},...globals});
  vm.runInContext(source,context);
  return {context,classes,listeners,host:vm.runInContext('TapTapHost',context)};
}

test('outside TapTap the module stays inert',()=>{
  const {host,classes}=run({});
  assert.equal(host.inHost,false);assert.equal(host.state,'none');assert.equal(classes.size,0);
});

test('inside TapTap it logs in once without blocking and keeps the code on the device',async()=>{
  const calls=[];
  const tap={login(options){calls.push(options);options.success({code:'one-time-code'});}};
  const {host,classes,listeners}=run({tap});
  listeners.load();
  assert.equal(calls.length,1);assert.equal(host.state,'ok');assert.ok(classes.has('taptap-host'));
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon/,'the login code is never sent anywhere');
});

test('a host injected after the scripts ran is picked up on load, and a failed login is tolerated',()=>{
  const {context,host,listeners}=run({});
  context.tap={login(options){options.fail({errMsg:'login:fail cancel'});}};
  listeners.load();
  assert.equal(host.state,'failed');
});
