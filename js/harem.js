/* ============ 选秀 ============ */
function genCands(n=6){S.cands=[];for(let i=0;i<n;i++)S.cands.push(makeGirl());{const kc=harem().filter(c=>c.fam.p>=15&&hasClan(c));if(kc.length&&chance(.4))S.cands[0]=makeKin(pick(kc),chance(.6)?'堂':'亲')}S.cands.forEach(c=>{deepen(c);initTimeTraveler(c);});S.selection={phase:'audience',current:S.cands[0]?.id,performed:[]};S.flags.peek=3;S.flags.lastXX=S.turn;log(`${dateStr()}，开选秀，各地秀女入宫待选。`,1)}
A.xxDecree=function(){
  const since=S.turn-S.flags.lastXX;
  if(since>=36){genCands();AU.sfx('chime');A.go('xx');return}
  pushEv({title:'下旨选秀',text:`距上次选秀不过${Math.floor(since/12)}年${since%12}月。\n若此时再开选秀，恐有大臣进谏“劳民伤财”。（国库-100万两，民心-4）`,choices:[
    {t:'朕意已决',f:()=>{const s=chg({treasury:-100,people:-4});genCands();UI.view='xx';return `圣旨下达，各地秀女陆续进京。${fx(s)}`}},{t:'作罢'}]});
};
A.xxPeek=function(id){const c=S.cands.find(x=>x.id===id);if(!c||c.known)return;if(S.flags.peek<=0){toast('本次暗访次数已用尽');return}S.flags.peek--;c.known=true;AU.sfx('page');render()};
A.xxDrop=function(id){S.cands=S.cands.filter(x=>x.id!==id);AU.sfx('click');render()};
A.xxTake=function(id){const c=S.cands.find(x=>x.id===id);if(!c)return;
  const ch=[0,1,2,3].map(r=>({t:`封为${RANKS[r]}`,f:()=>take(r)}));
  if(c.fam.p>=70) ch.push({t:'封为嫔（世家之女，可破格）',cond:()=>rankCount(4)<RANK_CAP[4],why:'嫔位已满',f:()=>take(4)});
  function take(r){if(!S.cands.some(x=>x.id===c.id)||S.consorts.some(x=>x.id===c.id)||rankCount(r)>=RANK_CAP[r])return null;S.cands=S.cands.filter(x=>x!==c);addConsort(c,r,`${dateStr()}选秀入宫`);let s='';
    if(r>=3&&c.fam.p>=60)s=chg({prestige:2});
    if(r>=4&&!c.title)c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)));
    c.entryAdjustment={turn:S.turn,manner:entryManner(c),settled:false};pushNow(newcomerWelcomeEvent(c));save('auto');
 AU.sfx('joy');return `${fullName(c)}叩首谢恩，入住${c.palace}。${fx(s)}`}
  pushEv({title:'留牌子',por:c,text:`${fullName(c)}，年方${c.age}，${c.fam.t}之女。\n陛下欲赐何等位分？`,choices:[...ch,{t:'再想想'}]});
};
A.xxEnd=function(){S.cands=[];delete S.selection;log('选秀礼毕。');A.go('harem')};

/* ============ 后宫事件 ============ */
function punishEv(A_,B,crime){
  if(B)relAdd(A_,B,-40);
  return {title:'真相大白',cast:[A_,inPalace(B)?B:null],sfx:'gong',text:`人证物证俱在，${crime}一事，竟是${cName(A_)}所为。\n${A_.cold?'侍卫将她从冷宫押来问话，她跪倒在殿中：“民妇……民妇一时糊涂！”':'她跪在殿中，钗环散乱：“臣妾……臣妾一时糊涂！”'}`,choices:[
    {t:'打入冷宫',f:()=>{const s=A_.fam.p>=70?chg({prestige:-2}):'';A_.cold=true;A_.palace='冷宫';story(A_,`${crime}事发，被打入冷宫。`);clanEcho(A_,'down');setXin(A_,'怨恨',`${crime}事发，被打入冷宫`,B?B.id:'emp');log(`${fullName(A_)}因${crime}事发，打入冷宫。`,1);if(B){cchg(B,{aff:8,mood:15});story(B,`陛下查明${crime}真相，为她主持公道。`);setXin(B,'释然',`${crime}真相大白`)}AU.sfx('sad');return `${fx(s,cchg(A_,{mood:-50,aff:-30}))}`}},
    {t:'降位禁足',f:()=>{A_.rank=Math.max(0,A_.rank-2);if(A_.rank===8)A_.rank=5;reconcileResidences();story(A_,`${crime}事发，被降为${RANKS[A_.rank]}，禁足宫中。`);setXin(A_,'惶恐',`${crime}事发`);log(`${fullName(A_)}因${crime}事发，降为${RANKS[A_.rank]}。`,1);if(B)cchg(B,{aff:5,mood:8});return fx(cchg(A_,{mood:-30,aff:-15,favor:-20}))}},
    {t:'念其初犯，罚俸了事',f:()=>{story(A_,`${crime}事发，陛下网开一面，仅罚俸半年。`);if(B){cchg(B,{aff:-8,mood:-10});story(B,'陛下对害她之人从轻发落，她心中凉了半截。');setXin(B,'怨恨','害她的人只被罚了俸',A_.id)}A_.scheme=clamp(A_.scheme+5);return `${cName(A_)}叩头谢恩，眼底却闪过一丝庆幸。`}}]};
}
const HAREM=[
 function jealous(){const h=harem();if(h.length<2)return null;const top=h.slice().sort((a,b)=>b.favor-a.favor)[0];
  const cs=h.filter(c=>c!==top&&(TRAITS[c.trait].jealous||c.scheme>70)&&c.favor<top.favor-8);if(!cs.length)return null;const a=pick(cs);
  return {title:'醋海生波',present:[a,top],por:a,text:`${cName(a)}前来请安，言语间颇有怨怼：\n“陛下近日总往${top.palace}去，想来${cName(top)}那儿的茶，是比别处香些。”`,choices:[
   {t:'温言安抚',f:()=>{story(a,'向陛下诉了几句委屈，陛下温言安抚，她心中稍霁。');return fx(cchg(a,{mood:12,aff:4}))}},
   {t:'今夜便宿在她宫里',cond:()=>E().energy>0&&!a.preg,why:'精力不足',f:()=>{nightWith(a);return null}},
   {t:'冷言训诫：“后宫当以和睦为先。”',f:()=>{story(a,'因妒生怨，遭陛下训诫，回宫后闭门不出。');a.scheme=clamp(a.scheme+3);return fx(cchg(a,{mood:-15,aff:-6,favor:-3}))}}]}},
 function musk(){const h=harem();const sc=h.filter(c=>c.scheme>=65&&(c.mood<70||c.scheme>=80));if(!sc.length)return null;const a=pick(sc);
  const ts=h.filter(c=>c!==a&&(c.favor>=a.favor||c.preg));if(!ts.length)return null;const b=ts.sort((x,y)=>relGet(a,x)-relGet(a,y))[0];
  return {title:'香囊疑案',present:[a,b],por:b,text:`${cName(b)}宫中的宫女整理衣物时，发现主子常佩的香囊里竟混了麝香。${cName(b)}面色惨白，跪在殿前请陛下做主。`,choices:[
   {t:'命慎刑司彻查',f:()=>{if(chance(.35+E().prestige/250+(a.known?.15:0)+allyBonus(b))){a.known=true;pushNow(punishEv(a,b,'香囊藏麝'));return `慎刑司连夜审讯，顺藤摸瓜，竟查到了${cName(a)}宫中……`}
     story(b,'香囊一案不了了之，她从此饮食起居分外小心。');return `线索断在一名投井的小太监身上，此案只得不了了之。${fx(cchg(b,{mood:-10}))}`}},
   {t:'加赏安抚，不予深究',f:()=>{story(b,'香囊一案，陛下并未深究。');a.scheme=clamp(a.scheme+3);return `${fx(chg({treasury:-20}),cchg(b,{mood:4,aff:-3}))}`}}]}},
 function slip(){const h=harem();const b=h.find(c=>c.preg>=3&&!c.prot&&!concealedPregnancy(c));if(!b)return null;const a=h.find(c=>c!==b&&c.scheme>=60);if(!a)return null;
  const lose=()=>{b.preg=0;delete b.pregnancyFather;delete b.pregnancyCalendar;story(b,'在御花园失足滑倒，腹中骨肉没能保住。');setXin(b,'悲恸','腹中骨肉没能保住');log(`${fullName(b)}失足小产。`,1);AU.sfx('sad');
    if(chance(.5+E().prestige/300)){a.known=true;pushNow(punishEv(a,b,'石阶泼油、致人小产'))}
    return `太医跪了一地：“臣等无能……”${fx(cchg(b,{mood:-40,aff:3}))}`};
  return {title:'石阶惊变',present:[a,b],por:b,sfx:'err',text:`${cName(b)}在御花园赏花时，石阶上不知被谁泼了桐油，失足滑倒，腹痛不止！`,choices:[
   {t:'急召太医',f:()=>chance(.6)?(story(b,'在御花园失足滑倒，所幸太医救治及时，母子平安。'),`太医施针用药，总算保住了胎儿。${fx(cchg(b,{mood:-5,aff:5}))}`):lose()},
   {t:'亲自赶去守着她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();return chance(.82)?(story(b,'失足滑倒，陛下亲自守了一夜，母子平安。'),`你守了她整整一夜，天亮时她终于安稳睡去。${fx(cchg(b,{mood:5,aff:15}))}`):lose()}}]}},
 function wugu(){const h=harem();if(h.length<3)return null;const a=h.find(c=>c.scheme>=72);if(!a)return null;const v=h.filter(c=>c!==a&&c.rank!==8).sort((x,y)=>relGet(a,x)-relGet(a,y))[0];if(!v)return null;
  return {title:'巫蛊之祸',present:[a,v],por:v,sfx:'gong',text:`宫人在${cName(v)}床下搜出一个布偶，背后写着陛下的生辰八字，扎满银针。\n${cName(v)}哭喊冤枉。`,choices:[
   {t:'人赃并获，打入冷宫',f:()=>{v.cold=true;v.palace='冷宫';story(v,'被指行巫蛊之术，打入冷宫。她至死喊冤。');setXin(v,'怨恨','被诬行巫蛊','emp');log(`${fullName(v)}以巫蛊罪打入冷宫。`,1);S.flags.wronged={v:v.id,a:a.id};return fx(cchg(v,{mood:-50,aff:-20}))}},
   {t:'此事蹊跷，暗中彻查',f:()=>{if(chance(.4+E().prestige/250+allyBonus(v))){a.known=true;pushNow(punishEv(a,v,'栽赃巫蛊'));return '密查之下，发现布偶上的针脚与某宫绣娘如出一辙……'}story(v,'被卷入巫蛊疑案，虽未定罪，却也百口莫辩。');return `查不出头绪，${cName(v)}从此惶惶不可终日。${fx(cchg(v,{mood:-15}))}`}},
   {t:'当众焚毁布偶，严禁议论',f:()=>{story(v,'被卷入巫蛊疑案，陛下当众焚毁布偶，力保她清白。');return `${fx(cchg(v,{aff:12,mood:5}),chg({prestige:-1}))}`}}]}},
 function birthday(){const eligible=harem().filter(c=>c.rank<8&&birthMonth(c)===S.month);if(!eligible.length)return null;const c=pick(eligible);return {title:'芳辰',por:c,text:`今日是${cName(c)}的生辰。`,choices:[
   {t:'设宴庆贺（国库-30万两）',f:()=>{story(c,'生辰之日，陛下为她设宴，六宫同贺。');remember(c,'bday','生辰设宴');AU.sfx('joy');return fx(chg({treasury:-30}),cchg(c,{mood:20,aff:10,favor:5}))}},
   {t:'赏一柄玉如意',f:()=>{story(c,'生辰之日，陛下赏了一柄玉如意。');return fx(chg({treasury:-10}),cchg(c,{mood:10,aff:4}))}},
   {t:'国事繁忙，顾不上了',f:()=>{story(c,'生辰之日，陛下忙于国事，未曾露面。她对着一桌冷了的寿面坐到深夜。');return fx(cchg(c,{mood:-12,aff:-4}))}}]}},
 function talent(){if(S.turn-(S.flags.lastLiteraryGathering??-12)<12)return null;const cs=harem().filter(c=>c.trait==='才女'&&c.talent>=65&&c.arc?.id!=='scholar');if(!cs.length)return null;const c=pick(cs);const p=pick(POEMS);
  return {title:'雅集',por:c,onQueue:()=>{S.flags.lastLiteraryGathering=S.turn},text:`${cName(c)}派人送来一张花笺，上书：\n“${p}”\n邀陛下今夜移驾赏月。`,choices:[
   {t:'欣然前往（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();story(c,`以诗相邀：“${p}”陛下欣然而至，二人联句至夜深。`);return fx(cchg(c,{favor:8,aff:10,mood:12}))}},
   {t:'回赠一首诗',f:()=>{story(c,`以诗相邀，陛下回赠一诗。她将诗笺珍藏在妆奁里。`);return fx(cchg(c,{aff:5,mood:6}))}},
   {t:'置之不理',f:()=>fx(cchg(c,{mood:-8}))}]}},
 function ill(){const cs=harem().filter(c=>c.trait==='体弱'||chance(.15));if(!cs.length)return null;const c=pick(cs);
  return {title:'病榻',por:c,text:`${cName(c)}偶感风寒，连日高烧不退。`,choices:[
   {t:'宣太医诊治',f:()=>{story(c,'染了风寒，太医悉心诊治，渐渐痊愈。');return fx(chg({treasury:-10}),cchg(c,{mood:5}))}},
   {t:'亲自探视（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();remember(c,'care','病中探视');story(c,'卧病在床，陛下亲自来看她，还喂了她一口药。');return fx(cchg(c,{mood:20,aff:15}))}},
   {t:'不必理会',f:()=>{if(c.trait==='体弱'&&chance(.25)){c.alive=false;story(c,'病势沉重，无人问津，于一个雪夜香消玉殒。');log(`${fullName(c)}病逝。`,1);AU.sfx('sad');return `数日后，${c.palace}传来噩耗：${fullName(c)}病逝了。`}story(c,'病了半月，陛下未曾过问。');remember(c,'neglect','病中无人过问');return fx(cchg(c,{mood:-15,aff:-8}))}}]}},
 function homesick(){const c=pick(harem());if(!c)return null;return {title:'思亲',por:c,text:`${cName(c)}近日郁郁寡欢。宫人说，她的母亲染了重病。`,choices:[
   {t:'准其母入宫小住',f:()=>{story(c,'母亲病重，陛下特许其母入宫小住养病。');momVisit(c,ri(1,2));return fx(chg({treasury:-10}),cchg(c,{mood:20,aff:10}))}},
   {t:'赐药材送去她家中',f:()=>fx(chg({treasury:-15}),cchg(c,{mood:10,aff:5}))},
   {t:'宫规森严，不可坏了规矩',f:()=>fx(cchg(c,{mood:-12}))}]}},
 function empressReport(){const em=empress();if(!em)return null;
  if(em.virtue>=60) return {title:'中宫奏事',por:em,text:'皇后奏请：后宫用度日增，臣妾愿率六宫减省膳食衣料，以充国用。',choices:[
   {t:'准奏，皇后贤德',f:()=>{story(em,'率六宫节俭用度，陛下赞其贤德。');harem().forEach(c=>{if(c!==em)c.mood=clamp(c.mood-3)});return fx(chg({treasury:60,prestige:2}),cchg(em,{aff:6}))}},
   {t:'不必委屈了六宫',f:()=>fx(cchg(em,{aff:2}))}]};
  const tgt=harem().filter(c=>c!==em).sort((a,b)=>b.favor-a.favor)[0];if(!tgt)return null;
  return {title:'中宫奏事',cast:[em,tgt],text:`皇后奏道：“${cName(tgt)}恃宠而骄，屡次请安迟到，臣妾请陛下准许依宫规罚她抄经百遍。”`,choices:[
   {t:'后宫之事，皇后做主',person:em,f:()=>{story(tgt,'被皇后以宫规责罚，抄经百遍。');return fx(cchg(em,{aff:6,mood:8}),cchg(tgt,{mood:-15}))}},
   {t:'替她说两句好话',person:tgt,f:()=>{story(em,`陛下袒护${fullName(tgt)}，她面上不显，心里却记下了。`);em.scheme=clamp(em.scheme+3);return fx(cchg(em,{mood:-12,aff:-4}),cchg(tgt,{aff:5}))}}]}},
 function quarrel(){const h=harem().filter(c=>c.rank<8);if(h.length<2)return null;const [a,b]=shuffle(h);
  return {title:'争执',cast:[a,b],text:`晨起请安时，${cName(a)}与${cName(b)}为一匹蜀锦的归属起了争执，闹到了御前。`,choices:[
   {t:`判给${cName(a)}`,person:a,f:()=>{rememberQuarrel(a,b,a.id);return fx(cchg(a,{mood:10}),cchg(b,{mood:-10,aff:-3}))}},
   {t:`判给${cName(b)}`,person:b,f:()=>{rememberQuarrel(a,b,b.id);return fx(cchg(b,{mood:10}),cchg(a,{mood:-10,aff:-3}))}},
   {t:'各赏一匹，息事宁人',f:()=>{rememberQuarrel(a,b);return fx(chg({treasury:-15}),cchg(a,{mood:4}),cchg(b,{mood:4}))}}]}},
 function coldPlea(){const cs=alive().filter(c=>c.cold);if(!cs.length)return null;const c=pick(cs);const w=S.flags.wronged&&S.flags.wronged.v===c.id;
  return {title:'冷宫来信',por:c,present:[],valid:()=>c.alive&&!c.gone&&c.cold,text:w?`冷宫里的${fullName(c)}托一个老宫女捎来血书：“巫蛊一事，实乃有人栽赃。求陛下明察！”`:`冷宫里的${fullName(c)}托人送来一方旧帕，上面绣着当年你赐她的一句诗。`,choices:[
   {t:'放她出冷宫',f:()=>{A.uncold(c.id);if(w){const a=byId(S.flags.wronged.a);S.flags.wronged=null;if(a&&a.alive&&!a.cold){a.known=true;pushNow(punishEv(a,c,'栽赃巫蛊'))}}return `${fullName(c)}出了冷宫，形容憔悴，却仍向你深深一拜。`}},
   {t:'置之不理',f:()=>fx(cchg(c,{mood:-10}))}]}},
 function ambition(){const cs=harem().filter(c=>c.favor>=60&&c.rank<7&&c.rank>=1);if(!cs.length)return null;const c=pick(cs);const nr=c.rank+1;
  return {title:'求晋位分',por:c,text:`${cName(c)}依偎在你身边，娇声道：“臣妾伺候陛下也有些日子了……”言下之意，是想晋一晋位分。`,choices:[
   {t:`晋为${RANKS[nr]}`,cond:()=>rankCount(nr)<RANK_CAP[nr],why:`${RANKS[nr]}已满`,f:()=>{c.rank=nr;if(nr>=4&&!c.title)c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)));story(c,`蒙恩晋为${cName(c)}。`);log(`晋${fullName(c)}为${cName(c)}。`);harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous){o.mood=clamp(o.mood-6);relAdd(o,c,-6)}});return fx(cchg(c,{mood:20,aff:8}))}},
   {t:'笑而不语',f:()=>fx(cchg(c,{mood:-8}))}]}},
 function family(){const c=officialC(20);if(!c)return null;return {title:'外戚请托',por:c,text:`${cName(c)}小心翼翼地开口：家中幼弟今年中了举，不知陛下可否赏个差事？`,choices:[
   {t:'准，授七品官',f:()=>{c.fam.p=Math.min(95,c.fam.p+8);story(c,'陛下恩准，她的幼弟入朝为官。');return fx(chg({prestige:-2}),cchg(c,{aff:10,mood:12}))}},
   {t:'朝廷选官自有法度',f:()=>fx(cchg(c,{mood:-6}),chg({people:1}))}]}},
 function crave(){const c=harem().find(c=>c.preg>=2&&!concealedPregnancy(c));if(!c)return null;return {title:'害喜',por:c,text:`${cName(c)}害喜得厉害，什么都吃不下，只念叨着家乡的青梅。`,choices:[
   {t:'命人八百里快马送青梅',f:()=>{story(c,'孕中想吃家乡的青梅，陛下命人快马送来。');return fx(chg({treasury:-10,people:-1}),cchg(c,{mood:18,aff:10}))}},
   {t:'让御膳房想想办法',f:()=>fx(cchg(c,{mood:6}))}]}},
];
function haremEvent(){for(const f of shuffle(HAREM)){const ev=f();if(ev&&ambientEventReady(ev))return {...ev,present:ev.present||eventPortraits(ev)}}return null}
function pregEvent(c){if(c.maid)return {title:'喜脉',por:c,sfx:'joy',text:`太医院来报：${c.near?'御前':'尚衣局'}的宫女${fullName(c)}已有两月身孕！`,choices:[
  {t:'册为答应，迁居别宫养胎',f:()=>{promoteMaid(c,1);c.prot=true;setXin(c,'欢喜','有孕后册为答应');return fx(cchg(c,{mood:25,aff:10}))}},
  {t:'仍留在身边，加派人手照料',f:()=>{c.prot=true;c.near=true;c.palace='乾清宫';story(c,'有孕后仍留在御前，加派人手照料。');return fx(cchg(c,{mood:10}))}},
  {t:'不必声张',f:()=>{story(c,'有孕之事被压了下来。');setXin(c,'委屈','有了身孕，却无人过问');return fx(cchg(c,{mood:-10}))}}]};return {title:'喜脉',por:c,sfx:'joy',text:`太医院来报：${cName(c)}已有两月身孕！`,choices:[
  {t:'加派人手悉心照料（国库-20万两）',f:()=>{c.prot=true;story(c,'诊出喜脉，陛下加派人手悉心照料。');log(`${fullName(c)}有孕。`,1);return fx(chg({treasury:-20,prestige:2}),cchg(c,{mood:20,aff:8}))}},
  {t:'晋她一级位分',cond:()=>c.rank<7&&rankCount(c.rank+1)<RANK_CAP[c.rank+1],why:'位分已满',f:()=>{c.rank++;if(c.rank>=4&&!c.title)c.title=pick(TITLES.filter(t=>!harem().some(x=>x.title===t)));story(c,`诊出喜脉，晋为${cName(c)}。`);log(`${fullName(c)}有孕，晋为${cName(c)}。`,1);return fx(chg({prestige:2}),cchg(c,{mood:25,aff:6}))}},
  {t:'赏',f:()=>{story(c,'诊出喜脉。');log(`${fullName(c)}有孕。`,1);return fx(chg({treasury:-10,prestige:2}),cchg(c,{mood:12}))}}]}}
/* ============ 关系与派系 ============ */
const rk=(a,b)=>a.id<b.id?a.id+'_'+b.id:b.id+'_'+a.id;
function relGet(a,b){if(!a||!b||a===b||!S.rel)return 0;return S.rel[rk(a,b)]||0}
function relAdd(a,b,v){if(!a||!b||a===b)return;S.rel=S.rel||{};const k=rk(a,b);S.rel[k]=clamp((S.rel[k]||0)+v,-100,100)}
function initRel(c){harem().forEach(o=>{if(o===c)return;let v=ri(-8,12)+consortCompatibility(c,o);if(TRAITS[c.trait].jealous&&o.favor>40)v-=8;if(Math.abs(o.fam.p-c.fam.p)<15)v+=4;relAdd(c,o,v)})}
function leaders(){const h=harem(),L=[],em=empress();if(em)L.push(em);
  const others=h.filter(c=>c.rank>=5&&c.rank<8).sort((a,b)=>(b.rank*20+b.favor+b.scheme*.5)-(a.rank*20+a.favor+a.scheme*.5));
  for(const o of others){if(L.length>=2)break;L.push(o)}
  return L}
function factions(){const L=leaders(),map={},neutral=[];L.forEach(l=>map[l.id]=[]);
  harem().forEach(c=>{if(L.includes(c))return;let best=null,bv=8;
    L.forEach(l=>{const v=relGet(c,l)+3*NPCMemory.influence(S,c.id,l.id)+(l.rank===8&&c.virtue>60?6:0)+(l.scheme>60&&c.scheme>60?6:0);if(v>bv){bv=v;best=l}});
    if(best)map[best.id].push(c);else neutral.push(c)});
  return {L,map,neutral}}
function facOf(c){const f=factions();for(const l of f.L){if(l===c||f.map[l.id].includes(c))return l}return null}
function allyBonus(v){if(!v)return 0;return Math.min(.25,harem().filter(o=>o!==v&&relGet(o,v)>=40).length*.08)}
function relTick(){const h=harem(),f=factions(),fid={};
  f.L.forEach(l=>{fid[l.id]=l.id;f.map[l.id].forEach(m=>fid[m.id]=l.id)});
  for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++){const a=h[i],b=h[j];let d=0;
    if(fid[a.id]&&fid[a.id]===fid[b.id])d+=1.5;else if(fid[a.id]&&fid[b.id])d-=1.2;
    if(TRAITS[a.trait].jealous&&b.favor>a.favor+15)d-=2;if(TRAITS[b.trait].jealous&&a.favor>b.favor+15)d-=2;
    if(a.trait==='温婉'||b.trait==='温婉')d+=.5;
    if(relGet(a,b)>-15&&!isRival(a,b))d+=Math.max(0,consortCompatibility(a,b))*.12;
    const k=rk(a,b);S.rel[k]=clamp((S.rel[k]||0)*.985+d,-100,100)}}

function consortSocialTick(){
  const available=harem().filter(c=>c.preg<2&&c.mood>=30&&S.turn-(c.lastSocial?.turn??-Infinity)>=3);
  const pairs=[];
  for(let i=0;i<available.length;i++)for(let j=i+1;j<available.length;j++){
    const a=available[i],b=available[j],relationship=relGet(a,b);
    const compatibility=consortCompatibility(a,b);
    if(relationship<-15||isRival(a,b)||(compatibility<3&&relationship<20))continue;
    pairs.push({a,b,w:1+Math.max(0,compatibility)+Math.min(4,Math.max(0,relationship)/10)});
  }
  if(!pairs.length||!chance(.65))return;
  const {a,b}=pickW(pairs);
  const hobby=sharedConsortHobby(a,b), pastime=CONSORT_HOBBIES[hobby];
  const place=pastime?.place==='本宫'?a.palace:pastime?.place||'御花园';
  const activity=pastime?.activity||'坐下来聊了半晌';
  relAdd(a,b,5);
  for(const [person,other] of [[a,b],[b,a]]){
    person.lastSocial={turn:S.turn,other:other.id,place,activity};
    person.mood=clamp(person.mood+2);
  }
  NPCMemory.record(S,{type:'consort_social',time:S.turn,location:place,
    participants:[a.id,b.id],outcome:activity},[[a,b],[b,a]].map(([person,other])=>({
      person:person.id,subject:other.id,emotion:.65,impact:62,
      interpretation:`与${fullName(other)}在${place}${activity}。`
    })));
}

function consortSocialLine(c){
  const note=c.lastSocial,other=note&&byId(note.other);
  if(!other||S.turn-note.turn>=3)return '';
  return `<div>近来往来 · 与 <button class="btn quiet sm" onclick="A.go('consort',${other.id})">${esc(fullName(other))}</button> 在${esc(note.place)}${esc(note.activity)}。</div>`;
}
function facHTML(){const f=factions();if(!f.L.length)return '';
  const box=(t,arr)=>`<div class="card" style="cursor:default;flex-direction:column"><div class="nm">${t}</div><div>${arr.length?arr.map(c=>`<span class="tag">${esc(cName(c))}</span>`).join(''):'<span class="hint">尚无依附者</span>'}</div></div>`;
  return `<h3>派系</h3><div class="grid">${f.L.map(l=>box(esc(cName(l))+'一派',f.map[l.id])).join('')}${f.neutral.length?box('中立',f.neutral):''}</div>`}
function relLine(c){if(!c.alive||c.gone)return '';
  const h=harem().filter(o=>o!==c).map(o=>[o,relGet(c,o)]).sort((a,b)=>b[1]-a[1]);
  const good=h.filter(x=>x[1]>=30).slice(0,4),bad=h.filter(x=>x[1]<=-30).slice(-4),fac=c.cold?null:facOf(c);
  return `<div>派系：${fac?(fac===c?'一派之首':esc(cName(fac))+'一派'):'中立'}${good.length?`　交好：${good.map(([o])=>`<span class="tag g">${esc(cName(o))}</span>`).join('')}`:''}${bad.length?`　交恶：${bad.map(([o])=>`<span class="tag r">${esc(cName(o))}</span>`).join('')}`:''}</div>${consortSocialLine(c)}`}
HAREM.push(
 function clash(){const f=factions();if(f.L.length<2)return null;const [a,b]=f.L,ma=f.map[a.id],mb=f.map[b.id];if(!ma.length&&!mb.length)return null;
  const side=(w,l,mw,ml)=>()=>{[w,...mw].forEach(c=>cchg(c,{mood:8}));[l,...ml].forEach(c=>{cchg(c,{mood:-8});relAdd(c,w,-6)});story(w,`派系相争，陛下站在了她这一边。`);return `${cName(w)}一派扬眉吐气，${cName(l)}一派面色难看。`};
  return {title:'派系倾轧',present:[a,b,...ma,...mb],cast:[a,b,ma[0],mb[0]],text:`晨昏定省时，${cName(a)}一派与${cName(b)}一派为${pick(['御花园赏花的座次','内务府分发的冰例','中秋宴上谁坐陛下左手边','新入宫的小主该住哪处偏殿'])}争执不下，两边都盯着你。\n${cName(a)}身边：${ma.map(cName).join('、')||'无人'}\n${cName(b)}身边：${mb.map(cName).join('、')||'无人'}`,choices:[
   {t:`偏向${cName(a)}`,person:a,f:side(a,b,ma,mb)},{t:`偏向${cName(b)}`,person:b,f:side(b,a,mb,ma)},
   {t:'各打五十大板：“都回去抄《女诫》。”',f:()=>{[a,b,...ma,...mb].forEach(c=>cchg(c,{mood:-4}));relAdd(a,b,4);return '两边都闭了嘴，表面上总算和气了几分。'}}]}},
 function sisters(){const h=harem();let best=null,bv=45;for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++){const v=relGet(h[i],h[j]);if(v>bv){bv=v;best=[h[i],h[j]]}}if(!best)return null;const [a,b]=best;
  const pastime=CONSORT_HOBBIES[sharedConsortHobby(a,b)],place=pastime?.place==='本宫'?a.palace:pastime?.place||a.palace;
  return {title:'姐妹情深',cast:[a,b],text:`${cName(a)}与${cName(b)}约在${place}${pastime?.activity||'小聚'}，派人来请陛下。`,choices:[
   {t:'前往（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();story(a,`与${fullName(b)}一同宴请陛下，三人说笑到月上中天。`);story(b,`与${fullName(a)}一同宴请陛下。`);relAdd(a,b,6);return fx(cchg(a,{aff:6,mood:8}),cchg(b,{aff:6,mood:8}))}},
   {t:'赏她们一桌御膳',f:()=>{relAdd(a,b,3);return fx(chg({treasury:-5}),cchg(a,{mood:5}),cchg(b,{mood:5}))}}]}},
 function defect(){const f=factions();if(!f.L.length)return null;const pool=f.neutral.filter(c=>c.rank<=3&&c.favor<35);if(!pool.length)return null;const c=pick(pool),l=pick(f.L);
  return {title:'投靠',cast:[c,l],text:`有宫人看见，${cName(c)}近来常往${l.palace}跑，给${cName(l)}送这送那。看样子是想找个靠山。`,choices:[
   {t:'由她去',f:()=>{relAdd(c,l,25);story(c,`投靠了${fullName(l)}。`);return `${cName(c)}从此成了${cName(l)}身边的人。`}},
   {t:'召她侍寝，让她不必依附旁人',cond:()=>E().energy>0&&!c.preg,why:'精力不足',f:()=>{nightWith(c);return null}},
   {t:`提点${cName(l)}：后宫不许结党`,f:()=>{relAdd(c,l,-10);return fx(cchg(l,{mood:-8,aff:-3}))}}]}},
 function poisonHeir(){if(!S.heir)return null;const h=kidById(S.heir);if(!childInPalace(h))return null;const hm=byId(h.mom);
  const sus=harem().filter(c=>c.id!==h.mom&&c.scheme>=65&&S.children.some(k=>k.mom===c.id&&k.sex==='m'&&k.alive&&k.id!==h.id));if(!sus.length)return null;const a=pick(sus);
  return {title:'东宫惊魂',por:h,present:[h,a,...(inPalace(hm)?[hm]:[])],sfx:'gong',text:`太子的晚膳里验出了砒霜，试菜的小太监当场毙命。${inPalace(hm)?'\n'+cName(hm)+'哭着跪在殿外，求陛下做主。':hm?.alive&&!hm.gone&&hm.cold?'\n消息传到冷宫，'+fullName(hm)+'托看守捎话，求陛下护住孩子。':''}`,choices:[
   {t:'封锁东宫，彻查到底',f:()=>{if(chance(.4+E().prestige/250+allyBonus(hm))){a.known=true;pushNow(punishEv(a,hm&&hm.alive?hm:null,'谋害储君'));return '御膳房的线索，一路指向了……'}return '下毒的厨子在狱中自尽，线索断了。太子从此每餐都要银针试毒。'}},
   {t:'加派侍卫，暗中提防',f:()=>{h.hp=clamp(h.hp-3);return '你没有声张，只是太子身边多了四个带刀侍卫。'}}]}}
);

/* ============ 宫女承恩 ============ */
const maids=()=>alive().filter(c=>c.maid);
function newMaid(where){const g=makeGirl({fam:{t:'宫女',p:3},age:ri(16,20)});g.maid=true;g.near=false;g.palace='尚衣局';g.favor=20;g.aff=20;S.consorts.push(g);deepen(g);story(g,`本是${where}的宫女，被陛下看中。`);return g}
function promoteMaid(g,rank){g.maid=false;g.near=false;g.rank=rank;assignPalace(g);deepen(g);initRel(g);assignArc(g);S.ys.c++;
  story(g,`由宫女册封为${RANKS[rank]}，赐居${g.palace}。`);log(`宫女${fullName(g)}册封为${RANKS[rank]}。`,1)}
function maidNight(g){if(E().energy<=0){toast('本月精力已尽');return}nightWith(g);Q.splice(1,0,afterMaidNight(g))}
function afterMaidNight(g){return {title:'天明',por:g,text:`天快亮时，${g.given}已经起身，跪在床边替你理好朝服，低着头不敢看你。\n她只是个宫女，往后如何，全凭陛下一句话。`,choices:[
  {t:'封为答应',f:()=>{promoteMaid(g,1);setXin(g,'欢喜','一夜承恩，封为答应');return `她磕头谢恩，搬进了${g.palace}。${fx(cchg(g,{mood:25,aff:10}))}`}},
  {t:'封为官女子',f:()=>{promoteMaid(g,0);setXin(g,'欢喜','一夜承恩，封为官女子');return `她磕头谢恩。${fx(cchg(g,{mood:15,aff:6}))}`}},
  {t:'留在身边，做贴身宫女',f:()=>{g.near=true;g.palace='乾清宫';story(g,'承恩后未受册封，留在御前做贴身宫女，随时侍奉在侧。');return `她留在了乾清宫，每日为你奉茶研墨。${fx(cchg(g,{aff:8}))}\n§「后宫」页的「贴身宫女」里能找到她，翻牌子时也有她`}},
  {t:'赏些银子，让她回去当差',f:()=>{g.near=false;g.palace='尚衣局';story(g,'承恩一夜，次日被打发回尚衣局当差。');setXin(g,'委屈','承恩一夜，次日便被打发回去');return `她谢了恩，回去了。宫里没有人再提起那一夜。${fx(cchg(g,{mood:-10}))}`}}]}}
function monthlyMaidEvent(){
  if(!maidEncounterReady()||!chance(.12))return null;
  const pool=[()=>maidEvent('长街')];
  const attendants=maids().filter(m=>m.near);
  if(attendants.length<4)pool.push(teaMaid);
  if(attendants.some(m=>!m.preg))pool.push(nearMaidEvent);
  const event=pick(pool)();
  return event?{...event,maidEncounter:true}:null;
}
function teaMaid(){if(maids().filter(m=>m.near).length>=4)return null;const g=makeGirl({fam:{t:'宫女',p:3},age:ri(16,20)});
  return {title:'奉茶',por:g,text:`夜深了，你还在乾清宫批折子。奉茶的宫女${g.given}换了第三回茶，见你揉眉心，小声说：“陛下，奴婢给您按一按？”她的手很凉，力道却刚好。`,choices:[
   {t:'今夜留她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{g.maid=true;g.near=false;g.palace='乾清宫';g.favor=20;g.aff=25;S.consorts.push(g);deepen(g);story(g,'本是乾清宫奉茶的宫女，深夜被陛下留下。');maidNight(g);return null}},
   {t:'调她到御前当差',f:()=>{g.maid=true;g.near=true;g.palace='乾清宫';g.favor=10;g.aff=20;S.consorts.push(g);deepen(g);story(g,'被调到御前当差，做了贴身宫女。');return `她红着脸谢了恩。\n§她成了你的贴身宫女`}},
   {t:'赏她一碟点心，让她去歇着',f:()=>'她捧着点心退下了。'}]}}
function nearMaidEvent(){const m=maids().filter(m=>m.near&&!m.preg);if(!m.length)return null;const g=pick(m);
  return {title:'贴身宫女',por:g,text:pick([`${g.given}替你更衣时，发现你朝服里衬磨破了一个小口，连夜拿回去补好了，针脚细得几乎看不出来。`,`你午睡醒来，${g.given}正坐在脚踏上打扇，扇了一个时辰，手臂都酸了也没停。`,`${g.given}记得你喝茶要七分烫，批折子时要燃沉水香，咳嗽了要加一勺川贝。`]),choices:[
   {t:'今夜留她（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{nightWith(g);return null}},
   {t:'封为答应',f:()=>{promoteMaid(g,1);setXin(g,'欢喜','从贴身宫女册封为答应');return fx(cchg(g,{mood:25,aff:8}))}},
   {t:'赏她一对银镯',f:()=>fx(chg({treasury:-2}),cchg(g,{mood:10,aff:4}))}]}}
A.raiseMaid=function(id,rank){const g=byId(id);promoteMaid(g,rank);setXin(g,'欢喜',`由宫女册封为${RANKS[rank]}`);cchg(g,{mood:20,aff:6});AU.sfx('joy');toast(`已册封为${RANKS[rank]}`);render()};
A.maidNear=function(id){const g=byId(id);g.near=!g.near;g.palace=g.near?'乾清宫':'尚衣局';story(g,g.near?'被调到御前，做了贴身宫女。':'被遣回尚衣局当差。');if(!g.near)setXin(g,'委屈','被遣回尚衣局');render()};
A.maidOut=function(id){const g=byId(id);pushEv({title:'放出宫',danger:true,por:g,text:`放${g.given}出宫，赏她一份嫁妆回家嫁人？`,choices:[{t:'放她出宫（国库-5万两）',f:()=>{chg({treasury:-5});g.gone=true;story(g,'蒙恩放出宫去，带着一份嫁妆回了老家。');return '她在宫门口跪下，朝乾清宫的方向磕了三个头。'}},{t:'作罢'}]})};
