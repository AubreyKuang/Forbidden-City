/* ============ 音频（Web Audio 现场合成，无音频文件） ============ */
// Four bars of sixteen half-beats per scene. Each bar pairs a guzheng melody with a short flute reply.
const SCORE={
  court:{beat:.62,bars:[
    {strings:[[0,5],[2,7],[4,8],[7,7],[9,6]], flute:[[11,7],[13,5]]},
    {strings:[[0,3],[2,5],[4,6],[7,8],[10,6]], flute:[[12,8]]},
    {strings:[[0,5],[2,7],[4,8],[7,9],[9,10]], flute:[[11,8],[13,7]]},
    {strings:[[0,8],[3,7],[5,6],[8,7],[10,5]], flute:[[12,5]]}
  ]},
  harem:{beat:.66,bars:[
    {strings:[[0,7],[3,8],[5,7],[8,5]], flute:[[10,6],[13,7]]},
    {strings:[[0,6],[3,8],[6,9],[9,8]], flute:[[11,6],[13,8]]},
    {strings:[[0,7],[3,8],[5,10],[8,9],[10,8]], flute:[[12,7]]},
    {strings:[[0,8],[3,7],[6,6],[9,5]], flute:[[12,7]]}
  ]},
  garden:{beat:.60,bars:[
    {strings:[[0,5],[2,7],[3,8],[6,10],[8,8]], flute:[[10,7],[13,8]]},
    {strings:[[0,6],[2,8],[3,9],[6,8],[9,6]], flute:[[11,6],[13,8]]},
    {strings:[[0,5],[2,7],[3,8],[6,10],[8,12]], flute:[[10,10],[13,8]]},
    {strings:[[0,8],[2,7],[4,6],[7,7],[10,5]], flute:[[12,5]]}
  ]},
  night:{beat:.72,bars:[
    {strings:[[0,5],[4,7],[7,8]], flute:[[10,7],[13,5]]},
    {strings:[[0,6],[4,8],[8,9]], flute:[[11,8]]},
    {strings:[[0,5],[4,7],[7,10]], flute:[[10,8],[13,7]]},
    {strings:[[0,8],[4,7],[8,5]], flute:[[11,5]]}
  ]},
  city:{beat:.57,bars:[
    {strings:[[0,5],[2,7],[4,8],[6,7],[7,8],[9,10]], flute:[[11,8],[13,7]]},
    {strings:[[0,6],[2,8],[4,9],[6,8],[7,6],[9,8]], flute:[[11,9],[13,8]]},
    {strings:[[0,5],[2,7],[4,8],[6,10],[7,9],[9,10]], flute:[[11,10],[13,8]]},
    {strings:[[0,8],[2,7],[4,6],[6,7],[7,6],[9,5]], flute:[[12,5]]}
  ]}
};
// Original pentatonic miniatures, not recordings or arrangements of historical pieces.
const PALACE_MUSIC={
  stream:{name:'清泉 · 古筝',voice:'zheng',beat:.76,bars:[
    {strings:[[0,3],[3,5],[5,6],[8,8,'roll'],[12,7,'bend']],flute:[]},
    {strings:[[0,6],[3,7],[6,5,'bend'],[11,3]],flute:[[13,5]]},
    {strings:[[0,5],[2,6],[5,8],[8,10,'roll'],[12,8]],flute:[]},
    {strings:[[0,7,'bend'],[5,6],[8,5]],flute:[[11,6],[14,5]]},
    {strings:[[0,3],[4,5,'roll'],[7,7],[11,8,'bend']],flute:[]},
    {strings:[[0,10],[3,8],[6,7],[10,6,'bend']],flute:[[13,8]]},
    {strings:[[0,8,'roll'],[4,7],[7,6],[10,5]],flute:[]},
    {strings:[[0,6,'bend'],[5,3],[9,5,'roll']],flute:[]}
  ]},
  silk:{name:'花月 · 琵琶',voice:'pipa',beat:.67,bars:[
    {strings:[[0,5],[2,7],[4,8,'grace'],[7,7],[10,5,'tremolo']],flute:[]},
    {strings:[[0,6],[3,8,'grace'],[6,7],[9,6],[12,5]],flute:[]},
    {strings:[[0,8],[2,10],[5,12,'tremolo'],[10,10],[13,8]],flute:[]},
    {strings:[[0,7,'grace'],[3,6],[6,5,'tremolo']],flute:[[12,5]]},
    {strings:[[0,3],[2,5],[5,7,'tremolo'],[10,8]],flute:[]},
    {strings:[[0,10,'grace'],[3,8],[6,7],[9,6,'tremolo']],flute:[]},
    {strings:[[0,8],[3,7,'grace'],[6,5],[9,6],[12,7]],flute:[]},
    {strings:[[0,6,'tremolo'],[6,3],[10,5]],flute:[]}
  ]},
  pine:{name:'松风 · 琴箫',voice:'qin',beat:.90,bars:[
    {strings:[[0,3],[5,5,'bend']],flute:[[9,7],[13,8]]},
    {strings:[[0,6],[5,3]],flute:[[8,6],[12,5]]},
    {strings:[[0,5,'harmonic'],[6,7]],flute:[[10,8]]},
    {strings:[[0,6],[5,5,'bend']],flute:[[9,7],[13,5]]},
    {strings:[[0,3],[6,6,'harmonic']],flute:[[10,8]]},
    {strings:[[0,5,'bend'],[7,3]],flute:[[10,5]]}
  ]},
  scene:{name:'随场景变奏',voice:'zheng'}
};
const STRING_VOICES={
  zheng:{length:3,decay:.62,noise:.28,attack:.008,filter:4.5},
  pipa:{length:1.55,decay:.27,noise:.4,attack:.003,filter:5.7},
  qin:{length:3.5,decay:.8,noise:.12,attack:.018,filter:2.7}
};
function savedMusicTrack(){try{const id=localStorage.getItem('palace-music-track');return Object.hasOwn(PALACE_MUSIC,id)?id:'stream';}catch{return 'stream';}}
const SCORE_HARMONY=[[0,2],[3,6],[0,3],[0,2]]; // D–F♯, A–E, D–A, D–F♯
const AU={track:savedMusicTrack(),musicDry:null,musicWet:null,ctx:null,on:false,bus:null,master:null,wet:null,fluteWave:null,timer:null,next:0,step:0,mode:'court',playingMode:'court',ks:new Map(),
  init(){ if(this.ctx) return true; try{
    const AC=window.AudioContext||window.webkitAudioContext; const c=this.ctx=new AC();
    this.bus=c.createGain();this.bus.gain.value=.40;const mlp=c.createBiquadFilter();mlp.type='lowpass';mlp.frequency.value=3300;mlp.Q.value=.5;const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.25;this.bus.connect(mlp);mlp.connect(comp);
    this.master=c.createGain();this.master.gain.value=0;comp.connect(this.master);this.master.connect(c.destination);
    const d1=c.createDelay(1),d2=c.createDelay(1),fb=c.createGain(),lp=c.createBiquadFilter();
    d1.delayTime.value=.24;d2.delayTime.value=.36;fb.gain.value=.22;lp.type='lowpass';lp.frequency.value=1800;
    this.wet=c.createGain();this.wet.gain.value=.25;this.wet.connect(d1);this.wet.connect(d2);
    d1.connect(lp);d2.connect(lp);lp.connect(fb);fb.connect(d1);lp.connect(this.bus);
    this.resetMusicBus();
    this.fluteWave=c.createPeriodicWave(new Float32Array(3),new Float32Array([0,1,.12]));
    return true;}catch(e){return false} },
  toggle(){ if(!this.init()){toast('此浏览器不支持网页音频');return}
    this.on=!this.on; if(this.ctx.state==='suspended') this.ctx.resume();
    const now=this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.on?1:0,now,.06);
    $('#snd').textContent=this.on?'♪ 声音：开':'♪ 开启声音'; $('#snd').classList.toggle('on',this.on);$('#snd').setAttribute('aria-pressed',this.on);
    if(this.on){this.resetMusicBus();this.step=0;this.next=now+.16;this.timer=setInterval(()=>this.sched(),100);this.sched()} else {clearInterval(this.timer);this.timer=null;} },
  resetMusicBus(){
    const now=this.ctx.currentTime;
    for(const bus of [this.musicDry,this.musicWet])if(bus){
      bus.gain.cancelScheduledValues(now);bus.gain.setTargetAtTime(0,now,.035);
      setTimeout(()=>bus.disconnect(),350);
    }
    this.musicDry=this.ctx.createGain();this.musicWet=this.ctx.createGain();
    this.musicDry.connect(this.bus);this.musicWet.connect(this.wet);
    for(const bus of [this.musicDry,this.musicWet]){bus.gain.value=0;bus.gain.setTargetAtTime(1,now+.1,.08);}
  },
  selectTrack(id){
    if(!Object.hasOwn(PALACE_MUSIC,id)||id===this.track)return;
    this.track=id;
    try{localStorage.setItem('palace-music-track',id);}catch{}
    if(this.ctx){this.resetMusicBus();this.step=0;this.next=this.ctx.currentTime+.15;this.sched();}
  },
  out(vol,wet=1,music=false){const g=this.ctx.createGain();g.gain.value=vol;g.connect(music?this.musicDry:this.bus);if(wet){const w=this.ctx.createGain();w.gain.value=wet;g.connect(w);w.connect(music?this.musicWet:this.wet)}return g},
  // Karplus-Strong 拨弦：用噪声 + 延迟线平均算出古筝般的音色
  ksBuf(f,voice='zheng'){const profile=STRING_VOICES[voice],k=voice+':'+Math.round(f); if(this.ks.has(k)) return this.ks.get(k);
    const sr=this.ctx.sampleRate,len=Math.floor(sr*profile.length),b=this.ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
    const period=sr/f-.5,N=Math.floor(period),fraction=period-N;
    const ex=new Float32Array(N);for(let i=0;i<N;i++)ex[i]=Math.random()*2-1;
    for(let pass=0;pass<3;pass++)for(let i=1;i<N;i++)ex[i]=ex[i]*.5+ex[i-1]*.5;
    // Give the string a stable pitch and a few upper harmonics beneath the pluck transient.
    let mean=0;
    for(let i=0;i<N;i++){
      const phase=2*Math.PI*i/N;
      ex[i]=ex[i]*profile.noise+Math.sin(phase)*.54+Math.sin(phase*2)*.25+Math.sin(phase*3)*.12;
      mean+=ex[i]/N;
    }
    for(let i=0;i<N;i++)d[i]=ex[i]-mean;
    const decay=Math.exp(-1/(f*profile.decay));
    for(let i=N;i<len;i++){
      const delayed=i-N;
      const current=(d[delayed]+(d[delayed-1]||0))*.5;
      const previous=((d[delayed-1]||0)+(d[delayed-2]||0))*.5;
      d[i]=(current*(1-fraction)+previous*fraction)*decay;
    }
    const attack=Math.floor(sr*profile.attack);
    for(let i=0;i<attack;i++) d[i]*=i/attack;
    this.ks.set(k,b);return b},
  pluck(f,t,vol=.3,bend=false,voice='zheng',music=false){const c=this.ctx,s=c.createBufferSource(),profile=STRING_VOICES[voice];s.buffer=this.ksBuf(f,voice);
    if(bend){s.playbackRate.setValueAtTime(1,t+.18);s.playbackRate.linearRampToValueAtTime(1.025,t+.43);s.playbackRate.linearRampToValueAtTime(1,t+.72)}
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=115;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(voice==='pipa'?4200:3150,f*profile.filter);lp.Q.value=.4;s.connect(hp);hp.connect(lp);lp.connect(this.out(vol,voice==='pipa'?.22:.4,music));s.start(t);s.stop(t+profile.length)},
  flute(f,t,dur,vol=.055,music=false){const c=this.ctx,o=c.createOscillator(),g=c.createGain(),v=c.createOscillator(),vg=c.createGain();
    o.setPeriodicWave(this.fluteWave);o.frequency.value=f;v.frequency.value=4.2;vg.gain.value=f*.0025;v.connect(vg);vg.connect(o.frequency);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.23);g.gain.setValueAtTime(vol*.85,t+dur*.6);g.gain.linearRampToValueAtTime(0,t+dur);
    const n=c.createBufferSource(),nb=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    n.buffer=nb;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=2;const ng=c.createGain();ng.gain.value=.07;n.connect(bp);bp.connect(ng);ng.connect(g);
    o.connect(g);g.connect(this.out(1,.5,music));o.start(t);v.start(t);n.start(t);o.stop(t+dur);v.stop(t+dur);n.stop(t+dur)},
  bell(f,t,vol=.18,dur=2.5){const c=this.ctx;[[1,1],[2.01,.3],[2.76,.12]].forEach(([m,a])=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f*m;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*a,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur/m**.5);o.connect(g);g.connect(this.out(1,.8));o.start(t);o.stop(t+dur)})},
  wood(t,f=900,vol=.25){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.7,t+.06);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);g.connect(this.out(1,.2));o.start(t);o.stop(t+.1)},
  // 五声音阶（宫商角徵羽）——D 宫
  note(d,oct=0){const sc=[0,2,4,7,9];const o=Math.floor(d/5),i=((d%5)+5)%5;return 293.66*2**((sc[i]+12*(o+oct))/12)},
  stringNote(degree,t,vol,ornament,voice){
    const play=(d,time,v,bend=false)=>this.pluck(this.note(d),time,v,bend,voice,true);
    if(ornament==='tremolo'){
      for(let i=0;i<7;i++)play(degree,t+i*.095,vol*(i%2?.6:.78)*(1-i*.055));
    }else if(ornament==='roll'){
      [degree-5,degree-3,degree].forEach((d,i)=>play(d,t+i*.06,vol*(i===2?1:.38)));
    }else if(ornament==='grace'){
      play(degree-1,t,vol*.45);play(degree,t+.065,vol);
    }else play(degree,t,vol*(ornament==='harmonic'?.6:1),ornament==='bend');
  },
  sched(){ if(!this.on) return; const c=this.ctx;
    if(this.next<c.currentTime-.15)this.next=c.currentTime+.025;
    while(this.next<c.currentTime+.4){
      const slot=this.step%16,track=PALACE_MUSIC[this.track];
      if(this.track==='scene'&&slot===0&&this.playingMode!==this.mode){this.playingMode=this.mode;this.step=0;}
      const score=this.track==='scene'?(SCORE[this.playingMode]||SCORE.court):track;
      const {beat,bars}=score,barIndex=Math.floor(this.step/16)%bars.length,bar=bars[barIndex];
      const t=Math.max(this.next,c.currentTime+.005),night=this.mode==='night';
      const melody=bar.strings.find(([at])=>at===slot),reply=bar.flute.find(([at])=>at===slot);
      // Sparse lower strings, no drum pulse or continuous chord bed.
      if(slot===0&&barIndex%2===0)this.pluck(this.note(SCORE_HARMONY[barIndex%4][0]),t,.027,false,track.voice,true);
      if(melody)this.stringNote(melody[1],t,(night?.13:.16)*(slot%4===0?1:.86),melody[2],track.voice);
      if(reply)this.flute(this.note(reply[1]),t,beat*(this.track==='pine'?1.7:1.1),night?.035:.047,true);
      this.step=(this.step+1)%(bars.length*16);this.next+=beat/2;
    }
  },
  setMode(m){this.mode=m},
  sfx(n){ if(!this.on||!this.ctx) return; const t=this.ctx.currentTime+.01;
    if(n==='click') this.wood(t,620,.052);
    else if(n==='chime'){this.bell(587,t,.09);this.bell(880,t+.14,.06)}
    else if(n==='gong'){this.bell(196,t,.105,3.4);this.pluck(this.note(0),t+.16,.07)}
    else if(n==='coin'){[1760,2349].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f/2;g.gain.setValueAtTime(.06,t+i*.07);g.gain.exponentialRampToValueAtTime(.001,t+i*.07+.12);o.connect(g);g.connect(this.out(1,.3));o.start(t+i*.07);o.stop(t+i*.07+.13)})}
    else if(n==='err') this.wood(t,300,.2);
    else if(n==='joy'){[0,1,2,3,5].forEach((d,i)=>this.pluck(this.note(d),t+i*.12,.2))}
    else if(n==='sad'){[7,5,3,1].forEach((d,i)=>this.pluck(this.note(d,-1),t+i*.3,.2,true))}
    else if(n==='page') this.pluck(this.note(4),t,.1);
  }};
