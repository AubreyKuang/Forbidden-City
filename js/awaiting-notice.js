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
function awaitingNoticeEvent(only){
  const list=harem().filter(c=>(!only||c===only)&&awaitingNoticeReason(c)&&S.turn-(c.lastAwaitingNotice??-99)>=12);
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
