/* Repeated palace duties have named, remembered participants. */
const HAREM_RETURN_MONTHS=6;
const haremReturnActive=()=>journalContentVersion()>=50;
function noteHaremVisit(c,kind='talk'){
  if(legacyPendingAction()||!inPalace(c))return;
  const modern=haremReturnActive();
  if(modern&&(c.maid||S.over))return;
  const absence=modern?haremAbsence():0;
  S.flags.haremAttendance={gen:S.gen,turn:S.turn};
  if(absence>=HAREM_RETURN_MONTHS)recordHaremReturn(c,kind,absence);
}
function recordHaremReturn(c,kind,months){
  const act=kind==='arrival'?`来到${c.palace}看她`:kind==='night'?'召她相伴':'与她当面说话';
  const guarded=lifeBoundary(c)||['悲恸','心如死灰','怨恨','惶恐'].includes(xinOf(c));
  const quiet=isSolitary(c)||['淡泊','沉静','持重'].includes(c.trait);
  const joy=!guarded&&!quiet&&(c.aff>=35||c.trait==='痴情');
  const feeling=guarded?'她先是一怔，依礼问安。许久未见，心头积下的话仍要等能开口时慢慢讲。':
    quiet?'她有些意外，先把手里的事安顿好。几个月没有当面说过话，听见熟悉的声音，心里也暖了一些。':
    joy?'她一听是陛下，欢喜得连原先想好的问安词都忘了，只顾着问这些日子可还安好。':
    '她听见通传还有些不敢相信。见过礼后，才松了松一直攥着的袖口。';
  const first=`陛下已有${months}个月未与后宫妃嫔相处，今日终于${act}。`;
  story(c,`【久别重逢】${first}${feeling}`);
  log(`久别后重回后宫：陛下已有${months}个月未与妃嫔相处，今日${kind==='night'?'召'+fullName(c)+'相伴':kind==='arrival'?'到'+c.palace+'看望'+fullName(c):'与'+fullName(c)+'当面说话'}。`);
  if(!guarded)cchg(c,{mood:joy?8:3});

  const observers=harem().filter(o=>o!==c&&inPalace(o)).sort((a,b)=>
    Number(b.palace===c.palace)-Number(a.palace===c.palace)||Math.abs(relGet(b,c))-Math.abs(relGet(a,c))||a.id-b.id).slice(0,4);
  const accounts=observers.map(o=>{
    const name=fullName(c),relation=relGet(o,c);
    const news=kind==='arrival'&&o.palace===c.palace
      ?`她住在同一宫，听见宫人通传陛下久别后来看${name}。`
      :`她听说陛下久别后先${kind==='night'?'召了':'见了'}${name}。`;
    const reaction=isRival(o,c)||relation<=-25||TRAITS[o.trait]?.jealous&&!isSolitary(o)
      ?'她听完心里泛酸，低声问贴身宫人，自己的宫门何时也能听到同样的通传。'
      :relation>=30?'她替对方高兴。下次相见时，她想问问两人这些时日过得可好。'
      :isSolitary(o)||['淡泊','沉静','持重'].includes(o.trait)
        ?'宫人还想多说几句，她只说知道了，便接着做手上的事。'
        :'她同宫人说，原以为这回又要等上几个月。说着说着，也盼哪天能当面问声安。';
    const line=news+reaction;
    story(o,'【六宫议论·久别重逢】'+line);
    return {person:o.id,subject:c.id,interpretation:line,channel:'hearsay',emotion:.2,impact:45};
  });
  NPCMemory.record(S,{type:'harem-return',time:S.turn,location:kind==='arrival'?c.palace:'宫中',
    participants:[c.id,...observers.map(o=>o.id)],outcome:first},[
    {person:c.id,subject:'emperor',interpretation:feeling,emotion:joy?.7:.3,impact:75},...accounts
  ]);
}
function haremAbsence(){
  const a=S.flags.haremAttendance;
  if(a?.gen===S.gen)return S.turn-a.turn;
  const recent=Math.max(0,...harem().flatMap(c=>[c.lastPersonalAttention??0,...(c.imperialNights||[])]));
  return S.turn-recent;
}
function jingtishiEvent(){
  if(S.over||mourningActive()||haremAbsence()<HAREM_RETURN_MONTHS||S.flags.cardReminderGen===S.gen&&S.turn-(S.flags.cardReminderTurn??-99)<4)return null;
  const women=harem().filter(c=>!c.cardWithdrawn&&!c.preg&&(!consortRecoveryActive()||!consortNightReason(c)));
  if(!women.length)return null;
  const valid=()=>!S.over&&!mourningActive()&&haremAbsence()>=HAREM_RETURN_MONTHS;
  return {title:'敬事房 · 捧牌候旨',valid,text:`陛下已有${haremAbsence()}个月未往后宫与妃嫔相处。\n敬事房总管候在御书房外，捧着绿头牌轻声道：“各宫的牌子都备下了。陛下若愿，今夜可召人相伴；若只想过去坐坐，奴才也好先去通传。”`,
    onShow:()=>{S.flags.cardReminderGen=S.gen;S.flags.cardReminderTurn=S.turn;log('敬事房因陛下久未入后宫，捧绿头牌至御书房候旨。');},choices:[
      {t:'把牌子呈上来',cond:()=>E().energy>0,why:'本月精力已尽',f:()=>{pushNow({title:'敬事房 · 今夜召谁',text:consortRecoveryActive()?'有孕、撤牌、不在宫中或尚在产后、小产后三个月调养期的人不列在此。':'有孕、撤牌或不在宫中的人不列在此。',choices:[
        ...women.filter(c=>inPalace(c)&&!c.cardWithdrawn&&!c.preg&&(!consortRecoveryActive()||!consortNightReason(c))).map(c=>({t:`${cName(c)} · ${fullName(c)}`,person:c,cond:()=>E().energy>0&&inPalace(c)&&!c.preg&&!c.cardWithdrawn&&(!consortRecoveryActive()||!consortNightReason(c)),why:'眼下不宜召见',f:()=>{nightWith(c);return null;}})),{t:'改日再说'}]});return null;}},
      {t:'只去后宫坐坐',f:()=>{UI.view='harem';return '总管收起牌匣，吩咐宫人备灯。可选一位妃嫔前去问候。';}},
      {t:'政务未完，暂且收起',f:()=>{log('帝命敬事房暂收绿头牌，继续处理政务。');return '总管依礼退下，过些时日再来请旨。';}}]};
}
function selectionDisposition(c){
  if(TRAITS[c.trait]?.jealous&&!isSolitary(c))return 'jealous';
  if(c.rank===8&&c.virtue>=65)return 'helpful';
  if(isSolitary(c)||['淡泊','沉静','持重'].includes(c.trait))return 'quiet';
  if(c.trait==='痴情'||c.favor<25)return 'uneasy';
  return 'curious';
}
function selectionThought(c,stage,names){
  const mode=selectionDisposition(c),what=stage==='planned'?'听说又要选秀':'听说'+(names.length?names.join('、')+'留选入宫':'本次没有留下新人');
  if(queenEmptySelectionActive()&&stage==='settled'&&!names.length&&c.rank!==8){
    const own=storyConsortEmptySelectionThought(c,mode);if(own)return own;
  }
  const personal=storyQueenSelectionThought(c,stage,names,mode,what);if(personal)return personal;
  if(stage==='settled'&&!names.length)return {mode,text:mode==='jealous'||mode==='uneasy'?'得知这次没有留下新人，她暗暗松了口气，面上仍守着礼数。':'本次没有留下新人，她听过名册的结果，照常料理自己的日子。',quote:mode==='helpful'?'既然没有留人，也盼她们平安回家，不必在宫门外空等。':'听说这回没有留新人。名册既已合上，便照旧过日子吧。'};
  const lines={
    jealous:[`${what}，她在人前仍按礼数应下，独处时却觉得心口发闷。`,c.rank===8?'臣妾会守着中宫的体面。只是名单添了人，心里也会难受……臣妾也盼陛下还肯来听听我的话。':'臣妾知道不能拦着。可眼看又添新人，心里不舒服，也不愿假装全不在意。'],
    helpful:[`${what}，她先想到各宫安顿、用度与新人的礼数，准备替陛下分忧。`,'入宫的人多，越要把住处、用度和礼数说明白。臣妾愿先教她们认路，也请各宫不要拿传言吓唬新人。'],
    quiet:[`${what}，她将话听明白，仍按自己的习惯过日子，没有把未见过的人当成敌手。`,'新来的人也得慢慢住惯。臣妾照旧过日子，先相处过，再说合不合得来。'],
    uneasy:[`${what}，她担心今后更难等到陛下，心里有些失落，却没有把过错推给新人。`,'臣妾不是要怪那些姑娘，只是怕往后见陛下更难了。若有空，仍来坐坐，好不好？'],
    curious:[`${what}，她好奇新人喜欢些什么，也想起自己初来时认错宫门的窘迫。`,'不知道新来的姑娘喜欢读书还是养花。她们若认不清路，臣妾倒可以告诉她们，自己当初也走错过。']
  };
  return {mode,text:lines[mode][0],quote:lines[mode][1]};
}
function captureSelectionCourt(){
  if(legacyPendingAction())return;
  const s=selectionBatch();s.residents=harem().map(c=>c.id);
  for(const c of harem()){
    const r=selectionThought(c,'planned',[]);c.selectionConcern={...r,batch:s.batch,stage:'planned',turn:S.turn};
    story(c,'【选秀消息】'+r.text);
  }
}
function finishSelectionCourt(s,members){
  if(legacyPendingAction()||!s||s.courtSettled)return;s.courtSettled=true;
  const names=members.map(fullName),queen=empress();
  const queenEmpty=queenEmptySelectionActive()&&!members.length&&s.batch&&!s.accepted?.length&&!S.over&&inPalace(queen);
  for(const id of s.residents||[]){const c=byId(id);if(!inPalace(c)||queenEmpty&&c===queen)continue;
    const r=selectionThought(c,'settled',names);c.selectionConcern={...r,batch:s.batch,stage:'settled',turn:S.turn};
    if(members.length)cchg(c,{mood:r.mode==='jealous'?-5:r.mode==='uneasy'?-2:0});
    story(c,'【选秀礼毕·六宫议论】'+r.text);
  }
  if(queenEmpty){queenEmptySelectionReaction(queen,s);return;}
  if(!members.length||!inPalace(queen)||!(s.residents||[]).includes(queen.id))return;
  s.council={queen:queen.id,members:members.map(c=>c.id),mode:selectionDisposition(queen),done:false};
  if(journalContentVersion()>=100)queueStoryQueenWelcome(queen,members,'selection');
}
A.selectionCouncil=function(){if(!modalOpen)pushEv(selectionCouncilEvent());};
function selectionCouncilEvent(s=S.selection){
  const a=s?.council,q=a&&byId(a.queen);if(!a||a.done||!inPalace(q)||q.rank!==8)return null;
  const newcomers=a.members.map(byId).filter(inPalace),valid=()=>!a.done&&inPalace(q)&&q.rank===8;
  const r=q.selectionConcern,helpful=a.mode==='helpful';
  const finish=(kind)=>{
    if(!valid())return null;a.done=true;noteHaremVisit(q);
    let text;
    if(kind==='help'){
      text=`皇后${fullName(q)}安排掌事女官带${newcomers.map(fullName).join('、')}认路习礼，核对住处与日常用度，不替任何人许诺恩宠。`;
      for(const c of newcomers){cchg(c,{mood:6});relAdd(q,c,4);story(c,`【中宫照料】入宫后，皇后${fullName(q)}安排女官带她认路、习礼，并核对了住处与用度。`);}
      cchg(q,{aff:4,mood:4});
    }else if(kind==='listen'){
      text='陛下听完她对选秀的心事，承认她也会不安，并约定不会因添了新人就省去问候；没有拿恩赏要求她立刻高兴。';cchg(q,{aff:5,mood:5});
    }else text='陛下将新人安顿交给掌事女官，听取中宫意见后，按既定宫规办理。';
    story(q,`【选秀后与陛下相谈】她说：“${r.quote}”${text}`);remember(q,'care',text);q.selectionConcern.reply=text;return text;
  };
  return {title:'选秀礼毕 · 中宫心事',por:q,valid,text:`本批名单已定：${newcomers.map(fullName).join('、')}。\n${r.text}\n她说：“${r.quote}”`,choices:[
    ...(helpful?[{t:'请皇后照应新人，依例安排',f:()=>finish('help')}]:[{t:'留下听她说，不敷衍她的心事',f:()=>finish('listen')}]),
    {t:'由掌事女官安顿，宫规一视同仁',f:()=>finish('routine')}]};
}
function selectionConcernVoice(c){const r=c?.selectionConcern;return r&&S.turn-r.turn<=4?voiceLine('selection-'+r.mode,r.text,r.quote):null;}
function selectionDiscussionPanel(){
  const s=S.selection;if(!s)return '';
  const residents=(s.residents||[]).map(byId).filter(c=>inPalace(c)&&c.selectionConcern?.batch===s.batch);
  if(journalContentVersion()>=32&&residents.length){
    const groups=new Map(),shown=residents.slice(0,5);
    for(const c of shown){const r=c.selectionConcern,key=r.text.slice(r.text.indexOf('，')+1).replace(/^她/,'');groups.set(key,[...(groups.get(key)||[]),c]);}
    const r=shown[0].selectionConcern,opening=r.stage==='planned'?'选秀的消息传到了六宫。':r.text.startsWith('得知这次没有留下新人')||r.text.startsWith('本次没有留下新人')?'这次选秀没有留下新人，六宫也得了消息。':r.text.slice(0,r.text.indexOf('，')).replace(/^听说/,'')+'，六宫各有心事。';
    return `<section class="detail-section"><h3>六宫听说选秀之后</h3><p>${esc(opening)}</p>${[...groups].map(([text,people])=>`<p>${people.map(c=>parentLink(c.id)).join('、')}${people.length>1?'都':''}${esc(text)}</p>`).join('')}${selectionCouncilEvent()?'<button class="btn jade" onclick="A.selectionCouncil()">听听皇后的话</button>':''}</section>`;
  }
  return residents.length?`<section class="detail-section"><h3>六宫听说选秀之后</h3>${residents.slice(0,5).map(c=>`<p><b>${parentLink(c.id)}</b>：${esc(c.selectionConcern.text)}</p>`).join('')}${selectionCouncilEvent()?'<button class="btn jade" onclick="A.selectionCouncil()">听听皇后的话</button>':''}</section>`:'';
}
