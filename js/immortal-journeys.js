/* Optional, fictional xianxia lives. Identity, absences and news survive succession. */
const IMMORTAL_SECTS={
 sword:{name:'华山问剑宗',place:'华山',master:'云岑',cell:0,title:'真人',line:'剑先学收，才学出鞘。皇家的孩子入山，也须自己走完石阶。'},
 cloud:{name:'云岫清微门',place:'云岫山',master:'照玄',cell:1,title:'道长',line:'有灵根，是能听见山川；肯听见旁人的难处，才算入了道。'}
};
const IMMORTAL_VOICES={
 好奇:'我想亲眼看看，书里写的云海与剑光究竟是什么模样。',
 好胜:'我想试出自己的本事，不愿每次赢了，都有人说是让着皇嗣。',
 仁厚:'若真能学到本领，我想在有人无路可走时，替他们多留一条路。',
 内敛:'宫中待我很好，可山里那样长的清静，我也想过一回。',
 爽直:'我想走出去。若见不平，总不能只说一句与我无关。',
 灵动:'我想看御剑掠过山头，也想知道山下的小镇早晨卖什么点心。',
 审慎:'住处、随行人和送信的路，我都问清了；真遇到不懂的事，会先求教。',
 自矜:'我愿从普通弟子做起。靠皇室名号借来的敬重，不算我的。'
};
function immortalEnabled(){return typeof PalaceActions==='undefined'||PalaceActions.contentVersion>=7;}
function immortalPalaceLessonsEnabled(){return journalContentVersion()>=52;}
function immortalAway(k){return !!(immortalEnabled()&&['learning','trial','sect'].includes(k?.immortal?.stage));}
function legacyImmortalBirthChance(k){return k.sex==='f'?.24:k.birthTraits?.mother?.rank===8?.015:.06;}
function rolledImmortalRoot(k,chance){
 const seed=String(k.seed||k.id),roll=mulberry32(voiceHash('immortal-root:'+seed))();
 return roll<chance?['木灵根','水灵根','金灵根','火灵根','土灵根','冰灵根','雷灵根'][voiceHash('root-kind:'+seed)%7]:null;
}
function immortalRoot(k){
 if(k.immortal?.root)return k.immortal.root;
 const saved=k.immortalTalent,balanced=PalaceActions.balancedImmortalDiscovery;
 if(saved!==undefined&&(!balanced||k.immortalTalentBalanced||saved!==rolledImmortalRoot(k,legacyImmortalBirthChance(k))))return saved;
 // An old, unrevealed result is evaluated under the same rule as a new birth.
 return rolledImmortalRoot(k,balanced ? .15 : legacyImmortalBirthChance(k));
}
function initImmortalTalent(k){
 if(!immortalEnabled()||k.immortal)return;
 const balanced=PalaceActions.balancedImmortalDiscovery;
 if(k.immortalTalent===undefined||balanced&&!k.immortalTalentBalanced){
  k.immortalTalent=immortalRoot(k);
  if(balanced)k.immortalTalentBalanced=true;
 }
}
function immortalPeople(){return royalHouseholds().filter(k=>k.immortal);}
function immortalPerson(id){return royalById(id);}
function immortalMaster(k){const d=IMMORTAL_SECTS[k.immortal.route];return {daoMaster:true,daoTitle:d.title,cell:d.cell,name:d.master,alive:true};}
function immortalLocal(k){return !!(k?.alive&&!k.pendingName&&!k.removedFromRoyal&&!k.jailed&&!k.away&&!k.templeStay&&k.princessMarriage!=='frontier'&&!royalJourneyAway(k)&&S.children.includes(k)&&!S.over);}
function immortalCanLeave(k){return immortalLocal(k)&&kidAge(k)>=16&&k.hp>=50&&!k.married&&!k.spouse&&S.heir!==k.id;}
function immortalMothers(k){
 const people=mothersOf(k).filter(c=>c.alive);
 for(const d of [S.flags.dowager,S.flags.birthDowager])if(d?.alive&&[k.mom,k.foster].includes(d.personId)&&d.portrait&&!people.some(c=>c.id===d.personId))people.push(d.portrait);
 return people;
}
function immortalMotherFeeling(c,k,kind){
 const role=c.id===k.mom?'亲生的孩子':'亲手照护的孩子';
 if(kind==='palace-study')return isSolitary(c)?`她听${k.name}讲完今日课业，默默替孩子理好书页。${role}仍在京中，来日还可以慢慢谈。`:
 ['骄纵','骄矜','善妒','城府'].includes(c.trait)?`她替${k.name}的进益高兴，也忍不住问仙师可曾夸奖。见${role}把课业记得认真，又叮嘱不必事事争先。`:
 `她听${k.name}说起在京修习的这件小事，既欣慰又怕${role}过于劳累，叮嘱学完也要按时用饭休息。`;
 if(kind==='departure')return isSolitary(c)?`她素来清冷，替${k.name}系紧披风时却久久不肯松手。${role}真要远行，她只低声嘱咐，想家就写信。`:
 ['骄纵','骄矜','善妒','城府'].includes(c.trait)?`她既舍不得${role}离开，也担心山门不会像宫中一样照拂。几封话说得强硬的信，末尾都添了“平安便好”。`:
 ['将门','爽直','持重'].includes(c.trait)?`她逐项问清行程，送走${role}后才发觉手心攥得生疼。口中说放心得下，夜里仍留了灯。`:
 `她反复检查${k.name}的行囊，想把熟悉的日子也装进去。知道${role}有自己的志向，仍忍不住落泪。`;
 if(kind==='return')return `她听到${k.name}平安归来的消息，先问有没有受伤，再想起问这些年的所得。山中的经历并未因此消失。`;
 if(kind==='news')return isSolitary(c)?`她听完${k.name}的消息，很久没说话，独自把旧衣领抚平，眼底却有难得的笑意。`:
 ['骄纵','骄矜','好客'].includes(c.trait)?`她忍不住向熟人说起${k.name}的近况，言语带着骄傲；回到房里，又惦记${role}几时能再有音信。`:
 `她记住${k.name}的每一句消息，既欣慰又想念。山门里的名望再高，在她心里仍是${role}。`;
 if(journalContentVersion()>=49){
  if(kind==='discovery')return `她问清${k.name}显出的灵根，又等孩子亲自讲完。听到新本事固然高兴，她也惦念往后若要拜师，孩子平日还有谁照应。`;
  if(kind==='petition')return `她记下${k.name}此次能不能远行的答复，打算等孩子安静下来，再陪他把心里未说完的话讲完。`;
 }
 return `她得知${k.name}的问道心愿，心里既惊讶又牵挂，盼自己还能参与孩子往后的日子。`;
}
function immortalRecord(k,title,text,kind='news'){
 const r=k.immortal,entry=`【${title}】${text}`;
 r.history.push({turn:S.turn,d:dateStr(),title,text});if(r.history.length>36)r.history.shift();
 kstory(k,entry);log(`${k.name}：${entry}`,1);
 const mothers=immortalMothers(k);
 for(const c of mothers){
  const feeling=immortalMotherFeeling(c,k,kind);story(c,entry+' '+feeling);
  if(S.consorts.includes(c)){
   cchg(c,{mood:kind==='departure'?-8:kind==='return'?10:3});reconcileMotherConcern(c);
   if(kind==='departure')setXin(c,'思念',`${k.name}入山学道`);
  }
  NPCMemory.record(S,{type:'immortal-kin',time:S.turn,location:immortalAway(k)?IMMORTAL_SECTS[r.route].place:'宫中',participants:[k.id,c.id],outcome:text},[
   {person:k.id,subject:c.id,interpretation:text,emotion:.4,impact:75},
   {person:c.id,subject:k.id,interpretation:feeling,emotion:kind==='departure'?-.5:.6,impact:80}]);
 }
}
function immortalMaternalDiscovery(k){
 const r=k.immortal;
 if(journalContentVersion()<49)return;
 if(immortalDiscoveryNewsActive()){shareImmortalDiscovery(k);return;}
 if(r.familyHeard)return;
 r.familyHeard=true;
 const m=byId(k.mom)||familyHostById(k.mom);
 if(!m)return;
 const h=houseOf(m),child=k.sex==='m'?'外孙':'外孙女',kind=k.sex==='m'?'外甥':'外甥女';
 const father=h?.father,brothers=h?brotherRoles(h).map(role=>officialPerson(h,role)).filter(officialAlive):[];
 if(officialAlive(father)){
  const feeling=m.fam.p<20?'他从未见过这样的事，只盼孩子能平安长成，也怕女儿独自揣着心事，写了几句寻常家话问她。':'他嘱咐家里把消息稳稳收着，先问清师承和孩子本人的心意，莫因一桩奇事就替外孙辈拿主意。';
  story(father,`【宫中灵根】听说${child}${k.name}被国师辨出${r.root}。${feeling}`);
 }
 for(const brother of brothers){
  const feeling=brother.temperament==='谨慎'||brother.temperament==='持正'?'他请人打听山门和送信的路，想着日后若真远行，至少该知道到哪儿报平安。':'他替孩子欢喜，又惦念姐妹听见这事时可有人陪着说话，打算给她寄一封家书。';
  story(brother,`【宫中灵根】听说姐妹的孩子、自己的${kind}${k.name}显出${r.root}。${feeling}`);
 }
}
function immortalTravelRefused(k){
 if(journalContentVersion()<49||k.sex!=='m'||k.immortal.travelAppeal)return;
 k.immortal.travelAppeal={due:S.turn+1};
}
function immortalTravelPetition(k){
 const r=k?.immortal,appeal=r?.travelAppeal;
 if(journalContentVersion()<49||k?.sex!=='m'||!appeal||appeal.resolved||S.turn<appeal.due||
    !immortalLocal(k)||!['invited','closed'].includes(r.stage)||mourningActive())return null;
 const mother=byId(k.mom),speaker=inPalace(mother)?mother:k,sect=IMMORTAL_SECTS[r.route];
 const valid=()=>!appeal.resolved&&k.immortal===r&&['invited','closed'].includes(r.stage)&&immortalLocal(k)&&
    !mourningActive()&&(speaker===k||inPalace(speaker));
 const finish=(title,text,change)=>{
  if(!valid())return null;
  appeal.resolved=true;change();immortalRecord(k,title,text,'petition');save('auto');return text;
 };
 return {title:'皇子远行 · 再请圣裁',por:speaker,cast:[k],present:speaker===k?[]:[speaker],valid,
  text:`上次${k.name}的山门远行未获允准。${speaker===k?`${k.name}亲自来求见，想请父皇再听一听他的打算。`:`${fullName(mother)}替${k.name}求见：“臣妾舍不得他远行，也想请陛下再听一听他的打算。”`}\n${k.name}道：“${IMMORTAL_VOICES[childDisposition(k)]}若父皇仍觉得不妥，我愿先留下，只请把我的心愿记着。”`,
  choices:[
   {t:`改主意，准赴${sect.place} · 国库−30`,cond:()=>valid()&&immortalCanLeave(k)&&E().treasury>=30,
    why:'须满十六岁、身体康健，无储位及家室牵绊，国库足三十万两',f:()=>{
     if(!immortalCanLeave(k)||E().treasury<30)return null;
     const text=finish('远行获准',`听过这回求情，陛下改了主意，准${k.name}随师启程。`,()=>{r.stage='invited';chg({treasury:-30});immortalDepart(k);});
     return immortalDepartureResult(k,text);
    }},
   {t:'仍不准远行，留在京中',f:()=>finish('仍留京中',`陛下听过求情，仍不准${k.name}离京。侍从撤下行装，他把未寄出的拜师帖收回书匣。`,()=>{r.stage='closed';})},
   {t:immortalPalaceLessonsEnabled()&&kidAge(k)<16?'先在京修习，成年后再议启程':'先留京修习，半年后再议',f:()=>finish('暂缓远行',immortalPalaceLessonsEnabled()?`${k.name}把想问仙师的话先抄在册中，继续在京修习。半年后听课业近况，${kidAge(k)<16?'满十六岁再谈启程':'往后仍可重议远行'}。`:`陛下准${k.name}继续在京修习，远行一事待半年后再议。他把想问仙师的话先抄在册中。`,()=>{r.stage='invited';if(immortalPalaceLessonsEnabled())immortalPalaceStay(k);else r.due=S.turn+6;})}
  ]};
}
function immortalDiscover(k){
 if(!immortalEnabled()||!immortalLocal(k)||kidAge(k)<12||k.immortal||!immortalRoot(k)||daoInterest(k)<=0)return false;
 reconcileImmortalDiscovery();
 if(immortalDiscoveryNewsActive()&&S.immortalDiscovery)return false;
 initImmortalTalent(k);
 k.immortal={root:k.immortalTalent,route:k.mar>k.lit||['好胜','爽直'].includes(childDisposition(k))?'sword':'cloud',stage:'noticed',since:S.turn,due:S.turn,history:[],merit:0,rank:0,lastLetter:-99};
 if(immortalDiscoveryNewsActive())S.immortalDiscovery={id:k.id,gen:S.gen,turn:S.turn};
 immortalRecord(k,'灵根初显',`钦安殿试拂玉磬时，${k.name}指下亮起一线清光，竟与殿外松风相应。国师辨为${k.immortal.root}，记入问道册；仍须慢慢学习，未曾许诺长生。`,'discovery');immortalMaternalDiscovery(k);return true;
}
function immortalDepart(k){
 if(!immortalCanLeave(k)||!['noticed','invited'].includes(k.immortal?.stage))return false;
 const r=k.immortal,d=IMMORTAL_SECTS[r.route];r.stage='learning';r.departed=S.turn;r.due=S.turn+12;r.rank=0;
 delete k.initiative;k.tutor=false;
 immortalRecord(k,'辞阙入山',`${k.name}拜${d.master}${d.title}为师，随行前往${d.place}的${d.name}。皇家随侍护送至山门，往后依门规学艺，送信的驿路已经约定。${IMMORTAL_VOICES[childDisposition(k)]}`,'departure');return true;
}
function immortalDepartureResult(k,text){
 return text&&k.immortal.route==='sword'&&k.immortal.stage==='learning'
  ?{title:'辞阙入山 · 华山',illustration:'huashan-stone-steps',text}:text;
}
function immortalReturn(k){
 if(!k?.alive||!immortalAway(k)||k.jailed||k.removedFromRoyal)return false;
 k.immortal.stage='returned';k.immortal.returned=S.turn;k.immortal.returnPlace=S.children.includes(k)?null:'京中宗亲居所';
 immortalRecord(k,'归来仍有青山',`${k.name}结束山中常住，回到${childWhereabouts(k)}，保留师承、灵根与这些年的经历。`,'return');return true;
}
function immortalRank(k,merit=k.immortal.merit){
 const years=(S.turn-k.immortal.departed)/12;
 return years>=15&&merit>=8?3:years>=8&&merit>=4?2:years>=5&&merit>=2?1:0;
}
function immortalRankName(k,rank=k.immortal.rank){return ['门中弟子','首席弟子',['自矜','好胜','灵动'].includes(childDisposition(k))?'少主':'护山长老','宗主'][rank||0];}
function immortalNews(k){
 const r=k.immortal,d=IMMORTAL_SECTS[r.route],trait=childDisposition(k);
 if(E().health<55)return {topic:'山中问安',text:`${d.name}遣弟子送来一封问安书。${k.name}听说${S.children.includes(k)?'父皇':'陛下'}龙体欠安，只劝按时静养，不拿未经查验的丹药献入宫中。`,benefit:'health'};
 if(E().people<45)return {topic:'山门济民',text:`地方奏报提到${d.name}开仓煮粥、接济流民。有人认出主持事务的${k.name}曾在宫中长大，却始终称这份帮助是乡人的活路，未借机争名。`,benefit:'people'};
 const variants={
  仁厚:['渡口救人',`${k.name}带同门救起渡口落水的人，又陪着寻回失散的家人。`, 'people'],
  爽直:['护送商旅',`${k.name}在山下制止劫掠，护送商队走过险路；商人入京后将这段经历禀明。`,'people'],
  好胜:['论剑留手',`${k.name}在论剑会上胜出，却收剑让负伤的对手先下台治伤，门中因此更信服。`,'prestige'],
  好奇:['山川新图',`${k.name}访山川、核旧图，把可供乡人避险的路标誊清，托游方道人送来副本。`,'wen'],
  内敛:['无名护送',`送信人被山雨困住，${k.name}默默护送其过岭，直到入京的家书上才留下名字。`,'prestige'],
  灵动:['山下灯会',`${k.name}带弟子为山下孩子修好花灯，灯会上也有人问起京城如今的模样。`,'people'],
  审慎:['修栈留路',`${k.name}查清山道险处，请匠人补牢栈桥，连运粮与送信的路线也一并标明。`,'people'],
  自矜:['以名担责',`${k.name}不肯借皇室身份求让步，却愿以自己的道名担保，让受冤的行旅得到查问。`,'prestige']
 };
 const v=variants[trait];return {topic:v[0],text:`${d.name}的消息由${r.merit%2?'行商':'游方道人'}带回。${v[1]}`,benefit:v[2]};
}
// Palace lessons continue the promise to wait; they never repeat the introduction.
const IMMORTAL_PALACE_LESSONS=[
 {title:'一招一息',sword:'仙师托国师带来新的剑谱批注。孩子练了许久起手式，今日终于能稳稳收住木剑，偏偏下一式又乱了脚步。',cloud:'仙师托国师带来新的课业批注。孩子在钦安殿听风辨息，终于听出两声玉磬的不同，静下来时却又抓不住那一线清音。',
  voices:['为什么越想抓住它，反而越听不清、看不准？','前一回还做不好，今日总算有一点进步。下一回我还想再试。','我学会这一点后，也想讲给还不明白的人听。','我想再试一遍，等心定下来再给父皇看。','哪里错了，就请指出来。我照着改。','原来开头这么难！可刚才那一下，我真的做到了。','我把做对和做错的几次都记下来了，想找出差别。','请照普通弟子的规矩教我，不必只挑好听的说。'],
  choices:[['陪看课业，请国师点出诀窍','skill','父皇陪着核对课业，国师把最容易错的一处重新示范。'],['不急着求成，把根基练稳','vir','父皇没有催着显本领，约定先练熟基本功，再添新课。']]},
 {title:'书页疑处',sword:'仙师寄来的剑论说“胜人之前先胜己”。孩子在旁边写了几行小字，想知道退让与怯懦究竟怎样分辨。',cloud:'仙师寄来的札记谈“盈虚有数”。孩子在空白处圈出一段，疑惑若事事有数，读书与助人又为了什么。',
  voices:['一句话换个地方想，好像就不一样了。能容我再多问一句吗？','若先认定做不到，那还怎样向前？我想把这处问明白。','若有人正等着帮忙，总不能拿一句道理便走开吧？','我在这页停了好几日。今日想把没想通的地方说出来。','话说得好听也须做得到，我想听一个实在的例子。','我写了三个反问，先生看完竟笑了，说问得还算有趣。','先分清书里说的情形，再下判断，或许才不容易错。','我敬重先生，可不懂的地方也不愿装作懂了。'],
  choices:[['一起辨明，把疑问写信请教','lit','父皇听完疑问，与孩子写下一封请教师长的信，未把不解当作不敬。'],['以宫中见闻讲清道理','vir','父皇从日常待人讲起，让孩子记住书上的道理还须在事情里体会。']]},
 {title:'迟迟无进',sword:'这半年的木剑练习遇上了瓶颈，同一式总在转身时失准。国师收起计数的木签，让孩子先讲哪里最难。',cloud:'这半年的听息功课迟迟没有新进展。国师没有添课，只把旧札记摊开，让孩子自己说一说困在何处。',
  voices:['从前有用的办法，为什么这回不灵了？我想换个角度试试。','我知道不能逞强，可停在这里，心里实在不甘。','旁人也会有这样的时候吧？若日后有人卡住，我想陪他慢慢练。','我没敢说，只怕让父皇觉得那些日子都白费了。','做不好就是做不好。我不想拿借口搪塞。','我一着急就乱，连平常会的也忘了，真想把这团心事解开。','我把起居与练习都对过，想先找出最该改的一处。','我不愿让先生看轻，也知道硬撑并不体面。'],
  choices:[['拆开难处，循序练习','skill','父皇与国师把难处拆成小节，孩子记下先练哪一节，不再只盯着成败。'],['告诉孩子：一时无进并非白费','love','父皇听完挫败，没有拿旁人作比较。孩子愿意把下回的难处也说出来。']]},
 {title:'收手有度',sword:'国师安排侍卫在宫内陪练，只用包布木剑。孩子占了上风，对方却一脚踩偏；国师当即叫停，问这一招该怎样收。',cloud:'钦安殿里，一名小内侍端水时打翻了课业墨碟。国师先叫人收拾滑地，再问孩子：方才心乱时，该先顾哪一件事。',
  voices:['先看清别人怎么了，再想自己的功课，对吗？','我原想把这一回做好，可不能让人因此受伤。','先问问他有没有事，课业晚些再补也来得及。','我方才没说出口，其实一直担心他。','人要紧，余下的事稍后再说。','方才心里一跳，原来学会停下来也算本事。','先稳住场面、确认无人受伤，再问缘故才妥当。','若仗着身份让人不敢喊停，那不算自己的本领。'],
  choices:[['先照应身边的人','vir','父皇赞许先顾人的分寸，孩子把这次收手记入课业册。'],['请国师教会及时收势','skill','国师重新演示如何中止一招、平复心息，孩子没有拿旁人的安危换一时输赢。']]},
 {title:'旧物新用',sword:'练习木剑的护手松了。孩子想亲手修好，国师请宫中匠人带来工具，先教辨木纹，再教如何用力。',cloud:'案上的旧风铃断了系绳。孩子舍不得丢，国师请宫中匠人教换绳、调铃，听它为何不再发出原来的声响。',
  voices:['原来小小一件东西，也藏着这么多道理。','我想自己做好一次，做坏了也肯重新来。','修好便不必让别人再赶做新的了。','用了这些日子，总有些舍不得换掉。','请师傅教我，从头做也无妨。','修好以后，我想留着它，看看能陪我用多少年。','我先把松动的地方查清，再动手。','手艺上我是初学，理当认真向师傅请教。'],
  choices:[['让匠人慢慢教，亲手修妥','skill','孩子向匠人请教，亲手修好了旧物，记下其中的诀窍。'],['问问做这件东西的人','vir','父皇陪孩子听匠人讲用料与工时，孩子把做事人的辛苦也记住了。']]},
 {title:'纸上山河',sword:'仙师寄来华山山路图，让孩子留在宫中辨认险坡与歇脚处。图上有一条近路，却没有标明雨后能否通行。',cloud:'仙师寄来云岫山水图，让孩子在宫中比对旧时雨记。两条溪道画得相近，涨水时却未必能走同一路。',
  voices:['图上没有画的地方，怎样知道究竟是什么样？','我想走得远，也得先学会不困在半路上。','若遇上走不动的人，图上哪里能让他先歇一歇？','我想把这些地方认熟，将来写信也能说清自己在哪儿。','看着再近，走不通也白费。得先问清实情。','我画了几处想看的风景，先生却先让我找避雨的屋檐。','缺的这一段不能凭猜测补上，须向走过的人核实。','认不得便认不得，我愿先把这张图学明白。'],
  choices:[['查旧记，补上问号','lit','孩子留在宫中查阅旧记，把不确定的路段圈出请仙师核实，没有当作亲历。'],['先替同行人留退路','vir','父皇与孩子在图上标出歇脚、避雨与求援的地方，行路也须顾及同行者。']]},
 {title:'师札一封',sword:'云岑真人回信，既肯定先前的课业，也圈出一处贪快的毛病。孩子把信翻了几遍，想给师长一个认真答复。',cloud:'照玄道长回信，既肯定先前的课业，也圈出一处只求清静、不肯面对难题的疏漏。孩子把信翻了几遍，想给师长一个认真答复。',
  voices:['先生说得有道理，我还有一个新问题想附在回信里。','看见那句批评时不服气，再想想，确是我该改。','先生花了心思指点我，我也想问问他近日可好。','我起先有些难过，想明白后，才把这封回信写好。','做错的地方认了，下回改好再给先生看。','信上的圈比夸我的字还多，可我竟盼着下一封了。','我把每一处批注都列出来，想请先生看改得对不对。','先生肯直言，我便不该只听赞许。'],
  choices:[['认真回信，列清改进之处','lit','孩子逐条回应师札，既记住赞许，也留下需要改进的功课。'],['谈谈听到批评时的心情','love','父皇陪孩子说清收到批评时的心绪，再一起把回信写完。']]},
 {title:'所学为何',sword:'国师让孩子重看最初那本剑谱，不急着添新招，只问：学会这些以后，最想用来做什么？',cloud:'国师让孩子重读最初那页问道札记，不急着讲新篇，只问：学会这些以后，最想用来做什么？',
  voices:['我仍想看没见过的山川，也想知道那些地方的人怎样过日子。','我还是想练出真本事，只是不想再靠输赢证明所有事。','我想护住遇到难处的人。学得慢一点，也不该忘了这个。','我喜欢清静，也开始觉得，有些惦记不能全放在心里。','若遇不平，我想有本事出手，也知道怎样才算帮到了人。','想看的风景还很多，可宫中这些小事，我也舍不得忘。','把自己照应好，再把同行的人照应好，才走得长远。','我想靠自己的所学立身，也愿承担与本领相称的责任。'],
  choices:[['留一页手记，记住今日志向','lit','父皇请孩子写下今日的志向，日后可回看，不必把前路此刻就定死。'],['以一件日常小事实践所愿','vir','孩子选定一件能在京中做到的小事，把所学用在待人处事上。']]}
];
const IMMORTAL_PALACE_DISPOSITIONS=['好奇','好胜','仁厚','内敛','爽直','灵动','审慎','自矜'];
function immortalPalaceDue(k){return kidAge(k)<16?Math.min(S.turn+6,k.born+16*12):S.turn+6;}
function immortalPalaceStay(k){
 const r=k.immortal;r.stage='invited';r.due=immortalPalaceDue(k);
 if(kidAge(k)>=16)r.adultDiscussed=true;
}
function immortalPalaceEvent(k,reconsider=false){
 const r=k?.immortal;
 if(!immortalPalaceLessonsEnabled()||!r||r.stage!=='invited'||!immortalLocal(k)||S.turn<r.due)return null;
 const turn=S.turn,due=r.due,count=r.palaceLessons||0,sick=k.hp<50,d=IMMORTAL_SECTS[r.route];let done=false;
 const valid=()=>!done&&S.turn===turn&&k.immortal===r&&r.stage==='invited'&&r.due===due&&
  (r.palaceLessons||0)===count&&immortalLocal(k)&&sick===(k.hp<50);
 const finish=(title,text,change)=>{if(!valid())return null;done=true;change();immortalRecord(k,title,text,'palace-study');save('auto');return text;};
 const base={por:k,valid,ref:'原创仙侠支线 · 宫中修习'};
 if(kidAge(k)>=16&&(!r.adultDiscussed||reconsider)){
  const reason=S.heir===k.id?'东宫仍有储位之责，须先另定储君，才能远行。':k.married||k.spouse?'已有婚姻与家室，眼下先在京修习，不径自舍家入山。':sick?'身体尚弱，先休养，不能即刻远行。':'师门愿接续旧约；若准启程，将从一年学艺、一年历练做起。';
  return {...base,title:reconsider?'山门再约 · 重议行程':'山门再约 · 成年问志',text:`${k.name}${reconsider?'又提起先前留下的山门之约':'已满十六岁，国师取出当年暂留京中时记下的山门之约'}。${d.master}${d.title}托书问起近况，先前的师承与课业仍在，不须重新拜会。\n${k.name}道：“${IMMORTAL_VOICES[childDisposition(k)]}只是今日，我想把去留再认真想一遍。”\n${reason}`,choices:[
   {t:`准随师赴${d.place} · 国库−30`,cond:()=>valid()&&immortalCanLeave(k)&&E().treasury>=30,why:'须身体康健，无储位及家室牵绊，国库足三十万两',f:()=>{if(!valid()||!immortalCanLeave(k)||E().treasury<30)return null;done=true;r.adultDiscussed=true;chg({treasury:-30});immortalDepart(k);save('auto');return immortalDepartureResult(k,`${k.name}接续旧约随师启程，在京修习的经历一并留在纪事里。`);}},
   {t:'继续在京修习，半年后听近况',f:()=>finish('留京续课',`${k.name}暂不启程，继续在京修习；半年后听新的课业近况，远行的心愿仍可再谈。`,()=>immortalPalaceStay(k))},
   {t:'商定留在人间，收存山门之约',f:()=>finish('各有归处',`${k.name}与父皇谈过后，决定保留问道兴趣，在人间走自己的路。师承与在京修习的经历没有抹去，山门之约到此收存。`,()=>{r.stage='closed';r.adultDiscussed=true;})}
  ]};
 }
 const resting=sick?(r.palaceRestLessons||0)%2:0;
 const lesson=sick?{title:resting?'静养回札':'病中缓课',sword:resting?'孩子在宫中静养，仙师送来的回札问起睡眠与食欲，嘱咐暂不练剑。':'孩子近来身体不适，国师撤下木剑，改留两页轻省的札记，嘱咐先休息。',cloud:resting?'孩子在宫中静养，仙师送来的回札问起睡眠与食欲，嘱咐暂不添课。':'孩子近来身体不适，国师停了费神的听息功课，只留两页轻省札记，嘱咐先休息。',choices:[['陪读片刻，倦了便歇','lit','父皇陪孩子读了片刻札记，见倦便停，没有拿功课催促养病。'],['暂放课本，陪孩子说话','love','父皇放下课本，陪孩子说了会儿话，记住身子养好之前不催课业。']]}:IMMORTAL_PALACE_LESSONS[count%IMMORTAL_PALACE_LESSONS.length];
 const index=IMMORTAL_PALACE_DISPOSITIONS.indexOf(childDisposition(k));
 const voice=sick?['我想问的事先记下来，等有精神再慢慢学。','停课心里有些不甘，可我答应先把身子养好。','先生在担心，我不会再硬撑着练。','有人陪着坐一会儿，心里便安稳些。','练不动便歇，养好身子再来。','躺着也有好多念头，等好些了再一件件说给父皇听。','先按医嘱休息，功课的进度可以往后挪。','养病不是认输，我会听劝，不勉强自己。'][index]:lesson.voices[index];
 return {...base,title:'宫中修习 · '+lesson.title,text:`${k.name}仍在京中修习。${lesson[r.route]}\n${k.name}道：“${voice}”`,choices:[
  ...lesson.choices.map(([label,stat,outcome])=>{
   const field=stat==='skill'?(r.route==='sword'?'mar':'lit'):stat;
   return {t:label+` · ${{mar:'武艺',lit:'文采',vir:'德行',love:'亲情'}[field]}+${sick?1:2}`,f:()=>finish(lesson.title,`${k.name}在京修习：${lesson[r.route]}“${voice}”${outcome}`,()=>{
    if(sick)r.palaceRestLessons=(r.palaceRestLessons||0)+1;else r.palaceLessons=count+1;
    r.lastPalaceLesson=lesson.title;r.due=immortalPalaceDue(k);k[field]=clamp(k[field]+(sick?1:2));
   })};
  }),
  ...(kidAge(k)>=16?[{t:'另谈先前的启程之约',f:()=>{if(!valid())return null;done=true;pushNow(immortalPalaceEvent(k,true));return null;}}]:[])
 ]};
}
function immortalEvent(k){
 const appeal=immortalTravelPetition(k);if(appeal)return appeal;
 const r=k?.immortal;if(!immortalEnabled()||!r||!k.alive||k.pendingName||k.jailed||k.removedFromRoyal||S.over||S.turn<r.due)return null;
 const stage=r.stage,d=IMMORTAL_SECTS[r.route],master=immortalMaster(k);let done=false;
 if(stage==='invited'&&immortalPalaceLessonsEnabled())return immortalPalaceEvent(k);
 const valid=()=>!done&&k.alive&&!k.pendingName&&!k.jailed&&!k.removedFromRoyal&&!S.over&&k.immortal===r&&r.stage===stage&&S.turn>=r.due&&(!['noticed','invited'].includes(stage)||immortalLocal(k));
 const finish=(title,text,change,kind='news')=>{if(!valid())return null;done=true;change();immortalRecord(k,title,text,kind);save('auto');return text;};
 const base={por:k,valid,ref:'原创仙侠支线 · 架空山门'};
 if(['noticed','invited'].includes(stage)){
  if(!immortalLocal(k))return null;
  const reason=kidAge(k)<16?'年纪尚小，可先留在宫中读书练习，十六岁后再谈远行。':S.heir===k.id?'东宫有监国与储位之责，须先另定储君，才能远行。':k.married||k.spouse?'已有婚姻与家室，眼下先在京问道，不径自舍家入山。':k.hp<50?'身体尚弱，先休养，再谈入山。':'';
  return {...base,cast:[k,master],title:'仙师来访 · 山门之约',text:`${d.master}${d.title}受国师相邀来访，衣袂带着松间清气。谈及${k.name}的${r.root}，道长说：“${d.line}”\n${k.name}答道：“${IMMORTAL_VOICES[childDisposition(k)]}”\n${k.sex==='m'&&k.birthTraits?.mother?.rank===8?'身为嫡出的皇子，他又问起宗室责任，久久没有立即作答。\n':''}${reason||'若准启程，须一年学艺、一年历练后再谈去留；以后可以归来，也可以长留山门。'}`,choices:[
   {t:`准随师赴${d.place} · 国库−30`,cond:()=>immortalCanLeave(k)&&E().treasury>=30,why:reason||'国库不足',f:()=>{if(!valid()||E().treasury<30||!immortalCanLeave(k))return null;done=true;chg({treasury:-30});immortalDepart(k);save('auto');return immortalDepartureResult(k,`${k.name}已随师启程。送别与亲人的心绪，分别记在人物纪事里。`);}},
   {t:immortalPalaceLessonsEnabled()?(kidAge(k)<16?'留宫中习道，成年后再议启程':'先留宫中习道，半年后听近况'):'先留宫中习道，半年后再谈',f:()=>finish('宫中留课',immortalPalaceLessonsEnabled()?`${k.name}留在京中随师读书习剑，尚未离宫。半年后听新的修习近况，${kidAge(k)<16?'满十六岁再谈启程':'远行的心愿仍被认真留下'}。`:`${k.name}留在京中随师读书习剑，尚未离宫。想远行的心愿被认真留下，半年后再议。`,()=>{r.stage='invited';if(immortalPalaceLessonsEnabled())immortalPalaceStay(k);else r.due=S.turn+6;k.lit=clamp(k.lit+2);if(!immortalPalaceLessonsEnabled()||kidAge(k)>=16)immortalTravelRefused(k);},immortalPalaceLessonsEnabled()?'palace-study':'news')},
   {t:'愿留此间，不走入山这条路',f:()=>finish('各有归处',`${k.name}与仙师谈过以后，决定保留问道的兴趣，在人间走自己的路。灵根没有消失，山门之约到此收存。`,()=>{r.stage='closed';})},
   ...(journalContentVersion()>=49&&k.sex==='m'?[{t:'皇子不可远行，留在京中',f:()=>finish('远行未允',`陛下不准${k.name}随师远行，令他暂留京中。行囊仍搁在床边，他还想找个时机把未说完的话讲给父皇听。`,()=>{r.stage='closed';immortalTravelRefused(k);},'petition')}]:[])
  ]};
 }
 if(stage==='learning')return {...base,title:'山中来信 · 第一场历练',text:`${k.name}在${d.name}学艺已有一年。${r.route==='sword'?'来信说，华山石阶走了无数遍，终于能让剑锋带起一缕清光。':'来信说，终于能听辨山泉中的灵息，也学会在夜里独守一盏灯。'}\n师门将安排下山历练，孩子记起家中的教导，写信来谈自己想守住什么。`,choices:[
  {t:'回信：记得照应同行的人',f:()=>finish('初试问心',`${k.name}收到回信，将照应同门记在行囊的小册上。未为争一时先后丢下同行的人。`,()=>{r.stage='trial';r.due=S.turn+12;r.practice='care';k.vir=clamp(k.vir+3);})},
  {t:'回信：精进本领，也要平安',f:()=>finish('初试问剑',`${k.name}收到回信，约定遇险先求援，再磨炼所学，不以逞强证明本事。`,()=>{r.stage='trial';r.due=S.turn+12;r.practice='skill';k.mar=clamp(k.mar+3);})}
 ]};
 if(stage==='trial')return {...base,title:'仙门留名 · 去留由心',text:`两年过去，${d.master}${d.title}写来亲笔信，认可${k.name}已走完入门历练，愿正式收入${d.name}。\n${k.name}自己的信附在后面：“${S.children.includes(k)?'父皇':'陛下'}，我想在山里再走一程。往后或许不能常归，但会记得家在何处。”\n可长期留山，也可结束这段常住；没有强制回宫的期限。`,choices:[
  {t:'准正式入门，往后以家书与江湖消息相闻',f:()=>finish('拜入仙门',`${k.name}正式拜入${d.name}，长留山中修行，不定归期。家书与江湖消息仍通往故国。`,()=>{r.stage='sect';r.enrolled=S.turn;r.due=S.turn+18;r.merit=1;})},
  {t:'与师门道别，回到原来的生活',f:()=>{if(!valid())return null;done=true;immortalReturn(k);save('auto');return `${k.name}已平安归来，师承与问道的经历仍在。`;}}
 ]};
 if(stage==='sect'){
  const news=immortalNews(k),rank=immortalRank(k,r.merit+1),promotion=rank>r.rank;
  return {...base,title:promotion?'江湖闻名 · 故人仙踪':'江湖来音 · '+news.topic,text:`${news.text}\n${promotion?`传闻中，${d.name}新任的${immortalRankName(k,rank)}，正用着${k.name}当年入山所留的姓名与师承。国师收到同印的山门信牒，等候核对。`:'送来的信牒留着熟悉的姓名与山门印记，国师可核明来处。'}\n${r.practice==='care'?'信里仍提到同行者的安危。':'信里仍记着当年“精进本领，也要平安”的叮嘱。'}\n“处江湖之远则忧其君。”离宫多年，${k.name}仍牵挂故国。`,choices:[
   {t:'核对信牒，听清这段消息',f:()=>finish(promotion?'山门扬名':'江湖牵念',`${news.text}信牒与师承核对无误，正是${k.name}。${promotion?`经多年修行与门中历练，现任${d.name}${immortalRankName(k,rank)}。`:''}宫中记下这段牵挂，没有擅召归来。`,()=>{r.rank=rank;r.merit++;r.due=S.turn+18;k[r.route==='sword'?'mar':'lit']=clamp(k[r.route==='sword'?'mar':'lit']+2);if(news.benefit==='people')chg({people:2});else if(news.benefit==='wen')chg({wen:1});else if(news.benefit==='prestige')chg({prestige:1});})},
   {t:'暂存传闻，半年后再核',f:()=>finish('仙踪待核',`有关${k.name}的山门消息暂存待核，没有凭传闻升改身份或给出赏赐。`,()=>{r.due=S.turn+6;})}
  ]};
 }
 return null;
}
function immortalTick(){
 if(!immortalEnabled()||S.over)return;
 if(journalContentVersion()>=49)for(const k of immortalPeople()){
  if(!k.alive||!S.children.includes(k))continue;
  immortalMaternalDiscovery(k);
  shareImmortalPeerAdmiration(k);
  const r=k.immortal;
  if(r.discoveryReflected||S.turn<=r.since||!['noticed','invited','closed'].includes(r.stage))continue;
  r.discoveryReflected=true;
  kstory(k,`【灵根之后】国师辨出${r.root}之后，${k.sex==='m'?'他':'她'}把那日在钦安殿听见的风声记了下来。${IMMORTAL_VOICES[childDisposition(k)]}`);
  const mother=byId(k.mom);
  if(mother?.alive)story(mother,`【灵根之后】她听说${k.name}还收着问道的手记。此事渐渐安静下来，她仍想找个机会问问孩子，知道自己有灵根后，最惦记的是什么。`);
 }
 const p=S.flags.immortalPace||={last:-99,lastOffer:-99};
 reconcileImmortalDiscovery();
 if((immortalDiscoveryNewsActive()&&S.immortalDiscovery)||S.turn-p.last<6||mourningActive())return;
 p.last=S.turn;
 const candidates=S.children.filter(k=>immortalLocal(k)&&kidAge(k)>=12&&!k.immortal&&immortalRoot(k)&&daoInterest(k)>0);
 if(candidates.length&&chance(.35))immortalDiscover(pick(candidates));
}
function pendingImmortalEvent(){
 if(!immortalEnabled()||S.over||mourningActive())return null;
 if(journalContentVersion()>=49){
  const appeal=immortalPeople().map(immortalTravelPetition).find(Boolean);if(appeal)return appeal;
 }
 if(S.turn-(S.flags.immortalPace?.lastOffer??-99)<3)return null;
 const k=immortalPeople().filter(k=>k.alive&&S.turn>=(k.immortal.due??Infinity)).sort((a,b)=>a.immortal.due-b.immortal.due).find(k=>immortalEvent(k));
 const ev=k&&immortalEvent(k);return ev?{...ev,onQueue:()=>{(S.flags.immortalPace||={last:-99}).lastOffer=S.turn;}}:null;
}
function immortalVoice(k){
 if(!immortalAway(k))return null;
 const d=IMMORTAL_SECTS[k.immortal.route];return voiceLine('immortal-letter',`${d.name}辗转送来的家书，纸角沾着淡淡松香。`,`${S.children.includes(k)?'父皇':'陛下'}，${IMMORTAL_VOICES[childDisposition(k)]}山中有自己的日子，心里也放着故国。${immortalMothers(k).length?'若母亲仍惦记，请替我报一声平安。':'旧日的亲情，我一直记着。'}`);
}
function immortalTags(k){return immortalEnabled()&&k.immortal?`<span class="tag y">灵根 · ${esc(k.immortal.root)}</span>${immortalAway(k)?`<span class="tag">${esc(immortalRankName(k))}</span>`:''}`:'';}
function immortalPanel(k){
 if(!immortalEnabled()||!k.immortal)return '';
 const r=k.immortal,d=IMMORTAL_SECTS[r.route],ready=!!immortalEvent(k),away=immortalAway(k);
 return `<section class="personal-experience"><h3>仙缘与江湖</h3>${immortalTags(k)}<p>${esc(d.name)} · 师承 ${esc(d.master+d.title)}${away?' · '+esc(immortalRankName(k))+' · 离家'+Math.floor((S.turn-r.departed)/12)+'年':''}</p><p>${{noticed:'仙师来访，尚未离宫。',invited:immortalPalaceLessonsEnabled()?(kidAge(k)<16?'在京读书习道，每半年听修习近况；满十六岁再议启程。':'在京继续修习，每半年有课业近况，仍可商议启程。'):'暂在京中读书习道，等待再议。',learning:'在山门学艺，第一年课业尚待完成。',trial:'随师历练，待满两年再议正式入门。',sect:'长留山门，不定归期；家书与江湖消息仍能相闻。',returned:'已经归来，保留师承与山中经历。',closed:'选择在人间生活，仍保留灵根与问道兴趣。'}[r.stage]}</p>
 ${k.alive&&!k.jailed&&!k.removedFromRoyal?`<div class="acts">${ready?`<button class="btn jade" onclick="A.immortalTalk(${k.id})">${away?'读山门消息':'谈谈仙缘'} →</button>`:''}${away?`<button class="btn" onclick="A.immortalLetter(${k.id})" ${S.turn-r.lastLetter<6?'disabled':''}>寄家书 · 精力−1</button><button class="btn quiet" onclick="A.immortalRecall(${k.id})">商议归来</button>`:''}</div>`:''}
 ${(r.history||[]).slice(-2).reverse().map(e=>`<p class="hint">${esc(e.d)} · ${esc(e.title)}<br>${esc(e.text)}</p>`).join('')}</section>`;
}
function immortalHall(){
 if(!immortalEnabled())return '';
 const people=immortalPeople().filter(k=>k.alive);if(!people.length)return '';
 return `<section class="palace-activity"><h3>山门与故国</h3><div class="grid">${people.map(k=>`<button class="card" onclick="A.go('${S.children.includes(k)?'kid':'relative'}',${k.id})">${porImg(k,64)}<span><strong>${esc(k.name)}</strong><small>${esc(IMMORTAL_SECTS[k.immortal.route].name)} · ${immortalAway(k)?esc(immortalRankName(k)):'尚在人间'}${immortalEvent(k)?' · 有新消息':''}</small></span></button>`).join('')}</div></section>`;
}
A.immortalTalk=function(id){if(modalOpen)return;const ev=immortalEvent(immortalPerson(id));if(ev)pushEv(ev);};
A.immortalLetter=function(id){
 const k=immortalPerson(id);if(modalOpen||S.over||!k?.alive||!immortalAway(k)||k.jailed||k.removedFromRoyal||S.turn-k.immortal.lastLetter<6||!useE())return;
 k.immortal.lastLetter=S.turn;k.love=clamp(k.love+4);const voice=immortalVoice(k),text=voice.lines.join('');
 immortalRecord(k,'青山家书',`宫中与${k.name}互通一封家书。${text}`);for(const c of immortalMothers(k))if(S.consorts.includes(c)){const worry=reconcileMotherConcern(c);if(worry)worry.value=clamp(worry.value-15);}
 pushEv({title:'青山家书',por:k,text,choices:[ok1]});save('auto');
};
A.immortalRecall=function(id){
 const k=immortalPerson(id);if(modalOpen||S.over||!k?.alive||!immortalAway(k)||k.jailed||k.removedFromRoyal)return;
 let done=false;const stage=k.immortal.stage,valid=()=>!done&&k.alive&&immortalAway(k)&&k.immortal.stage===stage&&!k.jailed&&!k.removedFromRoyal;
 pushEv({title:'青山去留',por:k,valid,text:stage==='sect'?`${k.name}已在山门安顿了自己的生活。来信说愿继续修行，暂不常归；请宫中容许这份选择。`:`${k.name}仍在最初的学艺与历练中。可寄信商议结束常住，也可继续原来的约定。`,choices:[
  ...(stage!=='sect'?[{t:'商定归期，结束此次常住',f:()=>{if(!valid()||!immortalReturn(k))return null;save('auto');return '归来的事已经记下，仍保留山中师承。';}}]:[]),
  {t:'尊重长留山中的心愿',f:()=>{if(!valid())return null;done=true;immortalRecord(k,'不必折返',`宫中尊重${k.name}继续修行的心愿。归来不作强求，往后仍可通信、听江湖近况。`);save('auto');return '家门仍为其留着，山路也不必因此折返。';}}
 ]});
};
