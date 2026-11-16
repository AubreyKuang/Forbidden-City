/* Shared outings and quarrels retain four real people and one saved outcome. */
const FAMILY_GARDEN_RULES={garden:.18,monthly:.04,dispute:.08,outingGap:3,pairGap:8,disputeGap:8,childDisputeGap:12};
function familyGardenActive(){return !!S&&!S.over&&journalContentVersion()>=32;}
function familyGardenState(create=false){
 if(S?.familyGarden?.gen===S.gen)return S.familyGarden;
 return create?(S.familyGarden={gen:S.gen,next:1,lastOuting:-99,lastPopup:-99,lastDispute:-99,outings:{},children:{},history:[]}):null;
}
function familyGardenMother(c){return inPalace(c)&&!c.maid&&!c.rescuedGuest&&c.hp>=50&&c.preg<7&&!consortRecovery(c)&&!(c.illnessRecovery?.until>S.turn)&&!maternalUnsettled(c)&&!homeWorryActive(c)&&!['悲恸','心如死灰','怨恨','惶恐'].includes(xinOf(c));}
function familyGardenChild(k){return childInPalace(k)&&!k.pendingName&&!k.married&&!k.spouse&&kidAge(k)<13&&k.hp>=50&&!(k.familyFeeling&&S.turn-k.familyFeeling.turn<3);}
function familyGardenPairReady(a,b){return a!==b&&familyGardenMother(a)&&familyGardenMother(b)&&socialPair(a,b)&&relGet(a,b)>=35&&!isRival(a,b)&&!isRival(b,a)&&!friendshipTense(a,b);}
function familyGardenChildren(m){return S.children.filter(k=>familyGardenChild(k)&&familyVisitAllowed(k,m));}
function familyGardenPairs(){
 if(!familyGardenActive()||mourningActive())return [];
 const state=familyGardenState(),people=harem().filter(familyGardenMother),pairs=[];
 if(S.turn-(state?.lastOuting??-99)<FAMILY_GARDEN_RULES.outingGap)return pairs;
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=people[i],b=people[j];if(!familyGardenPairReady(a,b)||S.turn-(state?.outings[rk(a,b)]??-99)<FAMILY_GARDEN_RULES.pairGap)continue;
  for(const ka of familyGardenChildren(a))for(const kb of familyGardenChildren(b))if(ka!==kb&&Math.abs(kidAge(ka)-kidAge(kb))<=6&&S.turn-(state?.children[ka.id]??-99)>=3&&S.turn-(state?.children[kb.id]??-99)>=3)pairs.push({a,b,ka,kb});
 }
 return pairs;
}
function familyGardenActors(n){return {a:byId(n.a),b:byId(n.b),ka:kidById(n.ka),kb:kidById(n.kb)};}
function familyGardenPresent(n){const {a,b,ka,kb}=familyGardenActors(n);return familyGardenMother(a)&&familyGardenMother(b)&&familyGardenChild(ka)&&familyGardenChild(kb)&&familyVisitAllowed(ka,a)&&familyVisitAllowed(kb,b);}
function familyGardenRecord(n,title,text,thoughts=[]){
 const {a,b,ka,kb}=familyGardenActors(n);livedRecord([a,b,ka,kb],'family',title,`family-garden:${S.gen}:${n.id}`,text,thoughts);
}
function familyGardenNote(n,text,status){
 const {a,b}=familyGardenActors(n);
 for(const [p,o] of [[a,b],[b,a]])(p.familyGardenNotes||={})[o.id]={turn:S.turn,gen:S.gen,other:o.id,kind:n.kind,status,text};
}
function familyGardenScene(ka,kb){
 const youngest=Math.min(kidAge(ka),kidAge(kb));
 if(youngest<3)return {title:'花影里的小摇篮',text:'宫人把软垫铺在避风的廊下，乳母抱稳年幼的孩子，两位母亲凑近指给孩子看花影。'+(Math.max(kidAge(ka),kidAge(kb))<3?'孩子们只顾伸手、眨眼，偶尔被逗得笑起来。':'年长的孩子轻轻指着花瓣讲给小的听，小的伸手去够，惹得大家都笑了。'),activity:'在花影下看花',baby:true};
 if(youngest<6)return pick([
  {title:'石阶边的落叶',text:'两个孩子各拣了一片落叶，轮流指着叶脉说像什么。两位母亲跟在一旁，替他们拂去衣角的草屑。',activity:'一起辨认落叶'},
  {title:'锦鲤分食',text:'两个孩子一人捧着一小包鱼食，约好轮流撒。两位母亲看着他们，把离池沿太近的小脚轻轻领回来。',activity:'轮流喂锦鲤'}]);
 return pick([
  {title:'同牵一线纸鸢',text:'两个孩子商量着放纸鸢，一人牵线、一人看风，没飞起来便一起重试。两位母亲在廊边说笑，也不时帮着理开缠住的线。',activity:'一同放纸鸢'},
  {title:'草木各有名字',text:'两个孩子拿着小笺辨认草木，认不准就回来问。两位母亲各讲自己小时候记住花名的办法，听他们争着复述。',activity:'一起辨认草木'},
  {title:'小壶不论输赢',text:'两个孩子轮流投壶，先商量好站在哪里，再替对方数投中的支数。两位母亲在旁提醒，只当一起玩，不必为一回输赢扫兴。',activity:'轮流练习投壶'}]);
}
function familyGardenMotherWords(c,other,k,scene){
 if(scene.baby)return `日日看着孩子，也不觉得腻。今日和你一起来，倒能多说几句家常。`;
 if(['善妒','骄纵','骄矜'].includes(c.trait))return '平日有些事我爱计较，可今日只看他们玩得好，倒不想比谁出风头。';
 if(['将门','爽直','活泼','好客'].includes(c.trait))return '让他们自己商量着玩！我们跟着照应，别一开口就替孩子拿了主意。';
 if(['持重','聪慧','城府'].includes(c.trait))return '有伴便好，只是轮流的规矩要先说定。你我也能坐下，慢慢说一会儿话。';
 if(['淡泊','沉静'].includes(c.trait))return '我不大爱热闹，这样与你和孩子们坐一坐，倒很自在。';
 return '从前只顾各自带孩子，今日约在一起，才发觉许多小事都可以慢慢说。';
}
function familyGardenChildWords(k){
 if(kidAge(k)<3)return '';
 if(kidAge(k)<6)return ['内敛','审慎'].includes(childDisposition(k))?'我想先看一看，再和你一起玩。':'这回轮到你啦，玩过了再给我，好不好？';
 return {好奇:'我还想换个办法试试，看看会不会不一样。',好胜:'我还想再练一回。不过说好了，这次先轮到你。',仁厚:'这次让你先来，我在旁边帮你拿着。',内敛:'我不急，等你说完，再告诉你我的主意。',爽直:'说好要轮流的，我们都得记着。',灵动:'我又想到一个玩法，先试一小回，好不好？',审慎:'先把东西收拢，免得一会儿找不到。',自矜:'这是我自己琢磨的办法，你看看还有哪里能改。'}[childDisposition(k)];
}
function familyGardenQuarrelVoice(k){
 const nature=childDisposition(k);
 if(['内敛','审慎'].includes(nature))return `${k.name}攥着衣角，几次想解释，又被旁人的话打断。`;
 if(nature==='仁厚')return `${k.name}眼圈发红，想说自己也有委屈，却又怕对方受罚。`;
 if(nature==='好奇')return `${k.name}急着从头讲自己看见的经过，越说越想问清谁定的规矩。`;
 return `${k.name}急着说：“不能只听对方讲，我也有话要说！”`;
}
function familyGardenEvent(channel='garden'){
 const pairs=familyGardenPairs();if(!pairs.length)return null;
 const {a,b,ka,kb}=pick(pairs),scene=familyGardenScene(ka,kb),n={kind:'outing',a:a.id,b:b.id,ka:ka.id,kb:kb.id,turn:S.turn,scene,channel};let shown=false,done=false;
 const valid=()=>!done&&familyGardenPresent(n)&&familyGardenPairReady(a,b)&&(shown||familyGardenPairs().some(p=>p.a===a&&p.b===b&&p.ka===ka&&p.kb===kb));
 const first=familyGardenMotherWords(a,b,ka,scene),reply=familyGardenMotherWords(b,a,kb,scene),second=reply===first?'你说得是。下次带些孩子们喜欢的点心来，我们也不必总等到宫宴才见面。':reply;
 const text=`${fullName(a)}与${fullName(b)}素来交好，今日约着各带${kidName(ka)}、${kidName(kb)}到御花园走走。${ka.foster===a.id?`${ka.name}由${childCareAddress(ka,a)}${fullName(a)}照料。`:''}${kb.foster===b.id?`${kb.name}由${childCareAddress(kb,b)}${fullName(b)}照料。`:''}\n${scene.text}\n${fullName(a)}：“${first}”\n${fullName(b)}：“${second}”`+[[ka,kb],[kb,ka]].filter(([k])=>kidAge(k)>=3).map(([k])=>`\n${k.name}：“${familyGardenChildWords(k)}”`).join('');
 const finish=mode=>{if(!valid())return null;done=true;n.outcome=mode;
  const outcome=mode==='join'?'你停下来陪了一会儿，听完孩子们的主意，也让两位母亲把家常说完。':mode==='space'?'你没有催她们散去，只嘱咐宫人远远照应，把这段闲暇留给她们。':'你问过起居，叮嘱留心风口与池沿，便先行离开。';
  if(mode!=='leave'){relAdd(a,b,2);if(kidAge(ka)>=3&&kidAge(kb)>=3)relAdd(ka,kb,3);for(const [k,m] of [[ka,a],[kb,b]])recordFamilyTime(k,m,scene.activity,kidAge(k)<3?'乳母记下幼时与亲眷同游，熟悉的照料让孩子安稳。':`和${(k===ka?kb:ka).name}一起${scene.activity}，${childCareAddress(k,m)}在旁照应。`,`与${fullName(m===a?b:a)}带孩子同游，许多育儿小事有了能一起说的人。`,{gain:3,place:'御花园',continuity:false});}
  familyGardenRecord(n,'同游之后',outcome);return outcome;
 };
 return {title:'携子同游 · '+scene.title,cast:[a,b,ka,kb],present:[a,b,ka,kb],valid,text,onShow:()=>{
  if(shown)return;shown=true;const s=familyGardenState(true);n.id=s.next++;s.lastOuting=S.turn;if(channel==='monthly')s.lastPopup=S.turn;s.outings[rk(a,b)]=S.turn;for(const k of [ka,kb])s.children[k.id]=S.turn;s.history.push(n);if(s.history.length>40)s.history.shift();
  familyGardenRecord(n,'好友携子同游',text,[`与${fullName(b)}相伴，育儿里的琐碎也有人懂。`,`与${fullName(a)}一道看顾孩子，今日不必谈恩宠。`,kidAge(ka)<3?'乳母代记幼时同游。':`和${kb.name}玩了一会儿，${childCareAddress(ka,a)}一直在旁边。`,kidAge(kb)<3?'乳母代记幼时同游。':`记住了与${ka.name}同游的这一天。`]);familyGardenNote(n,`与${fullName(a)}、${fullName(b)}各带孩子在御花园${scene.activity}。`,'同游');
 },choices:[{t:scene.baby?'停下来，陪她们看看孩子':'停下来，一起陪孩子玩一会儿',f:()=>finish('join')},{t:'让她们自在相伴，吩咐宫人照应',f:()=>finish('space')},{t:'问过起居，先行离开',f:()=>finish('leave')}]};
}
function familyGardenMonthlyEvent(){
 if(!familyGardenActive()||S.turn-(familyGardenState()?.lastPopup??-99)<6||!familyGardenPairs().length||!chance(FAMILY_GARDEN_RULES.monthly))return null;
 return familyGardenEvent('monthly');
}
function familyGardenUnconnected(a,b){
 return a!==b&&Math.abs(relGet(a,b))<15&&!a.kin?.[b.id]&&!b.kin?.[a.id]&&(!a.clan||a.clan!==b.clan)&&houseOf(a)!==houseOf(b)&&!friendshipArc(a,b)&&!isRival(a,b)&&!isRival(b,a)&&!a.oldCourtFriends?.includes(b.id)&&!b.oldCourtFriends?.includes(a.id)&&a.lastSocial?.other!==b.id&&b.lastSocial?.other!==a.id&&!Object.values(S.flags.marriageBonds||{}).some(n=>n.gen===S.gen&&[n.a,n.b].includes(a.id)&&[n.a,n.b].includes(b.id));
}
function familyGardenDisputePairs(){
 if(!familyGardenActive()||mourningActive())return [];
 const s=familyGardenState(),kids=S.children.filter(k=>familyGardenChild(k)&&kidAge(k)>=4&&S.turn-(k.lastGardenDispute??-99)>=FAMILY_GARDEN_RULES.childDisputeGap&&S.turn-(s?.children[k.id]??-99)>=3),pairs=[];
 if(S.turn-(s?.lastDispute??-99)<FAMILY_GARDEN_RULES.disputeGap)return pairs;
 for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){
  const ka=kids[i],kb=kids[j],a=byId(ka.foster||ka.mom),b=byId(kb.foster||kb.mom);
  if(Math.abs(kidAge(ka)-kidAge(kb))<=4&&relGet(ka,kb)<30&&familyGardenMother(a)&&familyGardenMother(b)&&familyGardenUnconnected(a,b))pairs.push({a,b,ka,kb});
 }
 return pairs;
}
function familyGardenDisputeEvent(){
 const pairs=familyGardenDisputePairs();if(!pairs.length||!chance(FAMILY_GARDEN_RULES.dispute))return null;
 const {a,b,ka,kb}=pick(pairs),rash=k=>['好胜','爽直','灵动'].includes(childDisposition(k))?3:1;
 const offender=chance(rash(ka)/(rash(ka)+rash(kb)))?ka:kb,victim=offender===ka?kb:ka;
 const pushed=chance(['好胜','爽直','灵动'].includes(childDisposition(offender))?.5:.2),object=Math.min(kidAge(ka),kidAge(kb))<6?'木陀螺':'投壶的竹箭';
 const n={kind:'dispute',a:a.id,b:b.id,ka:ka.id,kb:kb.id,turn:S.turn,offender:offender.id,pushed,object};let shown=false,done=false;
 const valid=()=>!done&&familyGardenPresent(n)&&(shown||familyGardenDisputePairs().some(p=>p.ka===ka&&p.kb===kb));
 const response=(m,k)=>['骄纵','骄矜','善妒'].includes(m.trait)?`${fullName(m)}先把${k.name}拉到身边：“孩子不能白受委屈，总得问个明白。”`:['持重','聪慧','城府'].includes(m.trait)?`${fullName(m)}忍住急意：“请先问过在场的人。若真是自家孩子不对，臣妾不会包庇。”`:`${fullName(m)}一边查看${k.name}，一边说：“先让他们各自把话说完，别催着认错。”`;
 const truth=`随侍分别回话：${offender.name}没等轮到自己，就取走了${victim.name}手里的${object}。${victim.name}拉住不放，${offender.name}${pushed?'情急推了对方一下，随侍立刻将两人分开，查看过并无伤处':'又说对方输不起，两人越说越急'}。最初的过错在${offender.name}抢先取物，并不是双方同样有错。`;
 const finish=mode=>{
  if(!valid())return null;done=true;n.outcome=mode;
  let text,status,delta;
  if(mode==='fair'){text=`你听完双方与随侍的陈述，指出${offender.name}抢先取物${pushed?'、动手推人':''}的过错，让其归还并道歉，也允许${victim.name}把委屈说完。两位母亲各自领孩子缓一缓，约定以后先讲轮流的规矩。`;status='已查明并调解';delta=8;offender.vir=clamp(offender.vir+2);victim.love=clamp(victim.love+3);relAdd(ka,kb,5);}
  else if(mode==='separate'){text=n.inquired?`经过虽已查明，你仍决定让两位母亲先各自领回孩子，待情绪平复后再谈道歉与和解。${victim.name}的委屈已被听见，但这回争执留下的隔阂尚未消散。`:'你命随侍先分开孩子，由两位母亲各自领回，未再查问经过。孩子停了争执，两位母亲却各有放不下的疑问，此后相见也添了客气与提防。';status=n.inquired?'查明后暂分开':'误会未解';delta=n.inquired?-4:-10;}
  else{const believed=mode==='side-a'?ka:kb,blamed=believed===ka?kb:ka,wrong=blamed!==offender;
   text=`你未问随侍，先采信${believed.name}的说法，让${blamed.name}赔礼。${wrong?`${blamed.name}原本是被抢去东西的一方，听到裁断后红了眼圈；其${childCareAddress(blamed,blamed===ka?a:b)}心中委屈，觉得自己的孩子没有被听见。`:`${blamed.name}确曾抢先取物，仍觉得事情还未说清便被定了过错；两位母亲也未能把话说明白。`}`;status=wrong?'偏听留下委屈':'偏听留下隔阂';delta=-18;blamed.love=clamp(blamed.love-(wrong?8:3));const m=blamed===ka?a:b;cchg(m,{mood:wrong?-8:-4});setXin(m,'委屈',`${blamed.name}与${believed.name}争执，未经问清便被责令赔礼`);relAdd(ka,kb,-5);
  }
  relAdd(a,b,delta);familyGardenNote(n,text,status);
  familyGardenRecord(n,'孩子争执的处置',text,[`${fullName(b)}原与我没有多少往来；这次孩子的事${mode==='fair'?'幸而问清，以后也该把规矩说在前面。':'留下了心结，今后再见也难免防备。'}`,`与${fullName(a)}因孩子的争执相识。${mode==='fair'?'听明白经过，才知道不能只凭一时心疼替孩子断是非。':'话还没有说清，彼此已多了些隔阂。'}`,mode==='fair'?(ka===offender?'我先抢了东西，须归还道歉；有话也能慢慢说。':'父皇听清了经过，我的委屈有人听见。'):'大人的处置让我仍记着这回争执。',mode==='fair'?(kb===offender?'我先抢了东西，须归还道歉；有话也能慢慢说。':'我把自己的话说完了，不必把没做的事也认下来。'):'这回没能把话说清，暂时不想再一起玩。']);return text;
 };
 const inquiry=()=>({title:'童争 · 问清经过',cast:[a,b,ka,kb],present:[a,b,ka,kb],valid,text:truth+'\n'+response(a,ka)+'\n'+response(b,kb),choices:[{t:'按实责教，归还道歉，听双方说开',f:()=>finish('fair')},{t:'先各自领回，暂不调解',f:()=>finish('separate')}]});
 return {title:pushed?'童争 · 一时推搡':'童争 · 各执一词',cast:[a,b,ka,kb],present:[a,b,ka,kb],valid,
 text:`${fullName(a)}与${fullName(b)}往日没有多少来往。今日两家的孩子在御花园争起${object}，${pushed?'争执中有人推搡，随侍已将两人分开，未见受伤':'吵得都红了脸'}，宫人请你裁断。\n${familyGardenQuarrelVoice(ka)}${familyGardenQuarrelVoice(kb)}事情还须问清。\n${response(a,ka)}\n${response(b,kb)}`,
 onShow:()=>{if(shown)return;shown=true;const s=familyGardenState(true);n.id=s.next++;s.lastDispute=S.turn;ka.lastGardenDispute=kb.lastGardenDispute=S.turn;s.history.push(n);if(s.history.length>40)s.history.shift();relAdd(a,b,-6);relAdd(ka,kb,-8);cchg(a,{mood:-3});cchg(b,{mood:-3});familyGardenRecord(n,'孩子争执牵动两家',`${kidName(ka)}与${kidName(kb)}在御花园因${object}起了争执${pushed?'，并有推搡':''}；随侍及时分开，两位母亲各自担忧，经过尚待查明。`);familyGardenNote(n,`两家因${ka.name}、${kb.name}的争执有了嫌隙，尚未查明经过。`,'尚待查明');},
 choices:[{t:'各自说一遍，再问在场随侍',f:()=>{if(!valid())return null;n.inquired=true;pushNow(inquiry());return null;}},{t:'各自领回，先别再争',f:()=>finish('separate')},{t:`先信${ka.name}，让另一边赔礼`,f:()=>finish('side-a')},{t:`先信${kb.name}，让另一边赔礼`,f:()=>finish('side-b')}]
 };
}
const familyGardenRelLine=relLine;
relLine=function(c){return familyGardenRelLine(c)+(familyGardenActive()?Object.values(c.familyGardenNotes||{}).filter(n=>n.gen===S.gen&&S.turn-n.turn<=24&&byId(n.other)).map(n=>`<p class="hint">与${parentLink(n.other)} · ${esc(n.status)}：${esc(n.text)}</p>`).join(''):'');};
