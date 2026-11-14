/* A rare fictional family background, grounded in five persistent named brothers. */
function fiveBrotherFamily(c){
  if(!c)return null;const h=houseOf(c);return h?.fiveBrothers?.sister===c.id&&brotherRoles(h).length===5?h:null;
}
function fiveBrotherReady(c){return inPalace(c)&&c.age>=16&&c.aff>=35&&!!fiveBrotherFamily(c)&&S.turn-(c.lastFiveBrotherTalk??-99)>=12;}
function fiveBrotherVoice(c){
  const h=fiveBrotherFamily(c);if(!h)return '';
  const brothers=brotherRoles(h).map(role=>({role,p:h[role]})),dead=brothers.filter(x=>!officialAlive(x.p)),troubled=brothers.filter(x=>x.p.exiled||x.p.dismissed),away=brothers.filter(x=>officialAlive(x.p)&&(x.p.commission||x.p.away));
  const childhood=['把她写歪的字一笔笔描正','替她修好摔坏的木马','总把最后一块糖留给她','在她学走路时护着院里的台阶','陪她把一本话本翻到书页起毛'];
  const memories=brothers.map(({role,p},i)=>`${officialKinLabel(h,role)}${p.name}${childhood[i]}`).join('；');
  let tone=['骄纵','骄矜','善妒'].includes(c.trait)?'“家里五位哥哥从小都让着我，臣妾可不是随口夸的。”':
    ['才女','好学','聪慧'].includes(c.trait)?'“臣妾是家中第六个孩子。五位兄长教过的，不只是书上的字。”':
    ['将门','爽直','活泼'].includes(c.trait)?'“臣妾有五个哥哥！小时候闯了祸，他们一边数落，一边替我收拾。”':
    ['城府','持重'].includes(c.trait)?'“五位兄长疼臣妾，臣妾也更该守住分寸，不让这份疼爱成了家里的牵累。”':
    '“五位哥哥之后才有了臣妾，家中排行第六。他们疼我，各有各的笨办法。”';
  if(dead.length)tone=`“臣妾是五位兄长之后出生的妹妹。${dead.map(x=>x.p.name).join('、')}已经不在了，有些旧事，如今只能说给人听。”`;
  else if(troubled.length)tone=`“家里五位兄长都曾护着我。可${troubled.map(x=>x.p.name).join('、')}如今获罪，臣妾不能因亲情便说是非不重要。”`;
  if(!dead.length&&!troubled.length&&['悲恸','心如死灰','惶恐'].includes(xinOf(c)))tone='“今日心里乱，便想起五位兄长从前怎样照顾我。臣妾排行第六，小时候遇事总先去找他们。”';
  const ending=dead.length?'她说到旧事时停了停，没有再说大家都等她回家。':troubled.length?'她把未寄出的字条收好，亲情与公法终究要分开。':away.length?`“${away.map(x=>x.p.name).join('、')}如今在外，臣妾只盼他们平安。小时候受他们照顾，如今也该学着牵挂他们了。”`:'“如今进了宫，不能事事等哥哥护着了。可想起从前，心里总是暖的。”';
  return `${tone}\n她逐一说起旧事：${memories}。\n${ending}`;
}
function recordFiveBrotherTalk(c,text,peer=null){
  c.lastFiveBrotherTalk=S.turn;S.flags.lastFiveBrotherTalk=S.turn;
  story(c,`与${peer?fullName(peer):'陛下'}谈起五位兄长与家中行六的旧事。`);
  NPCMemory.record(S,{type:'five-brothers',time:S.turn,participants:[c.id,...(peer?[peer.id]:[])],object:text},[
    {person:c.id,subject:peer?.id||'emperor',interpretation:'有人听我认真说起五位兄长，知道我牵挂的是哪些人。',emotion:.4,impact:55},
    ...(peer?[{person:peer.id,subject:c.id,interpretation:`听${fullName(c)}说起五位兄长各自疼她的旧事，才懂得她提及娘家时的神色。`,emotion:.3,impact:45}]:[])]);
  if(peer)story(peer,`听${fullName(c)}说起五位兄长与家中行六的往事。`);
}
function fiveBrotherChat(c){
  if(!fiveBrotherReady(c))return '';
  const text=fiveBrotherVoice(c);recordFiveBrotherTalk(c,text);return text;
}
function fiveBrotherEvent(c,peer=null){
  if(!fiveBrotherReady(c)||peer&&!inPalace(peer))return null;
  const h=fiveBrotherFamily(c),text=fiveBrotherVoice(c),valid=()=>fiveBrotherReady(c)&&(!peer||inPalace(peer));
  const reachable=()=>brotherRoles(h).map(r=>h[r]).filter(p=>officialAlive(p)&&!p.exiled&&!p.dismissed);
  const finish=(letters=false)=>{
    if(!valid()||letters&&!reachable().length||!useE())return null;
    recordFiveBrotherTalk(c,text,peer);cchg(c,{aff:4,mood:5});if(peer)relAdd(c,peer,4);
    if(letters){const names=reachable().map(p=>p.name).join('、');const line=`准按家书旧例向${names}寄去平安信，亲情不用于请封求官。`;story(c,line);save('auto');return line;}
    save('auto');return '你把她说起的名字一一记住，陪她把这段家常说完。'+(peer?`${fullName(peer)}也说，往后想家时，不妨来找她坐坐。`:'');
  };
  return {title:'五位兄长的妹妹',cast:[c,peer].filter(Boolean),present:[c,peer].filter(Boolean),valid,
    onQueue:()=>{S.flags.lastFiveBrotherTalk=S.turn;},
    text:(peer?`${fullName(peer)}与她坐在廊下，提起各自入宫前的家。你走近时，她正说到哥哥们。\n`:'你问起家中兄妹，她把手边的旧物放在膝上。\n')+text,choices:[
      {t:'听她慢慢说，记住每个人 · 精力−1',cond:()=>E().energy>0,f:()=>finish()},
      {t:'准按旧例寄平安信，不涉请托 · 精力−1',cond:()=>E().energy>0&&reachable().length>0,f:()=>finish(true)},
      {t:'今日先不打扰'}]};
}
function fiveBrotherMonthlyEvent(){
  if(S.turn-(S.flags.lastFiveBrotherTalk??-99)<12)return null;
  const c=harem().find(fiveBrotherReady);if(!c||!chance(.12))return null;
  const peer=harem().find(p=>p!==c&&p.age>=16&&(p.palace===c.palace||relGet(c,p)>=30));
  return fiveBrotherEvent(c,peer);
}
function fiveBrotherPanel(c){
  if(!fiveBrotherFamily(c))return '';
  return `<p><span class="tag">五兄之妹 · 家中行六</span></p><p class="hint">五位兄长各有自己的履历与去处。她说起的家事会随他们的近况变化。</p>${inPalace(c)?`<button class="btn" onclick="A.fiveBrotherTalk(${c.id})" ${fiveBrotherReady(c)?'':'disabled'}>听她说起五位兄长<small>${c.aff<35?'情分35后愿意细说':fiveBrotherReady(c)?'精力−1 · 家中旧事':'这段家常已说过，过些时日再问'}</small></button>`:''}`;
}
A.fiveBrotherTalk=function(id){if(!modalOpen)pushEv(fiveBrotherEvent(byId(id)));};
