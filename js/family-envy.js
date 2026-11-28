/* ============ 门第之叹（内容版本 173 起） ============
   寒门或人丁单薄的妃嫔，见到出身显赫、家中人丁兴旺的人，会生出艳羡；
   心思重的人转而自伤，说自家「门衰祚薄」。两种心境都记入人物纪事，
   也各有一场可以回应的事。淡泊的人不为此动心；具名剧情人物不在此列。 */
const FAMILY_ENVY_VERSION=173;
function familyEnvyActive(){return journalContentVersion()>=FAMILY_ENVY_VERSION;}

Object.assign(XIN,{
 '艳羡':{c:'y',d:5,expr:'',mood:-1,lines:['说起{who}家里年节的车马，她数得出来了几辆，数完才觉出自己记得太清楚。','{who}宫里又来了娘家人，笑声隔着一道墙传过来。她把窗关上，过一会儿又推开了。']},
 '自伤':{c:'y',d:8,expr:'sad',mood:-2,lines:['说起自家，她只用了四个字：门衰祚薄。说完自己先笑了笑，笑得很轻。','她把家里寄来的那封信又读了一遍。信很短，落款只有一个人的名字。','她说宫里人人身后都站着一家子，只有她回头看，是空的。']}
});
NEGX.push('艳羡','自伤');

function familyKinCount(c){
  const h=houseOf(c);if(!h)return 0;
  let n=h.father?.alive?1:0;
  for(const key of Object.keys(h))if(/^brother\d*$/.test(key)&&h[key]&&h[key].alive!==false)n++;
  return n+(h.relatives||[]).filter(p=>p&&p.alive!==false).length;
}
const familyStanding=c=>(c.fam?.p??50)+familyKinCount(c)*8;
function familyHumble(c){const p=c.fam?.p??50;return p<=20||(p<=38&&familyKinCount(c)<=1);}
function familyEnvyKind(c){
  if(c.trait==='淡泊')return null;
  if(['体弱','痴情','沉静'].includes(c.trait)||['爱哭','念旧'].includes(c.t2)||isSolitary(c)||c.mood<40)return 'inward';
  return TRAITS[c.trait]?.jealous||c.trait==='城府'?'sour':'plain';
}
// The consort whose family she cannot help comparing with her own.
function familyEnvyTarget(c){
  const own=familyStanding(c);
  return harem().filter(o=>o!==c&&houseOf(o)&&((o.fam?.p??0)>=70||familyKinCount(o)>=4)&&familyStanding(o)-own>=40)
    .sort((a,b)=>familyStanding(b)-familyStanding(a)||a.id-b.id)[0]||null;
}
function familyEnvyEligible(c){
  return !!c&&inPalace(c)&&!c.maid&&!c.fixedStory&&!!houseOf(c)&&familyHumble(c)&&!!familyEnvyKind(c)&&xinOf(c)==='平和'&&S.turn-(c.familyEnvy?.t??-99)>=24;
}
function familyEnvyWhy(c,o){
  const theirs=familyKinCount(o)>=4?'家中父兄姊妹俱全，逢节车马盈门':`父亲官居${o.fam.t}，门前车马不绝`;
  const kin=familyKinCount(c),ours=kin===0?'已无至亲在世':kin===1?'只剩一位亲人守着旧宅':`不过${c.fam.t}人家，年节也冷清`;
  return familyEnvyKind(c)==='inward'
    ?`见${fullName(o)}${theirs}，自叹门衰祚薄，自家${ours}`
    :`见${fullName(o)}${theirs}，想起自家${ours}`;
}
function familyEnvyBegin(c,o){
  const kind=familyEnvyKind(c);
  c.familyEnvy={t:S.turn,who:o.id,kind};
  setXin(c,kind==='inward'?'自伤':'艳羡',familyEnvyWhy(c,o),o.id);
  if(kind==='sour')c.scheme=clamp(c.scheme+1);
}
// Once a month, one consort at most; more likely around the new year and mid-autumn, when families gather.
function familyEnvyTick(){
  if(!familyEnvyActive())return;
  const odds=(S.month===1||S.month===8?.25:.05)*eventFrequency('heart');
  for(const c of harem()){
    if(!familyEnvyEligible(c))continue;
    const o=familyEnvyTarget(c);if(!o)continue;
    if(chance(odds)){familyEnvyBegin(c,o);return;}
  }
}
function familyEnvyGift(c,line,mood){
  chg({treasury:-20});setXin(c,'释然',mood);story(c,`【门第之叹】${line}`);remember(c,'care','陛下赏了她娘家');
  return fx('国库-20万两',cchg(c,{aff:5,mood:12}));
}
Object.assign(XEV,{
 '自伤':(c,x)=>{const o=byId(x.who);if(!o||!inPalace(o)||c.cold)return null;
  return {title:'门衰祚薄',por:c,text:`${cName(c)}独自坐在窗下，面前摊着一封家书，墨迹已经旧了。见你来，她起身行礼，眼圈有些红。\n“臣妾方才在想，${cName(o)}家里兄弟姊妹一大家子，年节的礼单要念上半个时辰。臣妾家里门衰祚薄，连个替臣妾递句话的人都没有。”\n她顿了顿，又说：“这话不该同陛下讲的。”`,choices:[
   {t:'“你还有朕。”',f:()=>{setXin(c,'感激','陛下说，她还有他');story(c,'【门第之叹】她说自家门衰祚薄，陛下答：你还有朕。这句话她记了很久。');remember(c,'care','陛下说她还有他');return `她怔了一下，低下头去，许久才应了一声“是”。${fx(cchg(c,{aff:8,mood:12}))}`;}},
   {t:'赏她娘家一份年礼（国库-20万两）',cond:()=>E().treasury>=20,why:'国库不足',f:()=>`赏赐送到那天，她家门前头一回停了宫里的车。${familyEnvyGift(c,'陛下赏了她娘家一份年礼，旧宅门前头一回停了宫里的车。','娘家得了陛下的赏，门前也热闹了一回')}`},
   {t:'门第是门第，人是人',f:()=>{story(c,'【门第之叹】陛下说，门第是门第，人是人。她把那封旧家书折好，收了起来。');return `她想了一会儿，把那封旧信折好，收进了匣子。${fx(cchg(c,{mood:5}))}`;}}]};},
 '艳羡':(c,x)=>{const o=byId(x.who);if(!o||!inPalace(o)||c.cold)return null;const sour=c.familyEnvy?.kind==='sour';
  return {title:'别家的热闹',por:c,cast:[c,o],text:`${cName(o)}宫里今日又收了娘家送来的节礼，抬箱的人从长街走过，足足走了一盏茶的工夫。\n${cName(c)}站在自己宫门口看了一会儿，回头对宫女说：“${sour?'人多有什么稀奇，不过是会投胎。':'她家可真热闹。咱们宫里，过年也只摆两副碗筷。'}”`,choices:[
   {t:'陪她用一顿饭（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;renderTop();setXin(c,'欢喜','陛下来陪她用饭，桌上添了一副碗筷');story(c,'【门第之叹】别家节礼盈门那日，陛下来陪她用了一顿饭，桌上添了一副碗筷。');remember(c,'care','陛下陪她用饭');return `桌上添了一副碗筷。她布菜时手有些忙乱，话比平日多了不少。${fx(cchg(c,{aff:6,mood:12}))}`;}},
   {t:'赏她娘家一份节礼（国库-20万两）',cond:()=>E().treasury>=20,why:'国库不足',f:()=>`她听了旨意，先是不信，又问了宫女一遍。${familyEnvyGift(c,'陛下赏了她娘家一份节礼，她先是不信，又问了宫女一遍。','娘家也得了陛下的节礼')}`},
   {t:'由她去',f:()=>{if(sour){relAdd(c,o,-5);c.scheme=clamp(c.scheme+2);story(c,`【门第之叹】${fullName(o)}家的节礼抬过长街，她看了很久，没有人来同她说话。`);return '她看着最后一只箱子抬进门，才转身回去。';}return '她看了一会儿，自己回屋去了。';}}]};}
});
