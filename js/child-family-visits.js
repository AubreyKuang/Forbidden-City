/* Keep pending scenes from older releases replayable until they are finished. */
function familyScenesEnabled(){return typeof PalaceActions==='undefined'||PalaceActions.contentVersion>=5;}
function childVisitCompany(k){
 const primary=byId(k.foster||k.mom),birth=byId(k.mom),people=[];
 if(familyVisitAllowed(k,primary)&&chance(.78))people.push(primary);
 if(birth!==primary&&familyVisitAllowed(k,birth)&&S.turn-(k.lastQuietVisit??-99)>=6&&chance(.38))people.push(birth);
 const former=Object.keys(k.careVisitors||{}).map(id=>byId(+id)).filter(m=>k.careVisitors[m?.id]?.role==='原养母'&&careVisitorAllowed(k,m)&&childTrust(k,m)>=40&&!people.includes(m));
 if(former.length&&chance(.3))people.push(pick(former));
 return people;
}
function childVisitResponse(k,m){
 const age=kidAge(k),trust=childTrust(k,m),address=childCareAddress(k,m);
 if(age<3)return trust>=45?'孩子听见她熟悉的声音，慢慢松开了攥着的小手。':'孩子尚小，她没有贸然抱起，只在乳母身侧轻声哄着。';
 if(trust<40)return `孩子先望了望身旁的乳母，${age<6?'小声应了一句':'慢慢答了几句'}，还没有立刻亲近起来。`;
 const disposition=childDisposition(k);
 if(['内敛','审慎'].includes(disposition))return `孩子往${address}身侧挪了挪，把原先没说完的话低声补给你听。`;
 if(disposition==='仁厚')return `孩子先给${address}留好身边的位置，又招呼你一起坐。`;
 if(['好胜','自矜'].includes(disposition))return `孩子想让你和${address}都看看自己最近学会的本领，却又有些怕出错。`;
 return `孩子把${address}也拉进话里，盼你们一起听完今天的小事。`;
}
function childVisitMotherVoice(m,k){
 const style=parentEpisodeStyle(m),young=kidAge(k)<3;
 return ({quiet:'她在旁人面前仍淡淡的，低头替孩子理好衣角时，声音却轻得与你平日听见的不同。',
  proud:young?'她细看孩子的襁褓，生怕哪一处硌着，又让乳母照平常的办法来。':'她先想替孩子解释，话到嘴边又停下，让孩子把自己的意思说完。',
  study:young?'她哼起一段短短的旧调，念到熟悉处便放慢下来。':'她提起孩子近来喜欢的一页书，也说起一道尚未想通的问题，没有只挑好处报给你听。',
  frail:'她坐在一旁慢慢说话，虽容易疲倦，目光仍随孩子转着；你让随侍把软垫垫好。',
  brave:young?'她平日爽利，此时伸手探孩子的额头，动作却格外轻。':'她笑着说孩子昨日也曾失手，今日肯再试便好，不必一见父皇就样样争先。',
  reserved:'她不惯在人前说软话，只把孩子近来的起居一件件记得清楚。',
  gentle:young?'她请乳母试过被褥的冷暖，才放心把帐边的风挡好。':'她本想替孩子答话，见孩子愿意自己说，便含笑把话头留了下来。'})[style];
}
function visitChildTogether(k){
 const mothers=childVisitCompany(k),birth=byId(k.mom),foster=fosterOf(k),quiet=!!foster&&mothers.includes(birth);
 const serial=k.visitSerial=(k.visitSerial||0)+1,thread=`child-visit:${S.gen}:${k.id}:${serial}`,age=kidAge(k);
 const voice=characterVoice(k,'talk'),st=pick(['lit','mar','vir']);
 k.love=clamp(k.love+10);k[st]=clamp(k[st]+2);rememberConversation(k,voice,'宫中');setScene('harem');
 let scene=`你来探望${k.name}。`;
 if(mothers.includes(foster))scene+=`养母${fullName(foster)}正好在旁，向你说起孩子今日的起居。`;
 if(quiet)scene+=`生母${fullName(birth)}也悄悄来看孩子，怕惊动旁人，只带了一件亲手收拾的小物。${k.visitRule==='open'?'这是依照先前准许的探视安排。':'这回尚无禁探之令，她仍先请乳母通报，并未擅改抚养安排。'}`;
 else if(mothers.includes(birth))scene+=`生母${fullName(birth)}正陪在孩子身边，见你来了便挪出一处位置。`;
 for(const m of mothers.filter(m=>m!==birth&&m!==foster))scene+=`原养母${fullName(m)}也依约来看${k.name}，仍记得从前照料时的小习惯；她此来只是探望，并非把孩子接走。`;
 if(!mothers.length)scene+=`乳母与随侍在旁照应，你留了一段只陪孩子的时辰。`;
 if(mothers.includes(birth)&&mothers.includes(foster))scene+=relGet(birth,foster)<0||isRival(birth,foster)?'两人说话仍有分寸上的戒备，你没有让孩子替大人选择亲疏。':isSolitary(birth)||isSolitary(foster)?'两人各自守礼，没有因同在一处就变得亲密。':'两人把孩子的作息对过一遍，仍保留各自照料的位置。';
 const response=mothers.length?childVisitResponse(k,mothers[0]):voice.stage+(age>=3&&voice.text?`“${voice.text}”`:'');
 const valid=()=>!k.pendingName&&childInPalace(k)&&mothers.every(m=>familyVisitAllowed(k,m)||careVisitorAllowed(k,m));
 let resolved=false;
 const finish=mode=>{
  if(resolved||!valid())return null;resolved=true;
  const shared=mode!=='brief',activity=age<3?'轻声哄睡':age<6?'一起看小画册':age<16?'听孩子说近来的心事':'听孩子说自己的打算';
  const outcome=mode==='care'?`你问起${k.name}近来的${age<3?'饮食与睡眠':'起居与心绪'}，让在旁的母亲把实际难处说清，也留意孩子的反应。`:
   mode==='brief'?`你陪${k.name}坐了一会儿，临走叮嘱随侍照常照料，没有另改抚养与探视安排。`:`你与${mothers.length?mothers.map(fullName).join('、'):'随侍'}留下来${activity}。${response}`;
  const childThought=age<3?'在熟悉的照料下渐渐安稳。':shared?(mothers.some(m=>childTrust(k,m)<40)?'还需要慢慢熟悉，父皇没有催我马上亲近。':'父皇肯留下来听，也没有要我在亲人中选一个。'):'这次见面的时辰虽短，也留了下来。';
  const thoughts=[childThought,...mothers.map(m=>mode==='brief'?'这回见到了孩子，尚有些话留待以后。':isSolitary(m)?'对旁人不必多言，对孩子却总有舍不得收回的温柔。':m===birth&&foster?'能见到孩子已属难得，不愿把大人的难处压在孩子身上。':m!==birth&&m!==foster?'换了抚养安排，也盼有人记得我从前的照料与如今的牵挂。':'日日照料的琐碎，今天终于有人肯认真听一听。')];
  livedRecord([k,...mothers],'family','父皇来探望',thread,outcome,thoughts);
  if(shared)for(const m of mothers)recordFamilyTime(k,m,activity,childThought,thoughts[mothers.indexOf(m)+1],{gain:3});
  return outcome+(shared&&mothers.length?'\n'+mothers.map(m=>`${fullName(m)}：${childVisitMotherVoice(m,k)}`).join('\n'):'');
 };
 pushEv({title:mothers.length?'探望皇嗣 · 母亲在旁':'探望皇嗣',por:k,cast:mothers,present:[k,...mothers],valid,
  text:scene+'\n'+response+fx(`父爱+10　${({lit:'才学',mar:'武艺',vir:'品德'})[st]}+2`),
  onShow:()=>{if(quiet)k.lastQuietVisit=S.turn;livedRecord([k,...mothers],'family','探望时相逢',thread,scene);},
  choices:[{t:age<3?'一起轻声哄哄孩子':'留下来，一起陪陪孩子',f:()=>finish('together')},...(mothers.length?[{t:'问问照料孩子的近况',f:()=>finish('care')}]:[]),{t:'陪坐片刻，照原来的安排起居',f:()=>finish('brief')}]});
 save('auto');
}
function preserveFormerCare(k,old,next){
 if(!familyScenesEnabled()||!old||old===next)return;
 const from=k.fosterT??S.turn,trust=childTrust(k,old),months=Math.max(0,S.turn-from);
 (k.motherBonds||={})[old.id]||={trust};
 (k.careHistory||=[]).push({mother:old.id,name:fullName(old),from,until:S.turn,months,trust,next:next?.id||null});
 (k.careVisitors||={})[old.id]={...(k.careVisitors?.[old.id]||{}),role:'原养母',since:S.turn,months,trust,last:S.turn};
 if(next&&k.careVisitors[next.id])delete k.careVisitors[next.id];
 const text=`${k.name}由原养母${fullName(old)}改交${next?fullName(next):'乳母'}照料。${months?`曾共同生活${months}个月，`:'此前短暂相处的经历，'}原有亲近与照料记忆仍然保留，依规可继续探望，抚养身份与探望分开记载。`;
 const cast=[k,old,next].filter(p=>p&&p.alive!==false);
 livedRecord(cast,'family','抚养更迭，旧情仍在',`care:${S.gen}:${k.id}:${old.id}`,text,cast.map(p=>p===k?kidAge(k)<3?'熟悉的声音与照料仍留在日常中。':trust>=45?'住处变了，我还记得她怎样照顾过我。':'又要熟悉新的起居，盼大人不要催我马上亲近。':p===old?isSolitary(old)?'旁人见我淡淡的，不知道孩子离开后，那一处安静空了多少。':'知道往后不再日日相伴，还是忍不住惦记孩子。':'我会照料眼前的日子，也不能把孩子从前的情分当作不存在。'));
}
function formerCareVisit(k,c){
 const v=k.careVisitors?.[c.id];if(v?.role!=='原养母'||!careVisitorAllowed(k,c))return null;
 const caregiver=byId(k.foster||k.mom),cast=[k,c,...(inPalace(caregiver)?[caregiver]:[])];
 const small=kidAge(k)<3,close=childTrust(k,c)>=45;
 const text=`原养母${fullName(c)}依规来看${k.name}。${small?'她在乳母旁轻哼以前的曲调，没有贸然把孩子抱走。':close?'孩子认出熟悉的来人，说起从前相伴的小事；她也认真听了如今的日子。':'孩子还需要时间熟悉，她没有要求亲昵，只陪坐了一会儿。'}${inPalace(caregiver)?`如今照料孩子的${fullName(caregiver)}也在旁，起居仍依现有安排。`:'随侍仍按原有安排照护。'}`;
 v.last=S.turn;v.text=text;
 livedRecord(cast,'family','原养母来探望',`care:${S.gen}:${k.id}:${c.id}`,text,cast.map(p=>p===k?small?'在熟悉的声音里渐渐放松。':close?'不再住在一处，也没有被她忘记。':'还不很亲近，但没有人逼我立刻改口。':p===c?isSolitary(c)?'对旁人的话仍少，对孩子的近况却一句也舍不得漏听。':'见到孩子平安，分别的牵挂才稍稍落定。':'孩子有旧日情分，不必用断绝来证明眼前的抚养。'));
 recordFamilyTime(k,c,'原养母探望',small?'听见曾照料自己的熟悉声音。':close?'旧日的养母仍记着自己。':'在不被催促的相处中慢慢熟悉。','看见曾照料的孩子，仍有牵挂。',{gain:3});return text;
}
function formerCareTick(){
 if(!familyScenesEnabled())return;
 for(const k of kidsAlive()){
  const options=Object.keys(k.careVisitors||{}).map(id=>byId(+id)).filter(c=>c&&k.careVisitors[c.id].role==='原养母'&&careVisitorAllowed(k,c)&&S.turn-(k.careVisitors[c.id].last??k.careVisitors[c.id].since)>=3&&childTrust(k,c)>=45);
  if(options.length){const c=options.sort((a,b)=>(k.careVisitors[a.id].last??0)-(k.careVisitors[b.id].last??0))[0];if(chance(.35))formerCareVisit(k,c);}
 }
}
A.formerCareRule=function(childId,motherId){
 const k=kidById(childId),m=byId(motherId),v=k?.careVisitors?.[motherId];if(modalOpen||!childInPalace(k)||v?.role!=='原养母'||!m?.alive)return;
 v.blocked=!v.blocked;livedRecord([k,m],'family','原养母探视安排',`care:${S.gen}:${k.id}:${m.id}`,`陛下${v.blocked?'暂停':'恢复'}原养母${fullName(m)}对${k.name}的探视。以前的照料经历与亲近仍保留，现有抚养没有改变。`);render();
};
