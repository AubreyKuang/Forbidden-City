/* A pending scene contains closures. Rebuild them from a bounded action transcript,
   never from serialized JavaScript. Each command owns its random draws and answers.
   The saved world remains the authority; replay is checked before it is displayed. */
const PalaceActions=(()=>{
  const version=155, excluded=new Set(['save','dismissSaveError','load','rewind','downloadSave','readSaveFile','undoImport','newGame','officialsFilter','royalKinFilter','officialsBloc','kidsKind','chronicleFilter','chronicleSearch','chronicleClear','chronicleThread']);
  const actions=new Map();
  let blocked=false,snapshotRequested=false,journal=null,depth=0,replaying=false,step=null,cursor=0,answer=0,saving=0,fields=null;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const world=s=>{
    const copy={...s};delete copy.pendingActions;delete copy.savedAt;delete copy.saveVersion;
    // Portrait snapshots are not a second live court register. JSON cannot retain
    // aliases to the canonical household, so ignore this redundant display cache.
    if(s?.retainedFamilies?.length&&s.flags){
      copy.flags={...s.flags};
      for(const key of ['dowager','birthDowager']){
        const d=s.flags[key],c=s.retainedFamilies.find(c=>c.id===d?.personId);
        if(c?.house&&d?.portrait?.house){const portrait={...d.portrait};delete portrait.house;copy.flags[key]={...d,portrait};}
      }
      if(s.flags.seniorDowagers)copy.flags.seniorDowagers=s.flags.seniorDowagers.map(d=>{
        const c=s.retainedFamilies.find(c=>c.id===d.personId);
        if(!c?.house||!d.portrait?.house)return d;
        const portrait={...d.portrait};delete portrait.house;return {...d,portrait};
      });
    }
    // Once summoned, this is a display cache of the canonical maid, not another person.
    const candidate=s?.flags?.maidAudience;
    if(candidate?.person&&s.consorts?.some(c=>c.id===candidate.person.id)){
      copy.flags={...copy.flags,maidAudience:{...candidate}};delete copy.flags.maidAudience.person;
    }
    return copy;
  };
  const stamp=()=>({title:curEv?.title||null,result:!!modalResult,queue:Q.map(e=>e.title)});
  function random(){
    if(!step)return Math.random();
    if(replaying){if(cursor>=step.rolls.length)throw Error('Missing recorded roll');return step.rolls[cursor++];}
    const value=Math.random();step.rolls.push(value);return value;
  }
  function settle(previous){maternalWeddingChanges(previous);if(step?.name!=='start')trackConsortRanks(previous);reconcileDynastyGoals();reconcileConsortDistinctions();meetWhiteSpringMerchants();reconcileSelectionTiming();reconcileCousinFamilies();if(familyOriginsActive())reconcileFamilyOffices();courtFamilyLifeTick(previous);queenHeirFeelings(previous);familyRiseTick(previous);maternalTick();dowagerFamilyChanges(previous);palacePrayerChanges(previous);familyRememberDeathAges(previous);announceConsortPassings(previous);if(S){settleMarriedPrincessEstates();if(!blocked&&journalContentVersion()>=88)observeRitesVacancies();if(typeof haremStewardChanges==='function')haremStewardChanges();syncChildDisgrace();childMotherConsequences(previous);releaseMotherReunionChanges(previous);marriageBondConsequences(previous);gouyiCrownSettled(previous);imperialHeirStories(previous);imperialFertilityFollowups();jinyiweiFeudAlert(previous);if(journal?.version>=3)settleExhaustedMonth(previous);}}
  function input(selector){return fields?fields[selector]:$(selector)?.value;}
  function payload(){return {...S,pendingActions:journal||S?.pendingActions};}
  function run(name,args,fn){
    if(depth)return fn();
    if(exhaustedMonthNotice&&name!=='completeExhaustedMonth')return;
    const canRecord=actions.has(name)||name==='choose'||name==='next';
    if(!canRecord)return fn();
    if(name==='start'){journal=null;blocked=false;}
    const before=S?clone(S):null,prior=journal?clone(journal):null,priorUI=clone(UI);
    if(!journal&&!modalOpen&&!Q.length){
      journal={version,outerHouseholds:true,outerHouseholdUpdates:true,exclusiveStoryOrigins:true,immortalDiscoveryNews:true,betrothalJourneys:true,immortalPeerAdmiration:true,maritalEstates:true,luwanFrontierChronicles:true,luwanFrontierVisuals:true,maidFavorDisputes:true,longLivedDowagers:true,earlyMarriedLife:true,princeSpouseDiscovery:true,princeSpouseParentage:true,xieOnce:true,princeSpousePlacement:true,xiePoetryAge:true,maternalWeddingTalk:true,childPregnancyNews:true,base:S?clone(world(S)):null,ui:clone(UI),steps:[]};
    }
    const current={name,args:clone(args),monthNotice:true,rolls:[],answers:[],saves:[],ui:clone(UI)};
    // A fresh decision in an unfinished older scene uses today's age rules on future replays.
    if(journal&&journal.version<130)current.familyAgeLimits=true;
    if(journal&&journal.version<150)current.uniqueStoryConsorts=true;
    if(journal&&journal.version<133&&name==='choose')current.familyLossAnswer=true;
    if(journal&&!journal.xiePoetryAge&&name==='choose'&&curEv?.poemPrelude)current.xiePoetryAnswer=true;
    if(journal&&journal.version<143&&name==='choose'&&['谢安主动提亲','迟来的心意 · 公主的答复'].includes(curEv?.title))current.xieFreshReply=true;
    // A newly answered return notice can continue even if its journal predates the reunion.
    if(name==='recallHomeLeave'||(name==='choose'&&curEv?.luwanFrontierReturn))current.luwanFrontierReunion=true;
    if(name==='start'){
      const selectors=['#f-sur','#f-name','#f-era','input[name=f-style]:checked'];
      if(journal?.version>=85)selectors.push('input[name=f-scenario]:checked');
      if(journal?.version>=85)selectors.push('#f-dynasty-meta','input[name=f-dynasty-portrait]:checked');
      if(dynastyFollowupActive())selectors.push('#f-dynasty-legacies','#f-dynasty-legacy');
      current.fields=Object.fromEntries(selectors.map(k=>[k,$(k)?.value||'']));
    }
    if(journal){journal.steps.push(current);if(name==='choose'||name==='next')delete journal.draft;}
    step=journal?current:null;depth++;
    const ask=globalThis.confirm,persist=save;
    save=slot=>{const ok=persist(slot);step?.saves.push({slot,ok});return ok;};
    globalThis.confirm=message=>{const value=ask(message);step?.answers.push(value);return value;};
    try{return fn();}
    finally{
      try{if(S){settle(before);if(modalOpen)render();}}
      finally{globalThis.confirm=ask;save=persist;depth--;step=null;}
      if(journal)journal.pending=stamp();
      if(!modalOpen&&!Q.length){
        const oldOrigins=journal&&!journal.exclusiveStoryOrigins,oldEstates=journal&&!journal.maritalEstates;
        journal=null;
        if(oldOrigins)reconcileStoryConsortOrigins();
        if(oldEstates)settleMarriedPrincessEstates();
      }
      if(S&&!replaying){
        const ok=save('auto');
        // Only undo when writing would overwrite something newer or a save we must keep intact.
        // A full or unavailable store keeps the decision in play; the HUD asks for a backup file.
        const guarded=!ok&&(blocked||['newer','conflict'].includes(SaveManager.status(SaveManager.getStorage(),SKEY+'auto')));
        if(guarded&&(JSON.stringify(world(S))!==JSON.stringify(world(before)))){
          S=before;Q.length=0;curEv=null;modalOpen=false;modalResult=null;Object.assign(UI,priorUI);
          $('#modal').close?.();$('#modal').hidden=true;
          if(prior)restore(prior);else journal=null;
          render();
          if(blocked){toast('请先处理无法续接的未完事件，这次操作已撤回。');if(typeof pendingRecoveryEvent==='function')pushEv(pendingRecoveryEvent());}
          else toast('存档已在别处更新，这次操作已撤回。可重新读取或下载现有进度。');
        }
        if(snapshotRequested){snapshotRequested=false;if(ok)snapshotYear();}
        // A kept decision (saved, or held in play while storage is unavailable) may still reach the month's end.
        if(ok||!guarded)syncExhaustedMonthNotice();else clearExhaustedMonthNotice();
        if(!guarded)dismissInvalidStoryOrigin();
      }
    }
  }
  function valid(j){
    return !!j&&Number.isInteger(j.version)&&j.version>=2&&j.version<=version&&(j.base===null||validPalaceSave(j.base))&&!j.base?.pendingActions&&
      record(j.ui)&&(j.draft===undefined||typeof j.draft==='string'&&j.draft.length<=128)&&Array.isArray(j.steps)&&j.steps.length>0&&j.steps.length<=2048&&j.steps.every(s=>
        record(s)&&(s.monthNotice===undefined||typeof s.monthNotice==='boolean')&&((s.name==='choose'&&s.args?.length===2&&Number.isInteger(s.args[0]))||
          (s.name==='next'&&s.args?.length===0)||actions.has(s.name))&&
        Array.isArray(s.args)&&s.args.length<=8&&s.args.every(a=>a===null||typeof a==='string'||typeof a==='boolean'||Number.isFinite(a))&&
        Array.isArray(s.rolls)&&s.rolls.length<=100000&&s.rolls.every(n=>Number.isFinite(n)&&n>=0&&n<1)&&
        Array.isArray(s.answers)&&s.answers.every(a=>typeof a==='boolean')&&Array.isArray(s.saves)&&s.saves.every(v=>record(v)&&typeof v.slot==='string'&&typeof v.ok==='boolean')&&record(s.ui)&&
        (s.fields===undefined||record(s.fields)&&Object.values(s.fields).every(v=>typeof v==='string')))&&record(j.pending);
  }
  function restore(j){
    clearExhaustedMonthNotice();
    journal=null;blocked=false;if(!j)return false;
    const saved=S,ui=clone(UI),ask=globalThis.confirm,sound=AU.sfx,persist=save;
    try{
      if(!valid(j))throw Error('Unsupported pending actions');
      // Unpublished v76 previews already stored the outside register but had no feature flag.
      if(j.version===76&&j.outerHouseholds===undefined&&(saved.outerRegisters||saved.flags?.outerTrip||j.steps.some(s=>s.name.startsWith('outer'))))
        j={...j,outerHouseholds:true};
      replaying=true;depth++;journal=clone(j);S=j.base?clone(j.base):null;Object.assign(UI,j.ui);
      AU.sfx=()=>{};
      for(const command of j.steps){
        const previous=S?(journal.version>=15?clone(S):{turn:S.turn,gen:S.gen,emp:{energy:E().energy}}):null;
        step=command;cursor=0;answer=0;saving=0;fields=command.fields||null;Object.assign(UI,command.ui);
        save=slot=>{const entry=command.saves[saving++];if(!entry||entry.slot!==slot)throw Error('Changed save');return entry.ok;};
        globalThis.confirm=()=>{if(answer>=command.answers.length)throw Error('Missing answer');return command.answers[answer++];};
        if(command.name==='choose')choose(...command.args);
        else if(command.name==='next')nextEv();
        else actions.get(command.name)(...command.args);
        if(S){settle(previous);if(modalOpen)render();}
        if(cursor!==command.rolls.length||answer!==command.answers.length||saving!==command.saves.length)throw Error('Changed action');
      }
      // Position can change through walking between commands; it is not a decision.
      S.pos=saved.pos;
      if(JSON.stringify(world(S))!==JSON.stringify(world(saved))||JSON.stringify(stamp())!==JSON.stringify(j.pending))throw Error('Changed story');
      S.savedAt=saved.savedAt;journal=clone(j);if(j.draft!==undefined&&curEv?.input)$('#minput').value=j.draft;return true;
    }catch(error){
      console.warn('Pending scene recovery:',error.message);
      // The untouched transcript stays on the world; no partial replay is kept as the live journal.
      journal=null;S=saved;S.pendingActions=j;blocked=true;Q.length=0;curEv=null;modalOpen=false;modalResult=null;
      Object.assign(UI,ui);
      toast('这份存档的未完事件无法在当前版本续接，人物进度已保留。');
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
  // Leave an unrecoverable scene behind on the player's word: the saved world stays,
  // the transcript is dropped and saving resumes. Returns the scenes that were never answered.
  function abandon(){
    if(!blocked||!S)return null;
    const pending=S.pendingActions?.pending||{};
    delete S.pendingActions;journal=null;blocked=false;
    return [...(pending.result||!pending.title?[]:[pending.title]),...(Array.isArray(pending.queue)?pending.queue:[])];
  }
  return {random,input,keepInput,payload,run,restore,valid,install,abandon,
    get maritalEstates(){return !journal||journal.maritalEstates===true;},
    get outerHouseholds(){return !journal||journal.outerHouseholds===true;},
    get balancedImmortalDiscovery(){return journal?.balancedImmortalDiscovery===true;},
    get luwanFrontierChronicles(){return !journal||journal.luwanFrontierChronicles===true;},
    get luwanFrontierVisuals(){return !journal||journal.luwanFrontierVisuals===true;},
    get luwanFrontierReunion(){return !step||step.luwanFrontierReunion===true;},
    get replayRollsExhausted(){return replaying&&step&&cursor===step.rolls.length;},
    get immortalPeerAdmiration(){return !journal||journal.immortalPeerAdmiration===true||journal.balancedImmortalDiscovery===true;},
    get maidFavorDisputes(){return !journal||journal.maidFavorDisputes===true;},
    get longLivedDowagers(){return !journal||journal.longLivedDowagers===true;},
    get earlyMarriedLife(){return !journal||journal.earlyMarriedLife===true;},
    get princeSpouseDiscovery(){return !journal||journal.princeSpouseDiscovery===true;},
    get princeSpouseParentage(){return !journal||journal.princeSpouseParentage===true;},
    get xieOnce(){return !journal||journal.xieOnce===true;},
    get princeSpousePlacement(){return !journal||journal.princeSpousePlacement===true;},
    get betrothalJourneys(){return !journal||journal.betrothalJourneys===true;},
    get immortalDiscoveryNews(){return !journal||journal.immortalDiscoveryNews===true;},
    get uniqueStoryConsorts(){return !journal||journal.version>=150||step?.uniqueStoryConsorts===true;},
    get exclusiveStoryOrigins(){return !journal||journal.exclusiveStoryOrigins===true;},
    get outerHouseholdUpdates(){return !journal||journal.outerHouseholdUpdates===true;},
    get childPregnancyNews(){return !journal||journal.childPregnancyNews===true;},
    get maternalWeddingTalk(){return !journal||journal.maternalWeddingTalk===true;},
    get xiePoetryAge(){return !journal||journal.xiePoetryAge===true;},
    get xiePoetryAnswer(){return step?.xiePoetryAnswer===true;},
    get xieFreshReply(){return step?.xieFreshReply===true;},
    get familyLossAnswer(){return !replaying||journal?.version>=133||step?.familyLossAnswer===true;},
    get familyAgeLimits(){return !replaying||journal?.version>=130||step?.familyAgeLimits===true;},
    get releaseVersion(){return version;},get contentVersion(){return journal?.version??version;},get legacy(){return journal?.version===2;},get immediateMonth(){return journal?.version===3&&!step?.monthNotice;},get blocked(){return blocked;},requestSnapshot(){snapshotRequested=true;},get busy(){return depth>0;},get replaying(){return replaying;},reset(){clearExhaustedMonthNotice();journal=null;blocked=false;}};
})();
PalaceActions.install();
