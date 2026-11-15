/* Durable, named experiences. These ticks never manufacture an audience. */
function livedRecord(people,kind,title,thread,text,thoughts=[]){
 const cast=[...new Set(people.filter(p=>p&&p.alive!==false))];
 lifeRecord(cast,kind,title,text,'',thoughts);
 cast.forEach((p,i)=>{const e=p.story.at(-1);e.thread=thread;if(thoughts[i]&&!(p.sex&&Number.isFinite(p.born)&&Math.floor((S.turn-p.born)/12)<3))e.t+=` ${p.name||fullName(p)}记下：${thoughts[i]}`;});
}
function lifeDisputeEvent(c,p){
 const o=byId(p.partner),valid=()=>p.gen===S.gen&&inPalace(c)&&inPalace(o)&&c.personalLife?.project===p;
 if(!valid())return null;
 const resume=()=>valid()&&!lifeCooperationBroken(c,o)&&relGet(c,o)>=15;
 return {title:'合编暂歇',por:c,cast:[o],present:[c,o],valid,text:`《${p.title}》已经整理${p.progress}个月。两人近来有了隔阂，各自收起稿件；旧署名仍在，不能当作什么也没有发生。
${resume()?'近来的相处缓和了一些，她们愿意重新商量。':'先把人与人的矛盾慢慢解开，才能再谈合作。'}`,choices:[
  {t:'重新商定各自留稿，再续合编 · 精力1',cond:resume,why:'交情尚未缓和',f:()=>{if(!resume()||!useE())return null;delete p.dispute;p.lastTick=S.turn;const t=`${fullName(c)}与${fullName(o)}重新同意续编《${p.title}》，各自保留原稿，公开前须再征求双方意见。没有抹去先前的分歧。`;lifeRecord([c,o],'craft',p.title,t,p.cause);return t;}},
  {t:'到此为止，分别保存未完稿',f:()=>{if(!valid())return null;const fragment={id:`fragment:${S.gen}:${c.id}:${p.started}`,title:p.title,hobby:p.hobby,kind:'craft',gen:S.gen,date:dateStr(),turn:S.turn,authors:[c,o].map(a=>({id:a.id,name:fullName(a)})),mode:'private',source:p.cause,incomplete:true};for(const a of [c,o])lifeState(a).works.push({...fragment});delete c.personalLife.project;c.personalLife.finished=S.turn;const t=`${fullName(c)}与${fullName(o)}决定终止《${p.title}》的合编，各自留存未完稿，保留原作者姓名，没有将残稿冒作成书。`;lifeRecord([c,o],'craft',p.title,t,p.cause);return t;}},
  {t:'先各自静一静',f:()=>{if(!valid())return null;if(!p.dispute)p.dispute={turn:S.turn};if(p.dispute.lastTalk!==S.turn){p.dispute.lastTalk=S.turn;lifeRecord([c,o],'craft',p.title,`谈及《${p.title}》，两人决定暂不续编，也未将任何人的稿件转交旁人。`,p.cause);}return '稿子仍由各自收着。';}}
 ]};
}
function cohortLifeTick(){
 const people=S.consorts.filter(c=>c.selectionCohort),states=S.flags.cohortLives||=( {} );
 for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
  const a=people[i],b=people[j];if(!sameSelectionCohort(a,b))continue;
  const key=`${S.gen}:${Math.min(a.id,b.id)}:${Math.max(a.id,b.id)}`,old=states[key],gap=Math.abs(a.rank-b.rank),favor=Math.abs(a.favor-b.favor),relation=relGet(a,b);
  const now={gap,favor,relation,aAlive:a.alive,bAlive:b.alive,aCold:!!a.cold,bCold:!!b.cold,last:old?.last??-99,death:old?.death||false,pending:old?.pending||null};
  states[key]=now;if(!old)continue;
  const thread=`cohort:${key}`,source=`${a.selectionCohort.date}，${fullName(a)}与${fullName(b)}同批入宫。`;
  if((!a.alive||!b.alive)&&!old.death){now.death=true;const living=a.alive?a:b,dead=a.alive?b:a;if(!living.alive||living.gone)continue;
   livedRecord([living],'loss','同批故人',thread,`${source}如今${fullName(dead)}离世，${fullName(living)}收起旧时入宫留下的名帖。`,[old.relation>=25?'那日一同走过宫门的人，往后只能在旧事里相见。':old.relation<0?'有过不睦，也有过同走这一段路的日子。恩怨没有因此变成亲密。':'虽少有私交，仍记得当年并肩候选的身影。']);continue;}
  if(!a.alive||!b.alive||a.gone||b.gone)continue;
  if(old.relation>=25&&(relation<0||isRival(a,b)||isRival(b,a))){
   livedRecord([a,b],'bond','同路而渐远',thread,`${source}近来的嫌隙使两人不再像从前那样互相留座；同批之谊没有替她们消除矛盾。`,['还记得初来时的照应，却不能当作后来那些话没有说过。','当年的交情是真的，如今想留些距离也是真的。']);now.last=S.turn;continue;
  }
  if(relation>=25&&((a.cold&&!old.aCold)||(b.cold&&!old.bCold))){const fallen=a.cold?a:b,friend=fallen===a?b:a;now.pending={friend:friend.id,fallen:fallen.id,turn:S.turn,source,thread};
   livedRecord([friend,fallen],'bond','旧友失意',thread,`${source}${fullName(fallen)}如今幽居冷宫，旧日来往被宫规隔开。${fullName(friend)}尚未获得探视许可。`,['想念旧交，也知道送信探望都须守宫规。','身处冷落，旧日的照应如今是否还算数，尚无消息。']);continue;
  }
  if(!inPalace(a)||!inPalace(b)||S.turn-now.last<12)continue;
  if((gap>=2&&old.gap<2)||(favor>=35&&old.favor<35)){
   const close=relation>=25&&!isSolitary(a)&&!isSolitary(b);now.last=S.turn;
   livedRecord([a,b],'court','同批人的不同际遇',thread,`${source}如今${fullName(a)}与${fullName(b)}的${gap>=2?'位分':'受眷'}渐有差别，请安时座次与相见的机会也变了。`,[close?'还记得初来时彼此照应，不愿只凭如今的际遇衡量旧交。':isSolitary(a)?'守礼相见便好，不因同批入宫就勉强亲近。':'认得当年的同伴，也看见今日彼此走上不同的路。',close?'人前依礼，私下是否还能如常说话，要看以后怎样相处。':isSolitary(b)?'各有际遇，仍按自己的步调过日子。':'同来的旧缘还在，亲疏却须看真实的相处。']);
  }
 }
}
A.cohortCare=function(key){const state=S.flags.cohortLives?.[key],p=state?.pending,c=byId(p?.friend),o=byId(p?.fallen);
 const valid=()=>state?.pending===p&&inPalace(c)&&o?.alive&&o.cold&&relGet(c,o)>=25;
 if(modalOpen||!valid())return;
 const settle=allow=>{if(!valid()||!useE())return null;delete state.pending;const t=allow?`${fullName(c)}获准托掌事宫人把衣物送给冷宫中的${fullName(o)}，未私自入内，也没有改变禁令。`:`${fullName(c)}请托送衣给${fullName(o)}，陛下暂未准许；她把备好的衣物收起。`;livedRecord([c,o],'bond','旧友失意',p.thread,t,allow?['能送去一点照料，已是难得。','收到旧友送来的衣物，才知道那段旧交并未被忘记。']:['先留着，等合适的时候再问。','只知禁令仍在，没有收到旧友的衣物。']);if(allow)relAdd(c,o,4);return t;};
 pushEv({title:'旧日同来的那个人',por:c,present:[c],valid,text:`${p.source}\n她提起冷宫里的${fullName(o)}：“不能私自去见，能否依规托人送一件冬衣？”`,choices:[{t:'准依规送衣 · 精力1',f:()=>settle(true)},{t:'暂不准许 · 精力1',f:()=>settle(false)},{t:'稍后再议'}]});
};
function cohortLifePanel(c){return Object.entries(S.flags.cohortLives||{}).filter(([,s])=>s.pending?.friend===c.id&&inPalace(c)&&byId(s.pending.fallen)?.alive&&byId(s.pending.fallen)?.cold&&relGet(c,byId(s.pending.fallen))>=25).map(([key,s])=>`<p>仍惦记同批入宫的${esc(fullName(byId(s.pending.fallen)))}。</p><button class="btn" onclick="A.cohortCare('${key}')">听听她对旧友的牵挂</button>`).join('');}

function parentEpisodeStyle(c){return isSolitary(c)?'quiet':['骄纵','骄矜','好胜','善妒'].includes(c.trait)?'proud':['才女','聪慧','好学','持重'].includes(c.trait)?'study':c.trait==='体弱'?'frail':['将门','爽直'].includes(c.trait)?'brave':['城府','沉静','淡泊'].includes(c.trait)?'reserved':'gentle';}
function parentEpisodeCandidate(c){return inPalace(c)?S.children.find(k=>!k.pendingName&&kidAge(k)>=6&&kidAge(k)<16&&familyVisitAllowed(k,c)&&S.turn-(c.parentEpisodes?.[k.id]?.finished??-99)>=18&&!c.parentEpisodes?.[k.id]?.pending):null;}
function parentEpisodeEvent(c){
 const k=parentEpisodeCandidate(c);if(!k)return null;const style=parentEpisodeStyle(c),disposition=childDisposition(k),thread=`parent:${S.gen}:${c.id}:${k.id}:${S.turn}`,age=kidAge(k);
 const desire=['好胜','爽直'].includes(disposition)?'练投壶':['仁厚','审慎'].includes(disposition)?'读一则小故事':'画庭前花木';
 const subjects={quiet:['只给母亲看的画',`${k.name}把一幅画得歪歪斜斜的小像送到她手里。她待旁人一向清冷，却俯下身一处处听孩子讲；孩子小声问，能不能别拿去给满宫的人看。`],proud:['护短之后',`${k.name}练习时不愿重来，她先替孩子辩了几句。孩子却说：“我不是做不到，我想先自己试。”她怕孩子受委屈，也怕这番心疼反让孩子不敢认错。`],study:['一张写满批注的纸',`她细改${k.name}的习字，孩子却想${desire}。${age<10?'小小的手指在纸角上绕着':'孩子已能说出自己的打算'}，盼母亲先听完，再定今天的功课。`],frail:['床前的小帮手',`${k.name}看她${c.hp<55?'病中倦怠':'素来体弱'}，想替她收拾书案。她心里温软，又不愿孩子日日担忧，以为照料母亲全是自己的责任。`],brave:['自己试一回',`${k.name}想${desire}，遇到不会的地方却迟迟不肯开口。她素来爽利，想教孩子再试；孩子更盼她先站在身边陪一小会儿。`],reserved:['一句说得很轻的心事',`${k.name}悄悄说起练习受挫，怕自己让母亲失望。她平日话少，这一回也得想想，如何让孩子知道自己的心意。`],gentle:['母亲手边的位置',`${k.name}想自己${desire}，又几次回头看母亲。她习惯替孩子准备妥当，今日才察觉，孩子既想独立，也想有人在旁应一声。`]};
 const [title,scene]=subjects[style],valid=()=>parentEpisodeCandidate(c)===k;
 const decide=mode=>{if(!valid()||!useE())return null;
  const t=mode==='listen'?style==='quiet'?`${fullName(c)}收好${k.name}送的小像，答应不拿去传看；孩子愿意下回再画一幅。`:`${fullName(c)}听完${k.name}的意思，约定下回先让孩子试${desire}，有困难再一起想办法。`:`${fullName(c)}坚持先照原来的安排。${k.name}${['审慎','敏感'].includes(disposition)?'把没说完的话收了回去':'答应照做，却仍惦记自己的打算'}，母亲的好意没有立刻变成孩子的认同。`;
  (c.parentEpisodes||={})[k.id]={pending:true,turn:S.turn,mode,style,title,thread,desire};
  (k.motherBonds||={})[c.id]={...(k.motherBonds?.[c.id]||{}),trust:clamp(childTrust(k,c)+(mode==='listen'?5:-3))};
  livedRecord([c,k],'family',title,thread,t,[mode==='listen'?'孩子并非事事需要我替着做，也盼我认真听见。':'我有自己的担心，还要看看孩子日后的回应。',mode==='listen'?style==='quiet'?'这张画只属于母亲和我。':'自己的话终于被听完了。':'我答应了，却还没有想通。']);return t;};
 return {title,por:c,cast:[k],present:[c,k],valid,text:scene,choices:[{t:style==='quiet'?'依孩子的意思，私下珍藏 · 精力1':'先听孩子，把办法一起商量 · 精力1',f:()=>decide('listen')},{t:'仍依母亲原来的安排 · 精力1',f:()=>decide('insist')},{t:'改日再一起说',f:()=>{if(!valid())return null;livedRecord([c,k],'family',title,thread,`${fullName(c)}与${k.name}这回尚未把话说完，约待有闲再谈。`,['这件事还没有谈妥。','自己的打算仍未定下。']);return '话还留在这里，没有替孩子作出决定。';}}]};
}
A.parentEpisode=function(id){if(!modalOpen){const ev=parentEpisodeEvent(byId(id));if(ev)pushEv(ev);}};
function parentEpisodeTick(){for(const c of S.consorts)for(const [id,p] of Object.entries(c.parentEpisodes||{})){
 if(!p.pending||S.turn<=p.turn)continue;const k=kidById(+id);
 if(!c.alive||!k?.alive){p.pending=false;p.finished=S.turn;livedRecord([c,k],'loss',p.title,p.thread,`原先约好再谈「${p.title}」，却因${!c.alive?'母亲离世':'孩子离世'}没能继续。旧时说过的话仍留在纪事中。`);continue;}
 if(!familyVisitAllowed(k,c)||!inPalace(c))continue;
 if(kidAge(k)>=16){p.pending=false;p.finished=S.turn;livedRecord([c,k],'family',p.title,p.thread,`多年后谈起「${p.title}」，${k.name}已经长大，两人没有再照搬儿时的安排，而把未完的话留作回忆。`);continue;}
 p.pending=false;p.finished=S.turn;const t=p.mode==='listen'?p.style==='quiet'?`${k.name}又带来一幅小画，${fullName(c)}把两张并排收入匣中，只在孩子面前说起画里新添的小细节。`:`${k.name}依照上回商量的办法试着${p.desire}，有一处没做好，主动叫${fullName(c)}来看。她没有包办，也没有借机翻旧账。`:`${k.name}照母亲的安排完成练习，却少说了自己的心思。${fullName(c)}察觉孩子这份安静，明白上回的话并未真正说开。`;
 livedRecord([c,k],'family',p.title,p.thread,t,[p.mode==='listen'?'这一次看见的，是孩子自己的小小进步。':'管得住一回功课，还需要慢慢学会听孩子说话。',p.mode==='listen'?'有事还可以再来找母亲。':'把事情做完，不等于心里已经释然。']);
}}
function parentEpisodePanel(c){const k=parentEpisodeCandidate(c),pending=Object.entries(c.parentEpisodes||{}).filter(([,p])=>p.pending);return `${pending.map(([id,p])=>`<p class="hint">与${esc(kidById(+id)?.name||'孩子')}的「${esc(p.title)}」尚有后续，待下次能相见。</p>`).join('')}${k?`<button class="btn" onclick="A.parentEpisode(${c.id})">和${esc(k.name)}说说心里话<small>孩子${kidAge(k)}岁 · 精力1</small></button>`:''}`;}
function livedRelationshipsTick(){cohortLifeTick();parentEpisodeTick();natalLifeTick();}
