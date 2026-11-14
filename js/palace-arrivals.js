/* Map arrivals are visits, while roster/detail navigation stays informational. */
const PALACE_WELCOMES={
  温婉:['陛下来了。廊下风凉，进来喝一盏热茶罢。','听见脚步，臣妾便想出来看看。果真是您。'],
  骄纵:['既走到了臣妾门前，今日可不许只坐一坐便走。','旁的事且缓一缓，臣妾留的这盏茶，陛下总要尝一口。'],
  骄矜:['陛下驾临，臣妾自然欢喜。只是迎驾的客套话，今日想少说几句。','臣妾方才还说，不必往宫门外望。谁知这一回，竟真等来了。'],
  聪慧:['见陛下眉间还有倦色，政事想来不轻。先坐罢，别的话容后再说。','茶已备好。陛下今日想听什么，臣妾便从哪里说起。'],
  善妒:['臣妾不问陛下从哪里来。只问今日，肯在这里留多久？','听见传报，倒先不敢信。陛下进来罢，臣妾有话想亲口问您。'],
  淡泊:['正好一窗清风。陛下若无急事，便在这里歇一歇。','臣妾不曾备下热闹，只有清茶与几枝新花。您可愿坐？'],
  活泼:['方才还嫌院子太静，陛下就来了！快进来，给您看一样东西。','陛下来得巧，臣妾正愁无人说话。今日可算找到听的人了。'],
  城府:['未曾远迎，还望陛下恕罪。臣妾有几句家常，想等宫人退下再说。','臣妾这里一切安好。陛下若肯坐片刻，便是今日的好事。'],
  痴情:['方才那一声传报，臣妾听了两遍才敢信。您终于来了。','灯还留着。也不知为何，总想着今日兴许能等到您。'],
  体弱:['想起身迎您，又怕走得急。陛下不嫌药气，便坐近些罢。','今日精神尚好，正盼着有人说说话。陛下来得恰好。'],
  将门:['臣妾方才在试弓，尚未来得及换衣。陛下不怪，便进来看看。','院里正有风，倒宜练一练准头。陛下是来看臣妾，还是来较量的？'],
  才女:['书刚翻到有趣处，陛下便来了。可愿与臣妾同看这一页？','琴弦才调好，正缺一位听的人。陛下肯进来，便不算白等。'],
  贪财:['今日既来了，可得好好坐一坐。臣妾留的好茶，也不是日日舍得拿出来的。','臣妾倒没有旁的奢望，只盼这院里常有陛下的脚步声。'],
  沉静:['陛下请进。窗边的位置，臣妾替您留着。','方才只听见檐铃，忽然有了脚步声。原来是您。'],
  爽直:['臣妾不会说那些迎驾的好听话。见您来，心里是高兴的。','来得正好，有句话臣妾憋了半日，正想找您说。'],
  持重:['宫中琐事已安顿妥当。陛下请坐，也该歇歇了。','迎驾的礼数臣妾记着，顾惜身子的事，陛下也别忘了。'],
  好客:['来得巧，刚蒸好的点心还热着。坐下尝尝，再说别的。','臣妾叫人添一副茶盏。今日这屋里，总算更热闹些。'],
  巧手:['还差最后几针，容臣妾把线收好。陛下先看，认得这是什么花么？','手边都是针线，迎驾也迎得匆忙。陛下若不嫌，便陪臣妾坐一会儿。'],
  好学:['陛下来了，臣妾正有一处不明白。先请您坐，再慢慢问。','今日读的几页，越想越有意思。能当面说给陛下听，倒是意外之喜。']
};
function palaceResidents(name){return harem().filter(c=>inPalace(c)&&c.palace===name&&(name!=='坤宁宫'||c.rank===8)).sort((a,b)=>(b.residenceRoom==='main')-(a.residenceRoom==='main')||b.rank-a.rank||a.id-b.id);}
function palaceWelcome(c){
  const phase=consortVoicePhase(c),x=xinOf(c),seen=c.palaceWelcome,repeat=seen?.turn===S.turn;
  const voice=consortVoicePool(c)[0];
  let stage='宫人挑起帘子，她放下手边的事，迎到屏风前。',lines=PALACE_WELCOMES[c.trait]||PALACE_WELCOMES.温婉,key='trait';
  // A difficult circumstance takes precedence over cheerful or intimate greetings.
  if(['grief','distant-child','distance','ill'].includes(voice.key)||['悲恸','心如死灰','怨恨','惶恐'].includes(x)||c.aff<20){
    stage=voice.stage;lines=voice.lines;key=voice.key;
  }else if(c.preg>=2){
    stage='她扶着宫人的手缓缓起身，又被你示意坐下。';key='pregnant';
    lines=['骄纵','骄矜'].includes(c.trait)&&c.favor>=65?['今日可得坐久些。臣妾等陛下，腹中的小家伙也等着呢。','臣妾如今走得慢，您便到这边来。今日这一盏茶，要陪着臣妾喝完。']:['陛下来了。方才还想着，等孩子出世，这院子里便多一个脚步声了。','近来起坐慢些，没能迎到门前。您坐近些罢，臣妾有许多小事想说。'];
  }else if(phase==='first'||phase==='distant'||phase==='years'){
    const years=consortYearsVoice(c);stage=years.stage;lines=years.lines;key=years.key;
  }else if(repeat){
    stage='她听见帘外又响起脚步，抬眼望来。';key='return';
    lines=c.aff>=55?['方才还说陛下走得急，转眼又回来了。可是还有话忘了说？','茶还温着，不必另添。来，仍坐方才的位置。']:['陛下可是还有吩咐？臣妾听着。','方才未曾说完的，陛下可要接着说？'];
  }
  const fresh=lines.filter(t=>t!==seen?.text),pool=fresh.length?fresh:lines;
  return {key,stage,text:pool[(voiceHash(c.seed||c.id)+S.turn)%pool.length]||'臣妾给陛下请安。'};
}
function palaceArrivalEvent(name,id){
  if(!S||S.over||name==='冷宫')return null;
  const residents=palaceResidents(name),c=residents.find(p=>p.id===id)||residents[0];if(!c)return null;
  const valid=()=>inPalace(c)&&c.palace===name&&!S.over;
  const welcome=palaceWelcome(c);
  const scene=palaceLifeScene(name);
  const atHome=scene?.mother===c&&scene.child;
  const ev={title:`驾临${name}`,scene:'palace-arrival',por:c,present:[c],valid,arrival:{name,c,welcome},
    text:`你穿过宫门，沿回廊来到${name}。\n${welcome.stage}\n“${welcome.text}”`,
    onShow:()=>{
      // Greetings cost nothing and cannot farm affection or paid-conversation milestones.
      if(c.palaceWelcome?.turn!==S.turn){
        c.palaceWelcome={turn:S.turn,text:welcome.text};
        NPCMemory.record(S,{type:'palace-arrival',time:S.turn,location:name,participants:[c.id],outcome:'陛下亲自到宫中探望'},
          [{person:c.id,subject:'emperor',interpretation:`陛下来到${name}，我迎驾时说：“${welcome.text}”`,emotion:c.aff<20?-.1:.3,impact:25}]);
        if(S.turn===0&&c.id===empress()?.id)S.flags.firstEmpressVisit=true;
        save('auto');
      }
    },choices:[
      {t:'坐下陪她说话 · 精力−1',primary:true,cond:()=>E().energy>0,why:'本月精力不足，仍可查看宫中近况',f:()=>{if(valid())A.chat(c.id,true);return null;}},
      ...(atHome?[{t:`看看${scene.child.name}与母亲`,f:()=>{UI.view='palace';UI.sel=name;return null;}}]:[]),
      {t:'看看宫中近况',f:()=>{UI.view='palace';UI.sel=name;return null;}},
      {t:'查看她的详细信息',f:()=>{if(valid())A.go('consort',c.id);return null;}},
      {t:'改日再来，返回宫城',f:()=>{UI.view='map';return null;}}
    ]};return ev;
}
function palaceArrivalHTML(ev){
  const {name,c,welcome}=ev.arrival,others=palaceResidents(name).filter(p=>p.id!==c.id);
  return `<section class="palace-arrival-scene" aria-label="宫殿迎驾"><p class="arrival-path">宫门 · 回廊 · ${esc(name)}</p><div class="arrival-body"><figure class="arrival-portrait">${porImg(c,210)}<figcaption>${esc(cName(c))} · ${esc(fullName(c))}</figcaption></figure><div class="arrival-dialogue"><p>${esc(welcome.stage)}</p><blockquote>“${esc(welcome.text)}”</blockquote></div></div>${others.length?`<nav class="arrival-residents" aria-label="拜访同宫其他人"><span>同住此宫</span>${others.map(p=>`<button class="btn" onclick="A.greetPalaceResident(${p.id})">${porImg(p,44)}<span>去见${esc(cName(p))} →</span></button>`).join('')}</nav>`:''}</section>`;
}
A.greetPalaceResident=function(id){
  if(!modalOpen||curEv?.scene!=='palace-arrival')return;
  const name=curEv.arrival.name,c=byId(id);if(!inPalace(c)||c.palace!==name)return;
  const ev=palaceArrivalEvent(name,id);if(ev)openModal(ev);
};
