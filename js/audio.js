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
const SCORE_HARMONY=[[0,2],[3,6],[0,3],[0,2]]; // D–F♯, A–E, D–A, D–F♯
const AU={ctx:null,on:false,bus:null,master:null,wet:null,fluteWave:null,timer:null,next:0,step:0,mode:'court',playingMode:'court',ks:new Map(),
  init(){ if(this.ctx) return true; try{
    const AC=window.AudioContext||window.webkitAudioContext; const c=this.ctx=new AC();
    this.bus=c.createGain();this.bus.gain.value=.40;const mlp=c.createBiquadFilter();mlp.type='lowpass';mlp.frequency.value=3300;mlp.Q.value=.5;const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.25;this.bus.connect(mlp);mlp.connect(comp);
    this.master=c.createGain();this.master.gain.value=0;comp.connect(this.master);this.master.connect(c.destination);
    const d1=c.createDelay(1),d2=c.createDelay(1),fb=c.createGain(),lp=c.createBiquadFilter();
    d1.delayTime.value=.24;d2.delayTime.value=.36;fb.gain.value=.22;lp.type='lowpass';lp.frequency.value=1800;
    this.wet=c.createGain();this.wet.gain.value=.25;this.wet.connect(d1);this.wet.connect(d2);
    d1.connect(lp);d2.connect(lp);lp.connect(fb);fb.connect(d1);lp.connect(this.bus);
    this.fluteWave=c.createPeriodicWave(new Float32Array(3),new Float32Array([0,1,.12]));
    return true;}catch(e){return false} },
  toggle(){ if(!this.init()){toast('此浏览器不支持网页音频');return}
    this.on=!this.on; if(this.ctx.state==='suspended') this.ctx.resume();
    const now=this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.on?1:0,now,.06);
    $('#snd').textContent=this.on?'♪ 声音：开':'♪ 开启声音'; $('#snd').classList.toggle('on',this.on);$('#snd').setAttribute('aria-pressed',this.on);
    if(this.on){this.step=0;this.next=now+.16;this.timer=setInterval(()=>this.sched(),100)} else {clearInterval(this.timer)} },
  out(vol,wet=1){const g=this.ctx.createGain();g.gain.value=vol;g.connect(this.bus);if(wet){const w=this.ctx.createGain();w.gain.value=wet;g.connect(w);w.connect(this.wet)}return g},
  // Karplus-Strong 拨弦：用噪声 + 延迟线平均算出古筝般的音色
  ksBuf(f){const k=Math.round(f); if(this.ks.has(k)) return this.ks.get(k);
    const sr=this.ctx.sampleRate,len=Math.floor(sr*2.2),b=this.ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
    const period=sr/f-.5,N=Math.floor(period),fraction=period-N;
    const ex=new Float32Array(N);for(let i=0;i<N;i++)ex[i]=Math.random()*2-1;
    for(let pass=0;pass<3;pass++)for(let i=1;i<N;i++)ex[i]=ex[i]*.5+ex[i-1]*.5;
    // Give the string a stable pitch and a few upper harmonics beneath the pluck transient.
    let mean=0;
    for(let i=0;i<N;i++){
      const phase=2*Math.PI*i/N;
      ex[i]=ex[i]*.44+Math.sin(phase)*.46+Math.sin(phase*2)*.32+Math.sin(phase*3)*.18;
      mean+=ex[i]/N;
    }
    for(let i=0;i<N;i++)d[i]=ex[i]-mean;
    const decay=Math.exp(-1/(f*.38));
    for(let i=N;i<len;i++){
      const delayed=i-N;
      const current=(d[delayed]+(d[delayed-1]||0))*.5;
      const previous=((d[delayed-1]||0)+(d[delayed-2]||0))*.5;
      d[i]=(current*(1-fraction)+previous*fraction)*decay;
    }
    const attack=Math.floor(sr*.01);
    for(let i=0;i<attack;i++) d[i]*=i/attack;
    this.ks.set(k,b);return b},
  pluck(f,t,vol=.3,bend=false){const c=this.ctx,s=c.createBufferSource();s.buffer=this.ksBuf(f);
    if(bend){s.playbackRate.setValueAtTime(1,t+.18);s.playbackRate.linearRampToValueAtTime(1.025,t+.43);s.playbackRate.linearRampToValueAtTime(1,t+.72)}
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=115;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(3150,f*4.1);lp.Q.value=.4;s.connect(hp);hp.connect(lp);lp.connect(this.out(vol,.46));s.start(t);s.stop(t+2.2)},
  flute(f,t,dur,vol=.055){const c=this.ctx,o=c.createOscillator(),g=c.createGain(),v=c.createOscillator(),vg=c.createGain();
    o.setPeriodicWave(this.fluteWave);o.frequency.value=f;v.frequency.value=4.2;vg.gain.value=f*.0025;v.connect(vg);vg.connect(o.frequency);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.23);g.gain.setValueAtTime(vol*.85,t+dur*.6);g.gain.linearRampToValueAtTime(0,t+dur);
    const n=c.createBufferSource(),nb=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    n.buffer=nb;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=2;const ng=c.createGain();ng.gain.value=.07;n.connect(bp);bp.connect(ng);ng.connect(g);
    o.connect(g);g.connect(this.out(1,.65));o.start(t);v.start(t);n.start(t);o.stop(t+dur);v.stop(t+dur);n.stop(t+dur)},
  bell(f,t,vol=.18,dur=2.5){const c=this.ctx;[[1,1],[2.01,.3],[2.76,.12]].forEach(([m,a])=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f*m;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*a,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur/m**.5);o.connect(g);g.connect(this.out(1,.8));o.start(t);o.stop(t+dur)})},
  wood(t,f=900,vol=.25){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.7,t+.06);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);g.connect(this.out(1,.2));o.start(t);o.stop(t+.1)},
  // 五声音阶（宫商角徵羽）——D 宫
  note(d,oct=0){const sc=[0,2,4,7,9];const o=Math.floor(d/5),i=((d%5)+5)%5;return 293.66*2**((sc[i]+12*(o+oct))/12)},
  sched(){ if(!this.on) return; const c=this.ctx;
    if(this.next<c.currentTime-.15)this.next=c.currentTime+.025;
    while(this.next<c.currentTime+.4){
      const slot=this.step%16;
      if(slot===0&&this.playingMode!==this.mode){this.playingMode=this.mode;this.step=0}
      const {beat,bars}=SCORE[this.playingMode]||SCORE.court;
      const barIndex=Math.floor(this.step/16),bar=bars[barIndex];
      const t=Math.max(this.next,c.currentTime+.005),night=this.playingMode==='night';
      const melody=bar.strings.find(([at])=>at===slot);
      const reply=bar.flute.find(([at])=>at===slot);
      if(slot===0||slot===8)this.pluck(this.note(SCORE_HARMONY[barIndex][slot/8]),t,night?.028:.045);
      if(melody)this.pluck(this.note(melody[1]),t,(night?.12:.16)*(slot%4===0?1:.82));
      if(reply)this.flute(this.note(reply[1]),t,beat*(reply===bar.flute[0]&&bar.flute.length>1?.88:1.35),night?.039:.052);
      this.step=(this.step+1)%(bars.length*16);this.next+=beat/2;
    } },
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
