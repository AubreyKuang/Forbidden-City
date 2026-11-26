/* A social disposition, independent of talent and spiritual interests.
   Only newly generated people are assigned it; loading never rewrites a life. */
const SOLITARY_PATHS={letters:'清雅才情',dao:'清心问道',both:'诗道兼修'};
function isSolitary(c){return !!(randomConsortOriginsAllowed(c)&&!c?.sex&&SOLITARY_PATHS[c?.solitary?.path]);}
function socialPair(a,b){return (!isSolitary(a)&&!isSolitary(b))||whiteSpringFriends(a,b);}
function solitaryDao(c){return isSolitary(c)&&['dao','both'].includes(c.solitary.path);}
function initSolitary(c){
  if(!randomConsortOriginsAllowed(c)||c.solitary!==undefined||c.age<16||c.fam.t==='宫女'||!['才女','好学','聪慧','淡泊','沉静','持重','体弱'].includes(c.trait))return;
  const random=mulberry32(c.seed^0x173ca9);
  if(random()>=.16)return;
  const literary=['才女','好学','聪慧'].includes(c.trait);
  c.solitary={path:literary?(random()<.55?'letters':'both'):(random()<.6?'dao':'letters'),stage:0,last:null,respect:0,history:[],origin:solitaryOrigin(c)};
}
function solitaryTag(c){return isSolitary(c)?`<span class="tag">孤高 · ${SOLITARY_PATHS[c.solitary.path]}</span>`:'';}
function solitaryOrigin(c){
  if(c.solitary?.origin)return c.solitary.origin;
  if(['翰林学士','书香门第'].includes(c.fam.t))return '家中重诗书，她却更习惯独自校读，遇到不懂处先写在页边，不急着随席间众人点头。';
  if(c.fam.p>=60)return '出身显门，见惯席间热闹与往来礼数。她把礼数记得分明，却不肯把每一份热络都当成交情。';
  if(c.fam.p<=20)return '家中门庭不阔，她惯于在小窗前料理自己的日子。独处于她是自在，不是无人理会的委屈。';
  return '家中有家中的往来，她从小便喜欢把一天留一段给自己。入宫以后，这个习惯仍旧留着。';
}
function solitaryVoice(c){
  if(!isSolitary(c))return null;
  const s=c.solitary,lines={
    letters:['这首诗，臣妾另有看法。席间人人称好，也不必把自己的话咽回去。','字写得好，自当好好看；至于是谁家的女儿写的，倒不必先问。','臣妾喜欢独自改稿。不是嫌旁人，只是不愿让喝彩先替自己拿了主意。'],
    dao:['国师讲的道理，臣妾也要想过才信。坐在末席，并不妨碍问一句为什么。','清静不是嫌人。各人自有各人的热闹，臣妾不必去占一席。','问道若只为了比旁人高一等，岂不是又绕回争胜里去了。'],
    both:['诗里有山水，道书里也有。臣妾想知道的是，离了纸上的山，人还能不能安顿自己。','臣妾读诗，也问道，却不愿拿一个名目替自己作答。哪句不明白，便先留着。','诗不必写给满座人听。有时一行字，够自己在窗下想半日了。']
  }[s.path].slice();
  if(c.preg>=2)return voiceLine('solitary-pregnant','她把书移到软枕旁，慢慢翻过一页。',['近来少出门，便把清静留在这里。陛下坐下罢，不必叫人张罗。','等孩子大些，喜欢热闹也好，喜欢独处也好，臣妾都想先听听孩子自己的意思。']);
  if(s.choice==='press')lines.push('上回叫臣妾多去交游的话，臣妾听见了。礼数自会周全，结交却不能奉旨便亲近。');
  else if(s.respect>0)lines.push('上回陛下许臣妾自己择客，臣妾记着。今日愿把这页未定的字，先给您看。');
  if(c.aff>=65)lines.push('陛下来了，自有您的一席。可臣妾仍想每日独坐一会儿，不是疏远您。');
  return voiceLine('solitary','她将案上书页压好，行礼后才从容开口。',lines);
}
function solitaryReady(c){
  if(!isSolitary(c)||!inPalace(c)||c.maid||S.over||c.hp<40||['悲恸','心如死灰','怨恨','惶恐'].includes(xinOf(c)))return false;
  const s=c.solitary;
  return s.stage<3&&c.aff>=[25,45,65][s.stage]&&S.turn-(c.enteredAt??S.turn)>=3&&(s.last==null||S.turn-s.last>=6);
}
function solitaryEvent(c){
  if(!solitaryReady(c))return null;
  const s=c.solitary,stage=s.stage,valid=()=>c.solitary===s&&s.stage===stage&&solitaryReady(c);
  const middle={
    letters:['一行不改','她拿来两份诗稿。宫人劝她把末句改得喜庆些，好在宴上讨个彩头。她摇头：“字若真不好，自当改。只为满座点头而改，便不再是臣妾想写的了。”'],
    dao:['问道不随众','她把一道疑问写在笺上，托人递给国师：“有人说，不爱往来便是得了仙缘。可臣妾只是喜欢独处，怎么倒比别人高了一等？”国师回笺：“问得好。清静是你的日子，不是评定旁人的尺。”'],
    both:['诗与道之间','她把一首山水诗与道书并放：“诗里写山远，书里说心静。可人人都要臣妾作一副出尘模样，岂不又是演给人看？”她不求席间叫好，也不愿国师替她封一个清修的名目。']
  }[s.path];
  const titles=['清茶留白',middle[0],'灯下留席'];
  const text=stage===0?`你到${c.palace}时，她正收起一张小宴请帖。\n“谢意已回，礼也送了，臣妾却不想去。不是与谁不睦，只是今日更想把这页书读完。”\n${solitaryOrigin(c)}\n她请你坐下，另添一盏清茶：“陛下若愿听，可以说说这书；若只想歇一歇，也不必找话。”`:
    stage===1?`${c.palace}窗下，她把近日所想说给你听。\n${middle[1]}`:
    '她在常用的书案旁添了一席，却没有撤去独坐的小几。\n“从前陛下来，臣妾先想的是如何应对。如今有一句未想明白的话，倒会想起您。”\n她将杯盏放下：“可臣妾仍不爱结伴赴宴，也不愿时时迎合。您若愿意，便让我们各有清静，又能偶尔同看一盏灯。”';
  const finish=kind=>{
    if(!valid()||!useE())return null;
    s.stage++;s.last=S.turn;s.choice=kind;s.respect+=kind==='press'?0:1;
    const line=kind==='press'?'陛下劝她广结人缘，她说明礼数会尽，交情却不能强求；仍保留独来独往的习惯。':
      stage===0?'她说出独处的习惯与家中旧日生活，陛下尊重她自行择客。':
      stage===1?`谈过「${middle[0]}」，陛下愿听她不同的看法，不以才名或清修名目要求她迎合。`:
      '灯下添了一席，两人更愿彼此相伴，也约好各留一段独处的时光。';
    const answer=kind==='press'?'她端正行礼：“臣妾会敬人，也会尽分内之责。只是热络二字，学不得装作。”':
      kind==='discuss'?'她没有附和你的每一句话，却第一次把没想好的地方也摊开来谈。':
      '她轻轻颔首，往你手边推了推茶盏。话虽不多，却比方才自在。';
    cchg(c,{aff:kind==='press'?-2:5,mood:kind==='press'?-3:6});
    s.history.push({turn:S.turn,d:dateStr(),text:line});story(c,`【${titles[stage]}】${line}${answer}`);
    NPCMemory.record(S,{type:'solitary-trust',time:S.turn,location:c.palace,participants:[c.id],outcome:line},[{person:c.id,subject:'emperor',interpretation:line,emotion:kind==='press'?-.25:.65,impact:65}]);
    save('auto');return line+'\n'+answer;
  };
  return {title:titles[stage],randomOriginCast:[c],por:c,present:[c],valid,text,choices:[
    {t:stage===2?'相伴也各留清静 · 精力−1':'尊重她的选择，安静喝茶 · 精力−1',cond:()=>E().energy>0,f:()=>finish('respect')},
    {t:'认真谈谈，也说出不同看法 · 精力−1',cond:()=>E().energy>0,f:()=>finish('discuss')},
    {t:'劝她多赴宴、多结交 · 精力−1',cond:()=>E().energy>0,f:()=>finish('press')},
    {t:'改日再谈'}]};
}
function solitaryPanel(c){
  if(!isSolitary(c))return '';
  const s=c.solitary;
  return `<section class="personal-experience"><h3>一隅清静 · ${SOLITARY_PATHS[s.path]}</h3><p>不主动结交，不攀附结党；对人守礼，对所好自有坚持。</p><p>${esc(solitaryOrigin(c))}</p>
    ${s.history.map(h=>`<p>${esc(h.d)} · ${esc(h.text)}</p>`).join('')}
    ${inPalace(c)&&s.stage<3?`<button class="btn jade" data-onclick="A.solitaryTalk(${c.id})" ${solitaryReady(c)?'':'disabled'}>听她谈独处与所好<small>精力−1</small></button>${solitaryReady(c)?'':'<p class="hint">入宫相处三个月后，随着情分渐深（25 / 45 / 65）再谈；每次相隔半年。病中或悲恸时，先照顾眼前。</p>'}`:''}</section>`;
}
A.solitaryTalk=function(id){const c=byId(id);if(modalOpen||!solitaryReady(c))return;pushEv(solitaryEvent(c));};
HAREM.push(function solitaryEncounter(){
  if(S.turn-(S.flags.lastSolitaryEvent??-12)<12)return null;
  const people=harem().filter(solitaryReady);if(!people.length||!chance(.3))return null;
  const ev=solitaryEvent(pick(people));ev.onQueue=()=>{S.flags.lastSolitaryEvent=S.turn;};return ev;
});
Object.assign(PALACE_INITIATIVES,{
  solitaryMargin:{title:'留白校书',place:consortPalaceVenue,match:c=>isSolitary(c)&&c.solitary.path!=='dao'&&(c.hp??100)>=40,
    text:()=> '她独自校了一页旧抄本，把拿不准的字留空，并不为了交卷而填满。宫人问要不要请同宫的人一起，她摇头说不必，却嘱咐借来的书要好好送还。',
    button:'与她辨一处疑字',respond:c=>cchg(c,{talent:1,aff:3,mood:4})},
  solitaryQuestion:{title:'问而不附',place:consortPalaceVenue,match:c=>solitaryDao(c)&&(c.hp??100)>=40&&c.t2!=='信佛'&&c.like!=='佛经',
    text:()=> '她把问道的疑处写成短笺，托人送往钦安殿，却没有随众人前去。她说：“有不明白处就问，答案也得自己慢慢想。”',
    button:'陪她读国师的回笺',respond:c=>cchg(c,{mood:5,aff:3})}
});
