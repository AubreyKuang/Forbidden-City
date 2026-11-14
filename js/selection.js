/* Selection audiences and the first months at court. Rendering never rolls a new personality. */
function entryManner(c){
  if(c.scheme>=60||['聪慧','持重','城府'].includes(c.trait))return 'careful';
  if(['骄纵','活泼','爽直','将门'].includes(c.trait)&&c.scheme<45)return 'bold';
  if(['淡泊','沉静'].includes(c.trait))return 'quiet';
  return 'nervous';
}
function selectionSpeech(c){
  const manner=entryManner(c),hobby=consortHobby(c);
  const lines={
    careful:['她走到席前才抬眼，袖边虽捏得微紧，行礼却丝毫不乱。','臣女初入禁庭，许多礼数尚不熟悉。愿先把分内之事学好，再慢慢请教。'],
    bold:['她扶正鬓边花钗，声音比引见的嬷嬷还清亮，说完才想起垂眼。','臣女在家时，也常与姐妹争个高下。今日既来了，便想让陛下记得臣女。'],
    quiet:['她停在帘外听完一声檐铃，才从容走进来，将衣袖拢好。','臣女平日最爱一窗清影。有书可读、有花可看，便不觉得日子长。'],
    nervous:['她照着嬷嬷教的步子上前，开口时微微一顿，耳尖先红了。','臣女……给陛下请安。来时在心里练了许多遍，真到了这里，倒忘了该怎样说。']
  };
  const acts={读书:'她翻开随身小册，讲起自己对书中一段话的理解。',抚琴:'她试过琴弦，才缓缓弹出一段小曲。',刺绣:'她展开自己绣的小屏，细说针脚与配色。',侍花:'她拈起一枝花，说起怎样养护才不伤根。',做点心:'她呈上家中学做的花糕，讲起火候。',投壶:'她拣起一支箭，向铜壶试投。',骑射:'她取来未上弦的弓，示范执弓与站姿。',对弈:'她在棋盘上摆出一局残棋，说起自己的解法。',品茶:'她温杯分茶，先将一盏清茶奉到案前。'};
  const skill=c.talent>=70?'举止渐渐舒展，讲到熟悉之处，眼中有了光。':c.talent<40?'中途出了个小差错，她停下来重新试过，没有勉强夸口。':'虽不算出众，倒看得出平日用过心。';
  const blurt=travelerSelectionBlurt(c);
  return {manner,stage:blurt?.stage||lines[manner][0],line:blurt?.line||lines[manner][1],talent:(acts[hobby]||acts.读书)+skill,
    reply:c.talent<40?'臣女还没学得很好。若有机会，想把这一处再练明白。':manner==='bold'?'这才是臣女平日最拿手的。陛下可愿再看一回？':'在家练时不觉得，今日才知道，心定下来，手才能稳。'};
}
function selectionCurrent(){
  const session=S.selection;
  if(!S.cands.length||session?.phase==='roster')return null;
  return S.cands.find(c=>c.id===session?.current)||S.cands[0];
}
function viewSelectionAudience(){
  const c=selectionCurrent();if(!c)return '';
  const speech=selectionSpeech(c),shown=S.selection?.performed?.includes(c.id);
  return `<section class="selection-audience selection-scene" aria-label="秀女觐见"><header><div><p>储秀宫 · 依次觐见</p><h2>${esc(fullName(c))}</h2><p>${c.age}岁 · ${esc(c.fam.t)}之女</p></div><button class="btn sm" onclick="A.xxRoster()">直接看名册</button></header>
    <div class="audience-body"><div class="audience-portrait">${porImg(c,210)}</div><div class="audience-dialogue"><p>${esc(shown?speech.talent:speech.stage)}</p><blockquote>“${esc(shown?speech.reply:speech.line)}”</blockquote><p class="hint">${esc(c.kinNote||'')} ${shown?'已看过才艺，可继续觐见或回名册留选。':'可听她展示所长，再统一决定留谁。'}</p></div></div>
    <footer><span>${S.cands.indexOf(c)+1} / ${S.cands.length} 位候选</span><div class="acts"><button class="btn" onclick="A.xxPerform(${c.id})" ${shown?'disabled':''}>展示才艺 · ${esc(consortHobby(c))}</button><button class="btn gold" onclick="A.xxNext(${c.id})">${S.cands.indexOf(c)===S.cands.length-1?'看完，回名册留选':'请下一位'}</button></div></footer></section>`;
}
A.xxRoster=function(){if(modalOpen)return;S.selection={...(S.selection||{}),phase:'roster'};save('auto');render();};
A.xxMeet=function(id){if(modalOpen||!S.cands.some(c=>c.id===id))return;S.selection={...(S.selection||{}),phase:'audience',current:id};save('auto');render();};
A.xxPerform=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;S.selection||={};S.selection.performed||=[];if(!S.selection.performed.includes(id))S.selection.performed.push(id);save('auto');render();};
A.xxNext=function(id){if(modalOpen||selectionCurrent()?.id!==id)return;const i=S.cands.findIndex(c=>c.id===id);S.selection||={};S.selection.current=S.cands[i+1]?.id;S.selection.phase=i+1<S.cands.length?'audience':'roster';save('auto');render();};
function newcomerWelcomeEvent(c){
  const arrival=c.entryAdjustment;
  if(!arrival||arrival.settled||!inPalace(c))return null;
  const valid=()=>inPalace(c)&&!arrival.settled;
  const favored=harem().filter(o=>o.id!==c.id&&o.favor>=40).sort((a,b)=>b.favor-a.favor||a.id-b.id)[0];
  const news=favored?`宫人答说，近来${cName(favored)}常蒙召见。`:'宫人只说，各宫各有起居，不好妄议圣意。';
  const text={careful:`她先请教请安的次序，又不动声色地问了各宫近来的赏赐。${news}\n见你进来，她收住话：“臣妾只怕不懂规矩，给人添了麻烦。”`,
    bold:`行李还没收好，她便拉住领路宫人：“宫里如今谁最得宠？陛下平日爱往哪一宫去？”${news}\n见你来了，她仍忍不住问：“臣妾若做得好，陛下也会常来么？”`,
    quiet:'她把带来的旧书放在窗下，先问院里可否种一丛兰。见你来了，她微微一笑：“地方还生疏，不过有这一窗日色，臣妾便能慢慢住惯。”',
    nervous:'她望着陌生的宫门，几次想问话，又将话咽回去。见你来了才轻声道：“臣妾怕行错礼，也怕说错话。今夜的灯，可否留得晚些？”'}[arrival.manner];
  const settle=(answer,changes,line)=>{
    if(!valid())return null;arrival.settled=true;arrival.answer=answer;arrival.favored=favored?.id;arrival.answeredAt=S.turn;
    cchg(c,changes);story(c,`初入宫时，${line}`);remember(c,'care',line);save('auto');return line;
  };
  return {title:'初入宫门',por:c,valid,text:`${fullName(c)}刚住进${c.palace}。\n${text}`,choices:[
    {t:'先安心住下，有不懂的慢慢问',f:()=>settle('reassured',{aff:6,mood:8},'陛下许她慢慢熟悉宫中生活，不必事事惶恐。')},
    {t:'请掌事姑姑教她宫中礼数',f:()=>settle('guided',{aff:2,mood:4},'陛下安排掌事姑姑陪她认路、习礼，也教她分辨传言。')},
    {t:'各人有各人的日子，不必急着比较',f:()=>settle('boundaries',{mood:2},'陛下劝她先过好自己的日子，不必急着争高下。')}]};
}
function newcomerVoice(c){
  const a=c.entryAdjustment;if(!a?.settled||S.turn-a.turn>=6)return null;
  const lines={careful:['请安的路臣妾已经认得了。宫人说的话，臣妾也只听一半，剩下的，总要自己看过才算。','刚来时怕失了分寸，如今才懂，话不必句句都接。陛下若愿听，臣妾也有自己的想法。'],bold:['那日问谁得宠，原是臣妾心急了。只是盼陛下下回来时，不必再让人通报名姓。','宫里的日子，比臣妾在家想的难猜。可臣妾还是想把自己喜欢的，认认真真做给陛下看。'],quiet:['窗下那一点新绿，今早又长了。宫里虽大，也渐渐有了臣妾认得的地方。','昨日走过长廊，竟没有走错。原来熟悉一个地方，也可以这样慢慢来。'],nervous:['昨夜终于睡安稳了。醒来时还以为在家，听见廊下请安的声音，才想起已经进宫。','臣妾把各宫的名字写在纸上，认得一个，便划去一个。如今不大怕独自走过长廊了。']};
  return voiceLine('newcomer','她说起这些日子，语气比初见时松了一些。',lines[a.manner]||lines.nervous);
}
