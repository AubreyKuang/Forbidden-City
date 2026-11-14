/* Rare fictional soul-dreams. Old lives are archived facts; dreams are her account,
   never a reason to replace today's identity, family, age or relationships. */
function archivePastLives(){
  const archive=S.pastLives||={sources:[],claimed:{},reigns:{},excluded:[]};
  if(S.gen>1)for(const d of [S.flags.dowager,S.flags.birthDowager]){
    if(d?.personId!=null&&!archive.excluded.includes(d.personId))archive.excluded.push(d.personId);
  }
  const courts=[...(S.previousCourts||[]),{gen:S.gen,emperor:E(),consorts:S.consorts}];
  for(const court of courts)for(const c of court.consorts){
    if(c.alive!==false||c.maid||c.gone||c.pastLife||c.age<18||c.aff<50)continue;
    if(court.gen<S.gen&&c.rank===8&&!archive.excluded.includes(c.id))archive.excluded.push(c.id);
    const key=`${court.gen}:${c.id}`;
    if(archive.sources.some(s=>s.key===key))continue;
    const pages=(c.story||[]).filter(s=>s.t&&!/薨|赐死|亡故|去世|血崩/.test(s.t));
    archive.sources.push({key,id:c.id,gen:court.gen,name:fullName(c),trait:c.trait,palace:c.palace,
      emperor: `${court.emperor.sur}${court.emperor.name}`,era:court.emperor.era,
      noticed:S.turn,pages:JSON.parse(JSON.stringify(pages.slice(-3)))});
  }
  return archive;
}
function pastLifeCandidates(){
  const a=archivePastLives();
  return a.sources.filter(s=>!a.claimed[s.key]&&!a.excluded.includes(s.id)&&S.turn>s.noticed);
}
function assignPastLifeCandidates(){
  const sources=pastLifeCandidates(),a=S.pastLives;
  if(a.reigns[S.gen]||!sources.length)return;
  const people=S.cands.filter(c=>c.age>=18&&!c.kin&&!c.timeTraveler&&!c.pastLife);
  if(!people.length||!chance(.12))return;
  const c=pick(people),source=pick(sources);
  c.pastLife={source:JSON.parse(JSON.stringify(source)),gen:S.gen,stage:0,last:null,history:[],accepted:false};
}
function acceptPastLife(c){
  const p=c.pastLife;if(!p)return;
  const a=archivePastLives();
  if(a.reigns[S.gen]||a.claimed[p.source.key]||a.excluded.includes(p.source.id)){delete c.pastLife;return;}
  a.claimed[p.source.key]=c.id;a.reigns[S.gen]=c.id;p.accepted=true;
  story(c,'选秀时，举止间仿佛有故人之姿。她仍以今生的姓名入宫，旧梦尚未向人提起。');
}
function pastLifeSelectionHint(c){
  if(!c?.pastLife)return '';
  return c.pastLife.source.gen===S.gen?'她抬眼时，你心头忽然一动，仿佛有故人之姿；待她开口，却又分明是另一人的声音。':
    '引见的老宫人忽然怔住，低声道：“仿佛有故人之姿。”她却只报上今生的姓名，并不知道这宫门里曾住过谁。';
}
function pastLifeEligible(c){return !!(inPalace(c)&&!c.maid&&c.age>=18&&!S.over&&c.pastLife?.accepted&&c.pastLife.gen===S.gen);}
function pastLifeReady(c){
  if(!pastLifeEligible(c)||c.pastLife.closed||c.pastLife.stage>=3||c.hp<40||['悲恸','怨恨','心如死灰','惶恐'].includes(xinOf(c)))return false;
  const p=c.pastLife;
  return c.aff>=[35,50,65][p.stage]&&S.turn-(c.enteredAt??S.turn)>=3&&
    (p.last==null||S.turn-p.last>=6);
}
function pastLifeTone(c){
  if(['才女','好学','聪慧'].includes(c.trait))return '臣妾把梦中听见的字写了下来，怕醒得久了，就连自己也记错。';
  if(['活泼','爽直','将门'].includes(c.trait))return '臣妾原想笑着说完，可一见这条回廊，眼泪倒比话先到了。';
  if(['骄矜','骄纵'].includes(c.trait))return '臣妾不肯学谁的眉眼。可梦里那个人落泪时，醒来枕边竟也是湿的。';
  if(c.trait==='城府')return '这些话，臣妾斟酌了许久才敢讲。若旁人听去，怕又说臣妾借故人的名头争宠。';
  if(['淡泊','沉静','持重'].includes(c.trait))return '梦里的人走了很远，醒来窗前却还是今日的月色。臣妾想先把心里的事理清。';
  return '臣妾不敢说梦就是真的，只是那份牵挂，醒来很久也没有散。';
}
function pastLifeText(c){
  const p=c.pastLife,s=p.source,same=s.gen===S.gen;
  if(p.stage===0)return `${fullName(c)}等宫人退下，才提起反复做过的梦。\n“梦里有一座${s.palace||'深宫'}，回廊很长。臣妾似乎在那里等过很久，可明明是长在宫外的人，入宫前从未来过。”\n“${pastLifeTone(c)}”\n${same?'她望向你，像要问一个认不认得的答案，又怕只是一厢情愿。':'她看着你，轻轻摇头：“梦里等的那个人，和陛下并不是一张面容。臣妾不能把您认错。”'}`;
  if(p.stage===1)return `她带来几页梦醒后写下的字，其中竟有「${s.name}」的名字。\n“梦里，旁人是这样唤我的。还有${s.era}年间的一段往事……”\n你命人取来旧册。${s.pages.length?`册中原记：「${s.pages.at(-1).t}」`:'旧册只存了她的姓名与宫籍，没有足够的私事可供核对。'}\n${s.pages.length?'她写下的片语与这页纪事隐隐相合，却没有因此记起所有过往。':'她不肯顺着宫人的话，编出并不记得的细节。'}\n${same?'那是你与故人这一朝的旧事。她却说：“您看着臣妾的时候，可否也唤一声今日的名字？”':`那是${s.emperor}与故人的旧事，并非新帝亲历。她低声道：“臣妾梦里曾认得先朝的人，可醒着陪我坐在这里的，是陛下。”`}`;
  return `相处这些时日，她终于把梦札合上。\n“${pastLifeTone(c)}”\n${same?'“若真是再来一回，臣妾愿与您再续前缘。可从前没有说过的话，也得从今往后慢慢说。”':'“臣妾曾把梦里的牵挂带到这里，如今才分清前朝与今朝。若今生也有缘，臣妾想重新认识陛下，不拿先帝的情分来讨您的许诺。”'}\n“往后您叫我${c.given}，好不好？”`;
}
function pastLifeRecord(c,line){
  const p=c.pastLife;p.history.push({turn:S.turn,d:dateStr(),text:line});
  story(c,line);log(`${fullName(c)}：${line}`);
  NPCMemory.record(S,{type:'past-life',time:S.turn,location:c.palace,participants:[c.id],object:line},
    [{person:c.id,subject:'emperor',interpretation:line,emotion:p.closed?-.2:.5,impact:65}]);
}
function pastLifeEvent(c){
  if(!pastLifeReady(c))return null;const p=c.pastLife,stage=p.stage;
  const valid=()=>pastLifeReady(c)&&p===c.pastLife&&p.stage===stage;
  const finish=kind=>{
    if(!valid()||!useE())return null;
    p.last=S.turn;p.stage++;p.choice=kind;p.closed=kind==='close';
    if(stage===2)p.ending=kind==='renew'?'再续前缘':'珍重今生';
    const line=kind==='close'?'说起前尘旧梦后，陛下不愿再谈。她将梦札收好，此后不再主动提起。':
      stage===0?'第一次向陛下说起魂梦中的旧宫回廊，陛下静静听完，没有急着唤她作故人。':
      stage===1?`梦里浮现「${p.source.name}」之名，查阅旧册后留下相合的片语；仍分清故人的纪事与自己所述的梦。`:
      kind==='renew'?(p.source.gen===S.gen?'两人愿将魂梦认作再续前缘，也约定珍惜她今生的姓名与性情。':'两人将前尘的牵挂留在梦札里，愿在新朝重新相识，续一段属于今生的缘。'):
      '两人决定珍重今生，不必以转世来证明相伴，也不再追问前尘的答案。';
    cchg(c,{aff:kind==='close'?-2:4,mood:kind==='close'?-2:6});pastLifeRecord(c,line);save('auto');
    return line+`\n她说：“${kind==='close'?'臣妾知道了。以后便说眼前的事。':stage===2?'那就从今日这一盏茶开始吧。':'您肯听，臣妾便不急着把一切想明白。'}”`;
  };
  return {title:['梦里回廊','前尘有名','此生如何相认'][stage],por:c,present:[c],valid,text:pastLifeText(c),choices:[
    {t:stage===2?'愿与她续缘，也珍重今生 · 精力−1':'屏退宫人，听她慢慢讲 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>finish(stage===2?'renew':'listen')},
    ...(stage===2?[{t:'不问前世，只珍惜眼前的人 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>finish('present')}]:[]),
    {t:'请她收起旧梦，此后不再追问 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>finish('close')},
    {t:'改日安静时再说'}]};
}
function pastLifeMonthlyEvent(){
  if(S.turn-(S.flags.lastPastLifeEvent??-99)<12)return null;
  const people=harem().filter(pastLifeReady);if(!people.length||!chance(.15))return null;
  const ev=pastLifeEvent(pick(people));ev.onQueue=()=>{S.flags.lastPastLifeEvent=S.turn;};return ev;
}
function pastLifeVoice(c){
  const p=c.pastLife;if(!pastLifeEligible(c)||!p.stage||p.closed)return null;
  return voiceLine('past-life','她望着灯影，说起只有你听过的旧梦。',[
    pastLifeTone(c),p.stage<3?'梦醒时偶尔会难过，可今日的茶香、今日的人，臣妾也都记得。':
    p.ending==='再续前缘'?'若缘分真能再来，臣妾也不想日日重演从前。今日有什么新鲜事，陛下说给臣妾听罢。':
    '那本梦札已经收好了。今生的日子，还等着臣妾一页一页写下去。']);
}
function pastLifePanel(c){
  const p=c.pastLife;if(!p)return '';
  const title=p.closed?'旧梦封缄':p.ending||['故人之姿','旧梦初醒','前尘渐明'][p.stage];
  return `<section class="personal-experience"><h3>前尘往事 · ${esc(title)}</h3><p>${esc(p.stage>=2?`梦中前身：${p.source.name} · ${p.source.era}年间 · ${p.source.trait}`:pastLifeSelectionHint(c))}</p>
    <p class="hint">今生仍是${esc(fullName(c))}，${c.age}岁，${esc(c.trait)}。${p.stage>=2?'旧册所记与她自述的魂梦分别保存。':'她还没有将这段缘由讲明。'}</p>
    ${p.history.map(h=>`<p>${esc(h.d)} · ${esc(h.text)}</p>`).join('')}
    ${p.stage>=2?`<details><summary>翻阅故人的纪事</summary>${p.source.pages.map(h=>`<p>${esc(h.d)} · ${esc(h.t)}</p>`).join('')||'<p>旧册未留下更多私事。</p>'}</details>`:''}
    ${pastLifeEligible(c)&&!p.closed&&p.stage<3?`<button class="btn jade" onclick="A.pastLifeTalk(${c.id})" ${pastLifeReady(c)?'':'disabled'}>听她谈前尘<small>精力−1</small></button>${pastLifeReady(c)?'':'<p class="hint">初入宫至少相处三个月；旧梦每次相隔半年，随着情分渐深（35 / 50 / 65）再谈。病中或悲恸时先照顾眼前。</p>'}`:''}
    ${pastLifeEligible(c)&&p.stage>=1&&!p.closed&&!p.priest?`<button class="btn" onclick="A.pastLifePriest(${c.id})">${pastLifePriestHome(c)?'请国师送解梦笺':'同赴钦安殿问前缘'}<small>精力−1</small></button>`:''}</section>`;
}
A.pastLifeTalk=function(id){const c=byId(id);if(modalOpen||!pastLifeReady(c))return;pushEv(pastLifeEvent(c));};
function pastLifePriestHome(c){return c.preg>=8||c.hp<40||c.trait==='体弱';}
A.pastLifePriest=function(id){
  const c=byId(id),p=c?.pastLife;
  const valid=()=>pastLifeEligible(c)&&p.stage>=1&&!p.closed&&!p.priest;
  if(modalOpen||!p||!valid())return;
  pushEv({title:'国师论前缘',cast:[daoMaster(),c],present:[c],valid,
    text:`${pastLifePriestHome(c)?'她在本宫静养，宫人将梦札递往钦安殿。国师阅毕，遣人送回一笺解语：':'钦安殿的灯静静燃着。'+daoMaster().name+'听完她的梦，停了很久。'}\n“若说魂梦借影，或有前缘；若说年月生死，却不能凭一梦倒改。贫道不会断言她便是故人，也不会要她舍去今生的名字。”\n“前尘若真有牵挂，未必是叫人照旧再活一遍。该相认时相认，该放下时，也让她自己选。”\n她说：“${pastLifeTone(c)}”`,choices:[
      {t:'记下国师的话，陪她坐一会儿 · 精力−1',cond:()=>E().energy>0,why:'本月精力不足',f:()=>{if(!valid()||!useE())return null;p.priest=true;const line=(pastLifePriestHome(c)?'在本宫同读国师送来的解梦笺。':'同赴钦安殿问前缘。')+'国师以魂梦借影相解，未断言轮回，劝两人珍重今生。';pastLifeRecord(c,line);save('auto');return line;}},
      {t:'暂且告辞'}]});
};
