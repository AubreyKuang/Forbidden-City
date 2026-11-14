/* Adult responsibility and the missing child's search outlive the foundling's placement. */
function birthSwapCase(k){return !!(k?.birthSwap?.occurred&&k.birthSwap.confirmed&&!S.over);}
function birthSwapOriginalText(k){
  const s=k.birthSwap,original=s.original,m=byId(s.claimedMother),father=original?.birthTraits?.father;
  const mother=m?fullName(m):s.claimedMotherName;
  const birth=original?`接生记录与当值医官、稳婆的证词一致：${mother}当夜确曾分娩，产下${original.sex==='m'?'一名男婴':'一名女婴'}。`:'旧案的分娩记录尚不完整，不能凭空补出一名亲生孩子。';
  const kin=!father?'旧档没有留下可核实的生父记录，暂不能断定为皇帝亲生。':father.kind==='emperor'?`再与起居记录核对，原来孩子的生父为${father.name}，确为皇帝亲生。`:`核对起居、书笺与证词，原来孩子的生父为${father.name}，并非因生在宫中就能认作皇帝亲生。`;
  const found=s.recovered&&kidById(s.recovered);
  return `${birth}\n${kin}\n${found?`孩子已寻回，现名${found.name}。${found.alive?'出生年月与亲缘另立入册。':'其后身故的经过仍见个人纪事。'}`:s.search?.status==='searching'?`已派人沿送养文契追访，${Math.max(0,s.search.due-S.turn)}个月后回奏。`:'原来的孩子仍未寻到。安置换入的孩子、问罪主使，都不会结束寻亲。'}`;
}
function recoverOriginalChild(k,reason){
  const s=k.birthSwap;if(!s.original||s.recovered)return s.recovered&&kidById(s.recovered);
  const original=JSON.parse(JSON.stringify(s.original));
  original.id=S.nid++;original.name=suggestName(original.sex);original.ord=S.children.filter(c=>c.sex===original.sex).length+1;
  original.pendingName=false;original.alive=true;original.recoveredFromSwap=true;original.story||=[];
  const m=byId(s.claimedMother);
  if(!inPalace(byId(original.foster||original.mom)))delete original.foster;
  // Restore saved biology, including a non-imperial father if one was established at conception.
  if(original.parentage?.father?.kind==='prince')original.parentage.status='suspected';
  S.children.push(original);s.recovered=original.id;
  if(s.search)s.search.status='found';
  kstory(original,`${reason}，接回后另赐名“${original.name}”，出生年月与原始亲缘保留。`);
  if(m?.alive){story(m,`失散的亲生孩子${original.name}被接回。`);cchg(m,{mood:25});setXin(m,'释然','失散的亲生孩子被寻回');}
  return original;
}
function beginBirthSwapSearch(k){
  if(!birthSwapCase(k)||!k.birthSwap.original||k.birthSwap.recovered||k.birthSwap.search?.status==='searching'||E().treasury<15||E().energy<1)return null;
  if(!useE())return null;chg({treasury:-15});const s=k.birthSwap;
  const attempt=(s.search?.attempt||0)+1;
  // Route length is stable even in old saves; repeating a load cannot reroll a search.
  s.search={attempt,status:'searching',due:S.turn+2,finds:attempt>=1+voiceHash(`${k.seed||k.id}:lost-child`)%3};
  const line='已派人复查稳婆亲眷、送养文契与沿途关津，另请医官随行；两个月后回奏。';
  kstory(k,line);const m=byId(s.claimedMother);if(m?.alive)story(m,'陛下另派人手，继续追查失散孩子的去向。');save('auto');return line;
}
function birthSwapOriginalEvent(k){
  if(!birthSwapCase(k))return null;const s=k.birthSwap;
  return {title:'换婴案 · 原来的孩子',cast:[byId(s.claimedMother),s.recovered&&kidById(s.recovered)],valid:()=>birthSwapCase(k),
    text:birthSwapOriginalText(k),choices:[
      ...(!s.recovered&&s.original?[{t:'另派人手追查 · 精力−1 · 国库−15',cond:()=>s.search?.status!=='searching'&&E().energy>=1&&E().treasury>=15,why:s.search?.status==='searching'?'追访尚在途中':'精力或国库不足',f:()=>beginBirthSwapSearch(k)}]:[]),
      {t:'记下调查结论'}]};
}
function birthSwapSearchReport(){
  const k=S.children.find(k=>birthSwapCase(k)&&!k.birthSwap.recovered&&k.birthSwap.search?.status==='searching'&&S.turn>=k.birthSwap.search.due);
  if(!k)return null;const s=k.birthSwap,search=s.search;
  return {title:'换婴案 · 寻亲回奏',cast:[byId(s.claimedMother)],valid:()=>birthSwapCase(k)&&!s.recovered&&search.status==='searching',
    text:search.finds?'送养文契、关津记录与照护人家的证词已逐一核对。随行医官找到了当年被带走的孩子，正在等旨护送回宫。':'追访查到了当年的转送人家，但照护人家后来搬离。文契上另有一处去向，可以继续追查；不能只因尚未找到就断言孩子已死。',choices:[
      {t:search.finds?'接回孩子，恢复亲缘记录':'收下新线索，另议追访',f:()=>{
        if(search.status!=='searching'||s.recovered)return null;
        if(search.finds){const original=recoverOriginalChild(k,'循送养文契与沿途证词寻回');save('auto');return `${original.name}已回宫，生母与生父按查明的记录入册。`;}
        search.status='lead';save('auto');return '新线索已存入案卷，可在孩子或涉案妃嫔详情中继续派人追访。';
      }}]};
}
function birthSwapJusticeEvent(k){
  if(!birthSwapCase(k)||k.birthSwap.justice?.decision)return null;
  const s=k.birthSwap,a=byId(s.plotter),m=byId(s.claimedMother);
  const valid=()=>birthSwapCase(k)&&!s.justice?.decision;
  return {title:'换婴案 · 问罪主使',cast:[a,a!==m?m:null],valid,danger:true,
    onShow:()=>{s.justice||={};s.justice.pending=true;save('auto');},
    text:`稳婆供词、出入簿与交付财物的记录已经相互印证。${a?fullName(a):'当年的主使'}指使调换孩子。${a===m?'产妇本人参与了此事，应与经手人分别问罪。':`${m?fullName(m):s.claimedMotherName}确曾分娩，孩子被人带走，属于受害者。`}\n${a?.alive?(a.cold?'主使已在冷宫，仍须为此案另行定责。':a.gone?'已命人向其离宫居所传旨，离宫不免此案责任。':'主使已被传来听审。'):'主使已经身故，可追记罪责，继续查办当年经手人。'}\n孩子的安置与寻亲另案继续，不因成人获罪而中止。`,
    choices:a?.alive?[
      {t:'废为庶人，押入冷宫',f:()=>resolveBirthSwapJustice(k,'cold')},
      {t:a.cold||a.gone?'削去两级位分，原处所留置':'削去两级位分，留宫察看',f:()=>resolveBirthSwapJustice(k,'demote')},
      {t:'下旨赐死主使……',f:()=>{pushNow(birthSwapExecutionEvent(k));return null;}},
      {t:'暂缓定罚，保留案卷'}
    ]:[{t:'追记罪责，查办经手人',f:()=>resolveBirthSwapJustice(k,'record')}]};
}
function resolveBirthSwapJustice(k,decision,confirmed=false){
  if(!birthSwapCase(k)||k.birthSwap.justice?.decision||!['cold','demote','execute','record'].includes(decision))return null;
  const s=k.birthSwap,a=byId(s.plotter),m=byId(s.claimedMother);
  if(decision==='execute'&&!confirmed||decision!=='record'&&!a?.alive||decision==='record'&&a?.alive)return null;
  const name=a?fullName(a):'当年的主使';let line;
  if(decision==='cold'){
    const wasQueen=a.rank===8;a.oldPalace=a.cold?a.oldPalace:a.palace;a.rank=0;a.title='';a.cold=true;a.gone=false;a.palace='冷宫';delete a.templeStay;delete a.visitor;
    if(wasQueen)chg({prestige:-10,people:-3});cchg(a,{mood:-45,aff:-35,favor:-35});clanEcho(a,'down');setXin(a,'怨恨','换婴案定罪，废为庶人');
    line=`${name}因主使换婴被废为庶人，押入冷宫，案卷记明罪责。`;
  }else if(decision==='demote'){
    a.rank=Math.max(0,a.rank-2);if(a.palace==='坤宁宫'&&a.rank<8&&!a.cold&&!a.gone)assignPalace(a);
    cchg(a,{mood:-25,aff:-15,favor:-25});clanEcho(a,'down');line=`${name}因主使换婴被削去两级位分，既有禁闭或离宫状态不因此解除。`;
  }else if(decision==='execute'){
    a.alive=false;a.preg=0;delete a.pregnancyFather;delete a.pregnancyCalendar;delete a.templeStay;delete a.visitor;
    a.deathReason='因主使换婴奉旨赐死';clanEcho(a,'down');chg({prestige:-5});line=`${name}因主使换婴被赐死；两名孩子与无辜生母不连坐。`;
  }else line=`${name}的换婴罪责追记入案，经手宫人与稳婆另行查办。`;
  s.justice={decision,pending:false,turn:S.turn,result:line};
  if(a){story(a,line);remember(a,'hurt',line);}
  if(m?.alive&&m!==a){cchg(m,{aff:decision==='demote'?2:8,mood:decision==='demote'?3:12});story(m,line);remember(m,'care','陛下查明孩子被调换，为我问罪主使');if(a)relAdd(m,a,-40);}
  kstory(k,line);reconcilePalaceRomance();log(line,1);save('auto');return line;
}
function birthSwapExecutionEvent(k){
  const a=byId(k.birthSwap?.plotter);if(!birthSwapCase(k)||!a?.alive||k.birthSwap.justice?.decision)return null;
  return {title:'换婴案 · 赐死前复核',cast:[a],danger:true,valid:()=>birthSwapCase(k)&&a.alive&&!k.birthSwap.justice?.decision,
    text:`是否下诏赐死主使${fullName(a)}？这会永久结束她的人生，但不会杀害换入的孩子，也不会停止寻找被带走的孩子。`,choices:[
      {t:'确认赐死主使',f:()=>resolveBirthSwapJustice(k,'execute',true)},
      {t:'收回旨意，另议处罚',f:()=>{pushNow(birthSwapJusticeEvent(k));return null;}}]};
}
function pendingBirthSwapJustice(){return birthSwapJusticeEvent(S.children.find(k=>birthSwapCase(k)&&k.birthSwap.justice?.pending&&!k.birthSwap.justice.decision));}
function birthSwapCasePanel(k){
  if(!birthSwapCase(k))return '';const s=k.birthSwap,a=byId(s.plotter);
  return `<section class="swap-case"><p><strong>换婴案卷</strong> · ${s.justice?.decision?'成人已定罚':'成人问罪待办'}</p><p class="hint">${esc(s.justice?.result||`主使：${a?fullName(a):'当年的涉案人'}。孩子安置后，仍可另行问罪。`)}</p><p class="hint">${esc(s.recovered?'原来的孩子已寻回。':s.search?.status==='searching'?'寻亲进行中，等待回奏。':'原来的孩子尚未寻到，线索仍在追查。')}</p><div class="acts"><button class="btn" onclick="A.swapOriginal(${k.id})">核对亲生孩子与寻亲</button>${!s.justice?.decision?`<button class="btn" onclick="A.swapJustice(${k.id})">审理换婴主使</button>`:''}</div></section>`;
}
A.swapOriginal=function(id){if(!modalOpen)pushEv(birthSwapOriginalEvent(kidById(id)));};
A.swapJustice=function(id){if(!modalOpen)pushEv(birthSwapJusticeEvent(kidById(id)));};
