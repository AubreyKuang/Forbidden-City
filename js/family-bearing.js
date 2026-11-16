/* Upbringing, present means and confidence are separate. Views do not roll dice. */
const familyBearingActive=()=>journalContentVersion()>=28;
function familyUpbringing(c){
  if(c.upbringing)return c.upbringing;
  const title=String(c.fam?.t||''),power=c.fam?.p||0;
  const foreign=!!c.rescue||/西域|异族|异乡|外邦|东瀛|海西/.test(title);
  const group=foreign?'foreign':/商|花笺铺/.test(title)?'merchant':/书香|翰林/.test(title)?'scholar':/农家/.test(title)?'farm':/太医|医家/.test(title)?'medicine':/将军|军户|武将/.test(title)?'military':power>=60||/世家|高门|贵族|国公|侯府|尚书|首辅|总督/.test(title)?'noble':/知府|侍郎|县令/.test(title)?'official':'humble';
  const means=c.rescue?'limited':/皇商|盐商|富商|贵族|高门|世家|国公|侯府/.test(title)||power>=60?'ample':/寒门|农家|宫女|歌女|流寓/.test(title)||group==='humble'?'limited':group==='scholar'?'modest':'comfortable';
  return {title,power,group,means};
}
function familyBearingContext(c){
  const roots=familyUpbringing(c),months=Number.isFinite(c.enteredAt)?Math.max(0,S.turn-c.enteredAt):null;
  const stage=c.knownBeforeAccession||months===null?'settled':months<6?'new':months<24?'learning':'settled';
  const helped=c.familyBearing?.helpUntil>S.turn;
  const constrained=['limited','modest'].includes(roots.means)&&c.rank<4&&c.favor<65&&!helped;
  return {roots,stage,months,helped,constrained};
}
function familyBearingStyle(c){
  return isSolitary(c)?'solitary':['骄纵','骄矜','善妒'].includes(c.trait)?'proud':['聪慧','城府','持重'].includes(c.trait)?'measured':['活泼','爽直','好客','将门'].includes(c.trait)?'bright':['才女','好学','巧手'].includes(c.trait)?'studious':'gentle';
}
const BEARING_NEW={
  ample:{
    gentle:['她拢袖落座，接盏与让座都做得自然，只在听到陌生的宫规时停下来细问。','家中用度向来宽裕，臣妾不为添件衣裳发愁。只是宫里的规矩，总得另学，不能拿家中的习惯作准。'],
    proud:['她并未多看案上的金器，先理正衣缘，等引礼的人说完才从容谢恩。','绸缎首饰，臣妾从前也见过。今日在意的，是旁人能否认真听臣妾把话说完。'],
    measured:['她听清各宫座次才坐下，礼数熟悉，却没有把家门当作在这里发号施令的凭据。','用度尚不必操心。眼下想弄明白的，是哪些事情该问谁、哪些礼数不可沿用家中的。'],
    bright:['她笑着谢过引路的人，谈起器物毫不生疏，到了宫规不明白的地方便坦然发问。','臣妾在家也见过这样的摆设。可这回进的是宫，拿不准的地方，还是问明白才痛快。'],
    studious:['她熟悉席间礼数，目光却停在器物的纹样上，想知道这里与家中所用有何不同。','这些物件并不陌生，宫中的规矩却另有来由。臣妾想学明白，不只记个样子。'],
    solitary:['她依次行礼，举止不显怯意，也不急着加入旁人的攀谈。','用度够便好。臣妾会学宫里的礼数，闲时却仍想安静待着，不必为了相熟勉强自己。']
  },
  limited:{
    gentle:['她等旁人放稳茶盏才轻轻落杯，又暗记起身与让座的次序，生怕一点迟疑被看出来。','臣妾先看别人怎样做，再悄悄学一遍。月例也想留些余地，衣饰若还能用，便不急着换。'],
    proud:['她将旧袖口抚得平整，坐姿比旁人还直；遇到不懂的礼节，宁肯记下，回去再问。','臣妾手头不宽裕，却不想叫人只记得这一点。不懂的会学，自己的体面，也想自己撑住。'],
    measured:['她一边听人说话，一边记住奉茶的先后，又将几项零用开支默默算了一遍。','请安有次序，花用也得有安排。臣妾先看明白，再开口，不想因着慌张把事情做错。'],
    bright:['她本想立即接话，看见旁人先等引礼的人开口，便笑着收住，又悄悄学了一遍。','臣妾方才差点抢了话，已经记住了！只是添衣、送礼样样要算，暂且拿自己的手艺凑些心意罢。'],
    studious:['她记下席间的站位，回屋后对着镜子试了一遍，连一句称呼也想弄明白。','臣妾先照着学，又想知道为何这样做。手头虽紧，能问明白的规矩，总不该只怕它。'],
    solitary:['她在人声稍静时观察礼序，回到屋中独自练过，既不求结伴，也没有轻慢旁人。','臣妾不熟悉这里的礼数，会慢慢学。用度想省些，清静却不是因为瞧不起谁。']
  }
};
function familyBearingVoice(c){
  const ctx=familyBearingContext(c),{roots,stage,constrained}=ctx,style=familyBearingStyle(c);
  let stageText,text;
  if(c.rescue){
    stageText='她先听明白陌生的称呼，再照自己的步子行礼，没有勉强掩去口音。';
    text=ctx.helped?'安置的银钱臣妾收好了，眼下能自己安排一些小事。还有不明白的礼数，想请人慢慢解释。':'这里的吃穿已有安排，臣妾仍想留一点能自己支配的钱。不是每样新鲜东西都想要，只盼遇事能自己作一点主。';
  }else if(stage==='new'&&constrained){
    [stageText,text]=BEARING_NEW.limited[style];
    if(roots.group==='scholar')text+='书中的道理熟些，席间的进退却是另一门学问。';
  }else if(stage==='new'&&roots.means==='ample'){
    [stageText,text]=BEARING_NEW.ample[style];
    if(roots.group==='merchant'){stageText='她看料子与问价都很内行，遇到宫中礼序却留心听完，并不拿银钱多少衡量席次。';text='家中用度宽裕，臣妾辨得出好料子，却还不熟宫中的进退。银钱能置办东西，不能替人学会这里的分寸。';}
    if(roots.group==='foreign'){stageText='她自有熟习的仪态，听译者解释本朝礼节时，才留心调整手势。';text='臣妾在故乡也有自己的礼数。这里不同的地方，愿意慢慢学，不想因举止不同便被当作失礼。';}
  }else if(stage==='new'){
    stageText=style==='bright'?'她不懂便问，问过仍把礼序记在心里，笑意没有因拘束全收起来。':'她先看清座次再落座，熟悉的礼数做得稳，陌生之处仍认真请教。';
    text='家中有家中的日子，宫里又是另一套规矩。臣妾先学着安顿，不必事事同别人一样。';
  }else{
    stageText=style==='solitary'?'她行礼已很熟练，坐下后仍习惯留一点安静。':style==='proud'?'她放稳茶盏，话说得比初来时更有底气，却仍将衣缘理得整齐。':stage==='learning'?'她认得了常走的路，落座时终于不必先看旁人的手势。':'她从容招呼宫人收好茶具，不再为寻常进退反复斟酌。';
    if(constrained)text=style==='proud'?'臣妾如今认得规矩，仍须细算零用。手头紧些，也不用把每一句话都说得低人一等。':'如今礼数已经熟了。零用仍得算着花，不过喜欢什么、不愿凑什么热闹，臣妾也渐渐敢说了。';
    else if(['limited','modest'].includes(roots.means))text=ctx.helped?'安置银让臣妾缓过这一阵，终于不用每添一件小物都犹豫。旧物仍会珍惜，也不是再没有自己的喜好了。':'如今用度比初来时从容，旧日节俭的习惯却还在。臣妾不必再处处看别人怎样做，也想把日子过成自己的样子。';
    else text=style==='proud'?'家门给过臣妾底气，可在宫里怎样立足，仍要自己拿主意。如今更想让人记得臣妾本人。':style==='solitary'?'从前的家教仍记着，如今也知道哪些规矩该守，哪些热闹可以不凑。臣妾这样独处，心里很自在。':'旧日的习惯有些留着，有些也慢慢改了。家门是一部分，往后的日子，臣妾也想有自己的主意。';
  }
  if(stage==='new'&&ctx.helped&&!c.rescue)text='安置银已收妥，眼下的零用宽松了些。陌生的礼数仍须慢慢学，臣妾想先把自己的日子安顿好。';
  if(c.trait==='体弱')stageText+='她坐了一会儿便歇下，免得学礼耗了精神。';
  return {key:'family-bearing',stage:stageText,lines:[text]};
}
function familyBearingAvailable(c){
  return familyBearingActive()&&inPalace(c)&&!c.maid&&!c.rescuedGuest&&c.hp>=40&&!maternalUnsettled(c)&&!lifeBoundary(c)&&!continuityConcern(c)&&!NEGX.includes(xinOf(c));
}
function recordFamilyBearing(c,text){
  story(c,'【宫中立足】'+text);
  NPCMemory.record(S,{type:'family-bearing',time:S.turn,participants:[c.id],outcome:text},[{person:c.id,subject:'self',interpretation:text,emotion:.25,impact:40}]);
}
const bearingAddConsort=addConsort;
addConsort=function(c,...args){
  if(familyBearingActive()&&!c.upbringing)c.upbringing={...familyUpbringing(c)};
  return bearingAddConsort(c,...args);
};
const bearingSelectionSpeech=selectionSpeech;
selectionSpeech=function(c){
  const speech=bearingSelectionSpeech(c);
  if(!familyBearingActive()||travelerSelectionBlurt(c))return speech;
  const v=familyBearingVoice({...c,enteredAt:S.turn});
  speech.stage=v.stage+(selectionOldFriendHint(c)?'\n'+selectionOldFriendHint(c):'');speech.line=v.lines[0].replaceAll('臣妾','臣女');return speech;
};
const bearingReaction=newcomerReaction;
newcomerReaction=function(c){
  const reaction=bearingReaction(c);if(!familyBearingActive())return reaction;
  const v=familyBearingVoice(c);return `${reaction}\n${v.stage}`;
};
const bearingWelcome=newcomerWelcomeEvent;
newcomerWelcomeEvent=function(c){
  const ev=bearingWelcome(c);if(!ev||!familyBearingActive())return ev;
  const v=familyBearingVoice(c),gen=S.gen,oldValid=ev.valid;
  ev.valid=()=>S.gen===gen&&byId(c.id)===c&&oldValid();
  ev.text=`${fullName(c)}入宫不久，住在${c.palace}。\n${v.stage}\n“${v.lines[0]}”`;
  if(isSolitary(c))ev.text+='\n她又道：“并非与谁不睦，只是不惯时时结伴。”';
  else if(['bold','careful'].includes(c.entryAdjustment.manner)){
    const favored=harem().filter(o=>o!==c&&o.favor>=40).sort((a,b)=>b.favor-a.favor||a.id-b.id)[0];
    ev.text+='\n她也问起各宫近况。'+(favored?`宫人答说，近来${cName(favored)}常蒙召见。`:'宫人只说，各宫各有起居，不好妄议圣意。');
  }
  ev.choices=ev.choices.map((choice,i)=>({...choice,f:()=>{
    if(!ev.valid())return null;const result=choice.f();if(result==null)return null;
    const feeling=i===1?'掌事姑姑将礼序与份例逐项讲明，她才知道哪些该依例领用，哪些零用可以自己安排。':i===0?familyBearingStyle(c)==='proud'?'她仍挺直脊背，却把攥紧的衣缘松开了些，不必靠处处强撑才留得体面。':'她终于敢把不懂的事情问出口，学着观察，也不再把每次迟疑都当成过错。':'她记下这句话，往后依礼行事，也想留住自己原来的喜好。';
    recordFamilyBearing(c,feeling);save('auto');return result+'\n'+feeling;
  }}));
  if(familyBearingContext(c).constrained)ev.choices.push({t:'另赐安置银 · 国库−1',cond:()=>E().treasury>=1,why:'国库不足',f:()=>{
    if(!ev.valid()||E().treasury<1)return null;
    c.entryAdjustment.settled=true;c.entryAdjustment.answer='allowance';c.entryAdjustment.answeredAt=S.turn;
    c.familyBearing={...c.familyBearing,helpUntil:S.turn+6};chg({treasury:-1});cchg(c,{mood:6,aff:3});
    const line=familyBearingStyle(c)==='proud'?'她郑重谢恩，没有将窘迫说成撒娇：“这份照应，臣妾会记得，也会把用度安排好。”':familyBearingStyle(c)==='solitary'?'她谢过安置银，仍想独自理清用度。被体谅让她安心，却不意味着从此爱上热闹。':'她将安置银与原有份例分开收好，终于敢为自己留一件喜欢的小物，心里安稳了些。';
    recordFamilyBearing(c,'陛下另赐安置银，缓解了这半年的零用顾虑。'+line);save('auto');return line+'\n§国库−1';
  }});
  return ev;
};
const bearingMood=chatMoodVoice;
chatMoodVoice=function(c){
  if(familyBearingAvailable(c)&&xinOf(c)==='平和'&&familyBearingContext(c).stage==='new'){
    const v=familyBearingVoice(c);return {key:v.key,stage:v.stage,text:v.lines[0]};
  }
  return bearingMood(c);
};
const bearingTopics=consortChatTopics;
consortChatTopics=function(c){
  const topics=bearingTopics(c);
  if(familyBearingAvailable(c))topics.push({id:'family-bearing',make:()=>{
    const old=c.originLife?.latest,v=familyBearingVoice(c);
    return old&&S.turn-old.turn<=6?{key:v.key,stage:'她说起前些日子记下的那件小事。',text:old.text,narrative:true}:{key:v.key,stage:v.stage,text:v.lines[0]};
  }});return topics;
};
const bearingPalaceWelcome=palaceWelcome;
palaceWelcome=function(c){
  const welcome=bearingPalaceWelcome(c);
  if(familyBearingAvailable(c)&&c.preg<2&&['trait','years-first','years-settling'].includes(welcome.key))welcome.stage=familyBearingVoice(c).stage;
  return welcome;
};
const bearingView=viewConsort;
viewConsort=function(){
  const html=bearingView(),c=byId(UI.sel);if(!c||!familyBearingAvailable(c))return html;
  const v=familyBearingVoice(c);return html+detailSection('举止与心事',`<p>${esc(v.stage)}</p>`);
};
function originVignettes(c){
  const base=ORIGIN_VIGNETTES[originGroup(c)];
  return familyBearingActive()?[...base,['席间分寸',''],['用度与心意',''],['学来的礼与自己的心',''],['旧日习惯','']]:base;
}
function bearingVignette(c,p,index){
  const consort=S.consorts.includes(p),ctx=familyBearingContext(c),style=familyBearingStyle(p),roots=familyUpbringing(c);
  if(consort){
    const v=familyBearingVoice(p);
    return [v.stage,ctx.constrained?'她把本月零用逐笔记好，先留出必要的花用，再考虑人情往来。宫中衣食有份例，她犯难的是额外添置与随礼的余地。':ctx.helped?'她把安置银记在小册里，先置办合用之物，余下的留着，不因一时宽裕便处处与人攀比。':roots.means==='ample'?'挑衣料时，她先问纹样是否合礼，未急着看价钱。熟悉好东西，让她更在意自己是否真心喜欢。':'她将日常花用安排妥当，给自己的喜好留了一点余地。用度渐渐宽松，也没有忘记惜物。',ctx.stage==='new'?'她在请安后回屋，将刚记住的礼序慢慢练过。只学别人做什么还不够，她也想弄懂其中的分寸。':'今日请安，她自然地接话、起身，事后才想起自己从前会为这些细节反复踌躇。熟悉宫中生活，并没有叫她丢掉原来的性情。',roots.means==='ample'?'收拾旧物时，她发现最想留下的并非最贵重的一件。家门给过许多选择，喜欢什么却得自己回答。':'她将一件仍合用的旧物收好，也认真挑了自己喜欢的新颜色。节俭是一种习惯，不必连喜好都一并藏起来。'][index-4];
  }
  const tight=['limited','modest'].includes(roots.means);
  return [style==='bright'?'在家中待客时主动招呼来人，遇到不熟的礼节便问明白，没有因一句提醒便收起笑意。':'在家中待客时先观察席次，记下与自己往日习惯不同的礼节，再从容应对。',tight?'挑选送人的小物时，先算了手头零用，最后选了亲手做的一件，既认真也不勉强花销。':'挑选送人的小物时，先想对方的喜好，并不觉得价钱越高便越能表明心意。','把新学的礼节记下来，也想清楚哪些只是旁人的习惯，不必连自己的喜好都照着改。',tight?'将旧物仔细收好，又为自己选了一点喜欢的颜色；日子需要打算，也可以有小小的欢喜。':'重新理过旧衣与书匣，留下一件常用的旧物；熟悉精致的用度，也仍有自己的眷恋。'][index-4];
}
