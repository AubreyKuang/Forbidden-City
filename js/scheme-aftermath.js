/* ============ 宫斗余波 ============
   After a scheme is proven (punishEv), the verdict leaves a lasting trace on the
   offender. A light fine makes a fond consort ashamed and a cold one merely
   relieved; three light verdicts in a row teach her she can get away with it.
   Demotion or the cold palace leaves fear, or resentment towards the victim.
   Each trace is a 心境 with its own later scene, so the player sees the result
   of the earlier ruling rather than only a number change.
   Journal content 168+; older scenes replay without it. */
const SCHEME_AFTERMATH_VERSION=168;
function schemeAftermathActive(){return journalContentVersion()>=SCHEME_AFTERMATH_VERSION;}

Object.assign(XIN,{
 '愧疚':{c:'y',d:6,expr:'worry',mood:-1,scheme:-1,lines:['说话时总避开{who}的名字。问起近况，只说该多抄几卷经。','罚俸的旨意她收得平静，这几日的饭菜却动得极少。']},
 '余悸':{c:'y',d:5,expr:'worry',mood:-2,scheme:-1.5,lines:['听见廊下有脚步声，她就停了手里的针线，等人走远了才接着做。','宫女说，主子把从前常用的几味香都收起来了，说闻着心慌。']},
 '侥幸':{c:'r',d:6,expr:'',mood:1,scheme:.5,lines:['谢恩时规规矩矩，起身那一下，嘴角却松了。','罚俸的事她只当没有发生过，照旧打听{who}宫里的动静。']},
 '有恃无恐':{c:'r',d:10,expr:'',mood:2,scheme:2,lines:['说起旧事满不在乎：“陛下宽厚，臣妾一直记着。”','见了{who}也不让路。宫人背地里说，那几回罚俸算是白罚了。']},
});
NEGX.push('愧疚','余悸');

function schemeRecord(c){return c.schemeRecord ||= {n:0,lenient:0};}
// The decision text tells the player what has happened before, so the choice is informed.
function schemeAftermathHistory(c){
  if(!schemeAftermathActive())return '';
  const r=c.schemeRecord;if(!r?.n)return '';
  const tail=r.lenient>=2?`前${r.lenient}回都只罚了俸。`:r.last==='fine'?'上回只罚了俸。':r.last==='demote'?'上回已降过位分。':'';
  return `\n这已是她第${r.n+1}回事发。${tail}`;
}
function schemeAftermathFineLabel(c){
  if(!schemeAftermathActive())return '念其初犯，罚俸了事';
  const r=c.schemeRecord;
  if(!r?.n)return '念其初犯，罚俸了事';
  return r.lenient>=2?`再罚一回俸（已连着${r.lenient}回从轻）`:'罚俸了事';
}
const SCHEME_VERDICT_NAME={fine:'罚俸',demote:'降位禁足',cold:'打入冷宫'};
// 人物详情 shows her record, so the history is visible outside the verdict scene too.
function schemeAftermathDetail(c){
  const r=c?.schemeRecord;if(!r?.n)return '';
  const streak=r.lenient>=2?`，已连着${r.lenient}回从轻`:'';
  return `<div class="hint" style="margin-top:4px">宫斗事发 ${r.n} 回 · 最近一回：${esc(r.crime||'')}，${SCHEME_VERDICT_NAME[r.last]||''}${streak}</div>`;
}
function schemeAftermathXin(c,k,why,who){
  // Resentment towards the emperor or utter despair outweighs these afterthoughts.
  if(['怨恨','心如死灰'].includes(xinOf(c))&&c.xin?.who==='emp')return false;
  setXin(c,k,why,who);return xinOf(c)===k;
}
// verdict: 'cold' | 'demote' | 'fine'. Returns extra result text.
function schemeAftermath(a,victim,crime,verdict){
  if(!schemeAftermathActive()||!a)return '';
  const r=schemeRecord(a),v=victim&&victim.alive&&!victim.gone?victim:null,who=v?v.id:null;
  r.n++;r.last=verdict;r.lastTurn=S.turn;r.crime=crime;
  if(verdict==='fine'){
    r.lenient++;if(journalContentVersion()>=171)r.everFined=true;
    if(r.lenient>=3){
      a.scheme=clamp(a.scheme+6);
      schemeAftermathXin(a,'有恃无恐',`${crime}事发，又只罚了俸`,who);
      story(a,`【宫斗余波】${crime}事发，连着${r.lenient}回都只罚了俸。她不再怕事发了。`);
      remember(a,'care',`${crime}事发，陛下又只罚了俸`);
      if(v)story(v,`【宫斗余波】${fullName(a)}害人事发已是第${r.n}回，这回仍只罚了俸。`);
      // The rest of the palace hears that proven schemes cost little.
      const bold=harem().filter(o=>o!==a&&!isSolitary(o)&&o.scheme>=60);
      bold.forEach(o=>{o.scheme=clamp(o.scheme+2)});
      log(`宫中私下议论：${fullName(a)}连着${r.lenient}回害人事发，都只罚了俸。`,0);
      bold.forEach(o=>story(o,`【宫中风声】听说${fullName(a)}连着${r.lenient}回害人事发都只罚了俸，心思又活络起来。`));
      return `\n她连着${r.lenient}回只被罚俸，往后怕是更不知收敛。`;
    }
    if(a.aff>=60){
      a.scheme=clamp(a.scheme-6);
      schemeAftermathXin(a,'愧疚',`${crime}事发，陛下从轻发落`,who);
      story(a,`【宫斗余波】${crime}事发，陛下只罚了俸。罚得这样轻，她反倒坐立不安。`);
      remember(a,'care',`${crime}事发，陛下从轻发落，给她留了余地`);
      return '\n罚得这样轻，她回宫后几夜没睡好。';
    }
    a.scheme=clamp(a.scheme+2);
    schemeAftermathXin(a,'侥幸',`${crime}事发，只罚了俸`,who);
    story(a,`【宫斗余波】${crime}事发，只罚了俸。她暗自庆幸，只记下下回要做得更干净。`);
    return '';
  }
  r.lenient=0;
  if(verdict==='demote'){
    if(a.aff>=45||!v){
      a.scheme=clamp(a.scheme-8);
      schemeAftermathXin(a,'余悸',`${crime}事发，被降了位分`,who);
      story(a,`【宫斗余波】${crime}事发，降为${RANKS[a.rank]}。往后听见慎刑司三个字，她都会心里一紧。`);
      if(v)story(v,`【宫斗余波】${crime}查明是${fullName(a)}所为，陛下将她降为${RANKS[a.rank]}。`);
      return '\n她吓得不轻，往后多半会收敛。';
    }
    relAdd(a,v,-15);
    schemeAftermathXin(a,'怨恨',`${crime}事发被降位，把账记在了${fullName(v)}头上`,who);
    story(a,`【宫斗余波】${crime}事发，降为${RANKS[a.rank]}。她不认这个错，只怪${fullName(v)}不肯罢休。`);
    story(v,`【宫斗余波】${crime}查明是${fullName(a)}所为，陛下将她降为${RANKS[a.rank]}。宫人说她不认错，怨${fullName(v)}不肯罢休。`);
    return `\n她不认错，这笔账记在了${cName(v)}头上。`;
  }
  // 冷宫: the existing verdict already leaves her resentful. A consort who still
  // cared for the emperor regrets it instead.
  if(a.aff>=60){
    a.scheme=clamp(a.scheme-10);
    setXin(a,'愧疚',`${crime}事发，被打入冷宫`,who);
    story(a,`【宫斗余波】打入冷宫后，她托看守捎话：“是臣妾糊涂。”`);
    return '\n她托看守捎来一句话：“是臣妾糊涂。”';
  }
  return '';
}

function schemeAftermathPair(c,x){
  const w=x?.who&&byId(x.who);
  return w&&w.alive&&!w.gone&&inPalace(w)&&inPalace(c)?w:null;
}
Object.assign(XEV,{
 '愧疚':(c,x)=>{
  const w=schemeAftermathPair(c,x);if(!w)return null;
  return {title:'赔罪',por:c,cast:[c,w],present:[c],text:`${cName(c)}求见，手里捧着自己抄的一卷经：“上回的事，陛下罚得轻，臣妾心里过不去。求陛下准臣妾去${cName(w)}宫里当面赔罪。”`,choices:[
   {t:'准她去',f:()=>{
     const forgive=relGet(w,c)>-70&&chance(.35+w.virtue/200+(TRAITS[w.trait]?.jealous?-.15:0));
     if(forgive){relAdd(c,w,20);c.scheme=clamp(c.scheme-5);setXin(c,'释然',`${fullName(w)}收下了赔礼`);
       story(c,`亲自去${fullName(w)}宫里赔罪，对方收下了她抄的经。`);story(w,`${fullName(c)}登门赔罪。她收下了经卷，这件事算是过去了。`);
       return `${cName(w)}沉默了很久，还是收下了经卷。${fx(cchg(c,{mood:8}))}`;}
     relAdd(c,w,5);story(c,`去${fullName(w)}宫里赔罪，对方闭门不见。`);story(w,`${fullName(c)}登门赔罪，她没有开门。`);
     return `${cName(w)}宫门紧闭，只让宫女传了一句“心领了”。${fx(cchg(c,{mood:-5}))}`;}},
   {t:'朕替你把话带到',f:()=>{relAdd(c,w,8);story(c,`求去${fullName(w)}宫里赔罪，陛下答应替她把话带到。`);story(w,`陛下转达了${fullName(c)}的歉意。`);return fx(cchg(c,{aff:3,mood:4}))}},
   {t:'“罚过了，不必再提。”',f:()=>{story(c,`求去${fullName(w)}宫里赔罪，陛下说罚过了，不必再提。`);return fx(cchg(c,{mood:-3}))}}]};
 },
 '余悸':c=>c.cold?null:{title:'惊梦',por:c,text:`${cName(c)}宫里的掌事姑姑来回话：“小主自打上回受罚，夜里常惊醒，说梦见慎刑司来拿人。奴婢斗胆来求陛下。”`,choices:[
   {t:'去看看她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();setXin(c,'释然','受罚后陛下亲自来看她');story(c,'受罚后惊梦不断，陛下亲自来看她。她说往后不会再犯。');return `她攥着你的袖子说了很多，最后一句是：“臣妾往后不敢了。”${fx(cchg(c,{aff:6,mood:12}))}`}},
   {t:'让太医开安神汤',f:()=>{story(c,'受罚后惊梦不断，陛下让太医送来安神汤。');return fx(chg({treasury:-2}),cchg(c,{mood:5}))}},
   {t:'“知道怕就好。”',f:()=>{c.scheme=clamp(c.scheme-3);story(c,'受罚后惊梦不断，掌事姑姑去求陛下，只带回一句“知道怕就好”。');if(c.aff<30){setXin(c,'怨恨','受罚后惊梦不断，陛下一句“知道怕就好”','emp');}return fx(cchg(c,{mood:-6}))}}]},
 '侥幸':(c,x)=>{
  const w=schemeAftermathPair(c,x);if(!w)return null;
  return {title:'旧态',por:c,cast:[c,w],present:[c],text:`有宫人回话：${cName(c)}罚俸后没几天，又打听起${cName(w)}宫里的饮食起居，还往小厨房塞了银子。`,choices:[
   {t:'召她来敲打',f:()=>{c.scheme=clamp(c.scheme-6);setXin(c,'惶恐','罚俸后又起心思，被陛下点破');story(c,'罚俸后又打听旁人起居，被陛下当面点破。');return fx(cchg(c,{mood:-8,favor:-5}))}},
   {t:`撤换${cName(w)}宫里的小厨房`,f:()=>{c.scheme=clamp(c.scheme-2);story(c,`罚俸后往${fullName(w)}宫里小厨房塞银子，那里的人被陛下撤换了。`);story(w,'陛下撤换了她宫里的小厨房。');return fx(chg({treasury:-3}),cchg(w,{aff:4}))}},
   {t:'由她去',f:()=>{c.scheme=clamp(c.scheme+4);relAdd(c,w,-5);story(c,`罚俸后又打听${fullName(w)}宫里的起居，陛下没有追问。`);return '你没有追问。'}}]};
 },
 '有恃无恐':(c,x)=>{
  const w=schemeAftermathPair(c,x);if(!w)return null;
  return {title:'气焰',por:c,cast:[c,w],present:[c,w],text:`御花园里，${cName(c)}当着众人拿${cName(w)}打趣：“上回那点事，陛下都没计较，妹妹何必记到今天？”\n${cName(w)}脸色发白，没有接话。周围的人都低下了头。`,choices:[
   {t:'当众斥责她',f:()=>{const r=schemeRecord(c);r.lenient=0;c.scheme=clamp(c.scheme-10);setXin(c,'惶恐','仗着从前轻罚，被陛下当众斥责');setXin(w,'释然','陛下当众替她说了话');story(c,`在御花园拿旧事打趣${fullName(w)}，被陛下当众斥责。`);log(`${fullName(c)}在御花园拿旧事打趣${fullName(w)}，被当众斥责。`,0);story(w,`${fullName(c)}在御花园拿旧事打趣她，陛下当众斥责了那一位。`);return fx(cchg(c,{mood:-12,favor:-10}),cchg(w,{aff:6,mood:8}),chg({prestige:1}))}},
   {t:'一笑置之',f:()=>{c.scheme=clamp(c.scheme+5);relAdd(c,w,-8);setXin(w,'委屈',`${fullName(c)}当众拿旧事打趣，陛下只是笑了笑`,c.id);story(c,`在御花园当众拿旧事打趣${fullName(w)}，陛下一笑置之。`);story(w,`${fullName(c)}在御花园当众拿旧事打趣她，陛下只是笑了笑。`);harem().forEach(o=>{if(o!==c&&o!==w&&!isSolitary(o)&&o.scheme>=60)o.scheme=clamp(o.scheme+2)});return fx(cchg(w,{aff:-5,mood:-10}))}}]};
 },
});
