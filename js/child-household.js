/* Young children live with their current caregiver; visits reveal domestic scenes. */
function childResidenceAdultAge(k){return k.sex==='f'?15:16;}
function approvedMotherResidence(k){
  return journalContentVersion()>=105&&k?.motherResidence?.choice==='stay'&&
    k.motherResidence.caregiver===(k.foster||k.mom)&&kidAge(k)<childResidenceAdultAge(k);
}
function raisedByDowager(k){
  const r=k?.dowagerUpbringing,d=S.flags.dowager;
  return !!r&&r.gen===S.gen&&d?.alive&&r.personId===(d.personId??null)&&!k.foster&&
    childInPalace(k)&&!k.married&&kidAge(k)<15;
}
function youngChildMother(k){
  if(!childInPalace(k)||k.married||k.pendingName||raisedByDowager(k)||(kidAge(k)>=6&&!approvedMotherResidence(k)))return null;
  const mother=byId(k.foster||k.mom);
  return inPalace(mother)&&mother.palace&&mother.palace!=='冷宫'?mother:null;
}
function sharedChildResidents(k){
  return kidsAlive().filter(o=>o!==k&&o.sex===k.sex&&childInPalace(o)&&!o.married&&!o.pendingName&&
    kidAge(o)>=6&&kidAge(o)<childResidenceAdultAge(o)&&!youngChildMother(o)&&!raisedByDowager(o)&&
    (journalContentVersion()<111||!approvedMotherResidence(o)));
}
function childResidenceCareLabel(k,mother){
  if(journalContentVersion()>=111&&k.foster&&childCareAddress(k,mother)==='姨母')return '姨母';
  return k.foster?'养母':'生母';
}
function childResidence(k){
  if(!childInPalace(k)||k.married||k.pendingName)return '';
  if(raisedByDowager(k))return '由太后抚养 · 慈宁宫';
  const mother=youngChildMother(k);
  if(mother)return `随${childResidenceCareLabel(k,mother)}${cName(mother)}同住 · ${mother.palace}`;
  if(kidAge(k)<6)return '暂由乳母照料，未随母同住';
  if(approvedMotherResidence(k))return '暂未与母亲同住 · 宫人照料';
  if(kidAge(k)>=childResidenceAdultAge(k)||journalContentVersion()<105)return '';
  const sharing=k.motherResidence?.choice==='shared'||sharedChildResidents(k).some(o=>o.motherResidence?.choice==='shared');
  if(!sharing)return '';
  const place=k.sex==='f'?'公主居所':'皇子居所',peers=sharedChildResidents(k);
  return peers.length?`${place} · 与${peers.map(o=>o.name).join('、')}同住`:`${place} · 宫人照料，暂无其他同住的${k.sex==='f'?'公主':'皇子'}`;
}
// The follow-up belongs to the particular caregiver and lasts only while the
// arrangement still applies. Reading it never changes the saved world.
function currentMotherResidenceConversation(k){
  const r=k?.motherResidence,age=k&&kidAge(k);
  if(journalContentVersion()<111||!r||!childInPalace(k)||k.married||k.pendingName||age>=childResidenceAdultAge(k)||
    S.turn<r.turn||S.turn-r.turn>12||r.caregiver!==(k.foster||k.mom))return null;
  const mother=byId(r.caregiver);if(!inPalace(mother))return null;
  if(r.choice==='stay'&&youngChildMother(k)!==mother)return null;
  if(r.choice==='shared'&&youngChildMother(k))return null;
  return {mother,stay:r.choice==='stay',address:childCareAddress(k,mother)};
}
function shareMotherResidenceNews(k,stay){
  const birthMother=byId(k.mom),house=birthMother&&houseOf(birthMother);if(!house)return;
  const people=[house.father,...brotherRoles(house).map(role=>house[role])],seen=new Set();
  for(const p of people){
    if(!officialAlive(p)||p.exiled||seen.has(p.id)||!chance(.5))continue;seen.add(p.id);
    const news={child:k.id,name:k.name,sex:k.sex,stay,turn:S.turn,gen:S.gen};
    (p.motherResidenceNews||=[]).push(news);
    const outcome=stay?'皇帝已准其继续与照养的母亲同住':'皇帝未允，已安排其迁往共同居所';
    const feeling=k.sex==='m'?'他盼孩子渐渐振作，也愿给孩子多一些时日学着独立。':'他想起孩子依恋母亲的样子，觉得可爱，也盼她安心长大。';
    (p.story||=[]).push({d:dateStr(),t:`【孩子想随母同住】得知${k.name}向皇帝请求与母亲同住，${outcome}。${feeling}`});
  }
}
// A child's birthday answer also stays the same when loading the month before the move.
function childMotherResidenceRoll(k){
  return voiceHash('mother-residence:'+k.id+':'+(k.seed??k.born))%100;
}
function childMotherResidenceRequests(){
  if(journalContentVersion()<105||S.over)return [];
  const sixthBirthdayOnly=journalContentVersion()>=118;
  const events=[];
  for(const k of kidsAlive()){
    const age=kidAge(k),mother=byId(k.foster||k.mom),monthsOld=S.turn-k.born;
    if(!childInPalace(k)||raisedByDowager(k)||k.married||k.pendingName||age<6||age>=childResidenceAdultAge(k)||
      (sixthBirthdayOnly?(monthsOld!==72||k.motherResidenceChecked):monthsOld%12!==0)||k.motherResidence||!inPalace(mother)||!mother.palace||
      !['内敛','审慎'].includes(childDisposition(k))||childTrust(k,mother)<45)continue;
    if(sixthBirthdayOnly){
      k.motherResidenceChecked=true;
      if(childMotherResidenceRoll(k)>=(k.sex==='m'?18:10))continue;
    }else if(!chance(k.sex==='m'?.18:.35))continue;
    const turn=S.turn,gen=S.gen,caregiver=mother.id,address=childCareAddress(k,mother),place=k.sex==='f'?'公主居所':'皇子居所';
    const valid=()=>S.gen===gen&&S.turn===turn&&childInPalace(k)&&!k.married&&!k.pendingName&&!k.motherResidence&&
      (k.foster||k.mom)===caregiver&&inPalace(mother)&&kidAge(k)<childResidenceAdultAge(k);
    const apply=stay=>{
      if(!valid())return null;
      k.motherResidence={choice:stay?'stay':'shared',caregiver,turn:S.turn};
      const peers=sharedChildResidents(k),names=peers.map(o=>o.name).join('、');
      shareMotherResidenceNews(k,stay);
      if(stay){k.love=clamp((k.love??50)+4);kstory(k,`【求与母同住】${k.sex==='f'?'她':'他'}向父皇求准，获许在成年或出宫前继续随${address}住在${mother.palace}，仍按时读书。${journalContentVersion()>=109?'听见父皇应允，孩子欢喜地松了口气，赶紧把消息告诉母亲。':''}`);story(mother,`【孩子留在身边】${k.name}求准继续同住，往后仍在宫中一起起居。${journalContentVersion()>=109?'她见孩子安心下来，自己也欢喜，轻轻揽住孩子，答应陪着慢慢长大。':''}`);return `你答应了${k.name}。${k.sex==='f'?'她':'他'}在成年或出宫之前继续随${address}同住，课业照常。${journalContentVersion()>=109?'孩子欢喜地依偎在母亲身边，母亲也露出宽慰的笑。':''}`;}
      k.love=clamp((k.love??50)-4);kstory(k,`【迁往共同居所】${k.sex==='f'?'她':'他'}盼着陪伴${address}，父皇没有应允，仍按安排搬往${place}${names?'，与'+names+'同住':'，暂由宫人照料'}。${journalContentVersion()>=109?'孩子听见后低下头，难过得眼圈发红，还是慢慢收好了东西。':''}`);story(mother,`【孩子迁居】${k.name}想留下同住未获准，依旨迁往${place}，她仍惦记着孩子。${journalContentVersion()>=109?'她心疼孩子，帮着收拾衣物，约好往后常去看望。':''}`);
      return `${k.name}依旨迁往${place}${names?'，与'+names+'同住':'，眼下暂无其他适龄孩子，由宫人照料，日后与同住者一处起居'}。${journalContentVersion()>=109?'孩子难过地低下头，母亲心疼地陪着收拾行装。':''}`;
    };
    events.push({title:'孩子请求随母同住',por:k,cast:[mother],valid,
      text:`${k.name}性子安静，迟疑了许久才开口：“父皇，我知道该长大了，可我夜里仍怕一个人。能不能让我继续跟${address}住在一处？”${age>6?`此前${k.sex==='f'?'她':'他'}已不再随母同住，如今想搬回${mother.palace}。`:`按宫中安排，${k.sex==='f'?'她':'他'}该搬往${place}。`}读书与其他安排仍照常。`,
      choices:[{t:'同意，成年或出宫前随母同住',f:()=>apply(true)},{t:`不同意，迁往${place}共同居住`,f:()=>apply(false)}]});
  }
  return events;
}
A.visitChildHome=function(id){
  if(!S||S.over||modalOpen)return;
  const mother=youngChildMother(kidById(id)),destination=mother&&PLACES.find(p=>p.k==='palace'&&p.p===mother.palace);
  if(destination)A.visitMapActivity(destination.id);
};
function consortHomePlace(c){return inPalace(c)&&!c.maid?PLACES.find(p=>p.k==='palace'&&p.p===c.palace):null;}
A.visitConsortHome=function(id){
  if(!S||S.over||modalOpen)return;
  const destination=consortHomePlace(byId(id));if(!destination)return;
  if(haremReturnActive()&&haremAbsence()>=HAREM_RETURN_MONTHS)A.visitMapActivity(destination.id,id);
  else A.visitMapActivity(destination.id);
};
const nurseryChildren=name=>kidsAlive().filter(k=>youngChildMother(k)?.palace===name);
function nurseryActivity(k,m){
  const age=kidAge(k),address=childCareAddress(k,m)==='姨母'?'姨母':'娘',strict=['城府','骄矜','骄纵'].includes(m.trait),last=k.nurseryLastKind;
  if(age>=6)return {id:'study-together',title:'灯下相伴',prop:'书册 · 茶盏',mother:`${cName(m)}听孩子讲起今日的功课，偶尔问上一句，等${k.sex==='f'?'她':'他'}慢慢说完。`,child:'孩子把书页摊开，坐在母亲身边，讲起白日遇见的新事。',stat:'lit'};
  if(age<1)return {id:'cradle',title:'窗下哄睡',prop:'软枕 · 小摇篮',mother:strict?'方才还在吩咐宫务，她听见孩子哼唧，声音不自觉地放轻了。':'她轻轻哼着家乡的小调，一只手护着孩子的后背。',child:'孩子攥住她的袖角，睫毛一颤一颤，渐渐睡熟了。'};
  if(age<3)return {id:'steps',title:'扶案学步',prop:'软垫 · 布老虎',mother:m.trait==='将门'?`“再走一步。${address}在这儿，接着你。”`:'她蹲下身张开双手，等孩子自己迈过门边的小垫子。',child:'孩子晃晃悠悠扑进她怀里，又回头去够那只布老虎。'};
  const options=[];
  if(m.mood<35)options.push({id:'comfort',title:'小手拭泪',prop:'绢帕 · 窗前小凳',mother:'她望着窗外出神，回过神时，孩子已经把绢帕塞进她手里。',child:`“是不是有人惹${address}难过？我陪着你。”`,stat:'vir'});
  if(['才女','聪慧','好学','沉静'].includes(m.trait)||m.talent>=70||k.policy==='读书')options.push({id:'letters',title:'膝前认字',prop:'字帖 · 小砚台',mother:strict?'“这一笔要稳。写累了便歇一会儿，不能只求快。”':'“先认自己的名字。往后写信，就会落款了。”',child:'“那我也能给父皇写一封吗？”',stat:'lit'});
  if(m.trait==='巧手'||m.like==='字画')options.push({id:'ribbon',title:'彩线与花枝',prop:'彩线 · 花样纸',mother:'她把复杂的花样收起来，换一朵小花，让孩子自己挑颜色。',child:'“我要把这朵歪的也留下，它是我做的。”',stat:'lit'});
  if(['将门','活泼','爽直'].includes(m.trait)||k.policy==='习武')options.push({id:'play',title:'榻前小将军',prop:'木马 · 布老虎',mother:'她摆好两只软枕当山门，笑着让孩子想办法把布老虎送过去。',child:'“先让小马走前面，我护着后面！”',stat:'mar'});
  if(['温婉','好客'].includes(m.trait)||['嗜甜','擅厨艺'].includes(m.t2))options.push({id:'cakes',title:'小厨房的点心',prop:'蒸笼 · 花糕模',mother:'她将一小团面放在孩子手心，任那双小手捏成圆圆扁扁的形状。',child:`“最大的给${address}，这一块留给父皇。”`});
  options.push({id:'tale',title:'灯前听旧事',prop:'小灯 · 绘本',mother:strict?'她讲起自己幼时学规矩闹过的笑话，说到一半，也忍不住笑了。':'她讲起小时候在家中放纸鸢的事，孩子听得忘了摆弄手中的玩具。',child:`“${address}小时候，也会被人说调皮吗？”`});
  return options.find(a=>a.id!==last)||options[0];
}
function palaceLifeState(){
  if(S.palaceLife?.turn!==S.turn)S.palaceLife={turn:S.turn,checked:{},scenes:{}};
  return S.palaceLife;
}
function preparePalaceLife(name){
  if(!S||S.over||name==='冷宫')return;
  const state=palaceLifeState();if(state.checked[name])return;state.checked[name]=true;
  const children=nurseryChildren(name).filter(k=>S.turn-(k.nurserySeen??-99)>=3);
  if(!state.nurseryFound&&children.length&&chance(.38)){
    const k=pick(children),mother=youngChildMother(k),activity={...nurseryActivity(k,mother)};
    activity.mother+=' '+maternalActivity(k,mother,false).mother;
    state.scenes[name]={kind:'nursery',child:k.id,mother:mother.id,activity};state.nurseryFound=true;k.nurserySeen=S.turn;k.nurseryLastKind=activity.id;
  }else if(!state.youthFound){
    const visit=youngGuestVisit(name);
    if(visit){state.scenes[name]=visit;state.youthFound=true;}
  }
  // Persist unsuccessful rolls too: re-entering or reloading is not another lottery.
  save('auto');
}
function palaceLifeScene(name){
  const state=S.palaceLife,scene=state?.turn===S.turn&&state.scenes[name];if(!scene)return null;
  if(scene.kind==='guest')return youngGuestScene(scene,name);
  const k=kidById(scene.child),mother=byId(scene.mother);
  return youngChildMother(k)===mother&&mother?.palace===name?{scene,child:k,mother}:null;
}
function palaceConversation(title,prop,people){
  return `<section class="family-room" aria-label="${esc(title)}"><p class="school-caption">${esc(title)}</p><div class="family-room-people">${people.map(({person,line,action})=>`<article><p class="school-speech">${esc(line)}</p>${action?`<button class="family-room-person" onclick="${action}">${porImg(person,112)}<span>${esc(porName(person))}</span></button>`:`<div class="family-room-person">${porImg(person,112)}<span>${esc(porName(person))}</span></div>`}</article>`).join('')}</div><div class="family-room-props">${esc(prop)}</div></section>`;
}
function palaceLifePanel(name){
  const found=palaceLifeScene(name),children=nurseryChildren(name);
  const residents=children.length?`<section class="nursery-residents"><h3>随母同住的孩子</h3><div class="activity-portraits">${children.map(k=>`<button class="activity-person" onclick="A.go('kid',${k.id})">${porImg(k,68)}<span>${esc(k.name)} · ${kidAge(k)}岁</span></button>`).join('')}</div><p class="hint">${children.map(k=>esc(`${k.name}随${childResidenceCareLabel(k,youngChildMother(k))}${cName(youngChildMother(k))}住在这里`)).join('；')}。</p></section>`:'';
  if(!found)return residents;
  if(found.scene.kind==='guest')return youngGuestPanel(found,name)+residents;
  const {scene,child:k,mother}=found,act=scene.activity;
  const room=palaceConversation(act.title,act.prop,[{person:mother,line:act.mother,action:`A.go('consort',${mother.id})`},{person:k,line:act.child,action:`A.go('kid',${k.id})`}]);
  return `${room}${scene.result?`<p class="initiative-note" role="status">${esc(scene.result)}</p>`:`<p class="hint">你走到门边，母子还没有察觉。可以陪一会儿，也可以静静离开。</p><div class="acts"><button class="btn jade" onclick="A.joinNursery('join')" ${E().energy>0?'':'disabled'}>坐下陪陪他们<small>精力-1</small></button><button class="btn" onclick="A.joinNursery('watch')">放轻脚步，听一会儿</button></div>`}${residents}`;
}
A.joinNursery=function(mode){
  if(S.over||modalOpen||UI.view!=='palace'||!['join','watch'].includes(mode))return;
  const found=palaceLifeScene(UI.sel);if(!found||found.scene.kind!=='nursery'||found.scene.result)return;
  const {scene,child:k,mother}=found,join=mode==='join';if(join&&!useE())return;
  const small=kidAge(k)<3;
  scene.result=join?(small?'你放轻声音坐到身旁，孩子安安稳稳地偎在母亲怀里。':`${k.name}忙给你腾出位置，拉着你和${cName(mother)}一起把手边的事做完。`):'你在门边听了一会儿，没有惊动他们。临走时，嘱咐宫人添好灯油，放轻脚步。';
  recordFamilyTime(k,mother,scene.activity.title,join?(small?'母亲熟悉的声音就在身边，父皇也来陪伴。':scene.result):scene.activity.child,
    `${k.name}在身边。${join?scene.result:scene.activity.mother}`,{place:mother.palace,gain:join?6:2,stat:join?scene.activity.stat:undefined});
  if(join)k.love=clamp(k.love+5);save('auto');render();
};
