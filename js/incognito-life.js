/* Street encounters retain an accountable case, rather than instant verdicts. */
const INCOGNITO_SCENES={
  bridge:{title:'断桥旁的渡钱',place:'柳溪渡口',army:false,cost:45,months:3,
    scene:'老桥塌了一半，挑菜进城的农人只好绕到渡口。船家说水急难行，菜贩却拿出一叠层层加收的渡钱票，问这桥究竟还修不修。',
    action:'核验渡钱，修复便桥',success:'工部复验新桥，挑菜的农人已经能走过河。重复征收的渡钱退还原主，桥边立着工料账。',failure:'桥墩下的淤泥比预计更深，原定工期未完。渡口虽已停收重复的票钱，过河仍不方便。'},
  school:{title:'私塾门前的旧书',illustration:'school-window',place:'城南私塾',army:false,cost:30,months:2,
    scene:'私塾先生把一本翻散的书递给门外的孩子。孩子替人跑腿，凑不齐束脩，日日只在窗下听一小段。先生说，学田被邻庄占了多年，塾里也快揭不开锅。',
    action:'查验学田，恢复义学',success:'旧契与田界核验相合，学田收入归还私塾。几个曾在窗下听课的孩子，领到了旧桌凳和课本。',failure:'新旧地契的界址不一，县里尚未查明。暂拨的束脩只能让孩子先读几日，学田还没有交割。'},
  clinic:{title:'药铺的半张方子',place:'惠民药铺',army:false,cost:40,months:2,
    scene:'一位妇人把药方折起一半，只拣便宜的药抓。掌柜悄悄补了两味，却说官药局的平价药已经断供；后院还坐着几位等药的老人。',
    action:'核对药材账，补足惠民药',success:'太医核验药材后，药局恢复按方给药。先前那位妇人带着家人来复诊，掌柜把出入药簿摊给随行官员看。',failure:'运来的药材中有受潮的一批，太医退回重验。不能拿不合格的药交差，平价药仍须接续。'},
  wages:{title:'绣坊里迟到的工钱',place:'东街绣坊',army:false,cost:25,months:2,
    scene:'绣工正在赶一批宫中用的缎面。管事说上头未结账，工钱还得等；一位年长绣娘拿出按过指印的工簿，请你看看，已经等了三个月。',
    action:'核验织造工账，清结欠薪',success:'织造交出了已领官银的凭据，拖欠的工钱逐笔发给绣工，领款人各自核对了数目。',failure:'包工账中人名与工簿对不上，工钱只核清一半。剩余部分仍需逐人查验，不能由管事代领。'},
  veterans:{title:'军户门上的旧箭',place:'北城军户巷',army:true,cost:35,months:2,
    scene:'退伍老兵正教孙儿扎竹箭。他说边关弟兄的抚恤一直没到，家里不敢丢掉那张立功文书，怕往后再也找不着凭证。',
    action:'核军籍，补发军户抚恤',success:'兵部以军籍和战功册逐户核对，抚恤发到遗属手中。老兵说，这回终于不用拿着旧文书在衙门外等了。',failure:'部分战功册还留在边镇，抚恤名单未能核齐。已核实的先行发放，其余人仍在等回文。'},
  granary:{title:'米铺前的两杆秤',place:'西市米行',army:false,cost:20,months:2,
    scene:'你看见米铺收粮、卖粮各用一杆秤。买米的老人说分量总少一些，伙计却把他往外推。隔壁掌柜提醒你，还须验过秤和粮价账才知道是哪一环出了问题。',
    action:'公验斗秤，查粮价账',success:'官署当众校验了斗秤，查实短秤后责令补足米粮。粮价与斗秤标准贴在街口，邻铺也来核验。',failure:'米商拿出几本相互矛盾的账，官署还未核清囤粮与缺斤少两的范围。封存问题斗秤后，仍需追查。'},
  well:{title:'巷口的空水桶',place:'槐树巷',army:false,cost:35,months:3,
    scene:'晨光里，一条长队排到巷口。旧井塌了，附近几家都得去远处挑水；卖汤饼的夫妻把最后半桶清水让给一个带病孩的母亲。',
    action:'清理旧井，修通公共水渠',success:'清淤后的井水经过检验，水渠也接到巷口。汤饼铺重新开张，邻里轮流照看井栏，不再排半日长队。',failure:'掘井时发现渗漏，工匠封住井口重修。临时送水仍在继续，不能把尚未澄清的水交给百姓。'},
  theatre:{title:'灯下的一场小戏',place:'城东戏台',army:false,cost:15,months:1,
    scene:'小戏班在灯下唱一出团圆戏，老人听得落泪。散场时，班主收起破鼓，说坊里空地将被收走，戏班与夜市都不知道下月还能在哪落脚。',
    action:'核定坊市公地，留出演戏之处',success:'坊正核清了公地边界，夜市与戏台错开时辰共用场地。你再来时，破鼓已经补好，台下有人牵着孩子看戏。',failure:'戏台与邻家门道相冲，原方案不能照搬。坊正先安排临时场地，还要再议出入和夜间歇息的时辰。'}
};
function incognitoLedger(){
  if(legacyPendingAction())return '';
  const cases=governance().visits;
  return `<section class="detail-section"><h3>微服见闻与回访</h3>${cases.length?`<ul class="story">${cases.slice(-8).reverse().map(c=>`<li><time>${esc(c.date)} · ${esc(c.place)}</time><b>${esc(c.title)}</b><p>${esc(c.note)}</p><span class="hint">${c.status==='pending'?`承办：${esc(c.officerName)} · ${Math.max(0,c.due-S.turn)}个月后核验`:c.status==='heard'?'暂留见闻，尚未派人办理':c.status==='success'?'已办结并复访':c.status==='setback'?'仍有疏漏，等候批复':'已归档'}</span></li>`).join('')}</ul>`:'<p>微服走访所得，将记明地点、承办人和后续结果。</p>'}</section>`;
}
function incognitoCaseContact(file){
  const e=file.officerKey&&officialEntry(file.officerKey);
  return e?.p.id===file.officerId?e:null;
}
function beginIncognitoCase(id,e){
  const g=governance(),s=INCOGNITO_SCENES[id];
  if(g.visits.some(x=>x.id===id&&['pending','setback'].includes(x.status))||E().treasury<s.cost||e&&(!officialServing(e.p)||e.p.report))return null;
  chg({treasury:-s.cost});
  const file={id,title:s.title,place:s.place,date:dateStr(),turn:S.turn,due:S.turn+s.months,status:'pending',officerKey:e?.key,officerId:e?.p.id,officerName:e?.p.name||(s.army?'兵部核验司':'督察院巡察使'),note:s.action+'，待实地复验。',outcome:chance(.35+(e?.p.ability??65)/160)?'success':'setback'};
  g.visits.push(file);
  if(e){e.p.incognitoCase={id,turn:S.turn};officialRecord(e.c,e.role,`奉旨赴${s.place}，${s.action}；事起陛下微服所见，须${s.months}个月后据实回奏。`);officialFamilyReaction(e,'assigned',s.place+' · '+s.action);}
  log(`微服见闻「${s.title}」：交${file.officerName}${s.action}，拨银 ${s.cost} 万两。`,1);
  return `记下亲见之事，将凭据交${file.officerName}。${s.months}个月后核验，再谈功过。\n国库支出 ${s.cost} 万两。`;
}
function incognitoAssignEvent(id){
  const s=INCOGNITO_SCENES[id],entries=officialEntries().filter(e=>officialServing(e.p)&&!e.p.report&&!reliefSuspended(e.p)&&e.p.age<70&&(e.h.bloc==='army')===s.army).sort((a,b)=>b.p.ability-a.p.ability).slice(0,5);
  return {title:'民情交办 · '+s.place,text:`${s.action}。需拨银 ${s.cost} 万两，${s.months}个月后复验。可按才干择人承办，也可交部院另派巡察使。`,choices:[
    ...entries.map(e=>({t:`交${e.p.name} · ${e.p.office||e.p.post} · 才干 ${e.p.ability}`,person:e.p,cond:()=>officialServing(e.p)&&!e.p.report&&E().treasury>=s.cost,why:'官员正有差事或国库不足',f:()=>beginIncognitoCase(id,e)})),
    {t:'交部院另派巡察使',cond:()=>E().treasury>=s.cost,why:'国库不足',f:()=>beginIncognitoCase(id,null)},
    {t:'先记下，暂不交办',f:()=>noteIncognito(id)}]};
}
function noteIncognito(id){
  const s=INCOGNITO_SCENES[id];governance().visits.push({id,title:s.title,place:s.place,date:dateStr(),turn:S.turn,status:'heard',note:s.scene+'陛下听过后暂未交办。'});
  log(`微服至${s.place}，记下「${s.title}」，暂未交办。`);return '你记住地点和他们说过的话，尚未许诺事情已经办妥。';
}
function incognitoEvent(){
  const g=governance(),pool=Object.keys(INCOGNITO_SCENES).filter(id=>!g.visits.some(c=>c.id===id&&['pending','setback'].includes(c.status)));
  if(!pool.length)return null;
  const fresh=pool.filter(id=>!g.seenVisits.slice(-4).includes(id)),id=pick(fresh.length?fresh:pool),s=INCOGNITO_SCENES[id];
  return {title:'微服 · '+s.title,illustration:s.illustration,text:s.place+'。\n'+s.scene,onShow:()=>{g.seenVisits.push(id);g.seenVisits=g.seenVisits.slice(-8);},choices:[
    {t:'记下凭据，回宫择人查办',f:()=>{pushNow(incognitoAssignEvent(id));return null;}},
    {t:'多听一会儿，暂不交办',f:()=>noteIncognito(id)}]};
}
function incognitoTick(){
  for(const file of governance().visits){
    if(file.status!=='pending'||S.turn<file.due)continue;
    const s=INCOGNITO_SCENES[file.id],e=incognitoCaseContact(file);
    if(e&&(!officialAlive(e.p)||e.p.dismissed||e.p.exiled||e.p.retired)){
      delete e.p.incognitoCase;file.officerKey=null;file.officerId=null;file.officerName=s.army?'兵部接办官':'督察院接办官';file.due=S.turn+1;
      file.note='原承办官已不能继续当差，部院接手复核，回奏顺延一个月。';log(`「${file.title}」${file.note}`);continue;
    }
    if(e)delete e.p.incognitoCase;
    file.status=file.outcome;file.note=s[file.outcome==='success'?'success':'failure'];file.reportPending=true;
    chg({people:file.outcome==='success'?4:-1});
    log(`微服回访 · ${file.place}：${file.note}`,1);
    if(e){officialRecord(e.c,e.role,`${file.place}复验：${file.note}`,{emotion:file.outcome==='success'?.5:-.4});officialFamilyReaction(e,file.outcome,s.action);}
  }
}
function pendingIncognitoReport(){
  const file=governance().visits.find(c=>c.reportPending);if(!file)return null;
  const e=incognitoCaseContact(file),valid=()=>!!file.reportPending;
  return {title:'微服回访 · '+file.place,por:e?.p,valid,text:`承办：${file.officerName}\n${file.note}`,choices:[
    ...(file.status==='setback'?[{t:'拨银补救，一月后再核验 · 国库−20',cond:()=>E().treasury>=20,why:'国库不足',f:()=>{
      if(!valid())return null;chg({treasury:-20});file.reportPending=false;file.status='pending';file.outcome='success';file.due=S.turn+1;file.officerName='部院善后官';file.officerId=null;file.officerKey=null;
      file.note='已按复核清单拨银补救，由部院善后官接办，仍待回访。';log(`「${file.title}」${file.note}`);return file.note;
    }}]:[]),
    {t:file.status==='success'?'核验属实，记入民情簿':'先行归档，记明尚未办妥',f:()=>{file.reportPending=false;if(file.status==='setback')file.status='archived';return '这次见闻、承办与回访结果，已一并记在治国理政的民情簿里。';}}]};
}
