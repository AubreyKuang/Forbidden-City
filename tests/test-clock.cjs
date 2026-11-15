// Opt-in clock for testing delayed UI actions without wall-clock sleeps.
function withClock(game){
  let now=0,id=0;const timers=new Map();
  game.ctx.setTimeout=(fn,delay=0)=>{const key=++id;timers.set(key,{fn,due:now+delay});return key;};
  game.ctx.clearTimeout=key=>timers.delete(key);
  game.ctx.tick=ms=>{
    const end=now+ms;let count=0;
    while(true){
      const next=[...timers].filter(([,timer])=>timer.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next)break;
      if(++count>1000)throw Error('Timer loop');
      now=next[1].due;timers.delete(next[0]);next[1].fn();
    }
    now=end;
  };
  return game;
}
module.exports={withClock};
