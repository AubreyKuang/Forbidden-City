/* Loaded only by dev.html. No eval: edits are validated data patches with one-step rollback. */
const DEV={
  target:'emp',draft:null,source:null,patch:null,
  clone:value=>JSON.parse(JSON.stringify(value)),
  record(key=DEV.target){
    if(!S)return null;
    if(key==='emp')return E();if(key==='world')return S;if(key==='dowager')return S.flags.dowager;
    const [type,id]=key.split(':');return type==='kid'?kidById(+id):type==='consort'?byId(+id):null;
  },
  checkJSON(value){
    if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){
      if(['__proto__','prototype','constructor'].includes(key))throw Error('属性名不可用：'+key);
      DEV.checkJSON(item);
    }
    if(typeof value==='number'&&!Number.isFinite(value))throw Error('数值必须是有限数字');
  },
  validate(key,patch){
    const original=DEV.record(key);if(!original||!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('请选择人物，并输入一个属性对象');
    DEV.checkJSON(patch);const next={...DEV.clone(original),...DEV.clone(patch)},kind=key.split(':')[0];
    for(const field of ['id','sex'])if(field in original&&next[field]!==original[field])throw Error(field+' 是固定身份标识，不可修改');
    if(kind==='kid'&&Object.hasOwn(patch,'age')){
      if(!Number.isInteger(patch.age)||patch.age<0||patch.age>130)throw Error('年龄需为 0–130 的整数');
      const remainder=((S.turn-original.born)%12+12)%12;next.born=S.turn-patch.age*12-remainder;delete next.age;
    }
    if(Object.hasOwn(next,'age')&&(!Number.isInteger(next.age)||next.age<0||next.age>130))throw Error('年龄需为 0–130 的整数');
    const stats=kind==='emp'?['health','prestige','people','wen','wu']:kind==='kid'?['lit','mar','vir','hp','amb','love','sup']:kind==='consort'?['looks','talent','virtue','scheme','favor','mood','aff']:[];
    for(const field of stats)if(next[field]!==undefined&&(!Number.isFinite(next[field])||next[field]<0||next[field]>100))throw Error(field+' 需在 0–100 之间');
    for(const [field,value] of Object.entries(original)){
      if(value===null||value===undefined||!Object.hasOwn(next,field))continue;
      if(['portraitOverride','portraitVariant'].includes(field)&&next[field]===null)continue;
      if(typeof value==='number'&&(!Number.isFinite(next[field])))throw Error(field+' 必须是数字');
      if(typeof value==='boolean'&&typeof next[field]!=='boolean')throw Error(field+' 必须是真或假');
      if(Array.isArray(value)&&!Array.isArray(next[field]))throw Error(field+' 必须是数组');
    }
    for(const field of ['name','given','sur','era'])if(Object.hasOwn(next,field)&&(typeof next[field]!=='string'||!next[field].trim()))throw Error(field+' 不可为空');
    if(next.portraitOverride!=null&&(!Number.isInteger(next.portraitOverride)||next.portraitOverride<0||next.portraitOverride>=PORTRAIT_COUNT))throw Error('立绘编号不在图集范围内');
    if(next.portraitVariant!=null&&(!Number.isInteger(next.portraitVariant)||next.portraitVariant<0||next.portraitVariant>=portraitVariantCount(next)))throw Error('皇嗣形象编号需为 0–'+(portraitVariantCount(next)-1));
    if(kind==='consort'){
      if(!Number.isInteger(next.rank)||next.rank<0||next.rank>8)throw Error('位分需在 0–8 之间');
      if(!TRAITS[next.trait])throw Error('请选择已有性情');
      if(!Number.isInteger(next.preg)||next.preg<0||next.preg>10)throw Error('孕月需在 0–10 之间');
      if(next.cold)next.palace='冷宫';else if(!['坤宁宫',...PALACES].includes(next.palace))throw Error('请选择有效宫殿，解除冷宫时也需更换住处');
      if(next.rank===8&&!next.cold&&S.consorts.some(c=>c.id!==next.id&&inPalace(c)&&c.rank===8))throw Error('已有皇后，请先调整原皇后的位分');
      if(next.rank===8&&!next.cold)next.palace='坤宁宫';
    }
    if(kind==='kid'){
      if(!Number.isFinite(next.born)||next.born>S.turn)throw Error('出生时间不能在未来');
      if(!byId(next.mom))throw Error('生母编号不存在');next.momName=fullName(byId(next.mom));
      if(next.foster!=null&&(!byId(next.foster)||next.foster===next.mom))throw Error('养母必须是另一位已登记妃嫔');
    }
    if(key==='world'){
      if(!validPalaceSave(next)||!next.flags||!Array.isArray(next.log)||!Array.isArray(next.cands))throw Error('完整属性缺少必要的存档字段');
      if(!Number.isInteger(next.year)||next.year<1||!Number.isInteger(next.month)||next.month<1||next.month>12)throw Error('年月无效');
      const people=[...next.consorts,...next.children],ids=people.map(p=>p.id);
      if(ids.some(id=>!Number.isInteger(id))||new Set(ids).size!==ids.length)throw Error('人物编号必须唯一');
      const oldPeople=[...original.consorts,...original.children];
      if(people.length!==oldPeople.length||people.some(p=>!oldPeople.some(o=>o.id===p.id&&o.sex===p.sex)))throw Error('完整属性编辑不能替换人物编号或身份');
      if(!Number.isInteger(next.nid)||next.nid<=Math.max(0,...ids))throw Error('下一个人物编号必须大于现有编号');
      if(next.children.some(k=>!next.consorts.some(c=>c.id===k.mom)))throw Error('有皇嗣的生母编号不存在');
      const numeric=(person,fields)=>fields.forEach(field=>{if(!Number.isFinite(person[field])||person[field]<0||person[field]>100)throw Error(field+' 需在 0–100 之间');});
      numeric(next.emp,['health','prestige','people','wen','wu']);
      if(!Number.isFinite(next.emp.treasury)||!Number.isFinite(next.emp.energy)||!STYLES[next.emp.style])throw Error('皇帝属性不完整');
      for(const c of next.consorts){numeric(c,['looks','talent','virtue','scheme','favor','mood','aff']);if(!TRAITS[c.trait]||!Number.isInteger(c.rank)||c.rank<0||c.rank>8)throw Error('妃嫔性情或位分无效');}
      for(const k of next.children){numeric(k,['lit','mar','vir','hp','amb','love']);if(!Number.isFinite(k.born)||k.born>next.turn)throw Error('皇嗣出生时间无效');if(k.foster!=null&&(!next.consorts.some(c=>c.id===k.foster)||k.foster===k.mom))throw Error('养母编号无效');}
      for(const person of [next.emp,...next.consorts])if(!Number.isInteger(person.age)||person.age<0||person.age>130)throw Error('年龄需为 0–130 的整数');
      if(next.consorts.filter(c=>c.alive&&!c.gone&&!c.cold&&c.rank===8).length>1)throw Error('不能同时有两位皇后');
    }
    return next;
  },
  previewAge(value){
    const age=Number(value);if(!DEV.draft||!Number.isInteger(age)||age<0||age>130)return;
    if(DEV.target.startsWith('kid:')){DEV.draft.born=S.turn-age*12;DEV.draft.portraitOverride=null;}
    else DEV.draft.age=age;
    DEV.gallery();
  },
  saveAge(){
    const input=$('#dev-fields').querySelector('[data-dev-field="age"]');if(!input)throw Error('当前对象没有年龄字段');
    const patch={age:Number(input.value)};if(input.value==='')throw Error('请填写年龄');
    if(DEV.target.startsWith('kid:'))patch.portraitOverride=null;
    DEV.applyPatch(DEV.target,patch);DEV.refresh();DEV.message('年龄已保存，立绘已按年龄更新。');
  },
  jumpTime(amount,unit='month'){
    if(!S||S.over||modalOpen)throw Error('请先进入游戏并处理当前事件');
    if(!['month','year'].includes(unit)||!Number.isInteger(amount)||amount<1)throw Error('请输入正整数月数或年数');
    const months=amount*(unit==='year'?12:1);if(months>1200)throw Error('单次最多跳过一百年');
    const before=DEV.clone(S),years=Math.floor((S.month-1+months)/12);
    localStorage.setItem(SKEY+'dev-backup',JSON.stringify(before));
    try{
      S.turn+=months;S.year+=years;S.month=(S.month-1+months)%12+1;
      for(const p of [E(),...S.consorts,...S.cands])if(p.alive!==false)p.age+=years;
      // born-based children, spouses and descendants age automatically with S.turn.
      // This is a debug calendar/age jump; it never chooses story outcomes for the user.
      POR.clear();ART_CACHE.clear();resetMapPosition(S.pos||{x:100,y:82});
      if(!save('auto'))throw Error('存档失败，时间快进已撤回');
      render();DEV.refresh();DEV.message(`已跳过${amount}${unit==='year'?'年':'个月'}，现为${dateStr()}。人物年龄已同步，可回退。`);
    }catch(error){S=before;render();throw error;}
  },
  applyPatch(key,patch){
    if(modalOpen)throw Error('请先处理当前游戏事件，再修改属性');
    const next=DEV.validate(key,patch),before=DEV.clone(S);
    localStorage.setItem(SKEY+'dev-backup',JSON.stringify(before));
    try{
      if(key==='world')S=next;else Object.assign(DEV.record(key),next);
      reconcilePalaceRomance();POR.clear();ART_CACHE.clear();resetMapPosition(S.pos||{x:100,y:82});
      if(!save('auto'))throw Error('自动存档失败，修改已撤回');
      render();return next;
    }catch(error){S=before;render();throw error;}
  },
  restore(){
    if(modalOpen)throw Error('请先处理当前游戏事件');
    const raw=localStorage.getItem(SKEY+'dev-backup');if(!raw)throw Error('尚无可回退的修改');
    const backup=JSON.parse(raw);if(!validPalaceSave(backup))throw Error('备份不可读取');
    const before=S;S=backup;if(!save('auto')){S=before;throw Error('存档失败，未回退');}
    POR.clear();ART_CACHE.clear();resetMapPosition(S.pos||{x:100,y:82});render();DEV.refresh();DEV.message('已回退到上次修改之前。');
  },
  copyProduction(){
    if(modalOpen)throw Error('请先处理当前游戏事件');
    const copy=SaveManager.load(localStorage,'chengongji_v1_auto',validPalaceSave,migratePalaceSave);
    if(!copy)throw Error('没有可复制的正式版自动存档，可先新开一局');
    if(S)localStorage.setItem(SKEY+'dev-backup',JSON.stringify(S));
    const before=S;S=copy;if(!save('auto')){S=before;throw Error('测试存档保存失败');}
    migrate();UI.view='map';render();DEV.refresh();DEV.message('已载入正式版自动存档的副本。');
  },
  message(text){$('#dev-status').textContent=text;},
  safely(fn){try{fn()}catch(e){DEV.message(e.message)}},
  open(){ $('#dev-panel').hidden=false;DEV.refresh(); },
  close(){ $('#dev-panel').hidden=true; },
  refresh(){
    const select=$('#dev-target');select.innerHTML='<option value="emp">皇帝</option><option value="dowager">太后</option>'+(S?[...S.consorts.map(c=>`<option value="consort:${c.id}">妃嫔 · ${esc(fullName(c))}${c.alive?'':'（已故）'}</option>`),...S.children.map(k=>`<option value="kid:${k.id}">皇嗣 · ${esc(kidName(k))}</option>`)].join(''):'')+'<option value="world">完整世界／存档属性</option>';
    if(!DEV.record())DEV.target='emp';select.value=DEV.target;DEV.select(DEV.target);
  },
  select(key){
    $('#dev-panel').scrollTop=0;
    $('#dev-target').value=key;
    DEV.target=key;const record=DEV.record();DEV.patch=null;$('#dev-confirm').disabled=true;$('#dev-preview').textContent='预览修改后，才能保存。';
    if(!record){$('#dev-fields').innerHTML='<p>请先新开一局，或载入正式版存档副本。</p>';$('#dev-json').value='';$('#dev-gallery').innerHTML='';return;}
    DEV.source=JSON.stringify(record);DEV.draft=DEV.clone(record);$('#dev-json').value=JSON.stringify(record,null,2);
    const kind=key.split(':')[0],stats={emp:[['sur','国姓'],['name','名讳'],['era','年号'],['age','年龄'],['health','龙体'],['wen','文才'],['wu','武略'],['treasury','国库'],['prestige','威望'],['people','民心'],['energy','精力']],consort:[['sur','姓氏'],['given','名字'],['age','年龄'],['rank','位分'],['palace','宫殿'],['trait','性情'],['looks','容貌'],['talent','才情'],['virtue','德行'],['scheme','心机'],['favor','恩宠'],['mood','心情'],['aff','情分'],['preg','孕月'],['alive','在世'],['cold','冷宫'],['gone','出宫']],kid:[['name','名字'],['age','年龄'],['lit','才学'],['mar','武艺'],['vir','品德'],['hp','体魄'],['amb','野心'],['love','父爱'],['sup','支持'],['title','封号'],['mom','生母编号'],['foster','养母编号（可留空）'],['alive','在世'],['away','就藩'],['jailed','圈禁'],['married','婚事已定'],['tutor','太傅']],dowager:[['name','称谓'],['alive','在世']],world:[]}[kind]||[];
    $('#dev-fields').innerHTML=stats.map(([field,label])=>{
      let value=kind==='kid'&&field==='age'?kidAge(record):record[field];
      const options=field==='trait'?Object.keys(TRAITS):field==='palace'?['坤宁宫',...PALACES,'冷宫']:field==='rank'?RANKS:null;
      if(options)return `<label>${label}<select data-dev-field="${field}" data-dev-type="${field==='rank'?'number':'string'}">${options.map((o,i)=>`<option value="${esc(field==='rank'?i:o)}" ${(field==='rank'?i:o)===value?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
      const bool=['alive','cold','gone','away','jailed','married','tutor'].includes(field),number=typeof value==='number'||['age','foster'].includes(field);
      return `<label>${label}<input data-dev-field="${field}" data-dev-type="${bool?'boolean':number?'number':'string'}" type="${bool?'checkbox':number?'number':'text'}" ${field==='age'?'min="0" max="130" step="1" oninput="DEV.previewAge(this.value)"':''} ${bool?(value?'checked':''):`value="${esc(value??'')}"`}>${field==='age'?'<button type="button" class="btn sm jade" onclick="DEV.safely(DEV.saveAge)">应用年龄</button>':''}</label>`;
    }).join('');
    $('#dev-advanced').open=kind==='world';DEV.gallery();DEV.message('已读取当前属性。');
  },
  gallery(){
    const kind=DEV.target.split(':')[0],p=DEV.draft;if(!p)return;
    let choices=[];
    if(kind==='kid')choices=Array.from({length:portraitVariantCount(p)},(_,v)=>({value:v,cell:childPortraitCell({...p,portraitVariant:v}),label:'形象 '+(v+1)}));
    else if(kind==='emp')choices=[12,13].map(cell=>({cell,value:cell,label:cell===12?'青年':'壮年'}));
    else if(kind==='consort')choices=[...CONSORT_PORTRAITS,...WESTERN_PORTRAITS,8,9,10,11].map(cell=>({cell,value:cell,label:PORTRAIT_CLOTHES[cell]||'形象 '+cell}));
    $('#dev-gallery').innerHTML=choices.map(({cell,value,label})=>{
      ensurePortraitSheet(cell);
      const current=kind==='kid'?childPortraitCell(p):p.portraitOverride??(kind==='emp'?(p.age>=40?13:12):portraitCell(p));
      const src=portraitAtlasReady(cell)?atlasPortrait(cell,0):'';
      const selected=kind==='kid'&&p.portraitOverride==null?childPortraitVariant(p)===value:current===cell;
      return `<button type="button" class="dev-face" aria-pressed="${selected}" onclick="DEV.face(${value})">${src?`<img src="${src}" alt="">`:''}<span>${esc(label)}</span></button>`;
    }).join('');
  },
  face(value){
    if(DEV.target.startsWith('kid:')){DEV.draft.portraitVariant=value;DEV.draft.portraitOverride=null;}else DEV.draft.portraitOverride=value;
    DEV.patch=null;$('#dev-confirm').disabled=true;DEV.gallery();DEV.message('已选立绘，请预览修改后保存。');
  },
  preview(json=false){
    const original=DEV.record();if(JSON.stringify(original)!==DEV.source)throw Error('游戏状态已变化，请点击“重新读取”后再修改');
    let patch;
    if(json)patch=JSON.parse($('#dev-json').value);
    else{
      patch={};$('#dev-fields').querySelectorAll('[data-dev-field]').forEach(input=>{
        const key=input.dataset.devField,type=input.dataset.devType;
        if(type==='boolean')patch[key]=input.checked;else if(type==='number'){if(input.value===''&&key==='foster')patch[key]=null;else{if(input.value==='')throw Error(key+' 不可为空');patch[key]=Number(input.value)}}else patch[key]=input.value;
      });
      for(const key of ['portraitOverride','portraitVariant'])if(Object.hasOwn(DEV.draft,key))patch[key]=DEV.draft[key];
    }
    const next=DEV.validate(DEV.target,patch),changes=Object.keys(next).filter(k=>JSON.stringify(original[k])!==JSON.stringify(next[k]));
    const labels={lit:'才学',mar:'武艺',vir:'品德',hp:'体魄',amb:'野心',love:'父爱',sup:'支持',age:'年龄',treasury:'国库',health:'龙体',wen:'文才',wu:'武略',favor:'恩宠',mood:'心情',aff:'情分',talent:'才情',virtue:'德行',scheme:'心机',looks:'容貌',rank:'位分',palace:'宫殿',trait:'性情',preg:'孕月',portraitOverride:'立绘编号',portraitVariant:'皇嗣形象（0–'+(portraitVariantCount(next)-1)+'）'};
    DEV.patch=patch;$('#dev-preview').textContent=changes.length?changes.map(k=>k==='born'&&DEV.target.startsWith('kid:')?`年龄：${kidAge(original)} → ${Math.floor((S.turn-next.born)/12)} 岁`:`${labels[k]||k}：${JSON.stringify(original[k])??'未设置'} → ${JSON.stringify(next[k])}`).join('\n'):'没有发生修改';
    $('#dev-confirm').disabled=!changes.length;DEV.message('预览已生成，确认后写入测试存档。');
  },
  confirm(){
    if(!DEV.patch)throw Error('请先预览修改');if(JSON.stringify(DEV.record())!==DEV.source)throw Error('游戏状态已变化，请重新读取');
    DEV.applyPatch(DEV.target,DEV.patch);DEV.refresh();DEV.message('修改已生效并保存，可回退上一次修改。');
  }
};
function mountDevTools(){
  const root=document.createElement('div');root.innerHTML=`<button id="dev-launch" onclick="DEV.open()">DEV · 金手指</button><section id="dev-panel" role="dialog" aria-label="金手指面板" hidden>
    <div class="dev-head"><h2>金手指</h2><button class="btn sm" onclick="DEV.close()">收起</button></div><p class="dev-help">测试模式 · 独立测试存档。选择人物，修改数值或立绘，预览后保存。</p>
    <div class="dev-actions"><button class="btn sm" onclick="DEV.safely(DEV.copyProduction)">载入正式版存档副本</button><button class="btn sm" onclick="DEV.safely(DEV.restore)">回退上一次修改</button></div>
    <section class="dev-time"><h3>跳过时间</h3><p class="dev-help">快进日历与人物年龄，便于预览成长。随机剧情、政务和生育不在这里自动结算，可回退上一次修改。</p><div class="dev-actions"><input id="dev-time-amount" type="number" min="1" max="1200" step="1" value="12" aria-label="跳过数量"><select id="dev-time-unit" aria-label="时间单位"><option value="month">个月</option><option value="year">年</option></select><button class="btn jade" onclick="DEV.safely(()=>DEV.jumpTime(Number($('#dev-time-amount').value),$('#dev-time-unit').value))">跳过并保存</button></div></section>
    <label>编辑对象<select id="dev-target" onchange="DEV.safely(()=>DEV.select(this.value))"></select></label><div class="dev-actions"><button class="btn sm" onclick="DEV.refresh()">重新读取当前属性</button></div>
    <div id="dev-fields" class="dev-fields"></div><h3>立绘预览</h3><div id="dev-gallery" class="dev-gallery"></div>
    <div class="dev-actions"><button class="btn jade" onclick="DEV.safely(()=>DEV.preview())">预览常用属性修改</button></div>
    <details id="dev-advanced"><summary>完整属性 JSON</summary><p class="dev-help">这里可编辑其余数值、标记、家族、记忆和嵌套属性；人物编号与性别保持固定。皇嗣出生时间使用 born，常用年龄编辑会自动换算。</p><textarea id="dev-json" aria-label="完整属性 JSON" spellcheck="false"></textarea><button class="btn sm" onclick="DEV.safely(()=>DEV.preview(true))">预览完整属性修改</button></details>
    <pre id="dev-preview" aria-label="修改预览"></pre><button id="dev-confirm" class="btn gold" disabled onclick="DEV.safely(DEV.confirm)">确认并保存修改</button><p id="dev-status" role="status"></p>
  </section>`;document.body.appendChild(root);
  $('#dev-panel').addEventListener('input',()=>{DEV.patch=null;$('#dev-confirm').disabled=true;DEV.message('属性已改动，请重新预览。');});
  portraitSheets.map(sheet=>sheet.image).forEach(atlas=>atlas.addEventListener('load',()=>{if(!$('#dev-panel').hidden&&DEV.draft)DEV.gallery()}));
}
mountDevTools();
