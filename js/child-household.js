/* Young children live with their current caregiver; visits reveal domestic scenes. */
function youngChildMother(k){
  if(!childInPalace(k)||k.pendingName||kidAge(k)>=6)return null;
  const mother=byId(k.foster||k.mom);
  return inPalace(mother)&&mother.palace&&mother.palace!=='冷宫'?mother:null;
}
function childResidence(k){
  if(!childInPalace(k)||k.pendingName||kidAge(k)>=6)return '';
  const mother=youngChildMother(k);
  return mother?`随${k.foster?'养母':'生母'}${cName(mother)}同住 · ${mother.palace}`:'暂由乳母照料，未随母同住';
}
A.visitChildHome=function(id){
  if(!S||S.over||modalOpen)return;
  const mother=youngChildMother(kidById(id)),destination=mother&&PLACES.find(p=>p.k==='palace'&&p.p===mother.palace);
  if(destination)A.visitMapActivity(destination.id);
};
const nurseryChildren=name=>kidsAlive().filter(k=>youngChildMother(k)?.palace===name);
function nurseryActivity(k,m){
  const age=kidAge(k),strict=['城府','骄矜','骄纵'].includes(m.trait),last=k.nurseryLastKind;
  if(age<1)return {id:'cradle',title:'窗下哄睡',prop:'软枕 · 小摇篮',mother:strict?'方才还在吩咐宫务，她听见孩子哼唧，声音不自觉地放轻了。':'她轻轻哼着家乡的小调，一只手护着孩子的后背。',child:'孩子攥住她的袖角，睫毛一颤一颤，渐渐睡熟了。'};
  if(age<3)return {id:'steps',title:'扶案学步',prop:'软垫 · 布老虎',mother:m.trait==='将门'?'“再走一步。娘在这儿，接着你。”':'她蹲下身张开双手，等孩子自己迈过门边的小垫子。',child:'孩子晃晃悠悠扑进她怀里，又回头去够那只布老虎。'};
  const options=[];
  if(m.mood<35)options.push({id:'comfort',title:'小手拭泪',prop:'绢帕 · 窗前小凳',mother:'她望着窗外出神，回过神时，孩子已经把绢帕塞进她手里。',child:'“是不是有人惹娘难过？我陪着你。”',stat:'vir'});
  if(['才女','聪慧','好学','沉静'].includes(m.trait)||m.talent>=70||k.policy==='读书')options.push({id:'letters',title:'膝前认字',prop:'字帖 · 小砚台',mother:strict?'“这一笔要稳。写累了便歇一会儿，不能只求快。”':'“先认自己的名字。往后写信，就会落款了。”',child:'“那我也能给父皇写一封吗？”',stat:'lit'});
  if(m.trait==='巧手'||m.like==='字画')options.push({id:'ribbon',title:'彩线与花枝',prop:'彩线 · 花样纸',mother:'她把复杂的花样收起来，换一朵小花，让孩子自己挑颜色。',child:'“我要把这朵歪的也留下，它是我做的。”',stat:'lit'});
  if(['将门','活泼','爽直'].includes(m.trait)||k.policy==='习武')options.push({id:'play',title:'榻前小将军',prop:'木马 · 布老虎',mother:'她摆好两只软枕当山门，笑着让孩子想办法把布老虎送过去。',child:'“先让小马走前面，我护着后面！”',stat:'mar'});
  if(['温婉','好客'].includes(m.trait)||['嗜甜','擅厨艺'].includes(m.t2))options.push({id:'cakes',title:'小厨房的点心',prop:'蒸笼 · 花糕模',mother:'她将一小团面放在孩子手心，任那双小手捏成圆圆扁扁的形状。',child:'“最大的给娘，这一块留给父皇。”'});
  options.push({id:'tale',title:'灯前听旧事',prop:'小灯 · 绘本',mother:strict?'她讲起自己幼时学规矩闹过的笑话，说到一半，也忍不住笑了。':'她讲起小时候在家中放纸鸢的事，孩子听得忘了摆弄手中的玩具。',child:'“娘小时候，也会被人说调皮吗？”'});
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
    const k=pick(children),mother=youngChildMother(k),activity=nurseryActivity(k,mother);
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
  const residents=children.length?`<section class="nursery-residents"><h3>随母同住的孩子</h3><div class="activity-portraits">${children.map(k=>`<button class="activity-person" onclick="A.go('kid',${k.id})">${porImg(k,68)}<span>${esc(k.name)} · ${kidAge(k)}岁</span></button>`).join('')}</div><p class="hint">${children.map(k=>esc(`${k.name}随${k.foster?'养母':'生母'}${cName(youngChildMother(k))}住在这里`)).join('；')}。</p></section>`:'';
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
