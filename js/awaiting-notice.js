/* Waiting for recognition is different from lacking affection or daily company. */
function awaitingNoticeReason(c){
  if(S.children.some(k=>k.mom===c.id)||!inPalace(c)||c.maid||c.age<18||c.cardWithdrawn||c.preg||consortRecoveryActive()&&consortNightReason(c)||c.hp<40||(c.nights||0)>0||
    !Number.isFinite(c.enteredAt)||S.turn-c.enteredAt<6||['悲恸','心如死灰','怨恨'].includes(xinOf(c)))return null;
  if(S.turn-(c.lastPersonalAttention??c.enteredAt)>=6&&c.favor<35)return 'forgotten';
  if(c.aff<60&&c.favor<55&&!isSolitary(c)&&c.trait!=='淡泊')return 'uncertain';
  return null;
}
function awaitingNoticeWords(c){
  const forgotten=awaitingNoticeReason(c)==='forgotten';
  if(isSolitary(c)||c.trait==='淡泊')return '臣妾不求夜夜热闹。只是久无人问津，也会想，陛下是否还记得这里住着谁。';
  return ({proud:'臣妾嘴上说不在意，可看着别人的牌子一回回被翻起，也会怕自己从未被放在心上。',
    reserved:'臣妾入宫已有些时日，仍未承召。不敢凭空猜测圣意，只想听一句明白话。',
    direct:'臣妾还没有侍寝过，心里也会不安。比起让人猜来猜去，臣妾想直接问陛下。',
    bright:'原先总想，明日也许就能多见一面。等久了，连准备好的趣事都不知讲给谁听。',
    maker:'本来想把心思放在手里的事上，可夜里收起灯，还是会想起自己一直没有承召。',
    gentle:forgotten?'臣妾怕的不是今夜等不到，是陛下已经忘了臣妾。若能坐下来听几句话，也会安心些。':'臣妾尚未承召，偶尔会想，是不是哪里做得不好。知道不该乱想，却还是想听陛下说句话。'})[companionStyle(c)];
}
function awaitingNoticeVoice(c){return awaitingNoticeReason(c)?voiceLine('awaiting-notice','她犹豫着说起等待中的心事。',awaitingNoticeWords(c)):null;}
function awaitingNoticeEvent(only,skipId){
  const list=harem().filter(c=>(!only||c===only)&&c.id!==skipId&&awaitingNoticeReason(c)&&S.turn-(c.lastAwaitingNotice??-99)>=12);
  if(!list.length||(!only&&!chance(.12)))return null;
  const c=pick(list),words=awaitingNoticeWords(c),valid=()=>!!awaitingNoticeReason(c);
  return {title:'未翻起的牌',por:c,present:[c],valid,onQueue:()=>{c.lastAwaitingNotice=S.turn;story(c,`【久候的心事】${words}`);cchg(c,{mood:-4});},
    text:`${cName(c)}入宫已有${Math.floor((S.turn-c.enteredAt)/12)?Math.floor((S.turn-c.enteredAt)/12)+'年':S.turn-c.enteredAt+'个月'}，尚未侍寝。\n“${words}”`,choices:[
      {t:'留下听她说话，告诉她仍被记着',f:()=>{if(!valid())return null;c.lastPersonalAttention=S.turn;story(c,'说出久候的不安后，陛下留下听她说话。虽未因此侍寝，却知道自己没有被遗忘。');remember(c,'care','我说出未承召的心事，陛下留下认真听完。');return fx(cchg(c,{mood:10,aff:5}));}},
      {t:'今夜相伴',cond:()=>E().energy>0&&!c.cardWithdrawn&&(!consortRecoveryActive()||!consortNightReason(c)),f:()=>{if(valid())nightWith(c);return null;}},
      {t:'眼下仍不得空',f:()=>{if(!valid())return null;story(c,'谈及尚未承召的心事，陛下仍不得空；她收起话头，心中失落。');remember(c,'neglect','说出久候的心事，仍没能等到相伴。');return fx(cchg(c,{mood:-6}));}}
    ]};
}
A.awaitingNotice=function(id){if(!modalOpen)pushEv(awaitingNoticeEvent(byId(id)));};
A.toggleGreenCard=function(id){
  const c=byId(id);if(modalOpen||S.over||!c?.alive||c.gone||c.maid)return;
  c.cardWithdrawn=!c.cardWithdrawn;
  const text=c.cardWithdrawn?'奉旨撤下绿头牌，暂停侍寝。':'奉旨恢复绿头牌，重新列入敬事房名册。';
  story(c,text);remember(c,'family',text);log(fullName(c)+text,1);render();
};

function firstNightWait(c){
  const entry=c.enteredAt??(c.accessionArrival?.gen===S.gen?c.accessionArrival.started:null)??(c.knownBeforeAccession&&S.gen===1?0:null);
  return Number.isFinite(entry)?S.turn-entry:0;
}
function queenCanMentionFirstNight(q,c){
  return inPalace(c)&&!c.maid&&c!==q&&c.age>=18&&firstNightWait(c)>=12&&
    !(c.nights>0||c.imperialNights?.length)&&
    !(c.hp<40)&&!consortNightReason(c);
}
function queenFirstNightReminder(){
  if(journalContentVersion()<107||S.over||mourningActive()||mourningNightPause())return null;
  const q=empress(),d=S.flags.dowager;
  const queenReady=()=>inPalace(q)&&q===empress()&&!(q.hp<40)&&!(q.illnessRecovery?.until>S.turn)&&
    !(dowagerIll(d)&&d.lastYears.caregiver===q.id);
  if(!queenReady())return null;
  const book=S.flags.queenFirstNight?.gen===S.gen?S.flags.queenFirstNight:null;
  if(book&&S.turn-book.last<6)return null;
  const last=c=>book?.mentioned?.[c.id]??-Infinity;
  const c=harem().filter(c=>queenCanMentionFirstNight(q,c)&&S.turn-last(c)>=12)
    .sort((a,b)=>(last(a)-last(b))||firstNightWait(b)-firstNightWait(a)||a.id-b.id)[0];
  if(!c)return null;
  const name=fullName(c),months=firstNightWait(c);
  const years=Math.floor(months/12),wait=(years<100?cnNum(years):years)+'年'+(months%12?'零'+cnNum(months%12)+'个月':'');
  const words=Number.isFinite(last(c))?
    `前次奏过${name}的事。如今她入宫已有${wait}，敬事房簿上仍是空的。臣妾再来问一句，可要先替陛下去看看她？`:
    `${c.palace}的${name}入宫已有${wait}，敬事房簿上还没有她侍寝的记载。臣妾掌着六宫，理当替她提一句。若陛下今日不得空，臣妾也好代您问声安。`;
  const valid=()=>!S.over&&!mourningActive()&&queenReady()&&queenCanMentionFirstNight(q,c);
  return {title:'中宫奏事 · 久未承召',por:q,cast:[c],present:[q],firstNightConsort:c.id,valid,
    text:`皇后${fullName(q)}将名册翻到折角处：“陛下，${words}”`,
    onShow:()=>{
      const ledger=book||(S.flags.queenFirstNight={gen:S.gen,mentioned:{}});
      if(ledger.mentioned[c.id]===S.turn)return;
      ledger.last=S.turn;ledger.mentioned[c.id]=S.turn;
      story(q,`【久未承召】核阅敬事房名册，见${name}入宫${wait}尚未侍寝，便在御前为她提了一句。`);
      log(`皇后奏及${name}入宫${wait}尚未承召。`);
    },
    choices:[
      {t:'朕记下了，暂不安排'},
      {t:'请皇后代朕问安',f:()=>{if(!valid())return null;
        const text=`皇后遣人到${c.palace}传来陛下的问候。${name}听说自己的名字还被记着，向来人道了谢。`;
        story(c,'【中宫传问安】'+text);story(q,`奉旨向${name}传了问候，回宫后听到了她的谢意。`);
        return text+fx(cchg(c,{mood:4}));}},
      {t:'今夜翻她的牌（精力−1）',cond:()=>valid()&&E().energy>=1,why:'此时不能翻牌或精力不足',f:()=>{if(valid()&&E().energy>=1)nightWith(c);return null;}}
    ]};
}
