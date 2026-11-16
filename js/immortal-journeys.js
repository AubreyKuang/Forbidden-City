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
function immortalAway(k){return !!(immortalEnabled()&&['learning','trial','sect'].includes(k?.immortal?.stage));}
function immortalBirthChance(k){return k.sex==='f'?.24:k.birthTraits?.mother?.rank===8?.015:.06;}
function immortalRoot(k){
 if(k.immortalTalent!==undefined)return k.immortalTalent;
 const roll=mulberry32(voiceHash('immortal-root:'+String(k.seed||k.id)))();
 return roll<immortalBirthChance(k)?['木灵根','水灵根','金灵根','火灵根','土灵根','冰灵根','雷灵根'][voiceHash('root-kind:'+String(k.seed||k.id))%7]:null;
}
function initImmortalTalent(k){if(immortalEnabled()&&k.immortalTalent===undefined)k.immortalTalent=immortalRoot(k);}
function immortalPeople(){return royalHouseholds().filter(k=>k.immortal);}
function immortalPerson(id){return royalById(id);}
function immortalMaster(k){const d=IMMORTAL_SECTS[k.immortal.route];return {daoMaster:true,daoTitle:d.title,cell:d.cell,name:d.master,alive:true};}
function immortalLocal(k){return !!(k?.alive&&!k.pendingName&&!k.removedFromRoyal&&!k.jailed&&!k.away&&!k.templeStay&&k.princessMarriage!=='frontier'&&!immortalAway(k)&&S.children.includes(k)&&!S.over);}
function immortalCanLeave(k){return immortalLocal(k)&&kidAge(k)>=16&&k.hp>=50&&!k.married&&!k.spouse&&S.heir!==k.id;}
function immortalMothers(k){
 const people=mothersOf(k).filter(c=>c.alive);
 for(const d of [S.flags.dowager,S.flags.birthDowager])if(d?.alive&&[k.mom,k.foster].includes(d.personId)&&d.portrait&&!people.some(c=>c.id===d.personId))people.push(d.portrait);
 return people;
}
function immortalMotherFeeling(c,k,kind){
 const role=c.id===k.mom?'亲生的孩子':'亲手照护的孩子';
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
 if(journalContentVersion()<49||r.familyHeard)return;
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
     return finish('远行获准',`听过这回求情，陛下改了主意，准${k.name}随师启程。`,()=>{r.stage='invited';chg({treasury:-30});immortalDepart(k);});
    }},
   {t:'仍不准远行，留在京中',f:()=>finish('仍留京中',`陛下听过求情，仍不准${k.name}离京。侍从撤下行装，他把未寄出的拜师帖收回书匣。`,()=>{r.stage='closed';})},
   {t:'先留京修习，半年后再议',f:()=>finish('暂缓远行',`陛下准${k.name}继续在京修习，远行一事待半年后再议。他把想问仙师的话先抄在册中。`,()=>{r.stage='invited';r.due=S.turn+6;})}
  ]};
}
function immortalDiscover(k){
 if(!immortalEnabled()||!immortalLocal(k)||kidAge(k)<12||k.immortal||!immortalRoot(k)||daoInterest(k)<=0)return false;
 initImmortalTalent(k);
 k.immortal={root:k.immortalTalent,route:k.mar>k.lit||['好胜','爽直'].includes(childDisposition(k))?'sword':'cloud',stage:'noticed',since:S.turn,due:S.turn,history:[],merit:0,rank:0,lastLetter:-99};
 immortalRecord(k,'灵根初显',`钦安殿试拂玉磬时，${k.name}指下亮起一线清光，竟与殿外松风相应。国师辨为${k.immortal.root}，记入问道册；仍须慢慢学习，未曾许诺长生。`,'discovery');immortalMaternalDiscovery(k);return true;
}
function immortalDepart(k){
 if(!immortalCanLeave(k)||!['noticed','invited'].includes(k.immortal?.stage))return false;
 const r=k.immortal,d=IMMORTAL_SECTS[r.route];r.stage='learning';r.departed=S.turn;r.due=S.turn+12;r.rank=0;
 delete k.initiative;k.tutor=false;
 immortalRecord(k,'辞阙入山',`${k.name}拜${d.master}${d.title}为师，随行前往${d.place}的${d.name}。皇家随侍护送至山门，往后依门规学艺，送信的驿路已经约定。${IMMORTAL_VOICES[childDisposition(k)]}`,'departure');return true;
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
function immortalEvent(k){
 const appeal=immortalTravelPetition(k);if(appeal)return appeal;
 const r=k?.immortal;if(!immortalEnabled()||!r||!k.alive||k.pendingName||k.jailed||k.removedFromRoyal||S.over||S.turn<r.due)return null;
 const stage=r.stage,d=IMMORTAL_SECTS[r.route],master=immortalMaster(k);let done=false;
 const valid=()=>!done&&k.alive&&!k.pendingName&&!k.jailed&&!k.removedFromRoyal&&!S.over&&k.immortal===r&&r.stage===stage&&S.turn>=r.due&&(!['noticed','invited'].includes(stage)||immortalLocal(k));
 const finish=(title,text,change,kind='news')=>{if(!valid())return null;done=true;change();immortalRecord(k,title,text,kind);save('auto');return text;};
 const base={por:k,valid,ref:'原创仙侠支线 · 架空山门'};
 if(['noticed','invited'].includes(stage)){
  if(!immortalLocal(k))return null;
  const reason=kidAge(k)<16?'年纪尚小，可先留在宫中读书练习，十六岁后再谈远行。':S.heir===k.id?'东宫有监国与储位之责，须先另定储君，才能远行。':k.married||k.spouse?'已有婚姻与家室，眼下先在京问道，不径自舍家入山。':k.hp<50?'身体尚弱，先休养，再谈入山。':'';
  return {...base,cast:[k,master],title:'仙师来访 · 山门之约',text:`${d.master}${d.title}受国师相邀来访，衣袂带着松间清气。谈及${k.name}的${r.root}，道长说：“${d.line}”\n${k.name}答道：“${IMMORTAL_VOICES[childDisposition(k)]}”\n${k.sex==='m'&&k.birthTraits?.mother?.rank===8?'身为嫡出的皇子，他又问起宗室责任，久久没有立即作答。\n':''}${reason||'若准启程，须一年学艺、一年历练后再谈去留；以后可以归来，也可以长留山门。'}`,choices:[
   {t:`准随师赴${d.place} · 国库−30`,cond:()=>immortalCanLeave(k)&&E().treasury>=30,why:reason||'国库不足',f:()=>{if(!valid()||E().treasury<30||!immortalCanLeave(k))return null;done=true;chg({treasury:-30});immortalDepart(k);save('auto');return `${k.name}已随师启程。送别与亲人的心绪，分别记在人物纪事里。`;}},
   {t:'先留宫中习道，半年后再谈',f:()=>finish('宫中留课',`${k.name}留在京中随师读书习剑，尚未离宫。想远行的心愿被认真留下，半年后再议。`,()=>{r.stage='invited';r.due=S.turn+6;k.lit=clamp(k.lit+2);immortalTravelRefused(k);})},
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
  const r=k.immortal;
  if(r.discoveryReflected||S.turn<=r.since||!['noticed','invited','closed'].includes(r.stage))continue;
  r.discoveryReflected=true;
  kstory(k,`【灵根之后】国师辨出${r.root}之后，${k.sex==='m'?'他':'她'}把那日在钦安殿听见的风声记了下来。${IMMORTAL_VOICES[childDisposition(k)]}`);
  const mother=byId(k.mom);
  if(mother?.alive)story(mother,`【灵根之后】她听说${k.name}还收着问道的手记。此事渐渐安静下来，她仍想找个机会问问孩子，知道自己有灵根后，最惦记的是什么。`);
 }
 const p=S.flags.immortalPace||={last:-99,lastOffer:-99};
 if(S.turn-p.last<6||mourningActive())return;
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
 return `<section class="personal-experience"><h3>仙缘与江湖</h3>${immortalTags(k)}<p>${esc(d.name)} · 师承 ${esc(d.master+d.title)}${away?' · '+esc(immortalRankName(k))+' · 离家'+Math.floor((S.turn-r.departed)/12)+'年':''}</p><p>${{noticed:'仙师来访，尚未离宫。',invited:'暂在京中读书习道，等待再议。',learning:'在山门学艺，第一年课业尚待完成。',trial:'随师历练，待满两年再议正式入门。',sect:'长留山门，不定归期；家书与江湖消息仍能相闻。',returned:'已经归来，保留师承与山中经历。',closed:'选择在人间生活，仍保留灵根与问道兴趣。'}[r.stage]}</p>
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
