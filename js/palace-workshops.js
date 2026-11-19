/* 南府的节目单和尚衣局的工单，都随当朝存档。 */
const workshopsActive=()=>journalContentVersion()>=99;
function workshopBook(){
  const book=S.flags.palaceWorkshops;
  return book?.gen===S.gen?book:null;
}
function writeWorkshopBook(){return workshopBook()||(S.flags.palaceWorkshops={gen:S.gen});}
function workshopPresent(c){
  const d=S.flags.dowager;
  return inPalace(c)&&!c.maid&&!(dowagerIll(d)&&d.lastYears.caregiver===c.id);
}
function workshopAt(id){return workshopsActive()&&UI.view==='place'&&UI.sel===id&&!modalOpen&&!S.over;}
function workshopChild(k){return childInPalace(k)&&!k.pendingName&&kidAge(k)<15;}
function workshopPicker(id,people,label,action,enabled){
  if(!people.length)return '';
  return `<div class="acts workshop-picker"><span class="workshop-select"><select id="${id}" aria-label="${label}">${people.map(p=>`<option value="${p.id}">${esc(p.sex?kidName(p):cName(p)+' · '+fullName(p))}</option>`).join('')}</select></span><button class="btn jade" ${enabled?'':'disabled'} onclick="A.${action}(Number(document.getElementById('${id}').value))">${label}</button></div>`;
}
function rehearsalPiece(c){
  if(c.fixedStory==='ayimu')return {name:'白泉鼓引',line:'她把故乡的鼓句拆成三拍，教乐工等银铃声落尽再接末拍。',show:'阿依慕轻击鼓沿，乐工等她腕上的银铃停住才齐齐入拍。'};
  if(c.fixedStory==='xiaoman')return {name:'双碗藏钱',line:'她请乐工看住左边的碗，右手又把铜钱弹回搭档掌心，两人对准了揭碗的那一拍。',show:'岑小满与搭档各揭一碗，铜钱偏偏从拍板上滚了下来。两人并肩向席上谢彩。'};
  if(consortHobby(c)==='抚琴')return {name:'席前琴引',line:'她把收指处放慢半拍，让笛声有余地接进来。',show:fullName(c)+'停指留了一拍，席外一声短笛恰好接上，末音绕过池边。'};
  return {name:'折枝小令',line:'她试唱了一句，发现末字总被笙声盖住，便同乐工把收尾改成清唱。',show:fullName(c)+'唱到收尾，笙声依谱停住，最后一句在席间听得分明。'};
}
function availableProgram(){
  const p=workshopBook()?.program;
  return p&&S.turn<p.turn+6&&byId(p.artist)?.alive&&!byId(p.artist).gone?p:null;
}
function musicRoom(){
  const book=workshopBook(),p=availableProgram(),people=harem().filter(workshopPresent);
  const ready=!mourningActive()&&book?.lastRehearsal!==S.turn&&E().energy>0;
  return `<h2>南府乐房${backBtn}</h2>`+(p?
    `<p>节目单上留着${esc(fullName(byId(p.artist)))}的《${esc(p.name)}》，还能留 ${p.turn+6-S.turn} 个月。筹办御花园小宴时，先请本人入席，再勾选这个节目。</p><div class="acts">${banquetReady()&&!mourningActive()?'<button class="btn jade" onclick="A.openBanquet()">筹办御花园小宴</button>':''}<button class="btn quiet" onclick="A.withdrawWorkshopProgram()">撤下节目单</button></div>`:
    `<p>请妃嫔为御花园小宴排一段节目。少数人还可演一段自己的拿手戏。每月可排一次，耗 1 精力，节目单保留六个月。</p>`+
    (mourningActive()?'<p class="hint">宫中服丧，乐房暂歇。</p>':people.length?workshopPicker('music-artist',people,'请她排演','rehearseWorkshop',ready):'<p class="hint">眼下无人能来排演。</p>'));
}
A.rehearseWorkshop=function(id){
  const c=byId(id),book=workshopBook();
  if(!workshopAt('music')||!workshopPresent(c)||mourningActive()||availableProgram()||book?.lastRehearsal===S.turn||!useE())return;
  const piece=rehearsalPiece(c),state=writeWorkshopBook();state.lastRehearsal=S.turn;
  state.program={turn:S.turn,artist:id,name:piece.name,show:piece.show};
  lifeRecord([c],'craft','南府排演','【南府排演】'+fullName(c)+'与乐工商定《'+piece.name+'》。'+piece.line,'南府乐房');
  render();
};
A.withdrawWorkshopProgram=function(){if(workshopAt('music')&&availableProgram()){delete workshopBook().program;render();}};
function banquetProgramReady(draft,people,p){
  return p&&draft?.kind==='garden'&&people.some(c=>c.id===p.artist&&workshopPresent(c));
}
function workshopBanquetPanel(draft,people){
  const p=workshopsActive()&&availableProgram();if(!p||draft.kind!=='garden')return '';
  const c=byId(p.artist),ready=banquetProgramReady(draft,people,p),chosen=ready&&draft.programTurn===p.turn;
  return `<h3>南府节目单</h3><button class="btn sm ${chosen?'on':''}" aria-pressed="${!!chosen}" ${ready?'':'disabled'} onclick="A.toggleWorkshopProgram()">${esc(p.name)} · ${esc(fullName(c))}</button>${ready?'':'<p class="hint">须请排演者入席，当日能赴宴才可开演。</p>'}`;
}
A.toggleWorkshopProgram=function(){
  const d=banquetDraft(),f=d&&banquetKind(d.kind),p=availableProgram();
  if(!workshopsActive()||modalOpen||!f||!banquetProgramReady(d,banquetAttendees(d,f),p))return;
  if(d.programTurn===p.turn)delete d.programTurn;else d.programTurn=p.turn;render();
};
function performWorkshopProgram(draft,people){
  const p=workshopsActive()&&availableProgram();
  if(!banquetProgramReady(draft,people,p)||draft.programTurn!==p.turn)return '';
  const c=byId(p.artist);delete workshopBook().program;cchg(c,{mood:4});
  const k=people.find(x=>x.sex&&kidAge(x)>=5&&kidAge(x)<15),cast=[c];
  markPalaceRemembrance(c,'music',p.name);
  let text=p.show;
  if(k){markPalaceRemembrance(k,'music',p.name);cast.push(k);text+=kidName(k)+'听准了末拍，拿筷子在掌心跟了一遍。';skillGain(k,'lit',1);relAdd(k,c,3);}
  lifeRecord(cast,'craft','席上献艺','【南府节目·'+p.name+'】'+text,'御花园小宴');log('御花园小宴，'+fullName(c)+'依南府节目单演了《'+p.name+'》。');
  return text;
}

function wardrobeRecipient(o){return o.child?kidById(o.id):byId(o.id);}
function wardrobeOrder(){
  const o=workshopBook()?.order,r=o&&wardrobeRecipient(o);
  return r?.alive&&!r.gone&&!r.removedFromRoyal?o:null;
}
function wardrobeReady(o){
  const r=wardrobeRecipient(o);return S.turn>o.turn&&(o.child?childInPalace(r):workshopPresent(r));
}
function wardrobeReceipt(o){
  const r=wardrobeRecipient(o),ready=wardrobeReady(o);
  return `<p>${esc(o.child?kidName(r):fullName(r))}的${o.item} · ${S.turn===o.turn?'赶制中，下月可取':ready?'已制好':'已制好，等本人回宫得空再交付'}。</p><div class="acts"><button class="btn jade" ${ready?'':'disabled'} onclick="A.deliverWardrobe()">交付${o.item}</button></div>`;
}
function wardrobeRoom(){
  const o=wardrobeOrder();
  if(o)return `<h2>尚衣局${backBtn}</h2>`+wardrobeReceipt(o)+'<button class="btn quiet" onclick="A.closeWardrobeOrder()">撤下这张工单</button>';
  const children=kidsAlive().filter(workshopChild),women=harem().filter(workshopPresent),ready=E().energy>0&&workshopBook()?.lastOrder!==S.turn;
  return `<h2>尚衣局${backBtn}</h2><p>料子从宫中现存的布帛里挑。每月可下一单，耗 1 精力，下月交付。未到读书年纪的孩子做夹衣，满五岁做书袋；妃嫔可制随身香囊。</p>`+
    workshopPicker('wardrobe-child',children,'给孩子裁制','orderChildWardrobe',ready)+workshopPicker('wardrobe-lady',women,'给她做香囊','orderConsortWardrobe',ready);
}
function orderWardrobe(r,child){
  if(!workshopAt('wardrobe')||!r||!(child?workshopChild(r):workshopPresent(r))||wardrobeOrder()||workshopBook()?.lastOrder===S.turn||!useE())return;
  const book=writeWorkshopBook();book.lastOrder=S.turn;
  book.order={id:r.id,child,item:child?(kidAge(r)<5?'夹衣':'书袋'):'香囊',turn:S.turn};render();
}
A.orderChildWardrobe=id=>orderWardrobe(kidById(id),true);
A.orderConsortWardrobe=id=>orderWardrobe(byId(id),false);
A.closeWardrobeOrder=function(){if(workshopAt('wardrobe')&&wardrobeOrder()){delete workshopBook().order;render();}};
function personalWardrobePanel(r,child){
  const o=workshopsActive()&&wardrobeOrder();return (o&&o.id===r.id&&o.child===child?detailSection('尚衣局工单',wardrobeReceipt(o)):'')+remembrancePanel(r);
}
A.deliverWardrobe=function(){
  const o=wardrobeOrder();if(!workshopsActive()||S.over||modalOpen||!o||!wardrobeReady(o))return;
  const r=wardrobeRecipient(o);if(!workshopAt('wardrobe')&&(UI.view!==(o.child?'kid':'consort')||Number(UI.sel)!==r.id))return;
  const cast=[r];let line;
  if(o.child){
    const care=byId(r.foster||r.mom);
    line=o.item==='书袋'?'尚衣局送来新书袋，'+r.name+'把常读的那卷书放进去，试了试提带。':'尚衣局按旧衣量好长短做了夹衣，领边另衬了一层软布。';
    if(care&&workshopPresent(care)){
      cast.push(care);line+=fullName(care)+(o.item==='书袋'?'替孩子把最长的一支笔插进内袋。':'把袖口翻上一折，伸手试了试松紧。');
      recordFamilyTime(r,care,'一同试用'+o.item,line,line,{gain:4,place:'宫中',continuity:false});
    }
    r.love=clamp(r.love+2);
  }else{
    line=r.fixedStory==='suheng'?'苏蘅拆开香囊闻了闻，拈掉一味太冲的香料，重新系紧穗子。':
      consortHobby(r)==='刺绣'?fullName(r)+'把香囊翻过来细看收针，又向绣娘问了转角处怎样藏线。':fullName(r)+'亲手挑了系带的长短，系在随身佩带上。';
    cchg(r,{mood:4,aff:2});
  }
  markPalaceRemembrance(r,'wardrobe',o.item);
  delete workshopBook().order;
  lifeRecord(cast,'family','尚衣局交付','【尚衣局·'+o.item+'】'+line,'御赐衣物');
  log('尚衣局依旨将'+o.item+'送交'+(o.child?kidName(r):fullName(r))+'。');
  pushEv({title:'尚衣局 · '+o.item+'交付',por:r,text:line,choices:[{t:'记下此事'}]});
};
