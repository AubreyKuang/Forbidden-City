/* A pending scene contains closures. Rebuild them from a bounded action transcript,
   never from serialized JavaScript. Each command owns its random draws and answers.
   The saved world remains the authority; replay is checked before it is displayed. */
const PalaceActions=(()=>{
  const version=2, excluded=new Set(['save','load','rewind','downloadSave','readSaveFile','undoImport','newGame']);
  const actions=new Map();
  let blocked=false,snapshotRequested=false,journal=null,depth=0,replaying=false,step=null,cursor=0,answer=0,saving=0,fields=null;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const world=s=>{const copy={...s};delete copy.pendingActions;delete copy.savedAt;delete copy.saveVersion;return copy;};
  const stamp=()=>({title:curEv?.title||null,result:!!modalResult,queue:Q.map(e=>e.title)});
  function random(){
    if(!step)return Math.random();
    if(replaying){if(cursor>=step.rolls.length)throw Error('Missing recorded roll');return step.rolls[cursor++];}
    const value=Math.random();step.rolls.push(value);return value;
  }
  function settle(){for(const c of S?.consorts||[])if(c.childDisgrace&&(!c.cold||!c.alive||c.gone))c.childDisgrace.active=false;}
  function input(selector){return fields?fields[selector]:$(selector)?.value;}
  function payload(){return {...S,pendingActions:journal||S?.pendingActions};}
  function run(name,args,fn){
    if(depth)return fn();
    const canRecord=actions.has(name)||name==='choose'||name==='next';
    if(!canRecord)return fn();
    if(name==='start'){journal=null;blocked=false;}
    const before=S?clone(S):null,prior=journal?clone(journal):null,priorUI=clone(UI);
    if(!journal&&!modalOpen&&!Q.length){
      journal={version,base:S?clone(world(S)):null,ui:clone(UI),steps:[]};
    }
    const current={name,args:clone(args),rolls:[],answers:[],saves:[],ui:clone(UI)};
    if(name==='start')current.fields=Object.fromEntries(['#f-sur','#f-name','#f-era','input[name=f-style]:checked'].map(k=>[k,$(k)?.value||'']));
    if(journal){journal.steps.push(current);if(name==='choose'||name==='next')delete journal.draft;}
    step=journal?current:null;depth++;
    const ask=globalThis.confirm,persist=save;
    save=slot=>{const ok=persist(slot);step?.saves.push({slot,ok});return ok;};
    globalThis.confirm=message=>{const value=ask(message);step?.answers.push(value);return value;};
    try{return fn();}
    finally{
      try{if(S){settle();if(modalOpen)render();}}
      finally{globalThis.confirm=ask;save=persist;depth--;step=null;}
      if(journal)journal.pending=stamp();
      if(!modalOpen&&!Q.length)journal=null;
      if(S&&!replaying){
        const ok=save('auto');
        if(!ok&&(JSON.stringify(world(S))!==JSON.stringify(world(before)))){
          S=before;Q.length=0;curEv=null;modalOpen=false;modalResult=null;Object.assign(UI,priorUI);
          $('#modal').close?.();$('#modal').hidden=true;
          if(prior)restore(prior);else journal=null;
          render();toast('未能保存，这次操作已撤回。可重试或下载现有进度。');
        }
        if(snapshotRequested){snapshotRequested=false;if(ok)snapshotYear();}
      }
    }
  }
  function valid(j){
    return !!j&&j.version===version&&(j.base===null||validPalaceSave(j.base))&&!j.base?.pendingActions&&
      record(j.ui)&&(j.draft===undefined||typeof j.draft==='string'&&j.draft.length<=128)&&Array.isArray(j.steps)&&j.steps.length>0&&j.steps.length<=2048&&j.steps.every(s=>
        record(s)&&((s.name==='choose'&&s.args?.length===2&&Number.isInteger(s.args[0]))||
          (s.name==='next'&&s.args?.length===0)||actions.has(s.name))&&
        Array.isArray(s.args)&&s.args.length<=8&&s.args.every(a=>a===null||typeof a==='string'||typeof a==='boolean'||Number.isFinite(a))&&
        Array.isArray(s.rolls)&&s.rolls.length<=100000&&s.rolls.every(n=>Number.isFinite(n)&&n>=0&&n<1)&&
        Array.isArray(s.answers)&&s.answers.every(a=>typeof a==='boolean')&&Array.isArray(s.saves)&&s.saves.every(v=>record(v)&&typeof v.slot==='string'&&typeof v.ok==='boolean')&&record(s.ui)&&
        (s.fields===undefined||record(s.fields)&&Object.values(s.fields).every(v=>typeof v==='string')))&&record(j.pending);
  }
  function restore(j){
    journal=null;blocked=false;if(!j)return false;
    const saved=S,ui=clone(UI),ask=globalThis.confirm,sound=AU.sfx,persist=save;
    try{
      if(!valid(j))throw Error('Unsupported pending actions');
      replaying=true;depth++;S=j.base?clone(j.base):null;Object.assign(UI,j.ui);
      AU.sfx=()=>{};
      for(const command of j.steps){
        step=command;cursor=0;answer=0;saving=0;fields=command.fields||null;Object.assign(UI,command.ui);
        save=slot=>{const entry=command.saves[saving++];if(!entry||entry.slot!==slot)throw Error('Changed save');return entry.ok;};
        globalThis.confirm=()=>{if(answer>=command.answers.length)throw Error('Missing answer');return command.answers[answer++];};
        if(command.name==='choose')choose(...command.args);
        else if(command.name==='next')nextEv();
        else actions.get(command.name)(...command.args);
        if(S){settle();if(modalOpen)render();}
        if(cursor!==command.rolls.length||answer!==command.answers.length||saving!==command.saves.length)throw Error('Changed action');
      }
      // Position can change through walking between commands; it is not a decision.
      S.pos=saved.pos;
      if(JSON.stringify(world(S))!==JSON.stringify(world(saved))||JSON.stringify(stamp())!==JSON.stringify(j.pending))throw Error('Changed story');
      S.savedAt=saved.savedAt;journal=clone(j);if(j.draft!==undefined&&curEv?.input)$('#minput').value=j.draft;return true;
    }catch(error){
      console.warn('Pending scene recovery:',error.message);
      S=saved;S.pendingActions=j;blocked=true;Q.length=0;curEv=null;modalOpen=false;modalResult=null;
      Object.assign(UI,ui);
      toast('这份存档的未完事件无法在当前版本续接，人物进度已保留。请保留备份，勿覆盖原槽位。');
      return false;
    }finally{depth=Math.max(0,depth-1);replaying=false;step=null;fields=null;AU.sfx=sound;globalThis.confirm=ask;save=persist;}
  }
  function keepInput(value){if(!journal||!curEv?.input||modalResult)return;journal.draft=String(value).slice(0,curEv.input.max||4);save('auto');}
  function install(){
    for(const [name,fn] of Object.entries(A)){
      if(excluded.has(name))continue;
      actions.set(name,fn.bind(A));
      A[name]=function(...args){return run(name,args,()=>fn.apply(this,args));};
    }
  }
  return {random,input,keepInput,payload,run,restore,valid,install,get blocked(){return blocked;},requestSnapshot(){snapshotRequested=true;},get busy(){return depth>0;},get replaying(){return replaying;},reset(){journal=null;blocked=false;}};
})();
PalaceActions.install();
