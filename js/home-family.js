/* Family news persists through absence, return, private talks and shared memories. */
const HOME_LEAVE_STYLES={
 温婉:['将给家人的小物包好，想到重聚，眼里已有笑意','回宫后仍记得家里那盏温茶','母亲还记着臣妾小时候爱吃什么。临走时，倒舍不得把手松开。'],
 骄纵:['一连改了几回行装，嘴上挑剔，心里却盼着早些到家','说起家人围着自己问长问短，骄气里藏着不舍','一家人都说臣妾回去便热闹了。临走时，臣妾却没有自己想的那样洒脱。'],
 骄矜:['连车前的仪节都要问清，却把一件旧物悄悄放进行李','说迎送时很体面，提到母亲送至门前却放轻了声音','家里迎送都极周全。只是母亲替臣妾理衣领时，忽然又像未出阁的时候。'],
 聪慧:['理清路程与宫中托付，才发现归心早已走在前头','带回家中起居的单子，却明白有些牵挂无法事事预先安排','家里的事问明白了一些，心里也踏实些。再周全的安排，也替不了亲眼见一面。'],
 善妒:['先问这份准许是不是当真，得到答复后才小心欢喜起来','想说自己也被放在心上，又怕这一趟只被看成争宠','臣妾得了回家的机会，自然欢喜。可那几日属于家人，不想全被说成同谁争来的。'],
 淡泊:['不愿铺陈，只收拾随身衣物，盼回去安静坐一坐','没有带回多少东西，只把寻常的一日记得很清楚','没有什么排场，不过一家人好好吃了顿饭。臣妾觉得，这样便很好。'],
 活泼:['想着走一走旧巷、尝一尝家里的点心，脚步都轻快了些','一路上的小事说得眉飞色舞，话到分别处却停了停','老树又长高了，点心的味道倒没变。原想笑着告别，末了还是红了眼。'],
 城府:['将行程与宫中人事安顿妥当，独处时才肯显出归心','先看宫务是否妥当，再收好家人留的短笺','外人问起，臣妾只说一切妥当。最舍不得的，却是不用斟酌便能说话的那一会儿。'],
 痴情:['反复念着家人的旧话，临行又来确认归期','将家中捎来的东西摆在手边，欢喜过后又生出思念','见过以后，反倒更知道自己想念什么。臣妾回来了，心里仍留着家中的灯。'],
 体弱:['听从随行医者安排歇脚，仍盼亲自见一见家人','路上虽累，见过家人后却肯多用半碗饭','这一趟有些疲倦，可亲眼见过家人，心里安稳多了。今日歇歇，再慢慢说。'],
 将门:['核过护送与路程，整理旧物时却不再像平日那样利落','说路上平安很干脆，提到家门前的告别便沉默下来','远行的道理臣妾都懂，轮到自己告别，才知道一句保重有多重。'],
 才女:['把旧书夹进箱中，信上写了半页又嫌不够','在书页边记下家中见闻，到了告别那一行却留下空白','原想把归家的事写得好些，落笔才发觉，最想留下的都是些寻常话。'],
 贪财:['将给家人的礼单算清，怕漏掉一份心意','清点带回的礼物，却把一件不值钱的旧物放在最上头','带回来的东西都收好了。最舍不得放下的，倒不是最贵的那一件。'],
 沉静:['默默叠好衣裳，听到可以启程才露出一点笑意','话仍不多，却在整理旧物时久久停手','没有多少新鲜事。只是坐在旧屋里听家人说话，便想让时辰慢些。'],
 爽直:['直说自己想家，也认真应下按期回宫的约定','不避讳说舍不得，又将家中难处一件件讲明','臣妾高兴，也舍不得，没什么不好承认。家里有几件事，还想慢慢安排。'],
 持重:['交代好宫务，再将家中所需列妥，终于放下一件牵挂','先查交接，夜里才把家人的话重新想了一遍','该交代的都交代了。可家人送到门前时，臣妾还是比原定的时候多站了一会儿。'],
 好客:['想着替同宫的人带些家乡小物，逐一问过忌口','愿与亲近的人分些乡味，也肯听她们说各自的家乡','带了几样乡味，想请熟悉的姐妹尝尝。说起家里，也想听听她们的旧事。'],
 巧手:['将给家人的针线收好，连最后一处接缝也仔细摸过','带回旧针线笸箩，边理花样边想起家人的手','家里那只旧笸箩还在，看着就想起从前一起做针线的日子。'],
 好学:['记下想向家人请教的旧事，盼这回能听个仔细','把所闻家事写在册上，才发觉从前懂得的远没有想的多','从前听过的家事，这回问细了，才知道另有缘由。臣妾还想慢慢记下来。'],
 孤高:['不愿大张旗鼓，却把家信放在行李最容易拿到的地方','不在人前铺说归家排场，只在独处时重读家人留的字','外头的迎送臣妾不想多说。回到旧屋坐了一会儿，才知有些牵挂并未因独处而淡去。']
};
const homeLeaveStyle=c=>HOME_LEAVE_STYLES[isSolitary(c)?'孤高':c.trait]||HOME_LEAVE_STYLES.温婉;
const homeMother=c=>c?.homeLife?.mother;
const homeWorryActive=c=>!!(c?.alive&&!c.gone&&homeMother(c)?.status==='ill');
// Worry about family is not a grievance against the emperor. Only an explicit
// refusal from him (byEmperor) leaves a hurt that colours later conversations.
function homeRecord(c,text,emotion=0,other,byEmperor=false){
 story(c,text);if(emotion>=0)remember(c,'care',text);else if(byEmperor)remember(c,'hurt',text);
 NPCMemory.record(S,{type:'home-family',time:S.turn,participants:[c.id,...(other?[other.id]:[])],outcome:text},[{person:c.id,subject:other?.id||'family',interpretation:text,emotion,impact:75}]);
}
function homeSetFeeling(c,k,why){if(!['悲恸','心如死灰','怨恨'].includes(xinOf(c)))setXin(c,k,why);}
function beginMotherIllness(c){
 if(['ill','recovering'].includes(homeMother(c)?.status))return homeMother(c);
 const r=(c.homeLife||={}).mother={from:S.turn,status:'ill',due:S.turn+3,care:'letters',lastTalk:-99};
 cchg(c,{mood:-8});homeSetFeeling(c,'忧心','收到母亲重病的家书，正在等候病况');
 const reaction=isSolitary(c)?'将书合上，独自读了几遍家信，只向信得过的人问病况':['骄纵','骄矜'].includes(c.trait)?'在人前仍撑着体面，回到内室却一遍遍追问送信的人':['聪慧','持重','好学','城府'].includes(c.trait)?'逐项写下要问医者的话，纸写满了，心里仍没有底':'把家书放在枕边，听到外头脚步便以为又有消息';
 homeRecord(c,`【家中病讯】母亲病重，不能远行。她${reaction}。担忧从这封信起留在心里。`,-.7);return r;
}
function homeMotherTick(c){
 const r=homeMother(c);if(!c.alive||c.gone||!r||r.status==='well'||S.turn<r.due)return;
 if(r.status==='ill'){
  r.status='recovering';r.due=S.turn+4;
  cchg(c,{mood:4});homeSetFeeling(c,'释然','母亲病势暂稳，仍在调养');
  homeRecord(c,`【病况回音】${c.homeLeave?.reason==='探病'?'在家陪护时，医者说明':'家中来信报'}母亲病势暂稳，仍需调养。${r.care==='physician'?'派去的太医留下后续照护嘱咐；':''}她终于松了一口气，却不把暂稳当成已经痊愈。`,.25);
 }else{
  r.status='well';r.resolved=S.turn;cchg(c,{mood:4});homeSetFeeling(c,'释然','家书报母亲渐愈，终于安心些');
  homeRecord(c,'【家书报安】家中确认母亲已经能起身料理些轻省事，仍遵医嘱休养。她将报安信与最初的病讯一同收好，心里的重担才渐渐落下。',.55);
 }
}
function homeDeparture(c,reason){
 if(reason==='探病'){const m=beginMotherIllness(c);m.care='visit';m.due=Math.min(m.due,S.turn+2);}
 if(homeWorryActive(c))return '归途并未让她忘记病讯，她只盼早些亲眼看见母亲，心里仍然担忧。';
 homeSetFeeling(c,'欢喜','获准回家省亲，盼与家人重聚');return `她${homeLeaveStyle(c)[0]}。`;
}
function homeReturn(c,leave,early){
 const worried=homeWorryActive(c),reason=leave.reason;
 const feeling=worried?'挂念病中的母亲':early?'归期骤至，仍有不舍':reason==='探病'?'稍稍安心，仍惦记照护':'团聚后的欢喜与离别的不舍';
 const detail=worried?'母亲尚未有病势缓和的确讯，她虽然回宫，仍一封封等着家书。':reason==='探病'?`母亲${homeMother(c)?.status==='well'?'已经渐愈':'病势暂稳，仍需调养'}。她把照护嘱咐留给家人，心里稍安，却仍惦记着下一封信。`:early?'几句想与家人说的话还未说完，她依旨回宫，心里仍有不舍。':`她${homeLeaveStyle(c)[1]}。`;
 const text=`${early?'奉旨提前':'按约'}结束${reason}，回到${c.palace}。${detail}`;
 (c.homeLife||={}).returned={turn:S.turn,from:leave.from,reason,early,feeling,text,sharedWith:{},lastTalk:-99};
 homeSetFeeling(c,worried?'忧心':early?'思念':'释然',feeling);homeRecord(c,text,worried||early?-.25:.55);
 cchg(c,{mood:worried?-1:early?-2:6});return text;
}
function homeLifeVoice(c){
 const m=homeMother(c),r=c.homeLife?.returned,echo=c.homeLife?.heard;
 if(c.homeLeave)return voiceLine('home-leave','她从家中托人带来一封短笺。',homeWorryActive(c)?'臣妾在家陪着母亲，医者还在看顾，不能说已经好了。夜里听她咳一声，心里便揪一下。':m?.status==='recovering'?'母亲眼下稍稳，仍需调养。臣妾依约期满便回，也会把照护交代妥当。':'臣妾正在家中。见过家人，欢喜之外也想把日子过慢些；依约期满便回。');
 if(!inPalace(c))return null;
 if(homeWorryActive(c))return voiceLine('home-mother-worry',isSolitary(c)?'她将家信压在书下，只向你说出那一点不安。':'她手边压着家信，听见脚步便先抬头。',m.care==='physician'?'太医已经去了，臣妾记着陛下的照应。只是还没有新的病况，心里总悬着。':r?.early&&r.reason==='探病'?'臣妾依旨先回来了，可母亲还病着。临走时她说不必挂念，臣妾却更放不下。':'家里说母亲病得重，臣妾连她今夜睡得安不安稳都不知道。陛下肯听臣妾说一会儿么？');
 if(r&&S.turn-r.turn<=6)return voiceLine('home-return','她又想起这一回归家的日子。',r.reason==='探病'?(m?.status==='well'?'后来那封报安信，臣妾收着呢。从病讯到渐愈，才知道一家人平安有多难得。':'回宫前母亲病势稍稳，尚未全好。照护已交代妥当，可还是盼着下一封家书。'):r.early?'还有些话没说完便奉旨回来了。臣妾知道应当奉诏，只是下次见面，不知又要隔多久。':homeLeaveStyle(c)[2]);
 if(m?.status==='recovering')return voiceLine('home-mother-recovery','她将新的家书同先前的病讯放在一起。','母亲病势暂稳，仍要调养。臣妾安心些了，也盼家人继续把实情写来，不必只报喜。');
 if(echo&&S.turn-echo.turn<=3)return voiceLine('home-shared-memory',`她想起与${echo.name}说过的家常。`,echo.quote);
 return null;
}
function homeCareEvent(c){
 if(!inPalace(c)||maternalUnsettled(c))return null;
 const worried=homeWorryActive(c),r=worried?homeMother(c):c.homeLife?.returned;
 if(!r||!worried&&S.turn-r.turn>6||S.turn-r.lastTalk<1)return null;
 const v=homeLifeVoice(c);if(!v)return null;
 let done=false;const valid=()=>!done&&inPalace(c)&&r===(worried?homeMother(c):c.homeLife?.returned)&&S.turn-r.lastTalk>=1;
 return {title:worried?'家书未至':'归家后的话',por:c,present:[c],valid,text:v.lines.join('\n'),choices:[
  {t:worried?'听她说担忧，准家中继续传信 · 精力−1':'听她慢慢讲这一趟 · 精力−1',cond:()=>E().energy>0,f:()=>{if(!valid()||!useE())return null;done=true;r.lastTalk=S.turn;const t=worried?'陛下听她把母亲的病况与担忧说完，准家人继续传报实情。她觉得有人肯听，忧心却没有因此消失。':`她向陛下说起这一趟${r.reason}：“${v.lines[0]}”被认真听完后，心里多了几分安稳。`;homeRecord(c,t,.35);cchg(c,{aff:3,mood:3});return t;}},
  {t:'今日先不细谈',f:()=>{if(!valid())return null;done=true;r.lastTalk=S.turn;const t=worried?'她将未说完的担忧收回家信里，仍等着母亲的病况。':'归家的话说到一半便搁下，她把带回的小物收好，余下的话留在心里。';homeRecord(c,t,-.2);return t;}}]};
}
A.homeStory=function(id){if(modalOpen)return;const ev=homeCareEvent(byId(id));if(ev)pushEv(ev);};
function homeFamilyPanel(c){
 const r=c.homeLife?.returned,m=homeMother(c),ev=homeCareEvent(c),heard=c.homeLife?.heard;
 if(!m&&!r&&!heard)return '';
 return `<section class="personal-experience"><h3>归家与牵挂</h3>${m?`<p>家中病况：${{ill:'母亲病重 · 等候回音',recovering:'母亲病势暂稳 · 仍需调养',well:'家书报安 · 母亲渐愈'}[m.status]||'等待家书'}</p>`:''}${r?`<p>${esc(r.text)}</p>`:''}${heard&&S.turn-heard.turn<=6?`<p>与${esc(heard.name)}谈起归家：“${esc(heard.quote)}”</p>`:''}${ev?`<button class="btn jade" data-onclick="A.homeStory(${c.id})">${homeWorryActive(c)?'问问家中病况':'听她说归家后的心事'}<small>精力−1</small></button>`:''}${homeReturnSocialEvent(c)?`<button class="btn" data-onclick="A.homeConversation(${c.id})">听听宫中的归家闲话</button>`:''}</section>`;
}
function homeSocialTone(c){
 if(homeMother(c)&&homeMother(c).status!=='well'||c.homeLife?.returned?.reason==='探病')return 'care';
 if(isSolitary(c))return 'quiet';
 if(['骄纵','骄矜','善妒'].includes(c.trait))return 'proud';
 return ['好客','活泼'].includes(c.trait)?'warm':'quiet';
}
function homeReturnSocialEvent(speaker){
 for(const c of speaker?[speaker]:harem()){
  const r=c.homeLife?.returned;
  if(!inPalace(c)||maternalUnsettled(c)||!r||S.turn-r.turn>6||r.socialDone||S.turn-(S.flags.lastHomeConversation??-99)<3)continue;
  const available=o=>o!==c&&!maternalUnsettled(o)&&!homeWorryActive(o);
  const friends=harem().filter(o=>available(o)&&relGet(c,o)>=30);
  const o=friends.sort((a,b)=>relGet(c,b)-relGet(c,a)||a.id-b.id)[0]||(!isSolitary(c)&&['骄纵','骄矜','好客','活泼'].includes(c.trait)?harem().find(o=>available(o)&&relGet(c,o)>-30):null);
  if(!o)continue;
  const tone=homeSocialTone(c),friend=relGet(c,o)>=30,jealous=!isSolitary(o)&&['善妒','骄纵','骄矜'].includes(o.trait),bereaved=o.wound==='mom',foreign=!!o.rescue||o.fam.t==='西域贡女';
  const quote=tone==='care'?(homeWorryActive(c)?'这一趟没有把担忧留在家里。我回来了，仍等着母亲的病况。':'母亲病势稍稳时，我才敢稍松口气。那些迎送都算不了什么，能亲眼见她才要紧。'):tone==='proud'?(c.fam.p>=60?'家中迎送的仪节一项不缺，街坊都知道是奉旨归宁。这样的恩典，自然要记着。':'家里虽不阔绰，这回也把门庭收拾得整齐。奉旨归家的体面，街坊都看见了。'):tone==='warm'?'带了些家乡的小物，想与你分一分。说说你家里的事可好？':'我没有多少热闹可讲，只记得家里一顿寻常饭。能坐下来好好说话，已觉得难得。';
  const reply=tone==='care'?'家人的病最让人悬心。若你愿意说，我便陪你等下一封信。':bereaved?'听你说起归家，我也想起母亲。只是有些门，再回去也见不到从前的人了。':foreign?'我也想见远处的家人，只是路远，尚不是说回去便能回去的。':friend?'替你高兴是真的，听着想家也是真的。若有机会，我也想回去坐一坐。':jealous?'你能归家，自然是好事。只是这样的恩典，旁人也会惦记。':'听你说起，倒也想起自己家里了。只盼亲人都平安。';
  let done=false,queued=false;const valid=()=>!done&&inPalace(c)&&inPalace(o)&&r===c.homeLife?.returned;
  const rememberScene=()=>{if(queued)return;queued=true;r.socialDone=true;r.sharedWith||={};r.sharedWith[o.id]=S.turn;S.flags.lastHomeConversation=S.turn;
   homeRecord(c,`【归家闲话】与${fullName(o)}谈起${r.reason}：“${quote}”她回答：“${reply}”`,tone==='care'?-.1:.35,o);
   homeRecord(o,`【归家闲话】听${fullName(c)}说起${r.reason}：“${quote}”自己答道：“${reply}”`,bereaved?-.3:.2,c);
   (o.homeLife||={}).heard={turn:S.turn,person:c.id,name:fullName(c),quote:reply};
  };
  const finish=mode=>{if(!valid())return null;rememberScene();done=true;
   const text=mode==='compare'?'陛下提醒，归家各有缘故，不必拿恩典与排场比较。两人将话题转回家人近况。':mode==='ask'?`陛下也问起${fullName(o)}的牵挂，听完她说的话，没有当场许诺不合眼下处境的行程。`:tone==='proud'&&!friend&&jealous?'这场闲话留了下来，旁人面上含笑，心里却多了一点比较。':'两人把家常说完，彼此多知道了一件真正放在心上的事。';
   relAdd(c,o,mode==='compare'?1:tone==='proud'&&!friend&&jealous?-3:3);if(mode==='ask')cchg(o,{aff:3,mood:2});
   homeRecord(c,text,.2,o);homeRecord(o,text,.2,c);return text;
  };
  return {title:'归家闲话',por:c,cast:[c,o],present:[c,o],cooldown:3,valid,onQueue:rememberScene,text:`${cName(c)}回宫后与${cName(o)}说起这一趟${r.reason}。\n“${quote}”\n${cName(o)}答道：“${reply}”`,choices:[{t:'让她们把家常说完',f:()=>finish('listen')},{t:'提醒不必拿恩典与排场相较',f:()=>finish('compare')},{t:`也问问${fullName(o)}的牵挂`,f:()=>finish('ask')}]};
 }
 return null;
}
A.homeConversation=function(id){if(modalOpen)return;const ev=homeReturnSocialEvent(byId(id));if(ev)pushEv(ev);};
